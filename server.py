#!/usr/bin/env python3
"""Comeketo Agent — local dev server.

Serves the static app AND proxies authenticated calls to OpenAI / Close / ClickUp / Slack
using credentials read from .env at startup. Browser never sees the keys.

Endpoints:
  GET  /api/status                  → { openai, close, clickup, slack } booleans
  POST /api/proxy/openai/v1/responses
  GET  /api/proxy/close/api/v1/...
  GET  /api/proxy/clickup/api/v2/...
  POST /api/proxy/slack/api/...
  (and the corresponding pass-throughs for any method / whitelisted path)

Usage:
  python3 server.py [port]        # default 3422
"""
import base64
import hashlib
import html
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
import uuid
import zipfile
from datetime import datetime, timezone, timedelta
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from xml.etree import ElementTree as ET

HERE = Path(__file__).resolve().parent
AUTO_ROOT = HERE / "Auto"
AUTO_CLIENT_BOXES = AUTO_ROOT / "Client Boxes"
AUTO_STAFF_BOXES = AUTO_ROOT / "Staff Boxes"
AUTO_ORCH_STATE = AUTO_ROOT / "orchestrator" / "state"


def _iso_now():
    return datetime.now(timezone.utc).isoformat()


def _slug_norm(text):
    raw = str(text or "")
    decomp = unicodedata.normalize("NFKD", raw)
    ascii_only = "".join(ch for ch in decomp if ord(ch) < 128)
    low = ascii_only.lower()
    low = re.sub(r"[^a-z0-9]+", "_", low)
    low = re.sub(r"_+", "_", low).strip("_")
    return low or "box"


def _safe_text_read(path, max_chars=400000):
    try:
        txt = path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""
    if len(txt) > max_chars:
        return txt[:max_chars] + "\n\n...[truncated]..."
    return txt


def _extract_last_touches(markdown_text, limit=5):
    txt = str(markdown_text or "")
    lines = []
    for raw in txt.splitlines():
        line = raw.strip()
        if not line:
            continue
        if re.match(r"^[-*]\s+", line):
            line = re.sub(r"^[-*]\s+", "", line).strip()
            if line:
                lines.append(line)
    if not lines:
        for raw in txt.splitlines():
            line = raw.strip()
            if not line:
                continue
            if len(line) < 240:
                lines.append(line)
            if len(lines) >= limit:
                break
    return lines[:max(1, int(limit or 5))]


# Locate CLI agent binaries. Server's PATH is minimal; the login shell has
# the real one. Probe once at startup and cache.
def _find_cli_binary(name, fallback_paths=None):
    direct = shutil.which(name)
    if direct:
        return direct
    try:
        result = subprocess.run(
            ["/bin/zsh", "-l", "-c", f"which {name}"],
            capture_output=True, text=True, timeout=5,
        )
        path = result.stdout.strip().splitlines()[-1] if result.stdout.strip() else ""
        if path and Path(path).exists():
            return path
    except Exception:
        pass
    for candidate in (fallback_paths or []):
        if candidate.exists():
            return str(candidate)
    return None


CLAUDE_BIN = _find_cli_binary("claude", [
    Path.home() / ".claude" / "local" / "claude",
    Path("/opt/homebrew/bin/claude"),
    Path("/usr/local/bin/claude"),
])
CODEX_BIN = _find_cli_binary("codex", [
    Path.home() / ".codex" / "local" / "codex",
    Path("/opt/homebrew/bin/codex"),
    Path("/usr/local/bin/codex"),
])


def _build_codex_prompt(instructions, user_input):
    instructions = (instructions or "").strip()
    user_input = (user_input or "").strip()
    if not instructions:
        return user_input
    return f"System instructions:\n{instructions}\n\nUser request:\n{user_input}"


def _run_codex_exec(prompt, model=None, timeout_s=120, image_paths=None):
    if not CODEX_BIN:
        return ("", "", "codex binary not found")
    output_path = None
    try:
        with tempfile.NamedTemporaryFile(prefix="comeketo-codex-", suffix=".txt", delete=False) as f:
            output_path = f.name
        cmd = [
            CODEX_BIN, "exec",
            "-m", (model or "gpt-5.4-mini"),
            "-C", str(HERE),
            "-s", "read-only",
            "--skip-git-repo-check",
            "--output-last-message", output_path,
        ]
        for path in (image_paths or []):
            if path:
                cmd += ["--image", str(path)]
        cmd.append("-")
        proc = subprocess.run(cmd, input=prompt, capture_output=True, text=True, timeout=timeout_s)
        text = ""
        if output_path and Path(output_path).exists():
            text = Path(output_path).read_text(errors="replace").strip()
        if proc.returncode != 0:
            detail = ((proc.stderr or "") + "\n" + (proc.stdout or "")).strip()
            return ("", detail[-2000:], f"codex exit {proc.returncode}")
        return (text or (proc.stdout or "").strip(), (proc.stderr or "")[-2000:], None)
    except subprocess.TimeoutExpired:
        return ("", "", f"timeout after {timeout_s}s")
    except Exception as e:
        return ("", "", f"{type(e).__name__}: {e}")
    finally:
        if output_path:
            try:
                Path(output_path).unlink(missing_ok=True)
            except Exception:
                pass

_REPORT_LOCKS = {}
_REPORT_LOCKS_GUARD = threading.Lock()
_DELEGATION_DRAFTS_LOCK = threading.Lock()
_GITHUB_MCP_STATUS_CACHE = {"checked_at": 0.0, "status": {"available": False, "detail": "not checked"}}

# MCP tools Comeketo Agent's delegations must never reach for. Claude Code inherits
# the user's global MCP config; this list is passed as --disallowedTools on
# every spawn so out-of-scope servers stay silent. Enumerate each tool: Claude
# Code's flag does not accept a server-prefix wildcard.
_BLOCKED_DELEGATION_TOOLS = [
    # Empty — Comeketo Agent wants Close CRM available to delegations. The
    # admin's job (lead rotation, pipeline audit, KPI scoring) lives inside
    # Close, so Rodbot must be able to read and write there. Add specific
    # MCP tool names here if a future integration needs to be kept out.
]


def _snapshot_delegation_env(cwd):
    # Snapshot the env actually inherited by the subprocess. Log presence and
    # length for secret-looking values; never their content. Captured at spawn
    # so a 2-second-fail post-mortem can disambiguate auth drift vs. pipeline
    # self-correction vs. restart-ritual.
    environ = os.environ
    ak = environ.get("ANTHROPIC_API_KEY", "")
    snap = {
        "cwd": str(cwd),
        "PATH": environ.get("PATH", ""),
        "ANTHROPIC_API_KEY_present": bool(ak),
        "ANTHROPIC_API_KEY_length": len(ak),
        "claude_vars": {k: v for k, v in environ.items() if k.startswith("CLAUDE_")},
        "mcp_vars": {k: v for k, v in environ.items() if "MCP" in k.upper()},
    }
    return snap


def _delegation_timing(spawn_dt, first_token_dt, done_dt):
    def _ms(a, b):
        if a is None or b is None:
            return None
        return int((b - a).total_seconds() * 1000)
    return {
        "spawn_ts": spawn_dt.isoformat() if spawn_dt else None,
        "first_token_ts": first_token_dt.isoformat() if first_token_dt else None,
        "done_ts": done_dt.isoformat() if done_dt else None,
        "spawn_to_first_token_ms": _ms(spawn_dt, first_token_dt),
        "first_token_to_done_ms": _ms(first_token_dt, done_dt),
        "total_ms": _ms(spawn_dt, done_dt),
    }


def _github_mcp_status(force=False):
    now = time.time()
    cached = _GITHUB_MCP_STATUS_CACHE.get("status") or {}
    checked = float(_GITHUB_MCP_STATUS_CACHE.get("checked_at") or 0.0)
    if not force and (now - checked) < 30 and cached:
        return cached
    if not CLAUDE_BIN:
        status = {"available": False, "detail": "claude binary not available"}
        _GITHUB_MCP_STATUS_CACHE["checked_at"] = now
        _GITHUB_MCP_STATUS_CACHE["status"] = status
        return status
    try:
        proc = subprocess.run(
            [CLAUDE_BIN, "mcp", "list"],
            capture_output=True, text=True, timeout=8,
        )
        out = ((proc.stdout or "") + "\n" + (proc.stderr or "")).lower()
        ok = ("github" in out)
        status = {
            "available": bool(ok and proc.returncode == 0),
            "detail": "github mcp configured" if ok and proc.returncode == 0 else "github mcp not detected",
            "raw_head": out[:240],
        }
    except Exception as e:
        status = {"available": False, "detail": f"mcp check failed: {type(e).__name__}: {e}"}
    _GITHUB_MCP_STATUS_CACHE["checked_at"] = now
    _GITHUB_MCP_STATUS_CACHE["status"] = status
    return status


def _run_delegation(request_id, prompt, mode, cwd, result_path, timeout_s, extra_claude_args=None):
    """Background worker: run `claude -p` and write the final result atomically.

    Called from the request handler in a daemon thread so the POST returns
    immediately. Updates result_path on completion (or timeout / error).
    """
    def write_result(obj):
        # Atomic-ish write: write to temp, rename.
        tmp = result_path.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(obj, ensure_ascii=False, indent=2))
        tmp.replace(result_path)

    spawn_dt = datetime.now(timezone.utc)
    env_snapshot = _snapshot_delegation_env(cwd)

    state = {
        "request_id": request_id,
        "status": "running",
        "prompt": prompt,
        "mode": mode,
        "cwd": str(cwd),
        "started_at": spawn_dt.isoformat(),
        "claude_bin": CLAUDE_BIN,
        "env_snapshot": env_snapshot,
        "timing": _delegation_timing(spawn_dt, None, None),
    }
    # Merge onto any initial record the dispatcher wrote (preserves label).
    try:
        if result_path.exists():
            existing = json.loads(result_path.read_text())
            state = {**existing, **state}
    except Exception:
        pass
    # Synchronous spawn-time write so env_snapshot is durable even if the
    # subprocess dies before producing any output (the 2-second-fail case).
    try:
        write_result(state)
    except Exception:
        pass

    # Build the command. `-p` = print mode (one-shot, non-interactive).
    # --output-format json returns a single structured blob for easy parsing.
    cmd = [CLAUDE_BIN, "-p", "--output-format", "json"]
    if isinstance(extra_claude_args, list):
        cmd.extend([str(x) for x in extra_claude_args if x is not None])
    if mode == "trusted":
        # Trusted mode — Claude Code runs tools without prompting. Use only
        # when the prompt is scoped and the caller has confirmed intent.
        cmd += ["--permission-mode", "bypassPermissions"]
    # Scope guard — Comeketo Agent is personal / day-to-day. Block MCP servers that
    # are installed globally but have no business inside this app's delegations.
    # Close CRM was the offender: Claude inherits MCP servers from the user's
    # global config, and without this block it'll happily reach into Close to
    # answer a filesystem task.
    #
    # The `claude` CLI treats `--disallowedTools` as variadic — if we append
    # the prompt as the last positional arg, it gets swallowed as another
    # blocked-tool name and claude reports "no prompt provided." Pipe the
    # prompt via stdin instead.
    for blocked in _BLOCKED_DELEGATION_TOOLS:
        cmd += ["--disallowedTools", blocked]

    first_token_holder = {"ts": None}
    first_token_lock = threading.Lock()

    def _mark_first_token():
        with first_token_lock:
            if first_token_holder["ts"] is None:
                first_token_holder["ts"] = datetime.now(timezone.utc)

    stdout_chunks = []
    stderr_chunks = []

    def _reader(stream, chunks):
        try:
            for line in iter(stream.readline, ""):
                if not line:
                    break
                _mark_first_token()
                chunks.append(line)
        finally:
            try:
                stream.close()
            except Exception:
                pass

    try:
        proc = subprocess.Popen(
            cmd,
            cwd=str(cwd),
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
        )
        try:
            if proc.stdin:
                proc.stdin.write(prompt)
                proc.stdin.close()
        except Exception:
            pass

        th_out = threading.Thread(target=_reader, args=(proc.stdout, stdout_chunks), daemon=True)
        th_err = threading.Thread(target=_reader, args=(proc.stderr, stderr_chunks), daemon=True)
        th_out.start()
        th_err.start()

        timed_out = False
        try:
            proc.wait(timeout=timeout_s)
        except subprocess.TimeoutExpired:
            timed_out = True
            try:
                proc.kill()
            except Exception:
                pass
            try:
                proc.wait(timeout=5)
            except Exception:
                pass
        th_out.join(timeout=2)
        th_err.join(timeout=2)

        done_dt = datetime.now(timezone.utc)
        first_token_dt = first_token_holder["ts"]
        timing = _delegation_timing(spawn_dt, first_token_dt, done_dt)
        result_text = "".join(stdout_chunks)
        stderr_text = "".join(stderr_chunks)

        if timed_out:
            final = {
                **state,
                "status": "timeout",
                "error": f"Claude Code exceeded {timeout_s}s timeout",
                "completed_at": done_dt.isoformat(),
                "stderr": stderr_text[-8000:],
                "timing": timing,
            }
        else:
            parsed = None
            try:
                parsed = json.loads(result_text)
            except Exception:
                pass

            final = {
                **state,
                "status": "done" if proc.returncode == 0 else "failed",
                "exit_code": proc.returncode,
                "completed_at": done_dt.isoformat(),
                "stderr": stderr_text[-8000:],
                "result": parsed,
                "raw_stdout": None if parsed else result_text[-32000:],
                "timing": timing,
            }
            # Extract a human-readable summary. Claude Code's -p --output-format json
            # can return a dict with .result, or an array of stream events where the
            # last type=result entry has .result. Handle both.
            summary = None
            if isinstance(parsed, dict) and "result" in parsed:
                summary = parsed.get("result")
            elif isinstance(parsed, list):
                for ev in reversed(parsed):
                    if isinstance(ev, dict) and ev.get("type") == "result":
                        summary = ev.get("result")
                        break
                if summary is None and parsed:
                    last = parsed[-1]
                    if isinstance(last, dict):
                        summary = last.get("result") or last.get("text") or last.get("content")
            if summary:
                final["summary"] = summary
            elif result_text:
                final["summary"] = result_text[:800]
    except FileNotFoundError:
        done_dt = datetime.now(timezone.utc)
        final = {
            **state,
            "status": "failed",
            "error": "claude binary not found",
            "completed_at": done_dt.isoformat(),
            "timing": _delegation_timing(spawn_dt, first_token_holder["ts"], done_dt),
        }
    except Exception as e:
        done_dt = datetime.now(timezone.utc)
        final = {
            **state,
            "status": "failed",
            "error": f"{type(e).__name__}: {e}",
            "completed_at": done_dt.isoformat(),
            "timing": _delegation_timing(spawn_dt, first_token_holder["ts"], done_dt),
        }

    # Write final result.
    try:
        tmp = result_path.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(final, ensure_ascii=False, indent=2))
        tmp.replace(result_path)
    except Exception as e:
        # Last-ditch: write to a sidecar error file.
        try:
            (result_path.parent / f"{request_id}.err").write_text(str(e))
        except Exception:
            pass


def load_env():
    env = {}
    p = HERE / ".env"
    if not p.exists():
        return env
    for line in p.read_text().splitlines():
        s = line.strip()
        if not s or s.startswith("#"):
            continue
        if "=" not in s:
            continue
        k, v = s.split("=", 1)
        env[k.strip()] = v.strip()
    return env


ENV = load_env()
_MCP_CREDENTIAL_KEYS = {
    "OPENAI_API_KEY": "OpenAI API key",
    "GITHUB_TOKEN": "GitHub token",
    "CLICKUP_API_TOKEN": "ClickUp API token",
    "CLOSE_API_KEY": "Close API key",
}


def _mask_secret(v):
    s = str(v or "").strip()
    if not s:
        return ""
    if len(s) <= 8:
        return "*" * len(s)
    return f"{s[:4]}…{s[-4:]}"


def _save_env_updates(updates):
    p = HERE / ".env"
    current_lines = p.read_text(encoding="utf-8").splitlines() if p.exists() else []
    clean_updates = {}
    for key, val in (updates or {}).items():
        if key not in _MCP_CREDENTIAL_KEYS:
            continue
        sval = str(val or "").replace("\n", "").replace("\r", "").strip()
        clean_updates[key] = sval

    seen = set()
    out_lines = []
    for line in current_lines:
        raw = line.rstrip("\n")
        stripped = raw.strip()
        if not stripped or stripped.startswith("#") or "=" not in raw:
            out_lines.append(raw)
            continue
        key, _ = raw.split("=", 1)
        key = key.strip()
        if key in clean_updates:
            seen.add(key)
            if clean_updates[key]:
                out_lines.append(f"{key}={clean_updates[key]}")
            continue
        out_lines.append(raw)

    for key, val in clean_updates.items():
        if key in seen:
            continue
        if val:
            out_lines.append(f"{key}={val}")

    text = "\n".join(out_lines).rstrip()
    p.write_text((text + "\n") if text else "", encoding="utf-8")

    for key, val in clean_updates.items():
        if val:
            ENV[key] = val
        else:
            ENV.pop(key, None)
            os.environ.pop(key, None)
    for key, val in clean_updates.items():
        if val:
            os.environ[key] = val


def _clickup_get(path):
    """GET a ClickUp API path and return parsed JSON, or None on any failure."""
    token = ENV.get("CLICKUP_API_TOKEN", "").strip()
    if not token:
        return None
    req = urllib.request.Request(f"https://api.clickup.com{path}", method="GET")
    req.add_header("Authorization", token)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read().decode("utf-8"))
    except Exception:
        return None


def _resolve_clickup_default_list():
    """Find a sensible default ClickUp list without asking the user for an id.

    Order of preference:
      1. CLICKUP_LIST_ID in .env (if explicitly set)
      2. A list named 'Comeketo Agent' in the user's space (any folder)
      3. The first folderless list in the space
      4. The first list in the first folder in the space
    Returns (list_id, list_name, source) or (None, None, reason).
    """
    explicit = ENV.get("CLICKUP_LIST_ID", "").strip()
    if explicit:
        return explicit, None, ".env CLICKUP_LIST_ID"

    space_id = ENV.get("CLICKUP_SPACE_ID", "").strip()
    if not space_id:
        return None, None, "no CLICKUP_SPACE_ID in .env"

    # Gather all candidate lists: folderless + folder-scoped.
    candidates = []  # list of (id, name, where)
    folderless = _clickup_get(f"/api/v2/space/{space_id}/list?archived=false")
    if folderless and isinstance(folderless.get("lists"), list):
        for lst in folderless["lists"]:
            candidates.append((str(lst.get("id")), lst.get("name"), "folderless"))
    folders = _clickup_get(f"/api/v2/space/{space_id}/folder?archived=false")
    if folders and isinstance(folders.get("folders"), list):
        for folder in folders["folders"]:
            for lst in folder.get("lists", []) or []:
                candidates.append((str(lst.get("id")), lst.get("name"), f"folder:{folder.get('name')}"))

    if not candidates:
        return None, None, f"no lists found in space {space_id}"

    # Prefer a list named Comeketo Agent (case-insensitive). Otherwise first candidate.
    for lid, name, where in candidates:
        if name and name.strip().lower() == "secretary":
            return lid, name, where
    first = candidates[0]
    return first[0], first[1], first[2]


# Resolve once at import; the app can force a refresh via /api/clickup/rescan.
_CLICKUP_DEFAULT = {"list_id": None, "list_name": None, "source": None}


def resolve_and_cache_clickup():
    lid, name, src = _resolve_clickup_default_list()
    _CLICKUP_DEFAULT["list_id"] = lid
    _CLICKUP_DEFAULT["list_name"] = name
    _CLICKUP_DEFAULT["source"] = src
    return _CLICKUP_DEFAULT


def _twilio_basic():
    """Basic auth pair for Twilio REST. Prefer API Key (SK...) + secret because
    it's revocable without rotating the whole account. Falls back to Account
    SID + Auth Token if the API Key pair isn't present."""
    sid = ENV.get("TWILIO_API_KEY_SID", "").strip()
    sec = ENV.get("TWILIO_API_KEY_SECRET", "").strip()
    if not (sid and sec):
        sid = ENV.get("TWILIO_ACCOUNT_SID", "").strip()
        sec = ENV.get("TWILIO_AUTH_TOKEN", "").strip()
    return base64.b64encode(f"{sid}:{sec}".encode()).decode()


# ────── Pieces LTM (pieces.app) — local MCP server ──────────────────────
# Pieces runs locally on the team's machine and tracks every app/browser he uses:
# workstream summaries (AI TLDRs of sessions), workstream events (captures with
# extracted text/URLs/people), and a queryable LTM. We talk to it over MCP
# streamable-HTTP. A single long-lived session is cached server-side; on any
# error we re-initialize transparently.
PIECES_MCP_URL = os.environ.get("PIECES_MCP_URL", "http://localhost:39300/model_context_protocol/2025-03-26/mcp")
_PIECES = {"session_id": None, "lock": threading.Lock()}

def _pieces_rpc(body, retry=True):
    """Send one JSON-RPC to Pieces. Re-initialize on session loss."""
    sid = _PIECES["session_id"]
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
    }
    if sid:
        headers["mcp-session-id"] = str(sid)
    req = urllib.request.Request(
        PIECES_MCP_URL,
        data=json.dumps(body).encode(),
        headers=headers,
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            raw = resp.read().decode("utf-8", "replace")
            new_sid = resp.headers.get("mcp-session-id")
            if new_sid and not sid:
                _PIECES["session_id"] = new_sid
            if not raw:
                return None
            # Streamable-HTTP may respond with plain JSON or SSE. The Pieces
            # implementation returns plain JSON for POST; handle SSE defensively.
            if raw.startswith("event:") or raw.startswith("data:"):
                for line in raw.splitlines():
                    if line.startswith("data:"):
                        return json.loads(line[5:].strip())
                return None
            return json.loads(raw)
    except urllib.error.HTTPError as e:
        # Likely session expired — re-initialize once.
        if retry and e.code in (400, 401, 404):
            _PIECES["session_id"] = None
            _pieces_init(force=True)
            return _pieces_rpc(body, retry=False)
        raise

def _pieces_init(force=False):
    with _PIECES["lock"]:
        if _PIECES["session_id"] and not force:
            return True
        _PIECES["session_id"] = None
        try:
            resp = _pieces_rpc({
                "jsonrpc": "2.0", "id": 1, "method": "initialize",
                "params": {
                    "protocolVersion": "2025-03-26",
                    "capabilities": {},
                    "clientInfo": {"name": "comeketo-agent-server", "version": "1.0"},
                },
            }, retry=False)
            # Fire the required initialized notification.
            _pieces_rpc({"jsonrpc": "2.0", "method": "notifications/initialized"}, retry=False)
            return resp is not None
        except Exception:
            _PIECES["session_id"] = None
            return False

def _pieces_available():
    if not _PIECES["session_id"]:
        _pieces_init()
    return bool(_PIECES["session_id"])


def _close_basic():
    """Close CRM uses HTTP Basic with api_key : (empty) — per Close's docs.
    Single source of truth for the credential; referenced by the proxy entry."""
    key = ENV.get("CLOSE_API_KEY", "").strip()
    return base64.b64encode((key + ":").encode()).decode()


UPSTREAMS = {
    "openai": {
        "base": "https://api.openai.com",
        "auth": lambda: {"Authorization": f"Bearer {ENV.get('OPENAI_API_KEY', '').strip()}"},
        "whitelist": ["/v1/responses", "/v1/models", "/v1/chat/completions"],
    },
    "close": {
        "base": "https://api.close.com",
        "auth": lambda: {"Authorization": f"Basic {_close_basic()}"},
        "whitelist": ["/api/v1/"],
    },
    "twilio": {
        "base": "https://api.twilio.com",
        "auth": lambda: {"Authorization": f"Basic {_twilio_basic()}"},
        "whitelist": ["/2010-04-01/"],
    },
    "clickup": {
        "base": "https://api.clickup.com",
        "auth": lambda: {"Authorization": ENV.get("CLICKUP_API_TOKEN", "").strip()},
        "whitelist": ["/api/v2/"],
    },
    "slack": {
        "base": "https://slack.com",
        "auth": lambda: {"Authorization": f"Bearer {ENV.get('SLACK_BOT_TOKEN', '').strip()}"},
        "whitelist": ["/api/"],
    },
}


class Handler(SimpleHTTPRequestHandler):
    # CORS for any API call.
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type,Authorization")

    def _api_path(self):
        """Path without ?query; trailing slash removed so routes match consistently."""
        p = (self.path or "/").split("?", 1)[0]
        if len(p) > 1 and p.endswith("/"):
            p = p.rstrip("/")
        return p

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path in ("", "/", "/?"):
            self.path = "/Secretary.html"
        p = self._api_path()
        if p == "/api/status":
            github_mcp = _github_mcp_status()
            return self._json({
                "openai":  bool(ENV.get("OPENAI_API_KEY")),
                "close":   bool(ENV.get("CLOSE_API_KEY")),
                "clickup": bool(ENV.get("CLICKUP_API_TOKEN")),
                "slack":   bool(ENV.get("SLACK_BOT_TOKEN")),
                "twilio":  bool(ENV.get("TWILIO_ACCOUNT_SID") and (ENV.get("TWILIO_API_KEY_SECRET") or ENV.get("TWILIO_AUTH_TOKEN"))),
                "twilio_whatsapp_from": ENV.get("TWILIO_WHATSAPP_FROM"),
                "pieces":  _pieces_available(),
                "pieces_url": PIECES_MCP_URL,
                "slack_note": ("App-level token (xapp-) detected — Web API calls need an xoxb- Bot User OAuth Token."
                               if ENV.get("SLACK_BOT_TOKEN", "").startswith("xapp-") else None),
                # Auto-resolved ClickUp default list — the app uses this as the send target
                # whenever the user doesn't specify one. No need to paste a list id anywhere.
                "clickup_list_id":     _CLICKUP_DEFAULT["list_id"],
                "clickup_list_name":   _CLICKUP_DEFAULT["list_name"],
                "clickup_list_source": _CLICKUP_DEFAULT["source"],
                "claude_code_available": bool(CLAUDE_BIN),
                "claude_code_path": CLAUDE_BIN,
                "codex_cli_available": bool(CODEX_BIN),
                "codex_cli_path": CODEX_BIN,
                "github_mcp": github_mcp,
                "delegation_targets": {
                    "general": {
                        "available": True,
                        "detail": "General Claude Code delegation (no connector gate).",
                        "requires_approval_for_write": False,
                    },
                    "github": {
                        "available": bool(github_mcp.get("available")),
                        "detail": github_mcp.get("detail") or "",
                        "requires_approval_for_write": True,
                    },
                    "clickup": {
                        "available": bool(ENV.get("CLICKUP_API_TOKEN")),
                        "detail": ("Connected via CLICKUP_API_TOKEN." if ENV.get("CLICKUP_API_TOKEN") else "Missing CLICKUP_API_TOKEN."),
                        "requires_approval_for_write": True,
                    },
                    "close": {
                        "available": bool(ENV.get("CLOSE_API_KEY")),
                        "detail": ("Connected via CLOSE_API_KEY." if ENV.get("CLOSE_API_KEY") else "Missing CLOSE_API_KEY."),
                        "requires_approval_for_write": True,
                    },
                    "claude_code": {
                        "available": bool(CLAUDE_BIN),
                        "detail": (f"Binary at {CLAUDE_BIN}" if CLAUDE_BIN else "Claude Code binary not found on PATH."),
                        "requires_approval_for_write": True,
                    },
                    "codex_cli": {
                        "available": bool(CODEX_BIN),
                        "detail": (f"Binary at {CODEX_BIN}" if CODEX_BIN else "Codex binary not found on PATH."),
                        "requires_approval_for_write": True,
                    },
                    "cursor": {
                        "available": bool(CLAUDE_BIN),
                        "detail": "Routes through the Claude Code subprocess with cursor-oriented prompt instructions.",
                        "requires_approval_for_write": True,
                    },
                },
                # Absolute paths so the browser-side AI can't hallucinate write targets.
                "workspace_root": str(HERE),
                "bedrock_root":   str(HERE / "CCAgentindex"),
            })
        if p == "/api/settings/mcp_credentials":
            return self._settings_mcp_credentials()
        if p == "/api/boxes/list":
            return self._boxes_list()
        m_box = re.fullmatch(r"/api/boxes/([A-Za-z0-9_\-]+)", p or "")
        if m_box:
            return self._boxes_get(m_box.group(1))
        m_box_html = re.fullmatch(r"/api/boxes/([A-Za-z0-9_\-]+)/html", p or "")
        if m_box_html:
            return self._boxes_html(m_box_html.group(1))
        m_box_template = re.fullmatch(r"/api/boxes/([A-Za-z0-9_\-]+)/template/([A-Za-z0-9_\-]+)", p or "")
        if m_box_template:
            return self._boxes_template_html(m_box_template.group(1), m_box_template.group(2))
        if p == "/api/clickup/rescan":
            # Re-resolve on demand (e.g. after user renames a list in ClickUp).
            result = resolve_and_cache_clickup()
            return self._json(result)
        if p == "/api/briefings":
            return self._briefings_list()
        if p.startswith("/api/briefings/"):
            slug = p[len("/api/briefings/"):]
            return self._briefing_read(slug)
        if p == "/api/intelligence/conversation/latest":
            return self._conversation_intelligence_latest()
        if p == "/api/analytics/owner_stage":
            return self._owner_stage_latest()
        if p == "/api/agents":
            return self._agents_list()
        if p == "/api/pieces/status":
            return self._pieces_status()
        if p.startswith("/api/pieces/ask"):
            return self._pieces_ask_get()
        if p == "/api/pieces/sweeps/latest":
            return self._pieces_sweeps_latest()
        if p == "/api/pieces/sweeps":
            return self._pieces_sweeps_list()
        if p == "/api/delegate":
            return self._delegate_list()
        if p == "/api/delegations/drafts":
            return self._delegation_drafts_list()
        if p.startswith("/api/delegate/"):
            rid = p[len("/api/delegate/"):]
            return self._delegate_read(rid)
        if p.startswith("/api/browser_use/jobs/"):
            job_id = p[len("/api/browser_use/jobs/"):]
            return self._browser_use_job_get(job_id)
        if p.startswith("/api/ledger/"):
            # GET /api/ledger/<name>  → read the named ledger
            name = p.split("/", 3)[3]
            return self._ledger_read(name)
        if p == "/api/accomplishments":
            return self._accomplishments_list()
        if p.startswith("/api/accomplishments/"):
            slug = p[len("/api/accomplishments/"):]
            return self._accomplishments_read(slug)
        if p == "/api/streak":
            return self._streak_read()
        if p == "/api/grid_affinity":
            return self._grid_affinity_read()
        if p == "/api/workflows/list":
            return self._workflows_list()
        if p.startswith("/api/workflows/get"):
            return self._workflow_get()
        if p == "/api/catalog/edges/list":
            return self._catalog_edges_list()
        if p.startswith("/api/catalog/edges/get"):
            return self._catalog_edge_get()
        if p == "/api/triggers/list":
            return self._triggers_list()
        if p == "/api/agent_plans/list":
            return self._agent_plans_list()
        if p.startswith("/api/agent_plans/get"):
            return self._agent_plan_get()
        if p == "/api/state/snapshot":
            return self._state_snapshot()
        if p == "/api/hooks/snapshot":
            return self._hooks_snapshot()
        if p.startswith("/annotations/"):
            return self._annotation_serve()
        if p == "/api/reports/list":
            return self._reports_list()
        if p == "/api/reports/get":
            return self._reports_get()
        if p.startswith("/api/proxy/"):
            return self._proxy()
        return super().do_GET()

    # ────── Inbox: local-bedrock append-only log ────────────────────────
    # Writes go to CCAgentindex/_inbox/inbox.jsonl
    # Demo-mode does NOT block these — demo is about outbound vendor writes,
    # not local note-taking. Local writes are always allowed.

    # ────── Daily briefings — produced by the scheduled Oracle Sweep ────
    # Read-only surface for the app. Files live at
    # CCAgentindex/summaries/daily_briefings/YYYY-MM-DD.md

    def _briefings_dir(self):
        return HERE / "CCAgentindex" / "summaries" / "daily_briefings"

    def _briefings_list(self):
        d = self._briefings_dir()
        if not d.exists():
            return self._json({"briefings": [], "count": 0, "latest": None})
        # Sort by mtime descending — newest briefing first regardless of naming
        # schema. Previously we sorted by name reverse, which broke ordering
        # once both `YYYY-MM-DD.md` and `briefing_YYYY-MM-DD.md` showed up.
        paths = [p for p in d.iterdir() if p.suffix == ".md" and p.name != "README.md"]
        paths.sort(key=lambda p: p.stat().st_mtime, reverse=True)
        entries = []
        for p in paths:
            entries.append({
                "name": p.name,
                "slug": p.stem,  # filename without .md — used as the URL path
                "mtime": p.stat().st_mtime,
            })
        latest = entries[0]["name"] if entries else None
        # Back-compat: older clients expect `briefings` as a list of filenames.
        return self._json({
            "briefings": [e["name"] for e in entries],
            "entries":   entries,
            "count":     len(entries),
            "latest":    latest,
        })

    def _briefing_read(self, slug):
        import re
        # Safety: allow only filename-safe chars. Reject slashes and dots
        # (except the final `.md`, which we add ourselves). Up to 120 chars.
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_\-]{0,119}(?:\.md)?", slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        if slug.endswith(".md"):
            slug = slug[:-3]
        p = self._briefings_dir() / f"{slug}.md"
        # Defense in depth — resolve and ensure the path stays inside the
        # briefings dir so a crafted slug can't escape via `..`.
        try:
            resolved = p.resolve()
            if not str(resolved).startswith(str(self._briefings_dir().resolve())):
                return self._json({"ok": False, "error": "bad slug"}, code=400)
        except Exception:
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        if not p.exists():
            return self._json({"ok": False, "error": "not found", "slug": slug}, code=404)
        stat = p.stat()
        return self._json({
            "ok":    True,
            "slug":  slug,
            "body":  p.read_text(encoding="utf-8"),
            "mtime": stat.st_mtime,
        })

    # ────── Conversation Intelligence — Analytics page feed ──────────────
    # Reads the newest YYYY-MM-DD.json under
    # CCAgentindex/intelligence/sales/conversation/ (written by
    # build_conversation_intelligence.py) and returns its parsed payload.
    # Sibling .md is fetched directly by the static file server.
    def _conversation_intelligence_dir(self):
        return HERE / "CCAgentindex" / "intelligence" / "sales" / "conversation"

    def _conversation_intelligence_latest(self):
        d = self._conversation_intelligence_dir()
        if not d.exists():
            return self._json({"ok": False, "error": "directory missing", "slug": None})
        files = sorted(
            [p for p in d.glob("*.json") if not p.name.startswith(".")],
            key=lambda p: p.name,
            reverse=True,
        )
        if not files:
            return self._json({"ok": False, "error": "no conversation intelligence runs yet", "slug": None})
        latest = files[0]
        try:
            payload = json.loads(latest.read_text(encoding="utf-8"))
        except Exception as e:
            return self._json({"ok": False, "error": f"parse error: {e}", "slug": latest.stem}, code=500)
        return self._json({
            "ok":      True,
            "slug":    latest.stem,
            "mtime":   latest.stat().st_mtime,
            "payload": payload,
        })

    # ────── Owner & Stage Dashboards: synthesizes JSON from build_owner_stage_dashboards.py output ─────
    # The build script emits markdown only (`<date>/owner_overview.md`, `<date>/stage_overview.md`,
    # `<date>/by_owner/<owner>/dashboard.md`, `<date>/by_stage/<pipeline>/<stage>/dashboard.md`).
    # This endpoint walks the latest dated run and parses those markdown files into structured JSON
    # for the AnalyticsScreen `OwnerStagePanel`. No JSON sidecar is written to bedrock — the markdown
    # output of the build script remains the source of truth, parsed on every read.
    # Pattern established 2026-04-30; reusable for future build_*.py → AnalyticsScreen integrations.
    def _owner_stage_dir(self):
        return HERE / "CCAgentindex" / "intelligence" / "sales" / "owner_stage"

    def _owner_stage_latest(self):
        import re
        base = self._owner_stage_dir()
        if not base.exists():
            return self._json({"ok": False, "error": "directory missing", "latest_date": None})
        date_dirs = sorted(
            [p for p in base.iterdir() if p.is_dir() and re.match(r"^\d{4}-\d{2}-\d{2}$", p.name)],
            key=lambda p: p.name,
            reverse=True,
        )
        if not date_dirs:
            return self._json({"ok": False, "error": "no dated runs yet", "latest_date": None})
        latest = date_dirs[0]

        out = {
            "ok": True,
            "latest_date": latest.name,
            "owners": [],
            "stages": [],
            "owner_count": 0,
            "stage_count": 0,
            "lead_count": 0,
            "mtime": None,
        }

        # The top-level sibling summary `<date>.md` carries both owner totals and
        # stage records WITH the `(active)/(lead_only)` kind annotation. The files
        # inside `<date>/owner_overview.md` and `<date>/stage_overview.md` have
        # different formats and DON'T carry the kind. Use the summary file.
        summary = base / f"{latest.name}.md"
        if summary.exists():
            text = summary.read_text(encoding="utf-8")
            # Owner Overview: `- andre_raw: 28 leads (active 12 / won 0 / lost 0 / lead-only 16)`
            ov_section = re.search(r"## Owner Overview\s*\n(.+?)(?=\n## |\Z)", text, re.DOTALL)
            if ov_section:
                for line in ov_section.group(1).splitlines():
                    m = re.match(
                        r"^- (\S+):\s*(\d+)\s*leads?\s*\(active\s*(\d+)\s*/\s*won\s*(\d+)\s*/\s*lost\s*(\d+)\s*/\s*lead-only\s*(\d+)\)",
                        line,
                    )
                    if m:
                        out["owners"].append({
                            "slug": m.group(1),
                            "leads": int(m.group(2)),
                            "active": int(m.group(3)),
                            "won": int(m.group(4)),
                            "lost": int(m.group(5)),
                            "lead_only": int(m.group(6)),
                            "stage_breakdown": [],
                            "leads_detail": [],
                            "latest_activity": "",
                        })
            # Stage Overview: `- Comeketo Sales / cold_no_response_portuguese_misfire (lead_only): 3 leads across 1 owners`
            sv_section = re.search(r"## Stage Overview\s*\n(.+?)(?=\n## |\Z)", text, re.DOTALL)
            if sv_section:
                for line in sv_section.group(1).splitlines():
                    m = re.match(
                        r"^- (.+?)\s*/\s*(\S+)\s*\((\w+)\):\s*(\d+)\s*leads?\s*across\s*(\d+)\s*owners?",
                        line,
                    )
                    if m:
                        out["stages"].append({
                            "pipeline": m.group(1).strip(),
                            "stage": m.group(2).strip(),
                            "kind": m.group(3).strip(),
                            "lead_count": int(m.group(4)),
                            "owner_count": int(m.group(5)),
                        })

        # Fallback: if summary didn't yield owners, parse the inner owner_overview.md
        # which uses `|` separators (`- andre_raw: 28 leads | active 12 | won 0 | lost 0 | lead-only 16`)
        if not out["owners"]:
            ov_inner = latest / "owner_overview.md"
            if ov_inner.exists():
                for line in ov_inner.read_text(encoding="utf-8").splitlines():
                    m = re.match(
                        r"^- (\S+):\s*(\d+)\s*leads?\s*\|\s*active\s*(\d+)\s*\|\s*won\s*(\d+)\s*\|\s*lost\s*(\d+)\s*\|\s*lead-only\s*(\d+)",
                        line,
                    )
                    if m:
                        out["owners"].append({
                            "slug": m.group(1),
                            "leads": int(m.group(2)),
                            "active": int(m.group(3)),
                            "won": int(m.group(4)),
                            "lost": int(m.group(5)),
                            "lead_only": int(m.group(6)),
                            "stage_breakdown": [],
                            "leads_detail": [],
                            "latest_activity": "",
                        })

        # Fallback: if summary didn't yield stages, walk `<date>/by_stage/<pipeline>/<kind>__<stage>/`
        # — kind is encoded as the directory-name prefix (`active__` or `lead_only__`).
        if not out["stages"]:
            by_stage = latest / "by_stage"
            if by_stage.exists():
                for pipeline_dir in sorted(by_stage.iterdir()):
                    if not pipeline_dir.is_dir():
                        continue
                    pipeline_label = pipeline_dir.name.replace("_", " ").title()
                    for stage_dir in sorted(pipeline_dir.iterdir()):
                        if not stage_dir.is_dir():
                            continue
                        name = stage_dir.name
                        kind = "active" if name.startswith("active__") else ("lead_only" if name.startswith("lead_only__") else "unknown")
                        stage_slug = name.split("__", 1)[1] if "__" in name else name
                        # Lead count: try to read the dashboard.md and extract a count
                        lead_count = 0
                        owner_count = 1
                        dash = stage_dir / "dashboard.md"
                        if dash.exists():
                            txt = dash.read_text(encoding="utf-8")
                            mc = re.search(r"^- Leads:\s*`?(\d+)`?", txt, re.MULTILINE)
                            if mc:
                                lead_count = int(mc.group(1))
                        out["stages"].append({
                            "pipeline": pipeline_label,
                            "stage": stage_slug,
                            "kind": kind,
                            "lead_count": lead_count,
                            "owner_count": owner_count,
                        })

        # by_owner/<slug>/dashboard.md  →  enrich owner records
        by_owner = latest / "by_owner"
        if by_owner.exists():
            for owner_dir in sorted(by_owner.iterdir()):
                if not owner_dir.is_dir():
                    continue
                slug = owner_dir.name
                dashboard = owner_dir / "dashboard.md"
                if not dashboard.exists():
                    continue
                text = dashboard.read_text(encoding="utf-8")

                # Find or create the owner record
                rec = next((o for o in out["owners"] if o["slug"] == slug), None)
                if not rec:
                    rec = {
                        "slug": slug, "leads": 0, "active": 0, "won": 0, "lost": 0,
                        "lead_only": 0, "stage_breakdown": [], "leads_detail": [],
                        "latest_activity": "",
                    }
                    out["owners"].append(rec)

                # Latest Observed Activity
                m = re.search(r"^- Latest Observed Activity:\s*`?([^`\n]+?)`?\s*$", text, re.MULTILINE)
                if m:
                    rec["latest_activity"] = m.group(1).strip(" `")

                # Stage Breakdown section
                sb = re.search(r"## Stage Breakdown\s*\n(.+?)(?=\n## |\Z)", text, re.DOTALL)
                if sb:
                    for line in sb.group(1).splitlines():
                        m2 = re.match(r"^- (.+?)\s*/\s*(\S+):\s*(\d+)", line)
                        if m2:
                            rec["stage_breakdown"].append({
                                "pipeline": m2.group(1).strip(),
                                "stage": m2.group(2).strip(),
                                "count": int(m2.group(3)),
                            })

                # Leads section: each line is `- \`<activity>\` | <name> | <pipeline> / <stage> | <urgency> | <action>`
                ld = re.search(r"## Leads\s*\n(.+?)(?=\n## |\Z)", text, re.DOTALL)
                if ld:
                    for line in ld.group(1).splitlines():
                        m3 = re.match(
                            r"^- `([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*(.+?)\s*/\s*(\S+?)\s*\|\s*(\w+)\s*\|\s*(.+?)$",
                            line,
                        )
                        if m3:
                            rec["leads_detail"].append({
                                "activity": m3.group(1).strip(),
                                "name": m3.group(2).strip(),
                                "pipeline": m3.group(3).strip(),
                                "stage": m3.group(4).strip(),
                                "urgency": m3.group(5).strip(),
                                "action": m3.group(6).strip(),
                            })

        out["owner_count"] = len(out["owners"])
        out["stage_count"] = len(out["stages"])
        out["lead_count"] = sum(o["leads"] for o in out["owners"]) or sum(s["lead_count"] for s in out["stages"])
        try:
            out["mtime"] = (latest / "owner_overview.md").stat().st_mtime
        except Exception:
            out["mtime"] = None
        return self._json(out)

    # ────── Accomplishments: daily rollups for the calendar/streak UI ─────
    # Files at CCAgentindex/summaries/accomplishments/YYYY-MM-DD.json
    # The browser computes these from the ledger and POSTs them here so the
    # AI has a stable traceable artifact for each day.
    def _accomplishments_dir(self):
        return HERE / "CCAgentindex" / "summaries" / "accomplishments"

    def _accomplishments_list(self):
        d = self._accomplishments_dir()
        if not d.exists():
            return self._json({"days": [], "count": 0})
        files = sorted([p.stem for p in d.glob("*.json")], reverse=True)
        return self._json({"days": files, "count": len(files)})

    def _accomplishments_read(self, slug):
        import re
        m = re.match(r"^(\d{4}-\d{2}-\d{2})$", slug)
        if not m:
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        p = self._accomplishments_dir() / f"{m.group(1)}.json"
        if not p.exists():
            return self._json({"ok": False, "error": "not found", "slug": m.group(1)}, code=404)
        try:
            return self._json({"ok": True, "slug": m.group(1), "rollup": json.loads(p.read_text(encoding="utf-8"))})
        except Exception as e:
            return self._json({"ok": False, "error": str(e)}, code=500)

    def _accomplishments_write(self, slug, body):
        import re
        m = re.match(r"^(\d{4}-\d{2}-\d{2})$", slug)
        if not m:
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        d = self._accomplishments_dir()
        d.mkdir(parents=True, exist_ok=True)
        p = d / f"{m.group(1)}.json"
        p.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return self._json({"ok": True, "slug": m.group(1), "path": str(p.relative_to(HERE))})

    # ────── Streak snapshot: single file the AI can read as ambient context ─
    def _streak_path(self):
        return HERE / "CCAgentindex" / "summaries" / "streak.json"

    def _streak_read(self):
        p = self._streak_path()
        if not p.exists():
            return self._json({"ok": True, "snapshot": None})
        try:
            return self._json({"ok": True, "snapshot": json.loads(p.read_text(encoding="utf-8"))})
        except Exception as e:
            return self._json({"ok": False, "error": str(e)}, code=500)

    # ────── Grid affinity — learned weights for seed selection ─────────
    # Computed client-side from the activity ledger, persisted here so the
    # next app load / generation starts from the current learning state.
    def _grid_affinity_path(self):
        return HERE / "CCAgentindex" / "summaries" / "grid_affinity.json"

    def _grid_affinity_read(self):
        p = self._grid_affinity_path()
        if not p.exists():
            return self._json({"ok": True, "affinity": None})
        try:
            return self._json({"ok": True, "affinity": json.loads(p.read_text(encoding="utf-8"))})
        except Exception as e:
            return self._json({"ok": False, "error": str(e)}, code=500)

    def _grid_affinity_write(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        p = self._grid_affinity_path()
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return self._json({"ok": True})

    def _streak_write(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        p = self._streak_path()
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        return self._json({"ok": True})

    # ────── Attachments: images dropped into chat ─────────────────────────
    # Saved to CCAgentindex/_inbox/attachments/<YYYY-MM-DD>/<uuid>.<ext>
    # and served back via the static file handler the base class provides.
    # Upload format is JSON: {filename, mime, data_base64, size}. Multipart
    # would be purer but browsers give us base64 for free from drag/drop +
    # FileReader, and JSON stays consistent with the rest of the API.
    def _attachment_upload(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        filename = (payload.get("filename") or "file").strip()
        mime     = (payload.get("mime") or "application/octet-stream").strip()
        data64   = (payload.get("data_base64") or "").strip()
        if not data64:
            return self._json({"ok": False, "error": "missing data_base64"}, code=400)
        # Strip data URL prefix if present.
        m = re.match(r"^data:([^;]+);base64,(.*)$", data64, re.DOTALL)
        if m:
            mime = m.group(1) or mime
            data64 = m.group(2)
        try:
            raw = base64.b64decode(data64, validate=False)
        except Exception as e:
            return self._json({"ok": False, "error": f"bad base64: {e}"}, code=400)
        if len(raw) > 25 * 1024 * 1024:
            return self._json({"ok": False, "error": "file too large (25MB max)"}, code=413)

        ext_map = {
            "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg",
            "image/gif": "gif", "image/webp": "webp", "image/svg+xml": "svg",
            "image/heic": "heic", "image/heif": "heif",
            "application/pdf": "pdf",
        }
        # Prefer mime-derived ext; fall back to what the filename suggested.
        ext = ext_map.get(mime)
        if not ext:
            dot = filename.rfind(".")
            ext = filename[dot+1:].lower() if dot >= 0 else "bin"
        # Strip any path components from filename — safety.
        safe_stem = re.sub(r"[^a-zA-Z0-9._-]", "_", filename.rsplit("/", 1)[-1].rsplit(".", 1)[0])[:40] or "file"
        day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        uid = uuid.uuid4().hex[:10]

        rel_dir  = Path("CCAgentindex") / "_inbox" / "attachments" / day
        abs_dir  = HERE / rel_dir
        abs_dir.mkdir(parents=True, exist_ok=True)
        name     = f"{safe_stem}_{uid}.{ext}"
        abs_path = abs_dir / name
        abs_path.write_bytes(raw)

        url = "/" + str(rel_dir / name).replace("\\", "/")
        return self._json({
            "ok": True,
            "filename": name,
            "original_filename": filename,
            "mime": mime,
            "size": len(raw),
            "path": str(abs_path),
            "url":  url,
        })

    def do_POST(self):    return self._api_or_404()
    def do_PUT(self):     return self._api_or_404()
    def do_DELETE(self):  return self._api_or_404()
    def do_PATCH(self):   return self._api_or_404()

    # ────── Workflows: Automation Graph persistence ─────────────────────
    # Files at CCAgentindex/workflows/<slug>.json
    # Save appends an automation_workflow_save ledger entry.
    def _workflows_dir(self):
        return HERE / "CCAgentindex" / "workflows"

    def _slug_ok(self, slug):
        if not slug or not isinstance(slug, str): return False
        if "/" in slug or "\\" in slug or ".." in slug: return False
        if len(slug) > 120: return False
        # Alphanumerics, underscore, hyphen.
        return all(c.isalnum() or c in "-_" for c in slug)

    def _workflow_save(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        slug = (payload.get("slug") or "").strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        raw = payload.get("json")
        # Accept either a pre-stringified workflow JSON or an object.
        if isinstance(raw, str):
            try:
                parsed = json.loads(raw)
            except Exception as e:
                return self._json({"ok": False, "error": f"bad workflow json: {e}"}, code=400)
        elif isinstance(raw, dict):
            parsed = raw
        else:
            # Fall back to the payload itself being the workflow object (minus slug/name).
            parsed = {k: v for k, v in payload.items() if k not in ("slug",)}
        if not isinstance(parsed, dict):
            return self._json({"ok": False, "error": "workflow must be an object"}, code=400)

        # Stamp updated_at and ensure metadata exists.
        meta = parsed.get("metadata") or {}
        now_iso = datetime.now(timezone.utc).isoformat()
        meta["last_saved"] = now_iso
        meta.setdefault("created_at", meta.get("created_at") or now_iso)
        parsed["metadata"] = meta
        # Preserve id/name if client sent them alongside.
        if payload.get("name") and not parsed.get("name"):
            parsed["name"] = payload["name"]
        if payload.get("workflow_id") and not parsed.get("id"):
            parsed["id"] = payload["workflow_id"]

        d = self._workflows_dir()
        try:
            d.mkdir(parents=True, exist_ok=True)
            path = d / f"{slug}.json"
            # Atomic-ish write via temp file.
            tmp = d / f".{slug}.json.tmp"
            tmp.write_text(json.dumps(parsed, indent=2, ensure_ascii=False), encoding="utf-8")
            tmp.replace(path)
        except Exception as e:
            return self._json({"ok": False, "error": f"write failed: {e}"}, code=500)

        # Append ledger entry (best-effort).
        try:
            ledger = HERE / "CCAgentindex" / "_ledger" / "activity.jsonl"
            ledger.parent.mkdir(parents=True, exist_ok=True)
            entry = {
                "ts": now_iso,
                "kind": "automation_workflow_save",
                "actor": "ui",
                "slug": slug,
                "workflow_id": parsed.get("id"),
                "name": parsed.get("name"),
                "nodes": len(parsed.get("nodes") or []),
                "connections": len(parsed.get("connections") or []),
                "path": f"workflows/{slug}.json",
            }
            with ledger.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception:
            pass

        rel = f"CCAgentindex/workflows/{slug}.json"
        return self._json({
            "ok": True,
            "slug": slug,
            "path": rel,
            "saved_at": now_iso,
            "nodes": len(parsed.get("nodes") or []),
            "connections": len(parsed.get("connections") or []),
        })

    def _workflows_list(self):
        d = self._workflows_dir()
        out = []
        if d.exists():
            for p in sorted(d.glob("*.json")):
                try:
                    data = json.loads(p.read_text(encoding="utf-8"))
                    meta = data.get("metadata") or {}
                    stat = p.stat()
                    mtime = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat()
                    out.append({
                        "slug":         p.stem,
                        "name":         data.get("name") or p.stem,
                        "id":           data.get("id"),
                        "nodes":        len(data.get("nodes") or []),
                        "connections":  len(data.get("connections") or []),
                        "updated_at":   meta.get("last_saved") or mtime,
                        "created_at":   meta.get("created_at"),
                    })
                except Exception:
                    out.append({"slug": p.stem, "name": p.stem, "_parse_error": True})
        return self._json({"ok": True, "items": out, "count": len(out)})

    def _workflow_get(self):
        # Query-string param: /api/workflows/get?slug=X
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        slug = (qs.get("slug") or [""])[0].strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        path = self._workflows_dir() / f"{slug}.json"
        if not path.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            return self._json({"ok": False, "error": f"parse failed: {e}"}, code=500)
        return self._json({"ok": True, "slug": slug, "workflow": data})

    # ────── Catalog: reusable edge/node patterns ────────────────────────
    # Files at CCAgentindex/catalog/edges/<slug>.json  (Phase 1 B)
    # and CCAgentindex/catalog/nodes/<slug>.json       (Phase 2)
    # Each catalog entry carries the patterned payload + a running usage_count.
    # Slugs follow verb_noun / adjective_noun convention — enforced client-side
    # with soft validation; server accepts any _slug_ok() string.
    def _catalog_dir(self, kind):
        return HERE / "CCAgentindex" / "catalog" / kind

    def _catalog_edge_save(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        slug = (payload.get("slug") or "").strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        kind = (payload.get("kind") or "data").strip()
        if kind not in ("data", "reference", "trigger", "conditional"):
            return self._json({"ok": False, "error": f"unknown edge kind: {kind}"}, code=400)
        d = self._catalog_dir("edges")
        path = d / f"{slug}.json"
        now_iso = datetime.now(timezone.utc).isoformat()
        # If the entry exists, preserve created_at + usage_count; treat save as update.
        prior = {}
        if path.exists():
            try:
                prior = json.loads(path.read_text(encoding="utf-8")) or {}
            except Exception:
                prior = {}
        entry = {
            "schema": "comeketo.catalog.edge.v1",
            "slug": slug,
            "name": (payload.get("name") or slug).strip(),
            "kind": kind,
            "label": payload.get("label") or "",
            "notes": payload.get("notes") or "",
            "created_at": prior.get("created_at") or now_iso,
            "last_modified": now_iso,
            "usage_count": int(prior.get("usage_count") or 0),
        }
        for k in ("transform", "filter", "readPattern", "rateLimit", "debounce",
                  "condition", "falsePathTarget", "eventName"):
            if payload.get(k) not in (None, ""):
                entry[k] = payload[k]
        # Carry annotations forward — catalog entries can ship with Notes/refs.
        if isinstance(payload.get("annotations"), list):
            entry["annotations"] = payload["annotations"]
        try:
            d.mkdir(parents=True, exist_ok=True)
            tmp = d / f".{slug}.json.tmp"
            tmp.write_text(json.dumps(entry, indent=2, ensure_ascii=False), encoding="utf-8")
            tmp.replace(path)
        except Exception as e:
            return self._json({"ok": False, "error": f"write failed: {e}"}, code=500)
        # Register in index.json under catalog_edges (idempotent).
        self._register_in_index("catalog_edges", f"catalog/edges/{slug}.json")
        # Append ledger.
        try:
            ledger = HERE / "CCAgentindex" / "_ledger" / "activity.jsonl"
            ledger.parent.mkdir(parents=True, exist_ok=True)
            with ledger.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps({
                    "ts": now_iso, "kind": "catalog_edge_save", "actor": "ui",
                    "slug": slug, "edge_kind": kind, "path": f"catalog/edges/{slug}.json",
                    "updated": bool(prior),
                }, ensure_ascii=False) + "\n")
        except Exception:
            pass
        return self._json({"ok": True, "slug": slug, "path": f"CCAgentindex/catalog/edges/{slug}.json", "entry": entry})

    def _catalog_edges_list(self):
        d = self._catalog_dir("edges")
        out = []
        if d.exists():
            for p in sorted(d.glob("*.json")):
                try:
                    data = json.loads(p.read_text(encoding="utf-8"))
                    out.append({
                        "slug": p.stem,
                        "name": data.get("name") or p.stem,
                        "kind": data.get("kind") or "data",
                        "label": data.get("label") or "",
                        "usage_count": int(data.get("usage_count") or 0),
                        "last_modified": data.get("last_modified"),
                    })
                except Exception:
                    out.append({"slug": p.stem, "_parse_error": True})
        return self._json({"ok": True, "items": out, "count": len(out)})

    def _catalog_edge_get(self):
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        slug = (qs.get("slug") or [""])[0].strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        path = self._catalog_dir("edges") / f"{slug}.json"
        if not path.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            return self._json({"ok": False, "error": f"parse failed: {e}"}, code=500)
        return self._json({"ok": True, "slug": slug, "entry": data})

    def _catalog_edge_delete(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        slug = (payload.get("slug") or "").strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        path = self._catalog_dir("edges") / f"{slug}.json"
        if not path.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            path.unlink()
        except Exception as e:
            return self._json({"ok": False, "error": f"delete failed: {e}"}, code=500)
        now_iso = datetime.now(timezone.utc).isoformat()
        try:
            ledger = HERE / "CCAgentindex" / "_ledger" / "activity.jsonl"
            with ledger.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps({
                    "ts": now_iso, "kind": "catalog_edge_delete", "actor": "ui",
                    "slug": slug, "path": f"catalog/edges/{slug}.json",
                }, ensure_ascii=False) + "\n")
        except Exception:
            pass
        return self._json({"ok": True, "slug": slug})

    def _catalog_edge_bump_usage(self, body):
        """POST {slug} → increments usage_count and stamps last_used_at."""
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        slug = (payload.get("slug") or "").strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        path = self._catalog_dir("edges") / f"{slug}.json"
        if not path.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            data["usage_count"] = int(data.get("usage_count") or 0) + 1
            data["last_used_at"] = datetime.now(timezone.utc).isoformat()
            tmp = path.with_suffix(".json.tmp")
            tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
            tmp.replace(path)
        except Exception as e:
            return self._json({"ok": False, "error": f"write failed: {e}"}, code=500)
        return self._json({"ok": True, "slug": slug, "usage_count": data["usage_count"]})

    # ────── Triggers: cron / watch / webhook / rule / ribbon ────────────
    # Files at CCAgentindex/triggers/<slug>.json. Each trigger carries its
    # kind, label, enabled flag, tone, and a kind-specific payload field
    # (cron expression, watch path, webhook endpoint, rule pattern, ribbon
    # pattern). Save → atomic write + index registration + ledger append.
    def _triggers_dir(self):
        return HERE / "CCAgentindex" / "triggers"

    _TRIGGER_KINDS = ("cron", "watch", "webhook", "rule", "ribbon")
    _TRIGGER_TONES = ("mint", "peach", "lavender", "sky", "lemon", "rose", "sage", "blush")

    def _trigger_save(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        slug = (payload.get("slug") or "").strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        kind = (payload.get("kind") or "").strip()
        if kind not in self._TRIGGER_KINDS:
            return self._json({"ok": False, "error": f"unknown trigger kind: {kind}"}, code=400)
        tone = (payload.get("tone") or "sage").strip()
        if tone not in self._TRIGGER_TONES:
            tone = "sage"

        d = self._triggers_dir()
        path = d / f"{slug}.json"
        now_iso = datetime.now(timezone.utc).isoformat()
        # Preserve created_at if entry exists; treat save as upsert.
        prior = {}
        if path.exists():
            try:
                prior = json.loads(path.read_text(encoding="utf-8")) or {}
            except Exception:
                prior = {}
        entry = {
            "schema": "comeketo.trigger.v1",
            "slug": slug,
            "kind": kind,
            "label": (payload.get("label") or slug).strip(),
            "enabled": bool(payload.get("enabled", True)),
            "tone": tone,
            "notes": payload.get("notes") or "",
            "created_at": prior.get("created_at") or now_iso,
            "last_modified": now_iso,
        }
        # Kind-specific payload — accept only the field that matches the kind,
        # so a "watch" can't smuggle in a cron expression.
        kind_field = {
            "cron":    "cron",
            "watch":   "path",
            "webhook": "endpoint",
            "rule":    "pattern",
            "ribbon":  "pattern",
        }[kind]
        if payload.get(kind_field) not in (None, ""):
            entry[kind_field] = payload[kind_field]
        # Optional extras that are useful for any kind.
        for k in ("description", "tz", "debounce_ms"):
            if payload.get(k) not in (None, ""):
                entry[k] = payload[k]
        # Workflow linkage — every trigger may optionally name the workflow it
        # fires. Validated lazily here (slug-shape only); the UI lists
        # available workflows so cross-references stay honest.
        wf_slug = (payload.get("workflow_slug") or "").strip()
        if wf_slug and self._slug_ok(wf_slug):
            entry["workflow_slug"] = wf_slug
        # Per-kind extras that the UI composers send. Only the fields
        # appropriate to this kind are stored.
        kind_extras = {
            "cron":    ("preset",),
            "watch":   ("recursive",),
            "webhook": ("service", "auth"),
            "rule":    ("pattern_type", "filter"),
            "ribbon":  ("source",),
        }.get(kind, ())
        for k in kind_extras:
            v = payload.get(k)
            if v not in (None, ""):
                entry[k] = v

        try:
            d.mkdir(parents=True, exist_ok=True)
            tmp = d / f".{slug}.json.tmp"
            tmp.write_text(json.dumps(entry, indent=2, ensure_ascii=False), encoding="utf-8")
            tmp.replace(path)
        except Exception as e:
            return self._json({"ok": False, "error": f"write failed: {e}"}, code=500)

        rel = f"triggers/{slug}.json"
        self._register_in_index("triggers", rel)
        # Ledger entry — distinguish create vs. update so the audit trail is honest.
        try:
            ledger = HERE / "CCAgentindex" / "_ledger" / "activity.jsonl"
            ledger.parent.mkdir(parents=True, exist_ok=True)
            with ledger.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps({
                    "ts": now_iso,
                    "kind": "trigger_save" if prior else "trigger_create",
                    "actor": "ui",
                    "slug": slug,
                    "trigger_kind": kind,
                    "enabled": entry["enabled"],
                    "path": rel,
                }, ensure_ascii=False) + "\n")
        except Exception:
            pass

        return self._json({"ok": True, "slug": slug, "path": rel, "trigger": entry})

    def _triggers_list(self):
        d = self._triggers_dir()
        out = []
        if d.exists():
            for p in sorted(d.glob("*.json")):
                try:
                    data = json.loads(p.read_text(encoding="utf-8"))
                    # Surface every relevant field — the UI decides what to render.
                    out.append({
                        "slug": p.stem,
                        "kind": data.get("kind") or "cron",
                        "label": data.get("label") or p.stem,
                        "enabled": bool(data.get("enabled", True)),
                        "tone": data.get("tone") or "sage",
                        "notes": data.get("notes") or "",
                        "cron": data.get("cron"),
                        "path": data.get("path"),
                        "endpoint": data.get("endpoint"),
                        "pattern": data.get("pattern"),
                        "tz": data.get("tz"),
                        "debounce_ms": data.get("debounce_ms"),
                        # Workflow linkage and per-kind extras (Apr 2026 polish)
                        "workflow_slug": data.get("workflow_slug"),
                        "preset": data.get("preset"),
                        "recursive": data.get("recursive"),
                        "service": data.get("service"),
                        "auth": data.get("auth"),
                        "pattern_type": data.get("pattern_type"),
                        "filter": data.get("filter"),
                        "source": data.get("source"),
                        "last_modified": data.get("last_modified"),
                    })
                except Exception:
                    out.append({"slug": p.stem, "_parse_error": True})
        return self._json({"ok": True, "items": out, "count": len(out)})

    def _trigger_delete(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        slug = (payload.get("slug") or "").strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        path = self._triggers_dir() / f"{slug}.json"
        if not path.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            path.unlink()
        except Exception as e:
            return self._json({"ok": False, "error": f"delete failed: {e}"}, code=500)
        rel = f"triggers/{slug}.json"
        self._unregister_from_index("triggers", rel)
        try:
            ledger = HERE / "CCAgentindex" / "_ledger" / "activity.jsonl"
            with ledger.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps({
                    "ts": datetime.now(timezone.utc).isoformat(),
                    "kind": "trigger_delete",
                    "actor": "ui",
                    "slug": slug,
                    "path": rel,
                }, ensure_ascii=False) + "\n")
        except Exception:
            pass
        return self._json({"ok": True, "slug": slug})

    # ────── Agent plans: sub-agent fanout planner persistence ──────────
    # Files at CCAgentindex/agent_plans/<slug>.json. Each plan is an
    # executable description of an orchestrator → N sub-agents → merge
    # fanout, with budgets and per-SA config (tool, prompt template,
    # retries, timeout, expected latency). Distinct from the descriptive
    # `agents/<slug>/agents.md` specs — those are markdown documentation,
    # these are the JSON the planner UI reads/writes.
    def _agent_plans_dir(self):
        return HERE / "CCAgentindex" / "agent_plans"

    _AGENT_PLAN_TONES = ("mint", "peach", "lavender", "sky", "lemon", "rose", "sage", "blush")

    def _agent_plan_save(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        slug = (payload.get("slug") or "").strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)

        # Accept either a fully-formed plan object on `plan` or the payload
        # itself as the plan (schema-by-example: match what _workflow_save does).
        raw = payload.get("plan")
        if isinstance(raw, str):
            try:
                parsed = json.loads(raw)
            except Exception as e:
                return self._json({"ok": False, "error": f"bad plan json: {e}"}, code=400)
        elif isinstance(raw, dict):
            parsed = raw
        else:
            parsed = {k: v for k, v in payload.items() if k not in ("slug",)}
        if not isinstance(parsed, dict):
            return self._json({"ok": False, "error": "plan must be an object"}, code=400)

        # Stamp metadata; preserve created_at if file exists.
        d = self._agent_plans_dir()
        path = d / f"{slug}.json"
        prior = {}
        if path.exists():
            try:
                prior = json.loads(path.read_text(encoding="utf-8")) or {}
            except Exception:
                prior = {}
        meta = parsed.get("metadata") or {}
        now_iso = datetime.now(timezone.utc).isoformat()
        meta["last_modified"] = now_iso
        prior_meta = prior.get("metadata") or {}
        meta.setdefault("created_at", prior_meta.get("created_at") or meta.get("created_at") or now_iso)
        # Version: first write = 1, every subsequent save bumps by 1.
        if prior:
            meta["version"] = int(prior_meta.get("version") or 0) + 1
        else:
            meta["version"] = int(meta.get("version") or 1)
        parsed["metadata"] = meta
        parsed.setdefault("schema", "comeketo.agent_plan.v1")
        parsed.setdefault("slug", slug)

        # Tone scrub on sub_agents — defaults to sage if unknown.
        for sa in parsed.get("sub_agents") or []:
            if isinstance(sa, dict):
                t = sa.get("tone")
                if t not in self._AGENT_PLAN_TONES:
                    sa["tone"] = "sage"

        try:
            d.mkdir(parents=True, exist_ok=True)
            tmp = d / f".{slug}.json.tmp"
            tmp.write_text(json.dumps(parsed, indent=2, ensure_ascii=False), encoding="utf-8")
            tmp.replace(path)
        except Exception as e:
            return self._json({"ok": False, "error": f"write failed: {e}"}, code=500)

        rel = f"agent_plans/{slug}.json"
        self._register_in_index("agent_plans", rel)
        try:
            ledger = HERE / "CCAgentindex" / "_ledger" / "activity.jsonl"
            ledger.parent.mkdir(parents=True, exist_ok=True)
            with ledger.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps({
                    "ts": now_iso,
                    "kind": "agent_plan_save" if prior else "agent_plan_create",
                    "actor": "ui",
                    "slug": slug,
                    "name": parsed.get("name"),
                    "sub_agents": len(parsed.get("sub_agents") or []),
                    "version": meta.get("version"),
                    "path": rel,
                }, ensure_ascii=False) + "\n")
        except Exception:
            pass

        return self._json({"ok": True, "slug": slug, "path": rel, "plan": parsed})

    def _agent_plans_list(self):
        d = self._agent_plans_dir()
        out = []
        if d.exists():
            for p in sorted(d.glob("*.json")):
                try:
                    data = json.loads(p.read_text(encoding="utf-8"))
                    meta = data.get("metadata") or {}
                    out.append({
                        "slug": p.stem,
                        "name": data.get("name") or p.stem,
                        "description": data.get("description") or "",
                        "sub_agents": len(data.get("sub_agents") or []),
                        "version": int(meta.get("version") or 1),
                        "last_modified": meta.get("last_modified"),
                    })
                except Exception:
                    out.append({"slug": p.stem, "_parse_error": True})
        return self._json({"ok": True, "items": out, "count": len(out)})

    def _agent_plan_get(self):
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        slug = (qs.get("slug") or [""])[0].strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        path = self._agent_plans_dir() / f"{slug}.json"
        if not path.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            return self._json({"ok": False, "error": f"parse failed: {e}"}, code=500)
        return self._json({"ok": True, "slug": slug, "plan": data})

    def _agent_plan_delete(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        slug = (payload.get("slug") or "").strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        path = self._agent_plans_dir() / f"{slug}.json"
        if not path.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            path.unlink()
        except Exception as e:
            return self._json({"ok": False, "error": f"delete failed: {e}"}, code=500)
        rel = f"agent_plans/{slug}.json"
        self._unregister_from_index("agent_plans", rel)
        try:
            ledger = HERE / "CCAgentindex" / "_ledger" / "activity.jsonl"
            with ledger.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps({
                    "ts": datetime.now(timezone.utc).isoformat(),
                    "kind": "agent_plan_delete",
                    "actor": "ui",
                    "slug": slug,
                    "path": rel,
                }, ensure_ascii=False) + "\n")
        except Exception:
            pass
        return self._json({"ok": True, "slug": slug})

    # ────── Agent state snapshot: read-only observation of Rodbot ──────
    # Reads CCAgentindex/_ledger/activity.jsonl, classifies each event into
    # one of 7 states (idle / planning / tool_call / tool_await / reflect /
    # blocked / shipped), and returns aggregates over a configurable window.
    # The State sub-tab polls this every 5s. Server-side aggregation keeps
    # the client thin and avoids shipping the full ledger over the wire.

    # Mapping rules — each is a substring-match heuristic against event["kind"].
    # First match wins; tested top-to-bottom. "kind" strings come from the
    # various ledger writers across the app (workflow saves, trigger CRUD,
    # agent plan ops, delegation lifecycle, chat reflections, etc.).
    _STATE_RULES = [
        # blocked — explicit failure / auth / error words
        ("blocked",   ["blocked", "failed", "error", "denied", "rejected", "auth_fail"]),
        # shipped — explicit completion / sent / done words
        ("shipped",   ["sent", "completed", "shipped", "delivered", "done", "closed"]),
        # reflect — reflection / ledger / activity-summary kinds
        ("reflect",   ["reflect", "reflection", "summary", "audit", "review"]),
        # tool_await — read / search / fetch / list / wait
        ("tool_await",["search", "fetch", "read", "list", "get", "poll", "wait", "await"]),
        # tool_call — outbound action verbs
        ("tool_call", ["dispatch", "send", "call", "fire", "post", "ping", "trigger", "delegation_write", "delegation"]),
        # planning — create / save / update / write / plan / draft
        ("planning",  ["create", "save", "update", "write", "plan", "draft", "modified", "edit", "delete", "configure"]),
    ]

    def _classify_event_state(self, event):
        """Return one of: idle / planning / tool_call / tool_await / reflect / blocked / shipped."""
        kind = (event.get("kind") or "").lower()
        if not kind:
            return "idle"
        for state, needles in self._STATE_RULES:
            for n in needles:
                if n in kind:
                    return state
        return "idle"

    def _state_snapshot(self):
        """GET /api/state/snapshot?window=1h|24h|7d — aggregated state observation."""
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        window = (qs.get("window") or ["24h"])[0].strip()
        # Window → seconds
        WINDOW_SECONDS = {"15m": 900, "1h": 3600, "6h": 21600, "24h": 86400, "7d": 604800, "30d": 2592000}
        if window not in WINDOW_SECONDS:
            window = "24h"  # normalize unknown values so the client always sees a valid label
        window_s = WINDOW_SECONDS[window]
        now_dt = datetime.now(timezone.utc)
        cutoff_dt = now_dt - timedelta(seconds=window_s)

        ledger = HERE / "CCAgentindex" / "_ledger" / "activity.jsonl"
        events_in_window = []
        last_event = None
        if ledger.exists():
            try:
                for raw in ledger.read_text(encoding="utf-8").splitlines():
                    s = raw.strip()
                    if not s:
                        continue
                    try:
                        ev = json.loads(s)
                    except Exception:
                        continue
                    ts_str = ev.get("ts") or ev.get("t") or ""
                    if not ts_str:
                        continue
                    # Parse the timestamp; tolerate the various ISO formats in the ledger.
                    try:
                        ts_norm = ts_str.replace("Z", "+00:00")
                        ev_dt = datetime.fromisoformat(ts_norm)
                        if ev_dt.tzinfo is None:
                            ev_dt = ev_dt.replace(tzinfo=timezone.utc)
                    except Exception:
                        continue
                    last_event = ev  # we keep walking — last in file is freshest
                    if ev_dt < cutoff_dt:
                        continue
                    ev["_state"] = self._classify_event_state(ev)
                    ev["_dt"] = ev_dt.isoformat()
                    events_in_window.append(ev)
            except Exception:
                pass

        # Time-in-state — count events per state, normalize to percentages.
        # We don't have real durations; counts are the most honest proxy.
        bucket = {}
        for ev in events_in_window:
            st = ev.get("_state") or "idle"
            bucket[st] = bucket.get(st, 0) + 1
        total = sum(bucket.values()) or 1
        time_in_state_pct = {k: round((v / total) * 100, 1) for k, v in bucket.items()}

        # Current state — implied by the most recent event in the window.
        # Within ~30s of "now", we believe the implied state. Otherwise idle.
        current_state = "idle"
        recent_events = []
        if events_in_window:
            tail = events_in_window[-25:]
            recent_events = [
                {
                    "ts": ev.get("_dt") or ev.get("ts"),
                    "kind": ev.get("kind"),
                    "state": ev.get("_state") or "idle",
                    "actor": ev.get("actor"),
                    "slug": ev.get("slug") or ev.get("name") or ev.get("target") or ev.get("path"),
                    "preview": ev.get("notes") or ev.get("description") or "",
                }
                for ev in tail
            ]
            # Heat-decay: only mark "currently in X" if the latest event is fresh.
            try:
                latest_dt = datetime.fromisoformat((tail[-1]["_dt"] or "").replace("Z", "+00:00"))
                if latest_dt.tzinfo is None:
                    latest_dt = latest_dt.replace(tzinfo=timezone.utc)
                age_s = (now_dt - latest_dt).total_seconds()
                current_state = tail[-1]["_state"] if age_s < 90 else "idle"
            except Exception:
                current_state = "idle"

        # Active-context derivation — pull the most recent plan/workflow save
        # for a "what was just being worked on" hint.
        active_context = None
        for ev in reversed(events_in_window):
            k = (ev.get("kind") or "").lower()
            if k in ("agent_plan_save", "agent_plan_create"):
                active_context = {
                    "kind": "agent_plan",
                    "name": ev.get("name"),
                    "slug": ev.get("slug"),
                    "sub_agents": ev.get("sub_agents"),
                    "version": ev.get("version"),
                    "ts": ev.get("ts"),
                }
                break
            if k == "automation_workflow_save":
                active_context = {
                    "kind": "workflow",
                    "name": ev.get("name"),
                    "slug": ev.get("slug"),
                    "nodes": ev.get("nodes"),
                    "connections": ev.get("connections"),
                    "ts": ev.get("ts"),
                }
                break

        return self._json({
            "ok": True,
            "window": window,
            "window_start": cutoff_dt.isoformat(),
            "window_end": now_dt.isoformat(),
            "current_state": current_state,
            "time_in_state": time_in_state_pct,
            "event_count": len(events_in_window),
            "recent_events": recent_events,
            "active_context": active_context,
        })

    # ────── Hooks: pre / post / on / cron observation surface ──────────
    # Hook catalog is code-defined (NOT user-configurable per Apr 2026
    # "no-forms" directive). User-controlled state — the on/paused flag
    # for each hook — lives in CCAgentindex/hooks/state.json keyed by
    # hook_id. The Hooks sub-tab reads /api/hooks/snapshot which returns
    # config + current state + perf aggregation from the activity ledger.

    # Canonical hook catalog. Stage = where in a request lifecycle it fires.
    # expected_p50_ms / expected_p95_ms are DECLARED budgets (not measured)
    # — they let the UI show what each hook is supposed to take. err_kind
    # is a list of substring matches against ledger event["kind"] to count
    # real errors attributable to this hook class.
    _HOOK_CATALOG = [
        # PRE — run before the main handler
        {"id": "authn.check",     "stage": "pre",         "label": "authn.check",     "description": "verify request authenticated",                "expected_p50_ms": 1,    "expected_p95_ms": 3,    "err_kinds": []},
        {"id": "budget.gate",     "stage": "pre",         "label": "budget.gate",     "description": "stops if tokens > cap or wallclock exceeded", "expected_p50_ms": 2,    "expected_p95_ms": 5,    "err_kinds": ["budget_exceeded"]},
        {"id": "observe.snap",    "stage": "pre",         "label": "observe.snap",    "description": "writes raw input → _state/raw/",              "expected_p50_ms": 12,   "expected_p95_ms": 31,   "err_kinds": []},
        {"id": "slug.validate",   "stage": "pre",         "label": "slug.validate",   "description": "verifies slug well-formed, rejects bad input", "expected_p50_ms": 1,    "expected_p95_ms": 2,    "err_kinds": ["bad_slug"]},
        # RUN — the main handler (always implicit, shown for context)
        {"id": "handler",         "stage": "run",         "label": "handler",         "description": "the actual request handler",                  "expected_p50_ms": 18,   "expected_p95_ms": 120,  "err_kinds": []},
        # POST — run after the main handler
        {"id": "infer",           "stage": "post",        "label": "infer",           "description": "promotes Observed → Inferred",                "expected_p50_ms": 88,   "expected_p95_ms": 240,  "err_kinds": []},
        {"id": "trace.write",     "stage": "post",        "label": "trace.write",     "description": "appends a trace line to _ledger/",            "expected_p50_ms": 4,    "expected_p95_ms": 9,    "err_kinds": []},
        {"id": "index.register",  "stage": "post",        "label": "index.register",  "description": "registers new file in indexes/index.json",    "expected_p50_ms": 6,    "expected_p95_ms": 18,   "err_kinds": []},
        # ON-BLOCKED — fires when a request fails or is blocked
        {"id": "notify.slack",    "stage": "on-blocked",  "label": "notify.slack",    "description": "human-in-loop ping when work blocks",         "expected_p50_ms": 142,  "expected_p95_ms": 410,  "err_kinds": []},
        # ON-DRAFT — fires when a draft is queued for human review
        {"id": "sylvia.ribbon",   "stage": "on-draft",    "label": "sylvia.ribbon",   "description": "surfaces draft for review on the home page",  "expected_p50_ms": 22,   "expected_p95_ms": 45,   "err_kinds": []},
        # CRON — scheduled hooks
        {"id": "morning.sweep",   "stage": "cron",        "label": "morning.sweep",   "description": "06:45 daily — bedrock sweep + grid render",   "expected_p50_ms": 1800, "expected_p95_ms": 4200, "err_kinds": []},
        {"id": "memory.consolidate","stage": "cron",       "label": "memory.consolidate","description": "12:00 daily — memory cluster pass",          "expected_p50_ms": 800,  "expected_p95_ms": 2100, "err_kinds": []},
    ]
    _HOOK_DEFAULT_PAUSED = {"sylvia.ribbon"}  # paused by default to match deck

    def _hooks_dir(self):
        return HERE / "CCAgentindex" / "hooks"

    def _hooks_state_path(self):
        return self._hooks_dir() / "state.json"

    def _hooks_state_load(self):
        """Returns { hook_id: bool_enabled }. Falls back to defaults on missing/parse."""
        defaults = {h["id"]: (h["id"] not in self._HOOK_DEFAULT_PAUSED) for h in self._HOOK_CATALOG}
        p = self._hooks_state_path()
        if not p.exists():
            return defaults
        try:
            on_disk = json.loads(p.read_text(encoding="utf-8")) or {}
            # Merge — disk values win, but unknown hooks fall back to defaults.
            return {**defaults, **{k: bool(v) for k, v in on_disk.items() if k in defaults}}
        except Exception:
            return defaults

    def _hooks_state_save(self, state):
        d = self._hooks_dir()
        d.mkdir(parents=True, exist_ok=True)
        path = self._hooks_state_path()
        tmp = d / ".state.json.tmp"
        tmp.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")
        tmp.replace(path)

    def _hook_toggle(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        hid = (payload.get("id") or "").strip()
        catalog_ids = {h["id"] for h in self._HOOK_CATALOG}
        if hid not in catalog_ids:
            return self._json({"ok": False, "error": f"unknown hook: {hid}"}, code=400)
        state = self._hooks_state_load()
        # If a target enabled value is supplied, use it; else flip current.
        if "enabled" in payload:
            state[hid] = bool(payload["enabled"])
        else:
            state[hid] = not bool(state.get(hid, True))
        try:
            self._hooks_state_save(state)
        except Exception as e:
            return self._json({"ok": False, "error": f"write failed: {e}"}, code=500)
        # Ledger
        try:
            ledger = HERE / "CCAgentindex" / "_ledger" / "activity.jsonl"
            ledger.parent.mkdir(parents=True, exist_ok=True)
            with ledger.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps({
                    "ts": datetime.now(timezone.utc).isoformat(),
                    "kind": "hook_toggle",
                    "actor": "ui",
                    "hook_id": hid,
                    "enabled": state[hid],
                }, ensure_ascii=False) + "\n")
        except Exception:
            pass
        return self._json({"ok": True, "id": hid, "enabled": state[hid]})

    def _hooks_snapshot(self):
        """GET /api/hooks/snapshot?window=1h|24h|7d — full hooks observation."""
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        window = (qs.get("window") or ["24h"])[0].strip()
        WINDOW_SECONDS = {"15m": 900, "1h": 3600, "6h": 21600, "24h": 86400, "7d": 604800}
        if window not in WINDOW_SECONDS:
            window = "24h"
        window_s = WINDOW_SECONDS[window]
        now_dt = datetime.now(timezone.utc)
        cutoff_dt = now_dt - timedelta(seconds=window_s)

        # Walk the ledger once. Build:
        #  - fire counts per hook (roughly: any save/create event implies the
        #    full PRE→RUN→POST chain fired — count each)
        #  - error counts per hook (substring match on the err_kinds list)
        #  - latest event for the request-timeline preview
        ledger = HERE / "CCAgentindex" / "_ledger" / "activity.jsonl"
        fire_counts = {h["id"]: 0 for h in self._HOOK_CATALOG}
        err_counts = {h["id"]: 0 for h in self._HOOK_CATALOG}
        latest_request = None
        if ledger.exists():
            try:
                for raw in ledger.read_text(encoding="utf-8").splitlines():
                    s = raw.strip()
                    if not s:
                        continue
                    try:
                        ev = json.loads(s)
                    except Exception:
                        continue
                    ts_str = ev.get("ts") or ev.get("t") or ""
                    if not ts_str:
                        continue
                    try:
                        ev_dt = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                        if ev_dt.tzinfo is None:
                            ev_dt = ev_dt.replace(tzinfo=timezone.utc)
                    except Exception:
                        continue
                    if ev_dt < cutoff_dt:
                        continue
                    kind = (ev.get("kind") or "").lower()
                    # Latest "real" request — anything that looks like a save/create/etc.
                    if any(v in kind for v in ("save", "create", "delete", "modified", "write", "send", "dispatch", "fire")):
                        latest_request = ev
                    # Fire counts: every event in window counts as one fire of
                    # the canonical PRE/RUN/POST chain. Hooks scoped to certain
                    # stages still count per event.
                    for h in self._HOOK_CATALOG:
                        # CRON hooks only "fire" on cron events
                        if h["stage"] == "cron":
                            if h["id"] in kind or "cron" in kind:
                                fire_counts[h["id"]] += 1
                        # ON-BLOCKED — only when something errored / blocked
                        elif h["stage"] == "on-blocked":
                            if any(b in kind for b in ("blocked", "failed", "error", "denied")):
                                fire_counts[h["id"]] += 1
                        # ON-DRAFT — only when a draft event landed
                        elif h["stage"] == "on-draft":
                            if "draft" in kind:
                                fire_counts[h["id"]] += 1
                        else:
                            # PRE / RUN / POST run on every request
                            fire_counts[h["id"]] += 1
                    # Errors per hook
                    for h in self._HOOK_CATALOG:
                        for needle in h.get("err_kinds", []):
                            if needle in kind:
                                err_counts[h["id"]] += 1
            except Exception:
                pass

        # Build the request-preview timeline. For the latest request, render
        # the canonical 8-step flow (PRE×3, RUN, POST×2 or ×3, ON if blocked,
        # ON-DRAFT if drafted). Offsets cumulate the declared p50 budgets.
        request_preview = None
        if latest_request:
            kind = (latest_request.get("kind") or "").lower()
            blocked = any(b in kind for b in ("blocked", "failed", "error"))
            drafted = "draft" in kind
            chain = ["authn.check", "budget.gate", "observe.snap", "handler", "infer", "trace.write"]
            if blocked: chain.append("notify.slack")
            if drafted: chain.append("sylvia.ribbon")
            cat_by_id = {h["id"]: h for h in self._HOOK_CATALOG}
            steps = []
            elapsed = 0
            for hid in chain:
                h = cat_by_id.get(hid)
                if not h:
                    continue
                steps.append({
                    "id": h["id"],
                    "stage": h["stage"],
                    "label": h["label"],
                    "offset_ms": elapsed,
                    "duration_ms": h["expected_p50_ms"],
                    "blocked": blocked and h["id"] == "notify.slack",
                })
                elapsed += h["expected_p50_ms"]
            ts = latest_request.get("ts", "")
            try:
                clock = ts.split("T", 1)[1].split(".", 1)[0] if "T" in ts else ""
            except Exception:
                clock = ""
            request_preview = {
                "kind": latest_request.get("kind"),
                "slug": latest_request.get("slug") or latest_request.get("name") or latest_request.get("path"),
                "ts": ts,
                "clock": clock,
                "blocked": blocked,
                "drafted": drafted,
                "total_ms": elapsed,
                "steps": steps,
            }

        # Combine catalog + state + perf for the response.
        state = self._hooks_state_load()
        hooks_out = []
        for h in self._HOOK_CATALOG:
            hooks_out.append({
                **h,
                "enabled": bool(state.get(h["id"], True)),
                "fires": fire_counts.get(h["id"], 0),
                "errors": err_counts.get(h["id"], 0),
            })

        return self._json({
            "ok": True,
            "window": window,
            "window_start": cutoff_dt.isoformat(),
            "window_end": now_dt.isoformat(),
            "hooks": hooks_out,
            "request_preview": request_preview,
        })

    # ────── Annotations: content-addressed image store ──────────────────
    # Files at CCAgentindex/annotations/<sha256>.png + <sha256>.json sidecar.
    # Sidecar holds regions (normalized 0-1 coords), original mime, size.
    # Content-addressed so identical uploads collapse to the same file.
    def _annotations_dir(self):
        return HERE / "CCAgentindex" / "annotations"

    def _annotations_upload(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        import base64, hashlib, re as _re
        raw = payload.get("image_base64") or ""
        # Accept data-URL or raw base64.
        m = _re.match(r"^data:([^;,]+);base64,(.*)$", raw, _re.S)
        if m:
            mime = m.group(1)
            b64 = m.group(2)
        else:
            mime = payload.get("mime") or "image/png"
            b64 = raw
        try:
            data = base64.b64decode(b64, validate=False)
        except Exception as e:
            return self._json({"ok": False, "error": f"bad base64: {e}"}, code=400)
        if not data:
            return self._json({"ok": False, "error": "empty image"}, code=400)
        ext = "png" if "png" in mime else ("jpg" if "jpeg" in mime or "jpg" in mime else "bin")
        h = hashlib.sha256(data).hexdigest()
        d = self._annotations_dir()
        d.mkdir(parents=True, exist_ok=True)
        img_path = d / f"{h}.{ext}"
        side_path = d / f"{h}.json"
        if not img_path.exists():
            img_path.write_bytes(data)
        # Validate regions (accept rect / point).
        regions = payload.get("regions") or []
        clean_regions = []
        for r in regions if isinstance(regions, list) else []:
            if not isinstance(r, dict): continue
            kind = r.get("kind")
            if kind not in ("rect", "point"): continue
            try:
                x = float(r.get("x"))
                y = float(r.get("y"))
            except Exception:
                continue
            entry = {"kind": kind, "x": max(0.0, min(1.0, x)), "y": max(0.0, min(1.0, y))}
            if kind == "rect":
                try:
                    w = float(r.get("w")); hh = float(r.get("h"))
                except Exception:
                    continue
                entry["w"] = max(0.0, min(1.0, w))
                entry["h"] = max(0.0, min(1.0, hh))
            if r.get("label"): entry["label"] = str(r["label"])[:200]
            clean_regions.append(entry)
        now_iso = datetime.now(timezone.utc).isoformat()
        side = {
            "schema": "comeketo.annotation.screenshot.v1",
            "hash": h,
            "mime": mime,
            "bytes": len(data),
            "ext": ext,
            "regions": clean_regions,
            "uploaded_at": now_iso,
        }
        # Merge regions with any previously-uploaded sidecar so the last write
        # doesn't stomp earlier annotations sharing the same image hash.
        if side_path.exists():
            try:
                prev = json.loads(side_path.read_text(encoding="utf-8"))
                if isinstance(prev.get("regions"), list):
                    # Dedupe by (kind,x,y,w,h) approximately.
                    seen = set()
                    merged = []
                    for r in (prev["regions"] + clean_regions):
                        key = (r.get("kind"), round(r.get("x", 0), 4), round(r.get("y", 0), 4),
                               round(r.get("w", 0) or 0, 4), round(r.get("h", 0) or 0, 4))
                        if key in seen: continue
                        seen.add(key); merged.append(r)
                    side["regions"] = merged
                if prev.get("uploaded_at"):
                    side["uploaded_at"] = prev["uploaded_at"]
            except Exception:
                pass
        side_path.write_text(json.dumps(side, indent=2, ensure_ascii=False), encoding="utf-8")
        # Ledger.
        try:
            ledger = HERE / "CCAgentindex" / "_ledger" / "activity.jsonl"
            with ledger.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps({
                    "ts": now_iso, "kind": "annotation_upload", "actor": "ui",
                    "hash": h, "bytes": len(data), "regions": len(clean_regions),
                    "path": f"annotations/{h}.{ext}",
                }, ensure_ascii=False) + "\n")
        except Exception:
            pass
        return self._json({
            "ok": True,
            "hash": h,
            "ext": ext,
            "mime": mime,
            "bytes": len(data),
            "regions": clean_regions,
            "path": f"CCAgentindex/annotations/{h}.{ext}",
            "url": f"/annotations/{h}.{ext}",
        })

    def _annotation_serve(self):
        """GET /annotations/<hash>.<ext> — read-through image serving."""
        from urllib.parse import urlparse
        parts = urlparse(self.path).path.split("/")
        if len(parts) < 3:
            self.send_error(404); return
        name = parts[-1]
        if not re.match(r"^[a-f0-9]{64}\.(png|jpg|bin)$", name):
            self.send_error(400); return
        p = self._annotations_dir() / name
        if not p.exists():
            self.send_error(404); return
        mime = "image/png" if name.endswith(".png") else ("image/jpeg" if name.endswith(".jpg") else "application/octet-stream")
        body = p.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", mime)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        self.end_headers()
        self.wfile.write(body)

    # ────── Tables: structured-row persistence (intake-only) ─────────────
    # Files at CCAgentindex/tables/<slug>.json. The Tables UI is gone; intake
    # routing still creates/appends rows here for receipt/invoice/contact/list
    # captures so the data isn't lost. Index registration + activity ledger
    # writes shared with intake_reports.
    def _tables_dir(self):
        return HERE / "CCAgentindex" / "tables"

    def _index_path(self):
        return HERE / "CCAgentindex" / "indexes" / "index.json"

    def _register_in_index(self, key, relpath):
        """Idempotent: append relpath to index.json[key] if absent, keep sorted."""
        p = self._index_path()
        try:
            if not p.exists(): return
            data = json.loads(p.read_text(encoding="utf-8"))
            arr = data.get(key)
            if not isinstance(arr, list):
                arr = []
                data[key] = arr
            if relpath not in arr:
                arr.append(relpath)
                arr.sort()
                p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        except Exception:
            pass

    def _unregister_from_index(self, key, relpath):
        p = self._index_path()
        try:
            if not p.exists(): return
            data = json.loads(p.read_text(encoding="utf-8"))
            arr = data.get(key)
            if isinstance(arr, list) and relpath in arr:
                arr.remove(relpath)
                p.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        except Exception:
            pass

    def _activity_ledger_write(self, entry):
        """Append a dict to _ledger/activity.jsonl (fire-and-forget)."""
        try:
            ledger = HERE / "CCAgentindex" / "_ledger" / "activity.jsonl"
            ledger.parent.mkdir(parents=True, exist_ok=True)
            with ledger.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
        except Exception:
            pass

    # ════════════════════════ INTAKE PIPELINE ═════════════════════════════
    # Receipts, invoices, business cards, handwritten notes, lists — anything
    # the team photographs or pastes in goes through here:
    #   1. /api/intake/classify   — takes an uploaded image path, runs OCR via
    #                               the vision-capable chat provider, returns
    #                               {kind, confidence, fields, raw_text}.
    #   2. /api/intake/route      — persists a classified item: writes rows to
    #                               the matching table (auto-creates if needed)
    #                               or returns a draft commitment for the UI.
    #   3. /api/intake/report     — POST {items: [...]} → writes a markdown
    #                               summary under CCAgentindex/reports/.
    # Each step is independent so the UI can show per-item progress and the
    # user can fix a classification manually without re-running OCR.

    def _intake_reports_dir(self):
        return HERE / "CCAgentindex" / "reports"

    # Canonical intake kinds + the table slug they route to.
    _INTAKE_ROUTING = {
        "receipt":  "expenses",
        "invoice":  "invoices",
        "contact":  "contacts_intake",
        "list":     "lists",
        "note":     None,  # notes become commitments, not table rows
    }

    # Default schemas used when the target table doesn't yet exist. Keys match
    # the field names the classifier is instructed to emit.
    _INTAKE_TABLE_SCHEMAS = {
        "expenses": [
            {"key": "date",     "label": "Date",     "type": "date"},
            {"key": "vendor",   "label": "Vendor",   "type": "text"},
            {"key": "amount",   "label": "Amount",   "type": "number"},
            {"key": "category", "label": "Category", "type": "text"},
            {"key": "payment",  "label": "Payment",  "type": "text"},
            {"key": "notes",    "label": "Notes",    "type": "text"},
            {"key": "source",   "label": "Source",   "type": "text"},
        ],
        "invoices": [
            {"key": "date",       "label": "Date",       "type": "date"},
            {"key": "client",     "label": "Client",     "type": "text"},
            {"key": "invoice_no", "label": "Invoice #",  "type": "text"},
            {"key": "amount",     "label": "Amount",     "type": "number"},
            {"key": "due_date",   "label": "Due",        "type": "date"},
            {"key": "status",     "label": "Status",     "type": "enum", "enum": ["draft","sent","paid","overdue"]},
            {"key": "notes",      "label": "Notes",      "type": "text"},
            {"key": "source",     "label": "Source",     "type": "text"},
        ],
        "contacts_intake": [
            {"key": "name",    "label": "Name",    "type": "text"},
            {"key": "role",    "label": "Role",    "type": "text"},
            {"key": "company", "label": "Company", "type": "text"},
            {"key": "phone",   "label": "Phone",   "type": "text"},
            {"key": "email",   "label": "Email",   "type": "text"},
            {"key": "address", "label": "Address", "type": "text"},
            {"key": "notes",   "label": "Notes",   "type": "text"},
            {"key": "source",  "label": "Source",  "type": "text"},
        ],
        "lists": [
            {"key": "item",    "label": "Item",    "type": "text"},
            {"key": "qty",     "label": "Qty",     "type": "text"},
            {"key": "notes",   "label": "Notes",   "type": "text"},
            {"key": "source",  "label": "Source",  "type": "text"},
        ],
    }

    _INTAKE_SYSTEM_PROMPT = (
        "You are Rodbot's intake classifier for Comeketo Catering's admin app. "
        "You receive an image (usually a receipt, invoice, business card, "
        "handwritten list, or note) and return a single strict JSON object — "
        "nothing else. No prose, no markdown fences. The JSON shape is:\n"
        '{\n'
        '  \"kind\": \"receipt\" | \"invoice\" | \"contact\" | \"list\" | \"note\" | \"uncertain\",\n'
        '  \"confidence\": number between 0 and 1,\n'
        '  \"title\": short one-line label for the item,\n'
        '  \"fields\": {...},  // see below per kind\n'
        '  \"raw_text\": string — the full OCR transcription\n'
        '}\n\n'
        "Field shapes per kind:\n"
        "  receipt  → {date (YYYY-MM-DD), vendor, amount (number), category, payment, notes}\n"
        "  invoice  → {date, client, invoice_no, amount, due_date, status, notes}\n"
        "  contact  → {name, role, company, phone, email, address, notes}\n"
        "  list     → {items: [{item, qty, notes}]}  // each list row becomes a table row\n"
        "  note     → {body}  // use raw_text if nothing better\n\n"
        "Confidence rules: 0.9+ when the layout is unambiguous (printed receipt, "
        "clean business card). 0.6–0.85 when some fields are inferred. Below "
        "0.65 means the UI will route it to a 'needs review' section — use that "
        "when you can't tell one kind from another. Be conservative; the user "
        "would rather confirm than clean up wrong data later. Output nothing "
        "but the JSON object."
    )

    def _intake_classify(self, body):
        """POST /api/intake/classify
        Body: { "path": "/abs/path/to/image.jpg", "mime": "image/jpeg" }
        Runs the active chat provider with a vision prompt and returns the
        parsed classifier JSON. We trust the provider to return JSON — on
        parse failure we fall back to kind=uncertain and stuff the raw reply
        into raw_text so the user can still route manually.
        """
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        path = (payload.get("path") or "").strip()
        if not path or not Path(path).exists():
            return self._json({"ok": False, "error": f"image not found: {path}"}, code=404)
        mime = payload.get("mime") or "image/png"
        provider = payload.get("provider") or ("openai" if ENV.get("OPENAI_API_KEY") else "claude_code")

        # Build a chat/send-style payload under the hood. OpenAI gets real
        # vision; Claude Code gets the file path and is told to Read it.
        chat_payload = {
            "provider": provider,
            "timeout": 90,
            "system": self._INTAKE_SYSTEM_PROMPT,
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": "Classify this document and extract its fields. Return only the JSON object."},
                    {"type": "image", "path": path, "mime": mime},
                ],
            }],
        }
        # Dispatch through the existing _chat_send by re-serializing.
        # We call the same core logic but capture the reply inline so we can
        # parse JSON out of it without round-tripping through HTTP.
        reply_text, route_tag, err = self._intake_dispatch_chat(chat_payload)
        if err:
            return self._json({"ok": False, "error": err, "path": path}, code=502)

        # Try to peel JSON out of the reply. Providers sometimes wrap it in
        # ```json fences or add a single lead-in sentence — strip those.
        parsed = self._intake_parse_json(reply_text)
        if not parsed:
            return self._json({
                "ok": True,
                "path": path,
                "kind": "uncertain",
                "confidence": 0.0,
                "title": "Needs review",
                "fields": {},
                "raw_text": reply_text,
                "provider_route": route_tag,
                "parse_failed": True,
            })

        # Normalize shape
        parsed.setdefault("kind", "uncertain")
        parsed.setdefault("confidence", 0.0)
        parsed.setdefault("title", "")
        parsed.setdefault("fields", {})
        parsed.setdefault("raw_text", "")
        try:
            parsed["confidence"] = float(parsed["confidence"])
        except Exception:
            parsed["confidence"] = 0.0
        if parsed["kind"] not in ("receipt", "invoice", "contact", "list", "note", "uncertain"):
            parsed["kind"] = "uncertain"

        # Ledger event — the intake ledger is append-only like the main one.
        self._activity_ledger_write({
            "ts": _iso_now(),
            "kind": "intake_classified",
            "actor": "rodbot",
            "path": path,
            "classified_as": parsed["kind"],
            "confidence": parsed["confidence"],
            "provider": provider,
        })

        parsed["ok"] = True
        parsed["path"] = path
        parsed["provider_route"] = route_tag
        return self._json(parsed)

    def _intake_dispatch_chat(self, payload):
        """Route a chat-style payload through the active provider and return
        (reply_text, provider_route_tag, error). Minimal duplicate of
        _chat_send but returning values instead of HTTP responses."""
        provider = payload.get("provider") or "claude_code"
        system = (payload.get("system") or "").strip()
        timeout_s = int(payload.get("timeout") or 90)
        messages = payload.get("messages") or []

        def _parts(m):
            c = m.get("content")
            if isinstance(c, list): return c
            if isinstance(c, str):  return [{"type": "text", "text": c}] if c.strip() else []
            return []

        if provider == "claude_code":
            if not CLAUDE_BIN:
                return ("", "", "claude binary not found")
            lines = []
            for m in messages:
                role = m.get("role", "user")
                text_parts = [p.get("text", "") for p in _parts(m) if p.get("type") == "text"]
                imgs = [p for p in _parts(m) if p.get("type") == "image"]
                body_lines = [t for t in text_parts if t]
                for a in imgs:
                    p = a.get("path") or ""
                    if p:
                        body_lines.append(f"[attached image — read with your Read tool: {p}]")
                body = "\n".join(body_lines).strip()
                if role == "user":        lines.append(f"USER: {body}")
                elif role == "assistant": lines.append(f"ASSISTANT: {body}")
                else:                     lines.append(f"{role.upper()}: {body}")
            lines.append("ASSISTANT:")
            transcript = "\n\n".join(lines)
            cmd = [CLAUDE_BIN, "-p", "--max-turns", "3", "--output-format", "text"]
            if system:
                cmd += ["--system-prompt", system]
            try:
                proc = subprocess.run(cmd, input=transcript, capture_output=True, text=True, timeout=timeout_s)
                if proc.returncode != 0:
                    return ("", "", f"claude exit {proc.returncode}: {(proc.stderr or '')[-400:]}")
                return ((proc.stdout or "").strip(), "claude-code-subprocess", None)
            except subprocess.TimeoutExpired:
                return ("", "", f"timeout after {timeout_s}s")
            except Exception as e:
                return ("", "", f"{type(e).__name__}: {e}")

        if provider == "codex_cli":
            lines = []
            image_paths = []
            for m in messages:
                role = m.get("role", "user")
                text_parts = [p.get("text", "") for p in _parts(m) if p.get("type") == "text"]
                imgs = [p for p in _parts(m) if p.get("type") == "image"]
                body_lines = [t for t in text_parts if t]
                for a in imgs:
                    path = a.get("path") or ""
                    if path:
                        image_paths.append(path)
                        body_lines.append(f"[attached image: {path}]")
                body = "\n".join(body_lines).strip()
                if role == "user":        lines.append(f"USER: {body}")
                elif role == "assistant": lines.append(f"ASSISTANT: {body}")
                else:                     lines.append(f"{role.upper()}: {body}")
            lines.append("ASSISTANT:")
            transcript = _build_codex_prompt(system, "\n\n".join(lines))
            text, stderr, err = _run_codex_exec(
                transcript,
                model=payload.get("model") or "gpt-5.4-mini",
                timeout_s=timeout_s,
                image_paths=image_paths,
            )
            if err:
                return ("", "", f"{err}: {stderr[-400:]}" if stderr else err)
            return (text.strip(), "codex-cli-subprocess", None)

        # OpenAI Responses
        if not ENV.get("OPENAI_API_KEY"):
            return ("", "", "OPENAI_API_KEY not set on server")
        input_msgs = []
        for m in messages:
            out = []
            for p in _parts(m):
                if p.get("type") == "text" and (p.get("text") or "").strip():
                    out.append({"type": "input_text", "text": p["text"]})
                elif p.get("type") == "image":
                    path = p.get("path") or ""
                    mime = p.get("mime") or "image/png"
                    if not path or not Path(path).exists():
                        out.append({"type": "input_text", "text": f"(image attached but unreadable at {path})"})
                        continue
                    try:
                        data = base64.b64encode(Path(path).read_bytes()).decode("ascii")
                        out.append({"type": "input_image", "image_url": f"data:{mime};base64,{data}"})
                    except Exception as e:
                        out.append({"type": "input_text", "text": f"(image read failed: {e})"})
            if out:
                input_msgs.append({"role": m.get("role", "user"), "content": out})
        req_body = {"model": payload.get("model") or "gpt-5.4-mini", "input": input_msgs}
        if system:
            req_body["instructions"] = system
        try:
            req = urllib.request.Request("https://api.openai.com/v1/responses",
                data=json.dumps(req_body).encode(), method="POST")
            req.add_header("Content-Type", "application/json")
            req.add_header("Authorization", f"Bearer {ENV.get('OPENAI_API_KEY').strip()}")
            with urllib.request.urlopen(req, timeout=timeout_s) as resp:
                data = json.loads(resp.read().decode())
            text = data.get("output_text") or ""
            if not text and isinstance(data.get("output"), list):
                parts = []
                for item in data["output"]:
                    for c in (item.get("content") or []):
                        if isinstance(c.get("text"), str): parts.append(c["text"])
                text = "\n".join(parts).strip()
            return (text, "openai-server-proxy", None)
        except urllib.error.HTTPError as e:
            detail = ""
            try: detail = e.read().decode()[:300]
            except Exception: pass
            return ("", "", f"openai {e.code}: {detail}")
        except Exception as e:
            return ("", "", f"{type(e).__name__}: {e}")

    def _intake_parse_json(self, text):
        """Extract the first well-formed JSON object from a string. Handles
        raw JSON, ```json fenced blocks, and a single lead-in paragraph."""
        if not text: return None
        s = text.strip()
        # Strip markdown fences if present.
        m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", s, re.DOTALL)
        if m:
            s = m.group(1)
        # Find outermost {...}
        start = s.find("{")
        end = s.rfind("}")
        if start < 0 or end < 0 or end <= start:
            return None
        try:
            return json.loads(s[start:end+1])
        except Exception:
            return None

    def _intake_route(self, body):
        """POST /api/intake/route
        Body: { kind, fields, title?, raw_text?, path?, confidence? }
        For receipt/invoice/contact/list: appends a row (or rows) to the
        target table, creating it with a default schema if absent.
        For note: returns a draft commitment payload the UI can add
        client-side (commitments live in localStorage).
        Also emits an intake_routed ledger event.
        """
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)

        kind = (payload.get("kind") or "uncertain").strip()
        fields = payload.get("fields") or {}
        title = (payload.get("title") or "").strip()
        raw_text = (payload.get("raw_text") or "").strip()
        src_path = (payload.get("path") or "").strip()
        confidence = payload.get("confidence") or 0.0
        now_iso = _iso_now()
        src_tag = Path(src_path).name if src_path else "intake"

        if kind == "note" or kind == "uncertain":
            # Notes become draft commitments — we return the payload, the UI
            # adds it to localStorage. For uncertain, we still hand something
            # back so the user can salvage it.
            draft = {
                "kind_draft": "note" if kind == "note" else "uncertain",
                "subject": title or (raw_text[:64] + ("…" if len(raw_text) > 64 else "")) or "Note from intake",
                "body": fields.get("body") or raw_text or title or "",
                "commit": {"kind": "note", "label": "Review note", "target": ""},
                "source": f"intake:{src_tag}",
                "createdAt": now_iso,
            }
            self._activity_ledger_write({
                "ts": now_iso,
                "kind": "intake_routed",
                "actor": "ui",
                "intake_kind": kind,
                "target": "commitment_draft",
                "path": src_path,
                "confidence": confidence,
            })
            return self._json({"ok": True, "routed_to": "commitment", "draft": draft})

        target_slug = self._INTAKE_ROUTING.get(kind)
        if not target_slug:
            return self._json({"ok": False, "error": f"no route for kind={kind}"}, code=400)

        # Build rows. Lists explode into multiple rows.
        rows_to_add = []
        if kind == "list":
            items = fields.get("items") or []
            if not isinstance(items, list) or not items:
                # Degrade: one row with item=title, notes=raw_text
                items = [{"item": title or "untitled", "notes": raw_text}]
            for it in items:
                if not isinstance(it, dict): continue
                rows_to_add.append({
                    "item":   (it.get("item") or "").strip(),
                    "qty":    it.get("qty") or "",
                    "notes":  (it.get("notes") or "").strip(),
                    "source": src_tag,
                })
        else:
            row = {k: v for k, v in fields.items() if not isinstance(v, (list, dict))}
            row["source"] = src_tag
            rows_to_add.append(row)

        # Ensure the target table exists. Create from default schema if not.
        d = self._tables_dir()
        d.mkdir(parents=True, exist_ok=True)
        path = d / f"{target_slug}.json"
        created = False
        if not path.exists():
            schema = self._INTAKE_TABLE_SCHEMAS.get(target_slug) or [{"key": "value", "label": "Value", "type": "text"}]
            name = {
                "expenses": "Expenses",
                "invoices": "Invoices",
                "contacts_intake": "Contacts (intake)",
                "lists": "Lists",
            }.get(target_slug, target_slug)
            doc = {
                "slug": target_slug,
                "name": name,
                "schema": schema,
                "rows": [],
                "metadata": {"created_at": now_iso, "updated_at": now_iso, "template": "intake_autocreated"},
            }
            tmp = d / f".{target_slug}.json.tmp"
            tmp.write_text(json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8")
            tmp.replace(path)
            self._register_in_index("tables", f"tables/{target_slug}.json")
            created = True

        # Append
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            return self._json({"ok": False, "error": f"table parse failed: {e}"}, code=500)
        existing = data.get("rows") or []
        existing.extend(rows_to_add)
        data["rows"] = existing
        meta = data.get("metadata") or {}
        meta["updated_at"] = now_iso
        data["metadata"] = meta
        try:
            tmp = d / f".{target_slug}.json.tmp"
            tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
            tmp.replace(path)
        except Exception as e:
            return self._json({"ok": False, "error": f"write failed: {e}"}, code=500)

        self._activity_ledger_write({
            "ts": now_iso,
            "kind": "intake_routed",
            "actor": "ui",
            "intake_kind": kind,
            "target": target_slug,
            "added": len(rows_to_add),
            "table_created": created,
            "confidence": confidence,
            "path": src_path,
        })
        return self._json({
            "ok": True,
            "routed_to": "table",
            "target_slug": target_slug,
            "table_created": created,
            "added": len(rows_to_add),
            "total": len(existing),
        })

    def _intake_report(self, body):
        """POST /api/intake/report
        Body: { items: [ { kind, title, confidence, fields?, path?, routed_to?, target_slug? } ],
                label?: string }
        Writes a markdown summary under CCAgentindex/reports/ and returns
        {ok, path, url, name}. The report is dead simple markdown — headings
        per kind, a bullet per item, a tally at the top.
        """
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        items = payload.get("items") or []
        if not isinstance(items, list) or not items:
            return self._json({"ok": False, "error": "items must be a non-empty list"}, code=400)
        label = (payload.get("label") or "intake").strip()

        # Tally
        tally = {}
        for it in items:
            k = (it.get("kind") or "uncertain").strip()
            tally[k] = tally.get(k, 0) + 1

        now = datetime.now(timezone.utc)
        stamp = now.strftime("%Y-%m-%d_%H%M%S")
        name = f"{stamp}_{re.sub(r'[^a-z0-9_-]','_', label.lower())[:40]}.md"
        rel = f"reports/{name}"
        out_dir = self._intake_reports_dir()
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / name

        lines = []
        lines.append(f"# Intake report — {now.strftime('%b %d, %Y %H:%M UTC')}")
        lines.append("")
        lines.append(f"**{len(items)} item{'s' if len(items) != 1 else ''} processed.** "
                     + " · ".join(f"{k}: {v}" for k, v in sorted(tally.items())))
        lines.append("")
        # Group by kind
        by_kind = {}
        for it in items:
            by_kind.setdefault((it.get("kind") or "uncertain"), []).append(it)
        kind_order = ["receipt", "invoice", "contact", "list", "note", "uncertain"]
        for k in kind_order:
            bucket = by_kind.get(k) or []
            if not bucket: continue
            lines.append(f"## {k.capitalize()} ({len(bucket)})")
            lines.append("")
            for it in bucket:
                title = (it.get("title") or "").strip() or "(no title)"
                conf = it.get("confidence")
                conf_str = f" · conf {float(conf):.2f}" if isinstance(conf, (int, float)) else ""
                routed = ""
                if it.get("routed_to") == "table" and it.get("target_slug"):
                    routed = f" → table `{it['target_slug']}`"
                elif it.get("routed_to") == "commitment":
                    routed = " → draft commitment"
                lines.append(f"- **{title}**{conf_str}{routed}")
                fields = it.get("fields") or {}
                if isinstance(fields, dict):
                    short = []
                    for key in ("vendor", "client", "amount", "date", "name", "company", "phone", "email", "invoice_no", "due_date"):
                        if fields.get(key) not in (None, ""):
                            short.append(f"{key}: {fields[key]}")
                    if short:
                        lines.append(f"  - {' · '.join(short)}")
                if it.get("path"):
                    lines.append(f"  - source: `{Path(it['path']).name}`")
            lines.append("")

        md = "\n".join(lines).rstrip() + "\n"
        out_path.write_text(md, encoding="utf-8")

        self._activity_ledger_write({
            "ts": _iso_now(),
            "kind": "intake_report_written",
            "actor": "ui",
            "path": rel,
            "items": len(items),
            "tally": tally,
        })
        return self._json({
            "ok": True,
            "name": name,
            "path": rel,
            "url": "/" + "CCAgentindex/" + rel,
            "markdown": md,
            "items": len(items),
            "tally": tally,
        })

    # ════════════════════════ REPORTS (Smorgasbord) ═══════════════════════
    # Universal-intake workspaces. A "report" is a folder under
    # CCAgentindex/reports/<slug>/ holding:
    #   report.json          — metadata + documents[] + summary
    #   documents/<id>.<ext> — raw uploaded bytes
    #   conversation.jsonl   — append-only Q&A history with Rodbot
    # Endpoints: list / create / get / <slug>/ingest / <slug>/ask /
    # <slug>/documents/<id>/delete / delete
    # Frontend page: IntakeScreen → screens.jsx
    # Restored 2026-04-27 after great-trim oversight.

    def _reports_root(self):
        return HERE / "CCAgentindex" / "reports"

    def _reports_lock(self, slug):
        with _REPORT_LOCKS_GUARD:
            lock = _REPORT_LOCKS.get(slug)
            if lock is None:
                lock = threading.Lock()
                _REPORT_LOCKS[slug] = lock
            return lock

    def _reports_slug_ok(self, s):
        if not s or not isinstance(s, str): return False
        if "/" in s or "\\" in s or ".." in s: return False
        if len(s) > 80: return False
        return all(c.isalnum() or c in "-_" for c in s)

    def _reports_slug_from_name(self, name):
        s = re.sub(r"[^a-zA-Z0-9]+", "_", (name or "").strip().lower()).strip("_")
        s = s[:60] or "report"
        # Dedupe: if reports/<slug>/ exists, append _2, _3, …
        base = s
        n = 2
        root = self._reports_root()
        while (root / s).exists():
            s = f"{base}_{n}"
            n += 1
            if n > 999: break
        return s

    def _reports_doc_type_from_mime(self, mime, filename):
        m = (mime or "").lower()
        ext = (filename.rsplit(".", 1)[-1].lower() if "." in (filename or "") else "")
        if m.startswith("image/"): return "image"
        if m == "application/pdf" or ext == "pdf": return "pdf"
        if m == "text/csv" or ext in ("csv", "tsv"): return "csv"
        if ext in ("xlsx", "xls"): return "sheet"
        if ext in ("docx", "doc"): return "doc"
        if m == "application/json" or ext in ("json", "jsonl"): return "json"
        if m in ("text/markdown",) or ext in ("md", "markdown"): return "md"
        if ext in ("js", "jsx", "ts", "tsx", "py", "rb", "go", "rs", "java", "kt", "swift", "c", "cpp", "h", "hpp", "cs", "php", "sh", "sql"):
            return "code"
        if m.startswith("text/") or ext in ("txt", "log", "yaml", "yml", "xml", "html", "htm", "toml", "ini", "env"):
            return "txt"
        return "unknown"

    def _reports_ext_from(self, mime, filename):
        ext_map = {
            "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg",
            "image/gif": "gif", "image/webp": "webp", "image/svg+xml": "svg",
            "image/heic": "heic", "image/heif": "heif",
            "application/pdf": "pdf",
            "application/json": "json", "text/csv": "csv",
            "text/markdown": "md", "text/plain": "txt", "text/html": "html",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
            "application/vnd.ms-excel": "xls",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
            "application/msword": "doc",
        }
        e = ext_map.get((mime or "").lower())
        if e: return e
        if filename and "." in filename:
            return filename.rsplit(".", 1)[-1].lower()[:8]
        return "bin"

    def _reports_extract_xlsx_text(self, raw_bytes):
        """Best-effort XLSX extraction without third-party deps."""
        try:
            zf = zipfile.ZipFile(io.BytesIO(raw_bytes))
        except Exception as e:
            return ("", f"xlsx open failed: {e}")

        def _tag_name(tag):
            return tag.rsplit("}", 1)[-1] if "}" in tag else tag

        shared = []
        try:
            with zf.open("xl/sharedStrings.xml") as fh:
                root = ET.parse(fh).getroot()
                for si in root.iter():
                    if _tag_name(si.tag) != "si":
                        continue
                    parts = []
                    for node in si.iter():
                        if _tag_name(node.tag) == "t":
                            parts.append(node.text or "")
                    shared.append("".join(parts))
        except KeyError:
            shared = []
        except Exception:
            shared = []

        sheet_names = sorted([n for n in zf.namelist() if n.startswith("xl/worksheets/sheet") and n.endswith(".xml")])
        if not sheet_names:
            return ("", "xlsx has no worksheets")

        out = []
        for idx, sheet in enumerate(sheet_names, start=1):
            try:
                with zf.open(sheet) as fh:
                    root = ET.parse(fh).getroot()
            except Exception:
                continue
            out.append(f"[Sheet {idx}]")
            row_count = 0
            for row in root.iter():
                if _tag_name(row.tag) != "row":
                    continue
                vals = []
                for cell in row:
                    if _tag_name(cell.tag) != "c":
                        continue
                    ctype = cell.attrib.get("t")
                    if ctype == "inlineStr":
                        tnode = next((n for n in cell.iter() if _tag_name(n.tag) == "t"), None)
                        vals.append((tnode.text or "") if tnode is not None else "")
                        continue
                    vnode = next((n for n in cell.iter() if _tag_name(n.tag) == "v"), None)
                    if vnode is None:
                        vals.append("")
                        continue
                    raw_val = vnode.text or ""
                    if ctype == "s":
                        try:
                            sval = shared[int(raw_val)]
                        except Exception:
                            sval = raw_val
                        vals.append(sval)
                    else:
                        vals.append(raw_val)
                if vals and any(v.strip() for v in vals):
                    out.append("\t".join(vals))
                    row_count += 1
                if row_count >= 200:
                    out.append("[... sheet truncated at 200 rows ...]")
                    break
            out.append("")
        return ("\n".join(out).strip(), None)

    def _reports_extract_docx_text(self, raw_bytes):
        """Best-effort DOCX extraction without third-party deps."""
        try:
            zf = zipfile.ZipFile(io.BytesIO(raw_bytes))
            with zf.open("word/document.xml") as fh:
                root = ET.parse(fh).getroot()
        except Exception as e:
            return ("", f"docx parse failed: {e}")

        def _tag_name(tag):
            return tag.rsplit("}", 1)[-1] if "}" in tag else tag

        paragraphs = []
        for p in root.iter():
            if _tag_name(p.tag) != "p":
                continue
            parts = []
            for node in p.iter():
                if _tag_name(node.tag) == "t":
                    parts.append(node.text or "")
            line = "".join(parts).strip()
            if line:
                paragraphs.append(line)
            if len(paragraphs) >= 400:
                paragraphs.append("[... document truncated at 400 paragraphs ...]")
                break
        return ("\n".join(paragraphs).strip(), None)

    def _reports_ocr_image(self, image_path, mime, filename):
        if not image_path or not Path(image_path).exists():
            return ("", "image not found for OCR")
        provider = "openai" if ENV.get("OPENAI_API_KEY") else "claude_code"
        payload = {
            "provider": provider,
            "timeout": 120,
            "system": (
                "You are an OCR engine. Transcribe all visible text exactly, "
                "including handwritten notes when legible. Preserve line breaks. "
                "If text is unclear, mark with [unclear]. Return plain text only."
            ),
            "messages": [{
                "role": "user",
                "content": [
                    {"type": "text", "text": f"OCR this image ({filename}). Return only transcription text."},
                    {"type": "image", "path": str(image_path), "mime": mime or "image/png"},
                ],
            }],
        }
        text, route, err = self._intake_dispatch_chat(payload)
        if err:
            return ("", f"ocr failed: {err}")
        text = (text or "").strip()
        if not text:
            return ("", f"ocr returned empty text via {route or provider}")
        return (text, None)

    def _reports_extract_text(self, raw_bytes, mime, filename, stored_path=None):
        """Return (extracted_text, error_or_none). Best-effort text extraction
        for the universal-intake reports flow. Heavy lifting:
          text/* + code-ish files → decode as utf-8 (replace errors)
          application/pdf → pypdf if available
          image/* → OCR through current chat provider
          xlsx/docx → zip/xml extraction without third-party deps
          else → binary placeholder
        """
        m = (mime or "").lower()
        ext = (filename.rsplit(".", 1)[-1].lower() if "." in (filename or "") else "")
        size = len(raw_bytes)
        try:
            textish_ext = {
                "md", "markdown", "txt", "csv", "tsv", "json", "jsonl",
                "log", "yaml", "yml", "xml", "html", "htm", "toml", "ini", "env",
                "js", "jsx", "ts", "tsx", "py", "rb", "go", "rs", "java", "kt",
                "swift", "c", "cpp", "h", "hpp", "cs", "php", "sh", "sql",
            }
            if m.startswith("text/") or m in ("application/json", "application/javascript", "text/javascript") or ext in textish_ext:
                return (raw_bytes.decode("utf-8", "replace"), None)
            if ext in ("xlsx",) or m == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                text, xerr = self._reports_extract_xlsx_text(raw_bytes)
                if text:
                    return (text, None)
                return (f"[xlsx: {filename}, {size} bytes] — {xerr or 'could not parse workbook'}", None)
            if ext in ("docx",) or m == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                text, derr = self._reports_extract_docx_text(raw_bytes)
                if text:
                    return (text, None)
                return (f"[docx: {filename}, {size} bytes] — {derr or 'could not parse document'}", None)
            if ext in ("xls",) or m == "application/vnd.ms-excel":
                return (f"[xls: {filename}, {size} bytes] — binary .xls is not directly parseable here; export as .xlsx or .csv for full extraction.", None)
            if ext in ("doc",) or m == "application/msword":
                return (f"[doc: {filename}, {size} bytes] — binary .doc is not directly parseable here; export as .docx for full extraction.", None)
            if m == "application/pdf" or (filename or "").lower().endswith(".pdf"):
                try:
                    try:
                        import pypdf
                    except ImportError:
                        return (f"[pdf: {filename}, {size} bytes] — pypdf not installed; "
                                f"run `pip install --break-system-packages pypdf` to enable text extraction.", None)
                    reader = pypdf.PdfReader(io.BytesIO(raw_bytes))
                    parts = []
                    for i, page in enumerate(reader.pages):
                        try:
                            parts.append(page.extract_text() or "")
                        except Exception:
                            parts.append(f"[page {i+1}: extraction failed]")
                    text = "\n\n".join(parts).strip()
                    if not text:
                        text = f"[pdf: {filename}, {size} bytes, {len(reader.pages)} pages] — no extractable text (likely scanned)."
                    return (text, None)
                except Exception as e:
                    return (f"[pdf: {filename}, {size} bytes] — extraction failed: {e}", None)
            if m.startswith("image/"):
                ocr_text, ocr_err = self._reports_ocr_image(stored_path, m, filename)
                if ocr_text:
                    return (ocr_text, None)
                return (f"[image: {filename}, {size} bytes] — {ocr_err or 'OCR unavailable'}", None)
            return (f"[binary: {filename}, {mime}, {size} bytes]", None)
        except Exception as e:
            return (f"[extract failed: {e}]", str(e))

    def _reports_load(self, slug):
        """Return (report_dict, abs_dir, error). report.json is created lazily."""
        if not self._reports_slug_ok(slug):
            return (None, None, "bad slug")
        d = self._reports_root() / slug
        if not d.exists():
            return (None, None, "not found")
        meta = d / "report.json"
        if not meta.exists():
            return (None, None, "report.json missing")
        try:
            return (json.loads(meta.read_text(encoding="utf-8")), d, None)
        except Exception as e:
            return (None, None, f"report.json parse failed: {e}")

    def _reports_save(self, slug, report):
        d = self._reports_root() / slug
        d.mkdir(parents=True, exist_ok=True)
        meta = d / "report.json"
        tmp = d / ".report.json.tmp"
        tmp.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
        tmp.replace(meta)

    def _reports_conversation_path(self, slug):
        return self._reports_root() / slug / "conversation.jsonl"

    def _reports_read_conversation(self, slug):
        p = self._reports_conversation_path(slug)
        if not p.exists(): return []
        out = []
        try:
            with p.open("r", encoding="utf-8") as fh:
                for line in fh:
                    line = line.strip()
                    if not line: continue
                    try: out.append(json.loads(line))
                    except Exception: pass
        except Exception:
            pass
        return out

    def _reports_append_qa(self, slug, qa):
        p = self._reports_conversation_path(slug)
        p.parent.mkdir(parents=True, exist_ok=True)
        with p.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(qa, ensure_ascii=False) + "\n")

    def _reports_list(self):
        root = self._reports_root()
        if not root.exists():
            return self._json({"ok": True, "reports": [], "items": []})
        out = []
        for d in root.iterdir():
            if not d.is_dir() or d.name.startswith("."): continue
            meta_path = d / "report.json"
            if not meta_path.exists(): continue
            try:
                rep = json.loads(meta_path.read_text(encoding="utf-8"))
            except Exception:
                continue
            docs = rep.get("documents") or []
            doc_types = []
            for doc in docs:
                t = doc.get("type") or "unknown"
                if t not in doc_types: doc_types.append(t)
            qa_count = 0
            qa_path = self._reports_conversation_path(d.name)
            if qa_path.exists():
                try:
                    qa_count = sum(1 for line in qa_path.read_text(encoding="utf-8").splitlines() if line.strip())
                except Exception:
                    qa_count = 0
            out.append({
                "slug":         rep.get("slug") or d.name,
                "name":         rep.get("name") or d.name,
                "doc_count":    len(docs),
                "doc_types":    doc_types,
                "qa_count":     qa_count,
                "conversation_count": qa_count,
                "created_at":   rep.get("created_at"),
                "last_modified": rep.get("last_modified") or rep.get("created_at"),
                "updated_at":   rep.get("last_modified") or rep.get("created_at"),
            })
        out.sort(key=lambda r: r.get("last_modified") or "", reverse=True)

        # Box Reports — synthesized views over Auto/Client Boxes/<Name>/.
        # One entry per client box. No file copy; doc counts come from the
        # live folder. Conversation counts come from _box_conversations/<id>.jsonl.
        box_out = []
        try:
            cat = self._boxes_catalog()
        except Exception:
            cat = {"boxes": []}
        for b in cat.get("boxes", []):
            if (b.get("source_kind") or "") != "client_box":
                continue
            folder = Path(b.get("folder_abs") or "")
            if not folder.exists():
                continue
            doc_types = []
            doc_count = 0
            newest_mtime = 0.0
            for fp in self._box_report_iter_files(folder):
                doc_count += 1
                try:
                    newest_mtime = max(newest_mtime, fp.stat().st_mtime)
                except Exception:
                    pass
                t = self._reports_doc_type_from_mime(self._box_report_mime_for(fp), fp.name)
                if t not in doc_types:
                    doc_types.append(t)
            qa_count = 0
            qa_path = self._box_report_conversation_path(b.get("id") or "")
            if qa_path.exists():
                try:
                    qa_count = sum(1 for line in qa_path.read_text(encoding="utf-8").splitlines() if line.strip())
                except Exception:
                    qa_count = 0
            last_modified = (
                datetime.fromtimestamp(newest_mtime, tz=timezone.utc).isoformat().replace("+00:00", "Z")
                if newest_mtime else None
            )
            box_out.append({
                "slug":          b.get("id"),
                "name":          b.get("name") or b.get("folder_name") or b.get("id"),
                "kind":          b.get("kind") or "lead",
                "source_kind":   b.get("source_kind"),
                "doc_count":     doc_count,
                "doc_types":     doc_types,
                "qa_count":      qa_count,
                "conversation_count": qa_count,
                "created_at":    None,
                "last_modified": last_modified,
                "updated_at":    last_modified,
                "source":        "box_synthesis",
                "folder_rel":    b.get("folder_rel"),
            })
        box_out.sort(key=lambda r: r.get("last_modified") or "", reverse=True)
        return self._json({"ok": True, "reports": out, "items": out, "box_reports": box_out})

    def _reports_create(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        name = (payload.get("name") or "").strip()
        if not name:
            return self._json({"ok": False, "error": "missing name"}, code=400)
        slug = self._reports_slug_from_name(name)
        # Refuse workspace slugs that collide with a Client Box id — those
        # are reserved as Box Report identities.
        if self._box_report_lookup(slug) is not None:
            return self._json({
                "ok": False,
                "error": f"slug '{slug}' collides with a Client Box; pick a different name",
            }, code=409)
        d = self._reports_root() / slug
        d.mkdir(parents=True, exist_ok=True)
        (d / "documents").mkdir(parents=True, exist_ok=True)
        now = _iso_now()
        report = {
            "slug": slug,
            "name": name,
            "description": (payload.get("description") or "").strip() or None,
            "created_at": now,
            "last_modified": now,
            "documents": [],
        }
        self._reports_save(slug, report)
        self._activity_ledger_write({
            "ts": now,
            "kind": "report_created",
            "actor": "ui",
            "slug": slug,
            "name": name,
        })
        return self._json({"ok": True, "slug": slug, "report": report})

    def _reports_get(self):
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        slug = (qs.get("slug") or [""])[0]
        if not self._reports_slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        # Box Report path: synthesize on the fly from the box folder. No
        # report.json is read or written; conversation history lives at
        # _box_conversations/<box_id>.jsonl.
        box = self._box_report_lookup(slug)
        if box is not None:
            report = self._box_report_synthesize(box)
            if report is None:
                return self._json({"ok": False, "error": "box folder missing"}, code=404)
            report["conversation"] = self._box_report_read_conversation(slug)
            return self._json({"ok": True, "report": report})
        # Workspace path: existing behavior, unchanged.
        report, _d, err = self._reports_load(slug)
        if err:
            return self._json({"ok": False, "error": err}, code=404)
        report["conversation"] = self._reports_read_conversation(slug)
        return self._json({"ok": True, "report": report})

    def _reports_ingest(self, slug, body):
        if not self._reports_slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        # Box Report ingest: write into Auto/Client Boxes/<Name>/intake_drops/
        box = self._box_report_lookup(slug)
        if box is not None:
            return self._box_report_ingest(box, body)
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        upload_path = (payload.get("upload_path") or "").strip()
        mime        = (payload.get("mime") or "application/octet-stream").strip()
        filename    = (payload.get("filename") or "file").strip()
        if not upload_path:
            return self._json({"ok": False, "error": "missing upload_path"}, code=400)
        src = Path(upload_path)
        if not src.exists():
            return self._json({"ok": False, "error": f"upload not found at {upload_path}"}, code=404)

        with self._reports_lock(slug):
            report, d, err = self._reports_load(slug)
            if err:
                return self._json({"ok": False, "error": err}, code=404)

            try:
                raw = src.read_bytes()
            except Exception as e:
                return self._json({"ok": False, "error": f"read upload failed: {e}"}, code=500)

            doc_id = f"d_{uuid.uuid4().hex[:10]}"
            ext = self._reports_ext_from(mime, filename)
            docs_dir = d / "documents"
            docs_dir.mkdir(parents=True, exist_ok=True)
            doc_path = docs_dir / f"{doc_id}.{ext}"
            try:
                doc_path.write_bytes(raw)
            except Exception as e:
                return self._json({"ok": False, "error": f"write failed: {e}"}, code=500)

            extracted, _err = self._reports_extract_text(raw, mime, filename, stored_path=doc_path)
            # Cap stored extracted_text per-document to keep report.json sane.
            if extracted and len(extracted) > 200_000:
                extracted = extracted[:200_000] + "\n\n[... truncated ...]"

            now = _iso_now()
            doc_entry = {
                "id":             doc_id,
                "filename":       filename,
                "mime":           mime,
                "type":           self._reports_doc_type_from_mime(mime, filename),
                "size":           len(raw),
                "uploaded_at":    now,
                "extracted_text": extracted or "",
                "summary":        (extracted or "")[:200].strip().replace("\n", " ") if extracted else "",
                "stored_path":    str(doc_path.relative_to(HERE)),
            }
            documents = report.get("documents") or []
            documents.append(doc_entry)
            report["documents"] = documents
            report["last_modified"] = now
            self._reports_save(slug, report)

        self._activity_ledger_write({
            "ts": now,
            "kind": "report_ingest",
            "actor": "ui",
            "slug": slug,
            "doc_id": doc_id,
            "filename": filename,
            "mime": mime,
            "size": len(raw),
        })
        return self._json({"ok": True, "document": doc_entry})

    def _reports_ask(self, slug, body):
        if not self._reports_slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        question        = (payload.get("question") or "").strip()
        enhanced_prompt = (payload.get("enhanced_prompt") or "").strip() or None
        thinking_trace  = payload.get("thinking_trace")
        thinking_model  = payload.get("thinking_model")
        if not question:
            return self._json({"ok": False, "error": "missing question"}, code=400)

        # Box Report ask: synthesize a report on the fly. Conversation history
        # lives at _box_conversations/<box_id>.jsonl. The ask path itself is
        # the same generic prompt assembly as workspace reports — Phase 1 keeps
        # the path simple; box-aware agent config is a Phase 2 concern.
        box_report_box = self._box_report_lookup(slug)
        if box_report_box is not None:
            report = self._box_report_synthesize(box_report_box)
            if report is None:
                return self._json({"ok": False, "error": "box folder missing"}, code=404)
        else:
            report, _d, err = self._reports_load(slug)
            if err:
                return self._json({"ok": False, "error": err}, code=404)
        documents = report.get("documents") or []

        # Build the document corpus for the model.
        PER_DOC_CAP = 6000
        TOTAL_CAP   = 24000
        doc_blocks = []
        running = 0
        for doc in documents:
            txt = (doc.get("extracted_text") or "").strip()
            if not txt: continue
            if len(txt) > PER_DOC_CAP:
                txt = txt[:PER_DOC_CAP] + "\n[... truncated ...]"
            block = f"### Document: {doc.get('filename') or doc.get('id')}\n({doc.get('type')} · {doc.get('size')} bytes)\n\n{txt}"
            if running + len(block) > TOTAL_CAP:
                doc_blocks.append("[remaining documents omitted — total context cap reached]")
                break
            doc_blocks.append(block)
            running += len(block)
        corpus = "\n\n".join(doc_blocks) if doc_blocks else "(no extractable text in any document)"

        system_prompt = (
            "You are Rodbot, reading documents the team uploaded. "
            "Answer in concise GitHub-flavored markdown. Use **bold** for key terms, "
            "bullets for lists, and `code` only for actual code/identifiers. "
            "Do NOT escape the markdown — return raw markdown characters."
        )
        user_prompt = (enhanced_prompt or question).strip()
        full_user = (
            f"{user_prompt}\n\n"
            f"---\n\n"
            f"DOCUMENTS:\n\n{corpus}\n"
        )

        # Provider routing — same convention as _intake_classify: prefer OpenAI
        # if available (faster), fall back to Claude Code subprocess.
        provider = "openai" if ENV.get("OPENAI_API_KEY") else "claude_code"
        chat_payload = {
            "provider": provider,
            "timeout":  120,
            "system":   system_prompt,
            "messages": [{
                "role": "user",
                "content": [{"type": "text", "text": full_user}],
            }],
        }
        reply, route_tag, perr = self._intake_dispatch_chat(chat_payload)
        if perr or not reply:
            # Fallback to the OTHER provider once.
            fallback = "claude_code" if provider == "openai" else "openai"
            if fallback == "openai" and not ENV.get("OPENAI_API_KEY"):
                return self._json({"ok": False, "error": perr or "no reply", "route": route_tag}, code=502)
            chat_payload["provider"] = fallback
            reply, route_tag, perr = self._intake_dispatch_chat(chat_payload)
            if perr or not reply:
                return self._json({"ok": False, "error": perr or "no reply", "route": route_tag}, code=502)

        now = _iso_now()
        qa = {
            "id":         f"qa_{uuid.uuid4().hex[:10]}",
            "question":   question,
            "answer":     reply,  # raw markdown — frontend renders via marked.parse()
            "ts":         now,
            "doc_count":  len(documents),
            "route":      route_tag or provider,
        }
        if enhanced_prompt:    qa["enhanced_prompt"] = enhanced_prompt
        if thinking_trace:     qa["thinking_trace"]  = thinking_trace
        if thinking_model:     qa["thinking_model"]  = thinking_model

        if box_report_box is not None:
            self._box_report_append_qa(slug, qa)
            ask_kind = "box_report_ask"
        else:
            self._reports_append_qa(slug, qa)
            # Bump last_modified on the workspace report only — box reports
            # derive last_modified from folder mtime on every read.
            report["last_modified"] = now
            self._reports_save(slug, report)
            ask_kind = "report_ask"
        self._activity_ledger_write({
            "ts": now,
            "kind": ask_kind,
            "actor": "ui",
            "slug": slug,
            "qa_id": qa["id"],
            "doc_count": len(documents),
            "route": qa["route"],
        })
        return self._json({"ok": True, "qa": qa})

    def _reports_doc_delete(self, slug, doc_id):
        if not self._reports_slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        if not re.fullmatch(r"[A-Za-z0-9_]+", doc_id or ""):
            return self._json({"ok": False, "error": "bad doc id"}, code=400)
        # Box Report documents are not deletable from Intake — the box owns
        # the file. Operators manage box files from the Boxes page.
        if self._box_report_lookup(slug) is not None:
            return self._json({
                "ok": False,
                "error": "box report documents live in the box; delete from the Boxes page instead",
            }, code=405)
        report, d, err = self._reports_load(slug)
        if err:
            return self._json({"ok": False, "error": err}, code=404)
        docs = report.get("documents") or []
        keep = []
        removed = None
        for doc in docs:
            if doc.get("id") == doc_id:
                removed = doc
                continue
            keep.append(doc)
        if not removed:
            return self._json({"ok": False, "error": "doc not found"}, code=404)
        # Try to delete the file
        stored = removed.get("stored_path")
        if stored:
            try:
                p = HERE / stored
                if p.exists() and p.is_file():
                    p.unlink()
            except Exception:
                pass
        report["documents"] = keep
        report["last_modified"] = _iso_now()
        self._reports_save(slug, report)
        self._activity_ledger_write({
            "ts": _iso_now(),
            "kind": "report_doc_delete",
            "actor": "ui",
            "slug": slug,
            "doc_id": doc_id,
            "filename": removed.get("filename"),
        })
        return self._json({"ok": True})

    def _reports_delete(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        slug = (payload.get("slug") or "").strip()
        if not self._reports_slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        # Box reports cannot be deleted via Intake — they exist iff their box exists.
        if self._box_report_lookup(slug) is not None:
            return self._json({"ok": False, "error": "box reports cannot be deleted from Intake"}, code=405)
        d = self._reports_root() / slug
        if not d.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            shutil.rmtree(d)
        except Exception as e:
            return self._json({"ok": False, "error": f"delete failed: {e}"}, code=500)
        self._activity_ledger_write({
            "ts": _iso_now(),
            "kind": "report_deleted",
            "actor": "ui",
            "slug": slug,
        })
        return self._json({"ok": True})

    # ════════════════════ BOX REPORTS (synthesized view) ═════════════════════
    # A Box Report is a synthesized view over a Client Box folder
    # (Auto/Client Boxes/<Name>/). No report.json is written into the box; the
    # documents[] payload is rebuilt on every read. Conversation history lives
    # at CCAgentindex/reports/_box_conversations/<box_id>.jsonl so it survives
    # box renames/removals without polluting the workspace reports list.
    #
    # Identity: a Box Report's slug == the box id from /api/boxes/list (e.g.,
    # "box_hugo_casillas" or a person_id like "hugo_casillas"). Detection is
    # by lookup against the live boxes catalog — no synthetic prefix.

    _BOX_REPORT_SKIP_DIRS = {"comms"}              # raw close.com payloads — too noisy
    _BOX_REPORT_INCLUDE_DIRS = {"intake_drops"}    # user-uploaded files via Intake
    _BOX_REPORT_DOC_TEXT_CAP = 200_000

    def _box_report_lookup(self, slug):
        """Return the client_box catalog row for `slug`, or None.
        Staff boxes are intentionally excluded in Phase 1.
        """
        if not slug:
            return None
        try:
            cat = self._boxes_catalog()
        except Exception:
            return None
        for b in cat.get("boxes", []):
            if (b.get("source_kind") or "") != "client_box":
                continue
            if (b.get("id") or "") == slug:
                return b
        return None

    def _box_report_conversation_path(self, box_id):
        return self._reports_root() / "_box_conversations" / f"{box_id}.jsonl"

    def _box_report_read_conversation(self, box_id):
        p = self._box_report_conversation_path(box_id)
        if not p.exists(): return []
        out = []
        try:
            with p.open("r", encoding="utf-8") as fh:
                for line in fh:
                    line = line.strip()
                    if not line: continue
                    try: out.append(json.loads(line))
                    except Exception: pass
        except Exception:
            pass
        return out

    def _box_report_append_qa(self, box_id, qa):
        p = self._box_report_conversation_path(box_id)
        p.parent.mkdir(parents=True, exist_ok=True)
        with p.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(qa, ensure_ascii=False) + "\n")

    def _box_report_iter_files(self, folder):
        """Yield Path objects for files that should appear as documents.
        Includes folder root + intake_drops/. Skips comms/, hidden files,
        and anything outside the include set."""
        if not folder.exists():
            return
        # Root files
        for child in sorted(folder.iterdir(), key=lambda p: p.name.lower()):
            if child.name.startswith("."):
                continue
            if child.is_file():
                yield child
        # Whitelisted subdirectories
        for sub_name in sorted(self._BOX_REPORT_INCLUDE_DIRS):
            sub = folder / sub_name
            if not sub.exists() or not sub.is_dir():
                continue
            for child in sorted(sub.rglob("*"), key=lambda p: str(p).lower()):
                if child.name.startswith("."):
                    continue
                if child.is_file():
                    yield child

    def _box_report_doc_id(self, folder, file_path):
        """Stable id from the path relative to the box folder."""
        try:
            rel = str(file_path.relative_to(folder))
        except ValueError:
            rel = file_path.name
        h = hashlib.sha1(rel.encode("utf-8")).hexdigest()[:10]
        return f"box_doc_{h}"

    def _box_report_mime_for(self, file_path):
        ext = file_path.suffix.lower().lstrip(".")
        # Extension → mime mapping mirroring _reports_ext_from in reverse.
        ext_to_mime = {
            "md": "text/markdown", "markdown": "text/markdown",
            "txt": "text/plain", "log": "text/plain",
            "json": "application/json", "jsonl": "application/json",
            "csv": "text/csv", "tsv": "text/tab-separated-values",
            "html": "text/html", "htm": "text/html",
            "yaml": "text/plain", "yml": "text/plain",
            "xml": "text/xml", "toml": "text/plain", "ini": "text/plain",
            "pdf": "application/pdf",
            "png": "image/png", "jpg": "image/jpeg", "jpeg": "image/jpeg",
            "gif": "image/gif", "webp": "image/webp", "svg": "image/svg+xml",
            "heic": "image/heic", "heif": "image/heif",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "xls":  "application/vnd.ms-excel",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "doc":  "application/msword",
        }
        return ext_to_mime.get(ext, "application/octet-stream")

    def _box_report_extract_text(self, file_path, mime):
        """Cheap text extraction for synthesis. Skips OCR (would re-OCR every
        page load) — images get a binary placeholder instead. PDFs/xlsx/docx
        delegate to the existing extract helpers when raw bytes are loaded.
        """
        textish_ext = {
            "md", "markdown", "txt", "csv", "tsv", "json", "jsonl",
            "log", "yaml", "yml", "xml", "html", "htm", "toml", "ini", "env",
            "js", "jsx", "ts", "tsx", "py", "rb", "go", "rs", "java", "kt",
            "swift", "c", "cpp", "h", "hpp", "cs", "php", "sh", "sql",
        }
        ext = file_path.suffix.lower().lstrip(".")
        m = (mime or "").lower()
        try:
            size = file_path.stat().st_size
        except Exception:
            size = 0
        if m.startswith("text/") or m in ("application/json", "application/javascript", "text/javascript") or ext in textish_ext:
            return _safe_text_read(file_path, max_chars=self._BOX_REPORT_DOC_TEXT_CAP)
        if m.startswith("image/"):
            return f"[image: {file_path.name}, {size} bytes] — OCR skipped during synthesis (open in Boxes for visual review)."
        # For pdf/xlsx/docx, defer to the heavier extractor on read. This is
        # cheap because most boxes have no such files; client boxes are mostly
        # markdown + json.
        try:
            raw = file_path.read_bytes()
        except Exception as e:
            return f"[read failed: {e}]"
        text, _err = self._reports_extract_text(raw, mime, file_path.name, stored_path=file_path)
        if text and len(text) > self._BOX_REPORT_DOC_TEXT_CAP:
            text = text[:self._BOX_REPORT_DOC_TEXT_CAP] + "\n\n[... truncated ...]"
        return text or f"[binary: {file_path.name}, {mime}, {size} bytes]"

    def _box_report_synthesize(self, box):
        """Build a report dict from a client_box catalog row.
        Shape matches workspace report.json so IntakeReportDetail can render
        it unchanged. Documents are read on demand; nothing is written into
        the box folder.
        """
        folder = Path(box.get("folder_abs") or "")
        if not folder.exists():
            return None
        documents = []
        newest_mtime = 0.0
        for fp in self._box_report_iter_files(folder):
            try:
                stat = fp.stat()
            except Exception:
                continue
            newest_mtime = max(newest_mtime, stat.st_mtime)
            mime = self._box_report_mime_for(fp)
            text = self._box_report_extract_text(fp, mime)
            try:
                rel_to_here = str(fp.relative_to(HERE))
            except ValueError:
                rel_to_here = str(fp)
            try:
                rel_to_box = str(fp.relative_to(folder))
            except ValueError:
                rel_to_box = fp.name
            doc = {
                "id":             self._box_report_doc_id(folder, fp),
                "filename":       fp.name,
                "mime":           mime,
                "type":           self._reports_doc_type_from_mime(mime, fp.name),
                "size":           int(stat.st_size),
                "uploaded_at":    datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat().replace("+00:00", "Z"),
                "extracted_text": text or "",
                "summary":        (text or "")[:200].strip().replace("\n", " "),
                "stored_path":    rel_to_here,
                "rel_to_box":     rel_to_box,
                "source":         "box_synthesis",
            }
            documents.append(doc)

        last_modified = (
            datetime.fromtimestamp(newest_mtime, tz=timezone.utc).isoformat().replace("+00:00", "Z")
            if newest_mtime else None
        )
        # created_at: prefer harvested_at from box meta if present, else the
        # folder's ctime, else last_modified.
        meta = box.get("meta") or {}
        harvested = meta.get("harvested_at")
        if harvested:
            created_at = harvested
        else:
            try:
                created_at = datetime.fromtimestamp(folder.stat().st_ctime, tz=timezone.utc).isoformat().replace("+00:00", "Z")
            except Exception:
                created_at = last_modified

        return {
            "slug":          box.get("id"),
            "name":          box.get("name") or box.get("folder_name") or box.get("id"),
            "description":   None,
            "created_at":    created_at,
            "last_modified": last_modified,
            "documents":     documents,
            "source":        "box_synthesis",
            "box": {
                "id":           box.get("id"),
                "kind":         box.get("kind"),
                "source_kind":  box.get("source_kind"),
                "folder_rel":   box.get("folder_rel"),
                "person_id":    box.get("person_id"),
            },
        }

    def _box_report_ingest(self, box, body):
        """Drop a file into Auto/Client Boxes/<Name>/intake_drops/ so the next
        synthesis pass picks it up automatically."""
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        upload_path = (payload.get("upload_path") or "").strip()
        mime        = (payload.get("mime") or "application/octet-stream").strip()
        filename    = (payload.get("filename") or "file").strip()
        if not upload_path:
            return self._json({"ok": False, "error": "missing upload_path"}, code=400)
        src = Path(upload_path)
        if not src.exists():
            return self._json({"ok": False, "error": f"upload not found at {upload_path}"}, code=404)

        folder = Path(box.get("folder_abs") or "")
        if not folder.exists():
            return self._json({"ok": False, "error": "box folder missing"}, code=404)
        drops = folder / "intake_drops"
        try:
            drops.mkdir(parents=True, exist_ok=True)
        except Exception as e:
            return self._json({"ok": False, "error": f"could not create intake_drops: {e}"}, code=500)

        # Sanitize filename, then dedupe with a short suffix on collision.
        safe_name = re.sub(r"[^A-Za-z0-9._\- ]+", "_", filename).strip() or "file"
        target = drops / safe_name
        if target.exists():
            stem = target.stem
            ext = target.suffix
            target = drops / f"{stem}_{uuid.uuid4().hex[:6]}{ext}"

        try:
            raw = src.read_bytes()
            target.write_bytes(raw)
        except Exception as e:
            return self._json({"ok": False, "error": f"write failed: {e}"}, code=500)

        now = _iso_now()
        try:
            rel_to_here = str(target.relative_to(HERE))
        except ValueError:
            rel_to_here = str(target)
        self._activity_ledger_write({
            "ts": now,
            "kind": "intake_drop",
            "actor": "ui",
            "slug": box.get("id"),
            "target": rel_to_here,
            "filename": safe_name,
            "mime": mime,
            "size": len(raw),
        })
        # Synthesize the new doc descriptor so the UI can render it immediately.
        doc_mime = mime or self._box_report_mime_for(target)
        text = self._box_report_extract_text(target, doc_mime)
        try:
            rel_to_box = str(target.relative_to(folder))
        except ValueError:
            rel_to_box = target.name
        doc_entry = {
            "id":             self._box_report_doc_id(folder, target),
            "filename":       target.name,
            "mime":           doc_mime,
            "type":           self._reports_doc_type_from_mime(doc_mime, target.name),
            "size":           len(raw),
            "uploaded_at":    now,
            "extracted_text": (text or "")[:self._BOX_REPORT_DOC_TEXT_CAP],
            "summary":        (text or "")[:200].strip().replace("\n", " "),
            "stored_path":    rel_to_here,
            "rel_to_box":     rel_to_box,
            "source":         "box_synthesis",
        }
        return self._json({"ok": True, "document": doc_entry})

    def _api_or_404(self):
        p = self._api_path()
        if p.startswith("/api/proxy/"):
            return self._proxy()
        if p.startswith("/api/ledger/") and p.endswith("/append"):
            # POST /api/ledger/<name>/append  → append one event to the named ledger
            name = p[len("/api/ledger/"):-len("/append")]
            length = int(self.headers.get("Content-Length") or 0)
            return self._ledger_append(name, self.rfile.read(length) if length else b"")
        if p == "/api/delegate":
            length = int(self.headers.get("Content-Length") or 0)
            return self._delegate_dispatch(self.rfile.read(length) if length else b"")
        if p == "/api/settings/mcp_credentials/save":
            length = int(self.headers.get("Content-Length") or 0)
            return self._settings_mcp_credentials_save(self.rfile.read(length) if length else b"")
        if p in (
            "/api/delegations/drafts/create",
            "/api/delegations/drafts/update",
            "/api/delegations/drafts/delete",
            "/api/delegations/drafts/submit",
            "/api/delegations/drafts/rewrite",
            "/api/delegations/drafts/undo",
        ):
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length) if length else b""
            if p.endswith("/create"):
                return self._delegation_draft_create(raw)
            if p.endswith("/update"):
                return self._delegation_draft_update(raw)
            if p.endswith("/delete"):
                return self._delegation_draft_delete(raw)
            if p.endswith("/submit"):
                return self._delegation_draft_submit(raw)
            if p.endswith("/rewrite"):
                return self._delegation_draft_rewrite(raw)
            if p.endswith("/undo"):
                return self._delegation_draft_undo(raw)
        if p == "/api/send/whatsapp":
            length = int(self.headers.get("Content-Length") or 0)
            return self._send_whatsapp(self.rfile.read(length) if length else b"")
        if p in ("/api/cells/retire", "/api/cells/recurring", "/api/cells/reject"):
            length = int(self.headers.get("Content-Length") or 0)
            kind = p.rsplit("/", 1)[-1]
            return self._cells_action(kind, self.rfile.read(length) if length else b"")
        if p.startswith("/api/agents/") and p.endswith("/run"):
            # Generic sub-agent runner: POST /api/agents/<name>/run dispatches
            # the agent's prompt.md through the delegation pipeline. Works for
            # any agents/<name>/ folder that carries a prompt.md.
            length = int(self.headers.get("Content-Length") or 0)
            name = p[len("/api/agents/"):-len("/run")]
            return self._agent_run(name, self.rfile.read(length) if length else b"")
        if p == "/api/pieces/ask":
            length = int(self.headers.get("Content-Length") or 0)
            return self._pieces_ask_post(self.rfile.read(length) if length else b"")
        if p == "/api/pieces/sweep":
            length = int(self.headers.get("Content-Length") or 0)
            return self._pieces_sweep_post(self.rfile.read(length) if length else b"")
        if p == "/api/claude_code/generate":
            # Synchronous text-generation endpoint. Mirrors the OpenAI Responses
            # shape so ai.js can switch providers with minimal divergence.
            # Uses --max-turns 1 --output-format text for speed.
            length = int(self.headers.get("Content-Length") or 0)
            return self._claude_code_generate(self.rfile.read(length) if length else b"")
        if p == "/api/codex_cli/generate":
            # Synchronous Codex CLI endpoint. Uses `codex exec` with the selected
            # model and a read-only sandbox so only the selected CLI handles the turn.
            length = int(self.headers.get("Content-Length") or 0)
            return self._codex_cli_generate(self.rfile.read(length) if length else b"")
        if p == "/api/computer_use/handoff":
            # Local desktop bridge: copy a structured prompt and paste/send it
            # into the already-open Codex Desktop app, where Computer Use lives.
            length = int(self.headers.get("Content-Length") or 0)
            return self._computer_use_handoff(self.rfile.read(length) if length else b"")
        if p == "/api/browser_use/handoff":
            # Background browser bridge: run a headless Playwright job and
            # let the chat rail poll the job result without stealing focus.
            length = int(self.headers.get("Content-Length") or 0)
            return self._browser_use_handoff(self.rfile.read(length) if length else b"")
        if p == "/api/browser_open/handoff":
            # Visible browser bridge: open Chrome/browser for the operator.
            length = int(self.headers.get("Content-Length") or 0)
            return self._browser_open_handoff(self.rfile.read(length) if length else b"")
        if p == "/api/chat/send":
            # Multi-turn chat. Client sends full transcript each turn; we
            # relay to the active provider. Server is a pure relay — all
            # persistence lives client-side and in the chat ledger.
            length = int(self.headers.get("Content-Length") or 0)
            return self._chat_send(self.rfile.read(length) if length else b"")
        if p == "/api/chat/preprocess":
            # Optional pre-flight: pass user message through gpt-5.4-mini to
            # (1) rewrite it as a clearer Claude prompt and (2) generate a
            # short list of flavor strings the UI can animate as a "thinking
            # trace" while Claude works. See _chat_preprocess.
            length = int(self.headers.get("Content-Length") or 0)
            return self._chat_preprocess(self.rfile.read(length) if length else b"")
        if p.startswith("/api/accomplishments/"):
            # POST /api/accomplishments/<YYYY-MM-DD>  → freeze a day's rollup
            slug = p[len("/api/accomplishments/"):]
            length = int(self.headers.get("Content-Length") or 0)
            return self._accomplishments_write(slug, self.rfile.read(length) if length else b"")
        if p == "/api/streak":
            length = int(self.headers.get("Content-Length") or 0)
            return self._streak_write(self.rfile.read(length) if length else b"")
        if p == "/api/attachments/upload":
            length = int(self.headers.get("Content-Length") or 0)
            return self._attachment_upload(self.rfile.read(length) if length else b"")
        if p == "/api/workflows/save":
            length = int(self.headers.get("Content-Length") or 0)
            return self._workflow_save(self.rfile.read(length) if length else b"")
        if p == "/api/catalog/edges/save":
            length = int(self.headers.get("Content-Length") or 0)
            return self._catalog_edge_save(self.rfile.read(length) if length else b"")
        if p == "/api/catalog/edges/delete":
            length = int(self.headers.get("Content-Length") or 0)
            return self._catalog_edge_delete(self.rfile.read(length) if length else b"")
        if p == "/api/catalog/edges/bump_usage":
            length = int(self.headers.get("Content-Length") or 0)
            return self._catalog_edge_bump_usage(self.rfile.read(length) if length else b"")
        if p == "/api/triggers/save":
            length = int(self.headers.get("Content-Length") or 0)
            return self._trigger_save(self.rfile.read(length) if length else b"")
        if p == "/api/triggers/delete":
            length = int(self.headers.get("Content-Length") or 0)
            return self._trigger_delete(self.rfile.read(length) if length else b"")
        if p == "/api/agent_plans/save":
            length = int(self.headers.get("Content-Length") or 0)
            return self._agent_plan_save(self.rfile.read(length) if length else b"")
        if p == "/api/agent_plans/delete":
            length = int(self.headers.get("Content-Length") or 0)
            return self._agent_plan_delete(self.rfile.read(length) if length else b"")
        if p == "/api/hooks/toggle":
            length = int(self.headers.get("Content-Length") or 0)
            return self._hook_toggle(self.rfile.read(length) if length else b"")
        if p == "/api/annotations/upload":
            length = int(self.headers.get("Content-Length") or 0)
            return self._annotations_upload(self.rfile.read(length) if length else b"")
        if p == "/api/intake/classify":
            length = int(self.headers.get("Content-Length") or 0)
            return self._intake_classify(self.rfile.read(length) if length else b"")
        if p == "/api/intake/route":
            length = int(self.headers.get("Content-Length") or 0)
            return self._intake_route(self.rfile.read(length) if length else b"")
        if p == "/api/intake/report":
            length = int(self.headers.get("Content-Length") or 0)
            return self._intake_report(self.rfile.read(length) if length else b"")
        # Reports (Smorgasbord) — universal-intake workspaces
        if p == "/api/reports/create":
            length = int(self.headers.get("Content-Length") or 0)
            return self._reports_create(self.rfile.read(length) if length else b"")
        if p == "/api/reports/delete":
            length = int(self.headers.get("Content-Length") or 0)
            return self._reports_delete(self.rfile.read(length) if length else b"")
        if p.startswith("/api/reports/") and p.endswith("/ingest"):
            slug = p[len("/api/reports/"):-len("/ingest")]
            length = int(self.headers.get("Content-Length") or 0)
            return self._reports_ingest(slug, self.rfile.read(length) if length else b"")
        if p.startswith("/api/reports/") and p.endswith("/ask"):
            slug = p[len("/api/reports/"):-len("/ask")]
            length = int(self.headers.get("Content-Length") or 0)
            return self._reports_ask(slug, self.rfile.read(length) if length else b"")
        # POST /api/reports/<slug>/documents/<docId>/delete
        m_doc_del = re.match(r"^/api/reports/([^/]+)/documents/([^/]+)/delete$", p)
        if m_doc_del:
            length = int(self.headers.get("Content-Length") or 0)
            # Drain body even if we don't use it.
            if length: self.rfile.read(length)
            return self._reports_doc_delete(m_doc_del.group(1), m_doc_del.group(2))
        if p == "/api/grid_affinity":
            length = int(self.headers.get("Content-Length") or 0)
            return self._grid_affinity_write(self.rfile.read(length) if length else b"")
        return self._json(
            {"ok": False, "error": "not found", "method": self.command, "path": p},
            code=404,
        )

    def _chat_send(self, body):
        """Multi-turn chat relay. {messages, system?, provider, model?, timeout?}.
        Returns {ok, reply, provider_route}. No server-side state.

        Each message.content is either a string (legacy) or a list of parts:
          [{ "type": "text", "text": "..." },
           { "type": "image", "url": "/rel/path", "path": "/abs/path", "mime": "image/png" }]
        We fan out per-provider: Claude Code gets text + image-path references
        (Claude Code's default toolset can Read the file); OpenAI gets proper
        input_image blocks with base64-encoded data URLs.
        """
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        messages = payload.get("messages") or []
        system   = (payload.get("system") or "").strip()
        provider = payload.get("provider") or "claude_code"
        timeout_s = int(payload.get("timeout") or 120)
        if not messages:
            return self._json({"ok": False, "error": "missing messages"}, code=400)

        def _parts(m):
            """Normalize a message to a list of parts."""
            c = m.get("content")
            if isinstance(c, list): return c
            if isinstance(c, str):  return [{"type": "text", "text": c}] if c.strip() else []
            return []

        def _text_only(m):
            return "\n".join(p.get("text","") for p in _parts(m) if p.get("type") == "text").strip()

        def _attachments(m):
            return [p for p in _parts(m) if p.get("type") == "image"]

        if provider == "claude_code":
            if not CLAUDE_BIN:
                return self._json({"ok": False, "error": "claude binary not found"}, code=503)
            # Render the transcript as a single prompt; -p is one-shot.
            # The Rodbot system prompt is passed via --system-prompt so Claude
            # Code REPLACES its default assistant identity with hers.
            # Images are referenced by absolute path — Claude Code's default
            # toolset includes Read so it can open them.
            lines = []
            for m in messages:
                role = m.get("role", "user")
                text = _text_only(m)
                atts = _attachments(m)
                if not text and not atts: continue
                body_lines = [text] if text else []
                for a in atts:
                    path = a.get("path") or a.get("url") or ""
                    if path:
                        body_lines.append(f"[attached image — read with your Read tool: {path}]")
                body = "\n".join(body_lines).strip()
                if role == "user":        lines.append(f"USER: {body}")
                elif role == "assistant": lines.append(f"ASSISTANT: {body}")
                elif role == "system":    lines.append(f"SYSTEM NOTE: {body}")
                else:                     lines.append(f"{role.upper()}: {body}")
            lines.append("ASSISTANT:")
            transcript = "\n\n".join(lines)
            cmd = [CLAUDE_BIN, "-p", "--max-turns", "3", "--output-format", "text"]
            if system:
                cmd += ["--system-prompt", system]
            try:
                proc = subprocess.run(
                    cmd, input=transcript,
                    capture_output=True, text=True, timeout=timeout_s,
                )
                if proc.returncode != 0:
                    return self._json({
                        "ok": False, "error": f"claude exit {proc.returncode}",
                        "stderr": (proc.stderr or "")[-2000:],
                    }, code=502)
                return self._json({
                    "ok": True,
                    "reply": (proc.stdout or "").strip(),
                    "provider_route": "claude-code-subprocess",
                })
            except subprocess.TimeoutExpired:
                return self._json({"ok": False, "error": f"timeout after {timeout_s}s"}, code=504)
            except Exception as e:
                return self._json({"ok": False, "error": f"{type(e).__name__}: {e}"}, code=500)

        if provider == "codex_cli":
            if not CODEX_BIN:
                return self._json({"ok": False, "error": "codex binary not found"}, code=503)
            lines = []
            image_paths = []
            for m in messages:
                role = m.get("role", "user")
                text = _text_only(m)
                atts = _attachments(m)
                if not text and not atts:
                    continue
                body_lines = [text] if text else []
                for a in atts:
                    path = a.get("path") or a.get("url") or ""
                    if path:
                        image_paths.append(path)
                        body_lines.append(f"[attached image: {path}]")
                body = "\n".join(body_lines).strip()
                if role == "user":        lines.append(f"USER: {body}")
                elif role == "assistant": lines.append(f"ASSISTANT: {body}")
                elif role == "system":    lines.append(f"SYSTEM NOTE: {body}")
                else:                     lines.append(f"{role.upper()}: {body}")
            lines.append("ASSISTANT:")
            transcript = _build_codex_prompt(system, "\n\n".join(lines))
            text, stderr, err = _run_codex_exec(
                transcript,
                model=payload.get("model") or "gpt-5.4-mini",
                timeout_s=timeout_s,
                image_paths=image_paths,
            )
            if err:
                return self._json({
                    "ok": False,
                    "error": err,
                    "stderr": stderr[-2000:] if stderr else "",
                }, code=502 if "exit" in err else 504 if "timeout" in err else 500)
            return self._json({
                "ok": True,
                "reply": text.strip(),
                "provider_route": "codex-cli-subprocess",
            })

        # OpenAI Responses — multi-turn via input array with multimodal parts.
        if not ENV.get("OPENAI_API_KEY"):
            return self._json({"ok": False, "error": "OPENAI_API_KEY not set on server"}, code=503)

        def _openai_content(m, role):
            """Convert parts into the Responses API content-block shape.
            Text → input_text; image → input_image with base64 data URL."""
            out = []
            text_type = "output_text" if role == "assistant" else "input_text"
            for p in _parts(m):
                if p.get("type") == "text" and (p.get("text") or "").strip():
                    out.append({"type": text_type, "text": p["text"]})
                elif p.get("type") == "image":
                    path = p.get("path") or ""
                    mime = p.get("mime") or "image/png"
                    if not path or not Path(path).exists():
                        # Fall back to a text reference if we can't read the file.
                        out.append({"type": text_type, "text": f"(image attached but unreadable at {path})"})
                        continue
                    try:
                        data = base64.b64encode(Path(path).read_bytes()).decode("ascii")
                        if role == "assistant":
                            out.append({"type": "output_text", "text": f"(assistant image omitted: {path})"})
                        else:
                            out.append({"type": "input_image", "image_url": f"data:{mime};base64,{data}"})
                    except Exception as e:
                        out.append({"type": text_type, "text": f"(image read failed: {e})"})
            return out

        input_msgs = []
        for m in messages:
            # Responses API accepts conversation roles, not local UI roles like
            # "system" or "tool" that can appear in the chat rail history.
            role = m.get("role", "user")
            if role not in ("user", "assistant"):
                role = "assistant"
            c = _openai_content(m, role)
            if not c: continue
            input_msgs.append({"role": role, "content": c})

        req_body = {
            "model": payload.get("model") or "gpt-5.4-mini",
            "input": input_msgs,
        }
        if system:
            req_body["instructions"] = system
        try:
            req = urllib.request.Request("https://api.openai.com/v1/responses",
                data=json.dumps(req_body).encode(), method="POST")
            req.add_header("Content-Type", "application/json")
            req.add_header("Authorization", f"Bearer {ENV.get('OPENAI_API_KEY').strip()}")
            with urllib.request.urlopen(req, timeout=timeout_s) as resp:
                data = json.loads(resp.read().decode())
            text = data.get("output_text") or ""
            if not text and isinstance(data.get("output"), list):
                parts = []
                for item in data["output"]:
                    for c in (item.get("content") or []):
                        if isinstance(c.get("text"), str): parts.append(c["text"])
                text = "\n".join(parts).strip()
            return self._json({"ok": True, "reply": text, "provider_route": "openai-server-proxy"})
        except urllib.error.HTTPError as e:
            return self._json({"ok": False, "error": f"openai {e.code}", "detail": e.read().decode()[:600]}, code=502)
        except Exception as e:
            return self._json({"ok": False, "error": f"{type(e).__name__}: {e}"}, code=500)

    # ────── Chat preprocess — gpt-5.4-mini prompt rewrite + thinking trace
    # POST /api/chat/preprocess
    #   body: { "message": "...", "attachments": [{filename, mime, size}, ...] }
    # Returns: { ok, enhanced_prompt, thinking_trace[], model }
    # Thin OpenAI Responses-API call using a compact instructions block that
    # forces strict JSON output. Falls back gracefully on any error so the
    # main chat send still works. Demo win: the trace is *contextual* — the
    # mini model reads the question and emits steps that feel earned.
    def _chat_preprocess(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        if not ENV.get("OPENAI_API_KEY"):
            return self._json({"ok": False, "error": "no OPENAI_API_KEY"}, code=503)
        message = (payload.get("message") or "").strip()
        if not message:
            return self._json({"ok": False, "error": "missing message"}, code=400)
        attachments = payload.get("attachments") or []
        att_summary = ""
        if attachments:
            bits = []
            for a in attachments[:6]:
                bits.append(f"{a.get('original_filename') or a.get('filename') or 'file'} ({a.get('mime') or 'file'})")
            att_summary = " · attachments: " + ", ".join(bits)
        model = (payload.get("model") or "gpt-5.4-mini").strip()
        instructions = (
            "You are a prompt-engineering co-pilot. Given an operator's raw chat message, do TWO things and return ONLY a single strict JSON object — no markdown, no prose. "
            "Schema: {\"enhanced_prompt\": string, \"thinking_trace\": string[]}.\n\n"
            "(1) enhanced_prompt: rewrite the operator's message as a clearer, more directed prompt for Claude. "
            "Preserve their voice and intent exactly; just sharpen the ask. Keep it concise. Do NOT add greetings, apologies, or meta. "
            "If the message is already a clean prompt, return it nearly verbatim.\n\n"
            "(2) thinking_trace: 6 to 9 short flavor strings (3-7 words each) that describe what an AI orchestrator would actually be doing, step by step, while answering this specific question. "
            "Make them concrete and contextual — name the systems/people/concepts the operator mentioned. "
            "No emoji. No trailing punctuation. Imperative or present-continuous voice. "
            "Examples for 'where am I with Andre on the Marriott deck': "
            "[\"Pulling Andre's recent activity\", \"Reading the Marriott deck history\", \"Checking the latest sweep for edits\", \"Cross-referencing pricing tier DMs\", \"Composing the answer\"]"
        )
        req_body = {
            "model": model,
            "input": [{"role": "user", "content": [{"type": "input_text", "text": message + att_summary}]}],
            "instructions": instructions,
        }
        try:
            req = urllib.request.Request("https://api.openai.com/v1/responses",
                data=json.dumps(req_body).encode(), method="POST")
            req.add_header("Content-Type", "application/json")
            req.add_header("Authorization", f"Bearer {ENV.get('OPENAI_API_KEY').strip()}")
            with urllib.request.urlopen(req, timeout=20) as resp:
                data = json.loads(resp.read().decode())
            text = data.get("output_text") or ""
            if not text and isinstance(data.get("output"), list):
                parts = []
                for item in data["output"]:
                    for c in (item.get("content") or []):
                        if isinstance(c.get("text"), str): parts.append(c["text"])
                text = "\n".join(parts).strip()
            # Try to parse the strict JSON the model was instructed to return.
            # Be forgiving: if it wrapped the JSON in fences, strip them.
            cleaned = text.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
                cleaned = re.sub(r"\s*```$", "", cleaned)
            parsed = None
            try:
                parsed = json.loads(cleaned)
            except Exception:
                # Try to grab the first {...} block.
                m = re.search(r"\{[\s\S]+\}", cleaned)
                if m:
                    try: parsed = json.loads(m.group(0))
                    except Exception: parsed = None
            if not isinstance(parsed, dict):
                return self._json({"ok": False, "error": "model did not return valid JSON", "raw": text[:600]}, code=502)
            enhanced = (parsed.get("enhanced_prompt") or message).strip()
            trace = parsed.get("thinking_trace") or []
            if not isinstance(trace, list):
                trace = []
            trace = [str(t).strip() for t in trace if t][:12]
            return self._json({
                "ok": True,
                "enhanced_prompt": enhanced,
                "thinking_trace": trace,
                "model": model,
            })
        except urllib.error.HTTPError as e:
            return self._json({"ok": False, "error": f"openai {e.code}", "detail": e.read().decode()[:600]}, code=502)
        except Exception as e:
            return self._json({"ok": False, "error": f"{type(e).__name__}: {e}"}, code=500)

    # ────── WhatsApp via Twilio ──────────────────────────────────────────
    # POST /api/send/whatsapp
    #   body: { "to": "+19785551234" | "whatsapp:+19785551234",
    #           "body": "...text...",
    #           OR "contentSid": "HX...", "contentVariables": { "1": "..." },
    #           "from": "whatsapp:+14155238886" (optional — falls back to env),
    #           "useTest": true/false (optional — routes through test creds) }
    # On success, writes one line to _ledger/activity.jsonl and returns the
    # Twilio response envelope.
    def _send_whatsapp(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)

        to = (payload.get("to") or "").strip()
        text = (payload.get("body") or "").strip()
        content_sid = (payload.get("contentSid") or "").strip()
        content_vars = payload.get("contentVariables") or {}
        from_num = (payload.get("from") or ENV.get("TWILIO_WHATSAPP_FROM") or "").strip()
        use_test = bool(payload.get("useTest"))

        if not to:
            return self._json({"ok": False, "error": "missing 'to'"}, code=400)
        if not (text or content_sid):
            return self._json({"ok": False, "error": "need either 'body' or 'contentSid'"}, code=400)
        if not from_num:
            return self._json({"ok": False, "error": "no sender — set TWILIO_WHATSAPP_FROM or pass 'from'"}, code=400)

        # Normalize — Twilio WhatsApp numbers need the whatsapp: prefix.
        if not to.startswith("whatsapp:"):
            to = "whatsapp:" + to
        if not from_num.startswith("whatsapp:"):
            from_num = "whatsapp:" + from_num

        if use_test:
            acct = ENV.get("TWILIO_TEST_ACCOUNT_SID", "").strip()
            tok  = ENV.get("TWILIO_TEST_AUTH_TOKEN", "").strip()
            basic = base64.b64encode(f"{acct}:{tok}".encode()).decode()
        else:
            acct = ENV.get("TWILIO_ACCOUNT_SID", "").strip()
            basic = _twilio_basic()

        if not acct:
            return self._json({"ok": False, "error": "TWILIO_ACCOUNT_SID not set"}, code=500)

        url = f"https://api.twilio.com/2010-04-01/Accounts/{acct}/Messages.json"
        form = {"To": to, "From": from_num}
        if content_sid:
            form["ContentSid"] = content_sid
            if content_vars:
                form["ContentVariables"] = json.dumps(content_vars)
        else:
            form["Body"] = text

        data = urllib.parse.urlencode(form).encode()
        req = urllib.request.Request(url, data=data, method="POST")
        req.add_header("Authorization", f"Basic {basic}")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")

        started = _iso_now()
        try:
            with urllib.request.urlopen(req, timeout=20) as resp:
                result_body = resp.read().decode("utf-8", "replace")
                try:
                    result = json.loads(result_body)
                except Exception:
                    result = {"raw": result_body}
            ok = True
            err = None
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", "replace") if e.fp else ""
            try:
                result = json.loads(err_body)
            except Exception:
                result = {"raw": err_body}
            ok = False
            err = f"HTTP {e.code}"
        except Exception as e:
            result = None
            ok = False
            err = f"{type(e).__name__}: {e}"

        # Append to activity ledger regardless — one line per send attempt.
        try:
            ledger_path = HERE / "CCAgentindex" / "_ledger" / "activity.jsonl"
            ledger_path.parent.mkdir(parents=True, exist_ok=True)
            event = {
                "ts": started,
                "kind": "whatsapp_send_attempt" if not ok else "whatsapp_send",
                "actor": "server",
                "to": to,
                "from": from_num,
                "mode": "test" if use_test else "live",
                "template_sid": content_sid or None,
                "message_sid": (result or {}).get("sid"),
                "status": (result or {}).get("status"),
                "ok": ok,
                "error": err,
            }
            with ledger_path.open("a", encoding="utf-8") as f:
                f.write(json.dumps(event, ensure_ascii=False) + "\n")
        except Exception:
            pass

        return self._json({
            "ok": ok,
            "error": err,
            "mode": "test" if use_test else "live",
            "twilio": result,
        }, code=200 if ok else 502)

    # ────── Grid cell actions: retire / recurring / reject ───────────────
    # POST /api/cells/retire    { gridId, cellId, headline, preview, why? }
    # POST /api/cells/recurring { gridId, cellId, headline, preview, cadence }
    #                              cadence ∈ {"daily","weekdays","weekly","biweekly","monthly"}
    # POST /api/cells/reject    { gridId, cellId, headline, preview, reason }
    #
    # Each writes to its own jsonl ledger AND a mirror line on activity.jsonl.
    # The scorer reads retired / rejected ledgers to suppress future look-alikes;
    # recurring feeds the morning grid generator.
    # ────── Pieces LTM — public endpoints ────────────────────────────────
    # GET  /api/pieces/status            → { available, session_id }
    # GET  /api/pieces/ask?q=...         → last ~2hr context, default question
    # POST /api/pieces/ask  { question } → run ask_pieces_ltm against Pieces
    def _pieces_status(self):
        return self._json({
            "available": _pieces_available(),
            "session_id": _PIECES["session_id"],
            "url": PIECES_MCP_URL,
        })

    # Default Pieces chat LLM. Pieces fronts the inference cost for whichever
    # model we name here, so this directly controls our API spend (gpt-4o is
    # free via Pieces, claude-sonnet-4-5 routes through Anthropic). The
    # Settings → Pieces section overrides this per-request via chat_llm.
    PIECES_DEFAULT_LLM = os.environ.get("PIECES_CHAT_LLM", "claude-sonnet-4-5")

    def _pieces_call_ask(self, question, chat_llm=None):
        """Call ask_pieces_ltm with required args, return extracted text blob.
        chat_llm may be overridden per-call (Settings model picker)."""
        if not _pieces_available():
            return {"ok": False, "error": "pieces MCP unreachable at " + PIECES_MCP_URL}
        model = (chat_llm or self.PIECES_DEFAULT_LLM or "claude-sonnet-4-5").strip()
        try:
            resp = _pieces_rpc({
                "jsonrpc": "2.0", "id": uuid.uuid4().int & 0xffffffff,
                "method": "tools/call",
                "params": {
                    "name": "ask_pieces_ltm",
                    "arguments": {
                        "question": question,
                        "chat_llm": model,
                        "connected_client": "Comeketo Agent",
                    },
                },
            })
        except Exception as e:
            return {"ok": False, "error": f"{type(e).__name__}: {e}"}
        if not resp or "error" in resp:
            return {"ok": False, "error": (resp or {}).get("error", "no response")}
        content = (resp.get("result") or {}).get("content") or []
        text = "\n\n".join(c.get("text", "") for c in content if c.get("type") == "text")
        # The text Pieces returns is often a JSON blob — try to parse it so
        # the client gets structured data, but always keep the raw string too.
        parsed = None
        try:
            parsed = json.loads(text)
        except Exception:
            pass
        return {"ok": True, "question": question, "model": model, "raw": text, "data": parsed}

    def _pieces_ask_get(self):
        q = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(q)
        question = (params.get("q", [""])[0] or
                    "What has the team been working on in the last 2 hours?")
        chat_llm = params.get("chat_llm", [None])[0]
        return self._json(self._pieces_call_ask(question, chat_llm=chat_llm))

    def _pieces_ask_post(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        question = (payload.get("question") or "").strip()
        if not question:
            return self._json({"ok": False, "error": "missing 'question'"}, code=400)
        chat_llm = payload.get("chat_llm")  # optional Settings override
        return self._json(self._pieces_call_ask(question, chat_llm=chat_llm))

    # ────── Pieces sweeps — persisted activity snapshots ─────────────────
    # Each sweep is one line on _ledger/pieces_sweeps.jsonl. The loader asks
    # the server for the latest one (so the next query is delta-aware), then
    # POSTs the new sweep back. A background thread ALSO sweeps hourly even
    # when the browser is closed, so the history stays complete.
    def _pieces_sweeps_dir(self):
        return HERE / "CCAgentindex" / "_ledger"

    def _pieces_sweeps_path(self):
        return self._pieces_sweeps_dir() / "pieces_sweeps.jsonl"

    def _pieces_sweeps_latest(self):
        p = self._pieces_sweeps_path()
        if not p.exists():
            return self._json({"ok": True, "latest": None})
        try:
            # Read the last non-empty line efficiently — file is append-only.
            with p.open("rb") as f:
                f.seek(0, 2)
                end = f.tell()
                size = min(end, 32768)
                f.seek(end - size)
                tail = f.read(size).decode("utf-8", "replace").strip().splitlines()
            for line in reversed(tail):
                if line.strip():
                    return self._json({"ok": True, "latest": json.loads(line)})
            return self._json({"ok": True, "latest": None})
        except Exception as e:
            return self._json({"ok": False, "error": str(e)}, code=500)

    def _pieces_sweeps_list(self):
        p = self._pieces_sweeps_path()
        if not p.exists():
            return self._json({"ok": True, "count": 0, "sweeps": []})
        # Return metadata only (timestamp + question + byte-count) to keep the
        # listing cheap. Clients fetch details via /api/pieces/sweeps/latest.
        out = []
        try:
            with p.open("r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line: continue
                    try:
                        d = json.loads(line)
                        out.append({"ts": d.get("ts"), "question": d.get("question"), "bytes": len(d.get("raw", ""))})
                    except Exception: pass
        except Exception as e:
            return self._json({"ok": False, "error": str(e)}, code=500)
        return self._json({"ok": True, "count": len(out), "sweeps": out})

    def _pieces_sweep_post(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        # Trust the server to always run the actual ask so the client can't
        # write bogus sweep entries. Client just triggers.
        since = (payload.get("since") or "").strip()
        if since:
            question = (
                f"What has the team done since {since}? "
                "Focus on: apps/files/URLs touched, projects advanced, people "
                "mentioned, decisions made. Terse — a paragraph plus bullets. "
                "If nothing new, say so in one line."
            )
        else:
            question = (
                "Summarize what the team has been working on in the last 2 hours. "
                "Focus on: apps/files/URLs, projects, people, decisions. "
                "Terse — a short paragraph plus bullets."
            )
        chat_llm = payload.get("chat_llm")  # optional Settings override
        res = self._pieces_call_ask(question, chat_llm=chat_llm)
        if not res.get("ok"):
            return self._json(res, code=502)
        record = {
            "ts":       _iso_now(),
            "since":    since or None,
            "question": question,
            "model":    res.get("model") or "claude-sonnet-4-5",
            "raw":      res.get("raw") or "",
        }
        try:
            self._pieces_sweeps_dir().mkdir(parents=True, exist_ok=True)
            with self._pieces_sweeps_path().open("a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=False) + "\n")
        except Exception as e:
            return self._json({"ok": False, "error": f"ledger write failed: {e}"}, code=500)
        return self._json({"ok": True, "sweep": record})

    # ────── Sub-agent registry ────────────────────────────────────────────
    # GET /api/agents → { agents: [{name, hasPrompt, hasSpec}] }
    # Where to look for an agent's prompt.md, in priority order.
    # Per DEC-2026-04-30-004 the canonical steward path is the unified Box pattern
    # (LEDGERS/BOXES/<box>/steward/), but the legacy CCAgentindex/agents/<name>/
    # location is checked first so existing app agents (global_ledger_steward,
    # andre_escalation_ladder, inbox_triage) keep working without migration.
    # For ledger stewards named `<box>_steward`, the unified Box path is derived
    # by stripping the `_steward` suffix and looking under LEDGERS/BOXES/<box>/.
    def _agent_resolve_prompt(self, name):
        legacy = HERE / "CCAgentindex" / "agents" / name / "prompt.md"
        if legacy.exists():
            return legacy, "legacy"
        if name.endswith("_steward"):
            box_name = name[: -len("_steward")]
            unified = HERE / "LEDGERS" / "BOXES" / box_name / "steward" / "prompt.md"
            if unified.exists():
                return unified, "unified_box"
        return None, None

    def _agents_list(self):
        items = []
        seen = set()

        # Legacy path: CCAgentindex/agents/<name>/
        agents_dir = HERE / "CCAgentindex" / "agents"
        if agents_dir.exists():
            for d in sorted(agents_dir.iterdir()):
                if not d.is_dir() or d.name.startswith("."):
                    continue
                items.append({
                    "name": d.name,
                    "source": "legacy",
                    "hasPrompt": (d / "prompt.md").exists(),
                    "hasSpec":   (d / "agents.md").exists() or (d / "AGENTS.md").exists(),
                })
                seen.add(d.name)

        # Unified Box path: LEDGERS/BOXES/<box>/steward/  (DEC-2026-04-30-004)
        # Each entry surfaces as <box>_steward to match the dispatcher's name resolution.
        boxes_dir = HERE / "LEDGERS" / "BOXES"
        if boxes_dir.exists():
            for box in sorted(boxes_dir.iterdir()):
                if not box.is_dir() or box.name.startswith("."):
                    continue
                steward_dir = box / "steward"
                if not steward_dir.is_dir():
                    continue
                agent_name = f"{box.name}_steward"
                if agent_name in seen:
                    continue
                items.append({
                    "name": agent_name,
                    "source": "unified_box",
                    "hasPrompt": (steward_dir / "prompt.md").exists(),
                    "hasSpec":   (steward_dir / "AGENTS.md").exists() or (steward_dir / "agents.md").exists(),
                })
                seen.add(agent_name)

        return self._json({"agents": items, "count": len(items)})

    # ────── Sub-agent runner ──────────────────────────────────────────────
    # POST /api/agents/<name>/run
    #   body (optional): { "extraContext": "..." }  appended to the agent's
    #                    prompt before dispatch.
    # Resolves the agent's prompt.md via _agent_resolve_prompt (legacy
    # CCAgentindex/agents/<name>/ first, then unified Box LEDGERS/BOXES/<box>/steward/).
    # Dispatches through the existing delegation pipeline (same claude-p
    # subprocess, same --disallowedTools scope guard, same ledger write).
    # Returns { ok, request_id, status } just like /api/delegate — UI polls
    # /api/delegate/<id> for completion.
    def _agent_run(self, name, body):
        import re
        if not re.fullmatch(r"[a-z][a-z0-9_]{0,48}", name or ""):
            return self._json({"ok": False, "error": "bad agent name"}, code=400)
        prompt_path, source = self._agent_resolve_prompt(name)
        if prompt_path is None:
            box_hint = ""
            if name.endswith("_steward"):
                box_hint = f" or LEDGERS/BOXES/{name[:-len('_steward')]}/steward/prompt.md"
            return self._json({
                "ok": False,
                "error": f"no prompt at agents/{name}/prompt.md{box_hint}",
            }, code=404)
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception:
            payload = {}
        extra = (payload.get("extraContext") or "").strip()

        try:
            prompt = prompt_path.read_text(encoding="utf-8")
        except Exception as e:
            return self._json({"ok": False, "error": f"read failed: {e}"}, code=500)

        if extra:
            prompt = prompt.rstrip() + "\n\n---\n\nADDITIONAL CONTEXT FROM THIS RUN:\n" + extra + "\n"

        # Build the same JSON body /api/delegate accepts, then route through it
        # so all telemetry, env_snapshot, timing, and --disallowedTools guards
        # apply identically.
        delegate_body = json.dumps({
            "prompt":  prompt,
            "mode":    "trusted",      # agents are scoped by their prompt + CLAUDE.md
            "label":   f"agent:{name}",
            "timeout": int(payload.get("timeout") or 300),
        }).encode("utf-8")
        return self._delegate_dispatch(delegate_body)

    def _cells_action(self, kind, body):
        try:
            p = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)

        headline = (p.get("headline") or "").strip()
        if not headline:
            return self._json({"ok": False, "error": "missing 'headline'"}, code=400)

        ts = _iso_now()
        record = {
            "ts":       ts,
            "gridId":   p.get("gridId"),
            "cellId":   p.get("cellId"),
            "headline": headline,
            "preview":  p.get("preview") or "",
        }

        ledger_dir = HERE / "CCAgentindex" / "_ledger"
        ledger_dir.mkdir(parents=True, exist_ok=True)

        if kind == "retire":
            record["kind"] = "cell_retired"
            record["why"] = p.get("why") or None
            target = ledger_dir / "retired_cells.jsonl"
        elif kind == "recurring":
            cadence = (p.get("cadence") or "").strip().lower()
            if cadence not in ("daily", "weekdays", "weekly", "biweekly", "monthly"):
                return self._json({"ok": False, "error": f"bad cadence '{cadence}'"}, code=400)
            record["kind"] = "cell_recurring"
            record["cadence"] = cadence
            target = ledger_dir / "recurring_cells.jsonl"
        elif kind == "reject":
            reason = (p.get("reason") or "").strip()
            if not reason:
                return self._json({"ok": False, "error": "missing 'reason' — reject always needs a reason"}, code=400)
            record["kind"] = "cell_rejected"
            record["reason"] = reason
            target = ledger_dir / "rejected_cells.jsonl"
        else:
            return self._json({"ok": False, "error": f"unknown kind '{kind}'"}, code=400)

        line = json.dumps(record, ensure_ascii=False) + "\n"
        try:
            with target.open("a", encoding="utf-8") as f:
                f.write(line)
            with (ledger_dir / "activity.jsonl").open("a", encoding="utf-8") as f:
                f.write(line)
        except Exception as e:
            return self._json({"ok": False, "error": f"ledger write failed: {e}"}, code=500)

        return self._json({"ok": True, "record": record})

    def _claude_code_generate(self, body):
        if not CLAUDE_BIN:
            return self._json({"ok": False, "error": "claude binary not found"}, code=503)
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        instructions = (payload.get("instructions") or "").strip()
        user_input   = (payload.get("input") or "").strip()
        if not user_input:
            return self._json({"ok": False, "error": "missing input"}, code=400)
        timeout_s = int(payload.get("timeout") or 120)
        # Same pattern as chat: instructions go via --system-prompt so Rodbot's
        # persona replaces the default Claude Code assistant identity.
        cmd = [CLAUDE_BIN, "-p", "--max-turns", "1", "--output-format", "text"]
        if instructions:
            cmd += ["--system-prompt", instructions]
        try:
            proc = subprocess.run(
                cmd, input=user_input,
                capture_output=True, text=True, timeout=timeout_s,
            )
            if proc.returncode != 0:
                return self._json({
                    "ok": False,
                    "error": f"claude exit {proc.returncode}",
                    "stderr": (proc.stderr or "")[-2000:],
                }, code=502)
            return self._json({"ok": True, "output_text": (proc.stdout or "").strip()})
        except subprocess.TimeoutExpired:
            return self._json({"ok": False, "error": f"timeout after {timeout_s}s"}, code=504)
        except Exception as e:
            return self._json({"ok": False, "error": f"{type(e).__name__}: {e}"}, code=500)

    def _codex_cli_generate(self, body):
        if not CODEX_BIN:
            return self._json({"ok": False, "error": "codex binary not found"}, code=503)
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        instructions = (payload.get("instructions") or "").strip()
        user_input = (payload.get("input") or "").strip()
        if not user_input:
            return self._json({"ok": False, "error": "missing input"}, code=400)
        timeout_s = int(payload.get("timeout") or 120)
        prompt = _build_codex_prompt(instructions, user_input)
        text, stderr, err = _run_codex_exec(
            prompt,
            model=payload.get("model") or "gpt-5.4-mini",
            timeout_s=timeout_s,
        )
        if err:
            return self._json({
                "ok": False,
                "error": err,
                "stderr": stderr[-2000:] if stderr else "",
            }, code=502 if "exit" in err else 504 if "timeout" in err else 500)
        return self._json({"ok": True, "output_text": text.strip()})

    def _computer_use_handoff_prompt(self, payload):
        text = (payload.get("text") or payload.get("message") or "").strip()
        context = payload.get("context") or {}
        source = payload.get("source") or {}
        attachments = payload.get("attachments") or []
        lines = [
            "CCAgent computer use handoff",
            "",
            "Source: Comeketo Agent local app",
            f"Route: {source.get('route') or context.get('route') or 'grid'}",
            f"Surface: {source.get('surface') or context.get('surface') or 'chat_rail'}",
            "",
            "Request:",
            text,
        ]
        if attachments:
            lines += ["", "Attachments visible in Comeketo Agent draft:"]
            for item in attachments[:12]:
                name = item.get("original_filename") or item.get("filename") or "attachment"
                path = item.get("path") or item.get("url") or ""
                lines.append(f"- {name}{(' - ' + path) if path else ''}")
        lines += [
            "",
            "Use Computer Use when it helps. Work from the currently open desktop/browser state, then report the result back here.",
        ]
        return "\n".join(lines).strip() + "\n"

    def _computer_use_handoff(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        text = (payload.get("text") or payload.get("message") or "").strip()
        if not text:
            return self._json({"ok": False, "error": "missing text"}, code=400)

        prompt = self._computer_use_handoff_prompt(payload)
        if payload.get("dry_run"):
            return self._json({"ok": True, "dry_run": True, "prompt": prompt})

        if sys.platform != "darwin":
            return self._json({"ok": False, "error": "computer use handoff is macOS-only"}, code=409)
        if not shutil.which("pbcopy") or not shutil.which("osascript"):
            return self._json({"ok": False, "error": "pbcopy or osascript unavailable"}, code=503)

        try:
            subprocess.run(["pbcopy"], input=prompt, text=True, check=True, timeout=3)
            script = [
                'try',
                '  tell application id "com.openai.codex" to activate',
                'on error',
                '  tell application "Codex" to activate',
                'end try',
                'delay 0.25',
                'tell application "System Events"',
                '  keystroke "v" using command down',
                '  delay 0.12',
                '  key code 36',
                'end tell',
            ]
            proc = subprocess.run(
                ["osascript"] + sum([["-e", line] for line in script], []),
                capture_output=True, text=True, timeout=8,
            )
            if proc.returncode != 0:
                detail = ((proc.stderr or "") + "\n" + (proc.stdout or "")).strip()
                return self._json({
                    "ok": False,
                    "error": "desktop handoff failed",
                    "detail": detail[-2000:],
                    "hint": "Open Codex Desktop and allow Accessibility automation for the app running server.py.",
                }, code=502)

            now = _iso_now()
            self._activity_ledger_write({
                "ts": now,
                "kind": "computer_use_handoff",
                "actor": "ui",
                "action": "paste_and_send_to_codex_desktop",
                "target": "Codex Desktop",
                "notes": text[:220],
            })
            return self._json({"ok": True, "sent": True, "ts": now})
        except subprocess.TimeoutExpired:
            return self._json({"ok": False, "error": "desktop handoff timed out"}, code=504)
        except Exception as e:
            return self._json({"ok": False, "error": f"{type(e).__name__}: {e}"}, code=500)

    def _browser_use_jobs_dir(self):
        return HERE / "CCAgentindex" / "_ledger" / "browser_use_jobs"

    def _browser_use_job_path(self, job_id):
        safe = re.sub(r"[^A-Za-z0-9_-]", "", str(job_id or ""))[:80]
        if not safe:
            return None
        return self._browser_use_jobs_dir() / f"{safe}.json"

    def _browser_use_job_write(self, job):
        path = self._browser_use_job_path(job.get("job_id"))
        if not path:
            return
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(job, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    def _browser_use_job_read(self, job_id):
        path = self._browser_use_job_path(job_id)
        if not path or not path.exists():
            return None
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            return None

    def _browser_use_job_get(self, job_id):
        job = self._browser_use_job_read(job_id)
        if not job:
            return self._json({"ok": False, "error": "browser use job not found"}, code=404)
        return self._json({"ok": True, "job": job})

    def _browser_pick_target_url(self, text):
        raw = str(text or "")
        m = re.search(r"https?://[^\s)]+", raw, flags=re.I)
        if m:
            return m.group(0)
        lower = raw.lower()
        if re.search(r"\bai news\b", raw, flags=re.I):
            query = "AI news"
        else:
            query = re.sub(
                r"\b(open up|open|go to|search|look up|find|show me|let'?s see what'?s new in|let us see what is new in|what'?s new in|what is new in)\b",
                " ",
                raw,
                flags=re.I,
            )
            query = re.sub(r"\bgoogle chrome\b", " ", query, flags=re.I)
            query = re.sub(r"\byoutube\b", " ", query, flags=re.I)
            query = re.sub(r"\s+", " ", query).strip() or "AI news"
        if "youtube" in lower or "video" in lower:
            return "https://www.youtube.com/results?search_query=" + urllib.parse.quote_plus(query) + "&sp=CAI%253D"
        return "https://www.google.com/search?q=" + urllib.parse.quote_plus(query)

    def _browser_open_handoff(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        text = (payload.get("text") or payload.get("message") or "").strip()
        if not text:
            return self._json({"ok": False, "error": "missing text"}, code=400)
        url = self._browser_pick_target_url(text)
        if payload.get("dry_run"):
            return self._json({"ok": True, "dry_run": True, "url": url})
        try:
            if sys.platform == "darwin":
                proc = subprocess.run(["open", "-a", "Google Chrome", url], capture_output=True, text=True, timeout=8)
                if proc.returncode != 0:
                    proc = subprocess.run(["open", url], capture_output=True, text=True, timeout=8)
            else:
                opener = shutil.which("xdg-open")
                if not opener:
                    return self._json({"ok": False, "error": "no browser opener available"}, code=503)
                proc = subprocess.run([opener, url], capture_output=True, text=True, timeout=8)
            if proc.returncode != 0:
                detail = ((proc.stderr or "") + "\n" + (proc.stdout or "")).strip()
                return self._json({"ok": False, "error": "open browser failed", "detail": detail[-1200:]}, code=502)
            now = _iso_now()
            self._activity_ledger_write({
                "ts": now,
                "kind": "browser_open_handoff",
                "actor": "ui",
                "action": "open_visible_browser",
                "target": url,
                "notes": text[:220],
            })
            return self._json({"ok": True, "url": url, "ts": now})
        except subprocess.TimeoutExpired:
            return self._json({"ok": False, "error": "open browser timed out"}, code=504)
        except Exception as e:
            return self._json({"ok": False, "error": f"{type(e).__name__}: {e}"}, code=500)

    def _browser_use_handoff(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        text = (payload.get("text") or payload.get("message") or "").strip()
        if not text:
            return self._json({"ok": False, "error": "missing text"}, code=400)
        if not shutil.which("node"):
            return self._json({"ok": False, "error": "node unavailable"}, code=503)

        job_id = "bu_" + uuid.uuid4().hex[:10]
        now = _iso_now()
        job = {
            "ok": True,
            "job_id": job_id,
            "status": "running",
            "created_at": now,
            "updated_at": now,
            "text": text,
            "source": payload.get("source") or {},
            "result": None,
            "error": None,
        }
        self._browser_use_job_write(job)
        threading.Thread(
            target=self._browser_use_worker,
            args=(job_id, payload),
            name=f"browser-use-{job_id}",
            daemon=True,
        ).start()
        return self._json({"ok": True, "job": job})

    def _browser_use_worker(self, job_id, payload):
        job = self._browser_use_job_read(job_id) or {"job_id": job_id, "status": "running"}
        text = (payload.get("text") or payload.get("message") or "").strip()
        script_path = HERE / "scripts" / "browser_use_worker.js"
        screenshot_rel = Path("output") / "playwright" / f"{job_id}.png"
        settings = payload.get("settings") or {}
        screenshot_path = HERE / screenshot_rel if settings.get("screenshots", True) is not False else None
        env_payload = {
            "text": text,
            "source": payload.get("source") or {},
            "context": payload.get("context") or {},
            "settings": settings,
            "screenshot_path": str(screenshot_path) if screenshot_path else "",
        }
        try:
            proc = subprocess.run(
                ["node", str(script_path)],
                input="",
                capture_output=True,
                text=True,
                timeout=int(payload.get("timeout") or 75),
                env={**os.environ, "BROWSER_USE_PAYLOAD": json.dumps(env_payload, ensure_ascii=False)},
                cwd=str(HERE),
            )
            now = _iso_now()
            if proc.returncode != 0:
                job.update({
                    "status": "failed",
                    "updated_at": now,
                    "error": ((proc.stderr or "") + "\n" + (proc.stdout or "")).strip()[-3000:],
                })
            else:
                out = (proc.stdout or "").strip().splitlines()[-1] if (proc.stdout or "").strip() else "{}"
                result = json.loads(out)
                if screenshot_path:
                    result["screenshot_url"] = "/" + str(screenshot_rel).replace("\\", "/")
                job.update({
                    "status": "done",
                    "updated_at": now,
                    "result": result,
                    "error": None,
                })
                self._activity_ledger_write({
                    "ts": now,
                    "kind": "browser_use_handoff",
                    "actor": "ui",
                    "action": "run_headless_playwright",
                    "target": result.get("url") or "browser",
                    "notes": text[:220],
                })
            self._browser_use_job_write(job)
        except subprocess.TimeoutExpired:
            job.update({"status": "failed", "updated_at": _iso_now(), "error": "browser use timed out"})
            self._browser_use_job_write(job)
        except Exception as e:
            job.update({"status": "failed", "updated_at": _iso_now(), "error": f"{type(e).__name__}: {e}"})
            self._browser_use_job_write(job)

    # ────── Delegation: Claude Code as a subprocess ─────────────────────
    # Comeketo Agent dispatches a prompt; we spawn `claude -p` in a background
    # thread with the bedrock root as cwd; when it exits we write the full
    # result into _ledger/delegations/<request_id>.json. The browser polls
    # GET /api/delegate/<request_id> until status flips to done/failed.
    #
    # Demo-mode does NOT block delegation — it's local compute, not an
    # outbound vendor write. Trust mode is explicit via the 'mode' field.

    def _delegations_dir(self):
        return HERE / "CCAgentindex" / "_ledger" / "delegations"

    def _delegation_drafts_path(self):
        return HERE / "CCAgentindex" / "_ledger" / "delegation_drafts.json"

    def _delegation_draft_events_path(self):
        return HERE / "CCAgentindex" / "_ledger" / "delegation_draft_events.jsonl"

    def _delegation_drafts_load(self):
        p = self._delegation_drafts_path()
        if not p.exists():
            return {"drafts": []}
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
            if isinstance(data, dict) and isinstance(data.get("drafts"), list):
                return data
            if isinstance(data, list):
                return {"drafts": data}
        except Exception:
            pass
        return {"drafts": []}

    def _delegation_drafts_save(self, data):
        p = self._delegation_drafts_path()
        p.parent.mkdir(parents=True, exist_ok=True)
        tmp = p.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
        tmp.replace(p)

    def _delegation_draft_event(self, event):
        p = self._delegation_draft_events_path()
        p.parent.mkdir(parents=True, exist_ok=True)
        with p.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(event, ensure_ascii=False) + "\n")

    def _delegation_draft_find(self, drafts, draft_id):
        for i, d in enumerate(drafts):
            if d.get("id") == draft_id:
                return i, d
        return -1, None

    def _settings_mcp_credentials(self):
        keys = {}
        for key, label in _MCP_CREDENTIAL_KEYS.items():
            v = (ENV.get(key) or "").strip()
            keys[key] = {
                "label": label,
                "configured": bool(v),
                "masked": _mask_secret(v),
            }
        return self._json({"ok": True, "keys": keys})

    def _settings_mcp_credentials_save(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        updates = payload.get("updates") or {}
        if not isinstance(updates, dict) or not updates:
            return self._json({"ok": False, "error": "missing updates"}, code=400)
        unknown = [k for k in updates.keys() if k not in _MCP_CREDENTIAL_KEYS]
        if unknown:
            return self._json({"ok": False, "error": f"unsupported credential keys: {', '.join(sorted(unknown))}"}, code=400)

        _save_env_updates(updates)
        if "CLICKUP_API_TOKEN" in updates:
            resolve_and_cache_clickup()

        self._activity_ledger_write({
            "ts": _iso_now(),
            "kind": "settings_mcp_credentials_save",
            "actor": "ui",
            "keys": sorted(list(updates.keys())),
        })
        return self._settings_mcp_credentials()

    def _boxes_people_lookup(self):
        base = HERE / "CCAgentindex" / "people"
        rows = []
        if not base.exists():
            return rows
        for p in sorted(base.glob("*.json")):
            if p.name.startswith("."):
                continue
            try:
                obj = json.loads(p.read_text(encoding="utf-8"))
            except Exception:
                continue
            rows.append({
                "id": (obj.get("id") or p.stem).strip(),
                "name": (obj.get("name") or p.stem).strip(),
                "kind": (obj.get("kind") or "coworker").strip(),
                "path": p,
            })
        return rows

    def _boxes_catalog(self):
        people = self._boxes_people_lookup()
        by_id = {r["id"]: r for r in people if r.get("id")}
        by_name = {_slug_norm(r["name"]): r for r in people if r.get("name")}
        staff_norm_to_path = {}
        client_norm_to_path = {}
        boxes = []

        def _gather_dirs(base):
            if not base.exists():
                return []
            out = []
            for p in sorted(base.iterdir()):
                if p.name.startswith("."):
                    continue
                if p.is_dir():
                    out.append(p)
            return out

        def _box_from(folder, source_kind):
            norm = _slug_norm(folder.name)
            person = by_name.get(norm)
            if not person and norm in by_id:
                person = by_id.get(norm)
            person_id = person.get("id") if person else None
            kind = "coworker" if source_kind == "staff_box" else ((person or {}).get("kind") or "lead")
            files = []
            newest = 0.0
            for child in folder.iterdir():
                if child.name.startswith(".") or not child.is_file():
                    continue
                try:
                    stat = child.stat()
                    newest = max(newest, stat.st_mtime)
                    files.append({
                        "name": child.name,
                        "ext": child.suffix.lower().lstrip("."),
                        "size": int(stat.st_size),
                        "mtime": stat.st_mtime,
                    })
                except Exception:
                    continue
            meta = {}
            meta_path = folder / "00_meta.json"
            if meta_path.exists():
                try:
                    meta = json.loads(meta_path.read_text(encoding="utf-8"))
                except Exception:
                    meta = {}
            rid = person_id or (f"staff_{norm}" if source_kind == "staff_box" else f"box_{norm}")
            rel = folder.relative_to(HERE).as_posix()
            box = {
                "id": rid,
                "name": (meta.get("name") or (person or {}).get("name") or folder.name),
                "kind": kind,
                "source_kind": source_kind,
                "person_id": person_id,
                "folder_name": folder.name,
                "folder_rel": rel,
                "folder_abs": str(folder),
                "mtime": newest or 0.0,
                "meta": {
                    "lead_id": meta.get("lead_id"),
                    "smart_view_label": meta.get("smart_view_label"),
                    "altitude": meta.get("altitude"),
                    "last_sweep_at": meta.get("last_sweep_at"),
                    "comms_dirty": meta.get("comms_dirty"),
                    "active_cadence": meta.get("active_cadence"),
                },
                "files": sorted(files, key=lambda x: x.get("name") or ""),
                "available_sections": {
                    "meta": (folder / "00_meta.json").exists(),
                    "comms": (folder / "01_comms.md").exists(),
                    "profile": (folder / "04_profile.md").exists(),
                    "seven_day_plan": (folder / "05_seven_day_plan.md").exists(),
                    "logic": (folder / "06_logic.md").exists(),
                    "skills_used": (folder / "07_skills_used.md").exists(),
                    "alerts": (folder / "09_andre_alerts.md").exists(),
                    "ledger": (folder / "client_ledger.md").exists(),
                },
            }
            boxes.append(box)
            if source_kind == "staff_box":
                staff_norm_to_path[norm] = folder
            else:
                client_norm_to_path[norm] = folder

        for d in _gather_dirs(AUTO_CLIENT_BOXES):
            _box_from(d, "client_box")
        for d in _gather_dirs(AUTO_STAFF_BOXES):
            _box_from(d, "staff_box")

        unmatched_boxes = [b["id"] for b in boxes if not b.get("person_id")]
        matched_person_ids = {b.get("person_id") for b in boxes if b.get("person_id")}
        unmatched_people = []
        for p in people:
            kind = p.get("kind") or "coworker"
            pid = p.get("id")
            if kind in ("lead", "client", "coworker") and pid not in matched_person_ids:
                unmatched_people.append({"person_id": pid, "kind": kind, "name": p.get("name")})

        boxes.sort(key=lambda b: ((b.get("kind") or "lead"), -(b.get("mtime") or 0), _slug_norm(b.get("name"))))
        by_box_id = {b["id"]: b for b in boxes}
        return {
            "boxes": boxes,
            "by_id": by_box_id,
            "mismatch": {
                "unmatched_box_ids": unmatched_boxes,
                "unmatched_people": unmatched_people,
            },
        }

    def _boxes_pick_orchestrator_html(self, box):
        out = []
        # Always include the key orchestrator pages as demos.
        for fixed in ("today.html", "dashboard.html", "index.html"):
            p = AUTO_ORCH_STATE / fixed
            if p.exists():
                out.append({
                    "label": fixed,
                    "path_rel": p.relative_to(HERE).as_posix(),
                    "url": "/" + urllib.parse.quote(p.relative_to(HERE).as_posix(), safe="/"),
                    "source": "orchestrator_state",
                })
        # For lead/client boxes, match state/leads/*.html by name tokens.
        if (box.get("source_kind") or "") == "client_box":
            leads_dir = AUTO_ORCH_STATE / "leads"
            if leads_dir.exists():
                name_tokens = set(_slug_norm(box.get("name")).split("_"))
                for hp in sorted(leads_dir.glob("*.html")):
                    stem_tokens = set(_slug_norm(hp.stem).split("_"))
                    if not stem_tokens:
                        continue
                    if stem_tokens.issubset(name_tokens) or name_tokens.issubset(stem_tokens):
                        rel = hp.relative_to(HERE).as_posix()
                        out.append({
                            "label": f"lead/{hp.name}",
                            "path_rel": rel,
                            "url": "/" + urllib.parse.quote(rel, safe="/"),
                            "source": "orchestrator_lead",
                        })
        if (box.get("source_kind") or "") == "staff_box":
            voice_dir = AUTO_ORCH_STATE / "voice"
            if voice_dir.exists():
                norm = _slug_norm(box.get("name"))
                for hp in sorted(voice_dir.glob("*.html")):
                    stem = _slug_norm(hp.stem)
                    if stem and (stem.startswith(norm.split("_")[0]) or norm.startswith(stem)):
                        rel = hp.relative_to(HERE).as_posix()
                        out.append({
                            "label": f"voice/{hp.name}",
                            "path_rel": rel,
                            "url": "/" + urllib.parse.quote(rel, safe="/"),
                            "source": "orchestrator_voice",
                        })
        # Include local box-level html demos if present.
        folder = Path(box.get("folder_abs") or "")
        if folder.exists():
            for hp in sorted(folder.glob("*.html")):
                rel = hp.relative_to(HERE).as_posix()
                out.append({
                    "label": f"box/{hp.name}",
                    "path_rel": rel,
                    "url": "/" + urllib.parse.quote(rel, safe="/"),
                    "source": "box_html",
                })
        # Keep unique by path.
        uniq = {}
        for item in out:
            uniq[item["path_rel"]] = item
        return list(uniq.values())

    def _boxes_template_pages(self, box):
        box_id = (box.get("id") or "").strip()
        if not box_id:
            return []
        items = []
        for slug, title in [
            ("overview", "template/overview.html"),
            ("checklist", "template/checklist.html"),
            ("action_board", "template/action_board.html"),
        ]:
            items.append({
                "label": title,
                "path_rel": f"virtual/boxes/{box_id}/{slug}.html",
                "url": f"/api/boxes/{urllib.parse.quote(box_id, safe='')}/template/{slug}",
                "source": "generated_template",
            })
        return items

    def _boxes_template_items(self, box, sections, html_items):
        avail = box.get("available_sections") or {}
        core = [
            ("meta", "Meta", "00_meta.json", bool((sections.get("meta") or {}))),
            ("state", "State (Last 5 Touches)", "derived from comms", bool(sections.get("state_touches"))),
            ("comms", "Comms", "01_comms.md", bool((sections.get("comms_markdown") or "").strip())),
            ("profile", "Profile", "04_profile.md", bool((sections.get("profile_markdown") or "").strip())),
            ("enrichment", "Enrichment", "*_enrichment.md", bool((sections.get("enrichment_markdown") or "").strip())),
            ("seven_day_plan", "7-Day Plan", "05_seven_day_plan.md", bool((sections.get("seven_day_plan_markdown") or "").strip())),
            ("agents", "Agents Config", "AGENTS.md", bool((sections.get("agents_markdown") or "").strip())),
            ("logic", "Logic", "06_logic.md", bool((sections.get("logic_markdown") or "").strip() or avail.get("logic"))),
        ]
        support = [
            ("skills_used", "Skills Used", "07_skills_used.md", bool((sections.get("skills_used_markdown") or "").strip() or avail.get("skills_used"))),
            ("alerts", "Andre Alerts", "09_andre_alerts.md", bool((sections.get("alerts_markdown") or "").strip() or avail.get("alerts"))),
            ("ledger", "Ledger", "client_ledger.md", bool((sections.get("ledger_markdown") or "").strip() or avail.get("ledger"))),
        ]
        page_count = len(html_items or [])
        page_ready = page_count > 0
        has_templates = any((i.get("source") == "generated_template") for i in (html_items or []))
        support.extend([
            ("pages", "HTML Pages", "orchestrator + box html", page_ready),
            ("templates", "Generated Templates", "virtual templates", has_templates),
        ])
        items = []
        for key, label, hint, present in core:
            items.append({"key": key, "label": label, "hint": hint, "present": bool(present), "tier": "core"})
        for key, label, hint, present in support:
            items.append({"key": key, "label": label, "hint": hint, "present": bool(present), "tier": "support"})

        core_total = max(1, len(core))
        core_present = sum(1 for i in items if i["tier"] == "core" and i["present"])
        total = max(1, len(items))
        present = sum(1 for i in items if i["present"])
        score = round((present / total) * 100)
        core_score = round((core_present / core_total) * 100)
        status = "strong" if score >= 80 else ("partial" if score >= 45 else "thin")
        return {
            "items": items,
            "summary": {
                "present_count": present,
                "total_count": total,
                "score_pct": score,
                "core_score_pct": core_score,
                "status": status,
            },
        }

    def _boxes_template_html(self, box_id, template_slug):
        cat = self._boxes_catalog()
        b = (cat.get("by_id") or {}).get(box_id)
        if not b:
            return self._json({"ok": False, "error": "box not found", "id": box_id}, code=404)

        payload = self._boxes_get_payload(cat, b)
        if not payload:
            return self._json({"ok": False, "error": "box payload unavailable", "id": box_id}, code=404)

        checklist = payload.get("checklist") or {"items": [], "summary": {}}
        summary = checklist.get("summary") or {}
        items = checklist.get("items") or []
        rows = []
        for it in items:
            mark = "✅" if it.get("present") else "⬜"
            rows.append(
                f"<li><span class='mark'>{mark}</span>"
                f"<span class='label'>{html.escape(it.get('label') or '')}</span>"
                f"<span class='hint'>{html.escape(it.get('hint') or '')}</span></li>"
            )
        list_html = "\n".join(rows) if rows else "<li>No checklist items.</li>"

        section_map = payload.get("sections") or {}
        profile_snip = html.escape((section_map.get("profile_markdown") or "").strip()[:1500] or "No profile yet.")
        comms_snip = html.escape((section_map.get("comms_markdown") or "").strip()[:1500] or "No comms yet.")
        plan_snip = html.escape((section_map.get("seven_day_plan_markdown") or "").strip()[:1500] or "No seven-day plan yet.")

        title = f"{payload.get('name') or payload.get('id')} · {template_slug}"
        body_main = ""
        if template_slug == "checklist":
            body_main = f"""
            <section class="card">
              <h2>Coverage Checklist</h2>
              <p class="lede">Score {summary.get('score_pct', 0)}% · Core {summary.get('core_score_pct', 0)}%</p>
              <ul class="checklist">{list_html}</ul>
            </section>
            """
        elif template_slug == "action_board":
            body_main = f"""
            <section class="grid3">
              <article class="card"><h2>Profile Snapshot</h2><pre>{profile_snip}</pre></article>
              <article class="card"><h2>Comms Snapshot</h2><pre>{comms_snip}</pre></article>
              <article class="card"><h2>7-Day Plan Snapshot</h2><pre>{plan_snip}</pre></article>
            </section>
            """
        else:
            body_main = f"""
            <section class="card">
              <h2>Box Overview</h2>
              <p class="lede">{html.escape(payload.get('kind') or 'lead')} · {html.escape(payload.get('source_kind') or 'box')} · {html.escape(payload.get('folder_rel') or '')}</p>
              <p>Information coverage is <strong>{summary.get('score_pct', 0)}%</strong>. Use the checklist page to complete missing sections, then run the action board for operator handoff.</p>
            </section>
            <section class="card">
              <h2>Current Readiness</h2>
              <ul class="checklist">{list_html}</ul>
            </section>
            """

        page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{html.escape(title)}</title>
<style>
  :root {{ --bg:#f8f6ef; --ink:#1f1f1a; --rule:#d9d4c8; --card:#fffdf7; --muted:#6b685e; }}
  * {{ box-sizing: border-box; }}
  body {{ margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:var(--ink); background:var(--bg); }}
  .wrap {{ padding:20px; display:grid; gap:14px; }}
  .head {{ display:flex; justify-content:space-between; align-items:flex-end; gap:12px; border-bottom:1px solid var(--rule); padding-bottom:10px; }}
  h1 {{ margin:0; font-size:22px; }}
  .meta {{ color:var(--muted); font-size:12px; }}
  .card {{ border:1px solid var(--rule); background:var(--card); border-radius:12px; padding:14px; }}
  h2 {{ margin:0 0 8px 0; font-size:16px; }}
  .lede {{ margin:0; color:var(--muted); }}
  ul.checklist {{ list-style:none; padding:0; margin:0; display:grid; gap:6px; }}
  ul.checklist li {{ display:grid; grid-template-columns:22px minmax(120px, 180px) 1fr; gap:10px; font-size:13px; align-items:center; }}
  .hint {{ color:var(--muted); font-size:12px; }}
  pre {{ white-space:pre-wrap; margin:0; font-size:12px; line-height:1.45; max-height:420px; overflow:auto; }}
  .grid3 {{ display:grid; gap:12px; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); }}
</style>
</head>
<body>
  <main class="wrap">
    <header class="head">
      <div>
        <h1>{html.escape(payload.get('name') or payload.get('id') or 'Box')}</h1>
        <div class="meta">{html.escape(payload.get('id') or '')} · {html.escape(template_slug)}</div>
      </div>
      <div class="meta">score {summary.get('score_pct', 0)}%</div>
    </header>
    {body_main}
  </main>
</body>
</html>
"""
        return self._html(page, code=200)

    def _boxes_get_payload(self, catalog, box_row):
        folder = Path(box_row.get("folder_abs") or "")
        if not folder.exists():
            return None
        payload = dict(box_row)
        payload.pop("folder_abs", None)
        payload["sections"] = {
            "meta": {},
            "comms_markdown": "",
            "profile_markdown": "",
            "seven_day_plan_markdown": "",
            "logic_markdown": "",
            "enrichment_markdown": "",
            "agents_markdown": "",
            "skills_used_markdown": "",
            "alerts_markdown": "",
            "ledger_markdown": "",
            "state_touches": [],
        }
        meta_path = folder / "00_meta.json"
        if meta_path.exists():
            try:
                payload["sections"]["meta"] = json.loads(meta_path.read_text(encoding="utf-8"))
            except Exception:
                payload["sections"]["meta"] = {}
        md_map = {
            "comms_markdown": "01_comms.md",
            "profile_markdown": "04_profile.md",
            "seven_day_plan_markdown": "05_seven_day_plan.md",
            "logic_markdown": "06_logic.md",
            "skills_used_markdown": "07_skills_used.md",
            "alerts_markdown": "09_andre_alerts.md",
            "ledger_markdown": "client_ledger.md",
        }
        for key, fn in md_map.items():
            p = folder / fn
            if p.exists():
                payload["sections"][key] = _safe_text_read(p)

        # Flexible enrichment + agents discovery because naming varies by box.
        enrichment_candidates = []
        for child in sorted(folder.glob("*.md")):
            nm = child.name.lower()
            if "enrichment" in nm:
                enrichment_candidates.append(child)
        if enrichment_candidates:
            payload["sections"]["enrichment_markdown"] = _safe_text_read(enrichment_candidates[0])

        agents_path = folder / "AGENTS.md"
        if agents_path.exists():
            payload["sections"]["agents_markdown"] = _safe_text_read(agents_path)

        payload["sections"]["state_touches"] = _extract_last_touches(payload["sections"].get("comms_markdown"), limit=5)
        html_items = self._boxes_pick_orchestrator_html(box_row) + self._boxes_template_pages(box_row)
        uniq = {}
        for it in html_items:
            uniq[it.get("path_rel") or it.get("url")] = it
        payload["html"] = list(uniq.values())
        payload["checklist"] = self._boxes_template_items(payload, payload["sections"], payload["html"])
        payload["completeness"] = payload["checklist"].get("summary") or {}
        payload["mismatch"] = catalog.get("mismatch") or {}
        return payload

    def _boxes_list(self):
        cat = self._boxes_catalog()
        boxes = cat["boxes"]
        grouped = {"lead": [], "client": [], "coworker": [], "contact": [], "other": []}
        box_rows = []
        for b in boxes:
            k = b.get("kind") or "other"
            if k not in grouped:
                k = "other"
            html_items = self._boxes_pick_orchestrator_html(b) + self._boxes_template_pages(b)
            checklist = self._boxes_template_items(b, {}, html_items)
            row = {
                "id": b.get("id"),
                "name": b.get("name"),
                "kind": b.get("kind"),
                "source_kind": b.get("source_kind"),
                "person_id": b.get("person_id"),
                "folder_rel": b.get("folder_rel"),
                "mtime": b.get("mtime"),
                "meta": b.get("meta") or {},
                "available_sections": b.get("available_sections") or {},
                "completeness": checklist.get("summary") or {},
                "html_count": len(html_items),
            }
            grouped[k].append(row)
            box_rows.append(row)
        return self._json({
            "ok": True,
            "count": len(boxes),
            "grouped": grouped,
            "boxes": box_rows,
            "mismatch": cat.get("mismatch") or {},
            "auto_root": str(AUTO_ROOT),
        })

    def _boxes_get(self, box_id):
        cat = self._boxes_catalog()
        b = (cat.get("by_id") or {}).get(box_id)
        if not b:
            return self._json({"ok": False, "error": "box not found", "id": box_id}, code=404)
        payload = self._boxes_get_payload(cat, b)
        if not payload:
            return self._json({"ok": False, "error": "box folder missing", "id": box_id}, code=404)
        return self._json({"ok": True, "box": payload})

    def _boxes_html(self, box_id):
        cat = self._boxes_catalog()
        b = (cat.get("by_id") or {}).get(box_id)
        if not b:
            return self._json({"ok": False, "error": "box not found", "id": box_id}, code=404)
        items = self._boxes_pick_orchestrator_html(b) + self._boxes_template_pages(b)
        uniq = {}
        for it in items:
            uniq[it.get("path_rel") or it.get("url")] = it
        return self._json({
            "ok": True,
            "id": box_id,
            "name": b.get("name"),
            "kind": b.get("kind"),
            "items": list(uniq.values()),
        })

    def _delegation_policy_error(self, draft):
        pol = draft.get("policy") or {}
        target = (pol.get("target") or "general").strip().lower()
        intent = (pol.get("intent") or "read").strip().lower()
        approval_required = bool(pol.get("approval_required"))
        valid_targets = {"general", "github", "clickup", "close", "claude_code", "cursor"}
        valid_intents = {"read", "write", "run"}
        if target not in valid_targets:
            return f"Unsupported delegation target: {target or '(empty)'}."
        if intent not in valid_intents:
            return f"Unsupported delegation intent: {intent or '(empty)'}."
        if target == "github":
            gh = _github_mcp_status()
            if not gh.get("available"):
                return "GitHub MCP is not available. Connect GitHub MCP before running GitHub delegations."
        if target == "clickup" and not ENV.get("CLICKUP_API_TOKEN"):
            return "ClickUp is not connected. Add CLICKUP_API_TOKEN in settings/.env first."
        if target == "close" and not ENV.get("CLOSE_API_KEY"):
            return "Close is not connected. Add CLOSE_API_KEY in settings/.env first."
        if target in ("claude_code", "cursor") and not CLAUDE_BIN:
            return "Claude Code binary is unavailable, so this target cannot execute."
        if intent == "write" and target != "general":
            if not approval_required:
                return f"{target} write drafts must set approval_required=true."
            appr = draft.get("approval") or {}
            if not appr.get("approved_at"):
                return f"{target} write draft is not approved yet."
        return None

    def _delegation_draft_capture_state(self, draft):
        return {
            "status": draft.get("status") or "draft",
            "payload": json.loads(json.dumps(draft.get("payload") or {})),
            "policy": json.loads(json.dumps(draft.get("policy") or {})),
            "approval": json.loads(json.dumps(draft.get("approval") or {})),
            "source": json.loads(json.dumps(draft.get("source") or {})),
            "context": json.loads(json.dumps(draft.get("context") or {})),
        }

    def _delegation_draft_snapshot_append(self, draft, ts, reason):
        snaps = draft.get("snapshots") or []
        snaps.append({"ts": ts, "reason": reason, "state": self._delegation_draft_capture_state(draft)})
        draft["snapshots"] = snaps[-40:]

    def _delegation_draft_apply_state(self, draft, state):
        draft["status"] = (state.get("status") if isinstance(state, dict) else None) or "draft"
        draft["payload"] = json.loads(json.dumps((state or {}).get("payload") or {}))
        draft["policy"] = json.loads(json.dumps((state or {}).get("policy") or {}))
        draft["approval"] = json.loads(json.dumps((state or {}).get("approval") or {}))
        draft["source"] = json.loads(json.dumps((state or {}).get("source") or {}))
        draft["context"] = json.loads(json.dumps((state or {}).get("context") or {}))

    def _delegation_drafts_list(self):
        with _DELEGATION_DRAFTS_LOCK:
            data = self._delegation_drafts_load()
            drafts = data.get("drafts") or []
            drafts = sorted(drafts, key=lambda d: d.get("updated_at") or d.get("created_at") or "", reverse=True)
        return self._json({"ok": True, "drafts": drafts, "count": len(drafts)})

    def _delegation_draft_create(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        now = _iso_now()
        draft = {
            "id": payload.get("id") or f"dd_{uuid.uuid4().hex[:10]}",
            "status": payload.get("status") or "draft",
            "created_at": now,
            "updated_at": now,
            "source": payload.get("source") or {},
            "payload": {
                "label": ((payload.get("payload") or {}).get("label") or payload.get("label") or "Draft delegation").strip(),
                "prompt": ((payload.get("payload") or {}).get("prompt") or payload.get("prompt") or "").strip(),
                "mode": ((payload.get("payload") or {}).get("mode") or payload.get("mode") or "safe").strip(),
                "timeout_s": int((payload.get("payload") or {}).get("timeout_s") or payload.get("timeout") or 300),
                "cwd": (payload.get("payload") or {}).get("cwd") or payload.get("cwd"),
            },
            "policy": payload.get("policy") or {"target": "general", "intent": "read", "approval_required": False},
            "context": payload.get("context") or {},
            "approval": payload.get("approval") or {},
            "history": [{
                "ts": now,
                "kind": "created",
                "actor": "ui",
            }],
        }
        self._delegation_draft_snapshot_append(draft, now, "created")
        if not draft["payload"]["prompt"]:
            return self._json({"ok": False, "error": "missing payload.prompt"}, code=400)

        with _DELEGATION_DRAFTS_LOCK:
            data = self._delegation_drafts_load()
            drafts = data.get("drafts") or []
            ix, _existing = self._delegation_draft_find(drafts, draft["id"])
            if ix >= 0:
                return self._json({"ok": False, "error": "draft id already exists"}, code=409)
            drafts.append(draft)
            data["drafts"] = drafts
            self._delegation_drafts_save(data)
        self._delegation_draft_event({
            "ts": now, "kind": "delegation_draft_created", "draft_id": draft["id"],
            "label": draft["payload"]["label"], "policy": draft["policy"],
        })
        return self._json({"ok": True, "draft": draft})

    def _delegation_draft_update(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        draft_id = (payload.get("id") or "").strip()
        patch = payload.get("patch") or {}
        if not draft_id:
            return self._json({"ok": False, "error": "missing id"}, code=400)
        now = _iso_now()
        updated = None
        with _DELEGATION_DRAFTS_LOCK:
            data = self._delegation_drafts_load()
            drafts = data.get("drafts") or []
            ix, d = self._delegation_draft_find(drafts, draft_id)
            if ix < 0:
                return self._json({"ok": False, "error": "draft not found"}, code=404)
            if isinstance(patch.get("source"), dict):
                d["source"] = {**(d.get("source") or {}), **patch["source"]}
            if isinstance(patch.get("payload"), dict):
                d["payload"] = {**(d.get("payload") or {}), **patch["payload"]}
            if isinstance(patch.get("policy"), dict):
                d["policy"] = {**(d.get("policy") or {}), **patch["policy"]}
            if isinstance(patch.get("context"), dict):
                d["context"] = {**(d.get("context") or {}), **patch["context"]}
            if isinstance(patch.get("approval"), dict):
                d["approval"] = {**(d.get("approval") or {}), **patch["approval"]}
            if patch.get("status"):
                d["status"] = str(patch["status"])
            d["updated_at"] = now
            hist = d.get("history") or []
            hist.append({"ts": now, "kind": "updated", "actor": "ui", "patch_keys": sorted(list(patch.keys()))})
            d["history"] = hist[-120:]
            self._delegation_draft_snapshot_append(d, now, "updated")
            drafts[ix] = d
            data["drafts"] = drafts
            self._delegation_drafts_save(data)
            updated = d
        self._delegation_draft_event({
            "ts": now, "kind": "delegation_draft_updated", "draft_id": draft_id,
            "patch_keys": sorted(list((patch or {}).keys())),
        })
        return self._json({"ok": True, "draft": updated})

    def _delegation_draft_delete(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        draft_id = (payload.get("id") or "").strip()
        if not draft_id:
            return self._json({"ok": False, "error": "missing id"}, code=400)
        now = _iso_now()
        removed = None
        with _DELEGATION_DRAFTS_LOCK:
            data = self._delegation_drafts_load()
            drafts = data.get("drafts") or []
            keep = []
            for d in drafts:
                if d.get("id") == draft_id:
                    removed = d
                    continue
                keep.append(d)
            if removed is None:
                return self._json({"ok": False, "error": "draft not found"}, code=404)
            data["drafts"] = keep
            self._delegation_drafts_save(data)
        self._delegation_draft_event({
            "ts": now, "kind": "delegation_draft_deleted", "draft_id": draft_id,
            "label": ((removed.get("payload") or {}).get("label") or ""),
        })
        return self._json({"ok": True, "id": draft_id})

    def _delegation_draft_rewrite(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        draft_id = (payload.get("id") or "").strip()
        instruction = (payload.get("instruction") or "").strip()
        if not draft_id:
            return self._json({"ok": False, "error": "missing id"}, code=400)
        now = _iso_now()
        with _DELEGATION_DRAFTS_LOCK:
            data = self._delegation_drafts_load()
            drafts = data.get("drafts") or []
            ix, d = self._delegation_draft_find(drafts, draft_id)
            if ix < 0:
                return self._json({"ok": False, "error": "draft not found"}, code=404)
            current = ((d.get("payload") or {}).get("prompt") or "").strip()
            if not current:
                return self._json({"ok": False, "error": "draft prompt is empty"}, code=400)

        rewrite_prompt = "\n".join([
            "Rewrite the delegation prompt below for clarity and execution quality.",
            "Keep the same objective and constraints unless explicitly changed.",
            "Return only the rewritten prompt body, no commentary.",
            f"Operator instruction: {instruction or 'Improve structure, precision, and expected output format.'}",
            "",
            "Original prompt:",
            current,
        ])
        provider = "openai" if ENV.get("OPENAI_API_KEY") else "claude_code"
        chat_payload = {
            "provider": provider,
            "timeout": 90,
            "system": "You are an expert prompt editor for operational delegations.",
            "messages": [{"role": "user", "content": [{"type": "text", "text": rewrite_prompt}]}],
        }
        out, route, err = self._intake_dispatch_chat(chat_payload)
        if err or not out:
            return self._json({"ok": False, "error": err or "rewrite failed"}, code=502)
        rewritten = out.strip()
        if len(rewritten) < 12:
            return self._json({"ok": False, "error": "rewrite result too short"}, code=502)

        with _DELEGATION_DRAFTS_LOCK:
            data = self._delegation_drafts_load()
            drafts = data.get("drafts") or []
            ix, d = self._delegation_draft_find(drafts, draft_id)
            if ix < 0:
                return self._json({"ok": False, "error": "draft not found"}, code=404)
            p = d.get("payload") or {}
            p["prompt_original"] = p.get("prompt_original") or p.get("prompt") or ""
            p["prompt"] = rewritten
            d["payload"] = p
            d["updated_at"] = now
            hist = d.get("history") or []
            hist.append({"ts": now, "kind": "rewritten", "actor": "ui", "route": route or provider})
            d["history"] = hist[-120:]
            self._delegation_draft_snapshot_append(d, now, "rewritten")
            drafts[ix] = d
            data["drafts"] = drafts
            self._delegation_drafts_save(data)
        self._delegation_draft_event({
            "ts": now, "kind": "delegation_draft_rewritten", "draft_id": draft_id, "route": route or provider,
        })
        return self._json({"ok": True, "draft": d, "route": route or provider})

    def _delegation_draft_submit(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        draft_id = (payload.get("id") or "").strip()
        if not draft_id:
            return self._json({"ok": False, "error": "missing id"}, code=400)

        now = _iso_now()
        with _DELEGATION_DRAFTS_LOCK:
            data = self._delegation_drafts_load()
            drafts = data.get("drafts") or []
            ix, d = self._delegation_draft_find(drafts, draft_id)
            if ix < 0:
                return self._json({"ok": False, "error": "draft not found"}, code=404)
            policy = d.get("policy") or {}
            if (policy.get("intent") or "").strip().lower() == "write":
                if payload.get("approve_write"):
                    appr = d.get("approval") or {}
                    appr["approved_at"] = now
                    appr["approved_by"] = (payload.get("approved_by") or "operator").strip()
                    d["approval"] = appr
                    d["status"] = "approved"
            perr = self._delegation_policy_error(d)
            if perr:
                return self._json({"ok": False, "error": perr}, code=403)

            d["status"] = "running"
            d["updated_at"] = now
            req_id = f"dl_{draft_id}"
            d["last_request_id"] = req_id
            hist = d.get("history") or []
            hist.append({"ts": now, "kind": "submitted", "actor": "ui", "request_id": req_id})
            d["history"] = hist[-120:]
            self._delegation_draft_snapshot_append(d, now, "submitted")
            drafts[ix] = d
            data["drafts"] = drafts
            self._delegation_drafts_save(data)

        delegate_body = json.dumps({
            "request_id": req_id,
            "prompt": ((d.get("payload") or {}).get("prompt") or "").strip(),
            "mode": ((d.get("payload") or {}).get("mode") or "safe").strip(),
            "label": ((d.get("payload") or {}).get("label") or f"Draft {draft_id}").strip(),
            "timeout": int((d.get("payload") or {}).get("timeout_s") or 300),
            "cwd": (d.get("payload") or {}).get("cwd"),
            "policy": d.get("policy") or {},
            "approval": d.get("approval") or {},
            "source": d.get("source") or {},
            "draft_id": draft_id,
        }).encode("utf-8")

        self._delegation_draft_event({
            "ts": now, "kind": "delegation_draft_submitted", "draft_id": draft_id, "request_id": req_id,
            "policy": d.get("policy") or {},
        })
        return self._delegate_dispatch(delegate_body)

    def _delegation_draft_undo(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        draft_id = (payload.get("id") or "").strip()
        if not draft_id:
            return self._json({"ok": False, "error": "missing id"}, code=400)
        now = _iso_now()
        with _DELEGATION_DRAFTS_LOCK:
            data = self._delegation_drafts_load()
            drafts = data.get("drafts") or []
            ix, d = self._delegation_draft_find(drafts, draft_id)
            if ix < 0:
                return self._json({"ok": False, "error": "draft not found"}, code=404)
            snaps = d.get("snapshots") or []
            if len(snaps) < 2:
                return self._json({"ok": False, "error": "nothing to undo yet"}, code=409)
            snaps = snaps[:-1]
            prev = snaps[-1].get("state") or {}
            self._delegation_draft_apply_state(d, prev)
            d["snapshots"] = snaps
            d["updated_at"] = now
            hist = d.get("history") or []
            hist.append({"ts": now, "kind": "undone", "actor": "ui"})
            d["history"] = hist[-120:]
            drafts[ix] = d
            data["drafts"] = drafts
            self._delegation_drafts_save(data)
        self._delegation_draft_event({
            "ts": now, "kind": "delegation_draft_undone", "draft_id": draft_id,
        })
        return self._json({"ok": True, "draft": d})

    def _delegate_dispatch(self, body):
        if not CLAUDE_BIN:
            return self._json({
                "ok": False,
                "error": "claude binary not found on server PATH",
                "hint": "Install Claude Code or export CLAUDE_BIN before starting server.py",
            }, code=503)
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        prompt = (payload.get("prompt") or "").strip()
        if not prompt:
            return self._json({"ok": False, "error": "missing prompt"}, code=400)
        mode = payload.get("mode") or "safe"        # 'safe' | 'trusted'
        label = payload.get("label") or "(untitled)"
        cwd_override = payload.get("cwd")
        cwd = Path(cwd_override) if cwd_override else (HERE / "CCAgentindex")
        timeout_s = int(payload.get("timeout") or 300)
        policy = payload.get("policy") or {}
        approval = payload.get("approval") or {}
        source = payload.get("source") or {}
        draft_id = (payload.get("draft_id") or "").strip() or None

        # Server-enforced target and write-approval policy gate.
        target = (policy.get("target") or "").strip().lower()
        intent = (policy.get("intent") or "").strip().lower()
        if target == "clickup" and not ENV.get("CLICKUP_API_TOKEN"):
            return self._json({"ok": False, "error": "clickup target unavailable (missing CLICKUP_API_TOKEN)"}, code=409)
        if target == "close" and not ENV.get("CLOSE_API_KEY"):
            return self._json({"ok": False, "error": "close target unavailable (missing CLOSE_API_KEY)"}, code=409)
        if target in ("claude_code", "cursor") and not CLAUDE_BIN:
            return self._json({"ok": False, "error": "claude_code target unavailable (binary missing)"}, code=409)
        if target == "github":
            gh = _github_mcp_status()
            if not gh.get("available"):
                return self._json({"ok": False, "error": "github mcp unavailable", "github_mcp": gh}, code=409)
        if intent == "read":
            mode = "safe"
        if intent == "write":
            if target != "general":
                if not policy.get("approval_required"):
                    return self._json({"ok": False, "error": f"{target or 'target'} write requires approval_required=true"}, code=403)
                if not (approval or {}).get("approved_at"):
                    return self._json({"ok": False, "error": f"{target or 'target'} write requires explicit approval"}, code=403)
            mode = "trusted"

        request_id = payload.get("request_id") or f"dl_{uuid.uuid4().hex[:10]}"
        result_dir = self._delegations_dir()
        result_dir.mkdir(parents=True, exist_ok=True)
        result_path = result_dir / f"{request_id}.json"

        initial = {
            "request_id": request_id,
            "status": "running",
            "label": label,
            "prompt": prompt,
            "mode": mode,
            "cwd": str(cwd),
            "started_at": _iso_now(),
            "claude_bin": CLAUDE_BIN,
            "policy": policy,
            "approval": approval,
            "source": source,
            "draft_id": draft_id,
        }
        result_path.write_text(json.dumps(initial, ensure_ascii=False, indent=2))

        t = threading.Thread(
            target=_run_delegation,
            args=(request_id, prompt, mode, cwd, result_path, timeout_s, payload.get("claude_args") or []),
            daemon=True,
        )
        t.start()

        self._activity_ledger_write({
            "ts": _iso_now(),
            "kind": "delegation_dispatch",
            "actor": "ui",
            "request_id": request_id,
            "label": label,
            "mode": mode,
            "target": target or "general",
            "intent": intent or "run",
            "draft_id": draft_id,
        })

        return self._json({"ok": True, "request_id": request_id, "status": "running"})

    def _delegate_read(self, rid):
        import re
        if not re.fullmatch(r"[A-Za-z0-9_-]+", rid):
            return self._json({"ok": False, "error": "bad id"}, code=400)
        p = self._delegations_dir() / f"{rid}.json"
        if not p.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            data = json.loads(p.read_text())
            draft_id = data.get("draft_id")
            status = (data.get("status") or "").strip().lower()
            if draft_id and status in ("done", "failed", "timeout", "killed"):
                with _DELEGATION_DRAFTS_LOCK:
                    store = self._delegation_drafts_load()
                    drafts = store.get("drafts") or []
                    ix, d = self._delegation_draft_find(drafts, draft_id)
                    if ix >= 0 and (d.get("status") not in ("done", "failed")):
                        d["status"] = "done" if status == "done" else "failed"
                        d["updated_at"] = _iso_now()
                        hist = d.get("history") or []
                        hist.append({
                            "ts": _iso_now(),
                            "kind": "run_finished",
                            "actor": "system",
                            "request_id": rid,
                            "status": status,
                        })
                        d["history"] = hist[-120:]
                        drafts[ix] = d
                        store["drafts"] = drafts
                        self._delegation_drafts_save(store)
            return self._json(data)
        except Exception as e:
            return self._json({"ok": False, "error": f"parse: {e}"}, code=500)

    def _delegate_list(self):
        d = self._delegations_dir()
        if not d.exists():
            return self._json({"delegations": [], "count": 0, "claude_bin": CLAUDE_BIN})
        items = []
        for p in sorted(d.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
            if p.suffix != ".json":
                continue
            try:
                items.append(json.loads(p.read_text()))
            except Exception:
                items.append({"request_id": p.stem, "status": "unreadable"})
        return self._json({"delegations": items, "count": len(items), "claude_bin": CLAUDE_BIN})

    # ────── Ledger: general-purpose append-only jsonl files ─────────────
    # Used by the activity ledger and any future streaming logs. Scoped to
    # CCAgentindex/_ledger/<name>.jsonl.

    def _ledger_path(self, name):
        import re
        safe = re.sub(r"[^a-zA-Z0-9_-]", "", name)[:64]
        if not safe:
            return None
        return HERE / "CCAgentindex" / "_ledger" / f"{safe}.jsonl"

    def _ledger_append(self, name, body):
        p = self._ledger_path(name)
        if p is None:
            return self._json({"ok": False, "error": "bad ledger name"}, code=400)
        try:
            event = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        from datetime import datetime, timezone
        event.setdefault("t", datetime.now(timezone.utc).isoformat())
        p.parent.mkdir(parents=True, exist_ok=True)
        with p.open("a", encoding="utf-8") as f:
            f.write(json.dumps(event, ensure_ascii=False) + "\n")
        return self._json({"ok": True})

    def _ledger_read(self, name):
        p = self._ledger_path(name)
        if p is None:
            return self._json({"ok": False, "error": "bad ledger name"}, code=400)
        events = []
        if p.exists():
            for raw in p.read_text().splitlines():
                s = raw.strip()
                if not s: continue
                try: events.append(json.loads(s))
                except Exception: events.append({"_parse_error": True, "raw": s})
        return self._json({"events": events, "count": len(events)})

    def _proxy(self):
        parts = self.path.split("/", 4)
        # parts: ['', 'api', 'proxy', '<service>', '<rest>']
        if len(parts) < 5:
            return self.send_error(400, "bad proxy path")
        service = parts[3]
        rest = "/" + parts[4]
        up = UPSTREAMS.get(service)
        if not up:
            return self.send_error(404, f"unknown service '{service}'")
        if not any(rest.startswith(w) for w in up["whitelist"]):
            return self.send_error(403, f"path not allowed: {rest}")

        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None

        # Demo-mode guardrail: block write-methods on connector services.
        # OpenAI is exempt (its POSTs are reasoning, not side-effectful side-writes).
        demo = self.headers.get("X-Demo-Mode", "").strip() == "1"
        write_method = self.command in ("POST", "PUT", "PATCH", "DELETE")
        is_connector = service in ("close", "clickup", "slack")
        if demo and write_method and is_connector:
            blocked = {
                "demo_blocked": True,
                "service": service,
                "method": self.command,
                "path": rest,
                "would_have_sent": None,
                "note": "Demo mode is ON — this write was NOT forwarded to the upstream service.",
            }
            try:
                if body:
                    blocked["would_have_sent"] = json.loads(body.decode("utf-8"))
            except Exception:
                blocked["would_have_sent"] = "<non-json body omitted>"
            return self._json(blocked, code=202)

        url = up["base"] + rest
        req = urllib.request.Request(url, data=body, method=self.command)
        ct = self.headers.get("Content-Type")
        if ct:
            req.add_header("Content-Type", ct)
        for k, v in up["auth"]().items():
            req.add_header(k, v)

        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                data = resp.read()
                self.send_response(resp.status)
                self.send_header("Content-Type", resp.headers.get("Content-Type", "application/octet-stream"))
                self._cors()
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            data = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", e.headers.get("Content-Type", "application/json"))
            self._cors()
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            self.send_error(502, f"proxy error: {e}")

    def _json(self, obj, code=200):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _html(self, text, code=200):
        body = (text or "").encode("utf-8", errors="replace")
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *a):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % a))


def main():
    # Render (and similar hosts) provide PORT via environment; keep argv/local fallback.
    port_env = os.environ.get("PORT", "").strip()
    if port_env:
        port = int(port_env)
    else:
        port = int(sys.argv[1]) if len(sys.argv) > 1 else 3422
    host = os.environ.get("HOST", "0.0.0.0").strip() or "0.0.0.0"
    os.chdir(HERE)
    display_host = "localhost" if host == "127.0.0.1" else host
    print(f"[secretary] serving {HERE} on http://{display_host}:{port}", flush=True)
    print(f"[secretary] env: openai={bool(ENV.get('OPENAI_API_KEY'))} "
          f"close={bool(ENV.get('CLOSE_API_KEY'))} "
          f"clickup={bool(ENV.get('CLICKUP_API_TOKEN'))} "
          f"slack={bool(ENV.get('SLACK_BOT_TOKEN'))} "
          f"twilio={bool(ENV.get('TWILIO_ACCOUNT_SID'))} "
          f"pieces={_pieces_available()}", flush=True)
    if ENV.get("SLACK_BOT_TOKEN", "").startswith("xapp-"):
        print("[secretary] warning: SLACK_BOT_TOKEN is an app-level token (xapp-); "
              "Web API calls need an xoxb- Bot User OAuth Token.", flush=True)
    if CLAUDE_BIN:
        print(f"[secretary] claude code delegate ready → {CLAUDE_BIN}", flush=True)
    else:
        print("[secretary] claude code binary not found — delegation endpoint will 503", flush=True)
    if CODEX_BIN:
        print(f"[secretary] codex cli provider ready → {CODEX_BIN}", flush=True)
    else:
        print("[secretary] codex cli binary not found — Codex provider will 503", flush=True)
    # Auto-resolve a ClickUp default list so the user never has to paste an id.
    if ENV.get("CLICKUP_API_TOKEN") and ENV.get("CLICKUP_SPACE_ID"):
        cl = resolve_and_cache_clickup()
        if cl["list_id"]:
            print(f"[secretary] clickup default list → {cl['list_name']!r} "
                  f"(id {cl['list_id']}, via {cl['source']})", flush=True)
        else:
            print(f"[secretary] clickup list auto-resolve failed: {cl['source']}", flush=True)

    # Background Pieces sweeper — fires hourly even when the browser is closed.
    # Ensures _ledger/pieces_sweeps.jsonl is always current; Rodbot can ask
    # the ledger to reconstruct any past activity window.
    def _pieces_background_sweep():
        import time
        SWEEP_SECONDS = 3600  # hourly
        # Initial delay — let the server finish booting.
        time.sleep(20)
        while True:
            try:
                if _pieces_available():
                    # Read last sweep timestamp to make the next ask delta-aware.
                    sweeps_path = HERE / "CCAgentindex" / "_ledger" / "pieces_sweeps.jsonl"
                    last_ts = None
                    if sweeps_path.exists():
                        try:
                            with sweeps_path.open("rb") as f:
                                f.seek(0, 2); end = f.tell()
                                f.seek(max(0, end - 8192))
                                tail = f.read().decode("utf-8", "replace").strip().splitlines()
                            for ln in reversed(tail):
                                if ln.strip():
                                    last_ts = json.loads(ln).get("ts"); break
                        except Exception: pass
                    if last_ts:
                        question = (
                            f"What has the team done since {last_ts}? "
                            "Focus on: apps/files/URLs touched, projects advanced, people "
                            "mentioned, decisions made. Terse — a paragraph plus bullets. "
                            "If nothing new, say so in one line."
                        )
                    else:
                        question = (
                            "Summarize what the team has been working on in the last 2 hours. "
                            "Focus on: apps/files/URLs, projects, people, decisions."
                        )
                    # Make the MCP call directly (reusing _pieces_call_ask requires
                    # a Handler instance; inline the two lines we need).
                    resp = None
                    try:
                        resp = _pieces_rpc({
                            "jsonrpc": "2.0", "id": uuid.uuid4().int & 0xffffffff,
                            "method": "tools/call",
                            "params": {
                                "name": "ask_pieces_ltm",
                                "arguments": {
                                    "question": question,
                                    "chat_llm": "claude-sonnet-4-5",
                                    "connected_client": "Comeketo Agent-bg",
                                },
                            },
                        })
                    except Exception as e:
                        print(f"[pieces-bg] rpc failed: {e}", flush=True)
                    if resp and "result" in resp:
                        content = (resp["result"] or {}).get("content") or []
                        text = "\n\n".join(c.get("text", "") for c in content if c.get("type") == "text")
                        record = {
                            "ts":       _iso_now(),
                            "since":    last_ts,
                            "question": question,
                            "raw":      text,
                            "actor":    "background",
                        }
                        sweeps_path.parent.mkdir(parents=True, exist_ok=True)
                        with sweeps_path.open("a", encoding="utf-8") as f:
                            f.write(json.dumps(record, ensure_ascii=False) + "\n")
                        print(f"[pieces-bg] sweep written ({len(text)} chars)", flush=True)
            except Exception as e:
                print(f"[pieces-bg] unexpected error: {e}", flush=True)
            time.sleep(SWEEP_SECONDS)

    t = threading.Thread(target=_pieces_background_sweep, daemon=True)
    t.start()
    print("[secretary] pieces background sweeper started (hourly)", flush=True)

    ThreadingHTTPServer((host, port), Handler).serve_forever()


if __name__ == "__main__":
    main()

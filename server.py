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
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent


def _iso_now():
    return datetime.now(timezone.utc).isoformat()


# Locate the `claude` binary. Server's PATH is minimal; the login shell has
# the real one. Probe it once at startup and cache.
def _find_claude_binary():
    direct = shutil.which("claude")
    if direct:
        return direct
    try:
        result = subprocess.run(
            ["/bin/zsh", "-l", "-c", "which claude"],
            capture_output=True, text=True, timeout=5,
        )
        path = result.stdout.strip().splitlines()[-1] if result.stdout.strip() else ""
        if path and Path(path).exists():
            return path
    except Exception:
        pass
    for candidate in [
        Path.home() / ".claude" / "local" / "claude",
        Path("/opt/homebrew/bin/claude"),
        Path("/usr/local/bin/claude"),
    ]:
        if candidate.exists():
            return str(candidate)
    return None


CLAUDE_BIN = _find_claude_binary()

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


def _run_delegation(request_id, prompt, mode, cwd, result_path, timeout_s):
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


# ═══════════════════ Analytics CSV parsers ═══════════════════

def _csv_rows(path):
    import csv
    with open(path, newline="", encoding="utf-8", errors="replace") as f:
        return list(csv.reader(f))

def _find_rawfile(rawdir, fragment):
    import os
    # Files have long cosmetic names; match by substring so we don't care
    # about exact spacing/emoji/punctuation.
    for fn in os.listdir(rawdir):
        if fragment.lower() in fn.lower():
            return rawdir / fn
    raise FileNotFoundError(rawdir / fragment)

def _to_num(s):
    if s is None: return None
    s = str(s).strip().replace("$","").replace(",","").replace("%","")
    if not s or s == "#DIV/0!": return None
    try: return float(s)
    except Exception: return None

def _parse_tasting_conversion(rawdir):
    path = _find_rawfile(rawdir, "MONTHLY TASTING CONVERSION")
    rows = _csv_rows(path)
    # header row: MONTH, # Attended, # Won, # Pending, Tasting→Booking %, DATE
    data = []
    for r in rows[2:]:
        if len(r) < 5: continue
        month = (r[0] or "").strip()
        if not month: continue
        attended = _to_num(r[1])
        won      = _to_num(r[2])
        pending  = _to_num(r[3])
        rate     = _to_num(r[4])
        if attended is None: continue
        data.append({
            "month": month,
            "attended": int(attended or 0),
            "won": int(won or 0),
            "pending": int(pending or 0),
            "conversion_rate": rate,  # percentage
        })
    # Totals across the period
    total_attended = sum(d["attended"] for d in data)
    total_won      = sum(d["won"]      for d in data)
    total_pending  = sum(d["pending"]  for d in data)
    overall_rate   = (total_won / total_attended * 100) if total_attended else None
    return {
        "ok": True,
        "dataset": "tasting_conversion",
        "months": data,
        "totals": {
            "attended": total_attended,
            "won":      total_won,
            "pending":  total_pending,
            "conversion_rate": overall_rate,
        },
    }

def _parse_lead_sources(rawdir):
    path = _find_rawfile(rawdir, "Leads Source")
    rows = _csv_rows(path)
    # row 0: headers — first col is lead name, rest are source columns + TOTAL
    header = rows[0]
    source_cols = [(i, h.strip()) for i, h in enumerate(header[1:], start=1) if h.strip() and h.strip().upper() not in ("TOTAL", "COLUMN 1")]
    counts = {name: 0 for _, name in source_cols}
    leads_per_source = {name: [] for _, name in source_cols}
    total_leads = 0
    for r in rows[1:]:
        if len(r) < 2: continue
        lead = (r[0] or "").strip()
        if not lead: continue
        total_leads += 1
        for i, name in source_cols:
            val = r[i] if i < len(r) else ""
            if val and val.strip():
                counts[name] += 1
                leads_per_source[name].append(lead)
    # Sort sources by count desc and drop zeros
    ranked = sorted(
        [{"source": name, "count": counts[name], "sample_leads": leads_per_source[name][:5]}
         for name in counts if counts[name] > 0],
        key=lambda x: -x["count"],
    )
    return {
        "ok": True,
        "dataset": "lead_sources",
        "period": "December 2025",
        "total_leads": total_leads,
        "sources": ranked,
    }

def _parse_revenue_timeline(rawdir):
    path = _find_rawfile(rawdir, "Payments _ Cash Collection _ Cash Flow")
    rows = _csv_rows(path)
    # Row 0: explanatory note. Row 1: week-range headers (col 0 = "Won Deals"
    # label, cols 1..n = "7/6/25 - 7/12/25"). Row 2: weekly totals (col 0 =
    # grand total $693,837, cols 1..n = per-week totals). Row 3+: individual
    # customer payment rows (not needed here).
    if len(rows) < 3:
        raise ValueError("revenue file too short")
    headers = rows[1][1:]
    totals  = rows[2][1:]
    weekly = []
    for h, t in zip(headers, totals):
        h = (h or "").strip(); t = (t or "").strip()
        if not h: continue
        n = _to_num(t)
        # Keep zero weeks — the timeline should show flat periods too
        if n is None: n = 0
        start = h.split(" - ")[0].strip()
        weekly.append({"week_start": start, "week_label": h, "revenue": n})
    grand_total = _to_num(rows[2][0]) or sum(w["revenue"] for w in weekly)
    # Peak + running stats
    non_zero = [w for w in weekly if w["revenue"] > 0]
    peak = max(non_zero, key=lambda w: w["revenue"]) if non_zero else None
    avg = (sum(w["revenue"] for w in non_zero) / len(non_zero)) if non_zero else 0
    return {
        "ok": True,
        "dataset": "revenue_timeline",
        "weeks": weekly,
        "grand_total": grand_total,
        "peak_week": peak,
        "avg_weekly": avg,
        "active_weeks": len(non_zero),
        "week_count": len(weekly),
    }

def _parse_venue_partners(rawdir):
    path = _find_rawfile(rawdir, "Venue Partners")
    rows = _csv_rows(path)
    # Column 0: "# OF COMPLETED EVENTS" banner OR row with tier+venue.
    # Column 3: VENUE NAME. Column 1: tier. We treat rows where col 3 has a
    # real venue name as venue records, and interpret col 0 to extract the
    # event-count bucket.
    venues = []
    current_bucket = None
    import re
    for r in rows[2:]:
        if len(r) < 4: continue
        banner = (r[0] or "").strip().upper()
        m = re.match(r"COMPLETED\s+(\d+)\s+EVENTS?", banner)
        if m:
            current_bucket = int(m.group(1))
            continue
        name = (r[3] or "").strip()
        tier = (r[1] or "").strip()
        address = (r[5] or "").strip() if len(r) > 5 else ""
        if not name: continue
        # Skip tier-header rows (they have tier but no venue)
        if tier and not name: continue
        events = current_bucket if current_bucket is not None else (_to_num(r[0]) or 0)
        venues.append({
            "name": name,
            "tier": tier or None,
            "events_completed": int(events or 0),
            "address": address or None,
        })
    # Aggregate by tier
    tiers = {}
    for v in venues:
        k = v.get("tier") or "Unclassified"
        tiers[k] = tiers.get(k, 0) + 1
    # Top venues by events
    top_venues = sorted([v for v in venues if v["events_completed"] > 0], key=lambda v: -v["events_completed"])[:20]
    return {
        "ok": True,
        "dataset": "venue_partners",
        "venues": venues,
        "venue_count": len(venues),
        "partnered_count": sum(1 for v in venues if v["tier"] and "TIER" in (v["tier"] or "").upper()),
        "top_venues": top_venues,
        "tiers": [{"tier": t, "count": n} for t, n in sorted(tiers.items(), key=lambda x: -x[1])],
    }

def _parse_event_labor(rawdir):
    path = _find_rawfile(rawdir, "Event Labor Projection")
    rows = _csv_rows(path)
    # Each row: WEEK label, Event, COUNTA event date, (blank), WEEK (number), staff_counta, bartender, extra
    weeks = []
    import re
    for r in rows[1:]:
        if len(r) < 3: continue
        label = (r[0] or "").strip()
        if not label or label.lower().startswith("total") or label.lower() == "grand total":
            continue
        count = _to_num(r[2])
        if count is None: continue
        m = re.match(r"Week\s*(\d+)\s*\(([^)]+)\)\s*(Total)?", label, re.I)
        if not m: continue
        week_num = int(m.group(1))
        window = m.group(2).strip()
        is_total = bool(m.group(3))
        if is_total:
            weeks.append({"week": week_num, "window": window, "events": int(count)})
    return {
        "ok": True,
        "dataset": "event_labor",
        "weeks": sorted(weeks, key=lambda w: w["week"]),
    }

def _build_overview(rawdir):
    # Headline numbers across every dataset for the Analytics → Overview tab.
    out = {"ok": True, "dataset": "overview"}
    try:
        tc = _parse_tasting_conversion(rawdir); out["tasting"] = tc["totals"]; out["tasting"]["months"] = tc["months"]
    except Exception as e: out["tasting_error"] = str(e)
    try:
        ls = _parse_lead_sources(rawdir)
        out["lead_sources"] = {"total_leads": ls["total_leads"], "top_3": ls["sources"][:3]}
    except Exception as e: out["lead_sources_error"] = str(e)
    try:
        rt = _parse_revenue_timeline(rawdir)
        out["revenue"] = {"grand_total": rt["grand_total"], "peak_week": rt["peak_week"], "week_count": rt["week_count"]}
    except Exception as e: out["revenue_error"] = str(e)
    try:
        vp = _parse_venue_partners(rawdir)
        out["venues"] = {"venue_count": vp["venue_count"], "partnered_count": vp["partnered_count"], "top_tier": vp["tiers"][:3]}
    except Exception as e: out["venues_error"] = str(e)
    return out


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
        p = self._api_path()
        if p.startswith("/api/analytics/"):
            name = p[len("/api/analytics/"):]
            return self._analytics_get(name)
        if p == "/api/status":
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
                # Absolute paths so the browser-side AI can't hallucinate write targets.
                "workspace_root": str(HERE),
                "bedrock_root":   str(HERE / "CCAgentindex"),
            })
        if p == "/api/clickup/rescan":
            # Re-resolve on demand (e.g. after user renames a list in ClickUp).
            result = resolve_and_cache_clickup()
            return self._json(result)
        if p == "/api/inbox":
            return self._inbox_list()
        if p == "/api/briefings":
            return self._briefings_list()
        if p.startswith("/api/briefings/"):
            slug = p[len("/api/briefings/"):]
            return self._briefing_read(slug)
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
        if p.startswith("/api/delegate/"):
            rid = p[len("/api/delegate/"):]
            return self._delegate_read(rid)
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
        if p == "/api/projects":
            return self._projects_list()
        if p.startswith("/api/projects/"):
            pid = p[len("/api/projects/"):].split("/")[0]
            return self._project_read(pid)
        if p == "/api/workflows/list":
            return self._workflows_list()
        if p.startswith("/api/workflows/get"):
            return self._workflow_get()
        if p == "/api/catalog/edges/list":
            return self._catalog_edges_list()
        if p.startswith("/api/catalog/edges/get"):
            return self._catalog_edge_get()
        if p.startswith("/annotations/"):
            return self._annotation_serve()
        if p == "/api/tables/list":
            return self._tables_list()
        if p.startswith("/api/tables/get"):
            return self._table_get()
        if p.startswith("/api/charts/list"):
            return self._charts_list()
        if p.startswith("/api/charts/get"):
            return self._chart_get()
        if p == "/api/rodbot/identity":
            return self._rodbot_identity()
        if p == "/api/rodbot/palette":
            return self._rodbot_palette()
        if p == "/api/rodbot/character":
            return self._rodbot_character()
        if p == "/api/rodbot/traits":
            return self._rodbot_traits()
        if p.startswith("/api/rodbot/memory"):
            return self._rodbot_memory_read()
        if p.startswith("/api/rodbot/reflections"):
            return self._rodbot_reflections_read()
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

    # ────── Rodbot: the reflective intelligence inside Comeketo Agent ──────────
    # Rodbot watches ledger events and distills them into structured memories.
    # She runs on OpenAI (gpt-5.4-mini by default — cheap, fast, always-on) even
    # when the main chat is routed to Claude Code. This is deliberate:
    # reflections are background work and shouldn't burn your Max plan turns.

    def _rodbot_dir(self):
        return HERE / "CCAgentindex" / "Rodbot"

    def _rodbot_identity(self):
        p = self._rodbot_dir() / "identity.md"
        if not p.exists():
            return self._json({"ok": False, "error": "identity.md missing"}, code=404)
        return self._json({"ok": True, "body": p.read_text(encoding="utf-8")})

    def _rodbot_character(self):
        p = self._rodbot_dir() / "character.md"
        if not p.exists():
            return self._json({"ok": True, "body": ""})
        return self._json({"ok": True, "body": p.read_text(encoding="utf-8")})

    def _rodbot_traits(self):
        p = self._rodbot_dir() / "traits.md"
        if not p.exists():
            return self._json({"ok": True, "body": ""})
        return self._json({"ok": True, "body": p.read_text(encoding="utf-8")})

    def _rodbot_palette(self):
        # Compressed essence only — the full palette is ~10KB, too heavy for
        # every reflection. Essence is ~2KB and steers voice without quoting.
        p = self._rodbot_dir() / "affective_essence.md"
        if not p.exists():
            return self._json({"ok": True, "body": ""})
        return self._json({"ok": True, "body": p.read_text(encoding="utf-8")})

    def _rodbot_memory_path(self):
        return self._rodbot_dir() / "memory.jsonl"

    def _rodbot_reflections_path(self):
        return self._rodbot_dir() / "reflections.jsonl"

    def _read_jsonl_tail(self, p, limit):
        if not p.exists():
            return []
        lines = p.read_text(encoding="utf-8").splitlines()
        out = []
        for raw in lines[-max(limit, 1):] if limit else lines:
            s = raw.strip()
            if not s: continue
            try: out.append(json.loads(s))
            except Exception: out.append({"_parse_error": True, "raw": s})
        return out

    def _rodbot_memory_read(self):
        q = self.path.split("?", 1)[1] if "?" in self.path else ""
        params = urllib.parse.parse_qs(q)
        try:
            limit = int((params.get("limit") or ["0"])[0])
        except Exception:
            limit = 0
        memories = self._read_jsonl_tail(self._rodbot_memory_path(), limit)
        return self._json({"ok": True, "count": len(memories), "memories": memories})

    def _rodbot_reflections_read(self):
        q = self.path.split("?", 1)[1] if "?" in self.path else ""
        params = urllib.parse.parse_qs(q)
        try:
            limit = int((params.get("limit") or ["100"])[0])
        except Exception:
            limit = 100
        items = self._read_jsonl_tail(self._rodbot_reflections_path(), limit)
        return self._json({"ok": True, "count": len(items), "reflections": items})

    def _rodbot_reflect(self, body):
        """Persist a pre-generated reflection.

        The LLM call happens client-side via SecretaryAI.respond() — the same
        path chat, grid generation, and commitment drafting use. This endpoint
        is purely persistence: it receives the parsed reflection object, writes
        the audit trail, writes a memory if importance clears the threshold,
        and files an inbox entry if the reflection is actionable.

        Request: {
          parsed: {summary, tags, actionable, action_hint, related, importance, source_kinds, abstain},
          source_event_count: int,
          model: "gpt-5.4-mini" (informational — just recorded),
          min_importance_to_remember: 0.5
        }
        """
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)

        parsed = payload.get("parsed") or {}
        if not isinstance(parsed, dict):
            return self._json({"ok": False, "error": "missing parsed"}, code=400)

        threshold = float(payload.get("min_importance_to_remember") or 0.5)
        now = datetime.now(timezone.utc).isoformat()

        # Record parse failures as reflection entries so the team can see what went wrong.
        if parsed.get("parse_error"):
            raw_entry = {
                "id": "ref_" + uuid.uuid4().hex[:10], "t": now, "parse_error": True,
                "raw": (parsed.get("raw") or "")[:2000],
                "source_event_count": int(payload.get("source_event_count") or 0),
                "model": payload.get("model") or "",
            }
            self._append_jsonl(self._rodbot_reflections_path(), raw_entry)
            return self._json({"ok": False, "error": "client reported parse error", "recorded": True}, code=202)

        reflection = {
            "id": "ref_" + uuid.uuid4().hex[:10],
            "t": now,
            "summary":      (parsed.get("summary") or "").strip(),
            "affect":       (parsed.get("affect") or "neutral").strip().lower(),
            "tags":         [t for t in (parsed.get("tags") or []) if isinstance(t, str)],
            "actionable":   bool(parsed.get("actionable")),
            "action_hint":  parsed.get("action_hint") or None,
            "related":      parsed.get("related") or {},
            "importance":   0.0 if parsed.get("abstain") else float(parsed.get("importance") or 0.0),
            "source_kinds": [k for k in (parsed.get("source_kinds") or []) if isinstance(k, str)],
            "abstain":      bool(parsed.get("abstain")),
            "source_event_count": int(payload.get("source_event_count") or 0),
            "model":        payload.get("model") or "",
        }

        self._append_jsonl(self._rodbot_reflections_path(), reflection)

        wrote_memory = False
        if not reflection["abstain"] and reflection["importance"] >= threshold and reflection["summary"]:
            mem = {
                "id": "mem_" + uuid.uuid4().hex[:10],
                "t": now,
                "summary":      reflection["summary"],
                "affect":       reflection["affect"],
                "tags":         reflection["tags"],
                "actionable":   reflection["actionable"],
                "action_hint":  reflection["action_hint"],
                "related":      reflection["related"],
                "importance":   reflection["importance"],
                "source_kinds": reflection["source_kinds"],
                "reflection_id": reflection["id"],
            }
            self._append_jsonl(self._rodbot_memory_path(), mem)
            wrote_memory = True

        wrote_inbox = False
        if reflection["actionable"] and reflection["importance"] >= threshold and reflection["summary"]:
            try:
                inbox_entry = {
                    "id": "ib_" + uuid.uuid4().hex[:10],
                    "kind": "note",
                    "text": reflection["summary"] + (f"\n\n→ {reflection['action_hint']}" if reflection["action_hint"] else ""),
                    "status": "open",
                    "source": {"origin": "Rodbot", "reflection_id": reflection["id"]},
                    "meta":   {"tags": reflection["tags"], "importance": reflection["importance"]},
                    "t": now,
                }
                self._append_jsonl(self._inbox_path(), inbox_entry)
                wrote_inbox = True
            except Exception:
                pass

        return self._json({"ok": True, "reflection": reflection, "wrote_memory": wrote_memory, "wrote_inbox": wrote_inbox})

    def _append_jsonl(self, p, obj):
        p.parent.mkdir(parents=True, exist_ok=True)
        with p.open("a", encoding="utf-8") as f:
            f.write(json.dumps(obj, ensure_ascii=False) + "\n")

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

    def _inbox_path(self):
        return HERE / "CCAgentindex" / "_inbox" / "inbox.jsonl"

    def _inbox_list(self):
        p = self._inbox_path()
        entries = []
        if p.exists():
            for i, raw in enumerate(p.read_text().splitlines()):
                s = raw.strip()
                if not s: continue
                try: entries.append(json.loads(s))
                except Exception: entries.append({"_parse_error": True, "_line": i, "raw": s})
        return self._json({"entries": entries, "count": len(entries)})

    def _inbox_append(self, body):
        try:
            entry = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        # Ensure required fields / defaults.
        from datetime import datetime, timezone
        import uuid
        entry.setdefault("id", f"ibx_{uuid.uuid4().hex[:10]}")
        entry.setdefault("t", datetime.now(timezone.utc).isoformat())
        entry.setdefault("kind", "note")
        entry.setdefault("status", "open")
        entry.setdefault("text", "")
        p = self._inbox_path()
        p.parent.mkdir(parents=True, exist_ok=True)
        with p.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
        return self._json({"ok": True, "entry": entry, "path": str(p.relative_to(HERE))})

    def _inbox_update(self, body):
        try:
            patch = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        target_id = patch.get("id")
        if not target_id:
            return self._json({"ok": False, "error": "missing id"}, code=400)
        p = self._inbox_path()
        if not p.exists():
            return self._json({"ok": False, "error": "no inbox yet"}, code=404)
        lines = p.read_text().splitlines()
        out = []
        updated = None
        for line in lines:
            s = line.strip()
            if not s: continue
            try:
                e = json.loads(s)
            except Exception:
                out.append(line); continue
            if e.get("id") == target_id:
                for k, v in patch.items():
                    if k == "id": continue
                    e[k] = v
                updated = e
            out.append(json.dumps(e, ensure_ascii=False))
        if not updated:
            return self._json({"ok": False, "error": "id not found"}, code=404)
        p.write_text("\n".join(out) + "\n", encoding="utf-8")
        return self._json({"ok": True, "entry": updated})

    def do_POST(self):    return self._api_or_404()
    def do_PUT(self):     return self._api_or_404()
    def do_DELETE(self):  return self._api_or_404()
    def do_PATCH(self):   return self._api_or_404()

    # ────── Projects: list/read/write project JSON files ─────────────────
    # Path: CCAgentindex/projects/<id>.json
    # Schema is additive — existing fields preserved, new fields (phases,
    # deliverables, tasks, wins, misses) layered on top without breaking
    # projects that don't have them yet.
    def _projects_dir(self):
        return HERE / "CCAgentindex" / "projects"

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

    # ────── Tables: structured-row persistence ───────────────────────────
    # Files at CCAgentindex/tables/<slug>.json
    # Each table is {slug, name, schema: [{key, label, type, ...}], rows: [...],
    #                metadata: {created_at, updated_at, template?, provenance?}}.
    # Save appends a table_created OR table_updated ledger event.
    # _table_add_rows appends a table_row_added event per row batch.
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

    def _tables_list(self):
        d = self._tables_dir()
        out = []
        if d.exists():
            for p in sorted(d.glob("*.json")):
                try:
                    data = json.loads(p.read_text(encoding="utf-8"))
                    meta = data.get("metadata") or {}
                    stat = p.stat()
                    mtime = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat()
                    rows = data.get("rows") or []
                    schema = data.get("schema") or []
                    out.append({
                        "slug":       p.stem,
                        "name":       data.get("name") or p.stem,
                        "row_count":  len(rows),
                        "col_count":  len(schema),
                        "template":   meta.get("template"),
                        "updated_at": meta.get("updated_at") or mtime,
                        "created_at": meta.get("created_at"),
                    })
                except Exception:
                    out.append({"slug": p.stem, "name": p.stem, "_parse_error": True})
        return self._json({"ok": True, "items": out, "count": len(out)})

    def _table_get(self):
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        slug = (qs.get("slug") or [""])[0].strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        path = self._tables_dir() / f"{slug}.json"
        if not path.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            return self._json({"ok": False, "error": f"parse failed: {e}"}, code=500)
        return self._json({"ok": True, "slug": slug, "table": data})

    def _table_save(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        slug = (payload.get("slug") or "").strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        name = (payload.get("name") or slug).strip()
        schema = payload.get("schema") or []
        if not isinstance(schema, list) or not schema:
            return self._json({"ok": False, "error": "schema must be a non-empty list"}, code=400)
        rows = payload.get("rows") or []
        if not isinstance(rows, list):
            return self._json({"ok": False, "error": "rows must be a list"}, code=400)

        now_iso = datetime.now(timezone.utc).isoformat()
        d = self._tables_dir()
        try:
            d.mkdir(parents=True, exist_ok=True)
            path = d / f"{slug}.json"
            existed = path.exists()
            prior_meta = {}
            if existed:
                try:
                    prior = json.loads(path.read_text(encoding="utf-8"))
                    prior_meta = prior.get("metadata") or {}
                except Exception:
                    prior_meta = {}
            meta = payload.get("metadata") or {}
            meta.setdefault("created_at", prior_meta.get("created_at") or now_iso)
            meta["updated_at"] = now_iso
            if payload.get("template"): meta.setdefault("template", payload["template"])
            doc = {
                "slug":     slug,
                "name":     name,
                "schema":   schema,
                "rows":     rows,
                "metadata": meta,
            }
            tmp = d / f".{slug}.json.tmp"
            tmp.write_text(json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8")
            tmp.replace(path)
        except Exception as e:
            return self._json({"ok": False, "error": f"write failed: {e}"}, code=500)

        relpath = f"tables/{slug}.json"
        self._register_in_index("tables", relpath)
        self._activity_ledger_write({
            "ts": now_iso,
            "kind": "table_updated" if existed else "table_created",
            "actor": "ui",
            "slug": slug,
            "name": name,
            "rows": len(rows),
            "cols": len(schema),
            "template": meta.get("template"),
            "path": relpath,
        })
        return self._json({"ok": True, "slug": slug, "path": relpath, "saved_at": now_iso,
                           "rows": len(rows), "cols": len(schema), "created": not existed})

    def _table_delete(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        slug = (payload.get("slug") or "").strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        path = self._tables_dir() / f"{slug}.json"
        if not path.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            path.unlink()
        except Exception as e:
            return self._json({"ok": False, "error": f"delete failed: {e}"}, code=500)
        relpath = f"tables/{slug}.json"
        self._unregister_from_index("tables", relpath)
        self._activity_ledger_write({
            "ts": datetime.now(timezone.utc).isoformat(),
            "kind": "table_deleted",
            "actor": "ui",
            "slug": slug,
            "path": relpath,
        })
        return self._json({"ok": True, "slug": slug})

    def _table_add_rows(self, body):
        """Append rows to an existing table. Body: {slug, rows: [...], source?}.
        Emits a single table_row_added ledger event for the batch."""
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        slug = (payload.get("slug") or "").strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        new_rows = payload.get("rows") or []
        if not isinstance(new_rows, list) or not new_rows:
            return self._json({"ok": False, "error": "rows must be a non-empty list"}, code=400)
        path = self._tables_dir() / f"{slug}.json"
        if not path.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            return self._json({"ok": False, "error": f"parse failed: {e}"}, code=500)
        rows = data.get("rows") or []
        rows.extend(new_rows)
        data["rows"] = rows
        meta = data.get("metadata") or {}
        now_iso = datetime.now(timezone.utc).isoformat()
        meta["updated_at"] = now_iso
        data["metadata"] = meta
        try:
            tmp = self._tables_dir() / f".{slug}.json.tmp"
            tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
            tmp.replace(path)
        except Exception as e:
            return self._json({"ok": False, "error": f"write failed: {e}"}, code=500)
        self._activity_ledger_write({
            "ts": now_iso,
            "kind": "table_row_added",
            "actor": "ui",
            "slug": slug,
            "added": len(new_rows),
            "total": len(rows),
            "source": payload.get("source") or "manual",
            "path": f"tables/{slug}.json",
        })
        return self._json({"ok": True, "slug": slug, "added": len(new_rows), "total": len(rows)})

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

    # ────── Charts: saved visualizations ────────────────────────────────
    # Files at CCAgentindex/charts/<slug>.json. Each chart is:
    # {slug, name, kind, template, variant, accent, table_slug, mapping,
    #  seed, metadata:{created_at, updated_at}}. The chart references an
    # existing table by slug — the UI re-aggregates slices at render time,
    # so the chart file is lightweight (no copied row data).
    def _charts_dir(self):
        return HERE / "CCAgentindex" / "charts"

    def _charts_list(self):
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        table_filter = (qs.get("table") or [""])[0].strip()
        d = self._charts_dir()
        out = []
        if d.exists():
            for p in sorted(d.glob("*.json")):
                try:
                    data = json.loads(p.read_text(encoding="utf-8"))
                    if table_filter and (data.get("table_slug") or "") != table_filter:
                        continue
                    meta = data.get("metadata") or {}
                    stat = p.stat()
                    mtime = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).isoformat()
                    out.append({
                        "slug":       p.stem,
                        "name":       data.get("name") or p.stem,
                        "kind":       data.get("kind"),
                        "template":   data.get("template"),
                        "variant":    data.get("variant"),
                        "accent":     data.get("accent"),
                        "table_slug": data.get("table_slug"),
                        "mapping":    data.get("mapping") or {},
                        "seed":       data.get("seed"),
                        "updated_at": meta.get("updated_at") or mtime,
                        "created_at": meta.get("created_at"),
                    })
                except Exception:
                    out.append({"slug": p.stem, "name": p.stem, "_parse_error": True})
        return self._json({"ok": True, "items": out, "count": len(out)})

    def _chart_get(self):
        from urllib.parse import urlparse, parse_qs
        qs = parse_qs(urlparse(self.path).query)
        slug = (qs.get("slug") or [""])[0].strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        path = self._charts_dir() / f"{slug}.json"
        if not path.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as e:
            return self._json({"ok": False, "error": f"parse failed: {e}"}, code=500)
        return self._json({"ok": True, "slug": slug, "chart": data})

    def _chart_save(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        slug = (payload.get("slug") or "").strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        name = (payload.get("name") or slug).strip()
        kind = (payload.get("kind") or "").strip()
        if not kind:
            return self._json({"ok": False, "error": "kind is required"}, code=400)
        table_slug = (payload.get("table_slug") or "").strip()
        if not self._slug_ok(table_slug):
            return self._json({"ok": False, "error": "table_slug is required and must be a valid slug"}, code=400)
        # Confirm the source table exists — charts without a table are dead.
        tbl_path = self._tables_dir() / f"{table_slug}.json"
        if not tbl_path.exists():
            return self._json({"ok": False, "error": f"table '{table_slug}' not found"}, code=400)

        now_iso = datetime.now(timezone.utc).isoformat()
        d = self._charts_dir()
        try:
            d.mkdir(parents=True, exist_ok=True)
            path = d / f"{slug}.json"
            existed = path.exists()
            prior_meta = {}
            if existed:
                try:
                    prior = json.loads(path.read_text(encoding="utf-8"))
                    prior_meta = prior.get("metadata") or {}
                except Exception:
                    prior_meta = {}
            meta = payload.get("metadata") or {}
            meta.setdefault("created_at", prior_meta.get("created_at") or now_iso)
            meta["updated_at"] = now_iso
            doc = {
                "slug":       slug,
                "name":       name,
                "kind":       kind,
                "template":   payload.get("template") or "",
                "variant":    payload.get("variant") or "",
                "accent":     payload.get("accent") or "",
                "table_slug": table_slug,
                "mapping":    payload.get("mapping") or {},
                "seed":       payload.get("seed") or slug,
                "metadata":   meta,
            }
            tmp = d / f".{slug}.json.tmp"
            tmp.write_text(json.dumps(doc, indent=2, ensure_ascii=False), encoding="utf-8")
            tmp.replace(path)
        except Exception as e:
            return self._json({"ok": False, "error": f"write failed: {e}"}, code=500)

        relpath = f"charts/{slug}.json"
        self._register_in_index("charts", relpath)
        self._activity_ledger_write({
            "ts": now_iso,
            "kind": "chart_updated" if existed else "chart_created",
            "actor": "ui",
            "slug": slug,
            "name": name,
            "chart_kind": kind,
            "template": payload.get("template"),
            "variant": payload.get("variant"),
            "table_slug": table_slug,
            "path": relpath,
        })
        return self._json({"ok": True, "slug": slug, "path": relpath, "saved_at": now_iso,
                           "created": not existed})

    def _chart_delete(self, body):
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        slug = (payload.get("slug") or "").strip()
        if not self._slug_ok(slug):
            return self._json({"ok": False, "error": "bad slug"}, code=400)
        path = self._charts_dir() / f"{slug}.json"
        if not path.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            path.unlink()
        except Exception as e:
            return self._json({"ok": False, "error": f"delete failed: {e}"}, code=500)
        relpath = f"charts/{slug}.json"
        self._unregister_from_index("charts", relpath)
        self._activity_ledger_write({
            "ts": datetime.now(timezone.utc).isoformat(),
            "kind": "chart_deleted",
            "actor": "ui",
            "slug": slug,
            "path": relpath,
        })
        return self._json({"ok": True, "slug": slug})

    def _projects_list(self):
        import math
        d = self._projects_dir()
        out = []
        now = datetime.now(timezone.utc)
        if d.exists():
            for p in sorted(d.glob("*.json")):
                try:
                    data = json.loads(p.read_text(encoding="utf-8"))
                    stats = self._project_stats(data, now)
                    out.append({
                        "id":     data.get("id") or p.stem,
                        "name":   data.get("name") or p.stem,
                        "status": data.get("status"),
                        "tags":   data.get("tags") or [],
                        "phase_count":      len(data.get("phases") or []),
                        "open_task_count":  stats["tasks_open"],
                        "done_task_count":  stats["tasks_done"],
                        "progress_pct":     stats["progress_pct"],
                        "momentum_score":   round(stats["momentum_score"], 3),
                        "days_since_last_completion": stats["days_since_last_completion"],
                        "wins":   len(data.get("wins")   or []),
                        "misses": len(data.get("misses") or []),
                    })
                except Exception:
                    out.append({"id": p.stem, "name": p.stem, "_parse_error": True})
        return self._json({"projects": out, "count": len(out)})

    def _project_stats(self, data, now):
        """Compute project-level momentum signals. Mirrors the client-side
        computeProjectMomentum so list rendering doesn't need to fetch every
        full project body."""
        import math
        tasks_done = 0
        tasks_open = 0
        momentum = 0.0
        last_completion = None
        for ph in (data.get("phases") or []):
            for d in (ph.get("deliverables") or []):
                for t in (d.get("tasks") or []):
                    if t.get("state") == "done":
                        tasks_done += 1
                        ca = t.get("completed_at")
                        if ca:
                            try:
                                ct = datetime.fromisoformat(ca.replace("Z", "+00:00"))
                                age_days = (now - ct).total_seconds() / 86400.0
                                momentum += math.exp(-math.log(2) * age_days / 7.0)
                                if last_completion is None or ct > last_completion:
                                    last_completion = ct
                            except Exception:
                                pass
                    else:
                        tasks_open += 1
        total = tasks_done + tasks_open
        progress_pct = (tasks_done / total) if total else 0.0
        days_since = None
        if last_completion:
            days_since = round((now - last_completion).total_seconds() / 86400.0, 1)
        return {
            "tasks_done": tasks_done,
            "tasks_open": tasks_open,
            "progress_pct": progress_pct,
            "momentum_score": momentum,
            "days_since_last_completion": days_since,
        }

    def _open_task_count(self, project):
        n = 0
        for ph in (project.get("phases") or []):
            if ph.get("state") == "done": continue
            for d in (ph.get("deliverables") or []):
                if d.get("state") == "done": continue
                for t in (d.get("tasks") or []):
                    if t.get("state") != "done": n += 1
        return n

    def _project_path(self, pid):
        import re
        if not re.match(r"^[a-zA-Z0-9_-]{1,120}$", pid or ""):
            return None
        return self._projects_dir() / f"{pid}.json"

    def _project_read(self, pid):
        p = self._project_path(pid)
        if not p:
            return self._json({"ok": False, "error": "bad id"}, code=400)
        if not p.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            return self._json({"ok": True, "project": json.loads(p.read_text(encoding="utf-8"))})
        except Exception as e:
            return self._json({"ok": False, "error": str(e)}, code=500)

    def _project_write(self, pid, body):
        p = self._project_path(pid)
        if not p:
            return self._json({"ok": False, "error": "bad id"}, code=400)
        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        payload["id"] = pid  # ensure consistency
        p.parent.mkdir(parents=True, exist_ok=True)
        # Atomic-ish: write to tmp then rename.
        tmp = p.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(p)
        return self._json({"ok": True, "project": payload})

    def _project_task_patch(self, pid, tid, body):
        p = self._project_path(pid)
        if not p or not p.exists():
            return self._json({"ok": False, "error": "project not found"}, code=404)
        try:
            patch = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._json({"ok": False, "error": f"bad json: {e}"}, code=400)
        new_state = patch.get("state")
        if new_state not in ("open", "done"):
            return self._json({"ok": False, "error": "state must be open|done"}, code=400)
        data = json.loads(p.read_text(encoding="utf-8"))
        now_iso = datetime.now(timezone.utc).isoformat()
        now_dt  = datetime.now(timezone.utc)
        hit_task = None
        hit_phase = None
        hit_deliv = None
        for ph in (data.get("phases") or []):
            for d in (ph.get("deliverables") or []):
                for t in (d.get("tasks") or []):
                    if t.get("id") == tid:
                        # Completion bookkeeping — capture time-to-complete and
                        # increment reopened_count if flipping back.
                        if new_state == "done":
                            t["state"] = "done"
                            t["completed_at"] = now_iso
                            created = t.get("created_at")
                            if created:
                                try:
                                    ct = datetime.fromisoformat(created.replace("Z", "+00:00"))
                                    t["days_to_complete"] = round((now_dt - ct).total_seconds() / 86400.0, 3)
                                except Exception:
                                    pass
                        else:  # flipping back to open — count reopen
                            t["state"] = "open"
                            t["completed_at"] = None
                            t["days_to_complete"] = None
                            t["reopened_count"] = int(t.get("reopened_count") or 0) + 1
                            t["last_reopened_at"] = now_iso
                        hit_task = t
                        hit_phase = ph
                        hit_deliv = d
                        break
                if hit_task: break
            if hit_task: break
        if not hit_task:
            return self._json({"ok": False, "error": "task not found"}, code=404)
        tmp = p.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(p)
        return self._json({
            "ok": True,
            "project_id": pid,
            "task_id": tid,
            "state": new_state,
            "t": now_iso,
            "days_to_complete": hit_task.get("days_to_complete"),
            "reopened_count": hit_task.get("reopened_count") or 0,
            "phase_id": hit_phase.get("id"),
            "deliverable_id": hit_deliv.get("id"),
        })

    def _api_or_404(self):
        p = self._api_path()
        if p.startswith("/api/proxy/"):
            return self._proxy()
        if p == "/api/inbox/append":
            length = int(self.headers.get("Content-Length") or 0)
            return self._inbox_append(self.rfile.read(length) if length else b"")
        if p == "/api/inbox/update":
            length = int(self.headers.get("Content-Length") or 0)
            return self._inbox_update(self.rfile.read(length) if length else b"")
        if p.startswith("/api/ledger/") and p.endswith("/append"):
            # POST /api/ledger/<name>/append  → append one event to the named ledger
            name = p[len("/api/ledger/"):-len("/append")]
            length = int(self.headers.get("Content-Length") or 0)
            return self._ledger_append(name, self.rfile.read(length) if length else b"")
        if p == "/api/delegate":
            length = int(self.headers.get("Content-Length") or 0)
            return self._delegate_dispatch(self.rfile.read(length) if length else b"")
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
        if p == "/api/chat/send":
            # Multi-turn chat. Client sends full transcript each turn; we
            # relay to the active provider. Server is a pure relay — all
            # persistence lives client-side and in the chat ledger.
            length = int(self.headers.get("Content-Length") or 0)
            return self._chat_send(self.rfile.read(length) if length else b"")
        if p.startswith("/api/accomplishments/"):
            # POST /api/accomplishments/<YYYY-MM-DD>  → freeze a day's rollup
            slug = p[len("/api/accomplishments/"):]
            length = int(self.headers.get("Content-Length") or 0)
            return self._accomplishments_write(slug, self.rfile.read(length) if length else b"")
        if p == "/api/streak":
            length = int(self.headers.get("Content-Length") or 0)
            return self._streak_write(self.rfile.read(length) if length else b"")
        if p == "/api/rodbot/reflect":
            length = int(self.headers.get("Content-Length") or 0)
            return self._rodbot_reflect(self.rfile.read(length) if length else b"")
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
        if p == "/api/annotations/upload":
            length = int(self.headers.get("Content-Length") or 0)
            return self._annotations_upload(self.rfile.read(length) if length else b"")
        if p == "/api/tables/save":
            length = int(self.headers.get("Content-Length") or 0)
            return self._table_save(self.rfile.read(length) if length else b"")
        if p == "/api/tables/delete":
            length = int(self.headers.get("Content-Length") or 0)
            return self._table_delete(self.rfile.read(length) if length else b"")
        if p == "/api/tables/add_rows":
            length = int(self.headers.get("Content-Length") or 0)
            return self._table_add_rows(self.rfile.read(length) if length else b"")
        if p == "/api/intake/classify":
            length = int(self.headers.get("Content-Length") or 0)
            return self._intake_classify(self.rfile.read(length) if length else b"")
        if p == "/api/intake/route":
            length = int(self.headers.get("Content-Length") or 0)
            return self._intake_route(self.rfile.read(length) if length else b"")
        if p == "/api/intake/report":
            length = int(self.headers.get("Content-Length") or 0)
            return self._intake_report(self.rfile.read(length) if length else b"")
        if p == "/api/charts/save":
            length = int(self.headers.get("Content-Length") or 0)
            return self._chart_save(self.rfile.read(length) if length else b"")
        if p == "/api/charts/delete":
            length = int(self.headers.get("Content-Length") or 0)
            return self._chart_delete(self.rfile.read(length) if length else b"")
        if p == "/api/grid_affinity":
            length = int(self.headers.get("Content-Length") or 0)
            return self._grid_affinity_write(self.rfile.read(length) if length else b"")
        # Projects: PUT writes whole file atomically; PATCH toggles a task.
        if self.command == "PUT" and p.startswith("/api/projects/"):
            pid = p[len("/api/projects/"):].split("/")[0]
            length = int(self.headers.get("Content-Length") or 0)
            return self._project_write(pid, self.rfile.read(length) if length else b"")
        if self.command == "PATCH" and p.startswith("/api/projects/"):
            # /api/projects/<pid>/task/<tid>   PATCH {state: "open"|"done"}
            tail = p[len("/api/projects/"):]
            parts = tail.split("/")
            if len(parts) >= 3 and parts[1] == "task":
                length = int(self.headers.get("Content-Length") or 0)
                return self._project_task_patch(parts[0], parts[2], self.rfile.read(length) if length else b"")
            return self._json({"ok": False, "error": "bad patch path"}, code=400)
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

        # OpenAI Responses — multi-turn via input array with multimodal parts.
        if not ENV.get("OPENAI_API_KEY"):
            return self._json({"ok": False, "error": "OPENAI_API_KEY not set on server"}, code=503)

        def _openai_content(m):
            """Convert parts into the Responses API content-block shape.
            Text → input_text; image → input_image with base64 data URL."""
            out = []
            for p in _parts(m):
                if p.get("type") == "text" and (p.get("text") or "").strip():
                    out.append({"type": "input_text", "text": p["text"]})
                elif p.get("type") == "image":
                    path = p.get("path") or ""
                    mime = p.get("mime") or "image/png"
                    if not path or not Path(path).exists():
                        # Fall back to a text reference if we can't read the file.
                        out.append({"type": "input_text", "text": f"(image attached but unreadable at {path})"})
                        continue
                    try:
                        data = base64.b64encode(Path(path).read_bytes()).decode("ascii")
                        out.append({"type": "input_image", "image_url": f"data:{mime};base64,{data}"})
                    except Exception as e:
                        out.append({"type": "input_text", "text": f"(image read failed: {e})"})
            return out

        input_msgs = []
        for m in messages:
            c = _openai_content(m)
            if not c: continue
            input_msgs.append({"role": m.get("role","user"), "content": c})

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

    # ────── Analytics — parse CSVs from rawdata/ into chart-ready JSON ──
    # Each dataset has a quirky shape (merged headers, weird tier rows,
    # multi-table files). The parsers below knead each one into a clean
    # structure the client charts can render without extra logic.
    def _analytics_get(self, name):
        raw_dir = HERE / "rawdata"
        try:
            if name == "tasting_conversion":
                return self._json(_parse_tasting_conversion(raw_dir))
            if name == "lead_sources":
                return self._json(_parse_lead_sources(raw_dir))
            if name == "revenue_timeline":
                return self._json(_parse_revenue_timeline(raw_dir))
            if name == "venue_partners":
                return self._json(_parse_venue_partners(raw_dir))
            if name == "event_labor":
                return self._json(_parse_event_labor(raw_dir))
            if name == "overview":
                # Composite — just stitch key numbers from the other parsers
                return self._json(_build_overview(raw_dir))
            return self._json({"ok": False, "error": f"unknown dataset '{name}'"}, code=404)
        except FileNotFoundError as e:
            return self._json({"ok": False, "error": f"raw file missing: {e.filename}"}, code=404)
        except Exception as e:
            return self._json({"ok": False, "error": f"{type(e).__name__}: {e}"}, code=500)

    # ────── Sub-agent registry ────────────────────────────────────────────
    # GET /api/agents → { agents: [{name, hasPrompt, hasSpec}] }
    def _agents_list(self):
        agents_dir = HERE / "CCAgentindex" / "agents"
        if not agents_dir.exists():
            return self._json({"agents": [], "count": 0})
        items = []
        for d in sorted(agents_dir.iterdir()):
            if not d.is_dir() or d.name.startswith("."):
                continue
            items.append({
                "name": d.name,
                "hasPrompt": (d / "prompt.md").exists(),
                "hasSpec":   (d / "agents.md").exists(),
            })
        return self._json({"agents": items, "count": len(items)})

    # ────── Sub-agent runner ──────────────────────────────────────────────
    # POST /api/agents/<name>/run
    #   body (optional): { "extraContext": "..." }  appended to the agent's
    #                    prompt before dispatch.
    # Reads agents/<name>/prompt.md, dispatches through the existing delegation
    # pipeline (same claude-p subprocess, same --disallowedTools scope guard,
    # same ledger write). Returns { ok, request_id, status } just like
    # /api/delegate — UI polls /api/delegate/<id> for completion.
    def _agent_run(self, name, body):
        import re
        if not re.fullmatch(r"[a-z][a-z0-9_]{0,48}", name or ""):
            return self._json({"ok": False, "error": "bad agent name"}, code=400)
        agents_dir = HERE / "CCAgentindex" / "agents"
        prompt_path = agents_dir / name / "prompt.md"
        if not prompt_path.exists():
            return self._json({
                "ok": False,
                "error": f"no prompt at agents/{name}/prompt.md",
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
        }
        result_path.write_text(json.dumps(initial, ensure_ascii=False, indent=2))

        t = threading.Thread(
            target=_run_delegation,
            args=(request_id, prompt, mode, cwd, result_path, timeout_s),
            daemon=True,
        )
        t.start()

        return self._json({"ok": True, "request_id": request_id, "status": "running"})

    def _delegate_read(self, rid):
        import re
        if not re.fullmatch(r"[A-Za-z0-9_-]+", rid):
            return self._json({"ok": False, "error": "bad id"}, code=400)
        p = self._delegations_dir() / f"{rid}.json"
        if not p.exists():
            return self._json({"ok": False, "error": "not found"}, code=404)
        try:
            return self._json(json.loads(p.read_text()))
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

    def log_message(self, fmt, *a):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % a))


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 3422
    os.chdir(HERE)
    print(f"[secretary] serving {HERE} on http://127.0.0.1:{port}", flush=True)
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

    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()


if __name__ == "__main__":
    main()

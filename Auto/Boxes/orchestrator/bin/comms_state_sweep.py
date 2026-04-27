#!/usr/bin/env python3
"""
comms_state_sweep.py — every 2h during business hours.

For each Client Box where 00_meta.json:active_cadence == true:
  1. Pull recent Close activity (last 30 items)
  2. Append new entries to 01_comms.md, dedup by activity_id
  3. Refresh client_ledger.md (cadence position + recent activity table)
  4. Flag inbound replies — alert André's DM with the message text
  5. Update 00_meta.json:comms_dirty if new inbound found
  6. Post a once-per-sweep digest to team channel ONLY if there's news
  7. Write run summary to orchestrator/state/runs/

Re-runnable. Idempotent. Read-only on Close (no sends).
"""

from __future__ import annotations
import base64
import json
import os
import re
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent
CLIENT_BOXES = REPO / "Client Boxes"
RUNS = REPO / "orchestrator" / "state" / "runs"
ENV_FILE = REPO / ".env"

# ─── env loader ─────────────────────────────────────────────
ENV = {}
if ENV_FILE.exists():
    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        ENV[k.strip()] = v.strip().strip('"').strip("'")

CLOSE_KEY = ENV.get("CLOSE_API_KEY", "")
SLACK_TOKEN = ENV.get("SLACK_BOT_TOKEN", "")
TEAM_CHANNEL = "C0AV913L1LJ"
ANDRE_DM = "D0AMX3BV64T"

OWNER_FIELD = "cf_xF8FLufgEx9bsijfRAfHhgIrPBQ5ajuohcazC7OtNmT"
ANDRE_VAL = "01. \U0001f60e Andre"


# ─── HTTP helpers ─────────────────────────────────────────────
def close_get(path: str) -> dict:
    url = f"https://api.close.com/api/v1{path}"
    auth = base64.b64encode(f"{CLOSE_KEY}:".encode()).decode()
    req = urllib.request.Request(url, headers={"Authorization": f"Basic {auth}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())


def slack_post(channel: str, text: str) -> dict | None:
    if not SLACK_TOKEN:
        return None
    data = json.dumps({"channel": channel, "text": text}).encode("utf-8")
    req = urllib.request.Request(
        "https://slack.com/api/chat.postMessage",
        data=data,
        headers={
            "Authorization": f"Bearer {SLACK_TOKEN}",
            "Content-Type": "application/json; charset=utf-8",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


# ─── Per-lead processing ─────────────────────────────────────
def parse_existing_activity_ids(comms_md: str) -> set[str]:
    """Extract every acti_* mentioned in the comms file."""
    return set(re.findall(r"\bacti_[A-Za-z0-9]+", comms_md))


def parse_existing_inbound_count(comms_md: str) -> int:
    """Count INBOUND markers."""
    return comms_md.count("📥 INBOUND") + comms_md.count("**direction:** inbound")


def short_preview(text: str, n: int = 100) -> str:
    if not text:
        return ""
    text = re.sub(r"\s+", " ", text).strip()
    return (text[:n] + "…") if len(text) > n else text


def format_activity_entry(a: dict, now_iso: str) -> tuple[str, bool]:
    """
    Return (markdown entry, is_inbound).
    Mirrors the format used elsewhere in 01_comms.md updates.
    """
    typ = a.get("_type") or a.get("type") or "?"
    direction = a.get("direction", "")
    is_inbound = direction in ("inbound", "incoming")
    user = a.get("user_name") or a.get("created_by_name") or "system"
    when = (a.get("date_created") or "")[:19] + "Z"
    activity_id = a.get("id", "?")
    arrow_emoji = "📥" if is_inbound else "📤"

    # Channel-specific preview
    if typ in ("Email", "email"):
        channel = "close_email"
        body = a.get("subject") or short_preview(a.get("body_text") or a.get("body_html") or "", 80)
    elif typ in ("SMS", "sms"):
        channel = "close_sms"
        body = short_preview(a.get("text") or "", 100)
    elif typ in ("Note", "note"):
        channel = "close_note"
        body = short_preview(a.get("note") or "", 100)
    elif typ in ("Call", "call"):
        channel = "close_call"
        dur = a.get("duration", 0)
        body = f"call duration={dur}s status={a.get('status','?')}"
    elif typ in ("Created", "created"):
        channel = "close_meta"
        body = "lead created"
    elif typ in ("LeadStatusChange", "lead_status_change"):
        channel = "close_meta"
        body = f"{a.get('old_status_label','?')} → {a.get('new_status_label','?')}"
    elif typ in ("TaskCompleted", "task_completed"):
        channel = "close_task"
        body = short_preview(a.get("text") or "", 100)
    else:
        channel = f"close_{typ.lower()}"
        body = short_preview(json.dumps(a)[:200], 200)

    inbound_flag = "  ⚠️ Reply detected — operator review needed\n" if is_inbound else ""
    direction_label = "inbound" if is_inbound else direction or "—"

    entry = f"""
### Update — {now_iso}

{arrow_emoji} {typ} ({direction_label} — {user}): \"{body}\"
- activity_id: {activity_id}
- channel: {channel}
- date_created: {when}
- detected_by: comms_state_sweep
{inbound_flag}"""
    return entry, is_inbound


def compute_plan_day(plan_day_1: str | None, today: datetime) -> int | None:
    if not plan_day_1:
        return None
    try:
        d1 = datetime.fromisoformat(plan_day_1).date()
        delta = (today.date() - d1).days
        return min(7, max(1, delta + 1))
    except Exception:
        return None


def render_ledger(meta: dict, comms_md: str, now: datetime, recent_activities: list[dict]) -> str:
    name = meta.get("name", "?")
    plan_day_1 = meta.get("plan_day_1_date")
    today_n = compute_plan_day(plan_day_1, now)
    today_str = now.strftime("%Y-%m-%d (%a)")
    cadence = meta.get("cadence_status", "active" if meta.get("active_cadence") else "idle")
    altitude = meta.get("altitude", "—")

    # Parse fires from comms — outbound entries with acti_*
    fires = []
    for a in recent_activities:
        if a.get("direction") in ("outgoing", "outbound") and a.get("_type") in ("Email", "email", "SMS", "sms"):
            fires.append(
                {
                    "when": (a.get("date_created") or "")[:19],
                    "channel": a.get("_type"),
                    "user": a.get("user_name") or a.get("created_by_name", "?"),
                    "activity_id": a.get("id", "?"),
                    "preview": short_preview(a.get("text") or a.get("subject") or "", 60),
                }
            )

    # Parse inbound from comms
    inbounds = []
    for a in recent_activities:
        if a.get("direction") in ("inbound", "incoming"):
            inbounds.append(
                {
                    "when": (a.get("date_created") or "")[:19],
                    "channel": a.get("_type"),
                    "preview": short_preview(a.get("text") or a.get("subject") or "", 80),
                    "activity_id": a.get("id", "?"),
                }
            )

    md = f"""# client_ledger.md — {name}

_Refreshed by comms_state_sweep at {now.strftime("%Y-%m-%dT%H:%M:%SZ")}._
This file is regenerated on every 2-hour sweep. Do not hand-edit — overrides
go in `10_andre_feedback.md`. The 7-day plan in `05_seven_day_plan.md` is
the source of truth for prescribed moves; this ledger reflects what's
actually happened against the plan.

## Cadence position

| | |
|---|---|
| Plan day 1 anchor | {plan_day_1 or "(not set)"} |
| Today | {today_str} (Day {today_n if today_n else '?'} of 7) |
| Cadence status | {cadence} |
| Altitude | {altitude} |
| Plan source | `05_seven_day_plan.md` |
| Last sweep | {now.strftime("%Y-%m-%dT%H:%M:%SZ")} |
| New inbound this cycle | {meta.get("comms_dirty", False)} |

## Recent fires (Andre → lead)

"""
    if fires:
        md += "| When (UTC) | Channel | By | activity_id | Preview |\n|---|---|---|---|---|\n"
        for f in fires[:10]:
            md += f"| {f['when']} | {f['channel']} | {f['user']} | `{f['activity_id']}` | {f['preview']} |\n"
    else:
        md += "(none in the last 30 activities)\n"

    md += "\n## Inbound activity (lead → Andre)\n\n"
    if inbounds:
        md += "| When (UTC) | Channel | Preview | activity_id |\n|---|---|---|---|\n"
        for i in inbounds[:10]:
            md += f"| {i['when']} | {i['channel']} | {i['preview']} | `{i['activity_id']}` |\n"
        md += "\n⚠️ Operator review recommended for any new inbound — see 01_comms.md for full text and 09_andre_alerts.md for response framework.\n"
    else:
        md += "(none — cadence proceeding as scheduled)\n"

    md += "\n## Operator overrides / notes\n\n"
    md += "(any overrides go in `10_andre_feedback.md`. The next scheduled fire reads that file before composing.)\n"

    return md


def process_lead(folder: Path, now: datetime, log: list) -> dict:
    meta_path = folder / "00_meta.json"
    if not meta_path.exists():
        return {"name": folder.name, "skipped": "no_meta"}

    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    if not meta.get("active_cadence"):
        return {"name": folder.name, "skipped": "not_active_cadence"}

    lead_id = meta.get("lead_id")
    if not lead_id:
        return {"name": folder.name, "skipped": "no_lead_id"}

    name = meta.get("name", folder.name)

    # Pull recent activity from Close
    try:
        resp = close_get(f"/activity/?lead_id={lead_id}&_limit=30")
    except Exception as exc:
        log.append(f"  ⚠️ {name}: close_get failed — {exc}")
        return {"name": name, "error": str(exc)}

    recent = resp.get("data", [])

    # Read existing comms
    comms_path = folder / "01_comms.md"
    comms_md = comms_path.read_text(encoding="utf-8") if comms_path.exists() else f"# 01_comms.md — {name}\n\n"

    seen_ids = parse_existing_activity_ids(comms_md)
    new_entries = []
    new_inbounds = []  # truly new — for alert
    now_iso = now.strftime("%Y-%m-%dT%H:%M:%SZ")

    # Cadence anchor — used to filter alert-worthy inbounds. Pre-cadence
    # inbounds get appended to 01_comms.md (for completeness) but DO NOT
    # trigger DM alerts (they're historical noise, not actionable news).
    cadence_started_at = meta.get("cadence_started_at")
    cadence_dt = None
    if cadence_started_at:
        try:
            cadence_dt = datetime.fromisoformat(cadence_started_at.replace("Z", "+00:00"))
        except Exception:
            cadence_dt = None

    # Iterate oldest-first so appends are chronological
    for a in reversed(recent):
        aid = a.get("id", "")
        if not aid or aid in seen_ids:
            continue
        entry, is_inbound = format_activity_entry(a, now_iso)
        new_entries.append(entry)
        if is_inbound:
            # Only alert if the inbound happened AFTER cadence started
            a_when_str = a.get("date_created", "")
            try:
                a_when = datetime.fromisoformat(a_when_str.replace("Z", "+00:00"))
            except Exception:
                a_when = None
            if cadence_dt and a_when and a_when > cadence_dt:
                new_inbounds.append(a)
            # else: historical — silently appended, no alert

    if new_entries:
        with comms_path.open("a", encoding="utf-8") as f:
            f.write("\n" + "".join(new_entries))

    # Update comms_dirty if new inbound
    if new_inbounds:
        meta["comms_dirty"] = True
        meta["last_inbound_detected_at"] = now_iso

    # Refresh client_ledger.md (always — cadence position changes daily)
    ledger_path = folder / "client_ledger.md"
    ledger_md = render_ledger(meta, comms_md, now, recent)
    ledger_tmp = ledger_path.with_suffix(".md.tmp")
    ledger_tmp.write_text(ledger_md, encoding="utf-8")
    ledger_tmp.replace(ledger_path)

    # Write meta atomically
    meta["last_sweep_at"] = now_iso
    meta_tmp = meta_path.with_suffix(".json.tmp")
    meta_tmp.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    meta_tmp.replace(meta_path)

    return {
        "name": name,
        "lead_id": lead_id,
        "new_entries": len(new_entries),
        "new_inbounds": len(new_inbounds),
        "inbound_messages": [
            {
                "when": (a.get("date_created") or "")[:19],
                "channel": a.get("_type"),
                "text": short_preview(a.get("text") or a.get("subject") or "", 200),
                "activity_id": a.get("id"),
            }
            for a in new_inbounds
        ],
    }


# ─── Main ─────────────────────────────────────────────────────
def main() -> int:
    now = datetime.now(timezone.utc)
    print(f"=== comms_state_sweep — {now.strftime('%Y-%m-%dT%H:%M:%SZ')} ===\n")

    if not CLIENT_BOXES.exists():
        print(f"ERROR: {CLIENT_BOXES} does not exist", file=sys.stderr)
        return 1

    log = []
    results = []
    for folder in sorted(CLIENT_BOXES.iterdir()):
        if not folder.is_dir():
            continue
        if folder.name in {"Onboard Scripts", "Extra Stuff"} or folder.name.startswith("."):
            continue
        result = process_lead(folder, now, log)
        results.append(result)

    # Print summary
    active = [r for r in results if "skipped" not in r and "error" not in r]
    skipped = [r for r in results if "skipped" in r]
    errors = [r for r in results if "error" in r]
    total_new = sum(r.get("new_entries", 0) for r in active)
    total_inbounds = sum(r.get("new_inbounds", 0) for r in active)

    print(f"Active leads swept: {len(active)}")
    print(f"Total new comms entries appended: {total_new}")
    print(f"Total new inbound replies detected: {total_inbounds}")
    print(f"Skipped (not active): {len(skipped)}")
    print(f"Errors: {len(errors)}")
    print()

    for r in active:
        marker = "📥" if r.get("new_inbounds") else ("➕" if r.get("new_entries") else "·")
        print(f"  {marker} {r['name']:25s}  +{r.get('new_entries', 0)} entries  ({r.get('new_inbounds', 0)} inbound)")

    for r in errors:
        print(f"  ⚠️ {r['name']}: {r.get('error')}")

    # Slack — alert André's DM for any inbound; team channel digest only if news
    inbound_alerts = [r for r in active if r.get("new_inbounds")]
    if inbound_alerts:
        for r in inbound_alerts:
            for msg in r["inbound_messages"]:
                alert = (
                    f"📥 [REPLY DETECTED] {r['name']} — {msg['channel']} at {msg['when']} UTC\n"
                    f"\"{msg['text']}\"\n"
                    f"Operator review needed. activity_id: {msg['activity_id']}\n"
                    f"Cadence remains active until you decide — pause via 10_andre_feedback.md or update the next scheduled fire."
                )
                slack_post(ANDRE_DM, alert)

    # Team channel digest only if there were sends or replies
    if total_new > 0:
        digest_lines = [f"🔄 Comms+state refresh — {now.strftime('%H:%M UTC')}"]
        digest_lines.append(f"Active cadences: {len(active)} · new comms: {total_new} · inbound: {total_inbounds}")
        for r in active:
            if r.get("new_entries"):
                digest_lines.append(f"  • {r['name']}: +{r['new_entries']} entries" + (f"  📥 {r['new_inbounds']} inbound" if r['new_inbounds'] else ""))
        slack_post(TEAM_CHANNEL, "\n".join(digest_lines))

    # Run summary
    RUNS.mkdir(parents=True, exist_ok=True)
    summary_path = RUNS / f"sweep_{now.strftime('%Y-%m-%dT%H_%M_%SZ')}.json"
    summary_path.write_text(
        json.dumps(
            {
                "task": "comms_state_sweep",
                "ran_at": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "active_leads": len(active),
                "total_new_entries": total_new,
                "total_new_inbounds": total_inbounds,
                "skipped": len(skipped),
                "errors": len(errors),
                "per_lead": results,
            },
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )
    print(f"\nWrote {summary_path}")

    return 0


if __name__ == "__main__":
    sys.exit(main())

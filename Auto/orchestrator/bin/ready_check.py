#!/usr/bin/env python3
"""
ready_check.py — Walk Client Boxes/, classify each lead's readiness for
kickoff. Writes state/ready_leads.json and prints a human-readable summary.

A lead is READY to kickoff if its folder contains:
  00_meta.json  01_comms.md  04_profile.md  05_seven_day_plan.md  09_andre_alerts.md

Otherwise it's listed with the missing files.
"""

from __future__ import annotations
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent.parent  # → /Users/jakeaaron/Desktop/Auto
CLIENT_BOXES = REPO / "Client Boxes"
OUT = REPO / "orchestrator" / "state" / "ready_leads.json"

REQUIRED = [
    "00_meta.json",
    "01_comms.md",
    "04_profile.md",
    "05_seven_day_plan.md",
    "09_andre_alerts.md",
]

OPTIONAL = [
    "08_automations.md",
    "10_andre_feedback.md",
    "AGENTS.md",
    "CLAUDE.md",
]


def classify(folder: Path) -> dict:
    name = folder.name
    files = {f.name for f in folder.iterdir() if f.is_file()}
    missing = [f for f in REQUIRED if f not in files]
    has_optional = [f for f in OPTIONAL if f in files]

    record = {
        "name": name,
        "path": str(folder),
        "ready": len(missing) == 0,
        "missing": missing,
        "has_optional": has_optional,
    }

    # Pull a few useful meta fields if available
    meta_path = folder / "00_meta.json"
    if meta_path.exists():
        try:
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            record["lead_id"] = meta.get("lead_id")
            record["altitude"] = meta.get("altitude")
            record["active_cadence"] = meta.get("active_cadence", False)
            record["plan_day_1_date"] = meta.get("plan_day_1_date")
            record["primary_phone"] = meta.get("primary_phone")
            record["primary_email"] = meta.get("primary_email")
            record["event_date"] = meta.get("event_date")
            record["tasting_date"] = meta.get("tasting_date")
        except Exception as exc:
            record["meta_error"] = str(exc)

    return record


def main() -> int:
    if not CLIENT_BOXES.exists():
        print(f"ERROR: {CLIENT_BOXES} does not exist", file=sys.stderr)
        return 1

    leads = []
    for folder in sorted(CLIENT_BOXES.iterdir()):
        if not folder.is_dir():
            continue
        # Skip system folders
        if folder.name.startswith(".") or folder.name in {"Onboard Scripts", "Extra Stuff"}:
            continue
        leads.append(classify(folder))

    ready = [l for l in leads if l["ready"]]
    not_ready = [l for l in leads if not l["ready"]]

    out = {
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total_leads": len(leads),
        "ready_count": len(ready),
        "not_ready_count": len(not_ready),
        "ready": ready,
        "not_ready": not_ready,
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8")

    # Human-readable summary
    print(f"=== READY CHECK — {out['generated_at']} ===\n")
    print(f"Total leads: {len(leads)}")
    print(f"Ready: {len(ready)}")
    print(f"Not ready: {len(not_ready)}")
    print()

    if ready:
        print("READY TO KICKOFF:")
        for l in ready:
            extras = []
            if l.get("altitude"):
                extras.append(l["altitude"])
            if l.get("active_cadence"):
                extras.append("ACTIVE CADENCE")
            if l.get("plan_day_1_date"):
                extras.append(f"day1={l['plan_day_1_date']}")
            tag = f" [{' · '.join(extras)}]" if extras else ""
            print(f"  ✅ {l['name']}{tag}")
        print()

    if not_ready:
        print("NOT READY (need stages 1–7 completed):")
        for l in not_ready:
            missing = ", ".join(l["missing"])
            print(f"  ⏳ {l['name']:30s}  missing: {missing}")
        print()

    print(f"Wrote {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

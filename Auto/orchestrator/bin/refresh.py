#!/usr/bin/env python3
"""
refresh.py — AUTO.10 (ledger-rollup) + AUTO.11 (dashboard-refresh).

Walks every lead, derives status, writes:
  - state/master_ledger.csv  (machine-readable, one row per lead)
  - state/dashboard.json     (machine-readable rollup)
  - state/dashboard.html     (renderable view of the same)

This is the dashboard's data pipeline, all in one runnable. Single
source of truth: per-lead `client_ledger.md` (when present) plus
`Client Boxes/<name>/` enumeration for intake-stage leads.
"""

from __future__ import annotations

import csv
import json
import re
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from _lib import (                          # noqa: E402
    AUTO, STATE, LEAD_SOURCES, HUGO_LEAD_ID, ACTIVE_BOX_NAMES,
    enumerate_client_boxes, lead_meta, read_lead_file,
    md_inline, page_html,
)


NOW = datetime(2026, 4, 25, 21, 30)
NOW_ISO = NOW.strftime("%Y-%m-%dT%H:%M:%SZ")
NOW_HUMAN = "2026-04-25 21:30 (Friday)"


# ---------------------------------------------------------------------------
# AUTO.10 — ledger rollup
# ---------------------------------------------------------------------------

LEDGER_COLS = [
    "lead_id", "name", "altitude", "stage",
    "files_present", "has_enrichment", "has_close_export",
    "current_plan_day", "current_off_ramp",
    "last_updated",
]


def rollup_ledger() -> list[dict]:
    """Walk every lead in `Client Boxes/` plus active LEAD_SOURCES entries.
    Return a list of dict rows."""
    rows: list[dict] = []
    for box in enumerate_client_boxes():
        is_active = box["alias"] is not None
        plan_day = ""
        off_ramp = ""
        last_updated = ""
        if is_active:
            alias = box["alias"]
            meta = lead_meta(alias)
            plan_day = str(LEAD_SOURCES[alias].get("current_plan_day", ""))
            off_ramp = "follow-up"
            last_updated = NOW_ISO
        rows.append({
            "lead_id": box["lead_id"] or "",
            "name": box["name"],
            "altitude": box["altitude"],
            "stage": box["stage"],
            "files_present": str(box["files_present"]),
            "has_enrichment": "yes" if box["has_enrichment"] else "no",
            "has_close_export": "yes" if box["has_close_export"] else "no",
            "current_plan_day": plan_day,
            "current_off_ramp": off_ramp,
            "last_updated": last_updated,
        })
    return rows


def write_master_ledger_csv(rows: list[dict]) -> Path:
    out = STATE / "master_ledger.csv"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=LEDGER_COLS)
        w.writeheader()
        for r in rows:
            w.writerow({k: r.get(k, "") for k in LEDGER_COLS})
    return out


# ---------------------------------------------------------------------------
# AUTO.11 — dashboard refresh
# ---------------------------------------------------------------------------

def compute_dashboard(rows: list[dict]) -> dict:
    """Turn the ledger rows into a dashboard payload."""
    active = [r for r in rows if r["stage"] == "active"]
    enriched = [r for r in rows if r["stage"] == "intake-enriched"]
    raw = [r for r in rows if r["stage"] == "intake"]

    altitude_counts = {"whale": 0, "strong": 0, "standard": 0, "soft": 0, "—": 0}
    for r in active + enriched + raw:
        altitude_counts[r["altitude"]] = altitude_counts.get(r["altitude"], 0) + 1

    andre_queue = []
    system_queue = []
    health_flags = []

    for r in active:
        if r["name"] == "Hugo Casillas":
            andre_queue.append("Review + ship Day 1 email to Hugo (draft on his Lead Box)")
            andre_queue.append("Confirm voice-andre-at-ceiling profile loaded for outbound composition")
            system_queue.append("Watch Close for inbound from Hugo; if landed, Liaison Agent wakes per 06_logic.md")
            system_queue.append("Quote-expiry alert queued for May 1 (Hugo)")
            system_queue.append("Pre-tasting alert queued for May 17 if confirmed (Hugo)")
        if r["name"] == "Brenda & Steve":
            andre_queue.append("Review + ship Day 1 SMS to Brenda (fee-waiver reframe — STOP the tasting-fee chase)")
            andre_queue.append("Review + ship Day 1 email to BOTH Brenda and Steve ~2hrs after the SMS")
            andre_queue.append("Confirm tasting-fee waiver decision is locked in writing")
            system_queue.append("Watch Close for inbound from Brenda OR Steve; Steve direct-email = STRONGEST signal, plan-redesign trigger")
            system_queue.append("Pre-tasting brief queued for May 2 evening (May 3 tasting at 5:30pm Fitchburg)")
            system_queue.append("Pause cadence: drips already off; Churrasco/Rodizio explainers blocked")

    if len(active) < 5:
        health_flags.append(f"Only {len(active)} active lead — Wave 2 ships with Hugo only; the other 27 are intake-staged.")
    if any(r["has_enrichment"] for r in raw):
        # not actually possible by construction, just for completeness
        health_flags.append("Some intake leads have enrichment in subfolders not yet detected.")
    health_flags.append("AUTO.01 (Close webhook heartbeat) not yet wired — comms refresh is manual.")
    health_flags.append("AUTO.06 push delivery not yet wired — Today's Move is page-surfaced, not push-delivered.")

    return {
        "generated_at": NOW_ISO,
        "rollup": {
            "total": len(rows),
            "active": len(active),
            "intake_enriched": len(enriched),
            "intake_raw": len(raw),
            "altitude_counts": altitude_counts,
        },
        "active_leads": [
            {
                "lead_id": r["lead_id"],
                "name": r["name"],
                "altitude": r["altitude"],
                "current_plan_day": r["current_plan_day"],
                "current_off_ramp": r["current_off_ramp"],
                "last_updated": r["last_updated"],
            }
            for r in active
        ],
        "intake_enriched": [r["name"] for r in enriched],
        "intake_raw": [r["name"] for r in raw],
        "andre_queue_24h": andre_queue,
        "system_queue_24h": system_queue,
        "health_flags": health_flags,
    }


# ---------------------------------------------------------------------------
# Dashboard HTML renderer
# ---------------------------------------------------------------------------

DASHBOARD_CSS = r"""
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border: 1px solid var(--line); margin-bottom: 28px; }
.kpi-row .cell {
  padding: 22px 24px; border-right: 1px solid var(--line-2); background: var(--bg-2);
}
.kpi-row .cell:last-child { border-right: 0; }
.kpi-row .cell .k { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.12em; color: var(--ink-3); text-transform: uppercase; margin-bottom: 8px; }
.kpi-row .cell .v { font-family: 'Fraunces', serif; font-size: 38px; font-weight: 500; line-height: 1.0; color: var(--ink); }
.kpi-row .cell .v small { font-family: 'Inter', sans-serif; font-size: 13px; color: var(--ink-3); margin-left: 8px; font-weight: 400; }

.lead-table { width: 100%; border-collapse: collapse; }
.lead-table th, .lead-table td { padding: 12px 14px; border-bottom: 1px solid var(--line-2); text-align: left; font-size: 13px; vertical-align: top; }
.lead-table th { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.10em; color: var(--ink-3); text-transform: uppercase; background: var(--bg-3); }
.lead-table tr:last-child td { border-bottom: 0; }
.lead-table .stage { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--ink-3); text-transform: uppercase; letter-spacing: 0.06em; }
.lead-table .name { font-family: 'Fraunces', serif; font-size: 16px; }
.lead-table .name a { text-decoration: none; }
.lead-table tr.active { background: color-mix(in srgb, var(--sage) 25%, transparent); }
.lead-table tr.active .stage { color: var(--sage-ink); }

.queue-list { list-style: none; padding: 0; }
.queue-list li { padding: 10px 0; border-bottom: 1px solid var(--line-2); font-size: 13.5px; display: flex; align-items: baseline; gap: 12px; }
.queue-list li:last-child { border-bottom: 0; }
.queue-list li::before { content: "▸"; color: var(--ink-3); font-size: 10px; }

.flag-list { list-style: none; padding: 0; }
.flag-list li { padding: 10px 14px; background: var(--amber); color: var(--amber-ink); border-left: 3px solid var(--amber-ink); font-size: 13px; margin-bottom: 6px; }

.intake-cluster { display: flex; flex-wrap: wrap; gap: 6px; }
.intake-cluster .pill { padding: 5px 10px; background: var(--bg-3); border: 1px solid var(--line-2); border-radius: 2px; font-size: 12px; color: var(--ink-2); }
"""


def render_dashboard_html(payload: dict) -> str:
    r = payload["rollup"]
    active = payload["active_leads"]

    # KPI row
    kpis = f"""
<div class="kpi-row">
  <div class="cell"><div class="k">Total leads</div><div class="v">{r["total"]}</div></div>
  <div class="cell"><div class="k">Active</div><div class="v">{r["active"]} <small>running 7-day plan</small></div></div>
  <div class="cell"><div class="k">Intake (enriched)</div><div class="v">{r["intake_enriched"]} <small>profile data on disk</small></div></div>
  <div class="cell"><div class="k">Intake (raw)</div><div class="v">{r["intake_raw"]}</div></div>
</div>
"""

    # Active leads table
    active_rows = ""
    if active:
        rows = []
        # name → alias mapping for the leads we render Lead Boxes for.
        # Box-name (directory name) shadows LEAD_SOURCES "name" because
        # rollup_ledger emits the directory name, not the canonical name.
        for a in active:
            alias = ACTIVE_BOX_NAMES.get(a["name"])
            link = f'<a href="leads/{alias}.html">{md_inline(a["name"])}</a>' if alias else md_inline(a["name"])
            altitude = "🐋 whale" if a["altitude"] == "whale" else md_inline(a["altitude"])
            rows.append(
                f'<tr class="active">'
                f'<td class="name">{link}</td>'
                f'<td>{altitude}</td>'
                f'<td>Day {a["current_plan_day"]}</td>'
                f'<td>{md_inline(a["current_off_ramp"])}</td>'
                f'<td class="stage">active</td>'
                f'</tr>'
            )
        active_rows = "".join(rows)

    active_section = f"""
<section>
  <div class="sec-head">
    <div>
      <div class="sec-eyebrow">Active · running 7-day plan</div>
      <div class="sec-title">{r["active"]} {"lead" if r["active"] == 1 else "leads"} in motion</div>
    </div>
    <div class="sec-meta">click name → Lead Box</div>
  </div>
  <div class="sec-body" style="padding:0">
    <table class="lead-table">
      <thead><tr>
        <th>Lead</th><th>Altitude</th><th>Plan day</th><th>Off-ramp</th><th>Stage</th>
      </tr></thead>
      <tbody>{active_rows or "<tr><td colspan='5' class='muted' style='padding:20px 14px'>No active leads.</td></tr>"}</tbody>
    </table>
  </div>
</section>
"""

    # Andre's queue
    queue_items = "".join(f"<li>{md_inline(q)}</li>" for q in payload["andre_queue_24h"])
    sys_items = "".join(f"<li>{md_inline(q)}</li>" for q in payload["system_queue_24h"])
    queue_section = f"""
<section>
  <div class="sec-head">
    <div>
      <div class="sec-eyebrow">Next 24h</div>
      <div class="sec-title">Queues</div>
    </div>
  </div>
  <div class="sec-body">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:32px">
      <div>
        <div class="sec-eyebrow" style="margin-bottom:10px">Andre</div>
        <ul class="queue-list">{queue_items or '<li class="muted">empty</li>'}</ul>
      </div>
      <div>
        <div class="sec-eyebrow" style="margin-bottom:10px">System</div>
        <ul class="queue-list">{sys_items or '<li class="muted">empty</li>'}</ul>
      </div>
    </div>
  </div>
</section>
"""

    # Intake queue (the 27 leads not yet active)
    enriched_pills = "".join(f'<span class="pill">{md_inline(n)}</span>' for n in payload["intake_enriched"])
    raw_pills = "".join(f'<span class="pill">{md_inline(n)}</span>' for n in payload["intake_raw"])
    intake_section = f"""
<section>
  <div class="sec-head">
    <div>
      <div class="sec-eyebrow">Intake Queue</div>
      <div class="sec-title">{r["intake_enriched"] + r["intake_raw"]} leads ready to onboard</div>
    </div>
    <div class="sec-meta">enriched files present, no Lead Box yet</div>
  </div>
  <div class="sec-body">
    <div class="sec-eyebrow" style="margin-bottom:10px">Enriched</div>
    <div class="intake-cluster" style="margin-bottom:18px">{enriched_pills or '<span class="muted">none</span>'}</div>
    <div class="sec-eyebrow" style="margin-bottom:10px">Harvested only</div>
    <div class="intake-cluster">{raw_pills or '<span class="muted">none</span>'}</div>
  </div>
</section>
"""

    # Health flags
    flag_items = "".join(f"<li>{md_inline(f)}</li>" for f in payload["health_flags"])
    flag_section = f"""
<section>
  <div class="sec-head">
    <div>
      <div class="sec-eyebrow">Pipeline Health</div>
      <div class="sec-title">Flags</div>
    </div>
  </div>
  <div class="sec-body">
    <ul class="flag-list">{flag_items or '<li class="muted">none</li>'}</ul>
  </div>
</section>
"""

    masthead = f"""
<header class="masthead">
  <div>
    <div class="eyebrow">Dashboard · CIA Runtime</div>
  </div>
  <div class="ts">refreshed {NOW_HUMAN}</div>
</header>
"""

    body = f"<style>{DASHBOARD_CSS}</style>\n{masthead}\n{kpis}\n{active_section}\n{queue_section}\n{intake_section}\n{flag_section}\n<footer class='colophon'>CIA Runtime · Dashboard · AUTO.10 + AUTO.11</footer>"

    return page_html(
        title="Dashboard · CIA Runtime",
        body=body,
        active_nav="dashboard",
        depth=0,
        wide=True,
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    rows = rollup_ledger()
    csv_path = write_master_ledger_csv(rows)
    payload = compute_dashboard(rows)

    json_path = STATE / "dashboard.json"
    json_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    html_path = STATE / "dashboard.html"
    html_path.write_text(render_dashboard_html(payload), encoding="utf-8")

    print(f"  AUTO.10 → {csv_path.relative_to(STATE.parent)} ({len(rows)} leads)")
    print(f"  AUTO.11 → {json_path.relative_to(STATE.parent)}")
    print(f"  AUTO.11 → {html_path.relative_to(STATE.parent)}")


if __name__ == "__main__":
    main()

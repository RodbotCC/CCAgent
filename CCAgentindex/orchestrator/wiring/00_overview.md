# 00_overview.md — Orchestrator Top-Level Wiring

The orchestrator is a thin runtime layer that walks the file tree and
turns it into a renderable surface. Three layers:

```
┌─────────────────────────────────────────────────────────────────────┐
│                   FILE TREE (per-lead substrate)                    │
│                                                                     │
│   clients/<lead_id>/      (or `Hugodemo/` for the demo)             │
│     00_meta.json          ← lead_id, name, altitude, smart-view     │
│     01_comms.md           ← snapshot table + correspondence history │
│     02_people_search.md   ← pre-enrichment fields                   │
│     03_deep_dive.md       ← LinkedIn / employer / public footprint  │
│     04_profile.md         ← buyer briefing (identity + altitude)    │
│     05_seven_day_plan.md  ← Day 1–7 moves + off-ramps               │
│     06_logic.md           ← off-ramp shapes (🟢🔵🟡🔴)              │
│     07_skills_used.md     ← Tier 1+2+3 composition per day          │
│     08_automations.md     ← what's on/off for this lead             │
│     09_andre_alerts.md    ← timed Andre-action prompts              │
│     10_andre_feedback.md  ← Andre's reactions to each move          │
│     AGENTS.md / CLAUDE.md ← the per-lead agent config               │
│     source_index.md       ← S### audit trail                        │
│     asset_index.md        ← A### media trail                        │
│     run_log.md            ← operational history                     │
│     client_ledger.md      ← §17 column status                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       ORCHESTRATOR (this folder)                    │
│                                                                     │
│   render_lead.py                                                    │
│     ├── data adapter   read_lead_file(alias, name)                  │
│     ├── md helpers     parse_md_table, split_by_heading, md_inline  │
│     ├── widgets        render_snapshot, render_today, …             │
│     └── main           writes state/<alias>.html                    │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    LEAD BOX PAGE (rendered HTML)                    │
│                                                                     │
│   state/hugo.html — open with `open state/hugo.html`                │
│                                                                     │
│   Self-contained: design system inlined, no JS, no build step.      │
│   Re-runnable: `python3 render_lead.py hugo` regenerates from disk. │
└─────────────────────────────────────────────────────────────────────┘
```

## Loop closure (where automations plug in)

The orchestrator is the **read** half. The automations from
`automation_index.md` are the **write** half:

| automation | direction | touches |
|---|---|---|
| AUTO.01 comms-append-loop | external → file tree | appends to `01_comms.md`, sets `comms_dirty=true` |
| AUTO.02 liaison-agent-wake | file tree → composer | reads `comms_dirty`, runs Tier 1+2+3 composition |
| AUTO.05 outbound-mirror-slack | composer → Slack | per-send mirror |
| AUTO.06 andre-day-alert | file tree → Slack/page | reads plan day, fires alert with draft |
| AUTO.07 quote-expiry-alert | file tree → Slack | timer-driven |
| AUTO.09 escalation-no-ack | timer → Slack DM | watches for ack failure |
| AUTO.10 ledger-rollup | per-lead ledgers → master ledger | nightly cron |
| AUTO.11 dashboard-refresh | master ledger → dashboard.json/md/html | nightly cron |
| **render_lead.py** (this) | **file tree → HTML page** | **manual or watch-driven** |

Tonight's build is just the renderer (the bottom row). The other rows
are scripts that arrive in subsequent moves, each one a small file
plugging into this same substrate without modifying the renderer.

## Discipline

- **The file tree is canonical.** The renderer never invents data; it
  only renders what's in the lead's folder.
- **One widget = one file source.** If a widget needs data from two
  files, the data adapter merges them; the widget renderer reads one
  shape.
- **Newer/ wins.** The data adapter reads `Hugodemo/Newer/<file>` first,
  falling back to `Hugodemo/<file>`. When the substrate moves to
  `clients/<lead_id>/`, the adapter changes; nothing else does.
- **Self-contained output.** The HTML page must render correctly when
  opened with no server. If we add JS or external assets, justify why.

## What this document does NOT do

- Does not describe the per-widget contracts. See `lead_box.md`.
- Does not enumerate the automations. See `../../Hugodemo/Newer/automation_index.md`.
- Does not describe the agent's decision logic. See per-lead `AGENTS.md`
  + `CLAUDE.md`.

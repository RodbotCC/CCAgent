# PLAN.md

The orchestrator runtime — built in two waves.

## Wave 1 — Lead Box (shipped earlier this session)

| # | phase | output | status |
|---|---|---|---|
| 1 | Scaffold | `README.md`, `PLAN.md`, `wiring/`, `state/` | ✅ |
| 2 | Data adapter | `read_lead_file()` in `render_lead.py` (Newer/ wins) | ✅ |
| 3 | Lead Box renderer | `state/hugo.html` (477 lines, self-contained) | ✅ |
| 4 | Wiring diagrams | `wiring/00_overview.md` + `wiring/lead_box.md` | ✅ |
| 5 | Verify | 22 comms events, 5 day blocks, 14 snapshot rows, 15 profile rows | ✅ |

## Wave 2 — Lock the system together (shipping now)

Goal: turn the orchestrator from "renders Hugo's Lead Box" into "the
runtime Andre opens every morning to drive the day." Six new pieces,
one unified runner.

| # | phase | output | status |
|---|---|---|---|
| 1 | Shared library | `bin/_lib.py` — data adapter, md helpers, design tokens, nav bar | ✅ |
| 2 | AUTO.10 + AUTO.11 | `bin/refresh.py` — rolls up per-lead ledgers → `state/master_ledger.csv`; refreshes `state/dashboard.json` + `state/dashboard.html` | ✅ |
| 3 | Today's Briefing (AUTO.06 surface) | `bin/today.py` — Andre's morning view: today's plan day, today's draft, today's alerts | ✅ |
| 4 | Voice profile renderer | `bin/voice.py` — renders `Staff Boxes/<voice>/` profile as a reference page | ✅ |
| 5 | Index page | `bin/index.py` — landing page linking dashboard / today / leads / voices / wiring | ✅ |
| 6 | Lead Box refactor | `render_lead.py` switched to use `_lib`; nav bar added; output at `state/leads/hugo.html` | ✅ |
| 7 | Unified runner | `build.py` — single command regenerates everything in 0.16s | ✅ |
| 8 | Wiring docs | `wiring/dashboard.md`, `wiring/today.md`, `wiring/automations.md` | ✅ |
| 9 | Multi-lead enumeration | Dashboard surfaces all 28 leads (1 active Hugo + 27 intake-enriched) | ✅ |
| 10 | Verify + ship | `python3 build.py` produces 5 HTML pages + master_ledger.csv + dashboard.json | ✅ |

## Page graph

```
state/
├── index.html               # landing — links everything below
├── today.html               # Andre's morning briefing (the "open this every morning" page)
├── dashboard.html           # pipeline overview — every lead, status rolled up
├── leads/
│   └── hugo.html            # the canonical Lead Box (Wave 1, kept here)
├── voice/
│   └── andre-at-ceiling.html  # Andre's voice profile (linked from any Lead Box)
├── master_ledger.csv        # AUTO.10 output — machine-readable
└── dashboard.json           # AUTO.11 output — machine-readable
```

Every `.html` page shares the same nav bar across the top:

```
[Today] [Dashboard] [Leads ▾] [Voices ▾] [Wiring]
```

## Run

```bash
cd /Users/jakeaaron/Desktop/Auto/orchestrator
python3 build.py
open state/index.html
```

`build.py` runs in this order:
1. `bin/refresh.py` (rolls up the ledger, writes CSV + JSON)
2. `bin/today.py` (writes today.html)
3. `bin/refresh.py --html` (writes dashboard.html — depends on the JSON)
4. `bin/voice.py andre-at-ceiling` (writes voice/andre-at-ceiling.html)
5. `render_lead.py hugo` (writes leads/hugo.html)
6. `bin/index.py` (writes index.html — depends on everything above)

## After Wave 2 — what comes next

| # | move | unlocks | depends on |
|---|---|---|---|
| W3.1 | Watch mode | `build.py --watch` regenerates on file change | Wave 2 |
| W3.2 | AUTO.06 delivery | actually pushes today's draft to Andre (Slack DM / local notification) | Slack creds OR macOS notification |
| W3.3 | AUTO.01 heartbeat | live comms append from Close webhook | Close API access |
| W3.4 | AUTO.05 outbound mirror | Slack audit trail per send | Slack creds + W3.3 |
| W3.5 | AUTO.09 escalation timer | blowout-prevention if Andre doesn't ack | W3.2 |
| W3.6 | Real `clients/<lead_id>/` migration | normalize the per-lead substrate per CIA spec | (decision to migrate) |
| W3.7 | Voice profile coverage | render the 9 other Staff Boxes voices once they're written | content |
| W3.8 | Skill library index | render `stage-1-harvest.md` … `stage-7-automations.md` as browsable docs | none |

## Discipline (carries from Wave 1, do not relax)

- The file tree is canonical. Nothing the renderer outputs should
  invent data; missing data renders as "not yet captured", not as a guess.
- One widget = one file source. Multi-source widgets must use a data
  adapter, not inline reads in the widget renderer.
- Self-contained HTML output. Open the file with no server. No build
  step beyond `python3 build.py`.
- Newer/ wins. `_lib.read_lead_file()` looks in
  `Hugodemo/Newer/` first, falls back to `Hugodemo/`. When the substrate
  moves to real `clients/<lead_id>/`, the adapter changes; nothing else.
- Match `hugo-ballpark-DEMO.html` aesthetically. Editorial, not SaaS.
  Fraunces / Inter / JetBrains Mono on parchment.

# orchestrator

The runtime layer of the Comeketo Client Intelligence Agent. Reads the
per-lead file substrate (built across Stages 1–6 in `../Hugodemo/`) and
renders it as four interconnected pages Andre can act from:

- **Today** — the morning open. Today's plan day, the pre-written draft,
  today's alerts. The page that fires AUTO.06 (andre-day-alert).
- **Dashboard** — pipeline overview. Every lead, rolled up. AUTO.10 +
  AUTO.11.
- **Lead Box** — the full per-lead intelligence package. Snapshot,
  Today's Move, 7-day plan, profile, logic, comms, alerts, skills, audit.
- **Voice** — Tier 3 voice profile (Andre at ceiling). Linked from any
  Lead Box.

Plus a landing **Index** that links them all together.

## Run

```bash
cd /Users/jakeaaron/Desktop/Auto/orchestrator
python3 build.py
open state/index.html
```

Re-runnable. `build.py` is idempotent — every render reads the canonical
files and overwrites the page. No state in the runtime; the file tree is
the truth.

## What this is

Folders are agent configurations. The orchestrator's job is small: walk
the file tree, render every surface, never invent data. Three layers:

```
file tree (source)  →  orchestrator (renderer)  →  HTML pages (surface)
```

Tonight (Wave 2) ships:

| surface | reads from | written by |
|---|---|---|
| `state/index.html` | `state/dashboard.json` | `bin/index.py` |
| `state/today.html` | per-lead `05_seven_day_plan.md` + `09_andre_alerts.md` | `bin/today.py` |
| `state/dashboard.html` | `Client Boxes/` + `LEAD_SOURCES` | `bin/refresh.py` |
| `state/leads/hugo.html` | Hugo's full file substrate | `render_lead.py` |
| `state/voice/andre-at-ceiling.html` | `Staff Boxes/Andre Raw/` | `bin/voice.py` |
| `state/master_ledger.csv` | rollup over all leads | `bin/refresh.py` (AUTO.10) |
| `state/dashboard.json` | rollup over all leads | `bin/refresh.py` (AUTO.11) |

## Repo structure

```
orchestrator/
├── README.md            (this file)
├── PLAN.md              (build order across waves)
├── build.py             (single-command runner)
├── render_lead.py       (Lead Box renderer)
├── bin/
│   ├── _lib.py          (shared: data adapter, md helpers, design tokens, nav bar)
│   ├── refresh.py       (AUTO.10 + AUTO.11)
│   ├── today.py         (AUTO.06 surface — the morning open)
│   ├── voice.py         (Tier 3 voice profile renderer)
│   └── index.py         (landing page)
├── wiring/
│   ├── 00_overview.md   (top-level flow)
│   ├── lead_box.md      (per-widget contracts on the Lead Box)
│   ├── dashboard.md     (AUTO.10 / AUTO.11 wiring)
│   ├── today.md         (AUTO.06 surface wiring)
│   └── automations.md   (AUTO.01–AUTO.11 status + plug-points)
└── state/               (generated; gitignore-able)
    ├── index.html
    ├── today.html
    ├── dashboard.html
    ├── master_ledger.csv
    ├── dashboard.json
    ├── leads/
    │   └── hugo.html
    └── voice/
        └── andre-at-ceiling.html
```

## Where the data comes from

The data adapter (`bin/_lib.py:read_lead_file`) reads in this priority
order:

1. `../Hugodemo/Newer/<file>` (canonical when present — newer files
   shadow older)
2. `../Hugodemo/<file>` (fallback for files not in Newer/)

For the dashboard rollup, `enumerate_client_boxes()` walks
`../Client Boxes/` and classifies every sub-folder as one of:

- **active** — has an alias in `LEAD_SOURCES` (currently only Hugo)
- **intake-enriched** — folder contains `<Name>_enrichment.md`
- **intake** — bare folder, no enrichment yet

When the substrate moves to a real `clients/<lead_id>/` directory per
the CIA spec, swap the adapter in `_lib.py`. Nothing else changes.

## Visual language

Inlined CSS — Fraunces serif + Inter sans + JetBrains Mono on parchment
cream (#EBE8E0), sage / amber / coral accents. Same system as
`../Hugodemo/hugo-ballpark-DEMO.html`.

The shared design tokens live in `bin/_lib.py:CSS`. Each renderer adds
its page-specific overrides at the top of the rendered body. No global
stylesheet, no build step, no asset pipeline.

## What's NOT in here yet (Wave 3)

| # | move | unlocks |
|---|---|---|
| W3.1 | Watch mode | `build.py --watch` regenerates on file change |
| W3.2 | AUTO.06 delivery | actually pushes today's draft to Andre (Slack DM or local notify) |
| W3.3 | AUTO.01 heartbeat | live comms append from Close webhook |
| W3.4 | AUTO.05 outbound mirror | Slack audit trail per send |
| W3.5 | AUTO.09 escalation timer | blowout-prevention if Andre doesn't ack |
| W3.6 | AUTO.07 / AUTO.08 date triggers | quote-expiry + pre-tasting alerts surface in Today |
| W3.7 | Real `clients/<lead_id>/` migration | normalize the per-lead substrate per CIA spec |
| W3.8 | Voice profile coverage | render the 9 other Staff Boxes voices |
| W3.9 | Skill library index | render `stage-1-harvest.md` … `stage-7-automations.md` as browsable docs |

Each is a small script that plugs into this same substrate. None of
them require changes to the renderers or the data adapter — that's the
point.

## Discipline

- The file tree is canonical. Renderers never invent data.
- One widget = one file source. Multi-source widgets use a data adapter.
- Self-contained HTML. Open with no server.
- Re-runnable. `python3 build.py` regenerates everything from disk.
- Match `hugo-ballpark-DEMO.html` aesthetically. Editorial, not SaaS.

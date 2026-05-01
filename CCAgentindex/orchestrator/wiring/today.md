# today.md — Today's Briefing Wiring

`state/today.html` is the page Andre opens every morning. It surfaces
**AUTO.06 andre-day-alert** as a single-page view across every active
lead.

## What "today" means

`bin/today.py` defines `TODAY` at the top of the file. For now it's
hardcoded to `2026-04-25` (the system day Hugo's Day-1 fires). When
this becomes a real cron-driven page, swap to `datetime.now()` and
let the date-based alert logic do its job.

## Per-lead computation

For each `alias` where `LEAD_SOURCES[alias]["stage"] == "active"`:

1. Read `05_seven_day_plan.md` and `09_andre_alerts.md`.
2. Determine today's plan day (from `LEAD_SOURCES[alias]["current_plan_day"]`).
3. Extract that day's section from the plan via `extract_day_section()`.
4. Classify the day as **active** or **passive**:
   - Passive day → render rationale band ("Hugo is likely with his fiancée…").
   - Active day → parse subject (if email) or first prose paragraph (if SMS).
5. Pull alerts whose H2 heading matches `Day N` or `Day 0` from the
   alerts file.
6. Render a `<div class="lead-card">` with:
   - Name + altitude + plan-day meta (header)
   - Lede band (one-line strategic frame)
   - Draft block (the move) + inert action buttons
   - Today's alerts band (color-coded badges)

## Action buttons (inert tonight, live in W3.2)

```
[ Send via Close ]   [ Edit & Send ]   [ Skip today ]
```

Tonight: `cursor: not-allowed`, no JS handlers. The "AUTO.06 delivery
is W3.2" hint to the right of the buttons names the next step
explicitly. When delivery wires up, those buttons gain handlers that:

- **Send via Close** → POST to Close API with the rendered draft body,
  then trigger `AUTO.05 outbound-mirror-slack` and append to
  `01_comms.md` via `AUTO.01`.
- **Edit & Send** → opens an inline contenteditable, on save mirrors
  the diff to `10_andre_feedback.md` as `kind: edit` (calibration
  signal for the voice library).
- **Skip today** → marks the day as held; appends `kind: block` to
  `10_andre_feedback.md`; updates the per-lead `client_ledger.md`.

The rendered HTML doesn't need to know which delivery mechanism is
live. The buttons are wiring stubs; the code behind them lands later.

## Why the page-surface FIRST, push delivery LATER

Two reasons:
1. **The draft is the asset.** Slack/Email/Notification delivery is
   just a transport for the draft. Get the draft surface right; the
   transport is interchangeable.
2. **Page surface = self-contained truth.** If the cron fails, if Slack
   is down, if Andre's notifications are silenced — the page still
   renders, the draft is still there, Andre can still send.

This is the same principle as the file-tree-as-API: the renderer is
one of many readers; the file tree is the only writer.

## Date-based alert types beyond Day-N

Tonight only the day-N alerts surface, but the same lead-card template
extends naturally to:

- **AUTO.07 quote-expiry-alert** — when `today == quote_sent + 14 days`.
  Emits a "quote expires today" critical-tier alert that surfaces in
  the alerts band of every relevant lead-card.
- **AUTO.08 pre-tasting-alert** — when `today + 24h ≥ tasting_date`.
  Emits a tasting-prep critical alert.
- **AUTO.09 escalation-no-ack** — when an alert has been sent but not
  acknowledged within tier-defined timeout. Surfaces as a re-emphasized
  alert on the next page render.

Each of those is a one-function addition to `today.py`. Read date from
`00_meta.json` or `client_ledger.md`, compare to TODAY, emit alert if
match. Same lede-band styling, just a different `tag` on the badge.

## Discipline

- One lead = one `<div class="lead-card">`. Don't merge cards across
  leads — Andre's attention is finite, and each lead deserves its own
  read.
- Hero stays one sentence. The page is for action, not narrative.
- Inert buttons must visibly say so. If the buttons looked live but
  weren't wired, Andre would think he sent something he didn't.

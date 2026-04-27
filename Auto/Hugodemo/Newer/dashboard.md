# dashboard.md — Live Pipeline Dashboard

CIA §14. Human-readable view of every active lead's current state.
Auto-generated from `master_ledger.csv` + per-lead state. Do not
hand-edit — edits get clobbered on the next refresh.

Last refreshed: 2026-04-26 01:00Z

## Active leads

| lead | altitude | day | off-ramp | last in | last out | next move | next Andre | next auto | risk | freshness | blocker |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Hugo Casillas | 🐋 whale | Day 1 (Fri) | follow-up | 2026-04-17 SMS "I'm available most of today" | 2026-04-24 SMS re-engagement | Day 1 email — Highland Orchard ref + walkthrough video offer + weekday call ask | review + ship Day 1 email today | comms-append-loop watches Close | 🟡 medium — quote sent April 17, no reply since April 17 (Hugo) | 🟢 fresh | fiancée not yet engaged; LinkedIn URL not captured in source_index |

## Roll-up

- Active leads: 1
- 🐋 whale: 1
- 💪 strong: 0
- standard: 0
- soft: 0
- holds / blocks / nurtures / closes: 0

## At-risk leads (current risk = 🔴 or 🟡)

- Hugo Casillas (🟡) — silence since the discovery call. Day 1 outbound
  fixes the silence today. If no ack on the alert by +30min, escalate.

## Andre's queue (next 24h)

- Today (Friday): review and ship the Day 1 email to Hugo. Draft is in
  `05_seven_day_plan.md`.
- Today: paused-cadence confirmation (already executed; nothing to do).
- Today: confirm `voice-andre-at-ceiling` profile is loaded for outbound
  composition (per Day 0 alert in `09_andre_alerts.md`).

## System queue (next 24h)

- Watch Close for any inbound from Hugo; if it lands, Liaison Agent
  wakes, branches per `06_logic.md`.
- No automated outbound is scheduled for this lead; Hugo is manual-only.

## Pipeline health flags

- ❌ §05 deep-dive sweeps incomplete on Hugo (FB/IG/TikTok/YouTube/podcast/press
  not searched). Coverage is 🟡 partial across the board.
- ❌ Master-level rollup automations (AUTO.10 / AUTO.11) not yet
  implemented. This dashboard is currently hand-maintained.

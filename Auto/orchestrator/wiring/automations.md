# automations.md — AUTO.01 through AUTO.11

Master index of every automation in the system. Authoritative spec is
`Hugodemo/Newer/automation_index.md`; this doc records each one's status
in the runtime and where it plugs into the orchestrator.

| id | name | status (Wave 2) | implementation | plugs in at |
|---|---|---|---|---|
| AUTO.01 | comms-append-loop | ❌ not yet wired | (Close webhook + 5-min poll) | Lead Box · Comms timeline; Today · alerts |
| AUTO.02 | liaison-agent-wake | ❌ not yet wired | reads `comms_dirty` flag; runs Tier 1+2+3 composition | (downstream of AUTO.01) |
| AUTO.03 | drip-emails-rhonna | ✅ off (Hugo whale-tier) | (Close cadence config) | Lead Box · 08_automations.md |
| AUTO.04 | re-engagement-sms | ✅ off (Hugo whale-tier) | (Close cadence config) | Lead Box · 08_automations.md |
| AUTO.05 | outbound-mirror-slack | ❌ not yet wired | per-send Slack DM + #andre-system-actions | (downstream of AUTO.06 send) |
| AUTO.06 | andre-day-alert | 🟡 page-surfaced (`bin/today.py`); push delivery is W3.2 | reads active leads' plan-day; renders draft + alerts on `today.html` | Today page (the surface); push to come |
| AUTO.07 | quote-expiry-alert | 🟡 alert text drafted (`09_andre_alerts.md`); date trigger TBD | extend `today.py` with quote-expiry date check | Today · alerts band |
| AUTO.08 | pre-tasting-alert | 🟡 alert text drafted; date trigger TBD | extend `today.py` with tasting-date check | Today · alerts band |
| AUTO.09 | escalation-no-ack | ❌ not yet wired | (timer service) | (downstream of AUTO.06 ack) |
| AUTO.10 | ledger-rollup | ✅ live (`bin/refresh.py`) | walks `Client Boxes/`, writes `state/master_ledger.csv` | Dashboard · KPI row + active table |
| AUTO.11 | dashboard-refresh | ✅ live (`bin/refresh.py`) | reads CSV, writes `state/dashboard.json` + `state/dashboard.html` | Dashboard page |

## Reading this table

- ✅ live = a script in this repo runs it; verifiable by `python3 build.py`.
- 🟡 partial = the data structure is in place; the trigger / push is not.
- ❌ not yet wired = needs Close API access, Slack creds, or a timer service.

## Plug-in pattern

Every automation follows the same shape: it reads from the file tree,
makes a small derivation, and writes back to the file tree (or to a
mirror like Slack). The orchestrator picks up the new state on the
next render. Concretely:

```
external event ──► writes to file tree ──► next build run picks it up ──► page reflects truth
```

This means the renderer **never** needs special knowledge about a new
automation. A new AUTO.X just needs to:

1. Watch its trigger (cron, webhook, file change, timer).
2. Update the right file in the lead's folder (`01_comms.md`,
   `09_andre_alerts.md`, `10_andre_feedback.md`, `client_ledger.md`).
3. Let the renderers do their job on the next build.

## Wave 3 build order (post-tonight)

1. **AUTO.06 push delivery** — Slack DM or macOS notification. Reads
   the same `Today` lead-card data, sends it as a notification.
   Acknowledgement loops back to `10_andre_feedback.md`.

2. **AUTO.01 comms-append-loop** — Close webhook receiver. Appends new
   activity to per-lead `01_comms.md` with a `### Update — <UTC ISO>`
   header. Sets `comms_dirty=true`.

3. **AUTO.05 outbound-mirror-slack** — when AUTO.06 push delivery
   ships a draft, mirror to `#andre-system-actions`. Audit trail.

4. **AUTO.07 / AUTO.08** — extend `today.py` with date-trigger checks.
   No new infrastructure; just date math.

5. **AUTO.09 escalation-no-ack** — local timer service that re-fires
   AUTO.06 push if no ack in 30/60/120 min by altitude tier. Reads the
   ack state from `10_andre_feedback.md`.

6. **AUTO.02 liaison-agent-wake** — the per-lead subagent that wakes
   on `comms_dirty=true` and decides next move. This is the biggest
   chunk; needs careful design around the read-orchestrator vs.
   write-agent split.

## Forbidden moves

- **Don't push without Andre's ack.** AUTO.06 push delivery surfaces
  the draft; Andre approves; only then does Close get touched.
- **Don't auto-send agreements.** Per Hugo's `CLAUDE.md`: any move
  that commits Comeketo to a date or contractual term escalates to
  operator. Hard rule, no overrides.
- **Don't store secrets in this repo.** Slack tokens, Close API keys,
  webhook secrets all live in env or in `.env` files outside the
  repo's tracked surface.

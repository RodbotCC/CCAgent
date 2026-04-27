# automation_index.md — Master Automation Index

CIA §00.08. Every active automation: what it watches, what it appends,
what it notifies, what it triggers.

| id | name | watches | appends/notifies | trigger | scope | status |
|---|---|---|---|---|---|---|
| AUTO.01 | comms-append-loop | Close webhook + 5-min poll | appends to per-lead `01_comms.md`; sets `comms_dirty=true` | new SMS / email / call / note / task | all leads | ✅ on |
| AUTO.02 | liaison-agent-wake | `comms_dirty=true` in client_ledger | wakes per-lead Liaison Agent | per-lead read of `AGENTS.md` / `CLAUDE.md` | all leads | ✅ on |
| AUTO.03 | drip-emails-rhonna | timer-based | (formerly) auto-email | scheduled | per-lead opt-in | ❌ off for Hugo (whale-tier manual-only) |
| AUTO.04 | re-engagement-sms | silence > N days | SMS to lead | timer | per-lead opt-in | ❌ off for Hugo |
| AUTO.05 | outbound-mirror-slack | every Liaison-Agent-shipped outbound | Slack DM to Andre + `#andre-system-actions` | per-send | all whale-tier | ✅ on |
| AUTO.06 | andre-day-alert | active plan-day | "send the move — here's the draft" | Day 1 / Day 4 / Day 6 of any 7-day plan | per-lead | ✅ on for Hugo |
| AUTO.07 | quote-expiry-alert | 14-day window from quote sent | "extend or are you ready to talk" prompt | per-lead quote date + 14d | per-lead with active quote | ✅ on for Hugo (May 1, 2026) |
| AUTO.08 | pre-tasting-alert | T–24h on confirmed tasting | "tasting today, fiancée's name, vegetarian station ready" | tasting-date confirmed | per-lead | 🟡 queued for Hugo (May 17 if confirmed) |
| AUTO.09 | escalation-no-ack | day-alert with no ack +30/60min | DM-escalate to Andre | per-lead alert | whale-tier | ✅ on for Hugo |
| AUTO.10 | ledger-rollup | nightly | refreshes `master_ledger.csv` from per-lead `client_ledger.md` | timer (cron 02:00) | global | 🟡 not yet implemented |
| AUTO.11 | dashboard-refresh | nightly | regenerates `dashboard.md` from `master_ledger.csv` | timer (cron 02:15) | global | 🟡 not yet implemented |

## Per-lead automation overrides

| lead | overrides |
|---|---|
| Hugo Casillas | AUTO.03 OFF, AUTO.04 OFF, AUTO.05 ON (whale tier), AUTO.06 ON, AUTO.07 ON (May 1), AUTO.08 queued, AUTO.09 ON |

## Add-an-automation rule

When you add a new automation, add a row here AND a corresponding entry
in the per-lead `08_automations.md` for every lead it touches. Drift
between this file and per-lead automation files is the most common
source of "why didn't the system fire?" debugging.

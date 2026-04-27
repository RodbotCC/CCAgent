# routines/

Claude Code Routines that turn Lead Boxes from *pages Andre opens* into a
*system that runs and reports*. After you set these up, Andre's only
contribution is reading Slack DMs and showing up for calls / tastings.

## Per-lead folders

Each active lead gets its own subfolder with that lead's specific routines.

| folder | lead | routines | close event |
|---|---|---|---|
| [`hugo/`](hugo/) | Hugo Casillas (🐋 ZoomInfo AE) | 4 routines | Quote expiry May 1 |
| [`brenda-steve/`](brenda-steve/) | Brenda & Steve Catalano (🐋 franchise empire) | 3 routines | Tasting May 3 |

Each folder has:
- `SCHEDULE.md` — **the plain-English schedule for that lead. Show this to Andre.**
- `01_comms_heartbeat.md` — Routine R1 (every 10 min, watches Close, classifies, DMs Andre)
- `02_plan_executor.md` — Routine R2 (daily morning, fires today's planned move)
- `03_*` — close-event routine (quote expiry for Hugo, pre-tasting brief for B&S)
- `04_tasting_prep.md` (Hugo only — for the May 17 tasting if confirmed)

## How to deploy each lead's routines

For each routine file:

1. Open Claude desktop → `Routines` → `New routine`
2. **Name:** copy the title from the routine file's front-matter
3. **Instructions:** copy the entire body of the file (everything below the front-matter)
4. **Connectors:** enable the ones listed in the front-matter (Close, Slack, Google Drive)
5. **Trigger:** pick `Schedule`, paste the cron expression OR set the one-shot date/time
6. Save
7. Watch the first fire. Trust but verify.

Or use `/schedule` from the CLI — same fields, same result.

## Persistent state lives in Google Drive

Each lead has its own state folder at `My Drive/cia-state/<alias>/`:

- `My Drive/cia-state/hugo/` (for Hugo's routines)
- `My Drive/cia-state/brenda-steve/` (for Brenda & Steve's routines)

Per-lead state files (same shape across leads):

| file | written by | purpose |
|---|---|---|
| `last-seen-activity-id.txt` | R1 | tracks the last Close activity ID so we don't reprocess |
| `escalation-paused.txt` | R1 (auto), Andre (manual delete) | when present, R2 holds outbound |
| `last-move-fired.txt` | R2 | tracks last plan-day fired so R2 doesn't double-fire |
| `plan-start-date.txt` | (you, manually) | YYYY-MM-DD — Day 1 of the plan |

**Set `plan-start-date.txt` BEFORE you turn on R2 for that lead.**

If a state file is missing, the routine treats it as "fresh start." That's
intentional — graceful recovery from accidental deletion.

## Connectors (one-time)

- **Close (CRM):** read activity timeline, send email, send SMS. Authenticated as Andre.
- **Slack:** DM Andre Raw + post to `#andre-system-actions` (whichever you prefer).
- **Google Drive:** read/write the small state files in `cia-state/<alias>/`.

## Hard rules baked into every routine

- Never auto-send anything tagged ESCALATION. R1 detects, marks pause, DMs Andre. R2 sees the pause flag, holds.
- Never auto-send pricing changes, contractual commitments, agreement requests, or hostile-response replies. Always escalate.
- When in doubt, escalate.
- Per-lead escalation rules differ — read each lead's R1 prompt for specifics. Notable example: **Steve Catalano writing directly is ALWAYS escalation, even friendly messages.** That's a rule unique to that lead.

## Adding a third lead later

Once Hugo and Brenda & Steve are running cleanly:

1. Author the third lead's plan + logic + alerts files (or have your other agent generate them).
2. Add an entry to `LEAD_SOURCES` in `bin/_lib.py` and `ACTIVE_BOX_NAMES` so the orchestrator pages render them.
3. Copy `routines/hugo/` (or `brenda-steve/`, whichever shape matches better) into a new `routines/<alias>/` folder.
4. Edit each routine file: swap lead_id, name, drafts, escalation rules, dates.
5. Set up the routines via the same flow.

The structure repeats. 5 active leads = 5 folders = ~15–20 routines total.
Manageable while small. When it gets unwieldy (10+ leads), the right next
step is to make routines lead-agnostic — read lead_id from a config, loop
over all active leads.

## When the close event fires

Each lead's close event is different (Hugo's quote-expiry SMS, B&S's
in-person tasting). After the close event, the lead either books or it
doesn't:

- **Booked:** the active-cadence routines should be turned OFF. Author
  post-close handoff routines (operations team, payment, agreement,
  pre-event coordination). That's a Wave 4 build.
- **Didn't book:** trigger the long-term-nurture cycle. Each lead's plan
  has a fallback path (Hugo: pause to Day 14 with one final SMS; B&S:
  private weekday tasting recovery offer).

Either way: turn off the active routines for that lead before they keep
firing into a closed conversation.

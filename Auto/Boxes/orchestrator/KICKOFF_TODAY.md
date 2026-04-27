# KICKOFF_TODAY.md — Paste-Ready Triggers

Two leads are ready to kick off today (2026-04-27 Monday): **Hugo Casillas**
and **Brenda & Steve Catalano**. Both are whale tier — every send is
gated by André's ack in Slack.

Each block below is a self-contained Cowork session prompt. Open a fresh
Cowork session per lead, paste the prompt, let the session run.

The session will:
1. Read MANUAL_FIRE.md and the comeketo-inbox skill.
2. Read the lead's full substrate.
3. **Ask you**: what's plan_day_1_date for this lead, and are we firing the full 7-day or just from today forward?
4. Set 00_meta.json:active_cadence=true.
5. Schedule one-time fires for every prescribed move from today onward (Day 4, Day 6, etc.) via the scheduled-tasks MCP.
6. Fire today's prescribed move immediately — surface to your DM with `[REVIEW NEEDED]`, wait for ack, send via Close.
7. Append everything to 01_comms.md and post to Slack channels per the reporting matrix.

---

## Plan-day reality check before you paste

Hugo's `09_andre_alerts.md` has Day 1 labeled "Friday — early afternoon."
Steve's has the same. If both were written assuming Day 1 was the
Friday before they were processed (Apr 24), then **today (Mon Apr 27) is
Day 4 for both**.

Day 4 alerts:
- **Hugo** — Day 4 SMS (only-if-no-reply): `"hey hugo — sent you an email Friday with a different idea on the tasting. no rush, just wanted to make sure it didn't get buried. you free to do a quick call wed or thu evening?"`
- **Steve** — Day 4 SMS (only-if-no-reply): `"just bumping this up"` framing, single ask for confirmation.

Both are SMS-only on Day 4 and contingent on no reply. The session
will check Close for any inbound since their respective Day 1 sends.
If a reply was received, it pauses cadence and surfaces `[REPLY DETECTED]`
instead.

If you want to RE-ANCHOR Day 1 to today (Apr 27 Mon) and run the full
fresh 7-day cycle starting now, the session will fire Day 1 instead
(SMS + email pair). Tell the session that when it asks.

---

## Trigger 1 — Hugo Casillas

```
You are running the André Lead Coverage KICKOFF for Hugo Casillas.

Step 1 — Read in order:
  /Users/jakeaaron/Desktop/Auto/orchestrator/MANUAL_FIRE.md
  /Users/jakeaaron/Desktop/Auto/comeketo-inbox/SKILL.md
  /Users/jakeaaron/Desktop/Auto/comeketo-inbox/references/guardrails.md
  /Users/jakeaaron/Desktop/Auto/comeketo-inbox/references/nepq-style.md
  /Users/jakeaaron/Desktop/Auto/.env

Step 2 — Read Hugo's full substrate:
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Hugo Casillas/00_meta.json
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Hugo Casillas/01_comms.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Hugo Casillas/04_profile.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Hugo Casillas/05_seven_day_plan.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Hugo Casillas/06_logic.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Hugo Casillas/08_automations.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Hugo Casillas/09_andre_alerts.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Hugo Casillas/AGENTS.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Hugo Casillas/CLAUDE.md

Step 3 — Validate ready status (all required files present per MANUAL_FIRE.md). Bail with a clear message if anything is missing.

Step 4 — Confirm with the operator (Jake):
  - "What's Hugo's plan_day_1_date? (Suggest: 2026-04-24 Friday based on the plan's Day-1-as-Friday wording. Or pick a fresh anchor today if you want to re-run the full cadence.)"
  - "Fire only the moves from today onward, or re-anchor Day 1 to today and fire the full fresh cycle?"
  - Wait for the answers before proceeding.

Step 5 — Update 00_meta.json: set plan_day_1_date and active_cadence=true. Write atomically (.tmp + rename).

Step 6 — Parse 09_andre_alerts.md. For every prescribed Day-N move from today onward (and the date-anchored alerts: quote-expiry May 1, tasting-prep May 17 if applicable), compute calendar date + time and register a one-time scheduled task via mcp__scheduled-tasks__create_scheduled_task with fireAt=<ISO timestamp>. Each task's prompt is the per-fire template at the bottom of MANUAL_FIRE.md, parameterized with LEAD="Hugo Casillas" and DAY=N.

Step 7 — If today maps to a non-passive plan day:
  a. Run EACE audit per MANUAL_FIRE.md.
  b. If reply detected since last 01_comms.md entry: pause cadence, post [REPLY DETECTED] to SLACK_ANDRE_DM_CHANNEL (D0AMX3BV64T), classify per guardrails, exit.
  c. If audit passes: compose today's draft from 05_seven_day_plan.md, surface to SLACK_ANDRE_DM_CHANNEL with [REVIEW NEEDED] format, capture surface ts.
  d. Wait up to 30 min for ack (👍 reaction or "send" reply).
  e. On ack: re-run audit, fire via Close API, capture acti_*, thread-reply ✅ Fired, mirror to SLACK_TEAM_CHANNEL (C0AV913L1LJ).
  f. Append to 01_comms.md per the standard format, update 00_meta.json:comms_dirty=true.

Step 8 — Post kickoff summary to SLACK_TEAM_CHANNEL:
  "🐋 Cadence kicked off — Hugo Casillas. Day 1 = <date>. <N> future moves scheduled. Today's move: <fired | awaiting ack | passive>. Next: Day <X> on <date> at <time>."

Step 9 — Write run summary to /Users/jakeaaron/Desktop/Auto/orchestrator/state/runs/kickoff_<UTC>_hugo_casillas.json.

Honor every guardrail in comeketo-inbox/references/guardrails.md. When in doubt, ask Jake. Never invent.
```

---

## Trigger 2 — Brenda & Steve Catalano

```
You are running the André Lead Coverage KICKOFF for Brenda & Steve Catalano.

Step 1 — Read in order:
  /Users/jakeaaron/Desktop/Auto/orchestrator/MANUAL_FIRE.md
  /Users/jakeaaron/Desktop/Auto/comeketo-inbox/SKILL.md
  /Users/jakeaaron/Desktop/Auto/comeketo-inbox/references/guardrails.md
  /Users/jakeaaron/Desktop/Auto/comeketo-inbox/references/nepq-style.md
  /Users/jakeaaron/Desktop/Auto/.env

Step 2 — Read Steve's full substrate:
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Brenda & Steve/00_meta.json
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Brenda & Steve/01_comms.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Brenda & Steve/04_profile.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Brenda & Steve/05_seven_day_plan.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Brenda & Steve/06_logic.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Brenda & Steve/07_skills_used.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/Brenda & Steve/09_andre_alerts.md

Step 3 — Validate ready status per MANUAL_FIRE.md.

Step 4 — Confirm with the operator (Jake):
  - "What's Steve's plan_day_1_date? Suggest: 2026-04-24 Friday based on Day-1-as-Friday wording, OR re-anchor today (Mon Apr 27) for a fresh cycle. Steve's tasting is May 3, so the plan's Day 6 (~3 days before tasting) needs to land on Apr 30 Wed regardless of anchor."
  - "Fire only moves from today onward, or re-anchor Day 1 to today?"
  - Wait for answers.

Step 5 — Update 00_meta.json: set plan_day_1_date and active_cadence=true. Atomic write.

Step 6 — Parse 09_andre_alerts.md. Register one-time scheduled tasks via mcp__scheduled-tasks__create_scheduled_task for every prescribed move from today onward, including the date-anchored ones (May 2 if-no-reply, May 3 tasting-day internal alert, May 4 no-show case). Each task's prompt is the per-fire template, parameterized for Brenda & Steve.

Step 7 — If today is a non-passive plan day:
  a. Run EACE audit.
  b. If reply detected: pause cadence, post [REPLY DETECTED] to André's DM, classify, exit.
  c. If audit passes: compose today's draft. Steve's Day 1 prescribes BOTH an SMS (early afternoon) AND an email ~2h later, addressed to Brenda + Steve operator-to-operator. If today is Day 1, surface BOTH drafts as one packet. If Day 4 (today if anchor was Friday Apr 24), surface the single SMS-only Day-4 packet.
  d. Surface to SLACK_ANDRE_DM_CHANNEL with [REVIEW NEEDED]. Wait 30 min for ack.
  e. On ack: re-audit, fire (both pieces if Day 1), append to 01_comms.md, mirror to SLACK_TEAM_CHANNEL.

Step 8 — Post kickoff summary to SLACK_TEAM_CHANNEL:
  "🐋 Cadence kicked off — Brenda & Steve Catalano. Day 1 = <date>. <N> future moves scheduled. Tasting locked May 3. Today's move: <status>. Next: <Day X on date>."

Step 9 — Write run summary to /Users/jakeaaron/Desktop/Auto/orchestrator/state/runs/kickoff_<UTC>_brenda_steve.json.

Honor guardrails. Tasting-fee waiver decision is the strategic reframe per Steve's plan — the kickoff doesn't auto-set it; it's already in Steve's plan body. Make sure the Day-1 send (if Day 1 fires) drops the tasting fee per the operator-to-operator framing.
```

---

## After both kickoffs complete

Run `python3 build.py` from `/Users/jakeaaron/Desktop/Auto/orchestrator/`
to refresh the rendered HTML pages. Today, Dashboard, and the Hugo +
Steve Lead Boxes will reflect the live cadence state.

```bash
cd /Users/jakeaaron/Desktop/Auto/orchestrator
python3 bin/ready_check.py   # verify both are flagged active_cadence=true
python3 build.py             # regenerate HTML
open state/index.html        # check it
```

Both kickoffs operate in parallel. Run them in two separate Cowork
sessions if you want concurrent ack flow, or sequentially if you want
to focus on one before the next. Either works.

# MANUAL_FIRE.md — Trigger-Once, 7-Day-Cadence Playbook

The system runs in **kickoff-then-progress mode**. The operator triggers
each lead's 7-day cadence ONCE. From that trigger, the system fires
Day 1 today and self-schedules every subsequent prescribed move from
that lead's `09_andre_alerts.md`. Each scheduled fire surfaces to
André's DM for ack (whale tier) and posts after ack to Close +
mirrors to the team channel.

The operator does NOT come back daily. Every event reports itself to
Slack as it happens — every send, every ack, every reply detected,
every audit fail, every cadence completion.

This is Wave 2.5 — bridges Wave 2 (orchestrator renders) and Wave 3
(real auto-fire with Close webhook + escalation timer).

---

## How a kickoff actually works

1. Operator opens a Cowork session and runs the kickoff for one lead
   (or several): "Start the cadence for Hugo Casillas" or
   "Kickoff Brenda & Steve."
2. The session reads `Client Boxes/<Name>/` and validates "ready" status.
3. The session sets `00_meta.json:plan_day_1_date = <today>` and
   `00_meta.json:active_cadence = true`.
4. The session reads `09_andre_alerts.md` and parses each prescribed
   move into a calendar event (Day 4 = today + 3 days, Day 6 = today + 5,
   etc.). Skips passive days.
5. The session registers a one-time scheduled task per prescribed move
   via the `scheduled-tasks` MCP. Each task fires at the prescribed
   wall-clock time on the prescribed date. After firing, it auto-disables.
6. The session fires Day 1 immediately — surfaces the draft to André's
   DM with `[REVIEW NEEDED]`. After ack, it sends through Close.
7. The session writes a kickoff summary to `state/runs/`.

From that moment forward, that lead progresses on its own. Day 4
fires on its scheduled date. Day 6 fires on its scheduled date. The
operator's only job is acking each move in Slack as it surfaces.

---

## Definition of "ready"

A lead in `../Client Boxes/<Name>/` is ready to kick off if its folder
contains all of these:

| file | minimum content |
|---|---|
| `00_meta.json` | `lead_id`, `name`, `altitude` (whale / mid / fast), `primary_phone` and/or `primary_email` |
| `01_comms.md` | full historical comms log |
| `04_profile.md` | who they are |
| `05_seven_day_plan.md` | per-day prescribed moves with embedded drafts |
| `09_andre_alerts.md` | day-by-day alert text with explicit times |

Optional but respected:

| file | effect |
|---|---|
| `08_automations.md` | per-lead AUTO.01–11 overrides |
| `10_andre_feedback.md` | operator overrides — supersede plan |
| `AGENTS.md` + `CLAUDE.md` | per-lead Liaison Agent config |

Run `bin/ready_check.py` to list which leads pass / fail. The current
ready list lives in `state/ready_leads.json`.

---

## Plan-day calendar — how the per-Day fires get scheduled

For each Day-N entry in `09_andre_alerts.md`:

1. Parse the day-of-week label (Friday, Monday, Wednesday, etc.).
2. Compute the actual calendar date relative to `plan_day_1_date`:
   `target_date = plan_day_1_date + (N - 1)` calendar days.
3. Parse the time-of-day from the entry's prose ("late morning ~10:30am",
   "early afternoon", "Sunday at 5:30 PM"). Default if absent: 9:00 AM ET.
4. Convert to ISO 8601 with the user's local timezone offset.
5. Register a one-time scheduled task with `fireAt = <ISO timestamp>`.

Steve's plan is a clean example. If kickoff happens today (Mon Apr 27)
and operator confirms Day 1 = today (or any specific day), the
schedule looks like:

```
Day 1 — today, ~13:30 ET — SMS to Brenda + email to both ~2h later
Day 4 — today + 3 days, 10:30 ET — Day 4 SMS only-if-no-reply
Day 6 — today + 5 days, 12:00 ET — pre-tasting confirmation (sends regardless)
Day 7 — today + 6 days — internal prep, no outbound
May 2 (special) — Sat before tasting, 09:00 ET — only-if-no-reply morning text
May 3 (tasting day) — internal alert, no outbound
May 4 (no-show case) — only fires if May 3 no-show detected
```

Hugo's plan if his Day 1 was Apr 24 (so today is his Day 4):

```
Day 4 — TODAY, 10:30 ET — Day 4 SMS only-if-no-reply
Day 6 — Wed, 09:00 ET — Day 6 email only-if-no-reply
Day 7 — Thu — internal, no outbound
May 1 — quote-expiry alert
May 17 — pre-tasting alert (whale tier briefing) IF tasting confirmed
```

For Hugo specifically, since today is Day 4, the kickoff fires the
Day 4 SMS today and schedules Day 6 + the date-anchored alerts. Days
1/2/3 are already in the past; the kickoff doesn't retroactively fire
them. The substrate's `01_comms.md` shows what was historically sent.

---

## Operating contract (read order at every fire)

Every scheduled-task fire (and the kickoff itself) reads these in order:

1. `../comeketo-inbox/SKILL.md` — master inbox skill
2. `../comeketo-inbox/references/guardrails.md` — non-negotiable safety
3. `../comeketo-inbox/references/nepq-style.md` — voice / NEPQ
4. The lead's `00_meta.json`, `01_comms.md`, `04_profile.md`,
   `05_seven_day_plan.md`, `09_andre_alerts.md`
5. The lead's `AGENTS.md` + `CLAUDE.md` if present
6. `../.env` — credentials

Voice = **Andre at ceiling** (`../Staff Boxes/Andre Raw/`). Match it.

---

## Tier handling

Read `00_meta.json:altitude`:

- **whale** — surface to André's DM, wait for ack, fire on ack. Default
  for now. Hugo / Steve / Danielle are all whale.
- **mid** — same as whale (we earn auto-send tier-by-tier).
- **fast** — auto-send after EACE audit; mirror to team channel only.
  Currently nobody is fast.

Default to whale if `altitude` is missing.

---

## EACE audit — runs immediately before every fire

Re-checked at the moment of fire (not the moment of kickoff — state
can drift):

1. **Owner** — Close `custom.cf_xF8FLufgEx9bsijfRAfHhgIrPBQ5ajuohcazC7OtNmT == "01. 😎 Andre"`.
2. **Status** — not Won / Lost / Disqualified / Probably Not / Internal / DNC.
3. **Contact** — phone or email present.
4. **Anti-duplicate** — re-fetch lead's last 10 activities; reject if
   same channel sent in last 6h (SMS) / 12h (email) by anyone.
5. **Reply check** — if any inbound since last `01_comms.md` entry,
   PAUSE the cadence (set `00_meta.json:active_cadence = false`),
   surface `[REPLY DETECTED]` to André's DM with classification
   per `comeketo-inbox/references/guardrails.md`. Do not fire today.
6. **Business hours** — current ET hour in [8, 20]. Otherwise defer
   (re-schedule for next valid window — do not skip).
7. **Language** — match the thread's established language. Default
   English. No auto-Portuguese.
8. **Calendar Reality Check (CRITICAL)** — see
   `comeketo-inbox/references/guardrails.md §3b`. After composing the draft
   and BEFORE surfacing it to André or firing it, re-read the message body
   for every relative date/time reference (`today`, `yesterday`, `Sunday`,
   `Friday`, `this afternoon`, `tonight`, `tomorrow`, `next week`, `last
   week`). For each reference: confirm it resolves to a specific calendar
   moment that matches both today's actual day-of-week AND what actually
   happened in the lead's history. **Bare day-of-week references must be
   replaced with explicit dates** (e.g. "Sunday May 3" not "Sunday"). The
   plans were written days ago with day-of-week labels anchored to their
   authoring day; today's fire date may be different. If a reference is
   ambiguous, stale, or factually wrong, REWRITE it before surfacing — or
   STOP and ask the operator. **This check is non-negotiable.** It's the
   reason Flávia Benson's Day 1 SMS on 2026-04-27 had to be recovered with
   a clarification SMS the same hour. Don't repeat it.

Audit fail → record reason, surface to team channel, move on. Audit
pass → compose and surface to whale operator, or auto-send for fast.

---

## Slack reporting — every event, no exceptions

Slack is the audit log. Every event below posts to Slack. **Critical rule: outbound Slack copy MUST NOT expose the meta-game. No "operator," no "manual fire," no "Jake greenlit," no "MANUAL_FIRE.md" filename references. The system reads as if it's running on its own.** When in doubt: less-is-more, and frame everything in the present tense as if the system is just doing its job.

| event | where | format |
|---|---|---|
| Kickoff started for a lead | team channel | `🐋 Cadence kicked off — <Name>. Day 1 = <date>. <N> moves scheduled.` (no operator/manual language) |
| **7-day plan briefing** (NEW — fires immediately after kickoff) | André's DM | Full day-by-day breakdown of the 7-day plan + what to watch for. See "Plan briefing format" below. |
| Day-N draft surfaced for ack | André's DM | `[REVIEW NEEDED] <Name> — Day <N> — <weekday>` + draft |
| Ack received from André | thread reply on the surface DM | `Acked. Firing now.` |
| Send executed | thread reply + team channel | `✅ Fired — activity_id <acti_*> — <delivery_status>` |
| Reply from lead detected | André's DM (urgent) + team channel | `[REPLY DETECTED] <Name> — "<message preview>" — classified: <type>. Cadence paused.` |
| Audit fail | team channel | `⏭ <Name> Day <N> skipped — <reason>` |
| Send fail | André's DM (urgent) + team channel | `⚠ <Name> Day <N> send failed — <error>. Retrying / escalating.` |
| Cadence completed | team channel | `✅ <Name> 7-day cadence complete. <total> moves fired, <skips>, <replies>.` |
| Tasting reminder (whale tier, T-24h) | André's DM | full whale-tier briefing |
| Quote expiry alert (T-day) | André's DM + team channel | `[QUOTE EXPIRY] <Name> — quote sent <date> — 14d window closes today.` |

### Plan briefing format (fires once per kickoff, to André's DM)

Immediately after a successful kickoff, post a single comprehensive plan briefing to André's DM in this shape:

```
🐋 7-day plan briefing — <Name>

Quick read on the plan so you can flag anything off:

WHO THEY ARE
<2–4 sentence summary from 04_profile.md — who they are, what altitude, what tier of relationship is on the line, voice/tone notes>

WHAT'S HAPPENING

✅ Day 1 — Today (<weekday> <date>) — FIRED at <time> ET (or <FIRING NOW>)
<channel>: <one-line description of move + key intent>

📵 Day 2-3 — <weekdays> — NO OUTBOUND
<reason from the plan — why we're holding>

📱/📧 Day N — <weekday> <date>, <time> ET — <move type>  (only-if-no-reply OR sends-regardless flag)
<the actual draft text or its first line>
You'll get a [REVIEW NEEDED] DM at <time> to ack 👍 before it sends.

(repeat for each prescribed move)

🐋 Date-anchored alerts (if any — quote expiry, pre-tasting briefing, tasting day):
<each one with date/time and what fires>

WHAT TO WATCH FOR
🔔 If they reply, the system pauses the cadence automatically and posts [REPLY DETECTED] to your DM with classification.
🔔 If you don't ack a [REVIEW NEEDED] within 30 min, you'll get a [REMINDER]. The send waits — never goes without your nod.
🔔 <any per-lead specific watch-fors from the plan — Steve emailing direct, fiancée engaging, etc.>
🔔 If anything in this plan doesn't sit right — wrong tone, wrong timing, wrong move — tell Jake. He'll update <Name>'s 05_seven_day_plan.md and the next scheduled fire picks up the change.

Plan source: Client Boxes/<Name>/05_seven_day_plan.md
```

The briefing is André's reference card. He scrolls it once, knows the whole cadence, and can intervene before any fire if he sees something he wants to change.

Channels:
- `SLACK_ANDRE_DM_CHANNEL` = `D0AMX3BV64T`
- `SLACK_TEAM_CHANNEL` = `C0AV913L1LJ`
- `SLACK_LEAD_ENRICHMENT_CHANNEL` = `C0AV98Q9474` (only for enrichment briefs)

Plain-text formatting only. No Slack Block Kit. Emoji as visual
separators.

---

## Compose

For each fire, the move is **already written** in
`05_seven_day_plan.md` for that day. The session's job:

1. Locate today's Day-N block in the plan.
2. Substitute merge fields ({{first_name}}, {{tasting_time}}, etc.)
   from `00_meta.json`.
3. Verify reads in Andre's voice (no template smell).
4. Pre-flight against `comeketo-inbox/references/guardrails.md` —
   especially §3b (Calendar Reality Check), §10 (rich HTML email
   mandate), §10b (NEPQ two-step probe toward call + tasting).

If the plan prescribes both SMS and email for a day, surface them as
ONE packet, ack as a unit, fire both after ack.

### Email rich-HTML render — MANDATORY (per guardrails §10)

Plain-paragraph-wrapped HTML is forbidden. Every email goes through
one of the two bundled renderers:

**Ballpark emails** (precise two-option pricing — e.g. Daphney's $8K/$9.5K
options, Hugo's deluxe-buffet quote, any new lead requesting an itemized
quote):

```python
# 1. Compute the quote
from price_ballpark import build_ballpark
ballpark = build_ballpark(guests=130, options=[
    {"name": "Buffet — $8,000 ceiling", "food_pp": 17.99, "pitch": "..."},
    {"name": "Buffet + Carving — ~$9,500", "food_pp": 20.99, "pitch": "..."},
])

# 2. Render the full email (quote table + tasting card + signature)
from render_email import render_email
html = render_email(ballpark, {
    "client_first_name": "Daphney and Frankie",
    "event_type": "wedding",
    "tasting_date": "Sunday, May 3, 2026",
    "tasting_time": "5:30 PM",
    "tasting_code": "ANDRE",
})
```

**Non-ballpark emails** (resets, soft follow-ups, tasting confirmations,
mid-cadence nudges, post-call wrap-ups — most of our cadence emails):

```python
from render_followup_email import render_followup_email
html = render_followup_email(
    subject="One more thing before the competing quotes come in",
    client_first_name="Hugo",
    body_text=<verbatim plan body>,
    include_tasting_card=True,   # almost always True; False only if a specific tasting is already locked
)
```

The followup template ships the same brand styling (Fraunces / Inter /
JetBrains Mono on parchment) without the quote table. It auto-includes
the current tasting cycle (May 3/17/31), the calculator link band, and
Andre's signature with all contact info.

When firing through Close, send BOTH `body_text` (plain, for clients
that don't render HTML) and `body_html` (the rich rendered version).

---

## Surface format (André's DM)

Plain text packet. Capture the message `ts` for ack tracking.

```
[REVIEW NEEDED] Hugo Casillas — Day 4 — Monday

Last touch: Friday Day-1 email. No reply yet.
Plan move: lowercase SMS, casual, single ask.

Draft:
hey hugo — sent you an email Friday with a different idea on the tasting.
no rush, just wanted to make sure it didn't get buried. you free to do
a quick call wed or thu evening?

Channel: SMS
Recipient: (832) 296-9175 — Hugo Casillas
Close: https://app.close.com/lead/lead_g4AZCOW7Kpc3tithNBrr9aXPbDHsZ72KJUR55Qjzd6f/

To send: react 👍 or reply "send"
To skip: reply "skip <reason>"
To edit: reply with the corrected draft
```

---

## Wait-for-ack — how the scheduled task handles it

The scheduled-task firing wraps a 30-min ack window:

1. Surface the packet (post DM, capture ts).
2. Loop every 15s checking for:
   - 👍 reaction on the DM ts → fire
   - reply containing "send" / "go" / "fire" → fire
   - reply containing "skip" → skip with the operator's reason
   - reply containing the edited draft → re-confirm with operator, then fire
3. Timeout at 30 min → mark `awaiting_operator_ack`, post escalation
   to André's DM, exit cleanly. The next morning's reconciliation run
   picks up the pending ack and re-surfaces.

Escalation pattern: at +30 min, send a `[REMINDER]` DM. At +60, send
to team channel. The operator can ack any time — even hours later.

---

## Fire

After ack:

1. Re-run EACE audit (state can have drifted).
2. POST through Close:
   - SMS: `POST /api/v1/activity/sms/`, `status=outbox`, `local_phone=CLOSE_SMS_FROM_NUMBER`.
   - Email: `POST /api/v1/activity/email/`, `status=outbox`, `sender = "Andre Raw <team@comeketocatering.com>"`.
3. Wait up to 10s for `status: sent`. Capture `acti_*` ID.
4. Thread-reply to the surface DM: `✅ Fired — acti_*`.
5. Mirror to team channel.

---

## Append to substrate (after every fire)

```
### Update — <UTC ISO timestamp>

📱/📧 SMS/Email (Andre → <Name>): "<short preview>"
- activity_id: <acti_*>
- source: cadence_day_<N> via manual-fire
- run_id: <run_id>
- ack_ts: <slack_ts>
```

Append to `01_comms.md`. Update `00_meta.json` with last fire timestamp
and `comms_dirty = true`. Then the orchestrator's next render picks up
the change.

---

## Reply detection (separate scheduled job)

The reply-watch job runs hourly (8a–8p ET) across every active-cadence
lead. For each:

1. Fetch last 10 activities from Close.
2. Find any inbound activity newer than the lead's last
   `01_comms.md` entry.
3. If found: classify per
   `comeketo-inbox/references/guardrails.md` (call_time_given /
   tasting_interest / pricing_question / not_interested / soft_reply /
   manual_review).
4. Set `00_meta.json:active_cadence = false`, append the reply to
   `01_comms.md`, and surface `[REPLY DETECTED]` to André's DM.
5. Cancel any future scheduled fires for that lead (delete pending
   one-time scheduled tasks).

A paused cadence does not auto-resume. Operator manually clears the
flag if appropriate.

---

## End-of-day reconciliation (8:30 PM ET)

A daily job runs end-of-day to:

1. Roll up the day's events: fires executed, replies detected, audit
   skips, pending acks rolled over.
2. Post one consolidated summary to the team channel.
3. Refresh `state/master_ledger.csv` and `state/dashboard.json`
   (AUTO.10 + AUTO.11).
4. Re-render the orchestrator's HTML pages (`python3 build.py`).

This is the "did the system actually work today" report.

---

## Run summary (per kickoff and per fire)

Every kickoff and every scheduled fire writes to `state/runs/`:

```json
{
  "run_type": "kickoff" | "fire" | "reply_check" | "end_of_day",
  "run_id": "fire_2026-04-27T15:30:00Z_hugo_day4",
  "lead": "Hugo Casillas",
  "lead_id": "lead_g4AZCOW7Kpc3tithNBrr9aXPbDHsZ72KJUR55Qjzd6f",
  "started_at": "...",
  "ended_at": "...",
  "outcome": "fired" | "skipped" | "paused_reply" | "awaiting_ack" | "failed",
  "draft": { "channel": "sms", "preview": "..." },
  "audit_results": { "owner": true, "status": true, ... },
  "slack_surface_ts": "1777136912.123456",
  "slack_ack_ts": "1777137105.789012",
  "close_activity_id": "acti_*",
  "delivery_status": "sent",
  "comms_appended": true,
  "errors": []
}
```

---

## Trigger prompt — paste this to kickoff a lead

Replace `<Lead Folder Name>` with the actual folder under `Client Boxes/`
(e.g. `Hugo Casillas` or `Brenda & Steve`).

```
You are running the André Lead Coverage KICKOFF for <Lead Folder Name>.

Step 1 — Read the operating contract in this order:
  /Users/jakeaaron/Desktop/Auto/orchestrator/MANUAL_FIRE.md (this playbook)
  /Users/jakeaaron/Desktop/Auto/comeketo-inbox/SKILL.md
  /Users/jakeaaron/Desktop/Auto/comeketo-inbox/references/guardrails.md
  /Users/jakeaaron/Desktop/Auto/comeketo-inbox/references/nepq-style.md
  /Users/jakeaaron/Desktop/Auto/.env

Step 2 — Read the lead's substrate:
  /Users/jakeaaron/Desktop/Auto/Client Boxes/<Lead Folder Name>/00_meta.json
  /Users/jakeaaron/Desktop/Auto/Client Boxes/<Lead Folder Name>/01_comms.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/<Lead Folder Name>/04_profile.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/<Lead Folder Name>/05_seven_day_plan.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/<Lead Folder Name>/09_andre_alerts.md

Step 3 — Validate ready status. Bail with a clear message if any required file is missing.

Step 4 — Confirm with the operator:
  - "Is plan_day_1_date today (YYYY-MM-DD), or a specific past date?"
  - "Are we firing the FULL 7-day cadence, or only the moves from today onward?"

Step 5 — Set 00_meta.json:plan_day_1_date and active_cadence: true. Write atomically.

Step 6 — Parse 09_andre_alerts.md and compute calendar dates + times for every prescribed move from today onward.

Step 7 — For each future move, register a one-time scheduled task via the scheduled-tasks MCP with fireAt = <ISO timestamp>. The task's prompt is the per-fire prompt below (parameterized for that lead + day).

Step 8 — If today is on the schedule (Day 1 if kickoff is fresh, or the matching Day-N if mid-cadence), fire today's move immediately:
  a. Run EACE audit (per MANUAL_FIRE.md).
  b. Compose draft from the plan.
  c. Surface to SLACK_ANDRE_DM_CHANNEL with [REVIEW NEEDED] format.
  d. Wait for ack (30-min window).
  e. On ack, fire through Close API and append to 01_comms.md.
  f. Mirror to SLACK_TEAM_CHANNEL.

Step 9 — Post a kickoff summary to SLACK_TEAM_CHANNEL:
  "🐋 Cadence kicked off — <Name>. Day 1 = <date>. <N> moves scheduled.
  Next move: Day <X> on <date> at <time>."

  CRITICAL: do NOT use "operator," "manual fire," "greenlit," or any meta-language exposing how the kickoff was triggered. Read as if the system is just running.

Step 10 — Post the 7-day plan briefing to SLACK_ANDRE_DM_CHANNEL using the "Plan briefing format" in the Slack reporting matrix above. Read 04_profile.md, 05_seven_day_plan.md, 09_andre_alerts.md, 00_meta.json, and use them to populate the briefing — day-by-day, channel-by-channel, with what to watch for. This is André's reference card for the whole 7-day arc — write it once, comprehensive but scannable.

Step 11 — Write run summary to state/runs/kickoff_<UTC_timestamp>_<lead_slug>.json.

Honor every guardrail. When in doubt, ask the operator. Never invent.
```

## Per-fire prompt (used by each scheduled task created during kickoff)

This is the prompt template that gets pasted into each one-time
scheduled task created during kickoff. The kickoff substitutes
`{LEAD}` and `{DAY}` per move.

```
You are running the André Lead Coverage scheduled fire: {LEAD} Day {DAY}.

Step 1 — Read:
  /Users/jakeaaron/Desktop/Auto/orchestrator/MANUAL_FIRE.md
  /Users/jakeaaron/Desktop/Auto/comeketo-inbox/SKILL.md
  /Users/jakeaaron/Desktop/Auto/comeketo-inbox/references/guardrails.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/{LEAD}/00_meta.json
  /Users/jakeaaron/Desktop/Auto/Client Boxes/{LEAD}/01_comms.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/{LEAD}/05_seven_day_plan.md
  /Users/jakeaaron/Desktop/Auto/Client Boxes/{LEAD}/09_andre_alerts.md
  /Users/jakeaaron/Desktop/Auto/.env

Step 2 — Verify cadence still active. If 00_meta.json:active_cadence == false, exit silent.

Step 3 — Run EACE audit per MANUAL_FIRE.md. On fail, post to SLACK_TEAM_CHANNEL with reason and exit.

Step 4 — Locate Day {DAY} in 05_seven_day_plan.md. If passive (no outbound), exit silent.

Step 5 — Compose draft. Substitute merge fields from 00_meta.json.

Step 6 — Surface to SLACK_ANDRE_DM_CHANNEL with [REVIEW NEEDED] format. Capture surface ts.

Step 7 — Wait for ack (30-min window — react 👍 or reply "send"). On ack, fire via Close.

Step 8 — Append to 01_comms.md, mirror to SLACK_TEAM_CHANNEL, write run summary.

If no ack within 30 min: post [REMINDER] to SLACK_ANDRE_DM_CHANNEL, mark awaiting_operator_ack, exit. The next end-of-day reconciliation surfaces it.
```

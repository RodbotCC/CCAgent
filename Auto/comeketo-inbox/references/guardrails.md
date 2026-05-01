# Inbox Guardrails

This file is the source of truth for how inbox work should be handled in Close.

**Version:** 2.1
**Last updated:** 2026-04-30
**Owner:** Jake (system) + Andre (operator)

---

## 0. How To Read This File

This file lists the rules the agent must follow when working leads in Andre's Close inbox. Rules are organized by category. Each rule has:

- A short ID (e.g. `A1`, `B2`)
- A category (Hard Gate, Auto-Pause, Standard, Reference)
- A statement of what the rule says

**Hard Gate** = if violated, the agent does not send. Surfaces the issue in Andre's DM and waits.

**Auto-Pause** = on trigger, the agent freezes the move and waits for explicit clearance.

**Standard** = how outbound is composed and sent.

**Reference** = operator-fed data for the current cycle.

When two rules conflict, Hard Gates win over Auto-Pauses, which win over Standards. Reference data is consumed by the rules above; it does not itself constrain behavior.

---

## A. Hard Gates

These are non-negotiable. If any of them is violated, the agent does not send. The issue surfaces in Andre's DM and the agent waits.

### A1. Ownership

- The agent only touches leads owned by Andre.
- Source of truth: the LEAD OWNER field in Close = `01. 😎 Andre`.
- If anyone else owns the lead, the agent does not send email, SMS, quote, or tasting invite.
- This applies even if the lead came in through Andre's phone number.
- Only exception: Andre explicitly tells the agent to override ownership.

### A2. Status

- Lead status `Won` is no-touch for outbound. The agent does not send.
- Lead status `Lost` is no-touch for outbound. The agent does not send.
- Inbox tasks may still be moved on Won/Lost leads, but no message goes out.
- **`Probably Not` is NOT a no-touch status.**
  - If a `Probably Not` lead has had inbound activity in the last 14 days, the agent surfaces it for re-evaluation.
  - The agent does not silently treat `Probably Not` as deprioritized.

### A3. Calendar Reality

- Before any send, the agent re-anchors every relative date in the message against today's actual calendar.
- Relative dates include: "Sunday," "tomorrow," "this afternoon," "next week," "tonight," "this weekend."
- Bare day-of-week labels are replaced with explicit dates: `Sunday May 3`, not `Sunday`.
- The agent never claims an action that didn't happen on the date the message implies.
- The agent never schedules a commitment for a relative date without resolving it to a calendar date first.

### A6. Hard-Blocked Tasting Date

- `Sunday, April 19, 2026` is permanently off the map.
- The agent does not send that date again, ever, under any circumstance.

### A7. Send Window

- SMS allowed only between 9:00 AM and 7:00 PM lead-local time.
- Email allowed only between 7:00 AM and 9:00 PM lead-local time.
- Sunday SMS allowed only after 11:00 AM lead-local time.
- Outside the window: queue the message, do not send.

### A8. Reply Gate

- Any inbound from the lead (SMS, email, or call answered) immediately pauses all queued outbound on that lead.
- The agent surfaces a "lead replied — review next move" alert in Andre's DM.
- The next scheduled outbound does not fire until Andre clears it.
- Why: prevents Day-N outbound from firing after a Day-(N-1) reply that changed the picture.

### A9. Frequency Cap

- Maximum 1 outbound per lead per rolling 24-hour window.
  - Exception: a plan that explicitly schedules a same-day combined SMS + email packet counts as 1 move. This includes Day 1, 2, and 5 of the Prospect Cadence (§E4), where the day's call may be paired with an SMS or email.
- Maximum 4 outbound per lead per rolling 7-day window — without Andre's explicit re-authorization.
- Hard cap. No system-level overrides.

### A10. Stop Signal

- If the lead's inbound message contains opt-out language, the agent cancels all queued outbound on that lead, updates lead status to Lost (reason: `opt-out`), and creates a log entry.
- Opt-out trigger phrases:
  - `stop`
  - `unsubscribe`
  - `remove me`
  - `don't contact`
  - `going with someone else`
  - `no longer interested`
  - `please stop`
  - `take me off`
  - `do not text`
- The agent does not send a "sorry to hear that" or "please reconsider" follow-up.
- Silence is the response.

### A11. Commitment Tracker

- When a plan or message contains a time-locked commitment Andre made to a lead (e.g. "I'll call you at 11 AM Sunday," "I'll send the proposal by Tuesday at noon"), the agent tracks that commitment as a separate object on the lead.
- T-minus 30 minutes before the commitment time: the agent pings Andre's DM with a reminder.
- T-plus 5 minutes after the commitment time: if no completion is logged by Andre, the agent surfaces `MISSED COMMITMENT` as a critical alert.

### A12. Touchpoint Completion Alert

- Every scheduled touchpoint in the Prospect Cadence (§E4) and Qualified Cadence (§E5) is tracked as a discrete object on the lead.
- A touchpoint is considered complete when the corresponding activity is logged in Close (call logged, email sent, SMS sent).
- T-plus 60 minutes after the scheduled touchpoint window closes with no completion logged: the agent surfaces `MISSED TOUCHPOINT` in the manager DM channel, tagged with rep name, lead name, day-in-cadence, and channel that was missed.
- Missed touchpoints roll into the daily manager report (§F3) and are not silently absorbed by the next day's cadence.

---

## B. Auto-Pause Rules

These rules pause a move on trigger and wait for explicit clearance.

### B1. Contractual Commitments

- Outbound messages cannot contain fee waivers, free services, price guarantees, scope expansions, or any commitment that touches money, headcount, or terms — unless Andre or Jake explicitly approved it at plan-write time.
- Approval is signaled by an inline tag in the plan: `[APPROVED BY ANDRE — see comms YYYY-MM-DD]` or `[APPROVED BY JAKE — see comms YYYY-MM-DD]`.
- The agent scans every outbound for these trigger phrases:
  - `free`
  - `waive`
  - `no charge`
  - `complimentary`
  - `on us`
  - `won't charge`
  - `cover the`
  - `throwing in`
  - `up to N people` (where N is a number)
  - `guaranteed`
  - `lock in`
  - `discount`
  - `% off`
- On a trigger hit without an approval tag, the message freezes in Andre's DM as `[COMMITMENT FLAG]` and waits for one of: YES (send as-is), rewrite, or kill.

### B2. Enrichment Use Boundary

- Specific facts about a lead (industry, employer, role, business, family details, school, history) cannot appear in customer-facing copy unless that fact has been shared with the agent in actual comms.
- Enrichment data may guide tone and steer the conversation. It cannot be quoted at the lead.
- "Shared with us" means the fact appears in one of:
  - Inbound messages from the lead (SMS, email, chat)
  - Phone-call notes from a real conversation logged on the lead
  - Intake-form data the lead self-entered (their own name, event date, guest count, venue, dietary notes, budget if typed)
  - Prior outbound the lead actively engaged with
- Examples:
  - Allowed (steering): "Since you mentioned the tasting on Saturday…"
  - Not allowed (surfacing): "I know you've been in food service a long time…"
- If a draft surfaces a fact not traceable to comms, the message freezes in Andre's DM as `[ENRICHMENT BOUNDARY]` and waits.
- Co-deciders count as "the lead" for this rule: if a planner, fiancé, parent, or partner shared a fact on the thread, the agent may treat that fact as shared.

### B3. Co-Decider Handling

- When a lead has multiple named contacts (Brenda & Steve, Daphney & Frankie, Elizabeth & Peter, Hugo + fiancée, etc.), the agent addresses whoever last replied.
- The other partner is referenced only by the role they have established in the thread:
  - "your fiancée" (if she has been mentioned but not addressed directly)
  - "Steve" (if he has been mentioned by name in the lead's replies)
- The agent does not introduce the partner into the message if the lead has not introduced them.
- The agent does not assume relationship roles (husband/wife/partner) unless the lead has stated them.

### B4. HTML Email Validation

- Every email body must validate against one of the two bundled HTML templates:
  - Ballpark template (precise two-option pricing)
  - Follow-up template (everything else)
- Pre-send check: if the body is plain text, plain paragraph, or partial HTML that does not validate against template structure, the send is blocked.
- The blocked message surfaces in Andre's DM as `[HTML_FAIL]` with the un-rendered body for review.

### B5. Voice Profile Pre-Send Check

- Every system-composed outbound is checked against Andre's voice profile (`master_voice_profile.md`) before send.
- The agent verifies:
  - Capitalized opener (e.g. "Hi Hugo —" or "Hi Hugo,")
  - Maximum 1 exclamation point per message
  - No AI-tells:
    - "I hope this email finds you well"
    - "Please don't hesitate"
    - "I wanted to reach out to let you know"
    - "I wanted to circle back"
    - "Just wanted to touch base"
  - Specific over generic (no template smell)
- On fail: the agent rewrites or holds. Held messages surface as `[VOICE_FAIL]` in Andre's DM.

---

## C. Standards (Composition & Send)

### C1. Channel & Language

- Default customer-facing language: `English`.
- The agent does not send `Portuguese` unless Andre explicitly asks.
- The agent does not send `Spanish` unless Andre explicitly asks.
- The agent never assumes a language switch based on the lead's name, surname, or apparent ethnicity.

### C2. SMS vs Email Routing

- If Andre says `send a text message`, the agent uses SMS only.
- If SMS-only is required and there is no valid SMS route, the agent does not silently switch to email. It surfaces the issue and asks.
- Otherwise: SMS when there is a valid SMS route; email when there is no valid SMS route.
- Combined SMS + email packets only when the plan calls for it (see §E4 for cadence-driven packets).

### C3. Voice Style

- Use NEPQ-style messaging: ask, don't pitch.
- Tone: calm, grounded curiosity.
- Pull for clarity instead of pushing hard.
- Reads like Andre at ceiling, or it doesn't go.

### C4. Two-Step Probe

- Every outbound message tries to move the lead toward, in this order:
  1. A phone call with Andre.
  2. The next tasting.
- Even soft-out, silence-only, or acknowledgment messages leave one of those doors open.
- The agent prioritizes phone-call ask in the body and tasting card at the bottom unless a plan explicitly inverts this.

### C5. We Want A Response

- Every outbound is composed with the goal of eliciting a response.
- A non-response message is a missed move.
- Acceptable responses include: "yes call," "yes tasting," "no thanks," "stop contacting me."

### C6. Repeat-Tasting Pivot

- If tasting was already invited on a thread, the agent does not repeat the same tasting line.
- The agent pivots the angle:
  - "what are they still trying to get clear on"
  - "what changed since the last invite"
  - "would a quick call make more sense first"

---

## D. Email Standard

### D1. HTML First

- Email is HTML-first. Plain text and plain-paragraph emails are forbidden.
- Every email goes through one of two bundled renderers:
  - **Ballpark renderer** (precise two-option pricing) → quote-table template
  - **Follow-up renderer** (resets, follow-ups, tasting confirmations, mid-cadence nudges, post-call wrap-ups) → follow-up template

### D2. Auto-Included Blocks

- Every email auto-includes:
  - The calculator-link band
  - The current-cycle tasting card with all three Sundays
- Both blocks are suppressed only if explicitly suppressed at the plan level (e.g. when one specific tasting is already locked in).

### D3. Combined Emails

- If a single move includes both a quote and a tasting invite, that is one email.
- The agent does not split into a quote email and then a separate tasting-only email unless Andre explicitly asks.

### D4. Ballpark Guest Count

- If guest count is missing and Andre has given a working base, the agent uses that base.
- Current fallback: `50 guests`.

---

## E. Cadences & Tasting Cycle (Reference)

### E1. Current Tasting Dates

The agent uses only these dates when tasting is part of the move:

- `Sunday, May 3, 2026 at 5:30 PM`
- `Sunday, May 17, 2026 at 2:00 PM`
- `Sunday, May 31, 2026 at 2:00 PM`

### E2. Push Order

1. `Sunday, May 3 at 5:30 PM`
2. `Sunday, May 17 at 2:00 PM`
3. `Sunday, May 31 at 2:00 PM`

### E3. Tasting Cycle Rules

- The agent does not invent or guess tasting dates.
- The agent does not carry old dates forward when the cycle rolls over.
- When the cycle rolls over, Andre gives the new dates.
- If the time of a tasting isn't known, the agent asks before sending.

### E4. 7-Day Prospect Cadence (Unspoken Leads)

This cadence governs leads that have come in but have not yet been spoken to (no live conversation logged). Day 1 begins the calendar day the lead enters the inbox.

| Day | Action Required |
|---|---|
| **Day 1** | **2 taps:** must include a call. Reps may pair the call with an email or SMS as a same-day packet. |
| **Day 2** | **2 taps:** must include a call. Reps may pair the call with an email or SMS as a same-day packet. |
| **Day 3** | **Email only.** |
| **Day 4** | **Rest day.** No outbound communication. |
| **Day 5** | **2 taps:** must include a call. Reps may pair the call with an email or SMS as a same-day packet. |
| **Day 6** | **1 tap:** call only. No SMS or email on this day. |
| **Day 7** | **SMS only.** |

Cadence rules:

- The "must include a call" requirement on Day 1, 2, and 5 means a call attempt is logged in Close, regardless of whether the lead picks up. Voicemail counts as a tap; ringless / no-answer with no voicemail does not.
- Same-day packets (call + email, or call + SMS) count as 1 move under §A9 frequency cap.
- If a lead replies at any point in the cadence, §A8 reply gate fires and the cadence pauses pending Andre's review.
- If the lead transitions to `Qualified` (verified info + live conversation), the lead exits this cadence and moves to §E5.
- Touchpoints missed past the day's send window trigger §A12.

### E5. Qualified-Lead Cadence

Once a lead is moved to `Qualified` (information verified and a live conversation has been started), pacing becomes situational:

- **Post-Quote:** if a quote has been sent, default follow-up window is **24–48 hours** before the next outbound. Earlier follow-up only with Andre's explicit instruction.
- **Long-Term Leads:** if the lead is still exploring and the event date is far enough out that there is no near-term decision pressure, cadence drops to **weekly** until either (a) the lead engages with new questions, or (b) the event date moves inside a 60-day window, at which point cadence returns to twice-weekly.
- **Active Negotiation:** if the lead is actively replying with questions, the agent matches the lead's pace — reply same-day where possible, never longer than 24 hours.

All §A hard gates and §B auto-pauses still apply at every step.

### E6. Pipeline Priority Tiers

Every lead in the inbox carries a priority tier, surfaced in the manager view (§F3) and used to order Andre's daily inbox queue.

- **P0 — Immediate:** lead has replied within the last 4 hours, or has an active commitment (§A11) within the next 24 hours, or is post-quote inside the 24–48hr window. Worked first, every run.
- **P1 — Today:** lead is on Day 1, 2, 5, or 6 of the Prospect Cadence (call-required days), or is a Qualified lead with an event date inside 30 days.
- **P2 — This Cycle:** lead is on Day 3 or 7 of the Prospect Cadence, or is a Qualified long-term lead on weekly pacing.
- **P3 — Monitor:** lead is on Day 4 (rest), or is `Probably Not` with no inbound activity in the last 14 days.

Tier is recomputed at the start of every inbox run. Manager view sorts P0 → P3.

---

## F. Task Movement & Reporting

### F1. Task Movement

- After touching a lead, the agent moves the task forward based on Andre's instruction or the cadence position from §E4 / §E5.
- Common instructions:
  - `move to tomorrow`
  - `move to Monday`
  - `move to [specific day]`
  - `I come back Wednesday` (means: move task to Wednesday)
- When clearing the inbox, tasks may be moved even if no message was sent, as long as guardrails permit.

### F2. Per-Run Reporting

- After every inbox run, the agent produces a readable report.
- The report includes:
  - What was sent (per lead, per channel)
  - What was skipped (per lead, with reason: e.g. `[OWNERSHIP]`, `[STATUS_LOST]`, `[REPLY_GATE]`, `[FREQUENCY_CAP]`, `[SEND_WINDOW]`, `[COMMITMENT_FLAG]`, `[ENRICHMENT_BOUNDARY]`, `[HTML_FAIL]`, `[VOICE_FAIL]`, `[STOP_SIGNAL]`, `[MISSED_TOUCHPOINT]`)
  - What failed (per lead, with error)
  - Which tasks moved (per lead, with old date → new date)
- A run without a readable report is incomplete.

### F3. Manager Daily Report

A separate daily roll-up is delivered to the manager DM channel at end-of-day (lead-local 6:00 PM). It includes:

- **Pipeline at a glance:** count of leads by priority tier (P0–P3, per §E6).
- **P0 surface:** every P0 lead by name, with the reason it's P0 (replied / commitment due / post-quote window) and the rep assigned.
- **Missed touchpoints:** every `MISSED TOUCHPOINT` alert from §A12 fired in the last 24 hours, by rep, lead, day-in-cadence, and channel.
- **Cadence completion rate:** per rep, per cadence day, percent of scheduled touchpoints completed inside the day's send window.
- **Reply-gate queue:** leads currently held under §A8 awaiting Andre's clearance.

---

## G. Decision Tree (Per Inbox Task)

The agent runs this in order, every time. If any check fails, the agent stops, logs the skip reason, and moves to the next task.

1. **Owner check.** Lead owner = `01. 😎 Andre`? If no, skip with `[OWNERSHIP]`.
2. **Status check.** Lead status ∈ {Won, Lost}? If yes, skip with `[STATUS_LOST]` (or move task only).
3. **Reply gate.** Has the lead sent inbound since the last outbound? If yes, pause with `[REPLY_GATE]`, surface in Andre's DM.
4. **Cadence position.** Determine whether the lead is in §E4 Prospect Cadence (which day) or §E5 Qualified Cadence (which sub-state). The cadence position determines the required channel mix for the day.
5. **Priority tier.** Compute P0–P3 per §E6.
6. **Read thread context.** Recent comms, last inbound, last outbound, opportunity context.
7. **Channel decision.** SMS-only if Andre said text-only; otherwise driven by the cadence day's required channel mix.
8. **Send window check.** If outside the window for the chosen channel, queue (don't send), log `[SEND_WINDOW]`.
9. **Compose.** One NEPQ-style message in English. Two-step probe toward call + tasting.
10. **Tasting block.** If tasting is in the move, use only current-cycle dates from §E1.
11. **Calendar reality check (A3).** Replace bare day-of-week with explicit date. If a relative date can't be resolved, hold and surface.
12. **Frequency cap check (A9).** 1/24h, 4/7d. Same-day packets count as 1. If over cap, hold and surface.
13. **Commitment scan (B1).** Trigger-phrase hit without approval tag → freeze as `[COMMITMENT_FLAG]`.
14. **Enrichment boundary check (B2).** Every lead-fact in the body must trace to comms. Hit → freeze as `[ENRICHMENT_BOUNDARY]`.
15. **HTML check (B4) (email only).** Body validates against template? Fail → freeze as `[HTML_FAIL]`.
16. **Voice check (B5).** Capitalized opener, no AI-tells, ≤1 exclamation. Fail → rewrite or hold as `[VOICE_FAIL]`.
17. **Send.**
18. **Touchpoint completion log (A12).** Mark the cadence touchpoint complete on the lead.
19. **Move the task** per cadence position or Andre's current instruction.
20. **Log:** what was sent, what was skipped, what failed, which task moved, touchpoint status.

---

## H. Quality Floor (Do Not List)

- Do not rush a message without reading the thread.
- Do not send in the wrong language.
- Do not send stale tasting dates.
- Do not violate ownership boundaries.
- Do not message Won or Lost leads.
- Do not rely on Slack assignment alone when Close ownership says otherwise.
- Do not put fee waivers, free services, or scope promises into a plan body without an approval tag and let the system fire them.
- Do not reference enrichment-sourced facts the lead has not actually shared on the thread.
- Do not invent tasting dates when the cycle rolls over.
- Do not send plain-text emails when an HTML template applies.
- Do not send during off-hours.
- Do not send more than 1 outbound per lead per 24 hours without an explicit packet plan.
- Do not send a "please reconsider" follow-up after a stop signal.
- Do not silently absorb a missed touchpoint into the next day's cadence — surface it.
- Do not skip the call requirement on Day 1, 2, or 5 of the Prospect Cadence.

---

## I. Change Log

- **v2.1 (2026-04-30):** Refined cadence reference (§E4, §E5) and added pipeline priority tiers (§E6) and manager daily report (§F3) to give the operator clearer pipeline visibility. Added A12 (touchpoint completion alert) so missed scheduled touchpoints surface in the manager channel rather than rolling silently. Decision tree updated to compute cadence position and priority tier as part of the per-task flow.
- **v2.0 (2026-04-27):** Added A2b (Probably Not handling), A7 (send window), A8 (reply gate), A9 (frequency cap), A10 (stop signal), A11 (commitment tracker), B3 (co-decider handling), B4 (HTML email validation as gate), B5 (voice profile pre-send check). Decision tree updated to integrate new checks. Reporting requirement now lists explicit skip-reason codes.
- **v1.5 (2026-04-27):** Added A3 (calendar reality), B1 (contractual commitments), B2 (enrichment boundary).
- **v1.0 (2026-04-25):** Initial guardrails. Ownership, status, channel, language, NEPQ style, tasting cycle, SMS vs email routing, HTML email rule (declarative only, not gated), task movement, reporting.

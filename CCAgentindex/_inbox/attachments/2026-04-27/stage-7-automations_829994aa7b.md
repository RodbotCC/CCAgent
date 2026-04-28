---
name: stage-7-automations
description: Stage 7 of the Comeketo Client Intelligence Agent. The live operations layer. Comms append loop (the system heartbeat), outbound Slack mirror (audit trail for Andre), plan-driven Andre alerts (timely action prompts), and blowout-prevention escalation tiers. Use this skill when wiring the system to actually run — every time Close gets new activity, every time the system sends something through Close, and every time the 7-day plan says Andre needs to act.
---

# Stage 7 — Automations (live ops)

The intelligence is built across Stages 1–6. Stage 7 keeps it alive.

## Sub-stage 7A — Comms append loop (the heartbeat)

- **Trigger.** Webhook from Close (preferred) or 5–10 min poll during
  business hours, 30–60 min off-hours.
- **Action.** For every active lead, detect new activity since the last
  append (by activity ID or timestamp). Append to
  `clients/<lead_id>/01_comms.md` under a header
  `### Update — <UTC ISO>`. NEVER overwrite.
- **Side effect.** Update ledger:
  `last_comms_append_utc = <now>`, `comms_dirty = true`. The
  `comms_dirty` flag is the Liaison Agent's wake-up trigger.

## Sub-stage 7B — Outbound Slack mirror (audit trail)

- **Trigger.** Every time the system sends anything through Close (SMS,
  email, task creation, status change, opportunity update, fee waiver).
- **Channel.** `#andre-system-actions` for normal sends; DM for whale-tier
  or critical sends.
- **Payload.** Lead name + Close link, what was sent (channel + full
  text), why (which day/which off-ramp triggered), voice used, whether
  to expect a reply.
- **Reaction handling.** Andre reactions log back to
  `clients/<lead_id>/09_andre_feedback.md`:
  - 👍 = good
  - 👎 = flag for review
  - text reply = intervene
- **Throttling.** Whale + strong leads get per-action notifications.
  Standard + soft leads get a `#andre-batch-digest` summary every 2 hours.
  Andre's attention is finite; alert fatigue kills the system.

## Sub-stage 7C — Plan-driven Andre alerts (timely action prompts)

- **Trigger.** Stage 5 plan says "Andre needs to do X by time Y" — call,
  attend tasting, sign agreement, show up for venue tour.
- **Tiering.**
  - **Critical** (call in 30 min, tasting today): immediate, plus
    secondary alert 2 hours before.
  - **Same-day** (call this afternoon): morning briefing.
  - **Multi-day window** (this week): weekly Monday briefing.
- **Payload.** Lead name + altitude, the action, the 2-3 sentence
  "what to lead with" extracted from the plan, links to profile + plan +
  recent comms.
- **Snooze + confirm.** Andre buttons: "got it" / "snooze 1hr" / "done"
  / "blocked, here's why."

## Sub-stage 7D — Blowout-prevention layer

- Detects when a high-stakes action (whale lead, agreement-ready signal,
  post-tasting moment) has been alerted but Andre has not acknowledged
  within tolerance.
- **Tier 1 escalation.** No ack 30 min after critical alert →
  second alert.
- **Tier 2 escalation.** No ack 60 min after critical alert →
  ping operator (you / Rhonna / second seat).
- **Tier 3 escalation.** No ack 2 hours after critical alert on a
  whale → escalate via phone or whatever the operator-defined emergency
  channel is.
- **Pattern logging.** Every blowout (acknowledged late or missed)
  logs to `state/blowouts.csv`. Patterns inform future alert timing
  and channel choice.

## Slack channel design

| channel                    | audience    | content                              |
|----------------------------|-------------|--------------------------------------|
| Andre DM                   | Andre       | critical alerts, whale moves, escalations |
| #andre-system-actions      | Andre       | every outbound the system shipped (audit trail) |
| #andre-batch-digest        | Andre       | every-2-hours summary of low-signal sends |
| #system-health             | operator    | errors, ledger gaps, auth failures   |

## Andre overrides from Slack (the command line)

- Reply "kill this lead" → pause cadence, mark, ask for reason.
- Reply "don't text her, call her instead" → update plan, ping
  suggested call slot.
- Reply "she replied — she's in for May 17" → log verbal confirmation,
  shift to close-mode.

## The Liaison Agent (the per-client subagent)

`clients/<lead_id>/AGENTS.md` and `CLAUDE.md` configure a Liaison Agent
that wakes up whenever `comms_dirty == true` for that lead. It:

1. Re-reads `01_comms.md` (latest state — the perception layer).
2. Re-reads `04_profile.md` and `05_seven_day_plan.md` (worldview + plan).
3. Decides: does the plan still hold? Which off-ramp activated? Is a
   plan-redesign trigger present?
4. If a move is due, calls the appropriate Tier 1 skill (with Tier 2
   profile + Tier 3 voice composed in).
5. Outputs the move + the audit-trail Slack notification + ledger update.
6. Sets `comms_dirty = false` until the next append.

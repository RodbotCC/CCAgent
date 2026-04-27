# Inbox Guardrails

This file is the source of truth for how inbox work should be handled in Close.

## 1. Channel And Language

- Default customer-facing language is `English`.
- Do not send `Portuguese` unless André explicitly asks for Portuguese.
- Do not send `Spanish` unless André explicitly asks for Spanish.
- Never assume a language switch just because the lead appears Brazilian, Portuguese-speaking, or Spanish-speaking.

## 2. Ownership Guardrail

- Only touch leads that are clearly owned by André.
- Ownership source of truth:
  - if the lead owner field says `01. 😎 Andre`, treat it as André-owned.
- If the lead is not André-owned:
  - do not send email
  - do not send SMS
  - do not send quote
  - do not send tasting invite
- Only exception:
  - André explicitly tells you to override ownership and send anyway.

## 3. Status Guardrail

- If the lead status is `Won`, do not send a message.
- If the lead status is `Lost`, do not send a message.
- `Won` and `Lost` are no-touch statuses for outbound messaging.
- If clearing inbox only, tasks may still be moved, but messaging guardrails still apply.

## 3b. Calendar Reality Check (CRITICAL — added 2026-04-27)

Before sending ANY message, verify every relative date/time reference against today's actual calendar. This applies to outbound SMS, email, and any auto-rendered draft. **This is the highest-priority pre-send check after ownership and status.**

The check:

1. Compute today's date AND day-of-week.
2. Re-read the message for every relative reference: `today`, `yesterday`, `this morning`, `this afternoon`, `tonight`, `tomorrow`, `Sunday`, `Monday`, `Friday`, `this Sunday`, `next week`, `last week`, `recently`.
3. For each reference: confirm it resolves to a specific calendar moment that (a) matches what actually happened in the lead's history, and (b) reads unambiguously to the recipient.
4. Flag and rewrite if any of the following is true:
   - The reference points to a day-of-week that doesn't match today's reality (e.g., message says "this afternoon" but it's morning; says "Sunday" with no anchor for which Sunday).
   - The message claims an action ("I tried calling you today", "I missed you yesterday") that did not actually happen on the date the message implies.
   - A bare day-of-week appears where a specific date would remove ambiguity ("Sunday" → "Sunday May 3").
   - The plan was written assuming a different anchor day-of-week than today's actual day.
5. When in doubt, replace the bare day-of-week with the explicit calendar date (`Sunday May 3`, `Monday Apr 27`, `Tuesday`).
6. NEVER ship a message claiming an action that did not happen on the claimed date.

**Why this matters.** Comeketo 7-day plans are written days before the lead actually receives the message. Day-of-week labels in plan bodies are anchored to the plan's authoring day, not the firing day. If the plan said "Day 1 — Today (Friday)" and the kickoff actually fires on Monday, every "Friday/Sunday" reference in the body needs to be re-anchored. A bare "Sunday at 11 AM" sent on Monday reads to the recipient as "this past Sunday" — which has already gone by.

**Real failure case (record):** On 2026-04-27 (Monday), the system fired Flávia Benson's Day 1 SMS as written, which contained "Sunday at 11:00 AM, I'll call you." The plan author intended "this coming Sunday May 3," but the message hit her phone on Monday reading as "this past Sunday" (Apr 26 — already gone). A clarification SMS had to be fired as immediate recovery: "Sorry — to be clear, I meant this coming Sunday, May 3rd at 11:00 AM ET. The commitment stands."

If a reference cannot be cleanly resolved or rewritten, STOP and ask the operator. Do not ship.

## 4. Inbox Working Standard

- Read the recent thread before sending anything.
- Be mindful of:
  - lead ownership
  - lead status
  - the last conversations on the lead
  - the last inbound communication from the client
  - the opportunity context when visible
- The goal is to get the lead:
  - on the phone with André
  - or into the next tasting
- Do not send generic filler.
- Do not guess context.

## 5. Message Style

- Use `NEPQ-style` messaging.
- Ask instead of pitch.
- Use calm, grounded curiosity.
- Pull for clarity instead of pushing hard.
- The message should try to get them to respond, even if the response is:
  - yes to a call
  - yes to a tasting
  - no
  - stop contacting me

## 6. Primary CTA

- The main goal is to get them on the phone with André.
- Tasting is the secondary path unless André says to push tasting harder.
- If they already had tasting mentioned before, do not just repeat the same tasting line.
- If tasting was already invited before, shift the NEPQ angle toward:
  - what are they still trying to get clear on
  - what changed
  - whether a quick call would make more sense first

## 7. Tasting Guardrail

- Tasting dates are operator-fed, not permanently hardcoded.
- Do not assume a month or carry old tasting dates forward.
- Use only the dates André gives for the current cycle.
- If the tasting time is not known, ask before sending.

### Current Tasting Dates

- `Sunday, May 3, 2026 at 5:30 PM`
- `Sunday, May 17, 2026 at 2:00 PM`
- `Sunday, May 31, 2026 at 2:00 PM`

### Current Push Order

1. `Sunday, May 3 at 5:30 PM`
2. `Sunday, May 17 at 2:00 PM`
3. `Sunday, May 31 at 2:00 PM`

### Hard Block

- `Sunday, April 19` is off the map.
- Do not send that date again.

## 8. SMS vs Email

- If André says `send a text message`, use SMS only.
- If SMS-only is required and there is no valid SMS route, do not silently switch to email.
- If SMS-only is not required, the practical fallback is:
  - SMS when possible
  - email when there is no valid SMS route

## 9. Ballpark Quote Rules In Inbox Work

- If the inbox task is a ballpark quote, use the rich HTML quote path.
- Ballpark quotes should include the calculator button.
- If tasting is part of the same next step, use one combined email.
- Do not send one quote email and then a second tasting-only email unless André explicitly asks.
- If guest count is missing and André has given a working base, use that base.
- Current working fallback used in some cases:
  - `50 guests`

## 10. Email Standard

- Email **must be HTML-first using the bundled rich templates**. No exceptions.
- Do not send plain text or plain-paragraph-wrapped emails. The system has dedicated renderers; use them.
- **Two renderers ship with this skill:**
  - `comeketo-inbox/scripts/render_email.py` — for precise two-option ballpark quotes. Uses `assets/ballpark-email.html`. Fed by `price_ballpark.py` for line-item totals.
  - `comeketo-inbox/scripts/render_followup_email.py` — for non-ballpark emails (resets, soft follow-ups, tasting confirmations, mid-cadence nudges, post-call wrap-ups). Uses `assets/followup-email.html`. Same brand DNA without the quote table.
- **Every email** — ballpark or follow-up — automatically includes the calculator link band and (unless explicitly suppressed) the current-cycle tasting card with all three Sunday dates.
- If a quote already includes the tasting invite, that one email is enough.
- If you find yourself building HTML inline in a scheduled-task prompt or composing plain `<p>` paragraphs, STOP — use the renderer.

## 10b. NEPQ Two-Step Probe (added 2026-04-27)

Every outbound message — SMS or email — should probe toward two outcomes, in this order:

1. **Get them on the phone with André.** This is the primary CTA in nearly every plan. A real call is the fastest path to the close.
2. **Get them to the next tasting.** Tasting attendance ≈ booking, in Andre's pipeline math.

A message that asks neither is a message that's missing its job. Even a soft-out / silence-only / acknowledgment message should leave one of these two doors open. The plan body authored by Jake usually does this work; the renderer adds the tasting card automatically as a backup.

When both are mentioned in one email, Andre's standard sequence is:
1. Phone call ask in the body copy
2. Tasting card with the three current Sundays at the bottom

That's the Andre-default unless a plan overrides.

## 11. Task Movement

- After touching a lead, move the task forward based on André's instruction.
- If André says `move to tomorrow`, do that.
- If André says `move to Monday`, do that.
- If André says he comes back on a specific day, move it to that day.
- When clearing the inbox, tasks can be moved even if no message was sent.

## 12. Calendar Guardrail

- If someone agrees to a phone call, that should be surfaced for calendar booking.
- If someone agrees to a tasting and pays, they should be placed into the tasting schedule.
- Tasting attendance is not just a dinner reservation.
- A pre-tasting call is required to set expectations and understand needs.

## 13. Quality Standard

- Do not rush a message without reading the thread.
- Do not send in the wrong language.
- Do not send stale tasting dates.
- Do not violate ownership boundaries.
- Do not message `Won` or `Lost`.
- Do not rely on Slack assignment alone when Close ownership says otherwise.

## 14. Practical Inbox Decision Tree

1. Check ownership.
   - If not André-owned, stop.
2. Check status.
   - If `Won` or `Lost`, stop.
3. Read recent thread context.
4. Decide channel.
   - SMS-only if André explicitly asked for text only.
   - Otherwise use the allowed fallback.
5. Write one NEPQ-style message in English.
6. Use current tasting dates only if tasting is part of the move.
7. Move the task according to André's current instruction.
8. Log what was sent, skipped, failed, and moved.

## 15. Reporting Requirement

- After inbox work, a report should be available.
- The report should include:
  - what was sent
  - what was skipped
  - what failed
  - which tasks were moved
- If the automation runs without a readable report, it is incomplete.

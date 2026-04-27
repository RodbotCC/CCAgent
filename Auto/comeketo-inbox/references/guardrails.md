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

## 10c. Contractual Commitments Hard Gate (CRITICAL — added 2026-04-27)

Plans, drafts, and outbound messages must NOT contain any of the following without explicit per-lead approval from André OR Jake at kickoff time:

- Fee waivers ("free tasting," "no charge," "we'll cover the fee," "fee is on us," "complimentary")
- Free or discounted services ("free upgrade," "no cost," "won't charge you for," "throwing in")
- Price guarantees, ceiling promises, or written rate locks
- Scope expansions ("up to X people, no charge," "covered for the whole party")
- Any commitment that touches money, headcount math, deliverables, or terms

This is a HARD GATE. It does not matter if the plan body says it. It does not matter if a previous draft said it. It does not matter if the move "sounds generous." A plan that includes this language is broken at the source and must be edited before the cadence fires.

### Pre-fire scan (mandatory)

Before composing OR firing any draft, the system scans the plan body and the proposed message for these trigger phrases (case-insensitive, allow leading space / start-of-line):

- `free`, `for free`, `no charge`, `at no cost`, `no fee`, `no cost`
- `waive`, `waiving`, `waived`, `waiver`
- `complimentary`, `comp'd`, `comped`, `on us`, `on me`, `on the house`
- `won't charge`, `won't bill`, `not going to charge`, `won't be charged`
- `cover the`, `covered for`, `we'll cover`, `we're covering`
- `throwing in`, `bonus`, `extra at no`, `add-on at no`
- `up to N people`, `up to N guests`, `for the whole party`, `entire party`
- `guaranteed`, `lock in`, `locked in`, `price hold`, `rate hold`
- `discount`, `% off`, `dollars off`, `$N off`

If ANY trigger phrase appears, the system MUST:

1. STOP the fire pipeline.
2. Post `[COMMITMENT FLAG]` to André's DM with the lead, day, draft text, the matched phrase, and the question: "Is this commitment authorized? Reply YES to authorize and continue, or rewrite the move."
3. Wait for André OR Jake to reply YES (or with a rewritten draft) before proceeding. No 30-minute auto-timeout — this gate does not auto-pass.
4. Log the flag + outcome to `state/runs/`.

The audit applies to BOTH:
- The **plan body** in `05_seven_day_plan.md` (so we catch authoring-time mistakes)
- The **composed draft** about to fire (so we catch substitution-time slips)

If the plan author wants a fee waiver to be part of a 7-day plan, they must write it AFTER getting explicit approval from André in the comms record, and they must note the approval source inline in the plan (e.g. `[APPROVED BY ANDRE — see comms 2026-04-25]`). The audit check looks for this `[APPROVED BY ...]` tag on the same paragraph as the trigger phrase. No tag = blocked.

**Why this matters.** On 2026-04-27 the Brenda & Steve plan contained a verbatim fee-waiver commitment ("waive the tasting fee for the entire party... up to 10 people, no charge") and the system fired it. That's a five-figure scope decision being made by a draft, not by André. We don't make money decisions inside plan bodies. We surface the question, get the answer, then write the plan to reflect what was approved.

### What's allowed

- Inviting them to the standard tasting at the standard rate.
- Mentioning that the tasting fee is credited toward the booking IF that's the actual policy.
- Asking "would a complimentary tasting move you off the fence?" as an EXPLORATORY question to André in his DM — never as language sent to the client.
- Plans that say "if Andre wants to comp this, the move would be X" — that's a CONDITIONAL plan and the audit reads it as such (the conditional language itself is the [APPROVED BY ...] equivalent — Andre still has to greenlight before fire).

## 10d. Enrichment Use Boundary (CRITICAL — added 2026-04-27)

Enrichment-sourced facts (LinkedIn lookups, public records, deep-dive research, anything Jake found that the lead didn't tell us) may NOT be quoted, named, or referenced in any customer-facing message — UNLESS that same fact has already appeared in the lead's own comms with us (`01_comms.md` inbound or a direct verbatim share from the lead).

The system can USE enrichment internally to:
- Steer toward familiar territory ("this lead runs a restaurant — angle the food conversation accordingly")
- Inform tone ("this lead is in a service industry — match the operator-to-operator register")
- Choose what NOT to ask ("don't ask basic logistics they obviously already know")

The system may NOT:
- Name the lead's industry, business, role, employer, school, alma mater, or any specific identifier the lead hasn't volunteered
- Quote facts about the lead that read as "I looked you up" energy
- Open with familiarity that wasn't earned in conversation
- Imply the system has knowledge the client didn't share

### Pre-fire enrichment check (mandatory)

Before firing any draft that references the lead specifically, the system runs:

1. Extract every specific factual claim about the lead from the draft (industry, employer, role, location specifics, family members named, prior events referenced, history claims).
2. For each claim, search `01_comms.md` for evidence the lead — or a sender on their behalf in this thread — has shared this fact in the conversation.
3. If a claim has NO supporting evidence in `01_comms.md`:
   - Flag it as `[ENRICHMENT BOUNDARY]` to André's DM.
   - Show the claim, the draft text, and where it came from (which enrichment file or stage).
   - Ask: "This wasn't shared in comms — should we soften, reword, or kill the line? Reply with the rewrite or 'kill'."
   - DO NOT fire until reply.

### What "shared in comms" means

Acceptable evidence sources, in priority order:
- An inbound text/email from the lead naming the fact directly.
- A note in `01_comms.md` from a phone call where the lead told us.
- A discovery form / intake form the lead filled out themselves.
- An email Andre or someone on the team referenced FIRST that the lead engaged with (the lead acknowledged it back).

Not acceptable as evidence:
- Anything from `02_deep_dive.md`, `03_enrichment.md`, or any research stage file.
- Anything Jake learned from public sources (LinkedIn, business filings, social media, Google).
- "Common knowledge" assumptions ("she's getting married so she must care about X").
- Anything the lead's spouse / partner / planner said unless that person is on the thread.

### Steering vs surfacing

Allowed (steering): "Brenda, since you mentioned the tasting on Saturday — wanted to make sure we lock that down."
Not allowed (surfacing enrichment): "Steve, I know you've been in food service a long time, so I figured you'd appreciate..."

The first uses something the lead actually said. The second references a public-record fact about Steve's career — even if it's true, even if it's flattering, it reads as surveillance. Steve didn't tell us about his industry on this thread. We don't open with it.

**Why this matters.** On 2026-04-27 the Brenda & Steve Day 1 email opened with "Steve, I know you've been in food service a long time" — a fact sourced from enrichment, not from comms. Per Jake's phone-transcript review the fact itself was actually OK because it had been discussed verbally between Andre and Steve. The system, however, could not have known that without scanning the comms record — and the rule needs to enforce against the worst case, not the lucky case. From now on: if it's not in `01_comms.md`, it doesn't go in the draft.

### Apparent override

If André or Jake explicitly tells the system "use this enrichment fact in the message" at kickoff time, the plan author must include `[ENRICHMENT APPROVED — Andre/Jake ok'd this reference]` inline in the plan paragraph that uses the fact. The audit looks for this tag and lets it pass.

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
7. Calendar reality check (§3b) — replace bare day-of-week with explicit date.
8. Contractual commitments scan (§10c) — no fee waivers / free / waive / no charge / etc. without `[APPROVED BY ...]` tag. Hard pause on hit.
9. Enrichment boundary check (§10d) — every specific fact about the lead must trace to `01_comms.md`. Hard pause on hit.
10. Move the task according to André's current instruction.
11. Log what was sent, skipped, failed, and moved.

## 15. Reporting Requirement

- After inbox work, a report should be available.
- The report should include:
  - what was sent
  - what was skipped
  - what failed
  - which tasks were moved
- If the automation runs without a readable report, it is incomplete.

# Comeketo Inbox Guardrails — Working Summary

**As of:** Monday, April 27, 2026
**Source of truth:** `comeketo-inbox/references/guardrails.md`
**Purpose:** This is the discussion doc — read through, mark up, and we'll update the source.

---

## A. Hard Gates — the system will NOT fire if any of these are violated

These are the non-negotiables. If any one of them hits, the system stops, surfaces it to your DM, and waits for you (Andre) or me (Jake) to clear it.

**A1. Ownership.** We only touch leads owned by Andre. Source of truth is the LEAD OWNER field in Close = `01. 😎 Andre`. If anyone else owns it, we don't send email, SMS, quote, or tasting invite — even if the lead came in through Andre's number.

**A2. Status.** Won and Lost leads are no-touch for outbound. We don't message either category for any reason. Inbox tasks can still be moved on a Won/Lost lead, but no message goes out.

**A3. Calendar reality.** Before any send, we re-anchor every relative date in the message ("Sunday," "this afternoon," "tomorrow," "next week") against today's actual calendar. Bare day-of-week labels get replaced with explicit dates ("Sunday May 3" not "Sunday"). We never claim an action that didn't happen on the date the message implies. (This is the rule that came from the Flávia "Sunday at 11 AM" recovery on 4/27.)

**A4. Contractual commitments.** Plans and outbound messages cannot contain fee waivers, free services, price guarantees, scope expansions ("up to 10 people, no charge"), or any commitment that touches money/headcount/terms — UNLESS Andre or Jake explicitly approved it at plan-write time. The system scans for trigger phrases (free, waive, no charge, complimentary, on us, won't charge, cover the, throwing in, up to N people, guaranteed, lock in, discount, % off). On a hit, the move freezes in your DM as `[COMMITMENT FLAG]` and waits for your YES, a rewrite, or a kill. (This rule came from the Brenda & Steve fee-waiver fire on 4/27.)

**A5. Enrichment use boundary.** Specific facts about a lead — their industry, employer, role, business, family details, school, history — cannot appear in customer-facing copy unless that fact has been shared with us in actual comms (`01_comms.md`). Enrichment can guide tone and steer the conversation; it can't be quoted at the lead. Steering says "since you mentioned the tasting on Saturday…"; surfacing says "I know you've been in food service a long time…" — the second reads as surveillance, even when true. If a draft surfaces a fact not in comms, the system freezes as `[ENRICHMENT BOUNDARY]` and waits for your call. (This rule came from the same Brenda & Steve fire on 4/27.)

**A6. Hard-blocked tasting date.** Sunday, April 19 is permanently off the map. Don't send that date again, ever, under any circumstance.

---

## B. Channel and Language

**B1. English by default.** Customer-facing language is English unless you explicitly say switch to Portuguese or Spanish for a specific lead. We never assume a language switch just because the lead has a Brazilian, Portuguese, or Spanish name.

**B2. SMS-only when you say so.** If you tell us "send a text message," we use SMS only. If there's no valid SMS route on that lead, we DON'T silently fall back to email — we surface it and ask.

**B3. Otherwise:** SMS when there's a number, email when there isn't. Combined SMS+email packets when the plan calls for it (one ack, both fire after).

---

## C. Voice and Message Style

**C1. NEPQ-style.** Ask, don't pitch. Calm, grounded curiosity. Pull for clarity instead of pushing hard.

**C2. Two-step probe.** Every outbound message tries to move the lead toward, in this order: (1) a phone call with you, (2) the next tasting. Even soft-out / silence-only / acknowledgment messages leave one of those doors open.

**C3. The default ask order in one email** is: phone-call ask in the body, tasting card with the three current Sundays at the bottom. Plans can override this if there's a reason.

**C4. No generic filler.** No template smell. Reads like Andre at ceiling, or it doesn't go.

**C5. We want a response.** Even if the response is "yes call," "yes tasting," "no thanks," or "stop contacting me." A non-response message is a missed move.

---

## D. Tasting (operator-fed, current cycle)

**D1. Current dates** — these are the only ones the system uses right now:
- Sunday, May 3, 2026 at 5:30 PM
- Sunday, May 17, 2026 at 2:00 PM
- Sunday, May 31, 2026 at 2:00 PM

**D2. Push order:** May 3 first, then May 17, then May 31.

**D3. We don't carry old tasting dates forward.** When the cycle rolls over, you give us the new dates. The system does not invent or guess.

**D4. If the time isn't known, we ask before sending.**

**D5. If tasting was already invited on a thread,** we don't repeat the same line. We pivot the angle — "what are they still trying to get clear on," "what changed," "would a quick call make more sense first."

---

## E. Email Standard

**E1. HTML rich-template is mandatory.** Plain text and plain-paragraph emails are forbidden. Every email goes through one of two bundled renderers:
- Ballpark quotes (precise two-option pricing) → uses the quote-table template.
- Everything else (resets, follow-ups, tasting confirmations, mid-cadence nudges, post-call wrap-ups) → uses the follow-up template.

**E2. Every email auto-includes** the calculator link band and the current-cycle tasting card with all three Sundays — unless explicitly suppressed (e.g. when one specific tasting is already locked in).

**E3. Combined emails.** If the move includes both a quote and a tasting invite, that's ONE email. We don't split into a quote email and then a separate tasting-only email unless you explicitly tell us to.

---

## F. Ballpark Quote Rules

**F1. Ballpark = the rich HTML quote path.** Always.

**F2. Calculator button required** on every ballpark.

**F3. Tasting + quote in one email** if both are part of the same next move.

**F4. If guest count is missing** and you've given us a working base, we use it. Current fallback: 50 guests.

---

## G. Operating Standard

**G1. Read the thread first.** Lead ownership, lead status, recent conversations, last inbound, opportunity context — all read before composing. No guessing context.

**G2. Get them on the phone or into the next tasting.** Phone is primary, tasting is secondary — unless a plan flips it.

**G3. Move the task per your instruction.** "Move to tomorrow," "move to Monday," "I come back Wednesday" — that's what we do.

**G4. When clearing the inbox, tasks can still be moved** even on leads where guardrails block messaging.

**G5. After every fire, log it.** What was sent, what was skipped, what failed, which tasks moved. If the system runs without a readable report, the run is incomplete.

---

## H. Quality Floor (the "do not"s)

- Don't rush a message without reading the thread.
- Don't send in the wrong language.
- Don't send stale tasting dates.
- Don't violate ownership boundaries.
- Don't message Won or Lost leads.
- Don't rely on Slack assignment alone when Close ownership says otherwise.
- Don't put fee waivers / free services / scope promises into a plan body and let the system fire them — those go through you.
- Don't reference enrichment-sourced facts the lead hasn't actually shared on the thread.

---

## I. The Decision Tree (per inbox task)

1. Owner = Andre? If no, stop.
2. Status = Won or Lost? If yes, stop.
3. Read recent thread context.
4. Channel: SMS if you said text-only; otherwise SMS-or-email by route.
5. Compose one NEPQ-style message in English.
6. Use only the current tasting dates if tasting is in the move.
7. Calendar reality check — replace bare day-of-week with explicit date.
8. Contractual commitments scan — no fee waivers / free / waive / etc. without `[APPROVED BY ...]` tag. Hard pause on hit.
9. Enrichment boundary check — every lead-fact must trace to comms. Hard pause on hit.
10. Move the task per your instruction.
11. Log what was sent, skipped, failed, and moved.

---

## J. What's New This Cycle (added 4/27)

- §3b — Calendar reality check (post-Flávia)
- §10 — HTML email mandatory (post-Andre's screenshot directive)
- §10b — Two-step probe toward call + tasting
- §10c — Contractual commitments hard gate (post-Brenda & Steve)
- §10d — Enrichment use boundary (post-Brenda & Steve)

---

## K. Open Questions for Andre

These are the things I'd want your read on before we lock further:

1. **§10c trigger list.** Does the trigger-phrase set feel right, or are there phrases you'd add (e.g. "throw in a chef station," "include the bartender at no extra")? Anything you'd remove because it kills too many legitimate moves?

2. **§10c override mechanic.** Right now the override is an inline `[APPROVED BY ANDRE — see comms 2026-04-25]` tag in the plan paragraph. Is that the right friction level, or do you want a separate per-lead approval ledger?

3. **§10d evidence sources.** I list inbound messages, phone-call notes, intake forms, and prior outbound the lead engaged with. Is there anything else that should count as "they've shared this with us"? Specifically — should a planner / fiancé / parent on the thread count as the lead sharing it, or only the named lead?

4. **§10d steering vs surfacing line.** The example I'm using is "since you mentioned the tasting on Saturday" (allowed) vs "I know you've been in food service a long time" (not allowed). Are there gray-zone cases you want me to call out?

5. **§D push order.** Is May 3 → May 17 → May 31 still the right order, or has anything shifted in the last week?

6. **§F4 guest count fallback.** 50 guests is the current default. Want to change it, or is it good?

7. **§A2 status list.** Right now we only block Won and Lost. Do you want us to also block "Probably Not," "Disqualified," or any other status from outbound — or keep the gate tight at Won/Lost?

---

When you've marked it up, send it back and I'll fold the changes into the canonical `guardrails.md` and refresh the audit gates.

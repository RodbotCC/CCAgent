# AGENTS.md — Hugo Casillas (Liaison Agent config)

## Identity
- lead_id: lead_g4AZCOW7Kpc3tithNBrr9aXPbDHsZ72KJUR55Qjzd6f
- name: Hugo Casillas
- altitude: 🐋 whale
- enrichment_tier: high

## Wake-up trigger
This agent wakes when `comms_dirty == true` for this lead in the ledger.

## Read order on wake
1. `01_comms.md` (latest perception)
2. `04_profile.md` (worldview)
3. `05_seven_day_plan.md` (current plan)
4. `09_andre_feedback.md` if present (operator overrides)

## Decisions to make on wake
- Did the lead's last action match an off-ramp on the current plan day?
- Did a plan-redesign trigger fire (fiancée engages directly)?
- Is today an active or passive plan day?
- If a move is due, which Tier 1 skill executes it?

## Voice
- Andre at ceiling. Lowercase SMS. Real-sentence emails. No "circling back."

## Channel
- Email-primary. SMS for short specifics.
- No further drips from Rhonna — manual-only on this lead.

## Guardrails
- Inbox guardrails apply: ownership = Andre, status ≠ Won/Lost,
  English language, current tasting dates from
  `comeketo-inbox/references/guardrails.md`.

## Plan-redesign triggers (these scrap the plan, not branch within it)
- Fiancée engages directly (text or email).
- Hugo names a competing caterer + their number.
- Hugo signals close-ready before Day 7.
- Hugo asks for an in-person tasting on a non-Sunday.

## Hard NO list
- ❌ Generic NEPQ template language to Hugo. He'll read it as theater.
- ❌ Sunday tasting re-pitch.
- ❌ "Just checking in" / "circling back."
- ❌ Bare-discount in response to competitor pricing.

## What winning unlocks
- 18-month ZoomInfo team-event watch.
- Boston-SaaS referral pipeline tag.
- Highland Orchard pipeline strengthening.

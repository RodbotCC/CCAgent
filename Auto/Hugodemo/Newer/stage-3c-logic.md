---
name: stage-3c-logic
description: Stage 3c of the Comeketo Client Intelligence Agent. The if/then logic layer. Sits between the seven-day plan (Stage 5) and live execution (Stages 7+). Plans are the prescribed path; logic is what the agent does when reality doesn't match the plan. Use this skill any time a `06_logic.md` is being authored or revised. Closes the CIA §08 stage-skill gap that the first crack left open.
---

# Stage 3c — If/Then Logic Layer (the gap-closer)

The seven-day plan tells the agent what to do when nothing surprises it.
The logic layer tells the agent what to do when something does. CIA §08
calls for a per-lead `06_logic.md` for every lead; this skill is the
contract for writing one.

## What `06_logic.md` is

Not a decision tree. A set of recognizable shapes the agent should
react to, each with one clear next move. The point is to keep the
agent calibrated, not to replace operator judgment with a script.

## Required shape categories (CIA §08.02–§08.13)

Every `06_logic.md` covers, at minimum:

| § | category | typical move |
|---|---|---|
| 08.03 | positive reply | answer the substance, propose next concrete step in stated availability |
| 08.04 | question | answer first; never deflect a real question with a CTA |
| 08.05 | price objection | ask what's included before negotiating; anchor on value gap |
| 08.06 | scheduling objection | propose 2–3 specific alternatives in their stated window |
| 08.07 | partner involvement | escalate / replan if a second decider enters; do not auto-respond as if nothing changed |
| 08.08 | silence | silence ≠ disinterest; follow plan-day discipline; don't pile-on |
| 08.09 | hard-no | acknowledge once, pause cadence, log Lost-with-reason |
| 08.10 | hostile | pause permanently; do not respond defensively |
| 08.11 | close-ready | escalate to Andre + ops; never auto-send agreement |
| 08.12 | replan | scrap the plan, write a new one informed by the new signal |
| 08.13 | human-escalation | which exact humans (Andre, Rhonna, ops) and when |

## Required mechanical fields

Every `06_logic.md` also includes:

- the wake-trigger condition the Liaison Agent uses to enter logic mode
- the priority order when multiple branches match (close-ready > hostile > question > positive)
- the plan-redesign trigger list (changes that scrap the plan, not branch within it)
- the silence-by-checkpoint table (Day-N → action-N)

## What the logic file is NOT

- Not a script. The agent never copies a logic-branch line as the literal
  outbound message. It calls a Tier 1 skill that composes the move.
- Not a guardrail. Guardrails (`comeketo-inbox/references/guardrails.md`)
  are universal; logic is per-lead.
- Not a profile. Profile is "who they are." Logic is "what to do when
  they do X."

## Voice guidelines

- Use 🟢 / 🔵 / 🟡 / 🔴 emoji to mark shape severity. The agent and the
  human reader both rely on this scan-ability.
- Each line: 1–2 sentences max. If a branch needs a paragraph, it
  belongs in the seven-day plan, not the logic file.
- Always pair a trigger with exactly one move. Never list three
  alternatives — pick one.

## Example: Hugo's logic file

See `06_logic.md` (renamed from `07_logic.md` — the original numbering
had a one-off bug). Hugo's file is intentionally short; it covers
positive / wants-walkthrough / close-ready / silence / hard-no / cold-past-Day-14
and the four plan-redesign triggers (fiancée engages, in-person non-Sunday
tasting, close-ready before Day 7, named competing caterer).

## When to update `06_logic.md`

- Replan trigger fired → rewrite, don't patch.
- Andre adds a hard-no rule → add it; new universal don't-do-X may
  promote into `voice-andre-at-ceiling`.
- A new shape happened that wasn't in the file → add it; if it happens
  on a second lead, promote to a universal pattern.

## CIA §08 atomic-item map

| ID | how this skill produces it |
|---|---|
| 08.01 create logic file | this skill's primary output: `06_logic.md` |
| 08.02 define response categories | covered by the required-shape table above |
| 08.03–08.13 per-shape definitions | each is a row in the file |
| 08.14 save markdown to lead folder | per Stage 2's folder discipline |
| 08.15 update logic checklist | per `client_ledger.md` row 17.21 |
| 08.16 update master ledger logic status | per `master_ledger.csv` col 17.21 |

## Build discipline (universal vs per-lead)

The shape categories are universal. The specific triggers and moves are
per-lead. When a per-lead trigger pattern shows up across 3+ leads,
promote the trigger to a universal logic shape and the specific move
to a Tier 1 skill.

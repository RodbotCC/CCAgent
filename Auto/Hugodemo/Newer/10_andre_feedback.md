# 10_andre_feedback.md — Hugo Casillas

Andre's approvals, corrections, reactions, and overrides on every move
the Liaison Agent or system proposes. Required by CIA §11.11–§11.12 / §16.12.

This file is the human-feedback layer that makes the system get smarter
without re-prompting. Every entry should be small (1–3 lines) and
attribute-tagged.

## Schema

```
[YYYY-MM-DDThh:mm:ssZ] <kind> ::
  trigger: <which alert / outbound draft / proposed move>
  andre: <what Andre said or did>
  effect: <approved / approved-with-edit / blocked / replan / silent>
  notes: <one line on why, if non-obvious>
```

`kind`: approval | edit | block | replan | escalation-ack | calibration

## Entries

(none yet — Liaison Agent has not shipped a move on this lead. The
Day 1 email is queued for Andre review and will produce the first entry.)

## Standing calibration captured (pre-feedback)

- 🚫 Andre asked the system to **stop running auto-cadence** on Hugo
  (decision encoded in `08_automations.md`). This counts as a calibration
  override even though no specific outbound triggered it. Logged so future
  whale-tier leads inherit the "manual-only" default until the system
  proves it can match the bar.
- 🚫 Andre called out the April 23 + April 24 SMS messages in `01_comms.md`
  as the kind of generic re-engagement template that lost ground with Hugo.
  This is a pattern: don't reuse those drafts on a whale-tier lead.

## How this file gets used

- After every outbound the system ships, Andre's reaction (👍 / 👎 / "fix
  X" / "kill it") gets appended here as `kind: approval | edit | block`.
- The Liaison Agent reads this file on wake (per `AGENTS.md` / `CLAUDE.md`)
  and uses recent entries as voice/style calibration BEFORE composing the
  next move.
- Patterns across leads (Hugo + Steve + Danielle blocking the same template)
  surface "ban-list" updates that get promoted into the universal
  `voice-andre-at-ceiling` skill.

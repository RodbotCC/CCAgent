---
name: stage-6-skills
description: Stage 6 of the Comeketo Client Intelligence Agent. The skill library that executes the 7-day plans. Skills are tiered — Tier 1 moves (verbs), Tier 2 profiles (calibration), Tier 3 voices (style), Tier 4 system (plumbing). Skills are universal-by-profile-type, not per-client. Use this skill as the index and contract document for the entire skill library; consult this when adding a new skill, when versioning an existing one, or when the agent needs to pick which skill to execute a plan move.
---

# Stage 6 — Skills (the library)

Plans say what to do. Skills say how. Three skills compose into one
output: a Tier 1 move pulls calibration from a Tier 2 profile and style
from a Tier 3 voice.

## Tier 1 — Move skills (verbs of the plan)

| skill                            | what it does                                           |
|----------------------------------|--------------------------------------------------------|
| compose-nepq-followup            | short SMS / short email NEPQ pull                      |
| compose-ballpark-quote-email     | full pricing path: calculator → render template (existing in `comeketo-inbox`) |
| compose-tasting-invite           | tasting invite with current-cycle dates                |
| compose-tasting-confirmation     | pre-tasting confirmation (3-day, day-before)           |
| compose-post-call-followup       | recap + next step after discovery call                 |
| compose-quote-cover-email        | email that delivers a custom quote                     |
| compose-recovery-message         | "we may have missed the moment" reset                  |
| compose-handoff-message          | transfer to another rep                                |
| pause-cadence                    | kill auto-drips, mark manual-only                      |
| waive-tasting-fee                | operationalize fee waiver, update Close + notify lead  |
| update-task                      | move tasks per Andre's instruction                     |
| log-touch                        | record what was sent, when, channel, voice             |

## Tier 2 — Profile skills (calibration libraries)

| skill                                 | profile shape                          |
|---------------------------------------|----------------------------------------|
| profile-whale-operator                | Steve Catalano: peer-to-peer, no fluff |
| profile-whale-professional-buyer      | Hugo: respects evaluation process      |
| profile-strong-industry-insider       | Stephnie / Danielle: trained eye       |
| profile-strong-long-runway-wedding    | Emily Mann: months not days            |
| profile-standard-birthday             | Cris: warm, fast, competitor-aware     |
| profile-soft-recovery                 | Nancy: re-engagement, not-interested reset |
| profile-low-signal-discovery          | thin form data, first move = learn     |

Each profile skill is a calibration document that adjusts voice, length,
urgency, emphasis on Tier 1 moves.

## Tier 3 — Voice skills

- voice-andre
- voice-andre-at-ceiling
- voice-rhonna
- voice-toni
- voice-bibi
- voice-rodrigo
- voice-eduarda

## Tier 4 — System skills

- harvest-leads (Stage 1)
- pull-comms (Stage 2)
- people-search-pre-enrichment (Stage 3a)
- deep-dive-research (Stage 3b)
- synthesize-profile (Stage 4)
- write-seven-day-plan (Stage 5)
- update-ledger (cross-cutting)
- post-to-slack-channel (Andre alerts, briefings)
- route-by-profile-type (the dispatcher)

## Skill discipline

- Each skill does ONE thing. Compose-NEPQ does composition only; it does
  not also schedule, also update Close, also notify Andre. The agent
  composes skills; skills stay narrow.
- Each skill declares its dependencies in front-matter (which inputs it
  needs to load before execution).
- Each skill has 2-3 example inputs + expected output shapes for sanity-
  checking after edits.
- Each skill is versioned. `compose-nepq-followup-v1`, v2, etc. When
  feedback says "this kind of message is landing flat," tweak, version,
  run side-by-side.
- A `skills_index.md` lists every skill, tier, profile-types calibrated
  for. The index is the navigation surface.

## What's universal vs Comeketo-specific

| skill                            | portable to other catering companies? |
|----------------------------------|---------------------------------------|
| compose-nepq-followup            | ✅ universal                          |
| compose-ballpark-quote-email     | 🟡 Comeketo template baked in        |
| pause-cadence                    | ✅ universal                          |
| profile-whale-operator           | ✅ universal                          |
| voice-andre                      | 🚫 Comeketo-specific                 |

Marking this matters because someday this becomes a product, and you'll
want to know what's portable vs what's IP.

## Build order (don't pre-build the whole library)

The 12 moves Hugo + Steve + Danielle's plans collectively need are real;
the 38 you can imagine needing are speculation. Build a skill when you've
seen the pattern at least twice. Speculation skills age badly and rot
the library.

## Existing assets that already live as skills

- `comeketo-inbox/SKILL.md` — the inbox-task end-to-end skill, including
  the bundled `price_ballpark.py` and `render_email.py`. This already
  covers the `compose-ballpark-quote-email` Tier 1 move.
- `comeketo-inbox/references/nepq-style.md` — the messaging style guide
  that any `compose-*` skill should pull from.
- `comeketo-inbox/references/guardrails.md` — ownership / status /
  language / tasting-date rules. Every Tier 1 outbound skill must check
  these before composing.

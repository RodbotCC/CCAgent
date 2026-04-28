# skills_index.md — Master Skill Library Index

CIA §00.07 / §09E.01. Every reusable skill the system can call.
Skills are tiered (per `stage-6-skills.md`):

- **Tier 1 — Move skills (verbs)**: §09B in CIA terms
- **Tier 2 — Profile skills (calibration)**: §09C
- **Tier 3 — Voice skills (style)**: §09D
- **Tier 4 — System skills (plumbing)**: §09A

## Tier 1 — Move skills (CIA §09B)

| id | skill | status | source | calibrates with | universal? |
|---|---|---|---|---|---|
| 09B.01 | compose-nepq-followup | 🟡 described in `stage-6-skills.md`, no skill file | — | T2 + T3 | ✅ universal |
| 09B.02 | compose-ballpark-quote-email | ✅ exists | `comeketo-inbox/SKILL.md` (price_ballpark.py + render_email.py) | T2 + T3 | 🟡 Comeketo template baked in |
| 09B.03 | compose-tasting-invite | 🟡 described | — | T2 + T3 | ✅ |
| 09B.04 | compose-tasting-confirmation | 🟡 described | — | T2 + T3 | ✅ |
| 09B.05 | compose-post-call-followup | 🟡 described | — | T2 + T3 | ✅ |
| 09B.06 | compose-quote-cover-email | 🟡 described | — | T2 + T3 | ✅ |
| 09B.07 | compose-recovery-message | 🟡 described | — | T2 + T3 | ✅ |
| 09B.08 | compose-handoff-message | 🟡 described | — | T2 + T3 | ✅ |
| 09B.09 | compose-objection-response | ❌ missing | — | T2 + T3 | ✅ |
| 09B.10 | compose-close-push | ❌ missing | — | T2 + T3 | ✅ |
| 09B.11 | compose-long-term-nurture | ❌ missing | — | T2 + T3 | ✅ |
| 09B.12 | pause-cadence | 🟡 described | — | — | ✅ |

## Tier 2 — Profile calibration (CIA §09C)

| id | skill | status | canonical lead |
|---|---|---|---|
| 09C.01 | profile-whale-operator | 🟡 described | Steve Catalano |
| 09C.02 | profile-whale-professional-buyer | 🟡 described — used live for Hugo | Hugo Casillas |
| 09C.03 | profile-strong-industry-insider | 🟡 described | Stephnie / Danielle |
| 09C.04 | profile-strong-long-runway-wedding | 🟡 described | Emily Mann |
| 09C.05 | profile-standard-event-buyer | 🟡 described | Cris (birthday) |
| 09C.06 | profile-soft-recovery | 🟡 described | Nancy |
| 09C.07 | profile-pair-decision-maker | ❌ missing | — |
| 09C.08 | profile-parent-of-bride-groom | ❌ missing | — |
| 09C.09 | profile-corporate-event-pro | ❌ missing | — |

## Tier 3 — Voice (CIA §09D)

| id | skill | status |
|---|---|---|
| 09D.01 | voice-andre | 🟡 described, no standalone skill file |
| 09D.02 | voice-andre-at-ceiling | 🟡 described, used live for Hugo |
| 09D.03 | voice-rhonna | 🟡 described |
| 09D.04 | voice-toni | ❌ missing |
| 09D.05 | voice-bibi | ❌ missing |
| 09D.06 | voice-rodrigo | ❌ missing |
| 09D.07 | voice-eduarda | ❌ missing |

## Tier 4 — System / pipeline (CIA §09A)

| id | skill | status | source |
|---|---|---|---|
| 09A.01 | harvest-leads | ✅ described | `stage-1-harvest.md` |
| 09A.02 | folder-create | ❌ missing — implicit in stage-2-comms; no dedicated skill |
| 09A.03 | pull-comms | ✅ described | `stage-2-comms.md` |
| 09A.04 | people-search-pre-enrichment | ✅ described | `stage-3a-people-search.md` |
| 09A.05 | deep-dive-research | ✅ described | `stage-3b-deep-dive.md` |
| 09A.06 | synthesize-profile | ✅ described | `stage-4-profile.md` |
| 09A.07 | write-seven-day-plan | ✅ described | `stage-5-seven-day-plan.md` |
| 09A.08 | logic-writing | ❌ **GAP** — no `stage-3c-logic.md` or equivalent |
| 09A.09 | update-ledger | 🟡 described |
| 09A.10 | source-indexing | 🟡 described |
| 09A.11 | asset-capture | 🟡 described |

## Build-order rule

Build a skill on the second occurrence, not the first. Speculation skills
rot the library (per `stage-6-skills.md`).

## Live build-queue (from current lead set)

1. `compose-recovery-message` (Hugo Day 6 + at least one other)
2. `compose-quote-cover-email` extension variant (Hugo May 1)
3. `voice-andre-at-ceiling` as a real Tier 3 skill file (used by Hugo)
4. `profile-whale-professional-buyer` as a real Tier 2 skill file (used by Hugo)
5. `stage-3c-logic-writing` system skill (closes the §08 gap)

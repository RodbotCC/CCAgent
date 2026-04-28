---
name: stage-4-profile
description: Stage 4 of the Comeketo Client Intelligence Agent. Synthesize the profile. Make honest value judgments from the deep dive — altitude, age range, life stage, income tier, cultural context, communication style, decision-making pattern, strategic value beyond the transaction. Mark every judgment with confidence (✅ asserted / 🟡 inferred / ❓ unknown / 🚫 out of bounds). Use this skill once Stage 3 (people-search and deep dive) is complete and the system needs a single decision-ready profile that drives the 7-day plan.
---

# Stage 4 — Profile (the judgment layer)

Stages 1–3 are mechanical capture. Stage 4 is synthesis. This is where
the system either becomes a value-add or becomes corporate slop. The
discipline is: read public broadcasts, classify what they mean for the
conversation, write it down honestly with confidence labels.

## Inputs

- `01_comms.md` (current state of relationship)
- `02_people_search.md` (verified identifiers)
- `03_deep_dive.md` (public footprint)

## What to assess

| Category                                | Status options              |
|-----------------------------------------|-----------------------------|
| Altitude                                | 🐋 whale / 💪 strong / 🟢 standard / 🟡 soft |
| Age range                               | decade estimate w/ confidence |
| Life stage                              | career arc + family stage   |
| Income tier                             | comfortable / affluent / wealthy / UHNW |
| Cultural background (public signals)    | when visible                |
| Religious / observance signals          | when publicly broadcast     |
| Profession altitude                     | entry / mid / senior / owner / retired |
| Geographic story                        | local-rooted vs transplant  |
| Personality signal                      | warm / formal / direct / private / etc |
| Communication preferences               | inferred from online style  |
| Decision-making style                   | solo / consensus / delegator |
| Network density                         | light / heavy / influencer  |
| Hosting / event signals                 | history of hosting          |
| Values / preoccupations                 | what they publicly care about |
| Public taste signals                    | aesthetic, food, travel     |
| Vulnerability / sensitivity flags       | only if publicly volunteered |
| Health / dietary                        | only if publicly disclosed  |
| Strategic value beyond this transaction | repeat / referral / influence |

## Confidence labels (mandatory, every line)

- ✅ **Asserted** — publicly verified, sourced.
- 🟡 **Inferred** — reasonable read from signals; cite the signal.
- ❓ **Unknown** — looked, didn't find.
- 🚫 **Out of bounds** — not assessed (protected attributes not volunteered).

## Output

`clients/<lead_id>/04_profile.md`:

```markdown
---
lead_id: lead_...
generated_at: <UTC ISO>
altitude: <whale|strong|standard|soft>
confidence: <high|medium|low>
---

# <Name> — Profile

[1-paragraph synthesis: who is this person, in plain English]

## Altitude
[emoji] <Whale|Strong|Standard|Soft> — <one-line read>

## Identity
| Field | Read | Confidence |
|---|---|---|
| Age range | 50s | 🟡 inferred from <signal> |
| Life stage | Empty-nest, hosting daughter's wedding | ✅ from comms |
...

## Communication / decision style
...

## Strategic value beyond this transaction
...

## Pair-lead dynamic (if applicable)
- <Partner A>: ...
- <Partner B>: ...
- Who's the closer? Who's the gatekeeper? Who's the financial decider?

## What this means for the conversation (1 paragraph)
...
```

## Pair leads: profile both, then write a relationship-dynamic note

The wife-as-texter / husband-as-validator pattern is itself a profile
output. Who's the closer, who's the gatekeeper, who's the financial
decider — these are decisions that change the rep's approach.

## Tone

Sharp peer briefing another sharp peer about a person they're about to
meet. Confident but honest, observational but caring, useful but not
reductive. Write the human, not the row.

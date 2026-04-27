---
name: stage-3a-people-search
description: Stage 3a (lightweight pre-enrichment) of the Comeketo Client Intelligence Agent. For each lead, run cheap public-data lookups for phone, email, employer, business location, home city/neighborhood, and close family relatives — for both partners on pair leads. Use web_search baseline + structured B2B people-data lookups; do NOT spend Sonar/Grok credits at this stage. Use this skill when comms are captured (Stage 2) and the system needs an inexpensive pre-enrichment pass before deciding which leads merit deep-dive spend.
---

# Stage 3a — People-Search Pre-Enrichment

The pre-filter. Cheap, fast, public-record lookups that establish which
leads warrant Sonar/Grok deep-dive (Stage 3b) versus standard or soft
treatment.

## Inputs

- `clients/<lead_id>/01_comms.md` (for the names, phones, emails already on
  file).
- Web search.

## What to capture (per person — both partners on pair leads)

| Field                          | Status options                              |
|--------------------------------|---------------------------------------------|
| Primary phone confirmed        | found / unconfirmed / unknown               |
| Secondary phone                | found / none-found                          |
| Personal email                 | found / none-found                          |
| Work email                     | found / none-found                          |
| Employer / business            | found / none-found                          |
| Business location              | found / none-found                          |
| City / neighborhood            | found / none-found                          |
| Home address (general)         | found / none-found                          |
| Close family / relatives       | found / none-found                          |
| Partner / spouse identified    | found / none-found                          |
| Children (publicly visible)    | found / none-found                          |
| Source URLs captured           | yes / no                                    |

`none-found` (looked, didn't find) is a valid completion state —
it tells Stage 3b "we already checked, don't waste budget here."

## Output

`clients/<lead_id>/02_people_search.md`:

```markdown
---
lead_id: lead_...
generated_at: <UTC ISO>
engine: web_search + public-records
confidence: pre-enrichment-only
---

# <Name> — People Search Pre-Enrichment

## Person 1: <name>
| Field | Value | Source |
|---|---|---|
| ... | ... | <url> |

## Person 2: <partner if applicable>
...

## Family / Relatives
...

## Sources (full list)
- <url>
- <url>
```

## Routing decision (output of this stage)

After capture, classify the lead's **enrichment tier**:

- **High-tier (whale candidate)** — business email + employer + LinkedIn-shape
  footprint + business location, OR opportunity value > $5K, OR Andre flagged.
  → Route to Stage 3b deep-dive.
- **Standard** — partial public footprint, residential, mid-size event.
  → Stage 3b skipped; go straight to Stage 4 with comms + people-search only.
- **Soft** — no public footprint, low opportunity value, no Andre flag.
  → Stage 3b skipped; minimal Stage 4.

Write the routing decision into `00_meta.json`:

```json
{ "enrichment_tier": "high" }
```

## Discipline

- Public records only. No paid breach data. No deception.
- Every fact gets a source URL; "none-found" gets recorded as such.
- Run both partners on pair leads. The Steve-Catalano-shape pattern
  (lead came in under wife's name, husband is the whale) is exactly the
  case this stage exists to catch.

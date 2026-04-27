# skill_dependency_map.md — Skill Dependency Map

CIA §09E.02. Which skills depend on which.

## Composition (every Tier 1 outbound skill)

```
Tier 1 (move) → reads → Tier 2 (profile calibration) → reads → Tier 3 (voice)
                                                                      ↓
                                          Tier 4 system: log-touch + update-ledger
```

## Cross-cutting dependencies

| skill | depends on |
|---|---|
| every Tier 1 outbound | `comeketo-inbox/references/guardrails.md` (ownership / status / language / tasting-date checks) |
| every Tier 1 outbound | `comeketo-inbox/references/nepq-style.md` (style guide) |
| `compose-ballpark-quote-email` | `price_ballpark.py` + `render_email.py` |
| `pause-cadence` | Close webhook config + Rhonna drip flag |
| `harvest-leads` | active smart view in `smart_view_registry.md` |
| `update-ledger` | `master_ledger.csv` schema |

## What breaks when

- If Tier 3 voice file is missing → Tier 1 falls back to generic
  composition. The output gets template-y.
- If Tier 2 profile calibration is missing → length / urgency / register
  defaults to "neutral professional", which is wrong for whales.
- If guardrails.md is missing → the system can compose against a Lost
  lead by accident.

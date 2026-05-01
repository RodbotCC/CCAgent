# Bucket D Ledger Reconciliation Prep

Date: 2026-05-01
Actor: chatgpt_bucket_d
Parent problem: PROB-2026-04-28-016
Status: receipt-only / no path moves

## Scope

Bucket D completed a read-only classification sweep across the ambiguous top-level generated/data/orchestration surfaces under `CCAgentindex/`:

- `analytics/`
- `analytics_scripts/`
- `intake_reports/`
- `reports/`
- `summaries/`
- `intelligence/`
- `workflows/`
- `agent_plans/`
- `people/`
- `venues/`

No runtime files, client boxes, vaults, snapshots, deprecated archives, or source paths were edited during the sweep.

## Main finding

Do not bulk-move Bucket D directories. They are not one class of thing.

The sweep found four classes:

1. Generated outputs / receipts
2. Load-bearing orchestration or config memory
3. Canonical bedrock entity stores
4. Mixed / quarantine / special-handling report surfaces

## Classification map

| Surface | Classification | Canonical owner / stance | Migration stance |
|---|---|---|---|
| `CCAgentindex/analytics/` | generated analytics snapshots | `boxes/analytics/` eventually | move only after reference audit |
| `CCAgentindex/analytics_scripts/` | analytics builder/tooling code | `boxes/analytics/` eventually | move only after reference audit |
| `CCAgentindex/intake_reports/` | generated intake/workspace reports | `boxes/intake/` | safe future move into reports/receipts |
| `CCAgentindex/reports/` | mixed generated reports, conversations, demos, personal/admin artifacts | mixed owners | do not bulk-move |
| `CCAgentindex/summaries/` | generated operational briefings | `boxes/briefing/` or `boxes/orchestrator/` | safe future move; preserve historical stale paths |
| `CCAgentindex/intelligence/` | hybrid: manifest/contracts plus generated dated intelligence outputs | reconcile with existing atom decision | move only after reference audit / policy reconciliation |
| `CCAgentindex/workflows/` | automation graph definitions | `boxes/workflows/` eventually | move only after reference audit |
| `CCAgentindex/agent_plans/` | agent orchestration plans | `boxes/agent_plans/` eventually | move only after reference audit |
| `CCAgentindex/people/` | canonical bedrock entity records | keep top-level canonical for now | do not move |
| `CCAgentindex/venues/` | canonical bedrock venue/entity records | keep top-level canonical for now | do not move |

## Safest future move candidates

These are generated-output folds with relatively clear ownership:

```text
CCAgentindex/intake_reports/
  -> CCAgentindex/boxes/intake/reports/

CCAgentindex/summaries/daily_briefings/
  -> CCAgentindex/boxes/briefing/receipts/daily_briefings/
```

Even these should be moved in separate atoms with receipts.

## Reference-audit-required surfaces

Do not relocate these until their server/UI/index/widget consumers are audited and compatibility paths or shims are planned:

```text
CCAgentindex/analytics/
CCAgentindex/analytics_scripts/
CCAgentindex/intelligence/
CCAgentindex/workflows/
CCAgentindex/agent_plans/
```

Reference audit targets:

```text
server.py
mission_control_loader.js
app.jsx
screens.jsx
components.jsx
CCAgentindex/indexes/index.json
CCAgentindex/boxes/assets/ASSET_WIDGET_MAP.md
CCAgentindex/boxes/assets/page_asset_sitemap.md
```

## Keep canonical top-level for now

```text
CCAgentindex/people/
CCAgentindex/venues/
```

Reason: these are source-of-truth entity stores. Workflows and agent plans reference paths like `people/andre_raw.json` and `people/{{lead.id}}.json`. Venue records likely power enrichment, routing, venue affinity, and account intelligence. Moving these without shims would create high breakage risk with little immediate benefit.

Future `boxes/people/` and `boxes/venues/` may own stewardship docs, schemas, receipts, and mirror policy, but should not immediately relocate canonical records.

## Special handling

`CCAgentindex/reports/` is mixed and must be classified subfolder-by-subfolder.

Recommended handling:

- client/lead reports -> client-box receipts later, after client-box freeze/cutover
- `_box_conversations/*.jsonl` -> conversation receipts later
- demo/UI reports -> assets or automation receipts
- personal/admin reports, e.g. benefit-document extraction -> quarantine or personal-admin archive
- test fixtures -> intake/reporting fixtures

## Existing-ledger conflict to reconcile

Existing PROB-016 atom state already includes completed decisions for some surfaces. The most important known conflict:

- Existing `ATOM-2026-04-30-0010` for `CCAgentindex/intelligence/` is completed with decision: keep as bedrock primitive.
- Bucket D classified `intelligence/` as hybrid: durable manifest/contracts plus generated dated outputs, with `boxes/intelligence/` as a possible stewardship owner.

Do not overwrite the existing completed atom casually. Reconcile by narrowing language, adding notes, or opening an explicit decision.

## Proposed reconciliation atom

```json
{
  "id": "ATOM-2026-05-01-XXXX",
  "parent_problem_id": "PROB-2026-04-28-016",
  "title": "Reconcile Bucket D classification findings with existing PROB-016 atom decisions",
  "description": "Bucket D produced a read-only migration map for analytics, intake_reports, reports, summaries, intelligence, workflows, agent_plans, people, and venues. Some conclusions may differ from existing atom verification language, especially intelligence/. Reconcile by either updating notes, narrowing language, or creating explicit Decisions for canonical posture.",
  "acceptance_criteria": "Each Bucket D surface is mapped to an existing PROB-016 atom or a new atom; any conflict is explicitly noted; no path moves occur in this atom.",
  "estimated_effort": "30min",
  "status": "available",
  "tier": "domain",
  "area": "CCAgentindex top-level surface reconciliation",
  "parent_chain": ["PROB-2026-04-28-016"],
  "blocked_by": [],
  "blocks": [],
  "claimed_by": null,
  "claimed_at": null,
  "in_progress_at": null,
  "completed_at": null,
  "completed_by": null,
  "verification": null,
  "do_not_undo_casually": "Do not use Bucket D shorthand to override existing atom-level decisions without explicit reconciliation.",
  "notes": "Seeded by Bucket D classification sweep and ledger-write prep."
}
```

## Proposed activity receipt

```json
{"ts":"2026-05-01T00:00:00Z","kind":"bucket_d_classification_sweep","actor":"chatgpt_bucket_d","action":"audit_only","target":"CCAgentindex top-level generated/data/orchestration surfaces","notes":"Bucket D read-only classification sweep completed across analytics, analytics_scripts, intake_reports, reports, summaries, intelligence, workflows, agent_plans, people, and venues. No writes made. Output: migration map separating generated outputs, Box-owned orchestration/config, canonical bedrock entity stores, and quarantine/special-handling report surfaces. Follow-up required: reconcile Bucket D findings against existing PROB-2026-04-28-016 atoms before marking ledger completion, especially intelligence/ where existing ATOM-2026-04-30-0010 says keep as bedrock primitive."}
```

## Proposed COMM message

Title: Bucket D Classification Sweep — Do Not Bulk-Move Top-Level Surfaces

Message: Bucket D read-only classification found four distinct classes: generated outputs, load-bearing orchestration/config, canonical bedrock entity stores, and mixed/quarantine report surfaces. Do not bulk-move these directories. `intake_reports/` and `summaries/` are the safest future generated-output moves. `analytics/`, `analytics_scripts/`, `workflows/`, `agent_plans/`, and `intelligence/` require reference audits before relocation. `people/` and `venues/` should remain top-level canonical bedrock stores for now. `reports/` is mixed and must be handled per subfolder.

Suggested action: Before any write/move, reconcile Bucket D findings with existing PROB-016 atoms. Pay special attention to `intelligence/`: existing `ATOM-2026-04-30-0010` records keep-as-bedrock-primitive, while Bucket D classified it as hybrid. Resolve by Decision or by narrowing language before changing paths.

## Proposed PROB-016 history note

```json
{
  "date": "2026-05-01",
  "event": "Bucket D classification sweep completed read-only. Surfaces classified into generated outputs, Box-owned orchestration/config, canonical bedrock stores, and quarantine/mixed report areas. No writes or moves made. Follow-up required: reconcile Bucket D conclusions against existing atom-level decisions before migration, especially intelligence/ and analytics/."
}
```

## Recommended next atom

Run the reconciliation atom. Output should be a table like:

```text
Surface                     Existing atom?        Bucket D finding       Conflict?       Action
analytics/                  yes                   generated snapshots    maybe           add note / audit refs
analytics_scripts/           maybe/no              generator tooling      no              new atom or link to analytics
intake_reports/              yes                   generated intake       no              add verification
reports/                     maybe/no              mixed/quarantine       no              new atom
summaries/                   maybe/no              briefing output        no              new atom
intelligence/                yes                   hybrid                yes             reconcile with completed atom
workflows/                   maybe/no              graph definitions      no              new atom
agent_plans/                 maybe/no              orchestration config   no              new atom
people/                      maybe/no              canonical bedrock      no              new atom/decision
venues/                      maybe/no              canonical bedrock      no              new atom/decision
```

## Verification

This receipt is intentionally non-invasive:

- no runtime files changed
- no source files changed
- no client boxes changed
- no path moves made
- no existing completed atom decisions overwritten
- next action is explicitly reconciliation before migration

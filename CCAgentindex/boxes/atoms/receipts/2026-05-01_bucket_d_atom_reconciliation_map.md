# Bucket D Atom Reconciliation Map

Date: 2026-05-01
Actor: chatgpt_bucket_d
Parent problem: PROB-2026-04-28-016
Branch: `bucket-d-ledger-receipt`
Status: receipt-only / no canonical atom edits

## Purpose

This receipt maps the Bucket D classification findings onto the existing PROB-016 atom framework without editing `ATOMS.json` directly.

The previous Bucket D receipt captured the classification map. This receipt answers the next question: which findings appear to map to existing PROB-016 atoms, which need new atoms, and where there is possible conflict with already-completed atom decisions.

## Guardrails honored

- No runtime/source files changed.
- No client boxes changed.
- No vaults, snapshots, deprecated archives, or client-content surfaces touched.
- No path moves made.
- No existing completed atom decisions overwritten.
- Existing large ledgers were not rewritten because safe in-place update metadata was not available through the connector output.

## Existing atom framework observed

Repo search confirms `CCAgentindex/boxes/atoms/ATOMS.json` is the canonical atom surface for the relevant PROB-016 directory-audit atoms.

Known direct mappings from prior inspection:

| Existing atom | Area | Current known status / note |
|---|---|---|
| `ATOM-2026-04-30-0003` | `CCAgentindex/analytics` | available in prior inspection; already suspected bedrock/synthesizer-output cache; Bucket D adds nuance that `analytics/*.json` are generated snapshots and `analytics_scripts/*.py` are generator tooling. |
| `ATOM-2026-04-30-0009` | `CCAgentindex/intake_reports` | available in prior inspection; Bucket D found generated intake/workspace reports with clear future target under `boxes/intake/reports/`. |
| `ATOM-2026-04-30-0010` | `CCAgentindex/intelligence` | completed in prior inspection with decision: keep as bedrock primitive. Bucket D found a hybrid interpretation; this is the main reconciliation conflict. |

Search for the broader Bucket D path set points primarily to general CLAUDE/file-directory guidance, not obvious separate completed atom records for `reports/`, `summaries/`, `workflows/`, `agent_plans/`, `people/`, and `venues/`.

## Reconciliation table

| Surface | Existing PROB-016 atom? | Bucket D finding | Conflict? | Recommended ledger action |
|---|---:|---|---:|---|
| `CCAgentindex/analytics/` | yes: likely `ATOM-2026-04-30-0003` | generated analytics snapshot JSONs; likely UI/server/index consumers | maybe | Add verification/note to existing atom after reference audit. Do not move yet. |
| `CCAgentindex/analytics_scripts/` | unclear / probably no separate atom | generator/tooling scripts for analytics/intelligence | no | Either add sub-note under analytics atom or create a sibling atom for `analytics_scripts/` because it is tooling, not output. |
| `CCAgentindex/intake_reports/` | yes: likely `ATOM-2026-04-30-0009` | generated intake/workspace reports | no | Add verification to existing atom: future target `boxes/intake/reports/`; safe move candidate after approval. |
| `CCAgentindex/reports/` | unclear / likely needs atom | mixed generated reports, client-adjacent reports, demos, personal/admin docs | no | Create new atom. Do not bulk-move. Require subfolder-by-subfolder disposition. |
| `CCAgentindex/summaries/` | unclear / likely needs atom | generated daily briefing archive | no | Create new atom or attach to briefing/orchestrator surface. Safe future move, preserve historical stale paths. |
| `CCAgentindex/intelligence/` | yes: `ATOM-2026-04-30-0010` | hybrid: manifest/contracts + generated dated outputs | yes | Do not overwrite. Add reconciliation note or create decision candidate clarifying: output landing zone remains bedrock primitive; stewardship Box may own docs/policy later. |
| `CCAgentindex/workflows/` | unclear / likely needs atom | automation graph definitions (`comeketo.automation_graph.v1`) | no | Create new atom. Recommended owner `boxes/workflows/`, but only after reference audit. |
| `CCAgentindex/agent_plans/` | unclear / likely needs atom | agent orchestration/config plans (`comeketo.agent_plan.v1`) | no | Create new atom. Recommended owner `boxes/agent_plans/`, but only after reference audit. |
| `CCAgentindex/people/` | unclear / likely needs atom or decision | canonical bedrock entity records | no | Create decision candidate or atom note: keep top-level canonical for now; future `boxes/people/` may steward docs/schema only. |
| `CCAgentindex/venues/` | unclear / likely needs atom or decision | canonical bedrock venue/entity records | no | Create decision candidate or atom note: keep top-level canonical for now; future `boxes/venues/` may steward docs/schema only. |

## Conflict resolution proposal: `intelligence/`

Do not frame this as Bucket D overriding the completed atom. The safer reconciliation is:

```text
CCAgentindex/intelligence/ remains the bedrock primitive output landing zone for now.
A future boxes/intelligence/ may own stewardship docs, builder contracts, schemas, receipts, and migration policy.
Generated dated outputs do not move until UI/server references are audited.
```

This preserves the existing completed atom decision while retaining Bucket D's useful Box-stewardship insight.

## Recommended new atoms

These should be authored in `ATOMS.json` / mirror only after ID sequence is checked safely.

### 1. Audit `analytics_scripts/`

```json
{
  "title": "Audit CCAgentindex/analytics_scripts/ — decide tooling ownership",
  "parent_problem_id": "PROB-2026-04-28-016",
  "area": "CCAgentindex/analytics_scripts",
  "estimated_effort": "30min",
  "acceptance_criteria": "Decision recorded on whether analytics_scripts/ folds into the analytics atom, becomes boxes/analytics/steward/scripts/, or remains top-level tooling until reference audit. No scripts moved in this atom."
}
```

### 2. Audit `reports/`

```json
{
  "title": "Audit CCAgentindex/reports/ — classify subfolder dispositions",
  "parent_problem_id": "PROB-2026-04-28-016",
  "area": "CCAgentindex/reports",
  "estimated_effort": "1h",
  "acceptance_criteria": "Each visible reports/ subfolder is classified as client receipt, conversation receipt, demo/UI receipt, intake/test fixture, quarantine/personal-admin, or keep. No bulk move occurs."
}
```

### 3. Audit `summaries/`

```json
{
  "title": "Audit CCAgentindex/summaries/ — confirm briefing archive disposition",
  "parent_problem_id": "PROB-2026-04-28-016",
  "area": "CCAgentindex/summaries",
  "estimated_effort": "15min",
  "acceptance_criteria": "Decision recorded for daily_briefings archive ownership. If moving later, target is boxes/briefing/receipts/daily_briefings/ and historical path language is preserved."
}
```

### 4. Audit `workflows/`

```json
{
  "title": "Audit CCAgentindex/workflows/ — decide workflow Box boundary",
  "parent_problem_id": "PROB-2026-04-28-016",
  "area": "CCAgentindex/workflows",
  "estimated_effort": "30min",
  "acceptance_criteria": "Decision recorded for workflow graph definitions. Recommended target boxes/workflows/ noted, but no move occurs until reference audit covers UI/server/loader consumers."
}
```

### 5. Audit `agent_plans/`

```json
{
  "title": "Audit CCAgentindex/agent_plans/ — decide agent-plan Box boundary",
  "parent_problem_id": "PROB-2026-04-28-016",
  "area": "CCAgentindex/agent_plans",
  "estimated_effort": "30min",
  "acceptance_criteria": "Decision recorded for lead/coworker/system agent-plan groups. Recommended target boxes/agent_plans/ noted, but no move occurs until reference audit covers consumers."
}
```

### 6. Audit `people/`

```json
{
  "title": "Audit CCAgentindex/people/ — confirm canonical bedrock entity-store status",
  "parent_problem_id": "PROB-2026-04-28-016",
  "area": "CCAgentindex/people",
  "estimated_effort": "30min",
  "acceptance_criteria": "Decision recorded that people/ remains top-level canonical for now, or a contrary decision is explicitly justified with compatibility plan. No entity records moved."
}
```

### 7. Audit `venues/`

```json
{
  "title": "Audit CCAgentindex/venues/ — confirm canonical bedrock venue-store status",
  "parent_problem_id": "PROB-2026-04-28-016",
  "area": "CCAgentindex/venues",
  "estimated_effort": "30min",
  "acceptance_criteria": "Decision recorded that venues/ remains top-level canonical for now, or a contrary decision is explicitly justified with compatibility plan. No venue records moved."
}
```

## Existing atom note candidates

These should be applied only by a future canonical atom update.

### For `ATOM-2026-04-30-0003` / analytics

```text
Bucket D note: analytics/*.json are generated analytics snapshots; analytics_scripts/*.py are generator/tooling code and may deserve a sibling atom. Do not move analytics/ until reference audit covers server.py, screens.jsx, mission_control_loader.js, indexes/index.json, and asset/widget maps.
```

### For `ATOM-2026-04-30-0009` / intake_reports

```text
Bucket D note: intake_reports/ contains generated intake/workspace report JSONs. Proposed future fold-in target: boxes/intake/reports/ or boxes/intake/receipts/reports/. Safe move candidate after approval; no client boxes or runtime consumers touched.
```

### For `ATOM-2026-04-30-0010` / intelligence

```text
Bucket D reconciliation note: preserve existing keep-as-bedrock-primitive decision for intelligence/ as active output landing zone. Possible future boxes/intelligence/ should own stewardship docs, builder contracts, schemas, and migration policy only unless a later Decision authorizes moving dated outputs.
```

## Decision candidates

These need operator approval before writing.

1. `people/` and `venues/` remain top-level canonical bedrock stores for now.
2. Bucket D load-bearing surfaces require reference audit before relocation.
3. `intelligence/` hybrid clarification: output landing zone remains bedrock primitive; future Box may steward docs/policy.

## Recommended next P

Safest next atom:

```text
Create a canonical ATOMS update PR that adds the reconciliation atom and/or the missing audit atoms, but still does not move files.
```

If direct JSON update remains unsafe through the connector, continue using receipt files until a local working tree or non-truncated file update path is available.

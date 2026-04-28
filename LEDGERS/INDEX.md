# LEDGERS Index

This is the roster of every ledger planned for the project. The Global Ledger is the world map; everything below is a neighborhood map.

> The first file an agent reads before doing meaningful work is `GLOBAL_LEDGER.md`. This index tells you what's next.

Last updated: 2026-04-28 (Global Ledger Steward automation landed)

---

## Status legend

- **active** — file exists, content is current.
- **partial** — file exists but is incomplete or being migrated from another surface.
- **planned** — not yet created. Build order is suggested below.

---

## Top-level continuity

| Ledger | Path | Status | Owns |
|---|---|---|---|
| Global Ledger | `LEDGERS/GLOBAL_LEDGER.md` | **active** | Top-level world state, project orientation, read-first protocol. |
| Global Ledger (JSON mirror) | `LEDGERS/GLOBAL_LEDGER.json` | **active** | Machine-readable mirror of structured state. |
| Ledger Index | `LEDGERS/INDEX.md` | **active** | This file. Roster of all ledgers and their build status. |
| Temporal Continuity Ledger | `LEDGERS/TEMPORAL_CONTINUITY.md` | **active** | Current project moment, recent changes, active assumptions, carry-forward context, next handoff. Read after Global. |
| Temporal Continuity (JSON mirror) | `LEDGERS/TEMPORAL_CONTINUITY.json` | **active** | Machine-readable mirror of current state. |
| North Star Ledger | `LEDGERS/NORTH_STAR.md` | **active** | Project thesis, 10 NS goals, anti-goals, tradeoff rules, audit questions, Wholesome Enrichment principle. The "why" behind decisions. Read when planning major work or auditing. |
| North Star (JSON mirror) | `LEDGERS/NORTH_STAR.json` | **active** | Machine-readable mirror of all 10 goals + principles + anti-goals + tradeoff rules. |
| Global Ledger Steward package | `LEDGERS/AGENTS/global_ledger_steward/` | **active** | Canonical steward configuration for protecting/updating Global Ledger + JSON mirror. |
| Global Ledger Steward app agent | `CCAgentindex/agents/global_ledger_steward/` | **active** | Runnable app agent via `POST /api/agents/global_ledger_steward/run`; writes scoped local ledger updates and per-run receipts. |
| Phase Ledger | `LEDGERS/PHASE.md` | planned | Current milestone state and exit criteria. |

---

## Truth and rules

| Ledger | Path | Status | Owns |
|---|---|---|---|
| Source-of-Truth Ledger | `LEDGERS/SOURCE_OF_TRUTH.md` | planned | Which system owns which truth. Detailed expansion of Global §4. |
| Definition of Done Ledger | `LEDGERS/DEFINITION_OF_DONE.md` | planned | Completion standards by surface (UI, ledger, box, automation). |
| Page-Asset Sitemap | `page_asset_sitemap.md` (project root) | **active** | UI Done Gate. Page/route/binding ownership. |

---

## Map and inventory

| Ledger | Path | Status | Owns |
|---|---|---|---|
| File Directory Ledger | `LEDGERS/FILE_DIRECTORY_LEDGER.md` | **active** | Top-level + subdirectory map (real paths only), ownership table, canonical vs generated, status taxonomy, common wrong-turns. The project's city map. |
| File Directory (JSON mirror) | `LEDGERS/FILE_DIRECTORY_LEDGER.json` | **active** | Structured mirror of every directory + open_problems_to_log[]. |
| Directory Configuration template | `LEDGERS/LOCAL_TEMPLATE/DIRECTORY_ORIENTATION_TEMPLATE.md` | **active** | Template stamp for "you are here" files in any directory. |
| Box Ledger template | `LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md` | **active** | Template stamp for any new Box. |
| File Contents Ledger | `LEDGERS/FILE_CONTENTS.md` | planned | Important file responsibilities. |
| Asset / Widget Map | `LEDGERS/ASSET_WIDGET_MAP.md` | planned | Pages, widgets, APIs, data flow. (Partially live in `page_asset_sitemap.md`.) |
| Page Ledgers | `LEDGERS/PAGES/<route>.md` | planned | One per surviving UI route: grid, settings, leads, clients, coworkers, contacts, briefing, activity, automation, intake, analytics. |
| Widget Ledgers | `LEDGERS/WIDGETS/<widget>.md` | planned | One per major widget. |
| Connections Ledger | `LEDGERS/CONNECTIONS.md` | planned | External systems and services (Close, Pieces, Twilio, Slack, Google, ClickUp, Supabase). |
| Settings Ledger | `LEDGERS/SETTINGS.md` | planned | Configurable options and feature flags. |

---

## Memory of the work

| Ledger | Path | Status | Owns |
|---|---|---|---|
| Decisions Ledger | `LEDGERS/DECISIONS.md` | planned | Major choices and the reasoning behind them. |
| Communications Ledger | `LEDGERS/COMMUNICATIONS.md` | planned | Handoffs, warnings, notes between agents/humans. |
| Open Problems Ledger | `LEDGERS/OPEN_PROBLEMS_LEDGER.md` | **active** | 13 active problems + 1 closed. Stable IDs (PROB-YYYY-MM-DD-###), severity/urgency separated, mandatory close criteria. **Read before starting work** to avoid rediscovering known issues. |
| Open Problems (JSON mirror) | `LEDGERS/OPEN_PROBLEMS_LEDGER.json` | **active** | Structured mirror with blocked, partially-fixed, recurring patterns, recently-closed. |
| Audit Ledger | `LEDGERS/AUDIT.md` | planned | Audit findings and follow-up. |
| Prompt / Reconstruction Ledger | `LEDGERS/PROMPT_RECONSTRUCTION.md` | planned | How important things were built — repeatable processes. |
| Scout Ledger | `LEDGERS/SCOUT.md` | planned | Tool/model/workflow research notes. |
| Activity ledger (audit trail) | `CCAgentindex/_ledger/activity.jsonl` | **active** | Append-only delegation/event log. |

---

## Visuals

Mermaid `.mmd` files under `LEDGERS/VISUALS/`:

| Visual | Path | Status |
|---|---|---|
| Global system map | `LEDGERS/VISUALS/global_system_map.mmd` | **active** |
| Ledger dependency map | `LEDGERS/VISUALS/ledger_dependency_map.mmd` | **active** |
| Client Box lifecycle | `LEDGERS/VISUALS/client_box_lifecycle.mmd` | **active** |
| Temporal continuity flow (session protocol) | `LEDGERS/VISUALS/temporal_continuity_flow.mmd` | **active** |
| Client state temporal flow (plan aging + approval) | `LEDGERS/VISUALS/client_state_temporal.mmd` | **active** |
| North Star map (thesis → 10 goals → systems) | `LEDGERS/VISUALS/north_star_map.mmd` | **active** |
| North Star alignment check (decision tree) | `LEDGERS/VISUALS/north_star_alignment_check.mmd` | **active** |
| File directory map (repo tree shape) | `LEDGERS/VISUALS/file_directory_map.mmd` | **active** |
| Directory ownership map (canonical → runtime → UI flows) | `LEDGERS/VISUALS/directory_ownership_map.mmd` | **active** |
| Problem lifecycle (Found → Triage → Verify → Close) | `LEDGERS/VISUALS/problem_lifecycle.mmd` | **active** |
| Open problems board (grouped by urgency × severity) | `LEDGERS/VISUALS/open_problems_board.mmd` | **active** |
| Risk heatmap (system risk chains) | `LEDGERS/VISUALS/risk_heatmap.mmd` | **active** |
| Page / API / data-flow map | `LEDGERS/VISUALS/page_api_dataflow.mmd` | planned |
| Source-of-truth flow | `LEDGERS/VISUALS/source_of_truth_flow.mmd` | planned |
| Box hierarchy map | `LEDGERS/VISUALS/box_hierarchy.mmd` | planned |

---

## Suggested build order (Phase 6 onward)

Phases 1–5 are complete: Global Ledger (constitution), Temporal Continuity (cockpit log), North Star (compass), File Directory (city map), Open Problems (protection system). The first steward automation is also active: `global_ledger_steward` can run local ledger-maintenance sweeps through the app agent path. The order below is a recommendation — pick by what's most painful next.

1. **Source-of-Truth Ledger** — encodes rules already summarized in Global §4 + NS-06 + FDL §6 + OPL recurring patterns. Would unblock PROB-001 (allowed-to-know schema) and reduce PROB-010 risk.
2. **Definition of Done Ledger** — locks in "if the system changed, the system memory changes with it" per surface; references North Star goals + OPL close-criteria pattern. Pairs naturally with Source-of-Truth.
3. **Decisions Ledger** — start retroactively logging the big calls already made. Several OPL entries are blocked on decisions (PROB-010, 011, 012, 013, 014) — DoD + Decisions together would unblock them.
4. **Audit Ledger** — formalize the client-box audit pattern Brenda established. Each entry references North Star goals (supported / threatened / anti-goal proximity) and OPL entries created/closed.
5. **Directory Configuration files** — stamp the project tree using `DIRECTORY_ORIENTATION_TEMPLATE.md`. FDL names where they should live; this fills them in.
6. **Phase Ledger** — name the current phase and its exit criteria.
7. **Page Ledgers** (one per surviving route) — start with `boxes`, then `analytics`, `automation`, `intake`.
8. **Connections Ledger** — encode external-system contract (Close, Pieces, Twilio, Slack, Google, ClickUp, Supabase). Pairs with closing PROB-009.
9. **Communications Ledger**, **Prompt / Reconstruction Ledger**, **Scout Ledger** — slower-moving, build as content arrives.
10. **Widget Ledgers** + **Settings Ledger** — last, mostly stable patterns from Page Ledgers.

---

## Templates

Local Box scaffolds live at `LEDGERS/LOCAL_TEMPLATE/`:

- `BOX_LEDGER_TEMPLATE.md` — for any new Box
- `DIRECTORY_ORIENTATION_TEMPLATE.md` — for any directory that needs a "you are here" file

---

## Update rules for this index

Update `INDEX.md` whenever:

- a new ledger is created (flip status from planned to active)
- a ledger is retired (mark retired with date)
- the build order changes
- a new visual lands under `VISUALS/`

The Global Ledger is the world map. This index is its table of contents.

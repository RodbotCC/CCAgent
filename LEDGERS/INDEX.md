# LEDGERS Index

This is the roster of every ledger planned for the project. The Global Ledger is the world map; everything below is a neighborhood map.

> The first file an agent reads before doing meaningful work is `GLOBAL_LEDGER.md`. This index tells you what's next.

Last updated: 2026-04-29 (post Cowork housekeeping — directory consolidation + Audit dropped from build queue + Communications Ledger queued)

> **Where the source material lives (2026-04-29):**
> - **Outline drafts** for unbuilt ledgers: `/Users/jakeaaron/Downloads/CC Agent/Ledger Drafts/` (19 `.txt` files). Read the matching outline before authoring any new ledger.
> - **Sub-agent draft packages**: `/Users/jakeaaron/Downloads/CC Agent/Subagent Boxes/` (5 packages — file_directory, global_ledger, north_star, open_problems, temporal_continuity). Awaiting promotion to runnable app agents under `CCAgentindex/agents/<name>/`.
> - **Active steward materials** (canonical): `LEDGERS/AGENTS/<name>/`. Today: only `global_ledger_steward`.

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
| Decisions Ledger | `LEDGERS/DECISIONS_LEDGER.md` | **active** | 12 active project decisions with stable IDs (DEC-YYYY-MM-DD-###), status / confidence / scope, alternatives considered, consequences, do-not-undo-casually, review triggers. **Read before reversing any architectural choice.** Covers GitHub source-of-truth, FileTree-over-RAG, Client Boxes canonical, plans-are-strategy-drafts, risky-moves-need-isolated-approval, Boxes-page-display-only, sitemap-Done-Gate, one-ledger-at-a-time, triad spine, three-phase build, TCL/GL update discipline, Audit-out-of-scope. |
| Decisions (JSON mirror) | `LEDGERS/DECISIONS_LEDGER.json` | **active** | Structured mirror with all 12 decisions, dependencies, promotions from Communications, decisions-needing-review, counts. |
| Communications Ledger | `LEDGERS/COMMUNICATIONS_LEDGER.md` | **active** | How agents talk across time: handoffs, warnings, preferences, lessons, attempted/abandoned work, cross-system coordination. 18 seeded entries (5 handoffs, 3 warnings, 3 preferences, 4 lessons, 1 attempt, 2 cross-system). **Read at session start and end.** |
| Communications (JSON mirror) | `LEDGERS/COMMUNICATIONS_LEDGER.json` | **active** | Structured mirror with all entries, types, promotion paths, archive policy, counts. |
| Open Problems Ledger | `LEDGERS/OPEN_PROBLEMS_LEDGER.md` | **active** | 13 active problems + 1 closed. Stable IDs (PROB-YYYY-MM-DD-###), severity/urgency separated, mandatory close criteria. **Read before starting work** to avoid rediscovering known issues. |
| Open Problems (JSON mirror) | `LEDGERS/OPEN_PROBLEMS_LEDGER.json` | **active** | Structured mirror with blocked, partially-fixed, recurring patterns, recently-closed. |
| Audit Ledger | `LEDGERS/AUDIT.md` | **out-of-scope (2026-04-29)** | Removed from build queue per Jake — coverage absorbed by Open Problems, Decisions, Communications, and per-Box ledgers. Draft outline kept at `Ledger Drafts/# Audit Ledger.txt` for reference. |
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
| Communications handoff routing (decision tree) | `LEDGERS/VISUALS/handoff_flow.mmd` | **active** |
| Communication lifecycle (Active → Resolve → Promote/Archive) | `LEDGERS/VISUALS/communication_lifecycle.mmd` | **active** |
| Communications timeline (seeded entries chronological) | `LEDGERS/VISUALS/communications_timeline.mmd` | **active** |
| Decision dependency map (how decisions depend on each other) | `LEDGERS/VISUALS/decision_dependency_map.mmd` | **active** |
| Decision timeline (chronological view of all 12 decisions) | `LEDGERS/VISUALS/decision_timeline.mmd` | **active** |
| Page / API / data-flow map | `LEDGERS/VISUALS/page_api_dataflow.mmd` | planned |
| Source-of-truth flow | `LEDGERS/VISUALS/source_of_truth_flow.mmd` | planned |
| Box hierarchy map | `LEDGERS/VISUALS/box_hierarchy.mmd` | planned |

---

## Suggested build order (Phase 6 onward)

Phases 1–5 are complete: Global Ledger (constitution), Temporal Continuity (cockpit log), North Star (compass), File Directory (city map), Open Problems (protection system). The first steward automation is also active: `global_ledger_steward` can run local ledger-maintenance sweeps through the app agent path. The order below is a recommendation — pick by what's most painful next.

1. **Source-of-Truth Ledger** — encodes rules already summarized in Global §4 + NS-06 + FDL §6 + OPL recurring patterns. Would unblock PROB-001 (allowed-to-know schema) and reduce PROB-010 risk.
2. **Definition of Done Ledger** — locks in "if the system changed, the system memory changes with it" per surface; references North Star goals + OPL close-criteria pattern. Pairs naturally with Source-of-Truth.
3. ~~**Decisions Ledger**~~ — **landed 2026-04-29 (Phase 7)**. 12 active decisions. Now live at `LEDGERS/DECISIONS_LEDGER.md`. 5 Communications entries promoted in.
4. ~~**Audit Ledger**~~ — **out of scope as of 2026-04-29.** Removed from build queue per Jake; audit-shaped findings will land in Open Problems, Decisions, Communications, or per-Box ledgers as appropriate.
5. ~~**Communications Ledger**~~ — **landed 2026-04-29 (Phase 6)**. How agents talk across time. Now live at `LEDGERS/COMMUNICATIONS_LEDGER.md` with 18 seeded entries.
6. **Directory Configuration files** — stamp the project tree using `DIRECTORY_ORIENTATION_TEMPLATE.md`. FDL names where they should live; this fills them in.
7. **Phase Ledger** — name the current phase and its exit criteria.
8. **Page Ledgers** (one per surviving route) — start with `boxes`, then `analytics`, `automation`, `intake`.
9. **Connections Ledger** — encode external-system contract (Close, Pieces, Twilio, Slack, Google, ClickUp, Supabase). Pairs with closing PROB-009.
10. **Prompt / Reconstruction Ledger**, **Scout Ledger** — slower-moving, build as content arrives.
11. **Widget Ledgers** + **Settings Ledger** — last, mostly stable patterns from Page Ledgers.

**Three-phase build discipline (Jake, 2026-04-29):** Phase A — finish all Ledgers (current). Phase B — finish all Sub-agents (graduate `/Subagent Boxes/` packages into runnable app agents). Phase C — build Subagent Boxes (boxes of ledgers controlled by sub-agent configurations).

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

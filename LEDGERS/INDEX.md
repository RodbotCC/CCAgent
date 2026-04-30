# LEDGERS Index

This is the roster of every ledger planned for the project. The Global Ledger is the world map; everything below is a neighborhood map.

> The first file an agent reads before doing meaningful work is `GLOBAL_LEDGER.md`. This index tells you what's next.

Last updated: 2026-04-29 (Phase 14 — Asset/Widget Map landed; cross-page widget catalog + API→page mapping)

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
| Source-of-Truth Ledger | `LEDGERS/SOURCE_OF_TRUTH.md` | **active** | Universal trust ordering + per-domain trust orderings + Allowed-To-Know 4-bucket schema (closes PROB-001 schema-design criterion) + conflict resolution + update protocol. **First ledger authored under `DEC-2026-04-29-013` envelope-aware rule** — tier: global. |
| Source-of-Truth (JSON mirror) | `LEDGERS/SOURCE_OF_TRUTH.json` | **active** | Machine-readable mirror of trust orderings + allowed-to-know schema. |
| Definition of Done Ledger | `LEDGERS/DEFINITION_OF_DONE.md` | **active** | Completion standards by surface (UI, ledger, box, automation). Universal Done Gate + 11 work-type Done Gates + Ledger Update Matrix. |
| Definition of Done (JSON mirror) | `LEDGERS/DEFINITION_OF_DONE.json` | **active** | Machine-readable mirror of all gates + matrix + NS alignment. |
| Box Ledger | `LEDGERS/BOX_LEDGER.md` | **active** | Defines what a Box is — concept, classes, status labels, BOX.md vs DIRECTORY.md, Local Agent Protocol, stamping rhythm, Box lifecycle. |
| Box Ledger (JSON mirror) | `LEDGERS/BOX_LEDGER.json` | **active** | Machine-readable mirror of Box concept. |
| Box Bus Ledger | `LEDGERS/BOX_BUS_LEDGER.md` | **active (schema-only)** | Defines how Boxes connect — `box.json` manifest schema, ledger envelope, 3 routing tiers, 3 interpreter tiers, cycle policy, "what's a Box" binding rule, two worked examples. **Runtime deferred to Phase C** under `DEC-2026-04-29-013`. |
| Box Bus Ledger (JSON mirror) | `LEDGERS/BOX_BUS_LEDGER.json` | **active (schema-only)** | Machine-readable mirror of manifest + envelope + tier model + interpreter model + cycle policy. |
| Page-Asset Sitemap | `page_asset_sitemap.md` (project root) | **active** | UI Done Gate. Page/route/binding ownership. Pointed at by Definition of Done §5.3. |

---

## Map and inventory

| Ledger | Path | Status | Owns |
|---|---|---|---|
| File Directory Ledger | `LEDGERS/FILE_DIRECTORY_LEDGER.md` | **active** | Top-level + subdirectory map (real paths only), ownership table, canonical vs generated, status taxonomy, common wrong-turns. The project's city map. |
| File Directory (JSON mirror) | `LEDGERS/FILE_DIRECTORY_LEDGER.json` | **active** | Structured mirror of every directory + open_problems_to_log[]. |
| Directory Configuration template | `LEDGERS/LOCAL_TEMPLATE/DIRECTORY_ORIENTATION_TEMPLATE.md` | **active** | Template stamp for "you are here" files in any directory. |
| Box Ledger template | `LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md` | **active** | Template stamp for any new Box. |
| File Contents Ledger | `LEDGERS/FILE_CONTENTS.md` | **active** | Per-file role inventory — ~78 load-bearing files across 10 categories (ledger, runtime-frontend, runtime-backend, meta-harness, orchestrator, inbox-skill, bedrock-index, client-box-convention, staff-box-convention, template). What each file owns, depends on, gets updated alongside, common mistakes. |
| File Contents (JSON mirror) | `LEDGERS/FILE_CONTENTS.json` | **active** | Machine-readable mirror — structured per-file entries. Indexable by category / type / related ledgers. |
| Asset / Widget Map | `LEDGERS/ASSET_WIDGET_MAP.md` | **active** | Cross-page widget catalog (7 categories) + API→page mapping (10 endpoint groups) + shared services registry (10 `window.*` objects) + cross-page state (7 localStorage keys + 3 events) + change-radius hints. Sitemap remains canonical per-page truth. **Tier: domain.** |
| Asset / Widget Map (JSON mirror) | `LEDGERS/ASSET_WIDGET_MAP.json` | **active** | Machine-readable mirror — pages[], shared_widgets, api_to_page_mapping, shared_services, cross_page_state, change_radius. |
| Page Ledgers | `LEDGERS/PAGES/<route>.md` | planned | One per surviving UI route: grid, settings, leads, clients, coworkers, contacts, briefing, activity, automation, intake, analytics. |
| Widget Ledgers | `LEDGERS/WIDGETS/<widget>.md` | planned | One per major widget. |
| Connections Ledger | `LEDGERS/CONNECTIONS.md` | **active** | External-system inventory: 11 active services + 2 planned + 3 not-in-use, all evidence-checked. Per-service contracts (credentials/failure modes/verification/billing/fallback). **First domain-tier ledger.** Closed PROB-2026-04-28-009. |
| Connections (JSON mirror) | `LEDGERS/CONNECTIONS.json` | **active** | Machine-readable mirror — per-service entries with full operational fields. |
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
| Done Gate flow (Universal Done Gate decision tree) | `LEDGERS/VISUALS/done_gate_flow.mmd` | **active** |
| 55 / 45 build rhythm (offense/defense feedback loop) | `LEDGERS/VISUALS/build_rhythm_55_45.mmd` | **active** |
| Box Bus topology (Global / Domain / Local with example boxes + fan-out) | `LEDGERS/VISUALS/box_bus_topology.mmd` | **active** |
| Interpreter tiers (T1 / T2 / T3 dispatch flow) | `LEDGERS/VISUALS/interpreter_tiers.mmd` | **active** |
| Envelope routing flow (emit → validate → route → interpret → record) | `LEDGERS/VISUALS/envelope_routing_flow.mmd` | **active** |
| Source-of-truth flow (per-domain decision tree → conflict resolution walk) | `LEDGERS/VISUALS/source_of_truth_flow.mmd` | **active** |
| Connections dependency map (Cloud → Local → Project blast-radius) | `LEDGERS/VISUALS/connections_dependency_map.mmd` | **active** |
| File contents index (5-cluster roll-up + cross-cluster dependency arrows) | `LEDGERS/VISUALS/file_contents_index.mmd` | **active** |
| Page-widget dependency map (14 pages → shared widgets → services → APIs) | `LEDGERS/VISUALS/page_widget_dependency.mmd` | **active** |
| Box hierarchy map | `LEDGERS/VISUALS/box_hierarchy.mmd` | **active** |
| Box orientation flow | `LEDGERS/VISUALS/box_orientation_flow.mmd` | **active** |
| Page / API / data-flow map | `LEDGERS/VISUALS/page_api_dataflow.mmd` | planned |
| Source-of-truth flow | `LEDGERS/VISUALS/source_of_truth_flow.mmd` | planned |

---

## Suggested build order (Phase 15 onward)

Phases 1–14 are complete: Global, Temporal Continuity, North Star, File Directory, Open Problems, Communications, Decisions, Box Ledger, Definition of Done, Box Bus Ledger, Source-of-Truth, Connections, File Contents, **Asset/Widget Map**. The first steward automation is also active: `global_ledger_steward` can run local ledger-maintenance sweeps through the app agent path. The order below is a recommendation — pick by what's most painful next.

1. ~~**Source-of-Truth Ledger**~~ — **landed 2026-04-29 (Phase 11)**. First ledger authored under DEC-2026-04-29-013 envelope-aware rule. PROB-001 schema-design criterion satisfied. Now live at `LEDGERS/SOURCE_OF_TRUTH.md`.
2. ~~**Connections Ledger**~~ — **landed 2026-04-29 (Phase 12)**. First domain-tier ledger. PROB-2026-04-28-009 closed. Now live at `LEDGERS/CONNECTIONS.md`.
3. ~~**File Contents Ledger**~~ — **landed 2026-04-29 (Phase 13)**. ~78 file entries across 10 categories. Now live at `LEDGERS/FILE_CONTENTS.md`.
4. ~~**Asset / Widget Map**~~ — **landed 2026-04-29 (Phase 14)**. Cross-page widget catalog + API→page mapping. Now live at `LEDGERS/ASSET_WIDGET_MAP.md`.
2. ~~**Box Bus Ledger**~~ — **landed 2026-04-29 (Phase 10)**. Schema only; runtime deferred to Phase C. Now live at `LEDGERS/BOX_BUS_LEDGER.md` with `DEC-2026-04-29-013` as the architectural lock.
3. ~~**Definition of Done Ledger**~~ — **landed 2026-04-29 (Phase 9)**. Universal Done Gate + 11 work-type gates + Ledger Update Matrix. Now live at `LEDGERS/DEFINITION_OF_DONE.md`.
3. ~~**Decisions Ledger**~~ — **landed 2026-04-29 (Phase 7)**. 12 active decisions. Now live at `LEDGERS/DECISIONS_LEDGER.md`. 5 Communications entries promoted in.
4. ~~**Audit Ledger**~~ — **out of scope as of 2026-04-29.** Removed from build queue per Jake; audit-shaped findings will land in Open Problems, Decisions, Communications, or per-Box ledgers as appropriate.
5. ~~**Communications Ledger**~~ — **landed 2026-04-29 (Phase 6)**. How agents talk across time. Now live at `LEDGERS/COMMUNICATIONS_LEDGER.md` with 18 seeded entries.
6. ~~**Box Ledger**~~ — **landed 2026-04-29 (Phase 8)**. Defines the Box concept project-wide. Subsumed the planned "Directory Configuration Ledger." Now live at `LEDGERS/BOX_LEDGER.md`.
7. **Phase Ledger** — name the current phase and its exit criteria. Pairs with DoD §11 (Phase Ledger row).
8. **Connections Ledger** — encode external-system contract (Close, Pieces, Twilio, Slack, Google, ClickUp, Supabase). Pairs with closing PROB-009 + DoD §5.8.
9. **Page Ledgers** (one per surviving route) — start with `boxes`, then `analytics`, `automation`, `intake`. Each must satisfy DoD §5.3.
10. **File Contents Ledger** — important file responsibilities. Smaller, but unblocks per-page ledgers.
11. **Asset / Widget Map** + **Widget Ledgers** + **Settings Ledger** — patterns from Page Ledgers. Each must satisfy DoD §5.4.
12. **Prompt / Reconstruction Ledger**, **Scout Ledger** — slower-moving, build as content arrives.
13. **Directory Configuration files (per-directory stamps)** — stamp the project tree using `DIRECTORY_ORIENTATION_TEMPLATE.md` per `BOX_LEDGER.md` rules.

**Three-phase build discipline (Jake, 2026-04-29):** Phase A — finish all Ledgers (current). Phase B — finish all Sub-agents (graduate `/Subagent Boxes/` packages into runnable app agents). Phase C — build Subagent Boxes + the **Box Bus runtime** (router, propagation ledger, T1/T2/T3 interpreters, validation/cycle enforcement) per `BOX_BUS_LEDGER.md`.

**Envelope-aware authoring (from Phase 11 onward):** every new ledger declares its tier (`global` / `domain` / `local`) and entry kind aligned to the envelope schema in `BOX_BUS_LEDGER.md` §2.2. Every new Box ships with a `box.json` manifest stub. No runtime to consume them yet — but zero migration debt at Phase C.

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

# LEDGERS Index

This is the roster of every ledger planned for the project. The Global Ledger is the world map; everything below is a neighborhood map.

> The first file an agent reads before doing meaningful work is `GLOBAL_LEDGER.md`. This index tells you what's next.

Last updated: 2026-05-01 (later still³ — **CLAUDE.md rewritten post-sweep via ATOM-2026-05-01-0014.** 1235 → 1591 lines. Path migration throughout: `LEDGERS/<NAME>.md` → `CCAgentindex/boxes/<box>/<NAME>.md`. New §1.3 P-Protocol, new §3.3 post-sweep canonical paths, new §3.5 four-category classification, new Appendix C paths quick-reference. **DEC-2026-05-01-003 authored** locking Cleanup Mode + P-Protocol Operating Doctrine across all agent runtimes (Cowork, Claude Code, Codex, parallel ChatGPT-based, future). **COMM-2026-05-01-004 filed** as master orientation entry (HIGHEST-PRIORITY — read before claiming any atom). **24 active + 1 proposed decisions.** Atom queue **123 atoms** (ATOM-0014 completed). **Important path migration note for future agents:** the canonical ledger MDs are no longer at `LEDGERS/<NAME>.md` — they're at `CCAgentindex/boxes/<box>/<NAME>.md`. Read CLAUDE.md §3.3 for the full mapping. Only `LEDGERS/INDEX.md` (this file) still floats outside Boxes intentionally — meta-roster of all ledgers. Earlier today: Beta-Test Pivot ATOM-0012; Auto/ symlink dispersal chain INITIATED via ATOM-0001; Phase B steward fleet COMPLETE; Atlas Box graduation; atom-chase drift recovery.)

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
| Phase Ledger | `LEDGERS/PHASE.md` | **active** | Current phase + exit criteria + do-not-leak rules + transition protocol + anti-patterns. **Phase A Complete** (2026-04-29). Tier: global. |
| Phase (JSON mirror) | `LEDGERS/PHASE.json` | **active** | Machine-readable mirror. |

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
| Page Ledgers (directory) | `LEDGERS/PAGES/` | **partial (2 of 14)** | Per-page deep memory. Sitemap remains canonical operational truth; Page Ledgers carry the *why*. Pattern stamped at [`PAGES/_README.md`](PAGES/_README.md) with 14-page status table + authoring template. |
| Page Ledger — `boxes` | `LEDGERS/PAGES/boxes.md` | **active** | First Page Ledger (Phase 16). 16 sections covering boxes page deep memory. **Tier: domain.** |
| Page Ledger — `intake` | `LEDGERS/PAGES/intake.md` | **active** | Second Page Ledger (Phase 17). Captures Phase 1 unification architecture (DEC-005..008). **Tier: domain.** |
| Page Ledger — `automation` | `LEDGERS/PAGES/automation.md` | **active** | Third Page Ledger (Phase 18). Highest-risk write surface — 5 sub-tabs (workflows / sub-agents / state / hooks / triggers). **Tier: domain.** |
| Page Ledger — `delegations` | `LEDGERS/PAGES/delegations.md` | **active** | Fourth Page Ledger (Phase 19). Project's send chokepoint; DEC-2026-04-28-005 enforcement (two-step submit→approve). **Tier: domain.** |
| Page Ledger — `settings` | `LEDGERS/PAGES/settings.md` | **active** | Fifth Page Ledger (Phase 20). Per-page deep memory pairs with global SETTINGS.md ledger. **Tier: domain.** |
| Page Ledgers (remaining 9 routes) | `LEDGERS/PAGES/<route>.md` | **deferred (Phase B/C as needed)** | grid, leads, clients, coworkers, contacts, venues, briefing, activity, analytics. Per Phase A exit policy: lower-risk routes don't block Phase A close. Author when needed. |
| Widget Ledgers | `LEDGERS/WIDGETS/<widget>.md` | planned | One per major widget. |
| Connections Ledger | `LEDGERS/CONNECTIONS.md` | **active** | External-system inventory: 11 active services + 2 planned + 3 not-in-use, all evidence-checked. Per-service contracts (credentials/failure modes/verification/billing/fallback). **First domain-tier ledger.** Closed PROB-2026-04-28-009. |
| Connections (JSON mirror) | `LEDGERS/CONNECTIONS.json` | **active** | Machine-readable mirror — per-service entries with full operational fields. |
| Settings Ledger | `LEDGERS/SETTINGS.md` | **active** | User-configurable surface catalog: 11 settings across 3 persistence layers (`.env` / `localStorage.secretary.tweaks` / runtime). Demo mode + provider exclusivity + credential save/clear with audit log. **Tier: global.** Pairs with CONNECTIONS. |
| Settings (JSON mirror) | `LEDGERS/SETTINGS.json` | **active** | Machine-readable mirror of all settings, persistence layers, and rules. |

---

## Memory of the work

| Ledger | Path | Status | Owns |
|---|---|---|---|
| Decisions Ledger | `LEDGERS/DECISIONS_LEDGER.md` | **active** | 12 active project decisions with stable IDs (DEC-YYYY-MM-DD-###), status / confidence / scope, alternatives considered, consequences, do-not-undo-casually, review triggers. **Read before reversing any architectural choice.** Covers GitHub source-of-truth, FileTree-over-RAG, Client Boxes canonical, plans-are-strategy-drafts, risky-moves-need-isolated-approval, Boxes-page-display-only, sitemap-Done-Gate, one-ledger-at-a-time, triad spine, three-phase build, TCL/GL update discipline, Audit-out-of-scope. |
| Decisions (JSON mirror) | `LEDGERS/DECISIONS_LEDGER.json` | **active** | Structured mirror with all 12 decisions, dependencies, promotions from Communications, decisions-needing-review, counts. |
| Communications Ledger | `LEDGERS/COMMUNICATIONS_LEDGER.md` | **active** | How agents talk across time: handoffs, warnings, preferences, lessons, attempted/abandoned work, cross-system coordination. 18 seeded entries (5 handoffs, 3 warnings, 3 preferences, 4 lessons, 1 attempt, 2 cross-system). **Read at session start and end.** |
| Communications (JSON mirror) | `LEDGERS/COMMUNICATIONS_LEDGER.json` | **active** | Structured mirror with all entries, types, promotion paths, archive policy, counts. |
| Open Problems Ledger | `LEDGERS/OPEN_PROBLEMS_LEDGER.md` | **active** | 13 active problems + 1 closed. Stable IDs (PROB-YYYY-MM-DD-###), severity/urgency separated, mandatory close criteria. **Read before starting work** to avoid rediscovering known issues. PROB-016 atomized 2026-04-30 into 26 atoms. |
| Open Problems (JSON mirror) | `LEDGERS/OPEN_PROBLEMS_LEDGER.json` | **active** | Structured mirror with blocked, partially-fixed, recurring patterns, recently-closed. |
| Atom Ledger | `LEDGERS/ATOMS.md` | **active** | Operational layer below Open Problems — PROBs decompose 1:N into single-session claimable atoms. 6-state lifecycle (`available` → `claimed` → `in_progress` → `completed` \| `blocked` \| `abandoned`). Single-writer claim protocol. 4h granularity rule. Phase A proof: PROB-2026-04-28-016 atomized into 26 atoms. **Tier: global.** Authored under `DEC-2026-04-30-003`. |
| Atoms (JSON mirror) | `LEDGERS/ATOMS.json` | **active** | Machine-readable mirror — schema, lifecycle, claim protocol, **43 seeded atoms** across 2 parent PROBs (PROB-016 = 26, PROB-005 = 17). Canonical for race resolution. |
| Atomizer Steward Box | `LEDGERS/BOXES/atoms/` | **active (declarative; runnable form Phase B)** | Unified Box for the Atom Ledger per `DEC-2026-04-29-015`. Houses the Atomizer Steward sub-agent: scans new PROBs, proposes atoms to `DRAFTS/ATOMIZATION/`, sweeps stale claims, surfaces PROB-closure-eligible candidates. Ledger files (`ATOMS.md` + `.json`) stay at `LEDGERS/` — Box governs by `box.json` `owns[]` path reference. |
| Temporal Continuity Box | `LEDGERS/BOXES/temporal_continuity/` | **active (runnable, Phase B live)** | First unified Box (2026-04-29). Houses Temporal Continuity Steward — runnable form authored 2026-04-30 (ATOM-0028); dispatchable via `POST /api/agents/temporal_continuity_steward/run` per the unified-Box dispatch path wired by ATOM-0029 (`_agent_resolve_prompt` helper in `server.py`); first audit_only smoke test successful 2026-04-30 (ATOM-0030, receipt at `LEDGERS/BOXES/temporal_continuity/receipts/2026-04-30_22-29-11_run_synthesized_inline_atom_0030.json`, 6 stale-surface findings on TCL itself, zero false positives). Pattern stamp for all subsequent unified Boxes. |
| File Directory Box | `LEDGERS/BOXES/file_directory/` | **active (runnable, Phase B live)** | Houses File Directory Steward — the project's city-map auditor. Six-file unified Box pattern (box.json + BOX.md + steward/AGENTS.md, prompt.md, config.json + receipts/). Runnable form authored 2026-04-30 (ATOM-0036, fresh prompt.md authored alongside copied draft AGENTS.md/config.json since draft package didn't ship a prompt); route verified 2026-05-01 via `_agent_resolve_prompt` helper (ATOM-0037 — collapsed to 5-min helper-verification thanks to ATOM-0029); first audit_only smoke test successful 2026-05-01 (ATOM-0038, receipt at `LEDGERS/BOXES/file_directory/receipts/2026-05-01_01-06-44_run_98d71e32e4e7.json` — surfaced 3 drift categories: 3 top-level dirs missing from FDL (`_snapshots`, `scaffolded test`, `src`), 2 new aliases (`cowork_memory`, `LEDGERS/atlas`), 2 BOXES subdirs (`atlas`, `atoms`); zero false positives). Closes the file_directory_steward graduation chain (ATOM-0036 → 0037 → 0038 → 0039) and the parent PROB-2026-04-30-005 (steward sub-agent promotion) — 4 of 4 steward chains now complete (temporal_continuity / open_problems / north_star / file_directory). |
| Open Problems Box | `LEDGERS/BOXES/open_problems/` | **active (runnable, Phase B live)** | Houses Open Problems Steward — the project's drift-and-data-hygiene auditor for OPL itself. Three-file unified Box pattern (AGENTS.md 16116b / prompt.md 8539b / config.json 9276b with OPL-specific protocols: status_taxonomy, severity_taxonomy, urgency_taxonomy, decomposition_handoff, closure_audit_protocol, recurring_pattern_audit). Runnable form authored 2026-04-30 (ATOM-0032); route verified 2026-05-01 via `_agent_resolve_prompt` helper (ATOM-0033 — collapsed to 5-min helper-verification thanks to ATOM-0029); first audit_only smoke test successful 2026-05-01 (ATOM-0034, receipt at `LEDGERS/BOXES/open_problems/receipts/2026-05-01_00-47-42_run_755e3feea5ac.json` — found 3 duplicate PROB-IDs (PROB-2026-04-30-015 / PROB-2026-04-28-011 / PROB-2026-04-28-014), 9 entries missing canonical `Status:` line for data hygiene, 0 false-flag closures across 34 PROB entries). Pattern stamp shape mirrors the temporal_continuity Box. Closes the open_problems_steward graduation chain (ATOM-0032 → 0033 → 0034 → 0035). |
| North Star Box | `LEDGERS/BOXES/north_star/` | **active (runnable, Phase B live)** | Houses North Star Steward — the project's alignment auditor (Wholesome Enrichment + tradeoff awareness + §10 audit-question surfacing). Qualitatively different from state-freshness or inventory stewards. Runnable form authored 2026-04-30 (ATOM-0040, three files: AGENTS.md 14006b / prompt.md 8638b / config.json 10918b with NS-specific protocols); route verified 2026-04-30 via `_agent_resolve_prompt` helper (ATOM-0041); first alignment audit successful 2026-04-30 (ATOM-0042, receipt at `LEDGERS/BOXES/north_star/receipts/2026-04-30_23-01-16_run_synthesized_inline_atom_0042.json` — 4 classifications produced including a C-finding about unified-Box scaffolding inconsistency across 5 stewards; zero anti-goal proximity; zero false positives; all 10 §10 audit questions answered for today's three architectural decisions). Currently 3-file pattern only (steward/ subdir); parent-Box scaffolding (box.json + BOX.md + receipts/README.md) is the C-finding referenced above and the recommended follow-up work. |
| Atlas Ground-Truth Box | `LEDGERS/BOXES/atlas/` | **active (runnable, Phase B live; first ground-truth-source Box)** | First Box of `kind: ground_truth_source` (vs. `ledger`). Aliases `LEDGERS/atlas → /Users/jakeaaron/Documents/Atlas/` (Pieces MCP daily-folder output). Houses the Atlas Sweep Steward (`atlas_steward`) — runnable form authored 2026-04-30 (ATOM-0107); dispatchable via `POST /api/agents/atlas_steward/run` per the unified-Box dispatch path; first audit_only sweep ran inline 2026-05-01 (ATOM-0108, receipt at `LEDGERS/BOXES/atlas/receipts/2026-05-01_00-25-00_run_a8f3c7d12e44.json`, inaugural digest at `LEDGERS/BOXES/atlas/digests/2026-04-29.md`); resolution smoke test passed 2026-05-01 (ATOM-0109, caught + fixed atlas_sweep_steward → atlas_steward naming bug). Daily 8 AM ET cron at `CCAgentindex/triggers/atlas_daily_sweep.json` fires the sweep against yesterday's complete folder. Two-truths contract: Atlas wins for what-actually-happened-on-the-operator's-machine; project ledgers win for what-the-system-now-claims. Cross-ref `COMM-2026-04-30-007`, `SOURCE_OF_TRUTH §3.0`. |
| Audit Ledger | `LEDGERS/AUDIT.md` | **out-of-scope (2026-04-29)** | Removed from build queue per Jake — coverage absorbed by Open Problems, Decisions, Communications, and per-Box ledgers. Draft outline kept at `Ledger Drafts/# Audit Ledger.txt` for reference. Captured as DEPR-2026-04-30-002. |
| Deprecation Ledger | `LEDGERS/DEPRECATION.md` | **active** | Project-wide retirement audit trail. 4-state lifecycle (candidate → deprecated → archived → purged). Pairs with Snapshot Protocol §7 for recovery surface. Cardinal rule: nothing leaves the project without a Deprecation entry and a Snapshot reference. **Tier: global.** Authored under `DEC-2026-04-30-002`. |
| Deprecation (JSON mirror) | `LEDGERS/DEPRECATION.json` | **active** | Machine-readable mirror — entries, lifecycle, snapshot protocol, recovery procedure, anti-patterns, related ledgers. |
| Snapshot runner | `LEDGERS/scripts/snapshot.sh` | **active (manual)** | Bash runner producing daily/weekly/monthly/manual zip archives at `_snapshots/<cadence>/`. Phase A: manual invocation. Phase C: cron / launchd via Snapshot Steward. |
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
| Settings surface map (Settings → categories → persistence layers → affected systems) | `LEDGERS/VISUALS/settings_surface_map.mmd` | **active** |
| Box hierarchy map | `LEDGERS/VISUALS/box_hierarchy.mmd` | **active** |
| Box orientation flow | `LEDGERS/VISUALS/box_orientation_flow.mmd` | **active** |
| Page / API / data-flow map | `LEDGERS/VISUALS/page_api_dataflow.mmd` | planned |
| Source-of-truth flow | `LEDGERS/VISUALS/source_of_truth_flow.mmd` | planned |

---

## Phase A Complete — Phase B (Sub-agents) opens

**Phase A is officially complete as of 2026-04-29 (`DEC-2026-04-29-014`).** 17 active ledgers across project-level (16) + Page Ledgers (5). High-risk Page Ledger wave authored (boxes / intake / automation / delegations / settings page). Phase Ledger closes Phase A. Phase B (Sub-agents) is now unblocked.

**Phase B work** — graduate the 5 draft sub-agent packages at `/Subagent Boxes/` into runnable app agents under `CCAgentindex/agents/<name>/`. Author additional stewards for ledgers without a draft. See `PHASE.md` §4 for Phase B scope, exit criteria, and do-not-leak rules.

**Phase C runtime stays deferred** per `DEC-2026-04-29-013` (Reactive Box Network — schema canonical, runtime held).

### Historical build order (Phases 1–21)

1. ~~**Source-of-Truth Ledger**~~ — **landed 2026-04-29 (Phase 11)**. First ledger authored under DEC-2026-04-29-013 envelope-aware rule. PROB-001 schema-design criterion satisfied. Now live at `LEDGERS/SOURCE_OF_TRUTH.md`.
2. ~~**Connections Ledger**~~ — **landed 2026-04-29 (Phase 12)**. First domain-tier ledger. PROB-2026-04-28-009 closed. Now live at `LEDGERS/CONNECTIONS.md`.
3. ~~**File Contents Ledger**~~ — **landed 2026-04-29 (Phase 13)**. ~78 file entries across 10 categories. Now live at `LEDGERS/FILE_CONTENTS.md`.
4. ~~**Asset / Widget Map**~~ — **landed 2026-04-29 (Phase 14)**. Cross-page widget catalog + API→page mapping. Now live at `LEDGERS/ASSET_WIDGET_MAP.md`.
5. ~~**Settings Ledger**~~ — **landed 2026-04-29 (Phase 15)**. User-configurable surface across 3 persistence layers. Now live at `LEDGERS/SETTINGS.md`.
6. ~~**First Page Ledger (boxes)**~~ — **landed 2026-04-29 (Phase 16)**. Per-page deep-memory pattern established. Now live at `LEDGERS/PAGES/boxes.md`.
7. ~~**Second Page Ledger (intake)**~~ — **landed 2026-04-29 (Phase 17)**. Phase 1 unification architecture captured. Now live at `LEDGERS/PAGES/intake.md`. Next-up: automation, delegations, settings page (high-risk wave continues).
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

# Global Ledger

Last updated: 2026-04-30 (**Phase B momentum** — `LEDGERS/BOXES/atoms/` unified Box landed (Atomizer Steward declarative form authored, matches temporal_continuity pattern); PROB-005 (steward sub-agent promotion) atomized into 17 atoms; **queue depth now 43 atoms across 2 PROBs**. Earlier same-day: Atom Ledger (`DEC-2026-04-30-003`) + Deprecation Ledger (`DEC-2026-04-30-002`). 19 active ledgers + 2 unified Boxes.)
Maintainer: Jake / Comeketo Agent project agents
Repository: [RodbotCC/CCAgent](https://github.com/RodbotCC/CCAgent)
Default branch: `main`
Current phase: **Cleanup phase.** Plumbing-first build was scrapped under owner pressure (Rodrigo); UI rebuilt from working pieces; Auto/ payload symlinked into bedrock. Ledger Phases 1–5 + first steward live. Bedrock itself (`CCAgentindex/`) was bootstrapped on the fly and needs triad-based reconciliation (PROB-016, deferred until ledger + sub-agent buildouts settle).
Architectural spine: **Box + Ledger + Sub-agent triad.** Anything stateful gets all three. Legibility > build speed.
Current project state: Active build under cleanup discipline. Not greenfield. The triad is currently lopsided — more Boxes than Ledgers, more Ledgers than Sub-agents — and filling that grid is the dominant verb.
Read-first status: **Mandatory before meaningful edits.** Then read [`TEMPORAL_CONTINUITY.md`](TEMPORAL_CONTINUITY.md) for current moment, then [`OPEN_PROBLEMS_LEDGER.md`](OPEN_PROBLEMS_LEDGER.md) (esp. PROB-016).

> The repo is not just code. The repo is the memory of the build.

---

## 1. Project Identity

This project is a GitHub-backed AI operations system for **Comeketo Catering**. It combines client memory, inbox automation, page surfaces, ledgers, boxes, and agent-handoff systems into a durable file-tree orchestration environment.

The project is not just an app. It is a living operating layer around sales, client context, automations, and agent continuity.

The build philosophy is **file-tree-first**. Important memory should be versioned in GitHub, not trapped in chat history or local-only state. The local file tree is the working copy. GitHub is the source of truth.

Two principles bind everything together:

1. **The plan is not truth. The box is truth.** A seven-day plan is a draft strategy subordinate to comms, state, guardrails, approvals, and source-of-truth rules.
2. **If it matters to future work, it belongs in the versioned file tree.** Code, configuration, ledgers, decisions, open problems, page ownership, automation rules, human preferences, current project state, rebuild instructions, visual maps, audit notes, handoff notes — all of it.

---

## 2. Current World State

- GitHub (`RodbotCC/CCAgent`, branch `main`) is the source of truth.
- Local file tree at `/Users/jakeaaron/Downloads/CC Agent/` is the working copy.
- Working tree is currently dirty — there is unpushed local work. Coordinate with the human before any direct GitHub write.
- `CCAgentindex/` is the bedrock — the only filesystem state the app owns. The retired domains (`projects/`, `threads/`, `commitments/`, `knowledge/`) were wiped in the Apr 2026 great trim. Surviving domains: `people/`, `venues/`, `_ledger/`, `_inbox/`, `indexes/`.
- `Auto/` is a symlink to the team's standalone automation folder (`/Users/jakeaaron/Desktop/Auto/`). It holds 28 Client Boxes, 10 Staff Boxes, the orchestrator wiring, and the comeketo-inbox skill. Read freely; write only when the team explicitly asks (the orchestrator owns it).
- Client Boxes are becoming the canonical per-client memory/state layer. As of 2026-04-28 each of the 28 boxes carries `01_comms.md` (curated exec summary), `01b_comms_verbatim.md` (full Close.com transcripts and email bodies), and `comms/<type>_<date>_<id>.json` raw payloads (582 total).
- The Boxes UI page is a read/display surface over Client Boxes, Staff Boxes, and orchestrator state HTML. Specialized renderers exist for `hugo_casillas` and `brenda_steve`.
- Eleven UI routes survive after the Apr 2026 trim: `grid, settings, leads, clients, coworkers, contacts, briefing, activity, automation, intake, analytics`.
- Guardrails are being hardened because some early plans mixed strategy, enrichment, and executable copy too tightly. `Guardrails.html` and `comeketo-guardrails-agent.md` at project root are the current reference surfaces; the inbox skill at `Auto/comeketo-inbox/` carries the operational rules.
- Pieces.app is the memory backend (39 MCP tools) for activity, sweeps, and recall. The `Rodbot/` identity folder was wiped in the Apr 2026 trim — Pieces stands alone now.
- The first runnable ledger steward is active: `global_ledger_steward` lives in `CCAgentindex/agents/global_ledger_steward/` and runs through `POST /api/agents/global_ledger_steward/run`. Canonical steward materials live at `LEDGERS/AGENTS/global_ledger_steward/`.
- Current priority: make the system safer while preserving momentum. One ledger at a time. One client box at a time.

---

## 3. Major Systems

### 3.1 Client Boxes — `Auto/Client Boxes/`

Canonical per-client memory and operating substrate.

Owns:

- comms (`01_comms.md` curated; `01b_comms_verbatim.md` full transcripts; `comms/*.json` raw)
- state (`client_ledger.md`, `00_meta.json`)
- profile (`04_profile.md`)
- enrichment lanes — operational vs protected/off-limits
- seven-day plan (`05_seven_day_plan.md`)
- guardrail overlay (when present)
- approval notes
- audit markers
- per-lead specialized renderer slots (Hugo Casillas, Brenda & Steve so far)

Does not own: organization-wide truth, runtime state, UI surfaces.

### 3.2 Orchestrator — `Auto/orchestrator/`

Runtime/render/state layer. Holds the wiring, sweep outputs, and per-lead rollups for the standalone automation domain.

Owns:

- `wiring/automations.md` — the routine catalog
- `state/master_ledger.csv` and `state/today.html` — daily snapshots
- generated outputs and ready checks
- Hugo + Brenda-Steve routine implementations

Does not own: canonical client truth (that lives in Client Boxes).

### 3.3 Boxes Page — `BoxesScreen` in `screens.jsx`

UI surface for browsing and reading boxes.

Owns:

- box browsing, search, refresh/poll
- in-site dossier renderer (markdown-first, design-kit cards, admonition styling)
- right-click → delegations handoff
- per-box completeness scoring
- specialized per-lead renderers (Hugo, Brenda/Steve)

Does not own: client truth, plan authority, source-of-truth definitions.

### 3.4 Inbox Guardrails — `Auto/comeketo-inbox/` + `Guardrails.html` + `comeketo-guardrails-agent.md`

Safety contract for sends and Close inbox work. Overrides plans, profiles, enrichment, and automation momentum.

Owns:

- hard gates (fee waivers, discounts, scope promises, price guarantees)
- auto-pauses (reply received → plan stale)
- reply gates
- calendar reality
- frequency caps
- commitment approval requirements
- enrichment vs comms boundaries

### 3.5 Ledgers — `LEDGERS/` (this directory)

Project memory system. Continuity, orientation, definition-of-done, source-of-truth clarity, auditability, handoff memory. Steward agent packages live under `LEDGERS/AGENTS/`; the first active app agent is `global_ledger_steward`. See §8 for the full ledger map.

### 3.6 Meta Harness

Workflow layer that teaches agents how to operate safely. The current meta harness lives across `CLAUDE.md`, `AGENT.md`, `page_asset_sitemap.md`, this Global Ledger, and the read-first protocol in §10.

### 3.7 Bedrock — `CCAgentindex/`

The only filesystem state the app owns. Loader authority lives in `CCAgentindex/indexes/index.json`. Surviving domains: `people/`, `venues/`, `_ledger/`, `_inbox/`, `indexes/`. Retired in Apr 2026 trim: `projects/`, `threads/`, `commitments/`, `knowledge/`, `Rodbot/`.

### 3.8 Pieces Memory Backend

Local PiecesOS at `localhost:39300` provides 39 MCP tools across Ask, full-text search, vector search, and batch snapshot. Wired both server-side (`/api/pieces/*` endpoints in `server.py`) and into the Claude Code subprocess via `claude mcp add`. See `CLAUDE.md` Appendix — Pieces MCP integration.

---

## 4. Source-of-Truth Rules

> **Canonical home (2026-04-29):** [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) is now the project's authoritative source-of-truth ledger. The eight headline rules below are summary; the full per-domain trust orderings, Allowed-To-Know 4-bucket schema, conflict-resolution rules, and update protocol live there. Read SoT when resolving any conflict between two surfaces or designing automation that reads/writes state. From Phase 11 forward, this section stays as the orientation summary; new per-domain rules land in SoT, not here.

### 4.1 GitHub

GitHub (`RodbotCC/CCAgent`) is the durable source of truth for project memory, ledgers, code, configs, and handoff state.

### 4.2 Local file tree

The local file tree is the working copy. It may contain unpushed work. **Agents must check `git status` before any direct write to GitHub.** When in doubt, work locally and let the human push.

### 4.3 Client Boxes

For client-specific truth, trust in this order:

1. `01b_comms_verbatim.md` and `comms/*.json` — full Close.com record
2. `01_comms.md` — curated exec summary
3. `00_meta.json` — structured metadata
4. `client_ledger.md` — running operator log
5. approved operator notes
6. `04_profile.md` and `*_enrichment.md` — internal strategy only, **not customer-facing truth**

### 4.4 Generated outputs

Generated files are views, not primary truth, unless explicitly marked canonical. The orchestrator's `today.html` and `master_ledger.csv` are views of state, not state itself.

### 4.5 Plans

Seven-day plans (`05_seven_day_plan.md`) are strategy drafts. They do not override guardrails, current state, replies, approvals, or comms. **The plan is not truth. The box is truth.**

### 4.6 UI pages

UI pages render truth. They do not define truth unless explicitly stated in a Source-of-Truth Ledger entry.

### 4.7 Page-asset sitemap

`page_asset_sitemap.md` at project root is the operational truth for page/asset ownership. Any task that changes a page, route behavior, or page data binding is **not complete** until the sitemap is updated. This is the UI Done Gate. (See `CLAUDE.md` §5.5.)

### 4.8 Activity ledger

`CCAgentindex/_ledger/activity.jsonl` is the project's append-only audit trail. Every non-trivial delegation must leave a trace. Append only — never rewrite.

---

## 5. Global Operating Rules

1. Read before writing.
2. Prefer narrow, reversible changes.
3. Do not treat generated state as canonical unless marked.
4. Do not let plans override guardrails.
5. Risky automation moves require explicit approval.
6. If a client replies, their plan becomes stale until reviewed.
7. If a page or data binding changes, update `page_asset_sitemap.md`.
8. If project state changes, update the relevant ledger.
9. If a local directory has a Box, read it before editing there.
10. If a problem is found but not fixed, record it (Open Problems Ledger).
11. If a decision is made, record it (Decisions Ledger).
12. If a change would confuse a future agent, leave a handoff note.
13. Never invent paths. Use the canonical paths in `CLAUDE.md` §1 and this ledger.
14. Never invent fields. Read a sibling schema before creating a new bedrock entry.
15. Never write through the `Auto/` alias unless the team explicitly asks.

---

## 6. Active Workstreams

### Client Boxes hardening

Goal: every client box is safe, current, and usable by automation.
Posture: one box at a time. Audit, clean, leave marker, proceed.
Status (2026-04-28): all 28 boxes have full Close.com verbatim comms + raw payloads. Brenda & Steve received the first explicit audit/marker pass.

### Allowed-to-know constraints

Goal: separate comms-confirmed facts from enrichment-only/internal strategy in customer-facing copy.
Posture: needs implementation across Client Boxes. Profiles may carry useful internal strategy, but customer-facing copy must only use facts found in comms or with explicit operator approval.

### Ledger system buildout

Goal: create global and local memory layers for durable project continuity.
Posture: designing and implementing one ledger at a time, then giving the active ledgers steward agents. **Phases 1–5 are complete; the Global Ledger Steward is the first runnable ledger-maintenance agent.** See `LEDGERS/INDEX.md` for the full roster and order.

### Boxes page integration

Goal: the Boxes UI accurately reflects source Client Boxes and their safety state.
Posture: existing page focused on Hugo + Brenda/Steve while the design system finalizes; verbatim comms file (`01b_comms_verbatim.md`) is sitting in every box but not yet bound to a UI section.

### Inbox guardrail enforcement

Goal: every send passes the guardrail contract before leaving the system.
Posture: hard gates in place at the comeketo-inbox skill level; needs surfacing in the automation page so risky moves become explicit approval cards rather than batched approvals.

---

## 7. Active Risks / Known Fragile Areas

### Batch approval risk

Batch approval can hide high-risk moves. Fee waivers, discounts, scope promises, enrichment-based personalization, and pricing claims need **isolated** approval cards — not blended into a routine batch.

### Plan / guardrail contradiction

Some seven-day plans were written before guardrails were fully enforced. Plans may contain unsafe executable copy. **If a plan and a guardrail conflict, the guardrail wins.**

### Reply invalidates plan

Any meaningful inbound from a client can invalidate the existing seven-day plan. Plans must be re-checked against latest comms before any plan-driven send.

### Enrichment boundary

`04_profile.md` and `*_enrichment.md` may contain useful internal strategy, but customer-facing copy must only use facts from comms or explicit approval. Treat enrichment as planning fuel, not as content.

### GitHub / local drift

The working tree is currently dirty (modified `CCAgentindex/_ledger/pieces_sweeps.jsonl`, untracked `Auto/Client Boxes/Flávia Benson/Flávia Benson.txt`). Agents may write directly to GitHub while the human has unpushed local work. **Always `git status` before any direct GitHub write.**

### Auto/ alias write risk

`Auto/` is a symlink. Writing through it bypasses the orchestrator's ownership unless explicitly authorized. The 2026-04-28 verbatim comms backfill was an explicit team-authorized write; future writes need the same posture.

### Pieces session staleness

PiecesOS sessions can expire silently. The server retries automatically; if errors persist, restart `server.py` to drop the cached session. If PiecesOS isn't running, the Activity screen and `/api/pieces/*` will fail gracefully but visibly.

---

## 8. Ledger System Map

The Global Ledger is the world map. Local ledgers are neighborhood maps.

| Ledger | Owns | Status |
|---|---|---|
| Global Ledger | top-level world state, orientation, read-first | **active** (this file) |
| Temporal Continuity | current state across time, recent changes, active assumptions, next handoff | **active** ([`TEMPORAL_CONTINUITY.md`](TEMPORAL_CONTINUITY.md) + [`.json`](TEMPORAL_CONTINUITY.json)) |
| North Star | project thesis, 10 NS goals, anti-goals, tradeoff rules, audit questions | **active** ([`NORTH_STAR.md`](NORTH_STAR.md) + [`.json`](NORTH_STAR.json)) |
| File Directory | top-level + subdirectory map, ownership table, canonical vs generated, common wrong-turns | **active** ([`FILE_DIRECTORY_LEDGER.md`](FILE_DIRECTORY_LEDGER.md) + [`.json`](FILE_DIRECTORY_LEDGER.json)) |
| Open Problems | known/risky/incomplete/blocked work — protection system, not a shame file | **active** ([`OPEN_PROBLEMS_LEDGER.md`](OPEN_PROBLEMS_LEDGER.md) + [`.json`](OPEN_PROBLEMS_LEDGER.json)) — 13 active + 1 closed |
| Ledger Steward Agents | runnable/submittable agents that maintain ledgers and write receipts | **partial / active first agent** (`LEDGERS/AGENTS/global_ledger_steward/` + `CCAgentindex/agents/global_ledger_steward/`) |
| Source-of-Truth | universal trust ordering, per-domain trust orderings, Allowed-To-Know 4-bucket schema, conflict resolution, update protocol | **active (2026-04-29)** ([`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) + [`.json`](SOURCE_OF_TRUTH.json)) — first envelope-aware ledger; closes PROB-001 schema-design criterion |
| Definition of Done | completion standards by surface — Universal Done Gate + 11 work-type gates + Ledger Update Matrix | **active (2026-04-29)** ([`DEFINITION_OF_DONE.md`](DEFINITION_OF_DONE.md) + [`.json`](DEFINITION_OF_DONE.json)) |
| Box Ledger | what a Box is — definition, classes, status labels, BOX.md vs DIRECTORY.md, Local Agent Protocol | **active (2026-04-29)** ([`BOX_LEDGER.md`](BOX_LEDGER.md) + [`.json`](BOX_LEDGER.json)) |
| Box Bus Ledger | how Boxes connect — `box.json` manifest schema, ledger envelope, 3 routing tiers, 3 interpreter tiers, cycle policy, two worked examples; **runtime deferred to Phase C** | **active schema-only (2026-04-29)** ([`BOX_BUS_LEDGER.md`](BOX_BUS_LEDGER.md) + [`.json`](BOX_BUS_LEDGER.json)) — locked by `DEC-2026-04-29-013` |
| Directory | file tree map | superseded — see File Directory Ledger above |
| Directory Configuration | local "you are here" rules | superseded — see Box Ledger above (subsumes the concept under a unified name; templates remain at `LEDGERS/LOCAL_TEMPLATE/`) |
| File Contents | per-file role inventory — ~78 entries across 10 categories (purpose, owns, type, dependencies, common mistakes) | **active (2026-04-29)** ([`FILE_CONTENTS.md`](FILE_CONTENTS.md) + [`.json`](FILE_CONTENTS.json)) — tier: global; first project-wide file inventory |
| Asset / Widget Map | cross-page widget catalog (7 categories) + API→page mapping (10 endpoint groups) + shared services registry + cross-page state + change-radius hints | **active (2026-04-29)** ([`ASSET_WIDGET_MAP.md`](ASSET_WIDGET_MAP.md) + [`.json`](ASSET_WIDGET_MAP.json)) — tier: domain; sitemap remains canonical per-page truth |
| Connections | external-system inventory + per-service contracts (credentials/failure modes/verification/billing/fallback) | **active (2026-04-29)** ([`CONNECTIONS.md`](CONNECTIONS.md) + [`.json`](CONNECTIONS.json)) — first domain-tier ledger; closed PROB-009 |
| Decisions | major choices and why | **active (2026-04-29)** ([`DECISIONS_LEDGER.md`](DECISIONS_LEDGER.md) + [`.json`](DECISIONS_LEDGER.json)) — 12 active decisions, 1 needs-review, 5 promoted from Communications |
| Communications | handoffs, warnings, lessons, preferences, attempts, cross-system coordination | **active (2026-04-29)** ([`COMMUNICATIONS_LEDGER.md`](COMMUNICATIONS_LEDGER.md) + [`.json`](COMMUNICATIONS_LEDGER.json)) — 18 seeded entries |
| Prompt / Reconstruction | how important things were built | planned |
| Scout | tool/model/workflow research | planned |
| Audit | audit findings and follow-up | **out-of-scope (2026-04-29)** — removed from build queue; coverage absorbed by Open Problems / Decisions / Communications / per-Box ledgers |
| Phase | current phase + exit criteria + do-not-leak rules + transition protocol + anti-patterns | **active (2026-04-29)** ([`PHASE.md`](PHASE.md) + [`.json`](PHASE.json)) — **Phase A Complete** per `DEC-2026-04-29-014` |
| Page Ledgers | page-specific deep memory (one per route — narrative beyond sitemap) | **partial (5 of 14; high-risk wave complete)** ([`PAGES/`](PAGES/)) — records: [`boxes.md`](PAGES/boxes.md), [`intake.md`](PAGES/intake.md), [`automation.md`](PAGES/automation.md), [`delegations.md`](PAGES/delegations.md), [`settings.md`](PAGES/settings.md). Pattern at [`PAGES/_README.md`](PAGES/_README.md). Lower-risk 9 routes deferred per Phase A exit policy. |
| Widget Ledgers | widget-specific memory | planned |
| Settings | user-configurable surface — 11 settings across 3 persistence layers (`.env` / `localStorage.secretary.tweaks` / runtime); demo mode + provider exclusivity + credential save/clear with audit | **active (2026-04-29)** ([`SETTINGS.md`](SETTINGS.md) + [`.json`](SETTINGS.json)) — tier: global; pairs with `CONNECTIONS.md` |
| Deprecation | project-wide retirement audit trail — 4-state lifecycle (candidate → deprecated → archived → purged) + Snapshot Protocol §7 (recovery surface, daily/weekly/monthly/manual cadences, `_snapshots/` at project root, gitignored) + manual `LEDGERS/scripts/snapshot.sh` runner; cardinal rule: nothing leaves the project without a Deprecation entry and a Snapshot reference | **active (2026-04-30)** ([`DEPRECATION.md`](DEPRECATION.md) + [`.json`](DEPRECATION.json)) — tier: global; 4 backfill entries; locked by `DEC-2026-04-30-002` |
| Atoms | operational layer below Open Problems — PROBs decompose 1:N into single-session claimable atoms; 6-state lifecycle (`available` → `claimed` → `in_progress` → `completed` \| `blocked` \| `abandoned`); single-writer claim protocol; 4h granularity rule; Phase A proof: PROB-2026-04-28-016 atomized into 26 atoms | **active (2026-04-30)** ([`ATOMS.md`](ATOMS.md) + [`.json`](ATOMS.json)) — tier: global; 26 atoms; locked by `DEC-2026-04-30-003` |

See `LEDGERS/INDEX.md` for paths, ownership, and build order.

---

## 9. Box System Map

A Box is the living memory and configuration layer for a directory.

A Box should answer:

- Where am I?
- What does this area own?
- What should never happen here?
- What source of truth applies?
- What files matter?
- What ledgers apply locally?
- What changed recently?
- What problems are open?
- What should be updated when work happens?

Important project boxes:

- **Client Boxes** — `Auto/Client Boxes/<Name>/` (28 active)
- **Staff Boxes** — `Auto/Staff Boxes/` (10 voice profiles)
- **Orchestrator Box** — `Auto/orchestrator/`
- **Inbox Skill Box** — `Auto/comeketo-inbox/`
- **App / UI Box** — project root `.jsx` / `.js` / `.html` / `server.py` (no formal Box file yet — planned)
- **Automation Box** — automations live across `Auto/orchestrator/wiring/` and the `automation` UI page (planned formal Box)
- **Ledger Box** — `LEDGERS/` (this directory)

The Global Ledger does not define every box in detail. Each Box owns its local truth. The first formal Box scaffolds live at `LEDGERS/LOCAL_TEMPLATE/`.

> Do not solve local complexity globally if it belongs inside a Box.

---

## 10. Agent Work Protocol

Before meaningful edits:

1. Read `LEDGERS/GLOBAL_LEDGER.md` (this file).
2. Identify the affected system (§3).
3. Read the relevant local Box or directory orientation.
4. Read source-of-truth rules for the data being changed (§4).
5. Check open problems and recent audit notes (Open Problems / Audit Ledgers when they exist).
6. Inspect current files. Read a sibling schema before inventing a new one.
7. Make the smallest safe change.
8. Run available checks or explain why not.
9. Update affected ledgers (Done Gate, §11).
10. Leave a handoff note if future agents need context (Communications Ledger when it exists).
11. Commit with a clear message.
12. **Push to GitHub only after confirming no local-only work would be overwritten.**

For risky areas (automation, sends, client plans, approval gates, source-of-truth bindings, generated state), **stop and check guardrails before writing.**

For Close inbox work specifically, the comeketo-inbox skill at `Auto/comeketo-inbox/` is the operational contract. It overrides plans, profiles, and enrichment.

---

## 11. Done Gate

> Work is not complete until the memory of the work is updated.

The full standard lives in [`DEFINITION_OF_DONE.md`](DEFINITION_OF_DONE.md) — the project's authoritative completion ledger. Read it when closing any meaningful task. The list below is the short version of that ledger's Universal Done Gate + Ledger Update Matrix.

Meaningful changes must update the relevant continuity surface:

- Changed project state → update Global Ledger §2 / §6 / §12 (or Temporal Continuity Ledger when it exists).
- Changed a page, route, or data binding → update `page_asset_sitemap.md`.
- Changed folder ownership → update Directory Ledger.
- Changed a client plan → update the box's `client_ledger.md` and append to `CCAgentindex/_ledger/activity.jsonl`.
- Changed source-of-truth rule → update §4 here AND the Source-of-Truth Ledger.
- Made a major decision → update Decisions Ledger.
- Found but did not fix a problem → update Open Problems Ledger.
- Changed a repeatable process → update Prompt / Reconstruction Ledger.
- Completed an audit → update Audit Ledger.
- Performed any non-trivial delegation → append to `CCAgentindex/_ledger/activity.jsonl`.

Short version: **if the system changed, the system's memory changes with it.**

---

## 12. Recently Changed

### 2026-04-30 — Atom Ledger landed (Phase B momentum)

- **Atom Ledger created at global tier.** Added [`ATOMS.md`](ATOMS.md) + [`ATOMS.json`](ATOMS.json). Operational layer below Open Problems — PROBs decompose 1:N into single-session claimable atoms. 6-state lifecycle (`available` → `claimed` → `in_progress` → `completed` plus `blocked` and `abandoned`). Single-writer claim protocol enables parallel agent work without collision. 4h granularity rule caps atom size; bigger gets re-decomposed. Acceptance criteria standard: concrete (file/endpoint/ledger row), verifiable in one pass, tied to artifacts that exist after the session.
- **PROB-2026-04-28-016 (bedrock reconciliation) atomized as the proof.** Decomposed into 26 atoms: 2 gate atoms (verify ledger + sub-agent buildout reached threshold) + 20 directory-audit atoms (one per bootstrap-era CCAgentindex/ subdir: analytics, annotations, catalog, charts, commitments, hooks, intake_reports, intelligence, knowledge, people, projects, reports, Rodbot, scheduled_tasks, summaries, tables, threads, triggers, venues, workflows) + 4 propagation atoms (update `indexes/index.json`, `FILE_DIRECTORY_LEDGER.md`, `mission_control_loader.js`, `CLAUDE.md`). Total estimated effort: ~21.5h, broken into single-session pieces. All 26 atoms `available`; gates 0001/0002 block all 20 audit atoms; audit atoms block all 4 propagation atoms.
- **Architectural lock at [`DEC-2026-04-30-003`](DECISIONS_LEDGER.md).** Reasoning: monolithic PROBs were freezing the project (PROB-016 deferred 2 days). Per-PROB-inline atoms muddle Open Problems' purpose; per-Box atom queues lose the dependency graph; session-scoped tasks don't persist. Global-tier ledger with mandatory parent_problem_id cross-link is the right shape.
- **Phase B follow-up scoped.** Atomizer Steward at `LEDGERS/BOXES/atoms/steward/` — sub-agent that reads new PROBs, proposes atoms to a `DRAFTS/ATOMIZATION/` review queue, sweeps stale claims (>24h with no `in_progress_at`), surfaces PROB-closure-eligible candidates. Decompose remaining 12 active PROBs as queue depth allows.
- **Phase C runtime scope.** `/api/atoms/{list,claim,complete,release}` endpoints; atoms become first-class Box Bus envelope citizens; UI surface (Atoms panel) lands naturally near `automation` route.
- **Cross-ledger pairing.** Open Problems §5 PROB-016 entry now carries `**Atomized:** see ATOMS-XXXX through ATOMS-YYYY` cross-link. Definition of Done §5 work-type gates inherit atom-level. Decisions Ledger gains DEC-2026-04-30-003 (architectural lock + 4 rejected alternatives). Communications Ledger gains COMM-2026-04-30-002 (handoff for next agents claiming).
- **19 active ledgers.** Up from 18.

### 2026-04-30 — Deprecation Ledger landed (Phase B opener)

- **Deprecation Ledger created at global tier.** Added [`DEPRECATION.md`](DEPRECATION.md) + [`DEPRECATION.json`](DEPRECATION.json). Captures project-wide retirement audit trail with 4-state lifecycle (`candidate` → `deprecated` → `archived` → `purged`) plus `reversed` / `recovered` for round-trips. Cardinal rule: **nothing leaves the project without a Deprecation entry and a Snapshot reference.** Required-fields schema covers identity, lifecycle dates, supersession, snapshot reference, recovery difficulty, incoming-link audit status, retention policy. The §5 incoming-link audit is mandatory before any entry promotes from `candidate` → `deprecated`.
- **Snapshot Protocol (Deprecation §7) ships with manual runner.** Daily / weekly / monthly / manual cadences with retention rules (7 / 4 / 12 / indefinite). Snapshot zips live at `_snapshots/<cadence>/` at the **project root** (gitignored — local-only recovery infrastructure, not source of truth). Storage layout: `_snapshots/daily/`, `_snapshots/weekly/`, `_snapshots/monthly/`, `_snapshots/manual/`. Naming pattern: `snapshot_<YYYY-MM-DD>_<HHMM>_<cadence>[_<reason-slug>].zip`. Recovery key on every entry: `(snapshot_id, snapshot_path)`. Manual bash runner at [`LEDGERS/scripts/snapshot.sh`](scripts/snapshot.sh) with auto-detected project root, cadence-specific include/exclude rules, retention pruning, activity-ledger appending. `.gitignore` updated to exclude `_snapshots/`. Phase A: manual invocation. Phase C: cron / launchd via Snapshot Steward.
- **Architectural lock at [`DEC-2026-04-30-002`](DECISIONS_LEDGER.md).** Reasoning: per-Box deprecation would scatter the audit trail; deprecation is project-wide and cross-cutting; snapshots are inherently global; recovery needs a single source. Rejected alternatives: per-Box-only, git-history-only, separate snapshot ledger, snapshots in bedrock, defer to Phase C.
- **Four backfill DEPR entries seeded.** `DEPR-2026-04-30-001` Apr 2026 great-trim retired bedrock domains (`projects/`, `threads/`, `commitments/`, `knowledge/`); `DEPR-2026-04-30-002` Audit Ledger never-built (paired with `DEC-2026-04-29-004`); `DEPR-2026-04-30-003` sub-agent draft package relocation (root → `/Subagent Boxes/`); `DEPR-2026-04-30-004` Apr 2026 trim retired UI routes (13 routes). All backfills are `archived` status. Cleans up the existing retirement debt that was captured in `CLAUDE.md` and `GLOBAL_LEDGER` but never given a formal record.
- **Phase B follow-up scoped.** The unified Box pattern (`DEC-2026-04-29-015`) will land `LEDGERS/BOXES/deprecation/` to match `temporal_continuity/`. Steward sub-agent will: sweep `candidate` entries for 30-day staleness, run §7.7 snapshot health checks, accept incoming deprecation candidates from any Box.
- **Cross-ledger relationships explicit.** Deprecation entries cross-reference Decisions / Open Problems / Communications. Affected domain ledgers (FCL / AWM / Connections / Page Ledgers) drop their rows when something deprecates. DoD §11 (Ledger Update Matrix) gains a row for "deprecation occurred → DEPRECATION + activity" (Phase B follow-up).
- **18 active ledgers.** Up from 17 with the Deprecation Ledger landing.

### 2026-04-29 — PHASE A COMPLETE

- **Phase A officially complete (`DEC-2026-04-29-014`).** 17 active ledgers across global + domain tiers. High-risk Page Ledger wave done (boxes / intake / automation / delegations / settings page). Phase Ledger ([`PHASE.md`](PHASE.md) + [`PHASE.json`](PHASE.json)) closes the phase by naming current phase / exit criteria / do-not-leak rules / transition protocol / anti-patterns. Phase B (Sub-agents) is now unblocked. Phase C runtime stays deferred per `DEC-2026-04-29-013`. Lower-risk 9 Page Ledgers + Widget Ledgers + Prompt/Reconstruction + Scout + per-directory Box.md stamps explicitly deferred (Phase B/C work as needed). Companion Communications entry: `COMM-2026-04-29-015`. Activity log: 6 events (4 Page Ledger landings + Phase Ledger landing + decision recorded + phase_transition).
- **Phases 18–21: Three Page Ledgers + Phase Ledger.** [`PAGES/automation.md`](PAGES/automation.md) (highest-risk write surface; 5 sub-tabs catalog), [`PAGES/delegations.md`](PAGES/delegations.md) (the project's send chokepoint; `DEC-2026-04-28-005` two-step submit→approve enforcement captured), [`PAGES/settings.md`](PAGES/settings.md) (per-page deep memory pairs with global SETTINGS.md ledger), [`PHASE.md`](PHASE.md) (the closer).
- **Phase 17: Second Page Ledger landed — high-risk wave underway.** Added [`LEDGERS/PAGES/intake.md`](PAGES/intake.md) + [`LEDGERS/PAGES/intake.json`](PAGES/intake.json). The intake Page Ledger is the natural pair to `boxes.md` — both are windows into the same Client Box (per `DEC-2026-04-29-005..008`). Captures the load-bearing Phase 1 unification architecture: **Box Reports synthesized over `Auto/Client Boxes/<Name>/` with refresh-on-read** (no `report.json` written into the box, no drift surface), **Reports list split** (Box Reports auto + Workspaces manual), **ingest path writes into `Auto/Client Boxes/<Name>/intake_drops/`** (the Box stays the only writer of canonical content), **conversation history at `CCAgentindex/reports/_box_conversations/<box_id>.jsonl`** (append-only), and the deferred **Phase 2 box-aware ask path** (per-Box `AGENTS.md` plumbing into `/api/reports/<slug>/ask` system prompt — pending). Per-endpoint Box-vs-Workspace behavior matrix documented for all 8 `/api/reports/*` paths (slug-collision refusal, deletion refusal, document-delete refusal). 5 page-specific guardrails (allowed-to-know discipline, ingest-not-canonical, delegations-as-highest-risk, identity-uniqueness, refresh-on-read awareness). Future direction articulated through Phase 2 (box-aware ask) → Phase B (intake steward) → Phase C (intake_drops shifts from operator reference to automation input surface). Tier: domain. `_README.md` status flipped intake → active. Companion Communications entry: `COMM-2026-04-29-014`. **Honest accounting given to Jake**: structurally complete now; ~3 more substantive Page Ledgers (automation, delegations, settings page) + Phase Ledger = Phase A done.
- **Phase 16: First Page Ledger landed — per-page deep-memory pattern established.** Added [`LEDGERS/PAGES/boxes.md`](PAGES/boxes.md) + [`LEDGERS/PAGES/boxes.json`](PAGES/boxes.json) + [`LEDGERS/PAGES/_README.md`](PAGES/_README.md). The page-asset sitemap stays canonical for per-page operational truth (UI Done Gate, `DEC-2026-04-29-007`); Page Ledgers are the **narrative** layer — *why* each page exists, how it evolved, what shaped its architecture. The boxes Page Ledger is substantive: 16 sections covering purpose, use case, route+render ownership, data sources + APIs, writes/side-effects, source-of-truth rules with explicit per-rank rendering map (rank 2 verbatim comms NOT YET UI-bound is the load-bearing gap surfaced), widgets on page, supported states, page-specific guardrails (5 beyond global), local-stricter Done Gate (9 checks beyond DoD §5.3), open page problems (5 specific to this page), narrative recent changes spanning 2026-04-27 → 2026-04-29 with the *why* behind every sitemap entry, architectural rationale (5 design choices defended), future direction through Phase C runtime. Tier: domain. `_README.md` stamps the directory with the per-page authoring template + 14-page status table + anti-pattern naming ("don't author all 14 at once — better one well-grounded record than 14 thin stubs"). High-risk first-wave priority: `intake`, `automation`, `delegations`, `settings`. Companion Communications entry: `COMM-2026-04-29-013`. Steward agent not yet authored — Phase B work.
- **Phase 15: Settings Ledger created — user-configurable surface inventory.** Added [`SETTINGS.md`](SETTINGS.md) + [`SETTINGS.json`](SETTINGS.json) + [`VISUALS/settings_surface_map.mmd`](VISUALS/settings_surface_map.mmd). Pairs cleanly with Connections — Connections names what services exist; Settings names what's user-changeable through the UI. **11 settings cataloged across 3 persistence layers**: server-side `.env` (connector credentials, allowlisted: `CLOSE_API_KEY`, `CLICKUP_API_TOKEN`, `OPENAI_API_KEY`, `GITHUB_TOKEN`, plus Slack/Twilio/Pieces/Browser-use vars), client-side `localStorage.secretary.tweaks` (theme, demoMode, aiProvider 3-way exclusive, openaiModel, piecesModel, promptEnhance, browserUse.* 4 sub-fields), runtime-only (MCP server status registry from `/api/status`). Codified: **demo mode rule** (safest send-blocker; server proxy double-checks even if UI bypassed), **provider exclusivity rule** (claude_code / openai / codex_cli mutually exclusive — only the selected provider receives chat/test/generate prompts), **credential save/clear flow** with audit log to `_ledger/activity.jsonl` (key name only, never value), **allowlist gate** for new credential editors. Operator quick-reference table for "where do I change X?" included. Tier: global. Cross-references CONNECTIONS §5 (env-var roster), ASSET_WIDGET_MAP §6.1 (full localStorage registry), sitemap §settings (canonical UI Done Gate), DoD §5.8. Companion Communications entry: `COMM-2026-04-29-012`. Steward agent not yet authored — Phase B work.
- **Phase 14: Asset / Widget Map created — first cross-cutting UI catalog.** Added [`ASSET_WIDGET_MAP.md`](ASSET_WIDGET_MAP.md) + [`ASSET_WIDGET_MAP.json`](ASSET_WIDGET_MAP.json) + [`VISUALS/page_widget_dependency.mmd`](VISUALS/page_widget_dependency.mmd). Sits one altitude above the page-asset sitemap: sitemap remains canonical per-page truth (UI Done Gate, `DEC-2026-04-29-007`); this ledger is the **cross-cutting catalog**. Captures: 14-page index, **shared widget catalog** (7 categories — chrome `Topbar`/`BottomStrip`, cross-page overlays `FullscreenCell`/`TweaksPanel`/`EditWithRodbotOverlay`/`AIBanner`, the `useContextMenu` hook wired across 9 surfaces, the People-page primitive shared by 5 routes, Box specialized renderers Hugo/Brenda, `boxes-md-rich` markdown rendering, `SecretaryConnectors` channel picker on 4 pages), **API → page mapping** (10 endpoint groups → which pages consume them), **shared services registry** (10 `window.*` objects), **cross-page state** (7 `localStorage` keys + 3 `window` events), **change-radius hints** (10 "if you change X, recheck Y" rules). Tier: domain. Cross-references sitemap as canonical per-page detail; FILE_CONTENTS for file-role pairing; CONNECTIONS for service→page; DoD §5.3 + §5.4. Companion Communications entry: `COMM-2026-04-29-011`. Steward agent not yet authored — Phase B work.
- **Phase 13: File Contents Ledger created — first project-wide file inventory.** Added [`FILE_CONTENTS.md`](FILE_CONTENTS.md) + [`FILE_CONTENTS.json`](FILE_CONTENTS.json) + [`VISUALS/file_contents_index.mmd`](VISUALS/file_contents_index.mmd). **~78 load-bearing files inventoried across 10 categories**: 13 ledgers, 17 runtime-frontend (`app.jsx`, `screens.jsx`, `components.jsx`, `connectors.js`, `ai_*.js`, `mission_control_loader.js`, `Secretary.html`, `styles.css`, etc.), 1 runtime-backend (`server.py`), 8 meta-harness (`CLAUDE.md`, `AGENT.md`, `page_asset_sitemap.md`, `Guardrails.html`, etc.), 11 orchestrator (every `Auto/orchestrator/bin/*` + `wiring/automations.md` + `state/*` generated outputs), 5 inbox-skill (`SKILL.md`, scripts, menu data), 4 bedrock-index (`indexes/index.json`, `_ledger/activity.jsonl`, `_inbox/inbox.jsonl`, `agents/<name>/`), 16 client-box-convention (`00_meta.json` through `15.0*_outcome.md`, `client_ledger.md`, `<date>_audit_marker.md`, planned `allowed_to_use.json`), 1 staff-box-convention, 2 templates. Each entry: purpose (one paragraph), owns, type label (canonical / generated / template / append-only / strategy-draft / internal-only), edit guidance, dependencies, companion-file rules, common mistakes, verification, related ledgers/decisions. Tier: global. Cross-references SoT trust orderings (per-Box files now have explicit ranks 1-9), DoD §5.5 + §5.7 Done Gates, Connections (services → which files use them), Decisions, Open Problems. **Closes the "where do I start with this file?" onboarding gap** — a new agent reading an unfamiliar file can find its job in one lookup. Companion Communications entry: `COMM-2026-04-29-010`. Steward agent not yet authored — Phase B work.
- **Phase 12: Connections Ledger created — first domain-tier ledger.** Added [`CONNECTIONS.md`](CONNECTIONS.md) + [`CONNECTIONS.json`](CONNECTIONS.json) + [`VISUALS/connections_dependency_map.mmd`](VISUALS/connections_dependency_map.mmd). Inventoried every external service the project depends on, **with grep evidence** against `server.py` imports, `/.env` keys, `connectors.js`, and `docs/connectors.md`. **11 active services** (Close, GitHub, local app server, Pieces, ClickUp, Twilio, Slack, OpenAI, Cowork scheduled tasks, Claude Code, Browser Use, plus credential infrastructure), **2 planned** (Google Calendar, Email), **3 not-in-use** (Supabase, Google Drive, Anthropic API direct — all explicitly grep-evidenced as not wired). Twilio (which the original draft outline missed) is registered with full WhatsApp + SMS credential map. Slack token-format issue (`xapp-` vs `xoxb-`) is flagged as an open problem candidate. **No raw secrets** — only env var names and locations. Each service card includes credentials field (env var names only), failure mode, side-effect risk, verification steps, fallback, billing/quota notes, related ledgers. Ledger declares `tier: domain` and cross-references `BOX_BUS_LEDGER §2.1` (manifest `subscribes[]` field rule-bound here) — proving envelope-aware authoring works at non-global tier. **PROB-2026-04-28-009 closed** (single close-criterion satisfied). Companion Communications entry: `COMM-2026-04-29-009`. Activity log: 2 events (`ledger_phase_landed` + `open_problem_closed`). Steward agent not yet authored — Phase B work.
- **Phase 11: Source-of-Truth Ledger created — first envelope-aware ledger.** Added [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) + [`SOURCE_OF_TRUTH.json`](SOURCE_OF_TRUTH.json) + [`VISUALS/source_of_truth_flow.mmd`](VISUALS/source_of_truth_flow.mmd). Consolidated rules from Global §4 + NS-06 + FDL §6 + DoD §5.5 into one canonical home. Captured: universal trust ordering (6 ranks: system-of-record → verbatim → curated → operator notes → strategy → generated views), per-domain trust orderings (Client truth, Page/UI truth, Project state truth, Settled rules truth, External system truth), generated-vs-canonical rule, plans-vs-comms rule, **Allowed-To-Know 4-bucket schema** (`comms_confirmed` / `internal_strategy` / `protected` / `approval_required`) with per-Client-Box implementation contract — this closes the schema-design close-criterion of `PROB-2026-04-28-001` (status `open` → `partial`). First ledger authored under `DEC-2026-04-29-013` envelope-aware rule: declares tier=`global`, cross-references `BOX_BUS_LEDGER.md` §2.1 for manifest `source_of_truth` field semantics. Global §4 updated to point at SoT as canonical home (this section is now orientation summary; per-domain rules live in SoT). Companion Communications entry: `COMM-2026-04-29-008`. Activity log: 2 events (`ledger_phase_landed` + `open_problem_status_change`). Steward agent not yet authored — Phase B work, will live at `/Subagent Boxes/source_of_truth_subagent_package/`.
- **Phase 10: Box Bus Ledger created — Reactive Box Network architecture locked.** Added [`BOX_BUS_LEDGER.md`](BOX_BUS_LEDGER.md) + [`BOX_BUS_LEDGER.json`](BOX_BUS_LEDGER.json) + three Mermaid visuals ([`box_bus_topology`](VISUALS/box_bus_topology.mmd), [`interpreter_tiers`](VISUALS/interpreter_tiers.mmd), [`envelope_routing_flow`](VISUALS/envelope_routing_flow.mmd)). The ledger specifies the project's target architecture: a reactive network of Boxes connected by a routed Ledger bus. Schema-only ship — no runtime, no router, no interpreters yet. Captured: `box.json` manifest schema (one shape for all box kinds), ledger envelope schema (one shape for every entry), three routing tiers (Global / Domain / Local with declared trickle-down direction), three interpreter tiers (T1 deterministic ~80% / T2 small-LLM ~15% / T3 full sub-agent ~5%), hard-refusal cycle policy, "what is a Box / what is not" binding rule, two worked examples (Hugo Casillas Client Box + Analytics Source Channels Snapshot Box), validation rules for Phase C, build sequence through Phase C+1. Architectural lock at [`DEC-2026-04-29-013`](DECISIONS_LEDGER.md): runtime deferred to Phase C, schema canonical now. Box Ledger updated to point at Bus Ledger for the manifest schema (concept lives in Box Ledger, wire shape lives in Bus Ledger). Definition of Done §5.7 (Box / Directory Work) gained a `box_json_manifest_stub_present_or_planned` check — soft today, hard at Phase C. Companion Communications entry: `COMM-2026-04-29-007`. **Effect on Phase A:** every remaining ledger ships envelope-aware (declares tier + entry kind); every new Box ships with a manifest stub. Zero migration debt at Phase C.
- **Phase 9: Definition of Done Ledger created.** Added [`DEFINITION_OF_DONE.md`](DEFINITION_OF_DONE.md) + [`DEFINITION_OF_DONE.json`](DEFINITION_OF_DONE.json) + [`VISUALS/done_gate_flow.mmd`](VISUALS/done_gate_flow.mmd) + [`VISUALS/build_rhythm_55_45.mmd`](VISUALS/build_rhythm_55_45.mmd). Ingested from `Ledger Drafts/# Deliverables : Definition of Done Ledger.txt` with three adjustments to match current project state: Audit Ledger references re-pointed at Open Problems / Decisions / Communications / per-Box (Audit dropped from build queue 2026-04-29 per `DEC-2026-04-29-012`); Triad spine + Box Ledger references woven in (`DEC-2026-04-29-001`); page-asset sitemap explicitly elevated as the canonical UI Done Gate. Ledger contains: Universal Done Gate (8 questions), 11 work-type Done Gates (Client Box, Automation, Page/Route, Widget, Source-of-Truth, Ledger, Box/Directory, External Connection, Decision, Open Problem, Reconstruction), Ledger Update Matrix (the fastest reference — "if X changed, update Y"), 55/45 build rhythm, "what does not count as done" patterns, local-stricter-gates override rule, North Star alignment (NS-01, NS-06, NS-09, NS-10 directly supported). Steward agent not yet authored — Phase B work, will live at `/Subagent Boxes/definition_of_done_subagent_package/`.
- **Box Ledger registered into INDEX + Global §8.** `BOX_LEDGER.md` + `BOX_LEDGER.json` landed earlier today (Phase 8) but had not yet been listed in `INDEX.md` or §8 of this ledger. Both now point at it. The "Directory Configuration Ledger" planned row is now marked superseded — Box Ledger subsumed the concept under a unified name. Templates at `LEDGERS/LOCAL_TEMPLATE/` remain canonical.
- **Phase 1 Intake → Box unification shipped (read-only synthesis).** Every Client Box is now addressable from the Intake page as a Box Report. Reports list splits into **Box Reports** (auto, 28 entries, top) and **Workspaces** (manual, below). `/api/reports/get?slug=<box_id>` synthesizes a `documents[]` payload on every call by walking `Auto/Client Boxes/<Name>/` — no `report.json` is written into the box, no drift surface (`DEC-2026-04-29-005`). Slug = box id directly (`hugo_casillas`, `brenda_steve`, etc.) — no synthetic prefix (`DEC-2026-04-29-006`). Box Reports refresh on every read; Workspaces keep their stored `report.json` (`DEC-2026-04-29-007`). The ask path is unchanged generic — per-box `AGENTS.md` plumbing is explicitly deferred to Phase 2 (`DEC-2026-04-29-008`). Ingest on a Box Report writes into `Auto/Client Boxes/<Name>/intake_drops/<file>` so the box stays the only writer of canonical content. Conversation history lives at `CCAgentindex/reports/_box_conversations/<box_id>.jsonl`. Cross-navigation: Boxes-page right-click on a Client Box now exposes "Open as Intake Report →"; Intake's Box Report header carries an "open in boxes →" handoff. Server changes: new `_box_report_lookup`, `_box_report_synthesize`, `_box_report_ingest`, `_box_report_*_conversation` helpers in `server.py`, with branches in `_reports_get` / `_reports_ask` / `_reports_ingest` / `_reports_doc_delete` / `_reports_create` / `_reports_delete`. Frontend: split list rendering in `IntakeReportsList`, "box report" eyebrow + "open in boxes" pill in `IntakeReportDetail`, route-param wiring in `IntakeScreen` and `BoxesScreen`, app router updates in `app.jsx`. Plan: `LEDGERS/Drafts/intake_box_unification_plan.md`. Done Gate: `page_asset_sitemap.md` updated for both `intake` and `boxes` pages; `Secretary.html` cache-busts bumped (`screens.jsx` 94→95, `app.jsx` 52→53). The bigger reactive-box-bus / ledger-trickle-down architecture discussed in this session is **explicitly deferred** until the ledger taxonomy and sub-agent fleet are stable, per the Phase A → B → C discipline (`DEC-2026-04-29-002`).
- **Phase 7: Decisions Ledger created.** Added [`DECISIONS_LEDGER.md`](DECISIONS_LEDGER.md) + [`DECISIONS_LEDGER.json`](DECISIONS_LEDGER.json) + [`VISUALS/decision_dependency_map.mmd`](VISUALS/decision_dependency_map.mmd) + [`VISUALS/decision_timeline.mmd`](VISUALS/decision_timeline.mmd). 12 active decisions: 8 from spec (GitHub source-of-truth, FileTree-over-RAG, Client Boxes canonical, plans-are-strategy-drafts, risky-moves-need-isolated-approval, Boxes-page-display-only, sitemap-Done-Gate, one-ledger-at-a-time) + 4 today (triad spine, three-phase build, TCL/GL update discipline, Audit-out-of-scope). Each decision carries status / confidence / scope / context / rationale / alternatives / consequences / do-not-undo-casually / review-trigger / North Star alignment. 5 Communications entries promoted in (`COMM-2026-04-28-001`, `COMM-2026-04-28-003`, `COMM-2026-04-29-001`, `COMM-2026-04-29-003`, `COMM-2026-04-29-005`) with `Status: promoted` markers and pointers. 1 decision needing review seeded (Approval UI / Risk Card Standard, related to DEC-005). Steward agent not yet authored — Phase B work, will live at `/Subagent Boxes/decisions_subagent_package/`.
- **Phase 6: Communications Ledger created.** Added [`COMMUNICATIONS_LEDGER.md`](COMMUNICATIONS_LEDGER.md) + [`COMMUNICATIONS_LEDGER.json`](COMMUNICATIONS_LEDGER.json) + [`VISUALS/handoff_flow.mmd`](VISUALS/handoff_flow.mmd) + [`VISUALS/communication_lifecycle.mmd`](VISUALS/communication_lifecycle.mmd) + [`VISUALS/communications_timeline.mmd`](VISUALS/communications_timeline.mmd). 18 seeded entries: 5 active handoff notes (ledger build rhythm, client-box cleanup rhythm, Brenda fee-waiver lesson, cleanup-phase build arc, three-phase build discipline), 3 warnings (local Git drift, plans-may-predate-guardrails, bedrock reconciliation deferred), 3 preferences (preferred ledger style, safe movement, triad spine), 4 lessons (sitting-there-is-state, automation-can-be-personal, wholesome-vs-creepy, TCL/GL drift is the failure mode), 1 abandoned attempt (plumbing-first build pivot), 2 cross-system notes (client-box state flow, page work Done Gate). Steward agent not yet authored — will live at `/Subagent Boxes/communications_subagent_package/` when Phase B starts.
- **Cowork housekeeping pass.** `/Ledger Drafts/` (19 .txt outlines) and `/Subagent Boxes/` (5 draft sub-agent packages) consolidated as new top-level directories. Sub-agent packages moved from repo root. Audit Ledger removed from build queue (covered by Open Problems / Decisions / Communications / per-Box ledgers); draft kept in `Ledger Drafts/` as reference. Three-phase build discipline codified: Phase A Ledgers (current) → Phase B Sub-agents → Phase C Subagent Boxes.
- **Triad spine codified as the architectural rule.** Box + Ledger + Sub-agent. Anything stateful gets all three. Captured in TCL §1, §3, §5 carry-forward, and as `COMM-2026-04-29-001`.
- **PROB-2026-04-28-016 logged earlier today (Claude Code catch-up session).** Bedrock reconciliation deferred until ledger + sub-agent buildouts complete.

### 2026-04-28

- **Global Ledger Steward automation landed.** Promoted the draft `global_ledger_subagent_package/` into canonical steward materials at `LEDGERS/AGENTS/global_ledger_steward/` and a runnable app agent at `CCAgentindex/agents/global_ledger_steward/`. The agent runs through `POST /api/agents/global_ledger_steward/run`, has local write authority scoped to ledger memory files, appends one activity line per run, and writes receipts under `CCAgentindex/_ledger/ledger_steward_runs/`. This is the first live steward in the planned ledger-agent pattern; sibling Temporal, North Star, File Directory, and Open Problems packages remain draft until promoted.
- **Phase 5: Open Problems Ledger created.** Added [`OPEN_PROBLEMS_LEDGER.md`](OPEN_PROBLEMS_LEDGER.md) + [`OPEN_PROBLEMS_LEDGER.json`](OPEN_PROBLEMS_LEDGER.json) + [`VISUALS/problem_lifecycle.mmd`](VISUALS/problem_lifecycle.mmd) + [`VISUALS/open_problems_board.mmd`](VISUALS/open_problems_board.mmd) + [`VISUALS/risk_heatmap.mmd`](VISUALS/risk_heatmap.mmd). 13 active problems (PROB-001 through 014, with 008 already closed because Phases 1–4 met its close criteria), structured with stable IDs, severity/urgency separated, close criteria mandatory. Recurring patterns named (source vs surface confusion, plans becoming stale, documentation drift, directory duplication). PROB-005 (transcripts) flagged as `partial` since the 2026-04-28 verbatim backfill closed 2 of 5 close criteria. PROB-008 (ledger system) closed with verification evidence pointing to the four prior phases.
- **Phase 4: File Directory Ledger created.** Added [`FILE_DIRECTORY_LEDGER.md`](FILE_DIRECTORY_LEDGER.md) + [`FILE_DIRECTORY_LEDGER.json`](FILE_DIRECTORY_LEDGER.json) + [`VISUALS/file_directory_map.mmd`](VISUALS/file_directory_map.mmd) + [`VISUALS/directory_ownership_map.mmd`](VISUALS/directory_ownership_map.mmd). Top-level + subdirectory map (real paths only — no inventions), ownership table, canonical vs generated areas, status taxonomy, 12 common wrong-turns. **Surfaced 5 open problems for the Open Problems Ledger when it lands:** (1) CLAUDE.md §1 surviving-domains list is out of date vs CCAgentindex/ reality (26 dirs, 10 stubs, 16 populated); (2) `docs/page_asset_sitemap.md` is stale (11 KB) — root version is canonical; (3) `Auto/Boxes/` is a needs-verification mirror of orchestrator + comeketo-inbox; (4) Top-level `Onboard Scripts/` is a 31-file superset of `Auto/Onboard Scripts/` (24); (5) `Comeketo Agent/` and `Auto/Comeketo Agent/` are duplicates.
- **Phase 3: North Star Ledger created.** Added [`NORTH_STAR.md`](NORTH_STAR.md) + [`NORTH_STAR.json`](NORTH_STAR.json) + [`VISUALS/north_star_map.mmd`](VISUALS/north_star_map.mmd) + [`VISUALS/north_star_alignment_check.mmd`](VISUALS/north_star_alignment_check.mmd). Ten North Star goals (NS-01 through NS-10), anti-goals, tradeoff rules, audit questions, Wholesome Enrichment principle, Client Automation North Star.
- **Phase 2: Temporal Continuity Ledger created.** Added [`TEMPORAL_CONTINUITY.md`](TEMPORAL_CONTINUITY.md) + [`TEMPORAL_CONTINUITY.json`](TEMPORAL_CONTINUITY.json) + [`VISUALS/temporal_continuity_flow.mmd`](VISUALS/temporal_continuity_flow.mmd) + [`VISUALS/client_state_temporal.mmd`](VISUALS/client_state_temporal.mmd).
- **Phase 1: Global Ledger created.** Established `LEDGERS/` as the project's top-level memory spine with `GLOBAL_LEDGER.md`, `GLOBAL_LEDGER.json`, `INDEX.md`, three Mermaid visuals, and local Box templates.
- **Verbatim comms backfill across all 28 client boxes.** Pulled full Close.com conversation history (call transcripts, voicemail transcripts, full email bodies, SMS, WhatsApp, threads) via direct `api.close.com/api/v1` access. 582 raw activity payloads. Per-box `01b_comms_verbatim.md` plus `comms/*.json`. Existing `01_comms.md` summaries untouched.
- Sitemap boxes-page section updated with verbatim comms asset ownership and 2026-04-28 history line.
- Established explicit principle: **the plan is subordinate to comms, state, guardrails, and approvals.**
- Established safe-movement posture for the early automation proof period.

### 2026-04-27 (carried forward from `page_asset_sitemap.md`)

- Boxes page runtime, layout, completeness, lead-dossier, renderer, specialization (Hugo + Brenda/Steve), markdown design-kit, design-kit convergence passes.
- Analytics page restored as the Conversation Intelligence flag-bearer.
- Delegations channel picker + feedback clarity pass.

For finer-grained history, see `git log` and `CCAgentindex/_ledger/activity.jsonl`.

---

## 13. Next Handoff Notes

**Current preferred workflow:** one ledger at a time. Phases 1–17 complete: 15 project-level ledgers + 2 of 14 Page Ledgers (`boxes`, `intake`). The Global Ledger Steward is the only runnable steward today; the other 5 packages live as drafts at `/Subagent Boxes/`. Audit Ledger was dropped from the build queue. **Honest accounting (2026-04-29):** structurally complete now; ~3 more substantive Page Ledgers (`automation`, `delegations`, `settings` page) + Phase Ledger = Phase A done. Faster cut also viable (Phase Ledger only = 1 more turn). Next ledger candidates: high-risk wave continues with `automation`, `delegations`, `settings` Page Ledgers; or **Phase Ledger** (small, pairs with DoD §11; tier: global). See `LEDGERS/INDEX.md` for the full Phase 18+ order.

**Envelope-aware authoring rule (from Phase 11 onward, per `DEC-2026-04-29-013`):** every new ledger declares its tier (`global` / `domain` / `local`) and entry kind aligned to the envelope schema in `BOX_BUS_LEDGER.md` §2.2. Every new Box ships with a `box.json` manifest stub. Soft today (no runtime); hard at Phase C.

**Read order:** Global Ledger → Temporal Continuity Ledger → Communications Ledger (warnings + handoffs + preferences for this session) → Decisions Ledger (settled rules — read before reversing any architectural choice) → **Definition of Done Ledger (before closing a task)** → North Star Ledger (when planning) → File Directory Ledger (when navigating) → Open Problems Ledger (before starting work — what's broken or risky in the area you're about to touch?) → Box Ledger (before stamping a directory) → relevant Box / local ledger → work.

- **Global** wins for permanent identity and rules.
- **Temporal Continuity** wins for current working state.
- **Communications** is the durable handoff channel: read at session start for active warnings, preferences, and lessons; write at session end for anything the next agent needs to hear.
- **Decisions** records settled rules: read before reversing architecture, citing rationale, or running an audit pass. 12 active decisions covering source-of-truth, memory architecture, client truth, send safety, UI Done Gate, workflow, and the triad spine.
- **North Star** is the purpose layer: read it when planning major work, auditing changes, or resolving tradeoffs.
- **File Directory** is the city map: read it when locating files, editing unfamiliar areas, or onboarding.
- **Open Problems** is the protection system: read it before starting work to avoid rediscovering what we already know is broken.
- **Definition of Done** is the gate: read it before calling anything done. The Universal Done Gate (8 questions) plus the matching work-type sub-gate must be answered. The Ledger Update Matrix in §6 is the fastest "if I changed X, what do I update?" reference in the project.
- **Box Ledger** is the directory contract: read it before stamping a `BOX.md` or `DIRECTORY.md` on any folder. Defines what counts as a Box, status labels, and the Local Agent Protocol.
- **Box Bus Ledger** is the wire shape: read it before authoring any new ledger or Box. Defines `box.json` manifest schema, ledger envelope, three routing tiers, three interpreter tiers, cycle policy, "what's a Box / what's not" binding rule. Schema-only today; runtime lands at Phase C per `DEC-2026-04-29-013`.
- **Source-of-Truth Ledger** is the truth-resolution rulebook: read it before editing a file you didn't create or designing automation that reads/writes state. Defines universal trust ordering, per-domain trust orderings (Client / Page / Project state / Settled rules / External system), generated-vs-canonical rule, plans-vs-comms rule, Allowed-To-Know 4-bucket schema, conflict resolution.

**Current client-box workflow:** one client box at a time. Audit, clean, leave marker, then proceed. Brenda & Steve had the first explicit pass.

**Important caution:** The human has unpushed local work right now (`git status` shows modified `CCAgentindex/_ledger/pieces_sweeps.jsonl` and an untracked client-box `.txt`). **Do not push to GitHub without checking with Jake.** Local commits are fine; coordinate before push.

**Watch items:**

- Run `global_ledger_steward` after major global-memory changes or before closing a session where ledger drift is plausible. Audit-only mode is available via extra context; local-write mode is the default.
- Plans authored before guardrail enforcement may contain unsafe executable copy. Re-validate any plan before plan-driven sends.
- The `01b_comms_verbatim.md` file is in every box but not yet wired to the UI. Future Boxes-page work can surface it as a second comms tab.
- The Close API key (`CLOSE_API_KEY`) used for the verbatim backfill was never written to disk. If another verbatim refresh is needed, the human must re-supply it.

---

## 14. Links to Local Ledgers and Surfaces

Existing memory surfaces (live now):

- Project root agent instructions: [`CLAUDE.md`](../CLAUDE.md)
- Subprocess agent instructions: [`AGENT.md`](../AGENT.md)
- Page-asset sitemap (UI Done Gate): [`page_asset_sitemap.md`](../page_asset_sitemap.md)
- Activity ledger (audit trail): [`CCAgentindex/_ledger/activity.jsonl`](../CCAgentindex/_ledger/activity.jsonl)
- Inbox guardrails reference: [`Guardrails.html`](../Guardrails.html), [`comeketo-guardrails-agent.md`](../comeketo-guardrails-agent.md), [`Auto/comeketo-inbox/`](../Auto/comeketo-inbox/)
- Project README: [`README.md`](../README.md)
- PRD: [`Comeketo_Agent_PRD_v1.docx`](../Comeketo_Agent_PRD_v1.docx)
- Runnable Global Ledger Steward app agent: [`CCAgentindex/agents/global_ledger_steward/agents.md`](../CCAgentindex/agents/global_ledger_steward/agents.md) + [`prompt.md`](../CCAgentindex/agents/global_ledger_steward/prompt.md)

This ledger directory:

- Index: [`LEDGERS/INDEX.md`](INDEX.md)
- Structured state: [`LEDGERS/GLOBAL_LEDGER.json`](GLOBAL_LEDGER.json)
- Visuals: [`LEDGERS/VISUALS/`](VISUALS/)
- Local Box templates: [`LEDGERS/LOCAL_TEMPLATE/`](LOCAL_TEMPLATE/)
- Steward agents: [`LEDGERS/AGENTS/`](AGENTS/) — canonical steward configurations; first active package is [`AGENTS/global_ledger_steward/`](AGENTS/global_ledger_steward/)
- Deprecation Ledger: [`DEPRECATION.md`](DEPRECATION.md) + [`DEPRECATION.json`](DEPRECATION.json)
- Snapshot runner: [`scripts/snapshot.sh`](scripts/snapshot.sh) + [`scripts/README.md`](scripts/README.md)
- Snapshot archives (gitignored): [`../_snapshots/`](../_snapshots/) — local recovery surface paired with Deprecation §7
- Atom Ledger: [`ATOMS.md`](ATOMS.md) + [`ATOMS.json`](ATOMS.json) — operational queue below Open Problems

Active ledgers (this directory):

- [`LEDGERS/TEMPORAL_CONTINUITY.md`](TEMPORAL_CONTINUITY.md) — current project moment, recent changes, active assumptions, carry-forward context, next handoff. **Read this after the Global Ledger.**
- [`LEDGERS/TEMPORAL_CONTINUITY.json`](TEMPORAL_CONTINUITY.json) — structured mirror.
- [`LEDGERS/NORTH_STAR.md`](NORTH_STAR.md) — project thesis, 10 NS goals, guiding principles, anti-goals, goal-to-system map, tradeoff rules, audit questions, Wholesome Enrichment principle. **Read this when planning major work or auditing.**
- [`LEDGERS/NORTH_STAR.json`](NORTH_STAR.json) — structured mirror with all 10 goals.
- [`LEDGERS/FILE_DIRECTORY_LEDGER.md`](FILE_DIRECTORY_LEDGER.md) — top-level + subdirectory map, ownership table, canonical vs generated, common wrong-turns. **Read this when navigating an unfamiliar area.**
- [`LEDGERS/FILE_DIRECTORY_LEDGER.json`](FILE_DIRECTORY_LEDGER.json) — structured mirror with all directories + open problems surfaced.
- [`LEDGERS/OPEN_PROBLEMS_LEDGER.md`](OPEN_PROBLEMS_LEDGER.md) — 13 active problems with stable IDs, status, severity/urgency, workarounds, close criteria. **Read this before starting work in any area to avoid rediscovering known issues.**
- [`LEDGERS/OPEN_PROBLEMS_LEDGER.json`](OPEN_PROBLEMS_LEDGER.json) — structured mirror including blocked, partially-fixed, recurring patterns, recently-closed.
- [`LEDGERS/COMMUNICATIONS_LEDGER.md`](COMMUNICATIONS_LEDGER.md) — how agents talk across time: handoffs, warnings, preferences, lessons, attempts, cross-system coordination. 18 seeded entries. **Read at session start and end.**
- [`LEDGERS/COMMUNICATIONS_LEDGER.json`](COMMUNICATIONS_LEDGER.json) — structured mirror with all entries, types, promotion paths, archive policy, counts.
- [`LEDGERS/DECISIONS_LEDGER.md`](DECISIONS_LEDGER.md) — settled project rules. 12 active decisions with stable IDs, status, confidence, scope, rationale, alternatives, consequences, do-not-undo-casually, review triggers. **Read before reversing any architectural choice.**
- [`LEDGERS/DECISIONS_LEDGER.json`](DECISIONS_LEDGER.json) — structured mirror with all decisions, dependencies, Communications promotions, decisions-needing-review.
- [`LEDGERS/DEFINITION_OF_DONE.md`](DEFINITION_OF_DONE.md) — the project's authoritative completion ledger. Universal Done Gate (8 questions) + 11 work-type Done Gates + Ledger Update Matrix + 55/45 build rhythm. **Read before closing any meaningful task.**
- [`LEDGERS/DEFINITION_OF_DONE.json`](DEFINITION_OF_DONE.json) — structured mirror of all gates + matrix + NS alignment.
- [`LEDGERS/BOX_LEDGER.md`](BOX_LEDGER.md) — defines what a Box is, Box classes, status labels, BOX.md vs DIRECTORY.md, Local Agent Protocol, stamping rhythm. **Read before stamping a directory.**
- [`LEDGERS/BOX_LEDGER.json`](BOX_LEDGER.json) — structured mirror of the Box concept.
- [`LEDGERS/BOX_BUS_LEDGER.md`](BOX_BUS_LEDGER.md) — defines how Boxes connect: `box.json` manifest schema, ledger envelope, three routing tiers, three interpreter tiers, cycle policy, "what's a Box / what's not" binding rule, two worked examples. **Read before authoring any new ledger or Box.** Runtime deferred to Phase C per `DEC-2026-04-29-013`.
- [`LEDGERS/BOX_BUS_LEDGER.json`](BOX_BUS_LEDGER.json) — structured mirror of manifest + envelope + tier model + interpreter model + cycle policy.
- [`LEDGERS/SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) — universal trust ordering, per-domain trust orderings, Allowed-To-Know 4-bucket schema, conflict resolution, update protocol. **Read before editing a file you didn't create or designing automation that reads/writes state.** First ledger authored under `DEC-2026-04-29-013` envelope-aware rule.
- [`LEDGERS/SOURCE_OF_TRUTH.json`](SOURCE_OF_TRUTH.json) — structured mirror of trust orderings + allowed-to-know schema.
- [`LEDGERS/CONNECTIONS.md`](CONNECTIONS.md) — external-system inventory: 11 active services + 2 planned + 3 not-in-use. Per-service contracts (credentials, failure modes, verification, billing, fallback). **Read before rotating a credential, adding a connector, or designing automation that depends on an external service.** First domain-tier ledger.
- [`LEDGERS/CONNECTIONS.json`](CONNECTIONS.json) — structured mirror of per-service entries.
- [`LEDGERS/FILE_CONTENTS.md`](FILE_CONTENTS.md) — per-file role inventory: ~78 load-bearing files across 10 categories. **Read before editing an unfamiliar file** — purpose, owns, dependencies, companion-file rules, common mistakes, verification.
- [`LEDGERS/FILE_CONTENTS.json`](FILE_CONTENTS.json) — structured mirror, indexable by category / type / related ledgers.
- [`LEDGERS/ASSET_WIDGET_MAP.md`](ASSET_WIDGET_MAP.md) — cross-page widget catalog + API→page mapping + shared services + cross-page state + change-radius hints. **Read before changing any shared widget or API endpoint.** Sitemap remains canonical per-page truth.
- [`LEDGERS/ASSET_WIDGET_MAP.json`](ASSET_WIDGET_MAP.json) — structured mirror.
- [`LEDGERS/SETTINGS.md`](SETTINGS.md) — user-configurable surface catalog (11 settings across 3 persistence layers). Demo mode rule + provider exclusivity rule + credential save/clear flow with audit. **Read before adding any new toggle or credential editor to the Settings page.**
- [`LEDGERS/SETTINGS.json`](SETTINGS.json) — structured mirror.
- [`LEDGERS/PAGES/`](PAGES/) — per-page deep memory. First record: [`PAGES/boxes.md`](PAGES/boxes.md). Pattern + 14-page status table at [`PAGES/_README.md`](PAGES/_README.md). **Read the relevant Page Ledger before doing non-cosmetic work on that page.** Sitemap remains canonical operational truth.

Planned ledgers (not yet created — see INDEX.md for build order):


- `LEDGERS/PROMPT_RECONSTRUCTION.md`
- `LEDGERS/SCOUT.md`
- `LEDGERS/PHASE.md`
- `LEDGERS/SETTINGS.md`
- `LEDGERS/FILE_CONTENTS.md`
- `LEDGERS/ASSET_WIDGET_MAP.md`
- `LEDGERS/PAGES/<route>.md` (one per UI route)
- `LEDGERS/WIDGETS/<widget>.md` (one per major widget)
- Per-directory `BOX.md` and `DIRECTORY_ORIENTATION.md` stamps from `LOCAL_TEMPLATE/`

**Out of scope (removed from build queue 2026-04-29):**
- ~~`LEDGERS/AUDIT.md`~~ — coverage absorbed by Open Problems, Decisions, Communications, per-Box ledgers.

---

## 15. Visualization Index

Visual maps live under `LEDGERS/VISUALS/` as Mermaid (`.mmd`) text files — diffable, GitHub-friendly, and renderable inline.

Current visuals:

- [`VISUALS/global_system_map.mmd`](VISUALS/global_system_map.mmd) — GitHub → Global Ledger → Boxes flow, including the Client Box internals that drive next-move decisions.
- [`VISUALS/ledger_dependency_map.mmd`](VISUALS/ledger_dependency_map.mmd) — Global Ledger as hub with all sub-ledgers.
- [`VISUALS/client_box_lifecycle.mmd`](VISUALS/client_box_lifecycle.mmd) — audit → clean → marker → next workflow.
- [`VISUALS/temporal_continuity_flow.mmd`](VISUALS/temporal_continuity_flow.mmd) — session-start protocol with end-of-session memory update.
- [`VISUALS/client_state_temporal.mmd`](VISUALS/client_state_temporal.mmd) — how plans age, how comms invalidate them, where guardrails + approval cards interrupt the send path.
- [`VISUALS/north_star_map.mmd`](VISUALS/north_star_map.mmd) — project thesis → 10 NS goals → governed systems.
- [`VISUALS/north_star_alignment_check.mmd`](VISUALS/north_star_alignment_check.mmd) — decision tree for evaluating proposed work against North Star goals.
- [`VISUALS/file_directory_map.mmd`](VISUALS/file_directory_map.mmd) — repo root → top-level dirs → key children (the actual shape of the tree as of 2026-04-28).
- [`VISUALS/directory_ownership_map.mmd`](VISUALS/directory_ownership_map.mmd) — canonical → runtime → UI flow + inbox/send loop + intelligence + memory continuity.
- [`VISUALS/problem_lifecycle.mmd`](VISUALS/problem_lifecycle.mmd) — Found → Record → Triage → Workaround → Next Action → Fixed? → Verify → Close (with blocked/partial/recurring branches).
- [`VISUALS/open_problems_board.mmd`](VISUALS/open_problems_board.mmd) — current problems grouped by Now/Critical, Soon/High, Soon/Medium, Later/Medium, Later/Low + Recently Closed.
- [`VISUALS/risk_heatmap.mmd`](VISUALS/risk_heatmap.mmd) — system-level risk graph showing how unresolved problems chain into customer-facing harm.
- [`VISUALS/done_gate_flow.mmd`](VISUALS/done_gate_flow.mmd) — Universal Done Gate decision tree (Source-of-truth → Guardrails → Verify → Memory → Open Problems → Handoff → Commit).
- [`VISUALS/build_rhythm_55_45.mmd`](VISUALS/build_rhythm_55_45.mmd) — 55% offense / 45% defense feedback loop, with the rot path that follows when defense is skipped.
- [`VISUALS/box_bus_topology.mmd`](VISUALS/box_bus_topology.mmd) — Reactive Box Network topology: Global / Domain / Local tiers with example boxes and the trickle-down vs declared-escalation directions.
- [`VISUALS/interpreter_tiers.mmd`](VISUALS/interpreter_tiers.mmd) — T1 / T2 / T3 dispatch flow per subscription, with the cost / speed / traffic-share model.
- [`VISUALS/envelope_routing_flow.mmd`](VISUALS/envelope_routing_flow.mmd) — emit → validate → resolve subscribers → cycle check → dispatch interpreters → record (the runtime path Phase C will build).
- [`VISUALS/source_of_truth_flow.mmd`](VISUALS/source_of_truth_flow.mmd) — per-domain trust-ordering decision tree → conflict resolution walk (universal ordering → recency → closer-to-record → escalate to Open Problems).
- [`VISUALS/connections_dependency_map.mmd`](VISUALS/connections_dependency_map.mmd) — Cloud → Local → Project blast-radius graph for the 11 active services. Color-coded by side-effect risk (customer-facing in yellow, critical in red).
- [`VISUALS/file_contents_index.mmd`](VISUALS/file_contents_index.mmd) — 5-cluster roll-up (LEDGERS / Runtime / Meta-Harness / Auto / Bedrock) with file counts per cluster + cross-cluster dependency arrows.
- [`VISUALS/page_widget_dependency.mmd`](VISUALS/page_widget_dependency.mmd) — 14 routes → shared widgets → `window.*` services → `/api/*` endpoints. Color-coded by cluster.
- [`VISUALS/settings_surface_map.mmd`](VISUALS/settings_surface_map.mmd) — Settings page → 10 categories → 3 persistence layers (.env / localStorage / runtime) → affected systems.

Planned:

- Page / API / data-flow map
- Box hierarchy map (full)

Mermaid is the chosen format because it is text, diffable, GitHub-friendly, and rendered natively in GitHub markdown previews.

---

## 16. Update Rules

Update the Global Ledger when:

- the project identity changes
- a new major system is added
- a major system is retired
- global source-of-truth rules change
- global agent workflow changes
- a new ledger type is created
- a new Box class is created
- a new phase begins
- major risk posture changes
- the read-first order changes
- the Done Gate changes

Do **not** update the Global Ledger for tiny local changes. Those belong in the relevant local ledger or Box.

When updating: bump `Last updated`, refresh §2 (Current World State), append to §12 (Recently Changed), and update §13 (Next Handoff Notes) if the next-actor context shifted.

---

## Final Operating Rule

> The repo is not just code.
>
> The repo is the memory of the build.
>
> Before changing the system, understand the memory.
> After changing the system, update the memory.

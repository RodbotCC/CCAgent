# Global Ledger

Last updated: 2026-04-28 (Global Ledger Steward automation landed)
Maintainer: Jake / Comeketo Agent project agents
Repository: [RodbotCC/CCAgent](https://github.com/RodbotCC/CCAgent)
Default branch: `main`
Current phase: Client Boxes + Automation Safety Hardening — Ledger system buildout (Phases 1–5 complete; first ledger steward automation active)
Current project state: Active build; live-ish automation; guardrail and continuity hardening in progress
Read-first status: **Mandatory before meaningful edits.**

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
| Source-of-Truth | which system owns which truth | planned (rules summarized in §4 and FDL §6) |
| Definition of Done | completion standards | planned |
| Directory | file tree map | superseded — see File Directory Ledger above |
| Directory Configuration | local "you are here" rules | planned (template at `LEDGERS/LOCAL_TEMPLATE/`) |
| File Contents | important file responsibilities | planned |
| Asset / Widget Map | pages, widgets, APIs, data flow | partially active — `page_asset_sitemap.md` is the live UI map |
| Connections | external systems and services | planned |
| Decisions | major choices and why | planned |
| Communications | handoffs, warnings, notes | planned |
| Open Problems | known unfinished work | planned |
| Prompt / Reconstruction | how important things were built | planned |
| Scout | tool/model/workflow research | planned |
| Audit | audit findings and follow-up | planned |
| Phase | current milestone state | planned |
| Page Ledgers | page-specific memory (one per route) | planned |
| Widget Ledgers | widget-specific memory | planned |
| Settings | configurable options | planned |

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

**Current preferred workflow:** one ledger at a time. Phases 1–5 (Global + Temporal Continuity + North Star + File Directory + Open Problems) have landed. The Global Ledger Steward is now runnable for global-memory maintenance sweeps. Next ledger awaits Jake's signal — Phase 6 likely Source-of-Truth (encodes rules already summarized in §4 + NS-06 + FDL §6), Definition of Done, or Decisions. See `LEDGERS/INDEX.md`.

**Read order:** Global Ledger → Temporal Continuity Ledger → North Star Ledger (when planning) → File Directory Ledger (when navigating) → Open Problems Ledger (before starting work — what's broken or risky in the area you're about to touch?) → relevant Box / local ledger → work.

- **Global** wins for permanent identity and rules.
- **Temporal Continuity** wins for current working state.
- **North Star** is the purpose layer: read it when planning major work, auditing changes, or resolving tradeoffs.
- **File Directory** is the city map: read it when locating files, editing unfamiliar areas, or onboarding.
- **Open Problems** is the protection system: read it before starting work to avoid rediscovering what we already know is broken.

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

Active ledgers (this directory):

- [`LEDGERS/TEMPORAL_CONTINUITY.md`](TEMPORAL_CONTINUITY.md) — current project moment, recent changes, active assumptions, carry-forward context, next handoff. **Read this after the Global Ledger.**
- [`LEDGERS/TEMPORAL_CONTINUITY.json`](TEMPORAL_CONTINUITY.json) — structured mirror.
- [`LEDGERS/NORTH_STAR.md`](NORTH_STAR.md) — project thesis, 10 NS goals, guiding principles, anti-goals, goal-to-system map, tradeoff rules, audit questions, Wholesome Enrichment principle. **Read this when planning major work or auditing.**
- [`LEDGERS/NORTH_STAR.json`](NORTH_STAR.json) — structured mirror with all 10 goals.
- [`LEDGERS/FILE_DIRECTORY_LEDGER.md`](FILE_DIRECTORY_LEDGER.md) — top-level + subdirectory map, ownership table, canonical vs generated, common wrong-turns. **Read this when navigating an unfamiliar area.**
- [`LEDGERS/FILE_DIRECTORY_LEDGER.json`](FILE_DIRECTORY_LEDGER.json) — structured mirror with all directories + open problems surfaced.
- [`LEDGERS/OPEN_PROBLEMS_LEDGER.md`](OPEN_PROBLEMS_LEDGER.md) — 13 active problems with stable IDs, status, severity/urgency, workarounds, close criteria. **Read this before starting work in any area to avoid rediscovering known issues.**
- [`LEDGERS/OPEN_PROBLEMS_LEDGER.json`](OPEN_PROBLEMS_LEDGER.json) — structured mirror including blocked, partially-fixed, recurring patterns, recently-closed.

Planned ledgers (not yet created — see INDEX.md for build order):

- `LEDGERS/SOURCE_OF_TRUTH.md`
- `LEDGERS/DEFINITION_OF_DONE.md`
- `LEDGERS/DIRECTORY.md`
- `LEDGERS/OPEN_PROBLEMS.md`
- `LEDGERS/DECISIONS.md`
- `LEDGERS/COMMUNICATIONS.md`
- `LEDGERS/CONNECTIONS.md`
- `LEDGERS/PROMPT_RECONSTRUCTION.md`
- `LEDGERS/SCOUT.md`
- `LEDGERS/AUDIT.md`
- `LEDGERS/PHASE.md`
- `LEDGERS/SETTINGS.md`
- `LEDGERS/PAGES/<route>.md` (one per UI route)
- `LEDGERS/WIDGETS/<widget>.md` (one per major widget)

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

Planned:

- Page / API / data-flow map
- Source-of-truth flow
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

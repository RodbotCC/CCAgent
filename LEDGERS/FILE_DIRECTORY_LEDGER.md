# File Directory Ledger

Last updated: 2026-05-01 (later — §3 Top-Level Map enumerated with the 7 missing entries surfaced by `file_directory_steward` audit_only smoke test ATOM-2026-04-30-0038: `_snapshots/`, `scaffolded test/`, `src/` (top-level dirs), `cowork_memory` + `LEDGERS/atlas` (symlinks), `LEDGERS/BOXES/atlas/` + `LEDGERS/BOXES/atoms/` (Box subdirs). Earlier per ATOM-2026-04-30-0111 backfill: surfaced 6 unified Boxes under `LEDGERS/BOXES/`. FDL is now in sync with disk reality as of 2026-05-01.)
Maintainer: Jake / Comeketo Agent project agents
Repository: [RodbotCC/CCAgent](https://github.com/RodbotCC/CCAgent) (branch `main`)
Status: **active**
Read when: locating files, editing unfamiliar areas, adding folders, moving source truth, auditing structure, onboarding a new agent

> Before editing a file, understand where it lives and what its directory owns.
>
> The file tree is not just storage. The file tree is architecture. This ledger exists to stop "grep roulette" — the pattern where an agent searches the repo, finds a keyword in some folder, and edits the wrong thing.

---

## 1. Directory Philosophy

The file tree is the project's working memory.

Directories are not passive containers. Important directories own a clear area of the system and introduce themselves through a local Box, directory orientation file, or local ledger.

The File Directory Ledger gives project-wide orientation. Local Box files give directory-specific operating rules. Together they make the repo navigable.

**Before editing in an unfamiliar area:**

1. Find the directory in this ledger (§3 top-level map).
2. Read its ownership and source-of-truth notes (§4 important subdirectory maps + §5 ownership table).
3. Read any local Box / `AGENTS.md` / `CLAUDE.md` / `README.md` file in the directory (§9 local orientation index).
4. Edit only after the directory's role is clear.

This ledger is the project's **city map**. Local Box files are **neighborhood signs**. The Source-of-Truth Ledger (planned) and File Contents Ledger (planned) will give the formal authority and per-file detail.

---

## 2. Read-First Directory Rules

- Do not edit a directory just because a keyword search found it.
- Check whether the file is canonical, generated, legacy, or archive (§6).
- If a directory has a local Box, `AGENTS.md`, `CLAUDE.md`, or `README.md`, read it before editing.
- If changing a UI page or route, check `page_asset_sitemap.md` (project root, NOT the stale copy in `docs/`).
- If changing client-specific truth, work inside `Auto/Client Boxes/<Name>/`.
- If changing runtime rendering, inspect `Auto/orchestrator/`.
- If changing send rules, inspect `Auto/comeketo-inbox/` guardrails before any plan text.
- If changing generated state (e.g. anything under `Auto/orchestrator/state/`), identify the source generator first.
- If moving or renaming directories, update this ledger.
- If a path appears in two places (e.g. `Onboard Scripts/` exists at both root and under `Auto/`), do NOT assume they're identical — see §10 Common Wrong-Turns.

---

## 3. Top-Level Directory Map

This is what actually exists at `/Users/jakeaaron/Downloads/CC Agent/` as of 2026-04-29 (post-housekeeping). Every path here was confirmed by inspection. Do not invent additions.

| Path | Status | Owns | Read-First / Notes |
|---|---|---|---|
| `Auto/` | active (mixed canonical + runtime + duplicates) | Comeketo automation, Client Boxes, Staff Boxes, orchestrator, inbox skill, scripts, design assets | See §4.1; symlink target `/Users/jakeaaron/Desktop/Auto/`; orchestrator owns this — write only with explicit team authorization |
| `CCAgentindex/` | active | App bedrock — the only filesystem state the app owns | `indexes/index.json` is loader authority; see §4.2 |
| `LEDGERS/` | active / canonical | Project-wide memory and continuity layer | [`GLOBAL_LEDGER.md`](GLOBAL_LEDGER.md) read-first; this directory |
| `Ledger Drafts/` | **active reference (added 2026-04-29)** | 19 hand-drafted `.txt` outlines — Jake's spine for unbuilt ledgers | **Read the matching outline before authoring any new ledger.** Moved here from `~/Documents/` 2026-04-29. Includes `# Audit Ledger.txt` (kept as reference even though Audit is out-of-scope for build). |
| `Subagent Boxes/` | **active reference (added 2026-04-29)** | 5 draft sub-agent packages (file_directory, global_ledger, north_star, open_problems, temporal_continuity) awaiting promotion to runnable app agents | Moved here 2026-04-29 from repo root. Canonical *active* steward materials still live at `LEDGERS/AGENTS/<name>/`. Runnable form: `CCAgentindex/agents/<name>/`. |
| `docs/` | active (partial) | Connector docs + an outdated copy of the sitemap | `connectors.md` is current; `docs/page_asset_sitemap.md` is **stale** — use root-level `page_asset_sitemap.md` |
| `rawdata/` | active reference | CSV/MD imports from external sources (sales playbook, scoreboards, venue index, partnership program docs) | Read-only reference data; do not treat as canonical app state |
| `Onboard Scripts/` (top-level) | active **superset** | 31 build/analytics scripts (includes 7 `analytics_*.py` not present in `Auto/Onboard Scripts/`) | Authoritative copy; see §10 wrong-turn about the duplicate |
| `Aesthetic Asset Kit/` (top-level) | active reference | Design system (`Comeketo Design Deck.html`, tokens, components, icons, deck-stage.js) — keeps all builds visually aligned. **Renamed 2026-04-28 from "Comeketo Agent/"** to disambiguate purpose. Auto/Comeketo Agent/ retained in place for orchestrator reference. |
| `node_modules/` | generated | npm dependencies | Never hand-edit; in `.gitignore` |
| `__pycache__/` | generated | Python bytecode cache | Never hand-edit; in `.gitignore` |
| `.git/` | git internal | Repository metadata | Do not touch |
| `.claude/` | external/config | Claude Code skills + worktrees | Tooling config; in `.gitignore` |
| `.logs/` | generated | Runtime logs | Generated; in `.gitignore` |
| `_snapshots/` | **active (added 2026-04-30)** | Daily/weekly/monthly/manual zip archives produced by `LEDGERS/scripts/snapshot.sh`; pairs with `LEDGERS/DEPRECATION.md` §7 Snapshot Protocol. | **In `.gitignore`** — recovery surface, not source-of-truth. Cardinal rule: nothing leaves the project without a Deprecation entry AND a Snapshot reference. |
| `scaffolded test/` | **active scratch (added recently)** | Scratch directory used during scaffolding experiments. | Not load-bearing; cleanup candidate when noted by file_directory_steward. |
| `src/` | **active (purpose TBD)** | Currently undocumented. Surfaced 2026-05-01 by `file_directory_steward` smoke test (ATOM-2026-04-30-0038) as missing from this ledger. | Worth a follow-up audit — is this a dead leftover from an early scaffold, or active code? File a PROB if dead-code suspicion confirmed. |
| `cowork_memory` (symlink) | **active (added 2026-05-01)** | Symlink → `~/Library/Application Support/Claude/local-agent-mode-sessions/<orchestrator>/<workspace>/spaces/<space-id>/memory/` — alias for the Cowork session's auto-memory dir, locally readable from project paths. | **In `.gitignore`** — per-session, target outside repo. Each Cowork session has its own memory dir; the symlink only aliases the current session's. The structural fix for cross-agent memory visibility is `LEDGERS/COMMUNICATIONS_LEDGER.md`, not this alias. |
| `LEDGERS/atlas` (symlink) | **active (added 2026-05-01 via ATOM-0107)** | Symlink → `/Users/jakeaaron/Documents/Atlas/` — alias for Pieces MCP daily-folder output, the project's first `ground_truth_source`. **Read-only contract.** | **In `.gitignore`** — per-machine, target outside repo. Governed by `LEDGERS/BOXES/atlas/` Box. Reads happen through this alias; writes are forbidden. Atlas Sweep Steward (`atlas_steward`) reads daily at 8 AM ET via `CCAgentindex/triggers/atlas_daily_sweep.json` cron. Two-truths contract per `SOURCE_OF_TRUTH.md` §3.0. |
| `LEDGERS/BOXES/atlas/` | **active (added 2026-04-30 / 2026-05-01)** | First `ground_truth_source` Box. Houses the Atlas Sweep Steward + receipts + daily project-relevant digests. | Owns: `box.json`, `BOX.md`, `steward/AGENTS.md`, `steward/prompt.md`, `steward/config.json`, `receipts/`, `digests/`, plus governs (via path reference) `CCAgentindex/triggers/atlas_daily_sweep.json` and the `LEDGERS/atlas` symlink. |
| `LEDGERS/BOXES/atoms/` | **active (added 2026-04-30)** | Atomizer Steward Box. Governs `LEDGERS/ATOMS.md` + `.json` by path reference. | Six-file unified Box pattern. Steward not yet runnable — Phase B follow-on per ATOM-0111 Per-Atom-Completion Update Protocol. |

### Top-level files that matter

UI / app source (these belong to the page-asset sitemap's map of routes/components):

| File | Role |
|---|---|
| `app.jsx` | App router (`KNOWN_SCREENS`, route switch) |
| `screens.jsx` | Most page renderers (BoxesScreen, AnalyticsScreen, etc.) — **426 KB** |
| `components.jsx` | Shared UI components — 90 KB |
| `automation.jsx` | Automation page shell — 330 KB |
| `styles.css` | Project-wide styles — 399 KB |
| `Secretary.html` | Entry HTML page (cache-busters live here) |
| `server.py` | Single-file stdlib HTTP server — 256 KB; APIs for boxes, leads, intelligence, pieces, etc. |
| `mission_control_loader.js` | Frontend data hydration |
| `delegator.js` | Delegation client |
| `connectors.js`, `data.js`, `chat.js`, `ai.js`, `ai_actions.js`, `ai_instructions.js`, `grid_scorer.js`, `lucide.js` | Various JS modules |
| `page_asset_sitemap.md` | **UI Done Gate** — page/route/binding ownership |

Project-level meta:

| File | Role |
|---|---|
| `CLAUDE.md` | Project-local agent instructions (six disciplines + new §0 read-first) |
| `AGENT.md` | Spawn-time briefing for `claude -p` subprocesses |
| `README.md` | Human-facing project intro + Project memory section |
| `CLAUDE_NOTES.md` | Working notes; check before assuming current state |
| `Comeketo_Agent_PRD_v1.docx` | Product requirements doc |
| `Guardrails.html` | Inbox guardrails reference (HTML form) |
| `comeketo-guardrails-agent.md` | Guardrails as agent instructions |
| `mission_control_schema.md` | MissionControl loader schema |
| `skills_index.md` | Skills inventory |
| `Quote Maker 14.5 - Database.csv` | Quote Maker pricing reference |
| `morning_sweep_grid.workflow (1).json` | Workflow definition |
| `package.json`, `package-lock.json` | npm metadata |
| `.env`, `.gitignore` | Config |

These individual files mostly belong in the planned File Contents Ledger; this ledger maps their **containing directory**.

---

## 4. Important Subdirectory Maps

### 4.1 `Auto/`

Status: **active** (mixed canonical + runtime + duplicates)
Role: Comeketo automation, client substrate, inbox skill, orchestrator, staff voice profiles, design assets. This folder is a **symlink** to `/Users/jakeaaron/Desktop/Auto/` (the team's standalone automation folder). Orchestrator owns it. **Do not write through this alias unless the team explicitly asks.** (CLAUDE.md §1.)

Children:

| Path | Status | Role |
|---|---|---|
| `Auto/Client Boxes/` | active / canonical | 28 per-client boxes — see §4.3 |
| `Auto/Staff Boxes/` | active / canonical | 10 staff voice/profile substrates |
| `Auto/orchestrator/` | active runtime | Render/state/check layer — see §4.4 |
| `Auto/comeketo-inbox/` | active / canonical | Inbox skill + guardrails — see §4.5 |
| `Auto/Onboard Scripts/` | active (subset) | 24 build scripts; missing 7 `analytics_*.py` present at top-level — see §10 |
| `Auto/Comeketo Agent/` | active reference | Design system (mirror of top-level `Comeketo Agent/`) |
| `Auto/Hugodemo/` | reference / template | Standalone Client Box demo (with own `AGENTS.md`); sits outside `Auto/Client Boxes/` |
| `Auto/Boxes/` | **needs verification** | Snapshot/mirror of `Auto/orchestrator/` + `Auto/comeketo-inbox/` (newer mtimes 2026-04-27 16:23). Likely stale duplicate — do NOT edit; check with Jake before any cleanup |
| `Auto/Extra Stuff/` | scratch / archive | Screenshots + reference files (autodre.txt, ballpark template, voice profiles XLSX) |
| `Auto/Brainstorm/` | empty | Placeholder; no current content |
| `Auto/.claude/` | external/config | Claude Code settings.json |
| `Auto/CIA.txt` | reference | 139 KB context document |
| `Auto/Comeketo_Venue_Index_2026-04-25.xlsx` | reference | Venue index spreadsheet |
| `Auto/Comeketo_Voice_Profiles.md` | reference | Voice profile master doc |
| `Auto/QuoteMaker.jsx` | active reference | Quote Maker React component |
| `Auto/comeketo-ballpark-email-template.html` | active reference | Email template |
| `Auto/comeketo-inbox.skill` | archive | Original packaged skill ZIP (the unpacked version is `Auto/comeketo-inbox/`) |

### 4.2 `CCAgentindex/` — App bedrock

Status: **active**
Role: The only filesystem state the app owns. Loader authority lives at `CCAgentindex/indexes/index.json`. CLAUDE.md §1 calls this the bedrock root for `claude -p` subprocesses.

**Heads up — CLAUDE.md is out of date about this folder.** It says surviving domains are `people, venues, _ledger, _inbox, indexes`. Reality (as of 2026-04-28 inspection) is 26 directories. Many of the "retired" ones survive as `.gitkeep` stubs; many populated ones are not in CLAUDE.md at all. Tabulated below:

| Path | Files | Status | Role |
|---|---:|---|---|
| `CCAgentindex/indexes/` | 1 | **active** (loader authority) | `index.json` — primary loader registry |
| `CCAgentindex/people/` | 39 | **active / canonical** | People records (coworker · lead · client · contact) |
| `CCAgentindex/venues/` | 30 | **active / canonical** | Venue records |
| `CCAgentindex/_ledger/` | 8+ | **active / canonical** | `activity.jsonl` audit trail + `delegations/`, `ledger_steward_runs/`, `chat_reflections.jsonl`, `delegation_drafts.json`, `pieces_sweeps.jsonl` |
| `CCAgentindex/_inbox/` | 77 | **active** | `inbox.jsonl` + `attachments/` |
| `CCAgentindex/intelligence/` | 119 | **active / heavy** | Subdirs: `cashflow/`, `channels/`, `leads/`, `libraries/`, `ops/`, `sales/`, `_runs/`, plus `MANIFEST.md`. Drives Conversation Intelligence + analytics page |
| `CCAgentindex/agent_plans/` | 40 | **active** | Per-coworker plan JSON (`coworker__andre_raw.json`, etc.) |
| `CCAgentindex/agents/` | 7 | **active / canonical** | Runnable app-agent definitions (`agents.md` + `prompt.md` per agent); includes `global_ledger_steward` |
| `CCAgentindex/analytics/` | 7 | **active** | Analytics outputs |
| `CCAgentindex/catalog/` | 7 | **active** | Catalog records |
| `CCAgentindex/reports/` | 28 | **active** | Report outputs |
| `CCAgentindex/summaries/` | 3 | **active** | Summary outputs |
| `CCAgentindex/triggers/` | 12 | **active** | Automation triggers (`auto_*.json`, per-lead executors like `brenda_steve_plan_executor.json`) |
| `CCAgentindex/workflows/` | 5 | **active** | Workflow definitions |
| `CCAgentindex/intake_reports/` | 3 | **active** | Intake report outputs |
| `CCAgentindex/scheduled_tasks/` | 1 | **active** | `daily_oracle_sweep.md` |
| `CCAgentindex/hooks/` | 1 | **active** | `state.json` — UI hook toggles |
| `CCAgentindex/Rodbot/` | 1 (`.gitkeep`) | **legacy / stub** | Wiped in Apr 2026 great trim per CLAUDE.md |
| `CCAgentindex/commitments/` | 1 (`.gitkeep`) | **legacy / stub** | Retired domain |
| `CCAgentindex/threads/` | 1 (`.gitkeep`) | **legacy / stub** | Retired domain |
| `CCAgentindex/projects/` | 1 (`.gitkeep`) | **legacy / stub** | Retired domain |
| `CCAgentindex/knowledge/` | 1 (`.gitkeep`) | **legacy / stub** | Retired domain |
| `CCAgentindex/tables/` | 1 (`.gitkeep`) | **legacy / stub** | Retired domain |
| `CCAgentindex/annotations/` | 1 (`.gitkeep`) | **legacy / stub** | Retired domain |
| `CCAgentindex/charts/` | 1 (`.gitkeep`) | **legacy / stub** | Retired domain |
| `CCAgentindex/_vaults/` | 1 (`.DS_Store`) | dormant by design | Vault folders for off-grid specialty work; empty until summoned |

### Bedrock-side aliases to Auto/ (added 2026-04-28)

Six relative symlinks live under `CCAgentindex/` so the agent finds Auto/'s contents as bedrock memory without anything being physically moved. Each is `CCAgentindex/<name> → ../Auto/<name>`. Auto/ itself is a symlink to `/Users/jakeaaron/Desktop/Auto/`, so the chain resolves transparently.

| Bedrock alias | Target | Notes |
|---|---|---|
| `CCAgentindex/Boxes` | `../Auto/Boxes` | Aliases the questionable mirror flagged in PROB-012 — agents should still treat as needs-verification |
| `CCAgentindex/Client Boxes` | `../Auto/Client Boxes` | 28 client boxes accessible from bedrock |
| `CCAgentindex/comeketo-inbox` | `../Auto/comeketo-inbox` | Inbox skill (SKILL.md, references/, scripts/, assets/) |
| `CCAgentindex/Onboard Scripts` | `../Auto/Onboard Scripts` | Canonical/working onboard scripts (per corrected PROB-013) |
| `CCAgentindex/orchestrator` | `../Auto/orchestrator` | Runtime/render layer + state |
| `CCAgentindex/Staff Boxes` | `../Auto/Staff Boxes` | 10 voice profiles |

Closes PROB-015 (Auto/ → CCAgentindex/ migration). Reversible via `unlink`.

> **Open problem flagged:** CLAUDE.md §1 surviving-domains list and reality have diverged. Reconciling that is a Phase-N maintenance task — likely in the planned Open Problems Ledger.

### 4.3 `Auto/Client Boxes/` — Box Collection

Status: **active / canonical**
Role: 28 living client Boxes. Each child folder is a Local Client Box. **A client folder is not merely a data folder. It is the living memory and operating context for that client.**

Owns:

- Client comms (curated `01_comms.md` + verbatim `01b_comms_verbatim.md` + raw `comms/*.json`)
- Lead state (`00_meta.json`, `client_ledger.md`)
- Profile and enrichment (`04_profile.md`, `*_enrichment.md` — internal only)
- Seven-day plan (`05_seven_day_plan.md`)
- Alerts (`09_andre_alerts.md`)
- Audit markers (`YYYY-MM-DD_audit_marker.md` — Brenda is the template, 2026-04-28)
- Per-box agent instructions (`AGENTS.md`, `CLAUDE.md` when present — Hugo has both)
- Outcome stage files (`15.01_close_outcome.md`, `15.02_followup_outcome.md`, etc.)
- Allowed-to-know constraints (planned)

Does not own:

- Global automation rules
- Inbox guardrail definitions
- UI rendering logic
- Generated dashboard state

Source-of-truth order inside each box (highest first):

1. `01b_comms_verbatim.md` and `comms/*.json` (full Close transcripts)
2. `01_comms.md` (curated exec summary)
3. `00_meta.json` (structured identity)
4. `client_ledger.md` (running operator log)
5. Operator-approved notes
6. `04_profile.md` and `*_enrichment.md` (**internal strategy only — not customer-facing truth**)

Read-first inside each client folder:

1. `00_meta.json`
2. `01_comms.md` (curated)
3. `01b_comms_verbatim.md` (full transcripts, added 2026-04-28)
4. `client_ledger.md`
5. `05_seven_day_plan.md`
6. `09_andre_alerts.md`
7. Audit marker (`YYYY-MM-DD_audit_marker.md`) if present
8. Local `AGENTS.md` / `CLAUDE.md` if present

### 4.4 `Auto/orchestrator/` — Runtime / render layer

Status: **active runtime**
Role: Reads substrates and produces rendered pages, state files, dashboards, and readiness outputs.

Children:

| Path | Status | Role |
|---|---|---|
| `Auto/orchestrator/bin/` | active | Python scripts: `comms_state_sweep.py`, `index.py`, `ready_check.py`, `refresh.py`, `today.py`, `voice.py`, `_lib.py` |
| `Auto/orchestrator/state/` | **generated / derived** | `dashboard.{html,json}`, `index.html`, `today.html`, `master_ledger.csv`, `ready_leads.json`, `leads/`, `runs/`, `voice/` — **DO NOT hand-edit** |
| `Auto/orchestrator/wiring/` | active / canonical | Routine catalogs (`automations.md`, `dashboard.md`, `lead_box.md`, `today.md`, `00_overview.md`) |
| `Auto/orchestrator/routines/` | active / canonical | Per-lead routine definitions |
| `Auto/orchestrator/build.py` | active | Build entry |
| `Auto/orchestrator/render_lead.py` | active | Per-lead rendering |
| `Auto/orchestrator/README.md` | active | Local README |
| `Auto/orchestrator/SYSTEM_OVERVIEW.md` | active | System overview |
| `Auto/orchestrator/MANUAL_FIRE.md` | active | Manual fire instructions |
| `Auto/orchestrator/KICKOFF_TODAY.md` | active | Today kickoff |
| `Auto/orchestrator/PLAN.md` | active | Plan doc |

Owns: ready checks, generated state, dashboard outputs, run summaries, refresh scripts, runtime adapters.
Does not own: canonical client truth (lives in `Auto/Client Boxes/`), customer-facing send policy, page-asset sitemap.

> **Generated files under `Auto/orchestrator/state/` should not be hand-edited unless explicitly marked canonical.** Find the generator script in `bin/` first.

### 4.5 `Auto/comeketo-inbox/` — Inbox skill

Status: **active / canonical**
Role: Inbox handling rules, guardrails, style references, templates, pricing/rendering tools.

Children:

| Path | Role |
|---|---|
| `Auto/comeketo-inbox/SKILL.md` | Skill entrypoint — **read first** |
| `Auto/comeketo-inbox/references/` | Guardrails, NEPQ/voice references |
| `Auto/comeketo-inbox/scripts/` | `render_email.py`, `render_followup_email.py`, `price_ballpark.py` |
| `Auto/comeketo-inbox/assets/` | Email template assets |
| `Auto/comeketo-inbox/comeketo-inbox/` | Sub-directory (verify role with Jake before editing) |

Owns: inbox guardrails, send safety rules, NEPQ/voice references, HTML email templates, ballpark pricing scripts.
Does not own: per-client strategy (handled via Client Boxes), Close data itself, global project ledger rules.

### 4.6 `LEDGERS/` — Project memory spine

Status: **active / canonical**
Role: Top-level memory and continuity layer for the whole project.

Children:

| Path | Role |
|---|---|
| `LEDGERS/GLOBAL_LEDGER.md` + `.json` | Constitution — what the project is |
| `LEDGERS/TEMPORAL_CONTINUITY.md` + `.json` | Cockpit log — what is true right now |
| `LEDGERS/NORTH_STAR.md` + `.json` | Compass — what work is trying to serve |
| `LEDGERS/FILE_DIRECTORY_LEDGER.md` + `.json` | This file — city map of the repo |
| `LEDGERS/INDEX.md` | Table of contents for all ledgers (active + planned) |
| `LEDGERS/AGENTS/` | Canonical steward-agent configurations; first active package is `global_ledger_steward/` |
| `LEDGERS/VISUALS/` | Mermaid maps — diffable, GitHub-friendly |
| `LEDGERS/LOCAL_TEMPLATE/` | `BOX_LEDGER_TEMPLATE.md` and `DIRECTORY_ORIENTATION_TEMPLATE.md` for stamping new Boxes / orientations |

Owns: project-wide memory, continuity records, source-of-truth notes (summarized — formal authority in planned Source-of-Truth Ledger), visual maps, canonical ledger-steward configurations.
Does not own: app runtime behavior, implementation code. Runtime app-agent prompts live in `CCAgentindex/agents/`.

---

## 5. Directory Ownership Table

Quick lookup for the question "where do I edit?".

| Directory | Owner Concept | Edit When | Avoid Editing When |
|---|---|---|---|
| `Auto/Client Boxes/` | Client truth | auditing or updating a specific client Box | changing global send policy |
| `Auto/Staff Boxes/` | Staff voice/profile | updating a staff member's voice or operating profile | changing client truth |
| `Auto/orchestrator/bin/` | Runtime scripts (canonical) | changing how state is generated | editing client facts directly |
| `Auto/orchestrator/state/` | Runtime output (generated) | **never hand-edit** | always — find the generator |
| `Auto/orchestrator/wiring/` | Routine definitions (canonical) | adding/changing automation routines | per-client tweaks (use Client Box) |
| `Auto/comeketo-inbox/` | Inbox/send guardrails | changing send rules / templates / Close inbox behavior | changing one client's plan only |
| `CCAgentindex/_ledger/` | Audit trail | append-only via tools | retroactive editing of past entries |
| `CCAgentindex/agents/` | Runnable app agents | adding or updating an app-run agent spec/prompt | storing canonical ledger policy only (use `LEDGERS/AGENTS/`) |
| `CCAgentindex/people/`, `venues/` | Bedrock records | adding/updating people or venue records (read sibling schema first) | inventing new fields without sibling-schema check |
| `CCAgentindex/intelligence/` | Generated intelligence outputs | regenerate via `Onboard Scripts/build_*.py` | hand-editing — find the generator |
| `LEDGERS/` | Project memory | updating continuity / source-of-truth / done / audit records | hiding implementation code here |
| UI root (`*.jsx`, `*.js`, `server.py`, `styles.css`, `Secretary.html`) | App pages / components / APIs | changing screens / routes / components / APIs | defining client truth |
| `page_asset_sitemap.md` (root) | UI Done Gate | every page/route/binding change | trivial UI edits with no ownership change |
| `Onboard Scripts/` (top-level) | Build / analytics scripts | adding/updating scripts | duplicating into `Auto/Onboard Scripts/` |
| `rawdata/` | External CSV/MD imports | adding new imported data | treating it as canonical app state |
| `docs/` | Connector docs | updating `connectors.md` | updating `docs/page_asset_sitemap.md` (it's stale — use root) |

---

## 6. Canonical vs Generated Areas

### Canonical (source-of-truth inputs — edit these)

- `LEDGERS/` (all)
- `Auto/Client Boxes/<Name>/` (all `*.md`, `*.json` excluding generated)
- `Auto/Staff Boxes/`
- `Auto/orchestrator/bin/`, `wiring/`, `routines/`, `build.py`, `render_lead.py`, all `*.md` docs
- `Auto/comeketo-inbox/SKILL.md`, `references/`, `scripts/`
- `CCAgentindex/people/`, `venues/`, `agents/`, `agent_plans/`, `triggers/`, `workflows/`, `scheduled_tasks/`, `indexes/`, `hooks/`, `catalog/`
- `page_asset_sitemap.md` (project root)
- All UI source files at root (`*.jsx`, `*.js`, `server.py`, `styles.css`, `Secretary.html`)
- `CLAUDE.md`, `AGENT.md`, `README.md`, `comeketo-guardrails-agent.md`, `Guardrails.html`
- `Onboard Scripts/` (top-level superset)

### Generated / derived (find the generator before editing)

- `Auto/orchestrator/state/*` (all — `dashboard.{html,json}`, `today.html`, `master_ledger.csv`, `ready_leads.json`, `leads/`, `runs/`, `voice/`)
- `CCAgentindex/intelligence/` outputs (regenerated via `Onboard Scripts/build_*.py`)
- `CCAgentindex/reports/`, `analytics/`, `summaries/`, `intake_reports/` outputs
- `CCAgentindex/_ledger/activity.jsonl` (append-only via tools, never hand-rewrite)
- `node_modules/`, `__pycache__/` (build artifacts)
- `.logs/`
- Every cache-busted JS bundle reference inside `Secretary.html` (manage by bumping numbers, not by editing the bundles)

### Append-only ledgers (do not rewrite past entries)

- `CCAgentindex/_ledger/activity.jsonl`
- `CCAgentindex/_inbox/inbox.jsonl`
- `CCAgentindex/_ledger/chat_reflections.jsonl`
- `CCAgentindex/_ledger/pieces_sweeps.jsonl`
- `CCAgentindex/_ledger/delegation_draft_events.jsonl`

> Rule: if a file looks generated, find the generator before editing.

---

## 7. Active / Legacy / Archive Status

Status taxonomy used in this ledger:

- **active** — current system, safe to modify with proper checks
- **canonical** — source of truth
- **generated** — derived output, do not hand-edit
- **legacy** — old system, inspect before reusing
- **archive** — preserved for history, do not treat as current
- **needs verification** — purpose unclear; check with Jake before assuming
- **dormant** — placeholder for future work
- **external** — imported or vendor-owned

Specific labels for paths that aren't obvious:

| Path | Label | Notes |
|---|---|---|
| `CCAgentindex/Rodbot/` | legacy / stub | Wiped in Apr 2026 great trim; only `.gitkeep` remains |
| `CCAgentindex/commitments/`, `threads/`, `projects/`, `knowledge/`, `tables/`, `annotations/`, `charts/` | legacy / stub | Same — `.gitkeep` only |
| `CCAgentindex/_vaults/` | dormant | Off-grid specialty vaults; empty until summoned |
| `Auto/Hugodemo/` | reference / template | Standalone Client Box demo with own `AGENTS.md`; not in `Auto/Client Boxes/` |
| `Auto/Boxes/` | **needs verification** | Mirror of `Auto/orchestrator/` + `Auto/comeketo-inbox/` (newer mtimes 2026-04-27 16:23). Likely stale duplicate |
| `Auto/comeketo-inbox.skill` (file, not dir) | archive | Original ZIP-packaged skill (the unpacked version is `Auto/comeketo-inbox/`) |
| `docs/page_asset_sitemap.md` | **legacy / stale** | 11 KB; root version is 65 KB and current. Use root |
| `Auto/Onboard Scripts/` | active subset | Missing 7 `analytics_*.py` files present in top-level `Onboard Scripts/` |
| `Comeketo Agent/` (top-level) | active reference | Mirror of `Auto/Comeketo Agent/`; identical except `.DS_Store` |
| `CLAUDE_NOTES.md` | working notes / partial | Older than `CLAUDE.md`; verify before treating as current |

---

## 8. Directory Relationships

How folders depend on one another. See `LEDGERS/VISUALS/directory_ownership_map.mmd` for the diagram.

### Client Box flow (canonical → runtime → UI)

```
Auto/Client Boxes/<Name>/
  ↓ read by
Auto/orchestrator/bin/comms_state_sweep.py + ready_check.py + refresh.py
  ↓ rendered into
Auto/orchestrator/state/<dashboard|today|leads|runs>
  ↓ surfaced by
server.py /api/boxes/* endpoints
  ↓ consumed by
mission_control_loader.js fBoxes()
  ↓ rendered as
screens.jsx BoxesScreen + per-lead specialized renderers
```

### Inbox / send flow

```
Auto/Client Boxes/<Name>/  +  Auto/comeketo-inbox/references/guardrails.md  +  Close comms
  ↓ run through
Auto/comeketo-inbox/scripts/{render_email,price_ballpark}.py + comeketo-inbox SKILL.md
  ↓ scheduled via
CCAgentindex/triggers/auto_*.json + CCAgentindex/scheduled_tasks/
  ↓ actioned in
Close.com (via API or operator approval)
  ↓ updates loop back to
Client Box 01_comms.md / client_ledger.md  +  CCAgentindex/_ledger/activity.jsonl
```

### Intelligence / analytics flow

```
Auto/Client Boxes/  +  Close exports  +  CCAgentindex/people, venues
  ↓ processed by
Onboard Scripts/build_*.py (e.g. build_conversation_intelligence.py)
  ↓ written to
CCAgentindex/intelligence/{cashflow,channels,leads,libraries,ops,sales,_runs}/
  ↓ surfaced by
server.py /api/intelligence/* endpoints
  ↓ rendered in
screens.jsx AnalyticsScreen
```

### UI flow (canonical → surface)

```
Source files: *.jsx, *.js, server.py, styles.css
  ↓ ownership tracked in
page_asset_sitemap.md (project root — Done Gate)
  ↓ rendered into
Secretary.html (via Babel, in-browser)
  ↓ pages addressable via app.jsx route switch
```

### Memory / continuity flow

```
Meaningful work happens
  ↓ updates
LEDGERS/TEMPORAL_CONTINUITY.md  +  relevant local Box ledgers
  ↓ append to
CCAgentindex/_ledger/activity.jsonl
  ↓ if UI/page binding changed, update
page_asset_sitemap.md (Done Gate)
  ↓ if global state changed, update
LEDGERS/GLOBAL_LEDGER.md
  ↓ commit + push to
GitHub (RodbotCC/CCAgent)
```

---

## 9. Local Box / Orientation Index

Where to find directory-specific guidance.

| Directory | Local Orientation | Status |
|---|---|---|
| `Auto/Client Boxes/<Name>/` | Per-box: `AGENTS.md`, `CLAUDE.md` (Hugo has both); `client_ledger.md`; audit markers | active (some boxes) — formal `BOX.md` planned via template |
| `Auto/orchestrator/` | `README.md`, `SYSTEM_OVERVIEW.md`, `MANUAL_FIRE.md`, `KICKOFF_TODAY.md`, `PLAN.md`, `wiring/00_overview.md` | **active** |
| `Auto/comeketo-inbox/` | `SKILL.md`, `references/guardrails.md` | **active** |
| `Auto/Hugodemo/` | `AGENTS.md` | **active** |
| `LEDGERS/` | `INDEX.md`, this `FILE_DIRECTORY_LEDGER.md` | **active** |
| `LEDGERS/AGENTS/` | Per-agent canonical package `AGENTS.md`, config JSON, README | active (first package: `global_ledger_steward`) |
| `LEDGERS/LOCAL_TEMPLATE/` | `BOX_LEDGER_TEMPLATE.md`, `DIRECTORY_ORIENTATION_TEMPLATE.md` | **active** (templates for stamping new Boxes) |
| `CCAgentindex/agents/` | Per-agent runtime `agents.md` + `prompt.md`; app dispatches via `/api/agents/<name>/run` | active |
| `CCAgentindex/intelligence/` | `MANIFEST.md` | active |
| `CCAgentindex/_inbox/`, `_ledger/` | None | none — the files are the record |
| Project root | `CLAUDE.md`, `AGENT.md`, `README.md`, `page_asset_sitemap.md` | **active** |

The Box Ledger and Directory Configuration Ledger (planned) will fill the gaps. The Source-of-Truth Ledger (planned) will give formal authority where this map only points.

---

## 10. Common Wrong-Turns

These are real mistakes future agents are likely to make. Read carefully.

### Wrong-turn: Editing `Auto/orchestrator/state/` files as if they're canonical

**Fix:** Find the source Client Box or generator script in `Auto/orchestrator/bin/`. Files in `state/` are regenerated on every `refresh.py` run.

### Wrong-turn: Treating the Boxes UI page as the client source of truth

**Fix:** Boxes page is a UI surface. `Auto/Client Boxes/<Name>/` is canonical. Edit the box, not the rendered output.

### Wrong-turn: Editing a seven-day plan without checking guardrails

**Fix:** Read `Auto/comeketo-inbox/references/guardrails.md` and the box's `01b_comms_verbatim.md` (current comms) first. Plans are subordinate to comms, state, guardrails, and approvals (NS-04, NS-05, NS-06).

### Wrong-turn: Using enrichment facts as customer-facing facts

**Fix:** Customer-facing copy must ground in `01_comms.md` / `01b_comms_verbatim.md`, not `04_profile.md` or `*_enrichment.md`. See NS-04 Wholesome Enrichment.

### Wrong-turn: Updating a UI page without updating the sitemap

**Fix:** The Done Gate is `page_asset_sitemap.md` at project root. Update Assets Ownership, Change Checklist, History, and Last Verified before considering the work done.

### Wrong-turn: Fixing one client's edge case by changing global automation

**Fix:** Prefer local Box fixes (NS-03 Box-Based Local Intelligence). Use global rules only if the pattern repeats or creates systemic risk.

### Wrong-turn: Editing `docs/page_asset_sitemap.md` thinking it's the live sitemap

**Fix:** It's stale (11 KB, abandoned). The live sitemap is `page_asset_sitemap.md` at project root (65 KB, updated 2026-04-28). The `docs/` copy should probably be deleted; flagged for cleanup.

### Wrong-turn: Adding/editing scripts in `Auto/Onboard Scripts/` and assuming top-level matches (corrected 2026-04-28)

**Corrected understanding:** `Auto/Onboard Scripts/` (24 files) is the **canonical / working** set, translated from a predecessor app. Top-level `Onboard Scripts/` (31 files, includes 7 `analytics_*.py`) is **legacy** being slowly mined and rewritten as the analytics page work progresses. They are NOT identical and should NOT be synced.

**Fix:** Add new scripts to `Auto/Onboard Scripts/` (canonical). Treat top-level `Onboard Scripts/` as a source pool to mine when needed; don't delete it (still being used for analytics rewrite). When the analytics rewrite is complete, top-level can be archived. See PROB-013 (corrected entry).

### Wrong-turn: Editing `Auto/Boxes/orchestrator/` thinking it's the live orchestrator

**Fix:** It appears to be a stale snapshot of `Auto/orchestrator/` + `Auto/comeketo-inbox/` (mtime 2026-04-27 16:23). The live orchestrator is `Auto/orchestrator/`. Don't edit `Auto/Boxes/`; flag with Jake before any cleanup.

### Wrong-turn: Looking for `Comeketo Agent/` at the project root

**Fix:** Renamed 2026-04-28 to **`Aesthetic Asset Kit/`** to disambiguate purpose (it's the visual design system — Comeketo Design Deck.html + tokens.css + components.css + deck-stage.js + icons.js — used to keep all builds aligned). `Auto/Comeketo Agent/` retained at its original path for orchestrator reference. PROB-014 closed.

### Wrong-turn: Trusting CLAUDE.md's "surviving CCAgentindex domains" list

**Fix:** CLAUDE.md §1 says surviving domains are `people, venues, _ledger, _inbox, indexes`. Reality is 26 directories — see §4.2 above. Many "retired" domains (`Rodbot`, `commitments`, `threads`, `projects`, `knowledge`, `tables`, `annotations`, `charts`) survive as `.gitkeep` stubs; many populated domains (`intelligence/` 119 files, `agent_plans/` 40, `reports/` 28, `triggers/` 12, etc.) aren't mentioned. Trust this ledger's §4.2 first; coordinate a CLAUDE.md sync via Jake.

### Wrong-turn: Writing through the `Auto/` symlink without authorization

**Fix:** `Auto/` is a symlink to `/Users/jakeaaron/Desktop/Auto/`, owned by the team's standalone automation. CLAUDE.md §1 says read-only by default; writes need explicit team authorization. Today's verbatim comms backfill (2026-04-28) and Brenda audit were such authorized writes.

---

## 11. Directory Change Done Gate

Update this ledger when:

- A top-level directory is added, removed, renamed, or repurposed.
- An important subdirectory is added, removed, renamed, or repurposed.
- A directory's canonical / generated / legacy status changes.
- Source-of-truth ownership moves between directories.
- A local Box, `AGENTS.md`, `CLAUDE.md`, or `README.md` is added to a directory.
- A major relationship between directories changes (e.g. a new generator pipeline).
- Agents have repeatedly edited the wrong area (add to §10 Common Wrong-Turns).
- A new common wrong-turn is discovered.
- A duplicate or stale parallel directory is created or resolved.

Do **not** update this ledger for every tiny file addition. Use the planned File Contents Ledger for important-file responsibilities.

---

## 12. Visualization Index

Visual maps under `LEDGERS/VISUALS/`:

- [`VISUALS/file_directory_map.mmd`](VISUALS/file_directory_map.mmd) — repo root → top-level dirs → key children. The shape of the tree.
- [`VISUALS/directory_ownership_map.mmd`](VISUALS/directory_ownership_map.mmd) — canonical vs generated flow. Client Boxes → orchestrator scripts → state → UI surface; Guardrails + Client Boxes → fire → Close → comms update.

Planned:

- `client_box_directory_flow.mmd` — drill-down inside a single Client Box

Mermaid is the chosen format because it stays versioned and diffable.

---

## 13. Update Rules

Update the File Directory Ledger when the conditions in §11 fire. Do not duplicate page/widget/file-level detail — that belongs in the planned File Contents Ledger and Asset/Widget Map.

When updating: bump `Last updated`, refresh §3 if top-level changes, refresh §4 for the affected subdirectory, add a §10 entry if a new wrong-turn was discovered, regenerate visuals if directory shape changed.

---

## Final Operating Rule

> A file path is not just a location.
>
> It is a responsibility boundary.
>
> Before editing the file, understand the directory.
> Before moving the directory, update the map.

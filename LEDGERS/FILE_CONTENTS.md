# File Contents Ledger

Last updated: 2026-04-29 (initial creation — Phase 13 of ledger system buildout; tier: global; envelope-aware under `DEC-2026-04-29-013`)
Maintainer: Jake / Comeketo Agent project agents
Status: **active**
Tier (Box Bus Ledger §3): **global** — fans out to every Box that subscribes at the global tier
Read when: editing an unfamiliar file, deciding whether a change belongs in file A or file B, debugging a missed companion-file update, onboarding to a part of the project you haven't touched, or auditing whether a file is still doing the job it's supposed to.
Core rule: **Important files should have a known job.**
Steward agent: not yet authored. Phase B work — when written it lands at `/Subagent Boxes/file_contents_subagent_package/`.

> The File Directory Ledger tells you **where** things live.
> The Box Ledger tells you **how to behave** inside meaningful directories.
> This ledger tells you **what each important file does** — what it owns, what depends on it, when it should be edited, and what should be updated alongside it.
>
> A future agent should not have to grep its way into understanding.

---

## 1. Purpose

Many agent failures happen at the file level: editing a large shared file without understanding its role; putting new logic into the wrong module; changing a source without updating the generated-output pipeline; editing a file that looks canonical but is actually derived; missing the file that should have been changed instead; failing to update related files after a change.

This ledger is the project's **"what is this file?"** layer. It does not summarize every line. It tells you what each load-bearing file is responsible for, what depends on it, what depends on it changing, and the common mistakes around it.

### Owns

- per-file **purpose statements** (one paragraph each)
- file **type / status** (canonical / generated / template / archive / config)
- **edit guidance** (when this file should change; when it shouldn't)
- **dependency notes** (what it reads from; what reads from it)
- **companion-file rules** (what gets updated alongside)
- **common mistakes** to avoid
- **verification steps** when changing
- **cross-references** to ledgers / Decisions / Open Problems / per-Box notes

### Does not own

- every file in the repo → only load-bearing ones (per §3 inclusion rule)
- full code documentation → code comments + upstream docs
- line-by-line explanations → not durable here
- every widget dependency → Asset / Widget Map (planned)
- API documentation surfaces → upstream service docs
- historical edits → `git log` and `_ledger/activity.jsonl`
- per-page render details → Page Ledgers (planned)
- per-Client-Box content → the Box itself
- runtime state → `today.html`, `master_ledger.csv`, etc. (these have entries here that say "this is generated")

This ledger names the **role**. The file names the **content**.

---

## 2. Inclusion Rule

A file deserves an entry if **at least one** is true:

- It is edited often.
- It is large or crowded.
- It controls routing, page rendering, server / API behavior, or automation.
- It defines guardrails or policy.
- It defines source-of-truth rules.
- It generates output that other systems read.
- It **is** generated output that agents might accidentally edit.
- It stores important configuration.
- It is a canonical template.
- It has known common mistakes.
- It connects multiple systems.
- It requires companion updates when changed.

If it's a one-off utility, a vendor file, a generated artifact, or a leaf-level helper — leave it out. The point is signal, not coverage.

---

## 3. Entry Format

```
### `<relative path>`

Category:        <see §4 categories>
Type:            canonical | generated | template | archive | config | mixed
Edited often?:   yes | no | rarely
Owner:           <component / system / steward>
Purpose:         <one paragraph>
Owns:            <bulleted list of what this file is the truth-source for>
Reads from:      <upstream files / services>
Read by:         <downstream files / systems>
When to edit:    <triggers>
When NOT to edit: <warnings>
Companion updates: <files / ledgers that change alongside>
Common mistakes:   <things future agents have done or might do>
Verification:    <how to confirm a change worked>
Related ledgers / decisions: <list>
```

Not every field needs prose every time. **Purpose**, **Owns**, **Companion updates**, and **When NOT to edit** are the load-bearing four.

---

## 4. File Categories

| Category | Cluster |
|---|---|
| `ledger` | Project memory ledgers (`LEDGERS/*.md` / `.json`) |
| `runtime-frontend` | Browser-loaded JS/JSX/CSS/HTML at project root |
| `runtime-backend` | Server-side Python (`server.py`) |
| `meta-harness` | Agent-facing instructions, sitemaps, guardrails (root `.md`) |
| `orchestrator` | `Auto/orchestrator/` runtime/render/state |
| `inbox-skill` | `Auto/comeketo-inbox/` skill + scripts + references |
| `bedrock-index` | `CCAgentindex/` indexes, activity log, hooks |
| `client-box-convention` | Per-Client-Box file kinds (template-shape, applies to all 28) |
| `staff-box-convention` | Per-Staff-Box file kinds |
| `template` | `LEDGERS/LOCAL_TEMPLATE/` stamps |

---

## 5. Project Memory Ledgers (`LEDGERS/`)

### `LEDGERS/GLOBAL_LEDGER.md` + `.json`

Category: `ledger` · Type: canonical · Edited: rarely (once per phase or when world state shifts)
Purpose: Top-level world-state, project identity, source-of-truth rules summary, agent work protocol, Done Gate, ledger system map. Read first by every meaningful session.
Owns: project identity, current world state, major systems map, global rules, active workstreams, active risks, ledger registry summary.
Read by: every agent (read-first protocol).
When to edit: project identity changes; new major system added/retired; global source-of-truth rules change; new ledger created; new phase begins; major risk posture changes.
When NOT to edit: tiny local changes (those go in the relevant local ledger).
Companion updates: `INDEX.md` (status changes), `TEMPORAL_CONTINUITY.md` §3 (recent changes).
Common mistakes: accreting per-domain detail in §4 instead of pointing at SoT; updating prose without bumping `Last updated`.
Related: `DEC-2026-04-29-003` (TCL/GL update discipline), `DEC-2026-04-28-008` (one ledger at a time).

### `LEDGERS/TEMPORAL_CONTINUITY.md` + `.json`

Category: `ledger` · Type: canonical · Edited: every meaningful session
Purpose: Current project moment — recent changes, active assumptions, carry-forward context, next handoff. The cockpit log. Read after Global.
Owns: where the project is *in time*; what the next agent needs to pick up.
When to edit: every session that touches anything project-state-shaped.
Companion updates: `_ledger/activity.jsonl` mirrors mechanical changes; this captures human-readable narrative.
Common mistakes: letting it go stale during Phase A bursts; treating it as "history" instead of "current".
Related: `DEC-2026-04-29-003`.

### `LEDGERS/NORTH_STAR.md` + `.json`

Category: `ledger` · Type: canonical · Edited: rarely (when goals shift)
Purpose: Project thesis, 10 NS goals (NS-01 through NS-10), anti-goals, tradeoff rules, audit questions, Wholesome Enrichment principle.
Owns: the *why* behind every other ledger.
Read by: anyone planning major work or auditing.
When NOT to edit: don't add tactical rules here — those belong in DoD or Decisions.

### `LEDGERS/FILE_DIRECTORY_LEDGER.md` + `.json`

Category: `ledger` · Type: canonical · Edited: when tree shape changes
Purpose: Top-level + subdirectory map, ownership table, canonical-vs-generated lists, status taxonomy, common wrong-turns.
Companion to: this ledger (FDL = where; this = what).
Common mistakes: forgetting to update §6 (canonical vs generated) when promoting / demoting a file.

### `LEDGERS/OPEN_PROBLEMS_LEDGER.md` + `.json`

Category: `ledger` · Type: canonical · Edited: when problems found / closed
Purpose: 13 active + 1 partial + 2 closed problems with stable IDs (`PROB-YYYY-MM-DD-###`), severity, urgency, close criteria.
**Append-only for past entries** — never rewrite history; mark `closed` and add a history line.
When to edit: a problem is found, fixed, or its workaround changes.

### `LEDGERS/COMMUNICATIONS_LEDGER.md` + `.json`

Category: `ledger` · Type: canonical · Edited: every session that leaves a handoff
Purpose: How agents talk across time — handoffs, warnings, lessons, attempts, cross-system notes.
Owns: durable session-to-session messages.
Read by: every agent at session start and end.

### `LEDGERS/DECISIONS_LEDGER.md` + `.json`

Category: `ledger` · Type: canonical · Edited: when an architectural choice is made
Purpose: 17 active decisions with stable IDs (`DEC-YYYY-MM-DD-###`), rationale, alternatives, consequences, do-not-undo-casually.
When NOT to edit: don't reverse a decision without an explicit superseding entry.

### `LEDGERS/DEFINITION_OF_DONE.md` + `.json`

Category: `ledger` · Type: canonical · Edited: when work-type Done Gates evolve
Purpose: Universal Done Gate (8 questions), 11 work-type Done Gates, Ledger Update Matrix, 55/45 build rhythm.
Owns: what "done" means.
Companion: `page_asset_sitemap.md` for UI Done Gate; per-Box audit markers for client work.

### `LEDGERS/BOX_LEDGER.md` + `.json`

Category: `ledger` · Type: canonical · Edited: when Box concept evolves
Purpose: Defines what a Box *is* — concept, classes, status labels, BOX.md vs DIRECTORY.md, Local Agent Protocol, stamping rhythm.
Pairs with: `BOX_BUS_LEDGER.md` (concept vs wire shape).

### `LEDGERS/BOX_BUS_LEDGER.md` + `.json`

Category: `ledger` · Type: canonical (schema-only) · Edited: when manifest schema or routing rules change
Purpose: How Boxes connect — `box.json` manifest schema, ledger envelope, 3 routing tiers, 3 interpreter tiers, cycle policy.
**Runtime deferred to Phase C** per `DEC-2026-04-29-013`. Schema is canonical now.
When NOT to edit: don't ship runtime code; that's Phase C work.

### `LEDGERS/SOURCE_OF_TRUTH.md` + `.json`

Category: `ledger` · Type: canonical · Edited: when trust orderings shift or new domain added
Purpose: Universal trust ordering, per-domain trust orderings, Allowed-To-Know 4-bucket schema, conflict resolution.
First envelope-aware ledger.

### `LEDGERS/CONNECTIONS.md` + `.json`

Category: `ledger` · Type: canonical · Edited: when external service is added/removed/changes status
Purpose: External-system inventory (11 active + 2 planned + 3 not-in-use), per-service contracts, failure modes, verification, billing.
First domain-tier ledger.
**Never store raw secrets here** — only env var names.

### `LEDGERS/INDEX.md`

Category: `ledger` · Type: canonical · Edited: every time a new ledger lands or a status changes
Purpose: Roster of all ledgers and their build status. Table of contents for `LEDGERS/`.
Companion updates: must change in lockstep with `GLOBAL_LEDGER.md` §8.

---

## 6. Runtime — Frontend (project root)

### `app.jsx`

Category: `runtime-frontend` · Type: canonical · Edited: often (when routes/screens change)
Purpose: React app shell — declares the route table, hooks the router into screens, owns top-level layout. The first JS file the browser executes after `mission_control_loader.js`.
Owns: route registration, top-level error boundaries, screen mounting.
Read by: `Secretary.html` (loads it).
When to edit: a new route/screen is added; the route table changes.
Companion updates: `page_asset_sitemap.md` (DoD §5.3 Done Gate); cache-buster bump in `Secretary.html`.
Common mistakes: editing without bumping the sitemap; introducing a route that has no Page Ledger plan.
Related: `DEC-2026-04-29-007` (sitemap-Done-Gate).

### `screens.jsx`

Category: `runtime-frontend` · Type: canonical · Edited: very often
Purpose: Every UI screen lives here as a top-level component (`HomeScreen`, `BoxesScreen`, `IntakeScreen`, `AnalyticsScreen`, `BriefingScreen`, etc.). Surviving 11 routes after the Apr 2026 great trim: grid, settings, leads, clients, coworkers, contacts, briefing, activity, automation, intake, analytics.
Owns: per-screen render logic, screen-local state, screen-level data fetch.
Common mistakes: stuffing widget logic into a screen instead of `components.jsx`; editing a screen without updating the sitemap; forgetting cache-buster bump.
Companion updates: `page_asset_sitemap.md`, `Secretary.html` cache-buster.
Related: `DEC-2026-04-29-006` (one identity per Box across the app); `DEC-2026-04-29-005` (Box Reports synthesized, not copied).

### `components.jsx`

Category: `runtime-frontend` · Type: canonical · Edited: often
Purpose: Shared UI components used by multiple screens — design-kit cards, admonition styling, dossier renderer, markdown blocks, the Boxes-page specialized renderers (Hugo + Brenda/Steve).
Owns: reusable visual primitives.
When NOT to edit: don't put screen-specific logic here — it goes in `screens.jsx`.

### `automation.jsx`

Category: `runtime-frontend` · Type: canonical · Edited: when automation page evolves
Purpose: `AutomationScreen`-related rendering and logic — workflow display, trigger surfaces, manual-fire UI.
Companion: `Auto/orchestrator/wiring/automations.md` (the catalog).

### `connectors.js`

Category: `runtime-frontend` · Type: canonical · Edited: when a new send channel is added
Purpose: Channel registry for the Delegations picker. Each channel: id, label, icon, readiness check via `/api/status`, send function. Channels: claude_code, clickup, slack, email, whatsapp, sms, note, internal, open_url.
Owns: client-side channel catalog.
Companion updates: `LEDGERS/CONNECTIONS.md` (the new service must exist there as `active`); `server.py` (proxy handlers); `/.env` (credentials).
Common mistakes: adding a channel to the picker without updating `CONNECTIONS.md`; editing a channel without re-running readiness check logic.
Related: `LEDGERS/CONNECTIONS.md` §11.

### `ai.js`, `ai_actions.js`, `ai_instructions.js`

Category: `runtime-frontend` · Type: canonical · Edited: when chat/AI behavior evolves
Purpose: `ai.js` — chat client and message rendering. `ai_actions.js` — tool/action handlers the chat can dispatch. `ai_instructions.js` — system-prompt assembly: bedrock structured truth + Pieces ambient context, voice profiles, lead enrichment.
Common mistakes: hardcoding tool behavior in `ai.js` instead of `ai_actions.js`; editing system prompt without bumping the loader version.

### `chat.js`

Category: `runtime-frontend` · Type: canonical · Edited: rarely
Purpose: Conversation widget — message list, input, autoscroll, keyboard handling.

### `data.js`

Category: `runtime-frontend` · Type: canonical · Edited: rarely
Purpose: Static data tables and demo seeds for the UI when bedrock data isn't loaded.

### `delegator.js`

Category: `runtime-frontend` · Type: canonical · Edited: when delegation flow changes
Purpose: Delegation channel picker UI + send-flow orchestration on the front-end side.
Companion: `connectors.js` (channels), `server.py` `/api/delegate` (the subprocess spawner).

### `grid_scorer.js`

Category: `runtime-frontend` · Type: canonical · Edited: when grid scoring evolves
Purpose: Score and rank items for the home grid surfaces.

### `lucide.js`

Category: `runtime-frontend` · Type: vendor / config · Edited: only when adding a new icon
Purpose: Lucide icon registry used across the UI.

### `mission_control_loader.js`

Category: `runtime-frontend` · Type: canonical · Edited: when bedrock data shape changes
Purpose: Loads bedrock JSON files into `window.MissionControl` at startup — people, venues, workflows, triggers, agent_plans, hooks, catalog_edges. The bridge between bedrock and the UI.
Owns: `window.MissionControl` schema in the browser.
Reads from: `CCAgentindex/indexes/index.json` and the files it lists.
Read by: every screen that consumes `window.MissionControl`.
When to edit: a new bedrock domain is added (and registered in `index.json`).
Companion updates: `mission_control_schema.md`, `index.json`, cache-buster bump.
Common mistakes: forgetting to bump version after a schema change → stale cache hides the new domain.
Related: `mission_control_schema.md`.

### `mission_control_schema.md`

Category: `meta-harness` · Type: canonical · Edited: when bedrock schema changes
Purpose: Documentation of `window.MissionControl` shape — names of arrays, fields per record kind, expected types.

### `styles.css`

Category: `runtime-frontend` · Type: canonical · Edited: often (design-kit work)
Purpose: Project-wide CSS. Pastel palette variables, design-kit cards, admonition styling, layout primitives.
Companion: `Secretary.html` cache-buster bump.

### `Secretary.html`

Category: `runtime-frontend` · Type: canonical · Edited: when JS/CSS bundle versions change
Purpose: Single-page entry point. Loads vendor scripts (React, Lucide, etc.) + project JS/JSX/CSS with **cache-busted version params** (e.g., `screens.jsx?v=95`).
Owns: bundle reference list with versions.
**Cache-buster bump rule:** any time a referenced file changes, bump its `?v=` number here so browsers refetch.
Common mistakes: editing a JS file without bumping its `?v=` here → users see stale code.
Related: `DEC-2026-04-29-007` (sitemap-Done-Gate).

### `Guardrails.html`

Category: `meta-harness` · Type: canonical · Edited: when guardrail policy evolves
Purpose: Standalone HTML reference for the inbox guardrail contract — hard gates, auto-pauses, reply gates, frequency caps. The human-readable rendering that pairs with `comeketo-guardrails-agent.md`.
Pairs with: `Auto/comeketo-inbox/SKILL.md`.

---

## 7. Runtime — Backend

### `server.py`

Category: `runtime-backend` · Type: canonical · Edited: when API endpoints change or external services are wired
Purpose: Single-file stdlib HTTP server. Backs every UI route, proxies external services (Close, Pieces, OpenAI, ClickUp, Slack, Twilio), spawns `claude -p` for delegations, manages `_BLOCKED_DELEGATION_TOOLS` policy, hosts `/api/*` endpoints, enforces CORS, reads `/.env` at startup.
Owns: all `/api/*` routing; subprocess management for delegations; MCP session caching for Pieces.
Reads from: `/.env` (every credential env var); bedrock files; ledger files for status endpoints.
Read by: every UI request.
When to edit: new endpoint, new external service wiring, new tool policy, new bedrock domain to surface.
Companion updates: `LEDGERS/CONNECTIONS.md` if external service added; `connectors.js` if a new client-side channel is needed; `page_asset_sitemap.md` if a UI surface depends on a new endpoint.
Common mistakes: leaking secrets in error messages; not handling MCP session expiry; forgetting to add a new env var to status endpoint surface.
Related: `LEDGERS/CONNECTIONS.md` (every credential env var listed there).

---

## 8. Meta-Harness (project root `.md` + key `.html`)

### `CLAUDE.md`

Category: `meta-harness` · Type: canonical · Edited: rarely
Purpose: Project-local agent instructions — Prime Directive (ledger discipline), canonical paths, scope gate, schema-by-example rule, index registration rule, ledger append rule, sitemap Done Gate, return discipline. The first file every Claude session must read.
**Authoritative for `claude` subprocesses spawned with cwd in this repo.**
When NOT to edit: don't soften the Prime Directive without an explicit Decisions Ledger entry.
Common mistakes: §1 surviving-domains list goes stale (PROB-2026-04-28-010 tracks this).

### `AGENT.md`

Category: `meta-harness` · Type: canonical · Edited: when subprocess agent rules change
Purpose: Subprocess-agent-facing instructions for `claude -p` invocations.
Companion to: `CLAUDE.md`.

### `AGENTS.md`

Category: `meta-harness` · Type: canonical · Edited: when agent registry changes
Purpose: Roster of agent personas the project recognizes. Per-Client-Box `AGENTS.md` files override scope locally.

### `page_asset_sitemap.md`

Category: `meta-harness` · Type: canonical · Edited: every page/route/data-binding change (it's the UI Done Gate)
Purpose: Per-page Asset Ownership / Change Checklist / History / Last Verified for every surviving UI route. The operational truth for UI ownership.
**Hard rule:** any task that changes a page is not done until this file is updated (DoD §5.3, `DEC-2026-04-29-007`).
Surviving routes (11): grid, settings, leads, clients, coworkers, contacts, briefing, activity, automation, intake, analytics.
Common mistakes: editing `screens.jsx` without updating the sitemap entry; forgetting to bump `Last Verified`.

### `comeketo-guardrails-agent.md`

Category: `meta-harness` · Type: canonical · Edited: when guardrail rules evolve
Purpose: Agent-facing reference for inbox guardrails — paired with `Guardrails.html` (human view) and `Auto/comeketo-inbox/SKILL.md` (operational).

### `README.md`

Category: `meta-harness` · Type: canonical · Edited: rarely
Purpose: Project overview for humans first finding the repo.

### `skills_index.md`

Category: `meta-harness` · Type: canonical · Edited: when skills are added
Purpose: Roster of available skills. Mirrors `<available_skills>` exposed to Cowork agents.

### `CLAUDE_NOTES.md`

Category: `meta-harness` · Type: notes · Edited: as needed
Purpose: Working scratchpad for Claude-related notes. Lower-stakes than `CLAUDE.md`.

---

## 9. Orchestrator — `Auto/orchestrator/`

### `Auto/orchestrator/bin/_lib.py`

Category: `orchestrator` · Type: canonical · Edited: rarely (shared lib)
Purpose: Common Close API helpers, path resolution, shared utilities for the orchestrator scripts. Imported by every other `bin/` script.
When NOT to edit: don't break callers — `_lib` changes ripple.

### `Auto/orchestrator/bin/comms_state_sweep.py`

Category: `orchestrator` · Type: canonical · Edited: when sweep logic evolves
Purpose: The recurring sweep that reconciles Close.com state into Client Boxes — pulls latest activities, updates `01_comms.md` summaries, refreshes `00_meta.json` flags, marks plan staleness when replies arrive.
Owns: the bridge from Close → Client Box state.
Reads from: Close API (via `_lib.py`).
Writes to: `Auto/Client Boxes/<Name>/01_comms.md`, `00_meta.json`, `client_ledger.md`.
Common mistakes: not respecting the reply-gate rule (any meaningful reply invalidates the plan).
Related: `LEDGERS/CONNECTIONS.md` (close + cowork_scheduled_tasks); `DEC-2026-04-28-004` (plans-are-strategy-drafts).

### `Auto/orchestrator/bin/ready_check.py`

Category: `orchestrator` · Type: canonical · Edited: when ready-state criteria change
Purpose: Determines which leads are ready for the next scheduled fire — checks plan-day cadence, reply-gate state, frequency caps, guardrail flags.
Owns: the gate before any scheduled send.

### `Auto/orchestrator/bin/refresh.py`, `today.py`, `voice.py`, `index.py`

Category: `orchestrator` · Type: canonical
Purpose: `refresh.py` — re-runs sweep + ready check. `today.py` — produces `state/today.html` snapshot. `voice.py` — voice/persona helpers. `index.py` — orchestrator entry point.

### `Auto/orchestrator/render_lead.py`

Category: `orchestrator` · Type: canonical · Edited: when per-lead render evolves
Purpose: Generates per-lead rollup HTML/markdown for the orchestrator state directory.

### `Auto/orchestrator/wiring/automations.md`

Category: `orchestrator` · Type: canonical · Edited: when an automation routine changes
Purpose: The routine catalog — every scheduled / triggered automation declared with trigger source, target, guardrails, log target.
Read by: `Auto/orchestrator/bin/*` and the AutomationScreen.

### `Auto/orchestrator/state/today.html`, `state/master_ledger.csv`

Category: `orchestrator` · Type: **generated** · Edited: NEVER hand-edit
Purpose: Daily orchestrator snapshots. **Views of state, not state itself** (Global §4.4).
**When NOT to edit:** never. They are regenerated by `today.py` and the sweep pipeline. Hand-edits will be lost on next run.
Common mistake: agents see `today.html` looks "wrong" and try to fix it directly. Fix the source data and re-run instead.

---

## 10. Inbox Skill — `Auto/comeketo-inbox/`

### `Auto/comeketo-inbox/SKILL.md`

Category: `inbox-skill` · Type: canonical · Edited: when send-safety rules evolve
Purpose: The operational contract for the Comeketo inbox. Hard gates (fee waivers, discounts, scope promises, price guarantees), auto-pauses, reply gates, frequency caps, NEPQ-style guidance, ballpark calculator integration.
**Overrides plans, profiles, enrichment.**
Pairs with: `Guardrails.html` + `comeketo-guardrails-agent.md`.

### `Auto/comeketo-inbox/references/`

Category: `inbox-skill` · Type: canonical reference · Edited: rarely
Purpose: NEPQ-style reference, guardrails detail, voice notes.

### `Auto/comeketo-inbox/scripts/price_ballpark.py`, `render_email.py`

Category: `inbox-skill` · Type: canonical · Edited: when pricing logic or template changes
Purpose: `price_ballpark.py` calculates ballpark quotes from the menu data. `render_email.py` builds the HTML email body from the template.
Companion: `assets/menu_data.json`.

### `Auto/comeketo-inbox/assets/menu_data.json`

Category: `inbox-skill` · Type: config · Edited: when pricing or menu changes
Purpose: Pricing input. **The single source of truth for ballpark quote math.**
Common mistake: editing pricing in the script instead of in this JSON.

---

## 11. Bedrock Indexes — `CCAgentindex/`

### `CCAgentindex/indexes/index.json`

Category: `bedrock-index` · Type: canonical · Edited: every time a new bedrock file is created in a loader-visible domain
Purpose: The loader authority. If a file is not listed here, the UI does not see it.
Reads: it's the registry; nothing reads *from* it except `mission_control_loader.js`.
Read by: `mission_control_loader.js` and every script that walks bedrock domains.
**Hard rule:** every new file in `CCAgentindex/people/`, `venues/`, `agents/`, `agent_plans/`, `triggers/`, `workflows/`, `hooks/`, `catalog/` must be listed here. The loader will silently skip unlisted files.
Common mistakes: creating a new `people/<slug>.json` and forgetting to register it → the new person is invisible in the UI.

### `CCAgentindex/_ledger/activity.jsonl`

Category: `bedrock-index` · Type: **append-only** · Edited: append events only — NEVER rewrite past lines
Purpose: Project audit trail. Every non-trivial delegation, ledger change, decision, problem-status-change appends one line here.
**When NOT to edit:** never rewrite past lines. Past entries are the trail.
Companion: per-ledger updates write a corresponding human-readable history line in their own md/json.

### `CCAgentindex/_inbox/inbox.jsonl`

Category: `bedrock-index` · Type: append-only · Edited: append only
Purpose: Inbox events log. Same append-only rule as `activity.jsonl`.

### `CCAgentindex/agents/<name>/`

Category: `bedrock-index` · Type: canonical · Edited: when a runnable app agent is added/changed
Purpose: Runnable app agents — `andre_escalation_ladder`, `global_ledger_steward`, `inbox_triage`. Each has `agents.md`, `prompt.md`, optional `tools.md`.
Reachable via: `POST /api/agents/<name>/run`.

---

## 12. Per-Client-Box Convention — `Auto/Client Boxes/<Name>/`

These file *kinds* apply to all 28 Client Boxes. Per-Box content is the Box's own; this section names the *role* of each file kind.

### `00_meta.json`

Type: canonical · Owns: structured metadata — `lead_id`, `name`, `smart_view_label`, harvested-at, enrichment-tier, altitude, `comms_dirty`, `_skip_outbound`, plan-day-1 date, last-inbound-detected-at, last-sweep-at.
Companion updates: changes here often need a `client_ledger.md` line.

### `01_comms.md`

Type: canonical · Owns: curated executive summary of comms — derived from `01b_comms_verbatim.md` but written for human/agent reading.
**Source-of-truth rank: 4** per `SOURCE_OF_TRUTH.md` §3.1. Use only when verbatim is unavailable.

### `01b_comms_verbatim.md`

Type: canonical · Owns: full Close.com chronological transcripts — calls, voicemails, emails, SMS, WhatsApp.
**Source-of-truth rank: 2** per `SOURCE_OF_TRUTH.md` §3.1. Highest-fidelity local mirror.
Refreshed by: the verbatim backfill (manual, rarely; needs `CLOSE_API_KEY`).

### `comms/<type>_<date>_<id>.json`

Type: canonical raw payloads · Owns: raw Close API payloads.
**Source-of-truth rank: 3.** Read when transcripts need machine parsing.

### `04_profile.md`, `*_enrichment.md`

Type: **internal-only** · Owns: useful internal strategy from enrichment / public sources.
**Never customer-facing.** Customer copy must ground in `01_comms.md` / `01b_comms_verbatim.md` / approved operator notes (per `SOURCE_OF_TRUTH.md` §3.1 + Allowed-To-Know §4).

### `05_seven_day_plan.md`

Type: **strategy draft, not truth** · Owns: tactical send sequence proposal.
**Subordinate to comms, state, guardrails, approvals.** A reply invalidates the plan until reviewed.
Common mistake: treating plan text as executable copy without re-validating against current comms.

### `06_logic.md`, `07_skills_used.md`, `08_automations.md`

Type: canonical · Owns: per-Box logic and tooling notes.

### `09_andre_alerts.md`

Type: canonical · Owns: the Andre review/approval log — what's been raised, what was decided.

### `10_andre_feedback.md`

Type: canonical · Owns: Andre's feedback per Box.

### `15.0*_outcome.md`

Type: canonical · Owns: post-close outcomes — `15.01_close_outcome.md`, `15.02_followup_outcome.md`, `15.03_hold_outcome.md`, `15.06_referral_opportunity.md`, `15.07_post_close_handoff.md`, `15.08_outcome_ledger_update.md`.

### `client_ledger.md`

Type: canonical · Owns: running operator log per Box — every meaningful change appended.
**Append-only by convention.**

### `<YYYY-MM-DD>_audit_marker.md`

Type: canonical · Owns: the trace of an explicit audit pass. First example: Brenda & Steve `2026-04-28_audit_marker.md`.

### `AGENTS.md`, `CLAUDE.md` (per-Box)

Type: canonical · Owns: per-Box agent instructions / scope.
Phase 1 Intake unification (`DEC-2026-04-29-008`) doesn't yet honor these in the ask system prompt — that's Phase 2 work.

### `allowed_to_use.json` (planned per Box)

Type: canonical · Owns: per-Box Allowed-To-Know schema instance per `SOURCE_OF_TRUTH.md` §4.2.
**Not yet authored in any Box** — Hugo Casillas is the natural first test case (PROB-2026-04-28-001 partial close).

---

## 13. Per-Staff-Box Convention — `Auto/Staff Boxes/<Name>/`

Mirrors the Client Box pattern but for the 10 internal staff voice/profile substrates. File kinds: voice profile, persona notes, voice samples, escalation rules. Used by `ai_instructions.js` to inject coworker voice profiles inline.

---

## 14. Templates — `LEDGERS/LOCAL_TEMPLATE/`

### `LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md`

Type: template · Owns: the stamp for any new Box's local `BOX.md`.
Edit only when the standard Box shape changes.

### `LEDGERS/LOCAL_TEMPLATE/DIRECTORY_ORIENTATION_TEMPLATE.md`

Type: template · Owns: the stamp for "you are here" files in any directory.

---

## 15. Update Protocol

Update this ledger when:

- a new file meets the §2 inclusion rule
- an existing file's role materially changes
- a file moves from canonical → generated or vice versa (also triggers SoT §6 update protocol)
- a common mistake pattern is observed
- a verification step changes
- a file is deprecated or retired

When updating: bump `Last updated`, refresh the JSON mirror, update §5–§14 entries, append history.

**Inclusion-rule check:** when a new file lands, decide whether it deserves an entry. Default to **no** unless §2 fires. Better to leave a utility file out than to dilute the ledger with low-signal entries.

---

## 16. Relationship To Other Ledgers

- **File Directory Ledger** — names *where* files live; this ledger names *what* they do.
- **Box Ledger / Box Bus Ledger** — define what a Box is and how Boxes connect; this ledger names per-file roles within Boxes (per the §12 + §13 convention sections).
- **Source-of-Truth Ledger** — defines trust orderings; this ledger says which file is at each rank.
- **Definition of Done** — §5.5 (Source-of-Truth Change) and §5.7 (Box / Directory Work) reference this ledger when a file's role shifts.
- **Connections Ledger** — defines services; this ledger names which file *uses* which service.
- **Decisions Ledger** — many entries here cite specific decisions (`DEC-2026-04-29-007`, `DEC-2026-04-28-004`, etc.).
- **Open Problems Ledger** — file-level problems (PROB-2026-04-28-010 about CLAUDE.md domain list) cross-reference here.

---

## 17. North Star Alignment

This ledger directly supports:

- **NS-02 Legibility** — every load-bearing file has a one-line role description.
- **NS-09 Agent Handoff Continuity** — a new agent reading an unfamiliar file can find its job here in seconds.
- **NS-07 Rebuildability** — knowing what a file owns is half of knowing how to rebuild it.
- **NS-06 Source-of-Truth Discipline** — type labels (canonical / generated / template) prevent canonical-vs-generated confusion at the file level.

Indirect: NS-01 (durable memory), NS-10 (defense — file-level common-mistakes notes are defense).

---

## 18. Final Operating Rule

> If a file is load-bearing, its job should be findable in this ledger.
>
> If a file is not load-bearing, it doesn't belong here.
>
> If you can't tell the difference, walk the §2 inclusion rule before writing.

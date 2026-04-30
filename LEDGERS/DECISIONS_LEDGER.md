# Decisions Ledger

Last updated: 2026-04-29 (Phase 10 — added DEC-2026-04-29-013 Reactive Box Network architectural lock; companion BOX_BUS_LEDGER landed)
Maintainer: Jake / Comeketo Agent project agents
Status: **active**
Read when: starting major work, auditing changes, considering reversing an architectural choice, citing rationale, resolving tradeoffs, or running an audit pass.
Core rule: **Decisions that shape future work must survive the session where they were made.**
Steward agent: not yet authored. Phase B work — when written it lands at `/Subagent Boxes/decisions_subagent_package/`.

> A decision is stronger when it is written down.
>
> Without a Decisions Ledger, the project keeps relitigating the same questions. The Decisions Ledger preserves the judgment behind the answers — what was decided, why, what alternatives were rejected, and what future agents should not casually undo.

---

## 1. Purpose

This ledger records **major project choices** and the reasoning behind them. It explains:

- what was decided
- why
- what alternatives were considered
- what consequences follow
- what future agents should not casually reverse
- what should be revisited if conditions change

Without these records, future agents will reopen settled questions, accidentally reverse architectural choices, or drift the project away from its intent.

### Owns

- major architectural decisions
- operational decisions
- safety / guardrail decisions
- source-of-truth decisions
- workflow decisions
- technology / tooling decisions
- project philosophy decisions
- deprecations and reversals
- decision status, scope, confidence
- decision rationale and alternatives considered
- affected systems
- consequences
- review triggers

### Does not own

- every small implementation choice → `git log` + `_ledger/activity.jsonl`
- all current tasks → not durable as decisions
- every bug → Open Problems Ledger
- active uncertainties / unresolved debates → Open Problems Ledger or §8 below
- detailed work logs → Temporal Continuity §3 + Communications Ledger
- complete meeting notes → not durable
- experimental research notes → Scout Ledger (planned)

This ledger is **selective**. If everything is a decision, nothing is a decision.

---

## 2. Decision Record Format

Every decision uses a stable ID with an optional slug for human readability:

```
DEC-YYYY-MM-DD-### [optional-slug]
```

Examples:
- `DEC-2026-04-28-001` (canonical form)
- `DEC-2026-04-28-001 github-source-of-truth` (with slug for browsability)

Template:

```
## DEC-YYYY-MM-DD-### — <Decision Title>

Status:                    <see §3>
Confidence:                high | medium | low
Scope:                     global | local | experimental | client-specific | UI | automation
Date:                      YYYY-MM-DD
Decider:                   <user | session | named role>
Affected systems:          <list>
Related North Star goals:  <NS-XX list>
Related ledgers:           <list>
Supersedes:                <DEC ID | none>
Superseded by:             <DEC ID | none>

### Decision
What was decided. One paragraph.

### Context
What situation caused the decision.

### Rationale
Why this was chosen.

### Alternatives Considered
What else could have been done.

### Consequences
What this changes downstream.

### Do Not Undo Casually
What future agents should avoid reversing without explicit review.

### Review Trigger
When this decision should be revisited.

### History
- YYYY-MM-DD — created.
```

Not every field must be long. But every decision should include **decision**, **context**, **rationale**, and **consequences**.

---

## 3. Decision Status Labels

Use exactly one:

| Status | Meaning |
|---|---|
| `active` | Current decision, should be followed |
| `experimental` | Current but under trial; may not survive |
| `provisional` | Accepted for now, may change soon |
| `under-review` | Being reconsidered |
| `superseded` | Replaced by a later decision |
| `deprecated` | No longer recommended |
| `rejected` | Considered and explicitly not chosen (kept for "we already thought about this" record) |

Optional fields:

- **Confidence:** `high` | `medium` | `low`
- **Scope:** `global` | `local` | `experimental` | `client-specific` | `UI` | `automation` | `workflow` | `meta`

These help future agents calibrate how strongly to obey a decision.

---

## 4. Current Active Decisions

Quick index for skimming. Full records in §5.

| ID | Decision | Status | Confidence | Scope | Affected Systems |
|---|---|---|---|---|---|
| DEC-2026-04-28-001 | GitHub Is The Source Of Truth | active | high | global | all repo-backed systems |
| DEC-2026-04-28-002 | FileTree Orchestration Over RAG Memory | active | high | global | ledgers, Boxes, agents, meta harness |
| DEC-2026-04-28-003 | Client Boxes Are Canonical Client Truth | active | high | client automation | Client Boxes, Boxes page, orchestrator |
| DEC-2026-04-28-004 | Seven-Day Plans Are Strategy Drafts, Not Send Licenses | active | high | automation safety | Client Boxes, scheduled fires, inbox |
| DEC-2026-04-28-005 | Risky Sales Moves Require Isolated Approval | active | high | send safety | inbox, approvals, Client Boxes |
| DEC-2026-04-28-006 | Boxes Page Is Display Layer, Not Canonical Truth | active | high | UI / source truth | Boxes page, Client Boxes |
| DEC-2026-04-28-007 | Page-Asset Sitemap Is Mandatory Done Gate For Page Changes | active | high | UI Done Gate | UI pages, routes, APIs |
| DEC-2026-04-28-008 | Build Ledgers One At A Time | active | high | workflow | ledger buildout |
| DEC-2026-04-29-001 | Triad Spine: Box + Ledger + Sub-agent | active | high | global / architectural | every stateful entity |
| DEC-2026-04-29-002 | Three-Phase Build Discipline (A → B → C) | active | high | workflow | ledgers, sub-agents, Subagent Boxes |
| DEC-2026-04-29-003 | TCL/GL Update Discipline (Same Unit Of Work) | active | high | meta / workflow | every change touching project state |
| DEC-2026-04-29-004 | Audit Ledger Removed From Build Queue | active | medium | meta / scope | ledger system |
| DEC-2026-04-29-005 | Box Reports Are Synthesized Views, Not Copies | active | high | architecture / Intake-Box | Intake page, Boxes page, server `_box_report_*` |
| DEC-2026-04-29-006 | One Identity Per Box Across The App (slug = box id) | active | high | identity / routing | Intake, Boxes, ledgers |
| DEC-2026-04-29-007 | Box Reports Refresh On Read | active | high | architecture / perf | server `_box_report_synthesize` |
| DEC-2026-04-29-008 | Phase 1 Intake → Box Is Read-Mostly (no agent-config plumbing yet) | active | high | scope / phasing | Intake ask path, Boxes |
| DEC-2026-04-29-013 | Reactive Box Network Is The Target Architecture (schema only; runtime deferred to Phase C) | active | high | global / architectural | every stateful entity in the project; future bus runtime |

16 active decisions. 0 superseded. 0 deprecated.

---

## 5. Decision Records

### 2026-04-28 (Phase 1–5 ledger buildout era — foundational decisions)

#### DEC-2026-04-28-001 — GitHub Is The Source Of Truth

Status: **active**
Confidence: high
Scope: global
Date: 2026-04-28
Decider: User / project owner
Affected systems: all repo-backed systems, ledgers, agents, Client Boxes, automation
Related North Star goals: NS-01, NS-02, NS-09, NS-10
Related ledgers: Global Ledger §4.1, Source-of-Truth (planned)
Supersedes: none
Superseded by: none

##### Decision

GitHub (`RodbotCC/CCAgent`, branch `main`) is the durable source of truth for the project. The local file tree is the working copy. Important project memory, ledgers, source files, maps, decisions, and handoff notes are versioned and pushed to GitHub.

##### Context

The project needs continuity across agents, tools, MCP servers, local machines, and future sessions. Local-only state and chat history are not durable enough.

##### Rationale

GitHub gives the project shared, versioned, inspectable memory. It lets other agents and tools connect through Git instead of relying on the user's local machine. Versioning makes drift visible and reversible.

##### Alternatives Considered

- Local-only file tree (no shared truth)
- Chat history as memory (not durable, not searchable, not versioned)
- RAG / vector memory as primary continuity (opaque, hard to audit, not file-tree-aware)
- Scattered docs outside repo (no single source)

##### Consequences

- Important project memory belongs in repo files.
- Ledgers must be committed.
- Agents should report commit SHAs when writing directly.
- Direct GitHub writes must consider that the user may have unpushed local work (see also `COMM-2026-04-28-004` warning about Git drift).
- The repo IS the memory of the build.

##### Do Not Undo Casually

Do not move core continuity back into chat-only or local-only memory without explicit review.

##### Review Trigger

Revisit only if GitHub stops being accessible or another versioned source-of-truth system replaces it.

##### History

- 2026-04-28 — created.

---

#### DEC-2026-04-28-002 — FileTree Orchestration Over RAG Memory

Status: **active**
Confidence: high
Scope: global
Date: 2026-04-28
Decider: User / project owner
Affected systems: ledgers, Boxes, meta harness, agent workflow, memory architecture
Related North Star goals: NS-01, NS-02, NS-03, NS-09
Related ledgers: Global Ledger §1, North Star NS-01
Supersedes: none
Superseded by: none

##### Decision

The project uses **FileTree orchestration** as its primary memory and coordination model — not RAG / vector memory. Each meaningful directory carries context, rules, ledgers, source-of-truth notes, and local memory.

##### Context

The user wants durable, inspectable, directory-aware continuity. Memory that lives in opaque vector stores cannot be audited, versioned, or handed off cleanly between agents.

##### Rationale

FileTree orchestration gives agents explicit, versioned, local context. It is easier to audit, rebuild, hand off, and reason about than vague retrieval over scattered memory. It composes naturally with GitHub (DEC-001) and with the Triad Spine (DEC-2026-04-29-001).

##### Alternatives Considered

- RAG / vector memory as primary project memory (opaque, drift-prone)
- Chat history as continuity (not durable)
- Ad hoc docs (no structure)
- Monolithic global memory file (does not scale)
- Database-backed memory (heavier, less inspectable)

##### Consequences

- Important memory belongs in files.
- Directories should become Boxes when meaningful.
- Local context should live near the files it governs.
- Meta harness should read ledgers and local Boxes before work.
- Pieces.app stays as a *secondary* memory backend — useful for activity recall, not as the primary continuity layer.

##### Do Not Undo Casually

Do not replace Box / local-file continuity with hidden memory without review. A hybrid retrieval layer is acceptable as a *helper* if the file tree remains source of truth.

##### Review Trigger

Revisit only if a hybrid retrieval layer is added as a helper while keeping file tree as source of truth.

##### History

- 2026-04-28 — created.

---

#### DEC-2026-04-28-003 — Client Boxes Are Canonical Client Truth

Status: **active**
Confidence: high
Scope: client automation
Date: 2026-04-28
Decider: User / project owner
Affected systems: Client Boxes, Boxes page, orchestrator, scheduled fires, inbox automation
Related North Star goals: NS-03, NS-04, NS-06
Related ledgers: Global Ledger §4.3, Open Problems (PROB-001 — allowed-to-know layer)
Supersedes: none
Superseded by: none

##### Decision

`Auto/Client Boxes/<Name>/` is the **canonical per-client memory and operating substrate**. The Boxes page and orchestrator state are read / render / generation layers over that substrate.

Authority order for client truth:

1. `01b_comms_verbatim.md` and `comms/*.json` — full Close.com record
2. `01_comms.md` — curated exec summary
3. `00_meta.json` — structured metadata
4. `client_ledger.md` — running operator log
5. approved operator notes
6. `04_profile.md` and `*_enrichment.md` — internal strategy only, **not customer-facing truth**

##### Context

There was confusion about whether the `boxes` UI / page or `Auto/Boxes` umbrella was the actual client truth. The project clarified that Client Boxes hold the specific client memory, comms, state, profile, plan, alerts, and local audit notes.

##### Rationale

Client-specific complexity should live inside the client's own Box. One client's constraints should not force global automation rewrites. Co-locating truth with the client makes audits, handoffs, and per-box discipline tractable.

##### Alternatives Considered

- Treating Boxes page as the source (UI-as-source — see DEC-006 for why this was rejected)
- Treating orchestrator state as the source (generated, not canonical)
- Centralizing all client logic in one global automation (does not scale, does not respect local context)
- Database-backed client truth (heavier, less inspectable)

##### Consequences

- Client-specific edits happen in the relevant Client Box.
- The Boxes page is **never** treated as canonical client truth (DEC-006).
- Generated state should point back to Client Boxes.
- Per-client audit markers and local notes matter.
- The Allowed-To-Know layer (PROB-001) will live inside each Client Box.

##### Do Not Undo Casually

Do not make UI or generated dashboard state the canonical source for client truth without explicit migration.

##### Review Trigger

Revisit only if a database-backed canonical client layer is intentionally introduced.

##### History

- 2026-04-28 — created.

---

#### DEC-2026-04-28-004 — Seven-Day Plans Are Strategy Drafts, Not Send Licenses

Status: **active**
Confidence: high
Scope: automation safety
Date: 2026-04-28
Decider: User / project owner
Affected systems: Client Boxes, scheduled fires, inbox automation, guardrails
Related North Star goals: NS-04, NS-05, NS-06
Related ledgers: Open Problems (PROB-002), Communications (`COMM-2026-04-28-005`)
Supersedes: none
Superseded by: none

##### Decision

A **seven-day plan is a strategy draft**. It does not authorize sending by itself.

Before any send, the current comms, state, guardrails, approvals, calendar reality, frequency caps, and reply gates must still pass. **Reply received → plan is stale.**

##### Context

Some plans were written before guardrails were fully enforced. A plan can contain strong strategy but still conflict with current send rules or changed client state. The Brenda & Steve audit revealed plans with stale dates, risky commitment language, and enrichment leakage.

##### Rationale

Plans age. Replies, transcripts, state sweeps, and updated guardrails can invalidate a previously good plan. Treating plan text as send authority is the failure mode this decision prevents.

##### Alternatives Considered

- Treat seven-day plan text as executable send authority (rejected — unsafe)
- Disable plans entirely (rejected — useful as strategy)
- Require manual rewrite before every move (rejected — too slow)

##### Consequences

- Scheduled fires must treat plans as input, not authority.
- If a lead replies, the plan is stale and may need rewrite.
- Plan audits should check for stale dates, risky commitments, and enrichment leakage.
- Client Box cleanup should flatten risky future sends.
- The Brenda & Steve plan now opens with `Audit-cleaned: 2026-04-28 01:40 AM ET` and a Safety Status block — that's the template.

##### Do Not Undo Casually

Do not allow automation to send directly from plan text without guardrail validation.

##### Review Trigger

Revisit if a formal plan compiler / validator is built that enforces all gates before execution.

##### History

- 2026-04-28 — created.

---

#### DEC-2026-04-28-005 — Risky Sales Moves Require Isolated Approval

Status: **active**
Confidence: high
Scope: send safety
Date: 2026-04-28
Decider: User / project owner
Affected systems: inbox automation, approval surfaces, Client Boxes, scheduled fires
Related North Star goals: NS-04, NS-05, NS-06
Related ledgers: Open Problems (PROB-003), Communications (`COMM-2026-04-28-003` — promoted from)
Supersedes: none
Superseded by: none

##### Decision

Risky sales moves may be **suggested** by automation, but they require **explicit isolated approval** before customer-facing send.

Risky moves include:

- fee waivers
- discounts
- free services
- no-charge language
- guest-count promises
- pricing guarantees
- scope expansions
- enrichment-based personalization
- strong claims not grounded in comms

##### Context

The Brenda & Steve fee-waiver move may have been strategically correct, but it was approved in a rushed batch context and did not receive enough isolated risk friction. Batching risky moves with safe ones hid the risk.

##### Rationale

Good sales judgment and safe automation are not the same thing. Automation can suggest bold moves, but a human should explicitly own financial, pricing, scope, or risky personalization commitments.

##### Alternatives Considered

- Ban all risky moves (rejected — too restrictive)
- Allow risky moves inside normal batch approval (rejected — hides risk)
- Auto-send risky moves if plan says so (rejected — directly unsafe)

##### Consequences

- Risky moves should become explicit approval cards.
- Approval cards should name the risk clearly.
- Batch approval should not hide financial / scope commitments.
- Future Client Box plans should gate or flatten risky language.
- The exact UI / process for approval cards is not yet decided — see §8 (Approval UI / Risk Card Standard) below.

##### Do Not Undo Casually

Do not let risky commitments ship as ordinary follow-up copy without explicit approval.

##### Review Trigger

Revisit after approval UI supports isolated risk confirmations robustly.

##### History

- 2026-04-28 — created.
- 2026-04-29 — `COMM-2026-04-28-003` (Brenda fee-waiver lesson) promoted into this decision.

---

#### DEC-2026-04-28-006 — Boxes Page Is Display Layer, Not Canonical Truth

Status: **active**
Confidence: high
Scope: UI / source truth
Date: 2026-04-28
Decider: User / project owner
Affected systems: Boxes page, Client Boxes, orchestrator state, page-asset sitemap
Related North Star goals: NS-06, NS-08
Related ledgers: Global Ledger §4.6, Source-of-Truth (planned)
Supersedes: none
Superseded by: none

##### Decision

The `boxes` route / page is a **UI read / display surface** over Client Boxes, Staff Boxes, and orchestrator state. It does not own canonical client truth.

##### Context

The sitemap says the Boxes page reads `Auto/Client Boxes`, `Auto/Staff Boxes`, and `Auto/orchestrator/state`, and exposes a single-surface dossier view. That could visually imply ownership if not documented.

##### Rationale

UI should make truth visible, not become truth accidentally. UI changes shouldn't be able to silently rewrite client memory.

##### Alternatives Considered

- Treat Boxes page as canonical client source (rejected — see DEC-003)
- Treat orchestrator state as canonical (rejected — generated state)
- Hide source distinction (rejected — confuses agents and operators)

##### Consequences

- Fix client truth in Client Boxes, not the UI display.
- Fix generated state through sources / generators.
- Page changes still update page-asset sitemap (DEC-007).
- Boxes page should clearly communicate source freshness and generated / canonical distinctions where possible.

##### Do Not Undo Casually

Do not write client truth into the Boxes page layer without source-of-truth migration.

##### Review Trigger

Revisit if a database or app-native canonical Box store replaces file-based Client Boxes.

##### History

- 2026-04-28 — created.

---

#### DEC-2026-04-28-007 — Page-Asset Sitemap Is Mandatory Done Gate For Page Changes

Status: **active**
Confidence: high
Scope: UI Done Gate
Date: 2026-04-28
Decider: Existing project policy / accepted into ledger system
Affected systems: UI pages, routes, APIs, page data binding, sitemap
Related North Star goals: NS-06, NS-08, NS-10
Related ledgers: CLAUDE.md §5.5, Global Ledger §4.7, Asset/Widget Map (planned)
Supersedes: none
Superseded by: none

##### Decision

Any task that changes a page, route behavior, or page data binding is **not complete** until `page_asset_sitemap.md` is updated. Append to the relevant page section's `Asset Ownership`, `Change Checklist`, and `History` lines, and bump `Last Verified`.

##### Context

The Comeketo Page-Asset Source Of Truth already defines this mandatory Done Gate. It was already operating policy before the ledger system; this decision simply formalizes it.

##### Rationale

Page behavior and data ownership drift quickly if not recorded. Without the gate, sitemap and reality diverge silently.

##### Alternatives Considered

- Rely on code diffs only (rejected — diffs don't tell you what owns what)
- Update sitemap only occasionally (rejected — drift)
- Replace sitemap with comments in code (rejected — not browsable)

##### Consequences

- UI / page work must include sitemap update in the same unit of work.
- Asset / Widget Map should link to sitemap rather than duplicate it.
- Audits can fail page work if sitemap is stale.
- Surviving routes after the Apr 2026 trim: `grid, settings, leads, clients, coworkers, contacts, briefing, activity, automation, intake, analytics`.

##### Do Not Undo Casually

Do not remove this Done Gate without replacing it with an equal or stronger page ownership system.

##### Review Trigger

Revisit only if Page Ledgers or an automated page map supersede the sitemap.

##### History

- 2026-04-28 — formalized into the ledger system.

---

#### DEC-2026-04-28-008 — Build Ledgers One At A Time

Status: **active**
Confidence: high
Scope: workflow
Date: 2026-04-28
Decider: User
Affected systems: ledger implementation workflow, agent handoff, INDEX.md build order
Related North Star goals: NS-01, NS-09, NS-10
Related ledgers: INDEX.md, Communications (`COMM-2026-04-28-001` — promoted from)
Supersedes: none
Superseded by: none

##### Decision

The ledger system is designed and implemented **one ledger at a time**. The user signals (typically by typing `P` or uploading the next ledger spec) to proceed.

##### Context

The ledger system is large (~22 planned ledgers). Implementing it all at once would be too broad and would create shallow, low-quality files.

##### Rationale

One-ledger-at-a-time keeps focus, creates rhythm, and lets the user hand clean implementation outlines to the building agent. Each ledger gets a dedicated outline at `/Ledger Drafts/<name>.txt`.

##### Alternatives Considered

- Build all ledgers in one pass (rejected — shallow output)
- Start coding without design (rejected — drift)
- Only create a global README (rejected — no continuity layer)

##### Consequences

- Each ledger gets a dedicated implementation outline at `/Ledger Drafts/`.
- Implementation can evolve without overwhelming the repo.
- Build order is tracked in `LEDGERS/INDEX.md`.

##### Do Not Undo Casually

Do not attempt a massive all-ledgers rewrite unless the user explicitly changes workflow.

##### Review Trigger

Revisit after first wave of ledgers is implemented (likely after Phase 10–12).

##### History

- 2026-04-28 — created.
- 2026-04-29 — `COMM-2026-04-28-001` (ledger build rhythm handoff) promoted into this decision.

---

### 2026-04-29 (post-Phase-5 architectural settling)

#### DEC-2026-04-29-001 — Triad Spine: Box + Ledger + Sub-agent

Status: **active**
Confidence: high
Scope: global / architectural
Date: 2026-04-29
Decider: User / project owner
Affected systems: every stateful entity in the project (Client Boxes, Staff Boxes, ledgers, sub-agents, future state-bearing systems)
Related North Star goals: NS-01, NS-02, NS-03, NS-09, NS-10
Related ledgers: Global Ledger §3, Temporal Continuity §1, Communications (`COMM-2026-04-29-001` — promoted from)
Supersedes: none
Superseded by: none

##### Decision

The architectural spine of Comeketo Agent is the **Box + Ledger + Sub-agent triad**. Anything with state that learns or needs updating gets all three:

- **Box** — the unit of state (Client Boxes, Staff Boxes, Coworker records, eventually any state-bearing entity)
- **Ledger** — the legible memory of that Box (project-wide ledgers under `LEDGERS/`; per-Box ledgers stamp from `LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md`)
- **Sub-agent** — the operator that reads / updates the Box and its Ledger (canonical config in `/Subagent Boxes/<name>/`; runnable form in `CCAgentindex/agents/<name>/`)

Standing inviolable rule: **legibility is more important than the build itself**. Code without a corresponding Ledger entry is debt to repay. A Ledger reader should understand the system without opening code.

Jake's exact words (2026-04-28): *"For everything that we build we cannot be lazy about the legibility. I am actually more concerned about the legibility than the build."*

##### Context

The project went through a plumbing-first attempt that was scrapped under demo pressure (see `COMM-2026-04-28-008` for build-arc context). After the rebuild, the architectural spine wasn't formally named. On 2026-04-29 the triad was codified during a Claude Code catch-up session as the rule that organizes everything stateful.

##### Rationale

Ledgers without Boxes are floating memory. Boxes without Ledgers are illegible state. Sub-agents without either are operators with no memory or context. Skipping any leg of the triad produces a system that cannot continue itself across agents.

The triad also gives the project a clean three-phase build order (DEC-2026-04-29-002) — fill the Boxes side first (Client / Staff / etc., already mostly done), then the Ledger side (Phase A, currently in flight), then the Sub-agent side (Phase B), then finally stamp the per-Box Ledgers controlled by sub-agents (Phase C).

##### Alternatives Considered

- Boxes-only (rejected — illegible)
- Ledgers-only (rejected — no operating substrate)
- Sub-agents-only (rejected — no memory)
- Two-leg systems (Box + Ledger; or Box + Sub-agent) — rejected because each missing leg produces a known failure mode
- Centralized state without Boxes (rejected — see DEC-003)

##### Consequences

- Before designing anything stateful, ask: *Where is the Box? Where is the Ledger? Where will the Sub-agent live?* If any answer is "we'll figure that out later," stop and figure it out now.
- The triad is currently **lopsided**: more Boxes than Ledgers, more Ledgers than Sub-agents. Filling the grid is the dominant verb.
- Per-Box ledgers stamp from `LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md`.
- Steward sub-agents follow the pattern established by `global_ledger_steward` (canonical at `LEDGERS/AGENTS/<name>/`, runnable at `CCAgentindex/agents/<name>/`).

##### Do Not Undo Casually

Do not propose architectural patterns that bypass any leg of the triad. If a system has state, it gets all three.

##### Review Trigger

Revisit only if a fundamentally different state-management primitive emerges (e.g., a database-backed canonical layer that subsumes Boxes — would also trigger DEC-003 review).

##### History

- 2026-04-29 — created. Promoted from `COMM-2026-04-29-001`.

---

#### DEC-2026-04-29-002 — Three-Phase Build Discipline (A → B → C)

Status: **active**
Confidence: high
Scope: workflow
Date: 2026-04-29
Decider: User
Affected systems: ledger system, sub-agent system, bedrock, build planning
Related North Star goals: NS-01, NS-09, NS-10
Related ledgers: INDEX.md, Temporal Continuity §1, Communications (`COMM-2026-04-29-003` — promoted from)
Supersedes: none
Superseded by: none

##### Decision

Build order, in this exact sequence:

1. **Phase A — finish all Ledgers.** Ingest outline drafts from `/Ledger Drafts/` one at a time, in user-confirmed order. *(Currently in this phase as of 2026-04-29.)*
2. **Phase B — finish all Sub-agents.** Graduate the draft sub-agent packages at `/Subagent Boxes/` into runnable app agents under `CCAgentindex/agents/<name>/`.
3. **Phase C — build Subagent Boxes.** Boxes of ledgers controlled by sub-agent configurations. The triad becomes operational.

Do not skip ahead. Do not parallelize without explicit approval.

##### Context

After the plumbing-first attempt was scrapped (see `COMM-2026-04-28-008`), the rebuild made it clear that the triad needed to be filled in a specific order to avoid producing partial systems that confuse future agents.

##### Rationale

Ledgers without sub-agents are static memory. Sub-agents without ledgers have nowhere to write. Subagent Boxes (boxes of ledgers controlled by sub-agent configurations) require both prior layers to exist. The ordering protects the spine.

Phase A also unblocks PROB-016 (bedrock reconciliation), which is gated on ledger + sub-agent buildouts completing.

##### Alternatives Considered

- All-three-in-parallel build (rejected — too broad, drift-prone)
- Sub-agents-first (rejected — no ledgers to read / write)
- Subagent-Boxes-first (rejected — both prior layers missing)
- B before A (rejected — operators with no memory)

##### Consequences

- When asked to build something with state, agents confirm which phase the project is in before proposing structure.
- Phase A: build the ledger only, note the eventual sub-agent home as a placeholder (this is the pattern Communications and Decisions are following).
- Phase B: graduate the existing draft package into a runnable app agent.
- Phase C: stamp the Box of the relevant ledger with sub-agent configuration.
- PROB-016 (bedrock reconciliation) is blocked on Phase A + Phase B completion.

##### Do Not Undo Casually

Do not skip phases. Do not parallelize without explicit user approval.

##### Review Trigger

Review on Phase A completion. The order may stay or evolve based on what's painful when Phase B starts.

##### History

- 2026-04-29 — created. Promoted from `COMM-2026-04-29-003`.

---

#### DEC-2026-04-29-003 — TCL/GL Update Discipline (Same Unit Of Work)

Status: **active**
Confidence: high
Scope: meta / workflow
Date: 2026-04-29
Decider: User / project owner
Affected systems: every change touching project state, every cold-starting agent
Related North Star goals: NS-01, NS-09, NS-10
Related ledgers: Temporal Continuity Ledger, Global Ledger, Communications (`COMM-2026-04-29-005` — promoted from)
Supersedes: none
Superseded by: none

##### Decision

**Cold-starting agents read the Temporal Continuity Ledger and Global Ledger first.** If those ledgers are stale, every agent that boots from them is stale. Therefore: whoever does the work also updates the orientation surface **in the same unit of work** as the change itself — not after, not later, not in a follow-up commit.

Specifically, every meaningful change must:

- Update header `Last updated` dates on TCL and Global Ledger when applicable.
- Append to TCL §3 Recent Meaningful Changes for any non-trivial change.
- Update TCL §1 Current Snapshot if anything structural changed.
- Update GL §12 Recently Changed for major moves.
- Update GL §2 Current World State if a structural fact changed.
- Append to `CCAgentindex/_ledger/activity.jsonl` for any non-trivial delegation.

##### Context

This decision exists because the failure mode happened during a Cowork → Claude Code → Cowork handoff on 2026-04-29: a Cowork session read a TCL written ~24 hours earlier and had no idea about that day's catch-up work. Jake's framing: *"The ledger is more important than the actual work. Literally everything needs to be ledgered."*

##### Rationale

The fix is not smarter agents — it's discipline. Orientation surfaces ARE the agent. If they're stale, the agent is stale. Treating ledger updates as an optional epilogue is the failure mode this decision exists to prevent.

##### Alternatives Considered

- Periodic ledger sweeps (rejected — drift between sweeps)
- Steward-agent-only updates (rejected — relies on the steward running; the sub-agent might not exist yet)
- Manual end-of-session checklist (rejected — easy to skip when tired)
- Auto-generated TCL from git log (rejected — loses semantic continuity)

##### Consequences

- Every non-trivial work session ends with a TCL / GL update.
- Header dates are bumped accurately and frequently.
- Cold-starting agents can trust TCL / GL as current.
- The `global_ledger_steward` agent helps verify drift but does not replace this discipline.
- A ledger update IS the work, not a follow-up.

##### Do Not Undo Casually

Do not adopt patterns that defer ledger updates to "later" or to a separate commit. Same unit of work, every time.

##### Review Trigger

This decision does not expire. It is the meta-rule that keeps every other ledger usable.

##### History

- 2026-04-29 — created. Promoted from `COMM-2026-04-29-005` (lesson form).

---

#### DEC-2026-04-29-004 — Audit Ledger Removed From Build Queue

Status: **active**
Confidence: medium
Scope: meta / scope
Date: 2026-04-29
Decider: User
Affected systems: ledger system, build queue, future audit-shaped findings
Related North Star goals: NS-09, NS-10
Related ledgers: INDEX.md, Open Problems, Decisions (this ledger), Communications, per-Box ledgers
Supersedes: none
Superseded by: none

##### Decision

The **Audit Ledger is removed from the build queue**. Audit-shaped findings will land in:

- **Open Problems Ledger** — if the finding describes something broken / risky / unresolved
- **Decisions Ledger (this)** — if the finding settles a question
- **Communications Ledger** — if the finding is a warning, lesson, or handoff for future agents
- **Per-Box ledgers** — if the finding is local to a specific Box (e.g., `Auto/Client Boxes/<Name>/<YYYY-MM-DD>_audit_marker.md`)

The draft outline at `/Ledger Drafts/# Audit Ledger.txt` stays as reference but is not built.

##### Context

After the Communications Ledger landed (Phase 6, 2026-04-29) and the Open Problems Ledger had been live for a day, Jake observed that audit findings naturally distribute across the three sibling ledgers + per-Box ledgers. A dedicated Audit Ledger would duplicate the coverage already provided.

Jake's words: *"I don't think we're ever going to need that. It's basically covered in the other things."*

##### Rationale

A standalone Audit Ledger would create three failure modes:

1. **Coverage overlap** — most audit findings are already either Open Problems, Decisions, Communications, or local Box notes.
2. **Discoverability cost** — readers would need to check yet another ledger.
3. **Maintenance overhead** — a fifth memory-of-the-work surface to keep in sync.

Removing it tightens the system and pushes audit-shaped findings into the right home.

##### Alternatives Considered

- Build a thin Audit Ledger that just cross-references other ledgers (rejected — adds maintenance, low value)
- Keep Audit as planned but defer indefinitely (rejected — leaves an unclear status; better to make a clean call)
- Build Audit fully (rejected — see Rationale)
- Delete the draft outline (rejected — keep as reference in case the call gets reversed)

##### Consequences

- INDEX.md row marked `out-of-scope (2026-04-29)`.
- Global Ledger §8 Audit row marked similarly.
- Build order item 4 (in INDEX) struck through.
- Audit-pattern findings go to one of: Open Problems, Decisions, Communications, per-Box.
- The Brenda audit pattern (which seeded much of the initial OPL content) continues to work — it just routes findings into existing ledgers instead of a dedicated Audit Ledger.

##### Do Not Undo Casually

This is the freshest decision in the ledger and carries `confidence: medium`. If a future agent finds that audit findings genuinely don't fit any of the four homes, it's worth re-opening this question. **Don't reverse without that evidence.**

##### Review Trigger

Revisit if:

- A future audit pattern emerges that genuinely doesn't fit Open Problems / Decisions / Communications / per-Box.
- Audit-shaped reporting becomes a frequent operator-facing need (e.g., compliance, regulatory).
- The volume of audit findings makes per-ledger distribution painful to read.

##### History

- 2026-04-29 — created.

---

### 2026-04-29 (Phase 1 Intake → Box unification)

#### DEC-2026-04-29-005 — Box Reports Are Synthesized Views, Not Copies

Status: **active**
Confidence: high
Scope: architecture / Intake-Box
Date: 2026-04-29
Decider: User (with assistant proposal)
Affected systems: Intake page, Boxes page, server `_box_report_*` helpers, Client Box folders
Related North Star goals: NS-01, NS-02, NS-03
Related ledgers: Global Ledger §3, Open Problems (none new), Communications (none yet)
Supersedes: none
Superseded by: none

##### Decision

A Box Report is a **synthesized view** over `Auto/Client Boxes/<Name>/`. The server reads the box folder on every `/api/reports/get` call and assembles a `documents[]` payload from the live files. **No `report.json` is written into the box folder.** The Box Report has no separate persistent representation — only the Q&A history (kept at `CCAgentindex/reports/_box_conversations/<box_id>.jsonl`) lives outside the box.

##### Context

The 2026-04-27 manual `brenda_and_steve` workspace already proved the pattern by accident — its documents were a hand-curated copy of Brenda's box files. Phase 1 of the Intake → Box unification asked: should every Client Box get a real `report.json` mirror, or be rebuilt on read? The plan in `LEDGERS/Drafts/intake_box_unification_plan.md` proposed synthesis. This decision locks it.

##### Rationale

A copy creates a drift surface — two records of the same content diverging silently. A synthesized view has no drift surface: there is exactly one source of truth per Client Box, the box folder itself. Triad-aligned (DEC-2026-04-29-001): the **Box** is the unit of state; an Intake-side report cannot be a parallel Box.

Walking 28 box folders on each list call is milliseconds in practice. If profiling ever shows otherwise, a small in-memory cache (≤5s TTL) is the correct response — not a persisted mirror.

##### Alternatives Considered

- Persisted mirror (`report.json` inside each box folder) — rejected: drift surface; doubles write paths.
- Persisted mirror outside the box (under `CCAgentindex/reports/<box_id>/`) — rejected: same drift problem, plus pollutes the workspace reports list.
- Hybrid (mirror with mtime-based invalidation) — rejected for Phase 1: extra moving parts before measurement justifies them.

##### Consequences

- File drops via Intake on a Box Report write into `Auto/Client Boxes/<Name>/intake_drops/<file>` — the box stays the only writer of canonical content.
- Box Report document deletion from Intake is forbidden (returns 405 with guidance to manage from the Boxes page).
- The `Auto/` symlink is written through *only* for `intake_drops/`. Per CLAUDE.md §1 this is normally guarded; Phase 1 documents this exception in `page_asset_sitemap.md` history.
- Future analytics-as-box / page-as-box / agent-as-box work should default to the same posture: **state lives in the box; UI surfaces are views.**

##### Do Not Undo Casually

Do not introduce a persisted Box Report mirror without first measuring read cost and demonstrating the cache strategy. Drift is the failure mode; performance has not been the failure mode.

##### Review Trigger

- Profiling shows synthesis latency materially affects Intake page loads.
- A future architecture (e.g., box-bus / ledger trickle-down) requires a stable identifier for Box Report content that can't be derived on read.

##### History

- 2026-04-29 — created. Locked alongside the Phase 1 implementation in `screens.jsx` / `app.jsx` / `server.py`.

---

#### DEC-2026-04-29-006 — One Identity Per Box Across The App (slug = box id)

Status: **active**
Confidence: high
Scope: identity / routing
Date: 2026-04-29
Decider: User (with assistant proposal)
Affected systems: Intake routing, Boxes routing, future ledger references, future cross-page nav
Related North Star goals: NS-01, NS-09
Related ledgers: Global Ledger §3
Supersedes: none
Superseded by: none

##### Decision

A Box Report's slug is **the box `id` from `/api/boxes/list`**, with no synthetic prefix. Identities like `hugo_casillas`, `brenda_steve`, or `box_<norm>` for unmatched folders flow through every surface unchanged. Workspace slugs are forbidden from colliding with a Client Box id (`/api/reports/create` returns 409 on collision).

The earlier draft (`LEDGERS/Drafts/intake_box_unification_plan.md`) proposed a `client_box__` prefix; that was dropped in implementation because every existing client-box id is already unique within the catalog and the prefix added no information.

##### Context

Cross-page navigation between Intake and Boxes needs to refer to the same entity by the same name. Two competing identities (a box id + a Box Report slug derived from it) would force every link, every menu item, and every ledger reference to maintain a translation table.

##### Rationale

One identity = trivial cross-nav (`go.push("intake", { openSlug: b.id })` and `go.push("boxes", { selectId: r.slug })` both work because the slug *is* the id). It also keeps future ledger entries that mention a box stable across surfaces — a Decisions Ledger reference to `hugo_casillas` is unambiguous whether the reader is looking at Intake or Boxes.

##### Alternatives Considered

- `client_box__<id>` prefix (the original draft) — rejected: redundant; lookup already resolves uniquely.
- Separate Box Report slug minted at creation time — rejected: introduces a translation table, breaks cross-nav, doubles the namespace.

##### Consequences

- `/api/reports/create` rejects any workspace slug that matches a Client Box id (HTTP 409). The 5 existing workspaces (`a`, `demo`, `multi_data_test`, `snap_benefits`, `brenda_and_steve`) are all safe — none collide.
- Future per-box analytics, per-box agent runs, and per-box ledger references can all key off the same id.
- If a Client Box is renamed (folder rename), its id changes, which orphans the corresponding `_box_conversations/<old_id>.jsonl`. Acceptable for Phase 1; revisit with a migration helper if/when box renames become common.

##### Do Not Undo Casually

Adding a translation layer between box ids and report slugs would force every cross-surface reference to be rewritten. Don't introduce a separate identity space without a concrete need it solves.

##### Review Trigger

- A Client Box ever needs to project multiple report views (e.g., "lite" vs "full") — would justify a slug suffix on the report side.
- A privacy/access-control requirement makes the box id unsafe to expose at the URL layer.

##### History

- 2026-04-29 — created.

---

#### DEC-2026-04-29-007 — Box Reports Refresh On Read

Status: **active**
Confidence: high
Scope: architecture / perf
Date: 2026-04-29
Decider: User (with assistant proposal)
Affected systems: server `_box_report_synthesize`, `_reports_list`, `_reports_get`
Related North Star goals: NS-02
Related ledgers: Global Ledger §11 (Done Gate)
Supersedes: none
Superseded by: none

##### Decision

Every `/api/reports/get?slug=<box_id>` and `/api/reports/list` call re-reads the live Client Box folder. There is no cache, no debounce, no invalidation flag. Workspaces continue to use their stored `report.json`; Box Reports do not.

##### Context

The synthesized-view decision (DEC-2026-04-29-005) leaves a freshness question open: re-read or cache? Phase 1 picks the simplest answer that avoids a class of bugs.

##### Rationale

- Cheap: walking ~25 markdown/json files per box, summing to ~28 boxes × ~10 files for the list endpoint, is sub-100ms even on cold disk.
- Correct: no stale-cache class of bugs.
- Reversible: adding a 5-second TTL cache later is a single-function change with no schema migration.

##### Alternatives Considered

- mtime-based cache (re-read only when the box folder mtime changes) — rejected for Phase 1: small win, more code paths, more failure modes.
- Persistent cache (`box_report.cache.json`) — rejected: same drift problem the synthesized-view decision is trying to avoid.

##### Consequences

- Box Reports always reflect what's in the box folder right now.
- If list-endpoint latency ever becomes a UX problem, the agreed remediation is a small in-memory TTL cache, not persisted state.

##### Do Not Undo Casually

Don't add caching speculatively. Measure first.

##### Review Trigger

- Intake page load time on the production box becomes user-visibly slow.
- The number of Client Boxes grows past ~200 (each new box adds a few ms to the list endpoint).

##### History

- 2026-04-29 — created.

---

#### DEC-2026-04-29-008 — Phase 1 Intake → Box Is Read-Mostly (no agent-config plumbing yet)

Status: **active**
Confidence: high
Scope: scope / phasing
Date: 2026-04-29
Decider: User
Affected systems: Intake ask path, future per-box AGENTS.md plumbing, the deferred reactive box-bus design
Related North Star goals: NS-09, NS-10
Related ledgers: Global Ledger §6 (Active Workstreams), Communications (none new), DEC-2026-04-28-008 (one ledger at a time)
Supersedes: none
Superseded by: (future Phase 2 decision — TBD)

##### Decision

Phase 1 of the Intake → Box unification ships read-only synthesis, the Reports list split, and box-folder ingest. **It explicitly does not** plumb each box's `AGENTS.md` into the `/api/reports/<slug>/ask` system prompt, build per-box analytics templates, or start any reactive-box-bus / ledger trickle-down work. The ask path stays the existing generic prompt assembly.

##### Context

The bigger architecture discussed in this session (every state-bearing surface becomes a box; ledgers route entries downstream to subscribed boxes; sub-agents per box interpret incoming entries) is the right ultimate frame. It is also the **hardest** piece in the project. Building it before the ledger system and sub-agent fleet are stable would force re-wiring on every new ledger and every new sub-agent — exactly the half-finished state the cleanup phase is supposed to prevent.

##### Rationale

- **Cleanup-phase rule** (DEC-2026-04-28-008): one ledger at a time. The same posture applies to architecture: one major surface at a time.
- The Phase 1 surfaces (Reports list split, synthesized view, box-folder ingest) have **zero** dependencies on agent-config plumbing or the bus. They ship cleanly today.
- The bigger architecture has **many** dependencies on ledgers and sub-agents that do not yet exist at sufficient depth. Building the bus before the engines = wiring without engines.
- Phase 2 (per-box `AGENTS.md` → ask system prompt) is the natural next step and can ship without disturbing Phase 1's surfaces.

##### Alternatives Considered

- Ship Phase 1 + agent-config plumbing together — rejected: stretches scope; adds risk to a phase whose value is "talk to the box, today."
- Ship Phase 1 + analytics-as-box — rejected: analytics templates need per-box data shapes that require the ledger system to be further along.
- Defer Phase 1 entirely until the bus is ready — rejected: forfeits the ~1 day of value from "talk to the box, today."

##### Consequences

- Intake ask on a Box Report uses the same generic prompt assembly as Workspaces. Hugo's existing `AGENTS.md` is read as a document but not honored as an operating contract — yet.
- Phase 2 work scope: read `AGENTS.md` (and possibly `CLAUDE.md`, `06_logic.md`, `07_skills_used.md`, `08_automations.md`) when present, fold them into the ask system prompt, fall back to a generic "client-box assistant" prompt otherwise.
- Phase 3+ work scope: per-box analytics templates; only after the ledger system can carry per-box state stably.
- Reactive box-bus / ledger trickle-down: deferred until the ledger taxonomy and steward agents are stable. This is the design captured in this session's chat history; it should land as its own Decisions Ledger entry when it ships.

##### Do Not Undo Casually

Do not start Phase 2/3 work or the bus design while Phase A (ledgers) of DEC-2026-04-29-002 is in flight. The phasing rule is the protection against half-finished architecture.

##### Review Trigger

- Phase A of DEC-2026-04-29-002 completes (all planned ledgers active, stewards landed for the load-bearing ones).
- A user-facing need emerges that requires box-aware ask behavior before then (e.g., a box's `06_logic.md` materially changes how an answer should be phrased and a generic prompt produces wrong output).

##### History

- 2026-04-29 — created. Phase 1 implementation shipped same day.

---

#### DEC-2026-04-29-013 — Reactive Box Network Is The Target Architecture (schema only; runtime deferred to Phase C)

Status: **active**
Confidence: high
Scope: global / architectural
Date: 2026-04-29
Decider: User (Jake) — autonomous-call delegated to Cowork session
Affected systems: every stateful entity in the project; the eventual bus runtime; every ledger authored from this point forward; every Box authored from this point forward
Related North Star goals: NS-01, NS-02, NS-04, NS-09, NS-10
Related ledgers: [`BOX_BUS_LEDGER.md`](BOX_BUS_LEDGER.md), [`BOX_LEDGER.md`](BOX_LEDGER.md), [`DEFINITION_OF_DONE.md`](DEFINITION_OF_DONE.md), DEC-2026-04-29-001 (Triad Spine), DEC-2026-04-29-002 (Three-Phase Build), DEC-2026-04-29-008 (Phase 1 Intake-Box read-mostly)
Supersedes: none
Superseded by: none — narrows DEC-2026-04-29-008's scope rather than replacing it

##### Decision

The project's target architecture is a **reactive network of Boxes connected by a routed Ledger bus**. The architecture is **specified now** (Phase 0, this session) in [`BOX_BUS_LEDGER.md`](BOX_BUS_LEDGER.md). The **runtime** — router daemon (or post-write hook), propagation ledger, T1/T2/T3 interpreters, validation enforcement, cycle enforcement — is **deferred to Phase C** of `DEC-2026-04-29-002`. Phase 0 ships schema and rules only: `box.json` manifest schema, ledger envelope schema, three routing tiers (Global / Domain / Local), three interpreter tiers (T1 deterministic / T2 small-LLM / T3 full sub-agent), hard-refusal cycle policy, "what is a Box / what is not" binding rule, and two worked examples (Hugo Casillas Client Box + Analytics Source Channels Snapshot Box).

##### Context

The architecture was first sketched in chat during the 2026-04-29 Phase 1 Intake → Box session and intentionally deferred (`DEC-2026-04-29-008`) because building runtime before the ledger taxonomy and sub-agent fleet stabilize would force re-wiring on every new ledger and every new sub-agent — exactly the half-finished state the cleanup phase was meant to prevent.

Today's update: Phase 9 (Definition of Done) closed the most foundational completion-rules gap; 9 ledgers are now active out of ~19 planned; all ledgers from here on out will be authored. Without a written architectural target, every one of those remaining ledgers risks being authored without the bus shape in mind — creating migration debt at Phase C. Writing the **schema** down now (a Phase A activity — it's a markdown ledger) gives every future ledger and every future Box a target to align against. Writing the **runtime** would still violate `DEC-2026-04-29-008` and is held.

##### Rationale

- **Schema first / routing second / interpreters third / runtime last.** The hard-but-cheap part is the schema. Authoring it during Phase A is correct; authoring runtime during Phase A is not.
- **Triad spine compatibility (`DEC-2026-04-29-001`).** Box Ledger owns the *concept*. Box Bus Ledger owns the *wire shape*. Definition of Done owns the *completion gate*. Decisions Ledger owns the *architectural lock*. Each leg has a distinct, non-overlapping responsibility.
- **Migration debt avoidance.** Every ledger and every Box authored between today and Phase C ships envelope-aware. When runtime lands, no migration pass is required.
- **Anti-half-finished discipline.** This Decision *narrows* DEC-2026-04-29-008 by carving the schema seam out of the deferred work, while explicitly preserving the runtime deferral. DEC-008's "Do Not Undo Casually" still binds against runtime work during Phase A.
- **Auditability.** A written architecture is reviewable by every future agent. Chat-history architecture is not.

##### Alternatives Considered

- **Defer the schema along with the runtime.** Rejected: every future ledger and every future Box would be authored guessing at a target. Migration debt compounds with each addition.
- **Ship schema + T1-only runtime now.** Rejected: the moment runtime ships, every new ledger requires re-touching the router and the subscription index. The cost shape is exactly what `DEC-2026-04-29-008` was designed to prevent.
- **Wait until Phase C and author schema + runtime together.** Rejected: by Phase C the project will have ~19 ledgers and ~40 Boxes authored without alignment to a target. Migration would be substantial.
- **Author schema in chat / docs / a Decisions Ledger entry only.** Rejected: the Bus design is large enough to deserve its own ledger with worked examples and Mermaid visuals; folding it into a Decision row buries the architecture.
- **Use a different name (e.g., "Event Bus Ledger," "Subscription Network Ledger").** Considered. Picked "Box Bus Ledger" because the unit of state on both ends of a route is a Box, and the bus carries Box-bound events.

##### Consequences

- **Phase A continues with envelope-aware ledgers.** Every remaining Phase A ledger (Source-of-Truth, Phase, Connections, Page Ledgers, etc.) declares its tier (`global` / `domain` / `local`) at authoring time. The envelope schema becomes the standard wrapper.
- **Box Ledger gets a §X cross-reference.** Concept lives in Box Ledger; manifest shape lives in Box Bus Ledger.
- **Definition of Done §5.7 (Box / Directory Work) gains a manifest-shape compliance check** that is **soft today** (no runtime to enforce against) and **becomes hard at Phase C** when runtime lands. Until then, manifest stubs are best-effort.
- **No runtime work permitted in Phase A.** Router, propagation ledger, interpreters, validation enforcement, cycle enforcement — all deferred to Phase C. `DEC-2026-04-29-008`'s "Do Not Undo Casually" line still binds.
- **Phase B steward agents (when they graduate from `/Subagent Boxes/`) author manifests for their target ledgers/systems** as part of graduation. This is how the manifest population begins without a runtime.
- **Phase C+1 backfill** authors manifests for the 28 Client Boxes, 10 Staff Boxes, orchestrator, inbox-skill, ledger directory, and app-ui root. The 28 Client Boxes are the largest manifest-authoring task in the project.
- **Open Problems Ledger** absorbs any pre-Phase-C architectural risks that surface (e.g., a manifest field that turns out to be insufficient).
- **The `analytics-snapshot` Box kind** introduced today (worked example B) reserves the pattern for Phase C+1, when each analytics script becomes a Box.

##### Do Not Undo Casually

Do not ship runtime (router, propagation ledger, interpreters, validation enforcement) during Phase A. The schema-only seam is the entire point of this Decision. If runtime feels tempting, route the urge into Open Problems Ledger or Communications Ledger — not into code. `DEC-2026-04-29-008`'s "Do Not Undo Casually" still binds against runtime work; this Decision does not soften it.

Do not change the manifest schema, envelope schema, tier model, or cycle policy without an explicit Decisions Ledger update. The schema is what makes Phase C land cleanly; drift now is migration cost later.

##### Review Trigger

- **Phase A completes** (all planned ledgers active, stewards landed for the load-bearing ones). Then this Decision and `DEC-2026-04-29-008` together unblock Phase B + Phase C runtime work.
- **A foreseen-but-unspecified field is needed** in `box.json` or the envelope. Schema additions are normal; review whether the addition needs a new Decision or a `BOX_BUS_LEDGER.md` update is enough.
- **A new tier is proposed** beyond Global / Domain / Local. That's a Decision-level change.
- **A new interpreter tier is proposed** beyond T1 / T2 / T3. That's a Decision-level change.
- **The cycle policy is challenged** (e.g., a real use case for declared cycles emerges). Currently hard-refusal; would be a Decision-level change.

##### History

- 2026-04-29 — created. Phase 0 schema shipped same day at [`BOX_BUS_LEDGER.md`](BOX_BUS_LEDGER.md) + [`BOX_BUS_LEDGER.json`](BOX_BUS_LEDGER.json) + three Mermaid visuals. Box Ledger and Definition of Done updated to point at it. Companion Communications Ledger entry: `COMM-2026-04-29-007`.

---

## 6. Deprecated / Reversed Decisions

No formal deprecated decisions yet.

Candidates to record later if the relevant rules are explicitly stated and reversed:

- Any earlier assumption that seven-day plans could be directly executable without a guardrail compiler — partially captured by DEC-2026-04-28-004 but never formally a Decision.
- Any earlier assumption that generic Close drip style was acceptable for high-value Client Boxes — informally rejected by NS-04 and the Wholesome Enrichment principle, but never a formal Decision.
- The plumbing-first build order — recorded as `COMM-2026-04-28-008` (abandoned attempt), not as a deprecated Decision because it was never formally a Decision in the first place.

When promoting a workflow / architectural reversal here:

1. Mark the old decision `superseded` and link to the new one.
2. Create the new decision and link `Supersedes: <old ID>`.
3. Append history line on both.
4. Update §4 Current Active Decisions (move old out of active table).
5. Update affected ledgers.

---

## 7. Decision Dependencies

Decisions form a graph. The visual lives at `LEDGERS/VISUALS/decision_dependency_map.mmd`. Text version:

- **DEC-001** (GitHub source of truth) is the foundation. It supports DEC-002, DEC-008, and every ledger decision.
- **DEC-002** (FileTree over RAG) depends on DEC-001 and is presupposed by every Box / Ledger decision.
- **DEC-2026-04-29-001** (Triad Spine) depends on DEC-002 and shapes everything stateful in the project.
- **DEC-003** (Client Boxes canonical) depends on DEC-002 and is reinforced by DEC-2026-04-29-001 (Client Boxes are the most concrete instance of the triad's Box leg).
- **DEC-004** (plans are drafts) depends on DEC-003 and on guardrail policy.
- **DEC-005** (risky moves require isolated approval) depends on DEC-004 and gates the inbox automation.
- **DEC-006** (Boxes page is display) depends on DEC-003.
- **DEC-007** (sitemap Done Gate) supports DEC-006 and supports any future page-shaped decision.
- **DEC-008** (one ledger at a time) depends on DEC-001 and shapes Phase A of DEC-2026-04-29-002.
- **DEC-2026-04-29-002** (three-phase build) depends on DEC-2026-04-29-001 and contains DEC-008 as its Phase A workflow.
- **DEC-2026-04-29-003** (TCL/GL update discipline) depends on DEC-001 and is enforced by every other decision.
- **DEC-2026-04-29-004** (Audit removed from build queue) depends on DEC-008 (one ledger at a time gives space to make the call) and on the existence of Open Problems + Decisions + Communications + per-Box.

---

## 8. Decisions Needing Review

This is **not** a list of open problems. It is a list of *known unsettled questions where a working assumption is in use* — questions that should become real decisions soon.

### REVIEW-approval-ui-risk-card-standard

Status: needs future decision
Related to: DEC-2026-04-28-005

**Question.** What exact UI / process should isolate approval for risky moves?

**Current working assumption.** Risky moves become explicit approval cards requiring specific confirmation. Format and storage are not yet specified.

**Needs decision on:**

- wording (what the card says about the risk)
- approval logging (where the approval is recorded)
- where approval lives (in the Client Box? in `_ledger/`? in a dedicated approvals table?)
- whether approval expires (and how)
- how approval attaches to future sends (signed token? reference ID? audit field on the send?)

**Suggested timeline.** When the approval surface gets concrete UI work, this becomes a real Decision.

---

If a question is fully unresolved (not "we have a working assumption" but "we don't know"), it belongs in `OPEN_PROBLEMS_LEDGER.md`, not here.

---

## 9. Common Decision Mistakes

Guardrail for future agents authoring or auditing this ledger:

- Treating a one-time workaround as a global decision.
- Making a decision in chat but not recording it.
- Recording what was chosen but not why.
- Failing to mark experimental decisions as `experimental` (everything is `active` and the meaning of `active` deflates).
- Forgetting to mark old decisions `superseded` when they're replaced.
- Reopening settled architecture without reading the Decisions Ledger first.
- Applying a local client rule globally (one Client Box's edge case becoming a project-wide constraint).
- Letting a tool's convenience override source-of-truth decisions.
- Recording an unresolved question in §5 as if it were settled — put it in §8 or in Open Problems.
- Inventing decisions to pad the ledger. If everything is a decision, nothing is a decision.

---

## 10. Visualization Index

Mermaid `.mmd` files under `LEDGERS/VISUALS/`:

| Visual | Path | Purpose |
|---|---|---|
| Decision dependency map | [`VISUALS/decision_dependency_map.mmd`](VISUALS/decision_dependency_map.mmd) | Graph of how decisions depend on each other. |
| Decision timeline | [`VISUALS/decision_timeline.mmd`](VISUALS/decision_timeline.mmd) | Chronological view of all active decisions. |

---

## 11. Update Rules

### Update this ledger when

- a major architectural choice is made
- an operational rule is settled
- a safety / guardrail rule is settled
- a source-of-truth rule is settled
- a project philosophy choice is made
- a previous decision is reversed (mark old as `superseded`, link new)
- an experimental decision graduates to `active`
- a `provisional` decision is confirmed or rejected

### Do **not** update this ledger when

- the choice is a one-time implementation detail (belongs in `git log` or `_ledger/activity.jsonl`)
- the choice is a working preference rather than a settled rule (belongs in Communications)
- the question is unresolved (belongs in Open Problems or §8 above)
- the rule is local to one Box (belongs in that Box's `BOX.md`)
- the change is a cosmetic edit to an existing decision (just add a History line)

### Decision Change Done Gate

A major decision is done when:

- [ ] decision is recorded
- [ ] context is recorded
- [ ] rationale is recorded
- [ ] affected systems are listed
- [ ] alternatives are noted if useful
- [ ] consequences are clear
- [ ] status is set
- [ ] confidence and scope are set
- [ ] review trigger is defined if needed
- [ ] related ledgers / docs are linked
- [ ] §4 Current Active Decisions index is updated
- [ ] Communications Ledger entry is marked `promoted` if the decision came from one
- [ ] activity.jsonl appended

If a decision reverses another:

- [ ] old decision is marked `superseded` / `deprecated`
- [ ] new decision links `Supersedes: <old ID>`
- [ ] old decision links `Superseded by: <new ID>`
- [ ] §4 index is updated (old removed from active table)
- [ ] §6 Deprecated / Reversed gets a row
- [ ] affected local rules are updated

---

## 12. Relationships To Other Ledgers

### North Star

Each major decision should list which North Star goals it supports. This creates alignment and prevents drift away from project intent.

If a decision does not support a North Star, it may still be necessary, but the reason should be recorded.

The 12 active decisions cover NS-01 through NS-10 collectively.

### Open Problems

Open Problems and Decisions are paired:

| Open Problem | Decision |
|---|---|
| "How do we classify allowed-to-know facts?" (PROB-001) | (future) "Allowed-to-know facts live in each Client Box as `allowed_to_use.md/.json` with categories X/Y/Z." |
| "Approval flow doesn't isolate risky moves." (PROB-003) | DEC-2026-04-28-005 (settled the principle; UI specifics still in §8 above). |
| "Bedrock was bootstrapped on the fly." (PROB-016) | (future, post-Phase-B) "Reconciled bedrock layout follows triad: <pattern>." |

When an open problem becomes settled, **promote it to Decisions**. Do not leave a decision implicit in the close of an Open Problem.

### Communications

Communications and Decisions are paired:

| Communication | Decision |
|---|---|
| "Be careful with risky moves in batch approval." (`COMM-2026-04-28-003`) | DEC-2026-04-28-005 |
| "Build ledgers one at a time." (`COMM-2026-04-28-001`) | DEC-2026-04-28-008 |
| "Triad spine is Box + Ledger + Sub-agent." (`COMM-2026-04-29-001`) | DEC-2026-04-29-001 |
| "Phase A → B → C build discipline." (`COMM-2026-04-29-003`) | DEC-2026-04-29-002 |
| "TCL/GL drift is the failure mode." (`COMM-2026-04-29-005`) | DEC-2026-04-29-003 |

When a Communication graduates into a settled rule, **promote it to Decisions**. The Communication entry stays in place (marked `Status: promoted`) for one full session cycle, then archives.

### Per-Box Ledgers

Some decisions are global (most of the 12 above). Some decisions are local to a specific Box (none currently). Local decisions belong in that Box's `BOX.md`, not here.

### Reconstruction Ledger (planned)

Build recipes should cite the decisions that shaped them. When a recipe rebuilds Client Box cleanup, it should cite DEC-003, DEC-004, DEC-005. When it rebuilds the ledger system, it should cite DEC-008 + DEC-2026-04-29-002.

### Definition of Done Ledger (planned)

The Done Gate in §11 above will eventually be referenced by the Definition of Done Ledger. DEC-2026-04-29-003 (TCL/GL update discipline) is the meta-completion rule that the DoD Ledger will codify in detail per surface.

---

## 13. Final Operating Rule

> A decision not recorded is a decision waiting to be forgotten.
>
> Write down the choice.
> Write down the why.
> Write down what future agents should not undo by accident.

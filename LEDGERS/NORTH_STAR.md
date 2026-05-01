# North Star Ledger

Last updated: 2026-05-01 (BACKFILL per `ATOM-2026-04-30-0111` — no NS goals modified; the 10 NS goals authored 2026-04-28 remain canonical. The 2026-05-01 Box Network Architecture lock (`DEC-2026-04-30-005`) **operationalizes** existing NS goals rather than adding new ones: NS-01 legibility-above-all (the fused primitive makes the triad LEGIBLE in one folder); NS-02 file-tree-first (every Box is a directory with mature shape); NS-03 single-source-of-truth (per-Box `box.json` + authority tier registry collapses competing organizational models); NS-09 audit-trail-discipline (per-flow receipts make every cross-Box change auditable). Stewards/interpreters serving NS goals tracked in `BOX_BUS_LEDGER.md` §14 + `SOURCE_OF_TRUTH.md` §11. North Star is the WHY; Box Network is the HOW.)
Maintainer: Jake / Comeketo Agent project agents
Status: **active**
Read when: planning major work, auditing changes, resolving tradeoffs, evaluating feature value, deciding whether to continue or kill a workstream
Primary project thesis: Build a GitHub-backed, file-tree-orchestrated AI operations system that remembers itself, treats clients more personally, and lets agents safely continue work across time.

> Progress should be judged against purpose, not just activity.
>
> Read this when you need to decide whether work is worth doing — not when you need to know what to do next. The Global Ledger says what the project is. The Temporal Continuity Ledger says what is true right now. This ledger says what the work is trying to serve.

---

## 1. Project Thesis

This project is building a durable AI operations environment where the repo is not just code — it is the memory of the build.

The system should help humans and agents work through complex client, automation, UI, and operational contexts without relying on fragile chat history, scattered local notes, or repeated rediscovery.

The project should make automation **more personal, not more robotic**.

It should preserve context, expose truth, respect guardrails, and let future agents continue safely from the file tree.

> This is not RAG as memory. This is **FileTree orchestration**: living directories, local ledgers, source-of-truth files, audit trails, visual maps, and GitHub-backed continuity.

The project's architecture flows from that distinction. Every system below — the bedrock at `CCAgentindex/`, the Boxes under `Auto/`, the LEDGERS spine, the page-asset sitemap, the Pieces memory backend — exists to make the file tree itself the operational memory.

---

## 2. North Star Goals

Each goal carries a fixed ID. References elsewhere (audits, decisions, commits) should cite the ID so alignment is traceable.

### NS-01 — Durable Project Memory

**Statement:** The project should remember itself through GitHub-backed files, ledgers, maps, and local directory context.

**Why it matters:** Agents should not restart from zero. Humans should not have to repeatedly explain architecture, decisions, preferences, risks, and current state.

**Supports:**
- `LEDGERS/` (Global, Temporal Continuity, North Star, planned roster)
- Local Box ledgers (`Auto/Client Boxes/<Name>/client_ledger.md`, audit markers)
- Source-of-truth files (`page_asset_sitemap.md`, `01_comms.md`, `01b_comms_verbatim.md`)
- Reconstruction records (`outputs/pull_full_comms.py`, build scripts under `Auto/Onboard Scripts/`)
- Pushed GitHub commits with meaningful messages
- `CCAgentindex/_ledger/activity.jsonl` audit trail

**Violates:**
- Relying on chat history as primary memory
- Leaving major decisions undocumented
- Making important local-only changes without pushing
- Changing systems without updating continuity files
- Letting generated output become confused with truth

**Progress signals:**
- Future agents can orient quickly (read Global → Temporal → relevant Box and be useful)
- Project state survives across sessions
- Fewer repeated explanations from Jake
- Fewer rediscovered problems
- Ledgers stay current without becoming noise

---

### NS-02 — FileTree Orchestration Over RAG Memory

**Statement:** The project should use the versioned file tree as the primary memory and orchestration layer.

**Why it matters:** Jake wants durable, inspectable, localizable, GitHub-backed continuity — not vague retrieval over scattered memory.

**Supports:**
- Directory-specific Boxes (`Auto/Client Boxes/`, `Auto/Staff Boxes/`, `Auto/orchestrator/`, `Auto/comeketo-inbox/`)
- Local orientation files (`LEDGERS/LOCAL_TEMPLATE/DIRECTORY_ORIENTATION_TEMPLATE.md`)
- Source-of-truth ledgers
- Scripts that read explicit files (`render_lead.py`, `comms_state_sweep.py`, `pull_full_comms.py`)
- Visual maps generated from repo truth
- Directory-level agent instructions (`CLAUDE.md`, `AGENT.md`)

**Violates:**
- Hidden memory that cannot be audited
- Agents guessing from vague context
- Unstructured notes disconnected from the repo
- Global memory replacing local directory truth

**Progress signals:**
- Important directories introduce themselves
- Agents can identify what area they are in
- Source-of-truth paths are clear
- Local rules travel with the folder

---

### NS-03 — Box-Based Local Intelligence

**Statement:** Every important project area should become a Box: a living directory with memory, rules, source-of-truth notes, local ledgers, and handoff context.

**Why it matters:** Complexity should stay local when local. One client's constraints should not force a rewrite of the whole automation system.

**Supports:**
- Client Boxes (28 active under `Auto/Client Boxes/`)
- Staff Boxes (10 voice profiles under `Auto/Staff Boxes/`)
- Orchestrator Box (`Auto/orchestrator/`)
- App/UI Box (planned formal scaffolding)
- Inbox Skill Box (`Auto/comeketo-inbox/`)
- Ledger Box (`LEDGERS/`)
- Local audit markers (`2026-04-28_audit_marker.md` pattern from Brenda)
- Local allowed-to-know constraints (planned)
- Local open problems (planned)

**Violates:**
- Solving every local issue globally
- Creating one giant automation brain
- Spreading one client's risk across every client
- Making agents infer directory rules from filenames alone

**Progress signals:**
- Agents can enter a directory and know how to behave
- Local changes update local memory
- Per-client plans can change independently
- Folder-specific risks are visible in place

---

### NS-04 — Automation That Feels More Human, Not Less

**Statement:** Automation should help Comeketo treat people with more memory, care, specificity, and respect — not blast generic manipulative drips.

**Why it matters:** The goal is meaningful client handling, not robotic follow-up. Good automation remembers what people said, avoids generic nonsense, respects timing, and helps André show up prepared.

**Supports:**
- Full comms and transcripts (`01b_comms_verbatim.md` + `comms/*.json` — 582 raw payloads across all 28 boxes as of 2026-04-28)
- Allowed-to-use fact layers (planned — see Wholesome Enrichment principle below)
- Thread-aware plans
- State-based pauses
- Reply-aware rewrites
- Wholesome enrichment (`04_profile.md` and `*_enrichment.md` used internally only)
- Explicit guardrails (`Auto/comeketo-inbox/`, `Guardrails.html`, `comeketo-guardrails-agent.md`)
- Human approval for risky moves

**Violates:**
- Creepy personalization
- Surfacing enrichment-only facts to clients
- Generic NEPQ trickery
- Sending stale messages after replies
- Forcing the same plan across every client
- Over-contacting to show "activity"

**Progress signals:**
- Messages reflect actual comms (verbatim file is now the highest-fidelity ground)
- Clients are not surprised by creepy researched facts
- Fewer stale or contradictory sends
- Automation creates useful movement without sacrificing trust

---

### NS-05 — Safe Movement Before Aggressive Autonomy

**Statement:** Especially during early proof periods, the system should create visible movement while keeping risky autonomy constrained.

**Why it matters:** Comeketo wants to see automation working, but early trust is fragile. The system should prove reliability before making bold sales plays automatically. The Brenda & Steve fee-waiver lesson is the operative case: the move may have been strategically right, but the risk wasn't sufficiently isolated during batch approval.

**Supports:**
- Low-risk nudges
- Clear next-step asks
- **Isolated approval cards** (not batched) for fee waivers, discounts, scope promises, pricing claims
- Frequency caps
- Reply gates
- Commitment gates
- Audit markers
- Plan cleanup before sends (Brenda's `Audit-cleaned: 2026-04-28 01:40 AM ET` pattern)

**Violates:**
- Silent fee waivers
- Hidden discounts in batch approval
- Unapproved pricing claims
- Enrichment-based customer-facing claims
- Over-messaging to look busy
- Auto-sending big rescue plays without isolated approval

**Progress signals:**
- Automation moves leads without creating panic
- Risky moves are surfaced clearly
- Approvals are explicit where needed
- Early clients get safer, cleaner follow-up

---

### NS-06 — Source-of-Truth Discipline

**Statement:** Before changing information, agents should know where the truth lives.

**Why it matters:** The project has generated views, UI pages, local files, GitHub state, Close data, comms logs, transcripts, profiles, plans, and ledgers. Confusing a view for truth creates dangerous edits.

**Supports:**
- Source-of-Truth Ledger (planned — rules currently summarized in `GLOBAL_LEDGER.md` §4)
- `page_asset_sitemap.md` (UI Done Gate)
- Client Boxes as canonical lead substrate
- Generated-output labels
- Clear "do not edit" notes
- Local Box rules
- Per-box source-of-truth priority order: `01b_comms_verbatim.md` → `01_comms.md` → `00_meta.json` → `client_ledger.md` → operator notes → profile/enrichment (internal only)

**Violates:**
- Editing generated output instead of source files
- Trusting UI display over canonical box data
- Treating profiles as customer-facing truth
- Using stale plan text over current comms/state
- Ignoring Done Gate updates

**Progress signals:**
- Agents know which file to edit
- Generated state is not hand-edited accidentally
- Page changes update ownership maps
- Client plans defer to comms and guardrails

---

### NS-07 — Rebuildability and Reconstruction

**Statement:** Important systems should be rebuildable from prompts, recipes, ledgers, source files, and documented intent.

**Why it matters:** The project should survive model changes, refactors, agent handoffs, local machine issues, and future upgrades.

**Supports:**
- Prompt / Reconstruction Ledger (planned)
- Implementation notes
- Build recipes (`Auto/Onboard Scripts/` and the 2026-04-28 `pull_full_comms.py`)
- Generated artifact notes
- Decisions Ledger (planned)
- Source-of-truth paths
- Scripts and templates (`LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md`, `DIRECTORY_ORIENTATION_TEMPLATE.md`)

**Violates:**
- One-off magic
- Undocumented generation
- Unclear why a file exists
- Inability to recreate a page, box, widget, or workflow
- Hiding important context only in chat

**Progress signals:**
- Future agents can rebuild major pieces
- Generated files have recipes
- Prompts and constraints are preserved
- Refactors are safer

---

### NS-08 — Visual Comprehension Beside Text Memory

**Statement:** The project should pair durable markdown/JSON memory with visual maps where shape matters.

**Why it matters:** Agents need structure. Humans need shape. Complex systems become easier to operate when file trees, dependency graphs, page maps, state flows, and timelines are visible.

**Supports:**
- Mermaid maps (`LEDGERS/VISUALS/*.mmd`)
- Page/asset graphs
- Directory maps
- Client lifecycle diagrams (`client_box_lifecycle.mmd`, `client_state_temporal.mmd`)
- Source-of-truth flows (planned)
- Side-by-side ledger views
- Dashboard views generated from ledger files

**Violates:**
- Walls of text for inherently visual relationships
- Disconnected diagrams that do not map to repo truth
- Pretty visuals with no operational use
- Visualizations that become stale and unlinked

**Progress signals:**
- Humans can understand the project faster
- Agents can identify dependencies
- UI/data flows are easier to audit
- Maps are generated or updated with ledger changes

---

### NS-09 — Agent Handoff Continuity

**Statement:** Any capable agent should be able to enter the repo, read the right files, and continue the work safely.

**Why it matters:** The project should not depend on one chat thread, one model, or one human's memory.

**Supports:**
- Global Ledger
- Temporal Continuity Ledger
- [`Communications Ledger`](COMMUNICATIONS_LEDGER.md) (active 2026-04-29)
- Local Boxes
- `AGENT.md`, `CLAUDE.md`, `README.md` read-first wiring
- Audit markers
- Clear read-first order: Global → Temporal → relevant Box → work
- Commit messages with meaning

**Violates:**
- Ambiguous handoffs
- Undocumented partial work
- Unclear next steps
- No record of what was attempted
- Future agents needing to rediscover context

**Progress signals:**
- Agents need fewer clarifying questions
- Handoffs preserve warnings
- Stale work is easier to identify
- Local context is discoverable

---

### NS-10 — Defense as a First-Class Build Activity

**Statement:** The project should treat cleanup, ledgers, maps, audits, source-of-truth updates, and definitions of done as core build work.

**Why it matters:** A build that remembers itself compounds. A build that does not remember itself rots.

**Supports:**
- 55 / 45 build rhythm (build new + maintain memory)
- Done Gate
- Audit Ledger (planned)
- Open Problems Ledger (planned)
- Source-of-truth updates
- Visual maps
- Cleanup passes (Brenda audit pattern)
- Ledgers updated with meaningful work
- This entire `LEDGERS/` directory

**Violates:**
- Shipping code with no continuity updates
- Ignoring maps and ledgers
- Treating documentation as optional decoration
- Building features faster than the system can remember them

**Progress signals:**
- Fewer fragile areas
- Clearer ownership
- Easier refactors
- More durable momentum

---

## 3. Guiding Principles

Shorter principles agents apply during work. Each one is a North Star statement compressed into action.

### Principle 1 — The repo is memory

The repo is not just code. It is the memory of the build.

### Principle 2 — The box is truth

For local systems, trust the Box before global assumptions.

### Principle 3 — Plans are hypotheses

Plans guide action but do not override comms, state, guardrails, or approvals.

### Principle 4 — Movement should earn trust

Automation should create progress without making unsafe assumptions.

### Principle 5 — Wholesome enrichment

Use context to be more respectful and relevant, not to perform creepy intimacy. (See §6 for the full Wholesome Enrichment principle.)

### Principle 6 — Source before surface

Before changing visible behavior, identify the source of truth behind the surface.

### Principle 7 — If it changed, memory should change

Meaningful work should update the relevant continuity layer.

### Principle 8 — Local complexity stays local

Do not rewrite the whole machine for one client's edge case if a Box-level rule solves it.

### Principle 9 — Visuals are comprehension tools

Use visual maps where relationships matter.

### Principle 10 — Agents need runway

Leave enough context for the next agent to continue safely.

---

## 4. Anti-Goals

What the project should **not** become. Equally important as goals — anti-goals are powerful during audits.

The project should not become:

- A generic CRM drip machine
- A manipulative sales automation engine
- A pile of disconnected local files
- A RAG-only memory experiment
- A UI that hides where truth lives
- An automation system that makes financial commitments silently
- A system that uses enrichment creepily
- A codebase where only the original builder understands the structure
- A dashboard that looks useful but cannot be trusted
- A project that moves fast by deleting its own memory

If a change moves toward an anti-goal, it should be flagged.

---

## 5. Goal-to-System Map

Connects goals to actual project systems so audits can trace alignment.

| Goal | Primary systems | Supporting ledgers |
|---|---|---|
| **NS-01** Durable Project Memory | GitHub (`RodbotCC/CCAgent`), `LEDGERS/`, `AGENT.md`/`CLAUDE.md`/`README.md` | Global, Temporal Continuity, Communications |
| **NS-02** FileTree Orchestration | Directory Boxes, source files, bedrock (`CCAgentindex/`) | Directory, Source-of-Truth |
| **NS-03** Box-Based Local Intelligence | Client Boxes, Staff Boxes, Orchestrator Box, comeketo-inbox skill | Directory Configuration, Box ledgers |
| **NS-04** Human Automation | Client Boxes, Inbox Guardrails, Close comms (`01b_comms_verbatim.md`) | Source-of-Truth, Audit |
| **NS-05** Safe Movement | Guardrails, approval surfaces, scheduled fires, automation page | Decisions, Audit, Open Problems |
| **NS-06** Source-of-Truth Discipline | `page_asset_sitemap.md`, generated-state labels, Client Boxes | Source-of-Truth, Page/Widget |
| **NS-07** Rebuildability | scripts (`Auto/Onboard Scripts/`, `outputs/pull_full_comms.py`), prompts, ledgers, Box templates | Reconstruction, Decisions |
| **NS-08** Visual Comprehension | Mermaid (`LEDGERS/VISUALS/`), dashboards, maps | Asset Map, Directory Ledger |
| **NS-09** Agent Handoff | Temporal Continuity, Communications, audit markers, read-first wiring | Communications, Audit |
| **NS-10** Defense | Done Gate, ledgers, audits, sitemap | Definition of Done, Open Problems |

This table makes alignment legible. Audit entries should reference the goal IDs.

---

## 6. Wholesome Enrichment

This is a project-defining principle. It deserves its own section.

> Enrichment is used to **understand context**, not to **perform surveillance**.

**Allowed (internal use):**
- Adjust tone for the audience
- Avoid generic messaging
- Prepare André for a better conversation
- Notice likely decision dynamics
- Respect client context

**Not allowed without explicit operator approval:**
- Customer-facing references to researched facts
- Claims that imply hidden knowledge
- Invasive personalization
- Assumptions about identity, family, wealth, religion, politics, health, or personal life
- Manipulative pressure based on inferred vulnerability

The four-bucket allowed-to-know layer (planned in `TEMPORAL_CONTINUITY.md` §2.4) implements this principle:

1. **Comms-confirmed facts** → safe for customer copy
2. **Enrichment-only strategy** → internal-only
3. **Protected/off-limits facts** → never use
4. **Approval-required facts/actions** → operator gate

Until that layer exists, this is manual discipline. The principle is the same either way: enrichment fuels strategy; comms fuels copy.

---

## 7. Client Automation North Star

Comeketo automation should make client handling more **remembered**, more **prepared**, and more **respectful**.

The system should not merely increase touch count.

A good automated move should:

- Reflect what the client actually said
- Respect silence and timing
- Avoid stale claims
- Avoid creepy personalization
- Ask for a real next step
- Pause when the state changes
- Surface risky moves to humans
- Preserve context for the next interaction

This is the quality standard for every seven-day plan and every send the system produces. It maps directly to NS-04 (Human Automation), NS-05 (Safe Movement), and NS-06 (Source-of-Truth Discipline).

---

## 8. Progress Signals

What "getting closer" looks like.

The project is moving toward the North Star when:

- Future agents need less re-orientation
- Important directories have local memory
- Source-of-truth confusion decreases
- Client plans become safer after state changes
- Risky moves are surfaced instead of silently executed
- UI pages can be traced to their data sources
- GitHub contains the important memory, not just local machines
- Audits leave durable findings
- Visual maps clarify real dependencies
- Users can resume work by reading files, not replaying chat

The project is **drifting away** when:

- Plans become executable without guardrails
- Enrichment leaks into customer-facing copy
- Agents edit generated files as if they are sources
- Local-only work becomes essential
- Ledgers go stale
- Agents need repeated human re-explanation
- Dashboards look right but point to unclear truth

---

## 9. Tradeoff Rules

Help agents make decisions when goals or constraints collide.

### Speed vs continuity

Prefer slightly slower work that preserves memory over fast work that future agents cannot continue.

### Global fix vs local Box fix

Prefer local Box fixes when the problem is local. Use global rules only when the pattern repeats or creates systemic risk.

### Automation movement vs safety

Prefer safe movement over aggressive autonomy during early proof. Escalate risky moves to approval.

### Enrichment vs trust

Use enrichment to improve internal understanding. Do not surface it unless grounded in comms or approved.

### UI polish vs truth clarity

A beautiful UI that obscures truth is worse than a plain UI that clearly reflects source state.

### Code change vs source-of-truth update

If changing behavior changes ownership, data binding, or expectations, update the relevant ledger or sitemap.

### New build vs cleanup pass

Treat cleanup, ledger updates, audit markers, and source-of-truth updates as build work, not chores. NS-10 makes this a first-class activity.

---

## 10. Audit Questions

Before approving meaningful work, ask:

1. Which North Star goal does this support?
2. Does this change preserve or damage continuity?
3. Does it make truth easier or harder to locate?
4. Does it create local memory where local memory is needed?
5. Does it make automation more human or more robotic?
6. Does it introduce risky autonomy?
7. Does it require an approval gate?
8. Does it update the right ledgers?
9. Would a future agent understand why this exists?
10. Can this be rebuilt or audited later?

For Client Box work specifically:

- Does the plan reflect current comms and state?
- Are customer-facing facts allowed-to-use (comms-grounded)?
- Are enrichment-only facts kept internal?
- Are risky moves explicitly approved (isolated, not batched)?
- Does a reply make this plan stale?
- Is the next move safe enough to surface/send?

---

## 11. Current Alignment Notes

High-level alignment for the active phase. Not every task — just the strategic shape.

### 2026-04-28 (current ledger buildout session)

The current ledger buildout strongly supports **NS-01 Durable Project Memory**, **NS-02 FileTree Orchestration**, **NS-03 Box-Based Local Intelligence**, **NS-09 Agent Handoff Continuity**, and **NS-10 Defense as Build Work**.

The 2026-04-28 verbatim comms backfill (582 activity payloads across all 28 client boxes) supports **NS-04 Human Automation** and **NS-06 Source-of-Truth Discipline** — every customer-facing message can now ground in transcripts and full email bodies, not just curated summaries.

The Client Box audit workflow (Brenda & Steve completed; 27 boxes remaining) supports **NS-04 Human Automation**, **NS-05 Safe Movement**, and **NS-06 Source-of-Truth Discipline** by making automation more personal while constraining risky autonomy.

The Brenda & Steve case clarified a critical North Star tension:

> The system should be smart enough to suggest bold moves, but not autonomous enough to hide risky commitments inside batch approval.

That tension is the operative fault line for NS-04 vs NS-05. The resolution: bold moves are welcome in plans; **risky bold moves require isolated approval cards, not batched approval**. This is now encoded in `TEMPORAL_CONTINUITY.md` §6 Active Risks and `client_state_temporal.mmd` (the approval-card branch).

This section should be updated after meaningful audits or strategic shifts.

---

## 12. Relationship to Audits

The North Star Ledger powers audits. Every audit entry should include a North Star alignment block:

```
North Star alignment:
- Supported: NS-04 Human Automation, NS-05 Safe Movement, NS-06 Source-of-Truth
- Threatened: <e.g., fee-waiver autonomy risk>
- Anti-goal proximity: <e.g., none / approached generic-drip-machine>
```

Example — the Brenda & Steve audit (already executed before this session):

```
Supported:
- NS-04 Human Automation (plan now reflects current state)
- NS-05 Safe Movement (Audit-cleaned line + Safety Status block in plan)
- NS-06 Source-of-Truth Discipline (plan defers to comms + guardrails)

Threatened before cleanup:
- fee-waiver autonomy risk (resolved by isolated approval requirement)
- enrichment boundary risk (resolved by stripping enrichment-based personalization)
- stale calendar labels (resolved by audit pass)
```

This makes the North Star **operational, not ornamental**.

---

## 13. Relationship to Definition of Done

The Definition of Done Ledger (planned) should reference North Star goals.

> A meaningful task is not fully done until it has either:
> - supported a North Star goal,
> - preserved a North Star goal,
> - removed a threat to a North Star goal,
> - or explicitly recorded why it was necessary despite not mapping cleanly to one.

This prevents "busywork by default."

---

## 14. Update Rules

Update this ledger when:

- A major project goal is added, retired, or clarified
- Jake's philosophy changes
- A repeated pattern reveals a new principle
- Audits need a new alignment criterion
- A system starts drifting toward an anti-goal
- A tradeoff rule becomes important enough to preserve
- The project enters a new strategic phase

Do **not** update this ledger for ordinary implementation details:

- If a change only affects current state → update Temporal Continuity.
- If a change only affects a local area → update that Box.
- If a change records a decision → update Decisions Ledger (when it exists).
- If a change defines completion criteria → update Definition of Done Ledger (when it exists).

The North Star Ledger should be **stable but not frozen**. Read often, edit rarely, edit deliberately.

---

## Final Operating Rule

> Do not confuse movement with progress.
>
> Progress means the project became more durable, more truthful, more humane, more understandable, more rebuildable, or safer to continue.
>
> If work supports a North Star, notice it.
> If work threatens a North Star, surface it.
> If work serves no North Star, question it.

# Communications Ledger

Last updated: 2026-04-29 (Phase 9 — appended COMM-2026-04-29-006 for Definition of Done landing + Box Ledger registration fix)
Maintainer: Jake / Comeketo Agent project agents
Status: **active**
Read when: starting a session, finishing a session, planning work that affects another agent, leaving a warning, recording a preference, hitting a fragile area, or noticing a "the next agent should know this" moment.
Core rule: **If a future agent needs to hear it, leave it where they can find it.**
Steward agent: not yet authored. Phase B work — when written it lands at `/Subagent Boxes/communications_subagent_package/`.

> The Communications Ledger is how agents talk across time.
>
> Chat scroll is not enough. A warning in one session should not vanish before the next session. A human preference should not have to be re-explained every day. A half-finished attempt should not be rediscovered from scratch. A local risk should not become invisible just because no one had time to fix it.

---

## 1. Purpose

This ledger holds the kind of information that is **too important to lose but not formal enough to become a Decision, Source-of-Truth rule, or Open Problem**. It is the durable handoff channel between agents and across sessions.

It is paired with — and explicitly distinct from — the other memory-of-the-work ledgers:

| Form | Example |
|---|---|
| **Communication** | "Be careful: the user may have unpushed local work." |
| Decision | "GitHub is the source of truth." |
| Open Problem | "We need a safer branch workflow for direct GitHub writes." |
| Temporal Continuity | "Direct GitHub writes happened during Brenda & Steve cleanup." |

The same event may create entries in multiple ledgers. Each ledger stores a different layer of meaning.

### Owns

- cross-agent handoff notes
- warnings
- human preferences and working-style notes
- session-to-session messages
- "do not repeat this" lessons
- unfinished explanations
- project boundary reminders
- context notes that are not formal decisions
- notes about what was attempted
- coordination between local and global work
- "tell the next agent" messages
- operator/user tone and workflow preferences
- fragile-process warnings

### Does not own

- settled architectural decisions → Decisions Ledger (planned)
- all open bugs → Open Problems Ledger
- full audit reports → out-of-scope (Audit Ledger removed from build queue 2026-04-29; coverage absorbed by Open Problems / Decisions / Communications / per-Box ledgers)
- full changelogs → `git log` + `CCAgentindex/_ledger/activity.jsonl`
- file ownership maps → File Directory Ledger
- source-of-truth authority → Source-of-Truth Ledger (planned)
- every chat message → not durable
- every local client communication → per-Box (`Auto/Client Boxes/<Name>/`)

This ledger is **high-signal**. Not every message belongs here. Only communications with durable future value.

---

## 2. Communication Entry Format

Every entry uses a stable ID: `COMM-YYYY-MM-DD-###`.

Example: `COMM-2026-04-28-001`.

Template:

```
## COMM-YYYY-MM-DD-### — <Short Title>

Date:              YYYY-MM-DD
From:              <agent | session | name>
To:                <future agents | specific role | named agent>
Type:              <see §3>
Status:            active | resolved | archived | promoted
Priority:          high | medium | low
Affected systems:  <list>
Related ledgers:   <list>
Promote when:      <decision condition that would move this to Decisions / Open Problems / local Box, or "n/a">

### Message

The actual handoff/warning/context. Concise.

### Why It Matters

Why future agents should care.

### Suggested Action

What to do with this information.

### Expiry / Review

When this note can be archived, downgraded, or removed.
```

Keep entries concise. If a note becomes a settled rule, **promote** it to Decisions or Source-of-Truth. If it becomes an unresolved issue, **promote** it to Open Problems. If it becomes local, **move** it into the relevant Box.

---

## 3. Communication Types

Use one or more per entry. Types make the ledger searchable.

| Type | Meaning |
|---|---|
| `handoff` | Something the next agent needs to continue |
| `warning` | Something dangerous or fragile |
| `preference` | Human/operator preference |
| `lesson` | What was learned from a mistake or near-miss |
| `attempt` | What was tried and what happened |
| `boundary` | What not to do |
| `coordination` | Cross-system note |
| `review-note` | Something to revisit |
| `local-context` | Context tied to a specific directory or Box |
| `git-note` | Branch/commit/local-vs-remote warning |

---

## 4. Active Handoff Notes

Current must-hear messages for the next agent picking up work.

### COMM-2026-04-28-001 — Ledger Build Rhythm

> **Promoted to [`DEC-2026-04-28-008`](DECISIONS_LEDGER.md) on 2026-04-29** — settled rule recorded in the Decisions Ledger. Entry stays here for one session cycle per §12, then archives.

Date: 2026-04-28
From: User (Jake)
To: Future agents / Opus
Type: `handoff`, `preference`
Status: **active**
Priority: high
Affected systems: ledgers, agent workflow
Related ledgers: INDEX.md
Promote when: rhythm changes (e.g., parallelization is approved)

#### Message

Build ledger outlines and implementations **one at a time**. The user types `P` (or sends the next ledger spec as an upload) to proceed to the next ledger.

#### Why It Matters

This prevents the ledger system from becoming shallow or overwhelming. Skipping ahead or batching builds erodes legibility and quality.

#### Suggested Action

Continue ledger work in order. After Communications Ledger lands (this entry's session), proceed only when Jake signals.

#### Expiry / Review

Review after first wave of ledgers is implemented (likely Phase 8–10).

---

### COMM-2026-04-28-002 — Client Box Cleanup Rhythm

Date: 2026-04-28
From: User (Jake)
To: Future agents
Type: `handoff`, `preference`
Status: **active**
Priority: high
Affected systems: Client Boxes, inbox automation, guardrails
Related ledgers: Open Problems (PROB-002), per-Box ledgers
Promote when: client-box audit pattern formalizes (Decisions Ledger candidate)

#### Message

Client Box audits should happen one box at a time. Read the box (including the new `01b_comms_verbatim.md`), report findings, clean if approved, leave an audit marker (`YYYY-MM-DD_audit_marker.md`), then proceed to the next.

#### Why It Matters

Each client has local context. One client's risks should not cause broad global rewrites unless the pattern is truly systemic.

#### Suggested Action

For each Client Box, check comms, state, profile, seven-day plan, alerts, ledger, guardrails, calendar drift, risky commitments, enrichment boundary, and plan validity. Brenda & Steve is the template (cleaned 2026-04-28 01:40 AM ET).

#### Expiry / Review

Downgrade when all 28 active Client Boxes have been audited.

---

### COMM-2026-04-28-003 — Brenda & Steve Fee-Waiver Lesson

> **Promoted to [`DEC-2026-04-28-005`](DECISIONS_LEDGER.md) on 2026-04-29** — settled rule recorded in the Decisions Ledger. Entry stays here for one session cycle per §12, then archives.

Date: 2026-04-28
From: User + audit session
To: Future agents
Type: `lesson`, `warning`
Status: **active**
Priority: high
Affected systems: Client Boxes, approval flow, inbox automation
Related ledgers: Open Problems (PROB-003), [`Decisions`](DECISIONS_LEDGER.md) (DEC-2026-04-28-005)
Promote when: approval-card workflow exists → promoted to Decisions 2026-04-29 (DEC-005); approval UI specifics still in Decisions §8 needs-review

#### Message

The Brenda & Steve fee-waiver move may have been strategically correct, but it was too risky to be hidden inside a rushed batch approval flow. **Future risky moves should be isolated and explicitly approved** — not blended into routine sends.

#### Why It Matters

Good sales judgment and safe automation are different things. A move can be smart but still require explicit human ownership. Batching risky moves with safe ones is the failure mode that triggered this lesson.

#### Suggested Action

When a plan contains fee waivers, no-charge language, discounts, guest-count promises, pricing commitments, or enrichment-based personalization, convert it into an approval-required card or flatten the copy. Don't let the risk hide in a routine batch.

#### Expiry / Review

Review after approval-card workflow exists in the automation page.

---

### COMM-2026-04-29-002 — Cleanup Phase, Not Greenfield (Build Arc Context)

Date: 2026-04-29
From: User (Jake) via Claude Code catch-up session
To: Future agents (especially cold-starting Cowork sessions)
Type: `handoff`, `boundary`
Status: **active**
Priority: high
Affected systems: entire project — orientation
Related ledgers: Temporal Continuity §1, Global Ledger §2
Promote when: cleanup phase ends → Decisions Ledger entry naming the next phase

#### Message

The project is **3 days in, in cleanup phase, not greenfield**. The build arc:

1. Plumbing-first attempt (ledgers + sub-agent scaffolding) was **scrapped mid-stream under pressure from Rodrigo (Comeketo owner)** who needed something usable/demoable.
2. Jake **rebuilt the UI** and patched together what worked from the prior attempt.
3. On a separate "heroic day" via Claude Co-Work, Jake authored almost all of the **automations, Boxes, and Onboard Scripts** in a separate folder — now symlinked into bedrock at `Auto/` (which itself symlinks to `~/Desktop/Auto/`).
4. Ledger system Phases 1–6 landed (Global, Temporal Continuity, North Star, File Directory, Open Problems, Communications) plus first runnable steward (`global_ledger_steward`).
5. **Now:** cleanup. The bedrock itself (`CCAgentindex/`) needs triad reconciliation (PROB-016, deferred).

#### Why It Matters

Without this context, a cold-starting agent will propose architectural overhauls that don't fit the moment. The constraint is *don't break what works while filling the lopsided triad.*

#### Suggested Action

Read this before suggesting structural changes. Defer to PROB-016 for bedrock work. Preserve `Auto/` as read-mostly. Don't force greenfield patterns onto a cleanup project.

#### Expiry / Review

Review when Phase B (sub-agents) and Phase C (Subagent Boxes) complete and the bedrock reconciliation can run safely.

---

### COMM-2026-04-29-003 — Three-Phase Build Discipline (A → B → C)

> **Promoted to [`DEC-2026-04-29-002`](DECISIONS_LEDGER.md) on 2026-04-29** — settled rule recorded in the Decisions Ledger. Entry stays here for one session cycle per §12, then archives.

Date: 2026-04-29
From: User (Jake)
To: Future agents
Type: `handoff`, `preference`
Status: **active**
Priority: high
Affected systems: ledgers, sub-agents, bedrock
Related ledgers: INDEX.md, Temporal Continuity §1
Promote when: phase order is settled in Decisions Ledger

#### Message

Build order, in this exact sequence:

- **Phase A — finish all Ledgers.** Currently here. Ingest outline drafts from `/Ledger Drafts/` one at a time, in user-confirmed order.
- **Phase B — finish all Sub-agents.** Graduate the 5 draft packages at `/Subagent Boxes/` into runnable app agents under `CCAgentindex/agents/<name>/`.
- **Phase C — build Subagent Boxes.** Boxes of ledgers controlled by sub-agent configurations. The triad becomes operational.

Do not skip ahead. Do not parallelize without explicit approval.

#### Why It Matters

The triad (Box + Ledger + Sub-agent) is the architectural spine. Filling it in the wrong order produces partial systems that confuse future agents. Ledgers without sub-agents are static memory. Sub-agents without ledgers have nowhere to write. The ordering protects the spine.

#### Suggested Action

When asked to build something with state, confirm which phase the project is in before proposing structure. If Phase A: build the ledger only, note the eventual sub-agent home as a placeholder. If Phase B: graduate the existing draft package. If Phase C: stamp the box.

#### Expiry / Review

Review on Phase A completion. The order may stay or evolve based on what's painful when Phase B starts.

---

### COMM-2026-04-29-006 — Definition of Done Is Now The Closing Authority

Date: 2026-04-29
From: Cowork session (Phase 9 ledger build, autonomous next-pick under Jake's "you make the call" delegation)
To: Future agents — every Phase A ledger build, every Phase B sub-agent graduation, every Page Ledger pass.
Type: `handoff`, `preference`, `coordination`
Status: **active**
Priority: high
Affected systems: ledger system, page work, automation, Client Boxes, every meaningful task
Related ledgers: [`DEFINITION_OF_DONE.md`](DEFINITION_OF_DONE.md), [`DECISIONS_LEDGER.md`](DECISIONS_LEDGER.md) (DEC-2026-04-29-007 sitemap-Done-Gate), [`page_asset_sitemap.md`](../page_asset_sitemap.md), [`BOX_LEDGER.md`](BOX_LEDGER.md)
Promote when: a steward agent for DoD is built (Phase B), at which point this entry archives — the steward enforces the gate automatically.

#### Message

The **Definition of Done Ledger** is now live (`LEDGERS/DEFINITION_OF_DONE.md`). It encodes the project's eight-question Universal Done Gate, eleven work-type sub-gates, and the "if X changed, update Y" Ledger Update Matrix. **The page-asset sitemap remains the canonical UI Done Gate** — DoD §5.3 explicitly elevates and points at it; it is not replaced.

Two cross-references future agents must internalize:

- **Every new ledger** must satisfy DoD §5.6 (Ledger Creation Done Gate). That means: md + json sibling + Mermaid visual if relationships are complex + INDEX flip + Global §8 + §14 link list + TCL phase bump. Do not call a ledger done if any of those are missing.
- **Every page/route/data-binding change** must satisfy DoD §5.3, which restates the existing sitemap rule. Do not call a UI change done if `page_asset_sitemap.md` Asset Ownership / Change Checklist / History / Last Verified are stale.

This session also fixed a hygiene gap: the **Box Ledger** (Phase 8, landed earlier today) was already on disk but was not yet registered in `INDEX.md`, `GLOBAL_LEDGER.md §8`, or `GLOBAL_LEDGER.md §14`. All four are now consistent.

#### Why It Matters

DoD is the rule the project keeps almost-following but didn't have a single home for. Without a stable home, the rule decays — agents cite "the Done Gate" without being able to point at it, and false-finishes accumulate. This ledger lets a reviewer (human or agent) point at a numbered gate and ask, "show me." That is what makes 55/45 build rhythm checkable instead of aspirational.

#### Suggested Action

Before closing **any** meaningful task: open DoD §4 (Universal Done Gate) and the matching §5 sub-gate, and walk the checklist. If something fails, decide between (a) finishing it, (b) recording it in Open Problems with a concrete close-criterion, or (c) recording it in Communications as a deliberate carry-forward. "I'll come back to it" is not one of the three options.

When **authoring a new ledger**: read DoD §5.6 first. The Ledger Update Matrix in §6 is the fastest "what do I touch?" reference in the project.

When **building a sub-agent in Phase B** for an existing ledger: the steward's job is to enforce that ledger's Done Gate plus the cross-ledger updates DoD §6 specifies. That is what graduates a draft package to "live."

#### Expiry / Review

Archive when DoD steward is built (Phase B). Review fields if a new work-type Done Gate is needed (e.g., Subagent Box Done Gate when Phase C starts) — that's a §5 addition, not a new ledger.

---

## 5. Warnings To Future Agents

Danger board. Read before doing risky work.

### COMM-2026-04-28-004 — Watch For Local Git Drift

Date: 2026-04-28
From: User + GitHub write session
To: Future agents
Type: `warning`, `git-note`
Status: **active**
Priority: high
Affected systems: GitHub, local repo, agent writes
Related ledgers: Temporal Continuity §13 Current Git Posture
Promote when: a stable branch workflow is adopted → archive

#### Message

The user may have local unpushed work while agents are writing directly to GitHub. The working tree is currently dirty with multiple sessions' uncommitted edits.

#### Why It Matters

Direct commits to GitHub can create conflicts or require rebase/merge before the user can push local work. A force-push can erase local-only work permanently.

#### Suggested Action

Run `git status` before any direct GitHub write. Consider asking whether to continue direct-to-main, use a branch, or wait for the user to sync. **Never force-push main.** Local commits are fine if explicitly requested; pushing is Jake's call.

#### Expiry / Review

Can be archived once a stable branch workflow is adopted and `git status` is consistently clean before agent writes.

---

### COMM-2026-04-28-005 — Plans May Predate Guardrails

Date: 2026-04-28
From: Audit session (Brenda)
To: Future agents
Type: `warning`
Status: **active**
Priority: high
Affected systems: Client Boxes, seven-day plans, scheduled fires
Related ledgers: Open Problems (PROB-002), per-Box ledgers
Promote when: all 28 boxes audited → downgrade to lesson, then archive

#### Message

Some seven-day plans were written before the current inbox guardrails were fully enforced. They may contain stale dates, risky commitment language, enrichment leakage, or unsafe send assumptions.

#### Why It Matters

Trusting an unaudited plan can produce unsafe outbound copy. A plan-driven send can leak fee-waiver language, enrichment-based personalization, or stale calendar references.

#### Suggested Action

Before trusting any plan, audit it against current comms (including the 2026-04-28 verbatim backfill at `01b_comms_verbatim.md`), state, and guardrails. **Reply received → plan is stale.** Brenda's `05_seven_day_plan.md` carries the audit-cleaned template.

#### Expiry / Review

Downgrade once all 28 active Client Boxes carry an `Audit-cleaned` line and an audit marker.

---

### COMM-2026-04-29-004 — Bedrock Reconciliation Deferred (See PROB-016)

Date: 2026-04-29
From: Claude Code catch-up session
To: Future agents
Type: `warning`, `coordination`
Status: **active**
Priority: high
Affected systems: `CCAgentindex/`, bedrock structure
Related ledgers: Open Problems (PROB-2026-04-28-016)
Promote when: ledger + sub-agent buildouts complete → execute reconciliation, then archive

#### Message

`CCAgentindex/` was bootstrapped on the fly before the triad philosophy was formalized. The 32-subdir layout needs triad-based reconciliation, but **do not act on this yet**. Reconciliation is blocked on completion of Phase A (Ledgers) and Phase B (Sub-agents).

#### Why It Matters

Premature bedrock refactoring would break working pieces of the system that are currently held together by convention rather than schema. The right move is to finish the spine, then reconcile.

#### Suggested Action

If you notice bedrock-shaped issues, **add evidence to PROB-016**, not to this ledger. Communications can carry the pointer; the Open Problems Ledger owns the tracking.

#### Expiry / Review

Archive when PROB-016 closes (after the reconciliation pass executes successfully).

---

## 6. Human Preferences / Working Style Notes

Jake's durable preferences. Continuity-critical.

### COMM-2026-04-28-006 — Preferred Ledger Writing Style

Date: 2026-04-28
From: User (Jake)
To: Future agents
Type: `preference`
Status: **active**
Priority: medium
Affected systems: ledgers, Opus handoff
Related ledgers: INDEX.md, Ledger Drafts/
Promote when: style guide solidifies → Decisions Ledger entry

#### Message

User prefers ledger architecture writeups that are **broad, gorgeous, implementation-ready, and high-level enough that agents do not overfit to a single implementation**. The outline drafts at `/Ledger Drafts/` are meant to be handed to Opus for implementation; they should be structured and actionable without becoming brittle.

#### Why It Matters

Ledgers are read by future agents. Overfit ledgers become misleading the moment context shifts. Brittle ledgers break the legibility-first rule.

#### Suggested Action

Keep future ledger outlines elegant, practical, and implementation-oriented. Avoid narrow overengineering unless asked. When in doubt, read the matching outline at `/Ledger Drafts/<name>.txt` first — Jake's spine is there.

#### Expiry / Review

Review when style guide is formalized in a Decisions Ledger entry.

---

### COMM-2026-04-28-007 — Safe Movement Preference

Date: 2026-04-28
From: User (Jake)
To: Future agents
Type: `preference`, `boundary`
Status: **active**
Priority: high
Affected systems: Comeketo automation, Client Boxes, inbox work
Related ledgers: North Star NS-05, Open Problems (PROB-003)
Promote when: trust threshold is named in Decisions Ledger

#### Message

Comeketo (Rodrigo) wants to see automation movement, but Jake wants the early system to be **careful**. Prefer **safe movement over aggressive cleverness** while trust is being established.

#### Why It Matters

The company wants proof that automation is working, but Jake is trying to prevent unsafe autonomy. The system can show movement without taking unapproved big swings.

#### Suggested Action

Flatten risky plans unless the risky move is explicitly approved. Use polite nudges, clear next-step asks, reply-aware handling, and guardrail checks. When in doubt, choose the move that preserves momentum without creating exposure.

#### Expiry / Review

Review when explicit trust thresholds are named (e.g., "automation can self-approve up to $X" or similar). Until then this preference rules.

---

### COMM-2026-04-29-001 — Triad Spine: Box + Ledger + Sub-agent

> **Promoted to [`DEC-2026-04-29-001`](DECISIONS_LEDGER.md) on 2026-04-29** — settled rule recorded in the Decisions Ledger. Entry stays here for one session cycle per §12, then archives.

Date: 2026-04-29
From: User (Jake) via Claude Code catch-up session
To: Future agents
Type: `preference`, `boundary`
Status: **active**
Priority: high
Affected systems: entire project — architectural
Related ledgers: Temporal Continuity §1, Global Ledger §3
Promote when: Decisions Ledger lands → promote as a settled architecture decision

#### Message

The architectural spine is the **Box + Ledger + Sub-agent triad**. Anything with state that learns or needs updating gets all three:

- **Box** — the unit of state (Client Boxes, Staff Boxes, Coworker records, eventually any state-bearing entity)
- **Ledger** — the legible memory of that Box (project-wide ledgers under `LEDGERS/`; per-Box ledgers stamp from `LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md`)
- **Sub-agent** — the operator that reads/updates the Box and its Ledger (canonical config in `/Subagent Boxes/<name>/`; runnable form in `CCAgentindex/agents/<name>/`)

Standing inviolable rule: **legibility is more important than the build itself**. Code without a corresponding Ledger entry is debt to repay. A Ledger reader should understand the system without opening code.

Jake's exact words (2026-04-28): *"For everything that we build we cannot be lazy about the legibility. I am actually more concerned about the legibility than the build."*

#### Why It Matters

The triad is the design contract. Ledgers without Boxes are floating memory. Boxes without Ledgers are illegible state. Sub-agents without either are operators with no memory. Skipping any leg of the triad produces a system that cannot continue itself across agents.

#### Suggested Action

Before designing anything stateful, ask: *Where is the Box? Where is the Ledger? Where will the Sub-agent live?* If any answer is "we'll figure that out later," stop and figure it out now.

#### Expiry / Review

Promote to Decisions Ledger when that ledger lands. This is currently a Communication only because Decisions doesn't exist yet — but the rule itself is settled.

---

## 7. Lessons Learned

Durable project learning. Some may later become North Star principles or Decisions.

### Lesson — Sitting There Is State

Silence, waiting, holding, and watching are **not absence**. They are states.

This matters for:

- Client Boxes (a quiet client is not a closed client)
- scheduled fires (waiting is a state, not a no-op)
- reply gates (silence is a signal)
- plan validity (a plan can age without anything happening)
- temporal continuity (silence between sessions is meaningful)

Future systems should represent waiting states **explicitly**. The Temporal Continuity Ledger §14 ("Inactivity As State") encodes the discipline.

---

### Lesson — Automation Can Become More Personal

The goal is not generic drip automation. The goal is automation that **remembers what people said, respects their context, and helps Andre show up prepared**.

Wholesome enrichment is allowed for internal understanding. Creepy personalization is not. (See North Star §6 Wholesome Enrichment principle.)

The line is enforced by the Allowed-To-Know layer (PROB-001, still open) — until that layer exists, this lesson is enforced manually during Client Box audits.

---

### Lesson — Wholesome Enrichment vs. Creepy Personalization

Enrichment is allowed for **internal strategy**. It is not customer-facing.

Customer-facing copy must use only:

- facts found in `01_comms.md` / `01b_comms_verbatim.md` / `comms/*.json`
- facts in `00_meta.json` or `client_ledger.md`
- approved operator notes
- explicit operator approval for one-off uses

`04_profile.md` and `*_enrichment.md` are **planning fuel**, not content. Treat them as private analyst notes, not as conversation material.

---

### Lesson — TCL/GL Drift Is The Failure Mode (COMM-2026-04-29-005)

> **Promoted to [`DEC-2026-04-29-003`](DECISIONS_LEDGER.md) on 2026-04-29** — settled rule recorded in the Decisions Ledger. Entry stays here for one session cycle per §12, then archives.

Date: 2026-04-29
From: User (Jake)
Type: `lesson`, `preference`
Status: **active**
Priority: critical
Affected systems: Temporal Continuity Ledger, Global Ledger, every cold-starting agent

#### Message

Cold-starting agents read TCL and Global Ledger first. **If those ledgers are stale, every agent that boots from them is stale.** This is exactly what happened during the prior Cowork → Claude Code → Cowork handoff: the Cowork session read a TCL written ~24 hours earlier and had no idea about that day's catch-up work.

Jake's exact framing: *"The ledger is more important than the actual work. Literally everything needs to be ledgered."*

#### Why It Matters

The fix is not smarter agents — it's **discipline**. Whoever does the work also updates the orientation surface in the same unit of work. Not after. Not later. Same breath.

#### Suggested Action

Treat TCL and Global Ledger updates as part of the change, not an optional epilogue. Every meaningful session should leave the next agent with a clearer current state, fewer rediscovered problems, and a safer path forward. Update header dates. Append to §3 Recent Meaningful Changes. Update §1 Current Snapshot if anything structural changed.

#### Expiry / Review

This lesson does not expire. It is the meta-rule that keeps every other ledger usable.

---

## 8. Attempted / Abandoned Work Notes

Prevent repeated failed attempts. Do not invent failed attempts.

### COMM-2026-04-28-008 — Plumbing-First Build Attempt

Date: ~2026-04-26 to 2026-04-27
From: Jake (build history captured 2026-04-29)
To: Future agents
Type: `attempt`
Status: **abandoned (not failed — superseded by pragmatic rebuild)**
Priority: medium (historical context)
Affected systems: ledgers, sub-agent scaffolding, UI
Related ledgers: Temporal Continuity §1 (build arc), Global Ledger §2

#### What Was Attempted

The first build pass on Comeketo Agent was **plumbing-first**: build out the ledger system and sub-agent scaffolding before the user-facing UI matured. Plumbing was meant to give the system a durable spine before any user-visible product surface.

#### Result

The spine work was real, but **Rodrigo (Comeketo owner) needed something usable/demoable** sooner than the plumbing-first plan permitted. Pressure to demo collided with the plumbing timeline.

#### Why It Was Stopped / Changed

Jake **scrapped the plumbing-first plan mid-stream** and pivoted: rebuilt the UI from working pieces, then on a separate "heroic day" via Claude Co-Work authored almost all of the automations, Boxes, and Onboard Scripts in a separate folder (now symlinked into bedrock at `Auto/`). The ledger system buildout resumed only after that demo-pressure pivot.

#### What Future Agents Should Know

- The bedrock layout (`CCAgentindex/`) carries the bootstrapped-era 32-subdir shape from this attempt. PROB-016 owns the eventual reconciliation.
- Six bedrock subdirs are aliases into `Auto/`: `Boxes`, `Client Boxes`, `Staff Boxes`, `comeketo-inbox`, `Onboard Scripts`, `orchestrator`. This was the salvage path from the pivot.
- The 5 draft sub-agent packages at `/Subagent Boxes/` are the surviving plumbing-first work. They are the Phase B starting point — not greenfield.
- **The lesson is not "plumbing-first is wrong."** The lesson is that owner pressure can collide with depth-first plans, and the rebuild should preserve as much of the prior spine as possible.

---

## 9. Cross-System Coordination Notes

Notes that touch multiple systems and don't fit cleanly inside a single ledger or Box.

### Cross-System: Client Box State Flow

Client comms and transcripts feed state. State affects plan validity. Plan validity affects scheduled fires. Scheduled fires must obey guardrails. The Boxes UI page **displays** state but does not own it.

Systems involved:

- Close (canonical comms source)
- Client Boxes (`Auto/Client Boxes/<Name>/`)
- `comms_state_sweep` (planned automation)
- Inbox guardrails (`Auto/comeketo-inbox/`, `Guardrails.html`, `comeketo-guardrails-agent.md`)
- Scheduled fires (`CCAgentindex/triggers/`)
- Boxes UI page (`screens.jsx::BoxesScreen`)
- Ledgers (this directory)

Authority order for client truth (per Global Ledger §4.3): `01b_comms_verbatim.md` → `01_comms.md` → `00_meta.json` → `client_ledger.md` → approved operator notes → profile/enrichment (internal-only).

This note may eventually become a Source-of-Truth Ledger entry or an Asset/Widget Map entry.

---

### Cross-System: Page Work Done Gate

Any page, route, or page data-binding change **must update `page_asset_sitemap.md` in the same unit of work**. This is the UI Done Gate, defined in `CLAUDE.md` §5.5 and enforced by Global Ledger §4.7.

The sitemap covers the 11 surviving routes after the Apr 2026 trim: `grid, settings, leads, clients, coworkers, contacts, briefing, activity, automation, intake, analytics`.

If a page is added, removed, or its data binding changes, append to the page section's `Asset Ownership`, `Change Checklist`, and `History` lines, and bump `Last Verified`. New pages get a fresh entry following the Mapping Template at the top of the file. Removed assets must be removed in the same change.

---

## 10. Archived Communications

Move resolved or expired communications here when:

- the warning no longer applies
- the handoff has been completed
- the preference has been promoted to a Decision
- the issue moved to Open Problems
- the local context moved into a Box
- the lesson became a North Star principle

Archived entries should remain searchable but not clutter the active sections. Carry a closing line: `Archived: YYYY-MM-DD — <reason>`.

*No archived communications yet.*

---

## 11. Visualization Index

Mermaid `.mmd` files under `LEDGERS/VISUALS/`:

| Visual | Path | Purpose |
|---|---|---|
| Handoff routing decision tree | [`VISUALS/handoff_flow.mmd`](VISUALS/handoff_flow.mmd) | When you have important context, where does it go? Decision tree across the memory-of-the-work ledgers. |
| Communication lifecycle | [`VISUALS/communication_lifecycle.mmd`](VISUALS/communication_lifecycle.mmd) | Active → Resolved? → Promote (Decisions / Open Problems / Box) or Archive. |
| Communications timeline | [`VISUALS/communications_timeline.mmd`](VISUALS/communications_timeline.mmd) | Chronological view of seeded entries — who said what, when, to whom. |

---

## 12. Update Rules

### Update this ledger when

- a future agent needs a warning
- the user gives a durable preference
- a session leaves an important handoff
- an attempted approach fails or is abandoned
- a cross-system coordination note emerges
- a repeated mistake needs a warning
- a local issue has project-wide implications
- an active communication becomes resolved and should be archived

### Do **not** update this ledger when

- every chat exchange happens (chat scroll is not state)
- every small implementation detail (belongs in `git log` or `_ledger/activity.jsonl`)
- the information is better suited to Decisions, Open Problems, or per-Box ledgers
- the note is local-only and belongs inside a Box

### Promotion paths

| If the entry is… | Promote to… |
|---|---|
| A settled rule | Decisions Ledger (when it lands) |
| An unresolved problem | Open Problems Ledger |
| Local context | the relevant Box |
| A North Star-shaped principle | North Star Ledger |
| A source-of-truth statement | Source-of-Truth Ledger (when it lands) |

When promoting, leave the original entry in place with `Status: promoted` and a pointer to the new home, then archive after the promoted target is in production for one full session cycle.

---

## 13. Relationships To Other Ledgers

### Temporal Continuity

Temporal Continuity answers: *what is true right now?* Communications answers: *what does the next agent need to hear?* They overlap, but they should not duplicate each other.

| Temporal Continuity | Communications |
|---|---|
| "Client Box cleanup is active. Brenda & Steve done." | "When cleaning Client Boxes, check for plan/guardrail contradictions and leave audit markers." |
| State | Message |

### Decisions

If a communication becomes a settled rule, **promote** it.

| Communication | Decision |
|---|---|
| "Be careful with risky moves in batch approval." | "Risky sales moves require isolated approval cards." |
| "Triad spine is Box + Ledger + Sub-agent." | "All stateful entities require all three legs of the triad." |

After promotion, the communication can remain as background lesson or be archived.

### Open Problems

If a communication describes an unresolved issue, **promote** it to Open Problems.

| Communication | Open Problem |
|---|---|
| "We need an allowed-to-know constraint." | PROB-001 — Allowed-To-Know Constraint Not Implemented. |
| "Bedrock needs reconciliation eventually." | PROB-016 — CCAgentindex Bedrock Was Bootstrapped On The Fly. |

The Communications Ledger can mention the issue, but the Open Problems Ledger owns tracking.

### Local Boxes

Some communications are local. Per-Box notes belong in:

- `Auto/Client Boxes/<Name>/<YYYY-MM-DD>_audit_marker.md`
- `Auto/Client Boxes/<Name>/client_ledger.md`
- `Auto/Staff Boxes/<Name>/`
- per-directory `BOX.md` (template at `LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md`)

The global Communications Ledger should only mention them if the lesson is project-wide.

| Local | Global |
|---|---|
| "Brenda & Steve plan was cleaned on 2026-04-28." | (stays local — audit marker in box) |
| "Fee-waiver lesson applies to all Client Boxes." | COMM-2026-04-28-003 (global) |

This keeps the global ledger clean.

---

## 14. Quality Bar

This ledger succeeds if future agents can answer:

- What warnings should I know?
- What did the human ask future agents to remember?
- What handoff notes are active?
- What preferences should shape my work?
- What lessons should not be repeated?
- What was attempted and why did it stop?
- Which notes should be promoted to Decisions, Open Problems, or per-Box?
- What can be archived?

It fails if:

- it becomes a dump of every chat message
- it duplicates Temporal Continuity
- it records decisions without promoting them
- it hides unresolved issues that belong in Open Problems
- it is not read during handoff
- active warnings go stale
- future agents still miss important human preferences

This ledger should feel like a **trusted message board across time**.

---

## 15. Final Operating Rule

> Agents cannot remember what was never written down.
>
> If the next agent needs to hear it, leave the message.
>
> If the message becomes a rule, promote it.
> If it becomes a problem, track it.
> If it becomes local, move it into the Box.

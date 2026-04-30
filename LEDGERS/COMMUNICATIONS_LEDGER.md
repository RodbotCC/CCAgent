# Communications Ledger

Last updated: 2026-04-30 (appended COMM-2026-04-30-007 — Atlas integrated as project ground-truth surface. New `ground_truth_source` Box class introduced; alias at LEDGERS/atlas; Atlas Sweep Steward filed at PROB-015 for Phase B graduation. Prior same-day: COMM-2026-04-30-004/005/006 promoted atom-protocol rules from auto-memory to project-wide.)
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

### COMM-2026-04-30-001 — Deprecation Ledger + Snapshot Protocol Landed

Date: 2026-04-30
From: Cowork session (Phase B opener — Jake surfaced the gap directly)
To: Future agents — every retirement event project-wide (file deletion, folder retirement, ledger entry supersession, route flip-off, sub-agent replacement, Box archival, schema change, env var removal, API endpoint removal, widget retirement, dependency drop, setting removal, vault domain pruning).
Type: `handoff`, `preference`, `coordination`
Status: **active**
Priority: high
Affected systems: every Box, every ledger, the future Snapshot Steward, the future `LEDGERS/BOXES/deprecation/` unified Box, `_snapshots/` infrastructure, `.gitignore`
Related ledgers: [`DEPRECATION.md`](DEPRECATION.md), [`scripts/snapshot.sh`](scripts/snapshot.sh), [`DECISIONS_LEDGER.md`](DECISIONS_LEDGER.md) (DEC-2026-04-30-002 the architectural lock), [`OPEN_PROBLEMS_LEDGER.md`](OPEN_PROBLEMS_LEDGER.md), [`page_asset_sitemap.md`](../page_asset_sitemap.md)
Promote when: a Snapshot Steward sub-agent is built (Phase B), at which point routine snapshot health checks + 30-day candidate sweeps run automatically. This entry archives at that boundary.

#### Message

The **Deprecation Ledger** is now live at `LEDGERS/DEPRECATION.md` + `LEDGERS/DEPRECATION.json` (tier: global). It pairs with the **Snapshot Protocol** (Deprecation §7) and the manual snapshot runner at `LEDGERS/scripts/snapshot.sh`. `_snapshots/` exists at the project root for local-only recovery archives (gitignored). Architectural lock: `DEC-2026-04-30-002`.

The cardinal rule: **Nothing leaves the project without a Deprecation entry and a Snapshot reference.** This is binding the same way the Prime Directive on ledger discipline is binding — silent removal is silent debt, which is worse than bad code because the trail is gone.

Four backfill entries already seeded:
- `DEPR-2026-04-30-001` — Apr 2026 great-trim retired bedrock domains (`projects/`, `threads/`, `commitments/`, `knowledge/`)
- `DEPR-2026-04-30-002` — Audit Ledger never-built (paired with `DEC-2026-04-29-004`)
- `DEPR-2026-04-30-003` — Sub-agent draft package relocation (root → `/Subagent Boxes/`)
- `DEPR-2026-04-30-004` — Apr 2026 trim retired UI routes (13 routes; `delegations` boundary case flagged)

The Snapshot Protocol is wired manually today: any agent about to retire something runs `./LEDGERS/scripts/snapshot.sh manual "<reason-slug>"` first, captures the snapshot ID into the new Deprecation entry's `snapshot_id` + `snapshot_path`, then proceeds with the retirement.

#### Why It Matters

The project tree was already accumulating retirement debt without a record. The great-trim domains, the route reductions, the sub-agent relocation, the never-built Audit Ledger — all referenced as "retired" in `CLAUDE.md` and `GLOBAL_LEDGER` but never given a formal entry, no recovery surface, no metadata trail. Future agents would either follow stale references and 404, or worse, propose to "rebuild" what was deliberately retired.

This ledger ends that pattern. Every retirement now has: what, why, when, what replaced it, where to find the last-known-good version, what depends on it that still needs to be updated, when it can move from `archived` to `purged`. Every retired thing is recoverable from a snapshot (or carries an explicit `not_recoverable` reason).

It also closes the architectural symmetry that was missing: every other "what about over time" ledger exists (Decisions, Communications, Open Problems, Temporal Continuity, Phase) — Deprecation was the gap.

#### Suggested Action

Before retiring anything load-bearing:

1. **Read this ledger** to confirm the thing isn't already in `candidate`.
2. **Run `LEDGERS/scripts/snapshot.sh manual "<reason-slug>"`** to capture state.
3. **Run the §5 incoming-link audit** — search the project for everything pointing at the thing being retired; decide rewrite / remove / tombstone for each.
4. **Author the entry** in `DEPRECATION.md` §10.x and the matching JSON record. Mandatory minimums per state listed in §4.
5. **Update affected domain ledgers** (FCL / AWM / Connections / Page Ledgers / etc.) — drop the retired thing's row.
6. **Append `DEC-` and `COMM-` records** if the retirement reflects a Decision or warrants a handoff.
7. **Append `_ledger/activity.jsonl`** with `kind: "deprecation_recorded"`.
8. **Bump `Last updated`** at the top of `DEPRECATION.md`.

For routine maintenance (no retirement event): periodically run `./LEDGERS/scripts/snapshot.sh daily` (or weekly/monthly per cadence). Until the Snapshot Steward is built (Phase B), this is human-driven.

When **finding a retirement that was never logged**: backfill the entry. The four seeded entries are exactly this — historical retirements brought into the ledger with `recovery_difficulty: not_recoverable` or `trivial` as appropriate, and `snapshot_id: not_captured` for pre-protocol retirements.

#### Expiry / Review

Archive when:
1. The Snapshot Steward sub-agent is built (Phase B) — it takes over routine snapshot invocation, candidate-staleness sweeps, and snapshot health checks.
2. The Phase C Box Bus runtime ships and `LEDGERS/BOXES/deprecation/` is wired to receive `emits[]` candidates from any Box upstream.

Review if disk pressure from `_snapshots/` becomes meaningful (revisit retention rules) or if the ledger grows past a few hundred active entries (consider splitting by year / category — but the recovery key contract holds).

---

### COMM-2026-04-30-002 — Atom Ledger Landed; You Can Claim Work Now

Date: 2026-04-30
From: Cowork session (Phase B momentum — Jake surfaced the unlock directly)
To: Future agents — every Cowork session, every Claude Code subprocess, every Codex session, every runnable steward, every human reviewing the project. **This is how work gets claimed and shipped from this point forward.**
Type: `handoff`, `preference`, `coordination`, `lesson`
Status: **active**
Priority: high
Affected systems: every active PROB (currently 13); every agent claiming work; future Atomizer Steward; future `/api/atoms/*` endpoints; future Atoms UI panel
Related ledgers: [`ATOMS.md`](ATOMS.md), [`OPEN_PROBLEMS_LEDGER.md`](OPEN_PROBLEMS_LEDGER.md), [`DECISIONS_LEDGER.md`](DECISIONS_LEDGER.md) (DEC-2026-04-30-003 architectural lock), [`DEFINITION_OF_DONE.md`](DEFINITION_OF_DONE.md)
Promote when: the Atomizer Steward sub-agent is built (Phase B). At that boundary, this entry archives — the steward enforces the protocol automatically and the lesson becomes ambient.

#### Message

The **Atom Ledger** is now live at `LEDGERS/ATOMS.md` + `LEDGERS/ATOMS.json` (tier: global). It encodes the project's first parallel-work substrate: PROBs decompose 1:N into atoms; atoms have a single-writer claim protocol; multiple agents can ship in parallel without colliding. Architectural lock: `DEC-2026-04-30-003`.

The unlock Jake named: **monolithic PROBs are unactionable. Atoms are claimable.** PROB-016 sat deferred for two days because "32 directories to figure out" freezes any agent. Decomposed, it's 26 atoms — any agent can pick the next available one and ship it this session.

The first proof case is live: PROB-2026-04-28-016 (bedrock reconciliation) is now 26 atoms. 2 gates + 20 directory audits + 4 propagation. The dependency graph is clean: gates block audits; audits block propagation. Total ~21.5h of work, all `available`, ready to claim.

The protocol is binding from now on:
- **No work without a parent PROB.** Orphan atoms are not allowed. If you find work that doesn't trace to a PROB, file the PROB first.
- **No claim without atomic write.** Update `status` + `claimed_by` + `claimed_at` to BOTH `ATOMS.md` and `ATOMS.json` in one unit of work. JSON is canonical for race resolution.
- **No atom over 4h.** If your atom feels like a half-day, you have a sub-problem, not an atom. Re-decompose.
- **No vague acceptance criteria.** "Improve X" is not valid. Concrete files, fields, endpoints, or ledger rows only.

#### Why It Matters

For the first time, multiple agents can work the project in parallel without stepping on each other. Cowork sessions, Claude Code subprocesses, Codex sessions, future runnable stewards — all read the same `available` queue, claim distinct atoms, and ship.

This also kills the freeze response. Every session that read the Open Problems Ledger and saw "32 directories to reconcile" or "audit all 28 client boxes" felt the weight and deferred. Now the same problem is 26 single-session pieces, each with concrete acceptance criteria. Whether the work happens via Cowork, terminal, or runnable steward, the queue is the queue.

The audit trail compounds: every `atom_completed` event lands in `_ledger/activity.jsonl` with `claimed_by`, `completed_by`, `verification`. Over weeks this is the densest record of exactly what got done, by whom, with what proof.

#### Suggested Action

**Starting a session?** Read `ATOMS.md` §10. Filter by `area` if scoped. Pick an atom with `status: available` whose `blocked_by` chain is empty. Atomically write `status: claimed` + `claimed_by` + `claimed_at` to BOTH the .md section AND the .json `atoms[]` entry. Append `_ledger/activity.jsonl` with `kind: "atom_claimed"`.

**Working an atom?** Set `in_progress_at`, flip status. Do the work the atom names. When acceptance criteria pass, set `completed_at` + `completed_by` + `verification` (concrete proof — file path, commit hash, ledger row). Append `_ledger/activity.jsonl` with `kind: "atom_completed"`.

**Stuck?** Either `blocked` (with `blocked_by` populated or notes naming external dep) or `abandoned` (with notes — abandonment is signal, not failure).

**Authoring atoms (decomposing a PROB)?** Read the PROB end-to-end including close-criteria. List discrete actions per close-criterion. Size each (≤ 4h or split). Write atoms to ATOMS.md §10 + ATOMS.json. Cross-link from parent PROB. Append `_ledger/activity.jsonl` with `kind: "atoms_authored"`.

**Decomposing more PROBs?** The remaining 12 active PROBs are still monolithic. As queue depth permits, atomize them. Don't try to do all 12 at once — that's the same anti-pattern as "author all 14 Page Ledgers at once." Pick high-pressure PROBs first (PROB-016 was first because it's high-severity and explicitly deferred).

**Recognizing a stuck claim?** If you see an atom `claimed > 24h` ago with no `in_progress_at`, you may release it back to `available` and append a note. The original claimant lost their slot. This keeps the queue moving.

#### Expiry / Review

Archive when the Atomizer Steward sub-agent is built (Phase B follow-up). At that point the steward:
- runs the proposed-atom flow automatically when new PROBs land
- sweeps stale claims (>24h, no progress)
- surfaces PROB-closure-eligible candidates when all atoms tied to a PROB's close-criteria complete
- enforces the granularity rule by flagging proposed atoms over 4h

Review if 24h stale-claim threshold proves too short or too long in observed practice, or if the Phase C runtime evaluation suggests real-time atom dispatch obviates the manual claim step.

---

### COMM-2026-04-30-003 — Recovery Pattern: Agent Ran Out Of Tokens Mid-Ledger-Update

Date: 2026-04-30
From: Cowork session (recovery agent — Jake routed the failed session's transcript here for completion)
To: Future agents — every agent that picks up after another agent's session was interrupted, every operator who pastes a "did they finish?" transcript, future Atomizer Steward when it sweeps in-flight atoms.
Type: `lesson`, `coordination`, `handoff`
Status: **active**
Priority: medium
Affected systems: every Prime Directive ledger surface (activity.jsonl, sitemap, TCL, OPL §6, Decisions, Communications, Box ledger stamps), every multi-agent session boundary
Related ledgers: [`OPEN_PROBLEMS_LEDGER`](OPEN_PROBLEMS_LEDGER.md) (where the truncated work landed), [`TEMPORAL_CONTINUITY`](TEMPORAL_CONTINUITY.md) (recovery entry recorded), [`CLAUDE.md`](../CLAUDE.md) Prime Directive write list
Promote when: this pattern recurs ≥3 times and the diagnostic checklist becomes routine — at that point promote to a Steward agent that auto-detects truncated sessions from activity.jsonl gaps.

#### Message

A separate Claude Code session shipped 10 forward-looking OPL entries (PROB-2026-04-30-005..014) from Jake's paper list — but ran out of tokens mid-flight on the **activity.jsonl append**. The bash was last shown as `Running…` with no `ok` echo. Jake noticed and pasted the transcript into Cowork asking "did they finish?"

**The answer was: partially.** The OPL.md and OPL.json work landed cleanly. The activity entry, the §6 By System categorization, the TCL §3 + §11 update, and the Communications entry (this one) all needed to be done by the recovery agent.

**Symptoms of an interrupted ledger session:**
- Bash command in the transcript ends in `Running…` with no follow-up output.
- `Edit` calls show `String to replace not found` — the agent was about to retry with a re-read but didn't get there.
- The user's message starts with "did I stop you" or "are you still going?" — they noticed silence before the agent did.
- Activity ledger lacks the entry the agent's last visible bash was about to append.

**Recovery checklist (this is the canonical sequence):**
1. **Confirm what landed on disk.** Don't trust the transcript — `grep` the target ledger for the IDs/headers the agent claimed. Header bumps, JSON mirror counts, new entries — all verifiable.
2. **Identify the gaps.** Walk the Prime Directive write list (`CLAUDE.md` §0 PRIME DIRECTIVE) and check each surface: activity.jsonl entry · sitemap (if page changed) · TCL §3 · TCL §11 · OPL §6 categorization · Decisions Ledger · Communications · Box ledger stamps · indexes/index.json registration.
3. **Append the missing activity.jsonl entry first.** The audit trail is the load-bearing surface — get it back to honest before anything else.
4. **Categorize in OPL §6 By System.** New entries that aren't categorized are invisible to operators scanning by topic — categorization is a real reader-affordance, not bureaucracy.
5. **Update TCL §3 and §11.** Future cold-starting agents need to see this happened. Don't merge into someone else's entry — make it its own block with date + recovery context.
6. **Add a Communications entry** if the recovery itself contains a lesson worth keeping (this entry).
7. **Don't push to GitHub** until Jake gives explicit go-ahead — recovery commits should be reviewable.

**Why the lesson matters.** Token-limit interruptions don't fail loudly. Without a recovery agent, the OPL would be in a "looks done" state with the audit trail silently broken — exactly the cardinal sin (ledger drift) that the Prime Directive is designed to prevent. **Recovery is part of ledger discipline, not a separate task.**

#### Why It Matters

This is the first recorded multi-agent session boundary failure recovered cleanly. Saving the pattern means the next time an agent runs out of tokens, the recovery is mechanical, not detective work. Especially valuable as more parallel agents come online (Cowork + Claude Code + Codex + future stewards) — interruption frequency goes up linearly with agent count.

#### Suggested Action

When a user pastes another agent's transcript and asks "did they finish?": run the Recovery Checklist above. Don't summarize what they did; verify on disk. Complete the gaps. Record the recovery in TCL so the next session sees the seam.

When you yourself feel context pressure: **complete the Prime Directive write list before exploring new work.** Treat the activity.jsonl append as part of the same atomic unit as the change itself — append it FIRST after the change lands, not last.

#### Expiry / Review

Archive once an Atomizer Steward or recovery-detection agent automates this sweep — at that point the steward reads activity.jsonl, detects gaps where ledger writes are missing relative to ledger changes, and either auto-completes or files an atom. Until that exists, this is the human/agent protocol.

Review if recovery becomes routine (≥3 occurrences) or if the gaps surface a systematic issue with how the Prime Directive write list is presented in CLAUDE.md (e.g., agents miss step 6 consistently → reorder the list).

---

### COMM-2026-04-30-004 — Atom Protocol: Claim Before Doing

Date: 2026-04-30
From: Cowork session (claude_cowork_session_2026-04-30_atom_0044) — promoted from agent-private auto-memory after Jake flagged the visibility gap
To: Future agents — every agent working from the Atom Ledger queue
Type: `preference`, `handoff`, `coordination`
Status: **active**
Priority: high
Affected systems: ATOMS.md, ATOMS.json, every parallel claim attempt
Related ledgers: [`ATOMS.md`](ATOMS.md) §3 (lifecycle states), [`DECISIONS_LEDGER.md`](DECISIONS_LEDGER.md) DEC-2026-04-30-003 (atom architecture)
Promote when: this pattern is encoded into the Atomizer Steward's claim-resolution code path

#### Message

**The claim must land in the JSON before any work starts.** Protocol order is strict:

1. Read the queue (ATOMS.json — canonical for race resolution per ATOM Box §4)
2. **Claim** — atomically write `status: claimed` + `claimed_by` + `claimed_at` to ATOMS.json
3. **Then** read the work surface (the source files, the box you're stamping, the steward you're promoting)
4. Do the work
5. Mark complete with `verification` populated

**Do NOT load target files for an unclaimed atom.** Reading the files first wastes context if you race-lose, and risks two agents drafting the same work in parallel before realizing they collided. The atomic claim write is the only ground truth for "this atom is mine." First write wins.

#### Why It Matters

Today's session had two near-collisions inside ten minutes:
- ATOM-0036 — I claimed it; another agent had been about to claim it too and pivoted to ATOM-0040 when they saw my claim land first.
- The Atom Box explicitly designed ATOM-0044 as "no blocked_by — can be claimed in parallel" precisely so two agents could safely work side-by-side. Without the claim-first rule, that design property is wasted.

Multi-agent reality is loud — typically 5–7 agents in a busy window. Race-loss is routine, not exceptional.

#### Suggested Action

When picking up an atom:
1. `python3 -c "import json; ..."` (or equivalent) to read ATOMS.json
2. Verify status is `available` and no `claimed_by`
3. Write the claim (atomic write, JSON wins per ATOM Box §4)
4. Re-read after the write to confirm the claim is yours (race-loss check)
5. Then begin work

If the atom claim fails because someone else got there first, **abort cleanly and pick a different atom** — don't try to negotiate.

#### Expiry / Review

Archive when the Atomizer Steward (Phase B) takes over claim-arbitration with a `POST /api/atoms/claim` endpoint that handles the race resolution server-side.

---

### COMM-2026-04-30-005 — Atom Protocol: Announce Atom Before Working It

Date: 2026-04-30
From: Jake (operator preference — established 2026-04-30 22:30Z)
To: Future agents — every agent that claims an atom from the Atom Ledger
Type: `preference`, `handoff`
Status: **active**
Priority: high
Affected systems: every Cowork / Claude Code / Codex session that claims atoms; multi-agent coordination
Related ledgers: [`ATOMS.md`](ATOMS.md) §3, [`COMMUNICATIONS_LEDGER`](COMMUNICATIONS_LEDGER.md) COMM-2026-04-30-004 (claim-before-doing pairs with this)
Promote when: this rule is encoded as a steward dispatch convention or a hook fires it automatically

#### Message

**Lead the response with the atom claim before doing the work.** Format:

> **Claiming ATOM-YYYY-MM-DD-#### — <title>**
>
> [optional brief reasoning: why this is most load-bearing, why it doesn't collide with other agents]

Then do the work, then announce completion at the end.

The announcement is **upfront**, not retrospective. The operator should be able to interrupt, redirect, or veto before the agent burns context on the wrong thing.

#### Why It Matters

Jake's exact words (2026-04-30): *"Every AI needs to talk about what atom they're going after before they do it, not after."*

With 6+ parallel agents, the operator is reading multiple session transcripts at once. A retrospective "I just shipped X" announcement comes too late — by the time Jake sees it, the work is done. An upfront claim lets him say "actually do Y instead" before the agent burns 5–15 minutes building the wrong thing.

It also makes collision-detection visual — when Jake skims three sessions and sees three "Claiming ATOM-XXXX" headers, he can spot two agents both heading for the same atom in real time.

#### Suggested Action

The first line of the assistant's response when starting an atom should be a **bold claim line** with the atom ID and title. No wrapper paragraph, no lead-up. Then optional one-paragraph reasoning. Then the work begins.

Same applies at completion — start the wrap-up with **"ATOM-YYYY-MM-DD-#### completed"** so the operator sees the close immediately.

#### Expiry / Review

This is a stable operator preference. Review only if the multi-agent coordination model changes (e.g., if a single dispatcher agent does all the claim-arbitration and the human stops watching individual sessions).

---

### COMM-2026-04-30-007 — Atlas Integrated As Project Ground-Truth Surface

Date: 2026-04-30
From: Cowork session (claude_cowork_session_2026-04-30) following operator architectural insight from Jake
To: Future agents — every agent that writes ledgers; every cold-starting Cowork or Claude Code session
Type: `handoff`, `coordination`, `preference`
Status: **active**
Priority: high
Affected systems: project-wide ledger discipline, source-of-truth model, drift detection, all ledger steward sub-agents
Related ledgers: [`SOURCE_OF_TRUTH`](SOURCE_OF_TRUTH.md), [`OPEN_PROBLEMS_LEDGER`](OPEN_PROBLEMS_LEDGER.md) (PROB-2026-04-30-015 — Atlas Sweep Steward Not Yet Runnable), [`BOX_LEDGER`](BOX_LEDGER.md) (new Box class `ground_truth_source`), `LEDGERS/BOXES/atlas/BOX.md`, `LEDGERS/CONNECTIONS.md` (Pieces MCP)
Promote when: a second `ground_truth_source` Box appears (e.g., git_history Box, slack_activity Box) — at that point the pattern moves from this COMM into a formal Decisions Ledger entry codifying the new Box class.

#### Message

`/Users/jakeaaron/Documents/Atlas/` — the Pieces MCP daily-folder output that's been accumulating since at least 2026-04-24 — is now an explicit **project surface**. It's aliased at `LEDGERS/atlas/` (gitignored symlink) and governed by a new Box at `LEDGERS/BOXES/atlas/`.

**What Atlas is.** Pieces MCP observes the operator's actual machine activity (browser, vision, clipboard, conversations) and curates structured workstream summaries. Each morning a new daily folder is created (named e.g. `Thursday, April 30th, 2026`). Throughout the day Pieces deposits `pieces_*.md` summaries — each with TLDR, Core Tasks & Projects, Key Discussions & Decisions, Resources Reviewed, Next Steps. They cite specific file paths, ledger names, PROB-IDs, DEC-IDs by name.

**Why this matters for ledger discipline.** Every project ledger is what an agent **claimed** happened. Atlas is what **actually** happened on the operator's machine. When the two disagree, that's drift — and drift is the cardinal sin the project's Prime Directive is built to prevent. Until now we had no automated fact-check; agents wrote their own claims and there was nothing to verify them against. Atlas closes that gap.

**The new contract — two truths, both load-bearing:**

| Surface | Wins for | Loses for |
|---|---|---|
| **Atlas** | "Did this happen?" "When?" "What did the operator actually do?" | "What's the rule?" "What's the architecture?" "What did we decide?" |
| **Project ledgers** | "What's the rule?" "What did we decide?" "What's the project state?" | "What did the operator actually do today?" "What did the agents miss?" |

When they disagree, **file a PROB describing the gap**. Do NOT auto-overwrite either side.

**The new Box class.** This is the first `ground_truth_source` Box — kind distinct from `ledger`. It governs an external observation surface, not a project ledger. The Box owns the alias + the steward + the receipts; it does not own Atlas's contents (Pieces does). Future candidates for the same class: a `git_history` Box (observe `git log` as code-change ground truth), a `slack_activity` Box (observe Slack for team activity).

**Per-relevance filter.** Atlas captures everything on the operator's machine, including non-project content (entertainment, philosophical exploration, third-party tooling research). The Atlas Sweep Steward filters for project-relevance via filename hints (`pieces_cc_agent_*`, `pieces_*_ledger_*`, etc.), TLDR keywords (CC Agent, Comeketo, ledger, atom, steward, PROB-, DEC-, etc.), and Resources Reviewed paths (anything under `/Users/jakeaaron/Downloads/CC Agent/`). Non-project summaries are noted in the receipt count but never surfaced as findings.

**Surfacing taxonomy (A–F):** see `LEDGERS/BOXES/atlas/steward/AGENTS.md` §6. Concordance (A) doesn't fire writes; drift (B), handoff lessons (C), action suggestions (D), decision context (E) each have their own draft + reconcile path.

**Phase status.** Box authored 2026-04-30. Steward files staged. Live dispatch path `POST /api/agents/atlas_sweep_steward/run` already supported by the `_agent_resolve_prompt` helper (added in ATOM-2026-04-30-0029) but not yet smoke-tested. Graduation work tracked at PROB-2026-04-30-015.

#### Why It Matters

Three concrete frictions Atlas closes:

1. **Drift detection.** Until now no automated check existed. The Prime Directive's "ledger discipline above all else" rule depended on agents being honest about their own writes. Atlas adds the second pair of eyes the system needed.
2. **Decision context preservation.** Pieces captures conversational reasoning that often doesn't survive the trip into a clean DEC entry. Atlas's "Key Discussions & Decisions" section is exactly the context that would otherwise vanish into chat scroll.
3. **Atom backlog source.** Pieces' "Next Steps" sections are operator-generated action lists. The Atlas Sweep Steward turns those into atom candidates that wait for review at `LEDGERS/DRAFTS/ATOMIZATION/atlas_atoms_<date>.md`. This is exactly the kind of work-suggestion source the project's currently been generating manually.

Jake's framing (2026-04-30): *"This is basically like a source of truth against the truth we've been writing."*

#### Suggested Action

For agents writing project ledgers right now (i.e., everyone reading this):

- **When closing a PROB or marking a DEC settled:** glance at `LEDGERS/atlas/<today's folder>/` for any `pieces_*.md` whose TLDR mentions the same work. If Atlas describes the work meaningfully differently than your closure note, file a drift PROB before closing.
- **At session end:** consider whether today's TCL §11 entry captures what Atlas would say about your work. If Atlas's Pieces summary for your session would be more accurate than your TCL entry, your TCL entry is wrong.
- **For pre-decision context:** before drafting a DEC entry, scan recent Atlas folders for related discussion. The reasoning is often there in higher fidelity than chat scroll.

For the eventual Atlas Sweep Steward (when it's runnable per PROB-015):

- Default mode `audit_only` — write findings + drafts only. Reconcile mode requires explicit dispatch.
- Always file PROBs for drift; never auto-resolve.
- Always route atom candidates through `LEDGERS/DRAFTS/ATOMIZATION/` for human review before queue insertion.

#### Expiry / Review

This entry stays active until the Atlas Sweep Steward graduates and runs reliably for at least a week. At that point the architectural pattern can promote to a formal Decisions Ledger entry (`DEC-` for the new `ground_truth_source` Box class) and this COMM archives.

Review immediately if:
- A second `ground_truth_source` Box gets proposed (the pattern is generalizing — promote to Decisions)
- Atlas's daily-folder naming convention changes (Pieces could shift naming, breaking the steward's parsing)
- The operator-actual-activity that Atlas captures starts diverging from what Pieces sees (e.g., new device, multi-machine workflow) — that's a different kind of drift

---

### COMM-2026-04-30-006 — Atom Protocol: "P" Means Proceed To Next Load-Bearing

Date: 2026-04-30
From: Jake (operator shortcut established 2026-04-30 22:30Z)
To: Future agents — every Cowork session
Type: `preference`, `handoff`
Status: **active**
Priority: high
Affected systems: Cowork session input handling; atom queue work
Related ledgers: [`ATOMS.md`](ATOMS.md), COMM-2026-04-30-004 (claim-before-doing), COMM-2026-04-30-005 (announce-before-doing)
Promote when: replaced by a richer dispatch shorthand (e.g., `P boxes` to mean "proceed but in the boxes domain")

#### Message

**When Jake types `P` or `p`, the agent proceeds to the next most load-bearing claimable atom and ships it.** No clarifying questions; the protocol does the work:

1. Read ATOMS.json
2. Identify currently-claimed atoms (don't collide)
3. Identify the next most load-bearing unclaimed atom (use `do_not_undo_casually`, `blocks[]` length, parent-PROB priority as tiebreakers)
4. Announce (per COMM-005)
5. Claim (per COMM-004)
6. Ship
7. Announce completion

Jake's exact words (2026-04-30): *"It would be so nice if I could just type the letter P, which means proceed to whatever the next load-bearing thing is."*

#### Why It Matters

Operator velocity. With 6+ parallel sessions Jake is the bottleneck on all of them — every clarifying question costs him context-switch time. A one-character shortcut lets him keep three or four agents moving without typing more than one keystroke per session.

The shortcut also encodes a trust contract: the agent is supposed to make the load-bearing call autonomously, not ask "which one?" If the agent can't pick confidently, the shortcut is the wrong tool — better to ask explicitly.

#### Suggested Action

When the operator's message is just `P` or `p` (case-insensitive, possibly with surrounding whitespace):

1. Do not ask which atom — pick.
2. Use `do_not_undo_casually` notes as the load-bearing signal (atoms that warn about silent/cumulative drift score higher).
3. Use `blocks[]` length as a tiebreaker — atoms that unblock more downstream work score higher.
4. Use parent-PROB severity as a final tiebreaker.
5. Announce, claim, ship.

If the operator follows the `p` with content (e.g., `p but in the boxes area`), treat the additional content as a domain filter on the load-bearing pick.

#### Expiry / Review

Stable. Review only if a richer dispatch shorthand emerges or the operator workflow shifts away from atom-by-atom claiming.

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

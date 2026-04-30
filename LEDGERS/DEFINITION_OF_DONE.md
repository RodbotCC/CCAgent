# Definition of Done Ledger

Last updated: 2026-04-29 (initial creation — Phase 9 of ledger system buildout)
Maintainer: Jake / Comeketo Agent project agents
Status: **active**
Read when: closing any meaningful task, auditing work, reviewing a change, deciding whether to push, or judging whether someone else's "done" can actually be trusted.
Core Done rule: **Done means the system changed and the system's memory changed with it.**
Steward agent: not yet authored. Phase B work — when written it lands at `/Subagent Boxes/definition_of_done_subagent_package/`.

> Done is not when the model stops writing.
>
> Done is when the system can survive the change.
>
> Build the thing. Verify the thing. Record the thing. Hand off the thing.

---

## 1. Purpose

This ledger defines **what "done" means** across the project. It exists to protect the build from the most common false finish: *"the code changed, so the work is done."* In this build style, that is not enough.

A feature is not done until the source-of-truth files are updated. A page is not done until the page-asset sitemap is updated. A Client Box is not done until the plan, guardrails, state, and audit marker are aligned. A workflow is not done until the relevant ledgers, visual maps, and handoff notes are updated.

This ledger turns the project's **55 / 45 build rhythm** into a checkable operating system:

- **55% offense** — build the thing.
- **45% defense** — make sure the thing survives.

If the project follows this rhythm, momentum compounds. If it doesn't, the build rots.

### Owns

- the global definition of "done"
- the Universal Done Gate (one checklist that applies to every meaningful task)
- per-work-type Done Gates (Client Box, Page, Widget, Automation, Source-of-Truth, Ledger, Box / Directory, External Connection, Decision, Open Problem, Reconstruction)
- the Ledger Update Matrix (if X changed, update Y)
- verification expectations
- handoff expectations
- 55 / 45 build rhythm
- "what does not count as done" (false-finish patterns)
- the relationship between global Done Gates and stricter local gates

### Does not own

- every active task → not durable; lives in plans, the activity ledger, or per-Box notes
- every open problem → Open Problems Ledger
- every architectural decision → Decisions Ledger
- every page detail → page-asset sitemap (`page_asset_sitemap.md` at project root)
- every test command → not durable here; lives in scripts, READMEs, or CI configs
- every client-specific audit detail → per-Box audit markers
- audit findings → coverage absorbed by Open Problems / Decisions / Communications / per-Box ledgers (Audit Ledger removed from build queue 2026-04-29)
- the canonical UI page-asset map → `page_asset_sitemap.md` remains the operational truth; this ledger only points at it

This ledger defines the **standard**. Local ledgers and Boxes apply the standard to their own surfaces. When in doubt, the stricter requirement wins.

---

## 2. Core Definition of Done

A meaningful task is done **only when all of the following are true**:

1. The intended change has been made.
2. The correct **source of truth** was changed — not merely a generated surface.
3. The affected system still works, **or** the remaining risk is clearly recorded in the Open Problems Ledger.
4. Relevant **ledgers, maps, or local Box files are updated**.
5. Any changed page, route, data binding, or visible asset has its **page-asset sitemap entry updated** (`page_asset_sitemap.md` — the UI Done Gate).
6. Any new risk, open problem, or unresolved follow-up is **recorded** (Open Problems / Communications).
7. Any future agent needing context can **find it in the repo** — not in a chat scroll.
8. The change is **committed**, and pushed (or explicitly held local-only, with Jake's coordination).

Short version:

> Build the thing. Verify the thing. Record the thing. Hand off the thing.

The shorter rule, for triage:

> If the change altered behavior, ownership, truth, workflow, risk, or future context — it needs a Done Gate.

Tiny edits (typo fix, comment tweak, a single CSS variable) do not need every gate. **Meaningful change** does.

---

## 3. The 55 / 45 Build Rhythm

The project intentionally splits time and attention. **Both halves are first-class build activity.** Defense is not overhead.

### 55% Offense (build it)

- features, pages, widgets
- APIs, routes, automations, workflows
- client plans, renderers, integrations
- scripts, models, data pipelines
- new sub-agents, new ledgers, new Boxes

### 45% Defense (preserve it)

- updating ledgers
- updating source-of-truth maps and `page_asset_sitemap.md`
- cleaning stale assumptions
- verifying routes and APIs still wire correctly
- writing audit markers in Client Boxes
- recording decisions in the Decisions Ledger
- logging open problems
- updating Mermaid visuals
- adding handoff notes to the Communications Ledger
- keeping GitHub current and clean

> A build that remembers itself compounds. A build that does not remember itself rots.

A reviewer should be able to look at a session's output and see both halves represented. If a session shipped only offense, the next session pays the defense bill. If a session shipped only defense, the project stalled.

---

## 4. Universal Done Gate

Before calling **any** meaningful task done, answer the eight questions below. **If any answer is "no," the work may still be useful — but it is not fully done.**

- [ ] **Source of truth.** Did I change the correct source of truth (not a generated surface, not a cached view)?
- [ ] **Generated vs canonical.** Did I avoid editing a generated output as if it were canonical?
- [ ] **Guardrails.** Did I check whether any guardrail or source-of-truth rule applies (`Auto/comeketo-inbox/`, `Guardrails.html`, `comeketo-guardrails-agent.md`, Global §4)?
- [ ] **Ledgers / maps.** Did I update every affected ledger, map, sitemap, or Box note?
- [ ] **Open problems.** Did I record every unresolved problem I noticed?
- [ ] **Handoff.** Did I leave enough context for the next agent (Communications Ledger entry, Temporal Continuity update, or audit marker)?
- [ ] **Verification.** Did I run a verification step or clearly state why I couldn't?
- [ ] **Commit / push posture.** Did I commit, and is push status (pushed / local-only) clearly stated?

> An honest "not verified because…" is better than a fake green check.

---

## 5. Done Gates by Work Type

The Universal Gate is the floor. Each work type below adds a tighter mini-checklist on top.

### 5.1 Client Box Work

A Client Box pass is done when:

- [ ] Required files were checked: `00_meta.json`, `01_comms.md`, `01b_comms_verbatim.md`, `04_profile.md`, `05_seven_day_plan.md`, `09_andre_alerts.md`, `client_ledger.md` (if present).
- [ ] Current state was checked **against the plan**.
- [ ] Calendar labels and dates were reality-checked.
- [ ] Reply Gate was checked (any meaningful inbound invalidates plan-driven sends).
- [ ] Frequency-cap risk was checked.
- [ ] Commitment language was reviewed (no implicit fee waivers, discounts, scope promises, price guarantees).
- [ ] Enrichment boundary was checked (customer-facing copy uses comms-confirmed facts, not enrichment).
- [ ] Customer-facing facts were verified against `01b_comms_verbatim.md` / `comms/*.json`.
- [ ] Future sends were flattened **or** approval-gated if risky.
- [ ] An audit marker was added or updated (`<YYYY-MM-DD>_audit_marker.md` inside the box).
- [ ] The next recommended action is clear and written down.

### 5.2 Automation / Scheduled Fire Work

Automation work is done when:

- [ ] The trigger source is clear.
- [ ] The source-of-truth for input data is clear.
- [ ] Guardrails are applied **before** output.
- [ ] Reply / state changes can pause or invalidate the run.
- [ ] Risky moves require **isolated** approval (not a batched routine card).
- [ ] Logs / run summaries are written.
- [ ] Failure mode is recorded.
- [ ] Human review path is clear.
- [ ] No silent financial, pricing, scope, or enrichment-based commitments.
- [ ] Relevant ledgers and local Box notes are updated.

### 5.3 Page / Route Work

A page, route, or page data-binding change is done when:

- [ ] Route still exists and maps to the expected component.
- [ ] Primary component ownership is clear in `screens.jsx` / `app.jsx`.
- [ ] Asset Ownership block is updated in `page_asset_sitemap.md`.
- [ ] Data sources are listed / updated.
- [ ] APIs are listed / updated.
- [ ] Side effects are listed / updated.
- [ ] Cache-busters are bumped in `Secretary.html` if needed.
- [ ] **`page_asset_sitemap.md` is updated** — Asset Ownership, Change Checklist, History, Last Verified.
- [ ] History line appended; Last Verified date bumped.

The page-asset sitemap is the canonical UI Done Gate. This ledger does not replace it — it elevates it into the global system.

### 5.4 Widget / Component Work

Widget work is done when:

- [ ] Widget purpose is clear.
- [ ] Render owner is clear.
- [ ] Inputs, outputs, APIs, model calls are clear.
- [ ] Side effects are documented.
- [ ] Settings that affect it are recorded.
- [ ] Dependent pages / widgets were checked.
- [ ] Asset / Widget Map is updated (planned ledger; until it lands, update `page_asset_sitemap.md` per 5.3).
- [ ] Visual or state regressions were spot-checked where possible.

### 5.5 Source-of-Truth Change

A source-of-truth change is done when:

- [ ] The old source is identified.
- [ ] The new source is identified.
- [ ] Generated / cached surfaces are labeled as such.
- [ ] Agents know what to trust first (read order is documented).
- [ ] Affected scripts / renderers / API endpoints are updated.
- [ ] **Source-of-Truth Ledger** is updated (planned; until it lands, update Global Ledger §4 and any affected per-Box rules).
- [ ] Page / widget ledgers or sitemap are updated if UI is affected.
- [ ] Migration risk is recorded in Open Problems.

### 5.6 Ledger Creation / Ledger Edit Work

Ledger work is done when:

- [ ] The ledger's purpose is clear.
- [ ] Ownership and "does not own" are explicit.
- [ ] Update rules are defined.
- [ ] Relationship to other ledgers is clear.
- [ ] Markdown exists for humans / agents.
- [ ] JSON sibling exists if machine-readability is useful.
- [ ] At least one Mermaid visual exists if relationships are complex.
- [ ] **`LEDGERS/INDEX.md`** is updated (status flipped, paths listed).
- [ ] **`LEDGERS/GLOBAL_LEDGER.md` §8 + §14** is updated.
- [ ] **`LEDGERS/TEMPORAL_CONTINUITY.md`** is updated if the build phase advanced.
- [ ] The ledger does not duplicate another ledger's job.

### 5.7 Box / Directory Work

A directory or Box change is done when:

- [ ] Directory / Box purpose is clear.
- [ ] What belongs there is clear.
- [ ] What does **not** belong there is clear.
- [ ] Local source-of-truth rules are documented.
- [ ] Important files are listed.
- [ ] Local risks or guardrails are recorded.
- [ ] Local ledgers or `BOX.md` / `DIRECTORY.md` orientation files are updated.
- [ ] **File Directory Ledger** is updated if the file-tree shape changed.
- [ ] **Box Ledger** definitions still apply (or were extended).
- [ ] **`box.json` manifest stub exists or is on the way** (per [`BOX_BUS_LEDGER.md`](BOX_BUS_LEDGER.md) §2.1). **Soft today** — Phase A is schema-only, no runtime enforcement. **Hard at Phase C** when the bus runtime lands. New Boxes authored from Phase 10 onward should ship with a manifest stub even if `subscribes[]` and `emits[]` start empty.

### 5.8 External Connection / API Work

Connection work is done when:

- [ ] Service name and purpose are recorded.
- [ ] Required credentials are known **without exposing secrets**.
- [ ] Dependency owner is clear.
- [ ] Failure mode is understood.
- [ ] Billing / trial / renewal risk is recorded if relevant.
- [ ] What breaks if the service fails is recorded.
- [ ] **Connections Ledger** is updated (planned; until it lands, update Global §3 / TCL).
- [ ] **Settings Ledger** is updated if user-facing configuration changed (planned).

### 5.9 Decision Work

A major decision is done when:

- [ ] The decision is written down with a stable ID (`DEC-YYYY-MM-DD-###`).
- [ ] Why it was made is recorded.
- [ ] Alternatives are briefly noted.
- [ ] Consequences are recorded.
- [ ] Status is clear (`active | experimental | provisional | under-review | superseded | deprecated | rejected`).
- [ ] Affected systems are listed.
- [ ] **Decisions Ledger** (md + json) is updated.
- [ ] If the decision came out of a Communications entry, that entry's Status is set to `promoted`.

### 5.10 Open Problem Discovery

Finding a problem is done when:

- [ ] The problem is recorded with a stable ID (`PROB-YYYY-MM-DD-###`).
- [ ] Severity and urgency are estimated.
- [ ] Affected systems are listed.
- [ ] Whether it was fixed, partially fixed, or left open is clear.
- [ ] Next recommended action is clear.
- [ ] **Open Problems Ledger** (md + json) or local Box problem section is updated.
- [ ] If it was found mid-task, the discovery is noted in the parent task's handoff.

> Finding a problem but not recording it forces future agents to rediscover it.

### 5.11 Reconstruction / Prompt / Generation Work

A generated or rebuildable artifact is done when:

- [ ] Intent is recorded.
- [ ] Prompt / instructions are preserved if useful.
- [ ] Constraints are recorded.
- [ ] Source files and output files are listed.
- [ ] Regeneration path is clear.
- [ ] Known mistakes to avoid are recorded.
- [ ] **Prompt / Reconstruction Ledger** is updated (planned).

---

## 6. Ledger Update Matrix

The fastest reference in this ledger. After a meaningful change, find the row that matches and update the listed surface(s).

| If this changed... | Update this... |
|---|---|
| Project-wide state, identity, or rules | `GLOBAL_LEDGER.md` (§2 / §6 / §12) + JSON mirror |
| Current session moment, recent changes, carry-forward | `TEMPORAL_CONTINUITY.md` + JSON mirror |
| Long-term goals, principles, anti-goals, tradeoffs | `NORTH_STAR.md` + JSON mirror |
| Completion requirements | **`DEFINITION_OF_DONE.md`** (this file) + JSON mirror |
| File tree shape | `FILE_DIRECTORY_LEDGER.md` + JSON mirror |
| Directory rules / Box concept | `BOX_LEDGER.md` + per-`BOX.md` |
| Box wire shape / manifest schema / routing | `BOX_BUS_LEDGER.md` (schema only — runtime deferred to Phase C per `DEC-2026-04-29-013`) |
| Important file purpose | File Contents Ledger (planned) |
| Page, route, asset, data binding | **`page_asset_sitemap.md`** + Page Ledger (planned) |
| Widget / component behavior | Widget Ledger (planned) + Asset / Widget Map (planned) |
| External service / API / tool | Connections Ledger (planned) |
| Major architectural / philosophical choice | `DECISIONS_LEDGER.md` + JSON mirror |
| Handoff, warning, lesson, attempted work | `COMMUNICATIONS_LEDGER.md` + JSON mirror |
| Known issue, risk, blocker | `OPEN_PROBLEMS_LEDGER.md` + JSON mirror |
| Build recipe / regeneration prompt | Prompt / Reconstruction Ledger (planned) |
| Tool / model / workflow research | Scout Ledger (planned) |
| Phase / milestone state | Phase Ledger (planned) |
| Settings / configuration | Settings Ledger (planned) |
| Canonical data ownership rule | Source-of-Truth Ledger (planned) |
| Client-specific plan or state | Per-Box `client_ledger.md` + audit marker |
| Any non-trivial delegation | `CCAgentindex/_ledger/activity.jsonl` (append-only) |

> **Audit findings** intentionally have no row — Audit Ledger is out of scope as of 2026-04-29. Audit-shaped findings land in Open Problems, Decisions, Communications, or the per-Box ledger they belong to.

---

## 7. Verification Requirements

Verification can include any of:

- running tests
- running build scripts
- opening the relevant page in the running app
- checking generated output against expected shape
- validating JSON parses
- checking Markdown link integrity
- reviewing source-of-truth files
- checking route / component wiring
- reading the relevant Box's audit marker
- checking a client plan against latest comms
- checking executable copy against guardrails

If verification is **not possible**, **record why**. An honest "not verified because…" is better than a fake green check. The Open Problems Ledger is the right place when the reason is "we know this needs proper coverage we don't have yet."

---

## 8. Handoff Requirements

A meaningful task should leave behind, somewhere in the repo:

- what changed
- why it changed
- what files were touched
- what was verified
- what remains open
- what future agents should avoid
- what should happen next

Acceptable surfaces:

- `TEMPORAL_CONTINUITY.md` (current moment / recent changes / carry-forward)
- `COMMUNICATIONS_LEDGER.md` (handoff notes, warnings, lessons)
- `OPEN_PROBLEMS_LEDGER.md` (anything unresolved)
- per-Box audit marker (`<YYYY-MM-DD>_audit_marker.md`)
- commit message
- file-local note when appropriate

For direct GitHub work, **report commit SHA(s) to Jake** rather than burying them. The working tree may have unpushed local work — never push without coordination.

---

## 9. What Does Not Count As Done

The following are **not enough** by themselves:

- Code was edited.
- A page looks okay once.
- A generated file changed.
- A plan was written but not checked against guardrails.
- A Client Box has files but its plan, comms, and state are not aligned.
- A risky send was approved inside a batch without explicit risk surfacing (**batched approval can hide high-risk moves**, per Global §7 and `DEC-2026-04-28-005`).
- A decision was made in chat but not recorded.
- A bug was found but not logged.
- A source-of-truth change was made but maps still point to the old source.
- A local change exists but was not pushed and was not clearly marked local-only.
- A new ledger was authored but `INDEX.md` / `GLOBAL_LEDGER.md §8` still call it `planned`.
- A new visual was created but the Visualization Index does not list it.

This list is intentionally blunt. False completion is the failure mode this ledger exists to prevent.

---

## 10. Local Done Gates Override When Stricter

The global Done Gate is the **floor**. Local systems may define stricter gates.

| Local surface | Stricter gate it owns |
|---|---|
| `page_asset_sitemap.md` | page-specific completion (Asset Ownership, Change Checklist, History, Last Verified) |
| `Auto/comeketo-inbox/` + `Guardrails.html` + `comeketo-guardrails-agent.md` | send-safety completion |
| Client Boxes | per-client plan / state / audit marker completion |
| `Auto/orchestrator/` | generated-state completion |
| `LEDGERS/` (this directory) | memory-system completion |
| External connection ledgers (planned) | credential / dependency completion |
| `BOX_LEDGER.md` + per-`BOX.md` | per-Box source-of-truth and Done Gate |

When local and global gates conflict, **the stricter one wins**.

---

## 11. Relationship To Other Ledgers

```
North Star Ledger
  └── What outcomes matter?

Definition of Done Ledger  ← this file
  └── What must be true before work counts as complete?

Decisions Ledger
  └── Settled rules — read before reversing one.

Open Problems Ledger
  └── What's known-broken, partially fixed, or risky.

Communications Ledger
  └── Handoffs, warnings, lessons across sessions.

Phase Ledger (planned)
  └── What is "done" for this milestone?

Page-Asset Sitemap
  └── What is "done" for a UI surface?

Box Ledger + per-BOX.md
  └── What is "done" for a directory.

Client Box audit markers
  └── What is "done" for this client box pass.
```

This ledger sits between **philosophy** (North Star) and **execution** (everything else). It says, for any given task, *which gate applies and what counts*.

---

## 12. Relationship To The Triad (`DEC-2026-04-29-001`)

The architectural spine is **Box + Ledger + Sub-agent**. Definition of Done applies to all three legs:

- **Box** is done when its `BOX.md` declares purpose, source-of-truth, what doesn't belong, and a local Done Gate (per `BOX_LEDGER.md`).
- **Ledger** is done when md + json + INDEX + Global §8 all agree, and at least one Mermaid visual exists if relationships are complex (per §5.6 above).
- **Sub-agent** is done when its package carries `AGENTS.md`, a config JSON, a README, and either a runnable form under `CCAgentindex/agents/<name>/` or an explicit "Phase B not yet" marker (per `DEC-2026-04-29-002`).

Anything stateful that ships without all three legs is a debt to repay. The triad is intentionally lopsided right now — more Boxes than Ledgers, more Ledgers than Sub-agents — and the Done Gate for closing that gap is **this ledger plus `BOX_LEDGER.md`**.

---

## 13. North Star Alignment

The Definition of Done Ledger directly supports:

- **NS-01 Durable Project Memory** — every Done Gate forces a memory write.
- **NS-06 Source-of-Truth Discipline** — generated output never closes a gate.
- **NS-09 Agent Handoff Continuity** — handoff is a required gate field, not an optional one.
- **NS-10 Defense As First-Class Build Activity** — the 55 / 45 rhythm is encoded directly here.

Indirect support: NS-02 (legibility), NS-04 (safe automation), NS-07 (cleanup discipline). See `NORTH_STAR.md` for full goal definitions.

---

## 14. Audit Integration

Audit Ledger is **out of scope** as of 2026-04-29 (`DEC-2026-04-29-012`). Audit-shaped findings instead land in Open Problems, Decisions, Communications, or per-Box ledgers, depending on what they are.

When auditing whether work met the Done Gate, record:

- work reviewed (path / SHA / Box name)
- applicable Done Gate (which §5 sub-gate)
- pass / partial / fail
- missing memory updates
- missing verification
- source-of-truth drift
- open follow-ups (which become PROB-* entries)
- North Star alignment (which NS-XX goals were supported / drifted)

Audit example (from the Brenda & Steve cleanup, 2026-04-28):

```
Audit:        Brenda & Steve Client Box
Done Gate:    §5.1 Client Box Work
Status:       partial → improved after cleanup pass
Findings:
  - stale calendar labels fixed
  - commitment language gated
  - enrichment leakage reduced
  - audit marker added (2026-04-28_audit_marker.md)
Remaining:
  - allowed-to-know layer still needed (PROB-2026-04-28-002)
  - full phone transcripts now imported (closed by 2026-04-28 verbatim backfill)
```

---

## 15. Update Rules

Update this ledger when:

- a new work-type Done Gate is needed
- a Done Gate field is found to be too loose, too strict, or missing
- a new ledger is authored (add the row to §6 Ledger Update Matrix)
- a new local-stricter gate is created (add to §10)
- a North Star goal is added, retired, or renamed (refresh §13)
- a "what does not count as done" pattern is observed in the wild (add to §9)

When updating: bump `Last updated`, refresh the JSON mirror, and update `INDEX.md` if status changed.

---

## 16. Final Operating Rule

> Done is not when the model stops writing.
>
> Done is when the system can survive the change.
>
> Build the thing. Verify the thing. Record the thing. Hand off the thing.

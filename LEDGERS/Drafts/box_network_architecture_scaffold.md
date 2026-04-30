# Box Network Architecture Scaffold

Date: 2026-04-30
Status: draft architecture scaffold
Authoring context: Jake + Codex synthesis
Related ledgers: `BOX_LEDGER.md`, `BOX_BUS_LEDGER.md`, `SOURCE_OF_TRUTH.md`, `DECISIONS_LEDGER.md`, `ATOMS.md`, `TEMPORAL_CONTINUITY.md`

> Working thesis: a Box is not a folder. A Box is a stateful memory object with an operating contract.

This document describes the target architecture Jake is moving toward: Ledgers, Boxes, and Sub-agents becoming one integrated primitive. It is a scaffold from the current project state to the finished system.

It should be read as a synthesis/proposal, not yet a binding Decision. If accepted, the pieces here should be promoted into the relevant canonical ledgers: Box Ledger for concept, Box Bus Ledger for routing, Source-of-Truth for authority, Decisions Ledger for locked commitments, Definition of Done for completion gates, and Atom Ledger for implementation work.

---

## 1. The Core Idea

The project is evolving from "files that agents read" into a network of intelligent state containers.

The primitive is the Box.

```text
Box = state + memory + rules + configuration + steward behavior + receipts
```

The old triad is still true:

```text
Box       = body / boundary / ownership
Ledger    = memory / state over time
Sub-agent = behavior / operator
```

But the mature architecture fuses them:

```text
Intelligent Box = Box + Ledger + AGENTS.md + box.json + steward + receipts
```

A Box is "intelligent" not because it magically thinks, but because access is governed. When any agent enters a Box, it enters through local instructions, declared source-of-truth rules, routing subscriptions, interpreter rules, and append-only receipt discipline.

The directory stops being passive storage. It becomes a governed object in the system.

---

## 2. The Target Box Shape

Every mature Box should converge toward this shape:

```text
<box>/
  BOX.md
  box.json
  LEDGER.md
  LEDGER.json
  AGENTS.md
  steward/
    prompt.md
    config.json
    skills/
  receipts/
  inbox/
  outbox/
```

Not every Box needs every file on day one. The shape is the destination.

### Required pieces

`BOX.md` is the human orientation file. It says what the Box is, what it owns, what it trusts, what it forbids, what counts as done, and how future agents should leave it better than they found it.

`box.json` is the machine-readable manifest. It declares id, slug, kind, ownership, source-of-truth, subscriptions, emissions, interpreter tier, and guardrails.

`LEDGER.md` is the narrative memory. It records what changed, why it changed, what is true now, what is stale, and what the next agent needs to know.

`LEDGER.json` is the structured mirror when runtime or other Boxes need machine-readable state.

`AGENTS.md` is the local law. Any agent operating inside the Box reads it and follows it. This is where the Box says, "If you touch me, this is how you behave."

`steward/` holds runnable behavior. The steward is the Box's specialized operator: audit-only, local-write, reconcile, summarize, propose atoms, or other modes declared by config.

`receipts/` holds proof. Steward runs, audits, propagations, and migrations leave receipts here.

`inbox/` and `outbox/` are future Box Bus surfaces. The inbox holds delivered envelopes waiting for interpretation. The outbox holds local events ready to emit upstream or sideways.

---

## 3. Authority Tiers

Some Boxes are more upstream than others. "More important" is true emotionally, but the cleaner architecture word is authority.

Authority is not status. It means other Boxes inherit from it.

### Tier 0: Constitutional Boxes

These define global law.

Examples:

- Global Ledger Box
- Source-of-Truth Box
- North Star Box
- Decisions Box
- Definition of Done Box
- Box Bus Box

These Boxes should rarely receive casual edits. When they emit, the system needs to listen carefully.

### Tier 1: Coordination Boxes

These coordinate the work across time.

Examples:

- Temporal Continuity Box
- Communications Box
- Open Problems Box
- Atom Box
- Deprecation Box
- Phase Box

They do not necessarily define law, but they control flow, sequencing, warnings, and work decomposition.

### Tier 2: Domain Boxes

These govern a functional area.

Examples:

- Client Boxes domain
- Staff Boxes domain
- Automation Box
- Intake Box
- Analytics Box
- Page Boxes
- Connections Box
- Guardrails / inbox-skill Box

Domain Boxes receive global law, interpret it for their area, and emit problems or decisions upward when local patterns become systemic.

### Tier 3: Leaf Boxes

These are local state containers.

Examples:

- One lead Box
- One client Box
- One coworker Box
- One venue Box
- One widget Box
- One scheduled-fire Box
- One report/snapshot Box

Leaf Boxes should not need the whole universe. They should receive only the interpreted rules and state relevant to them.

---

## 4. Trickle-Down Is Not Dumping

The system should not blast every global ledger entry into every Box.

The correct model is filtered inheritance:

```text
Upstream authority
  -> scoped envelope
  -> subscription match
  -> interpreter
  -> local consequence
  -> receipt
```

A Box should receive:

- the global rules that affect it
- the domain rules that affect it
- the local records it owns
- the interpreted consequences it needs to act safely

A Box should not receive:

- irrelevant global noise
- raw private context from other Boxes
- generated views masquerading as truth
- upstream entries that require an interpreter but have not been interpreted yet

The goal is not "every Box knows everything." The goal is "every Box knows what it is allowed and required to know."

---

## 5. Interpreter Boxes

Sometimes a Box should not receive upstream state directly. The state needs to pass through an interpreter first.

Example:

```text
Client Comms Box
  -> Allowed-To-Know Interpreter
  -> Lead Box
  -> Outbound Message Box
```

The raw comms may contain rich context. The Lead Box does not automatically get to use all of it. The Allowed-To-Know Interpreter decides what is comms-confirmed, internal strategy, protected, or approval-required.

Another example:

```text
Decisions Box
  -> Page Impact Interpreter
  -> Page Box
  -> page_asset_sitemap.md update
```

A global Decision may affect a page, but the page does not need the full Decision payload. It needs a local consequence: what assets, routes, components, APIs, or Done Gates changed.

Interpreter Boxes are where meaning changes shape.

They can be deterministic, lightweight, or judgment-heavy:

- T1: schema mapper, no model call
- T2: template summarizer, cheap model call
- T3: full steward/sub-agent, judgment required

The default should be T1. T3 should be reserved for cases where the Box genuinely needs reasoning.

---

## 6. Box Communication Model

Every Box should declare both inbound and outbound communication.

Inbound:

```json
{
  "subscribes": [
    {
      "source": "DECISIONS_LEDGER",
      "scope": "kind:client",
      "interpreter": "T1",
      "write_target": "client_ledger.md"
    }
  ]
}
```

Outbound:

```json
{
  "emits": [
    {
      "on_event": "guardrail_violation_found",
      "target": "OPEN_PROBLEMS_LEDGER",
      "interpreter": "T2",
      "requires_receipt": true
    }
  ]
}
```

This turns Boxes into a graph.

The graph is not only top-down. It supports:

- top-down inheritance
- local-to-global escalation
- sidecar interpretation
- sibling notification through a domain Box
- leaf state becoming a global problem
- global rule becoming a local Done Gate

---

## 7. Source, Interpreter, Destination

Every meaningful propagation should be representable as:

```text
Source Box -> Interpreter -> Destination Box
```

The interpreter may be a no-op.

Examples:

```text
North Star Box
  -> Wholesome Enrichment Interpreter
  -> Client Box
```

```text
Open Problems Box
  -> Atomizer Steward
  -> Atom Box
```

```text
Temporal Continuity Box
  -> Handoff Summarizer
  -> AGENTS.md / CLAUDE.md rule update candidate
```

```text
Close Comms Mirror Box
  -> Allowed-To-Know Interpreter
  -> Outbound Draft Box
```

```text
Page Source Files
  -> Page Asset Interpreter
  -> Page-Asset Sitemap
```

This is the shape that makes the system legible. No invisible magic. Every flow has a source, a transformation rule, a destination, and a receipt.

---

## 8. The Current State

The project already has many ingredients.

Already present:

- Global Ledger
- Temporal Continuity Ledger
- Box Ledger
- Box Bus Ledger
- Source-of-Truth Ledger
- Definition of Done Ledger
- Decisions Ledger
- Communications Ledger
- Open Problems Ledger
- Atom Ledger
- unified Box pattern under `LEDGERS/BOXES/<name>/`
- steward folders for several ledger Boxes
- activity ledger at `CCAgentindex/_ledger/activity.jsonl`
- page-asset sitemap as UI Done Gate
- Client Boxes and Staff Boxes under `Auto/`

Partially present:

- `box.json` manifests
- steward prompts/configs
- receipts
- JSON mirrors
- Page Ledgers
- Atomized implementation queue
- unified Box path for ledgers

Missing or incomplete:

- consistent Box internal shape across all Box kinds
- runtime Box Bus
- inbox/outbox envelope handling
- subscription index
- interpreter registry
- propagation receipts
- Box graph visualization
- automated "enter Box through config" enforcement
- complete migration of loose ledgers into Ledger Boxes
- complete migration of client/staff/page surfaces into Box form

The architecture is not imaginary. It is half-written in the tree already. The work now is consolidation.

---

## 9. Build Path From Here

### Phase 1: Name the primitive

Goal: make the concept explicit.

Actions:

- Promote this scaffold into canonical ledgers after review.
- Record a Decision: "Box = Ledger + Rules + Sub-agent + Config + Receipts."
- Update Box Ledger to define the fused primitive.
- Update Box Bus Ledger to reflect source/interpreter/destination routing.
- Update Definition of Done with Box-completion gates.

Done when:

- Future agents stop treating Box, Ledger, and Sub-agent as separate loose things.
- The canonical ledgers say clearly that the mature Box is the integrated primitive.

### Phase 2: Standardize the Box shape

Goal: one repeatable filesystem contract.

Actions:

- Define required and optional files for each Box class.
- Update `LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md`.
- Add a `BOX_SHAPE.md` or equivalent section to Box Ledger.
- Decide whether ledger Boxes keep canonical `LEDGER.md` inside the Box or govern top-level `LEDGERS/<name>.md` by reference during migration.
- Define naming rules for local `AGENTS.md`.

Done when:

- A new Box can be scaffolded without improvisation.
- Every Box class has a minimum viable shape.

### Phase 3: Finish Ledger Boxes

Goal: every project-level ledger has a Box.

Actions:

- Create or complete `LEDGERS/BOXES/<ledger_name>/`.
- Ensure each has `BOX.md`, `box.json`, `steward/AGENTS.md`, `steward/prompt.md`, `steward/config.json`, and `receipts/`.
- Add the ledger itself to `owns[]`.
- Update `LEDGERS/INDEX.md`.
- Add receipts for audits/steward runs.

Done when:

- Every global/domain ledger has a governing Box.
- The ledger's steward instructions live with the Box that governs it.

### Phase 4: Define the Box graph

Goal: declare who listens to whom.

Actions:

- Add `subscribes[]` and `emits[]` to every mature `box.json`.
- Start with ledger Boxes, then page Boxes, then Client Boxes.
- Define authority tiers.
- Define allowed fan-out rules.
- Define escalation rules from local to global.
- Add graph validation script.

Done when:

- The system can answer: "If this Box changes, who needs to know?"
- The system can answer: "Why did this Box receive that state?"

### Phase 5: Build interpreters

Goal: make routing safe and meaningful.

Actions:

- Create interpreter registry.
- Implement T1 deterministic mappers first.
- Define T2 prompt templates.
- Reserve T3 for steward agents.
- Build the first real interpreter around Allowed-To-Know.
- Build the second around Open Problems -> Atoms.

Done when:

- At least one global rule routes into a local Box through a T1 mapper.
- At least one local issue escalates upward through an interpreter.
- At least one T3 steward run produces a receipt and local write.

### Phase 6: Build the Box Bus runtime

Goal: turn declared architecture into live routing.

Actions:

- Add a Box registry endpoint.
- Add envelope format.
- Add subscription matching.
- Add delivery queue.
- Add receipt writing.
- Add cycle detection.
- Add dry-run mode.
- Add "explain route" mode.

Done when:

- A Box event can route to another Box without a human copying context.
- The route is inspectable.
- The recipient Box records what it received, how it interpreted it, and what it changed.

### Phase 7: Migrate operational surfaces

Goal: the real app runs through Boxes.

Actions:

- Convert Client Boxes to full Box shape.
- Convert Staff Boxes to full Box shape.
- Convert Page Ledgers/Page Boxes to full Box shape.
- Convert automation workflows into Boxes.
- Convert scheduled fires/drafts into Boxes or Box-owned entries.
- Add local `AGENTS.md` files where behavior differs.

Done when:

- Any stateful thing in the system has a Box.
- Any agent touching that thing can find local rules before editing.

### Phase 8: Make the system self-maintaining

Goal: Box stewards keep the network coherent.

Actions:

- Add drift monitors.
- Add stale-claim sweepers.
- Add ledger mirror sync checks.
- Add source-of-truth conflict audits.
- Add Box shape validators.
- Add route receipt audits.
- Add "what changed since last run" steward modes.

Done when:

- The system can notice its own stale state.
- The system can propose atoms for its own maintenance.
- Human review focuses on judgment, not remembering where everything lives.

---

## 10. Definition Of Done For The Architecture

The architecture is done when the following are true.

### Conceptual Done

- Box, Ledger, Sub-agent, Steward, Interpreter, Envelope, Receipt, and Box Bus have stable definitions.
- Those definitions live in canonical ledgers, not chat.
- Future agents can explain the architecture after reading the ledgers.

### Filesystem Done

- Every stateful or memory-bearing domain has a Box.
- Every Box has `BOX.md`.
- Every mature Box has `box.json`.
- Every Box with evolving state has a ledger.
- Every Box with specialized behavior has local `AGENTS.md` or `steward/AGENTS.md`.
- Every Box that runs logic has receipts.

### Routing Done

- Every Box declares inbound subscriptions.
- Every Box declares outbound emissions.
- Authority tiers are explicit.
- Interpreter tiers are explicit.
- No route is invisible.
- Cycles are detected and refused.

### Agent Done

- Agents entering a Box read its local rules.
- Agents know which upstream ledgers affect the Box.
- Agents update the Box ledger after meaningful change.
- Agents append activity receipts for non-trivial writes.
- Agents do not treat generated views as canonical state.

### Runtime Done

- Box registry exists.
- Box Bus can deliver envelopes.
- Delivery can run in dry-run mode.
- Delivery can explain itself.
- Receipts are written automatically.
- Steward agents can run against their Box configuration.

### Safety Done

- Source-of-truth rules are enforced.
- Allowed-To-Know constraints are enforced before outbound copy.
- Risky moves require explicit approval.
- Local Boxes do not receive private or irrelevant state.
- Escalation from local to global is declared, not accidental.

### Maintenance Done

- Drift is detected.
- Stale state is surfaced.
- Open problems decompose into atoms.
- Box stewards can propose repairs.
- Ledger updates are part of the same unit of work as code/state changes.

---

## 11. The Final Shape

When this is done, Comeketo Agent is not just an app with documentation.

It is a file-tree operating system.

Every meaningful thing is a Box.

Every Box has memory.

Every Box has law.

Every Box knows what it owns.

Every Box knows what it listens to.

Every Box knows what it is allowed to emit.

Every cross-Box message has a route.

Every route has an interpreter.

Every interpreter leaves a receipt.

Every receipt can become memory.

Every unresolved problem becomes atoms.

Every future agent enters the system through the same legible protocol.

The result is not a single super-agent that knows everything. The result is a network of bounded, stateful, interpretable agents and memory objects that know only what they need, inherit only what applies, and leave the next agent less confused than they found it.

That is the architecture.

---

## 12. Open Questions To Settle

1. Should mature Ledger Boxes physically move the canonical ledger file inside the Box, or continue governing top-level `LEDGERS/<name>.md` by reference?
2. Should every mature Box have a local `AGENTS.md`, or should simple Boxes rely on `BOX.md` plus `box.json` only?
3. What is the exact minimum viable `box.json` schema for Phase B, before full Box Bus runtime exists?
4. Which interpreter should be built first: Allowed-To-Know, Open-Problems-to-Atoms, or Page-Asset impact?
5. Should inbox/outbox folders exist physically in every Box now, or be virtual until runtime?
6. What is the first operational Box outside ledgers to fully migrate: a Client Box, a Page Box, or Automation?
7. How should Box authority tiers be visualized in the UI?
8. What does "entering a Box" mean mechanically for Codex, Claude Code, Cowork, and future stewards?

---

## 13. Suggested Immediate Atoms

- Draft Decision: Box-Ledger-Subagent fusion is the target primitive.
- Update Box Ledger with "mature Box shape."
- Update Box Bus Ledger with source/interpreter/destination model.
- Add Definition of Done gate for Box completion.
- Create `LEDGERS/BOXES/box_bus/` as a governing Box for Box Bus Ledger.
- Pick one Client Box and migrate it to the mature shape.
- Pick one Page Box and migrate it to the mature shape.
- Build a Box graph inventory script.
- Build a dry-run Box Bus route explainer.
- Build the Allowed-To-Know Interpreter as first proof.


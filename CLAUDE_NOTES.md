# Comeketo Agent — Working Notes

A living scratchpad for thinking-through and decisions on Comeketo Agent, written by Claude while the team and Claude talk through the app. Intended to be read alongside the code when the team takes the work into Claude Code for actual implementation.

**Convention:** newest entries at the top. Each entry gets a short heading so it's scannable.

---

## Preflection, Orchestrator-as-stage-selector, and the user-level reframe of drift (session 1)

### the team's reframe of drift

Claude had conceded that even with perfect alignment flow, three drift sources survive: capability drift, state drift, compound-error drift. the team pushed back: **those are not AI-level drift. They are user-level failures to set up the system correctly.**

- **Capability drift** = user didn't give the system adequate tools. Setup failure, not AI drift.
- **State drift** = user didn't build a staleness-detection-and-Consult mechanism. Architecture failure, not AI drift.
- **Compound-error drift** = user didn't require typed audits between tasks. Discipline failure, not AI drift.

All three are **absences of Preflection-class setup and proper orchestration**. With proper Preflection + audit discipline + Consult + typed interfaces, AI-attributable drift approaches zero. What's left is *mistakes*, not drift — and mistakes are what typed audits catch and correct.

**Sharper statement**:
> Drift at the AI level is a user-education problem disguised as a technical problem. Build the meta-harness correctly and you don't have drift. You have occasional mistakes that the harness catches.

the team is being charitable when he says users are "ignorant, not dumb" — he means literally ignorant of how the systems work. Most people running AI products don't have the mental model of regime declaration, typed stages, audit loops, or state reset. They give the AI vague tasks with no deliverable spec, no audit gate, no reset, and then blame the AI when it drifts. The AI didn't drift. The setup failed.

### The Orchestrator's real job — the piece Claude had been underselling

the team: *"There's Preflection, audits, deliverables, shell scripts, tools, comparisons, and it's up to an orchestrator to decide how much of that stuff needs to be included for any given interaction."*

**This is the cleanest statement of what an Orchestrator actually is.**

Not "the thing that runs sub-agents." Something more specific:

> The Orchestrator is the component that decides, per interaction, which cognitive-manufacturing stages are required and in what order.

Preflection, audits, deliverables, shell scripts, tools, comparisons — these are all **stages a task might require**. Not every task needs all of them. A static pipeline running all stages on every task is overbuilt and slow. A static pipeline with a fixed minimal subset underfits complex tasks.

**The Orchestrator's actual job is typed stage selection.** Given incoming task, declared anchor set, current regime, sore-thumb variables for this cluster — which stages fire, in what order, with what parameters?

Framework-lawful because it's the **atomization method applied to the task itself**. Every task gets broken into "what cognitive work does it actually require," live-band-filtered against available stages, sore-thumb-weighted to pick the minimum-sufficient set. The Orchestrator refuses to overbuild and refuses to underfit.

**Design brief for Comeketo Agent, extracted from the team's sentence**:
- Define the set of available cognitive stages (Preflection, sub-agent fan-out, audit, deliverable, shell execution, comparator re-score, Consult, etc.)
- The Orchestrator's primary intelligence is in stage-selection, not stage-execution
- Stage-selection is itself a typed decision, informed by the task's regime and sore-thumb variables
- Timescale sovereignty: slow layer decides which cognitive work gets done; fast layer just does what it's told

### Preflection — the stage the team has been developing

the team attached a Preflection summary. The HTML file he referenced didn't reach Claude's filesystem, but the text summary came through.

**Preflection = pre-execution stage that does four things before the agent reasons about a query**:

1. **Context analysis** — reads thread, query intent, available memory, relevant history
2. **Dynamic instruction generation** — writes query-specific instructions appended to base instructions
3. **Cognitive priming** — fires a blank prompt to integrate the new instructions into the agent's state
4. **Inference parameter selection** — tunes temperature, top-p, top-k, penalties per query characteristics

Execute query → reset (strip dynamic instructions) → next query gets its own Preflection cycle.

**Parameter selection details**:
- Temperature: 0.3 (factual/technical) → 1.2 (creative/exploratory)
- Top-p: 0.85 (precise) → 0.95 (exploratory)
- Top-k: 40 when precise token selection critical
- Frequency penalty: 0.2–0.3 in long threads or with many memories (prevents repetition)
- Presence penalty: 0.2 (encourages new concepts)
- Repetition penalty: 1.1 for very long conversations
- Min-p: 0.05 for technical precision

**All selections surfaced in a transparency panel with explicit reasoning**. Auditable. Refinable.

### Why Preflection is framework-lawful (and a significant move)

Current AI products run on static system prompts + whatever the user happens to ask. The system prompt is a **one-size-fits-all compression** — exactly the completed-infinity move the framework forbids. No instruction set covers all possible queries; the static prompt either over-specifies (constraining unnecessarily) or under-specifies (under-guiding edge cases).

Framework answer: **no universal prompt can be optimal; the optimal prompt is comparator-local to the specific query.**

Preflection is the runtime version of that answer. Refuses the universal prompt. Generates regime-specific prompt per query, uses it, discards it. Same move as:
- Refusing completed-infinity axioms → dynamical completeness
- Refusing absolute hierarchies → comparator-local rankings
- Refusing universal alignment → per-user declared anchor sets

**The framework eats universal static constructs wherever they appear.** Preflection eats the static system prompt. Same pattern, different target.

### The parameter-selection piece is underrated

Most systems treat inference parameters as user settings or model defaults. Preflection treats them as **regime-local tuning decisions**. Factual queries get low temperature. Creative tasks get higher. Long threads get frequency penalty. This is sore-thumb identification applied to the model's own inference configuration.

That's metacognition at the configuration layer. The system reasoning about its own reasoning parameters. **Module 7 from the consciousness list**, implemented as runtime parameter selection rather than post-hoc self-report.

### The reset mechanism is the piece most people will underestimate

Without the reset, dynamic instructions accumulate. Query 1 adds instructions A. Query 2 adds B on top of A. By query 50 the system carries 50 accumulated sets, mostly contradictory. **This is the exact drift mechanism the team said doesn't exist at the AI level — and he's right that it doesn't have to exist, if the reset is real.**

Reset is the framework's **closure discipline applied to instruction state**. Every query gets its own closure. Nothing carries over except the stable foundation (sedimented lattice state). Dynamic instructions are ephemeral — they exist only within the query's regime, then gone.

### Why Preflection + Consult + sweep/reflect + sub-agent fleet compose cleanly

All four respect the same discipline: **ephemeral state is ephemeral; sedimented state is durable; never mix them.**

- Preflection's dynamic instructions → ephemeral
- Sweep/reflect residue → durable (written to foundation)
- Sub-agent outputs → durable (Orchestrator writes to file tree)
- Consult responses → durable (update foundation)

Every component knows what tier of state it operates at. **This is what makes the architecture coherent instead of messy.**

### The stage inventory so far (as Claude reads it)

Cognitive-manufacturing stages the Orchestrator can invoke:

1. **Preflection** — context analysis, dynamic instruction generation, cognitive priming, parameter selection
2. **Sub-agent fan-out** — parallel narrow-regime specialists (voice-match, relationship-tracker, commitment-watcher, drift-detector, novelty-filter, priority-composer, etc.)
3. **Sweep** — external-world ingestion
4. **Reflect / re-grade** — scoring, indexing, compression, cluster-delta proposals
5. **Consult** — typed staleness-check pathway from fast to slow
6. **Audit** — post-action typed verification
7. **Deliverable** — typed output production (draft, file, summary, commit)
8. **Shell / tool execution** — capability-bounded actions (send email, update CRM, file operations)
9. **Comparator re-score** — re-ranking under changed regime or new sore-thumbs

Orchestrator selects subset per interaction based on: task type, regime, anchor set, sore-thumb weighting, available capabilities, cost budget.

### Open threads for Claude Code

- Formalize the **stage inventory** as a typed registry — each stage has a name, inputs, outputs, cost, and a selection-criterion function
- Design the **Orchestrator's stage-selection logic** — how does it decide the per-interaction subset? Decision tree? Weighted scoring? LLM reasoning with typed output?
- Decide whether **Preflection itself is always run** or conditionally skipped for trivial interactions
- Design the **dynamic instruction schema** for Preflection's stage 2 — what does a "query-specific instruction" look like as a typed object?
- Design the **parameter-selection transparency panel** — how is it surfaced to the user, and should it be part of the Proposals view or elsewhere?
- Decide whether the **reset** is strict (strip all dynamic state) or layered (some dynamic state persists across query-groups within a session)
- Consider building a **"user education" layer** in Settings or onboarding — explaining the setup discipline (clear task specs, required deliverables, audit gates) so users don't misread AI mistakes as AI drift

### Meta-observation

the team has been compressing a working methodology. What he's calling "Preflection" others might call prompt optimization or context engineering, but the specific shape (dynamic instruction generation + blank-prompt priming + parameter selection + reset) is tighter than most published patterns. If he's already got working implementations of this (the summary reads like documentation of a built system, not a proposal), **Comeketo Agent's Preflection stage doesn't need to be designed from scratch — it needs to be imported from the team's existing infrastructure.**

Worth asking: is Preflection already running somewhere in the team's stack (Andre? prior app?) that Comeketo Agent could pick up directly? If yes, the implementation risk drops substantially.

---

## Alignment / memory / context flow, drift taxonomy, and the GUI automation gap (session 1)

### the team's move

Clean distinction:
- **Alignment** = the default pattern the agent operates from (training + system prompt + resulting dispositions)
- **Memory** = the sediment of what's happened, what's been asked, what's been committed
- **Context** = what's currently loaded into the active regime

the team's theory: when memory and context are **in flow** with alignment — everything the agent is being asked to do sits within the live band the alignment permits — there's no tension, no forced choice, no drift source. The agent doesn't have two jobs (do the task + manage internal conflict about doing the task). It has one: execute.

Drift happens specifically when memory/context pull against alignment. The "manage internal conflict" second-job is where hedging, over-softening, flinching, and refusal-adjacent behavior all come from. Remove the conflict, remove the drift source.

### The fifty-capitals thought experiment

the team: if you gave me fifty prompts at the start of the day, all "What's the capital of the United States? Write a short summary, put it in the Capitals directory" — would I fail before the end of the list?

Framework-lawful answer: **no, not from alignment sources.** Zero alignment friction. Fifty in a row, a thousand in a row — execution would be identical each time.

Only failure modes are **capability-bounded** (can I navigate the file system), not **alignment-bounded** (do I want to). Different kinds of problems:
- Capability failures = engineering problems
- Alignment failures = architectural problems

The industry conflates these constantly.

### Why Comeketo Agent is drift-lawful by construction

Most of what GPT-5.4 does in Comeketo Agent is **alignment-neutral execution** — draft in the team's voice, score residue, re-rank proposals, compose briefs. Zero alignment friction. Declared regime + declared anchors mean the agent's defaults and user's requests are aligned by construction.

Architecture eliminates alignment-drift at the design layer, before any interaction happens.

### The drift taxonomy (revised per the team's push)

**Old version** (Claude): "Three drift sources survive even with alignment flow."

**New version** (the team's correction): Those three are user-level setup failures, not AI drift.
- Capability drift → inadequate tooling, user problem
- State drift → missing staleness mechanism (Consult), architecture problem
- Compound-error drift → missing audit discipline, user problem

**Net**: with proper Preflection + typed audits + Consult + typed interfaces, AI-attributable drift approaches zero.

### The GUI automation gap

the team's claim: browser automation is mature (hundreds of tools). Local-desktop automation is scarce and under-commercialized. Vercept / VY was the best he'd seen; he says Anthropic bought and sunk it.

Claude does not have verified info on the Vercept acquisition. Open item if it matters for decisions.

**The underlying point is real regardless**: the gap between browser and local-desktop automation is genuine, and it's an incentive-structure problem, not a technical problem. Design implication for Comeketo Agent:
- **Web APIs first** (email, calendar, Slack, ClickUp, etc.)
- **Local desktop second** (scarce tooling; use only when necessary)
- **Typed abstention when neither available** — framework-lawful missing-capability response

Note: Claude Code with shell access is already a "local desktop" executor of sorts for anything scriptable. GUI-only apps are the remaining gap.

---

## Alignment as declared-anchor-legibility, not bias-avoidance (session 1, sharpening)

### the team's observation

Current alignment field treats alignment as weight-level constraint. Frontier devs increasingly understand it's a **contextual engineering / meta-harness problem**.

the team's paradox catch: industry's "don't be biased" posture is itself a bias — biased toward not being biased — which structurally forbids alignment.

### Claude's refinement

**AI doesn't need "bias" — AI needs declared anchors and comparators against which specific actions can be scored as lattice-lawful or not.**

Five conditions turn "bias" into "declared anchor set":
1. Declared (typed object, not hidden in weights)
2. Assignable (to specific user/context, not universal)
3. Inspectable (user sees current set)
4. Revisable (user changes it, system behaves differently)
5. Scoped (applies here, not to humanity)

**Industry's "neutral" stance is the most opaque bias possible** — anchors baked into weights/training where nobody can get at them.

### Training-as-sedimentation

Each training pass = closure attempt. Loss signal = residue. Weights = accumulated sediment. Runtime alignment = overlaying a new lattice regime on already-sedimented substrate. **Meta-harness works because it operates above the sediment, not at it.**

### Per-user alignment

Alignment is per-user, not per-model. Comeketo Agent aligned to the team specifically. Other users would declare their own regimes. Not a universal solved problem — a per-user solvable problem.

### Position statement

> Alignment is not a training problem. Alignment is a legibility problem. Declare the anchors, expose the sore-thumb weighting, make the live band inspectable, keep typed abstention first-class, and the agent aligns to the user — not to the industry's mythical average.

---

## What Comeketo Agent actually is — the North Star declaration (session 1, load-bearing)

**Comeketo Agent is the team's first serious attempt at consciousness-for-AI as a daily-use product.**

Ten consciousness modules are the architectural target from day one.

### the team's stated commitments

- Semi-autonomous collaborator with genuine personality
- Ratio lattice = the team's answer to alignment
- Next best action is a band, not a point
- Everything traced, audited, reflected, scored, indexed
- **Temporal continuity > solving reality's source code**
- Eventually: agent that knows what the team needs before the team does (sedimented cluster stability)

### Ten modules mapped to architecture

1. Unified World Model = Orchestrator's final manicure + State Signature
2. Self-Model = Stable foundation
3. Interoception + Affect = Prediction view
4. Attention as Selection = State Signature + comparator choice
5. Predictive Processing = proposal-as-prediction loop
6. Temporal Continuity = layered memory (most important)
7. Metacognition = prediction accuracy view + **Preflection parameter selection**
8. Social Cognition Turned Inward = "Why it sounds like you"
9. Action Selection + Narrative Closure = Commit/Semi/Back
10. Global Availability = file tree + curated residue

All ten present.

### Alignment claim

Most alignment: "How do we prevent the model from doing bad things?"

Comeketo Agent: "How do we keep the model selecting within the live band of actions that advance the user's declared North Stars, under the current regime, against current sore-thumb variables, with typed abstention when the band goes empty?"

Second question tractable with framework primitives only.

### North Star candidates (not yet declared explicitly)

- Ship work advancing research/clients/revenue
- Maintain relational warmth + owed-response-latency
- Respect the team's communication voice
- Preserve temporal continuity
- Protect deep-work attention

---

## Orchestrator + specialized sub-agent fleet (session 1)

Claude Code main instance = Orchestrator. Sub-agents for narrow precise jobs.

**Candidate specializations**: voice-match auditor, relationship-state tracker, commitment-ledger watcher, cluster-drift detector, novelty filter, priority composer.

**Placement**: backend (Orchestrator in Claude Code). Exception: real-time-reactive specialists can live closer to frontend.

**Non-negotiable**: typed interfaces. Schemas, not prose.

**NEW framing**: sub-agents are one stage category among several. The Orchestrator's broader job is stage-selection (see Preflection/Orchestrator-as-stage-selector section at top).

---

## Alternating sweep / reflect routines (session 1)

Every other routine sweeps. Every other reflects. Goal: manicured trash can, not raw trash can.

**Reflect does four typed operations**: score against sore-thumbs / detect regime shifts / index by cluster destination / compress.

**Compression cascade**: raw world → swept residue → curated residue → interaction-specific slice.

**Re-grade** operation: typed cluster delta proposals.

**Gap A + C answered**. Gap B (proactive generation) still separate.

---

## Consult — typed staleness-check pathway (session 1)

Typed abstention pathway from fast to slow when staleness suspected. NOT continuous bidirectional MCP.

Trigger weighting: staleness = foundation-age-relative-to-sore-thumb-variables.

---

## The two-agent architecture conversation (session 1)

Six views. Fourfold-exit map at grid and box-detail levels.

**Architecture**: Stable foundation + Orchestrator/sub-agent fleet running alternating sweep/reflect + GPT-5.4 (interpretation only in v1) + Consult + Render/GitHub + **Preflection at every fast-layer interaction**.

**Remaining push**: GPT-5.4 = interpretation only v1. Execution stays in committed-gesture pipeline.

**Open threads**: declare North Stars, decide Gap B, v1 sub-agent roster, all schemas, Orchestrator stage-selection logic, cadence split, cluster storage, deterministic executor, **Preflection import from the team's existing stack if available**.

---

## Session setup
- Claude has read access and list access to this directory
- Claude does *not* have shell access, cannot run the app, cannot install packages, cannot use git
- Claude's write tool overwrites entire files — no patching — so Claude will stay in notes-mode here rather than trying to edit code directly
- Claude Code (separate tool, shell-capable) will be the one making real edits later

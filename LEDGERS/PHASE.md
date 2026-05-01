# Phase Ledger

Last updated: 2026-05-01 (later — **Phase B steward graduation arc COMPLETE**. PROB-2026-04-30-005 CLOSED by Cowork session via 4 graduation chains shipped end-to-end (temporal_continuity ATOM-0028→0031, open_problems 0032→0035, north_star 0040→0043, file_directory 0036→0039). Plus Atlas Box graduation via separate chain ATOM-0107→0110 (PROB-015 CLOSED). **7 stewards now runnable** (1 legacy + 6 unified Box: temporal_continuity, open_problems, file_directory, north_star, atoms, atlas). First `ground_truth_source` Box class introduced (Atlas — distinct from `ledger` class). Daily 8 AM ET cron at `CCAgentindex/triggers/atlas_daily_sweep.json`. Earlier per ATOM-0111: Box Network Architecture LOCKED via DEC-005; Phase 1 60%; 2 of 8 Phase B Open Questions resolved (Q2→DEC-007; Q3→DEC-006). Phase C runtime stays deferred per DEC-2026-04-29-013.)
Maintainer: Jake / Comeketo Agent project agents
Status: **active**
Tier (Box Bus Ledger §3): **global** — fans out to every Box that subscribes at the global tier
Read when: planning a sprint, deciding whether work is in-phase or out-of-phase, considering whether the project is ready to advance, or onboarding to the project's overall arc.
Core rule: **Know what phase you're in before proposing structural change.**
Steward agent: not yet authored. Phase B work — when written it lands at `/Subagent Boxes/phase_subagent_package/`.

> The project moves in phases. Each phase has a name, a purpose, an exit criterion, and a do-not-leak rule.
>
> Phase A: build all the ledgers. Phase B: build all the sub-agents. Phase C: build the Subagent Boxes + the Reactive Box Network runtime.
>
> If you're proposing work that doesn't fit the current phase, the phasing rule is your first stop — not last.

---

## 1. Purpose

This ledger names **what phase the project is in right now**, what triggered the phase boundary, what completion looks like, and what's explicitly out-of-phase until the next boundary opens.

Phase boundaries are **architectural commitments** — they protect against half-finished systems. Per `DEC-2026-04-29-002` (Three-Phase Build Discipline), Phase A → B → C is the binding order. Skipping ahead produces partial systems that confuse future agents.

This ledger is paired with — and explicitly distinct from — three siblings:

| Ledger | Owns |
|---|---|
| **Phase Ledger** (this file) | Current phase + exit criteria + do-not-leak rule |
| **Decisions Ledger** | The Decision that named the phase (`DEC-2026-04-29-002`) |
| **Definition of Done** §11 | Phase Ledger row in the Update Matrix |
| **Temporal Continuity** | Where the project is *in time* (sprint-level); this ledger is *in arc* (phase-level) |

### Owns

- the **current phase** (what we're in right now)
- the **phase definitions** (Phase A / Phase B / Phase C with purpose and scope)
- the **exit criteria** for each phase
- the **do-not-leak rules** (what's out-of-phase and why)
- the **phase history** (when each phase started + ended)
- pointers into Decisions for the binding architectural commitments
- the **next-phase preview** (what unlocks when the current phase exits)

### Does not own

- sprint-level work — `TEMPORAL_CONTINUITY.md`
- per-task progress — task lists in active sessions
- per-ledger build status — `LEDGERS/INDEX.md`
- per-Box state — per-Box ledgers
- the architectural commitments themselves — `DECISIONS_LEDGER.md`

---

## 2. Phase Map

Three phases, one direction. Per `DEC-2026-04-29-002`.

```
Phase A — Ledgers      [CURRENT — wrapping]
   ↓
Phase B — Sub-agents   [next]
   ↓
Phase C — Subagent Boxes + Reactive Box Network runtime   [final]
```

No skipping. No parallelizing without explicit approval (`COMM-2026-04-29-003`).

---

## 3. Phase A — Ledgers (CURRENT)

### Purpose

Author the project's full memory spine. Every architectural pattern that future work depends on must be named, written down, and cross-referenced before sub-agents can be built (Phase B) or runtime can be wired (Phase C).

### Status

**Wrapping.** As of 2026-04-29, 15 project-level ledgers + 5 of 14 Page Ledgers + Phase Ledger (this file) authored. Architectural lock at `DEC-2026-04-29-013` holds.

### Exit Criteria

Phase A exits when **all** of the following are true:

- [x] Global Ledger active
- [x] Temporal Continuity Ledger active
- [x] North Star Ledger active
- [x] File Directory Ledger active
- [x] Open Problems Ledger active
- [x] Communications Ledger active
- [x] Decisions Ledger active
- [x] Box Ledger active (concept)
- [x] Box Bus Ledger active (wire shape — schema only; runtime deferred to Phase C)
- [x] Definition of Done Ledger active
- [x] Source-of-Truth Ledger active
- [x] Connections Ledger active
- [x] File Contents Ledger active
- [x] Asset / Widget Map active
- [x] Settings Ledger active
- [x] **Phase Ledger** active ← **this file is the closer**
- [x] At least the high-risk Page Ledgers authored (`boxes`, `intake`, `automation`, `delegations`, `settings` page)
- [x] All envelope-aware (declares tier; cross-references `BOX_BUS_LEDGER §2.1`)
- [x] Every active ledger has `INDEX.md` + `GLOBAL_LEDGER.md §8` registration

**Deferred / explicitly out-of-Phase-A:** the remaining 9 lower-risk Page Ledgers (`grid`, `leads`, `clients`, `coworkers`, `contacts`, `venues`, `briefing`, `activity`, `analytics`), Widget Ledgers, Prompt/Reconstruction Ledger, Scout Ledger, per-directory Box.md stamps. These can be authored as Phase B or Phase C work, when a real need surfaces. **Their absence does not block Phase A exit.**

### Do-Not-Leak Rule

While in Phase A:

- **No runtime work.** No router, no propagation ledger, no T1/T2/T3 interpreters, no validation enforcement, no cycle enforcement (per `DEC-2026-04-29-013`).
- **No sub-agent graduations.** The 5 draft packages at `/Subagent Boxes/` stay as drafts.
- **No new Box class authoring beyond what's needed for ledger work.** New Box stamps are deferred to Phase B/C.
- **No reactive-box-bus implementation.** Schema is canonical; runtime is held.

### Why these constraints

The phasing rule is the protection against half-finished architecture (per `DEC-2026-04-29-008` rationale). Building the bus before there are interpreters is wiring without engines. Stamping new Box classes before the Box Ledger and Box Bus Ledger stabilized would create a moving target. Phase A's job was to make every future phase have a stable target to aim at.

### Phase A History

- **2026-04-28** — Phase A started (Phases 1–5: Global, Temporal Continuity, North Star, File Directory, Open Problems).
- **2026-04-29** — Phase A wrapping (Phases 6–21 in rapid succession: Communications, Decisions, Box Ledger, DoD, Box Bus, Source-of-Truth, Connections, File Contents, Asset/Widget Map, Settings, 5 Page Ledgers, Phase Ledger).

---

## 4. Phase B — Sub-agents (NEXT — IN PROGRESS as of 2026-04-29)

### Purpose

Graduate the 5 draft sub-agent packages at `/Subagent Boxes/` AND author missing-ledger stewards into the **unified Box pattern** at `LEDGERS/BOXES/<name>/` per `DEC-2026-04-29-015`. Each ledger ends up with one Box folder containing manifest + per-Box orientation + steward configs + receipts dir — co-located with the steward that governs the ledger.

### Target Structure (per `DEC-2026-04-29-015`)

```
LEDGERS/BOXES/<name>/
  box.json                         # manifest per BOX_BUS §2.1
  BOX.md                           # per-Box orientation per BOX_LEDGER
  steward/
    AGENTS.md                      # full operating instructions
    config.json                    # machine-readable config
    prompt.md                      # runnable agent prompt
  receipts/                        # steward run outputs (one JSON per run)
```

**Ledger files (`LEDGERS/<NAME>.md` + `.json`) stay where they are.** The Box governs them via `box.json.owns[]` path reference. Moving them would break the Read-First protocol — explicit `do_not_undo_casually` per DEC-015.

### Scope

- ✅ **First Box landed**: `LEDGERS/BOXES/temporal_continuity/` (2026-04-29 — Phase B step 1)
- **Reorganize existing**: `LEDGERS/AGENTS/global_ledger_steward/` → `LEDGERS/BOXES/global_ledger/steward/` (+ author `box.json` + `BOX.md`)
- **Graduate remaining 3 drafts** from `/Subagent Boxes/`: file_directory, north_star, open_problems
- **Author Boxes for ledgers without drafts**: communications, decisions, box, box_bus, dod, sot, connections, file_contents, asset_widget_map, settings, phase, plus per-Page-Ledger stewards as needed
- **Wire runnable form** for each steward — decide per Box whether `CCAgentindex/agents/<name>/` stays as the dispatch path or consolidates into reading the steward directly from `LEDGERS/BOXES/<name>/steward/`. Either is fine for Phase B; pick the one with less server.py change.
- Each runnable steward exposes `POST /api/agents/<name>/run` with `audit_only` (default) and `local_write` modes
- Each writes receipts to its Box's `receipts/` directory

### Exit Criteria

Phase B exits when **all** of the following are true:

- All 15 project-level ledger stewards are runnable (canonical configs at `LEDGERS/AGENTS/<name>/`, runnable forms at `CCAgentindex/agents/<name>/`)
- Each high-risk Page Ledger has a steward (boxes, intake, automation, delegations, settings)
- Each runnable steward has executed at least one successful run with receipts
- The `/Subagent Boxes/` draft directory is empty (or its remaining contents are explicit no-ops)
- Activity log shows steward run events for ≥ 5 distinct stewards over a 7-day window

### Do-Not-Leak Rule

While in Phase B:

- **No Box Bus runtime.** Stewards run as standalone app agents; the bus is still deferred.
- **No new top-level ledgers** unless an open problem can't be resolved otherwise. Phase A is supposed to have covered the field.

---

## 5. Phase C — Subagent Boxes + Reactive Box Network Runtime (FINAL)

### Purpose

The architectural payoff. Each Box (Client / Staff / Page / Analytics-Snapshot / etc.) gets a `box.json` manifest. The router runs. T1/T2/T3 interpreters dispatch. Propagation ledger records every routed entry. The triad becomes operational.

### Scope

- Author manifests for every existing Box (28 Client + 10 Staff + orchestrator + inbox-skill + ledger directory + app-ui root)
- Build the router daemon (or post-write hook on `*.jsonl` and ledger writes)
- Build the propagation ledger at `CCAgentindex/_ledger/propagation.jsonl`
- Wire T1 interpreters (deterministic schema-mapper) — ~80% of routing
- Wire T2 interpreters (small-LLM template-summarizer) — ~15% of routing
- Wire T3 interpreters (full sub-agent dispatch) — ~5% of routing
- Validation enforcement on emit
- Cycle enforcement at the router

### Exit Criteria

- Every active Box has a manifest registered with the router
- Validation passes 100% of emits in a 24-hour window
- T1 mapper handles a documented set of cross-ledger fan-outs without LLM cost
- Cycle enforcement has caught at least one would-be cycle (proves the check works)
- Propagation ledger has 24+ hours of clean entries

### Do-Not-Leak Rule

Phase C is the final phase in the current arc. The next arc (whatever it is) starts with a fresh phasing decision when it arrives.

---

## 6. Current Snapshot (2026-04-29)

| Field | Value |
|---|---|
| Current phase | **Phase B — Sub-agents (IN PROGRESS as of 2026-04-29)** |
| Phase A | **complete** per `DEC-2026-04-29-014` |
| Phase B started | 2026-04-29 |
| Phase B step 1 | ✅ First unified Box landed: `LEDGERS/BOXES/temporal_continuity/` per `DEC-2026-04-29-015` |
| Architectural locks | `DEC-2026-04-29-002` (three-phase build) + `DEC-2026-04-29-013` (Reactive Box Network runtime deferred to Phase C) + `DEC-2026-04-29-015` (Unified Ledger Box pattern) |
| Page Ledgers authored | 5 of 14 (`boxes`, `intake`, `automation`, `delegations`, `settings`) — high-risk wave complete |
| Ledger Boxes built | 1 of 16+ (`temporal_continuity`) |
| Other deferred ledgers | 9 lower-risk Page Ledgers, Widget Ledgers, Prompt/Reconstruction Ledger, Scout Ledger, per-directory Box.md stamps |

---

## 7. Phase Transition Protocol

When the current phase's exit criteria are all met:

1. **Update this ledger** — flip current phase status to `complete`; advance current phase to the next one; bump `Last updated`.
2. **Add a Decisions Ledger entry** declaring the phase complete (e.g., `DEC-YYYY-MM-DD-XXX — Phase A Complete`). This is a load-bearing decision because it unlocks Phase B work.
3. **Update Temporal Continuity** §1 (Current Snapshot) and §3 (Recent Meaningful Changes).
4. **Update Global Ledger** §6 (Active Workstreams) and §12 (Recently Changed).
5. **Append to activity ledger** with `kind: phase_transition`.
6. **Re-read the do-not-leak rule** for the new phase before proposing any new structural work.

---

## 8. Anti-Patterns (Things That Look Like Phase Work But Aren't)

- **"This sub-agent will be quick to graduate, let me just do it now during Phase A."** No — graduating sub-agents is Phase B. The phasing rule protects against half-finished work; one quick exception is how phases drift.
- **"The runtime is just one router daemon, let me prototype it during Phase A."** No — Phase C runtime is held until Phases A + B are stable. Prototype-as-spec is fine (that's `BOX_BUS_LEDGER.md`); prototype-as-code is not.
- **"This Page Ledger pattern is so easy, let me batch all 14 in one session."** No — Page Ledgers earn their keep one at a time. Per `_README.md` anti-pattern: better one well-grounded record than 14 thin stubs. The 9 lower-risk Page Ledgers are explicitly deferred.
- **"This Box clearly needs a manifest, let me stamp it now."** No — Box manifest authoring is Phase C+1 backfill. Until Phase C runtime exists, manifest stubs are aspirational.

---

## 9. Phase-Aware Done Gate

Per `DoD §11` Update Matrix: phase / milestone state changes update **this ledger**. Beyond that:

When proposing work, ask:
1. **What phase is the project in right now?** (Read this ledger §6.)
2. **Is the proposed work in-phase or out-of-phase?**
3. **If out-of-phase**, can it be reframed to in-phase scope, deferred until the right phase opens, or recorded as an Open Problem for later?

---

## 10. Update Rules

Update this ledger when:

- A phase transition is imminent (criteria all met) or has happened
- Exit criteria for the current phase need refinement
- A do-not-leak rule needs updating because of an explicit Decisions Ledger change
- A new phase is added (rare — would require an architectural Decision)

When updating: bump `Last updated`, add to phase history, refresh §6 (Current Snapshot), update related Decisions / TCL / Global Ledger.

---

## 11. North Star Alignment

This ledger directly supports:

- **NS-09 Agent Handoff Continuity** — a new agent can read this and know what work is in-bounds vs out-of-bounds for the current phase.
- **NS-10 Defense As First-Class Build Activity** — phasing is defense against half-finished architecture.
- **NS-07 Cleanup Discipline** — phasing keeps cleanup from drifting into greenfield rework.

Indirect: NS-01 (durable memory of project arc), NS-02 (legibility of the build path).

---

## 12. Final Operating Rule

> The project moves in phases.
>
> **Phase A — Ledgers — is wrapping** with this ledger's landing.
>
> Phase B — Sub-agents — opens next.
>
> Phase C — Subagent Boxes + Reactive Box Network runtime — is the architectural payoff.
>
> Know the phase. Respect the phase. Don't leak the phase.

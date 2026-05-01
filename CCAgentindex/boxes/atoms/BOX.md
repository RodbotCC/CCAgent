# Atom Ledger Box (Atomizer Steward)

Last updated: 2026-05-01 (Bucket F cleanup — added missing Box metadata stamp)

> The Box that governs `LEDGERS/ATOMS.md` and houses the Atomizer Steward sub-agent.
>
> Per `DEC-2026-04-29-015` (unified ledger Box pattern), the ledger files themselves stay at `LEDGERS/ATOMS.md` + `LEDGERS/ATOMS.json`. This Box governs them by path reference — it does not relocate them. Read-First protocol for every CLAUDE.md and cross-ledger link still works.

## 1. Purpose

This Box is the operational home for the Atom Ledger:

- the **canonical pointer** to the ledger files (`box.json` `owns[]` array).
- the **Atomizer Steward** sub-agent — at `steward/` — who reads new PROBs, proposes atoms, sweeps stale claims, surfaces PROB-closure-eligible candidates.
- the **Box-local audit trail** — at `receipts/` — for every steward run.

The Atom Ledger doctrine itself lives in [`../../ATOMS.md`](../../ATOMS.md). This file documents how the **Box** participates in the Reactive Box Network architecture once Phase C runtime ships.

## 2. Owns

See [`box.json`](box.json) `owns[]`. Summary:

- `LEDGERS/ATOMS.md` (the doctrine)
- `LEDGERS/ATOMS.json` (canonical race-resolution surface)
- `LEDGERS/BOXES/atoms/box.json` (this Box's manifest)
- `LEDGERS/BOXES/atoms/BOX.md` (this file)
- `LEDGERS/BOXES/atoms/steward/AGENTS.md` (Atomizer Steward declarative scope)
- `LEDGERS/BOXES/atoms/steward/config.json` (steward operating config)
- `LEDGERS/BOXES/atoms/steward/prompt.md` (steward dispatch prompt)
- `LEDGERS/BOXES/atoms/receipts/` (per-run receipts)
- `LEDGERS/DRAFTS/ATOMIZATION/` (proposed-atom review queue — created on first use)

## 3. Doesn't Own

- per-PROB atomization decisions (those live in `OPEN_PROBLEMS_LEDGER.md` cross-link)
- the **state of brokenness** itself (Open Problems)
- decisions made during atom work (those land in Decisions)
- handoff notes for blocked/abandoned atoms (those land in Communications)
- atom retirements (those land in Deprecation)
- session-scoped task lists (those are not durable)

## 4. Local Source-of-Truth Rules

For race resolution between MD and JSON state, **`ATOMS.json` wins.** This is the only ledger in the project where the JSON mirror is canonical for a specific contract (claim atomicity). The MD section reflects state for human readers; if the two disagree on an atom's `status`, JSON resolves.

This rule exists because parallel agents may write the MD and JSON in slightly different orders, and the project needs a single canonical reference for "is this atom available right now?" The MD can be re-rendered from JSON if drift becomes a problem (Phase C runtime concern).

## 5. Local Done Gate

A change to atoms passes through the standard Definition of Done §6 Ledger Update Matrix plus these locally-stricter checks:

1. **Both MD and JSON updated** — never one without the other. Any commit touching `ATOMS.md` must touch `ATOMS.json` (and vice versa).
2. **Activity ledger entry** — every claim/completion/release/abandonment writes a corresponding `_ledger/activity.jsonl` line.
3. **Cross-link from parent PROB** — when authoring atoms, the parent PROB's `**Atomized:**` line must list the new atom IDs.
4. **Status transition matches lifecycle** — only legal transitions per `ATOMS.md` §3.
5. **Acceptance criteria honored at completion** — `verification` field must reference concrete artifacts (file path, commit, ledger row).

## 6. Local Agent Protocol

Any agent (Cowork, Claude Code subprocess, Codex, future runnable steward) operating on this Box must:

1. Read [`../../ATOMS.md`](../../ATOMS.md) in full before writing.
2. For claim/complete operations: update **both** `ATOMS.md` and `ATOMS.json` in one unit of work; first write wins.
3. For atomization operations: drop proposed atoms in `LEDGERS/DRAFTS/ATOMIZATION/<prob-id>_atoms.md` first; promote to live queue only after review.
4. For stale-claim release: append a note to the released atom's `notes` field explaining the sweep; the original claimant lost their slot.
5. Append `_ledger/activity.jsonl` for every state change.
6. Append a per-run receipt at `receipts/YYYY-MM-DD_HHMM_<run-kind>.json` if the work was a bulk operation (atomization pass, stale-claim sweep, closure surface).

## 7. Atomizer Steward — Modes

The steward (when runnable in Phase B) operates in five modes — selectable via dispatch payload:

- **`audit_only`** — read the queue and report state without writing. Default for first-time invocation.
- **`propose_atoms`** — read new/updated PROBs, propose atoms to `DRAFTS/ATOMIZATION/<prob-id>_atoms.md`. Never writes to `ATOMS.md` directly.
- **`sweep_stale`** — find atoms `claimed > 24h` with no `in_progress_at`. Optionally release them.
- **`surface_closures`** — find PROBs whose atoms have all completed; surface for human/steward closure review.
- **`release_stale_claims`** — like `sweep_stale` but also performs the release writes (with notes).

## 8. When To Invoke The Steward

- **A new PROB lands** → `propose_atoms` mode (review queue gets candidates for human approval).
- **A queue feels stalled** → `sweep_stale` mode (find lost claims).
- **Before closing a Phase milestone** → `surface_closures` (find PROBs that may have quietly satisfied close-criteria).
- **As part of a daily/weekly Box hygiene pass** → `audit_only` (just look; report).

## 9. Receipts

Per-run receipts land in `receipts/` with naming pattern:

```
receipts/<YYYY-MM-DD>_<HHMM>_<run-kind>.json
```

Run kinds: `atomization_pass`, `stale_sweep`, `closure_surface`, `audit`, `release_pass`.

Each receipt documents: dispatch parameters, parent PROBs touched, atoms proposed/released/surfaced, any anomalies (atoms over the 4h granularity rule, PROBs with no clear close-criteria, etc.).

## 10. Phase Status

- **Phase A:** complete. `LEDGERS/ATOMS.md` + `.json` shipped 2026-04-30; PROB-2026-04-28-016 atomized into 26 atoms as the proof.
- **Phase B:** in progress. This Box stamps the unified pattern; steward sub-agent files exist but are not yet runnable. PROB-2026-04-30-005 also decomposed in this same session for queue depth.
- **Phase C:** deferred per `DEC-2026-04-29-013`. `subscribes[]` and `emits[]` declared but not consumed by router. `/api/atoms/{list,claim,complete,release}` endpoints land here. UI Atoms panel near `automation` route.

## 11. Related Ledgers

- [`../../ATOMS.md`](../../ATOMS.md) + [`.json`](../../ATOMS.json) — the doctrine.
- [`../../OPEN_PROBLEMS_LEDGER.md`](../../OPEN_PROBLEMS_LEDGER.md) — parent of every atom.
- [`../../DECISIONS_LEDGER.md`](../../DECISIONS_LEDGER.md) — `DEC-2026-04-30-003` (architectural lock), `DEC-2026-04-29-015` (unified Box pattern), `DEC-2026-04-29-013` (Phase C deferral).
- [`../../COMMUNICATIONS_LEDGER.md`](../../COMMUNICATIONS_LEDGER.md) — handoff notes for blocked / abandoned atoms; lessons from re-decomposition patterns.
- [`../../DEPRECATION.md`](../../DEPRECATION.md) — atoms that retire when a PROB closes by other means.
- [`../../DEFINITION_OF_DONE.md`](../../DEFINITION_OF_DONE.md) — work-type gates atoms inherit.
- [`../../BOX_LEDGER.md`](../../BOX_LEDGER.md) — Box concept.
- [`../../BOX_BUS_LEDGER.md`](../../BOX_BUS_LEDGER.md) — manifest schema, envelope, tier model. Atoms become first-class envelope citizens in Phase C.
- [`../../PHASE.md`](../../PHASE.md) — current phase, exit criteria.
- [`../temporal_continuity/BOX.md`](../temporal_continuity/BOX.md) — sibling unified Box; same pattern.

## 12. Final Operating Rule

> **The Box governs the ledger by path reference, not by relocation.** `ATOMS.md` and `ATOMS.json` stay at `LEDGERS/`. This Box owns them via `box.json` `owns[]`. Every CLAUDE.md, every cross-ledger link, every Read-First protocol step keeps working unchanged.
>
> The steward at `steward/` is the operator. The receipts at `receipts/` are the audit trail. The doctrine at [`../../ATOMS.md`](../../ATOMS.md) is the contract.

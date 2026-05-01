# BOX — Temporal Continuity Ledger Box

Last updated: 2026-04-29 (initial creation — first unified ledger Box; Phase B proof of pattern)
Box class: `ledger`
Box id: `ledger_box:temporal_continuity`
Slug: `temporal_continuity`
Tier (Box Bus Ledger §3): `global`
Status: `active`
Pattern decision: [`DEC-2026-04-29-015`](../../DECISIONS_LEDGER.md) — Unified Ledger Box layout

> **This is the first unified ledger Box.** It graduates the draft sub-agent package from `/Subagent Boxes/temporal_continuity_subagent_package/` into the structure named in `BOX_BUS_LEDGER.md` §2.1 and stamped per `BOX_LEDGER.md`.
>
> Ledger + Steward + Manifest in one folder. Ledger files stay where they are; this Box governs them via path reference.

---

## 1. What This Box Is

A **Ledger Box** for the Temporal Continuity Ledger.

It is one of 16+ Boxes that will exist in `LEDGERS/BOXES/<name>/` — one per project-level ledger — each containing the manifest + per-Box orientation + steward configuration + run receipts that govern its corresponding ledger files.

This Box does **not** contain the ledger files themselves. They stay where they are at:

- `LEDGERS/TEMPORAL_CONTINUITY.md` (canonical narrative)
- `LEDGERS/TEMPORAL_CONTINUITY.json` (structured mirror)

The Box governs them by path reference (`box.json.owns[]`).

**Why this split:** moving the ledger files would break the Read-First protocol — every `CLAUDE.md`, every cross-ledger link, every agent's bootstrap references the existing paths. The Box pattern adds a control + steward + manifest layer **without disturbing** the ledger files themselves.

---

## 2. What This Box Owns

Per `box.json.owns[]`:

- `LEDGERS/TEMPORAL_CONTINUITY.md` — the ledger (canonical, governed by this Box)
- `LEDGERS/TEMPORAL_CONTINUITY.json` — the structured mirror
- `LEDGERS/BOXES/temporal_continuity/box.json` — the manifest (this Box's wire-shape declaration per `BOX_BUS_LEDGER.md` §2.1)
- `LEDGERS/BOXES/temporal_continuity/BOX.md` — this file (per-Box orientation)
- `LEDGERS/BOXES/temporal_continuity/steward/AGENTS.md` — full operating instructions for the steward sub-agent
- `LEDGERS/BOXES/temporal_continuity/steward/config.json` — machine-readable steward config
- `LEDGERS/BOXES/temporal_continuity/steward/prompt.md` — runnable agent prompt (draft — not yet wired)
- `LEDGERS/BOXES/temporal_continuity/receipts/` — steward run receipts (one JSON per run)

---

## 3. What This Box Does Not Own

- Other ledgers' content → their respective Boxes
- Other ledgers' stewards → their respective Boxes
- Architectural decisions about the unified Box pattern itself → `DECISIONS_LEDGER.md` (DEC-2026-04-29-015)
- The runtime that consumes manifests → deferred to Phase C per `DEC-2026-04-29-013`

---

## 4. Local Source-of-Truth Rules

Per `SOURCE_OF_TRUTH.md` and the pairing of Global Ledger / Temporal Continuity Ledger:

- **Permanent project identity / rules** → `LEDGERS/GLOBAL_LEDGER.md` wins.
- **Current working state / handoff** → `LEDGERS/TEMPORAL_CONTINUITY.md` wins.
- **Generated views of state** (e.g., `today.html`, `master_ledger.csv`) are NEVER canonical against this ledger's narrative.
- **Markdown vs JSON conflict:** prefer the newest verified source; reconcile both when editing.

---

## 5. Local Done Gate (stricter than DoD §5.6 for this Box)

A meaningful Temporal Continuity update is done when:

- [ ] All DoD §5.6 (Ledger Creation / Edit Work) checks pass
- [ ] `Last updated` line in `TEMPORAL_CONTINUITY.md` bumped
- [ ] §1 Current Snapshot reflects the change if material
- [ ] §3 Recent Meaningful Changes appended (not rewritten)
- [ ] §10 Next Agent Handoff reflects what comes next
- [ ] §11 Session Log line appended
- [ ] JSON mirror reconciled with the markdown
- [ ] If risk posture shifted: §6 Current Risks updated
- [ ] If git posture shifted: §13 (when present) Current Git Posture updated
- [ ] One line appended to `_ledger/activity.jsonl` if the change was non-trivial
- [ ] If the steward ran in `local_write` mode: receipt written under `LEDGERS/BOXES/temporal_continuity/receipts/`

---

## 6. Local Agent Protocol

Per `BOX_LEDGER.md` Local Agent Protocol (Read → Locate truth → Check rules → Edit narrowly → Verify → Record → Handoff):

1. **Read** — `GLOBAL_LEDGER.md`, `TEMPORAL_CONTINUITY.md` + `.json`, this `BOX.md`, `steward/AGENTS.md` if invoking the steward, `_ledger/activity.jsonl` for context.
2. **Locate truth** — TCL is current-state truth; Global Ledger wins on permanent identity/rules.
3. **Check rules** — see §5 Local Done Gate above + AGENTS.md §11 Update Rules.
4. **Edit narrowly** — append to §3 Recent Meaningful Changes; update §1 only when material.
5. **Verify** — JSON mirror still parses; sections still ordered per AGENTS.md §9.
6. **Record** — activity log line + receipt (if steward ran in local_write).
7. **Handoff** — §10 Next Agent Handoff updated when next-actor context shifts.

---

## 7. Steward Modes

The steward at `steward/` runs in one of two modes per dispatch:

- **`audit_only` (default)** — produces an Update Recommendation block per AGENTS.md §18.2; writes receipt only.
- **`local_write`** — applies proposed edits to `TEMPORAL_CONTINUITY.md` + `.json`; writes receipt; appends activity entry.

Audit-only is the safe default. Local-write requires explicit dispatch.

---

## 8. When To Invoke The Steward

Per AGENTS.md §2 — invoke when:

- A meaningful work session ends
- Current project state changes
- Active workstreams change
- A major near-term risk becomes active, mitigated, or resolved
- The user gives a durable preference or instruction
- A new carry-forward assumption appears
- A Box / page / directory / system is touched in a way future agents should know
- A task is left unfinished
- Git posture changes (dirty tree, branch change, push status, direct GitHub edits, local drift risk)
- A new "waiting" state appears
- A plan's freshness changes
- Another agent needs a "wake up and continue" block

Do **not** invoke for tiny edits with no continuity impact.

---

## 9. Receipts

Each steward run writes one receipt to `receipts/<YYYY-MM-DD_HH-MM-SS>_run_<request_id>.json`. Format defined in `steward/prompt.md` "Receipt Format" section.

Receipts are append-only — never edit a past receipt. If a run was wrong, write a new receipt that supersedes the prior one (with a `supersedes` field).

---

## 10. Phase Status

- **Phase A** — TCL.md + .json shipped 2026-04-28. Complete.
- **Phase B (current)** — this Box (the first unified Box) is the proof of pattern. Steward `prompt.md` drafted but not yet wired into a runnable form at `CCAgentindex/agents/temporal_continuity_steward/`. That wiring is the next Phase B step.
- **Phase C** — manifest `subscribes` + `emits` are documented but not consumed by the router (deferred per `DEC-2026-04-29-013`). When Phase C runtime lands, this Box plugs in without rework.

---

## 11. Related Files / Ledgers

- **Box concept** — `LEDGERS/BOX_LEDGER.md`
- **Manifest schema** — `LEDGERS/BOX_BUS_LEDGER.md` §2.1
- **Pattern decision** — `LEDGERS/DECISIONS_LEDGER.md` (DEC-2026-04-29-015)
- **The ledger this Box governs** — `LEDGERS/TEMPORAL_CONTINUITY.md` + `.json`
- **Phase boundary** — `LEDGERS/PHASE.md` §4 (Phase B: Sub-agents)
- **Existing canonical-config precedent** — `LEDGERS/AGENTS/global_ledger_steward/` (will reorganize into `LEDGERS/BOXES/global_ledger/steward/` next)
- **Original draft** — `Subagent Boxes/temporal_continuity_subagent_package/` (preserved as reference; the live config is here under `steward/`)

---

## 12. Final Operating Rule

> The project should not wake up confused.
>
> Every meaningful session should leave the next session with a clearer current state.
>
> If the project changed in time, the steward records the change in time — and writes a receipt to prove it.

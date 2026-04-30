# BOX — Global Ledger Box

Last updated: 2026-04-30 (initial creation — ATOM-2026-04-30-0044 migration of `global_ledger_steward` from `CCAgentindex/agents/` to the unified Box pattern)
Box class: `ledger`
Box id: `ledger_box:global_ledger`
Slug: `global_ledger`
Tier (Box Bus Ledger §3): `global`
Status: `active`
Pattern decision: [`DEC-2026-04-29-015`](../../DECISIONS_LEDGER.md) — Unified Ledger Box layout
Canonical-path decision: [`DEC-2026-04-30-004`](../../DECISIONS_LEDGER.md) — `LEDGERS/BOXES/<name>/steward/`
Migration atom: [`ATOM-2026-04-30-0044`](../../ATOMS.md)

> **The Global Ledger Box governs the project's top-level memory spine.** It graduates the original runnable steward from `CCAgentindex/agents/global_ledger_steward/` (live since 2026-04-28) into the unified Box pattern set by `DEC-2026-04-30-004`, alongside the temporal_continuity and atoms unified Boxes.
>
> Ledger + Steward + Manifest in one folder. Ledger files stay where they are; this Box governs them via path reference.

---

## 1. What This Box Is

A **Ledger Box** for the Global Ledger.

It is one of 16+ Boxes that will exist in `LEDGERS/BOXES/<name>/` — one per project-level ledger — each containing the manifest + per-Box orientation + steward configuration + run receipts that govern its corresponding ledger files.

This Box does **not** contain the ledger files themselves. They stay where they are at:

- `LEDGERS/GLOBAL_LEDGER.md` (canonical narrative)
- `LEDGERS/GLOBAL_LEDGER.json` (structured mirror)

The Box governs them by path reference (`box.json.owns[]`).

**Why this split:** the Global Ledger is the most-read file in the project. Every cold-starting agent reads it as the second-or-third file (after `CLAUDE.md`). Moving it would break the Read-First protocol — every `CLAUDE.md`, every cross-ledger link, every agent's bootstrap references the existing path. The Box pattern adds a control + steward + manifest layer **without disturbing** the ledger files themselves.

---

## 2. What This Box Owns

Per `box.json.owns[]`:

- `LEDGERS/GLOBAL_LEDGER.md` — the ledger (canonical, governed by this Box)
- `LEDGERS/GLOBAL_LEDGER.json` — the structured mirror
- `LEDGERS/BOXES/global_ledger/box.json` — the manifest (this Box's wire-shape declaration per `BOX_BUS_LEDGER.md` §2.1)
- `LEDGERS/BOXES/global_ledger/BOX.md` — this file (per-Box orientation)
- `LEDGERS/BOXES/global_ledger/steward/AGENTS.md` — full operating instructions for the steward sub-agent
- `LEDGERS/BOXES/global_ledger/steward/config.json` — machine-readable steward config
- `LEDGERS/BOXES/global_ledger/steward/prompt.md` — runnable agent prompt (live dispatch path during migration window)
- `LEDGERS/BOXES/global_ledger/receipts/` — steward run receipts (one JSON per run; future home, current receipts continue to land at `CCAgentindex/_ledger/ledger_steward_runs/` per legacy prompt — see §13)

---

## 3. What This Box Does Not Own

- Other ledgers' content → their respective Boxes
- Other ledgers' stewards → their respective Boxes
- Architectural decisions about the unified Box pattern itself → `DECISIONS_LEDGER.md` (DEC-2026-04-29-015, DEC-2026-04-30-004)
- The runtime that consumes manifests → deferred to Phase C per `DEC-2026-04-29-013`
- Detailed page implementation, per-widget behavior, per-route data binding — those belong in `page_asset_sitemap.md` and the Page Ledgers
- Per-client truth — those belong in `Auto/Client Boxes/<Name>/`

---

## 4. Local Source-of-Truth Rules

Per `SOURCE_OF_TRUTH.md` and the pairing of Global Ledger with the rest of the project memory:

- **Permanent project identity / rules** → `LEDGERS/GLOBAL_LEDGER.md` wins.
- **Current working state / handoff** → `LEDGERS/TEMPORAL_CONTINUITY.md` wins.
- **Settled architectural choices** → `LEDGERS/DECISIONS_LEDGER.md` wins.
- **Generated views of state** (e.g., `today.html`, `master_ledger.csv`) are NEVER canonical against this ledger's narrative.
- **Markdown vs JSON conflict:** prefer the newest verified source; reconcile both when editing.
- **Global vs Local:** Global only when global. Prefer local ledgers for local truth.

---

## 5. Local Done Gate (stricter than DoD §5.6 for this Box)

A meaningful Global Ledger update is done when:

- [ ] All DoD §5.6 (Ledger Creation / Edit Work) checks pass
- [ ] `Last updated` line in `GLOBAL_LEDGER.md` bumped
- [ ] Header phase note reflects the change if material
- [ ] §2 Current World State updated when world state genuinely shifted
- [ ] §3 Major Systems updated when a system was added / retired / repurposed
- [ ] §4 Source-of-Truth Rules updated when a trust ordering changed
- [ ] §6 Active Workstreams flipped when a workstream entered or exited active state
- [ ] §7 Active Risks updated when a risk became active / mitigated / resolved
- [ ] §8 Ledger System Map updated when a ledger was created / activated / retired / renamed
- [ ] §12 Recently Changed appended (not rewritten)
- [ ] §13 Next Handoff Notes reflects what comes next
- [ ] JSON mirror reconciled with the markdown
- [ ] If the change is Box-system-scoped: §9 Box System Map updated
- [ ] If the read-first order changed: §10 Agent Work Protocol updated
- [ ] One line appended to `_ledger/activity.jsonl` if the change was non-trivial
- [ ] If the steward ran in `local_write` mode: receipt written under the configured receipts path

---

## 6. Local Agent Protocol

Per `BOX_LEDGER.md` Local Agent Protocol (Read → Locate truth → Check rules → Edit narrowly → Verify → Record → Handoff):

1. **Read** — `GLOBAL_LEDGER.md`, `GLOBAL_LEDGER.json`, `INDEX.md`, `TEMPORAL_CONTINUITY.md` (for current-state context), this `BOX.md`, `steward/AGENTS.md` if invoking the steward, `_ledger/activity.jsonl` for context.
2. **Locate truth** — Global Ledger wins on permanent identity / rules. Current state lives in TCL. Decisions live in the Decisions Ledger.
3. **Check rules** — see §5 Local Done Gate above + AGENTS.md §11 Done Gate Enforcement.
4. **Edit narrowly** — append to §12 Recently Changed; update §1–§9 only when world state genuinely shifted; never absorb local detail into Global.
5. **Verify** — JSON mirror still parses; sections still ordered per AGENTS.md §9; no local detail leaked in.
6. **Record** — activity log line + receipt (if steward ran in local_write).
7. **Handoff** — §13 Next Handoff Notes updated when next-actor context shifts.

---

## 7. Steward Modes

The steward at `steward/` runs in one of two modes per dispatch:

- **`local_write` (current default for legacy prompt)** — apply proposed edits to `GLOBAL_LEDGER.md` + `.json`; write receipt; append activity entry. The legacy prompt at `CCAgentindex/agents/global_ledger_steward/prompt.md` defaults to this mode.
- **`audit_only`** — produce an Update Recommendation block per AGENTS.md §15.2; write a receipt only.

When `audit-only`, `audit_only`, or `dry run` appears in the dispatch context, the steward switches to audit_only mode automatically.

---

## 8. When To Invoke The Steward

Per AGENTS.md §2 — invoke when:

- A major project system is added, retired, renamed, or repurposed
- A global source-of-truth rule changes
- A new ledger is created, activated, renamed, or retired
- A new Box class is created
- The project enters a new phase
- The read-first order changes
- A Done Gate changes
- A major risk becomes active, is mitigated, or is resolved
- The project's operating principles shift
- A meaningful session ends and global handoff context needs to be preserved
- Another agent is unsure whether a change requires a global memory update
- GitHub/local drift could cause future-agent confusion
- A user asks, "Where should this be recorded?"

Do **not** invoke for tiny local changes that only belong in a local Box, Page Ledger, Widget Ledger, Audit Ledger, or Open Problems Ledger.

---

## 9. Receipts

Each steward run writes one receipt. **Two paths exist during the migration window** (per ATOM-0044 do_not_undo_casually):

1. **Legacy path (still active):** `CCAgentindex/_ledger/ledger_steward_runs/<UTC-timestamp>.json` — the legacy prompt at `CCAgentindex/agents/global_ledger_steward/prompt.md` writes here today.
2. **Canonical path (this Box's `receipts/`):** `LEDGERS/BOXES/global_ledger/receipts/<YYYY-MM-DD_HH-MM-SS>_run_<request_id>.json` — the unified-pattern home, future receipts will land here once the unified prompt becomes the dispatch target.

Receipts are append-only — never edit a past receipt. If a run was wrong, write a new receipt that supersedes the prior one (with a `supersedes` field).

---

## 10. Phase Status

- **Phase A** — `GLOBAL_LEDGER.md` + `.json` shipped 2026-04-28. `INDEX.md` established the ledger roster pattern. Complete.
- **Phase B (current)** — this Box stamps the unified pattern around the project's first-runnable steward. The legacy runnable form at `CCAgentindex/agents/global_ledger_steward/` keeps working through the migration window. The unified-Box steward files are now in place; resolution helper at `_agent_resolve_prompt` (added in ATOM-0029) finds the legacy prompt first.
- **Phase C** — manifest `subscribes` + `emits` are documented but not consumed by the router (deferred per `DEC-2026-04-29-013`). When Phase C runtime lands, this Box plugs in without rework.

---

## 11. Migration Notes (ATOM-0044)

This Box was created as the migration target for the legacy `global_ledger_steward` runnable form. Per the migration atom's `do_not_undo_casually`:

> global_ledger_steward is the only steward currently runnable. Do not break it during migration. Keep the legacy path working until the migration smoke test passes; only then can the legacy files be deleted.

Migration approach taken:

1. **Build new alongside old.** This Box's files (`box.json`, `BOX.md`, `steward/AGENTS.md`, `steward/prompt.md`, `steward/config.json`, `receipts/`) authored without touching the legacy files at `CCAgentindex/agents/global_ledger_steward/`.
2. **Resolution helper finds legacy first.** `server.py _agent_resolve_prompt` (added in ATOM-0029) checks `CCAgentindex/agents/<name>/` before `LEDGERS/BOXES/<box>/steward/`. While both paths exist, dispatches still resolve to legacy. No behavior change.
3. **Smoke test = the existing live dispatches.** The endpoint `POST /api/agents/global_ledger_steward/run` has been live since 2026-04-28; this migration adds files without changing what gets dispatched. Programmatic verification: `_agent_resolve_prompt("global_ledger_steward")` continues to return the legacy path.
4. **Legacy retirement deferred.** Per the atom's close criterion, legacy files can only be deleted after the unified path is the active dispatch target. That requires either (a) flipping `_agent_resolve_prompt` precedence to prefer unified, or (b) deleting the legacy files (which makes legacy non-existent so the helper falls through to unified). Either move is a separate work unit — not part of ATOM-0044.

---

## 12. Related Files / Ledgers

- **Box concept** — `LEDGERS/BOX_LEDGER.md`
- **Manifest schema** — `LEDGERS/BOX_BUS_LEDGER.md` §2.1
- **Pattern decision (unified Box)** — `LEDGERS/DECISIONS_LEDGER.md` (DEC-2026-04-29-015)
- **Canonical-path decision (steward at `steward/`)** — `LEDGERS/DECISIONS_LEDGER.md` (DEC-2026-04-30-004)
- **The ledger this Box governs** — `LEDGERS/GLOBAL_LEDGER.md` + `.json`
- **Phase boundary** — `LEDGERS/PHASE.md` §4 (Phase B: Sub-agents)
- **Migration atom** — `LEDGERS/ATOMS.md` (ATOM-2026-04-30-0044)
- **Sibling unified Boxes** — `LEDGERS/BOXES/temporal_continuity/`, `LEDGERS/BOXES/atoms/`
- **Original draft** — `Subagent Boxes/global_ledger_subagent_package/` (preserved as reference; the live config is here under `steward/`)
- **Legacy runnable form (still live, retiring)** — `CCAgentindex/agents/global_ledger_steward/`

---

## 13. Final Operating Rule

> The repo is the memory of the build.
>
> If the system changed, the system memory changes with it.
>
> Global only when global. Local detail belongs in local ledgers.
>
> The project should not wake up confused.

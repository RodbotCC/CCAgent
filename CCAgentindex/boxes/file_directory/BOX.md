# BOX — File Directory Ledger Box

Last updated: 2026-04-30 (initial creation — ATOM-2026-04-30-0036 Phase B promotion of `file_directory_steward` from draft to runnable)
Box class: `ledger`
Box id: `ledger_box:file_directory`
Slug: `file_directory`
Tier (Box Bus Ledger §3): `global`
Status: `active`
Pattern decision: [`DEC-2026-04-29-015`](../../DECISIONS_LEDGER.md) — Unified Ledger Box layout
Canonical-path decision: [`DEC-2026-04-30-004`](../../DECISIONS_LEDGER.md) — `LEDGERS/BOXES/<name>/steward/`
Promotion atom: [`ATOM-2026-04-30-0036`](../../ATOMS.md)

> **The File Directory Box governs the project's city map.** It promotes the draft `file_directory_steward` (from `/Subagent Boxes/file_directory_subagent_package/`, authored 2026-04-29) into a runnable Phase B steward, alongside `global_ledger`, `temporal_continuity`, `open_problems`, and `atoms` unified Boxes.
>
> Ledger + Steward + Manifest in one folder. Ledger files stay where they are; this Box governs them via path reference.

---

## 1. What This Box Is

A **Ledger Box** for the File Directory Ledger.

The File Directory Ledger is the project's **city map** — top-level + subdirectory ownership, canonical vs generated boundaries, status taxonomy, and common wrong-turns. Without it, every cold-starting agent burns context on "grep roulette."

This Box does **not** contain the ledger files themselves. They stay at:

- `LEDGERS/FILE_DIRECTORY_LEDGER.md` (canonical narrative)
- `LEDGERS/FILE_DIRECTORY_LEDGER.json` (structured mirror)

The Box governs them by path reference (`box.json.owns[]`).

**Why file_directory matters:** per `ATOM-2026-04-30-0036` `do_not_undo_casually` — *"file_directory is third — city-map drift is silent and cumulative."* Silent drift means agents don't notice the map is wrong until they've already edited the wrong area. Cumulative means each new agent inherits the prior wrongness. This is exactly the failure mode the steward exists to prevent.

---

## 2. What This Box Owns

Per `box.json.owns[]`:

- `LEDGERS/FILE_DIRECTORY_LEDGER.md` — the ledger (canonical, governed by this Box)
- `LEDGERS/FILE_DIRECTORY_LEDGER.json` — the structured mirror
- `LEDGERS/BOXES/file_directory/box.json` — the manifest (this Box's wire-shape declaration per `BOX_BUS_LEDGER.md` §2.1)
- `LEDGERS/BOXES/file_directory/BOX.md` — this file (per-Box orientation)
- `LEDGERS/BOXES/file_directory/steward/AGENTS.md` — full operating instructions (19 sections, copied from draft 2026-04-30)
- `LEDGERS/BOXES/file_directory/steward/config.json` — machine-readable steward config
- `LEDGERS/BOXES/file_directory/steward/prompt.md` — runnable agent prompt (authored fresh, modeled after `global_ledger_steward/prompt.md`)
- `LEDGERS/BOXES/file_directory/receipts/` — steward run receipts (one JSON per run)

---

## 3. What This Box Does Not Own

- Per-file roles → `LEDGERS/FILE_CONTENTS.md` (the file_directory_steward owns the city map; FILE_CONTENTS owns per-file responsibilities)
- Per-page UI assets → `page_asset_sitemap.md` (file_directory only flags route↔directory mismatches)
- Per-domain trust orderings → `LEDGERS/SOURCE_OF_TRUTH.md`
- Other ledgers' content → their respective Boxes
- Architectural decisions about the unified Box pattern itself → `DECISIONS_LEDGER.md`
- The runtime that consumes manifests → deferred to Phase C per `DEC-2026-04-29-013`
- Per-Client Box content → `Auto/Client Boxes/<Name>/`

---

## 4. Local Source-of-Truth Rules

Per `SOURCE_OF_TRUTH.md` and the directory-level discipline:

- **Directory ownership** → `FILE_DIRECTORY_LEDGER.md` §5 ownership table wins.
- **Canonical vs generated** → `FILE_DIRECTORY_LEDGER.md` §11 discipline wins. Generated outputs are NEVER source truth unless a per-domain Source-of-Truth rule explicitly elevates them.
- **Markdown vs JSON conflict:** prefer the newest verified source; reconcile both when editing.
- **Disk vs ledger conflict:** ALWAYS verify disk first, then update ledger. Never edit the ledger to match what the agent expected — verify what's actually there.
- **Local Box wins on local detail:** if a directory has a `BOX.md` / `AGENTS.md` / `CLAUDE.md`, that file is authoritative for the directory's local rules. The File Directory Ledger only catalogs that the orientation file exists; it does not duplicate its content.

---

## 5. Local Done Gate (stricter than DoD §5.6 for this Box)

A meaningful File Directory Ledger update is done when:

- [ ] All DoD §5.6 (Ledger Creation / Edit Work) checks pass
- [ ] `Last updated` line in `FILE_DIRECTORY_LEDGER.md` bumped
- [ ] §3 Top-Level Map updated when a top-level directory was added / retired / renamed
- [ ] §4 Important Subdirectory Maps updated when a load-bearing subdirectory shifted
- [ ] §5 Ownership Table updated when ownership changed
- [ ] §6 Canonical vs Generated Discipline updated when a canonical/generated boundary moved
- [ ] §9 Local Orientation Index updated when a directory gained or lost a local Box / AGENTS.md / CLAUDE.md
- [ ] §11 Changes Since Last Sweep appended (not rewritten)
- [ ] §12 Known Wrong-Turns appended when a new wrong-turn pattern was detected
- [ ] JSON mirror reconciled with the markdown
- [ ] If a directory was retired: cross-checked against `indexes/index.json` for stale references
- [ ] One line appended to `_ledger/activity.jsonl` if the change was non-trivial
- [ ] If the steward ran in `local_write` mode: receipt written under this Box's `receipts/`

---

## 6. Local Agent Protocol

Per `BOX_LEDGER.md` Local Agent Protocol (Read → Locate truth → Check rules → Edit narrowly → Verify → Record → Handoff):

1. **Read** — `FILE_DIRECTORY_LEDGER.md`, `.json`, this `BOX.md`, `steward/AGENTS.md` if invoking the steward, the actual disk via `ls` for the area in question, `_ledger/activity.jsonl` for context.
2. **Locate truth** — Disk reality wins. The ledger is a representation of disk; verify disk first.
3. **Check rules** — see §5 Local Done Gate above + AGENTS.md §13 Directory Change Done Gate.
4. **Edit narrowly** — append to §11 Changes Since Last Sweep; update §3–§9 only when directory state genuinely shifted.
5. **Verify** — JSON mirror still parses; `indexes/index.json` consistent for any directory the loader touches; sections still ordered per AGENTS.md §14.
6. **Record** — activity log line + receipt (if steward ran in local_write).
7. **Handoff** — note any new wrong-turn pattern in §12 so the next agent doesn't repeat the mistake.

---

## 7. Steward Modes

The steward at `steward/` runs in one of two modes per dispatch:

- **`audit_only` (default)** — produces a Directory Audit Report block per AGENTS.md §19; writes a receipt only.
- **`local_write`** — applies proposed edits to `FILE_DIRECTORY_LEDGER.md` + `.json`; writes receipt; appends activity entry.

Audit-only is the safe default. The steward's first invocation against any new directory should always be audit_only — the city map is too easy to subtly corrupt.

---

## 8. When To Invoke The Steward

Per AGENTS.md §2 — invoke when:

- A new top-level directory appears
- A top-level directory is retired or renamed
- A load-bearing subdirectory ownership changes
- A canonical/generated boundary moves
- A directory gains or loses a local Box / AGENTS.md / CLAUDE.md
- Wrong-path edits are detected (multiple agents touching the wrong directory for similar tasks → §12 update)
- `indexes/index.json` is updated and the ledger may need to follow
- Bedrock reconciliation work touches directory shape (PROB-2026-04-28-016 atoms 0003–0026)
- Another agent is unsure which directory owns a piece of work
- A user asks "where does X go?"

Do **not** invoke for:
- Per-file edits with no directory shape change
- Per-page UI changes (those go through `page_asset_sitemap.md`)
- Per-Box state edits (those stay local to the Box)

---

## 9. Receipts

Each steward run writes one receipt to `receipts/<YYYY-MM-DD_HH-MM-SS>_run_<request_id>.json`. Format defined in `steward/prompt.md` (Receipt Contract section).

Receipts are append-only — never edit a past receipt. If a run was wrong, write a new receipt that supersedes the prior one (with a `supersedes` field).

---

## 10. Phase Status

- **Phase A** — `FILE_DIRECTORY_LEDGER.md` + `.json` shipped 2026-04-28. Complete.
- **Phase B (current)** — this Box stamps the unified pattern for file_directory and promotes the draft sub-agent to runnable form. Authored via ATOM-0036 on 2026-04-30. Route wiring is a no-op via the `_agent_resolve_prompt` helper (ATOM-0029). Live HTTP smoke test (ATOM-0038) and INDEX flip (ATOM-0039) are the remaining chain steps.
- **Phase C** — manifest `subscribes` + `emits` are documented but not consumed by the router (deferred per `DEC-2026-04-29-013`). When Phase C runtime lands, this Box plugs in without rework.

---

## 11. Promotion Notes (ATOM-0036)

This Box was created as the Phase B promotion target for the draft `file_directory_subagent_package`. Unlike the global_ledger migration (ATOM-0044), there is **no legacy `CCAgentindex/agents/file_directory_steward/`** to preserve — the steward has never been runnable before this atom.

Promotion approach:

1. **Copy + adapt the draft.** `AGENTS.md` and `config.json` copied from `/Subagent Boxes/file_directory_subagent_package/` with header lines updated to reflect canonical Box paths, status: draft → active, and migration/promotion metadata added.
2. **Author prompt.md fresh.** The draft package didn't include a `prompt.md` (drafts only had `AGENTS.md` + `config.json` + `README.md`). Authored modeled after `LEDGERS/BOXES/global_ledger/steward/prompt.md` (the only currently-running prompt) so the operating shape matches.
3. **Resolution via helper.** `_agent_resolve_prompt` (added in ATOM-0029) checks legacy first, then unified Box. Since no legacy path exists for `file_directory_steward`, the helper falls through directly to this Box's `steward/prompt.md`. No legacy compatibility concern.
4. **Smoke test deferred.** Per ATOM-0029 + ATOM-0044 precedent, live HTTP smoke test (server restart + 200 return) is its own atom (ATOM-0038). This atom delivers the runnable form + programmatic resolution verification.

---

## 12. Related Files / Ledgers

- **Box concept** — `LEDGERS/BOX_LEDGER.md`
- **Manifest schema** — `LEDGERS/BOX_BUS_LEDGER.md` §2.1
- **Pattern decision (unified Box)** — `LEDGERS/DECISIONS_LEDGER.md` (DEC-2026-04-29-015)
- **Canonical-path decision (steward at `steward/`)** — `LEDGERS/DECISIONS_LEDGER.md` (DEC-2026-04-30-004)
- **The ledger this Box governs** — `LEDGERS/FILE_DIRECTORY_LEDGER.md` + `.json`
- **Phase boundary** — `LEDGERS/PHASE.md` §4 (Phase B: Sub-agents)
- **Promotion atom** — `LEDGERS/ATOMS.md` (ATOM-2026-04-30-0036)
- **Sibling unified Boxes** — `LEDGERS/BOXES/global_ledger/`, `LEDGERS/BOXES/temporal_continuity/`, `LEDGERS/BOXES/open_problems/`, `LEDGERS/BOXES/atoms/`
- **Original draft** — `Subagent Boxes/file_directory_subagent_package/` (preserved as reference; the live config is here under `steward/`)
- **Adjacent ledgers** — `LEDGERS/FILE_CONTENTS.md` (per-file inventory), `page_asset_sitemap.md` (UI Done Gate)

---

## 13. Final Operating Rule

> The file tree is the project's working memory.
>
> Before editing a file, understand where it lives and what its directory owns.
>
> The city map is the steward's job. Per-file detail belongs elsewhere. Per-page detail belongs elsewhere. Local rules belong in the directory's own Box.
>
> Silent cumulative drift is the failure mode this steward exists to prevent.

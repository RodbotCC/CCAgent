# BOX — Atlas Ground-Truth Box

Last updated: 2026-04-30 (initial creation — Atlas integrated as project ground-truth surface; sweep steward Phase B follow-on)
Box class: `ground_truth_source` (new kind — first of its type)
Box id: `ground_truth_box:atlas`
Slug: `atlas`
Tier (Box Bus Ledger §3): `domain`
Status: `active (read-only contract; sweep steward Phase B)`
Pattern decision: [`DEC-2026-04-29-015`](../../DECISIONS_LEDGER.md) — Unified Box layout (adapted for ground-truth-source class)

> **Atlas is operator-actual-machine-activity, observed by Pieces MCP, accumulated to disk as daily folders.** The project agents READ this surface to fact-check their own ledger writes. Atlas writes nothing into the project; project agents write nothing into Atlas. The steward at `steward/` reconciles Atlas observations against the project ledger system.
>
> When Atlas and the ledgers disagree, **Atlas wins for what-actually-happened-on-the-operator's-machine**; **the ledgers win for what-the-system-now-claims**. They are different truths and they should both be visible.

---

## 1. What This Box Is

A new kind of Box: `ground_truth_source`. It is the first Box that doesn't govern a ledger or a sub-agent's runtime — it governs the project's relationship to an EXTERNAL data source (Pieces MCP output landing at `/Users/jakeaaron/Documents/Atlas/`).

**Why it's needed.** The agents writing the ledgers can drift from reality — claim work that didn't happen, miss work that did, inflate the meaning of small edits, miss the meaning of big ones. Pieces is observing the operator's actual machine activity continuously and producing structured summaries. That observation is a fact-check surface against ledger claims.

This Box does **not** contain the Atlas folders themselves. They stay where they are at `/Users/jakeaaron/Documents/Atlas/`. The Box governs them by symlink (`LEDGERS/atlas → ...`).

**Why a symlink, not a copy:**
- Atlas grows daily (new folder every morning) — copying would mean a sync job
- Atlas is per-machine — symlinking keeps the project portable across machines (the symlink target won't resolve elsewhere, which is correct: a different machine has different Pieces ground truth)
- Pieces writes the originals; agents read through the alias; clean ownership

---

## 2. What This Box Owns

Per `box.json.owns[]`:

- `LEDGERS/atlas` — symlink to `/Users/jakeaaron/Documents/Atlas/` (the alias that makes Atlas locally addressable from project paths; gitignored)
- `LEDGERS/BOXES/atlas/box.json` — the manifest
- `LEDGERS/BOXES/atlas/BOX.md` — this file
- `LEDGERS/BOXES/atlas/steward/AGENTS.md` — full operating instructions for the Atlas Sweep Steward
- `LEDGERS/BOXES/atlas/steward/config.json` — machine-readable steward config
- `LEDGERS/BOXES/atlas/steward/prompt.md` — runnable agent prompt (draft — not yet wired)
- `LEDGERS/BOXES/atlas/receipts/` — sweep run receipts (one JSON per run)

---

## 3. What This Box Does NOT Own

- **The contents of `/Users/jakeaaron/Documents/Atlas/`.** Pieces MCP writes those. No project agent should ever write into Atlas folders. Reading is unrestricted; writing is forbidden.
- **The Pieces MCP server itself.** That's a connector at `localhost:39300`. See `LEDGERS/CONNECTIONS.md`.
- **The Live Pieces ribbon on the grid home page.** That consumes Pieces output through a different path (`window.LivePiecesHeader` in `screens.jsx`).
- **The Pieces Activity page.** Same — separate render of Pieces output via `/api/pieces/*` endpoints.
- **Decisions about project architecture.** Atlas observes; it doesn't decide. Decisions go in `DECISIONS_LEDGER.md`.

---

## 4. Local Source-of-Truth Rules

This is the new contribution to the project's source-of-truth model. The steward enforces:

### 4.1 Two truths, both load-bearing

| Surface | Wins for | Loses for |
|---|---|---|
| **Atlas** (operator-actual-activity) | "Did this happen?" "When?" "What did the operator actually look at / discuss / build?" | "Should we do X?" "What's the rule?" "What's the architecture?" |
| **Project ledgers** (agent claims + decisions) | "What's the rule?" "What did we decide?" "What's the project state?" "What's open?" | "What did the operator actually do today?" "What got missed in the ledger writes?" |

When they disagree, **the steward files a PROB describing the drift**. It does NOT auto-overwrite either side. Drift surfacing is the steward's job; resolution is human + ledger-steward work.

### 4.2 Filter for project-relevance

Atlas captures **everything** on the operator's machine — entertainment (Malcolm in the Middle reruns), philosophical exploration, third-party tool research, etc. Not every Pieces summary is project memory.

The steward applies a project-relevance filter:
- Filename hints (`pieces_cc_agent_*`, `pieces_*_ledger_*`, `pieces_*_atom_*`, `pieces_comeketo_*`, `pieces_*_steward_*`, etc.)
- TLDR keywords (CC Agent, Comeketo, ledger, atom, steward, PROB, DEC, etc.)
- Resources Reviewed file paths (anything under `/Users/jakeaaron/Downloads/CC Agent/` is project-relevant)

Non-project summaries are noted in the receipt count but not surfaced as findings.

### 4.3 Never invent

The steward only surfaces observations that are explicitly in the Pieces summary text. No inference past the evidence. If Pieces says "user discussed X with Claude," the steward can repeat that; it cannot extrapolate "therefore the project's X position is Y."

---

## 5. Local Done Gate (stricter than DoD §5.6 for this Box)

A meaningful Atlas sweep is done when:

- [ ] Receipt written to `receipts/<YYYY-MM-DD_HH-MM-SS>_run_<id>.json`
- [ ] Receipt declares: which Atlas folders were swept, how many summaries were read, how many passed the project-relevance filter, how many findings were surfaced
- [ ] Each finding cites the exact Pieces summary file by path
- [ ] If the finding contradicts a ledger entry: a PROB has been filed (or a candidate PROB has been drafted to `DRAFTS/ATOMIZATION/atlas_drift_<date>.md` for human review)
- [ ] If the finding is a project-relevant handoff lesson: a candidate COMM has been drafted
- [ ] If the finding is a Next-Steps action suggestion: a candidate atom has been drafted to `DRAFTS/ATOMIZATION/atlas_atoms_<date>.md` for human review
- [ ] activity.jsonl appended with `kind:atlas_steward_run`
- [ ] No writes inside `LEDGERS/atlas/` (the alias is read-only)

---

## 6. Local Agent Protocol

1. **Read** — `LEDGERS/atlas/<today's folder>/`, this `BOX.md`, `steward/AGENTS.md` if invoking the steward, the prior receipt to find the cutoff date.
2. **Locate truth** — Atlas wins for operator-actual-activity. Project ledgers win for project-state.
3. **Filter** — apply the project-relevance filter (§4.2). Skip entertainment/personal summaries.
4. **Reconcile** — compare each project-relevant Atlas summary against the corresponding project ledger entries (Decisions referenced by DEC-id, OPL referenced by PROB-id, etc.). Note matches AND drift.
5. **Surface** — file PROBs for drift; draft COMMs for handoff lessons; draft atom proposals for Next Steps.
6. **Verify** — receipt is complete; all citations point to real Atlas paths; no Atlas writes happened.
7. **Record** — activity log line + receipt.

---

## 7. Steward Modes

The steward at `steward/` runs in one of two modes per dispatch:

- **`audit_only` (default)** — produce findings report; write receipt only; no PROB / COMM / atom-draft writes. Safe baseline.
- **`reconcile`** — apply scoped writes: file PROBs for drift, draft COMMs for handoff lessons, draft atom proposals to `DRAFTS/ATOMIZATION/`. Never overwrites existing PROB/COMM/atom entries; appends only.

---

## 8. When To Invoke The Steward

- **End of day** — sweep today's Atlas folder, surface what made it onto disk, draft handoffs/atoms for tomorrow.
- **On-demand verification** — when a ledger claim feels suspicious, run the steward to fact-check against Atlas.
- **Cold-start orientation** — when an agent (especially a new Cowork session) wakes up, the steward can produce an "operator-actual-recent-activity" summary that's faster than reading every PROB/COMM/TCL update.
- **Drift suspicion** — TCL §1 says "Phase A in progress" but the activity log shows Phase B work landing — Atlas can confirm which is true.

Do **not** invoke for:
- Routine ledger reads (the existing Live Pieces ribbon on the grid page handles ambient surface)
- One-off lookup of a specific event (faster to read the Atlas folder directly)

---

## 9. Receipts

Each sweep writes one receipt to `receipts/<YYYY-MM-DD_HH-MM-SS>_run_<request_id>.json`. Format defined in `steward/prompt.md` (Receipt Contract section).

Receipts are append-only.

---

## 10. Phase Status

- **Phase A** — Atlas has been accumulating since at least 2026-04-24 via Pieces MCP. This Box was authored 2026-04-30 to formalize it as a project surface.
- **Phase B (current)** — Box authored. Steward files staged at `steward/`. Runnable form pending graduation atom (filed as PROB-2026-04-30-015, eligible for atomization in the same chain pattern as the other steward promotions).
- **Phase C** — `subscribes`/`emits` documented but not consumed by router (deferred per `DEC-2026-04-29-013`). When Phase C runtime lands, this Box's emit pattern (PROB / COMM / atom-draft) becomes a real bus dispatch.

---

## 11. Why This Is A New Box Class

The existing Box kinds are `ledger` (governs a project ledger like Global, Temporal, Atoms). Atlas isn't a ledger — it's an external observation surface. The new `ground_truth_source` class names what it is:

- **Owns:** an alias to an external data source + the steward that reads it
- **Doesn't own:** the data itself (someone else writes it)
- **Output:** findings → other ledgers (PROB/COMM/atoms), not its own content
- **Trust contract:** beats agent ledgers for "what happened"; loses to project ledgers for "what we decided"

This is the first ground_truth_source Box. Future candidates: a `git_history_box` could observe `git log` as ground truth for code change activity; a `slack_activity_box` could observe Slack for team activity. All would follow the same read-only-alias + sweep-steward + reconcile-into-ledgers pattern.

---

## 12. Related Files / Ledgers

- **Box concept** — `LEDGERS/BOX_LEDGER.md`
- **Manifest schema** — `LEDGERS/BOX_BUS_LEDGER.md` §2.1
- **Pattern decision (unified Box)** — `LEDGERS/DECISIONS_LEDGER.md` (DEC-2026-04-29-015)
- **The Atlas folder this Box reads** — `/Users/jakeaaron/Documents/Atlas/` (aliased at `LEDGERS/atlas`)
- **The Pieces MCP that writes Atlas** — `LEDGERS/CONNECTIONS.md`
- **The Live Pieces ribbon (separate consumer)** — `page_asset_sitemap.md` §grid (LivePiecesHeader)
- **The Pieces Activity page (separate consumer)** — `page_asset_sitemap.md` §activity
- **The architecture decision** — `LEDGERS/COMMUNICATIONS_LEDGER.md` COMM-2026-04-30-007 (Atlas integration)
- **Phase B follow-on** — `LEDGERS/OPEN_PROBLEMS_LEDGER.md` PROB-2026-04-30-015 (Atlas Sweep Steward not yet runnable)

---

## 13. Final Operating Rule

> Atlas is operator ground truth.
>
> The agent ledgers are project state.
>
> Both are true at different altitudes.
>
> When they disagree, surface the gap — never silently auto-resolve.

# Deprecation Ledger

Last updated: 2026-04-30 (initial creation — Phase B opener; tier: global; envelope-aware under `DEC-2026-04-29-013`; pairs with Snapshot Protocol §7)
Maintainer: Jake / Comeketo Agent project agents
Status: **active**
Tier (Box Bus Ledger §3): **global** — fans out to every Box that subscribes at the global tier; every domain ledger may emit deprecation candidates upstream
Read when: about to delete a file, retire a folder, supersede a ledger entry, archive a Client/Staff Box, replace a sub-agent, decommission a route, prune a `_vault/` domain, or cull anything else in the tree that has been load-bearing.
Core rule: **Nothing leaves the project without a Deprecation entry and a Snapshot reference.**
Steward agent: not yet authored. Phase B follow-up — the unified Box pattern (DEC-2026-04-29-015) lands this at `LEDGERS/BOXES/deprecation/` once the steward is built.

> The cardinal sin is silent removal. A file disappears, a folder goes, a route flips off — and three weeks later an agent reading a CLAUDE.md follows a dead link, hits a `404`, and has no idea what was there or why it left.
>
> The Deprecation Ledger answers four questions for every retired thing: **what, why, when, where to find it.** It is paired with the Snapshot Protocol so the *where* is always answerable.
>
> Removal without ledger entry is a deletion debt. Pay it now or pay it bigger later.

---

## 1. Purpose

This ledger records **the controlled retirement of project state** — files, folders, ledgers, ledger entries, sub-agents, routes, automations, Boxes, schemas, settings, environment variables, and any other artifact that was load-bearing or referenced in a CLAUDE.md / cross-ledger link.

It explains:

- **what** was deprecated (path, ID, name, identity)
- **why** (architectural reason, supersession, scope cut, dead-code drift, external change)
- **when** (date entered each lifecycle state)
- **what replaced it** (if anything — supersession ID, new path, or `none`)
- **where to find the last-known good version** (Snapshot Protocol §7 — pinned snapshot ID + path inside snapshot)
- **what depends on it that still needs to be updated** (incoming-link audit)
- **when it can move from `archived` to `purged`** (retention rule)

Without this ledger, the project loses the audit trail of its own simplifications. Every "I removed the projects folder" or "we retired the Audit Ledger" becomes invisible the moment the same agent is replaced. Future agents follow stale references, propose to rebuild what was deliberately retired, or — worst — undo a deprecation that was load-bearing for a safety reason.

### Owns

- the deprecation **lifecycle** (candidate → deprecated → archived → purged)
- the **status labels** and what each one binds an agent to do
- the **required fields** for every deprecation entry
- the **incoming-link audit** discipline (no entry closes without it)
- the **Snapshot Protocol** (§7) — what is captured, how often, where it lives, retention rules, manual + automated invocation
- the **recovery procedure** — restoring a purged or archived item from snapshot
- pointers from deprecated items back to the Decision (if any) that authorized the retirement
- the **deprecation candidates** queue — things flagged for retirement but not yet retired

### Does not own

- routine git deletions during in-flight work that were never load-bearing → `git log` is enough
- bug fixes or refactors that change content but not identity → Decisions or Communications
- ephemeral session state (in-progress work, scratch files in `outputs/`) → never load-bearing, no entry needed
- the ledgers themselves — each ledger steward updates its own ledger; deprecation is captured here only when content **leaves** entirely
- Pieces.app long-term memory — Pieces is its own retention surface and we don't manage it from here
- the *content* of what was deprecated — that lives in snapshots; this ledger holds only the metadata pointer

If you are uncertain whether to log something as deprecated: **err on the side of logging.** The cost of an extra entry is one row; the cost of silent removal is a future agent with a dead reference.

---

## 2. The Cardinal Rule

> **Nothing leaves the project without a Deprecation entry and a Snapshot reference.**

This is not a soft norm. It is the same shape as the Prime Directive in `CLAUDE.md` — code without ledger entry is debt; **removal without ledger entry is silent debt**, which is worse.

Operational form:

1. Before deletion / retirement → **take a snapshot** (or confirm a snapshot is < 24h fresh per §7).
2. Author the Deprecation entry → status `deprecated`, snapshot reference filled in, incoming-link audit done.
3. Only then perform the retirement (delete file, retire folder, flip route off, supersede ledger, etc.).
4. Append `_ledger/activity.jsonl` line with `kind: "deprecation_recorded"`.
5. If the retirement supersedes a Decision, link both directions in `DECISIONS_LEDGER.md`.

If the retirement is reactive (you discovered something already gone) → enter it at status `archived` with a snapshot reference if recoverable, or `purged` with `recovery: "not_recoverable"` and a Communications Ledger entry explaining what was lost.

---

## 3. Lifecycle States

Every deprecation entry passes through some subset of these four states. **All entries start at `candidate` or `deprecated`.** The transition rules below are binding.

```
[ candidate ]   →   [ deprecated ]   →   [ archived ]   →   [ purged ]
     │                    │                   │                  │
   flagged             retired              cold-stored        gone
     ↑                    │                   │                  │
     └────────────────────┘                   │                  │
              (return to active)              │                  │
                                              │                  │
                                  retention     retention
                                  promotion     promotion
```

### 3.1 `candidate`

A thing has been **flagged for retirement** but is still present in the tree. Use this when:

- you suspect a file is dead-code drift but haven't confirmed
- a folder was emptied but not removed
- a ledger entry has been superseded but not formally retired
- you want a future agent to verify the dependency before pulling the trigger

**Required:** every `candidate` entry must include `flagged_by`, `flagged_reason`, and `verification_required` (an explicit statement of what to check before promotion).

**Promotion rules:**
- `candidate` → `deprecated` once verification is complete and retirement is authorized.
- `candidate` → (removed from ledger) if the candidate was wrong — the thing is in fact still load-bearing. Append a Communications Ledger note about the false-positive flag.

**Anti-pattern:** entries that sit in `candidate` for > 30 days without status review. The steward (when authored) will sweep these.

### 3.2 `deprecated`

The thing has been **retired but is still in the tree** — typically as a stub, a redirect, a soft-disabled route, a ledger entry marked superseded. Use this when:

- the file/folder still exists for the next 1–2 sprints to give cross-references time to update
- the route is flipped off in the UI but the code remains
- a ledger has been migrated but the old file stays as a tombstone
- a sub-agent has been replaced but the old config is preserved for rollback

**Required:** every `deprecated` entry must include `deprecated_at`, `superseded_by` (path or ID, or `none`), `incoming_links_audited` (boolean — must be `true` to enter this state), and `snapshot_id`.

**Promotion rules:**
- `deprecated` → `archived` once incoming references have been updated AND a cooling-off period of ≥ 14 days has passed AND no agent has needed to re-activate it.
- `deprecated` → (return to active) if the deprecation was reversed. Note in the entry, append a Decisions Ledger record, mark Status `reversed`.

### 3.3 `archived`

The thing has been **removed from the working tree** but its content is still in cold storage (snapshot). Use this when:

- the file/folder has been deleted from the project
- the ledger entry has been removed from its parent ledger
- no agent has needed to access it for ≥ 14 days
- the snapshot reference is the only remaining handle to recover it

**Required:** every `archived` entry must include `archived_at`, `snapshot_id`, `snapshot_path` (path inside the snapshot zip), and `recovery_difficulty` (`trivial` | `moderate` | `hard` | `not_recoverable`).

**Promotion rules:**
- `archived` → `purged` only after retention period (default: 12 months) AND no recovery requests during that window.
- `archived` → (recovered) if an agent or human pulls the content back out. Note recovery in the entry, append Communications Ledger, mark Status `recovered`.

### 3.4 `purged`

The thing is **gone**, including its snapshot reference. Use this only for:

- content that has aged past retention
- content that was never recoverable in the first place (lost to silent deletion before this ledger existed)
- content that was deliberately purged for safety / compliance reasons (rare; must be paired with a Decision)

**Required:** every `purged` entry must include `purged_at`, `purge_authorized_by`, and `purge_reason`. The entry itself stays in this ledger forever — purge means the *content* is gone, not the *metadata pointer*.

**No promotion from `purged`.** It is terminal.

---

## 4. Required Fields per Entry

Every entry, regardless of state, carries these fields. Optional state-specific fields layer on top per §3.

```yaml
id: DEPR-YYYY-MM-DD-###
title: <short human-readable name>
identity:
  path: <relative or canonical path>            # may be null if path is gone
  kind: file | folder | ledger_entry | route | sub_agent | box | schema | env_var | api_endpoint | widget | dependency | setting | other
  prior_id: <if applicable — DEC-id, COMM-id, PROB-id, route-id, agent-slug>
status: candidate | deprecated | archived | purged | reversed | recovered
tier: global | domain | local                   # which tier of the system this thing lived at
authored_by: <user | session | agent name>
authorized_by: <named decider — user, named role, Decision ID>
flagged_at: YYYY-MM-DD                          # when entry first opened (any state)
deprecated_at: YYYY-MM-DD | null
archived_at: YYYY-MM-DD | null
purged_at: YYYY-MM-DD | null
superseded_by: <path | DEC-id | "none">
supersedes: [<list of DEPR-ids this entry retires>]   # for chains
related_decisions: [<DEC-ids>]
related_problems: [<PROB-ids>]
related_communications: [<COMM-ids>]
snapshot_id: <snapshot zip filename — see §7> | "not_captured"
snapshot_path: <relative path inside the snapshot> | null
recovery_difficulty: trivial | moderate | hard | not_recoverable
incoming_links_audited: true | false
incoming_links_remaining: [<list of paths still referencing the deprecated thing>]
retention_policy: default-12mo | extended-24mo | extended-indefinite | short-30d | one-cycle
do_not_undo_casually: <prose — what the next agent should know before reversing>
notes: <free-form>
```

**Mandatory minimums by state:**

- `candidate`: id, title, identity.path, identity.kind, status, flagged_at, authored_by, flagged_reason, verification_required
- `deprecated`: all of the above + deprecated_at, authorized_by, superseded_by, incoming_links_audited (must be `true`), snapshot_id
- `archived`: all of the above + archived_at, snapshot_path, recovery_difficulty
- `purged`: all of the above + purged_at, purge_authorized_by, purge_reason

If a field is unknown, write `unknown` — never invent.

---

## 5. Incoming-Link Audit (the no-skip step)

Before any entry can move from `candidate` → `deprecated`, the author must do an **incoming-link audit**: search the project for everything that references the thing being retired, and decide for each:

- **rewrite the reference** (preferred — point at supersedor)
- **remove the reference** (if no replacement exists)
- **leave a tombstone note** (only if the reference is itself in a Communications Ledger entry recording history)

The audit pattern is a single `Grep` (or `rg`) sweep covering: `LEDGERS/`, `CLAUDE.md`, `page_asset_sitemap.md`, `CCAgentindex/`, `Auto/`, all `*.md` and `*.json` and `*.jsx` and `*.html` files.

The entry's `incoming_links_remaining` field captures any references the author chose to leave. **An entry with non-empty `incoming_links_remaining` cannot promote past `deprecated`** without the steward (or human) signing off.

This step exists because the dominant failure mode of deprecation is "I removed the file; I forgot the seven CLAUDE.md files that pointed at it." Front-load the pain: do the sweep before the deletion, not after.

---

## 6. What Counts as a Deprecation Candidate

Use this list as a flagging rubric — anything matching qualifies for at least a `candidate` entry:

| Trigger | Examples |
|---|---|
| **Ledger superseded** | A ledger entry explicitly replaced by a newer one (DEC-id supersession, PROB closed, COMM moved to lessons_learned) |
| **File renamed or moved** | The old path is gone but agents may still reference it |
| **Folder retired** | Apr 2026 great trim retired `projects/`, `threads/`, `commitments/`, `knowledge/` — should be in this ledger as Phase A backfill |
| **Route flipped off** | Apr 2026 trim retired ~14 routes (memory, prediction, commitments, commitment_detail, inbox, inbox_detail, calendar, Rodbot, projects, tables, table_new, table_detail, delegations, chat — note: delegations was later restored in some form, audit) |
| **Schema change** | A required field becomes optional, an optional field is removed, an enum value is dropped |
| **Sub-agent replaced** | A new agent supersedes an old one; the old config and runnable form are retired |
| **Box archived** | A Client Box for a closed/lost lead, a Staff Box for a departed coworker |
| **API endpoint removed** | `/api/<route>` no longer responds, or its shape changed in a non-backward-compatible way |
| **Setting removed** | A `localStorage.secretary.tweaks` key, an env var, a config flag |
| **Dependency dropped** | A library, MCP, external service we used to depend on |
| **Skill / agent decommissioned** | A skill removed from `comeketo-inbox/` or a draft agent abandoned |
| **Convention change** | A naming pattern, file layout, or schema convention superseded by a new one |
| **Vault domain pruned** | A `_vaults/<domain>/` folder removed or relocated |
| **Decision reversed** | A `DEC-` record marked superseded — the thing the decision authorized may itself need a deprecation entry |
| **Open Problem closed by removal** | A `PROB-` closed because the offending thing was removed (rather than fixed) |
| **Bedrock domain change** | Anything in `CCAgentindex/` that retires (e.g., the Apr 2026 great trim of retired domains) |

**Not a deprecation candidate:**

- routine bug fixes (the thing's identity is stable; only its content changed) → activity.jsonl + git log
- adding a new field to an existing schema → activity.jsonl
- in-flight scratch files in `outputs/` that never got referenced → no entry needed
- per-session task lists, plans, ephemeral artifacts → no entry needed

---

## 7. Snapshot Protocol

Snapshots are the **recovery surface** for everything in this ledger. Without a snapshot, "archived" is just a euphemism for "lost."

### 7.1 What is captured

Each snapshot is a single zip archive containing the project's **legibility skeleton** — the parts of the tree that are load-bearing for an agent reading from cold start:

| Path | Why captured |
|---|---|
| `LEDGERS/` | Every project ledger + visuals + JSON mirrors + per-page deep memory + the unified Boxes once they exist |
| `CLAUDE.md` | Project-local authoritative instructions |
| `page_asset_sitemap.md` | UI Done Gate canonical |
| `CCAgentindex/_ledger/activity.jsonl` | Append-only audit trail |
| `CCAgentindex/indexes/index.json` | Loader registration |
| `CCAgentindex/people/` | All `people/<slug>.json` records (small files, high signal) |
| `CCAgentindex/venues/` | All `venues/<slug>.json` records |
| `CCAgentindex/agents/` | Runnable app agent configs (excludes per-run receipts to keep zip small — receipts captured in weekly only) |
| `Auto/Client Boxes/` | Per-client memory layer (the canonical client truth — DEC-2026-04-28-003) |
| `Auto/Staff Boxes/` | Per-coworker memory layer |
| `Auto/orchestrator/state/` | `master_ledger.csv` + `today.html` (small operational state) |
| `Auto/comeketo-inbox/` | NEPQ skill + ballpark calculator |
| `Subagent Boxes/` | Draft sub-agent packages awaiting Phase B promotion |
| `Ledger Drafts/` | Outline drafts referenced by INDEX.md |

**Excluded from snapshots** (too big or too volatile):
- `node_modules/`, `__pycache__/`, `.git/`, `_snapshots/` itself
- runtime working files in `outputs/` or temp dirs
- `Auto/Client Boxes/<client>/comms/` raw payload JSONs in the *daily* snapshot (large; included in *weekly* and *monthly* per §7.2)

The exclusion list is defined in the manifest section of `LEDGERS/scripts/snapshot.sh`.

### 7.2 Cadence and retention

| Cadence | Frequency | Retention | Includes |
|---|---|---|---|
| **Daily** | every 24h | last 7 | skeleton (excludes raw `comms/*.json` payloads) |
| **Weekly** | every Sunday 00:00 local | last 4 | skeleton + raw `comms/*.json` payloads |
| **Monthly** | first day of month | last 12 | skeleton + raw `comms/*.json` + `agents/*/receipts/` |
| **Manual / pre-deprecation** | on demand before any retirement | indefinite (until referenced by a `purged` entry's retention rolls over) | full skeleton |

**Naming pattern:**

```
_snapshots/<cadence>/snapshot_<YYYY-MM-DD>_<HHMM>_<cadence>.zip
_snapshots/manual/snapshot_<YYYY-MM-DD>_<HHMM>_manual_<reason-slug>.zip
```

Examples:
- `_snapshots/daily/snapshot_2026-04-30_0300_daily.zip`
- `_snapshots/manual/snapshot_2026-04-30_1422_manual_pre_audit_ledger_purge.zip`

### 7.3 Storage location

Snapshots live at `/Users/jakeaaron/Downloads/CC Agent/_snapshots/` — at the **project root**, not inside `CCAgentindex/`. Reasoning:

- snapshots are about the whole project, not just the bedrock
- `_snapshots/` does not get registered in `indexes/index.json` and is invisible to the loader
- the leading underscore + the `_snapshots/` convention matches `_ledger/` and `_inbox/` style
- adding `/_snapshots/` to `.gitignore` keeps GitHub clean (snapshots are local-only)

### 7.4 Manual snapshot script

A bash script ships now at `LEDGERS/scripts/snapshot.sh`. Invocation:

```bash
# Manual snapshot before a deprecation
./LEDGERS/scripts/snapshot.sh manual "pre_audit_ledger_purge"

# Daily snapshot (run by automation in Phase C; manually for now)
./LEDGERS/scripts/snapshot.sh daily

# Weekly / monthly
./LEDGERS/scripts/snapshot.sh weekly
./LEDGERS/scripts/snapshot.sh monthly
```

The script:
1. Computes timestamp.
2. Builds the include / exclude list from §7.1.
3. Writes the zip to the appropriate `_snapshots/<cadence>/` folder.
4. Prunes older snapshots per §7.2 retention.
5. Appends a `kind: "snapshot_taken"` line to `_ledger/activity.jsonl` with the snapshot ID.

**Phase A status:** manual invocation only. Author of any deprecation entry runs it themselves before deletion.

**Phase C status:** wired into the orchestrator. Daily cron (or launchd) runs at 03:00 local. The Snapshot Steward (Phase B follow-up) tracks runs, monitors for skipped snapshots, surfaces failures to Open Problems.

### 7.5 Snapshot ID conventions

Inside Deprecation entries, `snapshot_id` is the **basename of the zip without extension**:

```
snapshot_2026-04-30_0300_daily
snapshot_2026-04-30_1422_manual_pre_audit_ledger_purge
```

`snapshot_path` is the path **inside** the zip, relative to the project root. Example:

```
LEDGERS/AUDIT.md
```

This pair (`snapshot_id` + `snapshot_path`) is the recovery key.

### 7.6 Recovery procedure

To recover a deprecated/archived item:

1. Read the Deprecation entry. Note `snapshot_id` and `snapshot_path`.
2. Locate the snapshot at `_snapshots/<cadence>/<snapshot_id>.zip`.
3. Extract only the needed path:
   ```bash
   unzip _snapshots/manual/<snapshot_id>.zip <snapshot_path> -d <restore_dir>
   ```
4. Inspect the restored content. Decide: full restore, partial restore, or read-only reference.
5. If restoring to the live tree:
   - update the Deprecation entry: `status: recovered`, append `recovered_at: <date>`, `recovered_by: <agent>`, `recovery_notes: <prose>`
   - append Communications Ledger entry explaining the restore
   - if the restore reverses a Decision, append Decisions Ledger record
6. Append `_ledger/activity.jsonl` line with `kind: "deprecation_recovered"`.

### 7.7 Snapshot health checks

The Snapshot Steward (when authored, Phase B follow-up) runs these checks on each invocation:

- Did the previous scheduled snapshot run on time? If not, file an Open Problems entry.
- Is the `_snapshots/` directory size growing unexpectedly? Monitor disk pressure.
- Does each Deprecation entry's `snapshot_id` resolve to a zip that exists? If a referenced snapshot is missing (pruned past retention while still referenced), promote that entry to `recovery_difficulty: not_recoverable` and append a Communications Ledger warning.

In Phase A, a human agent runs these checks during periodic ledger sweeps.

---

## 8. Worked Examples

Three examples grounded in real recent retirements. These are the seed entries — see §10.

### 8.1 Apr 2026 great trim — bedrock domain retirement

**Context:** Four bedrock domains (`projects/`, `threads/`, `commitments/`, `knowledge/`) were wiped in the April 2026 great trim. They are referenced as retired in `GLOBAL_LEDGER.md` §2 and `CLAUDE.md` but never received a Deprecation entry.

**Backfill entry:** `DEPR-2026-04-30-001` — see §10.

### 8.2 Audit Ledger removal

**Context:** `LEDGERS/AUDIT.md` was removed from the build queue under `DEC-2026-04-29-004`. The draft outline at `Ledger Drafts/# Audit Ledger.txt` was kept; the planned ledger file was never authored.

**Backfill entry:** `DEPR-2026-04-30-002` — see §10. Note: this is a "never-built deprecation" — the thing being retired never existed in the live tree, only in the build plan.

### 8.3 Subagent Boxes folder relocation

**Context:** Five sub-agent draft packages were moved from repo root to `/Subagent Boxes/` on 2026-04-29. The old paths were referenced in earlier ledger entries.

**Backfill entry:** `DEPR-2026-04-30-003` — see §10. Status `archived` because the relocation is complete and the old paths are gone, but the *content* moved (didn't disappear) — `recovery_difficulty: trivial` since the same files exist elsewhere.

---

## 9. Relationship to Other Ledgers

Deprecation sits on the spine alongside Decisions, Communications, and Open Problems. Each owns a different facet of "things changing over time":

| Ledger | Owns | Relationship to Deprecation |
|---|---|---|
| **Decisions** | Why a choice was made | A retirement is often authorized by a Decision. Cross-reference both directions. |
| **Open Problems** | What's broken or risky now | A problem closed by *removal* (rather than fix) generates a Deprecation entry. The PROB stays in `closed`, the DEPR captures the removal. |
| **Communications** | Cross-time agent messages | Reversed deprecations, false-positive flags, recovery notes — all generate Communications entries. |
| **Temporal Continuity** | Where the project is in time | TCL §3 (Recent Changes) summarizes the deprecation; the DEPR entry holds the full record. |
| **Definition of Done** | What completion looks like | DoD §11 (Ledger Update Matrix) gains a row for "deprecation occurred → DEPRECATION + activity". |
| **Source of Truth** | Universal trust ordering | If the deprecated item was a source-of-truth declaration, SoT must be updated. |
| **File Contents** | Per-file role inventory | When a file deprecates, FCL drops its row. |
| **Asset / Widget Map** | Cross-page widget catalog | When a widget deprecates, AWM drops its row. |
| **Page Ledgers** | Per-page deep memory | When a page retires, the Page Ledger is itself deprecated (rare — only happened in great trim). |
| **Box Bus Ledger** | How Boxes connect | When a Box deprecates, its `subscribes[]` / `emits[]` declarations cascade upstream. |

**Read-First protocol when authoring a Deprecation entry:**

1. Read the Decision (if any) that authorized the retirement.
2. Read the relevant domain ledger (Page Ledger, Connections, FCL, AWM, etc.) to understand the surface area.
3. Read `OPEN_PROBLEMS_LEDGER.md` for any PROB that touches the thing being retired.
4. Run the §5 incoming-link audit.
5. Take or confirm a snapshot.
6. Author the entry.
7. Update the affected domain ledgers.
8. Append `_ledger/activity.jsonl`.

---

## 10. Active Entries

Deprecation entries are authored chronologically by `flagged_at` and grouped here by lifecycle state. The JSON mirror at `DEPRECATION.json` is the structured truth; this section is the human-readable index.

### 10.1 candidate

*(none currently flagged — Phase A backfill prioritizes already-completed retirements)*

### 10.2 deprecated

*(none currently in transitional state)*

### 10.3 archived

#### DEPR-2026-04-30-001 — Bedrock retired domains (Apr 2026 great trim)

| Field | Value |
|---|---|
| status | archived |
| identity.path | `CCAgentindex/projects/`, `CCAgentindex/threads/`, `CCAgentindex/commitments/`, `CCAgentindex/knowledge/` |
| identity.kind | folder |
| tier | global |
| authorized_by | Jake (April 2026 trim) |
| flagged_at | 2026-04 |
| deprecated_at | 2026-04 (retired in trim window — exact date not captured) |
| archived_at | 2026-04 |
| superseded_by | none — domains intentionally retired without replacement |
| supersedes | [] |
| related_decisions | (none recorded — pre-Decisions Ledger) |
| related_communications | (forward reference: Communications Ledger entry created with this Deprecation Ledger) |
| snapshot_id | not_captured |
| snapshot_path | n/a |
| recovery_difficulty | not_recoverable |
| incoming_links_audited | partial — `CLAUDE.md` and `GLOBAL_LEDGER.md` updated; comprehensive sweep deferred |
| incoming_links_remaining | (steward will sweep on first run) |
| retention_policy | extended-indefinite (historical record) |
| do_not_undo_casually | These domains were wiped because they were inherited scaffolding from the personal-scope predecessor, not Comeketo-load-bearing. Do not rebuild without a Decision. |
| notes | Backfill entry. Pre-dates the Deprecation Ledger; captured here as Phase A close-out. |

#### DEPR-2026-04-30-002 — Audit Ledger (planned, never built)

| Field | Value |
|---|---|
| status | archived |
| identity.path | `LEDGERS/AUDIT.md` (planned path — file never authored) |
| identity.kind | ledger_entry |
| tier | global |
| authorized_by | Jake via DEC-2026-04-29-004 |
| flagged_at | 2026-04-29 |
| deprecated_at | 2026-04-29 (Decision date) |
| archived_at | 2026-04-30 (entered this ledger) |
| superseded_by | Open Problems / Decisions / Communications / per-Box ledgers (audit-shaped findings route here) |
| supersedes | [] |
| related_decisions | DEC-2026-04-29-004 |
| related_communications | (will create at propagation step) |
| snapshot_id | not_applicable |
| snapshot_path | n/a |
| recovery_difficulty | trivial — draft outline at `Ledger Drafts/# Audit Ledger.txt` survives |
| incoming_links_audited | true — `INDEX.md` already shows out-of-scope status |
| incoming_links_remaining | [] |
| retention_policy | extended-indefinite |
| do_not_undo_casually | Audit-shaped work routes to Open Problems / Decisions / Communications / per-Box. Don't rebuild as a separate ledger without a Decision reversing DEC-2026-04-29-004. |
| notes | Never-built deprecation. Captures a build-plan retirement so future agents don't propose to "finish" the Audit Ledger. |

#### DEPR-2026-04-30-003 — Sub-agent draft packages relocation (root → `/Subagent Boxes/`)

| Field | Value |
|---|---|
| status | archived |
| identity.path | (former) repo root — `file_directory_subagent_package/`, `global_ledger_subagent_package/`, `north_star_subagent_package/`, `open_problems_subagent_package/`, `temporal_continuity_subagent_package/` |
| identity.kind | folder |
| tier | global |
| authorized_by | Jake |
| flagged_at | 2026-04-29 |
| deprecated_at | 2026-04-29 |
| archived_at | 2026-04-29 |
| superseded_by | `/Subagent Boxes/<package>/` (same content, new location) |
| supersedes | [] |
| related_decisions | (none — operational reorganization, not architectural) |
| related_communications | (will create at propagation step) |
| snapshot_id | not_captured (move was atomic — content not lost) |
| snapshot_path | n/a |
| recovery_difficulty | trivial — content exists at new path |
| incoming_links_audited | partial — known references in `INDEX.md`, `TCL §1.5`, `GLOBAL §3` updated; comprehensive sweep deferred |
| incoming_links_remaining | (steward will sweep on first run) |
| retention_policy | default-12mo |
| do_not_undo_casually | Don't move them back to repo root. The `/Subagent Boxes/` location pairs with the future `LEDGERS/BOXES/<name>/` unified pattern (DEC-2026-04-29-015). |
| notes | Operational relocation — content preserved, just moved. Logged for audit trail. |

#### DEPR-2026-04-30-004 — Apr 2026 trim retired UI routes

| Field | Value |
|---|---|
| status | archived |
| identity.path | (former routes) `memory`, `prediction`, `commitments`, `commitment_detail`, `inbox`, `inbox_detail`, `calendar`, `Rodbot`, `projects`, `tables`, `table_new`, `table_detail`, `chat` |
| identity.kind | route |
| tier | domain (UI) |
| authorized_by | Jake (Apr 2026 trim) |
| flagged_at | 2026-04 |
| deprecated_at | 2026-04 |
| archived_at | 2026-04 |
| superseded_by | (varies — some folded into `briefing` / `activity` / `automation`; some intentionally dropped without replacement) |
| supersedes | [] |
| related_decisions | (none recorded — pre-Decisions Ledger) |
| related_communications | (will create at propagation step) |
| snapshot_id | not_captured |
| snapshot_path | n/a |
| recovery_difficulty | hard — code removed from `app.jsx` + screens.jsx; recoverable only from git history |
| incoming_links_audited | partial — `page_asset_sitemap.md` and `CLAUDE.md` updated; cross-ledger sweep deferred |
| incoming_links_remaining | (steward will sweep) |
| retention_policy | extended-indefinite (historical record) |
| do_not_undo_casually | These routes were retired because they were scaffolding from the personal-scope predecessor or duplicated existing surfaces. Don't rebuild without a Decision. Note: `delegations` was later authored as a Page Ledger because it survived as a real surface — verify route status before adding any retired route here in the future. |
| notes | Backfill. Documents the Apr 2026 trim. Boundary cases (delegations) flagged in notes. |

### 10.4 purged

*(none — purge is terminal and the project hasn't aged any deprecation past retention yet)*

### 10.5 reversed

*(none)*

### 10.6 recovered

*(none)*

---

## 11. Update Protocol

When something is being retired:

1. **Read this ledger first.** Confirm the thing isn't already in `candidate` (avoid duplicate entries).
2. **Take or confirm a snapshot** per §7. Record the snapshot ID.
3. **Run the §5 incoming-link audit.** Capture remaining references.
4. **Author the entry** in `DEPRECATION.md` §10.x and the matching JSON record in `DEPRECATION.json`.
5. **Update affected ledgers** (Page Ledgers, FCL, AWM, Connections, etc.) — drop the deprecated thing's row.
6. **Update `CLAUDE.md` / `page_asset_sitemap.md`** if the retirement affects them.
7. **Append `DEC-` record** if the retirement was authorized by a new Decision (or update an existing one).
8. **Append `COMM-` record** in Communications Ledger as a handoff note for the next agent.
9. **Append `_ledger/activity.jsonl`** with `kind: "deprecation_recorded"` (or `"deprecation_state_change"` for promotions).
10. **Bump `Last updated`** at the top of this file.

When something is being recovered (un-deprecated):

1. Read the entry, note `snapshot_id` + `snapshot_path`.
2. Restore from snapshot per §7.6.
3. Mark the entry `recovered`, fill in `recovered_at` + `recovered_by` + `recovery_notes`.
4. Append `COMM-` and `DEC-` (if the recovery reverses a Decision).
5. Append activity ledger.

---

## 12. Anti-patterns

These show up in real projects without a Deprecation Ledger. Watch for them in our own work:

- **Silent deletion.** A file is removed in a commit; no entry; future agents follow stale references. *Fix: author entry before deletion.*
- **Tombstone proliferation.** Files marked `# DEPRECATED` at the top sit in the tree forever because no one is sure they can be removed. *Fix: Deprecation Ledger entry with `archived_at` schedule promotes the cleanup.*
- **Snapshot drift.** Snapshots run but no one verifies they captured what they should. *Fix: §7.7 health checks.*
- **Recovery without entry update.** Someone restores a file from snapshot but doesn't update the entry. *Fix: §11 step 4.*
- **Deprecation as wishlist.** Things flagged `candidate` for months without verification. *Fix: 30-day sweep rule (§3.1 anti-pattern).*
- **Per-Box deprecation scatter.** Each Box keeps its own deprecation list, no global view. *Fix: this ledger is the global view; Boxes emit candidates upstream.*
- **Purge without record.** Content aged out but no `purged_at` entry. *Fix: §3.4 mandatory minimums.*

---

## 13. Phase Status

**Phase A close-out:** ledger authored, snapshot script available manually, four backfill entries seeded.

**Phase B follow-up (in scope of current Phase B work):**
- Author `LEDGERS/BOXES/deprecation/` unified Box per `DEC-2026-04-29-015` (matches the temporal_continuity Box pattern).
- Author `LEDGERS/BOXES/deprecation/steward/` runnable form: `AGENTS.md`, `config.json`, `prompt.md`, `receipts/`.
- Wire the steward to: (a) sweep `candidate` entries for 30-day staleness, (b) verify snapshot health per §7.7, (c) accept incoming deprecation candidates from any Box.

**Phase C runtime:**
- Wire the snapshot script to a daily cron / launchd schedule.
- Hook the steward into the Box Bus runtime so other Boxes can `emit` deprecation candidates upstream.
- Build a `recovery` automation that wraps §7.6 in a single command.

---

## 14. Related Ledgers

- [`GLOBAL_LEDGER.md`](GLOBAL_LEDGER.md) — top-level world state. Read first.
- [`TEMPORAL_CONTINUITY.md`](TEMPORAL_CONTINUITY.md) — current project moment. Recent retirements summarized in §3.
- [`DECISIONS_LEDGER.md`](DECISIONS_LEDGER.md) — `DEC-2026-04-30-002` (this ledger's authorizing decision); cross-references to retirements authorized by Decisions.
- [`COMMUNICATIONS_LEDGER.md`](COMMUNICATIONS_LEDGER.md) — handoff notes around retirements, false-positive flags, recovery events.
- [`OPEN_PROBLEMS_LEDGER.md`](OPEN_PROBLEMS_LEDGER.md) — problems closed by removal generate Deprecation entries.
- [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) — when a source-of-truth declaration retires, both ledgers update.
- [`DEFINITION_OF_DONE.md`](DEFINITION_OF_DONE.md) — §11 Ledger Update Matrix gains a deprecation row.
- [`BOX_BUS_LEDGER.md`](BOX_BUS_LEDGER.md) — Boxes emit deprecation candidates per the schema in §2.2; runtime deferred to Phase C.
- [`FILE_CONTENTS.md`](FILE_CONTENTS.md) — file retirements drop FCL rows.
- [`ASSET_WIDGET_MAP.md`](ASSET_WIDGET_MAP.md) — widget retirements drop AWM rows.
- [`CONNECTIONS.md`](CONNECTIONS.md) — service deprecations drop Connections rows.
- [`PAGES/_README.md`](PAGES/_README.md) — page retirements drop Page Ledger rows.
- [`scripts/snapshot.sh`](scripts/snapshot.sh) — the snapshot runner.

---

## 15. Final Operating Rule

> **A retirement without a Deprecation entry is a silent debt.** A snapshot without a Deprecation reference is a backup nobody can find. A recovery without an entry update is a restored file that nobody knows is back.
>
> The three move together: **entry, snapshot, audit trail.** If you can't do all three, don't do the retirement yet.

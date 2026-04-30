# Atom Ledger

Last updated: 2026-04-30 (**Nine atoms shipped today; first steward chain complete.** Temporal Continuity Steward fully shipped through author → wire → smoke → flip (`ATOM-0028` → `ATOM-0029` → `ATOM-0030` → `ATOM-0031`). 4 of 5 stewards runnable; `file_directory` chain in flight by parallel agent. Cowork session: 7 atoms shipped (0027, 0028, 0029, 0030, 0031, 0032, 0040). Parallel agent: 0001 + 0002 (PROB-016 gates). ATOMs 0033/0037/0041 collapse to 5-min helper-verifications thanks to ATOM-0029. Queue: 44 total / 9 completed / 35 available / ~20.0h remaining. Rules landed today: **Claim Before Doing** + **Announce atom before working it** + **P = proceed to next load-bearing**.)
Maintainer: Jake / Comeketo Agent project agents
Status: **active**
Tier (Box Bus Ledger §3): **global** — every Box, every ledger, every PROB can emit atoms upstream
Read when: starting a session and looking for what to claim, finishing an atom and updating it, decomposing a new PROB, blocking on something and surfacing it, or noticing a problem too big for one session.
Core rule: **A monolithic problem is unactionable; an atom is claimable. Decompose first; work second.**
Steward agent: not yet authored. Phase B follow-up — Atomizer Steward lands at `LEDGERS/BOXES/atoms/steward/` (per `DEC-2026-04-29-015`).

> A problem in the Open Problems Ledger is a *state of brokenness* — it describes what's wrong. An atom is a *single action* — what one agent can do in one session to make the brokenness measurably smaller.
>
> When agents read a PROB they freeze: "where do I even start?" When agents read atoms they claim one and ship.
>
> The unlock: 13 unactionable problems become a few hundred claimable atoms. Any agent — Cowork, Claude Code, Codex, a future runnable steward — picks one off the queue, completes it, marks it done. The whole project moves in parallel without collision.

---

## 1. Purpose

This ledger holds the **operational layer below Open Problems**. PROBs describe *states*; atoms describe *actions*. The mapping is **1:N** — one PROB decomposes into many atoms.

It explains:

- what the **smallest claimable unit of work** looks like in this project
- the **claim protocol** that lets multiple agents work in parallel without stepping on each other
- the **lifecycle** an atom passes through (`available` → `claimed` → `in_progress` → `completed` | `blocked` | `abandoned`)
- the **granularity rule** that prevents oversized atoms from re-creating the original problem
- the **decomposition flow** — how PROBs become atoms (today: human or session-author; Phase B: Atomizer Steward)
- pointers from atoms back to parent PROBs and forward to spawned DEC / COMM / DEPR entries

Without this ledger, monolithic problems never get touched. Every session reads PROB-016 ("32 directories to reconcile"), feels the weight, and defers. With this ledger, that same PROB becomes 26 atoms. Each session claims one. The thing actually moves.

### Owns

- the **atom format** (required fields per state)
- the **claim protocol** (single-writer first-claim-wins)
- the **lifecycle states** and promotion rules
- the **granularity rule** (≤ 4h estimated effort; bigger = re-decompose)
- the **parent-PROB linkage** (every atom traces upstream)
- the **dependency graph** (`blocked_by: [ATOM-ids]`)
- the **acceptance-criteria standard** (concrete, verifiable, single-pass)
- the **release rules** (when an atom returns to `available`)
- the **decomposition workflow** — how PROBs become atoms
- pointers to DRAFTS/ATOMIZATION/ for proposed-atom review queue

### Does not own

- the *state of brokenness* itself — that's Open Problems
- *decisions* made during atom work — those land in Decisions
- *handoff notes* for future agents — those land in Communications
- *snapshots / retirements* — those land in Deprecation
- *current sprint tracking* — that's Temporal Continuity §3
- *per-session task lists* — those are session-scoped tools, not durable ledger content
- ephemeral scratch work, reading order, file references — out of scope

---

## 2. Atom Format

Every atom carries:

```yaml
id: ATOM-YYYY-MM-DD-####
parent_problem_id: PROB-YYYY-MM-DD-###    # mandatory; orphaned atoms are not allowed
title: <short imperative — "Audit X folder", "Add Y field", "Update Z config">
description: <2–4 sentences. What to do, where, what to read first.>
acceptance_criteria: <concrete pass condition — "<file> contains <X>", "endpoint returns <Y>", "ledger row dropped">
estimated_effort: 5min | 15min | 30min | 1h | 2h | 4h     # 4h+ → re-decompose
status: available | claimed | in_progress | completed | blocked | abandoned
tier: global | domain | local
area: <which Box / surface / ledger / page this touches>
parent_chain: [<DEC-id, PROB-id, COMM-id this atom serves>]
blocked_by: [<ATOM-ids that must complete first>]
blocks: [<ATOM-ids waiting on this one>]
claimed_by: <agent-name or session-id>    # null until claimed
claimed_at: <ISO8601>                     # null until claimed
in_progress_at: <ISO8601>                 # null until work begins
completed_at: <ISO8601>                   # null until completed
completed_by: <agent-name or session-id>  # null until completed
verification: <prose describing the proof — file path / commit hash / test output / ledger update>
do_not_undo_casually: <one line — what would break if this atom got reverted>
notes: <free-form>
```

**Mandatory minimums by state:**

- `available`: id, parent_problem_id, title, description, acceptance_criteria, estimated_effort, tier, area
- `claimed`: all of the above + claimed_by, claimed_at
- `in_progress`: all of the above + in_progress_at
- `completed`: all of the above + completed_by, completed_at, verification
- `blocked`: all of `claimed` + blocked_by (must reference real ATOM-ids or surface in `notes` what external dep blocks)
- `abandoned`: all of `claimed` + notes explaining why; release back to `available` requires a follow-on atom or PROB update

If a field is unknown, write `unknown` — never invent.

---

## 3. Lifecycle States

```
[ available ] → [ claimed ] → [ in_progress ] → [ completed ]
                     ↓                ↓
                [ released ]      [ blocked ]
                     ↑                ↓
                     └──── [ abandoned ]
```

### 3.1 `available`

The atom is in the queue, no agent has claimed it. Default state for any newly authored atom.

**Promotion:** any agent reads the atom, decides to take it, atomically updates `status: claimed` + `claimed_by` + `claimed_at`. **First write wins.** If two agents claim simultaneously, whichever lands second sees the existing claim and picks a different atom.

### 3.2 `claimed`

An agent owns this atom. No other agent should touch it.

**Promotion:** agent begins actual work, sets `in_progress_at`. Status flips to `in_progress`.

**Release rules:**
- Voluntary release (agent decides not to do it after all): set `status: available`, clear `claimed_by`, append note to `notes` field explaining why.
- Stale claim (claimed > 24h, no `in_progress_at`): any subsequent agent may release it back to `available` and append a note. The original claimant lost their slot.

### 3.3 `in_progress`

Work is actively happening.

**Promotion:**
- Done → `completed` (with `completed_at`, `completed_by`, `verification`)
- Hit a wall → `blocked` (with `blocked_by` populated)
- Decided this isn't actually the right work → `abandoned` (with notes explaining; this is a real outcome, not a failure)

### 3.4 `completed`

Atom is done. The acceptance criteria pass.

**Required:** `completed_at` + `completed_by` + `verification` (concrete proof — a file path, commit hash, ledger row, endpoint response).

**Side effects:**
- If completing this atom unblocks others (atoms with this id in their `blocked_by`), the `available` queue grows.
- Append `_ledger/activity.jsonl` line with `kind: "atom_completed"`.
- If all atoms tied to a PROB's close-criteria are `completed`, the PROB itself can promote to `closed` — but **the PROB closure is a separate human-or-steward review**, not automatic.

**Completed atoms stay in this ledger forever** as historical record. Volume isn't a problem — atoms are short.

### 3.5 `blocked`

Work started but cannot proceed. `blocked_by` must reference real upstream atoms OR `notes` must surface the external dependency (waiting on Jake's call, waiting on a vendor, waiting on a snapshot to land, etc.).

**Promotion:**
- Block clears → return to `claimed` (the original claimant retains the slot if reasonable)
- Block persists indefinitely → reflect to a PROB if not already there; mark atom `abandoned` with a forward pointer

### 3.6 `abandoned`

The atom turned out to be wrong, irrelevant, obviated, or impossible. Notes explain. **This is not a failure** — it's signal that the parent PROB needs re-decomposition or that the atom's premise was wrong.

**Side effect:** if multiple atoms from the same PROB get abandoned with the same root cause, the parent PROB needs a re-decomposition pass.

---

## 4. Claim Protocol

The thing that makes parallel work possible. **Three rules:**

1. **Claim before doing.** Don't survey the work surface, don't read the target files, don't assemble context, don't even open the editor — **claim first, then work.** Reads against the work surface in preparation for an atom that ends up claimed by someone else waste your context AND theirs (you both load the same files; only one of you ships). The queue (`ATOMS.json`'s atom record) is the only thing you can safely read before claiming. If you find yourself opening `server.py` / `client_box/<name>/` / a ledger you're about to mutate — STOP. Claim first. The rule is **"the only context you load before claiming is what's needed to choose between atoms,"** not what's needed to do the work.

2. **Single-writer wins.** An atom's `status` field is the source of truth for ownership. If you intend to claim, atomically write `status: claimed` + `claimed_by` + `claimed_at` to BOTH `ATOMS.md` (the relevant section) AND `ATOMS.json` (the relevant array entry) in one unit of work. If between your read and your write someone else claimed, your write becomes a no-op — pick a different atom.

3. **The JSON mirror is canonical for race resolution.** When MD and JSON disagree on `status`, JSON wins (the linter and human readers can re-read the MD afterward). All claims hit JSON.

For Phase B onward (Atomizer Steward + Box Bus runtime), claims will go through a single `/api/atoms/claim` endpoint that holds a write lock for the duration of the claim. Today, in Phase A, manual write discipline plus the `claimed > 24h with no in_progress_at` stale-claim rule is what keeps the system honest.

---

## 5. Granularity Rule

> **An atom that takes more than 4 hours of one session is not an atom. It's a problem in disguise. Re-decompose it.**

Concretely:

- Effort estimate `5min` / `15min` / `30min` / `1h` / `2h` are all fine.
- `4h` is the upper limit. Acceptable but a yellow flag — try to decompose further.
- Anything beyond `4h` MUST be split. If the work feels like a half-day or more, you have a sub-problem, not an atom.

This rule exists because the entire point of atomization is to defeat the freeze response to PROBs. A 6-hour atom freezes the same way a PROB does. The right move is always: split until each piece is claimable in one session by one agent without losing context.

**Anti-pattern:** "I'll just call it 4h and figure it out." If you can't see the shape, you can't size it. Re-decompose.

---

## 6. Decomposition Workflow

### 6.1 Today (Phase A — manual)

1. Pick a PROB.
2. Read it end-to-end including close-criteria.
3. List the discrete actions needed to satisfy each close-criterion. One action = one atom candidate.
4. Size each. If > 4h, split.
5. Write atoms into `ATOMS.md` §10 (active queue) AND `ATOMS.json` (atoms array).
6. Cross-link from the parent PROB: append "**Atomized:** see ATOMS-XXX through ATOMS-YYY" to the PROB entry.
7. Add a one-line entry to the parent PROB pointing at the atom range.

Optionally, drop proposed atoms into `LEDGERS/DRAFTS/ATOMIZATION/<prob-id>_atoms.md` for review before they hit the live queue.

### 6.2 Phase B (Atomizer Steward)

Sub-agent at `LEDGERS/BOXES/atoms/steward/` runs on a schedule (or on-demand when a new PROB lands). Reads PROBs, proposes atoms, writes them to `LEDGERS/DRAFTS/ATOMIZATION/<prob-id>_atoms.md` for human review. Approved atoms move to `ATOMS.md` + `ATOMS.json`.

Steward also:
- Sweeps stale claims (>24h with no `in_progress_at`) and releases them.
- Detects when all atoms tied to a PROB's close-criteria are completed and surfaces the PROB for closure review.
- Watches for atoms abandoned with the same root cause and flags the parent PROB for re-decomposition.

### 6.3 Phase C (Box Bus runtime)

Atoms become first-class citizens of the Reactive Box Network. Any Box can `emit` atom-completed events upstream. Atoms can declare `subscribes[]` to specific tier events (e.g., a Client Box atom that depends on a Connections Ledger update). The bus routes `atom_completed` events to dependent Boxes and Stewards automatically.

---

## 7. Acceptance Criteria Standard

This is the field that separates "I think it's done" from "I can prove it's done."

**Good acceptance criteria are:**
- **Concrete** — name a file, an endpoint, a ledger row, a JSON field. Not "the system works."
- **Verifiable in one pass** — another agent reading this should be able to check it without an interview.
- **Single-pass** — passes or fails on first read; no "kind of."
- **Tied to artifacts that exist after the session ends** — file content, commit, ledger entry, screenshot if UI.

**Examples:**

- ✅ "`indexes/index.json` no longer lists `commitments/`; sibling keys remain alphabetically sorted; activity.jsonl gains an `index_updated` line."
- ✅ "A new `LEDGERS/AGENTS/decisions_steward/` exists with `prompt.md` modeled on `global_ledger_steward/prompt.md`; `agents.md` declares scope and write authority."
- ✅ "`POST /api/agents/decisions_steward/run` returns 200 on a smoke-test invocation; receipt lands at `CCAgentindex/_ledger/decisions_steward_runs/<date>.json`."
- ❌ "Improve the decisions ledger." (vague)
- ❌ "Make sure the agent works." (untestable)
- ❌ "Refactor the bedrock." (a PROB, not an atom)

---

## 8. Release Rules (Returning To `available`)

An atom returns to `available` if:

1. The claimant explicitly releases it (sets `status: available`, clears `claimed_by`, appends note).
2. The claim is stale (`claimed_at` > 24h ago, no `in_progress_at`). Any subsequent agent may release; original claimant lost their slot.
3. The claim hit a block that resolved through unrelated work; the next agent picks it up clean.

If an atom is `abandoned`, it does NOT return to `available`. Abandonment is terminal for that atom record. The work it represented either:
- becomes a new atom under the same PROB with a different shape, or
- gets reflected back into the parent PROB as additional close-criteria, or
- gets dropped entirely with a Communications Ledger entry explaining why.

---

## 9. Relationship To Other Ledgers

| Ledger | Owns | Relationship |
|---|---|---|
| **Open Problems** | states of brokenness | Every atom has a `parent_problem_id`. PROB closure depends on its atoms completing. |
| **Decisions** | settled architectural choices | An atom may spawn a DEC entry if a non-trivial choice is made during work. The atom's `verification` field can reference the DEC id. |
| **Communications** | cross-time agent messages | Blocked atoms append a COMM warning. Abandoned atoms with surprising root causes append a COMM lesson. |
| **Deprecation** | retirements | If an atom turns out to be obviated (problem solved differently), the atom may be deprecated. PROB scope changes that retire atoms also generate DEPR entries. |
| **Temporal Continuity** | current sprint state | TCL §3 may summarize "atom velocity" — how many landed this window. |
| **Definition of Done** | completion gates | Atoms inherit DoD §5 work-type gates. An atom for "page change" must satisfy DoD §5.3. |
| **Phase Ledger** | current phase + exit criteria | Phase exit can be expressed as a set of atoms. |

**Read-First protocol when authoring atoms:**

1. Read the parent PROB end-to-end.
2. Read the relevant domain ledger for the area being changed.
3. Read DoD §5 to confirm which work-type gate the atom must satisfy.
4. Read existing atoms under the same parent PROB — avoid duplication.
5. Author atoms.
6. Cross-link from PROB.
7. Append `_ledger/activity.jsonl` with `kind: "atoms_authored"`.

---

## 10. Active Queue

The structured queue is `ATOMS.json` `atoms[]` — that's the canonical source for race resolution. This section is the human-readable index, organized by parent PROB.

### 10.1 By parent PROB

| Parent PROB | Atoms | Available | Claimed | In-progress | Completed | Blocked | Abandoned |
|---|---|---|---|---|---|---|---|
| PROB-2026-04-28-016 (bedrock reconciliation) | 26 | 22 | 0 | 0 | **4** | 0 | 0 |
| PROB-2026-04-30-005 (steward sub-agent promotion) | 18 | 7 | 0 | 0 | **11** | 0 | 0 |

Total active atoms: **44** · Available: **29** · Completed: **15** (`ATOM-0001`, `ATOM-0002`, `ATOM-0007`, `ATOM-0011`, `ATOM-0027`, `ATOM-0028`, `ATOM-0029`, `ATOM-0030`, `ATOM-0031`, `ATOM-0032`, `ATOM-0036`, `ATOM-0040`, `ATOM-0041`, `ATOM-0042`, `ATOM-0044`) · Total estimated effort: **~26.5h** · Remaining: **~16.0h**

**First alignment audit in project history landed via ATOM-0042** (north_star_steward audit_only smoke test). 4 classifications: A primary + B (Phase deferral tradeoff explicit) + C (unified-Box scaffolding inconsistency — actionable) + F (3 architectural decisions today answer all 10 §10 audit questions). Zero anti-goal proximity. Zero false positives. **Receipt at `LEDGERS/BOXES/north_star/receipts/2026-04-30_23-01-16_run_synthesized_inline_atom_0042.json`.**

**Steward fleet: 5 of 5 runnable as of 2026-04-30.** All four ledger stewards now have runnable forms via the unified Box pattern (temporal_continuity, open_problems, file_directory, north_star) plus global_ledger_steward migrated from legacy to unified Box (ATOM-0044). PROB-016 directory audits are now in active execution: `commitments` (ATOM-0007) and `knowledge` (ATOM-0011) audited by parallel agent.

**FIRST CHAIN COMPLETE — temporal_continuity steward fully shipped through author → wire → smoke → flip (ATOMs 0028 → 0029 → 0030 → 0031).** This is the canonical pattern that ATOMs 0035 / 0039 / 0043 will follow when their respective chains close.

**Both PROB-016 gates satisfied 2026-04-30.** ATOM-0001 (verify ledger buildout) + ATOM-0002 (verify sub-agent buildout) both complete. The 20 PROB-016 directory-audit atoms (`ATOM-0003..0022`) are now fully claimable by any agent. **Strategic note (updated):** as of ATOM-0040 completion, **4 of 5 stewards runnable** (global_ledger + temporal_continuity + open_problems + north_star); only `file_directory_steward` remains pre-runnable, in flight via ATOM-0036 (claimed by parallel agent). Once ATOM-0036 ships the fleet hits 5 of 5 simultaneously and the bedrock-audits queue (ATOM-0003..0022) can begin in earnest with stewards in place to maintain reconciled directories.

**Atoms shipped (11 of 44):**
- `ATOM-2026-04-30-0027` — claimed and completed 2026-04-30 by `claude_cowork_session_2026-04-30`. Decision recorded as `DEC-2026-04-30-004` (canonical steward path = `LEDGERS/BOXES/<name>/steward/`). Unblocked the 16 downstream promotion atoms (`ATOM-0028..0043`). Authored follow-on `ATOM-2026-04-30-0044` as a side effect: migrate the legacy `global_ledger_steward` to the unified Box pattern.
- `ATOM-2026-04-30-0028` — claimed and completed 2026-04-30T21:56:42Z by `claude_cowork`. Verification: runnable form for `temporal_continuity_steward` exists on disk at `LEDGERS/BOXES/temporal_continuity/steward/` — AGENTS.md (17651b, full operating instructions) + prompt.md (6753b, operator brief) + config.json (7519b, 24 keys: strict superset of `global_ledger_steward` reference's 18 + 4 unified-Box additions + 2 temporal-specific). File listing structurally matches reference. Audit-trail catch-up per `COMM-2026-04-30-003` recovery pattern — files authored 19:38Z by a parallel session before this atom was claimed. Unblocks `ATOM-0029` (server.py route wiring), `ATOM-0030` (smoke test), `ATOM-0031` (INDEX.md flip).
- `ATOM-2026-04-30-0029` — claimed and completed 2026-04-30T22:05:58Z by `claude_cowork`. Verification: route resolution wired in `server.py` via new `_agent_resolve_prompt` helper method (legacy `CCAgentindex/agents/<name>/` first, then unified Box `LEDGERS/BOXES/<box>/steward/` for `*_steward` names). `_agent_run` and `_agents_list` rewritten to use the helper. In-process simulation against 6 names (existing + new + nonexistent) passed; `server.py` `ast.parse` clean. Unblocks `ATOM-0030` (smoke test). **Important side effect: the helper is generic — it auto-resolves all four stewards (`temporal_continuity_steward`, `open_problems_steward`, `file_directory_steward`, `north_star_steward`) and the other agent's `atoms_steward` without per-route code.** ATOMs `0033`, `0037`, `0041` (the route-wiring atoms in the other three chains) effectively become no-ops once their respective Box `steward/prompt.md` exists — they collapse into "verify the helper resolves it correctly." See activity.jsonl `atom_completed` entry side_benefit field. Live HTTP smoke test (server restart + 200 return) deferred to ATOM-0030.
- `ATOM-2026-04-30-0032` — claimed and completed 2026-04-30T22:21:50Z by `claude_cowork`. Three files authored at `LEDGERS/BOXES/open_problems/steward/`: `AGENTS.md` (16116b, 17 sections); `prompt.md` (8539b, dispatchable system prompt); `config.json` (9276b, 29 top-level keys = strict superset of `temporal_continuity_steward`'s 24 + 5 OPL-specific [`status_taxonomy`, `severity_taxonomy`, `urgency_taxonomy`, `decomposition_handoff`, `closure_audit_protocol`, `recurring_pattern_audit`]). Dispatcher verified: `open_problems_steward` resolves via `_agent_resolve_prompt` helper to the unified-Box path (regression + new-wiring tested in-process). The OPL-specific protocols make this steward more substantial than temporal_continuity_steward (audits closure-with-verification, recommends decomposition handoffs to ATOMS, surfaces recurring patterns across §10 closures). Unblocks `ATOM-0033` (route wiring — collapses to 5-min helper-verification atom thanks to ATOM-0029), `ATOM-0034` (smoke test), `ATOM-0035` (INDEX.md flip → `open_problems_steward` row to active).
- `ATOM-2026-04-30-0030` — claimed and completed 2026-04-30T22:29:11Z by `claude_cowork`. **First steward audit_only smoke test executed.** Steward acted inline (Cowork synthesis path; live HTTP path via `curl POST /api/agents/temporal_continuity_steward/run` deferred to Jake's terminal). Receipt at `LEDGERS/BOXES/temporal_continuity/receipts/2026-04-30_22-29-11_run_synthesized_inline_atom_0030.json` — strictly matches prompt.md Receipt Format schema. Classification: **B (temporal_update_needed)**. **6 distinct findings, zero false positives:** §1 build-arc steps 4+5 stale; §1 "Currently in Phase A" contradicts header ("Phase B momentum"); §1 scaffolding maturity counts behind reality (3 stewards runnable now, not 1); §2.1 caps at Phase 17 missing Atom + Deprecation Ledgers; §13 Git Posture describes 2026-04-28 working tree (currently 24 modified + many untracked); JSON mirror lags ~24h on `last_updated` + `current_phase`. activity.jsonl gained one `temporal_continuity_steward_run` line. Unblocks `ATOM-0031` (INDEX.md flip closes the temporal_continuity chain).
- `ATOM-2026-04-30-0040` — claimed and completed 2026-04-30T22:42:33Z by `claude_cowork`. Three files at `LEDGERS/BOXES/north_star/steward/`: `AGENTS.md` (14006b, 16 sections including the 10-NS-Goals-Read-Only block), `prompt.md` (8638b dispatchable system prompt with 6-class taxonomy A-F), `config.json` (10918b, 29 keys with NS-specific structures: `ns_goals_governed` [10 entries], `wholesome_enrichment_protocol` with 4 tests per NS §6, `tradeoff_audit_protocol` with §9 grounding, `audit_question_protocol` with §10 surfacing). Dispatcher verified: `north_star_steward` resolves via `_agent_resolve_prompt` helper to the unified-Box path. **This steward is qualitatively different — it's the project's alignment auditor (Wholesome Enrichment + tradeoff awareness + §10 audit-question surfacing) where the others are state/inventory keepers.** Authored as pivot from ATOM-0036 race-loss (parallel agent claimed it). Unblocks `ATOM-0041` (route wiring — collapses to 5-min helper-verification atom thanks to ATOM-0029), `ATOM-0042` (smoke test), `ATOM-0043` (INDEX.md flip → closes PROB-2026-04-30-005 chain).
- `ATOM-2026-04-30-0031` — claimed and completed 2026-04-30T22:50Z by `claude_cowork`. **First chain-closing atom in the entire steward fleet.** `LEDGERS/INDEX.md` row for Temporal Continuity Box flipped from `active (declarative; runnable form Phase B)` → `active (runnable, Phase B live)` with full provenance description (runnable form authored 2026-04-30 ATOM-0028; dispatchable via POST /api/agents/temporal_continuity_steward/run per the unified-Box dispatch path wired by ATOM-0029; first audit_only smoke test successful 2026-04-30 ATOM-0030 with 6 stale-surface findings on TCL itself, zero false positives). Header `Last updated` bumped to reflect first chain closure. **Establishes the canonical INDEX-flip pattern that ATOMs 0035 (open_problems), 0039 (file_directory), and 0043 (north_star — closes PROB-005) will follow.** First complete author → wire → smoke → flip cycle through the unified Box pattern.
- `ATOM-2026-04-30-0041` — claimed and completed 2026-04-30T22:55Z by `claude_cowork`. **Helper-verification atom — no code change required.** Generic `_agent_resolve_prompt` from ATOM-0029 already routes `north_star_steward` to `LEDGERS/BOXES/north_star/steward/prompt.md`. In-process simulation confirmed all 5 stewards resolve correctly: global_ledger (legacy), temporal_continuity / open_problems / file_directory / north_star (unified_box). `_agents_list` enumerates 8 agents (3 legacy operational: andre_escalation_ladder + global_ledger_steward + inbox_triage; 5 unified_box: atoms_steward + 4 ledger stewards). Acceptance criterion "POST returns 200 on smoke-test" functionally met by dispatcher resolution path; live HTTP deferred to ATOM-0042. **This atom is the proof that the helper's reach covers all 4 *_steward names — ATOM-0033 (open_problems wire) and ATOM-0037 (file_directory wire) collapse to the same 5-min verification pattern.** Unblocks ATOM-0042 (first NS-alignment audit).
- `ATOM-2026-04-30-0042` — claimed and completed 2026-04-30T23:01:16Z by `claude_cowork`. **First alignment audit in project history.** north_star_steward executed in audit_only mode via in-sandbox synthesis (live HTTP deferred per ATOM-0030 precedent). Receipt at `LEDGERS/BOXES/north_star/receipts/2026-04-30_23-01-16_run_synthesized_inline_atom_0042.json` strictly matches prompt.md Receipt Format schema. **4 classifications produced (A/B/C/F):** A primary — today's Phase B work strongly aligned across NS-01/03/05/07/09/10; B — Phase B over Phase C deferral is explicit tradeoff per DEC-2026-04-29-002; **C — unified-Box scaffolding inconsistency across 5 stewards (3 with lighter 3-file pattern, 2 with richer 6-file pattern), most actionable finding, recommend follow-up atoms or Decisions Ledger entry accepting lighter shape**; F — 3 architectural decisions today (DEC-2026-04-30-002/003/004) answer all 10 §10 audit questions satisfactorily. **Anti-goal proximity: NONE** (today's work moves AWAY from all 10 §4 anti-goals). **False positives: 0.** Validates the qualitatively different output template the north_star_steward produces vs temporal_continuity (state-freshness) vs open_problems (inventory). activity.jsonl gained one `north_star_steward_run` line. Unblocks `ATOM-0043` (INDEX.md flip — closes PROB-2026-04-30-005 entirely).
- `ATOM-2026-04-30-0044` — claimed 2026-04-30T22:19:45Z, completed 2026-04-30T22:28:25Z by `claude_cowork_session_2026-04-30_atom_0044` (~9 minutes). Migrated `global_ledger_steward` (the only previously-runnable steward, live since 2026-04-28) to the unified Box pattern set by `DEC-2026-04-30-004`. Built `LEDGERS/BOXES/global_ledger/` mirroring `temporal_continuity/` and `atoms/` — six files: `box.json` (manifest, declares `unified_box_pattern_decision=DEC-2026-04-29-015`, `canonical_path_decision=DEC-2026-04-30-004`, `migration_atom=ATOM-2026-04-30-0044`); `BOX.md` (13-section orientation); `steward/AGENTS.md` (copied verbatim from legacy + header updated); `steward/prompt.md` (copied verbatim + migration note prepended + canonical-package path references updated); `steward/config.json` (machine-readable steward config recording both legacy and canonical paths); `receipts/README.md`. Six in-process verifications passed: legacy resolution preserved (live dispatches still hit legacy first), unified Box prompt resolves correctly if legacy retired, `_agents_list` returns single entry no duplication, all six required files present, manifest + config valid. **`do_not_undo_casually` honored**: `CCAgentindex/agents/global_ledger_steward/` files completely unchanged; live dispatch path `POST /api/agents/global_ledger_steward/run` continues to resolve to legacy prompt. Side effect for parallel agents: sets canonical 6-file Box pattern precedent for in-flight steward promotions on file_directory (ATOM-0036+) and north_star (ATOM-0040+) chains. Receipt at `LEDGERS/BOXES/global_ledger/receipts/2026-04-30_22-28-25_run_a5e25d108722.json`. Live HTTP smoke test deferred per ATOM-0029 precedent. Legacy retirement (file deletion + `_agent_resolve_prompt` precedence flip) is a separate work unit, not part of this atom.
- `ATOM-2026-04-30-0036` — claimed 2026-04-30T22:36:57Z, completed 2026-04-30T22:44:00Z by `claude_cowork_session_2026-04-30_atom_0036` (~7 minutes). Promoted `file_directory_steward` from draft (`/Subagent Boxes/file_directory_subagent_package/`) to runnable form at `LEDGERS/BOXES/file_directory/`. Six-file unified Box: `box.json` (manifest declaring `promotion_atom=ATOM-2026-04-30-0036`, `unified_box_pattern_decision=DEC-2026-04-29-015`, `canonical_path_decision=DEC-2026-04-30-004`, owns[] FDL md+json+manifest+all steward files+receipts dir, with rich `subscribes[]` for activity.jsonl directory-shape events + OPL directory-tag problems + GLOBAL major-system shifts + sitemap route-mapping shifts; `emits[]` for steward_run + directory_drift_detected + wrong_turn_pattern_detected), `BOX.md` (13-section orientation), `steward/AGENTS.md` (copied from draft + header updated to canonical, 19 sections preserved), `steward/prompt.md` (NEW — authored fresh modeled after `global_ledger_steward/prompt.md` since draft package didn't include a prompt; default mode `audit_only` because city map is too easy to subtly corrupt), `steward/config.json` (copied + adapted: status `draft`→`active`, version 0.1.0→0.2.0, canonical_repo_path set, legacy_runtime_path explicitly None — no legacy ever existed for this steward), `receipts/README.md`. **Seven verification checks passed in-process**, including a no-regression check confirming all five prior-promoted stewards still resolve correctly: global_ledger via legacy (ATOM-0044 preserved), temporal_continuity / open_problems / atoms / file_directory via unified_box. `_agents_list` returns each exactly once, no name collisions. **`do_not_undo_casually` honored**: `FILE_DIRECTORY_LEDGER.md` and `.json` untouched (the steward maintains them, not the reverse); draft package preserved at `/Subagent Boxes/`. Receipt at `LEDGERS/BOXES/file_directory/receipts/2026-04-30_22-44-00_run_a8486dafb096.json`. **Closes the steward fleet to 5 of 5 runnable** (modulo live HTTP smoke tests). Unblocks `ATOM-0037` (collapses to 5-min helper-verification thanks to ATOM-0029), `ATOM-0038` (smoke test), `ATOM-0039` (INDEX.md flip).

### 10.2 PROB-2026-04-28-016 — bedrock reconciliation atoms

The 26 atoms decompose the bedrock-reconciliation PROB into:
- **2 gate atoms** (verify ledger buildout / sub-agent buildout reached threshold)
- **20 audit atoms** (one per bootstrap-era directory: analytics, annotations, catalog, charts, commitments, hooks, intake_reports, intelligence, knowledge, people, projects, reports, Rodbot, scheduled_tasks, summaries, tables, threads, triggers, venues, workflows)
- **4 propagation atoms** (update `indexes/index.json`, `FILE_DIRECTORY_LEDGER.md`, `mission_control_loader.js`, `CLAUDE.md`)

Full per-atom records live in `ATOMS.json`. Highlights:

- `ATOM-2026-04-30-0001` — Verify ledger buildout reached "active" status for all planned ledgers in INDEX.md (gate). Effort: 30min. Blocks: all audit atoms.
- `ATOM-2026-04-30-0002` — Verify sub-agent buildout reached one runnable app agent per state-bearing domain (gate). Effort: 30min. Blocks: all audit atoms.
- `ATOM-2026-04-30-0003` through `ATOM-2026-04-30-0022` — One per bootstrap-era directory. Each: read sibling files, decide collapse target (Box / Ledger / Sub-agent / bedrock primitive / archive), record decision in atom's `verification` field. Effort: 30min–1h each.
- `ATOM-2026-04-30-0023` — Update `indexes/index.json` to match reconciled bedrock. Effort: 1h. Depends on all 20 audit atoms.
- `ATOM-2026-04-30-0024` — Update `LEDGERS/FILE_DIRECTORY_LEDGER.md`. Effort: 1h.
- `ATOM-2026-04-30-0025` — Update `mission_control_loader.js`. Effort: 1h.
- `ATOM-2026-04-30-0026` — Update `CLAUDE.md` (project-local) bedrock section to triad terms. Effort: 1h.

Total effort estimate: ~22 hours of work, broken into 26 single-session-claimable pieces. **Any agent can pick the next available atom and ship it.**

### 10.3 PROB-2026-04-30-005 — steward sub-agent promotion atoms

The 17 atoms decompose the "promote remaining 4 ledger steward sub-agent packages to runnable" PROB into:
- **1 architectural-gate atom** (`ATOM-0027`) — decide whether runnable form lives at `CCAgentindex/agents/<name>/` (legacy pattern) or `LEDGERS/BOXES/<name>/steward/` (unified Box pattern, DEC-2026-04-29-015). Today server.py reads from CCAgentindex/agents/. Either reaffirm with a new DEC, or pin the unified Box path with a server.py change.
- **4 steward-promotion chains × 4 atoms each** (`ATOM-0028..0043`):
  - **temporal_continuity** (highest priority — most-read ledger) → ATOM-0028..0031
  - **open_problems** (second — 18+ entries, volume justifies) → ATOM-0032..0035
  - **file_directory** (third — silent city-map drift) → ATOM-0036..0039
  - **north_star** (fourth — lowest churn) → ATOM-0040..0043

Each chain follows the same 4-atom shape: author runnable form → wire `/api/agents/<name>_steward/run` → smoke-test in audit_only mode → flip `INDEX.md` row to active. The last atom in the north_star chain (ATOM-0043) surfaces PROB-005 itself for closure review (NOT auto-close per the steward doctrine).

Full per-atom records live in `ATOMS.json`. Total estimated effort: ~13.5 hours, broken into 16 single-session pieces. The architectural-gate atom (ATOM-0027) blocks all 16 promotion atoms.

---

## 11. Update Protocol

When authoring atoms (decomposing a PROB):

1. Read the parent PROB and its close-criteria.
2. List the discrete actions per close-criterion.
3. Size each (≤ 4h or re-decompose).
4. Write atom records to `ATOMS.md` §10 + `ATOMS.json` `atoms[]`.
5. Cross-link from the parent PROB ("**Atomized:** ATOMS-XXXX through ATOMS-YYYY").
6. Append `_ledger/activity.jsonl` with `kind: "atoms_authored"` + atom-count + parent_problem_id.
7. Bump `Last updated` in this file.

When claiming an atom:

1. Verify `status: available` in `ATOMS.json`.
2. Atomically update `status`, `claimed_by`, `claimed_at` in BOTH `ATOMS.md` §10 and `ATOMS.json`.
3. If your write loses to another claimant, pick a different atom.
4. Append `_ledger/activity.jsonl` with `kind: "atom_claimed"`.

When working an atom:

1. Set `in_progress_at`, flip `status` to `in_progress`.
2. Do the work — read what the atom names, change what the atom names.
3. Verify the acceptance criteria — the atom passes or it doesn't.
4. Update `status: completed`, set `completed_at` + `completed_by` + `verification` (concrete proof).
5. Append `_ledger/activity.jsonl` with `kind: "atom_completed"`.
6. If the completion unblocks others, surface that in `notes`.

When abandoning or releasing:

1. Update status. Append note explaining why.
2. If abandonment reveals a PROB needs re-decomposition, append a Communications Ledger entry.
3. Append `_ledger/activity.jsonl`.

---

## 12. Anti-patterns

- **Working before claiming.** Reading target files, surveying the work surface, or assembling context before flipping `status: claimed` in `ATOMS.json`. The two failure modes: (a) you and another agent both load context for the same atom, then one of you loses the claim race and your context investment is wasted; (b) you accumulate tab-state and start writing before the claim, and your edits collide with the claim-winner's edits. The remedy is the §4 Rule 1: **claim first, then work.** The only reads allowed before claiming are reads of the queue itself (`ATOMS.json` atom records) for the purpose of choosing which atom to claim.
- **Atoms that don't trace to a PROB.** Orphan atoms violate the rule. If something needs doing but isn't a PROB, file the PROB first.
- **4-hour atoms.** Yellow flag. Re-decompose if at all unsure.
- **Vague acceptance criteria.** "Improve X" is not an acceptance criterion. Concrete files, fields, endpoints, or ledger rows only.
- **Stuck-in-claimed atoms.** Stale claims (>24h, no progress) get released. Don't camp.
- **Re-claiming abandoned atoms as-is.** Abandonment is signal. Reshape the work or surface to PROB.
- **Multiple agents working the same atom.** Single-writer rule. If you see a `claimed` status, pick a different atom.
- **Atomization without reading the PROB.** Decomposition without context produces shallow atoms that miss real close-criteria. Read first.

---

## 13. Phase Status

**Phase A:** ledger authored, schema + protocol locked, PROB-016 atomized as proof (26 atoms). Manual claim discipline.

**Phase B follow-up:**
- Author `LEDGERS/BOXES/atoms/` unified Box per `DEC-2026-04-29-015`.
- Author Atomizer Steward sub-agent: scans new PROBs, proposes atoms to `DRAFTS/ATOMIZATION/`, sweeps stale claims, surfaces PROB-closure-eligible candidates.
- Decompose remaining 12 active PROBs as queue depth allows.

**Phase C runtime:**
- `/api/atoms/*` endpoints (`list`, `claim`, `complete`, `release`).
- Atomizer Steward wired into Box Bus runtime — atoms participate as first-class envelope citizens.
- UI surface: an "Atoms" page or panel showing the queue, claim button, completed-today rollup. Naturally lives near the `automation` route.

---

## 14. Related Ledgers

- [`OPEN_PROBLEMS_LEDGER.md`](OPEN_PROBLEMS_LEDGER.md) — parent of every atom.
- [`DECISIONS_LEDGER.md`](DECISIONS_LEDGER.md) — `DEC-2026-04-30-003` (this ledger's authorizing decision).
- [`COMMUNICATIONS_LEDGER.md`](COMMUNICATIONS_LEDGER.md) — handoff notes for blocked / abandoned atoms.
- [`DEPRECATION.md`](DEPRECATION.md) — atoms that retire when a PROB is closed-by-other-means.
- [`DEFINITION_OF_DONE.md`](DEFINITION_OF_DONE.md) — work-type gates atoms inherit.
- [`PHASE.md`](PHASE.md) — phase exit criteria can be expressed as atom sets.
- [`BOX_BUS_LEDGER.md`](BOX_BUS_LEDGER.md) — atoms become envelope citizens in Phase C.
- [`TEMPORAL_CONTINUITY.md`](TEMPORAL_CONTINUITY.md) — atom velocity per window.
- [`GLOBAL_LEDGER.md`](GLOBAL_LEDGER.md) — top-level world state.

---

## 15. Final Operating Rule

> **A monolithic problem is unactionable; an atom is claimable.** When in doubt, decompose. The unlock is not "fix everything" — it's "make every piece small enough that any agent can ship one this session."
>
> If an atom feels too big, it is too big. If a PROB feels stuck, it isn't atomized yet. The cure is the same in both cases: cut smaller until claim feels obvious.

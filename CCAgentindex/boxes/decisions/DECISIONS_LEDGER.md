# Decisions Ledger

Last updated: 2026-05-01 (later still³ — **DEC-2026-05-01-003 added: Cleanup Mode Default + P-Protocol Operating Doctrine.** Locked into CLAUDE.md §1.3 via ATOM-2026-05-01-0014 (CLAUDE.md rewrite). Three pillars: cleanup-mode default; four operator-rule principles (always-report-in-ledgers + always-track-before-and-after + always-pick-easiest-next + always-atomize-hard); P-button protocol with announce-act-report-stop cycle. Applies to every agent runtime (Cowork, Claude Code, Codex, parallel ChatGPT-based, future). Addresses atom-chase drift (COMM-001) + duplicate-ID races (COMM-008) + parallel-agent coordination drift. **24 active + 1 proposed** decisions total. Earlier today: DEC-2026-05-01-002 placement table revised; DEC-2026-05-01-002 added (status: proposed); DEC-2026-05-01-001 — Phase B Steward Fleet Completion + First `ground_truth_source` Box Class.)
Maintainer: Jake / Comeketo Agent project agents
Status: **active**
Read when: starting major work, auditing changes, considering reversing an architectural choice, citing rationale, resolving tradeoffs, or running an audit pass.
Core rule: **Decisions that shape future work must survive the session where they were made.**
Steward agent: not yet authored. Phase B work — when written it lands at `/Subagent Boxes/decisions_subagent_package/`.

> A decision is stronger when it is written down.
>
> Without a Decisions Ledger, the project keeps relitigating the same questions. The Decisions Ledger preserves the judgment behind the answers — what was decided, why, what alternatives were rejected, and what future agents should not casually undo.

---

## 1. Purpose

This ledger records **major project choices** and the reasoning behind them. It explains:

- what was decided
- why
- what alternatives were considered
- what consequences follow
- what future agents should not casually reverse
- what should be revisited if conditions change

Without these records, future agents will reopen settled questions, accidentally reverse architectural choices, or drift the project away from its intent.

### Owns

- major architectural decisions
- operational decisions
- safety / guardrail decisions
- source-of-truth decisions
- workflow decisions
- technology / tooling decisions
- project philosophy decisions
- deprecations and reversals
- decision status, scope, confidence
- decision rationale and alternatives considered
- affected systems
- consequences
- review triggers

### Does not own

- every small implementation choice → `git log` + `_ledger/activity.jsonl`
- all current tasks → not durable as decisions
- every bug → Open Problems Ledger
- active uncertainties / unresolved debates → Open Problems Ledger or §8 below
- detailed work logs → Temporal Continuity §3 + Communications Ledger
- complete meeting notes → not durable
- experimental research notes → Scout Ledger (planned)

This ledger is **selective**. If everything is a decision, nothing is a decision.

---

## 2. Decision Record Format

Every decision uses a stable ID with an optional slug for human readability:

```
DEC-YYYY-MM-DD-### [optional-slug]
```

Examples:
- `DEC-2026-04-28-001` (canonical form)
- `DEC-2026-04-28-001 github-source-of-truth` (with slug for browsability)

Template:

```
## DEC-YYYY-MM-DD-### — <Decision Title>

Status:                    <see §3>
Confidence:                high | medium | low
Scope:                     global | local | experimental | client-specific | UI | automation
Date:                      YYYY-MM-DD
Decider:                   <user | session | named role>
Affected systems:          <list>
Related North Star goals:  <NS-XX list>
Related ledgers:           <list>
Supersedes:                <DEC ID | none>
Superseded by:             <DEC ID | none>

### Decision
What was decided. One paragraph.

### Context
What situation caused the decision.

### Rationale
Why this was chosen.

### Alternatives Considered
What else could have been done.

### Consequences
What this changes downstream.

### Do Not Undo Casually
What future agents should avoid reversing without explicit review.

### Review Trigger
When this decision should be revisited.

### History
- YYYY-MM-DD — created.
```

Not every field must be long. But every decision should include **decision**, **context**, **rationale**, and **consequences**.

---

## 3. Decision Status Labels

Use exactly one:

| Status | Meaning |
|---|---|
| `active` | Current decision, should be followed |
| `experimental` | Current but under trial; may not survive |
| `provisional` | Accepted for now, may change soon |
| `under-review` | Being reconsidered |
| `superseded` | Replaced by a later decision |
| `deprecated` | No longer recommended |
| `rejected` | Considered and explicitly not chosen (kept for "we already thought about this" record) |

Optional fields:

- **Confidence:** `high` | `medium` | `low`
- **Scope:** `global` | `local` | `experimental` | `client-specific` | `UI` | `automation` | `workflow` | `meta`

These help future agents calibrate how strongly to obey a decision.

---

## 4. Current Active Decisions

Quick index for skimming. Full records in §5.

| ID | Decision | Status | Confidence | Scope | Affected Systems |
|---|---|---|---|---|---|
| DEC-2026-04-28-001 | GitHub Is The Source Of Truth | active | high | global | all repo-backed systems |
| DEC-2026-04-28-002 | FileTree Orchestration Over RAG Memory | active | high | global | ledgers, Boxes, agents, meta harness |
| DEC-2026-04-28-003 | Client Boxes Are Canonical Client Truth | active | high | client automation | Client Boxes, Boxes page, orchestrator |
| DEC-2026-04-28-004 | Seven-Day Plans Are Strategy Drafts, Not Send Licenses | active | high | automation safety | Client Boxes, scheduled fires, inbox |
| DEC-2026-04-28-005 | Risky Sales Moves Require Isolated Approval | active | high | send safety | inbox, approvals, Client Boxes |
| DEC-2026-04-28-006 | Boxes Page Is Display Layer, Not Canonical Truth | active | high | UI / source truth | Boxes page, Client Boxes |
| DEC-2026-04-28-007 | Page-Asset Sitemap Is Mandatory Done Gate For Page Changes | active | high | UI Done Gate | UI pages, routes, APIs |
| DEC-2026-04-28-008 | Build Ledgers One At A Time | active | high | workflow | ledger buildout |
| DEC-2026-04-29-001 | Triad Spine: Box + Ledger + Sub-agent | active | high | global / architectural | every stateful entity |
| DEC-2026-04-29-002 | Three-Phase Build Discipline (A → B → C) | active | high | workflow | ledgers, sub-agents, Subagent Boxes |
| DEC-2026-04-29-003 | TCL/GL Update Discipline (Same Unit Of Work) | active | high | meta / workflow | every change touching project state |
| DEC-2026-04-29-004 | Audit Ledger Removed From Build Queue | active | medium | meta / scope | ledger system |
| DEC-2026-04-29-005 | Box Reports Are Synthesized Views, Not Copies | active | high | architecture / Intake-Box | Intake page, Boxes page, server `_box_report_*` |
| DEC-2026-04-29-006 | One Identity Per Box Across The App (slug = box id) | active | high | identity / routing | Intake, Boxes, ledgers |
| DEC-2026-04-29-007 | Box Reports Refresh On Read | active | high | architecture / perf | server `_box_report_synthesize` |
| DEC-2026-04-29-008 | Phase 1 Intake → Box Is Read-Mostly (no agent-config plumbing yet) | active | high | scope / phasing | Intake ask path, Boxes |
| DEC-2026-04-29-013 | Reactive Box Network Is The Target Architecture (schema only; runtime deferred to Phase C) | active | high | global / architectural | every stateful entity in the project; future bus runtime |
| DEC-2026-04-30-001 | Server-synthesized JSON pattern for build_*.py → AnalyticsScreen integrations | active | high | domain / UI integration | the 19 unintegrated build_*.py scripts; future Analytics panels |
| DEC-2026-04-30-002 | Deprecation Ledger Lives At Global Tier; Snapshot Protocol Pairs With It | active | high | global / architectural | every retirement project-wide; LEDGERS/DEPRECATION.md + _snapshots/ + future Snapshot Steward |
| DEC-2026-04-30-003 | Atom Ledger — PROBs Decompose 1:N Into Single-Session Claimable Atoms (Global Tier) | active | high | global / architectural | every PROB; every agent claiming work; future Atomizer Steward; LEDGERS/ATOMS.md |
| DEC-2026-04-30-004 | Canonical Steward Path = `LEDGERS/BOXES/<name>/steward/` (resolves legacy vs unified-Box fork) | active | high | global / architectural | every steward sub-agent; server.py `_agent_run`; legacy global_ledger_steward (migration follow-on); 4 unpromoted stewards |
| DEC-2026-04-30-005 | Box = Ledger + Rules + Sub-agent + Config + Receipts (Box Network Architecture target primitive) | active | high | global / architectural | every Box, ledger, sub-agent project-wide; the Box Bus runtime; CLAUDE.md and AGENTS.md across the project; the entire bedrock |
| DEC-2026-04-30-006 | Minimum Viable `box.json` Schema For Phase B (resolves PROB-015 Q3) | active | high | global / architectural | every existing and future `box.json` manifest; Box Bus Ledger §2.1; Phase 4 graph validator; the upcoming JSON Schema validator |
| DEC-2026-04-30-007 | `AGENTS.md` Required For Boxes-With-Stewards, Optional For Leaf Boxes (resolves PROB-015 Q2) | active | high | global / architectural | every Box's AGENTS.md presence rule; Box Ledger §Naming Rules; DoD Box-completion gate; LOCAL_TEMPLATE scaffold |

23 active + 1 proposed decisions. 0 superseded. 0 deprecated. (Latest: DEC-2026-05-01-002 (proposed) — Auto/ Symlink Retired; Standalone Folder Dispersal Pattern. Awaiting operator approval on 4 placement rows before dispersal atoms 0006-0011 ship. Prior: DEC-2026-05-01-001 — Phase B Steward Fleet Completion + First `ground_truth_source` Box Class.)

---

## 5. Decision Records

### 2026-05-01 (Phase B steward fleet completion era)

#### DEC-2026-05-01-001 — Phase B Steward Fleet Completion + First `ground_truth_source` Box Class

Status: **active**
Confidence: high
Scope: global / architectural
Date: 2026-05-01
Decider: Cowork session (4 graduation chains shipped end-to-end across multiple parallel agents today; consolidated under this DEC for the architectural commitment)
Affected systems: all 7 stewards (global_ledger, temporal_continuity, open_problems, file_directory, north_star, atoms, atlas), `_agent_resolve_prompt` helper in `server.py`, every Box Bus subscriber that watches steward emissions, `LEDGERS/BOXES/<box>/` Box family, `CCAgentindex/triggers/atlas_daily_sweep.json`
Related North Star goals: NS-01 (legibility-above-all — stewards make ledger drift visible), NS-09 (audit-trail-discipline — receipts make every steward run accountable), NS-10
Related ledgers: PHASE.md (Phase B steward arc complete), GLOBAL_LEDGER.md §3+§6+§12, OPL (PROB-2026-04-30-005 CLOSED, PROB-2026-04-30-015 CLOSED), BOX_LEDGER.md §16 (mature Box shape), BOX_BUS_LEDGER.md §14 (routing model), SOURCE_OF_TRUTH.md §3.0 (Operator-Activity Truth — added by this session)
Supersedes: none
Superseded by: none

##### Decision

The Phase B steward graduation arc is complete. **7 stewards are runnable** project-wide:

1. `global_ledger_steward` — legacy path `CCAgentindex/agents/global_ledger_steward/` (live since 2026-04-28; migrated to unified Box `LEDGERS/BOXES/global_ledger/` via ATOM-0044)
2. `temporal_continuity_steward` — unified Box `LEDGERS/BOXES/temporal_continuity/` (chain ATOM-0028→0031)
3. `open_problems_steward` — unified Box `LEDGERS/BOXES/open_problems/` (chain ATOM-0032→0035)
4. `north_star_steward` — unified Box `LEDGERS/BOXES/north_star/` (chain ATOM-0040→0043)
5. `file_directory_steward` — unified Box `LEDGERS/BOXES/file_directory/` (chain ATOM-0036→0039)
6. `atoms_steward` — unified Box `LEDGERS/BOXES/atoms/` (Atomizer Steward declarative form)
7. `atlas_steward` — unified Box `LEDGERS/BOXES/atlas/` (chain ATOM-0107→0110, **first `ground_truth_source` Box class** — distinct from existing `ledger` class)

A new Box class — `ground_truth_source` — is hereby formally introduced. Distinct from `ledger` Boxes (which govern project-internal ledgers) in that it governs an EXTERNAL data source (Pieces MCP daily-folder output at `/Users/jakeaaron/Documents/Atlas/`) read-only. Output: findings flow into other ledgers (PROBs for drift, COMMs for handoff lessons, atom drafts for action suggestions). Trust contract: Atlas wins for what-actually-happened-on-the-operator's-machine; project ledgers win for what-the-system-now-claims.

##### Context

Phase B was the second of three locked phases (per `DEC-2026-04-29-002` Three-Phase Build Discipline). Phase A (build all the ledgers) completed 2026-04-29 (`DEC-2026-04-29-014`). Phase B (build all the sub-agents) is now complete with this fleet shipping. Phase C (build the Subagent Boxes + Reactive Box Network runtime) remains deferred per `DEC-2026-04-29-013`.

The graduation arc validated several patterns:
- The unified Box pattern (`DEC-2026-04-29-015`) scales — 6 stewards built using the same 6-file shape (box.json + BOX.md + steward/AGENTS.md + steward/prompt.md + steward/config.json + receipts/).
- The canonical steward path (`DEC-2026-04-30-004`) — `LEDGERS/BOXES/<name>/steward/` — is now the established home for all new stewards.
- The `_agent_resolve_prompt` helper (added in ATOM-0029) auto-resolves `<box>_steward` agent names to their unified Box paths, collapsing per-route wiring atoms to 5-min helper-verifications.

##### Rationale

- **Stewards are the project's drift-protection layer.** Each steward audits its own ledger for stale-state, missing-status, broken-links, contradicting-claims. Without this fleet, drift accumulated silently — surfaced today by the open_problems_steward's first smoke test (3 duplicate PROB-IDs + 9 missing Status: lines) and the file_directory_steward's first smoke test (3 categories of FDL drift). Both proved the fleet's value within minutes of shipping.
- **The `ground_truth_source` class addresses a different failure mode.** Steward-of-a-ledger audits are reflexive — they check what the project said about itself. Atlas (operator-actual-machine-activity from Pieces) is *external* — it audits what the project's agents claimed against what actually happened on the operator's machine. That requires a different Box class because the read-only contract, the no-write-into-source rule, and the two-truths reconciliation discipline are all distinct from how `ledger` Boxes operate.
- **Smoke tests proved zero false positives across 7 chains.** Each steward's first audit_only run produced real findings the project hadn't seen before — none of them were noise, none required reverting. This validates the steward design and the Box pattern for production use.

##### Alternatives Considered

- **Keep stewards in `CCAgentindex/agents/<name>/` (legacy path).** Rejected by `DEC-2026-04-30-004` because the unified Box pattern (`DEC-2026-04-29-015`) makes the steward + its config + its receipts visible in one folder, which is the legibility win.
- **Treat Atlas as just another `ledger` Box.** Rejected because Atlas isn't a project ledger — it's an external data source. Forcing it into the `ledger` shape would lose the read-only contract and the two-truths reconciliation rule.
- **Defer Atlas integration until Phase C runtime.** Rejected because the operator (Jake) explicitly named Atlas as ground truth against which all agent ledger writes should be checked. Waiting for Phase C runtime would mean accumulating drift unchecked for an unbounded period.

##### Consequences

- **Drift detection is now infrastructural.** Any agent can dispatch `POST /api/agents/<steward>_steward/run` in audit_only mode and get a structured findings report. The Atlas Sweep Steward fires automatically every morning via cron.
- **The Box class taxonomy expands to 2.** Future Box classes (e.g., `git_history_box` for `git log` ground truth, `slack_activity_box` for team activity) will follow the same `ground_truth_source` pattern.
- **PROB-005 closes; the project moves out of "graduating stewards" mode.** The next Phase B work-arc is the architectural buildout (Box Network Architecture per `DEC-2026-04-30-005`, currently 60% through Phase 1).
- **The atom-protocol rules (COMM-2026-04-30-004/005/006) are the workflow protocol the steward fleet validated in production.** Claim-before-doing, announce-before-doing, P-means-proceed all proved out across the 4 graduation chains.

##### Do Not Undo Casually

- The 7 stewards are referenced from multiple ledger entries, INDEX.md status rows, and the cron trigger. Reverting individual stewards requires updating all those references.
- The `_agent_resolve_prompt` helper assumes the unified Box path. Removing it without replacement breaks 6 of 7 dispatch paths.
- The Atlas `ground_truth_source` class introduction has informed the reconciliation pattern that the Atlas Sweep Steward enforces (two truths, both load-bearing). Reverting the class without preserving the reconciliation discipline would undo the drift-protection work.
- The steward smoke tests produced findings that are now load-bearing reference material (e.g., the file_directory_steward smoke test surfaced 3 categories of FDL drift that the FDL backfill in this same recovery pass closed). Reverting any steward would need to re-find what's been found.

##### Review Triggers

- A new Box class is proposed beyond `ledger` and `ground_truth_source` — review whether the taxonomy itself needs Decisions Ledger formalization (separate DEC).
- The cron daily sweep produces stale or low-signal output for 30+ days — review the sweep cadence + filter.
- Phase C runtime lands and the Box Bus router subsumes per-steward dispatch — review whether stewards still need individual endpoints.

##### History

- 2026-05-01 — created. Consolidates the architectural commitment behind 7 steward graduations across 4 chains + the new `ground_truth_source` Box class. Operator-driven (Jake's Phase B push); no individual chain disagreement.

---

#### DEC-2026-05-01-002 — Auto/ Symlink Retired; Standalone Folder Dispersal Pattern (PROPOSED)

Status: **proposed** (awaiting Jake approval before any dispersal atom 0006-0011 ships)
Confidence: medium-high (placement table is operator's call; the structural pattern is solid)
Scope: global / cleanup / bedrock-ownership
Date: 2026-05-01
Decider: Jake (operator approval gate); Cowork (atomized execution)
Affected systems: `Auto/` symlink, 6 reverse symlinks under `CCAgentindex/`, `server.py:41-44` AUTO_* constants + ~10 references, `Auto/orchestrator/bin/_lib.py`, `Auto/orchestrator/bin/voice.py`, `Auto/orchestrator/KICKOFF_TODAY.md`, `CLAUDE.md` §2.2 + §3.3, all 28 Client Boxes, 13 Staff Boxes, comeketo-inbox skill bundle, orchestrator runtime, loose Auto/ files (CIA.txt, QuoteMaker.jsx, voice profiles, venue index, ballpark template, Hugodemo, aborted Auto/Boxes/ reorg)
Related North Star goals: NS-01 (legibility-above-all), NS-03 (bedrock owns app state), NS-05
Related ledgers: PROB-2026-05-01-001 (parent — reverses PROB-2026-04-28-016 closure), COMM-2026-05-01-002 (coordination warning), DEPRECATION.md §7 (snapshot contract), FILE_DIRECTORY_LEDGER.md §3 + §4.1
Supersedes: PROB-2026-04-28-016 closure rationale (the symlink-only approach)
Superseded by: none

##### Decision (proposed)

The `Auto/` symlink at `/Users/jakeaaron/Downloads/CC Agent/Auto/` (which points to `/Users/jakeaaron/Desktop/Auto/`) is retired. Its contents disperse into the project tree per the placement table below. The 6 reverse symlinks under `CCAgentindex/` (`Boxes`, `Client Boxes`, `Staff Boxes`, `comeketo-inbox`, `Onboard Scripts`, `orchestrator`) each become real folders or new aliases per the new home — no more double-indirection.

**Placement table (operator-revisable).** Each row carries a `decision` field that Jake confirms (or revises) before the corresponding move atom ships:

| Source (under `Auto/`) | Proposed home | Decision |
|---|---|---|
| `Client Boxes/` (28 boxes + ledger context) | **REVISED 2026-05-01:** Zipped archive at `<beta-test-path-TBD>` per ATOM-2026-05-01-0013 (Beta-Test Isolation). Frozen reference snapshot for the duration of the beta-test phase, NOT the live read/write surface. Restored to canonical home (`CCAgentindex/client_boxes/`) post-beta-test cutover. See COMM-2026-05-01-003. | **superseded by COMM-2026-05-01-003 — operator pivot to fake-Close training ground** |
| `Staff Boxes/` (13 dirs) | `CCAgentindex/staff_boxes/` OR fold into `CCAgentindex/people/` with `kind: coworker` | **proposed — Jake decision needed** |
| `comeketo-inbox/` (skill bundle) + `comeketo-ballpark-email-template.html` | `CCAgentindex/comeketo_inbox/` (consolidate template under `templates/`) | **proposed** |
| `orchestrator/` | `CCAgentindex/orchestrator/` (preserves `bin/` → parent shape; `_lib.py` constant renames to `BEDROCK`) | **proposed** |
| `Boxes/` (aborted reorg duplicating comeketo-inbox + orchestrator) | DEPRECATE → `_deprecated/Auto_Boxes/` (already named in PROB-2026-04-28-012) | **proposed** |
| `Hugodemo/` (28-entry demo Client Box) | DEPRECATE OR fold into `Client Boxes/Hugo Casillas/` if real data | **proposed — Jake decision needed** |
| `Onboard Scripts/` (26 files) | LEAVE IN PLACE per operator directive 2026-05-01 | **confirmed by operator** |
| `CIA.txt` (planning doc) | `LEDGERS/Drafts/CIA_atomic_deliverables_map.md` | **proposed** |
| `Comeketo_Voice_Profiles.md` | `CCAgentindex/voice_profiles/` OR `LEDGERS/Drafts/` | **proposed** |
| `Comeketo_Venue_Index_2026-04-25.xlsx` | `CCAgentindex/venues/_index_2026-04-25.xlsx` (timestamped reference snapshot) | **proposed** |
| `QuoteMaker.jsx` (60 KB) | **Jake decision needed** — active code (integrate) vs stale (deprecate)? | **proposed — Jake decision needed** |
| `comeketo-inbox.skill` | DEPRECATE — duplicates installed plugin in `~/.claude/plugins/` | **proposed — confirm with Jake** |
| `.gitignore` + `.claude/` + `.DS_Store` | discard or relocate as appropriate | **proposed** |

##### Context

The original PROB-2026-04-28-016 closed via 6-symlink approach on 2026-04-28 to preserve active scheduled fires + Brenda's seven-day cadence. Two structural concerns at the time: (a) live automations couldn't tolerate a content-migration window; (b) the heavyweight migration was deferred ("Wednesday with Opus"). The symlink papered over the bedrock-ownership concern (NS-03) without resolving it.

**Conditions changed 2026-05-01:**
- Operator paused all automations.
- The seven-day cadence concern is no longer load-bearing (Brenda's plan completed; new cadences are not running).
- The `Auto/` folder accumulated drift: aborted reorg (`Auto/Boxes/`), demo Client Box (`Auto/Hugodemo/`), loose planning docs without a home, and the `comeketo-inbox.skill` file that's redundant with the installed plugin.
- Operator surfaced the directory chaos as "tainting" cleaner work being done elsewhere.

##### Rationale

- **NS-03 says bedrock owns app state.** The symlink violated this by aliasing app state out of bedrock. Real folders inside bedrock satisfy NS-03 directly.
- **No double-indirection.** Today's tree has `CCAgentindex/Client Boxes` → `../Auto/Client Boxes/` → `/Users/jakeaaron/Desktop/Auto/Client Boxes/`. That's two hops. Real folders are zero hops.
- **Operator paused automations explicitly to enable this cleanup.** The original blocker is gone.
- **Snapshot-before-move (DEPRECATION.md §7) protects against accidental loss.** The `_snapshots/manual/` archive captures the pre-dispersal state; recovery is one `unzip` away if anything breaks.
- **Atomized execution prevents bundled risk.** Each child moves in its own atom with its own verification. A regression in any single atom rolls back to the snapshot without losing the others' progress.

##### Alternatives Considered

- **A — Keep the symlink (status quo).** Rejected: operator surfaced directory chaos, automations paused = blocker gone.
- **B — Move everything into `CCAgentindex/auto/` as a single subdir.** Rejected: replaces one symlink-y wrapper with another. NS-03 says state owns its place in the tree, not nested under a generic `auto/` folder.
- **C — Restructure into bedrock domains** (Client Boxes become `CCAgentindex/people/<slug>/box/`). Considered. Largest blast radius (touches loader, schemas, render_lead, BoxesScreen). Deferred — the placement table above mirrors current shape, which is the safer first move. Restructure into people/ taxonomy can come as a follow-up DEC after the dispersal lands.
- **D — Per-child placement table (this DEC).** Selected. Each row is operator-revisable; the structural pattern (real folders inside bedrock; snapshot-before-move; atom-per-child) is the durable part.

##### Consequences

- 11-atom dispersal chain (ATOM-2026-05-01-0001..0011) executes per `LEDGERS/ATOMS.md` §10.5.
- `server.py` AUTO_* constants rename to bedrock-relative paths (no more `HERE / "Auto"`); ~10 downstream references update with them.
- `_lib.py:25-27` constant rename (`AUTO` → `BEDROCK`) for clarity post-move; semantics unchanged because `bin/` → parent shape preserved.
- `KICKOFF_TODAY.md` ~30 absolute paths update.
- `CLAUDE.md` §2.2 read-first table + §3.3 alias section retire; new canonical paths land.
- `_snapshots/manual/snapshot_2026-05-01_<HHMM>_manual_pre_auto_dispersal.zip` becomes the recovery archive referenced from the eventual Deprecation entry.
- Any Jake-decision rows above flip from `proposed — Jake decision needed` to `confirmed` before the corresponding move atom ships.
- PROB-2026-05-01-001 closes when all 11 atoms complete + the symlink is unlinked + the FDL §3/§4.1 reflect the new tree shape.

##### Do Not Undo Casually

Do not restore the `Auto/` symlink without a new DEC explaining why. The reverse migration would require recovering `~/Desktop/Auto/` from the snapshot archive AND re-introducing the double-indirection pattern. If operator workflow needs the desktop folder back for some new reason, that's a fresh PROB + DEC, not a casual revert.

##### Review Triggers

- Operator revises the placement table — re-author this DEC with the corrected mappings before any move atom ships.
- A new automation needs `~/Desktop/Auto/` paths — surface as PROB; do NOT casually restore the symlink.
- The `_snapshots/manual/` snapshot fails integrity check — pause the chain, surface the failure to operator, do not unlink Auto/.

##### History

- 2026-05-01 — created (status: proposed) by ATOM-2026-05-01-0001. Placement table above is the proposal-for-approval; rows marked `proposed — Jake decision needed` block the corresponding move atoms until operator confirms.
- 2026-05-01 (later) — **Client Boxes row REVISED via ATOM-2026-05-01-0012.** Operator pivoted to fake-Close training ground for beta-test isolation: real Client Boxes go to zipped archive (frozen reference) instead of dispersal to canonical bedrock home; fake-Close instance becomes primary inbox source for beta; scheduled automations formally retire. ATOM-2026-05-01-0013 (PROB-2026-05-01-002 Beta-Test Isolation) authors the parent PROB and atomizes the beta-test infrastructure scope. ATOM-0006 (move Client Boxes) is on hold pending revised placement. ATOMs 0008 (comeketo-inbox bundle), 0009 (orchestrator), 0010 (loose files) remain valid scope. See COMM-2026-05-01-003 for operator-pivot rationale + de-risking discipline ("don't refactor storage layer and learn runtime simultaneously").

---

#### DEC-2026-05-01-003 — Cleanup Mode Default + P-Protocol Operating Doctrine

Status: **active**
Confidence: high
Scope: global / agent-runtime / coordination
Date: 2026-05-01
Decider: Jake (operator) — formalized via ATOM-2026-05-01-0014 CLAUDE.md rewrite
Affected systems: every agent runtime working in this repo (Cowork, Claude Code, Codex CLI, Claude in Chrome, parallel ChatGPT-based assistants, future runtimes); CLAUDE.md §1.3; per-atom-completion protocol (§8); response box protocol (§6)
Related North Star goals: NS-01 (legibility-above-all), NS-09 (audit-trail discipline), NS-10
Related ledgers: CLAUDE.md §1.3 (canonical contract), DEC-2026-04-29-002 (Three-Phase Build Discipline — Phase B post-completion now in cleanup mode), COMM-2026-05-01-001 (per-atom-completion update protocol), COMM-2026-05-01-004 (this DEC's announcement)
Supersedes: implicit "agent-may-charge-ahead" mode that drove the atom-chase drift COMM-001 documented
Superseded by: none

##### Decision

Three operating-rule pillars are now formal project doctrine, locked into CLAUDE.md §1.3 and applicable to every agent runtime:

**1. Cleanup mode is the default until further notice.**
The project finished a major scorched-earth reorganization 2026-05-01. The urgent work is reconciliation, audit, naming fixes, and small targeted cleanups — not greenfield architecture. Agents that find themselves about to "redesign X" or "refactor everything Y" must stop and atomize instead.

**2. Four operator-rule principles apply to every agent runtime:**
- Always report inside all the ledgers (the Prime Directive made concrete).
- Always keep track of what you do — before and after (announce-act-report-stop cycle).
- Always pick whatever the easiest next thing is (momentum lives on small wins).
- Always atomize something that looks too difficult (4h+ atom is a yellow flag; "where do I start" is a red flag).

**3. The P-button protocol governs multi-agent parallel work.**
The operator coordinates multiple agents in parallel by typing `P` to mean "proceed with the next small task." Each `P` is permission to do **one small unit of work** — not a campaign, not a sweep, one task. The full cycle: ANNOUNCE → ACT → REPORT → STOP. Agents do not charge ahead through multiple atoms without a `P` between them.

##### Context

The project lived through three failure modes earlier in 2026-05-01:

1. **Atom-chase drift** (COMM-2026-05-01-001) — agents shipping atoms but skipping cross-ledger updates, leaving Global / TCL / Communications / Phase / Deprecation 5-9 hours stale. The mechanical fix landed in CLAUDE.md §8 Per-Atom-Completion Protocol via ATOM-2026-04-30-0111.
2. **Auto/ symlink directory chaos** that the operator surfaced as "tainting" cleaner work (PROB-2026-05-01-001 + DEC-2026-05-01-002). Resolved via the operator's scorched-earth sweep on 2026-05-01.
3. **Parallel-agent coordination drift** — multiple agent runtimes (Cowork + Claude Code + Codex) all claiming work without a coordination protocol, producing duplicate-ID races (COMM-2026-04-30-008) and contradictory placement decisions.

The P-protocol + cleanup-mode default + four-principle frame addresses all three. It's been validated against the operator's brief authored 2026-05-01 (the parallel-agent operating doctrine the operator developed via ChatGPT for parallel ChatGPT-based assistants — same shape as what Cowork/Codex were already implicitly following, now formalized for cross-runtime consistency).

##### Rationale

- **Cleanup mode default prevents redesign-during-reconciliation.** Agents in greenfield mode chase architectural improvements; agents in cleanup mode chase consistency. Different verbs. Mixing them mid-stream produces the kind of drift that surfaced earlier today.
- **Four-principle frame composes with existing protocols.** Principle 1 (always report in ledgers) is the Prime Directive. Principle 2 (track before and after) is the announce-act-report-stop cycle. Principle 3 (easiest next thing) is the canonical answer to "what's the next move" when the operator types P. Principle 4 (atomize hard things) is the granularity rule from ATOMS §5. The frame is not new constraint — it's the existing constraints made operator-legible.
- **P-protocol bounds runaway agents.** The dominant failure mode in parallel-agent work is one agent making sweeping changes that other agents discover only after collision. Bounded turns + announce-before-acting + report-after-doing makes the work observable to the operator turn-by-turn.
- **One canonical place to read the doctrine** — CLAUDE.md §1.3. Agents that read the project memory before acting (which is the Prime Directive of §2) inherit the doctrine automatically. No separate onboarding doc; no drift-prone runbook.

##### Alternatives Considered

- **A — Status quo (let agents run autonomously).** Rejected: produced atom-chase drift, duplicate-ID races, and the directory chaos the operator scorched-earthed today. The patterns repeat without explicit coordination protocol.
- **B — Heavyweight orchestrator that schedules atom claims.** Considered. Too much infrastructure for the current phase; would itself be a redesign during cleanup mode.
- **C — Operator-typed P-buttons + canonical doctrine in CLAUDE.md (this DEC).** Selected. Lightweight, file-tree-native, no new infrastructure, immediately enforceable.
- **D — Per-runtime config (Cowork has its own rules, Codex has its own, etc.).** Rejected: drift across runtimes is exactly the failure mode this DEC addresses.

##### Consequences

- Every agent runtime working in this repo reads CLAUDE.md §1.3 before claiming an atom.
- Substantive atoms must follow the announce-act-report-stop cycle. Agents that don't are violating the operating contract.
- The operator's `P` (or `p`) is now formal — one P = one small unit of work, not a campaign.
- Cleanup-mode default applies until the operator explicitly declares the project back in greenfield mode (e.g., "Phase C runtime is stable; we're building forward again"). That declaration is itself a future DEC.
- The four-principle frame becomes the orientation any future onboarding agent receives. CLAUDE.md is the contract; this DEC is the rationale.
- Anti-pattern §18 in CLAUDE.md gains "charging ahead through multiple atoms without P" and "skipping the announce-before-acting step" — both are correctable behaviors.

##### Do Not Undo Casually

Do not remove §1.3 from CLAUDE.md without authoring a superseding DEC. Do not silently let agents charge ahead without P-protocol enforcement. Do not let cleanup-mode default drift to "agents-decide" without explicit operator declaration that we're back in greenfield mode.

If multi-agent coordination becomes brittle — duplicate IDs, conflicting placement decisions, race conditions on atom claims — strengthen the protocol (e.g., per-atom claim verification before context loading), don't relax it.

##### Review Triggers

- Operator declares the project re-entered greenfield mode (would supersede the cleanup-mode default).
- A runnable Atomizer Steward + claim-verification system replaces the manual P-protocol (would update §1.3.3).
- Three consecutive sessions ship cleanly without atom-chase drift, runaway agents, or duplicate-ID collisions (proof the protocol is working; revisit whether it can relax).

##### History

- 2026-05-01 — created via ATOM-2026-05-01-0014 (CLAUDE.md rewrite). Doctrine landed in CLAUDE.md §1.3 simultaneously. Operator approval implicit in the directive: "I'm trying to get a nice working protocol so I can have all of you guys work with the P button trick... If I can have all of you guys doing this: always reporting inside all the ledgers, always keeping track of what you do before and after, always picking whatever the easiest next thing is, always atomizing something that looks too difficult — then we can actually have a really fucking incredible workflow."

---

### 2026-04-28 (Phase 1–5 ledger buildout era — foundational decisions)

#### DEC-2026-04-28-001 — GitHub Is The Source Of Truth

Status: **active**
Confidence: high
Scope: global
Date: 2026-04-28
Decider: User / project owner
Affected systems: all repo-backed systems, ledgers, agents, Client Boxes, automation
Related North Star goals: NS-01, NS-02, NS-09, NS-10
Related ledgers: Global Ledger §4.1, Source-of-Truth (planned)
Supersedes: none
Superseded by: none

##### Decision

GitHub (`RodbotCC/CCAgent`, branch `main`) is the durable source of truth for the project. The local file tree is the working copy. Important project memory, ledgers, source files, maps, decisions, and handoff notes are versioned and pushed to GitHub.

##### Context

The project needs continuity across agents, tools, MCP servers, local machines, and future sessions. Local-only state and chat history are not durable enough.

##### Rationale

GitHub gives the project shared, versioned, inspectable memory. It lets other agents and tools connect through Git instead of relying on the user's local machine. Versioning makes drift visible and reversible.

##### Alternatives Considered

- Local-only file tree (no shared truth)
- Chat history as memory (not durable, not searchable, not versioned)
- RAG / vector memory as primary continuity (opaque, hard to audit, not file-tree-aware)
- Scattered docs outside repo (no single source)

##### Consequences

- Important project memory belongs in repo files.
- Ledgers must be committed.
- Agents should report commit SHAs when writing directly.
- Direct GitHub writes must consider that the user may have unpushed local work (see also `COMM-2026-04-28-004` warning about Git drift).
- The repo IS the memory of the build.

##### Do Not Undo Casually

Do not move core continuity back into chat-only or local-only memory without explicit review.

##### Review Trigger

Revisit only if GitHub stops being accessible or another versioned source-of-truth system replaces it.

##### History

- 2026-04-28 — created.

---

#### DEC-2026-04-28-002 — FileTree Orchestration Over RAG Memory

Status: **active**
Confidence: high
Scope: global
Date: 2026-04-28
Decider: User / project owner
Affected systems: ledgers, Boxes, meta harness, agent workflow, memory architecture
Related North Star goals: NS-01, NS-02, NS-03, NS-09
Related ledgers: Global Ledger §1, North Star NS-01
Supersedes: none
Superseded by: none

##### Decision

The project uses **FileTree orchestration** as its primary memory and coordination model — not RAG / vector memory. Each meaningful directory carries context, rules, ledgers, source-of-truth notes, and local memory.

##### Context

The user wants durable, inspectable, directory-aware continuity. Memory that lives in opaque vector stores cannot be audited, versioned, or handed off cleanly between agents.

##### Rationale

FileTree orchestration gives agents explicit, versioned, local context. It is easier to audit, rebuild, hand off, and reason about than vague retrieval over scattered memory. It composes naturally with GitHub (DEC-001) and with the Triad Spine (DEC-2026-04-29-001).

##### Alternatives Considered

- RAG / vector memory as primary project memory (opaque, drift-prone)
- Chat history as continuity (not durable)
- Ad hoc docs (no structure)
- Monolithic global memory file (does not scale)
- Database-backed memory (heavier, less inspectable)

##### Consequences

- Important memory belongs in files.
- Directories should become Boxes when meaningful.
- Local context should live near the files it governs.
- Meta harness should read ledgers and local Boxes before work.
- Pieces.app stays as a *secondary* memory backend — useful for activity recall, not as the primary continuity layer.

##### Do Not Undo Casually

Do not replace Box / local-file continuity with hidden memory without review. A hybrid retrieval layer is acceptable as a *helper* if the file tree remains source of truth.

##### Review Trigger

Revisit only if a hybrid retrieval layer is added as a helper while keeping file tree as source of truth.

##### History

- 2026-04-28 — created.

---

#### DEC-2026-04-28-003 — Client Boxes Are Canonical Client Truth

Status: **active**
Confidence: high
Scope: client automation
Date: 2026-04-28
Decider: User / project owner
Affected systems: Client Boxes, Boxes page, orchestrator, scheduled fires, inbox automation
Related North Star goals: NS-03, NS-04, NS-06
Related ledgers: Global Ledger §4.3, Open Problems (PROB-001 — allowed-to-know layer)
Supersedes: none
Superseded by: none

##### Decision

`Auto/Client Boxes/<Name>/` is the **canonical per-client memory and operating substrate**. The Boxes page and orchestrator state are read / render / generation layers over that substrate.

Authority order for client truth:

1. `01b_comms_verbatim.md` and `comms/*.json` — full Close.com record
2. `01_comms.md` — curated exec summary
3. `00_meta.json` — structured metadata
4. `client_ledger.md` — running operator log
5. approved operator notes
6. `04_profile.md` and `*_enrichment.md` — internal strategy only, **not customer-facing truth**

##### Context

There was confusion about whether the `boxes` UI / page or `Auto/Boxes` umbrella was the actual client truth. The project clarified that Client Boxes hold the specific client memory, comms, state, profile, plan, alerts, and local audit notes.

##### Rationale

Client-specific complexity should live inside the client's own Box. One client's constraints should not force global automation rewrites. Co-locating truth with the client makes audits, handoffs, and per-box discipline tractable.

##### Alternatives Considered

- Treating Boxes page as the source (UI-as-source — see DEC-006 for why this was rejected)
- Treating orchestrator state as the source (generated, not canonical)
- Centralizing all client logic in one global automation (does not scale, does not respect local context)
- Database-backed client truth (heavier, less inspectable)

##### Consequences

- Client-specific edits happen in the relevant Client Box.
- The Boxes page is **never** treated as canonical client truth (DEC-006).
- Generated state should point back to Client Boxes.
- Per-client audit markers and local notes matter.
- The Allowed-To-Know layer (PROB-001) will live inside each Client Box.

##### Do Not Undo Casually

Do not make UI or generated dashboard state the canonical source for client truth without explicit migration.

##### Review Trigger

Revisit only if a database-backed canonical client layer is intentionally introduced.

##### History

- 2026-04-28 — created.

---

#### DEC-2026-04-28-004 — Seven-Day Plans Are Strategy Drafts, Not Send Licenses

Status: **active**
Confidence: high
Scope: automation safety
Date: 2026-04-28
Decider: User / project owner
Affected systems: Client Boxes, scheduled fires, inbox automation, guardrails
Related North Star goals: NS-04, NS-05, NS-06
Related ledgers: Open Problems (PROB-002), Communications (`COMM-2026-04-28-005`)
Supersedes: none
Superseded by: none

##### Decision

A **seven-day plan is a strategy draft**. It does not authorize sending by itself.

Before any send, the current comms, state, guardrails, approvals, calendar reality, frequency caps, and reply gates must still pass. **Reply received → plan is stale.**

##### Context

Some plans were written before guardrails were fully enforced. A plan can contain strong strategy but still conflict with current send rules or changed client state. The Brenda & Steve audit revealed plans with stale dates, risky commitment language, and enrichment leakage.

##### Rationale

Plans age. Replies, transcripts, state sweeps, and updated guardrails can invalidate a previously good plan. Treating plan text as send authority is the failure mode this decision prevents.

##### Alternatives Considered

- Treat seven-day plan text as executable send authority (rejected — unsafe)
- Disable plans entirely (rejected — useful as strategy)
- Require manual rewrite before every move (rejected — too slow)

##### Consequences

- Scheduled fires must treat plans as input, not authority.
- If a lead replies, the plan is stale and may need rewrite.
- Plan audits should check for stale dates, risky commitments, and enrichment leakage.
- Client Box cleanup should flatten risky future sends.
- The Brenda & Steve plan now opens with `Audit-cleaned: 2026-04-28 01:40 AM ET` and a Safety Status block — that's the template.

##### Do Not Undo Casually

Do not allow automation to send directly from plan text without guardrail validation.

##### Review Trigger

Revisit if a formal plan compiler / validator is built that enforces all gates before execution.

##### History

- 2026-04-28 — created.

---

#### DEC-2026-04-28-005 — Risky Sales Moves Require Isolated Approval

Status: **active**
Confidence: high
Scope: send safety
Date: 2026-04-28
Decider: User / project owner
Affected systems: inbox automation, approval surfaces, Client Boxes, scheduled fires
Related North Star goals: NS-04, NS-05, NS-06
Related ledgers: Open Problems (PROB-003), Communications (`COMM-2026-04-28-003` — promoted from)
Supersedes: none
Superseded by: none

##### Decision

Risky sales moves may be **suggested** by automation, but they require **explicit isolated approval** before customer-facing send.

Risky moves include:

- fee waivers
- discounts
- free services
- no-charge language
- guest-count promises
- pricing guarantees
- scope expansions
- enrichment-based personalization
- strong claims not grounded in comms

##### Context

The Brenda & Steve fee-waiver move may have been strategically correct, but it was approved in a rushed batch context and did not receive enough isolated risk friction. Batching risky moves with safe ones hid the risk.

##### Rationale

Good sales judgment and safe automation are not the same thing. Automation can suggest bold moves, but a human should explicitly own financial, pricing, scope, or risky personalization commitments.

##### Alternatives Considered

- Ban all risky moves (rejected — too restrictive)
- Allow risky moves inside normal batch approval (rejected — hides risk)
- Auto-send risky moves if plan says so (rejected — directly unsafe)

##### Consequences

- Risky moves should become explicit approval cards.
- Approval cards should name the risk clearly.
- Batch approval should not hide financial / scope commitments.
- Future Client Box plans should gate or flatten risky language.
- The exact UI / process for approval cards is not yet decided — see §8 (Approval UI / Risk Card Standard) below.

##### Do Not Undo Casually

Do not let risky commitments ship as ordinary follow-up copy without explicit approval.

##### Review Trigger

Revisit after approval UI supports isolated risk confirmations robustly.

##### History

- 2026-04-28 — created.
- 2026-04-29 — `COMM-2026-04-28-003` (Brenda fee-waiver lesson) promoted into this decision.

---

#### DEC-2026-04-28-006 — Boxes Page Is Display Layer, Not Canonical Truth

Status: **active**
Confidence: high
Scope: UI / source truth
Date: 2026-04-28
Decider: User / project owner
Affected systems: Boxes page, Client Boxes, orchestrator state, page-asset sitemap
Related North Star goals: NS-06, NS-08
Related ledgers: Global Ledger §4.6, Source-of-Truth (planned)
Supersedes: none
Superseded by: none

##### Decision

The `boxes` route / page is a **UI read / display surface** over Client Boxes, Staff Boxes, and orchestrator state. It does not own canonical client truth.

##### Context

The sitemap says the Boxes page reads `Auto/Client Boxes`, `Auto/Staff Boxes`, and `Auto/orchestrator/state`, and exposes a single-surface dossier view. That could visually imply ownership if not documented.

##### Rationale

UI should make truth visible, not become truth accidentally. UI changes shouldn't be able to silently rewrite client memory.

##### Alternatives Considered

- Treat Boxes page as canonical client source (rejected — see DEC-003)
- Treat orchestrator state as canonical (rejected — generated state)
- Hide source distinction (rejected — confuses agents and operators)

##### Consequences

- Fix client truth in Client Boxes, not the UI display.
- Fix generated state through sources / generators.
- Page changes still update page-asset sitemap (DEC-007).
- Boxes page should clearly communicate source freshness and generated / canonical distinctions where possible.

##### Do Not Undo Casually

Do not write client truth into the Boxes page layer without source-of-truth migration.

##### Review Trigger

Revisit if a database or app-native canonical Box store replaces file-based Client Boxes.

##### History

- 2026-04-28 — created.

---

#### DEC-2026-04-28-007 — Page-Asset Sitemap Is Mandatory Done Gate For Page Changes

Status: **active**
Confidence: high
Scope: UI Done Gate
Date: 2026-04-28
Decider: Existing project policy / accepted into ledger system
Affected systems: UI pages, routes, APIs, page data binding, sitemap
Related North Star goals: NS-06, NS-08, NS-10
Related ledgers: CLAUDE.md §5.5, Global Ledger §4.7, Asset/Widget Map (planned)
Supersedes: none
Superseded by: none

##### Decision

Any task that changes a page, route behavior, or page data binding is **not complete** until `page_asset_sitemap.md` is updated. Append to the relevant page section's `Asset Ownership`, `Change Checklist`, and `History` lines, and bump `Last Verified`.

##### Context

The Comeketo Page-Asset Source Of Truth already defines this mandatory Done Gate. It was already operating policy before the ledger system; this decision simply formalizes it.

##### Rationale

Page behavior and data ownership drift quickly if not recorded. Without the gate, sitemap and reality diverge silently.

##### Alternatives Considered

- Rely on code diffs only (rejected — diffs don't tell you what owns what)
- Update sitemap only occasionally (rejected — drift)
- Replace sitemap with comments in code (rejected — not browsable)

##### Consequences

- UI / page work must include sitemap update in the same unit of work.
- Asset / Widget Map should link to sitemap rather than duplicate it.
- Audits can fail page work if sitemap is stale.
- Surviving routes after the Apr 2026 trim: `grid, settings, leads, clients, coworkers, contacts, briefing, activity, automation, intake, analytics`.

##### Do Not Undo Casually

Do not remove this Done Gate without replacing it with an equal or stronger page ownership system.

##### Review Trigger

Revisit only if Page Ledgers or an automated page map supersede the sitemap.

##### History

- 2026-04-28 — formalized into the ledger system.

---

#### DEC-2026-04-28-008 — Build Ledgers One At A Time

Status: **active**
Confidence: high
Scope: workflow
Date: 2026-04-28
Decider: User
Affected systems: ledger implementation workflow, agent handoff, INDEX.md build order
Related North Star goals: NS-01, NS-09, NS-10
Related ledgers: INDEX.md, Communications (`COMM-2026-04-28-001` — promoted from)
Supersedes: none
Superseded by: none

##### Decision

The ledger system is designed and implemented **one ledger at a time**. The user signals (typically by typing `P` or uploading the next ledger spec) to proceed.

##### Context

The ledger system is large (~22 planned ledgers). Implementing it all at once would be too broad and would create shallow, low-quality files.

##### Rationale

One-ledger-at-a-time keeps focus, creates rhythm, and lets the user hand clean implementation outlines to the building agent. Each ledger gets a dedicated outline at `/Ledger Drafts/<name>.txt`.

##### Alternatives Considered

- Build all ledgers in one pass (rejected — shallow output)
- Start coding without design (rejected — drift)
- Only create a global README (rejected — no continuity layer)

##### Consequences

- Each ledger gets a dedicated implementation outline at `/Ledger Drafts/`.
- Implementation can evolve without overwhelming the repo.
- Build order is tracked in `LEDGERS/INDEX.md`.

##### Do Not Undo Casually

Do not attempt a massive all-ledgers rewrite unless the user explicitly changes workflow.

##### Review Trigger

Revisit after first wave of ledgers is implemented (likely after Phase 10–12).

##### History

- 2026-04-28 — created.
- 2026-04-29 — `COMM-2026-04-28-001` (ledger build rhythm handoff) promoted into this decision.

---

### 2026-04-29 (post-Phase-5 architectural settling)

#### DEC-2026-04-29-001 — Triad Spine: Box + Ledger + Sub-agent

Status: **active**
Confidence: high
Scope: global / architectural
Date: 2026-04-29
Decider: User / project owner
Affected systems: every stateful entity in the project (Client Boxes, Staff Boxes, ledgers, sub-agents, future state-bearing systems)
Related North Star goals: NS-01, NS-02, NS-03, NS-09, NS-10
Related ledgers: Global Ledger §3, Temporal Continuity §1, Communications (`COMM-2026-04-29-001` — promoted from)
Supersedes: none
Superseded by: none

##### Decision

The architectural spine of Comeketo Agent is the **Box + Ledger + Sub-agent triad**. Anything with state that learns or needs updating gets all three:

- **Box** — the unit of state (Client Boxes, Staff Boxes, Coworker records, eventually any state-bearing entity)
- **Ledger** — the legible memory of that Box (project-wide ledgers under `LEDGERS/`; per-Box ledgers stamp from `LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md`)
- **Sub-agent** — the operator that reads / updates the Box and its Ledger (canonical config in `/Subagent Boxes/<name>/`; runnable form in `CCAgentindex/agents/<name>/`)

Standing inviolable rule: **legibility is more important than the build itself**. Code without a corresponding Ledger entry is debt to repay. A Ledger reader should understand the system without opening code.

Jake's exact words (2026-04-28): *"For everything that we build we cannot be lazy about the legibility. I am actually more concerned about the legibility than the build."*

##### Context

The project went through a plumbing-first attempt that was scrapped under demo pressure (see `COMM-2026-04-28-008` for build-arc context). After the rebuild, the architectural spine wasn't formally named. On 2026-04-29 the triad was codified during a Claude Code catch-up session as the rule that organizes everything stateful.

##### Rationale

Ledgers without Boxes are floating memory. Boxes without Ledgers are illegible state. Sub-agents without either are operators with no memory or context. Skipping any leg of the triad produces a system that cannot continue itself across agents.

The triad also gives the project a clean three-phase build order (DEC-2026-04-29-002) — fill the Boxes side first (Client / Staff / etc., already mostly done), then the Ledger side (Phase A, currently in flight), then the Sub-agent side (Phase B), then finally stamp the per-Box Ledgers controlled by sub-agents (Phase C).

##### Alternatives Considered

- Boxes-only (rejected — illegible)
- Ledgers-only (rejected — no operating substrate)
- Sub-agents-only (rejected — no memory)
- Two-leg systems (Box + Ledger; or Box + Sub-agent) — rejected because each missing leg produces a known failure mode
- Centralized state without Boxes (rejected — see DEC-003)

##### Consequences

- Before designing anything stateful, ask: *Where is the Box? Where is the Ledger? Where will the Sub-agent live?* If any answer is "we'll figure that out later," stop and figure it out now.
- The triad is currently **lopsided**: more Boxes than Ledgers, more Ledgers than Sub-agents. Filling the grid is the dominant verb.
- Per-Box ledgers stamp from `LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md`.
- Steward sub-agents follow the pattern established by `global_ledger_steward` (canonical at `LEDGERS/AGENTS/<name>/`, runnable at `CCAgentindex/agents/<name>/`).

##### Do Not Undo Casually

Do not propose architectural patterns that bypass any leg of the triad. If a system has state, it gets all three.

##### Review Trigger

Revisit only if a fundamentally different state-management primitive emerges (e.g., a database-backed canonical layer that subsumes Boxes — would also trigger DEC-003 review).

##### History

- 2026-04-29 — created. Promoted from `COMM-2026-04-29-001`.

---

#### DEC-2026-04-29-002 — Three-Phase Build Discipline (A → B → C)

Status: **active**
Confidence: high
Scope: workflow
Date: 2026-04-29
Decider: User
Affected systems: ledger system, sub-agent system, bedrock, build planning
Related North Star goals: NS-01, NS-09, NS-10
Related ledgers: INDEX.md, Temporal Continuity §1, Communications (`COMM-2026-04-29-003` — promoted from)
Supersedes: none
Superseded by: none

##### Decision

Build order, in this exact sequence:

1. **Phase A — finish all Ledgers.** Ingest outline drafts from `/Ledger Drafts/` one at a time, in user-confirmed order. *(Currently in this phase as of 2026-04-29.)*
2. **Phase B — finish all Sub-agents.** Graduate the draft sub-agent packages at `/Subagent Boxes/` into runnable app agents under `CCAgentindex/agents/<name>/`.
3. **Phase C — build Subagent Boxes.** Boxes of ledgers controlled by sub-agent configurations. The triad becomes operational.

Do not skip ahead. Do not parallelize without explicit approval.

##### Context

After the plumbing-first attempt was scrapped (see `COMM-2026-04-28-008`), the rebuild made it clear that the triad needed to be filled in a specific order to avoid producing partial systems that confuse future agents.

##### Rationale

Ledgers without sub-agents are static memory. Sub-agents without ledgers have nowhere to write. Subagent Boxes (boxes of ledgers controlled by sub-agent configurations) require both prior layers to exist. The ordering protects the spine.

Phase A also unblocks PROB-016 (bedrock reconciliation), which is gated on ledger + sub-agent buildouts completing.

##### Alternatives Considered

- All-three-in-parallel build (rejected — too broad, drift-prone)
- Sub-agents-first (rejected — no ledgers to read / write)
- Subagent-Boxes-first (rejected — both prior layers missing)
- B before A (rejected — operators with no memory)

##### Consequences

- When asked to build something with state, agents confirm which phase the project is in before proposing structure.
- Phase A: build the ledger only, note the eventual sub-agent home as a placeholder (this is the pattern Communications and Decisions are following).
- Phase B: graduate the existing draft package into a runnable app agent.
- Phase C: stamp the Box of the relevant ledger with sub-agent configuration.
- PROB-016 (bedrock reconciliation) is blocked on Phase A + Phase B completion.

##### Do Not Undo Casually

Do not skip phases. Do not parallelize without explicit user approval.

##### Review Trigger

Review on Phase A completion. The order may stay or evolve based on what's painful when Phase B starts.

##### History

- 2026-04-29 — created. Promoted from `COMM-2026-04-29-003`.

---

#### DEC-2026-04-29-003 — TCL/GL Update Discipline (Same Unit Of Work)

Status: **active**
Confidence: high
Scope: meta / workflow
Date: 2026-04-29
Decider: User / project owner
Affected systems: every change touching project state, every cold-starting agent
Related North Star goals: NS-01, NS-09, NS-10
Related ledgers: Temporal Continuity Ledger, Global Ledger, Communications (`COMM-2026-04-29-005` — promoted from)
Supersedes: none
Superseded by: none

##### Decision

**Cold-starting agents read the Temporal Continuity Ledger and Global Ledger first.** If those ledgers are stale, every agent that boots from them is stale. Therefore: whoever does the work also updates the orientation surface **in the same unit of work** as the change itself — not after, not later, not in a follow-up commit.

Specifically, every meaningful change must:

- Update header `Last updated` dates on TCL and Global Ledger when applicable.
- Append to TCL §3 Recent Meaningful Changes for any non-trivial change.
- Update TCL §1 Current Snapshot if anything structural changed.
- Update GL §12 Recently Changed for major moves.
- Update GL §2 Current World State if a structural fact changed.
- Append to `CCAgentindex/_ledger/activity.jsonl` for any non-trivial delegation.

##### Context

This decision exists because the failure mode happened during a Cowork → Claude Code → Cowork handoff on 2026-04-29: a Cowork session read a TCL written ~24 hours earlier and had no idea about that day's catch-up work. Jake's framing: *"The ledger is more important than the actual work. Literally everything needs to be ledgered."*

##### Rationale

The fix is not smarter agents — it's discipline. Orientation surfaces ARE the agent. If they're stale, the agent is stale. Treating ledger updates as an optional epilogue is the failure mode this decision exists to prevent.

##### Alternatives Considered

- Periodic ledger sweeps (rejected — drift between sweeps)
- Steward-agent-only updates (rejected — relies on the steward running; the sub-agent might not exist yet)
- Manual end-of-session checklist (rejected — easy to skip when tired)
- Auto-generated TCL from git log (rejected — loses semantic continuity)

##### Consequences

- Every non-trivial work session ends with a TCL / GL update.
- Header dates are bumped accurately and frequently.
- Cold-starting agents can trust TCL / GL as current.
- The `global_ledger_steward` agent helps verify drift but does not replace this discipline.
- A ledger update IS the work, not a follow-up.

##### Do Not Undo Casually

Do not adopt patterns that defer ledger updates to "later" or to a separate commit. Same unit of work, every time.

##### Review Trigger

This decision does not expire. It is the meta-rule that keeps every other ledger usable.

##### History

- 2026-04-29 — created. Promoted from `COMM-2026-04-29-005` (lesson form).

---

#### DEC-2026-04-29-004 — Audit Ledger Removed From Build Queue

Status: **active**
Confidence: medium
Scope: meta / scope
Date: 2026-04-29
Decider: User
Affected systems: ledger system, build queue, future audit-shaped findings
Related North Star goals: NS-09, NS-10
Related ledgers: INDEX.md, Open Problems, Decisions (this ledger), Communications, per-Box ledgers
Supersedes: none
Superseded by: none

##### Decision

The **Audit Ledger is removed from the build queue**. Audit-shaped findings will land in:

- **Open Problems Ledger** — if the finding describes something broken / risky / unresolved
- **Decisions Ledger (this)** — if the finding settles a question
- **Communications Ledger** — if the finding is a warning, lesson, or handoff for future agents
- **Per-Box ledgers** — if the finding is local to a specific Box (e.g., `Auto/Client Boxes/<Name>/<YYYY-MM-DD>_audit_marker.md`)

The draft outline at `/Ledger Drafts/# Audit Ledger.txt` stays as reference but is not built.

##### Context

After the Communications Ledger landed (Phase 6, 2026-04-29) and the Open Problems Ledger had been live for a day, Jake observed that audit findings naturally distribute across the three sibling ledgers + per-Box ledgers. A dedicated Audit Ledger would duplicate the coverage already provided.

Jake's words: *"I don't think we're ever going to need that. It's basically covered in the other things."*

##### Rationale

A standalone Audit Ledger would create three failure modes:

1. **Coverage overlap** — most audit findings are already either Open Problems, Decisions, Communications, or local Box notes.
2. **Discoverability cost** — readers would need to check yet another ledger.
3. **Maintenance overhead** — a fifth memory-of-the-work surface to keep in sync.

Removing it tightens the system and pushes audit-shaped findings into the right home.

##### Alternatives Considered

- Build a thin Audit Ledger that just cross-references other ledgers (rejected — adds maintenance, low value)
- Keep Audit as planned but defer indefinitely (rejected — leaves an unclear status; better to make a clean call)
- Build Audit fully (rejected — see Rationale)
- Delete the draft outline (rejected — keep as reference in case the call gets reversed)

##### Consequences

- INDEX.md row marked `out-of-scope (2026-04-29)`.
- Global Ledger §8 Audit row marked similarly.
- Build order item 4 (in INDEX) struck through.
- Audit-pattern findings go to one of: Open Problems, Decisions, Communications, per-Box.
- The Brenda audit pattern (which seeded much of the initial OPL content) continues to work — it just routes findings into existing ledgers instead of a dedicated Audit Ledger.

##### Do Not Undo Casually

This is the freshest decision in the ledger and carries `confidence: medium`. If a future agent finds that audit findings genuinely don't fit any of the four homes, it's worth re-opening this question. **Don't reverse without that evidence.**

##### Review Trigger

Revisit if:

- A future audit pattern emerges that genuinely doesn't fit Open Problems / Decisions / Communications / per-Box.
- Audit-shaped reporting becomes a frequent operator-facing need (e.g., compliance, regulatory).
- The volume of audit findings makes per-ledger distribution painful to read.

##### History

- 2026-04-29 — created.

---

### 2026-04-29 (Phase 1 Intake → Box unification)

#### DEC-2026-04-29-005 — Box Reports Are Synthesized Views, Not Copies

Status: **active**
Confidence: high
Scope: architecture / Intake-Box
Date: 2026-04-29
Decider: User (with assistant proposal)
Affected systems: Intake page, Boxes page, server `_box_report_*` helpers, Client Box folders
Related North Star goals: NS-01, NS-02, NS-03
Related ledgers: Global Ledger §3, Open Problems (none new), Communications (none yet)
Supersedes: none
Superseded by: none

##### Decision

A Box Report is a **synthesized view** over `Auto/Client Boxes/<Name>/`. The server reads the box folder on every `/api/reports/get` call and assembles a `documents[]` payload from the live files. **No `report.json` is written into the box folder.** The Box Report has no separate persistent representation — only the Q&A history (kept at `CCAgentindex/reports/_box_conversations/<box_id>.jsonl`) lives outside the box.

##### Context

The 2026-04-27 manual `brenda_and_steve` workspace already proved the pattern by accident — its documents were a hand-curated copy of Brenda's box files. Phase 1 of the Intake → Box unification asked: should every Client Box get a real `report.json` mirror, or be rebuilt on read? The plan in `LEDGERS/Drafts/intake_box_unification_plan.md` proposed synthesis. This decision locks it.

##### Rationale

A copy creates a drift surface — two records of the same content diverging silently. A synthesized view has no drift surface: there is exactly one source of truth per Client Box, the box folder itself. Triad-aligned (DEC-2026-04-29-001): the **Box** is the unit of state; an Intake-side report cannot be a parallel Box.

Walking 28 box folders on each list call is milliseconds in practice. If profiling ever shows otherwise, a small in-memory cache (≤5s TTL) is the correct response — not a persisted mirror.

##### Alternatives Considered

- Persisted mirror (`report.json` inside each box folder) — rejected: drift surface; doubles write paths.
- Persisted mirror outside the box (under `CCAgentindex/reports/<box_id>/`) — rejected: same drift problem, plus pollutes the workspace reports list.
- Hybrid (mirror with mtime-based invalidation) — rejected for Phase 1: extra moving parts before measurement justifies them.

##### Consequences

- File drops via Intake on a Box Report write into `Auto/Client Boxes/<Name>/intake_drops/<file>` — the box stays the only writer of canonical content.
- Box Report document deletion from Intake is forbidden (returns 405 with guidance to manage from the Boxes page).
- The `Auto/` symlink is written through *only* for `intake_drops/`. Per CLAUDE.md §1 this is normally guarded; Phase 1 documents this exception in `page_asset_sitemap.md` history.
- Future analytics-as-box / page-as-box / agent-as-box work should default to the same posture: **state lives in the box; UI surfaces are views.**

##### Do Not Undo Casually

Do not introduce a persisted Box Report mirror without first measuring read cost and demonstrating the cache strategy. Drift is the failure mode; performance has not been the failure mode.

##### Review Trigger

- Profiling shows synthesis latency materially affects Intake page loads.
- A future architecture (e.g., box-bus / ledger trickle-down) requires a stable identifier for Box Report content that can't be derived on read.

##### History

- 2026-04-29 — created. Locked alongside the Phase 1 implementation in `screens.jsx` / `app.jsx` / `server.py`.

---

#### DEC-2026-04-29-006 — One Identity Per Box Across The App (slug = box id)

Status: **active**
Confidence: high
Scope: identity / routing
Date: 2026-04-29
Decider: User (with assistant proposal)
Affected systems: Intake routing, Boxes routing, future ledger references, future cross-page nav
Related North Star goals: NS-01, NS-09
Related ledgers: Global Ledger §3
Supersedes: none
Superseded by: none

##### Decision

A Box Report's slug is **the box `id` from `/api/boxes/list`**, with no synthetic prefix. Identities like `hugo_casillas`, `brenda_steve`, or `box_<norm>` for unmatched folders flow through every surface unchanged. Workspace slugs are forbidden from colliding with a Client Box id (`/api/reports/create` returns 409 on collision).

The earlier draft (`LEDGERS/Drafts/intake_box_unification_plan.md`) proposed a `client_box__` prefix; that was dropped in implementation because every existing client-box id is already unique within the catalog and the prefix added no information.

##### Context

Cross-page navigation between Intake and Boxes needs to refer to the same entity by the same name. Two competing identities (a box id + a Box Report slug derived from it) would force every link, every menu item, and every ledger reference to maintain a translation table.

##### Rationale

One identity = trivial cross-nav (`go.push("intake", { openSlug: b.id })` and `go.push("boxes", { selectId: r.slug })` both work because the slug *is* the id). It also keeps future ledger entries that mention a box stable across surfaces — a Decisions Ledger reference to `hugo_casillas` is unambiguous whether the reader is looking at Intake or Boxes.

##### Alternatives Considered

- `client_box__<id>` prefix (the original draft) — rejected: redundant; lookup already resolves uniquely.
- Separate Box Report slug minted at creation time — rejected: introduces a translation table, breaks cross-nav, doubles the namespace.

##### Consequences

- `/api/reports/create` rejects any workspace slug that matches a Client Box id (HTTP 409). The 5 existing workspaces (`a`, `demo`, `multi_data_test`, `snap_benefits`, `brenda_and_steve`) are all safe — none collide.
- Future per-box analytics, per-box agent runs, and per-box ledger references can all key off the same id.
- If a Client Box is renamed (folder rename), its id changes, which orphans the corresponding `_box_conversations/<old_id>.jsonl`. Acceptable for Phase 1; revisit with a migration helper if/when box renames become common.

##### Do Not Undo Casually

Adding a translation layer between box ids and report slugs would force every cross-surface reference to be rewritten. Don't introduce a separate identity space without a concrete need it solves.

##### Review Trigger

- A Client Box ever needs to project multiple report views (e.g., "lite" vs "full") — would justify a slug suffix on the report side.
- A privacy/access-control requirement makes the box id unsafe to expose at the URL layer.

##### History

- 2026-04-29 — created.

---

#### DEC-2026-04-29-007 — Box Reports Refresh On Read

Status: **active**
Confidence: high
Scope: architecture / perf
Date: 2026-04-29
Decider: User (with assistant proposal)
Affected systems: server `_box_report_synthesize`, `_reports_list`, `_reports_get`
Related North Star goals: NS-02
Related ledgers: Global Ledger §11 (Done Gate)
Supersedes: none
Superseded by: none

##### Decision

Every `/api/reports/get?slug=<box_id>` and `/api/reports/list` call re-reads the live Client Box folder. There is no cache, no debounce, no invalidation flag. Workspaces continue to use their stored `report.json`; Box Reports do not.

##### Context

The synthesized-view decision (DEC-2026-04-29-005) leaves a freshness question open: re-read or cache? Phase 1 picks the simplest answer that avoids a class of bugs.

##### Rationale

- Cheap: walking ~25 markdown/json files per box, summing to ~28 boxes × ~10 files for the list endpoint, is sub-100ms even on cold disk.
- Correct: no stale-cache class of bugs.
- Reversible: adding a 5-second TTL cache later is a single-function change with no schema migration.

##### Alternatives Considered

- mtime-based cache (re-read only when the box folder mtime changes) — rejected for Phase 1: small win, more code paths, more failure modes.
- Persistent cache (`box_report.cache.json`) — rejected: same drift problem the synthesized-view decision is trying to avoid.

##### Consequences

- Box Reports always reflect what's in the box folder right now.
- If list-endpoint latency ever becomes a UX problem, the agreed remediation is a small in-memory TTL cache, not persisted state.

##### Do Not Undo Casually

Don't add caching speculatively. Measure first.

##### Review Trigger

- Intake page load time on the production box becomes user-visibly slow.
- The number of Client Boxes grows past ~200 (each new box adds a few ms to the list endpoint).

##### History

- 2026-04-29 — created.

---

#### DEC-2026-04-29-008 — Phase 1 Intake → Box Is Read-Mostly (no agent-config plumbing yet)

Status: **active**
Confidence: high
Scope: scope / phasing
Date: 2026-04-29
Decider: User
Affected systems: Intake ask path, future per-box AGENTS.md plumbing, the deferred reactive box-bus design
Related North Star goals: NS-09, NS-10
Related ledgers: Global Ledger §6 (Active Workstreams), Communications (none new), DEC-2026-04-28-008 (one ledger at a time)
Supersedes: none
Superseded by: (future Phase 2 decision — TBD)

##### Decision

Phase 1 of the Intake → Box unification ships read-only synthesis, the Reports list split, and box-folder ingest. **It explicitly does not** plumb each box's `AGENTS.md` into the `/api/reports/<slug>/ask` system prompt, build per-box analytics templates, or start any reactive-box-bus / ledger trickle-down work. The ask path stays the existing generic prompt assembly.

##### Context

The bigger architecture discussed in this session (every state-bearing surface becomes a box; ledgers route entries downstream to subscribed boxes; sub-agents per box interpret incoming entries) is the right ultimate frame. It is also the **hardest** piece in the project. Building it before the ledger system and sub-agent fleet are stable would force re-wiring on every new ledger and every new sub-agent — exactly the half-finished state the cleanup phase is supposed to prevent.

##### Rationale

- **Cleanup-phase rule** (DEC-2026-04-28-008): one ledger at a time. The same posture applies to architecture: one major surface at a time.
- The Phase 1 surfaces (Reports list split, synthesized view, box-folder ingest) have **zero** dependencies on agent-config plumbing or the bus. They ship cleanly today.
- The bigger architecture has **many** dependencies on ledgers and sub-agents that do not yet exist at sufficient depth. Building the bus before the engines = wiring without engines.
- Phase 2 (per-box `AGENTS.md` → ask system prompt) is the natural next step and can ship without disturbing Phase 1's surfaces.

##### Alternatives Considered

- Ship Phase 1 + agent-config plumbing together — rejected: stretches scope; adds risk to a phase whose value is "talk to the box, today."
- Ship Phase 1 + analytics-as-box — rejected: analytics templates need per-box data shapes that require the ledger system to be further along.
- Defer Phase 1 entirely until the bus is ready — rejected: forfeits the ~1 day of value from "talk to the box, today."

##### Consequences

- Intake ask on a Box Report uses the same generic prompt assembly as Workspaces. Hugo's existing `AGENTS.md` is read as a document but not honored as an operating contract — yet.
- Phase 2 work scope: read `AGENTS.md` (and possibly `CLAUDE.md`, `06_logic.md`, `07_skills_used.md`, `08_automations.md`) when present, fold them into the ask system prompt, fall back to a generic "client-box assistant" prompt otherwise.
- Phase 3+ work scope: per-box analytics templates; only after the ledger system can carry per-box state stably.
- Reactive box-bus / ledger trickle-down: deferred until the ledger taxonomy and steward agents are stable. This is the design captured in this session's chat history; it should land as its own Decisions Ledger entry when it ships.

##### Do Not Undo Casually

Do not start Phase 2/3 work or the bus design while Phase A (ledgers) of DEC-2026-04-29-002 is in flight. The phasing rule is the protection against half-finished architecture.

##### Review Trigger

- Phase A of DEC-2026-04-29-002 completes (all planned ledgers active, stewards landed for the load-bearing ones).
- A user-facing need emerges that requires box-aware ask behavior before then (e.g., a box's `06_logic.md` materially changes how an answer should be phrased and a generic prompt produces wrong output).

##### History

- 2026-04-29 — created. Phase 1 implementation shipped same day.

---

#### DEC-2026-04-29-013 — Reactive Box Network Is The Target Architecture (schema only; runtime deferred to Phase C)

Status: **active**
Confidence: high
Scope: global / architectural
Date: 2026-04-29
Decider: User (Jake) — autonomous-call delegated to Cowork session
Affected systems: every stateful entity in the project; the eventual bus runtime; every ledger authored from this point forward; every Box authored from this point forward
Related North Star goals: NS-01, NS-02, NS-04, NS-09, NS-10
Related ledgers: [`BOX_BUS_LEDGER.md`](BOX_BUS_LEDGER.md), [`BOX_LEDGER.md`](BOX_LEDGER.md), [`DEFINITION_OF_DONE.md`](DEFINITION_OF_DONE.md), DEC-2026-04-29-001 (Triad Spine), DEC-2026-04-29-002 (Three-Phase Build), DEC-2026-04-29-008 (Phase 1 Intake-Box read-mostly)
Supersedes: none
Superseded by: none — narrows DEC-2026-04-29-008's scope rather than replacing it

##### Decision

The project's target architecture is a **reactive network of Boxes connected by a routed Ledger bus**. The architecture is **specified now** (Phase 0, this session) in [`BOX_BUS_LEDGER.md`](BOX_BUS_LEDGER.md). The **runtime** — router daemon (or post-write hook), propagation ledger, T1/T2/T3 interpreters, validation enforcement, cycle enforcement — is **deferred to Phase C** of `DEC-2026-04-29-002`. Phase 0 ships schema and rules only: `box.json` manifest schema, ledger envelope schema, three routing tiers (Global / Domain / Local), three interpreter tiers (T1 deterministic / T2 small-LLM / T3 full sub-agent), hard-refusal cycle policy, "what is a Box / what is not" binding rule, and two worked examples (Hugo Casillas Client Box + Analytics Source Channels Snapshot Box).

##### Context

The architecture was first sketched in chat during the 2026-04-29 Phase 1 Intake → Box session and intentionally deferred (`DEC-2026-04-29-008`) because building runtime before the ledger taxonomy and sub-agent fleet stabilize would force re-wiring on every new ledger and every new sub-agent — exactly the half-finished state the cleanup phase was meant to prevent.

Today's update: Phase 9 (Definition of Done) closed the most foundational completion-rules gap; 9 ledgers are now active out of ~19 planned; all ledgers from here on out will be authored. Without a written architectural target, every one of those remaining ledgers risks being authored without the bus shape in mind — creating migration debt at Phase C. Writing the **schema** down now (a Phase A activity — it's a markdown ledger) gives every future ledger and every future Box a target to align against. Writing the **runtime** would still violate `DEC-2026-04-29-008` and is held.

##### Rationale

- **Schema first / routing second / interpreters third / runtime last.** The hard-but-cheap part is the schema. Authoring it during Phase A is correct; authoring runtime during Phase A is not.
- **Triad spine compatibility (`DEC-2026-04-29-001`).** Box Ledger owns the *concept*. Box Bus Ledger owns the *wire shape*. Definition of Done owns the *completion gate*. Decisions Ledger owns the *architectural lock*. Each leg has a distinct, non-overlapping responsibility.
- **Migration debt avoidance.** Every ledger and every Box authored between today and Phase C ships envelope-aware. When runtime lands, no migration pass is required.
- **Anti-half-finished discipline.** This Decision *narrows* DEC-2026-04-29-008 by carving the schema seam out of the deferred work, while explicitly preserving the runtime deferral. DEC-008's "Do Not Undo Casually" still binds against runtime work during Phase A.
- **Auditability.** A written architecture is reviewable by every future agent. Chat-history architecture is not.

##### Alternatives Considered

- **Defer the schema along with the runtime.** Rejected: every future ledger and every future Box would be authored guessing at a target. Migration debt compounds with each addition.
- **Ship schema + T1-only runtime now.** Rejected: the moment runtime ships, every new ledger requires re-touching the router and the subscription index. The cost shape is exactly what `DEC-2026-04-29-008` was designed to prevent.
- **Wait until Phase C and author schema + runtime together.** Rejected: by Phase C the project will have ~19 ledgers and ~40 Boxes authored without alignment to a target. Migration would be substantial.
- **Author schema in chat / docs / a Decisions Ledger entry only.** Rejected: the Bus design is large enough to deserve its own ledger with worked examples and Mermaid visuals; folding it into a Decision row buries the architecture.
- **Use a different name (e.g., "Event Bus Ledger," "Subscription Network Ledger").** Considered. Picked "Box Bus Ledger" because the unit of state on both ends of a route is a Box, and the bus carries Box-bound events.

##### Consequences

- **Phase A continues with envelope-aware ledgers.** Every remaining Phase A ledger (Source-of-Truth, Phase, Connections, Page Ledgers, etc.) declares its tier (`global` / `domain` / `local`) at authoring time. The envelope schema becomes the standard wrapper.
- **Box Ledger gets a §X cross-reference.** Concept lives in Box Ledger; manifest shape lives in Box Bus Ledger.
- **Definition of Done §5.7 (Box / Directory Work) gains a manifest-shape compliance check** that is **soft today** (no runtime to enforce against) and **becomes hard at Phase C** when runtime lands. Until then, manifest stubs are best-effort.
- **No runtime work permitted in Phase A.** Router, propagation ledger, interpreters, validation enforcement, cycle enforcement — all deferred to Phase C. `DEC-2026-04-29-008`'s "Do Not Undo Casually" line still binds.
- **Phase B steward agents (when they graduate from `/Subagent Boxes/`) author manifests for their target ledgers/systems** as part of graduation. This is how the manifest population begins without a runtime.
- **Phase C+1 backfill** authors manifests for the 28 Client Boxes, 10 Staff Boxes, orchestrator, inbox-skill, ledger directory, and app-ui root. The 28 Client Boxes are the largest manifest-authoring task in the project.
- **Open Problems Ledger** absorbs any pre-Phase-C architectural risks that surface (e.g., a manifest field that turns out to be insufficient).
- **The `analytics-snapshot` Box kind** introduced today (worked example B) reserves the pattern for Phase C+1, when each analytics script becomes a Box.

##### Do Not Undo Casually

Do not ship runtime (router, propagation ledger, interpreters, validation enforcement) during Phase A. The schema-only seam is the entire point of this Decision. If runtime feels tempting, route the urge into Open Problems Ledger or Communications Ledger — not into code. `DEC-2026-04-29-008`'s "Do Not Undo Casually" still binds against runtime work; this Decision does not soften it.

Do not change the manifest schema, envelope schema, tier model, or cycle policy without an explicit Decisions Ledger update. The schema is what makes Phase C land cleanly; drift now is migration cost later.

##### Review Trigger

- **Phase A completes** (all planned ledgers active, stewards landed for the load-bearing ones). Then this Decision and `DEC-2026-04-29-008` together unblock Phase B + Phase C runtime work.
- **A foreseen-but-unspecified field is needed** in `box.json` or the envelope. Schema additions are normal; review whether the addition needs a new Decision or a `BOX_BUS_LEDGER.md` update is enough.
- **A new tier is proposed** beyond Global / Domain / Local. That's a Decision-level change.
- **A new interpreter tier is proposed** beyond T1 / T2 / T3. That's a Decision-level change.
- **The cycle policy is challenged** (e.g., a real use case for declared cycles emerges). Currently hard-refusal; would be a Decision-level change.

##### History

- 2026-04-29 — created. Phase 0 schema shipped same day at [`BOX_BUS_LEDGER.md`](BOX_BUS_LEDGER.md) + [`BOX_BUS_LEDGER.json`](BOX_BUS_LEDGER.json) + three Mermaid visuals. Box Ledger and Definition of Done updated to point at it. Companion Communications Ledger entry: `COMM-2026-04-29-007`.

---

#### DEC-2026-04-30-001 — Server-synthesized JSON pattern for build_*.py → AnalyticsScreen integrations

Status: **active**
Confidence: high
Scope: domain — UI integration pattern for Analytics page panels backed by `Onboard Scripts/build_*.py` outputs
Tier (Box Bus): domain
Decided: 2026-04-30
Decided by: Jake (orchestrator) + Claude (Cowork)
Reference implementation: `_owner_stage_latest` in `server.py` + `OwnerStagePanel` in `screens.jsx` (landed same day)

##### Context

The 7 `analytics_*.py` scripts in `Onboard Scripts/` write pre-built JSON snapshots to `CCAgentindex/analytics/<name>_snapshot.json`, which `AnalyticsScreen` fetches directly. That works because those scripts hit Close.com and the JSON shape is designed for the panels.

The 21 `build_*.py` scripts are different: they read from `CCAgentindex/people/`, write to `CCAgentindex/intelligence/<area>/<date>.{md,json}`, and the *markdown* is the human narrative while the JSON is structured data — but **most build_*.py scripts have only produced markdown so far** (only 2 of 21 have JSON outputs in bedrock as of 2026-04-30). Future build_*.py outputs may also be markdown-only by design.

When integrating `build_owner_stage_dashboards.py` (the first build_*.py → AnalyticsScreen integration), the choice of data path was forced. Three real options existed.

##### Decision

**The integration pattern for `build_*.py` → `AnalyticsScreen` is a server endpoint that synthesizes JSON on every read by parsing the markdown output of the build script.** No JSON sidecar is written into bedrock. The build script's markdown remains the source of truth.

Concretely:

- One endpoint per build_*.py script, naming convention `GET /api/analytics/<area>` (e.g. `/api/analytics/owner_stage`).
- Endpoint walks `CCAgentindex/intelligence/<area>/`, finds latest dated subdir or sibling summary, parses the markdown, returns structured JSON.
- Frontend panel fetches the endpoint alongside the existing analytics snapshot fetches inside `AnalyticsScreen`'s `Promise.all`.
- Refresh path: re-run the build script to regenerate the markdown; reload the page to re-parse.

##### Alternatives Considered

- **Modify the build script to also emit JSON** — rejected. Scope creep into `Auto/Onboard Scripts/` (canonical location), forces a build pipeline change, doesn't help for scripts that haven't run yet, and creates two-source-of-truth risk between md and json that drift apart.
- **Parse markdown client-side in the browser** — rejected. Fragile to format changes, hard to test, doesn't scale to 19 future integrations, ships parser code in the JSX bundle for every page load.
- **Write a separate "synthesize JSON sidecar from existing markdown" one-shot script** — rejected. Adds a build step, requires coordination, persists synthesized state to disk creating drift risk if the markdown updates and the sidecar doesn't.

##### Consequences

- **Refresh latency is the file-read + parse cost** (microseconds for owner_stage; trivially cheap for any build_*.py output we'd reasonably surface).
- **No build pipeline change** required to ship the next 19 integrations. Pattern is: write the parser + register the endpoint route + write the panel + add the tab.
- **The build_*.py scripts can stay markdown-only** without the integration team needing to touch `Auto/Onboard Scripts/`.
- **Source-of-truth contract is explicit:** markdown is canonical; JSON is a view. Per `SOURCE_OF_TRUTH.md` §3 trust ordering — the build script's markdown is the per-domain source-of-truth for that intelligence area. The endpoint is a synthesizer, not a writer.
- **No new bedrock files created**, so no `indexes/index.json` registration needed for this pattern.
- **Sets the pattern for the remaining 19 build_*.py scripts:** action_intelligence, event_ops_registry, handoff_package, lead_business_context, lead_call_dossiers, lead_deal_sheets, lead_email_thread_library, lead_memory_briefs, lead_message_library, menu_intelligence, miscommunication_intelligence, operational_intelligence, phone_call_library, pricing_scope_intelligence, recovery_intelligence, schedule_commitment_registry, seller_performance_intelligence, source_channel_intelligence, unlinked_call_library.

##### Do Not Undo Casually

- This decision is reversible if the integration count grows large enough that on-the-fly parsing becomes noticeable, OR if the build_*.py scripts grow JSON outputs natively.
- Reversing means migrating to the analytics_*.py pattern (script writes a JSON sidecar to bedrock that the page fetches directly). That migration is mechanical but requires touching every endpoint and every panel.
- Don't reverse for one slow case — fix the parser. Reverse only if the pattern becomes a measured bottleneck.

##### Review Trigger

- 5+ build_*.py integrations exist and one of them measurably slows the analytics page load.
- The build_*.py scripts are migrated to emit canonical JSON natively (in which case this synthesizer pattern becomes redundant).
- An architectural decision elevates intelligence/ outputs to be Box-shaped (Phase C+1 per `DEC-2026-04-29-013` worked example B — the `analytics-snapshot` Box kind). At that point the synthesizer pattern is replaced by Box-managed materialized views.

##### History

- 2026-04-30 — created. Reference implementation: `_owner_stage_latest` (server.py) + `OwnerStagePanel` (screens.jsx). First build_*.py integration: `build_owner_stage_dashboards.py` → `/api/analytics/owner_stage` → `OwnerStagePanel` in the new "Pipeline by Stage" tab. First sweep: 28 leads · 1 owner · 26 stages.

---

---

#### DEC-2026-04-30-002 — Deprecation Ledger Lives At Global Tier; Snapshot Protocol Pairs With It

Status: **active**
Confidence: high
Scope: global — architectural lock for every retirement event in the project (file, folder, ledger entry, route, sub-agent, Box, schema, env var, API endpoint, widget, dependency, setting)
Tier (Box Bus): global
Decided: 2026-04-30
Decided by: Jake (orchestrator) + Claude (Cowork)
Affected systems: every Box that retires content; every ledger that has rows superseded; the future Snapshot Steward; the future `LEDGERS/BOXES/deprecation/` unified Box; `_snapshots/` directory; `.gitignore`; `LEDGERS/scripts/snapshot.sh`
Related North Star goals: NS-01 (legibility above all), NS-02 (file-tree-first), NS-09 (audit trail discipline)
Related ledgers: `LEDGERS/DEPRECATION.md`, `LEDGERS/scripts/snapshot.sh`, `DECISIONS_LEDGER` (this entry), `COMMUNICATIONS_LEDGER`, `OPEN_PROBLEMS_LEDGER`
Supersedes: none
Superseded by: none

##### Context

Jake surfaced a gap on 2026-04-30: with Phase A complete and Phase B opening (Box buildout for ledger stewards), the project tree is starting to accumulate things that need to retire — old draft folders, superseded ledger entries, the never-built Audit Ledger, the Apr 2026 trim retirements that were captured in `CLAUDE.md` and `GLOBAL_LEDGER` but never given a formal retirement record. There was no ledger for this. There was also no recovery surface — once something was deleted, it was gone, with no way for a future agent to know what was there or pull it back.

Two real architectural choices:

1. **Per-Box deprecation** — each Box keeps its own deprecation list. Local audit, no cross-cutting view.
2. **Global Deprecation Ledger** — single project-wide ledger captures every retirement, with a paired Snapshot Protocol providing the recovery surface.

Snapshots themselves had no home either. Jake suggested daily/weekly zip automation. That mechanism needed to live somewhere — not as a free-floating script, but as a protocol with retention rules, naming conventions, and a relationship to the Deprecation Ledger.

##### Decision

**The Deprecation Ledger lives at the global tier as `LEDGERS/DEPRECATION.md` + `LEDGERS/DEPRECATION.json`.** It is paired with a **Snapshot Protocol (Deprecation Ledger §7)** that defines what is captured, on what cadence, where it lives, retention rules, recovery procedure, and health checks.

Concretely:

- **Tier:** global. Every Box, every ledger, every file emits deprecation candidates upstream to this ledger.
- **Path:** `LEDGERS/DEPRECATION.md` + `LEDGERS/DEPRECATION.json`. Sits next to `DECISIONS`, `COMMUNICATIONS`, `OPEN_PROBLEMS`, `SOURCE_OF_TRUTH`, `PHASE` — the global continuity ledgers.
- **Lifecycle:** four states (`candidate` → `deprecated` → `archived` → `purged`) with explicit promotion rules and required fields per state. Plus `reversed` and `recovered` for round-trips.
- **Cardinal rule:** "Nothing leaves the project without a Deprecation entry and a Snapshot reference."
- **Incoming-link audit:** mandatory before any entry promotes from `candidate` → `deprecated`. Captures references that still need updating.
- **Snapshot Protocol:** four cadences (daily/weekly/monthly/manual) with retention rules (7/4/12/indefinite). Snapshot zips live at `_snapshots/<cadence>/` at the **project root** (not inside `CCAgentindex/`). `.gitignore` excludes `_snapshots/`.
- **Recovery key:** `(snapshot_id, snapshot_path)` — both fields live on every Deprecation entry.
- **Phase A:** ledger authored, manual snapshot script ships at `LEDGERS/scripts/snapshot.sh`, four backfill entries seeded (great-trim domains, Audit Ledger, sub-agent relocation, trim routes).
- **Phase B follow-up:** unified Box pattern at `LEDGERS/BOXES/deprecation/` per `DEC-2026-04-29-015` (matches the temporal_continuity Box), with a Snapshot Steward sub-agent.
- **Phase C runtime:** wire snapshot script to cron / launchd; hook steward into Box Bus runtime so any Box can `emit` deprecation candidates upstream.

##### Alternatives Considered

- **Per-Box deprecation only** — rejected. Scatters the audit trail. Future agents would need to walk every Box to know what's been retired project-wide. Recovery is hard because there's no central pointer to snapshots. Cross-cutting questions ("what did the Apr 2026 trim retire?") become impossible to answer without a global view.
- **No deprecation ledger; rely on git history alone** — rejected. Git tells you *when* a file was deleted but not *why*, *what replaced it*, *what depends on it that's still broken*, or *whether it's recoverable from a snapshot*. Git is content-truth; deprecation needs metadata-truth.
- **Snapshots as a separate ledger** — rejected. Snapshots are the **recovery surface** for deprecation; they have no independent purpose. Splitting them into a separate ledger creates a coordination burden ("did I update both?") and doesn't earn its complexity.
- **Snapshots stored in `CCAgentindex/`** — rejected. Bedrock is for canonical app state. Snapshots are local-only recovery archives that should not push to GitHub. They live at project root in `_snapshots/`.
- **Defer the entire ledger to Phase C with the runtime** — rejected. Phase B is starting now; we're already accumulating retirement debt (the four backfill entries are real). Authoring the schema + protocol now matches `DEC-2026-04-29-013` (schema canonical, runtime deferred — no migration debt later). Same pattern applied here.

##### Consequences

- **Single source of truth for retirements.** Anyone asking "what was deprecated and why" reads one ledger.
- **Recovery is always answerable.** Every entry pairs with a `snapshot_id` + `snapshot_path` (or explicit `not_recoverable` reason).
- **No silent deletion.** The cardinal rule binds every agent: deletion without entry is a violation of the Prime Directive on legibility.
- **Phase A backfill in scope.** Four pre-existing retirements (great-trim domains, Audit Ledger, sub-agent relocation, trim routes) were captured immediately so the project starts with an honest record.
- **Snapshot Protocol gives operational shape to "save before delete."** The `LEDGERS/scripts/snapshot.sh` runner is invokable manually today; cron-wired in Phase C.
- **`_snapshots/` is gitignored.** Snapshots are local-only. GitHub stays the source of truth for live content; `_snapshots/` is local recovery infrastructure.
- **Pairs with the unified Box pattern.** Phase B will land `LEDGERS/BOXES/deprecation/` to match `temporal_continuity/` — same triad shape (ledger + Box + steward).
- **Cross-ledger coordination is explicit.** Deprecation entries cross-reference Decisions / Open Problems / Communications. Affected domain ledgers (FCL / AWM / Connections / Page Ledgers) drop their rows when something deprecates.

##### Do Not Undo Casually

- Don't move the Deprecation Ledger to a per-Box scheme without a Decision. The cross-cutting view is the point.
- Don't push `_snapshots/` to GitHub. They are local recovery only. Gitignore stays.
- Don't allow retirement without an entry. The cardinal rule is binding — even for "obvious" or "small" deletions. The audit trail compounds.
- Don't promote past `deprecated` without the §5 incoming-link audit. Skipping the audit is how stale references get baked into the next sprint.

##### Review Trigger

- The ledger grows past a few hundred active entries and search/UX becomes painful (split by year? by category? evaluate then).
- Snapshot disk pressure becomes meaningful (review retention rules and selective inclusion).
- The Phase C Box Bus runtime ships and we want to evaluate whether per-Box `emits[]` of deprecation candidates obviates the need for human-authored entries (likely no — humans still need to *decide* to retire, the Bus just routes the candidate notifications).
- A regulatory or compliance requirement appears that mandates a different retention regime.

##### History

- 2026-04-30 — created. Authored alongside `LEDGERS/DEPRECATION.md` + `LEDGERS/DEPRECATION.json` + `LEDGERS/scripts/snapshot.sh` + `_snapshots/` directory + `.gitignore` update. Four backfill entries seeded (DEPR-2026-04-30-001..004). Triggered by Jake's observation that the project tree was accumulating retirement debt without a recovery mechanism.

---

---

#### DEC-2026-04-30-003 — Atom Ledger: PROBs Decompose 1:N Into Single-Session Claimable Atoms (Global Tier)

Status: **active**
Confidence: high
Scope: global — architectural lock for how problems become work; binds every agent claiming or releasing work and every PROB authored from this point forward
Tier (Box Bus): global
Decided: 2026-04-30
Decided by: Jake (orchestrator) + Claude (Cowork)
Affected systems: every active PROB (13 → 13×N atoms once decomposed); every agent claiming work (Cowork sessions, Claude Code subprocesses, Codex sessions, future runnable stewards); future Atomizer Steward at `LEDGERS/BOXES/atoms/steward/`; future `/api/atoms/*` endpoints; future Atoms UI page or panel
Related North Star goals: NS-01 (legibility above all), NS-02 (file-tree-first), NS-09 (audit trail discipline)
Related ledgers: `LEDGERS/ATOMS.md`, `LEDGERS/OPEN_PROBLEMS_LEDGER.md`, `LEDGERS/DECISIONS_LEDGER.md` (this entry), `LEDGERS/COMMUNICATIONS_LEDGER.md`
Supersedes: none
Superseded by: none

##### Context

Jake surfaced the gap on 2026-04-30: the Open Problems Ledger has 13 active PROBs, several of which are monolithic ("32-subdir bedrock reconciliation," "audit all 28 client boxes for guardrails," "promote 5 sub-agent packages"). Every session reads them, freezes, and defers. The PROBs aren't actionable as written — they're descriptions of state, not actions.

The unlock: decompose every PROB into atoms — single-session claimable units of work — with explicit acceptance criteria, effort estimates, and a claim protocol so multiple agents can work in parallel without colliding. Jake's framing: "If we have an atomized, decomposed list of all the stuff that needs to be done, then there'll be hundreds of easy problems instead of massive open problems that are impossible to deal with without knowing everything."

Three real architectural choices:

1. **Atoms as a separate global-tier ledger** with parent_problem_id reference — chosen.
2. **Atoms inline inside each PROB record** (extending Open Problems with `atoms[]` array per entry).
3. **Atoms as per-Box queues** (each Box maintains its own claimable work).

##### Decision

**Atoms live at the global tier as `LEDGERS/ATOMS.md` + `LEDGERS/ATOMS.json`.** PROBs decompose 1:N into atoms via mandatory `parent_problem_id` linkage. Single-writer claim protocol enables parallel agent work. The granularity rule caps atoms at 4h estimated effort; bigger gets re-decomposed.

Concretely:

- **Tier:** global. Every PROB feeds atoms here. Every claim/complete event hits this ledger.
- **Schema:** `id`, `parent_problem_id` (mandatory), `title` (imperative), `description`, `acceptance_criteria` (concrete + verifiable + single-pass), `estimated_effort` (5min/15min/30min/1h/2h/4h), `status` (`available`→`claimed`→`in_progress`→`completed` plus `blocked` and `abandoned`), `tier`, `area`, `parent_chain[]`, `blocked_by[]`, `blocks[]`, `claimed_by`, `claimed_at`, `in_progress_at`, `completed_at`, `completed_by`, `verification`, `do_not_undo_casually`, `notes`.
- **Claim protocol:** single-writer wins. Atomic update of `status` + `claimed_by` + `claimed_at` to BOTH `ATOMS.md` AND `ATOMS.json` in one unit of work. JSON is canonical for race resolution.
- **Stale-claim rule:** `claimed > 24h` with no `in_progress_at` — any subsequent agent may release back to `available`.
- **Granularity rule:** ≤ 4h estimated effort. Anything bigger MUST re-decompose. The whole point is breaking the freeze response to monolithic work.
- **Acceptance criteria standard:** concrete (file/endpoint/ledger row), verifiable in one pass, tied to artifacts that exist after the session.
- **Decomposition flow:** Phase A manual (human authors atoms from PROB close-criteria); Phase B Atomizer Steward reads new PROBs and proposes atoms to a `DRAFTS/ATOMIZATION/` review queue; Phase C atoms become Box Bus envelope citizens with `atom_completed` events routing to dependent Boxes.
- **Phase A proof:** PROB-2026-04-28-016 (bedrock reconciliation) decomposed into 26 atoms — 2 gates + 20 directory audits + 4 propagation. Total ~21.5 estimated hours, broken into single-session pieces.

##### Alternatives Considered

- **Atoms inline inside each PROB record** — rejected. Open Problems is a state-of-brokenness ledger; bloating each entry with claim metadata muddles its purpose. PROB entries grow unbounded as atoms accumulate, making OPL hard to read for its actual job (severity / urgency / close criteria). Cross-PROB atom queries (e.g., "show me everything available right now") would require parsing every PROB.
- **Per-Box atom queues** — rejected. Atoms cross-cut PROBs and PROBs cross-cut Boxes. A Client Box atom might depend on a Connections Ledger atom which depends on a Settings atom. Per-Box scatter loses the dependency graph and makes parallel work harder, not easier. Cross-Box claim collisions are also harder to detect.
- **No new ledger; just a TaskCreate-style task list** — rejected. Tasks are session-scoped; atoms must persist across sessions and across agents. The whole architectural shape (durable, claimable, dependency-aware) requires a ledger.
- **Defer to Phase C with the rest of the Box Bus runtime** — rejected. Same reasoning as DEC-2026-04-30-002 (Deprecation): the schema works without runtime; authoring it now means zero migration debt later, and we're already accumulating frozen PROBs.

##### Consequences

- **Parallel agent work becomes possible.** Multiple agents (Cowork, Claude Code, Codex, future stewards) read the `available` queue, claim distinct atoms, and ship in parallel without collision.
- **Monolithic PROBs stop scaring agents.** PROB-016 was deferred for 2 days because it was 32 directories of unclear scope. Decomposed, it's 26 individual claims any agent can pick up.
- **Acceptance criteria force concrete work.** "Improve X" stops being a valid task; the atom must name what file / endpoint / ledger row passes the check.
- **Audit trail compounds.** Each `atom_completed` event lands in `_ledger/activity.jsonl`; over weeks, this becomes a dense record of exactly what got done, by whom, with what proof.
- **The Atomizer Steward (Phase B) is now scoped.** Sub-agent watches new PROBs land, proposes atoms to a review queue, sweeps stale claims, surfaces PROB-closure-eligible candidates.
- **Phase C runtime gets a clean target.** Atoms become first-class Box Bus envelope citizens; UI surface (Atoms panel) lands naturally near the `automation` route.
- **Pairs with the unified Box pattern.** Phase B will land `LEDGERS/BOXES/atoms/` to match `temporal_continuity/` and `deprecation/`.

##### Do Not Undo Casually

- Don't move atoms inline into PROBs — the cross-cutting view is what makes parallel work possible.
- Don't break the parent_problem_id requirement. Orphan atoms are how the ledger drifts back into "tasks" instead of "work tied to known brokenness."
- Don't loosen the granularity rule. 4h is the cap because longer atoms reproduce the freeze response.
- Don't bypass the claim protocol. Two agents working the same atom is the failure mode the protocol prevents.
- Don't auto-close PROBs when their atoms complete. PROB closure is a separate human-or-steward review — atom completion is necessary but not sufficient.

##### Review Trigger

- The Atom Ledger grows past a few thousand entries and search/UX becomes painful (consider per-PROB rollups or year splits).
- The stale-claim rule (24h) proves too short or too long in practice — adjust based on observed claim patterns.
- The Phase C Box Bus runtime ships and we want to evaluate whether real-time atom dispatch obviates the manual claim step (likely no — humans still need to *decide* to take an atom; the bus just routes events).
- A regulatory or compliance requirement appears that mandates a different audit shape.

##### History

- 2026-04-30 — created. Authored alongside `LEDGERS/ATOMS.md` + `LEDGERS/ATOMS.json`. PROB-2026-04-28-016 decomposed as the proof case (26 atoms, ~21.5 estimated hours of work). Triggered by Jake's observation that monolithic PROBs were freezing the project: "if we have an atomized, decomposed list of all the stuff that needs to be done, then there'll be hundreds of easy problems instead of massive open problems."

---

---

#### DEC-2026-04-30-004 — Canonical Steward Path = `LEDGERS/BOXES/<name>/steward/` (resolves legacy vs unified-Box fork)

Status: **active**
Confidence: high
Scope: global — architectural lock for where every ledger steward sub-agent lives and how `server.py` finds it
Tier (Box Bus): global
Decided: 2026-04-30
Decided by: Claude (Cowork) under Jake's "best move you call it" delegation
Affected systems: every ledger steward sub-agent (current: `global_ledger_steward` legacy + `temporal_continuity_steward` unified + `atomizer_steward` unified declarative); `server.py` `_agent_run` dispatcher; `LEDGERS/AGENTS/` canonical pointer directory; `CCAgentindex/agents/<name>/` legacy path; the 4 unpromoted draft stewards (file_directory, north_star, open_problems, plus the temporal_continuity runnable form)
Related North Star goals: NS-01 (legibility above all), NS-02 (file-tree-first), NS-03 (single source of truth)
Related ledgers: `LEDGERS/ATOMS.md` (this decision completed `ATOM-2026-04-30-0027`), `LEDGERS/BOX_LEDGER.md`, `LEDGERS/BOX_BUS_LEDGER.md`, `DECISIONS_LEDGER.md` (this entry; depends on DEC-2026-04-29-001 triad + DEC-2026-04-29-015 unified Box pattern)
Supersedes: none — completes DEC-2026-04-29-015 by removing the path ambiguity it left open
Superseded by: none

##### Context

`DEC-2026-04-29-015` established the unified Box pattern: every ledger gets a Box folder at `LEDGERS/BOXES/<name>/` containing `box.json` + `BOX.md` + `steward/` + `receipts/`. The temporal_continuity Box (2026-04-29) and the atoms Box (2026-04-30) both stamped this pattern.

But the legacy steward `global_ledger_steward` was promoted to runnable BEFORE DEC-015, and lives at `CCAgentindex/agents/global_ledger_steward/`. The dispatcher (`_agent_run` in `server.py`, line 4891) reads from `CCAgentindex/agents/<name>/prompt.md`. Result: a real fork — two competing canonical paths for "where does a runnable steward live."

This was surfaced as `ATOM-2026-04-30-0027` (the architectural-gate atom blocking the 16 steward-promotion atoms in PROB-2026-04-30-005). Until resolved, the project couldn't promote any of the 4 unpromoted draft stewards without choosing arbitrarily and introducing more drift.

##### Decision

**The canonical home for every ledger steward sub-agent is `LEDGERS/BOXES/<name>/steward/`.** The unified Box pattern from DEC-2026-04-29-015 is fully realized: ledger + Box + sub-agent live in one folder family at `LEDGERS/BOXES/<name>/`.

Concretely:

- **Canonical files** for each steward live at:
  - `LEDGERS/BOXES/<name>/steward/AGENTS.md` (declarative scope)
  - `LEDGERS/BOXES/<name>/steward/config.json` (operating config)
  - `LEDGERS/BOXES/<name>/steward/prompt.md` (dispatch prompt)
- **Receipts** live at `LEDGERS/BOXES/<name>/receipts/`.
- **`LEDGERS/AGENTS/<name>/`** stays as a thin canonical-pointer directory — its files reference (or symlink to) the Box steward path. It exists for backwards compatibility with anything that already references the AGENTS path.
- **`CCAgentindex/agents/<name>/`** is the legacy path. It survives only for `global_ledger_steward` until that agent is migrated (`ATOM-2026-04-30-0044`). New stewards do NOT use this path.
- **`server.py` `_agent_run`** gets a fallback chain: try the legacy `CCAgentindex/agents/<name>/prompt.md` first (for backwards compatibility with `global_ledger_steward`), then fall back to `LEDGERS/BOXES/<name>/steward/prompt.md`. After `ATOM-0044` migrates `global_ledger_steward`, the legacy path may be removed entirely (its own atom + DEPR entry).
- **Dispatch URL stays the same:** `POST /api/agents/<name>_steward/run`. The dispatcher resolves the path internally; callers don't care.

##### Alternatives Considered

- **Path A: Reaffirm `CCAgentindex/agents/<name>/` as canonical** — rejected. Splits the unified Box pattern (BOX.md + box.json at `LEDGERS/BOXES/`, but the runnable bits at a different path). Future agents have to look in two places. Defeats the whole point of DEC-015.
- **Path B: Unified Box (chosen)** — fully realizes DEC-015. One home for the triad. The server change is small (one fallback line). `global_ledger_steward` migration is one follow-on atom.
- **Path C: Hybrid — symlinks from `CCAgentindex/agents/<name>/` → `LEDGERS/BOXES/<name>/steward/`** — rejected. Symlink discipline is a maintenance burden; prone to drift; introduces a second source of truth question (is the symlink the canonical entry point or the Box?). The server fallback chain is cleaner.
- **Path D: Defer this decision; keep ATOM-0027 open** — rejected. ATOM-0027 was blocking 16 atoms. Indefinite deferral undermines the whole atomization architecture (a queue with permanent blockers re-creates the freeze response).

##### Consequences

- **DEC-2026-04-29-015 (unified Box) is now fully load-bearing.** Every existing and future ledger steward must live at `LEDGERS/BOXES/<name>/steward/`.
- **server.py `_agent_run` gets one small change** (fallback path resolution). One line of code, plus a smoke test. Lands as part of `ATOM-2026-04-30-0044` (the migration atom).
- **`global_ledger_steward` requires migration** (`ATOM-2026-04-30-0044`). Independent of the 4 promotion chains; can be claimed in parallel.
- **The 4 unpromoted stewards (temporal_continuity, open_problems, file_directory, north_star)** all use the unified Box pattern from the start. No legacy entanglement. ATOMS-0028..0043 are now unblocked and claimable.
- **`LEDGERS/AGENTS/<name>/`** becomes a thin canonical-pointer / symlink directory rather than the home for full steward configs. (Or is removed entirely once the migration completes — that's a future decision.)
- **The `CCAgentindex/` bedrock no longer holds steward operational code** once migration completes. It returns to its purpose: app-state-only filesystem (people/, venues/, _ledger/, _inbox/, indexes/, agents/ for non-steward sub-agents like andre_escalation_ladder + inbox_triage).
- **PROB-2026-04-30-005 close-criteria simplify:** "all 5 stewards have runnable counterparts in `CCAgentindex/agents/`" gets revised to "all 5 stewards have runnable counterparts at `LEDGERS/BOXES/<name>/steward/` (or migrated symlinks for legacy)."

##### Do Not Undo Casually

- Don't reverse this without an explicit DEC. The path ambiguity that existed before this decision is exactly what we just removed — relitigating it produces drift.
- Don't break `global_ledger_steward` during migration. Keep the legacy path working until the smoke test on the new path passes.
- Don't introduce a third path for stewards. The fallback chain in `_agent_run` handles legacy + unified; nothing else.
- Don't put non-steward sub-agents (like `andre_escalation_ladder`, `inbox_triage`) into `LEDGERS/BOXES/`. Those aren't ledger stewards; they live at `CCAgentindex/agents/` per the original triad pattern.

##### Review Trigger

- The fallback chain in `_agent_run` causes operational confusion (e.g., a steward exists at both paths and the dispatcher picks the wrong one). Resolve by purging the legacy path entirely.
- A non-ledger sub-agent's home becomes unclear (the 2 existing app-level sub-agents use `CCAgentindex/agents/`; if more land, a separate decision may be needed for their canonical home).
- Phase C Box Bus runtime ships and `subscribes[]` / `emits[]` declarations need to read from a stable path — the unified Box path becomes load-bearing for the runtime then.

##### History

- 2026-04-30 — created. Resolved `ATOM-2026-04-30-0027` (the architectural-gate atom blocking 16 promotion atoms in PROB-005). Companion follow-on atom `ATOM-2026-04-30-0044` authored for `global_ledger_steward` migration. The first atom in the project to be claimed and completed under the new claim protocol — proves the protocol works end-to-end.

---

---

#### DEC-2026-04-30-005 — Box = Ledger + Rules + Sub-agent + Config + Receipts (Box Network Architecture target primitive)

Status: **active**
Confidence: high
Scope: global — architectural lock that names the **fused primitive** every future Box must converge toward, and binds the Phase 1-8 build path described in `LEDGERS/Drafts/box_network_architecture_scaffold.md`
Tier (Box Bus): global
Decided: 2026-04-30
Decided by: Jake (orchestrator) + Codex (scaffold co-author) + Claude (Cowork lock)
Affected systems: every Box project-wide (ledger Boxes, Client Boxes, Staff Boxes, page Boxes, automation Boxes, leaf Boxes — current count: 6 unified ledger Boxes + 28 Client + 10 Staff + planned page/automation); every project-level ledger (currently 19 active); every sub-agent (currently 5 ledger stewards runnable + 2 operational sub-agents); the planned Box Bus runtime; every CLAUDE.md and `AGENTS.md` across the project; the entire bedrock structure under `CCAgentindex/`
Related North Star goals: NS-01 (legibility above all), NS-02 (file-tree-first), NS-03 (single source of truth), NS-09 (audit trail discipline), NS-10
Related ledgers: `LEDGERS/Drafts/box_network_architecture_scaffold.md` (source artifact), `LEDGERS/BOX_LEDGER.md`, `LEDGERS/BOX_BUS_LEDGER.md`, `LEDGERS/SOURCE_OF_TRUTH.md`, `LEDGERS/DEFINITION_OF_DONE.md`, `LEDGERS/DECISIONS_LEDGER.md` (this entry), `LEDGERS/ATOMS.md`, `LEDGERS/OPEN_PROBLEMS_LEDGER.md` (PROB-2026-04-30-015 = parent of all decomposition atoms)
Depends on: `DEC-2026-04-29-001` (triad spine — Box+Ledger+Sub-agent as separate primitives), `DEC-2026-04-29-013` (Reactive Box Network is target architecture, runtime deferred), `DEC-2026-04-29-015` (unified Box pattern), `DEC-2026-04-30-004` (canonical steward path)
Refines: `DEC-2026-04-29-001` — the triad's three primitives are now declared to **fuse** into one mature primitive, not stay loose neighbors
Completes: `DEC-2026-04-29-015` — the unified Box pattern is now extended from "ledger Boxes" to **every** stateful entity in the project
Supersedes: none — refines and extends existing architectural decisions; does not replace them
Superseded by: none

##### Context

The project has been authoring Boxes, Ledgers, and Sub-agents as **related-but-separate primitives** since `DEC-2026-04-29-001` (triad spine) named them. The triad worked: every stateful thing got all three. But the three remained structurally separate — a Box was a folder, a Ledger was a file, a Sub-agent was a config + prompt elsewhere.

The Box Network Architecture scaffold (Jake + Codex synthesis, 2026-04-30, preserved at `LEDGERS/Drafts/box_network_architecture_scaffold.md`) proposes the **fused primitive**: every mature Box is **all three at once** — a stateful memory object with an operating contract, a steward that operates it, configuration that governs access, ledger files that record its state, and receipts that prove what happened.

The scaffold's working thesis: **a Box is not a folder. A Box is a stateful memory object with an operating contract.** Access is governed. When any agent enters a Box, it enters through local instructions, declared source-of-truth rules, routing subscriptions, interpreter rules, and append-only receipt discipline. The directory stops being passive storage. It becomes a **governed object** in the system.

Three pieces of evidence the architecture was already half-written before today:

1. **Two unified Boxes already exist** — `LEDGERS/BOXES/temporal_continuity/` and `LEDGERS/BOXES/atoms/` were authored under `DEC-2026-04-29-015` and demonstrate the pattern at the ledger level.
2. **Six unified Boxes operational by end of today** — temporal_continuity, atoms, open_problems, north_star, file_directory, global_ledger (the last migrated via `ATOM-2026-04-30-0044`).
3. **The atomization protocol works** — 18 atoms shipped today across multiple parallel sessions without a single collision, proving that bounded stateful objects with declared behavior can be operated in parallel by independent agents.

The scaffold extends this from a working pattern at the ledger tier to the **entire bedrock**: every stateful surface (clients, staff, pages, automation, intelligence outputs) becomes a Box. The Box Bus runtime (deferred per `DEC-2026-04-29-013`) becomes the substrate that turns the file tree into a reactive network.

##### Decision

**The mature primitive of the Comeketo Agent project is the fused Box: Box = Ledger + Rules + Sub-agent + Config + Receipts.**

Concretely:

- **A Box is a stateful memory object with an operating contract.** Not a passive folder; a governed object.
- **The mature Box shape** (per scaffold §2): `BOX.md` (human orientation), `box.json` (machine manifest), `LEDGER.md` + `LEDGER.json` (when ledger applicable), `AGENTS.md` (local law, when behavior differs from defaults), `steward/{prompt.md, config.json, skills/}` (runnable operator), `receipts/` (proof of work), `inbox/`, `outbox/` (Box Bus surfaces — physical or virtual per the resolution of Q5).
- **Authority tiers** (per scaffold §3): Tier 0 Constitutional (Global Ledger, SoT, North Star, Decisions, DoD, Box Bus) → Tier 1 Coordination (TCL, Communications, Open Problems, Atoms, Deprecation, Phase) → Tier 2 Domain (Client/Staff Boxes domain, Automation, Intake, Analytics, Connections, Guardrails) → Tier 3 Leaf (one client, one venue, one widget, one scheduled-fire). Tier is **structural**, not status.
- **Trickle-down is filtered inheritance** (per scaffold §4): a Box receives only the global rules that affect it + the domain rules that affect it + the local records it owns + the interpreted consequences it needs to act safely. Every cross-Box state propagation has a source, an interpreter, a destination, and a receipt.
- **Interpreters are first-class** (per scaffold §5): T1 deterministic mappers (~80%), T2 small-LLM templates (~15%), T3 full sub-agent stewards (~5%). Default is T1.
- **The Box graph is declared** (per scaffold §6): every Box's `box.json` declares both `subscribes[]` (inbound — what events from upstream Boxes affect me?) and `emits[]` (outbound — what events do I produce that other Boxes may subscribe to?).
- **Every meaningful flow is representable as Source → Interpreter → Destination** (per scaffold §7). No invisible magic. Every flow has a receipt.

The decision binds:
- **Phase 1-8 build path** (per scaffold §9): the path from current state to the fully-realized network is decomposed into 58 atoms under `PROB-2026-04-30-015`. This DEC authorizes that build.
- **Definition of Done For The Architecture** (per scaffold §10): six categories — Conceptual / Filesystem / Routing / Agent / Runtime / Safety / Maintenance. Atoms 0098-0102 verify each.
- **8 Open Questions** (per scaffold §12): each is a real architectural sub-decision. Atoms 0048-0055 resolve them. They are flagged as **review triggers** for THIS DEC — if any open question's resolution contradicts the fusion model, the system surfaces this DEC for review.

##### Alternatives Considered

- **Path A: Keep separate (triad as loose neighbors)** — rejected. The triad spine (`DEC-2026-04-29-001`) already named the three pieces but left them structurally split. Two days of working with the unified Box pattern (`DEC-2026-04-29-015`) at the ledger tier proved the **fused** primitive is materially more legible: agents read one folder and find the contract, the operator, the state, and the audit trail in one place. Splitting them again forces every agent to remember which folder holds which piece.
- **Path B: Fuse only stewards (Box + sub-agent only; ledger files stay separate)** — rejected. This is the *current* state for ledger Boxes (per `DEC-2026-04-29-015`: ledger files stay at `LEDGERS/<name>.md` and the Box governs by reference). It works for ledgers because every ledger has exactly one canonical file. But Client Boxes have many files (`01_comms.md`, `01b_comms_verbatim.md`, `comms/`, `client_ledger.md`, etc.) — there is no single canonical "ledger file" to reference. The fused primitive treats the *Box itself* as the unit of state, with its files as components. This works for both single-file (ledger) and multi-file (client / staff / automation) Boxes.
- **Path C: Defer to Phase C runtime (architecture-then-build)** — rejected. The scaffold itself proves the architecture is half-written already. Authoring the lock now means agents from this point forward author Boxes IN the fused shape, not against an inferior pattern that has to migrate later. Per DEC-2026-04-29-013, runtime is deferred but **schema is canonical**. This decision codifies the schema.
- **Path D: Adopt the scaffold as authored, without further architectural commitment** — rejected. The scaffold is a synthesis/proposal per its own framing — "not yet a binding Decision." 8 Open Questions sit unresolved. Adopting without locking the central commitment leaves the architecture conditional. This DEC locks the fusion thesis; Q1-Q8 land separately as DEC-2026-04-XX-XXX entries (atoms 0048-0055), refining details under the locked thesis.

##### Consequences

- **The Phase 1-8 build path activates.** All 58 atoms under PROB-015 become live work, sequenced via dependency graph. Foundation (3) → Open Questions (8) → Phase 1 (5) → Phase 2-8 cascading.
- **`BOX_LEDGER.md` gains the mature Box shape definition** (Phase 1.1 / `ATOM-2026-04-30-0056`). The Box concept evolves from "directory orientation" to "governed object."
- **`BOX_BUS_LEDGER.md` gains the source/interpreter/destination model** (Phase 1.2 / `ATOM-2026-04-30-0057`). Routing becomes formal.
- **`DEFINITION_OF_DONE.md` gains a Box-completion gate** (Phase 1.3 / `ATOM-2026-04-30-0058`). Six sub-gates — Conceptual / Filesystem / Routing / Agent / Runtime / Safety / Maintenance — each must be verifiable.
- **`SOURCE_OF_TRUTH.md` gains the authority-tier framing** (Phase 1.4 / `ATOM-2026-04-30-0059`). Tier 0/1/2/3 becomes orthogonal to per-domain trust orderings.
- **`LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md` updates** to scaffold the full mature shape. New Boxes get the right structure on day 1 (Phase 2 / `ATOM-2026-04-30-0061`).
- **A Box scaffold script ships** (Phase 2.2 / `ATOM-2026-04-30-0062`). Authoring a new Box becomes mechanical instead of improvisational.
- **Every existing ledger gains a unified Box** (Phase 3 / `ATOM-2026-04-30-0067..0073`). 6 already exist; ~9 remaining ledgers get Boxes.
- **Every Box's `box.json` declares its graph membership** (Phase 4 / `ATOM-2026-04-30-0074..0079`). The system can answer "if this Box changes, who needs to know?"
- **Three real interpreters land** (Phase 5 / `ATOM-2026-04-30-0080..0085`). Atomizer Steward T3 (per Q4 priority), Allowed-To-Know T3 (closes PROB-001 fully), Page-Asset T2.
- **The Box Bus runtime ships** (Phase 6 / `ATOM-2026-04-30-0086..0093`). One real cross-Box envelope delivered with receipt = Phase 6 done.
- **Operational surfaces migrate** (Phase 7 / `ATOM-2026-04-30-0094..0097`). Hugo Casillas Client Box first per Q6.
- **The system becomes self-maintaining** (Phase 8 / `ATOM-2026-04-30-0098..0102`). Drift monitors, stale-claim sweepers, shape validators, conflict audits. Architecture-Done declared at `ATOM-2026-04-30-0102`.
- **Every CLAUDE.md and AGENTS.md eventually updates** to reflect "you are entering a Box." Mechanical contract per Q8.
- **Future PROBs decompose into atoms automatically** via the Atomizer Steward (Phase 5.4) once it ships.
- **Parallel-work substrate compounds** beyond the ledger tier. The 18-atom-shipped-today proof scales to client/page/automation work.

##### Do Not Undo Casually

- **Don't reverse without an explicit superseding DEC.** This is the architectural lock for the entire Phase 1-8 build. Reversing means re-litigating an architecture Jake spent significant time synthesizing with Codex, plus invalidating 58 in-flight atoms.
- **Don't fragment the fused primitive.** The whole point is one home for the triad. Adding "but the steward lives elsewhere" or "but the ledger lives elsewhere" anti-patterns reintroduces the friction this DEC resolves.
- **Don't treat the scaffold as superseded.** The scaffold (`LEDGERS/Drafts/box_network_architecture_scaffold.md`) is the **source artifact** — preserve it for historical reference. As pieces promote into canonical ledgers (per Phase 1 atoms 0056-0060), append a "Promotions Log" to the scaffold rather than deleting sections.
- **Don't act on Phase 1+ atoms before their dependencies land.** The dependency graph is real. Authoring `BOX_LEDGER` mature shape (Phase 1.1) without first resolving Q5 (inbox/outbox physical-vs-virtual) bakes in defaults that get reversed.
- **Don't auto-close PROB-2026-04-30-015 when atoms complete.** PROB closure is human-or-steward review per the steward doctrine. Atom 0102 surfaces PROB-015 for closure; closure is the human's call.

##### Review Trigger

This DEC has 8 explicit review triggers — one per Open Question (scaffold §12). If any of these resolve in a way that contradicts the fusion model, surface this DEC for review:

1. **Q1** (atoms 0048): If "ledger files inside Box" wins (rather than "governed by reference"), the fusion model needs to reflect file-relocation semantics.
2. **Q2** (atoms 0049): If "every Box must have local AGENTS.md" wins, the mature shape becomes stricter.
3. **Q3** (atoms 0050): If the minimum viable `box.json` schema is meaningfully larger than current declarative form, Phase 4 graph definition gains weight.
4. **Q4** (atoms 0051): If Page-Asset interpreter wins as first (rather than Atomizer Steward), the parallel-work compounding curve shifts.
5. **Q5** (atoms 0052): If "physical inbox/outbox folders now" wins, every Box gets new mandatory subdirectories.
6. **Q6** (atoms 0053): If Page Box or Automation wins as first migration (rather than Client Box), the migration template's shape tilts.
7. **Q7** (atoms 0054): UI tier visualization may surface a new constraint on how authority is enforced.
8. **Q8** (atoms 0055): "Entering a Box" mechanical contract may force CLAUDE.md (project) restructuring beyond what's anticipated.

Other review triggers:
- Phase 6 runtime experience reveals the fusion creates more friction than legibility (e.g., interpreter chains become too long, receipts grow unbounded, cycle detection refuses cases that should be allowed).
- A regulatory or compliance requirement appears that mandates strict separation of concerns between state, behavior, and configuration.
- The 4h granularity rule (per Atom Ledger) starts producing atoms that can't be sized because the fused primitive's surface is too large for one session — would suggest decomposing the primitive.

##### History

- **2026-04-30** — created. Authored as Foundation atom 2 of 3 in PROB-2026-04-30-015's decomposition pass. Triggered by Jake delivering the Box Network Architecture scaffold (Codex co-author) earlier the same day. Locks the architectural commitment that fuses Box + Ledger + Sub-agent into one mature primitive. Companion atoms: ATOM-2026-04-30-0045 (scaffold + PROB foundation, completed) + ATOM-2026-04-30-0047 (COMM handoff, follows). All 58 atoms in PROB-015 derive their authority from this DEC.

---

---

#### DEC-2026-04-30-006 — Minimum Viable `box.json` Schema For Phase B (resolves PROB-015 Q3)

Status: **active**
Confidence: high
Scope: global — architectural lock for the manifest format every Box must satisfy from Phase B onward; pins Phase B vs Phase C field requirements
Tier (Box Bus): global
Decided: 2026-05-01
Decided by: Jake (P-method delegation) + Claude (Cowork)
Affected systems: every existing `box.json` (5 in `LEDGERS/BOXES/<name>/`: temporal_continuity, atoms, global_ledger, file_directory, atlas) + every future Box manifest; `LEDGERS/BOX_BUS_LEDGER.md` §2.1 (manifest schema section); `LEDGERS/scripts/box_graph_validate.sh` (Phase 4.1 validator); the JSON Schema validator candidate in Phase 4
Related North Star goals: NS-01 (legibility), NS-02 (file-tree-first), NS-03 (single source of truth)
Related ledgers: `LEDGERS/BOX_BUS_LEDGER.md`, `LEDGERS/BOX_LEDGER.md`, `LEDGERS/Drafts/box_network_architecture_scaffold.md` (§12 Q3), `LEDGERS/ATOMS.md` (ATOM-2026-04-30-0050 = the question; ATOM-2026-04-30-0057 / ATOM-2026-04-30-0072 = consumers)
Depends on: `DEC-2026-04-29-013` (Reactive Box Network — schema canonical, runtime deferred), `DEC-2026-04-29-015` (unified Box pattern), `DEC-2026-04-30-005` (Box-Ledger-Sub-agent fusion is target primitive)
Resolves: PROB-2026-04-30-015 Q3 (one of 8 Open Questions)
Supersedes: none — pins what was previously implicit
Superseded by: none

##### Context

Per `DEC-2026-04-30-005`, every mature Box carries a `box.json` manifest. Five exist today (`temporal_continuity`, `atoms`, `global_ledger`, `file_directory`, `atlas`) and they vary in shape — the union of their top-level keys is 25 fields, but no two manifests have the same set. Some carry `migration_atom` and `promotion_atom`; others don't. Some have `does_not_own`; others don't. Some declare `canonical_path_decision`; others reference it implicitly.

This drift is acceptable in Phase A (manifests as illustrative) but becomes a problem at Phase 4 (when graph validation must run against every Box) and at Phase 6 (when the runtime reads manifests at dispatch time). The scaffold §12 Q3 asks: **what's the minimum every Phase B `box.json` must declare, before runtime arrives?**

##### Decision

**Phase B `box.json` minimum schema** — 9 required + 5 strongly-recommended + 3 runtime-only (Phase C):

**Required (9) — every Box must declare these, validation refuses anything missing:**

| Field | Type | Description |
|---|---|---|
| `id` | `"<kind>_box:<slug>"` | Stable identifier. `kind` from §3 below; `slug` matches the directory basename. |
| `slug` | string | Directory basename, lowercase, snake_case. |
| `kind` | one of `["ledger","client","staff","page","automation","intake","analytics","connections","leaf"]` | Per scaffold §3 authority tier mapping. |
| `name` | string | Human-readable name for `BOX.md` headers. |
| `version` | string (semver) | Manifest schema version. Phase B = `"1"`. |
| `tier` | one of `["global","domain","local"]` | Authority tier per `SOURCE_OF_TRUTH.md` §X (Phase 1.4 / `ATOM-2026-04-30-0059`). |
| `status` | one of `["draft","active","deprecated","archived"]` | Box's own lifecycle, not its content. |
| `owns` | array of paths | Files/directories this Box governs. Read by validators + steward agents. |
| `source_of_truth` | object with `primary` (path) + `structured_mirror` (path or null) + `generated` (array) | Per `SOURCE_OF_TRUTH.md` per-domain trust ordering. |

**Strongly-recommended (5) — required for stewards-with-runnable-form, optional otherwise:**

| Field | Type | Description |
|---|---|---|
| `agent_config` | object | Steward dispatch config: `package_path`, `agents_md`, `config_json`, `prompt_md`, `dispatch_planned` (HTTP route), `runnable_form_path_planned` (legacy or unified). Required if Box has a steward. |
| `created_on` | ISO8601 date | When the Box was authored. |
| `unified_box_pattern_decision` | string (DEC ID) | Pointer to the DEC that authorizes this Box's structure. Currently `"DEC-2026-04-29-015"` for ledger Boxes. |
| `phase_status` | object | Per-phase status: `phase_a` / `phase_b` / `phase_c` strings describing where this Box is in the build path. |
| `related_ledgers` | array of strings | Cross-references to other ledgers/Boxes (informational; not used for routing). |

**Runtime-only (3) — Phase C fields that are OPTIONAL during Phase B (declarative form only) and BECOME REQUIRED at Phase C runtime activation:**

| Field | Type | Description |
|---|---|---|
| `subscribes` | array of subscription objects | Inbound graph edges. Each entry: `source` (Box id or ledger name), `scope` (filter expression), `interpreter` (T1/T2/T3), `write_target` (where the interpreted result lands), `phase_c_note` (optional — describes deferred behavior). |
| `emits` | array of emission objects | Outbound graph edges. Each entry: `target` (downstream Box id or ledger), `on_event` (event name), `interpreter` (T1/T2/T3), `requires_receipt` (boolean), `phase_c_note` (optional). |
| `envelope_v` | string | Box Bus envelope version. Phase B = `"1"`. |

**Validation rules:**

1. **Required fields are validated by `LEDGERS/scripts/box_graph_validate.sh`** (Phase 4.1 / `ATOM-2026-04-30-0074`). Missing required field → validation refuses; activity ledger gains a `box_manifest_invalid` line.
2. **JSON Schema file** lives at `LEDGERS/BOXES/box_bus/registry/box.schema.json` (Phase 6.2 / `ATOM-2026-04-30-0087`). Phase B form encodes the 9 required + 5 recommended + 3 runtime-optional. Phase C form flips the 3 runtime fields to required.
3. **Existing manifests are grandfathered** until Phase 4.1 runs. The validator's first pass produces a per-Box gap report; ATOM-2026-04-30-0074 brings every existing Box into compliance.
4. **Field naming is canonical.** `subscribes` (not `subscriptions`), `emits` (not `emissions`), `owns` (not `ownership`). The 5 existing manifests already use these names; locking them now prevents renames later.
5. **Optional fields beyond this set are allowed** — manifests may carry `does_not_own`, `migration_atom`, `promotion_atom`, `history`, `ledger_local`, `structure`, etc. The schema validator IGNORES unknown fields (extension-friendly).

##### Alternatives Considered

- **Path A: Loose schema (no validation, manifests vary)** — rejected. Drift across 5 existing manifests is already noticeable; allowing more drift makes Phase 4 graph validation impossible because the validator wouldn't know which fields to read.
- **Path B: Maximum schema (every observed field becomes required)** — rejected. Forces every Box to declare 25 fields. Most Boxes don't need `migration_atom` or `promotion_atom`. Bloats the manifest format and creates mandatory boilerplate.
- **Path C: Phase B = bare minimum (id + slug + kind only); Phase C = full schema** — rejected. Too thin. `owns[]` is needed for ledger validators NOW (the file_directory steward already uses it). `source_of_truth` is needed for SoT audits (Phase 8.3 / `ATOM-2026-04-30-0100`).
- **Path D: Defer Q3 entirely until Phase C** — rejected per Atom Ledger anti-pattern (Open Questions held indefinitely undermine the architecture). Resolving now means Phase 1.2 / `ATOM-0057` (Box Bus Ledger update) and Phase 4.1 / `ATOM-0072` (subscribes/emits population) can both proceed with concrete spec.

##### Consequences

- **Box Bus Ledger §2.1 updates** (Phase 1.2 / `ATOM-2026-04-30-0057`) to encode this 9+5+3 schema explicitly with examples.
- **Phase 4.1 graph validation script** (`ATOM-2026-04-30-0074`) takes this schema as its input contract. Running it against the 5 existing Boxes will produce a gap report; the same atom brings them into compliance.
- **JSON Schema file ships in Phase 6.2** (`ATOM-2026-04-30-0087`), giving the runtime a deterministic validator before delivery.
- **Existing Box authoring discipline** doesn't change much — the 5 existing manifests already declare 7-9 of the 9 required fields. Most just need to add a missing `tier` or `status` field to comply.
- **Future Box authoring** (per `LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md`, updated in Phase 2.1 / `ATOM-2026-04-30-0061`) becomes mechanical: author from template, fill 9 required + 5 recommended, leave 3 runtime fields as `[]` until Phase C.
- **Phase 4.1 / 4.2 (subscribes/emits + authority tier registry)** can proceed with confidence that every Box manifest will have a parseable `tier` field and a declarable graph topology.

##### Do Not Undo Casually

- **Don't shrink the required set.** The 9 fields are the minimum that makes Phase 4 validation work. Removing any of them re-creates the drift problem.
- **Don't promote the 3 runtime fields to required during Phase B.** That breaks the "schema canonical, runtime deferred" contract from `DEC-2026-04-29-013`. Existing Boxes don't have populated `subscribes[]`/`emits[]` yet — that's Phase 4.1's job.
- **Don't rename canonical fields.** `subscribes` / `emits` / `owns` are locked. Renaming requires a new DEC superseding this one.
- **Don't loosen the validator.** The point of pinning the minimum is enforcement at Phase 4. If validation gets soft, drift returns.

##### Review Trigger

- Phase 4.1 graph validation reveals a field that's universally needed but isn't in the required set (likely candidate: `created_on` promoting from recommended → required).
- Phase 6 runtime experience surfaces a field the schema doesn't capture (likely candidate: explicit `agent_dispatch_url` for non-default routes).
- The 4h granularity rule produces atoms that can't be sized because manifest authoring takes too long under this schema (would suggest the recommended set is too heavy).
- A new Box kind appears that doesn't fit the 9 enumerated `kind` values (would expand the enum, not the field set).

##### History

- **2026-05-01** — created. Resolved `ATOM-2026-04-30-0050` (Q3 of 8 Open Questions in PROB-2026-04-30-015). Authored under Jake's P-method push. Surveys the 5 existing `box.json` manifests for shared structure; pins 9 required + 5 recommended + 3 runtime-only fields. Unblocks `ATOM-2026-04-30-0057` (Phase 1.2 Box Bus Ledger update) and `ATOM-2026-04-30-0072` (Phase 4.1 subscribes/emits population). Companion atom for the same Q-resolution path: `ATOM-2026-04-30-0049` (Q2 AGENTS.md required vs optional) — should resolve next under same pattern.

---

---

#### DEC-2026-04-30-007 — `AGENTS.md` Required For Boxes-With-Stewards, Optional For Leaf Boxes (resolves PROB-015 Q2)

Status: **active**
Confidence: high
Scope: global — architectural lock for `AGENTS.md` presence in every Box
Tier (Box Bus): global
Decided: 2026-05-01
Decided by: Jake (P-method) + Claude (Cowork)
Affected systems: every existing and future Box's `AGENTS.md` (or `steward/AGENTS.md`); `LEDGERS/BOX_LEDGER.md` §Naming Rules (Phase 2.3 / `ATOM-2026-04-30-0063`); `LEDGERS/DEFINITION_OF_DONE.md` §X Box-completion gate (Phase 1.3 / `ATOM-2026-04-30-0058`); `LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md` (Phase 2.1 / `ATOM-2026-04-30-0061`)
Related ledgers: `LEDGERS/Drafts/box_network_architecture_scaffold.md` (§2 + §12 Q2), `LEDGERS/BOX_LEDGER.md`, `LEDGERS/DEFINITION_OF_DONE.md`, `LEDGERS/ATOMS.md` (ATOM-2026-04-30-0049 the question)
Depends on: `DEC-2026-04-30-005` (Box-Ledger-Sub-agent fusion), `DEC-2026-04-30-006` (box.json minimum schema)
Resolves: PROB-2026-04-30-015 Q2

##### Decision

**`AGENTS.md` placement rule:**

| Box class | `AGENTS.md` requirement |
|---|---|
| **Boxes WITH a steward** (ledger Boxes, automation Boxes, intake/analytics/connections Boxes — anything that runs autonomous behavior) | **REQUIRED** at `<box>/steward/AGENTS.md` (declarative scope for the steward). Encodes local law that the steward enforces. |
| **Boxes WITHOUT a steward but WITH local rules different from upstream defaults** (e.g., a Client Box with client-specific guardrails like Brenda fee-waiver rules per `DEC-2026-04-28-005`) | **REQUIRED** at `<box>/AGENTS.md` (root level). Encodes local-stricter-than-upstream rules. |
| **Leaf Boxes with no local-stricter behavior** (Tier 3 — most Client/Staff/Venue records that follow standard upstream rules) | **OPTIONAL.** `BOX.md` + `box.json` are sufficient. Adding `AGENTS.md` is allowed but creates redundant noise. |

**Co-existence rule:** A Box MAY have both `<box>/AGENTS.md` (root-level local law for any agent) AND `<box>/steward/AGENTS.md` (declarative scope for the runnable steward). When both exist, root-level governs the Box's behavior; steward-level governs the steward's operation. Existing unified ledger Boxes use only the steward-level form (no root-level AGENTS.md needed because the ledger-Box-with-steward case is already covered).

**Discovery rule (per Q8 protocol when it lands):** any agent entering a Box reads, in order: `BOX.md` (orientation), `box.json` (manifest), `AGENTS.md` if present (local law), `steward/AGENTS.md` if present (steward scope). Missing files are treated as "no local override" — upstream defaults apply.

##### Alternatives Considered

- **Path A: Universally required (every Box must have AGENTS.md)** — rejected. Forces leaf Boxes to carry boilerplate that just restates upstream defaults. Bloats the file tree without earning legibility. Anti-pattern: "AGENTS.md exists but says 'see upstream rules' because there are no local rules."
- **Path B: Universally optional (Boxes never required to have AGENTS.md)** — rejected. Boxes-with-stewards NEED local-law declaration — that's how the steward enforces its scope without re-reading every upstream ledger. Optional-everywhere defeats the purpose at the steward tier.
- **Path C: Required only at `steward/AGENTS.md`, never root-level** — rejected. Some Boxes have local rules that aren't tied to a steward (e.g., a Client Box's per-client guardrails per DEC-005, where the operator is whatever agent is currently working). Root-level AGENTS.md is the right home for that case.

##### Consequences

- **Box Ledger §Naming Rules** (Phase 2.3 / `ATOM-2026-04-30-0063`) codifies the placement rule: `<box>/AGENTS.md` (root local law) vs `<box>/steward/AGENTS.md` (steward declarative scope) vs both vs neither.
- **DoD Box-completion gate** (Phase 1.3 / `ATOM-2026-04-30-0058`) inherits this rule: a Box is "complete" only if `AGENTS.md` is present (per the rule above) OR explicitly declared not-applicable in `box.json` notes.
- **LOCAL_TEMPLATE scaffold** (Phase 2.1 / `ATOM-2026-04-30-0061`) ships variants per Box kind: ledger-with-steward template includes `steward/AGENTS.md`; leaf template doesn't.
- **5 existing unified Boxes already comply** (temporal_continuity, atoms, global_ledger, file_directory, atlas — all have `steward/AGENTS.md`). No retrofitting needed.
- **Future Client Box migrations** (Phase 7 / `ATOM-2026-04-30-0094`) may add root-level `AGENTS.md` for client-specific guardrails (Brenda fee-waiver, etc.). The migration template per Q6 resolution should anticipate this.

##### Do Not Undo Casually

- Don't promote optional-for-leaves to required-for-leaves. Adding `AGENTS.md` to every Tier 3 Client Box bloats the tree without earning legibility.
- Don't demote required-for-stewards to optional-for-stewards. Stewards depend on declared local law to enforce scope without re-walking upstream ledgers.
- Don't conflate root-level and steward-level AGENTS.md. They serve different audiences (root = any agent operating in the Box; steward-level = the steward's own scope).

##### Review Trigger

- A leaf Box class emerges where local-stricter rules are common but no steward exists (would suggest making root-level AGENTS.md required for that class).
- Q8 ("entering a Box" mechanical contract) resolves in a way that conflicts with this discovery rule.
- The 4h granularity rule produces atoms that can't be sized because Boxes-with-AGENTS.md require too much per-Box authoring (would suggest leaner template defaults).

##### History

- **2026-05-01** — created. Resolved `ATOM-2026-04-30-0049` (Q2). Authored under Jake's P-method push. The 5 existing unified Boxes already comply with the steward-AGENTS.md form; this DEC pins the rule for Boxes that don't yet exist. Companion atoms in same chain: ATOM-0050 (Q3 schema, completed) + ATOM-0051..0055 (remaining 5 Open Questions, available).

---

## 6. Deprecated / Reversed Decisions

No formal deprecated decisions yet.

Candidates to record later if the relevant rules are explicitly stated and reversed:

- Any earlier assumption that seven-day plans could be directly executable without a guardrail compiler — partially captured by DEC-2026-04-28-004 but never formally a Decision.
- Any earlier assumption that generic Close drip style was acceptable for high-value Client Boxes — informally rejected by NS-04 and the Wholesome Enrichment principle, but never a formal Decision.
- The plumbing-first build order — recorded as `COMM-2026-04-28-008` (abandoned attempt), not as a deprecated Decision because it was never formally a Decision in the first place.

When promoting a workflow / architectural reversal here:

1. Mark the old decision `superseded` and link to the new one.
2. Create the new decision and link `Supersedes: <old ID>`.
3. Append history line on both.
4. Update §4 Current Active Decisions (move old out of active table).
5. Update affected ledgers.

---

## 7. Decision Dependencies

Decisions form a graph. The visual lives at `LEDGERS/VISUALS/decision_dependency_map.mmd`. Text version:

- **DEC-001** (GitHub source of truth) is the foundation. It supports DEC-002, DEC-008, and every ledger decision.
- **DEC-002** (FileTree over RAG) depends on DEC-001 and is presupposed by every Box / Ledger decision.
- **DEC-2026-04-29-001** (Triad Spine) depends on DEC-002 and shapes everything stateful in the project.
- **DEC-003** (Client Boxes canonical) depends on DEC-002 and is reinforced by DEC-2026-04-29-001 (Client Boxes are the most concrete instance of the triad's Box leg).
- **DEC-004** (plans are drafts) depends on DEC-003 and on guardrail policy.
- **DEC-005** (risky moves require isolated approval) depends on DEC-004 and gates the inbox automation.
- **DEC-006** (Boxes page is display) depends on DEC-003.
- **DEC-007** (sitemap Done Gate) supports DEC-006 and supports any future page-shaped decision.
- **DEC-008** (one ledger at a time) depends on DEC-001 and shapes Phase A of DEC-2026-04-29-002.
- **DEC-2026-04-29-002** (three-phase build) depends on DEC-2026-04-29-001 and contains DEC-008 as its Phase A workflow.
- **DEC-2026-04-29-003** (TCL/GL update discipline) depends on DEC-001 and is enforced by every other decision.
- **DEC-2026-04-29-004** (Audit removed from build queue) depends on DEC-008 (one ledger at a time gives space to make the call) and on the existence of Open Problems + Decisions + Communications + per-Box.

---

## 8. Decisions Needing Review

This is **not** a list of open problems. It is a list of *known unsettled questions where a working assumption is in use* — questions that should become real decisions soon.

### REVIEW-approval-ui-risk-card-standard

Status: needs future decision
Related to: DEC-2026-04-28-005

**Question.** What exact UI / process should isolate approval for risky moves?

**Current working assumption.** Risky moves become explicit approval cards requiring specific confirmation. Format and storage are not yet specified.

**Needs decision on:**

- wording (what the card says about the risk)
- approval logging (where the approval is recorded)
- where approval lives (in the Client Box? in `_ledger/`? in a dedicated approvals table?)
- whether approval expires (and how)
- how approval attaches to future sends (signed token? reference ID? audit field on the send?)

**Suggested timeline.** When the approval surface gets concrete UI work, this becomes a real Decision.

---

If a question is fully unresolved (not "we have a working assumption" but "we don't know"), it belongs in `OPEN_PROBLEMS_LEDGER.md`, not here.

---

## 9. Common Decision Mistakes

Guardrail for future agents authoring or auditing this ledger:

- Treating a one-time workaround as a global decision.
- Making a decision in chat but not recording it.
- Recording what was chosen but not why.
- Failing to mark experimental decisions as `experimental` (everything is `active` and the meaning of `active` deflates).
- Forgetting to mark old decisions `superseded` when they're replaced.
- Reopening settled architecture without reading the Decisions Ledger first.
- Applying a local client rule globally (one Client Box's edge case becoming a project-wide constraint).
- Letting a tool's convenience override source-of-truth decisions.
- Recording an unresolved question in §5 as if it were settled — put it in §8 or in Open Problems.
- Inventing decisions to pad the ledger. If everything is a decision, nothing is a decision.

---

## 10. Visualization Index

Mermaid `.mmd` files under `LEDGERS/VISUALS/`:

| Visual | Path | Purpose |
|---|---|---|
| Decision dependency map | [`VISUALS/decision_dependency_map.mmd`](VISUALS/decision_dependency_map.mmd) | Graph of how decisions depend on each other. |
| Decision timeline | [`VISUALS/decision_timeline.mmd`](VISUALS/decision_timeline.mmd) | Chronological view of all active decisions. |

---

## 11. Update Rules

### Update this ledger when

- a major architectural choice is made
- an operational rule is settled
- a safety / guardrail rule is settled
- a source-of-truth rule is settled
- a project philosophy choice is made
- a previous decision is reversed (mark old as `superseded`, link new)
- an experimental decision graduates to `active`
- a `provisional` decision is confirmed or rejected

### Do **not** update this ledger when

- the choice is a one-time implementation detail (belongs in `git log` or `_ledger/activity.jsonl`)
- the choice is a working preference rather than a settled rule (belongs in Communications)
- the question is unresolved (belongs in Open Problems or §8 above)
- the rule is local to one Box (belongs in that Box's `BOX.md`)
- the change is a cosmetic edit to an existing decision (just add a History line)

### Decision Change Done Gate

A major decision is done when:

- [ ] decision is recorded
- [ ] context is recorded
- [ ] rationale is recorded
- [ ] affected systems are listed
- [ ] alternatives are noted if useful
- [ ] consequences are clear
- [ ] status is set
- [ ] confidence and scope are set
- [ ] review trigger is defined if needed
- [ ] related ledgers / docs are linked
- [ ] §4 Current Active Decisions index is updated
- [ ] Communications Ledger entry is marked `promoted` if the decision came from one
- [ ] activity.jsonl appended

If a decision reverses another:

- [ ] old decision is marked `superseded` / `deprecated`
- [ ] new decision links `Supersedes: <old ID>`
- [ ] old decision links `Superseded by: <new ID>`
- [ ] §4 index is updated (old removed from active table)
- [ ] §6 Deprecated / Reversed gets a row
- [ ] affected local rules are updated

---

## 12. Relationships To Other Ledgers

### North Star

Each major decision should list which North Star goals it supports. This creates alignment and prevents drift away from project intent.

If a decision does not support a North Star, it may still be necessary, but the reason should be recorded.

The 12 active decisions cover NS-01 through NS-10 collectively.

### Open Problems

Open Problems and Decisions are paired:

| Open Problem | Decision |
|---|---|
| "How do we classify allowed-to-know facts?" (PROB-001) | (future) "Allowed-to-know facts live in each Client Box as `allowed_to_use.md/.json` with categories X/Y/Z." |
| "Approval flow doesn't isolate risky moves." (PROB-003) | DEC-2026-04-28-005 (settled the principle; UI specifics still in §8 above). |
| "Bedrock was bootstrapped on the fly." (PROB-016) | (future, post-Phase-B) "Reconciled bedrock layout follows triad: <pattern>." |

When an open problem becomes settled, **promote it to Decisions**. Do not leave a decision implicit in the close of an Open Problem.

### Communications

Communications and Decisions are paired:

| Communication | Decision |
|---|---|
| "Be careful with risky moves in batch approval." (`COMM-2026-04-28-003`) | DEC-2026-04-28-005 |
| "Build ledgers one at a time." (`COMM-2026-04-28-001`) | DEC-2026-04-28-008 |
| "Triad spine is Box + Ledger + Sub-agent." (`COMM-2026-04-29-001`) | DEC-2026-04-29-001 |
| "Phase A → B → C build discipline." (`COMM-2026-04-29-003`) | DEC-2026-04-29-002 |
| "TCL/GL drift is the failure mode." (`COMM-2026-04-29-005`) | DEC-2026-04-29-003 |

When a Communication graduates into a settled rule, **promote it to Decisions**. The Communication entry stays in place (marked `Status: promoted`) for one full session cycle, then archives.

### Per-Box Ledgers

Some decisions are global (most of the 12 above). Some decisions are local to a specific Box (none currently). Local decisions belong in that Box's `BOX.md`, not here.

### Reconstruction Ledger (planned)

Build recipes should cite the decisions that shaped them. When a recipe rebuilds Client Box cleanup, it should cite DEC-003, DEC-004, DEC-005. When it rebuilds the ledger system, it should cite DEC-008 + DEC-2026-04-29-002.

### Definition of Done Ledger (planned)

The Done Gate in §11 above will eventually be referenced by the Definition of Done Ledger. DEC-2026-04-29-003 (TCL/GL update discipline) is the meta-completion rule that the DoD Ledger will codify in detail per surface.

---

## 13. Final Operating Rule

> A decision not recorded is a decision waiting to be forgotten.
>
> Write down the choice.
> Write down the why.
> Write down what future agents should not undo by accident.

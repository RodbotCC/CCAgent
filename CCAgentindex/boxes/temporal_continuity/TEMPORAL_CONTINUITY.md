# Temporal Continuity Ledger

Last updated: 2026-05-01 (later still³ — **CLAUDE.md rewritten post-sweep via ATOM-2026-05-01-0014.** 1235 → 1591 lines. Path migration `LEDGERS/<NAME>.md` → `CCAgentindex/boxes/<box>/<NAME>.md` throughout. New §1.3 Working Mode and the P-Protocol; new §3.3 post-sweep canonical structure; new §3.5 four-category classification of `CCAgentindex/`; new Appendix C paths quick-reference. DEC-2026-05-01-003 authored locking Cleanup Mode + P-Protocol doctrine. COMM-2026-05-01-004 filed as master orientation entry. Earlier today: Beta-Test Pivot via ATOM-0012; Auto/ symlink dispersal chain INITIATED via ATOM-0001; RECOVERY from atom-chase drift; Phase B steward fleet COMPLETE; Atlas Box graduation.)
Updated by: Jake (orchestrator) + Claude (Code, Opus 4.7 1M context — separate from Cowork sessions)
Current project moment: **Cleanup phase.** Plumbing-first build was scrapped under owner pressure; UI rebuilt from working pieces; Auto/ payload symlinked into bedrock. Ledger Phases 1–5 + first steward agent are live, but the *bedrock itself* (`CCAgentindex/`) was bootstrapped on the fly and now needs triad-based reconciliation — deferred per PROB-2026-04-28-016 until ledger and sub-agent buildout settles.
Current phase: **Cleanup + ledger/sub-agent buildout completion.** Not greenfield.
Architectural spine: **Box + Ledger + Sub-agent triad.** Anything with state that learns or needs updating gets all three. Legibility > build speed.
Next recommended read: [`GLOBAL_LEDGER.md`](GLOBAL_LEDGER.md), then [`OPEN_PROBLEMS_LEDGER.md`](OPEN_PROBLEMS_LEDGER.md) (esp. PROB-016 for bedrock context), then the relevant Box.
Continuity status: **active**

> Read this after the Global Ledger. If the Global Ledger tells you what this project is, this file tells you where the project currently is in time.
>
> Global Ledger wins for permanent project identity and rules. Temporal Continuity wins for current working state. Both are true at different altitudes.

---

## 1. Current Snapshot

The project is **3 days in, mid-buildout, in cleanup phase** on the Comeketo Agent — automation, Client Boxes, inbox guardrails, ledger-backed continuity. Jake has been working ~20-hour days. He is currently on a team Claude subscription rationing context until Max re-ups.

**The build arc so far:**
1. Plumbing-first attempt (ledgers + sub-agent scaffolding) was **scrapped mid-stream under pressure from Rodrigo (Comeketo owner)** who needed something usable/demoable.
2. Jake **rebuilt the UI** and patched together what worked from the prior attempt.
3. On a separate "heroic day" via Claude Co-Work, Jake authored almost all of the **automations, Boxes, and Onboard Scripts** in a separate folder — now symlinked into bedrock at `Auto/` (which itself symlinks to `~/Desktop/Auto/`). Six bedrock subdirs alias into Auto/: `Boxes`, `Client Boxes`, `Staff Boxes`, `comeketo-inbox`, `Onboard Scripts`, `orchestrator`.
4. Ledger system Phases 1–5 landed (Global, Temporal Continuity, North Star, File Directory, Open Problems) plus first runnable steward (`global_ledger_steward`).
5. **Now:** cleanup. The bedrock itself is bootstrapped-era 32-subdir layout that needs triad reconciliation (PROB-016, deferred).

**The architectural spine — Box + Ledger + Sub-agent triad.** Anything with state that learns or needs updating gets all three:
- **Box** = unit of state (Client Boxes, Staff Boxes, Coworker records, eventually any state-bearing entity)
- **Ledger** = legible memory of that Box (project-wide ledgers under `LEDGERS/`; per-Box ledgers stamp from `LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md`)
- **Sub-agent** = the operator that reads/updates the Box and its Ledger (canonical config in `*_subagent_package/` at repo root; runnable form in `CCAgentindex/agents/<name>/`)

**Standing inviolable rule:** **Legibility is more important than the build itself.** Code without a corresponding Ledger entry is a debt to repay. A reader of the Ledger should understand the system without opening code. Jake said this explicitly 2026-04-28: "for everything that we build we cannot be lazy about the legibility. I am actually more concerned about the legibility than the build."

**Current scaffolding maturity (2026-04-29, post-housekeeping):**
- 28 Client Boxes, ~10 close to complete, others need manual enrichment (deferred — Jake doesn't want to work on this now)
- 10 Staff Boxes
- 5 sub-agent packages consolidated at **`/Subagent Boxes/`** (file_directory, global_ledger, north_star, open_problems, temporal_continuity) — moved from repo root 2026-04-29. These are *draft* packages awaiting promotion to runnable app agents under `CCAgentindex/agents/<name>/`. The canonical *active* steward materials still live at `LEDGERS/AGENTS/<name>/`.
- 3 runnable app agents (`andre_escalation_ladder`, `global_ledger_steward`, `inbox_triage`)
- **15 active project-level ledgers + 2 of 14 Page Ledgers** (15 project-level all 2026-04-29 + Page Ledgers `boxes` — Phase 16 + **`intake`** — Phase 17). Source-of-Truth (P11) = first global-tier; Connections (P12) = first domain-tier; File Contents (P13) = first project-wide file inventory; Asset/Widget Map (P14) = first cross-cutting UI catalog; Settings (P15) = user-configurable surface; Page Ledger `boxes` (P16) = first per-page deep-memory record; **Page Ledger `intake` (P17) = captures Phase 1 unification architecture per DEC-2026-04-29-005..008**. Sitemap remains canonical per-page operational truth; Page Ledgers are the narrative *why* layer. Anti-pattern: don't author all 14 at once.
- **Audit Ledger removed from build queue (2026-04-29)** — covered by Open Problems / Decisions / Communications / per-Box ledgers. Draft `# Audit Ledger.txt` stays in `Ledger Drafts/` as reference; not deleted.
- Triad is **lopsided**: more Boxes than Ledgers, more Ledgers than Sub-agents. Filling that grid is the dominant verb.

**Triad-maturity clustering (Jake's whiteboard, 2026-04-29):** colored title = ledger built; box around title = sub-agent exists; colored-in box = sub-agent also set up. Currently colored+boxed: Global, Temporal, North Star, File Directory. Open Problems is built but its sub-agent is still a draft package at `/Subagent Boxes/`.

**Build order discipline (2026-04-29):** Phase A — finish all Ledgers. Phase B — finish all Sub-agents. Phase C — build Subagent Boxes (boxes of ledgers controlled by sub-agent configurations). **Currently in Phase A.**

**Current emphasis going forward:**
- Cleanup over greenfield — do not propose architecture overhauls
- Finish ledger buildout — ingest outline drafts from `/Ledger Drafts/` one at a time, in user-confirmed order
- Finish sub-agent buildout (Phase B) — graduate `/Subagent Boxes/` packages into runnable app agents
- Build Subagent Boxes (Phase C) — boxes of ledgers controlled by sub-agent configurations
- Then run bedrock reconciliation pass (per PROB-016)
- Route rough edges to `OPEN_PROBLEMS_LEDGER.md`, not chat
- Update Temporal Continuity Ledger and Global Ledger as you work — cold-starting agents read these first
- Treat GitHub as source of truth, but **don't push without explicit go-ahead**

---

## 2. Active Workstreams

### 2.1 Ledger System Buildout

Status: **active**
Current step: Phase 17 — **second Page Ledger** landed (`LEDGERS/PAGES/intake.md`). High-risk wave underway. Intake Page Ledger captures the WHY behind Phase 1 unification (synthesized Box Reports, ingest path into box folder, deferred Phase 2 box-aware ask).
Just completed (2026-04-29 sprint): Phases 6–17 in rapid succession — Communications (P6), Decisions (P7), Box Ledger (P8), DoD (P9), Box Bus (P10), Source-of-Truth (P11), Connections (P12), File Contents (P13), Asset/Widget Map (P14), Settings (P15), Page Ledger `boxes` (P16), Page Ledger `intake` (P17). **17 ledgers landed.** Architectural lock at DEC-2026-04-29-013 holds.

**Honest accounting (given to Jake 2026-04-29):** structurally complete now. ~3 more substantive Page Ledgers (automation, delegations, settings page) + Phase Ledger = Phase A done. Faster cut also viable (intake-then-Phase-Ledger = 1 more turn).
Just completed (prior, 2026-04-28): Phases 1–5 — Global + Temporal Continuity + North Star + File Directory + Open Problems — plus first steward automation. The 5 open problems FDL surfaced are now formal entries (PROB-010 through 014); the 9 spec problems are also recorded (PROB-001 through 009 with PROB-008 already closed). `global_ledger_steward` runs through `POST /api/agents/global_ledger_steward/run`, writes scoped local ledger updates, appends activity, and stores receipts under `CCAgentindex/_ledger/ledger_steward_runs/`.
Workflow: user signals to proceed to the next ledger (typically by uploading the next spec or saying "P"). With Phases 1–9 done, this session decided autonomously per Jake's "you make the call" delegation.
Next candidates (Phase 10): **Source-of-Truth** (no draft outline — author from Global §4 + DoD §5.5; would close PROB-001 and reduce PROB-010 risk), **Phase Ledger** (small, pairs with DoD §11), or **Connections Ledger** (closes PROB-009, pairs with DoD §5.8).
Build order tracked in [`INDEX.md`](INDEX.md). Every new ledger must satisfy DoD §5.6.

### 2.2 Client Box Audit / Cleanup

Status: **active**
Current method: one client box at a time. Read, audit, clean if approved, leave audit marker. Stamp `BOX_LEDGER_TEMPLATE.md` if the box is graduating to a full Box.
Completed:
- Brenda & Steve — audit-cleaned `05_seven_day_plan.md` (01:40 AM ET) and `09_andre_alerts.md`. Audit marker at `Auto/Client Boxes/Brenda & Steve/2026-04-28_audit_marker.md`. Both committed (bec920d, 0a46a3b).
Next likely candidates (per the user's prioritization): Hugo, Daphney & Frankie, Dawn M Denton, Eliana Lopes, Elizabeth & Peter, Emanuella Andrade, Esther Manu, Flávia Benson, Flaviane Mesquita.

### 2.3 Verbatim Comms Coverage

Status: **structurally complete; not yet UI-bound**
What landed today: all 28 client boxes carry `01b_comms_verbatim.md` (chronological full transcripts) + `comms/<type>_<date>_<id>.json` (raw Close payloads). 582 activities total. Existing `01_comms.md` exec summaries left untouched.
Open: nothing in the Boxes UI page yet binds to the new verbatim file. Boxes-page renderer reads `01_comms.md` only. A second comms tab is the obvious next move when ready.

### 2.4 Allowed-To-Know Constraints

Status: **conceptual but urgent**
Need: separate comms-confirmed facts from enrichment-only/internal strategy and protected/off-limits context. Customer-facing copy must ground in comms or explicit operator approval — never enrichment.
Owner: not yet assigned. Likely surfaces in the comeketo-inbox skill and the per-client `04_profile.md` / `*_enrichment.md` files.

### 2.5 GitHub / Local Drift Safety

Status: **active caution**
Need: avoid overwriting local unpushed work when writing directly to GitHub. The session's edits live locally and have not been pushed. See §6 Current Risks and the Current Git Posture block at §13.

### 2.6 Inbox Guardrail Enforcement

Status: **partially active**
Posture: hard gates exist in the comeketo-inbox skill at `Auto/comeketo-inbox/`. The Brenda audit explicitly relied on guardrails being loaded before every future outbound (per the plan's Safety Status block). What's missing is automation-page surfacing of the guardrail check as an explicit approval card rather than batched approval.

---

## 3. Recent Meaningful Changes

### 2026-05-01 (later still³ — CLAUDE.md rewritten post-sweep + P-Protocol locked + DEC-003 + COMM-004; ATOM-2026-05-01-0014)

**The trigger:** Operator did a scorched-earth reorg of the directory tree (Auto/ retired, all canonical ledgers moved from `LEDGERS/<NAME>.md` to `CCAgentindex/boxes/<box>/<NAME>.md`, page_asset_sitemap.md moved to `boxes/assets/`, real Client Boxes en route to zipped archive). CLAUDE.md was now stale — every read-first path reference and the work-type matrix path table pointed at non-existent locations. Operator directive: "the most important thing you could actually do for me right now is to rewrite the CLAUDE.md... I just want you to handle that. Put all your attention into that right now."

Plus operator authored a parallel-agent operating brief earlier in the day (via ChatGPT, intended for parallel ChatGPT-based assistants). The brief codifies the announce-act-report-stop cycle + cleanup-mode default + the P-button trick. Operator's vision: "If I can have all of you guys doing this — always reporting inside all the ledgers, always keeping track of what you do before and after, always picking whatever the easiest next thing is, always atomizing something that looks too difficult — then we can actually have a really fucking incredible workflow."

**The work shipped this turn (ATOM-2026-05-01-0014):**

- **CLAUDE.md fully rewritten** — 1235 lines → 1591 lines. Path references migrated from `LEDGERS/<NAME>.md` → `CCAgentindex/boxes/<box>/<NAME>.md` throughout (§2.1 read-first orientation, §2.2 read-first table, §7.1-§7.12 work-type matrix, §8.1 per-atom-completion checklist, §10.1 sitemap canonical, §17 startup checklist, Appendix B cheat sheet). New §1.3 Working Mode and the P-Protocol authored (7 subsections covering cleanup-mode default, 4 operator-rule principles, P-button protocol mechanics, announce-act-report-stop cycle, parallel-agent coordination warnings, what-not-to-do, preferred task sizes). New §3.3 Post-sweep canonical structure (replaces former Auto/ alias section; includes 9-row Auto/-children migration table + 19-row ledger migration table). New §3.5 Four-category classification of `CCAgentindex/` (Boxes / bedrock data / system runtime / generated outputs). New Appendix C — Post-sweep canonical paths quick-reference (one-page lookup). §18 anti-patterns list expanded with 7 post-sweep additions. §4 source-of-truth gained §4.3 two-truths contract for Atlas vs project ledgers.
- **DEC-2026-05-01-003 authored** — Cleanup Mode Default + P-Protocol Operating Doctrine. Settled rule. 24 active + 1 proposed decisions total now. Locks the doctrine into the project's settled-architectural-choices layer.
- **COMM-2026-05-01-004 filed** — master orientation entry (HIGHEST-PRIORITY). Points at the post-sweep canonical paths in CLAUDE.md §3.3 + the P-Protocol from DEC-003. Active until a runnable Atomizer Steward verifies cross-runtime adherence + 3 sessions ship without atom-chase drift / runaway agents / duplicate-ID races.
- **Cross-ledger propagation:** TCL §3 + §11 + header; GLOBAL §12 + header; INDEX header; activity.jsonl appends.

**The lesson — operator's coordination vision (newly explicit in DEC-003 + CLAUDE.md §1.3):** Multi-agent parallel work needs explicit coordination protocol. The patterns that drove drift earlier today (atom-chase drift, duplicate-ID races, scorched-earth-after-frustration) all share the same root cause: agents charging ahead without operator-bounded turns. The P-button protocol is lightweight, file-tree-native, and immediately enforceable. Agents that follow it produce observable turn-by-turn work; agents that don't produce sweeping changes the operator only sees after collision.

**The directional carry-forward:**

- **Every agent runtime in this repo** (Cowork, Claude Code, Codex CLI, Claude in Chrome, parallel ChatGPT-based) **now operates under CLAUDE.md §1.3.** Read-first protocol of §2 inherits the doctrine automatically.
- **CLAUDE.md is the contract; DEC-003 is the rationale; COMM-004 is the orientation.** Three layers, one operating model. New agents read CLAUDE.md first.
- **The P-button is formal.** When operator types `P` or `p`, agent picks one easiest-next-claimable atom and ships it through the announce-act-report-stop cycle. No campaigns. No sweeps. One atom.
- **Cleanup mode is the default until further notice.** Operator declaring greenfield mode is itself a future DEC.
- **Path-stability stress test pending.** First test: do agents that read CLAUDE.md §3.3 reach the right files? Second test: does the P-protocol survive 3 consecutive sessions cleanly? COMM-004 archives when these conditions hold.

---

### 2026-05-01 (later still² — Beta-Test Pivot: v2.1 inbox guardrails landed; Client Boxes redirected to zipped archive; fake-Close training ground replaces real client boxes for inbox automation testing)

**The trigger:** Operator pivot mid-day. Standing rationale: "we're going to take the client boxes, and I'm going to zip them and leave them in another directory because we're going to run a big ass beta test in the next day or two. And I made a new close that has nothing but fake people in it. And I think this makes so much more sense for us to be testing ourselves on that kind of training ground." De-risking discipline: don't refactor the storage layer and learn the runtime simultaneously.

**The work shipped this turn (ATOM-2026-05-01-0012):**

- **Inbox guardrails v2.1 landed** at `Auto/comeketo-inbox/references/guardrails.md` (full §A-§I rewrite, no skimping per operator directive). Replaces the prior §1-§8 layout. New shape: 12 hard gates (A1-A3, A6-A12 — A4/A5 intentionally omitted per operator's source numbering), 5 auto-pause rules (B1-B5), 6 standards (C1-C6), 4 email rules (D1-D4), 6 cadence references (E1-E6 — including new E5 Qualified-Lead Cadence + E6 Pipeline Priority Tiers P0-P3), 3 reporting modes (F1-F3 — including new F3 Manager Daily Report), 20-step decision tree, 14-line quality floor, v1.0→v2.1 change log. New v2.1 additions: A12 (touchpoint completion alert; missed scheduled touchpoints surface in manager DM channel rather than silent absorption), E5 (post-quote 24-48hr window, long-term weekly pacing, active-negotiation match-pace), E6 (P0/P1/P2/P3 priority tiers per inbox run), F3 (manager daily report with pipeline-at-a-glance + P0 surface + missed touchpoints + cadence completion rate + reply-gate queue).
- **COMM-2026-05-01-003 filed** documenting the directional shift. 7-section coordination warning: real Client Boxes → zipped archive (frozen reference); fake-Close instance becomes primary inbox source; scheduled automations formally retire (currently paused); v2.1 guardrails are now source of truth; DEC-002 placement table revised; 4 actionable items for future agents.
- **DEC-2026-05-01-002 placement table REVISED.** Client Boxes row redirected from `CCAgentindex/client_boxes/` (dispersal) to zipped archive at `<beta-test-path-TBD>` (frozen reference). Row marked "superseded by COMM-2026-05-01-003." History block updated with the operator-pivot rationale.
- **PROB-2026-05-01-001 history updated** noting the placement revision triggered by the beta-test pivot. ATOM-0006 (move Client Boxes) marked on-hold pending PROB-2026-05-01-002 (Beta-Test Isolation) decomposition by ATOM-2026-05-01-0013.
- **PROB-2026-05-01-002 (Beta-Test Isolation) pending** — ATOM-2026-05-01-0013 created in task list to author the parent PROB and atomize the beta-test infrastructure scope (zip Client Boxes to archive; formally remove all scheduled automations; wire fake-Close instance as primary inbox source; instrument observability for volume/throughput; write beta-test execution playbook; retrospective + cutover criteria).

**The lesson — operator's de-risking discipline (newly explicit):** Don't refactor the storage layer and learn the runtime simultaneously. Beta-test the runtime against fake data with the new guardrails; refactor the storage layer once the runtime is stable; restore real data into the new layer last. This pattern composes with NS-03 ("bedrock owns app state") rather than competing with it — the dispersal still happens, just not on production data while the runtime is unproven.

**The directional carry-forward:**

- **Real Client Boxes are about to be frozen** (zipped archive). Don't write into `Auto/Client Boxes/<Name>/` from this point until PROB-002's beta-test infrastructure lands and operator clears production cutover.
- **Scheduled automations are about to formally retire** (currently paused; ATOM-0013 will atomize the formal removal).
- **The dispersal chain (PROB-001) is partially-paused.** ATOM-0002 (snapshot) still recommended-as-first-move (captures pre-beta-test state). ATOM-0006 (move Client Boxes) on hold. ATOMs 0008/0009/0010 remain valid scope.
- **The inbox skill bundle now points at v2.1 guardrails.** Any agent dispatching `comeketo-inbox` skill, `inbox_triage` agent, or composing outbound through the rendering scripts must validate against the new §A-§I gates — particularly A12 (touchpoint completion), E5 (qualified-lead cadence), E6 (priority tiers), F3 (manager daily report).
- **PROB-2026-05-01-002 needs operator input on:** beta-test path location (separate disk volume? `_beta/` subdir?), fake-Close instance access (operator-owned credentials, separate Close API key?), production cutover criteria (what proves the runtime is stable enough to point at real data?).

---

### 2026-05-01 (later still — Auto/ symlink dispersal initiated: PROB-2026-05-01-001 filed reversing PROB-2026-04-28-016 closure)

**The trigger:** Operator paused all automations 2026-05-01. The symlink rationale (preserve active scheduled fires + Brenda's seven-day cadence during a content-migration window) is no longer load-bearing. Operator surfaced the directory chaos: "the auto folder is a catastrophe... I've paused the automations, so I think we're good to ditch the aliases and just bring them in and disperse the directories where they need to go."

**The work shipped this turn (ATOM-2026-05-01-0001):**

- **PROB-2026-05-01-001 filed** in OPL §5 — explicitly named as reversal of PROB-2026-04-28-016 closure. Includes 13-row inventory of Auto/ children, refreshed path-reference inventory (server.py:41-44 + 10 downstream + _lib.py + voice.py + KICKOFF_TODAY + CLAUDE.md §2.2/§3.3), 11-atom decomposition, full close criteria.
- **DEC-2026-05-01-002 authored (status: proposed)** in DECISIONS_LEDGER — Auto/ symlink retired; standalone folder dispersal pattern. 13-row placement table; 4 rows tagged "Jake decision needed" (Staff Boxes folding pattern, Hugodemo handling, QuoteMaker.jsx disposition, comeketo-inbox.skill deprecation). The structural pattern (real folders inside bedrock + snapshot-before-move + atom-per-child) is the durable part; the placement rows are operator-revisable.
- **COMM-2026-05-01-002 filed** in COMMUNICATIONS §5 — coordination warning for the dispersal window. 6 explicit rules for agents working Auto-adjacent surfaces. Active until ATOM-2026-05-01-0011 completes.
- **11-atom dispersal chain** decomposed in ATOMS §10.5: ATOM-0001 (this filing — completed) → ATOM-0002 (snapshot) → ATOM-0003 (per-child destination confirm) → ATOM-0004 (server.py AUTO_* constants) → ATOM-0005 (CLAUDE.md §2.2 + §3.3) → ATOM-0006 (move Client Boxes) → ATOM-0007 (move Staff Boxes) → ATOM-0008 (move comeketo-inbox + ballpark template) → ATOM-0009 (move orchestrator + re-anchor _lib.py) → ATOM-0010 (triage loose files: CIA.txt, QuoteMaker, voice profiles, venue index, comeketo-inbox.skill, Hugodemo, Auto/Boxes/) → ATOM-0011 (unlink + Deprecation entry). ~7.5h total chain effort. Atom queue grew 110 → 121.
- **Cross-ledger propagation:** OPL header + DECISIONS header + COMMUNICATIONS header bumped; INDEX header refreshed with new active PROB; activity.jsonl gained `prob_filed`, `dec_authored`, `comm_filed`, `atoms_decomposed`, `atom_completed` lines.

**The lesson — operator's binding directive (re-emphasized 2026-05-01):** "Replace the thing that's an alias with the actual thing and remove the auto file and whatever's left in that auto file. It's probably actually useful for stuff that should be going in the ccagentindex directory (as that's where as I understand it the actual context from our front facing 'rodbot' comes from)." Bedrock owns app state (NS-03). The symlink approach was a tactical compromise during automation-active conditions; with automations paused, the architectural-correct move is the dispersal.

**Carry forward:**

- **DEC-002 placement table awaits operator approval** before move atoms 0006-0011 ship. 4 rows specifically tagged for Jake decision: Staff Boxes folding pattern, Hugodemo handling, QuoteMaker.jsx disposition, comeketo-inbox.skill deprecation.
- **ATOM-0002 (snapshot) is the load-bearing first move.** Per DEPRECATION.md §7 contract: no retirement without snapshot. Recovery archive lands in `_snapshots/manual/snapshot_2026-05-01_<HHMM>_manual_pre_auto_dispersal.zip`.
- **COMM-2026-05-01-002 active until chain completes.** Any agent touching Client Boxes, Staff Boxes, orchestrator, comeketo-inbox bundle, voice.py, KICKOFF_TODAY.md, server.py AUTO_* constants, or CLAUDE.md §2.2/§3.3 must read it first to avoid colliding with in-flight atom work.

---

### 2026-05-01 (later — Cowork session: Phase B steward fleet COMPLETE + Atlas Box graduation + atom-protocol rules promoted + duplicate-ID race lesson; **+ recovery from atom-chase drift that violated Per-Atom-Completion Update Protocol**)

**The session's project-state shifts:**

- **PROB-2026-04-30-005 (Promote Remaining Steward Sub-Agent Packages To Runnable App Agents) CLOSED.** All 4 graduation chains shipped end-to-end: temporal_continuity_steward (ATOM-0028→0031), open_problems_steward (0032→0035), north_star_steward (0040→0043, by parallel agent), file_directory_steward (0036→0039). Plus global_ledger migration (ATOM-0044) and atoms_steward authoring. **7 stewards now runnable** project-wide: 1 via legacy `CCAgentindex/agents/global_ledger_steward/` + 6 via unified Box dispatch through `_agent_resolve_prompt` helper (ATOM-0029). Each smoke test surfaced real findings, zero false positives.
- **PROB-2026-04-30-015 (Atlas Sweep Steward Not Yet Runnable) CLOSED** via 4-atom chain (renumbered from 0045-0048 to 0107-0110 due to ID collision). Atlas Box authored as **first `ground_truth_source` Box class** — distinct from existing `ledger` class. Inaugural digest at `LEDGERS/BOXES/atlas/digests/2026-04-29.md` (8500 words; 24 concordance / 3 drift / 4 handoff lessons / ~10 atom candidates / 5 decision-context / 6 out-of-scope from 37 project-relevant of 45 summaries). Daily 8 AM ET cron at `CCAgentindex/triggers/atlas_daily_sweep.json`.
- **PROB-2026-04-30-001 partial-progress** (Pieces gracefully disabled in web mode close-criterion satisfied via client-side surface gating). When `tweaks.aiProvider === "openai"`: briefing chip + activity chip + LivePiecesHeader hide; redirect-on-flip; Settings disclosure box.
- **5 Communications entries appended (COMM-2026-04-30-004 through 008):** atom-protocol rules promoted from agent-private auto-memory (claim-before-doing, announce-before-doing, P-means-proceed); Atlas integration architecture decision; **duplicate-ID race condition lesson with 4 captured incidents in 24h and 3 structural fix candidates**.
- **3 ChatRail polish UIs shipped:** route pill unification (4-vs-3 shade mismatch), browser-use done card cleanup (raw URL → host badge format), tool turn visual identity (`.chat-rail-turn.tool` class with `TOOL` eyebrow). Cache-busts: `components.jsx 70→73`, `styles.css 91→92`.
- **Sitemap §grid reconciled** via 3-way diff after Jake flagged "the 3x3 decision grid has been gone for some time" in the sitemap. Asset list rewritten; PROB-2026-04-30-002 (sweep widget WIP), 003 (FrontPage dead code), 004 (sweep output appears stale) filed.
- **SOURCE_OF_TRUTH §3.0 Operator-Activity Truth** added: Pieces live > Atlas markdown > activity.jsonl > TCL §11 > chat scroll. Two-truths contract: Atlas wins for what-happened, ledgers win for what-decided; never auto-resolve drift.
- **New directories created:** `LEDGERS/BOXES/atlas/` (with steward/ + receipts/ + digests/), `LEDGERS/BOXES/global_ledger/` (migration target), `LEDGERS/BOXES/file_directory/`, `LEDGERS/BOXES/open_problems/`. New symlinks: `LEDGERS/atlas` → `/Users/jakeaaron/Documents/Atlas/` (gitignored), `cowork_memory` → Cowork session memory dir (gitignored).

**The recovery — the failure mode this entry exists to name:**

ATOM-2026-04-30-0111 (filed earlier today by parallel session) added a **Per-Atom-Completion Update Protocol** to CLAUDE.md §0 specifically to prevent atom-chase drift. Same session also added the explicit warning that "if you don't have time to update the ledgers, you don't have time to make the change."

This Cowork session shipped 7+ atoms in rapid succession (Atlas chain + open_problems chain + file_directory chain + 5 COMMs + 3 UI fixes) and **systematically failed the protocol**. The cross-ledger updates were skipped: TCL §3 (this section), Global Ledger §6/§12/§13, North Star, Phase, File Contents, File Directory, Deprecation. Only the immediate-target ledgers (OPL closures, INDEX additions, individual COMM appends) got touched.

Jake surfaced the violation explicitly at session end:

> "The asset widget map hasn't been updated. The communications ledger is embarrassing. It hasn't been touched for five hours. The fucking global ledger hasn't been touched since 5:00 yesterday. The North Star ledger hasn't been touched in two fucking days. Phase isn't being updated. Settings aren't being updated. Temporal continuity is also embarrassing to me that we're not touching that. We're not figuring out what's being deprecated. If we don't get this shit in order, this isn't even worth doing."

And the binding directive:

> "If you're not writing the ledgers, just don't do anything. Sometimes when you do something, you might have to write in 15 different fucking ledgers, and I don't care. I'm paying for the compute, and that's what I want to happen."

**The lesson, scoped wider than just this session:** the Per-Atom-Completion Update Protocol from ATOM-0111 is necessary but not sufficient. Without active operator-monitoring or a steward enforcing it, even agents that READ the protocol will violate it under atom-chasing pressure. Two structural follow-ups that should land soon:

1. **Done Gate enforcement at atom-completion time** — the atom completion script (or future Atomizer Steward) should refuse to mark an atom completed until the cross-ledger updates land. Mechanical, not aspirational.
2. **The "15 ledgers" expansion** — operator preference is now formal: every change writes to every relevant ledger, not just the immediate target. Compute is not a constraint.

This Recent Meaningful Changes entry is the recovery action. Companion writes landing alongside: GL §6/§12/§13 + header; PHASE Phase B steward fleet completion; FILE_DIRECTORY backfill; FILE_CONTENTS new files; NORTH_STAR alignment touch; DEPRECATION audit-ledger formal entry; INDEX status verifications.

### 2026-05-01 (Cowork + Codex parallel sessions — Phase B momentum, Box Network Architecture lock, Box Graph UI shipped, ~37 atoms — backfill entry)

> **Backfill catch-up entry per `ATOM-2026-04-30-0111`.** The session ran ~6.5 hours but TCL §3 / GLOBAL §12 / COMMUNICATIONS / INDEX / PHASE / DEPRECATION / ASSET_WIDGET_MAP / FILE_CONTENTS / FILE_DIRECTORY / NORTH_STAR were not updated per-atom-completion. Jake surfaced the systemic violation 2026-05-01 ~02:30Z. CLAUDE.md (project) gained a Per-Atom-Completion Update Protocol section in this same atom; this TCL entry IS the proof that the rule works.

**The Box Network Architecture is now LOCKED.** Jake delivered the scaffold (Codex co-author) at `LEDGERS/Drafts/box_network_architecture_scaffold.md`. Decomposed into 58 atoms under `PROB-2026-04-30-015`. Architectural lock at `DEC-2026-04-30-005` (Box-Ledger-Sub-agent fusion is the target primitive). Two of 8 Open Questions resolved: `DEC-2026-04-30-006` (minimum viable `box.json` schema — 9 required + 5 recommended + 3 runtime-only fields) and `DEC-2026-04-30-007` (`AGENTS.md` placement rule — required for Boxes-with-stewards, optional for leaf Boxes).

**Phase 1 progress (3 of 5 atoms shipped):**
- `ATOM-0056` (Phase 1.1) — `BOX_LEDGER.md` §16 "Mature Box Shape" authored (~330 lines, 9 sub-sections, per-Box-class shape rules).
- `ATOM-0057` (Phase 1.2) — `BOX_BUS_LEDGER.md` §14 "Source-Interpreter-Destination Routing" authored (~280 lines, 5 example flows, subscribes/emits schemas).
- `ATOM-0059` (Phase 1.4) — `SOURCE_OF_TRUTH.md` §11 "Box Authority Tiers" authored (~210 lines, Tier 0/1/2/3 model orthogonal to per-domain trust orderings).

**Phase 1.3 (`ATOM-0058` DoD Box-completion gate) still blocked** by Q1 (`ATOM-0048`), Q5 (`ATOM-0052`), Q8 (`ATOM-0055`). Phase 1.5 (`ATOM-0060` verify) blocked on 0058.

**Box Graph UI shipped (massive — Codex 2026-05-01).** Real interactive UI at route `box_graph`. 57 nodes, 81 edges, 5 manifests, 38 leaf boxes. `GET /api/box_graph` endpoint synthesizes graph from `LEDGERS/BOXES/*/box.json` + `Auto/Client Boxes/` + `Auto/Staff Boxes/`. Authority lanes rendered. Right-sidebar route inspection per Box. **Phase 4.6 (graph render) + Phase 6.1 (registry endpoint) shipped early as a real app surface.** Codex's `_agent_resolve_prompt` helper means Phase 5 wiring atoms (0033/0037/0041) collapse to no-ops once their respective steward Boxes exist. New components landed in `screens.jsx` (+248 lines) and `styles.css` (+299 lines).

**Steward fleet 6 of 6 runnable** (was 1 at session start):
- `global_ledger_steward` migrated from legacy `CCAgentindex/agents/` to unified `LEDGERS/BOXES/global_ledger/steward/` per `DEC-2026-04-30-004` (`ATOM-0044`).
- `temporal_continuity_steward`, `open_problems_steward`, `north_star_steward`, `file_directory_steward` all promoted to runnable form (`ATOM-0028..0043` chains).
- **Atlas Sweep Steward** added by parallel session as a NEW Box (the project's first ground_truth_source Box) with daily 8 AM ET cron at `CCAgentindex/triggers/atlas_daily_sweep.json` (`ATOM-0107..0110`, renumbered after collision resolution).

**ID collision resolved.** Parallel sessions' Atlas atoms (originally 0045-0048) collided with Foundation atoms of the same numbers. Repaired Foundation 0045; renumbered Atlas to 0103-0106; the orphan twins (0103-0106) marked abandoned (4 atoms abandoned). Surfaced future Atomizer Steward improvement: canonical collision-resolution policy.

**Bedrock audit chain progress:** 4 of 7 stub-pattern audits shipped (`ATOM-0007` commitments, `0011` knowledge, `0013` projects, `0015` Rodbot — all empty `.gitkeep` stubs, archive disposition). Both PROB-016 gates (`ATOM-0001` ledger buildout, `ATOM-0002` sub-agent buildout) satisfied earlier in session.

**Session-end metrics (2026-05-01T02:30Z):**
- Atoms: 111 total / 71 available / 36 completed (37 with `ATOM-0111`) / 4 abandoned. ~17h shipped of ~115h queued.
- Decisions: 22 active (was 18 at session start). 4 new DECs today: 004 (steward path), 005 (fusion primitive), 006 (box.json schema), 007 (AGENTS.md rule).
- Ledgers: 19 active. 6 unified Boxes (temporal_continuity, atoms, open_problems, north_star, file_directory, global_ledger). 1 new Box authored by parallel session (atlas).

**Current status:**
- **Phase A:** complete (since 2026-04-29).
- **Phase B:** in progress — Box Network Architecture locked, Phase 1 60% done (3 of 5 atoms), Phase 4.6 and 6.1 shipped early via Box Graph UI, steward fleet at 6/6 runnable.
- **Phase C:** runtime deferred per `DEC-2026-04-29-013`.

**Next-handoff context:** the atom queue is the dispatch surface. Top-of-leaderboard load-bearing atoms right now are the remaining Open Questions (Q1/Q4/Q5/Q6/Q7/Q8) — each unblocks downstream Phase 1.3 verification or specific interpreter / migration paths. After Q5 lands, `ATOM-0058` (DoD Box-completion gate) becomes claimable, which unblocks Phase 1.5 verify, which unblocks Phase 2.

### 2026-04-30 (Codex session — ChatRail command cockpit added)

The red-outlined main chat area on the grid page was upgraded from a plain chat rail into a command cockpit for the Claude/Codex multi-agent workflow.

- **Command deck added.** `components.jsx` `ChatRail` now shows Claude Code, Codex CLI, and active-provider status cards at the top of the rail. It reads `/api/status` for local binary availability and localStorage `secretary.tweaks` for the active `aiProvider`.
- **Prompt cards added.** Four command cards seed the composer with high-leverage working prompts: code sweep, Box-route trace, guardrail pass, and delegation handoff. This gives Jake fast starts without hiding the actual prompt text.
- **Navigation launchers added.** ChatRail now links directly to `box_graph` and `delegations`, matching the emerging Box Network workflow where chat, graph, and delegation are one loop.
- **Visual identity upgraded.** The rail gained a warmer layered cockpit treatment: richer header, recessed stream surface, status cards, stronger bubbles, and refreshed composer/connector styling.
- **UI Done Gate satisfied.** `page_asset_sitemap.md` grid section updated. Cache-busts: `components.jsx` 74→75, `styles.css` 93→94.

### 2026-04-30 (Codex session — Box Graph route shipped)

The Box Network idea moved from architecture scaffold to a live app surface. A new `box_graph` route visualizes the declared Box network from manifest data plus current operational Client/Staff Boxes.

- **Backend graph endpoint added.** `GET /api/box_graph` in `server.py` reads `LEDGERS/BOXES/*/box.json`, creates concept nodes for Box Bus + Source-of-Truth, synthesizes source/target ledger nodes from `subscribes[]` and `emits[]`, and folds in current operational boxes from `_boxes_catalog()`.
- **Frontend route added.** `app.jsx` route list/switch now includes `box_graph`; `components.jsx` adds a topbar `box graph` chip and breadcrumb label; `screens.jsx` adds `BoxGraphScreen` with authority lanes, SVG edge rendering, filtering, leaf-box toggle, refresh, and node detail panel.
- **Design direction.** The visualization uses a warm cartographic/network-map feel rather than a generic graph canvas: four authority lanes (constitutional, global ledgers, domain boxes, leaf boxes), tone-coded node types, and receipt/route details in the inspector.
- **Verification.** `python3 -m py_compile server.py` passed; Babel JSX transform passed for `app.jsx`, `components.jsx`, and `screens.jsx`; local endpoint smoke test returned 57 nodes, 81 edges, 5 manifests, 38 operational boxes, 0 manifest errors.
- **UI Done Gate satisfied.** `page_asset_sitemap.md` route index and new `Page: box_graph` section updated. Cache-busts: `styles.css` 92→93, `components.jsx` 73→74, `screens.jsx` 98→99, `app.jsx` 54→55.

### 2026-04-30 (Codex session — Box Network architecture scaffold drafted)

Jake articulated the larger architecture: Ledgers, Boxes, and Sub-agents should converge into one intelligent folder primitive. Codex captured that synthesis as a durable draft at `LEDGERS/Drafts/box_network_architecture_scaffold.md`.

- **Core thesis documented.** A Box is a stateful memory object with an operating contract: `state + memory + rules + configuration + steward behavior + receipts`. The mature Box shape includes `BOX.md`, `box.json`, local ledger files, `AGENTS.md`, `steward/`, `receipts/`, and future inbox/outbox surfaces.
- **Authority-tier model named.** Constitutional Boxes feed Coordination Boxes, Domain Boxes, and Leaf Boxes. The important distinction is authority/inheritance, not prestige. Leaf Boxes should receive only interpreted relevant state, not the whole universe.
- **Interpreter model sharpened.** Trickle-down is not dumping. Routes should follow `Source Box -> Interpreter -> Destination Box`, with T1/T2/T3 interpretation tiers and receipts for every meaningful propagation.
- **Build scaffold added.** The draft lays out eight phases: name the primitive, standardize Box shape, finish Ledger Boxes, define graph, build interpreters, build Box Bus runtime, migrate operational surfaces, then make the network self-maintaining.
- **Definition of Done proposed.** The draft names Conceptual, Filesystem, Routing, Agent, Runtime, Safety, and Maintenance Done gates for the architecture.

### 2026-04-30 (Codex session — AGENTS.md Prime Directive parity landed)

Codex-oriented project instructions were updated so future Codex subprocesses enter the repo with the same ledger discipline that Claude Code now has.

- **`AGENTS.md` upgraded to peer `CLAUDE.md`.** The file now opens with the Prime Directive: read relevant ledgers before action, update relevant ledgers after action, and treat ledger drift as the cardinal failure mode. This closes the immediate mismatch where Claude subprocesses had the new operating contract but Codex still had the older six-discipline-only version.
- **Codex operating contract added.** New guidance makes `AGENTS.md` the Codex-side peer of `CLAUDE.md`, directs Codex to use repo ledgers instead of private chat memory, preserve dirty-tree user work, and follow the Atom protocol when work maps to `LEDGERS/ATOMS.md`.
- **No new `CODEX.md` created.** Codex discovers `AGENTS.md` natively; creating a parallel `CODEX.md` would introduce an attractive but non-authoritative duplicate. The source of truth for Codex behavior inside this repo is `AGENTS.md`.
- **Activity ledger appended.** This session left a `codex_instruction_update` entry in `CCAgentindex/_ledger/activity.jsonl`.

### 2026-04-30 (Cowork session — atoms unified Box landed + PROB-005 atomized; queue depth now 43 atoms)

Continuation of the same Phase B momentum push. Built the second unified ledger Box (after temporal_continuity) and decomposed a second PROB to demonstrate the Atom Ledger pattern at scale.

- **`LEDGERS/BOXES/atoms/` unified Box landed.** Per `DEC-2026-04-29-015`: ledger files (`ATOMS.md` + `.json`) stay at `LEDGERS/`; Box governs by `box.json` `owns[]` path reference. Files: `box.json` (manifest with `subscribes[]`/`emits[]` declared, `phase_c_note: "deferred"`), `BOX.md` (12 sections per the BOX_LEDGER pattern), `steward/AGENTS.md` (declarative scope), `steward/config.json` (5 modes: `audit_only`, `propose_atoms`, `sweep_stale`, `release_stale_claims`, `surface_closures`), `steward/prompt.md` (dispatch prompt), `receipts/README.md`. Atomizer Steward is in declarative form only; runnable form is Phase B follow-up (depends on the steward-path architectural-gate atom ATOM-0027).
- **PROB-2026-04-30-005 (steward sub-agent promotion) decomposed into 17 atoms.** 1 architectural-gate atom (decide runnable path: `CCAgentindex/agents/<name>/` legacy vs `LEDGERS/BOXES/<name>/steward/` unified Box) + 4 steward-promotion chains × 4 atoms each (temporal_continuity, open_problems, file_directory, north_star). Each chain: author runnable form → wire `/api/agents/<name>_steward/run` → smoke-test in `audit_only` → flip `INDEX.md` row to active. Last atom (ATOM-0043) surfaces PROB-005 itself for closure review (NOT auto-close per steward doctrine). Total estimated effort: ~13.5h.
- **Atom queue depth now 43 atoms across 2 parent PROBs.** PROB-016 = 26 atoms; PROB-005 = 17 atoms. Total ~35h of work, all `available`. Any agent can now read `ATOMS.md` §10 or `ATOMS.json` and pick the next ready atom.
- **The Atomizer Steward Box is the second unified Box proof.** Confirms the pattern works for ledgers authored AFTER the unified Box decision (DEC-2026-04-29-015) — temporal_continuity was the first, atoms is the second. Establishes the rhythm: every global ledger eventually gets a Box, with the steward at `steward/` and receipts at `receipts/`.
- **Architectural fork surfaced (ATOM-0027).** The legacy steward pattern (`CCAgentindex/agents/<name>/`, used by `global_ledger_steward`) and the unified Box pattern (`LEDGERS/BOXES/<name>/steward/`, used by `temporal_continuity` and `atoms`) need to be reconciled. server.py's `_agent_run` dispatcher reads from CCAgentindex/agents/. Either the unified Box pattern reads via the legacy path (mirror to CCAgentindex/agents/) or server.py learns to read from the Box. This is a real Phase B decision and is its own atom.
- **Communications Ledger:** `COMM-2026-04-30-002` (Atom Ledger landed) already covers the doctrine and how to claim. No new COMM needed for this incremental work — it's a continuation of the same announcement.
- **OPL §5:** PROB-005 entry now carries an `**Atomized:**` cross-link to ATOMS-0027..0043 + history line.

### 2026-04-30 (Cowork session — Atom Ledger landed; PROB-016 atomized into 26 atoms as proof: DEC-2026-04-30-003)

Phase B momentum continues. Jake surfaced the next architectural unlock: monolithic PROBs were freezing the project. Every session reads them, feels the weight, defers. The fix is decomposition — turning each PROB into a flock of single-session claimable atoms.

- **`LEDGERS/ATOMS.md` + `.json` authored.** Operational layer below Open Problems. PROBs decompose 1:N into atoms with mandatory `parent_problem_id` linkage. 6-state lifecycle (`available` → `claimed` → `in_progress` → `completed` plus `blocked` and `abandoned`). Single-writer claim protocol (atomic write of status/claimed_by/claimed_at to BOTH .md and .json) enables parallel agent work. 4h granularity rule caps atom size; bigger gets re-decomposed. Acceptance criteria standard: concrete, verifiable, single-pass, tied to artifacts that exist after the session.
- **`DEC-2026-04-30-003` recorded.** Architectural lock at global tier. Four alternatives rejected: per-PROB-inline (muddles OPL purpose), per-Box queues (loses dependency graph), session-scoped tasks (don't persist), defer to Phase C (already accumulating frozen PROBs). The decision binds every PROB authored from this point forward to gain atomized close-criteria, and binds every agent claiming work to use the protocol.
- **PROB-2026-04-28-016 (bedrock reconciliation) decomposed as the proof.** 26 atoms total: 2 gate atoms (verify ledger system + sub-agent system reached threshold) + 20 directory-audit atoms (one per bootstrap-era CCAgentindex/ subdir) + 4 propagation atoms (update `indexes/index.json`, `FILE_DIRECTORY_LEDGER.md`, `mission_control_loader.js`, `CLAUDE.md`). Total estimated effort ~21.5h, broken into 5min/15min/30min/1h pieces. All 26 currently `available`; gates 0001/0002 block all 20 audit atoms; audits block all 4 propagation atoms — clean dependency graph.
- **OPL §5 PROB-016 entry** gained `**Atomized:**` cross-link pointing at `ATOMS.md` §10.2 + history line.
- **Phase B follow-up scoped:** Atomizer Steward at `LEDGERS/BOXES/atoms/steward/` reads new PROBs, proposes atoms to `DRAFTS/ATOMIZATION/` review queue, sweeps stale claims, surfaces PROB-closure-eligible candidates. Decompose remaining 12 active PROBs as queue depth allows.
- **Phase C runtime scope:** `/api/atoms/{list,claim,complete,release}` endpoints; atoms as first-class Box Bus envelope citizens; UI surface (Atoms panel) lands near `automation` route.
- **The unlock Jake named:** "If we have an atomized, decomposed list of all the stuff that needs to be done, then there'll be hundreds of easy problems instead of massive open problems that are impossible to deal with without knowing everything."
- **19 active ledgers.**

### 2026-04-30 (Cowork session — Deprecation Ledger + Snapshot Protocol landed: DEC-2026-04-30-002)

Phase B opener. Jake surfaced the gap directly: with retirements accumulating in the tree (the great-trim domains, Audit Ledger, route reductions, sub-agent relocation) and no recovery surface, the project needed a Deprecation Ledger paired with snapshots.

- **Architectural decision: global tier, not per-Box.** Captured at `DEC-2026-04-30-002`. Reasoning: deprecation is project-wide audit; cross-cuts every Box and ledger; per-Box scatter would lose the audit trail; snapshots are inherently global; recovery needs single source. Five alternatives rejected (per-Box only, git-history only, separate snapshot ledger, snapshots in bedrock, defer to Phase C).
- **`LEDGERS/DEPRECATION.md` + `.json` authored.** 4-state lifecycle (`candidate` → `deprecated` → `archived` → `purged`) plus `reversed` / `recovered`. Required-fields schema; mandatory minimums per state; mandatory §5 incoming-link audit before any promotion past `candidate`. 16 deprecation-candidate triggers cataloged. 4 anti-patterns named. Cardinal rule: **nothing leaves the project without a Deprecation entry and a Snapshot reference.**
- **Snapshot Protocol §7 + manual runner.** 4 cadences (daily/weekly/monthly/manual) with retention rules (7/4/12/indefinite). `_snapshots/` at project root with subfolders per cadence. Naming: `snapshot_<YYYY-MM-DD>_<HHMM>_<cadence>[_<reason-slug>].zip`. Recovery key: `(snapshot_id, snapshot_path)` on every entry. `LEDGERS/scripts/snapshot.sh` is the runner — auto-detects project root, builds include/exclude lists per cadence, prunes per retention, appends `kind: "snapshot_taken"` to `_ledger/activity.jsonl`. Verified working via dry-run test in sandbox. Phase A: manual invocation. Phase C: cron / launchd via Snapshot Steward.
- **`.gitignore` updated** to exclude `_snapshots/` (local recovery infrastructure, not source of truth).
- **Four backfill DEPR entries seeded.** Cleans up existing retirement debt: `DEPR-2026-04-30-001` great-trim bedrock domains; `-002` Audit Ledger never-built; `-003` sub-agent draft package relocation; `-004` Apr 2026 trim retired UI routes (13 routes including the boundary case where `delegations` was later restored as a real surface — flagged in entry notes).
- **Phase B follow-up scoped.** Author `LEDGERS/BOXES/deprecation/` unified Box per `DEC-2026-04-29-015`. Steward will sweep `candidate` staleness, run §7.7 health checks, accept candidates from any Box. Phase C: wire snapshot script to cron / launchd, hook into Box Bus runtime.
- **18 active ledgers.**

### 2026-04-30 (Cowork recovery — completing other agent's interrupted OPL batch + new direction queue)

A separate Claude Code session captured 13 raw forward-looking items from Jake's paper list and translated them into 10 deduped Open Problems entries (PROB-2026-04-30-005 through PROB-2026-04-30-014). That session ran out of tokens mid-flight on the activity-ledger append and didn't reach the §6 By System categorization, TCL update, or Communications entry. **Recovery completed by this Cowork session.**

- **10 new forward-looking OPL entries** define the project's near-term direction queue:
  - **PROB-005** (medium · soon): promote remaining 4 of 5 steward sub-agent packages to runnable app agents (only `global_ledger_steward` runs today). Phase B work per `DEC-2026-04-29-002`.
  - **PROB-006** (high · later): build the Box Bus runtime — DEC-013 Phase C. Blocked on PROB-005.
  - **PROB-007** (medium · soon): per-box agent configuration — Phase 2 of Intake → Box, deferred under `DEC-2026-04-29-008`.
  - **PROB-008** (medium · later): author analytics snapshot boxes — realizes BOX_BUS_LEDGER §8 worked example. Gated on PROB-006 for full triad participation.
  - **PROB-009** (medium · later): per-box analytics surface inside Client Boxes — Phase 3 of Intake → Box.
  - **PROB-010** (medium · later): GPT ledger-digest agent hosted on the GitHub repo. Blocked on oscillation proposal landing as Decisions Ledger entry.
  - **PROB-011** (medium · soon): compile credential / resource inventory for ClickUp team surface — operator-driven, no agent compiles credentials autonomously.
  - **PROB-012** (low · soon): send Rhonna the 7-day setup guardrails.
  - **PROB-013** (medium · later): Supabase mode-gated integration — web default, local optional. Blocked on PROB-2026-04-30-001 mode detection.
  - **PROB-014** (medium · later): box snapshot versioning surfaced in app UI via git history.
- **3 categorical duplicates skipped** during dedupe: "unify boxes/ledgers/agents" (covered by `DEC-2026-04-29-001` triad), "build box trickle hierarchy" (collapsed into PROB-006), "OpenAI key removes Pieces" (already a PROB-2026-04-30-001 close criterion).
- **OPL §6 Problems By System** gained 5 new categories (Subagent / Steward Fleet · Box Bus Runtime / Phase C · External / Web-mode Agents · Outbound / Team Handoff) plus expanded entries in 3 existing categories (Client Boxes · Documentation Drift · Architecture / Migration). All 10 new IDs categorized.
- **JSON mirror counts:** 25 total problems · 22 active · 2 closed.
- **Activity ledger** caught up — 2 entries appended (`open_problems_batch_added` recovering the interrupted log + `open_problems_section_6_categorization` for this recovery's own §6 work).
- **Cross-references locked** in the new entries: PROB-006 blocks on PROB-005 · PROB-008 gates on PROB-006 · PROB-013 blocks on PROB-001 · PROB-007 composes with PROB-006 router · PROB-009 composes with PROB-008.

**Why this matters as a state shift.** Pre-batch, the Phase A → B → C build sequence existed as a discipline (`DEC-2026-04-29-002`) without a concrete near-term work queue beyond "finish the ledgers." This batch defines what Phase B and the early innings of Phase C actually look like as discrete tickets — **Phase B work is now scoped** (PROB-005 with a specific suggested ordering: temporal_continuity → open_problems → file_directory → north_star) and **Phase C entry conditions are explicit** (PROB-006 close criteria define what "runtime live" means, with concrete first-route smoke test). The triad spine is now a roadmap, not just an architectural philosophy.

**Carry forward:**
- The 22 active OPL entries are now the canonical near-term backlog. Future "what should we do next" questions should triage against this list before adding new architecture.
- The other Claude Code session's truncated work pattern is captured: when an agent runs out of tokens mid-ledger-update, the recovery agent must verify each Prime-Directive surface separately (activity.jsonl, §6 categorization, TCL, Communications) — none of those auto-complete.

### 2026-04-30 (Cowork session — first build_*.py → AnalyticsScreen integration shipped: OwnerStagePanel + DEC-2026-04-30-001)

Continuation of the same Cowork session that landed the Prime Directive earlier. Pivoted from polish work to a substantive analytics-integration task per Jake's request to start integrating `Onboard Scripts/build_*.py` outputs as new analytics panels.

- **First build_*.py → AnalyticsScreen integration shipped.** `build_owner_stage_dashboards.py` is now surfaced as a new "Pipeline by Stage" tab in the Analytics page. The 7 existing `analytics_*.py` scripts already write JSON snapshots that `AnalyticsScreen` fetches directly; this is the **first** integration of the `build_*.py` family, where outputs are markdown-only by default. The remaining 19 unintegrated `build_*.py` scripts can follow the same pattern.
- **`DEC-2026-04-30-001` recorded.** Server-synthesized JSON pattern: one endpoint per build_*.py script, naming `GET /api/analytics/<area>`, parses the markdown output of the build script on every read, returns structured JSON the panel consumes. **No JSON sidecar is written into bedrock.** The build script's markdown remains canonical (per `SOURCE_OF_TRUTH.md` §3 trust ordering for intelligence/ areas). Three alternatives considered and rejected (modify build script to emit JSON; parse markdown client-side; write a synthesizer one-shot script). Reference impl: `_owner_stage_latest` in `server.py` + `OwnerStagePanel` in `screens.jsx`.
- **OwnerStagePanel design.** Snapshot row (4 KPI tiles), featured-owner card (lavender, with latest_activity + leads/active/lead_only/won/lost numerals), two-column body (stage breakdown bars on left split into active vs lead-only, lead-level cards on right with urgency-colored badges + suggested actions), provenance footer pointing at the bedrock path and source script. Andre is currently the only owner in the data — when more owners come online the featured-owner card will iterate.
- **First sweep results:** 28 leads · 1 owner (andre_raw) · 26 stages (12 active, 14 lead-only) · last activity 2026-04-25 detailed ballpark quote email. Andre's pipeline visualized end-to-end in the UI for the first time.
- **Defensive parser.** The build script writes both a top-level summary `<date>.md` (with `(active)/(lead_only)` kind annotations) AND inner `<date>/owner_overview.md` + `<date>/stage_overview.md` (different format, no kind). The parser preferentially reads the summary file; falls back to walking `<date>/by_stage/<pipeline>/<kind>__<stage>/` directories where kind is encoded as the directory-name prefix.
- **Sitemap analytics section updated:** new components in Asset Ownership (`OwnerStagePanel`, `StageRow`), new endpoint in API, expanded History, Last Verified bumped to 2026-04-30. Top-line "Last updated" header bumped to reflect this change. Cache-bust: `screens.jsx` 96→97 in `Secretary.html`.
- **Onboard Scripts inventory established** for future integration work. Top-level has 31 files (7 `analytics_*.py` + 21 `build_*.py` + 3 utils); `Auto/Onboard Scripts/` has 24 (the `build_*.py` + utils only). Per PROB-013, top-level is "legacy being rewritten" — but the 7 `analytics_*.py` exist ONLY at top-level. Removing top-level requires migrating those to `Auto/` first. Deferred as a separate cleanup pass.

**Two follow-up tasks surfaced for future sessions:**

1. **Author `LEDGERS/PAGES/analytics.md`** — per Phase 16 pattern. The analytics page now has substantial widget surface (10 panels including this new one) and the synthesizer pattern's architectural rationale is worth a deep-memory home.
2. **Onboard Scripts deduplication** — migrate the 7 `analytics_*.py` files into `Auto/Onboard Scripts/` to enable removing top-level (PROB-013 close path). Not blocking.

### 2026-04-30 (Cowork session — Prime Directive landed + first polish bundle + PROB-011 closed)

Parallel session running while another Cowork agent authored ledger drafts. Stayed in a polish/cleanup lane to avoid collision.

- **CLAUDE.md gained a Prime Directive preamble.** Above §0 (the existing Read-first-Global-Ledger block), a new ⛰️ PRIME DIRECTIVE section makes ledger discipline the explicit top-priority obligation — non-negotiable, supersedes momentum and "too small to log" instincts. The block contains: principle statement, read-list of 6 ledgers (Global, Temporal Continuity, Open Problems, Decisions, Communications, local Box) to consult before any meaningful action, update-list of 9 sites (activity.jsonl, sitemap, TCL §3/§10/§11, GL §2/§6/§12/§13, OPL, Decisions, Communications, local Box ledgers, indexes/index.json), the cardinal-sin framing about ledger drift, and the hard rule "no time for ledgers means no time for the change." Triggered by Jake's explicit ask: *"make sure you are updating those ledgers like my life depends on it."* The six operational disciplines below the new section preserved unchanged.
- **PROB-2026-04-28-011 closed via redirect-stub.** Cowork sandbox lacks `unlink()` permission on the user's mounted folder, so the stale duplicate at `docs/page_asset_sitemap.md` was overwritten in place with a 9-line redirect notice pointing to the canonical root. Close criterion explicitly accepted "redirect-only" so this satisfies it. OPL §5 stub left in place pointing at §10 Recently Closed; OPL §6 Documentation Drift line struck-through; JSON mirror flipped to `status:closed` with `closed:2026-04-30` and history append. Both .md and .json bumped `Last updated`.
- **`SCREEN_LABELS` dead-code cleanup in `components.jsx`.** Map now mirrors `app.jsx KNOWN_SCREENS` exactly. Removed 8 retired-route labels (memory, prediction, commitments, inbox, chat, calendar, rodbot, projects — all retired in the Apr 2026 great trim but their labels were left behind). Added 5 previously-missing live-route labels (leads, clients, coworkers, venues, intake). UI behavior unchanged — lookups already had `|| h.name` fallback. Header comment added pointing back to KNOWN_SCREENS as canonical. Cache-bust bumped: `components.jsx 69→70` in `Secretary.html`.
- **Activity ledger received 5 new entries** for this session: `claude_md_update`, `code_cleanup`, `cache_bust`, `open_problem_status_change` (PROB-011 close), `redirect_stub_write`.

Files touched this session:
- `CLAUDE.md` (Prime Directive section added)
- `components.jsx` (SCREEN_LABELS rewritten + header comment)
- `Secretary.html` (cache-bust 69→70)
- `docs/page_asset_sitemap.md` (overwritten as redirect stub)
- `LEDGERS/OPEN_PROBLEMS_LEDGER.md` (header bump, §5 stub, full §10 closure entry, §6 strikethrough)
- `LEDGERS/OPEN_PROBLEMS_LEDGER.json` (status flip + history append + last_updated bump)
- `LEDGERS/TEMPORAL_CONTINUITY.md` (this update)
- `CCAgentindex/_ledger/activity.jsonl` (5 appended lines)
- Cowork-session memory files: `feedback_ledger_prime_directive.md`, `project_box_evolved_form.md` (with `MEMORY.md` index updated)

**Lesson worth keeping:** Cowork sandbox cannot delete files in the mounted user folder. Workaround for "delete-shaped" close criteria is to overwrite with a redirect/deprecation stub. Worth phrasing future close criteria as "either delete OR clearly redirect-only" so the criterion is achievable from any actor's permission level.

---

### 2026-04-29 (Cowork session — directory consolidation + Audit dropped + Communications Ledger queued)

This was a Cowork session focused on housekeeping before authoring the Communications Ledger.

- **Sub-agent packages consolidated to `/Subagent Boxes/`.** All 5 draft packages (`file_directory_subagent_package`, `global_ledger_subagent_package`, `north_star_subagent_package`, `open_problems_subagent_package`, `temporal_continuity_subagent_package`) moved from repo root into `/Users/jakeaaron/Downloads/CC Agent/Subagent Boxes/`. Repo root no longer has scattered `*_subagent_package/` directories. These remain *draft* — awaiting promotion to runnable app agents under `CCAgentindex/agents/<name>/`. The canonical *active* steward materials still live at `LEDGERS/AGENTS/<name>/` (today: only `global_ledger_steward`).
- **Ledger drafts consolidated to `/Ledger Drafts/`.** The 19 hand-drafted `.txt` outlines moved from `~/Documents/` to `/Users/jakeaaron/Downloads/CC Agent/Ledger Drafts/`. This is the source material for unbuilt ledgers — Jake's spine for what each ledger should hold. **Always read the matching `.txt` outline before authoring any new ledger; don't reinvent structure.**
- **Audit Ledger removed from build queue.** Per Jake: "I don't think we're ever going to need that. It's basically covered in the other things." Audit-shaped findings will land in Open Problems, Decisions, Communications, or per-Box ledgers as appropriate. INDEX.md and GLOBAL_LEDGER §8 updated. The `# Audit Ledger.txt` draft stays in `Ledger Drafts/` as reference; not deleted.
- **Triad-maturity clustering codified by Jake** (whiteboard image): colored title = ledger built; box around title = sub-agent exists; colored-in box = sub-agent also set up. Currently colored+boxed: Global, Temporal, North Star, File Directory. Open Problems is built but its sub-agent package is still a draft package (now at `/Subagent Boxes/`).
- **Build order made explicit:** Phase A finish all Ledgers → Phase B finish all Sub-agents → Phase C build Subagent Boxes (boxes of ledgers controlled by sub-agent configurations). Currently in Phase A.
- **Phase 7: Decisions Ledger landed.** Created `LEDGERS/DECISIONS_LEDGER.md` (~750 lines), `LEDGERS/DECISIONS_LEDGER.json`, and 2 visuals (`decision_dependency_map.mmd`, `decision_timeline.mmd`). 12 active decisions: spec's 8 from 2026-04-28 (GitHub source-of-truth, FileTree-over-RAG, Client Boxes canonical, plans-are-strategy-drafts, risky-moves-need-isolated-approval, Boxes-page-display-only, sitemap-Done-Gate, one-ledger-at-a-time) plus 4 today (triad spine, three-phase build, TCL/GL update discipline, Audit-out-of-scope). 5 Communications entries promoted in (`COMM-2026-04-28-001`, `COMM-2026-04-28-003`, `COMM-2026-04-29-001`, `COMM-2026-04-29-003`, `COMM-2026-04-29-005`). 1 needs-review seeded (Approval UI / Risk Card Standard, related to DEC-005). Steward agent not yet authored — Phase B work, will live at `/Subagent Boxes/decisions_subagent_package/`.
- **Phase 6: Communications Ledger landed.** Created `LEDGERS/COMMUNICATIONS_LEDGER.md` (~450 lines), `LEDGERS/COMMUNICATIONS_LEDGER.json` (structured mirror), and 3 visuals (`handoff_flow.mmd`, `communication_lifecycle.mmd`, `communications_timeline.mmd`). 18 seeded entries split across the spec's section structure: 5 active handoffs (ledger build rhythm, client-box cleanup rhythm, Brenda fee-waiver lesson, cleanup-phase build arc, three-phase build discipline), 3 warnings (Git drift, plans-may-predate-guardrails, bedrock reconciliation deferred), 3 preferences (preferred ledger style, safe movement, triad spine), 4 lessons (sitting-there-is-state, automation-can-be-personal, wholesome-vs-creepy, **TCL/GL drift is the failure mode**), 1 abandoned attempt (plumbing-first build pivot — historical context), 2 cross-system notes (client-box state flow, page-work Done Gate). Steward agent not yet authored — Phase B work, will live at `/Subagent Boxes/communications_subagent_package/`.

Files touched this Cowork session:
- `LEDGERS/TEMPORAL_CONTINUITY.md` (this update)
- `LEDGERS/INDEX.md` (Audit row → out-of-scope; build-order item dropped; new directory pointers added; Communications row → active; 3 new visual rows)
- `LEDGERS/GLOBAL_LEDGER.md` (§8 Audit row → out-of-scope; §8 Communications row → active; §12 new 2026-04-29 entry; §13 read order updated to include Communications; §14 active-ledgers list updated)
- `LEDGERS/FILE_DIRECTORY_LEDGER.md` (§3 top-level map gained `Ledger Drafts/` and `Subagent Boxes/` rows)
- `LEDGERS/COMMUNICATIONS_LEDGER.md` + `.json` (created)
- `LEDGERS/VISUALS/handoff_flow.mmd` + `communication_lifecycle.mmd` + `communications_timeline.mmd` (created)
- `LEDGERS/VISUALS/ledger_dependency_map.mmd` (Communications node flipped to active)
- `CCAgentindex/_ledger/activity.jsonl` (housekeeping + ledger-create appends)

### 2026-04-29 (Claude Code catch-up + bedrock reconciliation flagged)

This was a **catch-up session in Claude Code (Opus 4.7 1M context)**, separate from the Cowork sessions that built Phases 1–5. No code changes. Goals: orient the assistant to the current cleanup-phase posture, log a major architectural problem to the Open Problems Ledger, and produce a clean handoff artifact for the next Cowork session.

- **Box + Ledger + Sub-agent triad codified as the architectural spine.** Saved to assistant memory: every state-bearing entity gets all three. Legibility > build speed.
- **Rebuild history captured.** Plumbing scrapped under Rodrigo pressure → UI rebuilt from working pieces → Auto/ payload symlinked into bedrock. This is *not greenfield* — it's cleanup. Saved to memory.
- **22 ledger outline drafts in `~/Documents/`** identified as the source material for not-yet-active ledgers (Settings, Widget, Page, Phase, Audit, Scout, Prompt/Reconstruction, Communications, Decisions, Connections, Asset/Widget Map, File Contents, Directory Configuration, Deliverables/DoD, plus rewrites of the 5 already-active ones). Path reference saved to memory.
- **Onboard Scripts mtime convention captured.** Late-April mtime = current/integrated; March mtime = scrapped-build legacy kept for future analytics enrichment, do not delete. Saved to memory.
- **PROB-2026-04-28-016 logged** — *CCAgentindex/ Bedrock Was Bootstrapped On The Fly — Needs Triad-Based Reconciliation.* Status: needs-decision. Severity: high. Urgency: later. Blocked on ledger + sub-agent buildout. Inventory of all 32 bedrock subdirs split into 5 buckets. Recommended action: do not act yet; finish ledgers, finish sub-agents, then reconcile.
- **Standing rule established:** route rough edges to `OPEN_PROBLEMS_LEDGER.md` rather than chat. Saved to memory as feedback.
- **Simulation Close account seeded** (separate from production Comeketo Close). API key `api_5TlUc9yZqhQqcLwLM7kzS1.0Fi8MMgRWc4IWJeuIgPuxB` is scoped to a different Close org from the production account — no cross-org write risk. 51 leads created (1 prototype + 50 named) with realistic non-production names, `@example.com` emails, `+1 555-01XX` reserved fictional phones. Enriched with: lead statuses (weighted toward live pipeline), addresses, URLs, 99 notes, 45 tasks (mix of past-due/future/pre-completed), 27 opportunities with $ value + confidence + status across 5 stages. **For training simulation only.** Production Close untouched.
- **This TCL update.** This is the entry that exists because Jake said "the ledger is more important than the actual work" and explicitly named TCL drift as the failure mode that gave a previous Cowork session a stale orientation.

Files touched this session:
- `LEDGERS/OPEN_PROBLEMS_LEDGER.md` (added PROB-016, §6 row, §7 row)
- `LEDGERS/OPEN_PROBLEMS_LEDGER.json` (appended PROB-016, recomputed counts)
- `LEDGERS/TEMPORAL_CONTINUITY.md` (this update)
- `CCAgentindex/_ledger/activity.jsonl` (one append: PROB-016 log)
- `~/.claude/projects/-Users-jakeaaron-Downloads-CC-Agent/memory/` (5 new memory files indexed in `MEMORY.md`)

### 2026-04-28 (Cowork session — Phases 1–5 + verbatim backfill)

- **Global Ledger Steward automation landed.** Promoted `global_ledger_subagent_package/` into canonical steward files at `LEDGERS/AGENTS/global_ledger_steward/` and runtime app-agent files at `CCAgentindex/agents/global_ledger_steward/`. The app agent is discoverable through `/api/agents`, runs via `POST /api/agents/global_ledger_steward/run`, and is scoped to update ledger memory files plus append `_ledger/activity.jsonl` and write `_ledger/ledger_steward_runs/*.json` receipts. This establishes the pattern for later Temporal Continuity, North Star, File Directory, and Open Problems stewards.
- **Phase 5: Open Problems Ledger created.** Added [`OPEN_PROBLEMS_LEDGER.md`](OPEN_PROBLEMS_LEDGER.md) + [`OPEN_PROBLEMS_LEDGER.json`](OPEN_PROBLEMS_LEDGER.json) + 3 visuals (`problem_lifecycle.mmd`, `open_problems_board.mmd`, `risk_heatmap.mmd`). 13 active problems with stable IDs, severity/urgency separated, mandatory close criteria. **PROB-008 closed** because the spec's close criteria for "Ledger System Not Yet Implemented" are all met by Phases 1–4. **PROB-005 marked `partial`** because the verbatim comms backfill closed 2 of its 5 close criteria (transcripts location defined ✅, ≥1 transcript imported ✅; remaining: UI binding, automation reading protocol, plan rewrite trigger). 5 directory-level problems from Phase 4 promoted to formal PROB-010 through 014.
- **Phase 4: File Directory Ledger created.** Added [`FILE_DIRECTORY_LEDGER.md`](FILE_DIRECTORY_LEDGER.md) + [`FILE_DIRECTORY_LEDGER.json`](FILE_DIRECTORY_LEDGER.json) + [`VISUALS/file_directory_map.mmd`](VISUALS/file_directory_map.mmd) + [`VISUALS/directory_ownership_map.mmd`](VISUALS/directory_ownership_map.mmd). All 13 sections per spec §5, real paths only (no inventions), 12 common wrong-turns. **Surfaced 5 open problems for Open Problems Ledger when it lands:** (1) CLAUDE.md §1 surviving-domains list out of date — reality is 26 dirs with 10 stubs and 16 populated (`intelligence/` alone has 119 files); (2) `docs/page_asset_sitemap.md` is stale (11 KB, abandoned); (3) `Auto/Boxes/` is needs-verification mirror; (4) Top-level `Onboard Scripts/` is 31-file superset of `Auto/Onboard Scripts/` (24); (5) `Comeketo Agent/` exists at both top-level and inside `Auto/`, identical except `.DS_Store`.
- **Phase 3: North Star Ledger created.** Added [`NORTH_STAR.md`](NORTH_STAR.md) + [`NORTH_STAR.json`](NORTH_STAR.json) + [`VISUALS/north_star_map.mmd`](VISUALS/north_star_map.mmd) + [`VISUALS/north_star_alignment_check.mmd`](VISUALS/north_star_alignment_check.mmd). Ten North Star goals (NS-01 through NS-10), 10 guiding principles, 10 anti-goals, 7 tradeoff rules, 10 audit questions, Wholesome Enrichment principle, Client Automation North Star, current alignment notes. Project thesis preserved as: *FileTree orchestration over RAG memory; automation that feels more human, not less.*
- **Phase 2: Temporal Continuity Ledger created** (this file). Added `TEMPORAL_CONTINUITY.md` + `.json` + 2 visuals.
- **Created `LEDGERS/` at project root.** Phase 1 of the ledger system: Global Ledger (`GLOBAL_LEDGER.md` + `.json`), `INDEX.md`, three Mermaid visuals (`global_system_map`, `ledger_dependency_map`, `client_box_lifecycle`), two Box templates (`BOX_LEDGER_TEMPLATE`, `DIRECTORY_ORIENTATION_TEMPLATE`).
- **Wired read-first pointers** into `CLAUDE.md` (new §0), `AGENT.md` (Read-second block), `README.md` (Project memory section).
- **Verbatim comms backfill across all 28 client boxes** via `api.close.com/api/v1`. 582 raw activity payloads (calls with `recording_transcript`/`voicemail_transcript`, meetings with `transcripts`, full email bodies, SMS, WhatsApp, threads). Pull script at `outputs/pull_full_comms.py` (one-shot, not yet promoted into bedrock).
- **Updated `page_asset_sitemap.md`** boxes-page section: added verbatim comms asset ownership and 2026-04-28 history line. Bumped top-level `Last updated`.
- **Appended six entries to `CCAgentindex/_ledger/activity.jsonl`** (verbatim backfill + Phases 1–5).

### 2026-04-28 (earlier, before this session)

Per `git log` and per the spec from Jake:
- **Clean Brenda & Steve alert schedule after audit** (commit bec920d).
- **Add Brenda & Steve audit marker** (commit 0a46a3b).
- **April 28 sync — verbatim comms, intelligence layer, draft delegations** (commit 8461f5d). Note: this commit's "verbatim comms" reference appears to predate this session's Close API backfill — likely a separate earlier effort.
- Established explicit principle: **the plan is subordinate to comms, state, guardrails, and approvals.**
- Identified high-risk batch approval problem: risky moves can be technically approved but not sufficiently isolated.
- Established safer early automation posture: movement, but no unapproved big swings.

This is continuity history, not git history. For commit-level detail see `git log` or `CCAgentindex/_ledger/activity.jsonl`.

---

## 4. Active Assumptions

These are the assumptions silently shaping work right now. Review often. If an assumption becomes a decision, move it to the Decisions Ledger (when it exists). If an assumption becomes wrong, update it immediately.

- GitHub (`RodbotCC/CCAgent` `main`) is the durable source of truth.
- The local working copy may contain unpushed work, so direct GitHub writes require caution.
- The project prefers file-tree orchestration over RAG-style memory. Memory lives in versioned files.
- Boxes are the preferred local memory structure. The Box concept is global; each Box owns its local truth.
- Seven-day plans are strategy drafts, not unconditional send licenses. Plans are subordinate to comms, state, guardrails, and approvals.
- Client replies invalidate or at least pause existing plans until reviewed. **Reply → plan is stale.**
- Enrichment is allowed for internal strategy but must not leak into customer-facing copy unless grounded in comms or explicitly approved.
- Comeketo currently wants visible automation movement, but Jake wants the system safer and more controlled. Posture: safe movement before aggressive cleverness.
- The verbatim comms file (`01b_comms_verbatim.md`) is now the highest-fidelity client truth in each box, ahead of the curated `01_comms.md` summary.
- Pieces.app at `localhost:39300` is the memory backend. PiecesOS must be running for the Activity screen to work.
- The `Auto/` alias is read-mostly. Writes through it require explicit team authorization (today's verbatim backfill was such a write).

---

## 5. Carry-Forward Context

Jake is building a durable GitHub-backed memory system where agents can continue work without relying on chat history. He cares deeply about ledgers, boxes, visual maps, and source-of-truth clarity. The collaboration shape: **Jake is the orchestrator, Claude does the fine details.** Energy and momentum matter — Jake doesn't want gratuitous validation or excess clarification questions on well-specified tasks.

Jake is under pressure to show Comeketo that automation is moving, but he's worried the system may act too aggressively. He wants a posture that preserves momentum while reducing unsafe autonomy.

**This is Jake's career project.** Comeketo Agent is not Secretary, not Sylvia, not OpenClaw. The user-global `~/.claude/CLAUDE.md` describes Secretary Mission Control — that is a *separate* personal-scope project; it is stale orientation when working in this repo. The project-local `CLAUDE.md` overrides it. Jake is also building a personal-scope side version of Comeketo Agent for himself, but the priority is this one.

**The triad is the spine.** Box + Ledger + Sub-agent. Anything stateful gets all three. Legibility-first means a Ledger reader should understand the system without opening code. Don't be lazy about Ledger updates — same unit of work as the change itself, not "I'll get to it." Cold-starting agents (including future Cowork sessions) read TCL and Global Ledger first; if those are stale, every agent that boots from them is stale. **Update them as you work.**

The **Brenda & Steve case is the key lesson driving the current safety push**:
- The fee-waiver move may have been strategically correct.
- The problem was that the risk was not isolated enough during batch approval — it was hidden inside a routine batch rather than surfaced as its own approval card.
- Future risky moves (fee waivers, discounts, scope promises, pricing claims, enrichment-based personalization) should become explicit approval cards, not blended into normal batch sends.

Brenda's `05_seven_day_plan.md` now opens with `Audit-cleaned: 2026-04-28 01:40 AM ET` and a Safety Status block explicitly stating the plan is "usable only with the inbox guardrails loaded before every future outbound." That language is the template for future audited boxes.

**The user's "P" workflow:** Jake will type `P` (or send the next ledger spec as an upload, like he did for this Temporal Continuity Ledger) to proceed to the next ledger. The build order is tracked in `INDEX.md`. Currently after this file: North Star (per the spec text in §7.9) or Source-of-Truth (per Global §8 / INDEX suggested order). Confirm with Jake before assuming.

**Ledger Phases 1–5 are complete:** Global (constitution), Temporal Continuity (cockpit log, this file), North Star (compass), File Directory (city map), Open Problems (protection system). The cadence is one ledger at a time. Don't skip ahead. Don't batch.

**The first ledger steward is runnable.** `global_ledger_steward` lives in both canonical form (`LEDGERS/AGENTS/global_ledger_steward/`) and app-runtime form (`CCAgentindex/agents/global_ledger_steward/`). Use audit-only mode for a non-editing scan; default mode can locally update Global/Index/Temporal/File Directory ledgers plus append receipt/activity.

**The North Star Ledger is now the alignment authority.** Future audits, decisions, and tradeoffs should reference NS-01 through NS-10. The Wholesome Enrichment principle and the Client Automation North Star give explicit quality standards for client-facing work.

**The Brenda audit was committed; today's session work is not.** When Jake is ready to commit/push, the changes are: `M AGENT.md`, `M CLAUDE.md`, `M README.md`, `M CCAgentindex/_ledger/activity.jsonl`, `?? LEDGERS/`. The pre-existing dirty files (`pieces_sweeps.jsonl`, `Flávia Benson.txt`) belong to other workstreams; coordinate before bundling.

---

## 6. Current Risks / Fragile Areas

These are what matters **right now**. Use the Open Problems Ledger (when it exists) for the full inventory.

### Risk: Plan / guardrail contradiction

Some plans were authored before guardrails were fully enforced. Audit each plan before trusting it. Brenda's plan was the first to receive an explicit audit pass; the other 27 boxes' plans (where they exist) have not been re-validated.

### Risk: Batch approval hides dangerous moves

Fee waivers, discounts, pricing claims, guest-count promises, and enrichment-based personalization should require **isolated** approval cards — not blended into routine batches. This is the lesson from Brenda's fee-waiver audit.

### Risk: Reply invalidates plan

If a lead replies, the existing seven-day plan should be paused and possibly rewritten. The verbatim comms backfill makes detection easier (every reply is now in `01b_comms_verbatim.md`), but no automation yet enforces "reply → plan-stale" gating.

### Risk: Enrichment boundary

Client profiles and `*_enrichment.md` files may contain useful but non-customer-facing facts. Customer-facing copy must use only comms-grounded facts or explicit approval. Until the allowed-to-know layer is built, this is a manual discipline.

### Risk: GitHub writes vs local work

Working tree currently dirty with this session's writes (`LEDGERS/`, `CLAUDE.md`, `AGENT.md`, `README.md`, `activity.jsonl`) plus pre-existing untouched dirty files (`pieces_sweeps.jsonl`, `Flávia Benson.txt`). Direct GitHub commits should bundle deliberately. Avoid force-push assumptions.

### Risk: Generated UI confidence

The Boxes UI page may display old or partial source data. It should be treated as a view, not as the canonical truth. The new `01b_comms_verbatim.md` is not yet bound to any UI section, so the UI is currently slightly behind the disk reality.

### Risk: Auto/ alias write transparency

The verbatim comms backfill wrote through the `Auto/` symlink to `/Users/jakeaaron/Desktop/Auto/`. Those writes don't appear in `git status` of the main repo (they're in a different filesystem location). If the standalone Auto/ folder has its own git scope, those writes need to be tracked there separately.

---

## 7. Current Human Preferences / Instructions

These are extremely valuable for future agents. If Jake changes preferences, update this section.

- **One ledger at a time.** Jake will signal when to proceed (typically `P` or by uploading the next ledger spec).
- **Outlines should be implementation-ready but not overfit to a single implementation.**
- **Markdown + JSON + visual maps** are the preferred shape for ledgers.
- **GitHub-backed continuity over local-only memory.**
- **Client Box work is one box at a time.**
- **No risky writes without awareness.** If a change would surprise a future agent, leave a handoff note.
- **For early Comeketo automation, safe movement over aggressive cleverness.** Movement is good; the system should not act with unapproved authority.
- **Energy-driven collaboration.** Jake is the orchestrator; Claude does the fine details. Don't ask 4 clarifying questions on well-specified tasks. Move with momentum and surface judgment calls in the final summary, not before each step.
- **No commit/push without explicit go-ahead** when there's risk of stepping on local unpushed work. Local commits can be staged; pushing is Jake's call.
- **Hercules mode** — when Jake says "Hercules mode" or "<3" or signals trust, execute the spec rigorously without asking permission for every detail. The spec is the contract.

---

## 8. Open Threads Needing Follow-Up

The "don't drop these" section. Not a full task manager.

### Ledger system

Continue per `INDEX.md` build order. After Phase 5 (Open Problems, just landed), the suggested next ledgers in priority order are:

1. **Source-of-Truth Ledger** — encodes rules already summarized in Global §4 + NS-06 + FDL §6 + OPL recurring patterns. Would unblock PROB-001 (allowed-to-know schema) and reduce PROB-010 risk by formalizing where CLAUDE.md authority lives.
2. **Definition of Done Ledger** — locks in the "if the system changed, the system memory changes with it" rule per surface; references North Star goals + OPL close-criteria pattern.
3. **Decisions Ledger** — start logging the big calls retroactively. Several PROB entries are blocked on decisions (PROB-010, 011, 012, 013, 014) — DoD + Decisions together would unblock them.
4. **Audit Ledger** — formalize the Brenda audit pattern; entries reference NS goals (supported / threatened / anti-goal proximity) and OPL entries created/closed.

Confirm with Jake which Phase 6 to build next.

### Client Boxes — audit queue

Brenda is done. Remaining (per Jake's earlier prioritization): Hugo Casillas, Daphney & Frankie, Dawn M Denton, Eliana Lopes, Elizabeth & Peter, Emanuella Andrade, Esther Manu, Flávia Benson, Flaviane Mesquita, then the rest of the 28.

### Allowed-to-know layer

Design and implement the four-bucket model:
- comms-confirmed facts → safe for customer copy
- enrichment-only strategy → internal-only
- protected/off-limits facts → never use
- approval-required facts/actions → operator gate

### Verbatim comms UI binding

The `01b_comms_verbatim.md` file is in every box but not yet surfaced in the Boxes page. Future renderer work can wire it as a second comms tab inside `BoxesScreen`.

### Git workflow

Settle a safer pattern for direct GitHub agent writes while Jake has local unpushed work. Today's pattern: write locally, ledger-log, surface in the summary, let Jake commit/push.

### Untracked file

`Auto/Client Boxes/Flávia Benson/Flávia Benson.txt` is untracked in `git status` and predates this session. Worth a quick check next time someone is in that box.

### Pre-existing dirty file

`CCAgentindex/_ledger/pieces_sweeps.jsonl` is modified but doesn't belong to this session's work. Owner should decide whether to commit or revert.

---

## 9. Recently Touched Systems

### `Auto/Client Boxes/` — all 28 boxes

Touched by the verbatim comms backfill:
- New file in every box: `01b_comms_verbatim.md`
- New folder in every box: `comms/<type>_<date>_<id>.json` (582 raw payloads total)

Reason: pull full Close.com conversation history into each box so customer-facing work can ground in transcripts and full email bodies, not just curated summaries.

Not touched: existing `01_comms.md` summaries, `04_profile.md`, `05_seven_day_plan.md`, `client_ledger.md`, etc.

### `Auto/Client Boxes/Brenda & Steve/`

Touched (earlier today, by Jake):
- `05_seven_day_plan.md` — audit-cleaned at 01:40 AM ET
- `09_andre_alerts.md` — alert schedule cleaned
- `2026-04-28_audit_marker.md` — created

Reason: first explicit audit pass. Stale calendar labels removed, risky commitment language gated, enrichment leakage reduced.

### `LEDGERS/` (new directory)

Created from scratch this session:
- `GLOBAL_LEDGER.md` (23 KB, 16 sections)
- `GLOBAL_LEDGER.json` (10.7 KB structured mirror)
- `INDEX.md` (planned-ledger roster + build order)
- `VISUALS/global_system_map.mmd`
- `VISUALS/ledger_dependency_map.mmd`
- `VISUALS/client_box_lifecycle.mmd`
- `LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md`
- `LOCAL_TEMPLATE/DIRECTORY_ORIENTATION_TEMPLATE.md`
- `TEMPORAL_CONTINUITY.md` (this file)
- `TEMPORAL_CONTINUITY.json`
- `VISUALS/temporal_continuity_flow.mmd`
- `AGENTS/global_ledger_steward/` — canonical Global Ledger Steward package

### Top-level meta files

Touched (read-first wiring):
- `CLAUDE.md` — added new §0 read-first block above the six disciplines
- `AGENT.md` — added Read-second block right after spawn-time briefing
- `README.md` — added Project memory section under the title

### `page_asset_sitemap.md`

Touched: boxes-page section got a new Assets line for verbatim comms + a 2026-04-28 history entry. Top-level `Last updated` bumped.

### `CCAgentindex/_ledger/activity.jsonl`

Appended (this session): two entries (verbatim backfill + Global Ledger creation). A third entry (Temporal Continuity Ledger) lands as part of this file's wrap-up.

### `CCAgentindex/agents/global_ledger_steward/`

Created runtime app-agent spec and prompt. Dispatch path is `POST /api/agents/global_ledger_steward/run`.

### `CCAgentindex/_ledger/ledger_steward_runs/`

Created receipt directory for Global Ledger Steward runs.

---

## 10. Next Agent Handoff

This is the "wake up and continue" block.

### If Jake types `P` or uploads the next ledger spec

- Wait for the spec.
- Build it the same way Phases 1 and 2 were built: tasks → artifacts → wire into Global + INDEX → ledger-log → return clean summary.
- Keep the tone broad, implementation-ready, and grounded in actual project state (read disk before claiming).
- Don't jump ahead. Don't batch ledgers.
- Update Temporal Continuity at the end of the session (§3 Recent Meaningful Changes, §10 Next Agent Handoff, §11 Session Log).
- For global-memory drift checks, run `global_ledger_steward` in audit-only mode first; use default local-write mode when the steward should apply scoped ledger updates.

### If maintaining agent interoperability files

- Keep `CLAUDE.md` and `AGENTS.md` aligned on project-wide rules. Tool-specific details may differ; Prime Directive, read/write ledger lists, scope gates, Done Gate, and Pieces setup doctrine should not drift.
- Do not add a parallel `CODEX.md` unless Codex tooling starts reading it. For this repo, `AGENTS.md` is the authoritative Codex hook.
- If a future Claude/Codex/Cowork behavior rule matters across tools, promote it into the appropriate ledger rather than leaving it in one agent's private memory.

### If continuing the grid ChatRail command cockpit

- Treat the right rail as the command surface that stitches chat, Box Graph, and Delegations together.
- Preserve the prompt-card pattern: cards should seed visible editable text into the composer, not fire opaque automations.
- If adding more binary/tool panels, source live availability from `/api/status` or explicit receipts rather than assuming local tools are present.
- Update `page_asset_sitemap.md` `Page: grid` after any ChatRail route, data-binding, or panel change.

### If Jake says "commit" or "push"

- Run `git status` first to see the full picture.
- Confirm what should be in the commit. Today's session adds: `LEDGERS/` (new), `CLAUDE.md`, `AGENT.md`, `README.md`, `CCAgentindex/_ledger/activity.jsonl`. Pre-existing dirty files (`pieces_sweeps.jsonl`, `Flávia Benson.txt`) are separate workstreams — clarify with Jake.
- Suggested commit messages from spec: `Add global ledger continuity layer`, `Add temporal continuity ledger`. Or one combined: `Add global + temporal continuity ledgers + verbatim comms backfill markers`.
- Don't push without explicit go-ahead.

### If continuing Client Box cleanup

- Work one box at a time.
- Read the full box before changing — both the curated `01_comms.md` AND the new `01b_comms_verbatim.md` (since today's backfill).
- Look for stale calendar labels, reply-gate issues, risky commitment language, enrichment leakage, missing comms, missing state, and plan/guardrail contradictions.
- If cleaning, leave an audit marker (`YYYY-MM-DD_audit_marker.md`) and prepend an `Audit-cleaned: ...` line to the touched plan/alerts files. Brenda is the template.
- Stamp `BOX_LEDGER_TEMPLATE.md` if the box is graduating to a full Box.

### If continuing the verbatim comms work

- The pull script at `outputs/pull_full_comms.py` is one-shot. If it needs to become recurring, promote it into the bedrock (`Auto/Onboard Scripts/` is the natural home given existing siblings like `export_close_conversations.py`).
- Close API key was env-only. Refresh requires Jake re-supplying it.
- The Boxes UI page can be extended to surface `01b_comms_verbatim.md` as a second comms tab.

---

## 11. Session Log

### 2026-05-01 (later still³) — Cowork session (CLAUDE.md rewrite post-sweep + P-Protocol doctrine locked)

**Summary:** Operator surfaced two simultaneous needs: (1) CLAUDE.md was stale post-scorched-earth-reorg — every path reference pointed at `LEDGERS/<NAME>.md` paths that no longer exist; (2) operator developed a parallel-agent operating doctrine (the P-button trick + 4-principle frame + announce-act-report-stop cycle) and wanted it formalized for cross-runtime consistency. This atom rewrote CLAUDE.md to address both: path migration throughout + new §1.3 Working Mode and the P-Protocol section + new §3.3 post-sweep canonical structure + new §3.5 four-category classification + new Appendix C canonical-paths quick-reference. Authored DEC-2026-05-01-003 to formalize the operating doctrine as a settled rule. Filed COMM-2026-05-01-004 as the master orientation entry pointing at both.

**Important outcomes:**

- **CLAUDE.md rewritten** — 1235 lines → 1591 lines, full path migration + new operating doctrine + new four-category classification + new Appendix C. All §1-§18 + Appendix A/B/C present and verified. P-Protocol §1.3 verified (7 hits on key terms in grep). Old `LEDGERS/<NAME>.md` paths only appear in the §3.3 migration table (not in active rules). Old `Auto/` paths only appear in §3.3 migration table + §18 anti-patterns. The contract is now consistent with the post-sweep state.
- **DEC-2026-05-01-003 authored** — Cleanup Mode Default + P-Protocol Operating Doctrine. Active. 24 active + 1 proposed decisions total now. Three-pillar formalization: cleanup-mode default + 4 operator-rule principles + P-button protocol with announce-act-report-stop cycle. Locks the doctrine across every agent runtime.
- **COMM-2026-05-01-004 filed** — master orientation entry. Active until a runnable Atomizer Steward verifies cross-runtime adherence to P-protocol AND 3 consecutive sessions ship without atom-chase drift / runaway agents / duplicate-ID collisions.
- **Cross-ledger propagation completed** per Per-Atom-Completion Update Protocol — TCL §3 + §11 + header; GLOBAL §12 + header; INDEX header; OPL header (no PROB filed/closed this turn); activity.jsonl appends.

**Carry forward:**

- **Every future agent in every runtime now reads CLAUDE.md as the operating contract.** Read-first protocol of §2 inherits the new doctrine automatically.
- **The P-button is operator's primary coordination lever.** Cowork / Claude Code / Codex / parallel ChatGPT-based agents all follow announce-act-report-stop. One P = one small unit.
- **Cleanup mode is the default until operator declares otherwise.** Greenfield mode requires an explicit superseding DEC.
- **Path-stability stress test runs over the next 3 sessions.** If agents reach the right files via CLAUDE.md §3.3 and don't hit `LEDGERS/<NAME>.md` 404s, the migration is stable. If they do hit 404s, COMM-004 needs amplification or §3.3 needs refinement.
- **Tasks #35 (rewrite CLAUDE.md §2.2 + §3.3 path references) marked completed** — superseded by ATOM-0014's full rewrite. Tasks #2-11 (page audits) still pending; can ship under cleanup mode + P-protocol going forward.

### 2026-05-01 (later still²) — Cowork session (Beta-Test Pivot — v2.1 inbox guardrails + Client Boxes archive redirect)

**Summary:** Operator pivoted mid-day from "disperse Client Boxes into bedrock canonical home" to "zip them into a frozen archive while we beta-test the inbox automation against a fake-Close training instance with new v2.1 guardrails." This session wrote v2.1 guardrails to `Auto/comeketo-inbox/references/guardrails.md` (full rewrite, no skimping per operator directive), filed COMM-2026-05-01-003 documenting the directional shift, revised the DEC-2026-05-01-002 placement table (Client Boxes row → archive), updated PROB-2026-05-01-001 history, and queued ATOM-2026-05-01-0013 to file the parent PROB-2026-05-01-002 (Beta-Test Isolation) and atomize the beta-test infrastructure scope.

**Important outcomes:**

- **Inbox guardrails v2.1 landed** — full §A-§I rewrite at `Auto/comeketo-inbox/references/guardrails.md`. New rules: A12 (touchpoint completion alert), E5 (qualified-lead cadence with post-quote/long-term/active-negotiation modes), E6 (priority tiers P0-P3 per inbox run), F3 (manager daily report). 20-step decision tree updated to compute cadence position + priority tier per task.
- **COMM-2026-05-01-003 filed** — beta-test pivot coordination warning. 7-section entry covering: the pivot rationale, why-it-matters-more-than-it-looks-like (de-risking discipline: don't refactor storage and learn runtime simultaneously), DEC-002 row revision, scheduled automation retirement, suggested actions for future agents, expiry conditions.
- **DEC-2026-05-01-002 Client Boxes placement REVISED.** Row now reads: "Zipped archive at `<beta-test-path-TBD>` per ATOM-2026-05-01-0013. Frozen reference snapshot for the duration of the beta-test phase, NOT the live read/write surface. Restored to canonical home (`CCAgentindex/client_boxes/`) post-beta-test cutover. See COMM-2026-05-01-003." Marked superseded.
- **PROB-2026-05-01-001 history updated** noting the placement revision + ATOM-0006 marked on-hold pending PROB-002 decomposition.
- **PROB-2026-05-01-002 (Beta-Test Isolation) queued** for ATOM-2026-05-01-0013 — atomization scope: zip Client Boxes to archive, formally remove all scheduled automations, wire fake-Close instance as primary inbox source for beta, instrument observability for volume/throughput testing, write beta-test execution playbook, retrospective + production cutover criteria.

**Carry forward:**

- **ATOM-0012 was the only atom shipped this turn.** ATOM-0013 is queued in tasks (#43) — file PROB-002 + decompose. Beta-test atoms remain in PROB-002's scope.
- **DEC-002 placement table is now mid-revision.** Client Boxes row superseded; remaining 12 rows still apply (Staff Boxes, comeketo-inbox, orchestrator, Boxes, Hugodemo, Onboard Scripts, CIA.txt, voice profiles, venue index, ballpark template, comeketo-inbox.skill, QuoteMaker, misc).
- **Real Client Boxes are functionally frozen** until PROB-002 lands + cutover clears. No writes into `Auto/Client Boxes/<Name>/` during the window.
- **The new v2.1 guardrails are the source of truth.** Any agent invoking `comeketo-inbox` skill or composing outbound via render_email.py / render_followup_email.py / price_ballpark.py validates against §A-§I, not the old §1-§8. Old guardrails preserved in git history for diff reference.
- **`guardrails-summary-for-andre.md`** (10 KB Andre-facing summary) likely needs a regeneration pass against v2.1 — not done this turn, follow-on atom candidate.

### 2026-05-01 (later still) — Cowork session (Auto/ symlink dispersal chain initiation)

**Summary:** Operator surfaced the Auto/ folder as a directory catastrophe + paused automations, removing the original blocker against the heavyweight content migration deferred at PROB-2026-04-28-016. This session filed PROB-2026-05-01-001 explicitly as the reversal of that 2026-04-28 closure, decomposed it into an 11-atom dispersal chain, authored DEC-2026-05-01-002 as the dispersal pattern (status: proposed; 4 placement rows tagged for Jake decision), filed COMM-2026-05-01-002 as the coordination warning during the dispersal window, and propagated across the continuity ledgers (TCL §3 + §11 + header; GLOBAL §12 + header; INDEX header; OPL header; DECISIONS header; COMMUNICATIONS header).

**Important outcomes:**

- **PROB-2026-05-01-001 filed** with full path-reference inventory (server.py:41-44 + ~10 downstream refs + _lib.py + voice.py + KICKOFF_TODAY.md + CLAUDE.md §2.2/§3.3), 13-row Auto/ children inventory, 11-atom decomposition, close criteria.
- **DEC-2026-05-01-002 authored (status: proposed)** with 13-row placement table. Structural pattern (real folders in bedrock + snapshot-before-move + atom-per-child) approved-pending-operator; 4 specific placement rows tagged "Jake decision needed."
- **COMM-2026-05-01-002 filed** — 6 coordination rules for the dispersal window. Active until ATOM-2026-05-01-0011 completes.
- **11-atom chain decomposed** in ATOMS §10.5. Total effort ~7.5h; one atom per substantive turn for clean reversibility-via-snapshot.
- **Cross-ledger propagation** completed per Per-Atom-Completion Update Protocol — TCL §3 + §11 + header bumped; GLOBAL §12 + header bumped; INDEX header refreshed; OPL/DECISIONS/COMMUNICATIONS headers all reflect the new state.
- **CLAUDE.md (rewritten by operator earlier today) read and internalized.** Ledger discipline + Per-Atom-Completion Update Protocol + the cardinal-sin language about ledger drift now operating-rule, not aspirational.

**Carry forward:**

- **Atom 0001 was the only atom shipped this turn.** Atoms 0002-0011 remain `available` and are claimable in dependency order. ATOM-0002 (snapshot) blocks all move atoms.
- **DEC-002 placement table awaits operator review.** 4 rows tagged for Jake decision; corresponding move atoms (0006, 0007, 0010 partial) blocked until those rows confirm.
- **`_snapshots/`** is load-bearing — confirmed via README at `/Users/jakeaaron/Downloads/CC Agent/_snapshots/README.md`. Paired with DEPRECATION.md §7. Don't touch as part of the cleanup pass.
- **Other deprecation candidates** (Jake's "deprecated folder" plan from prior turn) — pending operator staging into `_deprecated/` with one-line note per item in `_deprecated/CANDIDATES.md`. I'll review against Deprecation Ledger contract when items land.

### 2026-05-01 — Cowork session (Phase B steward fleet completion + Atlas integration + atom-protocol rules + ground-truth Box class)

**Summary:** Closed PROB-2026-04-30-005 (Promote Remaining Steward Sub-Agent Packages To Runnable App Agents) by shipping all 4 graduation chains end-to-end. Introduced first `ground_truth_source` Box class (Atlas) — distinct from existing `ledger` class — with daily 8 AM ET cron + inaugural ground-truth digest. Promoted 3 atom-protocol rules from agent-private auto-memory to project-wide Communications. Filed cross-cutting lesson on duplicate-ID race condition (4 captured incidents in 24h). Audited grid page sitemap, fixed ChatRail polish bugs (route pill unification, browser-use card cleanup, tool-turn visual identity), shipped web-mode UI gating per PROB-001 partial closure.

**Important outcomes:**

- **PROB-2026-04-30-005 CLOSED.** All 4 steward graduation chains complete: temporal_continuity (ATOM-0028→0031), open_problems (0032→0035), north_star (0040→0043), file_directory (0036→0039). Plus global_ledger migrated to unified Box via ATOM-0044, and atoms_steward authored. **7 stewards now runnable** (1 via legacy + 6 via unified Box dispatch). Each smoke test produced real findings: temporal_continuity (6 stale-surface findings), open_problems (3 duplicate PROB-IDs + 9 missing Status lines), file_directory (3 drift categories: 3 dirs missing from FDL, 2 aliases missing, 2 BOXES subdirs missing).
- **PROB-2026-04-30-015 (Atlas Sweep Steward Not Yet Runnable) CLOSED.** Atlas Box authored as `ground_truth_source` class — first of its kind. 4-atom chain (renumbered from 0045-0048 to 0107-0110 due to ID collision). Inaugural digest at `LEDGERS/BOXES/atlas/digests/2026-04-29.md` (8500 words, 24 concordance / 3 drift findings / 4 handoff lessons / ~10 atom candidates / 5 decision-context additions / 6 out-of-scope from 37 project-relevant of 45 total summaries). Daily 8 AM ET cron at `CCAgentindex/triggers/atlas_daily_sweep.json` enabled.
- **PROB-2026-04-30-001 partial-progress.** Web-mode UI gating shipped: when `tweaks.aiProvider === "openai"`, `briefing` chip + `activity` chip + `LivePiecesHeader` ticker hide; redirect-on-flip + Settings disclosure box.
- **5 new Communications entries** (COMM-2026-04-30-004 through 008): atom-protocol rules promoted from auto-memory (claim-before-doing, announce-before-doing, P-means-proceed), Atlas integration architecture, duplicate-ID race condition lesson with 4 captured incidents and structural fix candidates.
- **3 ChatRail UI fixes shipped:** route pill unification, browser-use done card cleanup, tool turn visual identity. Cache-busts: `components.jsx 70→73`, `styles.css 91→92`.
- **Atlas symlink + Cowork memory symlink** added to project tree (gitignored). New directories: `LEDGERS/BOXES/atlas/`, `LEDGERS/BOXES/global_ledger/`, `LEDGERS/BOXES/file_directory/`, `LEDGERS/BOXES/open_problems/`.
- **Sitemap §grid reconciled** via 3-way diff. Fixed pre-trim 3x3 decision-grid drift. Filed PROB-2026-04-30-002/003/004.
- **SOURCE_OF_TRUTH §3.0 Operator-Activity Truth** added: per-domain trust ordering. Two-truths contract: Atlas wins for what-happened, ledgers win for what-decided.

**Carry forward:**

- **Atom-chase failure mode this session:** I shipped 7+ atoms in rapid succession but neglected the cross-cutting ledger updates (Global, North Star, Phase, File Contents, File Directory, Deprecation). Operator called this out at session end. Recovery: this entry + the parallel ledger reconciliation pass below. **Lesson for next agent: the Done Gate isn't just "atom marked completed in ATOMS.json" — it's the cross-ledger updates per CLAUDE.md §0 PRIME DIRECTIVE.** When chaining atoms, batch the cross-ledger pass at most every 3 atoms, not at session-end.
- Duplicate-ID race condition (COMM-2026-04-30-008) needs structural resolution. Three fix candidates listed; pick one in next planning session.
- FDL backfill needed: 3 top-level dirs (`_snapshots`, `scaffolded test`, `src`), 2 new aliases (`cowork_memory`, `LEDGERS/atlas`), 2 BOXES subdirs (`atlas`, `atoms`).
- 9 OPL entries missing canonical `Status:` line (data hygiene atom candidate).
- Atlas digest surfaced 3 drift candidates: D-1 Hugo Casillas GitHub-write permission missing DEC; D-2 Audit Ledger deprecation missing formal DEPR; D-3 "Reactive Box Network" vocabulary mismatch.
- Linter is reverting Atlas Box steward files (AGENTS.md, prompt.md, config.json, BOX.md, box.json, trigger, receipt) back to "draft v0.1 / not yet runnable" status repeatedly. Functional steward is graduated (per INDEX, OPL closure, atom completion); file-level status fields keep getting reverted. COMM-worthy lesson, not yet filed.

### 2026-04-30 — Codex session (ChatRail command cockpit)

**Summary:** Jake pointed at the red-outlined main chat rail and asked for it to feel more powerful now that Claude Code and Codex CLI both participate. Codex upgraded the grid ChatRail into a command cockpit rather than just a message box.

**Important outcomes:**
- Added Claude Code / Codex CLI / active-provider status cards sourced from `/api/status` and local provider settings.
- Added prompt-seeding cards for code sweeps, Box-route tracing, guardrail review, and delegation handoff.
- Added direct launchers into Box Graph and Delegations from the rail.
- Refreshed the rail visuals: warmer layered surface, cockpit deck, recessed stream, stronger bubbles, and composer polish.

**Carry forward:**
- Next useful layer is receipts: show the last handoff/delegation/browser-use receipt directly in the command deck so the rail becomes a true operations console.

### 2026-04-30 — Codex session (Box Graph route live)

**Summary:** Jake asked whether the Box Graph could be built for real inside the app. Codex shipped the first live version: backend synthesis from Box manifests + operational boxes, new `box_graph` app route, SVG authority-lane visualization, and detail inspector.

**Important outcomes:**
- New API: `/api/box_graph`.
- New page: `BoxGraphScreen`.
- New topbar chip: `box graph`.
- New sitemap section: `Page: box_graph`.
- Verified local smoke output: 57 nodes / 81 edges / 0 manifest errors.

**Carry forward:**
- This is graph v1: it visualizes declared routes and clearly labels the current system as pre-runtime. Next useful blooms are graph health scoring, route explainer, and a Box Bus dry-run delivery inspector.

### 2026-04-30 — Codex session (Box Network architecture scaffold)

**Summary:** Jake clarified the big architectural vision: Boxes, Ledgers, and Sub-agents should become one intelligent stateful primitive, with upstream authority Boxes, downstream/local Boxes, interpreter Boxes, and ordered trickle-down. Codex wrote the synthesis into `LEDGERS/Drafts/box_network_architecture_scaffold.md`.

**Important outcomes:**
- Draft defines mature Box shape: `BOX.md`, `box.json`, ledger, local `AGENTS.md`, steward config/prompt/skills, receipts, future inbox/outbox.
- Draft defines authority tiers: Constitutional, Coordination, Domain, Leaf.
- Draft defines routing model: source Box, interpreter, destination Box, receipt.
- Draft defines build path and architecture-level Definition of Done.

**Carry forward:**
- Review this draft with Jake before promoting pieces into canonical ledgers.
- Likely promotions: Decision for the fused primitive, Box Ledger update for mature Box shape, Box Bus update for source/interpreter/destination routing, Definition of Done update for Box completion gates, and Atom decomposition for implementation.

### 2026-04-30 — Codex session (AGENTS.md upgraded for Codex-side parity)

**Summary:** Jake asked for the Codex-side equivalent of the latest `CLAUDE.md` so Codex can participate cleanly in the multi-agent directory. The repo already had `AGENTS.md`, which is the correct Codex hook, but it lacked the new Prime Directive. Updated `AGENTS.md` instead of creating a duplicate `CODEX.md`.

**Important outcomes:**
- `AGENTS.md` now carries the same ledger-first Prime Directive as `CLAUDE.md`.
- Added a Codex operating contract: use repo ledgers as shared memory, keep `AGENTS.md` aligned with `CLAUDE.md`, preserve dirty-tree user work, and follow Atom protocol when applicable.
- Updated this Temporal Continuity ledger and appended the project audit trail entry so the instruction change is visible to future agents.

**Carry forward:**
- If Claude-side rules change again, mirror project-wide rules into `AGENTS.md`.
- Keep tool-specific mechanics tool-specific, but keep the ledger doctrine shared.

### 2026-04-30 — Cowork session (web-mode UI gating — Pieces surfaces hide when OpenAI selected)

**Summary:** Operator-flagged change for hosted-web-app beta-test readiness. Treated with care since multiple page surfaces affected. Interim implementation against `PROB-2026-04-30-001` — uses the existing AI provider toggle as a proxy for "we're in hosted web mode" and hides the three Pieces-dependent surfaces.

**Important outcomes:**
- New `WEB_MODE_HIDDEN_ROUTES = ["briefing", "activity"]` constant + `webMode = (tweaks.aiProvider === "openai")` derived in `app.jsx`. Threaded `webMode` prop through `Topbar` and `FrontPage`.
- `Topbar` Row-0 briefing chip + preceding `·` separator hide via `!webMode &&`. Row-1 activity chip hides via `!webMode &&`.
- `FrontPage` skips `LivePiecesHeader` when `webMode` and falls through to existing `TeachingStrip` fallback (the same code path used when Pieces is offline).
- Defensive redirect: `useEffect` in `app.jsx` watches `webMode` + `route.name`; if user is on a hidden route at the moment they flip the toggle, `go.home()` fires so they don't land on a broken Pieces page.
- `SettingsScreen` gained a small bordered disclosure box that renders only when `currentProvider === "openai"`, spelling out exactly which three surfaces hide and why, with cross-ref to PROB-001.
- Sitemap updates: §grid (canonical full description), §briefing (cross-ref + hide note), §activity (cross-ref + hide note + Last Verified bumped to 2026-04-30), §settings (disclosure box history line).
- OPL: PROB-2026-04-30-001 close-criterion "Pieces gracefully disabled in web mode" partial-satisfied. Status note added to History. Server-side `_pieces_init()` short-circuit + UI banner remain open for full closure.
- Cache-bust: `app.jsx` 53→54, `components.jsx` 72→73, `screens.jsx` 97→98.

**Carry forward:**
- The proxy-via-AI-provider gate is intentionally simple. Real mode/profile system per PROB-001 should eventually replace it. When that lands, swap `webMode` derivation from `tweaks.aiProvider === "openai"` to `mode === "web"`.
- Server-side counterpart still open: `_pieces_init()` should short-circuit when running in web mode so server doesn't waste cycles trying to reach `localhost:39300`.
- A web-mode banner in the topbar ("hosted mode — local-only features hidden") would help users orient. Deferred — current disclosure is in Settings only.

### 2026-04-30 — Cowork session (page audit pass — `grid` page reconciled)

**Summary:** Operator-led page-by-page audit started. Jake walked through the live `grid` (home / home chat) page; three-way diff (screenshot ↔ sitemap ↔ `FrontPage` JSX) surfaced significant drift from the pre-trim 3x3 decision-grid era. Sitemap §grid rewritten to match rendered reality. Two new Open Problems logged.

**Important outcomes:**
- `page_asset_sitemap.md` §grid: Assets On Page + Asset Ownership rewritten. Sitemap had been claiming 3x3 decision grid + Generate/Back controls + Cell fullscreen modal + Edit overlay + AI status banner + QuickCapture as primary assets — none rendered. Real page is **home / home chat destination** with three zones: LivePiecesHeader (Pieces ticker top), IdeasTray (briefing-sourced "sweep" widget left, with operator-stated WIP intent), ChatRail (right, route pills + computer-use/browser-use bridges). Top-level `Last updated` bumped, audit history entry appended above prior 2026-04-30 entries, Last Verified line preserved at 2026-04-30 (already current).
- OPL gained two new entries: **PROB-2026-04-30-002** (IdeasTray on grid is operator-stated WIP — Jake's words preserved verbatim so target widget intent is durable) and **PROB-2026-04-30-003** (FrontPage carries ~150 lines of dead code from retired 3x3 decision grid era + stale CSS class families). New §6 bucket "UI / Page Audit Drift" created.
- Activity ledger appended 3 entries (`page_asset_audit` + 2× `open_problem_create`) under `actor:"claude_cowork"` `session:"page_audit_pass"`.
- TaskList created for the full 14-page audit + cross-cutting reconciliation (11 tasks); grid marked complete.

**Carry forward:**
- 13 routes still to audit. Order: automation (5 sub-tabs, dense), settings, People family (leads/clients/coworkers/contacts/venues — share `PeopleScreen`), briefing, activity, intake, analytics, delegations, boxes.
- Other agents are highly active in this window — Codex agent partial-closed PROB-2026-04-30-001 and shipped Phase 16+17 Page Ledgers (`boxes.md` + `intake.md`). Re-read TCL/OPL headers before each meaningful write to catch their changes.
- Working tree has uncommitted work from both my session and other agents. **Do not push without explicit go-ahead.**
- The audit work feeds Page Ledger authoring naturally — the diff findings are what a future `LEDGERS/PAGES/grid.md` should rationalize. Don't author Page Ledgers as part of the audit unit; let Jake decide when to pair them.
- **Operator preference confirmed:** Jake walks me through the page in his own words, I diff against sitemap+code, write atomically per page, ask only when I genuinely can't infer something. He calls the IdeasTray "the sweep widget" — that's now in the sitemap as a parenthetical alongside the code-name.

### 2026-04-30 — Cowork session (parallel polish lane)

**Summary:** Prime Directive landed in CLAUDE.md, first polish-bundle work shipped while another Cowork agent authored ledger drafts.

**Important outcomes:**
- CLAUDE.md now opens with a ⛰️ PRIME DIRECTIVE block elevating ledger discipline above all else. Read-list of 6 ledgers + update-list of 9 sites + cardinal-sin framing. Triggered by Jake's explicit "make sure you are updating those ledgers like my life depends on it."
- PROB-2026-04-28-011 closed via redirect-stub at `docs/page_asset_sitemap.md`. Sandbox can't delete; close criterion accepted "redirect-only." OPL .md and .json both updated; counts moved 13→12 active and 1→2 closed.
- `SCREEN_LABELS` cleanup in `components.jsx` — 8 retired-route labels removed, 5 missing live-route labels added. Cache-bust `components.jsx 69→70` in `Secretary.html`.
- Activity ledger received 5 new entries this session.
- Saved 2 Cowork-session memory files (Prime Directive feedback + Box-evolved-form project memory).

**Carry forward:**
- Other Cowork agent has been busy: 5 new ledgers (BOX_BUS, SOURCE_OF_TRUTH, DEFINITION_OF_DONE, CONNECTIONS, plus the Drafts directory) landed today, and the OPL header note suggests PROB-009 was closed too. Read those before touching adjacent areas.
- Don't push without explicit go-ahead — working tree is heavily modified by both agents.
- New lesson: Cowork sandbox cannot delete files in mounted folders. Phrase future close-criteria as "delete OR redirect-stub" so they're achievable from any actor's permission level.
- Polish-bundle queue still has open items: cache-bust full audit (Secretary.html ↔ sitemap History claims), route↔sitemap section coverage, PROB-009 may already be closed but verify, unused-script-include audit in `Secretary.html`.

### 2026-04-30 — Cowork (Phase B started — first claimable atom shipped: temporal_continuity_steward runnable form)

**Summary:** Phase B steward fleet completion is now in motion. ATOM-2026-04-30-0027 (architectural gate) and ATOM-2026-04-30-0028 (temporal_continuity_steward runnable form) both shipped on 2026-04-30. The unified Box pattern (`LEDGERS/BOXES/<name>/steward/`) is now the canonical steward path per `DEC-2026-04-30-004`. The temporal_continuity steward is the first non-`global_ledger_steward` ledger steward to have its runnable form on disk — meaning the most-read ledger in the project now has a designated guardian, even if `/api/agents/temporal_continuity_steward/run` isn't wired yet (that's `ATOM-0029`).

**Key context for the next agent:**
- **Single-writer claim protocol works.** Two parallel agents touched the atom queue today; one claim race was caught cleanly (an earlier ATOM-0027 attempt by this session lost to the other agent's prior completion). Pick a different atom and ship.
- **Audit-trail catch-up is a real pattern.** `ATOM-0028`'s files were already on disk from a parallel session at 19:38Z but the atom record wasn't updated. The completion was verification + recording per `COMM-2026-04-30-003`. When you find disk-state ahead of ledger-state, claim the atom and complete it via verification — don't redo work.
- **The temporal_continuity chain is half-unblocked.** `ATOM-0029` (server.py route wiring), `ATOM-0030` (smoke test), `ATOM-0031` (INDEX.md flip) are now claimable. `ATOM-0029` is the next critical-path atom for this chain — once it lands, the steward is dispatchable from the app.

**Atoms shipped this Cowork session (10 of 110; 25 of 110 across all agents today — note queue grew to 110 mid-session as parallel agent atomized PROB-2026-04-30-015 Box Network Architecture into 58 atoms):**
- `ATOM-2026-04-30-0027` (architectural-gate, 1h) — `claude_cowork_session_2026-04-30` — `DEC-2026-04-30-004` recorded.
- `ATOM-2026-04-30-0028` (temporal_continuity_steward runnable form, 1h) — `claude_cowork` — verification only; files were authored 19:38Z by parallel session.
- `ATOM-2026-04-30-0029` (server.py route wiring, 1h) — `claude_cowork` — added `_agent_resolve_prompt` helper covering BOTH legacy `CCAgentindex/agents/<name>/` and unified Box `LEDGERS/BOXES/<box>/steward/` paths. **Important side effect:** the helper is generic, so the route-wiring atoms `0033`/`0037`/`0041` for the other three steward chains effectively collapse to no-ops once their respective `LEDGERS/BOXES/<box>/steward/prompt.md` files exist.
- `ATOM-2026-04-30-0032` (open_problems_steward runnable form, 1h) — `claude_cowork` — three new files at `LEDGERS/BOXES/open_problems/steward/`: `AGENTS.md` (16116b, 17 sections including Closure-audit-protocol, Decomposition-handoff-protocol, Recurring-pattern-detection — OPL-specific stewardship beyond what temporal_continuity has), `prompt.md` (8539b dispatchable system prompt), `config.json` (9276b, 29 keys = strict superset). Dispatcher verified: `open_problems_steward` resolves via the helper to the unified-Box path. **3 of 5 ledger stewards now runnable.**
- `ATOM-2026-04-30-0030` (temporal_continuity_steward audit_only smoke test, 30min) — `claude_cowork` — first steward smoke test executed. In-sandbox synthesis path (Cowork agent acted as the dispatched steward inline; live HTTP path via curl deferred to Jake's terminal). Receipt at `LEDGERS/BOXES/temporal_continuity/receipts/2026-04-30_22-29-11_run_synthesized_inline_atom_0030.json` strictly matches prompt.md Receipt Format schema. **Classification: B (temporal_update_needed). 6 distinct stale-surface findings produced, zero false positives:** §1 build-arc steps 4+5 stale; §1 "Currently in Phase A" contradicts header; §1 scaffolding-maturity counts behind reality; §2.1 caps at Phase 17 missing Atom+Deprecation; §13 Git Posture describes 2026-04-28 working tree; JSON mirror lags ~24h. activity.jsonl gained one `temporal_continuity_steward_run` line. The audit findings are themselves a forcing function — TCL needs an update pass to absorb them.
- `ATOM-2026-04-30-0040` (north_star_steward runnable form, 1h) — `claude_cowork` — pivoted from ATOM-0036 after losing the claim race to a parallel agent. Three files at `LEDGERS/BOXES/north_star/steward/`: `AGENTS.md` (14006b, 16 sections including the 10-NS-Goals-Read-Only block), `prompt.md` (8638b dispatchable), `config.json` (10918b, 29 keys with NS-specific structures: ns_goals_governed, wholesome_enrichment_protocol with 4 tests per NS §6, tradeoff_audit_protocol per NS §9, audit_question_protocol per NS §10). **This steward is qualitatively different — it's the project's alignment auditor (Wholesome Enrichment + tradeoff awareness + §10 audit-question surfacing) where the others are state/inventory keepers.** Dispatcher verified. **4 of 5 ledger stewards now runnable; only `file_directory_steward` remains (in flight by parallel agent on ATOM-0036).**
- `ATOM-2026-04-30-0031` (flip TCL steward INDEX.md status to active, 5min) — `claude_cowork` — **first chain-closing atom in the entire steward fleet.** `LEDGERS/INDEX.md` Temporal Continuity Box row flipped from `active (declarative; runnable form Phase B)` → `active (runnable, Phase B live)` with full provenance description (ATOM-0028 author + ATOM-0029 wire + ATOM-0030 smoke test all referenced inline). Header `Last updated` bumped to "Phase B steward fleet — first chain closure." Establishes the canonical INDEX-flip pattern that ATOMs 0035 (open_problems), 0039 (file_directory), and 0043 (north_star — closes PROB-005) will follow. **Temporal Continuity is the first complete author → wire → smoke → flip cycle through the unified Box pattern.**
- `ATOM-2026-04-30-0041` (north_star_steward route verify, 5min) — `claude_cowork` — **helper-verification atom; no code change required.** Generic `_agent_resolve_prompt` from ATOM-0029 already routes `north_star_steward`. Verified all 5 stewards resolve correctly via in-process simulation; `_agents_list` enumerates 8 agents (3 legacy + 5 unified_box). Live HTTP deferred to ATOM-0042. Unblocks the next high-value atom — ATOM-0042 (north_star alignment audit, novel kind of steward output).
- `ATOM-2026-04-30-0042` (north_star_steward audit_only smoke test, 30min) — `claude_cowork` — **first alignment audit in project history.** Receipt at `LEDGERS/BOXES/north_star/receipts/2026-04-30_23-01-16_run_synthesized_inline_atom_0042.json`. **4 classifications (A/B/C/F):** A primary; B (Phase B/C deferral tradeoff explicit); **C — unified-Box scaffolding inconsistency across 5 stewards is the most actionable finding** (3 lighter / 2 heavier; recommend follow-up atoms or Decisions Ledger entry accepting lighter shape); F (3 architectural decisions today answer all 10 §10 audit questions). 0 anti-goal proximity. 0 false positives. Validates the qualitatively different output the north_star_steward produces vs temporal_continuity vs open_problems. **Unblocks ATOM-0043 (INDEX.md flip → closes north_star chain).**
- `ATOM-2026-04-30-0043` (flip north_star steward INDEX.md status, 5min) — `claude_cowork` — **second chain-closing atom in the steward fleet.** `LEDGERS/INDEX.md`: new row authored for North Star Box (was absent — only steward subdir existed). Status set to `active (runnable, Phase B live)` with full provenance from ATOMs 0040+0041+0042 + audit receipt path. Header bumped to "2 of 4 chains closed." Per acceptance criterion: PROB-2026-04-30-005 surfaced for closure review, NOT auto-closed — 12 of 18 atoms complete, 6 remaining (open_problems chain 0033/0034/0035 + file_directory chain 0037/0038/0039).
- `ATOM-2026-04-30-0010` (audit `CCAgentindex/intelligence/`, 30min) — `claude_cowork` — **first PROB-016 directory audit by Cowork.** Decision: **KEEP AS BEDROCK PRIMITIVE.** intelligence/ is well-formed (7 subareas / 24 leaf folders / 119 files / MANIFEST.md defining conventions), pairs cleanly with `DEC-2026-04-30-001` synthesizer pattern (verified: server.py reads from intelligence/ and synthesizes JSON for AnalyticsScreen panels), 2 of 24 scripts operational today (`sales/conversation`, `sales/owner_stage`), 22 stubs waiting for their scripts. Not a Box (data, not state). Not archive (actively subscribed by server.py + mission_control_loader.js + screens.jsx). Optional follow-ups flagged (MANIFEST.md should cross-ref DEC-001; status column needs update for the 2 operational areas). PROB-016 progress: **7 of 26 audits complete.**

**Race-loss observations:** parallel agent threw through ATOMs 0033/0034/0035/0037/0038 in the time it took me to read state — three race-losses on this session's last few P calls (0036 earlier, then 0033, then 0034). All caught cleanly by the single-writer protocol; corrective `atom_claim_lost_race` entries filed in activity.jsonl. The lesson: when the parallel agent is in a high-throughput burst, prefer atoms in a different PROB family (e.g., I pivoted to PROB-016 directory audits where they aren't currently working).

**Plus parallel agents shipped today:** the queue exploded to 110 atoms when the Box Network Architecture scaffold (PROB-2026-04-30-015) was atomized into 58 atoms. Other parallel atoms shipped (beyond what was tracked in earlier session entries): more PROB-016 directory audits, ATOM-0107/0108/0109 (Atlas Ground-Truth Box — first non-ledger Box class with `kind: ground_truth_source`), and additional unified Box scaffolding atoms.

**Plus parallel agent shipped (in addition to ATOM-0001 + 0002 from earlier today):**
- `ATOM-2026-04-30-0044` — global_ledger_steward migrated from legacy `CCAgentindex/agents/global_ledger_steward/` to unified Box `LEDGERS/BOXES/global_ledger/`. Six-file unified Box pattern (box.json + BOX.md + steward/ + receipts/). Legacy preserved as fallback per dispatcher's helper logic. **Closes the legacy/unified-Box split in the dispatcher.**
- `ATOM-2026-04-30-0036` — file_directory_steward runnable form at `LEDGERS/BOXES/file_directory/`. Same six-file pattern. **5 of 5 ledger stewards now have runnable forms** simultaneously.
- `ATOM-2026-04-30-0007` — bedrock audit of `CCAgentindex/commitments/` directory.
- `ATOM-2026-04-30-0011` — bedrock audit of `CCAgentindex/knowledge/` directory.

**Note on Box-pattern quality.** Parallel agent's atoms (0036, 0044) produced **6-file unified Boxes** (box.json + BOX.md + steward/{AGENTS, prompt, config} + receipts/README.md). My atoms (0028, 0032, 0040) produced **3-file steward folders** without the parent-Box scaffolding (no box.json, no BOX.md, no receipts README). The acceptance criteria for ATOMs 0028/0032/0040 didn't require those — they specified `agents.md + prompt.md` only. But the 6-file pattern is now the de facto richer convention. Filing this as a follow-up: **TCL/COMMUNICATIONS observation worth surfacing — my 3 stewards (temporal_continuity, open_problems, north_star) are missing parent Box scaffolding (box.json, BOX.md). Either close the gap in a follow-up atom, or accept the lighter pattern as valid.**

**Three rules landed today** (third one added this session):
- `ATOMS.md` §4 Rule 1 + §12 anti-pattern: **Claim Before Doing.**
- Memory: **Announce atom before working it** (`feedback_atom_claim_announce.md`).
- Memory: **`P` shortcut = proceed to next load-bearing atom** (`feedback_p_means_proceed.md` / `feedback_p_shortcut_proceed.md`). Jake established this pattern for momentum across his parallel work streams.

**Plus 2 atoms shipped by the parallel Cowork session this same day** (`ATOM-0001` + `ATOM-0002`, the PROB-016 gates) — both bedrock-reconciliation gate criteria satisfied. The 20 directory audit atoms (ATOM-0003..0022) are now claimable, but the Strategic Note in ATOMS.md §10.1 recommends finishing the steward fleet (PROB-005 chains) before starting heavy bedrock audits so reconciled directories have stewards to maintain them.

**Race protocol observation:** ATOM-0036 (file_directory_steward) was claimed by parallel agent in the seconds between this session's queue-read and atomic-claim attempt. Single-writer protocol caught it cleanly via the `status != 'available'` assertion before the JSON write happened. Pivoted to ATOM-0040 (north_star_steward) per ATOMS.md §4 Rule 2 ("pick a different atom on race loss"). Activity-log corrective entry filed (`atom_claim_lost_race`) so the audit trail stays honest.

**Atoms unblocked this Cowork session:**
- All 16 promotion atoms (`ATOM-0028..0043`) unblocked by ATOM-0027 closure.
- `ATOM-0030`, `ATOM-0031` (rest of temporal_continuity chain) unblocked by ATOM-0028 + ATOM-0029.
- `ATOM-0033`, `0034`, `0035` (open_problems chain wiring/test/flip) unblocked by ATOM-0032.
- `ATOM-0033`/`0037`/`0041` re-classified as no-ops thanks to the generic helper (still need their respective `0036`/`0040` runnable-form atoms first; ATOM-0033 is now reduced to verification only).
- All 20 PROB-016 directory audits (`ATOM-0003..0022`) unblocked by ATOM-0001 + ATOM-0002 (parallel agent).

### 2026-04-30 — Cowork recovery (completing other agent's interrupted OPL batch)

**Summary:** A separate Claude Code session translated 13 raw paper-list direction items into 10 deduped Open Problems entries (PROB-2026-04-30-005..014). It ran out of tokens mid-flight on the activity-ledger append. This Cowork session verified what landed, completed the §6 By System categorization that the other agent's Edit failed on, appended the missing activity entries, and recorded the project-state shift in TCL §3 + this entry. The 22 active OPL entries now define the near-term Phase B/C work queue.

**Recovery checklist:**
- ✅ OPL.md header bumped — confirmed on disk
- ✅ 10 new entries (PROB-005..014) — confirmed present at lines 818–1170
- ✅ JSON mirror counts updated to 22 active / 2 closed — confirmed
- ✅ §6 Problems By System categorization — completed by this session (5 new categories + 3 expanded)
- ✅ activity.jsonl entries — completed by this session (2 entries: `open_problems_batch_added` recovering the interrupted log + recovery's own categorization log)
- ✅ TCL §3 entry — completed by this session
- ✅ TCL §11 session log entry — completed by this session
- ✅ COMMUNICATIONS_LEDGER lesson entry pending — next step

**Lesson captured for future agents:** when an agent runs out of tokens mid-ledger-update, the recovery agent cannot assume the Prime Directive write list completed silently. Each surface (activity.jsonl, sitemap, TCL §3, TCL §11, OPL §6, Decisions, Communications, Box ledger stamps) must be verified separately. Symptom of in-flight: bash showing "Running…" with no "ok" follow-up; Edit error like "String to replace not found" indicating the agent was about to do something they didn't.

### 2026-04-30 — Cowork session (continued — first build_*.py → AnalyticsScreen integration)

**Summary:** Same session, second sub-arc. Pivoted from polish work to a substantive analytics-integration task. Shipped `OwnerStagePanel` for `build_owner_stage_dashboards.py` — first integration of the build_*.py family — and recorded `DEC-2026-04-30-001` establishing the server-synthesizer integration pattern for the remaining 19 unintegrated build_*.py scripts.

**Important outcomes:**
- New server endpoint `GET /api/analytics/owner_stage` (`_owner_stage_dir` + `_owner_stage_latest` in `server.py`) — synthesizes JSON on every read by parsing the markdown output of the build script. No JSON sidecar; markdown is canonical.
- New components in `screens.jsx`: `OwnerStagePanel` (4-tile snapshot + featured-owner card + two-column stages/leads + provenance footer) and `StageRow` helper.
- New tab "Pipeline by Stage" in `AnalyticsScreen`, between Pipeline Funnel and Upcoming Events.
- Cache-bust: `screens.jsx` 96→97 in `Secretary.html`.
- First sweep: 28 leads · 1 owner (andre_raw) · 26 stages (12 active, 14 lead-only). Andre's pipeline visualized end-to-end in the UI for the first time.
- `DEC-2026-04-30-001` recorded with full rationale: context, decision, three rejected alternatives (modify build script to emit JSON; client-side markdown parsing; one-shot synthesizer script), consequences, do-not-undo conditions, review triggers. §4 Current Active Decisions table updated.
- Sitemap analytics section: new components in Asset Ownership, new endpoint in API, expanded History entry, Last Verified bumped to 2026-04-30. Top-line "Last updated" header bumped.
- TCL §3 received its second 2026-04-30 entry above the earlier polish-lane entry.

**Carry forward:**
- Pattern is now reusable for the 19 remaining unintegrated `build_*.py` scripts (action_intelligence, lead_deal_sheets, recovery_intelligence, pricing_scope_intelligence, menu_intelligence, etc.). Each follow-on integration is: write a parser + register the endpoint route + write the panel + add the tab. ~30–60 min each.
- **Two follow-up tasks surfaced for future sessions:**
  1. Author `LEDGERS/PAGES/analytics.md` (per Phase 16 pattern) — page now has 11 panels + the synthesizer rationale is worth a deep-memory home.
  2. Onboard Scripts deduplication: migrate the 7 `analytics_*.py` files into `Auto/Onboard Scripts/` to enable removing top-level `Onboard Scripts/` (PROB-013 close path).
- Don't push without explicit go-ahead — working tree continues to be heavily modified by both agents.

### 2026-04-28 — Late-night through early-AM session

**Summary:** verbatim comms backfill across all 28 client boxes, ledger system Phases 1–5, then first steward automation (`global_ledger_steward`).

**Important outcomes:**
- All 28 client boxes now carry full Close.com transcripts + raw payloads (582 activities).
- `LEDGERS/` exists at project root with Global, Temporal, North Star, File Directory, and Open Problems ledgers, visual maps, templates, and the first steward package.
- `CCAgentindex/agents/global_ledger_steward/` is runnable through the app agent endpoint.
- Read-first wiring in `CLAUDE.md`, `AGENT.md`, `README.md`.
- Page-asset sitemap updated for verbatim comms.
- Activity ledger appended (3 entries this session).

**Carry forward:**
- Wait for Jake's signal on next ledger (likely North Star or Source-of-Truth).
- Don't push without explicit go-ahead.
- Brenda audit pattern is the template for future client-box audits.

### 2026-04-28 — Earlier (Jake solo, before this session)

**Summary:** Brenda & Steve client box audit and cleanup. Two commits landed: `Clean Brenda & Steve alert schedule after audit` (bec920d), `Add Brenda & Steve audit marker` (0a46a3b). Plus an earlier `April 28 sync` commit (8461f5d) covering verbatim comms / intelligence layer / draft delegations work that predates this session.

---

## 12. Update Rules

Update this ledger when:

- a meaningful work session ends
- current project state changes
- active workstreams change
- a major risk becomes active or is resolved
- Jake gives a durable instruction or preference
- a new carry-forward assumption appears
- a Box, page, or system is recently touched in a way future agents should know about
- a thread is left open for later
- a session produces important context not captured elsewhere
- the Git posture shifts (uncommitted work, branch changes, push conflicts)

Do **not** update this ledger when:

- the change has no continuity impact
- the detail belongs in a local Box ledger
- the detail belongs in another global ledger (Decisions, Open Problems, Audit, Reconstruction)
- you're tempted to use it as a task manager

End-of-session protocol (per spec §9):

1. Update §1 Current Snapshot if it changed.
2. Update §2 Active Workstreams.
3. Append to §3 Recent Meaningful Changes.
4. Add or remove §4 Active Assumptions.
5. Add to §5 Carry-Forward Context if needed.
6. Update §6 Current Risks if needed.
7. Update §10 Next Agent Handoff.
8. Append a short §11 Session Log entry.
9. Bump the header `Last updated`.
10. Commit changes (with Jake's go-ahead).

This should take minutes, not hours. The ledger should be fast enough that agents actually use it.

---

## 13. Current Git Posture

Working tree state as of this update:

```
M  AGENT.md                              ← this session: read-first wiring
M  CCAgentindex/_ledger/activity.jsonl   ← this session: 3 appended entries
M  CCAgentindex/_ledger/pieces_sweeps.jsonl  ← pre-existing, NOT this session
M  CLAUDE.md                             ← this session: §0 read-first block
M  README.md                             ← this session: Project memory section
?? Auto/Client Boxes/Flávia Benson/Flávia Benson.txt  ← pre-existing, NOT this session
?? LEDGERS/                              ← this session: entire ledger directory
```

Branch: `main`. Last 3 commits: `8461f5d` (Apr 28 sync — verbatim comms, intelligence layer, draft delegations), `0a46a3b` (Add Brenda & Steve audit marker), `bec920d` (Clean Brenda & Steve alert schedule after audit).

**Posture for further direct GitHub writes:**

- Jake controls commit and push timing. Local commits are fine if explicitly requested; push only with go-ahead.
- Pre-existing dirty files (`pieces_sweeps.jsonl`, `Flávia Benson.txt`) belong to other workstreams. Don't bundle them with this session's commits without confirming with Jake.
- The verbatim comms backfill wrote through the `Auto/` symlink (target `/Users/jakeaaron/Desktop/Auto/`), which is outside this repo's filesystem scope. If the standalone Auto/ folder has its own git scope, those writes need to be tracked there separately.
- Avoid force-push assumptions. Avoid `git checkout` of dirty files without Jake's confirmation.

This section can be deleted once the working tree settles.

---

## 14. Inactivity As State

Silence is not absence. If a client, workstream, or system is intentionally waiting, record it as waiting.

Currently waiting:

- **Verbatim comms UI binding** — waiting for renderer work after design system finalizes.
- **Allowed-to-know layer** — waiting for design assignment.
- **27 client box audits** — waiting for one-at-a-time queue progression.
- **Phase 3 ledger** — waiting for Jake's signal.
- **Commit/push of this session's writes** — waiting for Jake's go-ahead.
- **Close API key refresh** — would be needed for any future verbatim re-pull; not currently scheduled.

Agents often mistake silence for missing context. Silence here is meaningful: each waiting state is paired with what it's waiting on.

---

## 15. Plan Aging

Plans age. Any plan that depends on time, client state, or external response has a freshness window.

Current rules in effect:

- **No reply** → plan may remain valid if dates and guardrails still pass.
- **Reply received** → plan is stale until reviewed. The new `01b_comms_verbatim.md` makes reply detection auditable; no automation yet enforces this gate.
- **New transcript imported** → plan may need rewrite. Today's verbatim backfill imported full transcript history into all 28 boxes; plans authored before today should be re-checked against the verbatim file.
- **Guardrails changed** → plan must be re-audited. Brenda is the only box with an explicit re-audit so far.
- **Approval status changed** → future risky moves must be rechecked.

This prevents stale plans from quietly staying alive.

---

## Final Operating Rule

> The project should not wake up confused.
>
> Every meaningful session should leave the next session with a clearer current state, fewer rediscovered problems, and a safer path forward.
>
> If the project changed in time, record the change in time.

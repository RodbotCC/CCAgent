# Temporal Continuity Ledger

Last updated: 2026-04-29 (Phase 14 — Asset/Widget Map landed; cross-page UI catalog)
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
- **14 active project ledgers** (Global, Temporal Continuity, North Star, File Directory, Open Problems, Communications, Decisions, Box Ledger, Definition of Done, Box Bus Ledger, Source-of-Truth, Connections, File Contents, **Asset/Widget Map** — Phase 14, all 2026-04-29) + 19 outline drafts at **`/Ledger Drafts/`**. **Read the matching `.txt` outline before authoring any new ledger.** Every new ledger must satisfy DoD §5.6 + envelope-aware. Source-of-Truth (P11) = first global-tier; Connections (P12) = first domain-tier; File Contents (P13) = first project-wide file inventory; Asset/Widget Map (P14) = first cross-cutting UI catalog. The "where do I start with this file?" gap is closed; the "if I change this widget, what breaks?" gap is closed.
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
Current step: Phase 14 — **Asset/Widget Map** landed. Cross-page widget catalog + API→page mapping + shared services + change-radius hints. Sits one altitude above the page-asset sitemap (sitemap remains canonical per-page truth).
Just completed (2026-04-29 sprint): Phases 6–14 in rapid succession — Communications (P6), Decisions (P7), Box Ledger (P8), DoD (P9), Box Bus (P10), Source-of-Truth (P11), Connections (P12), File Contents (P13), Asset/Widget Map (P14). **14 active ledgers total.** Architectural lock at DEC-2026-04-29-013 holds: every future ledger declares its tier; runtime stays deferred to Phase C. Four real envelope-aware precedents now exist: Source-of-Truth (global), Connections (domain), File Contents (global), Asset/Widget Map (domain).
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

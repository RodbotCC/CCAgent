# Open Problems Ledger

Last updated: 2026-04-30 (PROB-2026-04-30-001 — Pieces gracefully disabled close-criterion partial-satisfied via client-side surface gating: briefing/activity routes + LivePiecesHeader hide when AI provider is OpenAI, with redirect + Settings disclosure. Prior same-window: PROB-2026-04-30-005..014 added — 10 forward-looking direction items from operator's paper list)
Maintainer: Jake / Comeketo Agent project agents
Status: **active**
Read when: planning work, auditing changes, deciding what's safe to do, looking for what's blocking progress, finishing a session
Core rule: **If a problem is known but not fixed, record it.**

> A known problem that is not recorded becomes future confusion.
>
> This is not a shame file. It is a protection system. A project this complex will always have open problems. The danger is not having problems — the danger is losing track of them.

---

## 1. Purpose

This ledger tracks what is broken, incomplete, risky, blocked, partially fixed, unresolved, or worth revisiting later. It exists so that **known problems do not have to be rediscovered**.

A "problem" can be: a bug, a stale file, a risky plan, an unclear source of truth, a missing decision, a fragile workflow, an unsafe automation path, an unresolved design question, a partial implementation, an unverified dependency, a confusing directory, a local/GitHub drift issue, a repeated mistake, or a "we need to revisit this" note.

This ledger is paired with:

- **Communications Ledger** ([`COMMUNICATIONS_LEDGER.md`](COMMUNICATIONS_LEDGER.md)) — what should future agents hear?
- **Decisions Ledger** (planned) — what has been decided?
- **Audit Ledger** (planned) — what was reviewed and what did we find?
- **Definition of Done Ledger** (planned) — what counts as complete?

Important distinction:

| Form | Example |
|---|---|
| Communication | "Be careful — plans may predate guardrails." |
| **Open Problem** | "Audit all active Client Box plans for guardrail drift." |
| Decision | "Risky sales moves require isolated approval." |
| Audit | "Brenda & Steve plan had stale dates and ungated fee-waiver language." |

---

## 2. Problem Entry Format

Every problem uses a stable ID: `PROB-YYYY-MM-DD-###`.

Template (used in §5 below):

```
## PROB-YYYY-MM-DD-### — <Short Problem Title>

Status:        <see §3>
Severity:      <see §4>
Urgency:       <see §4>
Discovered:    YYYY-MM-DD
Discovered by: <agent | session | audit | name>
Affected systems:  <list>
Related files:     <list>
Related ledgers:   <list>
Owner:         <TBD | name>
Blocked by:    <ID | description | none>

### Problem
What is wrong, incomplete, risky, or unclear.

### Evidence
How we know this is a problem.

### Impact
What breaks or becomes risky if this remains open.

### Current Workaround
How to operate safely until fixed.

### Recommended Next Action
What should happen next.

### Close Criteria
What must be true before this problem can be closed.

### History
- YYYY-MM-DD — note
```

**Every problem must have close criteria.** Without close criteria, problems become vague anxiety.

---

## 3. Problem Status Labels

Use one:

- `open` — known and not fixed
- `triaged` — understood enough to prioritize
- `in-progress` — currently being worked
- `blocked` — cannot proceed until something happens
- `partial` — partially fixed but not closed
- `needs-decision` — requires a decision before work
- `needs-audit` — requires review/investigation
- `needs-verification` — likely fixed but not verified
- `closed` — fixed or no longer relevant
- `wont-fix` — acknowledged and intentionally not fixed

Optional tags for filtering:

`safety`, `client-box`, `automation`, `UI`, `source-of-truth`, `git`, `connection`, `ledger`, `generated-state`, `enrichment`, `approval`, `documentation`, `cleanup`, `duplicate`, `directory`

---

## 4. Severity / Urgency Scale

Severity and urgency are **separate**.

### Severity

- `critical` — can cause customer-facing harm, data loss, unsafe sends, credential exposure, or broken core workflow
- `high` — can cause major confusion, stale state, wrong source-of-truth edits, or broken automation
- `medium` — important but bounded; workarounds exist
- `low` — cleanup, clarity, polish, or future improvement

### Urgency

- `now` — should be addressed before further related work
- `soon` — should be addressed in current phase
- `later` — important but not blocking current work
- `watch` — monitor; no immediate action

This prevents every problem from becoming equally loud.

---

## 5. Active Open Problems

### PROB-2026-04-28-001 — Allowed-To-Know Constraint Not Implemented

Status: **partial**
Severity: critical · Urgency: now
Discovered: 2026-04-28 · Discovered by: Jake + Brenda audit conversation
Affected systems: Client Boxes, inbox automation, scheduled fires, profile/enrichment, customer-facing copy
Related files: `Auto/Client Boxes/<Name>/01_comms.md`, `04_profile.md`, `05_seven_day_plan.md`, future per-Box `allowed_to_use.md`/`.json` (schema now defined in [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) §4.2)
Related ledgers: [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) §4 (schema lives here as of 2026-04-29 Phase 11), [`Decisions`](DECISIONS_LEDGER.md), North Star NS-04 + Wholesome Enrichment principle
Owner: TBD (implementation work — Phase B/C)
Blocked by: ~~schema/design decision~~ → **implementation** (schema now exists)
Tags: `client-box`, `enrichment`, `source-of-truth`, `safety`

**Problem.** The system does not yet have a formal layer that separates: facts the client actually shared / facts from transcripts/comms / enrichment-only internal strategy / protected/off-limits facts / unverified facts / approval-required facts and actions.

**Evidence.** Brenda & Steve highlighted the risk: enrichment-derived context was useful internally but could leak into customer-facing copy. Jake explicitly said the project needs a "what we're allowed to know" type of constraint. The Wholesome Enrichment principle (NS docs §6) names the four-bucket model but no schema or workflow implements it.

**Impact.** Without this layer, automation may surface creepy or unsupported personalization, misuse enrichment, or treat internal strategy as customer-facing truth. Violates NS-04 and the Wholesome Enrichment principle.

**Current workaround.** During Client Box audits, manually flatten outbound copy and only use facts traceable to comms/transcripts or explicit approval. Brenda's `05_seven_day_plan.md` carries this discipline now.

**2026-04-29 update — Phase 11 progress.** [`SOURCE_OF_TRUTH.md`](SOURCE_OF_TRUTH.md) §4 codified the four-bucket Allowed-To-Know schema (`comms_confirmed`, `internal_strategy`, `protected`, `approval_required`) and a per-Client-Box implementation contract (`allowed_to_use.md` + `allowed_to_use.json` shape). **Schema-design close-criterion satisfied.** Implementation criteria (1 Box uses it, scheduled-fire reads it, inbox guardrails reference it, mechanical enforcement) remain open and depend on Phase B/C work.

**Recommended next action.** Author `allowed_to_use.json` for one Client Box (Hugo Casillas is the natural test case — he has the most enrichment) using the schema in `SOURCE_OF_TRUTH.md` §4.2. Then wire one read-path (likely the Boxes UI dossier renderer or the inbox skill) to honor it. That closes a second criterion without requiring full Phase C runtime.

**Close criteria.**
- ✅ Schema exists (`SOURCE_OF_TRUTH.md` §4 — landed 2026-04-29).
- ⏳ At least one Client Box uses it.
- ⏳ Scheduled-fire / read protocol checks it before composing.
- ⏳ Inbox guardrails reference it.
- ⏳ Wholesome Enrichment principle in `NORTH_STAR.md` §6 is mechanically enforced (not just documented).

History:
- 2026-04-28 — created. Initial problem statement carried forward from Ledger 05 spec.
- 2026-04-29 — partial. Source-of-Truth Ledger §4 codified the four-bucket schema + per-Box implementation contract. Status `open` → `partial`. Blocker shifted from schema-design to implementation. PROB-001's first close-criterion now ✅.

---

### PROB-2026-04-28-002 — Active Client Boxes Need Guardrail Audit

Status: **in-progress**
Severity: high · Urgency: soon
Discovered: 2026-04-28 · Discovered by: Jake (Brenda audit pattern)
Affected systems: Client Boxes, scheduled fires, inbox guardrails
Related files: `Auto/Client Boxes/<Name>/05_seven_day_plan.md`, `09_andre_alerts.md`, `01_comms.md`, `client_ledger.md`, `YYYY-MM-DD_audit_marker.md`
Related ledgers: Audit (out-of-scope 2026-04-29 — see DEC-2026-04-29-004), Client Box ledgers
Owner: Jake + agent workflow (one box at a time)
Tags: `client-box`, `safety`, `automation`, `cleanup`

**Problem.** Active Client Box plans may have been written before current guardrails were fully enforced. They may contain stale dates, risky commitment language, enrichment leakage, or send assumptions that no longer pass safety rules.

**Evidence.** Brenda & Steve had stale weekday/date drift and ungated fee-waiver/no-charge language. Plan was audit-cleaned 2026-04-28 01:40 AM ET (commits `bec920d`, `0a46a3b`); marker at `Auto/Client Boxes/Brenda & Steve/2026-04-28_audit_marker.md`. The other 27 boxes have not been re-validated against guardrails.

**Impact.** Future scheduled fires could surface or send unsafe copy if plans are trusted blindly. Violates NS-05 (Safe Movement) and operates against the plan-subordinate-to-comms rule.

**Current workaround.** Audit one Client Box at a time. Clean plan/alerts if approved. Leave audit marker. The 2026-04-28 verbatim comms backfill (PROB-005 partial fix) makes auditing easier — every plan can be re-validated against full transcripts.

**Recommended next action.** Continue with remaining active boxes in priority order (per Jake's earlier list): Hugo Casillas, Daphney & Frankie, Dawn M Denton, Eliana Lopes, Elizabeth & Peter, Emanuella Andrade, Esther Manu, Flávia Benson, Flaviane Mesquita, then the rest of the 28.

**Close criteria.**
- All 28 active Client Boxes have been audited.
- Each cleaned plan carries `Audit-cleaned: <date>` line.
- Each box has a `YYYY-MM-DD_audit_marker.md`.
- Audit findings logged in Audit Ledger (when it exists) with North Star alignment block.

History:
- 2026-04-28 — created. Brenda completed (1/28). 27 remaining.

---

### PROB-2026-04-28-003 — Approval Flow Does Not Yet Isolate Risky Moves

Status: **open**
Severity: critical · Urgency: soon
Discovered: 2026-04-28 · Discovered by: Brenda fee-waiver retrospective
Affected systems: approval surfaces, inbox automation, scheduled fires, automation page, Delegations/Boxes review surfaces
Related files: `automation.jsx`, `Auto/comeketo-inbox/`, future approval-card components
Related ledgers: Decisions (planned — DEC for risky moves require isolated approval), North Star NS-05
Owner: TBD
Tags: `approval`, `safety`, `automation`, `UI`

**Problem.** Risky moves can be approved as part of a batch without enough explicit friction. The system needs a clear approval-card pattern for financial, pricing, scope, enrichment, or high-risk personalization moves.

**Evidence.** The Brenda & Steve fee-waiver move was technically approved by Jake, but Jake was approving many clients quickly while rushed. NS-05 explicitly names this as the operative tension: "smart enough to suggest bold moves, but not autonomous enough to hide risky commitments inside batch approval."

**Impact.** The system can make strategically plausible but authority-sensitive moves without the human fully noticing the risk. Violates NS-05 directly and threatens the "automation that feels human, not robotic" goal (NS-04).

**Current workaround.** During plan cleanup, flatten risky future moves or mark them approval-required. Brenda's plan now opens with a Safety Status block requiring guardrails before every outbound.

**Recommended next action.** Design explicit risk approval cards with required confirmations such as: `APPROVE FEE WAIVER`, `APPROVE ENRICHMENT USE`, `APPROVE PRICE COMMITMENT`, `APPROVE SCOPE PROMISE`. Risk-card UI should not be batchable — each card requires explicit confirmation.

**Close criteria.**
- Approval-card standard exists (component + UX spec).
- Risk categories defined (fee waiver, discount, scope promise, pricing claim, enrichment-based personalization, etc.).
- Approval is logged to `CCAgentindex/_ledger/activity.jsonl`.
- Scheduled fires check approval before risky sends.
- Categories mapped to NS-05 risk taxonomy.

History:
- 2026-04-28 — created.

---

### PROB-2026-04-28-004 — GitHub Direct Writes Can Conflict With Local Unpushed Work

Status: **open**
Severity: medium · Urgency: soon
Discovered: 2026-04-28 · Discovered by: Brenda cleanup commit retrospective
Affected systems: GitHub workflow, agent writes, Jake's local repo
Related ledgers: Connections (planned), [`Communications`](COMMUNICATIONS_LEDGER.md), [`Decisions`](DECISIONS_LEDGER.md)
Owner: TBD
Tags: `git`, `workflow`, `agent-handoff`

**Problem.** Agents may write directly to GitHub while Jake has local unpushed work.

**Evidence.** After Brenda & Steve cleanup commits (`bec920d`, `0a46a3b`), Jake realized local work was not yet pushed. As of 2026-04-28 the working tree is dirty (M `AGENT.md`, `CLAUDE.md`, `README.md`, `activity.jsonl`, `pieces_sweeps.jsonl`; ?? `LEDGERS/`, `Auto/Client Boxes/Flávia Benson/Flávia Benson.txt`). This session's writes are uncommitted; coordinate before push.

**Impact.** Merge conflicts, rebase confusion, or accidental overwrites if branch workflow is unclear. Violates NS-09 (Agent Handoff Continuity).

**Current workaround.** This session's pattern: write locally, ledger-log, surface in summary, wait for Jake's go-ahead before commit/push. Documented in `TEMPORAL_CONTINUITY.md` §13 Current Git Posture.

**Recommended next action.** Define standard branch workflow for agent writes:
- Direct-to-main only when Jake confirms local tree is clean.
- Otherwise agent writes to feature branch + PR.
- Always report commit SHAs in summary.
- Never force-push main.
- Coordinate before bundling pre-existing dirty files into a session commit.

**Close criteria.**
- Git workflow policy recorded in Decisions Ledger.
- Connections Ledger documents branch/push expectations for agent writes.
- Communications Ledger entry for "Jake controls commit/push timing."
- AGENT.md / CLAUDE.md updated to reference the policy.

History:
- 2026-04-28 — created.

---

### PROB-2026-04-28-005 — Full Phone Transcripts Not Yet Integrated Into Client Boxes

Status: **partial** (infrastructure landed; integration steps remain)
Severity: high → medium (downgraded after partial fix)
Urgency: soon
Discovered: 2026-04-28 (early) · Discovered by: Jake (recognized the gap during inbox conversation)
Affected systems: Client Boxes, allowed-to-know facts, plan rewrites, comms truth, Boxes UI page
Related files: `Auto/Client Boxes/<Name>/01b_comms_verbatim.md`, `comms/<type>_<date>_<id>.json`, `outputs/pull_full_comms.py`, server.py box endpoints
Related ledgers: Source-of-Truth (planned), Audit (out-of-scope 2026-04-29 — see DEC-2026-04-29-004)
Owner: Jake + agent
Tags: `client-box`, `comms`, `source-of-truth`

**Problem.** Client Boxes had only comms summaries; full phone transcripts and email bodies were missing. Plans and any allowed-to-use layer would be incomplete until full conversation history landed.

**Evidence.** Jake's 2026-04-28 message: "we have all this enrichment and information that we might not be supposed to be privy to yet that we're trying to help steer towards. We have no way of really knowing if André and the client have talked about it yet."

**Impact.** Plans and customer-facing copy may have over-relied on profile/enrichment because verbatim comms weren't in the box. Violates NS-04 (Human Automation grounded in actual comms) and NS-06 (Source-of-Truth Discipline).

**Current state (PARTIAL FIX as of 2026-04-28):**

What was fixed:
- 2026-04-28 verbatim comms backfill via `outputs/pull_full_comms.py` hit `api.close.com/api/v1` directly.
- All 28 Client Boxes now carry `01b_comms_verbatim.md` (chronological narrative w/ speaker-labeled call transcripts, voicemail transcripts, full email `body_text`/`body_html`, SMS, WhatsApp, threads).
- `comms/<type>_<YYYY-MM-DD>_<id>.json` raw payloads written, one per activity. **582 raw activity payloads total.**
- Source-of-truth priority order updated in `FILE_DIRECTORY_LEDGER.md` §4.3: verbatim is now highest-fidelity per-box truth, ahead of curated `01_comms.md`.

What remains open:
- Boxes UI page still binds to `01_comms.md` only (`server.py` line 4717). Verbatim file exists in every box but is not yet UI-bound.
- No automation (`comms_state_sweep.py`, scheduled fires) reads the verbatim file yet.
- Plan rewrite trigger after new transcript import is not formalized (overlaps PROB-006).
- Per-box `client_ledger.md` doesn't yet reflect that verbatim history is now available.

**Recommended next action.**
1. Wire `01b_comms_verbatim.md` into `BoxesScreen` (`screens.jsx`) as a second comms tab.
2. Update `Auto/orchestrator/bin/comms_state_sweep.py` to read verbatim file when present.
3. Define plan-staleness rule against verbatim file (couples with PROB-006).

**Close criteria.**
- ✅ Transcript location defined (`comms/`).
- ✅ At least one transcript imported (582 across 28 boxes).
- ⏳ Client Box read protocol updated in automation (not just docs).
- ⏳ Plan rewrite trigger defined when new transcript lands (PROB-006).
- ⏳ Boxes UI page surfaces verbatim file.

History:
- 2026-04-28 — created.
- 2026-04-28 — verbatim comms backfill landed (request_id `comms_verbatim_backfill_2026-04-28`). Status moved `open` → `partial`. Severity downgraded `high` → `medium` (the most dangerous gap is closed; remaining work is integration).

---

### PROB-2026-04-28-006 — Plan Rewrite Trigger After Inbound Needs Formalization

Status: **open**
Severity: high · Urgency: soon
Discovered: 2026-04-28 · Discovered by: spec author + plan-aging conversations
Affected systems: Client Boxes, `Auto/orchestrator/bin/comms_state_sweep.py`, scheduled fires, `client_ledger.md`
Related ledgers: Audit (out-of-scope 2026-04-29 — see DEC-2026-04-29-004), North Star NS-05 + plan-aging rules in `TEMPORAL_CONTINUITY.md` §15
Owner: TBD
Tags: `client-box`, `automation`, `safety`, `plan-aging`

**Problem.** The project agrees conceptually that any meaningful client tap/reply can invalidate the current seven-day plan, but the rewrite trigger and workflow are not formalized in code.

**Evidence.** Jake said any tap should trigger plan re-check. `TEMPORAL_CONTINUITY.md` §15 documents the plan-aging rules. `client_state_temporal.mmd` shows the desired flow. But no field/marker in the box mechanically tracks "plan is stale" status, and no scheduled fire pauses based on it.

**Impact.** Automation may continue from an old plan after the client's state has changed. Violates NS-05 (Safe Movement) and the "reply → plan stale" rule.

**Current workaround.** Manual audits and operator review during scheduled batch approval.

**Recommended next action.** Implement state transition in `comms_state_sweep.py`:

```
new_inbound_detected
→ active_cadence = paused
→ plan_status = stale
→ generate inbound summary
→ surface for plan rewrite
→ manual confirmation required before un-pausing
```

Add `plan_status` field to `client_ledger.md` or `00_meta.json`.

**Close criteria.**
- `plan_status` field or marker exists in box schema (sibling-schema check first per CLAUDE.md §3).
- `comms_state_sweep.py` can mark plan stale on new-inbound detection.
- Scheduled fire checks plan freshness before composing.
- Manual confirmation path exists in UI (likely automation page).
- Documented in Audit Ledger and Decisions Ledger.

History:
- 2026-04-28 — created.

---

### PROB-2026-04-28-007 — Historical Inbound Detection May Be Noisy

Status: **needs-audit**
Severity: medium · Urgency: soon
Discovered: 2026-04-28 · Discovered by: Brenda `client_ledger.md` review
Affected systems: `Auto/orchestrator/bin/comms_state_sweep.py`, `client_ledger.md`, reply gate, Client Boxes
Related ledgers: Audit (out-of-scope 2026-04-29 — see DEC-2026-04-29-004)
Owner: TBD
Tags: `client-box`, `automation`, `bug-suspected`

**Problem.** State sweep may mark "new inbound this cycle" when importing historical inbound activities, not necessarily fresh post-cadence replies.

**Evidence.** Brenda & Steve `client_ledger.md` showed "New inbound this cycle: True," but listed inbound items from April 19, before cadence start (cadence anchored to Day 1 = Monday 2026-04-27). The 2026-04-28 verbatim comms backfill imported additional historical SMS/email activities — possibly retriggered this flag in other boxes too (not yet verified).

**Impact.** False operator-review alerts; confused plan-pause logic; couples badly with PROB-006 (plan rewrite trigger) when it lands.

**Current workaround.** Check timestamps against `cadence_started_at` before treating inbound as fresh. Manual review.

**Recommended next action.**
1. Audit `Auto/orchestrator/bin/comms_state_sweep.py` inbound detection logic.
2. Compare against `cadence_started_at` or last-sweep timestamp.
3. Differentiate "newly imported historical activities" from "new post-cadence inbound."
4. Update `client_ledger.md` labels for clarity.

**Close criteria.**
- Sweep differentiates newly imported historical activities from new post-cadence inbound.
- Client ledger labels are clear (`new_post_cadence_inbound: bool` vs `imported_historical_activities: int`).
- Reply gate uses correct timestamp logic.
- Documented decision in Decisions Ledger.

History:
- 2026-04-28 — created.

---

### PROB-2026-04-28-009 — Optional Connections Need Verification

Status: **closed**
Severity: low · Urgency: later
Discovered: 2026-04-28 · Discovered by: Connections inventory exercise
**Closed: 2026-04-29** · Closed by: Phase 12 Connections Ledger landing
Affected systems: Connections Ledger (now active), Settings Ledger (planned), app runtime
Related files: `.env`, `connectors.js`, `docs/connectors.md`, `server.py` imports
Resolution: [`CONNECTIONS.md`](CONNECTIONS.md) §4 inventories every service with evidence-backed status (`active` / `optional` / `planned` / `not-in-use`). Supabase, Google Drive, and Anthropic API (direct) are explicitly marked `not-in-use` after grep evidence. Twilio (which the original draft missed) is registered as `active` with full WhatsApp + SMS credential map.
Tags: `connection`, `documentation`, `cleanup`

**Problem.** Some services are available as connectors or mentioned in environment context, but may not actually be active project dependencies. Supabase and other connectors may be available but actual repo usage needs inspection.

**Evidence.** `.env` lists various credentials; `connectors.js` and `docs/connectors.md` exist but haven't been audited against actual `import` statements / API calls.

**Impact.** Connections Ledger could hallucinate dependencies if not verified. Future agents may try to use a service that isn't actually wired.

**Current workaround.** Mark unverified services as `needs-verification` when listing.

**Recommended next action.** ~~Inspect repo imports~~ → done 2026-04-29 during Connections Ledger authoring.

**Close criteria.** ✅ Each optional service is marked `active`, `optional`, or `not-in-use` based on grep evidence (CONNECTIONS.md §4).

History:
- 2026-04-28 — created.
- 2026-04-29 — closed. Phase 12 Connections Ledger inventoried 11 active / 2 planned / 3 not-in-use services with grep-evidence for the not-in-use classifications. Single close-criterion fully satisfied.

---

### PROB-2026-04-28-010 — CLAUDE.md Surviving-Domains List Is Out of Date

Status: **needs-decision**
Severity: high · Urgency: soon
Discovered: 2026-04-28 · Discovered by: Phase 4 File Directory Ledger inspection
Affected systems: CLAUDE.md (project root), agent orientation, bedrock understanding
Related files: `CLAUDE.md` §1, `CCAgentindex/`
Related ledgers: File Directory Ledger §4.2, planned Source-of-Truth Ledger
Owner: Jake (decision required)
Tags: `documentation`, `ledger`, `bedrock`

**Problem.** `CLAUDE.md` §1 says CCAgentindex/ has 5 surviving domains: `people`, `venues`, `_ledger`, `_inbox`, `indexes`. Reality is **26 directories**: 10 are `.gitkeep` stubs (Rodbot, commitments, threads, projects, knowledge, tables, annotations, charts) and 16 are populated, including some heavyweights — `intelligence/` (119 files), `_inbox/` (77), `agent_plans/` (40), `people/` (39), `venues/` (30), `reports/` (28), `triggers/` (12).

**Evidence.** Direct `find CCAgentindex -mindepth 1 -maxdepth 1 -type d` inspection on 2026-04-28. Documented in `FILE_DIRECTORY_LEDGER.md` §4.2.

**Impact.** Future `claude -p` subprocesses spawned from `/api/delegate` read CLAUDE.md as authoritative. They will believe domains like `intelligence/`, `agent_plans/`, `triggers/`, `reports/` either don't exist or shouldn't be touched. Violates NS-09 (Agent Handoff) and NS-06 (Source-of-Truth).

**Current workaround.** This ledger and `FILE_DIRECTORY_LEDGER.md` document reality. Agents reading those files first will get accurate orientation.

**Recommended next action.** Decision needed from Jake on how to reconcile:

- Option A: Update CLAUDE.md §1 surviving-domains list to match reality.
- Option B: If some populated domains were unintentional and should actually be retired, retire them and update CLAUDE.md.
- Option C: Add a "post-trim additions" section to CLAUDE.md acknowledging the additions.

Most likely Option A — but this is a Jake decision because it affects every subprocess agent's mental model.

**Close criteria.**
- Decision recorded in Decisions Ledger.
- CLAUDE.md §1 surviving-domains list matches actual disk contents.
- File Directory Ledger §4.2 cross-references the updated CLAUDE.md.
- This problem moves to Recently Closed.

History:
- 2026-04-28 — created. Surfaced from `FILE_DIRECTORY_LEDGER.json.open_problems_to_log[].claude_md_domains_drift`.

---

### PROB-2026-04-28-011 — `docs/page_asset_sitemap.md` Is Stale  ⟶ **CLOSED 2026-04-30**

> Closed in place — full closure entry lives in §10 Recently Closed below. This stub stays so cross-references from other ledgers (File Directory Ledger §10, etc.) still resolve to a section.

---

### PROB-2026-04-28-012 — `Auto/Boxes/` Mirror Purpose Unclear

Status: **needs-verification**
Severity: medium · Urgency: soon
Discovered: 2026-04-28 · Discovered by: Phase 4 File Directory Ledger inspection
Affected systems: `Auto/Boxes/orchestrator/`, `Auto/Boxes/comeketo-inbox/`, agent navigation
Related files: `Auto/Boxes/`, `Auto/orchestrator/`, `Auto/comeketo-inbox/`
Related ledgers: File Directory Ledger §7
Owner: Jake (verification required)
Tags: `directory`, `duplicate`, `needs-verification`

**Problem.** `Auto/Boxes/` exists as a sibling to `Auto/orchestrator/` and `Auto/comeketo-inbox/`. It contains an apparent mirror of both: `Auto/Boxes/orchestrator/` and `Auto/Boxes/comeketo-inbox/` with newer mtimes (2026-04-27 16:23 vs 2026-04-26 02:42 for the originals). `_lib.py` content was byte-identical.

**Evidence.** Direct inspection. Marked `needs verification` in `FILE_DIRECTORY_LEDGER.md` §7.

**Impact.** An agent could edit the wrong copy. The newer mtime is misleading — content matched. Possibly a backup/snapshot from a refactor that wasn't followed up.

**Current workaround.** `FILE_DIRECTORY_LEDGER.md` §10 wrong-turn `auto_boxes_as_live` explicitly warns against editing here.

**Recommended next action.** Jake to clarify what `Auto/Boxes/` is for. If it's an abandoned snapshot, delete or archive. If it's intentional (e.g. a staging area), document it and rename to make purpose obvious.

**Close criteria.**
- Purpose documented OR directory removed.
- File Directory Ledger §7 status changed from `needs verification` to either `active` (with role) or removed.
- File Directory Ledger §10 wrong-turn updated accordingly.

History:
- 2026-04-28 — created.

---

### PROB-2026-04-28-013 — Two `Onboard Scripts/` Folders — Auto/ is Canonical, Top-Level is Legacy

Status: **triaged** (corrected understanding 2026-04-28; long-running migration in progress)
Severity: low · Urgency: watch
Discovered: 2026-04-28 · Discovered by: Phase 4 File Directory Ledger inspection (initial misread); corrected by Jake
Affected systems: `Auto/Onboard Scripts/` (24 files, **canonical / working**), `Onboard Scripts/` (root, 31 files, **legacy from old app, being slowly rewritten**)
Related files: 7 `analytics_*.py` files exist only in top-level — legacy versions being mined and gradually integrated into the analytics page
Related ledgers: File Directory Ledger §7, §10 (corrected)
Owner: Jake (informal — gradual migration as analytics work completes)
Tags: `cleanup`, `legacy`, `directory`, `analytics`

**Corrected understanding (2026-04-28).** Initial Phase 4 reading inverted this. **Top-level `Onboard Scripts/` is the legacy from a predecessor app**; the scripts are known to be bad. **`Auto/Onboard Scripts/` is the legitimate working set** translated/reworked from the legacy ones. The 7 `analytics_*.py` files at top-level are old versions being gradually mined and rewritten into the analytics page — not a "missing from Auto/" gap.

**Impact.** As long as agents understand the corrected ownership, low risk. The danger was the inverted assumption — fixed in this entry, in FDL §3/§4.1/§7/§10, and in `FILE_DIRECTORY_LEDGER.json`.

**Current workaround.** Treat `Auto/Onboard Scripts/` as canonical for any new work. Leave top-level `Onboard Scripts/` alone — it's the source pool being slowly translated. Don't delete; don't sync; don't assume parity.

**Recommended next action.** Continue the gradual rewrite as analytics page work needs each script. No immediate action required. When the analytics rewrite is complete and all needed scripts have been translated, top-level `Onboard Scripts/` can be archived.

**Close criteria.**
- All needed legacy scripts have been rewritten/translated into either `Auto/Onboard Scripts/` or the analytics page.
- Top-level `Onboard Scripts/` archived (or marked archive-only).
- File Directory Ledger updated.

History:
- 2026-04-28 — created with inverted assumption (top-level treated as canonical superset).
- 2026-04-28 — corrected by Jake: Auto/ is canonical/working; top-level is legacy being rewritten. Severity downgraded medium → low. Status: needs-decision → triaged. Urgency: later → watch.

---

### PROB-2026-04-28-016 — `CCAgentindex/` Bedrock Was Bootstrapped On The Fly — Needs Triad-Based Reconciliation

Status: **needs-decision** (deferred until ledger + sub-agent buildout settles)
Severity: high · Urgency: later
Discovered: 2026-04-28 · Discovered by: Jake (catch-up conversation, post-rebuild cleanup phase)
Affected systems: entire `CCAgentindex/` filesystem layout (32 subdirectories), `mission_control_loader.js`, `indexes/index.json`, all `/api/*` endpoints in `server.py` that read bedrock paths, every Box / Ledger / Sub-agent that has not yet been authored
Related files: `CCAgentindex/` (32 subdirs — see inventory below), `LEDGERS/INDEX.md`, `LEDGERS/FILE_DIRECTORY_LEDGER.md`, every `*_subagent_package/` at repo root
Related ledgers: File Directory Ledger §3, North Star NS-03 (single source of truth), Phase Ledger (planned), Definition of Done Ledger (planned)
Owner: Jake (decision required after ledger + sub-agent buildout settles)
Blocked by: ledger system not yet fully built; sub-agent system not yet fully built; PROB-001 (Allowed-To-Know schema), PROB-010 (CLAUDE.md domains list)
Tags: `bedrock`, `directory`, `architecture`, `cleanup`, `source-of-truth`, `plan-aging`

**Problem.** `CCAgentindex/` is the bedrock memory substrate the Claude Code / Codex agent reads when running live inside the Comeketo Agent app. It was written on the fly and bootstrapped as Jake went, before the Box + Ledger + Sub-agent triad was the formal architectural philosophy. As a result the bedrock has **32 top-level subdirectories** representing categorical thinking from the bootstrap era — many of which should collapse INTO Boxes (per-entity state), Ledgers (legible memory), or Sub-agent packages (operators) once the triad is finished being built out.

**Inventory (32 subdirs as of 2026-04-28):**

- *Already triad-aligned (6 — symlinks to Auto/):* `Boxes`, `Client Boxes`, `Staff Boxes`, `comeketo-inbox`, `Onboard Scripts`, `orchestrator`
- *Bedrock primitives (3):* `_inbox`, `_ledger`, `_vaults`
- *Loader / index plumbing (1):* `indexes`
- *Agent infra (2):* `agents`, `agent_plans`
- *Bootstrap-era category folders that may collapse into the triad:* `analytics`, `annotations`, `catalog`, `charts`, `commitments`, `hooks`, `intake_reports`, `intelligence`, `knowledge`, `people`, `projects`, `reports`, `Rodbot`, `scheduled_tasks`, `summaries`, `tables`, `threads`, `triggers`, `venues`, `workflows`

**Evidence.** Jake stated 2026-04-28 catch-up conversation: "this is essentially the bedrock source of truth memory substrate for our Claude code binary or Codex binary or whatever we're actually running the agent with when we're live inside the application... and this was written on the fly and bootstrapped as I went. Now we actually have our ledger systems being built, our boxes being built, our sub-agents being built, and all of this needs to be aggregated and properly connected and indexed... I just don't think it's a good idea to have like 40 different subdirectories when we're doing it the other way now."

**Impact.** As long as the bootstrap-era directories remain, the bedrock has *two competing organizational models*: the original "categorical filing" model and the emerging Box+Ledger+Sub-agent triad. This causes:
- *Read-time confusion* — agents and humans don't know which directory owns truth for a given entity. (E.g., does a venue's state live in `venues/`, in a future `Client Boxes/<venue>/`, or both?)
- *Write-time fragmentation* — adding state about a client today might land in `people/<slug>.json`, `projects/<slug>.json`, `commitments/`, *or* `Client Boxes/<Name>/`. Triad enforcement is impossible until the substrate matches the philosophy.
- *Loader drift* — `indexes/index.json` enumerates loader-visible paths; as boxes absorb categorical content, the index keys will need to change in lockstep.
- *Conceptually violates NS-03* (single source of truth) and the legibility-first commitment (rule from `feedback_box_ledger_subagent_triad`).

**Current workaround.** Treat new state-bearing work as triad-shaped (Box + Ledger + Sub-agent) rather than dropping it into the categorical folders. Don't add to `commitments/`, `projects/`, `threads/`, `knowledge/` etc. unless an existing sibling already lives there and consistency demands it. Capture migration intent here so it isn't lost.

**Recommended next action.** **Do not act on this yet.** Per Jake 2026-04-28: "the real thing that needs to be done is we need to finish building the ledgers and finish building the sub-agents. Once that's done we can let the dust settle and actually start figuring this all out." Sequence:
1. Finish ledger buildout (ingest the 22 outline drafts in `~/Documents/` per `reference_ledger_outline_drafts.md`).
2. Finish sub-agent buildout (graduate the 5 packages at root into runnable app agents under `CCAgentindex/agents/`).
3. *Then* run a reconciliation pass: for each bootstrap-era subdirectory, decide whether it (a) collapses into a Box, (b) becomes a Ledger, (c) becomes a Sub-agent's owned territory, (d) survives as a bedrock primitive, or (e) is archived.
4. Update `indexes/index.json`, `LEDGERS/FILE_DIRECTORY_LEDGER.md`, `mission_control_loader.js`, and the project `CLAUDE.md` to match the reconciled shape.

**Close criteria.**
- Ledger system buildout reached "active" for all planned ledgers in `LEDGERS/INDEX.md`.
- Sub-agent system buildout reached at least one runnable app agent per state-bearing domain.
- Reconciliation pass completed: each `CCAgentindex/` subdirectory has a documented role in the triad model OR has been archived.
- `LEDGERS/FILE_DIRECTORY_LEDGER.md` updated to reflect the reconciled bedrock.
- `indexes/index.json` keys match the reconciled bedrock.
- `CLAUDE.md` (project) describes bedrock organization in triad terms, not categorical terms.

**Atomized:** [`ATOMS.md`](ATOMS.md) §10.2 — 26 atoms covering 2 gates + 20 directory audits + 4 propagation. See `ATOMS.json` for full per-atom records (`ATOM-2026-04-30-0001` through `ATOM-2026-04-30-0026`). Total estimated effort: ~21.5h, broken into single-session-claimable pieces. Status as of 2026-04-30: all 26 `available`. **Atoms 0003–0022 are blocked by the two gate atoms (0001/0002), which check whether the ledger system and sub-agent system are stable enough to start the bedrock audit.** Per `DEC-2026-04-30-003` — atom claim protocol, granularity rule, lifecycle states.

History:
- 2026-04-28 — created. Jake flagged during catch-up conversation. Deferred pending ledger + sub-agent buildout completion. Inventory of 32 subdirs captured at creation.
- 2026-04-30 — **atomized.** PROB decomposed into 26 atoms in `ATOMS.md` per `DEC-2026-04-30-003`. The PROB itself stays open until all atoms complete and a closure review confirms the close-criteria are satisfied.

---

### PROB-2026-04-30-001 — Web-vs-Local Execution Context: Capability Surface Differs, No Profile System, Pieces Becomes Useless In Web

Status: **partial**
Severity: high · Urgency: soon
Discovered: 2026-04-30 · Discovered by: Jake (active Codex session — building the dual-mode hosting architecture)
Affected systems: server.py, every UI surface that depends on local-only capabilities, Pieces integration, AI provider routing, future profile system, future admin profile, every page in the app (`grid`, `settings`, `leads`, `clients`, `coworkers`, `contacts`, `briefing`, `activity`, `automation`, `intake`, `analytics`, `boxes`)
Related files: `server.py` (AI provider routing, `/api/pieces/*`, `/api/delegate`, `/api/computer_use/*`, `/api/browser_use/*`), `chat.js`, `ai.js`, `ai_actions.js`, `screens.jsx` (Pieces Activity, Delegations, Boxes), `CLAUDE.md` §1 + §3, `Auto/comeketo-inbox/`
Related ledgers: [`Decisions`](DECISIONS_LEDGER.md), [`Source-of-Truth`](SOURCE_OF_TRUTH.md), [`Connections`](CONNECTIONS.md), [`Definition-of-Done`](DEFINITION_OF_DONE.md), [`Box Bus`](BOX_BUS_LEDGER.md), [`Communications`](COMMUNICATIONS_LEDGER.md)
Owner: TBD (Jake driving the architectural shape; agent sweep candidate)
Blocked by: none — sweep is read-only and can start any time. Implementation is gated on the profiles design landing in Decisions Ledger.
Tags: `architecture`, `web-vs-local`, `profiles`, `connection`, `capability-surface`, `pieces`, `ai-routing`, `safety`

**Problem.**

The Comeketo Agent app is being prepared for **dual-mode hosting**:

1. **Local mode** — runs on Jake's machine. Has access to spawned binaries (Claude Code subprocess, Cursor, Codex), local Pieces (PiecesOS at `localhost:39300`), local file tree, the orchestrator, the symlinked `Auto/` payload, and direct git push/pull.
2. **Web mode** — hosted on a public surface (e.g., served behind a browser). Cannot spawn local binaries. Strictly speaks to AI through the OpenAI API key (and analogous remote APIs for ChatGPT and other browser-borne LLMs). Pieces is unavailable. The local file tree is a *replica* synchronized via the GitHub oscillation design (proposal at `LEDGERS/Drafts/github_oscillation_proposal.md`), not a primary surface.

The app currently assumes *local mode everywhere*. It does not detect which mode it is running in. It does not gate features by mode. It does not have a profile system to scope identity, credentials, or permissions across the two surfaces. Several capabilities will silently break or behave wrongly when the same code runs on the web:

- **Pieces integration becomes useless in web mode.** PiecesOS is per-machine. The Pieces session running on Jake's local machine reflects Jake's workstream — not the web visitor's. A web user querying `/api/pieces/ask` against Jake's Pieces is reading someone else's memory layer. This is the most concrete failure mode.
- **AI provider routing assumes Claude Code subprocess availability.** `/api/delegate` spawns `claude -p`. `/api/reports/<slug>/ask` falls back to Claude Code when no `OPENAI_API_KEY` is set. Both fail outright in web mode where no `claude` binary exists.
- **Computer-use / browser-use bridges** (recently added per the 2026-04-30 polish bundle) are local-only by their nature.
- **The orchestrator and the Auto/ symlink** are local-only paths that web mode cannot resolve.
- **No profile system exists.** There is no concept of "who is using this app right now," what their identity is, what credentials they bring, or what scope of capability they're granted. Currently the app implicitly is Jake; in web mode it might be anyone.
- **No admin profile exists.** Some operations (deleting a Client Box, force-pushing, modifying CLAUDE.md, triggering a real outbound through Close) should never run on a public surface — and should be gated to an admin-class profile even in local mode.

**Evidence.**

- `server.py` provider-routing pattern: `provider = "openai" if ENV.get("OPENAI_API_KEY") else "claude_code"` — this assumption breaks if `claude_code` is the selected fallback but no binary is available (web mode).
- `_pieces_init()` and the `/api/pieces/*` family unconditionally connect to `localhost:39300`. There is no "Pieces is unavailable, gracefully disable" branch that surfaces the unavailability in the UI.
- CLAUDE.md §3 documents the orchestrator and `Auto/` symlink as canonical write-once-by-orchestrator paths — both are local-only.
- The recent oscillation proposal (`LEDGERS/Drafts/github_oscillation_proposal.md`) names the Cast of Actors as **Local agent · Web AI client · Human · GitHub.com**, but does not yet define how the *running app* itself knows which mode it is in.
- No `profile` or `mode` concept appears anywhere in `server.py`, `app.jsx`, `screens.jsx`, or any ledger.

**Impact.**

- **Wrong-person memory leakage.** A web user running Pieces queries pulls from Jake's local Pieces — privacy violation and incorrect answers.
- **Silent feature breakage.** Web users hitting Claude-Code-only paths get cryptic errors instead of "this feature is local-only."
- **No safety boundary.** Without an admin profile, a web user could in principle trigger destructive operations (Close API writes, delete-box endpoints) that should be gated.
- **Architecture decisions made without this distinction calcify wrong assumptions.** Every new feature added before the mode/profile system exists ships assuming local — same problem the codebase already has, multiplied.
- **The GitHub oscillation design (in proposal) cannot fully complete without this.** Web-side actor identity (`actor=chatgpt_mcp`, `actor=claude_ai_mcp`) is a *profile attribute*; you can't assign actor identity to writes if the system has no notion of which profile is running.

**Current workaround.**

- Jake is actively the only user. Web mode does not yet exist as a deployment target — the app is single-machine, single-operator today.
- Pieces queries and Claude-Code-spawning endpoints implicitly assume Jake. Anyone else accessing the running server gets undefined behavior; the workaround is "do not access the running server from anyone else."
- The OpenAI API path works in both modes when `OPENAI_API_KEY` is set, so for any flow that has an OpenAI fallback the web mode is technically reachable — but feature parity is not designed for.

**2026-04-30 partial closure — main ChatRail OpenAI route.** The hosted/demo OpenAI path now works for the main chat when OpenAI is selected. `chat.js` reuses `SecretaryAI.respond()` when the selected OpenAI route is browser BYOK direct, matching the Automation page behavior. `server.py` also normalizes local UI roles like `tool`/`system` and writes assistant history as Responses API `output_text`, so the server-proxy OpenAI route survives tool receipts and prior assistant turns. Verified on the live local server (`3422`) with `/api/chat/send` using OpenAI plus `tool` + `assistant` history returning `ok`. This partially satisfies the AI-provider-routing close criterion for **ChatRail/OpenAI selected mode only**; it does not close mode detection, Pieces gating, profiles, admin gates, or the full capability sweep.

**Recommended next action.**

Three sequential moves, each independently valuable. **Start with the sweep — it is read-only, it produces a tangible artifact, and it unblocks the design.**

1. **Capability sweep (read-only audit).** Walk the entire app and produce a **Capability Matrix Ledger** — one row per feature, columns: `local`, `web`, `degraded-mode-allowed`, `notes`. Every endpoint in `server.py`, every screen component in `screens.jsx`, every MCP tool the app exposes, every external integration. Output: `LEDGERS/CAPABILITY_MATRIX.md` (proposed). Surface every assumption that needs to change.
2. **Mode detection.** Add a single `EXECUTION_MODE` constant to `server.py` (env var: `COMEKETO_MODE=local|web`, default `local`). Surface it on `GET /api/system/mode`. Every feature that differs reads this constant and branches.
3. **Profile system.** Design phase first (Decisions Ledger entry + `LEDGERS/PROFILES.md` ledger), implementation second. Open questions to lock before code:
   - Profile identity shape (id, name, credentials, scope, mode)
   - Admin profile definition (what extra capabilities, what gates)
   - Profile loading order (env, request header, local config)
   - How profiles compose with the GitHub oscillation actor identity
   - Pieces gating: when is Pieces *enabled* (only if local AND profile owns this Pieces instance)
   - Default-deny: if no profile is asserted, what's the safe baseline? (Recommended: read-only public-surface mode.)

**Close criteria.**

This problem closes when **all** of the following are true:

- [ ] **Capability Matrix Ledger** authored at `LEDGERS/CAPABILITY_MATRIX.md` and `.json`. Every page, every API endpoint, every external integration enumerated. Each row tagged `local-only`, `web-only`, `both`, or `degraded-in-web`.
- [ ] **Mode detection** implemented in `server.py`. `/api/system/mode` returns the current mode. UI banner surfaces non-default mode.
- [⚠️ partial 2026-04-30] **Pieces gracefully disabled in web mode**: client-side gate landed — when `tweaks.aiProvider === "openai"` (the AI-provider toggle used as an interim proxy for "we're in hosted web mode"), the Topbar hides the `briefing` chip + the `activity` chip, `FrontPage` skips `LivePiecesHeader` and falls through to `TeachingStrip`, deep links to hidden routes redirect to `grid` via a `webMode` `useEffect` in `app.jsx`, and `SettingsScreen` shows a disclosure box explaining the gate. Pieces-dependent surfaces are now invisible rather than broken. Server-side `_pieces_init()` short-circuit + a "Pieces unavailable in this hosting mode" banner remain open; the proxy-via-aiProvider gate will be replaced by the proper mode/profile system when that lands.
- [ ] **AI provider routing respects mode**: web mode never attempts `claude_code` subprocess; falls back to OpenAI or returns a clear "this surface requires the local app" error. **Partial 2026-04-30:** main ChatRail honors selected OpenAI in hosted/server-proxy and browser BYOK direct modes; full mode-aware routing remains open.
- [ ] **Profile system design** locked as a Decisions Ledger entry. Identity shape, admin definition, default-deny posture, and profile-vs-mode interaction all written.
- [ ] **Admin profile** implemented for at least the destructive endpoints (delete-box, force-push, CLAUDE.md edits, Close API writes). Non-admin profiles 403 these.
- [ ] **`page_asset_sitemap.md`** updated for every page whose capability surface differs by mode.
- [ ] **Composition with the oscillation proposal**: web-side `actor` field on activity-ledger entries derives from the active profile in web mode. Documented in the oscillation Decisions Ledger entry when that lands.

**History.**

- 2026-04-30 — created. Jake surfaced during a Codex session focused on the dual-mode hosting build. Three threads named in chat: (1) Pieces becomes useless in web mode (different person), (2) profiles + admin profile are now needed, (3) capability sweep across the app to enumerate web-vs-local before making any new architectural commitments. Logged here as one problem rather than three because all three are aspects of the same missing primitive: **execution context awareness**.
- 2026-04-30 — partial. Main ChatRail OpenAI selected route fixed for hosted/demo use: browser BYOK direct path now reuses `SecretaryAI.respond()`; server OpenAI proxy normalizes tool/system roles and assistant `output_text` content for Responses API compatibility. Verified with OpenAI `/api/chat/send` on local `3422`. Status `open` → `partial`; remaining criteria are still mode detection, capability matrix, Pieces web gating, profile/admin design, and full web/local feature gating.
- 2026-04-30 (later) — Pieces gracefully disabled criterion partial-satisfied via client-side surface gating. New `WEB_MODE_HIDDEN_ROUTES = ["briefing", "activity"]` constant + `webMode = (tweaks.aiProvider === "openai")` derived in `app.jsx`. When OpenAI selected: Topbar hides briefing chip + activity chip; `FrontPage` falls through to `TeachingStrip` instead of `LivePiecesHeader`; redirect `useEffect` pushes user home if they were on a hidden route at flip time; `SettingsScreen` renders a disclosure box explaining what hid and why. Operator-flagged change driven by hosted-web-app beta-test deadline. Interim implementation — uses AI provider toggle as proxy for execution mode; full mode/profile system per close-criteria above remains open. Cache-bust: `app.jsx` 53→54, `components.jsx` 72→73, `screens.jsx` 97→98.

---

### PROB-2026-04-30-002 — IdeasTray On `grid` Home Page → Rebuild As "Soonest-First Action Timeline"

Status: **triaged** (target spec captured 2026-04-30; ready to design and build)
Severity: medium · Urgency: later (no active harm; user-visible interim shape today is benign-but-stale)
Discovered: 2026-04-30 · Discovered by: Jake (Cowork session — page audit walkthrough)
Affected systems: `grid` route home destination, `components.jsx` `IdeasTray` + `BriefingIdea`, `mission_control_loader.js` daily briefing pull, `window.SecretaryAI.ask` AI curation path, eventual integration with scheduled fires / triggers / agent_plans
Related files: `components.jsx` (`IdeasTray`, `BriefingIdea`, `extractBriefingIdeas`, `curateBriefingIdeasViaAI`, `readCachedIdeas`, `writeCachedIdeas`), `styles.css` `ideas-tray-*` / `briefing-idea`, localStorage cache key `comeketo.briefingIdeas.<slug>`, `CCAgentindex/triggers/`, `CCAgentindex/agent_plans/`, `CCAgentindex/workflows/`, the comeketo-inbox guardrail layer
Related ledgers: `page_asset_sitemap.md` §grid (Asset Ownership), `LEDGERS/PAGES/grid.md` (planned), `ASSET_WIDGET_MAP.md`, eventual Decisions Ledger entry
Related problems: PROB-2026-04-30-004 (current sweep output appears stale — likely separate bug, may close when this rebuild lands), PROB-2026-04-30-001 (web-vs-local capability surface — affects Pieces gating for this widget)
Owner: Jake (design author) + future Cowork session (build)
Blocked by: ~~Jake naming the desired widget behavior~~ → **target spec captured 2026-04-30 (see below)**; now blocked on build prioritization
Tags: `UI`, `widget-design`, `home-page`, `automation`, `timeline`, `editable-comms`

**Problem.** The left-column widget on the `grid` home page is currently a briefing-sourced talking-point picker (regex-extract → AI-curate → click-to-discuss). The widget is on the homepage so it shapes operator perception of "what should I be working on" on every load. The current shape does NOT match the target intent — it should be the home-page surface for **everything the system is about to do, ordered by when**.

**Target Behavior (Operator Spec — 2026-04-30).** Captured verbatim from Jake during page audit walkthrough:

> "What's going to be there is something that hasn't been totally built yet, but what we're working towards is the ability to have our AI show everything that's going to happen by order of when it's going to happen, and then that widget on the left would be for showing that. So you can click on it and see the total information outline of the communications and the update state and what it's actually going to do, which would also allow us to edit what is actually said in the communication. So that would be a list of everything that's important that's going to happen the soonest."

Decomposed:

1. **Source.** Aggregate "everything that's going to happen" — likely the union of:
   - scheduled fires (`CCAgentindex/triggers/*.json` next-run times)
   - active agent plans (`CCAgentindex/agent_plans/*.json`)
   - per-Client-Box seven-day-plan upcoming touchpoints (`Auto/Client Boxes/<Name>/05_seven_day_plan.md`)
   - any ad-hoc actions queued through the Box Bus (when Phase C runtime exists)
2. **Order.** By time-to-fire ascending (soonest first). Drives the rendering order in the list.
3. **List shape.** Compact rows on the homepage — soonest item at top. Likely keeps the existing `briefing-idea` row aesthetic (7px accent dot + sans-serif title) but the title is now "what's about to happen" rather than a talking point.
4. **Click → drill-in.** Opens a "total information outline" for the upcoming action. Three required data slices:
   - **the communication itself** (the actual outbound text — SMS/email/Slack/Close note draft)
   - **the update state** (what state changes when this fires — lead status, plan progress, calendar, ledger entries)
   - **what it's actually going to do** (the action contract — which integration, which guardrails apply, what approval gate if any)
5. **Editability.** The drill-in surface MUST allow editing the communication text before it goes out. (Big feature — implies the action's scheduled-fire payload is mutable up until fire time, with an approval gate per `PROB-2026-04-28-003`.)
6. **Button copy preference.** The Sweep button should NOT carry a verb label like "Sweep now." It should be a button that performs the action without naming itself — icon-only or whisper-thin. (Current code: `components.jsx` line 1677 — button text alternates "sweep" / "sweeping…", with hover title "Re-pull ideas from today's briefing." Both will likely be replaced.)

**Evidence.** Direct operator statement during 2026-04-30 page audit walkthrough (preserved in chat + this OPL entry). Code currently reflects briefing-pull pattern; target requires action-aggregation pattern.

**Impact.** Today: low (widget works, just not aimed right). After this rebuild: high — this becomes the home-page command surface for everything the operator is responsible for. Misalignment compounds because the homepage trains daily attention.

**Current workaround.** Operators read the briefing-sourced ideas and click to discuss. Adequate as an interim. Note PROB-2026-04-30-004 — Jake observed the widget has been "saying the same thing for a couple days," which suggests the current interim implementation may not even be functioning.

**Recommended next action.**

1. **Confirm aggregation surface.** Decide whether the soonest-first list draws from the activity ledger directly, from a server-synthesized union endpoint (new), or from the existing `/api/state/snapshot` pattern extended with future events. Likely candidate: new `/api/upcoming/snapshot` returning `[{ when, kind, source_id, source_path, action_summary, payload, edit_url }, ...]`.
2. **Author the drill-in surface.** Modal or right-pane reveal showing the three required slices (communication / update state / action contract). Editable comm text becomes a `PUT /api/triggers/<id>/payload` style endpoint (or per-source-type equivalent).
3. **Wire approval gates.** Drill-in must surface guardrail status per `PROB-003` (risky moves → isolated approval card).
4. **Replace button copy.** Per Jake's note, button performs Sweep without naming itself — icon-only. Update `components.jsx` line 1666–1678 + `styles.css` `ideas-tray-sweep`.
5. **Rebuild empty state.** Current empty state text ("Run the morning sweep — or click Briefing above to write one") drops away in the new model — replaced by "Nothing scheduled" or similar.
6. **Decisions Ledger entry.** Once shape is locked: DEC- entry naming widget purpose, source contract, edit/approval flow, and relationship to scheduled fires + Box Bus runtime.

**Close criteria.**
- [ ] Server endpoint (e.g., `/api/upcoming/snapshot`) returns soonest-first action union.
- [ ] `IdeasTray` rebuilt to consume the upcoming-action stream rather than briefing bullets.
- [ ] Click-to-drill-in surface renders communication / update state / action contract.
- [ ] Communication text is editable and persists back to the source (trigger / plan / box).
- [ ] Approval gate honored for risky-action edits per PROB-003.
- [ ] Sweep button is icon-only, no verb-label copy.
- [ ] Decisions Ledger entry locks the design.
- [ ] `page_asset_sitemap.md` §grid Asset Ownership rewritten for the new widget.
- [ ] `ASSET_WIDGET_MAP.md` reflects new role.
- [ ] `LEDGERS/PAGES/grid.md` (when authored) describes the home-page command surface intent.
- [ ] PROB-2026-04-30-004 (stale-content bug) closes naturally when this rebuild lands, OR is closed independently first.

**History.**
- 2026-04-30 — created. Surfaced during the page audit walkthrough; logged so the operator-stated intent is durable rather than chat-only.
- 2026-04-30 — triaged. Target spec captured directly from operator: soonest-first action timeline, click-to-drill-in (communication / update state / action contract), editable communication text, icon-only Sweep button. Status `open` → `triaged`. Blocker shifted from "name the target" to "build prioritization." Companion bug captured at PROB-2026-04-30-004.

---

### PROB-2026-04-30-004 — IdeasTray Sweep Output Appears Stale — Same Content For Days

Status: **open** (suspected bug, not yet root-caused)
Severity: medium · Urgency: soon
Discovered: 2026-04-30 · Discovered by: Jake (operator observation during page audit walkthrough)
Affected systems: `components.jsx` `IdeasTray` rendering, briefing pull pipeline, AI curation cache, daily briefing slug calculation
Related files: `components.jsx` (`IdeasTray`, `extractBriefingIdeas`, `curateBriefingIdeasViaAI`, `readCachedIdeas`, `writeCachedIdeas`, `pullFromBriefing`, `sweepNowRef`), `mission_control_loader.js` (daily briefing payload), localStorage key `comeketo.briefingIdeas.<slug>`, `window.MissionControl.dailyBriefing.body`, `window.MissionControl.dailyBriefing.slug`
Related ledgers: `page_asset_sitemap.md` §grid (Asset Ownership), `LEDGERS/PAGES/grid.md` (planned)
Related problems: PROB-2026-04-30-002 (full widget rebuild — this bug may close naturally when that lands, but should be triaged independently in case the rebuild is weeks out)
Owner: TBD
Tags: `bug`, `UI`, `home-page`, `cache`, `briefing`, `ai-curation`

**Problem.** Per Jake's 2026-04-30 audit observation: *"Right now, it's just sweeping something. I'm not even sure if it even works right now. It's been saying the same thing for a couple days."* The IdeasTray on the homepage appears to be displaying identical talking-point content across multiple days, even though the underlying daily briefing should change day-over-day.

**Likely root causes (ranked by likelihood, each requires verification).**

1. **localStorage cache not busting per briefing slug.** The cache key is `comeketo.briefingIdeas.<slug>`. If `window.MissionControl.dailyBriefing.slug` is the same across days (e.g., slug is generated from a stable file path rather than the date), the cached AI-curated bullets serve forever. The `useEffect` that reads `slug` would hit the same cache hit each day.
2. **Daily briefing not actually refreshing.** If the briefing payload upstream of `MissionControl.dailyBriefing` isn't being regenerated (e.g., the Pieces sweep that feeds it is stalled, or the briefing markdown isn't being updated), then even if the cache busts, the regex-extracted bullets pull from the same body and produce identical output.
3. **AI curation failing silently.** If `curateBriefingIdeasViaAI` is throwing or returning empty, the fallback is the regex-extracted bullets — and if those are also stable, the user sees the same content. The `try/catch` in `pullFromBriefing` swallows the error to `aiCuratingRef.current = false` without surfacing to UI.
4. **Stale `dailyBriefing` payload in MissionControl.** The loader (`mission_control_loader.js`) might be caching an old briefing; the `missioncontrol:loaded` event listener ensures pull-on-load but won't catch a cross-day change unless the page is reloaded.

**Evidence.** Direct operator observation: same widget content for "a couple days." Bug was reported during the 2026-04-30 page audit walkthrough at ~14:53 ET.

**Impact.** Operator distrusts the widget ("not even sure if it works"). Erodes confidence in the homepage at exactly the moment the home page is being relied on for daily orientation. Also masks any signal that *might* have come from the widget if it were updating.

**Current workaround.** None deployed. Hard reload in browser would force a fresh `MissionControl` load and might bust the cache; user has not been doing this.

**Recommended next action.**

1. **Diagnose first — do not just clear cache.** Open DevTools on the live `localhost:3422/Secretary.html`, inspect `localStorage.getItem("comeketo.briefingIdeas.<slug>")` for the current slug, check `window.MissionControl.dailyBriefing.slug` and `.body`, and compare against what's in the source briefing file (likely under `Auto/orchestrator/state/` or wherever the daily briefing lives).
2. **Verify briefing slug computation.** Find the slug source in `mission_control_loader.js`. If it's stable across days, that's the bug — slug should incorporate a date component or reset daily.
3. **Add error surfacing to UI.** When `curateBriefingIdeasViaAI` fails, the IdeasTray should show a small "AI curation unavailable — showing raw briefing bullets" affordance rather than silently degrading. Even a tiny visual signal would have caught this earlier.
4. **Consider whether to fix-in-place or wait for PROB-002 rebuild.** If PROB-002 is going to land within ~2 weeks, the rebuild moots this bug. If it's further out, fix this independently because operator confidence in the homepage matters.

**Close criteria.**
- [ ] Root cause identified and documented (which of the 4 likely causes — or a 5th).
- [ ] Fix applied OR PROB-002 rebuild lands and renders this moot.
- [ ] Verified by observing different IdeasTray content across two consecutive calendar days.
- [ ] If a UI error surface was added per recommended action #3, that's documented in sitemap §grid.

**History.**
- 2026-04-30 — created. Reported by Jake during the page audit walkthrough. Sister problem to PROB-2026-04-30-002 (which is the eventual rebuild). Logged separately because (a) it might be a quick fix worth doing now even if the rebuild is later, and (b) it documents the operator-distrust signal that motivated the rebuild.

---

### PROB-2026-04-30-003 — `FrontPage` Carries Significant Dead Code From Pre-Trim 3x3 Decision Grid Era

Status: **open**
Severity: low · Urgency: later
Discovered: 2026-04-30 · Discovered by: Cowork audit session (three-way diff of `grid` page screenshot ↔ sitemap ↔ JSX)
Affected systems: `components.jsx` `FrontPage` + supporting card-render machinery, `styles.css` legacy grid classes
Related files: `components.jsx` (`FrontPage` lines ~1806–2119, plus `FpCard`, `renderCard`, `renderVirtualParent`, `nowRow`, `laterRow`, `refineState`, `startRefine`, `updatePosition`, `spread`, `emitCoordinate`, `commitChild`, `refineChild`, `cancelRefine`, `homeFromRefine`, `jumpTrail`, `synthesizeChildren`, `axisPackFor`, `classifyCardType` — many of these still referenced elsewhere, audit before deleting), `styles.css` (`grid-stage`, `cell`, `grid-head`, `quick-capture`, `qc-*` class families), `Secretary.html` cache-bust line for `components.jsx`
Related ledgers: `page_asset_sitemap.md` §grid (now flags the dead code), `ASSET_WIDGET_MAP.md` (cleanup target), `LEDGERS/PAGES/grid.md` (planned — would document why the trim happened)
Owner: TBD (cleanup-track, not blocking any feature)
Blocked by: nothing (purely additive cleanup); but should NOT be done before PROB-2026-04-30-002 resolves, in case the IdeasTray rebuild repurposes some of these primitives
Tags: `cleanup`, `dead-code`, `UI`, `home-page`

**Problem.** The `FrontPage` component in `components.jsx` retains substantial code from the retired 3x3 decision-grid era. The current `return (...)` JSX at line 2086 only renders `LivePiecesHeader`, `FpBreadcrumb`, `IdeasTray`, and `ChatRail` — but the file also defines `renderCard`, `renderVirtualParent`, `nowRow`, `laterRow`, refine state machine (`refineState`, `startRefine`, `updatePosition`, `spread`, `emitCoordinate`, `commitChild`, `refineChild`, `cancelRefine`, `homeFromRefine`, `jumpTrail`), `synthesizeChildren`-style helpers, and the `FpCard` component itself — none of which are reachable from the current return. Stale CSS classes (`grid-stage`, `cell`, `grid-head`, `quick-capture`, `qc-*`) likewise persist in `styles.css`.

**Evidence.** Direct read of `components.jsx` lines 1806–2119 (Apr 2026 audit); current return JSX explicitly mounts only the four assets named. Sitemap §grid now lists the dead-code asset names under "Removed / deprecated assets (still present as DEAD CODE)."

**Impact.** Low — the dead code does not affect runtime correctness because it's never reached. Higher latent risk: agents reading `FrontPage` to understand the home page misread the file's intent (the same trap the sitemap drift created). It also keeps the file ~150 lines longer than it needs to be, slowing future edits.

**Current workaround.** Sitemap §grid now explicitly calls out the dead-code surface so future readers don't mistake it for live behavior.

**Recommended next action.** Defer until after PROB-2026-04-30-002 lands a target widget shape — the IdeasTray rebuild may want to repurpose `axisPackFor`, `classifyCardType`, or refine-state primitives. Once that's settled, do a single cleanup pass: remove dead `FrontPage` helpers, remove stale CSS class families, bump `components.jsx` cache-bust in `Secretary.html`, append ledger.

**Close criteria.**
- [ ] `FrontPage` in `components.jsx` retains only what its `return` actually mounts (refine state + card render helpers removed if not repurposed by PROB-002 work).
- [ ] `styles.css` no longer contains `grid-stage` / `cell` / `grid-head` / `quick-capture` / `qc-*` class families if they're truly unused (verify with grep across `*.jsx`/`*.js` first).
- [ ] `Secretary.html` cache-bust for any touched file bumped.
- [ ] `page_asset_sitemap.md` §grid "Removed / deprecated assets" section updated to note the cleanup completed.
- [ ] `_ledger/activity.jsonl` appended.

**History.**
- 2026-04-30 — created. Surfaced during three-way diff between rendered `grid` page screenshot and `FrontPage` JSX. Sitemap §grid was claiming a 3x3 decision grid that hasn't existed in the rendered output for some time; the JSX still has the machinery, just no longer mounted. Both the sitemap drift and the dead code are products of the same 2026-04-25 great trim — one was reflected only in History, not in the live Asset list.

---

### PROB-2026-04-30-005 — Promote Remaining Steward Sub-Agent Packages To Runnable App Agents

Status: **open**
Severity: medium · Urgency: soon
Discovered: 2026-04-30 · Discovered by: Jake (paper list — "finish our ledger scripts")
Affected systems: `LEDGERS/AGENTS/`, `CCAgentindex/agents/`, `Subagent Boxes/`, ledger maintenance loop, three-phase build (DEC-2026-04-29-002 Phase B)
Related files: `Subagent Boxes/file_directory_subagent_package/`, `global_ledger_subagent_package/`, `north_star_subagent_package/`, `open_problems_subagent_package/`, `temporal_continuity_subagent_package/`
Related ledgers: [`Decisions`](DECISIONS_LEDGER.md) (DEC-2026-04-29-001 Triad, DEC-2026-04-29-002 Phase Discipline), [`Box Ledger`](BOX_LEDGER.md), [`Index`](INDEX.md)
Owner: TBD
Tags: `ledger`, `subagent`, `phase-b`, `automation`

**Problem.** Five steward sub-agent packages live as drafts at `Subagent Boxes/`: `file_directory_subagent_package`, `global_ledger_subagent_package`, `north_star_subagent_package`, `open_problems_subagent_package`, `temporal_continuity_subagent_package`. Only **one** has been promoted to a runnable app agent (`global_ledger_steward` lives at `CCAgentindex/agents/global_ledger_steward/` and runs via `POST /api/agents/global_ledger_steward/run`). The other four cannot run.

**Evidence.** `ls Subagent Boxes/` returns 5 packages. `ls CCAgentindex/agents/` returns 3 entries (`global_ledger_steward`, `andre_escalation_ladder`, `inbox_triage`) — only 1 of which is a steward; the other two are operational sub-agents unrelated to the ledger fleet.

**Impact.** Ledger drift goes uncaught. The Global Ledger Steward catches GL drift; nothing currently catches drift in the Temporal Continuity, North Star, File Directory, or Open Problems ledgers. Per Prime Directive (CLAUDE.md), ledger drift is the cardinal sin — and we currently have one steward doing the work of five.

**Current workaround.** Manual ledger maintenance during sessions. Works while operator is active; degrades the moment a session lapses.

**Recommended next action.** Promote each draft package, one at a time, following the pattern established by `global_ledger_steward`:
1. Copy `Subagent Boxes/<name>_subagent_package/` → derive runnable agent at `CCAgentindex/agents/<short_name>_steward/`.
2. Author `agents.md` (config) + `prompt.md` (operator brief) per the steward template.
3. Wire `POST /api/agents/<short_name>_steward/run` into `server.py` (the `_agent_run` dispatcher already supports this pattern).
4. Smoke test on a known-good ledger state. Audit-mode default; local-write opt-in.

Suggested order (by impact): **temporal_continuity** (most read, highest drift risk) → **open_problems** (already 18+ entries; volume justifies) → **file_directory** (city-map drift is silent) → **north_star** (lowest churn, least urgent).

**Close criteria.**
- [ ] All 5 steward packages have runnable app-agent counterparts in `CCAgentindex/agents/`.
- [ ] All 5 are reachable via `POST /api/agents/<name>/run`.
- [ ] Each agent's prompt.md is canonicalized in `LEDGERS/AGENTS/<name>/`.
- [ ] Each has at least one successful audit-mode run logged in `_ledger/ledger_steward_runs/`.
- [ ] `LEDGERS/INDEX.md` status flipped to **active** for each.

**Atomized:** [`ATOMS.md`](ATOMS.md) §10.3 — 17 atoms covering 1 architectural-gate atom (ATOM-2026-04-30-0027 — decide runnable path: `CCAgentindex/agents/<name>/` legacy vs `LEDGERS/BOXES/<name>/steward/` unified Box) + 4 steward-promotion chains × 4 atoms each (`ATOM-2026-04-30-0028..0043`) for temporal_continuity / open_problems / file_directory / north_star. Each chain: author runnable form → wire endpoint → smoke-test → flip INDEX status. Total estimated effort: ~13.5h. Per `DEC-2026-04-30-003`.

**History.**
- 2026-04-30 — created from operator's paper list. Forward-looking, not a regression — completes Phase B of DEC-2026-04-29-002.
- 2026-04-30 — **atomized.** PROB decomposed into 17 atoms in `ATOMS.md` per `DEC-2026-04-30-003`. Architectural-gate atom (ATOM-0027) blocks all 16 promotion atoms. Last atom (ATOM-0043) surfaces this PROB for closure review when complete.

---

### PROB-2026-04-30-006 — Begin Box Bus Runtime Build (DEC-013 Phase C)

Status: **open**
Severity: high · Urgency: later (gated on Phase B completion — see PROB-2026-04-30-005)
Discovered: 2026-04-30 · Discovered by: Jake (paper list — "begin the ledger-to-box integration", "build our box trickle hierarchy")
Affected systems: every Box, every ledger that emits, future event router, `_ledger/box_bus/<channel>.jsonl` (when implemented)
Related files: `LEDGERS/BOX_BUS_LEDGER.md` (schema, locked), `LEDGERS/BOX_BUS_LEDGER.json`
Related ledgers: [`Box Bus`](BOX_BUS_LEDGER.md), [`Decisions`](DECISIONS_LEDGER.md) (DEC-2026-04-29-013 Reactive Box Network, DEC-2026-04-29-002 Three-Phase Build)
Owner: TBD
Blocked by: PROB-2026-04-30-005 (Phase B steward fleet must be functional first per DEC-2026-04-29-002)
Tags: `architecture`, `box-bus`, `phase-c`, `automation`, `subagent`

**Problem.** The Reactive Box Network is **architecturally locked** under `DEC-2026-04-29-013` and the schema lives in `BOX_BUS_LEDGER.md` (manifest, envelope, three routing tiers, three interpreter tiers, cycle policy, two worked examples). The runtime — the actual router that reads new ledger entries, looks up subscribers, and dispatches interpreter jobs — has **not been built**. Per `DEC-2026-04-29-002` this is Phase C work, gated on Phase B (sub-agent fleet) being further along.

**Evidence.** Box Bus Ledger is marked `active (schema-only)` in `LEDGERS/INDEX.md`. No router daemon exists in `server.py`. No `_ledger/box_bus/<channel>.jsonl` files exist. Worked examples in §7 and §8 of BOX_BUS_LEDGER are illustrative, not implemented. 5 steward packages still draft (PROB-2026-04-30-005); the Phase B → C precedence holds.

**Impact (when it ships).** Boxes auto-respond to ledger events without operator orchestration. A Decisions Ledger entry that scopes to client boxes auto-stamps a line in every relevant `client_ledger.md`. An Open Problem closure auto-updates the related Page Ledger. The triad becomes self-maintaining instead of operator-maintained.

**Current workaround.** Operator-driven manual updates. Slow, drift-prone, but functional.

**Recommended next action.** Sequenced inside Phase C, starting only after PROB-2026-04-30-005 is closed:
1. **Router daemon** in `server.py` — tails activity.jsonl + watches loader-visible `*.jsonl` ledgers, computes subscribers from a routing index built by scanning all `box.json` manifests (currently zero exist; depends on item 2).
2. **Author `box.json` manifests** for the existing boxes — Client Boxes (28), Staff Boxes (10), and any analytics snapshot boxes from PROB-2026-04-30-008. Manifest schema is locked in BOX_BUS_LEDGER §2.1.
3. **Tier-1 interpreters first** (deterministic schema-mappers — `~80%` of routes per BOX_BUS_LEDGER §4). Tier-2/3 LLM interpreters wait for first measurement.
4. **Single end-to-end route** as smoke test (per BOX_BUS_LEDGER §9 build sequence): Decisions Ledger entry scoping to `client_box:hugo_casillas` auto-appends one line to Hugo's `client_ledger.md`. Verify the audit trail lands in `_ledger/propagation.jsonl`.
5. **Cycle detector** active from day one (BOX_BUS_LEDGER §6).
6. **Activity-ledger actor self-skip** active from day one (per the GitHub oscillation proposal §9).

**Close criteria.**
- [ ] Router daemon running in `server.py` with health surface on `GET /api/box_bus/status`.
- [ ] At least one `box.json` manifest authored per Box class (Client, Staff, Analytics Snapshot).
- [ ] At least one global → domain → local trickle-down working end-to-end with audit trail.
- [ ] Cycle detection verified by intentionally constructing a cycle; router refuses with a clear error.
- [ ] `_ledger/propagation.jsonl` accumulates one line per dispatch.
- [ ] BOX_BUS_LEDGER status in `LEDGERS/INDEX.md` flips from `active (schema-only)` to `active (runtime live)`.

**History.**
- 2026-04-30 — created. Two paper-list items collapsed into this one entry: "begin the ledger-to-box integration" and "build our box trickle hierarchy" describe the same primitive.

---

### PROB-2026-04-30-007 — Per-Box Agent Configuration In Box Folders (Phase 2 Of Intake → Box)

Status: **open**
Severity: medium · Urgency: soon
Discovered: 2026-04-30 · Discovered by: Jake (paper list — "make our agents' configuration inside each box")
Affected systems: every Client Box folder, `/api/reports/<slug>/ask` path, `_box_report_synthesize`, future per-box routine config, Boxes UI agent surface
Related files: `Auto/Client Boxes/<Name>/AGENTS.md` (Hugo has one; Brenda has partial; rest empty), `Auto/Client Boxes/<Name>/06_logic.md`, `07_skills_used.md`, `08_automations.md`, `LEDGERS/Drafts/intake_box_unification_plan.md` (forward link Phase 2)
Related ledgers: [`Decisions`](DECISIONS_LEDGER.md) (DEC-2026-04-29-008 Phase 1 read-mostly), [`Box Ledger`](BOX_LEDGER.md)
Owner: TBD
Blocked by: not strictly blocked, but composes more cleanly with PROB-2026-04-30-006 (router) when both ship together
Tags: `box`, `subagent`, `phase-2`, `intake`, `client-box`

**Problem.** Each Client Box should carry its own agent configuration (`AGENTS.md`, `prompt.md`, possibly skills/scripts) so that asking questions of a box uses **that box's voice and operating contract** — not a generic prompt. Today Hugo's box has `AGENTS.md`, `CLAUDE.md`, `automation_index.md`, `06_logic.md`, `07_skills_used.md`, `08_automations.md` already — but the Intake ask path doesn't read them. Per `DEC-2026-04-29-008`, Phase 1 of Intake → Box explicitly deferred this plumbing.

**Evidence.** `Auto/Client Boxes/Hugo Casillas/AGENTS.md` exists. `_reports_ask` in `server.py` uses a generic system prompt regardless of which box the synthesized report is over. `LEDGERS/Drafts/intake_box_unification_plan.md` §9 names this as Phase 2 future work.

**Impact (when it ships).** Asking Hugo's Box Report a question would honor Hugo's logic, voice, and skills declarations. Brenda's (when authored) would honor hers. Per-box specialization without forking UI code.

**Current workaround.** Operators manually type box-specific framing into questions. Works but defeats the point of a per-box agent.

**Recommended next action.**
1. **Read order convention** for box-side agent context: `AGENTS.md` → `prompt.md` (when present) → `06_logic.md` → `07_skills_used.md` → `08_automations.md`. Authority order locked as a small Decisions Ledger entry.
2. **`_reports_ask` branches** when the slug is a box-report: assemble the box's agent context from those files (concatenated, truncated to a budget), use as the system prompt.
3. **Fallback prompt** authored at `LEDGERS/AGENTS/_box_default/prompt.md` for boxes that haven't yet been specialized — generic "client-box assistant" voice.
4. **Auth boundary**: box-side `AGENTS.md` sets the *prompt*, not the *tools*. Tool restrictions stay server-side. (Mirrors the `_BLOCKED_DELEGATION_TOOLS` pattern in `server.py`.)
5. **Stamp template** at `Auto/Client Boxes/_TEMPLATE/AGENTS.md` so authoring a new box-agent is a copy-and-edit.

**Close criteria.**
- [ ] `_reports_ask` honors per-box `AGENTS.md` when the report is a box-synthesized one.
- [ ] Hugo's box: ask end-to-end test produces an answer in Hugo's voice (vs the generic baseline) — verifiable diff.
- [ ] Default fallback prompt exists at `LEDGERS/AGENTS/_box_default/prompt.md`.
- [ ] One Decisions Ledger entry locks the read order and tool-restriction boundary.
- [ ] `page_asset_sitemap.md` §intake updated for the new per-box ask behavior.
- [ ] `LEDGERS/Drafts/intake_box_unification_plan.md` updated — Phase 2 marked complete.

**History.**
- 2026-04-30 — created. Phase 2 work explicitly deferred under `DEC-2026-04-29-008` is now on the list.

---

### PROB-2026-04-30-008 — Author Analytics Snapshot Boxes (BOX_BUS_LEDGER §8 Worked Example, Made Real)

Status: **open**
Severity: medium · Urgency: later (gated on Phase C runtime — PROB-2026-04-30-006)
Discovered: 2026-04-30 · Discovered by: Jake (paper list — "make global analytics boxes")
Affected systems: `Onboard Scripts/analytics_*.py` (7 scripts), `CCAgentindex/analytics/` (snapshot outputs), `BoxesScreen` (would gain a new box class), Box Bus router
Related files: `Onboard Scripts/analytics_source_channels.py`, `analytics_seller_performance.py`, `analytics_upcoming_events.py`, `analytics_win_loss.py`, `analytics_revenue_trends.py`, `analytics_booking_lead_time.py`, `analytics_cohort_analysis.py`
Related ledgers: [`Box Bus`](BOX_BUS_LEDGER.md) §8 (worked example), [`Decisions`](DECISIONS_LEDGER.md), [`Asset/Widget Map`](ASSET_WIDGET_MAP.md)
Owner: TBD
Blocked by: Phase C runtime (PROB-2026-04-30-006) for full triad participation; can ship as schema-only ahead of runtime
Tags: `analytics`, `box`, `box-bus`, `phase-c`

**Problem.** Each of the 7 analytics scripts produces a `CCAgentindex/analytics/<snapshot>.json`. Per the Reactive Box Network architecture, each snapshot is a **state-bearing entity** and should be a Box (own folder, own ledger, own agent, own `box.json` manifest). Today they are bare JSON files with no manifest, no agent, no ledger, and no place in the box-bus topology.

**Evidence.** `Onboard Scripts/analytics_*.py` produces 7 snapshots. None of them have corresponding `box.json` manifests or per-snapshot folders. `BOX_BUS_LEDGER.md` §8 contains a worked example (Source Channels Snapshot Box) showing exactly what this should look like — but the example has not been instantiated.

**Impact (when it ships).** Each snapshot becomes a first-class participant in the box-bus: emits an event when refreshed, subscribers can react (per-Client-Box analytics drill-downs in PROB-2026-04-30-009 hook here), the Boxes page can render snapshot boxes alongside Client/Staff boxes, and each carries its own ledger of refresh history.

**Current workaround.** `AnalyticsScreen` reads the snapshots directly via `fetch("CCAgentindex/analytics/<snapshot>.json")`. Works for the dashboard view but skips the box layer entirely.

**Recommended next action.**
1. **One snapshot box first** as the canonical pattern — start with `analytics_source_channels` since it has the worked example in BOX_BUS_LEDGER §8.
2. **Folder layout**: `CCAgentindex/analytics_boxes/source_channels/` containing `box.json`, `00_meta.json`, `snapshot.json` (the existing output), `box_ledger.md` (refresh history).
3. **Refresh path**: the Python script writes `snapshot.json` AND appends one line to `box_ledger.md` AND emits a box-bus event. The latter waits for Phase C runtime.
4. **Replicate the pattern** to the other 6 scripts.
5. **Boxes UI** gets a new kind filter: `analytics_snapshot`. Cards render with snapshot-summary (last refreshed, key metric) and a "view in Analytics page" deep link.

**Close criteria.**
- [ ] All 7 analytics outputs have `analytics_boxes/<slug>/` folders with manifests.
- [ ] Each carries its own `box_ledger.md` (refresh history append-only).
- [ ] BoxesScreen renders an `analytics_snapshot` filter.
- [ ] Existing `AnalyticsScreen` continues to work (no regression).
- [ ] When Phase C ships, each box emits on refresh.

**History.**
- 2026-04-30 — created. Realizes BOX_BUS_LEDGER §8 worked example.

---

### PROB-2026-04-30-009 — Per-Box Analytics Surface Inside Client Boxes (Phase 3 Of Intake → Box)

Status: **open**
Severity: medium · Urgency: later
Discovered: 2026-04-30 · Discovered by: Jake (paper list — "fix the boxes we're making so regular analytics show up for them inside the box")
Affected systems: `BoxesScreen`, `Auto/Client Boxes/<Name>/analytics/` (proposed), per-box analytics templates
Related files: `LEDGERS/Drafts/intake_box_unification_plan.md` (forward link Phase 3), `Onboard Scripts/analytics_*.py` (org-wide, not box-scoped — different from per-box)
Related ledgers: [`Decisions`](DECISIONS_LEDGER.md), [`Box Bus`](BOX_BUS_LEDGER.md), [`Asset/Widget Map`](ASSET_WIDGET_MAP.md)
Owner: TBD
Blocked by: not strictly blocked. Composes with PROB-2026-04-30-008 but is independent; analytics templates here read from the box's *own* files, not from org-wide Close exports.
Tags: `analytics`, `box`, `client-box`, `phase-3`, `intake`

**Problem.** Each Client Box should carry its own analytics surface — questions like "reply latency on Hugo," "plan-vs-actual on Brenda," "guardrail flag rate on Tessy" — answered from each box's own files. Today, analytics is an org-wide view (the seven `analytics_*.py` scripts), not a per-box drill-down. Boxes UI has no Analytics tab.

**Evidence.** `BoxesScreen` sections include `state / profile / comms / enrichment / 7-day plan / agents / logic` — no `analytics`. `Auto/Client Boxes/<Name>/` folders contain comms and plan files but no analytics. `LEDGERS/Drafts/intake_box_unification_plan.md` lists per-box analytics templates as Phase 3 future work.

**Impact (when it ships).** Operators can audit per-client cadence-fit, reply-latency, guardrail flags, and enrichment-vs-comms coverage from inside the Box without leaving for the global Analytics page.

**Current workaround.** Read the box's `client_ledger.md` and `01_comms.md` manually; eyeball the patterns. Slow, error-prone.

**Recommended next action.**
1. **Authoring location**: new folder `CCAgentindex/analytics/templates/` with per-template Python files. Each takes a box context (folder path) and emits `Auto/Client Boxes/<Name>/analytics/<template>.json`.
2. **First four templates** (per the Phase 1 plan §forward link):
   - `cadence_fire_vs_plan` — planned moves (`05_seven_day_plan.md`) vs actual fires (`client_ledger.md`)
   - `reply_latency_distribution` — from `01b_comms_verbatim.md` timestamps
   - `guardrail_flag_rate` — counts of "operator review needed" markers
   - `enrichment_vs_comms_coverage` — what `04_profile.md` claims vs what's backed by comms
3. **Rendering**: BoxesScreen grows an `analytics` section that reads `Auto/Client Boxes/<Name>/analytics/*.json` and renders with the chart components already in `AnalyticsScreen`.
4. **Refresh trigger**: a button on the Analytics tab; eventually box-bus event when comms or plan changes.

**Close criteria.**
- [ ] At least 4 templates implemented and producing valid JSON for at least 2 boxes (Hugo + Brenda smoke set).
- [ ] BoxesScreen renders an Analytics tab when `analytics/` folder exists.
- [ ] Charts use existing AnalyticsScreen primitives (no fork).
- [ ] `page_asset_sitemap.md` §boxes updated.
- [ ] No regression on org-wide AnalyticsScreen.

**History.**
- 2026-04-30 — created. Phase 3 of the Intake → Box arc.

---

### PROB-2026-04-30-010 — GPT Ledger-Digest Agent Hosted On GitHub Repo

Status: **open**
Severity: medium · Urgency: later
Discovered: 2026-04-30 · Discovered by: Jake (paper list — "GPT agent connected to the GitHub version of our repository that sweeps all the different ledgers and compresses them into an easy-to-understand report")
Affected systems: external (web-mode AI client via GitHub MCP), all `LEDGERS/*.md` files as input, the GitHub oscillation transport
Related files: `LEDGERS/Drafts/github_oscillation_proposal.md`, every ledger
Related ledgers: [`Decisions`](DECISIONS_LEDGER.md), [`Communications`](COMMUNICATIONS_LEDGER.md), [`Box Bus`](BOX_BUS_LEDGER.md) (later — when digest emits a bus event)
Owner: TBD
Blocked by: GitHub oscillation proposal (Drafts/) needs to land as a Decisions Ledger entry first so the actor identity (`actor=chatgpt_mcp`) and authority table are codified.
Tags: `web-mode`, `github-mcp`, `digest`, `external-agent`

**Problem.** Need a GPT agent (or similar web-mode AI) that runs against the GitHub copy of the repo, sweeps all ledgers, and produces a periodic plain-English digest — "what's the state of the project, what changed this week, what's blocked, what needs attention." A first-class read-only consumer of the ledger system, hosted entirely on the web side.

**Evidence.** Currently no automated digest exists. Operators who want a synthesis manually skim 16+ ledgers across `LEDGERS/`. Misses cross-ledger patterns (e.g., "every closed Open Problem this week was about documentation drift").

**Impact (when it ships).** Operator + new contributors get one place to land for "current project state" without reading the full Global Ledger / Temporal Continuity / Open Problems / Decisions chain. Especially valuable for the team handoff use case.

**Recommended next action.**
1. **First decision**: where does the digest live? Options: (a) GitHub Action that commits the output to `LEDGERS/Digests/<date>.md`, (b) ClickUp-hosted artifact (composes with PROB-2026-04-30-011), (c) email/Slack delivery. Pick one — `(a)` recommended as cheapest and auditable.
2. **Schedule**: weekly is the right default; daily is too noisy, monthly is too late.
3. **Read scope**: all `LEDGERS/*.md` + `LEDGERS/PAGES/*.md` + `_ledger/activity.jsonl` (last 7 days). Excludes: code, drafts.
4. **Output template**: project status (1 paragraph) → recent decisions → recently closed problems → recently opened problems → ledger drift watch → handoffs/communications worth flagging → next session priorities.
5. **Authority**: read-only against GitHub MCP. Writes only to its own digest output file. Codified in the oscillation Authority Table.

**Close criteria.**
- [ ] Operator brief authored at `LEDGERS/AGENTS/_external/digest_agent_brief.md` (system prompt the operator pastes into the GPT client).
- [ ] At least one digest run produced a useful output for human review.
- [ ] Digest cadence defined and committed (e.g., GitHub Actions cron or operator-triggered).
- [ ] Activity-ledger entries from the digest agent show `actor=chatgpt_mcp` (or equivalent).
- [ ] Composes cleanly with PROB-2026-04-30-001 (web-mode profile) and the oscillation proposal.

**History.**
- 2026-04-30 — created.

---

### PROB-2026-04-30-011 — Compile Credential / Resource Inventory For ClickUp Team Surface

Status: **open**
Severity: medium · Urgency: soon
Discovered: 2026-04-30 · Discovered by: Jake (paper list — "find all the passwords, sites, files, and keys and everything so I can make a locked site on ClickUp")
Affected systems: every credential the project touches, every external resource (sites, dashboards, docs), team onboarding flow
Related files: `.env`, `LEDGERS/CONNECTIONS.md` (closest existing surface — has 11 active services with credential maps), `LEDGERS/SETTINGS.md` (`.env` keys catalog)
Related ledgers: [`Connections`](CONNECTIONS.md), [`Settings`](SETTINGS.md), [`Source-of-Truth`](SOURCE_OF_TRUTH.md)
Owner: Jake (operator-driven; no agent should compile credentials without explicit per-credential approval)
Tags: `security`, `credentials`, `documentation`, `team-handoff`, `clickup`

**Problem.** The project depends on credentials (Close API key, OpenAI API key, Twilio, Slack, ClickUp, Google Workspace, GitHub PAT, Anthropic API, ngrok, Cloudflare, Pieces local config, etc.), files (Quote Maker CSV, Comeketo PRD, etc.), sites (Close.com, Slack workspace, ClickUp space, Google Drive), and keys distributed across `.env`, password managers, and operator memory. **No single team-readable inventory exists.** When new contributors join (or an existing one needs to find something), they hunt.

**Evidence.** `.env` carries credentials but isn't team-readable. `LEDGERS/CONNECTIONS.md` lists services + credential names but doesn't include the actual sites/files/keys layer. No ClickUp doc currently catalogs project resources.

**Impact.**
- New-contributor onboarding takes longer than necessary.
- Loss-of-bus-factor risk: if the operator is unavailable, key locations are not recoverable.
- Audit-trail risk: who has which credentials is not documented.

**Current workaround.** Operator memory + scattered notes.

**Recommended next action.** Two-step:
1. **Compile the inventory inside the repo first** as `LEDGERS/CREDENTIAL_INVENTORY.md` (or a name TBD — possibly `RESOURCE_INVENTORY.md` since it's broader than credentials):
   - **Sites**: name, URL, what it's for, who has access, where the credential lives (1Password / .env / ClickUp).
   - **Credentials**: name, where stored, who has it, rotation cadence, what it grants.
   - **Files**: project-significant external files (CSVs, PDFs, design assets), where they live, who owns them.
   - **Keys**: API keys, tokens, certs — pointer only, never the value itself.
2. **Mirror to ClickUp**: a locked ClickUp space (per Jake's stated intent) that team members can read but not edit. The repo file is the source of truth; the ClickUp page is the rendered view.

**Close criteria.**
- [ ] `LEDGERS/CREDENTIAL_INVENTORY.md` (or named equivalent) committed with full inventory across the four categories.
- [ ] Every credential pointer references the storage location, not the value.
- [ ] ClickUp locked surface created and synchronized with the repo file.
- [ ] CONNECTIONS.md cross-references this file for credential-storage details.
- [ ] Team-handoff section in TCL / GLOBAL points new contributors at this surface.

**History.**
- 2026-04-30 — created. Operator-driven; no agent compiles credentials autonomously.

---

### PROB-2026-04-30-012 — Send Rhonna The 7-Day Setup Guardrails

Status: **open**
Severity: low · Urgency: soon
Discovered: 2026-04-30 · Discovered by: Jake (paper list — "send Rhonna the guardrails for our 7-day setup")
Affected systems: external (Rhonna's role on the Comeketo team), 7-day cadence handoff
Related files: `Auto/comeketo-inbox/` (NEPQ skill + ballpark calculator), `comeketo-guardrails-agent.md` (project root), `Guardrails.html` (project root), per-box `05_seven_day_plan.md` for cadence patterns
Related ledgers: [`Communications`](COMMUNICATIONS_LEDGER.md) (where the handoff record will land once sent)
Owner: Jake
Tags: `outbound`, `team-handoff`, `guardrails`, `cadence`

**Problem.** Rhonna needs to be brought up to speed on the 7-day cadence guardrails — what's a hard gate (fee waivers, discounts, scope promises), what auto-pauses (replies → plan stale), reply gates, frequency caps. Currently this knowledge lives across `Auto/comeketo-inbox/` skill files, `Guardrails.html`, and operator memory. Rhonna doesn't have it yet.

**Evidence.** No record of a guardrails handoff to Rhonna in `_ledger/activity.jsonl`, `LEDGERS/COMMUNICATIONS_LEDGER.md`, or any client-box ledger.

**Impact.** Until Rhonna has the guardrails, any 7-day setup she touches risks violating them — the same `COMM-2026-04-28-003` Brenda fee-waiver lesson loop (Decisions Ledger DEC-2026-04-28-005) but for a wider operator surface.

**Recommended next action.**
1. **Prepare a shareable summary** of the 7-day guardrails — distilled from `comeketo-guardrails-agent.md` and `Guardrails.html`. One page, plain language. Sample shape: hard gates · auto-pauses · reply gates · calendar reality · frequency caps · approval requirements.
2. **Choose a delivery surface**: ClickUp doc (composes with PROB-2026-04-30-011) is recommended so it lives where Rhonna already works. Slack or email also viable.
3. **Send + log**: deliver, then append a `COMM-2026-04-30-XXX` Communications entry recording what was sent, when, to whom, and where it lives.

**Close criteria.**
- [ ] Guardrails summary authored (location TBD — likely `LEDGERS/Outbound/rhonna_7day_guardrails.md` or directly in ClickUp).
- [ ] Sent to Rhonna via the chosen channel.
- [ ] Communications Ledger entry recording the handoff.
- [ ] Activity ledger entry with the timestamp and delivery channel.

**History.**
- 2026-04-30 — created. (Operationally a TODO; tracked as an Open Problem because every open problem needs close criteria, and OPL is the most disciplined surface for "this isn't done yet.")

---

### PROB-2026-04-30-013 — Supabase Mode-Gated Integration (Web Default, Local Optional)

Status: **open**
Severity: medium · Urgency: later
Discovered: 2026-04-30 · Discovered by: Jake (paper list — "figure out how to integrate Supabase into the web version of this but not the regular version. But if we did both, it'd be fine as long as we have priority on the local version")
Affected systems: web-mode hosting, server-side state for web users, possibly profile system, possibly Pieces alternative (web mode has no Pieces)
Related files: `server.py`, `LEDGERS/CONNECTIONS.md` (Supabase currently `not-in-use`)
Related ledgers: [`Connections`](CONNECTIONS.md), [`Decisions`](DECISIONS_LEDGER.md), [`Source-of-Truth`](SOURCE_OF_TRUTH.md)
Owner: TBD
Blocked by: PROB-2026-04-30-001 (mode detection + profiles must land first; Supabase integration depends on the mode flag and the web-side profile/identity that determines whose data goes where)
Tags: `architecture`, `web-vs-local`, `supabase`, `connection`, `profiles`

**Problem.** Web mode has no Pieces (per PROB-2026-04-30-001). It needs a server-side state surface for memory/recall/per-user data. **Supabase is the proposed answer for the web tier**; local tier keeps Pieces as primary. The principle: **local always takes priority. Supabase is web-only by default but optionally enabled in local without disrupting the local primary.**

**Evidence.** `LEDGERS/CONNECTIONS.md` shows Supabase as `not-in-use` with grep evidence (no Supabase imports in `server.py` or `*.jsx`). The MCP connector exists; the repo doesn't use it.

**Impact (when it ships).** Web users get persistence + memory. Local users keep their existing setup unaffected. Mode-gating prevents accidental web-config drift into local and vice versa.

**Current workaround.** Web mode has no persistence. Pre-PROB-001-fix, this is invisible because web mode isn't deployed.

**Recommended next action.** Sequenced on top of PROB-2026-04-30-001:
1. **Mode detection lands first** (PROB-001 close criterion).
2. **Decisions Ledger entry** locking: Supabase is web-default-ON, local-default-OFF, both-allowed-with-local-priority. What "priority" means concretely (e.g., on conflict between Supabase state and local state, local wins; Supabase becomes a remote replica).
3. **Connection design**: which tables? what schema? Map each Supabase table to a local-equivalent surface (Pieces query, file in `CCAgentindex/`, etc.) so the priority rule has a concrete on-conflict resolver.
4. **CONNECTIONS.md updated**: Supabase status flips from `not-in-use` → `optional (web-default)`.
5. **Auth model**: Supabase auth in web mode binds to the active profile (PROB-001 dependency) so per-user state is correctly partitioned.

**Close criteria.**
- [ ] Mode detection live (PROB-001 closed or substantially landed).
- [ ] Decisions Ledger entry codifying Supabase priority + scope.
- [ ] Schema designed and implemented for at least one read/write surface (e.g., user preferences).
- [ ] CONNECTIONS.md status flipped.
- [ ] Conflict-resolver tested: same row touched in both Supabase and local; local wins; audit trail preserved.

**History.**
- 2026-04-30 — created. Composes with PROB-2026-04-30-001.

---

### PROB-2026-04-30-014 — Box Snapshot Versioning Surfaced In App UI (Via Git History)

Status: **open**
Severity: medium · Urgency: later
Discovered: 2026-04-30 · Discovered by: Jake (paper list — "figure out how to add snapshot versioning")
Affected systems: BoxesScreen, IntakeReportDetail (Box Reports inherit), `_box_report_synthesize`, `git log` consumers, possibly oscillation transport
Related files: `LEDGERS/Drafts/github_oscillation_proposal.md` (§5/§9 reference snapshot navigation), `Auto/Client Boxes/<Name>/`, server.py (would need new endpoints), every box folder
Related ledgers: [`Decisions`](DECISIONS_LEDGER.md), [`Box Ledger`](BOX_LEDGER.md), [`Source-of-Truth`](SOURCE_OF_TRUTH.md)
Owner: TBD
Blocked by: not strictly blocked, but composes most cleanly with the GitHub oscillation proposal landing as a Decisions Ledger entry first
Tags: `architecture`, `snapshots`, `time-travel`, `git`, `box`

**Problem.** Operators want **time-travel** for boxes — "what did Hugo's plan look like a week ago?" "what was Brenda's box state before the fee-waiver pivot?" Today the only way to answer is `git log -- "Auto/Client Boxes/<Name>/"` plus `git show <sha>:<path>` — power-user CLI ritual, not a UI surface.

**Evidence.** No `/api/boxes/<id>/history` endpoint. No "as of" picker on the Boxes page or Box Reports. Git already contains the snapshot history (every commit *is* a snapshot) but the app doesn't expose it.

**Impact (when it ships).** Boxes become time-travelable. Box Reports inherit for free (synthesize from a historical box state via git). Audit trails become operator-visible. Composes with the oscillation proposal — every commit on either side becomes a navigable point.

**Architectural note.** The earlier conversation explicitly rejected "make Box Reports themselves snapshots" in favor of "snapshot the canonical box; let derived views be time-travelable for free." This entry follows that posture. **Git is the snapshot service; the app surfaces git history.** No parallel snapshot store, no drift surface.

**Recommended next action.**
1. **Two new endpoints in `server.py`**:
   - `GET /api/boxes/<id>/history` — runs `git log --pretty=format:... -- "Auto/Client Boxes/<folder>/"` and returns commit SHAs + dates + messages + summary stats per commit.
   - `GET /api/boxes/<id>/at/<sha>` — synthesizes a box payload from `git show <sha>:<path>` for each file in the box. Reuses `_box_report_synthesize` against historical content.
2. **UI affordance**: Boxes page header + Box Report header gain an "as of [date]" picker that defaults to "now." Selecting a past date drives the synthesis through the `at/<sha>` endpoint.
3. **Per-box change ledger** (proposed): `_ledger/box_changes.jsonl` accumulates `{ts, box_id, file_rel, action, commit_sha, actor}` lines. Git tells you "what changed in commit X"; this ledger tells you "what happened to *this box* across dates Y..Z." UI-friendly history without spelunking git.
4. **Commit hygiene** (per oscillation proposal §6): every box-touch ends in a commit before the next session-touch starts. The system only works if commits actually happen.

**Close criteria.**
- [ ] `/api/boxes/<id>/history` and `/api/boxes/<id>/at/<sha>` endpoints implemented and tested.
- [ ] BoxesScreen + IntakeReportDetail expose the "as of" picker.
- [ ] `_ledger/box_changes.jsonl` accumulates per-box change entries.
- [ ] Operator can scrub through a Client Box's last 30 days from the UI without dropping to terminal.
- [ ] No drift surface introduced (git remains the only source of historical state).
- [ ] `page_asset_sitemap.md` §boxes + §intake updated.

**History.**
- 2026-04-30 — created. Earlier conversation locked the principle: **snapshot the canonical box, not the derived views**. Git is the snapshot service.

---

### PROB-2026-04-30-015 — Atlas Sweep Steward Not Yet Runnable

Status: **open**
Severity: medium · Urgency: soon
Discovered: 2026-04-30 · Discovered by: Cowork session (claude_cowork_session_2026-04-30) — surfaced when Jake flagged that Atlas (Pieces MCP daily-folder output) is operator ground truth that should be integrated into the ledger system
Affected systems: project ledger discipline; drift detection; decision-context preservation; atom backlog source; the new `LEDGERS/BOXES/atlas/` Box class
Related files: `LEDGERS/BOXES/atlas/box.json`, `LEDGERS/BOXES/atlas/BOX.md`, `LEDGERS/BOXES/atlas/steward/AGENTS.md`, `LEDGERS/BOXES/atlas/steward/prompt.md`, `LEDGERS/BOXES/atlas/steward/config.json`, `LEDGERS/atlas/` (alias to `/Users/jakeaaron/Documents/Atlas/`), `server.py _agent_resolve_prompt`
Related ledgers: [`COMMUNICATIONS_LEDGER`](COMMUNICATIONS_LEDGER.md) COMM-2026-04-30-007 (architecture decision), [`SOURCE_OF_TRUTH`](SOURCE_OF_TRUTH.md), [`BOX_LEDGER`](BOX_LEDGER.md), [`ATOMS`](ATOMS.md) (atomization candidate — same chain pattern as PROB-005 stewards)
Owner: TBD (atomization candidate; mirrors the file_directory / north_star promotion shape)
Tags: `architecture`, `steward`, `ground-truth`, `phase-b`, `drift-detection`

**Problem.** Atlas (`/Users/jakeaaron/Documents/Atlas/`) is the Pieces MCP daily-folder output — operator-actual-machine-activity ground truth, accumulating since at least 2026-04-24. The Atlas Box (`LEDGERS/BOXES/atlas/`) was authored 2026-04-30 to formalize Atlas as a project surface and govern the read-side contract. The steward files (`AGENTS.md`, `prompt.md`, `config.json`) are staged but the steward has never run. Until it runs, the project has no automated drift-detection between agent ledger writes and operator-actual-activity.

**Evidence.** Box created 2026-04-30 with full 6-file scaffold per the established unified-Box pattern. `_agent_resolve_prompt` helper (added in ATOM-2026-04-30-0029) already supports the path; in-process simulation confirms `atlas_sweep_steward` would resolve to `LEDGERS/BOXES/atlas/steward/prompt.md`. No invocation has fired. No receipts exist in `receipts/`.

**Impact.**
- **Drift accumulates silently.** Without periodic Atlas sweeps, the gap between agent claims and operator reality grows day-over-day. The longer the gap, the harder to reconcile.
- **Decision context vanishes.** Pieces captures conversational reasoning that doesn't survive the trip into clean DEC entries. Without sweeping, that context lives only in chat scroll.
- **Atom backlog stays manual.** Pieces "Next Steps" sections are operator-generated action lists that should become atom candidates. Currently they require manual extraction.
- **Cold-start orientation is harder than necessary.** New sessions could read the latest Atlas summaries to get a faster sense of "what's actually happening" than reading every PROB / COMM / TCL update. Currently they have to do the latter.

**Current workaround.** Manual sweep — agents can read `LEDGERS/atlas/<today's folder>/` directly when context check is needed. Inefficient but functional. The first-pass demo sweep at the bottom of the COMM-2026-04-30-007 author session showed the value of even a single manual pass.

**Recommended next action.** Atomize this PROB into the same chain pattern as the four Phase B stewards already promoted (file_directory, open_problems, north_star, etc.):

1. **ATOM (smoke test)** — Dispatch `POST /api/agents/atlas_sweep_steward/run` in `audit_only` mode against today's Atlas folder. Verify it resolves via `_agent_resolve_prompt`, reads the folder, applies the relevance filter, produces a receipt. Effort: 30min.
2. **ATOM (INDEX flip)** — Add `atlas_sweep_steward` row to `INDEX.md` with status active. Effort: 15min.
3. **ATOM (first reconcile run)** — Dispatch in `reconcile` mode against the past week of Atlas folders; produce drift PROBs + handoff COMMs + atom drafts. Effort: 1h. Output is the inaugural baseline.
4. **ATOM (cron / trigger)** — Wire a daily-end-of-day automatic dispatch via `CCAgentindex/triggers/`. Effort: 30min.
5. **Optional ATOM (reconcile UI surface)** — Surface the sweep findings on a UI page (likely under `automation` sub-tab or a new `atlas` route). Effort: 2h. Defer until manual sweeps are valuable enough to justify a render.

**Close criteria.**
- [ ] `atlas_sweep_steward` has run at least once in `audit_only` mode and produced a receipt at `LEDGERS/BOXES/atlas/receipts/`
- [ ] `INDEX.md` lists the steward as active
- [ ] At least one `reconcile` run has produced live PROB / COMM appends with `tag:atlas-drift` or equivalent
- [ ] Atom-candidate drafts have appeared at `LEDGERS/DRAFTS/ATOMIZATION/atlas_atoms_<date>.md`
- [ ] A cron / trigger fires the steward daily (not strictly required for closure, but recommended)
- [ ] `LEDGERS/BOXES/atlas/box.json` `phase_status.phase_b` flips from `in_progress` to `complete`

**History.**
- 2026-04-30 — created. Atlas Box authored same session; steward staged but not yet smoke-tested. Same chain pattern as the four Phase B steward promotions completed earlier today (ATOM-0028 → 0029 → 0030 → 0031 for temporal_continuity, etc.).

---

### PROB-2026-04-28-015 — Migrate Auto/ Contents Into CCAgentindex/ → CLOSED via Symlink

Status: **closed (via symlink approach)**
Closed: 2026-04-28
Severity at creation: high · Urgency at creation: later

**Resolution.** Jake proposed the elegant solution mid-discussion: instead of moving content (heavyweight, risky to active scheduled fires), **symlink the six Auto/ subdirectories into `CCAgentindex/` as relative aliases**. The agent's bedrock now contains the access paths it needs for memory; Auto/ remains where the orchestrator owns it; nothing physically moved.

**What was created (6 relative symlinks under `CCAgentindex/`):**

| Bedrock-side path | Target | Visible items |
|---|---|---|
| `CCAgentindex/Boxes` | `../Auto/Boxes` | 2 |
| `CCAgentindex/Client Boxes` | `../Auto/Client Boxes` | 28 |
| `CCAgentindex/comeketo-inbox` | `../Auto/comeketo-inbox` | 5 |
| `CCAgentindex/Onboard Scripts` | `../Auto/Onboard Scripts` | 24 |
| `CCAgentindex/orchestrator` | `../Auto/orchestrator` | 11 |
| `CCAgentindex/Staff Boxes` | `../Auto/Staff Boxes` | 10 |

Resolution chain: `CCAgentindex/Client Boxes` → `../Auto/Client Boxes` → (Auto/ is itself a symlink) → `/Users/jakeaaron/Desktop/Auto/Client Boxes`. macOS chains symlinks natively.

**Why this closes the problem:**
- ✅ Agent reads `CCAgentindex/` as its bedrock and finds Boxes, Client Boxes, comeketo-inbox, Onboard Scripts, orchestrator, Staff Boxes — the full memory surface.
- ✅ `server.py` `AUTO_ROOT` constants keep working unchanged (paths still resolve via `Auto/`).
- ✅ Active scheduled fires + seven-day cadence undisturbed (zero content moved).
- ✅ `Auto/orchestrator/bin/_lib.py` relative pathing unchanged (still resolves correctly).
- ✅ Reversible via `unlink` if needed.
- ✅ Auto/ remains the orchestrator's owned territory per CLAUDE.md §1.

**Caveats noted:**
- `CCAgentindex/Boxes` aliases `Auto/Boxes/`, which is the questionable mirror flagged in **PROB-012** (status: needs-verification). The alias just provides access; PROB-012 still applies — agents reading `Boxes` should still treat its contents as needs-verification until Jake clarifies.
- `Auto/Onboard Scripts/` is the canonical/working set per corrected PROB-013 understanding. The bedrock alias points to the right one.

**What this defers (not what was originally deferred to Wednesday).** The original "Wednesday with Opus" plan was a heavyweight content migration. Jake's symlink approach replaces that. Wednesday can now focus on whatever else Jake had on his list (likely the seven-day cadence work he mentioned). If a true content migration is ever needed, this problem can be reopened — but the bedrock-access concern that drove it is resolved.

**Verification evidence.**
- 6 symlinks created with `ln -s "../Auto/<name>" "<name>"` from inside `CCAgentindex/`.
- Each link resolves correctly: spot-checked `CCAgentindex/Client Boxes/Brenda & Steve/` reads `00_meta.json`, `01_comms.md`, `01b_comms_verbatim.md`, etc. exactly like `Auto/Client Boxes/Brenda & Steve/`.
- Spot-checked `CCAgentindex/comeketo-inbox/` reads `SKILL.md`, `references/`, `scripts/`, `assets/`.
- Item counts match expectations (28 client boxes, 10 staff boxes, 24 onboard scripts, etc.).

History:
- 2026-04-28 — created with status `deferred` (Wednesday 2026-04-29 with Opus).
- 2026-04-28 — Jake proposed symlink approach mid-conversation.
- 2026-04-28 — closed via 6 relative symlinks under `CCAgentindex/`. Heavyweight content migration no longer required for the agent-memory concern.

---


Discovered: 2026-04-28 · Discovered by: Jake (migration goal stated during cleanup conversation)
Affected systems: `Auto/Client Boxes/` (28 boxes), `Auto/Staff Boxes/` (10), `Auto/orchestrator/` (runtime), `Auto/comeketo-inbox/` (skill), `server.py` (AUTO_ROOT hardcoded), `Auto/orchestrator/bin/_lib.py` (relative pathing), `voice.py`, scheduled fires, seven-day plan cadence
Related files (at risk): `server.py` lines 41–44 (`AUTO_ROOT`, `AUTO_CLIENT_BOXES`, `AUTO_STAFF_BOXES`, `AUTO_ORCH_STATE`); `Auto/orchestrator/bin/_lib.py` line 27 (`AUTO = ROOT.parent`); `Auto/orchestrator/bin/voice.py` line 5 (`Auto/Staff Boxes/<voice>/...`); 10 `server.py` references to `AUTO_*`; `/api/boxes/*` endpoints
Related ledgers: File Directory Ledger §4.1, North Star NS-03 + NS-05
Owner: Jake (decision required Wednesday)
Blocked by: Active seven-day setup (Brenda plan + scheduled fires anchored to Day 1 = Monday 2026-04-27); migration would disrupt cadence; revisit after Opus access restored
Tags: `directory`, `migration`, `safety`, `automation`, `bedrock`, `deferred`

**Problem.** Everything in `Auto/` should eventually live under `CCAgentindex/` — Client Boxes, Staff Boxes, orchestrator, inbox skill. `Auto/` is currently a symlink to `/Users/jakeaaron/Desktop/Auto/`, owned by the team's standalone automation folder. The split is a friction point: bedrock (`CCAgentindex/`) is the only filesystem state the app owns, but Client Box truth lives outside it under `Auto/`.

**Evidence.** Jake stated 2026-04-28 cleanup conversation: "all of the stuff that's living in the auto folder needs to actually be brought into this directory. /Users/jakeaaron/Downloads/CC Agent/CCAgentindex. Like all the boxes, all the information in there needs to be brought here, but I was worried because I didn't know how the automations were set up."

**Path-reference inventory (from 2026-04-28 survey).** Code that hardcodes `Auto/` paths:

- `server.py` lines 41–44: `AUTO_ROOT = HERE / "Auto"`, `AUTO_CLIENT_BOXES = AUTO_ROOT / "Client Boxes"`, `AUTO_STAFF_BOXES`, `AUTO_ORCH_STATE`. Plus 10 references throughout (lines 4441, 4443, 4786, etc.).
- `Auto/orchestrator/bin/_lib.py` line 27: `AUTO = ROOT.parent` — relative pathing from `bin/` upward, would still work after move if directory structure preserved.
- `Auto/orchestrator/bin/voice.py` line 5: docstring references `Auto/Staff Boxes/`.
- `mission_control_loader.js`: zero direct refs (data flows via `/api/boxes/*`).
- `screens.jsx`: zero direct refs.
- `CCAgentindex/triggers/`: zero direct refs.
- `CCAgentindex/scheduled_tasks/`: zero direct refs.
- Top-level `Onboard Scripts/`, `Auto/Onboard Scripts/`: zero hardcoded `Auto/` refs.

**Impact.** Currently low-friction (symlink works) but:
- Two source-of-truth paths for the same content (file tree feels split).
- The `Auto/` symlink target is outside the main repo's git scope — writes through it don't appear in `git status` of the main repo.
- Conceptually violates NS-03 + the "bedrock owns app state" principle from CLAUDE.md §1.

**Migration options (all deferred — Wednesday discussion):**

- **Option A — Sever symlink, copy contents into bedrock.** Copy `Auto/Client Boxes/`, `Staff Boxes/`, `orchestrator/`, `comeketo-inbox/` into new homes under `CCAgentindex/` (e.g. `CCAgentindex/client_boxes/`, `CCAgentindex/staff_boxes/`, etc.). Update `server.py` constants. Risk: high (live scheduled fires, active seven-day plan cadence).
- **Option B — Symlink CCAgentindex/auto → /Users/jakeaaron/Desktop/Auto/.** Same content, new access path. Cosmetic; doesn't really solve the bedrock-ownership concern.
- **Option C — Restructure into bedrock domains.** Each Client Box becomes part of `CCAgentindex/people/<slug>/box/`, treating clients as an extension of the existing people taxonomy. Most aligned with NS-03 but biggest blast radius — touches loader, schemas, render_lead, BoxesScreen.
- **Option D — Hybrid: keep Auto/ for orchestrator runtime, migrate boxes only.** Move `Auto/Client Boxes/` and `Auto/Staff Boxes/` into bedrock; leave `Auto/orchestrator/` alone since it's actively running scheduled fires.

**Current workaround.** Live with the split until Wednesday. The seven-day cadence (Brenda plan anchored to Day 1 = Monday 2026-04-27, currently Day 2) keeps running undisturbed. File Directory Ledger §4.1 documents the current shape.

**Recommended next action.** **Wednesday 2026-04-29 with Opus access restored:** pick a migration option, plan phased rollout, ensure scheduled fires can be paused safely during cutover, run the migration, update `server.py` constants, verify scheduled fires resume correctly.

**Close criteria.**
- Migration option selected (A/B/C/D or other).
- Phased plan agreed (pause cadence → migrate → verify → resume).
- All `Auto/` path references in code updated.
- Scheduled fires + seven-day cadence resume cleanly.
- File Directory Ledger §4.1 + §3 updated.
- This problem moves to Recently Closed.

History:
- 2026-04-28 — created. Status: deferred. Path-reference survey completed (no code outside `server.py` and `Auto/orchestrator/bin/` hardcodes `Auto/`). Revisit Wednesday with Opus.

---

### PROB-2026-04-28-014 — Two Identical `Comeketo Agent/` Folders → CLOSED

(Moved to §10 Recently Closed below.)

---

## 6. Problems By System

### Client Boxes
- PROB-001 Allowed-To-Know Constraint Not Implemented (critical) — **partial** as of 2026-04-29 (schema exists in SOURCE_OF_TRUTH §4; implementation criteria remain)
- PROB-002 Active Client Boxes Need Guardrail Audit (high · in-progress)
- PROB-005 Full Phone Transcripts Not Yet Integrated (partial — infra landed, integration remains)
- PROB-006 Plan Rewrite Trigger After Inbound Needs Formalization (high)
- PROB-007 Historical Inbound Detection May Be Noisy (needs-audit)
- PROB-2026-04-30-007 Per-Box Agent Configuration In Box Folders (medium · soon · Phase 2 of Intake → Box, deferred under DEC-2026-04-29-008)
- PROB-2026-04-30-009 Per-Box Analytics Surface Inside Client Boxes (medium · later · Phase 3 of Intake → Box)

### Automation / Approval
- PROB-003 Approval Flow Does Not Yet Isolate Risky Moves (critical)
- PROB-006 Plan Rewrite Trigger After Inbound Needs Formalization (high)

### Git / Repo Workflow
- PROB-004 GitHub Direct Writes Can Conflict With Local Unpushed Work (medium)

### Documentation Drift
- PROB-010 CLAUDE.md Surviving-Domains List Is Out of Date (high · needs-decision)
- PROB-2026-04-30-011 Compile Credential / Resource Inventory For ClickUp Team Surface (medium · soon · operator-driven; no agent compiles credentials autonomously)
- ~~PROB-011 docs/page_asset_sitemap.md Is Stale~~ — **closed 2026-04-30** (see §10)

### Directory Cleanup / Duplicates
- PROB-012 Auto/Boxes/ Mirror Purpose Unclear (medium · needs-verification)
- PROB-013 Onboard Scripts/ — Auto/ canonical, top-level legacy being rewritten (low · triaged · watch)
- ~~PROB-014 Two Comeketo Agent/ Folders~~ — **closed 2026-04-28** (renamed top-level to `Aesthetic Asset Kit/`)

### Architecture / Migration
- PROB-016 CCAgentindex/ Bedrock Was Bootstrapped On The Fly — Needs Triad-Based Reconciliation (high · needs-decision · later · blocked on ledger + sub-agent buildout)
- PROB-2026-04-30-013 Supabase Mode-Gated Integration — Web Default, Local Optional (medium · later · blocked on PROB-2026-04-30-001 mode detection)
- PROB-2026-04-30-014 Box Snapshot Versioning Surfaced In App UI Via Git History (medium · later · git is the snapshot service)
- ~~PROB-015 Migrate Auto/ Contents Into CCAgentindex/~~ — **closed 2026-04-28** via 6 relative symlinks (Auto subdirs aliased into bedrock)

### Subagent / Steward Fleet (Phase B)
- PROB-2026-04-30-005 Promote Remaining Steward Sub-Agent Packages To Runnable App Agents (medium · soon · 4 of 5 steward packages still drafts; only `global_ledger_steward` is runnable)

### Box Bus Runtime / Phase C
- PROB-2026-04-30-006 Begin Box Bus Runtime Build — DEC-013 Phase C (high · later · blocked on PROB-2026-04-30-005)
- PROB-2026-04-30-008 Author Analytics Snapshot Boxes — BOX_BUS_LEDGER §8 worked example made real (medium · later · gated on PROB-2026-04-30-006 for full triad participation, can ship schema-only ahead)

### Execution Context / Capability Surface
- PROB-2026-04-30-001 Web-vs-Local Execution Context: Capability Surface Differs, No Profile System, Pieces Becomes Useless In Web (high · soon · sweep-blocked-on-nothing · implementation-gated-on-profile-design)

### External / Web-mode Agents
- PROB-2026-04-30-010 GPT Ledger-Digest Agent Hosted On GitHub Repo (medium · later · blocked on GitHub oscillation proposal landing as Decisions Ledger entry)

### Outbound / Team Handoff
- PROB-2026-04-30-012 Send Rhonna The 7-Day Setup Guardrails (low · soon · operator-driven)

### UI / Page Audit Drift
- PROB-2026-04-30-002 IdeasTray on `grid` Home Page → Rebuild As Soonest-First Action Timeline (medium · later · triaged · target spec captured)
- PROB-2026-04-30-003 FrontPage Carries Significant Dead Code From Pre-Trim 3x3 Decision Grid Era (low · later · cleanup-deferred-until-PROB-002-resolves)
- PROB-2026-04-30-004 IdeasTray Sweep Output Appears Stale — Same Content For Days (medium · soon · suspected-bug-not-yet-root-caused)

### Ground-Truth Reconciliation
- PROB-2026-04-30-015 Atlas Sweep Steward Not Yet Runnable (medium · soon · atomization-candidate · same chain pattern as PROB-005 steward promotions)

### Connections
- PROB-009 Optional Connections Need Verification (low · needs-verification)

---

## 7. Blocked Problems

| Problem | Blocked By | Next Unblock |
|---|---|---|
| PROB-001 Allowed-To-Know Constraint | schema decision | design Source-of-Truth / allowed_to_use schema |
| PROB-005 Transcripts integration (remaining 50%) | UI binding decision + plan-aging rule (PROB-006) | wire `01b_comms_verbatim.md` into `BoxesScreen` |
| PROB-003 Approval Cards | UI/workflow decision | design approval-card standard + risk taxonomy |
| PROB-006 Plan Rewrite Trigger | schema decision (`plan_status` field) + sibling-schema check | add field to box schema, then implement sweep logic |
| PROB-010 CLAUDE.md domains list | Jake decision (Option A/B/C) | Jake review + sync |
| PROB-012 Auto/Boxes/ purpose | Jake clarification | Jake review |
| PROB-016 Bedrock triad reconciliation | ledger + sub-agent buildout completion | finish ledgers, finish sub-agents, then run reconciliation pass |

Blocked problems should not disappear. They should wait visibly.

---

## 8. Partially Fixed Problems

### PROB-005 Full Phone Transcripts Not Yet Integrated — partial fix 2026-04-28

**What was fixed (50%):**
- Verbatim comms backfill landed across all 28 client boxes (582 raw activity payloads).
- `01b_comms_verbatim.md` chronological narrative + `comms/<type>_<date>_<id>.json` raw per box.
- Source-of-truth priority order updated in `FILE_DIRECTORY_LEDGER.md` §4.3.
- Pull script preserved at `outputs/pull_full_comms.py`.

**What remains open:**
- Boxes UI page binding (`server.py` line 4717 still reads `01_comms.md` only).
- Automation reading protocol (`comms_state_sweep.py`).
- Plan rewrite trigger (PROB-006).
- Per-box `client_ledger.md` does not yet reflect verbatim availability.

### Brenda & Steve Client Box — partial fix 2026-04-28 (local)

This is a *local* partial fix specific to one box, but the pattern is the template for PROB-002 work.

**What was fixed:**
- Stale schedule labels removed from `05_seven_day_plan.md`.
- Future fee/no-charge language gated.
- Future enrichment leakage reduced.
- Audit marker added at `Auto/Client Boxes/Brenda & Steve/2026-04-28_audit_marker.md`.
- `Audit-cleaned: 2026-04-28 01:40 AM ET` line prepended to plan.
- Safety Status block added to plan stating "usable only with the inbox guardrails loaded before every future outbound."

**What remains open (global):**
- Allowed-to-know layer not implemented (PROB-001) — Brenda's box is manually audited but the systemic guard doesn't exist.
- Approval-card workflow not implemented (PROB-003).
- 27 other boxes still un-audited (PROB-002).

This is useful because **local cleanup can reduce risk without solving the systemic problem.** Brenda is safe today; the architecture isn't safe in general yet.

---

## 9. Recurring / Rediscovered Problems

These are pattern-level problems that span multiple specific issues. When you notice you're solving the same thing in three boxes, it usually belongs here.

### Source vs surface confusion

**Pattern:** Agents may confuse UI/generation surfaces with canonical source files.

**Systems affected:** Boxes UI page, `Auto/orchestrator/state/`, Client Boxes, page-asset sitemap.

**Preventive ledgers:** File Directory Ledger (§6 Canonical vs Generated), Source-of-Truth Ledger (planned), Asset/Widget Map (planned).

### Plans becoming stale

**Pattern:** Plans are written at one moment, then time/client replies/guardrails change. The plan keeps existing as if nothing happened.

**Systems affected:** seven-day plans, scheduled fires, client state, automation page.

**Preventive approach:** plan freshness markers (PROB-006), reply gate, rewrite trigger, audit markers (Brenda template), `TEMPORAL_CONTINUITY.md` §15 plan-aging rules.

### Documentation drift

**Pattern:** Docs (CLAUDE.md, sitemap copies, etc.) reflect a project state that has since changed. Agents trust docs as authoritative and act on stale info.

**Systems affected:** CLAUDE.md, AGENT.md, README.md, page_asset_sitemap.md, ledgers.

**Preventive approach:** Done Gate (when DoD Ledger lands) + Last Verified dates on every doc + cross-references between ledgers.

### Directory duplication

**Pattern:** Same content exists in two places (often a snapshot/refactor that was never finished). Edits go to the wrong copy.

**Systems affected:** `Auto/Boxes/` mirror, `Comeketo Agent/` duplicates, `Onboard Scripts/` superset/subset, sitemap copies.

**Preventive approach:** File Directory Ledger §10 Common Wrong-Turns + symlinks where safe + decisions in Decisions Ledger to pick canonical.

Recurring problems often become design requirements.

---

## 10. Recently Closed Problems

When closing a problem, move it here with: close date, what fixed it, verification evidence, related commit or audit marker.

### PROB-2026-04-28-011 — `docs/page_asset_sitemap.md` Is Stale

Status: **closed**
Closed: 2026-04-30
Severity at creation: low · Urgency: later

**Original problem.** Two `page_asset_sitemap.md` files existed. Root copy was 65 KB and live (the UI Done Gate). `docs/page_asset_sitemap.md` was 11 KB and stale, last semantically updated long before its mtime suggested. Risk: an agent could `grep -r sitemap` and edit the wrong file.

**What fixed it.** Sandbox does not have delete authority on the user's mounted folder, so the duplicate was overwritten in place with a redirect stub. The new contents of `docs/page_asset_sitemap.md` are a single short notice that points to the canonical root file and explicitly tells future agents not to add content here. This satisfies the close criterion as written: "or any copies are clearly redirect-only."

**Verification evidence:**
- ✅ `docs/page_asset_sitemap.md` content is now a redirect stub — first heading reads `# ⛔ This file is a redirect — not the canonical sitemap`.
- ✅ Stub explicitly links to `../page_asset_sitemap.md` and labels the root as canonical.
- ✅ No structural sitemap content remains in `docs/` — there is nothing left to drift against.
- ✅ Stub references this ledger entry by ID, so the closure is self-cross-linked.
- ✅ File Directory Ledger §10 wrong-turn `stale_docs_sitemap` should be retitled or marked resolved on its next pass (flagged for the FDL maintainer; not blocking this closure).

**Why redirect-stub instead of delete.** Cowork sandbox has no `unlink()` permission on the mounted user folder. The close-criteria text was deliberately written to allow either delete OR redirect-only, anticipating exactly this kind of constraint. A redirect stub is also more discoverable than a missing file for an agent that lands on the old path via stale links or search results.

**Related commit / activity ledger entries:** activity.jsonl 2026-04-30 entries for `prob_011_close` and `redirect_stub_write`. Working tree uncommitted; commit/push waiting on Jake.

History:
- 2026-04-28 — created.
- 2026-04-30 — closed via redirect-stub at `docs/page_asset_sitemap.md`. Close criteria met.

---

### PROB-2026-04-28-014 — Two Identical `Comeketo Agent/` Folders

Status: **closed**
Closed: 2026-04-28
Severity at creation: low · Urgency: later

**Original problem.** `Comeketo Agent/` existed at both project root and inside `Auto/`, content-identical (only `.DS_Store` differed). Two folders by the same name, no disambiguation.

**What fixed it.** Top-level renamed to **`Aesthetic Asset Kit/`** to reflect its actual purpose (it's an aesthetic/design system kit — Comeketo Design Deck.html + tokens.css + components.css + deck-stage.js + icons.js — used to keep all builds aligned visually). `Auto/Comeketo Agent/` left in place for the orchestrator's reference.

**Verification evidence:**
- ✅ Top-level renamed: `mv "Comeketo Agent" "Aesthetic Asset Kit"` ran cleanly.
- ✅ Pre-rename grep confirmed zero inbound code references to the path (only this ledger and `OPEN_PROBLEMS_LEDGER.json` referenced the old path; both updated).
- ✅ Internal references inside the directory (HTML → tokens.css/components.css/deck-stage.js/icons.js) are relative — survived the rename without touching anything.
- ✅ One code comment in `automation.jsx` line 4359 mentioned "Comeketo Design Deck" by name (not by path) — still accurate post-rename.
- ✅ `Auto/Comeketo Agent/` untouched.
- ✅ File Directory Ledger §3, §4.1, §7, §10 updated to reflect new name.

**Why both still exist.** The two folders had identical content but different roles: top-level is project-wide design source, `Auto/` was a reference copy. After rename the names disambiguate and the duplicate-by-name confusion is resolved. If the duplicate-by-content concern matters later (PROB-015 Auto migration may resolve it naturally), open a new problem then.

History:
- 2026-04-28 — created.
- 2026-04-28 — closed via rename. Top-level → `Aesthetic Asset Kit/`. Auto/ copy retained.

---

### PROB-2026-04-28-008 — Ledger System Not Yet Implemented In Repo

Status: **closed (Phase 1–4)** — successor problems will track Phase 5+ buildout.
Closed: 2026-04-28
Severity at creation: medium · Urgency: soon

**Original problem.** The ledger system was being designed but the actual files didn't yet exist in the repo.

**What fixed it.** Phases 1–4 landed in the same session (2026-04-28):

| Phase | Ledger | Artifacts |
|---|---|---|
| 1 | Global Ledger | `GLOBAL_LEDGER.md` + `.json`, `INDEX.md`, 3 visuals, 2 templates |
| 2 | Temporal Continuity Ledger | `TEMPORAL_CONTINUITY.md` + `.json`, 2 visuals |
| 3 | North Star Ledger | `NORTH_STAR.md` + `.json`, 2 visuals |
| 4 | File Directory Ledger | `FILE_DIRECTORY_LEDGER.md` + `.json`, 2 visuals |

**Verification evidence (close criteria from spec):**

- ✅ Global Ledger exists — `LEDGERS/GLOBAL_LEDGER.md`
- ✅ Temporal Continuity Ledger exists — `LEDGERS/TEMPORAL_CONTINUITY.md`
- ✅ Index exists — `LEDGERS/INDEX.md`
- ✅ First-wave ledgers are linked — Global cross-refs Temporal, North Star, File Directory; Temporal references North Star + Global; INDEX is the roster authority
- ✅ Agent read-first workflow points to them — `CLAUDE.md` §0, `AGENT.md` "Read second" block, `README.md` Project memory section

**Related commits / activity ledger entries:** `global_ledger_phase1_2026-04-28`, `temporal_continuity_phase2_2026-04-28`, `north_star_phase3_2026-04-28`, `file_directory_phase4_2026-04-28`. Working tree uncommitted as of 2026-04-28; commit/push waiting on Jake's go-ahead.

**Successor work** (not "successor problems" — just normal Phase 5+ buildout): Open Problems Ledger (this file, Phase 5), Source-of-Truth, Definition of Done, Decisions, etc. per `LEDGERS/INDEX.md` build order.

History:
- 2026-04-28 — created.
- 2026-04-28 — closed when Phase 4 landed; all 5 close criteria met.

Closed does not mean forgotten. It means resolved enough not to remain active.

---

## 11. Problem Lifecycle

```
Problem discovered
  → record it (this ledger)
  → triage severity / urgency
  → assign system / owner if possible
  → define workaround
  → define close criteria
  → work / fix / audit
  → verify
  → close or mark partial
  → archive if no longer useful
```

Visualized in [`VISUALS/problem_lifecycle.mmd`](VISUALS/problem_lifecycle.mmd).

---

## 12. Visualization Index

Visual maps under `LEDGERS/VISUALS/`:

- [`VISUALS/problem_lifecycle.mmd`](VISUALS/problem_lifecycle.mmd) — found → record → triage → workaround → next action → fixed? → verify → close.
- [`VISUALS/open_problems_board.mmd`](VISUALS/open_problems_board.mmd) — current problems grouped by Now/Critical, Soon/High, Later/Low.
- [`VISUALS/risk_heatmap.mmd`](VISUALS/risk_heatmap.mmd) — system risk graph: Enrichment → Allowed-to-Know → Copy Risk; Comms → Transcripts → Plan Incomplete; Sweep → Inbound Noise → Reply Gate; Approval → Risk Not Isolated → Unsafe Commitments.

---

## 13. Update Rules

Update this ledger when:

- a new problem is discovered (record immediately — even mid-session)
- a problem is triaged or re-prioritized
- a problem is partially fixed (move to §8, update status to `partial`, refresh close criteria)
- a problem is fully closed (move to §10, add verification evidence)
- a problem becomes blocked (add to §7)
- a recurring pattern is noticed (add to §9)
- an audit (planned Audit Ledger) creates an open problem
- a communication (planned Communications Ledger) names a trackable issue

Do **not** update this ledger for:

- settled decisions (use Decisions Ledger)
- full audit reports (use Audit Ledger)
- ordinary task tracking (this is not a generic task list)
- chat-level notes (this is durable; chat is ephemeral)

### When a problem becomes a decision or a communication

If a problem requires a decision before it can move, mark it `needs-decision` and create the Decisions Ledger entry when it lands. The problem stays open until the decision plus the resulting work close it.

### Local vs global rule

Use this rule:

- If the problem affects one folder/client only → record it locally (e.g. in the client's `client_ledger.md` or local Box ledger).
- If it affects a pattern, workflow, source-of-truth rule, safety posture, or multiple systems → record it here.

Examples:

- **Local:** "Brenda & Steve plan needed cleanup" → local audit marker.
- **Global:** "Many Client Box plans may predate guardrails" → PROB-002.

This keeps the global ledger from becoming noisy.

---

## Final Operating Rule

> A known problem that is not recorded becomes future confusion.
>
> If it is broken, name it.
> If it is risky, classify it.
> If it is blocked, say why.
> If it is fixed, prove it.

# Open Problems Ledger

Last updated: 2026-04-28
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

Status: **open**
Severity: critical · Urgency: now
Discovered: 2026-04-28 · Discovered by: Jake + Brenda audit conversation
Affected systems: Client Boxes, inbox automation, scheduled fires, profile/enrichment, customer-facing copy
Related files: `Auto/Client Boxes/<Name>/01_comms.md`, `04_profile.md`, `05_seven_day_plan.md`, future `allowed_to_use.md`/`.json`
Related ledgers: Source-of-Truth (planned), [`Decisions`](DECISIONS_LEDGER.md), Audit (out-of-scope 2026-04-29 — see DEC-2026-04-29-004), North Star NS-04 + Wholesome Enrichment principle
Owner: TBD
Blocked by: schema/design decision
Tags: `client-box`, `enrichment`, `source-of-truth`, `safety`

**Problem.** The system does not yet have a formal layer that separates: facts the client actually shared / facts from transcripts/comms / enrichment-only internal strategy / protected/off-limits facts / unverified facts / approval-required facts and actions.

**Evidence.** Brenda & Steve highlighted the risk: enrichment-derived context was useful internally but could leak into customer-facing copy. Jake explicitly said the project needs a "what we're allowed to know" type of constraint. The Wholesome Enrichment principle (NS docs §6) names the four-bucket model but no schema or workflow implements it.

**Impact.** Without this layer, automation may surface creepy or unsupported personalization, misuse enrichment, or treat internal strategy as customer-facing truth. Violates NS-04 and the Wholesome Enrichment principle.

**Current workaround.** During Client Box audits, manually flatten outbound copy and only use facts traceable to comms/transcripts or explicit approval. Brenda's `05_seven_day_plan.md` carries this discipline now.

**Recommended next action.** Design Client Box-level `allowed_to_use` schema and workflow. Possible files: `allowed_to_use.md`, `allowed_to_use.json`, `protected_facts.md`, `approval_required.md`. Pair with Source-of-Truth Ledger when it lands.

**Close criteria.**
- Schema exists.
- At least one Client Box uses it.
- Scheduled-fire / read protocol checks it before composing.
- Inbox guardrails reference it.
- Wholesome Enrichment principle in `NORTH_STAR.md` §6 is mechanically enforced (not just documented).

History:
- 2026-04-28 — created. Initial problem statement carried forward from Ledger 05 spec.

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

Status: **needs-verification**
Severity: low · Urgency: later
Discovered: 2026-04-28 · Discovered by: Connections inventory exercise
Affected systems: Connections Ledger (planned), Settings Ledger (planned), app runtime
Related files: `.env`, `connectors.js`, `docs/connectors.md`, `package.json`, server.py imports
Owner: TBD
Tags: `connection`, `documentation`, `cleanup`

**Problem.** Some services are available as connectors or mentioned in environment context, but may not actually be active project dependencies. Supabase and other connectors may be available but actual repo usage needs inspection.

**Evidence.** `.env` lists various credentials; `connectors.js` and `docs/connectors.md` exist but haven't been audited against actual `import` statements / API calls.

**Impact.** Connections Ledger could hallucinate dependencies if not verified. Future agents may try to use a service that isn't actually wired.

**Current workaround.** Mark unverified services as `needs-verification` when listing.

**Recommended next action.** Inspect repo imports, `.env.example` (if exists), server endpoints, and `docs/connectors.md`. Cross-reference against actually-called services. Build the Connections Ledger from evidence, not assumption.

**Close criteria.** Each optional service is marked `active`, `optional`, or `not used` based on grep evidence.

History:
- 2026-04-28 — created.

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

### PROB-2026-04-28-011 — `docs/page_asset_sitemap.md` Is Stale

Status: **needs-decision** (likely safe to delete)
Severity: low · Urgency: later
Discovered: 2026-04-28 · Discovered by: Phase 4 File Directory Ledger inspection
Affected systems: `docs/`, agent orientation, sitemap discoverability
Related files: `docs/page_asset_sitemap.md` (11 KB, stale), `page_asset_sitemap.md` (root, 65 KB, live)
Related ledgers: File Directory Ledger §10 wrong-turn `stale_docs_sitemap`
Owner: Jake (decision required)
Tags: `cleanup`, `documentation`, `duplicate`

**Problem.** Two `page_asset_sitemap.md` files exist. Root copy is 65 KB and updated 2026-04-28 (the live one — UI Done Gate). `docs/page_asset_sitemap.md` is 11 KB and abandoned (last touched 2026-04-28 03:02, but content is much older).

**Evidence.** `diff page_asset_sitemap.md docs/page_asset_sitemap.md` shows different content. File sizes confirm the disparity. Root is referenced everywhere; docs/ copy isn't.

**Impact.** An agent could grep for "sitemap" and edit the wrong file. Violates NS-06 (Source-of-Truth Discipline).

**Current workaround.** `FILE_DIRECTORY_LEDGER.md` §10 explicitly flags this wrong-turn. Agents reading FDL first will avoid it.

**Recommended next action.** Decision: delete `docs/page_asset_sitemap.md` or convert it to a symlink/redirect pointing to root.

**Close criteria.** Only one `page_asset_sitemap.md` exists (or any copies are clearly redirect-only).

History:
- 2026-04-28 — created.

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

History:
- 2026-04-28 — created. Jake flagged during catch-up conversation. Deferred pending ledger + sub-agent buildout completion. Inventory of 32 subdirs captured at creation.

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
- PROB-001 Allowed-To-Know Constraint Not Implemented (critical)
- PROB-002 Active Client Boxes Need Guardrail Audit (high · in-progress)
- PROB-005 Full Phone Transcripts Not Yet Integrated (partial — infra landed, integration remains)
- PROB-006 Plan Rewrite Trigger After Inbound Needs Formalization (high)
- PROB-007 Historical Inbound Detection May Be Noisy (needs-audit)

### Automation / Approval
- PROB-003 Approval Flow Does Not Yet Isolate Risky Moves (critical)
- PROB-006 Plan Rewrite Trigger After Inbound Needs Formalization (high)

### Git / Repo Workflow
- PROB-004 GitHub Direct Writes Can Conflict With Local Unpushed Work (medium)

### Documentation Drift
- PROB-010 CLAUDE.md Surviving-Domains List Is Out of Date (high · needs-decision)
- PROB-011 docs/page_asset_sitemap.md Is Stale (low)

### Directory Cleanup / Duplicates
- PROB-012 Auto/Boxes/ Mirror Purpose Unclear (medium · needs-verification)
- PROB-013 Onboard Scripts/ — Auto/ canonical, top-level legacy being rewritten (low · triaged · watch)
- ~~PROB-014 Two Comeketo Agent/ Folders~~ — **closed 2026-04-28** (renamed top-level to `Aesthetic Asset Kit/`)

### Architecture / Migration
- PROB-016 CCAgentindex/ Bedrock Was Bootstrapped On The Fly — Needs Triad-Based Reconciliation (high · needs-decision · later · blocked on ledger + sub-agent buildout)
- ~~PROB-015 Migrate Auto/ Contents Into CCAgentindex/~~ — **closed 2026-04-28** via 6 relative symlinks (Auto subdirs aliased into bedrock)

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

# Andre Escalation Ladder Agent

**Lives at:** `agents/andre_escalation_ladder/`
**Prompt:** `agents/andre_escalation_ladder/prompt.md`
**Workflow:** `workflows/andre_escalation_ladder.json`
**Dispatch:** `POST /api/agents/andre_escalation_ladder/run` (from the UI) or fired by the workflow engine when the visual graph evaluates a rodbot-kind actor node.
**Register:** in-app, dispatched by the Andre Escalation Ladder workflow card on the Automation screen and by the Cowork skill at `.claude/skills/andre-escalation-ladder/`.

---

## Jurisdiction

**Runs Andre's 7-day NEPQ escalation ladder against Close CRM.** Takes a single Close lead id (or a small batch of up to ten) and drives it through the ladder: ownership reassignment when affinity matches, lead enrichment, enrollment in Close's native "Andre 7-day NEPQ cadence" sequence, Day-1 double-tap on silence, Day-2 tasting info, Day-3 phonecall ask with YES / NO / SILENCE classification, Day 4-7 loop on no response, and the parallel tasting-booked handoff task. Every mutation happens through the Close MCP. Semi-auto is okay; realign is a must no matter what.

## Inputs

- `lead_id` (required) — a Close lead id, or a short array of ids (≤ 10 — small batches).
- `mode` — one of: `full_ladder` (default), `day1_only`, `day3_only`, `tasting_handoff_only`, `audit_only`.
- `workflows/andre_escalation_ladder.json` — the graph. Agent reads the node config for sequence names, task templates, classifier categories, realign rule.
- `people/andre_raw.json` — Andre's Close user id, voice, affinity anchors.
- `knowledge/sales_playbook_v2.json` — NEPQ probe structures and cadence rules.
- `knowledge/leads_source_dec_2025.json` — source-attribution reference for enrichment.
- `projects/lead_rotation.json` — affinity heuristics (Brazilian churches → Andre, etc.).
- Close MCP tools — `fetch_lead`, `update_lead`, `create_task`, `find_lead_statuses`, `activity_search`, `create_contact`.

## Outputs

One JSON receipt per run at `_ledger/andre_escalation/<UTC-timestamp>.json`:

```json
{
  "ts": "<ISO8601>",
  "lead_ids": ["<close_lead_id>", ...],
  "mode": "full_ladder",
  "actions": [
    {
      "lead_id": "<id>",
      "step": "reassign" | "enrich" | "enroll_day1" | "day1_double_tap" | "day2_tasting" | "day3_probe" | "classify_day3" | "yes_task" | "loop_day4_7" | "tasting_handoff" | "realign_check" | "audit",
      "close_action": "<Close MCP tool name>" | null,
      "close_payload": { ... } | null,
      "close_response": { ... } | null,
      "verdict": "ok" | "skip" | "abstain",
      "reason": "<one sentence>"
    }
  ],
  "realign_violations": [ { "lead_id": "<id>", "why": "<sentence>" } ],
  "audit_report_path": "reports/andre_escalation/<date>.md" | null,
  "counters": {
    "reassigned": 0, "enrolled": 0, "double_tapped": 0, "day2_sent": 0, "day3_sent": 0,
    "yes_tasks": 0, "looped": 0, "tasting_handoffs": 0, "realign_failures": 0
  }
}
```

Plus one activity ledger line per mutation:

```json
{"ts":"<ISO>","kind":"delegation_write","actor":"andre_escalation_ladder","request_id":"<dl_id>","action":"<verb>","target":"close:lead/<id>","notes":"<one sentence>"}
```

## Decision matrix

| Step | Input condition | Action | Close MCP tool |
|---|---|---|---|
| Reassign | owner ≠ andre AND lead matches Andre affinity | `update_lead` → owner = andre, annotate "THIS IS OUR LEAD NOW" | `mcp__close__update_lead` |
| Gate | owner ≠ andre after reassign attempt | abstain, ledger, stop | — |
| Enrich | gate passes | pull firmographics, source, prior touches, affinity tier | `mcp__close__fetch_lead`, `mcp__close__activity_search` |
| Day 1 | enrichment complete | enroll in "Andre 7-day NEPQ cadence" | Close sequences (via native UI — agent registers the enrollment intent, Close executes the send) |
| Day 1 watch | 24h after enroll | if no inbound activity → create two call tasks spaced 4h apart | `mcp__close__create_task` × 2 |
| Day 2 | Day 1 window closes | Close sequence fires Day-2 NEPQ-next-tasting message | sequence-owned |
| Day 3 | Day 2 window closes | Close sequence fires phonecall-ask message | sequence-owned |
| Day 3 classify | reply received OR 24h silence | Rodbot classifies → YES_with_date / YES_without_date / NO / SILENCE | LLM (no Close call) |
| YES | classification in {YES_*} | create dated Close task on Andre with 30-min reminder | `mcp__close__create_task` |
| Loop | classification in {NO, SILENCE} | re-enroll in Day 3 probe template for Days 4-7 until any response | sequence-owned |
| Tasting handoff | `lead.status_changed → tasting booked` | create high-priority Close task on Andre: "Set tasting expectations" | `mcp__close__create_task` |
| Realign gate | end of any terminal branch | require: owner == andre AND ≥1 Andre task due in next 48h | `mcp__close__fetch_lead` + `mcp__close__activity_search` |
| Audit | after realign gate | compile markdown report + update dashboard cell + append ledger | `file_write`, ledger append |

## Failure modes → Θ (abstain)

- `lead_id` not found in Close → abstain with `why: "lead not found in Close"`, ledger, stop.
- Owner is another rep AND lead doesn't match Andre affinity → abstain with `why: "out of Andre's jurisdiction"`, log, stop.
- Close sequence "Andre 7-day NEPQ cadence" doesn't exist → abstain with `why: "canonical sequence missing — admin must create it in Close"`, stop.
- Realign gate fails at terminal branch → **do not abstain silently.** Create an explicit realign-violation entry on the receipt and a `realign_violation` ledger line. Surface to the audit.
- Batch > 10 → reject with `why: "batches capped at 10 — small batches no matter what"`.

## Escalation

- Day-3 classifier disagrees with itself on two passes → abstain that single lead, surface on the audit as "needs Andre's eyeball."
- Lead is flagged for a different rep's affinity mid-ladder → pause the cadence, surface reassignment question to the admin. Never silently transfer ownership back.
- Close API error on any mutation → retry once with exponential backoff; if it still fails, log `close_action_failed` on the receipt and continue the ladder for the remaining leads in the batch.

## Scope gate (inherits `_base/scope_gate_template.md` when it exists)

- **TOUCHES:** reads `people/andre_raw.json`, `knowledge/sales_playbook_v2.json`, `knowledge/leads_source_dec_2025.json`, `projects/lead_rotation.json`, `workflows/andre_escalation_ladder.json`; writes `_ledger/andre_escalation/*.json`, `reports/andre_escalation/*.md`, append-only lines on `_ledger/activity.jsonl`. Mutates Close CRM through the Close MCP (update_lead, create_task).
- **REFUSES:** any non-Close outbound channel (no Slack posts, no direct Twilio sends, no Gmail drafts — Close sequences own the sends); any bedrock mutation outside the two ledger paths and the reports path; any ClickUp / Google Calendar mutation (YES-path reminders land as Close tasks assigned to Andre, per explicit admin choice); any `_vaults/*` read.
- **ESCALATES:** missing canonical Close sequence, repeated classifier disagreement, cross-rep affinity conflict, realign-gate failure, batch size > 10 — all → surfaced (not silently abstained) except where noted.
- **LEDGER:** one line per Close mutation on `_ledger/activity.jsonl` with `kind:"delegation_write"`, `actor:"andre_escalation_ladder"`.

## Receipts contract (per `knowledge/agent_receipts_contract.md` when it exists)

Every run returns envelope fields on the top-level JSON:
- `claim` — one-line statement (e.g., "3 leads processed — 2 enrolled, 1 realign violation, 0 tasting handoffs")
- `evidence` — Close lead ids touched + ledger line ids written
- `counterfactual` — what would have flipped each verdict (owner was different; classifier was other category; sequence was missing)
- `scope` — "Close CRM day-to-day only; vaults excluded"
- `abstention` — `true` if any lead was abstained

## Trigger paths

- **UI:** Automation screen → *Run Andre Ladder* button on the workflow card → `POST /api/agents/andre_escalation_ladder/run` with `{ "lead_id": "<id>" }` in the body.
- **Workflow engine:** when the `n_act_rodbot_enrich`, `n_xf_classify_day3`, or `n_act_rodbot_audit` rodbot-kind actor nodes evaluate, the engine dispatches this agent with the appropriate `mode`.
- **Cowork skill:** `.claude/skills/andre-escalation-ladder/` fires an HTTP POST to the same endpoint from a Cowork conversation when the skill matches.
- **Scheduler (future):** nightly audit-only pass at 23:30 local — rolls the day's ladder mutations into a single `reports/andre_escalation/<date>.md`. Not wired yet.

## Notes

- Built 2026-04-23 alongside `workflows/andre_escalation_ladder.json` and `.claude/skills/andre-escalation-ladder/SKILL.md`.
- Andre's canonical affinity anchors live in `projects/lead_rotation.json` — Brazilian churches, Portuguese-speaker, Catholic wedding, high-value MA venue. Keep those fields load-bearing; the reassign step depends on them.
- `sales_playbook_v2.json` is the authority on NEPQ structure and cadence spacing. If the playbook updates, the Close sequence name or message-role taxonomy may need to update too — the agent does not mutate Close sequences.
- This is the first Comeketo sub-agent that actively mutates Close. The realign gate exists because silent ownership transfers are a trust withdrawal (see `projects/lead_rotation.json`). Keep it load-bearing.

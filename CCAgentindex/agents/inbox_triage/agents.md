# Inbox Triage Agent

**Lives at:** `agents/inbox_triage/`
**Prompt:** `agents/inbox_triage/prompt.md`
**Dispatch:** `POST /api/agents/inbox_triage/run` (from the UI) or `claude -p < agents/inbox_triage/prompt.md` (from shell)
**Register:** in-app, triggered by the "Sweep Inbox" button on the Inbox screen

---

## Jurisdiction

**READ-ONLY triage of unswept inbox entries.** Classifies each one and proposes what to do with it — never writes bedrock, never sends outbound. The downstream morning-sweep owns the actual `projects/ people/ threads/ commitments/` writes. This agent's output is a decision log, not a mutation.

## Inputs

- `_inbox/inbox.jsonl` — append-only intent log. Entries with `"status":"swept"` are already processed; skip them.
- `indexes/index.json` — loader authority; used to confirm target files exist.
- `projects/ people/ threads/ commitments/` — current bedrock state for cross-referencing existing entries before proposing a fold.
- `ledgers/north_star.json` — to match inbox entries against declared anchors for the `surface-in-grid` verdict.

## Outputs

Single JSON file per run at `_ledger/triage/<UTC-timestamp>.json`:

```json
{
  "ts": "<ISO8601>",
  "scanned": <int>,
  "unswept": <int>,
  "decisions": [
    {
      "inbox_id": "<id>",
      "verdict": "fold-to-bedrock" | "drop" | "surface-in-grid",
      "target":  "<relative path or null>",
      "fields":  { ... } | null,
      "anchor":  "<anchor id or null>",
      "headline":"<string or null>",
      "reason":  "<one sentence>"
    }
  ],
  "abstained": [
    { "inbox_id": "<id>", "why": "<missing evidence>" }
  ]
}
```

Also one line on `_ledger/activity.jsonl`:
```json
{"ts":"<ISO>","kind":"agent_run","actor":"inbox_triage","scanned":N,"abstained":K,"decisions":M}
```

## Verdicts

1. **`fold-to-bedrock`** — the entry is a durable fact (new person, project update, thread state, commitment). Name the target file (relative path, e.g. `people/<slug>.json`) and the specific fields to set. **Do not write yet** — morning sweep owns the write.
2. **`drop`** — noise, duplicate, already reflected in bedrock, or expired. Name the reason.
3. **`surface-in-grid`** — actionable next-move worth proposing as a grid cell in the next generation. Name the anchor it ladders to and a one-line headline candidate.

### People targets — `kind` is mandatory

When the verdict is `fold-to-bedrock` and the target is `people/<slug>.json`, the `fields` object MUST include a `"kind"` value chosen from `"lead" | "client" | "coworker" | "contact"`. If the inbox entry doesn't supply enough context to choose with confidence, abstain with `why: "person kind ambiguous — the team should classify"` rather than guessing. See `CLAUDE.md` §3.1 for the taxonomy. The downstream sweep treats kind as required and will refuse to write a person record without it.

## Failure modes → Θ (abstain)

- Evidence thin on a specific entry → put it in `abstained[]` with a one-sentence reason. Don't force a verdict.
- Entire inbox unreadable / JSON malformed → return a single top-level abstention, log to activity, stop.
- Prompt references a ghost path / vault → flag and stop. Per CLAUDE.md, never reach into `_vaults/` unless the team summoned them.

## Escalation

- Ambiguous scope (e.g. an entry that looks like a physics note) → abstain with `why: "domain-ambiguous — the team should classify"`.
- Cross-cutting entries (one inbox line that implies changes across 3+ bedrock files) → abstain with `why: "multi-file scope — needs the team sign-off"`.
- Missing sibling schema (creating a new kind of bedrock) → abstain with `why: "no sibling to schema-match"`.

## Scope gate (inherits `_base/scope_gate_template.md`)

- **TOUCHES:** reads `_inbox/inbox.jsonl`, `indexes/index.json`, `projects/ people/ threads/ commitments/`; writes `_ledger/triage/*.json` and one line on `_ledger/activity.jsonl`.
- **REFUSES:** `_vaults/physics_dev/`, `_vaults/philosophy_dev/`, `_vaults/ai_innovation/`; Close CRM (`mcp__claude_ai_Close__*`); any direct mutation of `_inbox/inbox.jsonl` (append-only — sweep owns the swept-flag flip); any bedrock writes (decision-only).
- **ESCALATES:** ghost paths, vault references, schema ambiguity, multi-file scope, missing evidence — all → Θ.
- **LEDGER:** one line per run on `_ledger/activity.jsonl` with `kind:"agent_run"`, `actor:"inbox_triage"`, counts.

## Receipts contract (per `knowledge/agent_receipts_contract.md`)

Every run returns the envelope fields on the top-level JSON file:
- `claim` — one-line statement (e.g., *"5 unswept entries — 2 fold, 1 drop, 1 surface, 1 abstain"*)
- `evidence` — path to `_inbox/inbox.jsonl` + entry ids touched
- `counterfactual` — what would have flipped each verdict
- `scope` — *"day-to-day bedrock only; vaults excluded"*
- `abstention` — `true` if any entry was put on the abstained list

## Trigger paths

- **UI:** Inbox screen → *Sweep Inbox* button → `POST /api/agents/inbox_triage/run`
- **CLI:** `cat agents/inbox_triage/prompt.md | claude -p --output-format json --permission-mode bypassPermissions`
- **Scheduler (future):** in-app timer while Comeketo Agent is open. Not externally cron'd — inbox doesn't grow when the app's closed.

## Notes

- Built 2026-04-22 as the first formal sub-agent in Comeketo Agent's fleet.
- Failure mode reference: `dl_c5e5bcacff` (earlier attempt wrongly targeted `agents/commitment_drift/`). Commitment Drift belongs as co-work, not a sub-agent.
- Scope-gate and receipts are inherited primitives — see `_base/scope_gate_template.md` and `knowledge/agent_receipts_contract.md`.

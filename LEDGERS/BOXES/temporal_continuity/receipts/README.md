# Receipts — Temporal Continuity Steward Runs

This directory holds run receipts from the Temporal Continuity Steward.

## Filename pattern

`<YYYY-MM-DD_HH-MM-SS>_run_<request_id>.json`

Example: `2026-04-30_14-22-08_run_a1b2c3.json`

## What lives in a receipt

Per `../steward/prompt.md` "Receipt Format" section:

- `request_id` — unique id for this dispatch
- `run_at` — ISO 8601 timestamp
- `mode` — `audit_only` or `local_write`
- `classification` — A (no update) / B (temporal update) / C (local only) / D (multi-ledger)
- `input_summary` — what triggered the run (one paragraph)
- `outputs` — orientation / update_recommendation / handoff / git_posture / plan_freshness blocks
- `writes_applied` — list of files actually edited (empty in audit_only mode)
- `ledgers_touched` — list of ledgers cross-referenced or updated
- `activity_log_entry` — the line written to `CCAgentindex/_ledger/activity.jsonl`
- `next_recommended_read` — what the next agent should read

## Rules

1. **Append-only.** Never edit a past receipt. If a run was wrong, write a new receipt with a `supersedes: "<prior_id>"` field.
2. **One receipt per run.** No batching. If the steward fires three times, three receipts.
3. **Receipts mirror activity log entries** — every `local_write` run also appends one `temporal_continuity_steward_run` line to `_ledger/activity.jsonl`.
4. **Audit-only runs still write receipts** — they record what *would* have changed, even if nothing was applied.

## Phase status

The runnable form of this steward (`POST /api/agents/temporal_continuity_steward/run`) is **not yet wired** as of the Box's creation. When wired (Phase B+1 work), this directory becomes the live receipt destination. Until then it stays empty (or hand-populated for testing).

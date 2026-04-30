# Atlas Sweep Steward — Receipts

This directory holds per-run receipts for the Atlas Sweep Steward.

## Receipt naming

```
YYYY-MM-DD_HH-MM-SS_run_<request_id>.json
```

Example: `2026-05-01_18-30-00_run_b4d2c3e9.json`

## Receipt format

See `../steward/AGENTS.md` §8 (Receipt Contract) and `../steward/prompt.md` (Receipt Contract). Each receipt is a single JSON object documenting:

- `request_id` + `run_at` (ISO 8601 UTC)
- `mode` — `audit_only` | `reconcile`
- `cutoff_ts` — sweep covered Atlas folders dated >= this
- `atlas_folders_swept` — list of folder names processed
- `summaries_read_total` / `summaries_passed_relevance_filter` / `summaries_skipped_as_non_project` — show the filter is working
- `findings` — broken into `concordance`, `drift_detected[]`, `handoff_lessons[]`, `action_suggestions[]`, `decision_context[]`, `out_of_scope`
- `writes_applied[]` — empty in `audit_only`; populated in `reconcile`
- `drafts_authored[]` — paths under `LEDGERS/DRAFTS/ATOMIZATION/`
- `activity_appended` — true if the steward wrote its activity line
- `abstention` — true if the steward couldn't run (no Atlas folders, prior receipt unparseable, etc.)
- `next_recommended_invocation`

Receipts are append-only — never edit a past receipt. If a sweep was wrong, write a new receipt that supersedes the prior one (with a `supersedes` field referencing the old request_id).

## What a finding cites

Every drift / handoff / action / decision-context finding cites:

- **Atlas summary path** — the exact `pieces_*.md` file the finding came from
- **Ledger entry being compared** — the PROB-id / COMM-id / DEC-id / ATOM-id (or "no entry exists" when the finding is a missed handoff)
- **Gap description** — what specifically differs

This lets future agents (and future stewards) re-trace the steward's reasoning without re-reading every Atlas summary.

## Bootstrap note (2026-04-30)

This directory is the canonical receipts home from day one. There is no legacy receipts location to migrate from — the Atlas Sweep Steward's first dispatch will land its first receipt here.

## Cross-references

- Box manifest: `../box.json`
- Box orientation: `../BOX.md`
- Steward AGENTS.md: `../steward/AGENTS.md` (14 sections, full operating contract)
- Steward prompt.md: `../steward/prompt.md`
- Steward config.json: `../steward/config.json`
- Sibling Box receipts (pattern reference): `../../global_ledger/receipts/`, `../../temporal_continuity/receipts/`, `../../file_directory/receipts/`

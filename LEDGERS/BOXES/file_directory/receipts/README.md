# File Directory Steward — Receipts

This directory holds per-run receipts for the File Directory Steward.

## Receipt naming

```
YYYY-MM-DD_HH-MM-SS_run_<request_id>.json
```

Example: `2026-05-01_09-12-00_run_a3f7b2c1.json`

## Receipt format

See `../steward/AGENTS.md` §19 (Output Formats) and `../steward/prompt.md` (Receipt Contract). Each receipt is a single JSON object documenting:

- run timestamp (ISO 8601 UTC)
- mode (`audit_only` | `local_write`)
- classification (`no_directory_update` | `directory_map_update` | `local_orientation_update` | `wrong_turn_pattern` | `multi_section_update`)
- one-sentence claim
- files read
- files written
- drift detected (per affected directory)
- wrong-turn patterns detected (with activity-log evidence and proposed §12 entries)
- whether activity ledger was appended
- abstention flag
- risks surfaced
- next recommended read

Receipts are append-only — never edit a past receipt. If a run was wrong, write a new receipt that supersedes the prior one (with a `supersedes` field referencing the old request_id).

## Promotion note (2026-04-30)

Per ATOM-2026-04-30-0036, this directory is the canonical receipts home for the File Directory Steward. There is no legacy receipts location to migrate from — this steward has never been runnable before. All receipts from the first dispatch onward land here.

## Cross-references

- Box manifest: `../box.json`
- Box orientation: `../BOX.md`
- Steward AGENTS.md: `../steward/AGENTS.md` (19 sections, full operating contract)
- Steward prompt.md: `../steward/prompt.md`
- Steward config.json: `../steward/config.json`
- Sibling Box receipts (pattern reference): `../../global_ledger/receipts/`, `../../temporal_continuity/receipts/`, `../../atoms/receipts/`

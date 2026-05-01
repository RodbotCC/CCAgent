# Global Ledger Steward — Receipts

This directory holds per-run receipts for the Global Ledger Steward.

## Receipt naming

```
YYYY-MM-DD_HH-MM-SS_run_<request_id>.json
```

Example: `2026-05-01_09-12-00_run_a3f7b2c1.json`

## Receipt format

See `../steward/AGENTS.md` §15 (Output Formats) and `../steward/prompt.md` (Receipt Contract). Each receipt is a single JSON object documenting:

- run timestamp (ISO 8601 UTC)
- mode (`audit_only` | `local_write`)
- classification (`no_global_update` | `temporal_update` | `global_update` | `multi_ledger_update`)
- one-sentence claim
- files read
- files written
- ledger roster check (actual ledgers, index mismatches, JSON mirror mismatches)
- whether activity ledger was appended
- abstention flag
- risks surfaced
- next recommended read

Receipts are append-only — never edit a past receipt. If a run was wrong, write a new receipt that supersedes the prior one (with a `supersedes` field referencing the old request_id).

## Migration note (2026-04-30)

Per ATOM-2026-04-30-0044, this directory is the **canonical post-migration receipts home** for the Global Ledger Steward.

During the migration window (while the legacy prompt at `CCAgentindex/agents/global_ledger_steward/prompt.md` remains the active dispatch target), receipts continue to land at the **legacy path**:

```
CCAgentindex/_ledger/ledger_steward_runs/<UTC-timestamp>.json
```

Future receipts will land here once `_agent_resolve_prompt` precedence is flipped or the legacy prompt is retired (separate work unit, not part of ATOM-0044).

## Cross-references

- Box manifest: `../box.json`
- Box orientation: `../BOX.md`
- Steward AGENTS.md: `../steward/AGENTS.md`
- Steward prompt.md: `../steward/prompt.md`
- Steward config.json: `../steward/config.json`
- Sibling Box receipts (pattern reference): `../../temporal_continuity/receipts/`, `../../atoms/receipts/`

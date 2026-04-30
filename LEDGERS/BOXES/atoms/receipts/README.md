# Atomizer Steward — Receipts

Per-run audit trail for the Atomizer Steward.

## Naming

```
<YYYY-MM-DD>_<HHMM>_<run-kind>.json
```

Example: `2026-04-30_2030_atomization_pass.json`

## Run Kinds

- `atomization_pass` — `propose_atoms` mode produced new draft decompositions.
- `stale_sweep` — `sweep_stale` mode reported on stale claims.
- `release_pass` — `release_stale_claims` mode released stale claims.
- `closure_surface` — `surface_closures` mode found PROB-closure-eligible candidates.
- `audit` — `audit_only` mode. Read-only state report.

## Receipt Schema

```json
{
  "run_id": "<UUID or YYYY-MM-DD-HHMM-mode>",
  "mode": "<mode>",
  "started_at": "<ISO8601>",
  "ended_at": "<ISO8601>",
  "dispatch_parameters": { ... },
  "parent_probs_touched": ["PROB-id", ...],
  "atoms_proposed": [{"prob_id": "...", "atom_count": N}],
  "atoms_released": [{"atom_id": "...", "reason": "..."}],
  "probs_surfaced_for_closure": ["PROB-id", ...],
  "anomalies": [...],
  "next_recommended_action": "..."
}
```

## Phase Status

- **Phase A:** receipts directory exists; no runs yet (steward not runnable until Phase B).
- **Phase B:** receipts populate when the runnable form lands at `CCAgentindex/agents/atomizer_steward/`.
- **Phase C:** receipts may also include Box Bus envelope routing metadata once the runtime ships.

See [`../BOX.md`](../BOX.md) §9 for the full receipts protocol.

# LEDGERS/scripts/

Operational scripts that pair with the global ledgers. These run by hand in Phase A; some will be wired into automation in Phase C.

## snapshot.sh

Creates timestamped zip archives of the project's legibility skeleton — paired with `LEDGERS/DEPRECATION.md` §7 (Snapshot Protocol). The recovery surface for everything in the Deprecation Ledger.

**Cadences:** `daily` (retain 7) · `weekly` (retain 4) · `monthly` (retain 12) · `manual` (no auto-prune).

**Usage:**

```bash
# Manual — before any retirement
./LEDGERS/scripts/snapshot.sh manual "pre_audit_ledger_purge"

# Scheduled cadences (manual invocation in Phase A)
./LEDGERS/scripts/snapshot.sh daily
./LEDGERS/scripts/snapshot.sh weekly
./LEDGERS/scripts/snapshot.sh monthly
```

**Output:** writes to `_snapshots/<cadence>/snapshot_<YYYY-MM-DD>_<HHMM>_<cadence>[_<reason-slug>].zip` and appends a `kind: "snapshot_taken"` line to `CCAgentindex/_ledger/activity.jsonl`.

**Phase A:** manual invocation. The Deprecation Ledger author runs it before any deletion.

**Phase C:** wired into the orchestrator (cron / launchd / Box Bus runtime) by the Snapshot Steward.

See `LEDGERS/DEPRECATION.md` §7 for full protocol — what's included/excluded, retention rules, recovery procedure, health checks.

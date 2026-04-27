# lead_registry.md — Master Lead Registry

CIA §00.04. Every lead the system has discovered, indexed by Close ID.

| lead_id | name | pair_lead | close_url | smart_view_id | first_seen | folder_path |
|---|---|---|---|---|---|---|
| lead_g4AZCOW7Kpc3tithNBrr9aXPbDHsZ72KJUR55Qjzd6f | Hugo Casillas | true | https://app.close.com/lead/lead_g4AZCOW7Kpc3tithNBrr9aXPbDHsZ72KJUR55Qjzd6f/ | save_9NOOd8EC1ljG0n6Pq1J1aryvsjYrGoFfSpu2mLBPvok | 2026-04-25T17:00:00Z | (workspace root in this demo) |

The lead registry is append-only. A row is added when a lead is first
discovered; it never gets deleted. Status changes live in `master_ledger.csv`.

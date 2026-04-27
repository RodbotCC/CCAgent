# source_index_master.md — Master Source Index

CIA §00.06. Every source artifact across every lead. Per-lead source
indexes (`source_index.md`) are the working surface; this file rolls them
up so audit/recall is one query.

## Schema

| col | meaning |
|---|---|
| master_id | `M####` global ID |
| lead_id | which lead |
| local_id | per-lead `S###` |
| source_type | close \| linkedin \| zoominfo \| public-web \| inference \| internal-note |
| url_or_path | URL or workspace path |
| accessed | ISO date |
| confidence | ✅ \| 🟡 \| ❓ \| 🚫 |

## Entries

| master_id | lead_id | local_id | source_type | url_or_path | accessed | confidence |
|---|---|---|---|---|---|---|
| M0001 | lead_g4AZ... | S001 | close | https://app.close.com/lead/lead_g4AZCOW7Kpc3tithNBrr9aXPbDHsZ72KJUR55Qjzd6f/ | 2026-04-25 | ✅ |
| M0002 | lead_g4AZ... | S002 | internal-note | clients/.../01_comms.md | 2026-04-25 | ✅ |
| M0003 | lead_g4AZ... | S003 | inference | clients/.../02_people_search.md | 2026-04-25 | 🟡 |
| M0004 | lead_g4AZ... | S004 | linkedin | linkedin.com/in/hugocasillas (URL TO CAPTURE) | 2026-04-25 | 🟡 |
| M0005 | lead_g4AZ... | S005 | public-web | zoominfo.com | 2026-04-25 | ✅ |
| M0006 | lead_g4AZ... | S006 | internal-note | clients/.../03_deep_dive.md | 2026-04-25 | 🟡 |
| M0007 | lead_g4AZ... | S007 | inference | ZoomInfo Mid-Market AE comp benchmarks | 2026-04-25 | 🟡 |
| M0008 | lead_g4AZ... | S008 | close | Close call note 2026-04-17 | 2026-04-25 | ✅ |
| M0009 | lead_g4AZ... | S009 | public-web | Highland Orchard venue site (URL TO VERIFY) | 2026-04-25 | ❓ |
| M0010 | lead_g4AZ... | S010 | internal-note | clients/.../HugoDeep.txt + Hugo Casillas_enrichment.md | 2026-04-25 | 🟡 |

# COMM-2026-05-01-### — Bucket C Verification: PROB-001 Is Not Close-Ready

Date:              2026-05-01
From:              parallel cleanup agent — bucket C verification pass
To:                future agents, Jake, PROB-001 cleanup workers
Type:              handoff, warning, coordination
Status:            draft — not yet inserted into `COMMUNICATIONS_LEDGER.md`
Priority:          high
Affected systems:  Auto/ retirement, Client Boxes, Staff Boxes, comeketo-inbox, orchestrator, server.py, scheduled triggers, Deprecation Ledger, Atom Ledger
Related ledgers:   PROB-2026-05-01-001, PROB-2026-05-01-002, DEC-2026-05-01-002, ATOMS.md §10.5, DEPRECATION.md
Promote when:      Insert into `CCAgentindex/boxes/communication/COMMUNICATIONS_LEDGER.md` once a local/CLI-capable agent can safely edit the full ledger without truncation risk.

---

## Message

Bucket C verification found that `PROB-2026-05-01-001` — Auto/ symlink retirement + dispersal — is not close-ready.

The repo has partial post-sweep structure in place, but the closure contract is ahead of verified state. `CCAgentindex/comeketo-inbox/` and `CCAgentindex/orchestrator/` are present, but the larger retirement is still blocked by unresolved archive, migration, trigger, and decision issues.

Current blocker list:

1. `server.py` still defines `AUTO_ROOT`, `AUTO_CLIENT_BOXES`, `AUTO_STAFF_BOXES`, and `AUTO_ORCH_STATE` against `Auto/`.
2. The frozen Client Boxes archive was referenced but not located or integrity-verified. Current visible path remains effectively `<beta-test-path-TBD>`.
3. `CCAgentindex/client_boxes/` was not verifiably present on GitHub main. This may be because Git does not preserve empty directories, but it still prevents closure verification.
4. Scheduled automations are not globally paused in repo configuration. Multiple trigger JSON files remain `enabled: true`, including client-specific or client-adjacent triggers.
5. Staff Boxes did not have a verified canonical landing under `CCAgentindex/staff_boxes/`.
6. Several loose former `Auto/` files still need operator disposition: `CIA.txt`, `QuoteMaker.jsx`, `Comeketo_Voice_Profiles.md`, `Comeketo_Venue_Index_2026-04-25.xlsx`, `Hugodemo/`, `comeketo-inbox.skill`, and cleanup artifacts.
7. `DEC-2026-05-01-002` is still proposed, not active. Several placement-table rows still require Jake/operator confirmation.
8. The `Auto/` Deprecation entry should remain a candidate draft only until snapshot/archive verification, incoming-link audit, and placement decisions are complete.

## Why It Matters

A future agent may see the post-sweep `CLAUDE.md` and assume the Auto/ dispersal is complete. It is not. Closing PROB-001 now would freeze an unsafe story into the ledgers: live or live-looking triggers still exist, `server.py` still has old constants, Client Boxes archive verification is missing, and the final deprecation contract is not satisfied.

This is exactly the kind of state where stale references become dangerous: the documentation says “retired,” but runtime and migration evidence still say “partial.”

## Suggested Action

Keep `PROB-2026-05-01-001` open / needs-verification.

Recommended next work sequence:

1. Verify or create the pre-retirement snapshot / frozen Client Boxes archive.
2. Resolve `DEC-2026-05-01-002` placement rows with Jake.
3. Update or draft atom statuses:
   - `ATOM-0005` functionally superseded by the later CLAUDE.md rewrite.
   - `ATOM-0006` on hold pending Beta-Test Isolation.
   - `ATOM-0008` and `ATOM-0009` likely near verification because inbox/orchestrator folders exist.
   - `ATOM-0002`, `0003`, `0004`, `0007`, `0010`, `0011` still unresolved.
4. Audit and pause/retire enabled trigger configs before production cutover.
5. Only then promote the drafted `Auto/` DEPR entry from candidate to deprecated/archived.

## Expiry / Review

Review after:

- Client Boxes archive path is verified,
- `server.py` no longer points at `Auto/`,
- enabled triggers are either paused, retired, or explicitly accepted as safe,
- Staff Boxes and loose files have operator-approved destinations,
- `DEC-2026-05-01-002` is active or superseded.

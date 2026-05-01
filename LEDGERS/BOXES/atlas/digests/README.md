# Atlas Daily Digests — Project-Relevant Ground Truth

This directory holds **human-readable per-day digests** of Atlas (Pieces MCP) output, filtered for project-relevance.

## Naming convention

```
<YYYY-MM-DD>.md    e.g. 2026-04-29.md, 2026-04-30.md
```

The date is the **target date** the digest covers — typically yesterday's complete Atlas folder, swept by the daily cron at 8:00 AM ET.

## Digest structure

Each digest follows this shape:

```markdown
# Atlas Digest — <Day, Month Date, Year>

**Generated:** <ISO timestamp>
**Mode:** audit_only | reconcile
**Atlas folder:** <path under LEDGERS/atlas/>
**Summaries read:** <total>
**Project-relevant:** <kept count>
**Skipped non-project:** <skipped count>
**Receipt:** <receipts/<ts>_run_<id>.json>

## Summary

<2-3 sentences. The day's headline from a project-state perspective. What did the operator's machine actually accomplish for the project today?>

## Concordance

<Atlas summaries that match existing ledger entries. Counted, not enumerated unless interesting.>

## Drift Detected

For each drift finding:

- **Atlas claim** — <quote> (source: pieces_*.md)
- **Ledger says** — <PROB/DEC/COMM/ATOM-id + content>
- **Gap** — <what differs>
- **Recommended action** — <PROB candidate / human review / ledger correction>

## Handoff Lessons Surfaced

For each lesson Communications should hold but doesn't:

- **Pattern observed** — <description> (source: pieces_*.md)
- **Why it matters** — <one sentence>
- **Candidate COMM** — <draft entry for human review>

## Action Suggestions (Pieces' Next Steps)

For each Next Steps item that should become an atom:

- **Suggested action** — <imperative title>
- **Source** — <pieces_*.md TLDR snippet + Next Steps section>
- **Parent PROB** — <if applicable>
- **Candidate atom** — <draft for DRAFTS/ATOMIZATION/atlas_atoms_<date>.md>

## Decision Context

For each DEC entry whose reasoning didn't fully survive into the entry:

- **Decision** — <DEC-id + title>
- **Atlas captured** — <reasoning visible in Pieces summary>
- **Ledger holds** — <what made it into the DEC>
- **Recommended addition** — <draft DEC update for human review>

## Out-of-Scope

<count of summaries that were project-adjacent but didn't fit any classification>

## Cross-references

- Receipt (machine-readable): <path>
- Drafts (drift / atoms): <paths if any>
- Source folder: <LEDGERS/atlas/<day-folder>/>
```

## Why digests live here vs. just receipts

Receipts are structured JSON for machine reconciliation. Digests are markdown prose for human reading. Both are durable; both are append-only (newer digests don't overwrite older ones).

The digest is what an operator scans on a Monday morning to catch up on Friday + weekend work. The receipt is what a future Atomizer Steward reads to triangulate.

## Bootstrap note (2026-04-30)

This directory was created via ATOM-2026-04-30-0045. The first digest will land at `2026-04-29.md` via ATOM-2026-04-30-0046. Daily cron at `CCAgentindex/triggers/atlas_daily_sweep.json` fires at 8 AM ET starting tomorrow.

## Cross-references

- Box manifest: `../box.json`
- Box orientation: `../BOX.md`
- Steward operating contract: `../steward/AGENTS.md`
- Receipt format (machine state): `../receipts/README.md`
- Daily cron trigger: `../../../CCAgentindex/triggers/atlas_daily_sweep.json`
- Architecture decision: `../../COMMUNICATIONS_LEDGER.md` COMM-2026-04-30-007

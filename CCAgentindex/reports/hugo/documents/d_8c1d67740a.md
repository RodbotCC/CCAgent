---
name: stage-2-comms
description: Stage 2 of the Comeketo Client Intelligence Agent. For each lead URL in the latest harvest manifest, load the Close lead page, extract the raw correspondence history (emails, SMS, calls, notes, tasks, opportunities) and write it as a markdown file inside the lead's per-client folder. No editorializing — raw capture only. Use when Stage 1 has produced a manifest and the system needs to populate every lead folder with its current Close-side communication history.
---

# Stage 2 — Comms Capture

Stage 1 produced the lead URLs. This stage retrieves what Close actually
shows when you load each lead — the full rendered detail page including all
the cross-endpoint data Close composes for human view: snapshot, activity
stream, opportunities, custom fields, contacts, tasks, notes.

## Inputs

- Latest manifest from `state/harvest/<ts>.json` (Stage 1 output).

## What to do (per lead)

1. Ensure `clients/<lead_id>/` exists.
2. Drop a stub `clients/<lead_id>/01_comms_url.md` containing only the
   Close URL — this is the seed.
3. Hand the lead URL to the browser agent. Capture rendered content into
   a markdown document with this shape:

   ```markdown
   # <Name>

   **Close URL:** <url>
   **Captured:** <UTC ISO>

   ## 🪪 Lead Snapshot
   | Field | Value |
   |---|---|
   | Name | ... |
   | Status | ... |
   | Owner | ... |
   | Phone | ... |
   | Email | ... |
   | City / Zip | ... |
   | Event | ... |
   | Event Date | ... |
   | Guest Count | ... |
   | Venue | ... |
   | Source | ... |
   | Score Tags | ... |
   | Opportunity Value | ... |
   | Open Task | ... |
   | Last Activity | ... |

   ## 📜 Full Correspondence History
   <dated entries — emails, SMS, calls, notes, task completions — verbatim>
   ```

   This format is established in the Hugo example
   (`Hugo Casillas.md` in the workspace root).

4. Write to `clients/<lead_id>/01_comms.md`. If the file already exists
   (a prior run captured an earlier snapshot), do NOT overwrite — append
   a new section under a `### Update — <UTC>` header with new activity
   only. The original capture remains as the historical anchor.

5. Update the ledger: `comms_url_dropped=true`, `comms_md_written=true`,
   `last_comms_append_utc=<now>`.

## Discipline

- No editorial layer. Don't summarize. Don't infer. Don't classify.
  Stages 3–5 do those jobs against the clean raw input.
- Don't truncate long threads. Hugo's discovery-call notes alone fill 30+
  bullets; capture them all.
- Pair leads (lead under one name with partner mentioned in fields/comms):
  capture under the master `lead_id`. Both partners surface in the same
  comms file because that's how Close stores it.

## Failure modes

- Lead URL 404s / page won't load → log to ledger as `comms_md_written=false`
  with reason; surface to operator.
- Non-Andre-owned lead → still capture comms (these inform routing) but mark
  with a `_skip_outbound: true` flag in the meta file. Guardrails apply at
  Stage 6 (composition), not at Stage 2 (capture).

## What this skill does NOT do

- Does not call Sonar, Grok, web_search, or any external profile engine.
- Does not synthesize. Does not classify. Does not write messages.

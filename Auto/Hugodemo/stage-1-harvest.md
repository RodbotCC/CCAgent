---
name: stage-1-harvest
description: Stage 1 of the Comeketo Client Intelligence Agent. Given a Close.com smart-view URL, harvest every lead URL on that view and write a structured manifest. Use when Andre has pointed at a smart view (e.g. https://app.close.com/leads/save_<id>/) and the system needs the list of leads to work today. This skill does NOT pull lead detail, comms, enrichment, or write any messages — it is the harvester only. Output is one JSON manifest plus a checklist update on the ledger.
---

# Stage 1 — Harvest

Andre's only contribution to the loop: maintain the smart view. This skill
turns whatever is in that view, right now, into a structured lead manifest
that downstream stages consume.

## Inputs

- `smart_view_url` — e.g. `https://app.close.com/leads/save_<id>/`
- `smart_view_label` — human label, e.g. "A: 🔷 03. Day 6-10 Cadence"

## What to do

1. Hand the URL to a browser-capable agent (Cowork) with valid Close session.
2. Have it load the page and extract every `<a href="/lead/lead_*">` link.
   The minimal extraction shape is the JS pattern:
   ```javascript
   Array.from(document.querySelectorAll('a[href^="/lead/lead_"]'))
     .map(a => ({
       name: a.textContent.trim(),
       url: 'https://app.close.com' + a.getAttribute('href'),
       lead_id: a.getAttribute('href').replace('/lead/', '').replace('/', '')
     }))
   ```
   The browser agent does not need this snippet verbatim — it can read the
   rendered list directly. The principle is: identify lead links, pull
   name + URL + lead_id, deduplicate.
3. Write the manifest to `state/harvest/<UTC_timestamp>.json`:

   ```json
   {
     "smart_view_id": "save_...",
     "smart_view_label": "A: 🔷 03. Day 6-10 Cadence",
     "smart_view_url": "https://app.close.com/leads/save_.../",
     "harvested_at": "2026-04-26T12:00:00Z",
     "harvested_by": "cowork-claude",
     "lead_count": 28,
     "leads": [
       {
         "lead_id": "lead_...",
         "name": "Hugo Casillas",
         "close_url": "https://app.close.com/lead/lead_.../",
         "harvested_position": 1
       }
     ]
   }
   ```

4. For each lead in the manifest, ensure `clients/<lead_id>/` exists; if not,
   create it. Drop a stub `00_meta.json` containing the lead_id, name,
   smart_view_id, and harvest timestamp. Idempotent: re-runs do not blow
   away existing data.
5. Append to `ledger.csv` (or update existing rows) with `folder_created=true`.

## Failure modes (handle, don't ignore)

- Manifest empty → write the manifest with `lead_count: 0` and exit clean.
  Downstream stages no-op.
- Cowork can't authenticate → log critical, alert operator (NOT Andre).
- `lead_count` differs from previous harvest by more than 50% → flag for
  human review before propagating.

## What this skill does NOT do

- Does not pull lead detail / comms / opportunities / custom fields.
- Does not classify altitude.
- Does not contact the lead.

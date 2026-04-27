# skill_test_examples.md — Skill Test Examples

CIA §09E.04. 2–3 example inputs + expected output shapes per skill.
Used as sanity-check after edits.

## compose-ballpark-quote-email
- Input: 100 guests, deluxe buffet, linens included → expected: matches
  `hugo-ballpark-DEMO.html` shape (header, line items, total, 14-day
  hold, 2-year price-lock note)

## compose-post-call-followup (Hugo Day 1 example)
- Input: post-discovery, Highland Orchard ref available, fiancée invisible,
  Sunday tasting declined
- Expected output shape: 5–8 sentence email; opens with reframe; ends
  with single weekday-call ask; Andre voice; no template smell

## compose-nepq-followup (Hugo Day 4 example)
- Input: 30-word SMS, lowercase, Wed/Thu evening ask, no template phrases
- Expected: ~30 words, lowercase, 1 question, no exclamation marks

## pause-cadence
- Input: lead_id, "manual-only" flag
- Expected effect: Rhonna drip flag off; auto-re-engagement off; ledger
  updated; one-line entry in `run_log.md`

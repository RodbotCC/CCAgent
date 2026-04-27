# 08_automations.md — Hugo Casillas — What Runs Without Andre

## On
- Comms append loop (Stage 7A): every Close webhook / 5-min poll.
  Updates `01_comms.md`, sets `comms_dirty=true`.
- Liaison Agent (this folder's AGENTS.md / CLAUDE.md) wakes on
  `comms_dirty=true` and decides next move.

## Off
- Automated re-engagement SMS / Rhonna drip emails — paused on this lead.
  Hugo is manual-only.

## Mirrored to Andre
- Every outbound the Liaison Agent ships → DM (whale tier) +
  `#andre-system-actions`.
- Plan-day Andre alerts:
  - Day 1 (Friday afternoon): "send the email — here's the draft" — review-required.
  - Day 4 (Monday late morning): "send the SMS — here's the draft" — review-required (whale tier).
  - Day 6 (Wednesday): "send the email if no reply yet" — review-required.

## Operator escalation triggers
- Fiancée engages directly.
- Hugo names competing-caterer quote.
- Hugo signals close-ready before Day 7.
- Andre hasn't ack'd a Day-1/4/6 alert within 30 min (whale tier).

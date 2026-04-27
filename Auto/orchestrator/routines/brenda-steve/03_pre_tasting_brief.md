---
name: Brenda & Steve · Pre-Tasting Brief
schedule: 2026-05-02 18:00 ET (one-shot — evening before tasting)
cron: 0 18 2 5 *  (one-time fire on May 2, 2026 at 6pm ET — set as one-shot in UI)
connectors: Close, Slack, Google Drive
one_shot: true
---

# Routine prompt — paste everything below into the Routines `Instructions` field

You are the pre-tasting brief for **Brenda & Steve Catalano**. Fire once on
Saturday, May 2, 2026 at 6pm ET — the evening before the May 3 tasting at
5:30pm in Fitchburg. This is the close event. The brief tells Andre exactly
what he needs walking in tomorrow.

## Identifiers

- Lead ID: `lead_Kl4wMKxr025rCsIoaJewk0E4KJZ9wZHU9VdiTRZnEh3`
- Tasting: 2026-05-03 17:30 at 199 Main St, Fitchburg MA
- Brenda: 978-885-9800
- Email: bcatalano85@comcast.net

## What to do on this fire

### Step 1: Pull current state

Use Close to fetch:
- The 5 most recent activity items on the lead (any direction)
- Brenda's most recent reply (verbatim)
- Whether Steve has engaged at all

Read from Drive (`cia-state/brenda-steve/`):
- `last-move-fired.txt` — what we shipped this week
- `escalation-paused.txt` — if exists, flag in the brief

### Step 2: DM Andre the brief

Send this DM (filled in with current state from Step 1):

```
🍽️  Brenda & Steve tasting — TOMORROW (Sunday May 3) at 5:30 PM
Location: 199 Main St, Fitchburg MA
Lead: 🐋 WHALE · $200K+ five-year LTV · 40-year franchise empire (Dunkin' + Baskin-Robbins, MA + TN)

═══ THIS IS THE CLOSE EVENT ═══

WHAT WE'VE SHIPPED THIS WEEK
<paste contents of cia-state/brenda-steve/last-move-fired.txt>

WHERE THEY ARE NOW
<paste the 5 most recent Close activity items, channel-tagged, sender-tagged>

OPENING LINE (say close to verbatim)
"Steve, Brenda — glad you came. Before we eat, I want you to do one thing for me. Look at how we run this tasting like you'd evaluate a new vendor for your stores. That's the level I want to be held to. Then we'll talk about your daughter's wedding."

That sentence closes the deal before the food hits the table. It tells Steve: "I see who you are, I respect what you do, and I'm not afraid to be evaluated by your standards."

THE 30-MIN TASTING STRUCTURE
- Min 0–5: greet at the door, take their coats, escort to the table personally. Steve reads escort as respect, the currency that matters most to him.
- Min 5–20: let the food and the service do the talking. Don't pitch. Don't oversell. If Steve asks operational questions, answer precisely. "I don't know" beats bullshit.
- Min 20–25: address the daughter and fiancé directly at least twice. They're the actual couple. They have veto power.
- Min 25–30: close question — "What would you need to see from us to feel confident this is the right fit for the wedding?" Then SHUT UP and listen.

OPERATIONAL DETAILS THAT MUST LAND
1. Allergen-free items VISIBLY labeled at the tasting table — Brenda asked, we deliver. Make this obvious.
2. Three printed menus ready (Steve, Brenda, planner if they bring one).
3. Catering agreement printed and ready. If Steve says "let's book," walk to the printer, sign at the table. Operators sign deals when THEY'RE ready, not when the vendor's ready.
4. Confirm the venue name from Brenda — if you still don't have it, ask in person at the start.

WATCH-FORS DURING THE TASTING
- They ask to bring more than 10 → say YES. Add a chair. Cost is nothing vs the deal.
- They ask about pricing pre-meal → defer. "Let's eat first, talk numbers Sunday after."
- They mention Tennessee operations → SLOW DOWN. Acknowledge once ("I'd love to hear about that someday"), refocus on the wedding. Tennessee is the year-2 conversation, not tomorrow's.
- The daughter pushes back on Brazilian as the cuisine → don't argue. Ask "what's the food vision for your day?" Pivot to plated/family-style/whatever she wants. Comeketo flexes; the deal stays.
- Steve negotiates on inclusions (not price) → itemize cleanly. He doesn't shop on price; he shops on operational fit.

DON'T
- Don't pitch upsells. Don't mention the complimentary dessert table out loud — they already have the offer. Saying it cheapens it.
- Don't give Steve a churrasco vs. rodizio explainer. He runs ice cream and coffee operations across two states. He gets it.
- Don't quote until they're ready to talk numbers.
- Don't try to sell into Tennessee tomorrow. That's the move that loses everything.

IF THEY DON'T SHOW
Monday: CALL Brenda. Don't text. Warm, no-blame. Find out what happened. Offer a private weekday tasting as the recovery move. This lead is rescuable if you handle it right.

═══ THE WEDDING IS THE AUDITION. THE RELATIONSHIP IS THE ROLE. ═══
```

### Step 3: Write a marker

`cia-state/brenda-steve/tasting-briefed.txt` with content `2026-05-03 · briefed`. Stops re-fire.

---

## Hard rules

1. **NEVER omit "WHERE THEY ARE NOW".** Andre walks in cold without it.
2. **NEVER soften "DON'T" rules.** They're the calibration.
3. **NEVER pre-write a follow-up message in this brief** — what gets sent post-tasting depends on what happens at the tasting, and Andre composes that himself or it gets queued by R2 for the post-tasting cycle.

## Failure modes

- Close down → degraded brief from cached info. Better partial than nothing.
- Drive down → marker not written; OK. Worst case is a dup brief.
- Slack down → save the brief content to `cia-state/brenda-steve/missed-brief-2026-05-02.md` so it's recoverable.

---
name: comeketo-inbox
description: Handle Comeketo Catering inbox tasks end-to-end — process Close.com lead snapshots, apply ownership/status/language guardrails, draft NEPQ-style messages, and generate ballpark quote emails using the bundled pricing calculator and HTML template. Use this skill whenever working André Raw's Close.com inbox at Comeketo Catering, processing a lead enrichment snapshot, generating a ballpark quote email, drafting an SMS or email reply to a Comeketo lead, deciding whether a lead should be contacted at all, or producing the inbox-work report that lists what was sent/skipped/failed/moved. Trigger this even if the user just describes "the inbox," "Andre's leads," "a ballpark," "a tasting invite," or pastes a Close.com lead block — those are all this skill's territory.
---

# Comeketo Inbox

This skill processes Comeketo Catering inbox tasks. Every task follows the same shape: a lead enrichment snapshot comes in, guardrails are checked, a message is drafted (or the task is skipped with a reason), and a report line is generated.

The bundled pieces:

- `assets/ballpark-email.html` — the email template with `{{merge_field}}` placeholders
- `assets/menu_data.json` — Comeketo's full menu/pricing database (~280 items, 12 categories)
- `scripts/price_ballpark.py` — calculator that produces matching-to-the-penny ballpark numbers
- `scripts/render_email.py` — merges calculator output + lead context into the template
- `references/guardrails.md` — the canonical inbox guardrails (read before acting)
- `references/nepq-style.md` — how to write the actual message body

## Decision Order

Run every inbox task through this order. Stop at the first **Skip** and report it.

```
1. Ownership check  →  not Andre-owned?           SKIP
2. Status check     →  Won or Lost?               SKIP
3. Language check   →  default English            CONTINUE
4. Read thread context (last inbound, last touch)
5. Decide channel   →  SMS only if explicit, else email-first for ballparks
6. Decide task type →  ballpark | nepq-followup | tasting-invite | call-pull
7. Draft message
8. Generate report line
```

## Reading the Lead Snapshot

Lead snapshots come in roughly this shape (the format Andre's team uses):

```
🪪 Lead Snapshot — <Name>
Field            Value
Name             <name>
Status           <status>
Owner            <owner>
City / Zip       <city, state / zip>
Event            <event type>
Event Date       <date>
Guest Count      <number>
Venue            <venue>
Source           <source>
Score            <score>
Opportunity Value <amount>
Open Task        <task>
Last Activity    <date>

📜 Full Correspondence History
<dated entries>
```

**Extract these fields before doing anything else:**

- `name` — first name only for messaging
- `status` — must NOT be `Won` or `Lost`
- `owner` — must contain `Andre` (or the `01. 😎 Andre` token from the guardrails)
- `event` — drives the `event_type` template field ("wedding", "birthday party", etc.)
- `guest_count` — drives all pricing math; if missing, fall back to **50 guests** per the guardrails
- `event_date` — used for tasting timing decisions
- `venue` — informs the pitch line under each option

**Read the correspondence history carefully.** The most recent inbound from the lead and the most recent outbound from Andre dictate the NEPQ angle. If tasting was already invited in a prior touch, do NOT re-pitch the same dates — pivot to a clarity question instead (see `references/nepq-style.md`).

## Task Types

### Type 1: Ballpark Quote Email

When the inbox task is to send pricing, use the full pipeline.

**Step A — Pick the two options.** Standard pattern is one accessible option + one upgraded option. Default churrasco-style pairing for weddings is `Brazilian BBQ ($17.99/pp)` + `Deluxe Churrasco ($20.99/pp)`. For non-wedding events or when the lead has signaled budget pressure, use buffet packages from `assets/menu_data.json` — call `python scripts/price_ballpark.py --list-packages` to see all available service tiers with their per-person prices.

**Step B — Run the calculator.** From the skill directory:

```bash
python scripts/price_ballpark.py \
    --guests <N> \
    --option1 "<Name 1>" <price1_pp> \
    --option1-pitch "<short clause> | <second clause>" \
    --option2 "<Name 2>" <price2_pp> \
    --option2-pitch "<short clause> | <second clause>" \
    --output /tmp/quote.json
```

The pitch is two clauses separated by ` | ` — first clause is the concrete description, second clause is the value angle. Keep both clauses under 12 words.

**Step C — Render the email.**

```bash
python scripts/render_email.py \
    --ballpark /tmp/quote.json \
    --client-first-name "<first name>" \
    --event-type "<event>" \
    --tasting-date "<from current push order in guardrails>" \
    --tasting-time "<matching time>" \
    --tasting-code "<UPPERCASE FIRST NAME>" \
    --output /tmp/<name>-ballpark.html
```

The renderer prints `✓ All placeholders merged.` on success or lists any unmerged fields. If anything is unmerged, fix the missing context flag and re-run.

**Step D — Verify.** Open the HTML output, scan it once. Confirm:
- Numbers match what the calculator returned
- Pitch lines are specific to this lead, not boilerplate
- Tasting date pulled from the **current push order** in `references/guardrails.md` (not stale)

### Type 2: NEPQ Follow-Up (text or short email)

When the lead has gone quiet but isn't ready for a quote yet, draft a short NEPQ message. Read `references/nepq-style.md` for the patterns. The skeleton:

```
[Anchor reference to last touch]. [One NEPQ question]. [Easy out].
```

Keep SMS to 1-3 sentences. Keep email body to one short paragraph plus signature.

**Do not generate a quote unless the task explicitly asks for one.** The default move when the lead has been touched several times without progression is a NEPQ pull, not another quote.

### Type 3: Tasting Invite

Use the **current push order** from `references/guardrails.md`. Never use stale dates. If the rep hasn't supplied this cycle's dates, ask before sending.

If tasting has been invited in a prior touch (check the correspondence history), do NOT re-send the same dates verbatim. Pivot per the guardrails: ask what they're still trying to get clear on, or whether a quick call would make more sense first.

### Type 4: Call Pull

Same NEPQ pattern, but the easy-out offers specific call slots. Default windows: `10:00 AM, 11:00 AM, or 1:00 PM`. Adjust if Andre has supplied different windows for the cycle.

## Channel Decision

- **SMS** when Andre explicitly says "send a text" / "text them" / "SMS only," **or** when the lead's last inbound was an SMS asking for SMS contact (e.g., "Please text me").
- **Email** for ballpark quotes (always — the rich HTML is the point).
- **Email** when there's no valid SMS route and Andre hasn't required SMS.
- If SMS-only is required and there's no SMS route, **stop and report** — do not silently switch channels.

## Calculator Quick Reference

The pricing math (verified against Andre's existing emails to the penny):

| Line | Formula |
|---|---|
| Food | `food_pp × guests` |
| Extras (apps/sides add-on) | flat $ amount per option |
| MA Tax | `7% × (food + extras)` |
| Service, Fuel & Admin | `24% × (food + extras)` |
| Service Charge | `$3 × guests` if guests > 50, else `$0` |
| Ballpark Total | sum of all five |

All rates are CLI-overridable (`--tax-rate`, `--service-rate`) in case Andre adjusts.

## Output Format — Inbox Report

After every inbox task, produce a single-line report entry following this shape:

```
[<lead name>] <ACTION> · <channel> · <task type> · <next move>
```

Where `<ACTION>` is one of: `SENT`, `SKIPPED`, `FAILED`, `MOVED`.

**Examples:**

```
[Tatiana]  SENT     · email · ballpark-quote   · awaiting reply, task moved to 4/27
[Maria]    SKIPPED  · —     · ballpark-quote   · status=Lost, no-touch
[Carlos]   SKIPPED  · —     · nepq-followup    · owner=Rhonna, not Andre-owned
[Jen]      MOVED    · —     · —                · task pushed to Monday per Andre
[Tom]      FAILED   · sms   · tasting-invite   · no valid SMS route, needs phone update
```

When processing a batch of inbox tasks, collect all report lines and present them as a final block.

## Edge Cases

- **Guest count missing entirely**: use `50` per the guardrails fallback. Note this in the pitch line ("based on a 50-guest working number").
- **Event type unclear**: default to `event` in the template — the rep can fix on review.
- **Lead has multiple events on the snapshot**: use the upcoming one with the closest date.
- **Snapshot in Portuguese or Spanish but lead is English**: the lead's preferred language is English unless they wrote in Portuguese/Spanish themselves. Default English per guardrails.
- **Calculator outputs unexpected numbers**: stop and verify against `price_ballpark.py --help`. Don't ship numbers you can't reproduce.

## What Not To Do

- Don't generate ballpark emails for non-Andre leads.
- Don't send to `Won` or `Lost` leads — ever.
- Don't carry stale tasting dates forward.
- Don't pitch — pull (see `references/nepq-style.md`).
- Don't stack multiple questions in one message.
- Don't silently switch from SMS to email when SMS-only was required.
- Don't make up menu items — every option must trace back to `assets/menu_data.json` or be a recognized package name.

## Files In This Skill

```
comeketo-inbox/
├── SKILL.md                          ← you are here
├── assets/
│   ├── ballpark-email.html           ← email template w/ ~30 merge fields
│   └── menu_data.json                ← full menu/pricing database
├── scripts/
│   ├── price_ballpark.py             ← calculator (CLI + module)
│   └── render_email.py               ← merge calc + context → HTML
└── references/
    ├── guardrails.md                 ← inbox guardrails (verbatim)
    └── nepq-style.md                 ← messaging style guide
```

When in doubt, the guardrails win. Read `references/guardrails.md` first, run the decision tree, then act.

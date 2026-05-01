# Hugo's Schedule — Plain English

Show this to Andre. This is what's running on his behalf.
Times are ET. The system never sends to Hugo without Andre seeing the receipt.

Plan starts on whichever date you write into `cia-state/hugo/plan-start-date.txt`.
The schedule below assumes plan start = **Monday, April 27, 2026**.

---

## What runs every day, every 10 minutes

**🔵 Comms Heartbeat (R1) — every 10 min, weekdays 9am–7pm**

> Watches Close for any reply from Hugo. The moment he texts, emails, or
> calls, the system pings Andre on Slack with the verbatim message and
> what the plan says to do next. If the message is borderline (pricing,
> contracts, fiancée engages, hostile) the system **pauses outbound**
> and tells Andre to take it personally.

Andre will see: 🟢 routine reply pings, or 🚨 escalation alerts.
Andre will NOT see: empty pings when Hugo hasn't done anything.

---

## The 7-day arc

| day | date | time | what fires | what Andre sees |
|---|---|---|---|---|
| **Day 1 — Mon** | 2026-04-27 | 10:30am | **Email sent to Hugo** — "Following up — and a different approach for your tasting." Highland Orchard reference + walkthrough video offer + weekday-call ask. | Slack DM: ✅ Sent Day 1 email · here's the body |
| **Day 2 — Tue** | 2026-04-28 | — | Nothing. Rest day. | Nothing. (R1 still watching; if Hugo replies, you'll see it.) |
| **Day 3 — Wed** | 2026-04-29 | — | Nothing. Rest day. | Nothing. |
| **Day 4 — Thu** | 2026-04-30 | 10:30am | **SMS sent to Hugo** — "hey hugo — sent you an email a couple days ago…" — only fires if Hugo hasn't replied yet. | Slack DM: ✅ Sent Day 4 SMS · here's the body. Or: "Day 4 skipped — Hugo replied since Day 1." |
| **Day 5 — Fri** | 2026-05-01 | 9:00am | **Quote-expiry SMS** (R3) — "quote 14-day window closes today. extend, or ready to talk?" | Slack DM: ✅ Sent quote-expiry SMS · here's the body |
| **Day 5 — Fri** | 2026-05-01 | 10:30am | **Day 5 plan check (passive — usually nothing).** | Nothing unless gating fires. |
| **Day 6 — Sat** | 2026-05-02 | 10:30am | **Day 6 email** — "One more thing before the competing quotes come in" — only fires if no reply since the last touch. | Slack DM: ✅ Sent Day 6 email · or "Day 6 skipped — Hugo replied since." |
| **Day 7 — Sun** | 2026-05-03 | — | Nothing. Rest day. Plan window closes after this. | Nothing. |

After Day 7: the Plan Executor (R2) sees `plan_day > 7` and DMs Andre
"plan window complete — Hugo on long-term-nurture or post-close per outcome."
At that point, Andre / you decide whether to start a Wave-2 plan.

---

## Special one-off events

| date | time | what fires | why |
|---|---|---|---|
| **Sat 2026-05-16** | 6:00pm | **Pre-tasting brief (R4)** — only if Hugo has confirmed the May 17 tasting in Close | Slack DM with everything Andre needs to know walking in: fiancée's name, vegetarian station ready, Highland Orchard load-in confirmed, the 30-min call structure |

---

## What happens when Hugo replies (any day, any time during business hours)

Within ~10 min of his reply, R1 fires and Andre gets one of these:

**🟢 Routine reply (system continues per plan):**
> Hugo replied — routine inbound · 11:23am
> Channel: SMS
> Hugo: "yeah Wednesday evening works"
>
> My read: scheduling reply within his stated window
> Plan says: confirm immediately, propose Wed call, prep walkthrough video
> What I'm doing: I'll prep the next move per the plan. R2 handles the actual send tomorrow morning. No action needed unless you want to override.

**🚨 Escalation (system stops, hands off to Andre):**
> ESCALATION — Hugo · 2:18pm
> Channel: email
> Hugo: "I'm getting another quote at $9,200 from Catering Co. Can you match?"
>
> Why: He named a competing CATERER + their price. Plan-redesign trigger.
> What I'm doing: NOTHING. Cadence paused. R2 on hold until you clear it.
> What you should do: take this one personally. Don't auto-respond. Anchor on value gap, not dollar gap. Ask what's included.
> To clear the hold: delete `cia-state/hugo/escalation-paused.txt` from Drive once handled.

---

## What Andre's day actually looks like

Most days: **nothing.** R1 is silent unless Hugo does something.

When something happens: **one Slack DM** that tells him exactly what
happened, what the system did or didn't do, and what (if anything)
he needs to do.

When R2 ships a planned move: **one Slack DM** with the receipt.
Andre reads it. If he doesn't like what went out, he tells you,
you tweak the routine, the next fire reflects the change.

That's it. Andre doesn't open a page. Andre doesn't copy/paste anything
into Close. Andre doesn't watch a queue. He gets DMs when there's signal,
and he goes about his day when there isn't.

---

## What's escalation-pause?

If R1 sees something borderline, it writes a tiny file in Google Drive
called `cia-state/hugo/escalation-paused.txt`. As long as that file
exists, R2 (the plan executor) will NOT send anything. Andre gets DMs
about what happened. When Andre has handled the situation, he (or you)
deletes that file and the cadence resumes.

This is the safety net. It means Andre is ALWAYS in control — he just
doesn't have to *do* anything to be in control. The system defaults
to safe (don't send) the moment anything looks unusual.

---

## What you (Jake) need to do BEFORE turning these on

1. Set up the connectors in your Claude account: Close, Slack, Google Drive.
2. Create a Drive folder: `My Drive/cia-state/hugo/`.
3. Create one file in it: `plan-start-date.txt` containing `2026-04-27` (or whatever date you want Day 1 to be).
4. For each routine file in this folder, paste it into a new Routine in the UI per `README.md`.
5. Watch the first heartbeat fire. Confirm it ran cleanly. Confirm it can read your Drive state file.
6. Watch Day 1 fire on plan-start-date at 10:30am. Confirm Hugo got the email. Confirm Andre got the Slack DM.
7. Now you can sleep.

Tomorrow morning when Hugo replies (if he does), R1 catches it within
10 minutes. Andre sees it on Slack. The system keeps running.

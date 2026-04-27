---
name: stage-5-seven-day-plan
description: Stage 5 of the Comeketo Client Intelligence Agent. Write a 7-day approach plan calibrated to the lead's altitude and profile. Each day has explicit off-ramps in four shapes — 🟢 follow-up, 🔵 close, 🟡 hold, 🔴 block — written as strategic guidance for an agent that can think, not as exhaustive decision trees. Includes Day 0 kickoff state, active-vs-passive day marking, plan-redesign triggers, agent-autonomy-zone marking, and a "what winning unlocks" hook. Use after Stage 4 has produced an altitude classification and decision-ready profile.
---

# Stage 5 — 7-Day Plan

Strategy + per-day moves + off-ramps. The plan is guidance for an agent
that can think, not an exhaustive script for a machine that can't.

## Inputs

- `01_comms.md`, `02_people_search.md`, `03_deep_dive.md`, `04_profile.md`.

## Output

`clients/<lead_id>/05_seven_day_plan.md` with this exact structure:

```markdown
# <Name> — 7-Day Approach Plan

[altitude emoji] <WHALE|STRONG|STANDARD|SOFT> — <one-line read>

**Real read:** <2-3 sentence synthesis from Stage 4>

**Strategic shift:** <what the system was doing wrong / what's new>

**Primary CTA:** <the single outcome we're driving toward>

**Voice:** Andre / Andre at ceiling / Rhonna / Toni / etc.

**Channel mix:** SMS-led / email-led / mixed / call-first.

**Watch-fors before we start:**
- 🚨 <system-level fix — pause cadence, kill drips>
- 🚨 <context-specific concern>

## Day 0 — Kickoff state
- Last lead message: ...
- Last rep message: ...
- Currently scheduled: ...
- Cadence state in Close: ...
- System actions to take BEFORE Day 1: pause drips, waive fees, etc.

## Day 1 — <date> — <ACTIVE|PASSIVE> — <channel> — <time>
[message draft if outbound, or "no outbound — wait/prep" if passive]

**Why this move:** <1-2 lines of strategic reasoning>

**Off-ramps:**
- 🟢 **If they reply <X-shape>:** <next move shape>
- 🟢 **If they reply <Y-shape>:** <different next move shape>
- 🔵 **If they signal close-ready:** <lock-the-deal move>
- 🟡 **If silent by <checkpoint>:** Day N+1 plan continues
- 🔴 **If hard no / hostile / cold past tolerance:** <pause / handoff>

**Plan-redesign triggers (rare — these scrap the plan, not branch within it):**
- <trigger>

**Agent autonomy:** scripted (review required) | agent-handled

[...repeat for Days 2-7...]

## Watch-fors throughout the 7 days
- <cross-cutting signal>

## Fallbacks
- **If they cancel/reschedule:** ...
- **If cold past Day 7:** pause to Day <N>, recovery move
- **If they push on price:** ...
- **If <profile-specific scenario>:** ...

## Block taxonomy
- 🔴 Hard kill — explicit "stop contacting me" or hostile
- 🔴 Pause — go cold for X days, re-evaluate
- 🔴 Handoff — different rep, different approach
- 🔴 Long-term nurture — not ready now, not gone forever

## What winning unlocks (the long game)
<2-4 sentences for the system, not the rep — what cadences trigger if
this lead converts: 60-day check-in, referral-watch in their network,
repeat-event signal monitoring, etc.>

## Strategic note (the closing read for the rep)
<2-4 sentences>
```

## Off-ramp discipline

Off-ramps describe **shape + intent**, not verbatim scripts. Example:

> 🟢 If Hugo replies, the next move respects that he's a SaaS AE who
> reads templates instantly. Respond as a peer, mirror his cadence,
> answer the actual question, propose the next concrete step within
> his stated availability window.

The agent at execution time fills in the words. The plan supplies the
strategic anchor.

## Active vs passive days

Most plans have 4-5 active days and 2-3 passive ones. Mark them
explicitly — passive days are part of the plan, not failures. Hugo's
plan went silent Saturday-Sunday on purpose.

## Calibration to altitude

- **Whale**: 5-7 deliberate touches across 7 days, with rest days
  preserved. Each move calibrated to who they are.
- **Strong**: 4-5 touches, mix of channels, ends with a "decision day"
  by Day 7.
- **Standard**: 3 touches, hard cutoff Day 7 if no engagement.
- **Soft**: 1-2 touches, recovery-pattern or pause-cycle.

---
name: andre-escalation-ladder
description: "Run Andre Raw's 7-day NEPQ escalation ladder on a Close CRM lead — reassign-if-needed, enrichment, Close-sequence enrollment, Day-1 double-tap on silence, Day-2 tasting info, Day-3 phonecall ask with YES/NO/SILENCE branches, Day 4-7 loop, tasting-booked agent handoff, must-realign gate, and audit. Trigger this skill whenever the user mentions Andre's cadence, Andre's ladder, the 7-day Andre flow, the NEPQ probe ladder, a Close lead that needs to run Andre's escalation, or asks to 'run the ladder' / 'run Andre's cadence' / 'escalate this lead on Andre' / 'kick off Andre's cadence'. Also trigger on casual phrasings like 'send this to Andre's machine' or 'put this one through the Andre pipeline' when the context is a Close lead."
---

# Andre Escalation Ladder — skill pointer

This is a thin wrapper skill. The real work lives in the Comeketo Agent app:

- **Sub-agent:** `CCAgentindex/agents/andre_escalation_ladder/`
  - Contract: `agents.md`
  - Prompt: `prompt.md`
- **Visual workflow:** `CCAgentindex/workflows/andre_escalation_ladder.json` (editable on the Automation screen)

When this skill matches, your job is to collect the inputs and dispatch to the sub-agent. Do NOT try to run the ladder yourself from scratch — the sub-agent knows the Close sequence names, the NEPQ templates, the must-realign gate, and the receipt format.

## Where this skill should live

This file ships at `<project_root>/.Codex/skills/andre-escalation-ladder/SKILL.md` so Cowork picks it up when the Comeketo Agent folder is the active workspace. To make it available across every Cowork session regardless of folder, copy the folder up to the global Cowork skills location:

```
cp -R "<project_root>/.Codex/skills/andre-escalation-ladder" \
      "~/.Codex/skills/andre-escalation-ladder"
```

Once copied, the skill triggers on Andre-escalation vocabulary in any conversation.

## What the ladder does (so you can explain it if asked)

One lead comes in through Close. The ladder: reassigns to Andre if affinity matches, enriches the lead, enrolls it in Close's native "Andre 7-day NEPQ cadence" sequence, sends the first NEPQ probe for a phonecall meeting (Day 1), fires a double-tap of two Close phonecall tasks on Andre if Day 1 goes silent, advances to the Day-2 tasting message and Day-3 phonecall ask, classifies the Day-3 reply as YES_with_date / YES_without_date / NO / SILENCE, creates a dated Close task on Andre for any YES, loops Days 4 through 7 on NO or silence, handles the parallel tasting-booked → agent-handoff task, passes the must-realign gate, and writes an audit to `reports/andre_escalation/<date>.md`.

Semi-auto is okay. Realign is a must no matter what.

## Steps when this skill fires

### 1. Confirm the input

Ask the user for a Close lead id (or a small batch up to 10). If they named the lead by display name, ask them to paste the Close lead id — the sub-agent dispatches by id, not by name. If they want to re-run a specific step (e.g. just the audit), ask for the mode.

Mode options:
- `full_ladder` (default)
- `day1_only`
- `day3_only`
- `tasting_handoff_only`
- `audit_only`

Cap batches at 10. If the user asks for more, push back — "small batches, no matter what."

### 2. Dispatch to the sub-agent

Issue an HTTP POST to the Comeketo Agent local server:

```
POST http://localhost:<port>/api/agents/andre_escalation_ladder/run
Content-Type: application/json

{
  "lead_id": "<close_lead_id>" | ["<id_1>", "<id_2>", ...],
  "mode": "full_ladder",
  "extraContext": "<any free-text the user added, passed through to the agent prompt>"
}
```

If the app's port isn't known, ask the user to confirm it (read it from the running `server.py` or the app's status bar).

If the app is not running, say so and stop — do not improvise the ladder. The user can start it with `python3 server.py` from the project root.

### 3. Relay the response

The sub-agent returns a summary in the shape:

```
Andre escalation ladder — <UTC timestamp>
Mode: <mode>    Batch: <N>
Reassigned: <r>    Enrolled: <e>    Double-tapped: <d>
YES tasks: <y>    Looped: <l>    Tasting handoffs: <h>
Realign violations: <v>    Abstained: <a>
Receipt: _ledger/andre_escalation/<ts>.json
Report:  reports/andre_escalation/<date>.md
```

Relay that verbatim to the user. If there are realign violations or abstentions, name them — those are the signals Andre needs to see. Do not dress them up.

### 4. Offer the follow-ups

After a clean run, offer:
- Open the audit report file.
- Turn the mission-control status cell into a live artifact (the workflow's `n_snk_dashboard` node updates it).
- Schedule the nightly audit-only pass at 23:30 if it isn't wired.

Do not offer these if the run abstained or had realign violations — in that case, the next move is to surface the violation, not to schedule more runs.

## What to refuse

- Running this ladder on a lead that isn't Andre's, and whose affinity profile doesn't match Andre — refuse. That's the sub-agent's scope gate; the skill should enforce it early by asking "is this one Andre's, or was it meant for a different rep?"
- Replacing Close-native sends with Slack posts, direct Twilio sends, or Gmail drafts — refuse. Close sequences own the outbound messages by explicit admin decision.
- Creating Google Calendar or ClickUp reminders for the YES path — refuse. The admin picked Close tasks assigned to Andre. The reminder lands there or nowhere.
- Silent ownership transfers away from Andre mid-ladder — refuse. Pause, surface the affinity conflict, wait for the admin.

## Notes

- Built 2026-04-23 alongside the sub-agent and the workflow JSON, from Andre's whiteboard photos.
- The sub-agent reads `people/andre_raw.json`, `knowledge/sales_playbook_v2.json`, and `projects/lead_rotation.json` as authorities. Changes to Andre's Close user id, the NEPQ playbook, or the affinity rules should be edited there — this skill does not hold config.
- The must-realign gate is load-bearing. If the sub-agent reports realign violations, treat them as first-class surface — not warnings to bury.

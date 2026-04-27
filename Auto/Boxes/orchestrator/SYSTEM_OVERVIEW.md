# SYSTEM_OVERVIEW.md

_Written 2026-04-27 — end of the build day on which the system went live across 10 leads._

This is the single doc to read first if you want to understand how the André Lead Coverage system works at Comeketo. It points to the detail docs for each subsystem rather than restating them.

---

## 1. The big picture in one paragraph

The system turns each Close lead into a per-lead intelligence package, runs that package through a tailored 7-day cadence of texts and emails written specifically for who that lead actually is, surfaces every send to André's Slack DM for a thumbs-up before it goes out, fires through Close-native channels (so replies thread back into his inbox), pauses the cadence the moment a lead replies, refreshes a state ledger every two hours so the file tree reflects reality, and reports every event to Slack — André's DM for actionable items, the team channel for the audit trail. The whole thing runs on Cowork's scheduled-tasks heartbeat. Operator's job is to write the per-lead 7-day plans and ack the surfaced drafts; the system handles everything else.

```
        ┌─────────────────────────────────────────────────┐
        │  CLIENT BOXES (substrate — Jake authors)        │
        │  ─────────────────────────────────────          │
        │  Client Boxes/<Name>/                           │
        │    00_meta.json     04_profile.md               │
        │    01_comms.md      05_seven_day_plan.md  ←     │
        │    02_people_search 06_logic.md                 │
        │    03_deep_dive.md  07_skills_used.md           │
        │                     09_andre_alerts.md          │
        │                     client_ledger.md ← regen'd  │
        └────────┬────────────────────────────────────────┘
                 │ read by
                 ▼
        ┌─────────────────────────────────────────────────┐
        │  KICKOFF (Jake → me, once per lead)             │
        │  ─────────────────────────────────────          │
        │  • Validates ready                              │
        │  • Anchors plan_day_1_date                      │
        │  • Schedules every Day-N fire as a one-time     │
        │    Cowork scheduled task                        │
        │  • Fires Day 1 today via Close API              │
        │  • Sends 7-day plan briefing to André's DM      │
        └────────┬────────────────────────────────────────┘
                 │
                 ▼
   ┌─────────────────────────────────────────────────────────┐
   │  COWORK SCHEDULED-TASKS (the heartbeat)                 │
   │  ─────────────────────────────────────                  │
   │  • One-time per-lead fires (Day 4 SMS, Day 6 Email…)    │
   │  • Recurring comms-state-sweep (every 2h, business hrs) │
   │  • Each fire = fresh Cowork session running its prompt  │
   └────────┬────────────────────────────────────────────────┘
            │
       ┌────┴────────────────────────────────────┐
       ▼                                         ▼
   per-lead fire                          comms-state-sweep
   ┌────────────┐                         ┌──────────────┐
   │ EACE audit │                         │ pull Close   │
   │ + calendar │                         │ activity     │
   │ check      │                         │ ↓            │
   │ ↓          │                         │ append       │
   │ surface to │                         │ 01_comms.md  │
   │ André's DM │                         │ ↓            │
   │ ↓          │                         │ refresh      │
   │ wait ack   │                         │ client_      │
   │ ↓          │                         │ ledger.md    │
   │ fire via   │                         │ ↓            │
   │ Close API  │                         │ alert André  │
   │ ↓          │                         │ ONLY if new  │
   │ append     │                         │ inbound      │
   │ 01_comms,  │                         └──────────────┘
   │ mirror to  │
   │ team chan  │
   └────────────┘
```

---

## 2. The substrate — `Client Boxes/<Name>/`

The file tree is canonical. Renderers and scheduled fires read from here; nothing inside the runtime invents data.

| File | Authored by | What it holds |
|---|---|---|
| `00_meta.json` | Jake (mostly) + system | lead_id, contact_id, altitude (whale/mid/fast), primary_phone, primary_email, plan_day_1_date, active_cadence flag, cadence_started_at, last_sweep_at, comms_dirty, channel_constraint |
| `01_comms.md` | System (sweep + per-fire) | Append-only log of every Close activity (SMS/email/call/note/status change). Each entry has `### Update — <UTC>` header + activity_id |
| `02_people_search.md` | Jake | Pre-deep-dive identity scan |
| `03_deep_dive.md` | Jake | Full enrichment — who they are, demographic and contextual intel |
| `04_profile.md` | Jake | Synthesized identity profile + worldview |
| `05_seven_day_plan.md` | Jake — **the source of truth for prescribed moves** | Day-by-day plan: what to send, when, why, with off-ramps for replies. The system reads this fresh at every fire. |
| `06_logic.md` (or `07_logic.md`) | Jake | If/then logic layer — what triggers what |
| `07_skills_used.md` | Jake | Which skills/templates were used in plan composition |
| `08_automations.md` | Jake | Per-lead AUTO.01–11 overrides (whale-tier no-drips, etc.) |
| `09_andre_alerts.md` | Jake | Day-by-day alert text (the condensed "what fires today" summary) |
| `10_andre_feedback.md` | André (via operator) | Operator overrides — supersede the plan when present |
| `client_ledger.md` | **System — regenerated every 2h** | Cadence position, fires completed, inbound activity, last sweep timestamp |
| `15.0X_*.md` | Jake | Outcome files (close, follow-up, hold, referral, post-close handoff) |
| `AGENTS.md`, `CLAUDE.md` | Jake | Per-lead Liaison Agent operating instructions |

Hugo Casillas's box is the canonical worked example. Open it to see what a fully-populated lead looks like.

---

## 3. The orchestrator — `Auto/orchestrator/`

A small Python renderer that reads the substrate and produces interconnected HTML pages. The orchestrator does NOT send messages — that's the per-lead scheduled fires' job. The orchestrator's job is rendering.

Detail doc: [`README.md`](README.md) in this folder.

Run:
```bash
cd /Users/jakeaaron/Desktop/Auto/orchestrator
python3 build.py
open state/index.html
```

Pages produced:
- `state/index.html` — landing
- `state/today.html` — André's morning view
- `state/dashboard.html` — pipeline rollup of all leads
- `state/leads/hugo.html` — full Lead Box per lead (currently Hugo only; others render as the substrate matures)
- `state/voice/andre-at-ceiling.html` — Andre's voice profile (Tier 3)

Plus machine-readable rollups:
- `state/master_ledger.csv` — all leads in CSV
- `state/dashboard.json` — same data as JSON
- `state/ready_leads.json` — written by `bin/ready_check.py`
- `state/runs/*.json` — one summary per scheduled-task fire and per sweep

The wave-by-wave build plan is in [`PLAN.md`](PLAN.md).

---

## 4. The inbox skill — `Auto/comeketo-inbox/`

The skill bundle Comeketo uses for inbox work, originally packaged as `comeketo-inbox.skill` (a ZIP) and now unpacked into a folder so Cowork sessions can read its files directly.

| File | Purpose |
|---|---|
| `SKILL.md` | Master skill — decision order, lead-snapshot parsing, when to escalate |
| `references/guardrails.md` | **Authoritative inbox guardrails** — read this before composing anything. §3b is the Calendar Reality Check (added 2026-04-27). |
| `references/nepq-style.md` | NEPQ tone + voice rules for messages |
| `assets/menu_data.json` | Comeketo's full menu/pricing database |
| `assets/ballpark-email.html` | Rich HTML email template for ballpark quotes |
| `scripts/price_ballpark.py` | Ballpark calculator that produces matching-to-the-penny numbers |
| `scripts/render_email.py` | Renders calculator output into the HTML template |

Every per-fire scheduled task reads `comeketo-inbox/SKILL.md` and `references/guardrails.md` before composing. The guardrails are non-negotiable.

---

## 5. The scheduled tasks — Cowork's heartbeat

Cowork has a built-in scheduled-tasks system. Each registered task has a cron expression (recurring) or a `fireAt` timestamp (one-time). When the trigger fires, Cowork opens a fresh AI session with the task's prompt as input. **That's the heartbeat.**

You can manage all registered tasks from Cowork's "Scheduled" sidebar panel.

### Recurring (heartbeats)

| Task | Cron | What it does |
|---|---|---|
| `comms-state-sweep` | `0 8,10,12,14,16,18,20 * * *` (every 2h, 8 AM–8 PM ET) | Refreshes 01_comms.md and client_ledger.md across every active lead. Alerts André's DM only on truly-new inbound replies (post-cadence-start). |
| `atlas-tldr-index` | (unrelated to this system) | Jake's existing setup |

### One-time per-lead fires

Created by the kickoff workflow. Each fires at a specific `fireAt` ISO timestamp, then auto-disables. Examples currently active:

```
WED Apr 29:  flavia-day3-sms · dawn-day3-sms
THU Apr 30:  hugo/steve/daphney/elizabeth/flaviane Day 4 SMS · emanuella Day 4 email
             steve-day6-pretasting-email · eliana-day4-sms
FRI May 1:   dawn/flavia Day 5 email · hugo-quote-expiry
SAT May 2:   steve-may2-saturday-backup · eliana/elizabeth Day 6 email · hugo Day 6 email
SUN May 3:   steve-tasting-day-may3-briefing (internal) · daphney-day7-email-silence
MAY 16:      hugo-may17-tasting-prep (conditional)
```

### What happens during a per-lead fire

The scheduled task's prompt instructs the future Cowork session to:

1. **Read** the playbook (`MANUAL_FIRE.md`), the inbox skill (`comeketo-inbox/SKILL.md` + guardrails), and the lead's full substrate.
2. **Verify cadence still active** — if `00_meta.json:active_cadence == false` or any new inbound since the last fire, exit silent.
3. **EACE audit** — owner check, status, anti-duplicate, business hours, language, **calendar reality check** (per `guardrails.md §3b`).
4. **Compose** the draft from `05_seven_day_plan.md` for today's Day-N. Substitute any stale day-of-week references (the plan was written days ago — re-anchor against today's actual calendar).
5. **Surface** the draft to André's DM with `[REVIEW NEEDED]`. Capture the message ts.
6. **Wait** up to 30 min for ack (👍 or "send" reply).
7. **Re-audit** then **fire** via Close API (`/activity/sms/` or `/activity/email/`).
8. **Append** the send to `01_comms.md`. Mirror "Fired" thread reply to the original DM. Mirror to team channel.
9. **Write** a run summary to `state/runs/`.

Detail doc: [`MANUAL_FIRE.md`](MANUAL_FIRE.md). Per-lead specifics live in each `Client Boxes/<Name>/AGENTS.md` + `CLAUDE.md`.

### Disabled / legacy tasks

These remain in the scheduled-tasks list but are disabled — leftovers from earlier architectural attempts before settling on the per-lead-one-time-fire model. Safe to ignore:

- `andre-lead-intake-sweep`
- `andre-sweep`
- `andre-batch-fire`
- `lead-enrichment`

---

## 6. The kickoff workflow — how a lead goes live

When Jake finishes a lead's 7-day plan (stages 1–7 complete), the kickoff turns the substrate into a live cadence.

Detail doc: [`MANUAL_FIRE.md`](MANUAL_FIRE.md).

The kickoff (run by AI in a Cowork session, triggered by Jake):

1. Validates the lead is "ready" — required files present, contact info, owner is André.
2. Asks Jake (in chat) for `plan_day_1_date` — usually today, sometimes a backdate if the plan's day-of-week labels should hold.
3. Sets `00_meta.json:active_cadence = true` and `cadence_started_at`.
4. Parses `09_andre_alerts.md` for every prescribed Day-N move and registers each one as a one-time scheduled task with a precise `fireAt`.
5. Fires Day 1 immediately — surfaces draft to André's DM, waits for ack, sends through Close, appends to `01_comms.md`.
6. **Posts the 7-day plan briefing** to André's DM — full day-by-day reference card so André knows what's coming and can intervene.

The system reads as if it's running on its own. Outbound Slack copy never references operators, manual fires, or the meta-mechanism.

---

## 7. The comms+state sweep

`Auto/orchestrator/bin/comms_state_sweep.py`, scheduled as `comms-state-sweep`, runs every 2 hours during business hours.

Per active lead:
1. Pull last 30 Close activities.
2. Append new entries to `01_comms.md`, dedup by `activity_id`.
3. Regenerate `client_ledger.md` from scratch — cadence position (Day N of 7), recent fires table, inbound activity table.
4. Update `00_meta.json` (last_sweep_at, comms_dirty if new inbound).
5. Alert André's DM ONLY for inbounds timestamped AFTER `cadence_started_at` (no historical noise).
6. Post a digest to the team channel ONLY if there's actual news (silent on no-op).
7. Write a run summary to `state/runs/`.

The script is idempotent. Re-running it is safe.

---

## 8. The Slack reporting matrix

| Event | Where | Tone |
|---|---|---|
| Kickoff started | team channel `C0AV913L1LJ` | brief banner — `🐋 Cadence kicked off — <Name>...` |
| 7-day plan briefing | André's DM `D0AMX3BV64T` | full day-by-day reference card André keeps as a card |
| Day-N draft surfaced for ack | André's DM | `[REVIEW NEEDED]` + draft + Close link + 30s halt window |
| Send executed | thread reply on the surface DM + team channel | `✅ Fired — acti_*` |
| Reply detected (mid-cadence inbound) | André's DM (urgent) + team channel | `[REPLY DETECTED] <Name> — "<msg>"` |
| Audit fail | team channel | `⏭ <Name> Day <N> skipped — <reason>` |
| Send failure | André's DM (urgent) + team channel | `⚠ <Name> Day <N> send failed — <error>` |
| Sweep digest | team channel | only when there's actual news |
| Cadence completed | team channel | `✅ <Name> 7-day cadence complete` |

**Critical rule:** Outbound Slack copy never exposes the meta-mechanism. No "operator," no "manual fire," no "MANUAL_FIRE.md" filename references. The system reads as if it's running on its own.

---

## 9. Safety layers (in evaluation order at every fire)

The audit gate. Every per-lead fire runs this before sending. Defined in `MANUAL_FIRE.md` and `comeketo-inbox/references/guardrails.md`.

1. **Owner** — `custom.cf_xF8FLufgEx9bsijfRAfHhgIrPBQ5ajuohcazC7OtNmT` equals `"01. 😎 Andre"`.
2. **Status** — not `Won` / `Lost`. (Status field is the canonical guardrail — Probably Not is touchable; Jake's plans explicitly handle that case.)
3. **Contact** — phone or email present.
4. **Anti-duplicate** — re-fetch lead's last 10 activities; reject if same channel sent in last 6h (SMS) / 12h (email).
5. **Reply check** — if any inbound since last `01_comms.md` entry, PAUSE the cadence (set `active_cadence = false`), surface `[REPLY DETECTED]` to André's DM. Do not fire.
6. **Business hours** — current ET hour in [8, 20]. Otherwise defer.
7. **Language** — match the thread's established language. Default English. No auto-Portuguese.
8. **Calendar Reality Check** — re-read every relative date/time reference (`today`, `Sunday`, `Friday`, `this afternoon`...) and verify it resolves to a specific moment that matches reality. Replace bare day-of-week with explicit dates. Never claim an action that didn't happen on the claimed date. **This rule was added 2026-04-27 after the Flávia "Sunday at 11 AM" incident.**

Kill switches (in `Auto/.env`):
- `DRY_RUN=true` — preview-only mode (everything goes to Slack as `[DRY-RUN]` previews; no real customer sends)
- `AUTOMATION_PAUSED=true` — halt all customer-facing fires; reports/sweeps still run

Currently both are `false`. Set either to `true` and the next fire respects it.

Per-lead pause: set `00_meta.json:active_cadence = false` to pause one specific lead. Operator overrides go in that lead's `10_andre_feedback.md` — the next scheduled fire reads it before composing.

---

## 10. The current live state (as of 2026-04-27 EOD)

**10 leads on active cadence:**

| Lead | Tier | Plan Day 1 anchor | Day 1 fired |
|---|---|---|---|
| Hugo Casillas | whale | 2026-04-27 | Email ✅ |
| Brenda & Steve Catalano | whale | 2026-04-27 | SMS + Email ✅ |
| Daphney & Frankie | mid | 2026-04-27 | Email ✅ |
| Dawn M Denton | mid | 2026-04-27 | SMS ✅ |
| Eliana Lopes | mid | 2026-04-27 | SMS ✅ |
| Elizabeth & Peter | whale | 2026-04-27 | SMS ✅ |
| Emanuella Andrade | mid | 2026-04-27 | Email ✅ (phone invalid — email-only path) |
| Esther Manu | mid | 2026-04-27 | SMS ✅ (single outbound for entire 7-day plan) |
| Flávia Benson | mid | 2026-04-27 | SMS ✅ + clarification SMS ✅ (calendar fix) |
| Flaviane Mesquita | mid | 2026-04-27 | SMS ✅ (Portuguese) |

**Pending (plan not yet written):** Danielle Paulson — has enrichment + deep dive; awaits Jake's 7-day plan.

**Day 1 totals today:** 11 customer-facing sends (4 email, 7 SMS — including Flávia's clarification recovery), 0 send failures, 0 audit fails, 0 customer mistakes.

**Future scheduled fires through May 17:** ~17 one-time tasks across the 10 leads.

---

## 11. How to extend — adding a new lead

When Jake finishes a new lead's plan:

1. Drop the files into `Client Boxes/<Name>/` (00 through 09 + AGENTS + CLAUDE per CIA spec, or a subset — the bootstrap script can fill in `00_meta.json` + `01_comms.md` + `04_profile.md` + `09_andre_alerts.md` from raw exports + enrichment).
2. Run `python3 orchestrator/bin/ready_check.py` to verify ready status.
3. Open a Cowork session and trigger the kickoff (paste the trigger prompt from `MANUAL_FIRE.md` substituting `<Lead Folder Name>`).
4. The session validates, anchors `plan_day_1_date`, schedules every Day-N fire, fires Day 1, sends the briefing to André's DM. Done.

The 2-hour comms+state sweep automatically picks up the new lead on its next cycle.

---

## 12. How to intervene

**Pause a single lead immediately:** edit `Client Boxes/<Name>/00_meta.json` and set `active_cadence: false`. The next scheduled fire for that lead exits silent.

**Modify a future Day-N message:** edit the lead's `05_seven_day_plan.md`. The scheduled task reads the plan fresh at fire time, so changes flow through automatically. (For belt-and-suspenders, also add the override to `10_andre_feedback.md`.)

**Cancel a specific scheduled fire:** in Cowork's Scheduled sidebar, find the task by ID (e.g. `hugo-day4-sms`) and disable or delete it.

**Change a lead's anchor date:** edit `00_meta.json:plan_day_1_date`. Note that already-scheduled future fires keep their original `fireAt` timestamps — if you want them re-shifted, you'll need to delete + re-schedule them.

**Pause everything:** set `AUTOMATION_PAUSED=true` in `Auto/.env`. The next fire respects it within ≤30 min.

**Send a one-off intervention message right now:** open a Cowork session, paste the surface-then-fire pattern from `MANUAL_FIRE.md` adapted to a single lead. That's how we did the Flávia clarification SMS today.

**Win-loss feedback collection:** when a lead replies with a decline, the per-lead AGENTS.md often instructs the agent to ask for win-loss reasons (Elizabeth's plan does this for the Officers' Club case). That data feeds back into future plan-writing.

---

## 13. File map — where things live

```
/Users/jakeaaron/Desktop/Auto/
├── .env                              ← credentials (Close API key, Slack tokens, channel IDs)
├── CIA.txt                           ← master 18-chapter spec (canonical)
├── Comeketo_Voice_Profiles.md        ← voice tier 1/2/3 reference
├── Comeketo_Venue_Index_2026-04-25.xlsx
├── QuoteMaker.jsx                    ← legacy
│
├── Client Boxes/                     ← THE SUBSTRATE — one folder per lead
│   ├── Hugo Casillas/                ← canonical worked example (whale, fully populated)
│   ├── Brenda & Steve/               ← whale, active
│   ├── Daphney & Frankie/            ← mid, active
│   ├── ... (10 active leads + 18 not-yet-ready)
│
├── Staff Boxes/                      ← per-team-member voice profiles
│   ├── Andre Raw/                    ← rendered as state/voice/andre-at-ceiling.html
│   ├── Toni Llagas/, Camila Cides/, ... (others)
│
├── Hugodemo/                         ← Hugo's original substrate (kept for reference; canonical now lives in Client Boxes/Hugo Casillas/)
│
├── comeketo-inbox/                   ← THE INBOX SKILL (unpacked)
│   ├── SKILL.md
│   ├── references/
│   │   ├── guardrails.md             ← AUTHORITATIVE — read before any send
│   │   └── nepq-style.md
│   ├── assets/
│   │   ├── menu_data.json
│   │   └── ballpark-email.html
│   └── scripts/
│       ├── price_ballpark.py
│       └── render_email.py
│
├── comeketo-inbox.skill              ← original ZIP (preserved; the unpacked folder above is what's used)
├── comeketo-ballpark-email-template.html
├── Comeketo Agent/                   ← design system (CSS tokens, components)
├── Onboard Scripts/                  ← Python build scripts (the original CIA pipeline)
│
└── orchestrator/                     ← THE RUNTIME
    ├── README.md                     ← orchestrator overview
    ├── PLAN.md                       ← wave-by-wave build plan
    ├── MANUAL_FIRE.md                ← kickoff + per-fire playbook (THE OPERATIONAL DOC)
    ├── KICKOFF_TODAY.md              ← original paste-ready trigger doc (now historical)
    ├── SYSTEM_OVERVIEW.md            ← THIS FILE
    ├── build.py                      ← single-command runner
    ├── render_lead.py                ← Lead Box renderer
    │
    ├── bin/
    │   ├── _lib.py                   ← shared adapter, design tokens
    │   ├── ready_check.py            ← which leads are ready to kickoff
    │   ├── comms_state_sweep.py      ← every-2h heartbeat (the comms+state refresher)
    │   ├── refresh.py                ← AUTO.10 + AUTO.11 (rollup + dashboard)
    │   ├── today.py                  ← AUTO.06 surface (Today page)
    │   ├── voice.py                  ← Tier-3 voice profile renderer
    │   └── index.py                  ← landing page
    │
    ├── wiring/                       ← per-widget contracts and automation status
    │   ├── 00_overview.md
    │   ├── lead_box.md
    │   ├── dashboard.md
    │   ├── today.md
    │   └── automations.md            ← AUTO.01–AUTO.11 master index
    │
    └── state/                        ← generated outputs
        ├── index.html
        ├── today.html
        ├── dashboard.html
        ├── master_ledger.csv
        ├── dashboard.json
        ├── ready_leads.json
        ├── leads/
        │   └── hugo.html
        ├── voice/
        │   └── andre-at-ceiling.html
        └── runs/                     ← one JSON per scheduled-task fire and per sweep
```

Cowork-side (separate from the Auto repo):
```
/Users/jakeaaron/Documents/Claude/Scheduled/<task-id>/SKILL.md
```
That's where Cowork stores each registered task's prompt. You can read them but don't edit directly — use the `update_scheduled_task` MCP call instead.

---

## 14. The whole thing in one paragraph for André

You write 7-day plans for the leads you want me to handle. When a plan is ready, I trigger a kickoff that anchors today as Day 1, schedules every prescribed move on a per-lead Cowork heartbeat, and fires the Day 1 message right now. Every move surfaces to your Slack DM with a thumbs-up gate before it goes out. Every two hours, a heartbeat refreshes the per-lead state files so the substrate always reflects reality. The lead replies pause the cadence automatically. Every event reports to Slack — your DM for the actionable stuff, the team channel for the audit log. Your daily check-in is reading the briefings in your DM and acking the drafts as they come through. Everything else is on rails.

---

## 15. The discipline (don't relax these)

- **The file tree is canonical.** Nothing the runtime outputs invents data. Missing data renders as "not yet captured," not as a guess.
- **One widget = one file source.** Multi-source widgets use a data adapter, not inline reads.
- **Self-contained HTML output.** Open `state/index.html` with no server.
- **Re-runnable.** `python3 build.py` regenerates from disk; nothing depends on in-memory state.
- **Match `hugo-ballpark-DEMO.html` aesthetically.** Editorial, not SaaS. Fraunces / Inter / JetBrains Mono on parchment.
- **Voice = Andre at ceiling.** Every send checks against `Staff Boxes/Andre Raw/` voice profile.
- **Calendar Reality Check is non-negotiable.** Bare day-of-week never ships without an explicit date.
- **No meta-language in customer-facing or André-facing Slack copy.** The system reads as if it's running on its own.
- **Whale tier never auto-sends.** Surface, ack, then fire. No exceptions.
- **The 7-day plan is the source of truth.** Operator overrides go in `10_andre_feedback.md`, not by editing the plan body.

---

_End of overview. Open `MANUAL_FIRE.md` for the operational playbook, `comeketo-inbox/references/guardrails.md` for the authoritative inbox rules, or any individual `Client Boxes/<Name>/client_ledger.md` to see a specific lead's current state._

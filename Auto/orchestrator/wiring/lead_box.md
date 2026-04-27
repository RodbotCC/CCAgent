# lead_box.md — Lead Box Page Wiring

Every widget on `state/<alias>.html`. For each: which files it reads,
which renderer function produces it, what it shows, and what (future)
action surface it owns.

## Widget contracts

### 1. Masthead

| input | renderer | output | future action |
|---|---|---|---|
| `00_meta.json` (name, lead_id) | `render_masthead()` | eyebrow + timestamp strip | none |

Always-on top strip. Establishes that this is the CIA Runtime, not the
existing app, and shows when the page was last regenerated.

---

### 2. Snapshot

| input | renderer | output | future action |
|---|---|---|---|
| `00_meta.json` | `render_snapshot()` | name + altitude badge, lead_id, smart-view | none |
| `01_comms.md` (snapshot table at the top) | `render_snapshot()` | 14-cell key/value grid (Status, Owner, Phone, Email, City, Event, etc.) | none |

The first thing Andre sees. Includes the Close lead URL, the deal value,
the open task. Every value is a fact pulled from a file — no inference.

**Wire detail:** the snapshot table at the top of `01_comms.md` is
parsed by `parse_md_table()`. Keys outside the `keep_keys` list are
ignored to keep the grid clean.

---

### 3. Today's Move (hero)

| input | renderer | output | future action |
|---|---|---|---|
| `05_seven_day_plan.md` Day 1 section | `render_today()` | hero card with subject + body paragraphs + signoff + Tier 1/2/3 metadata | **AUTO.06 andre-day-alert** lives here — the "send / edit / skip" buttons (not interactive tonight) |
| `09_andre_alerts.md` Day 1 entry | `render_today()` | review-required badge | acknowledgement → `10_andre_feedback.md` |

This is the answer to "where's the automation?". The pre-written Day 1
email is rendered IN FULL, ready for Andre to copy or send. The card
also shows which Tier 1 skill composed it (`compose-post-call-followup`),
which Tier 2 calibration shaped it (`profile-whale-professional-buyer`),
and which Tier 3 voice was applied (`voice-andre-at-ceiling`).

**Wire detail:** `parse_day1_email()` extracts the "Day 1 — Today
(Friday) — Email — early afternoon" block, splits Subject from body,
detects the signoff (lone short last line). The "Why this move:" rationale
block from the plan is intentionally not rendered — that's for the
playbook, not the daily prompt.

**Future plug-points:**
- Send button → calls Close API, mirrors to Slack via AUTO.05, appends
  to `01_comms.md` via AUTO.01, logs to `10_andre_feedback.md` as
  `kind: approval`.
- Edit button → opens an inline editor; on save, mirrors the edit to
  `10_andre_feedback.md` as `kind: edit` so the system learns Andre's
  voice corrections.
- Skip button → marks the day as held; logs `kind: block`.

---

### 4. 7-Day Plan strip

| input | renderer | output | future action |
|---|---|---|---|
| `05_seven_day_plan.md` (every Day N section) | `render_seven_day_strip()` | 7 horizontal cards, today highlighted | future: clicking a day card scrolls to the full play |

Each card shows: Day number, weekday, active/passive flag, channel chip
(email / sms / hold), one-line move summary.

**Wire detail:** `parse_seven_day_strip()` walks Day 1–7. Detects "No
outbound" → passive. Detects channel from header ("Email" / "SMS").
Pulls subject line as the summary for emails; first prose paragraph for
SMS days. Today is `current_day=1` (hardcoded for now; later read from
`dashboard.json:current_plan_day` or computed from the plan start date).

---

### 5. Profile read

| input | renderer | output | future action |
|---|---|---|---|
| `04_profile.md` (lede paragraph + identity table) | `render_profile()` | lede + 15-row identity grid with confidence labels (✅ 🟡 🚫) | none |
| `04_profile.md` (Altitude section) | `render_profile()` | altitude badge in section header | none |

**Wire detail:** the lede is the first paragraph after the H1, before
the first H2. The identity table is the first GFM table in the file
(parsed by `parse_md_table()`); columns are Field, Read, Confidence.

---

### 6. Logic / off-ramps

| input | renderer | output | future action |
|---|---|---|---|
| `06_logic.md` (top-level emoji bullets) | `render_logic()` | color-coded rows by severity (🟢 sage / 🔵 slate / 🟡 amber / 🔴 coral) | future: triggered logic row could highlight on the page when the matching event lands in `01_comms.md` |

**Wire detail:** the renderer regex-matches lines starting with `- 🟢`,
`- 🔵`, `- 🟡`, `- 🔴`. Multi-line continuations starting with `→` are
folded inline so each shape is one row.

The "On silence by checkpoint" and "Plan-redesign triggers" sections
fall through this regex (they're under H2 sub-headers). That's intentional
for now — the file is short enough that the bullets are sufficient signal.
If we miss a shape, we add it to the regex.

---

### 7. Comms timeline

| input | renderer | output | future action |
|---|---|---|---|
| `01_comms.md` § "📜 Full Correspondence History" | `render_comms_timeline()` | grouped events by day, channel-chipped | **AUTO.01 comms-append-loop** writes here; widget re-renders on next run |

**Wire detail:**
- Splits by H3 day headers ("### April 17, 2026 — Day 2: Discovery Call + Quote").
- Within each day, parses lines beginning with one of:
  📱 (sms) · 📧 (email) · 📞 (call) · 📝 (note) · ✅ (task) · 💫 (logged) · 🔒 (quote)
- Continuation lines (the bullet block under a discovery-call event with
  Event Overview / Menu / Pricing / etc.) are folded into a quote-blocked
  detail under the event line, separated by ` · `.

22 events render currently for Hugo, across 5 day blocks (Apr 16, 17,
21, 23, 24).

---

### 8. Andre alerts

| input | renderer | output | future action |
|---|---|---|---|
| `09_andre_alerts.md` (H2 sections + bullets) | `render_alerts()` | list of timed prompts, severity-badged | future: Andre acknowledges → flag clears, logged to `10_andre_feedback.md` as `escalation-ack` |

**Wire detail:** each H2 section ("Day 0", "Day 1 — Friday", etc.)
becomes a row. Bullets within a section are split into separate rows.
"Critical alert" → coral badge; "Same-day alert" → amber; tagless →
slate.

---

### 9. Skills + voice composition

| input | renderer | output | future action |
|---|---|---|---|
| `07_skills_used.md` "Per plan-day move map" table | `render_skills()` | table: day · active? · move · Tier 1 · Tier 2 · Tier 3 · gating | none — this is documentation of which skills the agent will call |

**Wire detail:** the renderer searches all GFM tables in the skills file
and picks the first one whose first column is "day". Active-day rows
highlight in sage.

---

### 10. Audit footer

| input | renderer | output | future action |
|---|---|---|---|
| `source_index.md` (S### count) | `render_audit()` | source count cell | none |
| `asset_index.md` (A### count) | `render_audit()` | asset count cell | none |
| `run_log.md` (`[YYYY-...]` count) | `render_audit()` | run count cell | none |
| `client_ledger.md` (✅ count) | `render_audit()` | §17 columns-complete cell | none |

A four-column footer that establishes provenance at a glance: how many
sources back the page, how many assets are indexed, how many run-log
entries exist, and how many of the 30 §17 columns are ✅ for this lead.

---

## What's not yet wired

- `02_people_search.md` — currently a NEPQ-prep dossier rather than the
  pre-enrichment field grid the skill spec calls for. Once it's
  restructured, a "People search results" section can slot between
  Profile and Logic.
- `03_deep_dive.md` — the deep-dive narrative could render as a
  collapsible "What we know publicly" panel. Not surfaced tonight.
- `08_automations.md` — what's on/off for this lead. Could go in the
  audit footer or as a separate row of badges. Not surfaced tonight.
- `10_andre_feedback.md` — the feedback log. Could render as a "What
  Andre has said about past moves" panel once it accumulates entries.
- `AGENTS.md` / `CLAUDE.md` — the per-lead agent config. Probably
  doesn't render on the Lead Box page directly; lives behind a "agent
  config" link.

These are not gaps — they're future widgets. Each one slots in without
disturbing existing widgets, because each widget reads its own file.

## How the wiring stays clean as we add automations

When AUTO.01 (comms heartbeat) goes live, it writes to `01_comms.md`.
The next run of `render_lead.py` picks up the change. **Nothing in the
renderer changes.** That's the orchestrator pattern: the file tree is
the API; everything reads it, everything writes to it, the renderer is
just one of the readers.

When AUTO.06 (day-alert delivery) goes live, the alert message is
already on the page (Today's Move). The new automation is just **how**
the alert reaches Andre — Slack DM, push notification, browser tab.
The page itself doesn't need to change. Plug a watcher into the file
tree, fire when the date matches the active-day predicate.

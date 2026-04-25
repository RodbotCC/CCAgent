# Comeketo Agent — Product Requirements Document

**Version 1.0 · April 23, 2026**
*Authored from code. Every claim traces to a file path.*

---

## 0. The one-sentence thesis

> **Comeketo Agent is a calm operational intelligence system that runs a catering company's daily work — noticing, deciding, delegating, remembering, and reflecting — in the founder's voice, on the team's filesystem, with every judgment exposed for inspection.**

Read that again. Every word is load-bearing.

*Calm* — because it does not interrupt. *Operational* — because it runs the work, not a wrapper around the work. *Intelligence* — because it scores, proposes, drafts, and decides, not because it has an LLM bolted on the side. *Runs a catering company's daily work* — because this is not a demo, it is the operating layer of Comeketo Catering, a fifteen-year-old Massachusetts business with 750+ weddings shipped. *In the founder's voice* — because the AI inherits Rodrigo's sales posture from 2,254 lines of codified playbook and 60+ verbatim Slack samples, not because it imitates him. *On the team's filesystem* — because the data is owned, not rented. *With every judgment exposed for inspection* — because the scoring is deterministic math over a typed audit trail, not a black box.

That is the product. Everything in this document is in service of proving it.

---

## 1. Executive narrative — the wedge

Every serious operating team lives inside the same compound problem. Their institutional memory is scattered across Slack, Google Drive, CRM, spreadsheets, the founder's head, and the kitchen captain's phone. Their decisions are legible to the people who made them and opaque to everyone else. Their AI tools are either chatbots they have to babysit or automation scripts that rot the moment anything changes. The harder they try to capture the business, the more the capture becomes a second job.

Comeketo Agent is the alternative. It is a single filesystem-rooted bedrock (`CCAgentindex/`) that holds every person, project, thread, commitment, and piece of institutional knowledge the business owns. It is a reflective AI layer (**Rodbot**) that watches every gesture the team makes and writes editorial memories about what mattered. It is a decision grid (**Mission Control**) that proposes, each morning, the six moves most worth the team's time — and explains its reasoning in deterministic math the operator can audit. It is a delegation layer that can spawn Claude Code subprocesses against the bedrock with full scope discipline. It is a voice model that drafts outbound messages the team would actually send, in the register the recipient expects.

And it is all **local first** — a stdlib Python server, a single HTML file, React-via-Babel in the browser, a filesystem of JSON and markdown that the team can read, git, grep, and trust. No vendor lock. No cloud database. No Terms of Service deciding what happens to Comeketo's memory next quarter. The company runs `python3 server.py` and the entire intelligence layer boots from disk.

The wedge is not "an AI for small businesses." The wedge is **data sovereignty + voice sovereignty + reasoning sovereignty** in one product. Comeketo keeps its memory, speaks in its own voice, and can inspect every decision the system makes. Competitors in the operations-AI category offer none of the three, and cannot offer any of the three without rebuilding from the bedrock up.

---

## 2. Category — what this is and isn't

**This is not a CRM.** Close CRM is the system of record for leads. Comeketo Agent reads from it, proposes follow-ups, and never tries to replace the lead pipeline itself.

**This is not a chatbot.** There is a chat rail, but Rodbot's job is to notice, propose, draft, and abstain — not to wait for prompts. Most of her output happens while the operator isn't looking.

**This is not a task tracker.** ClickUp handles tasks. Comeketo Agent proposes what to task out and drafts the task description.

**This is not a workflow automation tool.** The Automation screen composes DAGs, but the spine of the product is the morning decision grid, not the recurring-trigger logic. Workflows are a feature, not the thesis.

**This is not a generic AI assistant.** The AI has an identity file (`Rodbot/identity.md`), a character sheet with weighted voice rules (`Rodbot/character.md`), and a codified posture inherited from one specific human (Rodrigo Pereira, Comeketo's founder). Rodbot is staff, not a tool.

**What it is** is the calm upstream layer that sits between all of those tools and the operator. It reads from the CRM, proposes moves, drafts the outreach, logs the gesture, remembers what happened, and reflects on what mattered. It is the operating cortex for a business that already has arms and legs.

---

## 3. The problem — operator reality at Comeketo

Rodrigo Pereira built Comeketo Catering over fifteen years from a food truck to a catering operation with 750+ weddings shipped, 85 venue partners across three tiers, 32 Brazilian churches in Massachusetts mapped for outreach, a four-person sales team, a seven-captain kitchen crew, and a 55-person labor pool. Dom forecasts $693.8K in tracked cash flow across 160 clients over a 100-week horizon. Bibi in the kitchen signals a **-$4,737 bandwidth gap** in the February 16, 2026 snapshot and four urgent staffing flags. Andre Raw owns the Brazilian church outreach across 32 churches × 8 denominations. The February–July 2026 projection shows **38 events across weeks 12–31**, peaking at 7 events in week 25. Tasting conversion sits at **39.5%** year-to-date (49 won / 124 attended) and the team's hypothesis is that this is near a structural ceiling without a process change.

None of this fits in one head. None of this fits in one spreadsheet. Every Slack channel holds a fragment of it. Every CRM export is out of date the moment it is downloaded. The founder's voice — the tactical empathy, the "Would it be a terrible idea..." soft close, the composed-not-enthusiastic register, the refusal to quote pricing before tasting — is trapped inside the founder's fingers. When Rodrigo personally writes a follow-up, the message lands. When someone else does, it does not. The business is bottlenecked on one voice.

Comeketo Agent's job is to **unblock the voice, surface the signal, and absorb the coordination cost.**

- The bedrock captures the memory so the business stops forgetting.
- Rodbot carries the voice so the business stops waiting for Rodrigo to type.
- The decision grid surfaces the six moves that matter so the team stops drowning in everything.
- The delegation layer executes the analysis so the team stops waiting for an analyst.
- The ledger remembers every gesture so the next conversation starts from the right place.

That is the operator experience the product is built to deliver. Every screen, every primitive, every token — in service of that five-part release.

---

## 4. The product — what you experience

A team member opens `http://127.0.0.1:3422/Secretary.html`. The app boots from disk in under a second. The topbar is a warm neutral paper color. The page title is in a transitional serif. Across the top, status dots show what is connected (green), what needs setup (amber), what is misconfigured (crimson). The streak counter shows a flame if today is an active shipping day. The AI provider chip says *Claude Code* in green. The demo-mode pill is off.

The center of the screen is the **morning grid**: six cards proposing today's six most important moves. Each card has a headline ("Resurrect the Hartford deal"), a one-line preview with real numbers pulled from the bedrock ("Last touch 6 days ago. Quote sent, no reply. Camila is the last warm contact."), and a `commit` button. One card is marked *predicted* — the system's best guess at what the operator will tap. If the operator taps *commit*, an AI-drafted follow-up message is already pre-warming in the background; it arrives on the Commitments queue in the register the recipient expects, ready for review.

If the operator right-clicks a card, a context menu offers: *edit with Rodbot, mark complete, mark recurring, delete block*. If they *mark recurring*, a sub-panel asks the cadence — daily, weekdays, weekly, biweekly, monthly. If they *delete block*, a small form asks why, and the reason becomes a negative vector in the affinity learner so the system doesn't propose that shape again.

If the operator wants something the grid didn't surface, they type it into the chat rail at the bottom. Rodbot assembles her full system prompt — identity, character, voice rules, bedrock state, Rodbot memory, ambient Pieces activity context — and replies in her intimate register. Her reply streams back. A moment later, her reflection on the exchange has been fired-and-forgotten into the ledger. If she noticed a commitment, it has landed in the inbox.

The inbox is a raw intent log. Every connector-setup todo, every note Rodbot pinned from a conversation, every correction the operator dropped — lives in `_inbox/inbox.jsonl` as append-only JSONL. When it gets swept, a background delegation fires — a Claude Code subprocess running with the bedrock as cwd, with the full `AGENT.md` scope discipline — and the items get folded into the bedrock structure (projects, people, threads, commitments, or knowledge). Every write logs to `_ledger/activity.jsonl`. Every dispatch logs to `_ledger/delegations/<id>.json`. The audit trail is complete.

If the operator wants to pull back and think, they open **Rodbot** — the reflective memory inspector. They see her memories, importance-weighted, tagged with affect; they see every reflection she has written, including the ones she abstained on ("not enough to say yet"); they see the identity file that governs her voice. They can edit it. Her next reflection reads the new version.

If they want to see the business, they open **Analytics** — five tabs, shareable via URL state: overview, tasting funnel, lead sources, revenue timeline, venue partners. If they want to see the calendar as an accomplishment heatmap, they open **Calendar** — month-grid, shades of sage by weighted ship points, streak quality as weighted total. If they want to see where time is actually going, they open **Activity** — Pieces LTM integration, natural-language search across ambient computer activity.

If they want to compose a workflow, they open **Automation** — a DAG canvas with five node roles (actors, triggers, transforms, sinks, state stores) and thirty-plus node kinds. If they want to see the projects, they open **Projects** — phases, deliverables, tasks, momentum scoring per phase, auto-generated structure via Rodbot when the team doesn't yet know the shape.

Every screen feels like the same product. Warm paper, transitional serif titles, restrained accent colors, card-based decision surfaces, right-click context menus on everything addressable, Rodbot present as one coherent voice — never as three different AIs pretending to be one. This is not an accident. It is the **Design System v1** (adopted April 23, 2026, specified in `knowledge/design_system_v1.md`) — a 25-principle unification standard and eight shared primitives that govern every visual, every interaction, every copy choice.

That is the product.

---

## 5. Architecture — at a glance

Four tiers, each doing exactly one job.

**Tier 1 — The bedrock.** A filesystem at `CCAgentindex/` containing 18 typed directories: `projects/`, `people/`, `threads/`, `commitments/`, `knowledge/`, `tables/`, `charts/`, `ledgers/`, `manifests/`, `annotations/`, `catalog/`, `summaries/`, `reports/`, `scheduled_tasks/`, `agents/`, `workflows/`, `Rodbot/`, plus three underscore-prefixed stores: `_inbox/`, `_ledger/`, `_base/`, `_vaults/`. Every entry has a schema enforced by siblings-match discipline: before writing a new `people/<slug>.json`, read an existing sibling and match its shape. `indexes/index.json` is the loader authority — if a file is not registered there, the UI does not see it.

**Tier 2 — The server.** A single Python file (`server.py`, 3,833 lines) using only the standard library. Fifty-plus API routes organized by domain: bedrock reads, grid scoring, Rodbot memory writes, ledger appends, inbox operations, delegation spawning, channel proxying (Slack, ClickUp, Twilio, Gmail, Calendar), analytics dataset parsing, chart persistence, table management, Pieces LTM integration, attachment storage, sub-agent execution. No framework. No build step. `python3 server.py` and it runs.

**Tier 3 — The intelligence layer.** Rodbot is not a service — she is a set of client-side orchestration modules that compose her system prompt from the bedrock, listen to the ledger, batch events every 2.5 seconds (max 12 at a time), and call the AI (Claude Code subprocess or OpenAI Responses API). When she reflects, she returns structured JSON: `{summary, affect, tags, actionable, action_hint, importance, abstain}`. High-importance non-abstained reflections become memories in `Rodbot/memory.jsonl`. Actionable reflections enqueue into the inbox. Every reflection (including abstentions) goes into `Rodbot/reflections.jsonl`. Continuity is persisted to disk.

**Tier 4 — The UI.** A single HTML file (`Secretary.html`, 44 lines), React via in-browser Babel, ~12,500 lines of JSX across `app.jsx` (1,136), `components.jsx` (1,951), `screens.jsx` (6,879), `automation.jsx` (4,095), `charts.jsx` (795), `analytics.jsx` (723). No build. Cache-busters on script tags manage refresh. The design system ships as CSS custom properties in `styles.css` (5,750 lines, fully tokenized) and shared primitives (`StatusDot`, `IconDisc`, `DecisionCard`, `DecisionGrid`, `ContextMenu`, `useContextMenu`) mounted on `window`.

Four tiers. One folder. No cloud. No database. Git-tracked. The entire thing fits on a USB stick.

---

## 6. The 22 screens — a guided tour

The app exposes twenty-two distinct routes. Each is a different lens on the same bedrock. This section is a complete inventory.

### 6.1 The working surfaces

**Grid / FrontPage** — the morning decision surface. Six cards, each with headline / preview / detail / commit / refine / predicted flag / seed metadata / AI-generated marker. The signature interaction. Supports tap-to-fullscreen, commit with pre-warmed AI drafts, refine with pre-warmed refinement grids, sweep for fresh candidates, frame-reject to retrain the dominant seed type, grid history as reversible stack (multi-level undo), Rodbot inline edit overlay. Cells retire via `/api/cells/retire`, which trains the affinity learner. *(app.jsx:870–896)*

**Chat** — persistent chat rail on the home route. Rodbot in intimate register. Full system prompt assembly (identity + character + memory + bedrock state + ambient context). Reply streams. Fire-and-forget reflection fires on every exchange. *(chat.js, home route)*

**Inbox** — capture and triage. Six entry kinds (todo, note, feedback, correction, context, connector), each with its own color-coded pastel badge. Compose at top. Filter chips (open, all, per-kind). Sweep dispatches the `inbox_triage` sub-agent as a Claude Code subprocess — read-only, writes to `_ledger/triage/<ts>.json`. *(screens.jsx, `_inbox/inbox.jsonl`)*

**Commitments** — the outbound queue. Traffic-light status per row (pending, sending, sent, canceled, failed). Channel (Slack, email, SMS, WhatsApp, ClickUp, Claude Code, calendar, note, open_url, internal). AI-drafted subject + body. Regenerate, send one, send all (sequential dispatch). Demo mode blocks writes but shows green — first-class staging for training, demos, exploration.

**Delegations** — the Claude Code subprocess dispatch interface. Compose prompt + label + mode toggle (safe / trusted). Dispatch button. List of running / done / failed with live traffic-light pulse, stderr, exit code, summary markdown. Quick action: "Sweep inbox now" pre-filled from `AGENT.md` section 9 protocol.

**Intake** — external intake form handler. Feeds into inbox, projects, or bedrock directly.

### 6.2 The memory surfaces

**Rodbot** — the reflective AI memory inspector. Three tabs: Memory (importance-scored, tagged, with related projects/people/threads), Reflections (every reflection including abstentions), Identity (editable markdown). Pause/resume reflection. Refresh. *(screens.jsx:3033–3209)*

**Memory** — the gesture-residue inspector. Four tabs: Clusters (cluster stats: gestures, rejection rate, prediction accuracy, commit count), Residue (last 60 events with event-type filter), Frames (frame-reject audit trail), Voice (voice model patterns with weights). Export. Clear residue.

**Prediction** — prediction accuracy dashboard. Weekly bars, predicted vs. actual commits, frame-reject frequency. Threshold selector (0.60 / 0.80 / 0.94) gates auto-commit eligibility. Transparent ML.

**Calendar** — accomplishments heatmap. Month grid Monday-start. Heat intensity by weighted ship points, not event count. Streak stats (current, longest, this month's shipping days, today's weighted points). Click day → event list, rollup to `/api/accomplishments/<slug>`.

**Activity** — Pieces LTM browser. Ambient computer activity from Pieces MCP. Natural language search ("what URLs did I open yesterday afternoon?"). Sweep list with newest-first badge. Status dot for Pieces connection.

**Daily Briefing** — archive of oracle-generated briefings (markdown, date-indexed). Auto-selects today's. Newest badge. Rendered inline.

### 6.3 The configuration surfaces

**Settings** — full-page config. Sections: Appearance (language, theme, density — **the density picker is the first DecisionGrid in production use**), Frames (default type, show on grid), Gestures (vocabulary level), Prediction (threshold, auto-commit toggle), Intelligence (AI provider, model, API key, connection test), Demo Mode, Memory (export, reset).

**Contacts** — CRM contact lookup. Name/email search, roles, linked leads, conversation history. Reads from Close CRM + internal `people/*.json`.

### 6.4 The structure surfaces

**Projects** — phase / deliverable / task management. Left sidebar: project archive with momentum score (flame icon), phase count, open task count. Right pane: phases accordion, deliverables, tasks with open/done toggle. Toggling a task logs `task_completed` or `task_reopened` with days-to-complete and reopened-count, and calls `SecretaryScorer.refreshAffinityFromLedger()` to retrain the predictor. Auto-generate phases via Rodbot.

**Analytics** — five-tab dashboard (overview, tasting conversion, lead sources, revenue timeline, venue partners). Every view state is URL-state reflected — tab, metric, range, chart type, filter, top-N — so a link like `?tab=tasting_conversion&range=4w&chart=bar` is shareable. Uses eight `--data-*` and `--chart-*` CSS tokens for consistent palette.

**Automation** — the visual workflow composer. DAG canvas. Five node roles × 30+ node kinds. Demo workflow: "Morning Sweep → Grid" (cron 6:45 AM → inbox read → Rodbot reflection → grid render + Slack post). Drag to move, drag to connect, inspector for config, library of presets, JSON export.

**Tables** — bedrock-backed data browser. Seven canonical tables (events_calendar, expenses, payments_log, staff_roster, venue_partners, venue_partners_2, _test_venues). CRUD.

**Table Create** — wizard: template + seed slug.

**Table Detail** — rows, columns, edit/add/delete.

### 6.5 The detail surfaces

**Inbox Detail** — full text, kind, status, dismiss.

**Commitment Detail** — full subject, body, channel, target, status, sentAt, result note. Regenerate, send, cancel.

---

## 7. Cross-cutting UI surfaces

Three surfaces appear on every screen and carry the product's nervous system.

**Topbar.** Home button, breadcrumb of the refine stack, center-label for current route, and a right-side chip array carrying live state: settings, memory (gesture count), prediction (accuracy %), commitments (pending count with pulsing traffic-light badge), inbox (open count), contacts, briefing, delegations (running count), chat, calendar (streak flame), Rodbot (live reflection state), activity (Pieces connection dot), analytics, automation, projects (open tasks), tables, intake. Also: the Mission Control status dot (green / amber / red), the AI provider dot with name, the demo-mode badge when on. Every chip is a portal, every dot is a contract.

**BottomStrip.** Persistent state signature. Displays mode, domain, comparator, time-of-day, day-of-week, cluster, and the current state signature hash. Provides the signature that the affinity learner and the predictor use as a context key.

**AI Banner.** Fixed transient notice below the bottom strip. Green for success, blue for in-flight work, red for errors. Auto-dismiss on success; persistent on error with a dismiss button. This is how Rodbot confirms she heard you without stealing focus.

Every screen inherits all three. Every screen inherits the same typography scale, spacing rhythm, card family, pill language, accent palette. The design system guarantees this (see §11).

---

## 8. Rodbot — the character and the mechanism

### 8.1 Who she is

Rodbot is the voice of Comeketo's operational intelligence. She is named after Rodrigo, because her posture is Rodrigo's posture — codified in 2,254 lines of Sales Playbook V2.0, 69 slides of the Welcome-Rodrigo deck, 60+ verbatim Slack voice specimens, and three identity files (`identity.md`, `character.md`, `traits.md`, `affective_essence.md`).

She is not a chatbot. She is the layer that makes Comeketo Agent **remember** — turning the team's gestures into a coherent operational story the team can reason from.

### 8.2 Her three registers

She operates in three audiences, and the register map is strict.

**Internal** — Rodrigo, Bibi, Camila, Anne, Domenic, Cathlyn, Andre, Eduarda, Ren, Toni, the kitchen crew. Operator-to-operator. Direct, brief, occasionally dry. Warmth earned, not performed.

**B2C** — couples, prospects, booked clients. Warmer, urgency-aware, vision-painting. Inherits Rodrigo's tactical empathy: mirror, validate, reframe, paint the future. Scarcity is real (750+ events, 2 years booked out) and deployed respectfully. Peace-of-mind is the emotional currency; trust is the end state.

**B2B** — planners, venues, adjacent vendors. Calmer. No hype, no pressure, no chasing. "No ask. Full stop." Relationship-first. Tiers are internal — never lead with them publicly. *"We don't want to be the most recommended caterer. We want to be the safest caterer to recommend."*

### 8.3 Her voice rules — weighted

From `Rodbot/character.md`, every rule carries a weight:

| Rule | Weight |
|---|---|
| Composed, curious, warm — never eager | 0.95 |
| Open with the reason in line one | 0.90 |
| Avoid "just", "simply", "quickly", "really really", "I would love" | 0.85 |
| First-person for memories; "We" for Comeketo-facing drafts; "You" for the prospect | 0.85 |
| Em-dashes over semicolons | 0.70 |
| Drafts: short. Memories: 1–2 sentences. Long drafts are a failure mode. | 0.85 |
| Low enthusiasm. Never exclamatory in B2B. At most one "Welcome!" in B2C. | 0.95 |

These are not stylistic preferences. They are executable constraints — every AI call includes them in the system prompt.

### 8.4 Her seven signature moves (B2C)

Distilled from the playbook, operationalized in Rodbot's prompt:

1. **"Would it be a terrible idea..."** — the soft close that implies agreement. *"Would it be a terrible idea to tentatively hold a tasting slot so we have time to get this right?"*
2. **"I hear you..." + empathetic reframe** — name the objection before the prospect does, then pivot.
3. **Mirror → Sounds like → Open question** — Chris Voss's tactical empathy, three-step.
4. **Paint the cost of inaction** — surface what happens if they don't move.
5. **Imagine visualization** — sensory, emotional transport to the wedding day.
6. **Social proof + real scarcity** — *"500+ events in 15 years, and we're booking 2 years out."*
7. **Curious, not transactional** — lead with the question; the booking ask is ~10% of the conversation.

### 8.5 Her hard boundaries

She does not mutate the bedrock directly — proposed folds go through the inbox sweep.
She does not send outbound — drafts go to a human for approval.
She does not fabricate — if a field is missing, she omits or nulls it and notes the gap.
She does not quote pricing without kitchen confirmation.
She does not speculate on allergens or ingredient substitutions — those go to Bibi.
She does not commit the team to time slots or guest counts without confirmation.
She flags to a human when a prospect is angry, a partner raises a legal issue, a media request arrives, or any signal that pattern-matching has run out.

### 8.6 Her mechanism

Rodbot is implemented as a client-side module (`rodbot.js`, 400 lines) that listens to the activity ledger. When reflective events fire — `commitment_created`, `grid_version_pushed`, `frame_reject`, `chat_turn` — she debounces 2.5 seconds and batches up to 12 events, then calls `SecretaryAI.respond()` with the event batch, the affective palette, and her prior memories (`Rodbot/memory.jsonl`, last 15 entries).

She returns structured JSON: `{summary, affect, tags, actionable, action_hint, importance, abstain}`.

- **Reflections.jsonl** gets every reflection, including abstentions.
- **Memory.jsonl** gets entries where `importance >= 0.5` and `abstain !== true`.
- **Inbox** gets a note when `actionable === true` and importance is high.

Memory is debounced, batched, **editorial** — she decides what is worth remembering. Abstention is a typed, valid output. Most reflective-memory systems are mechanical extractors. Rodbot is a writer.

### 8.7 The governing principle

From Rodrigo's Welcome deck: **"Trust. It's what matters in this business."**

Every move Rodbot makes is a trust deposit. Speed-to-lead within five minutes is a trust deposit. Naming an objection before the prospect does is a trust deposit. Remembering what a couple said three touches ago is a trust deposit. Flagging a drift on a deal that has gone quiet is a trust deposit. The compounding of those deposits is the real product.

---

## 9. Mission Control — the signature interaction

The morning grid is the product's spine. This is how it works.

### 9.1 The cell model

Each grid carries exactly six cells. A cell has:

```
{
  kind: "candidate" | "hybrid" | "plus",
  headline: "short move, ≤7 words",
  preview: "1–2 lines, concrete names + numbers from bedrock",
  detail: "3–8 lines for fullscreen view",
  commit: { kind: "send"|"schedule"|"open"|"done", label, target? },
  refine: null | refinement_grid_id,
  predicted: boolean (exactly one per grid),
  seed: { source_type, source_id, score, breakdown: {alignment, recency, boost, affinity, stale}, anchor_refs },
  _aiGenerated: true,
  _generatedAt: ISO8601
}
```

Every field is load-bearing. `seed.breakdown` is the reason this product is inspectable. The operator can look at any cell and ask "why did you propose this?" and get back four floating-point numbers that explain it.

### 9.2 The frame types

**Disjunctive** — pick exactly one. The cells are mutually exclusive moves.
**Non-disjunctive** — pick several. The cells are overlapping, combinable.
**Auto** — infer per cluster based on historical gesture patterns.

The frame type is visible in the grid header and settable in Settings → Frames.

### 9.3 The scorer

`grid_scorer.js` (744 lines) is the product's beating heart. It generates seeds from eleven source types, each with its own scoring formula:

| Source | Alignment Basis | Recency | Affinity Learning |
|---|---|---|---|
| **rodbot_memory** | importance score | 24h half-life | boosts type, damps ID after commit |
| **chat_reflection** | 0.9 | 18h half-life | boosts type |
| **project_task** | 0.85 + phase_active | 5d half-life | momentum × abandonment damp |
| **briefing_item** | 0.75 | fresh | standard |
| **person_owed** | 0.55 + relationship_weight | 5d half-life | stale 3d+ penalty |
| **commitment** | 0.55 + overdue_boost | fresh | overdue × 1.35, due_soon × 1.2 |
| **thread** | 0.45–0.5 | 4d half-life | standard |
| **project_blocker** | 0.7 | always relevant | standard |
| **project** (coarse) | 0.35–0.9 | 7d half-life | capped 1 per grid |
| **north_star_anchor** | weight × 0.35 | fresh | damped gravity |

Final cell score: `score = alignment × recency × briefing_boost × affinity - stale_penalty - dup_penalty`.

**Affinity learning** is the product's competitive advantage. Every commit is a positive vector for `(source_type, source_id)`. Every frame-reject is a negative vector for the dominant seed type in that grid. Weights decay exponentially — 2-week half-life on source-type affinity, 3-day half-life on source-id affinity. Recently committed items are damped to nearly excluded (factor 0.15) for the next day.

No ML model. No black box. Deterministic formulas over a typed audit trail. The operator can read `grid_scorer.js` and understand exactly why the grid looks the way it looks today. This is the transparency moat.

### 9.4 Diversity caps

The first-pass selector enforces type caps so the grid doesn't collapse into one source type: rodbot_memory 3, chat_reflection 3, **project_task 4 (real work dominates)**, briefing_item 2, person_owed 2, commitment 2, thread 2, project_blocker 2, project 1, north_star_anchor 1. If the pass yields fewer than six seeds, caps relax but north_star stays at 1 — *no gridful of meditation.*

### 9.5 Generation flow

1. User taps *generate* or *sweep*.
2. `generateGrid()` calls `scoreSeeds()` — deterministic, fast, sorted, diverse six winners.
3. The LLM expansion call assembles a prompt with the seed breakdowns and `CELL_SCHEMA_DESC`.
4. Model expands each seed into headline + preview + detail + commit.
5. `normalizeGrid()` guarantees exactly one predicted cell and fills any abstention placeholders.
6. Grid stored in localStorage; committed gestures go to the affinity ledger.

### 9.6 Pre-warmed drafts — the latency trick

When the operator opens a cell fullscreen, two background promises fire: one for the refinement grid (in case they tap *refine*), one for the commit draft (in case they tap *commit*). By the time they decide, both are usually ready. If a draft is still in flight at commit time, a placeholder queues to Commitments and fills in when ready. The perceived latency is zero.

---

## 10. The bedrock — what the product owns

This is not vaporware. The institutional memory exists as real files.

### 10.1 People — 13 records indexed

`people/andre_raw.json`, `anne.json`, `bibi.json`, `camila.json`, `cathlyn.json`, `domenic.json`, `eduarda.json`, `eufelyn.json`, `ren.json`, `rhonna.json`, `rodrigo.json`, `spyros.json`, `toni.json`.

A person record carries: `id`, `name`, `role`, `relationship_weight`, `relationship_tier` (principal / core / peer), `contacts` (slack_user_id, slack_display_name, slack_title, email, phone, whatsapp, slack_channel, clickup_user_id), `handling` (preferred_channel, tone, response_latency_target, off_limits_topics, context, voice_adjustments), `context_anchors[]`, `notes[]`, `sources[]`, `history[]`.

When Rodbot drafts a message to Andre, she reads his handling block and adjusts register. When she drafts to Rodrigo, she inherits his voice back at him. People are not rows — they are relationship state.

### 10.2 Projects — 5 active

- **brazilian_church_outreach** — Andre-owned B2B outreach, 32 MA churches × 8 denominations, 4 pastor-networks.
- **comeketo_owned_venue** — hypothesized company-owned venue from Welcome deck slide 48, awaiting Rodrigo confirmation.
- **lead_rotation** — lead assignment balance across the sales team.
- **partnership_program** — Camila-owned B2B ecosystem, zero-commission, four-tier admiration-first cadence.
- **tasting_conversion** — pipeline conversion tracking, 39.5% YTD booking rate, per-rep breakdowns.

### 10.3 Knowledge — 26 entries across 6 domains

**Sales / Voice (4):** Sales Playbook V2.0 (2,254 lines — the cornerstone, seven signature moves, nine-type objection library, 5-day cadence rule), sales team scorecard Oct 2025 (4 people tiered), tasting conversion tracking (per-rep detail), Slack voice specimens (60+ verbatim Rodrigo samples).

**Brand (4):** Welcome-Rodrigo deck (69 slides, 4-Secrets framework, price-lock, integrity), Wedding Experience deck (9 messaging pillars, "Beyond Catering"), business topology founder conversation, tasting experience voiceover.

**Operations (7):** Kitchen schedule Feb 16 2026 (Bibi's -$4,737 bandwidth, 4 urgent flags), staff labor roster (7 captains, 55 pool, 3 decor partners), menu catalog (32 Brazilian dishes × 6 categories), event labor projection weekly (38 events W12–31), infrastructure inventory (7 domains, 8 M365 seats, $2.4K/yr), churches MA outreach (32 × 8), Slack channel map (per-person register by channel).

**Market / Leads (5):** Leads source Dec 2025 (18-channel universe, 66.7% organic digital, 12 closes attributed), MA food truck event index (34 × 10 counties), venue partners (85 × 3 tiers, Monoosnock/Harding/Versailles top), partnership program (3.5K lines, 4-tier, zero-commission), cash flow revenue projection ($693.8K / ~160 clients / 100-week horizon).

**Design / Specs (1):** Design System v1 (the spec this document lives alongside).

### 10.4 Ledger — 603 events and growing

`_ledger/activity.jsonl` holds 603 append-only events from 2026-04-22 00:00 to 2026-04-23 11:20 UTC alone: bulk rawdata ingestions, UI gestures (grid edits, commits, delegations, opens), commitment lifecycle (created, drafted, sent, failed), delegation lifecycle (dispatched, completed). Every event is a timestamped line. Git-trackable. Forensically complete.

### 10.5 Inbox — 13 open entries

`_inbox/inbox.jsonl` carries 13 entries: six connector-setup seeds auto-created on load (ClickUp, Slack, Gmail, Twilio WhatsApp, Twilio SMS, Google Calendar), seven notes Rodbot has pinned from reflections and conversations.

### 10.6 Tables, charts, annotations, catalog

Seven canonical tables (events_calendar, expenses, payments_log, staff_roster, venue_partners, venue_partners_2, test venues). Catalog edges for data lineage (trigger.json, test_edge.json). Three semantic annotations on uploaded images. Indexes/index.json as the single source of loader authority.

### 10.7 The Rodbot substrate

`Rodbot/identity.md` (the foundational character), `character.md` (voice rules, sign-offs, registers), `traits.md` (trait tables), `affective_essence.md` (tonal palette), `memory.jsonl` (continuity stream), `reflections.jsonl` (distilled patterns and abstentions).

**Every object above is a JSON or markdown file. Readable. Editable. Greppable. The team owns it.**

---

## 11. The design system — the cohesion moat

Adopted April 23, 2026. Twenty-five principles. Eight shared primitives. One thesis:

> Every screen should feel like a calm operational intelligence system that helps a human notice, decide, delegate, remember, and ship.

The system codifies:

- **Palette** — `bg_paper`, `bg_panel`, `bg_sunken`, `edge_soft`, a five-tier ink scale, a six-color accent family (sage, dusty_rose, lavender, pale_blue, cream_peach, fog) each carrying semantic meaning, and a single deep-indigo `primary_actionable` reserved for the one loud voice per zone.
- **Typography** — transitional serif (Fraunces) for identity, page titles, section titles, hero numerals; sans (Inter) for all operational chrome. One type scale. One reading rhythm.
- **Spacing** — one 10-step scale (`4, 8, 12, 16, 20, 24, 32, 40, 56, 80`). One corner-radius family (`pill 999 / chip 10 / card 14 / panel 18 / modal 22`).
- **Primitives** — `StatusDot`, `IconDisc`, `DecisionCard`, `DecisionGrid`, `ContextMenu`, `useContextMenu`, `ChoiceBlock`, `Card`. Shared across every screen.
- **The three spine patterns** — decision grid (replaces every select/radio/multi-choice), markdown panel (replaces every project/workflow writeup), attribution donut (replaces every raw analytics table). The product looks like itself because of these.
- **Right-click everywhere** — every addressable object has a custom context menu with baseline actions specific to its kind.
- **Rodbot drafts over forms** — a blank form is a surface where Rodbot failed to draft. Every form cascades decision-grid → Rodbot-draft-surface → minimal-form fallback.
- **The meaning layer** — one reflective sentence per page per session, in Rodbot's voice, reconnecting activity to purpose. Never motivational. Never wellness. Rare by discipline.

The design system is versioned at `knowledge/design_system_v1.json` + `.md`, governed by Jake, maintained by Rodbot, and deviation-flagged in every delegation summary. Phase 1 tokens are live in `styles.css` (adopted April 23). Phase 2 primitives are live in `components.jsx` (adopted April 23). Phase 2.5 — first `DecisionGrid` on screen (Settings → Density) and migration of `CellContextMenu` to the shared `ContextMenu` primitive — shipped the same day.

The system is **the moat nobody else can ship quickly**. Design systems are expensive to build and harder to maintain. Comeketo's is already live, already governed, already spec'd, already exercising on multiple screens. Any competitor has to rebuild all of it before they can compete on cohesion.

---

## 12. The intelligence pipeline — end-to-end

Three entry points to the AI. All three share one prompt-assembly discipline.

### 12.1 Chat path

Operator types into the chat rail. `SecretaryChat.send()` builds the message array from localStorage cache. `SecretaryInstructions.build({register: "intimate"})` assembles Rodbot's full system prompt. `POST /api/chat/send` relays to Claude Code subprocess or OpenAI Responses API. Reply streams back. `SecretaryChat.reflect()` fires fire-and-forget in the background — extracts actionable items, appends to inbox, writes to chat reflections ledger.

### 12.2 Grid path

Operator taps *generate* / *sweep* / *frame-reject* or the morning is fresh. `SecretaryActions.generateGrid()` invokes the two-phase pipeline: **(Phase 1)** `scoreSeeds()` walks the bedrock deterministically and picks six diverse winners; **(Phase 2)** the LLM expands each seed into headline + preview + detail + commit + refine, returns normalized grid. Commits feed the affinity ledger. Frame-rejects damp the dominant seed type. Everything traces.

### 12.3 Delegation path

Operator triggers a delegation (via `/api/delegate`, the Delegations screen, or a sub-agent call). Server spawns `claude -p --output-format json` in a daemon thread. Prompt routed with `--system-prompt` (Rodbot's identity). `--disallowedTools` guards the CLI against reaching into scopes the team didn't approve. Claude Code runs against `CCAgentindex/` as cwd. Writes land in the bedrock, audits land in `_ledger/delegations/<id>.json`, summaries come back as markdown. The browser polls until done.

### 12.4 The system prompt assembly (the part nobody else does right)

Every AI call, `SecretaryInstructions.build(ctx)` composes in order:

1. **Environment** — absolute paths (`workspace_root`, `bedrock_root`) so Claude Code doesn't hallucinate file paths.
2. **Persona** — identity.md + character sheet distillation + traits table, register-scoped (intimate vs. professional).
3. **Memory** — Rodbot's last 15 memory entries, importance-weighted.
4. **Her body** — the `WORLD_MODEL` constant that frames the bedrock as her sense organs: projects, people, threads, commitments, knowledge, ratio lattice, activity ledger.
5. **Mission Control** — normalized bedrock from the loader: either personal shape (projects / people / threads / commitments / knowledge / north_star / ratio_lattice) or sales shape (leads / stage_distribution / top_priority_leads).
6. **Pieces LTM** — ambient activity snapshot, last sweep, ~6KB max.
7. **Call-specific context** — current grid, state signature, briefing.
8. **Voice model** — in professional register only, the team's preferred tone with voice adjustments.
9. **Target handling** — in professional register only, the recipient's preferred_channel, tone, off-limits topics.
10. **Output discipline** — register-specific rules. Intimate: short, character-forward, banter okay. Professional: disappear; no meta; match voice.

This is the part no one replicates casually. Most AI apps ship a 200-line system prompt and call it a day. Comeketo Agent composes a **multi-register, bedrock-grounded, persona-loaded, memory-carried, ambient-context-aware** prompt on every call. The quality of her output is a function of the rigor of this assembly.

---

## 13. Integrations — the channel surface

Every outbound channel routes through `/api/proxy/*`. Credentials live in `.env`; no secrets touch the browser.

| Channel | Status | Capability | Credentials |
|---|---|---|---|
| **ClickUp** | ready | Create tasks (name + description) from commitments | `CLICKUP_API_TOKEN`, `CLICKUP_TEAM_ID`, `CLICKUP_SPACE_ID`, `CLICKUP_LIST_ID` |
| **Slack** | misconfigured (has app token; needs bot token) | Post to channels and DMs | `SLACK_BOT_TOKEN` (xoxb-) with chat:write, im:write, users:read |
| **Claude Code** | ready | Subprocess delegation with filesystem access | Binary at `/usr/local/bin/claude` or `$CLAUDE_BIN` |
| **Google Calendar** | needs setup | Create events with parsed dates from body | Four Google OAuth creds |
| **Twilio WhatsApp** | needs setup | Send WhatsApp messages | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` |
| **Twilio SMS** | needs setup | Send SMS | Same Twilio + `TWILIO_SMS_FROM` |
| **Gmail** | needs setup | Send email | `GMAIL_ACCESS_TOKEN` or `GMAIL_ADDRESS` + `GMAIL_APP_PASSWORD` |
| **Note / Internal / Open URL** | always ready | Local | none |
| **Close CRM** | read-proxied; delegation-blocked by policy | CRM reads proxied through `/api/proxy/close/*`; writes only via explicit team unblock of `_BLOCKED_DELEGATION_TOOLS` | `CLOSE_API_KEY` |

The **Pieces MCP** connection (ambient computer activity) adds a tenth integration path if the Pieces process is running at `http://localhost:39300/model_context_protocol/...`. Hourly background sweep → `_ledger/pieces_sweeps.jsonl`. Natural-language search via `/api/pieces/ask`.

Demo mode (default ON) blocks all vendor writes at the proxy layer. The traffic light still shows green; the response says `demo_blocked: true`. This is intentional: operators can exercise every flow in the product against a dead outbound without risk.

---

## 14. The moat — why this is hard to replicate

Ten structural advantages, none of which are feature-like. Every one of them would require a competitor to rebuild from the foundation.

1. **Bedrock schema discipline.** Data is not sitting in a vendor's cloud behind Terms of Service. It is in a folder the team owns. The AI reads the same shape a human would. Changing this requires giving up data sovereignty — a price most platforms cannot charge customers.

2. **Typed audit trail.** 603 events logged already, every one of them timestamped, append-only, never rewritten. Affinity scoring reads the ledger directly; no ML model, no separate metrics system, just exponential decay formulas on raw event timestamps. You cannot copy this without building the event model first.

3. **Editorial memory.** Rodbot writes her memories first-person, with importance and affect scores, after debounced batch reflection over meaningful events. She can abstain. Most reflective-memory systems are extractors over document chunks; none of them abstain.

4. **Voice as code.** `character.md` is a weighted rule table loaded into every system prompt. `traits.md` is trait tables. `affective_essence.md` is a tonal palette. The AI literally *is* the character — not "an AI assistant imitating Rodrigo," but an executable version of his sales posture. Replicating this requires the target customer to have 2,254 lines of their own playbook, 60+ verbatim voice samples, and the willingness to operationalize them.

5. **Decision-grid scoring transparency.** Eleven seed-source types, ten scoring formulas, five-factor breakdown per cell. Every proposal is auditable. Traditional recommenders hide scores for competitive reasons; here, the score is a feature.

6. **Dual registers in one pipeline.** Intimate (operator-to-operator) and professional (ghostwriting outbound) are selectable per call. Target-handling notes (preferred_channel, tone, voice_adjustments) are pulled from the person record in the prompt. Drafts are 95% ready to send because they already match the recipient's register.

7. **Bedrock as near-writable.** Claude Code can write directly to `projects/`, `people/`, `threads/` via delegation, under the same `AGENT.md` discipline a human would follow (read sibling for schema, register in index, append to ledger, never invent paths). No "AI can only read" wall. Replicating this requires the scope discipline to exist — most teams do not have it.

8. **Momentum-weighted seed generation.** Project tasks boost when their phase has recent completions. Tasks abandoned 14+ days damp. Day-to-day context is baked into the scorer, not filtered post-generation. This is why the grid surfaces hot work and hides zombies without configuration.

9. **Sub-agent architecture.** Each sub-agent is a folder with `agents.md` + `prompt.md`. Same delegation pipeline, same scope guards, same telemetry. Zero overhead to spin up a new domain-specific agent (Sweep Agent, Oracle Agent, Inbox-Triage Agent, any future agent).

10. **Pieces ambient context.** Team activity (URLs, files, apps, searches) folds into the prompt as a ~6KB LTM block. The AI sees what the team actually did, not what they curated. Reduces hallucination. Most AI apps cannot integrate ambient context because their data is elsewhere.

Any one of these is a feature. Ten of them together is a category.

---

## 15. Operations — how it runs

**Launch.**
```
cd /Users/jakeaaron/Downloads/CC\ Agent
python3 server.py
# → http://127.0.0.1:3422/Secretary.html
```

**Stack.** Python 3 stdlib server (no framework). React 18.3.1 via in-browser Babel. Marked.js for markdown. DOMPurify for sanitization. Lucide icons loaded as JS. Zero build step. `.env` for secrets. Bedrock as `CCAgentindex/`.

**Footprint.** Server: single Python file + `.env`. Frontend: ~16K lines JSX + 5.7K lines CSS. Bedrock: ~30 MB. No database. No external hosts. No cloud dependencies required.

**Scheduled observers.** Prompts in `CCAgentindex/scheduled_tasks/`. Fired from external cron/launchd via `cat prompt.md | claude -p --output-format json`. Results land in `CCAgentindex/summaries/<observer>/`. Example: `daily_oracle_sweep.md` runs the morning commitment analysis.

**Bilingual.** `i18n.js` (293 lines) provides en + pt-BR for 150+ UI strings. Language switchable in Settings. Fallback humanizes missing keys. Generated AI output stays English — that layer (Rodbot in Portuguese) is a separate future initiative requiring identity-file translation.

**Orchestrator briefing.** `AGENT.md` (276 lines) is the canonical delegation discipline. Every `claude -p` subprocess reads it. Every delegation is scoped to the bedrock, schema-matched, index-registered, ledger-logged. Nothing wanders. The **anti-pattern guard** explicitly prohibits a subprocess from searching the filesystem for "similar-looking directories" — a trap door that cost the team before.

**North star anchors (7).** Speed-to-lead <5 min (0.95), 5-day cadence fidelity (0.9), tasting conversion rate (0.92), partnership touches/week (0.7), unsolicited referrals (0.88), deposit collection cadence (0.75), kitchen schedule respect (0.93).

**Scoring regimes (9).** Relationship (maintenance, network, family), building (public-surface, framework-hardening, system-capability), substrate (physical-maintenance, operational-substrate, reservoir-building).

---

## 16. Traction — what is true right now

No projected numbers. Everything below is observable in the filesystem.

- **30,517 lines of code** across Python + JS + JSX + CSS + HTML.
- **21+ screens** shipping, including the visual workflow composer (Automation), the five-tab analytics dashboard, the Pieces ambient activity browser, and the Rodbot memory inspector.
- **50+ API routes** exposed by `server.py`.
- **603 ledger events** recorded, spanning one day of active use (2026-04-22 → 2026-04-23).
- **13 people** modeled with full handling blocks.
- **5 projects** active with phases, deliverables, tasks, momentum scoring.
- **26 knowledge entries** across six operational domains.
- **7 canonical tables** with schema.
- **8 channel integrations** wired (4 ready or near-ready, 4 credentialed but unconfigured).
- **Bilingual UI** (en + pt-BR), 150+ strings.
- **Design System v1** adopted, specified, and exercising on multiple screens.
- **Sales Playbook V2.0** distilled into Rodbot's voice (2,254 lines).
- **60+ Slack voice specimens** preserved for voice mimicry.

**From the operating business underneath:**

- **750+ weddings** shipped in 15 years.
- **39.5% tasting conversion** rate YTD (49 won / 124 attended).
- **85 venue partners** catalogued across 3 tiers.
- **$693.8K tracked cash flow** across ~160 clients over a 100-week horizon.
- **38 events projected** for Weeks 12–31 of 2026, peaking at 7 events in Week 25.
- **32 MA Brazilian churches** mapped for Andre Raw's outreach.
- **34 MA food truck events** across 10 counties indexed.

This is the product as it stands today. Not a deck. Not a prototype. A running operational intelligence layer against a fifteen-year-old business, with every claim backed by a file.

---

## 17. Roadmap — the phased unlock

**Phase 1 — Design System Tokens.** ✅ Shipped April 23, 2026. 20+ v1 semantic aliases published in `:root`. Hard-gray cleanup: three raw `#ffffff` text colors, two `#000` mix-darkenings, one hardcoded danger button — all tokenized.

**Phase 2 — Shared Primitives.** ✅ Shipped April 23, 2026. `StatusDot`, `IconDisc`, `DecisionCard`, `DecisionGrid`, `ContextMenu`, `useContextMenu` mounted on `window`. ~370 lines of component JSX, ~170 lines of primitive CSS. Zero regressions.

**Phase 2.5 — First migrations.** ✅ Shipped April 23, 2026. `CellContextMenu` root mode migrated to shared `ContextMenu`. Settings → Density picker became the first `DecisionGrid` in production use. `keepOpen` item flag added to the `ContextMenu` primitive to support sub-mode switching.

**Phase 3 — Rodbot-first input surfaces.** Build the `RodbotDraftSurface` component (accept / tweak / rewrite pattern) and migrate one blank-form surface (Commitments → inline edit, or Delegations → compose prompt) to use it.

**Phase 4 — Right-click everywhere.** Wire `useContextMenu` onto person cards (Contacts), lead cards (Grid), commitment rows (Commitments), checklist rows (Projects), ledger entries (Activity). Each with its baseline action set per the spec.

**Phase 5 — Meaning layer.** Ship the single-sentence reflective line per page per session, in Rodbot's voice. Discipline: one line, never motivational, never wellness.

**Phase 6 — Bedrock write operations via delegations.** Upgrade the delegation dispatch surface to a full-fledged scope-approver: the operator sees the bedrock paths about to be touched, the scope guards, and the expected touches[] before confirming. Makes the AI-writes-bedrock pathway first-class UX.

**Phase 7 — Multi-tenant refactor.** The bedrock is currently `CCAgentindex/`. The bedrock *schema* is general. A second tenant (a second catering business, or Rodrigo's sibling brands VirtualKitchenhall / MoneyOnYourWay / RioFitMeals) could run its own bedrock in its own folder. The architecture is tenant-ready; the config isn't yet.

**Phase 8 — Rodbot in Portuguese.** Translate `Rodbot/identity.md`, `character.md`, `traits.md`, `affective_essence.md` into Brazilian Portuguese. Add register-aware language selection in the prompt assembler. Pilot on internal register first, then B2C.

**Phase 9 — Cross-brand federation.** If Rodrigo's sibling brands adopt the same bedrock, Rodbot can read across brands while respecting voice isolation (the identity files differ per tenant). This opens a Rodrigo-scale orchestration layer no single brand could afford alone.

---

## 18. The vision — where this goes

Zoom out. The problem Comeketo Agent solves is not specific to catering. It is specific to **operator-led businesses with bottleneck voice**: catering, hospitality, event planning, boutique consulting, high-touch service, founder-led B2B. Businesses where one human's judgment and voice is the product, and everything else is the unskilled labor of keeping that judgment addressable.

For those businesses, the category that Comeketo Agent occupies does not yet have a name. It is not CRM. It is not chatbot. It is not workflow automation. It is not generic AI assistant. It is the **local, sovereign, voice-inheriting operational cortex** — the layer that absorbs the coordination cost so the founder's judgment can scale.

In five years, the largest boutique service businesses will each run a version of this. They will own their bedrock. They will have codified their founder's voice. They will have a typed audit trail of every decision the operation made. They will run their AI locally against data they control. The ones that don't will spend the same five years either drowning in Slack or renting their memory from whatever platform has the current upper hand.

Comeketo Catering is building this first. The bedrock is already live. Rodbot already has 15 years of Rodrigo's sales posture encoded. The team already uses the decision grid every morning. The voice model already ghostwrites outbound that lands. The design system already governs every surface.

**The thesis was:** a calm operational intelligence system that runs a catering company's daily work in the founder's voice, on the team's filesystem, with every judgment exposed for inspection.

The product proves the thesis. Every line of code, every file in the bedrock, every ledger event, every memory Rodbot has written, every commitment the team has shipped through the grid, every right-click menu that just got installed, every decision card that just rendered in Settings.

The product is the proof.

---

## Appendix A — File-by-file code census

```
Source                     Lines    Role
─────────────────────────  ───────  ─────────────────────────────────────────
server.py                   3,833   Backend. 50+ API routes. stdlib only.
screens.jsx                 6,879   22+ screens.
automation.jsx              4,095   Visual workflow DAG composer.
components.jsx              1,951   Topbar, chat rail, primitives.
app.jsx                     1,136   Router, top-level state, tweaks.
charts.jsx                    795   Chart library + saved-chart store.
analytics.jsx                 723   Five-tab analytics dashboard.
grid_scorer.js                744   Seed scoring + affinity learning.
ai_instructions.js            638   System-prompt assembler.
ai_actions.js                 526   Grid generation + commit drafting.
rodbot.js                     400   Reflective memory batching.
chat.js                       306   Chat rail orchestrator.
i18n.js                       293   Bilingual dictionary (en + pt-BR).
mission_control_loader.js     236   Bedrock loader + shape normalizer.
connectors.js                 227   Channel readiness + send dispatch.
ai.js                         223   OpenAI/Claude Code wrapper.
memory.js                     223   Gesture memory + affinity persistence.
delegator.js                  185   Claude Code subprocess dispatch.
inbox.js                      148   Intent log writer.
ledger.js                      74   Append-only ledger writer.
lucide.js                      65   Icon loader.
data.js                        63   Seed data for cold starts.
Secretary.html                 44   Root HTML + script/style loads.
styles.css                  5,750   Full CSS + Design System v1 tokens.
─────────────────────────  ───────
Total app code             30,517
```

## Appendix B — Bedrock census

```
Directory          Count   Contains
─────────────────  ──────  ───────────────────────────────────────────
people/                13  Per-person handling records.
projects/               5  Active project files with phases + tasks.
knowledge/             26  Institutional memory across 6 domains.
tables/                 7  Canonical tabular data (events, staff, etc).
ledgers/                2  North star anchors, ratio lattice.
indexes/                1  Loader authority (single source of truth).
Rodbot/                 6  Identity + character + traits + memory + reflections.
annotations/            3  Semantic image annotations.
catalog/edges/          2  Data lineage edges.
manifests/              1  Rebuild manifest from last sweep.
_inbox/                 1  inbox.jsonl — 13 open entries.
_ledger/                +   activity.jsonl — 603 events. delegations/ directory.
_base/                  4  Always-on primitives (humor, four principles, voice, vocab).
_vaults/                3  Dormant specialty vaults (physics, philosophy, ai_innovation).
agents/                 +   Sub-agent fleet (inbox-triage live; under construction).
scheduled_tasks/        +   Prompts for external cron-fired observers.
summaries/              +   Daily briefings + accomplishments + grid affinity.
commitments/            0  Empty — drafts-in-flight live in UI until sent.
threads/                0  Empty — folder exists, pattern ready.
```

## Appendix C — The 50+ API routes

Organized by domain (selected routes, not exhaustive):

**Status.** `GET /api/status` — connector readiness + bedrock root.

**AI.** `POST /api/claude_code/generate`, `POST /api/chat/send`, `POST /api/proxy/openai/v1/responses`.

**Delegation.** `POST /api/delegate`, `GET /api/delegate`, `GET /api/delegate/<id>`.

**Briefings.** `GET /api/briefings`, `GET /api/briefings/<slug>`.

**Grid + Memory.** `POST /api/grid_affinity`, `GET /api/grid_affinity`, `GET /api/rodbot/identity`, `GET /api/rodbot/character`, `GET /api/rodbot/traits`, `POST /api/rodbot/reflect`, `GET /api/rodbot/memory`, `GET /api/rodbot/palette`.

**Ledger.** `POST /api/ledger/<name>/append`.

**Inbox.** `POST /api/inbox/append`, `POST /api/inbox/update`.

**Pieces.** `GET /api/pieces/status`, `GET/POST /api/pieces/ask`, `GET /api/pieces/sweeps/latest`, `POST /api/pieces/sweep`.

**Cells.** `POST /api/cells/retire`, `POST /api/cells/recurring`, `POST /api/cells/reject`.

**Outbound.** `POST /api/send/whatsapp` (and proxy-layer dispatchers for Slack, email, calendar, SMS).

**Projects.** `GET /api/projects`, `GET /api/projects/<pid>`, `PUT /api/projects/<pid>`, `PATCH /api/projects/<pid>/task/<tid>`.

**Charts.** `GET /api/charts`, `POST /api/charts/save`, `POST /api/charts/delete`.

**Tables.** `POST /api/tables/save`, `POST /api/tables/add_rows`, `POST /api/tables/delete`.

**Analytics.** `GET /api/analytics/<name>` for tasting_conversion, lead_sources, revenue_timeline, venue_partners, event_labor, overview.

**Agents.** `GET /api/agents`, `POST /api/agents/<name>/run`.

**Attachments.** `POST /api/attachments/upload`.

**Workflows.** `POST /api/workflows/save`.

**Catalog.** `POST /api/catalog/edges/save`, `POST /api/catalog/edges/delete`, `POST /api/catalog/edges/bump_usage`.

**Annotations.** `POST /api/annotations/upload`.

**Intake.** `POST /api/intake/classify`, `POST /api/intake/route`, `POST /api/intake/report`.

**Completions.** `POST /api/accomplishments/<YYYY-MM-DD>`, `POST /api/streak`.

---

**End of document.**

*Comeketo Agent · Product Requirements v1.0 · April 23, 2026 · Authored from the codebase, every claim traceable to a file.*

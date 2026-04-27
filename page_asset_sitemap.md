# Comeketo Page-Asset Source Of Truth

Last updated: 2026-04-25 (great trim — 15 pages retired, bedrock data gutted, Pieces-only memory)
Owner: Comeketo app team
Canonical source: this file is the operational truth for page/asset ownership.
Policy hook: see `CLAUDE.md` § 5.5 ("Page-asset sitemap — the Done Gate").

## Done Gate (Mandatory)

Any task that changes a page, route behavior, or page data binding is not complete until this file is updated. Append to the relevant page section's `Asset Ownership`, `Change Checklist`, and `History` lines, and bump `Last Verified`. New pages get a fresh entry following the Mapping Template. Removed assets must be removed in the same change.

## Route Index (App Router Truth)

Source: `app.jsx` (`KNOWN_SCREENS` and route switch)

- `grid`
- `settings`
- `leads`
- `clients`
- `coworkers`
- `contacts`
- `venues`
- `briefing`
- `activity`
- `automation`
- `intake`

## Mapping Template (Use For New Sections)

- Page ID
- Entry Points
- Primary Screen Component
- Assets On Page
- Asset Ownership
  - Render logic path(s)
  - Data source path(s)
  - Style path(s)
  - Side effects
- Change Checklist
- Last Verified
- History (append-only)

---

## Page: `grid`

- Entry Points: app home, `Topbar` home/chat chip, back-navigation fallback.
- Primary Screen Component: `FrontPage` via route handler in `app.jsx`.
- Assets On Page:
  - 3x3 decision grid cards
  - Generate/Sweep/Back-one-generation controls
  - Cell fullscreen modal
  - Edit with Rodbot overlay
  - AI status banner
  - **IdeasTray** (left column — 4–5 briefing-sourced ideas, click-to-discuss → chat)
  - **QuickCapture** (compact "drop an idea" widget below IdeasTray, ⌘/Ctrl+Enter → inbox; optional voice via Web Speech API)
  - **ChatRail** (right pane — uplifted with attachments, dropzone, animated thinking trace)
- Asset Ownership:
  - Grid cards + frame: render in `components.jsx` (`Grid`, `FrontPage`), routed in `app.jsx`.
  - Grid content data: `window.SECRETARY_DATA.grids`, `gridHistory` in localStorage (`secretary.gridHistory`), `window.SecretaryActions.generateGrid/refineCell/regenerateFromSweep/regenerateFromFrameReject`.
  - Mission Control generate path: `window.MissionControl`, `window.MissionControlStatus`.
  - Commit queue creation from cell: `app.jsx` commitment state and `window.SecretaryActions.draftCommitment`.
  - Retire/reject/recurring context actions: `components.jsx` `CellContextMenu` -> `/api/cells/retire`, `/api/cells/recurring`, `/api/cells/reject`.
  - **IdeasTray** (`components.jsx` `IdeasTray` + `BriefingIdea`): pulls 4–5 talking points from `window.MissionControl.dailyBriefing.body`. Two-phase load: regex-extracted bullets paint instantly via `extractBriefingIdeas`; `curateBriefingIdeasViaAI` then calls `window.SecretaryAI.ask` for AI-curated short titles. AI result cached in localStorage as `comeketo.briefingIdeas.<slug>`. Click sends `Let's talk about: {title}` into the chat rail.
  - **QuickCapture** (`components.jsx` `QuickCapture`): minimal sticky-note widget that mirrors the chat composer's structure (header bar with controls, hairline divider, input area). On submit calls `window.SecretaryInbox.append({kind:"note", text, source:{screen:"home", widget:"quick_capture"}})`. Optional voice input uses `window.SpeechRecognition || window.webkitSpeechRecognition` and is hidden when unsupported.
  - Styles: `styles.css` grid classes (`grid-stage`, `cell`, `grid-head`, chips/buttons), plus `ideas-tray-*` + `briefing-idea` (left column), `quick-capture` + `qc-*` (capture widget), and the `front-viewport.ideas-mode` overrides that fix chat composer cutoff at 100% zoom.
  - Side effects: ledger/memory logs via `window.SecretaryLedger` and `window.SecretaryMemory`; cell retire endpoint writes server ledgers; QuickCapture writes to `CCAgentindex/_inbox/inbox.jsonl` via `SecretaryInbox.append`.
- Change Checklist:
  - `app.jsx`
  - `components.jsx` (FrontPage, ChatRail, IdeasTray, BriefingIdea, QuickCapture, extractBriefingIdeas, curateBriefingIdeasViaAI, readCachedIdeas/writeCachedIdeas)
  - `styles.css` (grid classes + ideas-tray + briefing-idea + quick-capture + front-viewport.ideas-mode height/min-height/sticky overrides)
  - `inbox.js` (SecretaryInbox.append — QuickCapture writes go through here)
  - `mission_control_loader.js` (briefing payload — IdeasTray reads `MissionControl.dailyBriefing`)
  - `server.py` (`/api/cells/*`, `/api/claude_code/generate`, `/api/grid_affinity` if behavior changed; `/api/inbox/append` for QuickCapture writes)
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 IdeasTray rewrite: replaced the dense ChoiceBlock cards (kind eyebrow + chip + serif headline + subtitle + refine button) with quiet `BriefingIdea` rows (7px accent dot + sans-serif title only, max 5 items). Source moved from grid.cells/chat-extracted bullets to the daily briefing markdown via `extractBriefingIdeas` (regex fast path) and `curateBriefingIdeasViaAI` (AI-curated short titles, cached in localStorage by briefing slug). Click sends "Let's talk about: {title}" to chat. Removed the auto-extract-bullets-from-chat-replies effect that was creating noise. Sweep button forces a fresh AI curation pass.
  - 2026-04-25 QuickCapture widget added below IdeasTray: structured to mirror the chat composer (header bar + hairline + textarea). Saves to `_inbox/inbox.jsonl` as `kind:"note"`. ⌘/Ctrl+Enter submits. Optional Web Speech API voice input. Dispatches via `SecretaryInbox.append` so the bedrock sweep folds it later.
  - 2026-04-25 ideas-mode layout fix: chat composer was getting clipped at 100% zoom. Root cause: `.chat-rail` had `min-height: 560px` + `position: sticky` from legacy layout, plus `.front-viewport`'s `height: calc(100vh - 220px)` undercounted real chrome. Fix: in `.front-viewport.ideas-mode`, kill min-height + sticky on the chat-rail, switch height to fill parent (with `:has()` wrapper passthrough on `.main > div`), so the chat panel always shrinks to fit the available viewport.
  - 2026-04-25 great trim: removed QuickCapture widget; removed Commit button + commitment-queueing flow from FullscreenCell (only Refine + close remain); gesture log + memory.log call sites all stripped. Chat lives here on the right rail.

## Page: `automation`

- Entry Points: `Topbar` automation chip. Direct deep-link via `route.tab` param (`#automation/triggers`, `#automation/subagents`, etc.). Cross-tab nav: trigger rows with a workflow link call `go.replace("automation", { tab: "workflows", load: <slug> })`, which `AutomationShell` forwards to `AutomationGraphScreen` as `loadSlug`; an effect inside the graph screen calls `loadWorkflow(slug)` once per slug change.
- Primary Screen Component: `AutomationShell` in `automation.jsx`.
- Assets On Page:
  - Sub-tab strip (workflows/subagents/state/hooks/triggers)
  - **Workflows** sub-tab: workflow graph composer (existing `AutomationGraphScreen`)
  - **Sub-agents** sub-tab: full sub-agent planner — header bar (plan picker + new/save/run/stop), fanout SVG canvas (orchestrator → row of SAs → merge node), sidecar (Concurrency Gantt / Spend / Live stream), Inspector for the selected SA, Budgets footer with `+ sub-agent`. Simulated dispatch animates SA states and edge highlights through planning → tool_call → tool_await → reflect → shipped.
  - **State** sub-tab: live, observation-only state machine — SVG diagram (idle/planning/tool_call/tool_await/reflect/blocked/shipped) with the current state pulsing; time-in-state stacked bar + percentage legend; active-context card surfacing the most recent agent_plan or workflow save; stack trace of the last 12 ledger events. Window picker (15m/1h/6h/24h/7d), pause/refresh chips, 5s polling. Zero forms — entirely derived from the activity ledger.
  - **Hooks** sub-tab: pre / post / on-blocked / on-draft / cron observation. Top: SVG horizontal request timeline (8 staggered checkpoints with stage pills, offsets, and labels) auto-rendered from the latest matching ledger event. Middle: Configured hooks list — code-defined catalog with on/pause toggles, persisted to `CCAgentindex/hooks/state.json`. Bottom: Hook performance table (P50/P95 declared, fires + errors live from ledger, sparkline). Window picker, 6s polling. Zero composer — hooks are declared in code, not entered.
  - **Triggers** sub-tab: 24h daily clock + 5 clickable type cards (Cron / Watch / Webhook / Rule / Ribbon — clicking switches the active composer) + per-kind composer router (`TgComposer` → `TgComposerCron` w/ presets, `TgComposerWatch`, `TgComposerWebhook`, `TgComposerRule`, `TgComposerRibbon` — all dropdown-driven, zero typed cron strings) + workflow target picker on every composer (reads `/api/workflows/list`) + auto-suggested labels + configured list with clickable workflow pills that jump cross-tab to load that workflow on the canvas.
  - All five sub-tabs are now real pages — no `ComingSoonScreen` placeholders remain under automation.
- Asset Ownership:
  - Render: `automation.jsx` (`AutomationShell`, `AutomationSubTabStrip`, `AutomationGraphScreen` (now accepts `loadSlug` prop for cross-tab navigation), `TriggersScreen` + sub-components `TgDailyClock` / `TgTypeCard` / `TgComposer` / `TgComposerCron` / `TgComposerWatch` / `TgComposerWebhook` / `TgComposerRule` / `TgComposerRibbon` / `TgWorkflowPicker` / `TgConfiguredList`, `SubAgentPlannerScreen` + sub-components `SapHeader` / `SapFanoutCanvas` / `SapInspector` / `SapBudgets` / `SapConcurrency` / `SapSpend` / `SapLiveStream`, `StateMachineScreen` + sub-components `SmStateDiagram` / `SmTimeInState` / `SmActiveContext` / `SmStackTrace`, `HooksScreen` + sub-components `HkHeader` / `HkRequestTimeline` / `HkConfiguredList` / `HkPerfTable` / `HkSparkline`, `ComingSoonScreen`, `agTruncateLabel` / `agTruncate` text-overflow helpers, `tgAutoLabel`).
  - API (workflows/catalog): `/api/workflows/list`, `/api/workflows/save`, `/api/catalog/edges/list|get|save|delete|bump_usage`, `/api/annotations/upload`.
  - API (triggers): `/api/triggers/list|save|delete`. Save accepts the v1 schema plus per-kind extras: `cron.preset`, `watch.path|recursive|debounce_ms`, `webhook.service|endpoint|auth`, `rule.pattern_type|filter|pattern`, `ribbon.source|pattern`, and the cross-cutting `workflow_slug` (validates slug shape only — workflow existence checked client-side from the picker list).
  - API (agent plans): `/api/agent_plans/list`, `/api/agent_plans/get?slug=<slug>`, `/api/agent_plans/save`, `/api/agent_plans/delete`.
  - API (state): `/api/state/snapshot?window=15m|1h|6h|24h|7d` — server-side ledger aggregation, classifies events via `_STATE_RULES` heuristic, returns `{ current_state, time_in_state: {state→pct}, recent_events, active_context, event_count }`.
  - API (hooks): `/api/hooks/snapshot?window=1h|6h|24h|7d` returns `{ hooks: [...with declared p50/p95 + live fires/errors], request_preview }`. `POST /api/hooks/toggle {id, enabled?}` flips one hook's enabled state and persists to `CCAgentindex/hooks/state.json`. Catalog is hardcoded in `_HOOK_CATALOG` (12 hooks across pre/run/post/on-blocked/on-draft/cron stages).
  - Bedrock files: `CCAgentindex/workflows/*.json`, `CCAgentindex/triggers/*.json`, `CCAgentindex/agent_plans/*.json`, `CCAgentindex/catalog/edges/*.json`, `CCAgentindex/hooks/state.json` (hook on/pause flags). All registered in `indexes/index.json` under keys `workflows` / `triggers` / `agent_plans` / `catalog_edges`. State and Hooks sub-tabs read `CCAgentindex/_ledger/activity.jsonl` directly for live aggregation.
  - Styles: `auto-shell`, `auto-tabs`, `auto-tab`, `auto-page`, `auto-stub-*`, `tg-*` (Triggers), `sap-*` (Sub-agent planner), `sm-*` (State machine), `hk-*` (Hooks) — all in `styles.css`.
  - Side effects: writes workflow / trigger / agent-plan / hook-state JSON to bedrock; appends `_ledger/activity.jsonl` with kinds `automation_workflow_save`, `trigger_create|trigger_save|trigger_delete`, `agent_plan_create|agent_plan_save|agent_plan_delete`, `catalog_edge_save|catalog_edge_delete|catalog_edge_bump_usage`, `hook_toggle`. Sub-agent simulated runs, State, and Hooks observation are in-browser only (no server side effect — State and Hooks read the ledger and the hooks state file).
- Change Checklist:
  - `app.jsx` — route handler mounts `AutomationShell` with `tab={route.tab || "workflows"}`
  - `automation.jsx` — sub-tab strip + all four sub-screens + supporting components
  - `styles.css` — `auto-*` shell, `tg-*` Triggers, `sap-*` Sub-agent planner
  - `server.py` — workflows/catalog/triggers/agent_plans endpoints
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 sub-tab strip pass: routing wrapper (`AutomationShell` + `AutomationSubTabStrip`) under the automation tab, with secondary nav for Workflows · Sub-agents · State · Hooks · Triggers. Workflows preserved unchanged. Triggers screen built end-to-end (daily clock + type cards + cron composer + configured list backed by `CCAgentindex/triggers/*.json`).
  - 2026-04-25 sub-agent planner pass: replaced the `subagents` placeholder with a real planning surface. Plan picker reads `CCAgentindex/agent_plans/*.json` (seeded with `tagging_hygiene` + `lead_enrichment_fanout`), Save persists via `POST /api/agent_plans/save`, Run kicks an in-browser simulated dispatch that animates fanout edges + SA status through the agent state machine and feeds Concurrency Gantt + Spend stats + Live stream. Inspector edits selected SA (action / tool / leads / retries / timeout / tone / prompt template). Budgets footer edits caps and adds new SAs. Schema-by-example: deep-cloned from seed, preserves `created_at`, bumps `version` on save.
  - 2026-04-25 text-overflow audit: added `agTruncateLabel(label, role)` and `agTruncate(s, n)` SVG-text helpers. Applied to workflow `GraphNode` labels (per-role char limits — actor 11 / trigger 9 / transform 12 / sink 16 / state 12), edge labels (24 char cap with `<title>` tooltip), and Sub-agent canvas (action verb, leads/latency line, status line, orchestrator capsule, merge node). Fixes the "6:45 AM daily" diamond overflow Jake flagged. Full label still surfaces via native `<title>` browser tooltip on hover.
  - 2026-04-25 state machine pass: replaced the `state` placeholder with `StateMachineScreen` — observation-only readout (zero forms). Server-side `_state_snapshot` aggregates `_ledger/activity.jsonl` over 15m/1h/6h/24h/7d windows, classifies each event into one of 7 states (idle/planning/tool_call/tool_await/reflect/blocked/shipped) via `_STATE_RULES` substring heuristics. Page polls `/api/state/snapshot` every 5s (pause toggle), renders SVG state diagram with the current-state pulsing, time-in-state stacked bar with percentages, active-context card surfacing the most recent agent_plan or workflow save, and stack trace of the last 12 events. Verified against 822 ledger events over 7d.
  - 2026-04-25 hooks pass: replaced the `hooks` placeholder with `HooksScreen` — observation + simple toggles (zero composer per "no-forms" directive). Server `_HOOK_CATALOG` declares 12 hooks across pre/run/post/on-blocked/on-draft/cron stages with declared p50/p95 budgets and err_kinds substring matchers. `_hooks_snapshot` aggregates ledger fires + errors per hook over a 1h/6h/24h/7d window and assembles a canonical request-flow preview from the latest matching event. `POST /api/hooks/toggle` persists per-hook on/pause to `CCAgentindex/hooks/state.json` and appends `hook_toggle` ledger lines. Page renders SVG horizontal request timeline (8 staggered checkpoints with stage pills, faithful to deck p.16), Configured Hooks list with one-tap toggles, and a Performance table with declared latencies + live error counts + stable per-hook sparklines. Polls every 6s.
  - 2026-04-25 triggers polish (no-forms pass): retired the raw 5-field cron input as the only composer. Type cards became `<button>` elements that switch the active composer. Each kind got its own composer (`TgComposerCron` w/ presets — Every weekday / Every day / Every hour at :MM / Every N minutes / Fridays only / Custom; `TgComposerWatch` w/ bedrock-path picker + debounce chips + recursive flag; `TgComposerWebhook` w/ service dropdown + auto-generated endpoint URL + auth chips; `TgComposerRule` w/ pattern-type→filter cascade; `TgComposerRibbon` w/ source→pattern cascade). Every composer carries a workflow-target picker fed by `/api/workflows/list`. Auto-suggested labels (typed label optional). Configured rows show the linked workflow as a clickable mint pill that calls `go.replace("automation", { tab: "workflows", load: <slug> })`. `AutomationShell` forwards a new `loadSlug` prop to `AutomationGraphScreen`, which loads that workflow on mount/change via the existing `loadWorkflow` function (idempotent via `lastLoadedSlugRef`). Backend `_trigger_save` extended to accept `workflow_slug` + per-kind extras (`preset`, `recursive`, `service`, `auth`, `pattern_type`, `filter`, `source`); `_triggers_list` now surfaces them.
  - 2026-04-25 André Lead Coverage workflow authored: wrote `CCAgentindex/workflows/andre-lead-coverage.json` (55 nodes, 110 connections, 2220×2400px canvas) and registered under `indexes/index.json[workflows]` with an `automation_workflow_create` ledger line. Spec: 13 triggers (4 lead-source events + 4 maintenance crons + 4 report crons + 1 night safety sweep), 5 reference state stores (André identity / NEPQ playbook / Slack channel map / lead pipeline / activity ledger), 3 Rodbot actors (intake classifier, owner watcher, response classifier), 4 chained eligibility filters (owner / contact / status / not-already-active), 3 setup actions (Close tag / cadence-started note / report tracking register), 9-node cadence engine (sequencer + Day 1 / Day 1+3h / Day 2 / Day 3 / Day 4 / Day 5 / Day 6 / Day 7 / cadence-complete), 6 response branches (call-time→calendar+confirm SMS, pricing reply, tasting reply, send-info reply, not-interested stop), 4 delivery sinks (Twilio SMS, Gmail send, #andre-leads Slack, Close note writer), 4 report builders (morning 8:30 AM / midday 1:00 PM / night 8:30 PM / safety 8:45 PM) plus snapshot store and #andre-daily-report Slack sink. Loadable via the workflow picker on the Workflows sub-tab.
  - 2026-04-25 André workflow v2 — full-spec rebuild against 11 reference docs: replaced v1 with a 106-node / 232-connection workflow grounded in `SKILL.md`, `eace-loop.md`, `post-processing.md`, `safety-rules.md`, `smart-view-map.md`, `cadence-playbook.md`, `response-classification.md`, `state-schema.md`, `reporting-playbook.md`, `scheduled_task_prompts.md`, `dry_run_test_plan.md`. Architecture: 9 blue diamond Smart Views as state nodes (the operating surface), 8 reference state files (`state/leads/`, `state/snapshots/`, `state/errors/`, `state/runs/`, `.env`, `diamond_views.json`, `cadence-playbook.md`, `response-classification.md`), 9 scheduled job triggers (intake 5m / ownership-sync 10m / response-sync 10m / cadence-sender 15m / call-time-reminder 15m + morning 8:30 / midday 1:00 / night 8:30 / safety 8:45), per-job EACE loop columns (Explore → Audit → Connect → Execute → Post-EACE = 5 nodes × 9 jobs = 45 nodes), 3 kill switches (`DRY_RUN`, `AUTOMATION_PAUSED`, per-lead `cadence_status: paused`), triple anti-duplicate defense (ledger / Close-activity / idempotency-key), 11-day cadence flow (Day 1 / Day 1+3-4h / Day 2-10 + cadence-complete), 7 response classification branches in priority order (not_interested → unclear_response → call_time_given → tasting_interest → pricing_question → send_info → needs_manual_review), risk-flag bank (9 canonical flags), 6 delivery sinks (Close API SMS activity / Close API email activity / Close API note / Slack DM `D0AMX3BV64T` / Slack team `C0AV913L1LJ` / `slack_schedule_message` for T-5 reminders). Every node carries the source-spec citation in its `description`. Canvas: 2540×2120px. metadata.version = 2; spec_files lists all 11 references for export traceability.
  - 2026-04-25 great trim: untouched. Workflows / sub-agents / state / hooks / triggers sub-tabs all preserved.

## Page: `activity`

- Entry Points: `Topbar` Mind group -> Activity; Pieces ribbon jump links.
- Primary Screen Component: `PiecesActivityScreen` in `screens.jsx`.
- Assets On Page:
  - Sweep archive list
  - Ask Pieces bar + answer modal
  - Structured payload view
  - Pieces tool catalog panel
- Asset Ownership:
  - Render: `screens.jsx` `PiecesActivityScreen`, `PiecesPayloadView`, `PiecesAnswerModal`.
  - API: `/api/pieces/status`, `/api/pieces/sweeps`, `/api/pieces/sweeps/latest`, POST `/api/pieces/sweep`, POST `/api/pieces/ask`.
  - Styles: activity/payload panels in `styles.css`.
  - Side effects: fires Pieces sweep and ask calls; updates sweeps ledger server-side.
- Change Checklist:
  - `screens.jsx`
  - `styles.css`
  - `server.py` (`/api/pieces/*`)
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 great trim: untouched. Pieces is now the sole memory backend.

---

## Page: `settings`

- Entry Points: topbar settings icon; grid fallback buttons.
- Primary Screen Component: `SettingsScreen` in `screens.jsx`.
- Assets On Page:
  - Theme/density/language toggles
  - AI provider/key/model controls
  - Demo mode and chat enhancement toggles
  - Pieces model selector
- Asset Ownership:
  - Render: `screens.jsx` `SettingsScreen`, `IntelligencePanel`.
  - Data: `tweaks` state in `app.jsx` persisted to localStorage `secretary.tweaks`.
  - Integrations: `window.SecretaryAI`, `window.Comeketoi18n`.
  - Styles: settings classes in `styles.css`.
  - Side effects: writes localStorage values; no direct destructive server write from toggles.
- Change Checklist: `app.jsx`, `screens.jsx`, `ai.js`, `i18n.js`, `styles.css`.
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 great trim: stripped density/frames/gestures/prediction/auto-commit/memory rows from `SettingsScreen` + `TweaksPanel`. Remaining knobs: theme, demo mode, language, intelligence panel (api key + provider + model), prompt-enhance, pieces model, reset.

## Page: `leads`

- Entry Points: topbar People group -> Leads.
- Primary Screen Component: `PeopleScreen` with `kind="lead"` in `screens.jsx`.
- Assets On Page:
  - Searchable list pane (`+ add lead via Rodbot` button, search input, scrollable list)
  - Person profile pane (read-only deck-aligned card: tinted accent header, kind eyebrow, serif name, role subtitle, trust-weight pip pill, contact icon row, handling prose blocks, context anchors, performance index, notes, footer with id + "Update via Rodbot ↳")
  - Right-click context menu on every list row and on the profile pane (Talk about them, Update via Rodbot, Copy name, Copy email/phone/WhatsApp/Slack handle when present, Reclassify as Lead/Client/Coworker/Contact)
- Asset Ownership:
  - Render: `screens.jsx` `PeopleScreen`, `PersonProfile`, `PEOPLE_KIND_META`.
  - Data: `window.MissionControl.people` filtered by `kind`. Default fallback: missing `kind` reads as `"coworker"` (see `CLAUDE.md` §3.1 for the taxonomy).
  - Side effects: action buttons send prompts into chat (`window.SecretaryChat.send`) for Rodbot-assisted updates; nav+send ordering routes to home FIRST, then sends, with an 800ms `dispatchingRef` cooldown so rage-clicks don't queue duplicate prompts.
  - Right-click menu: shared `useContextMenu` hook from `components.jsx`. `ctxPersonRef` tracks which row was right-clicked; `buildPersonMenuItems(p)` renders dynamic items (only Copy entries for fields present on the record).
  - Styles: `people-screen`, `people-grid`, `people-list-pane`, `people-add`, `people-search`, `people-list-scroll`, `people-list-item`, `people-empty`, `people-empty-profile`, `person-profile`, `pp-*` (head, eyebrow, name, role, weight pips, sections, contacts, handling, anchor list, stats, foot, update button); kind accents via `person-profile-{lemon|mint|sage|blush}` mapping to `--{kind}-bg/-ink/-dot` deck tokens.
- Change Checklist:
  - `app.jsx` (route handler + `onOpenLeads` prop)
  - `screens.jsx` (`PeopleScreen`, `PersonProfile`, `PEOPLE_KIND_META`, context-menu wiring)
  - `components.jsx` (Topbar People dropdown — leads is one of four items, icon `trending-up`; reuses `useContextMenu` primitive)
  - `lucide.js` (icons used in nav: `trending-up`, `briefcase`, `users`, `phone`)
  - `i18n.js` (`leads` label EN+PT)
  - `mission_control_loader.js` (people payload — must include `kind`)
  - `styles.css` (`people-*`, `person-profile-*`, `pp-*`)
  - `CLAUDE.md` §3.1 (people taxonomy)
  - `AGENT.md` §9.3 (person_upsert contract — kind required)
  - `Rodbot/identity.md` (voice register per kind)
  - `agents/inbox_triage/agents.md` (fold-to-bedrock for people targets must include kind)
  - `ai_instructions.js` (people grouped by kind; kind injected into ghostwriting_for dossier)
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 schema migration: added `kind` field across the entire pipeline. All 13 existing `people/*.json` records backfilled to `"kind": "coworker"`. Updated `CLAUDE.md` §3.1, `AGENT.md` §9.3, `Rodbot/identity.md`, `ai_instructions.js`, `agents/inbox_triage/agents.md`, `README.md` in lockstep. Activity ledger entry appended (`_ledger/activity.jsonl` `kind:"schema_migration"`).
  - 2026-04-25 right-click context menus added on list rows and the profile pane: Talk about them, Update via Rodbot, Copy name/email/phone/WhatsApp/Slack handle (only renders when field is present), Reclassify as the three other kinds (sends prompt to Rodbot to retag).
  - 2026-04-25 Topbar People dropdown icons made uniform: added `trending-up` and `briefcase` to lucide.js so all four items (Leads/Clients/Coworkers/Contacts) render icons. Also added `user-plus`, `copy`, `message-circle` for upcoming surfaces.
  - 2026-04-25 nav+send ordering fix: the `+ add via Rodbot` and `update via Rodbot` buttons now navigate to home FIRST (synchronously), then fire the chat send on next tick. Plus 800ms dispatchingRef cooldown so rage-clicks don't queue duplicate prompts.
  - 2026-04-25 great trim: bedrock `people/` folder wiped — page starts blank.

## Page: `clients`

- Entry Points: topbar People group -> Clients.
- Primary Screen Component: `PeopleScreen` with `kind="client"`.
- Assets On Page: same as `leads`, filtered by kind. Profile uses mint accent.
- Asset Ownership: same code paths as `leads`; filter discriminator `(p.kind || "coworker") === "client"`. Topbar icon: `briefcase` (added to lucide.js 2026-04-25).
- Change Checklist: same as `leads` — see leads page Change Checklist for the full list.
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 same schema migration + context menu + icon work as `leads` (see leads page History).
  - 2026-04-25 great trim: bedrock `people/` folder wiped — page starts blank.

## Page: `coworkers`

- Entry Points: topbar People group -> Coworkers.
- Primary Screen Component: `PeopleScreen` with `kind="coworker"`.
- Assets On Page: same as `leads`, default-kind bucket. Profile uses sage accent.
- Asset Ownership: same code paths as `leads`. All 13 existing records (Andre, Anne, Bibi, Camila, Cathlyn, Domenic, Eduarda, Eufelyn, Ren, Rhonna, Rodrigo, Spyros, Toni) live here — explicitly tagged `"kind": "coworker"` after the 2026-04-25 backfill.
- Change Checklist: same as `leads`.
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 same schema migration + context menu + icon work as `leads`. All 13 existing records explicitly tagged `"kind": "coworker"` in this pass (write performed by Python script via bash, preserves field order with `kind` slotted right after `name`).
  - 2026-04-25 great trim: bedrock `people/` folder wiped — page starts blank (the 13 backfilled coworker records were removed alongside everything else).

## Page: `contacts`

- Entry Points: topbar People group -> Contacts.
- Primary Screen Component: `PeopleScreen` with `kind="contact"` (via route or `ContactsScreen` shim).
- Assets On Page: same as `leads`. Profile uses blush accent.
- Asset Ownership: same People stack; `ContactsScreen` is a one-line backwards-compat wrapper around `PeopleScreen` (defaults `kind="contact"`) so any saved-history deep-link to `/contacts` still resolves. Topbar icon: `phone`.
- Change Checklist: `app.jsx`, `screens.jsx`, `styles.css` — same as `leads`.
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 same schema migration + context menu + icon work as `leads`. The old single-page editable form was retired in this same pass; `ContactsScreen` is now a shim.
  - 2026-04-25 great trim: bedrock `people/` folder wiped — page starts blank.

## Page: `venues`

- Entry Points: topbar People group -> Venues (5th item, `map-pin` icon).
- Primary Screen Component: `VenuesScreen` in `screens.jsx`; detail view `VenueProfile`. Distinct shape from PeopleScreen — venues have `deal_stats`, `raw_variants`, `close_account`, `action`, `tier` instead of contacts/handling.
- Assets On Page:
  - List pane: search input, rows sorted by tier asc + total_value desc, with tier badge / opp_count chip / Close-linked chip / right-aligned total value.
  - Profile pane: tier+ENRICH-NOW eyebrow, 4-tile deal stats grid (opp_count, total_value, avg_deal_value, lead_name_refs), website link, Close account section, raw-variants pill list, notes, action bar.
- Asset Ownership:
  - Render: `screens.jsx` (`VenuesScreen`, `VenueProfile`, `VENUE_TIER_RANK`, `VENUE_TIER_LABEL`, `fmtVenueMoney`).
  - Routing: `app.jsx` `KNOWN_SCREENS` includes `"venues"`; route handler renders `<VenuesScreen go={go} />`. Topbar: `onOpenVenues` prop.
  - Topbar: `components.jsx` Topbar accepts `onOpenVenues`; People `NavGroup` includes `{ name: "venues", icon: "map-pin" }`; `activeNames` includes `"venues"`.
  - Data: `mission_control_loader.js` loads `fDomain("venues")` into `MissionControl.venues`, `MissionControl.venuesById`, and `counts.venues`.
  - Bedrock: `CCAgentindex/venues/*.json` (30 records as of 2026-04-27); registered under `indexes/index.json` key `"venues"`.
  - Icon: `lucide.js` `map-pin` (added 2026-04-27).
  - Styles: reuses `people-screen`, `people-grid`, `people-list-pane`, `people-search`, `people-list-item`, `pp-section`, `pp-stats`, `pp-stat`, `pp-chip-row`, `pp-chip`, `pp-notes-list`, `pp-foot`. Adds `vli-row`, `vli-money`, `vli-chips`, `vli-tier`, `vli-tier-tier_{1,2,3}`, `vli-chip`, `vli-chip-on`, `vp-tier`, `vp-enrich`, `vp-type`, `vp-link`, `vp-close`, `vp-close-empty`, `vp-variants`, `vp-variant`, `vp-action`, `vp-action-hot`, `pp-chip-on`.
- Change Checklist: `screens.jsx`, `app.jsx`, `components.jsx`, `mission_control_loader.js`, `styles.css`, `lucide.js`, `Secretary.html` (cache-bust), `CLAUDE.md` § 3.1 taxonomy table, `indexes/index.json` `venues` key when adding/removing records.
- Last Verified: 2026-04-27
- History:
  - 2026-04-27 initial wire-up: 5th item added to People NavGroup. `VenuesScreen` + `VenueProfile` written from scratch (not a `PeopleScreen` clone — venue schema is distinct). `map-pin` icon added to `lucide.js`. Cache-busts: styles 76→77, loader 6→7, lucide 7→8, components 59→60, screens 66→67, app 47→48.

## Page: `briefing`

- Entry Points: topbar context strip -> Briefing.
- Primary Screen Component: `DailyBriefingScreen` in `screens.jsx`.
- Assets On Page:
  - Pieces briefing ribbon
  - Briefing archive list
  - Markdown rendered selected briefing body
- Asset Ownership:
  - Render: `screens.jsx` `DailyBriefingScreen`, `PiecesBriefingRibbon`.
  - API: `/api/briefings`, `/api/briefings/<slug>`, `/api/pieces/status`, `/api/pieces/sweeps/latest`.
  - Styles: briefing/ribbon card styles in `styles.css`.
  - Side effects: read-only; refresh button triggers list reload.
- Change Checklist: `screens.jsx`, `server.py` (`/api/briefings*`, `/api/pieces/*`), `styles.css`.
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 great trim: bedrock `summaries/` folder wiped — will repopulate via Oracle Sweep cron.

## Page: `intake`

- Entry Points: topbar intake chip.
- Primary Screen Component: `IntakeScreen` in `screens.jsx` (`IntakeReportsList`/`IntakeReportDetail`).
- Assets On Page:
  - Reports list with create modal
  - Report detail dropzone and document cards
  - Report Q&A panel
- Asset Ownership:
  - Render: `screens.jsx` intake components.
  - API:
    - list/create/delete/get reports: `/api/reports/list|create|delete|get`
    - ingest flow: `/api/attachments/upload`, `/api/reports/<slug>/ingest`
    - ask flow: `/api/reports/<slug>/ask`
    - document delete: `/api/reports/<slug>/documents/<id>/delete`
  - Styles: `ix-*` classes in `styles.css`.
  - Side effects: report/document persistence and Q&A history updates.
- Change Checklist: `screens.jsx`, `chat.js` attachment helpers (if shared), `server.py` (`/api/reports/*`, `/api/attachments/upload`), `styles.css`.
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 great trim: removed `onAddCommitment` prop and any commitment-creation code paths; main intake import flow intact.

---

## Global Navigation And Shared Assets

- Entry point nav ownership:
  - `Topbar`, `BottomStrip`, route breadcrumbs: `components.jsx`.
  - Route switch and history stack: `app.jsx`.
- Shared overlays:
  - `FullscreenCell`, `TweaksPanel`, `EditWithRodbotOverlay`, `AIBanner`.
- Shared right-click primitive: `components.jsx` `useContextMenu` hook + `ContextMenu` component. Items: `[{ label, icon, onClick, danger, disabled, shortcut, divider, keepOpen }]`. Hook returns `{ onContextMenu, close, render, open }`. Currently wired on `grid` (CellContextMenu) and on all four People pages (list rows + profile pane). Pattern is reusable on any future page — `useContextMenu()` + `onContextMenu={...}` + `menu.render(buildItemsFor(target), title)`.
- Shared icon set (`lucide.js`): topbar uses `users`, `trending-up`, `briefcase`, `phone` for the four People items. Profile contact rows use `mail`, `phone`, `message-circle`, `hash`, `check-square`, `link`. Other available icons include: `sun`, `inbox`, `target`, `terminal`, `send`, `pencil`, `rotate-ccw`, `plus`, `x`, `chevron-{down,right,left}`, `zap`, `activity`, `search`, `circle`, `file-text`, `message-square`, `alert-triangle`, `plug`, `layers`, `slack`, `calendar`, `external-link`, `clipboard-list`, `sticky-note`, `circle-dot`, `sparkles`, `flame`, `award`, `maximize-2`, `git-branch`, `table`, `clock`, `info`, `alert`, `user-plus`, `copy`. **Bump `lucide.js?v=N` cache buster when adding icons.**
- Global data/state stores to account for on any page change:
  - localStorage keys: `secretary.tweaks` (includes `piecesModel`, `promptEnhance`), `secretary.gridHistory`, `secretary.gridOverrides`, `secretary.commitments`, `secretary.history.v2`, `secretary.refineStack`, `comeketo.briefingIdeas.<slug>` (AI-curated ideas cache per briefing slug — IdeasTray on grid).
  - window stores/services: `SecretaryAI`, `SecretaryActions`, `SecretaryMemory`, `SecretaryLedger`, `SecretaryInbox`, `SecretaryDelegator`, `SecretaryConnectors`, `Rodbot`, `MissionControl`.
  - Window events (cross-file pub/sub): `comeketoagent:language` (i18n flip), `missioncontrol:loaded`, `missioncontrol:error`.

## Verification Checklist (Use Every Page Edit)

- Route still exists in `app.jsx` and maps to expected component.
- Page section in this file updated with any asset/component/API changes.
- Any new endpoint/path is reflected under asset ownership.
- Any removed asset is removed from this file in same change.
- Run-through done for affected page entry point from `Topbar` or in-page navigation.

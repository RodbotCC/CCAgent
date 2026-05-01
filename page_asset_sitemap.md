# Comeketo Page-Asset Source Of Truth

Last updated: 2026-04-30 (ChatRail command cockpit added on `grid` — Claude/Codex status cards, command prompt cards, Box Graph/Delegations launchers, visual refresh. Prior same-day: Box Graph route added; page audit pass — `grid` reconciled against rendered reality; analytics OwnerStagePanel + /api/analytics/owner_stage endpoint added)
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
- `analytics`
- `delegations`
- `boxes`
- `box_graph`

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
- Assets On Page (reconciled against rendered reality 2026-04-30 — operator-facing this page is the **home / home chat destination**, not a decision grid):
  - **Topbar** (shared across all routes, NOT page-specific): Comeketo Agent home button (top-left, returns to `grid`), `proposals · personal` mode chips, `briefing` link, settings gear, page-nav row (`people` dropdown → leads/clients/coworkers/contacts/venues, `activity`, `intake`, `analytics`, `boxes`, `box graph`, `automation`, `delegations`)
  - **LivePiecesHeader** (top broadcast strip, full width — defined in `screens.jsx`, exposed on `window.LivePiecesHeader`): rotating ticker of Pieces-MCP-sourced summary/event/people cards. ~7s rotation, 60s deck rebuild from `_buildPiecesHeadlinerDeck`, ~280-char subtitle truncation, color-toned by source (browser=sky / vision=lav / clipboard=lemon / summary=sage / people=peach). Falls back to `TeachingStrip` when Pieces is offline so the homepage NEVER goes blank.
  - **FpBreadcrumb** (`grid · {gridId}` chip below the header — labeled "grid · morning" by default per `app.jsx` initial route)
  - **IdeasTray** ("Ideas" / SWEEP widget, left aside `fp-tray`): 4–5 briefing-sourced talking points with `BriefingIdea` rows (7px accent dot + sans-serif title). Two-phase load — regex-extracted bullets paint instantly via `extractBriefingIdeas`, then `curateBriefingIdeasViaAI` retitles via `window.SecretaryAI.ask` (cached in localStorage `comeketo.briefingIdeas.<slug>`). SWEEP button forces fresh AI curation. Click → `Let's talk about: {title}` lands in ChatRail. Footer hint: "click an idea — Rodbot picks it up in chat." **Operator note (Jake, 2026-04-30): "right now that works as a sweep widget … not what I want it to be yet."** — see `OPEN_PROBLEMS_LEDGER.md` PROB-2026-04-30-002.
  - **ChatRail** (right main `fp-chat` — `components.jsx` `ChatRail`): command cockpit with Claude Code / Codex CLI / active-provider status cards, prompt-seeding command cards (`Code sweep`, `Trace a Box route`, `Guardrail pass`, `Delegate-ready`), direct `Open graph` and `Delegations` launchers, chat composer with attachments, dropzone, animated thinking trace, "+ new" chat button, route-pill row (`slack`, `github`, `close`, `clickup`, `computer use`, `browser use`, `open browser`), and `send to delegations` toggle. Pills wire to `/api/computer_use/handoff`, `/api/browser_use/handoff` (+ `/jobs/<id>` polling), `/api/browser_open/handoff`. Composer hint: "Message Comeketo Agent. ⌘/Ctrl+Enter."
  - **Footer** (shared status bar): mode chips repeat (`grid · morning` left, `proposals · personal · Comeketo Agent` right)

- Removed / deprecated assets (still present as DEAD CODE in `components.jsx FrontPage` — surface area for cleanup, see PROB-2026-04-30-003):
  - 3x3 decision grid cards (FpCard / renderCard / renderVirtualParent / nowRow / laterRow defined but not rendered in current `FrontPage` return)
  - Generate / Back-one-generation controls (Sweep is now on IdeasTray, not the page-level controls)
  - Cell fullscreen modal
  - Edit with Rodbot overlay
  - AI status banner (replaced by LivePiecesHeader)
  - QuickCapture widget (removed in 2026-04-25 great trim per History below — Asset list had not reflected this until 2026-04-30 audit)
  - Refine state machine (`refineState`, `startRefine`, `updatePosition`, `spread`, `emitCoordinate`, `commitChild`, `refineChild`, `cancelRefine`, `homeFromRefine`, `jumpTrail` — all defined but unreachable from current return JSX)
- Asset Ownership:
  - **Topbar** (shared, not page-specific): rendered in `app.jsx` header section. Mode chips (`proposals` / `personal`) come from `app.jsx` state-signature (line 204) — they describe grid generation seed scoring (legacy from decision-grid era; still drive scoring even though the grid itself is gone).
  - **LivePiecesHeader**: defined in `screens.jsx` (`function LivePiecesHeader`, ~line 2981) + helpers `_buildPiecesHeadlinerDeck` and `_synthSummaryTitle`. Exposed on `window.LivePiecesHeader`; consumed by `FrontPage` in `components.jsx` (~line 2092). Reads from Pieces sweeps (server `/api/pieces/sweeps/latest`); rebuilds deck every 60s; rotates 7s per card. Falls back to `TeachingStrip` (also in `components.jsx`) when `piecesAvailable=false`.
  - **FpBreadcrumb**: `components.jsx`. Labels the current grid id (`grid · morning` is the default route per `app.jsx` line 149).
  - **IdeasTray** (`components.jsx` `IdeasTray` + `BriefingIdea`): pulls 4–5 talking points from `window.MissionControl.dailyBriefing.body`. Two-phase load via `extractBriefingIdeas` → `curateBriefingIdeasViaAI` (which calls `window.SecretaryAI.ask`). Cache: localStorage `comeketo.briefingIdeas.<slug>`. Click → `window.SecretaryChat.send({chatId, text: "Let's talk about: " + title})`.
  - **ChatRail** (`components.jsx` `ChatRail`): chat dispatch in `chat.js`. Provider routing per `tweaks.aiProvider` — Claude Code (`/api/claude_code/generate`), OpenAI (server relay `/api/chat/send` OR browser BYOK direct via `SecretaryAI.respond()`), or Codex CLI (`/api/codex_cli/generate`). Command cockpit reads `/api/status` for Claude/Codex binary availability and reads localStorage `secretary.tweaks` for the current `aiProvider`. Route pills wire to `/api/computer_use/handoff`, `/api/browser_use/handoff` + `/api/browser_use/jobs/<id>` polling, `/api/browser_open/handoff`.
  - Styles: `styles.css` — `front-viewport.ideas-mode` (kills `.chat-rail` min-height + sticky for 100% zoom fit), `fp-head` / `fp-body` / `fp-tray` / `fp-chat`, `live-pieces-header` / `live-pieces-indicator` / `live-pieces-dot` / `live-pieces-label` / `live-pieces-card`, `fp-teaching` / `fp-teaching-greeting` / `fp-teaching-instruct` / `fp-teaching-meta`, `ideas-tray-*` / `briefing-idea`, ChatRail classes including `chat-rail-head`, `chat-command-*`, and `chat-route-*`. **Stale CSS still present:** `grid-stage`, `cell`, `grid-head`, `quick-capture`, `qc-*` — referenced by removed/dead-code assets (cleanup candidate, see PROB-2026-04-30-003).
  - Side effects: ChatRail `computer use` copies a structured handoff prompt to clipboard, activates Codex Desktop, pastes, presses Return — appends `computer_use_handoff` to `CCAgentindex/_ledger/activity.jsonl`. `browser use` starts headless Playwright via `scripts/browser_use_worker.js`, writes receipts to `CCAgentindex/_ledger/browser_use_jobs/`, screenshots to `output/playwright/`, appends `browser_use_handoff`. `open browser` opens visible Chrome to inferred URL, appends `browser_open_handoff`. **Note: legacy `/api/cells/*` and `/api/grid_affinity` endpoints still exist server-side but are no longer reachable from this page's UI** (page-level dead code).
- Change Checklist:
  - `app.jsx`
  - `components.jsx` (FrontPage, ChatRail, IdeasTray, BriefingIdea, QuickCapture, extractBriefingIdeas, curateBriefingIdeasViaAI, readCachedIdeas/writeCachedIdeas)
  - `chat.js` (ChatRail provider dispatch, selected OpenAI hosted/BYOK routing, message persistence)
  - `styles.css` (grid classes + ideas-tray + briefing-idea + quick-capture + front-viewport.ideas-mode height/min-height/sticky overrides)
  - `inbox.js` (SecretaryInbox.append — QuickCapture writes go through here)
  - `mission_control_loader.js` (briefing payload — IdeasTray reads `MissionControl.dailyBriefing`; Pieces fetches gated 2026-04-28)
  - `server.py` (`/api/cells/*`, `/api/claude_code/generate`, `/api/computer_use/handoff`, `/api/browser_use/handoff`, `/api/browser_use/jobs/<id>`, `/api/browser_open/handoff`, `/api/grid_affinity` if behavior changed; `/api/inbox/append` for QuickCapture writes)
  - `ai_instructions.js` (chat prompt assembler — `piecesBlock()` returns null 2026-04-28)
  - `Secretary.html` (cache-busters)
- Last Verified: 2026-04-30
- History:
  - 2026-04-30 ChatRail command cockpit (Codex session, operator asked to "go hard" on red-outlined main chat area): upgraded the right rail from plain chat surface to a command surface for multi-agent work. New header treatment plus status cards show Claude Code availability, Codex CLI availability, active provider, thread count, and turn count using `/api/status` + `secretary.tweaks`. Added quick command cards that seed high-leverage prompts into the composer (`Code sweep`, `Trace a Box route`, `Guardrail pass`, `Delegate-ready`) plus direct launch buttons for `box_graph` and `delegations`. Visual refresh adds warmer layered paneling, cockpit cards, recessed stream background, stronger bubbles, and composer styling. Cache-bust: `components.jsx` 74→75, `styles.css` 93→94.
  - 2026-04-30 web-mode UI gating — Pieces-dependent surfaces hide when OpenAI is selected (Cowork session, operator-flagged for hosted-web-app demo readiness, treated with care): interim implementation against `PROB-2026-04-30-001` (Web-vs-Local Execution Context). New constant `WEB_MODE_HIDDEN_ROUTES = ["briefing", "activity"]` in `app.jsx`; new derived `webMode = (tweaks.aiProvider === "openai")`. When `webMode` is true: (a) **`grid` page**: `FrontPage` no longer renders `LivePiecesHeader` — falls through to `TeachingStrip` (the existing offline-Pieces fallback), so the homepage never goes blank; (b) **`Topbar` row 0**: the `briefing` chip + the preceding `·` separator hide via `!webMode &&` guard; (c) **`Topbar` row 1**: the `activity` chip hides via `!webMode &&` guard; (d) **redirect effect**: a `useEffect` in `app.jsx` watches `webMode` and `route.name` — if the user is currently on a hidden route when they flip the provider toggle, `go.home()` fires so they don't land on a broken Pieces page; (e) **Settings disclosure**: when `currentProvider === "openai"`, `SettingsScreen` renders a small bordered note under the AI provider description spelling out exactly which three surfaces hide and why (Pieces is per-machine, not reachable in hosted web mode), with cross-ref to `PROB-2026-04-30-001`. The gate is intentionally simple — uses the existing AI provider toggle as a proxy for "we're in hosted web mode" rather than building the full mode/profile system PROB-001 ultimately requires. New `webMode` prop threaded through `Topbar` and `FrontPage`. Cache-bust: `app.jsx` 53→54, `components.jsx` 72→73, `screens.jsx` 97→98. Closes one PROB-2026-04-30-001 close-criterion (Pieces gracefully disabled in web mode — partial: web banner not yet implemented since we hide rather than disable; full mode-aware routing still open).
  - 2026-04-30 ChatRail tool-turn visual identity (Cowork session, operator-approved follow-on): tool turns now render with a distinct visual treatment to read as a different message kind than AI replies. New CSS rules in `styles.css` (around the `.chat-rail-turn` block): `.chat-rail-turn.tool` joins `.ai` / `.sys` in left-justified flow; `.chat-rail-turn.tool .chat-rail-bubble` uses recessed `var(--paper-2)` background + `var(--rule-2)` border; a `::before` pseudo-element renders a quiet `TOOL` eyebrow at top-left of the bubble in monospace 9px tracked caps with `var(--ink-4)`. JSX side: the turn className in `components.jsx` (line ~1126) now picks `tool` as a wrapper class when `t.role === "tool"` instead of falling through to `ai`. Cache-bust: `components.jsx` 71→72, `styles.css` 91→92.
  - 2026-04-30 ChatRail polish — route pill unification + browser-use card link cleanup (Cowork session, operator-flagged): (a) all 7 route pills (`slack`, `github`, `close`, `clickup`, `computer use`, `browser use`, `open browser`) now render visually identically at idle. Root cause: the four tagging pills passed `enabled: true` always while the three action pills passed `enabled: !!draft.trim()` — when the composer was empty the action pills fell to `var(--ink-4)` (lighter grey) while the tagging pills stayed at `var(--ink-3)`, creating the side-by-side shade mismatch Jake flagged. Fix: action pills now pass `enabled: true` to `routePillStyle` and tooltip copy explains the "type something first" prerequisite. The HTML `disabled` attr still prevents firing on empty draft — only the visual color is unified. (b) `browserResultPanelText` rewritten so the "browser use done" tool card never renders the raw URL as visible link text. New format: `→ opened **<host>** — <truncated page title>` with `<host>` carrying the clickable href; results list uses item titles or text (URL only as a fallback host badge), all bounded by an 80–200-char `_truncate` helper. New helpers: `_prettyHost(url)`, `_looksLikeUrl(s)`, `_truncate(s, n)` defined inside `ChatRail`. Cache-bust: `components.jsx` 70→71.
  - 2026-04-30 page audit pass (Cowork session — operator walkthrough w/ Jake, screenshot at 14:53 ET): three-way diff of screenshot ↔ sitemap claims ↔ actual `FrontPage` JSX in `components.jsx` revealed significant drift. Sitemap had been claiming a 3x3 decision grid + Generate/Back controls + Cell fullscreen modal + Edit overlay + AI status banner + QuickCapture as the page's primary assets — none of which are rendered. Actual page is a **home / home chat destination** with three zones: LivePiecesHeader (top, Pieces ticker), IdeasTray (left, briefing-sourced "sweep" widget), ChatRail (right, full chat composer w/ route pills). Asset list + Asset Ownership rewritten to match. Dead code retained in `components.jsx FrontPage` flagged for cleanup at PROB-2026-04-30-003. Operator-stated WIP intent for the IdeasTray ("not what I want it to be yet") flagged at PROB-2026-04-30-002. No code changes in this audit unit; sitemap-only write. Last Verified bumped.
  - 2026-04-30 hosted OpenAI chat route: main ChatRail now reuses `SecretaryAI.respond()` when OpenAI is selected and the app is in browser BYOK direct mode, matching the Automation page behavior on hosted/Render demos. Server-side `/api/chat/send` OpenAI relay also normalizes local UI roles like `tool`/`system` and emits assistant history as Responses API `output_text`, so OpenAI-selected chat survives tool receipts and prior assistant turns. Cache-bust: `chat.js` 10→11.
  - 2026-04-30 computer-use bridge: added a `computer use` pill to the ChatRail route row. It sends the current composer draft to `/api/computer_use/handoff`, which copies a structured handoff prompt to the macOS clipboard, activates Codex Desktop, pastes, and presses Return. Successful handoffs append `computer_use_handoff` to `CCAgentindex/_ledger/activity.jsonl`. Cache-bust: `components.jsx` 64→65.
  - 2026-04-30 route row polish: changed Slack/GitHub/Close/ClickUp quick-tags from small circular icon buttons to the same labeled pill treatment as `computer use` and `browser use`. Handoff confirmations now render as neutral tool bubbles instead of red system bubbles, include the exact prompt sent, and skip the assistant-turn delegation footnote. Cache-bust: `components.jsx` 66→67.
  - 2026-04-30 tool panel + pill polish: route pills now share identical idle/active border logic, and browser/computer/open-browser receipts render as markdown tool cards with quoted prompts and compact labeled links instead of raw URL spillover. Cache-bust: `components.jsx` 68→69.
  - 2026-04-30 visible browser split: kept `browser use` as the quiet/headless reporter and added `open browser` as the visible Chrome handoff for watch/read flows. `browser use` now reads Settings defaults for result count, detail, link inclusion, and screenshots. Cache-bust: `components.jsx` 67→68.
  - 2026-04-30 browser-use bridge: added a sibling `browser use` pill to the ChatRail route row. It starts a headless Playwright worker through `/api/browser_use/handoff`, polls `/api/browser_use/jobs/<id>`, and posts the result summary back into the chat rail without focusing Codex Desktop or stealing the user's screen. Worker script lives at `scripts/browser_use_worker.js`; screenshots land in `output/playwright/`. Cache-bust: `components.jsx` 65→66.
  - 2026-04-28 chat context cleanup + connector quick-tags: (a) Removed Pieces from chat context window — `piecesBlock()` in `ai_instructions.js` returns null; `primePiecesFromLedger()` and `sweepPieces()` in `mission_control_loader.js` no-op. Pieces UI on Activity page untouched. Saves chat context budget; chat now grounds entirely in CCAgentindex bedrock (which now includes the 6 Auto/ symlinks made earlier today: Boxes, Client Boxes, comeketo-inbox, Onboard Scripts, orchestrator, Staff Boxes). (b) Added connector quick-tag row above ChatRail input on FrontPage. Four round icon buttons: Slack (`slack`), GitHub (`git-branch`), Close (`target`), ClickUp (`clipboard-list`). Click toggles `@<connector>` tag in/out of draft; active tags show with filled background. Phase 1 = visual + intent-tagging. Phase 2 (deferred): wire to MCP server for actual sends. Cache-busts: `mission_control_loader.js` 9→10, `ai_instructions.js` 11→12, `components.jsx` 63→64.
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
- Last Verified: 2026-04-27
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
  - 2026-04-27 Rodbot graph recovery pass: restored authoring controls for net-new graphs (`New`) and branch-save workflow cloning (`Save As`) in the Workflows left rail; `Save As` now forks a new workflow id/name and persists with unique slug generation to avoid overwrite collisions. Rodbot dispatcher upgraded so fast-path only triggers on terse one-shot add commands, while longer prompts route through LLM planning. Expanded Rodbot op surface in graph rail to accept `update_node`, `update_connection`, and `delete_connection` in addition to add/delete node + add connection, enabling deeper AI-driven automation edits rather than preset-only inserts. Prompt schema updated to canonical edge kinds (`data/reference/trigger/conditional`). Cache-bust: `automation` 16→17.
  - 2026-04-27 automation polish + Rodbot batch-op fix: fixed multi-op apply race by batching Rodbot ops into a single graph commit (`onApplyOps`) so replies that contain multiple node/edge mutations no longer collapse to one visible change. Refined workflow header controls to wrap cleanly within the left rail and switched button styling to deck-compatible paper/lavender chip tone (no overflow into panel chrome). Updated Rodbot chat rail bubbles to the intake-style lavender panel feel for AI turns. Cache-busts: `automation` 17→18, `styles` 90→91.
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
- Last Verified: 2026-04-30
- History:
  - 2026-04-30 web-mode hide: this entire route now hides from the Topbar (Row 1) when `tweaks.aiProvider === "openai"`. Deep links to `/activity` redirect to `grid` via the `webMode` `useEffect` in `app.jsx`. `PiecesActivityScreen` is unchanged — the gate is at `Topbar` + the redirect effect, not inside the screen itself. Reason: Pieces is per-machine and not reachable in hosted web mode. See sitemap §grid 2026-04-30 web-mode UI gating entry for the full canonical description, and `PROB-2026-04-30-001` for the open-problem context.
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
  - Browser use defaults (headless result count, detail level, link inclusion, screenshot capture)
  - Pieces model selector
  - MCP server / delegation target status registry (GitHub, ClickUp, Close, Claude Code, Codex CLI, Cursor)
  - Credential editor for MCP/connector keys (masked save/clear flow to `.env`)
- Asset Ownership:
  - Render: `screens.jsx` `SettingsScreen`, `IntelligencePanel`.
  - Data: `tweaks` state in `app.jsx` persisted to localStorage `secretary.tweaks`.
  - API: `GET /api/status`, `POST /api/claude_code/generate`, `POST /api/codex_cli/generate`, `POST /api/browser_use/handoff`, `POST /api/browser_open/handoff`, `GET /api/settings/mcp_credentials`, `POST /api/settings/mcp_credentials/save`.
  - Integrations: `window.SecretaryAI`, `window.Comeketoi18n`.
  - Styles: settings classes in `styles.css`.
  - Side effects: writes localStorage values; no direct destructive server write from toggles.
- Change Checklist: `app.jsx`, `screens.jsx`, `server.py` (`/api/status`, `/api/claude_code/generate`, `/api/codex_cli/generate`, `/api/chat/send` provider routing, browser-use handoff endpoints), `ai.js`, `chat.js`, `i18n.js`, `styles.css`, `Secretary.html` cache-busters.
- Last Verified: 2026-04-30
- History:
  - 2026-04-30 web-mode disclosure box on AI provider: when `currentProvider === "openai"`, `SettingsScreen` now renders a small bordered note directly below the AI provider description spelling out exactly which three surfaces hide and why (briefing chip, activity chip, LivePiecesHeader on `grid` — Pieces is per-machine, not reachable in hosted web mode). Cross-refs `PROB-2026-04-30-001`. Provides operator visibility into what flipping the toggle changes in the rest of the app. Cache-bust: `screens.jsx` 97→98. Companion changes in `app.jsx` (53→54, `webMode` derived + redirect `useEffect`) and `components.jsx` (72→73, `Topbar` and `FrontPage` accept `webMode` and gate). See sitemap §grid 2026-04-30 web-mode UI gating entry for the full canonical description.
  - 2026-04-30 browser-use settings: added a Browser use section with localStorage-backed defaults for headless result count, detail level, return-links toggle, and screenshot capture. These settings feed the ChatRail `browser use` worker; `open browser` remains a visible Chrome handoff. Cache-bust: `screens.jsx` 95→96.
  - 2026-04-28 Codex CLI provider: added `codex_cli` as a third Intelligence provider beside Claude Code and OpenAI. Settings now shows a three-way selector and a selected-CLI binary row; choosing Codex uses local `codex exec` with the selected GPT model and read-only sandbox, while choosing Claude uses local `claude -p`. The single `tweaks.aiProvider` value makes the routes mutually exclusive: only the selected provider receives chat/test/generate prompts. `/api/status` now reports `codex_cli_available` + `codex_cli_path`; `/api/codex_cli/generate` was added; `/api/chat/send` accepts `provider:"codex_cli"` and `chat.js` forwards the selected model. Cache-busts: `ai.js` 5→6, `chat.js` 9→10, `screens.jsx` 93→94, `app.jsx` 51→52.
  - 2026-04-25 initial mapping.
  - 2026-04-25 great trim: stripped density/frames/gestures/prediction/auto-commit/memory rows from `SettingsScreen` + `TweaksPanel`. Remaining knobs: theme, demo mode, language, intelligence panel (api key + provider + model), prompt-enhance, pieces model, reset.
  - 2026-04-27 MCP control layer: added a dedicated "MCP servers + delegation targets" section with live status refresh from `/api/status`. Surfaces per-target availability + connector detail + write-approval policy for GitHub/ClickUp/Close/Claude/Cursor and links directly into the Delegations action zone.
  - 2026-04-27 credential wiring: added masked token inputs in Settings for `OPENAI_API_KEY`, `GITHUB_TOKEN`, `CLICKUP_API_TOKEN`, and `CLOSE_API_KEY` (save/clear). Backend now supports `/api/settings/mcp_credentials` + `/api/settings/mcp_credentials/save`, writes allowed keys into local `.env`, updates in-memory env map, and logs `settings_mcp_credentials_save` to activity ledger.
  - 2026-04-27 model-default alignment: preprocess/reflection passes now inherit the active Settings model (`tweaks.openaiModel`) instead of hard-defaulting to `gpt-5.4-mini`, so operators can run GPT-5.4 end-to-end when selected.

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
- Last Verified: 2026-04-30
- History:
  - 2026-04-30 web-mode hide: this entire route now hides from the Topbar (Row 0 context strip) when `tweaks.aiProvider === "openai"`. Both the chip and its preceding `·` separator are wrapped in `!webMode &&`. Deep links to `/briefing` redirect to `grid` via the `webMode` `useEffect` in `app.jsx`. `DailyBriefingScreen` is unchanged. Reason: the briefing surface depends on Pieces sweeps which are per-machine and not reachable in hosted web mode. See sitemap §grid 2026-04-30 web-mode UI gating entry for the full canonical description, and `PROB-2026-04-30-001`.
  - 2026-04-25 initial mapping.
  - 2026-04-25 great trim: bedrock `summaries/` folder wiped — will repopulate via Oracle Sweep cron.

## Page: `intake`

- Entry Points: topbar intake chip; "Open as Intake Report →" right-click action on a Client Box card in the Boxes page (passes `openSlug` route param).
- Primary Screen Component: `IntakeScreen` in `screens.jsx` (`IntakeReportsList`/`IntakeReportDetail`).
- Assets On Page:
  - Reports list — split into **Box Reports** (auto, one per Client Box) and **Workspaces** (manual smorgasbord)
  - Create modal (Workspaces only — Box Reports are auto-derived from their boxes)
  - Report detail dropzone and document cards
  - Report Q&A panel
  - Box-Report-only header pill: "open in boxes →" handoff to the Boxes page
- Asset Ownership:
  - Render: `screens.jsx` intake components (`IntakeScreen`, `IntakeReportsList`, `IntakeReportDetail`, `IntakeDocumentCard`).
  - Router/nav: `app.jsx` passes `openSlug` route param into `IntakeScreen`.
  - API:
    - list (Workspaces + Box Reports): `/api/reports/list` returns `{items, box_reports}`
    - create (Workspaces only): `/api/reports/create` (refuses slugs that collide with Client Box ids)
    - delete (Workspaces only): `/api/reports/delete` (Box Reports return 405 — they exist iff their box exists)
    - get: `/api/reports/get?slug=<slug>` — synthesizes from `Auto/Client Boxes/<Name>/` when slug matches a client_box id, else loads workspace `report.json`
    - ingest: `/api/attachments/upload` then `/api/reports/<slug>/ingest` — Box-Report ingests write into `Auto/Client Boxes/<Name>/intake_drops/<file>`
    - ask: `/api/reports/<slug>/ask` — generic ask path for both kinds (box-aware agent config is deferred to Phase 2)
    - document delete: `/api/reports/<slug>/documents/<id>/delete` — workspace only; Box-Report docs return 405 with guidance
  - Styles: `ix-*` classes in `styles.css`.
  - Side effects: workspace report/document persistence + Q&A history (workspaces); for Box Reports, file drops land in the box folder and conversation history is written to `CCAgentindex/reports/_box_conversations/<box_id>.jsonl`. Box Reports are read-on-demand — no `report.json` is written into Client Boxes.
- Change Checklist: `screens.jsx`, `app.jsx` (route param wiring), `server.py` (`/api/reports/*`, `_box_report_*` helpers), `styles.css`, `Secretary.html` (cache-bust when JS/CSS changes), `LEDGERS/DECISIONS_LEDGER.*`, `LEDGERS/GLOBAL_LEDGER.md` §12 if architecture shifts.
- Last Verified: 2026-04-29
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 great trim: removed `onAddCommitment` prop and any commitment-creation code paths; main intake import flow intact.
  - 2026-04-27 ingestion hardening + format expansion: `IntakeReportDetail` now queues multi-file drops/picker uploads sequentially to prevent threaded write races, quick-prompt templates expanded for OCR/totals/consistency/deadline asks, dropzone copy and picker accept list broadened (`xlsx/xls`, `docx/doc`, `html`, `js/ts`, `yaml/xml/jsonl`). Backend (`server.py`) added per-report ingest locks, image OCR via provider vision path, and extraction support for code/text variants plus `xlsx`/`docx` parsing (with graceful `.xls`/`.doc` guidance fallbacks). Cache-bust: `screens.jsx` 71→72 in `Secretary.html`.
  - 2026-04-27 right-click polish pass: added context menus across intake surfaces using shared `useContextMenu`/`ContextMenu` primitives. `IntakeReportsList` cards now expose open/copy/delete actions; `IntakeReportDetail` document cards now expose ask-from-doc/open-source/copy/remove actions; Q&A entries now expose re-ask/copy actions. Cache-bust: `screens.jsx` 72→73 in `Secretary.html`.
  - 2026-04-27 delegations handoff wiring: intake right-click menus now include `Send ... to delegations` actions for report documents and Q&A turns, creating editable delegation drafts before execution. Cache-bust: `screens.jsx` 75→76.
  - 2026-04-27 preprocess model sync: report Q&A preprocessor (`/api/chat/preprocess`) now receives the selected Settings model and carries that model through thinking-trace metadata, removing hardcoded mini defaults in intake ask flow. Cache-bust: `screens.jsx` 92→93.
  - 2026-04-29 Phase 1 Intake → Box unification: every Client Box is now addressable from Intake as a Box Report. Reports list splits into Box Reports (top, auto, 28 entries) and Workspaces (below, manual). Box Reports are synthesized on every read from `Auto/Client Boxes/<Name>/` — no `report.json` written into the box, no drift surface. Slug = box id (e.g., `hugo_casillas`). The `client_box__hugo_casillas` style prefix from the draft was dropped in favor of the existing box-id directly because all client-box ids are already unique within the catalog. Ingest into a Box Report writes to `Auto/Client Boxes/<Name>/intake_drops/<file>`. Conversation history lives at `CCAgentindex/reports/_box_conversations/<box_id>.jsonl`. The ask path is unchanged generic — box-aware agent-config plumbing is deferred to Phase 2 (per the plan in `LEDGERS/Drafts/intake_box_unification_plan.md`). Server changes: new `_box_report_lookup`, `_box_report_synthesize`, `_box_report_ingest`, `_box_report_*_conversation` helpers in `server.py`; branches in `_reports_get`/`_reports_ask`/`_reports_ingest`/`_reports_doc_delete`/`_reports_create`/`_reports_delete`. Frontend changes: `IntakeReportsList` renders two sections; `IntakeReportDetail` shows "box report" eyebrow, "open in boxes →" handoff, and disables delete X on synthesized doc cards; `IntakeScreen` honors `openSlug` route param. Cross-nav: Boxes-page right-click on a Client Box now exposes "Open as Intake Report →" which navigates to `intake` with `openSlug=<box_id>`. Cache-busts: `screens.jsx` 94→95, `app.jsx` 52→53.

## Page: `delegations`

- Entry Points: topbar `delegations` chip; chat and context-menu handoff actions route here.
- Primary Screen Component: `DelegationsScreen` in `screens.jsx`.
- Assets On Page:
  - Draft queue columns (draft / pending approval / running+history states)
  - Visual channel picker cards (Claude Code/GitHub/ClickUp/Close/Cursor) with readiness indicators and one-click target assignment
  - Final-edit panel (label, prompt, policy target/intent, timeout, cwd)
  - Markdown-first final-edit preview (prompt always rendered as markdown while editing)
  - Rewrite-with-AI helper for prompt edits
  - Explicit action CTAs: save / undo / run read / request write approval / approve+execute write / reject / delete
  - Right-click menus on draft cards + run timeline rows + channel cards
  - Inline action feedback strip (`ok/error/neutral`) after every critical interaction
  - Execution timeline of delegation runs
- Asset Ownership:
  - Render: `screens.jsx` (`DelegationsScreen`, `sendToDelegationsDraft` bridge).
  - Router/nav: `app.jsx` route wiring (`KNOWN_SCREENS` + `route.name === "delegations"`), `components.jsx` topbar chip + breadcrumb label.
  - Client API layer: `delegator.js` draft lifecycle methods (`drafts`, `createDraft`, `updateDraft`, `deleteDraft`, `submitDraft`, `rewriteDraft`) alongside run polling.
  - API:
    - runs: `GET/POST /api/delegate`, `GET /api/delegate/<id>`
    - drafts: `GET /api/delegations/drafts`, `POST /api/delegations/drafts/{create|update|delete|submit|rewrite|undo}`
    - status: `GET /api/status` includes `github_mcp` and `delegation_targets` availability details.
  - Policy/security: `server.py` enforces target-aware delegation policy (read routes safe; writes for connector targets require explicit approval; GitHub additionally blocked when MCP unavailable).
  - Storage/audit:
    - run files: `CCAgentindex/_ledger/delegations/<request_id>.json`
    - draft store: `CCAgentindex/_ledger/delegation_drafts.json`
    - draft events: `CCAgentindex/_ledger/delegation_draft_events.jsonl`
    - activity stream mirrors dispatch events in `CCAgentindex/_ledger/activity.jsonl`.
  - Styles: reuses `ix-*` intake card/editor primitives + selected-card enhancement in `styles.css`.
  - Side effects: draft persistence, approval-state transitions, dispatch execution via Claude subprocess.
- Change Checklist: `app.jsx`, `components.jsx`, `screens.jsx`, `delegator.js`, `server.py`, `styles.css`, `Secretary.html` (cache-bust), `page_asset_sitemap.md`.
- Last Verified: 2026-04-27
- History:
  - 2026-04-27 page restored as standalone route and promoted to action-zone workflow. Added universal draft-first handoff bridge, final-edit UI, write-approval controls, server-side GitHub policy gate, and draft/run audit ledgers. Connected first send-points: chat rail, fullscreen chat, people context menu, intake doc/Q&A menus. Cache-busts: `styles` 78→79, `delegator` 2→3, `chat` 7→8, `components` 61→62, `screens` 75→76, `app` 49→50.
  - 2026-04-27 action-zone polish: target picker expanded to `general/github/clickup/close/claude_code/cursor`, write approval flow generalized per target, markdown preview added in final edit (prevents raw-asterisk/janky rendering), draft undo endpoint + UI control added, and right-click menus now cover both draft cards (open/undo/duplicate/copy/delete) and run timeline rows (copy/open-linked-draft).
  - 2026-04-27 clarity/feedback pass: reintroduced a prominent channel-picker surface with color-coded target cards, restored “where is this going?” clarity via one-click target binding + right-click target actions, added action feedback strip for immediate interaction confirmation, and removed nested-scroll behavior in markdown preview to keep the page on a single reading surface. Cache-busts: `styles` 88→89, `screens` 90→91.

## Page: `boxes`

- Entry Points: topbar `boxes` chip; direct route navigation via app history stack.
- Primary Screen Component: `BoxesScreen` in `screens.jsx`.
- Assets On Page:
  - Roster/detail mode scoped to the focused pair (`hugo_casillas`, `brenda_steve*`) with explicit back-to-roster action
  - Search + refresh/poll controls with pair-focused rendering while design system hardening is in progress
  - Unified section nav (`state/profile/comms/enrichment/7-day plan/agents/logic`) inside one panel
  - In-site dossier reader transforms section text into styled narrative cards (no iframe or legacy html embed surface)
  - Lead-specific renderer slots: `hugo_casillas` + `brenda_steve` with custom layouts
  - Markdown-first rich renderer (`boxes-md-rich`) with styled admonition blockquotes, panelized section cards, and design-kit text rhythm
  - Right-click actions on dossier section panels (copy section text/name, send section to delegations)
  - Per-box checklist rail + completeness scoring (`thin/partial/strong`) with panel and card color-coding
  - Horizontal rails used only for compact checklist navigation; primary reading is vertical single-surface flow
  - Mismatch diagnostics (unlinked box folders + people missing canonical boxes)
  - Right-click actions on box cards and page cards
  - Per-box verbatim communications: `01b_comms_verbatim.md` (chronological, full email bodies + speaker-labeled call/voicemail transcripts) plus `comms/<type>_<YYYY-MM-DD>_<id>.json` raw Close payloads (one file per call/meeting/email/sms/whatsapp/thread). Sits alongside the curated `01_comms.md` exec summary; not yet bound to a UI section but available for future renderer hookup.
- Asset Ownership:
  - Render: `screens.jsx` (`BoxesScreen` + context-menu wiring + delegation handoff).
  - Router/nav: `app.jsx` (`KNOWN_SCREENS` + route switch), `components.jsx` topbar chip (`layers` icon).
  - Data source: direct server API reads from `Auto/Client Boxes`, `Auto/Staff Boxes`, and `Auto/orchestrator/state/*.html`.
  - API:
    - `GET /api/boxes/list`
    - `GET /api/boxes/<id>`
    - `GET /api/boxes/<id>/html`
    - `GET /api/boxes/<id>/template/<slug>` (virtual html templates)
    - `GET /api/boxes/<id>` now includes `sections.state_touches`, `sections.enrichment_markdown`, `sections.agents_markdown`
  - Loader binding: `mission_control_loader.js` (`fBoxes`) hydrates `MissionControl.boxes`, `boxesById`, `boxesGrouped`, `boxesMismatch`, and exposes `window.MissionControlRefreshBoxes()`.
  - Styles: `.boxes-*` classes in `styles.css` plus existing `ix-*` primitives.
  - Side effects: read-only filesystem discovery of `Auto` directory; optional delegation draft creation via `sendToDelegationsDraft` from box menu actions.
- Change Checklist: `server.py`, `mission_control_loader.js`, `app.jsx`, `components.jsx`, `screens.jsx`, `styles.css`, `Secretary.html`, `page_asset_sitemap.md`.
- Last Verified: 2026-04-29
- History:
  - 2026-04-29 Intake handoff + selectId honoring: Boxes page right-click on a Client Box exposes "Open as Intake Report →" (navigates to `intake` with `openSlug=<box_id>`). `BoxesScreen` now accepts a `selectId` prop (wired through `app.jsx` from `route.selectId`) so the reverse handoff from Intake's "open in boxes →" button lands directly on the chosen box. Symmetric to the Intake-page changes from the same Phase 1 pass. Cache-busts: `screens.jsx` 94→95, `app.jsx` 52→53.
  - 2026-04-28 verbatim comms backfill: pulled full Close.com conversation history for all 28 client boxes via direct `api.close.com/api/v1` access (calls with `recording_transcript`/`voicemail_transcript`, meetings with `transcripts`, emails with `body_text`/`body_html`, sms, whatsapp, email_threads). Per-box outputs: `01b_comms_verbatim.md` (chronological narrative, ~10–62KB per lead) and `comms/<type>_<YYYY-MM-DD>_<id>.json` raw payloads (8–43 files per lead). Existing `01_comms.md` summaries left untouched. Closes the gap where André's call content was previously summary-only — speaker-labeled transcripts now ground every assertion. Pull script lives at `outputs/pull_full_comms.py` (one-shot; not yet promoted into the bedrock). Total: 582 raw activity payloads pulled across 28 leads; 0 boxes missing.
  - 2026-04-27 initial boxes runtime pass: introduced direct Auto-source APIs and a new top-level Boxes page. Server now parses canonical stage files (`00_meta`, `01_comms`, `04_profile`, `05_seven_day_plan`, optional logic/skills/alerts/ledger), resolves html demos (orchestrator + per-box), and reports mismatch diagnostics. Frontend adds topbar route, MissionControl boxes hydration, right-click actions, and live preview iframe. Cache-busts: `styles` 80→81, `mission_control_loader` 8→9, `components` 62→63, `screens` 81→82, `app` 50→51.
  - 2026-04-27 boxes layout simplification pass: removed the separate html side panel and merged navigation/content into one main panel. Added page-card launcher mode (`pages`) so html files open in-panel as native pages, with quick back-to-cards flow and no extra split panes. Cache-busts: `styles` 81→82, `screens` 82→83.
  - 2026-04-27 completeness workspace pass: each box now gets generated virtual template pages (`overview`, `checklist`, `action_board`) from server-side `/api/boxes/<id>/template/<slug>`, plus checklist scoring in list/detail APIs. Frontend adds health color-coding, checklist rail, horizontal card rails, and auto-reset scroll-to-top on box/section changes so operators do not lose context in deep-scroll states.
  - 2026-04-27 lead-dossier mode pass: client boxes now support focused navigation where roster is hidden after selection and restored via explicit back action. Added starter-workset filter for the first 10 target leads and expanded section model to `state/comms/profile/enrichment/7-day plan/agents/logic`, with state auto-derived as last five touch bullets from comms and enrichment phrased as "operationally usable context vs protected/off-limits context."
  - 2026-04-27 renderer pass: removed pages/html embed tab from boxes UI and replaced markdown-dump output with a native dossier renderer that turns section text into styled narrative cards and bullet blocks. Top metadata converted from dense card grid to compact fact pills + readiness bar to reduce visual clutter.
  - 2026-04-27 specialization pass: added first per-lead dossier template for Hugo Casillas (`screens.jsx`), including markdown-table extraction, Close-link banner, structured snapshot table, and narrative/action split cards. This creates the pattern to roll out bespoke renderers across the remaining starter leads one-by-one.
  - 2026-04-27 markdown/design-kit pass: switched dossier body rendering to markdown-first cards with custom admonition styling (`NOTE/WARN/TODO` → visual callouts), and added section-level context menu actions so operators can right-click any section to copy or hand off to delegations.
  - 2026-04-27 specialized template #2: `brenda_steve` now renders as a pair-decision dossier with primary/secondary decision strip, Close-link banner, comms timeline cards (from `###` blocks), day-plan execution cards (from `Day n` blocks), and logic/action rule cards. This is built as a dedicated renderer in `screens.jsx` and uses `.brenda-*` style ownership in `styles.css`.
  - 2026-04-27 boxes design-kit convergence pass: applied the new `/Downloads/Boxes` visual language to in-app dossier pages (tone-coded section admonition headers, receipt-style state feed, enrichment split into operational vs protected lanes, and tokenized panel styling) while keeping right-click delegation actions and markdown-native rendering. Scope remains Hugo + Brenda/Steve only. Cache-busts: `styles` 89→90, `screens` 91→92.

## Page: `box_graph`

- Entry Points: topbar `box graph` chip; direct route navigation via app history stack.
- Primary Screen Component: `BoxGraphScreen` in `screens.jsx`.
- Assets On Page:
  - Hero header with live graph counts (`nodes`, `edges`, `manifests`, `leaf boxes`)
  - Filter input over node label/id/kind/tier/path
  - Leaf-box toggle (`show leaf boxes`) so the view can switch between conceptual/ledger graph and full operational graph
  - Refresh chip re-fetching `/api/box_graph`
  - SVG graph with four authority lanes: constitutional, global ledgers, domain boxes, leaf boxes
  - Edge rendering for declared `subscribes`, `emits`, `authority`, `contains`, and `governs_shape` relationships
  - Selectable nodes with detail panel (path, primary source, owns/subscribes/emits counts, modes, connected routes)
  - Operational leaf nodes can jump to the Boxes page with `selectId`
- Asset Ownership:
  - Render: `screens.jsx` (`BoxGraphScreen`)
  - Router/nav: `app.jsx` (`KNOWN_SCREENS`, route switch), `components.jsx` (`SCREEN_LABELS`, topbar chip + `onOpenBoxGraph` prop)
  - API: `GET /api/box_graph` in `server.py`
  - Data sources: `LEDGERS/BOXES/*/box.json`, synthesized source/target ledger nodes from `subscribes[]`/`emits[]`, and existing operational boxes from `_boxes_catalog()` (`Auto/Client Boxes`, `Auto/Staff Boxes`)
  - Styles: `.box-graph-*` classes in `styles.css`
  - Side effects: read-only graph synthesis; no file writes from page interaction. Backend exposes declared routes today; Box Bus runtime remains Phase C.
- Change Checklist: `server.py`, `app.jsx`, `components.jsx`, `screens.jsx`, `styles.css`, `Secretary.html`, `page_asset_sitemap.md`, relevant ledgers if architecture semantics change.
- Last Verified: 2026-04-30
- History:
  - 2026-04-30 initial Box Graph route: added `/api/box_graph` backend synthesizer and `BoxGraphScreen` frontend. Endpoint reads `LEDGERS/BOXES/*/box.json`, creates concept nodes for Box Bus + Source of Truth, synthesizes ledger/external source nodes from `subscribes[]`, target ledger nodes from `emits[]`, and folds in current Client/Staff Boxes as leaf nodes under a domain node. Verified endpoint on local port 3429: 57 nodes, 81 edges, 5 manifests, 38 operational boxes, 0 manifest errors. Cache-busts: `styles.css` 92→93, `components.jsx` 73→74, `screens.jsx` 98→99, `app.jsx` 54→55.

## Page: `analytics`

- Entry Points: topbar `analytics` chip (between intake and automation, `bar-chart-2` icon).
- Primary Screen Component: `AnalyticsScreen` in `screens.jsx`; first panel `ConversationIntelligencePanel`. Helpers: `Sparkline`, `ChannelBars`.
- Assets On Page:
  - Header: ANALYTICS · CONVERSATION INTELLIGENCE eyebrow, h1 title, generated-at relative + window dates, refresh button.
  - 4-tile KPI grid: TOTALS (mint), DIRECTION (sky, in/out split), ACTIVE (peach), SILENT (blush). Design-deck tile: eyebrow + serif num + body + bar.
  - Daily Pulse: SVG sparkline across `timeseries[].total` with hover tooltips and date axis labels.
  - Channel Mix: horizontal bars per channel (8-tone palette), with count + share %.
  - Most Active Leads: top 5 rows with rank, name, count, last-touched relative, top channels.
  - Response Patterns: lavender card with median/mean hours + n_pairs.
  - Full Narrative: collapsible markdown render of the sibling .md file.
- Asset Ownership:
  - Render: `screens.jsx` (`AnalyticsScreen`, `ConversationIntelligencePanel`, `Sparkline`, `ChannelBars`, **`OwnerStagePanel`**, **`StageRow`**).
  - Routing: `app.jsx` `KNOWN_SCREENS` includes `"analytics"`; route handler renders `<AnalyticsScreen go={go} />`. Topbar prop: `onOpenAnalytics`.
  - Topbar: `components.jsx` Topbar accepts `onOpenAnalytics`; chip placed between `intake` and `automation` with `bar-chart-2` icon.
  - API: `/api/intelligence/conversation/latest` in `server.py` returns the newest `CCAgentindex/intelligence/sales/conversation/*.json` payload. Sibling `.md` is fetched directly via the static file server at `CCAgentindex/intelligence/sales/conversation/<slug>.md`. **`/api/analytics/owner_stage`** in `server.py` (`_owner_stage_latest` method) synthesizes JSON on every read from `CCAgentindex/intelligence/sales/owner_stage/<date>.md` + `<date>/by_owner/<slug>/dashboard.md` (the markdown output of `build_owner_stage_dashboards.py`). The pattern — server endpoint synthesizes JSON from build_*.py markdown — is the canonical integration path for the remaining 19 unintegrated build_*.py scripts (per `DEC-2026-04-30-001`).
  - Data: `mission_control_loader.js` loads latest run via `fLatestConversationIntelligence()`, exposes as `MissionControl.conversationIntelligence` (`{slug, payload, mtime}`); also fed into `ai_instructions.js` BEDROCK STRUCTURED TRUTH section so chat agent can answer comms-volume questions.
  - Source data: `Onboard Scripts/build_conversation_intelligence.py` (rewritten 2026-04-27 — 30-day rolling window aggregation over `CCAgentindex/people/*.json` with `kind:"lead"`).
  - Output: `CCAgentindex/intelligence/sales/conversation/YYYY-MM-DD.{md,json}` — paired files; the JSON is the Analytics page payload, the markdown is the human narrative.
  - Icons: `lucide.js` adds `bar-chart-2` (topbar chip) and `refresh-cw` (refresh button).
  - Styles: `.analytics-screen`, `.ci-panel`, `.ci-head`, `.ci-eyebrow`, `.ci-title`, `.ci-sub`, `.ci-refresh`, `.ci-kpis`, `.ci-tile`, `.ci-tile-{mint,sky,peach,blush}`, `.ci-tile-eyebrow`, `.ci-tile-num`, `.ci-num-{in,out,slash}`, `.ci-tile-body`, `.ci-tile-bar`, `.ci-section`, `.ci-section-head{,-toggle}`, `.ci-section-title`, `.ci-section-sub`, `.ci-empty`, `.ci-spark`, `.ci-spark-svg`, `.ci-spark-line`, `.ci-spark-fill`, `.ci-spark-dot`, `.ci-spark-labels`, `.ci-channels`, `.ci-chan{,-label,-track,-bar,-num,-share}`, `.ci-chan-{mint,sky,peach,lemon,sage,blush,lav}`, `.ci-leads`, `.ci-lead-{row,rank,name,count,meta,channels}`, `.ci-response{,-row,-stat,-num,-label}`, `.ci-narrative`. Tokens: 8-tone tile palette per design deck.
- Change Checklist: `screens.jsx`, `components.jsx` (Topbar prop + chip), `app.jsx` (KNOWN_SCREENS + route + Topbar wiring), `mission_control_loader.js`, `ai_instructions.js` (CI summary block), `server.py` (`/api/intelligence/conversation/latest`), `lucide.js` (icons), `styles.css` (`.ci-*`), `Secretary.html` cache-busts, `CCAgentindex/intelligence/MANIFEST.md` (script status), `Onboard Scripts/build_conversation_intelligence.py`.
- Last Verified: 2026-04-30
- History:
  - 2026-04-30 Owner & Stage Pipeline tab added (first build_*.py → AnalyticsScreen integration). New tab "Pipeline by Stage" inserted between Pipeline Funnel and Upcoming Events. New components in `screens.jsx`: `OwnerStagePanel` (4-tile snapshot row · featured-owner lavender card with KPIs · two-column layout with stage breakdown left and lead-level cards right · provenance footer). New helper component: `StageRow` (label + count + bar). New server endpoint: `GET /api/analytics/owner_stage` in `server.py` (`_owner_stage_dir` + `_owner_stage_latest` methods) that synthesizes JSON on every read by parsing the markdown output of `Onboard Scripts/build_owner_stage_dashboards.py` (top-level summary `<date>.md` for owner/stage overviews with kind annotations + per-owner `<date>/by_owner/<slug>/dashboard.md` for latest_activity, stage_breakdown, leads_detail). No JSON sidecar written to bedrock — markdown remains canonical, parsed on demand. Fallback: if summary file is missing, parser falls back to inner `<date>/owner_overview.md` (different `|`-separator format) and walks `<date>/by_stage/<pipeline>/<kind>__<stage>/` directories where kind is encoded as directory-name prefix. Lead-detail urgency rendered as colored badge (high → rose, medium → lemon, low → sage). First sweep: 28 leads · 1 owner (andre_raw) · 26 stages (12 active, 14 lead-only) · last activity 2026-04-25 detailed ballpark quote email. Decision rationale for the synthesizer pattern: `LEDGERS/DECISIONS_LEDGER.md` `DEC-2026-04-30-001` — establishes the reusable pattern for the remaining 19 unintegrated build_*.py scripts. Cache-bust: `screens.jsx` 96→97.
  - 2026-04-27 page restored as Conversation Intelligence flag-bearer. Script rewritten: paths rebased on `CCAgentindex/people` (not legacy `phone_call_transcript_library/`), 30-day rolling window with `--days` CLI override, dual `.md` + `.json` output. First sweep: 141 comms across 28 leads (31 in / 110 out, peak day 2026-04-23 with 29 comms, busiest channel sms, busiest lead Kesia De Assis Lira). Median response 0.82h across 21 inbound→outbound pairs <24h. AnalyticsScreen + ConversationIntelligencePanel + Sparkline + ChannelBars new in `screens.jsx`. New endpoint `/api/intelligence/conversation/latest` in `server.py`. New mission control loader fetcher `fLatestConversationIntelligence()`. Icons added: `bar-chart-2`, `refresh-cw`. Cache-busts: styles 77→78, lucide 8→9, components 60→61, screens 67→68, app 48→49, mission_control_loader 7→8, ai_instructions 10→11. Manifest row flipped to **operational**.
  - 2026-04-27 Source Channel Intelligence panel added as primary analytics view. Old `AnalyticsScreen` renamed to `ConversationIntelligenceTab` (still accessible as 4th tab). New `AnalyticsScreen` loads `CCAgentindex/analytics/source_channel_snapshot.json` (opportunity-based, generated by `analytics_source_channels.py`). Tabs: Source Channels (bar chart + donut + source table), Owner Performance (table + per-owner bar cards), Lead Profiles (filterable/sortable table, 30/page), Conversation Intel (existing CI panel). First sweep: 621 leads · 666 opps · 35 sources · 6 owners · top source Facebook Paid (295 leads, 4.4% win) · top win-rate ComeketoCatering.com (24.4%). Bedrock: `CCAgentindex/analytics/source_channel_snapshot.json` registered in `indexes/index.json` under key `"analytics"`. New helpers: `AnalyticsDonut`, `AnalyticsLeadTable`. Cache-bust: screens 68→69.
  - 2026-04-27 Upcoming Events Registry added. New script `Onboard Scripts/analytics_upcoming_events.py` fetches 4,569 opportunities across 365d lookback with 4 event custom fields (event_datetime, event_type, guest_count, venue_type). Filters to 180d lookahead window. First sweep: 409 upcoming events · 25,696 total guests · $737.8k booked · next event in 4 days. Monthly peak: June 2026 (102 events, $203k). Event type breakdown: 236 weddings, 27 graduations, 20 birthdays, 11 baby showers, 5 quinceañeras. AnalyticsScreen: stat strip expanded 5→6 tiles (added "Events booked" peach tile); tabs expanded 5→6 (added "Upcoming Events" between Pipeline and Leads); Events tab shows 4-tile header stats, dual-overlay monthly bar chart (volume + revenue), event type breakdown, monthly-grouped event timeline with date/type chip/guest count/venue/owner/value/status per row, urgent countdown for events ≤14 days out. All 3 snapshots loaded in parallel via Promise.all. Bedrock: `CCAgentindex/analytics/upcoming_events_snapshot.json` registered in `indexes/index.json`. Cache-bust: screens 70→71.
  - 2026-04-27 Seller Performance & Pipeline Funnel added. New script `Onboard Scripts/analytics_seller_performance.py` fetches 666 opportunities (extended fields: `date_won`, `value`, `pipeline_name`) and computes per-owner pipeline_value, avg_won_value, median_days_to_close, top_active_stages, plus global pipeline funnel by status_label. First sweep: 666 opps · 79 won · 273 active · pipeline $496.5k · won value $241.2k · median close 27.3d · 6 owners · 27 stages. AnalyticsScreen: stat strip expanded 4→5 tiles (added "Active pipeline" sky tile); tabs expanded 4→5 (added "Pipeline Funnel" between owners and leads); owners tab enriched with pipeline $, avg deal, median close, top stages when perf data available; new Pipeline Funnel tab shows global stats (4 tiles) + active-stages bar chart + won-stages bar chart. Both snapshots loaded in parallel with Promise.all; perf failure degrades gracefully. Bedrock: `CCAgentindex/analytics/seller_performance_snapshot.json` registered in `indexes/index.json` under `"analytics"`. Cache-bust: screens 69→70.
  - 2026-04-27 Analytics interactivity layer added. New components: `AnalyticsContextMenu` (dark floating menu, positioned at cursor, escape/outside-click dismissal, dividers, icon+label+sub rows) and `AnalyticsToast` (fixed bottom-right, auto-dismisses 2.4s, mint ✓ icon). New AnalyticsScreen state: `ctxMenu`, `spotlight`, `toastMsg`, `viewModes`. Helpers: `openCtx`, `closeCtx`, `showToast`, `copyText`, `spotlightToggle`, `spotDim`, `openInClose`, `setViewMode`, `ViewToggle` component. Right-click menus wired on: source chart bars (spotlight/copy/Close search/switch to table), source table rows (spotlight/copy/Close search), owner table rows (spotlight/copy/Close search/go to Win-Loss), win-loss event-type rows (spotlight/copy/Close search/go to Revenue), win-loss guest-bucket rows (spotlight/copy), stage-of-death rows (spotlight/copy/Close search), revenue monthly bars (copy/go to Events). View toggles: sources (Chart▬|Table≡), winloss (Rates↗|Counts#), revenue (Monthly▬|Cumulative∑). Spotlight badge: fixed top-right, lemon color, shows spotlighted segment name, dismiss X. Cumulative revenue mode: running total shown in lavender. Counts mode on Win/Loss: shows W/L absolute counts instead of %. Cache-bust: screens 74→75.
  - 2026-04-27 Revenue & Growth Intelligence added. New script `Onboard Scripts/analytics_revenue_trends.py` fetches 8,514 opportunities (730d / 24-month window) and computes: monthly won revenue trend (18-month chart), YoY comparison (revenue +3.3%, avg deal +5.1%, lead volume -17.9% — quality-over-quantity shift), deal size distribution histogram + percentiles (median $2.0k · P75 $4.1k · max $25.6k), revenue concentration Pareto (top 20% of deals = 52.4% of revenue), source revenue share (other/marketplace/website_direct/social_media top 4), event type revenue share (weddings dominate), peak booking months heatmap (March peak at $195.8k). AnalyticsScreen: stat strip expanded 7→8 tiles (added "YoY revenue" mint/rose growth tile); tabs expanded 7→8 (added "Revenue & Growth" between Win/Loss and Leads); Revenue tab shows YoY 4-tile comparison with growth badges, 18-month revenue bar chart, deal size histogram, Pareto concentration bars, source revenue bars, peak booking month heatmap, event type revenue bars, summary banner. GrowthBadge helper renders ↑/↓ arrow with color. Bedrock: `CCAgentindex/analytics/revenue_trends_snapshot.json` registered in `indexes/index.json` under `"analytics"`. Cache-bust: screens 73→74.
  - 2026-04-27 Win/Loss Conversion Intelligence added. New script `Onboard Scripts/analytics_win_loss.py` fetches 4,569 opportunities (365d window) and computes conversion rates across 10 dimensions: event type, guest bucket, value bucket, source family, source channel, customer type, owner, stage-of-death, owner×source, etype×source, and time patterns. First sweep: 553 won · 3437 lost · 12.1% overall win rate · won value $1.4M · lost pipeline $4.5M · median close 25.1d. Top performers: corporate (48.6% win) and phone_inbound (39.2%). Weddings lead volume at 19.6% win. Stage of death: 71.1% archive, 10.2% lost-customer. AnalyticsScreen: stat strip expanded 6→7 tiles (added "365d Win rate" lavender tile); tabs expanded 6→7 (added "Win / Loss" between Events and Leads); Win/Loss tab shows funnel overview (5 tiles), event-type win-rate bars, guest-bucket win-rate bars, stage-of-death waterfall, days-to-close histogram, won-events-by-month bars, owner win-rate bars, source-family win-rate bars, and summary banner. WinBar helper renders stacked won/active/lost segments. Bedrock: `CCAgentindex/analytics/win_loss_snapshot.json` registered in `indexes/index.json` under `"analytics"`. Cache-bust: screens 72→73.
  - 2026-04-27 Analytics styling overhaul + icon system migration. Removed all emojis site-wide (screens.jsx): analytics and venue enrich badge (`🔥 ENRICH NOW` → text). Added `AIcon` React component (inline SVG from `window.icon()` design-deck system) before `AnalyticsContextMenu` in screens.jsx. Updated `AnalyticsContextMenu` item icons and font (`var(--mono)` → `var(--sans)`, font-size 11→12px, icon span now uses AIcon). Updated `AnalyticsToast` font and replaced `✓` text with `<AIcon name="check">`. Replaced all emoji `icon:` values in context menu items and insight pushes with design-deck icon names (eye/write/link/chart/diff/cal/fire/warn/clock/sparkles/wave/bolt). Replaced inline `{isSpot && "🔦 "}` indicators with `<AIcon name="eye">`. Updated urgency tile definition and render to use AIcon. Fixed Intel Signals header `✦` → `<AIcon name="sparkles">`. Fixed cohort Top-5 header emoji → `<AIcon name="sparkles">`. Fixed spotlight badge emoji → `<AIcon name="eye">`. Fixed revenue insight to use `revIcon` instead of `dir` arrow as icon name. Font fix: added `"--mono": "var(--font-body)"` CSS custom property override at analytics outer wrapper div so all `var(--mono)` labels resolve to IBM Plex Sans (matching rest of site). New interactivity: added `onContextMenu` to all 8 stat strip tiles (copy value + go-to-tab actions); added `onContextMenu` to compact "All sources" list items (copy stats / search Close / spotlight). Cache-bust: screens 84→85.
  - 2026-04-27 Booking Lead Time + Cohort Analysis + Auto-Insights panel added. New scripts: `Onboard Scripts/analytics_booking_lead_time.py` (525 future bookings, median 51d, fixed EVENT_DT_F field ID to `cf_FV2xBkviv7BAQZkkjUf8NUOc3fOpPTObMy5lVxZbyiP`, weddings 168d median / corporate 4d, 38.3% last-minute) and `Onboard Scripts/analytics_cohort_analysis.py` (32 monthly cohorts, 4.9% avg 90d, 5.6% avg 1yr, expo_event 0% conversion on 484 leads, best cohort 2024-02 at 21.4% 90d). AnalyticsScreen: bookingLT + cohortData state + 7-fetch Promise.all; tab strip expanded 8→10 (added "Lead Time" and "Cohort Analysis"); Lead Time tab shows urgency segments 3-tile header, global stats row, histogram, event-type median bars, source-family bars, seasonal 4×3 month heatmap, summary banner; Cohort tab shows conversion curve 6-tile header, best cohorts panel, source cohort conversion table (90d/6mo/1yr columns colored by rate), full monthly heatmap matrix (32 rows × 6 windows), recent-cohort health cards, summary banner. Auto-Insights panel inserted above tabs: derives 6-8 bullet intel signals dynamically from all loaded JSON state (YoY trend, lead volume warning, top win-rate event type/source, stage-of-death hotspot, last-minute booking share, advance-booking type, best/worst-converting cohort source). Right-click copy on all new chart elements. Bedrock: `booking_lead_time_snapshot.json` + `cohort_snapshot.json` registered in `indexes/index.json`. Cache-bust: screens 75→76→77→78.

---

## Global Navigation And Shared Assets

- Entry point nav ownership:
  - `Topbar`, `BottomStrip`, route breadcrumbs: `components.jsx`.
  - Route switch and history stack: `app.jsx`.
- Shared overlays:
  - `FullscreenCell`, `TweaksPanel`, `EditWithRodbotOverlay`, `AIBanner`.
- Shared right-click primitive: `components.jsx` `useContextMenu` hook + `ContextMenu` component. Items: `[{ label, icon, onClick, danger, disabled, shortcut, divider, keepOpen }]`. Hook returns `{ onContextMenu, close, render, open }`. Currently wired on `grid` (CellContextMenu), all People pages (list rows + profile pane), `intake` (report/doc/Q&A cards), `delegations` (draft cards + run timeline rows), and `boxes` (box list + html demo list). Pattern is reusable on any future page — `useContextMenu()` + `onContextMenu={...}` + `menu.render(buildItemsFor(target), title)`.
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

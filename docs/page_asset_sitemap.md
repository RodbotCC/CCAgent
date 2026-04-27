# Comeketo Page-Asset Source Of Truth

Last updated: 2026-04-25 (deck unification + Pieces integration + chat upgrade pass)  
Owner: Comeketo app team  
Canonical source: this file is the operational truth for page/asset ownership.  
Policy hook: see `CLAUDE.md` § 5.5 ("Page-asset sitemap — the Done Gate").

## Done Gate (Mandatory)

Any task that changes a page, route behavior, or page data binding is not complete until this file is updated. Append to the relevant page section's `Asset Ownership`, `Change Checklist`, and `History` lines, and bump `Last Verified`. New pages get a fresh entry following the Mapping Template. Removed assets must be removed in the same change.

## Route Index (App Router Truth)

Source: `app.jsx` (`KNOWN_SCREENS` and route switch)

- `grid`
- `settings`
- `memory`
- `prediction`
- `commitments`
- `commitment_detail`
- `inbox`
- `inbox_detail`
- `leads`
- `clients`
- `coworkers`
- `contacts`
- `briefing`
- `delegations`
- `calendar`
- `Rodbot`
- `projects`
- `activity`
- `analytics`
- `automation`
- `tables`
- `table_new`
- `table_detail`
- `intake`
- `chat` (legacy route; redirected to `grid`)

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
  - **Live Pieces header** (rotating Pieces broadcast strip — replaces the static teaching strip)
  - **ChatRail** (right-hand rail with full file uploads, dropzone, animated thinking trace)
- Asset Ownership:
  - Grid cards + frame: render in `components.jsx` (`Grid`, `FrontPage`), routed in `app.jsx`.
  - Grid content data: `window.SECRETARY_DATA.grids`, `gridHistory` in localStorage (`secretary.gridHistory`), `window.SecretaryActions.generateGrid/refineCell/regenerateFromSweep/regenerateFromFrameReject`.
  - Mission Control generate path: `window.MissionControl`, `window.MissionControlStatus`.
  - Commit queue creation from cell: `app.jsx` commitment state and `window.SecretaryActions.draftCommitment`.
  - Retire/reject/recurring context actions: `components.jsx` `CellContextMenu` -> `/api/cells/retire`, `/api/cells/recurring`, `/api/cells/reject`.
  - **Live Pieces header**: `screens.jsx` `LivePiecesHeader` (exposed via `window.LivePiecesHeader`), wired into `components.jsx` `FrontPage` head row. Falls back to `TeachingStrip` (greeting/instruct/meta) when Pieces empty/offline. Polls `/api/pieces/sweeps/latest` + `/api/pieces/status` every 60s; cycles through deck every 7s. Helpers `_synthSummaryTitle` + `_buildPiecesHeadlinerDeck` synthesize titles + tone-codes each card.
  - **ChatRail** (uplifted Apr 2026): `components.jsx` `ChatRail` now owns its own attachment state, drag-and-drop, paste-image, and tone-coded preview tiles; calls `window.SecretaryChat.uploadFile` -> `/api/attachments/upload`. Animated busy state via `window.ThinkingTrace` (defined in `screens.jsx`). Preserves the unique `/regen|regenerate|new grid` intent parser that routes through `gridGenerate` instead of Claude.
  - Styles: `styles.css` grid classes (`grid-stage`, `cell`, `grid-head`, chips/buttons), plus `live-pieces-*` (header animation + tone stripe), `thinking-trace-*` (chat busy state), `chat-rail-*`.
  - Side effects: ledger/memory logs via `window.SecretaryLedger` and `window.SecretaryMemory`; cell retire endpoint writes server ledgers; ChatRail upload writes to `CCAgentindex/_inbox/attachments/<day>/`.
- Change Checklist:
  - `app.jsx`
  - `components.jsx` (FrontPage, ChatRail)
  - `screens.jsx` (LivePiecesHeader, ThinkingTrace, _normalizePieces)
  - `styles.css` (live-pieces, thinking-trace, chat-rail keyframes)
  - `chat.js` (CHAT.uploadFile, attachments pipeline, preprocess)
  - `server.py` (`/api/cells/*`, `/api/claude_code/generate`, `/api/grid_affinity` if behavior changed; `/api/pieces/sweeps/latest`, `/api/pieces/status` for the live header; `/api/attachments/upload` for ChatRail uploads; `/api/chat/preprocess` if prompt-enhance is on)
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 added LivePiecesHeader (slow rotating Pieces broadcast strip with tone stripe; 700ms fade-in, 7s cycle, 60s data refresh; falls back to TeachingStrip on offline). Wired into `FrontPage` head row.
  - 2026-04-25 ChatRail upgraded to feature parity with `ChatScreen`: attachment state, drag-and-drop dropzone, paste support, tone-coded preview tiles for image/PDF/CSV/JSON/MD/code/docx, expanded MIME allowlist (images, PDFs, JSON, JSONL, YAML, XML, CSV, TSV, MD, TXT, LOG, code, DOCX/XLSX/PPTX, ZIP/TAR), file picker button on the input row. Preserves `/regen` intent parser.
  - 2026-04-25 ThinkingTrace replaces the static "thinking…" pill in the rail busy slot.

## Page: `commitments`

- Entry Points: `Topbar` Today group -> Commitments; commit action from grid cell.
- Primary Screen Component: `CommitmentsScreen` in `screens.jsx`.
- Assets On Page:
  - Pending/sending/sent/failed grouped rows
  - Send all / Send / Cancel / Remove actions
  - Row drilldown -> commitment detail
- Asset Ownership:
  - Render: `screens.jsx` `CommitmentsScreen`.
  - Data: local state `commitments` in `app.jsx` persisted to localStorage `secretary.commitments`.
  - Dispatch: `app.jsx` `dispatchCommitment` -> `window.SecretaryConnectors.send`.
  - Styles: row cards, badge styles from inline + shared button classes in `styles.css`.
  - Side effects: connector dispatch, ledger writes (`commitment_created`, `commitment_sent`, `commitment_failed`), memory send logs.
- Change Checklist:
  - `app.jsx`
  - `screens.jsx`
  - `connectors.js`
  - `styles.css`
  - `server.py` (`/api/status`, downstream connector proxy behavior)
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `delegations`

- Entry Points: `Topbar` Work group -> Delegate; Inbox triage shortcut button.
- Primary Screen Component: `DelegationsScreen` in `screens.jsx`.
- Assets On Page:
  - Dispatch composer (label/prompt/mode)
  - Sweep inbox shortcut
  - Delegation timeline with status lights and expandable details
- Asset Ownership:
  - Render: `screens.jsx` `DelegationsScreen`.
  - Data: `window.SecretaryDelegator` store and polling.
  - API: GET/POST `/api/delegate`, GET `/api/delegate/<request_id>`.
  - Styles: delegation list card styles in `styles.css` plus inline status dot visuals.
  - Side effects: starts subprocess delegations and writes delegation artifacts/ledger server-side.
- Change Checklist:
  - `screens.jsx`
  - `delegator.js`
  - `server.py` (`/api/delegate*`)
  - `AGENT.md` and `CLAUDE.md` when delegation contract changes
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `tables`

- Entry Points: `Topbar` tables chip.
- Primary Screen Component: `TablesScreen` in `screens.jsx`.
- Assets On Page:
  - Sheet list
  - Saved chart tiles
  - Template picker modal
  - Links to `table_detail` and `table_new`
- Asset Ownership:
  - Render: `screens.jsx` `TablesScreen`, `TemplatePickerModal`.
  - API: `/api/tables/list`, `/api/charts/list`.
  - Styles: `tbl-*` classes in `styles.css`.
  - Side effects: template spawn path calls create flow that persists tables.
- Change Checklist:
  - `screens.jsx`
  - `styles.css`
  - `server.py` (`/api/tables/*`, `/api/charts/list`)
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `automation`

- Entry Points: `Topbar` automation chip.
- Primary Screen Component: `AutomationShell` in `automation.jsx`.
- Assets On Page:
  - Sub-tab strip (workflows/subagents/state/hooks/triggers)
  - Workflow graph (workflows)
  - Trigger composer/list (triggers)
  - Placeholder pages for subagents/state/hooks
- Asset Ownership:
  - Render: `automation.jsx` (`AutomationShell`, `AutomationGraphScreen`, `TriggersScreen`).
  - API (workflows/catalog): `/api/workflows/list`, `/api/workflows/save`, `/api/catalog/edges/list|get|save|delete|bump_usage`, `/api/annotations/upload`.
  - API (triggers): `/api/triggers/list|save|delete`.
  - Styles: automation/trigger classes in `styles.css`.
  - Side effects: writes workflow/trigger JSON and activity logs via server.
- Change Checklist:
  - `automation.jsx`
  - `styles.css`
  - `server.py` (workflows/catalog/triggers endpoints)
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `activity`

- Entry Points: `Topbar` Mind group -> Activity; Pieces ribbon jump links from Briefing; Live Pieces header "View all activity →" CTA from grid; Settings → Pieces "Open ↗" button.
- Primary Screen Component: `PiecesActivityScreen` in `screens.jsx`.
- Assets On Page:
  - Sweep archive list (left, 240px tile column with deck `state-shipped` Latest pill)
  - Ask Pieces ribbon (deck-prominent input + Ask + Sweep now)
  - Structured body — sage cards for summaries, sky/lav/lemon cards for events by source, peach chips for people in the loop
  - **Pieces toolkit panel** (right, 300px) — all 39 MCP tools grouped by category (Ask · Full-text search · Vector search · Snapshot), click-to-prefill-ask
  - **Pieces answer modal** — slides in over blurred backdrop on Ask success; copy-raw / copy-JSON / copy-Markdown / download-JSON / download-Markdown / close
- Asset Ownership:
  - Render: `screens.jsx` `PiecesActivityScreen`, `PiecesPayloadView`, `PiecesAnswerModal`, `PiecesStructuredCards`, `PiecesPrettyJSON`, `PiecesPlainAnswer`.
  - Helpers: `screens.jsx` `_normalizePieces` (parser; reused everywhere a Pieces payload renders), `parsePiecesEvent` (combined_string parser), `parsePiecesSummary` (TLDR extractor), `_piecesPayloadToMarkdown` (Markdown export), `EVENT_TONE` (source → deck tone), `PIECES_TOOLS` (39-tool catalog grouped by purpose), `getPiecesModel` (reads `tweaks.piecesModel` from localStorage).
  - API: `/api/pieces/status`, `/api/pieces/sweeps`, `/api/pieces/sweeps/latest`, POST `/api/pieces/sweep`, POST `/api/pieces/ask` (now accepts `chat_llm` to override default per Settings model picker).
  - Styles: `styles.css` activity/payload panels plus `deck-modal-backdrop` / `deck-modal-card` / `deck-modal-card-in/out` / `deck-modal-toast` / `deck-modal-card[data-state="closing"]` (modal animations), `card-tone card-{mint|sky|lav|lemon|peach|sage|rose|blush}` (tone cards), `dot-tone dot-*` (tone dots), `state-{observed|inferred|drafted|shipped|stale|blocked}` (state pills).
  - Side effects: fires Pieces sweep and ask calls; updates sweeps ledger server-side; sweep ledger now records `model` field (which gpt-/claude- model Pieces used).
- Change Checklist:
  - `screens.jsx` (PiecesActivityScreen + every Pieces helper component)
  - `styles.css` (deck modal animations, tone cards, state pills, deck-modal-toast)
  - `server.py` (`/api/pieces/*`, `_pieces_call_ask` accepts `chat_llm`, sweep record stores `model`)
  - `CLAUDE.md` (Pieces MCP integration appendix — the `claude mcp add` setup for delegations)
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 full deck-vocabulary redesign of body: structured cards (sage summaries, sky/lav/lemon events by source, peach people chips) replace the raw JSON dump. New helpers `_normalizePieces`, `parsePiecesEvent`, `parsePiecesSummary`. PiecesPayloadView is the shared renderer; falls back to PrettyJSON for unfamiliar shapes and PlainAnswer for LLM narrative replies.
  - 2026-04-25 added 39-tool Pieces toolkit panel (right column, click-to-prefill ask) + the embedded `claude mcp add` snippet so the demo audience sees the wire.
  - 2026-04-25 added PiecesAnswerModal: slides in over blurred backdrop on Ask success (380ms ease-out / 220ms ease-in close), copy/export footer (raw, JSON, Markdown via `_piecesPayloadToMarkdown`), ESC + backdrop dismiss, "view last answer" pill returns under the ask bar after dismiss.
  - 2026-04-25 ask + sweep calls now send `chat_llm` from `tweaks.piecesModel`, server-side `_pieces_call_ask` reads it; sweep ledger entries store the model used.
  - 2026-04-25 Pieces MCP integration documented in `CLAUDE.md` appendix (server-side `_pieces_rpc` + Claude Code subprocess `claude mcp add --transport http pieces ...` instructions).

---

## Page: `settings`

- Entry Points: topbar settings icon; grid fallback buttons.
- Primary Screen Component: `SettingsScreen` in `screens.jsx`.
- Assets On Page:
  - Theme/density/language toggles (Theme is now `paper` / `ink` — the deck cream + black-and-gold)
  - AI provider/key/model controls
  - Demo mode toggle
  - **Chat intelligence section**: "Pre-process prompts with gpt-5.4-mini" toggle (`tweaks.promptEnhance`) — when on, every chat send fires `/api/chat/preprocess` for prompt rewrite + thinking-trace generation
  - **Pieces · temporal continuity section**: model picker (`tweaks.piecesModel`) with options `claude-sonnet-4-5` / `gpt-4o · free` / `gpt-4.1 · free` / `claude-opus-4`; "Open Pieces Activity" jump button to Mind → Activity
- Asset Ownership:
  - Render: `screens.jsx` `SettingsScreen`, `IntelligencePanel`.
  - Data: `tweaks` state in `app.jsx` persisted to localStorage `secretary.tweaks`. New keys: `promptEnhance` (bool, default false), `piecesModel` (string, default `claude-sonnet-4-5`).
  - Integrations: `window.SecretaryAI`, `window.Comeketoi18n`.
  - Styles: settings classes in `styles.css`. Dark theme is now the deck "ink" mode (#0B0B0D background, #E8D9A8 cream text, #C9A24A gold accent) — full token override in `[data-theme="dark"]`.
  - Side effects: writes localStorage values; no direct destructive server write from toggles. `piecesModel` and `promptEnhance` are read at request time by `chat.js` and `screens.jsx` `getPiecesModel` (no React state plumbing).
- Change Checklist: `app.jsx` (TWEAK_DEFAULTS includes `piecesModel`, `promptEnhance`), `screens.jsx` (Settings sections + getPiecesModel helper), `chat.js` (reads both keys at send time), `ai.js`, `i18n.js`, `styles.css` (full dark-theme token rewrite).
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 added "Pieces · temporal continuity" section with 4-option model picker; `tweaks.piecesModel` cascades to all `/api/pieces/ask` and `/api/pieces/sweep` calls (and the Briefing ribbon, Activity screen, Rodbot grounding background queries).
  - 2026-04-25 added "Chat intelligence" section with `tweaks.promptEnhance` toggle. When on, chat.js fires `/api/chat/preprocess` (gpt-5.4-mini) in parallel with each send; the model rewrites the user's prompt for Claude AND emits a contextual thinking trace.
  - 2026-04-25 dark theme rewritten as full deck-gold mode: black canvas (#0B0B0D), warm cream Newsreader body (#E8D9A8), buttery gold italic accent (#C9A24A), deep brown hairlines (#2A2620). All 8 deck tones get dark variants; all 6 state pills retuned; pastel/event/data taxonomies retuned; modal backdrop deepens; whisper of gold edge on cards.

## Page: `memory`

- Entry Points: topbar Mind group -> Memory.
- Primary Screen Component: `MemoryScreen` in `screens.jsx`.
- Assets On Page:
  - Cluster/residue/frame/voice tabs
  - Memory export and clear actions
- Asset Ownership:
  - Render: `screens.jsx` `MemoryScreen`.
  - Data: `window.SecretaryMemory` store + seed fallback from `window.SECRETARY_DATA`.
  - Styles: memory panel classes in `styles.css`.
  - Side effects: export blob download; `window.SecretaryMemory.reset()` clear action.
- Change Checklist: `screens.jsx`, `memory.js` (if present), `styles.css`.
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `prediction`

- Entry Points: topbar Work group -> Prediction.
- Primary Screen Component: `PredictionScreen` in `screens.jsx`.
- Assets On Page:
  - KPI cards, accuracy bars, cluster eligibility rows.
- Asset Ownership:
  - Render: `screens.jsx` `PredictionScreen`.
  - Data: `window.SecretaryMemory.predictionStats` + cluster stats fallback.
  - Styles: prediction classes (`pred-grid`, `bars`, `auto-commit-row`) in `styles.css`.
  - Side effects: none beyond read-only visualization.
- Change Checklist: `screens.jsx`, `styles.css`, memory stats providers.
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `inbox`

- Entry Points: topbar Today group -> Inbox.
- Primary Screen Component: `InboxScreen` in `screens.jsx`.
- Assets On Page:
  - Inbox compose card
  - Sweep inbox now control and status card
  - Filter chips + entry list
- Asset Ownership:
  - Render: `screens.jsx` `InboxScreen`.
  - Data store: `window.SecretaryInbox` (reload/append/dismiss).
  - API: `/api/inbox`, `/api/inbox/append`, `/api/inbox/update`, `/api/agents/inbox_triage/run`, `/api/delegate/<id>`.
  - Styles: inbox layout classes + chips/buttons.
  - Side effects: append/update inbox JSONL; trigger inbox triage delegation.
- Change Checklist: `screens.jsx`, `inbox.js`, `delegator.js`, `server.py` (`/api/inbox*`, `/api/agents/*`, `/api/delegate/*`), `styles.css`.
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `inbox_detail`

- Entry Points: click item row in inbox list.
- Primary Screen Component: `InboxDetailScreen` in `screens.jsx`.
- Assets On Page:
  - Full entry detail card
  - Audit timeline
  - Action controls (dismiss/open related flows)
- Asset Ownership:
  - Render: `screens.jsx` `InboxDetailScreen`, shared `DetailLayout`, `AuditTimeline`.
  - Data: inbox entry from `window.SecretaryInbox`; timeline via `/api/ledger/activity`.
  - Styles: detail page classes in `styles.css`.
  - Side effects: can mutate entry status via inbox actions.
- Change Checklist: `screens.jsx`, `inbox.js`, `server.py` (`/api/ledger/activity`, `/api/inbox/update`), `styles.css`.
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `commitment_detail`

- Entry Points: click commitment row from commitments list.
- Primary Screen Component: `CommitmentDetailScreen` in `screens.jsx`.
- Assets On Page:
  - Draft body/editor
  - Status/channel metadata strip
  - Audit timeline and related actions
- Asset Ownership:
  - Render: `screens.jsx` `CommitmentDetailScreen` with shared detail components.
  - Data: commitment from `app.jsx` commitment state; audit via `/api/ledger/activity`.
  - Styles: detail classes in `styles.css`.
  - Side effects: send/cancel/remove/update commitment flows.
- Change Checklist: `app.jsx`, `screens.jsx`, `connectors.js`, `server.py` (ledger endpoints), `styles.css`.
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `leads`

- Entry Points: topbar People group -> Leads.
- Primary Screen Component: `PeopleScreen` with `kind="lead"` in `screens.jsx`.
- Assets On Page:
  - Searchable list pane
  - Person profile pane
  - Context menu actions (copy/reclassify/update)
- Asset Ownership:
  - Render: `screens.jsx` `PeopleScreen`, `PersonProfile`.
  - Data: `window.MissionControl.people` and `missioncontrol:loaded` events.
  - Side effects: action buttons send prompts into chat (`window.SecretaryChat`) for Rodbot-assisted updates.
  - Styles: `people-*` classes in `styles.css`.
- Change Checklist: `app.jsx`, `screens.jsx`, `mission_control_loader.js`, `styles.css`.
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `clients`

- Entry Points: topbar People group -> Clients.
- Primary Screen Component: `PeopleScreen` with `kind="client"`.
- Assets On Page: same as `leads`, filtered by kind.
- Asset Ownership: same code paths as `leads`; filter discriminator `(p.kind || "coworker") === "client"`.
- Change Checklist: `screens.jsx`, `app.jsx`, mission control payload producers.
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `coworkers`

- Entry Points: topbar People group -> Coworkers.
- Primary Screen Component: `PeopleScreen` with `kind="coworker"`.
- Assets On Page: same as `leads`, default-kind bucket.
- Asset Ownership: same code paths as `leads`; default fallback sends missing `kind` to coworker.
- Change Checklist: `screens.jsx`, mission control people schema producers.
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `contacts`

- Entry Points: topbar People group -> Contacts.
- Primary Screen Component: `PeopleScreen` with `kind="contact"` (via route or `ContactsScreen` shim).
- Assets On Page: same as `leads`.
- Asset Ownership: same People stack; `ContactsScreen` compatibility shim.
- Change Checklist: `app.jsx`, `screens.jsx`, `styles.css`.
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `briefing`

- Entry Points: topbar context strip -> Briefing.
- Primary Screen Component: `DailyBriefingScreen` in `screens.jsx`.
- Assets On Page:
  - **Pieces briefing ribbon** (sage card at top — "What you've actually been doing", latest TLDR + people chips + counts + "View all activity →" jump)
  - Briefing archive list
  - Markdown rendered selected briefing body
- Asset Ownership:
  - Render: `screens.jsx` `DailyBriefingScreen`, `PiecesBriefingRibbon`. The ribbon mounts above the archive grid.
  - PiecesBriefingRibbon data: fetches `/api/pieces/sweeps/latest` + `/api/pieces/status` on mount; uses `_normalizePieces` from the activity module to parse, then renders TLDR + people chips + summary/event/people counts. Falls back to `admo-rose` ("Pieces is offline") or `admo-lemon` ("listening for first sweep") states.
  - API: `/api/briefings`, `/api/briefings/<slug>`, `/api/pieces/status`, `/api/pieces/sweeps/latest`.
  - Styles: briefing/ribbon card styles in `styles.css`; ribbon uses `card-tone card-sage` + deck typography helpers (`h-display`, `eyebrow`).
  - Side effects: read-only; refresh button triggers list reload; ribbon "View all activity" navigates `go.push("activity")`.
- Change Checklist: `screens.jsx` (DailyBriefingScreen + PiecesBriefingRibbon), `server.py` (`/api/briefings*`, `/api/pieces/*`), `styles.css`.
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 added PiecesBriefingRibbon at top of the briefing screen (sage tone card, latest sweep TLDR + people chips + counts, "View all activity →" jump button, collapsible). Graceful offline/empty states.

## Page: `calendar`

- Entry Points: topbar Today group -> Calendar.
- Primary Screen Component: `CalendarScreen` in `screens.jsx`.
- Assets On Page:
  - Month heatmap grid
  - Streak KPI cards
  - Day detail timeline
- Asset Ownership:
  - Render: `screens.jsx` `CalendarScreen`.
  - Data: `window.SecretaryLedger.read()` from activity ledger.
  - API side writes: POST `/api/accomplishments/<day>`, POST `/api/streak`.
  - Styles: `cal-*` classes in `styles.css`.
  - Side effects: stores accomplishment/streak snapshots server-side.
- Change Checklist: `screens.jsx`, `ledger.js`, `server.py` (`/api/ledger/activity`, `/api/accomplishments/*`, `/api/streak`), `styles.css`.
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `Rodbot`

- Entry Points: topbar Mind group -> Rodbot.
- Primary Screen Component: `RodbotScreen` in `screens.jsx`.
- Assets On Page:
  - Tabs: Memory / Reflections / Identity
  - Refresh and pause/resume controls
  - Reflection cards and audit rows
- Asset Ownership:
  - Render: `screens.jsx` `RodbotScreen`.
  - Data: `window.Rodbot` store (`memory`, `reflections`, `identity`, `snapshot`).
  - API (through rodbot client): `/api/rodbot/memory`, `/api/rodbot/reflections`, `/api/rodbot/identity`, `/api/rodbot/reflect`, `/api/rodbot/character`, `/api/rodbot/traits`.
  - Styles: rodbot card and table classes in `styles.css`.
  - Side effects: toggle enabled/pause state and reflection calls.
- Change Checklist: `screens.jsx`, `rodbot.js`, `server.py` (`/api/rodbot/*`), `styles.css`.
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `projects`

- Entry Points: topbar Work group -> Projects.
- Primary Screen Component: `ProjectsScreen` in `screens.jsx`.
- Assets On Page:
  - Project list rail
  - Project detail board (phases/deliverables/tasks)
  - Task toggle actions and optional phase-builder actions
- Asset Ownership:
  - Render: `screens.jsx` `ProjectsScreen`.
  - API: `/api/projects`, `/api/projects/<id>`, PATCH `/api/projects/<id>/task/<task_id>`, plus project write endpoints used in screen actions.
  - Styles: project-specific classes in `styles.css`.
  - Side effects: task completion/reopen writes server-side and logs ledger events (`task_completed`, `task_reopened`).
- Change Checklist: `screens.jsx`, `app.jsx` open-task badge loader, `server.py` (`/api/projects*`), `styles.css`.
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `analytics`

- Entry Points: topbar analytics chip.
- Primary Screen Component: `AnalyticsScreen` in `analytics.jsx`.
- Assets On Page:
  - Tabbed dashboards (overview, tasting conversion, lead sources, revenue timeline, venue partners)
  - KPI cards and chart surfaces
  - Filter chips and controls reflected in URL state
- Asset Ownership:
  - Render: `analytics.jsx` with panel subcomponents.
  - API: `/api/analytics/<tab>`.
  - Navigation side-link to dataset builder: `go.push("table_new", { context: "analytics" })`.
  - Styles: analytics chart surface/components in `styles.css`.
  - Side effects: URL query state mutations (`history.replaceState`); no write API.
- Change Checklist: `analytics.jsx`, `styles.css`, `server.py` (`/api/analytics/*`), chart helper modules.
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `table_new`

- Entry Points: tables footer action, template picker, analytics dataset shortcut.
- Primary Screen Component: `TableCreateScreen` in `screens.jsx`.
- Assets On Page:
  - Name/slug fields
  - Schema builder grid
  - Extraction text area and review rows
  - Save action
- Asset Ownership:
  - Render: `screens.jsx` `TableCreateScreen`.
  - Data: local schema/extraction state, AI extraction via `window.SecretaryAI.respond`.
  - API: POST `/api/tables/save` on save.
  - Styles: table-create/import styles in `styles.css`.
  - Side effects: persists new table JSON and metadata.
- Change Checklist: `screens.jsx`, `styles.css`, `server.py` (`/api/tables/save`), AI extraction prompt/helpers.
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `table_detail`

- Entry Points: tables list row, chart tile links, post-create redirect.
- Primary Screen Component: `TableDetailScreen` in `screens.jsx`.
- Assets On Page:
  - Editable spreadsheet grid
  - Autosave indicator
  - Chart gallery and chart builder modal
  - Import panel and export/delete controls
- Asset Ownership:
  - Render: `screens.jsx` `TableDetailScreen`, `SpreadsheetGrid`, chart components.
  - API: GET `/api/tables/get`, POST `/api/tables/save`, `/api/tables/delete`, `/api/charts/list?table=`, `/api/charts/save`, `/api/charts/delete`.
  - Styles: spreadsheet and chart gallery classes in `styles.css`.
  - Side effects: debounced autosave writes; chart CRUD; table delete.
- Change Checklist: `screens.jsx`, `styles.css`, `server.py` (`/api/tables/*`, `/api/charts/*`), export helpers.
- Last Verified: 2026-04-25
- History: 2026-04-25 initial mapping.

## Page: `intake`

- Entry Points: topbar intake chip.
- Primary Screen Component: `IntakeScreen` in `screens.jsx` (`IntakeReportsList`/`IntakeReportDetail`).
- Sub-components: `IntakeDocumentCard` (per-document expandable card), `IntakeThinkingTrace` (animated gpt-5.4-mini trace), shared `Markdown` (from `components.jsx`) for rendering Rodbot's answers as GFM.
- Assets On Page:
  - Reports list with inline create form
  - Report detail dropzone and document cards
  - Report Q&A panel with markdown-rendered answers and animated thinking trace
- Asset Ownership:
  - Render: `screens.jsx` intake components.
  - API:
    - list/create/delete/get reports: `/api/reports/list|create|delete|get`
    - ingest flow: `/api/attachments/upload`, `/api/reports/<slug>/ingest`
    - ask flow: `/api/chat/preprocess` (gpt-5.4-mini rewrite + thinking trace) → `/api/reports/<slug>/ask` (Claude grounded in docs)
    - document delete: `/api/reports/<slug>/documents/<id>/delete`
  - Styles: `ix-*` classes in `styles.css` (incl. `ix-trace-*` for the thinking trace and `ix-qa-a .md *` for markdown answer styling).
  - Markdown rendering: `Markdown` component in `components.jsx` (uses `marked` + `DOMPurify` from CDN, preloaded in `Secretary.html`).
  - Side effects: report/document persistence; Q&A history persists `question`, `enhanced_prompt`, `thinking_trace`, `answer`, `route`, `doc_count`.
- Change Checklist: `screens.jsx`, `chat.js` attachment helpers (if shared), `server.py` (`/api/reports/*`, `/api/attachments/upload`, `/api/chat/preprocess`), `styles.css`, `components.jsx` (only if shared `Markdown` changes).
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 added gpt-5.4-mini preprocessor pipeline (rewrites question + emits animated thinking trace) and markdown-rendered answers via shared `Markdown` component.

## Page: `chat` (legacy redirect)

- Entry Points: stale deep-link only — but `screens.jsx` `ChatScreen` is still in the bundle and kept warm as the natural "expand chat to full screen" target if/when a CTA is added.
- Primary Screen Component: route branch in `app.jsx` now redirects to `grid`. Active chat UI is the **homepage `ChatRail`** (in `components.jsx`); the standalone `ChatScreen` (in `screens.jsx`) carries the same engine + a few extras (per-turn save-to-inbox, delegate-to-Claude-Code, multi-chat archive list).
- Assets On Page (engine — used by both ChatRail and ChatScreen):
  - Multi-turn message history with attachments
  - File uploads (images, PDF, JSON, JSONL, YAML, XML, CSV, TSV, MD, TXT, LOG, code, DOCX/XLSX/PPTX, ZIP/TAR — 25MB max per file)
  - Drag-and-drop dropzone, paste-image
  - **Animated ThinkingTrace** (replaces the old "thinking…" pill) — falls back to a 5-step generic deck when prompt-enhance is off
  - **gpt-5.4-mini preprocess** (when `tweaks.promptEnhance` is on) — rewrites the user's prompt for Claude AND emits a contextual thinking trace
  - **Pieces grounding footer** (per assistant turn, in ChatScreen) — fires a parallel `/api/pieces/ask` per send; injects `from your activity` sage pull quote inline
- Asset Ownership:
  - Redirect logic: `app.jsx` route handler for `chat`.
  - Chat engine/data: `chat.js` (`SecretaryChat.send`, `appendTurn`, `uploadFile`, `newChat`, `archive`, etc.). State stored client-side in localStorage `secretary.chats.*` and synced to the chat ledger.
  - Endpoints: `/api/chat/send` (per-provider routing, accepts messages + system + provider + model + timeout), `/api/chat/preprocess` (gpt-5.4-mini rewrite + trace; called when `tweaks.promptEnhance` is on), `/api/attachments/upload` (any-MIME upload, 25MB cap, writes to `CCAgentindex/_inbox/attachments/<day>/`), `/api/ledger/chat_reflections/append`, `/api/pieces/ask` (per-send grounding query, with `chat_llm` from `tweaks.piecesModel`).
  - ThinkingTrace: `screens.jsx` `ThinkingTrace` (exposed via `window.ThinkingTrace`); listens for `comeketoagent:thinking-trace` window event broadcast by `chat.js`; ticks every 1.6s; loops the last 3 steps if Claude hangs longer than the trace.
  - Pieces grounding: `chat.js` `send()` fires `/api/pieces/ask` in parallel with the user-bubble append (12s timeout cap), folds the result into the assistant turn metadata as `grounding`, broadcasts via the same trace event channel; `screens.jsx` `PiecesGroundingFooter` renders it inline below ChatScreen replies.
  - Tone-coded attachment tiles: shared logic in both ChatScreen (64px) and ChatRail (48px) with the same 8-tone deck mapping (PDF rose, CSV/XLSX mint, JSON/YAML lavender, MD/TXT peach, code lemon, DOCX sky).
- Change Checklist: `app.jsx`, `screens.jsx` (ChatScreen + ThinkingTrace + PiecesGroundingFooter), `components.jsx` (ChatRail — homepage chat rail with full upload polish), `chat.js` (preprocess + grounding pipeline), `server.py` (`/api/chat/send`, `/api/chat/preprocess`, `/api/attachments/upload`, `/api/pieces/ask`), `styles.css` (`thinking-trace-*` keyframes + scrolltype tile styles).
- Last Verified: 2026-04-25
- History:
  - 2026-04-25 initial mapping.
  - 2026-04-25 ChatScreen redesign: deck-vocabulary attachment tiles (tone-coded by file type), expanded MIME allowlist (images + PDF + CSV + JSON + text + code + DOCX/XLSX/ZIP + more), polished dropzone overlay with deck typography + format list, paste-image support already present.
  - 2026-04-25 added gpt-5.4-mini `/api/chat/preprocess` server endpoint. Returns `{enhanced_prompt, thinking_trace[]}`. Wired into `chat.js` send() so when `tweaks.promptEnhance` is on the LAST user message gets swapped for the enhanced version (Claude gets the better prompt; user sees their original in the chat).
  - 2026-04-25 ThinkingTrace component: animated busy state, listens for trace broadcasts on `comeketoagent:thinking-trace` window event, ticks 1.6s/step with checkmarks + spinner on the active step, loops last 3 if Claude hangs. Replaces both ChatScreen's and ChatRail's static "thinking" indicators.
  - 2026-04-25 Rodbot Pieces grounding: every chat send fires `/api/pieces/ask` in parallel; result folds into assistant turn as `grounding`; PiecesGroundingFooter renders sage "from your activity" pull quote inline below each reply (ChatScreen).
  - 2026-04-25 ChatRail (homepage chat) brought to feature parity: same expanded uploads, same dropzone, same tile palette, same ThinkingTrace, same preprocess + grounding wiring. Preserves its unique `/regen|regenerate|new grid` intent parser that routes through `gridGenerate` instead of Claude.
  - 2026-04-25 ChatRail composer fix: `.chat-rail-input` grid expanded from `1fr auto` (2-col) to `auto 1fr auto` (3-col) so the new `+` attach button + textarea + send all fit on a single row. The `+` button sits flush-bottom with the textarea (32px circle, `alignSelf:end`, `marginBottom:6`). Removed "Drop your file here" overlay from both ChatRail and ChatScreen — silent drop is the new behavior; the parent's dashed-border outline + soft ink wash is the only drag feedback. Functionality unchanged; visual noise gone.
  - 2026-04-25 ThinkingTrace pacing fix: per-step interval bumped from 1.6s → 5s (3× slower). Removed the cycle-back behavior (was looping `length - 3` after exhaustion, which read as fake/janky). When the trace finishes, the interval clears itself and the spinner on the last step IS the motion — no false rewind.

---

## Global Navigation And Shared Assets

- Entry point nav ownership:
  - `Topbar`, `BottomStrip`, route breadcrumbs: `components.jsx`.
  - Route switch and history stack: `app.jsx`.
- Shared overlays:
  - `FullscreenCell`, `TweaksPanel`, `EditWithRodbotOverlay`, `AIBanner`.
  - **Modal layer**: `deck-modal-backdrop` + `deck-modal-card` (used by `PiecesAnswerModal`; pattern is reusable for any future modal). Animations: `deck-modal-backdrop-in/out` (240/220ms), `deck-modal-card-in/out` (380/220ms cubic-bezier(.2,.7,.2,1)). Toast: `deck-modal-toast`.
- Shared Pieces components (defined in `screens.jsx`, exposed on `window` so any file can render them):
  - `window.LivePiecesHeader` — used on `grid` (homepage broadcast strip)
  - `window.ThinkingTrace` — used on `chat` (both ChatScreen and ChatRail busy slots)
  - `PiecesPayloadView` / `PiecesAnswerModal` / `PiecesGroundingFooter` / `PiecesBriefingRibbon` / `PiecesStructuredCards` / `PiecesPrettyJSON` / `PiecesPlainAnswer` — single shared renderer family for any Pieces payload, anywhere.
  - Helpers: `_normalizePieces`, `parsePiecesEvent`, `parsePiecesSummary`, `_synthSummaryTitle`, `_buildPiecesHeadlinerDeck`, `_piecesPayloadToMarkdown`, `EVENT_TONE`, `PIECES_TOOLS`, `getPiecesModel`.
- Global data/state stores to account for on any page change:
  - localStorage keys: `secretary.tweaks` (now includes `piecesModel`, `promptEnhance`), `secretary.gridHistory`, `secretary.gridOverrides`, `secretary.commitments`, `secretary.history.v2`, `secretary.refineStack`.
  - window stores/services: `SecretaryAI`, `SecretaryActions`, `SecretaryMemory`, `SecretaryLedger`, `SecretaryInbox`, `SecretaryDelegator`, `SecretaryConnectors`, `Rodbot`, `MissionControl`.
  - Window events (cross-file pub/sub): `comeketoagent:language` (i18n flip), `comeketoagent:thinking-trace` (chat preprocess broadcasts thinking trace + model), `missioncontrol:loaded`, `missioncontrol:error`.

## Design System (Apr 2026 deck unification)

- Token source of truth: `styles.css` `:root` block + `[data-theme="dark"]` override.
- Foundational tokens: `--paper`, `--paper-2/3`, `--paper-card`, `--paper-card-2`, `--ink`, `--ink-2..5`, `--rule`, `--rule-2`, `--ember` (primary action), `--alarm`, `--leaf`, plus the `--pastel-*` family.
- Deck-native aliases (mirror `/Comeketo Agent/tokens.css` exactly): `--mint-{bg,ink,dot}` / `--peach-*` / `--lav-*` / `--sky-*` / `--lemon-*` / `--rose-*` / `--sage-*` / `--blush-*` (8 tones); `--st-{observed,inferred,drafted,shipped,stale,blocked}-{bg,ink}` (6 states); `--serif/--sans/--mono`; type scale `--t-xs..6xl`; spacing `--s-1..11`; radii `--r-{1,2,3,4,card}`; hairlines `--hairline`, `--hairline-2`.
- Shared component classes: `.h-display`, `.h-section`, `.h-card`, `.lede`, `.eyebrow`, `.wordmark`, `.chip-{tone}`, `.card-tone card-{tone}`, `.admo-{tone}`, `.state-{lifecycle}`, `.tile`, `.btn-ink/-paper/-ghost/-tab`, `.stat`, `.stat-md`, `.dot-tone dot-{tone}`, `.dotgrid`.
- Two themes:
  - `paper` (default): warm cream canvas (#EEECE6), near-neutral charcoal ink (#16161A), warm hairlines.
  - `ink` (dark): deck gold mode — pure black canvas (#0B0B0D), warm cream Newsreader body (#E8D9A8), buttery gold italic accent (#C9A24A), deep brown hairlines (#2A2620). All 8 tones + 6 states have dark variants. Whisper of gold in modal card edges.
- Type stack:
  - `--font-display` → Newsreader (Source Serif / Lora / Fraunces fallbacks)
  - `--font-body` → IBM Plex Sans (Inter fallback)
  - `--font-mono` → IBM Plex Sans (preserves the established no-typewriter aesthetic on chips, kickers, crumbs)
  - `--font-code` (and deck `--mono` alias) → JetBrains Mono (real monospace for code blocks + hex literals)
- Cache-buster discipline: bump `styles.css?v=N` in `Secretary.html` after any token/theme/animation edit so browsers refetch.

## Verification Checklist (Use Every Page Edit)

- Route still exists in `app.jsx` and maps to expected component.
- Page section in this file updated with any asset/component/API changes.
- Any new endpoint/path is reflected under asset ownership.
- Any removed asset is removed from this file in same change.
- Run-through done for affected page entry point from `Topbar` or in-page navigation.


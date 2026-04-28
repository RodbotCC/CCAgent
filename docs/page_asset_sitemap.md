# Comeketo Page-Asset Source Of Truth

Last updated: 2026-04-27 (boxes + delegations + automation + preprocess-model alignment)  
Owner: Comeketo app team  
Canonical source: this file is the operational truth for page/asset ownership.  
Policy hook: see `CLAUDE.md` Section 5.5 ("Page-asset sitemap — the Done Gate").

## Done Gate (Mandatory)

Any task that changes a page, route behavior, or page data binding is not complete until this file is updated.  
Append to the relevant page section's Asset Ownership, Change Checklist, and History lines, and bump Last Verified.  
New pages get a fresh entry. Removed assets must be removed in the same change.

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

---

## Page: `grid`

- Entry Points: app home, topbar brand/home button.
- Primary Screen Component: `FrontPage` in `components.jsx` (routed in `app.jsx`).
- Assets On Page:
  - Grid cards + fullscreen cell
  - Ideas tray from daily briefing
  - Chat rail with upload + thinking trace
  - Quick controls for generate/sweep/back generation
- Asset Ownership:
  - Render: `components.jsx` (`FrontPage`, `Grid`, `FullscreenCell`, `ChatRail`, `IdeasTray`)
  - Data: `window.SECRETARY_DATA.grids`, `localStorage` (`secretary.gridHistory`, `secretary.gridOverrides`)
  - API: `/api/cells/retire`, `/api/cells/recurring`, `/api/cells/reject`, `/api/attachments/upload`
  - Side effects: grid generation/refinement writes, ledger writes, inbox quick-capture writes
- Change Checklist: `app.jsx`, `components.jsx`, `chat.js`, `styles.css`, `server.py`
- Last Verified: 2026-04-27
- History:
  - 2026-04-25 deckified front-page/chat rail pass
  - 2026-04-25 ideas-tray simplification and briefing-driven cues

## Page: `settings`

- Entry Points: topbar settings icon.
- Primary Screen Component: `SettingsScreen` in `screens.jsx`.
- Assets On Page:
  - Theme + model + prompt-enhance controls
  - Pieces model picker
  - MCP/delegation target status panel
  - Credential editor for external keys (masked save/clear)
- Asset Ownership:
  - Render: `screens.jsx` (`SettingsScreen`, `IntelligencePanel`)
  - Data: `tweaks` in `app.jsx` persisted to `secretary.tweaks`
  - API: `/api/status`, `/api/settings/mcp_credentials`, `/api/settings/mcp_credentials/save`
  - Side effects: localStorage writes + `.env` save/clear via server allowlist
- Change Checklist: `screens.jsx`, `app.jsx`, `server.py`, `styles.css`
- Last Verified: 2026-04-27
- History:
  - 2026-04-27 MCP control layer + credentials section
  - 2026-04-27 preprocess model now follows selected settings model

## Page: `leads` / `clients` / `coworkers` / `contacts`

- Entry Points: topbar People dropdown.
- Primary Screen Component: `PeopleScreen` in `screens.jsx` with `kind` filter.
- Assets On Page:
  - List pane + profile pane
  - Context menu actions (copy fields, reclassify, send prompts to chat)
- Asset Ownership:
  - Render: `screens.jsx` (`PeopleScreen`, `PersonProfile`)
  - Data: `window.MissionControl.people`
  - Side effects: send-to-chat actions for updates/reclassification prompts
- Change Checklist: `screens.jsx`, `components.jsx`, `mission_control_loader.js`, `styles.css`
- Last Verified: 2026-04-27
- History:
  - 2026-04-25 kind-taxonomy migration and context-menu pass

## Page: `venues`

- Entry Points: topbar People dropdown (`venues`).
- Primary Screen Component: `VenuesScreen` in `screens.jsx`.
- Assets On Page:
  - Tier-sorted venue list
  - Venue profile and deal stats
  - Close account links/metadata
- Asset Ownership:
  - Render: `screens.jsx` (`VenuesScreen`, `VenueProfile`)
  - Data: `window.MissionControl.venues`
  - Bedrock source: `CCAgentindex/venues/*.json`
- Change Checklist: `screens.jsx`, `app.jsx`, `components.jsx`, `mission_control_loader.js`, `styles.css`
- Last Verified: 2026-04-27
- History:
  - 2026-04-27 new Venues page + data pipeline wiring

## Page: `briefing`

- Entry Points: topbar briefing chip.
- Primary Screen Component: `DailyBriefingScreen` in `screens.jsx`.
- Assets On Page:
  - Briefing list + markdown body
  - Pieces briefing ribbon
- Asset Ownership:
  - API: `/api/briefings`, `/api/briefings/<slug>`, `/api/pieces/status`, `/api/pieces/sweeps/latest`
  - Render/Styles: `screens.jsx`, `styles.css`
- Change Checklist: `screens.jsx`, `server.py`, `styles.css`
- Last Verified: 2026-04-27
- History:
  - 2026-04-25 Pieces ribbon integration

## Page: `activity`

- Entry Points: topbar activity chip, briefing jump links.
- Primary Screen Component: `PiecesActivityScreen` in `screens.jsx`.
- Assets On Page:
  - Sweep archive + ask panel
  - Structured payload renderer + modal
  - Pieces tools catalog
- Asset Ownership:
  - API: `/api/pieces/status`, `/api/pieces/sweeps`, `/api/pieces/sweeps/latest`, `/api/pieces/sweep`, `/api/pieces/ask`
  - Render: `screens.jsx` Pieces components and parser helpers
- Change Checklist: `screens.jsx`, `server.py`, `styles.css`
- Last Verified: 2026-04-27
- History:
  - 2026-04-25 structured cards + answer modal + tools panel

## Page: `automation`

- Entry Points: topbar automation chip.
- Primary Screen Component: `AutomationShell` in `automation.jsx`.
- Assets On Page:
  - Tabs: workflows / subagents / state / hooks / triggers
  - Workflow graph authoring (new/save/save-as/load)
  - Rodbot graph assistant rail
  - Trigger and hook/state operational views
- Asset Ownership:
  - Render: `automation.jsx` (shell, graph, planner, hooks, state, triggers)
  - API:
    - Workflows: `/api/workflows/list`, `/api/workflows/save`, `/api/workflows/get`
    - Triggers: `/api/triggers/list|save|delete`
    - Catalog: `/api/catalog/edges/list|get|save|delete|bump_usage`
    - Agent plans/hooks/state snapshots: `server.py` automation endpoints
  - Side effects: workflow/trigger/plan/hook-state persistence + activity ledger events
- Change Checklist: `automation.jsx`, `server.py`, `styles.css`, `Secretary.html` (cache-bust)
- Last Verified: 2026-04-27
- History:
  - 2026-04-27 authoring recovery: New + Save As New + stricter fast-path parsing
  - 2026-04-27 Rodbot op expansion: `update_node`, `update_connection`, `delete_connection`
  - 2026-04-27 multi-op batch apply fix (`onApplyOps`) to prevent one-op-only bug
  - 2026-04-27 workflow header wrap + rail style polish using design kit

## Page: `intake`

- Entry Points: topbar intake chip.
- Primary Screen Component: `IntakeScreen` in `screens.jsx`.
- Assets On Page:
  - Reports list/create/delete
  - Multi-file drop + per-doc cards
  - Q&A panel with markdown answers + thinking trace
  - Right-click menus (report/doc/qa actions)
- Asset Ownership:
  - API:
    - Reports: `/api/reports/list|create|delete|get`
    - Ingest: `/api/attachments/upload`, `/api/reports/<slug>/ingest`
    - Ask: `/api/chat/preprocess`, `/api/reports/<slug>/ask`
    - Doc delete: `/api/reports/<slug>/documents/<id>/delete`
  - Side effects: report/document writes + Q&A history persistence
- Change Checklist: `screens.jsx`, `chat.js`, `server.py`, `styles.css`
- Last Verified: 2026-04-27
- History:
  - 2026-04-27 ingest hardening: sequential multi-file queue + format expansion + OCR
  - 2026-04-27 context-menu pass + delegations handoff actions
  - 2026-04-27 preprocess model sync with Settings-selected model

## Page: `analytics`

- Entry Points: topbar analytics chip.
- Primary Screen Component: `AnalyticsScreen` in `screens.jsx`.
- Assets On Page:
  - Multi-tab intelligence panels (sources, owners, pipeline, win/loss, revenue, events, lead-time, cohorts, conversation)
  - KPI tiles, charts, context menus, insight rail
- Asset Ownership:
  - API/data:
    - `/api/intelligence/conversation/latest`
    - Snapshot files under `CCAgentindex/analytics/*.json`
  - Render/logic: `screens.jsx` analytics components
  - Source scripts: `Onboard Scripts/analytics_*.py`, `build_conversation_intelligence.py`
- Change Checklist: `screens.jsx`, `server.py`, `mission_control_loader.js`, `styles.css`, `lucide.js`
- Last Verified: 2026-04-27
- History:
  - 2026-04-27 analytics restoration + expansion across source/pipeline/winloss/revenue/events/cohorts
  - 2026-04-27 context-menu + interactivity pass

## Page: `delegations`

- Entry Points: topbar delegations chip + handoff actions from chat/intake/boxes/people.
- Primary Screen Component: `DelegationsScreen` in `screens.jsx`.
- Assets On Page:
  - Draft queue + run timeline
  - Channel picker cards (GitHub, ClickUp, Close, Claude Code, Cursor, General)
  - Final-edit markdown preview, rewrite, undo, approval controls
  - Right-click menus on draft and run rows + feedback strip
- Asset Ownership:
  - Client API: `delegator.js`
  - Server API:
    - Runs: `/api/delegate`, `/api/delegate/<id>`
    - Drafts: `/api/delegations/drafts`, `/api/delegations/drafts/{create|update|delete|submit|rewrite|undo}`
    - Status: `/api/status`
  - Storage: `CCAgentindex/_ledger/delegation_drafts.json`, `delegation_draft_events.jsonl`, delegation run files
  - Policy: target-aware write approval gates in `server.py`
- Change Checklist: `screens.jsx`, `delegator.js`, `server.py`, `styles.css`, `app.jsx`, `components.jsx`
- Last Verified: 2026-04-27
- History:
  - 2026-04-27 action-zone rollout + draft-first flow + approvals + audit
  - 2026-04-27 channel-picker/feedback clarity and nested-scroll cleanup

## Page: `boxes`

- Entry Points: topbar boxes chip.
- Primary Screen Component: `BoxesScreen` in `screens.jsx`.
- Assets On Page:
  - Focused roster for Hugo + Brenda/Steve
  - Single-surface dossier view (state/profile/comms/enrichment/plan/agents/logic)
  - Markdown-first rich renderer with design-kit section heroes/admonitions
  - Completeness checklist + color coding
  - Right-click actions including send-to-delegations
- Asset Ownership:
  - API:
    - `/api/boxes/list`
    - `/api/boxes/<id>`
    - `/api/boxes/<id>/html`
    - `/api/boxes/<id>/template/<slug>`
  - Data source: `Auto/Client Boxes`, `Auto/Staff Boxes`, `Auto/orchestrator/state`
  - Loader: `mission_control_loader.js` (`fBoxes`, refresh helpers)
  - Side effects: read-only source ingestion; optional delegation draft handoffs
- Change Checklist: `screens.jsx`, `server.py`, `mission_control_loader.js`, `styles.css`, `app.jsx`, `components.jsx`
- Last Verified: 2026-04-27
- History:
  - 2026-04-27 initial Auto-box runtime integration
  - 2026-04-27 single-panel dossier flow (removed old html panel split)
  - 2026-04-27 specialized Hugo + Brenda/Steve renderers
  - 2026-04-27 design-kit convergence (section heroes, receipts state feed, two-lane enrichment)

---

## Global Navigation And Shared Assets

- Router and history: `app.jsx`
- Top navigation + context menu primitives + shared markdown/chat rail: `components.jsx`
- Shared stores/services:
  - `window.SecretaryAI`, `window.SecretaryActions`, `window.SecretaryChat`
  - `window.SecretaryDelegator`, `window.SecretaryInbox`, `window.MissionControl`
- Shared markdown rendering:
  - `Markdown` component in `components.jsx` (`marked` + `DOMPurify` loaded via `Secretary.html`)
- Shared context menu system:
  - `useContextMenu` + `ContextMenu` in `components.jsx`

## Verification Checklist (Use Every Page Edit)

- Route still exists in `app.jsx` and maps to expected component.
- Page section in this file updated with component/API/style changes.
- Any new endpoint/path reflected under Asset Ownership.
- Any removed asset removed from this file in same change.
- Cache-busters in `Secretary.html` bumped when JS/CSS changed.

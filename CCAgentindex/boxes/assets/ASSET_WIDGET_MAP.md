# Asset / Widget Map

Last updated: 2026-05-01 (Bucket G backfill per `ATOM-2026-05-01-0004`: formalized the 15-route app shape including `box_graph`; corrected `grid` away from old 3x3 / QuickCapture language; registered Box Graph, `GET /api/box_graph`, ChatRail command cockpit, and browser/computer handoff endpoints. The page-asset sitemap remains canonical for per-page truth.)
Maintainer: Jake / Comeketo Agent project agents
Status: **active**
Tier (Box Bus Ledger §3): **domain** — fans out only to Boxes that subscribe to UI / page domain
Read when: planning a UI change, debugging a missing widget, deciding which page a new widget belongs on, mapping which pages an API change affects, or onboarding to the front-end.
Core rule: **The sitemap is canonical for per-page operational truth. This ledger is the cross-cutting map.**
Steward agent: not yet authored. Phase B work — when written it lands at `/Subagent Boxes/asset_widget_map_subagent_package/`.

> The page-asset sitemap (`page_asset_sitemap.md`) tells you everything about **one page**.
>
> This ledger tells you what **multiple pages** share — which widgets are reused, which APIs power how many surfaces, which side effects cross page boundaries.
>
> If you change a widget that lives on three pages, this ledger is how you know which three pages.

---

## 1. Purpose

The page-asset sitemap is the canonical UI Done Gate (`DEC-2026-04-29-007`). It owns per-page Asset Ownership / Change Checklist / History / Last Verified — operational truth, updated on every page change.

This ledger sits one altitude up. It answers the **cross-cutting** questions the sitemap can't, without duplicating the sitemap:

- Which widgets are reused across pages? (When `useContextMenu` is touched, what breaks?)
- Which API endpoints feed which pages? (When `/api/boxes/list` changes, who needs to re-test?)
- Which side effects cross page boundaries? (`localStorage.secretary.tweaks` is read by which screens?)
- Which `window.SecretaryX` services back which pages?
- What's the shared-asset registry — and who's adding to it next?

### Owns

- the **page index** (15 live routes) with one-paragraph summaries pointing at sitemap detail
- the **shared widget catalog** (cross-page widgets — what they are, where they're used)
- the **API → page mapping** (when an endpoint changes, which surfaces are affected)
- the **shared services registry** (`window.MissionControl`, `SecretaryAI`, `SecretaryActions`, etc.)
- the **cross-page state map** (`localStorage` keys + `window` events)
- per-page **change-radius hints** (when this page changes, what else might need attention)
- pointers into the sitemap as the canonical per-page detail surface

### Does not own

- per-page **Asset Ownership / Change Checklist / History / Last Verified** → those live in `page_asset_sitemap.md` (canonical UI Done Gate, `DEC-2026-04-29-007`)
- per-file role descriptions → `FILE_CONTENTS.md`
- external-service contracts → `CONNECTIONS.md`
- decisions about UI architecture → `DECISIONS_LEDGER.md`
- per-page deep memory (history, why-it-was-built) → future Page Ledgers (`LEDGERS/PAGES/<route>.md`)
- raw component / screen source → `screens.jsx`, `components.jsx`, etc.

When this ledger and the sitemap disagree, **the sitemap wins** for per-page detail. This ledger updates to match.

---

## 2. Page Index (15 live routes)

Source: `app.jsx` `KNOWN_SCREENS` and route switch. Sitemap section reference in parentheses.

| Page | Primary screen | Purpose (one line) | Sitemap |
|---|---|---|---|
| `grid` | `FrontPage` (`components.jsx`, mounted by `app.jsx`) | App home / home chat destination: LivePiecesHeader or TeachingStrip, IdeasTray, ChatRail command cockpit, shared chrome | sitemap §grid |
| `settings` | `SettingsScreen` (`screens.jsx`) | Connector credentials, feature flags, provider picker, web-mode disclosure | sitemap §settings |
| `leads` | `PeopleScreen` kind=`lead` (`screens.jsx`) | People page filtered to `kind:lead` | sitemap §leads |
| `clients` | `PeopleScreen` kind=`client` (`screens.jsx`) | People page filtered to `kind:client` | sitemap §clients |
| `coworkers` | `PeopleScreen` kind=`coworker` (`screens.jsx`) | People page filtered to `kind:coworker` | sitemap §coworkers |
| `contacts` | `PeopleScreen` kind=`contact` (`screens.jsx`) | People page filtered to `kind:contact` | sitemap §contacts |
| `venues` | `VenuesScreen` (`screens.jsx`) | Venues domain, `kind:venue` | sitemap §venues |
| `briefing` | `DailyBriefingScreen` (`screens.jsx`) | Pieces-dependent briefing surface; hidden in OpenAI/web-mode gate | sitemap §briefing |
| `activity` | `PiecesActivityScreen` (`screens.jsx`) | Pieces sweeps and activity surface; hidden in OpenAI/web-mode gate | sitemap §activity |
| `automation` | `AutomationShell` (`automation.jsx`) | Workflow graph, triggers, sub-agents, state, hooks, automation tabs | sitemap §automation |
| `intake` | `IntakeScreen` (`screens.jsx`) | Reports list, Box Reports, Workspaces, ask panel | sitemap §intake |
| `analytics` | `AnalyticsScreen` (`screens.jsx`) | Analytics panels, conversation intelligence, owner-stage dashboards | sitemap §analytics |
| `delegations` | `DelegationsScreen` (`screens.jsx`) | Channel-picker delegation drafts and run timeline | sitemap §delegations |
| `boxes` | `BoxesScreen` (`screens.jsx`) | Client/Staff Box reader, dossier renderer, specialized renderers | sitemap §boxes |
| `box_graph` | `BoxGraphScreen` (`screens.jsx`) | Box graph visualization synthesized from ledger and Auto Box metadata | sitemap §box_graph |

**Cross-page note (Boxes ↔ Intake):** per `DEC-2026-04-29-005..008`, every Client Box is addressable from Intake as a synthesized Box Report; right-click on a Client Box exposes "Open as Intake Report →" and Intake's report header carries an "open in boxes →" handoff. Both screens accept `route.selectId` for direct landing.

---

## 3. Shared Widget Catalog

Widgets used by **two or more pages**, or single-route widgets that have cross-ledger / shared-chrome impact. Single-page widgets with no cross-page impact stay in the sitemap entry only.

### 3.1 Layout chrome (every page)

| Widget | Defined in | Used by | Notes |
|---|---|---|---|
| `Topbar` | `components.jsx` | every page | Route chips, people dropdown, web-mode hiding for Pieces routes, Box Graph / Automation / Delegations launchers |
| `BottomStrip` | `components.jsx` | every page | Footer/status strip; renders route breadcrumb stack |
| Route breadcrumbs | `components.jsx` | every page | Implemented by `Breadcrumb`, rendered inside `BottomStrip` |

### 3.2 Cross-page overlays / modals

| Widget | Defined in | Used by | Notes |
|---|---|---|---|
| `FullscreenCell` | `components.jsx` | legacy grid flow | Still exported; current grid/home page is not the old 3x3 surface |
| `TweaksPanel` | `components.jsx` | app shell edit mode + settings | Reads `localStorage.secretary.tweaks` |
| `EditWithRodbotOverlay` | `components.jsx` (verify before cleanup) | legacy grid/boxes candidates | G3 flagged this as a stale-widget candidate; do not remove without targeted grep |
| `AIBanner` | `app.jsx` | app shell / every route when AI state is active | Corrected from older `components.jsx` ownership |

### 3.3 ChatRail command cockpit

`ChatRail` is defined in `components.jsx` and is primarily mounted on `grid`, but its side effects and launchers cross page boundaries.

| Surface | Definition / API | Change radius |
|---|---|---|
| Provider status cards | `components.jsx` + `/api/status` + `secretary.tweaks` | `grid`, `settings`, provider-gated UI |
| Prompt command cards | `components.jsx` | `grid` ChatRail behavior |
| Box Graph launcher | `components.jsx` → `go.push("box_graph")` | `grid`, `box_graph`, shared chrome |
| Delegations launcher / toggle | `components.jsx` + delegation flow | `grid`, `delegations` |
| Route pills | `components.jsx` | `grid` ChatRail; connector intent tagging / handoffs |
| Computer use handoff | `POST /api/computer_use/handoff` | `grid`, activity ledger receipts |
| Browser use handoff | `POST /api/browser_use/handoff`, `GET /api/browser_use/jobs/<id>` | `grid`, browser-use receipts |
| Open browser handoff | `POST /api/browser_open/handoff` | `grid`, visible browser handoff receipts |

**Rule:** Changing ChatRail is no longer a single-page cosmetic change. Re-check grid, delegations handoff behavior, Box Graph launcher, settings/provider state, and browser/computer/open-browser handoff receipts.

### 3.4 Box Graph widgets

`BoxGraphScreen` lives in `screens.jsx` and is exposed through the `box_graph` route. The endpoint `GET /api/box_graph` synthesizes graph data from ledger and Auto Box metadata.

| Widget / surface | Defined in | Used by | Notes |
|---|---|---|---|
| Box Graph route page | `screens.jsx` | `box_graph` | Graph visualization / route-inspection surface |
| Graph data endpoint | `server.py` | `box_graph` | `GET /api/box_graph` |
| Box Graph launchers | `Topbar`, `ChatRail` | every page chrome + grid | Shared entry points into the page |

**Data sources:** `LEDGERS/BOXES/*/box.json`, `Auto/Client Boxes/`, and `Auto/Staff Boxes/`.

### 3.5 Right-click context menu (`useContextMenu`)

`components.jsx` exports `useContextMenu()` hook + `ContextMenu` component. Items shape: `[{ label, icon, onClick, danger, disabled, shortcut, divider, keepOpen }]`.

Currently wired on:

| Page | Surface | Menu builder |
|---|---|---|
| `grid` | legacy grid cells | `CellContextMenu` |
| `leads`, `clients`, `coworkers`, `contacts`, `venues` | list rows + profile pane | per-People-page builder |
| `intake` | report / doc / Q&A cards | per-card builder |
| `delegations` | draft cards + run timeline rows | per-row builder |
| `boxes` | box list + html demo list | `boxes-md-rich` menu |

**Pattern:** any new page can adopt the same shape — `useContextMenu()` + `onContextMenu={...}` + `menu.render(buildItemsFor(target), title)`. Don't fork; reuse.

### 3.6 People-page primitives (5 routes share the shape)

`leads`, `clients`, `coworkers`, `contacts`, `venues` render the same skeleton — list + profile pane + contact rows + right-click menu — over different `kind:` filters from `MissionControl.people` (and `MissionControl.venues` for venues). The screen components in `screens.jsx` are siblings of one base pattern.

When the People-page primitive changes, **all five routes are affected.**

### 3.7 Box specialized renderers

`hugo_casillas` and `brenda_steve` Client Boxes have specialized layouts in `components.jsx` / `screens.jsx`. Generic Box rendering (`boxes-md-rich`) covers the rest.

When adding a new specialized renderer: register it in `BoxesScreen` and document the layout pattern in `BOX_LEDGER.md` per-Client conventions.

### 3.8 Markdown / dossier rendering

`boxes-md-rich` is the canonical markdown renderer for Box dossiers — design-kit cards, admonition styling, narrative-card flow. Reusable on any future page that needs structured markdown rendering.

### 3.9 Connectors picker (cross-page)

`connectors.js` `SecretaryConnectors` exposes the channel catalog (claude_code, clickup, slack, email, whatsapp, sms, note, internal, open_url) consumed by:

- `delegations` page (the picker UI)
- `grid` page (ChatRail route pills / connector intent)
- `intake` page (send-section-to-delegations action)
- `boxes` page (right-click → delegation handoff)

When `connectors.js` changes, **four pages are affected**.

---

## 4. API → Page Mapping

When an endpoint changes, these are the pages to re-test.

### 4.1 Universal health

| Endpoint | Pages affected |
|---|---|
| `/api/status` | every page readiness checks; grid ChatRail command cockpit |

### 4.2 Box Graph

| Endpoint | Pages affected |
|---|---|
| `GET /api/box_graph` | `box_graph`, grid ChatRail launcher, Topbar `box graph` chip |

### 4.3 Boxes domain

| Endpoint | Pages affected |
|---|---|
| `GET /api/boxes/list` | `boxes` |
| `GET /api/boxes/<id>` | `boxes`, `intake` (Box Report synthesis) |
| `GET /api/boxes/<id>/html` | `boxes` |
| `GET /api/boxes/<id>/template/<slug>` | `boxes` |

### 4.4 Reports / Intake

| Endpoint | Pages affected |
|---|---|
| `GET /api/reports/list` | `intake` |
| `GET /api/reports/get?slug=<id>` | `intake` (Box Report or Workspace) |
| `POST /api/reports/ask` | `intake` |
| `POST /api/reports/ingest` | `intake` |

### 4.5 People / Venues

| Endpoint | Pages affected |
|---|---|
| `GET /api/people/list` | `leads`, `clients`, `coworkers`, `contacts` |
| `GET /api/venues/list` | `venues` |

### 4.6 Pieces

| Endpoint | Pages affected |
|---|---|
| `GET /api/pieces/status` | `activity`, `briefing` |
| `GET /api/pieces/sweeps` | `activity` |
| `GET /api/pieces/sweeps/latest` | `activity`, `briefing`, grid `LivePiecesHeader` when not web-mode gated |
| `POST /api/pieces/sweep` | `activity` |
| `POST /api/pieces/ask` | `activity`, `briefing` |

### 4.7 Delegations / Connectors

| Endpoint | Pages affected |
|---|---|
| `POST /api/delegate` | `delegations`, `grid` ChatRail, `intake`, `boxes` |
| `POST /api/clickup/rescan` | `delegations`, `settings` |
| `POST /api/clickup/*` | `delegations` |

### 4.8 Browser / computer handoffs

| Endpoint | Pages affected |
|---|---|
| `POST /api/computer_use/handoff` | `grid` ChatRail |
| `POST /api/browser_use/handoff` | `grid` ChatRail |
| `GET /api/browser_use/jobs/<id>` | `grid` ChatRail |
| `POST /api/browser_open/handoff` | `grid` ChatRail |

### 4.9 Settings

| Endpoint | Pages affected |
|---|---|
| `POST /api/settings/mcp_credentials` | `settings` |
| `GET /api/settings/*` | `settings` |

### 4.10 Chat

| Endpoint | Pages affected |
|---|---|
| `POST /api/chat/*` | `grid` ChatRail, `intake` ask |

### 4.11 Analytics-page panels

Widgets live in `screens.jsx` and read either pre-built JSON snapshots (the `analytics_*.py` family) or server-synthesized JSON (the `build_*.py` family per `DEC-2026-04-30-001`).

| Endpoint / Source | Panel(s) | Producer |
|---|---|---|
| `CCAgentindex/analytics/source_channel_snapshot.json` (static) | Source Channels tab + AnalyticsDonut + AnalyticsLeadTable | `Onboard Scripts/analytics_source_channels.py` |
| `CCAgentindex/analytics/seller_performance_snapshot.json` (static) | Owner Performance tab · Pipeline Funnel tab | `Onboard Scripts/analytics_seller_performance.py` |
| `CCAgentindex/analytics/upcoming_events_snapshot.json` (static) | Upcoming Events tab | `Onboard Scripts/analytics_upcoming_events.py` |
| `CCAgentindex/analytics/win_loss_snapshot.json` (static) | Win / Loss tab | `Onboard Scripts/analytics_win_loss.py` |
| `CCAgentindex/analytics/revenue_trends_snapshot.json` (static) | Revenue & Growth tab | `Onboard Scripts/analytics_revenue_trends.py` |
| `CCAgentindex/analytics/booking_lead_time_snapshot.json` (static) | Lead Time tab | `Onboard Scripts/analytics_booking_lead_time.py` |
| `CCAgentindex/analytics/cohort_snapshot.json` (static) | Cohort Analysis tab | `Onboard Scripts/analytics_cohort_analysis.py` |
| `GET /api/intelligence/conversation/latest` | Conversation Intel tab + ConversationIntelligencePanel + Sparkline + ChannelBars | `Onboard Scripts/build_conversation_intelligence.py` |
| `GET /api/analytics/owner_stage` | Pipeline by Stage tab + OwnerStagePanel + StageRow | `Onboard Scripts/build_owner_stage_dashboards.py` |

When adding a new analytics panel: prefer the server-synthesized pattern for `build_*.py` integrations (no JSON sidecar in bedrock; markdown remains canonical). Update the Analytics page section in `page_asset_sitemap.md` AND this row.

### 4.12 Agents (runnable)

| Endpoint | Pages affected |
|---|---|
| `POST /api/agents/<name>/run` | `delegations` when wired; `grid` ChatRail handoff; `boxes` per-Box steward when authored |

### 4.13 Activity log

| Endpoint / source | Pages affected |
|---|---|
| `_ledger/activity.jsonl` | `activity`, `briefing`, automation state/hooks subtabs, handoff receipts |

---

## 5. Shared Services Registry (`window.*`)

Set up by `mission_control_loader.js` and the various JS files at startup. When one of these changes, every page that reads it is affected.

| Service | Defined in | Read by | Owns |
|---|---|---|---|
| `window.MissionControl` | `mission_control_loader.js` | every screen | bedrock data: `people`, `venues`, `boxes`, `boxesById`, `boxesGrouped`, `boxesMismatch`, `workflows`, `triggers`, `agent_plans`, `hooks`, `catalog_edges` |
| `window.SecretaryAI` | `ai.js` | grid ChatRail, intake ask, settings provider controls | LLM orchestration |
| `window.SecretaryActions` | `ai_actions.js` | screens with chat or legacy grid generation | tool/action handlers |
| `window.SecretaryMemory` | legacy Pieces-backed name | activity, briefing, grid when not web-mode gated | memory recall |
| `window.SecretaryLedger` | internal | every screen | activity / event log helpers |
| `window.SecretaryInbox` | internal | legacy grid QuickCapture, inbox surfaces | inbox writes |
| `window.SecretaryDelegator` | `delegator.js` | grid, delegations, intake, boxes | delegation flow |
| `window.SecretaryConnectors` | `connectors.js` | grid, delegations, intake, boxes | channel catalog + send |
| `window.Rodbot` | internal legacy name | legacy grid/Edit-with-Rodbot candidates | overlay-driven edits |
| `window.MissionControlRefreshBoxes` | `mission_control_loader.js` | `boxes` | re-hydrate Box data |

**Rule:** internal API names like `SecretaryX` are **stable for compatibility** — these are not user-facing. They survive across ledger phases.

---

## 6. Cross-Page State (`localStorage` + `window` events)

### 6.1 `localStorage` keys (read by multiple pages)

| Key | Read by | Owns |
|---|---|---|
| `secretary.tweaks` (incl. provider, `piecesModel`, `promptEnhance`, `browserUse`) | grid, settings, app web-mode gate | user preferences |
| `secretary.gridHistory` | legacy grid generation flow | grid generation history |
| `secretary.gridOverrides` | legacy grid generation flow | per-cell overrides |
| `secretary.commitments` | legacy grid | deprecated — commitments page retired Apr 2026 trim |
| `secretary.history.v2` | app route stack | route/history stack |
| `secretary.refineStack` | legacy grid refine flow | refine-loop state |
| `comeketo.briefingIdeas.<slug>` | grid IdeasTray, briefing | AI-curated ideas cache per briefing slug |

**Rule (per `<artifacts>` block in `CLAUDE.md`):** `localStorage` is acceptable in the project's own React/HTML files but NOT inside Cowork artifacts.

### 6.2 `window` events (cross-file pub/sub)

| Event | Emitter | Listeners |
|---|---|---|
| `missioncontrol:loaded` | `mission_control_loader.js` (after hydration) | every screen that needs MissionControl ready |
| `missioncontrol:error` | `mission_control_loader.js` | error surfaces |

---

## 7. Change-Radius Hints

When you change one of these, here's what else might need attention.

| You change... | Re-check |
|---|---|
| `useContextMenu` hook in `components.jsx` | legacy grid, all 5 People pages, `intake`, `delegations`, `boxes` |
| `Topbar` / `BottomStrip` | every page, web-mode route hiding, `box_graph` chip |
| `ChatRail` command cockpit | `grid`, `delegations`, `box_graph` launcher, settings/provider state, computer/browser/open-browser handoffs |
| `BoxGraphScreen` or `GET /api/box_graph` | `box_graph`, grid ChatRail launcher, Topbar `box graph` chip |
| The People-page primitive | `leads`, `clients`, `coworkers`, `contacts`, `venues` |
| `connectors.js` channel catalog | `delegations`, `grid` ChatRail, `intake`, `boxes` |
| `mission_control_loader.js` | every page that reads `MissionControl.*` |
| `ai_instructions.js` system-prompt assembly | `grid` ChatRail, `intake` ask |
| Any new `/api/*` endpoint | the page that calls it + sitemap entry + `CONNECTIONS.md` if it's external |
| `lucide.js` icons | every page + `Secretary.html` cache-buster |
| `styles.css` | every page + `Secretary.html` cache-buster |
| Any JS/CSS file | every JS/CSS edit must bump its `?v=` in `Secretary.html` (`DEC-2026-04-29-007`) |

---

## 8. Relationship To Page-Asset Sitemap

The sitemap is the **operational UI Done Gate** (`DEC-2026-04-29-007`). When a page changes, the sitemap must be updated **in the same unit of work**. This ledger does not change that rule.

This ledger lives at a higher altitude. It says:

- **Sitemap §boxes** is the canonical answer to "what's on the boxes page?"
- **This ledger §3** is the canonical answer to "what widgets does the boxes page share with other pages?"
- **Sitemap** updates on every page change. **This ledger** updates when a *cross-cutting pattern* changes (a new shared widget, a new shared API, a new `window.SecretaryX` service, a new `localStorage` key).

---

## 9. When To Update This Ledger

Update this ledger when:

- a new page / route is added (append to §2; add to sitemap as the canonical entry)
- a widget moves from single-page to multi-page, or becomes a cross-ledger / shared-chrome surface (§3)
- a new `/api/*` endpoint is wired and at least one page consumes it (§4)
- a new `window.SecretaryX` service is created (§5)
- a new `localStorage` key is added that's read by more than one page (§6)
- a new `window` event is emitted (§6.2)
- a side effect crosses page boundaries (§7)

When updating: bump `Last updated`, refresh JSON mirror, append history. **If a single page changes (no cross-page impact), update the sitemap only — not this ledger.**

---

## 10. Relationship To Other Ledgers

- **`page_asset_sitemap.md`** — canonical per-page operational truth. Sitemap wins on per-page detail.
- **`FILE_CONTENTS.md`** — names what each file does. This ledger names what the *UI elements those files render* do.
- **`CONNECTIONS.md`** — when an external service powers a page (e.g., Pieces → activity), the dependency lives there; this ledger names the page consumer.
- **`BOX_BUS_LEDGER.md` §2.1** — `box.json.subscribes[]` for service-domain ledgers; UI-page Boxes (when authored) will declare service subscriptions referenced here.
- **`SOURCE_OF_TRUTH.md` §3.2** — page/UI truth ordering (source > sitemap > Page Ledgers > Widget Ledgers).
- **`DEFINITION_OF_DONE.md` §5.3 + §5.4** — Page / Route Done Gate + Widget / Component Done Gate. This ledger satisfies the Asset/Widget Map row of the Update Matrix.
- **Future `LEDGERS/PAGES/<route>.md`** — one Page Ledger per route, when authored. Will carry per-page deep memory (history, why-built, decisions, problems). This ledger remains the cross-cutting map.

---

## 11. North Star Alignment

This ledger directly supports:

- **NS-02 Legibility** — cross-page widget reuse is now visible in one place.
- **NS-09 Agent Handoff Continuity** — a new agent doing UI work can find shared assets in seconds.
- **NS-10 Defense As First-Class Build Activity** — change-radius hints (§7) are defense — they prevent "I changed widget X and broke page Y."

Indirect: NS-01, NS-06, NS-07.

---

## 12. Update Triggers (Quick Reference)

| Trigger | Update |
|---|---|
| New page added | §2 + sitemap (sitemap is canonical) |
| Widget promoted single-page → multi-page / cross-ledger | §3 |
| New `/api/*` endpoint with ≥1 page consumer | §4 |
| New `window.SecretaryX` service | §5 |
| New shared `localStorage` key | §6.1 |
| New `window` event | §6.2 |
| Cross-page side effect introduced | §7 |
| Single-page-only change | sitemap only — not this ledger |

---

## 13. History

- 2026-04-29 Phase 14 — initial creation. 14-page index + cross-page widget catalog + API mapping + shared services/state/change-radius hints. Companion files: `ASSET_WIDGET_MAP.json`, `VISUALS/page_widget_dependency.mmd`. Companion Communications entry: `COMM-2026-04-29-011`.
- 2026-05-01 Bucket G backfill per `ATOM-2026-05-01-0004` — updated from 14-route stale state to 15-route live app shape including `box_graph`; corrected `grid` purpose away from old 3x3 / QuickCapture language; registered ChatRail command cockpit, Box Graph widgets, `GET /api/box_graph`, and browser/computer handoff endpoints; corrected `AIBanner` ownership to `app.jsx`; marked old grid overlays as legacy/stale candidates pending targeted cleanup.

---

## 14. Final Operating Rule

> The sitemap owns **what's on each page**.
>
> This ledger owns **what spans the pages**.
>
> When they disagree on per-page detail, the sitemap wins. When you need to know which pages share a widget, this ledger is the answer.

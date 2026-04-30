# Asset / Widget Map

Last updated: 2026-04-30 (added §3.8 Analytics-page panels; new endpoint `/api/analytics/owner_stage` registered as integration pattern per `DEC-2026-04-30-001`)
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

- the **page index** (14 routes) with one-paragraph summaries pointing at sitemap detail
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

## 2. Page Index (14 surviving routes)

Source: `app.jsx` `KNOWN_SCREENS`. Sitemap section reference in parentheses.

| Page | Primary screen | Purpose (one line) | Sitemap |
|---|---|---|---|
| `grid` | `FrontPage` (`app.jsx`) | App home — 3x3 decision grid + IdeasTray + QuickCapture + ChatRail | sitemap §grid |
| `automation` | `AutomationScreen` (`automation.jsx`) | Workflow display + trigger surfaces + manual-fire UI | sitemap §automation |
| `activity` | `ActivityScreen` (`screens.jsx`) | Pieces sweeps + tools catalog + ask panel | sitemap §activity |
| `settings` | `SettingsScreen` (`screens.jsx`) | Connector credentials + feature flags + provider picker | sitemap §settings |
| `leads` | `LeadsScreen` (`screens.jsx`) | People page filtered to `kind:lead` (28 records) | sitemap §leads |
| `clients` | `ClientsScreen` (`screens.jsx`) | People page filtered to `kind:client` | sitemap §clients |
| `coworkers` | `CoworkersScreen` (`screens.jsx`) | People page filtered to `kind:coworker` (10 staff) | sitemap §coworkers |
| `contacts` | `ContactsScreen` (`screens.jsx`) | People page filtered to `kind:contact` | sitemap §contacts |
| `venues` | `VenuesScreen` (`screens.jsx`) | Venues domain (30 records, `kind:venue`) | sitemap §venues |
| `briefing` | `BriefingScreen` (`screens.jsx`) | Daily briefing ribbon + Pieces-fed digest | sitemap §briefing |
| `intake` | `IntakeScreen` (`screens.jsx`) | Reports list (split: Box Reports auto + Workspaces manual) + ask panel | sitemap §intake |
| `delegations` | `DelegationsScreen` (`screens.jsx`) | Channel-picker delegation drafts + run timeline | sitemap §delegations |
| `boxes` | `BoxesScreen` (`screens.jsx`) | Client/Staff Box reader + dossier renderer + specialized renderers | sitemap §boxes |
| `analytics` | `AnalyticsScreen` (`screens.jsx`) | Conversation Intelligence flag-bearer page | sitemap §analytics |

**Cross-page note (Boxes ↔ Intake):** per `DEC-2026-04-29-005..008`, every Client Box is addressable from Intake as a synthesized Box Report; right-click on a Client Box exposes "Open as Intake Report →" and Intake's report header carries an "open in boxes →" handoff. Both screens accept `route.selectId` for direct landing.

---

## 3. Shared Widget Catalog

Widgets used by **two or more pages**. Single-page widgets stay in the sitemap entry only.

### 3.1 Layout chrome (every page)

| Widget | Defined in | Used by | Notes |
|---|---|---|---|
| `Topbar` | `components.jsx` | every page | Route chips, language flip, status indicators |
| `BottomStrip` | `components.jsx` | every page | Status bar / footer |
| Route breadcrumbs | `components.jsx` | every page | Back-navigation stack |

### 3.2 Cross-page overlays / modals

| Widget | Defined in | Used by | Notes |
|---|---|---|---|
| `FullscreenCell` | `components.jsx` | grid + others | Cell expansion modal |
| `TweaksPanel` | `components.jsx` | grid + settings | Reads `localStorage.secretary.tweaks` |
| `EditWithRodbotOverlay` | `components.jsx` | grid + boxes (renderer) | AI-assisted edit overlay |
| `AIBanner` | `components.jsx` | every page | Status banner for AI / Pieces health |

### 3.3 Right-click context menu (`useContextMenu`)

`components.jsx` exports `useContextMenu()` hook + `ContextMenu` component. Items shape: `[{ label, icon, onClick, danger, disabled, shortcut, divider, keepOpen }]`.

Currently wired on:

| Page | Surface | Menu builder |
|---|---|---|
| `grid` | grid cells | `CellContextMenu` |
| `leads`, `clients`, `coworkers`, `contacts`, `venues` | list rows + profile pane | per-People-page builder |
| `intake` | report / doc / Q&A cards | per-card builder |
| `delegations` | draft cards + run timeline rows | per-row builder |
| `boxes` | box list + html demo list | `boxes-md-rich` menu |

**Pattern:** any new page can adopt the same shape — `useContextMenu()` + `onContextMenu={...}` + `menu.render(buildItemsFor(target), title)`. Don't fork; reuse.

### 3.4 People-page primitives (5 routes share the shape)

`leads`, `clients`, `coworkers`, `contacts`, `venues` render the same skeleton — list + profile pane + contact rows + right-click menu — over different `kind:` filters from `MissionControl.people` (and `MissionControl.venues` for venues). The screen components in `screens.jsx` are siblings of one base pattern.

When the People-page primitive changes, **all five routes are affected.**

### 3.5 Box specialized renderers

`hugo_casillas` and `brenda_steve` Client Boxes have specialized layouts in `components.jsx` / `screens.jsx`. Generic Box rendering (`boxes-md-rich`) covers the other 26.

When adding a new specialized renderer: register it in `BoxesScreen` and document the layout pattern in `BOX_LEDGER.md` per-Client conventions.

### 3.6 Markdown / dossier rendering

`boxes-md-rich` is the canonical markdown renderer for Box dossiers — design-kit cards, admonition styling, narrative-card flow. Reusable on any future page that needs structured markdown rendering.

### 3.7 Connectors picker (cross-page)

`connectors.js` `SecretaryConnectors` exposes the channel catalog (claude_code, clickup, slack, email, whatsapp, sms, note, internal, open_url) consumed by:

- `delegations` page (the picker UI)
- `grid` page (ChatRail's connector quick-tag row)
- `intake` page (send-section-to-delegations action)
- `boxes` page (right-click → delegation handoff)

When `connectors.js` changes, **four pages are affected**.

---

## 4. API → Page Mapping

When an endpoint changes, these are the pages to re-test.

### 4.1 Universal health

| Endpoint | Pages affected |
|---|---|
| `/api/status` | every page (readiness checks) |

### 4.2 Boxes domain

| Endpoint | Pages affected |
|---|---|
| `GET /api/boxes/list` | `boxes` |
| `GET /api/boxes/<id>` | `boxes`, `intake` (Box Report synthesis) |
| `GET /api/boxes/<id>/html` | `boxes` |
| `GET /api/boxes/<id>/template/<slug>` | `boxes` |

### 4.3 Reports / Intake

| Endpoint | Pages affected |
|---|---|
| `GET /api/reports/list` | `intake` |
| `GET /api/reports/get?slug=<id>` | `intake` (Box Report or Workspace) |
| `POST /api/reports/ask` | `intake` |
| `POST /api/reports/ingest` | `intake` |

### 4.4 People / Venues

| Endpoint | Pages affected |
|---|---|
| `GET /api/people/list` | `leads`, `clients`, `coworkers`, `contacts` |
| `GET /api/venues/list` | `venues` |

### 4.5 Pieces

| Endpoint | Pages affected |
|---|---|
| `GET /api/pieces/status` | `activity`, `briefing` |
| `GET /api/pieces/sweeps` | `activity` |
| `GET /api/pieces/sweeps/latest` | `activity`, `briefing` |
| `POST /api/pieces/sweep` | `activity` |
| `POST /api/pieces/ask` | `activity`, `briefing` |

### 4.6 Delegations / Connectors

| Endpoint | Pages affected |
|---|---|
| `POST /api/delegate` | `delegations`, `grid` (ChatRail), `intake`, `boxes` |
| `POST /api/clickup/rescan` | `delegations`, `settings` |
| `POST /api/clickup/*` | `delegations` |

### 4.7 Settings

| Endpoint | Pages affected |
|---|---|
| `POST /api/settings/mcp_credentials` | `settings` |
| `GET /api/settings/*` | `settings` |

### 4.8 Chat

| Endpoint | Pages affected |
|---|---|
| `POST /api/chat/*` | `grid` (ChatRail), `intake` (ask) |

### 4.9a Analytics-page panels

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
| `GET /api/intelligence/conversation/latest` (server-read latest dated `.json`) | Conversation Intel tab + ConversationIntelligencePanel + Sparkline + ChannelBars | `Onboard Scripts/build_conversation_intelligence.py` |
| **`GET /api/analytics/owner_stage`** (server-synthesized JSON per `DEC-2026-04-30-001`) | **Pipeline by Stage tab + OwnerStagePanel + StageRow** | **`Onboard Scripts/build_owner_stage_dashboards.py`** |

When adding a new analytics panel: prefer the server-synthesized pattern for `build_*.py` integrations (no JSON sidecar in bedrock; markdown remains canonical). Update the Analytics page section in `page_asset_sitemap.md` AND this row.

### 4.9 Agents (runnable)

| Endpoint | Pages affected |
|---|---|
| `POST /api/agents/<name>/run` | `delegations` (when wired); `grid` (ChatRail handoff); `boxes` (per-Box steward when authored) |

### 4.10 Activity log

| Endpoint | Pages affected |
|---|---|
| (read-side: `_ledger/activity.jsonl` is read by) | `activity`, `briefing` |

---

## 5. Shared Services Registry (`window.*`)

Set up by `mission_control_loader.js` and the various JS files at startup. When one of these changes, every page that reads it is affected.

| Service | Defined in | Read by | Owns |
|---|---|---|---|
| `window.MissionControl` | `mission_control_loader.js` | every screen | bedrock data: `people`, `venues`, `boxes`, `boxesById`, `boxesGrouped`, `boxesMismatch`, `workflows`, `triggers`, `agent_plans`, `hooks`, `catalog_edges` |
| `window.SecretaryAI` | `ai.js` | grid (ChatRail), intake (ask) | LLM orchestration |
| `window.SecretaryActions` | `ai_actions.js` | every screen with chat | tool/action handlers |
| `window.SecretaryMemory` | (legacy name; Pieces-backed) | activity, briefing, grid | memory recall |
| `window.SecretaryLedger` | (internal) | every screen | activity / event log helpers |
| `window.SecretaryInbox` | (internal) | grid (QuickCapture), inbox surfaces | inbox writes |
| `window.SecretaryDelegator` | `delegator.js` | grid, delegations, intake, boxes | delegation flow |
| `window.SecretaryConnectors` | `connectors.js` | grid, delegations, intake, boxes | channel catalog + send |
| `window.Rodbot` | (internal; legacy name) | grid (Edit-with-Rodbot overlay) | overlay-driven edits |
| `window.MissionControlRefreshBoxes` | `mission_control_loader.js` | `boxes` | re-hydrate Box data |

**Rule:** internal API names like `SecretaryX` are **stable for compatibility** — these are not user-facing. They survive across ledger phases.

---

## 6. Cross-Page State (`localStorage` + `window` events)

### 6.1 `localStorage` keys (read by multiple pages)

| Key | Read by | Owns |
|---|---|---|
| `secretary.tweaks` (incl. `piecesModel`, `promptEnhance`) | grid, settings | user preferences |
| `secretary.gridHistory` | grid | grid generation history |
| `secretary.gridOverrides` | grid | per-cell overrides |
| `secretary.commitments` | grid (legacy; commitments page retired in Apr 2026 trim) | (deprecated) |
| `secretary.history.v2` | grid, chat | conversation history |
| `secretary.refineStack` | grid | refine-loop state |
| `comeketo.briefingIdeas.<slug>` | grid (IdeasTray), briefing | AI-curated ideas cache per briefing slug |

**Rule (per `<artifacts>` block in `CLAUDE.md`):** `localStorage` is acceptable in the project's own React/HTML files but NOT inside Cowork artifacts.

### 6.2 `window` events (cross-file pub/sub)

| Event | Emitter | Listeners |
|---|---|---|
| `comeketoagent:language` | language flip in Topbar | every screen with i18n strings |
| `missioncontrol:loaded` | `mission_control_loader.js` (after hydration) | every screen that needs MissionControl ready |
| `missioncontrol:error` | `mission_control_loader.js` | error surfaces |

---

## 7. Change-Radius Hints

When you change one of these, here's what else might need attention.

| You change... | Re-check |
|---|---|
| `useContextMenu` hook in `components.jsx` | every right-click surface (`grid`, all 5 People pages, `intake`, `delegations`, `boxes`) |
| `Topbar` / `BottomStrip` | every page (chrome) |
| The People-page primitive | `leads`, `clients`, `coworkers`, `contacts`, `venues` |
| `connectors.js` channel catalog | `delegations`, `grid` ChatRail, `intake`, `boxes` |
| `mission_control_loader.js` | every page that reads `MissionControl.*` (effectively all) |
| `ai_instructions.js` system-prompt assembly | `grid` ChatRail, `intake` ask |
| Any new `/api/*` endpoint | the page that calls it + sitemap entry + `CONNECTIONS.md` if it's external |
| `lucide.js` icons | every page (bump cache-buster) |
| `styles.css` | every page (bump cache-buster) |
| `Secretary.html` cache-busters | nothing else — but **every JS/CSS edit must bump its `?v=` here** (`DEC-2026-04-29-007`) |

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
- a widget moves from single-page to multi-page (promote to §3)
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
| Widget promoted single-page → multi-page | §3 |
| New `/api/*` endpoint with ≥1 page consumer | §4 |
| New `window.SecretaryX` service | §5 |
| New shared `localStorage` key | §6.1 |
| New `window` event | §6.2 |
| Cross-page side effect introduced | §7 |
| Single-page-only change | sitemap only — not this ledger |

---

## 13. Final Operating Rule

> The sitemap owns **what's on each page**.
>
> This ledger owns **what spans the pages**.
>
> When they disagree on per-page detail, the sitemap wins. When you need to know which pages share a widget, this ledger is the answer.

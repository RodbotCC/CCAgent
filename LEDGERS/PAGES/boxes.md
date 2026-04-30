# Page Ledger — `boxes`

Last updated: 2026-04-29 (initial creation — Phase 16; first Page Ledger; tier: domain; envelope-aware under `DEC-2026-04-29-013`)
Route: `boxes`
Primary component: `BoxesScreen` in `screens.jsx`
Owner file: `screens.jsx`
Page status: **active** + **generated-view** + **high-risk**
Risk level: **high** — page can visually imply truth that isn't there; right-click actions can hand off to delegations (which can reach customer-facing channels)
Tier (Box Bus Ledger §3): **domain** — fans out only to Boxes that subscribe to UI / page domain
Sitemap section: [`page_asset_sitemap.md` §boxes](../../page_asset_sitemap.md) — **canonical operational truth** (UI Done Gate, `DEC-2026-04-29-007`)
Related widgets: dossier renderer (`boxes-md-rich`), specialized renderers (`hugo_casillas`, `brenda_steve`), completeness rail, mismatch diagnostics, right-click handoff to Delegations + Intake
Related APIs: `GET /api/boxes/list`, `GET /api/boxes/<id>`, `GET /api/boxes/<id>/html`, `GET /api/boxes/<id>/template/<slug>`
Related Done Gate: `DEFINITION_OF_DONE.md` §5.3 (Page / Route Work) + this ledger §10 (local-stricter)
Maintainer: Jake / Comeketo Agent project agents

> The page-asset sitemap §boxes carries the operational truth — what's on this page, what's owned where, what was done last.
>
> This ledger carries the **why** — why Hugo and Brenda have specialized renderers and the other 26 don't, why dossier rendering moved from markdown-dump to design-kit narrative cards, why completeness scoring landed when it did, and where this page is heading.

---

## 1. Page Purpose

The `boxes` page is the **dossier / read surface for Box data**. It's where operators and agents inspect Client Boxes (28), Staff Boxes (10), and orchestrator state HTML in a single UI surface — and decide whether the box is ready, stale, incomplete, or needs action.

It is **not** an editing surface. Per `DEC-2026-04-29-005`, Box Reports are synthesized views — there is no separate "Box on the Boxes page vs Box on disk" — the page renders what's in `Auto/Client Boxes/<Name>/` and `Auto/Staff Boxes/<Name>/` directly.

It is **not** a source of truth. Per `SOURCE_OF_TRUTH.md` §3.1, customer-facing copy must ground in `01b_comms_verbatim.md` / `01_comms.md` / approved operator notes. The Boxes page renders profile and enrichment, but those are **internal-only** — never customer-facing copy.

The page is the dominant orientation surface for any Comeketo automation work. If automation is the engine, Client Boxes are the fuel, and this page is how the operator looks at the gauge.

---

## 2. User / Operator Use Case

Operators (Andre, Jake, eventually other Comeketo team members) and agents use this page to answer:

- **What's in the box?** Quick read of meta, comms, profile, plan, alerts.
- **Is it ready?** Completeness rail (`thin / partial / strong`) + checklist scoring.
- **Is it fresh?** Last sweep timestamp, last inbound, plan-day cadence.
- **Is the plan still valid?** Reply gate, calendar reality, frequency cap.
- **What action is recommended?** Per-box next-action guidance + Andre alerts.
- **Should this hand off?** Right-click → Intake report (`Open as Intake Report →`) or Delegations draft.
- **Is anything misaligned?** Mismatch diagnostics surface unlinked box folders + people without canonical boxes.

Per the draft outline, the boxes page is among the highest-risk in the project because it can **visually imply truth that isn't there.** A box that displays "completeness: strong" with stale comms gives a confidence the underlying data doesn't earn. The completeness rail mitigates this; the operator's discipline closes the rest.

---

## 3. Route + Render Ownership

| Layer | Owner |
|---|---|
| Route registration | `app.jsx` `KNOWN_SCREENS` + route switch |
| Primary component | `BoxesScreen` in `screens.jsx` |
| Topbar chip | `components.jsx` (`layers` icon) |
| Dossier renderer | `boxes-md-rich` markdown-first renderer in `components.jsx` |
| Specialized renderers | `hugo_casillas` and `brenda_steve` in `components.jsx` / `screens.jsx` |
| Right-click context menu | `useContextMenu` hook in `components.jsx` |
| Server endpoints | `server.py` `_boxes_*` family |
| Loader binding | `mission_control_loader.js` (`fBoxes`) → `MissionControl.boxes`, `boxesById`, `boxesGrouped`, `boxesMismatch` |

`BoxesScreen` accepts a `selectId` prop (wired through `app.jsx` from `route.selectId`) so the reverse handoff from Intake's "open in boxes →" button lands directly on the chosen box. Per `DEC-2026-04-29-006`, `selectId` is the box id directly (`hugo_casillas`, `brenda_steve`, etc.) — no synthetic prefix.

---

## 4. Data Sources + APIs

**Data sources** (read-only):
- `Auto/Client Boxes/<Name>/` — 28 client folders (canonical per `SOURCE_OF_TRUTH.md` §3.1)
- `Auto/Staff Boxes/<Name>/` — 10 staff folders
- `Auto/orchestrator/state/*.html` — generated orchestrator snapshots (per-lead rollups)

**APIs:**

| Endpoint | Purpose |
|---|---|
| `GET /api/boxes/list` | List all boxes with completeness + grouping |
| `GET /api/boxes/<id>` | One box's parsed sections (state, comms, profile, plan, alerts, agents, logic, enrichment markdown, agents markdown) |
| `GET /api/boxes/<id>/html` | Pre-rendered orchestrator state HTML for the box |
| `GET /api/boxes/<id>/template/<slug>` | Virtual templates: `overview`, `checklist`, `action_board` (server-generated) |

**Loader-side** (`mission_control_loader.js` `fBoxes`):
- hydrates `MissionControl.boxes`, `boxesById`, `boxesGrouped`, `boxesMismatch`
- exposes `window.MissionControlRefreshBoxes()` for the boxes page's manual refresh

---

## 5. Writes / Side Effects

The `boxes` page is **read-mostly**. Direct writes are limited to:

- **Right-click → "Open as Intake Report →"** — navigates to `intake` page with `openSlug=<box_id>`. Read-only on Box; the Intake page may then ingest (which writes into `Auto/Client Boxes/<Name>/intake_drops/<file>` per `DEC-2026-04-29-005..008`).
- **Right-click → Delegation draft** (`sendToDelegationsDraft`) — creates a delegation draft with section text. The draft itself is the write; the box folder is unchanged.

**Indirect writes through other paths** (not initiated by this page):
- `Auto/orchestrator/bin/comms_state_sweep.py` updates `01_comms.md`, `00_meta.json`, `client_ledger.md` — not page-driven; the page just shows the result.
- Per-Box `<YYYY-MM-DD>_audit_marker.md` is written by audit sessions, not the page.

The page does **not** edit canonical box files directly. If that ever changes, `Page status` flips from `generated-view` to `source-editing` and risk re-evaluates.

---

## 6. Source-of-Truth Rules

Per `SOURCE_OF_TRUTH.md` §3.1 (Client Truth ordering):

| Rank | Source | This page renders it as |
|---|---|---|
| 1 | Close.com API | Not directly — see rank 2 |
| 2 | `01b_comms_verbatim.md` | Verbatim file exists in every box but **not yet UI-bound** (`PROB`-shaped — known gap; future second comms tab) |
| 3 | `comms/<type>_<date>_<id>.json` | Read by server for parsing; not directly rendered |
| 4 | `01_comms.md` | Curated comms section in dossier |
| 5 | `00_meta.json` | Top metadata fact-pills + readiness bar |
| 6 | `client_ledger.md` | Logic / state section |
| 7 | `<YYYY-MM-DD>_audit_marker.md` | Logic section (when present) |
| 8 | `04_profile.md`, `*_enrichment.md` | Profile + enrichment sections — **internal-only** |
| 9 | `05_seven_day_plan.md` | Plan section — **strategy draft, never truth** |

**Hard rule on this page:** profile + enrichment sections must be visually labeled "internal" (the renderer phrases enrichment as "operationally usable context vs protected/off-limits context" per the 2026-04-27 lead-dossier mode pass). The plan section must be visually labeled "strategy draft." The page can render these sections — but the operator and any automation reading them must obey `SOURCE_OF_TRUTH.md` §3.1 and the Allowed-To-Know schema in §4.

---

## 7. Widgets On This Page

Per sitemap §boxes (canonical) + Asset/Widget Map §3:

- **Roster/detail mode** — focused-pair view with explicit back-to-roster
- **Search + refresh/poll controls**
- **Unified section nav** — `state / profile / comms / enrichment / 7-day plan / agents / logic` inside one panel
- **In-site dossier reader** — markdown-first, design-kit cards, admonition styling (`boxes-md-rich`)
- **Specialized renderer slots** — `hugo_casillas` + `brenda_steve` with custom layouts (other 26 use generic)
- **Right-click context menu** — section text/name copy, send-section-to-delegations, "Open as Intake Report →"
- **Per-box completeness rail** — `thin / partial / strong` color-coded
- **Horizontal rails** — used only for compact checklist navigation (primary reading is vertical)
- **Mismatch diagnostics** — unlinked box folders + people missing canonical boxes
- **Page-card launcher mode** — html files open in-panel as native pages

**Cross-page widgets used here** (per Asset/Widget Map §3):
- `Topbar`, `BottomStrip`, breadcrumbs (chrome)
- `useContextMenu` hook (right-click)
- `EditWithRodbotOverlay` (overlay-driven edits)
- `AIBanner` (status)

---

## 8. Supported States

| State | When | Render |
|---|---|---|
| Roster | initial load, no box selected | grid of all boxes grouped by class (Client / Staff / Orchestrator) with completeness color-coding |
| Detail | a box selected | focused-pair view; roster hidden behind back action |
| Specialized | `hugo_casillas` or `brenda_steve` selected | custom layout overrides generic dossier |
| Page-card mode | a per-box html template (`overview` / `checklist` / `action_board`) selected | html opens in-panel as a native page |
| Mismatch | `boxesMismatch` non-empty | diagnostics surface above roster |
| Empty | bedrock not loaded yet | skeleton placeholder (loader hydration in progress) |
| Error | `MissionControl.boxesError` set | error surface with retry |

The lead-dossier mode (2026-04-27 pass) added the **starter-workset filter** for the first 10 target leads — a roster filter that hides everything but those 10. This is a UI convenience, not a source-of-truth claim.

---

## 9. Page-Specific Guardrails

**Beyond the global guardrails in `Auto/comeketo-inbox/SKILL.md` and `Guardrails.html`:**

1. **Profile / enrichment sections are internal-only.** Never render in a way that reads as customer-facing. The renderer labels these explicitly.
2. **Plan sections are strategy drafts.** Never render in a way that implies the plan is what *will* happen. Reply gate + frequency cap + calendar reality must be visible.
3. **Right-click → Delegations** can route section text to a customer-facing channel. The Delegations page applies its own guardrails before send (per `Auto/comeketo-inbox/`); this page is responsible for **not silently embellishing** what the operator chose to send.
4. **Mismatch diagnostics are warnings, not errors.** A box folder with no canonical lead in `MissionControl.boxes` is a config-discovery issue (covered in `OPEN_PROBLEMS_LEDGER.md` family), not a render failure. The page surfaces the mismatch but still loads what it can.
5. **Verbatim comms (`01b_comms_verbatim.md`) is not yet UI-bound.** Until it is, the operator must know that `01_comms.md` (rank 4) is rendered, not `01b_comms_verbatim.md` (rank 2). When verbatim binding lands, this guardrail sunsets.

---

## 10. Page Done Gate (local-stricter than DoD §5.3)

A change to this page is done when DoD §5.3 + the additions below all pass:

- [ ] All DoD §5.3 boxes (route still maps, asset ownership updated, etc.)
- [ ] `page_asset_sitemap.md` §boxes updated (Asset Ownership / Change Checklist / History / Last Verified)
- [ ] If the dossier renderer changed: spot-checked against at least 3 client boxes (one specialized — Hugo or Brenda — and two generic)
- [ ] If a new specialized renderer is added: registered in `BoxesScreen` AND documented under `BOX_LEDGER.md` per-Client conventions AND added to Asset/Widget Map §3.5
- [ ] If a new section in the section-nav is added: server-side `/api/boxes/<id>` returns it, mission_control_loader hydrates it, mismatch diagnostics still parse cleanly
- [ ] If a new right-click action is added: cross-referenced in Asset/Widget Map §3.3 (`useContextMenu` wired surfaces) and Delegations page sitemap §delegations
- [ ] If completeness scoring logic changed: spot-checked against at least one `thin`, one `partial`, one `strong` box
- [ ] Cache-busters bumped in `Secretary.html` for any touched JS/CSS
- [ ] This Page Ledger §12 (Recent Changes) appended

---

## 11. Open Page Problems

Cross-references into `OPEN_PROBLEMS_LEDGER.md` and currently-known issues specific to this page:

- **Verbatim comms not UI-bound.** `01b_comms_verbatim.md` exists in every box (582 raw payloads as of 2026-04-28) but the page renders `01_comms.md` only. Future second comms tab is the obvious move. Rank-2 source-of-truth content is invisible to the operator on this page right now.
- **Specialized renderers exist for 2 of 28 client boxes.** Hugo + Brenda have custom layouts; the other 26 use the generic `boxes-md-rich`. Not a defect — generic rendering is fine for most — but worth flagging that the specialized pattern doesn't scale by default.
- **Allowed-To-Know schema rendering pending** (`PROB-2026-04-28-001` partial). Schema landed in `SOURCE_OF_TRUTH.md` §4.2; per-Box `allowed_to_use.json` files don't exist yet; the Boxes page doesn't yet honor the four-bucket model in profile/enrichment rendering. When the schema lands per-Box (Hugo first), the page renderer should label sections by bucket.
- **Page can visually imply truth.** Mitigated by completeness rail + internal/strategy labels, but not eliminated. Operators still have to read the labels.
- **Plan staleness rendering.** A box where the plan was authored 4 days ago and the client replied 1 day ago should *visually* indicate plan-stale state. Today's renderer relies on the operator catching this from the cadence + last-inbound timestamps. A more explicit stale-plan banner is future work.

---

## 12. Recent Page Changes (narrative)

Sitemap §boxes carries the commit-style history (date + tactical change). This section carries the **why** behind those changes.

### 2026-04-29 — Phase 1 Intake → Box unification

The Boxes page gained a right-click → "Open as Intake Report →" action that navigates to the Intake page with `openSlug=<box_id>`. The reverse handoff from Intake's "open in boxes →" lands here on the chosen box via `selectId` prop. Why this matters: the project's two-canonical-surfaces problem (Intake had Workspaces; Boxes had Client Boxes) was resolved by making Box Reports synthesized views (`DEC-2026-04-29-005`), with one identity per Box across the app (`DEC-2026-04-29-006`), refreshed on every read (`DEC-2026-04-29-007`). The Boxes page is now the operating surface; the Intake page is the chat surface for the same Box. Two views, one Box. Cache-busts: `screens.jsx` 94→95, `app.jsx` 52→53.

### 2026-04-28 — Verbatim comms backfill (structurally complete; not UI-bound)

All 28 Client Boxes received `01b_comms_verbatim.md` (chronological full Close.com transcripts) + `comms/*.json` (raw payloads — 582 across 28 leads). The Boxes page does not yet render `01b_comms_verbatim.md`. The verbatim file is now the rank-2 source-of-truth (per `SOURCE_OF_TRUTH.md` §3.1) but the page still reads `01_comms.md` (rank 4). When the second comms tab lands, this becomes a major page upgrade.

### 2026-04-27 — Why specialized renderers exist (Hugo + Brenda)

The first two client boxes to receive deep attention (Hugo Casillas — top altitude / whale + active cadence; Brenda & Steve — first explicit audit pass with audit marker) revealed that the generic markdown-dump renderer didn't surface the right facts at the right altitude. Each got a custom layout. The pattern is reusable but **not auto-applied** — the cost of authoring a specialized renderer is real and only earned for boxes that justify it. As of 2026-04-29, only these two have specialized layouts.

### 2026-04-27 — Markdown-dump → design-kit narrative renderer

The original renderer dumped section markdown raw. This made completeness hard to read at a glance; sections looked uniform when they weren't. The renderer pass replaced raw markdown with `boxes-md-rich`: design-kit cards, admonition blockquotes, panelized section cards, design-kit text rhythm. **Result:** sections now visually carry their type (canonical / strategy / internal / generated) — which is the substrate that makes the §9 page-specific guardrails enforceable in operator practice.

### 2026-04-27 — Completeness scoring (`thin / partial / strong`)

Each box now gets a per-section completeness score. Health color-coding on list + detail. **Why:** without this, the operator couldn't tell at a glance which boxes were ready vs which were nominally populated but actually thin. The scoring is rough (heuristic, not formal) and improves as the underlying section schemas stabilize.

### 2026-04-27 — Lead-dossier mode (focused navigation)

Roster gets hidden after a box is selected; explicit back action restores it. Section model expanded to `state / comms / profile / enrichment / 7-day plan / agents / logic`. State auto-derived as last 5 touch bullets from comms. Enrichment phrased as "operationally usable context vs protected/off-limits context" — this **is the language convention** that operationalizes the Allowed-To-Know boundary on this page (before the schema landed in `SOURCE_OF_TRUTH.md` §4).

### 2026-04-27 — Initial runtime + layout simplification

First boxes runtime pass introduced direct Auto-source APIs and a top-level Boxes page. Second pass (same day) merged the navigation + content into a single panel; html files now open in-panel as native pages (page-card launcher mode) instead of a separate side-panel iframe.

---

## 13. Architectural Rationale

**Why the Boxes page is read-mostly:** canonical truth lives in `Auto/Client Boxes/<Name>/`, written by orchestrator scripts (`comms_state_sweep.py`) and operator audit passes. Letting the page edit canonical files directly would create a drift surface — UI edits diverging from script-driven state. Per `DEC-2026-04-29-005`, synthesized views beat copies.

**Why the section model is unified instead of tabs:** operator scrolling beats operator clicking when reading a dossier. Tabs hide content; vertical reading reveals it. Horizontal rails are reserved for compact checklist nav.

**Why specialized renderers are opt-in instead of default:** authoring a specialized layout is real work. Reserving it for high-altitude / high-touch boxes means the work earns its keep. As more boxes need specialized handling (e.g., once Allowed-To-Know rendering is wired), the pattern can scale; for now, two specialized + 26 generic is the right ratio.

**Why completeness scoring is heuristic:** formal completeness is a moving target — sections evolve, new fields land, the schema is still maturing. Heuristic scoring with `thin / partial / strong` gives the operator a useful signal without pretending to a precision the data doesn't support.

**Why the page is in the "shining star" arc:** per Jake's stated direction, Boxes will be the canonical surface for the project's eventual reactive-network architecture (`DEC-2026-04-29-013`). When Phase C runtime lands, every Client Box will be a runtime Box with manifest + subscriptions + emits. This page is the operator's window into that.

---

## 14. Related Ledgers / Files

- **Sitemap** — [`page_asset_sitemap.md` §boxes](../../page_asset_sitemap.md) — canonical operational truth.
- **Asset/Widget Map** — [`ASSET_WIDGET_MAP.md`](../ASSET_WIDGET_MAP.md) §3 (shared widgets), §4.2 (boxes APIs).
- **File Contents** — [`FILE_CONTENTS.md`](../FILE_CONTENTS.md) §6 (`screens.jsx`, `components.jsx`, `mission_control_loader.js`), §11 (bedrock indexes), §12 (Client Box convention).
- **Box Ledger** — [`BOX_LEDGER.md`](../BOX_LEDGER.md) — what a Box is.
- **Box Bus Ledger** — [`BOX_BUS_LEDGER.md`](../BOX_BUS_LEDGER.md) §2.1 — manifest schema for the eventual runtime; §7 worked example is Hugo Casillas.
- **Source-of-Truth** — [`SOURCE_OF_TRUTH.md`](../SOURCE_OF_TRUTH.md) §3.1 (client truth ordering), §4 (Allowed-To-Know schema).
- **Connections** — [`CONNECTIONS.md`](../CONNECTIONS.md) `close` (the data ultimately comes from Close API via comms_state_sweep), `cowork_scheduled_tasks` (sweep cadence).
- **Decisions** — `DEC-2026-04-29-005` (Box Reports synthesized), `DEC-2026-04-29-006` (one identity per Box), `DEC-2026-04-29-007` (Box Reports refresh on read), `DEC-2026-04-29-008` (Phase 1 Intake-Box read-mostly).
- **Definition of Done** — [`DEFINITION_OF_DONE.md`](../DEFINITION_OF_DONE.md) §5.3 (Page / Route Work) — this Page Ledger §10 is local-stricter.
- **Open Problems** — `PROB-2026-04-28-001` (Allowed-To-Know rendering pending), recurring patterns around plan-vs-comms staleness.

---

## 15. Future Direction

**Near-term (next 1–2 sprints):**
- Wire `01b_comms_verbatim.md` as a second comms tab. Closes the rank-2-not-rendered gap.
- Author `allowed_to_use.json` for Hugo Casillas as the first per-Box Allowed-To-Know instance. Page renderer labels profile / enrichment sections by bucket.
- Add explicit plan-stale banner when reply-after-plan is detected.

**Medium-term (Phase B sub-agent fleet):**
- A Boxes-page steward agent that audits each box's render output against its source files weekly. Catches drift between `01_comms.md` summary and `01b_comms_verbatim.md` content.
- Per-Box specialized renderer registry — codify the pattern so adding a new specialized renderer is a one-file change.

**Long-term (Phase C — Reactive Box Network runtime):**
- Each Client Box becomes a runtime Box with `box.json` manifest. The Boxes page becomes the operator's window into the live network — surfacing not just static state but live subscription events, propagation receipts, and per-Box steward run summaries. The sitemap entry for this page will need to grow Asset Ownership rows for runtime surfaces; the manifest stub gate from DoD §5.7 becomes hard-enforced for any Box rendered here.

---

## 16. Final Operating Rule

> The Boxes page is the operator's window into the most truth-sensitive surface in the project.
>
> Render rules — internal vs strategy vs canonical — are not decoration. They are the substrate that makes safe automation possible.
>
> Sitemap wins on what's there. This ledger wins on why.

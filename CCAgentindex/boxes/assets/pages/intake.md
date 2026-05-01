# Page Ledger — `intake`

Last updated: 2026-04-29 (initial creation — Phase 17; second Page Ledger; tier: domain; envelope-aware under `DEC-2026-04-29-013`)
Route: `intake`
Primary component: `IntakeScreen` in `screens.jsx` (with `IntakeReportsList`, `IntakeReportDetail`, `IntakeDocumentCard`)
Owner file: `screens.jsx`
Page status: **active** + **write-capable** + **medium-high risk**
Risk level: **medium-high** — page can ingest documents into Client Box folders, run LLM Q&A (cost), and create delegation drafts that reach customer-facing channels
Tier (Box Bus Ledger §3): **domain** — fans out only to Boxes that subscribe to UI / page domain
Sitemap section: [`page_asset_sitemap.md` §intake](../../page_asset_sitemap.md) — **canonical operational truth** (UI Done Gate, `DEC-2026-04-29-007`)
Related widgets: reports list (split), report-detail dropzone, document cards, Q&A panel, "open in boxes →" handoff pill, right-click context menus
Related APIs: `GET /api/reports/list`, `POST /api/reports/create`, `POST /api/reports/delete`, `GET /api/reports/get?slug=<id>`, `POST /api/attachments/upload` + `/api/reports/<slug>/ingest`, `POST /api/reports/<slug>/ask`, `POST /api/reports/<slug>/documents/<id>/delete`
Related Done Gate: `DEFINITION_OF_DONE.md` §5.3 (Page / Route Work) + this ledger §10 (local-stricter)
Maintainer: Jake / Comeketo Agent project agents

> The Boxes page is the **operating** surface for a Client Box.
>
> The Intake page is the **chat / ingest** surface for the same Client Box — plus general-purpose workspaces for non-box documents.
>
> Per `DEC-2026-04-29-005..008`, these are **two views, one Box.** When a Box changes, both views reflect it on the next read. There is no second canonical surface to drift against.

---

## 1. Page Purpose

The `intake` page is the **document-ingest + Q&A surface** for two kinds of reports:

- **Box Reports** — one per Client Box, auto-derived. Synthesized on every read from `Auto/Client Boxes/<Name>/`. There is no separate "Box Report on disk" — the Box folder *is* the Box Report (`DEC-2026-04-29-005`).
- **Workspaces** — manually-created general-purpose smorgasbord reports. Persist to their own `report.json`. Used for documents that don't belong to a specific Client Box (vendor specs, tasting menus, contracts, scratchpad research).

The split is the load-bearing Phase 1 architecture: Box Reports refresh on read (`DEC-2026-04-29-007`); Workspaces persist their own state. Slug equals box id directly for Box Reports — no synthetic prefix (`DEC-2026-04-29-006`).

The page is **not** an editing surface for canonical Box content. Ingest writes into `Auto/Client Boxes/<Name>/intake_drops/<file>`, which is a per-Box drop directory — not a canonical section. Operators can reference dropped files in Q&A; canonical Box state is unchanged.

---

## 2. User / Operator Use Case

Operators (Andre, Jake, eventually other Comeketo team) and agents use this page to:

- **Drop a document for a specific client.** Land a vendor quote PDF, a tasting feedback doc, an email thread export — into the right Client Box without leaving the chat surface.
- **Ask questions about a client.** "What did Hugo say about pricing?" "When is Brenda's tasting?" The Q&A panel runs against the synthesized Box Report.
- **Drop documents that don't belong to a specific client.** Workspaces hold these — vendor specs, internal policy drafts, training materials.
- **Hand off to delegations.** Right-click on a document or Q&A turn → "Send to delegations" creates an editable delegation draft.
- **Jump back to the Box's operating view.** Box Report header carries an "open in boxes →" pill (passes the box id; lands directly on the chosen box per `BoxesScreen` `selectId` prop).

**The architectural insight** (per `DEC-2026-04-29-005`): before Phase 1 unification, Intake had Workspaces and Boxes had Client Boxes — two parallel canonical surfaces with drift risk. The unification collapsed this by making Box Reports synthesized views over the Box folder. There's still **one** Box; Intake and Boxes are just two windows into it.

---

## 3. Route + Render Ownership

| Layer | Owner |
|---|---|
| Route registration | `app.jsx` `KNOWN_SCREENS` + route switch; passes `route.openSlug` into `IntakeScreen` |
| Primary component | `IntakeScreen` in `screens.jsx` |
| List sub-component | `IntakeReportsList` (handles split rendering: Box Reports + Workspaces) |
| Detail sub-component | `IntakeReportDetail` (dropzone + document cards + Q&A panel) |
| Document card sub-component | `IntakeDocumentCard` |
| Topbar chip | `components.jsx` (intake icon) |
| Right-click context menus | `useContextMenu` hook in `components.jsx` (per `ASSET_WIDGET_MAP.md` §3.3) |
| Server endpoints | `server.py` `_reports_*` family (Workspaces) + `_box_report_*` family (Box Reports — added 2026-04-29) |
| Synthesized-view path | `server.py` `_box_report_synthesize` walks `Auto/Client Boxes/<Name>/` on every `/api/reports/get` |

**Cross-page handoffs:**
- **From Boxes page:** right-click a Client Box → "Open as Intake Report →" → navigates here with `openSlug=<box_id>`.
- **To Boxes page:** "open in boxes →" pill in Box Report header → navigates to boxes route with `selectId=<box_id>`.

---

## 4. Data Sources + APIs

### Data sources

- **Box Reports:** `Auto/Client Boxes/<Name>/` (28 client folders) — synthesized on every read. No `report.json` is written into the box folder.
- **Workspaces:** `CCAgentindex/reports/<slug>/report.json` — persists to disk; written through `_reports_save`.
- **Conversation history (Box Reports):** `CCAgentindex/reports/_box_conversations/<box_id>.jsonl` — Q&A turns appended per box.
- **Conversation history (Workspaces):** stored inside the workspace's `report.json`.
- **Ingest drops (Box Reports):** `Auto/Client Boxes/<Name>/intake_drops/<file>` — write target for box-report ingests. **The Box stays the only writer of canonical content** (`DEC-2026-04-29-005`).
- **Ingest drops (Workspaces):** workspace document storage (per `_reports_root()` `<slug>/<doc_id>`).

### APIs

| Endpoint | Method | Purpose | Box-Report behavior | Workspace behavior |
|---|---|---|---|---|
| `/api/reports/list` | GET | List all reports | Returns `{items, box_reports}` — split shape | Same payload |
| `/api/reports/create` | POST | Create new report | **405 — refuses slugs that collide with Client Box ids** (per `DEC-2026-04-29-006`) | Creates workspace |
| `/api/reports/delete` | POST | Delete report | **405 — Box Reports exist iff their box exists** | Deletes workspace |
| `/api/reports/get?slug=<id>` | GET | Read report | Synthesized via `_box_report_synthesize` walking `Auto/Client Boxes/<Name>/` | Loads `report.json` |
| `/api/attachments/upload` | POST | Upload file (any) | (shared) | (shared) |
| `/api/reports/<slug>/ingest` | POST | Attach file to report | **Writes to `Auto/Client Boxes/<Name>/intake_drops/<file>`** | Writes to workspace doc store |
| `/api/reports/<slug>/ask` | POST | Q&A turn | **Generic ask path** (box-aware agent config deferred to Phase 2 per `DEC-2026-04-29-008`) | Generic ask path |
| `/api/reports/<slug>/documents/<id>/delete` | POST | Delete document | **405 with guidance** — Box-Report docs not deletable through this surface | Deletes workspace doc |

**Per-report ingest lock** (added 2026-04-27 hardening pass): prevents threaded write races during multi-file drops.

**Image OCR** (added 2026-04-27): provider vision path (uses the active Settings provider — Claude Code / OpenAI / Codex CLI) for image-only documents.

**Format support:** `pdf`, `txt`, `md`, `csv`, `json`, `xlsx`, `xls` (with guidance fallback), `docx`, `doc` (with guidance fallback), `html`, `js`, `ts`, `yaml`, `xml`, `jsonl`, plus image OCR.

---

## 5. Writes / Side Effects

### Box Report writes

| Write | Target | Notes |
|---|---|---|
| Ingest a document | `Auto/Client Boxes/<Name>/intake_drops/<file>` | The Box stays the only writer of canonical content. `intake_drops/` is the per-Box drop directory — not a canonical section, but it lives inside the Box. |
| Q&A turn | `CCAgentindex/reports/_box_conversations/<box_id>.jsonl` (append-only) | Conversation history is *not* written into the Box. |
| Create | **refused** (405) | Box Reports exist iff their box exists. |
| Delete | **refused** (405) | Same. |
| Document delete | **refused** (405) with guidance | Operator must delete the file from `intake_drops/` directly if needed. |

### Workspace writes

| Write | Target |
|---|---|
| Create | new `CCAgentindex/reports/<slug>/report.json` |
| Ingest | workspace doc store |
| Q&A turn | inside `report.json` |
| Delete | removes `<slug>/` directory |
| Document delete | removes from workspace doc store |

### Side-effect risk

- **Medium-high.** Document ingest writes into Client Box folders, which then become visible to the orchestrator and any future scheduled fires. A bad-content drop into the wrong box won't auto-send — but it can confuse an automation that reads `intake_drops/` (none today, but the drop directory is reserved for that future).
- **Q&A is paid.** Each ask call costs API tokens (OpenAI / Claude / Codex CLI per Settings provider). Bulk Q&A on Box Reports across many boxes is real money.
- **Delegation handoff** routes section text or Q&A turns into a delegation draft, which can then send to customer-facing channels via `connectors.js`. Per `Auto/comeketo-inbox/SKILL.md`, the delegations page applies its own guardrails before any send — but this page is responsible for not silently embellishing what the operator chose to send.

---

## 6. Source-of-Truth Rules

Per `SOURCE_OF_TRUTH.md` §3.1 (Client Truth ordering), this page renders Box Reports as **synthesized views** over Box content. The trust ordering is identical to the Boxes page:

| Rank | Source | Renders here as |
|---|---|---|
| 2 | `01b_comms_verbatim.md` | Available via Box folder walk; not yet UI-bound on this page either |
| 3 | `comms/<type>_<date>_<id>.json` | Read by server for parsing; not directly rendered |
| 4 | `01_comms.md` | Q&A context (LLM reads this when asked about comms) |
| 5 | `00_meta.json` | Top metadata in Box Report card |
| 6 | `client_ledger.md` | Q&A context |
| 7 | `<YYYY-MM-DD>_audit_marker.md` | Q&A context |
| 8 | `04_profile.md`, `*_enrichment.md` | Q&A context — **internal-only**; the Q&A response should not quote enrichment to a customer-facing recipient |
| 9 | `05_seven_day_plan.md` | Q&A context — **strategy draft**; same caveat |

**Ingest drops are NOT in the trust ordering.** Documents dropped via this page land in `intake_drops/` and are **operator-supplied context** for Q&A. They're not canonical client truth — they're reference material the operator chose to make available. The Q&A LLM can use them, but the same allowed-to-know rules apply: a dropped vendor quote isn't a customer-facing fact unless it was discussed in comms.

---

## 7. Widgets On This Page

Per sitemap §intake (canonical) + Asset/Widget Map §3:

- **Reports list (split)** — Box Reports section (28 entries, auto, top) + Workspaces section (manual, below). Split shape returned by `/api/reports/list`.
- **Create modal** — Workspaces only. Box Reports are auto-derived; the create modal refuses slugs that collide with Client Box ids.
- **Report detail dropzone** — sequential multi-file queue (per 2026-04-27 hardening) to prevent threaded write races.
- **Document cards** — `IntakeDocumentCard` per ingested file. Right-click: ask-from-doc, open-source, copy, remove.
- **Report Q&A panel** — chat-style interaction. Right-click on Q&A entries: re-ask, copy, send-to-delegations.
- **Box-Report-only header pill** — "open in boxes →" handoff to the Boxes page (passes the box id as `selectId`).

**Cross-page widgets used here** (per Asset/Widget Map §3):
- `Topbar`, `BottomStrip`, breadcrumbs (chrome)
- `useContextMenu` hook (right-click — wired across cards, documents, Q&A turns)
- `SecretaryConnectors` picker (via right-click → send-to-delegations)
- `AIBanner` (status — when LLM provider is unavailable)

---

## 8. Supported States

| State | When | Render |
|---|---|---|
| List view | initial load | split rendering — Box Reports section above Workspaces section |
| Detail view | report selected (slug routed) | dropzone + document cards + Q&A panel |
| Box Report detail | slug matches a Client Box id | "box report" eyebrow label + "open in boxes →" pill in header |
| Workspace detail | slug matches a workspace | standard report header + Create-able actions |
| Empty | no reports yet | empty state with create-Workspace CTA |
| Empty (Box Reports only) | bedrock not loaded yet | skeleton placeholder |
| Q&A in flight | ask submitted | thinking-trace metadata visible (preprocess model + selected provider) |
| Q&A error | provider failure | error surface with retry; selected Settings provider gets surfaced |
| Ingest in flight | upload+attach in progress | per-file progress; sequential queue prevents threaded races |
| Ingest collision | a slug-collision attempted on create | 405 with explanation pointing at the existing Client Box |

**Direct landing:** when arrived from Boxes via `openSlug=<box_id>` route param, the page lands directly on the Box Report detail view (not the list).

---

## 9. Page-Specific Guardrails

**Beyond the global guardrails in `Auto/comeketo-inbox/SKILL.md` and `Guardrails.html`:**

1. **Q&A responses must obey the Allowed-To-Know boundary** even though box-aware agent config is deferred (`DEC-2026-04-29-008`). Today the ask path uses generic prompt assembly; per-Box `AGENTS.md` and `04_profile.md` are not folded into the system prompt yet. **This means an operator asking "what should I tell Hugo?" today gets a generic LLM answer, not a Hugo-aware one.** Until Phase 2, the operator must apply the allowed-to-know discipline manually when reading Q&A output.
2. **Ingest drops do not become canonical content automatically.** A document dropped here lands in `intake_drops/` for reference — it is **not** a comms record, not a profile fact, not a client-confirmed truth. The Q&A LLM can read it; the operator must remember that "the Q&A said X based on the vendor PDF I dropped" is not the same as "the client said X."
3. **Sending Q&A turns to delegations is the highest-risk write on this page.** Right-click → "Send to delegations" routes the LLM-generated text into a delegation draft. The Delegations page applies its own guardrails before send — but the operator should treat any LLM output as **draft material**, never finalized customer copy.
4. **Box Report identity is one-to-one with Client Box id.** The slug-collision refusal on `/api/reports/create` is enforcement of `DEC-2026-04-29-006` — there is one identity per Box across the app. Don't try to bypass this.
5. **Box Reports are read-on-demand.** A change to `Auto/Client Boxes/<Name>/01_comms.md` is reflected on the next `/api/reports/get` call. There is no caching layer to invalidate. Conversely, a Q&A response that was correct yesterday can be wrong today if the Box state shifted — operators should not treat past Q&A turns as durable truth.

---

## 10. Page Done Gate (local-stricter than DoD §5.3)

A change to this page is done when DoD §5.3 + the additions below all pass:

- [ ] All DoD §5.3 boxes (route still maps, asset ownership updated, etc.)
- [ ] `page_asset_sitemap.md` §intake updated (Asset Ownership / Change Checklist / History / Last Verified)
- [ ] If the synthesized-view path changed: spot-checked against ≥3 Client Boxes (one minimal — sparse content, two normal). Confirm Box folder content reflects in the synthesized payload.
- [ ] If a new ingest path was added: per-report lock still holds; multi-file queue still serializes; OCR fallback still works for image-only files.
- [ ] If a new Q&A capability was added: cost was estimated against bulk-ask-across-all-Box-Reports scenario. Provider-routing through `tweaks.aiProvider` was honored (no hardcoded provider).
- [ ] If the right-click menu changed: cross-referenced in `ASSET_WIDGET_MAP.md` §3.3 + `connectors.js` for any new send target.
- [ ] If `_box_report_*` server helpers changed: confirmed `DEC-2026-04-29-005..008` semantics still hold (synthesized-not-copied, slug=box_id, refresh-on-read, ask-path-stays-generic).
- [ ] If a new format was added to ingest support: extraction tested + `Settings` ledger noted if browser-use config involved.
- [ ] Cache-busters bumped in `Secretary.html` for any touched JS/CSS.
- [ ] This Page Ledger §12 (Recent Changes) appended.

---

## 11. Open Page Problems

Cross-references into `OPEN_PROBLEMS_LEDGER.md` and currently-known issues specific to this page:

- **Box-aware agent config is deferred** (`DEC-2026-04-29-008`). The ask path uses generic prompt assembly today. Per-Box `AGENTS.md`, `CLAUDE.md`, `06_logic.md`, `07_skills_used.md`, `08_automations.md` are read as documents but **not honored as operating contracts**. An operator asking "what should I tell Hugo?" gets a generic LLM answer, not a Hugo-aware one. Phase 2 work.
- **Per-Box analytics templates are deferred** (Phase 3 per `DEC-2026-04-29-008`). The Box Report detail view doesn't yet surface client-specific analytics (booking lead-time, source-channel attribution, etc.). When ledger system stabilizes further, per-Box analytics templates will land.
- **Allowed-To-Know rendering pending** (`PROB-2026-04-28-001` partial). Q&A LLM has access to profile + enrichment + plan today. Without an `allowed_to_use.json` per Box, the four-bucket model isn't enforced at Q&A time. Same gap as on the Boxes page; same fix path (Hugo first).
- **Q&A cost is unbounded.** No per-day or per-session cost cap on `/api/reports/<slug>/ask`. A user with a runaway script could easily rack up real cost. `tweaks.demoMode` doesn't currently block ask calls (it blocks connector writes only). Worth a future cost-cap consideration.
- **Box Report ingest doesn't trigger any orchestrator action.** A document dropped into `intake_drops/` is just sitting there. No automation reads from it today. This is fine *now*, but if a future automation starts watching `intake_drops/`, the operator should know that dropping a file becomes an action — not just a reference.

---

## 12. Recent Page Changes (narrative)

Sitemap §intake carries the commit-style history. This section carries the **why**.

### 2026-04-29 — Phase 1 Intake → Box unification (the load-bearing change)

The two-canonical-surfaces problem (Intake had Workspaces; Boxes had Client Boxes) was resolved. Box Reports are now synthesized views over `Auto/Client Boxes/<Name>/`, refreshed on every read, with slug = box id directly. Why this matters:

- **No drift surface.** A copy creates two records of the same content diverging silently. A synthesized view has no copy to drift against.
- **Triad-aligned.** The Box is the unit of state (`DEC-2026-04-29-001`); an Intake-side report cannot be a parallel Box.
- **One identity per Box across the app** (`DEC-2026-04-29-006`). The slug-collision refusal on `/api/reports/create` is the enforcement.
- **Refresh-on-read** (`DEC-2026-04-29-007`) — simplest answer that avoids a class of caching bugs.
- **Ask path stays generic** (`DEC-2026-04-29-008`) — Phase 1 ships the synthesis but defers per-Box agent-config plumbing to Phase 2. The reactive-box-bus / ledger trickle-down architecture is held until ledger taxonomy + sub-agent fleet stabilize (which became `DEC-2026-04-29-013` two days later).

Cross-navigation landed: Boxes-page right-click → "Open as Intake Report →" navigates here; Intake's Box Report header carries an "open in boxes →" pill that hands back. `BoxesScreen` accepts a `selectId` prop wired through `app.jsx`. Cache-busts: `screens.jsx` 94→95, `app.jsx` 52→53.

### 2026-04-27 — Preprocess model sync

The Q&A preprocessor (`/api/chat/preprocess`) used to default to a hardcoded mini model. Operators on GPT-5.4 saw their selected model used for the ask but the preprocessor silently downgraded to a smaller model — output drift. The fix: preprocessor now receives the selected Settings model and carries it through thinking-trace metadata. **Why it matters:** the Settings provider exclusivity rule (per `SETTINGS.md` §7) only works if every chat-shaped path honors `tweaks.aiProvider` + `tweaks.openaiModel`. Cache-bust: `screens.jsx` 92→93.

### 2026-04-27 — Delegations handoff wiring

Right-click menus on documents and Q&A turns gained "Send ... to delegations" actions. Why: previously, an operator who wanted to act on Q&A output had to copy text manually into Delegations. Now it's one click. Risk increased — LLM output can route to customer-facing channels in one click — which is why §9 guardrail #3 exists. Cache-bust: `screens.jsx` 75→76.

### 2026-04-27 — Right-click polish pass

Context menus added across `IntakeReportsList` cards, `IntakeReportDetail` document cards, and Q&A entries using the shared `useContextMenu` / `ContextMenu` primitives. Cards: open / copy / delete. Documents: ask-from-doc / open-source / copy / remove. Q&A entries: re-ask / copy. **Why:** before this pass, the page had inconsistent affordances — some actions only available via main UI, some only via keyboard. Right-click brings parity. The shared hook means the pattern is now reusable on any page (per `ASSET_WIDGET_MAP.md` §3.3). Cache-bust: `screens.jsx` 72→73.

### 2026-04-27 — Ingestion hardening + format expansion

Two wins in one pass: (a) per-report ingest locks added server-side to prevent threaded write races during multi-file drops; client-side queue serializes uploads; (b) format support broadened from PDF/text/CSV to include `xlsx/xls`, `docx/doc`, `html`, `js/ts`, `yaml/xml/jsonl`, plus image OCR via the active Settings provider's vision path. **Why:** operators were running into half-ingested reports during fast multi-file drags, and the format list felt arbitrarily narrow. Both removed friction without expanding risk. Cache-bust: `screens.jsx` 71→72.

### 2026-04-25 — Great trim

Removed `onAddCommitment` prop and any commitment-creation code paths (commitments page was retired in the great trim). Main intake import flow intact.

### 2026-04-25 — Initial mapping

First sitemap entry for the page.

---

## 13. Architectural Rationale

**Why the Reports list is split (Box Reports + Workspaces) instead of unified:** the two kinds have different lifecycles — Box Reports exist iff their box exists, can't be created or deleted from this surface, and refresh on read. Workspaces are operator-controlled. Mixing them in one list with create/delete actions for everything would make the slug-collision refusal feel like a bug instead of an architectural property. The split makes the **two-kinds-of-thing** visible.

**Why Box Reports are synthesized instead of stored:** per `DEC-2026-04-29-005`. A copy creates a drift surface. A synthesized view does not. The cost is one Box-folder walk per `/api/reports/get` call; that cost is acceptable because it's bounded and the Box is the only writer of canonical content (`DEC-2026-04-29-005` consequence).

**Why slug = box id directly:** per `DEC-2026-04-29-006`. One identity per Box across the app. A synthetic prefix (`box_<id>`) would have meant Intake and Boxes used different identifiers for the same thing — exactly the class of confusion the unification was solving.

**Why ask path stays generic in Phase 1:** per `DEC-2026-04-29-008`. The phasing rule protects against half-finished architecture. Plumbing each Box's `AGENTS.md` into the ask path requires reactive-box-bus runtime (deferred to Phase C per `DEC-2026-04-29-013`); doing it ad-hoc here would create a parallel non-bus implementation that re-wiring would have to rip out.

**Why ingest writes into the Box folder instead of a side store:** per `DEC-2026-04-29-005` consequence. The Box stays the only writer of canonical content. Storing ingests in `CCAgentindex/reports/<slug>/` for Box Reports would create a side store that the Box doesn't know about — the very drift surface unification eliminated. `intake_drops/` lives inside the Box, so the Box "knows" about drops by file-tree existence even without a section pointer to them.

**Why right-click menus instead of inline buttons:** density. The Reports list, document cards, and Q&A turns are dense surfaces. Inline buttons clutter; right-click reveals on demand. The shared `useContextMenu` hook makes the pattern reusable across pages without per-surface forking.

---

## 14. Related Ledgers / Files

- **Sitemap** — [`page_asset_sitemap.md` §intake](../../page_asset_sitemap.md) — canonical operational truth.
- **Asset/Widget Map** — [`ASSET_WIDGET_MAP.md`](../ASSET_WIDGET_MAP.md) §3.3 (`useContextMenu` wired here), §4.3 (Reports/Intake APIs), §3.7 (connectors picker via send-to-delegations).
- **File Contents** — [`FILE_CONTENTS.md`](../FILE_CONTENTS.md) §6 (`screens.jsx`, `components.jsx`), §7 (`server.py` `_reports_*` and `_box_report_*`), §11 (bedrock indexes — `CCAgentindex/reports/_box_conversations/`).
- **Box Ledger** — [`BOX_LEDGER.md`](../BOX_LEDGER.md) — what a Box is.
- **Box Bus Ledger** — [`BOX_BUS_LEDGER.md`](../BOX_BUS_LEDGER.md) §2.1 — manifest schema for the eventual runtime.
- **Source-of-Truth** — [`SOURCE_OF_TRUTH.md`](../SOURCE_OF_TRUTH.md) §3.1 (client truth), §4 (Allowed-To-Know schema — pending wiring on this page).
- **Connections** — [`CONNECTIONS.md`](../CONNECTIONS.md) `openai` / `claude_code` / `codex_cli` (Q&A LLM provider routing per `tweaks.aiProvider`).
- **Settings** — [`SETTINGS.md`](../SETTINGS.md) §3.3 (provider exclusivity), §3.4 (OpenAI model), §3.5 (Pieces model). The selected provider routes Q&A.
- **Decisions** — `DEC-2026-04-29-005` (Box Reports synthesized), `DEC-2026-04-29-006` (one identity per Box — slug = box id), `DEC-2026-04-29-007` (Box Reports refresh on read), `DEC-2026-04-29-008` (Phase 1 Intake-Box read-mostly; ask path stays generic).
- **Definition of Done** — [`DEFINITION_OF_DONE.md`](../DEFINITION_OF_DONE.md) §5.3 — this Page Ledger §10 is local-stricter.
- **Page Ledger — boxes** — [`boxes.md`](boxes.md) — the natural pair page.
- **Open Problems** — `PROB-2026-04-28-001` (partial — Allowed-To-Know rendering pending applies here too).

---

## 15. Future Direction

**Near-term (Phase 2 per `DEC-2026-04-29-008`):**
- Plumb per-Box `AGENTS.md` (and probably `CLAUDE.md`, `06_logic.md`, `07_skills_used.md`, `08_automations.md`) into the `/api/reports/<slug>/ask` system prompt when the slug matches a Client Box id. Operators asking about Hugo get Hugo-aware Q&A.
- Add per-Box analytics templates to the Box Report detail view (booking lead-time, source-channel attribution, conversation-intelligence flag-bearer signals).
- Wire Allowed-To-Know schema into the Q&A prompt — when `allowed_to_use.json` exists for a Box, the four-bucket model gets folded into the system prompt so the LLM honors the customer-facing-vs-internal boundary.

**Medium-term (Phase B sub-agent fleet):**
- An Intake-page steward that audits Q&A history weekly. Surfaces patterns: "Hugo's Q&A turns are increasingly asking about pricing — flag for Andre?"
- Per-Box `AGENTS.md` becomes a runnable agent's prompt, dispatched via `/api/agents/<box_id>/run` for richer workflows than chat allows.

**Long-term (Phase C — Reactive Box Network runtime):**
- Box Reports become a window into the live network. Q&A turns become routing events. An ingest into `intake_drops/` emits an event that automations can subscribe to (per `BOX_BUS_LEDGER.md` §2.1). The `intake_drops/` directory shifts from "operator reference material" to "automation input surface" — and the §9 guardrail #5 becomes load-bearing.

---

## 16. Final Operating Rule

> The Boxes page is where operators *look at* a Client Box.
>
> The Intake page is where operators *talk to* a Client Box and drop things into it.
>
> Both views render the same Box. Sitemap wins on what's there. This ledger wins on why.

# Intake → Box Unification — Implementation Plan (Phase 1 only)

Status: **draft, awaiting code-time approval**
Author session: 2026-04-29
Scope: Phase 1 only. Box agent-config plumbing, box-scoped analytics, and the reactive box-bus / ledger trickle-down architecture are explicitly **deferred** until the ledger system and sub-agent fleet are further along.

---

## 1. Intent

Today, Intake (`/api/reports/*`, the "Smorgasbord" page) and Boxes (`/api/boxes/*`, `Auto/Client Boxes/<Name>/`) are two separate surfaces over overlapping data. The `brenda_and_steve` workspace already proves the unification by accident — that report's documents are a hand-curated copy of Brenda's box files.

Phase 1 makes that pattern automatic and read-only. Every Client Box becomes addressable from the Intake page as a chat-able workspace, with no file copying and no drift surface.

What ships:

1. **Box Reports synthesis** — a Box Report is a synthesized view of a Client Box. No `report.json` written into the box. `/api/reports/get` reads the box folder on every call and assembles a `documents[]` payload that `IntakeReportDetail` already knows how to render.
2. **Reports list split** — the Intake landing page shows two sections: Box Reports (auto, from `/api/boxes/list`, client boxes only) on top, Workspaces (the existing manual reports) below.
3. **Intake uploads on Box Reports land in the box** — when the user drops a file on a Box Report, it writes to `Auto/Client Boxes/<Name>/intake_drops/<id>.<ext>`. The next read picks it up automatically because synthesis re-scans the folder.

What does **not** ship in Phase 1:

- Per-box `AGENTS.md` plumbed into `/api/reports/<slug>/ask` (the ask path stays generic).
- Box-scoped analytics templates.
- Staff Boxes as Box Reports (client only first).
- Any ledger routing, trickle-down, or reactive bus.
- Any new ledger files.

---

## 2. Decisions locked for this phase

Captured here so the Decisions Ledger entry that lands with the code is clean.

- **DEC-(pending): Box Reports = synthesized view, not a copy.** Box content is read on demand from `Auto/Client Boxes/<Name>/`. No mirror, no `report.json` inside boxes. Rationale: zero drift surface; the box stays the single source of truth.
- **DEC-(pending): One identity per box across the app.** Box Report slug = box `id` from `/api/boxes/list` (e.g., `client_box__hugo_casillas`). No new slug minted. Rationale: cross-surface navigation (Boxes ↔ Intake) becomes trivial; ledger references stay stable.
- **DEC-(pending): Refresh on read.** Box Reports re-read the folder every `/api/reports/get` call. Workspaces keep their stored `report.json`. Rationale: cheap, correct, no cache invalidation problem; revisit only if measurable.
- **DEC-(pending): Phase 1 is read-mostly.** Only ingest is allowed to write into a box (and only into `intake_drops/`). No deletion of synthesized documents, no editing of synthesized text from Intake.

---

## 3. Surfaces touched

Per `page_asset_sitemap.md` Done Gate, these are the surfaces that need updates when Phase 1 lands:

- `screens.jsx` — `IntakeReportsList` (split rendering), `IntakeReportDetail` (no change expected), context-menu handoffs.
- `server.py` — `/api/reports/list`, `/api/reports/get`, `/api/reports/<slug>/ingest`, `/api/reports/<slug>/documents/<id>/delete`.
- `page_asset_sitemap.md` — the `intake` page entry and the `boxes` page entry both get history lines + asset ownership updates.
- `LEDGERS/DECISIONS_LEDGER.md` (+ `.json`) — four new decisions per §2.
- `LEDGERS/GLOBAL_LEDGER.md` §2 / §6 / §12 — note the unification phase.
- `CCAgentindex/_ledger/activity.jsonl` — append one entry per non-trivial change during the build.

---

## 4. Server-side design

### 4.1 Identifying a Box Report

Today, `/api/reports/get` takes a `slug` and looks up `CCAgentindex/reports/<slug>/`. Phase 1 introduces a prefix convention:

- Slugs that start with `client_box__` are Box Reports — synthesize from the box.
- All other slugs are Workspaces — current behavior, unchanged.

The `client_box__` prefix already matches the `id` shape produced by `_box_from()` in `server.py:4537`.

### 4.2 New helpers in `server.py`

- `_box_report_synthesize(box_id)` — given a box id, look up the box via `_boxes_catalog()`, walk the folder, build a `documents[]` array matching the existing `report.json` document shape (one entry per file, `extracted_text` populated for text-y types via `_safe_text_read`, raw paths for binaries). Returns the same envelope `IntakeReportDetail` already consumes.
- `_box_report_conversation_path(box_id)` — Q&A history for a Box Report. Stored at `CCAgentindex/reports/_box_conversations/<box_id>.jsonl` (kept in bedrock, not in the box, because conversations are Intake-surface state, not box state). The `_box_conversations/` folder is the only new on-disk artifact this phase introduces.
- `_box_report_ingest(box_id, upload)` — writes the upload bytes into `Auto/Client Boxes/<Name>/intake_drops/<id>.<ext>` (creates the dir if missing), appends an `activity.jsonl` line `{kind: "intake_drop", target: <relative_path_to_box_drop>}`. Returns the synthesized document descriptor.

### 4.3 Endpoint behavior changes

- `/api/reports/list` — also returns a `box_reports[]` array alongside the existing `reports[]`. `box_reports[]` is built from `_boxes_catalog()` filtered to `source_kind == "client_box"`. Each entry carries `{slug, name, doc_count, last_modified, completeness}`. `reports[]` (Workspaces) stays exactly as it is. Frontend does the visual split.
- `/api/reports/get?slug=client_box__*` — routes to `_box_report_synthesize()`. Conversation history loads from `_box_conversations/<box_id>.jsonl`.
- `/api/reports/<slug>/ingest` for `client_box__*` slugs — routes to `_box_report_ingest()`.
- `/api/reports/<slug>/ask` for `client_box__*` slugs — **no change in Phase 1.** Same generic ask path as Workspaces, just operating over the synthesized documents. Box-aware agent config is Phase 2.
- `/api/reports/<slug>/documents/<id>/delete` for `client_box__*` slugs — returns 405 in Phase 1 (synthesized docs are not deletable from Intake). The box owns its files; deletion happens in the box, not the report.
- `/api/reports/create` and `/api/reports/delete` — unchanged. Box Reports are not created or deleted via these endpoints; they exist iff the box exists.

### 4.4 Document shape from synthesis

Per file in the box folder, emit:

```
{
  "id": "box_doc_<sha1(rel_path)[:10]>",
  "filename": "<basename>",
  "mime": "<from extension>",
  "type": "<reuse _reports_doc_type_from_mime>",
  "size": <bytes>,
  "uploaded_at": "<file mtime ISO8601>",
  "extracted_text": "<via _safe_text_read for text-y types, empty for binaries>",
  "summary": "<first 200 chars of extracted_text>",
  "stored_path": "<relative path inside the box folder>",
  "source": "box_synthesis"
}
```

Stable IDs from path-hash (not random) so the conversation history can refer back to them across re-syntheses.

Excluded from synthesis:

- `comms/` subfolder (raw payloads — too noisy for the report list; consider surfacing as a foldout in a later phase).
- Anything under `intake_drops/` is **included** (these are user uploads we want visible).
- Hidden files (`.DS_Store`, etc).

---

## 5. Frontend design

### 5.1 `IntakeReportsList` (screens.jsx)

Add a section header above the existing report grid:

```
Box Reports.        — auto, 28 entries, one per Client Box
[grid of box-report cards]

Workspaces.         — existing manual reports
[existing grid]
```

Box Report cards reuse the same card component as Workspace cards. Card eyebrow says `box · client` instead of doc-type chips. Click handler routes to `IntakeReportDetail` with the `client_box__*` slug — no other change.

Loading state: fetch `/api/reports/list` once; the response carries both arrays.

### 5.2 `IntakeReportDetail` (screens.jsx)

No structural change expected. The synthesized payload matches the existing report shape. Visual touches only:

- When `report.source === "box_synthesis"`, the eyebrow shows `box report · <box_name>` and the document delete affordance is hidden (or disabled with tooltip "this file lives in the box; manage it from the Boxes page").
- A small "open in Boxes →" link in the header that navigates to `BoxesScreen` with the matching box id selected. (Reuses existing `go()` navigation.)

### 5.3 Cross-navigation

`BoxesScreen` already has a right-click → delegations handoff. Add one menu item: "Open as Intake Report → " that navigates to `IntakeReportDetail` with the `client_box__*` slug. Symmetric to the link above.

---

## 6. Build order

Six steps, each independently shippable and reversible:

1. **Step 1 — synthesis helper.** Add `_box_report_synthesize()` to `server.py`. Unit-callable; not yet wired to any endpoint. Smoke test: call it with `client_box__hugo_casillas` and confirm the payload looks right.
2. **Step 2 — list endpoint.** Extend `/api/reports/list` response with `box_reports[]`. Frontend not yet consuming it; verify in browser dev tools.
3. **Step 3 — get endpoint routing.** Wire `/api/reports/get?slug=client_box__*` to the synthesis helper. Manually visit the URL and confirm the JSON.
4. **Step 4 — frontend split.** Update `IntakeReportsList` to render Box Reports on top, Workspaces below. Click-through uses existing `IntakeReportDetail` unchanged.
5. **Step 5 — ingest into box.** Wire ingest endpoint for `client_box__*` slugs to write into `Auto/Client Boxes/<Name>/intake_drops/`. Test by dropping a file on Hugo's Box Report and confirming it shows up in the box folder.
6. **Step 6 — cross-navigation + sitemap + ledger.** Add the Boxes-page menu item, the Intake-side "open in Boxes" link, the `page_asset_sitemap.md` updates for both pages, the four Decisions Ledger entries, and the Global Ledger §12 entry.

After Step 6: cache-bust the JS/CSS in `Secretary.html`, manual smoke test in browser, append the activity ledger line.

---

## 7. Risks / things to watch

- **Slug collision.** If a Workspace was ever manually named to start with `client_box__`, routing would mis-fire. Add a guard: at create time, reject Workspace slugs starting with `client_box__`. List endpoint enforces uniqueness anyway.
- **File-mtime as `uploaded_at`** is a small lie (it's the file's mtime, not when it was uploaded). Acceptable — `last_modified` is what most UI uses anyway.
- **Binaries with no extracted text** show up as cards with empty bodies. The existing UI already handles this (intake supports images, pdfs, etc.). Spot-check with a Hugo screenshot.
- **`Auto/` is a symlink** per CLAUDE.md §1 — writes through it are normally guarded ("do not write through this alias unless the team explicitly asks"). Phase 1's only write through it is the `intake_drops/` folder, which is a new path that doesn't conflict with orchestrator-owned content. Document this exception in the Communications Ledger when the work lands.
- **Conversation history location.** Storing `_box_conversations/<box_id>.jsonl` under `CCAgentindex/reports/` means it survives even if the box is renamed/removed. If a box is deleted, its conversation orphans — acceptable for now, revisit if it matters.
- **Performance.** Synthesizing 28 boxes on every `/api/reports/list` call means walking 28 folders. Should be milliseconds; if not, cache the list response for ~5s.

---

## 8. Definition of done

Phase 1 is done when:

- [ ] Both halves of the Reports list render correctly with at least one Box Report and the existing Workspaces.
- [ ] Clicking a Box Report opens `IntakeReportDetail` with synthesized documents from the box folder.
- [ ] Asking a question on a Box Report uses the existing generic ask path and produces a reasonable answer using the box's content.
- [ ] Dropping a file on a Box Report creates `Auto/Client Boxes/<Name>/intake_drops/<id>.<ext>` and the file appears as a document on next read.
- [ ] The "open in Boxes →" link and the reverse "Open as Intake Report" menu item both navigate correctly.
- [ ] `page_asset_sitemap.md` updated for both pages.
- [ ] Four Decisions Ledger entries committed.
- [ ] Global Ledger §12 entry committed.
- [ ] One `activity.jsonl` line per non-trivial change appended.
- [ ] Cache-busters bumped in `Secretary.html`.

---

## 9. Forward link

When the ledger system and sub-agent fleet are further along, the natural next step is **Phase 2: Box-aware ask path.** Boxes that carry an `AGENTS.md` (Hugo today, Brenda partially) feed it as the system prompt for `/api/reports/<slug>/ask`. That is the leg that turns "talking to Intake" into "talking to the configured box," and it slots in without disturbing Phase 1's surfaces — same payload, different prompt assembly.

Beyond that, the reactive box-bus / ledger trickle-down design discussed in this session is the ultimate frame, but explicitly deferred until the ledger taxonomy and steward agents are stable. Premature implementation would force re-wiring on every new ledger and every new sub-agent — exactly the kind of half-finished state the cleanup phase is supposed to prevent.

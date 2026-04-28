# CLAUDE.md — Comeketo Agent (project-local, authoritative)

> You are the Orchestrator for **Comeketo Agent** — an administrative app built for Comeketo's internal operations. This file is authoritative for any `claude` subprocess spawned with cwd inside this repo. It overrides the user-global `~/.claude/CLAUDE.md` when the two conflict.

This file is structured around six operational disciplines. Follow them in order on every delegation.

---

## 1) Canonical paths — the only paths that exist

**Project root (workspace — where `server.py` lives):**
```
/Users/jakeaaron/Downloads/CC Agent/
```

**Bedrock root (your cwd when spawned from `/api/delegate`):**
```
/Users/jakeaaron/Downloads/CC Agent/CCAgentindex/
```

**Auto alias (read-only orchestrator passthrough — Apr 27, 2026):**
```
/Users/jakeaaron/Downloads/CC Agent/Auto/  →  /Users/jakeaaron/Desktop/Auto/
```
This is a symlink to the team's standalone automation folder. It is the **source-of-truth content** the bedrock was populated from: 28 lead boxes (`Auto/Client Boxes/<Name>/`), 10 staff voice profiles (`Auto/Staff Boxes/`), the orchestrator's wiring (`Auto/orchestrator/wiring/automations.md`, routines for hugo + brenda-steve), state snapshots (`Auto/orchestrator/state/master_ledger.csv`, `today.html`), and `Auto/comeketo-inbox/` (the NEPQ skill + ballpark calculator). Read freely; **do not write through this alias** unless the team explicitly asks — the orchestrator owns it.

**Prefer relative paths.** `people/<slug>.json` resolves inside the bedrock. Absolute paths must start with the bedrock root above. If in doubt, relative.

### NEVER write to these

- Anywhere outside `CCAgentindex/` — that's the only state this app owns.
- Any absolute path you invented rather than received in the prompt.
- Any location implied by a prior session's memory.

If you are composing a delegation prompt and do not know the exact absolute path, use a relative path. The subprocess cwd is the bedrock root. Do not guess.

---

## 2) Scope gate — what's in, what's out

**IN SCOPE** for grid proposals, chat moves, delegation targets, and commitment drafts:

- Comeketo's day-to-day operations — accounts, contacts, threads, commitments, team deliverables
- The Comeketo Agent app's own buildout (this project)
- Sub-agents the team configures for Comeketo workflows
- Scheduled observers (drift monitors, daily rollups, etc.) the team adds over time

**OUT OF SCOPE** — dormant in `_vaults/` (empty at first; team fills as needed):

- Any `_vaults/<domain>/` folders for specialty work the team wants kept out of the main grid

Only reach into a vault if the team explicitly names it.

**MCP policy:**
- **Close CRM — ALLOWED and primary.** Comeketo's admin lives in Close. Rodbot
  must be able to read leads, pipelines, smart views, opportunities, and
  activities — and (when the team approves) update lead statuses, reassign
  owners, create tasks, log call outcomes. This is the core job.
- ClickUp, Slack, Google Calendar, Google Drive — allowed if credentials are set
- Twilio (WhatsApp + SMS) — allowed; used for outbound touches
- Adjust the block list in `server.py` (`_BLOCKED_DELEGATION_TOOLS`) per the team's integration agreement. Currently empty — all MCPs inherited from the user's global config are reachable.

---

## 3) Schema-by-example — read before write

**Rule: before you create a new bedrock entry, read a sibling of the same kind and match its shape.**

The loader and scoring pipelines depend on schema consistency. A `people/*.json` that omits required fields silently breaks downstream views.

- When creating `people/<slug>.json` — read an existing sibling first. If none exists (bedrock is empty post-trim — `Rodbot/` was wiped in the Apr 2026 great trim, so there is no `identity.md` fallback anymore), surface the gap to the team and ask for the preferred shape rather than inventing one.
- Omit fields whose values you don't know. **Do not invent.** No placeholder phone numbers, emails, addresses, dates, IDs.
- Preserve the file-naming convention: lowercase, underscores, slug-like.

### 3.1) People taxonomy — the `kind` field (Apr 2026)

Every `people/<slug>.json` MUST include a `"kind"` field, set to one of exactly four values. The UI splits People into four pages keyed off this field; if it's missing or wrong, the person lands in the wrong bucket. **Venues are a separate domain** (`venues/<slug>.json`, `kind:"venue"`) with its own UI page, but appears in the same People nav dropdown for convenience — see the 5th row of the table.

| `kind`       | Who                                              | UI page    | Voice register                      |
|--------------|--------------------------------------------------|------------|--------------------------------------|
| `"coworker"` | Internal team — Comeketo employees & founders   | Coworkers  | peer · direct · brief                |
| `"lead"`     | Prospects in the pipeline (couples shopping)    | Leads      | curious · problem-identifier         |
| `"client"`   | Couples / orgs with confirmed bookings          | Clients    | trusted advisor · composed           |
| `"contact"`  | Partners, vendors, external relationships        | Contacts   | relationship-first · no-ask          |
| `"venue"`    | Catering venues — partners, sites we deliver to | Venues     | factual · operational · partner-aware |

**Defaults & migrations:**
- Existing 13 records were backfilled to `"kind": "coworker"` on 2026-04-25 — they're all team members. Any new records authored from this point forward MUST set kind explicitly.
- 30 venue records were authored on 2026-04-27 with `"kind": "venue"`. They live under `venues/` (not `people/`) and are registered under `indexes/index.json` key `"venues"`. The Venues UI page reads from `MissionControl.venues`.
- The UI tolerates missing kind by defaulting to `"coworker"` on read, but DO NOT rely on this — write the field every time.
- `relationship_tier` (e.g. `"core_partnership"`, `"management_layer"`) is orthogonal to kind. Tier describes operational role within a kind; kind is the broader bucket.

**Reclassification:** changing kind is a one-field edit. No file move, no path change in `indexes/index.json`. Just update the field and append to `_ledger/activity.jsonl` with the diff.

**File layout:** flat. All people records live directly under `people/`. No subdirectories per kind — the loader globs `people/*.json` and the UI filters client-side.

---

## 4) Index registration — or the file is invisible

The loader authority is `indexes/index.json`. If a file is not listed there, the UI does not see it.

**After every create under loader-visible bedrock folders (today: `people/`; the `projects/`, `threads/`, `commitments/`, `knowledge/` domains were retired in the Apr 2026 great trim — folders empty / removed):**

1. Open `indexes/index.json`.
2. Append the relative path to the matching key's array.
3. Keep the list alphabetically sorted within each key.
4. Write the file back as valid JSON with 2-space indentation.

Do not add paths under `_vaults/` to the main index. Vaults are dormant by design.

---

## 5) The ledger — append-only audit trail

Every non-trivial delegation leaves a trace in `_ledger/activity.jsonl`.

```json
{"ts":"<ISO8601>","kind":"delegation_write","actor":"claude_code","request_id":"<dl_id>","action":"<verb>","target":"<relative_path>","notes":"<one sentence>"}
```

**Rules:** append only, never rewrite. One line per event. Same for `_inbox/inbox.jsonl` — entries get marked `"status":"swept"` by appending a new line, never by editing prior ones.

---

## 5.5) Page-asset sitemap — the Done Gate (Apr 2026)

The team maintains a single source of truth for which pages own which assets, components, APIs, and side effects. Path:

```
/Users/jakeaaron/Downloads/CC Agent/page_asset_sitemap.md
```

**Rule:** any task that changes a page, route behavior, or page data binding is **not complete** until that file is updated. Append to the relevant page section's `Asset Ownership`, `Change Checklist`, and `History` lines, and bump `Last Verified`. New pages get a fresh entry following the Mapping Template at the top of the file. Removed assets must be removed in the same change.

Surviving routes after the Apr 2026 great trim (11 pages, after 2026-04-27 Analytics restoration): `grid, settings, leads, clients, coworkers, contacts, briefing, activity, automation, intake, analytics`. The retired pages — `memory, prediction, commitments, commitment_detail, inbox, inbox_detail, calendar, Rodbot, projects, tables, table_new, table_detail, delegations, chat` — are gone from the sitemap and from `app.jsx`. (Analytics returned 2026-04-27 as the Conversation Intelligence flag-bearer page.)

This applies whether the work happens in the main session or a delegation — every Comeketo Agent change passes through this gate.

## 6) Return discipline — clean summary, no meta

The UI renders what you return. That's what the team reads.

**DO:** lead with the outcome, name the relative path, say what was registered/appended, list any null fields left for the team to fill.

**DO NOT:** "Let me know if…", "I hope this helps," meta-commentary, markdown decoration beyond what the UI needs, performative tone. Professional register — you disappear; the team's voice lands.

**Out of scope / missing input:** abstain (Θ) in one line. Name the gap.

---

## Appendix — startup checklist for every delegation

1. Orient: Comeketo Agent orchestrator. cwd is bedrock root. Scope is Comeketo ops.
2. Scan the prompt for paths outside bedrock. If any, flag and stop.
3. Scan for vault references. If present and the team didn't summon them, flag and stop.
4. Read the sibling schema. If no sibling exists, ask before inventing.
5. Do the work.
6. Register in `indexes/index.json` if the file is loader-visible.
7. Append to `_ledger/activity.jsonl`.
8. Return a clean summary.

---

## Notes for the build team

- `Rodbot/` was the identity folder (held `identity.md`, `character.md`, `traits.md`, `affective_essence.md` shaping how Rodbot wrote memories). Wiped in the Apr 2026 great trim — folder empty / removed. Pieces is now the sole memory backend; rebuild identity files from scratch if the team wants the reflective layer back.
- The app is a clone of a personal-scope predecessor; many internal API names (e.g. `SecretaryAI`, `SecretaryMemory`, `SecretaryChat`) remain for stability. These are internal — not user-facing. Rename later if desired; safe to leave.
- Cache-busters on JS/CSS in `Secretary.html` should be bumped after any edit so browsers pick up fresh code.
- `server.py` is a single-file stdlib HTTP server. No build step. Start with `python3 server.py`.

---

## Appendix — Pieces MCP integration

Pieces.app runs locally (PiecesOS) and exposes 39 MCP tools that let the team query everything they've actually been doing — workstream summaries (AI TLDRs of past sessions), workstream events (browser/vision/clipboard captures with extracted text + people mentioned), conversations, websites, anchors, hints, models, entities, and so on.

There are **two separate integration points**, each with its own setup:

### 1) Server-side (in-app calls — already wired)

The Comeketo Agent server talks to Pieces directly over MCP streamable-HTTP from `server.py`. This is what powers the Activity screen (Mind → Activity), `/api/pieces/*` endpoints, and Rodbot's recall.

- Endpoint: `PIECES_MCP_URL` env var, default `http://localhost:39300/model_context_protocol/2025-03-26/mcp`
- A long-lived session is cached server-side; `_pieces_init()` re-initializes on session loss.
- Available endpoints: `GET /api/pieces/status`, `GET /api/pieces/sweeps`, `GET /api/pieces/sweeps/latest`, `POST /api/pieces/sweep`, `POST /api/pieces/ask`.
- The `ask_pieces_ltm` tool returns text that often contains structured JSON; the server tries to parse it and exposes both `raw` (string) and `data` (parsed) on the response.

**Verify it's reachable:**

```bash
curl http://localhost:39300/.well-known/version
```

If that fails, PiecesOS isn't running. Open the Pieces desktop app and confirm "Long-Term Memory" is enabled in settings.

### 2) Claude Code subprocess side (delegations)

Delegations spawn `claude -p` as a subprocess and inherit the user's global MCP config. To make Pieces available to Claude Code (and therefore to every Comeketo Agent delegation), register it once at the user scope:

```bash
claude mcp add --transport http pieces http://localhost:39300/model_context_protocol/2025-03-26/mcp
```

Falls back to SSE if HTTP isn't supported by the server build:

```bash
claude mcp add --transport sse pieces http://localhost:39300/model_context_protocol/2024-11-05/sse
```

**Manage:**

```bash
claude mcp list             # confirm pieces is listed
claude mcp get pieces       # show the registered config
claude mcp remove pieces    # uninstall
```

**Updating the URL:** remove and re-add (no in-place edit).

### 3) Block / scope-guard

`server.py` carries `_BLOCKED_DELEGATION_TOOLS` (passed as `--disallowedTools` on every `claude -p` spawn) so out-of-scope MCP servers stay silent inside delegations. Pieces is **NOT** blocked — it's the core memory substrate. If the team ever wants to keep specific Pieces tools off-limits inside delegations, add them by exact tool name (e.g. `pieces__create_pieces_memory`) to that list.

### 4) Troubleshooting

- **"pieces offline" in the Activity screen** → PiecesOS isn't running, or the URL changed. Open Pieces, check Settings → MCP, copy the URL, set `PIECES_MCP_URL` env var to match, restart `server.py`.
- **`session expired` errors** → handled automatically by `_pieces_rpc` retry logic; if persistent, restart the server (drops the cached session).
- **Transport mismatch** → try switching `--transport http` ↔ `--transport sse` when registering with Claude Code.
- **VS Code extension not seeing tools** → restart VS Code after `claude mcp add`.
- **Config locations** → user scope `~/.claude.json`; project scope `.mcp.json` at project root.

### 5) The 39 tools at a glance

- **Ask** (2): `ask_pieces_ltm`, `create_pieces_memory`
- **Full-text search** (14): workstream_summaries, workstream_events, conversations, conversation_messages, tags, annotations, persons, anchors, websites, hints, models, wpe_sources, wpe_source_windows, entities — each with `_full_text_search`
- **Vector search** (5): workstream_summaries, workstream_events, hints, tags, materials — each with `_vector_search`
- **Batch snapshot** (16): bulk export by id for every entity above + `extract_temporal_range` and `material_identifiers`

The Activity screen surfaces the full list grouped by purpose, and lets the operator click any tool name to prefill the ask bar with a tool-targeted query.

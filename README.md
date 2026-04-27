# Comeketo Agent

Administrative app for Comeketo's internal operations. A local web app + reflective intelligence layer (Rodbot) that watches what the team does, distills patterns into structured memories, and surfaces them through a 3×3 decision grid, a chat interface, and a memory view.

## Running it

```
cd /Users/jakeaaron/Downloads/CC\ Agent
python3 server.py            # default port 3422
# → http://127.0.0.1:3422/Secretary.html
```

No build step. Pure stdlib Python + JSX served raw with in-browser Babel. Reload the page to pick up edits to `.jsx` files (bump the cache-buster in `Secretary.html` if the browser clings to an old version).

## Credentials

Create `.env` at the project root with whatever the team wants Rodbot to reach:

```
OPENAI_API_KEY=...
CLICKUP_API_TOKEN=...
SLACK_BOT_TOKEN=...
TWILIO_ACCOUNT_SID=...
TWILIO_API_KEY_SID=...
TWILIO_API_KEY_SECRET=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

All are optional — the app degrades cleanly if a key is absent. `/api/status` reports which connectors are live.

## Layout

```
CC Agent/
├── server.py                 # single-file HTTP server
├── Secretary.html            # shell (title: "Comeketo Agent")
├── app.jsx / components.jsx / screens.jsx  # React UI
├── rodbot.js                 # reflective-intelligence layer
├── ai_instructions.js        # system-prompt assembler
├── CLAUDE.md                 # orchestrator doc for claude -p subprocesses
└── CCAgentindex/             # bedrock — all operational state
    ├── projects/  people/  threads/  commitments/  knowledge/
    ├── _base/                # always-on primitives
    ├── _inbox/inbox.jsonl    # append-only intent log
    ├── _ledger/              # append-only activity streams
    ├── _vaults/              # dormant specialty containers
    ├── Rodbot/               # identity, character, traits, memory, reflections
    ├── indexes/index.json    # loader authority
    ├── ledgers/              # north_star, ratio_lattice
    ├── summaries/            # briefings, accomplishments
    ├── manifests/            # rebuild manifest
    ├── scheduled_tasks/      # prompts for scheduled agents
    └── agents/               # sub-agents (inbox_triage lives here by default)
```

## Page-Asset Truth Gate

`docs/page_asset_sitemap.md` is the canonical map of:
- every app route/page
- visible assets on each page
- the code paths and API/data bindings that control those assets

Completion rule for all UI/routing/data-binding work:

- If you change a page, route behavior, asset wiring, or page-level API path, you must update `docs/page_asset_sitemap.md` in the same change.
- A task touching page behavior is not done until the sitemap is updated.
- Review checklist:
  - route/component mapping still matches `app.jsx`
  - asset ownership references still match real code paths
  - backend/API references still match `server.py`

## Rodbot

Reflective intelligence layer. Watches ledger events, distills them into structured memories with an editorial voice. Configure Rodbot's personality and voice in:

- `CCAgentindex/Rodbot/identity.md` — who Rodbot is, posture, boundaries
- `CCAgentindex/Rodbot/character.md` — voice rules, sign-offs, register
- `CCAgentindex/Rodbot/traits.md` — optional trait tables
- `CCAgentindex/Rodbot/affective_essence.md` — tonal palette for memory entries

Changes to these files take effect on the next reflection.

## Filling the bedrock

Cold-start bedrock is empty by design. Populate by either:

1. **Dropping notes into the Inbox** — raw text, tagged by kind. The Inbox Triage sub-agent classifies and stages them for the morning sweep.
2. **Direct file drops** into `projects/ people/ threads/ commitments/ knowledge/` — follow the schema implied by a sibling once one exists.
3. **Delegations** — ask Claude Code (via the Delegate tab) to scaffold a project or a person from a description.

After every create under a loader-visible directory, **append the path to `indexes/index.json`** or the UI won't see the file.

### People taxonomy

Every `people/<slug>.json` includes a `"kind"` field set to one of: `"lead"`, `"client"`, `"coworker"`, `"contact"`. The UI splits People into four pages off this field. New records MUST set kind explicitly. Reclassification is a one-field edit — no file move. See `CLAUDE.md` §3.1 for the full taxonomy and `CCAgentindex/Rodbot/identity.md` for how Rodbot's voice register shifts per kind.

## North Star anchors

Edit `CCAgentindex/ledgers/north_star.json` to declare what the team is scoring commitments against. Anchors carry `id`, `label`, `why`, `weight`, `comparator_hint`, `streak_worthy`, `cadence`. The grid generator reads these to shape proposals.

## Scheduled observers (co-work)

The `CCAgentindex/scheduled_tasks/` folder holds prompts for recurring observers (e.g. daily oracle sweep, commitment drift). Fire them from external cron / launchd with:

```
cat CCAgentindex/scheduled_tasks/daily_oracle_sweep.md | claude -p --output-format json
```

Results land in `CCAgentindex/summaries/<observer>/`.

## Sub-agents (in-app)

Each folder under `CCAgentindex/agents/<name>/` with `agents.md` + `prompt.md` is automatically discoverable via `GET /api/agents` and runnable via `POST /api/agents/<name>/run`. The UI wires buttons to these (see the Inbox screen's "Sweep inbox now").

## MCP integrations

The app talks to two MCPs out of the box if they're running:

- **Claude Code** at `/usr/local/bin/claude` — delegation subprocess
- **Pieces** at `http://localhost:39300/model_context_protocol/2025-03-26/mcp` — ambient LTM watching the team's desktop. Hourly background sweep lands in `_ledger/pieces_sweeps.jsonl`. Activity view surfaces it.

## Out-of-scope safeguards

- Close CRM is blocked at the CLI level for delegations (`--disallowedTools` in `server.py`). Unblock by editing `_BLOCKED_DELEGATION_TOOLS` if the team wants Rodbot to reach Close.
- `_vaults/<domain>/` folders are dormant. The prompt layer instructs Rodbot to never reach into them unless explicitly summoned.

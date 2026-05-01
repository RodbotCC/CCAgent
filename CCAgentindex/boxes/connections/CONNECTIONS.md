# Connections Ledger

Last updated: 2026-04-29 (initial creation — Phase 12 of ledger system buildout; first **domain-tier** ledger authored under `DEC-2026-04-29-013`)
Maintainer: Jake / Comeketo Agent project agents
Status: **active**
Tier (Box Bus Ledger §3): **domain** — fans out only to Boxes that subscribe at the domain tier (e.g., the orchestrator Box, the inbox-skill Box, individual automation Boxes)
Read when: a service stops working, designing a new automation, rotating a credential, onboarding a new connector, or auditing what the project actually depends on.
Core rule: **If the project depends on an outside system, that dependency must be visible. Never the secret — always the location.**
Steward agent: not yet authored. Phase B work — when written it lands at `/Subagent Boxes/connections_subagent_package/`.

> A project like this does not only fail because code is wrong.
>
> It fails because an API key expired, a token was missing, a paid service ran out, a connector was disabled, a local server was down, a model setting changed, or a webhook pointed to the wrong place.
>
> This ledger is the project's dependency reality check.

---

## 1. Purpose

This ledger inventories **every external system the project depends on** and the operational facts that determine whether it works: where credentials live, who depends on it, what breaks if it goes down, how to safely verify it, and where billing or quota risk lives. It is part technical map, part operations runbook.

This ledger is paired with — and explicitly distinct from — three sibling ledgers:

| Ledger | Owns |
|---|---|
| **Source-of-Truth Ledger** §3.5 | The trust ordering for external systems (API > local mirror > generated view) |
| **Connections Ledger** (this file) | The actual per-service dependency contract (credentials, failure modes, verification) |
| **Settings Ledger** (planned) | UI-configurable surfaces over those credentials |
| **Box Bus Ledger** §2.1 | The `box.json` manifest field that declares Box ↔ service dependencies |

This ledger does not replicate Source-of-Truth's trust ordering — it cross-references SoT and adds the operational layer underneath it.

### Owns

- the **service inventory** (active, optional, not-in-use, needs-verification)
- per-service **credential locations** (env var names, config paths — **never values**)
- per-service **failure modes** and what breaks if down
- **verification playbook** (safe read checks; explicit "never use as a connection test" list)
- **billing / renewal / quota risk** notes
- **local vs cloud** dependency distinctions
- **service owners** and downstream consumers
- **fallback / degradation** posture per service
- the rule that Box manifests' `subscribes[]` for external services must reference entries in this ledger

### Does not own

- raw API keys, tokens, OAuth secrets, passwords → secure stores / `.env` (never this file)
- full API endpoint documentation → upstream vendor docs
- per-Box manifest content → individual `box.json` files
- the trust ordering for which service is canonical → `SOURCE_OF_TRUTH.md` §3.5
- UI-configurable credential surfaces → Settings Ledger (planned)
- code-level integration patterns → the actual server / connectors code

This ledger says **what exists and where to verify**. Settings Ledger will say **where to configure it**. Source-of-Truth says **what to trust from it**.

---

## 2. Security Rules

**Never store raw secrets in this ledger.**

Forbidden:

- API keys
- access tokens / refresh tokens
- passwords
- private keys
- OAuth secrets
- service account JSON contents
- database connection strings with credentials

Allowed:

- service name
- env var name (e.g., `CLOSE_API_KEY`)
- expected storage location (`/.env`, platform connector, etc.)
- owner / responsible party
- whether credential is configured at all (yes/no/unknown)
- safe verification steps
- expiration / renewal notes
- what breaks if missing

If a credential is missing, **record the missing dependency, not the secret**.

---

## 3. Connection Status Labels

| Status | Meaning |
|---|---|
| `active` | Service is wired and used by running code; failure has real consequences |
| `optional` | Service is wired and used but degradation is graceful if it goes down |
| `planned` | Documented intent to wire but no active integration in code today |
| `not-in-use` | Available as a connector or in the environment but **not actually wired** in this repo |
| `needs-verification` | Mentioned somewhere but not yet confirmed against code |

> **Anti-rule (`PROB-2026-04-28-009`):** do not invent active services. If a service is available but not confirmed in the repo, mark it `needs-verification` or `not-in-use`. Hallucinated dependencies are worse than missing ones.

---

## 4. Connection Registry

Each service uses the same card shape. Cards are grouped by category and ordered roughly by criticality.

### 4.1 Required (failure breaks core operation)

#### `close` — Close.com CRM

Category: **CRM / Sales Data**
Status: **active**
Required level: **critical**
Owner: Comeketo (Andre + Jake)
Used by: `comms_state_sweep`, Client Boxes, inbox automation, scheduled fires, lead/task state, future allowed-to-know extraction
Purpose: Live CRM source for leads, contacts, activities (calls/SMS/email/WhatsApp), tasks, opportunities, ownership, statuses. Source-of-truth for client comms (per `SOURCE_OF_TRUTH.md` §3.1 rank 1).
Credentials: `CLOSE_API_KEY` in `/.env`. **Never logged to disk.** The verbatim backfill on 2026-04-28 used a session-scoped key Jake never wrote down; future refreshes need the human to re-supply.
Data read: lead records, contact records, activities, tasks, calls (with transcripts when available), opportunities, statuses, owners
Data written (when authorized): SMS / email / WhatsApp activities, task movements, notes, status updates
Side-effect risk: **very high** — can contact customers
Failure mode: no live comms import, no state sweep, no customer sends, stale Client Boxes, reply gate cannot be trusted from live state
Verification: safe read-only API check (fetch known lead by ID, fetch recent activities for known lead). **Never test by sending a customer-facing message.**
Fallback: use last synced `01b_comms_verbatim.md` and `01_comms.md`, clearly mark stale; manual Close review
Billing / quota: Comeketo subscription, treat as continuous; rate limits handled in `comms_state_sweep`
Related files: `Auto/Client Boxes/<Name>/01_comms.md`, `01b_comms_verbatim.md`, `comms/*.json`, `Auto/orchestrator/bin/comms_state_sweep.py`, `Auto/comeketo-inbox/`
Related ledgers: `SOURCE_OF_TRUTH.md` §3.1, `OPEN_PROBLEMS_LEDGER.md` (multiple PROB entries depend on this)
Security notes: Close is customer-facing — every write is a potential customer interaction.

#### `github` — GitHub Repository

Category: **Source Control / Repo**
Status: **active**
Required level: **critical**
Owner: Repo owner (Jake)
Used by: every agent, every ledger, every continuity surface
Purpose: Durable source of truth for code, ledgers, configs, handoff memory (per `SOURCE_OF_TRUTH.md` §3.3 rank 1).
Credentials: Local Git auth (managed by macOS keychain / SSH key) — **not stored in repo**. No GitHub API integration in code; all access is via the `git` CLI.
Expected location: local Git config / credential manager
Data read: repository files, commits, branches
Data written: commits, branches, files (when explicitly authorized)
Side-effect risk: **high** — direct writes can conflict with local unpushed work
Failure mode: agents cannot read/write source of truth; continuity cannot be pushed; local/GitHub drift accumulates
Verification: `git status`, `git fetch origin`, branch comparison
Fallback: local commit, push later when safe
Billing / quota: none unless paid GitHub features are added
Related files: `.git/`, `CLAUDE.md`, `LEDGERS/GLOBAL_LEDGER.md` §4
**Project-specific warning:** Direct GitHub writes must always check `git status` first. Per `DEC-2026-04-28-001` and `COMM-2026-04-28-004`, the human may have unpushed local work.

#### `local_app_server` — `server.py` Runtime

Category: **App Runtime**
Status: **active**
Required level: **critical**
Owner: Jake (local environment)
Used by: every UI route, every `/api/*` endpoint, the entire frontend
Purpose: Single-file stdlib HTTP server that backs the UI and proxies external services.
Credentials: reads `/.env` at startup
Expected location: `server.py` at project root, started via `python3 server.py [PORT]`
Failure mode: pages cannot load dynamic data; `/api/*` endpoints fail; entire UI is offline
Verification: `/api/status` endpoint
Fallback: none in real-time — restart server
Local vs cloud: **local-only** (no production deployment)
Related files: `server.py`, `Secretary.html`, all `.jsx`/`.js` at root

### 4.2 Active (used by running code; degradation acceptable)

#### `pieces` — PiecesOS Memory Backend

Category: **Memory / Activity Intelligence / Local Tooling**
Status: **active**
Required level: **high**
Owner: Jake (local environment)
Used by: Activity screen, briefing ribbon, `/api/pieces/*` endpoints, Rodbot recall (when it returns)
Purpose: 39 MCP tools across Ask, full-text search, vector search, batch snapshot. The sole memory backend after the `Rodbot/` great trim.
Credentials: none — local app. Configured via `PIECES_MCP_URL` (default `http://localhost:39300/model_context_protocol/2025-03-26/mcp`) and `PIECES_CHAT_LLM`.
Failure mode: Activity screen empty; `/api/pieces/*` fails gracefully but visibly; sweeps unavailable; ask panel broken
Verification: `curl http://localhost:39300/.well-known/version` or `/api/pieces/status`
Fallback: hide / degrade Pieces-specific UI
Local vs cloud: **local-only** (PiecesOS daemon)
Related files: `server.py` (`_pieces_*` helpers), `screens.jsx` Activity screen, `CLAUDE.md` Pieces appendix
Related ledgers: `SOURCE_OF_TRUTH.md` §3.5

#### `clickup` — ClickUp Workspace

Category: **Task / Project Management**
Status: **active**
Required level: **medium**
Owner: Comeketo workspace
Used by: `connectors.js` ClickUp channel, `/api/clickup/*` endpoints, Delegations page (clickup target)
Purpose: Task creation in the team's ClickUp space when commits land via the Delegations channel picker.
Credentials: `CLICKUP_API_TOKEN`, `CLICKUP_SPACE_ID`, `CLICKUP_LIST_ID` in `/.env`. Per `docs/connectors.md`, these are present and working.
Failure mode: ClickUp commits silently no-op; channel picker shows `needs-setup` or `misconfigured`
Verification: `/api/clickup/rescan` to refresh; `/api/status` for `clickup_list_id` presence
Fallback: pick a different channel in the Delegations picker
Billing / quota: Comeketo subscription
Related files: `connectors.js`, `server.py` ClickUp handlers, `docs/connectors.md`

#### `twilio` — Twilio (WhatsApp + SMS)

Category: **Communication Surfaces**
Status: **active**
Required level: **medium**
Owner: Comeketo workspace
Used by: `connectors.js` whatsapp + sms channels, scheduled fires that opt to use these targets
Purpose: Outbound WhatsApp and SMS to clients via Twilio (sandbox or paid).
Credentials: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_WHATSAPP_FROM`, plus `TWILIO_TEST_ACCOUNT_SID` / `TWILIO_TEST_AUTH_TOKEN` for sandbox in `/.env`.
Side-effect risk: **very high** — customer-facing
Failure mode: WhatsApp / SMS sends fail; Delegations channel picker shows `needs-setup`
Verification: server status endpoint shows Twilio config; **never test by sending to a real customer**. Use the test account credentials.
Fallback: switch send target to email or Slack
Billing / quota: Twilio per-message pricing — **paid, watch the meter**
Related files: `connectors.js`, `server.py` (`twilio_whatsapp_from` references)
Security notes: Customer-facing send, isolated approval card per `DEC-2026-04-28-005`.

#### `slack` — Slack Workspace

Category: **Communication Surfaces**
Status: **active (token format issue per docs/connectors.md)**
Required level: **medium**
Owner: Comeketo workspace
Used by: `connectors.js` Slack channel, Delegations Slack target, future Andre review/approval surfaces
Purpose: DM Andre, post to team channels, alert on send failures or reply detection.
Credentials: `SLACK_BOT_TOKEN` in `/.env`. **Token format issue** — per `docs/connectors.md`, current token is `xapp-` (app-level); a `xoxb-` Bot User OAuth token is needed.
Failure mode: Slack sends fail with token mismatch; channel picker shows `misconfigured`
Verification: `/api/status` (proxy flags `xapp-` vs `xoxb-` mismatch); test post to a private channel only
Fallback: surface alert in app's Activity screen instead
Open problem: token-format issue is a known fragility — record as `PROB-2026-04-29-XXX` if not already.
Related files: `connectors.js`, `server.py` Slack handlers, `docs/connectors.md`

#### `openai` — OpenAI API

Category: **Model Providers**
Status: **active**
Required level: **medium**
Owner: Jake (account)
Used by: chat completion paths in `server.py`, intake report generation
Purpose: LLM completions for the chat surface and reports.
Credentials: `OPENAI_API_KEY` in `/.env`
Failure mode: chat / reports fall back to error states
Verification: small completion request via `/api/chat/*`
Fallback: degrade to other providers if wired
Billing / quota: per-token API billing — **paid, watch the meter**
Related files: `server.py`

#### `cowork_scheduled_tasks` — Cowork Runtime

Category: **Automation / Agent Runtime**
Status: **active**
Required level: **high** (when scheduled fires are enabled)
Owner: Jake / Cowork environment
Used by: per-lead scheduled fires, recurring `comms_state_sweep`, future automation tasks
Purpose: Runs future prompts / sessions on a schedule.
Credentials: handled by Cowork environment — not in `/.env`
Side-effect risk: **very high** — can trigger customer-facing actions
Failure mode: scheduled sends do not fire; sweeps stall; Client Boxes go stale; automation looks dead
Verification: list scheduled tasks, inspect recent run summaries, check last sweep timestamp, verify no global kill switch
Fallback: manual fire through controlled session; pause customer-facing sends until schedule re-verified
Related files: `Auto/orchestrator/MANUAL_FIRE.md`, `Auto/orchestrator/SYSTEM_OVERVIEW.md`, `Auto/orchestrator/bin/comms_state_sweep.py`
Security notes: Per `DEC-2026-04-28-005`, every scheduled fire must respect guardrails.

#### `claude_code` — Claude Code Subprocess

Category: **Model Providers / Agent Runtime**
Status: **active**
Required level: **medium**
Owner: Jake (account)
Used by: `connectors.js` claude_code channel, `/api/delegate` endpoint that spawns `claude -p`
Purpose: Delegation channel that runs an isolated `claude -p` subprocess for repo-aware work.
Credentials: handled by `claude` CLI / user's Claude account
Verification: server probes the `claude` binary on startup → `claude_code_available` in `/api/status`
Failure mode: delegations to claude_code target fail; channel shows `needs-setup`
Fallback: pick a different channel
Related files: `connectors.js`, `server.py` `/api/delegate` handler, `CLAUDE.md`

### 4.3 Optional (graceful degradation)

#### `browser_use` — Browser Use Tool

Category: **Automation / Agent Runtime**
Status: **active (optional)**
Required level: **low**
Owner: Jake (workspace)
Used by: browser-driven external lookups
Credentials: `BROWSER_USE_PAYLOAD` in `/.env`
Failure mode: certain browser-driven workflows degrade; agent context narrower
Fallback: manual browsing or other connectors
Related files: server.py references

### 4.4 Planned (intent documented; not wired)

#### `google_calendar` — Google Calendar

Category: **Communication Surfaces / Scheduling**
Status: **planned**
Required level: **medium (when wired)**
Owner: Comeketo workspace
Purpose: Real calendar truth for tasting / consultation appointments — replaces operator-typed dates.
Credentials: Google Calendar OAuth (not yet added)
Documented in: `docs/connectors.md`
Open work: OAuth flow, server endpoints, channel picker entry.

#### `email` — Gmail / SMTP

Category: **Communication Surfaces**
Status: **planned**
Required level: **medium (when wired)**
Owner: Comeketo workspace
Purpose: Email channel that doesn't go through Close (e.g., quote PDFs, post-close handoff messages).
Credentials: Gmail API OAuth or SMTP (not yet added)
Documented in: `docs/connectors.md`

### 4.5 Not In Use (available but not wired in this repo)

#### `supabase` — Supabase Backend

Category: **Database / External Backend**
Status: **not-in-use**
Evidence checked 2026-04-29: no Supabase imports in `server.py`, no `supabase` references in `*.jsx` / `*.js` source. The Cowork environment has a Supabase MCP connector available but the repo does not use it.
If activated later: a new entry will be authored with full close-criteria.

#### `google_drive` — Google Drive

Category: **File / Knowledge Sources**
Status: **not-in-use**
Evidence checked 2026-04-29: no Google Drive imports in code. The Cowork environment has a Google Drive MCP connector available but the repo does not use it. Internal docs are mirrored into `LEDGERS/`, `docs/`, `Auto/comeketo-inbox/references/` instead.

#### `anthropic_api_direct` — Anthropic API (Direct)

Category: **Model Providers**
Status: **not-in-use**
Evidence checked 2026-04-29: no `ANTHROPIC_API_KEY` in env, no `anthropic` Python imports. Claude is reached via `claude` CLI subprocess (see `claude_code` above), not via direct API.

---

## 5. Credentials / Secret Locations Table

| Credential | Used For | Expected Location | Raw Secret In Ledger? | Status |
|---|---|---|---|---|
| `CLOSE_API_KEY` | Close reads/writes/sends | `/.env` | **No** | active |
| `CLICKUP_API_TOKEN` | ClickUp task creation | `/.env` | **No** | active |
| `CLICKUP_SPACE_ID` | ClickUp space scope | `/.env` | **No** | active |
| `CLICKUP_LIST_ID` | Default list for commits | `/.env` | **No** | active |
| `SLACK_BOT_TOKEN` | Slack DMs / channel posts | `/.env` | **No** | active (token format issue — needs `xoxb-`) |
| `TWILIO_ACCOUNT_SID` | Twilio account scope | `/.env` | **No** | active |
| `TWILIO_AUTH_TOKEN` | Twilio auth | `/.env` | **No** | active |
| `TWILIO_API_KEY_SID` / `_SECRET` | Twilio API key auth | `/.env` | **No** | active |
| `TWILIO_WHATSAPP_FROM` | Outbound WhatsApp from-number | `/.env` | **No** | active |
| `TWILIO_TEST_ACCOUNT_SID` / `_AUTH_TOKEN` | Twilio sandbox testing | `/.env` | **No** | active |
| `OPENAI_API_KEY` | LLM completions | `/.env` | **No** | active |
| `PIECES_MCP_URL` | PiecesOS endpoint | `/.env` (or default) | n/a | active |
| `PIECES_CHAT_LLM` | Pieces model selection | `/.env` (or default) | n/a | active |
| `BROWSER_USE_PAYLOAD` | Browser-use config | `/.env` | **No** | active (optional) |
| GitHub auth | repo read/write | macOS Keychain / SSH key / Git credential manager | **No** | active |
| `claude` CLI auth | Delegation subprocess | user's Claude account | **No** | active |

**Rule:** This ledger names environment variable names. It must not contain their values.

---

## 6. Failure Mode Map

| Symptom | Likely Connection | First Check | Fallback |
|---|---|---|---|
| Client ledgers stale | Close / `comms_state_sweep` / cowork_scheduled_tasks | last sweep timestamp; safe Close API read | manual Close review |
| Activity screen empty | pieces | `/api/pieces/status`; `curl localhost:39300/.well-known/version` | hide / degrade Activity panel |
| No Slack alerts | slack (token format issue) | `/api/status` for `slack` field; check token starts with `xoxb-` | surface alert in Activity instead |
| WhatsApp / SMS sends fail | twilio | `/api/status`; check Twilio creds present and `TWILIO_WHATSAPP_FROM` set | switch to email or Slack channel |
| ClickUp commits silently no-op | clickup | `/api/clickup/rescan`; `/api/status` for `clickup_list_id` | use a different Delegations channel |
| Delegation to claude_code fails | claude_code | `/api/status` for `claude_code_available`; check `claude` CLI installed | use a different Delegations channel |
| Pages cannot load dynamic data | local_app_server | `python3 server.py 3423`; check port not in use | restart server |
| Chat responses fail | openai | `/api/status`; check `OPENAI_API_KEY` present and valid | retry; check rate limits |
| GitHub write conflict | github | `git status`; `git fetch origin`; branch comparison | rebase locally; push when safe |
| Scheduled fires not running | cowork_scheduled_tasks | inspect recent run summaries; check last sweep timestamp | manual fire only; pause customer sends |

---

## 7. Verification Playbook

### Safe read checks (always allowed)

- Fetch known GitHub file via `git`
- Fetch a known Close lead by ID (read-only)
- Fetch recent Close activities for a known lead (read-only)
- `/api/status` (the universal health summary)
- `/api/pieces/status`
- `curl http://localhost:39300/.well-known/version`
- List Cowork scheduled tasks (read-only)
- Read Slack workspace identity without posting

### Write checks (require explicit authorization)

- Slack post to a **test** channel
- Close note creation on a **test** lead
- ClickUp task creation in a **test** list
- Twilio test-account send (using `TWILIO_TEST_*` credentials)
- Workflow / trigger save
- Credential save through `/api/settings/mcp_credentials`

### Never use as a connection test

- Sending a customer-facing SMS / WhatsApp / email
- Changing a real lead status in Close
- Moving real tasks in production ClickUp lists
- Deleting workflows or triggers
- Overwriting credentials
- Pushing to `main` to test write access

> **Testing by causing damage is not testing.** When in doubt, read first, write to test surfaces only, escalate before touching customer-facing paths.

---

## 8. Billing / Renewal / Quota Watch

| Service | Risk | Renewal / Expiry | Owner | Notes |
|---|---|---|---|---|
| `close` | Comeketo subscription, API rate limits | Comeketo-managed | Comeketo | Rate limits handled in sweep code |
| `openai` | Per-token API billing | Pay-as-you-go | Jake | **Watch the meter**; chat-heavy workflows can rack up cost |
| `twilio` | Per-message pricing (WhatsApp + SMS) | Pay-as-you-go | Comeketo | **Customer-facing send is paid every time** |
| `clickup` | Workspace seat / API quota | Comeketo subscription | Comeketo | Free tier API limits are generous |
| `slack` | Workspace tier / app limits | Comeketo subscription | Comeketo | Token format issue is the more urgent risk |
| `pieces` | Local app — no billing | n/a | Jake | Only failure is daemon not running |
| `github` | Free tier sufficient today | n/a | Jake | Paid features not in use |

**Rule:** if a service is paid or quota-limited, record the owner and verification path even when the exact billing date is unknown.

---

## 9. Local vs Cloud Dependencies

**GitHub-backed (shared via repo):**
- ledgers
- code
- Client Boxes (canonical files)
- audit markers
- documentation

**Local-only (not visible to other agents until pushed / synced):**
- `/.env` and the secrets it contains
- the running `server.py` instance
- PiecesOS daemon
- unpushed Git commits
- local Cowork environment (scheduled tasks live here, not in repo)
- generated artifacts in `CCAgentindex/_runs/`, `intelligence/`, `analytics/`

**Cloud / platform (available via account or connector):**
- Close API
- ClickUp API
- Slack API
- Twilio API
- OpenAI API
- Google Calendar (when wired)
- Email (when wired)

> **Rule (per `DEC-2026-04-28-001`):** if a dependency is local-only and important, either commit its configuration *recipe* (not its secret) to GitHub or record the dependency clearly in this ledger. The recipe approach is preferred — see `docs/connectors.md` for the existing pattern.

---

## 10. Connection Change Done Gate

This is the local-stricter gate that overrides DoD §5.8 when the work involves a connection change.

Update this ledger when:

- a new external service is added to `/.env` or to `connectors.js`
- a service is removed
- an env var is renamed
- a service moves between `active` / `optional` / `planned` / `not-in-use`
- a side effect is introduced (e.g., a service that was read-only starts writing)
- billing / quota / trial risk is discovered
- verification steps change
- a failure mode is observed
- a local-only dependency becomes important enough to need a recipe in the repo
- an automation starts depending on a connection
- a Box's `box.json.subscribes[]` references a service for the first time

When updating: bump `Last updated`, update the JSON mirror, append to history, update the relevant Box manifests if the dependency shape changed. If the change is also a UI change (e.g., a new channel in `connectors.js`), update `page_asset_sitemap.md` per DoD §5.3.

---

## 11. Relationship To Box Bus Ledger

`BOX_BUS_LEDGER.md` §2.1 defines the `box.json` manifest, which can include service subscriptions like:

```jsonc
"subscribes": [
  {
    "ledger":       "ANALYTICS_SOURCE_CHANNELS",
    "tier":         "domain",
    "filter":       "scope:box:hugo_casillas",
    "interpreter":  "T1",
    "write_target": "client_ledger.md"
  }
]
```

When a Box's manifest declares a dependency on an external service (e.g., an analytics-snapshot Box that subscribes to Close emit events), **the service must already exist in this ledger as `active`**. The Phase C runtime validation will check this — until then, it's an authoring discipline.

> **Cross-rule:** A `box.json` cannot declare a dependency on a `not-in-use` or `needs-verification` service. Those have to be promoted to `active` (with verification evidence) first.

---

## 12. North Star Alignment

This ledger directly supports:

- **NS-04 Safe Automation** — failure modes, verification playbook, and the "never test by causing damage" rule are direct safety substrate.
- **NS-09 Agent Handoff Continuity** — a new agent can read this and know what to check when something breaks.
- **NS-10 Defense As First-Class Build Activity** — billing/quota tracking, fallback rules, local-vs-cloud distinction are all defense.
- **NS-06 Source-of-Truth Discipline** — pairs with `SOURCE_OF_TRUTH.md` §3.5 (which says *what to trust*) by saying *what's wired*.

Indirect: NS-01 (durable memory), NS-02 (legibility), NS-07 (rebuildability — the dependency map is part of the rebuild recipe).

---

## 13. Update Rules

Update this ledger when:

- the §10 Done Gate fires
- a new service category becomes relevant
- the security rules change (e.g., a new acceptable storage location is added)
- a status label needs changing
- a recurring failure pattern emerges (consider promoting to Open Problems)

When updating: bump `Last updated`, refresh the JSON mirror, append a history line to the affected service card, update relevant Box manifests, and notify Settings Ledger if a credential becomes UI-configurable.

---

## 14. Final Operating Rule

> External systems are part of the architecture.
>
> If the project needs it, map it.
> If it can break the project, name the failure mode.
> If it requires a secret, record the location — never the secret.

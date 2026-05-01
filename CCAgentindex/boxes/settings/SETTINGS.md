# Settings Ledger

Last updated: 2026-04-29 (initial creation — Phase 15 of ledger system buildout; tier: global; envelope-aware under `DEC-2026-04-29-013`)
Maintainer: Jake / Comeketo Agent project agents
Status: **active**
Tier (Box Bus Ledger §3): **global** — fans out to every Box that subscribes at the global tier
Read when: adding a new toggle to the Settings page, deciding whether a value belongs in `.env` vs `localStorage`, debugging "the user changed X but it didn't take effect," wiring a new connector credential, or shipping a new feature flag.
Core rule: **Every user-changeable knob has a known home, a known scope, and a known reset path.**
Steward agent: not yet authored. Phase B work — when written it lands at `/Subagent Boxes/settings_subagent_package/`.

> The Connections Ledger names what's **wired**.
>
> This ledger names what's **user-changeable** — and where the change lands, who's affected, and how to undo it.
>
> A toggle without a documented home is a toggle that will surprise someone in 90 days.

---

## 1. Purpose

The Settings page (`SettingsScreen` in `screens.jsx`) is the operator's one place to change behavior without touching code. This ledger is the catalog of every setting that page exposes — plus the `localStorage` keys and `.env` variables that back them, plus the runtime services they affect.

This ledger is paired with — and explicitly distinct from — three sibling ledgers:

| Ledger | Owns |
|---|---|
| **Connections Ledger** | What external services are wired and what their credentials *are named* |
| **Settings Ledger** (this file) | What's user-changeable, where each setting persists, what it affects |
| **Source-of-Truth Ledger** §3 | Which file wins when two surfaces disagree |
| **Asset / Widget Map** §6 | The cross-page localStorage / window-event registry |

When Connections says "ClickUp uses `CLICKUP_API_TOKEN`," this ledger says "the operator can paste that token into the Settings page MCP credential editor; the save-flow writes to `/.env`, updates the in-memory env map, and logs `settings_mcp_credentials_save` to the activity ledger."

### Owns

- the **settings inventory** — every toggle, picker, and credential editor on the Settings page
- per-setting **persistence layer** (`.env` / `localStorage.secretary.tweaks` / runtime-only)
- per-setting **scope** (global / per-user / per-session)
- per-setting **default** value and **reset path**
- per-setting **change radius** (what gets re-rendered, what API path is affected)
- the **save / clear flow** for credentials (masked inputs, allowed-keys list, audit log)
- **demo mode** behavior (blocks connector writes)
- the **provider exclusivity rule** (Claude Code / OpenAI / Codex CLI — mutually exclusive)
- the **MCP server status registry** displayed on the Settings page

### Does not own

- raw secret values → never (per Connections Ledger §2)
- per-service contracts → `CONNECTIONS.md`
- per-page UI rendering of Settings → `page_asset_sitemap.md` §settings (canonical UI Done Gate)
- which file is canonical for a given truth → `SOURCE_OF_TRUTH.md`
- shared `localStorage` keys not exposed via Settings (`gridHistory`, `gridOverrides`, etc.) → `ASSET_WIDGET_MAP.md` §6.1
- file roles → `FILE_CONTENTS.md`

This ledger names **what changes when the user clicks a toggle**. Other ledgers name where the underlying state lives.

---

## 2. Settings Categories

| Category | Persistence | Resets via |
|---|---|---|
| Theme & layout | `localStorage.secretary.tweaks` | UI toggles + `Reset` button |
| Language / i18n | `localStorage.secretary.tweaks` (or related key) | Topbar language flip |
| Demo mode | `localStorage.secretary.tweaks` | toggle |
| Intelligence provider | `localStorage.secretary.tweaks.aiProvider` | three-way picker (mutually exclusive) |
| Provider-specific model | `localStorage.secretary.tweaks.openaiModel` / `piecesModel` | per-provider picker |
| Prompt enhancement | `localStorage.secretary.tweaks.promptEnhance` | toggle |
| Pieces model | `localStorage.secretary.tweaks.piecesModel` | picker |
| Browser-use defaults | `localStorage.secretary.tweaks.browserUse.*` | per-knob toggles |
| MCP / connector credentials | `/.env` (server-side) | Settings credential editor (save/clear) |
| MCP server status (read-only) | runtime — `/api/status` poll | refresh button |
| Reset all tweaks | wipes `secretary.tweaks` | `Reset` button |

---

## 3. Per-Setting Inventory

### 3.1 `tweaks.theme`

| Field | Value |
|---|---|
| Persistence | `localStorage.secretary.tweaks.theme` |
| Default | (project default, applied on load) |
| Scope | per-user (per-browser) |
| Affects | `styles.css` theme variables — every page |
| Reset | UI toggle or `Reset` button |
| Companion | `styles.css` cache-buster bump if theme tokens change |

### 3.2 Demo mode

| Field | Value |
|---|---|
| Persistence | `localStorage.secretary.tweaks.demoMode` |
| Default | `false` |
| Scope | per-user |
| Affects | `connectors.js` blocks all connector writes when on; proxy returns `{ demo_blocked: true }` for outbound channels |
| Side-effect rule | **Demo mode is the safest send-blocker.** Customer-facing automation should respect it before any send. |
| Reset | toggle off |

### 3.3 Intelligence provider (`tweaks.aiProvider`)

| Field | Value |
|---|---|
| Persistence | `localStorage.secretary.tweaks.aiProvider` |
| Allowed values | `claude_code` \| `openai` \| `codex_cli` |
| Default | (project default at install) |
| Scope | per-user |
| **Exclusivity rule** | **The three providers are mutually exclusive.** Only the selected provider receives chat / test / generate prompts. |
| Affects | `/api/chat/send`, `/api/claude_code/generate`, `/api/codex_cli/generate`, ChatRail behavior, Settings test buttons |
| Status surface | `/api/status` reports `claude_code_available`, `codex_cli_available`, `codex_cli_path` |
| Reset | provider picker (no full reset — must pick one) |
| Companion ledger | `CONNECTIONS.md` for `openai`, `claude_code`, and runtime claude/codex CLI entries |

### 3.4 OpenAI model (`tweaks.openaiModel`)

| Field | Value |
|---|---|
| Persistence | `localStorage.secretary.tweaks.openaiModel` |
| Default | (active model — currently GPT-5.4 family per 2026-04-27 alignment pass) |
| Scope | per-user |
| Affects | every `/api/chat/*` request when `aiProvider = openai`; preprocess/reflection passes inherit this |
| Side effect | wrong model can silently change tone, latency, cost — verify after change |
| Reset | model picker |

### 3.5 Pieces model (`tweaks.piecesModel`)

| Field | Value |
|---|---|
| Persistence | `localStorage.secretary.tweaks.piecesModel` |
| Default | (project default; can also be set via `PIECES_CHAT_LLM` env var) |
| Scope | per-user |
| Affects | `/api/pieces/ask` calls; Activity screen + Briefing ribbon completions |
| Reset | model picker |

### 3.6 Prompt enhancement (`tweaks.promptEnhance`)

| Field | Value |
|---|---|
| Persistence | `localStorage.secretary.tweaks.promptEnhance` |
| Default | (project default) |
| Scope | per-user |
| Affects | ChatRail prompt assembly (extra reasoning / structuring before send) |
| Reset | toggle |

### 3.7 Browser-use defaults (`tweaks.browserUse.*`)

| Sub-field | Persistence | Affects |
|---|---|---|
| Headless result count | `localStorage.secretary.tweaks.browserUse.resultCount` | ChatRail `browser use` worker page-fetch volume |
| Detail level | `localStorage.secretary.tweaks.browserUse.detail` | depth of fetched content per page |
| Return links | `localStorage.secretary.tweaks.browserUse.returnLinks` | whether links are surfaced in result |
| Screenshot capture | `localStorage.secretary.tweaks.browserUse.screenshots` | screenshot toggle on each fetch |

`browser use` is the background Playwright worker. `open browser` is the visible Chrome handoff and is **not** governed by these defaults — it always opens visibly.

### 3.8 MCP / connector credentials (server-side, masked)

| Field | Value |
|---|---|
| Persistence | `/.env` (server-side; written via `/api/settings/mcp_credentials/save`) |
| **Allowed keys** (allowlisted in server.py) | `OPENAI_API_KEY`, `GITHUB_TOKEN`, `CLICKUP_API_TOKEN`, `CLOSE_API_KEY` (verify against `_BLOCKED_DELEGATION_TOOLS` policy and current allowlist before adding) |
| UI surface | masked input rows on Settings page |
| Save flow | masked input → POST `/api/settings/mcp_credentials/save` → write to `/.env` → update in-memory env map → log `settings_mcp_credentials_save` to `_ledger/activity.jsonl` |
| Clear flow | clear button → POST same endpoint with empty value → removes from `.env` + memory |
| Read flow | `GET /api/settings/mcp_credentials` returns **masked status** (e.g., `"set" | "missing"`), never the raw value |
| Companion ledger | `CONNECTIONS.md` §5 (Credentials / Secret Locations Table) — for the full env-var roster |
| **Security rule** | **Never read or write a raw secret in any ledger entry, audit log, or UI surface.** The save flow is the only path. |
| Audit | every save / clear writes one line to activity ledger with key name (no value) and timestamp |

### 3.9 MCP server status registry (read-only)

| Field | Value |
|---|---|
| Persistence | runtime — read live from `/api/status` |
| UI surface | dedicated "MCP servers + delegation targets" section on Settings page |
| Refresh | manual refresh button + auto-refresh on page load |
| Surfaced targets | GitHub, ClickUp, Close, Claude Code, Codex CLI, Cursor (verify against current allowlist) |
| Per-target fields | availability, connector detail, write-approval policy, link to Delegations action zone |
| Cross-ref | `CONNECTIONS.md` for the underlying service inventory; `connectors.js` `readiness()` for the client-side state machine |

### 3.10 Language / i18n

| Field | Value |
|---|---|
| Persistence | (likely `localStorage` — verify exact key) |
| Affects | `window.Comeketoi18n` strings across every screen |
| Event | `comeketoagent:language` window event fires on flip |
| Topbar surface | language picker chip |
| Listener | every screen with i18n strings |

### 3.11 Reset

| Field | Value |
|---|---|
| Action | wipes `localStorage.secretary.tweaks` (and possibly other `secretary.*` keys per implementation) |
| Affects | every page that reads tweaks (effectively all) |
| **Does not affect** | `.env` credentials (those have their own clear flow per §3.8) |
| Confirmation | should require a confirm step (UI rule, not enforced server-side) |

---

## 4. Persistence Layers

### 4.1 Server-side `.env`

Used for: connector credentials.

| Key | Setting | Per-Connections-Ledger entry |
|---|---|---|
| `CLOSE_API_KEY` | Close credential editor | `CONNECTIONS.md` close |
| `CLICKUP_API_TOKEN` | ClickUp credential editor | `CONNECTIONS.md` clickup |
| `CLICKUP_SPACE_ID`, `CLICKUP_LIST_ID` | ClickUp scope | `CONNECTIONS.md` clickup |
| `SLACK_BOT_TOKEN` | Slack credential editor (when wired) | `CONNECTIONS.md` slack |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_API_KEY_SID`, `TWILIO_API_KEY_SECRET`, `TWILIO_WHATSAPP_FROM` | Twilio credential editors (when surfaced) | `CONNECTIONS.md` twilio |
| `OPENAI_API_KEY` | OpenAI credential editor | `CONNECTIONS.md` openai |
| `GITHUB_TOKEN` | GitHub credential editor | `CONNECTIONS.md` github |
| `PIECES_MCP_URL`, `PIECES_CHAT_LLM` | Pieces config (typically defaults) | `CONNECTIONS.md` pieces |
| `BROWSER_USE_PAYLOAD` | Browser Use config | `CONNECTIONS.md` browser_use |

**Rule:** the `.env` write path goes through `/api/settings/mcp_credentials/save` — **never via direct file edit from the UI side.** Direct `.env` edits by the operator (in their terminal) are allowed and orthogonal to the UI flow.

### 4.2 Client-side `localStorage.secretary.tweaks`

JSON object with these top-level fields (per Asset/Widget Map §6.1):

```jsonc
{
  "theme":        "<theme-id>",
  "demoMode":     true | false,
  "aiProvider":   "claude_code" | "openai" | "codex_cli",
  "openaiModel":  "<model-id>",
  "piecesModel":  "<model-id>",
  "promptEnhance": true | false,
  "browserUse": {
    "resultCount": <int>,
    "detail":      "<level>",
    "returnLinks": true | false,
    "screenshots": true | false
  }
}
```

Read by: `TweaksPanel` (grid + settings), `SettingsScreen`, `ChatRail`, `ai_instructions.js`.
Written by: Settings page UI controls + `TweaksPanel` toggles.

### 4.3 Runtime-only

Used for: MCP server status registry, browser-use sessions, current chat context.

Not persisted. Re-derived from `/api/status` (server) or `window.Secretary*` services (client) on each page load.

---

## 5. Save / Clear Flow (Credentials)

```
[Operator types token in masked input]
       ↓
[Submit]
       ↓
POST /api/settings/mcp_credentials/save
  body: { key: "CLOSE_API_KEY", value: "..." }
       ↓
[server.py allowlist check — key must be in approved set]
       ↓ (if allowed)
[write to /.env file]
       ↓
[update in-memory env map (so server picks up immediately, no restart)]
       ↓
[append to CCAgentindex/_ledger/activity.jsonl]
  { "kind": "settings_mcp_credentials_save", "key": "CLOSE_API_KEY", "ts": "..." }
  (key name only — never the value)
       ↓
[return { ok: true }]
       ↓
[UI shows masked "set" status]
```

**Audit rule:** every save / clear records the **key name and timestamp** to the activity ledger. The **value is never logged.**

**Allowlist rule:** if the key is not on the server's allowed list, the save is rejected. To add a new credential:
1. Add the env var name to the server allowlist (`server.py`).
2. Add the credential editor row to `SettingsScreen`.
3. Add the service entry to `CONNECTIONS.md`.
4. Update this ledger §3.8 + §4.1.

---

## 6. Demo Mode Behavior

When `tweaks.demoMode = true`:

- `connectors.js` `send()` returns `{ ok: true, note: "demo_blocked", demo_blocked: true }` for every outbound channel (Slack, ClickUp, Twilio, Email).
- Read paths still work — the operator can browse Boxes, view Pieces sweeps, run Close-API-read tests.
- The proxy on the server side checks the demo flag; even if a UI bug bypassed the client check, the server refuses the write.

**Use cases for demo mode:**
- New machine setup (test the UI without firing real customer messages)
- Onboarding a new team member
- Debugging a delegation flow without hitting external services

**Anti-pattern:** running automated tests against production data with demo mode off. Demo mode should be the default during dev and unit-test runs.

---

## 7. Provider Exclusivity Rule

`tweaks.aiProvider` is a single-value field with three allowed values: `claude_code`, `openai`, `codex_cli`.

**Only the selected provider receives chat / test / generate prompts.** The other two are dormant — their endpoints exist but no traffic routes through them.

| Provider | Backend endpoint | Runtime |
|---|---|---|
| `claude_code` | `/api/claude_code/generate`, `/api/chat/send` w/ `provider:"claude_code"` | local `claude -p` subprocess |
| `openai` | `/api/chat/send` w/ default routing (OpenAI API) | OpenAI API call from server |
| `codex_cli` | `/api/codex_cli/generate`, `/api/chat/send` w/ `provider:"codex_cli"` | local `codex exec` with selected GPT model + read-only sandbox |

**Switching providers:** instant. No restart needed. The picker writes to `tweaks.aiProvider`, every chat send checks it, the routes self-select.

**Caveat:** the picker writes to `localStorage` only — if you swap browsers or wipe storage, the provider resets to whatever the project default is. This is rare but worth knowing.

---

## 8. Cross-Page Effects (Change Radius)

When a setting changes, here's what's affected:

| Setting | Re-renders / re-fetches |
|---|---|
| `theme` | every page (CSS variables) |
| `language` | every screen with i18n strings (via `comeketoagent:language` event) |
| `demoMode` | every page that calls `connectors.js send()` (delegations, grid ChatRail, intake, boxes) |
| `aiProvider` | ChatRail, Settings test buttons, every `/api/chat/*` consumer |
| `openaiModel` / `piecesModel` | next chat / sweep / ask request |
| `promptEnhance` | ChatRail prompt assembly |
| `browserUse.*` | next ChatRail `browser use` worker run |
| MCP credential save / clear | server in-memory env map (immediate); affected service surfaces become available / unavailable |
| Reset | every page reading `secretary.tweaks` |

---

## 9. Update Protocol

Update this ledger when:

- a new toggle / picker / credential editor is added to `SettingsScreen`
- an existing setting's persistence layer changes (e.g., moves from localStorage to .env)
- a new env var is added to the server allowlist (also update `CONNECTIONS.md` §5)
- the demo mode block-list expands or contracts
- the provider exclusivity rule changes (e.g., a fourth provider is added)
- a setting becomes deprecated or removed
- a localStorage key shape changes (also update `ASSET_WIDGET_MAP.md` §6.1)

When updating: bump `Last updated`, refresh JSON mirror, append history. **If the change is purely a UI re-render of an existing setting, update `page_asset_sitemap.md` §settings only — not this ledger.**

---

## 10. Relationship To Other Ledgers

- **`CONNECTIONS.md`** — names which services exist, their env vars, failure modes. This ledger names which of those credentials the operator can edit through the UI.
- **`SOURCE_OF_TRUTH.md`** §3.5 — external-system trust ordering. This ledger sits below: which API/service is canonical lives there; how the operator configures access lives here.
- **`ASSET_WIDGET_MAP.md`** §6.1 — the full `localStorage` registry across pages. This ledger names which keys are user-changeable via the Settings page; the Asset/Widget Map names every key, including ones not surfaced in Settings (`gridHistory`, `gridOverrides`, etc.).
- **`page_asset_sitemap.md`** §settings — canonical UI Done Gate for the Settings page itself. This ledger references it; sitemap wins on per-page detail.
- **`DEFINITION_OF_DONE.md`** §5.8 (External Connection / API Work) — when adding a new external connection, the Done Gate reads "Settings Ledger is updated if user-facing configuration changed." This ledger satisfies that row.
- **`FILE_CONTENTS.md`** — `screens.jsx` (`SettingsScreen`), `connectors.js` (demo mode behavior), `server.py` (`/api/settings/*`).
- **`OPEN_PROBLEMS_LEDGER.md`** — Slack token-format issue (`xapp-` vs `xoxb-`) is a candidate problem that surfaces here as a bad-credential UX issue.

---

## 11. North Star Alignment

This ledger directly supports:

- **NS-04 Safe Automation** — demo mode + provider exclusivity + credential allowlisting are direct safety substrate.
- **NS-09 Agent Handoff Continuity** — a new agent can read this ledger and know exactly what the operator can change without code edits.
- **NS-10 Defense As First-Class Build Activity** — audit-logged credential saves are durable defense.
- **NS-06 Source-of-Truth Discipline** — clear distinction between server-side (.env), client-side (localStorage), and runtime-only persistence.

Indirect: NS-01 (durable memory), NS-02 (legibility).

---

## 12. Quick Reference (Operator Card)

If a teammate asks "where do I change X?":

| Change | Where |
|---|---|
| Theme | Settings page → theme toggle |
| Language | Topbar language chip |
| Turn off real sends | Settings page → demo mode toggle |
| Switch AI provider | Settings page → provider picker (claude_code / openai / codex_cli) |
| Change OpenAI model | Settings page → OpenAI model picker |
| Change Pieces model | Settings page → Pieces model picker |
| Add or rotate a connector key | Settings page → MCP credentials section → masked input + save |
| Adjust browser-use depth | Settings page → Browser Use section |
| Reset everything (UI side) | Settings page → Reset (does not affect `.env`) |
| Reset a credential | Settings page → MCP credentials → Clear |
| Edit `.env` directly | Operator's terminal — server picks up on next request via in-memory map (or restart for full reload) |

---

## 13. Final Operating Rule

> Connections names what's wired.
>
> This ledger names what's user-changeable.
>
> Every toggle has a known home, a known scope, a known reset path, and — for credentials — a known audit trail. No exceptions.

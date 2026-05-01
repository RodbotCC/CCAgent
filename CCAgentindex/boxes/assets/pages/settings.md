# Page Ledger — `settings`

Last updated: 2026-04-29 (initial creation — Phase 20; fifth Page Ledger; tier: domain)
Route: `settings`
Primary component: `SettingsScreen` in `screens.jsx`
Owner file: `screens.jsx`
Page status: **active** + **write-capable** + **high-risk (sensitive)**
Risk level: **high (sensitive)** — page writes credentials to `.env` (server-side allowlisted) + flips provider exclusivity + holds the demo-mode kill switch
Tier (Box Bus Ledger §3): **domain**
Sitemap section: [`page_asset_sitemap.md` §settings](../../page_asset_sitemap.md)
Pairs with: **`SETTINGS.md`** (the global Settings Ledger, which inventories the user-configurable surface). This Page Ledger is the per-page deep memory.
Related Done Gate: `DoD §5.3` + this ledger §10
Maintainer: Jake / Comeketo Agent project agents

> Two ledgers, one settings.
>
> **`LEDGERS/SETTINGS.md`** (global tier) catalogs **what's user-configurable** — 11 settings across 3 persistence layers, with the demo-mode rule, provider-exclusivity rule, and credential-save flow.
>
> **This file** (domain tier, page-level) carries the WHY behind the page itself — why the credential editor is masked-only, why provider switching is instant, why demo mode is the safest send-blocker on the project.

---

## 1. Page Purpose

The `settings` page is the **operator's single configuration surface**. Everything user-changeable about the running app lives here:

- Theme / layout
- Language / i18n
- Demo mode (the safest send-blocker)
- AI provider (3-way exclusive: claude_code / openai / codex_cli)
- Provider models (OpenAI + Pieces)
- Prompt enhancement
- Browser-use defaults (4 sub-fields)
- MCP / connector credentials (masked, allowlisted, audited)
- MCP server status (read-only registry)
- Reset

The page is the **only safe path to `.env` writes from inside the app** — direct `.env` edits in the operator's terminal are the other path (orthogonal, allowed).

---

## 2. User / Operator Use Case

| Want | Action |
|---|---|
| Switch theme | toggle |
| Change language | Topbar chip (also reflects in Settings) |
| Turn off real sends | demo mode toggle |
| Switch AI provider | 3-way picker (mutually exclusive) |
| Change OpenAI model | model picker |
| Change Pieces model | model picker |
| Add a connector key | masked input → save |
| Rotate a connector key | clear → save again |
| Adjust browser-use depth | sub-field toggles |
| See which MCP servers are healthy | refresh MCP server status section |
| Reset all UI prefs | Reset button (does not affect `.env`) |
| Reset a credential | per-credential Clear button |
| Edit `.env` directly | operator's terminal — server picks up via in-memory map (or restart for full reload) |

---

## 3. Route + Render Ownership

| Layer | Owner |
|---|---|
| Route registration | `app.jsx` `KNOWN_SCREENS` + route switch |
| Primary screen | `SettingsScreen` in `screens.jsx` (props: `tweaks`, `setTweaks`, `go`, `onReset`) |
| Sub-component | `IntelligencePanel` (provider + key + model controls) |
| Topbar entry | settings icon |
| Grid fallback entry | grid buttons |
| Persistence (client) | `tweaks` state in `app.jsx` → `localStorage.secretary.tweaks` |
| Persistence (server) | `/.env` via `/api/settings/mcp_credentials/save` |
| Server endpoints | `GET /api/status`, `POST /api/claude_code/generate`, `POST /api/codex_cli/generate`, `POST /api/browser_use/handoff`, `POST /api/browser_open/handoff`, `GET /api/settings/mcp_credentials`, `POST /api/settings/mcp_credentials/save` |
| Integrations | `window.SecretaryAI`, `window.Comeketoi18n` |
| Activity audit | `_ledger/activity.jsonl` `settings_mcp_credentials_save` events (key name + timestamp; **never the value**) |

---

## 4. Data Sources + APIs

**Persistence layers** (per `SETTINGS.md` §4):

- **`/.env` (server-side)** — connector credentials, allowlisted keys: `OPENAI_API_KEY`, `GITHUB_TOKEN`, `CLICKUP_API_TOKEN`, `CLOSE_API_KEY` (verify against current allowlist before adding new).
- **`localStorage.secretary.tweaks` (client-side)** — theme, demoMode, aiProvider, openaiModel, piecesModel, promptEnhance, browserUse.*.
- **Runtime-only** — MCP server status (read live from `/api/status`).

**APIs:**

| Endpoint | Purpose |
|---|---|
| `GET /api/status` | Universal health + provider availability + connector readiness |
| `POST /api/claude_code/generate` | Provider test path (claude_code) |
| `POST /api/codex_cli/generate` | Provider test path (codex_cli) |
| `POST /api/browser_use/handoff` | Browser-use background worker handoff |
| `POST /api/browser_open/handoff` | Browser-open visible Chrome handoff |
| `GET /api/settings/mcp_credentials` | Returns **masked status** (`set` \| `missing`), never raw values |
| `POST /api/settings/mcp_credentials/save` | Save credential — **allowlisted keys only**; writes to `.env`, updates in-memory env, logs to activity ledger |

---

## 5. Writes / Side Effects

**This page is the ONLY UI path for writing to `.env`.** Direct `.env` edits in the operator's terminal are orthogonal and allowed; no other UI surface should write to `.env`.

| Write | Target | Side effect |
|---|---|---|
| Theme / language / demo mode / etc. | `localStorage.secretary.tweaks` | every page rerenders that reads tweaks |
| Provider switch | `tweaks.aiProvider` | next chat / test / generate routes through new provider |
| Credential save | `/api/settings/mcp_credentials/save` → `.env` + in-memory env | one line in `_ledger/activity.jsonl` (key name + timestamp; **never value**); affected service surfaces flip from `needs-setup` to `ready` |
| Credential clear | same endpoint with empty value | removes from `.env` + memory; service flips to `needs-setup` |
| Reset | wipes `secretary.tweaks` | every tweaks-reading page rerenders |

**Risk:** **high (sensitive).** Credentials are sensitive even when masked. Audit log records key name only; the **save flow is the only UI path to `.env`**; the **value is never logged anywhere**.

---

## 6. Source-of-Truth Rules

Per `SOURCE_OF_TRUTH.md` §3.2 (Page/UI Truth) + §3.5 (External-System Truth):

- **`/.env` is the canonical credential store.** UI displays masked status; never the value.
- **`localStorage.secretary.tweaks` is canonical for client preferences.** Client wipes wipe these; `.env` is unaffected.
- **`/api/status` is the live truth for service availability.** Cached client-side, rechecked on every page load + manual refresh.

**Hard rule:** the value of a credential is never present in any ledger entry, audit log, error message, or UI surface other than the masked input. The save flow is the only path that touches the value, and it never logs it.

---

## 7. Widgets On This Page

Per sitemap §settings (canonical):

- **Theme / density / language toggles**
- **AI provider / key / model controls** (`IntelligencePanel`)
- **Demo mode + chat enhancement toggles**
- **Browser-use defaults section** (headless result count, detail level, return-links toggle, screenshot capture)
- **Pieces model selector**
- **MCP server / delegation target status registry** (GitHub, ClickUp, Close, Claude Code, Codex CLI, Cursor)
- **Credential editor** for MCP/connector keys (masked save/clear flow to `.env`)

**Cross-page widgets used:** `Topbar` chrome, `TweaksPanel` (also used on grid).

---

## 8. Supported States

| State | When | Render |
|---|---|---|
| Default | initial load | all sections visible; `tweaks` reflects current localStorage |
| Provider switching | provider picker click | instant tweaks update; live `/api/status` re-poll |
| Credential save in flight | masked input submit | save button busy state; activity log entry pending |
| Credential save success | response ok | masked status flips to `set`; affected services flip to `ready` on next `/api/status` poll |
| MCP target unavailable | `/api/status` reports target down | status registry row shows `needs-setup` / `misconfigured` |
| Demo mode on | `tweaks.demoMode = true` | demo mode toggle highlighted; downstream pages show `demo_blocked` indicators |

---

## 9. Page-Specific Guardrails

1. **Credentials are masked-only in the UI.** The masked input never displays an existing value; if the operator wants to verify a value, they read `.env` directly.
2. **The save endpoint allowlist is the gate.** A new credential editor row in the UI without a corresponding allowlist entry in `server.py` will silently no-op (the server refuses unrecognized keys). This is intentional — adding a new credential requires a deliberate code change.
3. **Demo mode toggle does not affect `.env`.** Reset wipes `secretary.tweaks` only. Credentials persist independently.
4. **Provider switching is instant — no restart.** The picker writes to `tweaks.aiProvider`; every chat-shaped path checks it on each request. This means the switch is durable but only at the Settings/localStorage level — a browser swap or storage wipe resets to the project default.
5. **Direct `.env` edits in the terminal are picked up via in-memory env map.** No restart needed for most env reads — but the server only re-reads on certain code paths. If a credential change doesn't take effect, restart `server.py`.

---

## 10. Page Done Gate (local-stricter)

- [ ] All DoD §5.3 boxes
- [ ] `page_asset_sitemap.md` §settings updated
- [ ] If a new credential editor row is added: server allowlist updated, `CONNECTIONS.md` §5 updated, `SETTINGS.md` §3.8 + §4.1 updated
- [ ] If a new tweak field is added: `SETTINGS.md` §3 inventory updated, `ASSET_WIDGET_MAP.md` §6.1 updated if cross-page
- [ ] If provider exclusivity changes (e.g., 4th provider): `SETTINGS.md` §7 updated, `CONNECTIONS.md` model-providers entries updated
- [ ] Cache-busters bumped
- [ ] §12 appended

---

## 11. Open Page Problems

- **Slack token format issue** (per `CONNECTIONS.md` slack entry). Current token is `xapp-` (app-level); `xoxb-` (Bot User OAuth) is needed. The Settings credential editor saves whatever the operator pastes — server doesn't validate format. A format-aware warning would help.
- **No "test connection" button per credential.** Operator pastes a key, saves, then has to navigate to a downstream surface to know if it works. A per-credential test endpoint would close the feedback loop.
- **Demo mode toggle is a single boolean.** Some operators want to demo-block writes to specific channels only (e.g., "block Twilio writes but allow ClickUp"). Current model is all-or-nothing.
- **No spend cap configurable.** OpenAI / Twilio / Claude Code / Codex CLI all bill per-use. Per-day or per-session caps would prevent runaway-script cost (mentioned in intake / delegations Page Ledgers too).

---

## 12. Recent Page Changes

### 2026-04-30 — Browser-use settings

Added a Browser use section with localStorage-backed defaults: headless result count, detail level, return-links toggle, screenshot capture. These settings feed the ChatRail `browser use` worker; `open browser` remains a visible Chrome handoff (not governed by these defaults). Cache-bust: `screens.jsx` 95→96.

### 2026-04-28 — Codex CLI provider

Added `codex_cli` as a third Intelligence provider beside Claude Code and OpenAI. Settings now shows a three-way selector and a selected-CLI binary row. Choosing Codex uses local `codex exec` with the selected GPT model and read-only sandbox; choosing Claude uses local `claude -p`. The single `tweaks.aiProvider` value makes the routes mutually exclusive — only the selected provider receives chat / test / generate prompts. `/api/status` now reports `codex_cli_available` + `codex_cli_path`. Cache-busts: `ai.js` 5→6, `chat.js` 9→10, `screens.jsx` 93→94, `app.jsx` 51→52.

### 2026-04-27 — MCP control layer

Added a dedicated "MCP servers + delegation targets" section with live status refresh from `/api/status`. Surfaces per-target availability + connector detail + write-approval policy for GitHub / ClickUp / Close / Claude / Cursor. Links directly into the Delegations action zone.

### 2026-04-27 — Credential wiring

Masked token inputs added for `OPENAI_API_KEY`, `GITHUB_TOKEN`, `CLICKUP_API_TOKEN`, `CLOSE_API_KEY` (save/clear). Backend supports `/api/settings/mcp_credentials` + `/api/settings/mcp_credentials/save`, writes allowed keys into local `.env`, updates in-memory env map, and logs `settings_mcp_credentials_save` to activity ledger.

### 2026-04-27 — Model-default alignment

Preprocess/reflection passes now inherit the active Settings model (`tweaks.openaiModel`) instead of hard-defaulting to `gpt-5.4-mini`, so operators can run GPT-5.4 end-to-end when selected.

### 2026-04-25 — Great trim

Stripped density/frames/gestures/prediction/auto-commit/memory rows. Remaining knobs: theme, demo mode, language, intelligence panel, prompt-enhance, pieces model, reset.

---

## 13. Architectural Rationale

**Why credentials are masked-only:** displaying a stored value in the UI creates an attack surface (shoulder surf, screenshot, screen recording). Masked-only is the conservative default; operators verify via `.env` directly when needed.

**Why the allowlist gates new credentials:** adding a credential should be deliberate — the UI editor + `CONNECTIONS.md` + server allowlist all move together, and the server allowlist is the load-bearing one. Bypassing the allowlist (e.g., by hand-editing `connectors.js` to send a non-allowlisted key) silently fails — by design.

**Why provider switching is instant:** modal switching (forms, save-then-restart) makes the UI feel heavyweight. The single-source-of-truth pattern (`tweaks.aiProvider` checked on every request) means the switch is real *and* fast.

**Why demo mode is server-side double-checked:** the UI path (`connectors.js` send returning `demo_blocked`) is convenience. The server-side proxy refuses connector writes when demo mode is on, even if the UI is bypassed. Two layers of enforcement for one rule.

**Why localStorage instead of server-side preferences:** operators are usually one-per-machine. Server-side preferences would imply multi-user support that doesn't exist yet. localStorage is fine until it isn't; when it isn't, the migration is small.

---

## 14. Related Ledgers / Files

- **Sitemap** — `page_asset_sitemap.md` §settings (canonical)
- **Settings Ledger** (the global tier) — `SETTINGS.md` (the user-configurable surface inventory; this file is the per-page deep memory)
- **Connections** — `CONNECTIONS.md` §4 (every wired service and its env vars), §5 (credentials table)
- **Asset/Widget Map** — §3.2 (`TweaksPanel` shared with grid), §6.1 (localStorage registry)
- **File Contents** — §6 (`screens.jsx` SettingsScreen), §7 (`server.py` `/api/settings/*`), §8 (CLAUDE.md if relevant)
- **DoD** — §5.3 (Page) + §5.8 (External Connection / API Work)

---

## 15. Future Direction

**Near-term:**
- Format-aware credential validation (Slack `xoxb-` vs `xapp-` warning)
- Per-credential "test connection" button
- Per-channel demo-mode granularity (block Twilio while allowing ClickUp)
- Per-day spend cap fields wired to provider (OpenAI/Twilio/Claude Code/Codex CLI)

**Phase B / C:** Settings page becomes operator console for the Reactive Box Network — provider switches emit envelope events; per-Box steward agents see "the model just changed; should I re-run the last sweep?"

---

## 16. Final Operating Rule

> Settings is the only path to `.env` writes from inside the app.
>
> Credentials are masked. Audit log records key name + timestamp — never the value.
>
> Sitemap wins on what's there. SETTINGS.md wins on the inventory. This ledger wins on why.

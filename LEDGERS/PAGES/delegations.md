# Page Ledger — `delegations`

Last updated: 2026-04-29 (initial creation — Phase 19; fourth Page Ledger; tier: domain)
Route: `delegations`
Primary component: `DelegationsScreen` in `screens.jsx`
Owner file: `screens.jsx`
Page status: **active** + **write-capable** + **high-risk**
Risk level: **high** — page submits / approves / executes drafts that reach external services and customer-facing channels through `connectors.js`
Tier (Box Bus Ledger §3): **domain**
Sitemap section: [`page_asset_sitemap.md` §delegations](../../page_asset_sitemap.md)
Related APIs: `GET/POST /api/delegate`, `GET /api/delegate/<id>`, `GET /api/delegations/drafts`, `POST /api/delegations/drafts/{create|update|delete|submit|rewrite|undo}`, `GET /api/status` (target availability)
Related Done Gate: `DoD §5.2` + `DoD §5.3` + this ledger §10
Maintainer: Jake / Comeketo Agent project agents

> Delegations is **the project's send surface**. Every customer-facing action that doesn't go through the inbox skill goes through here.
>
> The page enforces target-aware policy at the server (`server.py`): read routes are safe; writes for connector targets require explicit approval; GitHub additionally blocks when MCP is unavailable.

---

## 1. Page Purpose

The `delegations` page is **where drafts become actions**. It owns the queue of delegation drafts (incoming from chat handoffs, intake right-clicks, box right-clicks), the channel picker (Claude Code / GitHub / ClickUp / Close / Cursor), and the explicit approval-and-execute flow.

It is the **single chokepoint** for actions that escape the local app to external services.

---

## 2. User / Operator Use Case

Operators use this page to:

- **Review drafts** that arrived via handoff (chat, intake, boxes).
- **Pick a channel** for each draft (Claude Code / GitHub / ClickUp / Close / Cursor).
- **Edit the prompt** with markdown-first preview + Rewrite-with-AI helper.
- **Run reads safely** (read-class actions don't require approval).
- **Request write approval** for connector targets that need explicit gating.
- **Approve+execute writes** when ready — the high-risk action.
- **Watch the run timeline** of executed delegations with status + output.

---

## 3. Route + Render Ownership

| Layer | Owner |
|---|---|
| Route registration | `app.jsx` `KNOWN_SCREENS` + route switch |
| Primary screen | `DelegationsScreen` in `screens.jsx` |
| Cross-page bridge | `sendToDelegationsDraft` (called from boxes / intake right-click) |
| Topbar chip | `components.jsx` |
| Client API layer | `delegator.js` — `drafts`, `createDraft`, `updateDraft`, `deleteDraft`, `submitDraft`, `rewriteDraft`, run polling |
| Server endpoints | `server.py` `/api/delegate`, `/api/delegations/drafts/*` |
| Policy enforcement | `server.py` (target-aware: reads safe; writes for connectors gated; GitHub blocked when MCP down) |
| Storage | `CCAgentindex/_ledger/delegations/<request_id>.json` (run files), `CCAgentindex/_ledger/delegation_drafts.json` (draft store), `CCAgentindex/_ledger/delegation_draft_events.jsonl` (draft events) |
| Activity stream | mirrors dispatch events in `CCAgentindex/_ledger/activity.jsonl` |

---

## 4. Data Sources + APIs

**Data sources:**
- Draft store: `CCAgentindex/_ledger/delegation_drafts.json`
- Draft event log: `CCAgentindex/_ledger/delegation_draft_events.jsonl` (append-only)
- Run files: `CCAgentindex/_ledger/delegations/<request_id>.json`
- Activity ledger: `CCAgentindex/_ledger/activity.jsonl` (mirrors dispatch events)
- Channel readiness: `connectors.js` `SecretaryConnectors` (cached from `/api/status`)

**APIs:**

| Endpoint | Purpose |
|---|---|
| `POST /api/delegate` | Execute a delegation immediately (no draft step) |
| `GET /api/delegate/<id>` | Poll a run's status |
| `GET /api/delegations/drafts` | List drafts |
| `POST /api/delegations/drafts/create` | Create draft (also called by `sendToDelegationsDraft` from other pages) |
| `POST /api/delegations/drafts/update` | Edit draft |
| `POST /api/delegations/drafts/delete` | Delete draft |
| `POST /api/delegations/drafts/submit` | Submit draft → server picks read/write path per policy |
| `POST /api/delegations/drafts/rewrite` | Rewrite-with-AI helper |
| `POST /api/delegations/drafts/undo` | Undo last draft state change |
| `GET /api/status` | Reports `github_mcp` and `delegation_targets` availability |

---

## 5. Writes / Side Effects

**This page is the largest legitimate side-effect surface in the project.** Every non-inbox customer-facing action transits through here.

| Action | Side effect |
|---|---|
| Save draft | `delegation_drafts.json` updated; one event in `delegation_draft_events.jsonl` |
| Submit (read) | Run file at `_ledger/delegations/<request_id>.json`; activity log entry; **no external write yet** |
| Request write approval | Draft state advances to `pending_approval`; no external action yet |
| Approve + execute write | **External action fires** through the resolved channel (Close / ClickUp / Slack / Twilio / Claude Code / etc.) |
| Reject | Draft state → rejected; no external action |

**Risk:** **high.** Per `DEC-2026-04-28-005`, risky moves need isolated approval cards — that decision is enforced here. The two-step (submit → approve) flow exists because batched approval was the failure mode that prompted the decision.

**Demo mode:** `tweaks.demoMode` blocks all connector writes server-side per `connectors.js` proxy + `SETTINGS.md` §6. Even if the UI were bypassed, the server refuses.

---

## 6. Source-of-Truth Rules

- **Drafts:** `CCAgentindex/_ledger/delegation_drafts.json` is canonical. The UI is a view.
- **Runs:** `CCAgentindex/_ledger/delegations/<request_id>.json` is canonical per-run. Append-only ledger entries mirror dispatch events.
- **Channel readiness:** `/api/status` is the live source. `connectors.js` caches it client-side.

Per `SOURCE_OF_TRUTH.md` §3.5 (External-System Truth): the service's API is authoritative; the local mirror is rank 2; generated views are rank 3. This page operates at rank 3 — it dispatches against the API, then reads back through `_ledger/delegations/`.

---

## 7. Widgets On This Page

Per sitemap §delegations:

- **Draft queue columns** — draft / pending approval / running+history
- **Visual channel picker cards** — Claude Code / GitHub / ClickUp / Close / Cursor with readiness indicators + one-click target assignment
- **Final-edit panel** — label, prompt, policy target/intent, timeout, cwd
- **Markdown-first final-edit preview** (always rendered as markdown while editing)
- **Rewrite-with-AI helper**
- **Explicit action CTAs** — save / undo / run read / request write approval / approve+execute write / reject / delete
- **Right-click menus** on draft cards + run timeline rows + channel cards
- **Inline action feedback strip** (`ok` / `error` / `neutral`) after every critical interaction
- **Execution timeline of delegation runs**

**Cross-page widgets used:** `useContextMenu`, `Topbar` chrome, `SecretaryConnectors`.

---

## 8. Supported States

| State | When | Render |
|---|---|---|
| Empty queue | no drafts | empty state |
| Drafts present | drafts in store | three-column layout |
| Draft selected | one draft active | final-edit panel + channel picker visible |
| Submitted | draft in `pending` (read) or `pending_approval` (write) | status indicators on column |
| Running | `/api/delegate/<id>` reports `running` | timeline shows in-flight row |
| Completed | run reaches terminal state | timeline shows final output + status |
| Channel unavailable | `/api/status` reports target down | channel card shows `needs-setup` / `misconfigured` |
| Demo mode | `tweaks.demoMode = true` | proxy returns `demo_blocked: true`; UI shows blocked indicator |

---

## 9. Page-Specific Guardrails

1. **Approval is two-step for writes.** Submit → request write approval → approve+execute. The split exists because batched approval hides risk (`DEC-2026-04-28-005`). Don't try to collapse the steps.
2. **GitHub writes block when MCP is unavailable.** Server-side enforcement in `server.py` policy. The UI shows GitHub as unavailable; the server backstops if the UI is bypassed.
3. **Demo mode is the kill switch.** Per `SETTINGS.md` §6, demo mode blocks all connector writes server-side. Test runs should always have demo mode on.
4. **Run files are canonical per-run.** If a run looks wrong in the timeline, the run file at `_ledger/delegations/<request_id>.json` is the authoritative record. Don't trust the UI summary over the run file.
5. **Customer-facing channels (Close / Twilio / Slack) carry inbox skill obligations.** When a delegation targets one of these, walk `Auto/comeketo-inbox/SKILL.md` separately — the delegations page enforces channel-target policy but **not** content guardrails (fee waivers, scope promises, pricing claims).

---

## 10. Page Done Gate (local-stricter)

- [ ] All DoD §5.3 boxes
- [ ] DoD §5.2 (Automation/Scheduled Fire) walked when the change touches the submit/approve flow
- [ ] `page_asset_sitemap.md` §delegations updated
- [ ] If a new channel is added: registered in `connectors.js`, `CONNECTIONS.md`, `SETTINGS.md` allowlist (if credential-bearing), AND `server.py` policy
- [ ] If the approve flow changes: spot-checked against demo mode (must still block) AND against MCP-unavailable state (GitHub must still block)
- [ ] Cache-busters bumped
- [ ] §12 appended

---

## 11. Open Page Problems

- **Inbox-skill obligations are operator-enforced.** When a Close-channel delegation contains fee-waiver language, the operator must catch it. UI enforcement (a content-class warning before approve) would be Phase B/C work.
- **Run output rendering is uniform across channels.** Different targets produce wildly different output shapes; the timeline renders them all the same. A per-target output renderer would improve operator review.
- **No per-day or per-target spend cap.** Like Q&A on the intake page, a runaway script could rack up real cost (especially through Claude Code / Codex CLI runs). Cost-cap is a future consideration.

---

## 12. Recent Page Changes

The sitemap §delegations history was carrying intake history when this ledger was authored (sitemap line layout — entries above the §delegations header bleed into the lookup). The actual delegations-specific narrative beyond the sitemap commit lines:

- **`DEC-2026-04-28-005` is the page's load-bearing rule.** Risky moves need isolated approval cards. The two-step submit→approve flow is the enforcement.
- **Channel picker is visual-first** because operators reach for icons faster than dropdowns when targeting; readiness indicators surface availability without a separate status check step.
- **Rewrite-with-AI on the prompt** lets operators tighten language before submit — but the rewritten prompt is still subject to all guardrails.

---

## 13. Architectural Rationale

**Why two-step submit→approve for writes:** batched approval hides risk. Per `DEC-2026-04-28-005`, fee waivers / discounts / scope promises / pricing claims need isolated approval. The split is the architectural enforcement.

**Why server-side policy enforcement (not just UI):** the UI is a view. A bug or a malicious actor could submit a write through the API directly. Server-side `server.py` policy means the UI being right is a convenience, not a guarantee.

**Why channel readiness comes from `/api/status`:** the channel could become unavailable between page load and submit. Cached client-side state (`connectors.js`) is rechecked on every render; live readiness lives at `/api/status`.

**Why drafts persist between sessions:** an operator may compose a draft, get pulled away, return, and submit. A non-persistent draft store would lose work; the store at `_ledger/delegation_drafts.json` survives.

---

## 14. Related Ledgers / Files

- **Sitemap** — `page_asset_sitemap.md` §delegations (canonical)
- **Asset/Widget Map** — §3.3 (`useContextMenu`), §3.7 (`SecretaryConnectors`), §4.6 (delegations APIs)
- **File Contents** — §6 (`screens.jsx`, `delegator.js`, `connectors.js`), §7 (`server.py` policy + handlers), §11 (`_ledger/delegations/`)
- **Connections** — every active service (Close / ClickUp / Slack / Twilio / Claude Code / Codex CLI) is a delegation target
- **Settings** — §3.2 (demo mode kill switch), §3.3 (provider exclusivity), §3.8 (MCP credentials)
- **Decisions** — `DEC-2026-04-28-005` (risky-moves-need-isolated-approval — the load-bearing rule)
- **DoD** — §5.2 + §5.3
- **Open Problems** — recurring "plan-vs-comms staleness" + "approval-card workflow" patterns

---

## 15. Future Direction

**Near-term:**
- Per-target output renderers in the timeline
- Content-class warning when a Close-channel delegation contains fee-waiver / discount / scope-promise / pricing language
- Per-day spend cap configurable via Settings

**Phase B / C:** delegations integrates with the Reactive Box Network — drafts emit envelope events; per-Box subscribers see "a delegation was just sent that mentions me" and update their local state.

---

## 16. Final Operating Rule

> Drafts are intent. Runs are action. Approval is the gap between them.
>
> Sitemap wins on what's there. This ledger wins on why.

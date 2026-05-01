# Page Ledger — `automation`

Last updated: 2026-04-29 (initial creation — Phase 18; third Page Ledger; tier: domain)
Route: `automation`
Primary component: `AutomationShell` in `automation.jsx`
Owner file: `automation.jsx`
Page status: **active** + **write-capable** + **high-risk**
Risk level: **high** — page persists workflows / triggers / agent_plans / hook-state JSON to bedrock and fires scheduled customer-facing actions
Tier (Box Bus Ledger §3): **domain**
Sitemap section: [`page_asset_sitemap.md` §automation](../../page_asset_sitemap.md)
Related APIs: `/api/workflows/*`, `/api/triggers/*`, `/api/agent_plans/*`, `/api/catalog/edges/*`, `/api/state/snapshot`, `/api/hooks/snapshot`, `/api/hooks/toggle`, `/api/annotations/upload`
Related Done Gate: `DoD §5.2` (Automation/Scheduled Fire) + `DoD §5.3` (Page) + this ledger §10
Maintainer: Jake / Comeketo Agent project agents

> The automation page is **the most write-heavy surface in the project**. Workflows, triggers, agent plans, hook flags — all persist to bedrock JSON. Live state and hooks read directly from `_ledger/activity.jsonl`. Customer-facing scheduled fires can be created here.
>
> When the Reactive Box Network runtime lands (Phase C per `DEC-2026-04-29-013`), this page becomes its operator console.

---

## 1. Page Purpose

The `automation` page is **the project's automation control plane**. Five sub-tabs, each with a distinct job:

- **Workflows** — graph composer for `CCAgentindex/workflows/*.json`. Defines the multi-step shapes that triggers fire into.
- **Sub-agents** — full sub-agent planner. Plans persist to `CCAgentindex/agent_plans/*.json`. Simulated runs animate fanout SVG canvas through agent state machine (planning → tool_call → tool_await → reflect → shipped).
- **State** — observation-only readout. Live state machine derived from `_ledger/activity.jsonl` over 15m/1h/6h/24h/7d windows. Zero forms; pure derivation.
- **Hooks** — pre/post/on-blocked/on-draft/cron observation. 12-hook code-defined catalog; on/pause toggles persist to `CCAgentindex/hooks/state.json`.
- **Triggers** — daily clock + 5 trigger kinds (Cron / Watch / Webhook / Rule / Ribbon). Composers are dropdown-driven — **zero typed cron strings** by design.

All five sub-tabs are real pages — no `ComingSoonScreen` placeholders remain.

---

## 2. User / Operator Use Case

Operators (Jake primarily, eventually Andre) use this page to:

- **Compose a workflow** that fires when a trigger matches.
- **Author a sub-agent plan** for a fanout pattern (e.g., per-lead enrichment fanout — the `lead_enrichment_fanout` seed plan).
- **Watch live state** without touching anything — what's the agent fleet doing right now?
- **Toggle hooks** on/off without editing code.
- **Schedule recurring fires** through Cron / Watch / Webhook / Rule / Ribbon composers.

---

## 3. Route + Render Ownership

| Layer | Owner |
|---|---|
| Route registration | `app.jsx` mounts `AutomationShell` with `tab={route.tab \|\| "workflows"}` |
| Primary shell | `AutomationShell` in `automation.jsx` |
| Sub-tab strip | `AutomationSubTabStrip` |
| Workflows screen | `AutomationGraphScreen` (accepts `loadSlug` for cross-tab navigation) |
| Sub-agents screen | `SubAgentPlannerScreen` (+ `SapHeader`, `SapFanoutCanvas`, `SapInspector`, `SapBudgets`, `SapConcurrency`, `SapSpend`, `SapLiveStream`) |
| State screen | `StateMachineScreen` (+ `SmStateDiagram`, `SmTimeInState`, `SmActiveContext`, `SmStackTrace`) |
| Hooks screen | `HooksScreen` (+ `HkHeader`, `HkRequestTimeline`, `HkConfiguredList`, `HkPerfTable`, `HkSparkline`) |
| Triggers screen | `TriggersScreen` + `TgComposer` family (`TgComposerCron`/`Watch`/`Webhook`/`Rule`/`Ribbon`) + `TgWorkflowPicker` + `TgConfiguredList` |
| Server endpoints | `server.py` `/api/{workflows,triggers,agent_plans,catalog,state,hooks}/*` |
| Bedrock files | `CCAgentindex/{workflows,triggers,agent_plans,catalog/edges,hooks}/...`; all registered in `indexes/index.json` |

**Cross-tab navigation:** trigger rows with a workflow link call `go.replace("automation", { tab: "workflows", load: <slug> })`. `AutomationShell` forwards `loadSlug` to `AutomationGraphScreen`; an effect calls `loadWorkflow(slug)` once per slug change.

---

## 4. Data Sources + APIs

**Bedrock files (canonical):**
- `CCAgentindex/workflows/*.json`
- `CCAgentindex/triggers/*.json`
- `CCAgentindex/agent_plans/*.json` (seeded with `tagging_hygiene` + `lead_enrichment_fanout`)
- `CCAgentindex/catalog/edges/*.json`
- `CCAgentindex/hooks/state.json` (on/pause flags)

**Activity ledger (read-only):** `CCAgentindex/_ledger/activity.jsonl` — read directly by State + Hooks for live aggregation.

**APIs:**

| Domain | Endpoints |
|---|---|
| Workflows / catalog | `/api/workflows/list\|save`, `/api/catalog/edges/list\|get\|save\|delete\|bump_usage`, `/api/annotations/upload` |
| Triggers | `/api/triggers/list\|save\|delete` (v1 schema + per-kind extras: `cron.preset`, `watch.path/recursive/debounce_ms`, `webhook.service/endpoint/auth`, `rule.pattern_type/filter/pattern`, `ribbon.source/pattern`, cross-cutting `workflow_slug`) |
| Agent plans | `/api/agent_plans/list\|get\|save\|delete` |
| State | `/api/state/snapshot?window=15m\|1h\|6h\|24h\|7d` — server aggregates via `_STATE_RULES` heuristic (7 states: idle/planning/tool_call/tool_await/reflect/blocked/shipped) |
| Hooks | `/api/hooks/snapshot?window=...`, `POST /api/hooks/toggle {id, enabled?}` (12-hook hardcoded `_HOOK_CATALOG`) |

**Hook catalog is hardcoded in code** (`server.py` `_HOOK_CATALOG`) — the page can toggle on/pause but **cannot define new hooks from the UI**. New hooks require a code change.

---

## 5. Writes / Side Effects

| Write | Target | Activity log kind |
|---|---|---|
| Save workflow | `CCAgentindex/workflows/<slug>.json` | `automation_workflow_save` |
| Create / save / delete trigger | `CCAgentindex/triggers/<slug>.json` | `trigger_create` / `trigger_save` / `trigger_delete` |
| Create / save / delete agent plan | `CCAgentindex/agent_plans/<slug>.json` | `agent_plan_create` / `agent_plan_save` / `agent_plan_delete` |
| Catalog edge save / delete / bump_usage | `CCAgentindex/catalog/edges/<slug>.json` | `catalog_edge_save` / `..._delete` / `..._bump_usage` |
| Hook toggle | `CCAgentindex/hooks/state.json` | `hook_toggle` |

**State + Hooks observation are in-browser only** — no server side effect. State reads ledger and aggregates; Hooks reads ledger + state file.

**Side-effect risk:** **high.** Trigger saves create scheduled customer-facing actions when wired into a workflow with customer-facing sinks. Per `DEC-2026-04-28-005` (risky moves require isolated approval) + `Auto/comeketo-inbox/SKILL.md` guardrails, send-shaped actions need explicit gates — the trigger UI doesn't enforce send-safety; the *workflow* the trigger fires into does.

---

## 6. Source-of-Truth Rules

| Rank | Source | Renders here as |
|---|---|---|
| 1 | The bedrock JSON files themselves | composer state + configured-list rows |
| 2 | `_ledger/activity.jsonl` | State + Hooks observation (live) |
| 3 | `_HOOK_CATALOG` (server-hardcoded) | Hooks list (read-only catalog; on/pause persists separately) |

**Rule:** if a workflow / trigger / agent plan looks wrong on disk, the page reflects that. The page is not a layer of truth — the bedrock JSON files are. To "fix" a bad workflow: edit the JSON or use the composer's save path.

---

## 7. Widgets On This Page

Per sitemap §automation (canonical):

- **Workflows** — graph composer (existing `AutomationGraphScreen`)
- **Sub-agents** — header (plan picker + new/save/run/stop), fanout SVG canvas (orchestrator → row of SAs → merge node), sidecar (Concurrency Gantt / Spend / Live stream), Inspector, Budgets footer with `+ sub-agent`
- **State** — SVG diagram with current-state pulsing, time-in-state stacked bar + percentage legend, active-context card, stack trace of last 12 ledger events. Window picker, pause/refresh chips, 5s polling.
- **Hooks** — request timeline (8 staggered checkpoints), configured hooks list, performance table (P50/P95 declared, fires + errors live, sparkline). 6s polling.
- **Triggers** — 24h daily clock + 5 type cards + per-kind composer router + workflow target picker + auto-suggested labels + configured list with clickable workflow pills (cross-tab navigation).

**Cross-page widgets:** `Topbar` / `BottomStrip` / breadcrumbs (chrome).

---

## 8. Supported States

| State | When | Render |
|---|---|---|
| Workflows tab default | initial / `tab="workflows"` | graph composer empty or loaded |
| Sub-agents tab | `tab="subagents"` | planner with seeded plans |
| State tab | `tab="state"` | live state diagram + 5s polling |
| Hooks tab | `tab="hooks"` | hook list + 6s polling |
| Triggers tab | `tab="triggers"` | daily clock + composer router |
| Cross-tab load | `route.load=<slug>` | jumps to Workflows tab + loads slug |
| Polling paused | pause toggle on State or Hooks | last snapshot frozen with paused indicator |

---

## 9. Page-Specific Guardrails

1. **Triggers don't enforce send-safety.** The trigger UI saves scheduled fires; the *workflow* the trigger fires into is responsible for guardrails. When designing a trigger that targets a customer-facing workflow, walk `Auto/comeketo-inbox/SKILL.md` separately.
2. **Sub-agent simulated runs are in-browser only** — they animate the canvas but do **not** dispatch real work. A real-dispatch path would be Phase B/C work; until then, treat the sub-agent planner as a design surface, not a runtime.
3. **Hook catalog changes require code edits.** The UI only toggles on/pause; new hook definitions land in `_HOOK_CATALOG` in `server.py`. Don't try to define hooks from the UI.
4. **State observation is heuristic.** `_STATE_RULES` classifies events via substring matches. The 7-state classification is approximate; treat it as "what's happening, roughly" not "what's authoritatively true."
5. **Bedrock writes go through `_ledger/activity.jsonl`.** Every save / delete appends one line. If a save appears to silently no-op, check the activity log.

---

## 10. Page Done Gate (local-stricter)

- [ ] All DoD §5.3 boxes
- [ ] DoD §5.2 (Automation/Scheduled Fire Work) walked when adding a trigger composer or workflow shape
- [ ] `page_asset_sitemap.md` §automation updated
- [ ] If a new bedrock file is created in `workflows/`, `triggers/`, `agent_plans/`, `catalog/edges/`: registered in `indexes/index.json`
- [ ] If `_HOOK_CATALOG` changes: documented in this Page Ledger; `_HOOK_CATALOG` count updated; `Hooks` tab spot-checked
- [ ] If `_STATE_RULES` changes: heuristic accuracy spot-checked against ≥100 ledger events
- [ ] If a new trigger kind is added: composer router updated, schema docs in this ledger §4 updated, `tgAutoLabel` updated
- [ ] Cache-busters bumped in `Secretary.html`
- [ ] §12 (Recent Changes) appended

---

## 11. Open Page Problems

- **Sub-agent simulated runs vs real dispatch.** Currently animation-only. Phase B/C work to wire real dispatch through the Reactive Box Network runtime (per `BOX_BUS_LEDGER.md`).
- **Trigger send-safety not enforced at UI.** Mitigation: workflow-level guardrails. Risk: an operator could wire a Cron trigger to a bare customer-facing send-only workflow. Should add a UI warning when target workflow contains customer-facing sinks without approval gates.
- **`_STATE_RULES` heuristic drift.** Substring matching against `_ledger/activity.jsonl` event kinds. As new event kinds are introduced, the 7-state classification gets less accurate. Worth a periodic recalibration pass.
- **Hook performance table mixes declared P50/P95 with live fires/errors.** The declared values are static (from catalog); live values are real. Operators may not realize the perf claim is declared, not measured.

---

## 12. Recent Page Changes (narrative)

### 2026-04-25 — Sub-tab strip + Triggers built end-to-end

`AutomationShell` + `AutomationSubTabStrip` introduced as the routing wrapper. Workflows preserved unchanged (existing graph composer). Triggers built end-to-end: daily clock, type cards, cron composer, configured list backed by `CCAgentindex/triggers/*.json`. Why dropdown-driven with **zero typed cron strings**: typed cron is a foot-gun; presets are auditable.

### 2026-04-25 — Sub-agent planner pass

Replaced the `subagents` placeholder with a real planning surface. Plans seeded with `tagging_hygiene` + `lead_enrichment_fanout`. Schema-by-example: deep-cloned from seed, preserves `created_at`, bumps `version` on save. Why this matters: when Phase C runtime lands, these plans become the dispatch substrate — authoring them now means the runtime has real plans to dispatch against.

### 2026-04-25 — Text-overflow audit

Added `agTruncateLabel(label, role)` and `agTruncate(s, n)` SVG-text helpers. Per-role char limits (actor 11 / trigger 9 / transform 12 / sink 16 / state 12). Fixed the "6:45 AM daily" diamond overflow Jake flagged. Full label surfaces via native `<title>` browser tooltip on hover.

### 2026-04-25 — State machine pass

Replaced `state` placeholder with `StateMachineScreen` — observation-only readout (zero forms). Server-side `_state_snapshot` aggregates ledger over 15m/1h/6h/24h/7d windows. Verified against 822 ledger events over 7d. Why observation-only: the state machine is a *reading* of activity, not a *control* surface. Forms here would imply you can change state — you can't.

### 2026-04-27 (Last Verified)

Five sub-tabs all real pages. No placeholder screens remain.

---

## 13. Architectural Rationale

**Why all 5 sub-tabs persist to separate bedrock dirs:** workflows / triggers / agent_plans / catalog edges / hook state are distinct kinds of state with distinct lifecycles. Mixing them in one file would create coupling that change patterns reject.

**Why dropdown-driven trigger composers (zero typed cron):** typed cron strings are a foot-gun (parser ambiguity, off-by-one, timezone confusion). Presets are auditable and finite. The composer's job is to make the right shape easy and the wrong shape impossible.

**Why State and Hooks are observation-only:** they read what already happened. A control surface on top of derived state would conflate observation with control — exactly the failure mode that breaks reactive systems.

**Why the hook catalog is hardcoded:** a hook is a code-level integration point. Defining hooks from UI would mean the UI describes hook *intent* without actually wiring anything. The 12-hook catalog is the contract; the UI just decides which ones run.

---

## 14. Related Ledgers / Files

- **Sitemap** — `page_asset_sitemap.md` §automation (canonical)
- **Asset/Widget Map** — §3.3 (`useContextMenu`), §4 (workflows / triggers / agent_plans / state / hooks APIs)
- **File Contents** — §6 (`automation.jsx`), §7 (`server.py` automation handlers), §11 (bedrock indexes)
- **Box Bus Ledger** — §2.1 (manifest schema; sub-agent plans become Phase C runtime substrate)
- **Decisions** — `DEC-2026-04-28-005` (risky-moves-need-isolated-approval), `DEC-2026-04-29-013` (Reactive Box Network runtime deferred)
- **DoD** — §5.2 (Automation/Scheduled Fire) + §5.3 (Page) + §5.7 (Box manifest stub)
- **Open Problems** — recurring "plan-vs-comms staleness" pattern affects automation that fires plan-driven sends

---

## 15. Future Direction

**Phase B (sub-agent fleet):** sub-agent plans dispatched by real runtime instead of in-browser simulation. Requires Phase C runtime per `BOX_BUS_LEDGER.md`.

**Phase C (Reactive Box Network runtime):** automation page becomes the operator console for the live network. Trigger configurations become real subscriptions per `BOX_BUS_LEDGER.md` §2.1. Hook flags route through the bus. State observation reads propagation receipts in addition to activity log.

**Near-term:**
- UI warning when trigger targets customer-facing workflow without approval gates
- `_STATE_RULES` heuristic recalibration pass
- Distinguish declared vs measured P50/P95 in Hooks perf table

---

## 16. Final Operating Rule

> The bedrock JSON files are the truth. This page is the composer.
>
> Sitemap wins on what's there. This ledger wins on why.

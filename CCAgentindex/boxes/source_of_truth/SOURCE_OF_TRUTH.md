# Source-of-Truth Ledger

Last updated: 2026-05-01 (Phase 1.4 / ATOM-2026-04-30-0059 — added §11 'Box Authority Tiers' framing structural authority orthogonal to §3 per-domain trust orderings: Tier 0 Constitutional / Tier 1 Coordination / Tier 2 Domain / Tier 3 Leaf with assignment criteria, current inventory, trickle-down rules, escalation rules, orthogonality explanation, Box Graph UI rendering implication.)
Maintainer: Jake / Comeketo Agent project agents
Status: **active**
Tier (Box Bus Ledger §3): **global** — fans out to every Box that subscribes at the global tier
Read when: editing a file you didn't create, deciding which file to trust, resolving a conflict between two surfaces, designing a new automation that reads or writes state, or auditing whether a customer-facing send used the right facts.
Core rule: **Before changing information, know where the truth lives.**
Steward agent: not yet authored. Phase B work — when written it lands at `/Subagent Boxes/source_of_truth_subagent_package/`.

> The project has generated views, UI pages, local files, GitHub state, Close data, comms transcripts, profiles, plans, and ledgers.
>
> Confusing a view for truth creates dangerous edits. This ledger names which file wins, in which situation, against which other file.
>
> Where rules conflict, this ledger is the tiebreaker.

---

## 1. Purpose

This ledger is the **canonical home** for the project's source-of-truth rules. Pieces of this rule live in many places — Global Ledger §4, North Star NS-06, File Directory Ledger §6, Definition of Done §5.5, per-Box `00_meta.json` and `client_ledger.md`, and the inbox skill at `Auto/comeketo-inbox/`. Until now those pieces were mutually consistent but scattered. This ledger consolidates them, names the trust ordering for each domain, and adds the missing piece: the **Allowed-To-Know schema** that PROB-2026-04-28-001 has been waiting on.

### Owns

- the **universal trust ordering** rule (which kinds of files always beat which others)
- **per-domain trust orderings** (Client truth, Page truth, Project state truth, Decisions truth, External-system truth, Generated vs canonical, Plans vs comms)
- the **Allowed-To-Know schema** (four-bucket model: comms-confirmed, internal-strategy, protected, approval-required) — closes the schema-design portion of PROB-2026-04-28-001
- **conflict resolution rules** — what to do when two sources disagree
- the **canonical-vs-generated** boundary (extends FDL §6)
- the **plan-is-not-truth** rule (extends Global §4.5 and `DEC-2026-04-28-004`)
- **per-Box `source_of_truth` field** semantics — defines what `box.json.source_of_truth.{primary,generated}` means (referenced by `BOX_BUS_LEDGER.md` §2.1)
- **update protocol** — what to do when source-of-truth ownership shifts

### Does not own

- the actual canonical files → they live where they live (`01b_comms_verbatim.md`, `page_asset_sitemap.md`, etc.)
- the wire shape of `box.json` → `BOX_BUS_LEDGER.md` §2.1
- the runtime that reads source-of-truth fields → deferred to Phase C
- per-Client allowed-to-use *content* → per-Box `allowed_to_use.md` / `.json` (this ledger defines the schema; each Box authors its instance)
- the UI Done Gate → `page_asset_sitemap.md`
- ledger update rules → Definition of Done §6 Ledger Update Matrix
- the architectural question of "what's a Box" → Box Ledger
- the architectural question of "how Boxes connect" → Box Bus Ledger

This ledger names **what is true**. Other ledgers name **what to do** with the truth.

---

## 2. Universal Trust Ordering

When two surfaces disagree, this is the order:

1. **Source-of-record systems** (GitHub for code/configs/ledgers, Close.com for client comms, PiecesOS for activity memory).
2. **Verbatim records** in the local file tree (`01b_comms_verbatim.md`, raw `comms/*.json` payloads, `_ledger/activity.jsonl`).
3. **Curated records** in the local file tree (`01_comms.md`, `00_meta.json`, `client_ledger.md`).
4. **Approved operator notes** (audit markers, explicit handoffs).
5. **Strategy / planning documents** (`05_seven_day_plan.md`, `04_profile.md`, enrichment files) — **internal only, never customer-facing truth**.
6. **Generated views** (`today.html`, `master_ledger.csv`, dashboards, UI render output).

Higher rank wins. **Never invert this order.** If a generated view contradicts a curated record, the curated record is the truth and the generator is the bug.

---

## 3. Per-Domain Trust Orderings

The universal order applies; this section names the specific files in each domain.

### 3.0 Operator-Activity Truth (added 2026-04-30, COMM-2026-04-30-007)

For any question about *what the operator actually did on their machine* (sessions, durations, what they looked at, what they discussed, what they said in the moment):

| Rank | Source | Notes |
|---|---|---|
| 1 | Pieces MCP live state at `localhost:39300` | Authoritative system of record (operator's own machine) |
| 2 | `LEDGERS/atlas/<day-folder>/pieces_*.md` (alias to `/Users/jakeaaron/Documents/Atlas/`) | Pieces' curated workstream summaries written to disk daily — citation-rich, structured, durable |
| 3 | `LEDGERS/atlas/<day-folder>/entries.jsonl` (when present) | Raw event-level Pieces output, finer-grained than the markdown summaries |
| 4 | `_ledger/activity.jsonl` agent-generated entries | What the project's agents claim happened — useful for triangulation, NOT authoritative against Atlas for what the operator actually did |
| 5 | TCL §11 Session Log entries | Agent-summary of what a session did — bound by the agent's perspective, not the operator's |
| 6 | Chat scroll | Volatile; only useful within a single session |

**Rule:** when an agent ledger writes claim work that operator-actual-activity in Atlas contradicts, **Atlas wins for what-happened**. The agent-ledger then needs reconciliation — file a PROB describing the drift, do NOT auto-resolve. See `LEDGERS/BOXES/atlas/BOX.md` §4.1 for the two-truths contract; see COMM-2026-04-30-007 for the architectural rationale.

**Anti-rule:** Atlas does NOT win for "what the project decided" or "what the architecture is" — those live in the project ledgers. Atlas observes; ledgers settle. Both surfaces are load-bearing at different altitudes.

### 3.1 Client Truth

For any question about a client (their pricing conversation, head count, venue, dates, decisions, blockers):

| Rank | Source | Notes |
|---|---|---|
| 1 | Close.com (direct API) | Authoritative system of record |
| 2 | `Auto/Client Boxes/<Name>/01b_comms_verbatim.md` | Full Close transcripts mirrored locally |
| 3 | `Auto/Client Boxes/<Name>/comms/<type>_<date>_<id>.json` | Raw activity payloads from Close |
| 4 | `Auto/Client Boxes/<Name>/01_comms.md` | Curated exec summary |
| 5 | `Auto/Client Boxes/<Name>/00_meta.json` | Structured metadata |
| 6 | `Auto/Client Boxes/<Name>/client_ledger.md` | Running operator log |
| 7 | Audit markers in the box (`<YYYY-MM-DD>_audit_marker.md`) | Approved operator notes |
| 8 | `Auto/Client Boxes/<Name>/04_profile.md`, `*_enrichment.md` | **Internal strategy only — NEVER customer-facing truth.** |
| 9 | `Auto/Client Boxes/<Name>/05_seven_day_plan.md` | **Strategy draft. Subordinate to all of the above.** |

**Rule:** customer-facing copy must be grounded in ranks 1–4 (or rank 7, if the operator note explicitly authorized the fact). Rank 8 is **planning fuel, not content**. Rank 9 is **strategy, not truth**.

### 3.2 Page / UI Truth

For any question about a page, route, asset ownership, data binding, or component responsibility:

| Rank | Source | Notes |
|---|---|---|
| 1 | The actual `screens.jsx` / `app.jsx` / `*.js` source files | What runs |
| 2 | `page_asset_sitemap.md` (project root) | **Canonical UI Done Gate** — declares ownership, change checklist, history, last verified |
| 3 | Future `LEDGERS/PAGES/<route>.md` (planned) | Per-page deep memory |
| 4 | Future `LEDGERS/WIDGETS/<widget>.md` (planned) | Per-widget memory |

**Rule:** if the source file changed, the sitemap must be updated **in the same unit of work** (`DEC-2026-04-29-007`). UI rendering is never the source of truth — the rendered page is a view of `screens.jsx` + bedrock state, not a source.

### 3.3 Project-State Truth

For any question about what's true right now in the build:

| Rank | Source | Notes |
|---|---|---|
| 1 | GitHub `RodbotCC/CCAgent` `main` branch | Durable source of truth |
| 2 | Local working copy at `/Users/jakeaaron/Downloads/CC Agent/` | Working copy; may contain unpushed work |
| 3 | `LEDGERS/GLOBAL_LEDGER.md` §2 (Current World State) | Curated narrative — read first |
| 4 | `LEDGERS/TEMPORAL_CONTINUITY.md` §1 (Current Snapshot) | Cockpit log — recent moments |
| 5 | `git log` / `git status` / `_ledger/activity.jsonl` | Mechanical truth, append-only |

**Rule:** before any direct GitHub write, check `git status` — local unpushed work must not be overwritten (`DEC-2026-04-28-001`).

### 3.4 Settled-Rules Truth

For any question about what was decided, why, or whether a rule still binds:

| Rank | Source | Notes |
|---|---|---|
| 1 | `LEDGERS/DECISIONS_LEDGER.md` (active entries) | 17 active decisions — read before reversing architecture |
| 2 | `LEDGERS/DECISIONS_LEDGER.md` (under-review entries) | Transitional — verify before applying |
| 3 | `LEDGERS/COMMUNICATIONS_LEDGER.md` (entries with `Status: promoted`) | Promoted to Decisions; both stay live for one cycle |
| 4 | `LEDGERS/COMMUNICATIONS_LEDGER.md` (other active entries) | Pre-decision rules — settle into Decisions when stable |

**Rule:** if a rule contradicts a Decision, the Decision wins. If a Decision contradicts a Decision, the newer one wins (Decisions track `supersedes` / `superseded_by`).

### 3.5 External-System Truth

For external services (Close, PiecesOS, Twilio, Google, Slack, ClickUp, Supabase):

| Rank | Source | Notes |
|---|---|---|
| 1 | The service's own API/UI | Authoritative |
| 2 | Local mirror in the file tree (e.g., `01b_comms_verbatim.md`) | Snapshot — may be stale |
| 3 | Generated views/reports in the bedrock | Stalest — re-derive when in doubt |

**Rule:** if a generated view shows X but the API shows Y, **trust the API**. The local mirror needs a refresh, not the API. The Connections Ledger (planned) will codify this per-service.

### 3.6 Generated vs Canonical

Always prefer canonical over generated. The full list is `FILE_DIRECTORY_LEDGER.md` §6; the binding rules are:

- **If a file looks generated, find the generator before editing.**
- **Editing generated output as if it were canonical is a Done-Gate failure** (DoD §9).
- The orchestrator's `today.html` and `master_ledger.csv` are **views of state, not state itself** (Global §4.4).
- Cache-busted JS bundle references inside `Secretary.html` are managed by **bumping numbers**, not by editing the bundles.

### 3.7 Plans vs Comms

Seven-day plans (`05_seven_day_plan.md`) are **strategy drafts**.

- A plan does **not** override guardrails, current state, replies, approvals, or comms.
- **The plan is not truth. The box is truth.** (Global §4.5; `DEC-2026-04-28-004`)
- A meaningful client reply makes a plan **stale until reviewed**.
- Plans authored before guardrail enforcement may carry unsafe executable copy — **re-validate before plan-driven sends**.

---

## 4. Allowed-To-Know Schema (closes PROB-2026-04-28-001 schema-design portion)

The Wholesome Enrichment principle (`NORTH_STAR.md` §6) names a four-bucket model. This section turns that model into a **per-Client-Box schema** that automation can read.

### 4.1 The Four Buckets

| Bucket | Definition | Customer-facing? | Approval needed? |
|---|---|---|---|
| **comms_confirmed** | Facts the client actually said in comms (Close transcripts, emails, SMS, WhatsApp, calls, voicemails). | **Yes** — safe to use. | No. |
| **internal_strategy** | Useful internal context for planning — pulled from enrichment, profile, public sources. | **No** — never quoted to the client. May shape phrasing but not content. | Approval required to **promote** to customer-facing. |
| **protected** | Off-limits facts (sensitive personal info, household composition specifics, religious/political affiliation, immigration status, medical, etc.). | **No, never.** Even with approval — these stay out of customer-facing copy. | Hard refusal. |
| **approval_required** | Operator-decided facts or actions that need a human green-light before any send (fee waivers, discounts, pricing claims, scope promises, guarantees, guest-count commitments). | Only after approval. | **Yes — isolated approval card** per `DEC-2026-04-28-005`. |

### 4.2 Per-Box Implementation Contract

Each Client Box should carry an `allowed_to_use.md` (human-readable) and/or `allowed_to_use.json` (machine-readable). Recommended JSON shape:

```jsonc
{
  "box":          "<box id>",            // e.g., client_box:hugo_casillas
  "version":      "1",
  "last_updated": "<ISO date>",
  "buckets": {
    "comms_confirmed": [
      {"fact": "<text>", "source": "<comms file + activity id>", "ts": "<ISO>"}
    ],
    "internal_strategy": [
      {"fact": "<text>", "source": "<profile/enrichment file + line>", "may_shape": ["tone", "topic_choice"], "may_quote": false}
    ],
    "protected": [
      {"fact": "<text>", "source": "<file + line>", "reason": "<NS-04 / Wholesome Enrichment / privacy>"}
    ],
    "approval_required": [
      {"action": "<text>", "approver": "<role/name>", "approved": false, "approved_on": null}
    ]
  }
}
```

**Rules:**

- A fact lives in **exactly one** bucket. If it's both confirmed and sensitive, the protected bucket wins.
- Customer-facing copy may reference items from `comms_confirmed` and `approval_required` (only when `approved: true`).
- Customer-facing copy **may not** reference items from `internal_strategy` directly — only let strategy items shape phrasing.
- Items in `protected` never appear in any send, ever, regardless of approval.
- A new fact discovered during a session lands in `internal_strategy` by default. **Promotion to `comms_confirmed` requires a citable comms source.**

### 4.3 PROB-2026-04-28-001 Status Update

This schema closes the **first** close-criterion of PROB-001 ("Schema exists"). The remaining four criteria (at least one Client Box uses it; scheduled-fire / read protocol checks it; inbox guardrails reference it; Wholesome Enrichment principle mechanically enforced) are now **implementation work** — they belong in the Phase B / Phase C buildout, not in this ledger.

PROB-001 transitions from `open / blocked-by-schema-design` to `partial / blocked-by-implementation` (see Open Problems Ledger update in this same Phase 11 sprint).

---

## 5. Conflict Resolution Rules

When two sources disagree:

1. **Walk the universal ordering** in §2. Higher rank wins.
2. **If both sources are at the same rank**, prefer the **more recent** one (use `_ledger/activity.jsonl` timestamps, `git log`, or `last_updated` fields).
3. **If both are equally recent**, prefer the one **closer to the original system of record** (e.g., a transcript over a curated summary derived from the same transcript).
4. **If still ambiguous**, mark the disagreement as an Open Problems entry (`PROB-YYYY-MM-DD-XXX`) and either:
   - escalate to Jake for a tiebreaker, **or**
   - record both views and proceed with the safer one (the one less likely to send something wrong).
5. **Never silently merge.** If two sources disagree and you pick one, log which one you picked and why in the relevant ledger or audit marker.

> A disagreement is data. An ignored disagreement is a future bug.

---

## 6. Update Protocol — When Source-of-Truth Ownership Shifts

If a file is being **promoted** from generated → canonical, or **demoted** from canonical → generated, the change is a meaningful edit and must satisfy `DEFINITION_OF_DONE.md` §5.5 (Source-of-Truth Change Done Gate).

Required updates when source-of-truth shifts:

- This ledger (§3 per-domain table for the affected domain).
- `LEDGERS/FILE_DIRECTORY_LEDGER.md` §6 (Canonical vs Generated table).
- `LEDGERS/GLOBAL_LEDGER.md` §4 (point at this ledger; do not duplicate the rule).
- `LEDGERS/DECISIONS_LEDGER.md` (record the shift as a Decision if it affects more than one Box).
- Affected Box manifests (`box.json.source_of_truth.{primary,generated}`).
- `LEDGERS/OPEN_PROBLEMS_LEDGER.md` if migration carries risk.

---

## 7. Relationship To Box Bus Ledger

`BOX_BUS_LEDGER.md` §2.1 defines the `box.json` manifest, which carries:

```jsonc
"source_of_truth": {
  "primary":     "<which file/path is canonical>",
  "generated":   ["<which paths are views, not state>"]
}
```

**This ledger is the rulebook for what those values are allowed to be.**

- A Box's `primary` must be a file ranked at the top of its domain's trust ordering (§3).
- A Box's `generated` list must include every file the Box owns that the Generated-vs-Canonical rule (§3.6) classifies as derived.
- When the runtime lands at Phase C, the router will use these fields to decide which fan-out events about the Box can be trusted as state changes versus derived re-renders.

> Without this ledger, manifest values are guesswork. With it, every manifest can be reviewed for compliance.

---

## 8. Relationship To Other Ledgers

- **Global Ledger §4** holds the eight headline source-of-truth rules. From Phase 11 forward, Global §4 should reference *this* ledger as the canonical home and stop accreting per-domain detail.
- **North Star NS-06** names the principle ("Source-of-Truth Discipline"). This ledger operationalizes it.
- **Definition of Done §5.5** is the Done Gate for any change that shifts source-of-truth ownership. This ledger says **what** the truth is; DoD §5.5 says **what to do** when it changes.
- **File Directory Ledger §6** lists canonical vs generated paths. This ledger gives those lists their authority and adds the trust-ordering rule.
- **Open Problems Ledger PROB-001** waited on the Allowed-To-Know schema (§4 here). Schema-design close-criterion is now satisfied; implementation criteria remain open.
- **Box Ledger** says what a Box is. **Box Bus Ledger §2.1** says what a Box's manifest looks like. **This ledger** says what the manifest's `source_of_truth` field is allowed to point at.
- **Decisions Ledger** carries the rules that depend on this ledger's authority — `DEC-2026-04-28-001` (GitHub source-of-truth), `DEC-2026-04-28-003` (Client Boxes canonical), `DEC-2026-04-28-004` (plans-are-strategy-drafts), `DEC-2026-04-29-007` (sitemap-Done-Gate), among others.

---

## 9. North Star Alignment

This ledger directly supports:

- **NS-06 Source-of-Truth Discipline** — operationalizes the principle.
- **NS-01 Durable Project Memory** — names which file is the durable record per domain.
- **NS-04 Safe Automation** — the Allowed-To-Know schema (§4) is the substrate for safer customer-facing automation.
- **NS-09 Agent Handoff Continuity** — a new agent can read this ledger and instantly know what to trust where.
- **NS-10 Defense As First-Class Build Activity** — explicit conflict-resolution and update protocols are defense.

Indirect support: NS-02 (legibility), NS-07 (rebuildability — generators are named), Wholesome Enrichment principle (§4 four-bucket model is its mechanical form).

---

## 10. Update Rules

Update this ledger when:

- a new domain is added to the project that needs its own trust ordering
- an existing domain's trust ordering shifts (e.g., a new file class is introduced and outranks an existing one)
- the Allowed-To-Know schema gains a new bucket or rule
- a new external system is added (cross-link to the Connections Ledger when it lands)
- a Decisions Ledger entry creates a new source-of-truth claim (e.g., a future "single source of truth for venues" Decision)
- conflict-resolution rules need to expand (new failure modes encountered)

When updating: bump `Last updated`, refresh the JSON mirror, update the affected Decision or Open Problem entry if relevant, and update Global §4 to point here (do not duplicate the rule).

---

## 11. Box Authority Tiers (structural — orthogonal to §3 per-domain trust orderings)

> **Per `DEC-2026-04-30-005`** (Box-Ledger-Sub-agent fusion target primitive) **and scaffold §3** (`LEDGERS/Drafts/box_network_architecture_scaffold.md`): every Box has a structural **authority tier**. This is **separate from** the per-domain trust orderings in §3 above. Per-domain trust ordering says "for THIS kind of fact, trust THIS source." Authority tier says "in the BOX NETWORK GRAPH, this Box sits at THIS structural layer."

The two systems compose: a Tier 0 Box like the Decisions Ledger Box governs structural authority over decisions; the per-domain trust ordering for "settled architectural rules" says trust the Decisions Ledger first. Authority tier is the WHO of the network graph; per-domain trust is the WHAT of the per-fact resolution.

### 11.1 The four tiers

| Tier | Name | Role | Examples |
|---|---|---|---|
| **Tier 0** | **Constitutional** | Define global law. Rarely casual edits. When they emit, the system listens carefully. | Global Ledger Box, Source-of-Truth Box (this file), North Star Box, Decisions Box, Definition of Done Box, Box Bus Box |
| **Tier 1** | **Coordination** | Coordinate work across time. Control flow, sequencing, warnings, decomposition. | Temporal Continuity Box, Communications Box, Open Problems Box, Atom Box, Deprecation Box, Phase Box |
| **Tier 2** | **Domain** | Govern a functional area. Receive global law, interpret for area, escalate local patterns upward. | Client Boxes domain, Staff Boxes domain, Automation Box, Intake Box, Analytics Box, Page Boxes, Connections Box, Guardrails / inbox-skill Box |
| **Tier 3** | **Leaf** | Local state containers. Receive only the interpreted rules and state relevant to them. | One lead Box, one client Box, one coworker Box, one venue Box, one widget Box, one scheduled-fire Box, one report/snapshot Box |

### 11.2 Tier-assignment criteria

A Box is **Tier 0 (Constitutional)** when:
- It defines rules that other Boxes inherit ("don't push to main without a go-ahead" / "GitHub is the source of truth" / "every retirement needs a snapshot").
- Its content rarely changes after authoring.
- Other Boxes consult it before acting (the Read-First protocol points here).
- Reversing or contradicting its content requires a successor DEC.

A Box is **Tier 1 (Coordination)** when:
- It tracks state that changes across time (current sprint, last handoff, open problems list, atom queue).
- It doesn't define law itself but enforces sequencing of work that obeys law.
- Other Boxes emit events to it.
- Its primary writers are Sub-agents (stewards), not humans authoring rules.

A Box is **Tier 2 (Domain)** when:
- It governs a specific functional area (sales, inbox, page, automation, analytics, connections).
- It contains MULTIPLE state-bearing entities.
- It interprets Tier 0/1 rules for its specific area.
- It's where a domain-specific steward lives.

A Box is **Tier 3 (Leaf)** when:
- It represents ONE specific entity (one client, one venue, one widget, one scheduled fire, one daily snapshot).
- Its rules come from upstream tiers.
- It rarely emits upward — when it does, it's a "local pattern became systemic" escalation.
- It has the simplest possible mature shape (per `BOX_LEDGER.md` §16.4 leaf-class rules).

### 11.3 Current Box tier inventory (as of 2026-05-01)

**Tier 0 — Constitutional (6 Boxes):** Global Ledger (active), Source-of-Truth (planned `ATOM-0071`), North Star (active), Decisions (planned `ATOM-0071`), Definition of Done (planned `ATOM-0071`), Box Bus (planned `ATOM-0070`).

**Tier 1 — Coordination (6 Boxes):** Temporal Continuity (active), Communications (planned `ATOM-0071`), Open Problems (active), Atom (active — declarative steward), Deprecation (planned per `DEC-2026-04-30-002`), Phase (planned).

**Tier 2 — Domain (current candidates):** Client Boxes domain (28 entries existing; mature-shape migration Phase 7 / `ATOM-0094` Hugo first per Q6), Staff Boxes domain (10 entries deferred), Automation Box (planned `ATOM-0096`), Intake Box (planned), Analytics Box (planned), Page Boxes domain (5 of 14 Page Ledgers existing; Page Box wrappers `ATOM-0095`), Connections Box (planned), Guardrails/inbox-skill Box (`Auto/comeketo-inbox/` exists; mature-shape pending), File Directory (active — strictly Tier 1 ledger but bedrock-domain scope), Atlas (active — Tier 2 sweep/digest domain).

**Tier 3 — Leaf:** 28 Client Boxes + 10 Staff Boxes + 30 Venues + N people records + scheduled-fires + snapshots.

**Total Box count today (2026-05-01):** 6 unified Boxes operational at Tier 0/1 + ~38 leaf Boxes existing without `box.json` + ~14 Tier 0/1/2 Boxes planned. The Box Graph UI displays all of these (38 leaf boxes + 5 manifests visible at last render).

### 11.4 Trickle-down rules (per scaffold §4)

The system should NOT blast every global ledger entry into every Box. The correct model is **filtered inheritance** — a Box receives only what's relevant.

A Box should receive:
- The **global rules that affect it** (Tier 0 emits filtered through interpreters).
- The **domain rules that affect it** (its parent Tier 2 Box's emits filtered through interpreters).
- The **local records it owns** (its own state, never inherited from elsewhere).
- The **interpreted consequences it needs to act safely** (per `BOX_BUS_LEDGER.md` §4 Interpreter Tier model).

A Box should NOT receive:
- Irrelevant global noise.
- Raw private context from other Boxes.
- Generated views masquerading as truth.
- Upstream entries that require an interpreter but have not been interpreted yet.

**The goal: every Box knows what it is allowed and required to know. No Box knows everything.**

### 11.5 Escalation rules

Tier 3 Leaf Boxes can escalate UPWARD when local state becomes systemic:

| Source Tier | Escalation example | Destination Tier |
|---|---|---|
| Tier 3 (Client Box) | Guardrail violation found in plan | Tier 1 (Open Problems Box) |
| Tier 3 (Client Box) | Per-client lesson worth telling future agents | Tier 1 (Communications Box) |
| Tier 2 (Client Boxes domain) | Pattern observed across multiple Client Boxes | Tier 0 (Decisions Box — promote to rule) |
| Tier 2 (Page Boxes domain) | UI Done Gate violation needing Decisions reversal | Tier 0 (Decisions Box) |
| Tier 1 (Open Problems) | Problem closed by removal | Tier 0 (Deprecation Box) |
| Tier 1 (Atom Box) | Multiple atoms abandoned, same root cause | Tier 1 (Communications Box — re-decomposition surface) |

**Escalation is declared, not accidental.** A Box's `emits[]` declares what events it produces and which destinations subscribe. Today this is a manual cross-ledger write performed by a steward; in Phase C the runtime routes it.

### 11.6 Authority tier vs per-domain trust ordering (the orthogonality)

**Authority tier** answers: "in the structural graph, where does this Box sit?"

**Per-domain trust ordering** (§3 above) answers: "for THIS kind of fact, what do I trust first?"

Worked example — who decides what counts as "safe outbound copy" for a Client Box?

- **Per-domain trust ordering (§3.1 Client truth):** Rank 1 verbatim comms → rank 2 curated summary → rank 3 metadata → rank 4 operator notes → rank 5 strategy → rank 6 generated views.
- **Authority tier:** A Tier 0 Decisions Box can lock the rule (e.g., `DEC-2026-04-28-005` "risky moves require isolated approval"). A Tier 2 Guardrails Box interprets it for the inbox-skill domain. A Tier 3 Client Box receives the interpreted rule via subscribe entry.

These compose. **Per-domain ordering tells you HOW to resolve a per-fact disagreement. Authority tier tells you WHO can change the rules of resolution.**

### 11.7 Why authority tiers matter for the Box Graph UI

The Box Graph UI (route `box_graph`, shipped 2026-05-01) renders authority tiers as **lanes** — Constitutional / Global Ledgers / Domain Boxes / Leaf Boxes. The lane assignment is what makes the visualization legible:

- A reader skimming the graph sees Tier 0 nodes at the top and knows those are constitutional rules.
- An edge from Tier 3 → Tier 1 (escalation) is visually distinct from Tier 0 → Tier 3 (inheritance).
- Cycle detection (Phase 6.6 / `ATOM-2026-04-30-0091`) becomes simpler when the graph is layered.

Without this section, the Box Graph UI infers tiers heuristically from `box.json` `tier` fields. With this section, the inference becomes a verifiable lookup — and the Phase 4.2 authority tier registry (`ATOM-2026-04-30-0075`) becomes the canonical truth, with this SoT section as its conceptual reference.

---

## 12. Final Operating Rule

> Every file in this project is one of four things: a system of record, a verbatim mirror, a curated summary, or a generated view.
>
> Every Box in this project is one of four things: constitutional, coordination, domain, or leaf.
>
> Every disagreement between two of those resolves the same way: higher rank wins, higher tier governs, and disagreements at equal rank or equal tier are data — never to be silently merged.
>
> Before changing information, know where the truth lives. Before changing structure, know which tier owns the rule.

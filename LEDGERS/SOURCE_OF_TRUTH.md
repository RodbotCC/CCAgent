# Source-of-Truth Ledger

Last updated: 2026-04-29 (initial creation — Phase 11 of ledger system buildout; first ledger authored under the envelope-aware rule of `DEC-2026-04-29-013`)
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

## 11. Final Operating Rule

> Every file in this project is one of four things: a system of record, a verbatim mirror, a curated summary, or a generated view.
>
> Every disagreement between two of those resolves the same way: higher rank wins, and disagreements at equal rank are data — never to be silently merged.
>
> Before changing information, know where the truth lives.

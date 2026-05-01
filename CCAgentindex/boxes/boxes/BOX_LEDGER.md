# Box Ledger

Last updated: 2026-05-01 (Phase 1.1 / ATOM-2026-04-30-0056 — added §16 'Mature Box Shape' codifying the fused primitive: required + conditionally-required + optional pieces, per-Box-class shape rules, Box Bus declarative surface, Box Graph rendering contract, 7-step authoring sequence, anti-patterns, 9-item verification checklist. Cross-references DEC-005/006/007 + 5 existing unified Boxes.)
Maintainer: Jake / Comeketo Agent project agents
Status: **active**
Read when: deciding whether a directory should be a Box, stamping a new BOX.md, designing the local memory layer for a directory, or auditing a Box's discipline.
Core rule: **A meaningful directory should not be silent.**
Steward agent: not yet authored. Phase B work — when written it lands at `/Subagent Boxes/box_ledger_subagent_package/`.

> A Box is a directory with memory.
>
> The Global Ledger is the world map. The File Directory Ledger is the city map. The Box Ledger is the rule that makes every meaningful neighborhood self-explaining.
>
> If a directory matters, it should say what it is, what it owns, what it trusts, what it forbids, and how to leave it better than you found it.

> **Concept vs wire shape (2026-04-29):** This ledger owns the **concept** of a Box — what counts as one, what classes exist, what status labels apply, what the Local Agent Protocol is. The **wire shape** (the `box.json` manifest schema, the ledger envelope, routing tiers, interpreter tiers, cycle policy) lives in [`BOX_BUS_LEDGER.md`](BOX_BUS_LEDGER.md), authored Phase 10 under `DEC-2026-04-29-013`. **For the manifest schema, read the Bus Ledger.** The runtime that consumes manifests is deferred to Phase C; the schema is canonical now.

---

## 1. Purpose

This ledger is the project-level meta-ledger that **defines what a Box is** and **how Boxes work**.

A **Box** is the first leg of the architectural triad (`DEC-2026-04-29-001`):

- **Box** = the unit of state — a directory with memory, rules, source-of-truth notes, local ledgers, handoff context, and a Done Gate.
- **Ledger** = the legible memory of that Box.
- **Sub-agent** = the operator that reads / updates the Box and its Ledger.

Until this ledger landed, "Box" was used informally across the project — the term appeared in `CLAUDE.md`, the Global Ledger, the Triad Spine decision, and dozens of other places without a single definitional home. **This ledger is that home.** It absorbed the prior "Directory Configuration Ledger" plan into a unified concept under a cleaner name. After this ledger, every reference to "Box" anywhere in the project has a meaning that resolves here.

### Owns

- the **definition** of a Box (what counts, what doesn't)
- **Box classes** (`client | staff | orchestrator | inbox-skill | app-ui | automation | ledger | other`)
- **Box status labels** (`canonical | active | generated | mixed | legacy | archive | experimental | deprecated | external | sensitive`)
- the **standard local file** (`BOX.md`) and its required sections
- **when a directory needs a `BOX.md`** vs. when a lighter `DIRECTORY.md` is enough vs. when nothing is needed
- **local source-of-truth rules** (every Box must declare what's canonical and what's generated)
- **local Done Gate rules** (per-Box completion checks)
- the **Local Agent Protocol** (Read → Locate truth → Check rules → Edit narrowly → Verify → Record → Handoff)
- the **stamping rhythm** (which directories get stamped first, second, third)
- the **Box lifecycle** (created → active → audited → retired)
- the relationship between **project-level ledgers** and **per-Box ledgers**

### Does not own

- the project's **file tree map** → File Directory Ledger
- detailed per-file responsibility maps → File Contents Ledger (planned)
- the **Box concept's architectural authority** as a triad leg → that's settled in Decisions (`DEC-2026-04-29-001`); this ledger only operationalizes it
- per-Box content (each Box's actual canonical files, plans, audits, etc.) → lives inside the Box itself
- UI page ownership → page-asset sitemap + Asset/Widget Map (planned)
- runtime sub-agent behavior → individual sub-agent packages

This ledger defines the **pattern**. Local Boxes hold the **specifics**.

---

## 2. What Counts As A Box

**Not every folder needs a `BOX.md`.** Stamping every directory creates noise and dilutes the pattern.

A directory should become a Box when one or more of these is true:

- **Owns a major system** (Client Boxes, orchestrator, inbox skill, ledgers).
- **Contains canonical source-of-truth files** that other parts of the system depend on.
- **Contains generated files** that agents might accidentally edit as if they were source.
- **Has local rules or guardrails** that don't apply globally.
- **Has multiple important subfolders** that share local context.
- **Is frequently edited by agents** (and would benefit from local orientation).
- **Has caused confusion before** — the directory's purpose has been misunderstood.
- **Connects to external services** (Close, Pieces, Twilio, etc.) and carries credentials or contracts.
- **Contains client / customer data**.
- **Contains automation or scheduled-task behavior**.
- **Contains UI route / page / widget ownership**.
- **Requires a local Done Gate** (a completion check that the global rules don't capture).
- **Has local open problems or audit history** worth preserving.

If a directory matches **two or more** of those, it's clearly a Box.

If it matches **one and feels borderline**, use a lighter `DIRECTORY.md` instead (see §6).

If it matches **none**, leave it alone. Storage folders, generated outputs, npm dependencies, and `.git/` don't need orientation files.

### Examples that clearly need Box status

```
LEDGERS/                      — owns the project's memory spine
Auto/                         — owns automation, Client Boxes, orchestrator, inbox skill
Auto/Client Boxes/            — owns canonical client truth (28 boxes)
Auto/orchestrator/            — owns runtime/render/state layer
Auto/comeketo-inbox/          — owns inbox skill + guardrails
CCAgentindex/                 — owns app bedrock
project root (UI/app)         — owns UI source files + the meta harness
```

### Examples that don't

```
node_modules/                 — generated, in .gitignore
__pycache__/                  — generated bytecode
.git/                         — git internal
.logs/                        — generated runtime logs
LEDGERS/VISUALS/              — leaf folder; the parent Box covers it
```

---

## 3. Box Classes

Every Box declares a class in its header. This routes how it's read and audited.

| Class | What it is | Examples |
|---|---|---|
| `client` | Per-client memory and operating substrate | `Auto/Client Boxes/Brenda & Steve/` |
| `staff` | Per-staff voice / profile substrate | `Auto/Staff Boxes/Andre/` |
| `orchestrator` | Runtime / render / state layer | `Auto/orchestrator/` |
| `inbox-skill` | Inbox skill + guardrails | `Auto/comeketo-inbox/` |
| `app-ui` | UI source / route / component substrate | project root, page-specific subdirs |
| `automation` | Scheduled / triggered automation logic | future automation Boxes |
| `ledger` | Project-level ledger directory | `LEDGERS/` |
| `bedrock` | App-owned filesystem state | `CCAgentindex/` |
| `subagent-package` | Draft or runnable sub-agent config | `/Subagent Boxes/<name>/`, `CCAgentindex/agents/<name>/` |
| `reference` | Read-mostly reference material | `Ledger Drafts/`, `rawdata/` |
| `other` | Anything not yet classed (require a note explaining why) | — |

Classes are not mutually exclusive — a directory can carry secondary class context — but the **primary class** is the one declared in the BOX.md header.

---

## 4. Box Status Labels

Status labels describe the **operational state** of the Box's contents. A Box can carry one or more labels (e.g., `canonical + active + sensitive`).

| Label | Meaning |
|---|---|
| `canonical` | Source of truth lives here |
| `active` | Current working system |
| `generated` | Output from scripts / renderers / sweeps |
| `mixed` | Contains both source and generated files |
| `legacy` | Old but may still contain useful references |
| `archive` | Historical; do not use as current truth |
| `experimental` | Not production truth |
| `deprecated` | Should not receive new work |
| `external` | Vendor / imported / dependency-owned |
| `sensitive` | Contains credentials, private data, or risky client info |

### Examples

| Box | Labels |
|---|---|
| `Auto/Client Boxes/` | `canonical + active + sensitive` |
| `Auto/orchestrator/` | `active + mixed` |
| `Auto/orchestrator/state/` | `generated` |
| `Auto/comeketo-inbox/` | `canonical + active` |
| `LEDGERS/` | `canonical + active` |
| `Auto/Boxes/` (mirror) | `mixed + needs-verification` (per PROB-012) |
| `CCAgentindex/Rodbot/` | `legacy + archive` (wiped in Apr 2026 trim) |

If a Box's status changes (e.g., `active → archive`), the BOX.md header is updated **in the same unit of work** as the status change, per the TCL/GL Update Discipline (`DEC-2026-04-29-003`).

---

## 5. The Standard `BOX.md` Template

Every Box uses a single canonical local file: **`BOX.md`** at the directory root.

The stamp template lives at **`LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md`**. Copy it into the new Box and fill in the blanks.

### Required header

```
# {BOX_NAME} — Box Ledger

> One-line description of this Box.
>
> The Global Ledger is the world map. This Box is its neighborhood map.

Last updated: YYYY-MM-DD
Maintainer:   {who owns this Box}
Path:         `{relative path from project root}`
Box class:    `{client | staff | orchestrator | inbox-skill | app-ui | automation | ledger | bedrock | subagent-package | reference | other}`
Status:       `{canonical | active | generated | mixed | legacy | archive | experimental | deprecated | external | sensitive}` (one or more, comma-separated)
```

### Required sections

1. **Where Am I?** — one paragraph: what this directory is, why it exists, how it relates to the rest of the project.
2. **What This Box Owns** — explicit responsibilities.
3. **What This Box Does Not Own** — equally important; prevents over-reach.
4. **Source-of-Truth Inside This Box** — ordered list; higher entries win.
5. **Files That Matter** — table with File / Purpose / Owner / Edit-policy.
6. **Important Subdirectories** — only real children, with a one-line purpose each.
7. **Generated / Do-Not-Edit Areas** — explicit warning list.
8. **Local Operating Rules** — rules that apply here that don't apply globally.
9. **What Should Never Happen Here** — the fast-failure list.
10. **Local Agent Protocol** — short numbered list (see §9).
11. **Local Done Gate** — completion checks for changes inside this Box.
12. **Recent Local Changes** — append-only log; newest first.
13. **Open Local Problems** — found-but-not-fixed inside this Box; mirror entries to project-level Open Problems Ledger when project-wide.
14. **Next Handoff Notes** — what does the next agent need to know about this Box right now?
15. **Ledgers That Apply Locally** — links to project-level ledgers relevant when working in this Box.

### Required footer

```
## Update Rules For This Box Ledger

Update this file when:
- new files become canonical inside the Box
- the source-of-truth order changes
- a local rule is added or removed
- a forbidden action is added (lessons learned)
- the Box's class or status changes
- the Box is retired (mark status retired with date)
```

The template is **the contract**. A `BOX.md` that's missing any required section is incomplete and should be flagged as an Open Problem.

---

## 6. `BOX.md` vs `DIRECTORY.md`

A directory has three orientation options:

| Option | When to use | Template |
|---|---|---|
| **`BOX.md`** | The directory is a full Box per §2 — owns canonical truth, has local rules, has a Done Gate. | `LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md` |
| **`DIRECTORY.md`** | The directory is meaningful enough to need orientation but doesn't yet warrant a full Box (e.g., a reference folder, a small storage area with non-obvious contents). | `LEDGERS/LOCAL_TEMPLATE/DIRECTORY_ORIENTATION_TEMPLATE.md` |
| **(nothing)** | The directory is generated, ignored, or trivially obvious from its name. | — |

### Promotion path: `DIRECTORY.md` → `BOX.md`

Promote a `DIRECTORY.md` to a full `BOX.md` when any of these become true:

- The directory starts owning canonical truth that other parts of the system depend on.
- It develops its own source-of-truth rules.
- It develops its own forbidden actions.
- It develops a local Done Gate beyond the global one.
- More than one project-level ledger applies locally.

Promotion is not a one-way door — a Box can be downgraded to a `DIRECTORY.md` if its responsibilities shrink, but this is rare. Document promotion / downgrade in the Box's own Recent Local Changes section.

### Other local files (not orientation)

- `AGENTS.md` and `CLAUDE.md` are **agent-specific instructions** for subprocesses spawned in that directory. They are not Box orientation files. A directory can have both a `BOX.md` and an `AGENTS.md` (the BOX.md describes the directory's operational substance; the AGENTS.md tells spawned subprocesses how to behave).
- `<YYYY-MM-DD>_audit_marker.md` — per-event audit markers (e.g., the Brenda & Steve audit). These are not Box orientation files; they're local audit history that the Box's `Recent Local Changes` section may summarize.
- `client_ledger.md` and similar running logs — local content owned by the Box, not the orientation file itself.

---

## 7. Local Source-of-Truth Rules

Every `BOX.md` declares what to trust inside that Box.

### Required pattern

```
## 4. Source-of-Truth Inside This Box

Canonical here:
- {file or pattern}
- {file or pattern}

Generated here:
- {file or pattern}
- {file or pattern}

Trust order (higher wins on conflict):
1. {primary source file}
2. {secondary source file}
3. {tertiary source file}

If conflict:
- {resolution rule}
```

### Example: Client Boxes (per `DEC-2026-04-28-003`)

```
Trust order:
1. 01b_comms_verbatim.md and comms/*.json   ← full Close.com record
2. 01_comms.md                                ← curated exec summary
3. 00_meta.json                               ← structured metadata
4. client_ledger.md                           ← running operator log
5. operator-approved notes
6. 04_profile.md / *_enrichment.md            ← internal strategy ONLY, NOT customer-facing truth
```

### Example: orchestrator

```
Canonical here:
- scripts
- renderer logic
- ready-check logic

Generated here:
- state/*.html
- state/*.json
- state/*.csv
- state/runs/*.json

If generated output is wrong:
- Fix the source data or generator first, then regenerate. Do not hand-edit generated state.
```

This section is **non-negotiable**. A BOX.md without explicit source-of-truth rules is incomplete.

---

## 8. Local Done Gate Rules

Every `BOX.md` declares its **Local Done Gate** — the completion checks specific to changes inside that Box.

### Required pattern

```
## 11. Local Done Gate

Work in this Box is not done until:

- [ ] correct local source was changed (not generated output)
- [ ] generated files were not edited as if they were source
- [ ] local operating rules were followed
- [ ] forbidden actions were not taken
- [ ] relevant project-level ledgers were updated (per DEC-2026-04-29-003)
- [ ] local Recent Changes section is updated
- [ ] local Open Local Problems is updated if a problem was found
- [ ] handoff / audit note left if needed
- [ ] activity.jsonl appended for non-trivial changes
```

### Class-specific extensions

**Client Boxes:**
```
- [ ] If strategy or state changed, audit marker (YYYY-MM-DD_audit_marker.md) was created or updated
- [ ] If a plan was edited, "Audit-cleaned: <date>" line is on the plan file
- [ ] If a reply was received, plan was reviewed for staleness (per DEC-2026-04-28-004)
```

**App-UI Boxes:**
```
- [ ] page_asset_sitemap.md was updated in the same unit of work (per DEC-2026-04-28-007)
```

**Ledger Boxes:**
```
- [ ] TCL §1 / §3 was updated if structural change occurred (per DEC-2026-04-29-003)
- [ ] Global Ledger §12 was updated if major move
- [ ] Index updated if a new ledger row landed
```

**Sub-agent-package Boxes:**
```
- [ ] If graduating to runnable form, both /Subagent Boxes/<name>/ (canonical) and CCAgentindex/agents/<name>/ (runtime) are in sync
- [ ] activity.jsonl appended on every run (the steward agent does this automatically)
```

The **global** Definition of Done Ledger (planned) will eventually codify all this in detail per surface. Until then, each Box's Local Done Gate is the contract.

---

## 9. Local Agent Protocol

Every `BOX.md` carries a short numbered protocol for agents working inside it. The universal pattern:

```
Read → Locate truth → Check rules → Edit narrowly → Verify → Record → Handoff
```

### Standard expansion (copy into each BOX.md and customize)

```
## 10. Local Agent Protocol

Before editing anything in this Box:

1. Read this BOX.md fully.
2. Read linked project-level ledgers if relevant (Global, Temporal Continuity, Decisions).
3. Read the local source-of-truth files in trust order.
4. Identify whether the target file is source or generated.
5. Check local guardrails (§8) and forbidden actions (§9).
6. Make the smallest safe change.
7. Verify the change (run a check, view output, read diff) — or explain why verification was not possible.
8. Update local memory (Recent Local Changes, Open Local Problems).
9. Update project-level ledgers if the change affects global understanding.
10. Append to activity.jsonl for non-trivial changes.
11. Leave a handoff note if the next agent needs context.
```

This is the local enforcement of `DEC-2026-04-29-003` (TCL/GL Update Discipline). Same unit of work, every time.

---

## 10. Recommended First Boxes

Stamping every directory at once is a mistake. Roll out in waves.

### First Wave — load-bearing directories

```
LEDGERS/BOX.md
Auto/Client Boxes/BOX.md
Auto/orchestrator/BOX.md
Auto/comeketo-inbox/BOX.md
CCAgentindex/BOX.md
project root BOX.md   (covers app-ui)
```

These are the directories that, if silent, cause the most confusion across agents.

### Second Wave — substantial reference / runtime

```
Auto/Staff Boxes/BOX.md
Auto/Onboard Scripts/BOX.md
Subagent Boxes/BOX.md
Ledger Drafts/BOX.md
```

### Third Wave — per-class inner Boxes

```
Per-client BOX.md only for high-value or complex clients.
For most client folders, audit markers + the parent Auto/Client Boxes/BOX.md are enough.
```

Brenda & Steve and Hugo Casillas qualify as Third Wave candidates because they have specialized renderers and audit history.

### What NOT to stamp

Folders that don't need orientation:

- `node_modules/`, `__pycache__/`, `.git/`, `.logs/`, `.claude/`
- One-off generated output folders (e.g., `Auto/orchestrator/state/`)
- Empty placeholder folders
- `_vaults/<domain>/` dormant folders
- Per-event audit markers (already a marker, doesn't need a BOX.md)

---

## 11. Stamping Rhythm + Box Lifecycle

### Stamping rhythm

Stamping local `BOX.md` files is a **parallel track** to Phase A / B / C of the ledger system buildout (`DEC-2026-04-29-002`). It can run alongside Phase A.

The rhythm:

1. Pick a directory from the wave list (§10).
2. Read everything in it (or sample if large).
3. Copy `LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md` into the directory as `BOX.md`.
4. Fill in every required section honestly. Don't invent.
5. Append a row to the Box Ledger's "Stamped Boxes" registry (this ledger's §15.5, populated as boxes land).
6. Append to `activity.jsonl`.
7. Move to the next box in the wave.

**One Box at a time** — the same rhythm `DEC-2026-04-28-008` codifies for ledgers applies here.

### Box lifecycle

```
created → active → audited → (active | retired)
```

- **`created`**: stamp landed; required sections present; minimal content.
- **`active`**: in regular use; content matches reality.
- **`audited`**: latest pass confirmed accuracy; audit timestamp on the BOX.md or in a dated marker.
- **`retired`**: directory no longer used; BOX.md kept with `Status: retired YYYY-MM-DD` and a final note explaining why.

A retired Box's BOX.md is **not deleted** — it preserves rebuild instructions and historical context.

---

## 12. Common Mistakes

Guardrail list for agents authoring or auditing BOX.md files:

- **Treating a folder as a Box without need.** Stamping `node_modules/` would be silly. Stamping `Auto/Client Boxes/` is non-negotiable. Use §2 criteria.
- **Letting a Box's purpose drift.** A Box that says it owns one thing while doing another is worse than no Box at all.
- **Treating a local exception as a global rule.** One Client Box's edge case should not become an entry in this ledger.
- **Editing generated output.** If the BOX.md says a file is generated, fix the generator instead.
- **Making agents infer source-of-truth rules from scattered files.** §7 in the BOX.md is non-negotiable.
- **Overloading the Global Ledger with details that belong in a local Box.** If it's local, the Box owns it.
- **Creating local rules without linking back to the global ledger that authorizes them.** A local rule that contradicts the Global Ledger is a problem.
- **Forgetting that directories can contain sensitive data.** Use the `sensitive` status label and act accordingly.
- **Stamping every directory.** Discipline matters. Most directories don't need a BOX.md.
- **Treating the BOX.md as static.** A Box is living memory. If it doesn't update, it's wrong.

---

## 13. Visualization Index

Mermaid `.mmd` files under `LEDGERS/VISUALS/`:

| Visual | Path | Purpose |
|---|---|---|
| Box orientation flow | [`VISUALS/box_orientation_flow.mmd`](VISUALS/box_orientation_flow.mmd) | Agent enters directory → reads BOX.md → identifies truth → checks rules → edits → applies Local Done Gate. |
| Box hierarchy | [`VISUALS/box_hierarchy.mmd`](VISUALS/box_hierarchy.mmd) | Global Ledger → File Directory Ledger → Box Ledger → per-class BOX.md instances. |

---

## 14. Update Rules

### Update this ledger when

- a new Box class is recognized (extends §3)
- a new Box status label is needed (extends §4)
- the standard BOX.md template structure changes (§5)
- the source-of-truth pattern changes (§7)
- the Done Gate pattern changes (§8)
- the Local Agent Protocol changes (§9)
- the wave plan changes (§10)
- the lifecycle changes (§11)
- a common mistake is identified (extends §12)

### Do **not** update this ledger when

- a single Box's content changes (that goes in the local BOX.md)
- a single directory's status changes (local BOX.md)
- a per-Box audit happens (local audit marker + Recent Local Changes)
- a stamping decision for one specific directory is made (just stamp it)

### Cross-ledger update obligation

Per `DEC-2026-04-29-003`: when this ledger or any local BOX.md changes, **update the orientation surface in the same unit of work** — TCL §3 if structural, GL §12 if major, activity.jsonl on every change.

---

## 15. Relationships To Other Ledgers

### Triad Spine (`DEC-2026-04-29-001`)

This ledger operationalizes the **Box leg** of the triad. Every stateful entity gets a Box; this ledger defines what that means.

The other two legs:

- **Ledger leg** = project-level ledgers under `LEDGERS/` (Phase A) + per-Box ledgers (sections inside each `BOX.md`)
- **Sub-agent leg** = sub-agent packages under `/Subagent Boxes/` (draft form, Phase A done) → runnable agents under `CCAgentindex/agents/` (Phase B) → Subagent Boxes (Phase C)

### File Directory Ledger

Maps **what directories exist**. This ledger defines **which of those directories should have a `BOX.md`** and **what that BOX.md must contain**. Clean separation:

- File Directory Ledger answers: *what is here?*
- Box Ledger answers: *which of these is a Box, and what does each Box look like?*
- Local BOX.md answers: *how do I work safely inside this specific directory?*

When a new directory is added, the File Directory Ledger gets a row; the Box Ledger decides if a BOX.md is warranted; the BOX.md gets stamped if so.

### Decisions Ledger

Several Decisions are operationalized through Boxes:

| Decision | How Boxes operationalize it |
|---|---|
| `DEC-2026-04-28-003` Client Boxes Canonical | The 28 Client Boxes are the largest Box class instance; their BOX.md files enforce the trust order. |
| `DEC-2026-04-28-006` Boxes Page Display Only | The Auto/Client Boxes/ Box owns canonical truth; the UI Box (project root) only displays it. |
| `DEC-2026-04-28-007` Sitemap Done Gate | The app-ui Box class extends its Local Done Gate to require sitemap updates. |
| `DEC-2026-04-29-001` Triad Spine | This entire ledger is the operational form of that decision. |
| `DEC-2026-04-29-003` TCL/GL Update Discipline | Local Agent Protocol §9 enforces it at the Box level. |

### Communications Ledger

Each Box's Recent Local Changes and Next Handoff Notes are the **local equivalents** of the global Communications Ledger. Local-context messages stay in the Box; project-wide messages get promoted to Communications.

| Local (Box) | Global (Communications) |
|---|---|
| "Brenda's plan was cleaned 2026-04-28" (audit marker) | "Fee-waiver lesson applies to all Client Boxes" (`COMM-2026-04-28-003`) |

### Open Problems Ledger

Each Box's Open Local Problems mirrors the **local view** of the global Open Problems Ledger. A problem that's local to one Box stays local; a problem with project-wide implications gets a `PROB-` ID and lives in both places (with the local Box pointing to the global PROB).

### Source-of-Truth Ledger (planned)

When that ledger lands, it will codify the project-wide truth-ownership rules. Each Box's §4 (Source-of-Truth Inside This Box) is the **local implementation** of those project-wide rules.

### Definition of Done Ledger (planned)

When that ledger lands, it will codify completion standards per surface. Each Box's §11 (Local Done Gate) is the **per-Box specialization** of those standards.

---

## 15.5 Stamped Boxes Registry (placeholder)

Once stamping begins, this section tracks which directories have been stamped and when. Format:

```
| Path | Class | Status | Stamped on | Last audited |
|---|---|---|---|---|
| LEDGERS/ | ledger | canonical + active | YYYY-MM-DD | YYYY-MM-DD |
| Auto/Client Boxes/ | client | canonical + active + sensitive | YYYY-MM-DD | YYYY-MM-DD |
| ... | | | | |
```

**Currently empty.** Stamping begins in a separate session per the meta-only-this-session decision.

---

## 16. Mature Box Shape (the fused primitive)

> **Per `DEC-2026-04-30-005`:** the mature primitive is `Box = Ledger + Rules + Sub-agent + Config + Receipts`. A Box is not a folder — it is a **stateful memory object with an operating contract**. Access is governed. When any agent enters a Box, it enters through local instructions, declared source-of-truth rules, routing subscriptions, interpreter rules, and append-only receipt discipline. The directory stops being passive storage; it becomes a **governed object**.

This section pins what the mature shape looks like on disk. Authoritative for every Box authored from Phase B onward. The 5 existing unified Boxes (`temporal_continuity`, `atoms`, `global_ledger`, `file_directory`, `atlas`) demonstrate the pattern in practice.

### 16.1 Required pieces (every mature Box has these)

| File / Folder | Purpose | Authoritative reference |
|---|---|---|
| `BOX.md` | Human orientation. What the Box is, owns, trusts, forbids, how it counts as done. | This ledger §5 (template) |
| `box.json` | Machine-readable manifest. Declares id/slug/kind/tier/owns/source_of_truth/etc. | `DEC-2026-04-30-006` (9 required + 5 recommended + 3 runtime fields) + `BOX_BUS_LEDGER.md` §2.1 |
| `receipts/` | Per-run audit trail for any steward operating on this Box. | This ledger §X (steward protocol) |

### 16.2 Conditionally required pieces

| File / Folder | Required when | Reference |
|---|---|---|
| `LEDGER.md` + `LEDGER.json` | Box has evolving narrative state worth preserving. Ledger Boxes always have these (governing top-level `LEDGERS/<NAME>.md` by reference per `DEC-2026-04-29-015`). Client / Staff / Page Boxes have richer multi-file ledger structure (e.g., `client_ledger.md` + `01_comms.md` + `01b_comms_verbatim.md`). | `DEC-2026-04-29-015` |
| `steward/AGENTS.md` + `steward/config.json` + `steward/prompt.md` | Box has a runnable steward sub-agent (ledger Boxes, automation Boxes, intake/analytics/connections Boxes). | `DEC-2026-04-30-007` |
| `<box>/AGENTS.md` (root level) | Box has local rules stricter than upstream defaults — e.g., a Client Box with per-client guardrails (Brenda fee-waiver per `DEC-2026-04-28-005`). May coexist with `steward/AGENTS.md`. | `DEC-2026-04-30-007` |

### 16.3 Optional pieces (Phase B declarative, Phase C runtime)

| File / Folder | Purpose | Phase status |
|---|---|---|
| `inbox/` | Holds delivered Box Bus envelopes waiting for interpretation. | Q5 resolution pending — virtual until runtime per current default; physical at Phase C |
| `outbox/` | Holds local events ready to emit upstream. | Same as inbox/ |
| `steward/skills/` | Specialized skill folders the steward uses (e.g., `comeketo-inbox/` skill). | Optional always |
| `digests/` | Persistent human-readable output home for steward summaries (atlas Box uses this). | Per-Box discretion |
| `triggers/` symlink or reference | Points at scheduled-fire config when Box has scheduled steward runs. | Phase B optional |

### 16.4 Per-Box-class shape rules

The mature shape varies by Box class (`box.json` `kind` field per `DEC-2026-04-30-006`):

#### `kind: "ledger"` — ledger Boxes (Tier 0/1)

```
LEDGERS/BOXES/<name>/
├── BOX.md                  required
├── box.json                required
├── steward/
│   ├── AGENTS.md           required (always — ledger Boxes always have stewards)
│   ├── config.json         required
│   └── prompt.md           required
└── receipts/               required (may be empty initially)
```

**Note:** the canonical ledger files stay at top-level `LEDGERS/<NAME>.md` and `LEDGERS/<NAME>.json` per `DEC-2026-04-29-015`. The Box governs them by `box.json` `owns[]` path reference. Ledger Box folder does NOT relocate the ledger.

**Examples:** `LEDGERS/BOXES/temporal_continuity/`, `LEDGERS/BOXES/atoms/`, `LEDGERS/BOXES/global_ledger/`.

#### `kind: "client"` — Client Boxes (Tier 3)

```
Auto/Client Boxes/<Name>/
├── BOX.md                            required
├── box.json                          required (Phase 7 migration adds this)
├── 00_meta.json                      required (canonical structured metadata)
├── 01_comms.md                       required (curated exec summary)
├── 01b_comms_verbatim.md             required (full Close.com transcripts)
├── client_ledger.md                  required (running operator log)
├── comms/<type>_<date>_<id>.json     required (raw payloads, append-only)
├── 04_profile.md                     required (internal strategy)
├── 05_seven_day_plan.md              optional (strategy draft)
├── AGENTS.md                         required IF local guardrails differ (else optional)
├── intake_drops/                     optional (operator reference / future automation input)
└── receipts/                         optional (created when steward operates)
```

**Note:** Client Boxes are canonical client truth per `DEC-2026-04-28-003`. They predate the unified Box pattern. Phase 7.1 (`ATOM-2026-04-30-0094`) adds `box.json` to the first Client Box (Hugo Casillas per Q6 resolution); subsequent migrations follow.

#### `kind: "staff"` — Staff Boxes (Tier 3)

Similar to Client Boxes but lighter. `00_meta.json` + voice profile + style notes + `box.json` (post-migration).

#### `kind: "page"` — Page Boxes (Tier 2 domain)

```
LEDGERS/BOXES/page_<route>/
├── BOX.md                  required
├── box.json                required
├── PAGE_LEDGER.md          required (existing PAGES/<route>.md governed by reference)
├── steward/                optional (if the page has Page-Asset Interpreter wiring per Phase 5.6)
└── receipts/               optional
```

**Note:** the canonical Page Ledger stays at `LEDGERS/PAGES/<route>.md`. Box `owns[]` references it. Per `DEC-2026-04-28-007`, `page_asset_sitemap.md` remains the UI Done Gate; the Page Box is the narrative deep-memory home.

#### `kind: "automation"` — Automation Boxes (Tier 2 domain)

Cross-cutting Box governing multiple paths (e.g., `Auto/orchestrator/wiring/` + `automation` UI page). `box.json` `owns[]` declares all paths. `steward/` runs the Automation Steward.

#### `kind: "intake"` / `"analytics"` / `"connections"` (Tier 2 domain)

Per-domain shape varies. Each gets a unified Box at `LEDGERS/BOXES/<name>/` per Phase 3.

#### `kind: "leaf"` — leaf Boxes (Tier 3)

Minimum: `BOX.md` + `box.json`. Optional: everything else. Use when a Box represents one specific entity (one venue, one widget, one scheduled-fire) and doesn't need a steward or local rules.

### 16.5 The Box Bus surface (Phase B declarative, Phase C runtime)

Per `DEC-2026-04-30-005` and `BOX_BUS_LEDGER.md` §6 (post Phase 1.2 update / `ATOM-2026-04-30-0057`):

- **Every mature `box.json` declares `subscribes[]`** (inbound graph edges — what events from upstream Boxes affect me?).
- **Every mature `box.json` declares `emits[]`** (outbound graph edges — what events do I produce?).
- **Both can be empty arrays** (`[]`) during Phase B if the Box doesn't yet participate in routing. They are required FIELDS but may have empty VALUES until Phase 4.1 (`ATOM-2026-04-30-0074`) populates them.
- **Phase C runtime** consumes these declarations directly. Phase B authoring sets up the graph topology so the runtime has nothing to discover at activation.

### 16.6 The Box Graph rendering contract

The Box Graph UI (route `box_graph`, shipped Phase 4.6 + 6.1 partial via Codex 2026-05-01) reads `LEDGERS/BOXES/*/box.json` files plus `Auto/Client Boxes/*/` and `Auto/Staff Boxes/*/` directories and synthesizes a node-edge graph. For the graph to be data-real (not synthesized):

- Every Box must have a `box.json` declaring `kind`, `tier`, `slug`, `name`, `owns`, `source_of_truth` (per `DEC-2026-04-30-006` minimum schema).
- `subscribes[]` and `emits[]` must be populated (Phase 4.1 / `ATOM-2026-04-30-0074`).
- Authority tier registry at `LEDGERS/BOXES/box_bus/registry/authority_tiers.json` must exist (Phase 4.2 / `ATOM-2026-04-30-0075`).

Until those land, the Box Graph UI displays heuristically — node count is real (counts files), but edges are inferred and tier lanes are best-guess.

### 16.7 Authoring a new Box

When authoring a new Box, follow this sequence (per Phase 2.2 scaffold script / `ATOM-2026-04-30-0062` once it ships):

1. Pick the `kind` from §16.4 above.
2. Pick the `tier` (Constitutional / Coordination / Domain / Leaf — see `SOURCE_OF_TRUTH.md` §X authority tiers per Phase 1.4 / `ATOM-2026-04-30-0059`).
3. Author from `LEDGERS/LOCAL_TEMPLATE/BOX_LEDGER_TEMPLATE.md` (post Phase 2.1 update / `ATOM-2026-04-30-0061`).
4. Fill required pieces (§16.1) plus the conditionally-required pieces for the `kind` (§16.2 + §16.4).
5. Declare `subscribes[]` / `emits[]` in `box.json` — even as `[]` during Phase B.
6. Register the Box in `LEDGERS/INDEX.md` if it's a ledger Box.
7. Append `_ledger/activity.jsonl` with `kind: "unified_box_landed"`.

### 16.8 Anti-patterns

- **Skipping `box.json`.** A Box without a manifest is invisible to the runtime and the Box Graph. Always author the manifest.
- **Empty required fields.** `tier` set to `null` or `kind: "unknown"` defeats the schema. Pick a real value or document why this Box is exceptional.
- **Inflating optional pieces.** Don't author `inbox/` `outbox/` `digests/` `skills/` unless the Box actually uses them. Empty optional folders are noise.
- **Relocating canonical ledger files into the Box folder.** Per `DEC-2026-04-29-015`, ledger files stay at top-level `LEDGERS/`. The Box governs by reference.
- **Duplicating local-law in both root `AGENTS.md` and `steward/AGENTS.md`.** Per `DEC-2026-04-30-007`, root governs the Box; steward governs the runnable steward. Don't restate.
- **Authoring a Box with no audit trail surface.** Even if `receipts/` is empty, the directory should exist so the steward has a write target.

### 16.9 Verification checklist

A Box is mature-shape-compliant when:

- [ ] `BOX.md` exists and is non-trivial (≥ 5 sections from §5 template).
- [ ] `box.json` exists and validates against `DEC-2026-04-30-006` minimum schema (9 required fields populated).
- [ ] `receipts/` directory exists.
- [ ] If Box has a steward: `steward/AGENTS.md` + `steward/config.json` + `steward/prompt.md` exist.
- [ ] If Box has local-stricter rules: root-level `AGENTS.md` exists.
- [ ] `subscribes[]` and `emits[]` fields exist in `box.json` (may be empty arrays during Phase B).
- [ ] Box is registered in the relevant index (`LEDGERS/INDEX.md` for ledger Boxes; `Auto/Client Boxes/` is self-discovering).
- [ ] At least one `_ledger/activity.jsonl` line references the Box's authoring/migration.
- [ ] `LEDGERS/scripts/box_graph_validate.sh` (Phase 4.1 / `ATOM-2026-04-30-0074`) returns no errors for this Box once available.

This checklist becomes the **Box-completion Done Gate** in `DEFINITION_OF_DONE.md` §X (Phase 1.3 / `ATOM-2026-04-30-0058`).

---

## 17. Final Operating Rule

> A meaningful directory should not be silent.
>
> If a directory matters, it should say what it is, what it owns, what it trusts, what it forbids, and how to leave it better than you found it.
>
> A Box is a directory with memory. Make the memory legible. Stamp the silence.
>
> **The mature primitive is the fused Box.** Box = Ledger + Rules + Sub-agent + Config + Receipts. Authoring a new Box is authoring a new governed object — not a new folder.

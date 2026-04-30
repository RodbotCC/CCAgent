# Box Bus Ledger

Last updated: 2026-04-29 (initial creation — Phase 10 of ledger system buildout)
Maintainer: Jake / Comeketo Agent project agents
Status: **active (schema-only — runtime deferred)**
Read when: authoring a new ledger, authoring a new Box, sub-agent design, deciding whether something deserves to be a Box, or planning Phase B / Phase C work.
Core rule: **Architecture lives in the file tree before it lives in code.**
Steward agent: not yet authored. Phase B work — when written it lands at `/Subagent Boxes/box_bus_subagent_package/`.

> The bus is not running yet. The architecture is.
>
> A `box.json` schema in a ledger is worth more than a half-built router in code: it tells every future ledger and every future Box exactly what shape they're aiming at. Schema first. Routing second. Interpreters third. Runtime last.

---

## 1. Purpose

This ledger defines the **target architecture** of the project: a **reactive network of Boxes** connected by a **routed Ledger bus**.

It is paired with — and explicitly distinct from — three sibling ledgers:

| Ledger | Owns |
|---|---|
| **Box Ledger** (`BOX_LEDGER.md`) | What a Box *is* — concept, classes, status labels, BOX.md vs DIRECTORY.md, Local Agent Protocol |
| **Box Bus Ledger** (this file) | How Boxes *connect* — manifest schema, ledger envelope, routing tiers, interpreter tiers, cycle policy |
| **Definition of Done Ledger** (`DEFINITION_OF_DONE.md`) | What "done" means for any work — including future Bus work |
| **Decisions Ledger** (`DECISIONS_LEDGER.md`) | The architectural commitments that lock the Bus design (`DEC-2026-04-29-013`) |

**This ledger ships schema, not runtime.** Runtime — router, propagation ledger, interpreters, post-write hooks — is **deferred to Phase C** per `DEC-2026-04-29-013`. Phase A (current) writes the architecture down so every future ledger and every future Box can be authored with the bus in mind.

The result: when Phase C arrives, no migration debt — every ledger entry already has the envelope, every Box already has a manifest.

### Owns

- the `box.json` **manifest schema** (one shape for all box kinds)
- the **ledger envelope schema** (one shape for every entry)
- the **routing tier model** (Global / Domain / Local)
- the **interpreter tier model** (T1 deterministic / T2 small-LLM / T3 full sub-agent)
- the **cycle policy** (hard refusal at the router)
- the **"what is a Box / what is not"** rule (graduates the Box Ledger §2 heuristic into a binding rule)
- **escalation rules** (when Local emits up to Domain or Global)
- **fan-out rules** (when Global routes down to Domain or Local)
- **two worked examples** (one Client Box, one Analytics Snapshot Box) that stress-test the schema
- **deferred-runtime notes** — what each Phase B/C piece will look like when it lands

### Does not own

- per-Box content → the Box itself
- per-ledger content → the ledger itself
- runtime code → deferred to Phase C
- audit findings on bus performance → Open Problems / per-Box ledgers
- sub-agent prompt content → individual sub-agent packages
- the "what's a Box conceptually" definition → Box Ledger
- the Done Gate for completion → Definition of Done

This ledger defines the **wire shape**. Other ledgers define the contents.

---

## 2. The Three Primitives

The architecture rests on three primitives. Phase 0 (this ledger) specifies all three.

### 2.1 Box Manifest (`box.json`)

Every Box has a manifest. **No box exists in this system without one** — this is the gate.

```jsonc
{
  "id":            "<stable id>",                // never changes
  "slug":          "<filesystem slug>",          // e.g., hugo_casillas
  "kind":          "client | staff | orchestrator | inbox-skill | app-ui | automation | ledger | bedrock | analytics-snapshot | page | subagent-package | reference",
  "name":          "<human-readable>",
  "owns":          ["<relative path>", ...],     // files/dirs this Box governs
  "source_of_truth": {
    "primary":     "<which file/path is canonical>",
    "generated":   ["<which paths are views, not state>"]
  },
  "subscribes":    [
    {
      "ledger":         "<ledger name>",                  // e.g., DECISIONS_LEDGER
      "tier":           "global | domain | local",
      "filter":         "<jsonpath/predicate>",           // optional — narrow the firehose
      "interpreter":    "T1 | T2 | T3",                   // default T1
      "write_target":   "<relative path within the box>"  // where the local consequence lands
    }
  ],
  "emits":         [
    {
      "ledger":         "<ledger name>",
      "tier":           "global | domain | local",
      "on_event":       "<box-internal event name>",      // e.g., plan_changed, audit_marker_added
      "envelope_kind":  "<entry kind>",                   // matches §2.2 envelope.kind
      "scope":          "<scope expression>"              // matches §2.2 envelope.scope
    }
  ],
  "agent_config":  {
    "package_path":   "<Subagent Boxes/<name>/ or CCAgentindex/agents/<name>/>",
    "tier_default":   "T1 | T2 | T3",                     // default interpreter tier for this Box
    "guardrails":     ["<rule path>", ...]
  },
  "ledger_local":  "<relative path to the box's append-only memory>",
  "version":       "<schema version>"                     // bump on schema-changing edits
}
```

**Rules for manifests:**

- `id` is stable forever. `slug` may rename. `name` is human-readable and may change.
- `kind` must match one of the values above. New kinds require a Decision.
- `owns` lists every path under the Box's authority. Paths NOT in `owns` are not the Box's truth.
- `subscribes` declares **inbound interest** — what ledger entries route into this Box.
- `emits` declares **outbound publishing** — what events escape this Box and onto the bus.
- `agent_config.tier_default` sets the default interpreter cost for this Box. Most Boxes are T1.

### 2.2 Ledger Envelope

Every ledger entry is wrapped in a uniform envelope. Existing ledgers (Decisions, Communications, Open Problems, etc.) wrap their legacy rows backwards-compatibly — the envelope is metadata around the entry, not a replacement.

```jsonc
{
  "id":           "<entry id, e.g., DEC-2026-04-29-013>",
  "ts":           "<ISO8601>",
  "ledger":       "<ledger name>",                   // e.g., DECISIONS_LEDGER
  "tier":         "global | domain | local",
  "kind":         "<entry kind>",                    // ledger-specific (decision, problem, handoff, etc.)
  "scope":        "<scope expression>",              // see §2.3
  "payload":      { /* the actual entry content */ },
  "routes_hint":  ["<box id>", ...],                 // optional — explicit routing override
  "source_box":   "<box id | null>",                 // who emitted this; null for human-authored
  "envelope_v":   "1"
}
```

**Rules for envelopes:**

- `tier` MUST match the ledger's tier (§3). A `decisions` entry is `global`. A `client_ledger.md` entry is `local`.
- `scope` is the routing key — `*` (everywhere), `client_box:hugo_casillas` (one Box), `domain:analytics` (one domain), `kind:client` (every Box of a kind).
- `routes_hint` is advisory. The router still consults the subscription index, but `routes_hint` lets emitters override default fan-out (e.g., a Decision that explicitly notifies one Box only).
- `source_box` is required when the entry was emitted by automation. Human-authored entries carry `null` and rely on the editor's identity in the activity log.
- `payload` is whatever the ledger's existing schema defines. The envelope does not flatten or reshape it.

### 2.3 Scope Expressions

Scope is a small DSL the router parses. Phase 0 fixes the grammar:

| Pattern | Meaning |
|---|---|
| `*` | Every Box |
| `kind:<kind>` | Every Box of that kind (e.g., `kind:client`) |
| `domain:<domain>` | Every Box in a domain (e.g., `domain:analytics`) |
| `box:<id>` | One specific Box (e.g., `box:hugo_casillas`) |
| `tier:<tier>` | Every Box that subscribes at that tier |
| `not(<expr>)` | Negation |
| `and(<expr>, <expr>)` | Intersection |
| `or(<expr>, <expr>)` | Union |

A subscriber's `filter` field uses the same grammar — the router only delivers entries whose scope intersects the subscriber's filter.

---

## 3. Routing Tiers

Three tiers. Each ledger lives at exactly one tier.

| Tier | Examples | Routing Posture |
|---|---|---|
| **Global** | Global Ledger, Temporal Continuity, North Star, Decisions, Open Problems, Communications, Definition of Done, Source-of-Truth (planned), Box Ledger, Box Bus Ledger | Fans out to every Box whose manifest declares `subscribes: global`. **Default for all client/staff/page boxes.** |
| **Domain** | Page-Asset Sitemap, Connections (planned), Phase (planned), per-domain analytics ledger (planned), inbox-guardrails ledger (planned) | Fans out to Boxes within that domain only. A page domain ledger does not reach Client Boxes. |
| **Local** | per-Box `client_ledger.md`, per-Box `<date>_audit_marker.md`, per-snapshot sweep logs, per-automation run logs | Stays inside the Box. **Emits up only via declared escalation rules** in the Box's `emits[]` array. |

**Trickle-down direction:**

```
GLOBAL  →  DOMAIN  →  LOCAL    (always allowed; default fan-out)
LOCAL   →  DOMAIN  →  GLOBAL   (only via declared escalation in box.json emits[])
```

**No cycles. The router refuses cycles.** See §6.

### Why this tier model

- **Global ledgers carry universal rules.** A Decision should reach every Box that might be affected.
- **Domain ledgers carry system-scoped rules.** The page-asset sitemap doesn't matter to a Client Box.
- **Local ledgers carry per-Box state.** Hugo's audit marker doesn't matter to Brenda & Steve's box unless explicitly escalated (e.g., a recurring problem becomes an Open Problems entry).

---

## 4. Interpreter Tiers

The expensive part of the architecture is **how** ledger entries get translated into per-Box state. Three tiers, declared per-subscription:

| Tier | Cost | Speed | When To Use |
|---|---|---|---|
| **T1 — schema-mapper** | $0 | ~0ms | Deterministic, rule-based. ~80% of routing should be T1. Example: "When Decisions Ledger emits a `do_not_undo_casually` rule with `scope: kind:client`, every Client Box appends one line to its `client_ledger.md` linking the decision." Pure mapping, no model call. |
| **T2 — template-summarizer** | low | ~1s | Small/cheap LLM. For entries that need natural-language framing per Box. Example: "Summarize how this guardrail change affects this Box's plan." ~15% of routing. |
| **T3 — full sub-agent** | high | seconds–minutes | The Phase B/C steward agents. For entries that genuinely require judgment in Box context. Example: "Re-evaluate this Box's seven-day plan against the latest comms after a major source-of-truth change." Reserved for ~5% of traffic. |

**The default is T1.** A subscription that doesn't specify `interpreter` gets T1. Upgrading to T2 or T3 should be deliberate.

**Why this matters:** without tiering, the bus turns into a meter that runs constantly. T1 keeps the running cost near-zero for most fan-out; T3 is reserved for the cases where it earns its keep.

---

## 5. What Is A Box / What Is Not

A directory becomes a Box when **at least one** of the following is true (graduates the Box Ledger §2 heuristic):

- It owns canonical state that survives a restart.
- Other Boxes need to interpret events from it.
- It runs automation on a trigger or schedule.
- It carries source-of-truth claims.
- It has its own approval or guardrail rules.
- It produces snapshots that other parts of the system depend on.

A directory is **not** a Box when:

- It holds only ephemeral UI state, transient caches, or per-request session data.
- It holds only generated output and the generator lives in a Box of its own.
- It holds only third-party dependencies (`node_modules/`, `__pycache__/`, etc.).
- It's a leaf folder whose parent already owns a Box that covers it (`LEDGERS/VISUALS/` is covered by the `LEDGERS/` Box).

> **The binding rule:** if it has memory that future work depends on, it's a Box. Codified here. Cited by `DEC-2026-04-29-013`.

---

## 6. Cycle Policy

**Hard refusal at the router.** A ledger entry cannot route into a Box that emitted (directly or transitively) into the same chain.

Why hard-refusal instead of declared cycles with max-depth:

- Declared cycles produce subtle bugs at scale — every cycle is a chance for amplification or feedback loops.
- The router only needs a DAG. If it sees a back-edge, it logs a `cycle_blocked` event to `_ledger/propagation.jsonl` (Phase C) and drops the route.
- If a real round-trip is needed (e.g., a Box wants to know the consequence of its own emit), it should be expressed as **two separate routes** — emit to a Domain ledger, subscribe to that Domain ledger — not as a self-loop.

The cycle check is part of the router, not the schema. Phase A only writes this rule down. Phase C enforces it.

---

## 7. Worked Example A — Hugo Casillas Client Box

A real Box that exists today: `Auto/Client Boxes/Hugo Casillas/`.

```jsonc
{
  "id":   "client_box:hugo_casillas",
  "slug": "hugo_casillas",
  "kind": "client",
  "name": "Hugo Casillas",
  "owns": [
    "Auto/Client Boxes/Hugo Casillas/00_meta.json",
    "Auto/Client Boxes/Hugo Casillas/01_comms.md",
    "Auto/Client Boxes/Hugo Casillas/01b_comms_verbatim.md",
    "Auto/Client Boxes/Hugo Casillas/comms/",
    "Auto/Client Boxes/Hugo Casillas/04_profile.md",
    "Auto/Client Boxes/Hugo Casillas/05_seven_day_plan.md",
    "Auto/Client Boxes/Hugo Casillas/09_andre_alerts.md",
    "Auto/Client Boxes/Hugo Casillas/15.0*_outcome.md",
    "Auto/Client Boxes/Hugo Casillas/AGENTS.md",
    "Auto/Client Boxes/Hugo Casillas/CLAUDE.md"
  ],
  "source_of_truth": {
    "primary":   "Auto/Client Boxes/Hugo Casillas/01b_comms_verbatim.md",
    "generated": [
      "Auto/Client Boxes/Hugo Casillas/05_seven_day_plan.md",
      "Auto/Client Boxes/Hugo Casillas/09_andre_alerts.md"
    ]
  },
  "subscribes": [
    {
      "ledger":       "DECISIONS_LEDGER",
      "tier":         "global",
      "filter":       "or(scope:*, scope:kind:client, scope:box:hugo_casillas)",
      "interpreter":  "T1",
      "write_target": "client_ledger.md"
    },
    {
      "ledger":       "OPEN_PROBLEMS_LEDGER",
      "tier":         "global",
      "filter":       "or(scope:*, scope:kind:client, scope:box:hugo_casillas)",
      "interpreter":  "T1",
      "write_target": "client_ledger.md"
    },
    {
      "ledger":       "INBOX_GUARDRAILS_LEDGER",
      "tier":         "domain",
      "filter":       "*",
      "interpreter":  "T2",
      "write_target": "client_ledger.md"
    },
    {
      "ledger":       "ANALYTICS_SOURCE_CHANNELS",
      "tier":         "domain",
      "filter":       "scope:box:hugo_casillas",
      "interpreter":  "T1",
      "write_target": "client_ledger.md"
    }
  ],
  "emits": [
    {
      "ledger":        "_ledger/activity.jsonl",
      "tier":          "global",
      "on_event":      "audit_marker_added",
      "envelope_kind": "audit",
      "scope":         "*"
    },
    {
      "ledger":        "OPEN_PROBLEMS_LEDGER",
      "tier":          "global",
      "on_event":      "guardrail_flag_count_exceeded",
      "envelope_kind": "problem",
      "scope":         "kind:client"
    }
  ],
  "agent_config": {
    "package_path":  "Subagent Boxes/client_box_steward_package/",
    "tier_default":  "T1",
    "guardrails":    ["Auto/comeketo-inbox/", "Guardrails.html", "comeketo-guardrails-agent.md"]
  },
  "ledger_local": "Auto/Client Boxes/Hugo Casillas/client_ledger.md",
  "version": "1"
}
```

**What this manifest enables once the bus runs (Phase C):**

- A new Decision with `scope: kind:client` automatically appends a line to Hugo's `client_ledger.md` (T1 mapping, no LLM call).
- A new Inbox Guardrail rule routes through a T2 summarizer that frames it for Hugo's plan specifically.
- An analytics snapshot tagged `scope:box:hugo_casillas` lands in his ledger.
- If Andre flags >N guardrail issues during cleanup, an Open Problems entry emits automatically.

**Today (Phase A):** the manifest doesn't run anything. It's a contract. Authoring it now means when Phase C arrives, Hugo's Box plugs in without rework.

---

## 8. Worked Example B — Analytics Source Channels Snapshot Box

A Box that *doesn't exist yet* — but the analytics script that will produce it does (`Onboard Scripts/analytics_source_channels.py`). This example shows how an analytics snapshot graduates into a first-class Box.

```jsonc
{
  "id":   "analytics_snapshot:source_channels",
  "slug": "source_channels",
  "kind": "analytics-snapshot",
  "name": "Source Channel Intelligence",
  "owns": [
    "CCAgentindex/analytics/source_channel_snapshot.json",
    "Onboard Scripts/analytics_source_channels.py",
    "CCAgentindex/analytics/_runs/source_channels/"
  ],
  "source_of_truth": {
    "primary":   "CCAgentindex/analytics/source_channel_snapshot.json",
    "generated": ["CCAgentindex/analytics/_runs/source_channels/"]
  },
  "subscribes": [
    {
      "ledger":       "DECISIONS_LEDGER",
      "tier":         "global",
      "filter":       "or(scope:*, scope:domain:analytics, scope:box:source_channels)",
      "interpreter":  "T1",
      "write_target": "_runs/source_channels/decisions_inbox.jsonl"
    }
  ],
  "emits": [
    {
      "ledger":        "ANALYTICS_SOURCE_CHANNELS",
      "tier":          "domain",
      "on_event":      "snapshot_refreshed",
      "envelope_kind": "analytics_snapshot",
      "scope":         "domain:analytics"
    },
    {
      "ledger":        "ANALYTICS_SOURCE_CHANNELS",
      "tier":          "domain",
      "on_event":      "per_lead_template_emitted",
      "envelope_kind": "lead_summary",
      "scope":         "kind:client"
    }
  ],
  "agent_config": {
    "package_path":  "Subagent Boxes/analytics_snapshot_steward_package/",
    "tier_default":  "T1",
    "guardrails":    []
  },
  "ledger_local": "CCAgentindex/analytics/_runs/source_channels/run_log.jsonl",
  "version": "1"
}
```

**The pattern this proves:** an analytics script becomes a Box by getting four things:

1. A manifest declaring what it owns and what it produces.
2. Subscriptions for incoming context (e.g., Decisions that affect analytics).
3. Emits for outgoing snapshots — including per-Box fan-out so Client Boxes see their own slice.
4. A local ledger for run history.

The script keeps doing what it does today. The Box wrapping says where the output goes and who hears about it.

**Cross-Box flow this enables (Phase C):**

```
analytics_source_channels.py runs
  → emits 'snapshot_refreshed' event with scope: domain:analytics
  → emits 'per_lead_template_emitted' events with scope: kind:client
     ├→ Hugo Box's subscription with filter 'scope:box:hugo_casillas' matches → T1 mapper writes to Hugo's client_ledger.md
     ├→ Brenda & Steve Box's subscription matches → T1 mapper writes to their client_ledger.md
     └→ ... 28 client boxes, all updated automatically
  → no human intervention; entire fan-out logged in _ledger/propagation.jsonl
```

This is the **trickle-down** Jake described in plain language. The schema is what makes it executable.

---

## 9. The Build Sequence (Schema Now / Runtime Later)

This ledger codifies **Phase 0 only** — the schema. The downstream phases are sketched here so future agents know what's coming.

| Phase | What lands | When |
|---|---|---|
| **Phase 0 — Schema (THIS LEDGER)** | `box.json` schema, ledger envelope schema, tier model, interpreter tier model, cycle policy, "what's a Box" rule, two worked examples | **2026-04-29 (today)** |
| **Phase A continues — Envelope-aware ledgers** | Every new ledger authored from here on out specifies its tier and entry-kind aligned to §2.2 — even though no router consumes them yet | Phase A (current; ~10 ledgers left) |
| **Phase B — Steward agents author manifests** | As each draft sub-agent package at `/Subagent Boxes/` graduates, it authors a `box.json` for its target ledger or system | Phase B |
| **Phase C — Runtime lands** | Router daemon (or post-write hook), propagation ledger (`CCAgentindex/_ledger/propagation.jsonl`), T1 mappers, T2 summarizers, T3 sub-agent dispatch, validation on emit, cycle enforcement | Phase C |
| **Phase C+1 — Backfill** | Author manifests for the existing Boxes that don't have one yet (Client Boxes, Staff Boxes, orchestrator, ledger directory, app-ui root). Ship the analytics-snapshot Box pattern. | Phase C |

**Migration strategy when Phase C arrives:**

- Every existing ledger already declares its tier (per the §2.2 schema). Wrapping legacy entries in the envelope is a one-time pass per ledger.
- Every new Box authored under the Box Ledger between today and Phase C ships with a manifest stub from the start (DoD §5.7 enforces this — see §11 below).
- Existing Boxes (28 client + 10 staff + orchestrator + inbox-skill + ledger) get manifests authored once at Phase C+1. Until then they operate in their current shape.

> **The point of writing this down today:** every ledger and every Box authored between now and Phase C is built with the bus as the target. Zero migration debt at runtime.

---

## 10. Validation Rules (For Phase C, Specified Now)

When the router lands, every emit must pass validation before reaching the bus. Phase 0 specifies what "valid" means:

- **Envelope shape valid** — required fields present, `tier` ∈ {global, domain, local}, `ts` is ISO8601, `id` is unique within `(ledger, day)`.
- **Tier matches ledger** — a `decisions` entry cannot emit at `local` tier.
- **Scope syntactically valid** — parses against the §2.3 grammar.
- **No cycle introduced** — `source_box` is not transitively in the resolved subscriber set.
- **Subscriber filter parses** — when the router builds its subscription index, malformed filters block the Box (loudly, not silently).
- **`routes_hint` (if present) is a subset of resolved subscribers** — a hint cannot route somewhere that has no subscription.

A failed validation is logged to `propagation.jsonl` with `validation_failed` and the entry is dropped. The emitting Box gets a `validation_failure` event back through its own `emits[]` so it can react.

**Phase A note:** validation logic doesn't exist yet. Phase 0 just says what it must check. This protects Phase C against the "malformed entry mis-routes silently" failure mode.

---

## 11. Relationship To Other Ledgers

- **Box Ledger** (`BOX_LEDGER.md`) — owns the **concept**. This ledger owns the **wire shape**. Box Ledger §X (added 2026-04-29) cross-references this ledger for the manifest schema.
- **Definition of Done** (`DEFINITION_OF_DONE.md`) — §5.7 (Box / Directory Work) gates manifest-shape compliance once Phase 0 is locked. A new Box without a manifest is not done.
- **Decisions Ledger** — `DEC-2026-04-29-013` is the architectural commitment. Reverse only via explicit Decisions Ledger pass.
- **Open Problems Ledger** — pre-Phase-C bus design risks land here as `PROB-2026-04-29-XXX` if discovered.
- **Communications Ledger** — handoff notes about envelope conventions or migration gotchas land in `COMM-*` entries.
- **Ledger Update Matrix (DoD §6)** — once Phase C runs, "if this changed → update this" becomes the bus's routing table. The matrix is the human-readable version; subscriptions are the executable version.

---

## 12. North Star Alignment

The Reactive Box Network directly serves:

- **NS-01 Durable Project Memory** — every emit becomes durable, addressable, traceable.
- **NS-02 Legibility** — the schema makes the architecture readable in the file tree, not in chat.
- **NS-04 Safe Automation** — guardrails attach to Boxes, not to routes; subscriptions can't bypass them.
- **NS-09 Agent Handoff Continuity** — a new agent loading a Box reads its manifest first; subscriptions tell it everything the Box hears about.
- **NS-10 Defense As First-Class Build Activity** — propagation ledger is durable defense; every routed entry is auditable.

Indirect support: NS-06 (source-of-truth — manifest declares what's canonical vs generated), NS-07 (cleanup discipline — schema reveals which Boxes exist).

---

## 13. Update Rules

Update this ledger when:

- A new `kind` is added to the manifest schema.
- A new tier is needed (Global / Domain / Local has stayed stable for a long time — adding a tier is a major Decision).
- The cycle policy changes (currently hard-refusal; declared-cycles-with-max-depth would be a new Decision).
- A new interpreter tier is needed (e.g., "T0 — pure replication" if same-shape mirrors emerge).
- The envelope schema gains a required field (bump `envelope_v`).
- A new scope-expression operator is needed.
- Phase B / Phase C runtime work adds binding constraints not foreseen here.

When updating: bump `Last updated`, refresh JSON mirror, add a Communications Ledger entry if migration is required, update DoD §5.7 if the manifest gate changes.

---

## 14. Final Operating Rule

> The bus is not running yet. The architecture is.
>
> Schema before routing. Routing before interpreters. Interpreters before runtime.
>
> Every ledger authored from here on out names its tier. Every Box authored from here on out ships with a manifest stub. When Phase C lands, the system already knows itself.

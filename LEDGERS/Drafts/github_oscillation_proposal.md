# Proposal — Git-Mediated Oscillation Between Web AI, GitHub, and Local

Status: **draft, awaiting Jake's review. No code.**
Author session: 2026-04-30
Scope: design proposal only. Codifies the architecture you described in chat: web AI clients (ChatGPT, Claude.ai, etc.) write through a GitHub MCP server; the local Comeketo Agent reads/writes via the local file tree; both sides synchronize through `git push/pull` against the same GitHub remote. The system "oscillates" — work flows back and forth, both sides converge on truth via the repo.

This proposal does **not** ship code. It locks the rules so the wiring (when it ships) cannot create the failure modes git-mediated sync usually has.

---

## 1. Intent in one paragraph

The repo is the bus. GitHub.com is the rendezvous point. Both sides — the local Comeketo Agent and any web AI client with a GitHub MCP — push their writes to GitHub and pull each other's writes from GitHub. There is no other transport. There is no shared database, no message queue, no webhook fabric. Just `git`, with disciplined commit habits and a declared authority table that makes merge conflicts impossible by construction. The activity ledger becomes the event stream both sides read to know what the other did.

This composes naturally with what's already locked: the **Box + Ledger + Sub-agent triad** (DEC-2026-04-29-001), the **Reactive Box Network** (DEC-2026-04-29-013), and the **GitHub-is-source-of-truth** rule (DEC-2026-04-28-001). The oscillation is the *transport layer* under the box-bus runtime — when the bus eventually fires events between boxes, those events ride on git commits, and the activity ledger is the stream both sides tail.

---

## 2. Cast of actors

| Actor | What it is | How it touches the repo |
|---|---|---|
| **Local agent** | Comeketo Agent server (`server.py`) + claude subprocesses spawned via `/api/delegate` | Direct fs read/write inside `/Users/jakeaaron/Downloads/CC Agent/`, plus `git pull/push` against `origin/main` |
| **Web AI client** | ChatGPT, Claude.ai, or any LLM client with the GitHub MCP server enabled | Reads/writes via GitHub MCP — every mutation lands as a commit on `origin/main` (or a branch + auto-merge) |
| **Human operator** | Jake | Edits files locally in editor, runs `git commit`, occasionally writes via web AI client |
| **GitHub.com** | The repo `RodbotCC/CCAgent` | Single source of truth; both sides sync through it |
| **Pieces** | Local memory backend (`localhost:39300`) | **Out of band.** Not part of the oscillation. Memory/recall only, never the writer of canonical state |

Three actors can write. The remote is one. The discipline below is what keeps the three writers from stepping on each other.

---

## 3. The four failure modes — and the rule that prevents each

Every git-as-bus system that ever broke broke for one of these reasons. Each gets a structural answer, not a "be careful" answer.

### 3.1 Merge conflicts

**Failure:** Two writers edit the same file's same line. Git can't auto-merge. Commit fails. Or worse — auto-merge succeeds wrong.

**Rule:** Every shared writable file is **either append-only or single-writer**. No exceptions.

- **Append-only** files: ledgers (`_ledger/activity.jsonl`, every `LEDGERS/*.md` history section, every `client_ledger.md`, the planned box-bus channels). Two writers appending to different ends produce zero conflicts because git's line-based merge handles non-overlapping additions. Never insert in the middle. Never rewrite a prior line.
- **Single-writer** files: anything that's not append-only must declare exactly one actor that may write it. The authority table in §4 enumerates this for every file class.

**Consequence:** there is no file in the repo that two actors may simultaneously edit non-append. If a current file violates this, the violation gets refactored before this system ships.

### 3.2 Latency

**Failure:** Web agent commits at 10:00:00. Local agent reads the file at 10:00:01 (before pulling) and acts on stale state.

**Rule:** **Pull-before-read for any read whose freshness matters.** Local agent runs `git pull --ff-only` on a tick (default 30s) and additionally before any operation that mutates state based on a read. Web agent always reads through GitHub MCP, which is already remote — its reads are fresh by construction.

Concretely:
- A polling watcher in `server.py` runs `git fetch && git pull --ff-only` every 30 seconds (configurable). Same pattern as the existing Pieces watcher.
- Any `/api/delegate` invocation runs a pull first.
- Any `_ledger_append` operation runs a pull first (so the file we're about to extend is current).
- Read-only UI reads (e.g., loading a Box Report) do *not* pull on every call — too expensive. They tolerate up to 30s of staleness, which is fine for human-paced UI.

### 3.3 Authority ambiguity

**Failure:** Both web and local write to the same file class with no declared rule. State diverges. Nobody knows which version is right.

**Rule:** **The Authority Table in §4 is the law.** Every file class has exactly one declared writer. Other actors may read but never write. This lives in the Source-of-Truth Ledger when that's built; for now, lock it as a Decisions Ledger entry alongside this proposal.

### 3.4 Partial failure

**Failure:** A multi-file operation writes file A, fails to write file B. The repo now has half a change. State machine breaks.

**Rule:** **Atomicity by commit boundary.** Every multi-file logical change goes into a single commit. Either all files land or none do (git's commit is atomic on the local side; push is atomic on the remote side). If the operation must span more than one commit, each commit must independently produce a valid state — no commit may leave the repo in an "in-progress, do not read" state.

Append-only ledgers naturally satisfy this: each line is independently meaningful.

---

## 4. The Authority Table

The single most important artifact in this proposal. Every file class in the repo gets exactly one writer.

| File class | Path glob | Writer | Reader(s) | Notes |
|---|---|---|---|---|
| **Client Box content (canonical)** | `Auto/Client Boxes/<Name>/00_meta.json`, `01_comms.md`, `01b_comms_verbatim.md`, `04_profile.md`, `comms/*.json` | **Orchestrator** (Auto-folder owner — local only) | All | Bot-only territory. Web AI never writes here. Per CLAUDE.md §1 the `Auto/` symlink is read-only for non-orchestrator agents. |
| **Client Box plan** | `Auto/Client Boxes/<Name>/05_seven_day_plan.md` | **Orchestrator** | All | Operator overrides go to the override file, not here. |
| **Operator overrides** | `Auto/Client Boxes/<Name>/10_andre_feedback.md`, `09_andre_alerts.md` | **Human + web AI** (operator surface) | All | Append-only convention. The human and the web AI act as the same actor here — both speak for the operator. |
| **Audit markers** | `Auto/Client Boxes/<Name>/<DATE>_audit_marker.md` | **Either side, file-per-marker** | All | New file each time → no overlap. |
| **Box intake drops** | `Auto/Client Boxes/<Name>/intake_drops/<file>` | **Local** (via `/api/reports/<slug>/ingest`) | All | Already shipped Phase 1. Web AI may *suggest* drops via a markdown reference; the actual write goes through local. |
| **Project ledgers (history sections)** | `LEDGERS/*.md` (all append-only history blocks) | **Either side** | All | Append-only. The §History block grows; nothing earlier is rewritten. |
| **Project ledgers (structured mirrors)** | `LEDGERS/*.json` | **Single-writer-per-commit**: whoever wrote the .md writes the .json in the same commit | All | Mirrors must stay in sync. Co-edited atomically. |
| **Activity ledger** | `CCAgentindex/_ledger/activity.jsonl` | **Either side, append-only** | All | The bus's event log. Both sides tail it. |
| **Box-bus channels** | `CCAgentindex/_ledger/box_bus/<channel>.jsonl` (when DEC-013 ships) | **Channel-declared** | All channel subscribers | Each channel's writer is declared in its manifest. |
| **Bedrock people/venues records** | `CCAgentindex/people/*.json`, `CCAgentindex/venues/*.json` | **Either side, file-per-record** | All | One record per file. Cross-record edits never collide. |
| **`indexes/index.json`** | `CCAgentindex/indexes/index.json` | **Either side, but single-writer-per-commit** | All | Edit pattern: read, modify, write, commit — never two parallel modifications. Pull-before-read applies. |
| **Page asset sitemap** | `page_asset_sitemap.md` | **Either side, append-only history** | All | History block is append-only. Asset Ownership / Change Checklist sections may be edited; pull-before-edit. |
| **App code** | `*.py`, `*.jsx`, `*.js`, `*.html`, `*.css` | **Local + human** (commits via local) | All | Web AI must not push code edits without explicit operator approval. UI/code commits originate locally. |
| **Decisions / Communications ledgers** | `LEDGERS/DECISIONS_LEDGER.{md,json}`, `LEDGERS/COMMUNICATIONS_LEDGER.{md,json}` | **Either side** | All | Append-only entries. New decisions / new comms always extend the file. The `Last updated` line is the single mutable line — pull-before-edit. |
| **CLAUDE.md / AGENT.md** | Project root | **Human only** | All | Operating instructions. AI never edits these. |

**The shape of the rule:** when in doubt, append a new line or a new file. Mutating an existing line is the danger surface. Read the table; if your write isn't covered, ask before writing.

---

## 5. The activity ledger as the event stream

`CCAgentindex/_ledger/activity.jsonl` is the heart of the oscillation.

**Schema:**

```json
{
  "ts": "2026-04-30T15:32:11.482Z",
  "actor": "claude_code | chatgpt_mcp | claude_ai_mcp | human | orchestrator",
  "surface": "local | web | webhook",
  "action": "file_write | file_create | file_delete | commit | push | pull | …",
  "files": ["LEDGERS/DECISIONS_LEDGER.md", "LEDGERS/DECISIONS_LEDGER.json"],
  "commit_sha": "abc1234",
  "branch": "main",
  "kind": "<domain-specific kind, e.g. 'phase1_intake_box_unification'>",
  "notes": "<one sentence>"
}
```

**Why this matters:**

- **Both sides tail it.** Local `server.py` polls the file's tail; web AI re-reads it via GitHub MCP whenever the operator returns. Either side can answer "what did the other side do since I last looked?"
- **It's append-only.** Two simultaneous appends merge cleanly. No coordination needed.
- **It carries the commit sha.** Any reader can `git show <sha>` to see exactly what landed. The ledger is index; git is content.
- **It's the bus's transport.** When the box-bus runtime ships (DEC-013, Phase C), each bus event lands an activity line and a corresponding channel line. The activity ledger is the global event stream; channels are filtered views.

**Rule to lock:** every state-mutating operation, on either side, ends with a single activity line. No state mutation may ship without it. This is enforced at the ledger steward layer (Phase 4 of the build below).

---

## 6. The git commit habit — concrete shape

The system only works if commits actually happen, frequently and tagged. The current working tree is dirty (per Global Ledger §2) — that's the failure mode this system makes intolerable. Here's the discipline:

### 6.1 Commit cadence

- **One logical change = one commit.** Phase 1 of Intake → Box should have been one commit (or three: server, frontend, ledgers). Not zero commits and a dirty tree. The activity ledger names the change; the commit is the change.
- **Commits never sit dirty across a session.** Session end = working tree clean or explicit "I'm leaving X uncommitted because Y" handoff in the Communications Ledger.
- **Pre-push hook (proposed)** on local: refuse to push if the activity ledger does not contain a line whose `commit_sha` matches `HEAD`. This catches "I committed but forgot the ledger."

### 6.2 Commit message convention

```
<kind>: <one-line summary>

<paragraph optional>

Activity-Ledger-Ref: <ts of the line in activity.jsonl>
Box: <box_id if box-scoped>
Decisions-Ref: <DEC-XXX-XXX-XXX if relevant>
Co-Authored-By: <if web AI participated>
```

Machine-readable refs make every commit join-able to the ledger. `git log --grep="Box: hugo_casillas"` becomes a Hugo-history command.

### 6.3 Branch policy

- **Local + web both push to `main`** for everything except code changes.
- **Code changes** (`.py`, `.jsx`, `.js`, `.html`, `.css`) go through a `feat/` branch + PR — even if it's a one-line change. Forces the second-pair-of-eyes loop.
- **No force pushes ever.** Per `Bash` tool's safety rules and DEC-2026-04-28-001.

---

## 7. The web side — GitHub MCP wiring

The web AI client (ChatGPT, Claude.ai, etc.) needs three capabilities through the GitHub MCP:

1. **Read** any file at any sha. Already supported by `mcp__github__get_file_contents`.
2. **Write** an append to any append-only file. Pattern:
   - `get_file_contents` to fetch current text + sha
   - Append the new line locally (in the model's response, not on disk)
   - `create_or_update_file` with the new content + the fetched sha (optimistic concurrency — fails if someone else committed first, in which case retry)
3. **Compose multi-file commits.** Use `push_files` with the list of `{path, content}` pairs in one call. Atomic on the remote.

**Authority enforcement on the web side:** the GitHub MCP doesn't enforce the Authority Table on its own. The enforcement lives in the **system prompt** of the web AI client — the operator (Jake) gives the web AI an instruction that includes a link to the Authority Table and an explicit "you may only write to file classes marked `web AI`." This is a soft rule, not a hard one. Hard enforcement is impossible without a server-side webhook (out of scope for this proposal).

**Mitigation for soft-rule violation:**

- Local agent's pull-on-tick will detect any unauthorized web write and surface it as an Open Problems entry (`PROB-…-unauthorized-web-write`).
- A pre-receive GitHub Action (future) can block pushes that violate the Authority Table for known actor identities. Out of scope for this proposal but listed as Phase 6.

### 7.1 Operator brief for the web AI client

The system prompt the operator gives the web AI must contain (at minimum):

```
You are operating against the Comeketo Agent repo (RodbotCC/CCAgent) via GitHub MCP.

PRIME DIRECTIVE: Read LEDGERS/GLOBAL_LEDGER.md and LEDGERS/Drafts/github_oscillation_proposal.md
before any action.

YOUR AUTHORITY: <subset of the Authority Table covering what this client may write —
typically: append-only ledgers, operator overrides, audit markers, intake-drop suggestions>.

YOU MAY NOT WRITE: <enumerated forbidden classes — code, CLAUDE.md, orchestrator outputs>.

For every state-mutating action: append one line to CCAgentindex/_ledger/activity.jsonl
with actor='claude_ai_mcp' (or 'chatgpt_mcp'). Single commit. Atomic.

Pull-before-write is automatic via MCP — but if you see an optimistic-concurrency
failure, retry against the freshest sha.
```

This is a draft; the real version goes in a sibling proposal once this one is approved.

---

## 8. The local side — server.py changes

When this ships, `server.py` needs four small additions:

### 8.1 Pull watcher (Phase 1 of build)

A background thread that runs `git pull --ff-only` every 30 seconds (configurable via env). Logs to `CCAgentindex/_ledger/git_sync.jsonl`. Pauses if the working tree is dirty (no auto-stash; surfaces the dirty state to the UI).

### 8.2 Pull-before-mutate guard

A decorator on every `_ledger_append`, every `/api/delegate`, every endpoint that writes a canonical file. The guard runs `git fetch + git merge-base` to detect if local is behind; if behind, runs `git pull --ff-only` before proceeding. If a pull cannot fast-forward (i.e., local has uncommitted changes that conflict with remote), the request is refused with a `409 git_drift` and the operator sees a UI banner.

### 8.3 Activity-tail endpoint

`GET /api/activity/tail?since=<ts>` returns activity-ledger lines since the given timestamp. Powers a "what happened on the web side while I was away" panel in the Activity page.

### 8.4 Commit-and-push helper

`POST /api/git/commit` takes `{message, kind, files[], box_id?, decisions_ref?}`, writes a structured commit message per §6.2, runs `git add <files>` + `git commit` + `git push`. The activity ledger gets one line whose `commit_sha` matches the new commit. UI surfaces a "commit & push" button on every state-mutating action.

---

## 9. Loop prevention

A genuine concern with reactive systems on a shared bus. The rule:

**Every actor self-skips its own activity-ledger entries.** When the local agent tails the activity ledger and sees an entry with `actor=claude_code`, it does not re-act on it. When the web agent does the same, it skips `actor=claude_ai_mcp`. This is enforced in the box-bus interpreter (DEC-013 Phase C) — the router reads the entry's `actor` field and refuses to dispatch back to the same actor that wrote it.

For the bare oscillation (pre-bus), there is no automatic re-action — both sides are operator-driven. So loops can't happen until the bus runtime ships, at which point the rule is already in place.

---

## 10. Phased build

Eight steps, each shippable and reversible. Order chosen so each phase produces value on its own and the next phase's risk is bounded.

1. **Phase 0 — Lock the rules.** This proposal moves to the Decisions Ledger as DEC-2026-04-30-XXX with the Authority Table inline. The current dirty working tree gets resolved (commit or stash) to baseline a clean start. No code yet.
2. **Phase 1 — Commit hygiene.** A `pre-commit` hook (or lightweight check in `server.py`) flags the activity-ledger gap. The "you have N uncommitted changes" banner appears in the UI. Operator-driven cleanup; no automation yet.
3. **Phase 2 — Pull watcher.** Background `git pull --ff-only` every 30s. Logs to `git_sync.jsonl`. UI shows last-pull time and any drift.
4. **Phase 3 — Pull-before-mutate guard.** Decorator on the write endpoints. 409s the request if drift can't be auto-resolved.
5. **Phase 4 — Activity-tail endpoint + UI panel.** Operator can see what either side did, with commit links. Powers the "session resume" experience.
6. **Phase 5 — Commit-and-push helper.** Programmatic `/api/git/commit`. Replaces the manual commit ritual for non-code changes.
7. **Phase 6 — Web-AI brief + system prompt.** Author the operator brief (§7.1). Authority Table goes into the brief. Test against one box (Hugo) end-to-end: web AI appends to Hugo's `10_andre_feedback.md`, local pulls, local sees the change, both sides agree on state.
8. **Phase 7 — GitHub Action authority enforcement (optional).** A pre-receive workflow that rejects pushes violating the Authority Table for known actor identities. Hard enforcement layer. Only ship if soft enforcement proves insufficient.

After Phase 7, the box-bus runtime (DEC-013 Phase C) plugs in. By then, every primitive it needs (activity stream, atomic commits, no-conflict file shapes, declared authorities, loop prevention) is already in place.

---

## 11. What this composes with

- **DEC-2026-04-28-001 (GitHub is source of truth):** confirmed and operationalized. This proposal is how that decision actually executes day-to-day.
- **DEC-2026-04-29-001 (Triad spine):** the oscillation is how Boxes' state synchronizes across actors. Ledgers are how the synchronization is logged. Sub-agents are the consumers of the activity stream.
- **DEC-2026-04-29-005 (Box Reports synthesized):** unaffected. Synthesized views still read live; the box's underlying files are now reliably current because of the pull cadence.
- **DEC-2026-04-29-013 (Reactive Box Network):** this proposal is the transport layer the bus runs on top of. Channels are append-only files; events are activity entries; subscribers self-skip via the loop-prevention rule.
- **CLAUDE.md Prime Directive (ledger discipline):** the activity-tail endpoint and commit-and-push helper make the prime directive *easier to follow*, not just easier to enforce.

---

## 12. What this proposal does NOT do

Stay narrow on purpose:

- **No new MCP server.** Web side uses the existing `mcp__github__*` tools.
- **No webhook fabric.** Pull-on-tick is the read mechanism; commit-and-push is the write mechanism. No HTTP-level real-time.
- **No conflict resolver.** Conflicts are prevented by construction (Authority Table + append-only). When a conflict somehow happens anyway, the system 409s and the operator resolves manually.
- **No code-change automation from web side.** Code commits originate locally + go through PR. Web AI may *propose* code via a Communications Ledger entry, never push code directly.
- **No box-bus runtime.** That's DEC-013, Phase C. This proposal builds the substrate; the bus is what runs on top later.
- **No multi-repo support.** Single repo: `RodbotCC/CCAgent`.
- **No Pieces integration changes.** Pieces stays out-of-band.

---

## 13. Open questions for Jake

The proposal has shape but four decisions are yours to make before any of this codes:

1. **Pull cadence default.** I proposed 30s. Could be 10s (more responsive, more API noise) or 2min (gentler, more staleness). Your read on what feels right.
2. **Code-change channel.** I proposed local-only + PR. You could open this up if the web AI gets trustworthy enough on small fixes, but the cost of getting it wrong is higher than for ledger writes. My recommendation is to keep it tight initially.
3. **Operator-override authorship.** I marked `10_andre_feedback.md` as writable by *both* human and web AI as the same logical actor ("operator"). You might prefer them as separate actors so you can tell which channel a feedback line came from. If so, we'd add an `actor` field to feedback entries.
4. **Failure-handling posture.** When pull-before-mutate fails because of drift, do we (a) 409 immediately and ask the operator to resolve, (b) attempt auto-rebase for known-safe file classes (append-only ledgers), or (c) auto-stash and retry? My default recommendation is (a) — explicit operator resolution is safer than clever recovery.

Answer those and the Phase 0 Decisions Ledger entry can lock.

---

## 14. Forward link

When this proposal is approved and Phase 7 ships, the **Reactive Box Network runtime (DEC-013 Phase C)** can plug into it directly. Each bus channel becomes a `_ledger/box_bus/<channel>.jsonl` file. Each subscriber tails the channel via the activity-tail endpoint. Each interpreter is just a sub-agent that runs against the box folder. The box-bus is, at that point, "the activity ledger plus per-channel filtering plus subscriber dispatch" — ~80% of the pieces are this proposal's deliverables.

The two designs are **not redundant**. The oscillation is the *transport*. The bus is the *routing*. They compose; neither replaces the other.

---

## 15. Recommended read order for the reviewer

1. §1 (intent) and §2 (actors) — orientation.
2. §3 (the four failure modes) — the hard part.
3. §4 (Authority Table) — the operative artifact. If anything in the table feels wrong, fix it before §10 ships.
4. §10 (phased build) — what actually gets done and in what order.
5. §13 (open questions) — your four calls to make.

Skip §5–§9 on first read unless you want the implementation specifics.

---

End of proposal.

When you've reacted, the next move is either (a) revise this draft based on your notes, or (b) lock it as a Decisions Ledger entry + start Phase 0. No code until one of those two happens.

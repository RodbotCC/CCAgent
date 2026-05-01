# LEDGERS/PAGES/ — Per-Page Deep Memory

Last updated: 2026-04-29 (Phase 18-20 — high-risk wave complete: `automation` + `delegations` + `settings` page ledgers landed)
Maintainer: Jake / Comeketo Agent project agents
Status: **active (5 of 14 pages authored — high-risk wave complete: `boxes`, `intake`, `automation`, `delegations`, `settings`)**
Read when: opening a Page Ledger, deciding whether a page deserves one, or planning the next per-page record.

> The page-asset sitemap is the **operational** UI Done Gate.
>
> Files in this directory are the **narrative** layer — why each page exists, how it evolved, what shaped its architecture, and what future direction it's pointed at.

---

## What lives here

`LEDGERS/PAGES/<route>.md` — one file per UI route. Each is a per-page deep-memory ledger.

Every per-page record carries:

- **Purpose** — what this page is for, and what operator/agent use case it serves
- **Route + render ownership** — primary component, owner file, sitemap cross-ref
- **Data sources, APIs, side effects** — pointers (not duplicates) into sitemap + Asset/Widget Map
- **Source-of-truth rules** — which trust ordering applies (per `SOURCE_OF_TRUTH.md` §3)
- **Supported states** — rendering modes, empty/error/loading
- **Page-specific guardrails** — what's risky on this page that's not risky on others
- **Page Done Gate** — local-stricter checks beyond DoD §5.3
- **Open problems** — specific to this page
- **Recent changes** — narrative beyond sitemap commit-style entries
- **Architectural rationale** — *why* this page is shaped the way it is

---

## What does NOT live here

- Per-page Asset Ownership / Change Checklist / History / Last Verified → **`page_asset_sitemap.md`** (canonical UI Done Gate, `DEC-2026-04-29-007`)
- Cross-page widget catalog → `LEDGERS/ASSET_WIDGET_MAP.md`
- File-level role descriptions → `LEDGERS/FILE_CONTENTS.md`
- Decisions about UI architecture → `LEDGERS/DECISIONS_LEDGER.md`
- External-service contracts → `LEDGERS/CONNECTIONS.md`

When sitemap and Page Ledger disagree on per-page operational detail, **sitemap wins.**

---

## When to author the next Page Ledger

**Triggers (in priority order):**

1. **High-risk pages first.** Pages that can write to source-of-truth, send to customers, edit credentials, or persist automation state. Per the draft outline first wave: `boxes` (✅ done), `automation`, `delegations`, `settings`, `intake`.
2. **Pages with deep history that doesn't fit in sitemap commit lines.** When the sitemap entry has 5+ history entries and the *why* behind them is in chat or fading from memory.
3. **Pages about to undergo major work.** Author the Page Ledger first so the upcoming work has a memory home.

**Anti-pattern:** authoring all 14 at once. Each Page Ledger is a real piece of writing. Better to land one well-grounded Page Ledger than 14 thin stubs.

---

## Status of Page Ledgers (2026-04-29)

| Route | Sitemap section | Risk | Page Ledger |
|---|---|---|---|
| `grid` | sitemap §grid | medium | planned |
| `automation` | sitemap §automation | high | **active** ([`automation.md`](automation.md)) |
| `activity` | sitemap §activity | medium | planned |
| `settings` | sitemap §settings | high (sensitive) | **active** ([`settings.md`](settings.md)) |
| `leads` | sitemap §leads | medium | planned |
| `clients` | sitemap §clients | medium | planned |
| `coworkers` | sitemap §coworkers | medium | planned |
| `contacts` | sitemap §contacts | medium | planned |
| `venues` | sitemap §venues | medium | planned |
| `briefing` | sitemap §briefing | medium | planned |
| `intake` | sitemap §intake | medium/high | **active** ([`intake.md`](intake.md)) |
| `delegations` | sitemap §delegations | high | **active** ([`delegations.md`](delegations.md)) |
| `boxes` | sitemap §boxes | high | **active** ([`boxes.md`](boxes.md)) |
| `analytics` | sitemap §analytics | medium | planned |

---

## File naming

- `_README.md` — this file (orientation; lives at top of `PAGES/`)
- `<route>.md` — per-page record matching the `app.jsx` route id
- `<route>.json` — optional structured mirror

`<route>` matches the exact id in `app.jsx` `KNOWN_SCREENS`. No spaces, no aliases, no synthetic prefixes (per `DEC-2026-04-29-006`).

---

## Authoring template (short version)

When stamping a new Page Ledger, the minimum viable shape is:

```markdown
# Page Ledger — <route>

Last updated: <date>
Route: `<route>`
Primary component: <Component> (<file>)
Owner file: <file>
Page status: <active | read-only | write-capable | high-risk | ...>
Tier (Box Bus): domain
Sitemap section: page_asset_sitemap.md §<route>

## 1. Purpose
## 2. User / Operator Use Case
## 3. Route + Render Ownership
## 4. Data Sources + APIs
## 5. Writes / Side Effects
## 6. Source-of-Truth Rules
## 7. Widgets On This Page
## 8. Supported States
## 9. Page-Specific Guardrails
## 10. Page Done Gate (local-stricter than DoD §5.3)
## 11. Open Page Problems
## 12. Recent Page Changes (narrative beyond sitemap commit lines)
## 13. Architectural Rationale
## 14. Related Ledgers / Files
## 15. Future Direction
```

The first record (`boxes.md`) sets the tone; copy its structure for subsequent pages.

# {BOX_NAME} — Box Ledger

> A Box is the living memory and configuration layer for a directory. Stamp this template into any new Box and fill in the blanks.
>
> The Global Ledger is the world map. This Box is its neighborhood map.

Last updated: YYYY-MM-DD
Maintainer: {who owns this Box}
Path: `{relative path from project root, e.g. Auto/Client Boxes/Hugo Casillas}`
Box class: `{client | staff | orchestrator | inbox-skill | app-ui | automation | ledger | other}`
Status: `{active | partial | retired}`

---

## 1. Where Am I?

One paragraph: what this directory is, why it exists, and how it relates to the rest of the project.

Example for a Client Box:
> This is the canonical memory and operating substrate for {Client Name}. It holds Close.com comms (curated and verbatim), curated profile, seven-day plan, audit markers, and the running operator log. Customer-facing copy must ground in `01_comms.md` and `01b_comms_verbatim.md`. Strategy in `04_profile.md` and `*_enrichment.md` is internal only.

---

## 2. What This Box Owns

List the responsibilities this Box holds. Be specific.

- {responsibility 1}
- {responsibility 2}
- {responsibility 3}

## 3. What This Box Does Not Own

Equally important. Prevents over-reach.

- {non-responsibility 1}
- {non-responsibility 2}

---

## 4. Source-of-Truth Inside This Box

Order matters. Higher entries win when sources conflict.

1. `{primary source file}`
2. `{secondary source file}`
3. `{tertiary source file}`
4. {operator-approved notes / explicit approvals only}

For Client Boxes the canonical order is:

1. `01b_comms_verbatim.md` and `comms/*.json`
2. `01_comms.md`
3. `00_meta.json`
4. `client_ledger.md`
5. operator-approved notes
6. `04_profile.md` / enrichment files (internal strategy only)

---

## 5. Files That Matter

| File | Purpose | Owner |
|---|---|---|
| `00_meta.json` | structured identity | system |
| `01_comms.md` | curated exec comms summary | operator |
| `01b_comms_verbatim.md` | full Close.com transcript dump | system (Close API pull) |
| `comms/*.json` | raw Close payloads, one per activity | system |
| `04_profile.md` | profile (internal strategy) | operator |
| `05_seven_day_plan.md` | strategy draft | operator |
| `client_ledger.md` | running log | operator |
| `{custom file}` | {what it does} | {who} |

Add or remove rows to fit this Box's actual contents.

---

## 6. Local Operating Rules

What's special here? What rules apply inside this directory that don't apply globally?

- {local rule 1}
- {local rule 2}
- {local rule 3}

For Client Boxes, common local rules:
- The plan is not truth. The box is truth.
- If the client replied, the plan is stale until reviewed.
- Customer-facing copy uses comms-grounded facts only — no enrichment-based personalization without explicit approval.
- Risky moves (fee waivers, discounts, scope promises) require isolated approval cards, not batch approval.

---

## 7. What Should Never Happen Here

The fast-failure list. Make these impossible to miss.

- {forbidden action 1}
- {forbidden action 2}

For Client Boxes:
- Never write enrichment-based claims into customer-facing copy.
- Never override guardrails because the plan says so.
- Never send during a stale-plan window without re-validation.

---

## 8. Ledgers That Apply Locally

Which global ledgers are relevant when working in this Box?

- Global Ledger: `LEDGERS/GLOBAL_LEDGER.md`
- Source-of-Truth Ledger: `LEDGERS/SOURCE_OF_TRUTH.md` (planned)
- Definition of Done Ledger: `LEDGERS/DEFINITION_OF_DONE.md` (planned)
- Open Problems Ledger: `LEDGERS/OPEN_PROBLEMS.md` (planned — log box-specific gaps here)
- Audit Ledger: `LEDGERS/AUDIT.md` (planned — log this Box's audits here)
- {add Box-class-specific ledgers as they're created}

---

## 9. Recent Changes

Append-only. Newest first.

### YYYY-MM-DD

- {change}
- {change}

---

## 10. Open Problems

Found-but-not-fixed in this Box. Mirror the entries in the project-level Open Problems Ledger.

- [ ] {problem}
- [ ] {problem}

---

## 11. Done Gate For This Box

Specific completion checks for changes to this Box.

- [ ] Updated `client_ledger.md` (or equivalent running log)
- [ ] Updated `Recent Changes` (§9) above
- [ ] Appended to `CCAgentindex/_ledger/activity.jsonl` for non-trivial changes
- [ ] If a UI binding changed, updated `page_asset_sitemap.md`
- [ ] If a global rule changed, updated `LEDGERS/GLOBAL_LEDGER.md`

---

## 12. Next Handoff Notes

What does the next agent need to know about this Box right now?

- {note}
- {note}

---

## Update Rules For This Box Ledger

Update this file when:

- new files become canonical inside the Box
- the source-of-truth order changes
- a local rule is added or removed
- a forbidden action is added (lessons learned)
- the Box's class changes
- the Box is retired (mark status retired with date)

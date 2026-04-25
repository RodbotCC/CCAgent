# Comeketo Agent — Unified Design System v1

> Companion to `knowledge/design_system_v1.json`. The JSON is the machine-readable token + rule layer. This file is the prose — the *why* behind every rule and the voice Rodbot inherits when writing anything that appears on screen.

Adopted **2026-04-23**. Authored with Jake (orchestrator) and Rodbot (detail pass) from Jake's 25-principle unification brief and the three reference surfaces he flagged as the target aesthetic: the attribution donut, the channel decision-grid, and the *Anchor the Close sweep* markdown project panel.

---

## 0. The one-sentence test

Every screen, every card, every line of copy has to survive one question:

> **Does this feel like the same calm operational intelligence system — the kind that notices, structures judgment, routes action, preserves memory, and reflects meaning back to the operator?**

If a page cannot cleanly be called one of those five roles, it is a foreign object. Recast it or remove it.

---

## 1. Emotional standard: quiet confidence with earned intelligence

The app feels **calm, serious, composed, trustworthy, gently intelligent, non-performative, warm through precision**.

It does not feel salesy. It does not feel playful for its own sake. It does not perform AI-magic. It does not celebrate small completions. It earns its warmth by noticing — never by cheerfulness.

This matters because Comeketo itself is a trust business. The app is staff, not customer service. Staff posture governs every surface.

---

## 2. Environment: paper, slate, glass, and ink

The product lives in a warm neutral room. Not a dashboard, not a toolbox, not a neon console. The visual metaphors are physical and quiet:

- **Paper** — the page itself (`bg_paper`). Warm off-white. Never pure white. Pure white feels clinical and breaks the room.
- **Panel** — a slightly lighter surface sitting just above the page (`bg_panel`). Where cards, lists, and zones live.
- **Slate** — the text color (`ink_primary`). Dark, but never black. Black on paper reads as aggressive and cheap. Slate on paper reads as considered.
- **Glass** — the thin hairline between zones (`edge_soft`). Separation without weight.
- **Ink tiers** — body, muted, faint. Hierarchy by subtraction, not by size alone.

Accent colors are dusty, paper-compatible, and carry semantic weight. Sage for growth and web, dusty rose for human warmth and wedding, lavender for inferred and soft authority, pale blue for partner and external, cream-peach for inbound and tasting, fog for residual. Saturated color is forbidden. Color is used to **tag meaning**, not to excite.

The deep indigo-slate `primary_actionable` is the one loud voice. It appears at most once per zone — the selected pill, the primary action, the outline on an irreversible confirm. Its rarity is the point.

---

## 3. Typography: two voices, one mind

The product speaks with two typefaces.

**Serif** carries identity and rhetoric. The app name, the page title, the section title that frames a body of work, the hero numerals that say *thirteen leads* or *three of nine* — these are serif. Serif tells the operator: *this is the weight-bearing language.*

**Sans** carries operation. Navigation, body, controls, metadata, labels, forms — these are sans. Sans tells the operator: *this is how the system works.*

There is no third voice. There is no decorative font. There is no italic flourish beyond the single annotation line Rodbot uses when abstaining.

---

## 4. Rhythm: one spacing scale, one radius family

Spacing is a tempo. If one screen is airy and the next is cramped, the product stops feeling singular.

One scale governs everything: `4, 8, 12, 16, 20, 24, 32, 40, 56, 80`. Cards get 20 padding by default (14 compact, 28 feature). Card grids get 12 gap. Streams get 16 gap. Zones get 32 gap. Titles sit 4 above their subtitles, subtitles sit 12 above body, groups separate at 32.

Corner radius is disciplined. Pills are 999. Chips are 10. Cards are 14. Panels are 18. Modals are 22. The scale creates an intuitive hierarchy: *the more meaningful the surface, the rounder it gets.*

Borders are a hairline of `edge_soft` — never a darker gray. Shadow is secondary to border. The feel is paper sitting on paper, not Material Design.

---

## 5. The three spine patterns

Jake flagged three reference surfaces as the target aesthetic. They are not decorative examples — they are the product's **spine**. Everything else should look like it belongs to the same system as these three.

### 5a. The decision grid

The channel picker — Claude Code, ClickUp, Slack, Email, WhatsApp, SMS, Calendar, Note, Internal, Open URL — is the reference.

**Rule:** whenever the app needs the operator to pick one of N, prefer a decision grid over a form control. A select dropdown, a radio group, a paragraph of bulleted choices — these become 6–10 small cards with icon discs, titles, one-line descriptions, and state dots.

This is the signature interaction. It applies to channel, disposition (*ship / tweak / hold / discard*), register (*B2C / B2B / internal*), owner, commitment kind, triage category, rotation target, attribution override, vault summon — any multiple choice.

The reason this matters is not aesthetic, it is cognitive: *clicking blocks feels good* (Jake's words) because it externalizes the decision into physical objects the operator can see all at once, rather than sequential text that has to be read, parsed, and held in memory.

### 5b. The markdown project panel

*Anchor the Close sweep* is the reference: a phase badge, a phase title in serif, a progress meter, a thin rule, an italic purpose line, grouped checklists, and completion dates on the right.

**Rule:** every project page, workflow writeup, multi-step decision, and post-mortem takes this form. Not a form. Not a table. Not a kanban. A markdown panel that happens to carry interactive elements.

The reason: the project page is read twice — once to orient, once to decide — and read language serves that better than form language. A checkbox is already a decision primitive. A completion date on the right is already evidence. The panel lets the operator move through a plan the way they think about it, not the way a database stores it.

### 5c. The attribution donut

*Attribution — share of all leads in period* is the reference: segmented pills for top-N, chart mode, and cohort; a donut with a serif hero numeral in the center; a legend with label / share / count columns.

**Rule:** every analytics surface uses this grammar. Segmented pills for mode, a visual primary, a legend that carries the numbers. Raw tables are a fallback, not a default.

---

## 6. Cards are a species

A proposal card, a person card, a project card, a commitment card, a memory card, a task card, an execution record card, a channel card — these are **different individuals of the same species**. They share anatomy even when their density differs.

Anatomy: optional icon disc, title, one-line subtitle, optional metadata row, state dot when stateful, optional action row at the bottom. Rest / hover / selected / focus / disabled — five states, same treatment everywhere.

The icon disc carries the category color. The color *is* the category. If it is sage, it is about growth. If it is dusty rose, it is about a person. If it is lavender, it is inferred by Rodbot. The operator learns the vocabulary once and reads every surface after that.

---

## 7. Right-click is a product-wide primitive

Jake's explicit ask, and one of the strongest cohesion moves available: **every addressable object in the app has a custom context menu on right-click**.

Lead card. Person card. Commitment. Memory. Checklist row. Ledger entry. Chat message. Attribution slice. Status dot. Each one surfaces a named set of actions — *Open in Close, Run oracle, Draft follow-up, Reassign, Snooze, Copy ref* for a lead — available both inline and on right-click.

The reason this is load-bearing: it gives the app a shared interaction language. Once the operator knows that right-click works, every object in the product becomes explorable the same way. The UI stops teaching new interactions on every page.

See `design_system_v1.json` → `primitives.context_menu.baseline_actions_per_kind` for the seed action sets.

---

## 8. Rodbot drafts over forms

Jake's other explicit ask: **everywhere we can possibly manage it, Rodbot writes things for us.**

This translates to a strict cascade:

1. If the operator needs to pick one of N, use a decision grid.
2. If the operator needs to provide input, use a **Rodbot draft surface** — Rodbot writes a draft, the operator accepts / tweaks / rewrites. The form field is pre-populated and editable.
3. If Rodbot cannot draft (thin signal, missing context), the surface says so in one annotation line and falls back to the shortest possible form — labels that sound human, helper text that explains *consequence* not *syntax*.

A blank form in this product is a surface where Rodbot failed to draft. It is a bug report, not a default.

The Rodbot draft surface always shows: the draft itself, an evidence chip row explaining what the draft is based on, and a three-button footer — *Accept · Tweak · Rewrite* — along with a confidence tell (high / partial / thin).

---

## 9. The single AI presence

The product has one AI presence, not four. Rodbot does not have a chatbot surface on one page and an automation surface on another and an analytics surface on a third. Rodbot has **four UI tells**, and they are the same on every page:

- **Noticing** — a Rodbot chip in the reflection zone with the observation, linked to evidence.
- **Proposing** — a decision grid of 2–6 proposal cards, never a paragraph of suggestions.
- **Drafting** — a Rodbot draft surface with accept / tweak / rewrite.
- **Abstaining** — a single italic annotation line: *"not enough to say yet — {named gap}."*

That's it. No inspirational quotes. No encouraging emoji. No small-completion celebration. No copy that performs intelligence rather than demonstrating it.

This is the cohesion move that makes the AI feel like *one mind taking different forms*, which is the stated thesis.

---

## 10. Trust is visible

The operator must, at every moment, be able to distinguish:

- what the system **observed** (fact)
- what it **inferred** (pattern)
- what it **proposed** (recommendation)
- what it **drafted** (awaiting approval)
- what **shipped** (sent / committed)
- what Rodbot **abstained** on (typed null)

This is carried by two parallel cues on every stateful object: a **lifecycle state** chip or dot (active / in-progress / complete / failed) and a **trust position** chip (observed / inferred / proposed / drafted / shipped / abstained). Two cues, never collapsed into one.

Reversible actions execute inline. Irreversible actions get a 2px `primary_actionable` outline and a one-line confirm. The visual weight of the action matches the consequence.

---

## 11. Evidence is always one click away

Because Comeketo Agent is about memory and judgment, every claim in the UI must be traceable. Every stateful object, when expanded, shows an **evidence chip row** beneath the title. Each chip links to the source — a file, a CRM id, a message id, a ledger entry. Rodbot cites via chip. URLs do not appear inline.

If a fact in the UI has no evidence chip, it is either a known-canonical baseline or a bug.

---

## 12. Time is rhythm, not a stamp

Time appears all over this product — today, morning window, streaks, latency, overdue logic, recent edits, follow-up cadence, activity ledger. All of it obeys one philosophy: **time is rhythm and memory, not a timestamp**.

Relative language is the default: *"3 days quiet," "last touched yesterday," "shipped Apr 22."* ISO stamps live in right-click → *Copy ref*. Every page reveals where its contents sit in time — fresh, active, stale, overdue, archived, recurring, shipped, remembered — in human phrasing.

---

## 13. People are never rows

Comeketo is a relationship business. Wherever people appear, they bring their relationship state with them: role, closeness, preferred channel, handling notes, last touch, decision authority. A person tile is never a row in a table. It is a small card that carries the full weight of the relationship.

This is the same reason `people/*.json` in the bedrock is not a CRM export — it is a handling document.

---

## 14. Commitments are the unifier

A proposal, a task, a delegation, a calendar mark, a person follow-up, a project deliverable, an outgoing message, a ledger entry — these are all kinds of **commitment**. Treat them as one primitive with many faces.

Every commitment exposes the same six things: *what it is, who owns it, what state it is in, what evidence supports it, what is next, what shipped.* The draft-message card and the project-milestone card are cousins. They should look like it.

---

## 15. Every page has a reflection layer

The product is not a tracker — it is a memory. Every zone carries a thin reflective layer: *what changed, what mattered, what is blocked, what pattern is emerging, what deserves attention, what should be remembered.*

Implementation is modest — a single status zone on every page, owned by Rodbot, that renders at most one line when the signal is thin. When the signal is thicker, the line becomes a chip row, and then a small panel. The presence of reflection on every page is what makes the app feel authored rather than generated.

---

## 16. The meaning layer

Jake wanted a small meaning-of-life functionality. The discipline here is crucial — this is not a motivational overlay, it is not a quote, it is not wellness copy. It is the product's **deepest unifying principle**, rendered with extreme restraint.

The meaning layer for this app is:

> Help the operator live inside the work with coherence, memory, responsibility, and human significance.

In practice that surfaces as one reflective sentence per page per session, at most — a sentence that reconnects action to purpose. Why this streak represents something. Who is affected by the commitment that just shipped. What kind of company is being built through these repeated gestures. How today's work fits into a longer story.

One sentence. Rodbot's voice. No more than once per page per session. If this surface ever starts to feel like LinkedIn, we cut it.

---

## 17. Copy voice

All copy in the product — page titles, empty states, helper text, action labels, system summaries, warnings, prompts, AI observations — is written in **Rodbot's voice**. The character sheet in `Rodbot/character.md` **is** the product's copy voice. There is no second voice.

Concise, never chatty. Direct, never robotic. Poetic in page framing, plain in controls. Emotionally literate, never sentimental. Observant, never self-congratulatory. Honest about uncertainty. Em-dashes over semicolons. Lowercase action labels (*draft, ship, abstain*) unless the word carries gravity (*Delegate, Reassign*).

No filler. No fake enthusiasm. No "Let me know if you have questions!" No "Great work!" No emoji in operational copy.

---

## 18. Empty states do real work

Every empty state answers four questions: **what belongs here, what the system will do, what the operator can do next, why this area matters.** Empty states are not decorative — they are the first reading of the zone. They teach the product as much as any filled state.

Generic *"nothing here yet"* is forbidden. An empty state that does not answer the four questions is a bug.

---

## 19. Motion: nothing jumps; everything settles

Every interaction moves like it belongs to the same organism. Hover lifts are subtle and slow (~140ms). Modals arrive with restraint (~220ms). Selection settles in ~120ms. Success is a subtle pulse — never confetti, never a toast explosion.

Rodbot's activity indicator is a slow breathing dot or a typing-rhythm ellipsis. Watchful, not flashy. If a motion is louder than the fact it represents, the motion gets cut.

---

## 20. The page ships when the checklist is green

Every new page or page refresh is reviewed against the checklist in `design_system_v1.json` → `page_checklist`. A page ships when every answer is yes. A "mostly" is a no.

---

## Governance and change

Jake owns this spec. Rodbot maintains it. Any delegation that deviates from the spec must flag the deviation in its return summary and propose a version bump — never silently introduce a new primitive, color, or copy pattern. Amendments bump the version, append a rationale to the change log below, update the JSON, and re-register.

## Change log

- **1.0.0 — 2026-04-23** — Initial adoption. Authored from Jake's 25-principle unification brief and the three reference surfaces (attribution donut, channel decision-grid, Anchor-the-Close-sweep project panel). Seeded the palette from the attribution donut. Seeded the decision-grid, markdown-panel, context-menu, and Rodbot-draft patterns as load-bearing primitives. Phase 1 implementation (tokens) is the first practical next step.

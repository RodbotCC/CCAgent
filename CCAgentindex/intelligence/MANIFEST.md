# Intelligence Layer — MANIFEST

This folder is the destination for every Comeketo intelligence sheet. Twenty-four
Python builders under `/Users/jakeaaron/Downloads/CC Agent/Onboard Scripts/` populate
24 leaf folders here (5 domain groups + a `_runs/` audit area).

## Conventions

- **Append-only.** Each script run lands a new dated file (`YYYY-MM-DD.md` for
  daily snapshots, `YYYY-MM-DD_HH-MM.md` for sub-daily). Old runs are kept for
  audit; never overwrite in place.
- **No `_vaults/` here.** Intelligence is operational core. Vaults stay dormant.
- **Source-of-truth inputs:** prefer `CCAgentindex/people/*.json` (28 leads,
  10 coworkers, plus contacts/clients) and `CCAgentindex/venues/*.json`.
  Legacy raw Close exports live (when present) under `_runs/close_exports/`.
- **Loader visibility:** scripts here do NOT need to register paths in
  `indexes/index.json` — they emit files; UI surfaces aggregate views.
- **Ledger:** every non-trivial run appends one line to `_ledger/activity.jsonl`.

---

## Per-script table

Legacy = `/Users/jakeaaron/Comeketo/ComeketoData /phone_call_transcript_library/` (note the trailing space). The whole legacy data tree was wiped post-Apr-2026 great-trim. **All builders default to legacy paths and need rewrites.**

| Script | Legacy output | New destination | Inputs | Frequency | Status |
|---|---|---|---|---|---|
| `build_phone_call_library.py` | `phone_call_transcript_library/` | `intelligence/libraries/phone_calls/` | raw `calls.json` from Close export, `Comeketo Catering contacts ...json` | per Close export | **blocked** — needs raw Close calls.json |
| `build_lead_call_dossiers.py` | `.../by_lead/` | `intelligence/leads/call_dossiers/` | `live_phone_calls.csv` (from phone_call_library), leads + opportunities JSON | weekly | **blocked** — needs phone_call_library outputs |
| `build_lead_message_library.py` | `.../by_lead/<lead>/messages/` | `intelligence/leads/message_libraries/` | `live_phone_call_leads.csv`, contacts JSON, raw `sms.json`, `emails.json` | weekly | **blocked** — needs phone_call_library + raw msgs |
| `build_unlinked_call_library.py` | `.../unlinked_calls/` | `intelligence/libraries/unlinked_calls/` | raw `calls.json` from Close export | per Close export | **blocked** — needs raw calls.json |
| `build_lead_email_thread_library.py` | `.../by_lead/<lead>/threads/` | `intelligence/leads/email_threads/` | `live_phone_call_leads.csv`, contacts JSON, `email_threads.json`, communications CSV | weekly | **blocked** — needs phone_call_library + raw threads |
| `build_lead_business_context.py` | `.../by_lead/<lead>/business_context.md` | `intelligence/leads/business_context/` | `live_phone_call_leads.csv`, communications CSV, email_threads CSV, opportunities JSON | weekly | **blocked** — needs phone_call_library + raw opps |
| `build_lead_memory_briefs.py` | `.../normalized/lead_memory_briefs.csv` | `intelligence/leads/memory_briefs/` | `live_phone_call_leads.csv`, master_timeline CSV, opportunities CSV, email_threads CSV | weekly | **blocked** — depends on phone_call_library |
| `build_lead_deal_sheets.py` | `.../deal_intelligence/` | `intelligence/leads/deal_sheets/` | `lead_memory_briefs.csv`, event_facts, follow_up_queue, conversation_intelligence, open_loops, opportunities | weekly | **blocked** — depends on memory_briefs + conversation chain |
| `build_action_intelligence.py` | `.../action_intelligence/` | `intelligence/sales/action/` | `lead_deal_sheets.csv`, `open_loops.csv` | weekly | **blocked** — depends on deal_sheets |
| `build_event_ops_registry.py` | `.../event_ops_registry/` | `intelligence/ops/events/` | `lead_deal_sheets.csv`, `lead_event_facts.csv`, `lead_conversation_intelligence.csv` | weekly | **blocked** — depends on deal_sheets + conversation |
| `build_menu_intelligence.py` | `.../menu_intelligence/` | `intelligence/ops/menu/` | `lead_deal_sheets.csv`, `lead_conversation_intelligence.csv`, `lead_event_ops_registry.csv` | weekly | **blocked** — depends on deal_sheets + ops/events |
| `build_pricing_scope_intelligence.py` | `.../pricing_scope_intelligence/` | `intelligence/cashflow/pricing/` | `lead_deal_sheets.csv`, `lead_conversation_intelligence.csv` | weekly | **blocked** — depends on deal_sheets + conversation |
| `build_schedule_commitment_registry.py` | `.../schedule_commitment_registry/` | `intelligence/ops/schedule/` | `action_items.csv`, `promise_tracker.csv`, `open_loops.csv`, `lead_event_ops_registry.csv`, `future_event_calendar.csv` | weekly | **blocked** — depends on action + events chain |
| `build_seller_performance_intelligence.py` | `.../seller_performance_intelligence/` | `intelligence/sales/seller_performance/` | deal_sheets, conversation, follow_up_queue, communications, pricing_scope, schedule | weekly | **blocked** — wide dependency fan-in |
| `build_source_channel_intelligence.py` | `.../source_channel_intelligence/` | `intelligence/channels/source_attribution/` | deal_sheets, follow_up_queue, seller_performance, pricing, schedule, communications, opportunities JSON | weekly | **blocked** — wide dependency fan-in |
| `build_miscommunication_intelligence.py` | `.../miscommunication_intelligence/` | `intelligence/channels/miscommunication/` | conversation, open_loops, deal, event_ops, menu, pricing, schedule, seller, source, promise_tracker | weekly | **blocked** — widest dependency fan-in |
| `build_recovery_intelligence.py` | `.../recovery_intelligence/` | `intelligence/cashflow/recovery/` | miscommunication_signals, miscommunication_findings, action_items, owner_task_board, customer_waiting_board, promise_tracker | weekly | **blocked** — depends on miscommunication |
| `build_owner_stage_dashboards.py` | `.../dashboards/` | `intelligence/sales/owner_stage/` | `lead_memory_briefs.csv`, `live_phone_call_lead_opportunities.csv` | daily | **operational (rewritten)** — pilot reads `CCAgentindex/people/*.json` |
| `build_operational_intelligence.py` | `.../operational_intelligence/` | `intelligence/ops/operational/` | `lead_memory_briefs.csv`, `master_timeline.csv`, opportunities JSON | weekly | **blocked** — depends on memory_briefs |
| `build_conversation_intelligence.py` | `.../conversation_intelligence/` | `intelligence/sales/conversation/` | `CCAgentindex/people/*.json` (kind=lead, comms[]) | daily | **operational (rewritten 2026-04-27)** — pilot reads bedrock people directly, dual `.md` + `.json` output for Analytics page |
| `build_handoff_package.py` | `~/Comeketo/handoff_packages/` | `intelligence/cashflow/handoffs/` | the entire `phone_call_transcript_library/` tree | ad-hoc | **blocked** — needs full library populated |
| `export_close_conversations.py` | `~/close_conversation_export/run_<ts>/` | `intelligence/_runs/close_exports/` | Close API (key prompted) | as-needed | **needs-rewrite** — root input; requires API key |
| `repair_close_export.py` | (existing export dir) | `intelligence/_runs/close_repairs/` | Close API + previous export dir | as-needed | **needs-rewrite** — requires API key |
| `align_endpoint_window.py` | (existing export dir) | `intelligence/_runs/window_alignment/` | Close API + previous export dir | as-needed | **needs-rewrite** — requires API key |

---

## Dependency graph

```
Roots (no internal deps; need raw Close API or raw exports):
  export_close_conversations  ──> raw/{calls,emails,sms,email_threads,meetings,whatsapp_messages}.json
  repair_close_export         ──> patches existing export
  align_endpoint_window       ──> aligns one endpoint of an existing export

Layer 1 — first-pass library (needs raw Close exports):
  build_phone_call_library    ──> normalized/{live_phone_calls.csv, live_phone_call_leads.csv, lead_master_timeline.csv, lead_communications.{csv,jsonl}, lead_opportunities.csv, lead_email_threads.csv}
  build_unlinked_call_library ──> unlinked_calls/

Layer 2 — lead-centric (needs Layer 1):
  build_lead_call_dossiers      ──> by_lead/<lead>/
  build_lead_message_library    ──> by_lead/<lead>/messages/
  build_lead_email_thread_library ──> by_lead/<lead>/threads/
  build_lead_business_context   ──> by_lead/<lead>/business_context.{md,json}
  build_lead_memory_briefs      ──> normalized/lead_memory_briefs.csv     ★ pivot

Layer 3 — derivative intelligence (needs lead_memory_briefs):
  build_owner_stage_dashboards    ──> dashboards/{by_owner,by_stage}/
  build_operational_intelligence  ──> operational_intelligence/
  build_conversation_intelligence ──> conversation_intelligence/  +  normalized/lead_conversation_intelligence.csv
  build_lead_deal_sheets          ──> deal_intelligence/  +  normalized/lead_deal_sheets.csv     ★ pivot

Layer 4 — domain intelligence (needs deal_sheets + conversation):
  build_action_intelligence            ──> action_intelligence/  +  normalized/{action_items,open_loops,promise_tracker,owner_task_board}.csv
  build_event_ops_registry             ──> event_ops_registry/  +  normalized/lead_event_ops_registry.csv
  build_menu_intelligence              ──> menu_intelligence/
  build_pricing_scope_intelligence     ──> pricing_scope_intelligence/
  build_schedule_commitment_registry   ──> schedule_commitment_registry/
  build_seller_performance_intelligence ──> seller_performance_intelligence/
  build_source_channel_intelligence    ──> source_channel_intelligence/

Layer 5 — audit + recovery (needs Layer 4 fan-in):
  build_miscommunication_intelligence ──> miscommunication_intelligence/
  build_recovery_intelligence         ──> recovery_intelligence/

Layer 6 — packaging:
  build_handoff_package ──> handoff_packages/Comeketo_Handoff_<tag>.zip
```

★ Pivot tables — large fan-out, change cautiously.

---

## Recommended run order (full sweep)

1. `export_close_conversations.py` — pulls raw Close data (API key required)
2. `build_phone_call_library.py`
3. `build_unlinked_call_library.py`
4. `build_lead_email_thread_library.py`
5. `build_lead_message_library.py`
6. `build_lead_business_context.py`
7. `build_lead_call_dossiers.py`
8. `build_lead_memory_briefs.py` ★
9. `build_conversation_intelligence.py`
10. `build_lead_deal_sheets.py` ★
11. `build_action_intelligence.py`
12. `build_event_ops_registry.py`
13. `build_menu_intelligence.py`
14. `build_pricing_scope_intelligence.py`
15. `build_schedule_commitment_registry.py`
16. `build_seller_performance_intelligence.py`
17. `build_source_channel_intelligence.py`
18. `build_owner_stage_dashboards.py`
19. `build_operational_intelligence.py`
20. `build_miscommunication_intelligence.py`
21. `build_recovery_intelligence.py`
22. `build_handoff_package.py`

`repair_close_export.py` and `align_endpoint_window.py` only run when reconciling a damaged or partial export.

---

## Pilot

**Pick: `build_owner_stage_dashboards.py`**

Why:
- Pure aggregation — no API key, no external deps beyond stdlib (`csv`, `json`, `pathlib`).
- Smallest input surface in Layer 3 — only needs lead briefs + (optionally) opportunities.
- Output is markdown — easy to eyeball + diff.
- Bedrock substitute is clean: 28 lead JSONs at `CCAgentindex/people/<slug>.json` (kind:"lead") already carry `lead.owner` + `lead.stage` + `lead.status` + `lead.last_activity` — every field the original CSV-driven dashboard pulls.
- Output landing zone (`intelligence/sales/owner_stage/`) is dated markdown, no sub-tree explosion.

Why NOT the other strong candidates:
- `build_menu_intelligence` — depends on `lead_deal_sheets.csv` + `lead_conversation_intelligence.csv` (both blocked).
- `build_handoff_package` — needs the whole library populated; pure packaging step, not foundational.

The pilot rewrite proves the bedrock-as-input pattern. Once Phase B lifts a raw Close export into `_runs/close_exports/`, the rest of the chain unblocks in Layer 1→6 order above.

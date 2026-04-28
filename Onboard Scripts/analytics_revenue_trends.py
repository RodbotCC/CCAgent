#!/usr/bin/env python3
"""
analytics_revenue_trends.py
────────────────────────────
Comeketo Agent — Revenue & Growth Intelligence
Fetches Close CRM opportunity history (up to 24 months) and computes:

  • Monthly won revenue trend        — 24-month rolling, MoM + YoY delta
  • Monthly lead volume trend        — acquisition trajectory (all opps created)
  • Monthly win rate trend           — are close rates improving?
  • Monthly average deal size trend  — is deal quality rising?
  • Deal size distribution           — histogram + percentile breakdown (P25/P50/P75/P90)
  • Revenue concentration            — Pareto: top X% of deals → Y% of revenue
  • Source revenue share             — which channels drive the most won $?
  • Event type revenue share         — which event types drive the most won $?
  • Peak booking windows             — which months see the most wins (closed month)
  • YoY summary                      — last 12mo vs prior 12mo for key metrics

Output: CCAgentindex/analytics/revenue_trends_snapshot.json

Usage:
    python3 "analytics_revenue_trends.py"          # 24-month window (default)
    python3 "analytics_revenue_trends.py" --days 365

Requires:
    CLOSE_API_KEY in .env at repo root  OR  as a shell env var.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from statistics import median, mean, stdev
from typing import Any, Dict, List, Optional

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not installed. Run: pip install requests --break-system-packages")
    sys.exit(1)

# ─── paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).resolve().parent
REPO_ROOT   = SCRIPT_DIR.parent
ENV_FILE    = REPO_ROOT / ".env"
OUTPUT_PATH = REPO_ROOT / "CCAgentindex" / "analytics" / "revenue_trends_snapshot.json"

CLOSE_API_BASE = "https://api.close.com/api/v1"

# ─── Close custom field IDs ───────────────────────────────────────────────────
SOURCE_F   = "custom.cf_ge7qOebiWpyPvuv7xkzNaYpM8PsmOeNvXasXFOtPXRt"
CTYPE_F    = "custom.cf_fs7mrfN5x0M20CyoltczyVg8t0Xul5GFvkC4FNUKvY6"
ETYPE_F    = "custom.cf_goMfyKkS7pFUhmo0xvrl1JvQv1KLaQkfoVo0j93dvhe"
GUEST_F    = "custom.cf_nQLULOLLmtUAh9OwcpJibPc5pQKIqpFOjdGSTwC9ePO"
EVENT_DT_F = "custom.cf_0kLclhHeHu5PjrtnYRoNMqGT0AX1EMiXO7kBgHiLOAN"


# ─── helpers ──────────────────────────────────────────────────────────────────
def load_api_key() -> str:
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            line = line.strip()
            if line.startswith("CLOSE_API_KEY"):
                key = line.split("=", 1)[-1].strip().strip('"').strip("'")
                if key:
                    return key
    key = os.environ.get("CLOSE_API_KEY", "")
    if not key:
        print("ERROR: CLOSE_API_KEY not found in .env or environment.")
        sys.exit(1)
    return key


def fetch_opportunities(api_key: str, since_iso: str) -> List[Dict]:
    """Paginate through all opportunities updated since `since_iso`."""
    session = requests.Session()
    session.auth = (api_key, "")
    opps: List[Dict] = []
    params = {
        "date_updated__gte": since_iso,
        "_limit": 100,
        "_skip": 0,
        "_fields": (
            "id,lead_id,lead_name,status_type,status_label,value,"
            "date_won,date_created,date_updated,pipeline_name,"
            f"{SOURCE_F},{CTYPE_F},{ETYPE_F},{GUEST_F},{EVENT_DT_F}"
        ),
    }
    while True:
        resp = session.get(f"{CLOSE_API_BASE}/opportunity/", params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        batch = data.get("data", [])
        opps.extend(batch)
        count = len(opps)
        if count % 500 == 0 or not data.get("has_more"):
            print(f"    {count} fetched…")
        if not data.get("has_more"):
            break
        params["_skip"] += 100
        time.sleep(0.05)
    return opps


def fmt(cents: int) -> str:
    """cents → $1.2k / $34.5k / $1.2M  (100 cents = $1)"""
    if cents is None or cents == 0:
        return "$0"
    v = abs(cents)
    sign = "-" if cents < 0 else ""
    dollars = v / 100
    if dollars >= 1_000_000:
        return f"{sign}${dollars / 1_000_000:.1f}M"
    if dollars >= 1_000:
        return f"{sign}${dollars / 1_000:.1f}k"
    if dollars >= 1:
        return f"{sign}${dollars:,.0f}"
    return f"{sign}${dollars:.2f}"


def to_month_key(dt_str: str) -> Optional[str]:
    """Parse a date/datetime string → 'YYYY-MM'."""
    if not dt_str:
        return None
    s = str(dt_str).strip()
    try:
        if len(s) >= 10:
            return s[:7]  # 'YYYY-MM'
    except Exception:
        pass
    return None


def source_family(raw: str) -> str:
    v = str(raw or "").lower()
    if any(x in v for x in ["facebook", "instagram", "social", "tiktok", "ig "]):
        return "social_media"
    if any(x in v for x in ["google", "seo", "organic", "search"]):
        return "search"
    if any(x in v for x in ["referral", "word of mouth", "wom", "friend", "family", "recommend"]):
        return "referral"
    if any(x in v for x in ["phone", "call in", "walk in", "walk-in", "direct"]):
        return "phone_inbound"
    if any(x in v for x in ["expo", "bridal", "wedding show", "fair", "event"]):
        return "expo_event"
    if any(x in v for x in ["the knot", "wedding wire", "zola", "thumbtack", "bark", "yelp", "marketplace"]):
        return "marketplace"
    if any(x in v for x in ["website", "comeketocatering", "comeketo.com", "web form", "contact form"]):
        return "website_direct"
    if any(x in v for x in ["email", "newsletter", "campaign"]):
        return "email_campaign"
    if v in ("", "unknown", "none", "n/a", "null"):
        return "unknown"
    return "other"


def normalize_event_type(raw: str) -> str:
    v = str(raw or "").lower().strip()
    if any(x in v for x in ["wedding", "matrimon", "reception"]):
        return "wedding"
    if any(x in v for x in ["grad", "graduation"]):
        return "graduation"
    if any(x in v for x in ["birthday", "bday", "quince", "quinceañera", "quinceaner"]):
        return "birthday" if "quince" not in v else "quinceañera"
    if any(x in v for x in ["baby shower", "baby", "shower"]):
        return "baby_shower"
    if any(x in v for x in ["corporate", "company", "business", "office", "conference", "meeting"]):
        return "corporate"
    if any(x in v for x in ["holiday", "christmas", "thanksgiving", "new year"]):
        return "holiday"
    if any(x in v for x in ["memorial", "funeral", "repast", "celebration of life"]):
        return "memorial"
    if any(x in v for x in ["anniversary", "reunion"]):
        return "anniversary"
    if v in ("", "unknown", "none", "n/a", "null"):
        return "unknown"
    return "other"


def percentile(sorted_vals: List[float], p: float) -> float:
    if not sorted_vals:
        return 0.0
    idx = (len(sorted_vals) - 1) * p / 100
    lo, hi = int(idx), min(int(idx) + 1, len(sorted_vals) - 1)
    return sorted_vals[lo] + (sorted_vals[hi] - sorted_vals[lo]) * (idx - lo)


def delta_pct(new: float, old: float) -> Optional[float]:
    if old == 0:
        return None
    return round((new - old) / old * 100, 1)


# ─── main ─────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=730, help="Look-back window in days (default: 730 = 24 months)")
    args = parser.parse_args()

    print("╔══════════════════════════════════════════════════════════════╗")
    print("║  Comeketo Revenue & Growth Intelligence  ·  24-month sweep  ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()

    api_key = load_api_key()
    print("  API key loaded ✓")

    since = datetime.now(timezone.utc) - timedelta(days=args.days)
    since_iso = since.strftime("%Y-%m-%dT%H:%M:%S+00:00")
    print(f"  Fetching opportunities updated since {since.strftime('%Y-%m-%d')}…")

    opps = fetch_opportunities(api_key, since_iso)
    print(f"\n  → {len(opps)} total opportunities")

    now_utc = datetime.now(timezone.utc)
    now_month = now_utc.strftime("%Y-%m")

    # Split by outcome
    won_opps   = [o for o in opps if o.get("status_type") == "won"]
    lost_opps  = [o for o in opps if o.get("status_type") == "lost"]
    active_opps = [o for o in opps if o.get("status_type") == "active"]

    print(f"  Won: {len(won_opps)}  Lost: {len(lost_opps)}  Active: {len(active_opps)}")

    # ── Build month list (last 24 months, oldest first) ──────────────────────
    months = []
    for i in range(args.days // 30, -1, -1):
        dt = now_utc - timedelta(days=i * 30)
        mk = dt.strftime("%Y-%m")
        if mk not in months:
            months.append(mk)
    # Keep only actual months that make sense (24 unique)
    all_months = sorted(set(months))[-25:]  # up to 25 to ensure 24 complete

    # ── Monthly won revenue ──────────────────────────────────────────────────
    print("  Computing monthly revenue trend…")
    monthly_won: Dict[str, Dict] = defaultdict(lambda: {"won_count": 0, "won_value_cents": 0})
    for o in won_opps:
        mk = to_month_key(o.get("date_won") or o.get("date_updated"))
        if not mk:
            continue
        monthly_won[mk]["won_count"] += 1
        monthly_won[mk]["won_value_cents"] += int(o.get("value") or 0)

    # ── Monthly lead creation (all opps) ────────────────────────────────────
    print("  Computing monthly lead volume…")
    monthly_created: Dict[str, int] = defaultdict(int)
    for o in opps:
        mk = to_month_key(o.get("date_created"))
        if mk:
            monthly_created[mk] += 1

    # ── Monthly win rate ─────────────────────────────────────────────────────
    print("  Computing monthly win rate…")
    monthly_outcomes: Dict[str, Dict] = defaultdict(lambda: {"won": 0, "lost": 0, "active": 0})
    for o in opps:
        # Use date_won for won, date_updated for others
        if o.get("status_type") == "won":
            mk = to_month_key(o.get("date_won") or o.get("date_updated"))
        else:
            mk = to_month_key(o.get("date_updated") or o.get("date_created"))
        if mk:
            st = o.get("status_type", "active")
            if st in monthly_outcomes[mk]:
                monthly_outcomes[mk][st] += 1

    # ── Deal size distribution (won deals with value) ────────────────────────
    print("  Computing deal size distribution…")
    won_values_cents = sorted([int(o.get("value") or 0) for o in won_opps if int(o.get("value") or 0) > 0])
    total_won_revenue = sum(won_values_cents)
    n_won_with_value = len(won_values_cents)

    dist_buckets = [
        ("<$500",   0,       49_99),
        ("$500-1k", 50_000,  99_99),
        ("$1-2k",   100_000, 199_99),
        ("$2-3k",   200_000, 299_99),
        ("$3-5k",   300_000, 499_99),
        ("$5-8k",   500_000, 799_99),
        ("$8-12k",  800_000, 1199_99),
        ("$12k+",   1200_000, 9_999_999_99),
    ]
    dist_rows = []
    for label, lo, hi in dist_buckets:
        count = sum(1 for v in won_values_cents if lo <= v <= hi)
        total_v = sum(v for v in won_values_cents if lo <= v <= hi)
        dist_rows.append({
            "bucket": label,
            "count": count,
            "pct_of_deals": round(count / n_won_with_value * 100, 1) if n_won_with_value else 0,
            "total_value_cents": total_v,
            "total_value_fmt": fmt(total_v),
            "pct_of_revenue": round(total_v / total_won_revenue * 100, 1) if total_won_revenue else 0,
        })

    # ── Revenue concentration (Pareto) ───────────────────────────────────────
    print("  Computing revenue concentration…")
    sorted_desc = sorted(won_values_cents, reverse=True)
    n = len(sorted_desc)
    pareto_rows = []
    for top_pct in [5, 10, 20, 25, 50]:
        k = max(1, int(n * top_pct / 100))
        top_rev = sum(sorted_desc[:k])
        pareto_rows.append({
            "top_pct_of_deals": top_pct,
            "deal_count": k,
            "revenue_cents": top_rev,
            "revenue_fmt": fmt(top_rev),
            "pct_of_total_revenue": round(top_rev / total_won_revenue * 100, 1) if total_won_revenue else 0,
        })

    # ── Source family revenue share ──────────────────────────────────────────
    print("  Computing source revenue share…")
    src_rev: Dict[str, Dict] = defaultdict(lambda: {"won_count": 0, "won_value_cents": 0, "total_count": 0})
    for o in opps:
        raw_src = o.get(SOURCE_F, "") or ""
        fam = source_family(raw_src)
        src_rev[fam]["total_count"] += 1
        if o.get("status_type") == "won":
            src_rev[fam]["won_count"] += 1
            src_rev[fam]["won_value_cents"] += int(o.get("value") or 0)

    source_revenue_rows = sorted(
        [
            {
                "source": k,
                "total_leads": v["total_count"],
                "won_count": v["won_count"],
                "won_value_cents": v["won_value_cents"],
                "won_value_fmt": fmt(v["won_value_cents"]),
                "pct_of_total_revenue": round(v["won_value_cents"] / total_won_revenue * 100, 1) if total_won_revenue else 0,
                "avg_won_value_cents": round(v["won_value_cents"] / v["won_count"]) if v["won_count"] else 0,
                "avg_won_value_fmt": fmt(round(v["won_value_cents"] / v["won_count"]) if v["won_count"] else 0),
                "win_rate_pct": round(v["won_count"] / v["total_count"] * 100, 1) if v["total_count"] else 0,
            }
            for k, v in src_rev.items()
        ],
        key=lambda r: r["won_value_cents"],
        reverse=True,
    )

    # ── Event type revenue share ─────────────────────────────────────────────
    print("  Computing event type revenue share…")
    etype_rev: Dict[str, Dict] = defaultdict(lambda: {"won_count": 0, "won_value_cents": 0, "total_count": 0})
    for o in opps:
        raw_et = o.get(ETYPE_F, "") or ""
        et = normalize_event_type(raw_et)
        etype_rev[et]["total_count"] += 1
        if o.get("status_type") == "won":
            etype_rev[et]["won_count"] += 1
            etype_rev[et]["won_value_cents"] += int(o.get("value") or 0)

    etype_revenue_rows = sorted(
        [
            {
                "event_type": k,
                "total_leads": v["total_count"],
                "won_count": v["won_count"],
                "won_value_cents": v["won_value_cents"],
                "won_value_fmt": fmt(v["won_value_cents"]),
                "pct_of_total_revenue": round(v["won_value_cents"] / total_won_revenue * 100, 1) if total_won_revenue else 0,
                "avg_won_value_cents": round(v["won_value_cents"] / v["won_count"]) if v["won_count"] else 0,
                "avg_won_value_fmt": fmt(round(v["won_value_cents"] / v["won_count"]) if v["won_count"] else 0),
            }
            for k, v in etype_rev.items()
        ],
        key=lambda r: r["won_value_cents"],
        reverse=True,
    )

    # ── Assemble monthly trend table ─────────────────────────────────────────
    print("  Assembling monthly trend table…")
    trend_months = sorted(set(
        list(monthly_won.keys()) +
        list(monthly_created.keys()) +
        list(monthly_outcomes.keys())
    ))
    # Keep only those within our window
    cutoff = since.strftime("%Y-%m")
    trend_months = [m for m in trend_months if m >= cutoff]

    monthly_trend = []
    for mk in trend_months:
        w = monthly_won.get(mk, {})
        outcomes = monthly_outcomes.get(mk, {})
        won_c  = outcomes.get("won", 0)
        lost_c = outcomes.get("lost", 0)
        active_c = outcomes.get("active", 0)
        total_c = won_c + lost_c + active_c
        wr = round(won_c / (won_c + lost_c) * 100, 1) if (won_c + lost_c) > 0 else 0
        won_val = w.get("won_value_cents", 0)
        won_ct  = w.get("won_count", 0)
        avg_deal = round(won_val / won_ct) if won_ct else 0
        monthly_trend.append({
            "month": mk,
            "month_label": datetime.strptime(mk, "%Y-%m").strftime("%b '%y"),
            "new_leads": monthly_created.get(mk, 0),
            "won_count": won_ct,
            "won_value_cents": won_val,
            "won_value_fmt": fmt(won_val),
            "avg_deal_cents": avg_deal,
            "avg_deal_fmt": fmt(avg_deal),
            "win_rate_pct": wr,
        })

    # ── YoY comparison (last 12mo vs prior 12mo) ─────────────────────────────
    print("  Computing YoY comparison…")
    now_for_yoy = datetime.now(timezone.utc)
    last12_start = (now_for_yoy - timedelta(days=365)).strftime("%Y-%m")
    prior12_start = (now_for_yoy - timedelta(days=730)).strftime("%Y-%m")
    prior12_end   = (now_for_yoy - timedelta(days=366)).strftime("%Y-%m")

    last12_months  = [r for r in monthly_trend if r["month"] >= last12_start]
    prior12_months = [r for r in monthly_trend if prior12_start <= r["month"] <= prior12_end]

    def sum_revenue(rows): return sum(r["won_value_cents"] for r in rows)
    def sum_won(rows):     return sum(r["won_count"] for r in rows)
    def sum_leads(rows):   return sum(r["new_leads"] for r in rows)

    last12_rev  = sum_revenue(last12_months)
    prior12_rev = sum_revenue(prior12_months)
    last12_won  = sum_won(last12_months)
    prior12_won = sum_won(prior12_months)
    last12_leads  = sum_leads(last12_months)
    prior12_leads = sum_leads(prior12_months)

    last12_avg_deal  = round(last12_rev / last12_won) if last12_won else 0
    prior12_avg_deal = round(prior12_rev / prior12_won) if prior12_won else 0

    yoy = {
        "last_12mo_revenue_cents": last12_rev,
        "last_12mo_revenue_fmt": fmt(last12_rev),
        "prior_12mo_revenue_cents": prior12_rev,
        "prior_12mo_revenue_fmt": fmt(prior12_rev),
        "revenue_growth_pct": delta_pct(last12_rev, prior12_rev),
        "last_12mo_won_count": last12_won,
        "prior_12mo_won_count": prior12_won,
        "won_count_growth_pct": delta_pct(last12_won, prior12_won),
        "last_12mo_lead_volume": last12_leads,
        "prior_12mo_lead_volume": prior12_leads,
        "lead_volume_growth_pct": delta_pct(last12_leads, prior12_leads),
        "last_12mo_avg_deal_cents": last12_avg_deal,
        "last_12mo_avg_deal_fmt": fmt(last12_avg_deal),
        "prior_12mo_avg_deal_cents": prior12_avg_deal,
        "prior_12mo_avg_deal_fmt": fmt(prior12_avg_deal),
        "avg_deal_growth_pct": delta_pct(last12_avg_deal, prior12_avg_deal),
    }

    # ── Deal size percentiles ────────────────────────────────────────────────
    deal_percentiles = {
        "p25_cents": int(percentile(won_values_cents, 25)),
        "p25_fmt": fmt(int(percentile(won_values_cents, 25))),
        "p50_cents": int(percentile(won_values_cents, 50)),
        "p50_fmt": fmt(int(percentile(won_values_cents, 50))),
        "p75_cents": int(percentile(won_values_cents, 75)),
        "p75_fmt": fmt(int(percentile(won_values_cents, 75))),
        "p90_cents": int(percentile(won_values_cents, 90)),
        "p90_fmt": fmt(int(percentile(won_values_cents, 90))),
        "mean_cents": int(mean(won_values_cents)) if won_values_cents else 0,
        "mean_fmt": fmt(int(mean(won_values_cents)) if won_values_cents else 0),
        "median_cents": int(median(won_values_cents)) if won_values_cents else 0,
        "median_fmt": fmt(int(median(won_values_cents)) if won_values_cents else 0),
        "max_cents": max(won_values_cents) if won_values_cents else 0,
        "max_fmt": fmt(max(won_values_cents) if won_values_cents else 0),
    }

    # ── Peak booking months (won deals by month-of-year, aggregated) ────────
    peak_by_month: Dict[int, Dict] = defaultdict(lambda: {"won_count": 0, "won_value_cents": 0, "years": set()})
    for o in won_opps:
        mk = to_month_key(o.get("date_won") or o.get("date_updated"))
        if not mk:
            continue
        try:
            dt = datetime.strptime(mk, "%Y-%m")
            m = dt.month
            y = dt.year
            peak_by_month[m]["won_count"] += 1
            peak_by_month[m]["won_value_cents"] += int(o.get("value") or 0)
            peak_by_month[m]["years"].add(y)
        except Exception:
            pass

    MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    peak_rows = [
        {
            "month_num": m,
            "month_name": MONTH_NAMES[m - 1],
            "won_count": peak_by_month[m]["won_count"],
            "won_value_cents": peak_by_month[m]["won_value_cents"],
            "won_value_fmt": fmt(peak_by_month[m]["won_value_cents"]),
        }
        for m in range(1, 13)
    ]

    # ── Summary text ─────────────────────────────────────────────────────────
    rev_growth = yoy.get("revenue_growth_pct")
    rev_dir = "up" if rev_growth and rev_growth > 0 else "down" if rev_growth and rev_growth < 0 else "flat"
    best_month = max(peak_rows, key=lambda r: r["won_value_cents"])
    top_src = source_revenue_rows[0]["source"].replace("_", " ") if source_revenue_rows else "unknown"
    top_etype = etype_revenue_rows[0]["event_type"] if etype_revenue_rows else "unknown"
    top_pareto = pareto_rows[1] if len(pareto_rows) > 1 else pareto_rows[0] if pareto_rows else {}

    summary = (
        f"{len(opps):,} opps over {args.days}d. {len(won_opps)} won · {fmt(total_won_revenue)} total won revenue. "
        f"YoY revenue {rev_dir} {abs(rev_growth or 0):.1f}% ({fmt(prior12_rev)} → {fmt(last12_rev)}). "
        f"Median deal {deal_percentiles['median_fmt']} · mean {deal_percentiles['mean_fmt']} · top deal {deal_percentiles['max_fmt']}. "
        f"Revenue concentration: top {top_pareto.get('top_pct_of_deals',10)}% of deals = "
        f"{top_pareto.get('pct_of_total_revenue',0)}% of revenue. "
        f"Peak booking month: {best_month['month_name']} ({fmt(best_month['won_value_cents'])}). "
        f"Top revenue source: {top_src}. Top event type: {top_etype}."
    )

    # ── Assemble output ──────────────────────────────────────────────────────
    output = {
        "_meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "window_days": args.days,
            "total_opps": len(opps),
            "won_count": len(won_opps),
            "lost_count": len(lost_opps),
            "active_count": len(active_opps),
            "total_won_revenue_cents": total_won_revenue,
            "total_won_revenue_fmt": fmt(total_won_revenue),
            "won_with_value_count": n_won_with_value,
        },
        "yoy_comparison": yoy,
        "deal_size_percentiles": deal_percentiles,
        "deal_size_distribution": dist_rows,
        "revenue_concentration": pareto_rows,
        "monthly_trend": monthly_trend,
        "peak_booking_months": peak_rows,
        "source_revenue_share": source_revenue_rows,
        "event_type_revenue_share": etype_revenue_rows,
        "summary_text": summary,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, indent=2))
    print(f"\n✓ Written → {OUTPUT_PATH}")
    print(f"  {len(opps):,} opportunities · {len(won_opps)} won · {fmt(total_won_revenue)} total revenue")
    print(f"  YoY revenue: {fmt(prior12_rev)} → {fmt(last12_rev)} ({rev_dir} {abs(rev_growth or 0):.1f}%)")
    print(f"  Deal sizes: median {deal_percentiles['median_fmt']} · P75 {deal_percentiles['p75_fmt']} · max {deal_percentiles['max_fmt']}")
    print(f"  Top source: {top_src} · Top event type: {top_etype}")
    print(f"  Peak month: {best_month['month_name']} ({fmt(best_month['won_value_cents'])})")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
analytics_booking_lead_time.py
───────────────────────────────
Comeketo Agent — Booking Lead Time Intelligence
How far in advance are events being booked?  (event_date - date_won)

Produces:
  • Lead time histogram   — <30d / 30-60d / 60-90d / 90-180d / 180-365d / 365d+
  • By event type         — weddings booked further out than birthdays?
  • By source family      — referrals vs social: who plans ahead?
  • By month of event     — summer weddings booked how far out?
  • Urgency segments      — "last minute" (<30d) vs "planned" (90-180d) vs "long-horizon"
  • Win rate by lead time — does booking far out correlate with winning?
  • Monthly creation trend — when in the year do we close the most bookings?

Output: CCAgentindex/analytics/booking_lead_time_snapshot.json

Usage:
    python3 "analytics_booking_lead_time.py"          # 730-day default
    python3 "analytics_booking_lead_time.py" --days 365

Requires: CLOSE_API_KEY in .env or environment.
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
from statistics import median, mean
from typing import Dict, List, Optional

try:
    import requests
except ImportError:
    print("ERROR: pip install requests --break-system-packages")
    sys.exit(1)

SCRIPT_DIR  = Path(__file__).resolve().parent
REPO_ROOT   = SCRIPT_DIR.parent
ENV_FILE    = REPO_ROOT / ".env"
OUTPUT_PATH = REPO_ROOT / "CCAgentindex" / "analytics" / "booking_lead_time_snapshot.json"
CLOSE_API_BASE = "https://api.close.com/api/v1"

SOURCE_F   = "custom.cf_ge7qOebiWpyPvuv7xkzNaYpM8PsmOeNvXasXFOtPXRt"
ETYPE_F    = "custom.cf_goMfyKkS7pFUhmo0xvrl1JvQv1KLaQkfoVo0j93dvhe"
EVENT_DT_F = "custom.cf_FV2xBkviv7BAQZkkjUf8NUOc3fOpPTObMy5lVxZbyiP"


def load_api_key() -> str:
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if line.strip().startswith("CLOSE_API_KEY"):
                key = line.split("=", 1)[-1].strip().strip('"').strip("'")
                if key:
                    return key
    key = os.environ.get("CLOSE_API_KEY", "")
    if not key:
        print("ERROR: CLOSE_API_KEY not found"); sys.exit(1)
    return key


def fetch_opportunities(api_key: str, since_iso: str) -> List[Dict]:
    session = requests.Session()
    session.auth = (api_key, "")
    opps: List[Dict] = []
    params = {
        "date_updated__gte": since_iso, "_limit": 100, "_skip": 0,
        "_fields": f"id,lead_id,lead_name,status_type,status_label,value,date_won,date_created,{SOURCE_F},{ETYPE_F},{EVENT_DT_F}",
    }
    while True:
        resp = session.get(f"{CLOSE_API_BASE}/opportunity/", params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        opps.extend(data.get("data", []))
        if len(opps) % 500 == 0 or not data.get("has_more"):
            print(f"    {len(opps)} fetched…")
        if not data.get("has_more"):
            break
        params["_skip"] += 100
        time.sleep(0.05)
    return opps


def fmt(cents: int) -> str:
    if not cents: return "$0"
    v = abs(cents); sign = "-" if cents < 0 else ""; d = v / 100
    if d >= 1_000_000: return f"{sign}${d/1_000_000:.1f}M"
    if d >= 1_000: return f"{sign}${d/1_000:.1f}k"
    return f"{sign}${d:,.0f}"


def parse_date(s: str) -> Optional[datetime]:
    if not s: return None
    s = str(s).strip()
    try:
        if len(s) == 10:
            return datetime(int(s[:4]), int(s[5:7]), int(s[8:10]), tzinfo=timezone.utc)
        s2 = s.replace("Z", "+00:00")
        dt = datetime.fromisoformat(s2)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


def lead_time_days(opp: Dict) -> Optional[int]:
    """event_date - date_won in days. Positive = booked in advance."""
    event_dt = parse_date(opp.get(EVENT_DT_F))
    won_dt   = parse_date(opp.get("date_won"))
    if not event_dt or not won_dt:
        return None
    delta = (event_dt - won_dt).days
    return delta


def bucket(days: int) -> str:
    if days < 0:    return "past_event"
    if days < 30:   return "<30d"
    if days < 60:   return "30-60d"
    if days < 90:   return "60-90d"
    if days < 180:  return "90-180d"
    if days < 365:  return "180-365d"
    return "365d+"


BUCKET_ORDER = ["<30d", "30-60d", "60-90d", "90-180d", "180-365d", "365d+", "past_event"]
BUCKET_LABELS = {
    "<30d": "Last minute (<30d)",
    "30-60d": "Short notice (30-60d)",
    "60-90d": "Moderate (60-90d)",
    "90-180d": "Planned (90-180d)",
    "180-365d": "Well planned (6-12mo)",
    "365d+": "Long horizon (1yr+)",
    "past_event": "Past event at booking",
}

def source_family(raw: str) -> str:
    v = str(raw or "").lower()
    if any(x in v for x in ["facebook", "instagram", "social", "tiktok"]): return "social_media"
    if any(x in v for x in ["google", "seo", "organic", "search"]): return "search"
    if any(x in v for x in ["referral", "word of mouth", "wom", "friend", "family"]): return "referral"
    if any(x in v for x in ["phone", "call in", "walk in", "direct"]): return "phone_inbound"
    if any(x in v for x in ["expo", "bridal", "wedding show", "fair"]): return "expo_event"
    if any(x in v for x in ["the knot", "wedding wire", "zola", "thumbtack", "bark", "yelp"]): return "marketplace"
    if any(x in v for x in ["website", "comeketocatering", "comeketo.com", "web form"]): return "website_direct"
    if v in ("", "unknown", "none", "n/a"): return "unknown"
    return "other"

def normalize_etype(raw: str) -> str:
    v = str(raw or "").lower().strip()
    if any(x in v for x in ["wedding", "matrimon", "reception"]): return "wedding"
    if any(x in v for x in ["grad"]): return "graduation"
    if "quince" in v: return "quinceañera"
    if "birthday" in v or "bday" in v: return "birthday"
    if any(x in v for x in ["baby shower", "shower"]): return "baby_shower"
    if any(x in v for x in ["corporate", "company", "business", "conference"]): return "corporate"
    if any(x in v for x in ["holiday", "christmas", "thanksgiving"]): return "holiday"
    if any(x in v for x in ["memorial", "funeral", "repast"]): return "memorial"
    if v in ("", "unknown", "none", "n/a"): return "unknown"
    return "other"


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=730)
    args = parser.parse_args()

    print("╔══════════════════════════════════════════════════════════╗")
    print("║  Comeketo Booking Lead Time Intelligence  ·  24mo sweep  ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print()

    api_key = load_api_key()
    print("  API key loaded ✓")
    since = datetime.now(timezone.utc) - timedelta(days=args.days)
    since_iso = since.strftime("%Y-%m-%dT%H:%M:%S+00:00")
    print(f"  Fetching opportunities since {since.strftime('%Y-%m-%d')}…")

    opps = fetch_opportunities(api_key, since_iso)
    print(f"\n  → {len(opps)} total opps")

    won_opps = [o for o in opps if o.get("status_type") == "won"]
    all_opps_with_event = [o for o in opps if o.get(EVENT_DT_F)]
    print(f"  Won: {len(won_opps)} | With event date: {len(all_opps_with_event)}")

    # Compute lead times for WON opps with both event_date and date_won
    print("  Computing lead times…")
    lt_opps = []
    for o in won_opps:
        days = lead_time_days(o)
        if days is not None and days >= 0:  # exclude past-event-at-booking edge cases separately
            lt_opps.append({ **o, "_lt_days": days, "_lt_bucket": bucket(days) })
        elif days is not None and days < 0:
            lt_opps.append({ **o, "_lt_days": days, "_lt_bucket": "past_event" })

    valid_lt = [o for o in lt_opps if o["_lt_days"] >= 0]
    lt_days_list = sorted([o["_lt_days"] for o in valid_lt])
    print(f"  Lead times computed for {len(lt_opps)} won opps ({len(valid_lt)} with future event date)")

    def pct(n, total): return round(n / total * 100, 1) if total else 0

    # ── Overall histogram ────────────────────────────────────────────────────
    bucket_counts: Dict[str, Dict] = {b: {"count": 0, "won_value_cents": 0} for b in BUCKET_ORDER}
    for o in lt_opps:
        b = o["_lt_bucket"]
        bucket_counts[b]["count"] += 1
        bucket_counts[b]["won_value_cents"] += int(o.get("value") or 0)

    total_lt = len(lt_opps) or 1
    histogram = []
    for b in BUCKET_ORDER:
        d = bucket_counts[b]
        histogram.append({
            "bucket": b,
            "label": BUCKET_LABELS[b],
            "count": d["count"],
            "pct_of_bookings": pct(d["count"], total_lt),
            "won_value_cents": d["won_value_cents"],
            "won_value_fmt": fmt(d["won_value_cents"]),
            "avg_value_cents": round(d["won_value_cents"] / d["count"]) if d["count"] else 0,
            "avg_value_fmt": fmt(round(d["won_value_cents"] / d["count"]) if d["count"] else 0),
        })

    # ── By event type ────────────────────────────────────────────────────────
    print("  By event type…")
    etype_lt: Dict[str, List[int]] = defaultdict(list)
    etype_val: Dict[str, int] = defaultdict(int)
    for o in valid_lt:
        et = normalize_etype(o.get(ETYPE_F, "") or "")
        etype_lt[et].append(o["_lt_days"])
        etype_val[et] += int(o.get("value") or 0)

    by_etype = sorted([
        {
            "event_type": et,
            "count": len(days_list),
            "median_days": round(median(days_list), 1) if days_list else 0,
            "mean_days": round(mean(days_list), 1) if days_list else 0,
            "min_days": min(days_list),
            "max_days": max(days_list),
            "won_value_cents": etype_val[et],
            "won_value_fmt": fmt(etype_val[et]),
            "pct_under_90d": pct(sum(1 for d in days_list if d < 90), len(days_list)),
            "pct_over_180d": pct(sum(1 for d in days_list if d >= 180), len(days_list)),
        }
        for et, days_list in etype_lt.items()
        if len(days_list) >= 3
    ], key=lambda r: r["median_days"], reverse=True)

    # ── By source family ─────────────────────────────────────────────────────
    print("  By source…")
    src_lt: Dict[str, List[int]] = defaultdict(list)
    for o in valid_lt:
        sf = source_family(o.get(SOURCE_F, "") or "")
        src_lt[sf].append(o["_lt_days"])

    by_source = sorted([
        {
            "source": sf,
            "count": len(dl),
            "median_days": round(median(dl), 1) if dl else 0,
            "mean_days": round(mean(dl), 1) if dl else 0,
            "pct_under_90d": pct(sum(1 for d in dl if d < 90), len(dl)),
            "pct_over_180d": pct(sum(1 for d in dl if d >= 180), len(dl)),
        }
        for sf, dl in src_lt.items()
        if len(dl) >= 5
    ], key=lambda r: r["median_days"], reverse=True)

    # ── By event month (seasonal patterns) ──────────────────────────────────
    print("  Seasonal patterns…")
    month_lt: Dict[int, List[int]] = defaultdict(list)
    for o in valid_lt:
        event_dt = parse_date(o.get(EVENT_DT_F))
        if event_dt:
            month_lt[event_dt.month].append(o["_lt_days"])

    MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    by_event_month = [
        {
            "month_num": m,
            "month_name": MONTH_NAMES[m - 1],
            "count": len(month_lt.get(m, [])),
            "median_days": round(median(month_lt[m]), 1) if month_lt.get(m) else 0,
            "mean_days": round(mean(month_lt[m]), 1) if month_lt.get(m) else 0,
        }
        for m in range(1, 13)
    ]

    # ── Urgency segments ─────────────────────────────────────────────────────
    last_minute = [o for o in lt_opps if o["_lt_bucket"] == "<30d"]
    planned     = [o for o in lt_opps if o["_lt_bucket"] in ("90-180d", "180-365d")]
    long_horiz  = [o for o in lt_opps if o["_lt_bucket"] == "365d+"]

    urgency_segments = {
        "last_minute":  { "count": len(last_minute), "pct": pct(len(last_minute), total_lt),
                          "avg_value_cents": round(sum(int(o.get("value") or 0) for o in last_minute) / len(last_minute)) if last_minute else 0 },
        "planned":      { "count": len(planned),     "pct": pct(len(planned), total_lt),
                          "avg_value_cents": round(sum(int(o.get("value") or 0) for o in planned) / len(planned)) if planned else 0 },
        "long_horizon": { "count": len(long_horiz),  "pct": pct(len(long_horiz), total_lt),
                          "avg_value_cents": round(sum(int(o.get("value") or 0) for o in long_horiz) / len(long_horiz)) if long_horiz else 0 },
    }
    for seg in urgency_segments.values():
        seg["avg_value_fmt"] = fmt(seg["avg_value_cents"])

    # ── Global stats ─────────────────────────────────────────────────────────
    def percentile(lst, p):
        if not lst: return 0
        i = (len(lst) - 1) * p / 100
        lo, hi = int(i), min(int(i) + 1, len(lst) - 1)
        return lst[lo] + (lst[hi] - lst[lo]) * (i - lo)

    global_stats = {
        "bookings_with_lead_time": len(valid_lt),
        "bookings_total": len(lt_opps),
        "median_days": round(median(lt_days_list), 1) if lt_days_list else 0,
        "mean_days": round(mean(lt_days_list), 1) if lt_days_list else 0,
        "p25_days": round(percentile(lt_days_list, 25), 1),
        "p75_days": round(percentile(lt_days_list, 75), 1),
        "p90_days": round(percentile(lt_days_list, 90), 1),
        "min_days": min(lt_days_list) if lt_days_list else 0,
        "max_days": max(lt_days_list) if lt_days_list else 0,
    }

    # ── Summary ──────────────────────────────────────────────────────────────
    top_etype = by_etype[0] if by_etype else {}
    bottom_etype = by_etype[-1] if by_etype else {}
    lm_pct = urgency_segments["last_minute"]["pct"]
    lm_val = fmt(urgency_segments["last_minute"]["avg_value_cents"])
    plan_val = fmt(urgency_segments["planned"]["avg_value_cents"])

    summary = (
        f"{len(valid_lt)} won bookings with measurable lead time. "
        f"Median {global_stats['median_days']}d advance notice (P25={global_stats['p25_days']}d, P75={global_stats['p75_days']}d). "
        f"Last-minute (<30d): {urgency_segments['last_minute']['pct']}% of bookings, avg {lm_val}. "
        f"Planned (90-180d): {urgency_segments['planned']['pct']}%, avg {plan_val}. "
        f"Longest lead time: {top_etype.get('event_type','—')} at {top_etype.get('median_days',0)}d median. "
        f"Shortest: {bottom_etype.get('event_type','—')} at {bottom_etype.get('median_days',0)}d."
    )

    output = {
        "_meta": {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "window_days": args.days,
            "total_opps": len(opps),
            "won_with_event_date": len(lt_opps),
            "won_with_future_event": len(valid_lt),
        },
        "global_stats": global_stats,
        "urgency_segments": urgency_segments,
        "histogram": histogram,
        "by_event_type": by_etype,
        "by_source_family": by_source,
        "by_event_month": by_event_month,
        "summary_text": summary,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, indent=2))
    print(f"\n✓ Written → {OUTPUT_PATH}")
    print(f"  {len(valid_lt)} bookings · median {global_stats['median_days']}d lead time")
    print(f"  Last-minute {urgency_segments['last_minute']['pct']}% · Planned {urgency_segments['planned']['pct']}% · Long-horizon {urgency_segments['long_horizon']['pct']}%")
    if by_etype:
        print(f"  Longest lead time: {by_etype[0]['event_type']} ({by_etype[0]['median_days']}d)")
        print(f"  Shortest: {by_etype[-1]['event_type']} ({by_etype[-1]['median_days']}d)")


if __name__ == "__main__":
    main()

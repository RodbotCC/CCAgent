#!/usr/bin/env python3
"""
analytics_win_loss.py
──────────────────────
Comeketo Agent — Win / Loss Conversion Intelligence
Fetches Close CRM opportunity history (365-day default) and computes the
"why behind the outcome" across every dimension available in structured data.

Produces conversion intelligence for:
  • Event type          — win rate per wedding / graduation / birthday / etc.
  • Guest count buckets — <25 · 25-50 · 51-100 · 101-150 · 150+
  • Stage of death       — which pipeline stage are lost deals in when they die?
  • Owner × source       — top-performing combos (min 3 leads)
  • Customer type        — customer vs corporate etc.
  • Time patterns        — month-of-year win rate, days-to-close histogram
  • Source family        — digital_inbound vs expo vs marketplace etc.
  • Value buckets        — <$1k · $1-3k · $3-6k · $6-10k · $10k+

Output: CCAgentindex/analytics/win_loss_snapshot.json

Usage:
    python3 "analytics_win_loss.py"            # 365-day window (default)
    python3 "analytics_win_loss.py" --days 180

Requires:
    CLOSE_API_KEY in .env at repo root  OR  as a shell env var.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from statistics import median, mean
from typing import Any, Dict, List, Optional, Tuple

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not installed. Run: pip install requests --break-system-packages")
    sys.exit(1)

# ─── paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).resolve().parent
REPO_ROOT   = SCRIPT_DIR.parent
ENV_FILE    = REPO_ROOT / ".env"
OUTPUT_PATH = REPO_ROOT / "CCAgentindex" / "analytics" / "win_loss_snapshot.json"

CLOSE_API_BASE = "https://api.close.com/api/v1"

# ─── Close custom field IDs ───────────────────────────────────────────────────
SOURCE_F   = "custom.cf_ge7qOebiWpyPvuv7xkzNaYpM8PsmOeNvXasXFOtPXRt"
CTYPE_F    = "custom.cf_fs7mrfN5x0M20CyoltczyVg8t0Xul5GFvkC4FNUKvY6"
ETYPE_F    = "custom.cf_goMfyKkS7pFUhmo0xvrl1JvQv1KLaQkfoVo0j93dvhe"
GUEST_F    = "custom.cf_nQLULOLLmtUAh9OwcpJibPc5pQKIqpFOjdGSTwC9ePO"
EVENT_DT_F = "custom.cf_FV2xBkviv7BAQZkkjUf8NUOc3fOpPTObMy5lVxZbyiP"


# ─── classification helpers ───────────────────────────────────────────────────

EVENT_TYPE_NORMS = {
    "wedding":        ["wedding", "casamento", "reception", "weddings"],
    "birthday":       ["birthday", "bday", "sweet 16"],
    "graduation":     ["graduation", "graduation party", "graduate"],
    "baby_shower":    ["baby shower", "baby"],
    "bridal_shower":  ["bridal shower", "bridal"],
    "anniversary":    ["anniversary"],
    "quinceañera":    ["quinceanera", "quinceañera", "quinceaera"],
    "corporate":      ["corporate", "business", "company", "office"],
    "holiday":        ["holiday", "christmas", "new year", "thanksgiving"],
}

def normalize_event_type(raw: Any) -> str:
    if not raw:
        return "unknown"
    text = str(raw).strip().lower()
    for norm, keywords in EVENT_TYPE_NORMS.items():
        if norm in text:
            return norm
        for kw in keywords:
            if kw in text:
                return norm
    return "other"

def source_family(v: str) -> str:
    l = (v or "").lower()
    if not l or l == "unknown":
        return "unknown"
    if any(t in l for t in ("expo", "show", "free tasting")):
        return "expo_event"
    if any(t in l for t in ("facebook", "instagram", "comeketocatering", "crisp", "website", "web")):
        return "digital_inbound"
    if any(t in l for t in ("the knot", "zola", "wedding wire", "eventective", "bark")):
        return "marketplace"
    if "inbound call" in l or l == "call":
        return "phone_inbound"
    if any(t in l for t in ("referral", "previous event", "planner", "decorator", "venue", "partner")):
        return "relationship_partner"
    return "other"

def guest_bucket(n: Any) -> str:
    try:
        g = int(n or 0)
    except (TypeError, ValueError):
        return "unknown"
    if g <= 0:     return "unknown"
    if g <= 25:    return "1-25"
    if g <= 50:    return "26-50"
    if g <= 100:   return "51-100"
    if g <= 150:   return "101-150"
    return "150+"

GUEST_BUCKET_ORDER = ["1-25", "26-50", "51-100", "101-150", "150+", "unknown"]

def value_bucket(cents: int) -> str:
    d = cents / 100
    if d <= 0:       return "no value"
    if d < 1000:     return "<$1k"
    if d < 3000:     return "$1-3k"
    if d < 6000:     return "$3-6k"
    if d < 10000:    return "$6-10k"
    return "$10k+"

VALUE_BUCKET_ORDER = ["no value", "<$1k", "$1-3k", "$3-6k", "$6-10k", "$10k+"]

def list_to_text(v: Any) -> str:
    if isinstance(v, list):
        return " | ".join(str(x).strip() for x in v if str(x).strip())
    return str(v or "").strip()

def safe_cents(v: Any) -> int:
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0

def fmt_currency(cents: int) -> str:
    if cents <= 0:
        return "$0"
    d = cents / 100
    if d >= 1_000_000: return f"${d/1_000_000:.1f}M"
    if d >= 1_000:     return f"${d/1_000:.1f}k"
    return f"${d:.0f}"

def format_pct(n: int, d: int) -> float:
    return round(n / d * 100, 1) if d else 0.0

def days_between(a: str, b: str) -> Optional[float]:
    if not a or not b:
        return None
    try:
        def _p(s):
            s = s.strip()
            if len(s) == 8:  # YYYYMMDD
                return datetime(int(s[:4]), int(s[4:6]), int(s[6:8]), tzinfo=timezone.utc)
            if len(s) == 10 and s[4] == "-":  # YYYY-MM-DD
                return datetime(int(s[:4]), int(s[5:7]), int(s[8:10]), tzinfo=timezone.utc)
            dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
            return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt
        delta = (_p(b) - _p(a)).total_seconds() / 86400
        return round(delta, 1) if delta >= 0 else None
    except (ValueError, TypeError):
        return None


# ─── API helpers ──────────────────────────────────────────────────────────────

def load_env(path: Path) -> Dict[str, str]:
    env: Dict[str, str] = {}
    if not path.exists():
        return env
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def get_api_key() -> str:
    key = os.environ.get("CLOSE_API_KEY", "")
    if not key:
        key = load_env(ENV_FILE).get("CLOSE_API_KEY", "")
    if not key:
        print("ERROR: CLOSE_API_KEY not found.")
        sys.exit(1)
    return key

def close_get(api_key: str, path: str, params: Optional[Dict] = None) -> Any:
    url = f"{CLOSE_API_BASE}{path}"
    for attempt in range(3):
        try:
            r = requests.get(url, auth=(api_key, ""), params=params or {}, timeout=25)
            if r.status_code == 429:
                wait = int(r.headers.get("Retry-After", "5"))
                print(f"  Rate limited — waiting {wait}s…")
                time.sleep(wait)
                continue
            r.raise_for_status()
            return r.json()
        except requests.exceptions.RequestException:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)
    return {}

def fetch_all_opps(api_key: str, days: int) -> List[Dict]:
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%S+00:00")
    fields = (
        f"id,lead_id,lead_name,status_label,status_type,pipeline_name,"
        f"date_updated,date_created,date_won,value,user_name,"
        f"{SOURCE_F},{CTYPE_F},{ETYPE_F},{GUEST_F},{EVENT_DT_F}"
    )
    opps, offset = [], 0
    print(f"  Fetching opportunities updated since {cutoff[:10]}…")
    while True:
        resp = close_get(api_key, "/opportunity/", {
            "date_updated__gte": cutoff,
            "_skip": offset, "_limit": 100, "_fields": fields,
        })
        batch = resp.get("data", [])
        opps.extend(batch)
        print(f"    {len(opps)} fetched…")
        if not resp.get("has_more", False):
            break
        offset += len(batch)
        time.sleep(0.1)
    return opps


# ─── dimension builders ───────────────────────────────────────────────────────

def dim_stats(rows: List[Dict], key_fn, min_count: int = 1) -> List[Dict]:
    """
    For a list of opp dicts, group by key_fn(opp), compute
    lead_count / won / lost / active + win_rate + avg_value.
    Returns sorted by lead_count desc, filtered to min_count.
    """
    groups: Dict[str, List[Dict]] = defaultdict(list)
    for o in rows:
        k = key_fn(o)
        if k:
            groups[k].append(o)

    out = []
    for key, grp in groups.items():
        won    = [o for o in grp if (o.get("status_type") or "").lower() == "won"]
        lost   = [o for o in grp if (o.get("status_type") or "").lower() == "lost"]
        active = [o for o in grp if (o.get("status_type") or "").lower() == "active"]
        values = [safe_cents(o.get("value")) for o in won if safe_cents(o.get("value")) > 0]
        out.append({
            "key":           key,
            "lead_count":    len(grp),
            "won_count":     len(won),
            "lost_count":    len(lost),
            "active_count":  len(active),
            "win_rate_pct":  format_pct(len(won), len(grp)),
            "avg_won_value_cents": round(mean(values)) if values else 0,
            "avg_won_value_fmt":   fmt_currency(round(mean(values))) if values else "$0",
            "total_won_value_cents": sum(values),
            "total_won_value_fmt":   fmt_currency(sum(values)),
        })

    return sorted([r for r in out if r["lead_count"] >= min_count],
                  key=lambda r: (-r["lead_count"], r["key"]))


def stage_of_death(lost_opps: List[Dict]) -> List[Dict]:
    """Which pipeline stage do lost deals die in?"""
    counter = Counter(
        (o.get("status_label") or "Unknown").strip()
        for o in lost_opps
    )
    total = len(lost_opps)
    return sorted([
        {
            "stage": stage,
            "count": count,
            "pct_of_lost": format_pct(count, total),
        }
        for stage, count in counter.most_common()
    ], key=lambda r: -r["count"])


def combo_stats(
    opps: List[Dict],
    key_a_fn,
    key_b_fn,
    min_count: int = 3,
) -> List[Dict]:
    """Owner × source (or any two-dim combo). Min 3 leads to surface."""
    groups: Dict[Tuple, List[Dict]] = defaultdict(list)
    for o in opps:
        a = key_a_fn(o)
        b = key_b_fn(o)
        if a and b:
            groups[(a, b)].append(o)

    out = []
    for (a, b), grp in groups.items():
        won  = [o for o in grp if (o.get("status_type") or "").lower() == "won"]
        lost = [o for o in grp if (o.get("status_type") or "").lower() == "lost"]
        out.append({
            "dim_a":       a,
            "dim_b":       b,
            "lead_count":  len(grp),
            "won_count":   len(won),
            "lost_count":  len(lost),
            "win_rate_pct": format_pct(len(won), len(grp)),
        })

    return sorted(
        [r for r in out if r["lead_count"] >= min_count],
        key=lambda r: (-r["win_rate_pct"], -r["lead_count"])
    )[:20]


def time_patterns(won_opps: List[Dict]) -> Dict[str, Any]:
    """Month-of-year win distribution and time-to-close histogram."""
    months: Dict[int, int] = Counter()
    close_times: List[float] = []

    for o in won_opps:
        won_date = o.get("date_won") or ""
        created  = o.get("date_created") or ""
        d = days_between(created, won_date)
        if d is not None:
            close_times.append(d)
        # Month of event (when was the event, not when it was won)
        dt_raw = o.get(EVENT_DT_F)
        if dt_raw:
            try:
                s = str(dt_raw).strip()
                dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
                months[dt.month] += 1
            except (ValueError, TypeError):
                pass

    month_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    event_by_month = [
        {"month": month_names[m-1], "month_num": m, "event_count": months.get(m, 0)}
        for m in range(1, 13)
    ]

    # Close time buckets: <7d / 7-14d / 15-30d / 31-60d / 61-90d / 90d+
    buckets = {"<7d": 0, "7-14d": 0, "15-30d": 0, "31-60d": 0, "61-90d": 0, "90d+": 0}
    for d in close_times:
        if d < 7:     buckets["<7d"]    += 1
        elif d < 15:  buckets["7-14d"]  += 1
        elif d < 31:  buckets["15-30d"] += 1
        elif d < 61:  buckets["31-60d"] += 1
        elif d < 91:  buckets["61-90d"] += 1
        else:         buckets["90d+"]   += 1

    return {
        "event_by_month":     event_by_month,
        "close_time_buckets": [{"bucket": k, "count": v} for k, v in buckets.items()],
        "median_days_to_close": round(median(close_times), 1) if close_times else None,
        "mean_days_to_close":   round(mean(close_times), 1)   if close_times else None,
        "fastest_close_days":   round(min(close_times), 1)    if close_times else None,
    }


# ─── main ─────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Comeketo Win/Loss Conversion Intelligence")
    p.add_argument("--days",   type=int, default=365)
    p.add_argument("--output", type=Path, default=OUTPUT_PATH)
    return p.parse_args()


def main() -> int:
    args = parse_args()
    out: Path = args.output
    out.parent.mkdir(parents=True, exist_ok=True)

    print("╔═══════════════════════════════════════════════════════════════╗")
    print(f"║  Comeketo Win / Loss Conversion Intelligence · {args.days}d window  ║")
    print("╚═══════════════════════════════════════════════════════════════╝\n")

    api_key = get_api_key()
    print("  API key loaded ✓")

    opps = fetch_all_opps(api_key, args.days)
    print(f"\n  → {len(opps)} total opportunities")

    if not opps:
        print("  No opportunities found.")
        return 0

    # Deduplicate: one record per lead (best / latest opp per lead)
    # For conversion analysis we keep ALL opps (one lead can have multiple,
    # each representing a separate booking or quote attempt)
    won_opps    = [o for o in opps if (o.get("status_type") or "").lower() == "won"]
    lost_opps   = [o for o in opps if (o.get("status_type") or "").lower() == "lost"]
    active_opps = [o for o in opps if (o.get("status_type") or "").lower() == "active"]

    total = len(opps)
    print(f"  Won: {len(won_opps)}  Lost: {len(lost_opps)}  Active: {len(active_opps)}")

    # ── Dimension analyses ──────────────────────────────────────────────────

    print("  Computing event type conversion rates…")
    by_event_type = dim_stats(
        opps,
        lambda o: normalize_event_type(o.get(ETYPE_F)),
        min_count=3,
    )

    print("  Computing guest count bucket conversion rates…")
    by_guest_bucket = sorted(
        dim_stats(opps, lambda o: guest_bucket(o.get(GUEST_F)), min_count=3),
        key=lambda r: GUEST_BUCKET_ORDER.index(r["key"]) if r["key"] in GUEST_BUCKET_ORDER else 99,
    )

    print("  Computing value bucket conversion rates…")
    by_value_bucket = sorted(
        dim_stats(opps, lambda o: value_bucket(safe_cents(o.get("value"))), min_count=3),
        key=lambda r: VALUE_BUCKET_ORDER.index(r["key"]) if r["key"] in VALUE_BUCKET_ORDER else 99,
    )

    print("  Computing source family conversion rates…")
    by_source_family = dim_stats(
        opps,
        lambda o: source_family(list_to_text(o.get(SOURCE_F))),
        min_count=3,
    )

    print("  Computing source channel conversion rates…")
    by_source_channel = dim_stats(
        opps,
        lambda o: list_to_text(o.get(SOURCE_F)).split("|")[0].strip() or "unknown",
        min_count=3,
    )

    print("  Computing customer type conversion rates…")
    by_customer_type = dim_stats(
        opps,
        lambda o: list_to_text(o.get(CTYPE_F)) or "unknown",
        min_count=3,
    )

    print("  Computing owner conversion rates…")
    by_owner = dim_stats(
        opps,
        lambda o: o.get("user_name") or "Unassigned",
        min_count=3,
    )

    print("  Computing stage of death for lost deals…")
    stage_death = stage_of_death(lost_opps)

    print("  Computing owner × source combos…")
    owner_x_source = combo_stats(
        opps,
        lambda o: o.get("user_name") or "Unassigned",
        lambda o: source_family(list_to_text(o.get(SOURCE_F))),
    )

    print("  Computing event type × source combos…")
    etype_x_source = combo_stats(
        opps,
        lambda o: normalize_event_type(o.get(ETYPE_F)),
        lambda o: source_family(list_to_text(o.get(SOURCE_F))),
    )

    print("  Computing time patterns…")
    tp = time_patterns(won_opps)

    # ── Overall funnel ───────────────────────────────────────────────────────
    total_won_value  = sum(safe_cents(o.get("value")) for o in won_opps)
    total_lost_value = sum(safe_cents(o.get("value")) for o in lost_opps)
    overall_win_rate = format_pct(len(won_opps), total)

    # Best performing combos (win rate ≥ 25%, ≥ 5 leads)
    top_profiles = [
        r for r in by_event_type + by_source_family + by_guest_bucket
        if r["win_rate_pct"] >= 25 and r["lead_count"] >= 5
    ]
    top_profiles.sort(key=lambda r: (-r["win_rate_pct"], -r["lead_count"]))

    summary_text = (
        f"{total} opportunities · {len(won_opps)} won · {len(lost_opps)} lost · "
        f"{overall_win_rate}% overall win rate · "
        f"won value {fmt_currency(total_won_value)} · "
        f"lost pipeline {fmt_currency(total_lost_value)} · "
        f"median close {tp['median_days_to_close']}d"
    )

    snapshot = {
        "_meta": {
            "schema_version": "1.0",
            "description": "Win/loss conversion intelligence — auto-generated from Close CRM opportunity history.",
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "window_days": args.days,
            "opportunity_count": total,
            "won_count":    len(won_opps),
            "lost_count":   len(lost_opps),
            "active_count": len(active_opps),
            "overall_win_rate_pct": overall_win_rate,
        },
        "funnel": {
            "total":        total,
            "won":          len(won_opps),
            "lost":         len(lost_opps),
            "active":       len(active_opps),
            "win_rate_pct": overall_win_rate,
            "total_won_value_cents":  total_won_value,
            "total_won_value_fmt":    fmt_currency(total_won_value),
            "total_lost_value_cents": total_lost_value,
            "total_lost_value_fmt":   fmt_currency(total_lost_value),
        },
        "by_event_type":    by_event_type,
        "by_guest_bucket":  by_guest_bucket,
        "by_value_bucket":  by_value_bucket,
        "by_source_family": by_source_family,
        "by_source_channel":by_source_channel,
        "by_customer_type": by_customer_type,
        "by_owner":         by_owner,
        "stage_of_death":   stage_death,
        "owner_x_source":   owner_x_source,
        "etype_x_source":   etype_x_source,
        "time_patterns":    tp,
        "top_win_profiles": top_profiles[:10],
        "summary_text":     summary_text,
    }

    out.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n✓ Written → {out}")
    print(f"  {summary_text}")

    print(f"\n  Win rate by event type:")
    for r in by_event_type[:8]:
        print(f"    {r['key']:20s}  leads={r['lead_count']:4d}  won={r['won_count']:4d}  win%={r['win_rate_pct']:5.1f}%  avg={r['avg_won_value_fmt']}")

    print(f"\n  Win rate by guest bucket:")
    for r in by_guest_bucket:
        print(f"    {r['key']:10s}  leads={r['lead_count']:4d}  win%={r['win_rate_pct']:5.1f}%  avg={r['avg_won_value_fmt']}")

    print(f"\n  Stage of death (top 8 lost stages):")
    for r in stage_death[:8]:
        print(f"    {r['stage'][:50]:52s}  count={r['count']:4d}  ({r['pct_of_lost']}%)")

    print(f"\n  Time to close: median={tp['median_days_to_close']}d  mean={tp['mean_days_to_close']}d  fastest={tp['fastest_close_days']}d")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

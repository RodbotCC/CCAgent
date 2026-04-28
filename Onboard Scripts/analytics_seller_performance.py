#!/usr/bin/env python3
"""
analytics_seller_performance.py
────────────────────────────────
Comeketo Agent — Seller Performance & Pipeline Health Sweep
Fetches Close CRM opportunity data (extended fields) to compute:

  Per-owner:
    • lead_count, active / won / lost breakdown
    • pipeline_value      — sum of value for active opps
    • total_won_value     — sum of value for won opps in window
    • avg_won_value       — mean value of won opps (excl. $0)
    • median_days_to_close— for won opps that have date_won
    • stage_distribution  — top active pipeline stages
    • win_rate_pct

  Pipeline funnel (global):
    • per status_label: count, total_value
    • new_this_period    — opps created in last N days
    • total_active_value, total_won_value in window

Writes:
    CCAgentindex/analytics/seller_performance_snapshot.json

Usage:
    python3 "analytics_seller_performance.py"           # last 30 days (default)
    python3 "analytics_seller_performance.py" --days 60

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
from statistics import median
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
OUTPUT_PATH = REPO_ROOT / "CCAgentindex" / "analytics" / "seller_performance_snapshot.json"

CLOSE_API_BASE = "https://api.close.com/api/v1"

# Close custom field IDs
SOURCE_F = "custom.cf_ge7qOebiWpyPvuv7xkzNaYpM8PsmOeNvXasXFOtPXRt"
CTYPE_F  = "custom.cf_fs7mrfN5x0M20CyoltczyVg8t0Xul5GFvkC4FNUKvY6"

# ─── helpers ──────────────────────────────────────────────────────────────────

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
        env = load_env(ENV_FILE)
        key = env.get("CLOSE_API_KEY", "")
    if not key:
        print("ERROR: CLOSE_API_KEY not found in environment or .env file.")
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
        except requests.exceptions.RequestException as e:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)
    return {}


def fetch_all_opps(api_key: str, days: int) -> List[Dict]:
    """Fetch all opportunities updated in the last N days — paginated, fast."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%S+00:00")
    fields = (
        f"id,lead_id,lead_name,status_label,status_type,pipeline_name,"
        f"date_updated,date_created,date_won,value,value_period,user_name,"
        f"{SOURCE_F},{CTYPE_F}"
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
        print(f"    {len(opps)} opportunities fetched…")
        if not resp.get("has_more", False):
            break
        offset += len(batch)
        time.sleep(0.1)
    return opps


def days_between(date_a: str, date_b: str) -> Optional[float]:
    """Return (b - a) in calendar days, or None if either is missing."""
    if not date_a or not date_b:
        return None
    try:
        # Normalize both to aware datetimes in UTC
        def _parse(s: str) -> datetime:
            s = s.strip()
            # Handle formats like "2026-03-15" (date-only) — treat as midnight UTC
            if len(s) == 10:
                return datetime(int(s[:4]), int(s[5:7]), int(s[8:10]), tzinfo=timezone.utc)
            dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        a = _parse(date_a)
        b = _parse(date_b)
        delta = (b - a).total_seconds() / 86400
        return round(delta, 1) if delta >= 0 else None
    except (ValueError, TypeError):
        return None


def safe_cents(v: Any) -> int:
    """Close stores value in cents (integer). Normalize to integer or 0."""
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0


def fmt_currency(cents: int) -> str:
    """Format cents as compact dollar string: $1.2k, $34.5k, $1.2M."""
    if cents <= 0:
        return "$0"
    dollars = cents / 100
    if dollars >= 1_000_000:
        return f"${dollars / 1_000_000:.1f}M"
    if dollars >= 1_000:
        return f"${dollars / 1_000:.1f}k"
    return f"${dollars:.0f}"


def format_pct(n: int, d: int) -> float:
    return round(n / d * 100, 1) if d else 0.0


# ─── builders ─────────────────────────────────────────────────────────────────

def build_owner_profile(name: str, opps: List[Dict], period_start: str) -> Dict[str, Any]:
    active  = [o for o in opps if (o.get("status_type") or "").lower() == "active"]
    won     = [o for o in opps if (o.get("status_type") or "").lower() == "won"]
    lost    = [o for o in opps if (o.get("status_type") or "").lower() == "lost"]

    # Pipeline value (active)
    pipeline_value = sum(safe_cents(o.get("value")) for o in active)

    # Won value + avg deal size
    won_values = [safe_cents(o.get("value")) for o in won if safe_cents(o.get("value")) > 0]
    total_won_value = sum(won_values)
    avg_won_value   = round(sum(won_values) / len(won_values)) if won_values else 0

    # Median time to close (days from date_created → date_won for won opps)
    close_times = [
        days_between(o.get("date_created", ""), o.get("date_won", ""))
        for o in won
        if o.get("date_won")
    ]
    close_times = [d for d in close_times if d is not None and d >= 0]
    median_days_to_close = round(median(close_times), 1) if close_times else None

    # Active stage distribution (top 5)
    stage_counter = Counter(o.get("status_label") or "Unknown" for o in active)
    top_stages = [
        {"stage": s, "count": c}
        for s, c in stage_counter.most_common(5)
    ]

    # New opps created in the period
    new_count = sum(
        1 for o in opps
        if (o.get("date_created") or "") >= period_start
    )

    return {
        "owner_name": name,
        "lead_count": len(opps),
        "active_count": len(active),
        "won_count": len(won),
        "lost_count": len(lost),
        "win_rate_pct": format_pct(len(won), len(opps)),
        "pipeline_value_cents": pipeline_value,
        "pipeline_value_fmt": fmt_currency(pipeline_value),
        "total_won_value_cents": total_won_value,
        "total_won_value_fmt": fmt_currency(total_won_value),
        "avg_won_value_cents": avg_won_value,
        "avg_won_value_fmt": fmt_currency(avg_won_value),
        "median_days_to_close": median_days_to_close,
        "top_active_stages": top_stages,
        "new_opps_this_period": new_count,
    }


def build_pipeline_funnel(opps: List[Dict], period_start: str) -> Dict[str, Any]:
    """Global pipeline: stage funnel counts + values."""
    # Stage funnel — all opps
    stage_groups: Dict[str, List[Dict]] = defaultdict(list)
    for o in opps:
        label = o.get("status_label") or "Unknown"
        stage_groups[label].append(o)

    stages = []
    for label, group in sorted(stage_groups.items(), key=lambda x: -len(x[1])):
        active  = [o for o in group if (o.get("status_type") or "").lower() == "active"]
        won     = [o for o in group if (o.get("status_type") or "").lower() == "won"]
        lost    = [o for o in group if (o.get("status_type") or "").lower() == "lost"]
        val     = sum(safe_cents(o.get("value")) for o in group)
        stages.append({
            "status_label":  label,
            "status_type":   (group[0].get("status_type") or "").lower() if group else "",
            "count":         len(group),
            "active_count":  len(active),
            "won_count":     len(won),
            "lost_count":    len(lost),
            "total_value_cents": val,
            "total_value_fmt":   fmt_currency(val),
        })

    all_active = [o for o in opps if (o.get("status_type") or "").lower() == "active"]
    all_won    = [o for o in opps if (o.get("status_type") or "").lower() == "won"]
    all_new    = [o for o in opps if (o.get("date_created") or "") >= period_start]

    total_active_value = sum(safe_cents(o.get("value")) for o in all_active)
    total_won_value    = sum(safe_cents(o.get("value")) for o in all_won)

    return {
        "stages": stages,
        "total_active_count": len(all_active),
        "total_won_count":    len(all_won),
        "total_active_value_cents": total_active_value,
        "total_active_value_fmt":   fmt_currency(total_active_value),
        "total_won_value_cents": total_won_value,
        "total_won_value_fmt":   fmt_currency(total_won_value),
        "new_opps_this_period": len(all_new),
    }


# ─── main ─────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Comeketo Seller Performance & Pipeline Health Sweep")
    p.add_argument("--days", type=int, default=30)
    p.add_argument("--output", type=Path, default=OUTPUT_PATH)
    return p.parse_args()


def main() -> int:
    args = parse_args()
    days: int  = args.days
    out: Path  = args.output
    out.parent.mkdir(parents=True, exist_ok=True)

    print("╔══════════════════════════════════════════════════════════════╗")
    print(f"║  Comeketo Seller Performance & Pipeline Health · Last {days} days  ║")
    print("╚══════════════════════════════════════════════════════════════╝\n")

    api_key = get_api_key()
    print("  API key loaded ✓")

    period_start = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%S+00:00")

    opps = fetch_all_opps(api_key, days)
    print(f"\n  → {len(opps)} total opportunities")

    if not opps:
        print("  No opportunities found. Exiting.")
        return 0

    # Deduplicate by lead — keep latest per lead for per-owner grouping
    # (For pipeline funnel we use all opps)
    owner_groups: Dict[str, List[Dict]] = defaultdict(list)
    for o in opps:
        owner = o.get("user_name") or "Unassigned"
        owner_groups[owner].append(o)

    print(f"\n  Building owner profiles for {len(owner_groups)} owners…")
    owner_profiles = sorted(
        [build_owner_profile(name, group, period_start) for name, group in owner_groups.items()],
        key=lambda r: (-r["lead_count"], r["owner_name"]),
    )

    print("  Building pipeline funnel…")
    pipeline = build_pipeline_funnel(opps, period_start)

    all_won_times = [
        days_between(o.get("date_created", ""), o.get("date_won", ""))
        for o in opps
        if (o.get("status_type") or "").lower() == "won" and o.get("date_won")
    ]
    all_won_times = [d for d in all_won_times if d is not None and d >= 0]
    global_median_days = round(median(all_won_times), 1) if all_won_times else None

    total_leads = len(opps)
    won_count  = sum(1 for o in opps if (o.get("status_type") or "").lower() == "won")
    lost_count = sum(1 for o in opps if (o.get("status_type") or "").lower() == "lost")
    active_count = sum(1 for o in opps if (o.get("status_type") or "").lower() == "active")

    summary_text = (
        f"{total_leads} opportunities · {won_count} won · {lost_count} lost · {active_count} active · "
        f"pipeline {pipeline['total_active_value_fmt']} · won value {pipeline['total_won_value_fmt']} · "
        f"median close {global_median_days}d · {len(owner_profiles)} owners"
    )

    snapshot = {
        "_meta": {
            "schema_version": "1.0",
            "description": "Seller performance & pipeline health — auto-generated from Close CRM opportunity data.",
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "window_days": days,
            "opportunity_count": len(opps),
            "owner_count": len(owner_profiles),
        },
        "owner_profiles": owner_profiles,
        "pipeline": pipeline,
        "global_metrics": {
            "total_opportunities": total_leads,
            "won_count":    won_count,
            "lost_count":   lost_count,
            "active_count": active_count,
            "win_rate_pct": format_pct(won_count, total_leads),
            "global_median_days_to_close": global_median_days,
            "total_active_value_cents": pipeline["total_active_value_cents"],
            "total_active_value_fmt":   pipeline["total_active_value_fmt"],
            "total_won_value_cents":    pipeline["total_won_value_cents"],
            "total_won_value_fmt":      pipeline["total_won_value_fmt"],
            "new_opps_this_period":     pipeline["new_opps_this_period"],
        },
        "summary_text": summary_text,
    }

    out.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n✓ Written → {out}")
    print(f"  {summary_text}")
    print(f"\n  Owner Performance:")
    for o in owner_profiles:
        close_str = f"{o['median_days_to_close']}d" if o["median_days_to_close"] is not None else " n/a"
        print(
            f"    {o['owner_name']:30s}  leads={o['lead_count']:3d}  "
            f"won={o['won_count']:3d}  win%={o['win_rate_pct']:5.1f}%  "
            f"pipeline={o['pipeline_value_fmt']:>8s}  close={close_str}"
        )
    print(f"\n  Pipeline Funnel (top stages):")
    for s in sorted(pipeline["stages"], key=lambda x: -x["count"])[:10]:
        print(f"    {s['status_label']:40s}  count={s['count']:4d}  value={s['total_value_fmt']:>8s}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

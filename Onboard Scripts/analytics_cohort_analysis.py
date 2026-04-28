#!/usr/bin/env python3
"""
analytics_cohort_analysis.py
─────────────────────────────
Comeketo Agent — Monthly Cohort Conversion Analysis
Groups leads by the month they were created and tracks what % converted
at 30 / 60 / 90 / 180 / 365 / 730-day windows from creation.

This answers: "Of the leads we got in October 2024, how many had won
within 30 days? 90 days? A year?"

Produces:
  • cohort_grid         — rows=creation month, cols=30/60/90/180/365d+ windows
  • conversion_curves   — for each window, avg conversion rate over time
  • best/worst cohorts  — top 5 and bottom 5 by 90d conversion rate
  • source cohorts      — same grid but grouped by source family
  • recent_cohort_health— last 6 months cohorts + their current best-case conversion

Output: CCAgentindex/analytics/cohort_snapshot.json

Usage:
    python3 "analytics_cohort_analysis.py"          # 730-day default
    python3 "analytics_cohort_analysis.py" --days 730

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
from typing import Dict, List, Optional

try:
    import requests
except ImportError:
    print("ERROR: pip install requests --break-system-packages"); sys.exit(1)

SCRIPT_DIR  = Path(__file__).resolve().parent
REPO_ROOT   = SCRIPT_DIR.parent
ENV_FILE    = REPO_ROOT / ".env"
OUTPUT_PATH = REPO_ROOT / "CCAgentindex" / "analytics" / "cohort_snapshot.json"
CLOSE_API_BASE = "https://api.close.com/api/v1"

SOURCE_F = "custom.cf_ge7qOebiWpyPvuv7xkzNaYpM8PsmOeNvXasXFOtPXRt"


def load_api_key() -> str:
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if line.strip().startswith("CLOSE_API_KEY"):
                k = line.split("=", 1)[-1].strip().strip('"').strip("'")
                if k: return k
    k = os.environ.get("CLOSE_API_KEY", "")
    if not k: print("ERROR: CLOSE_API_KEY not found"); sys.exit(1)
    return k


def fetch_opportunities(api_key: str, since_iso: str) -> List[Dict]:
    session = requests.Session()
    session.auth = (api_key, "")
    opps: List[Dict] = []
    params = {
        "date_updated__gte": since_iso, "_limit": 100, "_skip": 0,
        "_fields": f"id,lead_id,status_type,value,date_won,date_created,{SOURCE_F}",
    }
    while True:
        resp = session.get(f"{CLOSE_API_BASE}/opportunity/", params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        opps.extend(data.get("data", []))
        if len(opps) % 500 == 0 or not data.get("has_more"):
            print(f"    {len(opps)} fetched…")
        if not data.get("has_more"): break
        params["_skip"] += 100
        time.sleep(0.05)
    return opps


def parse_dt(s: str) -> Optional[datetime]:
    if not s: return None
    s = str(s).strip()
    try:
        if len(s) == 10:
            return datetime(int(s[:4]), int(s[5:7]), int(s[8:10]), tzinfo=timezone.utc)
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    except Exception:
        return None


def source_family(raw: str) -> str:
    v = str(raw or "").lower()
    if any(x in v for x in ["facebook","instagram","social","tiktok"]): return "social_media"
    if any(x in v for x in ["google","seo","organic","search"]): return "search"
    if any(x in v for x in ["referral","word of mouth","wom","friend","family"]): return "referral"
    if any(x in v for x in ["phone","call in","walk in","direct"]): return "phone_inbound"
    if any(x in v for x in ["expo","bridal","wedding show","fair"]): return "expo_event"
    if any(x in v for x in ["the knot","wedding wire","zola","thumbtack","bark","yelp"]): return "marketplace"
    if any(x in v for x in ["website","comeketocatering","comeketo.com","web form"]): return "website_direct"
    if v in ("","unknown","none","n/a"): return "unknown"
    return "other"


WINDOWS = [30, 60, 90, 180, 365, 730]
WINDOW_LABELS = {30:"30d", 60:"60d", 90:"90d", 180:"6mo", 365:"1yr", 730:"2yr"}


def build_cohort_grid(opps: List[Dict], now: datetime, key_fn=None) -> List[Dict]:
    """
    Build cohort rows. key_fn(opp) → cohort key (default: creation month YYYY-MM).
    Each row: cohort, total_leads, conversions at each window, conversion rates.
    """
    cohorts: Dict[str, Dict] = defaultdict(lambda: {
        "total": 0,
        "won": [],   # list of (days_to_convert)
        "total_value": 0,
    })

    for o in opps:
        created_dt = parse_dt(o.get("date_created"))
        if not created_dt: continue

        key = key_fn(o) if key_fn else created_dt.strftime("%Y-%m")
        cohorts[key]["total"] += 1

        if o.get("status_type") == "won":
            won_dt = parse_dt(o.get("date_won"))
            if won_dt:
                days_to_convert = (won_dt - created_dt).days
                if days_to_convert >= 0:
                    cohorts[key]["won"].append(days_to_convert)
                    cohorts[key]["total_value"] += int(o.get("value") or 0)

    rows = []
    for cohort_key in sorted(cohorts.keys()):
        c = cohorts[cohort_key]
        total = c["total"]
        if total < 3: continue

        # For each window, count how many converted within that many days
        window_data = {}
        for w in WINDOWS:
            count = sum(1 for d in c["won"] if d <= w)
            window_data[WINDOW_LABELS[w]] = {
                "converted": count,
                "rate_pct": round(count / total * 100, 1) if total else 0,
            }

        # Age of cohort — how many days has it had to convert?
        try:
            cohort_dt = datetime.strptime(cohort_key[:7], "%Y-%m").replace(tzinfo=timezone.utc)
        except Exception:
            cohort_dt = now - timedelta(days=365)
        age_days = (now - cohort_dt).days

        rows.append({
            "cohort": cohort_key,
            "total_leads": total,
            "total_converted": len(c["won"]),
            "total_value_cents": c["total_value"],
            "age_days": age_days,
            "maturity": "mature" if age_days >= 365 else "developing" if age_days >= 90 else "young",
            "windows": window_data,
            "best_rate_pct": window_data[WINDOW_LABELS[max(w for w in WINDOWS if w <= max(age_days, 30))]]["rate_pct"],
        })

    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=730)
    args = parser.parse_args()

    print("╔═══════════════════════════════════════════════════════════╗")
    print("║  Comeketo Cohort Conversion Analysis  ·  24-month sweep  ║")
    print("╚═══════════════════════════════════════════════════════════╝")
    print()

    api_key = load_api_key()
    print("  API key loaded ✓")
    since = datetime.now(timezone.utc) - timedelta(days=args.days)
    since_iso = since.strftime("%Y-%m-%dT%H:%M:%S+00:00")
    print(f"  Fetching opportunities since {since.strftime('%Y-%m-%d')}…")

    opps = fetch_opportunities(api_key, since_iso)
    now = datetime.now(timezone.utc)
    print(f"\n  → {len(opps)} opps")

    won_all = [o for o in opps if o.get("status_type") == "won"]
    print(f"  Won: {len(won_all)}")

    # ── Overall cohort grid (by creation month) ──────────────────────────────
    print("  Building monthly cohort grid…")
    cohort_grid = build_cohort_grid(opps, now)
    print(f"  {len(cohort_grid)} cohort months")

    # ── Best & worst cohorts (mature only) ────────────────────────────────────
    mature = [r for r in cohort_grid if r["maturity"] == "mature"]
    best_cohorts  = sorted(mature, key=lambda r: r["windows"]["90d"]["rate_pct"], reverse=True)[:5]
    worst_cohorts = sorted(mature, key=lambda r: r["windows"]["90d"]["rate_pct"])[:5]

    # ── Recent cohort health (last 6 months) ─────────────────────────────────
    recent_cutoff = (now - timedelta(days=180)).strftime("%Y-%m")
    recent_cohorts = [r for r in cohort_grid if r["cohort"] >= recent_cutoff]

    # ── Source family cohorts ─────────────────────────────────────────────────
    print("  Building source cohorts…")
    source_cohorts = build_cohort_grid(opps, now, key_fn=lambda o: source_family(o.get(SOURCE_F, "") or ""))
    # Enrich with source label
    for r in source_cohorts:
        r["source"] = r["cohort"]

    # ── Conversion curves (average rate per window across all mature cohorts) ─
    print("  Building conversion curves…")
    curves = []
    for w in WINDOWS:
        wl = WINDOW_LABELS[w]
        eligible = [r for r in cohort_grid if r["age_days"] >= w]
        if not eligible: continue
        avg_rate = round(sum(r["windows"][wl]["rate_pct"] for r in eligible) / len(eligible), 1)
        total_conv = sum(r["windows"][wl]["converted"] for r in eligible)
        total_leads = sum(r["total_leads"] for r in eligible)
        curves.append({
            "window": wl,
            "window_days": w,
            "avg_conversion_rate_pct": avg_rate,
            "total_converted": total_conv,
            "total_eligible_leads": total_leads,
            "overall_rate_pct": round(total_conv / total_leads * 100, 1) if total_leads else 0,
        })

    # ── Summary ──────────────────────────────────────────────────────────────
    w90 = next((c for c in curves if c["window"] == "90d"), {})
    w365 = next((c for c in curves if c["window"] == "1yr"), {})
    best = best_cohorts[0] if best_cohorts else {}
    summary = (
        f"{len(cohort_grid)} monthly cohorts over {args.days}d. "
        f"Average 90d conversion: {w90.get('overall_rate_pct', '?')}%. "
        f"Average 1yr conversion: {w365.get('overall_rate_pct', '?')}%. "
        f"Best cohort: {best.get('cohort','—')} ({best.get('windows',{}).get('90d',{}).get('rate_pct','?')}% at 90d). "
        f"{len(recent_cohorts)} cohorts in last 6 months still developing."
    )

    output = {
        "_meta": {
            "generated_at": now.isoformat(),
            "window_days": args.days,
            "total_opps": len(opps),
            "total_cohorts": len(cohort_grid),
            "conversion_windows": [WINDOW_LABELS[w] for w in WINDOWS],
        },
        "conversion_curves": curves,
        "cohort_grid": cohort_grid,
        "best_cohorts": best_cohorts,
        "worst_cohorts": worst_cohorts,
        "recent_cohort_health": recent_cohorts,
        "source_cohorts": source_cohorts,
        "summary_text": summary,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, indent=2))
    print(f"\n✓ Written → {OUTPUT_PATH}")
    print(f"  {len(cohort_grid)} cohorts · {w90.get('overall_rate_pct','?')}% avg 90d conversion · {w365.get('overall_rate_pct','?')}% avg 1yr")
    if best_cohorts:
        print(f"  Best cohort: {best_cohorts[0]['cohort']} at {best_cohorts[0]['windows']['90d']['rate_pct']}% 90d rate")


if __name__ == "__main__":
    main()

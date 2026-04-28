#!/usr/bin/env python3
"""
analytics_source_channels.py
─────────────────────────────
Comeketo Agent — Source Channel Intelligence Sweep
Fetches Close CRM opportunity data directly (fast — no pre-processed file deps).
Writes a single bedrock JSON to CCAgentindex/analytics/source_channel_snapshot.json.

Strategy: fetch all opportunities updated in the last N days (~666 for 30-day window),
group by lead, compute source channel + owner + status intelligence, write JSON.
~8–12 seconds total for 666 opps.

Usage:
    python3 "analytics_source_channels.py"           # last 30 days (default)
    python3 "analytics_source_channels.py" --days 60

Requires:
    CLOSE_API_KEY in .env file at repo root  OR  as a shell env var.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not installed. Run: pip install requests --break-system-packages")
    sys.exit(1)

# ─── paths ────────────────────────────────────────────────────────────────────
SCRIPT_DIR  = Path(__file__).resolve().parent
REPO_ROOT   = SCRIPT_DIR.parent
ENV_FILE    = REPO_ROOT / ".env"
OUTPUT_PATH = REPO_ROOT / "CCAgentindex" / "analytics" / "source_channel_snapshot.json"

CLOSE_API_BASE = "https://api.close.com/api/v1"

# ─── Close custom field IDs ───────────────────────────────────────────────────
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
    """Fetch all opportunities updated in the last N days (fast — paginated, ~7 pages for 666 opps)."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%S+00:00")
    fields = f"id,lead_id,lead_name,status_label,status_type,date_updated,date_created,value,user_name,{SOURCE_F},{CTYPE_F}"
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


def list_to_text(v: Any) -> str:
    if isinstance(v, list):
        return " | ".join(str(x).strip() for x in v if str(x).strip())
    return str(v or "").strip()


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


def join_top(counter: Counter, n: int = 3) -> str:
    return " | ".join(f"{k} ({v})" for k, v in counter.most_common(n) if k and v)


def format_pct(n: int, d: int) -> float:
    return round(n / d * 100, 1) if d else 0.0


# ─── builders ─────────────────────────────────────────────────────────────────

def build_lead_profile(lead_id: str, lead_opps: List[Dict]) -> Dict[str, Any]:
    best = max(lead_opps, key=lambda x: x.get("date_updated", ""))
    # source channels — prefer the best opp, fall back to any that has data
    src_raw = list_to_text(best.get(SOURCE_F, ""))
    if not src_raw:
        for o in sorted(lead_opps, key=lambda x: x.get("date_updated", ""), reverse=True):
            src_raw = list_to_text(o.get(SOURCE_F, ""))
            if src_raw:
                break
    sources = [s.strip() for s in src_raw.split("|") if s.strip()] if src_raw else ["unknown"]
    primary = sources[0]
    ctype = list_to_text(best.get(CTYPE_F, ""))
    owner = best.get("user_name", "") or "Unassigned"
    return {
        "lead_id": lead_id,
        "lead_name": best.get("lead_name", "") or "",
        "lead_owner_name": owner,
        "status_label": best.get("status_label", "") or "",
        "status_type": (best.get("status_type", "") or "unknown").lower(),
        "source_channels": src_raw or "unknown",
        "primary_source_channel": primary,
        "primary_source_family": source_family(primary),
        "customer_type": ctype,
        "latest_opp_updated": best.get("date_updated", ""),
        "opp_count": len(lead_opps),
    }


def summarize_source(name: str, rows: List[Dict]) -> Dict[str, Any]:
    st = Counter(r["status_type"] for r in rows)
    own = Counter(r["lead_owner_name"] for r in rows)
    active = [r for r in rows if r["status_type"] not in ("won", "lost")]
    return {
        "source_channel": name,
        "source_family": source_family(name),
        "lead_count": len(rows),
        "active_count": len(active),
        "won_count": st.get("won", 0),
        "lost_count": st.get("lost", 0),
        "win_rate_pct": format_pct(st.get("won", 0), len(rows)),
        "top_owners": join_top(own, 3),
    }


def summarize_owner(name: str, rows: List[Dict]) -> Dict[str, Any]:
    st = Counter(r["status_type"] for r in rows)
    src = Counter(r["primary_source_channel"] for r in rows)
    active = [r for r in rows if r["status_type"] not in ("won", "lost")]
    return {
        "owner_name": name,
        "lead_count": len(rows),
        "active_count": len(active),
        "won_count": st.get("won", 0),
        "lost_count": st.get("lost", 0),
        "win_rate_pct": format_pct(st.get("won", 0), len(rows)),
        "top_sources": join_top(src, 3),
    }


# ─── main ─────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Comeketo Source Channel Intelligence Sweep")
    p.add_argument("--days", type=int, default=30)
    p.add_argument("--output", type=Path, default=OUTPUT_PATH)
    return p.parse_args()


def main() -> int:
    args = parse_args()
    days: int = args.days
    out: Path = args.output
    out.parent.mkdir(parents=True, exist_ok=True)

    print("╔══════════════════════════════════════════════════════════╗")
    print(f"║  Comeketo Source Channel Intelligence · Last {days} days    ║")
    print("╚══════════════════════════════════════════════════════════╝\n")

    api_key = get_api_key()
    print("  API key loaded ✓")

    # 1. Fetch all opportunities in the window
    opps = fetch_all_opps(api_key, days)
    print(f"\n  → {len(opps)} opportunities total")

    if not opps:
        print("  No opportunities found. Exiting.")
        return 0

    # 2. Group by lead
    by_lead: Dict[str, List[Dict]] = defaultdict(list)
    for o in opps:
        by_lead[o.get("lead_id", "")].append(o)

    # 3. Build lead profiles
    print(f"\n  Building profiles for {len(by_lead)} leads…")
    profiles = [build_lead_profile(lid, lopps) for lid, lopps in by_lead.items()]

    # 4. Source channel summaries (multi-attribute)
    src_groups: Dict[str, List[Dict]] = defaultdict(list)
    for p in profiles:
        for s in ([x.strip() for x in p["source_channels"].split("|") if x.strip()]
                  if p["source_channels"] != "unknown" else [p["primary_source_channel"]]):
            src_groups[s].append(p)

    src_summaries = sorted(
        [summarize_source(n, rows) for n, rows in src_groups.items()],
        key=lambda r: (-r["lead_count"], r["source_channel"]),
    )

    # 5. Owner summaries
    owner_groups: Dict[str, List[Dict]] = defaultdict(list)
    for p in profiles:
        owner_groups[p["lead_owner_name"]].append(p)

    owner_summaries = sorted(
        [summarize_owner(n, rows) for n, rows in owner_groups.items()],
        key=lambda r: (-r["lead_count"], r["owner_name"]),
    )

    # 6. Distributions
    status_dist = dict(Counter(p["status_type"] for p in profiles))
    family_dist = dict(Counter(p["primary_source_family"] for p in profiles))

    top_src = src_summaries[0]["source_channel"] if src_summaries else "unknown"
    top_fam = max(family_dist, key=lambda k: family_dist[k]) if family_dist else "unknown"

    summary = (
        f"{len(profiles)} leads · {status_dist.get('won', 0)} won · "
        f"{status_dist.get('lost', 0)} lost · {status_dist.get('active', 0)} active · "
        f"top source: {top_src} · top family: {top_fam}"
    )

    snapshot = {
        "_meta": {
            "schema_version": "1.0",
            "description": "Source channel intelligence — auto-generated from Close CRM opportunity data.",
            "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "window_days": days,
            "lead_count": len(profiles),
            "opportunity_count": len(opps),
        },
        "source_channels": src_summaries,
        "owner_performance": owner_summaries,
        "lead_profiles": profiles,
        "status_distribution": status_dist,
        "source_family_distribution": family_dist,
        "summary_text": summary,
    }

    out.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n✓ Written → {out}")
    print(f"  {summary}")
    print(f"\n  Top sources:")
    for s in src_summaries[:8]:
        print(f"    {s['source_channel']:40s}  leads={s['lead_count']:3d}  won={s['won_count']:3d}  win%={s['win_rate_pct']}%")
    print(f"\n  Owners:")
    for o in owner_summaries:
        print(f"    {o['owner_name']:30s}  leads={o['lead_count']:3d}  won={o['won_count']:3d}  win%={o['win_rate_pct']}%")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

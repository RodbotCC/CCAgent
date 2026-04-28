#!/usr/bin/env python3
"""
analytics_upcoming_events.py
──────────────────────────────
Comeketo Agent — Upcoming Events Registry
Fetches Close CRM opportunity data with event-specific custom fields to build
a forward-looking events calendar for operations and staffing.

All fields come from the opportunity record (same fast fetch as the other
analytics scripts — no separate lead lookups required).

Custom fields read per opportunity:
  event_datetime  cf_FV2xBkviv7BAQZkkjUf8NUOc3fOpPTObMy5lVxZbyiP
  guest_count     cf_nQLULOLLmtUAh9OwcpJibPc5pQKIqpFOjdGSTwC9ePO
  event_type      cf_goMfyKkS7pFUhmo0xvrl1JvQv1KLaQkfoVo0j93dvhe
  venue_type      cf_3LZk8uGw0lIvPpNzOMvFn4WwiCXbI91X66Ujvt8UJPx

Strategy:
  1. Fetch all opportunities updated in the last N days (default 365 — wide
     enough to catch events booked up to a year ago that haven't happened yet).
  2. Group by lead; pick the opportunity with the best event data per lead.
  3. Filter to events where event_datetime >= today.
  4. Optionally cap lookahead (default: 180 days out).
  5. Emit a sorted, normalized events list + type/monthly/owner aggregates.

Output: CCAgentindex/analytics/upcoming_events_snapshot.json

Usage:
    python3 "analytics_upcoming_events.py"             # default: 365 back / 180 forward
    python3 "analytics_upcoming_events.py" --days 180  # shorter lookback
    python3 "analytics_upcoming_events.py" --lookahead 365

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
OUTPUT_PATH = REPO_ROOT / "CCAgentindex" / "analytics" / "upcoming_events_snapshot.json"

CLOSE_API_BASE = "https://api.close.com/api/v1"

# ─── Close custom field IDs (opportunity-level) ───────────────────────────────
EVENT_DT_F   = "custom.cf_FV2xBkviv7BAQZkkjUf8NUOc3fOpPTObMy5lVxZbyiP"  # event_datetime
GUEST_F      = "custom.cf_nQLULOLLmtUAh9OwcpJibPc5pQKIqpFOjdGSTwC9ePO"  # guest_count
ETYPE_F      = "custom.cf_goMfyKkS7pFUhmo0xvrl1JvQv1KLaQkfoVo0j93dvhe"  # event_type
VENUE_F      = "custom.cf_3LZk8uGw0lIvPpNzOMvFn4WwiCXbI91X66Ujvt8UJPx"  # venue_type
SOURCE_F     = "custom.cf_ge7qOebiWpyPvuv7xkzNaYpM8PsmOeNvXasXFOtPXRt"  # source_channel
CTYPE_F      = "custom.cf_fs7mrfN5x0M20CyoltczyVg8t0Xul5GFvkC4FNUKvY6"  # customer_type

# ─── event type normalization ─────────────────────────────────────────────────
EVENT_TYPE_MAP = {
    "wedding":          ["wedding", "casamento", "reception", "weddings"],
    "birthday":         ["birthday", "bday", "50th birthday", "40th birthday", "60th birthday", "sweet 16"],
    "graduation":       ["graduation", "graduation party", "graduate", "college graduation"],
    "baby_shower":      ["baby shower", "baby"],
    "bridal_shower":    ["bridal shower", "bridal"],
    "anniversary":      ["anniversary"],
    "quinceañera":      ["quinceanera", "quinceañera", "quinceaera"],
    "corporate":        ["corporate", "business", "company", "office", "work"],
    "holiday":          ["holiday", "christmas", "new year", "thanksgiving"],
    "memorial":         ["memorial", "funeral", "celebration of life"],
    "other":            [],
}

EVENT_TYPE_COLORS = {
    "wedding":       {"bg": "#F0D6E8", "ink": "#7A2E5A", "dot": "#C0528C", "label": "Wedding"},
    "birthday":      {"bg": "#F8DEC3", "ink": "#7A4A1F", "dot": "#B0712E", "label": "Birthday"},
    "graduation":    {"bg": "#FEF3C7", "ink": "#6B4E0A", "dot": "#D4A017", "label": "Graduation"},
    "baby_shower":   {"bg": "#FCE7F3", "ink": "#831843", "dot": "#EC4899", "label": "Baby Shower"},
    "bridal_shower": {"bg": "#EDE9FE", "ink": "#4C1D95", "dot": "#7C3AED", "label": "Bridal Shower"},
    "anniversary":   {"bg": "#DBEAFE", "ink": "#1E3A5F", "dot": "#3B82F6", "label": "Anniversary"},
    "quinceañera":   {"bg": "#FCE7F3", "ink": "#9D174D", "dot": "#EC4899", "label": "Quinceañera"},
    "corporate":     {"bg": "#C9D6E9", "ink": "#2A3F66", "dot": "#3F5A8E", "label": "Corporate"},
    "holiday":       {"bg": "#D1FAE5", "ink": "#065F46", "dot": "#10B981", "label": "Holiday"},
    "memorial":      {"bg": "#F3F4F6", "ink": "#374151", "dot": "#6B7280", "label": "Memorial"},
    "other":         {"bg": "#F3F4F6", "ink": "#4B5563", "dot": "#9CA3AF", "label": "Other"},
}


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
        except requests.exceptions.RequestException:
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)
    return {}


def fetch_all_opps(api_key: str, days: int) -> List[Dict]:
    """Fetch all opportunities updated in the last N days — wide net for event discovery."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%S+00:00")
    fields = (
        f"id,lead_id,lead_name,status_label,status_type,pipeline_name,"
        f"date_updated,date_created,date_won,value,user_name,"
        f"{EVENT_DT_F},{GUEST_F},{ETYPE_F},{VENUE_F},{SOURCE_F},{CTYPE_F}"
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


def parse_event_dt(raw: Any) -> Optional[datetime]:
    if not raw:
        return None
    try:
        s = str(raw).strip()
        dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None


def normalize_event_type(raw: Any) -> str:
    if not raw:
        return "other"
    text = str(raw).strip().lower()
    for normalized, keywords in EVENT_TYPE_MAP.items():
        if normalized in text:
            return normalized
        for kw in keywords:
            if kw in text:
                return normalized
    return "other"


def list_val(v: Any) -> str:
    """Normalize list or string field to clean string."""
    if isinstance(v, list):
        return " | ".join(str(x).strip() for x in v if str(x).strip())
    return str(v or "").strip()


def safe_int(v: Any) -> int:
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0


def safe_cents(v: Any) -> int:
    try:
        return int(v or 0)
    except (TypeError, ValueError):
        return 0


def fmt_currency(cents: int) -> str:
    if cents <= 0:
        return "$0"
    d = cents / 100
    if d >= 1_000_000:
        return f"${d/1_000_000:.1f}M"
    if d >= 1_000:
        return f"${d/1_000:.1f}k"
    return f"${d:.0f}"


def score_opp_completeness(o: Dict) -> int:
    """Higher = more event data present. Used to pick the best opp per lead."""
    score = 0
    if o.get(EVENT_DT_F):      score += 4
    if o.get(ETYPE_F):         score += 2
    if o.get(GUEST_F):         score += 2
    if o.get(VENUE_F):         score += 1
    if safe_cents(o.get("value")) > 0: score += 1
    return score


# ─── builders ─────────────────────────────────────────────────────────────────

def build_event_record(
    lead_id: str,
    lead_name: str,
    best_opp: Dict,
    all_lead_opps: List[Dict],
    now_utc: datetime,
) -> Optional[Dict[str, Any]]:
    """Build a single event record. Returns None if no valid future event date."""
    event_dt = parse_event_dt(best_opp.get(EVENT_DT_F))
    if event_dt is None:
        return None

    days_until = (event_dt - now_utc).days
    event_type_raw  = str(best_opp.get(ETYPE_F) or "").strip()
    event_type_norm = normalize_event_type(event_type_raw)
    guest_count     = safe_int(best_opp.get(GUEST_F))
    venue_type      = list_val(best_opp.get(VENUE_F))
    owner_name      = best_opp.get("user_name") or "Unassigned"
    status_label    = best_opp.get("status_label") or ""
    status_type     = (best_opp.get("status_type") or "").lower()
    pipeline_name   = best_opp.get("pipeline_name") or ""

    # Aggregate total value across all won opps for this lead
    total_value = sum(safe_cents(o.get("value")) for o in all_lead_opps if (o.get("status_type") or "").lower() == "won")
    if total_value == 0:
        total_value = safe_cents(best_opp.get("value"))

    return {
        "lead_id":          lead_id,
        "lead_name":        lead_name,
        "event_datetime":   event_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "event_date_fmt":   event_dt.strftime("%b %-d, %Y"),
        "event_month_key":  event_dt.strftime("%Y-%m"),
        "event_month_fmt":  event_dt.strftime("%B %Y"),
        "days_until":       days_until,
        "event_type_raw":   event_type_raw,
        "event_type":       event_type_norm,
        "event_type_label": EVENT_TYPE_COLORS.get(event_type_norm, EVENT_TYPE_COLORS["other"])["label"],
        "guest_count":      guest_count,
        "venue_type":       venue_type,
        "owner_name":       owner_name,
        "status_label":     status_label,
        "status_type":      status_type,
        "pipeline_name":    pipeline_name,
        "total_value_cents":total_value,
        "total_value_fmt":  fmt_currency(total_value),
        "opp_count":        len(all_lead_opps),
    }


# ─── main ─────────────────────────────────────────────────────────────────────

def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Comeketo Upcoming Events Registry Sweep")
    p.add_argument("--days",      type=int, default=365, help="Lookback window in days (default 365)")
    p.add_argument("--lookahead", type=int, default=180, help="Max days forward to include events (default 180)")
    p.add_argument("--output",    type=Path, default=OUTPUT_PATH)
    return p.parse_args()


def main() -> int:
    args = parse_args()
    out: Path = args.output
    out.parent.mkdir(parents=True, exist_ok=True)

    print("╔════════════════════════════════════════════════════════════╗")
    print(f"║  Comeketo Upcoming Events Registry · {args.days}d lookback        ║")
    print("╚════════════════════════════════════════════════════════════╝\n")

    api_key = get_api_key()
    print("  API key loaded ✓")

    now_utc     = datetime.now(timezone.utc)
    cutoff_dt   = now_utc + timedelta(days=args.lookahead)

    opps = fetch_all_opps(api_key, args.days)
    print(f"\n  → {len(opps)} opportunities fetched")

    if not opps:
        print("  No opportunities found. Exiting.")
        return 0

    # Group all opps by lead
    by_lead: Dict[str, List[Dict]] = defaultdict(list)
    for o in opps:
        lid = o.get("lead_id") or ""
        if lid:
            by_lead[lid].append(o)

    print(f"  → {len(by_lead)} unique leads")
    print(f"  Filtering for events {now_utc.strftime('%Y-%m-%d')} → {cutoff_dt.strftime('%Y-%m-%d')}…")

    events: List[Dict[str, Any]] = []
    for lead_id, lead_opps in by_lead.items():
        lead_name = (lead_opps[0].get("lead_name") or "").strip()

        # Pick the opp with the best event data quality
        best = max(lead_opps, key=score_opp_completeness)

        rec = build_event_record(lead_id, lead_name, best, lead_opps, now_utc)
        if rec is None:
            continue
        # Only include future events within the lookahead window
        if rec["days_until"] < 0 or rec["days_until"] > args.lookahead:
            continue
        events.append(rec)

    # Sort by event date ascending
    events.sort(key=lambda e: e["event_datetime"])

    # ── Aggregates ──────────────────────────────────────────────────────────
    event_type_dist   = dict(Counter(e["event_type"] for e in events))
    owner_event_dist  = dict(Counter(e["owner_name"] for e in events))

    # Monthly groups
    month_groups: Dict[str, List[Dict]] = defaultdict(list)
    for e in events:
        month_groups[e["event_month_key"]].append(e)

    monthly_schedule = []
    for month_key in sorted(month_groups.keys()):
        month_evts = month_groups[month_key]
        monthly_schedule.append({
            "month_key":   month_key,
            "month_fmt":   month_evts[0]["event_month_fmt"],
            "event_count": len(month_evts),
            "total_guests":sum(e["guest_count"] for e in month_evts),
            "total_value_cents": sum(e["total_value_cents"] for e in month_evts),
            "total_value_fmt":   fmt_currency(sum(e["total_value_cents"] for e in month_evts)),
            "event_types": list(set(e["event_type"] for e in month_evts)),
        })

    total_guests = sum(e["guest_count"] for e in events)
    total_value  = sum(e["total_value_cents"] for e in events)
    next_event   = events[0] if events else None

    summary_text = (
        f"{len(events)} events scheduled · "
        f"{total_guests:,} total guests · "
        f"{fmt_currency(total_value)} booked · "
        f"next: {next_event['lead_name'] if next_event else '—'} in {next_event['days_until']} days"
        if next_event else f"{len(events)} events scheduled"
    )

    snapshot = {
        "_meta": {
            "schema_version": "1.0",
            "description": "Upcoming events registry — auto-generated from Close CRM opportunity event fields.",
            "generated_at": now_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "lookback_days": args.days,
            "lookahead_days": args.lookahead,
            "event_count": len(events),
            "total_guests": total_guests,
            "total_value_cents": total_value,
            "total_value_fmt": fmt_currency(total_value),
        },
        "upcoming_events": events,
        "monthly_schedule": monthly_schedule,
        "event_type_distribution": event_type_dist,
        "event_type_colors": EVENT_TYPE_COLORS,
        "owner_event_distribution": owner_event_dist,
        "summary_text": summary_text,
    }

    out.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n✓ Written → {out}")
    print(f"  {summary_text}")
    print(f"\n  Monthly schedule:")
    for m in monthly_schedule:
        print(f"    {m['month_fmt']:15s}  events={m['event_count']:3d}  guests={m['total_guests']:4d}  value={m['total_value_fmt']:>8s}")
    print(f"\n  Event types:")
    for et, cnt in sorted(event_type_dist.items(), key=lambda x: -x[1]):
        col = EVENT_TYPE_COLORS.get(et, EVENT_TYPE_COLORS["other"])
        print(f"    {col['label']:20s}  {cnt:3d}")
    print(f"\n  Owners:")
    for owner, cnt in sorted(owner_event_dist.items(), key=lambda x: -x[1]):
        print(f"    {owner:30s}  {cnt:3d} events")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())

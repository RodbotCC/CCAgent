# REWRITTEN 2026-04-27: paths rebased on CCAgentindex/people, 30-day rolling window, dual markdown + JSON output for Analytics page consumption.
#!/usr/bin/env python3
"""
build_conversation_intelligence.py

Reads `CCAgentindex/people/*.json` (filtered to kind == "lead"), aggregates the
`comms` arrays inside a rolling N-day window (default 30), and writes:

    CCAgentindex/intelligence/sales/conversation/<YYYY-MM-DD>.md
    CCAgentindex/intelligence/sales/conversation/<YYYY-MM-DD>.json

Both files share the same date stem. The JSON is the canonical structured
payload the Analytics page reads; the markdown is the human-readable narrative.
"""
from __future__ import annotations

import argparse
import json
import statistics
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Anchor to the project root: this script sits at <root>/Onboard Scripts/...
PROJECT_ROOT = Path(__file__).resolve().parent.parent
BEDROCK_ROOT = PROJECT_ROOT / "CCAgentindex"
PEOPLE_DIR = BEDROCK_ROOT / "people"
OUTPUT_DIR = BEDROCK_ROOT / "intelligence" / "sales" / "conversation"

KNOWN_CHANNELS = ("email", "sms", "phone", "call", "calendar", "whatsapp")
KNOWN_DIRECTIONS = ("in", "out")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build conversation intelligence (windowed comms aggregation) for the Analytics page."
    )
    parser.add_argument("--days", type=int, default=30, help="Rolling window in days (default 30)")
    parser.add_argument("--people-dir", type=Path, default=PEOPLE_DIR)
    parser.add_argument("--output-dir", type=Path, default=OUTPUT_DIR)
    return parser.parse_args()


def parse_iso(value: Optional[str]) -> Optional[datetime]:
    """Best-effort ISO 8601 → aware UTC datetime."""
    if not value or not isinstance(value, str):
        return None
    try:
        v = value.strip().replace("Z", "+00:00")
        dt = datetime.fromisoformat(v)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except (ValueError, TypeError):
        return None


def normalize_channel(raw: Optional[str]) -> str:
    c = (raw or "").lower().strip()
    if c in ("phone", "call"):
        return "phone"
    if c in KNOWN_CHANNELS:
        return c
    return "other"


def normalize_direction(raw: Optional[str]) -> str:
    d = (raw or "").lower().strip()
    if d in ("in", "inbound", "incoming"):
        return "in"
    if d in ("out", "outbound", "outgoing"):
        return "out"
    return "out"  # default: assume outbound (most synthesized records are outbound touches)


def load_leads(people_dir: Path) -> List[Dict[str, Any]]:
    leads: List[Dict[str, Any]] = []
    if not people_dir.exists():
        return leads
    for p in sorted(people_dir.glob("*.json")):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        if data.get("kind") == "lead":
            leads.append(data)
    return leads


def lift_synthesized_comm(lead: Dict[str, Any], window_end: datetime) -> Optional[Dict[str, Any]]:
    """Fallback: synthesize one comms entry per lead from `lead.last_activity`
    when the comms[] array is empty. Last-resort to keep the page alive."""
    la = (lead.get("lead") or {}).get("last_activity") or ""
    if not la:
        return None
    # Try to parse a leading YYYY-MM-DD if present.
    for token in la.split():
        d = parse_iso(token)
        if d:
            return {
                "ts": d.isoformat().replace("+00:00", "Z"),
                "channel": "email",
                "direction": "out",
                "summary": la,
            }
    # No date — peg to window_end midnight as a synthetic anchor.
    return {
        "ts": window_end.replace(hour=12, minute=0, second=0, microsecond=0).isoformat().replace("+00:00", "Z"),
        "channel": "email",
        "direction": "out",
        "summary": la,
    }


def collect_events(
    leads: List[Dict[str, Any]],
    window_start: datetime,
    window_end: datetime,
    allow_synthesize: bool = False,
) -> List[Dict[str, Any]]:
    events: List[Dict[str, Any]] = []
    for lead in leads:
        lid = lead.get("id") or "unknown"
        lname = lead.get("name") or lid
        comms = lead.get("comms") or []
        if not comms and allow_synthesize:
            synth = lift_synthesized_comm(lead, window_end)
            if synth:
                comms = [synth]
        for c in comms:
            ts = parse_iso(c.get("ts"))
            if not ts:
                continue
            if ts < window_start or ts > window_end:
                continue
            events.append(
                {
                    "ts": ts,
                    "channel": normalize_channel(c.get("channel")),
                    "direction": normalize_direction(c.get("direction")),
                    "summary": c.get("summary") or "",
                    "lead_id": lid,
                    "lead_name": lname,
                }
            )
    return events


def collect_pre_window_last_ts(leads: List[Dict[str, Any]], window_start: datetime) -> Dict[str, Optional[datetime]]:
    out: Dict[str, Optional[datetime]] = {}
    for lead in leads:
        lid = lead.get("id") or "unknown"
        latest: Optional[datetime] = None
        for c in lead.get("comms") or []:
            ts = parse_iso(c.get("ts"))
            if not ts or ts >= window_start:
                continue
            if latest is None or ts > latest:
                latest = ts
        out[lid] = latest
    return out


def build_timeseries(
    events: List[Dict[str, Any]],
    window_start: datetime,
    window_end: datetime,
    days: int,
) -> List[Dict[str, Any]]:
    """One bucket per day, oldest first — most recent date last."""
    # Anchor to UTC date boundaries.
    start_date = window_start.date()
    series: List[Dict[str, Any]] = []
    by_date: Dict[str, Dict[str, Any]] = {}
    for i in range(days):
        d = start_date + timedelta(days=i)
        key = d.isoformat()
        bucket = {"date": key, "total": 0, "in": 0, "out": 0, "by_channel": {}}
        by_date[key] = bucket
        series.append(bucket)
    for e in events:
        key = e["ts"].date().isoformat()
        bucket = by_date.get(key)
        if not bucket:
            continue
        bucket["total"] += 1
        bucket[e["direction"]] = bucket.get(e["direction"], 0) + 1
        bucket["by_channel"][e["channel"]] = bucket["by_channel"].get(e["channel"], 0) + 1
    return series


def per_lead_activity(events: List[Dict[str, Any]], leads: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    by_lead: Dict[str, Dict[str, Any]] = {}
    for e in events:
        lid = e["lead_id"]
        rec = by_lead.setdefault(
            lid,
            {
                "id": lid,
                "name": e["lead_name"],
                "count": 0,
                "last_ts": None,
                "channels": Counter(),
                "directions": Counter(),
            },
        )
        rec["count"] += 1
        if rec["last_ts"] is None or e["ts"] > rec["last_ts"]:
            rec["last_ts"] = e["ts"]
        rec["channels"][e["channel"]] += 1
        rec["directions"][e["direction"]] += 1

    rows: List[Dict[str, Any]] = []
    for r in by_lead.values():
        rows.append(
            {
                "id": r["id"],
                "name": r["name"],
                "count": r["count"],
                "last_ts": r["last_ts"].isoformat().replace("+00:00", "Z") if r["last_ts"] else None,
                "channels": dict(r["channels"]),
                "directions": dict(r["directions"]),
            }
        )
    rows.sort(key=lambda x: (-x["count"], x["last_ts"] or ""))
    return rows


def silent_leads_block(
    leads: List[Dict[str, Any]],
    active_ids: set,
    pre_window_last: Dict[str, Optional[datetime]],
) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for lead in leads:
        lid = lead.get("id") or "unknown"
        if lid in active_ids:
            continue
        last = pre_window_last.get(lid)
        out.append(
            {
                "id": lid,
                "name": lead.get("name") or lid,
                "last_ts_before_window": last.isoformat().replace("+00:00", "Z") if last else None,
            }
        )
    out.sort(key=lambda x: x["last_ts_before_window"] or "")
    return out


def response_signal(events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """For each inbound→outbound pair on the same lead, with the outbound landing
    within 24h of the inbound, record the delay in hours. Report median, mean, n."""
    by_lead: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for e in events:
        by_lead[e["lead_id"]].append(e)
    delays: List[float] = []
    for lid, items in by_lead.items():
        items_sorted = sorted(items, key=lambda x: x["ts"])
        for i, ev in enumerate(items_sorted):
            if ev["direction"] != "in":
                continue
            # Look forward for the next outbound within 24h.
            for j in range(i + 1, len(items_sorted)):
                nxt = items_sorted[j]
                if nxt["direction"] != "out":
                    continue
                delta = (nxt["ts"] - ev["ts"]).total_seconds() / 3600.0
                if 0 <= delta <= 24:
                    delays.append(delta)
                break
    if not delays:
        return {"median_hours": None, "mean_hours": None, "n_pairs": 0}
    return {
        "median_hours": round(statistics.median(delays), 2),
        "mean_hours": round(statistics.mean(delays), 2),
        "n_pairs": len(delays),
    }


def buckets_block(
    timeseries: List[Dict[str, Any]],
    top_leads: List[Dict[str, Any]],
    by_channel: Dict[str, int],
) -> Dict[str, Any]:
    if timeseries:
        peak = max(timeseries, key=lambda d: d["total"])
        # quietest = min over the window (could be 0)
        quiet = min(timeseries, key=lambda d: d["total"])
    else:
        peak = quiet = {"date": None, "total": 0}
    busiest_lead = top_leads[0]["name"] if top_leads else None
    busiest_channel = None
    if by_channel:
        busiest_channel = sorted(by_channel.items(), key=lambda kv: -kv[1])[0][0]
    return {
        "peak_day": peak.get("date"),
        "peak_count": peak.get("total", 0),
        "quietest_day": quiet.get("date"),
        "busiest_lead": busiest_lead,
        "busiest_channel": busiest_channel,
    }


def fmt_relative(dt: Optional[datetime], now: datetime) -> str:
    if not dt:
        return "—"
    delta = now - dt
    secs = int(delta.total_seconds())
    if secs < 60:
        return f"{secs}s ago"
    if secs < 3600:
        return f"{secs // 60}m ago"
    if secs < 86400:
        return f"{secs // 3600}h ago"
    return f"{secs // 86400}d ago"


def build_markdown(payload: Dict[str, Any], leads: List[Dict[str, Any]], events: List[Dict[str, Any]]) -> str:
    totals = payload["totals"]
    by_channel = payload["by_channel"]
    buckets = payload["buckets"]
    top = payload["top_leads"]
    silent = payload["silent_leads"]
    rs = payload["response_signal"]
    date_stem = payload["generated_at"][:10]
    window_start = payload["window_start"][:10]
    window_end = payload["window_end"][:10]

    lines: List[str] = []
    lines.append(f"# Conversation Intelligence — {date_stem}")
    lines.append("")
    lines.append(f"_Window: {window_start} → {window_end} ({payload['window_days']} days)_")
    lines.append("")

    # Headline
    lines.append("## Headline")
    lines.append("")
    lines.append(
        f"- **{totals['comms']} comms** across **{totals['leads_with_activity']} active leads** "
        f"(of {totals['leads_with_activity'] + totals['silent_leads']} total)."
    )
    lines.append(f"- **{totals['in']} inbound · {totals['out']} outbound** — ratio {payload['ratio']}.")
    lines.append(f"- **Silent leads:** {totals['silent_leads']}.")
    if rs.get("n_pairs"):
        lines.append(
            f"- **Response speed:** median {rs['median_hours']}h · mean {rs['mean_hours']}h "
            f"({rs['n_pairs']} inbound→outbound pairs within 24h)."
        )
    lines.append("")

    # Channel mix
    lines.append("## Channel Mix")
    lines.append("")
    if by_channel:
        for ch, n in sorted(by_channel.items(), key=lambda kv: -kv[1]):
            lines.append(f"- **{ch}**: `{n}`")
    else:
        lines.append("- (no channels active)")
    lines.append("")

    # Daily Pulse
    lines.append("## Daily Pulse")
    lines.append("")
    lines.append("Daily totals across the window (oldest → most recent):")
    lines.append("")
    last_n = payload["timeseries"][-min(14, len(payload["timeseries"])) :]
    for d in last_n:
        bar = "█" * d["total"] if d["total"] else "·"
        lines.append(f"- `{d['date']}` {bar} {d['total']}")
    lines.append("")

    # Most Active Leads
    lines.append("## Most Active Leads")
    lines.append("")
    if top:
        for r in top[:10]:
            ch_summary = " / ".join(f"{k}:{v}" for k, v in sorted(r["channels"].items(), key=lambda kv: -kv[1]))
            lines.append(
                f"- **{r['name']}** — `{r['count']}` comms · last `{r['last_ts'] or '—'}` · {ch_summary}"
            )
    else:
        lines.append("- (no activity inside the window)")
    lines.append("")

    # Silent Leads
    lines.append("## Silent Leads")
    lines.append("")
    if silent:
        for s in silent[:20]:
            lines.append(f"- **{s['name']}** — last touched `{s['last_ts_before_window'] or 'never'}`")
        if len(silent) > 20:
            lines.append(f"- _…and {len(silent) - 20} more_")
    else:
        lines.append("- (none — every lead saw activity in the window)")
    lines.append("")

    # Response patterns
    lines.append("## Response Patterns")
    lines.append("")
    if rs.get("n_pairs"):
        lines.append(
            f"- {rs['n_pairs']} inbound→outbound pairs landed within 24h. "
            f"Median delay **{rs['median_hours']}h** · mean **{rs['mean_hours']}h**."
        )
    else:
        lines.append("- No inbound→outbound pairs detected within 24h in this window.")
    lines.append("")

    # Observations (bold-prefixed bullets — IdeasTray-extractable)
    lines.append("## Observations")
    lines.append("")
    obs: List[str] = []
    if buckets.get("peak_day"):
        obs.append(
            f"**Peak day:** `{buckets['peak_day']}` carried `{buckets['peak_count']}` comms — "
            f"{'meaningful spike' if buckets['peak_count'] >= 5 else 'modest pulse'}."
        )
    if buckets.get("busiest_channel"):
        obs.append(
            f"**Channel center of gravity:** `{buckets['busiest_channel']}` "
            f"(`{by_channel.get(buckets['busiest_channel'], 0)}` comms)."
        )
    if buckets.get("busiest_lead"):
        obs.append(f"**Busiest lead:** {buckets['busiest_lead']} — most touches in the window.")
    if totals["silent_leads"] >= max(3, totals["leads_with_activity"] // 2):
        obs.append(
            f"**Silent share:** {totals['silent_leads']} leads had zero comms in the window — "
            "consider a nurture pulse."
        )
    if rs.get("n_pairs", 0) and rs["median_hours"] is not None and rs["median_hours"] > 6:
        obs.append(
            f"**Response latency:** median `{rs['median_hours']}h` — slower than ideal; "
            "prioritize same-day on inbound."
        )
    if not obs:
        obs.append("**Quiet window:** activity is below the threshold for narrative observations.")
    for o in obs:
        lines.append(f"- {o}")
    lines.append("")

    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    output_dir: Path = args.output_dir
    output_dir.mkdir(parents=True, exist_ok=True)

    now = datetime.now(timezone.utc)
    window_end = now
    window_start = window_end - timedelta(days=args.days)

    leads = load_leads(args.people_dir)
    events = collect_events(leads, window_start, window_end, allow_synthesize=False)

    # If we got nothing AND days==30, retry with a wider window (90 days).
    effective_days = args.days
    auto_widened = False
    if not events and args.days == 30:
        effective_days = 90
        window_start = window_end - timedelta(days=effective_days)
        events = collect_events(leads, window_start, window_end, allow_synthesize=False)
        auto_widened = True

    # Last resort: synthesize one comm per lead from lead.last_activity.
    synthesized = False
    if not events:
        events = collect_events(leads, window_start, window_end, allow_synthesize=True)
        synthesized = True

    pre_window_last = collect_pre_window_last_ts(leads, window_start)

    # Aggregations
    by_channel: Dict[str, int] = dict(Counter(e["channel"] for e in events))
    by_direction: Dict[str, int] = dict(Counter(e["direction"] for e in events))
    timeseries = build_timeseries(events, window_start, window_end, effective_days)
    top_leads = per_lead_activity(events, leads)
    active_ids = {e["lead_id"] for e in events}
    silent = silent_leads_block(leads, active_ids, pre_window_last)
    rs = response_signal(events)
    buckets = buckets_block(timeseries, top_leads, by_channel)

    in_n = by_direction.get("in", 0)
    out_n = by_direction.get("out", 0)
    ratio = "—" if in_n == 0 and out_n == 0 else (
        f"{in_n}:{out_n}" if in_n and out_n else (f"0:{out_n}" if in_n == 0 else f"{in_n}:0")
    )

    payload: Dict[str, Any] = {
        "generated_at": now.isoformat().replace("+00:00", "Z"),
        "window_days": effective_days,
        "window_start": window_start.isoformat().replace("+00:00", "Z"),
        "window_end": window_end.isoformat().replace("+00:00", "Z"),
        "auto_widened": auto_widened,
        "synthesized_from_last_activity": synthesized,
        "totals": {
            "comms": len(events),
            "in": in_n,
            "out": out_n,
            "leads_with_activity": len(active_ids),
            "silent_leads": len(silent),
        },
        "by_channel": by_channel,
        "by_direction": by_direction,
        "ratio": ratio,
        "timeseries": timeseries,
        "top_leads": top_leads[:10],
        "silent_leads": silent,
        "response_signal": rs,
        "buckets": buckets,
    }

    date_stem = now.date().isoformat()
    json_path = output_dir / f"{date_stem}.json"
    md_path = output_dir / f"{date_stem}.md"

    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    md_path.write_text(build_markdown(payload, leads, events), encoding="utf-8")

    print(
        json.dumps(
            {
                "ok": True,
                "leads_scanned": len(leads),
                "events_in_window": len(events),
                "window_days": effective_days,
                "auto_widened": auto_widened,
                "synthesized": synthesized,
                "json_path": str(json_path),
                "md_path": str(md_path),
                "totals": payload["totals"],
                "buckets": payload["buckets"],
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

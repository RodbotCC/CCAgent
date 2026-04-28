#!/usr/bin/env python3
# REWRITTEN 2026-04-27: paths updated for CCAgent post-trim.
# Reads CCAgentindex/people/*.json (kind=lead) instead of legacy CSV briefs.
# Writes dated markdown into CCAgentindex/intelligence/sales/owner_stage/.
from __future__ import annotations

import argparse
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple


# Resolve project paths relative to this script so the rewrite works regardless of cwd.
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent  # "/Users/jakeaaron/Downloads/CC Agent"
BEDROCK_ROOT = PROJECT_ROOT / "CCAgentindex"
DEFAULT_PEOPLE_DIR = BEDROCK_ROOT / "people"
DEFAULT_OUTPUT_DIR = BEDROCK_ROOT / "intelligence" / "sales" / "owner_stage"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build owner and stage dashboards from CCAgent bedrock leads (kind=lead)."
    )
    parser.add_argument("--people-dir", type=Path, default=DEFAULT_PEOPLE_DIR)
    parser.add_argument("--output-dir", type=Path, default=DEFAULT_OUTPUT_DIR)
    parser.add_argument(
        "--snapshot-stamp",
        default=None,
        help="Override the YYYY-MM-DD stamp used in output filenames.",
    )
    return parser.parse_args()


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def slugify(value: Optional[str], fallback: str = "unknown") -> str:
    text = (value or "").strip().lower()
    if not text:
        return fallback
    text = text.replace("&", " and ")
    text = re.sub(r"[^a-z0-9]+", "_", text)
    text = re.sub(r"_+", "_", text).strip("_")
    return text[:100] or fallback


def clean_label(value: Optional[str], fallback: str) -> str:
    text = (value or "").strip()
    return text or fallback


def load_lead_records(people_dir: Path) -> List[Dict[str, Any]]:
    """Load every people/*.json with kind == 'lead' and project to a uniform brief shape."""
    rows: List[Dict[str, Any]] = []
    for path in sorted(people_dir.glob("*.json")):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if (payload.get("kind") or "").lower() != "lead":
            continue
        lead_block = payload.get("lead") or {}

        # status_type maps the legacy "active/won/lost/lead_only" categorization
        status = (lead_block.get("status") or payload.get("relationship_tier") or "").lower()
        if status in {"won", "booked", "confirmed_booking"}:
            stage_type = "won"
        elif status in {"lost", "closed_lost", "dead"}:
            stage_type = "lost"
        elif status in {"active_quote", "active", "in_progress", "qualifying", "negotiating"}:
            stage_type = "active"
        else:
            stage_type = "lead_only"

        rows.append(
            {
                "lead_id": payload.get("id") or path.stem,
                "lead_name": payload.get("name") or path.stem,
                "lead_owner_name": clean_label(lead_block.get("owner"), "Unassigned"),
                "lead_status_label": clean_label(lead_block.get("status"), "Unstaged"),
                "pipeline_name": clean_label(lead_block.get("pipeline"), "Comeketo Sales"),
                "stage_label": clean_label(lead_block.get("stage"), lead_block.get("status") or "Unstaged"),
                "stage_type": stage_type,
                "engagement_state": clean_label(lead_block.get("speed_urgency"), ""),
                "suggested_next_move": clean_label(lead_block.get("next_move"), ""),
                "latest_observed_activity_utc": clean_label(lead_block.get("last_activity"), ""),
                "event_type": clean_label(lead_block.get("event_type"), ""),
                "event_date": clean_label(lead_block.get("event_date"), ""),
                "guest_count": lead_block.get("guest_count") or "",
                "venue": clean_label(lead_block.get("venue"), ""),
                "quote_value": lead_block.get("quote_value") or "",
                "source_record_path": str(path),
            }
        )
    return rows


def write_jsonl(path: Path, rows: Iterable[Dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, ensure_ascii=False))
            handle.write("\n")


def summarize_owner_markdown(owner_name: str, owner_rows: List[Dict[str, Any]], stage_counts: Counter) -> str:
    latest_activity = owner_rows[0].get("latest_observed_activity_utc") if owner_rows else ""
    type_counts = Counter(row.get("stage_type") or "" for row in owner_rows)
    lines = [
        f"# Owner Dashboard: {owner_name}",
        "",
        "## Snapshot",
        f"- Leads: `{len(owner_rows)}`",
        f"- Active Opportunity Leads: `{type_counts.get('active', 0)}`",
        f"- Won Opportunity Leads: `{type_counts.get('won', 0)}`",
        f"- Lost Opportunity Leads: `{type_counts.get('lost', 0)}`",
        f"- Lead-only / Unstaged: `{type_counts.get('lead_only', 0)}`",
        f"- Latest Observed Activity: `{latest_activity or ''}`",
        "",
        "## Stage Breakdown",
    ]
    for label, count in stage_counts.most_common(20):
        lines.append(f"- {label}: {count}")
    lines.extend(["", "## Leads"])
    for row in owner_rows[:50]:
        lines.append(
            f"- `{row.get('latest_observed_activity_utc') or ''}` | {row.get('lead_name') or ''} | "
            f"{row.get('pipeline_name') or ''} / {row.get('stage_label') or ''} | "
            f"{row.get('engagement_state') or ''} | {row.get('suggested_next_move') or ''}"
        )
    lines.append("")
    return "\n".join(lines)


def summarize_stage_markdown(stage_title: str, rows: List[Dict[str, Any]], owner_counts: Counter) -> str:
    latest_activity = rows[0].get("latest_observed_activity_utc") if rows else ""
    lines = [
        f"# Stage Dashboard: {stage_title}",
        "",
        "## Snapshot",
        f"- Leads: `{len(rows)}`",
        f"- Owners Represented: `{len(owner_counts)}`",
        f"- Latest Observed Activity: `{latest_activity or ''}`",
        "",
        "## Owner Breakdown",
    ]
    for owner, count in owner_counts.most_common(20):
        lines.append(f"- {owner}: {count}")
    lines.extend(["", "## Leads"])
    for row in rows[:60]:
        lines.append(
            f"- `{row.get('latest_observed_activity_utc') or ''}` | {row.get('lead_name') or ''} | "
            f"{row.get('lead_owner_name') or ''} | {row.get('engagement_state') or ''} | "
            f"{row.get('suggested_next_move') or ''}"
        )
    lines.append("")
    return "\n".join(lines)


def summarize_owner_overview(owner_rows: List[Dict[str, Any]]) -> str:
    lines = ["# Owner Overview", "", "## Owners"]
    for row in owner_rows:
        lines.append(
            f"- {row.get('owner_name') or ''}: {row.get('lead_count') or 0} leads | "
            f"active {row.get('active_lead_count') or 0} | won {row.get('won_lead_count') or 0} | "
            f"lost {row.get('lost_lead_count') or 0} | lead-only {row.get('lead_only_count') or 0}"
        )
    lines.append("")
    return "\n".join(lines)


def summarize_stage_overview(stage_rows: List[Dict[str, Any]]) -> str:
    lines = ["# Stage Overview", "", "## Current Stages"]
    for row in stage_rows:
        lines.append(
            f"- {row.get('pipeline_name') or ''} / {row.get('stage_label') or ''}: "
            f"{row.get('lead_count') or 0} leads across {row.get('owner_count') or 0} owners"
        )
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    output_dir = args.output_dir
    ensure_dir(output_dir)
    snapshot_stamp = args.snapshot_stamp or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    run_dir = output_dir / snapshot_stamp
    by_owner_dir = run_dir / "by_owner"
    by_stage_dir = run_dir / "by_stage"
    ensure_dir(run_dir)
    ensure_dir(by_owner_dir)
    ensure_dir(by_stage_dir)

    enriched_rows = load_lead_records(args.people_dir)

    owner_groups: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    stage_groups: Dict[Tuple[str, str, str], List[Dict[str, Any]]] = defaultdict(list)

    for brief in enriched_rows:
        owner_groups[brief["lead_owner_name"]].append(brief)
        stage_groups[(brief["pipeline_name"], brief["stage_type"], brief["stage_label"])].append(brief)

    for rows in owner_groups.values():
        rows.sort(key=lambda row: row.get("latest_observed_activity_utc") or "", reverse=True)
    for rows in stage_groups.values():
        rows.sort(key=lambda row: row.get("latest_observed_activity_utc") or "", reverse=True)

    owner_summary_rows: List[Dict[str, Any]] = []
    stage_summary_rows: List[Dict[str, Any]] = []
    owner_stage_matrix_rows: List[Dict[str, Any]] = []

    for owner_name, rows in sorted(owner_groups.items(), key=lambda item: (-len(item[1]), item[0].lower())):
        owner_slug = slugify(owner_name)
        owner_dir = by_owner_dir / owner_slug
        ensure_dir(owner_dir)

        stage_counts = Counter(f"{row['pipeline_name']} / {row['stage_label']}" for row in rows)
        type_counts = Counter(row["stage_type"] for row in rows)
        latest_activity = rows[0].get("latest_observed_activity_utc") if rows else ""

        for stage_label, count in stage_counts.items():
            pipeline_name, stage_name = stage_label.split(" / ", 1)
            owner_stage_matrix_rows.append(
                {
                    "owner_name": owner_name,
                    "pipeline_name": pipeline_name,
                    "stage_label": stage_name,
                    "lead_count": count,
                }
            )

        owner_dashboard_path = owner_dir / "dashboard.md"
        write_jsonl(owner_dir / "lead_briefs.jsonl", rows)
        owner_dashboard_path.write_text(summarize_owner_markdown(owner_name, rows, stage_counts), encoding="utf-8")

        owner_summary_rows.append(
            {
                "owner_name": owner_name,
                "lead_count": len(rows),
                "active_lead_count": type_counts.get("active", 0),
                "won_lead_count": type_counts.get("won", 0),
                "lost_lead_count": type_counts.get("lost", 0),
                "lead_only_count": type_counts.get("lead_only", 0),
                "latest_observed_activity_utc": latest_activity,
                "dashboard_path": str(owner_dashboard_path),
            }
        )

    for (pipeline_name, stage_type, stage_label), rows in sorted(
        stage_groups.items(),
        key=lambda item: (-len(item[1]), item[0][0].lower(), item[0][2].lower()),
    ):
        pipeline_slug = slugify(pipeline_name)
        stage_slug = f"{stage_type}__{slugify(stage_label)}"
        stage_dir = by_stage_dir / pipeline_slug / stage_slug
        ensure_dir(stage_dir)

        owner_counts = Counter(row["lead_owner_name"] for row in rows)
        latest_activity = rows[0].get("latest_observed_activity_utc") if rows else ""
        stage_title = f"{pipeline_name} / {stage_label} ({stage_type})"
        stage_dashboard_path = stage_dir / "dashboard.md"

        write_jsonl(stage_dir / "lead_briefs.jsonl", rows)
        stage_dashboard_path.write_text(summarize_stage_markdown(stage_title, rows, owner_counts), encoding="utf-8")

        stage_summary_rows.append(
            {
                "pipeline_name": pipeline_name,
                "stage_label": stage_label,
                "stage_type": stage_type,
                "lead_count": len(rows),
                "owner_count": len(owner_counts),
                "latest_observed_activity_utc": latest_activity,
                "dashboard_path": str(stage_dashboard_path),
            }
        )

    owner_summary_rows.sort(key=lambda row: row["lead_count"], reverse=True)
    stage_summary_rows.sort(key=lambda row: row["lead_count"], reverse=True)
    owner_stage_matrix_rows.sort(key=lambda row: (row["owner_name"], row["pipeline_name"], row["stage_label"]))

    write_jsonl(run_dir / "owner_dashboard_summary.jsonl", owner_summary_rows)
    write_jsonl(run_dir / "stage_dashboard_summary.jsonl", stage_summary_rows)
    write_jsonl(run_dir / "owner_stage_matrix.jsonl", owner_stage_matrix_rows)

    (run_dir / "owner_overview.md").write_text(summarize_owner_overview(owner_summary_rows), encoding="utf-8")
    (run_dir / "stage_overview.md").write_text(summarize_stage_overview(stage_summary_rows), encoding="utf-8")

    # Top-level dated snapshot — a flat single-file summary the UI can read.
    snapshot_path = output_dir / f"{snapshot_stamp}.md"
    snapshot_lines = [
        f"# Owner & Stage Dashboards — {snapshot_stamp}",
        "",
        f"- Leads scanned: `{len(enriched_rows)}`",
        f"- Owner dashboards: `{len(owner_summary_rows)}`",
        f"- Stage dashboards: `{len(stage_summary_rows)}`",
        f"- Run directory: `{run_dir}`",
        "",
        "## Owner Overview",
    ]
    for row in owner_summary_rows:
        snapshot_lines.append(
            f"- {row['owner_name']}: {row['lead_count']} leads "
            f"(active {row['active_lead_count']} / won {row['won_lead_count']} / "
            f"lost {row['lost_lead_count']} / lead-only {row['lead_only_count']})"
        )
    snapshot_lines.extend(["", "## Stage Overview"])
    for row in stage_summary_rows:
        snapshot_lines.append(
            f"- {row['pipeline_name']} / {row['stage_label']} ({row['stage_type']}): "
            f"{row['lead_count']} leads across {row['owner_count']} owners"
        )
    snapshot_lines.append("")
    snapshot_path.write_text("\n".join(snapshot_lines), encoding="utf-8")

    print(
        json.dumps(
            {
                "snapshot_stamp": snapshot_stamp,
                "leads_scanned": len(enriched_rows),
                "owner_dashboards": len(owner_summary_rows),
                "stage_dashboards": len(stage_summary_rows),
                "snapshot_path": str(snapshot_path),
                "run_dir": str(run_dir),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

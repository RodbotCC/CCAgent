#!/usr/bin/env bash
# Comeketo Agent — Snapshot Runner
# Per LEDGERS/DEPRECATION.md §7
#
# Usage:
#   ./LEDGERS/scripts/snapshot.sh daily
#   ./LEDGERS/scripts/snapshot.sh weekly
#   ./LEDGERS/scripts/snapshot.sh monthly
#   ./LEDGERS/scripts/snapshot.sh manual "<reason-slug>"
#
# Phase A: manual invocation only. Phase C: daily cron / launchd.

set -euo pipefail

CADENCE="${1:-}"
REASON_SLUG="${2:-}"

if [[ -z "$CADENCE" ]]; then
  echo "Usage: $0 <daily|weekly|monthly|manual> [reason-slug]" >&2
  exit 1
fi

# --- Paths ---------------------------------------------------------------------
# Auto-detect project root: this script lives at <PROJECT_ROOT>/LEDGERS/scripts/snapshot.sh
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SNAPSHOT_ROOT="$PROJECT_ROOT/_snapshots"
ACTIVITY_LEDGER="$PROJECT_ROOT/CCAgentindex/_ledger/activity.jsonl"

cd "$PROJECT_ROOT"

# --- Cadence-specific setup ----------------------------------------------------
TIMESTAMP="$(date +%Y-%m-%d_%H%M)"
DATE_ONLY="$(date +%Y-%m-%d)"

case "$CADENCE" in
  daily)
    SNAPSHOT_DIR="$SNAPSHOT_ROOT/daily"
    SNAPSHOT_NAME="snapshot_${TIMESTAMP}_daily"
    RETENTION=7
    INCLUDE_RAW_COMMS=false
    INCLUDE_AGENT_RECEIPTS=false
    ;;
  weekly)
    SNAPSHOT_DIR="$SNAPSHOT_ROOT/weekly"
    SNAPSHOT_NAME="snapshot_${TIMESTAMP}_weekly"
    RETENTION=4
    INCLUDE_RAW_COMMS=true
    INCLUDE_AGENT_RECEIPTS=false
    ;;
  monthly)
    SNAPSHOT_DIR="$SNAPSHOT_ROOT/monthly"
    SNAPSHOT_NAME="snapshot_${TIMESTAMP}_monthly"
    RETENTION=12
    INCLUDE_RAW_COMMS=true
    INCLUDE_AGENT_RECEIPTS=true
    ;;
  manual)
    if [[ -z "$REASON_SLUG" ]]; then
      echo "manual snapshot requires a reason-slug argument" >&2
      exit 1
    fi
    SNAPSHOT_DIR="$SNAPSHOT_ROOT/manual"
    SNAPSHOT_NAME="snapshot_${TIMESTAMP}_manual_${REASON_SLUG}"
    RETENTION=0  # manual snapshots are not auto-pruned
    INCLUDE_RAW_COMMS=true
    INCLUDE_AGENT_RECEIPTS=true
    ;;
  *)
    echo "Unknown cadence: $CADENCE (must be daily | weekly | monthly | manual)" >&2
    exit 1
    ;;
esac

mkdir -p "$SNAPSHOT_DIR"
ZIP_PATH="$SNAPSHOT_DIR/${SNAPSHOT_NAME}.zip"

# --- Build the include list ----------------------------------------------------
# Skeleton — captured by every cadence.
INCLUDES=(
  "LEDGERS"
  "CLAUDE.md"
  "page_asset_sitemap.md"
  "CCAgentindex/_ledger"
  "CCAgentindex/indexes"
  "CCAgentindex/people"
  "CCAgentindex/venues"
  "CCAgentindex/agents"
  "Auto/Client Boxes"
  "Auto/Staff Boxes"
  "Auto/orchestrator/state"
  "Auto/comeketo-inbox"
  "Subagent Boxes"
  "Ledger Drafts"
)

# --- Build the exclude list ----------------------------------------------------
EXCLUDES=(
  "*/node_modules/*"
  "*/__pycache__/*"
  "*/.git/*"
  "*/_snapshots/*"
  "*/outputs/*"
  "*.pyc"
  "*.DS_Store"
)

# Cadence-specific exclusions
if ! $INCLUDE_RAW_COMMS; then
  # Daily snapshots skip raw comms payloads (large, low-change)
  EXCLUDES+=("*/Auto/Client Boxes/*/comms/*")
fi

if ! $INCLUDE_AGENT_RECEIPTS; then
  # Daily + weekly skip per-run agent receipts
  EXCLUDES+=("*/CCAgentindex/agents/*/receipts/*")
fi

# --- Resolve which include paths actually exist -------------------------------
EXISTING_INCLUDES=()
for path in "${INCLUDES[@]}"; do
  if [[ -e "$path" ]]; then
    EXISTING_INCLUDES+=("$path")
  else
    echo "  [skip] $path (not found)" >&2
  fi
done

if [[ ${#EXISTING_INCLUDES[@]} -eq 0 ]]; then
  echo "No valid include paths found — aborting." >&2
  exit 1
fi

# --- Build the zip -------------------------------------------------------------
echo "Building snapshot: $ZIP_PATH"
echo "Cadence: $CADENCE"
echo "Includes: ${#EXISTING_INCLUDES[@]} paths"
echo "Excludes: ${#EXCLUDES[@]} patterns"

# Build zip exclude args
ZIP_EXCLUDE_ARGS=()
for ex in "${EXCLUDES[@]}"; do
  ZIP_EXCLUDE_ARGS+=("-x" "$ex")
done

# Run zip — quiet, recursive, capture errors
zip -qr "$ZIP_PATH" "${EXISTING_INCLUDES[@]}" "${ZIP_EXCLUDE_ARGS[@]}"

ZIP_SIZE=$(du -h "$ZIP_PATH" | cut -f1)
echo "Snapshot complete: $ZIP_PATH ($ZIP_SIZE)"

# --- Prune older snapshots per retention --------------------------------------
if [[ "$RETENTION" -gt 0 ]]; then
  PRUNE_COUNT=$(ls -1 "$SNAPSHOT_DIR"/*.zip 2>/dev/null | wc -l | tr -d ' ')
  if [[ "$PRUNE_COUNT" -gt "$RETENTION" ]]; then
    TO_PRUNE=$((PRUNE_COUNT - RETENTION))
    echo "Pruning $TO_PRUNE old snapshots (keep $RETENTION newest)"
    ls -1t "$SNAPSHOT_DIR"/*.zip | tail -n "+$((RETENTION + 1))" | while read -r old_zip; do
      echo "  [prune] $old_zip"
      rm -f "$old_zip"
    done
  fi
fi

# --- Append to activity ledger -------------------------------------------------
ACTIVITY_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
ACTIVITY_LINE=$(cat <<EOF
{"ts":"$ACTIVITY_TS","kind":"snapshot_taken","actor":"snapshot.sh","cadence":"$CADENCE","snapshot_id":"$SNAPSHOT_NAME","snapshot_path":"$ZIP_PATH","size":"$ZIP_SIZE","notes":"Snapshot per LEDGERS/DEPRECATION.md §7"}
EOF
)

if [[ -f "$ACTIVITY_LEDGER" ]]; then
  echo "$ACTIVITY_LINE" >> "$ACTIVITY_LEDGER"
  echo "Activity logged."
else
  echo "Warning: activity ledger not found at $ACTIVITY_LEDGER — entry not recorded." >&2
fi

echo ""
echo "Snapshot ID: $SNAPSHOT_NAME"
echo "Reference this in any DEPRECATION.md entry that points at content captured here."

/* Comeketo Agent — Automation Graph (Phase 5, Sessions 1 + 2).

   Visual workflow composer. Output is executable JSON (not a live runtime).
   The canvas is a local dark surface inset into the light-mode app, using
   orthogonal Manhattan routing and a 5-shape node taxonomy.

   Session 1: visual scaffold, 5 shapes, demo workflow, library click-to-add,
   inspector read+edit+notes, Rodbot rail stub, JSON export.
   Session 2: drag-to-move, drag-to-connect, undo/redo, real Rodbot via
   window.SecretaryAI (keyword fast-path + LLM fallback).
   Still deferred: drag-from-library, multi-select marquee, disk persistence
   beyond fire-and-forget /api/workflows/save.
*/

const {
  useState: ag_useState, useEffect: ag_useEffect, useRef: ag_useRef,
  useMemo: ag_useMemo, useCallback: ag_useCallback,
} = React;

// ═══════════════════════════════════════════════════════════════════════════
// Node taxonomy — shape dimensions (all centered at 0,0 in local coords)
// ═══════════════════════════════════════════════════════════════════════════
const NODE_DIMS = {
  actor:     { w: 80,  h: 64, shape: "capsule" },
  trigger:   { w: 72,  h: 72, shape: "diamond" },
  transform: { w: 88,  h: 64, shape: "hexagon" },
  sink:      { w: 120, h: 60, shape: "rounded" },
  state:     { w: 88,  h: 64, shape: "stacked" },
};

// Right-edge (source) and left-edge (target) endpoint offsets for each role.
function endpointOffsets(role) {
  const d = NODE_DIMS[role] || NODE_DIMS.actor;
  return { dx: d.w / 2, dy: 0 };
}

// ───────────────────────────────────────────────────────────────────────────
// Text-overflow hygiene (Apr 2026, "no janky overflow" pass)
// SVG <text> doesn't wrap or ellipsis natively. We truncate any node label
// that would exceed its container width and let a native browser tooltip
// (<title>) carry the full string. Char-width estimates assume the body
// font at the rendered size; conservative numbers because variable-width
// glyphs sometimes outsize the average.
// ───────────────────────────────────────────────────────────────────────────
const NODE_LABEL_CHAR_LIMITS = {
  // shape-aware caps. trigger is the tightest because the diamond narrows
  // toward its edges and label sits at y=14 where the shape is widest.
  actor:     11,  // capsule 80px
  trigger:   9,   // diamond 72px (narrowed by shape)
  transform: 12,  // hexagon 88px
  sink:      16,  // rounded 120px
  state:     12,  // stacked 88px
};
function agTruncateLabel(label, role, maxOverride) {
  const limit = maxOverride ?? NODE_LABEL_CHAR_LIMITS[role] ?? 12;
  const s = String(label || "");
  if (s.length <= limit) return s;
  return s.slice(0, Math.max(1, limit - 1)) + "…";
}
// Generic truncation for arbitrary SVG text (non-node).
function agTruncate(s, n) {
  const str = String(s || "");
  return str.length <= n ? str : str.slice(0, Math.max(1, n - 1)) + "…";
}

// ═══════════════════════════════════════════════════════════════════════════
// Library — 5 sections of node templates
// ═══════════════════════════════════════════════════════════════════════════
const LIBRARY = [
  { role: "actor", title: "Actors", items: [
    { kind: "rodbot",      label: "Rodbot",          sub: "AI agent",           glyph: "◉" },
    { kind: "human",       label: "Human operator",  sub: "manual step",        glyph: "◐" },
    { kind: "andre",       label: "Salesperson",     sub: "people/*.json",      glyph: "▲" },
    { kind: "sub_agent",   label: "Sub-agent",       sub: "delegated claude",   glyph: "◎" },
    { kind: "customer",    label: "Customer",        sub: "buyer-side actor",   glyph: "♛" },
    { kind: "external_api",label: "External API",    sub: "third-party service",glyph: "⧉" },
  ]},
  { role: "trigger", title: "Triggers", items: [
    { kind: "cron",       label: "Cron schedule",  sub: "time-based",       glyph: "⧗" },
    { kind: "webhook",    label: "Webhook",        sub: "inbound http",     glyph: "⌁" },
    { kind: "mcp_event",  label: "MCP event",      sub: "connector",        glyph: "◈" },
    { kind: "manual",     label: "Manual",         sub: "user action",      glyph: "✦" },
    { kind: "interval",   label: "Interval",       sub: "every N seconds",  glyph: "↻" },
    { kind: "file_watch", label: "File watcher",   sub: "bedrock change",   glyph: "⌥" },
  ]},
  { role: "transform", title: "Transforms", items: [
    { kind: "llm_call", label: "LLM call",      sub: "claude / openai",    glyph: "✺" },
    { kind: "filter",   label: "Filter",        sub: "condition gate",     glyph: "▽" },
    { kind: "reflect",  label: "Reflection",    sub: "structured json",    glyph: "◯" },
    { kind: "score",    label: "Score",         sub: "priority rank",      glyph: "☆" },
    { kind: "format",   label: "Format",        sub: "template render",    glyph: "§" },
    { kind: "extract",  label: "Extract",       sub: "pull fields from text", glyph: "⎔" },
    { kind: "merge",    label: "Merge",         sub: "combine streams",    glyph: "⋈" },
    { kind: "sort",     label: "Sort",          sub: "reorder items",      glyph: "↕" },
  ]},
  { role: "sink", title: "Sinks", items: [
    { kind: "slack_post",  label: "Slack post",       sub: "#channel",         glyph: "#" },
    { kind: "email_send",  label: "Email send",       sub: "via gmail",        glyph: "✉" },
    { kind: "sms_send",    label: "SMS / WhatsApp",   sub: "twilio",           glyph: "⌨" },
    { kind: "grid_render", label: "Grid render",      sub: "ui view",          glyph: "▤" },
    { kind: "file_write",  label: "File write",       sub: "bedrock json",     glyph: "↓" },
    { kind: "webhook_out", label: "Webhook out",      sub: "outbound http",    glyph: "⇥" },
    { kind: "dashboard",   label: "Dashboard",        sub: "analytics panel",  glyph: "▨" },
  ]},
  { role: "state", title: "State Stores", items: [
    { kind: "inbox",        label: "Inbox",        sub: "_inbox/",      glyph: "▣" },
    { kind: "ledger",       label: "Activity",     sub: "_ledger/",     glyph: "≡" },
    { kind: "memory",       label: "Memory",       sub: "rodbot mem",   glyph: "◉" },
    { kind: "people",       label: "People DB",    sub: "people/*",     glyph: "▦" },
    { kind: "threads",      label: "Threads",      sub: "threads/*",    glyph: "╎" },
    { kind: "cache",        label: "Cache",        sub: "ephemeral kv", glyph: "⊡" },
    { kind: "vector_index", label: "Vector index", sub: "embeddings",   glyph: "⋮" },
  ]},
];

// Flat map from kind → template.
const KIND_TABLE = (() => {
  const t = {};
  for (const sec of LIBRARY) for (const it of sec.items) t[it.kind] = { ...it, role: sec.role };
  return t;
})();

// ═══════════════════════════════════════════════════════════════════════════
// Demo workflow — Morning Sweep → Rodbot Reflection → Grid
// ═══════════════════════════════════════════════════════════════════════════
const DEMO_WORKFLOW = {
  id: "wf_morning_sweep",
  slug: "morning-sweep",
  name: "Morning Sweep → Grid",
  nodes: [
    { id: "n_trg_dawn",    role: "trigger",   kind: "cron",        label: "6:45 AM daily", config: { cron: "45 6 * * *", tz: "America/New_York" }, x: 160, y: 200, notes: "Fires at dawn, weekdays and weekends alike.", description: "The day opens. A cron clock fires at 6:45 AM and wakes the workflow." },
    { id: "n_sto_inbox",   role: "state",     kind: "inbox",       label: "Inbox",          config: { path: "_inbox/inbox.jsonl" }, x: 160, y: 380, notes: "Yesterday's residue — notes, commits, drifts.", description: "Yesterday's residue — notes, commits, and drifts — waits to be swept up." },
    { id: "n_act_rodbot",  role: "actor",     kind: "rodbot",      label: "Rodbot",         config: { model: "claude-sonnet-4-6", register: "intimate" }, x: 400, y: 280, notes: "Reads the trigger + inbox residue, writes the grid.", description: "Rodbot reads yesterday's residue and decides what today should look like." },
    { id: "n_xf_reflect",  role: "transform", kind: "reflect",     label: "Reflection",     config: { schema: "grid_cell_v1", max_cells: 9 }, x: 640, y: 200, notes: "Turns raw state into 9 named cells.", description: "Raw thinking becomes nine named cells, ready to render as the morning grid." },
    { id: "n_sto_ledger",  role: "state",     kind: "ledger",      label: "Activity",       config: { path: "_ledger/activity.jsonl" }, x: 640, y: 380, notes: "Audit trail (append-only JSONL).", description: "Every pass leaves a trace in the append-only activity ledger." },
    { id: "n_snk_grid",    role: "sink",      kind: "grid_render", label: "Morning grid",   config: { grid_id: "morning" }, x: 880, y: 200, notes: "The 3×3 that Jake sees at open.", description: "The 3×3 morning grid lands in the UI — the first thing Jake sees." },
    { id: "n_snk_slack",   role: "sink",      kind: "slack_post",  label: "Team Slack",     config: { channel: "#comeketo-ops" }, x: 880, y: 340, notes: "Briefs the team on the day's shape.", description: "If the day has heat, the team gets a Slack brief on the shape of it." },
  ],
  connections: [
    { id: "c_trg_rod",       src: "n_trg_dawn",   dst: "n_act_rodbot", kind: "trigger", label: "fire",     description: "The dawn clock fires the workflow.", annotations: [], narration: "", created_at: "2026-04-22T00:00:00Z" },
    { id: "c_inbox_rod",     src: "n_sto_inbox",  dst: "n_act_rodbot", kind: "reference", label: "read",   readPattern: "tail 100", description: "Rodbot reads the last 100 inbox lines as context.", annotations: [], narration: "", created_at: "2026-04-22T00:00:00Z" },
    { id: "c_rod_reflect",   src: "n_act_rodbot", dst: "n_xf_reflect", kind: "data",    label: "raw state", description: "Rodbot's raw thinking flows into the reflection schema.", annotations: [], narration: "", created_at: "2026-04-22T00:00:00Z" },
    { id: "c_reflect_led",   src: "n_xf_reflect", dst: "n_sto_ledger", kind: "data",    label: "append",    description: "The reflection is appended to the ledger as a durable audit line.", annotations: [], narration: "", created_at: "2026-04-22T00:00:00Z" },
    { id: "c_reflect_grid",  src: "n_xf_reflect", dst: "n_snk_grid",   kind: "data",    description: "The nine cells render into the morning grid.", annotations: [], narration: "", created_at: "2026-04-22T00:00:00Z" },
    { id: "c_reflect_slack", src: "n_xf_reflect", dst: "n_snk_slack",  kind: "conditional", label: "if interesting", condition: "cells.some(c => c.priority >= 'high')", falsePathTarget: null, description: "Only post to Slack when at least one cell rates high priority.", annotations: [], narration: "", created_at: "2026-04-22T00:00:00Z" },
  ],
  metadata: { created_at: "2026-04-22T00:00:00Z", last_modified: "2026-04-22T00:00:00Z", version: 1 },
};

// ═══════════════════════════════════════════════════════════════════════════
// Geometry helpers
// ═══════════════════════════════════════════════════════════════════════════
function orthogonalPath(sx, sy, dx, dy) {
  const r = 8;
  if (Math.abs(dy - sy) < 1) return `M ${sx} ${sy} L ${dx} ${dy}`;
  const dir = sy < dy ? 1 : -1;
  if (dx > sx + 40) {
    const mx = (sx + dx) / 2;
    return [
      `M ${sx} ${sy}`,
      `L ${mx - r} ${sy}`,
      `Q ${mx} ${sy} ${mx} ${sy + dir * r}`,
      `L ${mx} ${dy - dir * r}`,
      `Q ${mx} ${dy} ${mx + r} ${dy}`,
      `L ${dx} ${dy}`,
    ].join(" ");
  }
  const jutR = 28, jutL = 28;
  const midY = (sy + dy) / 2;
  const ax = sx + jutR;
  const bx = dx - jutL;
  return [
    `M ${sx} ${sy}`,
    `L ${ax - r} ${sy}`,
    `Q ${ax} ${sy} ${ax} ${sy + dir * r}`,
    `L ${ax} ${midY - dir * r}`,
    `Q ${ax} ${midY} ${ax - r} ${midY}`,
    `L ${bx + r} ${midY}`,
    `Q ${bx} ${midY} ${bx} ${midY + dir * r}`,
    `L ${bx} ${dy - dir * r}`,
    `Q ${bx} ${dy} ${bx + r} ${dy}`,
    `L ${dx} ${dy}`,
  ].join(" ");
}

function clientToWorld(clientX, clientY, svgEl, viewport) {
  if (!svgEl) return { x: 0, y: 0 };
  const rect = svgEl.getBoundingClientRect();
  return {
    x: (clientX - rect.left - viewport.tx) / viewport.zoom,
    y: (clientY - rect.top  - viewport.ty) / viewport.zoom,
  };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function isEditableTarget(el) {
  if (!el) return false;
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return !!el.isContentEditable;
}

// ═══════════════════════════════════════════════════════════════════════════
// NodeShape — renders one of 5 role-shapes in local (0,0) coords
// ═══════════════════════════════════════════════════════════════════════════
function NodeShape({ role }) {
  const d = NODE_DIMS[role] || NODE_DIMS.actor;
  switch (d.shape) {
    case "capsule":
      return <rect className="shape shape-stroke" x={-d.w/2} y={-d.h/2} width={d.w} height={d.h} rx={d.h/2} ry={d.h/2} />;
    case "diamond": {
      const h = d.h/2;
      return <path className="shape shape-stroke" d={`M 0 ${-h} L ${h} 0 L 0 ${h} L ${-h} 0 Z`} />;
    }
    case "hexagon": {
      const w = d.w/2, h = d.h/2, inset = 22;
      return <path className="shape shape-stroke" d={`M ${-w} 0 L ${-w+inset} ${-h} L ${w-inset} ${-h} L ${w} 0 L ${w-inset} ${h} L ${-w+inset} ${h} Z`} />;
    }
    case "rounded":
      return <rect className="shape shape-stroke" x={-d.w/2} y={-d.h/2} width={d.w} height={d.h} rx={12} ry={12} />;
    case "stacked":
      return (
        <g className="shape">
          <rect className="shape-stroke" x={-d.w/2 + 5} y={-d.h/2 - 5} width={d.w - 10} height={d.h - 10} rx={6} ry={6} opacity="0.45" />
          <rect className="shape-stroke" x={-d.w/2} y={-d.h/2} width={d.w} height={d.h - 4} rx={6} ry={6} />
          <line x1={-d.w/2 + 10} y1={-d.h/2 + 12} x2={d.w/2 - 10} y2={-d.h/2 + 12} stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.75" />
        </g>
      );
    default:
      return <rect x={-d.w/2} y={-d.h/2} width={d.w} height={d.h} />;
  }
}

function SelectionRing({ role }) {
  const d = NODE_DIMS[role] || NODE_DIMS.actor;
  const pad = 6;
  if (d.shape === "diamond") {
    const h = d.h/2 + pad;
    return <path className="selection-ring" d={`M 0 ${-h} L ${h} 0 L 0 ${h} L ${-h} 0 Z`} />;
  }
  if (d.shape === "hexagon") {
    const w = d.w/2 + pad, h = d.h/2 + pad, inset = 22;
    return <path className="selection-ring" d={`M ${-w} 0 L ${-w+inset} ${-h} L ${w-inset} ${-h} L ${w} 0 L ${w-inset} ${h} L ${-w+inset} ${h} Z`} />;
  }
  const rx = d.shape === "capsule" ? (d.h + pad*2)/2 : 14;
  return <rect className="selection-ring" x={-d.w/2 - pad} y={-d.h/2 - pad} width={d.w + pad*2} height={d.h + pad*2} rx={rx} ry={rx} />;
}

// ═══════════════════════════════════════════════════════════════════════════
// GraphNode — the rendered, clickable, draggable node
// ═══════════════════════════════════════════════════════════════════════════
function GraphNode({
  node, selected, hovered, connectTargetValid, firing,
  onNodeMouseDown, onEndpointMouseDown,
  onMouseEnter, onMouseLeave,
}) {
  const tmpl = KIND_TABLE[node.kind] || { glyph: "·" };
  const off = endpointOffsets(node.role);
  const extraClass = connectTargetValid ? " connect-target" : (hovered ? " hovered" : "");
  const annotationCount = Array.isArray(node.annotations) ? node.annotations.length : 0;
  const dims = NODE_DIMS[node.role] || NODE_DIMS.actor;
  const badgeX = dims.w / 2 - 8;
  const badgeY = -dims.h / 2 + 8;
  return (
    <g
      className={"ag-node" + (selected ? " selected" : "") + extraClass + (firing ? " firing" : "")}
      data-role={node.role}
      data-kind={node.kind}
      data-nodeid={node.id}
      transform={`translate(${node.x} ${node.y})`}
      onMouseDown={(e) => onNodeMouseDown(e, node.id)}
      onMouseEnter={() => onMouseEnter(node.id)}
      onMouseLeave={() => onMouseLeave(node.id)}
    >
      <SelectionRing role={node.role} />
      <NodeShape role={node.role} />
      <text className="icon" x={0} y={-6} fill="var(--kind-accent, var(--role))">{tmpl.glyph}</text>
      <text className="label" x={0} y={14}>
        {agTruncateLabel(node.label, node.role)}
        <title>{node.label}</title>
      </text>
      {annotationCount > 0 && (
        <g className="ag-node-anno-badge" transform={`translate(${badgeX} ${badgeY})`}>
          <circle r={7} />
          <text textAnchor="middle" dominantBaseline="central" y={0.5}>{annotationCount}</text>
        </g>
      )}
      <circle
        className="ag-endpoint left"
        data-endpoint="left"
        cx={-off.dx} cy={0}
        onMouseDown={(e) => { e.stopPropagation(); onEndpointMouseDown(e, node.id, "left"); }}
      />
      <circle
        className="ag-endpoint right"
        data-endpoint="right"
        cx={ off.dx} cy={0}
        onMouseDown={(e) => { e.stopPropagation(); onEndpointMouseDown(e, node.id, "right"); }}
      />
    </g>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ConnectionPath — one orthogonal link between two nodes.
// First-class edge: invisible fat hit target + visible styled path + optional
// midpoint decorations (label pill, annotation count badge, conditional
// diamond). Clicking selects; shift-click multi-selects.
// ═══════════════════════════════════════════════════════════════════════════
function ConnectionPath({ conn, nodes, firing, selected, onSelect, onDiamondToggle }) {
  const src = nodes.find(n => n.id === conn.src);
  const dst = nodes.find(n => n.id === conn.dst);
  if (!src || !dst) return null;
  const so = endpointOffsets(src.role);
  const dO = endpointOffsets(dst.role);
  const sx = src.x + so.dx, sy = src.y;
  const dx = dst.x - dO.dx, dy = dst.y;
  const path = orthogonalPath(sx, sy, dx, dy);
  const midX = (sx + dx) / 2;
  const midY = (sy + dy) / 2;
  const kind = normalizeEdgeKind(conn.kind);
  const label = (conn.label || "").trim();
  const annotationCount = Array.isArray(conn.annotations) ? conn.annotations.length : 0;
  const isConditional = kind === "conditional";
  const markerEnd = kind === "trigger" ? "url(#ag-arrow-trigger)" : undefined;

  const handleClick = (e) => {
    if (!onSelect) return;
    e.stopPropagation();
    onSelect(conn.id, { additive: e.shiftKey || e.metaKey || e.ctrlKey });
  };

  // Width used for the label pill. Approx 6.2px/char + padding; capped.
  const labelW = label ? Math.min(160, 14 + Math.max(label.length, 3) * 6.2) : 0;

  return (
    <g className="ag-edge-group" data-edge-id={conn.id}>
      {/* Invisible hit target underneath — catches clicks in a generous band. */}
      {onSelect && (
        <path
          className="ag-link-hit"
          d={path}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={handleClick}
        />
      )}
      {/* Visible path on top. */}
      <path
        className={"ag-link" + (firing ? " firing" : "") + (selected ? " selected" : "")}
        data-kind={kind}
        d={path}
        markerEnd={markerEnd}
        onMouseDown={onSelect ? (e) => e.stopPropagation() : undefined}
        onClick={onSelect ? handleClick : undefined}
      />
      {/* Midpoint decorations — render only when there's something to show. */}
      {(label || annotationCount > 0 || isConditional) && (
        <g className={"ag-edge-mid" + (selected ? " selected" : "")} pointerEvents="all">
          {label && (
            <g transform={`translate(${midX} ${midY})`}>
              <rect
                className="ag-edge-label-bg"
                x={-labelW / 2} y={-9}
                width={labelW} height={18} rx={4} ry={4}
                onClick={onSelect ? handleClick : undefined}
                style={{ cursor: "pointer" }}
              />
              <text
                className="ag-edge-label"
                x={0} y={0}
                textAnchor="middle" dominantBaseline="central"
                onClick={onSelect ? handleClick : undefined}
                style={{ cursor: "pointer" }}
              >
                {agTruncate(label, 24)}
                <title>{label}</title>
              </text>
            </g>
          )}
          {annotationCount > 0 && (
            <g
              className="ag-edge-count-badge"
              transform={`translate(${midX + (label ? labelW / 2 + 8 : 0)} ${midY - (label ? 0 : 12)})`}
              onClick={onSelect ? handleClick : undefined}
              style={{ cursor: "pointer" }}
            >
              <circle r={7} />
              <text>{annotationCount}</text>
            </g>
          )}
          {isConditional && (
            <polygon
              className={"ag-edge-diamond" + (conn._branchActive ? " active" : "")}
              points={`${midX},${midY - (label ? 18 : 8)} ${midX + 7},${midY - (label ? 11 : 1)} ${midX},${midY - (label ? 4 : 6) + 2} ${midX - 7},${midY - (label ? 11 : 1)}`}
              onClick={(e) => {
                e.stopPropagation();
                if (onDiamondToggle) onDiamondToggle(conn.id);
                else if (onSelect) onSelect(conn.id, { additive: e.shiftKey || e.metaKey || e.ctrlKey });
              }}
            />
          )}
        </g>
      )}
    </g>
  );
}

// Ghost connection during drag-to-connect
function GhostConnection({ connectDrag, hoveredNodeId, nodes }) {
  if (!connectDrag) return null;
  const src = nodes.find(n => n.id === connectDrag.srcId);
  if (!src) return null;
  const off = endpointOffsets(src.role);
  let endX = connectDrag.cursor.x;
  let endY = connectDrag.cursor.y;
  if (hoveredNodeId && hoveredNodeId !== connectDrag.srcId) {
    const tgt = nodes.find(n => n.id === hoveredNodeId);
    if (tgt) {
      const tOff = endpointOffsets(tgt.role);
      endX = tgt.x - tOff.dx;
      endY = tgt.y;
    }
  }
  const sx = connectDrag.srcEndpoint === "left" ? src.x - off.dx : src.x + off.dx;
  return (
    <path
      className="ag-link ag-link-ghost"
      data-kind="data"
      d={orthogonalPath(sx, src.y, endX, endY)}
      style={{ strokeDasharray: "5 4", opacity: 0.75, pointerEvents: "none" }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// GraphCanvas — SVG surface; drag dispatch routed via node/endpoint handlers
// ═══════════════════════════════════════════════════════════════════════════
function GraphCanvas({
  workflow, selectedId, selectedIds, viewport, onViewportChange,
  onSelectNode, onClearSelection,
  selectedEdgeId, selectedEdgeIds, onSelectEdge,
  nodeDrag, connectDrag, hoveredNodeId,
  onNodeMouseDown, onEndpointMouseDown,
  onHoverNode, onLeaveNode,
  onStartMarquee, marquee,
  libraryDrag,
  firingNodes, firingLinks,
  svgRef, wrapRef: externalWrapRef,
}) {
  const _wrapRef = ag_useRef(null);
  const wrapRef = externalWrapRef || _wrapRef;
  const [panState, setPanState] = ag_useState(null);
  const [spaceHeld, setSpaceHeld] = ag_useState(false);

  ag_useEffect(() => {
    const onKeyDown = (e) => {
      if (isEditableTarget(e.target)) return;
      if (e.code === "Space" && !e.repeat) {
        setSpaceHeld(true); e.preventDefault(); return;
      }
      // Arrow-key pan — 40px per press, 120px with Shift (fast pan).
      // Apr 2026 pan upgrade: users didn't know about Space+drag, so
      // arrow keys give a discoverable panning affordance.
      const step = e.shiftKey ? 120 : 40;
      if (e.code === "ArrowLeft")  { onViewportChange({ ...viewport, tx: viewport.tx + step }); e.preventDefault(); }
      else if (e.code === "ArrowRight") { onViewportChange({ ...viewport, tx: viewport.tx - step }); e.preventDefault(); }
      else if (e.code === "ArrowUp")    { onViewportChange({ ...viewport, ty: viewport.ty + step }); e.preventDefault(); }
      else if (e.code === "ArrowDown")  { onViewportChange({ ...viewport, ty: viewport.ty - step }); e.preventDefault(); }
    };
    const onKeyUp = (e) => { if (e.code === "Space") setSpaceHeld(false); };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp); };
  }, [viewport, onViewportChange]);

  // Wheel behavior (Apr 2026 pan upgrade):
  //   • Ctrl/Meta + wheel → zoom (also catches trackpad pinch — browsers
  //     synthesize ctrlKey=true for pinch gestures).
  //   • Plain wheel / 2-finger trackpad swipe → pan both axes. deltaX and
  //     deltaY are both populated on modern trackpads. Shift+wheel on a
  //     mouse-only wheel swaps Y into X for horizontal scrolling.
  // Must be wired as a native non-passive listener — React's synthetic
  // onWheel is passive and preventDefault() is silently ignored, so the
  // page scrolls underneath the canvas even when we think we stopped it.
  ag_useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const next = clamp(viewport.zoom + (-e.deltaY * 0.01), 0.4, 2.0);
        onViewportChange({ ...viewport, zoom: next });
        return;
      }
      const dx = e.shiftKey && e.deltaX === 0 ? e.deltaY : e.deltaX;
      const dy = e.shiftKey && e.deltaX === 0 ? 0 : e.deltaY;
      onViewportChange({
        ...viewport,
        tx: viewport.tx - dx,
        ty: viewport.ty - dy,
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [viewport, onViewportChange, wrapRef]);

  const handleMouseDown = (e) => {
    const canPan = spaceHeld || e.button === 1;
    if (canPan) {
      e.preventDefault();
      setPanState({ startX: e.clientX, startY: e.clientY, origTx: viewport.tx, origTy: viewport.ty });
      return;
    }
    if (e.button !== 0) return;
    // Empty-canvas left-drag → marquee select. Shift retains existing selection.
    if (onStartMarquee) {
      const world = clientToWorld(e.clientX, e.clientY, svgRef.current, viewport);
      onStartMarquee(world.x, world.y, e.shiftKey);
      e.preventDefault();
      return;
    }
    onClearSelection();
  };

  ag_useEffect(() => {
    if (!panState) return;
    const onMove = (ev) => {
      onViewportChange({
        ...viewport,
        tx: panState.origTx + (ev.clientX - panState.startX),
        ty: panState.origTy + (ev.clientY - panState.startY),
      });
    };
    const onUp = () => setPanState(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [panState, viewport, onViewportChange]);

  const canPan = spaceHeld || !!panState;

  const marqueeRect = marquee ? (() => {
    const x = Math.min(marquee.startX, marquee.endX);
    const y = Math.min(marquee.startY, marquee.endY);
    const w = Math.abs(marquee.endX - marquee.startX);
    const h = Math.abs(marquee.endY - marquee.startY);
    return { x, y, w, h };
  })() : null;

  const selIds = selectedIds || (selectedId ? new Set([selectedId]) : new Set());
  const selEdgeIds = selectedEdgeIds || (selectedEdgeId ? new Set([selectedEdgeId]) : new Set());

  return (
    <div
      ref={wrapRef}
      className={"ag-canvas-wrap"
        + (panState ? " panning" : "")
        + (libraryDrag && libraryDrag.overCanvas ? " drop-target" : "")
      }
    >
      <svg
        ref={svgRef}
        className={"ag-canvas" + (canPan ? " can-pan" : "") + (connectDrag ? " connecting" : "") + (nodeDrag ? " dragging" : "")}
        onMouseDown={handleMouseDown}
        style={{ userSelect: "none" }}
      >
        <defs>
          {/* Arrowhead for trigger edges. Sized to sit flush at the node edge. */}
          <marker id="ag-arrow-trigger" viewBox="0 0 10 10"
            refX="9" refY="5" markerWidth="7" markerHeight="7"
            orient="auto-start-reverse" markerUnits="userSpaceOnUse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--ag-trigger)" />
          </marker>
        </defs>
        <g transform={`translate(${viewport.tx} ${viewport.ty}) scale(${viewport.zoom})`}>
          {/* Connections first (rendered under nodes) */}
          <g className="ag-links">
            {workflow.connections.map(c => (
              <ConnectionPath
                key={c.id}
                conn={c}
                nodes={workflow.nodes}
                firing={firingLinks && firingLinks.has(c.id)}
                selected={selEdgeIds.has(c.id)}
                onSelect={onSelectEdge}
              />
            ))}
            <GhostConnection connectDrag={connectDrag} hoveredNodeId={hoveredNodeId} nodes={workflow.nodes} />
          </g>
          {/* Nodes on top */}
          <g className="ag-nodes">
            {workflow.nodes.map(n => (
              <GraphNode
                key={n.id}
                node={n}
                selected={selIds.has(n.id) || selectedId === n.id}
                hovered={hoveredNodeId === n.id}
                connectTargetValid={!!connectDrag && connectDrag.srcId !== n.id && hoveredNodeId === n.id}
                firing={firingNodes && firingNodes.has(n.id)}
                onNodeMouseDown={onNodeMouseDown}
                onEndpointMouseDown={onEndpointMouseDown}
                onMouseEnter={onHoverNode}
                onMouseLeave={onLeaveNode}
              />
            ))}
          </g>
          {/* Marquee rect */}
          {marqueeRect && marqueeRect.w + marqueeRect.h > 4 && (
            <rect
              className="ag-marquee"
              x={marqueeRect.x} y={marqueeRect.y} width={marqueeRect.w} height={marqueeRect.h}
              fill="rgba(120,160,220,0.10)" stroke="var(--ag-transform, #7ea0d6)"
              strokeDasharray="4 3" strokeWidth={1} pointerEvents="none"
            />
          )}
        </g>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NodeLibrary — left panel
// ═══════════════════════════════════════════════════════════════════════════
function NodeLibrary({
  onAddNode, onStartDrag, workflow, onExport, onRename, onSave, onOpenLoad, saving,
  catalogEdges, catalogLoading, onStartCatalogDrag, onApplyCatalogToEdge, onDeleteCatalogEntry,
  selectedEdgeId, onClose,
}) {
  const [collapsed, setCollapsed] = ag_useState(new Set());
  const [query, setQuery] = ag_useState("");

  const toggle = (role) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role); else next.add(role);
      return next;
    });
  };

  const needle = query.trim().toLowerCase();
  const filter = (items) => needle
    ? items.filter(it => (it.label + " " + it.sub + " " + it.kind).toLowerCase().includes(needle))
    : items;
  const catalogFilter = (items) => needle
    ? (items || []).filter(it => ((it.name || "") + " " + (it.label || "") + " " + (it.kind || "")).toLowerCase().includes(needle))
    : (items || []);
  const catalogItems = catalogFilter(catalogEdges || []);

  return (
    <aside className="ag-panel left">
      <div className="ag-wf-header">
        <input
          className="name"
          value={workflow.name}
          onChange={(e) => onRename(e.target.value)}
          placeholder="Untitled workflow"
        />
        <div className="meta">
          <span>{workflow.nodes.length} nodes · {workflow.connections.length} links</span>
          <div style={{display:"flex", gap:6}}>
            {onSave && (
              <button className="export-btn" onClick={onSave} disabled={saving} title="Save workflow to disk">
                {saving ? "Saving…" : "Save"}
              </button>
            )}
            {onOpenLoad && (
              <button className="export-btn" onClick={onOpenLoad} title="Load saved workflow">Load</button>
            )}
            <button className="export-btn" onClick={onExport}>Export</button>
          </div>
        </div>
      </div>
      <div className="ag-panel-header">
        <h3>Library</h3>
        {onClose && (
          <div className="actions">
            <button className="chip ghost sm" onClick={onClose} title="Collapse library (L)">Hide</button>
          </div>
        )}
      </div>
      <input
        className="ag-lib-search"
        placeholder="Search nodes…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="ag-panel-scroll">
        {/* Catalog — saved edge patterns. Appears above the node roles so it
            feels like a first-class library, and the user can see it whether
            or not an edge is currently selected. */}
        <div className={"ag-lib-section ag-catalog-section" + (collapsed.has("__catalog__") ? " collapsed" : "")} data-role="catalog">
          <div className="ag-lib-section-header" onClick={() => toggle("__catalog__")}>
            <span><span className="role-dot" style={{background:"var(--ember, #d98236)"}} />Catalog edges</span>
            <span className="chev">▾</span>
          </div>
          <div className="ag-lib-list">
            {catalogItems.length === 0 && !catalogLoading && (
              <div className="ag-catalog-empty">
                No saved patterns yet. Select an edge → <em>Save as pattern</em> to stash one here. Drag it onto any edge to re-apply.
              </div>
            )}
            {catalogLoading && catalogItems.length === 0 && (
              <div className="ag-catalog-empty" style={{fontStyle:"italic"}}>Loading…</div>
            )}
            {catalogItems.map(it => (
              <div
                key={it.slug}
                className="ag-lib-item ag-catalog-item"
                data-kind={it.kind}
                title={
                  selectedEdgeId
                    ? `Click to apply to selected edge · drag onto any edge · ${it.label || it.name}`
                    : `Drag onto any edge to apply · ${it.label || it.name}`
                }
                onMouseDown={(e) => {
                  if (e.button !== 0) return;
                  if (onStartCatalogDrag) onStartCatalogDrag(it, e.clientX, e.clientY);
                }}
                onClick={(e) => {
                  // Click-to-apply when an edge is already selected. The
                  // mousedown-then-mouseup is treated as a drag if the user
                  // actually moves; otherwise we treat it as an apply-to-
                  // selected convenience.
                  if (selectedEdgeId && onApplyCatalogToEdge) {
                    onApplyCatalogToEdge(it.slug, selectedEdgeId);
                  }
                }}
              >
                <span className={"ag-catalog-swatch " + it.kind} />
                <span style={{flex:1, minWidth:0}}>
                  <span className="ag-catalog-name">{it.name || it.slug}</span>
                  <span className="sub">
                    {it.kind}
                    {it.label ? <> · {it.label}</> : null}
                    {typeof it.usage_count === "number" && it.usage_count > 0 ? (
                      <span className="ag-catalog-usage" title={`Applied ${it.usage_count} time${it.usage_count===1?"":"s"}`}> · ×{it.usage_count}</span>
                    ) : null}
                  </span>
                </span>
                {onDeleteCatalogEntry && (
                  <button
                    className="ag-catalog-rm"
                    title="Remove from catalog"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remove pattern "${it.name || it.slug}" from catalog?`)) {
                        onDeleteCatalogEntry(it.slug);
                      }
                    }}
                  >×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {LIBRARY.map(sec => {
          const items = filter(sec.items);
          if (needle && items.length === 0) return null;
          const isCollapsed = collapsed.has(sec.role);
          return (
            <div key={sec.role} className={"ag-lib-section" + (isCollapsed ? " collapsed" : "")} data-role={sec.role}>
              <div className="ag-lib-section-header" onClick={() => toggle(sec.role)}>
                <span><span className="role-dot" />{sec.title}</span>
                <span className="chev">▾</span>
              </div>
              <div className="ag-lib-list">
                {items.map(it => (
                  <button
                    key={it.kind}
                    className="ag-lib-item"
                    onClick={() => onAddNode(sec.role, it)}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
                      if (onStartDrag) onStartDrag(sec.role, it, e.clientX, e.clientY);
                    }}
                    title={`Drag onto canvas or click to add · ${it.label}`}
                  >
                    <span className="glyph">{it.glyph}</span>
                    <span style={{flex:1, minWidth:0}}>
                      {it.label}
                      <span className="sub">{it.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NodeInspector — right panel
// ═══════════════════════════════════════════════════════════════════════════
function NodeInspector({ node, workflow, onUpdateNode, onSelectNode, onDeleteNode, onOpenAnnotator, onClose }) {
  const [draftAnno, setDraftAnno] = ag_useState(null);
  // draftAnno = { type: "note"|"reference", text, href } while composing.
  if (!node) {
    return (
      <aside className="ag-panel right">
        <div className="ag-panel-header">
          <h3>Inspector</h3>
          {onClose && (
            <div className="actions">
              <button className="chip ghost sm" onClick={onClose} title="Collapse inspector (I)">Hide</button>
            </div>
          )}
        </div>
        <div className="ag-inspector-empty">
          <div className="label">nothing selected</div>
          Click a node on the canvas to see its config, connections, and notes. Drag endpoints to wire two nodes together.
        </div>
      </aside>
    );
  }
  const tmpl = KIND_TABLE[node.kind] || { glyph: "·" };
  const incoming = workflow.connections.filter(c => c.dst === node.id);
  const outgoing = workflow.connections.filter(c => c.src === node.id);
  const nodeById = (id) => workflow.nodes.find(n => n.id === id);
  const configRows = Object.entries(node.config || {});
  const annotations = Array.isArray(node.annotations) ? node.annotations : [];

  const addAnnotation = (ann) => {
    const nowIso = new Date().toISOString();
    const next = [...annotations, { id: `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,5)}`, created_at: nowIso, ...ann }];
    onUpdateNode(node.id, { annotations: next });
  };
  const removeAnnotation = (id) => {
    onUpdateNode(node.id, { annotations: annotations.filter(a => a.id !== id) });
  };

  const inputStyle = { background: "var(--paper-card-2)", border: "1px solid var(--rule)", borderRadius: 6, padding: "4px 8px", color: "var(--ink)", font: "inherit", fontSize: 12, width: "100%" };
  const taStyle = { ...inputStyle, resize: "vertical", minHeight: 60, fontFamily: "var(--font-mono, ui-monospace)", fontSize: 11.5 };

  return (
    <aside className="ag-panel right">
      <div className="ag-panel-header">
        <h3>Inspector</h3>
        <div className="actions">
          <button className="chip ghost sm" onClick={() => onDeleteNode(node.id)} title="Delete node">Delete</button>
          {onClose && (
            <button className="chip ghost sm" onClick={onClose} title="Collapse inspector (I)">Hide</button>
          )}
        </div>
      </div>
      <div className="ag-panel-scroll">
        <div className="ag-i-ident">
          <div className="icon" style={{color:"var(--role)"}}>
            <span style={{color: `var(--ag-${node.role})`}}>{tmpl.glyph}</span>
          </div>
          <div>
            <div className="name">{node.label}</div>
            <div className="type">{node.role} · {node.kind}</div>
          </div>
        </div>

        <div className="ag-i-section">
          <div className="ag-i-section-title">Identity</div>
          <div className="ag-i-row"><span className="k">id</span><span className="v">{node.id}</span></div>
          <div className="ag-i-row">
            <span className="k">label</span>
            <input
              className="v"
              value={node.label}
              onChange={(e) => onUpdateNode(node.id, { label: e.target.value })}
              style={{background:"var(--paper-card-2)", border:"1px solid var(--rule)", borderRadius:6, padding:"3px 6px", color:"var(--ink)"}}
            />
          </div>
          <div className="ag-i-row">
            <span className="k">position</span>
            <span className="v">x:{Math.round(node.x)} y:{Math.round(node.y)}</span>
          </div>
        </div>

        {configRows.length > 0 && (
          <div className="ag-i-section">
            <div className="ag-i-section-title">Config</div>
            {configRows.map(([k, v]) => (
              <div key={k} className="ag-i-row">
                <span className="k">{k}</span>
                <span className="v">{typeof v === "string" ? v : JSON.stringify(v)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="ag-i-section">
          <div className="ag-i-section-title">Connections</div>
          {incoming.length === 0 && outgoing.length === 0 && (
            <div style={{fontSize:11.5, color:"var(--ink-4)", fontStyle:"italic", padding:"4px 0"}}>No connections yet. Drag from an endpoint to wire this node.</div>
          )}
          {incoming.length > 0 && (
            <>
              <div style={{fontSize:10, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.1em", padding:"4px 0 2px"}}>← Incoming</div>
              <div className="ag-i-conn-list">
                {incoming.map(c => {
                  const peer = nodeById(c.src);
                  return (
                    <div key={c.id} className="ag-i-conn" data-kind={c.kind} onClick={() => peer && onSelectNode(peer.id)}>
                      <span className="dot" /> {peer ? peer.label : "(?)"} <span className="arrow">→ self · {c.kind}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          {outgoing.length > 0 && (
            <>
              <div style={{fontSize:10, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.1em", padding:"8px 0 2px"}}>→ Outgoing</div>
              <div className="ag-i-conn-list">
                {outgoing.map(c => {
                  const peer = nodeById(c.dst);
                  return (
                    <div key={c.id} className="ag-i-conn" data-kind={c.kind} onClick={() => peer && onSelectNode(peer.id)}>
                      <span className="dot" /> self <span className="arrow">→ {peer ? peer.label : "(?)"} · {c.kind}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Description — one-liner shown in the walkthrough narrator bar
            and the future storybook view. Distinct from notes (long-form)
            and annotations (structured attachments). */}
        <div className="ag-i-section">
          <div className="ag-i-section-title">Description</div>
          <input
            value={node.description || ""}
            onChange={(e) => onUpdateNode(node.id, { description: e.target.value })}
            placeholder="Right now: this node does…"
            style={inputStyle}
          />
          <div style={{fontSize:10.5, color:"var(--ink-4)", marginTop:4, lineHeight:1.45}}>
            A punchy one-liner that narrates this step when the workflow plays.
          </div>
        </div>

        <div className="ag-i-section">
          <div className="ag-i-section-title">Notes</div>
          <textarea
            className="ag-i-notes"
            value={node.notes || ""}
            onChange={(e) => onUpdateNode(node.id, { notes: e.target.value })}
            placeholder="Why this node exists, what it depends on, edge cases…"
          />
        </div>

        {/* Annotations — structured notes, references, and screenshots. */}
        <div className="ag-i-section">
          <div className="ag-i-section-title">
            Annotations
            <span style={{marginLeft:6, fontSize:10, color:"var(--ink-4)"}}>({annotations.length})</span>
          </div>
          {annotations.length === 0 && !draftAnno && (
            <div style={{fontSize:11.5, color:"var(--ink-4)", fontStyle:"italic", padding:"4px 0 6px"}}>
              No annotations yet. Attach a note, a reference URL, or a screenshot to explain this node.
            </div>
          )}
          {annotations.map(a => (
            <div key={a.id} className="ag-edge-anno" style={{border:"1px solid var(--rule)", borderRadius:6, padding:"6px 8px", marginBottom:6, background:"var(--paper-card-2)"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2}}>
                <span style={{fontSize:9.5, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.1em"}}>{a.type}</span>
                <button onClick={() => removeAnnotation(a.id)} style={{background:"none", border:"none", color:"var(--ink-4)", cursor:"pointer", fontSize:11, padding:"0 2px"}} title="Remove">×</button>
              </div>
              {a.type === "note" && <div style={{fontSize:12, color:"var(--ink)", whiteSpace:"pre-wrap"}}>{a.text}</div>}
              {a.type === "reference" && (
                <div style={{fontSize:11.5}}>
                  {a.text && <div style={{color:"var(--ink)", marginBottom:2}}>{a.text}</div>}
                  {a.href && <a href={a.href} target="_blank" rel="noreferrer" style={{color:"var(--ember)", textDecoration:"none", wordBreak:"break-all"}}>{a.href}</a>}
                </div>
              )}
              {a.type === "screenshot" && (
                <div style={{fontSize:11.5, color:"var(--ink-3)", fontStyle:"italic"}}>
                  Screenshot · {a.regions ? `${a.regions.length} region(s)` : "no regions"}
                  {a.hash && <span style={{display:"block", fontFamily:"var(--font-mono, ui-monospace)", fontSize:10, color:"var(--ink-4)", marginTop:2}}>sha256:{a.hash.slice(0,12)}…</span>}
                </div>
              )}
            </div>
          ))}
          {draftAnno && (
            <div style={{border:"1px solid var(--ember)", borderRadius:6, padding:"8px", marginBottom:6, background:"var(--paper-card-2)"}}>
              <div style={{fontSize:9.5, color:"var(--ember)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4}}>new {draftAnno.type}</div>
              {draftAnno.type === "note" && (
                <textarea
                  autoFocus
                  value={draftAnno.text || ""}
                  onChange={(e) => setDraftAnno({ ...draftAnno, text: e.target.value })}
                  placeholder="Explain the node, what it depends on, the reason it exists…"
                  style={taStyle}
                />
              )}
              {draftAnno.type === "reference" && (
                <div style={{display:"flex", flexDirection:"column", gap:4}}>
                  <input autoFocus value={draftAnno.text || ""} onChange={(e) => setDraftAnno({ ...draftAnno, text: e.target.value })} placeholder="Label (optional)" style={inputStyle} />
                  <input value={draftAnno.href || ""} onChange={(e) => setDraftAnno({ ...draftAnno, href: e.target.value })} placeholder="https://…" style={inputStyle} />
                </div>
              )}
              <div style={{display:"flex", gap:6, marginTop:6, justifyContent:"flex-end"}}>
                <button className="chip ghost sm" onClick={() => setDraftAnno(null)}>Cancel</button>
                <button
                  className="chip ember sm"
                  onClick={() => {
                    if (draftAnno.type === "note" && !(draftAnno.text || "").trim()) return;
                    if (draftAnno.type === "reference" && !(draftAnno.text || draftAnno.href || "").trim()) return;
                    addAnnotation(draftAnno);
                    setDraftAnno(null);
                  }}
                >Save</button>
              </div>
            </div>
          )}
          {!draftAnno && (
            <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
              <button className="chip ghost sm" onClick={() => setDraftAnno({ type: "note", text: "" })}>+ Note</button>
              <button className="chip ghost sm" onClick={() => setDraftAnno({ type: "reference", text: "", href: "" })}>+ Reference</button>
              {onOpenAnnotator ? (
                <button
                  className="chip ghost sm"
                  onClick={() => onOpenAnnotator(node.id)}
                  title="Paste or upload an image, then draw boxes/points to anchor annotations"
                >+ Screenshot</button>
              ) : (
                <button className="chip ghost sm" disabled title="Screenshot annotator unavailable" style={{opacity:0.45, cursor:"not-allowed"}}>+ Screenshot</button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ScreenshotAnnotator — modal for attaching an image + rect/point regions
// to an edge. Two steps: (1) paste/upload the image, (2) draw regions over
// the rendered image. Coordinates are normalized to 0-1 of image w/h so the
// backend stays resolution-agnostic. On Confirm, the parent uploads the
// payload to /api/annotations/upload and attaches the returned hash as an
// edge annotation.
// ═══════════════════════════════════════════════════════════════════════════
function ScreenshotAnnotator({ state, onChange, onCancel, onConfirm }) {
  const [mode, setMode] = ag_useState("rect"); // "rect" | "point"
  const [draftRect, setDraftRect] = ag_useState(null);
  // draftRect = { x0, y0, x1, y1 } in normalized 0-1 coords
  const [labelFor, setLabelFor] = ag_useState(null);
  // labelFor = { idx } — which just-placed region is waiting for a label

  const imageRef = ag_useRef(null);

  // Step 1 — paste / upload. Listen to the document-level paste event only
  // while this modal is open. Any <img> clipboard content becomes the image.
  ag_useEffect(() => {
    if (!state || state.step !== "paste") return;
    const onPaste = (e) => {
      const items = (e.clipboardData && e.clipboardData.items) || [];
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.kind === "file" && /^image\//.test(it.type)) {
          const blob = it.getAsFile();
          if (!blob) continue;
          const reader = new FileReader();
          reader.onload = () => {
            const img = new Image();
            img.onload = () => {
              onChange({
                ...state,
                step: "annotate",
                image: { data: reader.result, mime: blob.type || "image/png", width: img.naturalWidth, height: img.naturalHeight },
                regions: [],
              });
            };
            img.src = reader.result;
          };
          reader.readAsDataURL(blob);
          e.preventDefault();
          return;
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [state, onChange]);

  if (!state) return null;

  const onFile = (file) => {
    if (!file || !/^image\//.test(file.type)) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        onChange({
          ...state,
          step: "annotate",
          image: { data: reader.result, mime: file.type, width: img.naturalWidth, height: img.naturalHeight },
          regions: [],
        });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  // Convert a mouse event to normalized 0-1 coords relative to the <img>.
  const toNorm = (ev) => {
    const el = imageRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = clampUnit((ev.clientX - r.left) / Math.max(1, r.width));
    const y = clampUnit((ev.clientY - r.top) / Math.max(1, r.height));
    return { x, y };
  };
  const clampUnit = (v) => Math.max(0, Math.min(1, v));

  const onCanvasMouseDown = (ev) => {
    if (ev.button !== 0) return;
    const n = toNorm(ev);
    if (!n) return;
    if (mode === "point") {
      const regions = [...(state.regions || []), { kind: "point", x: n.x, y: n.y }];
      onChange({ ...state, regions });
      setLabelFor({ idx: regions.length - 1 });
      return;
    }
    setDraftRect({ x0: n.x, y0: n.y, x1: n.x, y1: n.y });
  };
  const onCanvasMouseMove = (ev) => {
    if (!draftRect) return;
    const n = toNorm(ev);
    if (!n) return;
    setDraftRect(d => d ? { ...d, x1: n.x, y1: n.y } : d);
  };
  const onCanvasMouseUp = () => {
    if (!draftRect) return;
    const x = Math.min(draftRect.x0, draftRect.x1);
    const y = Math.min(draftRect.y0, draftRect.y1);
    const w = Math.abs(draftRect.x1 - draftRect.x0);
    const h = Math.abs(draftRect.y1 - draftRect.y0);
    setDraftRect(null);
    if (w < 0.005 || h < 0.005) return; // ignore tiny accidents
    const regions = [...(state.regions || []), { kind: "rect", x, y, w, h }];
    onChange({ ...state, regions });
    setLabelFor({ idx: regions.length - 1 });
  };
  const removeRegion = (idx) => {
    const next = (state.regions || []).filter((_, i) => i !== idx);
    onChange({ ...state, regions: next });
    if (labelFor && labelFor.idx === idx) setLabelFor(null);
  };
  const setRegionLabel = (idx, label) => {
    const next = (state.regions || []).map((r, i) => i === idx ? { ...r, label } : r);
    onChange({ ...state, regions: next });
  };

  const regions = state.regions || [];

  // Render — two steps. Step 1: paste pad + file picker. Step 2: image + SVG overlay + region list.
  return (
    <div
      onClick={onCancel}
      style={{position:"fixed", inset:0, zIndex:9999, background:"rgba(8,10,14,0.66)", display:"flex", alignItems:"center", justifyContent:"center", padding:20}}
    >
      <div
        className="ag-annotator"
        onClick={e => e.stopPropagation()}
        style={{
          width: "min(960px, 96vw)",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          background:"var(--paper, #fafaf6)",
          border:"1px solid var(--rule, #d5d1c6)",
          borderRadius:10,
          boxShadow:"0 20px 60px rgba(0,0,0,0.5)",
          color:"var(--ink, #1a1a1a)",
          overflow:"hidden",
        }}
      >
        <div className="ag-annotator-toolbar" style={{padding:"10px 14px", borderBottom:"1px solid var(--rule)", display:"flex", alignItems:"center", gap:10}}>
          <h3 style={{margin:0, fontFamily:"var(--font-serif, Fraunces, serif)", fontSize:17, flex:1}}>Screenshot annotator</h3>
          {state.step === "annotate" && (
            <>
              <div style={{display:"flex", background:"var(--paper-card-2, #fff)", border:"1px solid var(--rule)", borderRadius:6, overflow:"hidden"}}>
                <button className={"ag-annotator-tool " + (mode === "rect" ? "active" : "")} onClick={() => setMode("rect")} title="Draw rectangle (R)">▭ Rect</button>
                <button className={"ag-annotator-tool " + (mode === "point" ? "active" : "")} onClick={() => setMode("point")} title="Place point (P)">● Point</button>
              </div>
              <button className="chip ghost sm" onClick={() => onChange({ ...state, step: "paste", image: null, regions: [] })} title="Replace image">Replace</button>
            </>
          )}
          <button className="chip ghost sm" onClick={onCancel}>Cancel</button>
          {state.step === "annotate" && (
            <button className="chip ember sm" onClick={() => onConfirm(state)}>Attach to edge</button>
          )}
        </div>

        <div style={{flex:1, overflow:"auto", padding: state.step === "paste" ? 24 : 14, display:"flex", flexDirection: state.step === "paste" ? "column" : "row", gap:14}}>
          {state.step === "paste" && (
            <div
              className="ag-annotator-paste"
              style={{
                border:"2px dashed var(--rule, #c7c2b4)",
                borderRadius:10,
                padding:"40px 20px",
                textAlign:"center",
                color:"var(--ink-3, #555)",
                background:"var(--paper-card-2, #fff)",
                minHeight:240,
                display:"flex",
                flexDirection:"column",
                alignItems:"center",
                justifyContent:"center",
                gap:8,
              }}
            >
              <div style={{fontSize:28, opacity:0.55}}>⌘V</div>
              <div style={{fontSize:14, color:"var(--ink)"}}>Paste a screenshot, or choose a file</div>
              <div style={{fontSize:11.5, color:"var(--ink-4)"}}>PNG / JPG · kept local, content-addressed</div>
              <label style={{display:"inline-block", marginTop:10, padding:"6px 14px", border:"1px solid var(--rule)", borderRadius:6, cursor:"pointer", background:"var(--paper, #fafaf6)"}}>
                <input type="file" accept="image/*" style={{display:"none"}} onChange={(e) => onFile(e.target.files && e.target.files[0])} />
                Choose file
              </label>
            </div>
          )}

          {state.step === "annotate" && state.image && (
            <>
              <div style={{flex:1, minWidth:0, display:"flex", alignItems:"center", justifyContent:"center", background:"var(--paper-card-2, #fff)", border:"1px solid var(--rule)", borderRadius:8, position:"relative", overflow:"hidden"}}>
                <div
                  className="ag-annotator-canvas"
                  style={{position:"relative", maxWidth:"100%", maxHeight:"70vh", cursor: mode === "point" ? "crosshair" : "crosshair"}}
                  onMouseDown={onCanvasMouseDown}
                  onMouseMove={onCanvasMouseMove}
                  onMouseUp={onCanvasMouseUp}
                  onMouseLeave={() => setDraftRect(null)}
                >
                  <img
                    ref={imageRef}
                    src={state.image.data}
                    alt=""
                    draggable={false}
                    style={{display:"block", maxWidth:"100%", maxHeight:"70vh", userSelect:"none", pointerEvents:"none"}}
                  />
                  {/* SVG overlay sized to match the img via 100% on both axes */}
                  <svg
                    viewBox="0 0 1 1"
                    preserveAspectRatio="none"
                    style={{position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none"}}
                  >
                    {regions.map((r, i) => r.kind === "rect" ? (
                      <g key={i}>
                        <rect
                          x={r.x} y={r.y} width={r.w} height={r.h}
                          fill="rgba(217,130,54,0.14)" stroke="var(--ember, #d98236)"
                          strokeWidth={0.003} vectorEffect="non-scaling-stroke"
                        />
                        {r.label && (
                          <text x={r.x + 0.005} y={r.y + 0.018} fontSize="0.018" fill="var(--ember, #d98236)" style={{paintOrder:"stroke"}} stroke="var(--paper, #fafaf6)" strokeWidth="0.003">{r.label}</text>
                        )}
                      </g>
                    ) : (
                      <g key={i}>
                        <circle cx={r.x} cy={r.y} r={0.012} fill="var(--ember, #d98236)" stroke="var(--paper, #fafaf6)" strokeWidth={0.004} />
                        {r.label && (
                          <text x={r.x + 0.016} y={r.y + 0.005} fontSize="0.018" fill="var(--ember, #d98236)" style={{paintOrder:"stroke"}} stroke="var(--paper, #fafaf6)" strokeWidth="0.003">{r.label}</text>
                        )}
                      </g>
                    ))}
                    {draftRect && (() => {
                      const x = Math.min(draftRect.x0, draftRect.x1);
                      const y = Math.min(draftRect.y0, draftRect.y1);
                      const w = Math.abs(draftRect.x1 - draftRect.x0);
                      const h = Math.abs(draftRect.y1 - draftRect.y0);
                      return (
                        <rect x={x} y={y} width={w} height={h} fill="rgba(217,130,54,0.08)" stroke="var(--ember, #d98236)" strokeDasharray="0.006 0.006" strokeWidth={0.003} vectorEffect="non-scaling-stroke" />
                      );
                    })()}
                  </svg>
                </div>
              </div>

              <div style={{width:240, display:"flex", flexDirection:"column", gap:8, overflow:"auto"}}>
                <div style={{fontSize:10.5, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.1em"}}>Regions · {regions.length}</div>
                {regions.length === 0 && (
                  <div style={{fontSize:11.5, color:"var(--ink-4)", fontStyle:"italic"}}>Drag to draw a rectangle, or switch to Point and click.</div>
                )}
                {regions.map((r, i) => (
                  <div key={i} style={{border:"1px solid var(--rule)", borderRadius:6, padding:"6px 8px", background:"var(--paper-card-2, #fff)", fontSize:11.5}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4}}>
                      <span style={{textTransform:"uppercase", fontSize:9.5, color:"var(--ink-4)", letterSpacing:"0.1em"}}>{r.kind} #{i+1}</span>
                      <button onClick={() => removeRegion(i)} style={{background:"none", border:"none", color:"var(--ink-4)", cursor:"pointer", fontSize:12}}>×</button>
                    </div>
                    <input
                      autoFocus={labelFor && labelFor.idx === i}
                      value={r.label || ""}
                      placeholder="Label (optional)"
                      onChange={(e) => setRegionLabel(i, e.target.value)}
                      onBlur={() => setLabelFor(null)}
                      style={{width:"100%", padding:"3px 6px", border:"1px solid var(--rule)", borderRadius:4, background:"var(--paper, #fafaf6)", color:"var(--ink)", fontSize:11}}
                    />
                    <div style={{fontSize:10, color:"var(--ink-4)", marginTop:3, fontFamily:"var(--font-mono, ui-monospace)"}}>
                      x:{r.x.toFixed(3)} y:{r.y.toFixed(3)}
                      {r.kind === "rect" && <> · w:{(r.w || 0).toFixed(3)} h:{(r.h || 0).toFixed(3)}</>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EdgeInspector — right panel when an edge is selected. Mirrors NodeInspector
// but edges carry different payload per kind: data edges transform/filter,
// references do read patterns, triggers fire events, conditionals branch.
// Annotations (Note / Reference / Screenshot) and Rodbot narration live here.
// ═══════════════════════════════════════════════════════════════════════════
function EdgeInspector({ edge, workflow, onUpdateEdge, onDeleteEdge, onSelectNode, onSaveAsPattern, onOpenAnnotator, onClose }) {
  const [narrating, setNarrating] = ag_useState(false);
  const [draftAnno, setDraftAnno] = ag_useState(null);
  // draftAnno = { type: "note"|"reference", text, href } while user is
  // composing a new annotation.

  if (!edge) {
    return (
      <aside className="ag-panel right">
        <div className="ag-panel-header">
          <h3>Edge</h3>
          {onClose && (
            <div className="actions">
              <button className="chip ghost sm" onClick={onClose} title="Collapse inspector (I)">Hide</button>
            </div>
          )}
        </div>
        <div className="ag-inspector-empty">
          <div className="label">nothing selected</div>
          Click an edge on the canvas to inspect its payload. Drag between nodes to wire a new one.
        </div>
      </aside>
    );
  }
  const src = workflow.nodes.find(n => n.id === edge.src);
  const dst = workflow.nodes.find(n => n.id === edge.dst);
  const kind = normalizeEdgeKind(edge.kind);
  const kindMeta = EDGE_KINDS.find(k => k.value === kind) || EDGE_KINDS[0];
  const annotations = Array.isArray(edge.annotations) ? edge.annotations : [];

  const patch = (p) => onUpdateEdge(edge.id, p);

  const addAnnotation = (ann) => {
    const nowIso = new Date().toISOString();
    const next = [...annotations, { id: `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,5)}`, created_at: nowIso, ...ann }];
    patch({ annotations: next });
  };
  const removeAnnotation = (id) => {
    patch({ annotations: annotations.filter(a => a.id !== id) });
  };

  const narrateEdge = async () => {
    if (narrating) return;
    setNarrating(true);
    const prompt = `In one or two sentences, narrate this edge for the workflow "${workflow.name}":

From: ${src ? src.label : edge.src} (${src ? src.role + "/" + src.kind : "unknown"})
To:   ${dst ? dst.label : edge.dst} (${dst ? dst.role + "/" + dst.kind : "unknown"})
Kind: ${kind}
Label: ${edge.label || "(none)"}
${edge.transform ? "Transform: " + edge.transform + "\n" : ""}${edge.filter ? "Filter: " + edge.filter + "\n" : ""}${edge.readPattern ? "Read pattern: " + edge.readPattern + "\n" : ""}${edge.condition ? "Condition: " + edge.condition + "\n" : ""}${edge.eventName ? "Event: " + edge.eventName + "\n" : ""}
What does this edge DO? What moves across it, when, and why?`;
    try {
      const ai = window.SecretaryAI;
      const configured = ai && ai.isConfigured && ai.isConfigured();
      if (ai && typeof ai.ask === "function" && configured) {
        const text = await ai.ask(prompt, { register: "narrative" });
        patch({ narration: (text || "").trim() || "(Rodbot returned an empty response.)", narrated_at: new Date().toISOString() });
      } else if (ai && typeof ai.respond === "function" && configured) {
        const { text } = await ai.respond({ input: prompt, instructions: "You are Rodbot. Warm, concrete, direct. 1-3 sentences. No preamble." });
        patch({ narration: (text || "").trim() || "(Rodbot returned an empty response.)", narrated_at: new Date().toISOString() });
      } else {
        patch({ narration: "No AI provider configured — open Settings → Intelligence to wire Rodbot.", narrated_at: new Date().toISOString() });
      }
    } catch (e) {
      patch({ narration: "Narration failed: " + (e && e.message ? e.message : "unknown"), narrated_at: new Date().toISOString() });
    } finally {
      setNarrating(false);
    }
  };

  const inputStyle = { background: "var(--paper-card-2)", border: "1px solid var(--rule)", borderRadius: 6, padding: "4px 8px", color: "var(--ink)", font: "inherit", fontSize: 12, width: "100%" };
  const taStyle = { ...inputStyle, resize: "vertical", minHeight: 60, fontFamily: "var(--font-mono, ui-monospace)", fontSize: 11.5 };

  return (
    <aside className="ag-panel right">
      <div className="ag-panel-header">
        <h3>Edge</h3>
        <div className="actions">
          {onSaveAsPattern && (
            <button
              className="chip ghost sm"
              onClick={() => onSaveAsPattern(edge.id)}
              title="Save this edge as a reusable pattern in the Catalog"
            >Save as pattern</button>
          )}
          <button className="chip ghost sm" onClick={() => onDeleteEdge(edge.id)} title="Delete edge">Delete</button>
          {onClose && (
            <button className="chip ghost sm" onClick={onClose} title="Collapse inspector (I)">Hide</button>
          )}
        </div>
      </div>
      <div className="ag-panel-scroll">
        {/* Identity */}
        <div className="ag-i-ident">
          <div className="icon" style={{color: `var(--ag-${kind === "trigger" ? "trigger" : kind === "conditional" ? "state" : "text-3"})`}}>
            <span>{kindMeta.glyph}</span>
          </div>
          <div>
            <div className="name">
              <button className="ag-edge-peer" onClick={() => src && onSelectNode(src.id)} style={{background:"none",border:"none",padding:0,color:"var(--ink)",cursor:"pointer",font:"inherit"}}>{src ? src.label : "(?)"}</button>
              <span style={{opacity:0.6, margin:"0 6px"}}>→</span>
              <button className="ag-edge-peer" onClick={() => dst && onSelectNode(dst.id)} style={{background:"none",border:"none",padding:0,color:"var(--ink)",cursor:"pointer",font:"inherit"}}>{dst ? dst.label : "(?)"}</button>
            </div>
            <div className="type">{kindMeta.label.toLowerCase()} · {kindMeta.sub}</div>
          </div>
        </div>

        {/* Core fields */}
        <div className="ag-i-section">
          <div className="ag-i-section-title">Identity</div>
          <div className="ag-i-row"><span className="k">id</span><span className="v" style={{fontFamily:"var(--font-mono, ui-monospace)", fontSize:10.5}}>{edge.id}</span></div>
          <div className="ag-i-row">
            <span className="k">kind</span>
            <select
              className="v"
              value={kind}
              onChange={(e) => patch({ kind: e.target.value })}
              style={inputStyle}
            >
              {EDGE_KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
            </select>
          </div>
          <div className="ag-i-row">
            <span className="k">label</span>
            <input
              className="v"
              value={edge.label || ""}
              placeholder="short name shown on the edge"
              onChange={(e) => patch({ label: e.target.value })}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Description — one-liner for the walkthrough narrator bar and
            the future storybook view. Distinct from the auto-generated
            narration below. */}
        <div className="ag-i-section">
          <div className="ag-i-section-title">Description</div>
          <input
            value={edge.description || ""}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="What crosses this edge, in one line…"
            style={inputStyle}
          />
          <div style={{fontSize:10.5, color:"var(--ink-4)", marginTop:4, lineHeight:1.45}}>
            Shown in the narrator bar when the walkthrough reaches this edge. Rodbot's narration below is a longer, generated fallback.
          </div>
        </div>

        {/* Kind-specific config */}
        {kind === "data" && (
          <div className="ag-i-section">
            <div className="ag-i-section-title">Data payload</div>
            <div style={{display:"flex", flexDirection:"column", gap:6}}>
              <label style={{fontSize:10, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.1em"}}>Transform</label>
              <textarea value={edge.transform || ""} onChange={(e) => patch({ transform: e.target.value })} placeholder="e.g. x => ({ summary: x.body.slice(0, 200) })" style={taStyle} />
              <label style={{fontSize:10, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.1em"}}>Filter</label>
              <textarea value={edge.filter || ""} onChange={(e) => patch({ filter: e.target.value })} placeholder="e.g. x => x.priority >= 'high'" style={taStyle} />
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:6}}>
                <div>
                  <label style={{fontSize:10, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.1em"}}>Rate limit</label>
                  <input value={edge.rateLimit || ""} onChange={(e) => patch({ rateLimit: e.target.value })} placeholder="10/min" style={inputStyle} />
                </div>
                <div>
                  <label style={{fontSize:10, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.1em"}}>Debounce (ms)</label>
                  <input type="number" value={edge.debounce ?? ""} onChange={(e) => patch({ debounce: e.target.value === "" ? null : Number(e.target.value) })} placeholder="250" style={inputStyle} />
                </div>
              </div>
            </div>
          </div>
        )}

        {kind === "reference" && (
          <div className="ag-i-section">
            <div className="ag-i-section-title">Reference</div>
            <label style={{fontSize:10, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.1em"}}>Read pattern</label>
            <input value={edge.readPattern || ""} onChange={(e) => patch({ readPattern: e.target.value })} placeholder="e.g. tail 100 · last 24h · by:status=open" style={inputStyle} />
            <div style={{fontSize:11, color:"var(--ink-4)", marginTop:6, lineHeight:1.4}}>
              References describe <em>awareness</em>, not data movement. The source knows about the destination — useful for lookups, context, smart-view bindings.
            </div>
          </div>
        )}

        {kind === "trigger" && (
          <div className="ag-i-section">
            <div className="ag-i-section-title">Trigger</div>
            <label style={{fontSize:10, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.1em"}}>Event name</label>
            <input value={edge.eventName || ""} onChange={(e) => patch({ eventName: e.target.value })} placeholder="e.g. fire · on_new_lead · 6am_sweep" style={inputStyle} />
            <div style={{fontSize:11, color:"var(--ink-4)", marginTop:6, lineHeight:1.4}}>
              Triggers fire the downstream node. No payload transformation — the edge itself is the signal.
            </div>
          </div>
        )}

        {kind === "conditional" && (
          <div className="ag-i-section">
            <div className="ag-i-section-title">Conditional</div>
            <label style={{fontSize:10, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.1em"}}>Condition (true branch)</label>
            <textarea value={edge.condition || ""} onChange={(e) => patch({ condition: e.target.value })} placeholder="e.g. result.score > 0.7" style={taStyle} />
            <label style={{fontSize:10, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.1em", marginTop:6}}>False-path target</label>
            <select
              value={edge.falsePathTarget || ""}
              onChange={(e) => patch({ falsePathTarget: e.target.value || null })}
              style={inputStyle}
            >
              <option value="">(none — falls through)</option>
              {workflow.nodes.filter(n => n.id !== edge.src).map(n => (
                <option key={n.id} value={n.id}>{n.label} · {n.role}</option>
              ))}
            </select>
            <div style={{fontSize:11, color:"var(--ink-4)", marginTop:6, lineHeight:1.4}}>
              When the condition is false, payload is routed to the false-path target instead of the normal destination.
            </div>
          </div>
        )}

        {/* Annotations */}
        <div className="ag-i-section">
          <div className="ag-i-section-title">
            Annotations
            <span style={{marginLeft:6, fontSize:10, color:"var(--ink-4)"}}>({annotations.length})</span>
          </div>
          {annotations.length === 0 && !draftAnno && (
            <div style={{fontSize:11.5, color:"var(--ink-4)", fontStyle:"italic", padding:"4px 0 6px"}}>
              No annotations yet. Attach a note, a reference URL, or a screenshot to explain this edge.
            </div>
          )}
          {annotations.map(a => (
            <div key={a.id} className="ag-edge-anno" style={{border:"1px solid var(--rule)", borderRadius:6, padding:"6px 8px", marginBottom:6, background:"var(--paper-card-2)"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2}}>
                <span style={{fontSize:9.5, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.1em"}}>{a.type}</span>
                <button onClick={() => removeAnnotation(a.id)} style={{background:"none", border:"none", color:"var(--ink-4)", cursor:"pointer", fontSize:11, padding:"0 2px"}} title="Remove">×</button>
              </div>
              {a.type === "note" && <div style={{fontSize:12, color:"var(--ink)", whiteSpace:"pre-wrap"}}>{a.text}</div>}
              {a.type === "reference" && (
                <div style={{fontSize:11.5}}>
                  {a.text && <div style={{color:"var(--ink)", marginBottom:2}}>{a.text}</div>}
                  {a.href && <a href={a.href} target="_blank" rel="noreferrer" style={{color:"var(--ember)", textDecoration:"none", wordBreak:"break-all"}}>{a.href}</a>}
                </div>
              )}
              {a.type === "screenshot" && (
                <div style={{fontSize:11.5, color:"var(--ink-3)", fontStyle:"italic"}}>
                  Screenshot · {a.regions ? `${a.regions.length} region(s)` : "no regions"}
                  {a.hash && <span style={{display:"block", fontFamily:"var(--font-mono, ui-monospace)", fontSize:10, color:"var(--ink-4)", marginTop:2}}>sha256:{a.hash.slice(0,12)}…</span>}
                </div>
              )}
            </div>
          ))}
          {draftAnno && (
            <div style={{border:"1px solid var(--ember)", borderRadius:6, padding:"8px", marginBottom:6, background:"var(--paper-card-2)"}}>
              <div style={{fontSize:9.5, color:"var(--ember)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:4}}>new {draftAnno.type}</div>
              {draftAnno.type === "note" && (
                <textarea
                  autoFocus
                  value={draftAnno.text || ""}
                  onChange={(e) => setDraftAnno({ ...draftAnno, text: e.target.value })}
                  placeholder="Explain the edge, caveats, the reason it exists…"
                  style={taStyle}
                />
              )}
              {draftAnno.type === "reference" && (
                <div style={{display:"flex", flexDirection:"column", gap:4}}>
                  <input autoFocus value={draftAnno.text || ""} onChange={(e) => setDraftAnno({ ...draftAnno, text: e.target.value })} placeholder="Label (optional)" style={inputStyle} />
                  <input value={draftAnno.href || ""} onChange={(e) => setDraftAnno({ ...draftAnno, href: e.target.value })} placeholder="https://…" style={inputStyle} />
                </div>
              )}
              <div style={{display:"flex", gap:6, marginTop:6, justifyContent:"flex-end"}}>
                <button className="chip ghost sm" onClick={() => setDraftAnno(null)}>Cancel</button>
                <button
                  className="chip ember sm"
                  onClick={() => {
                    if (draftAnno.type === "note" && !(draftAnno.text || "").trim()) return;
                    if (draftAnno.type === "reference" && !(draftAnno.text || draftAnno.href || "").trim()) return;
                    addAnnotation(draftAnno);
                    setDraftAnno(null);
                  }}
                >Save</button>
              </div>
            </div>
          )}
          {!draftAnno && (
            <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
              <button className="chip ghost sm" onClick={() => setDraftAnno({ type: "note", text: "" })}>+ Note</button>
              <button className="chip ghost sm" onClick={() => setDraftAnno({ type: "reference", text: "", href: "" })}>+ Reference</button>
              {onOpenAnnotator ? (
                <button
                  className="chip ghost sm"
                  onClick={() => onOpenAnnotator(edge.id)}
                  title="Paste or upload an image, then draw boxes/points to anchor annotations"
                >+ Screenshot</button>
              ) : (
                <button className="chip ghost sm" disabled title="Screenshot annotator unavailable" style={{opacity:0.45, cursor:"not-allowed"}}>+ Screenshot</button>
              )}
            </div>
          )}
        </div>

        {/* Narration */}
        <div className="ag-i-section">
          <div className="ag-i-section-title">Rodbot narration</div>
          {edge.narration ? (
            <div style={{fontSize:12, color:"var(--ink)", fontStyle:"italic", lineHeight:1.5, padding:"4px 0 6px", borderLeft:"2px solid var(--event-commit)", paddingLeft:10}}>
              {edge.narration}
              {edge.narrated_at && <div style={{fontSize:10, color:"var(--ink-4)", marginTop:4, fontStyle:"normal"}}>— {new Date(edge.narrated_at).toLocaleString()}</div>}
            </div>
          ) : (
            <div style={{fontSize:11.5, color:"var(--ink-4)", fontStyle:"italic", padding:"4px 0 6px"}}>
              Ask Rodbot to explain what this edge does in the wider workflow.
            </div>
          )}
          <button className="chip ghost sm" onClick={narrateEdge} disabled={narrating} style={{marginTop:4}}>
            {narrating ? "Narrating…" : (edge.narration ? "Regenerate narration" : "Explain this edge")}
          </button>
        </div>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Rodbot dispatcher — keyword fast-path, LLM fallback via SecretaryAI
// ═══════════════════════════════════════════════════════════════════════════
function tryKeywordParse(text, workflow) {
  const t = text.toLowerCase().trim();
  // "add <role>" / "add <kind>"
  const roleMatch = t.match(/^\s*(?:add|create|insert|new)\s+(trigger|actor|transform|sink|state|rodbot|inbox|ledger|slack|slack_post|webhook|cron|reflect|llm_call|human|memory)\b/);
  if (roleMatch) {
    const token = roleMatch[1];
    const byKind = KIND_TABLE[token];
    if (byKind) {
      return {
        role: "ai",
        text: `Adding a ${byKind.role} node (${byKind.label}).`,
        ops: [{ verb: "add_node", role: byKind.role, kind: token }],
      };
    }
    if (["trigger","actor","transform","sink","state"].includes(token)) {
      const first = LIBRARY.find(s => s.role === token).items[0];
      return {
        role: "ai",
        text: `Adding a default ${token} (${first.label}).`,
        ops: [{ verb: "add_node", role: token, kind: first.kind }],
      };
    }
  }
  // "explain" / "describe"
  if (/^(explain|describe|walk\s*through|summary|summarize)\b/.test(t)) {
    const counts = {};
    workflow.nodes.forEach(n => { counts[n.role] = (counts[n.role] || 0) + 1; });
    const summary = Object.entries(counts).map(([r, c]) => `${c} ${r}${c>1?"s":""}`).join(", ");
    const triggers = workflow.nodes.filter(n => n.role === "trigger").map(n => n.label).join(" + ") || "(no trigger)";
    const sinks = workflow.nodes.filter(n => n.role === "sink").map(n => n.label).join(", ") || "(no sink)";
    return {
      role: "ai",
      text: `"${workflow.name}" — ${summary}. Starts with ${triggers}, ends at ${sinks}. ${workflow.connections.length} connections total.`,
    };
  }
  // "missing" / "gaps"
  if (/^(missing|gap|gaps|wrong|broken|audit|check|problems)\b/.test(t) || /what\'?s\s+missing/.test(t)) {
    const issues = [];
    if (!workflow.nodes.some(n => n.role === "trigger")) issues.push("no trigger — this workflow will never fire");
    if (!workflow.nodes.some(n => n.role === "sink")) issues.push("no sink — nothing receives the result");
    workflow.nodes.forEach(n => {
      const hasIn = workflow.connections.some(c => c.dst === n.id);
      const hasOut = workflow.connections.some(c => c.src === n.id);
      if (!hasIn && !hasOut && workflow.nodes.length > 1) issues.push(`"${n.label}" is orphaned`);
    });
    return {
      role: "ai",
      text: issues.length ? "Gaps I see:\n• " + issues.join("\n• ") : "Looks structurally sound to me. No obvious gaps.",
    };
  }
  return null;
}

function buildRodbotSystemPrompt(workflow) {
  const allKinds = LIBRARY.map(sec => `  ${sec.role}: ${sec.items.map(i => i.kind).join(", ")}`).join("\n");
  const nodeList = workflow.nodes.map(n => `  - ${n.id}: ${n.role}/${n.kind} "${n.label}"`).join("\n") || "  (no nodes yet)";
  const connList = workflow.connections.map(c => `  - ${c.id}: ${c.src} -> ${c.dst} (${c.kind})`).join("\n") || "  (no connections yet)";
  return [
    "You are Rodbot, helping Jake compose a workflow graph in a visual editor.",
    "You speak in the Rodbot register: warm, concrete, direct. No fluff, no preamble.",
    "",
    "The workflow has a strict schema:",
    "- Nodes have: id, role (actor|trigger|transform|sink|state), kind, label",
    "- Connections have: id, src (node id), dst (node id), kind (data|observe|live)",
    "",
    "Available kinds per role:",
    allKinds,
    "",
    "Current workflow state:",
    `Name: "${workflow.name}"`,
    "Nodes:",
    nodeList,
    "Connections:",
    connList,
    "",
    "RESPOND WITH STRICT JSON ONLY. No prose outside the JSON. Shape:",
    '{',
    '  "text": "brief conversational reply, 1-2 sentences, Rodbot voice",',
    '  "ops":  [ /* zero or more ops to apply */ ]',
    '}',
    "",
    "Valid ops (pick from these verbs — nothing else):",
    '  {"verb":"add_node","role":"<role>","kind":"<kind>","label":"<optional label>"}',
    '  {"verb":"delete_node","id":"<node_id>"}',
    '  {"verb":"add_connection","src":"<node_id>","dst":"<node_id>","kind":"data|observe|live"}',
    "",
    "Rules:",
    "- For pure analysis/explanation requests, set ops to [].",
    "- Only reference existing node ids in delete_node / add_connection src/dst.",
    "- Be conservative: if the ask is ambiguous, set ops to [] and explain in text.",
    "- If the user asks to connect two nodes, emit add_connection(src, dst, 'data').",
  ].join("\n");
}

function extractJSONLoose(text) {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1] : text;
  let depth = 0, start = -1;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "{") { if (depth === 0) start = i; depth++; }
    else if (ch === "}") {
      depth--;
      if (depth === 0 && start >= 0) {
        try { return JSON.parse(body.slice(start, i + 1)); } catch {}
        start = -1;
      }
    }
  }
  return null;
}

async function dispatchRodbot(text, workflow) {
  // 1) Fast keyword path
  const fast = tryKeywordParse(text, workflow);
  if (fast) return fast;

  // 2) LLM path via SecretaryAI
  if (!window.SecretaryAI || !window.SecretaryAI.isConfigured || !window.SecretaryAI.isConfigured()) {
    return {
      role: "ai",
      text: "No AI provider available. Try 'add trigger', 'add rodbot', 'explain', or 'what's missing'. Or open Settings to configure an AI provider.",
    };
  }
  try {
    const systemPrompt = buildRodbotSystemPrompt(workflow);
    const { text: reply } = await window.SecretaryAI.respond({
      input: text,
      instructions: systemPrompt,
    });
    const parsed = extractJSONLoose(reply);
    if (!parsed) {
      return { role: "ai", text: (reply || "(empty reply)").trim().slice(0, 600) };
    }
    return { role: "ai", text: (parsed.text || "").trim(), ops: Array.isArray(parsed.ops) ? parsed.ops : [] };
  } catch (e) {
    return { role: "ai", text: `Rodbot error: ${e.message || e}` };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// RodbotGraphRail — collapsible chat (real dispatch + fast-path)
// ═══════════════════════════════════════════════════════════════════════════
function RodbotGraphRail({ workflow, onAddNode, onDeleteNode, onAddConnection, onClose, selectedEdge, onSaveAsPattern }) {
  const [turns, setTurns] = ag_useState([
    { role: "sys", text: "Rodbot ready. Try 'add trigger', 'explain this workflow', or ask me anything about the graph." },
  ]);
  const [draft, setDraft] = ag_useState("");
  const [busy, setBusy] = ag_useState(false);
  const streamRef = ag_useRef(null);

  ag_useEffect(() => {
    if (streamRef.current) streamRef.current.scrollTop = streamRef.current.scrollHeight;
  }, [turns.length, busy]);

  const applyOps = ag_useCallback((ops) => {
    if (!Array.isArray(ops)) return;
    for (const op of ops) {
      if (!op || typeof op !== "object") continue;
      if (op.verb === "add_node" && op.role && op.kind) {
        const tmpl = KIND_TABLE[op.kind];
        if (!tmpl) continue;
        const withLabel = op.label ? { ...tmpl, label: op.label } : tmpl;
        onAddNode(op.role, withLabel);
      } else if (op.verb === "delete_node" && op.id) {
        onDeleteNode(op.id);
      } else if (op.verb === "add_connection" && op.src && op.dst) {
        onAddConnection(op.src, op.dst, op.kind || "data");
      }
    }
  }, [onAddNode, onDeleteNode, onAddConnection]);

  const send = async (text) => {
    if (!text || !text.trim() || busy) return;
    const userTurn = { role: "me", text: text.trim() };
    setTurns(prev => [...prev, userTurn]);
    setDraft("");
    setBusy(true);
    try {
      const reply = await dispatchRodbot(text.trim(), workflow);
      setTurns(prev => [...prev, reply]);
      if (reply.ops && reply.ops.length) applyOps(reply.ops);
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(draft); }
  };

  // Edge-focused helpers — when an edge is selected in the inspector, the
  // rail surfaces actions scoped to THAT edge. Free-form chat still works.
  const explainEdge = async () => {
    if (!selectedEdge || busy) return;
    const src = workflow.nodes.find(n => n.id === selectedEdge.src);
    const dst = workflow.nodes.find(n => n.id === selectedEdge.dst);
    const kind = normalizeEdgeKind(selectedEdge.kind);
    const payload = [
      selectedEdge.transform   ? "transform: " + selectedEdge.transform : "",
      selectedEdge.filter      ? "filter: " + selectedEdge.filter : "",
      selectedEdge.readPattern ? "read pattern: " + selectedEdge.readPattern : "",
      selectedEdge.condition   ? "condition: " + selectedEdge.condition : "",
      selectedEdge.eventName   ? "event: " + selectedEdge.eventName : "",
    ].filter(Boolean).join(" · ");
    const meText = `Explain the edge from "${src ? src.label : selectedEdge.src}" to "${dst ? dst.label : selectedEdge.dst}" (${kind})${selectedEdge.label ? ` — label "${selectedEdge.label}"` : ""}${payload ? ` [${payload}]` : ""}.`;
    setTurns(prev => [...prev, { role: "me", text: meText }]);
    setBusy(true);
    try {
      const ai = window.SecretaryAI;
      const configured = ai && ai.isConfigured && ai.isConfigured();
      const prompt = `In two or three sentences, plainly narrate this edge so Jake understands what moves across it, when, and why.\n\nWorkflow: ${workflow.name}\nFrom: ${src ? src.label : selectedEdge.src} (${src ? src.role + "/" + src.kind : "unknown"})\nTo:   ${dst ? dst.label : selectedEdge.dst} (${dst ? dst.role + "/" + dst.kind : "unknown"})\nKind: ${kind}\n${payload ? "Payload details: " + payload : ""}\nLabel: ${selectedEdge.label || "(none)"}`;
      if (ai && typeof ai.ask === "function" && configured) {
        const text = await ai.ask(prompt, { register: "narrative" });
        setTurns(prev => [...prev, { role: "ai", text: (text || "").trim() || "(Rodbot returned an empty response.)" }]);
      } else if (ai && typeof ai.respond === "function" && configured) {
        const { text } = await ai.respond({ input: prompt, instructions: "You are Rodbot. Warm, concrete, direct. 2-3 sentences." });
        setTurns(prev => [...prev, { role: "ai", text: (text || "").trim() || "(Rodbot returned an empty response.)" }]);
      } else {
        setTurns(prev => [...prev, { role: "ai", text: `This is a ${kind} edge from ${src ? src.label : "?"} to ${dst ? dst.label : "?"}. No AI provider configured — open Settings → Intelligence to wire Rodbot.` }]);
      }
    } catch (e) {
      setTurns(prev => [...prev, { role: "ai", text: `Narration failed: ${e && e.message ? e.message : "unknown"}` }]);
    } finally {
      setBusy(false);
    }
  };

  const suggestAnnotations = async () => {
    if (!selectedEdge || busy) return;
    const src = workflow.nodes.find(n => n.id === selectedEdge.src);
    const dst = workflow.nodes.find(n => n.id === selectedEdge.dst);
    const kind = normalizeEdgeKind(selectedEdge.kind);
    setTurns(prev => [...prev, { role: "me", text: `Suggest annotations for the ${kind} edge ${src ? src.label : "?"} → ${dst ? dst.label : "?"}.` }]);
    setBusy(true);
    try {
      const ai = window.SecretaryAI;
      const configured = ai && ai.isConfigured && ai.isConfigured();
      const prompt = `Suggest 2-4 short annotation ideas for this edge — things Jake should document so future-Jake understands what's moving here and why. Each idea: one line, punchy, referenceable.\n\nEdge: ${src ? src.label : "?"} → ${dst ? dst.label : "?"} (${kind})\nLabel: ${selectedEdge.label || "(none)"}\n${selectedEdge.transform ? "Transform: " + selectedEdge.transform + "\n" : ""}${selectedEdge.filter ? "Filter: " + selectedEdge.filter + "\n" : ""}${selectedEdge.condition ? "Condition: " + selectedEdge.condition + "\n" : ""}${selectedEdge.eventName ? "Event: " + selectedEdge.eventName + "\n" : ""}Return as bullet list.`;
      if (ai && typeof ai.ask === "function" && configured) {
        const text = await ai.ask(prompt, { register: "bullets" });
        setTurns(prev => [...prev, { role: "ai", text: (text || "").trim() || "(no suggestions)" }]);
      } else if (ai && typeof ai.respond === "function" && configured) {
        const { text } = await ai.respond({ input: prompt, instructions: "Respond as a tight bullet list. One idea per line." });
        setTurns(prev => [...prev, { role: "ai", text: (text || "").trim() || "(no suggestions)" }]);
      } else {
        const ideas = [
          `• Why this edge exists — what breaks if it's removed`,
          `• What triggers it in practice (observed cases, not just theory)`,
          kind === "data"      ? `• Shape of the payload, with a sample` : null,
          kind === "conditional" ? `• The exact cases where the condition flips false` : null,
          kind === "trigger"   ? `• Expected frequency — how often this fires` : null,
          kind === "reference" ? `• What's read, and the cache/freshness policy` : null,
          `• Screenshot of the source UI where the payload originates`,
        ].filter(Boolean);
        setTurns(prev => [...prev, { role: "ai", text: ideas.join("\n") }]);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="ag-panel rail" style={{position:"relative"}}>
      <div className="ag-panel-header">
        <h3>Rodbot · graph</h3>
        <div className="actions">
          <button className="chip ghost sm" onClick={onClose}>Close</button>
        </div>
      </div>

      {selectedEdge && (() => {
        const src = workflow.nodes.find(n => n.id === selectedEdge.src);
        const dst = workflow.nodes.find(n => n.id === selectedEdge.dst);
        const kind = normalizeEdgeKind(selectedEdge.kind);
        return (
          <div className="ag-rbt-edgecard" data-kind={kind}>
            <div className="ag-rbt-edgecard-row">
              <span className="ag-rbt-edgecard-kind">{kind}</span>
              <span className="ag-rbt-edgecard-peers">
                {src ? src.label : "?"} <span style={{opacity:0.5, margin:"0 4px"}}>→</span> {dst ? dst.label : "?"}
              </span>
            </div>
            {selectedEdge.label && (
              <div className="ag-rbt-edgecard-label">{selectedEdge.label}</div>
            )}
            <div className="ag-rbt-edgecard-actions">
              <button className="hint" onClick={explainEdge} disabled={busy}>Explain this edge</button>
              <button className="hint" onClick={suggestAnnotations} disabled={busy}>Suggest annotations</button>
              {onSaveAsPattern && (
                <button className="hint" onClick={() => onSaveAsPattern(selectedEdge.id)} disabled={busy}>Save as pattern</button>
              )}
            </div>
          </div>
        );
      })()}

      <div className="ag-rbt-stream" ref={streamRef}>
        {turns.map((t, i) => (
          <div key={i} className={"ag-rbt-turn " + t.role}>
            {t.text}
            {t.ops && t.ops.length > 0 && (
              <div className="op-list">
                {t.ops.map((op, j) => (
                  <div key={j} className="op">{op.verb}{op.role ? " · " + op.role : ""}{op.kind ? " · " + op.kind : ""}{op.id ? " · " + op.id : ""}{op.src ? " · " + op.src + " → " + op.dst : ""}</div>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && <div className="ag-rbt-turn sys">thinking…</div>}
      </div>
      <div className="ag-rbt-hints">
        {["add trigger", "add rodbot", "explain this workflow", "what's missing?"].map(h => (
          <button key={h} className="hint" onClick={() => send(h)} disabled={busy}>{h}</button>
        ))}
      </div>
      <div className="ag-rbt-input">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder="Ask Rodbot to wire something…"
          rows={2}
          disabled={busy}
        />
        <button className="chip accent sm" onClick={() => send(draft)} disabled={!draft.trim() || busy}>Send</button>
      </div>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HelpOverlay
// ═══════════════════════════════════════════════════════════════════════════
function HelpOverlay({ onClose }) {
  return (
    <div className="ag-help-overlay" onMouseDown={onClose}>
      <div className="ag-help-card" onMouseDown={(e) => e.stopPropagation()}>
        <h3>Automation Graph · shortcuts</h3>
        <div className="row"><span className="k">drag library item</span><span className="v">Drop onto canvas to place a new node</span></div>
        <div className="row"><span className="k">drag node</span><span className="v">Move it on the canvas</span></div>
        <div className="row"><span className="k">drag empty canvas</span><span className="v">Marquee-select nodes inside the rect</span></div>
        <div className="row"><span className="k">drag endpoint</span><span className="v">Wire two nodes (release over target)</span></div>
        <div className="row"><span className="k">shift-click node</span><span className="v">Toggle node in the selection</span></div>
        <div className="row"><span className="k"><kbd>Space</kbd>+drag</span><span className="v">Pan the canvas</span></div>
        <div className="row"><span className="k"><kbd>⌘</kbd>/<kbd>Ctrl</kbd>+wheel</span><span className="v">Zoom (40%–200%)</span></div>
        <div className="row"><span className="k"><kbd>⌘</kbd>+<kbd>=</kbd> / <kbd>-</kbd></span><span className="v">Zoom in / out</span></div>
        <div className="row"><span className="k"><kbd>⌘</kbd>+<kbd>A</kbd></span><span className="v">Select all nodes</span></div>
        <div className="row"><span className="k"><kbd>⌘</kbd>+<kbd>S</kbd></span><span className="v">Save workflow to disk</span></div>
        <div className="row"><span className="k"><kbd>⌘</kbd>+<kbd>Z</kbd></span><span className="v">Undo last change</span></div>
        <div className="row"><span className="k"><kbd>⌘</kbd>+<kbd>⇧</kbd>+<kbd>Z</kbd></span><span className="v">Redo</span></div>
        <div className="row"><span className="k"><kbd>F</kbd></span><span className="v">Fit workflow to view</span></div>
        <div className="row"><span className="k"><kbd>R</kbd></span><span className="v">Reset view (100%, centered)</span></div>
        <div className="row"><span className="k"><kbd>Esc</kbd></span><span className="v">Cancel drag / deselect / close overlays</span></div>
        <div className="row"><span className="k"><kbd>Delete</kbd></span><span className="v">Remove selected node(s)</span></div>
        <div className="row"><span className="k"><kbd>L</kbd> / <kbd>I</kbd> / <kbd>K</kbd></span><span className="v">Toggle library / inspector / Rodbot rail</span></div>
        <div className="row"><span className="k"><kbd>?</kbd></span><span className="v">This help sheet</span></div>
        <button className="ag-help-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Edge taxonomy (Apr 2026) — four canonical kinds. Edges are first-class
// objects that carry payload: labels, transforms, conditions, annotations,
// Rodbot narration. Legacy "observe" maps to "reference"; transient "live"
// falls back to "data" (the firing animation now handles live-flow feel).
// ═══════════════════════════════════════════════════════════════════════════
const EDGE_KINDS = [
  { value: "data",        label: "Data",        sub: "moves a payload",       glyph: "→" },
  { value: "reference",   label: "Reference",   sub: "knows about",           glyph: "⇢" },
  { value: "trigger",     label: "Trigger",     sub: "fires downstream",      glyph: "⚡" },
  { value: "conditional", label: "Conditional", sub: "branches on a test",    glyph: "◇" },
];
const EDGE_KIND_SET = new Set(EDGE_KINDS.map(k => k.value));

function normalizeEdgeKind(kind) {
  if (!kind) return "data";
  if (EDGE_KIND_SET.has(kind)) return kind;
  if (kind === "observe") return "reference";
  if (kind === "live")    return "data";
  return "data";
}

// ═══════════════════════════════════════════════════════════════════════════
// Export — canonical JSON, file download, clipboard
// ═══════════════════════════════════════════════════════════════════════════
function serializeWorkflow(workflow) {
  const clean = {
    schema: "comeketo.automation_graph.v1",
    id: workflow.id,
    slug: workflow.slug || slugify(workflow.name),
    name: workflow.name,
    nodes: workflow.nodes.map(n => {
      const out = {
        id: n.id, role: n.role, kind: n.kind, label: n.label,
        x: Math.round(n.x), y: Math.round(n.y),
        config: n.config || {}, notes: n.notes || "",
      };
      if (n.description) out.description = n.description;
      if (Array.isArray(n.annotations) && n.annotations.length) out.annotations = n.annotations;
      return out;
    }),
    connections: workflow.connections.map(c => {
      // Start with the canonical edge spine, then splice in only the
      // kind-specific fields that are present. Keeps exports lean while
      // the first-class edge payload picks up weight over time.
      const out = {
        id: c.id, src: c.src, dst: c.dst, kind: normalizeEdgeKind(c.kind),
      };
      if (c.label)          out.label = c.label;
      if (c.description)    out.description = c.description;
      if (c.transform)      out.transform = c.transform;
      if (c.filter)         out.filter = c.filter;
      if (c.readPattern)    out.readPattern = c.readPattern;
      if (c.rateLimit)      out.rateLimit = c.rateLimit;
      if (c.debounce != null) out.debounce = c.debounce;
      if (c.condition)      out.condition = c.condition;
      if (c.falsePathTarget) out.falsePathTarget = c.falsePathTarget;
      if (c.eventName)      out.eventName = c.eventName;
      if (Array.isArray(c.annotations) && c.annotations.length) out.annotations = c.annotations;
      if (c.narration)      out.narration = c.narration;
      if (c.created_at)     out.created_at = c.created_at;
      if (c.last_modified)  out.last_modified = c.last_modified;
      return out;
    }),
    metadata: {
      ...(workflow.metadata || {}),
      last_modified: new Date().toISOString(),
      version: (workflow.metadata && workflow.metadata.version) || 1,
    },
  };
  return JSON.stringify(clean, null, 2);
}

function slugify(s) {
  return (s || "untitled").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "workflow";
}

function downloadFile(filename, text) {
  try {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    return true;
  } catch (e) { console.warn("[ag] download failed:", e); return false; }
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text); return true;
    }
  } catch {}
  return false;
}

function genId(prefix) { return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

// ═══════════════════════════════════════════════════════════════════════════
// AutomationGraphScreen — top-level composition with undo stack
// ═══════════════════════════════════════════════════════════════════════════
function AutomationGraphScreen({ go, loadSlug }) {
  // ─── History stack: past + present + future ──────────────────────────────
  const [present, setPresent] = ag_useState(() => JSON.parse(JSON.stringify(DEMO_WORKFLOW)));
  const [past, setPast] = ag_useState([]);
  const [future, setFuture] = ag_useState([]);
  const workflow = present;

  // Call before any mutation that should be undoable. Clears redo stack.
  const snapshot = ag_useCallback(() => {
    setPast(p => [...p, present].slice(-40));
    setFuture([]);
  }, [present]);

  // Apply a mutation (with pre-snapshot).
  const commit = ag_useCallback((next) => {
    setPast(p => [...p, present].slice(-40));
    setFuture([]);
    setPresent(next);
  }, [present]);

  // Live update without history (used during drag for per-frame moves).
  const setLive = ag_useCallback((next) => setPresent(next), []);

  const undo = ag_useCallback(() => {
    setPast(p => {
      if (p.length === 0) return p;
      const prev = p[p.length - 1];
      setFuture(f => [present, ...f].slice(0, 40));
      setPresent(prev);
      return p.slice(0, -1);
    });
  }, [present]);

  const redo = ag_useCallback(() => {
    setFuture(f => {
      if (f.length === 0) return f;
      const next = f[0];
      setPast(p => [...p, present].slice(-40));
      setPresent(next);
      return f.slice(1);
    });
  }, [present]);

  // ─── Interaction state ───────────────────────────────────────────────────
  const [selectedId, setSelectedId] = ag_useState(null);
  const [viewport, setViewport] = ag_useState({ tx: 0, ty: 0, zoom: 1 });
  // Panel open/closed state — persisted to localStorage so layout sticks
  // across reloads. Defaults: library + inspector open, rail closed.
  const readPanelPref = (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      if (v === "1") return true;
      if (v === "0") return false;
    } catch {}
    return fallback;
  };
  const writePanelPref = (key, v) => { try { localStorage.setItem(key, v ? "1" : "0"); } catch {} };
  const [railOpen, _setRailOpen] = ag_useState(() => readPanelPref("ag:railOpen", false));
  const [libraryOpen, _setLibraryOpen] = ag_useState(() => readPanelPref("ag:libraryOpen", true));
  const [inspectorOpen, _setInspectorOpen] = ag_useState(() => readPanelPref("ag:inspectorOpen", true));
  const setRailOpen = ag_useCallback((v) => _setRailOpen(prev => {
    const next = typeof v === "function" ? v(prev) : v;
    writePanelPref("ag:railOpen", next);
    return next;
  }), []);
  const setLibraryOpen = ag_useCallback((v) => _setLibraryOpen(prev => {
    const next = typeof v === "function" ? v(prev) : v;
    writePanelPref("ag:libraryOpen", next);
    return next;
  }), []);
  const setInspectorOpen = ag_useCallback((v) => _setInspectorOpen(prev => {
    const next = typeof v === "function" ? v(prev) : v;
    writePanelPref("ag:inspectorOpen", next);
    return next;
  }), []);
  const [helpOpen, setHelpOpen] = ag_useState(false);
  const [toast, setToast] = ag_useState(null);
  // Canvas theme — "light" matches the rest of the app (pearl paper, ink
  // ink, dot grid); "dark" is the original near-black workflow composer.
  // Default light per Apr 2026 feedback: "wanna see what it looks like the
  // other way." Persist the choice so the preference sticks.
  const [canvasTheme, setCanvasTheme] = ag_useState(() => {
    try { return localStorage.getItem("ag:canvasTheme") || "light"; } catch { return "light"; }
  });
  const toggleCanvasTheme = ag_useCallback(() => {
    setCanvasTheme(t => {
      const next = t === "light" ? "dark" : "light";
      try { localStorage.setItem("ag:canvasTheme", next); } catch {}
      return next;
    });
  }, []);

  // ─── Play-through animation (Apr 2026 "watchable workflow" pass) ─────────
  // BFS from trigger nodes, advancing one wave at a time. Each wave lights
  // the nodes in that depth layer and the edges leading INTO them.
  const [firingNodes, setFiringNodes] = ag_useState(() => new Set());
  const [firingLinks, setFiringLinks] = ag_useState(() => new Set());
  const [playing, setPlaying] = ag_useState(false);
  const playCancelRef = ag_useRef(null);
  // Wave progress + total waves planned — powers the narrator bar's
  // "Step N of M" indicator. Updated inside playWorkflow as each wave fires.
  const [playWave, setPlayWave] = ag_useState({ current: 0, total: 0 });
  // Playback speed multiplier (0.5x / 1x / 1.5x / 2x). Scales the internal
  // sleep() durations so the walkthrough can slow down or speed up without
  // changing the choreography. Persisted across reloads.
  const [playSpeed, setPlaySpeedRaw] = ag_useState(() => {
    try { const v = parseFloat(localStorage.getItem("ag:playSpeed") || "1"); return isFinite(v) && v > 0 ? v : 1; } catch { return 1; }
  });
  const setPlaySpeed = ag_useCallback((v) => {
    setPlaySpeedRaw(v);
    try { localStorage.setItem("ag:playSpeed", String(v)); } catch {}
  }, []);
  // Continuous loop — when true, the walkthrough restarts from the triggers
  // after the final wave settles. Persisted.
  const [playLoop, setPlayLoopRaw] = ag_useState(() => {
    try { return localStorage.getItem("ag:playLoop") === "1"; } catch { return false; }
  });
  const setPlayLoop = ag_useCallback((v) => {
    setPlayLoopRaw(v);
    try { localStorage.setItem("ag:playLoop", v ? "1" : "0"); } catch {}
  }, []);
  // Playback mode — "auto" uses the internal timing; "step" pauses between
  // waves and waits for the user to hit Next (button / spacebar / →). Great
  // for narrating the workflow to stakeholders or just reading each
  // description before advancing. Persisted.
  const [playMode, setPlayModeRaw] = ag_useState(() => {
    try { return localStorage.getItem("ag:playMode") === "step" ? "step" : "auto"; } catch { return "auto"; }
  });
  const setPlayMode = ag_useCallback((v) => {
    const next = v === "step" ? "step" : "auto";
    setPlayModeRaw(next);
    try { localStorage.setItem("ag:playMode", next); } catch {}
  }, []);
  // Advance signal — when the play loop is waiting on a user step, it
  // parks on a promise whose resolver lives here. `requestAdvance` flushes
  // it. `requestRewind` resolves with {back:true} so the loop knows to
  // rebuild the previous wave. `stopPlay` also flushes with {cancelled:true}
  // so the loop exits cleanly instead of waiting forever.
  const advanceResolverRef = ag_useRef(null);
  const requestAdvance = ag_useCallback(() => {
    if (advanceResolverRef.current) {
      const r = advanceResolverRef.current;
      advanceResolverRef.current = null;
      r({ back: false });
    }
  }, []);
  const requestRewind = ag_useCallback(() => {
    if (advanceResolverRef.current) {
      const r = advanceResolverRef.current;
      advanceResolverRef.current = null;
      r({ back: true });
    }
  }, []);
  // Flags set by Next/Prev so the loop knows how to handle the resolved
  // promise even if the resolver has already been cleared.
  const rewindFlagRef = ag_useRef(false);

  const stopPlay = ag_useCallback(() => {
    if (playCancelRef.current) { playCancelRef.current.cancelled = true; playCancelRef.current = null; }
    // If the loop is parked waiting for Next, wake it so it can observe
    // the cancel flag and exit. Resolve with back:false; the loop checks
    // the token.cancelled first.
    if (advanceResolverRef.current) {
      const r = advanceResolverRef.current;
      advanceResolverRef.current = null;
      r({ back: false });
    }
    setFiringNodes(new Set());
    setFiringLinks(new Set());
    setPlaying(false);
    setPlayWave({ current: 0, total: 0 });
  }, []);

  const playWorkflow = ag_useCallback(async () => {
    if (playing) { stopPlay(); return; }
    const wf = present;
    if (!wf || !wf.nodes || wf.nodes.length === 0) return;

    // Build adjacency + indegree counts
    const incoming = new Map(); // dst → [connId, srcId][]
    const outgoing = new Map(); // src → [connId, dstId][]
    wf.nodes.forEach(n => { incoming.set(n.id, []); outgoing.set(n.id, []); });
    wf.connections.forEach(c => {
      if (!incoming.has(c.dst) || !outgoing.has(c.src)) return;
      incoming.get(c.dst).push([c.id, c.src]);
      outgoing.get(c.src).push([c.id, c.dst]);
    });

    // Start wave calculator: trigger role first, else zero-indegree, else
    // falls back to first node. Wrapped so the loop can re-seed cleanly.
    const seedWave = () => {
      let w = wf.nodes.filter(n => n.role === "trigger").map(n => n.id);
      if (w.length === 0) w = wf.nodes.filter(n => (incoming.get(n.id) || []).length === 0).map(n => n.id);
      if (w.length === 0) w = [wf.nodes[0].id];
      return w;
    };

    // Pre-compute total waves for the progress indicator (BFS layer count).
    const totalWaves = (() => {
      const visited = new Set();
      let w = seedWave();
      let count = 0;
      while (w.length > 0) {
        w.forEach(id => visited.add(id));
        const next = new Set();
        w.forEach(id => (outgoing.get(id) || []).forEach(([, dstId]) => {
          if (!visited.has(dstId)) next.add(dstId);
        }));
        w = Array.from(next);
        count++;
        if (count > 64) break; // cycle guard
      }
      return count;
    })();

    const token = { cancelled: false };
    playCancelRef.current = token;
    setPlaying(true);

    // Scale pause durations by the user's speed setting. speed=1 is the
    // default; higher is faster. Clamp so we never starve React's reconciler.
    const scale = (ms) => Math.max(40, Math.round(ms / Math.max(0.1, playSpeed)));
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    // waitForAdvance — parks the loop on a promise that resolves when the
    // user hits Next, Prev, or Stop. Returns { back, cancelled }.
    const waitForAdvance = () => new Promise(resolve => {
      advanceResolverRef.current = (signal) => {
        // Wrap the resolver so the loop always gets a shaped object.
        resolve({
          back: !!(signal && signal.back),
          cancelled: !!token.cancelled,
        });
      };
    });

    // runOnePass walks the graph wave-by-wave. It keeps a history so step
    // mode's Prev button can replay prior waves. History snapshots (wave,
    // visited) are taken BEFORE the wave fires, so rewinding lands cleanly
    // on the prior state.
    const runOnePass = async () => {
      // Each history entry = { wave: string[], visitedSnap: string[] }
      const history = [];
      let wave = seedWave();
      let visited = new Set();
      let waveIdx = 0;

      while (wave.length > 0 && !token.cancelled) {
        waveIdx++;
        history.push({ wave: wave.slice(), visitedSnap: Array.from(visited) });
        setPlayWave({ current: waveIdx, total: totalWaves });
        const waveSet = new Set(wave);
        setFiringNodes(waveSet);
        setFiringLinks(new Set());
        wave.forEach(id => visited.add(id));

        const nextIds = new Set();
        const edgeIds = new Set();
        wave.forEach(id => {
          (outgoing.get(id) || []).forEach(([cid, dstId]) => {
            if (visited.has(dstId)) return;
            edgeIds.add(cid);
            nextIds.add(dstId);
          });
        });

        // Beat 1: nodes lit. Step mode waits for Next; auto uses timing.
        if (playMode === "step") {
          // In step mode, immediately light the edges too so the user sees
          // both the firing nodes AND where data flows from them.
          await sleep(40);
          if (token.cancelled) return;
          setFiringLinks(edgeIds);
          const sig = await waitForAdvance();
          if (token.cancelled) return;
          if (sig.back) {
            // Rewind: pop current entry, restore prior wave / visited.
            history.pop();
            if (history.length > 0) {
              const prev = history.pop();
              wave = prev.wave;
              visited = new Set(prev.visitedSnap);
              waveIdx -= 2; // the while-loop increments back to prev idx
              continue;
            } else {
              // At first wave; Prev just re-seeds.
              wave = seedWave();
              visited = new Set();
              waveIdx = 0;
              continue;
            }
          }
        } else {
          await sleep(scale(220));
          if (token.cancelled) return;
          setFiringLinks(edgeIds);
          await sleep(scale(520));
          if (token.cancelled) return;
        }

        wave = Array.from(nextIds);
      }
      if (!token.cancelled) {
        if (playMode === "step") {
          // Pause on the final wave so the user can read the last chapter
          // before the walkthrough ends. Wait for one more Next (or Stop).
          const sig = await waitForAdvance();
          if (token.cancelled) return;
          if (sig.back && history.length > 0) {
            // Rewind from the end — replay the last wave.
            const prev = history[history.length - 1];
            wave = prev.wave;
            visited = new Set(prev.visitedSnap);
            waveIdx = history.length - 1;
            // Rebuild the wave firing state so Prev lands on the last wave.
            setFiringNodes(new Set(prev.wave));
            const re = new Set();
            prev.wave.forEach(id => (outgoing.get(id) || []).forEach(([cid, dstId]) => {
              if (!prev.visitedSnap.includes(dstId)) re.add(cid);
            }));
            setFiringLinks(re);
            setPlayWave({ current: waveIdx + 1, total: totalWaves });
            // Re-enter the outer do-while to wait again.
            // Trick: await another advance here so we don't fall through.
            await waitForAdvance();
          }
        } else {
          await sleep(scale(500));
        }
      }
    };

    try {
      do {
        await runOnePass();
        if (token.cancelled) break;
        if (playLoop) {
          // Brief "breath" between loops so the user registers the restart.
          setFiringNodes(new Set());
          setFiringLinks(new Set());
          setPlayWave({ current: 0, total: totalWaves });
          await sleep(scale(700));
        }
      } while (playLoop && !token.cancelled);
      if (!token.cancelled) {
        setFiringNodes(new Set());
        setFiringLinks(new Set());
        setPlayWave({ current: 0, total: 0 });
      }
    } finally {
      if (playCancelRef.current === token) {
        playCancelRef.current = null;
        setPlaying(false);
      }
    }
  }, [present, playing, stopPlay, playSpeed, playLoop, playMode]);

  // Drag states
  const [nodeDrag, setNodeDrag] = ag_useState(null);
  // nodeDrag = { ids: [id...], offsets: {id→{x,y}}, startPositions: {id→{x,y}}, moved: bool }
  const [connectDrag, setConnectDrag] = ag_useState(null);
  // connectDrag = { srcId, srcEndpoint: "left"|"right", cursor: {x,y} }
  const [hoveredNodeId, setHoveredNodeId] = ag_useState(null);
  const [libraryDrag, setLibraryDrag] = ag_useState(null);
  // libraryDrag = { role, template, clientX, clientY, overCanvas, world }
  const [marquee, setMarquee] = ag_useState(null);
  // marquee = { startX, startY, endX, endY } — all world coords
  const [selectedIds, setSelectedIds] = ag_useState(() => new Set());

  // Edge selection — mirrors node selection but for connections. Nodes and
  // edges are mutually exclusive in the inspector: selecting one clears the
  // other, so the right panel always has one focus.
  const [selectedEdgeId, setSelectedEdgeId] = ag_useState(null);
  const [selectedEdgeIds, setSelectedEdgeIds] = ag_useState(() => new Set());

  // Kind-picker popup — shown when a connect-drag lands on a valid target.
  // { srcId, dstId, reverse, clientX, clientY } | null
  const [kindPicker, setKindPicker] = ag_useState(null);

  // Edge catalog — reusable edge patterns saved by the user. Fetched on
  // mount; mutated via /api/catalog/edges/save|delete|bump_usage. Items have
  // shape {slug, name, kind, label, usage_count, last_modified}.
  const [catalogEdges, setCatalogEdges] = ag_useState([]);
  const [catalogLoading, setCatalogLoading] = ag_useState(false);
  const [catalogDrag, setCatalogDrag] = ag_useState(null);
  // catalogDrag = { slug, name, kind, label, clientX, clientY, overEdgeId }
  const [saveAsPatternOpen, setSaveAsPatternOpen] = ag_useState(null);
  // saveAsPatternOpen = { edgeId, slug, name } | null — a tiny modal for
  // naming the catalog entry.

  // Screenshot annotator — opens when the user clicks "+ Screenshot" in the
  // edge inspector. { edgeId, step: "paste"|"annotate", image: {data, mime,
  // width, height}, regions: [] } | null
  const [annotator, setAnnotator] = ag_useState(null);

  // Right-click context menu state. { x, y, target: "node"|"edge"|"canvas", id } | null
  const [contextMenu, setContextMenu] = ag_useState(null);

  // Lightbox for screenshot annotations surfaced in the narrator bar.
  // { url, regions, label } | null
  const [lightbox, setLightbox] = ag_useState(null);

  const svgRef = ag_useRef(null);
  const canvasWrapRef = ag_useRef(null);

  // Fetch the catalog on mount. Server returns {ok, items[], count}. A missing
  // directory comes back as an empty list, so any fetch error is logged but
  // doesn't gate rendering.
  const refreshCatalog = ag_useCallback(async () => {
    setCatalogLoading(true);
    try {
      const r = await fetch("/api/catalog/edges/list", { cache: "no-store" });
      const j = await r.json();
      if (j && j.ok && Array.isArray(j.items)) {
        setCatalogEdges(j.items);
      }
    } catch (e) {
      // best-effort — catalog is advisory, not critical
      console.warn("catalog refresh failed", e);
    } finally {
      setCatalogLoading(false);
    }
  }, []);
  ag_useEffect(() => { refreshCatalog(); }, [refreshCatalog]);

  // Keep selectedId <-> selectedIds synchronized for inspector/single-node ops.
  const selectedNode = selectedId ? workflow.nodes.find(n => n.id === selectedId) : null;

  // ─── Actions ─────────────────────────────────────────────────────────────
  const updateNode = ag_useCallback((id, patch) => {
    commit({
      ...present,
      nodes: present.nodes.map(n => n.id === id ? { ...n, ...patch } : n),
      metadata: { ...(present.metadata || {}), last_modified: new Date().toISOString() },
    });
  }, [present, commit]);

  const addNodeFromTemplate = ag_useCallback((role, template) => {
    const id = genId(`n_${role.slice(0,3)}`);
    const n = present.nodes.length;
    const newNode = {
      id, role, kind: template.kind, label: template.label,
      config: {}, notes: "",
      x: 220 + (n % 4) * 200,
      y: 120 + Math.floor(n / 4) * 140,
    };
    commit({
      ...present,
      nodes: [...present.nodes, newNode],
      metadata: { ...(present.metadata || {}), last_modified: new Date().toISOString() },
    });
    setSelectedId(id);
    setSelectedIds(new Set([id]));
    logLedger("automation_node_add", { node_id: id, role, kind: template.kind, workflow_id: present.id });
  }, [present, commit]);

  const dropFromLibrary = ag_useCallback((role, template, x, y) => {
    const id = genId(`n_${role.slice(0,3)}`);
    const newNode = {
      id, role, kind: template.kind, label: template.label,
      config: {}, notes: "",
      x: Math.round(x), y: Math.round(y),
    };
    commit({
      ...present,
      nodes: [...present.nodes, newNode],
      metadata: { ...(present.metadata || {}), last_modified: new Date().toISOString() },
    });
    setSelectedId(id);
    setSelectedIds(new Set([id]));
    setToast(`Dropped ${template.label} · ${role}`);
    setTimeout(() => setToast(null), 1400);
    logLedger("automation_node_add_via_drag", { node_id: id, role, kind: template.kind, x: newNode.x, y: newNode.y, workflow_id: present.id });
  }, [present, commit]);

  const startLibraryDrag = ag_useCallback((role, template, clientX, clientY) => {
    setLibraryDrag({ role, template, clientX, clientY, overCanvas: false, world: null });
  }, []);

  const deleteSelected = ag_useCallback(() => {
    // Edges take precedence only when there are NO nodes selected — the node
    // selection carries more weight since it takes its edges with it.
    if (selectedIds.size > 0) {
      const ids = new Set(selectedIds);
      commit({
        ...present,
        nodes: present.nodes.filter(n => !ids.has(n.id)),
        connections: present.connections.filter(c => !ids.has(c.src) && !ids.has(c.dst)),
        metadata: { ...(present.metadata || {}), last_modified: new Date().toISOString() },
      });
      logLedger("automation_nodes_delete_bulk", { node_ids: Array.from(ids), count: ids.size, workflow_id: present.id });
      setSelectedId(null);
      setSelectedIds(new Set());
      return;
    }
    if (selectedEdgeIds.size > 0) {
      const eids = new Set(selectedEdgeIds);
      commit({
        ...present,
        connections: present.connections.filter(c => !eids.has(c.id)),
        metadata: { ...(present.metadata || {}), last_modified: new Date().toISOString() },
      });
      logLedger("automation_connections_delete_bulk", { conn_ids: Array.from(eids), count: eids.size, workflow_id: present.id });
      setSelectedEdgeId(null);
      setSelectedEdgeIds(new Set());
    }
  }, [selectedIds, selectedEdgeIds, present, commit]);

  const deleteNode = ag_useCallback((id) => {
    commit({
      ...present,
      nodes: present.nodes.filter(n => n.id !== id),
      connections: present.connections.filter(c => c.src !== id && c.dst !== id),
      metadata: { ...(present.metadata || {}), last_modified: new Date().toISOString() },
    });
    setSelectedId(prev => prev === id ? null : prev);
    setSelectedIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev); next.delete(id); return next;
    });
    logLedger("automation_node_delete", { node_id: id, workflow_id: present.id });
  }, [present, commit]);

  // addConnection — accepts either a (src, dst, kind) triple or a full payload
  // object `{src, dst, kind, label, transform, filter, ...}`. Returns the new
  // connection id, or null if the add was rejected (self-loop / duplicate).
  const addConnection = ag_useCallback((srcOrPayload, dst, kind) => {
    const payload = (typeof srcOrPayload === "object" && srcOrPayload !== null)
      ? srcOrPayload
      : { src: srcOrPayload, dst, kind };
    const src = payload.src;
    const dstId = payload.dst;
    if (!src || !dstId || src === dstId) return null;
    const exists = present.connections.some(c => c.src === src && c.dst === dstId);
    if (exists) {
      setToast("That connection already exists.");
      setTimeout(() => setToast(null), 1600);
      return null;
    }
    const id = genId("c");
    const nowIso = new Date().toISOString();
    const edge = {
      id, src, dst: dstId,
      kind: normalizeEdgeKind(payload.kind),
      label: payload.label || "",
      annotations: Array.isArray(payload.annotations) ? payload.annotations : [],
      narration: payload.narration || "",
      created_at: nowIso,
    };
    // Splice in kind-specific fields if provided.
    ["transform","filter","readPattern","rateLimit","debounce","condition","falsePathTarget","eventName"].forEach(k => {
      if (payload[k] != null && payload[k] !== "") edge[k] = payload[k];
    });
    commit({
      ...present,
      connections: [...present.connections, edge],
      metadata: { ...(present.metadata || {}), last_modified: nowIso },
    });
    logLedger("automation_connection_add", { conn_id: id, src, dst: dstId, kind: edge.kind, workflow_id: present.id });
    return id;
  }, [present, commit]);

  // updateConnection — patch an existing edge (for the inspector).
  const updateConnection = ag_useCallback((id, patch) => {
    commit({
      ...present,
      connections: present.connections.map(c => c.id === id ? { ...c, ...patch, last_modified: new Date().toISOString() } : c),
      metadata: { ...(present.metadata || {}), last_modified: new Date().toISOString() },
    });
  }, [present, commit]);

  // deleteConnections — bulk-delete by id set.
  const deleteConnections = ag_useCallback((ids) => {
    const set = ids instanceof Set ? ids : new Set(ids);
    if (set.size === 0) return;
    commit({
      ...present,
      connections: present.connections.filter(c => !set.has(c.id)),
      metadata: { ...(present.metadata || {}), last_modified: new Date().toISOString() },
    });
    logLedger("automation_connections_delete", { conn_ids: Array.from(set), count: set.size, workflow_id: present.id });
  }, [present, commit]);

  // Duplicate a node — places a copy near the original, clones config /
  // notes / annotations but generates a fresh id and doesn't copy edges.
  const duplicateNode = ag_useCallback((id) => {
    const src = present.nodes.find(n => n.id === id);
    if (!src) return;
    const copy = {
      ...src,
      id: genId(`n_${src.role.slice(0,3)}`),
      label: src.label + " copy",
      x: src.x + 40,
      y: src.y + 40,
      annotations: Array.isArray(src.annotations) ? src.annotations.map(a => ({ ...a, id: `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,5)}` })) : [],
    };
    commit({
      ...present,
      nodes: [...present.nodes, copy],
      metadata: { ...(present.metadata || {}), last_modified: new Date().toISOString() },
    });
    setSelectedId(copy.id);
    setSelectedIds(new Set([copy.id]));
    logLedger("automation_node_duplicate", { src_id: id, new_id: copy.id, workflow_id: present.id });
  }, [present, commit]);

  // Disconnect all edges touching a node (source or destination).
  const disconnectNode = ag_useCallback((id) => {
    const toRemove = present.connections.filter(c => c.src === id || c.dst === id).map(c => c.id);
    if (toRemove.length === 0) return;
    commit({
      ...present,
      connections: present.connections.filter(c => c.src !== id && c.dst !== id),
      metadata: { ...(present.metadata || {}), last_modified: new Date().toISOString() },
    });
    logLedger("automation_node_disconnect_all", { node_id: id, removed: toRemove.length, workflow_id: present.id });
  }, [present, commit]);

  // Narrate an edge by id — shared between the inspector button and the
  // right-click "Regenerate narration" menu item. Hits SecretaryAI, falls
  // back to a clear not-configured message if the provider is missing.
  const narrateEdgeById = ag_useCallback(async (edgeId) => {
    const edge = present.connections.find(c => c.id === edgeId);
    if (!edge) return;
    const src = present.nodes.find(n => n.id === edge.src);
    const dst = present.nodes.find(n => n.id === edge.dst);
    const kind = normalizeEdgeKind(edge.kind);
    const prompt = `In one or two sentences, narrate this edge for the workflow "${present.name}":\n\nFrom: ${src ? src.label : edge.src} (${src ? src.role + "/" + src.kind : "unknown"})\nTo:   ${dst ? dst.label : edge.dst} (${dst ? dst.role + "/" + dst.kind : "unknown"})\nKind: ${kind}\nLabel: ${edge.label || "(none)"}\n${edge.transform ? "Transform: " + edge.transform + "\n" : ""}${edge.filter ? "Filter: " + edge.filter + "\n" : ""}${edge.readPattern ? "Read pattern: " + edge.readPattern + "\n" : ""}${edge.condition ? "Condition: " + edge.condition + "\n" : ""}${edge.eventName ? "Event: " + edge.eventName + "\n" : ""}\nWhat does this edge DO? What moves across it, when, and why?`;
    const ai = window.SecretaryAI;
    const configured = ai && ai.isConfigured && ai.isConfigured();
    let narration = "";
    try {
      if (ai && typeof ai.ask === "function" && configured) {
        narration = (await ai.ask(prompt, { register: "narrative" }) || "").trim();
      } else if (ai && typeof ai.respond === "function" && configured) {
        const r = await ai.respond({ input: prompt, instructions: "You are Rodbot. Warm, concrete, direct. 1-3 sentences. No preamble." });
        narration = (r && r.text || "").trim();
      } else {
        narration = "No AI provider configured — open Settings → Intelligence to wire Rodbot.";
      }
    } catch (e) {
      narration = "Narration failed: " + (e && e.message ? e.message : "unknown");
    }
    commit({
      ...present,
      connections: present.connections.map(c => c.id === edgeId ? { ...c, narration: narration || "(Rodbot returned an empty response.)", narrated_at: new Date().toISOString() } : c),
      metadata: { ...(present.metadata || {}), last_modified: new Date().toISOString() },
    });
  }, [present, commit]);

  const renameWorkflow = ag_useCallback((name) => {
    commit({
      ...present,
      name,
      metadata: { ...(present.metadata || {}), last_modified: new Date().toISOString() },
    });
  }, [present, commit]);

  // ─── Catalog: save / apply / delete edge patterns ────────────────────────
  // saveEdgeAsPattern(edgeId) — opens a tiny name-picker so the user can
  // slug + name the entry. The actual POST happens in confirmSaveAsPattern.
  const saveEdgeAsPattern = ag_useCallback((edgeId) => {
    const edge = present.connections.find(c => c.id === edgeId);
    if (!edge) return;
    const defaultName = edge.label
      ? edge.label
      : `${edge.kind || "data"} pattern`;
    const defaultSlug = (edge.label || edge.kind || "edge")
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40) || `edge_${Date.now().toString(36)}`;
    setSaveAsPatternOpen({ edgeId, slug: defaultSlug, name: defaultName });
  }, [present]);

  const confirmSaveAsPattern = ag_useCallback(async ({ edgeId, slug, name }) => {
    const edge = present.connections.find(c => c.id === edgeId);
    if (!edge) { setSaveAsPatternOpen(null); return; }
    const cleanSlug = (slug || "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_");
    if (!cleanSlug) {
      setToast("Slug required.");
      setTimeout(() => setToast(null), 1600);
      return;
    }
    // Capture kind-specific fields so re-applying the pattern reproduces the
    // same payload shape — label + transform + filter + condition + etc.
    const body = {
      slug: cleanSlug,
      name: (name || "").trim() || cleanSlug,
      kind: normalizeEdgeKind(edge.kind),
      label: edge.label || "",
      notes: "",
    };
    ["transform","filter","readPattern","rateLimit","debounce","condition","eventName"].forEach(k => {
      if (edge[k] != null && edge[k] !== "") body[k] = edge[k];
    });
    try {
      const r = await fetch("/api/catalog/edges/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (j && j.ok) {
        setToast(`Saved pattern · ${body.name}`);
        setTimeout(() => setToast(null), 1600);
        logLedger("catalog_edge_save_ui", { slug: cleanSlug, edge_kind: body.kind, workflow_id: present.id });
        setSaveAsPatternOpen(null);
        refreshCatalog();
      } else {
        setToast(`Save failed: ${j && j.error || "unknown"}`);
        setTimeout(() => setToast(null), 2000);
      }
    } catch (e) {
      setToast(`Save failed: ${e.message}`);
      setTimeout(() => setToast(null), 2000);
    }
  }, [present, refreshCatalog]);

  // applyCatalogToEdge — overlay a catalog entry onto an existing edge,
  // bumping the pattern's usage count. kind + label + kind-specific fields
  // copy over; annotations + narration are preserved on the target edge.
  const applyCatalogToEdge = ag_useCallback(async (slug, edgeId) => {
    try {
      const r = await fetch("/api/catalog/edges/get?slug=" + encodeURIComponent(slug));
      const j = await r.json();
      if (!j || !j.ok || !j.entry) {
        setToast("Pattern not found.");
        setTimeout(() => setToast(null), 1600);
        return;
      }
      const entry = j.entry;
      const patch = {
        kind: normalizeEdgeKind(entry.kind),
        label: entry.label || "",
      };
      ["transform","filter","readPattern","rateLimit","debounce","condition","eventName"].forEach(k => {
        if (entry[k] != null && entry[k] !== "") patch[k] = entry[k];
      });
      updateConnection(edgeId, patch);
      // Fire-and-forget usage bump.
      fetch("/api/catalog/edges/bump_usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      }).then(() => refreshCatalog()).catch(() => {});
      setToast(`Applied ${entry.name}`);
      setTimeout(() => setToast(null), 1400);
      logLedger("catalog_edge_apply_ui", { slug, edge_id: edgeId, workflow_id: present.id });
    } catch (e) {
      setToast(`Apply failed: ${e.message}`);
      setTimeout(() => setToast(null), 2000);
    }
  }, [updateConnection, refreshCatalog, present.id]);

  const deleteCatalogEntry = ag_useCallback(async (slug) => {
    try {
      const r = await fetch("/api/catalog/edges/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const j = await r.json();
      if (j && j.ok) {
        setToast("Pattern removed.");
        setTimeout(() => setToast(null), 1400);
        refreshCatalog();
      } else {
        setToast(`Delete failed: ${j && j.error || "unknown"}`);
        setTimeout(() => setToast(null), 2000);
      }
    } catch (e) {
      setToast(`Delete failed: ${e.message}`);
      setTimeout(() => setToast(null), 2000);
    }
  }, [refreshCatalog]);

  // startCatalogDrag — start dragging a catalog item. Mirrors startLibraryDrag
  // but the drop target is an existing edge rather than canvas whitespace.
  const startCatalogDrag = ag_useCallback((item, clientX, clientY) => {
    setCatalogDrag({ ...item, clientX, clientY, overEdgeId: null });
  }, []);

  // ─── Selection helpers ───────────────────────────────────────────────────
  const selectOnly = ag_useCallback((id) => {
    setSelectedId(id);
    setSelectedIds(id ? new Set([id]) : new Set());
    setSelectedEdgeId(null);
    setSelectedEdgeIds(new Set());
  }, []);
  const addToSelection = ag_useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.add(id); return next;
    });
    setSelectedId(id);
    setSelectedEdgeId(null);
    setSelectedEdgeIds(new Set());
  }, []);
  const toggleSelection = ag_useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
    setSelectedId(id);
    setSelectedEdgeId(null);
    setSelectedEdgeIds(new Set());
  }, []);
  const clearSelection = ag_useCallback(() => {
    setSelectedId(null);
    setSelectedIds(new Set());
    setSelectedEdgeId(null);
    setSelectedEdgeIds(new Set());
  }, []);

  // Edge selection — mirrors node helpers. Picks one edge as "primary" for
  // the inspector; shift/meta adds to the set. Selecting an edge clears any
  // node selection so the right panel swaps inspectors cleanly.
  const selectEdge = ag_useCallback((id, opts) => {
    const additive = !!(opts && opts.additive);
    if (!id) {
      setSelectedEdgeId(null);
      setSelectedEdgeIds(new Set());
      return;
    }
    setSelectedId(null);
    setSelectedIds(new Set());
    setSelectedEdgeId(id);
    setSelectedEdgeIds(prev => {
      if (!additive) return new Set([id]);
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      // Keep the primary selectedEdgeId valid — if we just removed it, pick
      // any remaining member; if the set is empty, clear primary.
      return next;
    });
  }, []);

  // ─── Drag handlers (node move, supports multi-select group move) ─────────
  const onNodeMouseDown = ag_useCallback((e, nodeId) => {
    e.stopPropagation();
    if (e.altKey) return;
    // Shift-click: toggle this node in the selection without starting a drag.
    if (e.shiftKey) {
      toggleSelection(nodeId);
      return;
    }
    const world = clientToWorld(e.clientX, e.clientY, svgRef.current, viewport);
    const node = present.nodes.find(n => n.id === nodeId);
    if (!node) return;
    // If clicked node isn't in the current selection, make it the new selection.
    const inSel = selectedIds.has(nodeId);
    const dragIds = inSel && selectedIds.size > 1
      ? Array.from(selectedIds).filter(id => present.nodes.some(n => n.id === id))
      : [nodeId];
    if (!inSel) selectOnly(nodeId);
    else setSelectedId(nodeId);
    snapshot();
    const offsets = {};
    const startPositions = {};
    dragIds.forEach(id => {
      const n = present.nodes.find(nn => nn.id === id);
      if (!n) return;
      offsets[id] = { x: world.x - n.x, y: world.y - n.y };
      startPositions[id] = { x: n.x, y: n.y };
    });
    setNodeDrag({ ids: dragIds, offsets, startPositions, moved: false });
  }, [present, viewport, snapshot, selectedIds, selectOnly, toggleSelection]);

  // ─── Drag handlers (endpoint connect) ────────────────────────────────────
  const onEndpointMouseDown = ag_useCallback((e, nodeId, endpoint) => {
    e.stopPropagation(); e.preventDefault();
    const world = clientToWorld(e.clientX, e.clientY, svgRef.current, viewport);
    setConnectDrag({ srcId: nodeId, srcEndpoint: endpoint, cursor: world });
  }, [viewport]);

  // ─── Window listeners while any drag is active ───────────────────────────
  ag_useEffect(() => {
    if (!nodeDrag && !connectDrag && !libraryDrag && !marquee && !catalogDrag) return;
    const canvasRect = () => canvasWrapRef.current ? canvasWrapRef.current.getBoundingClientRect() : null;

    // Hit-test an edge under the cursor by walking the element under the
    // point up to its nearest [data-edge-id] ancestor. Returns the id or null.
    const edgeIdFromPoint = (x, y) => {
      const el = document.elementFromPoint(x, y);
      if (!el) return null;
      const g = el.closest && el.closest("[data-edge-id]");
      return g ? g.getAttribute("data-edge-id") : null;
    };

    const onMove = (ev) => {
      const world = clientToWorld(ev.clientX, ev.clientY, svgRef.current, viewport);

      if (nodeDrag) {
        // Compute new positions for the whole drag set from the cursor.
        const anchorId = nodeDrag.ids[0];
        const anchorStart = nodeDrag.startPositions[anchorId];
        const anchorOffset = nodeDrag.offsets[anchorId];
        const anchorNewX = world.x - anchorOffset.x;
        const anchorNewY = world.y - anchorOffset.y;
        const dx = anchorNewX - anchorStart.x;
        const dy = anchorNewY - anchorStart.y;
        setLive({
          ...present,
          nodes: present.nodes.map(n => {
            if (!nodeDrag.ids.includes(n.id)) return n;
            const start = nodeDrag.startPositions[n.id];
            return { ...n, x: start.x + dx, y: start.y + dy };
          }),
        });
        if (!nodeDrag.moved && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
          setNodeDrag(d => d ? { ...d, moved: true } : d);
        }
      }

      if (connectDrag) {
        setConnectDrag(cd => cd ? { ...cd, cursor: world } : cd);
      }

      if (libraryDrag) {
        const rect = canvasRect();
        const overCanvas = !!rect &&
          ev.clientX >= rect.left && ev.clientX <= rect.right &&
          ev.clientY >= rect.top && ev.clientY <= rect.bottom;
        setLibraryDrag(d => d ? { ...d, clientX: ev.clientX, clientY: ev.clientY, overCanvas, world } : d);
      }

      if (marquee) {
        setMarquee(m => m ? { ...m, endX: world.x, endY: world.y } : m);
      }

      if (catalogDrag) {
        const overEdgeId = edgeIdFromPoint(ev.clientX, ev.clientY);
        setCatalogDrag(d => d ? { ...d, clientX: ev.clientX, clientY: ev.clientY, overEdgeId } : d);
      }
    };

    const onUp = (ev) => {
      if (nodeDrag) {
        if (nodeDrag.moved) {
          logLedger("automation_node_move", {
            node_ids: nodeDrag.ids, count: nodeDrag.ids.length, workflow_id: present.id,
          });
        } else {
          // No movement — roll back the snapshot (pop the pre-drag entry).
          setPast(p => p.slice(0, -1));
        }
        setNodeDrag(null);
      }
      if (connectDrag) {
        const tgtId = hoveredNodeId;
        if (tgtId && tgtId !== connectDrag.srcId) {
          // Defer edge creation — open the kind-picker at the drop point.
          // User picks Data / Reference / Trigger / Conditional, or Escape
          // to cancel. Default is Data.
          const reverse = connectDrag.srcEndpoint !== "right";
          setKindPicker({
            srcId: reverse ? tgtId : connectDrag.srcId,
            dstId: reverse ? connectDrag.srcId : tgtId,
            clientX: ev.clientX, clientY: ev.clientY,
          });
        }
        setConnectDrag(null);
      }
      if (libraryDrag) {
        const rect = canvasRect();
        const overCanvas = !!rect &&
          ev.clientX >= rect.left && ev.clientX <= rect.right &&
          ev.clientY >= rect.top && ev.clientY <= rect.bottom;
        if (overCanvas) {
          const world = clientToWorld(ev.clientX, ev.clientY, svgRef.current, viewport);
          dropFromLibrary(libraryDrag.role, libraryDrag.template, world.x, world.y);
        }
        setLibraryDrag(null);
      }
      if (catalogDrag) {
        const overEdgeId = edgeIdFromPoint(ev.clientX, ev.clientY);
        if (overEdgeId) {
          applyCatalogToEdge(catalogDrag.slug, overEdgeId);
        }
        setCatalogDrag(null);
      }
      if (marquee) {
        // Compute selection from rect bounds.
        const minX = Math.min(marquee.startX, marquee.endX);
        const maxX = Math.max(marquee.startX, marquee.endX);
        const minY = Math.min(marquee.startY, marquee.endY);
        const maxY = Math.max(marquee.startY, marquee.endY);
        const w = maxX - minX, h = maxY - minY;
        if (w > 6 || h > 6) {
          const hits = present.nodes.filter(n => n.x >= minX && n.x <= maxX && n.y >= minY && n.y <= maxY);
          const ids = new Set(hits.map(n => n.id));
          setSelectedIds(ids);
          setSelectedId(hits.length ? hits[0].id : null);
          if (hits.length) logLedger("automation_marquee_select", { count: hits.length, workflow_id: present.id });
        }
        setMarquee(null);
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [nodeDrag, connectDrag, libraryDrag, marquee, catalogDrag, hoveredNodeId, present, viewport, setLive, addConnection, dropFromLibrary, applyCatalogToEdge]);

  // ─── Marquee ─────────────────────────────────────────────────────────────
  const startMarquee = ag_useCallback((x, y, retainSelection) => {
    if (!retainSelection) clearSelection();
    setMarquee({ startX: x, startY: y, endX: x, endY: y });
  }, [clearSelection]);

  // ─── Export / Save / Load ────────────────────────────────────────────────
  const [saving, setSaving] = ag_useState(false);
  const [loadOpen, setLoadOpen] = ag_useState(false);
  const [savedList, setSavedList] = ag_useState([]);

  const onExport = ag_useCallback(async () => {
    const text = serializeWorkflow(present);
    const slug = slugify(present.name);
    const filename = `${slug}.workflow.json`;
    downloadFile(filename, text);
    const copied = await copyToClipboard(text);
    logLedger("automation_workflow_export", { workflow_id: present.id, slug, nodes: present.nodes.length, copied });
    setToast(copied ? `Exported ${filename} · copied to clipboard` : `Exported ${filename}`);
    setTimeout(() => setToast(null), 2400);
  }, [present]);

  const onSave = ag_useCallback(async () => {
    const text = serializeWorkflow(present);
    const slug = slugify(present.name);
    setSaving(true);
    try {
      const r = await fetch("/api/workflows/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, json: text, name: present.name, workflow_id: present.id }),
      });
      const j = await r.json().catch(() => ({ ok: false }));
      if (j && j.ok) {
        logLedger("automation_workflow_save", { workflow_id: present.id, slug, path: j.path, nodes: present.nodes.length });
        setToast(`Saved · ${j.path || slug}`);
      } else {
        setToast("Save failed");
      }
    } catch (e) {
      setToast("Save failed: " + (e && e.message ? e.message : "network"));
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2400);
    }
  }, [present]);

  const openLoad = ag_useCallback(async () => {
    try {
      const r = await fetch("/api/workflows/list");
      const j = await r.json().catch(() => ({ items: [] }));
      setSavedList((j && j.items) || []);
    } catch {
      setSavedList([]);
    }
    setLoadOpen(true);
  }, []);

  const loadWorkflow = ag_useCallback(async (slug) => {
    try {
      const r = await fetch(`/api/workflows/get?slug=${encodeURIComponent(slug)}`);
      const j = await r.json();
      if (j && j.ok && j.workflow) {
        // Replace current — reset history.
        setPast([]);
        setFuture([]);
        setPresent(j.workflow);
        clearSelection();
        logLedger("automation_workflow_load", { workflow_id: j.workflow.id, slug });
        setToast(`Loaded · ${slug}`);
      } else {
        setToast("Load failed");
      }
    } catch (e) {
      setToast("Load failed: " + (e && e.message ? e.message : "network"));
    } finally {
      setLoadOpen(false);
      setTimeout(() => setToast(null), 2200);
    }
  }, [clearSelection]);

  // Cross-tab nav (Apr 2026 polish): when another sub-tab routes here with
  // a `loadSlug` (e.g. clicking a workflow pill on Triggers), load that
  // workflow on mount/change. Each new slug runs once.
  const lastLoadedSlugRef = ag_useRef(null);
  ag_useEffect(() => {
    if (!loadSlug) return;
    if (lastLoadedSlugRef.current === loadSlug) return;
    lastLoadedSlugRef.current = loadSlug;
    loadWorkflow(loadSlug);
  }, [loadSlug, loadWorkflow]);

  // ─── Viewport ────────────────────────────────────────────────────────────
  const fitToView = ag_useCallback(() => {
    if (!present.nodes.length) return;
    const xs = present.nodes.map(n => n.x);
    const ys = present.nodes.map(n => n.y);
    const minX = Math.min(...xs) - 100;
    const maxX = Math.max(...xs) + 160;
    const minY = Math.min(...ys) - 80;
    const maxY = Math.max(...ys) + 80;
    const cw = 800, ch = 600;
    const zx = cw / (maxX - minX);
    const zy = ch / (maxY - minY);
    const zoom = clamp(Math.min(zx, zy), 0.4, 1.4);
    setViewport({ zoom, tx: -minX * zoom + 40, ty: -minY * zoom + 40 });
  }, [present.nodes]);

  const resetView = ag_useCallback(() => setViewport({ tx: 0, ty: 0, zoom: 1 }), []);

  // ─── Keyboard ────────────────────────────────────────────────────────────
  ag_useEffect(() => {
    const onKey = (e) => {
      if (isEditableTarget(e.target)) return;
      // Undo/redo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "y")) {
        e.preventDefault(); redo(); return;
      }
      if (e.key === "Escape") {
        if (annotator) { setAnnotator(null); return; }
        if (saveAsPatternOpen) { setSaveAsPatternOpen(null); return; }
        if (kindPicker) { setKindPicker(null); return; }
        if (catalogDrag) { setCatalogDrag(null); return; }
        if (libraryDrag) { setLibraryDrag(null); return; }
        if (connectDrag) { setConnectDrag(null); return; }
        if (marquee) { setMarquee(null); return; }
        if (loadOpen) { setLoadOpen(false); return; }
        clearSelection(); setHelpOpen(false); return;
      }
      if ((e.key === "Delete" || e.key === "Backspace")) {
        if (selectedIds.size > 0) { e.preventDefault(); deleteSelected(); return; }
        if (selectedId) { e.preventDefault(); deleteNode(selectedId); return; }
        if (selectedEdgeIds.size > 0) { e.preventDefault(); deleteSelected(); return; }
        if (selectedEdgeId) {
          e.preventDefault();
          deleteConnections([selectedEdgeId]);
          setSelectedEdgeId(null);
          setSelectedEdgeIds(new Set());
          return;
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault(); onSave(); return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        const all = new Set(present.nodes.map(n => n.id));
        setSelectedIds(all);
        if (all.size) setSelectedId(present.nodes[0].id);
        return;
      }
      if (e.key === "?") { setHelpOpen(o => !o); return; }
      // Slideshow controls — only active while playing in step mode.
      if (playing && playMode === "step") {
        if (e.key === " " || e.key === "ArrowRight") { e.preventDefault(); requestAdvance(); return; }
        if (e.key === "ArrowLeft") { e.preventDefault(); requestRewind(); return; }
      }
      if (e.key === "l" || e.key === "L") { setLibraryOpen(o => !o); return; }
      if (e.key === "i" || e.key === "I") { setInspectorOpen(o => !o); return; }
      if (e.key === "k" || e.key === "K") { setRailOpen(o => !o); return; }
      if (e.key === "f" || e.key === "F") { fitToView(); return; }
      if (e.key === "r" || e.key === "R") { resetView(); return; }
      if ((e.metaKey || e.ctrlKey) && (e.key === "=" || e.key === "+")) {
        e.preventDefault(); setViewport(v => ({ ...v, zoom: clamp(v.zoom + 0.1, 0.4, 2.0) })); return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "-") {
        e.preventDefault(); setViewport(v => ({ ...v, zoom: clamp(v.zoom - 0.1, 0.4, 2.0) })); return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "0") {
        e.preventDefault(); resetView(); return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, selectedIds, selectedEdgeId, selectedEdgeIds, connectDrag, libraryDrag, marquee, kindPicker, loadOpen, present, deleteNode, deleteSelected, deleteConnections, clearSelection, fitToView, resetView, undo, redo, onSave, playing, playMode, requestAdvance, requestRewind]);

  // ─── Kind-picker keyboard (1–4 pick, Esc handled in main keyboard effect) ─
  ag_useEffect(() => {
    if (!kindPicker) return;
    const onKey = (e) => {
      if (isEditableTarget(e.target)) return;
      const idx = { "1": 0, "2": 1, "3": 2, "4": 3 }[e.key];
      if (idx == null) return;
      const k = EDGE_KINDS[idx];
      if (!k) return;
      e.preventDefault();
      const newId = addConnection({ src: kindPicker.srcId, dst: kindPicker.dstId, kind: k.value });
      setKindPicker(null);
      if (newId) selectEdge(newId);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [kindPicker, addConnection, selectEdge]);

  // ─── Right-click context menu — document-level dispatcher ───────────────
  // Walks up from e.target to find the nearest interactive target (node,
  // edge, or canvas), then opens a context menu at the cursor. Falls through
  // to the browser menu if clicked outside the automation page.
  ag_useEffect(() => {
    const onContext = (e) => {
      // Only intercept inside .ag-page. Otherwise let the OS menu show.
      const pageEl = e.target && e.target.closest && e.target.closest(".ag-page");
      if (!pageEl) return;
      // Don't hijack right-click on inputs / textareas / selects — let the
      // browser's native context menu handle copy-paste there.
      if (isEditableTarget(e.target)) return;

      const nodeEl = e.target.closest && e.target.closest("[data-nodeid]");
      const edgeEl = e.target.closest && e.target.closest("[data-edge-id]");
      const canvasEl = e.target.closest && e.target.closest(".ag-canvas-wrap");

      if (nodeEl && nodeEl.dataset.nodeid) {
        e.preventDefault();
        setSelectedId(nodeEl.dataset.nodeid);
        setSelectedIds(new Set([nodeEl.dataset.nodeid]));
        setSelectedEdgeId(null);
        setSelectedEdgeIds(new Set());
        setContextMenu({ x: e.clientX, y: e.clientY, target: "node", id: nodeEl.dataset.nodeid });
      } else if (edgeEl && edgeEl.dataset.edgeId) {
        e.preventDefault();
        setSelectedEdgeId(edgeEl.dataset.edgeId);
        setSelectedEdgeIds(new Set([edgeEl.dataset.edgeId]));
        setSelectedId(null);
        setSelectedIds(new Set());
        setContextMenu({ x: e.clientX, y: e.clientY, target: "edge", id: edgeEl.dataset.edgeId });
      } else if (canvasEl) {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, target: "canvas", id: null });
      }
    };
    document.addEventListener("contextmenu", onContext);
    return () => document.removeEventListener("contextmenu", onContext);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dismiss the context menu on Esc or outside click — plus a scroll.
  ag_useEffect(() => {
    if (!contextMenu) return;
    const dismiss = () => setContextMenu(null);
    const onKey = (e) => { if (e.key === "Escape") dismiss(); };
    window.addEventListener("click", dismiss);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      window.removeEventListener("click", dismiss);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, [contextMenu]);

  // ─── Auto-center on playback focus ───────────────────────────────────────
  // When the walkthrough fires a wave, ease the viewport so the current
  // firing nodes (or firing edge midpoints as a fallback) center in the
  // canvas. Uses a ref to read the starting viewport without re-running
  // the effect each animation frame. prefers-reduced-motion snaps instantly.
  const viewportRef = ag_useRef(viewport);
  viewportRef.current = viewport;
  ag_useEffect(() => {
    if (!playing) return;
    if (firingNodes.size === 0 && firingLinks.size === 0) return;
    const pts = [];
    firingNodes.forEach(id => {
      const n = present.nodes.find(x => x.id === id);
      if (n) pts.push([n.x, n.y]);
    });
    if (pts.length === 0) {
      firingLinks.forEach(id => {
        const c = present.connections.find(x => x.id === id);
        if (!c) return;
        const s = present.nodes.find(x => x.id === c.src);
        const d = present.nodes.find(x => x.id === c.dst);
        if (s && d) pts.push([(s.x + d.x) / 2, (s.y + d.y) / 2]);
      });
    }
    if (pts.length === 0) return;
    const avgX = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const avgY = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    const wrap = canvasWrapRef.current;
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const vp = viewportRef.current;
    const targetTx = rect.width / 2 - avgX * vp.zoom;
    const targetTy = rect.height / 2 - avgY * vp.zoom;
    const startTx = vp.tx;
    const startTy = vp.ty;
    if (Math.abs(targetTx - startTx) < 30 && Math.abs(targetTy - startTy) < 30) return;

    const reduced = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setViewport(v => ({ ...v, tx: targetTx, ty: targetTy }));
      return;
    }

    let raf;
    const start = performance.now();
    const duration = 320;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      // easeInOutQuad
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setViewport(v => ({
        ...v,
        tx: startTx + (targetTx - startTx) * eased,
        ty: startTy + (targetTy - startTy) * eased,
      }));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => { if (raf) cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, firingNodes, firingLinks, present.nodes, present.connections]);

  // ─── Mount ledger ────────────────────────────────────────────────────────
  ag_useEffect(() => {
    logLedger("automation_screen_open", { workflow_id: present.id });
    // eslint-disable-next-line
  }, []);

  // ─── Hover handlers ──────────────────────────────────────────────────────
  const onHoverNode = ag_useCallback((id) => setHoveredNodeId(id), []);
  const onLeaveNode = ag_useCallback((id) => setHoveredNodeId(prev => prev === id ? null : prev), []);

  // ─── Layout class ────────────────────────────────────────────────────────
  const classes = ["ag-page"];
  if (railOpen) classes.push("rail-open");
  if (!libraryOpen) classes.push("no-library");
  if (!inspectorOpen) classes.push("no-inspector");
  if (canvasTheme === "light") classes.push("canvas-light");

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return (
    <div className={classes.join(" ")}>
      {libraryOpen && (
        <NodeLibrary
          onAddNode={addNodeFromTemplate}
          onStartDrag={startLibraryDrag}
          onClose={() => setLibraryOpen(false)}
          workflow={workflow}
          onExport={onExport}
          onSave={onSave}
          onOpenLoad={openLoad}
          saving={saving}
          onRename={renameWorkflow}
          catalogEdges={catalogEdges}
          catalogLoading={catalogLoading}
          onStartCatalogDrag={startCatalogDrag}
          onApplyCatalogToEdge={applyCatalogToEdge}
          onDeleteCatalogEntry={deleteCatalogEntry}
          selectedEdgeId={selectedEdgeId}
        />
      )}

      <div className="ag-canvas-col" style={{position:"relative", minWidth:0, display:"flex", flexDirection:"column"}}>
        <GraphCanvas
          workflow={workflow}
          selectedId={selectedId}
          selectedIds={selectedIds}
          selectedEdgeId={selectedEdgeId}
          selectedEdgeIds={selectedEdgeIds}
          onSelectEdge={selectEdge}
          viewport={viewport}
          onViewportChange={setViewport}
          onSelectNode={setSelectedId}
          onClearSelection={clearSelection}
          nodeDrag={nodeDrag}
          connectDrag={connectDrag}
          hoveredNodeId={hoveredNodeId}
          onNodeMouseDown={onNodeMouseDown}
          onEndpointMouseDown={onEndpointMouseDown}
          onHoverNode={onHoverNode}
          onLeaveNode={onLeaveNode}
          onStartMarquee={startMarquee}
          marquee={marquee}
          libraryDrag={libraryDrag}
          firingNodes={firingNodes}
          firingLinks={firingLinks}
          svgRef={svgRef}
          wrapRef={canvasWrapRef}
        />

        <div className="ag-canvas-header">
          <span style={{fontSize:11, color:"var(--ag-text-3)"}}>{workflow.name}</span>
          <span className="sep">·</span>
          <span className="saved">v{(workflow.metadata && workflow.metadata.version) || 1}</span>
          {nodeDrag && <><span className="sep">·</span><span className="saved" style={{color:"var(--ag-actor)"}}>{nodeDrag.ids.length > 1 ? `moving ${nodeDrag.ids.length}` : "moving"}</span></>}
          {connectDrag && <><span className="sep">·</span><span className="saved" style={{color:"var(--ag-transform)"}}>connecting</span></>}
          {libraryDrag && <><span className="sep">·</span><span className="saved" style={{color:"var(--ag-trigger)"}}>dragging {libraryDrag.template.label}</span></>}
          {marquee && <><span className="sep">·</span><span className="saved" style={{color:"var(--ag-transform)"}}>selecting</span></>}
          {selectedIds.size > 1 && !nodeDrag && <><span className="sep">·</span><span className="saved">{selectedIds.size} selected</span></>}
        </div>

        <div className="ag-canvas-controls">
          <button className="zctrl" onClick={undo} disabled={!canUndo} title="Undo (⌘Z)" style={{opacity: canUndo ? 1 : 0.4}}>↶</button>
          <button className="zctrl" onClick={redo} disabled={!canRedo} title="Redo (⌘⇧Z)" style={{opacity: canRedo ? 1 : 0.4}}>↷</button>
          <span className="zlabel" style={{borderLeft:"1px solid var(--ag-rule)", marginLeft:4, paddingLeft:10}}></span>
          <button
            className={"zctrl ag-play-btn" + (playing ? " playing" : "")}
            onClick={playWorkflow}
            title={playing ? "Stop walkthrough" : "Play workflow — watch the token walk the graph"}
          >{playing ? "■" : "▶"}</button>
          {/* Speed selector — cycles through 0.5x / 1x / 1.5x / 2x. Shows
              the current multiplier so the user can read it at a glance. */}
          <button
            className="zctrl ag-speed-btn"
            onClick={() => {
              const steps = [0.5, 1, 1.5, 2];
              const idx = steps.indexOf(playSpeed);
              setPlaySpeed(steps[(idx + 1) % steps.length]);
            }}
            title="Playback speed — click to cycle 0.5x / 1x / 1.5x / 2x"
          >
            {playSpeed === 1 ? "1×" : playSpeed === 0.5 ? "½×" : `${playSpeed}×`}
          </button>
          {/* Continuous loop — keeps the walkthrough restarting from the
              triggers after the final wave. Useful for demos + ambient play. */}
          <button
            className={"zctrl ag-loop-btn" + (playLoop ? " active" : "")}
            onClick={() => setPlayLoop(!playLoop)}
            title={playLoop ? "Looping — click to stop after one pass" : "Click to loop continuously"}
          >↻</button>
          {/* Playback mode — auto vs step (slideshow). In step mode the
              walkthrough waits on each wave for the user to hit Next. */}
          <button
            className={"zctrl ag-mode-btn" + (playMode === "step" ? " active" : "")}
            onClick={() => setPlayMode(playMode === "auto" ? "step" : "auto")}
            title={playMode === "auto" ? "Auto-play — click to switch to step-through mode" : "Step-through mode — click to switch to auto"}
          >{playMode === "auto" ? "auto" : "step"}</button>
          <span className="zlabel" style={{borderLeft:"1px solid var(--ag-rule)", marginLeft:4, paddingLeft:10}}></span>
          <button className="zctrl" onClick={() => setViewport(v => ({ ...v, zoom: clamp(v.zoom - 0.1, 0.4, 2.0) }))} title="Zoom out">−</button>
          <span className="zlabel">{Math.round(viewport.zoom * 100)}%</span>
          <button className="zctrl" onClick={() => setViewport(v => ({ ...v, zoom: clamp(v.zoom + 0.1, 0.4, 2.0) }))} title="Zoom in">+</button>
          <button className="zctrl" onClick={fitToView} title="Fit to view (F)">fit</button>
          <button className="zctrl" onClick={resetView} title="Reset view (R)">1:1</button>
          <button className="zctrl" onClick={toggleCanvasTheme} title={canvasTheme === "light" ? "Switch to dark canvas" : "Switch to light canvas"}>{canvasTheme === "light" ? "◑" : "◐"}</button>
          <button className="zctrl" onClick={() => setHelpOpen(true)} title="Help (?)">?</button>
        </div>

        {!railOpen && (
          <button className="ag-rbt-toggle" onClick={() => setRailOpen(true)} title="Open Rodbot graph chat (K)">
            <span style={{width:6, height:6, borderRadius:"50%", background:"var(--event-generate)", display:"inline-block"}} />
            Rodbot
          </button>
        )}

        {/* Narrator bar — floating strip at the top-center of the canvas
            that narrates the workflow as it plays. Reads node / edge
            descriptions and surfaces them in order as the walkthrough
            advances. This is the foundation of the storybook view. */}
        {(firingNodes.size > 0 || firingLinks.size > 0) && (() => {
          const nodesById = new Map(workflow.nodes.map(n => [n.id, n]));
          const linksById = new Map(workflow.connections.map(c => [c.id, c]));
          const litNodes = Array.from(firingNodes).map(id => nodesById.get(id)).filter(Boolean);
          const litLinks = Array.from(firingLinks).map(id => linksById.get(id)).filter(Boolean);
          // Prefer edges when they're lit — the narrative is about motion.
          // Otherwise show nodes — the narrative is about actors.
          const showingEdges = litLinks.length > 0;
          const focus = showingEdges ? litLinks[0] : litNodes[0];
          const others = showingEdges ? litLinks.slice(1) : litNodes.slice(1);
          let label = "", description = "", flavor = "idle";
          if (showingEdges && focus) {
            const src = nodesById.get(focus.src);
            const dst = nodesById.get(focus.dst);
            label = (src ? src.label : "?") + " → " + (dst ? dst.label : "?");
            description = focus.description || focus.narration || focus.label || `${normalizeEdgeKind(focus.kind)} edge`;
            flavor = "edge";
          } else if (focus) {
            label = focus.label;
            description = focus.description || focus.notes || `${focus.role} · ${focus.kind}`;
            flavor = "node-" + focus.role;
          } else {
            label = "Workflow idle";
            description = "Press play to watch the walkthrough.";
          }
          // Screenshot annotations on the current focus — surface them as
          // thumb chips in the narrator so the story has pictures, not just
          // words. Works for both node and edge focus objects.
          const shots = (focus && Array.isArray(focus.annotations))
            ? focus.annotations.filter(a => a.type === "screenshot" && (a.url || a.data))
            : [];

          return (
            <div className={"ag-narrator-bar " + flavor} data-showing={showingEdges ? "edge" : "node"}>
              {playWave.total > 0 && (
                <span className="ag-narrator-step">
                  Step {playWave.current} of {playWave.total}
                </span>
              )}
              <span className="ag-narrator-label">{label}</span>
              <span className="ag-narrator-sep">·</span>
              <span className="ag-narrator-desc">{description}</span>
              {shots.length > 0 && (
                <span className="ag-narrator-shots">
                  {shots.slice(0, 3).map((a, i) => {
                    const regionLabels = Array.isArray(a.regions)
                      ? a.regions.map(r => r.label).filter(Boolean).join(" · ")
                      : "";
                    return (
                      <button
                        key={a.id || i}
                        className="ag-narrator-shot"
                        title={regionLabels || "Screenshot attachment — click to view"}
                        onClick={(e) => { e.stopPropagation(); setLightbox({ url: a.url || a.data, regions: a.regions || [], label }); }}
                      >
                        <img src={a.url || a.data} alt="" />
                      </button>
                    );
                  })}
                  {shots.length > 3 && <span className="ag-narrator-shot-more">+{shots.length - 3}</span>}
                </span>
              )}
              {others.length > 0 && (
                <span className="ag-narrator-more" title={others.map(o => o.label || o.id).join(", ")}>
                  +{others.length} more
                </span>
              )}
              {playing && playMode === "step" && (
                <span className="ag-narrator-steps">
                  <button
                    className="ag-narrator-step-btn"
                    onClick={requestRewind}
                    title="Previous step (←)"
                  >◂ Prev</button>
                  <button
                    className="ag-narrator-step-btn primary"
                    onClick={requestAdvance}
                    title="Next step (Space or →)"
                  >Next ▸</button>
                </span>
              )}
            </div>
          );
        })()}

        {/* Edge peek-tabs — thin handles that let the user re-open a
            collapsed panel without the keyboard. Library on the left,
            inspector on the right, rail already has its own toggle above. */}
        {!libraryOpen && (
          <button
            className="ag-peek-tab ag-peek-tab-left"
            onClick={() => setLibraryOpen(true)}
            title="Open Library (L)"
          >
            <span className="ag-peek-glyph">‹</span>
            <span className="ag-peek-label">Library</span>
          </button>
        )}
        {!inspectorOpen && (
          <button
            className="ag-peek-tab ag-peek-tab-right"
            onClick={() => setInspectorOpen(true)}
            title="Open Inspector (I)"
          >
            <span className="ag-peek-label">Inspector</span>
            <span className="ag-peek-glyph">›</span>
          </button>
        )}
      </div>

      {inspectorOpen && (
        selectedEdgeId
          ? (() => {
              const edge = workflow.connections.find(c => c.id === selectedEdgeId);
              return (
                <EdgeInspector
                  edge={edge}
                  workflow={workflow}
                  onUpdateEdge={updateConnection}
                  onDeleteEdge={(id) => {
                    deleteConnections([id]);
                    setSelectedEdgeId(null);
                    setSelectedEdgeIds(new Set());
                  }}
                  onSelectNode={selectOnly}
                  onSaveAsPattern={saveEdgeAsPattern}
                  onOpenAnnotator={(edgeId) => setAnnotator({ edgeId, step: "paste", image: null, regions: [] })}
                  onClose={() => setInspectorOpen(false)}
                />
              );
            })()
          : (
            <NodeInspector
              node={selectedNode}
              workflow={workflow}
              onUpdateNode={updateNode}
              onSelectNode={setSelectedId}
              onDeleteNode={deleteNode}
              onOpenAnnotator={(nodeId) => setAnnotator({ nodeId, step: "paste", image: null, regions: [] })}
              onClose={() => setInspectorOpen(false)}
            />
          )
      )}

      {railOpen && (
        <RodbotGraphRail
          workflow={workflow}
          onAddNode={addNodeFromTemplate}
          onDeleteNode={deleteNode}
          onAddConnection={addConnection}
          onClose={() => setRailOpen(false)}
          selectedEdge={selectedEdgeId ? workflow.connections.find(c => c.id === selectedEdgeId) : null}
          onSaveAsPattern={saveEdgeAsPattern}
        />
      )}

      {contextMenu && (() => {
        // Right-click context menu. Built inline so it can close over the
        // full action surface (commit, setSelected*, open annotator, etc.)
        // without threading a dozen props through a component.
        const { x, y, target, id } = contextMenu;
        const close = () => setContextMenu(null);
        const items = [];
        if (target === "node") {
          items.push(
            { label: "Rename / edit", onClick: () => { setSelectedId(id); setSelectedIds(new Set([id])); setSelectedEdgeId(null); setSelectedEdgeIds(new Set()); setInspectorOpen(true); } },
            { label: "Duplicate", onClick: () => duplicateNode(id) },
            { label: "Add screenshot…", onClick: () => setAnnotator({ nodeId: id, step: "paste", image: null, regions: [] }) },
            { label: "Disconnect all edges", onClick: () => disconnectNode(id) },
            { sep: true },
            { label: "Delete node", onClick: () => deleteNode(id), danger: true },
          );
        } else if (target === "edge") {
          items.push(
            { label: "Open in inspector", onClick: () => { setSelectedEdgeId(id); setSelectedEdgeIds(new Set([id])); setSelectedId(null); setSelectedIds(new Set()); setInspectorOpen(true); } },
            { label: "Regenerate narration", onClick: () => narrateEdgeById(id) },
            { label: "Add screenshot…", onClick: () => setAnnotator({ edgeId: id, step: "paste", image: null, regions: [] }) },
            { label: "Save as pattern…", onClick: () => saveEdgeAsPattern(id) },
            { sep: true },
            { label: "Delete edge", onClick: () => deleteConnections([id]), danger: true },
          );
        } else {
          items.push(
            { label: "Fit to view", onClick: fitToView },
            { label: "Reset view (1:1)", onClick: resetView },
            { sep: true },
            { label: (libraryOpen ? "Hide" : "Show") + " library", onClick: () => setLibraryOpen(v => !v) },
            { label: (inspectorOpen ? "Hide" : "Show") + " inspector", onClick: () => setInspectorOpen(v => !v) },
            { label: (railOpen ? "Hide" : "Show") + " Rodbot rail", onClick: () => setRailOpen(v => !v) },
            { sep: true },
            { label: "Help / shortcuts", onClick: () => setHelpOpen(true) },
          );
        }
        // Guardrail: keep the menu inside the viewport. Approx size estimate.
        const W = 220, H = Math.min(items.length * 30 + 14, 360);
        const left = Math.min(window.innerWidth - W - 8, x);
        const top  = Math.min(window.innerHeight - H - 8, y);
        return (
          <div
            className="ag-ctx-menu"
            style={{ left, top }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            <div className="ag-ctx-menu-title">
              {target === "node" ? "Node" : target === "edge" ? "Edge" : "Canvas"}
            </div>
            {items.map((it, i) => it.sep ? (
              <div key={"sep"+i} className="ag-ctx-menu-sep" />
            ) : (
              <button
                key={it.label}
                className={"ag-ctx-menu-item" + (it.danger ? " danger" : "")}
                onClick={() => { it.onClick(); close(); }}
              >{it.label}</button>
            ))}
          </div>
        );
      })()}

      {kindPicker && (
        <React.Fragment>
          {/* Invisible backdrop — click anywhere outside to cancel. */}
          <div
            onClick={() => setKindPicker(null)}
            style={{ position: "fixed", inset: 0, zIndex: 79, background: "transparent" }}
          />
          <div
            className="ag-edge-kind-picker"
            style={{
              left: Math.min(window.innerWidth - 180, kindPicker.clientX + 6),
              top:  Math.min(window.innerHeight - 200, kindPicker.clientY + 6),
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {EDGE_KINDS.map((k, i) => (
              <button
                key={k.value}
                onClick={() => {
                  const newId = addConnection({
                    src: kindPicker.srcId,
                    dst: kindPicker.dstId,
                    kind: k.value,
                  });
                  setKindPicker(null);
                  if (newId) selectEdge(newId);
                }}
              >
                <span className={`swatch ${k.value}`} />
                <span style={{display:"flex", flexDirection:"column", gap:1}}>
                  <span style={{fontWeight:500}}>{k.label}</span>
                  <span style={{fontSize:10, color:"var(--ink-4)"}}>{k.sub}</span>
                </span>
                <span className="kb">{i + 1}</span>
              </button>
            ))}
            <div style={{fontSize:10, color:"var(--ink-4)", padding:"4px 8px 2px", borderTop:"1px solid var(--rule)", marginTop:2}}>
              <kbd style={{fontSize:10}}>Esc</kbd> to cancel
            </div>
          </div>
        </React.Fragment>
      )}

      {libraryDrag && (
        <div
          className="ag-lib-ghost"
          style={{
            position: "fixed",
            left: libraryDrag.clientX + 10,
            top: libraryDrag.clientY + 10,
            pointerEvents: "none",
            zIndex: 10000,
            padding: "6px 10px",
            borderRadius: 8,
            background: libraryDrag.overCanvas ? "var(--ag-surface-2, #2a2e39)" : "var(--ag-surface-1, #1f222c)",
            border: `1px solid var(--ag-${libraryDrag.role}, var(--ag-rule))`,
            boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
            fontSize: 12,
            color: "var(--ag-text-1, #e6e8ee)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            opacity: libraryDrag.overCanvas ? 1 : 0.72,
          }}
        >
          <span style={{fontSize:14}}>{libraryDrag.template.glyph}</span>
          <span>{libraryDrag.template.label}</span>
          <span style={{opacity:0.6, fontSize:10, textTransform:"uppercase", letterSpacing:0.4}}>
            {libraryDrag.overCanvas ? "drop" : libraryDrag.role}
          </span>
        </div>
      )}

      {catalogDrag && (
        <div
          className="ag-lib-ghost ag-catalog-ghost"
          data-kind={catalogDrag.kind}
          style={{
            position: "fixed",
            left: catalogDrag.clientX + 10,
            top: catalogDrag.clientY + 10,
            pointerEvents: "none",
            zIndex: 10000,
          }}
        >
          <span className={"ag-catalog-swatch " + catalogDrag.kind} />
          <span>{catalogDrag.name}</span>
          <span style={{opacity:0.6, fontSize:10, textTransform:"uppercase", letterSpacing:0.4}}>
            {catalogDrag.overEdgeId ? "apply" : catalogDrag.kind}
          </span>
        </div>
      )}

      {saveAsPatternOpen && (
        <div
          onClick={() => setSaveAsPatternOpen(null)}
          style={{position:"fixed", inset:0, zIndex:9998, background:"rgba(10,12,16,0.55)", display:"flex", alignItems:"center", justifyContent:"center"}}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="ag-modal-card"
            style={{
              minWidth:320, maxWidth:420,
              background:"var(--paper, #fafaf6)",
              border:"1px solid var(--rule, #d5d1c6)",
              borderRadius:10,
              padding:16,
              boxShadow:"0 12px 40px rgba(0,0,0,0.35)",
              color:"var(--ink, #1a1a1a)",
            }}
          >
            <h3 style={{margin:"0 0 10px", fontFamily:"var(--font-serif, Fraunces, serif)", fontSize:18}}>Save as pattern</h3>
            <p style={{margin:"0 0 12px", fontSize:12, color:"var(--ink-3, #555)", lineHeight:1.45}}>
              Stash this edge in the Catalog so you can drag it back onto any edge later. Kind and kind-specific config (transform, filter, condition…) will travel with it.
            </p>
            <label style={{display:"block", fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--ink-4)", marginBottom:4}}>Name</label>
            <input
              autoFocus
              value={saveAsPatternOpen.name}
              onChange={(e) => setSaveAsPatternOpen(s => s ? { ...s, name: e.target.value } : s)}
              style={{width:"100%", padding:"6px 8px", border:"1px solid var(--rule)", borderRadius:6, background:"var(--paper-card-2, #fff)", color:"var(--ink)", fontSize:13, marginBottom:10}}
            />
            <label style={{display:"block", fontSize:10, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--ink-4)", marginBottom:4}}>Slug</label>
            <input
              value={saveAsPatternOpen.slug}
              onChange={(e) => setSaveAsPatternOpen(s => s ? { ...s, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_-]+/g, "_") } : s)}
              style={{width:"100%", padding:"6px 8px", border:"1px solid var(--rule)", borderRadius:6, background:"var(--paper-card-2, #fff)", color:"var(--ink)", fontSize:12, fontFamily:"var(--font-mono, ui-monospace)"}}
            />
            <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:14}}>
              <button className="chip ghost sm" onClick={() => setSaveAsPatternOpen(null)}>Cancel</button>
              <button
                className="chip ember sm"
                onClick={() => confirmSaveAsPattern(saveAsPatternOpen)}
              >Save to Catalog</button>
            </div>
          </div>
        </div>
      )}

      {annotator && (
        <ScreenshotAnnotator
          state={annotator}
          onChange={setAnnotator}
          onCancel={() => setAnnotator(null)}
          onConfirm={async (finalState) => {
            // POST to /api/annotations/upload, then attach as an annotation to the edge.
            if (!finalState || !finalState.image || !finalState.image.data) {
              setAnnotator(null);
              return;
            }
            try {
              const r = await fetch("/api/annotations/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  image_base64: finalState.image.data,
                  mime: finalState.image.mime,
                  regions: finalState.regions || [],
                }),
              });
              const j = await r.json();
              if (j && j.ok && j.hash) {
                const nowIso = new Date().toISOString();
                const annoItem = {
                  id: `a_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,5)}`,
                  type: "screenshot",
                  hash: j.hash,
                  ext: j.ext,
                  url: j.url,
                  regions: j.regions || [],
                  created_at: nowIso,
                };
                if (finalState.nodeId) {
                  const node = present.nodes.find(n => n.id === finalState.nodeId);
                  if (node) {
                    const nextAnnos = [...(Array.isArray(node.annotations) ? node.annotations : []), annoItem];
                    updateNode(finalState.nodeId, { annotations: nextAnnos });
                    logLedger("catalog_annotation_attach_node", {
                      node_id: finalState.nodeId, hash: j.hash, regions: (j.regions || []).length, workflow_id: present.id,
                    });
                  }
                } else if (finalState.edgeId) {
                  const edge = present.connections.find(c => c.id === finalState.edgeId);
                  if (edge) {
                    const nextAnnos = [...(Array.isArray(edge.annotations) ? edge.annotations : []), annoItem];
                    updateConnection(finalState.edgeId, { annotations: nextAnnos });
                    logLedger("catalog_annotation_attach_ui", {
                      edge_id: finalState.edgeId, hash: j.hash, regions: (j.regions || []).length, workflow_id: present.id,
                    });
                  }
                }
                setToast("Screenshot attached.");
                setTimeout(() => setToast(null), 1400);
              } else {
                setToast(`Upload failed: ${j && j.error || "unknown"}`);
                setTimeout(() => setToast(null), 2000);
              }
            } catch (e) {
              setToast(`Upload failed: ${e.message}`);
              setTimeout(() => setToast(null), 2000);
            } finally {
              setAnnotator(null);
            }
          }}
        />
      )}

      {loadOpen && (
        <div
          onClick={() => setLoadOpen(false)}
          style={{
            position:"fixed", inset:0, zIndex:9999,
            background:"rgba(10,12,16,0.55)",
            display:"flex", alignItems:"center", justifyContent:"center",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              minWidth:360, maxWidth:480, maxHeight:"70vh", overflow:"auto",
              background:"var(--ag-surface-1, #1c1f28)",
              border:"1px solid var(--ag-rule)", borderRadius:10,
              padding:"14px 16px", color:"var(--ag-text-1)",
              fontFamily:"Inter, sans-serif",
            }}
          >
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
              <div style={{fontSize:13, fontWeight:600}}>Load workflow</div>
              <button className="export-btn" onClick={() => setLoadOpen(false)}>close</button>
            </div>
            {savedList.length === 0 ? (
              <div style={{fontSize:12, color:"var(--ag-text-3)", padding:"16px 4px"}}>
                No saved workflows yet. Use <b>Save</b> to store this one.
              </div>
            ) : (
              <div style={{display:"flex", flexDirection:"column", gap:6}}>
                {savedList.map(item => (
                  <button
                    key={item.slug}
                    onClick={() => loadWorkflow(item.slug)}
                    style={{
                      textAlign:"left", padding:"8px 10px", borderRadius:6,
                      background:"var(--ag-surface-2, #23262f)",
                      border:"1px solid var(--ag-rule)",
                      color:"var(--ag-text-1)",
                      cursor:"pointer",
                      fontFamily:"Inter, sans-serif", fontSize:12,
                    }}
                  >
                    <div style={{fontWeight:500}}>{item.name || item.slug}</div>
                    <div style={{fontSize:10, color:"var(--ag-text-3)", marginTop:2}}>
                      {item.slug}{item.updated_at ? ` · ${item.updated_at}` : ""}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{position:"fixed", inset:0, zIndex:9997, background:"rgba(10,12,16,0.72)", display:"flex", alignItems:"center", justifyContent:"center", padding:24, cursor:"zoom-out"}}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{position:"relative", maxWidth:"96vw", maxHeight:"92vh", background:"var(--paper, #fafaf6)", border:"1px solid var(--rule, #d5d1c6)", borderRadius:10, boxShadow:"0 20px 60px rgba(0,0,0,0.5)", overflow:"hidden", display:"flex", flexDirection:"column"}}
          >
            <div style={{padding:"10px 14px", borderBottom:"1px solid var(--rule)", display:"flex", alignItems:"center", gap:10}}>
              <h3 style={{margin:0, fontFamily:"var(--font-serif, Fraunces, serif)", fontSize:16, flex:1, color:"var(--ink)"}}>
                {lightbox.label || "Screenshot"}
              </h3>
              <span style={{fontSize:10.5, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.1em"}}>
                {(lightbox.regions || []).length} region{(lightbox.regions || []).length === 1 ? "" : "s"}
              </span>
              <button className="chip ghost sm" onClick={() => setLightbox(null)}>Close</button>
            </div>
            <div style={{flex:1, overflow:"auto", padding:14, background:"var(--paper-card-2, #fff)", display:"flex", alignItems:"center", justifyContent:"center"}}>
              <div style={{position:"relative", maxWidth:"100%", maxHeight:"78vh"}}>
                <img src={lightbox.url} alt="" style={{display:"block", maxWidth:"100%", maxHeight:"78vh", borderRadius:4}} />
                {Array.isArray(lightbox.regions) && lightbox.regions.length > 0 && (
                  <svg
                    viewBox="0 0 1 1"
                    preserveAspectRatio="none"
                    style={{position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none"}}
                  >
                    {lightbox.regions.map((r, i) => r.kind === "rect" ? (
                      <g key={i}>
                        <rect x={r.x} y={r.y} width={r.w} height={r.h} fill="rgba(217,130,54,0.14)" stroke="var(--ember, #d98236)" strokeWidth={0.003} vectorEffect="non-scaling-stroke" />
                        {r.label && <text x={r.x + 0.005} y={r.y + 0.018} fontSize="0.018" fill="var(--ember, #d98236)" style={{paintOrder:"stroke"}} stroke="var(--paper, #fafaf6)" strokeWidth="0.003">{r.label}</text>}
                      </g>
                    ) : (
                      <g key={i}>
                        <circle cx={r.x} cy={r.y} r={0.012} fill="var(--ember, #d98236)" stroke="var(--paper, #fafaf6)" strokeWidth={0.004} />
                        {r.label && <text x={r.x + 0.016} y={r.y + 0.005} fontSize="0.018" fill="var(--ember, #d98236)" style={{paintOrder:"stroke"}} stroke="var(--paper, #fafaf6)" strokeWidth="0.003">{r.label}</text>}
                      </g>
                    ))}
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
      {toast && <div className="ag-toast">{toast}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Ledger wiring
// ═══════════════════════════════════════════════════════════════════════════
function logLedger(kind, payload) {
  try {
    if (window.SecretaryLedger && window.SecretaryLedger.log) {
      window.SecretaryLedger.log(kind, payload);
    }
  } catch {}
}

// ═══════════════════════════════════════════════════════════════════════════
// AutomationShell — sub-tab routing wrapper (Apr 2026)
// ───────────────────────────────────────────────────────────────────────────
// The "automation" top-tab now hosts a secondary nav strip for the four
// extensions surfaced in the Comeketo Design Deck (pages 14–18):
//   Workflows · Sub-agents · State · Hooks · Triggers
// Workflows = the original AutomationGraphScreen, untouched. The other four
// are full-bleed pages of their own. Sub-tab is a route param so direct
// links (#automation/triggers) survive a reload via go.replace.
// ═══════════════════════════════════════════════════════════════════════════
const AUTO_SUBTABS = [
  { key: "workflows", label: "Workflows" },
  { key: "subagents", label: "Sub-agents" },
  { key: "state",     label: "State" },
  { key: "hooks",     label: "Hooks" },
  { key: "triggers",  label: "Triggers" },
];

function AutomationSubTabStrip({ active, onPick }) {
  return (
    <div className="auto-tabs">
      <div className="auto-tabs-inner">
        {AUTO_SUBTABS.map(t => (
          <button
            key={t.key}
            className={"auto-tab" + (active === t.key ? " is-active" : "")}
            onClick={() => onPick(t.key)}
            type="button"
          >
            <span className="auto-tab-label">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="auto-tabs-hint">
        <span style={{fontFamily:"var(--font-mono)", fontSize:11, color:"var(--ink-4)", letterSpacing:"0.04em"}}>
          automation
        </span>
      </div>
    </div>
  );
}

function AutomationShell({ go, tab, loadSlug }) {
  const active = AUTO_SUBTABS.some(t => t.key === tab) ? tab : "workflows";
  const onPick = (k) => { if (k === active) return; go.replace("automation", { tab: k }); };
  return (
    <div className="auto-shell">
      <AutomationSubTabStrip active={active} onPick={onPick} />
      <div className="auto-body">
        {active === "workflows" && <AutomationGraphScreen go={go} loadSlug={loadSlug} />}
        {active === "subagents" && <SubAgentPlannerScreen go={go} />}
        {active === "state" && <StateMachineScreen go={go} />}
        {active === "hooks" && <HooksScreen go={go} />}
        {active === "triggers" && <TriggersScreen go={go} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ComingSoonScreen — placeholder for the three sub-tabs we haven't built yet.
// Faithful to the deck's tone: a quiet card, the page reference, no fake UI.
// ═══════════════════════════════════════════════════════════════════════════
function ComingSoonScreen({ title, subtitle, deckPage }) {
  return (
    <div className="auto-page auto-page-stub">
      <div className="auto-stub-card">
        <div className="auto-stub-eyebrow">{deckPage} · in the deck</div>
        <h1 className="auto-stub-title">{title}</h1>
        <p className="auto-stub-sub">{subtitle}</p>
        <p className="auto-stub-note">
          The Triggers panel ships first. This view follows once Triggers is
          load-bearing — same paper, same rhythm, real bedrock data.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TriggersScreen — Cron, watch, webhook, rule, ribbon (deck page 18)
// ───────────────────────────────────────────────────────────────────────────
// Full-bleed page with three vertical bands:
//   1) Daily clock — 24h timeline of cron triggers, dots colored by tone
//   2) Type cards + Compose · Cron — picker + live cron→English parser
//   3) Configured · N — list of triggers from CCAgentindex/triggers/, with
//      seed examples from the deck when bedrock is empty
//
// Persistence:
//   GET  /api/triggers/list       → reads CCAgentindex/triggers/*.json
//   POST /api/triggers/save       → writes CCAgentindex/triggers/<slug>.json
//   POST /api/triggers/delete     → removes one
// All writes register in indexes/index.json[triggers] and append to
// _ledger/activity.jsonl. Same discipline as workflows + catalog.
// ═══════════════════════════════════════════════════════════════════════════

// Seed triggers — shown when bedrock has none yet. Five types, each true to
// the deck. These render on first paint so the page never feels empty.
const TG_SEED_TRIGGERS = [
  { slug: "morning_sweep_grid", kind: "cron", label: "Morning Sweep → Grid",   cron: "45 6 * * *",  tone: "lemon",    enabled: true,  notes: "Daily at 06:45.", seeded: true },
  { slug: "cadence_ping_sylvia", kind: "cron", label: "Cadence ping (Sylvia)",  cron: "0 9 * * *",   tone: "peach",    enabled: true,  notes: "Daily at 09:00.", seeded: true },
  { slug: "memory_consolidate",  kind: "cron", label: "Memory consolidation",  cron: "0 12 * * *",  tone: "lavender", enabled: true,  notes: "Daily at noon.",  seeded: true },
  { slug: "lead_enrichment",     kind: "cron", label: "Lead enrichment sweep", cron: "48 16 * * *", tone: "sage",     enabled: true,  notes: "Daily at 16:48.", seeded: true },
  { slug: "friday_recap",        kind: "cron", label: "Friday recap",          cron: "0 21 * * 5",  tone: "mint",     enabled: true,  notes: "Friday only.",    seeded: true },
  { slug: "inbox_watch",         kind: "watch",   label: "Inbox folder watch", path: "_inbox/",     tone: "sky",      enabled: true,  notes: "Debounced 200ms.", seeded: true },
  { slug: "stripe_payment",      kind: "webhook", label: "Stripe payment hook", endpoint: "/hook/stripe", tone: "blush",   enabled: true,  notes: "HTTP inbound.",   seeded: true },
  { slug: "tile_blocked",        kind: "rule",    label: "Tile transitions to BLOCKED", pattern: "tile.status === 'blocked'", tone: "rose", enabled: false, notes: "Drafted.", seeded: true },
  { slug: "voice_gesture",       kind: "ribbon",  label: "Voice · gesture cluster",     pattern: "sylvia.gesture",          tone: "lavender", enabled: true,  notes: "Live ribbon.", seeded: true },
];

const TG_TYPE_INFO = {
  cron:    { label: "Cron",    sub: "Time-based",     glyph: "⧗", tone: "lemon",    blurb: "Cron expressions, timezone-aware. Skips weekends if asked." },
  watch:   { label: "Watch",   sub: "File · path",    glyph: "◉", tone: "sky",      blurb: "Fires on changes under _inbox/, debounced 200ms." },
  webhook: { label: "Webhook", sub: "HTTP · inbound", glyph: "⌁", tone: "blush",    blurb: "Crisp · Stripe · WeddingWire · Gmail push." },
  rule:    { label: "Rule",    sub: "State · pattern", glyph: "▷", tone: "rose",    blurb: "Fires when a tile transitions to BLOCKED." },
  ribbon:  { label: "Ribbon",  sub: "Voice · gesture", glyph: "✦", tone: "lavender", blurb: "A trigger that you are. Sylvia surfaces ribbons when your gesture stream forms a known cluster." },
};

// Tiny cron→English parser. Handles the cases this UI lets you compose:
// minutes (literal | * | */N), hours (literal | * | */N), day-of-month
// (* only for now), month (* only), day-of-week (* | digit | range like 1-5
// | comma list). Anything else falls back to "Custom schedule".
function tgCronToEnglish(min, hour, dom, mon, dow) {
  const M = (min ?? "").trim();
  const H = (hour ?? "").trim();
  const D = (dom ?? "").trim();
  const Mo = (mon ?? "").trim();
  const W = (dow ?? "").trim();
  const intM = /^\d+$/.test(M) ? parseInt(M, 10) : null;
  const intH = /^\d+$/.test(H) ? parseInt(H, 10) : null;
  // Helpers
  const dowName = (n) => ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][((n%7)+7)%7];
  const fmt = (h, m) => {
    if (h == null || m == null) return null;
    const ap = h >= 12 ? "PM" : "AM";
    const h12 = ((h + 11) % 12) + 1;
    return `${String(h12).padStart(2," ")}:${String(m).padStart(2,"0")} ${ap}`.trim();
  };
  // Every-N minutes pattern
  const everyMin = M.match(/^\*\/(\d+)$/);
  if (everyMin && H === "*" && D === "*" && Mo === "*" && W === "*") {
    return `Every ${everyMin[1]} minutes.`;
  }
  // Every hour at minute M
  if (intM != null && H === "*" && D === "*" && Mo === "*" && W === "*") {
    return `Every hour at :${String(intM).padStart(2,"0")}.`;
  }
  // Daily at H:M (W is *)
  if (intM != null && intH != null && D === "*" && Mo === "*" && (W === "*" || W === "")) {
    return `Every day at ${fmt(intH, intM)}.`;
  }
  // Weekday range
  if (intM != null && intH != null && D === "*" && Mo === "*" && /^1-5$/.test(W)) {
    return `Every weekday at ${fmt(intH, intM)}.`;
  }
  // Single DOW digit
  if (intM != null && intH != null && D === "*" && Mo === "*" && /^\d$/.test(W)) {
    return `Every ${dowName(parseInt(W,10))} at ${fmt(intH, intM)}.`;
  }
  // Comma list of DOW digits
  if (intM != null && intH != null && D === "*" && Mo === "*" && /^\d(,\d)+$/.test(W)) {
    const days = W.split(",").map(d => dowName(parseInt(d,10))).join(", ");
    return `${days} at ${fmt(intH, intM)}.`;
  }
  return "Custom schedule.";
}

// 24h dot strip — places one dot per cron-kind trigger at its fire-hour.
function TgDailyClock({ triggers }) {
  const cronOnes = (triggers || []).filter(t => t.kind === "cron");
  const dots = cronOnes.map(t => {
    const parts = (t.cron || "").split(/\s+/);
    const m = parseInt(parts[0], 10);
    const h = parseInt(parts[1], 10);
    if (!isFinite(h)) return null;
    const minutes = (isFinite(m) ? m : 0);
    const x = ((h * 60 + minutes) / (24 * 60)) * 100;
    return { x, t };
  }).filter(Boolean);

  return (
    <div className="tg-clock">
      <div className="tg-clock-head">
        <span className="tg-eyebrow">Daily clock · 24h</span>
        <span className="tg-clock-count">{cronOnes.length} cron</span>
      </div>
      <div className="tg-clock-track">
        {[0,6,12,18,24].map(h => (
          <span key={h} className="tg-clock-tick" style={{left: `${(h/24)*100}%`}}>
            <span className="tg-clock-tick-line"/>
            <span className="tg-clock-tick-label">{String(h).padStart(2,"0")}</span>
          </span>
        ))}
        <span className="tg-clock-line"/>
        {dots.map((d, i) => (
          <span
            key={i}
            className={`tg-clock-dot tg-tone-${d.t.tone || "sage"}`}
            style={{left: `${d.x}%`}}
            title={`${d.t.label} — ${d.t.cron}`}
          />
        ))}
      </div>
      <div className="tg-clock-legend">
        {cronOnes.map(t => {
          const parts = (t.cron || "").split(/\s+/);
          const h = parseInt(parts[1],10), m = parseInt(parts[0],10);
          const hh = String(isFinite(h)?h:0).padStart(2,"0");
          const mm = String(isFinite(m)?m:0).padStart(2,"0");
          return (
            <div key={t.slug} className="tg-clock-row">
              <span className={`tg-dot tg-tone-${t.tone || "sage"}`}/>
              <span className="tg-clock-time">{hh}:{mm}</span>
              <span className="tg-clock-label">{t.label}</span>
              <span className="tg-clock-kind">{t.kind}</span>
            </div>
          );
        })}
        {cronOnes.length === 0 && (
          <div className="tg-empty">No cron triggers yet. Compose one below.</div>
        )}
      </div>
    </div>
  );
}

// Clickable type card — clicking swaps the active composer. Active card
// gets an ink ring; others stay quiet.
function TgTypeCard({ kind, count, drafted, isActive, onClick }) {
  const info = TG_TYPE_INFO[kind] || {};
  return (
    <button
      type="button"
      className={`tg-type tg-tone-${info.tone || "sage"}` + (isActive ? " is-active" : "")}
      onClick={onClick}
      title={`Compose a new ${info.label || kind} trigger`}
    >
      <div className="tg-type-row">
        <span className="tg-type-glyph">{info.glyph}</span>
        <span className="tg-type-eyebrow">{kind}</span>
        <span className="tg-type-count">
          {drafted ? `${drafted} drafted` : (count > 0 ? `${count} active` : "—")}
        </span>
      </div>
      <div className="tg-type-title">{info.label}</div>
      <div className="tg-type-sub">{info.sub}</div>
      <div className="tg-type-blurb">{info.blurb}</div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Composer presets — every composer is dropdown-driven (per the no-forms
// directive). Free text is kept to one optional field per composer (label),
// and we auto-suggest that based on the dropdown values.
// ═══════════════════════════════════════════════════════════════════════════

const TG_CRON_PRESETS = [
  { id: "every_weekday",    label: "Every weekday",      cron: "0 9 * * 1-5" },
  { id: "every_day",        label: "Every day",          cron: "0 9 * * *" },
  { id: "every_hour_at",    label: "Every hour at :MM",  cron: "0 * * * *" },
  { id: "every_n_minutes",  label: "Every N minutes",    cron: "*/15 * * * *" },
  { id: "fridays_only",     label: "Fridays only",       cron: "0 21 * * 5" },
  { id: "custom",           label: "Custom cron…",       cron: "45 6 * * 1-5" },
];

const TG_WATCH_PATHS = [
  { path: "_inbox/",           label: "Inbox folder",          tone: "sky" },
  { path: "_ledger/",          label: "Activity ledger",       tone: "sage" },
  { path: "tables/",           label: "Tables",                tone: "lavender" },
  { path: "agent_plans/",      label: "Agent plans",           tone: "lemon" },
  { path: "commitments/",      label: "Commitments",           tone: "peach" },
  { path: "people/",           label: "People",                tone: "blush" },
  { path: "projects/",         label: "Projects",              tone: "mint" },
  { path: "knowledge/",        label: "Knowledge base",        tone: "sage" },
  { path: "workflows/",        label: "Workflows",             tone: "lavender" },
];

const TG_DEBOUNCE_OPTIONS = [50, 100, 200, 500, 1000];

const TG_WEBHOOK_SERVICES = [
  { id: "crisp",        label: "Crisp",         hint: "chat events",         tone: "lavender" },
  { id: "stripe",       label: "Stripe",        hint: "payment events",      tone: "blush" },
  { id: "weddingwire",  label: "WeddingWire",   hint: "lead source",         tone: "peach" },
  { id: "gmail",        label: "Gmail push",    hint: "inbox notifications", tone: "sky" },
  { id: "twilio",       label: "Twilio",        hint: "SMS / WhatsApp",      tone: "lemon" },
  { id: "close",        label: "Close",         hint: "CRM events",          tone: "sage" },
  { id: "custom",       label: "Custom",        hint: "any HTTP source",     tone: "rose" },
];

const TG_WEBHOOK_AUTH = ["none", "token", "signature"];

const TG_RULE_PATTERN_TYPES = [
  { id: "tile_state",         label: "Tile transitions to…",       filters: ["BLOCKED", "DRAFT", "SHIPPED", "STARTED"] },
  { id: "lead_status",        label: "Lead status changes to…",     filters: ["tasting booked", "qualified", "lost", "closed-won", "other"] },
  { id: "commitment_status",  label: "Commitment becomes…",         filters: ["pending", "sending", "sent", "failed"] },
  { id: "task_event",         label: "Task event…",                 filters: ["completed", "reopened", "stalled"] },
  { id: "agent_plan_event",   label: "Agent plan run…",             filters: ["started", "blocked", "shipped"] },
];

const TG_RIBBON_SOURCES = [
  { id: "sylvia_gesture",  label: "Sylvia gesture", patterns: ["focus_drift", "context_switch", "reflective_pause", "energy_burst"] },
  { id: "voice_cluster",   label: "Voice cluster",  patterns: ["andre_check_in", "rodrigo_directive", "team_alignment"] },
  { id: "manual",          label: "Manual",         patterns: ["tag_now", "spotlight"] },
];

// Workflow-target picker — shared across all composers. Reads /api/workflows/list.
function TgWorkflowPicker({ value, onChange, workflows }) {
  return (
    <label className="tg-field tg-field-wf">
      <span>fires workflow</span>
      <select value={value || ""} onChange={e => onChange(e.target.value)}>
        <option value="">— none —</option>
        {(workflows || []).map(w => (
          <option key={w.slug} value={w.slug}>{w.name || w.slug}</option>
        ))}
      </select>
    </label>
  );
}

// Auto-suggest a label given the composer values; user can override it.
function tgAutoLabel(kind, values) {
  if (kind === "cron") {
    const preset = TG_CRON_PRESETS.find(p => p.id === values.preset);
    if (preset && preset.id !== "custom") return preset.label;
    return `Cron · ${values.min || "*"} ${values.hour || "*"} ${values.dow || "*"}`;
  }
  if (kind === "watch") {
    const wp = TG_WATCH_PATHS.find(p => p.path === values.path);
    return wp ? `Watch · ${wp.label}` : "Watch · folder";
  }
  if (kind === "webhook") {
    const sv = TG_WEBHOOK_SERVICES.find(s => s.id === values.service);
    return sv ? `${sv.label} webhook` : "Custom webhook";
  }
  if (kind === "rule") {
    const pt = TG_RULE_PATTERN_TYPES.find(p => p.id === values.pattern_type);
    if (!pt) return "Rule · state pattern";
    return `Rule · ${pt.label.replace("…", values.filter || "—")}`;
  }
  if (kind === "ribbon") {
    const sr = TG_RIBBON_SOURCES.find(s => s.id === values.source);
    return sr ? `Ribbon · ${sr.label} (${values.pattern || "—"})` : "Ribbon";
  }
  return "Trigger";
}

// ═══════════════════════════════════════════════════════════════════════════
// TgComposer — kind router + shared chrome (auto-label, save, workflow link)
// ═══════════════════════════════════════════════════════════════════════════
function TgComposer({ kind, values, onChange, onSave, saving, label, onLabel, workflows }) {
  const auto = tgAutoLabel(kind, values);
  // Expose a live "reads as" preview specific to each kind.
  const readsAs = (() => {
    if (kind === "cron") return tgCronToEnglish(values.min, values.hour, values.dom, values.mon, values.dow);
    if (kind === "watch") {
      const wp = TG_WATCH_PATHS.find(p => p.path === values.path);
      const dbn = values.debounce_ms || 200;
      return wp ? `Fires when files change in ${wp.path} (debounced ${dbn}ms).` : "—";
    }
    if (kind === "webhook") {
      const sv = TG_WEBHOOK_SERVICES.find(s => s.id === values.service);
      const auth = values.auth || "none";
      return sv ? `POST /hook/${sv.id} · auth: ${auth}` : "—";
    }
    if (kind === "rule") {
      const pt = TG_RULE_PATTERN_TYPES.find(p => p.id === values.pattern_type);
      return pt ? `Fires when ${pt.label.replace("…", `'${values.filter || "—"}'`)}` : "—";
    }
    if (kind === "ribbon") {
      const sr = TG_RIBBON_SOURCES.find(s => s.id === values.source);
      return sr ? `Fires when ${sr.label.toLowerCase()} forms cluster '${values.pattern || "—"}'.` : "—";
    }
    return "";
  })();

  const composer = (() => {
    if (kind === "cron") return <TgComposerCron values={values} onChange={onChange}/>;
    if (kind === "watch") return <TgComposerWatch values={values} onChange={onChange}/>;
    if (kind === "webhook") return <TgComposerWebhook values={values} onChange={onChange}/>;
    if (kind === "rule") return <TgComposerRule values={values} onChange={onChange}/>;
    if (kind === "ribbon") return <TgComposerRibbon values={values} onChange={onChange}/>;
    return null;
  })();

  return (
    <div className="tg-compose">
      <div className="tg-compose-head">
        <span className="tg-eyebrow">Compose · {kind}</span>
        <span className="tg-compose-hint">click a type above to switch</span>
      </div>
      {composer}
      <div className="tg-compose-reads">
        <span className="tg-eyebrow">reads as</span>
        <em>{readsAs}</em>
      </div>
      <div className="tg-compose-foot">
        <label className="tg-field tg-field-label">
          <span>label</span>
          <input
            value={label}
            placeholder={auto}
            onChange={e => onLabel(e.target.value)}
          />
        </label>
        <TgWorkflowPicker
          value={values.workflow_slug}
          onChange={v => onChange({ ...values, workflow_slug: v })}
          workflows={workflows}
        />
        <button
          className="tg-save"
          onClick={onSave}
          disabled={saving}
          title="Save trigger (auto-labeled if blank)"
        >
          {saving ? "saving…" : "+ save trigger"}
        </button>
      </div>
    </div>
  );
}

// ── Cron composer (presets + custom mode) ───────────────────────────────
function TgComposerCron({ values, onChange }) {
  const setPreset = (presetId) => {
    const p = TG_CRON_PRESETS.find(x => x.id === presetId);
    if (!p) return;
    if (presetId === "custom") {
      onChange({ ...values, preset: "custom" });
      return;
    }
    const [min, hour, dom, mon, dow] = p.cron.split(" ");
    onChange({ ...values, preset: presetId, min, hour, dom, mon, dow });
  };
  return (
    <>
      <div className="tg-preset-row">
        {TG_CRON_PRESETS.map(p => (
          <button
            key={p.id}
            type="button"
            className={"tg-preset-chip" + (values.preset === p.id ? " is-active" : "")}
            onClick={() => setPreset(p.id)}
          >{p.label}</button>
        ))}
      </div>
      {/* Time picker for time-based presets */}
      {(values.preset === "every_weekday" || values.preset === "every_day" || values.preset === "fridays_only") && (
        <div className="tg-compose-grid tg-compose-grid-time">
          <label className="tg-field">
            <span>at time</span>
            <input
              type="time"
              value={`${String(values.hour || 9).padStart(2,"0")}:${String(values.min || 0).padStart(2,"0")}`}
              onChange={e => {
                const [h, m] = e.target.value.split(":");
                onChange({ ...values, hour: String(parseInt(h, 10) || 0), min: String(parseInt(m, 10) || 0) });
              }}
            />
          </label>
        </div>
      )}
      {/* Minute-of-hour for "every hour at :MM" */}
      {values.preset === "every_hour_at" && (
        <div className="tg-compose-grid tg-compose-grid-time">
          <label className="tg-field">
            <span>at minute</span>
            <input type="number" min="0" max="59"
              value={values.min || 0}
              onChange={e => onChange({ ...values, min: e.target.value })}/>
          </label>
        </div>
      )}
      {/* N minutes for "every N minutes" */}
      {values.preset === "every_n_minutes" && (
        <div className="tg-preset-row">
          {[1, 5, 15, 30].map(n => (
            <button
              key={n}
              type="button"
              className={"tg-preset-chip" + ((values.min === `*/${n}`) ? " is-active" : "")}
              onClick={() => onChange({ ...values, min: `*/${n}`, hour: "*", dom: "*", mon: "*", dow: "*" })}
            >every {n} min</button>
          ))}
        </div>
      )}
      {/* Custom: full 5-field input — preserved as power-user mode */}
      {values.preset === "custom" && (
        <div className="tg-compose-grid">
          <label className="tg-field"><span>min</span><input value={values.min} onChange={e => onChange({...values, min: e.target.value})}/></label>
          <label className="tg-field"><span>hour</span><input value={values.hour} onChange={e => onChange({...values, hour: e.target.value})}/></label>
          <label className="tg-field"><span>day</span><input value={values.dom} onChange={e => onChange({...values, dom: e.target.value})}/></label>
          <label className="tg-field"><span>month</span><input value={values.mon} onChange={e => onChange({...values, mon: e.target.value})}/></label>
          <label className="tg-field"><span>dow</span><input value={values.dow} onChange={e => onChange({...values, dow: e.target.value})}/></label>
        </div>
      )}
    </>
  );
}

// ── Watch composer ──────────────────────────────────────────────────────
function TgComposerWatch({ values, onChange }) {
  return (
    <>
      <div className="tg-compose-grid tg-compose-grid-watch">
        <label className="tg-field">
          <span>watch path</span>
          <select value={values.path || ""} onChange={e => onChange({ ...values, path: e.target.value })}>
            <option value="">— pick a folder —</option>
            {TG_WATCH_PATHS.map(p => (
              <option key={p.path} value={p.path}>{p.path} · {p.label}</option>
            ))}
          </select>
        </label>
        <label className="tg-field">
          <span>recursive</span>
          <select value={values.recursive ? "yes" : "no"} onChange={e => onChange({ ...values, recursive: e.target.value === "yes" })}>
            <option value="yes">yes — include subfolders</option>
            <option value="no">no — top level only</option>
          </select>
        </label>
      </div>
      <div className="tg-preset-row">
        <span className="tg-preset-label">debounce</span>
        {TG_DEBOUNCE_OPTIONS.map(ms => (
          <button
            key={ms}
            type="button"
            className={"tg-preset-chip" + ((values.debounce_ms || 200) === ms ? " is-active" : "")}
            onClick={() => onChange({ ...values, debounce_ms: ms })}
          >{ms < 1000 ? `${ms}ms` : `${ms/1000}s`}</button>
        ))}
      </div>
    </>
  );
}

// ── Webhook composer ────────────────────────────────────────────────────
function TgComposerWebhook({ values, onChange }) {
  const sv = TG_WEBHOOK_SERVICES.find(s => s.id === values.service);
  const url = sv ? `/hook/${sv.id}` : "/hook/—";
  return (
    <>
      <div className="tg-compose-grid tg-compose-grid-webhook">
        <label className="tg-field">
          <span>service</span>
          <select value={values.service || ""} onChange={e => onChange({ ...values, service: e.target.value, endpoint: e.target.value ? `/hook/${e.target.value}` : "" })}>
            <option value="">— pick a service —</option>
            {TG_WEBHOOK_SERVICES.map(s => (
              <option key={s.id} value={s.id}>{s.label} · {s.hint}</option>
            ))}
          </select>
        </label>
        <label className="tg-field">
          <span>endpoint</span>
          <code className="tg-readonly-url">{url}</code>
        </label>
      </div>
      <div className="tg-preset-row">
        <span className="tg-preset-label">auth</span>
        {TG_WEBHOOK_AUTH.map(a => (
          <button
            key={a}
            type="button"
            className={"tg-preset-chip" + ((values.auth || "none") === a ? " is-active" : "")}
            onClick={() => onChange({ ...values, auth: a })}
          >{a}</button>
        ))}
      </div>
    </>
  );
}

// ── Rule composer ───────────────────────────────────────────────────────
function TgComposerRule({ values, onChange }) {
  const pt = TG_RULE_PATTERN_TYPES.find(p => p.id === values.pattern_type);
  return (
    <>
      <div className="tg-compose-grid tg-compose-grid-rule">
        <label className="tg-field">
          <span>pattern</span>
          <select value={values.pattern_type || ""} onChange={e => onChange({ ...values, pattern_type: e.target.value, filter: "" })}>
            <option value="">— pick a pattern —</option>
            {TG_RULE_PATTERN_TYPES.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </label>
        <label className="tg-field">
          <span>filter</span>
          <select
            value={values.filter || ""}
            onChange={e => onChange({ ...values, filter: e.target.value, pattern: e.target.value ? `${values.pattern_type}=${e.target.value}` : "" })}
            disabled={!pt}
          >
            <option value="">{pt ? "— pick a filter —" : "(pick pattern first)"}</option>
            {(pt?.filters || []).map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}

// ── Ribbon composer ─────────────────────────────────────────────────────
function TgComposerRibbon({ values, onChange }) {
  const sr = TG_RIBBON_SOURCES.find(s => s.id === values.source);
  return (
    <>
      <div className="tg-compose-grid tg-compose-grid-ribbon">
        <label className="tg-field">
          <span>source</span>
          <select value={values.source || ""} onChange={e => onChange({ ...values, source: e.target.value, pattern: "" })}>
            <option value="">— pick a source —</option>
            {TG_RIBBON_SOURCES.map(s => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </label>
        <label className="tg-field">
          <span>pattern</span>
          <select value={values.pattern || ""} onChange={e => onChange({ ...values, pattern: e.target.value })} disabled={!sr}>
            <option value="">{sr ? "— pick a pattern —" : "(pick source first)"}</option>
            {(sr?.patterns || []).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </label>
      </div>
    </>
  );
}

function TgConfiguredList({ triggers, onToggle, onDelete, onJumpToWorkflow, workflows }) {
  // Build a quick lookup so we can show the workflow's friendly name (not slug).
  const workflowNameBySlug = (workflows || []).reduce((acc, w) => {
    acc[w.slug] = w.name || w.slug;
    return acc;
  }, {});
  return (
    <div className="tg-configured">
      <div className="tg-configured-head">
        <span className="tg-eyebrow">Configured · {triggers.length}</span>
        <span className="tg-configured-hint">
          {triggers.filter(t=>t.seeded).length > 0 ? "showing deck seed + bedrock" : "from CCAgentindex/triggers/"}
        </span>
      </div>
      <div className="tg-configured-rows">
        {triggers.length === 0 && (
          <div className="tg-empty">No triggers yet. The compose card above writes to the bedrock.</div>
        )}
        {triggers.map(t => {
          const info = TG_TYPE_INFO[t.kind] || {};
          const detail = t.kind === "cron"    ? (t.cron || "")
                       : t.kind === "watch"   ? (t.path || "")
                       : t.kind === "webhook" ? (t.endpoint || "")
                       : t.kind === "rule"    ? (t.pattern || "")
                       : t.kind === "ribbon"  ? (t.pattern || "")
                       : "";
          const wfName = t.workflow_slug ? (workflowNameBySlug[t.workflow_slug] || t.workflow_slug) : null;
          return (
            <div key={t.slug} className={"tg-row" + (t.enabled ? "" : " is-paused")}>
              <span className={`tg-row-dot tg-tone-${t.tone || "sage"}`}/>
              <span className="tg-row-kind">{info.label || t.kind}</span>
              <span className="tg-row-label">{t.label || t.slug}</span>
              <code className="tg-row-detail">{detail}</code>
              {wfName ? (
                <button
                  className="tg-row-wf"
                  onClick={() => onJumpToWorkflow(t.workflow_slug)}
                  title={`Jump to workflow: ${wfName}`}
                >→ {agTruncate(wfName, 22)}</button>
              ) : (
                <span className="tg-row-wf tg-row-wf-empty">—</span>
              )}
              <span className={"tg-row-state" + (t.enabled ? " on" : " off")}>
                {t.seeded ? (t.enabled ? "seed · live" : "seed · paused") : (t.enabled ? "live" : "paused")}
              </span>
              <button
                className="tg-row-toggle"
                onClick={()=>onToggle(t)}
                title={t.enabled ? "Pause" : "Resume"}
                disabled={t.seeded}
              >{t.enabled ? "pause" : "resume"}</button>
              <button
                className="tg-row-delete"
                onClick={()=>onDelete(t)}
                title="Delete trigger"
                disabled={t.seeded}
              >×</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Per-kind starter values for the composer. Picking a type card resets to
// these defaults so the composer is always coherent.
const TG_COMPOSER_DEFAULTS = {
  cron:    { preset: "every_weekday", min: "0",  hour: "9",  dom: "*", mon: "*", dow: "1-5", workflow_slug: "" },
  watch:   { path: "_inbox/", recursive: true, debounce_ms: 200, workflow_slug: "" },
  webhook: { service: "stripe", endpoint: "/hook/stripe", auth: "signature", workflow_slug: "" },
  rule:    { pattern_type: "tile_state", filter: "BLOCKED", pattern: "tile_state=BLOCKED", workflow_slug: "" },
  ribbon:  { source: "sylvia_gesture", pattern: "focus_drift", workflow_slug: "" },
};

function TriggersScreen({ go }) {
  const [items, setItems] = ag_useState([]);
  const [loading, setLoading] = ag_useState(true);
  const [composerKind, setComposerKind] = ag_useState("cron");
  const [valuesByKind, setValuesByKind] = ag_useState(() => sapClone(TG_COMPOSER_DEFAULTS));
  const [composerLabel, setComposerLabel] = ag_useState("");
  const [saving, setSaving] = ag_useState(false);
  const [toast, setToast] = ag_useState(null);
  const [workflows, setWorkflows] = ag_useState([]);

  const composer = valuesByKind[composerKind];
  const setComposer = (next) => setValuesByKind(v => ({ ...v, [composerKind]: typeof next === "function" ? next(v[composerKind]) : next }));

  const refresh = ag_useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/triggers/list");
      const j = await r.json();
      setItems(Array.isArray(j.items) ? j.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Workflows list — for the workflow-target picker on every composer.
  const refreshWorkflows = ag_useCallback(async () => {
    try {
      const r = await fetch("/api/workflows/list");
      const j = await r.json();
      setWorkflows(Array.isArray(j.items) ? j.items : []);
    } catch {
      setWorkflows([]);
    }
  }, []);

  ag_useEffect(() => { refresh(); refreshWorkflows(); }, [refresh, refreshWorkflows]);

  // Merge bedrock + seed (seed shown only when bedrock is empty for that kind)
  const merged = ag_useMemo(() => {
    const fromBedrock = (items || []).map(it => ({ ...it, seeded: false }));
    const seenSlugs = new Set(fromBedrock.map(it => it.slug));
    const seeds = TG_SEED_TRIGGERS.filter(s => !seenSlugs.has(s.slug));
    return [...fromBedrock, ...seeds];
  }, [items]);

  const counts = ag_useMemo(() => {
    const c = { cron: 0, watch: 0, webhook: 0, rule: 0, ribbon: 0 };
    const drafted = { cron: 0, watch: 0, webhook: 0, rule: 0, ribbon: 0 };
    for (const t of merged) {
      if (!c[t.kind] && c[t.kind] !== 0) continue;
      if (t.enabled) c[t.kind] = (c[t.kind] || 0) + 1;
      else drafted[t.kind] = (drafted[t.kind] || 0) + 1;
    }
    return { c, drafted };
  }, [merged]);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(null), 2200); };

  const slugify = (s) => (s || "").toLowerCase().trim()
    .replace(/[^a-z0-9_\- ]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80) || `trigger_${Date.now().toString(36)}`;

  // Click a type card → swap composer mode AND reset values to that kind's defaults.
  const onPickKind = ag_useCallback((k) => {
    if (k === composerKind) return;
    setComposerKind(k);
    setComposerLabel("");
  }, [composerKind]);

  // Save — routes payload shape per active kind.
  const onSave = ag_useCallback(async () => {
    const auto = tgAutoLabel(composerKind, composer);
    const finalLabel = composerLabel.trim() || auto;
    const slug = slugify(finalLabel);
    // Build the per-kind payload.
    const base = {
      slug,
      kind: composerKind,
      label: finalLabel,
      tone: TG_TYPE_INFO[composerKind]?.tone || "sage",
      enabled: true,
      workflow_slug: composer.workflow_slug || undefined,
    };
    let body = base;
    if (composerKind === "cron") {
      const cron = `${composer.min} ${composer.hour} ${composer.dom} ${composer.mon} ${composer.dow}`.trim();
      body = {
        ...base,
        cron,
        preset: composer.preset,
        notes: tgCronToEnglish(composer.min, composer.hour, composer.dom, composer.mon, composer.dow),
      };
    } else if (composerKind === "watch") {
      body = { ...base, path: composer.path || "", debounce_ms: composer.debounce_ms || 200, recursive: !!composer.recursive };
    } else if (composerKind === "webhook") {
      const sv = TG_WEBHOOK_SERVICES.find(s => s.id === composer.service);
      body = { ...base, endpoint: sv ? `/hook/${sv.id}` : "/hook/custom", service: composer.service || "custom", auth: composer.auth || "none" };
    } else if (composerKind === "rule") {
      body = { ...base, pattern: composer.pattern || `${composer.pattern_type}=${composer.filter}`, pattern_type: composer.pattern_type, filter: composer.filter };
    } else if (composerKind === "ribbon") {
      body = { ...base, pattern: composer.pattern || "", source: composer.source || "" };
    }
    setSaving(true);
    try {
      const r = await fetch("/api/triggers/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (j && j.ok) {
        showToast(`saved · ${slug}`);
        setComposerLabel("");
        // Reset values for that kind so the composer reads "fresh" after save.
        setValuesByKind(v => ({ ...v, [composerKind]: sapClone(TG_COMPOSER_DEFAULTS[composerKind]) }));
        await refresh();
      } else {
        showToast(`save failed · ${(j && j.error) || "unknown"}`);
      }
    } catch (e) {
      showToast(`save failed · ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  }, [composerKind, composer, composerLabel, refresh]);

  const onToggle = ag_useCallback(async (t) => {
    if (t.seeded) { showToast("seed triggers can't be toggled — save your own"); return; }
    try {
      const r = await fetch("/api/triggers/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...t, enabled: !t.enabled }),
      });
      const j = await r.json();
      if (j && j.ok) { await refresh(); showToast(t.enabled ? "paused" : "resumed"); }
    } catch {}
  }, [refresh]);

  const onDelete = ag_useCallback(async (t) => {
    if (t.seeded) return;
    if (!confirm(`Delete trigger "${t.label}"?`)) return;
    try {
      const r = await fetch("/api/triggers/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: t.slug }),
      });
      const j = await r.json();
      if (j && j.ok) { await refresh(); showToast(`deleted · ${t.slug}`); }
    } catch {}
  }, [refresh]);

  // Cross-tab nav: jump to Workflows tab with the named workflow loaded.
  const onJumpToWorkflow = ag_useCallback((slug) => {
    if (!slug) return;
    go.replace("automation", { tab: "workflows", load: slug });
  }, [go]);

  return (
    <div className="auto-page tg-page">
      <div className="tg-header">
        <div className="tg-eyebrow tg-eyebrow-page">18 · automation</div>
        <h1 className="tg-title">Triggers. <em>Cron, watch, webhook, rule, ribbon.</em></h1>
        <p className="tg-sub">How the system wakes up. Pick a type below to compose one — every dropdown is a wired choice, not a form to fill.</p>
      </div>

      <div className="tg-grid">
        {/* Left column — daily clock */}
        <div className="tg-col tg-col-clock">
          <TgDailyClock triggers={merged} />
        </div>

        {/* Right column — type cards (clickable; active = composer mode) */}
        <div className="tg-col tg-col-types">
          <div className="tg-types">
            {["cron","watch","webhook","rule","ribbon"].map(k => (
              <TgTypeCard
                key={k}
                kind={k}
                count={counts.c[k] || 0}
                drafted={counts.drafted[k] || 0}
                isActive={composerKind === k}
                onClick={() => onPickKind(k)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Composer (router) */}
      <TgComposer
        kind={composerKind}
        values={composer}
        onChange={setComposer}
        label={composerLabel}
        onLabel={setComposerLabel}
        onSave={onSave}
        saving={saving}
        workflows={workflows}
      />

      {/* Configured list */}
      <TgConfiguredList
        triggers={merged}
        onToggle={onToggle}
        onDelete={onDelete}
        onJumpToWorkflow={onJumpToWorkflow}
        workflows={workflows}
      />

      {toast && <div className="tg-toast">{toast}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SubAgentPlannerScreen — Orchestrator → fanout → merge (deck page 14)
// ───────────────────────────────────────────────────────────────────────────
// A real planning surface. You compose a fanout: Rodbot orchestrator
// dispatches N parallel sub-agents to attack one question, then a merge
// node folds the results back. Plans persist to bedrock at
// CCAgentindex/agent_plans/<slug>.json (separate from the descriptive
// agents/<slug>/agents.md specs).
//
// Layout:
//   [Plan picker bar]
//   [Fanout canvas | sidecar (concurrency / spend / live stream)]
//   [Inspector strip — selected SA editor]
//   [Budgets footer — caps + add SA]
// ═══════════════════════════════════════════════════════════════════════════

// ── Tone palette (mirrors deck) ──
const SAP_TONES = ["mint","peach","lavender","sky","lemon","rose","sage","blush"];

// ── Status → tone mapping for the playback loop ──
//   queued       → paper (waiting)
//   planning     → lemon  (yellow)
//   tool_call    → lavender
//   tool_await   → sky    (waiting on tool)
//   reflect      → mint   (got result, judging)
//   shipped      → mint   (done — also mint, slightly darker via "done" class)
//   blocked      → rose
//   working      → lemon  (catch-all "doing something")
const SAP_STATUS_TONE = {
  queued: "sage", planning: "lemon", tool_call: "lavender", tool_await: "sky",
  reflect: "mint", shipped: "mint", blocked: "rose", working: "lemon",
};

const SAP_TOOL_OPTIONS = [
  "close.lead.fetch", "close.lead.update", "close.task.create", "close.activity.search",
  "gmail.thread.search", "gmail.message.send",
  "slack.message.post", "slack.channel.search",
  "wedding_wire.search",
  "tables.read", "tables.append", "tables.update",
  "rodbot.affinity", "rodbot.classify",
  "file.read", "file.write",
  "webhook.fire",
];

const SAP_ACTION_OPTIONS = [
  "enrich", "classify", "score", "summarize", "extract", "filter",
  "fetch", "write", "send", "schedule", "audit",
];

// ── Seed plans (shown when bedrock has none yet) ──
const SAP_SEED_PLANS = [
  {
    schema: "comeketo.agent_plan.v1",
    slug: "tagging_hygiene",
    name: "Tagging hygiene · re-classify \"other\"",
    description: "Rodbot dispatches 6 sub-agents to enrich + classify 12 leads currently tagged 'other' in Close.",
    trigger_label: "12 leads · trusted",
    orchestrator: { label: "Rodbot", model: "claude-sonnet-4-6", register: "operational" },
    budgets: { max_sub_agents: 8, tokens_cap: 12000, wallclock_cap_s: 60, retry_policy: "linear_backoff" },
    sub_agents: [
      { id: "SA-01", action: "enrich",   tool: "close.lead.fetch",    prompt_template: "Enrich {{lead.id}}: pull most recent thread + firmographic facts.", leads: 2, retries: 2, timeout_s: 30, tone: "lavender", expected_latency_s: 4.2 },
      { id: "SA-02", action: "classify", tool: "close.lead.update",   prompt_template: "Re-classify {{lead.id}} away from 'other' using the playbook.", leads: 2, retries: 2, timeout_s: 30, tone: "lavender", expected_latency_s: 3.8 },
      { id: "SA-03", action: "classify", tool: "close.lead.update",   prompt_template: "Re-classify {{lead.id}} (batch 2).", leads: 2, retries: 2, timeout_s: 30, tone: "lavender", expected_latency_s: 4.0 },
      { id: "SA-04", action: "classify", tool: "gmail.thread.search", prompt_template: "Pull recent thread for {{lead.id}}, then re-classify.", leads: 2, retries: 2, timeout_s: 30, tone: "rose", expected_latency_s: 0.0, blocked_reason: "auth" },
      { id: "SA-05", action: "enrich",   tool: "close.lead.fetch",    prompt_template: "Enrich {{lead.id}} (batch 2).", leads: 2, retries: 2, timeout_s: 30, tone: "lavender", expected_latency_s: 5.1 },
      { id: "SA-06", action: "classify", tool: "wedding_wire.search", prompt_template: "Look up {{lead.id}} on Wedding Wire and classify.", leads: 2, retries: 2, timeout_s: 30, tone: "lemon", expected_latency_s: 0.0 },
    ],
    merge: { label: "merge → write to Tables", target: "tables/leads_pipeline.json" },
    metadata: { created_at: "2026-04-25T00:00:00Z", last_modified: "2026-04-25T00:00:00Z", version: 1 },
    seeded: true,
  },
  {
    schema: "comeketo.agent_plan.v1",
    slug: "lead_enrichment_fanout",
    name: "Lead enrichment fanout — daily sweep",
    description: "Four sub-agents split the open lead list and enrich each with last-touch + venue affinity.",
    trigger_label: "open leads · 16:48 daily",
    orchestrator: { label: "Rodbot", model: "claude-sonnet-4-6", register: "operational" },
    budgets: { max_sub_agents: 6, tokens_cap: 8000, wallclock_cap_s: 45, retry_policy: "linear_backoff" },
    sub_agents: [
      { id: "SA-01", action: "enrich", tool: "close.lead.fetch", prompt_template: "Enrich open lead {{lead.id}}.", leads: 4, retries: 1, timeout_s: 25, tone: "sage",     expected_latency_s: 3.5 },
      { id: "SA-02", action: "enrich", tool: "tables.read",      prompt_template: "Cross-reference with venue_partners.", leads: 4, retries: 1, timeout_s: 20, tone: "sage", expected_latency_s: 2.8 },
      { id: "SA-03", action: "score",  tool: "rodbot.affinity",  prompt_template: "Score affinity tier.", leads: 4, retries: 1, timeout_s: 20, tone: "lavender", expected_latency_s: 4.1 },
      { id: "SA-04", action: "write",  tool: "tables.append",    prompt_template: "Append enrichment to leads_pipeline.", leads: 4, retries: 1, timeout_s: 15, tone: "mint", expected_latency_s: 1.6 },
    ],
    merge: { label: "merge → write to Tables", target: "tables/leads_pipeline.json" },
    metadata: { created_at: "2026-04-25T00:00:00Z", last_modified: "2026-04-25T00:00:00Z", version: 1 },
    seeded: true,
  },
];

// Deep-clone helper for plan immutability.
function sapClone(plan) { return JSON.parse(JSON.stringify(plan)); }

// Generate a new SA id given existing ones (SA-NN, padded).
function sapNextSaId(existing) {
  const used = new Set((existing || []).map(s => s.id));
  for (let i = 1; i <= 99; i++) {
    const id = `SA-${String(i).padStart(2,"0")}`;
    if (!used.has(id)) return id;
  }
  return `SA-${Date.now().toString(36).slice(-3)}`;
}

// Slugify for new plans.
function sapSlugify(s) {
  return (s || "").toLowerCase().trim()
    .replace(/[^a-z0-9_\- ]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80) || `plan_${Date.now().toString(36)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// SapHeader — plan picker, name, save, run
// ═══════════════════════════════════════════════════════════════════════════
function SapHeader({ plan, plans, onLoad, onNew, onRename, onSave, onRun, onStop, saving, running, dirty }) {
  const [editing, setEditing] = ag_useState(false);
  const [draft, setDraft] = ag_useState(plan?.name || "");
  ag_useEffect(() => { setDraft(plan?.name || ""); }, [plan?.slug]);
  return (
    <div className="sap-header">
      <div className="sap-header-left">
        <div className="sap-eyebrow">14 · agents</div>
        {editing ? (
          <input
            className="sap-title-input"
            value={draft}
            autoFocus
            onChange={e => setDraft(e.target.value)}
            onBlur={() => { onRename(draft); setEditing(false); }}
            onKeyDown={e => { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") { setDraft(plan?.name || ""); setEditing(false); } }}
          />
        ) : (
          <h1 className="sap-title" onClick={() => setEditing(true)} title="Click to rename">{plan?.name || "Untitled plan"}</h1>
        )}
        <div className="sap-subline">
          <span className="sap-trigger">{plan?.trigger_label || "untriggered"}</span>
          <span className="sap-sep">·</span>
          <span>{(plan?.sub_agents || []).length} sub-agents</span>
          <span className="sap-sep">·</span>
          <span>v{plan?.metadata?.version || 1}</span>
          {dirty && <><span className="sap-sep">·</span><span className="sap-dirty">unsaved</span></>}
        </div>
      </div>
      <div className="sap-header-right">
        <select
          className="sap-plan-picker"
          value={plan?.slug || ""}
          onChange={e => onLoad(e.target.value)}
        >
          {plans.map(p => (
            <option key={p.slug} value={p.slug}>{p.name || p.slug}{p.seeded ? " · seed" : ""}</option>
          ))}
        </select>
        <button className="sap-btn sap-btn-ghost" onClick={onNew} title="New plan">+ new</button>
        <button className="sap-btn sap-btn-paper" onClick={onSave} disabled={saving || !dirty} title={dirty ? "Save plan" : "No changes"}>
          {saving ? "saving…" : "save"}
        </button>
        {running ? (
          <button className="sap-btn sap-btn-stop" onClick={onStop} title="Stop simulated run">■ stop</button>
        ) : (
          <button className="sap-btn sap-btn-ink" onClick={onRun} title="Simulate the dispatch">▶ run</button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SapFanoutCanvas — orchestrator → row of SAs → merge node
// ═══════════════════════════════════════════════════════════════════════════
function SapFanoutCanvas({ plan, runState, selectedId, onSelect }) {
  const sas = plan?.sub_agents || [];
  const N = sas.length;

  // Layout — auto-fit width based on SA count. Each SA is 130px wide with 16px gap.
  const SA_W = 132, SA_H = 92, SA_GAP = 16;
  const fanW = Math.max(560, N * (SA_W + SA_GAP) - SA_GAP);
  const padX = 32;
  const totalW = fanW + padX * 2;
  const totalH = 360;
  const orchY = 56, saY = 168, mergeY = 296;
  const orchX = totalW / 2;
  const mergeX = totalW / 2;
  const saStartX = (totalW - fanW) / 2 + SA_W / 2;

  return (
    <div className="sap-canvas">
      <svg
        viewBox={`0 0 ${totalW} ${totalH}`}
        preserveAspectRatio="xMidYMid meet"
        className="sap-svg"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* dotted background grid */}
        <defs>
          <pattern id="sap-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="var(--rule-2)" opacity="0.55"/>
          </pattern>
          <marker id="sap-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="var(--ink-3)"/>
          </marker>
        </defs>
        <rect x="0" y="0" width={totalW} height={totalH} fill="url(#sap-grid)"/>

        {/* Edges from orchestrator → each SA */}
        {sas.map((sa, i) => {
          const sx = orchX, sy = orchY + 22;
          const tx = saStartX + i * (SA_W + SA_GAP), ty = saY - SA_H/2;
          const cy = (sy + ty) / 2;
          const path = `M ${sx} ${sy} C ${sx} ${cy}, ${tx} ${cy}, ${tx} ${ty}`;
          const lit = runState?.firingEdges?.has(`fan-${sa.id}`);
          return <path key={`e-fan-${sa.id}`} d={path} fill="none"
            stroke={lit ? "var(--ink)" : "var(--ink-4)"}
            strokeWidth={lit ? 2 : 1.2}
            strokeDasharray={lit ? "none" : "4 4"}
            markerEnd="url(#sap-arrow)"/>;
        })}

        {/* Edges from each SA → merge */}
        {sas.map((sa, i) => {
          const sx = saStartX + i * (SA_W + SA_GAP), sy = saY + SA_H/2;
          const tx = mergeX, ty = mergeY - 22;
          const cy = (sy + ty) / 2;
          const path = `M ${sx} ${sy} C ${sx} ${cy}, ${tx} ${cy}, ${tx} ${ty}`;
          const lit = runState?.firingEdges?.has(`merge-${sa.id}`);
          return <path key={`e-mrg-${sa.id}`} d={path} fill="none"
            stroke={lit ? "var(--ink)" : "var(--ink-4)"}
            strokeWidth={lit ? 2 : 1}
            strokeDasharray={lit ? "none" : "3 5"}
            markerEnd="url(#sap-arrow)"/>;
        })}

        {/* Orchestrator capsule (Rodbot) */}
        <g transform={`translate(${orchX - 80}, ${orchY - 22})`}>
          <rect x="0" y="0" width="160" height="44" rx="22"
            fill="var(--pastel-mint)" stroke="var(--pastel-mint-ink)" strokeWidth="1"/>
          <circle cx="20" cy="22" r="5" fill="var(--pastel-mint-ink)"/>
          <text x="36" y="27" fontFamily="var(--font-body)" fontSize="13.5" fontWeight="500"
            fill="var(--pastel-mint-ink)">
            {agTruncate(`${plan?.orchestrator?.label || "Rodbot"} · orchestrator`, 18)}
            <title>{`${plan?.orchestrator?.label || "Rodbot"} · orchestrator`}</title>
          </text>
        </g>

        {/* Sub-agent cards */}
        {sas.map((sa, i) => {
          const x = saStartX + i * (SA_W + SA_GAP) - SA_W/2;
          const y = saY - SA_H/2;
          const status = runState?.saStatus?.[sa.id] || (sa.blocked_reason ? "blocked" : "queued");
          const isSelected = selectedId === sa.id;
          const tone = status === "queued" ? (sa.tone || "sage") : (SAP_STATUS_TONE[status] || sa.tone || "sage");
          const subtle = status === "queued" && !runState?.running;
          return (
            <g key={sa.id}
               transform={`translate(${x}, ${y})`}
               className={"sap-sa" + (isSelected ? " is-selected" : "") + (status === "blocked" ? " is-blocked" : "") + (status === "shipped" ? " is-shipped" : "")}
               onMouseDown={(e) => { e.stopPropagation(); onSelect(sa.id); }}
               style={{ cursor: "pointer" }}>
              <rect x="0" y="0" width={SA_W} height={SA_H} rx="14"
                fill={subtle ? "var(--paper-card)" : `var(--pastel-${tone})`}
                stroke={isSelected ? "var(--ink)" : `var(--pastel-${tone}-ink)`}
                strokeWidth={isSelected ? 2 : 1}/>
              <text x="14" y="22" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="0.1em"
                fill={`var(--pastel-${tone}-ink)`} opacity="0.85">{sa.id}</text>
              <text x="14" y="44" fontFamily="var(--font-serif, 'Newsreader', serif)" fontSize="18" fontWeight="500"
                fill="var(--ink)">
                {agTruncate(sa.action || "—", 12)}
                <title>{sa.action || "—"}</title>
              </text>
              <text x="14" y="64" fontFamily="var(--font-mono)" fontSize="10.5" letterSpacing="0.04em"
                fill="var(--ink-3)">
                {agTruncate(`${sa.leads || 0} leads · ${(sa.expected_latency_s || 0).toFixed(1)}s`, 16)}
              </text>
              <text x="14" y="80" fontFamily="var(--font-mono)" fontSize="10" letterSpacing="0.08em"
                fill={`var(--pastel-${tone}-ink)`} opacity="0.95">
                {agTruncate(
                  status === "blocked" ? `blocked · ${sa.blocked_reason || "unknown"}` :
                  status === "queued" ? "queued" :
                  status === "planning" ? "planning…" :
                  status === "tool_call" ? "calling…" :
                  status === "tool_await" ? "awaiting…" :
                  status === "reflect" ? "reflecting" :
                  status === "shipped" ? "shipped ✓" :
                  status === "working" ? "working…" : status,
                  18
                )}
              </text>
            </g>
          );
        })}

        {/* Merge node */}
        <g transform={`translate(${mergeX - 130}, ${mergeY - 22})`}>
          <rect x="0" y="0" width="260" height="44" rx="22"
            fill="var(--paper-card)" stroke="var(--ink)" strokeWidth="1.2"/>
          <text x="130" y="27" textAnchor="middle"
            fontFamily="var(--font-body)" fontSize="13" fontWeight="500"
            fill="var(--ink)">
            {agTruncate(plan?.merge?.label || "merge → write", 32)}
            <title>{plan?.merge?.label || "merge → write"}</title>
          </text>
        </g>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SapInspector — selected SA editor (action / tool / prompt / retries / timeout)
// ═══════════════════════════════════════════════════════════════════════════
function SapInspector({ sa, plan, onUpdate, onDelete }) {
  if (!sa) {
    return (
      <div className="sap-inspector sap-inspector-empty">
        <span className="sap-eyebrow">Inspector</span>
        <p className="sap-empty-hint">Click a sub-agent on the canvas to edit it. Or use <em>+ add sub-agent</em> in the budgets footer.</p>
      </div>
    );
  }
  const set = (patch) => onUpdate(sa.id, patch);
  return (
    <div className="sap-inspector">
      <div className="sap-inspector-head">
        <span className="sap-eyebrow">Inspector</span>
        <span className="sap-inspector-ident">{sa.id}</span>
        <button className="sap-inspector-del" onClick={() => onDelete(sa.id)} title="Delete this sub-agent">× delete</button>
      </div>
      <div className="sap-inspector-grid">
        <label className="sap-field">
          <span>action</span>
          <input list="sap-actions" value={sa.action || ""} onChange={e => set({ action: e.target.value })}/>
          <datalist id="sap-actions">
            {SAP_ACTION_OPTIONS.map(a => <option key={a} value={a}/>)}
          </datalist>
        </label>
        <label className="sap-field">
          <span>tool</span>
          <input list="sap-tools" value={sa.tool || ""} onChange={e => set({ tool: e.target.value })}/>
          <datalist id="sap-tools">
            {SAP_TOOL_OPTIONS.map(t => <option key={t} value={t}/>)}
          </datalist>
        </label>
        <label className="sap-field sap-field-num">
          <span>leads</span>
          <input type="number" min="0" value={sa.leads ?? 0} onChange={e => set({ leads: parseInt(e.target.value, 10) || 0 })}/>
        </label>
        <label className="sap-field sap-field-num">
          <span>retries</span>
          <input type="number" min="0" max="10" value={sa.retries ?? 1} onChange={e => set({ retries: parseInt(e.target.value, 10) || 0 })}/>
        </label>
        <label className="sap-field sap-field-num">
          <span>timeout</span>
          <input type="number" min="1" max="300" value={sa.timeout_s ?? 30} onChange={e => set({ timeout_s: parseInt(e.target.value, 10) || 30 })}/>
        </label>
        <label className="sap-field sap-field-num">
          <span>est latency (s)</span>
          <input type="number" step="0.1" min="0" value={sa.expected_latency_s ?? 0} onChange={e => set({ expected_latency_s: parseFloat(e.target.value) || 0 })}/>
        </label>
        <label className="sap-field sap-field-tone">
          <span>tone</span>
          <select value={sa.tone || "sage"} onChange={e => set({ tone: e.target.value })}>
            {SAP_TONES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="sap-field sap-field-prompt">
          <span>prompt template</span>
          <textarea
            rows="3"
            value={sa.prompt_template || ""}
            onChange={e => set({ prompt_template: e.target.value })}
            placeholder="Use {{lead.id}}, {{batch}}, etc. as substitution tokens."
          />
        </label>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SapBudgets — caps + add SA
// ═══════════════════════════════════════════════════════════════════════════
function SapBudgets({ plan, onChange, onAddSa }) {
  const b = plan?.budgets || {};
  const set = (patch) => onChange({ budgets: { ...b, ...patch } });
  return (
    <div className="sap-budgets">
      <span className="sap-eyebrow">Budgets</span>
      <label className="sap-field sap-field-inline">
        <span>max sub-agents</span>
        <input type="number" min="1" max="32" value={b.max_sub_agents ?? 8} onChange={e => set({ max_sub_agents: parseInt(e.target.value, 10) || 8 })}/>
      </label>
      <label className="sap-field sap-field-inline">
        <span>tokens cap</span>
        <input type="number" min="500" step="500" value={b.tokens_cap ?? 12000} onChange={e => set({ tokens_cap: parseInt(e.target.value, 10) || 12000 })}/>
      </label>
      <label className="sap-field sap-field-inline">
        <span>wallclock (s)</span>
        <input type="number" min="5" max="600" value={b.wallclock_cap_s ?? 60} onChange={e => set({ wallclock_cap_s: parseInt(e.target.value, 10) || 60 })}/>
      </label>
      <label className="sap-field sap-field-inline">
        <span>retry policy</span>
        <select value={b.retry_policy || "linear_backoff"} onChange={e => set({ retry_policy: e.target.value })}>
          <option value="none">none</option>
          <option value="linear_backoff">linear backoff</option>
          <option value="exponential_backoff">exponential backoff</option>
        </select>
      </label>
      <button className="sap-btn sap-btn-paper sap-add" onClick={onAddSa} title="Add a sub-agent">+ sub-agent</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SapConcurrency — Gantt rows per SA, fed by run state
// ═══════════════════════════════════════════════════════════════════════════
function SapConcurrency({ plan, runState }) {
  const sas = plan?.sub_agents || [];
  const total_s = Math.max(1, plan?.budgets?.wallclock_cap_s || 60);
  return (
    <div className="sap-card sap-concurrency">
      <div className="sap-card-head">
        <span className="sap-eyebrow">Concurrency</span>
        <span className="sap-card-meta">{sas.length} SAs · {(runState?.running ? "running" : "idle")}</span>
      </div>
      <div className="sap-gantt">
        {sas.map((sa) => {
          const seg = runState?.gantt?.[sa.id]; // { startPct, widthPct, status, latency }
          const status = runState?.saStatus?.[sa.id] || (sa.blocked_reason ? "blocked" : "queued");
          const tone = SAP_STATUS_TONE[status] || sa.tone || "sage";
          const expectedPct = Math.min(100, ((sa.expected_latency_s || 0) / total_s) * 100);
          return (
            <div key={sa.id} className="sap-gantt-row">
              <span className="sap-gantt-label">{sa.id}</span>
              <div className="sap-gantt-track">
                {/* Expected baseline (hairline) — always shown */}
                <span className="sap-gantt-expected" style={{ width: `${expectedPct}%` }}/>
                {/* Live segment — shown during run */}
                {seg && (
                  <span
                    className={`sap-gantt-bar tg-tone-${tone}`}
                    style={{ left: `${seg.startPct}%`, width: `${seg.widthPct}%`, background: `var(--pastel-${tone})` }}
                  />
                )}
              </div>
              <span className="sap-gantt-latency">
                {seg?.latency != null ? `${seg.latency.toFixed(1)}s` : status === "blocked" ? "—" : `~${(sa.expected_latency_s || 0).toFixed(1)}s`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SapSpend — token spend / wall clock / parallelism
// ═══════════════════════════════════════════════════════════════════════════
function SapSpend({ plan, runState }) {
  const sas = plan?.sub_agents || [];
  const total_expected_s = sas.reduce((a, s) => a + (s.expected_latency_s || 0), 0);
  const wallclock = runState?.elapsed_s ?? (runState?.running ? 0 : total_expected_s);
  const parallelism = wallclock > 0 ? total_expected_s / wallclock : (sas.length || 1);
  const tokens = runState?.tokens_used ?? Math.round((plan?.budgets?.tokens_cap || 12000) * 0.007 * sas.length);
  const dollars = (tokens / 1000) * 0.012; // rough mid-tier estimate; for display only
  return (
    <div className="sap-card sap-spend">
      <div className="sap-card-head">
        <span className="sap-eyebrow">Spend</span>
        <span className="sap-card-meta">{runState?.running ? "live" : "estimate"}</span>
      </div>
      <div className="sap-spend-grid">
        <div className="sap-spend-cell">
          <div className="sap-spend-num">${dollars.toFixed(3)}</div>
          <div className="sap-spend-label">tokens · {tokens.toLocaleString()}</div>
        </div>
        <div className="sap-spend-cell">
          <div className="sap-spend-num">{wallclock.toFixed(1)}s</div>
          <div className="sap-spend-label">wall clock</div>
        </div>
        <div className="sap-spend-cell">
          <div className="sap-spend-num">{parallelism.toFixed(1)}×</div>
          <div className="sap-spend-label">parallelism</div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SapLiveStream — tailed event log
// ═══════════════════════════════════════════════════════════════════════════
function SapLiveStream({ events }) {
  const tailRef = ag_useRef(null);
  ag_useEffect(() => {
    if (tailRef.current) tailRef.current.scrollTop = tailRef.current.scrollHeight;
  }, [events?.length]);
  return (
    <div className="sap-card sap-stream">
      <div className="sap-card-head">
        <span className="sap-eyebrow">Live stream</span>
        <span className="sap-card-meta">{events?.length || 0} events</span>
      </div>
      <div className="sap-stream-tail" ref={tailRef}>
        {(!events || events.length === 0) && (
          <div className="sap-empty-hint">Press ▶ run to simulate the dispatch.</div>
        )}
        {(events || []).map((ev, i) => (
          <div key={i} className="sap-stream-row">
            <span className="sap-stream-ts">{ev.ts}</span>
            <span className={`sap-dot tg-tone-${ev.tone || "sage"}`}/>
            <span className="sap-stream-sa">{ev.sa}</span>
            <span className="sap-stream-text">{ev.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SubAgentPlannerScreen — page-level component
// ═══════════════════════════════════════════════════════════════════════════
function SubAgentPlannerScreen({ go }) {
  const [plansList, setPlansList] = ag_useState([]);
  const [plan, setPlan] = ag_useState(() => sapClone(SAP_SEED_PLANS[0]));
  const [savedSlug, setSavedSlug] = ag_useState(null); // tracks the slug currently on disk for dirty detection
  const [savedSnapshot, setSavedSnapshot] = ag_useState(() => JSON.stringify(SAP_SEED_PLANS[0]));
  const [selectedId, setSelectedId] = ag_useState(null);
  const [saving, setSaving] = ag_useState(false);
  const [toast, setToast] = ag_useState(null);

  // Run simulation state
  const [running, setRunning] = ag_useState(false);
  const [saStatus, setSaStatus] = ag_useState({}); // saId -> "queued"|"planning"|"tool_call"|"tool_await"|"reflect"|"shipped"|"blocked"
  const [firingEdges, setFiringEdges] = ag_useState(() => new Set());
  const [gantt, setGantt] = ag_useState({}); // saId -> { startPct, widthPct, status, latency }
  const [events, setEvents] = ag_useState([]);
  const [elapsed, setElapsed] = ag_useState(0);
  const runCancelRef = ag_useRef(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  // ── List + load from bedrock; merge with seeds ────────────────────────
  const refreshList = ag_useCallback(async () => {
    try {
      const r = await fetch("/api/agent_plans/list");
      const j = await r.json();
      const fromDisk = (j?.items || []).map(it => ({ slug: it.slug, name: it.name || it.slug, seeded: false }));
      const seenSlugs = new Set(fromDisk.map(it => it.slug));
      const seeds = SAP_SEED_PLANS.filter(s => !seenSlugs.has(s.slug)).map(s => ({ slug: s.slug, name: s.name, seeded: true }));
      const merged = [...fromDisk, ...seeds];
      setPlansList(merged);
      return merged;
    } catch {
      const seeds = SAP_SEED_PLANS.map(s => ({ slug: s.slug, name: s.name, seeded: true }));
      setPlansList(seeds);
      return seeds;
    }
  }, []);

  ag_useEffect(() => { refreshList(); }, [refreshList]);

  const dirty = JSON.stringify(plan) !== savedSnapshot;

  const onLoad = ag_useCallback(async (slug) => {
    if (!slug) return;
    // Try bedrock first.
    try {
      const r = await fetch(`/api/agent_plans/get?slug=${encodeURIComponent(slug)}`);
      const j = await r.json();
      if (j?.ok && j.plan) {
        setPlan(j.plan);
        setSavedSlug(slug);
        setSavedSnapshot(JSON.stringify(j.plan));
        setSelectedId(null);
        stopRun();
        return;
      }
    } catch {}
    // Fall back to seed.
    const seed = SAP_SEED_PLANS.find(s => s.slug === slug);
    if (seed) {
      const cloned = sapClone(seed);
      setPlan(cloned);
      setSavedSlug(null);  // seeds aren't on disk
      setSavedSnapshot(JSON.stringify(cloned));
      setSelectedId(null);
      stopRun();
    }
  }, []);

  const onNew = ag_useCallback(() => {
    const fresh = {
      schema: "comeketo.agent_plan.v1",
      slug: `plan_${Date.now().toString(36)}`,
      name: "New plan",
      description: "",
      trigger_label: "",
      orchestrator: { label: "Rodbot", model: "claude-sonnet-4-6", register: "operational" },
      budgets: { max_sub_agents: 8, tokens_cap: 12000, wallclock_cap_s: 60, retry_policy: "linear_backoff" },
      sub_agents: [
        { id: "SA-01", action: "enrich", tool: "close.lead.fetch", prompt_template: "", leads: 1, retries: 1, timeout_s: 30, tone: "sage", expected_latency_s: 3.0 },
      ],
      merge: { label: "merge → write", target: "" },
      metadata: { created_at: new Date().toISOString(), last_modified: new Date().toISOString(), version: 1 },
    };
    setPlan(fresh);
    setSavedSlug(null);
    setSavedSnapshot(JSON.stringify(fresh));
    setSelectedId(null);
    stopRun();
  }, []);

  const onRename = ag_useCallback((newName) => {
    setPlan(p => {
      const next = { ...p, name: newName || "Untitled plan" };
      // If this plan was a seed (savedSlug=null) AND name changed, regenerate slug.
      if (!savedSlug || p.slug?.startsWith("plan_")) {
        next.slug = sapSlugify(newName);
      }
      return next;
    });
  }, [savedSlug]);

  const onUpdatePlan = ag_useCallback((patch) => {
    setPlan(p => ({ ...p, ...patch }));
  }, []);

  const onUpdateSa = ag_useCallback((id, patch) => {
    setPlan(p => ({
      ...p,
      sub_agents: (p.sub_agents || []).map(s => s.id === id ? { ...s, ...patch } : s),
    }));
  }, []);

  const onAddSa = ag_useCallback(() => {
    setPlan(p => {
      const newId = sapNextSaId(p.sub_agents);
      const newSa = {
        id: newId, action: "enrich", tool: "close.lead.fetch",
        prompt_template: "Describe what {{lead.id}} should do.",
        leads: 1, retries: 1, timeout_s: 30, tone: "sage", expected_latency_s: 3.0,
      };
      return { ...p, sub_agents: [...(p.sub_agents || []), newSa] };
    });
  }, []);

  const onDeleteSa = ag_useCallback((id) => {
    setPlan(p => ({ ...p, sub_agents: (p.sub_agents || []).filter(s => s.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const onSave = ag_useCallback(async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/agent_plans/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: plan.slug, plan }),
      });
      const j = await r.json();
      if (j?.ok) {
        const savedPlan = j.plan || plan;
        setPlan(savedPlan);
        setSavedSlug(plan.slug);
        setSavedSnapshot(JSON.stringify(savedPlan));
        showToast(`saved · ${plan.slug}`);
        await refreshList();
      } else {
        showToast(`save failed · ${j?.error || "unknown"}`);
      }
    } catch (e) {
      showToast(`save failed · ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  }, [plan, refreshList]);

  // ── Simulated dispatch ────────────────────────────────────────────────
  const stopRun = ag_useCallback(() => {
    if (runCancelRef.current) {
      runCancelRef.current.cancelled = true;
    }
    setRunning(false);
  }, []);

  const onRun = ag_useCallback(async () => {
    if (running) return;
    setRunning(true);
    setEvents([]);
    setSaStatus({});
    setGantt({});
    setFiringEdges(new Set());
    setElapsed(0);

    const cancelToken = { cancelled: false };
    runCancelRef.current = cancelToken;
    const sas = plan.sub_agents || [];
    const sleep = (ms) => new Promise(res => setTimeout(res, ms));
    const ts = (s) => {
      const m = Math.floor(s / 60); const sec = (s % 60).toFixed(2);
      return `04:09:${String(s % 60).padStart(2,"0")}.${String(Math.round((s % 1) * 100)).padStart(2,"0")}`.slice(0,12);
    };
    const total_s = Math.max(...sas.map(s => s.expected_latency_s || 0), 1);
    const SCALE = 800; // 1 simulated second = 800ms wallclock (slow enough to watch)

    // Time progression — fire events on edges first, then per-SA progress.
    const startReal = performance.now();
    const tick = () => {
      if (cancelToken.cancelled) return;
      const ms = performance.now() - startReal;
      setElapsed(ms / SCALE);
      if (ms / SCALE < total_s + 0.6) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const pushEvent = (ev) => setEvents(es => [...es, ev]);

    // Fan-out: orchestrator dispatches to all SAs (edge animations)
    pushEvent({ ts: ts(0), tone: "mint", sa: "Rodbot", text: `dispatching ${sas.length} sub-agents — goal: ${plan.name}` });
    setFiringEdges(new Set(sas.map(s => `fan-${s.id}`)));
    await sleep(600);
    if (cancelToken.cancelled) return;

    // Mark all as planning
    setSaStatus(prev => {
      const next = { ...prev };
      for (const s of sas) next[s.id] = s.blocked_reason ? "blocked" : "planning";
      return next;
    });
    for (const s of sas) {
      if (s.blocked_reason) {
        pushEvent({ ts: ts(0.1), tone: "rose", sa: s.id, text: `blocked · ${s.blocked_reason}` });
        setGantt(g => ({ ...g, [s.id]: { startPct: 0, widthPct: 2, status: "blocked", latency: 0 } }));
      } else {
        pushEvent({ ts: ts(0.2), tone: "lemon", sa: s.id, text: `planning · ${s.action}(${s.leads || 0})` });
      }
    }
    await sleep(400);
    if (cancelToken.cancelled) return;

    // Per-SA staged playback — each transitions through statuses on its own clock.
    const promises = sas.map(async (s, i) => {
      if (s.blocked_reason) return;
      const lat = Math.max(0.4, s.expected_latency_s || 2.0);
      const startT = 0.4 + i * 0.05; // tiny stagger
      const t1 = startT + lat * 0.2;  // tool_call
      const t2 = startT + lat * 0.6;  // tool_await
      const t3 = startT + lat * 0.85; // reflect
      const t4 = startT + lat;        // shipped

      // tool_call
      await sleep((t1 - 0) * SCALE);
      if (cancelToken.cancelled) return;
      setSaStatus(prev => ({ ...prev, [s.id]: "tool_call" }));
      setGantt(g => ({ ...g, [s.id]: { startPct: (startT / total_s) * 100, widthPct: ((t1 - startT) / total_s) * 100, status: "tool_call", latency: t1 - startT } }));
      pushEvent({ ts: ts(t1), tone: "lavender", sa: s.id, text: `${s.tool} ← ${s.action}` });

      // tool_await
      await sleep((t2 - t1) * SCALE);
      if (cancelToken.cancelled) return;
      setSaStatus(prev => ({ ...prev, [s.id]: "tool_await" }));
      setGantt(g => ({ ...g, [s.id]: { startPct: (startT / total_s) * 100, widthPct: ((t2 - startT) / total_s) * 100, status: "tool_await", latency: t2 - startT } }));

      // reflect
      await sleep((t3 - t2) * SCALE);
      if (cancelToken.cancelled) return;
      setSaStatus(prev => ({ ...prev, [s.id]: "reflect" }));
      setGantt(g => ({ ...g, [s.id]: { startPct: (startT / total_s) * 100, widthPct: ((t3 - startT) / total_s) * 100, status: "reflect", latency: t3 - startT } }));
      pushEvent({ ts: ts(t3), tone: "mint", sa: s.id, text: `result OK · ${(s.leads || 0)} item(s)` });

      // shipped
      await sleep((t4 - t3) * SCALE);
      if (cancelToken.cancelled) return;
      setSaStatus(prev => ({ ...prev, [s.id]: "shipped" }));
      setGantt(g => ({ ...g, [s.id]: { startPct: (startT / total_s) * 100, widthPct: ((t4 - startT) / total_s) * 100, status: "shipped", latency: lat } }));
      setFiringEdges(prev => { const n = new Set(prev); n.add(`merge-${s.id}`); return n; });
      pushEvent({ ts: ts(t4), tone: "mint", sa: s.id, text: `→ merge` });
    });

    await Promise.all(promises);
    if (cancelToken.cancelled) return;
    pushEvent({ ts: ts(total_s + 0.3), tone: "mint", sa: "merge", text: `→ ${plan.merge?.target || "destination"} · shipped` });
    await sleep(400);
    setRunning(false);
  }, [plan, running]);

  // Approximate token usage for the spend card during run
  const tokens_used = ag_useMemo(() => {
    if (!running && elapsed === 0) return null;
    const sas = plan.sub_agents || [];
    const totalExpected = sas.reduce((a, s) => a + (s.expected_latency_s || 0), 0) || 1;
    const ratio = Math.min(1, elapsed / Math.max(1, totalExpected));
    return Math.round((plan.budgets?.tokens_cap || 12000) * 0.007 * sas.length * ratio);
  }, [running, elapsed, plan]);

  const selectedSa = (plan.sub_agents || []).find(s => s.id === selectedId) || null;

  return (
    <div className="auto-page sap-page">
      <SapHeader
        plan={plan}
        plans={plansList}
        onLoad={onLoad}
        onNew={onNew}
        onRename={onRename}
        onSave={onSave}
        onRun={onRun}
        onStop={stopRun}
        saving={saving}
        running={running}
        dirty={dirty}
      />

      <div className="sap-stage">
        <div className="sap-canvas-col">
          <SapFanoutCanvas
            plan={plan}
            runState={{ saStatus, firingEdges, running }}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
        <div className="sap-sidecar">
          <SapConcurrency plan={plan} runState={{ gantt, saStatus, running }}/>
          <SapSpend plan={plan} runState={{ tokens_used, elapsed_s: elapsed, running }}/>
          <SapLiveStream events={events}/>
        </div>
      </div>

      <SapInspector
        sa={selectedSa}
        plan={plan}
        onUpdate={onUpdateSa}
        onDelete={onDeleteSa}
      />

      <SapBudgets plan={plan} onChange={onUpdatePlan} onAddSa={onAddSa}/>

      {toast && <div className="tg-toast">{toast}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// StateMachineScreen — observation-only readout of Rodbot's state (deck p.15)
// ───────────────────────────────────────────────────────────────────────────
// Zero forms. Everything is derived from CCAgentindex/_ledger/activity.jsonl
// via /api/state/snapshot, classified server-side into 7 states. The page
// polls every 5s; pause/resume via the obvious chip; window picker switches
// 15m / 1h / 6h / 24h / 7d.
//
// Layout:
//   [Header — title · current-state pill · window picker · pause/refresh]
//   [State diagram (SVG) | stacked bar + active-context card]
//   [Stack trace — last N events as a vertical timeline]
// ═══════════════════════════════════════════════════════════════════════════

const SM_STATES = [
  { id: "idle",       label: "idle",       tone: "sage",    x: 100, y: 60 },
  { id: "planning",   label: "planning",   tone: "lemon",   x: 320, y: 60 },
  { id: "tool_call",  label: "tool · call", tone: "lavender", x: 540, y: 60 },
  { id: "tool_await", label: "tool · await", tone: "sky",   x: 540, y: 180 },
  { id: "reflect",    label: "reflect",    tone: "mint",    x: 320, y: 180 },
  { id: "blocked",    label: "blocked",    tone: "rose",    x: 100, y: 180 },
  { id: "shipped",    label: "return · shipped", tone: "ink", x: 320, y: 300 },
];
const SM_EDGES = [
  { from: "idle",       to: "planning",   label: "trigger" },
  { from: "planning",   to: "tool_call",  label: "need-tool" },
  { from: "planning",   to: "planning",   label: "think",    selfLoop: true },
  { from: "tool_call",  to: "tool_await", label: "dispatch" },
  { from: "tool_await", to: "reflect",    label: "result" },
  { from: "reflect",    to: "planning",   label: "re-plan",  dashed: true },
  { from: "reflect",    to: "shipped",    label: "satisfied" },
  { from: "planning",   to: "blocked",    label: "err / auth" },
];

const SM_WINDOW_OPTIONS = ["15m", "1h", "6h", "24h", "7d"];

function smRelativeTime(iso) {
  if (!iso) return "—";
  try {
    const t = new Date(iso).getTime();
    const diff = Date.now() - t;
    if (diff < 0) return "just now";
    const s = Math.floor(diff / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
  } catch { return "—"; }
}

function smHHMMSS(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", { hour12: false });
  } catch { return "—"; }
}

// ── State diagram (SVG) ────────────────────────────────────────────────────
function SmStateDiagram({ currentState, timeInState }) {
  const stateById = ag_useMemo(() => {
    const m = {};
    for (const s of SM_STATES) m[s.id] = s;
    return m;
  }, []);

  // Compute simple straight-line path between two state pills with edge offset.
  const edgePath = (e) => {
    if (e.selfLoop) {
      const s = stateById[e.from];
      // small loop above the node
      const cx = s.x, cy = s.y - 28;
      return `M ${s.x - 18} ${s.y - 18} C ${cx - 30} ${cy - 24}, ${cx + 30} ${cy - 24}, ${s.x + 18} ${s.y - 18}`;
    }
    const a = stateById[e.from], b = stateById[e.to];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    // Pull endpoints inward by ~38px so the arrow doesn't enter the pill.
    const nx = dx / len, ny = dy / len;
    const sx = a.x + nx * 56, sy = a.y + ny * 22;
    const tx = b.x - nx * 56, ty = b.y - ny * 22;
    return `M ${sx} ${sy} L ${tx} ${ty}`;
  };

  // Midpoint of an edge for label placement.
  const edgeMid = (e) => {
    if (e.selfLoop) {
      const s = stateById[e.from];
      return { x: s.x, y: s.y - 56 };
    }
    const a = stateById[e.from], b = stateById[e.to];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - 8 };
  };

  return (
    <div className="sm-card sm-diagram">
      <div className="sm-card-head">
        <span className="sm-eyebrow">State machine</span>
        <span className="sm-card-meta">live</span>
      </div>
      <svg viewBox="0 0 640 360" className="sm-svg" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="sm-grid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.7" fill="var(--rule-2)" opacity="0.45"/>
          </pattern>
          <marker id="sm-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="var(--ink-3)"/>
          </marker>
          <marker id="sm-arrow-active" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto">
            <path d="M0,0 L8,4 L0,8 z" fill="var(--ink)"/>
          </marker>
        </defs>
        <rect x="0" y="0" width="640" height="360" fill="url(#sm-grid)"/>

        {/* Edges */}
        {SM_EDGES.map((e, i) => {
          const isActiveEdge = (e.from === currentState);
          const mid = edgeMid(e);
          return (
            <g key={i} className="sm-edge">
              <path
                d={edgePath(e)}
                fill="none"
                stroke={isActiveEdge ? "var(--ink)" : "var(--ink-4)"}
                strokeWidth={isActiveEdge ? 1.6 : 1}
                strokeDasharray={e.dashed ? "5 4" : "none"}
                markerEnd={isActiveEdge ? "url(#sm-arrow-active)" : "url(#sm-arrow)"}
              />
              <text
                x={mid.x} y={mid.y}
                textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize="10" letterSpacing="0.06em"
                fill="var(--ink-4)"
              >{agTruncate(e.label, 14)}</text>
            </g>
          );
        })}

        {/* State pills */}
        {SM_STATES.map((s) => {
          const isCurrent = s.id === currentState;
          const pct = timeInState?.[s.id] ?? 0;
          const w = 110, h = 38;
          const isShipped = s.id === "shipped";
          const fill = isShipped ? "var(--ink)" : `var(--pastel-${s.tone})`;
          const ink = isShipped ? "var(--paper)" : `var(--pastel-${s.tone}-ink)`;
          return (
            <g key={s.id} transform={`translate(${s.x - w/2}, ${s.y - h/2})`}
               className={"sm-state-pill" + (isCurrent ? " is-current" : "")}>
              {isCurrent && (
                <rect x={-6} y={-6} width={w + 12} height={h + 12} rx={22}
                  fill="none" stroke="var(--ink)" strokeWidth="1.5"
                  strokeDasharray="3 3" className="sm-current-ring"/>
              )}
              <rect x="0" y="0" width={w} height={h} rx={19}
                fill={fill}
                stroke={isShipped ? "var(--ink)" : ink}
                strokeWidth="1"
              />
              <text x={w/2} y={h/2 + 1}
                textAnchor="middle" dominantBaseline="middle"
                fontFamily="var(--font-body)" fontSize="13" fontWeight="500"
                fill={ink}>
                {agTruncate(s.label, 14)}
              </text>
              {pct > 0 && (
                <text x={w/2} y={h + 14}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)" fontSize="10.5" letterSpacing="0.04em"
                  fill="var(--ink-3)">{pct.toFixed(1)}%</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Time-in-state stacked bar ───────────────────────────────────────────────
function SmTimeInState({ timeInState, eventCount, window }) {
  const order = ["idle", "planning", "tool_call", "tool_await", "reflect", "blocked", "shipped"];
  const segs = order.map(id => {
    const s = SM_STATES.find(x => x.id === id);
    return { id, tone: s?.tone || "sage", label: s?.label || id, pct: timeInState?.[id] || 0 };
  }).filter(s => s.pct > 0);
  return (
    <div className="sm-card sm-tis">
      <div className="sm-card-head">
        <span className="sm-eyebrow">Time-in-state · {window}</span>
        <span className="sm-card-meta">{eventCount} events</span>
      </div>
      <div className="sm-tis-bar">
        {segs.map(s => (
          <span key={s.id}
            className={`sm-tis-seg sm-tone-${s.tone === "ink" ? "sage" : s.tone}`}
            style={{ width: `${s.pct}%` }}
            title={`${s.label} — ${s.pct.toFixed(1)}%`}/>
        ))}
        {segs.length === 0 && <span className="sm-tis-empty">no events in window</span>}
      </div>
      <div className="sm-tis-legend">
        {segs.map(s => (
          <div key={s.id} className="sm-tis-row">
            <span className={`sm-dot sm-tone-${s.tone === "ink" ? "sage" : s.tone}`}/>
            <span className="sm-tis-label">{s.label}</span>
            <span className="sm-tis-pct">{s.pct.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Active context card ────────────────────────────────────────────────────
function SmActiveContext({ context, currentState }) {
  const stateInfo = SM_STATES.find(s => s.id === currentState) || SM_STATES[0];
  return (
    <div className="sm-card sm-context">
      <div className="sm-card-head">
        <span className="sm-eyebrow">Active context</span>
        <span className={`sm-pill sm-tone-${stateInfo.tone === "ink" ? "sage" : stateInfo.tone}`}>
          {agTruncate(stateInfo.label, 18)}
        </span>
      </div>
      {context ? (
        <div className="sm-context-body">
          <div className="sm-context-row">
            <span className="sm-context-key">last work</span>
            <span className="sm-context-val">{agTruncate(context.kind === "agent_plan" ? "agent plan" : context.kind, 24)}</span>
          </div>
          <div className="sm-context-row">
            <span className="sm-context-key">name</span>
            <span className="sm-context-val">{agTruncate(context.name || context.slug || "—", 36)}</span>
          </div>
          {context.kind === "agent_plan" && (
            <div className="sm-context-row">
              <span className="sm-context-key">sub-agents</span>
              <span className="sm-context-val">{context.sub_agents ?? "—"} · v{context.version ?? 1}</span>
            </div>
          )}
          {context.kind === "workflow" && (
            <div className="sm-context-row">
              <span className="sm-context-key">graph</span>
              <span className="sm-context-val">{context.nodes ?? 0} nodes · {context.connections ?? 0} edges</span>
            </div>
          )}
          <div className="sm-context-row">
            <span className="sm-context-key">touched</span>
            <span className="sm-context-val">{smRelativeTime(context.ts)}</span>
          </div>
        </div>
      ) : (
        <div className="sm-context-empty">No recent plan or workflow activity in this window.</div>
      )}
    </div>
  );
}

// ── Stack trace (recent events timeline) ───────────────────────────────────
function SmStackTrace({ events }) {
  const tail = (events || []).slice(-12).reverse(); // newest first
  return (
    <div className="sm-card sm-trace">
      <div className="sm-card-head">
        <span className="sm-eyebrow">Stack trace</span>
        <span className="sm-card-meta">last {tail.length}</span>
      </div>
      <div className="sm-trace-list">
        {tail.length === 0 && (
          <div className="sm-context-empty">No events yet — Rodbot is quiet.</div>
        )}
        {tail.map((ev, i) => {
          const stateInfo = SM_STATES.find(s => s.id === ev.state) || SM_STATES[0];
          const tone = stateInfo.tone === "ink" ? "sage" : stateInfo.tone;
          return (
            <div key={i} className="sm-trace-row">
              <span className="sm-trace-ts">{smHHMMSS(ev.ts)}</span>
              <span className={`sm-dot sm-tone-${tone}`}/>
              <span className="sm-trace-state">{ev.state}</span>
              <span className="sm-trace-kind">{agTruncate(ev.kind || "—", 28)}</span>
              <span className="sm-trace-slug">{agTruncate(ev.slug || "", 30)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Page component ─────────────────────────────────────────────────────────
function StateMachineScreen({ go }) {
  const [windowKey, setWindowKey] = ag_useState("24h");
  const [snapshot, setSnapshot] = ag_useState(null);
  const [paused, setPaused] = ag_useState(false);
  const [loading, setLoading] = ag_useState(false);
  const [lastFetched, setLastFetched] = ag_useState(null);

  const refresh = ag_useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/state/snapshot?window=${encodeURIComponent(windowKey)}`);
      const j = await r.json();
      if (j?.ok) {
        setSnapshot(j);
        setLastFetched(new Date().toISOString());
      }
    } catch {} finally { setLoading(false); }
  }, [windowKey]);

  // Initial fetch + window change.
  ag_useEffect(() => { refresh(); }, [refresh]);

  // Polling — every 5s when not paused.
  ag_useEffect(() => {
    if (paused) return;
    const id = setInterval(refresh, 5000);
    return () => clearInterval(id);
  }, [refresh, paused]);

  const currentState = snapshot?.current_state || "idle";

  return (
    <div className="auto-page sm-page">
      <div className="sm-header">
        <div className="sm-header-left">
          <div className="sm-eyebrow">15 · agents</div>
          <h1 className="sm-title">Agent state machine. <em>Idle → planning → tool → return.</em></h1>
          <p className="sm-sub">A live readout of where Rodbot is right now, derived from the activity ledger. Nothing to fill in — the system tells you what it's doing.</p>
        </div>
        <div className="sm-header-right">
          <div className="sm-window-picker">
            {SM_WINDOW_OPTIONS.map(w => (
              <button key={w}
                className={"sm-window-chip" + (w === windowKey ? " is-active" : "")}
                onClick={() => setWindowKey(w)}>{w}</button>
            ))}
          </div>
          <button
            className={"sm-pause-btn" + (paused ? " is-paused" : "")}
            onClick={() => setPaused(p => !p)}
            title={paused ? "Resume polling" : "Pause polling"}>
            {paused ? "▶ resume" : "‖ pause"}
          </button>
          <button
            className="sm-refresh-btn"
            onClick={refresh}
            disabled={loading}
            title="Refresh now">
            {loading ? "…" : "↻"}
          </button>
        </div>
      </div>

      <div className="sm-stage">
        <div className="sm-stage-left">
          <SmStateDiagram
            currentState={currentState}
            timeInState={snapshot?.time_in_state}
          />
        </div>
        <div className="sm-stage-right">
          <SmTimeInState
            timeInState={snapshot?.time_in_state}
            eventCount={snapshot?.event_count || 0}
            window={windowKey}
          />
          <SmActiveContext
            context={snapshot?.active_context}
            currentState={currentState}
          />
        </div>
      </div>

      <SmStackTrace events={snapshot?.recent_events}/>

      <div className="sm-footnote">
        {lastFetched ? (
          <>last sync · {smRelativeTime(lastFetched)} · /api/state/snapshot?window={windowKey}</>
        ) : (
          <>polling…</>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// HooksScreen — Pre · post · on · cron timeline (deck p.16)
// ───────────────────────────────────────────────────────────────────────────
// Three regions: a request timeline (latest matching event, hook flow as
// horizontal SVG checkpoints), a configured hooks list (code-defined, with
// on/pause toggles persisted to CCAgentindex/hooks/state.json), and a
// performance table (declared p50/p95 + real error counts from the ledger).
// Polls /api/hooks/snapshot every 6s. Zero forms — toggles only.
// ═══════════════════════════════════════════════════════════════════════════

const HK_STAGE_TONES = {
  "pre":        "mint",
  "run":        "ink",
  "post":       "sky",
  "on-blocked": "rose",
  "on-draft":   "lavender",
  "cron":       "lemon",
};
const HK_WINDOW_OPTIONS = ["1h", "6h", "24h", "7d"];

// ── Header ────────────────────────────────────────────────────────────────
function HkHeader({ window, onWindow, onRefresh, onPause, paused, loading, requestPreview }) {
  return (
    <div className="hk-header">
      <div className="hk-header-left">
        <div className="hk-eyebrow">16 · agents</div>
        <h1 className="hk-title">Hook timeline. <em>Pre · post · on · cron.</em></h1>
        <p className="hk-sub">A request flows through hooks like rooms in a house — each can read, decorate, or stop it. Toggle any hook off; the system keeps a clean trace either way.</p>
      </div>
      <div className="hk-header-right">
        {requestPreview && (
          <div className="hk-latest">
            <span className="hk-latest-eyebrow">latest request</span>
            <span className="hk-latest-kind">{agTruncate(requestPreview.kind || "—", 22)}</span>
            <span className="hk-latest-clock">{requestPreview.clock || ""}</span>
          </div>
        )}
        <div className="hk-window-picker">
          {HK_WINDOW_OPTIONS.map(w => (
            <button key={w}
              className={"hk-window-chip" + (w === window ? " is-active" : "")}
              onClick={() => onWindow(w)}>{w}</button>
          ))}
        </div>
        <button
          className={"hk-pause-btn" + (paused ? " is-paused" : "")}
          onClick={onPause}
          title={paused ? "Resume polling" : "Pause polling"}>
          {paused ? "▶ resume" : "‖ pause"}
        </button>
        <button className="hk-refresh-btn" onClick={onRefresh} disabled={loading} title="Refresh now">
          {loading ? "…" : "↻"}
        </button>
      </div>
    </div>
  );
}

// ── Request timeline (SVG, faithful to deck p.16) ────────────────────────
function HkRequestTimeline({ preview }) {
  if (!preview || !preview.steps || preview.steps.length === 0) {
    return (
      <div className="hk-card hk-tl">
        <div className="hk-card-head">
          <span className="hk-eyebrow">Request · timeline</span>
        </div>
        <div className="hk-empty">No recent request in the window. Pick a longer window or wait for activity.</div>
      </div>
    );
  }
  const steps = preview.steps;
  const total = Math.max(preview.total_ms || 1, 1);
  const VW = 940, VH = 200, padX = 36, lineY = 86;
  // Map each step's offset → x (linear). Pad ends.
  const x = (ms) => padX + ((VW - padX * 2) * (ms / total));

  return (
    <div className="hk-card hk-tl">
      <div className="hk-card-head">
        <span className="hk-eyebrow">Request · {agTruncate(preview.kind || "—", 24)} · {preview.clock || ""}</span>
        <span className="hk-card-meta">{preview.total_ms}ms total · {steps.length} hooks</span>
      </div>
      <svg viewBox={`0 0 ${VW} ${VH}`} className="hk-tl-svg" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
        {/* Horizontal main line */}
        <line x1={padX} y1={lineY} x2={VW - padX} y2={lineY} stroke="var(--ink-3)" strokeWidth="1"/>
        {/* Tick marks at 0 and total */}
        <text x={padX} y={lineY + 38} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-4)" letterSpacing="0.06em">+0ms</text>
        <text x={VW - padX} y={lineY + 38} textAnchor="end" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-4)" letterSpacing="0.06em">+{preview.total_ms}ms</text>

        {/* Checkpoints */}
        {steps.map((s, i) => {
          const cx = x(s.offset_ms);
          const tone = HK_STAGE_TONES[s.stage] || "sage";
          const isRun = s.stage === "run";
          const isBlocked = s.blocked;
          const fill = isRun ? "var(--ink)"
            : isBlocked ? "var(--pastel-rose)"
            : "var(--paper-card)";
          const stroke = isRun ? "var(--ink)"
            : isBlocked ? "var(--pastel-rose-ink)"
            : "var(--ink-3)";
          // Stagger labels above and below the line so they don't collide.
          const labelAbove = i % 2 === 0;
          const stagePillY = labelAbove ? lineY - 56 : lineY + 18;
          const labelY = labelAbove ? lineY - 20 : lineY + 56;
          const offsetTextY = labelAbove ? lineY - 76 : lineY + 78;
          return (
            <g key={s.id}>
              {/* Vertical tick from the dot to its stage pill */}
              <line x1={cx} y1={lineY} x2={cx} y2={stagePillY + (labelAbove ? 18 : 0)} stroke="var(--ink-4)" strokeWidth="0.7" strokeDasharray="2 3"/>
              {/* Offset label */}
              <text x={cx} y={offsetTextY} textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-4)" letterSpacing="0.06em">
                +{s.offset_ms}ms
              </text>
              {/* Stage pill */}
              <g transform={`translate(${cx - 32}, ${stagePillY})`}>
                <rect x="0" y="0" width="64" height="18" rx="9"
                  fill={`var(--pastel-${tone === "ink" ? "sage" : tone})`}
                  stroke={isRun ? "var(--ink)" : "transparent"}
                  strokeWidth="1"/>
                <text x="32" y="13" textAnchor="middle"
                  fontFamily="var(--font-mono)" fontSize="9" letterSpacing="0.1em"
                  fill={isRun ? "var(--paper)" : `var(--pastel-${tone === "ink" ? "sage" : tone}-ink)`}
                  textTransform="uppercase">
                  {agTruncate(s.stage.toUpperCase(), 10)}
                </text>
              </g>
              {/* Hook label */}
              <text x={cx} y={labelY} textAnchor="middle"
                fontFamily="var(--font-body)" fontSize="11.5" fontWeight="500"
                fill={isBlocked ? "var(--pastel-rose-ink)" : "var(--ink-2)"}>
                {agTruncate(s.label, 18)}
                <title>{s.label} · {s.stage} · +{s.offset_ms}ms (declared {s.duration_ms}ms)</title>
              </text>
              {/* Dot on the timeline */}
              <circle cx={cx} cy={lineY} r="6"
                fill={fill}
                stroke={stroke}
                strokeWidth={isRun ? 2 : 1.2}/>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Configured hooks list (toggleable rows) ──────────────────────────────
function HkConfiguredList({ hooks, onToggle }) {
  if (!hooks || hooks.length === 0) return null;
  // Group by stage for readable grouping in the rows.
  return (
    <div className="hk-card hk-config">
      <div className="hk-card-head">
        <span className="hk-eyebrow">Configured hooks</span>
        <span className="hk-card-meta">{hooks.filter(h => h.enabled).length} on · {hooks.filter(h => !h.enabled).length} paused</span>
      </div>
      <div className="hk-config-rows">
        {hooks.map(h => {
          const tone = HK_STAGE_TONES[h.stage] || "sage";
          return (
            <div key={h.id} className={"hk-config-row" + (h.enabled ? "" : " is-paused")}>
              <span className={`hk-stage-pill hk-tone-${tone === "ink" ? "sage" : tone}`}>
                {h.stage.toUpperCase()}
              </span>
              <div className="hk-config-meta">
                <span className="hk-config-name">{agTruncate(h.label, 26)}</span>
                <span className="hk-config-desc">{agTruncate(h.description, 60)}</span>
              </div>
              <span className={"hk-state-badge " + (h.enabled ? "on" : "off")}>
                {h.enabled ? "ON" : "PAUSED"}
              </span>
              <button
                className="hk-toggle-switch"
                onClick={() => onToggle(h.id)}
                aria-pressed={h.enabled}
                title={h.enabled ? "Pause this hook" : "Resume this hook"}
              >
                <span className={"hk-toggle-thumb" + (h.enabled ? " on" : "")}/>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Performance table (declared p50/p95 + real error counts) ─────────────
function HkPerfTable({ hooks }) {
  if (!hooks || hooks.length === 0) return null;
  // Sort: errors desc, then p95 desc — surfaces the painful hooks first.
  const sorted = [...hooks].sort((a, b) => {
    if ((b.errors || 0) !== (a.errors || 0)) return (b.errors || 0) - (a.errors || 0);
    return (b.expected_p95_ms || 0) - (a.expected_p95_ms || 0);
  });
  return (
    <div className="hk-card hk-perf">
      <div className="hk-card-head">
        <span className="hk-eyebrow">Hook performance</span>
        <span className="hk-card-meta">declared p50 / p95 · live err count</span>
      </div>
      <div className="hk-perf-table">
        <div className="hk-perf-row hk-perf-head-row">
          <span>HOOK</span>
          <span className="hk-perf-num">P50</span>
          <span className="hk-perf-num">P95</span>
          <span className="hk-perf-num">FIRES</span>
          <span className="hk-perf-num">ERR</span>
          <span>TREND</span>
        </div>
        {sorted.map(h => {
          const isPaused = !h.enabled;
          const isHot = (h.errors || 0) > 0 || (h.expected_p95_ms || 0) > 200;
          return (
            <div key={h.id} className={"hk-perf-row" + (isPaused ? " is-paused" : "")}>
              <span className="hk-perf-name">
                <span className={`hk-perf-dot hk-tone-${(HK_STAGE_TONES[h.stage] === "ink" ? "sage" : HK_STAGE_TONES[h.stage]) || "sage"}`}/>
                {agTruncate(h.label, 24)}
              </span>
              <span className="hk-perf-num">{isPaused ? "—" : `${h.expected_p50_ms}ms`}</span>
              <span className="hk-perf-num">{isPaused ? "—" : `${h.expected_p95_ms}ms`}</span>
              <span className="hk-perf-num">{isPaused ? "—" : (h.fires || 0).toLocaleString()}</span>
              <span className={"hk-perf-num" + ((h.errors || 0) > 0 ? " is-err" : "")}>{isPaused ? "—" : (h.errors || 0)}</span>
              <span className="hk-perf-trend">
                {isPaused ? <span className="hk-perf-paused">paused</span>
                  : <HkSparkline isHot={isHot} fires={h.fires || 0} errors={h.errors || 0}/>
                }
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tiny inline sparkline — synthetic visual, declared shape ───────────
// We don't have real time-series for hooks yet; this uses a deterministic
// pseudo-random walk seeded by the hook's id length so each row gets a
// stable distinctive shape.
function HkSparkline({ isHot, fires, errors }) {
  const W = 88, H = 18, N = 12;
  const seed = (fires + errors * 7) % 23 + 1;
  let v = seed % 5;
  const points = [];
  for (let i = 0; i < N; i++) {
    v = (v + ((seed * (i + 3)) % 7) - 3) % 8;
    if (v < 0) v += 8;
    const y = 4 + (8 - v) * 1.2;
    const x = (i / (N - 1)) * (W - 4) + 2;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="hk-spark" preserveAspectRatio="none">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={isHot ? "var(--pastel-rose-ink)" : "var(--pastel-mint-ink)"}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={isHot ? 0.85 : 0.7}
      />
    </svg>
  );
}

// ── Page component ─────────────────────────────────────────────────────────
function HooksScreen({ go }) {
  const [windowKey, setWindowKey] = ag_useState("24h");
  const [snapshot, setSnapshot] = ag_useState(null);
  const [paused, setPaused] = ag_useState(false);
  const [loading, setLoading] = ag_useState(false);
  const [toast, setToast] = ag_useState(null);
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 1800); };

  const refresh = ag_useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/hooks/snapshot?window=${encodeURIComponent(windowKey)}`);
      const j = await r.json();
      if (j?.ok) setSnapshot(j);
    } catch {} finally { setLoading(false); }
  }, [windowKey]);

  ag_useEffect(() => { refresh(); }, [refresh]);

  ag_useEffect(() => {
    if (paused) return;
    const id = setInterval(refresh, 6000);
    return () => clearInterval(id);
  }, [refresh, paused]);

  const onToggle = ag_useCallback(async (id) => {
    try {
      const r = await fetch("/api/hooks/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await r.json();
      if (j?.ok) {
        showToast(`${id} · ${j.enabled ? "on" : "paused"}`);
        await refresh();
      } else {
        showToast(`toggle failed · ${j?.error || ""}`);
      }
    } catch (e) {
      showToast(`toggle failed · ${e.message || e}`);
    }
  }, [refresh]);

  return (
    <div className="auto-page hk-page">
      <HkHeader
        window={windowKey}
        onWindow={setWindowKey}
        onRefresh={refresh}
        onPause={() => setPaused(p => !p)}
        paused={paused}
        loading={loading}
        requestPreview={snapshot?.request_preview}
      />

      <HkRequestTimeline preview={snapshot?.request_preview}/>

      <div className="hk-grid">
        <HkConfiguredList hooks={snapshot?.hooks} onToggle={onToggle}/>
        <HkPerfTable hooks={snapshot?.hooks}/>
      </div>

      {toast && <div className="tg-toast">{toast}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════════════════
Object.assign(window, {
  AutomationGraphScreen,
  AutomationShell,
  TriggersScreen,
  SubAgentPlannerScreen,
  StateMachineScreen,
  HooksScreen,
  ComingSoonScreen,
  NODE_DIMS,
  LIBRARY,
  KIND_TABLE,
  DEMO_WORKFLOW,
  serializeWorkflow,
  orthogonalPath,
  dispatchRodbot,
});

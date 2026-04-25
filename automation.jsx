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
      <text className="label" x={0} y={14}>{node.label}</text>
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
              >{label}</text>
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
function AutomationGraphScreen({ go }) {
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
// Exports
// ═══════════════════════════════════════════════════════════════════════════
Object.assign(window, {
  AutomationGraphScreen,
  NODE_DIMS,
  LIBRARY,
  KIND_TABLE,
  DEMO_WORKFLOW,
  serializeWorkflow,
  orthogonalPath,
  dispatchRodbot,
});

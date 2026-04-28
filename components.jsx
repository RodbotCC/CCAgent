/* Comeketo Agent — core UI: topbar, breadcrumb, grid (content-in-cell), fullscreen preview, rail */

const { useState, useEffect, useRef, useMemo, useCallback } = React;

const SCREEN_LABELS = {
  grid: "grid",
  settings: "settings",
  memory: "memory",
  prediction: "prediction",
  commitments: "commitments",
  inbox: "inbox",
  contacts: "contacts",
  briefing: "briefing",
  delegations: "delegations",
  chat: "chat",
  calendar: "calendar",
  rodbot: "Rodbot",
  projects: "projects",
  activity: "activity",
  analytics: "analytics",
  automation: "automation",
  boxes: "boxes",
};

// i18n stub — i18n.js was retired (Apr 2026 trim). Any straggler `t("key")`
// calls echo the key back as a literal string so nothing crashes.
function t(k) { return String(k == null ? "" : k); }

function NavGroup({ label, icon, items, activeNames, currentRoute, badgeTotal }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  const isActive = activeNames.includes(currentRoute);
  return (
    <div className="nav-group" ref={wrapRef} style={{position:"relative", display:"inline-flex"}}>
      <button
        className={"chip" + (isActive ? " active" : "")}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon name={icon} size={14}/>{label}
        {badgeTotal > 0 && !isActive && (
          <span style={{marginLeft:4, padding:"1px 7px", borderRadius:8, background:"var(--paper-card-2)", color:"var(--ink-3)", fontSize:10, fontWeight:700}}>{badgeTotal}</span>
        )}
        <Icon name="chevron-down" size={11} style={{marginLeft:2, opacity:0.7}}/>
      </button>
      {open && (
        <div className="nav-menu" role="menu" style={{
          position:"absolute", top:"calc(100% + 6px)", right:0,
          background:"var(--paper-card)", border:"1px solid var(--rule)",
          borderRadius:10, boxShadow:"0 8px 24px rgba(29,31,39,0.14)",
          padding:6, minWidth:180, zIndex:50, display:"flex", flexDirection:"column", gap:2,
        }}>
          {items.map(it => (
            <button
              key={it.name}
              className={"chip" + (currentRoute === it.name ? " active" : "")}
              onClick={() => { setOpen(false); it.onClick(); }}
              style={{justifyContent:"flex-start", width:"100%", borderRadius:8}}
              role="menuitem"
            >
              <Icon name={it.icon} size={13}/>
              <span style={{flex:1, textAlign:"left"}}>{it.label}</span>
              {it.badge && (
                <span style={{padding:"1px 7px", borderRadius:8, background:it.badge.bg, color:it.badge.fg, fontSize:10, fontWeight:700}}>{it.badge.text}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─ Breadcrumb — extracted as a standalone component so it can render in the
//   bottom strip instead of the topbar. Design principle (Apr 2026): no page
//   scroll. The breadcrumb used to live in Row 2 of the Topbar and ate
//   vertical space that the work surface needed. It now renders in the
//   bottom strip (see <BottomStrip> below), paired with the brand/state sig.
function Breadcrumb({ history, go }) {
  // Rodbot authorship detection (§6): single strict case until a segment→author
  // registry exists. Placeholder sage dot styled via .breadcrumb .rodbot-dot.
  const isRodbotSegment = (h) => h && (h.name === "Rodbot" || h.name === "rodbot");

  // Middle-ellipsis truncation (§2): count-based heuristic. Collapse interior
  // when the chain exceeds MAX_CRUMBS, native tooltip reveals the hidden list.
  const MAX_CRUMBS = 6;
  const full = history || [];
  let walk;
  if (full.length > MAX_CRUMBS) {
    walk = [
      { kind: "seg", h: full[0], idx: 0 },
      { kind: "seg", h: full[1], idx: 1 },
      { kind: "ellipsis", hidden: full.slice(2, full.length - 3) },
      { kind: "seg", h: full[full.length - 3], idx: full.length - 3 },
      { kind: "seg", h: full[full.length - 2], idx: full.length - 2 },
      { kind: "seg", h: full[full.length - 1], idx: full.length - 1 },
    ];
  } else {
    walk = full.map((h, i) => ({ kind: "seg", h, idx: i }));
  }

  const lastIdx = full.length - 1;
  const crumbs = [];
  walk.forEach((node, visualIdx) => {
    if (visualIdx > 0) crumbs.push(<span key={"sep" + visualIdx} className="sep">/</span>);
    if (node.kind === "ellipsis") {
      const tip = node.hidden.map(h => {
        let label = SCREEN_LABELS[h.name] || h.name;
        if (h.name === "grid" && h.gridId) label = "grid · " + h.gridId;
        return label;
      }).join(" / ");
      crumbs.push(
        <span key={"el" + visualIdx} className="ellipsis" title={tip} aria-label={"hidden: " + tip}>…</span>
      );
      return;
    }
    const h = node.h;
    const i = node.idx;
    const isLast = i === lastIdx;
    let label = SCREEN_LABELS[h.name] || h.name;
    if (h.name === "grid" && h.gridId) label = "grid · " + h.gridId;
    const rodbot = isRodbotSegment(h);
    const inner = (
      <React.Fragment>
        {rodbot && <span className="rodbot-dot" aria-hidden="true" />}
        {label}
      </React.Fragment>
    );
    crumbs.push(isLast
      ? <span key={i} className="seg current">{inner}</span>
      : <button key={i} className="seg" onClick={() => go.jumpTo(i)}>{inner}</button>);
  });

  return <div className="breadcrumb">{crumbs}</div>;
}
window.Breadcrumb = Breadcrumb;

function Topbar({ route, history, go, stateSig, onOpenSettings, onOpenLeads, onOpenClients, onOpenCoworkers, onOpenContacts, onOpenVenues, onOpenBriefing, onOpenActivity, onOpenAutomation, onOpenIntake, onOpenAnalytics, onOpenDelegations, onOpenBoxes, onHome }) {
  return (
    <div className="topbar">
      {/* ── Row 0: brand (quiet letterhead) + context strip (quiet meta) ── */}
      <div className="topbar-meta">
        <div className="brand">
          <button className="mark" onClick={onHome} aria-label="Home">Comeketo Agent</button>
        </div>
        <div className="context-strip">
          <span className="ctx-item"><b>{stateSig.mode}</b> <span className="meta-sep">·</span> {stateSig.domain}</span>
          <span className="meta-sep">·</span>
          <button
            className={"chip" + (route.name === "briefing" ? " active" : "")}
            onClick={onOpenBriefing}
            title="briefing"
          >
            briefing
          </button>
          <button
            className={"gear" + (route.name === "settings" ? " active" : "")}
            onClick={onOpenSettings}
            title="settings"
            aria-label="settings"
          >
            <Icon name="settings" size={14}/>
          </button>
        </div>
      </div>

      {/* ── Row 1: section tabs (People / Activity / Intake / Automation) ── */}
      <div className="topbar-sections">
        <NavGroup
          label="people"
          icon="users"
          activeNames={["leads", "clients", "coworkers", "contacts", "venues"]}
          currentRoute={route.name}
          items={[
            { name: "leads",     label: "leads",     icon: "trending-up",  onClick: onOpenLeads,     badge: null },
            { name: "clients",   label: "clients",   icon: "briefcase",    onClick: onOpenClients,   badge: null },
            { name: "coworkers", label: "coworkers", icon: "users",        onClick: onOpenCoworkers, badge: null },
            { name: "contacts",  label: "contacts",  icon: "phone",        onClick: onOpenContacts,  badge: null },
            { name: "venues",    label: "venues",    icon: "map-pin",      onClick: onOpenVenues,    badge: null },
          ]}
        />
        <button className={"chip" + (route.name === "activity" ? " active" : "")} onClick={onOpenActivity} title="Activity">
          <Icon name="activity" size={14}/>activity
        </button>
        <button className={"chip" + (route.name === "intake" ? " active" : "")} onClick={onOpenIntake} title="Intake — drop receipts, invoices, notes">
          <Icon name="inbox" size={14}/>intake
        </button>
        <button className={"chip" + (route.name === "analytics" ? " active" : "")} onClick={onOpenAnalytics} title="Analytics">
          <Icon name="bar-chart-2" size={14}/>analytics
        </button>
        <button className={"chip" + (route.name === "boxes" ? " active" : "")} onClick={onOpenBoxes} title="Auto boxes runtime">
          <Icon name="layers" size={14}/>boxes
        </button>
        <button className={"chip" + (route.name === "automation" ? " active" : "")} onClick={onOpenAutomation} title="Automation graph">
          <Icon name="git-branch" size={14}/>automation
        </button>
        <button className={"chip" + (route.name === "delegations" ? " active" : "")} onClick={onOpenDelegations} title="Delegations action zone">
          <Icon name="terminal" size={14}/>delegations
        </button>
      </div>
      {/* Row 2 (breadcrumb) moved to BottomStrip — Apr 2026 no-page-scroll pass */}
    </div>
  );
}

// ─ BottomStrip — replaces StatusBar (demo signature/comparator/pred.acc strip).
//   Renders breadcrumb on the left (lifted out of Topbar) and the brand title
//   + mode/domain pill on the right. Fixed height so the main content area
//   gets maximum vertical real estate. Part of the system-wide "no page
//   scroll, paginate instead" principle (Apr 2026).
function BottomStrip({ history, go, stateSig, onHome }) {
  return (
    <div className="bottom-strip">
      <div className="bottom-strip-left">
        <Breadcrumb history={history} go={go} />
      </div>
      <div className="bottom-strip-right">
        <span className="bs-mode"><b>{stateSig.mode}</b> <span className="bs-sep">·</span> {stateSig.domain}</span>
        <button className="bs-brand" onClick={onHome} aria-label="Home" title="Home">Comeketo Agent</button>
      </div>
    </div>
  );
}
window.BottomStrip = BottomStrip;

// Legacy — no longer rendered. Kept as a named export so any stale import
// resolves to a no-op rather than undefined.
function StatusBar() { return null; }

// Map seed source_type to a human-readable chip label.
function seedTypeLabel(t) {
  switch (t) {
    case "rodbot_memory":     return "from our chats";
    case "chat_reflection":   return "you mentioned";
    case "project_task":      return "task";
    case "briefing_item":     return "briefing";
    case "person_owed":       return "owed reply";
    case "commitment":        return "commitment";
    case "thread":            return "thread";
    case "project_blocker":   return "blocker";
    case "project":           return "project";
    case "north_star_anchor": return "north star";
    default: return t || "seed";
  }
}
window.seedTypeLabel = seedTypeLabel;

// ——— The grid: cells show real content. Click = fullscreen.
// Per-cell right-click context menu. Actions: edit with Rodbot, mark complete
// (retire), mark recurring with cadence, delete with reason. Each writes to a
// dedicated jsonl ledger (retired_cells / recurring_cells / rejected_cells)
// plus a mirror line on activity.jsonl. The scorer can then read those to
// suppress look-alikes on future grids.
function CellContextMenu({ x, y, cell, gridId, onClose }) {
  const [mode, setMode] = useState("root"); // root | recurring | reject
  const [reason, setReason] = useState("");
  const [cadence, setCadence] = useState("daily");
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const onEsc = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDoc); document.removeEventListener("keydown", onEsc); };
  }, [onClose]);

  const post = async (path, body) => {
    setBusy(true);
    try {
      const r = await fetch(path, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "failed");
      onClose();
    } catch (e) { alert("Action failed: " + e.message); }
    finally { setBusy(false); }
  };

  const base = { gridId, cellId: cell.id, headline: cell.headline, preview: cell.preview || "" };
  const retire    = () => post("/api/cells/retire",    base);
  const recurring = () => post("/api/cells/recurring", { ...base, cadence });
  const reject    = () => {
    if (!reason.trim()) return;
    post("/api/cells/reject", { ...base, reason: reason.trim() });
  };

  const menuStyle = {
    position: "fixed", top: y, left: x, zIndex: 200,
    background: "var(--paper-card)", border: "1px solid var(--rule)",
    borderRadius: 10, boxShadow: "0 10px 32px rgba(29,31,39,0.18)",
    padding: 6, minWidth: 240, fontFamily: "var(--font-body)", fontSize: 12.5,
  };
  const itemStyle = {
    display: "block", width: "100%", textAlign: "left",
    padding: "9px 12px", borderRadius: 7, border: "none", background: "transparent",
    color: "var(--ink)", cursor: "pointer",
  };
  const dangerStyle = { ...itemStyle, color: "var(--alarm, #b05656)" };

  if (mode === "recurring") {
    return (
      <div ref={ref} style={menuStyle}>
        <div style={{padding:"8px 12px 6px", fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-4)"}}>
          Recur how often?
        </div>
        <div style={{display:"grid", gap:2, padding:"0 4px"}}>
          {["daily","weekdays","weekly","biweekly","monthly"].map(c => (
            <button key={c} onClick={() => setCadence(c)}
              style={{...itemStyle, background: cadence===c ? "color-mix(in oklab, var(--ember) 10%, var(--paper-card))" : "transparent"}}>
              {c}
            </button>
          ))}
        </div>
        <div style={{display:"flex", gap:6, padding:"8px 4px 4px", borderTop:"1px solid var(--rule)"}}>
          <button onClick={() => setMode("root")} style={{...itemStyle, textAlign:"center", flex:1}}>← back</button>
          <button onClick={recurring} disabled={busy}
            style={{...itemStyle, textAlign:"center", flex:1, background:"var(--ember)", color:"var(--paper-card-2)"}}>
            {busy ? "…" : "Save"}
          </button>
        </div>
      </div>
    );
  }

  if (mode === "reject") {
    return (
      <div ref={ref} style={menuStyle}>
        <div style={{padding:"8px 12px 6px", fontSize:10.5, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-4)"}}>
          Why is this block not useful?
        </div>
        <textarea autoFocus value={reason} onChange={e => setReason(e.target.value)}
          placeholder="out of scope / wrong timing / bad framing / …"
          style={{
            width:"calc(100% - 16px)", margin:"4px 8px", padding:8, borderRadius:6,
            border:"1px solid var(--rule)", background:"var(--paper)", color:"var(--ink)",
            fontFamily:"var(--font-body)", fontSize:12.5, minHeight:68, resize:"vertical",
          }}/>
        <div style={{fontSize:10, color:"var(--ink-4)", padding:"2px 12px 6px"}}>
          Saved as a negative vector — the system learns not to suggest this shape again.
        </div>
        <div style={{display:"flex", gap:6, padding:"6px 4px 4px", borderTop:"1px solid var(--rule)"}}>
          <button onClick={() => setMode("root")} style={{...itemStyle, textAlign:"center", flex:1}}>← back</button>
          <button onClick={reject} disabled={busy || !reason.trim()}
            style={{...dangerStyle, textAlign:"center", flex:1, background:"var(--alarm)", color:"var(--ink-inverse)", opacity: busy||!reason.trim()?0.5:1}}>
            {busy ? "…" : "Delete block"}
          </button>
        </div>
      </div>
    );
  }

  // root menu — uses the generic ContextMenu primitive. keepOpen:true on
  // items that commit async (retire) or swap into a sub-mode (recurring,
  // reject) so the menu stays mounted while setMode rerenders this component.
  const title = cell.headline
    ? cell.headline.slice(0, 56) + (cell.headline.length > 56 ? "…" : "")
    : undefined;
  return (
    <ContextMenu
      x={x} y={y}
      title={title}
      onClose={onClose}
      items={[
        { icon: "✓", label: "mark complete",  onClick: retire,                 disabled: busy, keepOpen: true },
        { icon: "↻", label: "mark recurring", onClick: () => setMode("recurring"),             keepOpen: true },
        { divider: true },
        { icon: "✕", label: "delete block",   onClick: () => setMode("reject"),  danger: true, keepOpen: true },
      ]}
    />
  );
}

function Grid({ grid, onCellOpen, onSweep, onFrameReject, aiBusy, canGenerate, aiConfigured, historyDepth, onGenerate, onBack, onOpenSettings }) {
  const [ctx, setCtx] = useState(null); // {x, y, cell}
  const [intent, setIntent] = useState(""); // optional user guardrail for Generate

  const fireGenerate = () => {
    if (aiBusy) return;
    onGenerate(intent);
    // Keep the intent visible; the team can tweak and regen. Clearing only on successful new grid is more surgical but also more surprising.
  };
  const [arriving, setArriving] = useState(false);
  const lastId = useRef(grid.id);
  useEffect(() => {
    if (lastId.current !== grid.id) {
      lastId.current = grid.id;
      setArriving(true);
      const t = setTimeout(() => setArriving(false), 320);
      return () => clearTimeout(t);
    }
  }, [grid.id]);

  const [userText, setUserText] = useState("");
  const submitFrame = (e) => {
    if (e.key === "Enter" && userText.trim()) {
      onFrameReject(userText.trim());
      setUserText("");
    }
  };

  const renderCell = (id) => {
    const c = grid.cells[id];
    if (!c) return <div key={id} className="cell placeholder" />;
    const classes = [
      "cell", "content-cell",
      "kind-" + c.kind,
      c.predicted && "predicted",
    ].filter(Boolean).join(" ");
    // Human-readable tag for seed provenance shown at the cell's foot.
    const seedTag = c.seed ? seedTypeLabel(c.seed.source_type) : null;
    return (
      <button key={id} className={classes}
        onClick={() => onCellOpen(id)}
        onContextMenu={(e) => {
          e.preventDefault();
          setCtx({ x: e.clientX, y: e.clientY, cell: { ...c, id } });
        }}>
        <div className="addr">
          <span>{id}</span>
          <span>
            {c.predicted
              ? <span className="addr-pred">● predicted</span>
              : c.kind === "hybrid" ? "hybrid" : c.kind === "plus" ? "+7th" : "candidate"}
          </span>
        </div>
        <div className="headline">{c.headline}</div>
        <div className="preview">{c.preview}</div>
        {seedTag && (
          <div className="cell-seed" title={c.seed.source_id + " · score " + c.seed.score}>
            <span className={"seed-dot seed-" + c.seed.source_type}/>
            {seedTag}
            <span className="seed-score">{c.seed.score.toFixed(2)}</span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="grid-stage">
      {ctx && (
        <CellContextMenu
          x={ctx.x} y={ctx.y} cell={ctx.cell} gridId={grid.id}
          onClose={() => setCtx(null)}
        />
      )}
      <div className="grid-head">
        <div>
          <div className="kicker">grid · {grid.id}</div>
          <div className="q">{grid.title}</div>
          {grid.context && <div className="ctx-line">{grid.context}</div>}
        </div>
        <div className="frame">
          <div><b>frame</b> {grid.frameType}</div>
          <div>{grid.frameNote}</div>
          <div className="grid-head-actions">
            {historyDepth > 1 && (
              <button className="btn ghost" onClick={onBack} disabled={aiBusy} title={`${historyDepth} versions stacked`}>
                ← back
              </button>
            )}
            {canGenerate ? (
              <div className="gen-row" style={{display:"flex", alignItems:"center", gap:6}}>
                <input
                  type="text"
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") fireGenerate(); }}
                  placeholder="optional lens for this generation"
                  disabled={aiBusy}
                  style={{
                    width: 320, padding: "8px 12px",
                    fontFamily: "var(--font-body)", fontSize: 12,
                    background: "var(--paper-card)",
                    border: "1px solid var(--rule)",
                    borderRadius: "var(--r-pill)",
                    color: "var(--ink)",
                    outline: "none",
                  }}
                />
                <button className="btn primary" onClick={fireGenerate} disabled={aiBusy} title={intent.trim() ? "Generate with your lens" : "Generate from Mission Control"}>
                  {aiBusy ? "generating…" : (intent.trim() ? "generate ·" : "generate")}
                </button>
              </div>
            ) : (
              <button className="btn ghost" onClick={onOpenSettings}>
                {!aiConfigured ? "add API key" : "settings"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={"grid content-grid" + (arriving ? " arriving" : "")}>
        {renderCell("01")}
        {renderCell("02")}
        {renderCell("03")}
        {renderCell("04")}
        {renderCell("05")}
        {renderCell("06")}
      </div>
    </div>
  );
}

// ——— Fullscreen cell preview: commit / refine / back
function FullscreenCell({ cell, grid, onRefine, onClose, aiBusy, prewarm }) {
  if (!cell) return null;
  // Refine is always available when the AI is configured; the handler in App
  // decides whether to navigate to an existing grid or generate a new one.
  const aiReady = !!(window.SecretaryAI && window.SecretaryAI.isConfigured && window.SecretaryAI.isConfigured());
  const hasExplicitTarget = !!cell.refine;
  const canRefine = hasExplicitTarget || aiReady;
  const prewarmState = prewarm && prewarm.state;    // 'idle' | 'loading' | 'ready' | 'error'

  const refineSub = !canRefine
    ? "No API key · Settings → Intelligence"
    : hasExplicitTarget
      ? "Spread 7 variants deeper into this idea"
      : prewarmState === "ready"
        ? "Pre-warmed · opens instantly"
        : prewarmState === "loading"
          ? "Pre-warming in background…"
          : prewarmState === "error"
            ? "Pre-warm failed · will retry on click"
            : "AI will generate 6 variants on click";

  return (
    <div className="fullscreen-overlay" onClick={onClose}>
      <div className="fullscreen-card" onClick={(e) => e.stopPropagation()}>
        <div className="fs-top">
          <div className="kicker">
            {grid.id} · box {cell._id} · {cell.kind === "hybrid" ? "hybrid" : cell.kind === "plus" ? "7th candidate" : "candidate"}
            {cell.predicted && <span style={{color:"var(--ember)", marginLeft:12}}>● predicted</span>}
          </div>
          <button className="fs-close" onClick={onClose} aria-label="back">← back</button>
        </div>

        <h1 className="fs-headline">{cell.headline}</h1>
        <div className="fs-preview">{cell.preview}</div>

        {cell.seed && (
          <div className="fs-provenance">
            <div className="fs-provenance-head">
              <span className={"seed-dot seed-" + cell.seed.source_type}/>
              <span><b>source</b> · {seedTypeLabel(cell.seed.source_type)}</span>
              <span className="fs-provenance-id">{cell.seed.source_id}</span>
              <span className="fs-provenance-score">score {cell.seed.score.toFixed(3)}</span>
            </div>
            {cell.seed.breakdown && (
              <div className="fs-provenance-breakdown">
                <span>alignment {cell.seed.breakdown.alignment.toFixed(2)}</span>
                <span>recency {cell.seed.breakdown.recency.toFixed(2)}</span>
                <span>boost {cell.seed.breakdown.boost.toFixed(2)}</span>
                <span>affinity {cell.seed.breakdown.affinity.toFixed(2)}</span>
                {cell.seed.breakdown.stale ? <span className="dim">stale −{cell.seed.breakdown.stale.toFixed(2)}</span> : null}
              </div>
            )}
          </div>
        )}

        <Markdown text={cell.detail} className="fs-detail"/>

        <div className="fs-actions">
          <button
            className={"btn big" + (canRefine ? "" : " disabled")}
            onClick={canRefine ? onRefine : undefined}
            disabled={!canRefine || aiBusy}
          >
            <span className="a-label">
              {aiBusy ? "Generating…" : "Refine"}
              {prewarmState === "ready" && !aiBusy && <span style={{color:"var(--ember)", marginLeft:8, fontSize:11}}>● ready</span>}
              {prewarmState === "loading" && !aiBusy && <span style={{color:"var(--ink-4)", marginLeft:8, fontSize:11}}>◐ warming</span>}
            </span>
            <span className="a-sub">{refineSub}</span>
          </button>
          <button className="btn ghost big" onClick={onClose}>
            <span className="a-label">Back</span>
            <span className="a-sub">Return to grid</span>
          </button>
        </div>

        <div className="fs-meta">
          <span><b>commit type</b> {cell.commit.kind}</span>
          {cell.refine && <span><b>refine →</b> {cell.refine}</span>}
          <span><b>frame</b> {grid.frameType}</span>
        </div>
      </div>
    </div>
  );
}

// ——— Rail (side panels) — same as before but slimmer
function Rail({ grid, stateSig, gestureLog, predAcc, refineStack, onStackJump }) {
  return (
    <div className="rail">
      <div className="panel">
        <header>
          <h3>State signature</h3>
          <span className="hint">cluster · {stateSig.cluster}</span>
        </header>
        <div className="row"><span className="k">mode</span><span className="v">{stateSig.mode}</span></div>
        <div className="row"><span className="k">domain</span><span className="v">{stateSig.domain}</span></div>
        <div className="row"><span className="k">comparator</span><span className="v accent">{stateSig.comparator}</span></div>
        <div className="row"><span className="k">tod · dow</span><span className="v">{stateSig.tod} · {stateSig.dow}</span></div>
        <div className="row"><span className="k">recent</span><span className="v">{stateSig.recent}</span></div>
      </div>

      <div className="panel">
        <header><h3>Prediction</h3><span className="hint">this cluster</span></header>
        <div className="row"><span className="k">accuracy</span><span className="v">{(predAcc*100).toFixed(0)}%</span></div>
        <div className="meter"><span style={{width: `${predAcc*100}%`}}/></div>
        <div className="row" style={{marginTop:10}}><span className="k">confidence</span><span className="v">{predAcc > 0.9 ? "auto-commit eligible" : "review mode"}</span></div>
      </div>

      <div className="panel">
        <header><h3>Refinement path</h3><span className="hint">depth {refineStack.length - 1}</span></header>
        <div className="stack">
          {refineStack.map((g, i) => (
            <button key={i} className={"crumb" + (i === refineStack.length - 1 ? " active" : "")} onClick={() => onStackJump(i)}>
              {String(i).padStart(2,"0")} · {g}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <header><h3>Gestures</h3><span className="hint">last 9</span></header>
        <div className="log">
          {gestureLog.slice(-9).map((e, i) => (
            <div key={i} className="entry">
              <span className="t">{e.time}</span>
              <span className={"g " + e.type}>{e.type === "frame_reject" ? "frame·x" : e.type}</span>
              <span className="d">{e.target} {e.detail ? "— " + e.detail : ""}</span>
            </div>
          ))}
          {gestureLog.length === 0 && <div style={{color:"var(--ink-4)", padding:"8px 0"}}>no gestures yet — tap a box</div>}
        </div>
      </div>
    </div>
  );
}

// ——— Tweaks panel (unchanged shape)
function TweaksPanel({ tweaks, setTweaks, onClose }) {
  const set = (k, v) => setTweaks({ ...tweaks, [k]: v });
  return (
    <div className="tweaks-panel">
      <header>
        <h4>Tweaks</h4>
        <button onClick={onClose} style={{color:"var(--paper)", fontSize:14}}>×</button>
      </header>
      <div className="body">
        <div className="row">
          <span className="k">Theme</span>
          <span className="v">
            <div className="segmented">
              <button className={tweaks.theme === "light" ? "on" : ""} onClick={() => set("theme","light")}>paper</button>
              <button className={tweaks.theme === "dark" ? "on" : ""} onClick={() => set("theme","dark")}>ink</button>
            </div>
          </span>
        </div>
        <div className="row">
          <span className="k">Demo mode</span>
          <span className="v">
            <div className={"toggle" + (tweaks.demoMode ? " on" : "")} onClick={() => set("demoMode", !tweaks.demoMode)} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ——— Markdown renderer (used in chat) ————————————————————————————————————————
// Renders GFM-ish markdown via `marked`, sanitized through DOMPurify.
// Falls back to plain text if either lib failed to load.
//
// marked v14 supports both `marked.parse(text, options)` AND `marked(text, options)`;
// some builds return a promise when `async: true` is set on the global config.
// We handle both, but never await — markdown rendering is sync in the app.
function Markdown({ text, className }) {
  const html = useMemo(() => {
    if (text == null || text === "") return "";
    const M = window.marked;
    const P = window.DOMPurify;
    if (!M) return null;
    try {
      // Configure once to be safe — gfm + breaks at the global level guards
      // against builds that ignore per-call options.
      try {
        if (typeof M.setOptions === "function") {
          M.setOptions({ gfm: true, breaks: true, async: false });
        }
      } catch { /* noop */ }
      let raw = (typeof M.parse === "function")
        ? M.parse(String(text), { gfm: true, breaks: true })
        : M(String(text), { gfm: true, breaks: true });
      if (raw && typeof raw.then === "function") return null; // async path → fall back
      return P ? P.sanitize(raw) : raw;
    } catch { return null; }
  }, [text]);
  if (html == null) {
    return <div className={className} style={{whiteSpace:"pre-wrap", wordBreak:"break-word"}}>{text}</div>;
  }
  const cls = className ? (/\bmd\b/.test(className) ? className : "md " + className) : "md";
  return <div className={cls} dangerouslySetInnerHTML={{ __html: html }} />;
}

// ——— Chat rail (right side of grid — replaces the old State/Prediction panels)
// Those diagnostics now live on the Prediction + Memory screens. The space is
// better spent letting the team fire messages at Comeketo Agent without leaving the grid.
function ChatRail({ go, gridGenerate, aiBusy }) {
  const CHAT = window.SecretaryChat;
  const [chats, setChats] = useState(() => (CHAT ? CHAT.all() : []));
  const [activeId, setActiveId] = useState(() => (CHAT ? (CHAT.activeId() || (CHAT.all()[0] && CHAT.all()[0].id)) : null));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  // Attachments — ported from ChatScreen so the homepage rail can finally
  // accept files. Same expanded MIME allowlist (images, PDFs, CSV, JSON,
  // text, code, docx, etc.). Drag-and-drop, paste, and a file picker.
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!CHAT) return;
    const unsub = CHAT.subscribe((list) => setChats([...list]));
    return unsub;
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeId, chats, busy]);

  const active = activeId ? chats.find(c => c.id === activeId) : null;
  // Show more turns on the front-page rail now that it's persistent.
  const turns = active ? active.turns.slice(-14) : [];

  // ── File upload pipeline (identical filter to ChatScreen) ─────────────
  const ingestFiles = async (files) => {
    const ALLOW_RX = /^(image\/|application\/(pdf|json|x-yaml|xml|zip|x-tar|x-gzip|vnd\.|msword|vnd\.openxmlformats)|text\/)/;
    const ALLOW_EXT = /\.(pdf|csv|tsv|json|jsonl|md|markdown|txt|log|yaml|yml|xml|html|htm|js|jsx|ts|tsx|py|rb|go|rs|java|kt|swift|c|cpp|h|hpp|cs|php|sh|sql|toml|ini|env|dockerfile|docx|xlsx|pptx|zip|tar|gz)$/i;
    const list = Array.from(files || []).filter(f => {
      if (!f) return false;
      if (ALLOW_RX.test(f.type || "")) return true;
      if (ALLOW_EXT.test(f.name || "")) return true;
      return !f.type && f.size && f.size < 2 * 1024 * 1024;
    });
    if (!list.length || !CHAT || !CHAT.uploadFile) return;
    setUploading(true);
    try {
      for (const f of list) {
        try {
          const meta = await CHAT.uploadFile(f);
          setAttachments(prev => [...prev, meta]);
        } catch (e) {
          console.warn("[chat-rail] upload failed:", e.message);
          alert("Upload failed: " + e.message);
        }
      }
    } finally { setUploading(false); }
  };
  const onDrop = async (e) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      await ingestFiles(e.dataTransfer.files);
    }
  };
  const onDragOver = (e) => { e.preventDefault(); if (!dragOver) setDragOver(true); };
  const onDragLeave = (e) => { e.preventDefault(); setDragOver(false); };
  const onPaste = async (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    const files = [];
    for (const it of items) {
      if (it.kind === "file") {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) {
      e.preventDefault();
      await ingestFiles(files);
    }
  };
  const removeAttachment = (idx) => setAttachments(a => a.filter((_, i) => i !== idx));

  const sendToDelegations = async (text) => {
    const body = String(text || "").trim();
    if (!body) return;
    if (!(window.SecretaryDelegationsBridge && window.SecretaryDelegationsBridge.sendToDraft)) {
      alert("Delegations bridge unavailable.");
      return;
    }
    try {
      await window.SecretaryDelegationsBridge.sendToDraft({
        text: body,
        label: "From chat rail: " + body.slice(0, 40),
        source: { surface: "chat_rail", route: "grid", entity: { type: "assistant_turn", chat_id: activeId } },
        policy: { target: "github", intent: "read", approval_required: false },
        mode: "safe",
        context: { chat_id: activeId, from: "assistant-turn" },
      });
      if (go && go.push) go.push("delegations");
    } catch (e) {
      alert("Delegation draft failed: " + (e.message || e));
    }
  };

  // Detect regen/regenerate-style intent. If the user asks for a new grid,
  // pipe the rest of the message (everything after the directive word) into
  // onGenerate as the intent, and echo a system turn instead of calling the
  // model twice.
  const parseRegenIntent = (text) => {
    const m = String(text).match(/^\s*(?:\/regen|regenerate|new grid|regen)\b[\s:,\-]*(.*)$/i);
    if (!m) return null;
    return (m[1] || "").trim();
  };

  const send = async () => {
    const hasText = !!draft.trim();
    const hasAtt  = attachments.length > 0;
    if ((!hasText && !hasAtt) || busy || !CHAT) return;
    const text = draft.trim();
    // Regen intent only fires on bare text commands — attachments bypass it.
    const regen = (gridGenerate && !hasAtt) ? parseRegenIntent(text) : null;
    if (regen !== null) {
      let cid = activeId;
      if (!cid) { const c = CHAT.newChat(); cid = c.id; setActiveId(cid); }
      CHAT.appendTurn(cid, "user", text);
      CHAT.appendSystem("Regenerating the grid" + (regen ? " · lens: " + regen : "") + "…");
      setDraft("");
      try { gridGenerate(regen); } catch (e) { CHAT.appendSystem("Regen failed: " + e.message); }
      return;
    }
    setBusy(true);
    try {
      let cid = activeId;
      if (!cid) {
        const c = CHAT.newChat();
        cid = c.id; setActiveId(cid);
      }
      const atts = attachments;
      setDraft("");
      setAttachments([]);
      await CHAT.send({ chatId: cid, text, attachments: atts });
    } catch (e) {
      alert("Send failed: " + e.message);
    } finally { setBusy(false); }
  };

  const newChat = () => {
    if (!CHAT) return;
    const c = CHAT.newChat();
    setActiveId(c.id);
    setDraft("");
  };

  return (
    <div className="rail">
      <div className="panel chat-rail">
        <header>
          <h3 style={{display:"inline-flex", alignItems:"center", gap:6}}>
            <Icon name="message-square" size={12}/> Chat
          </h3>
          <span className="hint" style={{display:"inline-flex", gap:8, alignItems:"center"}}>
            <button onClick={newChat} title="New chat"
              style={{background:"transparent", border:"none", cursor:"pointer", color:"var(--ink-4)", padding:0, display:"inline-flex", alignItems:"center", gap:3}}>
              <Icon name="plus" size={11}/> new
            </button>
            {aiBusy && <span style={{fontSize:10, color:"var(--event-generate)"}}>· regen…</span>}
          </span>
        </header>

        <div
          ref={scrollRef}
          className="chat-rail-stream"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            position:"relative",
            outline: dragOver ? "2px dashed color-mix(in oklab, var(--ink) 35%, transparent)" : "none",
            outlineOffset: "-4px",
            background: dragOver ? "color-mix(in oklab, var(--ink) 4%, transparent)" : undefined,
            transition:"background 120ms ease",
          }}
        >
          {/* Silent drop — no overlay text, no centered card. The whole
              widget accepts files. The dragOver outline (set on the parent)
              is the only feedback while dragging. */}
          {turns.length === 0 && (
            <div className="chat-rail-empty">
              Ask Comeketo Agent anything. Replies sediment into the bedrock via the reflection layer.
            </div>
          )}
          {turns.map((t, i) => {
            const mine = t.role === "user";
            const sys  = t.role === "system";
            // Turn content is either a string (legacy / assistant replies)
            // or an array of parts [{type:"text",text},{type:"image",url,...}]
            // when the user attached images. Split so rendering stays safe.
            const parts  = Array.isArray(t.content) ? t.content : null;
            const text   = parts ? parts.filter(p => p.type === "text").map(p => p.text || "").join("\n").trim()
                                 : (typeof t.content === "string" ? t.content : "");
            const images = parts ? parts.filter(p => p.type === "image") : [];
            return (
              <div key={i} className={"chat-rail-turn " + (mine ? "me" : sys ? "sys" : "ai")}>
                <div style={{display:"flex", flexDirection:"column", gap:4, alignItems: mine ? "flex-end" : "flex-start", maxWidth:"88%"}}>
                  {images.length > 0 && (
                    <div style={{display:"flex", flexWrap:"wrap", gap:4, justifyContent: mine ? "flex-end" : "flex-start"}}>
                      {images.map((img, j) => (
                        <a key={j} href={img.url} target="_blank" rel="noopener">
                          <img src={img.url} alt={img.name || "attachment"}
                            style={{maxWidth:140, maxHeight:100, objectFit:"cover", borderRadius:6, border:"1px solid var(--rule-2)", display:"block"}}
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  {text && (
                    mine || sys
                      ? <div className="chat-rail-bubble">{text}</div>
                      : <Markdown text={text} className="chat-rail-bubble chat-md"/>
                  )}
                  {!mine && !sys && text && (
                    <button
                      className="chat-footnote"
                      onClick={() => sendToDelegations(text)}
                      title="Send this response to Delegations"
                      style={{alignSelf:"flex-start"}}
                    >
                      <span className="marker">·</span>
                      <Icon name="terminal" size={11}/>
                      <span>send to delegations</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {busy && (
            <div className="chat-rail-turn ai">
              {/* Animated trace — populated by gpt-5.4-mini preprocess when
                  prompt-enhance is on (Settings → Chat intelligence). Falls
                  back to a generic rotating deck when off. */}
              {window.ThinkingTrace
                ? <window.ThinkingTrace busy={busy} chatId={activeId} />
                : <div className="chat-rail-bubble" style={{fontStyle:"italic", color:"var(--ink-4)"}}>thinking…</div>}
            </div>
          )}
        </div>

        {attachments.length > 0 && (
          <div style={{display:"flex", gap:6, flexWrap:"wrap", padding:"10px 12px 0"}}>
            {attachments.map((a, i) => {
              const isImage = a.mime && a.mime.startsWith("image/");
              const fname = a.original_filename || a.filename || "file";
              const ext = (fname.split(".").pop() || "").toLowerCase().slice(0, 5) || "file";
              const kb = a.size ? (a.size < 1024 ? a.size + "b" : a.size < 1024*1024 ? Math.round(a.size/1024) + "kb" : (a.size/1024/1024).toFixed(1) + "mb") : "";
              const TYPE_TONE = {
                pdf:  { bg: "var(--rose-bg)",  ink: "var(--rose-ink)"  },
                csv:  { bg: "var(--mint-bg)",  ink: "var(--mint-ink)"  },
                tsv:  { bg: "var(--mint-bg)",  ink: "var(--mint-ink)"  },
                xlsx: { bg: "var(--mint-bg)",  ink: "var(--mint-ink)"  },
                json: { bg: "var(--lav-bg)",   ink: "var(--lav-ink)"   },
                jsonl:{ bg: "var(--lav-bg)",   ink: "var(--lav-ink)"   },
                yaml: { bg: "var(--lav-bg)",   ink: "var(--lav-ink)"   },
                yml:  { bg: "var(--lav-bg)",   ink: "var(--lav-ink)"   },
                md:   { bg: "var(--peach-bg)", ink: "var(--peach-ink)" },
                txt:  { bg: "var(--peach-bg)", ink: "var(--peach-ink)" },
                log:  { bg: "var(--peach-bg)", ink: "var(--peach-ink)" },
                docx: { bg: "var(--sky-bg)",   ink: "var(--sky-ink)"   },
                js:   { bg: "var(--lemon-bg)", ink: "var(--lemon-ink)" },
                jsx:  { bg: "var(--lemon-bg)", ink: "var(--lemon-ink)" },
                ts:   { bg: "var(--lemon-bg)", ink: "var(--lemon-ink)" },
                tsx:  { bg: "var(--lemon-bg)", ink: "var(--lemon-ink)" },
                py:   { bg: "var(--lemon-bg)", ink: "var(--lemon-ink)" },
              };
              const tone = TYPE_TONE[ext] || { bg: "var(--paper-2)", ink: "var(--ink-3)" };
              return (
                <div key={i} style={{position:"relative"}} title={`${fname}${kb ? " · " + kb : ""}`}>
                  {isImage ? (
                    <img src={a.url} alt={fname}
                      style={{width:48, height:48, objectFit:"cover", borderRadius:5, border:"1px solid var(--rule-2)", display:"block"}}
                    />
                  ) : (
                    <div style={{
                      width:48, height:48, borderRadius:5, border:"1px solid var(--rule-2)",
                      background: tone.bg, color: tone.ink,
                      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                      padding:"3px", overflow:"hidden",
                      boxShadow:"inset 0 1px 0 rgba(255,255,255,0.4)",
                    }}>
                      <div style={{fontFamily:"var(--font-mono)", fontSize:9, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase", lineHeight:1}}>
                        {ext}
                      </div>
                      <div style={{
                        fontFamily:"var(--font-body)", fontSize:8, marginTop:2,
                        opacity:0.85, lineHeight:1.1, textAlign:"center",
                        overflow:"hidden", display:"-webkit-box",
                        WebkitLineClamp:2, WebkitBoxOrient:"vertical", maxWidth:42,
                      }}>
                        {fname.replace(new RegExp("\\." + ext + "$", "i"), "").slice(0, 16)}
                      </div>
                    </div>
                  )}
                  <button onClick={() => removeAttachment(i)}
                    title="Remove"
                    style={{position:"absolute", top:-5, right:-5, width:15, height:15, borderRadius:"50%", border:"1px solid var(--rule-2)", background:"var(--paper)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, color:"var(--ink-3)"}}
                  >
                    <Icon name="x" size={8}/>
                  </button>
                </div>
              );
            })}
            {uploading && <div style={{alignSelf:"center", fontSize:9, color:"var(--ink-4)", fontFamily:"var(--font-mono)", letterSpacing:"0.04em"}}>uploading…</div>}
          </div>
        )}

        {/* Connector quick-tags — 2026-04-28 Phase 1.
            Click inserts an @<connector> token at the end of the draft so the
            chat agent (and the future MCP routing layer) knows the user wants
            this turn's intent routed to that surface. Phase 2 will wire these
            to actual MCP send actions. */}
        <div className="chat-rail-connectors" style={{
          display:"flex", gap:6, padding:"8px 12px 0", alignItems:"center",
          fontSize:11, color:"var(--ink-3)", letterSpacing:"0.02em",
        }}>
          <span style={{fontFamily:"var(--font-mono)", textTransform:"uppercase", fontSize:9, opacity:0.7}}>route via</span>
          {[
            { tag: "@slack",   icon: "slack",          title: "Slack — tag this turn for Slack routing" },
            { tag: "@github",  icon: "git-branch",     title: "GitHub — tag this turn for repo work" },
            { tag: "@close",   icon: "target",         title: "Close — tag this turn for CRM action" },
            { tag: "@clickup", icon: "clipboard-list", title: "ClickUp — tag this turn for task creation" },
          ].map(c => {
            const active = draft.includes(c.tag);
            return (
              <button
                key={c.tag}
                onClick={() => {
                  setDraft(d => {
                    if (d.includes(c.tag)) return d.replace(new RegExp("\\s*" + c.tag + "\\s*", "g"), " ").trim();
                    return (d ? d.trimEnd() + " " : "") + c.tag + " ";
                  });
                }}
                title={c.title}
                style={{
                  background: active ? "var(--paper-2)" : "transparent",
                  border: "1px solid " + (active ? "var(--ink-3)" : "var(--rule)"),
                  borderRadius:"50%", width:26, height:26, cursor:"pointer",
                  display:"inline-flex", alignItems:"center", justifyContent:"center",
                  color: active ? "var(--ink-1)" : "var(--ink-3)", padding:0,
                  transition:"all 120ms ease",
                }}
              >
                <Icon name={c.icon} size={11}/>
              </button>
            );
          })}
        </div>

        <div className="chat-rail-input">
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            title="Attach a file (image, PDF, CSV, JSON, text, code — 25MB max)"
            style={{
              background:"transparent", border:"1px solid var(--rule)",
              borderRadius:"50%", width:32, height:32, cursor:"pointer",
              display:"inline-flex", alignItems:"center", justifyContent:"center",
              color:"var(--ink-3)", flexShrink:0, padding:0,
              alignSelf:"end", marginBottom:6,
            }}
          >
            <Icon name="plus" size={13}/>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf,text/*,application/json,application/x-yaml,application/xml,.csv,.tsv,.md,.markdown,.log,.yaml,.yml,.toml,.env,.js,.jsx,.ts,.tsx,.py,.rb,.go,.rs,.java,.kt,.swift,.c,.cpp,.h,.hpp,.cs,.php,.sh,.sql,.html,.htm,.xml,.docx,.xlsx,.pptx,.zip"
            multiple
            style={{display:"none"}}
            onChange={(e) => { ingestFiles(e.target.files); e.target.value = ""; }}
          />
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onPaste={onPaste}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); send(); } }}
            placeholder="Message Comeketo Agent. ⌘/Ctrl+Enter."
            rows={2}
          />
          <button className="btn primary" onClick={send} disabled={(!draft.trim() && attachments.length === 0) || busy} title="Send">
            <Icon name="send" size={13}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// FrontPage — new home surface (Phase 4).
// Replaces the bare <Grid/> + optional <ChatRail/> pair. Adds:
//   • TeachingStrip (greeting + instructional line + generation metadata)
//   • Breadcrumb (axis glyphs show coordinate history)
//   • NOW / LATER labeled rows (01–03 / 04–06) with decision-shaped cards
//   • Binary-dichotomy refinement flow (inline zoom → 2 axes → 2×2 children)
//   • Persistent 380px chat rail on the right (bottom drawer below 1100px)
// Existing <Grid/> is preserved for fallback + any other caller.
// ───────────────────────────────────────────────────────────────────────────

// Classify a cell into the decision-shape type taxonomy.
function classifyCardType(cell) {
  if (!cell) return "candidate";
  if (cell.kind === "hybrid") return "hybrid";
  const h = (cell.headline || "").toLowerCase();
  const p = (cell.preview || "").toLowerCase();
  const blob = h + " " + p;
  if (/\b(urgent|blocker|broken|stuck|overdue|past due|stalled|blocked)\b/.test(blob)) return "blocker";
  if (cell.seed && cell.seed.source_type === "project_blocker") return "blocker";
  if (cell.seed && cell.seed.source_type === "north_star_anchor") return "north-star";
  if (/\b(north star|big bet|this week|ship|launch|close)\b/.test(blob)) return "north-star";
  if (cell.predicted) return "predicted";
  return "candidate";
}

function timeOfDayGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return "Still up, Jake";
  if (h < 12) return "Good morning, Jake";
  if (h < 17) return "Good afternoon, Jake";
  if (h < 21) return "Good evening, Jake";
  return "Late shift, Jake";
}

function gridGeneratedAgoLabel(grid) {
  // Grids may not carry a timestamp in the static bedrock; fall back politely.
  const ts = grid && (grid._generated_at || grid.generated_at);
  if (!ts) return "fresh from bedrock";
  const ms = Date.now() - new Date(ts).getTime();
  if (isNaN(ms)) return "fresh from bedrock";
  const m = Math.max(0, Math.floor(ms / 60000));
  if (m < 1)  return "generated moments ago";
  if (m < 60) return "generated " + m + " min ago";
  const h = Math.floor(m / 60);
  if (h < 24) return "generated " + h + "h ago";
  return "generated " + Math.floor(h/24) + "d ago";
}

function seedSourceSummary(grid) {
  const cells = grid && grid.cells ? Object.values(grid.cells) : [];
  const tally = {};
  for (const c of cells) {
    if (c && c.seed && c.seed.source_type) {
      tally[c.seed.source_type] = (tally[c.seed.source_type] || 0) + 1;
    }
  }
  const parts = Object.entries(tally).map(([k, n]) => n + " " + seedTypeLabel(k));
  return parts.length ? parts.join(" · ") : "6 candidates";
}

// ───── Axis packs — two dichotomies per card type.
// These become the refinement questions. Pole wording is deliberately terse.
function axisPackFor(type) {
  switch (type) {
    case "blocker":
      return [
        { a: "unblock solo", b: "ask for help" },
        { a: "quick patch",  b: "root cause" },
      ];
    case "north-star":
      return [
        { a: "move one step",  b: "reset the frame" },
        { a: "alone · deep",   b: "with a partner" },
      ];
    case "predicted":
      return [
        { a: "accept · ship",  b: "probe · edit" },
        { a: "today",          b: "end of week" },
      ];
    case "hybrid":
      return [
        { a: "side A first",   b: "side B first" },
        { a: "quick signal",   b: "slow depth" },
      ];
    default:
      return [
        { a: "quick signal",   b: "deep work" },
        { a: "solo",           b: "with others" },
      ];
  }
}

// Synthesize the 4 child-card titles from the parent + axis placements.
// position 0..1 on each axis; placement picks which pole wins in this quadrant.
function synthesizeChildren(parent, axes, positions) {
  // Normalize positions into 4 quadrants: LL, LR, UL, UR around (0.5, 0.5).
  // Actually we already hold 2 positions (pA, pB); they point to the user's current placement.
  // We *spread* around that placement — each of the 4 quadrants flips one dial to the opposite end.
  const [pA, pB] = positions;
  const poleA = (p) => p >= 0.5 ? axes[0].b : axes[0].a;
  const poleB = (p) => p >= 0.5 ? axes[1].b : axes[1].a;
  const verb = (parent.headline || "this").replace(/\.+$/, "");
  const mk = (a, b, corner) => ({
    id: "child-" + corner,
    headline: verb + " — " + a + " · " + b,
    preview: "Quadrant " + corner + ": leaning " + a + " on the first axis, " + b + " on the second. Commit to run this lens; refine to drill further.",
    kind: "candidate",
    predicted: false,
    seed: parent.seed || null,
    commit: { kind: "child_commit", label: "Commit · " + a + " × " + b },
    _axisCoord: { axes, positions: [pA, pB], corner },
  });
  return [
    mk(axes[0].a, axes[1].a, "LL"),
    mk(axes[0].b, axes[1].a, "LR"),
    mk(axes[0].a, axes[1].b, "UL"),
    mk(axes[0].b, axes[1].b, "UR"),
  ];
}

// Decision-shaped card.
function FpCard({ id, cell, type, onClick, onRefine, zoomed, faded, placeholder, showRefineButton }) {
  if (placeholder || !cell) {
    return (
      <div className="fp-card placeholder" data-type="candidate" aria-disabled="true">
        <span className="fp-card-accent" />
        <div className="fp-card-type">empty</div>
        <div className="fp-card-title">—</div>
        <div className="fp-stake">Sweep didn't fill this slot. Click Generate to refresh the grid.</div>
      </div>
    );
  }
  const cls = "fp-card" + (zoomed ? " zoomed" : "") + (faded ? " fade-zoom" : "");
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick && onClick(e); }
    if (e.key === "r" && e.shiftKey) { e.preventDefault(); onRefine && onRefine(); }
  };
  return (
    <button
      className={cls}
      data-type={type}
      onClick={onClick}
      onKeyDown={onKey}
      aria-label={type + ": " + (cell.headline || "")}
    >
      <span className="fp-card-accent" />
      <div className="fp-card-type">{(type || "candidate").replace("-", " ")}</div>
      <div className="fp-card-title">{cell.headline}</div>
      <div className="fp-stake">{cell.preview}</div>
      <div className="fp-meta">
        {cell.seed && <span><span className="meta-dot" /> {seedTypeLabel(cell.seed.source_type)}</span>}
        {cell.predicted && <span><span className="meta-dot strong" /> predicted</span>}
        {cell.commit && cell.commit.kind && <span>{cell.commit.kind}</span>}
        {showRefineButton && (
          <span
            role="button" tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onRefine && onRefine(); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); onRefine && onRefine(); } }}
            style={{marginLeft:"auto", cursor:"pointer", color:"var(--event-generate)", fontWeight:600}}
            title="Refine by binary-dichotomy axes"
          >refine →</span>
        )}
      </div>
    </button>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// BriefingIdea — a quiet, click-to-discuss list row (Apr 2026 v2).
//
// The tray's whole job is to hand Rodbot 4–5 talking points. Click → the
// title goes into the chat and Rodbot picks it up. No tapped state, no
// kind eyebrow, no subtitle, no refine button. Just the concept.
//
// The accent is a 6px dot on the left, color-coded by which briefing
// section the item came from (today / watch / question). Quiet variety,
// no shouting.
// ───────────────────────────────────────────────────────────────────────────
function BriefingIdea({ id, title, accent, sent, onPick, disabled }) {
  const click = () => { if (!disabled && onPick) onPick(id); };
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); click(); }
  };
  return (
    <div
      className={"briefing-idea" + (sent ? " sent" : "") + (disabled ? " disabled" : "")}
      data-accent={accent || "neutral"}
      role="button"
      tabIndex={0}
      onClick={click}
      onKeyDown={onKey}
      aria-label={"discuss: " + (title || "")}
    >
      <span className="bi-dot" />
      <span className="bi-title">{title || "—"}</span>
    </div>
  );
}

// extractBulletsFromReply — pull a list of candidate blocks out of an AI
// reply. Handles "1. Title. Rest." / "- Title. Rest." / "**Title.** Rest."
// Returns [{ title, subtitle }]. Keeps titles short (≤80 chars) so they fit
// the tray. Skips content too short to be a real idea.
function extractBulletsFromReply(text) {
  if (!text || typeof text !== "string") return [];
  const lines = text.split(/\r?\n/);
  const bullets = [];
  let current = null;
  const flush = () => { if (current && current.body.trim().length >= 12) bullets.push(current); current = null; };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    const num = line.match(/^\s*\d+[.)]\s+(.+)$/);
    const bul = line.match(/^\s*[-*•]\s+(.+)$/);
    if (num)        { flush(); current = { body: num[1] }; }
    else if (bul)   { flush(); current = { body: bul[1] }; }
    else if (current && line.trim() && !line.match(/^\s*#/)) {
      current.body += " " + line.trim();
    } else if (!line.trim()) {
      flush();
    }
  }
  flush();
  return bullets.map(b => {
    const body = b.body.trim();
    // "**Title.** rest" → bold title + rest as subtitle
    const bold = body.match(/^\*\*([^*]+?)\*\*[\s.:\-—]*(.*)$/);
    if (bold) return { title: bold[1].trim().replace(/[.:]\s*$/, ""), subtitle: bold[2].trim() };
    // "Title. rest" → first sentence is title, rest is subtitle (if first fits)
    const sent = body.match(/^([^.?!]{4,80}[.?!])\s*(.*)$/);
    if (sent) return { title: sent[1].replace(/[.?!]\s*$/, "").trim(), subtitle: sent[2].trim() };
    return { title: body.length > 80 ? body.slice(0, 77) + "…" : body, subtitle: "" };
  });
}

// IDEAS_CACHE_PREFIX — localStorage key. Curated AI titles are pinned to the
// briefing's slug so we don't re-spend tokens on the same briefing.
const IDEAS_CACHE_PREFIX = "comeketo.briefingIdeas.";

// readCachedIdeas / writeCachedIdeas — small JSON cache keyed by briefing slug.
function readCachedIdeas(slug) {
  if (!slug) return null;
  try {
    const raw = localStorage.getItem(IDEAS_CACHE_PREFIX + slug);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.ideas)) return parsed.ideas;
    return null;
  } catch { return null; }
}
function writeCachedIdeas(slug, ideas) {
  if (!slug || !Array.isArray(ideas)) return;
  try {
    localStorage.setItem(IDEAS_CACHE_PREFIX + slug, JSON.stringify({ ideas, ts: Date.now() }));
  } catch {}
}

// curateBriefingIdeasViaAI — pass the briefing through Rodbot and ask for
// 4–5 punchy, retitled concepts. Returns [{title, accent}] or null on
// failure (caller falls back to regex extraction).
async function curateBriefingIdeasViaAI(body) {
  if (!body || typeof body !== "string") return null;
  const AI = window.SecretaryAI;
  if (!AI || !AI.ask) return null;
  const instructions = [
    "You are Rodbot curating today's briefing for Jake.",
    "Pick the 4–5 highest-signal concepts the team should discuss now.",
    "Rewrite each as a short, punchy concept title — 3–7 words, no period, no quotes.",
    "Drop numbers/percentages from the title (those live in the conversation, not the cue).",
    "Tag each with its briefing section: 'today' (needs you today), 'watch' (watch list), 'question' (open questions).",
    "OUTPUT FORMAT — strict JSON only, no preamble, no fence, no commentary:",
    '{"ideas":[{"title":"<title>","accent":"today"|"watch"|"question"}, ...]}',
  ].join(" ");
  const prompt = `BRIEFING:\n\n${body.slice(0, 6000)}`;
  try {
    const text = await AI.ask(prompt, { instructions, register: "terse", timeout: 30000 });
    if (!text) return null;
    // Strip code fences if the model added them anyway.
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const parsed = JSON.parse(clean);
    if (!parsed || !Array.isArray(parsed.ideas)) return null;
    const accents = new Set(["today", "watch", "question"]);
    const ideas = parsed.ideas
      .map((it, i) => {
        const title = String(it.title || "").trim().replace(/[.?!]\s*$/, "");
        const accent = accents.has(it.accent) ? it.accent : "today";
        if (title.length < 4 || title.length > 90) return null;
        return { id: `ai_${accent}_${i}`, title, accent };
      })
      .filter(Boolean)
      .slice(0, 5);
    return ideas.length > 0 ? ideas : null;
  } catch (e) {
    console.warn("curateBriefingIdeasViaAI failed:", e && e.message);
    return null;
  }
}

// extractBriefingIdeas — parse the daily briefing markdown and return up to
// five short, clickable concepts. Pulls bold-prefixed bullets from "What
// needs you today" and "Watch list" sections (the two highest-signal lists
// in every briefing). Falls back to all bold bullets if the section
// headings aren't found.
//
// This is the FAST PATH — runs synchronously, used for first paint and as a
// fallback when AI curation isn't available.
//
// Returns: [{ id, title, accent }] capped at 5.
//   accent ∈ "today" (peach) | "watch" (sage) | "question" (lemon) | "neutral"
function extractBriefingIdeas(body) {
  if (!body || typeof body !== "string") return [];
  const lines = body.split(/\r?\n/);
  const ideas = [];
  let section = null; // "today" | "watch" | "question" | null
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    // Section detection — match the H2 headings we know.
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      const t = h2[1].toLowerCase();
      if (/needs you today|needs the team today/.test(t))   section = "today";
      else if (/watch list/.test(t))                         section = "watch";
      else if (/open questions/.test(t))                     section = "question";
      else                                                   section = null;
      continue;
    }
    if (!section) continue;
    // Bullet match.
    const bul = line.match(/^[-*•]\s+(.+)$/);
    const num = line.match(/^\d+[.)]\s+(.+)$/);
    const body = bul ? bul[1] : (num ? num[1] : null);
    if (!body) continue;
    // Prefer bold-prefixed titles; otherwise take the first sentence.
    const bold = body.match(/^\*\*([^*]+?)\*\*[\s.:\-—]*/);
    let title = "";
    if (bold) {
      title = bold[1].trim().replace(/[.:]\s*$/, "");
    } else {
      const sent = body.match(/^([^.?!]{6,90}[.?!])/);
      title = (sent ? sent[1] : body).replace(/[.?!]\s*$/, "").trim();
      // Strip markdown emphasis.
      title = title.replace(/\*\*/g, "").replace(/__/g, "").replace(/`/g, "");
    }
    if (title.length < 6) continue;
    if (title.length > 90) title = title.slice(0, 87) + "…";
    ideas.push({
      id: `brief_${section}_${ideas.length}_${title.length}`,
      title,
      accent: section,
    });
    if (ideas.length >= 8) break; // small safety cap; we trim to 5 below
  }
  return ideas.slice(0, 5);
}

//
// Voice: if Web Speech API is available, the 🎙 button toggles continuous
// dictation — appending into the textarea. Quietly hidden if unsupported.
// IdeasTray — flat 5-row list of briefing-derived ideas. Click → chat.
// No sections, no chips, no refine. The chat is the work; this is the cue.
function IdeasTray({ ideas, sentId, onPick, onSweep, canSweep, aiBusy }) {
  return (
    <div className="ideas-tray">
      <div className="ideas-tray-header">
        <div className="ideas-tray-title">Ideas</div>
        <button
          className="ideas-tray-sweep"
          onClick={onSweep}
          disabled={!canSweep || aiBusy}
          title="Re-pull ideas from today's briefing"
        >
          {aiBusy ? "sweeping…" : "sweep"}
        </button>
      </div>
      {(!ideas || ideas.length === 0) ? (
        <div className="ideas-tray-empty">
          No briefing yet today. Run the morning sweep — or click Briefing above to write one.
        </div>
      ) : (
        <>
          <div className="ideas-tray-list">
            {ideas.map(idea => (
              <BriefingIdea
                key={idea.id}
                id={idea.id}
                title={idea.title}
                accent={idea.accent}
                sent={sentId === idea.id}
                onPick={onPick}
              />
            ))}
          </div>
          <div className="ideas-tray-foot">click an idea — Rodbot picks it up in chat.</div>
        </>
      )}
    </div>
  );
}

// Two-handle axis track with poles.
function AxisSlider({ axis, position, onChange, accent }) {
  const trackRef = useRef(null);
  const dragging = useRef(false);
  const updateFromEvent = (e) => {
    const t = trackRef.current; if (!t) return;
    const r = t.getBoundingClientRect();
    const clientX = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX);
    const x = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    onChange(x);
  };
  useEffect(() => {
    const move = (e) => { if (dragging.current) updateFromEvent(e); };
    const up = () => { dragging.current = false; };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", up);
    };
  }, []);
  const aActive = position < 0.5;
  const bActive = position >= 0.5;
  return (
    <div className="fp-axis">
      <div className={"fp-axis-pole left" + (aActive ? " active" : "")}>{axis.a}</div>
      <div
        className="fp-axis-track"
        ref={trackRef}
        onMouseDown={(e) => { dragging.current = true; updateFromEvent(e); }}
        onTouchStart={(e) => { dragging.current = true; updateFromEvent(e); }}
        onClick={updateFromEvent}
      >
        <div className="fill" style={{width: (position * 100) + "%"}} />
        <div className="handle" style={{left: (position * 100) + "%", background: accent || "var(--event-generate)"}} />
      </div>
      <div className={"fp-axis-pole right" + (bActive ? " active" : "")}>{axis.b}</div>
    </div>
  );
}

// Refinement panel — rendered inside the zoomed parent card.
function FpRefinement({ parent, axes, positions, onChange, onSpread, onCancel }) {
  return (
    <div className="fp-refine-zone">
      <div className="fp-refine-head">
        <span>refine · axes</span>
        <span className="prompt">Which way does this want to lean?</span>
      </div>
      <AxisSlider axis={axes[0]} position={positions[0]} onChange={(v) => onChange(0, v)} />
      <AxisSlider axis={axes[1]} position={positions[1]} onChange={(v) => onChange(1, v)} />
      <div className="fp-refine-actions">
        <button className="btn ghost" onClick={onCancel}>cancel</button>
        <button className="btn primary" onClick={onSpread}>spread → 4 children</button>
      </div>
    </div>
  );
}

// Breadcrumb — axis glyphs show the coordinate chain.
function FpBreadcrumb({ rootLabel, trail, onJump, onHome }) {
  return (
    <div className="fp-breadcrumb">
      <button className="fp-breadcrumb-item root" onClick={onHome} title="Back to grid">{rootLabel}</button>
      {trail.map((step, i) => {
        const isLast = i === trail.length - 1;
        return (
          <React.Fragment key={i}>
            <span className="fp-breadcrumb-sep">›</span>
            <button
              className={"fp-breadcrumb-item" + (isLast ? " active" : "")}
              onClick={() => onJump(i)}
              title={"axes: " + step.axes.map(a => a.a + "↔" + a.b).join(" · ") + " · pos: " + step.positions.map(p => p.toFixed(2)).join(", ")}
            >
              <span className="fp-breadcrumb-glyph">
                <span className="axis-bar"><span className="dot" style={{left: (step.positions[0]*100) + "%"}} /></span>
                <span className="axis-bar"><span className="dot" style={{left: (step.positions[1]*100) + "%"}} /></span>
              </span>
              {step.label || ("step " + (i + 1))}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function TeachingStrip({ greeting, instruct, meta }) {
  return (
    <div className="fp-teaching">
      <div className="fp-teaching-greeting">{greeting}</div>
      <div className="fp-teaching-instruct">{instruct}</div>
      <div className="fp-teaching-meta">{meta}</div>
    </div>
  );
}

function FrontPage(props) {
  const {
    grid, onCellOpen, onSweep, onFrameReject, aiBusy, canGenerate, aiConfigured,
    historyDepth, onGenerate, onBack, onOpenSettings, go,
  } = props;

  // Refinement state: null = grid mode; otherwise { cellId, type, axes, positions, children }
  // Preserved for ChoiceBlock.refine — legacy binary-dichotomy flow can still
  // open if we wire it later. The new ideas layout doesn't use it by default.
  const [refineState, setRefineState] = useState(null);
  // Coordinate trail — each step is { label, axes, positions, parentCellId }
  const [trail, setTrail] = useState([]);
  const [intent, setIntent] = useState("");
  const [arriving, setArriving] = useState(false);
  const lastId = useRef(grid && grid.id);

  // ─── Ideas tray state (Apr 2026 v2 — briefing-sourced) ──────────────────
  // The tray now reads the daily briefing and surfaces 4–5 click-to-discuss
  // talking points. Click → title goes to chat, Rodbot engages on it.
  // No tapped state, no chat-bullet auto-extraction, no per-cell coupling.
  const [ideas, setIdeas] = useState([]);
  const [sentId, setSentId] = useState(null);
  // sweepNowRef holds the latest force-refresh closure so the sweep button
  // can re-run AI curation against the current briefing.
  const sweepNowRef = useRef(null);
  const aiCuratingRef = useRef(false);

  useEffect(() => {
    if (!grid) return;
    if (lastId.current !== grid.id) {
      lastId.current = grid.id;
      setArriving(true);
      const t = setTimeout(() => setArriving(false), 280);
      return () => clearTimeout(t);
    }
  }, [grid && grid.id]);

  // Pull ideas from the daily briefing. Two-phase load:
  //   1. Fast path: regex-extracted bullets for instant first paint.
  //   2. AI pass:  Rodbot picks the highest-signal items and retitles them.
  //                Result is cached per briefing slug — only re-spent on a
  //                new briefing or a forced sweep.
  // MissionControl loads asynchronously, so we read whatever's there now AND
  // listen for the loaded event.
  useEffect(() => {
    const pullFromBriefing = async (forceAI = false) => {
      const mc = window.MissionControl;
      const briefing = mc && mc.dailyBriefing;
      const body = briefing && briefing.body;
      const slug = briefing && briefing.slug;
      if (!body) { setIdeas([]); return; }

      // Phase 1 — cached AI titles win if they exist (instant + clean).
      const cached = forceAI ? null : readCachedIdeas(slug);
      if (cached && cached.length > 0) {
        setIdeas(cached);
        return;
      }

      // Phase 2 — show regex-extracted titles as a placeholder while AI runs.
      const fallback = extractBriefingIdeas(body);
      setIdeas(fallback);

      if (aiCuratingRef.current) return;
      aiCuratingRef.current = true;
      try {
        const curated = await curateBriefingIdeasViaAI(body);
        if (curated && curated.length > 0) {
          writeCachedIdeas(slug, curated);
          setIdeas(curated);
        }
      } finally {
        aiCuratingRef.current = false;
      }
    };
    pullFromBriefing();
    sweepNowRef.current = () => pullFromBriefing(true);
    const onLoaded = () => pullFromBriefing();
    window.addEventListener("missioncontrol:loaded", onLoaded);
    // Also re-pull when the page regains focus (briefing may have refreshed).
    const onFocus = () => pullFromBriefing();
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("missioncontrol:loaded", onLoaded);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  // ─── Pick handler — single click sends title to chat ────────────────────
  const pickIdea = useCallback((id) => {
    const idea = ideas.find(i => i.id === id);
    if (!idea) return;
    setSentId(id);
    // Brief visual confirmation, then clear.
    setTimeout(() => setSentId(prev => (prev === id ? null : prev)), 1400);

    const CHAT = window.SecretaryChat;
    if (!CHAT) return;
    (async () => {
      let cid = CHAT.activeId && CHAT.activeId();
      if (!cid) {
        const c = CHAT.newChat && CHAT.newChat("Briefing idea");
        cid = c && c.id;
      }
      if (!cid) return;
      const message = `Let's talk about: ${idea.title}`;
      try {
        if (CHAT.send) await CHAT.send({ chatId: cid, text: message });
        else if (CHAT.appendTurn) CHAT.appendTurn(cid, "user", message);
      } catch (e) {
        if (CHAT.appendSystem) CHAT.appendSystem("Pick failed: " + (e && e.message || e));
      }
    })();
  }, [ideas]);

  const sweepNow = useCallback(() => {
    // Force a fresh AI curation pass against the current briefing. If there's
    // no briefing, fall through to the cell-grid generator.
    if (sweepNowRef.current) {
      sweepNowRef.current();
      return;
    }
    if (onGenerate) onGenerate("");
  }, [onGenerate]);

  const ids = ["01", "02", "03", "04", "05", "06"];
  const allCells = ids.map((id) => ({ id, cell: grid && grid.cells ? grid.cells[id] : null }));
  const nowRow = allCells.slice(0, 3);
  const laterRow = allCells.slice(3, 6);
  const filledCount = allCells.filter(c => c.cell).length;

  const startRefine = (id) => {
    const cell = grid.cells[id];
    if (!cell) return;
    const type = classifyCardType(cell);
    const axes = axisPackFor(type);
    setRefineState({
      cellId: id,
      type,
      axes,
      positions: [0.5, 0.5],
      children: null,
    });
  };

  const updatePosition = (idx, val) => {
    setRefineState((s) => {
      if (!s) return s;
      const next = [...s.positions];
      next[idx] = val;
      return { ...s, positions: next };
    });
  };

  const spread = () => {
    setRefineState((s) => {
      if (!s) return s;
      const parentCell = grid.cells[s.cellId];
      const children = synthesizeChildren(parentCell, s.axes, s.positions);
      return { ...s, children };
    });
  };

  const emitCoordinate = (childChosen) => {
    const s = refineState;
    if (!s) return;
    const evt = {
      kind: "coordinate",
      parent_card_id: s.cellId,
      parent_headline: grid.cells[s.cellId] && grid.cells[s.cellId].headline,
      grid_id: grid.id,
      axes: [
        { pole_a: s.axes[0].a, pole_b: s.axes[0].b, position: s.positions[0] },
        { pole_a: s.axes[1].a, pole_b: s.axes[1].b, position: s.positions[1] },
      ],
      child_card_chosen: childChosen,
      timestamp: new Date().toISOString(),
    };
  };

  const commitChild = (child) => {
    const s = refineState;
    if (!s) return;
    emitCoordinate({ id: child.id, corner: child._axisCoord && child._axisCoord.corner, headline: child.headline });

    // Post a confirmation turn in the rail.
    if (window.SecretaryChat && window.SecretaryChat.appendSystem) {
      window.SecretaryChat.appendSystem("Committed: " + child.headline);
    } else if (window.SecretaryChat && window.SecretaryChat.send) {
      // Fallback: soft-echo via send-as-system is not supported; drop silently.
    }

    // Push a trail step and return to grid mode.
    setTrail((t) => [...t, {
      label: (child._axisCoord && child._axisCoord.corner) || "child",
      axes: s.axes, positions: s.positions,
      parentCellId: s.cellId,
    }]);
    setRefineState(null);
  };

  const refineChild = (child) => {
    // Treat the chosen child as a new parent and open its refinement.
    const synthetic = {
      id: child.id,
      headline: child.headline,
      preview: child.preview,
      kind: "candidate",
    };
    // Write the synthetic child back onto the grid in place of parent for this pass.
    const type = classifyCardType(synthetic);
    const axes = axisPackFor(type);
    setRefineState((s) => ({
      cellId: s ? s.cellId : "virtual",
      type, axes, positions: [0.5, 0.5], children: null,
      _virtualParent: synthetic,
    }));
    setTrail((t) => [...t, {
      label: (child._axisCoord && child._axisCoord.corner) || "child",
      axes: (refineState && refineState.axes) || axes,
      positions: (refineState && refineState.positions) || [0.5, 0.5],
      parentCellId: (refineState && refineState.cellId) || null,
    }]);
  };

  const cancelRefine = () => setRefineState(null);

  const homeFromRefine = () => { setRefineState(null); setTrail([]); };
  const jumpTrail = (i) => { setTrail((t) => t.slice(0, i + 1)); setRefineState(null); };

  // Teaching-strip copy — time-sensitive to mode.
  const greeting = timeOfDayGreeting();
  const instruct = "Rodbot pitches ideas on the left. Tap to commit — the chat picks it up.";
  const meta = (grid ? grid.id : "—") + " · " + (grid && grid.frameType ? grid.frameType : "morning frame")
             + " · " + gridGeneratedAgoLabel(grid) + " · " + seedSourceSummary(grid);

  // Cleared-grid state (all 6 slots missing).
  const cleared = filledCount === 0 && !refineState;

  // Render helpers.
  const renderCard = ({ id, cell }) => {
    const type = classifyCardType(cell);
    const zoomed = refineState && refineState.cellId === id;
    const faded  = refineState && refineState.cellId !== id && !refineState.children;
    return (
      <FpCard
        key={id}
        id={id}
        cell={cell}
        type={type}
        zoomed={zoomed}
        faded={faded}
        placeholder={!cell}
        showRefineButton={!!cell && !refineState}
        onClick={() => { if (zoomed) return; if (cell) onCellOpen(id); }}
        onRefine={() => startRefine(id)}
      />
    );
  };

  // Virtual parent card (for drilled refinement) — renders the synthetic child
  // as the zoomed surface.
  const renderVirtualParent = () => {
    const vp = refineState && refineState._virtualParent;
    if (!vp) return null;
    const type = refineState.type;
    return (
      <FpCard
        id="virtual"
        cell={vp}
        type={type}
        zoomed={true}
        faded={false}
        placeholder={false}
        showRefineButton={false}
        onClick={() => {}}
      />
    );
  };

  return (
    <div className="front-viewport ideas-mode" data-arriving={arriving ? "1" : "0"}>
      <div className="fp-head">
        {/* Live Pieces broadcast strip — defined in screens.jsx and exposed
            on window. Falls back to the static greeting when Pieces is
            offline or empty, so the homepage NEVER goes blank. */}
        {window.LivePiecesHeader
          ? <window.LivePiecesHeader greeting={greeting} instruct={instruct} meta={meta} />
          : <TeachingStrip greeting={greeting} instruct={instruct} meta={meta} />}
        <FpBreadcrumb
          rootLabel={"grid · " + (grid ? grid.id : "—")}
          trail={trail}
          onJump={jumpTrail}
          onHome={homeFromRefine}
        />
      </div>
      <div className="fp-body">
        <aside className="fp-tray">
          <IdeasTray
            ideas={ideas}
            sentId={sentId}
            onPick={pickIdea}
            onSweep={sweepNow}
            canSweep={canGenerate}
            aiBusy={aiBusy}
          />
        </aside>
        <main className="fp-chat">
          <ChatRail go={go} gridGenerate={onGenerate} aiBusy={aiBusy} />
        </main>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Design System v1 — shared primitives
   Authored 2026-04-23. Spec: CCAgentindex/knowledge/design_system_v1.md.
   General-purpose. Prefer these over bespoke imitations anywhere in the app.
   ═══════════════════════════════════════════════════════════════════════ */

/* StatusDot — 6px traffic-light tell for card state.
   state: "ready" | "pending" | "fault" | null  (null renders nothing) */
function StatusDot({ state, title }) {
  const MAP = {
    ready:   "var(--state-ready)",
    pending: "var(--state-pending)",
    fault:   "var(--state-fault)",
  };
  if (!state || !MAP[state]) return null;
  const label = title || state;
  return (
    <span
      className="ds-status-dot"
      style={{ background: MAP[state] }}
      title={label}
      aria-label={label}
    />
  );
}

/* IconDisc — circular icon container in an accent-family color.
   accent: "sage" | "dusty-rose" | "lavender" | "pale-blue" | "cream-peach" | "fog" | null */
function IconDisc({ icon, accent, size }) {
  const sz = size || 44;
  const bg = accent ? `var(--accent-${accent})`      : "var(--bg-panel)";
  const fg = accent ? `var(--accent-${accent}-ink)`  : "var(--ink-muted)";
  return (
    <span
      className="ds-icon-disc"
      style={{ width: sz, height: sz, background: bg, color: fg }}
      aria-hidden="true"
    >
      {icon}
    </span>
  );
}

/* DecisionCard — one option in a DecisionGrid. Not meant to be used alone
   outside a DecisionGrid except in special one-off layouts. */
function DecisionCard({ id, title, subtitle, description, icon, accent, dot, selected, disabled, onSelect, compact }) {
  const click = () => { if (!disabled && onSelect) onSelect(id); };
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); click(); }
  };
  const cls = "ds-decision-card"
    + (selected ? " selected" : "")
    + (disabled ? " disabled" : "")
    + (compact  ? " compact"  : "");
  return (
    <div
      className={cls}
      data-accent={accent || ""}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={click}
      onKeyDown={onKey}
      aria-pressed={selected ? "true" : "false"}
      aria-disabled={disabled ? "true" : "false"}
      aria-label={title}
    >
      {dot && <StatusDot state={dot} />}
      {icon && <IconDisc icon={icon} accent={accent} size={compact ? 32 : 44} />}
      <div className="ds-decision-card-body">
        <div className="ds-decision-card-title">{title}</div>
        {subtitle && <div className="ds-decision-card-subtitle">{subtitle}</div>}
        {description && <div className="ds-decision-card-desc">{description}</div>}
      </div>
    </div>
  );
}

/* DecisionGrid — the product's signature interaction.
   Replaces selects, radio groups, and paragraphs-of-choices everywhere.

   options: [{ id, title, subtitle, description, icon, accent, dot, disabled }]
   value:   scalar (single-select) | array (multi-select)
   multi:   boolean — if true, value is an array
   label:   string — renders above the grid in label_chip tier
   compact: boolean — smaller cards, tighter grid
   columns: number — fixed column count; default is auto-fit by card width */
function DecisionGrid({ options, value, onChange, multi, label, compact, columns }) {
  const isSelected = (id) => multi
    ? (Array.isArray(value) && value.includes(id))
    : value === id;
  const onSelect = (id) => {
    if (!onChange) return;
    if (multi) {
      const cur = Array.isArray(value) ? value : [];
      onChange(cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]);
    } else {
      onChange(id);
    }
  };
  const styleVars = columns ? { "--ds-grid-cols": columns } : undefined;
  return (
    <div
      className={"ds-decision-grid" + (compact ? " compact" : "")}
      role={multi ? "group" : "radiogroup"}
      aria-label={label}
      style={styleVars}
    >
      {label && <div className="ds-decision-grid-label">{label}</div>}
      <div className="ds-decision-grid-track">
        {options.map(o => (
          <DecisionCard
            key={o.id}
            id={o.id}
            title={o.title}
            subtitle={o.subtitle}
            description={o.description}
            icon={o.icon}
            accent={o.accent}
            dot={o.dot}
            disabled={o.disabled}
            selected={isSelected(o.id)}
            onSelect={onSelect}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

/* ContextMenu — general-purpose right-click menu. The app-wide replacement
   for bespoke positioned menus. Use together with useContextMenu() for
   zero-ceremony attachment to any element.

   items: [{ label, icon, onClick, danger, disabled, shortcut, divider, keepOpen }]
          divider:true  renders a separator (other fields ignored).
          keepOpen:true leaves the menu mounted after the click — use for
                        items that switch into a sub-mode or show a secondary
                        panel. Default behavior closes the menu on click. */
function ContextMenu({ x, y, items, onClose, title }) {
  const ref = useRef(null);

  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose && onClose(); };
    const onEsc = (e) => { if (e.key === "Escape") onClose && onClose(); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  // Clamp to viewport so menus near the edge don't spill off screen.
  const vw = (typeof window !== "undefined") ? window.innerWidth  : 1280;
  const vh = (typeof window !== "undefined") ? window.innerHeight : 800;
  const rows = items.filter(i => !i.divider).length;
  const estH = rows * 36 + (title ? 32 : 0) + 12;
  const clampX = Math.max(8, Math.min(x, vw - 260));
  const clampY = Math.max(8, Math.min(y, vh - estH));

  return (
    <div ref={ref} className="ds-context-menu" style={{ top: clampY, left: clampX }} role="menu">
      {title && <div className="ds-context-menu-title">{title}</div>}
      {items.map((it, i) => {
        if (it.divider) return <div key={"d"+i} className="ds-context-menu-divider" />;
        const cls = "ds-context-menu-item"
          + (it.danger   ? " danger"   : "")
          + (it.disabled ? " disabled" : "");
        return (
          <button
            key={i}
            className={cls}
            disabled={!!it.disabled}
            role="menuitem"
            onClick={() => {
              if (it.disabled) return;
              if (it.onClick) it.onClick();
              if (!it.keepOpen && onClose) onClose();
            }}
          >
            {it.icon && <span className="ds-context-menu-icon">{it.icon}</span>}
            <span className="ds-context-menu-label">{it.label}</span>
            {it.shortcut && <span className="ds-context-menu-shortcut">{it.shortcut}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* useContextMenu — hook for attaching a right-click menu to any element.
   Returns { onContextMenu, close, render, open }.

   Usage:
     const menu = useContextMenu();
     return (
       <>
         <div onContextMenu={menu.onContextMenu}>clickable object</div>
         {menu.render([
           { label: "Open in Close", icon: "↗", onClick: () => {...} },
           { label: "Draft follow-up", icon: "✎", onClick: () => {...} },
           { divider: true },
           { label: "Delete", icon: "✕", danger: true, onClick: () => {...} },
         ], "Lead — Smith wedding")}
       </>
     );
*/
function useContextMenu() {
  const [state, setState] = useState(null); // { x, y } or null
  const onContextMenu = (e) => {
    e.preventDefault();
    setState({ x: e.clientX, y: e.clientY });
  };
  const close = () => setState(null);
  const render = (items, title) => state
    ? <ContextMenu x={state.x} y={state.y} items={items} title={title} onClose={close} />
    : null;
  return { onContextMenu, close, render, open: !!state };
}

Object.assign(window, {
  Topbar, StatusBar, Grid, FullscreenCell, Rail, ChatRail, Markdown, TweaksPanel,
  FrontPage, FpCard, TeachingStrip, FpBreadcrumb, FpRefinement, AxisSlider,
  classifyCardType, SCREEN_LABELS,
  // Design System v1 primitives
  StatusDot, IconDisc, DecisionCard, DecisionGrid, ContextMenu, useContextMenu,
});

/* Comeketo Agent — screens: Briefing, Draft, Schedule, Settings, Memory, Prediction */

function BriefingScreen({ data, go }) {
  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">briefing · {data.briefing.date} · {data.briefing.time}</div>
          <h1>Good morning, the team. Here’s what’s on the wire.</h1>
        </div>
        <div className="meta">
          <span><b>mode</b> {data.briefing.mode}</span>
          <span><b>domain</b> {data.briefing.domain}</span>
          <span><b>comparator</b> {data.briefing.comparator}</span>
        </div>
      </div>

      <div className="briefing">
        {data.briefing.sweeps.map((s) => (
          <div className="card" key={s.title}>
            <h3>{s.title}<span className="count">{s.count} items</span></h3>
            <ul>
              {s.items.map((it, i) => (
                <li key={i}>
                  <span className="pri">{it.pri}</span>
                  <span>{it.title}<br/><span className="sub">{it.sub}</span></span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{display:"flex", gap:12, alignItems:"center", marginTop: 26, justifyContent:"space-between"}}>
        <div className="mono dim" style={{fontSize:12, maxWidth:560}}>
          Comeketo Agent has queued one decision for you. Tap below to open the grid — it will present seven
          candidate first-moves plus X (sweep) and user (frame-reject).
        </div>
        <div style={{display:"flex", gap:8}}>
          <button className="btn ghost" onClick={() => go.push("memory")}>Review memory</button>
          <button className="go-grid-btn" onClick={() => go.push("grid", { gridId: "morning" })}>
            Open grid <span className="arr">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function DraftScreen({ draft, go, onSend }) {
  const [body, setBody] = useState(draft.body);
  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">draft · composed at refinement depth 3</div>
          <h1>{draft.subject}</h1>
        </div>
        <div className="meta">
          <span><b>to</b> {draft.to}</span>
          <span><b>voice patterns applied</b> {draft.voice.length}</span>
        </div>
      </div>

      <div className="draft-layout">
        <div>
          <div className="draft-paper">
            <div className="draft-meta">
              <span><b>to</b> {draft.to}</span>
              <span><b>subject</b> {draft.subject}</span>
              <span><b>length</b> {body.split(/\s+/).length} words</span>
            </div>
            <textarea
              className="draft-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{width:"100%", minHeight: 320, border: "none", resize: "vertical", background:"transparent", color:"var(--ink)", fontFamily:"var(--font-display)"}}
            />
            <div className="draft-actions">
              <button className="btn primary" onClick={onSend}>Sign &amp; Send — J</button>
              <button className="btn">Refine further</button>
              <button className="btn ghost" onClick={() => go.back()}>← back to grid</button>
              <button className="btn alarm" style={{marginLeft:"auto"}}>Reject draft · log lesson</button>
            </div>
          </div>
        </div>
        <div>
          <div className="panel">
            <header>
              <h3>Why it sounds like you</h3>
              <span className="hint">voice model · live</span>
            </header>
            <div className="voice">
              {draft.voice.map((v, i) => (
                <div className="pattern" key={i}>
                  <span className="tag">{v.tag}</span>
                  {v.text}
                </div>
              ))}
            </div>
            <div className="hairline" />
            <div className="mono dim" style={{fontSize:10.5, lineHeight:1.5}}>
              Every edit you make above is analyzed for style signal. Patterns weight up on repetition,
              decay on contradiction.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleScreen({ schedule, go, onCommit }) {
  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">schedule · hybrid commit</div>
          <h1>{schedule.title}</h1>
        </div>
        <div className="meta">
          <span><b>blocks</b> {schedule.blocks.length}</span>
          <span><b>frame</b> disjunctive → hybrid</span>
        </div>
      </div>
      <div className="draft-layout">
        <div>
          <div className="draft-paper" style={{padding: 0, overflow:"hidden"}}>
            {schedule.blocks.map((b, i) => (
              <div key={i} style={{
                display:"grid", gridTemplateColumns:"140px 1fr auto", gap:16,
                padding:"18px 22px", borderBottom:"1px solid var(--rule)",
                alignItems:"center",
                background: b.tint === "ember" ? "color-mix(in oklab, var(--ember) 7%, var(--paper))" : "var(--paper)"
              }}>
                <div className="mono" style={{color:"var(--ink-3)", fontSize:12}}>{b.time}</div>
                <div style={{fontSize:15}}>{b.label}</div>
                <div className="mono" style={{fontSize:10.5, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.06em"}}>
                  {b.tint === "ember" ? "derivative · from grid" : "standing block"}
                </div>
              </div>
            ))}
            <div style={{padding:"18px 22px", display:"flex", gap:8}}>
              <button className="btn primary" onClick={onCommit}>Commit to calendar</button>
              <button className="btn">Adjust blocks</button>
              <button className="btn ghost" onClick={() => go.back()}>← back to grid</button>
            </div>
          </div>
        </div>
        <div>
          <div className="panel">
            <header><h3>Voice · scheduling</h3><span className="hint">learned patterns</span></header>
            <div className="voice">
              {schedule.voice.map((v, i) => (
                <div className="pattern" key={i}>
                  <span className="tag">{v.tag}</span>{v.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ————— Channel picker (big bubbles) —————
// ─── RodbotMark (§2 of UI polish audit) ──────────────────────────────────
// 12px square monoline glyph — a three-node graph fragment that echoes the
// ratio-lattice / quaternary-ledger visual language from the founder's
// theoretical framework without being literal. Placed next to any artifact
// Rodbot authored or touched, at ~60% opacity so it reads as authorship
// metadata rather than decoration. Inherits currentColor so it tints to the
// surrounding text tone automatically.
function RodbotMark({ size = 12, opacity = 0.6, style }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 12 12"
      fill="none" aria-hidden="true"
      style={{opacity, verticalAlign:"middle", flexShrink:0, ...style}}
    >
      <line x1="3" y1="3.5" x2="9" y2="3.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="3" y1="3.5" x2="6" y2="9" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <line x1="9" y1="3.5" x2="6" y2="9" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" />
      <circle cx="3" cy="3.5" r="1.3" fill="currentColor" />
      <circle cx="9" cy="3.5" r="1.3" fill="currentColor" />
      <circle cx="6" cy="9" r="1.3" fill="currentColor" />
    </svg>
  );
}

// ─── Event-color mapping (§1/§7) ─────────────────────────────────────────
// Maps an audit-event kind string to one of the five semantic event-color
// tokens. Infrastructure writes (delegation_write, *_create, *_update,
// index_update) land on the neutral "edit" — per spec, "this is
// infrastructure, not a gesture." Explicit gesture kinds route to their own
// colors. Returns the CSS-var suffix (commit/open/generate/lean/edit).
function eventColorFor(kind) {
  const k = String(kind || "").toLowerCase();
  if (k === "commit" || k.startsWith("commit_") || k.endsWith("_commit")) return "commit";
  if (k === "open"   || k.startsWith("open_")   || k.endsWith("_open"))   return "open";
  if (k === "generate" || k.includes("generate")) return "generate";
  if (k === "lean"   || k.includes("lean") || k.includes("fail") || k.includes("error")) return "lean";
  return "edit"; // default — any write/update/create/delegation is infrastructure
}

function ChannelPicker({ value, onChange }) {
  const C = window.SecretaryConnectors;
  const [, tick] = useState(0);
  useEffect(() => {
    if (!C) return;
    let mounted = true;
    C.refreshStatus().then(() => mounted && tick(n => n + 1));
    return () => { mounted = false; };
  }, []);
  if (!C) return null;

  // Unified status-dot component with color variants. Same size, same
  // position, same shadow — only the fill color changes per readiness.
  const dotColorFor = (r) => ({
    "ready": "#3a9a58", "always-ready": "#3a9a58",
    "needs-setup": "#c78a2a", "misconfigured": "#b05656",
  }[r] || "#888");
  const dot = (r) => (
    <span style={{
      position:"absolute", top:8, right:8,
      width:8, height:8, borderRadius:"50%",
      background: dotColorFor(r),
      boxShadow: `0 0 0 2px var(--paper-card)`,
    }}/>
  );

  return (
    <div>
      <div style={{fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-4)", marginBottom:8, fontWeight:500}}>Channel</div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(128px, 1fr))", gap:10}}>
        {C.CHANNELS.map(ch => {
          const r = C.readiness(ch.id);
          const sel = value === ch.id;
          const disabled = r === "needs-setup" || r === "misconfigured";
          const accent = ch.accent || "neutral";
          // §4 selected state — presses-in feel: 18% purple fill, 1.5px
          // full-purple border, inset shadow, no outer ring, no lift.
          // Uses --event-generate system-wide for selection regardless of
          // the channel's own accent — "this is the generate-action target."
          return (
            <button
              key={ch.id}
              type="button"
              onClick={() => onChange(ch.id)}
              title={disabled ? C.helpFor(ch.id) : ch.blurb}
              style={{
                position: "relative",
                padding: "16px 12px 14px",
                borderRadius: 14,
                border: sel
                  ? `1.5px solid var(--event-generate)`
                  : "1px solid color-mix(in oklab, var(--ink) 8%, transparent)",
                background: sel
                  ? `color-mix(in oklab, var(--event-generate) 18%, var(--paper-card))`
                  : `linear-gradient(180deg, var(--paper-card-2) 0%, var(--paper-card) 100%)`,
                color: disabled ? "var(--ink-4)" : (sel ? `var(--event-generate)` : "var(--ink)"),
                cursor: "pointer",
                textAlign: "center",
                boxShadow: sel
                  ? `inset 0 2px 0 0 rgba(0,0,0,0.06)`
                  : "0 2px 6px rgba(29,31,39,0.06), inset 0 1px 0 rgba(255,255,255,0.5)",
                transition: "background .15s, border-color .15s, box-shadow .15s",
                transform: "none",
              }}
            >
              {dot(r)}
              <div style={{
                width: 34, height: 34, borderRadius: "50%", margin: "0 auto 8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: sel
                  ? `color-mix(in oklab, var(--event-generate) 22%, transparent)`
                  : `var(--pastel-${accent})`,
                color: sel ? `var(--event-generate)` : `var(--pastel-${accent}-ink)`,
              }}>
                <Icon name={ch.icon} size={18}/>
              </div>
              <div style={{fontSize:12, fontWeight:600, letterSpacing:"0.02em"}}>{ch.label}</div>
              {/* §4 min-height: reserve two lines so one-line blurbs don't
                  float cards at a different baseline than two-line ones.
                  fontSize 10 * lineHeight 1.3 * 2 ≈ 26px. */}
              <div style={{fontSize:10, opacity:0.7, marginTop:3, lineHeight:1.3, minHeight:26}}>{ch.blurb}</div>
            </button>
          );
        })}
      </div>
      {/* §4 Legend — pulled closer to the picker (margin reduced ~40%) so
          it reads as the dot-key for the cards above, not a standalone row. */}
      <div style={{fontSize:10.5, color:"var(--ink-4)", marginTop:5}}>
        <span style={{display:"inline-block", width:7, height:7, borderRadius:"50%", background:dotColorFor("ready"), marginRight:4, verticalAlign:1}}/> ready &nbsp;
        <span style={{display:"inline-block", width:7, height:7, borderRadius:"50%", background:dotColorFor("needs-setup"), marginRight:4, verticalAlign:1}}/> needs setup in .env &nbsp;
        <span style={{display:"inline-block", width:7, height:7, borderRadius:"50%", background:dotColorFor("misconfigured"), marginRight:4, verticalAlign:1}}/> misconfigured
      </div>
    </div>
  );
}

// ————— Channel-aware input hints —————
function targetHintFor(channel) {
  const s = (window.SecretaryConnectors && window.SecretaryConnectors.serverStatus && window.SecretaryConnectors.serverStatus()) || {};
  switch (channel) {
    case "claude_code": return "filesystem path — cwd OR a specific file (.md, .json, .py, …)";
    case "clickup":     return s.clickup_list_name ? `list id (default: "${s.clickup_list_name}")` : "ClickUp list id (leave blank for default)";
    case "slack":       return "channel id or user id (C0123 / U0123)";
    case "email":       return "email address";
    case "whatsapp":    return "phone with country code (e.g. +15551234567)";
    case "sms":         return "phone with country code";
    case "calendar":    return "attendee email(s), comma-separated";
    case "open_url":    return "URL";
    default:            return "optional";
  }
}
function targetPlaceholderFor(channel) {
  switch (channel) {
    case "claude_code": return "/Users/jakeaaron/…  (leave blank for bedrock cwd)";
    case "clickup":     return "(leave blank to use default list)";
    case "slack":       return "#general or C01ABCDEF";
    case "email":       return "you@domain.com";
    case "whatsapp":    return "+15551234567";
    case "sms":         return "+15551234567";
    case "calendar":    return "you@domain.com, another@domain.com";
    case "open_url":    return "https://…";
    default:            return "(optional)";
  }
}

// ————— Commitments (final review + send) —————
function CommitmentsScreen({ commitments, demoMode, onUpdate, onRemove, onSend, onSendAll, onCancel, onRegenerate, go }) {
  const [expandedId, setExpandedId] = useState(null);
  const [edits, setEdits] = useState({}); // { [id]: { subject, body, target } }

  const pending   = commitments.filter(c => c.status === "pending");
  const sending   = commitments.filter(c => c.status === "sending");
  const sent      = commitments.filter(c => c.status === "sent");
  const canceled  = commitments.filter(c => c.status === "canceled" || c.status === "failed");

  const startEdit = (c) => {
    setEdits(e => ({ ...e, [c.id]: { subject: c.subject || "", body: c.body || "", target: c.target || "", channel: c.channel || "note" } }));
    setExpandedId(c.id);
  };
  const saveEdit = (c) => {
    const e = edits[c.id];
    if (!e) return;
    onUpdate(c.id, { subject: e.subject, body: e.body, target: e.target, channel: e.channel });
    setEdits(prev => { const { [c.id]: _drop, ...rest } = prev; return rest; });
  };
  const setEditField = (id, key, val) => {
    setEdits(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [key]: val } }));
  };
  const cancelEdit = (c) => {
    setEdits(prev => { const { [c.id]: _drop, ...rest } = prev; return rest; });
  };

  const fmtTime = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return iso; }
  };

  const KIND_ACCENTS = { send: "sky", schedule: "lavender", open: "mint", open_url: "mint", done: "neutral" };
  const CHANNEL_ACCENTS = { claude_code: "lavender", sms: "sage", whatsapp: "mint", email: "sky", slack: "lavender", calendar: "rose", note: "peach", open_url: "mint", internal: "blush", clickup: "lemon" };

  const kindBadge = (kind) => {
    const accent = KIND_ACCENTS[kind] || "neutral";
    return <span style={{
      background: `var(--pastel-${accent})`, color: `var(--pastel-${accent}-ink)`,
      padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.06em",
    }}>{kind}</span>;
  };

  const channelBadge = (ch) => {
    if (!ch) return null;
    const accent = CHANNEL_ACCENTS[ch] || "neutral";
    const C = window.SecretaryConnectors;
    const chDef = C && C.CHANNELS.find(c => c.id === ch);
    return <span style={{
      background: `var(--pastel-${accent})`, color: `var(--pastel-${accent}-ink)`,
      padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.06em",
      display: "inline-flex", gap: 5, alignItems: "center",
    }}>
      {chDef && <Icon name={chDef.icon} size={11}/>}
      <span>{ch}</span>
    </span>;
  };

  const statusBadge = (status) => {
    const map = {
      pending:  { accent: "peach",    lbl: "pending" },
      sending:  { accent: "sky",      lbl: "sending…" },
      sent:     { accent: "mint",     lbl: "sent" },
      canceled: { accent: "neutral",  lbl: "canceled" },
      failed:   { accent: "rose",     lbl: "failed" },
    };
    const s = map[status] || map.pending;
    return <span style={{
      background: `var(--pastel-${s.accent})`, color: `var(--pastel-${s.accent}-ink)`,
      padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.06em",
    }}>{s.lbl}</span>;
  };

  // Traffic-light dot: gray (pending) · pulsing blue (sending) · green (sent) · red (failed) · dim (canceled).
  const trafficLight = (status) => {
    const map = {
      pending:  { color: "#a8a8a8", pulse: false, title: "queued" },
      sending:  { color: "#4a6ea9", pulse: true,  title: "sending…" },
      sent:     { color: "#3a9a58", pulse: false, title: "sent" },
      failed:   { color: "#b05656", pulse: false, title: "failed" },
      canceled: { color: "#cfcfcf", pulse: false, title: "canceled" },
    };
    const s = map[status] || map.pending;
    return (
      <span title={s.title} style={{
        display: "inline-block",
        width: 14, height: 14, borderRadius: "50%",
        background: s.color,
        boxShadow: `0 0 0 3px color-mix(in oklab, ${s.color} 22%, transparent), 0 0 0 5px color-mix(in oklab, ${s.color} 8%, transparent)`,
        animation: s.pulse ? "traffic-pulse 1.2s ease-in-out infinite" : "none",
      }}/>
    );
  };

  const renderRow = (c) => {
    const rowStatus = c.status;
    return (
      <div key={c.id} style={{
        border: "1px solid var(--rule-2)",
        borderRadius: 10,
        background: "var(--paper-card)",
        boxShadow: "var(--shadow-soft)",
        marginBottom: 10,
        overflow: "hidden",
        transition: "transform .12s, box-shadow .15s, border-color .15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.borderColor = "var(--ink-5)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.borderColor = "var(--rule-2)"; }}
      >
        <div style={{padding:"14px 18px", display:"grid", gridTemplateColumns:"auto auto 1fr auto auto", gap:14, alignItems:"center", cursor:"pointer"}} onClick={() => go.push("commitment_detail", { commitmentId: c.id })}>
          <div style={{paddingLeft:4, paddingRight:4}}>{trafficLight(rowStatus)}</div>
          <div style={{display:"flex", flexDirection:"column", gap:4, alignItems:"flex-start"}}>
            {c.channel ? channelBadge(c.channel) : kindBadge(c.commit && c.commit.kind)}
            {c.drafting && <span style={{background:"color-mix(in oklab, #4a6ea9 20%, var(--paper))", color:"var(--ink-2)", padding:"1px 7px", borderRadius:3, fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em"}}>drafting…</span>}
          </div>
          <div>
            <div style={{fontSize:14, fontWeight:500, color:"var(--ink)"}}>{c.subject || c.source && c.source.headline || "(untitled)"}</div>
            <div style={{fontSize:11, color:"var(--ink-4)", marginTop:3, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontVariantNumeric: "tabular-nums"}}>
              {c.source && `from ${c.source.gridId} · cell ${c.source.cellId} · `}queued {fmtTime(c.createdAt)}
              {c.sentAt && <> · {c.demoSent ? "demo-" : ""}sent {fmtTime(c.sentAt)}</>}
              {c.result && <> · {c.result}</>}
            </div>
          </div>
          <div style={{fontSize:11, color:"var(--ink-4)", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontVariantNumeric: "tabular-nums"}}>
            {c.target && <span>{c.target}</span>}
          </div>
          <div style={{fontSize:10, color:"var(--ink-4)"}}>▶</div>
        </div>

        {false && (
          <div style={{padding:"14px 16px 16px", borderTop:"1px solid var(--rule)", background:"color-mix(in oklab, var(--ink) 2%, var(--paper))"}}>
            {editing ? (
              <div style={{display:"grid", gap:14}}>
                <ChannelPicker
                  value={e.channel || c.channel || "note"}
                  onChange={(ch) => setEditField(c.id, "channel", ch)}
                />
                <label style={{display:"grid", gap:4}}>
                  <span style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-4)"}}>Subject / headline</span>
                  <input type="text" value={e.subject} onChange={ev => setEditField(c.id, "subject", ev.target.value)} style={{padding:"8px 10px", border:"1px solid var(--rule-2)", borderRadius:6, fontSize:13, background:"var(--paper)", color:"var(--ink)", fontFamily:"var(--font-display)"}} />
                </label>
                <label style={{display:"grid", gap:4}}>
                  <span style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-4)"}}>Target · {targetHintFor(e.channel || c.channel || "note")}</span>
                  <input type="text" value={e.target} onChange={ev => setEditField(c.id, "target", ev.target.value)} placeholder={targetPlaceholderFor(e.channel || c.channel || "note")} style={{padding:"8px 10px", border:"1px solid var(--rule-2)", borderRadius:6, fontSize:12, background:"var(--paper)", color:"var(--ink)"}} />
                </label>
                <label style={{display:"grid", gap:4}}>
                  <span style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-4)"}}>Body</span>
                  <textarea value={e.body} onChange={ev => setEditField(c.id, "body", ev.target.value)} rows={8} style={{padding:"10px 12px", border:"1px solid var(--rule-2)", borderRadius:6, fontSize:13, fontFamily:"var(--font-display)", resize:"vertical", background:"var(--paper)", color:"var(--ink)", lineHeight:1.55}} />
                </label>
                <div style={{display:"flex", gap:8}}>
                  <button className="btn primary" onClick={() => saveEdit(c)}>Save edits</button>
                  <button className="btn ghost" onClick={() => cancelEdit(c)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{display:"grid", gap:10}}>
                {c.drafting && (
                  <div style={{fontSize:12, color:"var(--ink-4)", fontStyle:"italic"}}>
                    AI is drafting the actual message for this commit in your voice…
                  </div>
                )}
                {c.draftError && (
                  <div style={{fontSize:12, color:"var(--alarm)"}}>
                    Draft failed: {c.draftError} — try Regenerate.
                  </div>
                )}
                <div style={{fontSize:13, color:"var(--ink-2)", fontFamily:"var(--font-display)", lineHeight:1.6}}>
                  {c.body ? <Markdown text={c.body}/> : <em style={{color:"var(--ink-4)"}}>(no body yet)</em>}
                </div>
                {(c.why_channel || (c.voice_check && c.voice_check.length)) && (
                  <div style={{padding:"10px 12px", background:"color-mix(in oklab, var(--ember) 8%, var(--paper))", border:"1px solid var(--rule)", borderRadius:4, fontSize:11, color:"var(--ink-3)", display:"grid", gap:6}}>
                    {c.why_channel && <div><b style={{color:"var(--ink-2)"}}>Channel:</b> {c.why_channel}</div>}
                    {c.voice_check && c.voice_check.length > 0 && (
                      <div><b style={{color:"var(--ink-2)"}}>Voice check:</b> {c.voice_check.join(" · ")}</div>
                    )}
                  </div>
                )}
                <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
                  {c.status === "pending" && (
                    <React.Fragment>
                      <button className="btn primary" onClick={() => onSend(c.id)} disabled={!!c.drafting}>
                        {demoMode ? "Send (demo · simulated)" : "Send now"}
                      </button>
                      <button className="btn" onClick={() => startEdit(c)} disabled={!!c.drafting}>Edit</button>
                      {onRegenerate && (
                        <button className="btn ghost" onClick={() => onRegenerate(c.id)} disabled={!!c.drafting}>
                          {c.drafting ? "Drafting…" : c.body ? "Regenerate draft" : "Draft with AI"}
                        </button>
                      )}
                      <button className="btn ghost" onClick={() => onCancel(c.id)}>Cancel</button>
                      <button className="btn alarm" style={{marginLeft:"auto"}} onClick={() => onRemove(c.id)}>Delete</button>
                    </React.Fragment>
                  )}
                  {c.status === "failed" && (
                    <React.Fragment>
                      <button className="btn primary" onClick={() => { onUpdate(c.id, { status: "pending", result: null }); }}>Retry (requeue)</button>
                      <button className="btn" onClick={() => startEdit(c)}>Edit</button>
                      {onRegenerate && <button className="btn ghost" onClick={() => onRegenerate(c.id)}>Regenerate draft</button>}
                      <button className="btn ghost" onClick={async () => {
                        if (!window.SecretaryDelegator) return;
                        try {
                          const p = window.SecretaryDelegator.PROMPTS.escalate_commitment(c);
                          await window.SecretaryDelegator.dispatch(p);
                          alert("Escalated to Claude Code — watch the Delegate chip for progress.");
                        } catch (e) { alert("Escalate failed: " + e.message); }
                      }}><Icon name="zap" size={13}/> Escalate</button>
                      <button className="btn alarm" style={{marginLeft:"auto"}} onClick={() => onRemove(c.id)}>Delete</button>
                    </React.Fragment>
                  )}
                  {(c.status === "sent" || c.status === "canceled") && (
                    <button className="btn ghost" onClick={() => onRemove(c.id)}>Remove from list</button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">{t("kicker_commitments")}</div>
          <h1>{t("title_commitments")}</h1>
        </div>
        <div className="meta">
          <span><b>{t("count_pending")}</b> {pending.length}</span>
          <span><b>{t("count_sent")}</b> {sent.length}</span>
          {demoMode && <span style={{color:"#8a6a00"}}><b>demo</b> on</span>}
        </div>
      </div>

      <div style={{display:"flex", gap:8, marginBottom:16, alignItems:"center", flexWrap:"wrap"}}>
        <button className="btn primary" onClick={onSendAll} disabled={!pending.length || sending.length > 0}>
          {demoMode ? `Send all pending (${pending.length}) · demo` : `Send all pending (${pending.length})`}
        </button>
        <button className="btn ghost" onClick={() => go.push("grid", { gridId: "morning" })}>← back to grid</button>
        <div style={{flex:1}}/>
        <span className="mono dim" style={{fontSize:11}}>
          Nothing leaves the app until you press Send{demoMode ? " — even then, demo mode blocks real writes" : ""}.
        </span>
      </div>

      {commitments.length === 0 && (
        <div style={{padding:"40px 18px", textAlign:"center", color:"var(--ink-4)", fontFamily:"var(--font-display)"}}>
          <div style={{fontSize:18, marginBottom:6, color:"var(--ink-3)"}}>No commitments yet.</div>
          <div style={{fontSize:12}}>Open a cell and hit <b>Commit</b> — it lands here for final review.</div>
        </div>
      )}

      {pending.length > 0 && <div style={{fontSize:11, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"6px 4px"}}>Pending</div>}
      {pending.map(renderRow)}
      {sending.length > 0 && <div style={{fontSize:11, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"14px 4px 6px"}}>Sending…</div>}
      {sending.map(renderRow)}
      {sent.length > 0 && <div style={{fontSize:11, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"14px 4px 6px"}}>Sent</div>}
      {sent.map(renderRow)}
      {canceled.length > 0 && <div style={{fontSize:11, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.08em", margin:"14px 4px 6px"}}>Canceled / failed</div>}
      {canceled.map(renderRow)}
    </div>
  );
}

function IntelligencePanel({ tweaks, setTweaks }) {
  const AI = window.SecretaryAI;
  const MODELS = (AI && AI.MODELS) || ["gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano"];
  const currentModel = (AI && AI.getModel ? AI.getModel() : null) || tweaks.openaiModel || "gpt-5.4-mini";

  const [keyInput, setKeyInput] = useState("");
  const [reveal, setReveal] = useState(false);
  const [hasKey, setHasKey] = useState(() => !!(AI && AI.getKey && AI.getKey()));
  const [srvStatus, setSrvStatus] = useState(() => (AI && AI.serverStatus ? AI.serverStatus() : { checked: false }));
  const [testState, setTestState] = useState({ state: "idle", msg: "" });

  useEffect(() => {
    if (!AI || !AI.checkServer) return;
    let mounted = true;
    AI.checkServer(true).then(s => { if (mounted) setSrvStatus({ ...s }); });
    return () => { mounted = false; };
  }, []);

  const route = AI && AI.getRoute ? AI.getRoute() : null;
  const maskedHint = route === "server-proxy"
    ? "using server.py proxy · key loaded from .env · no key in browser"
    : hasKey
      ? "using browser key · stored in localStorage only"
      : "no key set · start server.py or paste a key below";

  const saveKey = () => {
    if (!AI) return;
    AI.setKey(keyInput.trim());
    setHasKey(!!keyInput.trim());
    setKeyInput("");
    setTestState({ state: "idle", msg: "" });
  };
  const clearKey = () => {
    if (!AI) return;
    AI.setKey("");
    setHasKey(false);
    setTestState({ state: "idle", msg: "" });
  };
  const pickModel = (m) => setTweaks({ ...tweaks, openaiModel: m });
  const test = async () => {
    if (!AI) { setTestState({ state: "err", msg: "ai.js not loaded" }); return; }
    const p = AI.getProvider();
    setTestState({ state: "running", msg: p === "claude_code" ? "running claude -p probe…" : "calling OpenAI Responses API…" });
    const r = await AI.testConnection();
    if (r.ok) setTestState({ state: "ok", msg: `ok · ${r.route} · reply: ${r.text}` });
    else setTestState({ state: "err", msg: r.error });
  };

  // Provider pill selector — Claude Code (via subprocess) vs OpenAI.
  const currentProvider = AI && AI.getProvider ? AI.getProvider() : "openai";
  const claudeReady = !!(srvStatus && srvStatus.claude_code_available);
  const pickProvider = (p) => setTweaks({ ...tweaks, aiProvider: p });

  return (
    <React.Fragment>
      <div className="opt">
        <div>
          <div className="lbl">AI provider</div>
          <div className="desc">
            <b>Claude Code</b> (default) uses your Max-plan auth via local <code>claude -p</code> — no API key, no per-token cost.
            &nbsp;<b>OpenAI</b> is an optional fallback via Responses API (server proxy or browser BYOK).
          </div>
        </div>
        <div />
        <div className="ctrl">
          <div className="segmented">
            <button
              className={currentProvider === "claude_code" ? "on" : ""}
              onClick={() => pickProvider("claude_code")}
              disabled={!claudeReady}
              title={claudeReady ? "Local Claude Code — no key needed" : "Claude binary not found on server PATH"}
            ><Icon name="terminal" size={12} style={{marginRight:5}}/>Claude Code{!claudeReady && " (unavailable)"}</button>
            <button
              className={currentProvider === "openai" ? "on" : ""}
              onClick={() => pickProvider("openai")}
            ><Icon name="sparkles" size={12} style={{marginRight:5}}/>OpenAI</button>
          </div>
        </div>
      </div>

      {currentProvider === "claude_code" && (
        <div className="opt">
          <div>
            <div className="lbl">Claude Code binary</div>
            <div className="desc">
              Resolved from server PATH at startup. Prompts pipe through stdin with <code>--max-turns 1 --output-format text</code> for one-shot speed.
            </div>
          </div>
          <div style={{fontSize: 11.5, color: claudeReady ? "var(--pastel-mint-ink)" : "var(--alarm)"}}>
            {claudeReady ? (srvStatus.claude_code_path || "ready") : "not found"}
          </div>
          <div className="ctrl">
            <button className="btn" onClick={test} disabled={testState.state === "running"}>
              {testState.state === "running" ? "testing…" : "Test"}
            </button>
          </div>
        </div>
      )}

      <div className="opt" style={{opacity: currentProvider === "claude_code" ? 0.55 : 1}}>
        <div>
          <div className="lbl">OpenAI API key {currentProvider === "claude_code" && <span style={{fontSize:10, color:"var(--ink-4)", fontWeight:400}}>(fallback only)</span>}</div>
          <div className="desc">Bring-your-own-key. Calls go straight from your browser to OpenAI via the Responses API. {maskedHint}.</div>
        </div>
        <div />
        <div className="ctrl" style={{display:"flex", gap:6, alignItems:"center", flexWrap:"wrap", justifyContent:"flex-end"}}>
          <input
            type={reveal ? "text" : "password"}
            placeholder={hasKey ? "••••••••••  (replace)" : "sk-…"}
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            style={{width: 240, padding: "6px 8px", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontVariantNumeric: "tabular-nums", fontSize: 12, border: "1px solid var(--line)", borderRadius: 6, background: "var(--paper)", color: "var(--ink)"}}
          />
          <button className="btn ghost" onClick={() => setReveal(r => !r)}>{reveal ? "hide" : "show"}</button>
          <button className="btn" onClick={saveKey} disabled={!keyInput.trim()}>save</button>
          {hasKey && <button className="btn alarm" onClick={clearKey}>clear</button>}
        </div>
      </div>

      <div className="opt">
        <div>
          <div className="lbl">Model</div>
          <div className="desc">Selected model for Responses API calls. Nano is fastest, 5.4 is the ceiling.</div>
        </div>
        <div />
        <div className="ctrl">
          <div className="segmented">
            {MODELS.map(m => (
              <button key={m} className={currentModel === m ? "on" : ""} onClick={() => pickModel(m)}>{m}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="opt" style={{opacity: currentProvider === "claude_code" ? 0.55 : 1}}>
        <div>
          <div className="lbl">Test connection (OpenAI)</div>
          <div className="desc">Probe the OpenAI path. Use only when the OpenAI provider is selected above.</div>
        </div>
        <div className="mono dim" style={{fontSize: 11.5, color: testState.state === "err" ? "var(--alarm)" : testState.state === "ok" ? "var(--pastel-mint-ink)" : "var(--ink-4)"}}>
          {testState.msg || "idle"}
        </div>
        <div className="ctrl">
          <button className="btn" onClick={test} disabled={currentProvider !== "openai" || !hasKey || testState.state === "running"}>
            {testState.state === "running" ? "testing…" : "test"}
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}

function SettingsScreen({ tweaks, setTweaks, go, onReset }) {
  return (
    <div className="settings">
      <div className="screen-title">
        <div>
          <div className="kicker">settings · full window</div>
          <h1>Configuration</h1>
        </div>
        <div className="meta"><span><b>operator</b> the team</span><span><b>storage</b> local · 2.4 MB</span></div>
      </div>

      <section>
        <h2>Appearance</h2>
        <div className="opt">
          <div><div className="lbl">{t("label_language")}</div><div className="desc">UI chrome language. Rodbot's generated output stays English for now — switching the identity files to Portuguese is a separate pass.</div></div>
          <div />
          <div className="ctrl">
            <div className="segmented">
              {window.Comeketoi18n && window.Comeketoi18n.available().map(lang => (
                <button key={lang}
                  className={(window.Comeketoi18n.get() === lang) ? "on" : ""}
                  onClick={() => window.Comeketoi18n.set(lang)}>
                  {window.Comeketoi18n.labels[lang] || lang}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="opt">
          <div><div className="lbl">Theme</div><div className="desc">Paper is the default. Ink is for late sessions.</div></div>
          <div />
          <div className="ctrl">
            <div className="segmented">
              <button className={tweaks.theme === "light" ? "on" : ""} onClick={() => setTweaks({...tweaks, theme:"light"})}>paper</button>
              <button className={tweaks.theme === "dark" ? "on" : ""} onClick={() => setTweaks({...tweaks, theme:"dark"})}>ink</button>
            </div>
          </div>
        </div>
        <div className="opt opt-dsgrid">
          <div className="dsgrid-head">
            <div className="lbl">Density</div>
            <div className="desc">How much breathing room around cells and type.</div>
          </div>
          <DecisionGrid
            value={tweaks.density}
            onChange={(v) => setTweaks({ ...tweaks, density: v })}
            options={[
              { id: "compact",  title: "Compact",  subtitle: "Tighter lines, less air — for dense days.", accent: "fog" },
              { id: "regular",  title: "Regular",  subtitle: "The default rhythm.",                        accent: "pale-blue" },
              { id: "generous", title: "Generous", subtitle: "More breathing room around every card.",     accent: "sage" },
            ]}
          />
        </div>
      </section>

      <section>
        <h2>Frames</h2>
        <div className="opt">
          <div><div className="lbl">Default frame type</div><div className="desc">Disjunctive = mutually exclusive. Non-disjunctive = overlapping, AB is conjunction. Auto infers per cluster.</div></div>
          <div />
          <div className="ctrl">
            <div className="segmented">
              <button className={tweaks.frameType === "disjunctive" ? "on" : ""} onClick={() => setTweaks({...tweaks, frameType:"disjunctive"})}>disjunctive</button>
              <button className={tweaks.frameType === "non-disjunctive" ? "on" : ""} onClick={() => setTweaks({...tweaks, frameType:"non-disjunctive"})}>non-disjunctive</button>
              <button className={tweaks.frameType === "auto" ? "on" : ""} onClick={() => setTweaks({...tweaks, frameType:"auto"})}>auto · learn</button>
            </div>
          </div>
        </div>
        <div className="opt">
          <div><div className="lbl">Show frame type on grid</div><div className="desc">Surface the disj/non-disj distinction in the grid head.</div></div>
          <div />
          <div className="ctrl">
            <div className={"toggle" + (tweaks.showFrameType ? " on" : "")} onClick={() => setTweaks({...tweaks, showFrameType: !tweaks.showFrameType})} />
          </div>
        </div>
      </section>

      <section>
        <h2>Gestures</h2>
        <div className="opt">
          <div><div className="lbl">Vocabulary level</div><div className="desc">Novice shows only tap. Fluent adds long-press and swipe-sweep. Expert enables combine + two-finger frame-reject.</div></div>
          <div />
          <div className="ctrl">
            <div className="segmented">
              <button className={tweaks.gestureLevel === "novice" ? "on" : ""} onClick={() => setTweaks({...tweaks, gestureLevel:"novice"})}>novice</button>
              <button className={tweaks.gestureLevel === "fluent" ? "on" : ""} onClick={() => setTweaks({...tweaks, gestureLevel:"fluent"})}>fluent</button>
              <button className={tweaks.gestureLevel === "expert" ? "on" : ""} onClick={() => setTweaks({...tweaks, gestureLevel:"expert"})}>expert</button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>Prediction &amp; auto-commit</h2>
        <div className="opt">
          <div><div className="lbl">Prediction accuracy threshold</div><div className="desc">Above this threshold, auto-commit becomes available in a state cluster.</div></div>
          <div />
          <div className="ctrl">
            <div className="segmented">
              <button className={tweaks.predLevel === "low" ? "on" : ""} onClick={() => setTweaks({...tweaks, predLevel:"low"})}>0.60</button>
              <button className={tweaks.predLevel === "mid" ? "on" : ""} onClick={() => setTweaks({...tweaks, predLevel:"mid"})}>0.80</button>
              <button className={tweaks.predLevel === "hi" ? "on" : ""} onClick={() => setTweaks({...tweaks, predLevel:"hi"})}>0.94</button>
            </div>
          </div>
        </div>
        <div className="opt">
          <div><div className="lbl">Allow auto-commit</div><div className="desc">Comeketo Agent just does the predicted thing in eligible clusters and shows you what it did. Reversible.</div></div>
          <div />
          <div className="ctrl">
            <div className={"toggle" + (tweaks.autoCommit ? " on" : "")} onClick={() => setTweaks({...tweaks, autoCommit: !tweaks.autoCommit})} />
          </div>
        </div>
      </section>

      <section>
        <h2>Intelligence</h2>
        <IntelligencePanel tweaks={tweaks} setTweaks={setTweaks} />

        <div className="opt">
          <div>
            <div className="lbl">
              Demo mode
              {tweaks.demoMode && <span style={{marginLeft:8, padding:"1px 6px", borderRadius:3, background:"color-mix(in oklab, #c9a227 18%, var(--paper))", color:"#8a6a00", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em"}}>on</span>}
            </div>
            <div className="desc">When on, the app still reads from Close/ClickUp/Slack/Gmail and still reasons with AI, but writes (send email, post Slack, create ClickUp task, update Close) are blocked at the proxy. Reads are always allowed. Turn off when you want real writes to go through.</div>
          </div>
          <div />
          <div className="ctrl">
            <div className={"toggle" + (tweaks.demoMode ? " on" : "")} onClick={() => setTweaks({...tweaks, demoMode: !tweaks.demoMode})} />
          </div>
        </div>
      </section>

      <section>
        <h2>Pieces · temporal continuity</h2>
        <div className="opt">
          <div>
            <div className="lbl">Pieces chat LLM</div>
            <div className="desc">
              Pieces fronts the inference cost for whichever model is named here. <b>gpt-4o</b> and <b>gpt-4.1</b> route through Pieces' included LLM credit (no Anthropic spend). <b>claude-sonnet-4-5</b> routes through your Anthropic key. Affects every Activity sweep + every Ask in Mind → Activity, plus the Briefing ribbon's hourly background sweep.
            </div>
          </div>
          <div />
          <div className="ctrl">
            <div className="segmented">
              {[
                ["claude-sonnet-4-5", "claude sonnet 4.5"],
                ["gpt-4o",            "gpt-4o · free"],
                ["gpt-4.1",           "gpt-4.1 · free"],
                ["claude-opus-4",     "claude opus 4"],
              ].map(([id, label]) => (
                <button key={id}
                  className={tweaks.piecesModel === id ? "on" : ""}
                  onClick={() => setTweaks({...tweaks, piecesModel: id})}
                >{label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="opt">
          <div>
            <div className="lbl">Open Pieces Activity</div>
            <div className="desc">Jump to Mind → Activity to see live sweeps, all 39 MCP tools, and the connection panel.</div>
          </div>
          <div />
          <div className="ctrl">
            <button className="btn ghost" onClick={() => go.push("activity")}>Open ↗</button>
          </div>
        </div>
      </section>

      <section>
        <h2>Memory</h2>
        <div className="opt">
          <div><div className="lbl">Primary store</div><div className="desc">Local-first: gesture residue, clusters, frame log, voice model.</div></div>
          <div className="mono dim" style={{fontSize:11.5}}>browser · localStorage</div>
          <div className="ctrl"><button className="btn ghost">Export JSON</button></div>
        </div>
        <div className="opt">
          <div><div className="lbl">Cloud sync</div><div className="desc">Optional. Makes memory available across devices.</div></div>
          <div />
          <div className="ctrl"><div className={"toggle" + (tweaks.cloudSync ? " on" : "")} onClick={() => setTweaks({...tweaks, cloudSync: !tweaks.cloudSync})} /></div>
        </div>
        <div className="opt">
          <div><div className="lbl">Reset session</div><div className="desc">Wipes gesture residue for this session only. Clusters and voice model untouched.</div></div>
          <div />
          <div className="ctrl"><button className="btn alarm" onClick={onReset}>Reset session</button></div>
        </div>
      </section>

      <div style={{marginTop: 30, display:"flex", justifyContent:"space-between"}}>
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
        <div className="mono dim" style={{fontSize:11}}>changes save live — no confirmation needed.</div>
      </div>
    </div>
  );
}

// Hook: subscribes to SecretaryMemory and re-renders on any event.
function useMemoryTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!window.SecretaryMemory) return;
    const unsub = window.SecretaryMemory.subscribe(() => setTick(t => t + 1));
    return unsub;
  }, []);
}

function LiveBadge({ live }) {
  return (
    <span style={{
      display:"inline-block", marginLeft:8, padding:"1px 6px", borderRadius:3,
      background: live ? "color-mix(in oklab, #3a9a58 18%, var(--paper))" : "color-mix(in oklab, #888 14%, var(--paper))",
      color: live ? "#2f7845" : "var(--ink-4)",
      fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em"
    }}>{live ? "live" : "seed"}</span>
  );
}

function MemoryScreen({ data, go }) {
  useMemoryTick();
  const [tab, setTab] = useState("clusters");

  const MM = window.SecretaryMemory;
  const clusters = MM ? MM.clusterStats(data.clusters) : data.clusters.map(c => ({ ...c, fromSeed: true }));
  const frames   = MM ? MM.frameLog(data.frameLog) : data.frameLog.map(f => ({ ...f, fromLive: false }));
  const residue  = MM ? MM.microResidue(60) : [];
  const voice    = MM ? MM.voicePatterns(data.voiceModel) : data.voiceModel.map(v => ({ ...v, fromLive: false }));

  const totalGestures = MM ? MM.events().length : 0;
  const liveClusterCount = clusters.filter(c => c.fromLive).length;
  const liveFrameCount   = frames.filter(f => f.fromLive).length;

  const fmtTime = (t) => t ? (t.length > 10 ? t : t) : "";

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">memory · inspector · local</div>
          <h1>Your residue, clusters, and voice</h1>
        </div>
        <div className="meta">
          <span><b>total gestures</b> {totalGestures.toLocaleString()}</span>
          <span><b>clusters</b> {clusters.length} <span style={{color:"var(--ink-4)"}}>({liveClusterCount} live)</span></span>
          <span><b>frame-rejects</b> {frames.length} <span style={{color:"var(--ink-4)"}}>({liveFrameCount} live)</span></span>
        </div>
      </div>

      <div className="memory">
        <div className="memory-nav">
          <div className="kicker" style={{padding:"4px 12px 8px"}}>scales</div>
          <button className={tab === "clusters" ? "on" : ""} onClick={() => setTab("clusters")}>
            <span>State clusters</span><span className="cnt">{clusters.length}</span>
          </button>
          <button className={tab === "residue" ? "on" : ""} onClick={() => setTab("residue")}>
            <span>Gesture residue</span><span className="cnt">{residue.length || "—"}</span>
          </button>
          <button className={tab === "frames" ? "on" : ""} onClick={() => setTab("frames")}>
            <span>Frame declarations</span><span className="cnt">{frames.length}</span>
          </button>
          <button className={tab === "voice" ? "on" : ""} onClick={() => setTab("voice")}>
            <span>Voice model</span><span className="cnt">{voice.length}</span>
          </button>
        </div>

        <div>
          {tab === "clusters" && (
            <React.Fragment>
              <div className="mono dim" style={{fontSize:11, marginBottom:10}}>
                Live clusters are derived from your real gesture stream. Seeded clusters appear until you've used each one.
              </div>
              <div className="cluster-grid">
                {clusters.map((c) => (
                  <div key={c.id} className="cluster-card" style={{textAlign:"left"}}>
                    <h4>
                      {c.label}
                      <LiveBadge live={c.fromLive} />
                      <span className="tag">{c.eligible ? "auto-commit eligible" : "review mode"}</span>
                    </h4>
                    <div className="sig">{c.signature}</div>
                    <div className="stats">
                      <div><span className="n">{c.gestures}</span><span className="k">gestures</span></div>
                      <div><span className="n">{c.rejectRate}%</span><span className="k">frame·reject</span></div>
                      <div><span className="n">{(c.predAcc*100).toFixed(0)}%</span><span className="k">pred.acc</span></div>
                    </div>
                    {c.fromLive && c.commitCount > 0 && (
                      <div className="mono" style={{fontSize:10.5, color:"var(--ink-4)", marginTop:6}}>
                        {c.commitCount} commits · {c.predictedCommitCount} matched the prediction
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </React.Fragment>
          )}

          {tab === "residue" && (
            <div className="panel" style={{padding:20}}>
              <header><h3>Gesture residue · micro</h3><span className="hint">your actual event stream</span></header>
              {residue.length === 0 ? (
                <div style={{padding:"30px 0", textAlign:"center", color:"var(--ink-4)", fontSize:13}}>
                  No gestures recorded yet. Open a cell, sweep, refine, or commit — events land here.
                </div>
              ) : (
                <div className="log" style={{maxHeight:500, flexDirection:"column", overflowY:"auto"}}>
                  {residue.map((e, i) => (
                    <div className="entry" key={i} style={{gridTemplateColumns:"150px 90px 140px 1fr"}}>
                      <span className="t">{fmtTime(e.t)}</span>
                      <span className={"g " + e.type}>{e.type === "frame_reject" ? "frame·x" : e.type}</span>
                      <span style={{color:"var(--ink-3)", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontVariantNumeric: "tabular-nums", fontSize:11}}>
                        {e.cluster || "—"}
                        {e.predicted && <span style={{color:"var(--ember)", marginLeft:6}}>●</span>}
                      </span>
                      <span className="d">{e.detail || <em style={{color:"var(--ink-4)"}}>—</em>}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="hairline" />
              <div className="mono dim" style={{fontSize:11}}>
                {residue.length > 0
                  ? `Showing last ${residue.length} events · ● marks predicted-cell activity`
                  : "This is the training data for in-frame prediction."}
              </div>
            </div>
          )}

          {tab === "frames" && (
            <div className="panel" style={{padding:20}}>
              <header>
                <h3>Frame-declaration log <LiveBadge live={liveFrameCount > 0} /></h3>
                <span className="hint">user-cell corrections</span>
              </header>
              {frames.length === 0 ? (
                <div style={{padding:"30px 0", textAlign:"center", color:"var(--ink-4)", fontSize:13}}>
                  No frame-rejects recorded yet. When you type in the user cell and hit enter, they log here.
                </div>
              ) : (
                <div style={{display:"grid", gap:12, marginTop:4}}>
                  {frames.map((f, i) => (
                    <div key={i} style={{padding:"12px 14px", border:"1px solid var(--rule)", borderRadius:"var(--r-sm)", background: f.fromLive ? "color-mix(in oklab, #3a9a58 5%, var(--paper))" : "var(--paper)"}}>
                      <div className="mono" style={{fontSize:10.5, color:"var(--ink-4)", marginBottom:6, display:"flex", gap:8, alignItems:"center"}}>
                        <span>{f.t}</span>
                        <span>·</span>
                        <span>cluster <b style={{color:"var(--ink-2)"}}>{f.cluster}</b></span>
                        <span>·</span>
                        <span>weight {f.weight}</span>
                        {!f.fromLive && <LiveBadge live={false} />}
                      </div>
                      <div style={{fontSize:13.5, marginBottom:4}}>
                        <span style={{color:"var(--alarm, #b05656)"}}>rejected:</span> <span className="mono">{f.rejected}</span>
                      </div>
                      <div style={{fontSize:13.5}}>
                        <span style={{color:"var(--ember)"}}>replaced with:</span> <span className="mono">{f.replaced_with}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "voice" && (
            <div className="panel" style={{padding:20}}>
              <header>
                <h3>Voice model</h3>
                <span className="hint">patterns · weighted</span>
              </header>
              <div className="mono dim" style={{fontSize:11, marginBottom:10}}>
                These are seed patterns for now. As you edit drafted commitment bodies in the Commitments page, edits will train live patterns on top.
              </div>
              <div className="voice">
                {voice.map((v, i) => (
                  <div className="pattern" key={i} style={{display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"center"}}>
                    <div><span className="tag">{v.tag}</span>{v.text}</div>
                    <div className="mono" style={{fontSize:11, color:"var(--ink-4)"}}>w={(v.weight || 0).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{marginTop:20, display:"flex", gap:8, alignItems:"center"}}>
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
        <div style={{flex:1}}/>
        <button className="btn ghost" onClick={() => {
          if (!window.SecretaryMemory) return;
          const blob = new Blob([window.SecretaryMemory.export()], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url; a.download = `secretary-memory-${Date.now()}.json`; a.click();
          URL.revokeObjectURL(url);
        }}>Export events</button>
        <button className="btn alarm" onClick={() => {
          if (!window.SecretaryMemory) return;
          if (confirm("Wipe all gesture events? This can't be undone.")) window.SecretaryMemory.reset();
        }}>Clear residue</button>
      </div>
    </div>
  );
}

function PredictionScreen({ data, tweaks, go }) {
  useMemoryTick();
  const baseAcc = tweaks.predLevel === "hi" ? 0.94 : tweaks.predLevel === "mid" ? 0.80 : 0.60;
  const MM = window.SecretaryMemory;

  const clusters = MM ? MM.clusterStats(data.clusters) : data.clusters.map(c => ({...c, fromSeed: true}));
  const stats = MM ? MM.predictionStats(42) : { totalCommits: 0, predictedCommits: 0, overallAcc: 0, daily: [], frameRejectCount: 0 };

  // Accuracy over time: if we have live daily data, use it; otherwise seed curve.
  const hasLiveDays = stats.daily.some(d => d.commits > 0);
  const bars = hasLiveDays
    ? stats.daily.map(d => ({ v: d.acc == null ? 0 : d.acc, date: d.date, commits: d.commits, empty: d.commits === 0 }))
    : Array.from({length: 42}, (_, i) => {
        const v = 0.35 + Math.sin(i * 0.42) * 0.12 + (i / 42) * 0.5 + (i > 30 ? 0.1 : 0);
        return { v: Math.max(0.15, Math.min(0.98, v)), seed: true };
      });

  const meanAcc = hasLiveDays
    ? stats.overallAcc
    : (clusters.reduce((a,c)=>a+c.predAcc,0) / Math.max(1, clusters.length));
  const rejectCount = MM ? stats.frameRejectCount : data.frameLog.length;

  const autoEligible = clusters.filter(c => c.predAcc >= baseAcc);

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">prediction · rolling · 42-day window <LiveBadge live={hasLiveDays} /></div>
          <h1>How often Comeketo Agent nails it</h1>
        </div>
        <div className="meta">
          <span><b>threshold</b> {baseAcc.toFixed(2)}</span>
          <span><b>eligible clusters</b> {autoEligible.length}/{clusters.length}</span>
          <span><b>commits logged</b> {stats.totalCommits}</span>
        </div>
      </div>

      <div className="pred-grid">
        <div className="accuracy-big">
          <div className="num">{(meanAcc*100).toFixed(0)}%</div>
          <div className="label">
            {hasLiveDays
              ? `live · ${stats.predictedCommits}/${stats.totalCommits} commits matched the prediction`
              : "seeded · commit a few predicted cells to start measuring"}
          </div>
        </div>
        <div className="accuracy-big">
          <div className="num" style={{color:"var(--ink)"}}>{rejectCount}</div>
          <div className="label">frame rejections logged · lower is better after week 2</div>
        </div>
      </div>

      <div className="panel" style={{marginTop:16}}>
        <header>
          <h3>Accuracy over time <LiveBadge live={hasLiveDays} /></h3>
          <span className="hint">per-day · all clusters</span>
        </header>
        <div className="bars">
          {bars.map((b, i) => (
            <div key={i}
                 className={"bar" + (b.v >= baseAcc ? " hi" : "")}
                 style={{height: `${Math.max(b.empty ? 3 : 8, b.v*100)}%`, opacity: b.empty ? 0.25 : 1}}
                 title={b.date ? `${b.date} · ${b.commits || 0} commits · ${(b.v*100).toFixed(0)}%` : undefined}/>
          ))}
        </div>
        <div className="row" style={{marginTop:8}}>
          <span className="k">left</span><span className="v">42 days ago</span>
        </div>
        <div className="row">
          <span className="k">right</span><span className="v">today</span>
        </div>
      </div>

      <h2 style={{marginTop: 26, fontWeight: 500, fontSize: 16, letterSpacing:"-0.01em"}}>Auto-commit candidates</h2>
      <div className="mono dim" style={{fontSize:11, marginBottom:12}}>
        Clusters above threshold where Comeketo Agent can just do the predicted thing. Tap the toggle to arm.
      </div>
      <div style={{display:"grid", gap:10}}>
        {clusters.map((c) => {
          const eligible = c.predAcc >= baseAcc;
          return (
            <div key={c.id} className={"auto-commit-row" + (eligible ? " eligible" : "")}>
              <div>
                <div style={{fontSize:14, marginBottom:4}}>
                  {c.label}
                  <LiveBadge live={c.fromLive} />
                </div>
                <div className="sig">{c.signature}</div>
              </div>
              <div style={{display:"flex", alignItems:"center", gap:18}}>
                <div>
                  <span className="num">{(c.predAcc*100).toFixed(0)}<span style={{color:"var(--ink-4)", fontSize:14}}>%</span></span>
                  <div className="mono" style={{fontSize:10, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.06em"}}>pred.acc</div>
                </div>
                <div className={"toggle" + (eligible ? " on" : "")} style={{opacity: eligible ? 1 : 0.4, pointerEvents: eligible ? "auto" : "none"}} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{marginTop:20}}>
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
      </div>
    </div>
  );
}

// ═══════════════════ INBOX ═══════════════════
// Append-only log of the team's raw inputs (todos, notes, feedback, corrections).
// Persists to CCAgentindex/_inbox/inbox.jsonl via /api/inbox/*.
// Backend agent (Claude Code) sweeps this file and folds entries into bedrock
// with full provenance trace — see AGENT.md for sweep protocol.
function InboxScreen({ go }) {
  const INBOX = window.SecretaryInbox;
  const [entries, setEntries] = useState(() => (INBOX ? INBOX.entries() : []));
  const [kindFilter, setKindFilter] = useState("open");    // 'open' | 'all' | specific kind
  const [draftText, setDraftText] = useState("");
  const [draftKind, setDraftKind] = useState("todo");
  const [busy, setBusy] = useState(false);
  const [sweepState, setSweepState] = useState(null); // {phase, id, summary, error}

  useEffect(() => {
    if (!INBOX) return;
    const unsub = INBOX.subscribe((list) => setEntries([...list]));
    INBOX.reload();
    return unsub;
  }, []);

  // Each kind gets a Lucide icon + a pastel accent (var(--pastel-<accent>) /
  // var(--pastel-<accent>-ink)). Keeps the badges cohesive with the rest
  // of the pastel palette instead of a rainbow of saturated hues.
  const KINDS = [
    { id: "todo",       label: "Todo",       icon: "check-square",   accent: "sky"      },
    { id: "note",       label: "Note",       icon: "file-text",      accent: "peach"    },
    { id: "feedback",   label: "Feedback",   icon: "message-square", accent: "lavender" },
    { id: "correction", label: "Correction", icon: "alert-triangle", accent: "rose"     },
    { id: "context",    label: "Context",    icon: "layers",         accent: "mint"     },
    { id: "connector",  label: "Connector",  icon: "plug",           accent: "lemon"    },
  ];

  const filtered = entries.filter(e => {
    if (kindFilter === "open") return e.status === "open";
    if (kindFilter === "all") return true;
    return e.kind === kindFilter;
  });

  const add = async () => {
    if (!draftText.trim()) return;
    setBusy(true);
    try {
      await INBOX.append({
        kind: draftKind,
        text: draftText.trim(),
        source: { screen: "inbox" },
      });
      setDraftText("");
    } catch (e) { alert("Failed: " + e.message); }
    finally { setBusy(false); }
  };

  const markDismissed = async (id) => {
    try { await INBOX.dismiss(id); } catch (e) { alert(e.message); }
  };

  const fmtTime = (iso) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso; }
  };

  // Status indicator — a soft dot + word, deliberately not button-shaped so
  // it doesn't read as a clickable affordance.
  const statusBadge = (s) => {
    const map = {
      open:      { dot: "#d99560", fg: "var(--ink-3)",   lbl: "open" },
      swept:     { dot: "#3a9a58", fg: "var(--ink-3)",   lbl: "swept" },
      dismissed: { dot: "#a0a0a0", fg: "var(--ink-4)",   lbl: "dismissed" },
    };
    const x = map[s] || map.open;
    return (
      <span style={{
        display:"inline-flex", alignItems:"center", gap:5,
        fontSize: 10, color: x.fg,
        textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600,
        fontFamily:"var(--font-mono)",
      }}>
        <span style={{width:6, height:6, borderRadius:"50%", background: x.dot, flexShrink:0}}/>
        {x.lbl}
      </span>
    );
  };

  const kindBadge = (k) => {
    const K = KINDS.find(x => x.id === k) || { label: k, accent: "neutral", icon: "circle" };
    return <span style={{
      background: `var(--pastel-${K.accent})`, color: `var(--pastel-${K.accent}-ink)`,
      padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.06em",
      display: "inline-flex", gap: 5, alignItems: "center",
    }}>
      <Icon name={K.icon} size={11}/><span>{K.label}</span>
    </span>;
  };

  const openCount = entries.filter(e => e.status === "open").length;
  const sweptCount = entries.filter(e => e.status === "swept").length;

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">{t("kicker_inbox")}</div>
          <h1>{t("title_inbox")}</h1>
        </div>
        <div className="meta">
          <span><b>{t("count_open")}</b> {openCount}</span>
          <span><b>{t("count_swept")}</b> {sweptCount}</span>
          <span><b>{t("count_total")}</b> {entries.length}</span>
        </div>
      </div>

      {/* Sweep action — dispatches the inbox_triage sub-agent. Read-only
          triage: classifies unswept entries into fold / drop / surface-in-grid
          verdicts and writes _ledger/triage/<ts>.json. Never mutates bedrock
          directly — the next morning sweep owns the writes. */}
      <div style={{display:"flex", gap:8, marginBottom:14, alignItems:"center", flexWrap:"wrap"}}>
        <button className="btn primary"
          disabled={sweepState && sweepState.phase === "running"}
          onClick={async () => {
            try {
              setSweepState({ phase: "running" });
              const r = await fetch("/api/agents/inbox_triage/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: "{}",
              });
              const j = await r.json();
              if (!j.ok) throw new Error(j.error || "dispatch failed");
              const id = j.request_id;
              setSweepState({ phase: "running", id });
              window.SecretaryMemory && window.SecretaryMemory.log.agentRun({
                cluster: "inbox_triage", signature: "agent_run · inbox_triage",
                agent: "inbox_triage", request_id: id,
              });
              // Poll until done/failed.
              const started = Date.now();
              const tick = async () => {
                try {
                  const rr = await fetch(`/api/delegate/${id}`);
                  const jj = await rr.json();
                  if (jj.status === "done") {
                    setSweepState({ phase: "done", id, summary: jj.summary || "(no summary)" });
                    INBOX && INBOX.reload();
                  } else if (jj.status === "failed" || jj.status === "timeout") {
                    setSweepState({ phase: "failed", id, error: (jj.stderr || jj.summary || "failed") });
                  } else if (Date.now() - started > 600000) {
                    setSweepState({ phase: "failed", id, error: "polling timeout" });
                  } else {
                    setTimeout(tick, 1500);
                  }
                } catch (e) {
                  setSweepState({ phase: "failed", id, error: e.message });
                }
              };
              setTimeout(tick, 1500);
            } catch (e) {
              setSweepState({ phase: "failed", error: e.message });
            }
          }}>
          <Icon name="terminal" size={14}/>
          {sweepState && sweepState.phase === "running" ? "Triaging…" : "Sweep inbox now"}
        </button>
        <span style={{fontSize:11, color:"var(--ink-4)"}}>
          Fires the <code style={{fontSize:10.5}}>inbox_triage</code> sub-agent — classifies unswept entries into fold / drop / surface-in-grid. Read-only; morning sweep owns the writes.
        </span>
        {sweepState && sweepState.id && (
          <button className="btn ghost" onClick={() => go.push("delegations")} style={{fontSize:11}}>
            open delegation →
          </button>
        )}
      </div>

      {sweepState && (sweepState.phase === "done" || sweepState.phase === "failed") && (
        <div style={{
          marginBottom:14, padding:"10px 14px", borderRadius:8,
          background: sweepState.phase === "done" ? "color-mix(in oklab, #3a9a58 10%, var(--paper-card))" : "color-mix(in oklab, #b05656 10%, var(--paper-card))",
          border: `1px solid ${sweepState.phase === "done" ? "#3a9a58" : "#b05656"}`,
          display:"flex", gap:12, alignItems:"flex-start",
        }}>
          <div style={{flex:1, fontSize:12, lineHeight:1.55, color:"var(--ink-2)", whiteSpace:"pre-wrap"}}>
            <b style={{color: sweepState.phase === "done" ? "#2a7545" : "#883e3e"}}>
              {sweepState.phase === "done" ? "Triage complete" : "Triage failed"}
            </b>
            {"\n"}{sweepState.phase === "done" ? (sweepState.summary || "").slice(0, 1200) : sweepState.error}
          </div>
          <button onClick={() => setSweepState(null)}
            style={{background:"none", border:"none", color:"var(--ink-4)", cursor:"pointer", fontSize:14}}>×</button>
        </div>
      )}

      {/* Compose row */}
      <div style={{
        border: "1px solid var(--rule-2)", borderRadius: 10, padding: "14px 16px",
        background: "var(--paper-card)", boxShadow: "var(--shadow-soft)", marginBottom: 18,
      }}>
        <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:10}}>
          {KINDS.map(k => {
            const sel = draftKind === k.id;
            return (
              <button key={k.id} type="button" onClick={() => setDraftKind(k.id)}
                style={{
                  padding:"6px 12px", borderRadius:999, fontSize:12, cursor:"pointer",
                  border: sel ? `2px solid var(--pastel-${k.accent}-ink)` : "1px solid var(--rule-2)",
                  background: sel ? `var(--pastel-${k.accent})` : "var(--paper-card)",
                  color: sel ? `var(--pastel-${k.accent}-ink)` : "var(--ink-3)",
                  fontWeight: sel ? 700 : 500,
                  display: "inline-flex", gap: 5, alignItems: "center",
                  boxShadow: sel ? "var(--shadow-button)" : "none",
                  transition: "all .12s",
                }}
              ><Icon name={k.icon} size={12}/>{k.label}</button>
            );
          })}
        </div>
        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={`Drop a ${draftKind} here — raw is fine, I'll clean it up on sweep. ⌘/Ctrl+Enter to save.`}
          rows={3}
          style={{
            width:"100%", padding:"10px 12px", borderRadius:6, border:"1px solid var(--rule-2)",
            background:"var(--paper)", color:"var(--ink)", fontFamily:"var(--font-body)",
            fontSize:13, lineHeight:1.55, resize:"vertical",
          }}
        />
        <div style={{display:"flex", gap:8, marginTop:10, alignItems:"center"}}>
          <button className="btn primary" onClick={add} disabled={!draftText.trim() || busy}>
            {busy ? "Saving…" : "Drop in"}
          </button>
          <span style={{fontSize:11, color:"var(--ink-4)"}}>
            Lives at <code style={{fontSize:10.5}}>_inbox/inbox.jsonl</code> — git-trackable, sweep-friendly.
          </span>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:14}}>
        <button className="chip" onClick={() => setKindFilter("open")} style={kindFilter === "open" ? {borderColor: "var(--pastel-peach-ink)", color: "var(--pastel-peach-ink)", background: "var(--pastel-peach)"} : undefined}>
          Open <span style={{marginLeft:4, opacity:0.6}}>{openCount}</span>
        </button>
        <button className="chip" onClick={() => setKindFilter("all")} style={kindFilter === "all" ? {borderColor: "var(--ember)", color: "var(--ink)"} : undefined}>
          All <span style={{marginLeft:4, opacity:0.6}}>{entries.length}</span>
        </button>
        {KINDS.map(k => {
          const n = entries.filter(e => e.kind === k.id).length;
          if (!n) return null;
          const sel = kindFilter === k.id;
          return (
            <button key={k.id} className="chip" onClick={() => setKindFilter(k.id)}
              style={sel ? { borderColor: `var(--pastel-${k.accent}-ink)`, color: `var(--pastel-${k.accent}-ink)`, background: `var(--pastel-${k.accent})` } : undefined}>
              <Icon name={k.icon} size={12}/>{k.label} <span style={{marginLeft:4, opacity:0.6}}>{n}</span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div style={{display:"grid", gap:8}}>
        {filtered.length === 0 && (
          <div style={{padding:"36px 0", textAlign:"center", color:"var(--ink-4)", fontFamily:"var(--font-display)"}}>
            <div style={{fontSize:18, marginBottom:6, color:"var(--ink-3)"}}>{t("inbox_empty")}</div>
            <div style={{fontSize:12}}>{t("inbox_empty_hint")}</div>
          </div>
        )}
        {filtered.slice().reverse().map(e => (
          <div key={e.id}
            onClick={() => go.push("inbox_detail", { entryId: e.id })}
            onMouseEnter={ev => { ev.currentTarget.style.transform = "translateY(-1px)"; ev.currentTarget.style.borderColor = "var(--ink-5)"; }}
            onMouseLeave={ev => { ev.currentTarget.style.transform = "none"; ev.currentTarget.style.borderColor = "var(--rule-2)"; }}
            style={{
              border:"1px solid var(--rule-2)", borderRadius:10, background:"var(--paper-card)",
              boxShadow:"var(--shadow-soft)",
              padding:"14px 16px", display:"grid", gridTemplateColumns:"auto 1fr auto", gap:14, alignItems:"start",
              cursor:"pointer", transition:"transform .12s, box-shadow .15s, border-color .15s",
            }}>
            <div style={{display:"flex", flexDirection:"column", gap:6, alignItems:"flex-start"}}>
              {kindBadge(e.kind)}
              {statusBadge(e.status)}
            </div>
            <div>
              <div style={{fontSize:13, color:"var(--ink)", lineHeight:1.5, fontFamily:"var(--font-display)"}}><Markdown text={e.text}/></div>
              <div style={{fontSize:11, color:"var(--ink-4)", marginTop:6, fontFamily:"var(--font-mono)"}}>
                {fmtTime(e.t)}
                {e.source && e.source.screen && <> · from {e.source.screen}</>}
                {e.source && e.source.gridId && <> · grid {e.source.gridId}</>}
                {e.swept_into && e.swept_into.length > 0 && <> · swept into {e.swept_into.join(", ")}</>}
                {e.swept_note && <> · {e.swept_note}</>}
                {e.meta && e.meta.connector_setup_for && <> · channel: {e.meta.connector_setup_for}</>}
              </div>
            </div>
            <div style={{display:"flex", gap:6, flexDirection:"column", alignItems:"flex-end"}}>
              {e.status === "open" && (
                <button className="btn ghost" style={{fontSize:11}} onClick={(ev) => { ev.stopPropagation(); markDismissed(e.id); }}>{t("dismiss")}</button>
              )}
              <span style={{fontSize:10, color:"var(--ink-5)", fontFamily:"var(--font-mono)"}}>{t("ask") === "Ask" ? "open →" : "abrir →"}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{marginTop:20, display:"flex", gap:8}}>
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
      </div>
    </div>
  );
}

// ═══════════════════ CONTACTS ═══════════════════
// Edit-friendly view of CCAgentindex/people/*.
// Each person has contact methods (email, phone, whatsapp, slack_id, etc.)
// AND a `handling` block — per-person sore-thumb variables that evolve over time.
// Writes land as inbox `correction` entries first, then the backend agent
// folds them into the actual people/*.json files on sweep.
function ContactsScreen({ go }) {
  const MC = window.MissionControl;
  const INBOX = window.SecretaryInbox;
  const [people, setPeople] = useState(() => (MC && MC.people) || []);
  const [selectedId, setSelectedId] = useState(null);
  const [edits, setEdits] = useState(null);
  const [addingNew, setAddingNew] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onLoaded = (ev) => setPeople([...(ev.detail && ev.detail.people || [])]);
    window.addEventListener("missioncontrol:loaded", onLoaded);
    return () => window.removeEventListener("missioncontrol:loaded", onLoaded);
  }, []);

  const selected = addingNew
    ? edits
    : selectedId ? people.find(p => p.id === selectedId) : null;

  const startEdit = (p) => {
    setSelectedId(p.id);
    setAddingNew(false);
    setEdits({
      id: p.id,
      name: p.name || "",
      role: p.role || "",
      relationship_weight: p.relationship_weight ?? 0.5,
      contacts: {
        email: (p.contacts && p.contacts.email) || p.email || "",
        phone: (p.contacts && p.contacts.phone) || p.phone || "",
        whatsapp: (p.contacts && p.contacts.whatsapp) || "",
        slack_id: (p.contacts && p.contacts.slack_id) || "",
        slack_channel: (p.contacts && p.contacts.slack_channel) || "",
        clickup_user_id: (p.contacts && p.contacts.clickup_user_id) || "",
        other: (p.contacts && p.contacts.other) || "",
      },
      handling: {
        preferred_channel: (p.handling && p.handling.preferred_channel) || "",
        tone: (p.handling && p.handling.tone) || "",
        response_latency_target: (p.handling && p.handling.response_latency_target) || "",
        off_limits_topics: (p.handling && p.handling.off_limits_topics) || "",
        context: (p.handling && p.handling.context) || p.notes || "",
        voice_adjustments: (p.handling && p.handling.voice_adjustments) || "",
      },
    });
  };

  const startNew = () => {
    setAddingNew(true);
    setSelectedId(null);
    setEdits({
      id: `p_${Date.now().toString(36)}`,
      name: "",
      role: "",
      relationship_weight: 0.5,
      contacts: { email: "", phone: "", whatsapp: "", slack_id: "", slack_channel: "", clickup_user_id: "", other: "" },
      handling: { preferred_channel: "", tone: "", response_latency_target: "", off_limits_topics: "", context: "", voice_adjustments: "" },
    });
  };

  const cancel = () => { setEdits(null); setSelectedId(null); setAddingNew(false); };

  const save = async () => {
    if (!edits || !edits.name.trim()) { alert("Name is required."); return; }
    setSaving(true);
    try {
      await INBOX.append({
        kind: "correction",
        text: addingNew
          ? `New person: ${edits.name}${edits.role ? " (" + edits.role + ")" : ""}`
          : `Update person: ${edits.name}`,
        meta: {
          person_upsert: true,
          record: edits,
          is_new: !!addingNew,
        },
        source: { screen: "contacts" },
      });
      cancel();
      alert(addingNew
        ? "Saved to inbox. Run a bedrock sweep (from Claude Code) to fold into people/."
        : "Update queued in inbox. Run a sweep to apply it to the bedrock file.");
    } catch (e) {
      alert("Save failed: " + e.message);
    } finally { setSaving(false); }
  };

  const setField = (path, val) => {
    setEdits(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const parts = path.split(".");
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) cur = cur[parts[i]] = cur[parts[i]] || {};
      cur[parts[parts.length - 1]] = val;
      return next;
    });
  };

  const textInput = (path, label, placeholder = "", mono = false) => {
    const parts = path.split(".");
    let v = edits;
    for (const p of parts) { v = v && v[p]; }
    return (
      <label style={{display:"grid", gap:4}}>
        <span style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-4)"}}>{label}</span>
        <input
          type="text"
          value={v || ""}
          onChange={(e) => setField(path, e.target.value)}
          placeholder={placeholder}
          style={{
            padding:"8px 10px", borderRadius:6, border:"1px solid var(--rule-2)",
            background:"var(--paper)", color:"var(--ink)", fontSize:13,
            fontVariantNumeric: mono ? "tabular-nums" : "normal",
          }}
        />
      </label>
    );
  };

  const textArea = (path, label, placeholder, rows = 3) => {
    const parts = path.split(".");
    let v = edits;
    for (const p of parts) { v = v && v[p]; }
    return (
      <label style={{display:"grid", gap:4}}>
        <span style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-4)"}}>{label}</span>
        <textarea
          value={v || ""}
          onChange={(e) => setField(path, e.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={{
            padding:"10px 12px", borderRadius:6, border:"1px solid var(--rule-2)",
            background:"var(--paper)", color:"var(--ink)", fontSize:13, lineHeight:1.5,
            fontFamily: "var(--font-display)", resize: "vertical",
          }}
        />
      </label>
    );
  };

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">contacts · bedrock · people &amp; handling</div>
          <h1>Who's in your orbit — and how to reach them.</h1>
        </div>
        <div className="meta">
          <span><b>people</b> {people.length}</span>
          {!MC && <span style={{color:"var(--alarm)"}}>bedrock not loaded</span>}
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"280px 1fr", gap:20, alignItems:"start"}}>
        {/* Left: people list */}
        <div>
          <button className="btn primary" style={{width:"100%", marginBottom:10}} onClick={startNew}>+ Add person</button>
          <div style={{display:"grid", gap:6}}>
            {people.map(p => {
              const sel = selectedId === p.id && !addingNew;
              return (
                <button key={p.id} onClick={() => startEdit(p)}
                  style={{
                    textAlign:"left", padding:"10px 12px", borderRadius:8,
                    border: sel ? "2px solid var(--ember)" : "1px solid var(--rule)",
                    background: sel ? "color-mix(in oklab, var(--ember) 8%, var(--paper-card))" : "var(--paper-card)",
                    cursor:"pointer",
                    boxShadow: sel ? "0 3px 10px rgba(29,31,39,0.08)" : "none",
                  }}
                >
                  <div style={{fontSize:13, fontWeight:600, color:"var(--ink)"}}>{p.name}</div>
                  {p.role && <div style={{fontSize:11, color:"var(--ink-4)"}}>{p.role}</div>}
                </button>
              );
            })}
            {people.length === 0 && (
              <div style={{fontSize:12, color:"var(--ink-4)", padding:"20px 0", textAlign:"center"}}>
                No people in bedrock yet. Click <b>+ Add person</b> to queue your first one for the next sweep.
              </div>
            )}
          </div>
        </div>

        {/* Right: editor */}
        <div>
          {!edits ? (
            <div style={{padding:"60px 20px", textAlign:"center", color:"var(--ink-4)"}}>
              <div style={{fontSize:18, fontFamily:"var(--font-display)", marginBottom:8, color:"var(--ink-3)"}}>
                Pick someone on the left, or add a new person.
              </div>
              <div style={{fontSize:12}}>Edits queue to the inbox as <code style={{fontSize:11}}>correction</code> entries — next bedrock sweep folds them into <code style={{fontSize:11}}>people/</code>.</div>
            </div>
          ) : (
            <div style={{
              border: "1px solid var(--rule-2)", borderRadius: 10, padding: "18px 20px",
              background: "var(--paper-card)", boxShadow: "var(--shadow-soft)",
              display: "grid", gap: 14,
            }}>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
                {textInput("name", "Name", "e.g. Andre Raw")}
                {textInput("role", "Role / how they fit", "e.g. client · music director")}
              </div>
              <label style={{display:"grid", gap:4}}>
                <span style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-4)"}}>Relationship weight (0.0 → 1.0) — how much their preferences should bias drafts</span>
                <input type="range" min="0" max="1" step="0.05"
                  value={edits.relationship_weight ?? 0.5}
                  onChange={(e) => setField("relationship_weight", parseFloat(e.target.value))}
                  style={{width:"100%"}}
                />
                <div style={{fontSize:11, color:"var(--ink-4)"}}>{(edits.relationship_weight ?? 0.5).toFixed(2)}</div>
              </label>

              <div style={{fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-3)", marginTop:4, borderTop:"1px solid var(--rule)", paddingTop:12}}>Contact methods</div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12}}>
                {textInput("contacts.email", "Email", "them@domain.com", true)}
                {textInput("contacts.phone", "Phone", "+15551234567", true)}
                {textInput("contacts.whatsapp", "WhatsApp", "+15551234567", true)}
                {textInput("contacts.slack_id", "Slack user id", "U01ABCDEF", true)}
                {textInput("contacts.slack_channel", "Slack DM / channel", "#name or C0123", true)}
                {textInput("contacts.clickup_user_id", "ClickUp user id", "", true)}
              </div>
              {textInput("contacts.other", "Other (freeform — LinkedIn, Discord, etc.)", "")}

              <div style={{fontSize:11, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-3)", marginTop:4, borderTop:"1px solid var(--rule)", paddingTop:12}}>Handling — how to deal with them (the AI reads this when drafting)</div>
              {textInput("handling.preferred_channel", "Preferred channel", "sms / whatsapp / email / slack")}
              {textInput("handling.tone", "Tone", "warm-short · formal · peer-to-peer · playful")}
              {textInput("handling.response_latency_target", "Response latency target", "e.g. within 24h · same day · low-pri")}
              {textInput("handling.off_limits_topics", "Off-limits topics", "things you should not bring up")}
              {textArea("handling.context", "Context — who they are in your life, history, inside jokes, anything that shapes voice", "…", 4)}
              {textArea("handling.voice_adjustments", "Voice adjustments specific to them — overrides the global voice model", "e.g. drop the em-dash · never use '— J' with them · they prefer full sentences", 3)}

              <div style={{display:"flex", gap:8, alignItems:"center"}}>
                <button className="btn primary" onClick={save} disabled={saving}>
                  {saving ? "Saving…" : addingNew ? "Queue new person" : "Queue update"}
                </button>
                <button className="btn ghost" onClick={cancel}>Cancel</button>
                <span style={{fontSize:11, color:"var(--ink-4)"}}>
                  {addingNew
                    ? "New person will appear in bedrock on next sweep."
                    : "Update queues as an inbox entry — run a bedrock sweep to fold into the file."}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{marginTop:20, display:"flex", gap:8}}>
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
      </div>
    </div>
  );
}

// ═══════════════════ DAILY BRIEFING ═══════════════════
// Read-only view of the morning's Oracle Sweep output.
// ═══════════════════════════════════════════════════════════════════════
//  PIECES BRIEFING RIBBON — temporal continuity at the top of the day.
//  ───────────────────────────────────────────────────────────────────────
//  Fetches the latest hourly Pieces sweep and surfaces it as a sage card
//  above the briefing archive. So when the team opens the app cold, they
//  see "what Pieces noticed since the last sweep" — with the TLDR, the
//  people in the loop, and a one-click jump into Mind → Activity for the
//  full pull. Pieces is the only system tracking unbroken temporal
//  continuity across browsers, vision, and clipboard, so this is the
//  shortest path between the operator and ground truth.
//
//  Uses _normalizePieces + the structured renderer already defined for
//  PiecesActivityScreen — single source of truth for how a Pieces payload
//  lands visually anywhere in the app.
// ═══════════════════════════════════════════════════════════════════════
function PiecesBriefingRibbon({ go }) {
  const [latest, setLatest] = useState(null);   // {ts, raw, ...}
  const [status, setStatus] = useState(null);   // {available, ...}
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/pieces/sweeps/latest").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/pieces/status").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([l, s]) => {
      if (cancelled) return;
      if (l && l.ok && l.latest) setLatest(l.latest);
      if (s) setStatus(s);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const sinceWord = (iso) => {
    if (!iso) return "";
    try {
      const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
      if (m < 1) return "just now";
      if (m < 60) return `${m}m ago`;
      const h = Math.round(m / 60);
      if (h < 24) return `${h}h ago`;
      return `${Math.round(h / 24)}d ago`;
    } catch { return ""; }
  };

  const payload = useMemo(() => latest ? _normalizePieces(latest.raw, null) : null, [latest]);

  // Pieces unreachable — quiet rose card prompting reconnect.
  if (!loading && status && !status.available) {
    return (
      <div className="admo admo-rose" style={{marginBottom:20}}>
        <div className="icon"><Icon name="alert" size={16}/></div>
        <div>
          <div className="ttl">Pieces is offline</div>
          <p style={{margin:"4px 0 0"}}>
            Open PiecesOS and confirm Long-Term Memory is enabled. The briefing will pick up the next sweep automatically.
          </p>
        </div>
      </div>
    );
  }

  // Loading shimmer in deck-paper
  if (loading) {
    return (
      <div style={{
        background:"var(--card)", border:"1px solid var(--rule)", borderRadius:14,
        padding:"18px 22px", marginBottom:20,
      }}>
        <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)"}}>
          Pieces · loading temporal context…
        </div>
      </div>
    );
  }

  // Connected but no sweeps yet
  if (!latest) {
    return (
      <div className="admo admo-lemon" style={{marginBottom:20}}>
        <div className="icon"><Icon name="clock" size={16}/></div>
        <div>
          <div className="ttl">Pieces is connected</div>
          <p style={{margin:"4px 0 0"}}>
            No sweeps captured yet. The hourly background sweep will land soon —
            or trigger one from <button className="btn ghost" style={{padding:"2px 8px", fontSize:11}} onClick={() => go.push("activity")}>Mind → Activity</button>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-tone card-sage" style={{
      padding:"18px 22px", marginBottom:24, borderRadius:14,
    }}>
      {/* Header strip — eyebrow, "view all" CTA, collapse toggle */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14}}>
        <div>
          <div className="eyebrow" style={{
            fontFamily:"var(--font-mono)", fontSize:10.5, letterSpacing:"0.1em",
            textTransform:"uppercase", color:"var(--sage-ink)", opacity:0.78,
          }}>
            From Pieces · {sinceWord(latest.ts)}
          </div>
          <div style={{
            fontFamily:"var(--font-display)", fontSize:24, fontWeight:500,
            letterSpacing:"-0.015em", color:"var(--sage-ink)", marginTop:4,
            lineHeight:1.1,
          }}>
            What you've actually been doing.
          </div>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <button onClick={() => go.push("activity")} style={{
            padding:"6px 14px", borderRadius:999,
            background:"var(--sage-ink)", color:"var(--sage-bg)",
            border:0, cursor:"pointer", fontSize:11, fontWeight:500,
            letterSpacing:"0.04em", fontFamily:"var(--font-body)",
          }}>
            View all activity →
          </button>
          <button onClick={() => setCollapsed(v => !v)} style={{
            padding:"6px 10px", borderRadius:999,
            background:"transparent", color:"var(--sage-ink)", opacity:0.7,
            border:"1px solid currentColor", cursor:"pointer",
            fontSize:10, fontFamily:"var(--font-mono)", letterSpacing:"0.05em",
            textTransform:"uppercase",
          }}>
            {collapsed ? "expand" : "collapse"}
          </button>
        </div>
      </div>

      {!collapsed && payload && payload.kind === "structured" && (
        <div>
          {/* People — at the top of the ribbon, to make the temporal
              continuity feel personal: who has been on your screens? */}
          {payload.people && payload.people.length > 0 && (
            <div style={{display:"flex", flexWrap:"wrap", gap:6, marginBottom:14}}>
              <span style={{
                fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.08em",
                textTransform:"uppercase", color:"var(--sage-ink)", opacity:0.7,
                marginRight:4, alignSelf:"center",
              }}>
                people:
              </span>
              {payload.people.slice(0, 8).map(p => (
                <span key={p.name} style={{
                  fontSize:11, padding:"3px 10px", borderRadius:999,
                  background:"var(--peach-bg)", color:"var(--peach-ink)",
                  fontFamily:"var(--font-body)", fontWeight:500, letterSpacing:"0.02em",
                  display:"inline-flex", alignItems:"center", gap:5,
                }}>
                  {p.name}
                  {p.count > 1 && <span style={{opacity:0.6, fontSize:9, fontFamily:"var(--font-mono)"}}>×{p.count}</span>}
                </span>
              ))}
              {payload.people.length > 8 && (
                <span style={{fontSize:10, color:"var(--sage-ink)", opacity:0.55, fontFamily:"var(--font-mono)", alignSelf:"center"}}>
                  +{payload.people.length - 8} more
                </span>
              )}
            </div>
          )}

          {/* TLDR — the headline summary in deck serif */}
          {payload.summaries && payload.summaries[0] && (
            <div style={{
              fontFamily:"var(--font-display)", fontSize:16, lineHeight:1.55,
              color:"var(--sage-ink)", fontStyle:"normal",
              borderTop:"1px solid currentColor",
              paddingTop:14, opacity:0.95,
            }}>
              {payload.summaries[0].tldr}
            </div>
          )}

          {/* Counts strip — scannable totals + when */}
          <div style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            marginTop:14, paddingTop:12, borderTop:"1px solid currentColor",
            opacity:0.85,
          }}>
            <div style={{display:"flex", gap:18, fontSize:11, fontFamily:"var(--font-mono)", letterSpacing:"0.05em", color:"var(--sage-ink)"}}>
              <span><b>{payload.summaries.length}</b> {payload.summaries.length === 1 ? "summary" : "summaries"}</span>
              <span><b>{payload.events.length}</b> {payload.events.length === 1 ? "event" : "events"}</span>
              <span><b>{payload.people.length}</b> {payload.people.length === 1 ? "person" : "people"}</span>
            </div>
            <div style={{fontSize:10, fontFamily:"var(--font-mono)", letterSpacing:"0.04em", color:"var(--sage-ink)", opacity:0.6}}>
              sweep · {new Date(latest.ts).toLocaleString(undefined, { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
            </div>
          </div>
        </div>
      )}

      {!collapsed && payload && payload.kind !== "structured" && (
        <div style={{
          fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:14.5,
          color:"var(--sage-ink)", opacity:0.92, lineHeight:1.55,
          maxHeight:140, overflow:"auto", whiteSpace:"pre-wrap",
        }}>
          {payload.raw ? (payload.raw.slice(0, 800) + (payload.raw.length > 800 ? "…" : "")) : "(empty sweep)"}
        </div>
      )}
    </div>
  );
}

// The file lives at CCAgentindex/summaries/daily_briefings/YYYY-MM-DD.md
// and is also fed into the AI system prompt as foreground context (see ai_instructions.js).
// This screen is for when the team wants to read the full briefing as written.
function DailyBriefingScreen({ go }) {
  const [entries, setEntries] = useState([]); // [{slug, name, mtime}]
  const [activeSlug, setActiveSlug] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const refreshList = () =>
    fetch("/api/briefings").then(r => r.ok ? r.json() : null).then(j => {
      if (!j) return;
      const ent = Array.isArray(j.entries)
        ? j.entries
        : (j.briefings || []).map(n => ({ name: n, slug: n.replace(/\.md$/, ""), mtime: 0 }));
      setEntries(ent);
      // Auto-select the newest if nothing is active yet — so reloading the
      // screen always lands on the truth-of-the-moment briefing instead of
      // sticking on a stale one from a previous session.
      setActiveSlug(prev => prev || (ent[0] && ent[0].slug) || null);
    });

  useEffect(() => { refreshList(); }, []);

  useEffect(() => {
    if (!activeSlug) return;
    setLoadError(null);
    fetch(`/api/briefings/${activeSlug}`).then(async r => {
      if (r.ok) return r.json();
      let err = `HTTP ${r.status}`;
      try { const j = await r.json(); if (j && j.error) err = j.error; } catch(_) {}
      throw new Error(err);
    }).then(j => {
      if (j && j.ok) {
        const todayStr = new Date().toISOString().slice(0,10);
        const isToday = j.slug === todayStr || j.slug.includes(todayStr);
        setBriefing({ slug: j.slug, body: j.body, isToday, mtime: j.mtime });
      }
    }).catch(e => {
      setLoadError(`Couldn't load "${activeSlug}": ${e.message}`);
      setBriefing(null);
    });
  }, [activeSlug]);

  const today = new Date().toISOString().slice(0, 10);
  const fmtWhen = (mtime) => {
    if (!mtime) return null;
    try {
      const d = new Date(mtime * 1000);
      return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return null; }
  };
  const list = entries.map(e => e.slug);

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">daily briefing · oracle sweep · {briefing ? briefing.slug : "—"}</div>
          <h1>What moved yesterday. What needs you today.</h1>
        </div>
        <div className="meta">
          <span><b>archive</b> {list.length} briefings</span>
          {briefing && briefing.isToday && <span style={{color: "#3a9a58"}}><b>fresh</b> today</span>}
          {briefing && !briefing.isToday && <span style={{color: "#c78a2a"}}><b>stale</b> (showing {briefing.slug})</span>}
        </div>
      </div>

      {/* Pieces ribbon — temporal continuity at the top of the day. */}
      <PiecesBriefingRibbon go={go} />

      <div style={{display:"grid", gridTemplateColumns:"200px 1fr", gap:20, alignItems:"start"}}>
        {/* Left: briefing archive */}
        <div>
          <div style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-4)", marginBottom:8}}>Archive</div>
          {list.length === 0 && (
            <div style={{fontSize:11, color:"var(--ink-4)", padding:"14px 0"}}>
              No briefings yet. The scheduled Oracle Sweep writes them each morning to <code style={{fontSize:10.5}}>summaries/daily_briefings/</code>.
            </div>
          )}
          <div style={{display:"grid", gap:4}}>
            {entries.map((e, idx) => {
              const isActive = (briefing && briefing.slug === e.slug) || activeSlug === e.slug;
              const isCurrent = idx === 0;           // newest by mtime
              const when = fmtWhen(e.mtime);
              return (
                <button key={e.slug} onClick={() => setActiveSlug(e.slug)}
                  style={{
                    textAlign:"left", padding:"8px 10px", borderRadius:6,
                    border: isActive ? "2px solid var(--ember)" : "1px solid var(--rule)",
                    background: isActive ? "color-mix(in oklab, var(--ember) 8%, var(--paper-card))" : "var(--paper-card)",
                    cursor:"pointer", fontSize:12, color:"var(--ink)",
                    display:"flex", flexDirection:"column", alignItems:"stretch", gap:2,
                  }}
                >
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}>
                    <span style={{fontWeight: isCurrent ? 600 : 400}}>{e.slug}</span>
                    {isCurrent && <span style={{
                      fontSize:9, textTransform:"uppercase", letterSpacing:"0.06em",
                      padding:"1px 6px", borderRadius:999,
                      background:"var(--ember)", color:"var(--paper-card-2)", fontWeight:700,
                    }}>current</span>}
                  </div>
                  {when && <div style={{fontSize:10.5, color:"var(--ink-4)"}}>{when}</div>}
                </button>
              );
            })}
          </div>
          {loadError && (
            <div style={{marginTop:10, fontSize:11, color:"var(--alarm, #b05656)", padding:"6px 8px", border:"1px solid color-mix(in oklab, #b05656 30%, transparent)", borderRadius:6, background:"color-mix(in oklab, #b05656 6%, transparent)"}}>
              {loadError}
            </div>
          )}
          <button
            onClick={refreshList}
            style={{
              marginTop:10, width:"100%", padding:"6px 10px", borderRadius:6,
              border:"1px solid var(--rule)", background:"var(--paper-card)",
              color:"var(--ink-3)", fontSize:11, cursor:"pointer",
              fontFamily:"var(--font-body)",
            }}
            title="Re-read the briefings folder">↻ Refresh</button>
        </div>

        {/* Right: rendered briefing */}
        <div style={{
          border: "1px solid var(--rule-2)", borderRadius: 10, padding: "22px 28px",
          background: "var(--paper-card)", boxShadow: "var(--shadow-soft)",
        }}>
          {!briefing ? (
            <div style={{padding:"60px 20px", textAlign:"center", color:"var(--ink-4)"}}>
              <div style={{fontSize:18, fontFamily:"var(--font-display)", marginBottom:8, color:"var(--ink-3)"}}>
                No briefing loaded yet.
              </div>
              <div style={{fontSize:12}}>
                The scheduled Oracle Sweep will drop today's briefing at <code>summaries/daily_briefings/{today}.md</code> — or seed one by hand if you want to test.
              </div>
            </div>
          ) : (
            <div style={{
              fontSize: 13.5, lineHeight: 1.65, color: "var(--ink-2)",
              fontFamily: "var(--font-display)", wordBreak: "break-word",
            }}><Markdown text={briefing.body}/></div>
          )}
        </div>
      </div>

      <div style={{marginTop:20, display:"flex", gap:8}}>
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
      </div>
    </div>
  );
}

// ═══════════════════ DELEGATIONS ═══════════════════
// Comeketo Agent dispatches prompts to Claude Code (running locally as a subprocess).
// Claude Code operates with full tool access on CCAgentindex/
// and returns a result that lands in _ledger/delegations/<id>.json.
// The list below is the running history of delegations, newest first, each with
// a traffic-light status and the full prompt + result expandable inline.
function DelegationsScreen({ go }) {
  const DEL = window.SecretaryDelegator;
  const [items, setItems] = useState(() => (DEL ? DEL.entries() : []));
  const [expandedId, setExpandedId] = useState(null);
  const [newPrompt, setNewPrompt] = useState("");
  const [newMode, setNewMode] = useState("trusted");
  const [newLabel, setNewLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!DEL) return;
    const unsub = DEL.subscribe((list) => setItems([...list]));
    DEL.reload();
    DEL.available().then(setAvailable);
    return unsub;
  }, []);

  const fmtTime = (iso) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso; }
  };

  const trafficLight = (status) => {
    const map = {
      running: { color: "#4a6ea9", pulse: true,  title: "Claude Code running…" },
      done:    { color: "#3a9a58", pulse: false, title: "completed" },
      failed:  { color: "#b05656", pulse: false, title: "failed" },
      timeout: { color: "#b05656", pulse: false, title: "timed out" },
    };
    const s = map[status] || { color: "#888", pulse: false, title: status || "pending" };
    return (
      <span title={s.title} style={{
        display:"inline-block", width:14, height:14, borderRadius:"50%",
        background: s.color,
        boxShadow: `0 0 0 3px color-mix(in oklab, ${s.color} 22%, transparent), 0 0 0 5px color-mix(in oklab, ${s.color} 8%, transparent)`,
        animation: s.pulse ? "traffic-pulse 1.2s ease-in-out infinite" : "none",
      }}/>
    );
  };

  const submit = async () => {
    if (!newPrompt.trim()) return;
    setBusy(true);
    try {
      await DEL.dispatch({
        prompt: newPrompt.trim(),
        mode: newMode,
        label: newLabel.trim() || "Custom delegation",
      });
      setNewPrompt(""); setNewLabel("");
    } catch (e) {
      alert("Dispatch failed: " + e.message);
    } finally { setBusy(false); }
  };

  const sweepInbox = async () => {
    setBusy(true);
    try {
      const p = DEL.PROMPTS.sweep_inbox();
      await DEL.dispatch(p);
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const running = items.filter(i => i.status === "running").length;
  const done    = items.filter(i => i.status === "done").length;
  const failed  = items.filter(i => i.status === "failed" || i.status === "timeout").length;

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">delegations · claude code as subprocess</div>
          <h1>Delegate anything Comeketo Agent can't do alone.</h1>
        </div>
        <div className="meta">
          <span><b>running</b> {running}</span>
          <span><b>done</b> {done}</span>
          <span><b>failed</b> {failed}</span>
          {!available && <span style={{color: "var(--alarm)"}}>claude binary not found</span>}
        </div>
      </div>

      {/* Compose + quick actions */}
      <div style={{
        border: "1px solid var(--rule-2)", borderRadius: 10, padding: "16px 18px",
        background: "var(--paper-card)", boxShadow: "var(--shadow-soft)", marginBottom: 18,
      }}>
        <div style={{display:"flex", gap:8, marginBottom:12, flexWrap:"wrap"}}>
          <button className="btn primary" onClick={sweepInbox} disabled={busy || !available}>
            Sweep inbox now
          </button>
          <span style={{fontSize:11, color:"var(--ink-4)", alignSelf:"center"}}>
            Runs AGENT.md's sweep protocol against <code style={{fontSize:10.5}}>_inbox/inbox.jsonl</code>.
          </span>
        </div>
        <div style={{display:"grid", gridTemplateColumns:"1fr auto", gap:10, alignItems:"start"}}>
          <div style={{display:"grid", gap:8}}>
            <input
              type="text" value={newLabel} onChange={e => setNewLabel(e.target.value)}
              placeholder="Label (optional — shows on the row)"
              style={{padding:"8px 10px", borderRadius:6, border:"1px solid var(--rule-2)", background:"var(--paper)", color:"var(--ink)", fontSize:13}}
            />
            <textarea
              value={newPrompt} onChange={e => setNewPrompt(e.target.value)}
              onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); submit(); } }}
              placeholder="What should Claude Code do? Be specific — it has full tool access to this bedrock. ⌘/Ctrl+Enter to dispatch."
              rows={5}
              style={{padding:"10px 12px", borderRadius:6, border:"1px solid var(--rule-2)", background:"var(--paper)", color:"var(--ink)", fontFamily:"var(--font-body)", fontSize:13, lineHeight:1.5, resize:"vertical"}}
            />
          </div>
          <div style={{display:"grid", gap:8, alignItems:"start"}}>
            <div style={{display:"flex", flexDirection:"column", gap:4}}>
              <span style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-4)"}}>Mode</span>
              <div className="segmented" style={{display:"flex", flexDirection:"column"}}>
                <button className={newMode === "safe" ? "on" : ""} onClick={() => setNewMode("safe")} title="Claude Code prompts for every tool call — only good for read-only tasks">safe · read-only</button>
                <button className={newMode === "trusted" ? "on" : ""} onClick={() => setNewMode("trusted")} title="Claude Code bypasses permission prompts — delegates real action">trusted · can write</button>
              </div>
            </div>
            <button className="btn primary" onClick={submit} disabled={busy || !newPrompt.trim() || !available}>
              {busy ? "…" : "Dispatch"}
            </button>
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{display:"grid", gap:8}}>
        {items.length === 0 && (
          <div style={{padding:"36px 0", textAlign:"center", color:"var(--ink-4)", fontFamily:"var(--font-display)"}}>
            <div style={{fontSize:18, marginBottom:6, color:"var(--ink-3)"}}>No delegations yet.</div>
            <div style={{fontSize:12}}>Hit "Sweep inbox now" to try the happy path.</div>
          </div>
        )}
        {items.map(d => {
          const open = expandedId === d.request_id;
          const dur = d.started_at && d.completed_at
            ? Math.round((new Date(d.completed_at) - new Date(d.started_at)) / 100) / 10 + "s"
            : "";
          return (
            <div key={d.request_id} style={{
              border:"1px solid var(--rule)", borderRadius:6, background:"var(--paper-card)",
              overflow:"hidden",
            }}>
              <div onClick={() => setExpandedId(open ? null : d.request_id)}
                style={{padding:"14px 18px", display:"grid", gridTemplateColumns:"auto auto 1fr auto auto", gap:14, alignItems:"center", cursor:"pointer"}}>
                <div style={{paddingLeft:4, paddingRight:4}}>{trafficLight(d.status)}</div>
                <span style={{
                  padding: "3px 9px", borderRadius: 999, fontSize: 10, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  background: d.mode === "trusted" ? "var(--pastel-rose)" : "var(--pastel-sky)",
                  color: d.mode === "trusted" ? "var(--pastel-rose-ink)" : "var(--pastel-sky-ink)",
                }}>
                  {d.mode || "safe"}
                </span>
                <div>
                  <div style={{fontSize:13.5, fontWeight:500, color:"var(--ink)"}}>{d.label || "(untitled)"}</div>
                  <div style={{fontSize:11, color:"var(--ink-4)", marginTop:3}}>
                    {d.request_id}
                    {d.started_at && <> · started {fmtTime(d.started_at)}</>}
                    {d.completed_at && <> · {d.status === "done" ? "done" : d.status} in {dur}</>}
                  </div>
                </div>
                <div style={{fontSize:11, color:"var(--ink-4)"}}>
                  {d.status === "running" && <span style={{color:"#4a6ea9", fontWeight:500}}>working…</span>}
                  {d.exit_code != null && <span>exit {d.exit_code}</span>}
                </div>
                <div style={{fontSize:10, color:"var(--ink-4)"}}>{open ? "▼" : "▶"}</div>
              </div>
              {open && (
                <div style={{padding:"14px 18px 18px", borderTop:"1px solid var(--rule)", background:"color-mix(in oklab, var(--ink) 2%, var(--paper))", display:"grid", gap:12}}>
                  <div>
                    <div style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-4)", marginBottom:4}}>Prompt</div>
                    <div style={{fontSize:12, color:"var(--ink-3)", whiteSpace:"pre-wrap", lineHeight:1.5, padding:"10px 12px", background:"var(--paper)", border:"1px solid var(--rule)", borderRadius:4, maxHeight:240, overflow:"auto"}}>{d.prompt}</div>
                  </div>
                  {d.summary && (
                    <div>
                      <div style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-4)", marginBottom:4}}>Claude Code's summary</div>
                      <div style={{fontSize:13, color:"var(--ink-2)", lineHeight:1.6, padding:"12px 14px", background:"var(--paper)", border:"1px solid var(--rule)", borderRadius:4, fontFamily:"var(--font-display)"}}><Markdown text={d.summary}/></div>
                    </div>
                  )}
                  {d.stderr && (
                    <details>
                      <summary style={{fontSize:11, color:"var(--ink-4)", cursor:"pointer"}}>stderr</summary>
                      <div style={{fontSize:11, color:"var(--ink-4)", whiteSpace:"pre-wrap", padding:"8px 10px", background:"var(--paper)", border:"1px solid var(--rule)", borderRadius:4, marginTop:6, maxHeight:200, overflow:"auto"}}>{d.stderr}</div>
                    </details>
                  )}
                  {d.error && (
                    <div style={{fontSize:12, color:"var(--alarm, #b05656)"}}>Error: {d.error}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{marginTop:20}}>
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
      </div>
    </div>
  );
}

// ═══════════════════ CHAT ═══════════════════
// Multi-turn conversation with the active AI provider.
// After every turn a reflection pass writes structured metadata to
// _ledger/chat_reflections.jsonl and (when actionable) auto-appends
// an inbox note. Conversations persist across reloads.
function ChatScreen({ go }) {
  const CHAT = window.SecretaryChat;
  const [chats, setChats] = useState(() => (CHAT ? CHAT.all() : []));
  const [activeId, setActiveId] = useState(() => (CHAT ? (CHAT.activeId() || (CHAT.all()[0] && CHAT.all()[0].id)) : null));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!CHAT) return;
    const unsub = CHAT.subscribe((list) => setChats([...list]));
    return unsub;
  }, []);

  // If the grid handed us a seed ("Edit with Rodbot" on a cell), spin up a
  // fresh chat pinned to that block and drop the opening line into the draft.
  useEffect(() => {
    if (!CHAT) return;
    const seed = window.SecretaryChatSeed;
    if (!seed) return;
    window.SecretaryChatSeed = null;
    const c = CHAT.newChat();
    if (c && seed.cell) {
      c.title = `Edit · ${seed.cell.headline || "cell"}`.slice(0, 80);
      c.context = {
        kind: "grid_cell_edit",
        gridId: seed.gridId,
        cellId: seed.cell.id,
        headline: seed.cell.headline,
        preview: seed.cell.preview,
        detail: seed.cell.detail,
      };
    }
    setActiveId(c.id);
    setDraft(seed.opening || "");
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeId, chats, busy]);

  const active = activeId ? chats.find(c => c.id === activeId) : null;

  const newChat = () => {
    const c = CHAT.newChat();
    setActiveId(c.id);
    setDraft("");
  };
  const pick = (id) => { CHAT.setActiveId(id); setActiveId(id); };
  const del = (id) => {
    if (!confirm("Archive this conversation? Reflections in the ledger are preserved.")) return;
    CHAT.archive(id);
    if (activeId === id) {
      const remaining = CHAT.all();
      setActiveId(remaining[0] ? remaining[0].id : null);
    }
  };

  // ── Attachments: images dragged / pasted / picked into the chat input ──
  const [attachments, setAttachments] = useState([]); // pending (not yet sent)
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const ingestFiles = async (files) => {
    const list = Array.from(files || []).filter(f => f && (f.type.startsWith("image/") || f.type === "application/pdf"));
    if (!list.length) return;
    setUploading(true);
    try {
      for (const f of list) {
        try {
          const meta = await CHAT.uploadFile(f);
          setAttachments(prev => [...prev, meta]);
        } catch (e) {
          console.warn("[chat] upload failed:", e.message);
          alert("Upload failed: " + e.message);
        }
      }
    } finally { setUploading(false); }
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
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

  const send = async () => {
    const hasText = !!draft.trim();
    const hasAtt = attachments.length > 0;
    if ((!hasText && !hasAtt) || busy) return;
    setBusy(true);
    try {
      let cid = activeId;
      if (!cid) {
        const c = CHAT.newChat();
        cid = c.id; setActiveId(cid);
      }
      const text = draft.trim();
      const atts = attachments;
      setDraft("");
      setAttachments([]);
      await CHAT.send({ chatId: cid, text, attachments: atts });
    } catch (e) {
      alert("Send failed: " + e.message);
    } finally { setBusy(false); }
  };

  // Per-turn actions: convert an assistant reply into something actionable.
  // Reply content is always text (assistant doesn't attach) — but we still
  // run it through textOf() for safety.
  const sendToInbox = async (turn) => {
    if (!window.SecretaryInbox) return;
    try {
      const text = CHAT.textOf(turn.content);
      await window.SecretaryInbox.append({
        kind: "note", text: text.slice(0, 2000),
        source: { screen: "chat", chat_id: activeId, from: "assistant-turn" },
      });
      alert("Saved to inbox.");
    } catch (e) { alert(e.message); }
  };
  const delegateThis = async (turn) => {
    if (!window.SecretaryDelegator) return;
    try {
      const text = CHAT.textOf(turn.content);
      await window.SecretaryDelegator.dispatch({
        label: "From chat: " + (text.slice(0, 40) || "(untitled)"),
        prompt: text,
        mode: "trusted",
      });
      alert("Dispatched to Claude Code.");
      go.push("delegations");
    } catch (e) { alert(e.message); }
  };

  const fmtTime = (iso) => {
    try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso; }
  };

  // ─── /chat polish audit render ─────────────────────────────────────────
  // Editorial, operator-voice, considered. Assistant replies render as page
  // prose (no bubble). User messages are margin-note containers with a
  // burgundy voice-accent left rule. Tool references render as a footnote
  // strip (§3 unnumbered fallback — per-turn tool-use data is not yet
  // captured by chat.js; see change-log TODOs). Streaming uses a pulsing
  // underscore in the meta strip, not spinners or typing dots.
  const sendReady = (draft.trim().length > 0 || attachments.length > 0) && !busy;

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">chat · multi-turn · reflections → bedrock</div>
          <h1>{active ? active.title : "What's up, Rodbot? What should we get into?"}</h1>
        </div>
        <div className="meta">
          <span><b>chats</b> {chats.length}</span>
          {active && <span><b>turns</b> {active.turns.length}</span>}
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"240px 1fr", gap:20, alignItems:"start"}}>
        {/* ── Left: chat history sidebar (§5) ─────────────────────────── */}
        <div>
          <button className="btn primary" style={{width:"100%", marginBottom:10}} onClick={newChat}>
            <Icon name="plus" size={14}/> New chat
          </button>
          <div style={{display:"flex", flexDirection:"column", gap:2, maxHeight:"70vh", overflowY:"auto"}}>
            {chats.length === 0 && (
              <div style={{fontSize:12, color:"var(--ink-4)", padding:"14px 0", textAlign:"center", fontFamily:"var(--font-mono)", letterSpacing:"0.04em"}}>no chats yet</div>
            )}
            {chats.map(c => {
              const sel = c.id === activeId;
              return (
                <button key={c.id} onClick={() => pick(c.id)}
                  className={sel ? "chat-history-item active" : "chat-history-item"}>
                  <div className="title">{c.title}</div>
                  <div className="byline">{c.turns.length} turns · {fmtTime(c.lastTurnAt || c.createdAt)}</div>
                  <span className="dismiss"
                    onClick={(e) => { e.stopPropagation(); del(c.id); }}
                    title="Archive">
                    <Icon name="x" size={12}/>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: conversation surface (§1–§4, §6, §7) ─────────────── */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            display:"flex", flexDirection:"column", minHeight:"64vh",
            position: "relative",
            border: dragOver ? "1px dashed color-mix(in oklab, var(--ink) 35%, transparent)" : "1px solid transparent",
            borderRadius: 6,
            background: dragOver ? "color-mix(in oklab, var(--ink) 3%, transparent)" : "transparent",
            transition: "background 120ms ease, border-color 120ms ease",
          }}
        >
          {dragOver && (
            <div style={{
              position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center",
              pointerEvents:"none", fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.08em",
              color:"color-mix(in oklab, var(--ink) 60%, transparent)", textTransform:"uppercase", zIndex:5,
            }}>
              drop images here
            </div>
          )}
          <div ref={scrollRef} className="chat-column">
            {!active || active.turns.length === 0 ? (
              <div className="chat-empty">
                {active ? "What's on your mind?" : "Create a chat to begin."}
              </div>
            ) : active.turns.map((t, i) => {
              const mine = t.role === "user";
              const sys  = t.role === "system";
              // Multimodal turn splits into text parts and image parts.
              const parts = Array.isArray(t.content) ? t.content : null;
              const text = parts ? parts.filter(p => p.type === "text").map(p => p.text || "").join("\n").trim()
                                 : (typeof t.content === "string" ? t.content : "");
              const images = parts ? parts.filter(p => p.type === "image") : [];
              const isLast = i === active.turns.length - 1;

              if (mine || sys) {
                // User / system → cream container with burgundy voice-accent rule.
                return (
                  <div key={i} className={sys ? "chat-turn system" : "chat-turn user"}>
                    {images.length > 0 && (
                      <div style={{display:"flex", flexWrap:"wrap", gap:6, maxWidth:"70%", justifyContent:"flex-end"}}>
                        {images.map((img, j) => (
                          <a key={j} href={img.url} target="_blank" rel="noopener" title={img.name || "attachment"}>
                            <img src={img.url} alt={img.name || "attachment"}
                              style={{maxWidth: 220, maxHeight: 220, objectFit:"cover", borderRadius: 4, border:"1px solid var(--rule-2)", display:"block"}}
                            />
                          </a>
                        ))}
                      </div>
                    )}
                    {text && (
                      <div className={sys ? "chat-message-user system" : "chat-message-user"}>
                        {text}
                      </div>
                    )}
                    <div className="chat-byline">{sys ? "system" : "you"} · {fmtTime(t.t)}</div>
                  </div>
                );
              }

              // Assistant → flowing page prose, meta strip above, footnote strip below.
              // Per-turn tool-use metadata is not captured by chat.js today
              // (see change-log TODO). Meta strip shows what we have; footnote
              // strip renders the inbox/delegate affordances as citations.
              return (
                <div key={i} className="chat-turn assistant">
                  <div className="chat-meta-strip">
                    <span>rodbot</span>
                    <span className="sep">·</span>
                    <span>{fmtTime(t.t)}</span>
                    {t.route && (
                      <React.Fragment>
                        <span className="sep">·</span>
                        <em>via {t.route}</em>
                      </React.Fragment>
                    )}
                  </div>
                  {images.length > 0 && (
                    <div style={{display:"flex", flexWrap:"wrap", gap:6, maxWidth:"72ch"}}>
                      {images.map((img, j) => (
                        <a key={j} href={img.url} target="_blank" rel="noopener" title={img.name || "attachment"}>
                          <img src={img.url} alt={img.name || "attachment"}
                            style={{maxWidth: 220, maxHeight: 220, objectFit:"cover", borderRadius: 4, border:"1px solid var(--rule-2)", display:"block"}}
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  {text && (
                    <div className="md chat-md chat-assistant-body">
                      <Markdown text={text}/>
                    </div>
                  )}
                  {/* Pieces grounding pull quote — sage tone, "from your
                      activity". Rendered inline below the reply so the
                      audience sees Rodbot's answer next to the temporal
                      context that informed it. */}
                  {t.grounding && <PiecesGroundingFooter grounding={t.grounding} />}
                  <div className="chat-footnote-row">
                    <button className="chat-footnote" onClick={() => sendToInbox(t)} title="Save this reply to the inbox">
                      <span className="marker">·</span>
                      <Icon name="inbox" size={11}/>
                      <span>save to inbox</span>
                    </button>
                    <button className="chat-footnote" onClick={() => delegateThis(t)} title="Dispatch this reply as a Claude Code task">
                      <span className="marker">·</span>
                      <Icon name="terminal" size={11}/>
                      <span>delegate to claude code</span>
                    </button>
                  </div>
                  {!isLast && <div className="chat-rule" />}
                </div>
              );
            })}
            {busy && (
              <div className="chat-turn assistant">
                <div className="chat-meta-strip">
                  <span>rodbot</span>
                  <span className="sep">·</span>
                  <em>thinking</em>
                  <span className="chat-cursor" />
                </div>
              </div>
            )}
          </div>

          {/* ── Composer (§4) ─────────────────────────────────────────── */}
          <div style={{padding:"12px 0 0 0"}}>
            {attachments.length > 0 && (
              <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:10}}>
                {attachments.map((a, i) => (
                  <div key={i} style={{position:"relative"}}>
                    {a.mime && a.mime.startsWith("image/") ? (
                      <img src={a.url} alt={a.original_filename || ""}
                        style={{width:56, height:56, objectFit:"cover", borderRadius:4, border:"1px solid var(--rule-2)", display:"block"}}
                      />
                    ) : (
                      <div style={{width:56, height:56, borderRadius:4, border:"1px solid var(--rule-2)", background:"var(--paper-card)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"var(--ink-4)", padding:4, textAlign:"center", overflow:"hidden", fontFamily:"var(--font-mono)"}}>
                        {a.original_filename || "file"}
                      </div>
                    )}
                    <button onClick={() => removeAttachment(i)}
                      title="Remove"
                      style={{position:"absolute", top:-6, right:-6, width:16, height:16, borderRadius:"50%", border:"1px solid var(--rule-2)", background:"var(--paper)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0}}
                    >
                      <Icon name="x" size={9}/>
                    </button>
                  </div>
                ))}
                {uploading && <div style={{alignSelf:"center", fontSize:10, color:"var(--ink-4)", fontFamily:"var(--font-mono)", letterSpacing:"0.04em"}}>uploading…</div>}
              </div>
            )}
            <div className="chat-composer">
              <button
                className="chat-plus"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Attach image"
              >
                <Icon name="plus" size={14}/>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                multiple
                style={{display:"none"}}
                onChange={(e) => { ingestFiles(e.target.files); e.target.value = ""; }}
              />
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onPaste={onPaste}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); send(); } }}
                placeholder="What's up, Rodbot?"
                rows={3}
              />
              <button
                className={sendReady ? "chat-send ready" : "chat-send"}
                onClick={send}
                disabled={!sendReady}
                title="Send (⌘/Ctrl+Enter)"
              >
                <Icon name="send" size={14}/>
              </button>
            </div>
            <div className="chat-composer-helper">⌘/ctrl+enter to send · drop or paste images</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════ CALENDAR + STREAKS ═══════════════════
// Reads activity.jsonl and computes:
//  - which days had real "ship" events (commit_sent, delegation_completed,
//    committed cells with actionable commit_kind)
//  - the current and longest streaks from those days
//  - a month grid that shows density at a glance
// When a day is opened, we optionally freeze a rollup to
// summaries/accomplishments/YYYY-MM-DD.json so the AI has a traceable
// record it can reference when reasoning about what the team has been doing.

// Events that count as a productive day (the streak metric). Light touches
// like `gesture` or `chat_turn` alone don't count — the bar is "shipped".
const SHIP_KINDS = new Set([
  "commitment_sent",
  "delegation_completed",
  "commitment_created", // only if commit_kind is in ACTIONABLE_KINDS below
  "task_completed",     // a real task crossed the finish line
]);
const ACTIONABLE_COMMIT_KINDS = new Set(["send", "schedule", "done", "open_url"]);

function isShipEvent(ev) {
  if (!ev || !ev.kind) return false;
  if (ev.kind === "commitment_sent") return true;
  if (ev.kind === "task_completed") return true;
  if (ev.kind === "delegation_completed") return !ev.error && (ev.exit_code == null || ev.exit_code === 0);
  if (ev.kind === "commitment_created") return ACTIONABLE_COMMIT_KINDS.has(ev.commit_kind);
  return false;
}

// Weighted ship-points — not every ship is equal.
//   task_completed:        1.0 (the primary unit of real work)
//   commitment_sent:       0.8 (sent, but lighter than a project task)
//   delegation_completed:  0.7 (a Claude Code subprocess finished)
//   commitment_created:    0.3 (only if actionable — weak signal, queued not done)
function shipWeight(ev) {
  if (!ev || !ev.kind) return 0;
  if (ev.kind === "task_completed") return 1.0;
  if (ev.kind === "commitment_sent") return 0.8;
  if (ev.kind === "delegation_completed" && !ev.error && (ev.exit_code == null || ev.exit_code === 0)) return 0.7;
  if (ev.kind === "commitment_created" && ACTIONABLE_COMMIT_KINDS.has(ev.commit_kind)) return 0.3;
  return 0;
}

function eventDay(ev) {
  if (!ev.t) return null;
  try {
    const d = new Date(ev.t);
    if (isNaN(d.getTime())) return null;
    // Local day slug — streaks are measured in the team's timezone, not UTC.
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  } catch { return null; }
}

function toSlug(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function computeStreak(productiveSet /* Set<string> of YYYY-MM-DD */) {
  // current = consecutive productive days ending today (grace: if today isn't
  // productive yet, we allow the streak to include yesterday's run).
  const today = new Date();
  const slug = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  };
  const todaySlug = slug(today);
  const yDate = new Date(today); yDate.setDate(today.getDate() - 1);
  const yesterdaySlug = slug(yDate);

  let current = 0;
  let cursor = new Date(today);
  // If today not productive but yesterday is, anchor streak at yesterday.
  if (!productiveSet.has(todaySlug) && productiveSet.has(yesterdaySlug)) {
    cursor = yDate;
  }
  while (productiveSet.has(slug(cursor))) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest streak anywhere in history.
  const sorted = Array.from(productiveSet).sort();
  let longest = 0, run = 0, prev = null;
  for (const s of sorted) {
    if (prev) {
      const a = new Date(prev + "T00:00:00");
      const b = new Date(s + "T00:00:00");
      const diff = Math.round((b - a) / 86400000);
      if (diff === 1) run++; else run = 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = s;
  }

  return { current, longest, total: productiveSet.size, todayActive: productiveSet.has(todaySlug) };
}

function CalendarScreen({ go }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() }; // 0-indexed
  });
  const [selectedDay, setSelectedDay] = useState(null); // YYYY-MM-DD

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = window.SecretaryLedger ? await window.SecretaryLedger.read() : [];
        if (alive) setEvents(list);
      } catch (e) {
        console.warn("[calendar] load failed:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Build day -> events[] map.
  const byDay = useMemo(() => {
    const m = new Map();
    for (const ev of events) {
      const d = eventDay(ev);
      if (!d) continue;
      if (!m.has(d)) m.set(d, []);
      m.get(d).push(ev);
    }
    return m;
  }, [events]);

  const productiveSet = useMemo(() => {
    const s = new Set();
    for (const [day, list] of byDay.entries()) {
      if (list.some(isShipEvent)) s.add(day);
    }
    return s;
  }, [byDay]);

  // Weighted "ship score" per day — real work gets more credit than queued
  // work. Used for the heat map intensity and the streak-quality total.
  const shipWeightByDay = useMemo(() => {
    const m = new Map();
    for (const [day, list] of byDay.entries()) {
      let w = 0;
      for (const ev of list) w += shipWeight(ev);
      if (w > 0) m.set(day, w);
    }
    return m;
  }, [byDay]);

  const streak = useMemo(() => computeStreak(productiveSet), [productiveSet]);

  // Quality of the current streak: total weighted ship-points accumulated
  // over the streak window, plus average per day.
  const streakQuality = useMemo(() => {
    if (!streak.current) return { total: 0, avg: 0 };
    const today = new Date();
    let cursor = new Date(today);
    if (!shipWeightByDay.has(toSlug(today))) {
      cursor = new Date(today); cursor.setDate(cursor.getDate() - 1);
    }
    let total = 0;
    for (let i = 0; i < streak.current; i++) {
      total += shipWeightByDay.get(toSlug(cursor)) || 0;
      cursor.setDate(cursor.getDate() - 1);
    }
    return { total, avg: total / streak.current };
  }, [streak, shipWeightByDay]);

  // Month grid — weeks start on Monday.
  const monthCells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const firstDow = (first.getDay() + 6) % 7; // shift so Mon=0
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const slug = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const list = byDay.get(slug) || [];
      const weight = shipWeightByDay.get(slug) || 0;
      cells.push({
        day: d, slug,
        count: list.length,
        ships: list.filter(isShipEvent).length,
        weight,
        productive: productiveSet.has(slug),
      });
    }
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [cursor, byDay, productiveSet, shipWeightByDay]);

  const monthName = new Date(cursor.year, cursor.month, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
  const prevMonth = () => setCursor(c => c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 });
  const nextMonth = () => setCursor(c => c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 });
  const today = () => {
    const d = new Date();
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedDay(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
  };

  const todaySlug = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const selectedList = selectedDay ? (byDay.get(selectedDay) || []) : [];
  const selectedGrouped = useMemo(() => {
    const g = new Map();
    for (const ev of selectedList) {
      if (!g.has(ev.kind)) g.set(ev.kind, []);
      g.get(ev.kind).push(ev);
    }
    return g;
  }, [selectedList]);

  // When a day is opened, freeze a rollup to disk so Rodbot / the AI has a
  // traceable record when reasoning about history. Best-effort, silent on fail.
  useEffect(() => {
    if (!selectedDay || !selectedList.length) return;
    const rollup = {
      slug: selectedDay,
      generated_at: new Date().toISOString(),
      event_count: selectedList.length,
      ship_count: selectedList.filter(isShipEvent).length,
      kinds: Array.from(selectedGrouped.keys()),
      events: selectedList.slice(0, 200),
    };
    fetch(`/api/accomplishments/${selectedDay}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rollup),
    }).catch(() => {});
  }, [selectedDay, selectedList.length]);

  // And push a streak snapshot once per session so the AI can reference it.
  useEffect(() => {
    if (loading) return;
    fetch("/api/streak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        generated_at: new Date().toISOString(),
        current: streak.current,
        longest: streak.longest,
        total_productive_days: streak.total,
        today_active: streak.todayActive,
        ship_kinds: Array.from(SHIP_KINDS),
      }),
    }).catch(() => {});
  }, [loading, streak.current, streak.longest]);

  const stats = useMemo(() => {
    const monthPrefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, "0")}`;
    let monthShipDays = 0, monthEvents = 0;
    for (const [day, list] of byDay.entries()) {
      if (!day.startsWith(monthPrefix)) continue;
      monthEvents += list.length;
      if (list.some(isShipEvent)) monthShipDays++;
    }
    return { monthShipDays, monthEvents };
  }, [byDay, cursor]);

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">calendar · accomplishments · streak</div>
          <h1>What you've actually shipped.</h1>
        </div>
        <div className="meta">
          <span><b>streak</b> {streak.current}d {streak.todayActive && <Icon name="flame" size={11} style={{color:"var(--pastel-peach-ink)"}}/>}</span>
          <span><b>longest</b> {streak.longest}d</span>
          <span><b>total</b> {streak.total}</span>
        </div>
      </div>

      <div className="cal-stats">
        <div className="cal-stat">
          <div className="cal-stat-label"><Icon name="flame" size={12}/> current streak</div>
          <div className="cal-stat-value">{streak.current} <span>day{streak.current === 1 ? "" : "s"}</span></div>
          <div className="cal-stat-hint">
            {streak.current > 0
              ? <>quality · <b>{streakQuality.total.toFixed(1)}</b> pts · {streakQuality.avg.toFixed(1)}/day</>
              : "ship something to start"}
          </div>
        </div>
        <div className="cal-stat">
          <div className="cal-stat-label"><Icon name="award" size={12}/> longest</div>
          <div className="cal-stat-value">{streak.longest} <span>day{streak.longest === 1 ? "" : "s"}</span></div>
          <div className="cal-stat-hint">best run across all recorded history</div>
        </div>
        <div className="cal-stat">
          <div className="cal-stat-label"><Icon name="calendar" size={12}/> {monthName.split(" ")[0]}</div>
          <div className="cal-stat-value">{stats.monthShipDays} <span>ship day{stats.monthShipDays === 1 ? "" : "s"}</span></div>
          <div className="cal-stat-hint">{stats.monthEvents} events logged this month</div>
        </div>
        <div className="cal-stat">
          <div className="cal-stat-label"><Icon name="target" size={12}/> today</div>
          <div className="cal-stat-value" style={{color: streak.todayActive ? "var(--pastel-mint-ink)" : "var(--ink-4)"}}>
            {(shipWeightByDay.get(todaySlug) || 0).toFixed(1)} <span>pts</span>
          </div>
          <div className="cal-stat-hint">{(byDay.get(todaySlug) || []).length} events · {(byDay.get(todaySlug) || []).filter(isShipEvent).length} ship{(byDay.get(todaySlug) || []).filter(isShipEvent).length === 1 ? "" : "s"}</div>
        </div>
      </div>

      <div className="cal-wrap">
        <div className="cal-main">
          <div className="cal-head">
            <button className="btn ghost" onClick={prevMonth} title="Previous month"><Icon name="chevron-left" size={14}/></button>
            <h2 className="cal-month">{monthName}</h2>
            <button className="btn ghost" onClick={nextMonth} title="Next month"><Icon name="chevron-right" size={14}/></button>
            <div style={{flex:1}}/>
            <button className="btn ghost" onClick={today}>Today</button>
          </div>

          {loading ? (
            <div className="cal-empty">loading ledger…</div>
          ) : (
            <>
              <div className="cal-dow">
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="cal-grid">
                {monthCells.map((c, i) => {
                  if (!c) return <div key={i} className="cal-cell empty"/>;
                  const isToday = c.slug === todaySlug;
                  const isSel = c.slug === selectedDay;
                  // Intensity bucket — 1/2/3/4 → deeper green.
                  let intensity = 0;
                  if (c.weight >= 0.5 && c.weight < 1.5) intensity = 1;
                  else if (c.weight >= 1.5 && c.weight < 3.0) intensity = 2;
                  else if (c.weight >= 3.0 && c.weight < 5.5) intensity = 3;
                  else if (c.weight >= 5.5) intensity = 4;
                  const cls = [
                    "cal-cell",
                    c.productive && "productive",
                    intensity > 0 && `intensity-${intensity}`,
                    c.count > 0 && !c.productive && "touched",
                    isToday && "today",
                    isSel && "selected",
                  ].filter(Boolean).join(" ");
                  return (
                    <button key={i} className={cls} onClick={() => setSelectedDay(c.slug)} title={c.weight > 0 ? `${c.weight.toFixed(1)} ship-points` : undefined}>
                      <div className="cal-day-num">{c.day}</div>
                      {c.ships > 0 && <div className="cal-day-ships">{c.ships}<Icon name="flame" size={9}/></div>}
                      {c.count > 0 && c.ships === 0 && <div className="cal-day-count">{c.count}</div>}
                    </button>
                  );
                })}
              </div>
              <div className="cal-legend">
                <span><span className="cal-swatch productive"/> shipped</span>
                <span><span className="cal-swatch touched"/> activity only</span>
                <span><span className="cal-swatch today"/> today</span>
              </div>
            </>
          )}
        </div>

        <div className="cal-side">
          {selectedDay ? (
            <>
              <div className="cal-side-head">
                <div className="kicker">day detail</div>
                <h3>{new Date(selectedDay + "T00:00:00").toLocaleDateString(undefined, { weekday:"long", month:"long", day:"numeric", year:"numeric" })}</h3>
                <div style={{fontSize:11, color:"var(--ink-4)", marginTop:4, fontFamily:"var(--font-mono)"}}>
                  {selectedList.length} events · {selectedList.filter(isShipEvent).length} ships
                </div>
              </div>
              {selectedList.length === 0 ? (
                <div className="cal-empty">nothing recorded</div>
              ) : (
                <div className="cal-events">
                  {Array.from(selectedGrouped.entries()).map(([kind, list]) => (
                    <div key={kind} className="cal-kind-group">
                      <div className="cal-kind-label">
                        <Icon name={iconForKind(kind)} size={11}/> {kind.replace(/_/g, " ")} <span>· {list.length}</span>
                      </div>
                      {list.slice(0, 20).map((ev, i) => (
                        <div key={i} className="cal-event">
                          <div className="cal-event-t">{new Date(ev.t).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</div>
                          <div className="cal-event-body">{describeEvent(ev)}</div>
                        </div>
                      ))}
                      {list.length > 20 && <div style={{fontSize:10, color:"var(--ink-4)", paddingLeft:6}}>…and {list.length - 20} more</div>}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="cal-empty">
              <div style={{fontSize:13, color:"var(--ink-3)", marginBottom:8}}>Pick a day.</div>
              <div style={{fontSize:11, color:"var(--ink-4)", lineHeight:1.6}}>
                Green = at least one thing shipped. Paper = activity but no ship. Each cell shows ship count; click for detail.
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{marginTop:20}}>
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
      </div>
    </div>
  );
}

function iconForKind(k) {
  if (!k) return "circle";
  if (k.startsWith("commitment")) return "check-square";
  if (k.startsWith("delegation")) return "terminal";
  if (k.startsWith("chat")) return "message-square";
  if (k === "gesture") return "circle-dot";
  if (k.startsWith("grid")) return "layers";
  if (k === "connector") return "plug";
  if (k === "inbox-append" || k === "inbox_append") return "inbox";
  return "file-text";
}

function describeEvent(ev) {
  const k = ev.kind;
  if (k === "commitment_created") return ev.subject || ev.label || "(untitled commitment)";
  if (k === "commitment_sent")    return (ev.subject || ev.label || "sent") + (ev.channel ? ` · via ${ev.channel}` : "");
  if (k === "delegation_dispatched") return ev.label || "(delegated)";
  if (k === "delegation_completed")  return (ev.label || "(delegation)") + (ev.exit_code != null ? ` · exit ${ev.exit_code}` : "");
  if (k === "chat_turn")          return (ev.role || "turn") + (ev.preview ? `: ${ev.preview.slice(0, 80)}` : "");
  if (k === "chat_reflected")     return ev.summary ? ev.summary.slice(0, 120) : "(reflected)";
  if (k === "gesture")            return `${ev.type || ""} ${ev.target || ""}`.trim() + (ev.detail ? ` — ${ev.detail.slice(0, 80)}` : "");
  if (k === "grid_version_pushed") return `${ev.gridId || ""} · ${ev.source || ""}`.trim();
  if (k === "connector")          return `${ev.channel || ""} ${ev.action || ""}`.trim();
  return ev.note || ev.text || "";
}

// ═══════════════════ SYLVIA ═══════════════════
// The reflective intelligence's home inside the app. Shows her accumulated
// memory, the raw reflection audit trail, and her identity doc. Every
// memory she's written is here; every event she looked at (including
// abstentions) is in the reflections tab.
function RodbotScreen({ go }) {
  const S = window.Rodbot;
  const [tab, setTab] = useState("memory"); // memory | reflections | identity
  const [memories, setMemories] = useState([]);
  const [refs, setRefs] = useState([]);
  const [identity, setIdentity] = useState("");
  const [state, setState] = useState(() => S ? S.snapshot() : null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    if (!S) return;
    setBusy(true);
    try {
      const [m, r, id] = await Promise.all([
        S.memory({ limit: 500 }),
        S.reflections({ limit: 300 }),
        S.identity(),
      ]);
      setMemories(m.slice().reverse());
      setRefs(r.slice().reverse());
      setIdentity(id);
      setState(S.snapshot());
    } finally { setBusy(false); }
  };

  useEffect(() => {
    reload();
    if (!S) return;
    const unsub = S.subscribe(snap => setState({ ...snap }));
    return unsub;
  }, []);

  const fmtTime = (iso) => {
    try { return new Date(iso).toLocaleString(undefined, { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }); }
    catch { return iso; }
  };

  const impColor = (v) => {
    if (v == null) return "var(--ink-4)";
    if (v >= 0.8) return "var(--pastel-rose-ink)";
    if (v >= 0.6) return "var(--pastel-peach-ink)";
    if (v >= 0.4) return "var(--pastel-mint-ink)";
    return "var(--ink-4)";
  };

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">rodbot · reflective intelligence</div>
          <h1>{state && state.memory_count > 0 ? `${state.memory_count} memories and counting.` : "Rodbot is watching."}</h1>
        </div>
        <div className="meta">
          <span><b>memories</b> {state ? state.memory_count : "…"}</span>
          <span><b>reflections</b> {state ? state.reflection_count : "…"}</span>
          {state && state.pending > 0 && <span style={{color:"var(--pastel-sky-ink)"}}><b>pending</b> {state.pending}</span>}
          {state && !state.enabled && <span style={{color:"var(--alarm)"}}>paused</span>}
        </div>
      </div>

      <div style={{display:"flex", gap:8, marginBottom:16, alignItems:"center"}}>
        <div className="segmented">
          <button className={tab === "memory" ? "on" : ""} onClick={() => setTab("memory")}>Memory</button>
          <button className={tab === "reflections" ? "on" : ""} onClick={() => setTab("reflections")}>Reflections</button>
          <button className={tab === "identity" ? "on" : ""} onClick={() => setTab("identity")}>Identity</button>
        </div>
        <div style={{flex:1}}/>
        <span style={{fontSize:11, color:"var(--ink-4)"}}>
          model: <code style={{fontSize:10.5}}>{state ? state.model : "…"}</code>
        </span>
        <button className="btn ghost" onClick={reload} disabled={busy} style={{fontSize:11}}>
          <Icon name="rotate-ccw" size={11}/> refresh
        </button>
        {S && (
          <button className="btn ghost" onClick={() => { S.setEnabled(!state.enabled); }} title={state && state.enabled ? "pause reflection" : "resume reflection"} style={{fontSize:11}}>
            {state && state.enabled ? "pause" : "resume"}
          </button>
        )}
      </div>

      {tab === "memory" && (
        <div>
          {memories.length === 0 ? (
            <div className="cal-empty">
              <div style={{fontSize:13, color:"var(--ink-3)", marginBottom:6}}>Rodbot hasn't written anything yet.</div>
              <div style={{fontSize:11, color:"var(--ink-4)"}}>
                She'll surface observations as you use the app — commitments, delegations, chat turns, frame rejects. Cheap model, fire-and-forget.
              </div>
            </div>
          ) : (
            <div style={{display:"grid", gap:12}}>
              {memories.map((m, i) => (
                <div key={m.id || i} className="rodbot-card">
                  <div className="rodbot-card-head">
                    <span className="rodbot-imp" style={{background: impColor(m.importance)}}>
                      {m.importance != null ? m.importance.toFixed(2) : "—"}
                    </span>
                    <div className="rodbot-summary">{m.summary}</div>
                    <span className="rodbot-t">{fmtTime(m.t)}</span>
                  </div>
                  {m.affect && m.affect !== "neutral" && (
                    <div style={{
                      marginTop:6, fontSize:10, letterSpacing:"0.06em", textTransform:"uppercase",
                      color:"var(--ink-4)", fontFamily:"var(--font-mono)",
                    }}>
                      <span style={{
                        padding:"2px 8px", borderRadius:999,
                        background:"color-mix(in oklab, var(--pastel-lavender) 70%, transparent)",
                        color:"var(--pastel-lavender-ink)",
                        fontWeight:600,
                      }}>affect · {m.affect.replace(/_/g, " ")}</span>
                    </div>
                  )}
                  {m.tags && m.tags.length > 0 && (
                    <div className="rodbot-tags">
                      {m.tags.map((t, j) => <span key={j} className="rodbot-tag">{t}</span>)}
                    </div>
                  )}
                  {m.action_hint && (
                    <div className="rodbot-hint">
                      <Icon name="zap" size={11}/> {m.action_hint}
                    </div>
                  )}
                  {m.related && (m.related.projects?.length || m.related.people?.length || m.related.threads?.length) ? (
                    <div className="rodbot-related">
                      {(m.related.projects || []).map((x, j) => <span key={"p"+j}>project · {x}</span>)}
                      {(m.related.people || []).map((x, j) => <span key={"h"+j}>person · {x}</span>)}
                      {(m.related.threads || []).map((x, j) => <span key={"t"+j}>thread · {x}</span>)}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "reflections" && (
        <div>
          <div style={{fontSize:11, color:"var(--ink-4)", marginBottom:10, lineHeight:1.5}}>
            Raw reflection audit trail — every batch Rodbot looked at, including abstentions.
            Only high-importance reflections (≥ 0.5) become memories.
          </div>
          {refs.length === 0 ? (
            <div className="cal-empty">No reflections logged yet.</div>
          ) : (
            <div style={{display:"grid", gap:6}}>
              {refs.map((r, i) => (
                <div key={r.id || i} className={"rodbot-ref " + (r.abstain ? "abstain" : r.importance >= 0.5 ? "kept" : "dim")}>
                  <span className="rodbot-ref-t">{fmtTime(r.t)}</span>
                  <span className="rodbot-ref-imp" style={{color: impColor(r.importance)}}>
                    {r.abstain ? "Θ" : r.importance != null ? r.importance.toFixed(2) : "—"}
                  </span>
                  <span className="rodbot-ref-kinds">{(r.source_kinds || []).join(", ") || "—"}</span>
                  <span className="rodbot-ref-summary">{r.summary || (r.abstain ? "(abstained — noise)" : r.parse_error ? "(parse error)" : "—")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "identity" && (
        <div className="rodbot-identity">
          <Markdown text={identity || "(identity.md not loaded)"}/>
          <div style={{marginTop:14, fontSize:11, color:"var(--ink-4)"}}>
            Edit at <code>CCAgentindex/rodbot/identity.md</code>. She'll pick up changes on the next reflection call.
          </div>
        </div>
      )}

      <div style={{marginTop:20}}>
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
      </div>
    </div>
  );
}

// ═══════════════════ PROJECTS ═══════════════════
// The project tree: phases → deliverables → tasks. Tasks are the unit of
// day-to-day work the 3×3 grid scorer now draws from. Rodbot can propose
// a starter structure for a project that doesn't have phases yet.

function ProjectsScreen({ go }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [detail, setDetail] = useState(null); // full project JSON
  const [busy, setBusy] = useState(false);
  const [buildingPhases, setBuildingPhases] = useState(false);

  const loadList = async () => {
    try {
      const res = await fetch("/api/projects", { cache: "no-cache" });
      if (res.ok) {
        const j = await res.json();
        setProjects(j.projects || []);
        if (!activeId && j.projects && j.projects.length) {
          setActiveId(j.projects[0].id);
        }
      }
    } finally { setLoading(false); }
  };

  const loadDetail = async (id) => {
    if (!id) { setDetail(null); return; }
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}`, { cache: "no-cache" });
      if (res.ok) {
        const j = await res.json();
        setDetail(j.project || null);
      }
    } catch { setDetail(null); }
  };

  useEffect(() => { loadList(); }, []);
  useEffect(() => { if (activeId) loadDetail(activeId); }, [activeId]);

  const toggleTask = async (taskId, currentState) => {
    if (!detail) return;
    const newState = currentState === "done" ? "open" : "done";
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(detail.id)}/task/${encodeURIComponent(taskId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState }),
      });
      if (!res.ok) throw new Error("patch failed");
      const j = await res.json().catch(() => ({}));
      // Log completion event with rich metadata — the calendar reads this
      // for weighted-day intensity, Rodbot reads it for reflection fodder.
      if (window.SecretaryLedger) {
        if (newState === "done") {
          window.SecretaryLedger.log("task_completed", {
            project_id: detail.id, project_name: detail.name,
            task_id: taskId,
            phase_id: j.phase_id, deliverable_id: j.deliverable_id,
            days_to_complete: j.days_to_complete,
            reopened_count: j.reopened_count,
            source: { seed_source_type: "project_task", seed_source_id: `project_task/${detail.id}/${taskId}` },
          });
        } else {
          // Re-open is signal too — it's a "false finish." Track it.
          window.SecretaryLedger.log("task_reopened", {
            project_id: detail.id, project_name: detail.name,
            task_id: taskId,
            reopened_count: j.reopened_count,
          });
        }
        if (window.SecretaryScorer) window.SecretaryScorer.refreshAffinityFromLedger().catch(() => {});
      }
      await loadDetail(detail.id);
      loadList();
    } catch (e) {
      alert("Toggle failed: " + e.message);
    } finally { setBusy(false); }
  };

  const buildPhases = async () => {
    if (!detail) return;
    setBuildingPhases(true);
    try {
      const result = await window.SecretaryActions.proposeProjectStructure({
        project: detail,
      });
      // Merge — if project already had phases, Rodbot's output replaces;
      // otherwise we're populating empty.
      const updated = {
        ...detail,
        phases: result.phases,
        _phased_at: new Date().toISOString(),
      };
      const res = await fetch(`/api/projects/${encodeURIComponent(detail.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("write failed");
      if (window.SecretaryLedger) {
        window.SecretaryLedger.log("project_phased", { project_id: detail.id, phase_count: result.phases.length });
      }
      await loadDetail(detail.id);
      await loadList();
    } catch (e) {
      alert("Phase build failed: " + (e.message || e));
    } finally { setBuildingPhases(false); }
  };

  const openTasksTotal = detail ? countOpenTasks(detail) : 0;
  const phaseCount = detail ? (detail.phases || []).length : 0;

  // splitProjectName — project names follow "<short> — <tagline>" by
  // convention in this codebase. Split so the card renders the short name
  // prominently and the tagline as a quieter second line. Falls through to
  // a single line if there's no em-dash.
  const splitProjectName = (name) => {
    if (!name) return { short: "", tagline: "" };
    const m = name.match(/^\s*(.+?)\s+—\s+(.+?)\s*$/);
    if (m) return { short: m[1], tagline: m[2] };
    return { short: name, tagline: "" };
  };

  // projectBucket — maps progress + status to a named bucket the CSS uses
  // for a subtle background tint. Keeps the selected state loud regardless.
  const projectBucket = (p) => {
    if (!p) return "idle";
    if (p.status === "done" || p.progress_pct >= 1) return "done";
    const pct = p.progress_pct || 0;
    if (pct >= 0.75) return "almost";
    if (pct >= 0.25) return "progressing";
    if (pct > 0)      return "started";
    return "idle";
  };

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">projects · phases · deliverables · tasks</div>
          <h1>{detail ? detail.name : "Projects"}</h1>
        </div>
        <div className="meta">
          <span><b>projects</b> {projects.length}</span>
          {detail && <span><b>phases</b> {phaseCount}</span>}
          {detail && <span><b>open tasks</b> {openTasksTotal}</span>}
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"280px 1fr", gap:20, alignItems:"start", minWidth:0}}>
        {/* Left: project archive — unified with briefing archive style */}
        <div className="projects-col" style={{minWidth:0}}>
          {loading ? (
            <div style={{fontSize:12, color:"var(--ink-4)", padding:"14px 0", textAlign:"center"}}>loading…</div>
          ) : projects.length === 0 ? (
            <div style={{fontSize:12, color:"var(--ink-4)", padding:"14px 0", textAlign:"center"}}>No projects yet.</div>
          ) : (
            <>
              <div className="projects-col-label">Archive</div>
              <div className="projects-col-list">
                {projects.map(p => {
                  const sel = p.id === activeId;
                  const bucket = projectBucket(p);
                  const { short, tagline } = splitProjectName(p.name);
                  const hasBar = p.phase_count > 0 && (p.done_task_count || 0) + (p.open_task_count || 0) > 0;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setActiveId(p.id)}
                      className={"project-card" + (sel ? " selected" : "")}
                      data-bucket={bucket}
                      title={p.name}
                    >
                      <div className="project-card-head">
                        <span className="project-card-title">{short}</span>
                        {sel && <span className="project-card-chip">active</span>}
                      </div>
                      {tagline && <div className="project-card-tagline">{tagline}</div>}
                      <div className="project-card-meta">
                        {p.status && <span className="meta-status">{p.status}</span>}
                        {p.phase_count > 0 && <span>{p.phase_count} phase{p.phase_count === 1 ? "" : "s"}</span>}
                        {p.open_task_count > 0 && <span className="meta-open">{p.open_task_count} open</span>}
                        {p.momentum_score > 0.3 && (
                          <span className="meta-momentum" title={`momentum ${p.momentum_score.toFixed(2)}`}>
                            <Icon name="flame" size={9}/>{p.momentum_score.toFixed(1)}
                          </span>
                        )}
                      </div>
                      {hasBar && (
                        <div className="project-card-bar">
                          <div className="project-card-bar-fill" style={{width:`${(p.progress_pct * 100).toFixed(0)}%`}}/>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right: detail */}
        <div>
          {!detail ? (
            <div style={{padding:"60px 20px", textAlign:"center", color:"var(--ink-4)"}}>
              <div style={{fontSize:14}}>Pick a project to see its phases.</div>
            </div>
          ) : (
            <div style={{display:"grid", gap:14}}>
              <div style={{
                border:"1px solid var(--rule)", background:"var(--paper-card)", borderRadius:"var(--panel-radius)",
                padding:"16px 18px", boxShadow:"var(--shadow-card)",
              }}>
                {detail.next_move && (
                  <div style={{fontSize:13, color:"var(--ink-2)", fontFamily:"var(--font-display)", lineHeight:1.5, marginBottom:10}}>
                    <span style={{color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.06em", fontSize:10, marginRight:6}}>next move</span>
                    {detail.next_move}
                  </div>
                )}
                {detail.tags && detail.tags.length > 0 && (
                  <div style={{display:"flex", gap:5, flexWrap:"wrap", marginBottom:10}}>
                    {detail.tags.map((t, i) => <span key={i} className="rodbot-tag">{t}</span>)}
                  </div>
                )}
                {detail.notes && (
                  <div style={{fontSize:12, color:"var(--ink-3)", lineHeight:1.5}}>
                    <Markdown text={detail.notes}/>
                  </div>
                )}
              </div>

              {(!detail.phases || detail.phases.length === 0) ? (
                <div style={{
                  border:"1px dashed var(--pastel-lavender-ink)", borderRadius:"var(--panel-radius)",
                  padding:"22px 20px", textAlign:"center", background:"color-mix(in oklab, var(--pastel-lavender) 30%, var(--paper))",
                }}>
                  <div style={{fontSize:13, fontFamily:"var(--font-display)", color:"var(--pastel-lavender-ink)", marginBottom:12}}>
                    No phases yet. Let Rodbot break this into real work.
                  </div>
                  <button className="btn primary" onClick={buildPhases} disabled={buildingPhases}>
                    {buildingPhases ? "Rodbot is thinking…" : <><Icon name="sparkles" size={13}/> Build phases with Rodbot</>}
                  </button>
                </div>
              ) : (
                <>
                  {detail.phases.map((ph, pi) => (
                    <PhaseCard key={ph.id || pi} phase={ph} onToggleTask={toggleTask} busy={busy}/>
                  ))}
                  <div style={{display:"flex", gap:8, marginTop:6}}>
                    <button className="btn ghost" onClick={buildPhases} disabled={buildingPhases} style={{fontSize:11}}>
                      {buildingPhases ? "Rodbot is thinking…" : <><Icon name="sparkles" size={11}/> Refine phases with Rodbot</>}
                    </button>
                  </div>
                </>
              )}

              {((detail.wins && detail.wins.length) || (detail.misses && detail.misses.length)) && (
                <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
                  <div className="project-wins-box">
                    <div className="project-box-label"><Icon name="award" size={11}/> wins · {(detail.wins||[]).length}</div>
                    {(detail.wins||[]).slice(-6).reverse().map((w, i) => (
                      <div key={i} className="project-box-item">{w.note || w.text || ""}</div>
                    ))}
                  </div>
                  <div className="project-misses-box">
                    <div className="project-box-label"><Icon name="alert-triangle" size={11}/> misses · {(detail.misses||[]).length}</div>
                    {(detail.misses||[]).slice(-6).reverse().map((m, i) => (
                      <div key={i} className="project-box-item">{m.note || m.text || ""}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{marginTop:20}}>
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
      </div>
    </div>
  );
}

function PhaseCard({ phase, onToggleTask, busy }) {
  const stateColor = {
    active:   { bg: "var(--pastel-mint)",     fg: "var(--pastel-mint-ink)" },
    upcoming: { bg: "var(--pastel-sky)",      fg: "var(--pastel-sky-ink)" },
    blocked:  { bg: "var(--pastel-rose)",     fg: "var(--pastel-rose-ink)" },
    done:     { bg: "color-mix(in oklab, var(--ink) 5%, var(--paper))", fg: "var(--ink-3)" },
  };
  const c = stateColor[phase.state] || stateColor.upcoming;
  // Phase progress: count tasks.
  let done = 0, open = 0;
  for (const d of (phase.deliverables || [])) {
    for (const t of (d.tasks || [])) {
      if (t.state === "done") done++; else open++;
    }
  }
  const total = done + open;
  const progressPct = total ? (done / total) * 100 : 0;
  return (
    <div style={{
      border:"1px solid var(--rule)", background:"var(--paper-card)",
      borderRadius:"var(--panel-radius)", boxShadow:"var(--shadow-card)",
      overflow:"hidden",
    }}>
      <div style={{padding:"12px 16px 10px", display:"grid", gridTemplateColumns:"auto 1fr auto", gap:10, alignItems:"center", borderBottom:"1px solid var(--rule)"}}>
        <span style={{
          padding:"3px 9px", borderRadius:4, fontSize:10, fontWeight:700,
          textTransform:"uppercase", letterSpacing:"0.06em",
          background:c.bg, color:c.fg,
        }}>{phase.state || "upcoming"}</span>
        <div style={{fontFamily:"var(--font-display)", fontWeight:600, fontSize:15, color:"var(--ink)"}}>
          {phase.title}
        </div>
        {total > 0 && (
          <div style={{fontFamily:"var(--font-mono)", fontSize:10.5, color:"var(--ink-4)", fontVariantNumeric:"tabular-nums"}}>
            {done} / {total} · {progressPct.toFixed(0)}%
          </div>
        )}
      </div>
      {total > 0 && (
        <div style={{height:3, background:"var(--rule)", overflow:"hidden"}}>
          <div style={{width:`${progressPct}%`, height:"100%", background: progressPct === 100 ? "var(--pastel-mint-ink)" : "var(--ember)", transition:"width 200ms ease"}}/>
        </div>
      )}
      {phase.goal && (
        <div style={{padding:"10px 16px 0", fontSize:12, color:"var(--ink-3)", fontStyle:"italic"}}>
          {phase.goal}
        </div>
      )}
      <div style={{padding:"10px 16px 14px", display:"grid", gap:10}}>
        {(phase.deliverables || []).map((d, di) => (
          <div key={d.id || di}>
            <div style={{fontSize:11.5, fontWeight:600, color: d.state === "done" ? "var(--ink-4)" : "var(--ink-2)", textDecoration: d.state === "done" ? "line-through" : "none", marginBottom:4}}>
              {d.title}
            </div>
            <div style={{display:"grid", gap:3}}>
              {(d.tasks || []).map((t, ti) => (
                <label key={t.id || ti} style={{display:"flex", alignItems:"flex-start", gap:8, cursor: busy ? "wait" : "pointer", padding:"3px 0", fontSize:12.5, lineHeight:1.45}}>
                  <input
                    type="checkbox"
                    checked={t.state === "done"}
                    disabled={busy}
                    onChange={() => onToggleTask(t.id, t.state)}
                    style={{marginTop:3, cursor: busy ? "wait" : "pointer", accentColor:"var(--pastel-mint-ink)"}}
                  />
                  <span style={{color: t.state === "done" ? "var(--ink-4)" : "var(--ink)", textDecoration: t.state === "done" ? "line-through" : "none", flex:1, wordBreak:"break-word"}}>
                    {t.title}
                  </span>
                  {t.completed_at && (
                    <span style={{fontSize:10, color:"var(--ink-4)", fontFamily:"var(--font-mono)"}}>
                      {new Date(t.completed_at).toLocaleDateString(undefined, { month:"short", day:"numeric" })}
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function countOpenTasks(project) {
  let n = 0;
  for (const ph of (project.phases || [])) {
    if (ph.state === "done") continue;
    for (const d of (ph.deliverables || [])) {
      if (d.state === "done") continue;
      for (const t of (d.tasks || [])) {
        if (t.state !== "done") n++;
      }
    }
  }
  return n;
}

// ═══════════════════ ACTIVITY (Pieces LTM) ═══════════════════
// Surfaces the hourly (server-side) + 10-min (browser-side) sweeps of Pieces
// observing the team's actual computer activity — every app, browser, IDE, chat.
// Each sweep is a durable line on _ledger/pieces_sweeps.jsonl.
// ═══════════════════════════════════════════════════════════════════════
//  PIECES ACTIVITY — "Everything you've actually been doing."
//  ───────────────────────────────────────────────────────────────────────
//  Reads from Pieces LTM via the local MCP server (port 39300). Each sweep
//  is one query against ask_pieces_ltm; the response is a JSON blob with
//  workstream_summaries (AI TLDRs of past sessions) and workstream_events
//  (browser/vision/clipboard captures with extracted text + people).
//
//  This screen parses that blob and renders it in deck vocabulary:
//    • SAGE cards     for summaries  (rod · steady recap)
//    • SKY cards      for browser events
//    • LAVENDER cards for vision/screen captures (sylvia · memory)
//    • LEMON cards    for clipboard events       (ideas · top of mind)
//    • PEACH chips    for people mentioned       (warmth · text)
//
//  When the JSON doesn't parse (older sweeps, raw responses), we fall
//  back to a "show raw" toggle. The 39 Pieces tools available via MCP are
//  surfaced in a side panel so the operator (and the demo audience) can
//  see the full surface area at a glance.
// ═══════════════════════════════════════════════════════════════════════

// The 39 tools the Pieces MCP server exposes, grouped by purpose. Used
// for the side panel + click-to-prefill the ask bar with a tool-targeted
// query. Names match the exact MCP tool identifiers.
const PIECES_TOOLS = [
  { group: "Ask",        tone: "sage",  items: [
    { name: "ask_pieces_ltm",            hint: "Free-form question against everything Pieces has seen" },
    { name: "create_pieces_memory",      hint: "Persist a new memory into Pieces LTM" },
  ]},
  { group: "Full-text search", tone: "sky", items: [
    { name: "workstream_summaries_full_text_search", hint: "Find AI TLDRs by keyword" },
    { name: "workstream_events_full_text_search",    hint: "Find raw activity events by keyword" },
    { name: "conversations_full_text_search",        hint: "Search past chat conversations" },
    { name: "conversation_messages_full_text_search",hint: "Search inside individual messages" },
    { name: "tags_full_text_search",                 hint: "Find tagged items" },
    { name: "annotations_full_text_search",          hint: "Search highlights & notes" },
    { name: "persons_full_text_search",              hint: "Find people you've encountered" },
    { name: "anchors_full_text_search",              hint: "Search saved anchor points" },
    { name: "websites_full_text_search",             hint: "Search browser history" },
    { name: "hints_full_text_search",                hint: "Search workflow hints" },
    { name: "models_full_text_search",               hint: "Search AI models referenced" },
    { name: "wpe_sources_full_text_search",          hint: "Search workflow process events" },
    { name: "wpe_source_windows_full_text_search",   hint: "Search WPE source windows" },
    { name: "entities_full_text_search",             hint: "Search recognised entities" },
  ]},
  { group: "Vector search", tone: "lav", items: [
    { name: "workstream_summaries_vector_search", hint: "Semantic search over TLDRs" },
    { name: "workstream_events_vector_search",    hint: "Semantic search over events" },
    { name: "hints_vector_search",                hint: "Semantic search over hints" },
    { name: "tags_vector_search",                 hint: "Semantic search over tags" },
    { name: "materials_vector_search",            hint: "Semantic search over materials" },
  ]},
  { group: "Snapshot",   tone: "peach", items: [
    { name: "workstream_summaries_batch_snapshot", hint: "Bulk export TLDRs by id" },
    { name: "workstream_events_batch_snapshot",    hint: "Bulk export events by id" },
    { name: "conversations_batch_snapshot",        hint: "Bulk export chats" },
    { name: "conversation_messages_batch_snapshot",hint: "Bulk export individual messages" },
    { name: "tags_batch_snapshot",                 hint: "Bulk export tags" },
    { name: "annotations_batch_snapshot",          hint: "Bulk export highlights" },
    { name: "persons_batch_snapshot",              hint: "Bulk export people" },
    { name: "anchors_batch_snapshot",              hint: "Bulk export anchors" },
    { name: "anchor_points_batch_snapshot",        hint: "Bulk export anchor points" },
    { name: "ranges_batch_snapshot",               hint: "Bulk export time ranges" },
    { name: "websites_batch_snapshot",             hint: "Bulk export websites" },
    { name: "hints_batch_snapshot",                hint: "Bulk export hints" },
    { name: "models_batch_snapshot",               hint: "Bulk export models" },
    { name: "entities_batch_snapshot",             hint: "Bulk export entities" },
    { name: "wpe_sources_batch_snapshot",          hint: "Bulk export WPE sources" },
    { name: "wpe_source_windows_batch_snapshot",   hint: "Bulk export WPE windows" },
    { name: "extract_temporal_range",              hint: "Extract activity for a specific time window" },
    { name: "material_identifiers",                hint: "List material identifiers" },
  ]},
];

// Parse the combined_string field that Pieces returns. The shape is
// reliable: each line is "Key: value", with "Extracted text:" being a
// freeform tail. We pull out the structured fields the UI needs.
function parsePiecesEvent(combined) {
  const out = { source: null, app: null, window: null, url: null, people: [], extracted: null, last_accessed: null };
  if (!combined || typeof combined !== "string") return out;
  const lines = combined.split("\n");
  let inExtracted = false;
  const extracted = [];
  for (const ln of lines) {
    if (inExtracted) { extracted.push(ln); continue; }
    const colon = ln.indexOf(":");
    if (colon < 0) continue;
    const k = ln.slice(0, colon).trim().toLowerCase();
    const v = ln.slice(colon + 1).trim();
    if (k === "event source")        out.source = v.toLowerCase();
    else if (k === "app title")      out.app = v;
    else if (k === "window title")   out.window = v;
    else if (k === "url")            out.url = v && v !== "null" ? v : null;
    else if (k === "last accessed")  out.last_accessed = v;
    else if (k === "people mentioned") {
      // "Andre Raw (role: collaborator, evidence: ..., confidence: medium), Jake Aaron (role: ...)"
      const parts = v.split(/,(?=\s*[A-Z])/);
      out.people = parts.map(p => {
        const nameMatch = p.match(/^([^(]+)/);
        return nameMatch ? nameMatch[1].trim() : null;
      }).filter(Boolean);
    }
    else if (k === "extracted text") {
      extracted.push(v);
      inExtracted = true;
    }
  }
  out.extracted = extracted.join("\n").trim() || null;
  return out;
}

// Pull TLDR text out of a summary's combined_string. The pattern is
// "...### **TLDR**\n<the actual TLDR>..." — sometimes stops at a blank
// line, sometimes runs to end. Be generous.
function parsePiecesSummary(combined) {
  if (!combined || typeof combined !== "string") return { tldr: null, range: null };
  const tldrMatch = combined.match(/(?:###\s*\*?\*?TLDR\*?\*?|TLDR)\s*[:\n]+([\s\S]+?)(?:\n###|$)/i);
  const rangeMatch = combined.match(/Summarized time-range:\s*(.+)/i);
  return {
    tldr: tldrMatch ? tldrMatch[1].trim() : combined.trim().slice(0, 600),
    range: rangeMatch ? rangeMatch[1].trim() : null,
  };
}

// Map an event source to a deck tone.
const EVENT_TONE = { browser: "sky", vision: "lav", clipboard: "lemon", screenshot: "lav", default: "sage" };

// Read the user's preferred Pieces chat LLM from localStorage. The Settings
// → Pieces section writes this; the Activity screen + Briefing ribbon read
// it on every Pieces call so the model can swap without prop drilling.
function getPiecesModel() {
  try {
    const t = JSON.parse(localStorage.getItem("secretary.tweaks") || "{}");
    return t.piecesModel || "claude-sonnet-4-5";
  } catch { return "claude-sonnet-4-5"; }
}

// Normalize a Pieces response into the shared shape rendered by
// <PiecesPayloadView>. Accepts EITHER a raw string (will JSON-parse) or
// an already-parsed object. Returns:
//   { kind: "structured" | "json" | "text" | "empty",
//     summaries, events, people, raw, data }
function _normalizePieces(raw, data) {
  if (!raw && !data) return { kind: "empty" };
  let j = data;
  if (!j && typeof raw === "string") {
    try { j = JSON.parse(raw); } catch { /* fall through */ }
  }
  if (j && typeof j === "object") {
    const sums = Array.isArray(j.summaries) ? j.summaries.map(s => ({
      id: (s && s.id) || Math.random().toString(36).slice(2),
      score: s && s.score,
      from: (s && s.range && s.range.from && s.range.from.readable) || null,
      to:   (s && s.range && s.range.to   && s.range.to.readable)   || null,
      ...parsePiecesSummary(s && s.combined_string),
    })) : [];
    const evs = Array.isArray(j.events) ? j.events.map(e => ({
      id: (e && e.id) || Math.random().toString(36).slice(2),
      score: e && e.score,
      url: e && e.browser_url,
      app: e && e.app_title,
      window: e && e.window_title,
      ...parsePiecesEvent(e && e.combined_string),
    })) : [];
    if (sums.length || evs.length) {
      // collect distinct people across events, sort by frequency
      const seen = new Map();
      for (const ev of evs) for (const p of (ev.people || [])) {
        const key = p.toLowerCase();
        seen.set(key, (seen.get(key) || 0) + 1);
      }
      const people = [...seen.entries()].sort((a,b) => b[1] - a[1]).map(([n, c]) => ({
        name: n.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" "),
        count: c,
      }));
      return { kind: "structured", summaries: sums, events: evs, people, raw, data: j };
    }
    // Parsed but unfamiliar — pretty-print
    return { kind: "json", raw, data: j };
  }
  // Couldn't parse — render as plain text (likely an LLM answer)
  return { kind: "text", raw: String(raw || "") };
}

// Render structured cards (people · summaries · events) without any
// surrounding chrome. Compact mode shrinks padding for use inside the
// askResult admo where horizontal space is tighter.
function PiecesStructuredCards({ payload, compact }) {
  const padBlock = compact ? "10px 14px" : "16px 20px";
  return (
    <>
      {payload.people && payload.people.length > 0 && (
        <div style={{marginBottom: compact ? 12 : 18}}>
          <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6}}>
            People in the loop
          </div>
          <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
            {payload.people.map(p => (
              <span key={p.name} className="chip-peach" style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"4px 10px", borderRadius:999,
                fontSize:11, fontWeight:500, letterSpacing:"0.02em",
              }}>
                {p.name}
                {p.count > 1 && <span style={{opacity:0.6, fontSize:9, fontFamily:"var(--font-mono)"}}>×{p.count}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
      {payload.summaries && payload.summaries.length > 0 && (
        <div style={{marginBottom: compact ? 12 : 22}}>
          <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6}}>
            Workstream summaries · {payload.summaries.length}
          </div>
          <div style={{display:"grid", gap: compact ? 8 : 12}}>
            {payload.summaries.map(s => (
              <div key={s.id} className="card-tone card-sage" style={{padding: padBlock}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8}}>
                  <div style={{fontSize:10, fontFamily:"var(--font-mono)", letterSpacing:"0.05em", textTransform:"uppercase", opacity:0.75}}>
                    {s.range || (s.from || s.to ? `${s.from || "?"} → ${s.to || "?"}` : "summary")}
                  </div>
                  {typeof s.score === "number" && (
                    <div style={{fontSize:9, fontFamily:"var(--font-mono)", opacity:0.55}}>
                      score {s.score.toFixed(2)}
                    </div>
                  )}
                </div>
                <div style={{fontFamily:"var(--font-display)", fontSize: compact ? 14 : 16, lineHeight:1.5, fontWeight:400}}>
                  {s.tldr}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {payload.events && payload.events.length > 0 && (
        <div>
          <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6}}>
            Captured events · {payload.events.length}
          </div>
          <div style={{display:"grid", gap: compact ? 8 : 10}}>
            {payload.events.map(ev => {
              const tone = EVENT_TONE[ev.source] || EVENT_TONE.default;
              return (
                <div key={ev.id} className={`card-tone card-${tone}`} style={{padding: padBlock}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6, gap:10}}>
                    <div style={{display:"flex", alignItems:"center", gap:6, minWidth:0}}>
                      <span className={`dot-tone dot-${tone}`} />
                      <span style={{fontFamily:"var(--font-mono)", fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", opacity:0.75}}>
                        {ev.source || "event"}
                      </span>
                      {ev.app && (
                        <span style={{fontFamily:"var(--font-mono)", fontSize:9, letterSpacing:"0.04em", opacity:0.7}}>
                          · {ev.app}
                        </span>
                      )}
                    </div>
                    {ev.last_accessed && (
                      <span style={{fontSize:9, fontFamily:"var(--font-mono)", opacity:0.55, whiteSpace:"nowrap"}}>
                        {ev.last_accessed}
                      </span>
                    )}
                  </div>
                  {ev.window && (
                    <div style={{fontFamily:"var(--font-display)", fontSize: compact ? 14 : 16, fontWeight:500, letterSpacing:"-0.01em", lineHeight:1.25, marginBottom:4}}>
                      {ev.window}
                    </div>
                  )}
                  {ev.url && (
                    <div style={{fontSize:10, fontFamily:"var(--font-mono)", opacity:0.7, wordBreak:"break-all", marginBottom:6}}>
                      {ev.url}
                    </div>
                  )}
                  {ev.extracted && (
                    <div style={{
                      fontSize: compact ? 12 : 13, lineHeight:1.5, opacity:0.92,
                      borderLeft:"2px solid currentColor",
                      paddingLeft:10, marginTop:6,
                      maxHeight: compact ? 100 : 160, overflow:"auto",
                      fontStyle:"italic", fontFamily:"var(--font-display)",
                    }}>
                      {ev.extracted.length > 600 ? ev.extracted.slice(0, 600) + " …" : ev.extracted}
                    </div>
                  )}
                  {ev.people && ev.people.length > 0 && (
                    <div style={{display:"flex", flexWrap:"wrap", gap:5, marginTop:8}}>
                      {ev.people.map(p => (
                        <span key={p} style={{
                          fontSize:10, padding:"1px 8px", borderRadius:999,
                          background:"rgba(255,255,255,0.4)", border:"1px solid currentColor",
                          fontFamily:"var(--font-body)", fontWeight:500,
                        }}>{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// Pretty-print arbitrary JSON — used when Pieces returns a parseable
// shape that isn't summaries/events (e.g. results from full_text_search,
// batch_snapshot). Code-block deck style on ink background.
function PiecesPrettyJSON({ data }) {
  let txt;
  try { txt = JSON.stringify(data, null, 2); } catch { txt = String(data); }
  return (
    <pre style={{
      background:"var(--ink)", color:"var(--paper)",
      borderRadius:10, padding:"16px 18px", margin:0,
      fontFamily:"var(--font-code)", fontSize:11.5, lineHeight:1.55,
      whiteSpace:"pre-wrap", wordBreak:"break-word",
      maxHeight:360, overflow:"auto",
    }}>{txt}</pre>
  );
}

// Plain-text answer (the LLM-style narrative reply from ask_pieces_ltm
// when it doesn't return JSON). Rendered as italic Newsreader so it
// reads like a quote, not raw output.
function PiecesPlainAnswer({ text }) {
  return (
    <div style={{
      fontFamily:"var(--font-display)", fontSize:14.5, lineHeight:1.6,
      color:"var(--ink-2)", whiteSpace:"pre-wrap",
      maxHeight:280, overflow:"auto",
    }}>{text || "(empty)"}</div>
  );
}

// Top-level renderer that picks the right view for whatever Pieces gave
// us. Use this anywhere a Pieces response needs to land — sweep bodies,
// ask answers, future Rodbot panels, etc.
function PiecesPayloadView({ raw, data, compact = false, defaultRaw = false }) {
  const [showRaw, setShowRaw] = useState(defaultRaw);
  const payload = useMemo(() => _normalizePieces(raw, data), [raw, data]);

  if (payload.kind === "empty") {
    return <div style={{color:"var(--ink-4)", fontStyle:"italic", fontSize:13}}>(empty)</div>;
  }

  // Toggle between structured and raw view (for structured + json kinds)
  const toggleable = payload.kind === "structured" || payload.kind === "json";

  return (
    <div>
      {toggleable && (
        <div style={{display:"flex", justifyContent:"flex-end", marginBottom: compact ? 8 : 12}}>
          <button onClick={() => setShowRaw(v => !v)} style={{
            fontSize:10, padding:"4px 10px", borderRadius:999,
            border:"1px solid var(--rule)", background:"transparent",
            color:"var(--muted)", cursor:"pointer",
            fontFamily:"var(--font-mono)", letterSpacing:"0.05em",
            textTransform:"uppercase",
          }}>
            {showRaw ? "← structured" : "raw →"}
          </button>
        </div>
      )}
      {showRaw && payload.data ? <PiecesPrettyJSON data={payload.data} /> :
       showRaw && payload.raw  ? <PiecesPrettyJSON data={payload.raw} /> :
       payload.kind === "structured" ? <PiecesStructuredCards payload={payload} compact={compact} /> :
       payload.kind === "json"       ? <PiecesPrettyJSON data={payload.data} /> :
                                       <PiecesPlainAnswer text={payload.raw} />}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
//  PIECES ANSWER MODAL — answers land here, not in the page flow.
//  ───────────────────────────────────────────────────────────────────────
//  Per Jake's UX call: when an Ask returns, the answer should be a
//  moment, not a wall of text that pushes the toolkit + sweep list off
//  the screen. This modal slides in over a blurred backdrop, holds the
//  full structured render in scroll, and gives the operator one click
//  to copy raw / copy structured / download JSON / download Markdown.
//  Slow editorial entrance (380ms ease-out), faster exit (220ms). ESC
//  and backdrop-click both dismiss. After close, a "view last answer"
//  pill stays in the ribbon so the operator can re-open without re-asking.
// ───────────────────────────────────────────────────────────────────────

// Render the structured payload as readable Markdown for export.
function _piecesPayloadToMarkdown(payload, question) {
  const lines = [];
  if (question) {
    lines.push(`# Pieces · ${question}`);
    lines.push("");
  }
  if (payload && payload.kind === "structured") {
    if (payload.people && payload.people.length) {
      lines.push("## People in the loop");
      lines.push("");
      lines.push(payload.people.map(p => p.count > 1 ? `${p.name} (×${p.count})` : p.name).join(", "));
      lines.push("");
    }
    if (payload.summaries && payload.summaries.length) {
      lines.push(`## Workstream summaries (${payload.summaries.length})`);
      lines.push("");
      for (const s of payload.summaries) {
        const range = s.range || `${s.from || "?"} → ${s.to || "?"}`;
        lines.push(`### ${range}`);
        if (typeof s.score === "number") lines.push(`*score ${s.score.toFixed(2)}*`);
        lines.push("");
        lines.push(s.tldr || "");
        lines.push("");
      }
    }
    if (payload.events && payload.events.length) {
      lines.push(`## Captured events (${payload.events.length})`);
      lines.push("");
      for (const ev of payload.events) {
        const head = [ev.source, ev.app, ev.window].filter(Boolean).join(" · ");
        lines.push(`### ${head || "event"}`);
        if (ev.url)            lines.push(`- URL: ${ev.url}`);
        if (ev.last_accessed)  lines.push(`- Last accessed: ${ev.last_accessed}`);
        if (ev.people && ev.people.length) lines.push(`- People: ${ev.people.join(", ")}`);
        lines.push("");
        if (ev.extracted) { lines.push("> " + ev.extracted.replace(/\n/g, "\n> ")); lines.push(""); }
      }
    }
  } else if (payload && payload.raw) {
    lines.push("## Answer");
    lines.push("");
    lines.push(payload.raw);
    lines.push("");
  }
  return lines.join("\n");
}

function PiecesAnswerModal({ open, onClose, question, raw, data, model }) {
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState(null);
  const payload = useMemo(() => _normalizePieces(raw, data), [raw, data]);

  const dismiss = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose && onClose(); }, 220);
  };

  // ESC dismisses
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") dismiss(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closing]);

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(id);
  }, [toast]);

  if (!open) return null;

  const flash = (msg) => setToast(msg);

  const copyText = (text, label) => {
    if (!navigator.clipboard) { flash("clipboard unavailable"); return; }
    navigator.clipboard.writeText(text).then(
      () => flash(label || "copied"),
      () => flash("copy failed")
    );
  };

  const downloadBlob = (text, mime, filename) => {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash("downloaded");
  };

  const tsSlug = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dataForJson = payload.data != null ? payload.data : (raw || "");
  const jsonString = (() => {
    try { return JSON.stringify(dataForJson, null, 2); }
    catch { return String(dataForJson); }
  })();
  const markdownString = _piecesPayloadToMarkdown(payload, question);

  return (
    <div className="deck-modal-backdrop" data-state={closing ? "closing" : "open"} onClick={dismiss}>
      <div className="deck-modal-card" data-state={closing ? "closing" : "open"} onClick={(e) => e.stopPropagation()}>
        {/* Header — question, model, counts, close */}
        <div style={{
          padding:"22px 28px 16px", borderBottom:"1px solid var(--rule)",
          display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:18,
        }}>
          <div style={{minWidth:0, flex:1}}>
            <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6}}>
              Pieces · answer {model && `· ${model}`}
            </div>
            <div style={{
              fontFamily:"var(--font-display)", fontSize:22, fontWeight:500,
              letterSpacing:"-0.015em", lineHeight:1.2, color:"var(--ink)",
              wordBreak:"break-word",
            }}>
              {question || "Answer"}
            </div>
            {payload.kind === "structured" && (
              <div style={{display:"flex", gap:14, marginTop:8, fontSize:11, fontFamily:"var(--font-mono)", letterSpacing:"0.05em", color:"var(--muted)"}}>
                <span><b style={{color:"var(--ink-2)"}}>{payload.summaries.length}</b> {payload.summaries.length === 1 ? "summary" : "summaries"}</span>
                <span><b style={{color:"var(--ink-2)"}}>{payload.events.length}</b> {payload.events.length === 1 ? "event" : "events"}</span>
                <span><b style={{color:"var(--ink-2)"}}>{payload.people.length}</b> {payload.people.length === 1 ? "person" : "people"}</span>
                <span style={{opacity:0.55}}>· {(raw || "").length.toLocaleString()} chars</span>
              </div>
            )}
          </div>
          <button onClick={dismiss} aria-label="Close" style={{
            width:36, height:36, borderRadius:"50%", border:"1px solid var(--rule)",
            background:"var(--paper-card)", cursor:"pointer", color:"var(--ink-2)",
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }} title="Close (Esc)">
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Body — full structured render in scroll */}
        <div style={{padding:"22px 28px", overflow:"auto", flex:1}}>
          <PiecesPayloadView raw={raw} data={data} />
        </div>

        {/* Footer — copy / export / close */}
        <div style={{
          padding:"14px 22px", borderTop:"1px solid var(--rule)",
          background:"var(--paper-2)",
          display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap",
        }}>
          <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
            <button onClick={() => copyText(raw || "", "raw copied")} className="btn btn-paper" style={{padding:"7px 14px", fontSize:12}}>
              <Icon name="file-text" size={12}/> <span style={{marginLeft:5}}>Copy raw</span>
            </button>
            <button onClick={() => copyText(jsonString, "json copied")} className="btn btn-paper" style={{padding:"7px 14px", fontSize:12}}>
              <Icon name="file-text" size={12}/> <span style={{marginLeft:5}}>Copy JSON</span>
            </button>
            <button onClick={() => copyText(markdownString, "markdown copied")} className="btn btn-paper" style={{padding:"7px 14px", fontSize:12}}>
              <Icon name="file-text" size={12}/> <span style={{marginLeft:5}}>Copy Markdown</span>
            </button>
            <span style={{width:1, alignSelf:"stretch", background:"var(--rule)", margin:"0 4px"}} />
            <button onClick={() => downloadBlob(jsonString, "application/json", `pieces-answer-${tsSlug}.json`)} className="btn btn-paper" style={{padding:"7px 14px", fontSize:12}}>
              <Icon name="external-link" size={12}/> <span style={{marginLeft:5}}>JSON</span>
            </button>
            <button onClick={() => downloadBlob(markdownString, "text/markdown", `pieces-answer-${tsSlug}.md`)} className="btn btn-paper" style={{padding:"7px 14px", fontSize:12}}>
              <Icon name="external-link" size={12}/> <span style={{marginLeft:5}}>Markdown</span>
            </button>
          </div>
          <button onClick={dismiss} style={{
            padding:"8px 22px", fontSize:12, fontWeight:500,
            background:"var(--ink)", color:"var(--paper)",
            border:0, borderRadius:999, cursor:"pointer",
            letterSpacing:"0.04em",
          }}>
            Close
          </button>
        </div>

        {toast && <div className="deck-modal-toast">{toast}</div>}
      </div>
    </div>
  );
}

// Inline grounding footer for Rodbot/Chat replies. Sage tone, italic
// Newsreader quote, expand-to-see-more. Surfaces the temporal continuity
// that informed Rodbot's answer right next to the reply itself — so the
// demo audience sees the Pieces wire actually working, not just hidden
// in a system-prompt block.
function PiecesGroundingFooter({ grounding }) {
  const [open, setOpen] = useState(false);
  const payload = useMemo(() => _normalizePieces(grounding && grounding.raw, grounding && grounding.data), [grounding]);
  if (!grounding || !grounding.raw) return null;

  // Build a one-line summary: people in the loop OR the start of the TLDR.
  let teaser = "";
  if (payload.kind === "structured") {
    const people = (payload.people || []).slice(0, 4).map(p => p.name).join(" · ");
    const tldr = payload.summaries && payload.summaries[0] && payload.summaries[0].tldr;
    teaser = people ? `${people}` : (tldr ? tldr.slice(0, 120) + "…" : "");
  } else {
    teaser = (grounding.raw || "").trim().split("\n")[0].slice(0, 140);
  }

  return (
    <div style={{
      marginTop:14, borderRadius:10, overflow:"hidden",
      background:"var(--sage-bg)", color:"var(--sage-ink)",
      border:"1px solid color-mix(in oklab, var(--sage-ink) 12%, transparent)",
    }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        width:"100%", padding:"10px 14px", background:"transparent",
        border:0, cursor:"pointer", color:"inherit", textAlign:"left",
      }}>
        <div style={{display:"flex", alignItems:"center", gap:10, minWidth:0, flex:1}}>
          <span className="dot-tone dot-sage" />
          <span style={{
            fontFamily:"var(--font-mono)", fontSize:9, letterSpacing:"0.1em",
            textTransform:"uppercase", opacity:0.78, flexShrink:0,
          }}>
            from your activity
          </span>
          <span style={{
            fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:12.5,
            opacity:0.92, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis",
            whiteSpace:"nowrap", minWidth:0,
          }}>
            {teaser}
          </span>
        </div>
        <span style={{
          fontFamily:"var(--font-mono)", fontSize:9, letterSpacing:"0.05em",
          textTransform:"uppercase", opacity:0.6, flexShrink:0, marginLeft:10,
        }}>
          {open ? "hide" : "show"} {grounding.model && `· ${grounding.model}`}
        </span>
      </button>
      {open && (
        <div style={{padding:"6px 14px 14px", borderTop:"1px solid color-mix(in oklab, var(--sage-ink) 12%, transparent)"}}>
          <PiecesPayloadView raw={grounding.raw} data={grounding.data} compact />
        </div>
      )}
    </div>
  );
}

function PiecesActivityScreen({ go }) {
  const [sweeps, setSweeps] = useState([]);
  const [activeTs, setActiveTs] = useState(null);
  const [activeBody, setActiveBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [sweepBusy, setSweepBusy] = useState(false);
  const [askDraft, setAskDraft] = useState("");
  const [askBusy, setAskBusy] = useState(false);
  const [askResult, setAskResult] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [answerModalOpen, setAnswerModalOpen] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");

  const loadList = async () => {
    setLoading(true);
    try {
      const [sweepsR, statusR, latestR] = await Promise.all([
        fetch("/api/pieces/sweeps").then(r => r.json()).catch(() => null),
        fetch("/api/pieces/status").then(r => r.json()).catch(() => null),
        fetch("/api/pieces/sweeps/latest").then(r => r.json()).catch(() => null),
      ]);
      if (sweepsR && sweepsR.ok) {
        const list = [...(sweepsR.sweeps || [])].reverse();
        setSweeps(list);
        const latestTs = list[0] && list[0].ts;
        if (latestTs && !activeTs) {
          setActiveTs(latestTs);
          if (latestR && latestR.latest) setActiveBody(latestR.latest.raw || "");
        }
      }
      if (statusR) setStatus(statusR);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadList(); }, []);

  const sweepNow = async () => {
    setSweepBusy(true);
    try {
      const r = await fetch("/api/pieces/sweep", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ since: activeTs || null, chat_llm: getPiecesModel() }),
      });
      const j = await r.json();
      if (j && j.ok) {
        setActiveTs(j.sweep.ts);
        setActiveBody(j.sweep.raw || "");
        await loadList();
      } else {
        alert("Sweep failed: " + (j && j.error || "unknown"));
      }
    } catch (e) { alert("Sweep failed: " + e.message); }
    finally { setSweepBusy(false); }
  };

  const askPieces = async (prefill) => {
    const q = (prefill !== undefined ? prefill : askDraft).trim();
    if (!q) return;
    setAskBusy(true); setAskResult(null);
    if (prefill !== undefined) setAskDraft(prefill);
    setLastQuestion(q);
    try {
      const r = await fetch("/api/pieces/ask", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ question: q, chat_llm: getPiecesModel() }),
      });
      const j = await r.json();
      if (j && j.ok) {
        setAskResult({ ok: true, raw: j.raw || "", data: j.data, model: j.model });
        // Open the answer in the modal — the page stays uncluttered.
        setAnswerModalOpen(true);
      } else {
        setAskResult({ ok: false, error: (j && j.error) || "failed" });
      }
    } catch (e) {
      setAskResult({ ok: false, error: e.message });
    } finally { setAskBusy(false); }
  };

  const fmtTime = (iso) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso; }
  };
  const sinceWord = (iso) => {
    if (!iso) return "";
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const m = Math.round(diff / 60000);
      if (m < 1) return "just now";
      if (m < 60) return `${m}m ago`;
      const h = Math.round(m / 60);
      if (h < 24) return `${h}h ago`;
      const d = Math.round(h / 24);
      return `${d}d ago`;
    } catch { return ""; }
  };

  // Parse the active body. Returns { ok, summaries, events, error } —
  // when the raw isn't JSON we fall back to plaintext display.
  const parsed = useMemo(() => {
    if (!activeBody) return { ok: false };
    try {
      const j = JSON.parse(activeBody);
      const summaries = Array.isArray(j.summaries) ? j.summaries.map(s => ({
        id: (s && s.id) || Math.random().toString(36).slice(2),
        score: s && s.score,
        created: (s && s.range && s.range.created && s.range.created.readable) || null,
        from: (s && s.range && s.range.from && s.range.from.readable) || null,
        to:   (s && s.range && s.range.to   && s.range.to.readable)   || null,
        ...parsePiecesSummary(s && s.combined_string),
      })) : [];
      const events = Array.isArray(j.events) ? j.events.map(e => ({
        id: (e && e.id) || Math.random().toString(36).slice(2),
        score: e && e.score,
        url: e && e.browser_url,
        app: e && e.app_title,
        window: e && e.window_title,
        ...parsePiecesEvent(e && e.combined_string),
      })) : [];
      return { ok: true, summaries, events, raw: activeBody };
    } catch (err) {
      return { ok: false, raw: activeBody };
    }
  }, [activeBody]);

  // Distinct people mentioned across all events — surfaced as chips at the top.
  const peopleAcrossEvents = useMemo(() => {
    if (!parsed.ok) return [];
    const seen = new Map();
    for (const ev of (parsed.events || [])) {
      for (const p of (ev.people || [])) {
        const key = p.toLowerCase();
        seen.set(key, (seen.get(key) || 0) + 1);
      }
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({
      name: name.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" "),
      count,
    }));
  }, [parsed]);

  const totalEvents = (parsed.ok && parsed.events && parsed.events.length) || 0;
  const totalSummaries = (parsed.ok && parsed.summaries && parsed.summaries.length) || 0;

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">activity · pieces ltm · ambient context</div>
          <h1 style={{fontFamily:"var(--font-display)"}}>Everything you've actually been doing.</h1>
          <div className="lede" style={{fontSize:15, marginTop:6, color:"var(--ink-4)"}}>
            Workstream summaries and ambient capture, gathered every hour, rendered in plain English.
          </div>
        </div>
        <div className="meta" style={{display:"flex", gap:14, alignItems:"center", flexWrap:"wrap"}}>
          {status && (
            <span className="state" style={{
              background: status.available ? "var(--st-shipped-bg)" : "var(--st-blocked-bg)",
              color:      status.available ? "var(--st-shipped-ink)" : "var(--st-blocked-ink)",
              border:     status.available ? "1px solid #8DB58A" : "none",
            }}>
              {status.available ? "pieces · connected" : "pieces · offline"}
            </span>
          )}
          <span style={{fontSize:11, color:"var(--ink-4)", letterSpacing:"0.04em"}}>
            <b style={{color:"var(--ink)"}}>sweeps</b> {sweeps.length}
          </span>
          {sweeps[0] && (
            <span style={{fontSize:11, color:"var(--mint-ink)", letterSpacing:"0.04em"}}>
              <b>latest</b> {sinceWord(sweeps[0].ts)}
            </span>
          )}
        </div>
      </div>

      {/* ── Ask ribbon — deck-prominent ────────────────────────────────── */}
      <div style={{
        background:"var(--card)", border:`1px solid var(--rule)`,
        borderRadius:14, padding:"18px 22px", marginBottom:24,
        boxShadow:"var(--shadow-soft)",
      }}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10}}>
          <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)"}}>
            Ask · 39 tools available
          </div>
          <div style={{fontSize:11, color:"var(--ink-4)", fontFamily:"var(--font-mono)"}}>
            {status && status.url}
          </div>
        </div>
        <div style={{display:"flex", gap:10, alignItems:"center"}}>
          <Icon name="search" size={16}/>
          <input type="text" value={askDraft}
            onChange={(e) => setAskDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") askPieces(); }}
            disabled={askBusy}
            placeholder="Ask Pieces anything — e.g. 'what URLs did I open yesterday afternoon'"
            style={{
              flex:1, padding:"12px 16px", fontSize:14,
              fontFamily:"var(--font-body)", border:"1px solid var(--rule)",
              borderRadius:999, background:"var(--paper)", color:"var(--ink)",
              outline:"none",
            }}/>
          <button className="btn primary" onClick={() => askPieces()} disabled={askBusy || !askDraft.trim()} style={{padding:"10px 22px"}}>
            {askBusy ? "asking…" : "Ask"}
          </button>
          <button className="btn ghost" onClick={sweepNow} disabled={sweepBusy} title="Fire a delta sweep right now">
            {sweepBusy ? "sweeping…" : "↻ Sweep now"}
          </button>
        </div>
        {/* Inline status: only errors land here (short). Successful answers
            open the modal — see <PiecesAnswerModal/> below. If the user
            closed the modal, a quiet "view last answer" pill stays here so
            they can re-open without re-asking. */}
        {askResult && askResult.ok && !answerModalOpen && (
          <div style={{marginTop:14, display:"flex", justifyContent:"flex-end"}}>
            <button onClick={() => setAnswerModalOpen(true)} className="btn btn-paper" style={{
              padding:"7px 16px", fontSize:11.5,
              display:"inline-flex", alignItems:"center", gap:6,
            }}>
              <Icon name="sparkles" size={12}/>
              View last answer · {(askResult.raw || "").length.toLocaleString()} chars
            </button>
          </div>
        )}
        {askResult && !askResult.ok && (
          <div style={{marginTop:14}}>
            <div className="admo admo-rose">
              <div className="icon"><Icon name="alert" size={16}/></div>
              <div>
                <div className="ttl">Error</div>
                <div>{askResult.error}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3-column main: archive | structured body | tools panel ────── */}
      <div style={{display:"grid", gridTemplateColumns:"240px minmax(0, 1fr) 300px", gap:24, alignItems:"start"}}>

        {/* ── Sweep archive ─────────────────────────────────────────── */}
        <div>
          <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)", marginBottom:10}}>
            Sweeps ({sweeps.length})
          </div>
          {loading && <div style={{fontSize:12, color:"var(--ink-4)", fontStyle:"italic"}}>loading…</div>}
          {!loading && sweeps.length === 0 && (
            <div style={{fontSize:12, color:"var(--ink-4)", padding:"14px 0", lineHeight:1.5}}>
              No sweeps yet. Hit ↻ Sweep now — or wait for the hourly background sweep to land.
            </div>
          )}
          <div style={{display:"grid", gap:6, maxHeight:"calc(100vh - 360px)", overflowY:"auto", paddingRight:4}}>
            {sweeps.map((s, i) => {
              const isActive = activeTs === s.ts;
              const isLatest = i === 0;
              return (
                <button key={s.ts} onClick={() => {
                  setActiveTs(s.ts);
                  if (i === 0) {
                    fetch("/api/pieces/sweeps/latest").then(r => r.json()).then(j => {
                      if (j && j.ok && j.latest) setActiveBody(j.latest.raw || "");
                    });
                  } else {
                    setActiveBody("");
                  }
                }}
                  style={{
                    textAlign:"left", padding:"12px 14px", borderRadius:10,
                    border: isActive ? "1.5px solid var(--ink)" : "1px solid var(--rule)",
                    background: isActive ? "var(--card)" : "var(--paper)",
                    cursor:"pointer", color:"var(--ink)",
                    display:"flex", flexDirection:"column", gap:6,
                    boxShadow: isActive ? "var(--shadow-md)" : "none",
                    transition:"all 140ms ease",
                  }}
                >
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}>
                    <span style={{
                      fontFamily:"var(--font-display)", fontSize:15,
                      fontWeight: isLatest ? 500 : 400, color:"var(--ink)",
                      letterSpacing:"-0.01em",
                    }}>{fmtTime(s.ts)}</span>
                    {isLatest && (
                      <span className="state state-shipped" style={{padding:"2px 8px"}}>Latest</span>
                    )}
                  </div>
                  <div style={{fontSize:11, color:"var(--ink-4)", fontFamily:"var(--font-mono)", letterSpacing:"0.02em"}}>
                    {sinceWord(s.ts)} · {Math.round((s.bytes || 0)/100)/10}kb
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Structured body ───────────────────────────────────────── */}
        <div style={{minHeight:320}}>
          {!activeTs ? (
            <div className="admo admo-paper" style={{padding:"40px"}}>
              <div className="icon"><Icon name="search" size={18}/></div>
              <div>
                <div className="ttl">No sweep selected</div>
                <p>Pick a sweep from the left, or fire a fresh one with <b>↻ Sweep now</b>.</p>
              </div>
            </div>
          ) : !activeBody ? (
            <div className="admo admo-lemon" style={{padding:"24px"}}>
              <div className="icon"><Icon name="clock" size={18}/></div>
              <div>
                <div className="ttl">Historical sweep</div>
                <p>Older sweep bodies live in <code style={{background:"rgba(0,0,0,0.06)", padding:"1px 5px", borderRadius:3, fontFamily:"var(--font-code)"}}>_ledger/pieces_sweeps.jsonl</code>. Ask Rodbot in chat — she sees the full ledger.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header row: timestamp · counts · char count. The raw toggle
                  lives inside <PiecesPayloadView> below so the body and the
                  ask-result share a single source of truth. */}
              <div style={{
                display:"flex", justifyContent:"space-between", alignItems:"baseline",
                marginBottom:18, paddingBottom:14, borderBottom:"1px solid var(--rule)",
              }}>
                <div>
                  <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)"}}>
                    {fmtTime(activeTs)} · {sinceWord(activeTs)}
                  </div>
                  <div style={{fontFamily:"var(--font-display)", fontSize:22, fontWeight:500, letterSpacing:"-0.01em", color:"var(--ink)", marginTop:4}}>
                    {parsed.ok ? (
                      <>{totalSummaries} {totalSummaries === 1 ? "summary" : "summaries"} · {totalEvents} {totalEvents === 1 ? "event" : "events"}</>
                    ) : (
                      "Activity sweep"
                    )}
                  </div>
                </div>
                <span style={{fontSize:11, color:"var(--ink-4)", fontFamily:"var(--font-mono)"}}>
                  {activeBody.length.toLocaleString()} chars
                </span>
              </div>

              <PiecesPayloadView raw={activeBody} />
            </>
          )}
        </div>

        {/* ── Pieces tools panel ────────────────────────────────────── */}
        <div>
          <div style={{
            display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10,
          }}>
            <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)"}}>
              Pieces toolkit · 39
            </div>
            <button className="btn ghost" onClick={() => setToolsOpen(v => !v)} style={{fontSize:10, padding:"4px 8px"}}>
              {toolsOpen ? "collapse" : "expand"}
            </button>
          </div>
          {toolsOpen && (
            <div style={{display:"grid", gap:14, maxHeight:"calc(100vh - 360px)", overflowY:"auto", paddingRight:4}}>
              {PIECES_TOOLS.map(group => (
                <div key={group.group} className={`card-tone card-${group.tone}`} style={{padding:"14px 16px"}}>
                  <div style={{
                    display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10,
                  }}>
                    <span style={{fontFamily:"var(--font-display)", fontSize:18, fontWeight:500, letterSpacing:"-0.01em"}}>
                      {group.group}
                    </span>
                    <span className={`dot-tone dot-${group.tone}`} />
                  </div>
                  <div style={{display:"grid", gap:6}}>
                    {group.items.map(t => (
                      <button key={t.name} onClick={() => askPieces(`Use ${t.name}: ${t.hint}`)}
                        title={t.hint}
                        style={{
                          textAlign:"left", padding:"6px 8px", borderRadius:6,
                          background:"rgba(255,255,255,0.35)", border:"1px solid currentColor",
                          fontFamily:"var(--font-mono)", fontSize:10.5, color:"inherit",
                          cursor:"pointer", letterSpacing:"0.01em", lineHeight:1.3,
                          display:"block", width:"100%",
                        }}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="admo admo-paper" style={{padding:"12px 14px"}}>
                <div className="icon"><Icon name="terminal" size={14}/></div>
                <div>
                  <div className="ttl" style={{fontSize:10}}>Wire to Claude Code</div>
                  <code style={{
                    display:"block", fontSize:10.5, fontFamily:"var(--font-code)",
                    background:"var(--ink)", color:"var(--paper)", padding:"8px 10px",
                    borderRadius:6, marginTop:6, lineHeight:1.4, wordBreak:"break-all",
                  }}>
                    claude mcp add --transport http pieces http://localhost:39300/model_context_protocol/2025-03-26/mcp
                  </code>
                  <p style={{fontSize:11, marginTop:8, color:"var(--ink-4)"}}>
                    Run once. Future delegations inherit the toolkit. See CLAUDE.md → Pieces MCP.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pieces answer modal — opens automatically on a successful Ask. */}
      <PiecesAnswerModal
        open={answerModalOpen && askResult && askResult.ok}
        onClose={() => setAnswerModalOpen(false)}
        question={lastQuestion}
        raw={askResult && askResult.raw}
        data={askResult && askResult.data}
        model={askResult && askResult.model}
      />
    </div>
  );
}

// ═══════════════════ SHARED DETAIL-PAGE CHROME ═══════════════════
// Card-on-paper layout used by Commitment Detail + Inbox Detail + any future
// detail page. Keeps section headings, dividers, and the audit-timeline look
// consistent so the app feels like one piece instead of a dozen.
function DetailLayout({ kicker, title, subtitle, meta, onBack, children }) {
  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">{kicker}</div>
          <h1>{title}</h1>
          {subtitle && <div style={{fontSize:13, color:"var(--ink-4)", marginTop:2}}>{subtitle}</div>}
        </div>
        {meta && <div className="meta">{meta}</div>}
      </div>
      <div style={{display:"flex", gap:8, marginBottom:16}}>
        <button className="btn ghost" onClick={onBack}>← back</button>
      </div>
      <div style={{display:"grid", gap:16}}>{children}</div>
    </div>
  );
}

function DetailSection({ title, right, children }) {
  // §5 header polish — small caps, 12px, weight 500, letter-spacing 0.10em,
  // color at ~55% ink. Hairline rule below at ~8% opacity (var --rule is
  // already 8%). Background tint dropped so the header rides on card paper.
  return (
    <div style={{
      border:"1px solid var(--rule-2)", borderRadius:10,
      background:"var(--paper-card)", boxShadow:"var(--shadow-soft)",
      overflow:"hidden",
    }}>
      {title && (
        <div style={{
          padding:"12px 16px", borderBottom:"1px solid var(--rule)",
          display:"flex", justifyContent:"space-between", alignItems:"center",
          fontSize:12, textTransform:"uppercase", letterSpacing:"0.10em",
          fontWeight:500,
          color:"color-mix(in oklab, var(--ink) 55%, transparent)",
          fontFamily:"var(--font-mono)",
          background:"var(--paper-card)",
        }}>
          <span>{title}</span>
          {right && <div>{right}</div>}
        </div>
      )}
      <div style={{padding:"14px 18px"}}>{children}</div>
    </div>
  );
}

// Audit timeline reads /api/ledger/activity, filters events related to a
// subject (match by any of: related_id, target, cellId, request_id, or a
// substring of the subject headline in notes/detail fields), renders a
// chronological bullet list with kind, timestamp, and a short note.
function AuditTimeline({ filters }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("/api/ledger/activity").then(r => r.ok ? r.json() : null).then(j => {
      if (!j) return;
      const all = j.events || [];
      const match = (e) => filters.some(f => {
        if (typeof f === "string") {
          const hay = JSON.stringify(e).toLowerCase();
          return hay.includes(f.toLowerCase());
        }
        return false;
      });
      setEvents(all.filter(match).sort((a,b) => (b.ts || b.t || "").localeCompare(a.ts || a.t || "")));
    }).finally(() => setLoading(false));
  }, [filters.join("·")]);

  const fmt = (iso) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleString(undefined, { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }); }
    catch { return iso; }
  };

  if (loading) return <div style={{fontSize:12, color:"var(--ink-4)"}}>reading activity ledger…</div>;
  if (!events.length) return <div style={{fontSize:12, color:"var(--ink-4)", fontStyle:"italic"}}>No audit events for this item yet.</div>;

  // §7 Audit log polish — this is the quiet hero of the page.
  //  • Monospace timestamps at 50% ink opacity.
  //  • Tag pills carry a 2px left-edge accent bar in the event-color taxonomy
  //    (DELEGATION_WRITE → neutral --event-edit; COMMIT/OPEN/GENERATE/LEAN/EDIT
  //    → their respective colors). The bar is an accent, not a fill.
  //  • 1px vertical rule on the left at 8% opacity establishes the audit as a
  //    stream, not a table. Rows indent 16px from the rule.
  //  • Row height 32px — log data wants density; no zebra stripes needed.
  return (
    <div style={{
      position:"relative",
      paddingLeft:17,
      borderLeft:"1px solid color-mix(in oklab, var(--ink) 8%, transparent)",
      display:"grid", gap:0,
      fontFamily:"var(--font-body)", fontSize:11.5,
    }}>
      {events.map((e, i) => {
        const ts = e.ts || e.t;
        const kind = e.kind || e.type || "event";
        const summary = e.notes || e.action || e.summary || e.detail || "";
        const evColor = eventColorFor(kind);
        return (
          <div key={i} style={{
            display:"grid", gridTemplateColumns:"120px 160px 1fr", gap:10, alignItems:"center",
            minHeight:32, padding:"0",
            borderBottom: i === events.length-1 ? "none" : "1px dashed var(--rule)",
          }}>
            <span style={{
              fontFamily:"ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
              fontSize:11,
              color:"color-mix(in oklab, var(--ink) 50%, transparent)",
            }}>{fmt(ts)}</span>
            <span style={{
              position:"relative",
              padding:"3px 8px 3px 10px",
              borderRadius:4,
              background:`var(--event-${evColor}-tint)`,
              color:`var(--event-${evColor})`,
              fontSize:11, textTransform:"uppercase", letterSpacing:"0.05em",
              fontWeight:600, width:"fit-content", lineHeight:1.3,
              borderLeft:`2px solid var(--event-${evColor})`,
            }}>{kind}</span>
            <span style={{
              color:"var(--ink-2)", fontFamily:"var(--font-body)",
              fontSize:12.5, lineHeight:1.4, wordBreak:"break-word",
            }}>
              {summary}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════ COMMITMENT DETAIL ═══════════════════
function CommitmentDetailScreen({ go, commitmentId, commitments, demoMode, onUpdate, onRemove, onSend, onCancel, onRegenerate }) {
  const c = commitments.find(x => x.id === commitmentId);
  const [editing, setEditing] = useState(false);
  const [edits, setEdits] = useState(null);

  useEffect(() => {
    if (editing && c && !edits) {
      setEdits({ subject: c.subject || "", body: c.body || "", target: c.target || "", channel: c.channel || "note" });
    }
  }, [editing, c]);

  if (!c) {
    return (
      <DetailLayout kicker="commitment not found" title="Couldn't find that commitment." onBack={() => go.back()}>
        <div style={{fontSize:12, color:"var(--ink-4)"}}>
          It may have been sent, canceled, or deleted. Head back to the commitments list.
        </div>
      </DetailLayout>
    );
  }

  const fmt = (iso) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleString(undefined, { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }); }
    catch { return iso; }
  };

  const STATUS_LABELS = { pending:"pending", sending:"sending", sent:"sent", failed:"failed", canceled:"canceled" };
  // §3 status dot colors (no more orange blob). event-edit = neutral pending,
  // event-commit = shipped, event-lean = failed. Sending/canceled reuse the
  // edit neutral since they're in-flight or reversed-out states.
  const statusDotColor = {
    pending:  "var(--event-edit)",
    sending:  "var(--event-edit)",
    sent:     "var(--event-commit)",
    failed:   "var(--event-lean)",
    canceled: "var(--event-edit)",
  };

  // §3 coherent status strip — `●  pending  ·  channel slack` format. Small
  // caps, letter-spaced ~0.08em, right-aligned. Dot carries the status, not
  // a pill fill. Target folded in when present so it stays visible.
  const meta = (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      fontSize:11.5, textTransform:"uppercase", letterSpacing:"0.08em",
      color:"color-mix(in oklab, var(--ink) 65%, transparent)",
      fontFamily:"var(--font-mono)",
    }}>
      <span style={{
        display:"inline-block", width:8, height:8, borderRadius:"50%",
        background: statusDotColor[c.status] || "var(--event-edit)",
        flexShrink:0,
      }}/>
      <span>{STATUS_LABELS[c.status] || c.status}</span>
      {c.channel && <>
        <span style={{color:"color-mix(in oklab, var(--ink) 25%, transparent)"}}>·</span>
        <span>channel {c.channel}</span>
      </>}
      {c.target && <>
        <span style={{color:"color-mix(in oklab, var(--ink) 25%, transparent)"}}>·</span>
        <span>{c.target}</span>
      </>}
    </div>
  );

  const filterKeys = [c.id];
  if (c.source && c.source.cellId) filterKeys.push(c.source.cellId);
  if (c.source && c.source.gridId) filterKeys.push(c.source.gridId);
  if (c.subject) filterKeys.push(c.subject);

  // §2 Rodbot mark in the kicker — placed directly after the grid-source
  // phrase ("from <gridId>") because Rodbot authored this commitment during
  // the morning grid generation. At 60% opacity it reads as authorship
  // metadata, not decoration.
  const kickerContent = c.source ? (
    <>
      <span>commitment · from {c.source.gridId}</span>
      <RodbotMark style={{marginLeft:4, marginRight:2}}/>
      <span> · cell {c.source.cellId} · queued {fmt(c.createdAt)}</span>
    </>
  ) : (
    <>commitment · manual · queued {fmt(c.createdAt)}</>
  );

  return (
    <DetailLayout
      kicker={kickerContent}
      title={c.subject || (c.source && c.source.headline) || "(untitled commitment)"}
      subtitle={c.source && c.source.headline && c.subject !== c.source.headline ? `Grid headline: ${c.source.headline}` : null}
      meta={meta}
      onBack={() => go.back()}
    >
      <DetailSection
        title={editing ? "Edit draft" : "Draft"}
        right={!editing && c.status === "pending" && (
          <button className="btn ghost" style={{fontSize:11, padding:"4px 10px"}} onClick={() => setEditing(true)}>Edit draft</button>
        )}
      >
        {editing && edits ? (
          // §5 form rhythm — field labels at 11px / 500 / 0.08em, inputs on
          // the unified .detail-input class (6px radius, 8% border, focus
          // ring in --event-open navy). Target now has a placeholder so a
          // blank labeled field teaches something.
          (() => {
            const labelStyle = {fontSize:11, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-4)", fontWeight:500};
            return (
              <div style={{display:"grid", gap:14}}>
                <ChannelPicker value={edits.channel} onChange={(ch) => setEdits(e => ({...e, channel: ch}))} />
                <label style={{display:"grid", gap:4}}>
                  <span style={labelStyle}>Subject / headline</span>
                  <input
                    type="text"
                    className="detail-input"
                    value={edits.subject}
                    onChange={ev => setEdits(e => ({...e, subject: ev.target.value}))}
                  />
                </label>
                <label style={{display:"grid", gap:4}}>
                  <span style={labelStyle}>Target</span>
                  <input
                    type="text"
                    className="detail-input mono"
                    placeholder={targetPlaceholderFor(edits.channel) || "#channel, @user, or email"}
                    value={edits.target}
                    onChange={ev => setEdits(e => ({...e, target: ev.target.value}))}
                  />
                </label>
                <label style={{display:"grid", gap:4}}>
                  <span style={labelStyle}>Body</span>
                  <textarea
                    className="detail-input body"
                    value={edits.body}
                    onChange={ev => setEdits(e => ({...e, body: ev.target.value}))}
                    rows={10}
                  />
                </label>
                <div style={{display:"flex", gap:8}}>
                  <button className="btn primary" onClick={() => { onUpdate(c.id, edits); setEditing(false); setEdits(null); }}>Save edits</button>
                  <button className="btn ghost" onClick={() => { setEditing(false); setEdits(null); }}>Cancel</button>
                </div>
              </div>
            );
          })()
        ) : (
          <div style={{display:"grid", gap:12}}>
            {c.drafting && (
              <div style={{fontSize:12, color:"var(--ink-4)", fontStyle:"italic"}}>AI is drafting the message in your voice…</div>
            )}
            {c.draftError && (
              <div style={{fontSize:12, color:"var(--alarm)"}}>Draft failed: {c.draftError} — try Regenerate.</div>
            )}
            <div style={{fontSize:13.5, color:"var(--ink-2)", fontFamily:"var(--font-display)", lineHeight:1.7}}>
              {c.body ? <Markdown text={c.body}/> : <em style={{color:"var(--ink-4)"}}>(no body yet — click Regenerate to draft)</em>}
            </div>
            {(c.why_channel || (c.voice_check && c.voice_check.length)) && (
              <div style={{padding:"10px 12px", background:"color-mix(in oklab, var(--ember) 8%, var(--paper))", border:"1px solid var(--rule)", borderRadius:4, fontSize:11, color:"var(--ink-3)", display:"grid", gap:6}}>
                {c.why_channel && <div><b style={{color:"var(--ink-2)"}}>Channel:</b> {c.why_channel}</div>}
                {c.voice_check && c.voice_check.length > 0 && (
                  <div><b style={{color:"var(--ink-2)"}}>Voice check:</b> {c.voice_check.join(" · ")}</div>
                )}
              </div>
            )}
          </div>
        )}
      </DetailSection>

      {!editing && (
        <DetailSection title="Actions">
          <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
            {c.status === "pending" && (
              <>
                <button className="btn primary" onClick={() => onSend(c.id)} disabled={!!c.drafting}>
                  {demoMode ? "Send (demo · simulated)" : "Send now"}
                </button>
                <button className="btn" onClick={() => setEditing(true)} disabled={!!c.drafting}>Edit</button>
                {onRegenerate && (
                  <button className="btn ghost" onClick={() => onRegenerate(c.id)} disabled={!!c.drafting}>
                    {c.drafting ? "Drafting…" : c.body ? "Regenerate draft" : "Draft with AI"}
                  </button>
                )}
                <button className="btn ghost" onClick={() => onCancel(c.id)}>Cancel</button>
                <button className="btn alarm" style={{marginLeft:"auto"}} onClick={() => { onRemove(c.id); go.back(); }}>Delete</button>
              </>
            )}
            {c.status === "failed" && (
              <>
                <button className="btn primary" onClick={() => { onUpdate(c.id, { status: "pending", result: null }); }}>Retry (requeue)</button>
                <button className="btn" onClick={() => setEditing(true)}>Edit</button>
                {onRegenerate && <button className="btn ghost" onClick={() => onRegenerate(c.id)}>Regenerate draft</button>}
                <button className="btn alarm" style={{marginLeft:"auto"}} onClick={() => { onRemove(c.id); go.back(); }}>Delete</button>
              </>
            )}
            {(c.status === "sent" || c.status === "canceled") && (
              <button className="btn ghost" onClick={() => { onRemove(c.id); go.back(); }}>Remove from list</button>
            )}
          </div>
        </DetailSection>
      )}

      <DetailSection title="Audit — what happened with this commitment">
        <AuditTimeline filters={filterKeys}/>
      </DetailSection>
    </DetailLayout>
  );
}

// ═══════════════════ INBOX DETAIL ═══════════════════
function InboxDetailScreen({ go, entryId }) {
  const INBOX = window.SecretaryInbox;
  const [entries, setEntries] = useState(() => (INBOX ? INBOX.entries() : []));
  useEffect(() => {
    if (!INBOX) return;
    return INBOX.subscribe((list) => setEntries([...list]));
  }, []);
  const e = entries.find(x => x.id === entryId);
  const fmt = (iso) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleString(undefined, { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }); }
    catch { return iso; }
  };

  if (!e) {
    return (
      <DetailLayout kicker="inbox entry not found" title="Couldn't find that entry." onBack={() => go.back()}>
        <div style={{fontSize:12, color:"var(--ink-4)"}}>It may have been dismissed or swept away.</div>
      </DetailLayout>
    );
  }

  const statusPill = (s) => {
    const map = { open:"peach", swept:"mint", dismissed:"neutral" };
    const accent = map[s] || "neutral";
    return <span style={{
      background:`var(--pastel-${accent})`, color:`var(--pastel-${accent}-ink)`,
      padding:"3px 10px", borderRadius:999, fontSize:10, fontWeight:700,
      textTransform:"uppercase", letterSpacing:"0.06em",
    }}>{s}</span>;
  };

  const meta = (
    <>
      {statusPill(e.status)}
      <span><b>kind</b> {e.kind}</span>
      <span><b>created</b> {fmt(e.t)}</span>
    </>
  );

  const filterKeys = [e.id];
  if (e.text && e.text.length > 20) filterKeys.push(e.text.slice(0, 40));
  if (e.source && e.source.cellId) filterKeys.push(e.source.cellId);

  return (
    <DetailLayout
      kicker={`inbox · ${e.kind} · ${e.source && e.source.screen ? `from ${e.source.screen}` : "raw"}`}
      title={(e.text || "").split("\n")[0].slice(0, 80) || "(empty entry)"}
      meta={meta}
      onBack={() => go.back()}
    >
      <DetailSection title="Content">
        <div style={{fontSize:13.5, color:"var(--ink-2)", fontFamily:"var(--font-display)", lineHeight:1.7, whiteSpace:"pre-wrap"}}>
          <Markdown text={e.text || ""}/>
        </div>
      </DetailSection>

      {(e.source || e.meta || e.swept_into || e.swept_note) && (
        <DetailSection title="Metadata">
          <div style={{display:"grid", gap:6, fontSize:12, color:"var(--ink-3)", fontFamily:"var(--font-mono)"}}>
            {e.source && Object.entries(e.source).map(([k,v]) => (
              <div key={k}><b style={{color:"var(--ink-2)"}}>source.{k}:</b> {typeof v === "object" ? JSON.stringify(v) : String(v)}</div>
            ))}
            {e.meta && Object.entries(e.meta).map(([k,v]) => (
              <div key={k}><b style={{color:"var(--ink-2)"}}>meta.{k}:</b> {typeof v === "object" ? JSON.stringify(v) : String(v)}</div>
            ))}
            {e.swept_into && e.swept_into.length > 0 && <div><b style={{color:"var(--ink-2)"}}>swept into:</b> {e.swept_into.join(", ")}</div>}
            {e.swept_note && <div><b style={{color:"var(--ink-2)"}}>swept note:</b> {e.swept_note}</div>}
          </div>
        </DetailSection>
      )}

      {e.status === "open" && (
        <DetailSection title="Actions">
          <div style={{display:"flex", gap:8}}>
            <button className="btn ghost" onClick={() => { INBOX.dismiss(e.id); go.back(); }}>Dismiss</button>
          </div>
        </DetailSection>
      )}

      <DetailSection title="Audit — what happened with this entry">
        <AuditTimeline filters={filterKeys}/>
      </DetailSection>
    </DetailLayout>
  );
}

// ═══════════════════ EDIT WITH RODBOT — in-place overlay panel ═══════════════════
// Replaces the tab-hop behavior. Clicking "Edit with Rodbot" from a cell's
// context menu opens this panel over the grid. Left: the block being edited,
// markdown-rendered. Right: a focused chat with Rodbot pinned to that block.
// Actions at the bottom: apply rewrite, retire, close.
function EditWithRodbotOverlay({ cell, gridId, onClose, onRewriteApplied, onRetire }) {
  const [messages, setMessages] = useState(() => [
    { role: "system", content: `You are editing this grid block:\n\nHEADLINE: ${cell.headline}\n${cell.preview ? "PREVIEW: " + cell.preview + "\n" : ""}${cell.detail ? "DETAIL: " + cell.detail + "\n" : ""}\nThe user wants to sharpen it. Reply in your voice. When you propose a rewrite, wrap it in <rewrite>…</rewrite> tags so the UI can offer to apply it.` },
    { role: "assistant", content: `Looking at this one: **"${cell.headline}"**. What's off — too wordy, wrong framing, not the right move right now? Tell me and I'll sharpen or kill it.` },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  const send = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setDraft("");
    setBusy(true);
    try {
      if (!window.SecretaryAI) { throw new Error("AI not configured"); }
      const instructions = next.find(m => m.role === "system").content;
      const convo = next.filter(m => m.role !== "system").map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
      const res = await window.SecretaryAI.respond({ input: convo, instructions });
      setMessages(m => [...m, { role: "assistant", content: (res && res.text) || "(empty reply)" }]);
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally { setBusy(false); }
  };

  // Pull latest <rewrite>…</rewrite> from assistant messages; offer to apply.
  const lastRewrite = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role !== "assistant") continue;
      const m = messages[i].content.match(/<rewrite>([\s\S]*?)<\/rewrite>/);
      if (m) return m[1].trim();
    }
    return null;
  })();

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:300,
      background:"color-mix(in oklab, var(--ink) 40%, transparent)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"36px 32px",
    }}>
      <div style={{
        background:"var(--paper-card)", border:"1px solid var(--rule-2)", borderRadius:12,
        boxShadow:"0 24px 64px rgba(29,31,39,0.28)", overflow:"hidden",
        width:"min(1080px, 96vw)", maxHeight:"92vh",
        display:"grid", gridTemplateColumns:"minmax(320px, 38%) 1fr",
      }}>
        {/* Left — the block, markdown-rendered */}
        <div style={{
          borderRight:"1px solid var(--rule)", padding:"22px 24px",
          background:"color-mix(in oklab, var(--ink) 2%, var(--paper-card))",
          overflowY:"auto",
        }}>
          <div style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-4)", marginBottom:10, fontFamily:"var(--font-mono)"}}>
            Editing · grid {gridId} · cell {cell.id}
          </div>
          <div style={{fontFamily:"var(--font-display)", fontSize:22, fontWeight:600, color:"var(--ink)", lineHeight:1.25, letterSpacing:"-0.015em", marginBottom:12}}>
            {cell.headline}
          </div>
          {cell.preview && (
            <div style={{fontFamily:"var(--font-display)", fontSize:14, color:"var(--ink-2)", lineHeight:1.6, marginBottom:14}}>
              <Markdown text={cell.preview}/>
            </div>
          )}
          {cell.detail && (
            <div style={{
              padding:"12px 14px", background:"var(--paper)", border:"1px solid var(--rule)",
              borderRadius:6, fontFamily:"var(--font-display)", fontSize:12.5, color:"var(--ink-3)", lineHeight:1.6,
            }}>
              <div style={{fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-4)", marginBottom:6, fontFamily:"var(--font-mono)"}}>Detail</div>
              <Markdown text={cell.detail}/>
            </div>
          )}
          {lastRewrite && (
            <div style={{marginTop:16}}>
              <div style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ember-deep)", marginBottom:6, fontFamily:"var(--font-mono)"}}>
                Rodbot's proposed rewrite
              </div>
              <div style={{
                padding:"12px 14px", background:"color-mix(in oklab, var(--ember) 8%, var(--paper))",
                border:"1px solid var(--ember)", borderRadius:6,
                fontFamily:"var(--font-display)", fontSize:13, color:"var(--ink)", lineHeight:1.6,
              }}>
                {lastRewrite}
              </div>
              <button className="btn primary" style={{marginTop:10, fontSize:12}} onClick={() => { onRewriteApplied && onRewriteApplied(lastRewrite); onClose(); }}>
                Apply rewrite
              </button>
            </div>
          )}
        </div>

        {/* Right — chat */}
        <div style={{display:"flex", flexDirection:"column", maxHeight:"92vh"}}>
          <div style={{
            padding:"14px 20px", borderBottom:"1px solid var(--rule)",
            display:"flex", justifyContent:"space-between", alignItems:"center",
            background:"var(--paper-card)",
          }}>
            <div style={{fontFamily:"var(--font-display)", fontSize:15, fontWeight:500, color:"var(--ink)"}}>Edit with Rodbot</div>
            <button onClick={onClose} style={{background:"none", border:"none", color:"var(--ink-4)", cursor:"pointer", fontSize:18, lineHeight:1, padding:4}} title="Close">×</button>
          </div>
          <div ref={scrollRef} style={{flex:1, overflowY:"auto", padding:"18px 22px", display:"grid", gap:14}}>
            {messages.filter(m => m.role !== "system").map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                maxWidth:"86%", padding:"10px 14px", borderRadius:10,
                background: m.role === "user" ? "var(--pastel-sky)" : "var(--paper)",
                color: m.role === "user" ? "var(--pastel-sky-ink)" : "var(--ink-2)",
                border: m.role === "user" ? "none" : "1px solid var(--rule)",
                fontFamily:"var(--font-display)", fontSize:13.5, lineHeight:1.6, whiteSpace:"pre-wrap",
              }}>
                <Markdown text={m.content.replace(/<rewrite>[\s\S]*?<\/rewrite>/g, "*(proposed rewrite shown on the left →)*")}/>
              </div>
            ))}
            {busy && <div style={{fontSize:12, color:"var(--ink-4)", fontStyle:"italic"}}>Rodbot is thinking…</div>}
          </div>
          <div style={{padding:"12px 20px", borderTop:"1px solid var(--rule)", background:"var(--paper-card)"}}>
            <textarea
              value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
              placeholder="Tell Rodbot what to sharpen… (⌘/Ctrl+Enter to send)"
              rows={2}
              disabled={busy}
              style={{
                width:"100%", padding:"10px 12px", borderRadius:8, border:"1px solid var(--rule-2)",
                background:"var(--paper)", color:"var(--ink)", fontFamily:"var(--font-body)", fontSize:13,
                lineHeight:1.55, resize:"vertical",
              }}
            />
            <div style={{display:"flex", gap:8, marginTop:8, alignItems:"center"}}>
              <button className="btn primary" onClick={send} disabled={busy || !draft.trim()}>Send</button>
              <button className="btn ghost" onClick={() => { onRetire && onRetire(); onClose(); }}>Retire block</button>
              <span style={{flex:1}}/>
              <button className="btn ghost" onClick={onClose}>Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════ TABLES ══════════════════════════════════
// /tables — Rodbot-assisted table builder.
//
// Flow:  list → new (blank | template | extend) → schema → paste/chat → review → save
// File:  CCAgentindex/tables/<slug>.json
//        { slug, name, schema:[{key,label,type,enum?,required?}], rows:[...],
//          metadata:{ created_at, updated_at, template?, provenance?[] } }
// Server: /api/tables/{list,get,save,delete,add_rows}
//
// Templates ship inline (TABLE_TEMPLATES). Extraction calls SecretaryAI.respond
// with a JSON-only prompt that forces abstention on ambiguous rows.

// ═══════════════════════════ TABLE TEMPLATES ════════════════════════════
// Each template = a living starter: schema + a handful of seed rows so the
// grid is never empty when Rodrigo opens it. `accent` is a visual hint the
// table detail + chart builder use to keep the feel consistent.
//
// Order matters — templates render left-to-right, first row is the gallery.
const TABLE_TEMPLATES = {
  leads: {
    id: "leads", label: "Leads pipeline", kind: "table", accent: "--event-open",
    description: "Every inquiry, every stage, every next step.",
    suggested_name: "Leads pipeline", suggested_slug: "leads_pipeline",
    schema: [
      { key: "client",        label: "Client",         type: "text",   required: true },
      { key: "event_type",    label: "Event type",     type: "enum",   enum: ["wedding", "corporate", "birthday", "other"] },
      { key: "event_date",    label: "Event date",     type: "date" },
      { key: "headcount",     label: "Guests",         type: "number" },
      { key: "quoted",        label: "Quoted ($)",     type: "number" },
      { key: "stage",         label: "Stage",          type: "enum",   enum: ["new", "tasting", "proposal", "won", "lost"] },
      { key: "next_step",     label: "Next step",      type: "text" },
    ],
    sample_rows: [
      { client: "Alvarez / Medeiros", event_type: "wedding",   event_date: "2026-07-18", headcount: 140, quoted: 12400, stage: "tasting",  next_step: "send proposal Mon" },
      { client: "Sandberg Corp",      event_type: "corporate", event_date: "2026-06-02", headcount: 80,  quoted: 6800,  stage: "new",      next_step: "qualify budget" },
      { client: "Liu 50th",           event_type: "birthday",  event_date: "2026-05-24", headcount: 45,  quoted: 3200,  stage: "proposal", next_step: "follow up Fri" },
    ],
  },
  tastings: {
    id: "tastings", label: "Tastings tracker", kind: "table", accent: "--event-generate",
    description: "Who tasted, when, outcome, deposit status.",
    suggested_name: "Tastings tracker", suggested_slug: "tastings_tracker",
    schema: [
      { key: "client",      label: "Client",     type: "text",   required: true },
      { key: "tasting_at",  label: "Tasted on",  type: "date" },
      { key: "attendees",   label: "Attendees",  type: "number" },
      { key: "outcome",     label: "Outcome",    type: "enum",   enum: ["won", "pending", "lost"] },
      { key: "deposit",     label: "Deposit ($)", type: "number" },
      { key: "notes",       label: "Notes",      type: "text" },
    ],
    sample_rows: [
      { client: "Pereira wedding", tasting_at: "2026-04-12", attendees: 4, outcome: "won",     deposit: 2500, notes: "loved the pão de queijo" },
      { client: "Silva corporate", tasting_at: "2026-04-15", attendees: 6, outcome: "pending", deposit: 0,    notes: "decision by Friday" },
      { client: "Rodrigues 40th",  tasting_at: "2026-04-18", attendees: 3, outcome: "won",     deposit: 1500, notes: "add vegan option" },
    ],
  },
  venues: {
    id: "venues", label: "Venue partners", kind: "table", accent: "--event-commit",
    description: "Tiered relationships, events completed, kitchen quirks.",
    suggested_name: "Venue partners", suggested_slug: "venue_partners",
    schema: [
      { key: "name",              label: "Venue",            type: "text",   required: true },
      { key: "tier",              label: "Tier",             type: "enum",   enum: ["A", "B", "C"] },
      { key: "city",              label: "City",             type: "text" },
      { key: "last_event_date",   label: "Last event",       type: "date" },
      { key: "events_completed",  label: "Events",           type: "number" },
      { key: "kitchen_notes",     label: "Kitchen notes",    type: "text" },
    ],
    sample_rows: [
      { name: "Boston Harbor Hotel",  tier: "A", city: "Boston",    last_event_date: "2026-03-22", events_completed: 14, kitchen_notes: "full kitchen, loading dock west side" },
      { name: "Salem Wharf",          tier: "B", city: "Salem",     last_event_date: "2026-02-14", events_completed: 6,  kitchen_notes: "prep only, no hot line" },
      { name: "Cambridge Multicultural Arts", tier: "A", city: "Cambridge", last_event_date: "2026-04-05", events_completed: 11, kitchen_notes: "tight staging — prep off-site" },
    ],
  },
  events: {
    id: "events", label: "Events calendar", kind: "table", accent: "--event-open",
    description: "Upcoming events, venue, headcount, lead.",
    suggested_name: "Events calendar", suggested_slug: "events_calendar",
    schema: [
      { key: "title",       label: "Event",       type: "text",   required: true },
      { key: "event_date",  label: "Date",        type: "date" },
      { key: "venue",       label: "Venue",       type: "text" },
      { key: "headcount",   label: "Guests",      type: "number" },
      { key: "lead",        label: "Point person", type: "text" },
      { key: "status",      label: "Status",      type: "enum", enum: ["booked", "confirmed", "complete", "canceled"] },
    ],
    sample_rows: [
      { title: "Alvarez wedding", event_date: "2026-07-18", venue: "Boston Harbor",   headcount: 140, lead: "Rodrigo", status: "booked" },
      { title: "Sandberg retreat", event_date: "2026-06-02", venue: "Cambridge MAC",  headcount: 80,  lead: "Cathlyn", status: "confirmed" },
    ],
  },
  menu: {
    id: "menu", label: "Menu + pricing", kind: "table", accent: "--event-lean",
    description: "Dishes, cost, price, margin, dietary flags.",
    suggested_name: "Menu pricing", suggested_slug: "menu_pricing",
    schema: [
      { key: "dish",        label: "Dish",        type: "text", required: true },
      { key: "category",    label: "Category",    type: "enum", enum: ["appetizer", "main", "side", "dessert", "beverage"] },
      { key: "cost",        label: "Cost ($)",    type: "number" },
      { key: "price",       label: "Price ($)",   type: "number" },
      { key: "vegan",       label: "Vegan",       type: "boolean" },
      { key: "gluten_free", label: "GF",          type: "boolean" },
      { key: "notes",       label: "Notes",       type: "text" },
    ],
    sample_rows: [
      { dish: "Pão de queijo",  category: "appetizer", cost: 0.80, price: 3.50, vegan: false, gluten_free: true,  notes: "signature bite" },
      { dish: "Feijoada",       category: "main",      cost: 4.20, price: 18.00, vegan: false, gluten_free: true,  notes: "slow-cook, 4hr lead" },
      { dish: "Pudim",          category: "dessert",   cost: 1.20, price: 7.00,  vegan: false, gluten_free: true,  notes: "prep day-of" },
    ],
  },
  staff: {
    id: "staff", label: "Staff roster", kind: "table", accent: "--event-generate",
    description: "Team, role, hours, rate, availability.",
    suggested_name: "Staff roster", suggested_slug: "staff_roster",
    schema: [
      { key: "name",        label: "Name",        type: "text", required: true },
      { key: "role",        label: "Role",        type: "enum", enum: ["chef", "sous", "server", "prep", "driver"] },
      { key: "rate",        label: "Rate ($/h)",  type: "number" },
      { key: "hours_week",  label: "Hrs/week",    type: "number" },
      { key: "phone",       label: "Phone",       type: "text" },
      { key: "status",      label: "Status",      type: "enum", enum: ["active", "on-call", "inactive"] },
    ],
    sample_rows: [
      { name: "Rodrigo Alves",  role: "chef",   rate: 65, hours_week: 45, phone: "617-555-0101", status: "active" },
      { name: "Cathlyn B.",     role: "sous",   rate: 38, hours_week: 40, phone: "617-555-0102", status: "active" },
      { name: "Bibi O.",        role: "server", rate: 24, hours_week: 18, phone: "617-555-0103", status: "on-call" },
    ],
  },
  payments: {
    id: "payments", label: "Payments log", kind: "table", accent: "--event-commit",
    description: "Every deposit, every balance, every reconciliation.",
    suggested_name: "Payments log", suggested_slug: "payments_log",
    schema: [
      { key: "client",     label: "Client",      type: "text",   required: true },
      { key: "paid_at",    label: "Paid on",     type: "date" },
      { key: "amount",     label: "Amount ($)",  type: "number" },
      { key: "kind",       label: "Kind",        type: "enum", enum: ["deposit", "balance", "refund"] },
      { key: "method",     label: "Method",      type: "enum", enum: ["zelle", "check", "card", "cash", "ach"] },
      { key: "reconciled", label: "Reconciled",  type: "boolean" },
    ],
    sample_rows: [
      { client: "Alvarez wedding", paid_at: "2026-04-03", amount: 3100, kind: "deposit", method: "zelle", reconciled: true  },
      { client: "Sandberg Corp",   paid_at: "2026-04-10", amount: 1700, kind: "deposit", method: "card",  reconciled: false },
    ],
  },
  contacts: {
    id: "contacts", label: "Contact list", kind: "table", accent: "--event-edit",
    description: "People, relationships, how to reach them.",
    suggested_name: "Contacts", suggested_slug: "contacts",
    schema: [
      { key: "name",                  label: "Name",              type: "text", required: true },
      { key: "role",                  label: "Role / title",      type: "text" },
      { key: "relationship_weight",   label: "Relationship",      type: "enum", enum: ["close", "warm", "distant"] },
      { key: "preferred_channel",     label: "Preferred channel", type: "enum", enum: ["sms", "email", "whatsapp", "phone"] },
      { key: "notes",                 label: "Notes",             type: "text" },
    ],
    sample_rows: [
      { name: "Maria Alvarez", role: "bride",          relationship_weight: "warm",  preferred_channel: "whatsapp", notes: "texts after 6pm only" },
      { name: "David Sandberg", role: "VP Operations", relationship_weight: "close", preferred_channel: "email",    notes: "CC assistant Tess" },
    ],
  },
};

// ═══════════════════════════ CHART TEMPLATES ════════════════════════════
// 10 distinct chart kinds × 5 multi-tone palettes. Each kind has its own
// shape and rendering personality — no more "same chart, different solid
// color." Palettes draw from the 8-tone deck system so multi-slice charts
// feel like they belong on a Comeketo deliverable.

// ─── PALETTES ──────────────────────────────────────────────────────────
// Each palette is an ordered array of CSS variables. LiveChart will fan
// these across slices for charts where every slice gets its own color
// (donut, pie, treemap, radial, stacked). Single-color charts (line,
// area) use the FIRST color of the active palette as their accent.

const CHART_PALETTES = {
  comeketo: {
    id: "comeketo", label: "Comeketo",
    voice: "The house palette — peach-led, tonal, warm.",
    colors: [
      "--peach-dot", "--sky-dot", "--sage-dot", "--lav-dot",
      "--lemon-dot", "--rose-dot", "--blush-dot", "--mint-dot",
    ],
  },
  cool: {
    id: "cool", label: "Cool",
    voice: "Sky to sage. Calm, considered, professional.",
    colors: ["--sky-dot", "--lav-dot", "--mint-dot", "--sage-dot"],
  },
  warm: {
    id: "warm", label: "Warm",
    voice: "Peach to rose. Inviting, generous, optimistic.",
    colors: ["--peach-dot", "--rose-dot", "--lemon-dot", "--blush-dot"],
  },
  editorial: {
    id: "editorial", label: "Editorial",
    voice: "Ink with quiet tonal steps. The understated read.",
    colors: ["--ink", "--ink-2", "--ink-3", "--ink-4", "--ink-5"],
  },
  bold: {
    id: "bold", label: "Bold",
    voice: "Saturated, contrasty. The presentation-deck look.",
    colors: [
      "--ink", "--peach-dot", "--sky-dot", "--rose-dot",
      "--sage-dot", "--lav-dot", "--lemon-dot",
    ],
  },
};

const CHART_TEMPLATES = {
  bars: {
    id: "bars", label: "Bar chart", kind: "bar",
    description: "Compare a number across categories — venues, stages, sources.",
    needs: { label: ["text", "enum"], value: ["number"] },
    voice: "Ranked, left to right. Top three earn the nod.",
  },
  bars_h: {
    id: "bars_h", label: "Horizontal bars", kind: "bar_h",
    description: "Long category labels, ranked. Reads top-to-bottom.",
    needs: { label: ["text", "enum"], value: ["number"] },
    voice: "Names down the side. The eye moves vertically.",
  },
  lollipop: {
    id: "lollipop", label: "Lollipop", kind: "lollipop",
    description: "Bars but quieter — a thin stem with a confident dot.",
    needs: { label: ["text", "enum"], value: ["number"] },
    voice: "Same data, less ink. Editorial restraint.",
  },
  donut: {
    id: "donut", label: "Donut", kind: "donut",
    description: "Share of a whole — lead sources, event types, categories.",
    needs: { label: ["text", "enum"], value: ["number"] },
    voice: "One slice does most of the work — or all of them share.",
  },
  pie: {
    id: "pie", label: "Pie", kind: "pie",
    description: "Donut without the hole — when totals matter more than the count.",
    needs: { label: ["text", "enum"], value: ["number"] },
    voice: "Whole pie. No center caveats.",
  },
  line: {
    id: "line", label: "Line chart", kind: "line",
    description: "How a number moves over time — revenue, pace, conversion.",
    needs: { label: ["date", "text"], value: ["number"] },
    voice: "Trend with a peak, forecast at the tail.",
  },
  area: {
    id: "area", label: "Area chart", kind: "area",
    description: "Line, but the volume below it gets weight too.",
    needs: { label: ["date", "text"], value: ["number"] },
    voice: "Something accumulated. The quantity matters.",
  },
  kpi: {
    id: "kpi", label: "KPI strip", kind: "kpi",
    description: "Three-to-four numbers, side by side. The dashboard feel.",
    needs: { label: ["text", "enum"], value: ["number"] },
    voice: "At a glance: here's where we stand.",
  },
  tiers: {
    id: "tiers", label: "Tiered grid", kind: "tiers",
    description: "Sort rows into A / B / C tiers — venues or leads by heat.",
    needs: { label: ["text"], value: ["number"] },
    voice: "A-tier up top. The rest earn their way up.",
  },
  stacked: {
    id: "stacked", label: "Stacked bars", kind: "stacked",
    description: "Two or more parts stacked per category — won/lost, paid/open.",
    needs: { label: ["text", "enum"], value: ["number"] },
    voice: "Two-sided at a glance. The ratio tells it.",
  },
  radial: {
    id: "radial", label: "Radial bars", kind: "radial",
    description: "Concentric arcs — a rhythmic alternative to a bar chart.",
    needs: { label: ["text", "enum"], value: ["number"] },
    voice: "From the center out. Biggest ring earns the eye.",
  },
  treemap: {
    id: "treemap", label: "Treemap", kind: "treemap",
    description: "Tiles sized by value — share-of-pie, but legible at scale.",
    needs: { label: ["text", "enum"], value: ["number"] },
    voice: "Area is value. The biggest tile wins the room.",
  },
};

// Deterministic 0..1 from a string — used to pick a stable-but-varied
// palette per chart slug.
function _hash01(s) {
  let h = 2166136261;
  for (let i = 0; i < (s || "").length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return (h % 1000) / 1000;
}

// Resolve a palette → array of CSS color strings (var(--…)). Always returns
// at least one color. `paletteId` may also be a single CSS-var name from
// pre-palette saved charts (backward compat) — in that case we wrap it.
function resolvePalette(paletteId) {
  if (!paletteId) return CHART_PALETTES.comeketo.colors.map(c => `var(${c})`);
  if (paletteId && CHART_PALETTES[paletteId]) {
    return CHART_PALETTES[paletteId].colors.map(c => `var(${c})`);
  }
  // Backward-compat: legacy charts saved with `accent` like "--event-open".
  if (typeof paletteId === "string" && paletteId.startsWith("--")) {
    return [`var(${paletteId})`];
  }
  return CHART_PALETTES.comeketo.colors.map(c => `var(${c})`);
}

// Pick a palette by seed (stable per chart) when the user hasn't chosen one.
function pickPalette(seed) {
  const ids = Object.keys(CHART_PALETTES);
  const n = typeof seed === "number" ? seed : _hash01(String(seed || ""));
  return ids[Math.floor(n * ids.length) % ids.length];
}

function reshuffleSeed() { return Math.random(); }

// Legacy shim — older code paths call pickVariant; preserve the contract
// (returns an object with `.accent` and `.voice`) but synthesize from the
// palette/template now. Saved charts on disk still have a `variant` field;
// that becomes `palette` on save.
function pickVariant(tpl, seed) {
  if (!tpl) return null;
  const palId = pickPalette(seed);
  const pal = CHART_PALETTES[palId] || CHART_PALETTES.comeketo;
  return {
    id: palId,
    accent: pal.colors[0],
    voice: tpl.voice || pal.voice,
  };
}

function slugify(s) {
  return (s || "").toLowerCase().trim()
    .replace(/[^a-z0-9_\- ]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 120) || "untitled";
}

function tableExtractionPrompt({ name, schema, input }) {
  const schemaLines = schema.map(f => {
    const bits = [`- ${f.key} (${f.type}${f.required ? ", required" : ""}`];
    if (f.enum && f.enum.length) bits.push(`; one of: ${f.enum.join(", ")}`);
    bits.push(")");
    return bits.join("") + (f.label ? ` — ${f.label}` : "");
  }).join("\n");
  return [
    `Extract structured rows from the input for a table named "${name}".`,
    `Schema:`,
    schemaLines,
    ``,
    `Rules — strict:`,
    `- Return ONLY valid JSON. No prose. No markdown fences.`,
    `- Shape: {"rows":[{...}],"abstained":[{"text":"...","reason":"..."}]}`,
    `- Each row uses the EXACT schema keys. Unknown keys are ignored.`,
    `- If a field is unknown for a row, OMIT it. NEVER invent values.`,
    `- Enum fields: only the listed values. If ambiguous, abstain.`,
    `- Dates: ISO-8601 YYYY-MM-DD. If only partial, abstain.`,
    `- If a chunk of input does not fit the schema, put the raw text in "abstained" with a one-sentence reason.`,
    ``,
    `Input:`,
    input,
  ].join("\n");
}

function parseExtractionResponse(text) {
  if (!text) return { rows: [], abstained: [], error: "empty response" };
  let s = text.trim();
  // Strip accidental fences
  s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  // Try to locate the first `{` and last `}`
  const first = s.indexOf("{"), last = s.lastIndexOf("}");
  if (first >= 0 && last > first) s = s.slice(first, last + 1);
  try {
    const parsed = JSON.parse(s);
    return {
      rows: Array.isArray(parsed.rows) ? parsed.rows : [],
      abstained: Array.isArray(parsed.abstained) ? parsed.abstained : [],
      error: null,
    };
  } catch (e) {
    return { rows: [], abstained: [], error: "parse failed: " + e.message };
  }
}

// ─── Create-and-go helper ───
// Saves a new table straight to disk using the template (or blank stub) and
// navigates into its detail screen. Rodrigo's flow: pick template → land
// in the spreadsheet ready to type. No paste-dialog detour.
async function _createTableDirect({ template, go }) {
  const tpl = template && TABLE_TEMPLATES[template] ? TABLE_TEMPLATES[template] : null;
  const ts = new Date();
  const baseSlug = tpl ? tpl.suggested_slug : `sheet_${ts.getFullYear()}${String(ts.getMonth()+1).padStart(2,"0")}${String(ts.getDate()).padStart(2,"0")}`;
  // Disambiguate: if slug exists, append -2, -3…
  let slug = baseSlug, n = 1;
  try {
    const list = await fetchJson("/api/tables/list");
    const taken = new Set((list.items || []).map(x => x.slug));
    while (taken.has(slug)) { n += 1; slug = `${baseSlug}_${n}`; }
  } catch {}
  const schema = tpl ? tpl.schema.map(f => ({ ...f })) : [
    { key: "col_a", label: "A", type: "text" },
    { key: "col_b", label: "B", type: "text" },
    { key: "col_c", label: "C", type: "text" },
  ];
  const rows = tpl ? (tpl.sample_rows || []).map(r => ({ ...r })) : [];
  const body = {
    slug, name: tpl ? tpl.suggested_name : "Untitled sheet",
    schema, rows,
    template: tpl ? tpl.id : null,
    metadata: { provenance: [{ source: "template", created_at: new Date().toISOString(), template: tpl ? tpl.id : null }] },
  };
  try {
    const d = await fetchJson("/api/tables/save", {
      method: "POST", body: JSON.stringify(body),
    });
    if (!d.ok) { alert("Could not create table: " + (d.error || "")); return; }
    go.replace("table_detail", { slug });
  } catch (e) {
    alert("Could not create table: " + (e.message || e));
  }
}

// ═══════════════════════════════ INTAKE SCREEN ═══════════════════════════════
// Drop-zone for receipts, invoices, business cards, lists, notes. Flow:
//   1. User drops images (drag-drop, click-to-pick, or ⌘V).
//   2. Each file uploads via /api/attachments/upload.
//   3. /api/intake/classify runs OCR + Rodbot's classifier → {kind, fields, confidence}.
//   4. Anything confident lands in the feed AND routes via /api/intake/route.
//      Receipts/invoices/contacts/lists become table rows (auto-creating the
//      table if needed). Notes become draft commitments via onAddCommitment.
//   5. Low-confidence (<0.65) lands in a "needs review" section with a
//      manual routing dropdown.
//   6. "Generate report" POSTs the whole session to /api/intake/report for
//      a markdown summary.
function IntakeScreen({ go, onAddCommitment }) {
  const [items, setItems]     = React.useState([]);   // full feed: routed + needs-review + errors
  const [progress, setProgress] = React.useState(null); // { done, total, current }
  const [dragOver, setDragOver] = React.useState(false);
  const [reportPath, setReportPath] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const dropRef = React.useRef(null);

  const CONF_THRESHOLD = 0.65;

  // Group items into three sections for render.
  const routed      = items.filter(i => i.status === "routed");
  const needsReview = items.filter(i => i.status === "needs_review");
  const errored     = items.filter(i => i.status === "error");

  // File → base64 → upload → classify → route. All per-file state updates use
  // functional setItems so parallel classifications can land out of order.
  const processFile = async (file, itemId) => {
    const updateItem = (patch) => {
      setItems(list => list.map(it => it.id === itemId ? { ...it, ...patch } : it));
    };
    try {
      // Local preview (object URL stays valid while screen is mounted)
      const previewUrl = URL.createObjectURL(file);
      updateItem({ previewUrl });

      // 1) Upload
      const data64 = await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => reject(new Error("read failed"));
        fr.readAsDataURL(file);
      });
      updateItem({ stage: "uploading" });
      const up = await fetch("/api/attachments/upload", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ filename: file.name, mime: file.type, data_base64: data64 }),
      }).then(r => r.json());
      if (!up.ok) throw new Error(up.error || "upload failed");
      updateItem({ stage: "classifying", uploadPath: up.path, uploadUrl: up.url });

      // 2) Classify (OCR + Rodbot)
      const cls = await fetch("/api/intake/classify", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ path: up.path, mime: up.mime }),
      }).then(r => r.json());
      if (!cls.ok) throw new Error(cls.error || "classify failed");
      const confidence = cls.confidence || 0;
      const classification = {
        kind: cls.kind || "uncertain",
        confidence,
        title: cls.title || file.name,
        fields: cls.fields || {},
        raw_text: cls.raw_text || "",
      };

      // 3) Route (only if confident)
      if (confidence >= CONF_THRESHOLD && classification.kind !== "uncertain") {
        updateItem({ stage: "routing", classification });
        const rt = await fetch("/api/intake/route", {
          method: "POST", headers: {"Content-Type":"application/json"},
          body: JSON.stringify({
            kind: classification.kind,
            fields: classification.fields,
            title: classification.title,
            raw_text: classification.raw_text,
            confidence,
            path: up.path,
          }),
        }).then(r => r.json());
        if (!rt.ok) throw new Error(rt.error || "route failed");

        if (rt.routed_to === "commitment" && rt.draft) {
          // Notes → draft commitment in client state
          if (onAddCommitment) {
            onAddCommitment(rt.draft.source, {
              headline: rt.draft.subject,
              detail:   rt.draft.body,
              commit:   rt.draft.commit,
            });
          }
          updateItem({
            status: "routed",
            stage:  "done",
            classification,
            routed_to: "commitment",
            target_slug: null,
          });
        } else {
          updateItem({
            status: "routed",
            stage:  "done",
            classification,
            routed_to: rt.routed_to,
            target_slug: rt.target_slug,
            added: rt.added,
            table_created: rt.table_created,
          });
        }
      } else {
        updateItem({
          status: "needs_review",
          stage:  "done",
          classification,
        });
      }
    } catch (e) {
      setItems(list => list.map(it => it.id === itemId ? { ...it, status: "error", stage: "done", error: e.message || String(e) } : it));
    }
  };

  // Batch entry point. Files flow in sequentially so progress stays legible;
  // OCR is the bottleneck, not the upload, so parallelism wouldn't help much.
  const processFiles = async (files) => {
    const fileArr = Array.from(files).filter(f => f && (f.type.startsWith("image/") || f.type === "application/pdf"));
    if (fileArr.length === 0) return;
    setReportPath(null);
    const startIds = fileArr.map(f => ({
      id: "itm_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,6),
      filename: f.name,
      mime: f.type,
      size: f.size,
      status: "processing",
      stage: "queued",
      createdAt: new Date().toISOString(),
    }));
    setItems(list => [...startIds, ...list]);
    setProgress({ done: 0, total: fileArr.length, current: fileArr[0].name });
    for (let i = 0; i < fileArr.length; i++) {
      setProgress({ done: i, total: fileArr.length, current: fileArr[i].name });
      // eslint-disable-next-line no-await-in-loop
      await processFile(fileArr[i], startIds[i].id);
    }
    setProgress({ done: fileArr.length, total: fileArr.length, current: null });
    window.setTimeout(() => setProgress(null), 1600);
  };

  // Drag handlers
  const onDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false);
    if (e.dataTransfer && e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };
  const onPickClick = () => { if (fileInputRef.current) fileInputRef.current.click(); };
  const onPicked = (e) => { if (e.target.files) processFiles(e.target.files); e.target.value = ""; };

  // ⌘V / Ctrl+V paste anywhere on screen
  React.useEffect(() => {
    const onPaste = (ev) => {
      if (!ev.clipboardData) return;
      const files = [];
      for (const it of ev.clipboardData.items || []) {
        if (it.kind === "file") {
          const f = it.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) { ev.preventDefault(); processFiles(files); }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  // Manual re-route from the needs-review dropdown.
  const manualRoute = async (item, kind) => {
    if (!kind) return;
    try {
      const rt = await fetch("/api/intake/route", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          kind,
          fields: (item.classification && item.classification.fields) || {},
          title: (item.classification && item.classification.title) || item.filename,
          raw_text: (item.classification && item.classification.raw_text) || "",
          confidence: (item.classification && item.classification.confidence) || 0,
          path: item.uploadPath || "",
        }),
      }).then(r => r.json());
      if (!rt.ok) throw new Error(rt.error || "route failed");
      if (rt.routed_to === "commitment" && rt.draft && onAddCommitment) {
        onAddCommitment(rt.draft.source, {
          headline: rt.draft.subject,
          detail:   rt.draft.body,
          commit:   rt.draft.commit,
        });
      }
      setItems(list => list.map(it => it.id === item.id ? {
        ...it,
        status: "routed",
        classification: { ...(it.classification || {}), kind },
        routed_to: rt.routed_to,
        target_slug: rt.target_slug || null,
        added: rt.added,
      } : it));
    } catch (e) {
      setItems(list => list.map(it => it.id === item.id ? { ...it, error: e.message || String(e) } : it));
    }
  };

  const removeItem = (id) => setItems(list => list.filter(it => it.id !== id));

  const generateReport = async () => {
    if (items.length === 0) return;
    const payload = {
      label: "intake",
      items: items.map(it => ({
        kind: (it.classification && it.classification.kind) || "uncertain",
        title: (it.classification && it.classification.title) || it.filename,
        confidence: (it.classification && it.classification.confidence) || 0,
        fields: (it.classification && it.classification.fields) || {},
        routed_to: it.routed_to,
        target_slug: it.target_slug,
        path: it.uploadPath,
      })),
    };
    try {
      const r = await fetch("/api/intake/report", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload),
      }).then(r => r.json());
      if (!r.ok) throw new Error(r.error || "report failed");
      setReportPath(r.url || r.path);
    } catch (e) {
      alert("Report failed: " + (e.message || e));
    }
  };

  const kindPill = (kind) => (
    <span className={"intake-kind-pill " + (kind || "uncertain")}>{kind || "uncertain"}</span>
  );
  const confBand = (c) => c >= 0.85 ? "hi" : (c >= CONF_THRESHOLD ? "med" : "low");

  const renderItem = (it) => {
    const c = it.classification || {};
    const conf = c.confidence || 0;
    return (
      <div key={it.id} className={"intake-item" + (it.status === "needs_review" ? " needs-review" : "") + (it.status === "error" ? " error" : "")}>
        <div className="intake-thumb">
          {it.previewUrl
            ? <img src={it.previewUrl} alt=""/>
            : <Icon name="image" size={20}/>}
        </div>
        <div className="intake-item-body">
          <div className="intake-item-title">{c.title || it.filename}</div>
          {it.status === "processing" && (
            <div className="intake-item-sub">
              <span className="pulse-dot" style={{marginRight:6}}/>
              {it.stage === "uploading"   && "uploading…"}
              {it.stage === "classifying" && "Rodbot reading…"}
              {it.stage === "routing"     && "routing to table…"}
              {it.stage === "queued"      && "queued"}
            </div>
          )}
          {it.status === "error" && (
            <div className="intake-item-sub" style={{color:"var(--data-negative)"}}>{it.error}</div>
          )}
          {(it.status === "routed" || it.status === "needs_review") && (
            <div className="intake-item-sub">
              {c.fields && c.fields.vendor && <span>{c.fields.vendor} · </span>}
              {c.fields && c.fields.client && <span>{c.fields.client} · </span>}
              {c.fields && c.fields.name && <span>{c.fields.name} · </span>}
              {c.fields && c.fields.amount != null && <span>${c.fields.amount} · </span>}
              {c.fields && c.fields.date && <span>{c.fields.date} · </span>}
              {it.routed_to === "table" && it.target_slug && (
                <span>→ <a href="#" onClick={e => { e.preventDefault(); go.push("table_detail", { slug: it.target_slug }); }}>{it.target_slug}</a>
                {it.table_created ? " (new)" : ""}
                {it.added > 1 ? ` · +${it.added} rows` : ""}</span>
              )}
              {it.routed_to === "commitment" && <span>→ draft commitment</span>}
            </div>
          )}
          <div className="intake-item-meta">
            {kindPill(c.kind)}
            {conf > 0 && <span className={"intake-confidence " + confBand(conf)}>conf {conf.toFixed(2)}</span>}
            {it.filename && <span style={{fontFamily:"var(--font-mono)"}}>{it.filename}</span>}
          </div>
        </div>
        <div className="intake-item-actions">
          {it.status === "needs_review" && (
            <div className="intake-route-menu">
              <select className="intake-route-select" defaultValue=""
                onChange={e => manualRoute(it, e.target.value)}>
                <option value="" disabled>route to…</option>
                <option value="receipt">receipt</option>
                <option value="invoice">invoice</option>
                <option value="contact">contact</option>
                <option value="list">list</option>
                <option value="note">note</option>
              </select>
            </div>
          )}
          <button className="btn ghost" onClick={() => removeItem(it.id)} title="dismiss"
            style={{fontSize:11, padding:"4px 8px"}}>dismiss</button>
        </div>
      </div>
    );
  };

  return (
    <div className="intake-screen">
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
        <div>
          <h1 style={{fontFamily:"var(--font-display)", fontSize:28, margin:"0 0 2px"}}>Intake</h1>
          <div style={{fontSize:12.5, color:"var(--ink-4)", fontStyle:"italic"}}>
            Drop receipts, invoices, business cards, lists, or handwritten notes. Rodbot reads them.
          </div>
        </div>
        <div style={{display:"flex", gap:8}}>
          {items.length > 0 && (
            <button className="btn" onClick={generateReport} title="write a markdown summary to CCAgentindex/reports/">
              generate report
            </button>
          )}
          <button className="btn ghost" onClick={() => go.back()}>← back</button>
        </div>
      </div>

      <div
        ref={dropRef}
        className={"intake-drop" + (dragOver ? " dragover" : "")}
        onClick={onPickClick}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="intake-drop-title">Drop it here.</div>
        <div className="intake-drop-sub">I'll figure out what it is and put it where it goes.</div>
        <div className="intake-drop-kbd">
          <span><kbd>click</kbd> to pick</span>
          <span><kbd>drag</kbd> to drop</span>
          <span><kbd>⌘V</kbd> to paste</span>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple
          style={{display:"none"}} onChange={onPicked}/>
      </div>

      {progress && (
        <div className="intake-progress">
          <div className="intake-progress-label">
            <span>processing {progress.done}/{progress.total}</span>
            {progress.current && <span style={{color:"var(--ink-4)"}}>{progress.current}</span>}
          </div>
          <div className="intake-progress-bar">
            <div className="intake-progress-bar-fill" style={{width: `${Math.round(100 * progress.done / Math.max(1, progress.total))}%`}}/>
          </div>
        </div>
      )}

      {reportPath && (
        <div style={{padding:"10px 14px", border:"1px solid var(--rule)", borderRadius:10,
          background:"color-mix(in oklab, var(--data-positive) 6%, var(--paper-card-2))",
          display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <div>
            <div style={{fontSize:13, color:"var(--ink)"}}>Report saved.</div>
            <div style={{fontSize:11.5, color:"var(--ink-4)", fontFamily:"var(--font-mono)"}}>{reportPath}</div>
          </div>
          <button className="btn ghost" onClick={() => setReportPath(null)}>dismiss</button>
        </div>
      )}

      {needsReview.length > 0 && (
        <div>
          <div className="intake-feed-header">
            <div className="intake-feed-title">Needs review</div>
            <div className="intake-feed-count">{needsReview.length} item{needsReview.length !== 1 ? "s" : ""}</div>
          </div>
          <div className="intake-needs-review-header">Rodbot wasn't sure — pick a route below.</div>
          <div className="intake-feed">
            {needsReview.map(renderItem)}
          </div>
        </div>
      )}

      {routed.length > 0 && (
        <div>
          <div className="intake-feed-header">
            <div className="intake-feed-title">Routed</div>
            <div className="intake-feed-count">{routed.length} filed</div>
          </div>
          <div className="intake-feed">
            {routed.map(renderItem)}
          </div>
        </div>
      )}

      {errored.length > 0 && (
        <div>
          <div className="intake-feed-header">
            <div className="intake-feed-title">Errors</div>
            <div className="intake-feed-count">{errored.length}</div>
          </div>
          <div className="intake-feed">
            {errored.map(renderItem)}
          </div>
        </div>
      )}

      {items.length === 0 && !progress && (
        <div style={{textAlign:"center", padding:"20px 0", fontSize:12.5, color:"var(--ink-4)", fontStyle:"italic"}}>
          Nothing in the queue. Drop something above and I'll start sorting.
        </div>
      )}
    </div>
  );
}

// ─── List screen ───
// The /tables landing page. Clean list of saved sheets, no template gallery by
// default — template picker only opens when Rodrigo hits `+ new table`. The
// broken-default "pick a template to see anything" state is gone. Errors from
// /api/charts/list and /api/catalog/edges/list degrade quietly — we render an
// empty-state, log the error to console, and never leak raw fetch errors to
// the UI.
function TablesScreen({ go }) {
  const [items, setItems] = useState([]);
  const [charts, setCharts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [picking, setPicking] = useState(false); // modal template picker

  const refresh = useCallback(() => {
    setLoading(true); setErr(null);
    // Tables is the authoritative call; charts is decorative — its failure
    // should never block the list. That's the "quiet degradation" rule.
    Promise.all([
      fetchJson("/api/tables/list").catch(e => { console.warn("tables/list failed:", e); return { ok: false, items: [] }; }),
      fetchJson("/api/charts/list").catch(e => { console.warn("charts/list failed:", e); return { ok: false, items: [] }; }),
    ]).then(([t, c]) => {
      setItems((t.items) || []);
      setCharts((c.items) || []);
    }).catch(e => {
      console.warn("tables screen refresh failed:", e);
      setErr("Couldn't load sheets right now.");
    }).finally(() => setLoading(false));
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const fmtTime = (iso) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
    catch { return iso; }
  };

  // Tone palette for row indicators — cycles through the 8-tone deck system
  const TONES = ["mint","peach","lav","sky","lemon","sage","blush","rose"];
  // Stable tone per slug (so the same sheet keeps the same dot color across renders)
  const toneFor = (slug) => {
    if (!slug) return "sage";
    let h = 0;
    for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
    return TONES[h % TONES.length];
  };

  return (
    <div className="tbl-screen">
      {/* ─── Hero header ─── */}
      <header className="tbl-hero">
        <div className="tbl-hero-left">
          <div className="tbl-eyebrow">tables · sheets, charts, saved views</div>
          <h1 className="tbl-h1">Your sheets<span className="tbl-h1-period">.</span></h1>
          <div className="tbl-lede">Drop data in. Ask Rodbot to slice it. The grid lives here.</div>
        </div>
        <div className="tbl-hero-right">
          <div className="tbl-stat">
            <div className="tbl-stat-num">{items.length}</div>
            <div className="tbl-stat-lbl">sheets</div>
          </div>
          {charts.length > 0 && (
            <div className="tbl-stat">
              <div className="tbl-stat-num">{charts.length}</div>
              <div className="tbl-stat-lbl">charts</div>
            </div>
          )}
          <button className="tbl-cta" onClick={() => setPicking(true)}>
            <span className="tbl-cta-plus">+</span>
            <span>new table</span>
          </button>
        </div>
      </header>

      {/* ─── Loading: shimmer rows, no spinners ─── */}
      {loading && (
        <div className="tbl-skeleton">
          {[0,1,2,3].map(i => <div key={i} className="tbl-skeleton-row"/>)}
        </div>
      )}

      {/* ─── Error: soft rose admonition ─── */}
      {!loading && err && (
        <div className="tbl-admonition tbl-admonition-rose" role="alert">
          <div className="tbl-admonition-icon">⚠</div>
          <div>
            <div className="tbl-admonition-title">Couldn't load sheets</div>
            <div className="tbl-admonition-body">{err} · try refreshing the page.</div>
          </div>
        </div>
      )}

      {/* ─── Empty state: editorial, voicey ─── */}
      {!loading && !err && items.length === 0 && (
        <div className="tbl-empty">
          <div className="tbl-empty-mark">∅</div>
          <h2 className="tbl-empty-title">No sheets yet.</h2>
          <p className="tbl-empty-body">
            Drop some data in <button className="tbl-empty-link" onClick={() => go.push("intake")}>Intake</button>,
            {" "}or <button className="tbl-empty-link" onClick={() => setPicking(true)}>start fresh with a template</button>.
          </p>
        </div>
      )}

      {/* ─── The list — editorial cards inside a card surface ─── */}
      {!loading && items.length > 0 && (
        <div className="tbl-list">
          <div className="tbl-list-head">
            <div>Name</div>
            <div className="tbl-list-num">Rows</div>
            <div className="tbl-list-num">Cols</div>
            <div className="tbl-list-when">Updated</div>
            <div className="tbl-list-chev"></div>
          </div>
          {items.map(it => {
            const tone = toneFor(it.slug);
            return (
              <button key={it.slug}
                className="tbl-list-row"
                data-tone={tone}
                onClick={() => go.push("table_detail", { slug: it.slug })}>
                <div className="tbl-list-name">
                  <span className={`tbl-dot tbl-dot-${tone}`} aria-hidden="true"></span>
                  <div className="tbl-list-name-text">
                    <div className="tbl-list-name-title">{it.name || it.slug}</div>
                    <div className="tbl-list-name-slug">{it.slug}</div>
                  </div>
                </div>
                <div className="tbl-list-num">{it.row_count ?? 0}</div>
                <div className="tbl-list-num">{it.col_count ?? 0}</div>
                <div className="tbl-list-when">{fmtTime(it.updated_at)}</div>
                <div className="tbl-list-chev" aria-hidden="true">→</div>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Saved charts — only when present ─── */}
      {!loading && charts.length > 0 && (
        <section className="tbl-charts">
          <div className="tbl-section-head">
            <div className="tbl-eyebrow">saved charts</div>
            <h2 className="tbl-h2">Visualizations.</h2>
          </div>
          <div className="tbl-charts-grid">
            {charts.map(c => (
              <button key={c.slug} className="tbl-chart-tile" onClick={() => go.push("table_detail", { slug: c.table_slug })}>
                <div className="tbl-chart-tile-preview">
                  <ChartTemplatePreview kind={c.kind} accent={c.accent ? `var(${c.accent})` : "var(--event-open)"}/>
                </div>
                <div className="tbl-chart-tile-title">{c.name}</div>
                <div className="tbl-chart-tile-sub">from <b>{c.table_slug}</b></div>
                <div className="tbl-chart-tile-when">{fmtTime(c.updated_at)}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ─── Footer actions ─── */}
      <footer className="tbl-footer">
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
        <button className="btn ghost" onClick={() => go.push("table_new")} title="Paste raw data and let Rodbot extract rows">
          Paste raw data instead →
        </button>
      </footer>

      {/* Template picker modal — only opens when the user asks for new */}
      {picking && <TemplatePickerModal go={go} onClose={() => setPicking(false)} />}
    </div>
  );
}

// ─── Template picker modal ─────────────────────────────────────────────
// Opens from the `+ new table` button. Picking a template creates the
// table immediately and drops Rodrigo into the grid — no confirmation
// step. Picking `Blank` does the same with three default columns.
function TemplatePickerModal({ go, onClose }) {
  const [busy, setBusy] = useState(null);
  const tplList = Object.values(TABLE_TEMPLATES);

  const spawn = async (templateId) => {
    setBusy(templateId || "blank");
    try { await _createTableDirect({ template: templateId, go }); }
    catch (e) { alert("Couldn't create table: " + (e.message || e)); setBusy(null); }
  };

  return (
    <div className="cb-backdrop" onClick={onClose}>
      <div className="cb-modal ss-tpl-modal" onClick={e => e.stopPropagation()}>
        <div className="cb-head">
          <div>
            <div className="kicker">new table</div>
            <div className="cb-title-static">Pick a template — or start blank.</div>
          </div>
          <button className="btn ghost" onClick={onClose}>✕</button>
        </div>
        <div className="cb-body" style={{padding:"18px 22px"}}>
          <div className="tpl-strip">
            <button className="tpl-card blank" onClick={() => spawn(null)} disabled={busy === "blank"}>
              <div className="tpl-kicker">Blank</div>
              <div className="tpl-title">Fresh sheet</div>
              <div className="tpl-body">Three columns, empty rows, cursor blinking. Type.</div>
              <div className="tpl-foot">{busy === "blank" ? "opening…" : "+ blank sheet"}</div>
            </button>
            {tplList.map(tpl => (
              <button key={tpl.id} className="tpl-card" onClick={() => spawn(tpl.id)} disabled={busy === tpl.id}
                style={{["--tpl-accent"]: `var(${tpl.accent || "--event-open"})`}}>
                <div className="tpl-kicker">{tpl.schema.length} cols</div>
                <div className="tpl-title">{tpl.label}</div>
                <div className="tpl-body">{tpl.description}</div>
                <div className="tpl-foot">{busy === tpl.id ? "opening…" : `+ ${(tpl.sample_rows||[]).length} starter rows`}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="cb-foot">
          <button className="btn ghost" onClick={onClose}>cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── Create / extract / review ───
function TableCreateScreen({ go, template, seedSlug }) {
  const tpl = template && TABLE_TEMPLATES[template] ? TABLE_TEMPLATES[template] : null;
  const [name, setName]   = useState(tpl ? tpl.suggested_name : "");
  const [slug, setSlug]   = useState(tpl ? tpl.suggested_slug : "");
  const [slugTouched, setSlugTouched] = useState(false);
  const [schema, setSchema] = useState(() => tpl ? tpl.schema.map(f => ({...f})) : [
    { key: "name", label: "Name", type: "text", required: true },
  ]);
  const [input, setInput] = useState("");
  const [extraction, setExtraction] = useState(null); // {rows, abstained, error, route}
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState(null);

  useEffect(() => {
    if (!slugTouched && name) setSlug(slugify(name));
  }, [name, slugTouched]);

  const updateField = (i, patch) => {
    setSchema(s => s.map((f, idx) => idx === i ? { ...f, ...patch } : f));
  };
  const removeField = (i) => setSchema(s => s.filter((_, idx) => idx !== i));
  const addField = () => setSchema(s => [...s, { key: `field_${s.length + 1}`, label: "", type: "text" }]);

  const canExtract = !!input.trim() && schema.length > 0 && schema.every(f => f.key);

  const runExtraction = async () => {
    setBusy(true); setExtraction(null);
    try {
      const r = await window.SecretaryAI.respond({
        instructions: "You are a careful data-extraction assistant. JSON-only output. Prefer abstention over invention.",
        input: tableExtractionPrompt({ name: name || slug || "table", schema, input }),
      });
      const parsed = parseExtractionResponse(r.text);
      setExtraction({ ...parsed, route: r.route });
    } catch (e) {
      setExtraction({ rows: [], abstained: [], error: e.message || String(e), route: null });
    } finally { setBusy(false); }
  };

  const acceptRow    = (i) => setExtraction(ex => ({ ...ex, rows: ex.rows.map((r, idx) => idx === i ? { ...r, _accept: true,  _reject: false } : r) }));
  const rejectRow    = (i) => setExtraction(ex => ({ ...ex, rows: ex.rows.map((r, idx) => idx === i ? { ...r, _accept: false, _reject: true  } : r) }));
  const editRow      = (i, key, val) => setExtraction(ex => ({ ...ex, rows: ex.rows.map((r, idx) => idx === i ? { ...r, [key]: val } : r) }));
  const acceptAll    = () => setExtraction(ex => ({ ...ex, rows: ex.rows.map(r => ({ ...r, _accept: true, _reject: false })) }));

  const save = async () => {
    setSaving(true); setSaveErr(null);
    try {
      const finalSlug = slugify(slug || name);
      const accepted = (extraction?.rows || []).filter(r => r._accept && !r._reject).map(r => {
        const copy = { ...r }; delete copy._accept; delete copy._reject; return copy;
      });
      const cleanSchema = schema.map(f => {
        const out = { key: f.key, label: f.label || f.key, type: f.type || "text" };
        if (f.required) out.required = true;
        if (f.enum && f.enum.length) out.enum = f.enum;
        return out;
      });
      const body = {
        slug: finalSlug,
        name: name || finalSlug,
        schema: cleanSchema,
        rows: accepted,
        template: tpl ? tpl.id : null,
        metadata: {
          provenance: extraction ? [{
            source: "paste",
            extracted_at: new Date().toISOString(),
            route: extraction.route || null,
            input_chars: input.length,
            accepted: accepted.length,
            abstained: (extraction.abstained || []).length,
          }] : [],
        },
      };
      const d = await fetchJson("/api/tables/save", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!d.ok) throw new Error(d.error || "save failed");
      // Ledger event emitted server-side in _table_save.
      go.replace("table_detail", { slug: finalSlug });
    } catch (e) {
      setSaveErr(e.message || String(e));
    } finally { setSaving(false); }
  };

  const ex = extraction;
  const acceptedCount = ex ? ex.rows.filter(r => r._accept && !r._reject).length : 0;

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">tables · new{tpl ? " · from template" : ""}</div>
          <h1>{tpl ? tpl.label : "New table"}</h1>
        </div>
        <div className="meta">
          <span><b>fields</b> {schema.length}</span>
          {ex && <span><b>extracted</b> {ex.rows.length}</span>}
          {ex && <span><b>accepted</b> {acceptedCount}</span>}
        </div>
      </div>

      {/* Name + slug */}
      <div style={{display:"grid", gridTemplateColumns:"2fr 1fr", gap:12, marginBottom:18}}>
        <div>
          <div style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-4)", marginBottom:4}}>Name</div>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            placeholder="What is this table called?"
            style={{width:"100%", padding:"10px 12px", border:"1px solid var(--rule-2)", borderRadius:6, background:"var(--paper)", color:"var(--ink)", fontSize:14, fontFamily:"var(--font-display)"}}/>
        </div>
        <div>
          <div style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-4)", marginBottom:4}}>Slug (filename)</div>
          <input type="text" value={slug} onChange={e => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
            placeholder="auto-from-name"
            style={{width:"100%", padding:"10px 12px", border:"1px solid var(--rule-2)", borderRadius:6, background:"var(--paper)", color:"var(--ink)", fontSize:13, fontFamily:"var(--font-mono)"}}/>
        </div>
      </div>

      {/* Schema editor */}
      <div style={{border:"1px solid var(--rule-2)", borderRadius:8, padding:"14px 16px", background:"var(--paper-card)", marginBottom:18}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
          <div style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-4)"}}>Schema</div>
          <button className="btn ghost" onClick={addField} style={{fontSize:11}}>+ Add field</button>
        </div>
        <div style={{display:"grid", gap:8}}>
          {schema.map((f, i) => (
            <div key={i} style={{display:"grid", gridTemplateColumns:"1.2fr 1.5fr 0.8fr 1.5fr auto", gap:8, alignItems:"center"}}>
              <input type="text" value={f.key} onChange={e => updateField(i, { key: e.target.value.replace(/[^a-zA-Z0-9_]/g, "_") })}
                placeholder="key" style={{padding:"7px 9px", border:"1px solid var(--rule)", borderRadius:4, fontFamily:"var(--font-mono)", fontSize:12}}/>
              <input type="text" value={f.label || ""} onChange={e => updateField(i, { label: e.target.value })}
                placeholder="Label" style={{padding:"7px 9px", border:"1px solid var(--rule)", borderRadius:4, fontSize:12}}/>
              <select value={f.type || "text"} onChange={e => updateField(i, { type: e.target.value })}
                style={{padding:"7px 9px", border:"1px solid var(--rule)", borderRadius:4, fontSize:12, background:"var(--paper)"}}>
                <option value="text">text</option>
                <option value="number">number</option>
                <option value="date">date</option>
                <option value="enum">enum</option>
                <option value="boolean">boolean</option>
              </select>
              <input type="text" value={(f.enum || []).join(", ")} disabled={f.type !== "enum"}
                onChange={e => updateField(i, { enum: e.target.value.split(",").map(x => x.trim()).filter(Boolean) })}
                placeholder={f.type === "enum" ? "comma, separated, values" : ""}
                style={{padding:"7px 9px", border:"1px solid var(--rule)", borderRadius:4, fontSize:12, opacity: f.type === "enum" ? 1 : 0.4}}/>
              <button onClick={() => removeField(i)} className="btn ghost" style={{fontSize:11, padding:"4px 8px"}} title="Remove">×</button>
            </div>
          ))}
        </div>
      </div>

      {/* Extraction input */}
      <div style={{border:"1px solid var(--rule-2)", borderRadius:8, padding:"14px 16px", background:"var(--paper-card)", marginBottom:18}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
          <div style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-4)"}}>Paste raw data — Rodbot will structure it</div>
          <button className="btn primary" onClick={runExtraction} disabled={!canExtract || busy}>
            {busy ? "Rodbot working…" : "Extract rows"}
          </button>
        </div>
        <textarea
          value={input} onChange={e => setInput(e.target.value)}
          placeholder="Paste anything — list, email, Slack dump, meeting notes. Rodbot will read the schema above and pull structured rows out. Anything it can't fit gets flagged, not invented."
          rows={8}
          style={{width:"100%", padding:"10px 12px", border:"1px solid var(--rule)", borderRadius:6, background:"var(--paper)", color:"var(--ink)", fontFamily:"var(--font-mono)", fontSize:12.5, lineHeight:1.5, resize:"vertical"}}/>
      </div>

      {/* Review */}
      {ex && ex.error && (
        <div style={{padding:"12px 14px", border:"1px solid var(--data-negative)", borderRadius:6, background:"color-mix(in oklab, var(--data-negative) 8%, var(--paper))", color:"var(--data-negative)", fontSize:13, marginBottom:18}}>
          Rodbot choked: {ex.error}
        </div>
      )}
      {ex && !ex.error && (
        <div style={{marginBottom:18}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8}}>
            <div style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-4)"}}>
              Review · {ex.rows.length} proposed · {ex.abstained.length} abstained · via {ex.route || "?"}
            </div>
            {ex.rows.length > 0 && <button className="btn ghost" onClick={acceptAll} style={{fontSize:11}}>Accept all</button>}
          </div>
          {ex.rows.length === 0 && (
            <div style={{padding:"20px 16px", border:"1px dashed var(--rule-2)", borderRadius:6, color:"var(--ink-4)", fontSize:12, textAlign:"center"}}>
              Rodbot didn't pull any rows that fit the schema. Either loosen the schema or paste something that matches it.
            </div>
          )}
          {ex.rows.map((row, i) => {
            const rejected = row._reject;
            const accepted = row._accept && !rejected;
            return (
              <div key={i} style={{
                border:"1px solid " + (accepted ? "var(--data-positive)" : rejected ? "var(--rule)" : "var(--rule-2)"),
                borderRadius:6, padding:"10px 12px", marginBottom:6,
                background: accepted ? "color-mix(in oklab, var(--data-positive) 5%, var(--paper-card))" : rejected ? "color-mix(in oklab, var(--ink) 3%, var(--paper-card))" : "var(--paper-card)",
                opacity: rejected ? 0.5 : 1,
                display:"grid", gridTemplateColumns:"1fr auto", gap:12, alignItems:"start",
              }}>
                <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(160px, 1fr))", gap:8}}>
                  {schema.map(f => (
                    <label key={f.key} style={{display:"flex", flexDirection:"column", gap:3}}>
                      <span style={{fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-4)"}}>{f.label || f.key}</span>
                      {f.type === "enum" && f.enum ? (
                        <select value={row[f.key] || ""} onChange={e => editRow(i, f.key, e.target.value)}
                          style={{padding:"6px 8px", border:"1px solid var(--rule)", borderRadius:4, fontSize:12, background:"var(--paper)"}}>
                          <option value="">—</option>
                          {f.enum.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                          value={row[f.key] == null ? "" : row[f.key]}
                          onChange={e => editRow(i, f.key, f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
                          style={{padding:"6px 8px", border:"1px solid var(--rule)", borderRadius:4, fontSize:12}}/>
                      )}
                    </label>
                  ))}
                </div>
                <div style={{display:"flex", flexDirection:"column", gap:4}}>
                  <button onClick={() => acceptRow(i)} className={"btn" + (accepted ? " primary" : " ghost")} style={{fontSize:11, padding:"4px 10px"}}>Accept</button>
                  <button onClick={() => rejectRow(i)} className="btn ghost" style={{fontSize:11, padding:"4px 10px"}}>Reject</button>
                </div>
              </div>
            );
          })}
          {ex.abstained.length > 0 && (
            <div style={{marginTop:12, padding:"10px 14px", border:"1px dashed var(--rule-2)", borderRadius:6, background:"color-mix(in oklab, var(--event-lean) 6%, var(--paper))"}}>
              <div style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-4)", marginBottom:6}}>
                Rodbot abstained on {ex.abstained.length} chunk{ex.abstained.length === 1 ? "" : "s"}
              </div>
              {ex.abstained.map((a, i) => (
                <div key={i} style={{fontSize:12, color:"var(--ink-3)", marginBottom:4, lineHeight:1.4}}>
                  <span style={{color:"var(--ink-4)", fontStyle:"italic"}}>{a.reason || "no reason"}:</span> <span style={{fontFamily:"var(--font-mono)", fontSize:11}}>{(a.text || "").slice(0, 160)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {saveErr && <div style={{padding:"10px 14px", border:"1px solid var(--data-negative)", borderRadius:6, color:"var(--data-negative)", fontSize:12, marginBottom:14}}>Save failed: {saveErr}</div>}

      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:20}}>
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
        <button className="btn primary" onClick={save} disabled={saving || !slug || !name}>
          {saving ? "Saving…" : acceptedCount > 0 ? `Save table · ${acceptedCount} rows` : "Save empty table"}
        </button>
      </div>
    </div>
  );
}

// ─── Detail / extend — now primarily a spreadsheet ───
function TableDetailScreen({ go, slug }) {
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [addInput, setAddInput] = useState("");
  const [addEx, setAddEx] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPaste, setShowPaste] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [myCharts, setMyCharts] = useState([]);
  const [dirty, setDirty] = useState(false);
  const saveTimer = React.useRef(null);

  const refresh = useCallback(() => {
    setLoading(true); setErr(null);
    fetchJson(`/api/tables/get?slug=${encodeURIComponent(slug)}`).then(d => {
      if (!d.ok) throw new Error(d.error || "failed");
      setTable(d.table);
    }).catch(e => setErr(e.message)).finally(() => setLoading(false));
  }, [slug]);
  useEffect(() => { refresh(); }, [refresh]);

  // Charts made from THIS table
  const refreshCharts = useCallback(() => {
    fetchJson(`/api/charts/list?table=${encodeURIComponent(slug)}`)
      .then(d => setMyCharts(d.ok ? (d.items || []) : []))
      .catch(() => {});
  }, [slug]);
  useEffect(() => { refreshCharts(); }, [refreshCharts]);

  // Debounced autosave when the grid mutates
  const scheduleSave = useCallback((nextTable) => {
    setDirty(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const d = await fetchJson("/api/tables/save", {
          method: "POST",
          body: JSON.stringify({
            slug: nextTable.slug || slug,
            name: nextTable.name,
            schema: nextTable.schema,
            rows: nextTable.rows,
            metadata: nextTable.metadata || {},
          }),
        });
        if (!d.ok) throw new Error(d.error || "save failed");
        setDirty(false);
      } catch (e) {
        console.warn("table autosave failed:", e);
      }
    }, 700);
  }, [slug]);

  // Mutators that go through setTable + scheduleSave so we always keep
  // local state and disk in sync without the user thinking about it.
  const mutate = useCallback((updater) => {
    setTable(prev => {
      const next = updater(prev);
      if (next && next !== prev) scheduleSave(next);
      return next;
    });
  }, [scheduleSave]);

  const runAdd = async () => {
    if (!addInput.trim() || !table) return;
    setBusy(true); setAddEx(null);
    try {
      const r = await window.SecretaryAI.respond({
        instructions: "You are a careful data-extraction assistant. JSON-only output. Prefer abstention over invention.",
        input: tableExtractionPrompt({ name: table.name || slug, schema: table.schema, input: addInput }),
      });
      const parsed = parseExtractionResponse(r.text);
      // auto-accept-all initial state; user unticks to reject
      parsed.rows = parsed.rows.map(row => ({ ...row, _accept: true, _reject: false }));
      setAddEx({ ...parsed, route: r.route });
    } catch (e) {
      setAddEx({ rows: [], abstained: [], error: e.message, route: null });
    } finally { setBusy(false); }
  };
  const acceptRow = (i) => setAddEx(ex => ({ ...ex, rows: ex.rows.map((r, idx) => idx === i ? { ...r, _accept: true,  _reject: false } : r) }));
  const rejectRow = (i) => setAddEx(ex => ({ ...ex, rows: ex.rows.map((r, idx) => idx === i ? { ...r, _accept: false, _reject: true  } : r) }));
  const editRow   = (i, key, val) => setAddEx(ex => ({ ...ex, rows: ex.rows.map((r, idx) => idx === i ? { ...r, [key]: val } : r) }));

  const addRowsCommit = async () => {
    if (!addEx) return;
    setSaving(true);
    try {
      const accepted = addEx.rows.filter(r => r._accept && !r._reject).map(r => {
        const copy = { ...r }; delete copy._accept; delete copy._reject; return copy;
      });
      if (accepted.length === 0) { setAddEx(null); setAddInput(""); setSaving(false); return; }
      const d = await fetchJson("/api/tables/add_rows", {
        method: "POST",
        body: JSON.stringify({ slug, rows: accepted, source: "paste" }),
      });
      if (!d.ok) throw new Error(d.error || "add failed");
      // Ledger event emitted server-side in _table_add_rows.
      setAddEx(null); setAddInput("");
      refresh();
    } catch (e) {
      alert("Could not add rows: " + e.message);
    } finally { setSaving(false); }
  };

  const deleteTable = async () => {
    if (!confirm(`Delete table "${table?.name || slug}"? This cannot be undone.`)) return;
    try {
      const d = await fetchJson("/api/tables/delete", {
        method: "POST",
        body: JSON.stringify({ slug }),
      });
      if (!d.ok) throw new Error(d.error || "delete failed");
      // Ledger event emitted server-side in _table_delete.
      go.back();
    } catch (e) { alert("Delete failed: " + e.message); }
  };

  if (loading) return <div style={{padding:40, textAlign:"center", color:"var(--ink-4)"}}>loading…</div>;
  if (err) return <div style={{padding:20, color:"var(--data-negative)"}}>Error: {err}</div>;
  if (!table) return null;

  const schema = table.schema || [];
  const rows = table.rows || [];

  // Title rename (inline)
  const renameTable = (next) => mutate(t => ({ ...t, name: next || t.name }));

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">sheet · {slug}{table.metadata?.template ? " · " + table.metadata.template : ""}</div>
          <h1 className="ss-title"
            contentEditable
            suppressContentEditableWarning
            onBlur={e => renameTable(e.currentTarget.textContent.trim())}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); } }}>
            {table.name}
          </h1>
        </div>
        <div className="meta">
          <span><b>rows</b> {rows.length}</span>
          <span><b>cols</b> {schema.length}</span>
          <span className={"ss-savedot " + (dirty ? "dirty" : "clean")} title={dirty ? "saving…" : "saved"}>
            {dirty ? "saving…" : "saved"}
          </span>
        </div>
      </div>

      {/* Actions strip */}
      <div className="ss-actionbar">
        <button className="btn primary" onClick={() => setChartOpen(true)} title="Turn this into a chart">
          ✦ Make a chart
        </button>
        <button className="btn ghost" onClick={() => setShowPaste(s => !s)}>
          {showPaste ? "hide paste panel" : "+ paste rows · Rodbot extracts"}
        </button>
        <button className="btn ghost" onClick={() => {
          try {
            const X = window.ChartExport;
            if (!X) throw new Error("Export module not loaded — refresh the page");
            X.downloadTableCSV(table.name || slug, schema, rows);
          } catch (e) { alert("Export failed: " + (e.message || e)); }
        }} title="Download all rows as CSV">
          ⤓ Export CSV
        </button>
        <div className="ss-actionbar-spacer"/>
        <button className="btn ghost" onClick={deleteTable} style={{fontSize:11.5}}>Delete sheet</button>
      </div>

      {/* Spreadsheet grid */}
      <SpreadsheetGrid table={table} onMutate={mutate} />

      {/* Charts made from this table */}
      {myCharts.length > 0 && (
        <div className="ss-chartgallery">
          <div className="tpl-sectiontitle">Charts from this sheet</div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:12}}>
            {myCharts.map(c => (
              <SavedChartCard key={c.slug} chart={c} table={table}
                onDelete={async () => {
                  if (!confirm(`Delete "${c.name}"?`)) return;
                  await fetchJson("/api/charts/delete", { method:"POST", body: JSON.stringify({ slug: c.slug }) });
                  refreshCharts();
                }}/>
            ))}
          </div>
        </div>
      )}

      {/* Chart builder modal */}
      {chartOpen && (
        <ChartBuilderModal
          table={table}
          onClose={() => setChartOpen(false)}
          onSaved={() => { setChartOpen(false); refreshCharts(); }}
        />
      )}

      {/* Paste / extract — collapsed by default */}
      {showPaste && (
      <div style={{border:"1px solid var(--rule-2)", borderRadius:8, padding:"14px 16px", background:"var(--paper-card)", marginBottom:18, marginTop:18}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
          <div style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-4)"}}>Paste data · Rodbot structures it</div>
          <button className="btn primary" onClick={runAdd} disabled={!addInput.trim() || busy}>
            {busy ? "Rodbot working…" : "Extract"}
          </button>
        </div>
        <textarea value={addInput} onChange={e => setAddInput(e.target.value)} rows={5}
          placeholder="Paste more data. Rodbot applies the schema above."
          style={{width:"100%", padding:"10px 12px", border:"1px solid var(--rule)", borderRadius:6, background:"var(--paper)", color:"var(--ink)", fontFamily:"var(--font-mono)", fontSize:12.5, lineHeight:1.5, resize:"vertical"}}/>

        {addEx && addEx.error && (
          <div style={{marginTop:10, padding:"10px 12px", border:"1px solid var(--data-negative)", borderRadius:6, color:"var(--data-negative)", fontSize:12.5}}>{addEx.error}</div>
        )}
        {addEx && !addEx.error && (
          <div style={{marginTop:14}}>
            <div style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-4)", marginBottom:8}}>
              {addEx.rows.length} proposed · {addEx.abstained.length} abstained · via {addEx.route || "?"}
            </div>
            {addEx.rows.map((row, i) => {
              const rejected = row._reject;
              return (
                <div key={i} style={{
                  border:"1px solid " + (rejected ? "var(--rule)" : "var(--rule-2)"),
                  borderRadius:6, padding:"8px 10px", marginBottom:6,
                  background: rejected ? "color-mix(in oklab, var(--ink) 3%, var(--paper))" : "var(--paper)",
                  opacity: rejected ? 0.5 : 1,
                  display:"grid", gridTemplateColumns:"1fr auto", gap:10, alignItems:"start",
                }}>
                  <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(140px, 1fr))", gap:6}}>
                    {schema.map(f => (
                      <label key={f.key} style={{display:"flex", flexDirection:"column", gap:2}}>
                        <span style={{fontSize:9, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-4)"}}>{f.label || f.key}</span>
                        {f.type === "enum" && f.enum ? (
                          <select value={row[f.key] || ""} onChange={e => editRow(i, f.key, e.target.value)}
                            style={{padding:"4px 6px", border:"1px solid var(--rule)", borderRadius:4, fontSize:11.5, background:"var(--paper)"}}>
                            <option value="">—</option>
                            {f.enum.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                            value={row[f.key] == null ? "" : row[f.key]}
                            onChange={e => editRow(i, f.key, f.type === "number" ? (e.target.value === "" ? null : Number(e.target.value)) : e.target.value)}
                            style={{padding:"4px 6px", border:"1px solid var(--rule)", borderRadius:4, fontSize:11.5}}/>
                        )}
                      </label>
                    ))}
                  </div>
                  <div style={{display:"flex", flexDirection:"column", gap:3}}>
                    <button onClick={() => acceptRow(i)} className={"btn" + (row._accept && !rejected ? " primary" : " ghost")} style={{fontSize:10.5, padding:"3px 8px"}}>Keep</button>
                    <button onClick={() => rejectRow(i)} className="btn ghost" style={{fontSize:10.5, padding:"3px 8px"}}>Drop</button>
                  </div>
                </div>
              );
            })}
            {addEx.rows.length > 0 && (
              <div style={{display:"flex", justifyContent:"flex-end", marginTop:10}}>
                <button className="btn primary" onClick={addRowsCommit} disabled={saving}>
                  {saving ? "Saving…" : `Add ${addEx.rows.filter(r => r._accept && !r._reject).length} rows`}
                </button>
              </div>
            )}
            {addEx.abstained.length > 0 && (
              <div style={{marginTop:10, padding:"8px 10px", border:"1px dashed var(--rule-2)", borderRadius:6, background:"color-mix(in oklab, var(--event-lean) 6%, var(--paper))"}}>
                <div style={{fontSize:9.5, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--ink-4)", marginBottom:4}}>
                  Rodbot abstained on {addEx.abstained.length}
                </div>
                {addEx.abstained.map((a, i) => (
                  <div key={i} style={{fontSize:11.5, color:"var(--ink-3)", marginBottom:3}}>
                    <span style={{color:"var(--ink-4)", fontStyle:"italic"}}>{a.reason || "no reason"}:</span> <span style={{fontFamily:"var(--font-mono)"}}>{(a.text || "").slice(0, 140)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      )}

      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:20}}>
        <button className="btn ghost" onClick={() => go.back()}>← back to sheets</button>
      </div>
    </div>
  );
}

// ═══════════════════════════ SPREADSHEET GRID ════════════════════════════
// Google-Sheets-style grid. Click to edit. Tab/Enter nav. Paste a CSV/TSV
// block and the grid auto-extends rows/columns to fit. Sort by clicking a
// column header (asc → desc → off). Per-column filter from the ⋯ menu.
// ⌘Z undoes the last mutation. Changing a column's type coerces every
// value; anything that can't coerce is flagged with a burgundy dot rather
// than destroyed — the raw text stays in the cell so you can fix it.
//
// Keyboard (cell focused, not editing): arrows move, Enter edits, Tab/Shift+Tab
// steps horizontally, any printable char enters edit mode with it as seed,
// Backspace/Delete clears. While editing: Enter commits + moves down,
// Tab commits + moves right, Esc cancels.
//
// ──────────────── helpers (module-scope so we don't recreate per-render) ────────────────

// Try to coerce a raw string into the column's declared type. Returns
// `{value, ok}` — when `ok` is false we keep the raw text in the cell and
// let the UI flag it. Number parsing strips $ , and whitespace.
function ssCoerce(raw, type) {
  if (raw == null || raw === "") return { value: null, ok: true };
  const s = String(raw).trim();
  if (!s) return { value: null, ok: true };
  if (type === "number") {
    const cleaned = s.replace(/[\$,\s]/g, "").replace(/%$/, "");
    const n = Number(cleaned);
    if (Number.isFinite(n)) return { value: n, ok: true };
    return { value: s, ok: false };
  }
  if (type === "boolean") {
    const low = s.toLowerCase();
    if (["true","yes","y","1","✓","t"].includes(low))  return { value: true,  ok: true };
    if (["false","no","n","0","—","-","f"].includes(low)) return { value: false, ok: true };
    return { value: s, ok: false };
  }
  if (type === "date") {
    // Accept ISO, en-US, en-GB shapes and normalize to YYYY-MM-DD.
    const iso = /^\d{4}-\d{2}-\d{2}/;
    if (iso.test(s)) return { value: s.slice(0,10), ok: true };
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,"0"), dd = String(d.getDate()).padStart(2,"0");
      return { value: `${y}-${m}-${dd}`, ok: true };
    }
    return { value: s, ok: false };
  }
  // text, enum, url — pass through
  return { value: s, ok: true };
}

// Is a given value "bad" under this field's type? We use this to decide
// whether to show the burgundy dot. Numbers: must be numeric or null.
// Enum: must be in the enum list. Dates: ISO-parseable.
function ssIsBad(v, field) {
  if (v == null || v === "") return false;
  const t = field.type;
  if (t === "number") return typeof v !== "number" || !Number.isFinite(v);
  if (t === "boolean") return typeof v !== "boolean";
  if (t === "date") {
    if (typeof v !== "string") return true;
    return isNaN(new Date(v).getTime());
  }
  if (t === "enum" && Array.isArray(field.enum) && field.enum.length) {
    return !field.enum.includes(String(v));
  }
  return false;
}

// Render a date as short form: "Apr 22" or "Apr 22 '26" when it's not this year.
function ssShortDate(v) {
  if (!v) return "";
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return String(v);
  const mon = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const now = new Date();
  if (d.getFullYear() !== now.getFullYear()) {
    return `${mon} ${day} '${String(d.getFullYear()).slice(-2)}`;
  }
  return `${mon} ${day}`;
}

function ssIsUrl(v) {
  if (typeof v !== "string") return false;
  return /^https?:\/\/\S+/i.test(v.trim());
}

// CSV/TSV clipboard parser — votes on delimiter (tab wins if any tabs),
// respects quoted fields, collapses CRLF. Returns a 2-D array.
function ssParseClipboard(text) {
  if (!text) return [];
  const src = text.replace(/\r\n?/g, "\n").replace(/\n$/, "");
  const hasTab = src.includes("\t");
  const delim = hasTab ? "\t" : ",";
  const out = [];
  let row = [], cur = "", inQ = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQ) {
      if (ch === '"' && src[i+1] === '"') { cur += '"'; i++; continue; }
      if (ch === '"') { inQ = false; continue; }
      cur += ch;
    } else {
      if (ch === '"' && cur === "") { inQ = true; continue; }
      if (ch === delim) { row.push(cur); cur = ""; continue; }
      if (ch === "\n")  { row.push(cur); out.push(row); row = []; cur = ""; continue; }
      cur += ch;
    }
  }
  row.push(cur); out.push(row);
  // Drop wholly-empty trailing rows
  while (out.length && out[out.length-1].every(c => c === "")) out.pop();
  return out;
}

function SpreadsheetGrid({ table, onMutate }) {
  const schema = table.schema || [];
  const rows   = table.rows   || [];

  // Active cell + edit state — local; parent doesn't need to know.
  const [active, setActive]   = useState({ r: 0, c: 0 });
  const [editing, setEditing] = useState(null); // {r, c, value}
  const [menuCol, setMenuCol] = useState(null); // column ⋯ menu index
  const [sort, setSort]       = useState(null); // {col, dir: 'asc'|'desc'}
  const [filters, setFilters] = useState({});   // { [colKey]: { op, value } }
  const [lastPasteNote, setLastPasteNote] = useState(null); // ephemeral hint
  const wrapRef  = React.useRef(null);
  const inputRef = React.useRef(null);
  const undoRef  = React.useRef([]); // stack of prior full-table snapshots

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  // Snapshot before any non-trivial mutation so ⌘Z can restore it.
  const pushUndo = () => {
    const snap = JSON.parse(JSON.stringify({ schema: table.schema || [], rows: table.rows || [] }));
    undoRef.current.push(snap);
    if (undoRef.current.length > 40) undoRef.current.shift();
  };
  const undo = () => {
    const prev = undoRef.current.pop();
    if (!prev) return;
    onMutate(cur => ({ ...cur, schema: prev.schema, rows: prev.rows }));
  };

  // ─── Derived view: rows filtered + sorted, carrying their original index ───
  const viewRows = React.useMemo(() => {
    let out = (rows || []).map((row, origIndex) => ({ row, origIndex }));
    // Filters
    const activeFilters = Object.entries(filters).filter(([, f]) => f && f.value !== "" && f.value != null);
    if (activeFilters.length) {
      out = out.filter(({ row }) => activeFilters.every(([key, f]) => {
        const v = row[key];
        const field = schema.find(s => s.key === key);
        const op = f.op || "contains";
        if (v == null) return false;
        if (op === "contains") return String(v).toLowerCase().includes(String(f.value).toLowerCase());
        if (op === "equals")   return String(v).toLowerCase() === String(f.value).toLowerCase();
        if (op === "gt" || op === "lt") {
          const a = field && field.type === "date" ? new Date(String(v)).getTime() : Number(v);
          const b = field && field.type === "date" ? new Date(String(f.value)).getTime() : Number(f.value);
          if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
          return op === "gt" ? a > b : a < b;
        }
        return true;
      }));
    }
    // Sort
    if (sort && schema[sort.col]) {
      const key = schema[sort.col].key;
      const t = schema[sort.col].type;
      out.sort((A, B) => {
        const a = A.row[key], b = B.row[key];
        if (a == null && b == null) return 0;
        if (a == null) return 1;
        if (b == null) return -1;
        let cmp = 0;
        if (t === "number") cmp = Number(a) - Number(b);
        else if (t === "date") cmp = new Date(String(a)).getTime() - new Date(String(b)).getTime();
        else cmp = String(a).localeCompare(String(b));
        return sort.dir === "desc" ? -cmp : cmp;
      });
    }
    return out;
  }, [rows, schema, sort, filters]);

  // Three blank rows beyond the filtered view so the sheet always has tail.
  const visibleCount = viewRows.length + 3;
  const viewRowAt = (r) => viewRows[r] || null; // null when it's a tail blank
  const origIndexOf = (r) => viewRows[r] ? viewRows[r].origIndex : null;

  const moveBy = (dr, dc) => {
    setActive(a => ({
      r: Math.max(0, Math.min(visibleCount - 1, a.r + dr)),
      c: Math.max(0, Math.min(schema.length - 1, a.c + dc)),
    }));
  };

  const startEdit = (r, c, seed) => {
    const field = schema[c]; if (!field) return;
    const entry = viewRowAt(r);
    const existing = entry && entry.row[field.key] != null ? String(entry.row[field.key]) : "";
    setEditing({ r, c, value: seed != null ? seed : existing });
  };

  // Commit a single cell. For tail blank rows, append a new row to the table.
  const commit = (r, c, raw) => {
    const field = schema[c]; if (!field) return;
    pushUndo();
    onMutate(prev => {
      const nextRows = (prev.rows || []).slice();
      const orig = (viewRows[r] && viewRows[r].origIndex != null) ? viewRows[r].origIndex : null;
      const { value } = ssCoerce(raw, field.type);
      if (orig == null) {
        // tail blank — append
        const newRow = {}; newRow[field.key] = value;
        nextRows.push(newRow);
      } else {
        const row = { ...(nextRows[orig] || {}) };
        row[field.key] = value;
        nextRows[orig] = row;
      }
      return { ...prev, rows: nextRows };
    });
  };

  // Paste: fills from active cell, auto-extends rows/columns.
  const handlePaste = (e) => {
    const cb = e.clipboardData || window.clipboardData;
    if (!cb) return;
    const text = cb.getData("text/plain") || "";
    const grid2d = ssParseClipboard(text);
    if (grid2d.length === 0) return;
    // Only intercept if it actually looks like a grid (or single long cell) —
    // if editing, let the default single-cell paste happen.
    if (editing) return;
    e.preventDefault();
    const startR = active.r, startC = active.c;
    pushUndo();
    let addedRows = 0, addedCols = 0, flagged = 0;
    onMutate(prev => {
      const s = (prev.schema || []).slice();
      const r = (prev.rows || []).slice();
      // Extend columns if paste is wider than the schema
      const need = startC + grid2d[0].length;
      while (s.length < need) {
        let i = s.length + 1, key = `col_${i}`;
        const keys = new Set(s.map(f => f.key));
        while (keys.has(key)) { i++; key = `col_${i}`; }
        s.push({ key, label: `Column ${s.length + 1}`, type: "text" });
        addedCols++;
      }
      for (let dr = 0; dr < grid2d.length; dr++) {
        const destViewR = startR + dr;
        const entry = viewRows[destViewR];
        let origIdx = entry ? entry.origIndex : null;
        if (origIdx == null) {
          origIdx = r.length;
          r.push({});
          addedRows++;
        }
        const row = { ...(r[origIdx] || {}) };
        for (let dc = 0; dc < grid2d[dr].length; dc++) {
          const f = s[startC + dc]; if (!f) continue;
          const { value, ok } = ssCoerce(grid2d[dr][dc], f.type);
          if (!ok) flagged++;
          row[f.key] = value;
        }
        r[origIdx] = row;
      }
      return { ...prev, schema: s, rows: r };
    });
    setLastPasteNote({ rows: grid2d.length, cols: grid2d[0].length, addedRows, addedCols, flagged });
    window.clearTimeout(handlePaste._t);
    handlePaste._t = window.setTimeout(() => setLastPasteNote(null), 4200);
  };

  const onKeyDown = (e) => {
    const tgt = e.target;
    const inInput = tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable);
    // ⌘Z / Ctrl+Z — undo (ignored while editing an input so typing undo works in cell)
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === "z" && !editing) {
      e.preventDefault(); undo(); return;
    }
    if (editing) {
      if (e.key === "Enter")  { e.preventDefault(); commit(editing.r, editing.c, editing.value); setEditing(null); moveBy(1, 0); return; }
      if (e.key === "Tab")    { e.preventDefault(); commit(editing.r, editing.c, editing.value); setEditing(null); moveBy(0, e.shiftKey ? -1 : 1); return; }
      if (e.key === "Escape") { e.preventDefault(); setEditing(null); return; }
      return;
    }
    if (inInput) return;
    if (e.key === "ArrowUp")    { e.preventDefault(); moveBy(-1, 0); return; }
    if (e.key === "ArrowDown")  { e.preventDefault(); moveBy( 1, 0); return; }
    if (e.key === "ArrowLeft")  { e.preventDefault(); moveBy( 0,-1); return; }
    if (e.key === "ArrowRight") { e.preventDefault(); moveBy( 0, 1); return; }
    if (e.key === "Tab")        { e.preventDefault(); moveBy( 0, e.shiftKey ? -1 : 1); return; }
    if (e.key === "Enter")      { e.preventDefault(); startEdit(active.r, active.c); return; }
    if (e.key === "Backspace" || e.key === "Delete") { e.preventDefault(); commit(active.r, active.c, ""); return; }
    if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      startEdit(active.r, active.c, e.key);
    }
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    el.addEventListener("keydown", onKeyDown);
    el.addEventListener("paste", handlePaste);
    return () => {
      el.removeEventListener("keydown", onKeyDown);
      el.removeEventListener("paste", handlePaste);
    };
    // eslint-disable-next-line
  }, [active, editing, schema.length, viewRows.length, rows.length, filters, sort]);

  // ─── Column ops ───
  const renameColumn = (c, nextLabel) => onMutate(prev => {
    const s = (prev.schema || []).slice();
    if (!s[c]) return prev;
    s[c] = { ...s[c], label: nextLabel };
    return { ...prev, schema: s };
  });
  const retypeColumn = (c, nextType) => {
    pushUndo();
    onMutate(prev => {
      const s = (prev.schema || []).slice();
      if (!s[c]) return prev;
      const key = s[c].key;
      s[c] = { ...s[c], type: nextType };
      // Non-destructive coerce — values that fail keep their raw form and
      // show the burgundy dot. Numbers/dates/booleans attempt conversion.
      const r = (prev.rows || []).map(row => {
        if (row[key] == null) return row;
        const { value } = ssCoerce(row[key], nextType);
        return { ...row, [key]: value };
      });
      return { ...prev, schema: s, rows: r };
    });
  };
  const deleteColumn = (c) => {
    pushUndo();
    onMutate(prev => {
      const s = (prev.schema || []).slice();
      if (!s[c]) return prev;
      const key = s[c].key;
      s.splice(c, 1);
      const r = (prev.rows || []).map(row => { const nr = { ...row }; delete nr[key]; return nr; });
      return { ...prev, schema: s, rows: r };
    });
  };
  const addColumn = () => {
    pushUndo();
    onMutate(prev => {
      const s = (prev.schema || []).slice();
      let i = s.length + 1, key = `col_${i}`;
      const keys = new Set(s.map(f => f.key));
      while (keys.has(key)) { i += 1; key = `col_${i}`; }
      s.push({ key, label: "New column", type: "text" });
      return { ...prev, schema: s };
    });
  };
  const deleteRow = (r) => {
    const orig = origIndexOf(r);
    if (orig == null) return;
    pushUndo();
    onMutate(prev => {
      const nr = (prev.rows || []).slice();
      if (orig < nr.length) nr.splice(orig, 1);
      return { ...prev, rows: nr };
    });
  };
  const addRow = () => { pushUndo(); onMutate(prev => ({ ...prev, rows: [...(prev.rows || []), {}] })); };

  const cycleSort = (c) => {
    setSort(cur => {
      if (!cur || cur.col !== c) return { col: c, dir: "asc" };
      if (cur.dir === "asc") return { col: c, dir: "desc" };
      return null;
    });
  };

  const setFilter = (key, patch) => {
    setFilters(prev => {
      const cur = prev[key] || { op: "contains", value: "" };
      const next = { ...cur, ...patch };
      if (!next.value) { const p = { ...prev }; delete p[key]; return p; }
      return { ...prev, [key]: next };
    });
  };

  // ─── Cell rendering ───
  const renderCell = (field, value, isEditingCell) => {
    if (value == null || value === "") return <span className="ss-blank">·</span>;
    const bad = ssIsBad(value, field);
    const body = (() => {
      if (field.type === "boolean") return value ? "✓" : "—";
      if (field.type === "date" && !bad) return <span className="ss-datev">{ssShortDate(value)}</span>;
      if (field.type === "enum" && !bad) return <span className="ss-pill">{String(value)}</span>;
      if (field.type === "url" && ssIsUrl(value)) return <a className="ss-linkcell" href={String(value)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>{String(value)}</a>;
      if (typeof value === "string" && ssIsUrl(value)) return <a className="ss-linkcell" href={value} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>{value}</a>;
      return String(value);
    })();
    return (
      <>
        {bad && <span className="ss-baddot" title={`value doesn't match type: ${field.type}`}/>}
        {body}
      </>
    );
  };

  const sortIndicator = (c) => {
    if (!sort || sort.col !== c) return null;
    return <span className="ss-sortarr">{sort.dir === "asc" ? "↑" : "↓"}</span>;
  };

  const activeFilterCount = Object.values(filters).filter(f => f && f.value).length;

  return (
    <div className="ss-wrap" ref={wrapRef} tabIndex={0}>
      <div className="ss-grid" style={{gridTemplateColumns: `56px repeat(${schema.length}, minmax(140px, 1fr)) 40px`}}>
        {/* Header row */}
        <div className="ss-corner"/>
        {schema.map((f, c) => {
          const hasFilter = !!(filters[f.key] && filters[f.key].value);
          return (
            <div key={f.key + "_h"} className={"ss-head" + (sort && sort.col === c ? " sorted" : "") + (hasFilter ? " filtered" : "")} data-col={c}>
              <div className="ss-headnamewrap" onClick={() => cycleSort(c)} title="click to sort">
                <input className="ss-headname" value={f.label || f.key}
                  onChange={e => renameColumn(c, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  onFocus={e => e.target.select()}/>
                {sortIndicator(c)}
              </div>
              <div className="ss-headtype" title={`type: ${f.type}`}>{f.type}</div>
              <button className="ss-headmenu" onClick={() => setMenuCol(menuCol === c ? null : c)} title="column menu">⋯</button>
              {menuCol === c && (
                <div className="ss-colmenu" onClick={e => e.stopPropagation()}>
                  <div className="ss-colmenu-label">type</div>
                  {["text","number","date","enum","boolean","url"].map(tp => (
                    <button key={tp} className={"ss-colmenu-item" + (f.type === tp ? " active" : "")}
                      onClick={() => { retypeColumn(c, tp); setMenuCol(null); }}>{tp}</button>
                  ))}
                  <div className="ss-colmenu-divider"/>
                  <div className="ss-colmenu-label">filter</div>
                  <div className="ss-filterrow">
                    <select value={(filters[f.key] && filters[f.key].op) || "contains"}
                      onChange={e => setFilter(f.key, { op: e.target.value })}>
                      <option value="contains">contains</option>
                      <option value="equals">equals</option>
                      <option value="gt">&gt;</option>
                      <option value="lt">&lt;</option>
                    </select>
                    <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                      value={(filters[f.key] && filters[f.key].value) || ""}
                      placeholder="value"
                      onChange={e => setFilter(f.key, { value: e.target.value })}/>
                  </div>
                  {hasFilter && <button className="ss-colmenu-item" onClick={() => setFilter(f.key, { value: "" })}>clear filter</button>}
                  <div className="ss-colmenu-divider"/>
                  <button className="ss-colmenu-item danger" onClick={() => { deleteColumn(c); setMenuCol(null); }}>delete column</button>
                </div>
              )}
            </div>
          );
        })}
        <button className="ss-headadd" onClick={addColumn} title="add column">+</button>

        {/* Body */}
        {Array.from({ length: visibleCount }, (_, r) => {
          const entry = viewRowAt(r);
          const row = entry ? entry.row : null;
          const orig = entry ? entry.origIndex : null;
          return (
            <React.Fragment key={"r" + r}>
              <div className="ss-rownum">{orig != null ? (orig + 1) : ""}</div>
              {schema.map((f, c) => {
                const isActive  = active.r === r && active.c === c;
                const isEditing = editing && editing.r === r && editing.c === c;
                const v = row ? row[f.key] : null;
                return (
                  <div key={f.key + "_" + r}
                    className={"ss-cell" + (isActive ? " active" : "") + (isEditing ? " editing" : "") + (f.type === "number" ? " num" : "") + (f.type === "date" ? " date" : "") + (ssIsBad(v, f) ? " bad" : "")}
                    onClick={() => { setActive({ r, c }); if (wrapRef.current) wrapRef.current.focus(); }}
                    onDoubleClick={() => startEdit(r, c)}>
                    {isEditing ? (
                      f.type === "enum" && f.enum ? (
                        <select ref={inputRef} value={editing.value} autoFocus
                          onChange={e => setEditing(ed => ({ ...ed, value: e.target.value }))}
                          onBlur={() => { commit(editing.r, editing.c, editing.value); setEditing(null); }}
                          onKeyDown={e => { if (e.key === "Enter") { e.currentTarget.blur(); } }}>
                          <option value=""></option>
                          {f.enum.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input ref={inputRef}
                          type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                          value={editing.value}
                          onChange={e => setEditing(ed => ({ ...ed, value: e.target.value }))}
                          onBlur={() => { commit(editing.r, editing.c, editing.value); setEditing(null); }}
                          autoFocus/>
                      )
                    ) : (
                      renderCell(f, v, false)
                    )}
                  </div>
                );
              })}
              {orig != null
                ? <button className="ss-rowmore" onClick={() => deleteRow(r)} title="delete row">−</button>
                : <div className="ss-rowpad"/>}
            </React.Fragment>
          );
        })}

        {/* Add-row affordance */}
        <div className="ss-corner"/>
        <button className="ss-addrow" style={{gridColumn: `2 / span ${schema.length + 1}`}} onClick={addRow}>
          + new row
        </button>
      </div>

      {/* Hint bar — shortcuts + filter/sort status + paste toast */}
      <div className="ss-hintbar">
        <div className="ss-hint-keys">
          <span><kbd>Tab</kbd> next</span>
          <span><kbd>Enter</kbd> down</span>
          <span><kbd>⌘V</kbd> paste CSV</span>
          <span><kbd>⌘Z</kbd> undo</span>
        </div>
        <div className="ss-hint-state">
          {sort && schema[sort.col] && (
            <button className="ss-pill-btn" onClick={() => setSort(null)} title="clear sort">
              sort: {(schema[sort.col].label || schema[sort.col].key)} {sort.dir === "asc" ? "↑" : "↓"} ×
            </button>
          )}
          {activeFilterCount > 0 && (
            <button className="ss-pill-btn" onClick={() => setFilters({})} title="clear all filters">
              {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} ×
            </button>
          )}
          {lastPasteNote && (
            <span className="ss-paste-note">
              pasted {lastPasteNote.rows}×{lastPasteNote.cols}
              {lastPasteNote.addedRows ? ` · +${lastPasteNote.addedRows} rows` : ""}
              {lastPasteNote.addedCols ? ` · +${lastPasteNote.addedCols} cols` : ""}
              {lastPasteNote.flagged ? ` · ${lastPasteNote.flagged} flagged` : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════ CHART PREVIEWS ══════════════════════════════
// Lightweight SVG stand-ins used in the template gallery and as thumbnails
// on saved-chart tiles. They don't render real data — they render a visual
// archetype. Data comes through in the full ChartBuilderModal preview.
function ChartTemplatePreview({ kind, accent, palette }) {
  // Each archetype renders a tiny visual fingerprint. Multi-color archetypes
  // (donut, pie, treemap, radial) cycle through the palette; single-color
  // ones (line, area, lollipop, bars) lead with palette[0].
  const colors = (Array.isArray(palette) && palette.length > 0)
    ? palette
    : (accent ? [accent] : ["var(--peach-dot)", "var(--sky-dot)", "var(--sage-dot)", "var(--lav-dot)"]);
  const colorAt = (i) => colors[i % colors.length];
  const A = colors[0];

  if (kind === "donut") {
    return (
      <svg viewBox="0 0 120 60" className="ctpl-preview" xmlns="http://www.w3.org/2000/svg">
        {[
          { dash: "55 200", off: 0, c: colorAt(0) },
          { dash: "30 200", off: -55, c: colorAt(1) },
          { dash: "20 200", off: -85, c: colorAt(2) },
          { dash: "13 200", off: -105, c: colorAt(3) },
        ].map((s, i) => (
          <circle key={i} cx="30" cy="30" r="22" fill="none" stroke={s.c} strokeWidth="9"
            strokeDasharray={s.dash} strokeDashoffset={s.off} transform="rotate(-90 30 30)"/>
        ))}
        <text x="68" y="32" fontFamily="var(--font-display)" fontSize="11" fontWeight="500" fill="var(--ink)">share</text>
        <text x="68" y="44" fontFamily="var(--font-mono)" fontSize="7" fill="var(--ink-4)">of total</text>
      </svg>
    );
  }
  if (kind === "pie") {
    return (
      <svg viewBox="0 0 120 60" className="ctpl-preview" xmlns="http://www.w3.org/2000/svg">
        {[
          "M 30 30 L 30 8 A 22 22 0 0 1 51.7 33 Z",
          "M 30 30 L 51.7 33 A 22 22 0 0 1 30 52 Z",
          "M 30 30 L 30 52 A 22 22 0 0 1 12 22 Z",
          "M 30 30 L 12 22 A 22 22 0 0 1 30 8 Z",
        ].map((d, i) => <path key={i} d={d} fill={colorAt(i)}/>)}
        <text x="68" y="32" fontFamily="var(--font-display)" fontSize="11" fontWeight="500" fill="var(--ink)">whole</text>
        <text x="68" y="44" fontFamily="var(--font-mono)" fontSize="7" fill="var(--ink-4)">pie</text>
      </svg>
    );
  }
  if (kind === "line") {
    return (
      <svg viewBox="0 0 120 60" className="ctpl-preview" xmlns="http://www.w3.org/2000/svg">
        <polyline points="6,50 26,42 46,36 66,24 86,28 106,14" fill="none" stroke={A} strokeWidth="2"/>
        <polyline points="6,50 26,42 46,36 66,24 86,28 106,14 106,58 6,58" fill={A} opacity="0.08"/>
        <circle cx="106" cy="14" r="3" fill={A}/>
        <circle cx="106" cy="14" r="6" fill="none" stroke={A} strokeWidth="1" opacity="0.4"/>
      </svg>
    );
  }
  if (kind === "area") {
    return (
      <svg viewBox="0 0 120 60" className="ctpl-preview" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ctpl-area-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={A} stopOpacity="0.5"/>
            <stop offset="100%" stopColor={A} stopOpacity="0.05"/>
          </linearGradient>
        </defs>
        <polygon points="6,52 26,42 46,38 66,22 86,30 106,12 106,56 6,56" fill="url(#ctpl-area-grad)"/>
        <polyline points="6,52 26,42 46,38 66,22 86,30 106,12" fill="none" stroke={A} strokeWidth="1.8"/>
      </svg>
    );
  }
  if (kind === "kpi") {
    return (
      <svg viewBox="0 0 120 60" className="ctpl-preview" xmlns="http://www.w3.org/2000/svg">
        {[12, 52, 92].map((x, i) => (
          <g key={i}>
            <text x={x-14} y="26" fontFamily="var(--font-display)" fontSize="17" fontWeight="500" fill={colorAt(i)}>{[42, 7.1, 18][i]}</text>
            <text x={x-14} y="38" fontFamily="var(--font-mono)" fontSize="6" fill="var(--ink-4)">metric {i+1}</text>
            <rect x={x-14} y="42" width="22" height="2" fill={colorAt(i)} rx="1"/>
          </g>
        ))}
      </svg>
    );
  }
  if (kind === "tiers") {
    return (
      <svg viewBox="0 0 120 60" className="ctpl-preview" xmlns="http://www.w3.org/2000/svg">
        {["A","B","C"].map((t, i) => (
          <g key={t}>
            <text x="6" y={16 + i*18} fontFamily="var(--font-display)" fontSize="11" fontWeight="500" fill={colorAt(i)}>{t}</text>
            {[0,1,2,3].map(j => (
              <rect key={j} x={20 + j*24} y={9 + i*18} width="20" height="10" fill={colorAt(i)} opacity={1 - j*0.18} rx="2"/>
            ))}
          </g>
        ))}
      </svg>
    );
  }
  if (kind === "stacked") {
    return (
      <svg viewBox="0 0 120 60" className="ctpl-preview" xmlns="http://www.w3.org/2000/svg">
        {[10, 32, 54, 76, 98].map((x, i) => {
          const h1 = 10 + (i*5 % 16), h2 = 16 + (i*7 % 18);
          return (
            <g key={i}>
              <rect x={x} y={54 - h2} width="14" height={h2} fill={colorAt(i + 1)} opacity="0.6" rx="0"/>
              <rect x={x} y={54 - h2 - h1} width="14" height={h1} fill={colorAt(i)} rx="2"/>
            </g>
          );
        })}
      </svg>
    );
  }
  if (kind === "bar_h" || kind === "bars_h") {
    return (
      <svg viewBox="0 0 120 60" className="ctpl-preview" xmlns="http://www.w3.org/2000/svg">
        {[
          { w: 78, label: "alpha" },
          { w: 60, label: "beta" },
          { w: 42, label: "gamma" },
          { w: 26, label: "delta" },
        ].map((r, i) => (
          <g key={i}>
            <text x="2" y={14 + i*13} fontFamily="var(--font-mono)" fontSize="6" fill="var(--ink-4)">{r.label}</text>
            <rect x="26" y={9 + i*13} width={r.w} height="8" fill={colorAt(i)} rx="2"/>
          </g>
        ))}
      </svg>
    );
  }
  if (kind === "lollipop") {
    return (
      <svg viewBox="0 0 120 60" className="ctpl-preview" xmlns="http://www.w3.org/2000/svg">
        {[
          { len: 78 },
          { len: 60 },
          { len: 42 },
          { len: 26 },
        ].map((r, i) => (
          <g key={i}>
            <line x1="22" y1={13 + i*13} x2={22 + r.len} y2={13 + i*13} stroke={colorAt(i)} strokeWidth="1.5" opacity="0.5"/>
            <circle cx={22 + r.len} cy={13 + i*13} r="3.5" fill={colorAt(i)}/>
          </g>
        ))}
      </svg>
    );
  }
  if (kind === "radial") {
    return (
      <svg viewBox="0 0 120 60" className="ctpl-preview" xmlns="http://www.w3.org/2000/svg">
        {[
          { r: 24, dash: "120 200", off: 0, c: colorAt(0) },
          { r: 18, dash: "70 200", off: 0, c: colorAt(1) },
          { r: 12, dash: "32 200", off: 0, c: colorAt(2) },
        ].map((s, i) => (
          <g key={i}>
            <circle cx="30" cy="30" r={s.r} fill="none" stroke="color-mix(in oklab, var(--rule) 60%, transparent)" strokeWidth="3"/>
            <circle cx="30" cy="30" r={s.r} fill="none" stroke={s.c} strokeWidth="3.5"
              strokeDasharray={s.dash} strokeLinecap="round" transform="rotate(-90 30 30)"/>
          </g>
        ))}
        <text x="68" y="32" fontFamily="var(--font-display)" fontSize="11" fontWeight="500" fill="var(--ink)">rings</text>
      </svg>
    );
  }
  if (kind === "treemap") {
    return (
      <svg viewBox="0 0 120 60" className="ctpl-preview" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="58" height="56" fill={colorAt(0)} rx="2"/>
        <rect x="62" y="2" width="40" height="32" fill={colorAt(1)} rx="2"/>
        <rect x="62" y="36" width="40" height="22" fill={colorAt(2)} rx="2"/>
        <rect x="104" y="2" width="14" height="32" fill={colorAt(3)} rx="2"/>
        <rect x="104" y="36" width="14" height="22" fill={colorAt(4)} rx="2"/>
      </svg>
    );
  }
  // default: bars (vertical)
  return (
    <svg viewBox="0 0 120 60" className="ctpl-preview" xmlns="http://www.w3.org/2000/svg">
      {[52, 40, 30, 22, 16, 12].map((h, i) => (
        <rect key={i} x={8 + i*18} y={58 - h} width="12" height={h} fill={colorAt(i)} rx="2"/>
      ))}
    </svg>
  );
}

// ═══════════════════════════ CHART BUILDER ═══════════════════════════════
// Modal over the table detail. User picks a chart kind, maps columns,
// shuffles variants, and saves. Live preview uses the existing ChartFmt
// primitives where we can, but mostly renders simple custom SVG so we
// don't depend on the analytics-panel data shapes.
function ChartBuilderModal({ table, onClose, onSaved }) {
  const schema = table.schema || [];
  const rows = table.rows || [];
  const [tplId, setTplId] = useState(Object.keys(CHART_TEMPLATES)[0]);
  const tpl = CHART_TEMPLATES[tplId] || CHART_TEMPLATES.bars;
  const [name, setName] = useState(() => `${table.name} · ${tpl.label}`);
  const [seed, setSeed] = useState(() => _hash01(`${table.slug || ""}:${tplId}:${Date.now()}`));
  const [labelKey, setLabelKey] = useState(null);
  const [valueKey, setValueKey] = useState(null);
  const [paletteId, setPaletteId] = useState("comeketo");
  const [opts, setOpts] = useState({
    showValueLabels: true,
    showLegend: true,
    sortDir: "desc",      // "desc" | "asc" | "none"
    maxCategories: 10,
  });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState(null);
  const previewRef = useRef(null);

  // Auto-pick mappings on template change
  useEffect(() => {
    const okFor = (kinds) => schema.find(f => kinds.includes(f.type));
    const needs = tpl.needs || {};
    const label = okFor(needs.label || ["text","enum","date"]);
    const value = okFor(needs.value || ["number"]);
    setLabelKey(label ? label.key : (schema[0] && schema[0].key));
    setValueKey(value ? value.key : (schema.find(f => f.type === "number") ? schema.find(f => f.type === "number").key : ((schema[1] && schema[1].key) || null)));
    setName(`${table.name} · ${tpl.label}`);
    setSeed(_hash01(`${table.slug || ""}:${tplId}:${Date.now()}`));
  }, [tplId]);

  // Resolve palette colors (memo for stability + render performance)
  const paletteColors = useMemo(() => resolvePalette(paletteId), [paletteId]);
  const accent = paletteColors[0];
  const palette = paletteColors;

  // Aggregate rows → {label, value}[]
  const slices = useMemo(() => {
    if (!labelKey) return [];
    const buckets = new Map();
    for (const r of rows) {
      const l = r[labelKey];
      const v = valueKey ? Number(r[valueKey]) : 1;
      if (l == null || l === "" || !isFinite(v)) continue;
      buckets.set(l, (buckets.get(l) || 0) + v);
    }
    let arr = Array.from(buckets.entries())
      .map(([label, value]) => ({ label: String(label), value }));
    if (opts.sortDir === "desc") arr.sort((a, b) => b.value - a.value);
    else if (opts.sortDir === "asc") arr.sort((a, b) => a.value - b.value);
    return arr.slice(0, opts.maxCategories);
  }, [rows, labelKey, valueKey, opts.sortDir, opts.maxCategories]);

  const save = async () => {
    setSaving(true);
    try {
      const slug = `${(table.slug || "chart").replace(/^_+|_+$/g,"")}_${tplId}_${Math.random().toString(36).slice(2,6)}`;
      const body = {
        slug, name: name || `${table.name} · ${tpl.label}`,
        kind: tpl.kind,
        template: tpl.id,
        // store palette in `variant` for backward-compat with the saved-chart
        // schema; the chart loader will read it as a palette id.
        variant: paletteId,
        accent: typeof accent === "string" && accent.startsWith("var(") ? accent.replace(/^var\(|\)$/g, "") : (accent || "--event-open"),
        table_slug: table.slug,
        mapping: { label: labelKey, value: valueKey || null },
        seed,
        // future-proof: explicit fields the server will round-trip back
        palette: paletteId,
        options: opts,
      };
      const res = await fetchJson("/api/charts/save", { method: "POST", body: JSON.stringify(body) });
      if (!res.ok) throw new Error(res.error || "save failed");
      onSaved();
    } catch (e) {
      alert("Save failed: " + (e.message || e));
    } finally { setSaving(false); }
  };

  const exportSample = async (fmt) => {
    if (!previewRef.current) return;
    setExporting(true); setExportNote(null);
    try {
      const fname = name || `${table.name} · ${tpl.label}`;
      const X = window.ChartExport;
      if (!X) throw new Error("Export module not loaded — refresh the page");
      if (fmt === "png")  await X.downloadPNG(fname, previewRef.current, { scale: 2 });
      if (fmt === "svg")  X.downloadSVG(fname, previewRef.current);
      if (fmt === "csv")  X.downloadCSV(fname, slices);
      if (fmt === "copy") { await X.copyPNG(previewRef.current); setExportNote("✓ copied to clipboard"); }
      else setExportNote(`✓ downloaded · ${fmt}`);
    } catch (e) {
      setExportNote("✕ " + (e.message || "export failed"));
    } finally {
      setExporting(false);
      setTimeout(() => setExportNote(null), 2200);
    }
  };

  return (
    <div className="cb-backdrop" onClick={onClose}>
      <div className="cb-modal cb-modal-pro" onClick={e => e.stopPropagation()} style={{["--tpl-accent"]: accent}}>
        {/* ─── Head ─── */}
        <div className="cb-head">
          <div className="cb-head-left">
            <div className="cb-eyebrow">chart · from <b>{table.name}</b></div>
            <input className="cb-title" value={name} onChange={e => setName(e.target.value)} placeholder="Chart name"/>
          </div>
          <div className="cb-head-right">
            <button className="cb-x" onClick={onClose} aria-label="close">✕</button>
          </div>
        </div>

        {/* ─── Body: split layout (left controls / right preview) ─── */}
        <div className="cb-body cb-body-split">
          <div className="cb-controls">
            {/* Kind picker */}
            <div className="cb-section">
              <div className="cb-sectiontitle">Chart kind</div>
              <div className="cb-tplgrid">
                {Object.values(CHART_TEMPLATES).map(t => (
                  <button key={t.id} className={"cb-tpl" + (t.id === tplId ? " active" : "")}
                    onClick={() => setTplId(t.id)} title={t.description}>
                    <ChartTemplatePreview kind={t.kind} palette={paletteColors}/>
                    <div className="cb-tpl-title">{t.label}</div>
                  </button>
                ))}
              </div>
              <div className="cb-tpl-desc">{tpl.description}</div>
            </div>

            {/* Palette picker */}
            <div className="cb-section">
              <div className="cb-sectiontitle">Palette</div>
              <div className="cb-palrow">
                {Object.values(CHART_PALETTES).map(p => (
                  <button key={p.id}
                    className={"cb-pal" + (p.id === paletteId ? " active" : "")}
                    onClick={() => setPaletteId(p.id)}
                    title={p.voice}>
                    <div className="cb-pal-swatches">
                      {p.colors.slice(0, 5).map((c, i) => (
                        <span key={i} className="cb-pal-swatch" style={{background: `var(${c})`}}/>
                      ))}
                    </div>
                    <div className="cb-pal-label">{p.label}</div>
                  </button>
                ))}
              </div>
              <div className="cb-voice">"{CHART_PALETTES[paletteId]?.voice || tpl.voice || ""}"</div>
            </div>

            {/* Data mapping */}
            <div className="cb-section cb-mapping">
              <div className="cb-sectiontitle">Data</div>
              <div className="cb-row">
                <label>
                  <span>Label column</span>
                  <select value={labelKey || ""} onChange={e => setLabelKey(e.target.value)}>
                    {schema.map(f => <option key={f.key} value={f.key}>{f.label || f.key}</option>)}
                  </select>
                </label>
                <label>
                  <span>Value column</span>
                  <select value={valueKey || ""} onChange={e => setValueKey(e.target.value || null)}>
                    <option value="">(count rows)</option>
                    {schema.filter(f => f.type === "number").map(f => <option key={f.key} value={f.key}>{f.label || f.key}</option>)}
                  </select>
                </label>
              </div>
            </div>

            {/* Options */}
            <div className="cb-section">
              <div className="cb-sectiontitle">Options</div>
              <div className="cb-opts">
                <label className="cb-opt">
                  <span>Sort</span>
                  <select value={opts.sortDir} onChange={e => setOpts(o => ({...o, sortDir: e.target.value}))}>
                    <option value="desc">High → low</option>
                    <option value="asc">Low → high</option>
                    <option value="none">As entered</option>
                  </select>
                </label>
                <label className="cb-opt">
                  <span>Max categories</span>
                  <select value={opts.maxCategories} onChange={e => setOpts(o => ({...o, maxCategories: Number(e.target.value)}))}>
                    {[5, 8, 10, 12, 16, 20].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </label>
                <label className="cb-opt cb-opt-toggle">
                  <input type="checkbox" checked={!!opts.showValueLabels}
                    onChange={e => setOpts(o => ({...o, showValueLabels: e.target.checked}))}/>
                  <span>Show value labels</span>
                </label>
                <label className="cb-opt cb-opt-toggle">
                  <input type="checkbox" checked={!!opts.showLegend}
                    onChange={e => setOpts(o => ({...o, showLegend: e.target.checked}))}/>
                  <span>Show legend</span>
                </label>
              </div>
            </div>
          </div>

          {/* ─── Right: sticky preview ─── */}
          <div className="cb-stage">
            <div className="cb-stage-head">
              <div className="cb-stage-title">{name || tpl.label}</div>
              <div className="cb-stage-meta">
                <span>{slices.length} {slices.length === 1 ? "row" : "rows"}</span>
                <span>·</span>
                <span>{tpl.label}</span>
                <span>·</span>
                <span>{CHART_PALETTES[paletteId]?.label}</span>
              </div>
            </div>
            <div ref={previewRef} className="cb-preview cb-preview-pro" style={{["--tpl-accent"]: accent}}>
              <LiveChart kind={tpl.kind} slices={slices} palette={palette} accent={accent} seed={seed} options={opts}/>
            </div>

            {/* Export bar from inside the builder */}
            <div className="cb-exportbar">
              <div className="cb-exportbar-label">Try it as a deliverable</div>
              <div className="cb-exportbar-buttons">
                <button className="cb-export-pill" disabled={exporting || slices.length === 0} onClick={() => exportSample("copy")}>Copy PNG</button>
                <button className="cb-export-pill" disabled={exporting || slices.length === 0} onClick={() => exportSample("png")}>PNG</button>
                <button className="cb-export-pill" disabled={exporting || slices.length === 0} onClick={() => exportSample("svg")}>SVG</button>
                <button className="cb-export-pill" disabled={exporting || slices.length === 0} onClick={() => exportSample("csv")}>CSV</button>
              </div>
              {exportNote && <div className="cb-export-note">{exportNote}</div>}
            </div>
          </div>
        </div>

        {/* ─── Foot ─── */}
        <div className="cb-foot">
          <div className="cb-foot-left">
            <span className="cb-foot-hint">Saved charts live on the table detail · download anytime.</span>
          </div>
          <div className="cb-foot-right">
            <button className="btn ghost" onClick={onClose}>cancel</button>
            <button className="btn primary" onClick={save} disabled={saving || slices.length === 0}>
              {saving ? "Saving…" : "✓ Save chart"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Live preview renderer — a compact, variant-aware chart that the builder
// modal and saved-chart tiles share. Uses raw SVG so it's independent of
// the analytics panels.
function LiveChart({ kind, slices, accent, palette, seed, variant, compact, options }) {
  const h = compact ? 110 : 280;
  const w = compact ? 320 : 560;
  if (!slices || slices.length === 0) {
    return <div className="cb-empty">No mappable data yet — make sure your label and value columns have values.</div>;
  }
  // Resolve palette → array of colors. Falls back to single accent for legacy.
  const colors = (Array.isArray(palette) && palette.length > 0)
    ? palette
    : (accent ? [accent] : ["var(--ink)"]);
  const colorAt = (i) => colors[i % colors.length];
  const primary = colors[0];
  const max = Math.max(...slices.map(s => s.value)) || 1;
  const showLabels = options?.showValueLabels !== false; // default true
  const showLegend = options?.showLegend !== false;       // default true

  // ─── BAR (vertical) ────────────────────────────────────────────────────
  if (kind === "bar" || kind === "bars") {
    const PAD = compact ? 16 : 28;
    const bw = (w - PAD*2) / slices.length;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="lc-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        {/* baseline */}
        <line x1={PAD} y1={h - 24} x2={w - PAD} y2={h - 24} stroke="var(--rule)" strokeWidth="1"/>
        {slices.map((s, i) => {
          const bh = (s.value / max) * (h - 50);
          const c = colorAt(i);
          return (
            <g key={i} className="lc-bar">
              <rect x={PAD + i * bw + bw*0.15} y={h - 24 - bh} width={bw*0.7} height={bh}
                fill={c} rx="2"
                style={{animation: `lc-grow 420ms cubic-bezier(0.2, 0.7, 0.2, 1) ${i*45}ms both`, transformOrigin: `center ${h - 24}px`}}/>
              <text x={PAD + i * bw + bw*0.5} y={h - 8} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={compact ? 8 : 10} fill="var(--ink-4)">
                {String(s.label).slice(0, 12)}
              </text>
              {showLabels && !compact && (
                <text x={PAD + i * bw + bw*0.5} y={h - 28 - bh} textAnchor="middle" fontFamily="var(--font-display)" fontSize={12} fontWeight="500" fill="var(--ink-2)">
                  {s.value.toLocaleString()}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // ─── BAR (horizontal) — names down the side ───────────────────────────
  if (kind === "bar_h" || kind === "bars_h") {
    const PAD = compact ? 8 : 14;
    const labelW = compact ? 70 : 110;
    const valueW = compact ? 36 : 50;
    const trackW = w - PAD*2 - labelW - valueW - 12;
    const rowH = (h - PAD*2) / slices.length;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="lc-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        {slices.map((s, i) => {
          const bw = (s.value / max) * trackW;
          const c = colorAt(i);
          const y = PAD + i * rowH + rowH/2;
          return (
            <g key={i}>
              <text x={PAD + labelW - 6} y={y + 3} textAnchor="end" fontFamily="var(--font-body)" fontSize={compact ? 9 : 11} fontWeight="500" fill="var(--ink-2)">
                {String(s.label).slice(0, 18)}
              </text>
              {/* track */}
              <rect x={PAD + labelW} y={y - rowH*0.32} width={trackW} height={rowH*0.64}
                fill="color-mix(in oklab, var(--rule) 60%, transparent)" rx="2"/>
              <rect x={PAD + labelW} y={y - rowH*0.32} width={bw} height={rowH*0.64}
                fill={c} rx="2"
                style={{animation: `lc-grow-h 420ms cubic-bezier(0.2, 0.7, 0.2, 1) ${i*40}ms both`, transformOrigin: `${PAD + labelW}px center`}}/>
              {showLabels && (
                <text x={w - PAD - 4} y={y + 3} textAnchor="end" fontFamily="var(--font-display)" fontSize={compact ? 10 : 12} fontWeight="500" fill="var(--ink)">
                  {s.value.toLocaleString()}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // ─── LOLLIPOP — quiet stems, confident dots ───────────────────────────
  if (kind === "lollipop") {
    const PAD = compact ? 14 : 22;
    const labelW = compact ? 68 : 100;
    const valueW = compact ? 36 : 50;
    const trackW = w - PAD*2 - labelW - valueW - 12;
    const rowH = (h - PAD*2) / slices.length;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="lc-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        {slices.map((s, i) => {
          const len = (s.value / max) * trackW;
          const c = colorAt(i);
          const y = PAD + i * rowH + rowH/2;
          const x0 = PAD + labelW;
          return (
            <g key={i} style={{animation: `lc-fade 380ms ease-out ${i*55}ms both`}}>
              <text x={x0 - 8} y={y + 3} textAnchor="end" fontFamily="var(--font-body)" fontSize={compact ? 9 : 11} fontWeight="500" fill="var(--ink-2)">
                {String(s.label).slice(0, 18)}
              </text>
              <line x1={x0} y1={y} x2={x0 + len} y2={y} stroke={c} strokeWidth="1.5" opacity="0.5"/>
              <circle cx={x0 + len} cy={y} r={compact ? 4.5 : 6} fill={c}/>
              <circle cx={x0 + len} cy={y} r={compact ? 2 : 2.5} fill="var(--paper-card-2)"/>
              {showLabels && (
                <text x={w - PAD - 4} y={y + 3} textAnchor="end" fontFamily="var(--font-display)" fontSize={compact ? 10 : 12} fontWeight="500" fill="var(--ink)">
                  {s.value.toLocaleString()}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  // ─── DONUT ─────────────────────────────────────────────────────────────
  if (kind === "donut") {
    const total = slices.reduce((a, s) => a + s.value, 0) || 1;
    const R = compact ? 42 : 92;
    const CX = compact ? 56 : 130;
    const CY = h/2;
    let acc = 0;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="lc-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        {slices.map((s, i) => {
          const start = acc / total * 2 * Math.PI;
          acc += s.value;
          const end = acc / total * 2 * Math.PI;
          const x1 = CX + R * Math.sin(start), y1 = CY - R * Math.cos(start);
          const x2 = CX + R * Math.sin(end),   y2 = CY - R * Math.cos(end);
          const large = end - start > Math.PI ? 1 : 0;
          const c = colorAt(i);
          return (
            <path key={i}
              d={`M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`}
              fill={c} stroke="var(--paper-card-2)" strokeWidth="1.5"
              style={{animation: `lc-fade 520ms ease-out ${i*55}ms both`}}/>
          );
        })}
        {/* center hole */}
        <circle cx={CX} cy={CY} r={R*0.62} fill="var(--paper-card-2)"/>
        <text x={CX} y={CY - 2} textAnchor="middle" fontFamily="var(--font-display)" fontSize={compact ? 16 : 24} fontWeight="500" fill="var(--ink)">{total.toLocaleString()}</text>
        <text x={CX} y={CY + 14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={compact ? 8 : 10} fill="var(--ink-4)" style={{textTransform:"uppercase", letterSpacing:"0.1em"}}>total</text>
        {/* legend */}
        {showLegend && !compact && slices.slice(0, 6).map((s, i) => {
          const pct = ((s.value / total) * 100).toFixed(1);
          return (
            <g key={i} transform={`translate(${CX + R + 28}, ${24 + i*30})`}>
              <rect width="10" height="10" fill={colorAt(i)} rx="2" y="0"/>
              <text x="18" y="9" fontFamily="var(--font-body)" fontSize="11.5" fontWeight="500" fill="var(--ink-2)">{String(s.label).slice(0, 22)}</text>
              <text x="18" y="22" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-4)">{s.value.toLocaleString()} · {pct}%</text>
            </g>
          );
        })}
      </svg>
    );
  }

  // ─── PIE — donut without the hole ──────────────────────────────────────
  if (kind === "pie") {
    const total = slices.reduce((a, s) => a + s.value, 0) || 1;
    const R = compact ? 44 : 96;
    const CX = compact ? 58 : 132;
    const CY = h/2;
    let acc = 0;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="lc-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        {slices.map((s, i) => {
          const start = acc / total * 2 * Math.PI;
          acc += s.value;
          const end = acc / total * 2 * Math.PI;
          const x1 = CX + R * Math.sin(start), y1 = CY - R * Math.cos(start);
          const x2 = CX + R * Math.sin(end),   y2 = CY - R * Math.cos(end);
          const large = end - start > Math.PI ? 1 : 0;
          const c = colorAt(i);
          // mid-arc for percentage label
          const midA = (start + end) / 2;
          const lblR = R * 0.62;
          const lx = CX + lblR * Math.sin(midA);
          const ly = CY - lblR * Math.cos(midA);
          const pct = ((s.value / total) * 100);
          return (
            <g key={i} style={{animation: `lc-fade 520ms ease-out ${i*55}ms both`}}>
              <path d={`M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`}
                fill={c} stroke="var(--paper-card-2)" strokeWidth="1.5"/>
              {pct > 6 && showLabels && (
                <text x={lx} y={ly + 4} textAnchor="middle" fontFamily="var(--font-display)" fontSize={compact ? 10 : 12} fontWeight="500" fill="var(--paper-card-2)">
                  {pct.toFixed(0)}%
                </text>
              )}
            </g>
          );
        })}
        {showLegend && !compact && slices.slice(0, 6).map((s, i) => (
          <g key={i} transform={`translate(${CX + R + 28}, ${24 + i*26})`}>
            <rect width="10" height="10" fill={colorAt(i)} rx="2"/>
            <text x="18" y="9" fontFamily="var(--font-body)" fontSize="11.5" fontWeight="500" fill="var(--ink-2)">{String(s.label).slice(0, 24)}</text>
          </g>
        ))}
      </svg>
    );
  }

  // ─── LINE ──────────────────────────────────────────────────────────────
  if (kind === "line") {
    const PAD = { l: compact ? 22 : 44, r: compact ? 14 : 24, t: compact ? 14 : 24, b: compact ? 22 : 36 };
    const innerW = w - PAD.l - PAD.r;
    const innerH = h - PAD.t - PAD.b;
    const pts = slices.map((s, i) => ({
      x: PAD.l + (i * innerW / Math.max(slices.length - 1, 1)),
      y: PAD.t + innerH - (s.value / max) * innerH,
    }));
    const poly = pts.map(p => `${p.x},${p.y}`).join(" ");
    // grid lines (4 ticks)
    const ticks = [0, 0.25, 0.5, 0.75, 1].map(p => ({ y: PAD.t + (1 - p) * innerH, v: max * p }));
    const peakIdx = slices.reduce((acc, s, i) => (s.value > slices[acc].value ? i : acc), 0);
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="lc-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        {!compact && ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.l} y1={t.y} x2={w - PAD.r} y2={t.y} stroke="var(--rule)" strokeDasharray={i === 0 ? "" : "2 4"} opacity={i === 0 ? 1 : 0.7}/>
            <text x={PAD.l - 6} y={t.y + 3} textAnchor="end" fontFamily="var(--font-mono)" fontSize="9" fill="var(--ink-4)">{Math.round(t.v).toLocaleString()}</text>
          </g>
        ))}
        <polyline points={poly} fill="none" stroke={primary} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
          style={{strokeDasharray: "1200", strokeDashoffset: "1200", animation: "lc-draw 950ms ease-out forwards"}}/>
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i === peakIdx ? 4 : 2.5} fill={primary}
            stroke="var(--paper-card-2)" strokeWidth={i === peakIdx ? 2 : 0}
            style={{animation: `lc-fade 280ms ease-out ${300 + i*40}ms both`}}/>
        ))}
        {/* peak callout */}
        {!compact && (
          <text x={pts[peakIdx].x} y={pts[peakIdx].y - 12} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="10" fontWeight="600" fill={primary}>
            peak · {slices[peakIdx].value.toLocaleString()}
          </text>
        )}
        {/* x labels — sample */}
        {slices.map((s, i) => {
          const stride = Math.max(1, Math.ceil(slices.length / (compact ? 4 : 7)));
          if (i % stride !== 0 && i !== slices.length - 1) return null;
          return (
            <text key={i} x={pts[i].x} y={h - PAD.b + 14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={compact ? 8 : 10} fill="var(--ink-4)">
              {String(s.label).slice(0, 8)}
            </text>
          );
        })}
      </svg>
    );
  }

  // ─── AREA — line with weight ─────────────────────────────────────────
  if (kind === "area") {
    const PAD = { l: compact ? 22 : 44, r: compact ? 14 : 24, t: compact ? 14 : 24, b: compact ? 22 : 36 };
    const innerW = w - PAD.l - PAD.r;
    const innerH = h - PAD.t - PAD.b;
    const pts = slices.map((s, i) => ({
      x: PAD.l + (i * innerW / Math.max(slices.length - 1, 1)),
      y: PAD.t + innerH - (s.value / max) * innerH,
    }));
    const poly = pts.map(p => `${p.x},${p.y}`).join(" ");
    const baseY = PAD.t + innerH;
    const areaPath = `${poly} ${pts[pts.length-1].x},${baseY} ${pts[0].x},${baseY}`;
    const gradId = `lc-area-${seed || "g"}-${kind}`.replace(/[^a-zA-Z0-9-]/g,"");
    const ticks = [0, 0.5, 1].map(p => ({ y: PAD.t + (1 - p) * innerH, v: max * p }));
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="lc-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={primary} stopOpacity="0.45"/>
            <stop offset="100%" stopColor={primary} stopOpacity="0.04"/>
          </linearGradient>
        </defs>
        {!compact && ticks.map((t, i) => (
          <line key={i} x1={PAD.l} y1={t.y} x2={w - PAD.r} y2={t.y} stroke="var(--rule)" strokeDasharray={i === 0 ? "" : "2 4"} opacity={i === 0 ? 1 : 0.6}/>
        ))}
        <polygon points={areaPath} fill={`url(#${gradId})`}
          style={{animation: "lc-fade 700ms ease-out 200ms both"}}/>
        <polyline points={poly} fill="none" stroke={primary} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
          style={{strokeDasharray: "1200", strokeDashoffset: "1200", animation: "lc-draw 950ms ease-out forwards"}}/>
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill={primary}
            style={{animation: `lc-fade 280ms ease-out ${300 + i*40}ms both`}}/>
        ))}
        {slices.map((s, i) => {
          const stride = Math.max(1, Math.ceil(slices.length / (compact ? 4 : 7)));
          if (i % stride !== 0 && i !== slices.length - 1) return null;
          return (
            <text key={i} x={pts[i].x} y={h - PAD.b + 14} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={compact ? 8 : 10} fill="var(--ink-4)">
              {String(s.label).slice(0, 8)}
            </text>
          );
        })}
      </svg>
    );
  }

  // ─── KPI strip ─────────────────────────────────────────────────────────
  if (kind === "kpi") {
    const top = slices.slice(0, 4);
    return (
      <div className="lc-kpi-row">
        {top.map((s, i) => (
          <div key={i} className="lc-kpi"
            style={{animation: `lc-fade 380ms ease-out ${i*80}ms both`, ["--tpl-accent"]: colorAt(i)}}>
            <div className="lc-kpi-value">{s.value.toLocaleString()}</div>
            <div className="lc-kpi-label">{String(s.label).slice(0, 18)}</div>
            <div className="lc-kpi-rule" style={{background: colorAt(i)}}/>
          </div>
        ))}
      </div>
    );
  }

  // ─── TIERS — A/B/C grouping ────────────────────────────────────────────
  if (kind === "tiers") {
    const groups = { A: [], B: [], C: [] };
    for (const s of slices) {
      const key = String(s.label).charAt(0).toUpperCase();
      (groups[key] || groups.C).push(s);
    }
    return (
      <div className="lc-tiers">
        {["A","B","C"].map((t, ti) => (
          <div key={t} className="lc-tier" style={{borderLeftColor: colorAt(ti)}}>
            <div className="lc-tier-letter" style={{color: colorAt(ti)}}>{t}</div>
            <div className="lc-tier-items">
              {(groups[t] || []).map((s, i) => (
                <div key={i} className="lc-tier-item">
                  <span>{String(s.label)}</span> <b>{s.value.toLocaleString()}</b>
                </div>
              ))}
              {(groups[t] || []).length === 0 && (
                <div className="lc-tier-empty">—</div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ─── STACKED bars ─────────────────────────────────────────────────────
  if (kind === "stacked") {
    const PAD = compact ? 14 : 24;
    const bw = (w - PAD*2) / slices.length;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="lc-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        <line x1={PAD} y1={h - 26} x2={w - PAD} y2={h - 26} stroke="var(--rule)"/>
        {slices.map((s, i) => {
          const total = (h - 50);
          const split = Math.min(0.78, 0.32 + ((i*7)%10)/22);
          const bh = (s.value / max) * total;
          const top = bh * split, bot = bh * (1 - split);
          const c = colorAt(i);
          const c2 = colorAt(i + 1);
          return (
            <g key={i}>
              <rect x={PAD + i*bw + bw*0.15} y={h - 26 - bot} width={bw*0.7} height={bot}
                fill={c2} rx="0" opacity="0.55"
                style={{animation: `lc-grow 420ms ease-out ${i*40}ms both`}}/>
              <rect x={PAD + i*bw + bw*0.15} y={h - 26 - bh} width={bw*0.7} height={top}
                fill={c} rx="2"
                style={{animation: `lc-grow 420ms ease-out ${i*40 + 80}ms both`}}/>
              <text x={PAD + i*bw + bw*0.5} y={h - 10} textAnchor="middle" fontFamily="var(--font-mono)" fontSize={compact ? 8 : 10} fill="var(--ink-4)">
                {String(s.label).slice(0, 10)}
              </text>
            </g>
          );
        })}
      </svg>
    );
  }

  // ─── RADIAL — concentric arcs ──────────────────────────────────────────
  if (kind === "radial") {
    const CX = w/2, CY = h/2;
    const Rmax = Math.min(w, h) / 2 - (compact ? 16 : 24);
    const Rmin = Rmax * 0.32;
    const ringStep = (Rmax - Rmin) / Math.max(slices.length, 1);
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="lc-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        {slices.map((s, i) => {
          const r = Rmin + (slices.length - i) * ringStep;
          const sweep = (s.value / max) * 2 * Math.PI;
          const start = -Math.PI / 2;
          const end = start + sweep;
          const x1 = CX + r * Math.cos(start), y1 = CY + r * Math.sin(start);
          const x2 = CX + r * Math.cos(end),   y2 = CY + r * Math.sin(end);
          const large = sweep > Math.PI ? 1 : 0;
          const c = colorAt(i);
          return (
            <g key={i} style={{animation: `lc-fade 480ms ease-out ${i*70}ms both`}}>
              {/* track */}
              <circle cx={CX} cy={CY} r={r} fill="none" stroke="color-mix(in oklab, var(--rule) 50%, transparent)" strokeWidth={Math.max(4, ringStep * 0.55)}/>
              {/* value arc */}
              <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`}
                fill="none" stroke={c} strokeWidth={Math.max(4, ringStep * 0.55)} strokeLinecap="round"/>
            </g>
          );
        })}
        {showLegend && !compact && slices.slice(0, 6).map((s, i) => (
          <g key={i} transform={`translate(${w - (compact ? 80 : 130)}, ${20 + i*22})`}>
            <rect width="8" height="8" fill={colorAt(i)} rx="2"/>
            <text x="14" y="8" fontFamily="var(--font-body)" fontSize="10.5" fontWeight="500" fill="var(--ink-2)">{String(s.label).slice(0, 16)}</text>
          </g>
        ))}
      </svg>
    );
  }

  // ─── TREEMAP — squarified tiles ────────────────────────────────────────
  if (kind === "treemap") {
    // Simple squarified: greedily lay out top slices. Good enough for decks.
    const total = slices.reduce((a, s) => a + s.value, 0) || 1;
    const PAD = compact ? 4 : 8;
    const inW = w - PAD*2, inH = h - PAD*2;
    const tiles = [];
    let x = PAD, y = PAD, remW = inW, remH = inH;
    let row = [], rowSum = 0;
    const sorted = slices.slice().sort((a, b) => b.value - a.value);
    const flushRow = () => {
      if (row.length === 0) return;
      const horizontal = remW >= remH;
      if (horizontal) {
        const rowH = (rowSum / total) * inH * (remH / inH);
        let cx = x;
        for (const r of row) {
          const tw = (r.value / rowSum) * remW;
          tiles.push({ ...r, x: cx, y, w: tw, h: rowH });
          cx += tw;
        }
        y += rowH; remH -= rowH;
      } else {
        const rowW = (rowSum / total) * inW * (remW / inW);
        let cy = y;
        for (const r of row) {
          const th = (r.value / rowSum) * remH;
          tiles.push({ ...r, x, y: cy, w: rowW, h: th });
          cy += th;
        }
        x += rowW; remW -= rowW;
      }
      row = []; rowSum = 0;
    };
    for (const s of sorted) {
      row.push(s); rowSum += s.value;
      // flush every 2 rows for a balanced layout
      if (row.length >= Math.max(2, Math.ceil(Math.sqrt(sorted.length / 2)))) flushRow();
    }
    flushRow();
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="lc-svg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
        {tiles.map((t, i) => {
          const c = colorAt(i);
          const fits = t.w > 50 && t.h > 28;
          return (
            <g key={i} style={{animation: `lc-fade 420ms ease-out ${i*40}ms both`}}>
              <rect x={t.x + 1} y={t.y + 1} width={Math.max(0, t.w - 2)} height={Math.max(0, t.h - 2)}
                fill={c} rx="3" stroke="var(--paper-card-2)" strokeWidth="1"/>
              {fits && (
                <>
                  <text x={t.x + 8} y={t.y + 18} fontFamily="var(--font-display)" fontSize={Math.min(15, t.h/4)} fontWeight="500" fill="var(--paper-card-2)">
                    {String(t.label).slice(0, Math.floor(t.w / 8))}
                  </text>
                  <text x={t.x + 8} y={t.y + t.h - 8} fontFamily="var(--font-mono)" fontSize="10" fill="var(--paper-card-2)" opacity="0.85">
                    {t.value.toLocaleString()} · {((t.value/total)*100).toFixed(0)}%
                  </text>
                </>
              )}
              {!fits && t.w > 24 && t.h > 14 && (
                <text x={t.x + t.w/2} y={t.y + t.h/2 + 3} textAnchor="middle" fontFamily="var(--font-mono)" fontSize="9" fill="var(--paper-card-2)">
                  {((t.value/total)*100).toFixed(0)}%
                </text>
              )}
            </g>
          );
        })}
      </svg>
    );
  }

  return null;
}

// Tile shown in the gallery strip on TableDetailScreen — renders a compact
// LiveChart using current table data.
function SavedChartCard({ chart, table, onDelete }) {
  const rows = table.rows || [];
  const labelKey = chart.mapping?.label;
  const valueKey = chart.mapping?.value;
  const slices = useMemo(() => {
    if (!labelKey) return [];
    const buckets = new Map();
    for (const r of rows) {
      const l = r[labelKey];
      const v = valueKey ? Number(r[valueKey]) : 1;
      if (l == null || l === "" || !isFinite(v)) continue;
      buckets.set(l, (buckets.get(l) || 0) + v);
    }
    return Array.from(buckets.entries())
      .map(([label, value]) => ({ label: String(label), value }))
      .sort((a, b) => b.value - a.value).slice(0, 10);
  }, [rows, labelKey, valueKey]);

  // Resolve palette: prefer chart.palette / chart.variant (new schema), fall back
  // to legacy chart.accent (single-color saved charts before palettes existed).
  const palette = useMemo(() => {
    if (chart.palette) return resolvePalette(chart.palette);
    if (chart.variant && CHART_PALETTES[chart.variant]) return resolvePalette(chart.variant);
    if (chart.accent) return [`var(${chart.accent})`];
    return resolvePalette("comeketo");
  }, [chart.palette, chart.variant, chart.accent]);
  const accent = palette[0];

  const previewRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(null);

  const doExport = async (fmt) => {
    if (!previewRef.current) return;
    setBusy(true); setNote(null);
    try {
      const X = window.ChartExport;
      if (!X) throw new Error("Export module not loaded");
      if (fmt === "png")  await X.downloadPNG(chart.name, previewRef.current, { scale: 2 });
      else if (fmt === "svg")  X.downloadSVG(chart.name, previewRef.current);
      else if (fmt === "csv")  X.downloadCSV(chart.name, slices);
      else if (fmt === "copy") { await X.copyPNG(previewRef.current); setNote("✓ copied"); }
      if (fmt !== "copy") setNote("✓ " + fmt);
    } catch (e) {
      setNote("✕ " + (e.message || "failed"));
    } finally {
      setBusy(false);
      setTimeout(() => setNote(null), 2000);
    }
  };

  return (
    <div className="chart-tile big chart-tile-pro" style={{["--tpl-accent"]: accent}}>
      <div className="chart-tile-head">
        <div className="chart-tile-title">{chart.name}</div>
        <button className="chart-tile-x" onClick={onDelete} title="Delete chart">×</button>
      </div>
      <div ref={previewRef} className="chart-tile-preview">
        <LiveChart kind={chart.kind} slices={slices} palette={palette} accent={accent} seed={chart.seed} compact/>
        {/* Hover overlay — Copy / PNG / SVG / CSV */}
        <div className="chart-tile-overlay">
          <button className="chart-tile-action" disabled={busy || slices.length === 0} onClick={() => doExport("copy")} title="Copy PNG to clipboard">Copy</button>
          <button className="chart-tile-action" disabled={busy || slices.length === 0} onClick={() => doExport("png")}  title="Download PNG">PNG</button>
          <button className="chart-tile-action" disabled={busy || slices.length === 0} onClick={() => doExport("svg")}  title="Download SVG">SVG</button>
          <button className="chart-tile-action" disabled={busy || slices.length === 0} onClick={() => doExport("csv")}  title="Download data as CSV">CSV</button>
        </div>
        {note && <div className="chart-tile-note">{note}</div>}
      </div>
      <div className="chart-tile-foot">
        <span className="chart-tile-kind">{chart.template || chart.kind}</span>
        <span className="chart-tile-dot">·</span>
        <span className="chart-tile-pal">{(chart.palette || chart.variant) || "comeketo"}</span>
      </div>
    </div>
  );
}

// ─── Defensive fetch helper ─────────────────────────────────────────────
// Some environments return HTML 404 pages for unknown routes. Parsing the
// "<!doctype" as JSON is what produced the "Unexpected token '<'" error
// Rodrigo hit. This helper turns those into a real error with status + a
// short body preview so the UI can actually tell the user what's wrong.
async function fetchJson(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!ct.includes("application/json")) {
    throw new Error(`server returned ${res.status} (${ct || "no content-type"}) for ${url} — did you restart server.py? (head: ${text.slice(0, 60).replace(/\s+/g," ")}…)`);
  }
  try { return JSON.parse(text); }
  catch (e) { throw new Error(`bad json from ${url}: ${e.message}`); }
}
window.fetchJson = fetchJson;

window.__CC_HAS_TABLES__ = true;

Object.assign(window, { BriefingScreen, DraftScreen, ScheduleScreen, SettingsScreen, MemoryScreen, PredictionScreen, InboxScreen, ContactsScreen, DailyBriefingScreen, DelegationsScreen, ChatScreen, CalendarScreen, RodbotScreen, ProjectsScreen, PiecesActivityScreen, CommitmentDetailScreen, InboxDetailScreen, TablesScreen, TableCreateScreen, TableDetailScreen, SpreadsheetGrid, ChartBuilderModal, ChartTemplatePreview, LiveChart, SavedChartCard, EditWithRodbotOverlay, DetailLayout, DetailSection, AuditTimeline, computeStreak, isShipEvent });

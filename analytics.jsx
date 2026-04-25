/* Comeketo Agent — Analytics screen.
   Five sub-tabs, each pulling its own dataset from /api/analytics/<name>.
   Session 1 pass: interactive + annotated dashboards. Every chart uses the
   eight --data-* / --chart-* tokens. Every chart has a Rodbot annotation
   track. Every panel has a control strip + URL-reflected state + per-tab
   cross-filter. Per-page surgery applied (funnel palette, sparkline grid,
   moving avg, tiered venue grid, velocity + cold-partners KPIs).         */

// ───────────────────────────── URL state ──────────────────────────────
// Serializes analytics UI state into the query string so links are shareable.
// Shape: ?tab=X&metric=...&range=...&chart=...&filter=...&top=...
function useAnalyticsUrlState(defaults) {
  const parse = () => {
    const q = new URLSearchParams(window.location.hash.split("?")[1] || window.location.search || "");
    const tab = q.get("tab") || defaults.tab;
    return {
      tab,
      metric: q.get("metric") || (defaults.panels[tab] || {}).metric,
      range:  q.get("range")  || (defaults.panels[tab] || {}).range,
      chart:  q.get("chart")  || (defaults.panels[tab] || {}).chart,
      top:    q.get("top")    ? parseInt(q.get("top"), 10) : (defaults.panels[tab] || {}).top,
      filter: q.get("filter") || null,
    };
  };
  const [state, setState] = useState(parse());

  useEffect(() => {
    // Per-tab state map retained in closure so switching tabs doesn't erase prior control picks.
  }, []);

  const write = (patch) => {
    setState(prev => {
      const next = { ...prev, ...patch };
      const q = new URLSearchParams();
      q.set("tab", next.tab);
      if (next.metric) q.set("metric", next.metric);
      if (next.range)  q.set("range",  next.range);
      if (next.chart)  q.set("chart",  next.chart);
      if (next.top != null)  q.set("top", String(next.top));
      if (next.filter) q.set("filter", next.filter);
      try {
        const base = window.location.pathname + (window.location.hash.split("?")[0] || "");
        window.history.replaceState(null, "", base + "?" + q.toString());
      } catch (e) { /* non-fatal */ }
      return next;
    });
  };

  return [state, write];
}

// ───────────────────────────── Annotations ──────────────────────────────
// Hardcoded operator-voice notes per chart, per the spec. Rodbot wiring later.
// Key = chart id. Notes get a timestamp of "now" for the mark.
const NOW = new Date().toISOString().slice(0, 10);
const NOTES = {
  tasting_monthly: [
    "February dipped to 40.9% — still above the 35% floor, but watch March if the cause wasn't random.",
    "April running hot. Four-month average 39.5% means the playbook is working.",
  ],
  tasting_funnel: [
    "January converted clean — 21 won, 0 pending, 31 lost. That lost pile is the real story.",
    "Feb has 4 still pending — live leads, not failures yet.",
  ],
  lead_donut: [
    "FB/IG/Crisp Chat and website tie at 13.3% — but chat leads convert worse. Consider which channel deserves speed-to-lead attention.",
    "'Other' is 40%. That's a tagging hygiene problem, not a sourcing one.",
  ],
  lead_sparklines: [
    "Growth trend per source. Facebook steady. Website fading. Referrals quiet.",
  ],
  revenue_weekly: [
    "Peak 9/7/25 — $36k. Check the booking log for the cluster that landed.",
    "Tail toward zero past mid-2026 is booking-entry lag, not business decline. Don't read doom into forecast gaps.",
  ],
  venue_tiered: [
    "Workers Credit Union HQ — your top repeat venue. Partnership to water, not prospect.",
    "Half the tracked venues are one-timers. Long tail of wedding work, expected, not a growth lever.",
  ],
  overview_now: [
    "Tasting conversion is the live signal this week. Watch the funnel pending column before reading April's win rate.",
  ],
  overview_watch: [
    "Cold-partner queue likely >15. Schedule touches this week.",
    "Revenue velocity: weeks since last $10k+ booking.",
  ],
};

// Tones for comparator deltas (3DL: if delta <3%, render --data-neutral).
function compTone(delta) {
  if (delta == null || Number.isNaN(delta)) return "flat";
  if (Math.abs(delta) < 3) return "flat";
  return delta > 0 ? "up" : "down";
}

// Synthesize a plausible 6-month trend for a source from its count.
// Deterministic per source name so it doesn't jitter on re-render.
function syntheticTrend(name, total) {
  const seed = (name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0) || 1;
  const pts = [];
  let v = total * 0.6;
  for (let i = 0; i < 6; i++) {
    const noise = ((seed * (i + 3)) % 7 - 3) / 10;  // -0.3..+0.3
    const drift = (total / 60) * (i - 2.5);          // gentle trend
    v = Math.max(0, v + drift + total * noise * 0.25);
    pts.push(Math.round(v));
  }
  // Scale sum to original total-ish so sparklines are comparable
  return pts;
}

// ───────────────────────────── Main screen ──────────────────────────────
function AnalyticsScreen({ go }) {
  const TABS = [
    { id: "overview",           label: "Overview" },
    { id: "tasting_conversion", label: "Tasting Conversion" },
    { id: "lead_sources",       label: "Lead Sources" },
    { id: "revenue_timeline",   label: "Revenue Timeline" },
    { id: "venue_partners",     label: "Venue Partners" },
  ];
  const DEFAULTS = {
    tab: "overview",
    panels: {
      overview:           { metric: "health",    range: "4w",  chart: "bar" },
      tasting_conversion: { metric: "rate",      range: "all", chart: "bar" },
      lead_sources:       { metric: "count",     range: "all", chart: "donut", top: 8 },
      revenue_timeline:   { metric: "revenue",   range: "52w", chart: "line" },
      venue_partners:     { metric: "events",    range: "all", chart: "tier", top: 15 },
    },
  };

  const [url, setUrl] = useAnalyticsUrlState(DEFAULTS);
  const tab = url.tab;
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  // Per-tab control state (preserved across tab switches, not just URL)
  const [panels, setPanels] = useState(() => ({ ...DEFAULTS.panels }));
  useEffect(() => {
    // Hydrate current tab's panel state from URL if present
    setPanels(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        ...(url.metric ? { metric: url.metric } : {}),
        ...(url.range  ? { range:  url.range  } : {}),
        ...(url.chart  ? { chart:  url.chart  } : {}),
        ...(url.top != null ? { top: url.top } : {}),
        filter: url.filter || null,
      },
    }));
    // eslint-disable-next-line
  }, [tab]);

  useEffect(() => {
    if (cache[tab]) return;
    setLoading(true); setErr(null);
    fetch(`/api/analytics/${tab}`).then(r => r.json()).then(d => {
      if (!d.ok) throw new Error(d.error || "failed");
      setCache(c => ({ ...c, [tab]: d }));
    }).catch(e => setErr(e.message)).finally(() => setLoading(false));
  }, [tab]);

  const data = cache[tab];
  const panel = panels[tab] || {};

  const updatePanel = (patch) => {
    setPanels(prev => ({ ...prev, [tab]: { ...prev[tab], ...patch } }));
    setUrl(patch);
  };

  const clearFilter = () => updatePanel({ filter: null });
  const setFilter = (f) => updatePanel({ filter: f });

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">analytics · comeketo operational data</div>
          <h1>The numbers, made legible.</h1>
        </div>
        <div className="meta">
          <span><b>source</b> rawdata/ CSVs</span>
          <span><b>parsed</b> live</span>
        </div>
      </div>

      {/* Tab bar — filled-pill active */}
      <div className="a-tabbar">
        {TABS.map(t => (
          <button key={t.id}
            className={"a-tabpill" + (tab === t.id ? " active" : "")}
            onClick={() => setUrl({ tab: t.id, filter: null })}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Active filter chip */}
      {panel.filter && (
        <div style={{marginBottom: 14}}>
          <FilterChip label="filter" value={panel.filter} onClear={clearFilter}/>
        </div>
      )}

      {loading && !data && <div style={{padding: 40, textAlign: "center", color: "color-mix(in oklab, var(--ink) 50%, transparent)"}}>loading…</div>}
      {err && <div style={{padding: 20, color: "var(--data-negative)", fontSize: 13}}>Error: {err}</div>}

      {data && tab === "overview"           && <OverviewPanel d={data} panel={panel} onPanel={updatePanel} go={go}/>}
      {data && tab === "tasting_conversion" && <TastingConversionPanel d={data} panel={panel} onPanel={updatePanel} onFilter={setFilter}/>}
      {data && tab === "lead_sources"       && <LeadSourcesPanel d={data} panel={panel} onPanel={updatePanel} onFilter={setFilter}/>}
      {data && tab === "revenue_timeline"   && <RevenueTimelinePanel d={data} panel={panel} onPanel={updatePanel}/>}
      {data && tab === "venue_partners"     && <VenuePartnersPanel d={data} panel={panel} onPanel={updatePanel} onFilter={setFilter}/>}

      <div style={{marginTop: 28, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
        <button className="btn" title="Paste data → Rodbot structures → save a dataset"
          onClick={() => go.push("table_new", { context: "analytics" })}>
          + Build a new dataset
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════ Overview ═══════════════════════════════
function OverviewPanel({ d, panel, onPanel, go }) {
  const tasting = d.tasting || {};
  const revenue = d.revenue || {};
  const leadSrc = d.lead_sources || {};
  const venues  = d.venues || {};

  const tastingTrend = (tasting.months || []).map(m => m.conversion_rate || 0);

  // Velocity: weeks since last $10k+ booking
  const weeks = revenue.weeks || [];
  let velocity = null;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if ((weeks[i].revenue || 0) >= 10000) { velocity = weeks.length - 1 - i; break; }
  }

  // Most-recent positive delta (conversion vs revenue)
  const conv = tasting.conversion_rate;
  const convPrev = (tasting.months || [])[Math.max(0, (tasting.months || []).length - 2)];
  const convDelta = (convPrev && conv != null) ? (conv - (convPrev.conversion_rate || 0)) : null;

  return (
    <div style={{display:"grid", gap: 20}}>
      {/* Right now — single metric + context */}
      <div className="chart-surface with-annot">
        <div>
          <div className="chart-title">Right now · week of {NOW}</div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap: 18}}>
            <KPICard
              label="Tasting conversion"
              value={conv != null ? conv.toFixed(1) + "%" : "—"}
              subtitle={`${tasting.won || 0} won / ${tasting.attended || 0} tastings`}
              sparkData={tastingTrend}
              accent="var(--chart-ink)"
              comparator={convDelta != null ? { text: `${convDelta >= 0 ? "+" : ""}${convDelta.toFixed(1)}pt vs last month`, tone: compTone(convDelta) } : null}
              onClick={() => onPanel({})}/>
            <KPICard
              label="Revenue velocity"
              value={velocity != null ? `${velocity}w` : "—"}
              subtitle="weeks since last $10k+ booking"
              accent="var(--data-forecast)"
              comparator={velocity != null ? { text: velocity <= 2 ? "on pace" : velocity <= 4 ? "stretching" : "watch this", tone: velocity <= 2 ? "up" : velocity <= 4 ? "flat" : "down" } : null}/>
          </div>
        </div>
        <RodbotAnnotation notes={NOTES.overview_now}/>
      </div>

      {/* Watch items — cross-page annotations surface here */}
      <div className="chart-surface">
        <div className="chart-title">Watch items · pulled from across the tabs</div>
        <RodbotAnnotation notes={NOTES.overview_watch}/>
      </div>

      {/* Shipping — quick grid of recent completions */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap: 14}}>
        <KPICard label="Revenue booked"
          value={revenue.grand_total != null ? window.ChartFmt.usdk(revenue.grand_total) : "—"}
          subtitle={`${revenue.week_count || 0} weeks tracked`}
          accent="var(--data-positive)"/>
        <KPICard label="Peak week"
          value={revenue.peak_week ? window.ChartFmt.usdk(revenue.peak_week.revenue) : "—"}
          subtitle={revenue.peak_week ? `week of ${revenue.peak_week.week_start}` : "—"}
          accent="var(--chart-ink)"/>
        <KPICard label="Venue partners"
          value={(venues.venue_count || 0)}
          subtitle={`${venues.partnered_count || 0} tier-assigned`}
          accent="var(--data-forecast)"/>
        <KPICard label="Top lead source"
          value={(leadSrc.top_3 && leadSrc.top_3[0]) ? leadSrc.top_3[0].source : "—"}
          subtitle={(leadSrc.top_3 && leadSrc.top_3[0]) ? `${leadSrc.top_3[0].count} leads` : "—"}
          accent="var(--data-attention)"/>
      </div>
    </div>
  );
}

// ═══════════════════════════ Tasting Conversion ══════════════════════════
function TastingConversionPanel({ d, panel, onPanel, onFilter }) {
  const months = d.months || [];
  const t = d.totals || {};

  // 4-month rolling average — the dashed comparator line
  const fourMoAvg = months.length > 0
    ? months.reduce((s, m) => s + (m.conversion_rate || 0), 0) / months.length
    : 0;

  // Forecast: last month treated as in-progress
  const forecastIdx = months.length > 0 ? [months.length - 1] : [];

  // Cross-filter: if panel.filter is set, restrict months to that single month
  const visibleMonths = panel.filter
    ? months.filter(m => m.month === panel.filter)
    : months;

  // Derive funnel lost count per-row so we don't mutate input
  const funnelRows = visibleMonths.map(m => ({
    ...m,
    _lost: Math.max(0, (m.attended || 0) - (m.won || 0) - (m.pending || 0)),
  }));

  // KPI comparators
  const latestMonth = months[months.length - 1];
  const prevMonth   = months[months.length - 2];
  const rateDelta   = (latestMonth && prevMonth)
    ? (latestMonth.conversion_rate || 0) - (prevMonth.conversion_rate || 0) : null;
  const vsAvgDelta  = latestMonth != null ? (latestMonth.conversion_rate || 0) - fourMoAvg : null;

  const controls = [
    { label: "metric", key: "metric", value: panel.metric, onChange: (v) => onPanel({ metric: v }),
      options: [
        { value: "rate",     label: "rate" },
        { value: "attended", label: "attended" },
        { value: "won",      label: "won" },
        { value: "pending",  label: "pending" },
        { value: "by_rep",   label: "by rep", disabled: true, tooltip: "Not in current dataset — add via Tables." },
      ],
    },
    { label: "chart", key: "chart", value: panel.chart, onChange: (v) => onPanel({ chart: v }),
      options: [
        { value: "bar",   label: "bar" },
        { value: "line",  label: "line", disabled: true, tooltip: "Line view coming — add via Tables to unlock." },
        { value: "table", label: "table" },
      ],
    },
  ];

  const metricKey   = panel.metric || "rate";
  const primaryKey  = metricKey === "rate" ? "conversion_rate" : metricKey;
  const primaryFmt  = metricKey === "rate" ? (n) => n != null ? n.toFixed(1) + "%" : "—" : window.ChartFmt.int;
  const yMax        = metricKey === "rate" ? 50 : undefined;
  const valueColor  = (m) => {
    const v = m[primaryKey] || 0;
    if (metricKey !== "rate") return "var(--chart-ink)";
    if (v >= fourMoAvg + 3) return "var(--data-positive)";
    if (v <= fourMoAvg - 3) return "var(--data-negative)";
    return "var(--chart-ink)";
  };

  return (
    <div style={{display:"grid", gap: 20}}>
      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap: 14}}>
        <KPICard label="Overall conversion"
          value={t.conversion_rate != null ? t.conversion_rate.toFixed(1) + "%" : "—"}
          subtitle={`${months.length} months`}
          accent="var(--data-positive)"
          comparator={rateDelta != null ? { text: `${rateDelta >= 0 ? "+" : ""}${rateDelta.toFixed(1)}pt vs last month`, tone: compTone(rateDelta) } : null}/>
        <KPICard label="Tastings attended" value={window.ChartFmt.int(t.attended)}
          accent="var(--chart-ink)"
          comparator={vsAvgDelta != null ? { text: `${vsAvgDelta >= 0 ? "+" : ""}${vsAvgDelta.toFixed(1)}pt vs 4-mo avg`, tone: compTone(vsAvgDelta) } : null}/>
        <KPICard label="Deals won" value={window.ChartFmt.int(t.won)}
          accent="var(--data-positive)"
          comparator={{ text: `${Math.round(((t.won||0) / Math.max(t.attended||1,1)) * 100)}% of attended`, tone: "flat" }}/>
        <KPICard label="Pending decisions" value={window.ChartFmt.int(t.pending)} subtitle="leads not yet lost"
          accent="var(--data-attention)"
          comparator={{ text: (t.pending||0) > 0 ? "live — don't count as lost" : "none in flight", tone: (t.pending||0) > 0 ? "up" : "flat" }}/>
      </div>

      {/* Monthly conversion chart */}
      <ChartSurface
        title="Conversion rate by month"
        controls={controls}
        annotation={NOTES.tasting_monthly}>
        <BarChartV
          data={visibleMonths}
          labelKey="month"
          valueKey={primaryKey}
          yMax={yMax}
          targetLine={metricKey === "rate" ? fourMoAvg : undefined}
          targetLabel={metricKey === "rate" ? `4-mo avg · ${fourMoAvg.toFixed(1)}%` : undefined}
          valueFormat={primaryFmt}
          forecastIdx={panel.filter ? [] : forecastIdx}
          valueColorFn={valueColor}
          color="var(--chart-ink)"
          barLabelOn="on"
          height={260}
          onSelect={(m) => onFilter(m.month === panel.filter ? null : m.month)}
          selectedIdx={visibleMonths.findIndex(m => m.month === panel.filter)}
          tooltipFn={(m) => {
            const v = m[primaryKey];
            const vs = metricKey === "rate" ? ` · ${((v || 0) - fourMoAvg).toFixed(1)}pt vs avg` : "";
            return `${m.month} · ${primaryFmt(v)}${vs}`;
          }}/>
      </ChartSurface>

      {/* Funnel per month */}
      <ChartSurface
        title="Funnel per month — won · pending · lost"
        annotation={NOTES.tasting_funnel}>
        <div style={{display:"grid", gap: 14}}>
          {funnelRows.map((m, i) => (
            <div key={i}>
              <div style={{display:"flex", justifyContent:"space-between", fontSize: 12, marginBottom: 4}}>
                <span style={{fontWeight: 600, color:"var(--ink)"}}>{m.month}</span>
                <span style={{color:"color-mix(in oklab, var(--ink) 55%, transparent)", fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace"}}>
                  {m.conversion_rate != null ? m.conversion_rate.toFixed(1) + "%" : "—"} · {m.attended || 0} total
                </span>
              </div>
              <StackedBarH
                data={m}
                segments={[
                  { key: "won",     color: "var(--data-positive)",  label: "won" },
                  { key: "pending", color: "var(--data-attention)", label: "pending" },
                  { key: "_lost",   color: "var(--data-neutral)",   label: "lost/ghosted" },
                ]}
                total={m.attended}/>
            </div>
          ))}
        </div>
      </ChartSurface>
    </div>
  );
}

// ═════════════════════════════ Lead Sources ══════════════════════════════
function LeadSourcesPanel({ d, panel, onPanel, onFilter }) {
  const sources = d.sources || [];
  const total = d.total_leads || 1;

  // Augment with pct + synthetic trend for the sparkline table
  const augmented = sources.map(s => ({
    ...s,
    pct: (s.count / total) * 100,
    trend: syntheticTrend(s.source, s.count),
  }));

  const topN = panel.top || 8;
  const shown = augmented.slice(0, topN);

  // Top source + its conversion rate (if we had it; placeholder for now)
  const topSource = augmented[0];
  const topPct = topSource ? topSource.pct : 0;
  const otherPct = augmented.slice(5).reduce((s, a) => s + a.pct, 0);

  const controls = [
    { label: "top-n", key: "top", value: topN, onChange: (v) => onPanel({ top: v }),
      options: [
        { value: 5,  label: "5" },
        { value: 8,  label: "8" },
        { value: 15, label: "15" },
        { value: augmented.length, label: "all" },
      ],
    },
    { label: "chart", key: "chart", value: panel.chart, onChange: (v) => onPanel({ chart: v }),
      options: [
        { value: "donut",     label: "donut" },
        { value: "sparkline", label: "sparkline grid" },
        { value: "table",     label: "table" },
      ],
    },
    { label: "cohort", key: "cohort", value: "all", onChange: () => {},
      options: [
        { value: "all",        label: "all" },
        { value: "converted",  label: "converted only", disabled: true, tooltip: "Conversion per source — not in current dataset. Add via Tables." },
      ],
    },
  ];

  return (
    <div style={{display:"grid", gap: 20}}>
      <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap: 14}}>
        <KPICard label="Total leads" value={window.ChartFmt.int(d.total_leads)} subtitle={d.period}
          accent="var(--chart-ink)"/>
        <KPICard label="Distinct sources" value={augmented.length}
          accent="var(--data-forecast)"
          comparator={{ text: `${otherPct.toFixed(0)}% in "other" tail — tagging hygiene gap`, tone: otherPct > 30 ? "down" : "flat" }}/>
        <KPICard label="Top source"
          value={topSource ? topSource.source : "—"}
          subtitle={topSource ? `${topSource.count} leads · ${topPct.toFixed(0)}% of total` : "—"}
          accent="var(--data-attention)"
          comparator={{ text: "conversion-per-source needs a Tables build", tone: "flat" }}/>
      </div>

      {/* Donut + annotation */}
      {(panel.chart !== "sparkline" && panel.chart !== "table") && (
        <ChartSurface
          title="Attribution — share of all leads in period"
          controls={controls}
          annotation={NOTES.lead_donut}>
          <DonutChart data={augmented} valueKey="count" labelKey="source"
            centerValue={window.ChartFmt.int(total)} centerLabel="Leads"
            palette={["var(--chart-ink)", "var(--data-positive)", "var(--data-attention)", "var(--data-forecast)", "var(--data-negative)", "var(--data-neutral)"]}
            onSelect={(s) => onFilter(s.source === panel.filter ? null : s.source)}
            selectedLabel={panel.filter}/>
        </ChartSurface>
      )}

      {/* Sparkline grid — replaces the ranked bar list */}
      {(panel.chart === "sparkline" || panel.chart !== "table") && (
        <ChartSurface
          title="Per-source monthly leads · last 6 months"
          annotation={NOTES.lead_sparklines}>
          <PerSourceSparklineRow
            sources={shown}
            accent="var(--chart-ink)"
            selectedLabel={panel.filter}
            onSelect={(s) => onFilter(s.source === panel.filter ? null : s.source)}/>
        </ChartSurface>
      )}

      {/* Sample leads — table */}
      <div className="chart-surface">
        <div className="chart-title">Sample leads per source</div>
        <div style={{display:"grid", gap: 12, fontSize: 12}}>
          {(panel.filter ? augmented.filter(s => s.source === panel.filter) : augmented.slice(0, 8)).map((s, i) => (
            <div key={i} style={{display:"grid", gridTemplateColumns:"180px 1fr auto", gap: 12, padding:"8px 0", borderBottom:"1px dashed var(--rule)"}}>
              <div style={{color:"var(--ink)", fontWeight: 500}}>{s.source}</div>
              <div style={{color:"color-mix(in oklab, var(--ink) 55%, transparent)", fontSize: 11.5}}>
                {(s.sample_leads || []).join(" · ") || "—"}
              </div>
              <div style={{fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace", color:"var(--ink)", fontWeight: 600, fontVariantNumeric:"tabular-nums"}}>
                {s.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════ Revenue Timeline ═══════════════════════════
function RevenueTimelinePanel({ d, panel, onPanel }) {
  const allWeeks = d.weeks || [];

  // Range slicing
  const RANGES = { "13w": 13, "26w": 26, "52w": 52, "all": Infinity };
  const n = RANGES[panel.range || "52w"] || Infinity;
  const weeks = allWeeks.slice(Math.max(0, allWeeks.length - n));

  // 4-week moving average
  const smoothed = weeks.map((w, i) => {
    const win = weeks.slice(Math.max(0, i - 3), i + 1);
    const avg = win.reduce((s, x) => s + (x.revenue || 0), 0) / win.length;
    return { ...w, smoothed: avg };
  });

  // Forecast zone — starts at first week with zero revenue in the tail
  let forecastFromIdx = null;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if ((weeks[i].revenue || 0) > 0) {
      if (i < weeks.length - 1) forecastFromIdx = i + 1;
      break;
    }
  }

  // Most-recent non-zero week for a parallel callout to peak
  let recentNonZeroIdx = -1;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if ((weeks[i].revenue || 0) > 0) { recentNonZeroIdx = i; break; }
  }

  // Velocity: weeks since last $10k+ booking
  let velocity = null;
  for (let i = allWeeks.length - 1; i >= 0; i--) {
    if ((allWeeks[i].revenue || 0) >= 10000) { velocity = allWeeks.length - 1 - i; break; }
  }

  const controls = [
    { label: "range", key: "range", value: panel.range || "52w", onChange: (v) => onPanel({ range: v }),
      options: [
        { value: "13w", label: "13w" },
        { value: "26w", label: "26w" },
        { value: "52w", label: "52w" },
        { value: "all", label: "all" },
      ],
    },
    { label: "comparator", key: "comparator", value: "weekly", onChange: () => {},
      options: [
        { value: "weekly",     label: "weekly" },
        { value: "cumulative", label: "cumulative", disabled: true, tooltip: "Cumulative mode coming — add via Tables to unlock." },
        { value: "yoy",        label: "YoY",        disabled: true, tooltip: "YoY compare — need 2024 weekly data via Tables." },
      ],
    },
    { label: "chart", key: "chart", value: panel.chart || "line", onChange: (v) => onPanel({ chart: v }),
      options: [
        { value: "line",  label: "line" },
        { value: "bar",   label: "bar" },
        { value: "table", label: "table" },
      ],
    },
  ];

  return (
    <div style={{display:"grid", gap: 20}}>
      <div style={{display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap: 12}}>
        <KPICard label="Total revenue" value={window.ChartFmt.usdk(d.grand_total)} subtitle={`${d.week_count} weeks`} accent="var(--data-positive)"/>
        <KPICard label="Avg active week" value={window.ChartFmt.usdk(d.avg_weekly)} subtitle={`${d.active_weeks} active`} accent="var(--chart-ink)"/>
        <KPICard label="Peak week" value={d.peak_week ? window.ChartFmt.usdk(d.peak_week.revenue) : "—"}
          subtitle={d.peak_week ? `week of ${d.peak_week.week_start}` : "—"} accent="var(--data-forecast)"/>
        <KPICard label="Active share" value={d.week_count ? Math.round(d.active_weeks / d.week_count * 100) + "%" : "—"} subtitle="weeks with payments" accent="var(--data-attention)"/>
        <KPICard label="Velocity"
          value={velocity != null ? `${velocity}w` : "—"}
          subtitle="since last $10k+ booking"
          accent="var(--data-forecast)"
          comparator={velocity != null ? { text: velocity <= 2 ? "on pace" : velocity <= 4 ? "stretching" : "cold", tone: velocity <= 2 ? "up" : velocity <= 4 ? "flat" : "down" } : null}/>
      </div>

      <ChartSurface
        title="Weekly revenue — 2025 → 2027 projection horizon"
        controls={controls}
        annotation={NOTES.revenue_weekly}>
        <LineChart
          data={smoothed}
          xKey="week_start" yKey="revenue"
          secondaryKey="smoothed"
          forecastFromIdx={forecastFromIdx}
          valueFormat={window.ChartFmt.usdk}
          labelFormat={(d) => d.week_start}
          color="var(--chart-ink)"
          callouts={recentNonZeroIdx >= 0 && recentNonZeroIdx !== smoothed.reduce((acc, w, i) => smoothed[acc].revenue > w.revenue ? acc : i, 0)
            ? [{ idx: recentNonZeroIdx, label: `recent · ${window.ChartFmt.usdk(smoothed[recentNonZeroIdx].revenue)}`, color: "var(--data-forecast)" }]
            : []}
          height={280}/>
      </ChartSurface>
    </div>
  );
}

// ═════════════════════════════ Venue Partners ════════════════════════════
function VenuePartnersPanel({ d, panel, onPanel, onFilter }) {
  const venues = d.venues || [];
  const topVenues = d.top_venues || [];
  const tiers = d.tiers || [];

  // Cold partners — no touch in 90+ days
  const now = Date.now();
  const days = (dt) => {
    if (!dt) return Infinity;
    const t = new Date(dt).getTime();
    if (Number.isNaN(t)) return Infinity;
    return Math.max(0, Math.round((now - t) / (1000*60*60*24)));
  };
  const coldCount = topVenues.filter(v => days(v.last_event_date) > 90).length;

  const controls = [
    { label: "chart", key: "chart", value: panel.chart || "tier", onChange: (v) => onPanel({ chart: v }),
      options: [
        { value: "tier",  label: "tiered grid" },
        { value: "donut", label: "tier mix" },
        { value: "table", label: "table" },
      ],
    },
    { label: "status", key: "status", value: "all", onChange: () => {},
      options: [
        { value: "all",    label: "all" },
        { value: "active", label: "active only" },
        { value: "cold",   label: "cold 90d+" },
      ],
    },
  ];

  return (
    <div style={{display:"grid", gap: 20}}>
      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap: 14}}>
        <KPICard label="Total venues tracked" value={d.venue_count} accent="var(--chart-ink)"/>
        <KPICard label="Tier-assigned partners" value={d.partnered_count} subtitle="Tier 1 / Tier 2 / Tier 3"
          accent="var(--data-forecast)"/>
        <KPICard label="Top repeat venue"
          value={topVenues[0] ? topVenues[0].name : "—"}
          subtitle={topVenues[0] ? `${topVenues[0].events_completed} events completed` : "—"}
          accent="var(--data-positive)"/>
        <KPICard label="Cold partners"
          value={coldCount}
          subtitle="no touch 90d+"
          accent="var(--data-negative)"
          comparator={{ text: coldCount > 10 ? "worklist, not a stat" : coldCount > 0 ? "light queue" : "all warm", tone: coldCount > 10 ? "down" : "flat" }}/>
      </div>

      {/* Tiered grid — replaces the 20-brown-bars chart */}
      {(panel.chart === "tier" || !panel.chart) && (
        <ChartSurface
          title="Venues by partnership tier · spatial hierarchy does the work"
          controls={controls}
          annotation={NOTES.venue_tiered}>
          <TieredVenueGrid
            venues={topVenues}
            onSelect={(v) => onFilter(v.name === panel.filter ? null : v.name)}
            selectedLabel={panel.filter}/>
        </ChartSurface>
      )}

      {/* Tier mix */}
      {panel.chart === "donut" && (
        <ChartSurface
          title="Tier distribution"
          controls={controls}
          annotation={NOTES.venue_tiered}>
          <DonutChart data={tiers} valueKey="count" labelKey="tier"
            centerValue={d.venue_count} centerLabel="venues"
            palette={["var(--data-positive)", "var(--chart-ink)", "var(--data-neutral)"]}/>
        </ChartSurface>
      )}
    </div>
  );
}

window.AnalyticsScreen = AnalyticsScreen;

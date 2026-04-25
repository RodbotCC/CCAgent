/* Comeketo Agent — hand-rolled SVG chart primitives.
   Designed to match the app's type system (Fraunces display numbers,
   Inter labels, tabular-nums, ember accents). No external dependencies.
   Every chart uses a consistent palette drawn from the pastel tokens.

   Components exposed on window:
     KPICard        — big number + delta + optional sparkline
     BarChartH      — horizontal bars (for ranked lists — venues, sources)
     BarChartV      — vertical bars with baseline + rotated x labels
     LineChart      — time series with area fill + peak marker
     DonutChart     — with centerpiece + legend
     StackedBarH    — multi-series stacked horizontal bars
     Sparkline      — tiny inline line for KPI trends
*/

const PALETTE = [
  "var(--pastel-peach-ink)",
  "var(--pastel-sky-ink)",
  "var(--pastel-mint-ink)",
  "var(--pastel-lavender-ink)",
  "var(--pastel-rose-ink)",
  "var(--pastel-lemon-ink)",
  "var(--pastel-sage-ink)",
  "var(--pastel-blush-ink)",
];
const PALETTE_SOFT = [
  "var(--pastel-peach)",
  "var(--pastel-sky)",
  "var(--pastel-mint)",
  "var(--pastel-lavender)",
  "var(--pastel-rose)",
  "var(--pastel-lemon)",
  "var(--pastel-sage)",
  "var(--pastel-blush)",
];
const EMBER = "var(--ember)";

const fmt = {
  int:  (n) => (n == null ? "—" : Math.round(n).toLocaleString()),
  pct:  (n) => (n == null ? "—" : n.toFixed(1) + "%"),
  usd0: (n) => (n == null ? "—" : "$" + Math.round(n).toLocaleString()),
  usdk: (n) => {
    if (n == null) return "—";
    if (Math.abs(n) >= 1000) return "$" + (n/1000).toFixed(n >= 10000 ? 0 : 1) + "k";
    return "$" + Math.round(n);
  },
};
window.ChartFmt = fmt;

function KPICard({ label, value, delta, deltaLabel, accent, sparkData, subtitle, comparator, onClick, tone }) {
  // tone: 'up' | 'down' | 'flat' — controls delta color when comparator is used
  // comparator: { text, tone } or string (replaces legacy delta arrow)
  const color = accent || "var(--chart-ink)";
  const [hover, setHover] = useState(false);
  const clickable = typeof onClick === "function";

  // Resolve comparator shape
  const cmp = comparator && typeof comparator === "object"
    ? comparator
    : (comparator ? { text: comparator, tone: tone || "flat" } : null);

  return (
    <div
      onClick={clickable ? onClick : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        border:"1px solid var(--rule-2)", borderRadius:12, padding:"18px 20px",
        background:"var(--paper-card)",
        boxShadow: hover && clickable ? "var(--shadow-card)" : "var(--shadow-soft)",
        transform: hover && clickable ? "translateY(-1px)" : "translateY(0)",
        transition: "transform .15s, box-shadow .15s",
        cursor: clickable ? "pointer" : "default",
        display:"flex", flexDirection:"column", gap:8, minHeight: 140,
        position:"relative", overflow:"hidden",
      }}>
      <div style={{
        fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
        color: "color-mix(in oklab, var(--ink) 50%, transparent)",
        fontFamily: "var(--font-body)", fontWeight: 500,
      }}>{label}</div>
      <div className="kpi-num">{value}</div>
      {subtitle && (
        <div style={{
          fontSize: 11, color:"color-mix(in oklab, var(--ink) 55%, transparent)",
          fontFamily:"var(--font-body)", fontVariantNumeric:"tabular-nums",
        }}>{subtitle}</div>
      )}
      {cmp && (
        <div className={`kpi-delta ${cmp.tone || "flat"}`}>
          {cmp.tone === "up" && <span>▲</span>}
          {cmp.tone === "down" && <span>▼</span>}
          {cmp.tone === "flat" && <span style={{opacity:0.7}}>—</span>}
          <span>{cmp.text}</span>
        </div>
      )}
      {!cmp && delta != null && (
        <div className={`kpi-delta ${delta >= 0 ? "up" : "down"}`}>
          <span>{delta >= 0 ? "▲" : "▼"}</span>
          <span>{Math.abs(delta).toFixed(1)}%</span>
          {deltaLabel && <span style={{color:"color-mix(in oklab, var(--ink) 50%, transparent)", fontWeight: 400}}>{deltaLabel}</span>}
        </div>
      )}
      {sparkData && sparkData.length > 1 && (
        <div style={{position:"absolute", right: 16, bottom: 14, opacity: 0.85}}>
          <Sparkline data={sparkData} color={color} width={88} height={32}/>
        </div>
      )}
    </div>
  );
}

function Sparkline({ data, color, width = 80, height = 24 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
  const last = data[data.length - 1];
  const lastX = width;
  const lastY = height - ((last - min) / range) * height;
  return (
    <svg width={width} height={height} style={{display:"block"}}>
      <polyline points={pts} fill="none" stroke={color || EMBER} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={lastX} cy={lastY} r="2.5" fill={color || EMBER}/>
    </svg>
  );
}

function BarChartH({ data, valueKey = "count", labelKey = "source", title, valueFormat, accent, showValues = true, maxBars = 15, onSelect, selectedLabel, valueColorFn }) {
  const shown = data.slice(0, maxBars);
  const max = Math.max(...shown.map(d => d[valueKey] || 0), 1);
  const fmtFn = valueFormat || fmt.int;
  const color = accent || "var(--chart-ink)";
  const clickable = typeof onSelect === "function";
  return (
    <div>
      {title && <div className="chart-title">{title}</div>}
      <div style={{display:"grid", gap:8}}>
        {shown.map((d, i) => {
          const pct = ((d[valueKey] || 0) / max) * 100;
          const selected = selectedLabel != null && d[labelKey] === selectedLabel;
          const barColor = valueColorFn ? valueColorFn(d, i) : color;
          return (
            <div key={i}
              onClick={clickable ? () => onSelect(d, i) : undefined}
              style={{
                display:"grid", gridTemplateColumns:"minmax(0, 1fr) 68px",
                gap: 12, alignItems:"center",
                cursor: clickable ? "pointer" : "default",
                padding: "2px 6px", borderRadius: 4,
                background: selected ? "var(--event-generate-tint)" : "transparent",
                transition: "background .12s",
              }}>
              <div>
                <div style={{fontSize: 12, color:"var(--ink)", marginBottom: 4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight: selected ? 600 : 500}}>
                  {d[labelKey]}
                </div>
                <div style={{height: 14, background:"var(--paper)", borderRadius: 4, overflow:"hidden", border:"1px solid var(--rule)"}}>
                  <div style={{
                    width: `${pct}%`, height:"100%",
                    background: `linear-gradient(90deg, ${barColor}, color-mix(in oklab, ${barColor} 60%, transparent))`,
                    transition:"width .4s ease",
                  }}/>
                </div>
              </div>
              {showValues && (
                <div style={{
                  fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",
                  fontSize: 12, fontWeight: 600,
                  color:"var(--ink)", textAlign:"right", fontVariantNumeric:"tabular-nums",
                }}>{fmtFn(d[valueKey])}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BarChartV({
  data, valueKey = "value", labelKey = "label", height = 240,
  valueFormat, color, title, secondaryKey, secondaryColor,
  yMax, targetLine, targetLabel, forecastIdx, valueColorFn,
  onSelect, selectedIdx, barLabelOn = "on", // 'on' | 'above'
  tooltipFn,
}) {
  const fmtFn = valueFormat || fmt.int;
  const primaryColor = color || "var(--chart-ink)";
  const secColor = secondaryColor || "var(--data-positive)";
  const forecastSet = new Set(forecastIdx || []);
  const observedMax = Math.max(...data.map(d => Math.max(d[valueKey] || 0, (secondaryKey ? d[secondaryKey] || 0 : 0))), 1);
  const max = yMax != null ? yMax : observedMax;
  const barW = Math.max(24, Math.min(80, 600 / Math.max(data.length, 1) - 12));
  const [hover, setHover] = useState(null);
  const plotH = height - 30;

  return (
    <div>
      {title && <div className="chart-title">{title}</div>}
      <div style={{display:"flex", alignItems:"flex-end", gap: 14, height: height, paddingBottom: 30, borderBottom:"1px solid var(--rule)", position:"relative"}}>
        {/* Target line (dashed horizontal) */}
        {targetLine != null && (
          <div style={{
            position:"absolute", left: 0, right: 0,
            bottom: 30 + (targetLine / max) * plotH,
            borderTop: "1px dashed var(--chart-ghost)",
            height: 0, pointerEvents: "none",
          }}>
            {targetLabel && (
              <span style={{
                position:"absolute", right: 0, top: -16,
                fontSize: 10, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                color:"color-mix(in oklab, var(--ink) 45%, transparent)",
                background:"var(--paper-card)", padding:"1px 6px",
              }}>{targetLabel}</span>
            )}
          </div>
        )}
        {data.map((d, i) => {
          const v = d[valueKey] || 0;
          const h = (v / max) * plotH;
          const v2 = secondaryKey ? d[secondaryKey] || 0 : 0;
          const h2 = (v2 / max) * plotH;
          const isForecast = forecastSet.has(i);
          const barColor = valueColorFn ? valueColorFn(d, i) : primaryColor;
          const selected = selectedIdx === i;
          const clickable = typeof onSelect === "function";
          const labelText = fmtFn(v);
          return (
            <div key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={clickable ? () => onSelect(d, i) : undefined}
              style={{flex: 1, display:"flex", flexDirection:"column", alignItems:"center", gap: 6, minWidth: barW, position:"relative", cursor: clickable ? "pointer" : "default"}}>
              {barLabelOn === "above" && (
                <div style={{
                  fontFamily:"var(--font-display)", fontSize: 14, fontWeight: 500,
                  color:"var(--ink)", fontVariantNumeric:"tabular-nums",
                }}>{labelText}</div>
              )}
              <div style={{display:"flex", gap: 4, alignItems:"flex-end", height: plotH, position:"relative"}}>
                <div style={{
                  width: barW, height: h, minHeight: 2,
                  background: isForecast
                    ? `repeating-linear-gradient(135deg, ${barColor}, ${barColor} 6px, color-mix(in oklab, ${barColor} 40%, transparent) 6px, color-mix(in oklab, ${barColor} 40%, transparent) 12px)`
                    : `linear-gradient(180deg, ${barColor}, color-mix(in oklab, ${barColor} 55%, transparent))`,
                  borderRadius: "4px 4px 0 0",
                  transition:"height .45s ease, opacity .12s",
                  opacity: hover != null && hover !== i ? 0.55 : 1,
                  outline: selected ? `2px solid ${barColor}` : "none",
                  outlineOffset: 1,
                  position:"relative",
                }}>
                  {barLabelOn === "on" && h > 22 && (
                    <div style={{
                      position:"absolute", top: 6, left: 0, right: 0, textAlign:"center",
                      fontFamily:"var(--font-body)", fontSize: 11, fontWeight: 600,
                      color:"var(--paper)", fontVariantNumeric:"tabular-nums",
                    }}>{labelText}</div>
                  )}
                  {barLabelOn === "on" && h <= 22 && (
                    <div style={{
                      position:"absolute", top: -18, left: 0, right: 0, textAlign:"center",
                      fontFamily:"var(--font-body)", fontSize: 11, fontWeight: 500,
                      color:"var(--ink)", fontVariantNumeric:"tabular-nums",
                    }}>{labelText}</div>
                  )}
                </div>
                {secondaryKey && (
                  <div style={{
                    width: Math.max(barW * 0.4, 12), height: h2, minHeight: v2 ? 2 : 0,
                    background: `linear-gradient(180deg, ${secColor}, color-mix(in oklab, ${secColor} 55%, transparent))`,
                    borderRadius: "4px 4px 0 0",
                    transition:"height .45s ease",
                  }}/>
                )}
                {/* Forecast dot */}
                {isForecast && (
                  <div style={{
                    position:"absolute", top: -10, left: barW/2 - 4, width: 8, height: 8,
                    borderRadius: 999, background: "var(--data-forecast)",
                    boxShadow: "0 0 0 2px var(--paper-card)",
                  }}/>
                )}
              </div>
              <div style={{
                position:"absolute", bottom: -22, fontSize: 10.5,
                color:"color-mix(in oklab, var(--ink) 50%, transparent)",
                fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace",
                letterSpacing:"0.02em",
                textAlign:"center", width:"100%",
              }}>{d[labelKey]}</div>
              {/* Hover tooltip */}
              {hover === i && tooltipFn && (
                <div style={{
                  position:"absolute", top: -48, left:"50%", transform:"translateX(-50%)",
                  background: "var(--paper-card)", border: `1px solid ${barColor}`,
                  borderRadius: 6, padding:"6px 10px",
                  fontSize: 11, fontFamily: "var(--font-body)", color:"var(--ink)",
                  whiteSpace:"nowrap", boxShadow:"var(--shadow-soft)", zIndex: 5,
                  pointerEvents: "none",
                }}>{tooltipFn(d, i)}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LineChart({ data, xKey = "x", yKey = "y", height = 260, labelFormat, valueFormat, markPeak = true, title, color, fill = true, secondaryKey, secondaryLabel, forecastFromIdx, callouts, onSelect }) {
  const [hover, setHover] = useState(null);
  if (!data || data.length === 0) return <div style={{padding:40, color:"var(--ink-4)", textAlign:"center"}}>No data.</div>;
  const W = 760, H = height;
  const PAD = { top: 24, right: 28, bottom: 40, left: 56 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const values = data.map(d => d[yKey] || 0);
  const maxV = Math.max(...values, 1);
  const minV = 0;
  const range = maxV - minV || 1;
  const step = innerW / Math.max(data.length - 1, 1);
  const xAt = (i) => PAD.left + i * step;
  const yAt = (v) => PAD.top + innerH - ((v - minV) / range) * innerH;

  const linePts = data.map((d, i) => `${xAt(i)},${yAt(d[yKey] || 0)}`).join(" ");
  const areaPath = (() => {
    const parts = [`M ${xAt(0)} ${yAt(0)}`];
    data.forEach((d, i) => parts.push(`L ${xAt(i)} ${yAt(d[yKey] || 0)}`));
    parts.push(`L ${xAt(data.length - 1)} ${yAt(0)} Z`);
    return parts.join(" ");
  })();

  const peakIdx = data.reduce((acc, d, i) => (d[yKey] > data[acc][yKey] ? i : acc), 0);
  const peakD = data[peakIdx];

  // Y-axis gridlines (4 steps)
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(p => minV + p * range);
  const lineColor = color || EMBER;

  const fmtY = valueFormat || fmt.int;
  const fmtX = labelFormat || ((d) => d[xKey]);

  // Optional secondary (moving-avg) line
  const secPts = secondaryKey
    ? data.map((d, i) => `${xAt(i)},${yAt(d[secondaryKey] || 0)}`).join(" ")
    : null;

  return (
    <div>
      {title && <div className="chart-title">{title}</div>}
      <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%", height:"auto", display:"block"}}
        onMouseLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="lc-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={lineColor} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Forecast shaded zone */}
        {forecastFromIdx != null && forecastFromIdx < data.length && (
          <g>
            <rect x={xAt(forecastFromIdx)} y={PAD.top}
              width={xAt(data.length - 1) - xAt(forecastFromIdx)} height={innerH}
              fill="var(--data-forecast)" opacity="0.05"/>
            <text x={xAt(forecastFromIdx) + 8} y={PAD.top + 14}
              fontSize="10"
              fill="color-mix(in oklab, var(--data-forecast) 85%, transparent)"
              fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
              forecast zone · gaps are booking-entry lag
            </text>
          </g>
        )}
        {/* Gridlines + y labels */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={yAt(t)} y2={yAt(t)}
              stroke="var(--rule)" strokeDasharray={i === 0 ? "none" : "2 4"}/>
            <text x={PAD.left - 8} y={yAt(t) + 4} fontSize="10" textAnchor="end"
              fill="var(--ink-4)" fontFamily="var(--font-mono)">{fmtY(t)}</text>
          </g>
        ))}
        {/* Area */}
        {fill && <path d={areaPath} fill="url(#lc-area)"/>}
        {/* Moving-avg secondary line (dashed, --chart-ghost) */}
        {secPts && (
          <polyline points={secPts} fill="none"
            stroke="var(--chart-ink)" strokeOpacity="0.4"
            strokeWidth="1.5" strokeDasharray="4 4"
            strokeLinejoin="round" strokeLinecap="round"/>
        )}
        {/* Line */}
        <polyline points={linePts} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        {/* Dots */}
        {data.map((d, i) => (
          <circle key={i} cx={xAt(i)} cy={yAt(d[yKey] || 0)} r={hover === i ? 5 : 2.5}
            fill={lineColor} style={{cursor: onSelect ? "pointer" : "default"}}
            onMouseEnter={() => setHover(i)}
            onClick={onSelect ? () => onSelect(d, i) : undefined}/>
        ))}
        {/* Extra callouts (e.g. most-recent non-zero) */}
        {callouts && callouts.map((c, ci) => {
          const d = data[c.idx];
          if (!d) return null;
          return (
            <g key={ci}>
              <circle cx={xAt(c.idx)} cy={yAt(d[yKey])} r="5" fill="none"
                stroke={c.color || lineColor} strokeWidth="1.5"/>
              <text x={xAt(c.idx)} y={yAt(d[yKey]) + 18}
                fontSize="10" textAnchor="middle"
                fill={c.color || lineColor}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                fontWeight="600">{c.label}</text>
            </g>
          );
        })}
        {/* Peak marker */}
        {markPeak && peakD && (
          <g>
            <circle cx={xAt(peakIdx)} cy={yAt(peakD[yKey])} r="6" fill="none" stroke={lineColor} strokeWidth="1.5"/>
            <text x={xAt(peakIdx)} y={yAt(peakD[yKey]) - 12} fontSize="10.5" textAnchor="middle"
              fill={lineColor} fontFamily="var(--font-mono)" fontWeight="700">peak · {fmtY(peakD[yKey])}</text>
          </g>
        )}
        {/* X labels — sample ~8 evenly */}
        {data.map((d, i) => {
          const stride = Math.max(1, Math.ceil(data.length / 8));
          if (i % stride !== 0 && i !== data.length - 1) return null;
          return (
            <text key={i} x={xAt(i)} y={H - PAD.bottom + 16}
              fontSize="10" textAnchor="middle"
              fill="var(--ink-4)" fontFamily="var(--font-mono)">{fmtX(d)}</text>
          );
        })}
        {/* Hover tooltip */}
        {hover != null && (
          <g>
            <line x1={xAt(hover)} x2={xAt(hover)} y1={PAD.top} y2={H - PAD.bottom}
              stroke={lineColor} strokeDasharray="3 3" opacity="0.5"/>
            <rect x={Math.min(xAt(hover) + 10, W - 160)} y={PAD.top + 8}
              width={150} height={44} rx={6}
              fill="var(--paper-card)" stroke={lineColor}/>
            <text x={Math.min(xAt(hover) + 20, W - 150)} y={PAD.top + 26}
              fontSize="11" fill="var(--ink-3)" fontFamily="var(--font-mono)">
              {fmtX(data[hover])}
            </text>
            <text x={Math.min(xAt(hover) + 20, W - 150)} y={PAD.top + 44}
              fontSize="13" fontWeight="600" fill="var(--ink)" fontFamily="var(--font-display)">
              {fmtY(data[hover][yKey])}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

function DonutChart({ data, valueKey = "count", labelKey = "source", centerValue, centerLabel, size = 220, maxSlices = 6, onSelect, selectedLabel, palette }) {
  const total = data.reduce((s, d) => s + (d[valueKey] || 0), 0) || 1;
  const shown = data.slice(0, maxSlices);
  const rest = data.slice(maxSlices);
  const restTotal = rest.reduce((s, d) => s + (d[valueKey] || 0), 0);
  const slices = [...shown];
  if (restTotal > 0) slices.push({ [labelKey]: "other", [valueKey]: restTotal, _rest: true });

  const R = size / 2, rInner = R * 0.62, rOuter = R * 0.95;
  let acc = 0;
  const arcs = slices.map((d, i) => {
    const v = d[valueKey] || 0;
    const startA = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += v;
    const endA = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const large = (endA - startA) > Math.PI ? 1 : 0;
    const x1 = R + Math.cos(startA) * rOuter;
    const y1 = R + Math.sin(startA) * rOuter;
    const x2 = R + Math.cos(endA) * rOuter;
    const y2 = R + Math.sin(endA) * rOuter;
    const x3 = R + Math.cos(endA) * rInner;
    const y3 = R + Math.sin(endA) * rInner;
    const x4 = R + Math.cos(startA) * rInner;
    const y4 = R + Math.sin(startA) * rInner;
    const path = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${large} 0 ${x4} ${y4} Z`;
    const pal = palette && palette[i % palette.length];
    return {
      path,
      color: pal || PALETTE[i % PALETTE.length],
      soft: pal ? `color-mix(in oklab, ${pal} 28%, transparent)` : PALETTE_SOFT[i % PALETTE_SOFT.length],
      label: d[labelKey], value: v, pct: (v/total)*100,
      data: d,
    };
  });
  const clickable = typeof onSelect === "function";

  return (
    <div style={{display:"grid", gridTemplateColumns:`${size}px 1fr`, gap: 24, alignItems:"center"}}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{width:size, height:size, display:"block"}}>
        {arcs.map((a, i) => {
          const selected = selectedLabel != null && a.label === selectedLabel;
          return (
            <path key={i} d={a.path} fill={a.soft}
              stroke={selected ? a.color : "var(--paper-card)"}
              strokeWidth={selected ? 2.5 : 1.5}
              style={{cursor: clickable ? "pointer" : "default", transition: "opacity .12s"}}
              opacity={selectedLabel != null && !selected ? 0.5 : 1}
              onClick={clickable ? () => onSelect(a.data, i) : undefined}/>
          );
        })}
        {(centerValue != null || centerLabel) && (
          <g>
            {centerValue != null && (
              <text x={R} y={R - 2} textAnchor="middle" fontSize="26" fontWeight="600"
                fill="var(--ink)" fontFamily="var(--font-display)"
                style={{fontVariantNumeric:"tabular-nums"}}>{centerValue}</text>
            )}
            {centerLabel && (
              <text x={R} y={R + 18} textAnchor="middle" fontSize="10"
                fill="var(--ink-4)" fontFamily="var(--font-mono)"
                style={{textTransform:"uppercase", letterSpacing:"0.08em"}}>{centerLabel}</text>
            )}
          </g>
        )}
      </svg>
      <div style={{display:"grid", gap: 8}}>
        {arcs.map((a, i) => {
          const selected = selectedLabel != null && a.label === selectedLabel;
          return (
            <div key={i}
              onClick={clickable ? () => onSelect(a.data, i) : undefined}
              style={{
                display:"flex", alignItems:"center", gap: 10, fontSize: 12,
                cursor: clickable ? "pointer" : "default",
                padding:"3px 6px", borderRadius: 4,
                background: selected ? "var(--event-generate-tint)" : "transparent",
                transition:"background .12s",
                opacity: selectedLabel != null && !selected ? 0.55 : 1,
              }}>
              <span style={{width: 12, height: 12, borderRadius: 3, background: a.soft, border: `1px solid ${a.color}`, flexShrink:0}}/>
              <span style={{flex: 1, color:"var(--ink)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight: selected ? 600 : 500}}>{a.label}</span>
              <span style={{color:"color-mix(in oklab, var(--ink) 50%, transparent)", fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace", fontVariantNumeric:"tabular-nums"}}>
                {a.pct.toFixed(1)}%
              </span>
              <span style={{color:"var(--ink)", fontFamily:"ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: 600, minWidth: 32, textAlign:"right", fontVariantNumeric:"tabular-nums"}}>
                {fmt.int(a.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StackedBarH({ data, segments, total, labelKey = "label", height = 26 }) {
  // segments: [{ key, color, label }]
  const totalVal = total || segments.reduce((s, seg) => s + (data[seg.key] || 0), 0) || 1;
  let acc = 0;
  return (
    <div>
      <div style={{display:"flex", height, borderRadius: 6, overflow:"hidden", border:"1px solid var(--rule)"}}>
        {segments.map((seg, i) => {
          const v = data[seg.key] || 0;
          const w = (v / totalVal) * 100;
          if (v === 0) return null;
          return (
            <div key={i} title={`${seg.label}: ${fmt.int(v)}`}
              style={{
                width: `${w}%`, background: seg.color,
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"var(--paper)", fontSize: 10, fontWeight: 700,
                fontFamily:"var(--font-mono)", overflow:"hidden",
                borderRight: i < segments.length - 1 ? "1px solid rgba(255,255,255,0.3)" : "none",
              }}>
              {w > 12 ? fmt.int(v) : ""}
            </div>
          );
        })}
      </div>
      <div style={{display:"flex", gap: 14, marginTop: 8, flexWrap:"wrap", fontSize: 11}}>
        {segments.map((seg, i) => (
          <div key={i} style={{display:"inline-flex", alignItems:"center", gap: 5, color:"var(--ink-3)"}}>
            <span style={{width: 10, height: 10, borderRadius: 2, background: seg.color}}/>
            <span>{seg.label}</span>
            <span style={{fontFamily:"var(--font-mono)", color:"var(--ink-4)", fontVariantNumeric:"tabular-nums"}}>
              {fmt.int(data[seg.key] || 0)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// New analytics primitives — RodbotAnnotation, ControlStrip, FilterChip,
// TieredVenueGrid, ChartSurface, PerSourceSparklineRow, RodbotGlyph (local).
// All wired through window for the analytics.jsx screen to pick up.
// ══════════════════════════════════════════════════════════════════════════

/* Small <RodbotMark /> glyph local to charts — mirrors the one in screens.jsx.
   12px three-node triangle, currentColor, default 60% opacity. If the global
   RodbotMark is available we defer to it. */
function RodbotGlyph({ size = 12, opacity = 0.6, style }) {
  if (typeof window !== "undefined" && window.RodbotMark) {
    return <window.RodbotMark size={size} style={{opacity, ...(style||{})}}/>;
  }
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" style={{display:"inline-block", verticalAlign:"baseline", opacity, ...(style||{})}}>
      <line x1="3" y1="4" x2="9" y2="4" stroke="currentColor" strokeWidth="1"/>
      <line x1="3" y1="4" x2="6" y2="9" stroke="currentColor" strokeWidth="1"/>
      <line x1="9" y1="4" x2="6" y2="9" stroke="currentColor" strokeWidth="1"/>
      <circle cx="3" cy="4" r="1.4" fill="currentColor"/>
      <circle cx="9" cy="4" r="1.4" fill="currentColor"/>
      <circle cx="6" cy="9" r="1.4" fill="currentColor"/>
    </svg>
  );
}

/* RodbotAnnotation — operator-voice note column beside a chart.
   notes: [{ text: string, ts?: string }] — ts defaults to today. */
function RodbotAnnotation({ notes, ts }) {
  if (!notes || notes.length === 0) return null;
  const defaultTs = ts || new Date().toISOString().slice(0, 16).replace("T", " ");
  return (
    <div className="rodbot-annot">
      {notes.map((n, i) => {
        const t = typeof n === "string" ? n : n.text;
        const stamp = (typeof n === "object" && n.ts) || defaultTs;
        return (
          <div key={i} className="note" onClick={() => console.log("[annotation click]", t)}>
            <span className="mark"><RodbotGlyph size={11}/></span>
            <span>{t}</span>
            <span className="ts">{stamp}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ControlStrip — horizontal pill bar above a chart.
   groups: [{ label, key, options: [{value, label, disabled, tooltip}], value, onChange }] */
function ControlStrip({ groups }) {
  if (!groups || groups.length === 0) return null;
  return (
    <div className="control-strip">
      {groups.map((g, gi) => (
        <div key={gi} className="group">
          {g.label && <span className="group-label">{g.label}</span>}
          {g.options.map((o, oi) => {
            const active = g.value === o.value;
            const cls = "control-pill" + (active ? " active" : "") + (o.disabled ? " disabled" : "");
            return (
              <button key={oi} className={cls}
                title={o.tooltip || ""}
                disabled={!!o.disabled}
                onClick={() => !o.disabled && g.onChange && g.onChange(o.value)}>
                {o.label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* FilterChip — dismissible chip shown when a cross-filter is active on a tab. */
function FilterChip({ label, value, onClear }) {
  return (
    <div className="filter-chip">
      <span className="label-key">{label}</span>
      <span>{value}</span>
      <button type="button" onClick={onClear} aria-label="clear filter">×</button>
    </div>
  );
}

/* ChartSurface — the canonical wrapper. Pass annotation={notes} to get the
   right-side track; otherwise renders full-width. */
function ChartSurface({ title, controls, annotation, children }) {
  const hasAnnot = annotation && annotation.length > 0;
  return (
    <div className={"chart-surface" + (hasAnnot ? " with-annot" : "")}>
      <div>
        {title && <div className="chart-title">{title}</div>}
        {controls && <ControlStrip groups={controls}/>}
        {children}
      </div>
      {hasAnnot && <RodbotAnnotation notes={annotation}/>}
    </div>
  );
}

/* PerSourceSparklineRow — for Lead Sources replacement chart.
   sources: [{ source, count, pct, trend: [n1..n6] }] */
function PerSourceSparklineRow({ sources, onSelect, selectedLabel, accent }) {
  const color = accent || "var(--chart-ink)";
  return (
    <div>
      {sources.map((s, i) => (
        <div key={i}
          className={"spark-row" + (selectedLabel === s.source ? " selected" : "")}
          onClick={() => onSelect && onSelect(s, i)}>
          <div className="label">{s.source || "—"}</div>
          <div><Sparkline data={s.trend || []} color={color} width={180} height={28}/></div>
          <div className="pct">{s.pct != null ? s.pct.toFixed(1) + "%" : "—"}</div>
          <div className="count">{fmt.int(s.count)}</div>
        </div>
      ))}
    </div>
  );
}

/* TieredVenueGrid — Venue Partners replacement for the 20-brown-bars chart.
   venues: [{ name, events_completed, last_event_date, status }]
   Tiering: events >= 2 → t1; events === 1 & days <= 365 → t2; else → t3. */
function TieredVenueGrid({ venues, onSelect, selectedLabel }) {
  const now = Date.now();
  const days = (d) => {
    if (!d) return Infinity;
    const t = new Date(d).getTime();
    if (Number.isNaN(t)) return Infinity;
    return Math.max(0, Math.round((now - t) / (1000*60*60*24)));
  };
  const t1 = [], t2 = [], t3 = [];
  venues.forEach(v => {
    const e = v.events_completed || 0;
    const dd = days(v.last_event_date);
    if (e >= 2) t1.push({ ...v, _days: dd });
    else if (e === 1 && dd <= 365) t2.push({ ...v, _days: dd });
    else t3.push({ ...v, _days: dd });
  });
  const sortFn = (a, b) => (b.events_completed||0) - (a.events_completed||0) || a._days - b._days;
  t1.sort(sortFn); t2.sort(sortFn); t3.sort(sortFn);

  const renderCard = (v, tier) => {
    const selected = selectedLabel === v.name;
    const cold = v._days > 90;
    return (
      <div key={v.name}
        className={`venue-card ${tier}`}
        onClick={() => onSelect && onSelect(v)}
        style={selected ? {boxShadow:"var(--shadow-card)", borderColor:"var(--event-generate)"} : undefined}>
        <div className="name">{v.name}</div>
        <div className="meta">
          <span className={`dot ${cold ? "cold" : "active"}`}/>
          <span>{v.events_completed || 0} event{v.events_completed === 1 ? "" : "s"}</span>
          {v.last_event_date && <span>· {v.last_event_date}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="tier-grid">
      {t1.length > 0 && (
        <div className="tier-section">
          <div className="tier-label">Tier 1 · repeat partners ({t1.length})</div>
          <div className="tier-1" style={{display:"grid", gap:10, gridTemplateColumns:"repeat(auto-fill, minmax(220px, 1fr))"}}>
            {t1.map(v => renderCard(v, "t1"))}
          </div>
        </div>
      )}
      {t2.length > 0 && (
        <div className="tier-section">
          <div className="tier-label">Tier 2 · one event, recent ({t2.length})</div>
          <div className="tier-2" style={{display:"grid", gap:8, gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))"}}>
            {t2.map(v => renderCard(v, "t2"))}
          </div>
        </div>
      )}
      {t3.length > 0 && (
        <div className="tier-section">
          <div className="tier-label">Tier 3 · one-offs / long tail ({t3.length})</div>
          <div className="tier-3" style={{display:"grid", gap:6, gridTemplateColumns:"repeat(auto-fill, minmax(120px, 1fr))"}}>
            {t3.map(v => renderCard(v, "t3"))}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  KPICard, BarChartH, BarChartV, LineChart, DonutChart, StackedBarH, Sparkline,
  RodbotAnnotation, ControlStrip, FilterChip, ChartSurface,
  PerSourceSparklineRow, TieredVenueGrid, RodbotGlyph,
});

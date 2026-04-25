/* Comeketo Agent — Chart Export Pipeline
 * ─────────────────────────────────────────
 * One module that turns any saved chart (SVG-based or DOM-based) into
 * a real deliverable: PNG, SVG, CSV, clipboard. Everything goes through
 * window.ChartExport so callers don't have to know which strategy fits.
 *
 * Strategy:
 *   - Pure-SVG charts (bars, donut, line, area, lollipop, radial,
 *     treemap, stacked, pie) → serializeSVG → blob.
 *   - DOM-mixed charts (KPI strip, tiers grid) → if html2canvas is loaded,
 *     rasterize the wrapper element. Otherwise fall back to capturing the
 *     parent's innerHTML wrapped in <foreignObject> inside a synthetic SVG.
 *   - PNG: rasterize SVG to canvas at 2x DPR for retina-quality output.
 *   - Clipboard: navigator.clipboard.write([new ClipboardItem({...})]).
 *   - CSV: hand-rolled, RFC-4180 quoting.
 */

(function () {
  'use strict';

  // ─── Utilities ───────────────────────────────────────────────────────────

  function _slug(s) {
    return String(s || 'chart').toLowerCase().trim()
      .replace(/[^a-z0-9_\-]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'chart';
  }

  function _filename(name, ext) {
    const ts = new Date().toISOString().slice(0, 10);
    return `${_slug(name)}_${ts}.${ext}`;
  }

  function _downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  // Resolve a CSS variable on an element to its real color.
  // Necessary because <svg> exported standalone won't have access to the
  // app's :root vars unless we inline them.
  function _resolveCssVar(value, contextEl) {
    if (typeof value !== 'string' || !value.includes('var(')) return value;
    const m = value.match(/var\((--[^,)\s]+)/);
    if (!m) return value;
    const cs = getComputedStyle(contextEl || document.documentElement);
    const resolved = cs.getPropertyValue(m[1]).trim();
    return resolved || value;
  }

  // Inline computed styles into an SVG so it renders correctly when opened
  // standalone (no app stylesheet).
  function _inlineStyles(svgEl) {
    if (!svgEl) return;
    const props = [
      'fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-linecap',
      'stroke-linejoin', 'opacity', 'font-family', 'font-size', 'font-weight',
      'text-anchor', 'fill-opacity', 'stroke-opacity',
    ];
    const all = [svgEl, ...svgEl.querySelectorAll('*')];
    for (const node of all) {
      const cs = getComputedStyle(node);
      const declared = [];
      for (const p of props) {
        const v = cs.getPropertyValue(p);
        if (v && v !== 'normal' && v !== 'auto' && v !== '') {
          declared.push(`${p}:${v}`);
        }
      }
      if (declared.length) {
        const existing = node.getAttribute('style') || '';
        node.setAttribute('style', existing ? existing + ';' + declared.join(';') : declared.join(';'));
      }
    }
  }

  // ─── SVG serialization ───────────────────────────────────────────────────

  function serializeSVG(svgEl, opts) {
    if (!svgEl || !(svgEl instanceof SVGElement)) {
      throw new Error('serializeSVG: not an SVG element');
    }
    const opt = opts || {};
    const clone = svgEl.cloneNode(true);

    // Make sure the clone has explicit width/height for standalone rendering.
    const bbox = svgEl.getBoundingClientRect();
    let width = clone.getAttribute('width') || Math.round(bbox.width) || 800;
    let height = clone.getAttribute('height') || Math.round(bbox.height) || 400;
    if (typeof width === 'string' && width.endsWith('px')) width = parseFloat(width);
    if (typeof height === 'string' && height.endsWith('px')) height = parseFloat(height);
    clone.setAttribute('width', width);
    clone.setAttribute('height', height);
    if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    if (!clone.getAttribute('xmlns:xlink')) clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

    // Inline styles so the SVG renders standalone with the app's typography
    // and palette frozen in.
    if (opt.inlineStyles !== false) _inlineStyles(clone);

    // Add a title element for accessibility / file managers.
    if (opt.title) {
      const t = document.createElementNS('http://www.w3.org/2000/svg', 'title');
      t.textContent = opt.title;
      clone.insertBefore(t, clone.firstChild);
    }

    // Add a paper-cream background rect so the chart isn't transparent
    // when dropped on dark surfaces.
    if (opt.bg !== false) {
      const ns = 'http://www.w3.org/2000/svg';
      const rect = document.createElementNS(ns, 'rect');
      rect.setAttribute('x', 0);
      rect.setAttribute('y', 0);
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', _resolveCssVar('var(--paper-card-2)', svgEl) || '#FBFAF5');
      clone.insertBefore(rect, clone.firstChild);
    }

    const serializer = new XMLSerializer();
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(clone);
  }

  // ─── Find the right SVG inside an arbitrary chart wrapper ────────────────
  // LiveChart sometimes returns a div wrapper (KPI strip, tiers) and sometimes
  // a single <svg>. We pick the largest-area SVG inside the element.

  function _findChartTarget(wrapperEl) {
    if (!wrapperEl) return { kind: 'none', el: null };
    if (wrapperEl instanceof SVGElement) return { kind: 'svg', el: wrapperEl };
    const svgs = wrapperEl.querySelectorAll('svg');
    if (svgs.length === 1) return { kind: 'svg', el: svgs[0] };
    if (svgs.length > 1) {
      // Pick the largest SVG by rendered area (avoids tiny inline icons).
      let best = svgs[0], bestArea = 0;
      for (const s of svgs) {
        const r = s.getBoundingClientRect();
        const a = r.width * r.height;
        if (a > bestArea) { best = s; bestArea = a; }
      }
      return { kind: 'svg', el: best };
    }
    return { kind: 'dom', el: wrapperEl };
  }

  // ─── PNG rasterization (SVG → canvas → blob) ─────────────────────────────

  async function svgToPNGBlob(svgEl, opts) {
    const opt = opts || {};
    const scale = opt.scale || 2;
    const xml = serializeSVG(svgEl, opt);
    const bbox = svgEl.getBoundingClientRect();
    const w = Math.max(1, Math.round(bbox.width));
    const h = Math.max(1, Math.round(bbox.height));

    // Encode without btoa to handle UTF-8 cleanly.
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    try {
      const img = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = (e) => rej(new Error('SVG image load failed: ' + (e.message || e.type)));
        i.src = url;
      });

      const canvas = document.createElement('canvas');
      canvas.width = w * scale;
      canvas.height = h * scale;
      const ctx = canvas.getContext('2d');
      ctx.scale(scale, scale);
      // Cream backdrop matches in-app appearance.
      ctx.fillStyle = _resolveCssVar('var(--paper-card-2)', svgEl) || '#FBFAF5';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      return await new Promise((res) => canvas.toBlob(b => res(b), 'image/png', 0.95));
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  // For DOM-based charts (KPI strip, tiers grid, treemap with text labels),
  // we need html2canvas to faithfully rasterize. If it's not loaded, we fall
  // back to a foreignObject-wrapped SVG which is less faithful but always works.
  async function domToPNGBlob(domEl, opts) {
    const opt = opts || {};
    const scale = opt.scale || 2;

    if (typeof window.html2canvas === 'function') {
      const canvas = await window.html2canvas(domEl, {
        backgroundColor: _resolveCssVar('var(--paper-card-2)', domEl) || '#FBFAF5',
        scale,
        logging: false,
        useCORS: true,
      });
      return await new Promise((res) => canvas.toBlob(b => res(b), 'image/png', 0.95));
    }

    // Fallback: wrap the DOM in <foreignObject>. This works for
    // pure-text/CSS layouts but won't capture transforms perfectly.
    const bbox = domEl.getBoundingClientRect();
    const w = Math.max(1, Math.round(bbox.width));
    const h = Math.max(1, Math.round(bbox.height));
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('xmlns', ns);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const fo = document.createElementNS(ns, 'foreignObject');
    fo.setAttribute('x', 0); fo.setAttribute('y', 0);
    fo.setAttribute('width', w); fo.setAttribute('height', h);
    const wrap = document.createElement('div');
    wrap.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    wrap.style.width = w + 'px';
    wrap.style.height = h + 'px';
    wrap.style.background = _resolveCssVar('var(--paper-card-2)', domEl) || '#FBFAF5';
    wrap.appendChild(domEl.cloneNode(true));
    fo.appendChild(wrap);
    svg.appendChild(fo);
    return await svgToPNGBlob(svg, { scale });
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  async function downloadPNG(name, wrapperEl, opts) {
    const t = _findChartTarget(wrapperEl);
    if (!t.el) throw new Error('downloadPNG: no chart found');
    const blob = t.kind === 'svg'
      ? await svgToPNGBlob(t.el, opts)
      : await domToPNGBlob(t.el, opts);
    _downloadBlob(blob, _filename(name, 'png'));
    return { ok: true, kind: t.kind, bytes: blob.size };
  }

  async function copyPNG(wrapperEl, opts) {
    const t = _findChartTarget(wrapperEl);
    if (!t.el) throw new Error('copyPNG: no chart found');
    const blob = t.kind === 'svg'
      ? await svgToPNGBlob(t.el, opts)
      : await domToPNGBlob(t.el, opts);
    if (!navigator.clipboard || !window.ClipboardItem) {
      throw new Error('Clipboard API not available — try Download instead');
    }
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    return { ok: true, bytes: blob.size };
  }

  function downloadSVG(name, wrapperEl, opts) {
    const t = _findChartTarget(wrapperEl);
    if (t.kind !== 'svg') {
      throw new Error('downloadSVG: only available for vector chart kinds');
    }
    const xml = serializeSVG(t.el, Object.assign({ title: name }, opts || {}));
    const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    _downloadBlob(blob, _filename(name, 'svg'));
    return { ok: true, bytes: blob.size };
  }

  // ─── CSV helpers ─────────────────────────────────────────────────────────

  function _csvCell(v) {
    if (v == null) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }

  function downloadCSV(name, slices) {
    if (!Array.isArray(slices)) throw new Error('downloadCSV: slices must be an array');
    const lines = ['label,value'];
    for (const s of slices) {
      lines.push(_csvCell(s.label) + ',' + _csvCell(s.value));
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    _downloadBlob(blob, _filename(name, 'csv'));
    return { ok: true, rows: slices.length };
  }

  function downloadTableCSV(name, schema, rows) {
    if (!Array.isArray(schema) || !Array.isArray(rows)) {
      throw new Error('downloadTableCSV: schema and rows are required arrays');
    }
    const keys = schema.map(f => f.key);
    const header = schema.map(f => _csvCell(f.label || f.key)).join(',');
    const body = rows.map(r => keys.map(k => _csvCell(r[k])).join(',')).join('\n');
    const csv = header + (body ? '\n' + body : '') + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    _downloadBlob(blob, _filename(name, 'csv'));
    return { ok: true, rows: rows.length, cols: schema.length };
  }

  // ─── Expose ──────────────────────────────────────────────────────────────

  window.ChartExport = {
    serializeSVG,
    svgToPNGBlob,
    domToPNGBlob,
    downloadPNG,
    copyPNG,
    downloadSVG,
    downloadCSV,
    downloadTableCSV,
    // expose internals for power use / future extension
    _findChartTarget,
    _resolveCssVar,
    _inlineStyles,
  };
})();

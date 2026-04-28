/* Icon set — small inline SVGs.
   Hairline stroke icons, ink color by default, follow currentColor.
   Usage: <span class="i" data-icon="check"></span> with this script,
   OR call: window.icon('check', { size: 16 })
*/
(function () {
  const I = {
    check:    '<path d="M4 12.5l5 5L20 6.5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    x:        '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    plus:     '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    minus:    '<path d="M5 12h14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    arrow:    '<path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    arrowL:   '<path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    chev:     '<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    chevD:    '<path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    eye:      '<path d="M2 12c2.5-4 5.5-6 10-6s7.5 2 10 6c-2.5 4-5.5 6-10 6S4.5 16 2 12z" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" fill="none" stroke-width="1.5"/>',
    sparkles: '<path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3zM5 16l.7 2L8 18.7 5.7 19.4 5 21l-.7-1.6L2 18.7l2.3-.7L5 16zM18 14l.6 1.7L20 16l-1.4.4L18 18l-.6-1.6L16 16l1.4-.3L18 14z" fill="currentColor"/>',
    bolt:     '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/>',
    info:     '<circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    warn:     '<path d="M12 3l10 18H2L12 3z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/><path d="M12 10v5M12 17.5v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    block:    '<circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M5.5 5.5l13 13" stroke="currentColor" stroke-width="1.5"/>',
    clock:    '<circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    dot:      '<circle cx="12" cy="12" r="4" fill="currentColor"/>',
    branch:   '<circle cx="6" cy="5" r="2" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="6" cy="19" r="2" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="18" cy="12" r="2" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M6 7v10M16 12c-4 0-4-5-8-5" stroke="currentColor" fill="none" stroke-width="1.5"/>',
    table:    '<rect x="3" y="5" width="18" height="14" rx="1.5" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M3 10h18M3 14.5h18M9 5v14M15 5v14" stroke="currentColor" stroke-width="1.5"/>',
    inbox:    '<path d="M3 13l2-8h14l2 8v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5z" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M3 13h5l1 2h6l1-2h5" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/>',
    chart:    '<path d="M4 20V8M10 20V4M16 20v-8M22 20H2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    flow:     '<rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" fill="none" stroke-width="1.5"/><rect x="15" y="15" width="6" height="6" rx="1" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="12" cy="12" r="2.5" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M9 6h2a2 2 0 012 2v2M15 18h-2a2 2 0 01-2-2v-2" stroke="currentColor" stroke-width="1.5" fill="none"/>',
    work:     '<rect x="3" y="6" width="18" height="14" rx="1.5" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M9 6V4h6v2" stroke="currentColor" stroke-width="1.5" fill="none"/>',
    people:   '<circle cx="9" cy="9" r="3" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="17" cy="8" r="2.5" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M15.5 14h.5c2.5 0 5 1.7 5 5" stroke="currentColor" stroke-width="1.5" fill="none"/>',
    mind:     '<path d="M12 3a4 4 0 00-4 4 3 3 0 00-3 3v3a3 3 0 003 3v3l3-2 1 2h2l1-2 3 2v-3a3 3 0 003-3v-3a3 3 0 00-3-3 4 4 0 00-4-4z" stroke="currentColor" fill="none" stroke-width="1.5"/>',
    cal:      '<rect x="3" y="5" width="18" height="16" rx="1.5" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    settings: '<circle cx="12" cy="12" r="3" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" fill="none" stroke-width="1.5"/>',
    text:     '<path d="M5 6h14M5 12h14M5 18h9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    sun:      '<circle cx="12" cy="12" r="4" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    moon:     '<path d="M21 13A9 9 0 1111 3a7 7 0 0010 10z" stroke="currentColor" fill="none" stroke-width="1.5"/>',
    play:     '<path d="M7 5l11 7-11 7V5z" fill="currentColor"/>',
    pause:    '<rect x="6" y="5" width="4" height="14" fill="currentColor"/><rect x="14" y="5" width="4" height="14" fill="currentColor"/>',
    refresh:  '<path d="M21 12a9 9 0 11-3-6.7M21 4v5h-5" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    tool:     '<path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.5 2.5-2.8-.7-.7-2.8 2.5-2.5z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/>',
    cube:     '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/><path d="M4 7.5L12 12l8-4.5M12 12v9" stroke="currentColor" fill="none" stroke-width="1.5"/>',
    book:     '<path d="M4 4h7a3 3 0 013 3v13a2 2 0 00-2-2H4V4zM20 4h-7a3 3 0 00-3 3v13a2 2 0 012-2h8V4z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/>',
    diff:     '<path d="M12 3v18M5 8l7 4 7-4M5 16l7-4 7 4" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/>',
    write:    '<path d="M3 17.5V21h3.5L18 9.5 14.5 6 3 17.5z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/><path d="M14.5 6L17 3.5 20.5 7 18 9.5" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/>',
    server:   '<rect x="3" y="4" width="18" height="7" rx="1" stroke="currentColor" fill="none" stroke-width="1.5"/><rect x="3" y="13" width="18" height="7" rx="1" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="7" cy="7.5" r="1" fill="currentColor"/><circle cx="7" cy="16.5" r="1" fill="currentColor"/>',
    hash:     '<path d="M5 9h14M5 15h14M10 4l-2 16M16 4l-2 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    link:     '<path d="M9 15l6-6M11 5l1.5-1.5a4 4 0 015.5 5.5L16.5 10.5M13 19l-1.5 1.5a4 4 0 01-5.5-5.5L7.5 13.5" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"/>',
    lock:     '<rect x="5" y="11" width="14" height="10" rx="1.5" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M8 11V7a4 4 0 018 0v4" stroke="currentColor" fill="none" stroke-width="1.5"/>',
    fire:     '<path d="M12 3c2 4 5 5 5 9a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-8z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/>',
    layers:   '<path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/>',
    twitter:  '<path d="M22 5.8c-.7.4-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.2-.8.5-1.7.8-2.6 1A4 4 0 0012 9c0 .3 0 .6.1.9-3.3-.2-6.3-1.7-8.3-4.2a4 4 0 001.2 5.4c-.6 0-1.2-.2-1.7-.4 0 2 1.4 3.6 3.3 4-.5.1-1 .2-1.6.1.5 1.5 1.9 2.7 3.6 2.7A8 8 0 012 19a11.3 11.3 0 0017.4-9.5v-.5c.8-.6 1.5-1.3 2-2.2z" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linejoin="round"/>',
    search:   '<circle cx="11" cy="11" r="6.5" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M16 16l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
    wave:     '<path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0" stroke="currentColor" fill="none" stroke-width="1.5" stroke-linecap="round"/>',
    cluster:  '<circle cx="6" cy="6" r="2.5" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="18" cy="7" r="2" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="7" cy="18" r="2" stroke="currentColor" fill="none" stroke-width="1.5"/><circle cx="17" cy="17" r="2.5" stroke="currentColor" fill="none" stroke-width="1.5"/><path d="M8 7l8 1M8 8l8 8M9 18l6-1" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/>'
  };

  function svg(name, opts) {
    opts = opts || {};
    const size = opts.size || 16;
    const path = I[name];
    if (!path) return '';
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
  }

  window.icon = svg;

  function hydrate() {
    document.querySelectorAll('[data-icon]').forEach(el => {
      if (el.__hydrated) return;
      const name = el.getAttribute('data-icon');
      const size = parseInt(el.getAttribute('data-size') || '16', 10);
      el.innerHTML = svg(name, { size });
      el.__hydrated = true;
    });
  }
  window.hydrateIcons = hydrate;
  document.addEventListener('DOMContentLoaded', hydrate);
})();

/* Comeketo Agent — Activity Ledger.

   Streams every meaningful event to disk, append-only:
     CCAgentindex/_ledger/activity.jsonl

   Goal: temporal continuity. localStorage can be cleared; the ledger can't
   be lost accidentally because it's a file on the team's disk, git-trackable.

   Event shapes are intentionally loose — the minimum is { kind }, and the
   server stamps `t`. Callers add whatever context helps future-the team or
   future-Claude reconstruct what happened.

   Fire-and-forget: failures are swallowed with console.warn so UI isn't
   blocked by a network hiccup. Retry is not worth the complexity here —
   the localStorage-backed SecretaryMemory still captures the same event,
   so worst case we lose one disk-side record and keep the browser-side one.
*/
window.SecretaryLedger = (() => {
  const QUEUE = [];
  let flushing = false;

  async function flush() {
    if (flushing) return;
    flushing = true;
    while (QUEUE.length) {
      const ev = QUEUE.shift();
      try {
        await fetch("/api/ledger/activity/append", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ev),
          keepalive: true,
        });
      } catch (e) {
        // best-effort; don't re-queue forever
        console.warn("[ledger] drop:", e.message, ev.kind);
      }
    }
    flushing = false;
  }

  function log(kind, detail) {
    if (!kind) return;
    QUEUE.push({ kind, ...(detail || {}) });
    // Debounce flushes slightly to coalesce quick bursts of events.
    clearTimeout(log._t);
    log._t = setTimeout(flush, 120);
  }

  async function read() {
    try {
      const res = await fetch("/api/ledger/activity", { cache: "no-cache" });
      if (!res.ok) return [];
      const data = await res.json();
      return data.events || [];
    } catch { return []; }
  }

  // Flush remaining events before unload so nothing gets stranded.
  window.addEventListener("beforeunload", () => {
    if (!QUEUE.length) return;
    // synchronous-ish: fire each remaining event with keepalive: true
    for (const ev of QUEUE) {
      try {
        navigator.sendBeacon && navigator.sendBeacon(
          "/api/ledger/activity/append",
          new Blob([JSON.stringify(ev)], { type: "application/json" })
        );
      } catch {}
    }
  });

  return { log, read, flush };
})();

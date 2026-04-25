/* Comeketo Agent — Inbox layer.

   The frontend place where the team drops context in real-time — todos, notes,
   feedback, corrections. Everything lands in:

     CCAgentindex/_inbox/inbox.jsonl   (append-only log)

   The backend agent (me, when invoked via Claude Code) sweeps this file
   periodically and folds entries into the canonical bedrock, preserving
   full provenance.

   Entry shape:
     {
       id:       "ibx_<hex>",
       t:        ISO8601,
       kind:     "todo" | "note" | "feedback" | "correction" | "connector" | "context",
       text:     string,
       source:   { screen?, gridId?, cellId?, commitmentId? },   // what the team was looking at when he added it
       related_to: { projectId?, personId?, threadId? },         // optional bedrock pointers
       status:   "open" | "swept" | "dismissed",
       swept_at: ISO8601 | null,
       swept_into: string[],                                     // file paths that received this info
       swept_note: string                                        // human-readable summary of what the sweep did
     }
*/
window.SecretaryInbox = (() => {
  const listeners = new Set();
  let cache = [];
  let loaded = false;

  function notify() {
    listeners.forEach(fn => { try { fn(cache); } catch {} });
  }

  async function reload() {
    try {
      const res = await fetch("/api/inbox", { cache: "no-cache" });
      if (!res.ok) return cache;
      const data = await res.json();
      cache = Array.isArray(data.entries) ? data.entries : [];
      loaded = true;
      notify();
      return cache;
    } catch { return cache; }
  }
  reload();

  function entries() { return cache.slice(); }
  function openEntries() { return cache.filter(e => e.status === "open"); }
  function byKind(kind) { return cache.filter(e => e.kind === kind); }
  function openCount() { return cache.filter(e => e.status === "open").length; }

  async function append(partial) {
    const res = await fetch("/api/inbox/append", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`inbox append ${res.status}: ${t}`);
    }
    const { entry } = await res.json();
    cache = [...cache, entry];
    notify();
    // Mirror to the activity ledger so the temporal stream includes inbox writes.
    if (window.SecretaryLedger) {
      window.SecretaryLedger.log("inbox_append", { id: entry.id, kind: entry.kind, text: entry.text });
    }
    return entry;
  }

  async function update(id, patch) {
    const res = await fetch("/api/inbox/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`inbox update ${res.status}: ${t}`);
    }
    const { entry } = await res.json();
    cache = cache.map(e => e.id === id ? entry : e);
    notify();
    return entry;
  }

  async function dismiss(id) {
    return update(id, { status: "dismissed" });
  }

  // ─── Connector-setup seeding ─────────────────────────────────────────
  // On load, check which connectors are not-ready and seed a todo for each
  // that isn't already in the inbox. Idempotent — looks for existing todos
  // with matching `meta.connector_setup_for` and skips.
  async function seedConnectorTodos() {
    const C = window.SecretaryConnectors;
    if (!C) return;
    // Make sure we have fresh connector status AND fresh inbox cache.
    await C.refreshStatus();
    if (!loaded) await reload();

    const existing = new Set(
      cache
        .filter(e => e.kind === "connector" && e.meta && e.meta.connector_setup_for)
        .map(e => e.meta.connector_setup_for)
    );

    const seeds = [];
    for (const ch of C.CHANNELS) {
      const r = C.readiness(ch.id);
      if (r === "ready" || r === "always-ready") continue;
      if (existing.has(ch.id)) continue;
      seeds.push({
        kind: "connector",
        status: "open",
        text: `Configure ${ch.label} — ${C.helpFor(ch.id)}`,
        meta: { connector_setup_for: ch.id, readiness: r, blurb: ch.blurb },
        source: { screen: "connector-seed" },
      });
    }
    for (const s of seeds) {
      // eslint-disable-next-line no-await-in-loop
      try { await append(s); } catch (e) { console.warn("seed todo failed", e); }
    }
    return seeds.length;
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return {
    reload, entries, openEntries, byKind, openCount,
    append, update, dismiss,
    seedConnectorTodos, subscribe,
  };
})();

// Kick off connector seeding once everything's likely loaded.
// Short delay gives SecretaryConnectors time to fetch /api/status.
setTimeout(() => {
  if (window.SecretaryInbox && window.SecretaryInbox.seedConnectorTodos) {
    window.SecretaryInbox.seedConnectorTodos();
  }
}, 1500);

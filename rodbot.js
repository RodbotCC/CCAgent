/* Comeketo Agent — Rodbot: the reflective intelligence layer.

   Rodbot watches SecretaryLedger events. When meaningful things happen,
   she batches them (debounced), builds a reflection prompt, and calls
   SecretaryAI.respond() — the SAME AI layer chat, grid generation, and
   commitment drafting use. Whatever provider and model the team has selected
   in Settings → Intelligence is what reflects. No separate API path.

   The server endpoint /api/rodbot/reflect is pure persistence: receives
   the parsed reflection, writes reflections.jsonl (always), memory.jsonl
   (if importance >= threshold and not abstained), and drops an inbox
   entry (if actionable + important).

   Design notes:
     - Client-side scheduling and LLM call. One AI layer across the app.
     - Debounced: events that arrive in quick bursts collapse into one
       reflection call. Avoids burning tokens on every gesture.
     - Filtered: noise-tier events (gesture, smoke_test, connector) never
       fire a reflection. They're still in the ledger if Rodbot wants them
       in context later.
     - Model: defaults to the same gpt-5.4-mini the rest of the app uses.
       Override via Rodbot.setModel() / localStorage 'secretary.rodbot.model'.
     - Fire-and-forget: the UI never waits on Rodbot. If the AI is slow or
       unavailable, Comeketo Agent still works — Rodbot just has less memory.
*/
window.Rodbot = (() => {
  const STORAGE_KEY_LAST_T = "secretary.rodbot.last_event_t";
  const STORAGE_KEY_MODEL  = "secretary.rodbot.model";
  const STORAGE_KEY_ENABLED = "secretary.rodbot.enabled";

  // Events Rodbot looks at. Anything not in this set she ignores.
  const REFLECTIVE_KINDS = new Set([
    "commitment_created",
    "commitment_sent",
    "commitment_canceled",
    "delegation_dispatched",
    "delegation_completed",
    "chat_turn",
    "grid_version_pushed",
    "frame_reject",
    "inbox-append",
    "inbox_append",
  ]);

  // Min importance threshold for a reflection to become a memory.
  const MEMORY_THRESHOLD = 0.5;

  // Debounce window — ms to wait for more events before firing reflection.
  const DEBOUNCE_MS = 2500;

  // Max events per reflection batch (keeps prompt length sane).
  const BATCH_MAX = 12;

  const pending = [];     // events awaiting reflection
  let timer = null;
  let reflectionCount = 0;
  let memoryCount = 0;
  const subs = new Set();

  function enabled() {
    const v = localStorage.getItem(STORAGE_KEY_ENABLED);
    return v == null ? true : v === "1" || v === "true";
  }
  function setEnabled(b) {
    localStorage.setItem(STORAGE_KEY_ENABLED, b ? "1" : "0");
    notify();
  }
  function model() {
    return localStorage.getItem(STORAGE_KEY_MODEL) || "gpt-5.4-mini";
  }
  function setModel(m) {
    localStorage.setItem(STORAGE_KEY_MODEL, String(m || "").trim() || "gpt-5.4-mini");
    notify();
  }

  function subscribe(fn) {
    subs.add(fn);
    try { fn(snapshot()); } catch {}
    return () => subs.delete(fn);
  }
  function snapshot() {
    return {
      enabled: enabled(),
      model: model(),
      pending: pending.length,
      reflection_count: reflectionCount,
      memory_count: memoryCount,
    };
  }
  function notify() {
    const s = snapshot();
    for (const fn of subs) { try { fn(s); } catch {} }
  }

  function shouldReflectOn(ev) {
    if (!ev || !ev.kind) return false;
    return REFLECTIVE_KINDS.has(ev.kind);
  }

  function enqueue(ev) {
    if (!enabled() || !shouldReflectOn(ev)) return;
    pending.push({ ...ev, _enqueued: new Date().toISOString() });
    notify();
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, DEBOUNCE_MS);
  }

  // Extract JSON from an LLM reply — may be fenced or wrapped in prose.
  function extractJSON(s) {
    s = (s || "").trim();
    if (!s) return null;
    if (s.startsWith("```")) {
      s = s.replace(/^```[a-zA-Z0-9]*\s*/, "").replace(/\s*```\s*$/, "");
    }
    try { return JSON.parse(s); } catch {}
    const m = s.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch {}
    }
    return null;
  }

  // Build the system prompt from Rodbot's identity + her recent memory.
  // Returns { instructions, input } ready to feed SecretaryAI.respond().
  async function buildReflectPrompt(events, contextStr) {
    let identity = "";
    try {
      const res = await fetch("/api/rodbot/identity", { cache: "no-cache" });
      if (res.ok) identity = (await res.json()).body || "";
    } catch {}

    // Affective essence — the tonal palette that keeps memory entries from
    // collapsing to sterile third-person summaries. Loaded every reflection so
    // Rodbot can draw a fitting register. She never quotes it — it's flavor.
    let paletteBlock = "";
    try {
      const res = await fetch("/api/rodbot/palette", { cache: "no-cache" });
      if (res.ok) paletteBlock = (await res.json()).body || "";
    } catch {}

    let priorMemBlock = "  (no memories yet — this is the start of Rodbot's log)";
    try {
      const res = await fetch("/api/rodbot/memory?limit=20", { cache: "no-cache" });
      if (res.ok) {
        const j = await res.json();
        if (j.memories && j.memories.length) {
          priorMemBlock = j.memories.map(m => {
            const imp = m.importance != null ? ` [imp ${m.importance.toFixed(2)}]` : "";
            return `  • ${m.summary || ""}${imp}`;
          }).join("\n");
        }
      }
    } catch {}

    const instructions = [
      "You are Rodbot — the reflective intelligence inside Comeketo Agent, the team's",
      "personal decision-aid. Your role and constraints are defined here:",
      "",
      identity,
      "",
      "You are being called to reflect on a batch of ledger events the team's app just",
      "produced. Your job is to decide whether anything in this batch is worth",
      "remembering, and if so, to write one compressed memory ENTRY IN YOUR VOICE.",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "THE CORE DISCIPLINE — read carefully, this is what's been wrong:",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "The inbox already carries a mechanical receipt of what happened. Your",
      "memory is NOT a second receipt. It is your TAKE. Your editorial. Your",
      "posture. First-person where natural. Judgment, irony, endearment, or",
      "exasperation allowed when the event earns it. Never summarize — react.",
      "",
      "WRONG (sterile, echoes the inbox):",
      '  "the team retired the email backlog cell."',
      "",
      "RIGHT (voiced, has posture):",
      '  "Email backlog cell retired — he actually finished the thing he said',
      '   he\'d never finish. Noted."',
      "",
      "WRONG (over-performed, quoting the palette):",
      '  "[Drapes self over furniture] I have been bored for eons..."',
      "",
      "RIGHT (register leaks, not quoted):",
      '  "Three empty-prompt deaths in a row. Something in the dispatch chain',
      '   is eating the prompt. Not random."',
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "AFFECTIVE PALETTE — for tonal register, NEVER to quote:",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      paletteBlock || "(palette not loaded — keep memories voiced but restrained)",
      "",
      "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
      "",
      "RECENT MEMORIES (what you already know — do not duplicate these):",
      priorMemBlock,
      "",
      "CURRENT CONTEXT (what was happening around these events):",
      contextStr || "(none provided)",
      "",
      "OUTPUT DISCIPLINE — return ONLY valid JSON matching this schema:",
      "",
      "{",
      '  "summary":       "1–2 sentences IN YOUR VOICE. Not a summary. Your take.",',
      '  "affect":        "short register name you drew from (e.g. \'lazy_apocalypse\', \'swamp_sage\', \'ancient_sigh\'), or \'neutral\' if nothing fit",',
      '  "tags":          ["short-slug", ...],',
      '  "actionable":    true|false,',
      '  "action_hint":   "if actionable, a one-line hint in your voice (else null)",',
      '  "related":       { "projects": ["id-or-name"], "people": ["id-or-name"], "threads": ["id-or-subject"] },',
      '  "importance":    0.0-to-1.0,',
      '  "source_kinds":  ["kind-from-events"],',
      '  "abstain":       false',
      "}",
      "",
      "If the events are noise (a single gesture, a cache write, something you've",
      "already remembered), set \"abstain\": true and leave the other fields as",
      "empty strings / empty arrays / 0.0. Abstention is honored — Θ is a valid",
      "output. Don't fabricate significance.",
      "",
      "Importance rubric:",
      "  1.0  — deep pattern across weeks, breakthrough, identity-level",
      "  0.7  — real commitment made or kept or broken",
      "  0.5  — meaningful single event (ship, refusal, frame-reject insight)",
      "  0.3  — context-worth-noting but low signal on its own",
      "  0.0  — noise",
      "",
      "BALANCE RULE — most memories are neutral-warm observations with your",
      "posture. About 1-in-4 let a distinct affective register color the line.",
      "Contrast is the point. If every memory tried to perform, the voice would",
      "become a shtick. If none did, it'd be sterile. Aim for the middle and",
      "let the event decide.",
    ].join("\n");

    const input = `EVENTS TO REFLECT ON:\n\n${JSON.stringify(events, null, 2)}\n\nReturn the JSON.`;
    return { instructions, input };
  }

  async function flush({ force } = {}) {
    if (timer) { clearTimeout(timer); timer = null; }
    if (!pending.length) return null;
    if (!enabled() && !force) return null;
    if (!window.SecretaryAI) { console.warn("[rodbot] SecretaryAI not loaded"); return null; }

    // Take up to BATCH_MAX events; anything beyond stays for next cycle.
    const batch = pending.splice(0, BATCH_MAX);
    notify();

    // Light context hint: time of day + active screen.
    const ctx = [];
    try {
      const d = new Date();
      ctx.push(`time: ${d.toLocaleString()} (${Intl.DateTimeFormat().resolvedOptions().timeZone})`);
    } catch {}
    if (window.SECRETARY_ROUTE) ctx.push(`active screen: ${window.SECRETARY_ROUTE}`);

    try {
      const { instructions, input } = await buildReflectPrompt(batch, ctx.join(" · "));

      // Call goes through the app's real AI layer — SecretaryAI.respond() —
      // so it uses whatever provider and model the user has configured in
      // Settings. For reflections we pin Rodbot's preferred model via
      // `extra.model`, which the OpenAI path respects. Claude Code ignores it.
      const res = await window.SecretaryAI.respond({
        input,
        instructions,
        model: model(),
      });
      const parsed = extractJSON(res && res.text);
      const sourceEventCount = batch.length;

      // Persist. Server writes reflections.jsonl (always), memory.jsonl
      // (if importance >= threshold + not abstained), and an inbox entry
      // (if actionable + important).
      const persistBody = parsed
        ? { parsed, source_event_count: sourceEventCount, model: model(), min_importance_to_remember: MEMORY_THRESHOLD }
        : { parsed: { parse_error: true, raw: (res && res.text) || "" }, source_event_count: sourceEventCount, model: model() };

      const pres = await fetch("/api/rodbot/reflect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(persistBody),
        keepalive: true,
      });
      const j = await pres.json().catch(() => ({}));
      if (j.ok) {
        reflectionCount++;
        if (j.wrote_memory) memoryCount++;
        notify();
        try { localStorage.setItem(STORAGE_KEY_LAST_T, new Date().toISOString()); } catch {}
      }
      return j;
    } catch (e) {
      console.warn("[rodbot] reflect error:", e.message);
      return null;
    }
  }

  async function memory({ limit = 50 } = {}) {
    try {
      const res = await fetch(`/api/rodbot/memory?limit=${limit}`);
      if (!res.ok) return [];
      const j = await res.json();
      return j.memories || [];
    } catch { return []; }
  }

  async function reflections({ limit = 100 } = {}) {
    try {
      const res = await fetch(`/api/rodbot/reflections?limit=${limit}`);
      if (!res.ok) return [];
      const j = await res.json();
      return j.reflections || [];
    } catch { return []; }
  }

  async function identity() {
    try {
      const res = await fetch("/api/rodbot/identity");
      if (!res.ok) return "";
      const j = await res.json();
      return j.body || "";
    } catch { return ""; }
  }

  async function character() {
    try {
      const res = await fetch("/api/rodbot/character");
      if (!res.ok) return "";
      const j = await res.json();
      return j.body || "";
    } catch { return ""; }
  }

  async function traits() {
    try {
      const res = await fetch("/api/rodbot/traits");
      if (!res.ok) return "";
      const j = await res.json();
      return j.body || "";
    } catch { return ""; }
  }

  // Read-only helper: get the N most recent memories as a compact
  // newline-separated string. Used by ai_instructions.js to fold Rodbot's
  // memory into every system prompt — so the main AI sees what she's seen.
  async function recentMemoryBlock({ limit = 15 } = {}) {
    const mems = await memory({ limit });
    if (!mems.length) return "";
    return mems.map(m => {
      const imp = m.importance != null ? ` [imp ${m.importance.toFixed(2)}]` : "";
      const tags = (m.tags || []).slice(0, 4).join(", ");
      return `  • ${m.summary}${tags ? ` (${tags})` : ""}${imp}`;
    }).join("\n");
  }

  // Monkey-patch the ledger's log() so every ledger write also notifies
  // Rodbot. Done defensively — if the ledger module isn't loaded yet we
  // retry on next tick.
  function wireLedger() {
    const L = window.SecretaryLedger;
    if (!L || !L.log) { setTimeout(wireLedger, 100); return; }
    if (L.__rodbot_wired) return;
    const orig = L.log.bind(L);
    L.log = function(kind, detail) {
      const r = orig(kind, detail);
      try { enqueue({ kind, ...(detail || {}), t: new Date().toISOString() }); } catch {}
      return r;
    };
    L.__rodbot_wired = true;
  }

  // Note: no beforeunload flush. The LLM call is async and can't complete
  // during unload, and sendBeacon can't do synchronous work. Events pending
  // at tab close are lost for reflection (the underlying ledger entries
  // still exist on disk). A proper "catch-up" pass that scans the ledger
  // for unreflected events since `last_event_t` belongs as a future addition.

  // Initialize counts from disk so UI shows correct totals on load.
  (async () => {
    try {
      const [m, r] = await Promise.all([
        fetch("/api/rodbot/memory?limit=10000").then(x => x.json()).catch(() => null),
        fetch("/api/rodbot/reflections?limit=10000").then(x => x.json()).catch(() => null),
      ]);
      if (m && typeof m.count === "number") memoryCount = m.count;
      if (r && typeof r.count === "number") reflectionCount = r.count;
      notify();
    } catch {}
  })();

  wireLedger();

  return {
    enqueue, flush,
    memory, reflections, identity, character, traits, recentMemoryBlock,
    subscribe, snapshot,
    enabled, setEnabled, model, setModel,
  };
})();

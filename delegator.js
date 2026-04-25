/* Comeketo Agent — Claude Code Delegation Layer.

   Comeketo Agent orchestrates; Claude Code executes. The frontend dispatches a
   prompt, the server spawns `claude -p` in a background thread, and the
   result lands in CCAgentindex/_ledger/delegations/<id>.json.

   Two modes:
     'safe'    — Claude Code prompts for tool use before executing (good for
                 pure-read prompts; anything write-y will hang waiting).
     'trusted' — Bypass permissions. Use when you're delegating real work.

   Pre-baked prompts for common tasks live in window.SecretaryDelegator.PROMPTS.
*/
window.SecretaryDelegator = (() => {
  const LIST_CACHE = { items: [], loaded: false };
  const listeners = new Set();
  const pollers = new Map(); // request_id → interval handle

  function notify() {
    listeners.forEach(fn => { try { fn(LIST_CACHE.items); } catch {} });
  }

  async function reload() {
    try {
      const res = await fetch("/api/delegate", { cache: "no-cache" });
      if (!res.ok) return LIST_CACHE.items;
      const data = await res.json();
      LIST_CACHE.items = Array.isArray(data.delegations) ? data.delegations : [];
      LIST_CACHE.loaded = true;
      notify();
      return LIST_CACHE.items;
    } catch { return LIST_CACHE.items; }
  }

  async function available() {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) return false;
      const d = await res.json();
      return !!d.claude_code_available;
    } catch { return false; }
  }

  function runningCount() {
    return LIST_CACHE.items.filter(i => i.status === "running").length;
  }

  async function dispatch({ prompt, mode = "safe", label, timeout, cwd }) {
    const res = await fetch("/api/delegate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, mode, label, timeout, cwd }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`dispatch ${res.status}: ${t}`);
    }
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || "dispatch failed");
    // Optimistic add.
    LIST_CACHE.items = [{
      request_id: data.request_id,
      status: "running",
      label: label || "(untitled)",
      prompt, mode,
      started_at: new Date().toISOString(),
    }, ...LIST_CACHE.items];
    notify();
    // Mirror to activity ledger.
    if (window.SecretaryLedger) {
      window.SecretaryLedger.log("delegation_dispatched", {
        request_id: data.request_id, label, mode,
      });
    }
    // Start polling for completion.
    startPoll(data.request_id);
    return data.request_id;
  }

  async function fetchOne(requestId) {
    try {
      const res = await fetch(`/api/delegate/${requestId}`, { cache: "no-cache" });
      if (!res.ok) return null;
      return await res.json();
    } catch { return null; }
  }

  function startPoll(requestId, { intervalMs = 2000, maxMs = 10 * 60 * 1000 } = {}) {
    if (pollers.has(requestId)) return;
    const deadline = Date.now() + maxMs;
    const handle = setInterval(async () => {
      if (Date.now() > deadline) { stopPoll(requestId); return; }
      const current = await fetchOne(requestId);
      if (!current) return;
      // merge into cache
      LIST_CACHE.items = LIST_CACHE.items.map(i =>
        i.request_id === requestId ? { ...i, ...current } : i
      );
      notify();
      if (current.status && current.status !== "running") {
        stopPoll(requestId);
        if (window.SecretaryLedger) {
          window.SecretaryLedger.log("delegation_completed", {
            request_id: requestId, status: current.status,
            exit_code: current.exit_code,
            summary: (current.summary || "").slice(0, 400),
          });
        }
      }
    }, intervalMs);
    pollers.set(requestId, handle);
  }
  function stopPoll(requestId) {
    const h = pollers.get(requestId);
    if (h) { clearInterval(h); pollers.delete(requestId); }
  }

  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  // ─── Pre-baked prompts ──────────────────────────────────────────────
  const PROMPTS = {
    sweep_inbox: () => ({
      label: "Sweep the inbox",
      mode: "trusted",
      timeout: 600,
      prompt: [
        "You are Claude Code operating inside the team's Comeketo Agent bedrock.",
        "Follow the sweep protocol documented at `/Users/jakeaaron/Downloads/CC Agent/AGENT.md`.",
        "",
        "Steps:",
        "1. Read the AGENT.md file in the project root for the sweep contract.",
        "2. Read `CCAgentindex/_inbox/inbox.jsonl` — process all entries with status == 'open'.",
        "3. Fold each open entry into the appropriate bedrock file under CCAgentindex/ with provenance (sources[] and history[] arrays).",
        "4. For person_upsert corrections, create or update CCAgentindex/people/*.json and register in indexes/index.json.",
        "5. After folding each entry, mark it in inbox.jsonl as status: 'swept' with swept_at, swept_into[], swept_note.",
        "6. Regenerate CCAgentindex/manifests/rebuild_manifest.json with fresh counts + notes.",
        "7. Finish with a concise summary: N entries swept, M files touched, any entries you couldn't classify cleanly.",
        "",
        "Discipline: scope_discipline wins. Only fold what genuinely fits. Leave ambiguous entries open with a clarifying note appended. Never delete entries — append status changes only.",
      ].join("\n"),
    }),

    escalate_commitment: (c) => ({
      label: `Escalate: ${c.subject}`,
      mode: "trusted",
      timeout: 300,
      prompt: [
        "the team's Comeketo Agent app tried to execute the commitment below and hit a blocker. Figure out what to do.",
        "",
        `SUBJECT: ${c.subject || "(untitled)"}`,
        `CHANNEL: ${c.channel || "unknown"}`,
        `TARGET:  ${c.target || "(none)"}`,
        `BODY:`,
        (c.body || "(no body)").trim(),
        "",
        `WHAT FAILED: ${c.result || "(no reason recorded)"}`,
        "",
        "Options you have:",
        "- write + run an osascript to complete the task via local GUI (Slack desktop, iMessage, Gmail compose, Claude.ai, etc.)",
        "- use your bash tool to invoke the right CLI directly",
        "- diagnose the underlying config/credential issue and report what the team needs to fix",
        "- if none are safe, explain in one paragraph why you're abstaining and what would need to change",
        "",
        "Keep your summary concise. Report what you did or why you didn't.",
      ].join("\n"),
    }),

    custom: (text, opts = {}) => ({
      label: opts.label || "Custom delegation",
      mode: opts.mode || "safe",
      timeout: opts.timeout || 300,
      prompt: text,
    }),
  };

  return {
    reload, available, dispatch, fetchOne, subscribe,
    runningCount,
    entries: () => LIST_CACHE.items.slice(),
    PROMPTS,
  };
})();

// Reload once on boot to warm the cache.
setTimeout(() => window.SecretaryDelegator && window.SecretaryDelegator.reload(), 250);

/* Comeketo Agent — AI provider layer.

   Three providers, one interface:

   1. **claude_code** (default) — local `claude -p` subprocess via
      /api/claude_code/generate. Uses the team's Max-plan auth. No API key.
      Same prompt pipeline (instructions + input) as OpenAI shape.

   2. **openai** (optional fallback) — Responses API. Routes through
      /api/proxy/openai/v1/responses when .env has OPENAI_API_KEY, else
      BYOK direct with a browser-localStorage key.

   3. **codex_cli** — local `codex exec` subprocess via
      /api/codex_cli/generate. Uses the selected GPT model and the Codex login.

   Provider choice lives in tweaks.aiProvider. The app doesn't care which
   one is active — SecretaryInstructions.ask() and SecretaryActions.* all
   call SecretaryAI.respond(), which dispatches to the active provider.
*/
window.SecretaryAI = (() => {
  const KEY_STORE = "secretary.openaiKey";
  const MODELS = ["gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano"];
  const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";

  const SERVER_STATUS = {
    checked: false,
    openai: false, close: false, clickup: false, slack: false,
    claude_code_available: false, claude_code_path: null,
    codex_cli_available: false, codex_cli_path: null,
    note: null,
  };
  async function checkServer(force = false) {
    if (SERVER_STATUS.checked && !force) return SERVER_STATUS;
    try {
      const res = await fetch("/api/status", { cache: "no-cache" });
      if (res.ok) {
        const s = await res.json();
        Object.assign(SERVER_STATUS, {
          checked: true,
          openai: !!s.openai, close: !!s.close, clickup: !!s.clickup, slack: !!s.slack,
          claude_code_available: !!s.claude_code_available,
          claude_code_path: s.claude_code_path || null,
          codex_cli_available: !!s.codex_cli_available,
          codex_cli_path: s.codex_cli_path || null,
          note: s.slack_note || null,
        });
      } else {
        SERVER_STATUS.checked = true;
      }
    } catch {
      SERVER_STATUS.checked = true;
    }
    return SERVER_STATUS;
  }
  checkServer();

  // ---- BYOK helpers (OpenAI only) ----------------------------------------

  function getKey() {
    try { return localStorage.getItem(KEY_STORE) || ""; } catch { return ""; }
  }
  function setKey(v) {
    try {
      if (v) localStorage.setItem(KEY_STORE, v);
      else localStorage.removeItem(KEY_STORE);
    } catch {}
  }
  function getModel() {
    try {
      const t = JSON.parse(localStorage.getItem("secretary.tweaks") || "{}");
      return MODELS.includes(t.openaiModel) ? t.openaiModel : DEFAULT_OPENAI_MODEL;
    } catch { return DEFAULT_OPENAI_MODEL; }
  }

  // ---- Provider selection ------------------------------------------------

  // Returns 'claude_code' | 'codex_cli' | 'openai'. Default is claude_code when
  // available, then Codex CLI, then OpenAI (proxy or BYOK).
  function getProvider() {
    try {
      const t = JSON.parse(localStorage.getItem("secretary.tweaks") || "{}");
      if (t.aiProvider === "openai") return "openai";
      if (t.aiProvider === "codex_cli") return "codex_cli";
      if (t.aiProvider === "claude_code") return "claude_code";
      // auto / unset — prefer Claude Code, then Codex CLI, then OpenAI.
      if (SERVER_STATUS.claude_code_available) return "claude_code";
      if (SERVER_STATUS.codex_cli_available) return "codex_cli";
      return "openai";
    } catch {
      if (SERVER_STATUS.claude_code_available) return "claude_code";
      if (SERVER_STATUS.codex_cli_available) return "codex_cli";
      return "openai";
    }
  }

  function isConfigured() {
    const p = getProvider();
    if (p === "claude_code") return SERVER_STATUS.claude_code_available;
    if (p === "codex_cli") return SERVER_STATUS.codex_cli_available;
    return SERVER_STATUS.openai || !!getKey();
  }

  function getRoute() {
    const p = getProvider();
    if (p === "claude_code") return "claude-code-subprocess";
    if (p === "codex_cli") return "codex-cli-subprocess";
    if (SERVER_STATUS.openai) return "openai-server-proxy";
    if (getKey()) return "openai-byok-direct";
    return null;
  }

  // ---- OpenAI response extraction ----------------------------------------

  function extractOpenAIText(data) {
    if (!data) return "";
    if (typeof data.output_text === "string" && data.output_text.length) return data.output_text;
    const out = Array.isArray(data.output) ? data.output : [];
    const parts = [];
    for (const item of out) {
      const content = Array.isArray(item?.content) ? item.content : [];
      for (const c of content) {
        if (typeof c?.text === "string") parts.push(c.text);
        else if (typeof c?.text?.value === "string") parts.push(c.text.value);
      }
    }
    return parts.join("\n").trim();
  }

  // ---- Provider dispatchers ----------------------------------------------

  async function respondClaudeCode({ input, instructions, signal, timeout }) {
    const res = await fetch("/api/claude_code/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, instructions, timeout: timeout || 120 }),
      signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      const msg = data.error || `claude_code ${res.status}`;
      const err = new Error(`Claude Code: ${msg}`);
      if (data.stderr) err.stderr = data.stderr;
      throw err;
    }
    return { text: data.output_text || "", raw: data, route: "claude-code-subprocess" };
  }

  async function respondCodexCli({ input, instructions, model, signal, timeout }) {
    const res = await fetch("/api/codex_cli/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, instructions, model: model || getModel(), timeout: timeout || 120 }),
      signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      const msg = data.error || `codex_cli ${res.status}`;
      const err = new Error(`Codex CLI: ${msg}`);
      if (data.stderr) err.stderr = data.stderr;
      throw err;
    }
    return { text: data.output_text || "", raw: data, route: "codex-cli-subprocess" };
  }

  async function respondOpenAI({ input, instructions, model, signal, extra }) {
    await checkServer();
    const body = {
      model: model || getModel(),
      input,
      ...(instructions ? { instructions } : {}),
      ...(extra || {}),
    };
    let url;
    const headers = { "Content-Type": "application/json" };
    if (SERVER_STATUS.openai) {
      url = "/api/proxy/openai/v1/responses";
    } else {
      const key = getKey();
      if (!key) throw new Error("OpenAI provider selected but no key available. Settings → Intelligence.");
      url = "https://api.openai.com/v1/responses";
      headers.Authorization = `Bearer ${key}`;
    }
    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body), signal });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`OpenAI ${res.status}: ${t.slice(0, 280) || res.statusText}`);
    }
    const data = await res.json();
    return { text: extractOpenAIText(data), raw: data, route: SERVER_STATUS.openai ? "openai-server-proxy" : "openai-byok-direct" };
  }

  // ---- Public API --------------------------------------------------------

  async function respond(args) {
    await checkServer();
    const provider = getProvider();
    if (provider === "claude_code") {
      if (!SERVER_STATUS.claude_code_available) {
        // Graceful fallback is API-only. Do not silently switch to the other CLI.
        if (SERVER_STATUS.openai || getKey()) return respondOpenAI(args);
        throw new Error("Claude Code provider selected but claude is not on PATH. Set OpenAI key for API fallback or choose another provider in Settings.");
      }
      return respondClaudeCode(args);
    }
    if (provider === "codex_cli") {
      if (!SERVER_STATUS.codex_cli_available) {
        // Graceful fallback is API-only. Do not silently switch to the other CLI.
        if (SERVER_STATUS.openai || getKey()) return respondOpenAI(args);
        throw new Error("Codex CLI provider selected but codex is not on PATH. Set OpenAI key for API fallback or choose another provider in Settings.");
      }
      return respondCodexCli(args);
    }
    return respondOpenAI(args);
  }

  // ask(prompt, opts?) — convenience wrapper around respond() for simple
  // "get me a string back" callers (edge narration, quick explain tiles).
  // opts.register selects a voice hint; we translate it into an instructions
  // preamble so the existing provider plumbing stays unchanged.
  async function ask(prompt, opts = {}) {
    const register = (opts && opts.register) || "narrative";
    const instructionsMap = {
      narrative: "You are Rodbot. Warm, concrete, direct. 1-3 sentences. No preamble, no meta, no bullet decorations unless explicitly asked.",
      intimate:  "You are Rodbot in intimate register. Short, human, direct. No preamble.",
      terse:     "Be terse. Answer in the fewest words that still answer.",
      bullets:   "Respond as a tight bullet list. One idea per line. No preamble.",
    };
    const instructions = (opts && opts.instructions)
      || instructionsMap[register]
      || instructionsMap.narrative;
    const r = await respond({
      input: prompt,
      instructions,
      signal: opts && opts.signal,
      timeout: opts && opts.timeout,
    });
    return (r && r.text) ? r.text : "";
  }

  async function testConnection(opts = {}) {
    try {
      const r = await respond({
        input: "Reply with the single word: ok",
        instructions: "Be terse. One word.",
        ...opts,
      });
      return { ok: true, text: r.text || "(empty)", route: r.route };
    } catch (e) {
      return { ok: false, error: e.message || String(e) };
    }
  }

  return {
    MODELS, DEFAULT_MODEL: DEFAULT_OPENAI_MODEL,
    getKey, setKey, getModel,
    getProvider, isConfigured, getRoute,
    respond, ask, testConnection,
    checkServer,
    serverStatus: () => ({ ...SERVER_STATUS }),
  };
})();

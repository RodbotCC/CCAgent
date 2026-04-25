/* Comeketo Agent — Chat layer.

   Multi-turn conversation UI. The chat store lives in localStorage
   (secretary.chats), and every turn also streams to the disk ledger at
   _ledger/chat.jsonl so the sweep agent can reconstruct conversations.

   After each assistant reply we fire a FIRE-AND-FORGET reflection pass:
     { user_turn, assistant_reply, prior_context }
     → structured JSON { summary, tags, actionable, related }
     → written to _ledger/chat_reflections.jsonl
     → if actionable:true, auto-appended to the inbox as kind:"note"

   The reflection uses the cheap model (OpenAI nano or same Claude Code,
   whichever is faster/cheaper for short structured prompts). Never blocks
   the user's next message.
*/
window.SecretaryChat = (() => {
  const STORE = "secretary.chats";
  const ACTIVE = "secretary.activeChatId";
  const listeners = new Set();
  let cache = [];

  function load() {
    try { cache = JSON.parse(localStorage.getItem(STORE) || "[]"); } catch { cache = []; }
  }
  function persist() {
    try { localStorage.setItem(STORE, JSON.stringify(cache)); } catch {}
  }
  function notify() { listeners.forEach(fn => { try { fn(cache); } catch {} }); }
  load();

  function id() { return "chat_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6); }
  function now() { return new Date().toISOString(); }

  function all() { return cache.slice(); }
  function get(chatId) { return cache.find(c => c.id === chatId) || null; }
  function activeId() { try { return localStorage.getItem(ACTIVE) || null; } catch { return null; } }
  function setActiveId(chatId) { try { localStorage.setItem(ACTIVE, chatId || ""); } catch {} }

  function newChat(title) {
    const entry = {
      id: id(),
      title: title || "New conversation",
      turns: [],
      createdAt: now(),
      lastTurnAt: now(),
    };
    cache = [entry, ...cache];
    setActiveId(entry.id);
    persist(); notify();
    return entry;
  }

  function archive(chatId) {
    cache = cache.filter(c => c.id !== chatId);
    persist(); notify();
  }

  function updateChat(chatId, patch) {
    cache = cache.map(c => c.id === chatId ? { ...c, ...patch, lastTurnAt: now() } : c);
    persist(); notify();
  }

  // Upload a File or Blob via /api/attachments/upload. Returns the
  // metadata blob the server writes (url, path, mime, size, filename).
  async function uploadFile(file) {
    const b64 = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(file);
    });
    const res = await fetch("/api/attachments/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name || "pasted",
        mime: file.type || "application/octet-stream",
        data_base64: b64,
      }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || !j.ok) throw new Error(j.error || `upload ${res.status}`);
    return j;
  }

  // Extract the plain-text summary of a content payload (string or parts).
  function textOf(content) {
    if (!content) return "";
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content.filter(p => p && p.type === "text").map(p => p.text || "").join(" ").trim();
    }
    return "";
  }

  function appendTurn(chatId, role, content, meta) {
    const turn = { role, content, t: now(), ...(meta || {}) };
    const chat = get(chatId);
    if (!chat) return null;
    chat.turns = [...chat.turns, turn];
    chat.lastTurnAt = turn.t;
    // Auto-title from the first user turn's text payload.
    if (chat.title === "New conversation" && role === "user" && chat.turns.length <= 2) {
      const t = textOf(content) || "(attachment)";
      chat.title = t.slice(0, 60) + (t.length > 60 ? "…" : "");
    }
    cache = cache.map(c => c.id === chatId ? chat : c);
    persist(); notify();
    // Mirror to disk via the activity ledger.
    if (window.SecretaryLedger) {
      window.SecretaryLedger.log("chat_turn", { chat_id: chatId, role, content });
    }
    return turn;
  }

  // Build a `content` payload for a turn. Text-only turns stay as strings
  // (back-compat with older persisted chats). Turns with attachments
  // promote to the parts-array shape: [{type:"text",text},{type:"image",url,path,mime}].
  function buildContent(text, attachments) {
    const hasAtt = Array.isArray(attachments) && attachments.length > 0;
    if (!hasAtt) return text || "";
    const parts = [];
    if (text && text.trim()) parts.push({ type: "text", text: text.trim() });
    for (const a of attachments) {
      parts.push({
        type: "image",
        url:  a.url,
        path: a.path,
        mime: a.mime || "image/png",
        size: a.size || 0,
        name: a.original_filename || a.filename || "",
      });
    }
    return parts;
  }

  // ─── Send pipeline ──────────────────────────────────────────────────
  // The system prompt is Rodbot's full persona block (built by
  // ai_instructions.js) in "intimate" register. That's what makes chat
  // feel like talking to her, not to a generic assistant.
  // `attachments` is an array of uploaded file metadata from
  // /api/attachments/upload — { url, path, mime, size, filename, original_filename }.
  async function send({ chatId, text, system, attachments }) {
    const hasText = !!(text && text.trim());
    const hasAtt = Array.isArray(attachments) && attachments.length > 0;
    if (!hasText && !hasAtt) return;
    let chat = get(chatId);
    if (!chat) { chat = newChat(); chatId = chat.id; }
    appendTurn(chatId, "user", buildContent(text, attachments));

    // Refresh cached reference after append.
    chat = get(chatId);

    // Build messages array for the provider.
    const messages = chat.turns.map(t => ({ role: t.role, content: t.content }));

    // Build Rodbot's system prompt unless the caller forced one.
    let systemPrompt = system || "";
    if (!systemPrompt && window.SecretaryInstructions) {
      try {
        // Prime identity + character + memory (noop after first call).
        await window.SecretaryInstructions.primeRodbot(false);
        await window.SecretaryInstructions.primeRodbotMemory(false);
        systemPrompt = window.SecretaryInstructions.build({ register: "intimate" });
      } catch (e) {
        console.warn("[chat] failed to build Rodbot prompt:", e.message);
      }
    }

    // ── Pieces grounding ───────────────────────────────────────────────
    // Fire a Pieces query in PARALLEL with the chat dispatch. The result
    // gets folded into the assistant turn metadata as `grounding` so the
    // UI can render it inline as a "from your activity" pull quote. We
    // never block the main reply on Pieces — if the query times out or
    // errors, the chat still lands without grounding.
    const userTextForGrounding = (text && text.trim()) || "";
    const piecesPromise = (userTextForGrounding && window.fetch)
      ? Promise.race([
          fetch("/api/pieces/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: `What recent activity context is relevant for answering this question? "${userTextForGrounding.slice(0, 200)}". Be terse — surface only the most temporally relevant apps, URLs, people, and decisions from the last 2 hours.`,
              chat_llm: (function() {
                try { return (JSON.parse(localStorage.getItem("secretary.tweaks") || "{}").piecesModel) || "gpt-4o"; } catch { return "gpt-4o"; }
              })(),
            }),
          }).then(r => r.json()).catch(() => null),
          new Promise(resolve => setTimeout(() => resolve(null), 12000)), // 12s cap
        ])
      : Promise.resolve(null);

    // Dispatch to server which routes per provider.
    const provider = (window.SecretaryAI && window.SecretaryAI.getProvider && window.SecretaryAI.getProvider()) || "claude_code";
    const res = await fetch("/api/chat/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, system: systemPrompt, provider, timeout: 180 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      const msg = data.error || `chat ${res.status}`;
      appendTurn(chatId, "system", `(error: ${msg})`, { error: true });
      throw new Error(msg);
    }

    // Wait for Pieces to land (it usually returns BEFORE the LLM does).
    // If it errored or timed out, grounding stays null and the UI just
    // skips the footer.
    const piecesData = await piecesPromise;
    const grounding = (piecesData && piecesData.ok) ? {
      raw: piecesData.raw || "",
      data: piecesData.data || null,
      model: piecesData.model || null,
      ts: new Date().toISOString(),
    } : null;

    appendTurn(chatId, "assistant", data.reply || "(empty)", { route: data.provider_route, grounding });

    // Fire reflection (fire-and-forget).
    try {
      const userText = (text && text.trim()) || (attachments && attachments.length ? `[${attachments.length} attachment${attachments.length > 1 ? "s" : ""}]` : "");
      reflect({ chatId, turn: { user: userText, assistant: data.reply } });
    } catch {}

    return data.reply;
  }

  // ─── Reflection ─────────────────────────────────────────────────────
  // Post-processing pass: read the most recent exchange, produce structured
  // metadata, stream to disk. Intentionally async and non-blocking.
  async function reflect({ chatId, turn }) {
    const prompt = [
      "Read the exchange below and produce a JSON object with this exact shape:",
      `{
  "summary":    string (1–2 sentences — what actually happened in this turn),
  "tags":       string[] (3–8 short topic keywords, lower-case),
  "actionable": boolean (true if this surfaces an action the team should take, a commitment-worthy item, or a bedrock gap),
  "action_hint": string | null (one sentence describing the action, if actionable),
  "related":    { projects?: string[], people?: string[], threads?: string[], knowledge?: string[] }  (only fields you're CONFIDENT about, using ids/names visible in the exchange)
}`,
      "",
      "Rules:",
      "- Return JSON ONLY, no prose.",
      "- Under-connect rather than over-connect. Only tag 'related' when there's a real reference.",
      "- 'actionable' defaults to false — only true for concrete next-moves, not for general discussion.",
      "",
      "USER TURN:",
      turn.user,
      "",
      "ASSISTANT REPLY:",
      turn.assistant,
    ].join("\n");

    try {
      if (!window.SecretaryAI) return;
      const { text } = await window.SecretaryAI.respond({
        input: prompt,
        instructions: "You are a silent reflector. Return strict JSON only.",
      });
      const parsed = extractJSON(text);
      if (!parsed) return;
      const reflection = {
        chat_id: chatId,
        t: now(),
        user_turn: turn.user,
        assistant_reply: turn.assistant,
        ...parsed,
      };
      // Write to the chat-reflections ledger.
      await fetch("/api/ledger/chat_reflections/append", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reflection),
      }).catch(() => {});
      // If actionable, drop an inbox note.
      if (parsed.actionable && window.SecretaryInbox) {
        await window.SecretaryInbox.append({
          kind: "note",
          text: (parsed.action_hint || parsed.summary || "actionable chat turn").trim(),
          source: { screen: "chat", chat_id: chatId },
          meta: { tags: parsed.tags, reflection: true, related: parsed.related },
        });
      }
      if (window.SecretaryLedger) {
        window.SecretaryLedger.log("chat_reflected", {
          chat_id: chatId,
          actionable: !!parsed.actionable,
          tags: parsed.tags || [],
        });
      }
    } catch (e) {
      console.warn("[chat] reflect failed:", e.message);
    }
  }

  function extractJSON(text) {
    if (!text) return null;
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const body = fence ? fence[1] : text;
    let depth = 0, start = -1;
    for (let i = 0; i < body.length; i++) {
      const ch = body[i];
      if (ch === "{") { if (depth === 0) start = i; depth++; }
      else if (ch === "}") {
        depth--;
        if (depth === 0 && start >= 0) {
          try { return JSON.parse(body.slice(start, i + 1)); } catch {}
          start = -1;
        }
      }
    }
    return null;
  }

  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  // Post a system-voice confirmation into the active (or first, or newly-created)
  // chat. Used by the front page to echo grid commits into the persistent rail.
  function appendSystem(text) {
    if (!text) return null;
    let cid = activeId();
    if (!cid) {
      const list = all();
      cid = (list[0] && list[0].id) || null;
    }
    if (!cid) {
      const c = newChat("Grid trail");
      cid = c.id;
    }
    return appendTurn(cid, "system", String(text));
  }

  return {
    all, get, activeId, setActiveId,
    newChat, archive, updateChat, appendTurn, appendSystem, textOf, buildContent, uploadFile,
    send, reflect,
    subscribe,
  };
})();

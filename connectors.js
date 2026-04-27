/* Comeketo Agent — Connectors layer.
   One place where "what channel is configured, and how do we send to it?" lives.
   Every channel has:
     - id, label, icon, short description
     - readiness check (reads /api/status from the proxy)
     - send(target, {subject, body}) → { ok, note, transcript }

   Channels go through the server proxy when the proxy has their key (keeps
   secrets server-side). In demo mode the proxy blocks all connector writes
   and returns { demo_blocked: true }.
*/
window.SecretaryConnectors = (() => {

  // Channel catalog. Order = display order in the bubble picker.
  // icon = Lucide name (resolved by window.Icon at render time).
  // accent = pastel palette key — each bubble picks up var(--pastel-<accent>) and var(--pastel-<accent>-ink).
  const CHANNELS = [
    { id: "claude_code", label: "Claude Code", icon: "terminal",       blurb: "Delegate — real filesystem + tools", requires: "claude_code", accent: "lavender" },
    { id: "clickup",     label: "ClickUp",     icon: "clipboard-list", blurb: "Task in your workspace",             requires: "clickup",     accent: "lemon"    },
    { id: "slack",       label: "Slack",       icon: "slack",          blurb: "DM or channel post",                 requires: "slack",       accent: "lavender" },
    { id: "email",       label: "Email",       icon: "mail",           blurb: "Gmail / SMTP",                       requires: "email",       accent: "sky"      },
    { id: "whatsapp",    label: "WhatsApp",    icon: "message-square", blurb: "Twilio / Cloud API",                 requires: "whatsapp",    accent: "mint"     },
    { id: "sms",         label: "SMS",         icon: "phone",          blurb: "Twilio text",                         requires: "sms",         accent: "sage"     },
    { id: "note",        label: "Note",        icon: "sticky-note",    blurb: "Local note — nothing leaves",        requires: null,          accent: "peach"    },
    { id: "internal",    label: "Internal",    icon: "brain",          blurb: "For your eyes only",                  requires: null,          accent: "blush"    },
    { id: "open_url",    label: "Open URL",    icon: "external-link",  blurb: "Opens the target in a new tab",      requires: null,          accent: "neutral"  },
  ];

  // Cached status from the server.
  let cachedStatus = null;
  async function refreshStatus() {
    try {
      const res = await fetch("/api/status", { cache: "no-cache" });
      if (!res.ok) { cachedStatus = {}; return cachedStatus; }
      cachedStatus = await res.json();
    } catch { cachedStatus = {}; }
    return cachedStatus;
  }
  function serverStatus() { return cachedStatus || {}; }
  // Kick off a refresh eagerly.
  refreshStatus();

  // readiness: 'ready' | 'needs-setup' | 'misconfigured' | 'always-ready'
  function readiness(channelId) {
    const ch = CHANNELS.find(c => c.id === channelId);
    if (!ch) return "unknown";
    if (!ch.requires) return "always-ready";
    const s = cachedStatus || {};
    switch (ch.requires) {
      // Claude Code subprocess — server probed the binary on startup.
      case "claude_code": return s.claude_code_available ? "ready" : "needs-setup";
      // ClickUp needs the token AND a resolvable list. The server auto-resolves
      // one from your space on startup — you don't paste a list id anywhere.
      case "clickup":
        if (!s.clickup) return "needs-setup";
        if (!s.clickup_list_id) return "misconfigured";
        return "ready";
      case "slack": {
        if (!s.slack) return "needs-setup";
        // proxy flagged xapp- vs xoxb- mismatch
        if (s.slack_note && String(s.slack_note).toLowerCase().includes("xapp-")) return "misconfigured";
        return "ready";
      }
      case "email":    return s.email ? "ready" : "needs-setup";
      case "whatsapp": return s.whatsapp ? "ready" : "needs-setup";
      case "sms":      return s.sms ? "ready" : "needs-setup";
      default: return "needs-setup";
    }
  }

  function helpFor(channelId) {
    const s = cachedStatus || {};
    switch (channelId) {
      case "claude_code":
        if (!s.claude_code_available) return "Claude Code binary not found on server PATH. Install it or set CLAUDE_BIN.";
        return `Delegates body-as-prompt via subprocess (target = filesystem path — cwd or specific file). Binary: ${s.claude_code_path || "(unknown)"}`;
      case "clickup":
        if (!s.clickup) return "Set CLICKUP_API_TOKEN in .env, restart server.py.";
        if (s.clickup_list_id) return `Sending to list "${s.clickup_list_name || s.clickup_list_id}" (auto-picked from your space).`;
        return `Server couldn't find a list in your CLICKUP_SPACE_ID. Create one in ClickUp, then restart server.py. (${s.clickup_list_source || "no detail"})`;
      case "slack":    return "Slack needs a Bot token (xoxb-). Current .env has an app-level token (xapp-). Replace SLACK_BOT_TOKEN.";
      case "email":    return "Set GMAIL_ACCESS_TOKEN (or SMTP creds) in .env. See docs/connectors.md for the OAuth flow.";
      case "whatsapp": return "Set TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_WHATSAPP_FROM in .env.";
      case "sms":      return "Set TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_SMS_FROM in .env.";
      default:         return "";
    }
  }

  // ─── Senders ────────────────────────────────────────────────────────────

  const demoHeader = () => {
    try {
      const t = JSON.parse(localStorage.getItem("secretary.tweaks") || "{}");
      return t.demoMode ? { "X-Demo-Mode": "1" } : {};
    } catch { return {}; }
  };

  async function sendClickUp({ target, subject, body }) {
    // User target wins if provided, otherwise use the server's auto-resolved
    // default list. User never has to paste a list id.
    const listId = (target || "").trim() || (cachedStatus && cachedStatus.clickup_list_id) || null;
    if (!listId) {
      return {
        ok: false,
        note: "No ClickUp list available. Check that your CLICKUP_SPACE_ID has at least one list, or paste a list id in the target field.",
      };
    }
    const url = `/api/proxy/clickup/api/v2/list/${encodeURIComponent(listId)}/task`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...demoHeader() },
        body: JSON.stringify({ name: subject || "(secretary commit)", description: body || "" }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.demo_blocked) {
        return { ok: true, note: "demo · blocked at proxy, no write", transcript: json };
      }
      if (!res.ok) {
        return { ok: false, note: `ClickUp ${res.status}: ${json.err || json.error || res.statusText}`, transcript: json };
      }
      const taskUrl = json.url || (json.id ? `https://app.clickup.com/t/${json.id}` : null);
      return { ok: true, note: taskUrl ? `Task created: ${taskUrl}` : "Task created", transcript: json, openUrl: taskUrl };
    } catch (e) {
      return { ok: false, note: `ClickUp network error: ${e.message}` };
    }
  }

  async function sendSlack({ target, body }) {
    if (!target) return { ok: false, note: "Slack needs a channel id or user id in target (e.g. #general or C0123)." };
    const url = "/api/proxy/slack/api/chat.postMessage";
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...demoHeader() },
        body: JSON.stringify({ channel: target, text: body || "" }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.demo_blocked) return { ok: true, note: "demo · blocked at proxy", transcript: json };
      if (json.ok === false) return { ok: false, note: `Slack: ${json.error}`, transcript: json };
      if (!res.ok) return { ok: false, note: `Slack ${res.status}`, transcript: json };
      return { ok: true, note: `Posted to ${target} (ts ${json.ts})`, transcript: json };
    } catch (e) { return { ok: false, note: `Slack network error: ${e.message}` }; }
  }

  async function notImplemented(channel) {
    return { ok: false, note: `${channel} connector not wired yet — set the credentials in .env and I'll add it. See docs/connectors.md.` };
  }

  async function sendNote() {
    return { ok: true, note: "Noted locally — nothing sent." };
  }

  async function sendOpenURL({ target }) {
    if (!target) return { ok: false, note: "No URL in target." };
    try {
      window.open(target, "_blank", "noopener,noreferrer");
      return { ok: true, note: `Opened ${target}` };
    } catch (e) {
      return { ok: false, note: `open failed: ${e.message}` };
    }
  }

  // Claude Code delegation — body IS the prompt, target is a filesystem path.
  // If target looks like a file (ends in a .ext), we pass the parent as cwd
  // and give Claude Code an explicit "write to this exact file" instruction.
  // Otherwise target is treated as the cwd. Commitments sent here route
  // through SecretaryDelegator.dispatch so they show up on the Delegate chip
  // with live status and full result history.
  async function sendClaudeCode({ target, subject, body }) {
    if (!window.SecretaryDelegator) return { ok: false, note: "delegator not loaded" };
    const fs = (target || "").trim();
    let cwd; let pathHint = "";
    if (fs) {
      const looksLikeFile = /\.[a-z0-9]{1,8}$/i.test(fs);
      if (looksLikeFile) {
        const idx = fs.lastIndexOf("/");
        cwd = idx > 0 ? fs.slice(0, idx) : undefined;
        pathHint = `TARGET FILE: ${fs}\nWrite your output to this exact file unless the task explicitly says otherwise.\n\n`;
      } else {
        cwd = fs;
        pathHint = `WORKING DIR: ${fs}\n\n`;
      }
    }
    try {
      const requestId = await window.SecretaryDelegator.dispatch({
        prompt: pathHint + (body || "(no prompt body)"),
        mode: "trusted",          // commitments that route here are user-approved
        label: subject || "Commitment delegation",
        cwd,
      });
      return {
        ok: true,
        note: `Dispatched to Claude Code (${requestId}) — watch progress on the Delegate chip.`,
        transcript: { request_id: requestId, cwd, path_hint: pathHint || null },
      };
    } catch (e) {
      return { ok: false, note: `Claude Code dispatch failed: ${e.message}` };
    }
  }

  async function send(channelId, { target, subject, body }) {
    switch (channelId) {
      case "claude_code": return sendClaudeCode({ target, subject, body });
      case "clickup":     return sendClickUp({ target, subject, body });
      case "slack":       return sendSlack({ target, body });
      case "email":       return notImplemented("email");
      case "whatsapp":    return notImplemented("whatsapp");
      case "sms":         return notImplemented("sms");
      case "note":        return sendNote();
      case "internal":    return sendNote();
      case "open_url":    return sendOpenURL({ target });
      default:            return { ok: false, note: `Unknown channel: ${channelId}` };
    }
  }

  return {
    CHANNELS,
    refreshStatus, serverStatus,
    readiness, helpFor,
    send,
  };
})();

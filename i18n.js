/* Comeketo Agent — tiny i18n layer.
   Translates UI chrome only. Rodbot's generated output (memories, drafts,
   grid cells, chat replies) stays English — translating generated content
   is a separate scope (Layer 2) that needs the identity files translated.

   Usage:
     t("inbox")                        → "Inbox" or "Caixa de Entrada"
     t("send_now")                     → "Send now" or "Enviar agora"
     t("count.open", { n: 12 })        → "12 open" or "12 abertos"

   Strings not in the dictionary fall back to the key with first letter
   uppercased, so missing translations never break the app. */
(() => {
  const KEY = "comeketoagent.language";

  const DICT = {
    en: {
      // ── nav / groups ─────────────────────────────────────────────────
      briefing: "Briefing",
      today: "Today",
      work: "Work",
      people: "People",
      mind: "Mind",
      settings: "Settings",

      // ── screen names (used in nav + page titles + breadcrumbs) ─────
      calendar: "Calendar",
      inbox: "Inbox",
      commitments: "Commitments",
      projects: "Projects",
      delegate: "Delegate",
      prediction: "Prediction",
      contacts: "Contacts",
      chat: "Chat",
      rodbot: "Rodbot",
      memory: "Memory",
      activity: "Activity",
      analytics: "Analytics",

      // ── common buttons ─────────────────────────────────────────────
      generate: "Generate",
      generating: "thinking…",
      send_now: "Send now",
      sending: "Sending…",
      send: "Send",
      send_all: "Send all pending",
      cancel: "Cancel",
      edit: "Edit",
      save: "Save",
      save_edits: "Save edits",
      back: "back",
      back_to_grid: "back to grid",
      refresh: "Refresh",
      dismiss: "Dismiss",
      delete: "Delete",
      retire: "Retire",
      mark_complete: "Mark complete · retire",
      mark_recurring: "Mark recurring…",
      delete_block: "Delete block (tell system why)",
      edit_with_rodbot: "Edit with Rodbot",
      apply_rewrite: "Apply rewrite",
      close: "Close",
      new_chat: "New chat",
      drop_in: "Drop in",
      regenerate: "Regenerate draft",
      sweep_inbox_now: "Sweep inbox now",
      triaging: "Triaging…",
      sweep_now: "Sweep now",
      sweeping: "sweeping…",
      ask: "Ask",
      asking: "asking…",

      // ── statuses ──────────────────────────────────────────────────
      status_open: "open",
      status_swept: "swept",
      status_dismissed: "dismissed",
      status_pending: "pending",
      status_sent: "sent",
      status_sending: "sending",
      status_failed: "failed",
      status_canceled: "canceled",
      status_drafting: "drafting…",
      status_current: "current",
      status_latest: "latest",
      status_fresh: "fresh",
      status_stale: "stale",

      // ── labels ────────────────────────────────────────────────────
      label_language: "Language",
      label_connectors: "Connectors",
      label_archive: "Archive",
      label_draft: "Draft",
      label_actions: "Actions",
      label_metadata: "Metadata",
      label_content: "Content",
      label_audit: "Audit — what happened with this item",
      label_channel: "Channel",
      label_target: "Target",
      label_subject: "Subject / headline",
      label_body: "Body",
      label_all: "All",
      label_sweeps: "Sweeps",

      // ── empty / hint states ───────────────────────────────────────
      inbox_empty: "Nothing here.",
      inbox_empty_hint: "Drop a thought above and it'll wait for the next sweep.",
      inbox_placeholder: "Drop a {kind} here — raw is fine, I'll clean it up on sweep. ⌘/Ctrl+Enter to save.",
      generate_lens_placeholder: "Optional — lens for this grid (what are you looking for?)",
      chat_placeholder: "Message Comeketo Agent. ⌘/Ctrl+Enter.",
      chat_empty: "Say something.",
      chat_empty_hint: "Every turn gets reflected on and indexed. Actionable turns auto-append to the inbox.",
      no_entries: "No entries yet.",

      // ── screen titles / headings (the big display strings) ───────
      title_inbox: "Drop it here — I'll fold it in later.",
      kicker_inbox: "inbox · raw input · sweeps into bedrock",
      title_commitments: "Everything you've said yes to — send when ready.",
      kicker_commitments: "commitments · final review",
      title_briefing: "What moved yesterday. What needs you today.",
      kicker_briefing: "daily briefing · oracle sweep",
      title_activity: "Everything you've actually been doing.",
      kicker_activity: "activity · pieces ltm · ambient context",
      title_rodbot: "Reflective intelligence.",
      kicker_rodbot: "rodbot · reflective intelligence",

      // ── counts ────────────────────────────────────────────────────
      count_open: "open",
      count_swept: "swept",
      count_sent: "sent",
      count_pending: "pending",
      count_total: "total",
      count_chats: "chats",
      count_turns: "turns",
      count_memories: "memories",
      count_reflections: "reflections",
    },

    "pt-BR": {
      // ── nav / groups ─────────────────────────────────────────────────
      briefing: "Resumo",
      today: "Hoje",
      work: "Trabalho",
      people: "Pessoas",
      mind: "Mente",
      settings: "Ajustes",

      // ── screen names ──────────────────────────────────────────────
      calendar: "Calendário",
      inbox: "Caixa de Entrada",
      commitments: "Compromissos",
      projects: "Projetos",
      delegate: "Delegar",
      prediction: "Previsão",
      contacts: "Contatos",
      chat: "Chat",
      rodbot: "Rodbot",
      memory: "Memória",
      activity: "Atividade",
      analytics: "Análises",

      // ── common buttons ─────────────────────────────────────────────
      generate: "Gerar",
      generating: "pensando…",
      send_now: "Enviar agora",
      sending: "Enviando…",
      send: "Enviar",
      send_all: "Enviar todos os pendentes",
      cancel: "Cancelar",
      edit: "Editar",
      save: "Salvar",
      save_edits: "Salvar alterações",
      back: "voltar",
      back_to_grid: "voltar à grade",
      refresh: "Atualizar",
      dismiss: "Dispensar",
      delete: "Excluir",
      retire: "Arquivar",
      mark_complete: "Marcar concluído · arquivar",
      mark_recurring: "Marcar recorrente…",
      delete_block: "Excluir bloco (diga ao sistema por quê)",
      edit_with_rodbot: "Editar com o Rodbot",
      apply_rewrite: "Aplicar reescrita",
      close: "Fechar",
      new_chat: "Novo chat",
      drop_in: "Adicionar",
      regenerate: "Regenerar rascunho",
      sweep_inbox_now: "Varrer caixa agora",
      triaging: "Triando…",
      sweep_now: "Varrer agora",
      sweeping: "varrendo…",
      ask: "Perguntar",
      asking: "perguntando…",

      // ── statuses ──────────────────────────────────────────────────
      status_open: "aberto",
      status_swept: "varrido",
      status_dismissed: "dispensado",
      status_pending: "pendente",
      status_sent: "enviado",
      status_sending: "enviando",
      status_failed: "falhou",
      status_canceled: "cancelado",
      status_drafting: "redigindo…",
      status_current: "atual",
      status_latest: "mais recente",
      status_fresh: "novo",
      status_stale: "antigo",

      // ── labels ────────────────────────────────────────────────────
      label_language: "Idioma",
      label_connectors: "Conectores",
      label_archive: "Arquivo",
      label_draft: "Rascunho",
      label_actions: "Ações",
      label_metadata: "Metadados",
      label_content: "Conteúdo",
      label_audit: "Auditoria — o que aconteceu com este item",
      label_channel: "Canal",
      label_target: "Destinatário",
      label_subject: "Assunto / título",
      label_body: "Mensagem",
      label_all: "Todos",
      label_sweeps: "Varreduras",

      // ── empty / hint states ───────────────────────────────────────
      inbox_empty: "Vazio.",
      inbox_empty_hint: "Anote algo acima e ele espera a próxima varredura.",
      inbox_placeholder: "Anote um(a) {kind} aqui — bruto está ótimo, eu arrumo na varredura. ⌘/Ctrl+Enter para salvar.",
      generate_lens_placeholder: "Opcional — foco desta grade (o que você está procurando?)",
      chat_placeholder: "Envie uma mensagem ao Comeketo Agent. ⌘/Ctrl+Enter.",
      chat_empty: "Diga alguma coisa.",
      chat_empty_hint: "Cada turno é refletido e indexado. Turnos acionáveis viram itens da caixa.",
      no_entries: "Nenhum item ainda.",

      // ── screen titles / headings ───────────────────────────────────
      title_inbox: "Anote aqui — eu incorporo depois.",
      kicker_inbox: "caixa de entrada · entrada bruta · varre para o núcleo",
      title_commitments: "Tudo o que você aprovou — envie quando estiver pronto.",
      kicker_commitments: "compromissos · revisão final",
      title_briefing: "O que andou ontem. O que precisa de você hoje.",
      kicker_briefing: "resumo diário · varredura oráculo",
      title_activity: "Tudo o que você realmente andou fazendo.",
      kicker_activity: "atividade · pieces ltm · contexto ambiente",
      title_rodbot: "Inteligência reflexiva.",
      kicker_rodbot: "rodbot · inteligência reflexiva",

      // ── counts ────────────────────────────────────────────────────
      count_open: "abertos",
      count_swept: "varridos",
      count_sent: "enviados",
      count_pending: "pendentes",
      count_total: "total",
      count_chats: "chats",
      count_turns: "turnos",
      count_memories: "memórias",
      count_reflections: "reflexões",
    },
  };

  function current() {
    try { return localStorage.getItem(KEY) || "en"; } catch { return "en"; }
  }

  function setLang(lang) {
    if (!DICT[lang]) return;
    try { localStorage.setItem(KEY, lang); } catch {}
    window.dispatchEvent(new CustomEvent("comeketoagent:language", { detail: { lang } }));
  }

  function t(key, vars) {
    const lang = current();
    const table = DICT[lang] || DICT.en;
    let s = table[key] || DICT.en[key];
    if (!s) {
      // Fallback: humanize the key so nothing is ever blank
      s = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    }
    if (vars) {
      Object.keys(vars).forEach(k => { s = s.replace(new RegExp(`\\{${k}\\}`, "g"), vars[k]); });
    }
    return s;
  }

  // Expose globally — React components read t() at render time so changing
  // the language triggers a re-render via the language-change event.
  window.t = t;
  window.Comeketoi18n = {
    get: current,
    set: setLang,
    available: () => Object.keys(DICT),
    labels: { en: "English", "pt-BR": "Português (Brasil)" },
  };
})();

/* Comeketo Agent — app shell: router, state, dispatch (AI-wired) */

function App() {
  const data = window.SECRETARY_DATA;

  // i18n — re-render the tree whenever the user flips language.
  // Components call window.t("key") at render time so this covers the app.
  const [, setLang] = useState(() => (window.Comeketoi18n && window.Comeketoi18n.get()) || "en");
  useEffect(() => {
    const onChange = (e) => setLang(e.detail.lang);
    window.addEventListener("comeketoagent:language", onChange);
    return () => window.removeEventListener("comeketoagent:language", onChange);
  }, []);

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "light",
    "density": "regular",
    "predLevel": "hi",
    "autoCommit": true,
    "showPanels": true,
    "demoMode": true,
    "piecesModel": "claude-sonnet-4-5"
  }/*EDITMODE-END*/;

  const [tweaks, setTweaks] = useState(() => {
    try {
      const s = localStorage.getItem("secretary.tweaks");
      return s ? { ...TWEAK_DEFAULTS, ...JSON.parse(s) } : TWEAK_DEFAULTS;
    } catch { return TWEAK_DEFAULTS; }
  });
  useEffect(() => { localStorage.setItem("secretary.tweaks", JSON.stringify(tweaks)); }, [tweaks]);

  const [tweaksOpen, setTweaksOpen] = useState(false);
  // In-place "Edit with Rodbot" overlay — replaces the old tab-hop behavior.
  const [rodbotEdit, setRodbotEdit] = useState(null); // { cell, gridId }
  useEffect(() => {
    const h = (e) => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "__activate_edit_mode") setTweaksOpen(true);
      if (e.data.type === "__deactivate_edit_mode") setTweaksOpen(false);
    };
    window.addEventListener("message", h);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", h);
  }, []);
  useEffect(() => {
    window.parent.postMessage({ type: "__edit_mode_set_keys", edits: tweaks }, "*");
  }, [tweaks]);

  useEffect(() => {
    document.documentElement.dataset.theme = tweaks.theme;
    document.documentElement.dataset.density = tweaks.density;
  }, [tweaks.theme, tweaks.density]);

  // --- Mission Control status ------------------------------------------------
  const [mcStatus, setMcStatus] = useState(() => {
    const s = window.MissionControlStatus || { state: "loading", warnings: [] };
    return { ...s, data: window.MissionControl };
  });
  useEffect(() => {
    const onLoaded = (e) => setMcStatus({ state: "ok", warnings: (window.MissionControlStatus || {}).warnings || [], data: e.detail });
    const onError = (e) => setMcStatus({ state: "error", error: e.detail && e.detail.message, data: null });
    window.addEventListener("missioncontrol:loaded", onLoaded);
    window.addEventListener("missioncontrol:error", onError);
    // catch the case where it resolved before we attached
    if (window.MissionControl) onLoaded({ detail: window.MissionControl });
    return () => {
      window.removeEventListener("missioncontrol:loaded", onLoaded);
      window.removeEventListener("missioncontrol:error", onError);
    };
  }, []);

  // --- AI override layer -----------------------------------------------------
  // Grid history — each gridId has a STACK of grid versions (seed + every
  // AI regen on top). The topmost is what renders. "Back one generation"
  // pops the top. This replaces the old single-override model so we have
  // true undo instead of a nuclear revert-to-seed.
  const [gridHistory, setGridHistory] = useState(() => {
    try {
      const legacy = localStorage.getItem("secretary.gridOverrides");
      const parsed = legacy ? JSON.parse(legacy) : null;
      // migrate old shape { [id]: grid } → { [id]: [grid] }
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const migrated = {};
        for (const [k, v] of Object.entries(parsed)) migrated[k] = Array.isArray(v) ? v : [v];
        return migrated;
      }
      const stack = localStorage.getItem("secretary.gridHistory");
      return stack ? JSON.parse(stack) : {};
    } catch { return {}; }
  });
  useEffect(() => {
    try {
      localStorage.setItem("secretary.gridHistory", JSON.stringify(gridHistory));
      // keep legacy key in sync for any old code reading the flat shape
      const flat = {};
      for (const [k, arr] of Object.entries(gridHistory)) flat[k] = arr[arr.length - 1];
      localStorage.setItem("secretary.gridOverrides", JSON.stringify(flat));
    } catch {}
  }, [gridHistory]);

  // View-model: flat override = top of stack.
  const gridOverrides = useMemo(() => {
    const out = {};
    for (const [k, arr] of Object.entries(gridHistory)) {
      if (arr && arr.length) out[k] = arr[arr.length - 1];
    }
    return out;
  }, [gridHistory]);

  const pushGridVersion = useCallback((gridId, grid) => {
    setGridHistory(prev => {
      const stack = prev[gridId] ? [...prev[gridId]] : [];
      stack.push(grid);
      // Keep stacks bounded so storage doesn't balloon forever.
      if (stack.length > 12) stack.shift();
      return { ...prev, [gridId]: stack };
    });
    if (window.SecretaryLedger) {
      window.SecretaryLedger.log("grid_version_pushed", {
        gridId, title: grid.title,
        generated: !!grid._aiGenerated,
      });
    }
  }, []);
  // Back-one-generation — pop the top grid if there's more than one version.
  // Returns true if it popped, false if already at bottom.
  const popGridVersion = useCallback((gridId) => {
    let popped = false;
    setGridHistory(prev => {
      const stack = prev[gridId];
      if (!stack || stack.length <= 1) return prev;
      popped = true;
      return { ...prev, [gridId]: stack.slice(0, -1) };
    });
    return popped;
  }, []);
  // Kept for internal callers: nukes the whole stack for a grid.
  const clearGridHistory = useCallback((gridId) => {
    setGridHistory(prev => {
      const { [gridId]: _drop, ...rest } = prev;
      return rest;
    });
  }, []);
  // Alias to keep external API the same.
  const setGridOverride = useCallback((gridId, grid) => pushGridVersion(gridId, grid), [pushGridVersion]);

  const [aiBusy, setAiBusy] = useState(false);       // true while a call is in flight
  const [aiError, setAiError] = useState(null);      // last error message (dismissible)
  const [aiNote, setAiNote] = useState(null);        // last success note (auto-clears)

  // --- Commitments ledger ----------------------------------------------------
  // status: 'pending' | 'sent' | 'canceled' | 'failed'
  // shape:  { id, createdAt, source:{gridId,cellId,headline,preview,detail},
  //           commit:{kind,label,target?}, subject, body, target, status, result?, sentAt?, demoSent? }
  const [commitments, setCommitments] = useState(() => {
    try { return JSON.parse(localStorage.getItem("secretary.commitments") || "[]"); }
    catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem("secretary.commitments", JSON.stringify(commitments)); } catch {}
  }, [commitments]);
  const pendingCount = commitments.filter(c => c.status === "pending").length;

  // Inbox open count — badge on the Inbox chip. Live-subscribes to the store.
  const [inboxOpenCount, setInboxOpenCount] = useState(
    () => (window.SecretaryInbox ? window.SecretaryInbox.openCount() : 0)
  );
  useEffect(() => {
    if (!window.SecretaryInbox) return;
    const unsub = window.SecretaryInbox.subscribe(() => {
      setInboxOpenCount(window.SecretaryInbox.openCount());
    });
    return unsub;
  }, []);

  // Delegation running count — badge on the Delegations chip.
  const [delegationRunningCount, setDelegationRunningCount] = useState(0);
  useEffect(() => {
    if (!window.SecretaryDelegator) return;
    const unsub = window.SecretaryDelegator.subscribe(() => {
      setDelegationRunningCount(window.SecretaryDelegator.runningCount());
    });
    return unsub;
  }, []);

  const addCommitment = useCallback((source, cell) => {
    const id = "cmt_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
    const entry = {
      id,
      createdAt: new Date().toISOString(),
      source,
      commit: { ...cell.commit },
      subject: cell.headline,
      body: cell.detail || cell.preview || "",
      target: (cell.commit && cell.commit.target) || "",
      status: "pending",
    };
    setCommitments(list => [entry, ...list]);
    if (window.SecretaryLedger) {
      window.SecretaryLedger.log("commitment_created", {
        id, subject: entry.subject, commit_kind: entry.commit && entry.commit.kind,
        source: entry.source,
      });
    }
    return entry;
  }, []);

  const updateCommitment = useCallback((id, patch) => {
    setCommitments(list => list.map(c => c.id === id ? { ...c, ...patch } : c));
  }, []);

  const removeCommitment = useCallback((id) => {
    setCommitments(list => list.filter(c => c.id !== id));
  }, []);

  // Dispatch routes through SecretaryConnectors. Demo-mode enforcement lives
  // server-side (the proxy blocks writes when X-Demo-Mode: 1 is set); connectors.js
  // forwards that header. Returns uniform { ok, note, transcript?, openUrl? }.
  const dispatchCommitment = useCallback(async (c) => {
    if (!window.SecretaryConnectors) return { ok: false, note: "connectors layer not loaded" };
    // Channel resolution: explicit c.channel (AI-picked or user-picked) > commit.kind mapping > 'note'.
    let channel = c.channel;
    if (!channel) {
      const k = c.commit && c.commit.kind;
      if (k === "open" || k === "open_url") channel = "open_url";
      else if (k === "done")                 channel = "note";
      else                                   channel = "note";
    }
    return window.SecretaryConnectors.send(channel, {
      target: c.target || (c.commit && c.commit.target),
      subject: c.subject,
      body: c.body,
    });
  }, []);

  const sendCommitment = useCallback(async (id) => {
    const c = commitments.find(x => x.id === id);
    if (!c || c.status === "sent") return;
    updateCommitment(id, { status: "sending" });
    try {
      const r = await dispatchCommitment(c);
      if (r.ok) {
        updateCommitment(id, { status: "sent", result: r.note, sentAt: new Date().toISOString(), demoSent: !!tweaks.demoMode });
        setAiNote(`Sent: ${c.subject} — ${r.note}`);
        window.SecretaryMemory && window.SecretaryMemory.log.send({
          cluster: (c.source && c.source.cluster) || "unknown",
          gridId: c.source && c.source.gridId, cellId: c.source && c.source.cellId,
          detail: `${c.commit && c.commit.kind} · ${c.subject}${tweaks.demoMode ? " (demo)" : ""}`,
          demo: !!tweaks.demoMode,
        });
        window.SecretaryLedger && window.SecretaryLedger.log("commitment_sent", {
          id, subject: c.subject, channel: c.channel, target: c.target,
          demo: !!tweaks.demoMode, result: r.note,
        });
      } else {
        updateCommitment(id, { status: "failed", result: r.note });
        setAiError(`Send failed: ${r.note}`);
        window.SecretaryLedger && window.SecretaryLedger.log("commitment_failed", {
          id, subject: c.subject, channel: c.channel, target: c.target, error: r.note,
        });
      }
    } catch (e) {
      updateCommitment(id, { status: "failed", result: e.message || String(e) });
      setAiError("Send failed: " + (e.message || e));
    } finally {
      setTimeout(() => setAiNote(null), 3000);
    }
  }, [commitments, dispatchCommitment, tweaks.demoMode, updateCommitment]);

  const sendAllPending = useCallback(async () => {
    const pending = commitments.filter(c => c.status === "pending");
    for (const c of pending) {
      // sequential so status updates visibly
      // eslint-disable-next-line no-await-in-loop
      await sendCommitment(c.id);
    }
  }, [commitments, sendCommitment]);

  const cancelCommitment = useCallback((id) => {
    updateCommitment(id, { status: "canceled" });
  }, [updateCommitment]);

  const aiConfigured = !!(window.SecretaryAI && window.SecretaryAI.isConfigured());

  // --- Streak (ledger-derived; refreshed on load and after any commit) -------
  // Shown on the Calendar chip so the team sees the streak without leaving the grid.
  const [streakDays, setStreakDays] = useState(0);
  // Open-task count (across all projects) surfaced on the topbar.
  const [openTasksCount, setOpenTasksCount] = useState(0);
  const refreshOpenTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/projects", { cache: "no-cache" });
      if (!res.ok) return;
      const j = await res.json();
      let n = 0;
      for (const p of (j.projects || [])) n += (p.open_task_count || 0);
      setOpenTasksCount(n);
    } catch {}
  }, []);
  useEffect(() => { refreshOpenTasks(); }, [refreshOpenTasks]);

  // --- Rodbot snapshot (subscription so Topbar count updates live) ----------
  const [rodbotState, setRodbotState] = useState(() => (window.Rodbot ? window.Rodbot.snapshot() : null));
  useEffect(() => {
    if (!window.Rodbot) return;
    const unsub = window.Rodbot.subscribe(s => setRodbotState({ ...s }));
    return unsub;
  }, []);
  const refreshStreak = useCallback(async () => {
    try {
      const L = window.SecretaryLedger;
      const F = window.computeStreak;
      const S = window.isShipEvent;
      if (!L || !F || !S) return;
      const events = await L.read();
      const days = new Set();
      for (const ev of events) {
        if (!S(ev) || !ev.t) continue;
        const d = new Date(ev.t);
        if (isNaN(d.getTime())) continue;
        const slug = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        days.add(slug);
      }
      setStreakDays(F(days).current);
    } catch {}
  }, []);
  useEffect(() => { refreshStreak(); }, [refreshStreak]);

  // --- Routing ---------------------------------------------------------------
  const KNOWN_SCREENS = ["grid", "settings", "memory", "prediction", "commitments", "inbox", "contacts", "briefing", "delegations", "chat", "calendar", "Rodbot", "projects", "tables", "table_detail", "table_new", "analytics", "automation", "activity", "commitment_detail", "inbox_detail", "intake"];
  const getGridFor = (id) => gridOverrides[id] || data.grids[id] || null;
  const validHistory = (h) => {
    if (!Array.isArray(h) || !h.length) return null;
    const clean = h.filter(e => e && KNOWN_SCREENS.includes(e.name) && (e.name !== "grid" || (e.gridId && getGridFor(e.gridId))));
    return clean.length ? clean : null;
  };
  const [history, setHistory] = useState(() => {
    try {
      const s = localStorage.getItem("secretary.history.v2");
      if (s) {
        const cleaned = validHistory(JSON.parse(s));
        if (cleaned) return cleaned;
      }
    } catch {}
    return [{ name: "grid", gridId: "morning" }];
  });
  useEffect(() => { localStorage.removeItem("secretary.history"); }, []);
  useEffect(() => { localStorage.setItem("secretary.history.v2", JSON.stringify(history)); }, [history]);
  const route = history[history.length - 1];

  const go = useMemo(() => ({
    push: (name, params = {}) => setHistory(h => [...h, { name, ...params }]),
    replace: (name, params = {}) => setHistory(h => [...h.slice(0,-1), { name, ...params }]),
    back: () => setHistory(h => h.length > 1 ? h.slice(0, -1) : h),
    jumpTo: (i) => setHistory(h => h.slice(0, i + 1)),
    home: () => setHistory([{ name: "grid", gridId: "morning" }]),
  }), []);

  const [refineStack, setRefineStack] = useState(() => {
    try {
      const s = localStorage.getItem("secretary.refineStack");
      const parsed = s ? JSON.parse(s) : null;
      if (Array.isArray(parsed)) {
        const clean = parsed.filter(id => getGridFor(id));
        if (clean.length) return clean;
      }
    } catch {}
    return ["morning"];
  });
  useEffect(() => { localStorage.setItem("secretary.refineStack", JSON.stringify(refineStack)); }, [refineStack]);

  useEffect(() => {
    if (route.name === "grid" && route.gridId) {
      setRefineStack(s => {
        if (s[s.length - 1] === route.gridId) return s;
        const ix = s.indexOf(route.gridId);
        if (ix >= 0) return s.slice(0, ix + 1);
        return [...s, route.gridId];
      });
    }
  }, [route]);

  const currentGridId = route.name === "grid" ? (route.gridId || "morning") : "morning";
  const currentGrid = getGridFor(currentGridId) || data.grids["morning"];

  // --- Fullscreen cell -------------------------------------------------------
  const [openCellId, setOpenCellId] = useState(null);
  const openCell = openCellId ? { ...currentGrid.cells[openCellId], _id: openCellId } : null;

  // Pre-warmed refine grids: keyed by `${gridId}:${cellId}`.
  // value: { state: 'loading'|'ready'|'error', grid?, error?, promise? }
  const prewarmRef = useRef({});
  const [prewarmTick, setPrewarmTick] = useState(0);    // bump to trigger re-render
  const prewarmKey = openCellId ? `${currentGridId}:${openCellId}` : null;
  const currentPrewarm = prewarmKey ? prewarmRef.current[prewarmKey] : null;

  // Pre-warmed COMMIT DRAFTS — the actual outbound message. Same keyed shape.
  // value: { state, draft?, error?, promise? }  where draft = { channel, to, subject, body, why_channel, voice_check }
  const draftPrewarmRef = useRef({});
  const currentDraftPrewarm = prewarmKey ? draftPrewarmRef.current[prewarmKey] : null;

  // --- Gesture log -----------------------------------------------------------
  const [gestureLog, setGestureLog] = useState([]);
  const [gestureCount, setGestureCount] = useState(342);
  const pushGesture = useCallback((entry) => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}:${String(now.getSeconds()).padStart(2,"0")}`;
    setGestureLog(log => [...log, { time, ...entry }]);
    setGestureCount(n => n + 1);
    // Stream to disk via SecretaryLedger — gestures are the main temporal
    // signal, so they all go to _ledger/activity.jsonl automatically.
    if (window.SecretaryLedger) {
      window.SecretaryLedger.log("gesture", { ...entry });
    }
  }, []);

  // --- State signature -------------------------------------------------------
  const stateSig = useMemo(() => {
    const base = {
      mode: "proposals", domain: "personal", comparator: "north_star_weighted",
      tod: "morning", dow: "tue", recent: currentGrid._aiGenerated ? "ai_regenerated" : "open_cold",
      cluster: "morning", signature: currentGrid._aiGenerated ? "ai_" + currentGridId : "morning",
    };
    const g = currentGrid;
    if (g.id === "morning")        return { ...base, mode: "proposals", domain: "personal",      comparator: "north_star_weighted", cluster: "morning",        signature: "morning" };
    if (g.id === "deep_work")      return { ...base, mode: "briefing",  domain: "creator",       comparator: "hook_strength",       cluster: "deep_work",      signature: "deep_work" };
    if (g.id === "correspondence") return { ...base, mode: "drafts",    domain: "threads",       comparator: "relationship_weight", cluster: "correspondence", signature: "correspondence" };
    return base;
  }, [currentGrid, currentGridId]);

  const baseThresh = tweaks.predLevel === "hi" ? 0.94 : tweaks.predLevel === "mid" ? 0.80 : 0.60;
  const predAcc = useMemo(() => {
    const cl = data.clusters.find(c => c.id === stateSig.cluster);
    return cl ? (cl.predAcc + baseThresh) / 2 : baseThresh;
  }, [stateSig.cluster, baseThresh, data.clusters]);
  const autoCommitArmed = tweaks.autoCommit && predAcc >= baseThresh;

  // --- AI ctx builder --------------------------------------------------------
  const buildCtx = useCallback(() => ({
    briefing: data.briefing,
    currentGrid: { id: currentGrid.id, title: currentGrid.title, context: currentGrid.context, frameType: currentGrid.frameType },
    stateSignature: stateSig.signature,
  }), [data.briefing, currentGrid, stateSig.signature]);

  // --- Pre-warm refine for a cell --------------------------------------------
  const startPrewarm = useCallback((gridId, cellId, cell, grid) => {
    const key = `${gridId}:${cellId}`;
    const existing = prewarmRef.current[key];
    if (existing && (existing.state === "loading" || existing.state === "ready")) return existing;
    // Only pre-warm when no explicit refine target and AI is available.
    if (cell.refine) return null;
    if (!aiConfigured) return null;
    const entry = { state: "loading" };
    prewarmRef.current[key] = entry;
    setPrewarmTick(t => t + 1);
    entry.promise = window.SecretaryActions.refineCell({
      cell: { ...cell, _id: cellId },
      grid,
      ctx: buildCtx(),
    }).then(newGrid => {
      prewarmRef.current[key] = { state: "ready", grid: newGrid };
      setPrewarmTick(t => t + 1);
      return newGrid;
    }).catch(err => {
      prewarmRef.current[key] = { state: "error", error: err.message || String(err) };
      setPrewarmTick(t => t + 1);
      throw err;
    });
    return prewarmRef.current[key];
  }, [aiConfigured, buildCtx]);

  // --- Pre-warm the actual OUTBOUND DRAFT for a cell -------------------------
  // Fires at cell-open so by the time user clicks Commit, the real message is ready.
  // Only fires for cells that would produce outbound content (send/schedule kinds, or open/done if you'd ever want a personal note).
  const startDraftPrewarm = useCallback((gridId, cellId, cell, grid) => {
    const key = `${gridId}:${cellId}`;
    const existing = draftPrewarmRef.current[key];
    if (existing && (existing.state === "loading" || existing.state === "ready")) return existing;
    if (!aiConfigured) return null;
    const entry = { state: "loading" };
    draftPrewarmRef.current[key] = entry;
    setPrewarmTick(t => t + 1);
    entry.promise = window.SecretaryActions.draftCommitment({
      cell: { ...cell, _id: cellId },
      grid,
      ctx: buildCtx(),
    }).then(draft => {
      draftPrewarmRef.current[key] = { state: "ready", draft };
      setPrewarmTick(t => t + 1);
      return draft;
    }).catch(err => {
      draftPrewarmRef.current[key] = { state: "error", error: err.message || String(err) };
      setPrewarmTick(t => t + 1);
      throw err;
    });
    return draftPrewarmRef.current[key];
  }, [aiConfigured, buildCtx]);

  // --- Regenerate a commitment's draft (called from the Commitments page) ----
  const regenerateCommitmentDraft = useCallback(async (commitmentId) => {
    const c = commitments.find(x => x.id === commitmentId);
    if (!c) return;
    const srcGrid = c.source && getGridFor(c.source.gridId);
    const srcCell = srcGrid && srcGrid.cells && srcGrid.cells[c.source.cellId];
    if (!srcGrid || !srcCell) {
      setAiError("Can't regenerate — source grid/cell no longer available");
      return;
    }
    if (!aiConfigured) {
      setAiError("No API key set — add one in Settings → Intelligence");
      return;
    }
    updateCommitment(commitmentId, { drafting: true });
    try {
      const draft = await window.SecretaryActions.draftCommitment({
        cell: { ...srcCell, _id: c.source.cellId },
        grid: srcGrid,
        ctx: buildCtx(),
      });
      updateCommitment(commitmentId, {
        drafting: false,
        subject: draft.subject || c.subject,
        body: draft.body,
        target: draft.to || c.target,
        channel: draft.channel,
        voice_check: draft.voice_check,
        why_channel: draft.why_channel,
      });
      setAiNote(`Re-drafted via ${draft.channel}`);
      setTimeout(() => setAiNote(null), 2500);
    } catch (e) {
      updateCommitment(commitmentId, { drafting: false, draftError: e.message || String(e) });
      setAiError("Re-draft failed: " + (e.message || e));
    }
  }, [commitments, getGridFor, aiConfigured, buildCtx, updateCommitment]);

  // --- Handlers --------------------------------------------------------------
  const onCellOpen = (cellId) => {
    setOpenCellId(cellId);
    const c = currentGrid.cells[cellId];
    pushGesture({ type: "open", target: cellId, detail: c.headline });
    window.SecretaryMemory && window.SecretaryMemory.log.open({
      cluster: stateSig.cluster, signature: stateSig.signature,
      gridId: currentGridId, cellId, detail: c.headline, predicted: !!c.predicted,
    });
    // Fire both pre-warms in the background — user may click Refine, Commit, or neither.
    startPrewarm(currentGridId, cellId, c, currentGrid);
    startDraftPrewarm(currentGridId, cellId, c, currentGrid);
  };
  const onCloseFullscreen = () => setOpenCellId(null);

  // Commit: queue the commitment with the ACTUAL AI-drafted message as the body.
  //   1. If the draft pre-warm is ready → use it instantly.
  //   2. If it's in-flight → queue a placeholder now, fill in body when the draft resolves.
  //   3. If no draft was warmed (AI not configured, or error) → fall back to the cell's detail (current lazy behavior).
  const onCommit = () => {
    const c = openCell;
    if (!c) return;
    const source = {
      gridId: currentGridId,
      cellId: c._id,
      headline: c.headline,
      preview: c.preview,
      detail: c.detail,
      // Provenance for the affinity learner: which seed fed this cell?
      // Written by Phase 1 of grid generation (grid_scorer.js).
      ...(c.seed ? {
        seed_source_type: c.seed.source_type,
        seed_source_id:   c.seed.source_id,
        seed_score:       c.seed.score,
      } : {}),
    };
    const key = `${currentGridId}:${c._id}`;
    const warm = draftPrewarmRef.current[key];

    // Shape the commitment entry to accept an AI draft.
    const applyDraft = (entry, draft) => ({
      ...entry,
      subject: draft.subject || c.headline,
      body: draft.body,
      target: draft.to || entry.target,
      channel: draft.channel,
      voice_check: draft.voice_check,
      why_channel: draft.why_channel,
      drafting: false,
    });

    let entry;
    if (warm && warm.state === "ready" && warm.draft) {
      // AI draft ready — use it directly.
      entry = addCommitment(source, c);
      updateCommitment(entry.id, applyDraft({}, warm.draft));
      setAiNote(`Queued with AI-drafted ${warm.draft.channel}: ${c.headline}`);
    } else if (warm && warm.state === "loading" && warm.promise) {
      // In-flight — queue with placeholder body; update when it resolves.
      entry = addCommitment(source, {
        ...c,
        detail: "(drafting…)",
      });
      updateCommitment(entry.id, { drafting: true });
      warm.promise
        .then(draft => updateCommitment(entry.id, applyDraft({}, draft)))
        .catch(err => updateCommitment(entry.id, {
          drafting: false,
          draftError: err.message || String(err),
        }));
      setAiNote(`Queued: ${c.headline} — AI is drafting the message…`);
    } else {
      // No AI or draft errored — fall back to cell detail. (The old behavior.)
      entry = addCommitment(source, c);
      if (aiConfigured && !warm) {
        // Kick off a draft anyway so the user can at least regenerate-on-view.
        updateCommitment(entry.id, { drafting: true });
        window.SecretaryActions.draftCommitment({
          cell: c, grid: currentGrid, ctx: buildCtx(),
        })
          .then(draft => updateCommitment(entry.id, applyDraft({}, draft)))
          .catch(err => updateCommitment(entry.id, {
            drafting: false,
            draftError: err.message || String(err),
          }));
      }
      setAiNote(`Queued: ${c.headline} — review on Commitments before sending`);
    }

    pushGesture({ type: "commit", target: c._id, detail: c.headline + " → queued for review" });
    window.SecretaryMemory && window.SecretaryMemory.log.commit({
      cluster: stateSig.cluster, signature: stateSig.signature,
      gridId: currentGridId, cellId: c._id, detail: c.headline, predicted: !!c.predicted,
    });
    // Refresh affinity so next generation learns from this commit.
    if (window.SecretaryScorer) {
      window.SecretaryScorer.refreshAffinityFromLedger().catch(() => {});
    }
    setTimeout(() => setAiNote(null), 3500);
    setOpenCellId(null);
  };

  // Refine:
  //   1. explicit refine → just navigate.
  //   2. pre-warm is ready → instant navigate using cached grid.
  //   3. pre-warm is loading → await the in-flight promise.
  //   4. otherwise → fire a fresh call.
  const onRefine = async () => {
    const c = openCell;
    if (!c) return;
    // 1. explicit target
    if (c.refine && getGridFor(c.refine)) {
      pushGesture({ type: "lean", target: c._id, detail: "refine → " + c.refine });
      window.SecretaryMemory && window.SecretaryMemory.log.lean({
        cluster: stateSig.cluster, signature: stateSig.signature,
        gridId: currentGridId, cellId: c._id, detail: "refine → " + c.refine,
      });
      setOpenCellId(null);
      setRefineStack(s => [...s, c.refine]);
      go.push("grid", { gridId: c.refine });
      return;
    }
    if (!aiConfigured) {
      setAiError("No API key set — add one in Settings → Intelligence to generate a refinement grid.");
      return;
    }
    const key = `${currentGridId}:${c._id}`;
    const warm = prewarmRef.current[key];

    // 2. cached-ready
    if (warm && warm.state === "ready" && warm.grid) {
      setGridOverride(warm.grid.id, warm.grid);
      pushGesture({ type: "lean", target: c._id, detail: "refine → " + warm.grid.id + " · prewarmed" });
      window.SecretaryMemory && window.SecretaryMemory.log.lean({
        cluster: stateSig.cluster, signature: stateSig.signature,
        gridId: currentGridId, cellId: c._id, detail: "refine → " + warm.grid.id + " · prewarmed",
      });
      setOpenCellId(null);
      setRefineStack(s => [...s, warm.grid.id]);
      go.push("grid", { gridId: warm.grid.id });
      setAiNote(`Refinement grid (pre-warmed)`);
      setTimeout(() => setAiNote(null), 1500);
      return;
    }

    // 3. in-flight → await it
    setAiBusy(true); setAiError(null);
    try {
      let newGrid;
      if (warm && warm.state === "loading" && warm.promise) {
        newGrid = await warm.promise;
      } else {
        // 4. fresh call
        newGrid = await window.SecretaryActions.refineCell({
          cell: c, grid: currentGrid, ctx: buildCtx(),
        });
        prewarmRef.current[key] = { state: "ready", grid: newGrid };
      }
      setGridOverride(newGrid.id, newGrid);
      pushGesture({ type: "lean", target: c._id, detail: "refine → " + newGrid.id + " · ai" });
      window.SecretaryMemory && window.SecretaryMemory.log.lean({
        cluster: stateSig.cluster, signature: stateSig.signature,
        gridId: currentGridId, cellId: c._id, detail: "refine → " + newGrid.id + " · ai",
      });
      setOpenCellId(null);
      setRefineStack(s => [...s, newGrid.id]);
      go.push("grid", { gridId: newGrid.id });
      setAiNote(`Refinement grid generated (${newGrid.id})`);
      setTimeout(() => setAiNote(null), 2500);
    } catch (e) {
      setAiError("Refine failed: " + (e.message || e));
    } finally { setAiBusy(false); }
  };

  const onSweep = async () => {
    pushGesture({ type: "sweep", target: "X", detail: "regenerate · " + currentGrid.id });
    window.SecretaryMemory && window.SecretaryMemory.log.sweep({
      cluster: stateSig.cluster, signature: stateSig.signature, gridId: currentGridId,
    });
    if (!aiConfigured) {
      setAiError("No API key set — sweep requires the OpenAI key (Settings → Intelligence).");
      return;
    }
    setAiBusy(true); setAiError(null);
    try {
      const newGrid = await window.SecretaryActions.regenerateFromSweep({
        grid: currentGrid, ctx: buildCtx(),
      });
      setGridOverride(currentGridId, { ...newGrid, id: currentGridId });
      setAiNote(`Swept — 6 fresh candidates for "${newGrid.title}"`);
      setTimeout(() => setAiNote(null), 2500);
    } catch (e) {
      setAiError("Sweep failed: " + (e.message || e));
    } finally { setAiBusy(false); }
  };

  const onFrameReject = async (text) => {
    // Figure out the dominant seed type in the rejected grid so the affinity
    // learner can damp that type. "You asked the wrong question about X" is
    // training signal on the selection process, not just the wording.
    const typeCounts = Object.create(null);
    for (const id of Object.keys(currentGrid.cells || {})) {
      const seed = currentGrid.cells[id] && currentGrid.cells[id].seed;
      if (seed && seed.source_type) {
        typeCounts[seed.source_type] = (typeCounts[seed.source_type] || 0) + 1;
      }
    }
    let dominant_seed_type = null;
    let best = 0;
    for (const k of Object.keys(typeCounts)) {
      if (typeCounts[k] > best) { best = typeCounts[k]; dominant_seed_type = k; }
    }
    pushGesture({ type: "frame_reject", target: "USER", detail: text });
    if (window.SecretaryLedger) {
      window.SecretaryLedger.log("frame_reject", {
        gridId: currentGridId, rejected_title: currentGrid.title,
        user_text: text,
        source: { dominant_seed_type, type_counts: typeCounts },
      });
    }
    window.SecretaryMemory && window.SecretaryMemory.log.frameReject({
      cluster: stateSig.cluster, signature: stateSig.signature, gridId: currentGridId,
      rejected: currentGrid.frameNote || currentGrid.frameType || "(previous frame)",
      text,
      weight: "high",
    });
    // Refresh affinity so the next generation reflects the reframe.
    if (window.SecretaryScorer) {
      window.SecretaryScorer.refreshAffinityFromLedger().catch(() => {});
    }
    if (!aiConfigured) {
      setAiError("No API key set — frame-reject requires the OpenAI key (Settings → Intelligence).");
      return;
    }
    setAiBusy(true); setAiError(null);
    try {
      const newGrid = await window.SecretaryActions.regenerateFromFrameReject({
        grid: currentGrid, userText: text, ctx: buildCtx(),
      });
      setGridOverride(currentGridId, { ...newGrid, id: currentGridId });
      setAiNote(`Reframed — new question: "${newGrid.title}"`);
      setTimeout(() => setAiNote(null), 2500);
    } catch (e) {
      setAiError("Frame-reject failed: " + (e.message || e));
    } finally { setAiBusy(false); }
  };

  // "Generate from Mission Control" — fresh grid rooted in MC data.
  const onGenerateFromMC = async (userGuardrail) => {
    if (!aiConfigured) {
      setAiError("No API key set — add one in Settings → Intelligence.");
      return;
    }
    if (!window.MissionControl) {
      setAiError("Mission Control data not loaded.");
      return;
    }
    setAiBusy(true); setAiError(null);
    try {
      // Phase 1 (the scorer) has already done the heavy lifting — just tell
      // Rodbot what the grid is FOR right now so her title lands.
      const guardrail = (userGuardrail || "").trim();
      const intentParts = [];
      if (guardrail) {
        // the team's guardrail is the lens. Put it first so Rodbot weighs seeds
        // against it when expanding, retitles accordingly, and drops seeds
        // that flatly don't fit.
        intentParts.push(
          `JAKE'S GUARDRAIL FOR THIS GRID: "${guardrail}"`,
          `Read that as the lens. Expand the seeds through it. If a seed ` +
          `genuinely doesn't fit the lens, you may substitute or demote it. ` +
          `The grid TITLE should reflect what the team asked for — quote or ` +
          `paraphrase his guardrail; don't write a generic title.`
        );
      }
      intentParts.push(
        `Produce the ${stateSig.cluster || "morning"} grid for the team. You've got ` +
        `6 pre-scored seeds from Phase 1 below. Expand them into 6 concrete moves` +
        (guardrail
          ? `, filtered through the guardrail above.`
          : `, and let the grid TITLE reflect what these specific seeds are ` +
            `collectively asking — don't fall back to a generic "what moves ` +
            `the team forward today?" framing.`)
      );
      const intent = intentParts.join("\n\n");
      const newGrid = await window.SecretaryActions.generateGrid({
        gridId: currentGridId,
        intent,
        seedGrid: currentGrid,
        ctx: buildCtx(),
      });
      setGridOverride(currentGridId, { ...newGrid, id: currentGridId });
      setAiNote(`Generated from Mission Control · ${window.MissionControl.counts.leads} leads considered`);
      setTimeout(() => setAiNote(null), 3000);
      pushGesture({ type: "generate", target: "MC", detail: newGrid.title });
      window.SecretaryMemory && window.SecretaryMemory.log.generate({
        cluster: stateSig.cluster, signature: stateSig.signature, gridId: currentGridId,
        detail: newGrid.title,
      });
    } catch (e) {
      setAiError("Generate failed: " + (e.message || e));
    } finally { setAiBusy(false); }
  };

  // Back-one-generation: pop the most recent AI regen and restore the grid
  // to whatever was beneath it (could be another regen, or the seed).
  const onBackOneGeneration = () => {
    const popped = popGridVersion(currentGridId);
    if (popped) {
      setAiNote("Back one generation");
      setTimeout(() => setAiNote(null), 1500);
      window.SecretaryLedger && window.SecretaryLedger.log("grid_back", { gridId: currentGridId });
    } else {
      setAiNote("Nothing to undo — already at the earliest version.");
      setTimeout(() => setAiNote(null), 2000);
    }
  };
  const historyDepth = (gridHistory[currentGridId] || []).length; // number of AI regens stacked (0 = none yet)

  const onStackJump = (i) => {
    const targetId = refineStack[i];
    setRefineStack(s => s.slice(0, i + 1));
    go.replace("grid", { gridId: targetId });
  };

  const onHome = () => {
    setRefineStack(["morning"]);
    setOpenCellId(null);
    go.home();
  };

  // --- Render ----------------------------------------------------------------
  let screen = null;
  if (route.name === "grid") {
    const isOverride = !!gridOverrides[currentGridId];
    screen = (
      <div style={aiBusy ? { opacity: 0.78, pointerEvents: "none", transition: "opacity 180ms" } : undefined}>
        <FrontPage
          grid={currentGrid}
          go={go}
          onCellOpen={onCellOpen}
          onSweep={onSweep}
          onFrameReject={onFrameReject}
          aiBusy={aiBusy}
          canGenerate={aiConfigured && mcStatus && mcStatus.state === "ok"}
          aiConfigured={aiConfigured}
          historyDepth={historyDepth}
          onGenerate={onGenerateFromMC}
          onBack={onBackOneGeneration}
          onOpenSettings={() => go.push("settings")}
          onEditWithRodbot={(cell, gridId) => {
            setRodbotEdit({ cell: { id: cell.id, headline: cell.headline, preview: cell.preview, detail: cell.detail, kind: cell.kind, predicted: cell.predicted }, gridId });
            pushGesture({ type: "edit", target: cell.id, detail: cell.headline + " → rodbot overlay" });
            window.SecretaryMemory && window.SecretaryMemory.log.edit({
              cluster: gridId, signature: `cell_edit · ${gridId}`, gridId, cellId: cell.id, detail: cell.headline,
            });
          }}
        />
      </div>
    );
  } else if (route.name === "settings") {
    screen = <SettingsScreen tweaks={tweaks} setTweaks={setTweaks} go={go} onReset={() => { setGestureLog([]); setRefineStack(["morning"]); setGridOverrides({}); setHistory([{name:"grid", gridId:"morning"}]); }} />;
  } else if (route.name === "memory") {
    screen = <MemoryScreen data={data} go={go} />;
  } else if (route.name === "prediction") {
    screen = <PredictionScreen data={data} tweaks={tweaks} go={go} />;
  } else if (route.name === "inbox") {
    screen = <InboxScreen go={go} />;
  } else if (route.name === "contacts") {
    screen = <ContactsScreen go={go} />;
  } else if (route.name === "briefing") {
    screen = <DailyBriefingScreen go={go} />;
  } else if (route.name === "delegations") {
    screen = <DelegationsScreen go={go} />;
  } else if (route.name === "chat") {
    // /chat has been absorbed into the persistent rail on the home route.
    // Any remaining deep-link to /chat redirects back to the grid.
    setTimeout(() => setHistory([{ name: "grid", gridId: "morning" }]), 0);
    screen = null;
  } else if (route.name === "calendar") {
    screen = <CalendarScreen go={go} />;
  } else if (route.name === "Rodbot") {
    screen = <RodbotScreen go={go} />;
  } else if (route.name === "activity") {
    screen = <PiecesActivityScreen go={go} />;
  } else if (route.name === "analytics") {
    screen = <AnalyticsScreen go={go} />;
  } else if (route.name === "automation") {
    screen = <AutomationGraphScreen go={go} />;
  } else if (route.name === "projects") {
    screen = <ProjectsScreen go={go} />;
  } else if (route.name === "tables") {
    screen = <TablesScreen go={go} />;
  } else if (route.name === "table_new") {
    screen = <TableCreateScreen go={go} template={route.template} seedSlug={route.seedSlug} />;
  } else if (route.name === "table_detail") {
    screen = <TableDetailScreen go={go} slug={route.slug} />;
  } else if (route.name === "intake") {
    screen = <IntakeScreen go={go} onAddCommitment={addCommitment} />;
  } else if (route.name === "commitments") {
    screen = (
      <CommitmentsScreen
        commitments={commitments}
        demoMode={tweaks.demoMode}
        onUpdate={updateCommitment}
        onRemove={removeCommitment}
        onSend={sendCommitment}
        onSendAll={sendAllPending}
        onCancel={cancelCommitment}
        onRegenerate={regenerateCommitmentDraft}
        go={go}
      />
    );
  } else if (route.name === "commitment_detail") {
    screen = (
      <CommitmentDetailScreen
        go={go}
        commitmentId={route.commitmentId}
        commitments={commitments}
        demoMode={tweaks.demoMode}
        onUpdate={updateCommitment}
        onRemove={removeCommitment}
        onSend={sendCommitment}
        onCancel={cancelCommitment}
        onRegenerate={regenerateCommitmentDraft}
      />
    );
  } else if (route.name === "inbox_detail") {
    screen = <InboxDetailScreen go={go} entryId={route.entryId} />;
  } else {
    screen = null;
    setTimeout(() => setHistory([{ name: "grid", gridId: "morning" }]), 0);
  }

  return (
    <div className="app">
      <Topbar
        route={route}
        history={history}
        go={go}
        stateSig={stateSig}
        mcStatus={mcStatus}
        aiConfigured={aiConfigured}
        aiBusy={aiBusy}
        pendingCount={pendingCount}
        inboxOpenCount={inboxOpenCount}
        onOpenSettings={() => go.push("settings")}
        onOpenMemory={() => go.push("memory")}
        onOpenPrediction={() => go.push("prediction")}
        onOpenCommitments={() => go.push("commitments")}
        onOpenInbox={() => go.push("inbox")}
        onOpenContacts={() => go.push("contacts")}
        onOpenBriefing={() => go.push("briefing")}
        onOpenDelegations={() => go.push("delegations")}
        onOpenChat={() => go.home()}
        onOpenCalendar={() => { refreshStreak(); go.push("calendar"); }}
        streakDays={streakDays}
        onOpenRodbot={() => go.push("Rodbot")}
        onOpenActivity={() => go.push("activity")}
        onOpenAnalytics={() => go.push("analytics")}
        onOpenAutomation={() => go.push("automation")}
        onOpenTables={() => go.push("tables")}
        onOpenIntake={() => go.push("intake")}
        rodbotState={rodbotState}
        onOpenProjects={() => { refreshOpenTasks(); go.push("projects"); }}
        openTasksCount={openTasksCount}
        delegationRunningCount={delegationRunningCount}
        onHome={onHome}
      />
      <main className="main" data-screen-label={route.name + (route.gridId ? "·" + route.gridId : "")}>{screen}</main>
      <BottomStrip history={history} go={go} stateSig={stateSig} onHome={onHome} />
      {openCell && (
        <FullscreenCell
          cell={openCell}
          grid={currentGrid}
          onCommit={onCommit}
          onRefine={onRefine}
          onClose={onCloseFullscreen}
          aiBusy={aiBusy}
          prewarm={currentPrewarm}
        />
      )}
      {tweaksOpen && <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} onClose={() => setTweaksOpen(false)} />}
      {rodbotEdit && (
        <EditWithRodbotOverlay
          cell={rodbotEdit.cell}
          gridId={rodbotEdit.gridId}
          onClose={() => setRodbotEdit(null)}
          onRewriteApplied={(newHeadline) => {
            // The rewrite replaces the cell's headline in the current grid.
            const gid = rodbotEdit.gridId;
            const cid = rodbotEdit.cell.id;
            const grid = getGridFor(gid) || data.grids[gid];
            if (!grid || !grid.cells || !grid.cells[cid]) return;
            const updated = { ...grid, cells: { ...grid.cells, [cid]: { ...grid.cells[cid], headline: newHeadline } } };
            setGridOverride(gid, updated);
          }}
          onRetire={() => {
            // Fire the same /api/cells/retire endpoint the context menu uses.
            const { cell, gridId } = rodbotEdit;
            fetch("/api/cells/retire", {
              method: "POST", headers: {"Content-Type":"application/json"},
              body: JSON.stringify({ gridId, cellId: cell.id, headline: cell.headline, preview: cell.preview || "" }),
            }).catch(() => {});
          }}
        />
      )}
      {(aiError || aiNote || aiBusy) && (
        <AIBanner error={aiError} note={aiNote} busy={aiBusy} onDismiss={() => setAiError(null)} />
      )}
    </div>
  );
}

// ---- Small presentational pieces (defined here; styled via inline for now) ---

function AIActionBar({ mcStatus, aiConfigured, aiBusy, isOverride, demoMode, historyDepth, onGenerateFromMC, onBackOneGeneration, onOpenSettings }) {
  const mcOk = mcStatus && mcStatus.state === "ok" && mcStatus.data;
  const mcLeads = mcOk ? (mcStatus.data.counts && mcStatus.data.counts.leads) : 0;
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10, flexWrap:"wrap",
      padding:"10px 18px", borderBottom:"1px solid var(--rule)",
      background:"var(--paper)", fontSize:12, color:"var(--ink-3)",
    }}>
      <span style={{display:"flex", alignItems:"center", gap:6}}>
        <span style={{
          width:8, height:8, borderRadius:"50%",
          background: mcOk ? "#3a9a58" : mcStatus && mcStatus.state === "loading" ? "#c9a227" : "#b05656",
        }}/>
        <span><b>mission control</b> ·{" "}
          {mcOk
            ? `${mcStatus.data.owner} · ${mcLeads} leads · ${mcStatus.data.counts.closeReferenceRows} close rows`
            : mcStatus && mcStatus.state === "loading" ? "loading…"
            : `error · ${(mcStatus && mcStatus.error) || "not loaded"}`}
        </span>
      </span>
      <span style={{color:"var(--ink-4)"}}>·</span>
      <span style={{display:"flex", alignItems:"center", gap:6}}>
        <span style={{
          width:8, height:8, borderRadius:"50%",
          background: aiConfigured ? "#3a9a58" : "#b05656",
        }}/>
        <span>
          <b>ai</b> · {aiConfigured
            ? (window.SecretaryAI && window.SecretaryAI.getProvider && window.SecretaryAI.getProvider() === "claude_code"
                ? "Claude Code"
                : "OpenAI")
            : "not configured"}
        </span>
      </span>
      {demoMode && (
        <React.Fragment>
          <span style={{color:"var(--ink-4)"}}>·</span>
          <span style={{display:"flex", alignItems:"center", gap:6, padding:"2px 8px", borderRadius:4, background:"color-mix(in oklab, #c9a227 18%, var(--paper))", color:"#8a6a00", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em", fontSize:10.5}}>
            <span>DEMO</span>
            <span style={{opacity:0.7, fontWeight:500, textTransform:"none", letterSpacing:0}}>writes blocked</span>
          </span>
        </React.Fragment>
      )}
      <div style={{flex:1}} />
      {historyDepth > 1 && (
        <button className="btn ghost" onClick={onBackOneGeneration} disabled={aiBusy} title={`${historyDepth} versions stacked`} style={{fontSize:11}}>
          ← back one generation
        </button>
      )}
      {aiConfigured && mcOk ? (
        <button className="btn" onClick={onGenerateFromMC} disabled={aiBusy} style={{fontSize:11}}>
          {aiBusy ? "thinking…" : "Generate from Mission Control"}
        </button>
      ) : (
        <button className="btn ghost" onClick={onOpenSettings} style={{fontSize:11}}>
          {!aiConfigured ? "add API key" : "settings"}
        </button>
      )}
    </div>
  );
}

function AIBanner({ error, note, busy, onDismiss }) {
  if (!error && !note && !busy) return null;
  const text = error || note || "AI working…";
  const kind = error ? "err" : note ? "ok" : "busy";
  const bg = kind === "err" ? "#b05656" : kind === "ok" ? "#3a9a58" : "#4a6ea9";
  return (
    <div style={{
      position:"fixed", left:"50%", transform:"translateX(-50%)", bottom:52,
      background:bg, color:"white", padding:"8px 14px", borderRadius:6,
      fontSize:12, fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontVariantNumeric: "tabular-nums",
      boxShadow:"0 4px 16px rgba(0,0,0,0.18)", zIndex:200,
      display:"flex", alignItems:"center", gap:10, maxWidth:720,
    }}>
      <span style={{opacity:0.85}}>{kind === "err" ? "✕" : kind === "ok" ? "✓" : "…"}</span>
      <span>{text}</span>
      {error && <button onClick={onDismiss} style={{background:"transparent", border:"1px solid rgba(255,255,255,0.35)", color:"white", padding:"2px 8px", borderRadius:4, cursor:"pointer", fontSize:11}}>dismiss</button>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

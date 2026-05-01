/* Comeketo Agent — app shell: router, state, dispatch (AI-wired) */

function App() {
  const data = window.SECRETARY_DATA;

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "light",
    "demoMode": true,
    "piecesModel": "claude-sonnet-4-5",
    "promptEnhance": false
  }/*EDITMODE-END*/;

  const [tweaks, setTweaks] = useState(() => {
    try {
      const s = localStorage.getItem("secretary.tweaks");
      return s ? { ...TWEAK_DEFAULTS, ...JSON.parse(s) } : TWEAK_DEFAULTS;
    } catch { return TWEAK_DEFAULTS; }
  });
  useEffect(() => { localStorage.setItem("secretary.tweaks", JSON.stringify(tweaks)); }, [tweaks]);

  const [tweaksOpen, setTweaksOpen] = useState(false);
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
  }, [tweaks.theme]);

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

  const aiConfigured = !!(window.SecretaryAI && window.SecretaryAI.isConfigured());

  // --- Routing ---------------------------------------------------------------
  const KNOWN_SCREENS = ["grid", "settings", "leads", "clients", "coworkers", "contacts", "venues", "briefing", "automation", "activity", "intake", "analytics", "delegations", "boxes", "box_graph"];

  // Web-mode capability gating (2026-04-30 — interim, against PROB-2026-04-30-001).
  // When the AI provider is OpenAI we treat the app as if it were running in
  // hosted web mode where Pieces is unavailable. The three Pieces-dependent
  // surfaces hide entirely: the `briefing` route, the `activity` route, and
  // the LivePiecesHeader ticker on the `grid` home page. The Topbar links to
  // those routes hide too so they cannot be deep-linked into. If the user is
  // already on a hidden route when they flip to OpenAI, the redirect effect
  // below pushes them home so they don't land on a broken page. This is the
  // simplest possible interim gate — a real mode/profile system per
  // PROB-001 will eventually replace this proxy.
  const WEB_MODE_HIDDEN_ROUTES = ["briefing", "activity"];
  const webMode = (tweaks && tweaks.aiProvider) === "openai";
  useEffect(() => {
    if (webMode && WEB_MODE_HIDDEN_ROUTES.includes(route && route.name)) {
      go.home();
    }
  }, [webMode, route && route.name]);
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

  // --- Handlers --------------------------------------------------------------
  const onCellOpen = (cellId) => {
    setOpenCellId(cellId);
    const c = currentGrid.cells[cellId];
    // Pre-warm a refine grid in the background — user may click Refine or close.
    startPrewarm(currentGridId, cellId, c, currentGrid);
  };
  const onCloseFullscreen = () => setOpenCellId(null);

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
          webMode={webMode}
        />
      </div>
    );
  } else if (route.name === "settings") {
    screen = <SettingsScreen tweaks={tweaks} setTweaks={setTweaks} go={go} onReset={() => { setRefineStack(["morning"]); setGridOverrides({}); setHistory([{name:"grid", gridId:"morning"}]); }} />;
  } else if (route.name === "leads") {
    screen = <PeopleScreen go={go} kind="lead" />;
  } else if (route.name === "clients") {
    screen = <PeopleScreen go={go} kind="client" />;
  } else if (route.name === "coworkers") {
    screen = <PeopleScreen go={go} kind="coworker" />;
  } else if (route.name === "contacts") {
    screen = <PeopleScreen go={go} kind="contact" />;
  } else if (route.name === "venues") {
    screen = <VenuesScreen go={go} />;
  } else if (route.name === "briefing") {
    screen = <DailyBriefingScreen go={go} />;
  } else if (route.name === "activity") {
    screen = <PiecesActivityScreen go={go} />;
  } else if (route.name === "automation") {
    screen = <AutomationShell go={go} tab={route.tab || "workflows"} loadSlug={route.load} />;
  } else if (route.name === "intake") {
    screen = <IntakeScreen go={go} openSlug={route.openSlug} />;
  } else if (route.name === "analytics") {
    screen = <AnalyticsScreen go={go} />;
  } else if (route.name === "delegations") {
    screen = <DelegationsScreen go={go} />;
  } else if (route.name === "boxes") {
    screen = <BoxesScreen go={go} selectId={route.selectId} />;
  } else if (route.name === "box_graph") {
    screen = <BoxGraphScreen go={go} />;
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
        webMode={webMode}
        onOpenSettings={() => go.push("settings")}
        onOpenLeads={() => go.push("leads")}
        onOpenClients={() => go.push("clients")}
        onOpenCoworkers={() => go.push("coworkers")}
        onOpenContacts={() => go.push("contacts")}
        onOpenVenues={() => go.push("venues")}
        onOpenBriefing={() => go.push("briefing")}
        onOpenActivity={() => go.push("activity")}
        onOpenAutomation={() => go.push("automation")}
        onOpenIntake={() => go.push("intake")}
        onOpenAnalytics={() => go.push("analytics")}
        onOpenDelegations={() => go.push("delegations")}
        onOpenBoxes={() => go.push("boxes")}
        onOpenBoxGraph={() => go.push("box_graph")}
        onHome={onHome}
      />
      <main className="main" data-screen-label={route.name + (route.gridId ? "·" + route.gridId : "")}>{screen}</main>
      <BottomStrip history={history} go={go} stateSig={stateSig} onHome={onHome} />
      {openCell && (
        <FullscreenCell
          cell={openCell}
          grid={currentGrid}
          onRefine={onRefine}
          onClose={onCloseFullscreen}
          aiBusy={aiBusy}
          prewarm={currentPrewarm}
        />
      )}
      {tweaksOpen && <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} onClose={() => setTweaksOpen(false)} />}
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
            ? (() => {
                const p = window.SecretaryAI && window.SecretaryAI.getProvider && window.SecretaryAI.getProvider();
                if (p === "claude_code") return "Claude Code";
                if (p === "codex_cli") return "Codex CLI";
                return "OpenAI";
              })()
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

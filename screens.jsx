/* Comeketo Agent — screens: Briefing, Draft, Schedule, Settings, People, Activity, Intake */

// i18n stub — i18n.js was retired (Apr 2026 trim). Any straggler `t("key")`
// calls echo the key back as a literal string so nothing crashes.
function t(k) { return String(k == null ? "" : k); }

function BriefingScreen({ data, go }) {
  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">briefing · {data.briefing.date} · {data.briefing.time}</div>
          <h1>Good morning, the team. Here’s what’s on the wire.</h1>
        </div>
        <div className="meta">
          <span><b>mode</b> {data.briefing.mode}</span>
          <span><b>domain</b> {data.briefing.domain}</span>
          <span><b>comparator</b> {data.briefing.comparator}</span>
        </div>
      </div>

      <div className="briefing">
        {data.briefing.sweeps.map((s) => (
          <div className="card" key={s.title}>
            <h3>{s.title}<span className="count">{s.count} items</span></h3>
            <ul>
              {s.items.map((it, i) => (
                <li key={i}>
                  <span className="pri">{it.pri}</span>
                  <span>{it.title}<br/><span className="sub">{it.sub}</span></span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{display:"flex", gap:12, alignItems:"center", marginTop: 26, justifyContent:"space-between"}}>
        <div className="mono dim" style={{fontSize:12, maxWidth:560}}>
          Comeketo Agent has queued one decision for you. Tap below to open the grid — it will present seven
          candidate first-moves plus X (sweep) and user (frame-reject).
        </div>
        <div style={{display:"flex", gap:8}}>
          <button className="btn ghost" onClick={() => go.push("memory")}>Review memory</button>
          <button className="go-grid-btn" onClick={() => go.push("grid", { gridId: "morning" })}>
            Open grid <span className="arr">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function DraftScreen({ draft, go, onSend }) {
  const [body, setBody] = useState(draft.body);
  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">draft · composed at refinement depth 3</div>
          <h1>{draft.subject}</h1>
        </div>
        <div className="meta">
          <span><b>to</b> {draft.to}</span>
          <span><b>voice patterns applied</b> {draft.voice.length}</span>
        </div>
      </div>

      <div className="draft-layout">
        <div>
          <div className="draft-paper">
            <div className="draft-meta">
              <span><b>to</b> {draft.to}</span>
              <span><b>subject</b> {draft.subject}</span>
              <span><b>length</b> {body.split(/\s+/).length} words</span>
            </div>
            <textarea
              className="draft-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              style={{width:"100%", minHeight: 320, border: "none", resize: "vertical", background:"transparent", color:"var(--ink)", fontFamily:"var(--font-display)"}}
            />
            <div className="draft-actions">
              <button className="btn primary" onClick={onSend}>Sign &amp; Send — J</button>
              <button className="btn">Refine further</button>
              <button className="btn ghost" onClick={() => go.back()}>← back to grid</button>
              <button className="btn alarm" style={{marginLeft:"auto"}}>Reject draft · log lesson</button>
            </div>
          </div>
        </div>
        <div>
          <div className="panel">
            <header>
              <h3>Why it sounds like you</h3>
              <span className="hint">voice model · live</span>
            </header>
            <div className="voice">
              {draft.voice.map((v, i) => (
                <div className="pattern" key={i}>
                  <span className="tag">{v.tag}</span>
                  {v.text}
                </div>
              ))}
            </div>
            <div className="hairline" />
            <div className="mono dim" style={{fontSize:10.5, lineHeight:1.5}}>
              Every edit you make above is analyzed for style signal. Patterns weight up on repetition,
              decay on contradiction.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleScreen({ schedule, go, onCommit }) {
  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">schedule · hybrid commit</div>
          <h1>{schedule.title}</h1>
        </div>
        <div className="meta">
          <span><b>blocks</b> {schedule.blocks.length}</span>
          <span><b>frame</b> disjunctive → hybrid</span>
        </div>
      </div>
      <div className="draft-layout">
        <div>
          <div className="draft-paper" style={{padding: 0, overflow:"hidden"}}>
            {schedule.blocks.map((b, i) => (
              <div key={i} style={{
                display:"grid", gridTemplateColumns:"140px 1fr auto", gap:16,
                padding:"18px 22px", borderBottom:"1px solid var(--rule)",
                alignItems:"center",
                background: b.tint === "ember" ? "color-mix(in oklab, var(--ember) 7%, var(--paper))" : "var(--paper)"
              }}>
                <div className="mono" style={{color:"var(--ink-3)", fontSize:12}}>{b.time}</div>
                <div style={{fontSize:15}}>{b.label}</div>
                <div className="mono" style={{fontSize:10.5, color:"var(--ink-4)", textTransform:"uppercase", letterSpacing:"0.06em"}}>
                  {b.tint === "ember" ? "derivative · from grid" : "standing block"}
                </div>
              </div>
            ))}
            <div style={{padding:"18px 22px", display:"flex", gap:8}}>
              <button className="btn primary" onClick={onCommit}>Commit to calendar</button>
              <button className="btn">Adjust blocks</button>
              <button className="btn ghost" onClick={() => go.back()}>← back to grid</button>
            </div>
          </div>
        </div>
        <div>
          <div className="panel">
            <header><h3>Voice · scheduling</h3><span className="hint">learned patterns</span></header>
            <div className="voice">
              {schedule.voice.map((v, i) => (
                <div className="pattern" key={i}>
                  <span className="tag">{v.tag}</span>{v.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



function IntelligencePanel({ tweaks, setTweaks }) {
  const AI = window.SecretaryAI;
  const MODELS = (AI && AI.MODELS) || ["gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano"];
  const currentModel = (AI && AI.getModel ? AI.getModel() : null) || tweaks.openaiModel || "gpt-5.4-mini";

  const [keyInput, setKeyInput] = useState("");
  const [reveal, setReveal] = useState(false);
  const [hasKey, setHasKey] = useState(() => !!(AI && AI.getKey && AI.getKey()));
  const [srvStatus, setSrvStatus] = useState(() => (AI && AI.serverStatus ? AI.serverStatus() : { checked: false }));
  const [testState, setTestState] = useState({ state: "idle", msg: "" });

  useEffect(() => {
    if (!AI || !AI.checkServer) return;
    let mounted = true;
    AI.checkServer(true).then(s => { if (mounted) setSrvStatus({ ...s }); });
    return () => { mounted = false; };
  }, []);

  const selectedProvider = tweaks.aiProvider || (AI && AI.getProvider ? AI.getProvider() : "openai");
  const route = AI && AI.getRoute ? AI.getRoute() : null;
  const maskedHint = route === "openai-server-proxy"
    ? "using server.py proxy · key loaded from .env · no key in browser"
    : hasKey
      ? "using browser key · stored in localStorage only"
      : "no key set · start server.py or paste a key below";

  const saveKey = () => {
    if (!AI) return;
    AI.setKey(keyInput.trim());
    setHasKey(!!keyInput.trim());
    setKeyInput("");
    setTestState({ state: "idle", msg: "" });
  };
  const clearKey = () => {
    if (!AI) return;
    AI.setKey("");
    setHasKey(false);
    setTestState({ state: "idle", msg: "" });
  };
  const persistTweaks = (next) => {
    try { localStorage.setItem("secretary.tweaks", JSON.stringify(next)); } catch {}
    setTweaks(next);
  };
  const pickModel = (m) => persistTweaks({ ...tweaks, openaiModel: m });
  const test = async () => {
    if (!AI) { setTestState({ state: "err", msg: "ai.js not loaded" }); return; }
    const p = selectedProvider;
    const runningMsg = p === "claude_code"
      ? "running claude -p probe..."
      : p === "codex_cli"
        ? "running codex exec probe..."
        : "calling OpenAI Responses API...";
    setTestState({ state: "running", msg: runningMsg });
    const r = await AI.testConnection();
    if (r.ok) setTestState({ state: "ok", msg: `ok · ${r.route} · reply: ${r.text}` });
    else setTestState({ state: "err", msg: r.error });
  };

  // Provider pill selector — exactly one active route receives prompts.
  const currentProvider = selectedProvider;
  const claudeReady = !!(srvStatus && srvStatus.claude_code_available);
  const codexReady = !!(srvStatus && srvStatus.codex_cli_available);
  const cliProvider = currentProvider === "claude_code" || currentProvider === "codex_cli";
  const activeCliLabel = currentProvider === "claude_code" ? "Claude Code" : currentProvider === "codex_cli" ? "Codex CLI" : "OpenAI";
  const activeCliPath = currentProvider === "claude_code" ? srvStatus.claude_code_path : srvStatus.codex_cli_path;
  const activeCliReady = currentProvider === "claude_code" ? claudeReady : currentProvider === "codex_cli" ? codexReady : false;
  const pickProvider = (p) => persistTweaks({ ...tweaks, aiProvider: p });

  return (
    <React.Fragment>
      <div className="opt">
        <div>
          <div className="lbl">AI provider</div>
          <div className="desc">
            Choose the active brain for chat. <b>Claude Code</b> uses local <code>claude -p</code>; <b>Codex CLI</b> uses local <code>codex exec</code>; <b>OpenAI</b> uses the Responses API.
            Only the selected route receives prompts; the other CLI stays idle.
          </div>
        </div>
        <div />
        <div className="ctrl">
          <div className="segmented">
            <button
              className={currentProvider === "claude_code" ? "on" : ""}
              onClick={() => pickProvider("claude_code")}
              disabled={!claudeReady}
              title={claudeReady ? "Local Claude Code — no key needed" : "Claude binary not found on server PATH"}
            ><Icon name="terminal" size={12} style={{marginRight:5}}/>Claude Code{!claudeReady && " (unavailable)"}</button>
            <button
              className={currentProvider === "codex_cli" ? "on" : ""}
              onClick={() => pickProvider("codex_cli")}
              disabled={!codexReady}
              title={codexReady ? "Local Codex CLI — uses the selected GPT model" : "Codex binary not found on server PATH"}
            ><Icon name="sparkles" size={12} style={{marginRight:5}}/>Codex CLI{!codexReady && " (unavailable)"}</button>
            <button
              className={currentProvider === "openai" ? "on" : ""}
              onClick={() => pickProvider("openai")}
            ><Icon name="sparkles" size={12} style={{marginRight:5}}/>OpenAI</button>
          </div>
        </div>
      </div>

      {cliProvider && (
        <div className="opt">
          <div>
            <div className="lbl">{activeCliLabel} binary</div>
            <div className="desc">
              Resolved from server PATH at startup. {currentProvider === "claude_code"
                ? <React.Fragment>Prompts pipe through stdin with <code>--max-turns 1 --output-format text</code>.</React.Fragment>
                : <React.Fragment>Prompts run through <code>codex exec</code> with the selected model and a read-only sandbox.</React.Fragment>}
            </div>
          </div>
          <div style={{fontSize: 11.5, color: activeCliReady ? "var(--pastel-mint-ink)" : "var(--alarm)"}}>
            {activeCliReady ? (activeCliPath || "ready") : "not found"}
          </div>
          <div className="ctrl">
            <button className="btn" onClick={test} disabled={!activeCliReady || testState.state === "running"}>
              {testState.state === "running" ? "testing…" : "Test"}
            </button>
          </div>
        </div>
      )}

      <div className="opt" style={{opacity: cliProvider ? 0.55 : 1}}>
        <div>
          <div className="lbl">OpenAI API key {cliProvider && <span style={{fontSize:10, color:"var(--ink-4)", fontWeight:400}}>(fallback only)</span>}</div>
          <div className="desc">Bring-your-own-key. Calls go straight from your browser to OpenAI via the Responses API. {maskedHint}.</div>
        </div>
        <div />
        <div className="ctrl" style={{display:"flex", gap:6, alignItems:"center", flexWrap:"wrap", justifyContent:"flex-end"}}>
          <input
            type={reveal ? "text" : "password"}
            placeholder={hasKey ? "••••••••••  (replace)" : "sk-…"}
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            spellCheck={false}
            autoComplete="off"
            style={{width: 240, padding: "6px 8px", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontVariantNumeric: "tabular-nums", fontSize: 12, border: "1px solid var(--line)", borderRadius: 6, background: "var(--paper)", color: "var(--ink)"}}
          />
          <button className="btn ghost" onClick={() => setReveal(r => !r)}>{reveal ? "hide" : "show"}</button>
          <button className="btn" onClick={saveKey} disabled={!keyInput.trim()}>save</button>
          {hasKey && <button className="btn alarm" onClick={clearKey}>clear</button>}
        </div>
      </div>

      <div className="opt">
        <div>
          <div className="lbl">Model</div>
          <div className="desc">Selected model for OpenAI Responses and Codex CLI calls. Nano is fastest, 5.4 is the ceiling.</div>
        </div>
        <div />
        <div className="ctrl">
          <div className="segmented">
            {MODELS.map(m => (
              <button key={m} className={currentModel === m ? "on" : ""} onClick={() => pickModel(m)}>{m}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="opt" style={{opacity: currentProvider !== "openai" ? 0.55 : 1}}>
        <div>
          <div className="lbl">Test connection (OpenAI)</div>
          <div className="desc">Probe the OpenAI path. Use only when the OpenAI provider is selected above.</div>
        </div>
        <div className="mono dim" style={{fontSize: 11.5, color: testState.state === "err" ? "var(--alarm)" : testState.state === "ok" ? "var(--pastel-mint-ink)" : "var(--ink-4)"}}>
          {testState.msg || "idle"}
        </div>
        <div className="ctrl">
          <button className="btn" onClick={test} disabled={currentProvider !== "openai" || !hasKey || testState.state === "running"}>
            {testState.state === "running" ? "testing…" : "test"}
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}

function SettingsScreen({ tweaks, setTweaks, go, onReset }) {
  const [status, setStatus] = useState(null);
  const [statusErr, setStatusErr] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);
  const [credMeta, setCredMeta] = useState({});
  const [credDraft, setCredDraft] = useState({});
  const [credBusy, setCredBusy] = useState("");
  const browserUse = {
    resultLimit: 8,
    detail: "standard",
    includeLinks: true,
    screenshots: true,
    ...((tweaks && tweaks.browserUse) || {}),
  };
  const setBrowserUse = (patch) => setTweaks({
    ...tweaks,
    browserUse: { ...browserUse, ...patch },
  });

  const refreshStatus = useCallback(async () => {
    setStatusBusy(true);
    setStatusErr("");
    try {
      const s = await fetchJson("/api/status");
      setStatus(s || null);
    } catch (e) {
      setStatusErr(e && e.message ? e.message : "status fetch failed");
      setStatus(null);
    } finally {
      setStatusBusy(false);
    }
  }, []);

  const refreshCredentials = useCallback(async () => {
    try {
      const d = await fetchJson("/api/settings/mcp_credentials");
      const keys = (d && d.keys) || {};
      setCredMeta(keys);
    } catch {
      setCredMeta({});
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    refreshCredentials();
  }, [refreshStatus, refreshCredentials]);

  const targetMeta = (status && status.delegation_targets) || {};
  const mcpRows = [
    ["github", "GitHub MCP"],
    ["clickup", "ClickUp"],
    ["close", "Close CRM"],
    ["claude_code", "Claude Code"],
    ["codex_cli", "Codex CLI"],
    ["cursor", "Cursor bridge"],
  ];
  const credRows = [
    ["OPENAI_API_KEY", "OpenAI API key"],
    ["GITHUB_TOKEN", "GitHub token"],
    ["CLICKUP_API_TOKEN", "ClickUp API token"],
    ["CLOSE_API_KEY", "Close API key"],
  ];

  const saveCredential = async (key) => {
    const value = (credDraft[key] || "").trim();
    if (!value) {
      alert("Paste a token first, or use clear.");
      return;
    }
    setCredBusy(key + ":save");
    try {
      const r = await fetchJson("/api/settings/mcp_credentials/save", {
        method: "POST",
        body: JSON.stringify({ updates: { [key]: value } }),
      });
      setCredMeta((r && r.keys) || {});
      setCredDraft(v => ({ ...v, [key]: "" }));
      await refreshStatus();
    } catch (e) {
      alert(e.message || e);
    } finally {
      setCredBusy("");
    }
  };

  const clearCredential = async (key) => {
    if (!confirm(`Clear ${key}?`)) return;
    setCredBusy(key + ":clear");
    try {
      const r = await fetchJson("/api/settings/mcp_credentials/save", {
        method: "POST",
        body: JSON.stringify({ updates: { [key]: "" } }),
      });
      setCredMeta((r && r.keys) || {});
      setCredDraft(v => ({ ...v, [key]: "" }));
      await refreshStatus();
    } catch (e) {
      alert(e.message || e);
    } finally {
      setCredBusy("");
    }
  };

  return (
    <div className="settings">
      <div className="screen-title">
        <div>
          <div className="kicker">settings · full window</div>
          <h1>Configuration</h1>
        </div>
        <div className="meta"><span><b>operator</b> the team</span><span><b>storage</b> local · 2.4 MB</span></div>
      </div>

      <section>
        <h2>Appearance</h2>
        <div className="opt">
          <div><div className="lbl">Theme</div><div className="desc">Paper is the default. Ink is for late sessions.</div></div>
          <div />
          <div className="ctrl">
            <div className="segmented">
              <button className={tweaks.theme === "light" ? "on" : ""} onClick={() => setTweaks({...tweaks, theme:"light"})}>paper</button>
              <button className={tweaks.theme === "dark" ? "on" : ""} onClick={() => setTweaks({...tweaks, theme:"dark"})}>ink</button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2>Intelligence</h2>
        <IntelligencePanel tweaks={tweaks} setTweaks={setTweaks} />

        <div className="opt">
          <div>
            <div className="lbl">
              Demo mode
              {tweaks.demoMode && <span style={{marginLeft:8, padding:"1px 6px", borderRadius:3, background:"color-mix(in oklab, #c9a227 18%, var(--paper))", color:"#8a6a00", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em"}}>on</span>}
            </div>
            <div className="desc">When on, the app still reads from Close/ClickUp/Slack/Gmail and still reasons with AI, but writes (send email, post Slack, create ClickUp task, update Close) are blocked at the proxy. Reads are always allowed. Turn off when you want real writes to go through.</div>
          </div>
          <div />
          <div className="ctrl">
            <div className={"toggle" + (tweaks.demoMode ? " on" : "")} onClick={() => setTweaks({...tweaks, demoMode: !tweaks.demoMode})} />
          </div>
        </div>
      </section>

      <section>
        <h2>Chat intelligence</h2>
        <div className="opt">
          <div>
            <div className="lbl">
              Pre-process prompts with selected GPT-5.4 model
              {tweaks.promptEnhance && <span style={{marginLeft:8, padding:"1px 6px", borderRadius:3, background:"color-mix(in oklab, var(--leaf) 18%, var(--paper))", color:"var(--pastel-mint-ink)", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em"}}>on</span>}
            </div>
            <div className="desc">
              When on, every chat message you send is first run through the GPT-5.4 variant selected above. That model rewrites your prompt as a clearer, more directed instruction for Claude (you still see your original message in the chat) and emits a contextual <em>thinking trace</em> the UI animates while Claude works. Adds ~1s of latency, generally improves output quality, and replaces the static "thinking" box with something alive.
            </div>
          </div>
          <div />
          <div className="ctrl">
            <div className={"toggle" + (tweaks.promptEnhance ? " on" : "")} onClick={() => setTweaks({...tweaks, promptEnhance: !tweaks.promptEnhance})} />
          </div>
        </div>
      </section>

      <section>
        <h2>Browser use</h2>
        <div className="opt">
          <div>
            <div className="lbl">Headless result count</div>
            <div className="desc">How many links or video results the quiet `browser use` worker returns to chat.</div>
          </div>
          <div />
          <div className="ctrl">
            <div className="segmented">
              {[5, 8, 12, 20].map(n => (
                <button key={n} className={Number(browserUse.resultLimit) === n ? "on" : ""} onClick={() => setBrowserUse({ resultLimit: n })}>{n}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="opt">
          <div>
            <div className="lbl">Headless detail</div>
            <div className="desc">Brief returns tight scan lines. Standard includes links. Deep keeps any readable descriptions too.</div>
          </div>
          <div />
          <div className="ctrl">
            <div className="segmented">
              {["brief", "standard", "deep"].map(level => (
                <button key={level} className={browserUse.detail === level ? "on" : ""} onClick={() => setBrowserUse({ detail: level })}>{level}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="opt">
          <div>
            <div className="lbl">Return links</div>
            <div className="desc">Include source URLs in the headless summary panel.</div>
          </div>
          <div />
          <div className="ctrl">
            <div className={"toggle" + (browserUse.includeLinks ? " on" : "")} onClick={() => setBrowserUse({ includeLinks: !browserUse.includeLinks })} />
          </div>
        </div>
        <div className="opt">
          <div>
            <div className="lbl">Save screenshots</div>
            <div className="desc">Store a viewport screenshot for each headless browser job under `output/playwright/`.</div>
          </div>
          <div />
          <div className="ctrl">
            <div className={"toggle" + (browserUse.screenshots ? " on" : "")} onClick={() => setBrowserUse({ screenshots: !browserUse.screenshots })} />
          </div>
        </div>
      </section>

      <section>
        <h2>Pieces · temporal continuity</h2>
        <div className="opt">
          <div>
            <div className="lbl">Pieces chat LLM</div>
            <div className="desc">
              Pieces fronts the inference cost for whichever model is named here. <b>gpt-4o</b> and <b>gpt-4.1</b> route through Pieces' included LLM credit (no Anthropic spend). <b>claude-sonnet-4-5</b> routes through your Anthropic key. Affects every Activity sweep + every Ask in Mind → Activity, plus the Briefing ribbon's hourly background sweep.
            </div>
          </div>
          <div />
          <div className="ctrl">
            <div className="segmented">
              {[
                ["claude-sonnet-4-5", "claude sonnet 4.5"],
                ["gpt-4o",            "gpt-4o · free"],
                ["gpt-4.1",           "gpt-4.1 · free"],
                ["claude-opus-4",     "claude opus 4"],
              ].map(([id, label]) => (
                <button key={id}
                  className={tweaks.piecesModel === id ? "on" : ""}
                  onClick={() => setTweaks({...tweaks, piecesModel: id})}
                >{label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="opt">
          <div>
            <div className="lbl">Open Pieces Activity</div>
            <div className="desc">Jump to Mind → Activity to see live sweeps, all 39 MCP tools, and the connection panel.</div>
          </div>
          <div />
          <div className="ctrl">
            <button className="btn ghost" onClick={() => go.push("activity")}>Open ↗</button>
          </div>
        </div>
      </section>

      <section>
        <h2>MCP servers + delegation targets</h2>
        <div className="opt">
          <div>
            <div className="lbl">Target registry</div>
            <div className="desc">This is the control point for where delegations can go: GitHub, ClickUp, Close, Claude Code, and Cursor routing.</div>
          </div>
          <div className="mono dim" style={{fontSize: 11.5}}>
            {statusErr ? `status error: ${statusErr}` : statusBusy ? "checking…" : "live"}
          </div>
          <div className="ctrl" style={{display:"flex", gap:8}}>
            <button className="btn ghost" onClick={refreshStatus} disabled={statusBusy}>{statusBusy ? "refreshing…" : "refresh status"}</button>
            <button className="btn ghost" onClick={() => go.push("delegations")}>open delegations ↗</button>
          </div>
        </div>
        <div style={{display:"grid", gap:8}}>
          {mcpRows.map(([id, label]) => {
            const meta = targetMeta[id] || {};
            const connected = !!meta.available;
            return (
              <div key={id} className="opt" style={{gridTemplateColumns:"1fr auto auto"}}>
                <div>
                  <div className="lbl">{label}</div>
                  <div className="desc">{meta.detail || "No status detail yet."}</div>
                </div>
                <div className="mono dim" style={{fontSize:11.5, color: connected ? "var(--pastel-mint-ink)" : "var(--alarm)"}}>
                  {connected ? "connected" : "not connected"}
                </div>
                <div className="mono dim" style={{fontSize:11.5}}>
                  {meta.requires_approval_for_write ? "write approval required" : "write approval optional"}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{height:1, background:"var(--rule)", margin:"8px 0 2px"}} />
        <div className="mono dim" style={{fontSize:11.5}}>Credential vault (writes to local `.env`; values are masked after save).</div>
        <div style={{display:"grid", gap:8}}>
          {credRows.map(([key, label]) => {
            const meta = credMeta[key] || {};
            const busySave = credBusy === key + ":save";
            const busyClear = credBusy === key + ":clear";
            return (
              <div key={key} className="opt" style={{gridTemplateColumns:"1fr 1fr auto"}}>
                <div>
                  <div className="lbl">{label}</div>
                  <div className="desc">{meta.configured ? `saved: ${meta.masked || "yes"}` : "not configured"}</div>
                </div>
                <input
                  type="password"
                  className="ix-create-input"
                  value={credDraft[key] || ""}
                  onChange={(e) => setCredDraft(v => ({ ...v, [key]: e.target.value }))}
                  placeholder={`Paste ${key}`}
                />
                <div className="ctrl" style={{display:"flex", gap:6}}>
                  <button className="btn ghost" onClick={() => saveCredential(key)} disabled={busySave || busyClear}>{busySave ? "saving…" : "save"}</button>
                  <button className="btn ghost" onClick={() => clearCredential(key)} disabled={busySave || busyClear || !meta.configured}>{busyClear ? "clearing…" : "clear"}</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div style={{marginTop: 30, display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
        <div style={{display:"flex", gap:10, alignItems:"center"}}>
          <div className="mono dim" style={{fontSize:11}}>changes save live — no confirmation needed.</div>
          <button className="btn alarm" onClick={onReset}>Reset</button>
        </div>
      </div>
    </div>
  );
}



// ═══════════════════ CONTACTS ═══════════════════
// Edit-friendly view of CCAgentindex/people/*.
// Each person has contact methods (email, phone, whatsapp, slack_id, etc.)
// AND a `handling` block — per-person sore-thumb variables that evolve over time.
// Writes land as inbox `correction` entries first, then the backend agent
// folds them into the actual people/*.json files on sweep.
// ═══════════════════ PEOPLE / PROFILES (Apr 2026 v2) ═══════════════════
//
// Replaces the old single Contacts form-in-place screen. The People section
// now splits into 4 routes by kind: leads, clients, coworkers, contacts.
// Each route reuses PeopleScreen with a different kind prop. The right pane
// is a polished read-only profile card — editing is delegated to Rodbot via
// chat (Add / Update buttons prefill a chat message). Form filling is dead.
//
// Kind discriminator: we read `person.kind` if set, else default to
// "coworker" (the existing 14 records are all team members from Comeketo).
// Once Rodbot starts adding leads/clients/contacts, those will set kind
// explicitly during the inbox sweep.
//
// Visual: each kind gets a deck-aligned accent — lemon (leads), mint
// (clients), sage (coworkers), blush (contacts).
// ═══════════════════════════════════════════════════════════════════════

const PEOPLE_KIND_META = {
  lead:     { label: "Leads",     singular: "lead",     title: "Who you're courting — and how to win them.", kicker: "people · leads · pursuing",     accent: "lemon" },
  client:   { label: "Clients",   singular: "client",   title: "Who you've earned — and how to keep them.",  kicker: "people · clients · booked",     accent: "mint"  },
  coworker: { label: "Coworkers", singular: "coworker", title: "Who's on the team — and how they work.",     kicker: "people · coworkers · the team", accent: "sage"  },
  contact:  { label: "Contacts",  singular: "contact",  title: "Who's in your orbit — and how to reach them.", kicker: "people · contacts · reference", accent: "blush" },
};

function PeopleScreen({ go, kind }) {
  const MC = window.MissionControl;
  const meta = PEOPLE_KIND_META[kind] || PEOPLE_KIND_META.contact;
  const [people, setPeople] = useState(() => (MC && MC.people) || []);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onLoaded = (ev) => setPeople([...(ev.detail && ev.detail.people || [])]);
    window.addEventListener("missioncontrol:loaded", onLoaded);
    return () => window.removeEventListener("missioncontrol:loaded", onLoaded);
  }, []);

  // Default missing kind to "coworker" so existing records show up there.
  const inKind = (p) => (p.kind || "coworker") === kind;
  const filtered = useMemo(() => people.filter(inKind).sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  ), [people, kind]);

  const visible = useMemo(() => {
    if (!query.trim()) return filtered;
    const q = query.toLowerCase();
    return filtered.filter(p =>
      (p.name || "").toLowerCase().includes(q) ||
      (p.role || "").toLowerCase().includes(q)
    );
  }, [filtered, query]);

  // Auto-select first when list becomes available or kind changes.
  useEffect(() => {
    if (filtered.length === 0) { setSelectedId(null); return; }
    if (!filtered.some(p => p.id === selectedId)) setSelectedId(filtered[0].id);
  }, [filtered, kind]);

  const selected = filtered.find(p => p.id === selectedId) || null;

  // Open chat with a prefilled message asking Rodbot to do the work.
  // Critical ordering: navigate FIRST (synchronously), then fire the chat
  // send. Otherwise the user sits on the People page during the round-trip
  // and rage-clicks, sending the same prompt N times. The dispatchingRef
  // gate is a belt-and-suspenders 800ms cooldown for the same reason.
  const dispatchingRef = useRef(false);
  const sendToChat = (message) => {
    if (dispatchingRef.current) return;
    dispatchingRef.current = true;
    setTimeout(() => { dispatchingRef.current = false; }, 800);

    // Navigate to home (chat lives in the ideas-mode rail there) immediately.
    if (go && go.home) go.home();

    // Fire the chat send after the route swap so the user sees the message
    // land in the destination, not the origin.
    const CHAT = window.SecretaryChat;
    if (!CHAT) return;
    setTimeout(async () => {
      let cid = CHAT.activeId && CHAT.activeId();
      if (!cid) {
        const c = CHAT.newChat && CHAT.newChat("People");
        cid = c && c.id;
      }
      if (cid && CHAT.send) {
        try { await CHAT.send({ chatId: cid, text: message }); } catch {}
      }
    }, 0);
  };

  const addNew = () => {
    sendToChat(
      `Add a new ${meta.singular}. Walk me through name, role, contact methods, and how to handle them — I'll answer in pieces. When we're done, queue it as a person_upsert correction in the inbox so the next sweep folds it into people/.`
    );
  };

  const updateRecordFor = (person) => {
    if (!person) return;
    sendToChat(
      `Update ${person.name}'s record (kind: ${person.kind || "coworker"}). What's changing? When we settle on the diff, queue a person_upsert correction in the inbox tagged with id ${person.id}.`
    );
  };

  const askAbout = (person) => {
    if (!person) return;
    sendToChat(
      `Tell me about ${person.name}${person.role ? ` (${person.role})` : ""}. Pull what's on file and any cross-references — recent threads, commitments, anything live.`
    );
  };

  const reclassify = (person, newKind) => {
    if (!person || !newKind) return;
    sendToChat(
      `Reclassify ${person.name} from ${person.kind || "coworker"} to ${newKind}. Queue a person_upsert correction in the inbox tagged with id ${person.id} — set kind: "${newKind}". Anything else worth updating about how they fit in that bucket?`
    );
  };

  // Clipboard helper — used by the right-click "Copy …" entries. Returns
  // boolean for success so we can flash a tiny toast later if we want.
  const copyToClipboard = (text) => {
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback for older browsers.
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand("copy"); document.body.removeChild(ta);
      return true;
    } catch { return false; }
  };

  // ── Right-click menus ─────────────────────────────────────────────────────
  // One menu instance per surface (list rows / profile). The menu hooks track
  // the current click position; we track which person was right-clicked via a
  // ref so the items list can stay stable.
  const listMenu = useContextMenu();
  const profileMenu = useContextMenu();
  const ctxPersonRef = useRef(null);

  const openListContextMenu = (e, person) => {
    ctxPersonRef.current = person;
    listMenu.onContextMenu(e);
  };
  const openProfileContextMenu = (e) => {
    ctxPersonRef.current = selected;
    profileMenu.onContextMenu(e);
  };

  // Build the items list for whichever person is currently right-clicked.
  // Empty/null fields render no entry — keeps the menu tight and relevant.
  const buildPersonMenuItems = (p) => {
    if (!p) return [];
    const c = p.contacts || {};
    const otherKinds = ["lead", "client", "coworker", "contact"].filter(k => k !== (p.kind || "coworker"));
    const items = [
      { label: "Talk about them",   icon: "💬", onClick: () => askAbout(p) },
      { label: "Update via Rodbot", icon: "✎",  onClick: () => updateRecordFor(p) },
      {
        label: "Send update brief to delegations",
        icon: "↗",
        onClick: async () => {
          const prompt = [
            `Prepare and execute operational follow-through for ${p.name}.`,
            p.role ? `Role: ${p.role}` : "",
            `Kind: ${p.kind || "coworker"}.`,
            `Use bedrock + current context to draft the next concrete action and run it safely.`,
          ].filter(Boolean).join("\n");
          await sendToDelegationsDraft({
            text: prompt,
            label: `People action: ${p.name}`,
            source: { surface: "people", route: p.kind || "people", entity: { type: "person", id: p.id } },
            policy: { target: "github", intent: "read", approval_required: false },
            mode: "safe",
            context: { person_id: p.id, person_name: p.name },
          });
          go.push("delegations");
        },
      },
      { divider: true },
      { label: "Copy name",         icon: "⧉", onClick: () => copyToClipboard(p.name) },
    ];
    const email = c.email || p.email;
    const phone = c.phone || p.phone;
    if (email) items.push({ label: "Copy email",  icon: "✉", onClick: () => copyToClipboard(email) });
    if (phone) items.push({ label: "Copy phone",  icon: "☏", onClick: () => copyToClipboard(phone) });
    if (c.whatsapp) items.push({ label: "Copy WhatsApp", icon: "☏", onClick: () => copyToClipboard(c.whatsapp) });
    const slack = c.slack_id || c.slack_channel;
    if (slack) items.push({ label: "Copy Slack handle", icon: "#", onClick: () => copyToClipboard(slack) });
    items.push({ divider: true });
    otherKinds.forEach(k => {
      const m = PEOPLE_KIND_META[k];
      items.push({
        label: `Reclassify as ${m.label.slice(0, -1)}`,
        icon: "↪",
        onClick: () => reclassify(p, k),
      });
    });
    return items;
  };

  return (
    <div className={"people-screen people-screen-" + meta.accent}>
      <div className="screen-title">
        <div>
          <div className="kicker">{meta.kicker}</div>
          <h1>{meta.title}</h1>
        </div>
        <div className="meta">
          <span><b>{meta.label.toLowerCase()}</b> {filtered.length}</span>
          {!MC && <span style={{color:"var(--alarm)"}}>bedrock not loaded</span>}
        </div>
      </div>

      <div className="people-grid">
        <aside className="people-list-pane">
          <button className="people-add" onClick={addNew} title={`Ask Rodbot to draft a new ${meta.singular}`}>
            + add {meta.singular} via Rodbot
          </button>
          <input
            className="people-search"
            type="search"
            placeholder={`search ${meta.label.toLowerCase()}…`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {filtered.length === 0 ? (
            <div className="people-empty">
              No {meta.label.toLowerCase()} yet. Click <b>+ add {meta.singular}</b> and Rodbot will draft one with you.
            </div>
          ) : visible.length === 0 ? (
            <div className="people-empty">No matches for "{query}".</div>
          ) : (
            <div className="people-list-scroll">
              {visible.map(p => (
                <button
                  key={p.id}
                  className={"people-list-item" + (selected && selected.id === p.id ? " selected" : "")}
                  onClick={() => setSelectedId(p.id)}
                  onContextMenu={(e) => openListContextMenu(e, p)}
                  title="right-click for actions"
                >
                  <div className="pli-name">{p.name}</div>
                  {p.role && <div className="pli-role">{p.role}</div>}
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="people-profile-pane" onContextMenu={selected ? openProfileContextMenu : undefined}>
          {!selected ? (
            <div className="people-empty-profile">
              <div className="pep-title">No {meta.singular} selected.</div>
              <div className="pep-hint">Pick one on the left, or hit <b>+ add</b> to start a draft with Rodbot.</div>
            </div>
          ) : (
            <PersonProfile person={selected} kind={kind} accent={meta.accent} onUpdate={() => updateRecordFor(selected)} />
          )}
        </main>
      </div>

      {listMenu.render(buildPersonMenuItems(ctxPersonRef.current), ctxPersonRef.current ? ctxPersonRef.current.name : null)}
      {profileMenu.render(buildPersonMenuItems(ctxPersonRef.current), ctxPersonRef.current ? ctxPersonRef.current.name : null)}

      <div className="people-back">
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
      </div>
    </div>
  );
}

// PersonProfile — read-only, polished view of one person record.
// Renders only fields that are present so empty records degrade gracefully.
function PersonProfile({ person, kind, accent, onUpdate }) {
  const p = person || {};
  const contacts = p.contacts || {};
  const handling = p.handling || {};
  const weight = typeof p.relationship_weight === "number" ? p.relationship_weight : null;

  // Visualize trust weight as 5 pips, lit by quintile.
  const weightPips = weight === null ? null : (
    <div className="pp-weight" title={`Relationship weight ${weight.toFixed(2)}`}>
      <span className="pp-weight-label">trust weight</span>
      <span className="pp-weight-pips">
        {[0,1,2,3,4].map(i => (
          <span key={i} className={"pp-weight-pip" + (weight >= (i + 1) / 5 ? " on" : "")} />
        ))}
      </span>
      <span className="pp-weight-num">{weight.toFixed(2)}</span>
    </div>
  );

  const ContactItem = ({ icon, label, value }) => value ? (
    <div className="pp-contact-item">
      <span className="pp-contact-icon"><Icon name={icon} size={13} /></span>
      <span className="pp-contact-label">{label}</span>
      <span className="pp-contact-value">{value}</span>
    </div>
  ) : null;

  const HandlingBlock = ({ label, body }) => body ? (
    <div className="pp-handling-block">
      <div className="pp-handling-label">{label}</div>
      <div className="pp-handling-body">{body}</div>
    </div>
  ) : null;

  const anyContact = !!(contacts.email || contacts.phone || contacts.whatsapp ||
                       contacts.slack_id || contacts.slack_channel || contacts.clickup_user_id ||
                       contacts.other || p.email || p.phone);
  const anyHandling = !!(handling.preferred_channel || handling.tone || handling.context ||
                         handling.voice_adjustments || handling.response_latency_target ||
                         handling.off_limits_topics);

  return (
    <article className={"person-profile person-profile-" + accent}>
      <header className="pp-head">
        <div className="pp-eyebrow">
          <span className="pp-kind">{kind}</span>
          {p.relationship_tier && (
            <>
              <span className="pp-eyebrow-dot">·</span>
              <span className="pp-tier">{String(p.relationship_tier).replace(/_/g, " ")}</span>
            </>
          )}
        </div>
        <h2 className="pp-name">{p.name}</h2>
        {p.role && <div className="pp-role">{p.role}</div>}
        {weightPips}
      </header>

      <section className="pp-section">
        <div className="pp-section-head">Contact</div>
        {anyContact ? (
          <div className="pp-contacts">
            <ContactItem icon="mail"          label="email"    value={contacts.email || p.email} />
            <ContactItem icon="phone"         label="phone"    value={contacts.phone || p.phone} />
            <ContactItem icon="message-circle" label="whatsapp" value={contacts.whatsapp} />
            <ContactItem icon="hash"          label="slack id" value={contacts.slack_id} />
            <ContactItem icon="hash"          label="slack ch" value={contacts.slack_channel} />
            <ContactItem icon="check-square"  label="clickup"  value={contacts.clickup_user_id} />
            <ContactItem icon="link"          label="other"    value={contacts.other} />
          </div>
        ) : (
          <div className="pp-empty-line">No contact methods on file.</div>
        )}
      </section>

      {anyHandling && (
        <section className="pp-section">
          <div className="pp-section-head">How to handle</div>
          {(handling.preferred_channel || handling.response_latency_target) && (
            <div className="pp-chip-row">
              {handling.preferred_channel && <span className="pp-chip">channel · {handling.preferred_channel}</span>}
              {handling.response_latency_target && <span className="pp-chip">latency · {handling.response_latency_target}</span>}
            </div>
          )}
          <HandlingBlock label="Tone"              body={handling.tone} />
          <HandlingBlock label="Context"           body={handling.context} />
          <HandlingBlock label="Voice adjustments" body={handling.voice_adjustments} />
          <HandlingBlock label="Off-limits"        body={handling.off_limits_topics} />
        </section>
      )}

      {Array.isArray(p.context_anchors) && p.context_anchors.length > 0 && (
        <section className="pp-section">
          <div className="pp-section-head">Context anchors</div>
          <ul className="pp-anchor-list">
            {p.context_anchors.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </section>
      )}

      {p.performance_index && (
        <section className="pp-section">
          <div className="pp-section-head">Performance</div>
          <div className="pp-stats">
            {typeof p.performance_index.scorecard_rank === "number" && (
              <div className="pp-stat">
                <div className="pp-stat-num">#{p.performance_index.scorecard_rank}</div>
                <div className="pp-stat-label">scorecard rank</div>
              </div>
            )}
            {typeof p.performance_index.performance_multiplier === "number" && (
              <div className="pp-stat">
                <div className="pp-stat-num">{p.performance_index.performance_multiplier.toFixed(2)}×</div>
                <div className="pp-stat-label">multiplier</div>
              </div>
            )}
            {typeof p.performance_index.total_score_snapshot === "number" && (
              <div className="pp-stat">
                <div className="pp-stat-num">{p.performance_index.total_score_snapshot.toLocaleString()}</div>
                <div className="pp-stat-label">total score</div>
              </div>
            )}
          </div>
        </section>
      )}

      {Array.isArray(p.notes) && p.notes.length > 0 && (
        <section className="pp-section">
          <div className="pp-section-head">Notes</div>
          <ul className="pp-notes-list">
            {p.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </section>
      )}

      <footer className="pp-foot">
        {p.id && <div className="pp-id">id · <code>{p.id}</code></div>}
        <button className="pp-update" onClick={onUpdate} title="Open chat with Rodbot to update this record">
          update via Rodbot ↳
        </button>
      </footer>
    </article>
  );
}

// Backwards-compat shim — old route name "contacts" still routes here, but
// app.jsx now passes a kind prop. Direct calls without kind default to
// "contact" so legacy URLs keep working.
function ContactsScreen({ go, kind }) {
  return <PeopleScreen go={go} kind={kind || "contact"} />;
}

// ═══════════════════════════════════════════════════════════════════════
//  VENUES — 5th People entry (Apr 2026 wire-up)
// ───────────────────────────────────────────────────────────────────────
//  Venues are catering sites we deliver to (`kind:"venue"`). Distinct shape
//  from people records (deal_stats, raw_variants, close_account, action) so
//  this gets venue-specific renderers rather than a forced PersonProfile.
//  List sorted by tier asc then total deal value desc.
// ═══════════════════════════════════════════════════════════════════════

const VENUE_TIER_RANK = { tier_1: 1, tier_2: 2, tier_3: 3 };
const VENUE_TIER_LABEL = { tier_1: "Tier 1", tier_2: "Tier 2", tier_3: "Tier 3" };

function fmtVenueMoney(n, { decimals = 0 } = {}) {
  if (n == null || isNaN(n)) return "—";
  const v = Number(n);
  if (decimals === 0) return "$" + Math.round(v).toLocaleString();
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function VenuesScreen({ go }) {
  const MC = window.MissionControl;
  const [venues, setVenues] = useState(() => (MC && MC.venues) || []);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onLoaded = (ev) => setVenues([...((ev.detail && ev.detail.venues) || [])]);
    window.addEventListener("missioncontrol:loaded", onLoaded);
    return () => window.removeEventListener("missioncontrol:loaded", onLoaded);
  }, []);

  const sorted = useMemo(() => {
    const arr = [...venues];
    arr.sort((a, b) => {
      const ra = VENUE_TIER_RANK[a.tier] || 99;
      const rb = VENUE_TIER_RANK[b.tier] || 99;
      if (ra !== rb) return ra - rb;
      const va = (a.deal_stats && a.deal_stats.total_value) || 0;
      const vb = (b.deal_stats && b.deal_stats.total_value) || 0;
      return vb - va;
    });
    return arr;
  }, [venues]);

  const visible = useMemo(() => {
    if (!query.trim()) return sorted;
    const q = query.toLowerCase();
    return sorted.filter(v =>
      (v.name || "").toLowerCase().includes(q) ||
      (v.city || "").toLowerCase().includes(q)
    );
  }, [sorted, query]);

  useEffect(() => {
    if (sorted.length === 0) { setSelectedId(null); return; }
    if (!sorted.some(v => v.id === selectedId)) setSelectedId(sorted[0].id);
  }, [sorted]);

  const selected = sorted.find(v => v.id === selectedId) || null;

  return (
    <div className="people-screen people-screen-sage venues-screen">
      <div className="screen-title">
        <div>
          <div className="kicker">people · venues · sites we deliver to</div>
          <h1>Venues · {sorted.length}</h1>
        </div>
        <div className="meta">
          <span><b>venues</b> {sorted.length}</span>
          {!MC && <span style={{color:"var(--alarm)"}}>bedrock not loaded</span>}
        </div>
      </div>

      <div className="people-grid">
        <aside className="people-list-pane">
          <input
            className="people-search"
            type="search"
            placeholder="search venues…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {sorted.length === 0 ? (
            <div className="people-empty">
              No venues loaded yet. Drop venue records under <code>venues/</code> and register them in <code>indexes/index.json</code>.
            </div>
          ) : visible.length === 0 ? (
            <div className="people-empty">No matches for "{query}".</div>
          ) : (
            <div className="people-list-scroll">
              {visible.map(v => {
                const stats = v.deal_stats || {};
                const tierKey = v.tier || "tier_3";
                const hasLead = !!(v.close_account && v.close_account.has_lead);
                return (
                  <button
                    key={v.id}
                    className={"people-list-item venue-list-item" + (selected && selected.id === v.id ? " selected" : "")}
                    onClick={() => setSelectedId(v.id)}
                  >
                    <div className="vli-row">
                      <div className="vli-text">
                        <div className="pli-name">{v.name}</div>
                        {v.city && <div className="pli-role">{v.city}</div>}
                      </div>
                      <div className="vli-money">{fmtVenueMoney(stats.total_value)}</div>
                    </div>
                    <div className="vli-chips">
                      <span className={"vli-tier vli-tier-" + tierKey}>{VENUE_TIER_LABEL[tierKey] || tierKey}</span>
                      {typeof stats.opp_count === "number" && (
                        <span className="vli-chip">{stats.opp_count} opp{stats.opp_count === 1 ? "" : "s"}</span>
                      )}
                      {hasLead && <span className="vli-chip vli-chip-on">Close ✓</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        <main className="people-profile-pane">
          {!selected ? (
            <div className="people-empty-profile">
              <div className="pep-title">No venue selected.</div>
              <div className="pep-hint">Pick one on the left.</div>
            </div>
          ) : (
            <VenueProfile venue={selected} />
          )}
        </main>
      </div>

      <div className="people-back">
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
      </div>
    </div>
  );
}

// VenueProfile — read-only detail view for a single venue.
// Schema-specific renderers — does NOT inherit PersonProfile shape.
function VenueProfile({ venue }) {
  const v = venue || {};
  const stats = v.deal_stats || {};
  const close = v.close_account || {};
  const tierKey = v.tier || "tier_3";
  const enrichNow = typeof v.action === "string" && v.action.toUpperCase().includes("ENRICH NOW");

  return (
    <article className="person-profile person-profile-sage venue-profile">
      <header className="pp-head">
        <div className="pp-eyebrow">
          <span className="pp-kind">venue</span>
          <span className="pp-eyebrow-dot">·</span>
          <span className={"vp-tier vp-tier-" + tierKey}>{VENUE_TIER_LABEL[tierKey] || tierKey}</span>
          {enrichNow && (
            <>
              <span className="pp-eyebrow-dot">·</span>
              <span className="vp-enrich">ENRICH NOW</span>
            </>
          )}
        </div>
        <h2 className="pp-name">{v.name}</h2>
        {v.city && <div className="pp-role">{v.city}</div>}
        {v.venue_type && <div className="vp-type">{v.venue_type}</div>}
      </header>

      <section className="pp-section">
        <div className="pp-section-head">Deal stats</div>
        <div className="pp-stats">
          <div className="pp-stat">
            <div className="pp-stat-num">{typeof stats.opp_count === "number" ? stats.opp_count : "—"}</div>
            <div className="pp-stat-label">opportunities</div>
          </div>
          <div className="pp-stat">
            <div className="pp-stat-num">{fmtVenueMoney(stats.total_value)}</div>
            <div className="pp-stat-label">total value</div>
          </div>
          <div className="pp-stat">
            <div className="pp-stat-num">{fmtVenueMoney(stats.avg_deal_value)}</div>
            <div className="pp-stat-label">avg deal</div>
          </div>
          <div className="pp-stat">
            <div className="pp-stat-num">{typeof stats.lead_name_refs === "number" ? stats.lead_name_refs : "—"}</div>
            <div className="pp-stat-label">lead refs</div>
          </div>
        </div>
      </section>

      {v.website && (
        <section className="pp-section">
          <div className="pp-section-head">Website</div>
          <a className="vp-link" href={v.website} target="_blank" rel="noopener noreferrer">
            <Icon name="external-link" size={13} /> {v.website}
          </a>
        </section>
      )}

      <section className="pp-section">
        <div className="pp-section-head">Close account</div>
        {close.has_lead ? (
          <div className="vp-close">
            <div className="pp-chip-row">
              <span className="pp-chip">status · {close.lead_status || "unknown"}</span>
              <span className="pp-chip pp-chip-on">linked</span>
            </div>
            {close.lead_url && (
              <a className="vp-link" href={close.lead_url} target="_blank" rel="noopener noreferrer">
                <Icon name="external-link" size={13} /> open in Close
              </a>
            )}
          </div>
        ) : (
          <div className="vp-close-empty">No Close lead account yet — enrichment opportunity.</div>
        )}
      </section>

      {Array.isArray(v.raw_variants) && v.raw_variants.length > 0 && (
        <section className="pp-section">
          <div className="pp-section-head">Raw variants seen</div>
          <div className="vp-variants">
            {v.raw_variants.map((rv, i) => (
              <span key={i} className="vp-variant">{rv}</span>
            ))}
          </div>
        </section>
      )}

      {Array.isArray(v.notes) && v.notes.length > 0 && (
        <section className="pp-section">
          <div className="pp-section-head">Notes</div>
          <ul className="pp-notes-list">
            {v.notes.map((n, i) => <li key={i}>{n}</li>)}
          </ul>
        </section>
      )}

      {v.action && (
        <section className="pp-section">
          <div className="pp-section-head">Recommended action</div>
          <div className={"vp-action" + (enrichNow ? " vp-action-hot" : "")}>{v.action}</div>
        </section>
      )}

      <footer className="pp-foot">
        {v.id && <div className="pp-id">id · <code>{v.id}</code></div>}
      </footer>
    </article>
  );
}

// ═══════════════════ ANALYTICS ═══════════════════════════════════════════
// First panel: Conversation Intelligence — built nightly by
// build_conversation_intelligence.py. Reads /api/intelligence/conversation/latest
// (returns the newest .json from intelligence/sales/conversation/) and renders
// KPI tiles, sparkline, channel-mix bars, top-leads list, and the full
// markdown narrative as a collapsible panel underneath.
// ═════════════════════════════════════════════════════════════════════════
function ConversationIntelligenceTab({ go }) {
  const [data, setData] = useState(null);
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFull, setShowFull] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/intelligence/conversation/latest", { cache: "no-cache" })
      .then(r => r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status)))
      .then(j => {
        if (cancelled) return;
        if (!j || !j.ok) {
          setError(j && j.error ? j.error : "no conversation intelligence yet — run the script");
          setLoading(false);
          return;
        }
        setData(j.payload);
        // Fetch sibling markdown (best-effort — the static file server serves it).
        const slug = (j.slug || "").replace(/\.json$/, "");
        if (slug) {
          fetch(`CCAgentindex/intelligence/sales/conversation/${slug}.md`, { cache: "no-cache" })
            .then(r => r.ok ? r.text() : "")
            .then(t => { if (!cancelled) setMarkdown(t); })
            .catch(() => {});
        }
        setLoading(false);
      })
      .catch(e => { if (!cancelled) { setError(e.message || String(e)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [reloadTick]);

  if (loading) {
    return <div style={{padding:"32px",color:"var(--muted)",fontSize:13,fontFamily:"var(--mono)"}}>Loading conversation intelligence…</div>;
  }
  if (error || !data) {
    return (
      <div style={{padding:"24px"}}>
        <div style={{background:"var(--rose-bg)",color:"var(--rose-ink)",borderRadius:8,padding:"14px 18px",fontSize:13}}>
          <b>No conversation intelligence available.</b><br/>
          {error || "Run build_conversation_intelligence.py to generate it."}
          <br/><button onClick={() => setReloadTick(t=>t+1)} style={{marginTop:8,fontFamily:"var(--mono)",fontSize:10,padding:"4px 10px",border:"1px solid var(--rose-ink)",background:"transparent",color:"var(--rose-ink)",borderRadius:4,cursor:"pointer"}}>retry</button>
        </div>
      </div>
    );
  }
  return (
    <ConversationIntelligencePanel
      data={data} markdown={markdown}
      showFull={showFull} setShowFull={setShowFull}
      onRefresh={() => setReloadTick(t => t + 1)}
    />
  );
}

function ConversationIntelligencePanel({ data, markdown, showFull, setShowFull, onRefresh }) {
  const totals = data.totals || {};
  const buckets = data.buckets || {};
  const byChannel = data.by_channel || {};
  const top = Array.isArray(data.top_leads) ? data.top_leads : [];
  const series = Array.isArray(data.timeseries) ? data.timeseries : [];

  // relative "generated X ago"
  const genRel = (() => {
    if (!data.generated_at) return "—";
    const t = new Date(data.generated_at).getTime();
    const min = Math.round((Date.now() - t) / 60000);
    if (min < 1) return "just now";
    if (min < 60) return `${min}m ago`;
    const h = Math.round(min / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.round(h / 24)}d ago`;
  })();

  const fmtDate = iso => (iso ? iso.slice(0, 10) : "—");
  const fmtRel = iso => {
    if (!iso) return "—";
    const t = new Date(iso).getTime();
    const sec = Math.round((Date.now() - t) / 1000);
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.round(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.round(sec / 3600)}h ago`;
    return `${Math.round(sec / 86400)}d ago`;
  };
  const fmtChannels = obj => Object.entries(obj || {})
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
    .slice(0, 3)
    .join(" / ");

  return (
    <article className="ci-panel">
      <header className="ci-head">
        <div className="ci-eyebrow">ANALYTICS · CONVERSATION INTELLIGENCE</div>
        <h1 className="ci-title">Last {data.window_days} days · what we said and heard</h1>
        <div className="ci-sub">
          <span>generated {genRel}</span>
          <span className="ci-sep">·</span>
          <span>{fmtDate(data.window_start)} → {fmtDate(data.window_end)}</span>
          <button className="ci-refresh" onClick={onRefresh} title="Refresh">
            <Icon name="refresh-cw" size={13}/> refresh
          </button>
        </div>
      </header>

      {/* KPI tile row — 4 tiles using design-deck tone backgrounds */}
      <section className="ci-kpis">
        <div className="ci-tile ci-tile-mint">
          <div className="ci-tile-eyebrow">TOTALS</div>
          <div className="ci-tile-num">{totals.comms ?? 0}</div>
          <div className="ci-tile-body">comms in window</div>
          <div className="ci-tile-bar">across {totals.leads_with_activity ?? 0} active leads</div>
        </div>
        <div className="ci-tile ci-tile-sky">
          <div className="ci-tile-eyebrow">DIRECTION</div>
          <div className="ci-tile-num">
            <span className="ci-num-in">{totals.in ?? 0}</span>
            <span className="ci-num-slash">/</span>
            <span className="ci-num-out">{totals.out ?? 0}</span>
          </div>
          <div className="ci-tile-body">inbound / outbound</div>
          <div className="ci-tile-bar">ratio {data.ratio || "—"}</div>
        </div>
        <div className="ci-tile ci-tile-peach">
          <div className="ci-tile-eyebrow">ACTIVE</div>
          <div className="ci-tile-num">{totals.leads_with_activity ?? 0}</div>
          <div className="ci-tile-body">leads with activity</div>
          <div className="ci-tile-bar">peak day {fmtDate(buckets.peak_day)}</div>
        </div>
        <div className="ci-tile ci-tile-blush">
          <div className="ci-tile-eyebrow">SILENT</div>
          <div className="ci-tile-num">{totals.silent_leads ?? 0}</div>
          <div className="ci-tile-body">leads with no comms</div>
          <div className="ci-tile-bar">{buckets.busiest_lead ? `busiest · ${buckets.busiest_lead}` : ""}</div>
        </div>
      </section>

      {/* Daily Pulse — sparkline */}
      <section className="ci-section">
        <div className="ci-section-head">
          <div className="ci-section-title">Daily Pulse</div>
          <div className="ci-section-sub">{series.length} days · peak {buckets.peak_count ?? 0} on {fmtDate(buckets.peak_day)}</div>
        </div>
        <Sparkline series={series} />
      </section>

      {/* Channel Mix — horizontal bars */}
      <section className="ci-section">
        <div className="ci-section-head">
          <div className="ci-section-title">Channel Mix</div>
          <div className="ci-section-sub">{Object.keys(byChannel).length} channels · {totals.comms ?? 0} comms</div>
        </div>
        <ChannelBars byChannel={byChannel} total={totals.comms || 1} />
      </section>

      {/* Most Active Leads */}
      <section className="ci-section">
        <div className="ci-section-head">
          <div className="ci-section-title">Most Active Leads</div>
          <div className="ci-section-sub">top {Math.min(top.length, 5)} by comms in window</div>
        </div>
        <div className="ci-leads">
          {top.slice(0, 5).map((r, i) => (
            <div key={r.id || i} className="ci-lead-row">
              <div className="ci-lead-rank">{i + 1}</div>
              <div className="ci-lead-name">{r.name}</div>
              <div className="ci-lead-count">{r.count} comms</div>
              <div className="ci-lead-meta">last {fmtRel(r.last_ts)}</div>
              <div className="ci-lead-channels">{fmtChannels(r.channels)}</div>
            </div>
          ))}
          {!top.length && <div className="ci-empty">No active leads in the window.</div>}
        </div>
      </section>

      {/* Response signal */}
      {data.response_signal && data.response_signal.n_pairs > 0 && (
        <section className="ci-section ci-response">
          <div className="ci-section-head">
            <div className="ci-section-title">Response Patterns</div>
            <div className="ci-section-sub">{data.response_signal.n_pairs} inbound→outbound pairs within 24h</div>
          </div>
          <div className="ci-response-row">
            <div className="ci-response-stat">
              <div className="ci-response-num">{data.response_signal.median_hours}h</div>
              <div className="ci-response-label">median</div>
            </div>
            <div className="ci-response-stat">
              <div className="ci-response-num">{data.response_signal.mean_hours}h</div>
              <div className="ci-response-label">mean</div>
            </div>
            <div className="ci-response-stat">
              <div className="ci-response-num">{data.response_signal.n_pairs}</div>
              <div className="ci-response-label">pairs</div>
            </div>
          </div>
        </section>
      )}

      {/* Narrative markdown — collapsible */}
      <section className="ci-section">
        <div className="ci-section-head ci-section-head-toggle" onClick={() => setShowFull(!showFull)}>
          <div className="ci-section-title">Full Narrative Report</div>
          <div className="ci-section-sub">
            {showFull ? "hide" : "show"} <Icon name={showFull ? "chevron-down" : "chevron-right"} size={12}/>
          </div>
        </div>
        {showFull && (
          markdown
            ? <Markdown text={markdown} className="ci-narrative" />
            : <div className="ci-empty">Markdown report not found.</div>
        )}
      </section>
    </article>
  );
}

function Sparkline({ series }) {
  if (!Array.isArray(series) || !series.length) {
    return <div className="ci-empty">No timeseries data.</div>;
  }
  const W = 720, H = 110, P = 8;
  const max = Math.max(1, ...series.map(d => d.total));
  const stepX = (W - 2 * P) / Math.max(1, series.length - 1);
  const points = series.map((d, i) => {
    const x = P + i * stepX;
    const y = H - P - (d.total / max) * (H - 2 * P);
    return [x, y, d];
  });
  const path = points.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");
  const fillPath = `${path} L ${points[points.length - 1][0]} ${H - P} L ${points[0][0]} ${H - P} Z`;
  return (
    <div className="ci-spark">
      <svg viewBox={`0 0 ${W} ${H}`} className="ci-spark-svg" preserveAspectRatio="none">
        <path d={fillPath} className="ci-spark-fill" />
        <path d={path} className="ci-spark-line" />
        {points.map(([x, y, d], i) => (
          <g key={i} className="ci-spark-dot">
            <circle cx={x} cy={y} r={2.5} />
            <title>{`${d.date} — ${d.total} comms (${d.in || 0} in / ${d.out || 0} out)`}</title>
          </g>
        ))}
      </svg>
      <div className="ci-spark-labels">
        <span>{series[0].date}</span>
        <span>{series[series.length - 1].date}</span>
      </div>
    </div>
  );
}

function ChannelBars({ byChannel, total }) {
  const entries = Object.entries(byChannel || {}).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return <div className="ci-empty">No channels active.</div>;
  const max = Math.max(...entries.map(([, n]) => n), 1);
  const TONES = {
    email: "mint",
    sms: "sky",
    phone: "peach",
    calendar: "lemon",
    whatsapp: "sage",
    other: "blush",
  };
  return (
    <div className="ci-channels">
      {entries.map(([ch, n]) => {
        const pct = (n / max) * 100;
        const sharePct = total ? Math.round((n / total) * 100) : 0;
        return (
          <div key={ch} className={"ci-chan ci-chan-" + (TONES[ch] || "lav")}>
            <div className="ci-chan-label">{ch}</div>
            <div className="ci-chan-track">
              <div className="ci-chan-bar" style={{ width: pct + "%" }}/>
            </div>
            <div className="ci-chan-num">{n}</div>
            <div className="ci-chan-share">{sharePct}%</div>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════ DAILY BRIEFING ═══════════════════
// Read-only view of the morning's Oracle Sweep output.
// ═══════════════════════════════════════════════════════════════════════
//  PIECES BRIEFING RIBBON — temporal continuity at the top of the day.
//  ───────────────────────────────────────────────────────────────────────
//  Fetches the latest hourly Pieces sweep and surfaces it as a sage card
//  above the briefing archive. So when the team opens the app cold, they
//  see "what Pieces noticed since the last sweep" — with the TLDR, the
//  people in the loop, and a one-click jump into Mind → Activity for the
//  full pull. Pieces is the only system tracking unbroken temporal
//  continuity across browsers, vision, and clipboard, so this is the
//  shortest path between the operator and ground truth.
//
//  Uses _normalizePieces + the structured renderer already defined for
//  PiecesActivityScreen — single source of truth for how a Pieces payload
//  lands visually anywhere in the app.
// ═══════════════════════════════════════════════════════════════════════
function PiecesBriefingRibbon({ go }) {
  const [latest, setLatest] = useState(null);   // {ts, raw, ...}
  const [status, setStatus] = useState(null);   // {available, ...}
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/pieces/sweeps/latest").then(r => r.ok ? r.json() : null).catch(() => null),
      fetch("/api/pieces/status").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([l, s]) => {
      if (cancelled) return;
      if (l && l.ok && l.latest) setLatest(l.latest);
      if (s) setStatus(s);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const sinceWord = (iso) => {
    if (!iso) return "";
    try {
      const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
      if (m < 1) return "just now";
      if (m < 60) return `${m}m ago`;
      const h = Math.round(m / 60);
      if (h < 24) return `${h}h ago`;
      return `${Math.round(h / 24)}d ago`;
    } catch { return ""; }
  };

  const payload = useMemo(() => latest ? _normalizePieces(latest.raw, null) : null, [latest]);

  // Pieces unreachable — quiet rose card prompting reconnect.
  if (!loading && status && !status.available) {
    return (
      <div className="admo admo-rose" style={{marginBottom:20}}>
        <div className="icon"><Icon name="alert" size={16}/></div>
        <div>
          <div className="ttl">Pieces is offline</div>
          <p style={{margin:"4px 0 0"}}>
            Open PiecesOS and confirm Long-Term Memory is enabled. The briefing will pick up the next sweep automatically.
          </p>
        </div>
      </div>
    );
  }

  // Loading shimmer in deck-paper
  if (loading) {
    return (
      <div style={{
        background:"var(--card)", border:"1px solid var(--rule)", borderRadius:14,
        padding:"18px 22px", marginBottom:20,
      }}>
        <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)"}}>
          Pieces · loading temporal context…
        </div>
      </div>
    );
  }

  // Connected but no sweeps yet
  if (!latest) {
    return (
      <div className="admo admo-lemon" style={{marginBottom:20}}>
        <div className="icon"><Icon name="clock" size={16}/></div>
        <div>
          <div className="ttl">Pieces is connected</div>
          <p style={{margin:"4px 0 0"}}>
            No sweeps captured yet. The hourly background sweep will land soon —
            or trigger one from <button className="btn ghost" style={{padding:"2px 8px", fontSize:11}} onClick={() => go.push("activity")}>Mind → Activity</button>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-tone card-sage" style={{
      padding:"18px 22px", marginBottom:24, borderRadius:14,
    }}>
      {/* Header strip — eyebrow, "view all" CTA, collapse toggle */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:14}}>
        <div>
          <div className="eyebrow" style={{
            fontFamily:"var(--font-mono)", fontSize:10.5, letterSpacing:"0.1em",
            textTransform:"uppercase", color:"var(--sage-ink)", opacity:0.78,
          }}>
            From Pieces · {sinceWord(latest.ts)}
          </div>
          <div style={{
            fontFamily:"var(--font-display)", fontSize:24, fontWeight:500,
            letterSpacing:"-0.015em", color:"var(--sage-ink)", marginTop:4,
            lineHeight:1.1,
          }}>
            What you've actually been doing.
          </div>
        </div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <button onClick={() => go.push("activity")} style={{
            padding:"6px 14px", borderRadius:999,
            background:"var(--sage-ink)", color:"var(--sage-bg)",
            border:0, cursor:"pointer", fontSize:11, fontWeight:500,
            letterSpacing:"0.04em", fontFamily:"var(--font-body)",
          }}>
            View all activity →
          </button>
          <button onClick={() => setCollapsed(v => !v)} style={{
            padding:"6px 10px", borderRadius:999,
            background:"transparent", color:"var(--sage-ink)", opacity:0.7,
            border:"1px solid currentColor", cursor:"pointer",
            fontSize:10, fontFamily:"var(--font-mono)", letterSpacing:"0.05em",
            textTransform:"uppercase",
          }}>
            {collapsed ? "expand" : "collapse"}
          </button>
        </div>
      </div>

      {!collapsed && payload && payload.kind === "structured" && (
        <div>
          {/* People — at the top of the ribbon, to make the temporal
              continuity feel personal: who has been on your screens? */}
          {payload.people && payload.people.length > 0 && (
            <div style={{display:"flex", flexWrap:"wrap", gap:6, marginBottom:14}}>
              <span style={{
                fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.08em",
                textTransform:"uppercase", color:"var(--sage-ink)", opacity:0.7,
                marginRight:4, alignSelf:"center",
              }}>
                people:
              </span>
              {payload.people.slice(0, 8).map(p => (
                <span key={p.name} style={{
                  fontSize:11, padding:"3px 10px", borderRadius:999,
                  background:"var(--peach-bg)", color:"var(--peach-ink)",
                  fontFamily:"var(--font-body)", fontWeight:500, letterSpacing:"0.02em",
                  display:"inline-flex", alignItems:"center", gap:5,
                }}>
                  {p.name}
                  {p.count > 1 && <span style={{opacity:0.6, fontSize:9, fontFamily:"var(--font-mono)"}}>×{p.count}</span>}
                </span>
              ))}
              {payload.people.length > 8 && (
                <span style={{fontSize:10, color:"var(--sage-ink)", opacity:0.55, fontFamily:"var(--font-mono)", alignSelf:"center"}}>
                  +{payload.people.length - 8} more
                </span>
              )}
            </div>
          )}

          {/* TLDR — the headline summary in deck serif */}
          {payload.summaries && payload.summaries[0] && (
            <div style={{
              fontFamily:"var(--font-display)", fontSize:16, lineHeight:1.55,
              color:"var(--sage-ink)", fontStyle:"normal",
              borderTop:"1px solid currentColor",
              paddingTop:14, opacity:0.95,
            }}>
              {payload.summaries[0].tldr}
            </div>
          )}

          {/* Counts strip — scannable totals + when */}
          <div style={{
            display:"flex", justifyContent:"space-between", alignItems:"center",
            marginTop:14, paddingTop:12, borderTop:"1px solid currentColor",
            opacity:0.85,
          }}>
            <div style={{display:"flex", gap:18, fontSize:11, fontFamily:"var(--font-mono)", letterSpacing:"0.05em", color:"var(--sage-ink)"}}>
              <span><b>{payload.summaries.length}</b> {payload.summaries.length === 1 ? "summary" : "summaries"}</span>
              <span><b>{payload.events.length}</b> {payload.events.length === 1 ? "event" : "events"}</span>
              <span><b>{payload.people.length}</b> {payload.people.length === 1 ? "person" : "people"}</span>
            </div>
            <div style={{fontSize:10, fontFamily:"var(--font-mono)", letterSpacing:"0.04em", color:"var(--sage-ink)", opacity:0.6}}>
              sweep · {new Date(latest.ts).toLocaleString(undefined, { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
            </div>
          </div>
        </div>
      )}

      {!collapsed && payload && payload.kind !== "structured" && (
        <div style={{
          fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:14.5,
          color:"var(--sage-ink)", opacity:0.92, lineHeight:1.55,
          maxHeight:140, overflow:"auto", whiteSpace:"pre-wrap",
        }}>
          {payload.raw ? (payload.raw.slice(0, 800) + (payload.raw.length > 800 ? "…" : "")) : "(empty sweep)"}
        </div>
      )}
    </div>
  );
}

// The file lives at CCAgentindex/summaries/daily_briefings/YYYY-MM-DD.md
// and is also fed into the AI system prompt as foreground context (see ai_instructions.js).
// This screen is for when the team wants to read the full briefing as written.
function DailyBriefingScreen({ go }) {
  const [entries, setEntries] = useState([]); // [{slug, name, mtime}]
  const [activeSlug, setActiveSlug] = useState(null);
  const [briefing, setBriefing] = useState(null);
  const [loadError, setLoadError] = useState(null);

  const refreshList = () =>
    fetch("/api/briefings").then(r => r.ok ? r.json() : null).then(j => {
      if (!j) return;
      const ent = Array.isArray(j.entries)
        ? j.entries
        : (j.briefings || []).map(n => ({ name: n, slug: n.replace(/\.md$/, ""), mtime: 0 }));
      setEntries(ent);
      // Auto-select the newest if nothing is active yet — so reloading the
      // screen always lands on the truth-of-the-moment briefing instead of
      // sticking on a stale one from a previous session.
      setActiveSlug(prev => prev || (ent[0] && ent[0].slug) || null);
    });

  useEffect(() => { refreshList(); }, []);

  useEffect(() => {
    if (!activeSlug) return;
    setLoadError(null);
    fetch(`/api/briefings/${activeSlug}`).then(async r => {
      if (r.ok) return r.json();
      let err = `HTTP ${r.status}`;
      try { const j = await r.json(); if (j && j.error) err = j.error; } catch(_) {}
      throw new Error(err);
    }).then(j => {
      if (j && j.ok) {
        const todayStr = new Date().toISOString().slice(0,10);
        const isToday = j.slug === todayStr || j.slug.includes(todayStr);
        setBriefing({ slug: j.slug, body: j.body, isToday, mtime: j.mtime });
      }
    }).catch(e => {
      setLoadError(`Couldn't load "${activeSlug}": ${e.message}`);
      setBriefing(null);
    });
  }, [activeSlug]);

  const today = new Date().toISOString().slice(0, 10);
  const fmtWhen = (mtime) => {
    if (!mtime) return null;
    try {
      const d = new Date(mtime * 1000);
      return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return null; }
  };
  const list = entries.map(e => e.slug);

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">daily briefing · oracle sweep · {briefing ? briefing.slug : "—"}</div>
          <h1>What moved yesterday. What needs you today.</h1>
        </div>
        <div className="meta">
          <span><b>archive</b> {list.length} briefings</span>
          {briefing && briefing.isToday && <span style={{color: "#3a9a58"}}><b>fresh</b> today</span>}
          {briefing && !briefing.isToday && <span style={{color: "#c78a2a"}}><b>stale</b> (showing {briefing.slug})</span>}
        </div>
      </div>

      {/* Pieces ribbon — temporal continuity at the top of the day. */}
      <PiecesBriefingRibbon go={go} />

      <div style={{display:"grid", gridTemplateColumns:"200px 1fr", gap:20, alignItems:"start"}}>
        {/* Left: briefing archive */}
        <div>
          <div style={{fontSize:10, textTransform:"uppercase", letterSpacing:"0.06em", color:"var(--ink-4)", marginBottom:8}}>Archive</div>
          {list.length === 0 && (
            <div style={{fontSize:11, color:"var(--ink-4)", padding:"14px 0"}}>
              No briefings yet. The scheduled Oracle Sweep writes them each morning to <code style={{fontSize:10.5}}>summaries/daily_briefings/</code>.
            </div>
          )}
          <div style={{display:"grid", gap:4}}>
            {entries.map((e, idx) => {
              const isActive = (briefing && briefing.slug === e.slug) || activeSlug === e.slug;
              const isCurrent = idx === 0;           // newest by mtime
              const when = fmtWhen(e.mtime);
              return (
                <button key={e.slug} onClick={() => setActiveSlug(e.slug)}
                  style={{
                    textAlign:"left", padding:"8px 10px", borderRadius:6,
                    border: isActive ? "2px solid var(--ember)" : "1px solid var(--rule)",
                    background: isActive ? "color-mix(in oklab, var(--ember) 8%, var(--paper-card))" : "var(--paper-card)",
                    cursor:"pointer", fontSize:12, color:"var(--ink)",
                    display:"flex", flexDirection:"column", alignItems:"stretch", gap:2,
                  }}
                >
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}>
                    <span style={{fontWeight: isCurrent ? 600 : 400}}>{e.slug}</span>
                    {isCurrent && <span style={{
                      fontSize:9, textTransform:"uppercase", letterSpacing:"0.06em",
                      padding:"1px 6px", borderRadius:999,
                      background:"var(--ember)", color:"var(--paper-card-2)", fontWeight:700,
                    }}>current</span>}
                  </div>
                  {when && <div style={{fontSize:10.5, color:"var(--ink-4)"}}>{when}</div>}
                </button>
              );
            })}
          </div>
          {loadError && (
            <div style={{marginTop:10, fontSize:11, color:"var(--alarm, #b05656)", padding:"6px 8px", border:"1px solid color-mix(in oklab, #b05656 30%, transparent)", borderRadius:6, background:"color-mix(in oklab, #b05656 6%, transparent)"}}>
              {loadError}
            </div>
          )}
          <button
            onClick={refreshList}
            style={{
              marginTop:10, width:"100%", padding:"6px 10px", borderRadius:6,
              border:"1px solid var(--rule)", background:"var(--paper-card)",
              color:"var(--ink-3)", fontSize:11, cursor:"pointer",
              fontFamily:"var(--font-body)",
            }}
            title="Re-read the briefings folder">↻ Refresh</button>
        </div>

        {/* Right: rendered briefing */}
        <div style={{
          border: "1px solid var(--rule-2)", borderRadius: 10, padding: "22px 28px",
          background: "var(--paper-card)", boxShadow: "var(--shadow-soft)",
        }}>
          {!briefing ? (
            <div style={{padding:"60px 20px", textAlign:"center", color:"var(--ink-4)"}}>
              <div style={{fontSize:18, fontFamily:"var(--font-display)", marginBottom:8, color:"var(--ink-3)"}}>
                No briefing loaded yet.
              </div>
              <div style={{fontSize:12}}>
                The scheduled Oracle Sweep will drop today's briefing at <code>summaries/daily_briefings/{today}.md</code> — or seed one by hand if you want to test.
              </div>
            </div>
          ) : (
            <div style={{
              fontSize: 13.5, lineHeight: 1.65, color: "var(--ink-2)",
              fontFamily: "var(--font-display)", wordBreak: "break-word",
            }}><Markdown text={briefing.body}/></div>
          )}
        </div>
      </div>

      <div style={{marginTop:20, display:"flex", gap:8}}>
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
      </div>
    </div>
  );
}


// ═══════════════════ CHAT ═══════════════════
// Multi-turn conversation with the active AI provider.
// After every turn a reflection pass writes structured metadata to
// _ledger/chat_reflections.jsonl and (when actionable) auto-appends
// an inbox note. Conversations persist across reloads.
function ChatScreen({ go }) {
  const CHAT = window.SecretaryChat;
  const [chats, setChats] = useState(() => (CHAT ? CHAT.all() : []));
  const [activeId, setActiveId] = useState(() => (CHAT ? (CHAT.activeId() || (CHAT.all()[0] && CHAT.all()[0].id)) : null));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!CHAT) return;
    const unsub = CHAT.subscribe((list) => setChats([...list]));
    return unsub;
  }, []);

  // If the grid handed us a seed ("Edit with Rodbot" on a cell), spin up a
  // fresh chat pinned to that block and drop the opening line into the draft.
  useEffect(() => {
    if (!CHAT) return;
    const seed = window.SecretaryChatSeed;
    if (!seed) return;
    window.SecretaryChatSeed = null;
    const c = CHAT.newChat();
    if (c && seed.cell) {
      c.title = `Edit · ${seed.cell.headline || "cell"}`.slice(0, 80);
      c.context = {
        kind: "grid_cell_edit",
        gridId: seed.gridId,
        cellId: seed.cell.id,
        headline: seed.cell.headline,
        preview: seed.cell.preview,
        detail: seed.cell.detail,
      };
    }
    setActiveId(c.id);
    setDraft(seed.opening || "");
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [activeId, chats, busy]);

  const active = activeId ? chats.find(c => c.id === activeId) : null;

  const newChat = () => {
    const c = CHAT.newChat();
    setActiveId(c.id);
    setDraft("");
  };
  const pick = (id) => { CHAT.setActiveId(id); setActiveId(id); };
  const del = (id) => {
    if (!confirm("Archive this conversation? Reflections in the ledger are preserved.")) return;
    CHAT.archive(id);
    if (activeId === id) {
      const remaining = CHAT.all();
      setActiveId(remaining[0] ? remaining[0].id : null);
    }
  };

  // ── Attachments: images dragged / pasted / picked into the chat input ──
  const [attachments, setAttachments] = useState([]); // pending (not yet sent)
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const ingestFiles = async (files) => {
    // Accept anything the server can write — images, PDFs, text, code,
    // CSVs, JSONs, markdown, archives. Server has a 25MB-per-file cap and
    // uses the filename's own extension when the MIME type is unknown.
    const ALLOW_RX = /^(image\/|application\/(pdf|json|x-yaml|xml|zip|x-tar|x-gzip|vnd\.|msword|vnd\.openxmlformats)|text\/)/;
    const ALLOW_EXT = /\.(pdf|csv|tsv|json|jsonl|md|markdown|txt|log|yaml|yml|xml|html|htm|js|jsx|ts|tsx|py|rb|go|rs|java|kt|swift|c|cpp|h|hpp|cs|php|sh|sql|toml|ini|env|dockerfile|docx|xlsx|pptx|zip|tar|gz)$/i;
    const list = Array.from(files || []).filter(f => {
      if (!f) return false;
      if (ALLOW_RX.test(f.type || "")) return true;
      if (ALLOW_EXT.test(f.name || "")) return true;
      // Last-chance: if the browser couldn't sniff a type but the file
      // is small (<2MB), let it through — server enforces real limits.
      return !f.type && f.size && f.size < 2 * 1024 * 1024;
    });
    if (!list.length) return;
    setUploading(true);
    try {
      for (const f of list) {
        try {
          const meta = await CHAT.uploadFile(f);
          setAttachments(prev => [...prev, meta]);
        } catch (e) {
          console.warn("[chat] upload failed:", e.message);
          alert("Upload failed: " + e.message);
        }
      }
    } finally { setUploading(false); }
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
      await ingestFiles(e.dataTransfer.files);
    }
  };
  const onDragOver = (e) => { e.preventDefault(); if (!dragOver) setDragOver(true); };
  const onDragLeave = (e) => { e.preventDefault(); setDragOver(false); };

  const onPaste = async (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    const files = [];
    for (const it of items) {
      if (it.kind === "file") {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) {
      e.preventDefault();
      await ingestFiles(files);
    }
  };

  const removeAttachment = (idx) => setAttachments(a => a.filter((_, i) => i !== idx));

  const send = async () => {
    const hasText = !!draft.trim();
    const hasAtt = attachments.length > 0;
    if ((!hasText && !hasAtt) || busy) return;
    setBusy(true);
    try {
      let cid = activeId;
      if (!cid) {
        const c = CHAT.newChat();
        cid = c.id; setActiveId(cid);
      }
      const text = draft.trim();
      const atts = attachments;
      setDraft("");
      setAttachments([]);
      await CHAT.send({ chatId: cid, text, attachments: atts });
    } catch (e) {
      alert("Send failed: " + e.message);
    } finally { setBusy(false); }
  };

  // Per-turn actions: convert an assistant reply into something actionable.
  // Reply content is always text (assistant doesn't attach) — but we still
  // run it through textOf() for safety.
  const sendToInbox = async (turn) => {
    if (!window.SecretaryInbox) return;
    try {
      const text = CHAT.textOf(turn.content);
      await window.SecretaryInbox.append({
        kind: "note", text: text.slice(0, 2000),
        source: { screen: "chat", chat_id: activeId, from: "assistant-turn" },
      });
      alert("Saved to inbox.");
    } catch (e) { alert(e.message); }
  };
  const delegateThis = async (turn) => {
    if (!window.SecretaryDelegator) return;
    try {
      const text = CHAT.textOf(turn.content);
      await sendToDelegationsDraft({
        text,
        label: "From chat: " + (text.slice(0, 40) || "(untitled)"),
        source: { surface: "chat_fullscreen", route: "chat", entity: { type: "assistant_turn", chat_id: activeId } },
        policy: { target: "github", intent: "read", approval_required: false },
        mode: "safe",
        context: { chat_id: activeId, from: "assistant-turn" },
      });
      alert("Saved to Delegations draft.");
      go.push("delegations");
    } catch (e) { alert(e.message); }
  };

  const fmtTime = (iso) => {
    try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso; }
  };

  // ─── /chat polish audit render ─────────────────────────────────────────
  // Editorial, operator-voice, considered. Assistant replies render as page
  // prose (no bubble). User messages are margin-note containers with a
  // burgundy voice-accent left rule. Tool references render as a footnote
  // strip (§3 unnumbered fallback — per-turn tool-use data is not yet
  // captured by chat.js; see change-log TODOs). Streaming uses a pulsing
  // underscore in the meta strip, not spinners or typing dots.
  const sendReady = (draft.trim().length > 0 || attachments.length > 0) && !busy;

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">chat · multi-turn · reflections → bedrock</div>
          <h1>{active ? active.title : "What's up, Rodbot? What should we get into?"}</h1>
        </div>
        <div className="meta">
          <span><b>chats</b> {chats.length}</span>
          {active && <span><b>turns</b> {active.turns.length}</span>}
        </div>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"240px 1fr", gap:20, alignItems:"start"}}>
        {/* ── Left: chat history sidebar (§5) ─────────────────────────── */}
        <div>
          <button className="btn primary" style={{width:"100%", marginBottom:10}} onClick={newChat}>
            <Icon name="plus" size={14}/> New chat
          </button>
          <div style={{display:"flex", flexDirection:"column", gap:2, maxHeight:"70vh", overflowY:"auto"}}>
            {chats.length === 0 && (
              <div style={{fontSize:12, color:"var(--ink-4)", padding:"14px 0", textAlign:"center", fontFamily:"var(--font-mono)", letterSpacing:"0.04em"}}>no chats yet</div>
            )}
            {chats.map(c => {
              const sel = c.id === activeId;
              return (
                <button key={c.id} onClick={() => pick(c.id)}
                  className={sel ? "chat-history-item active" : "chat-history-item"}>
                  <div className="title">{c.title}</div>
                  <div className="byline">{c.turns.length} turns · {fmtTime(c.lastTurnAt || c.createdAt)}</div>
                  <span className="dismiss"
                    onClick={(e) => { e.stopPropagation(); del(c.id); }}
                    title="Archive">
                    <Icon name="x" size={12}/>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Right: conversation surface (§1–§4, §6, §7) ─────────────── */}
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          style={{
            display:"flex", flexDirection:"column", minHeight:"64vh",
            position: "relative",
            border: dragOver ? "1px dashed color-mix(in oklab, var(--ink) 35%, transparent)" : "1px solid transparent",
            borderRadius: 6,
            background: dragOver ? "color-mix(in oklab, var(--ink) 3%, transparent)" : "transparent",
            transition: "background 120ms ease, border-color 120ms ease",
          }}
        >
          {/* Silent drop — no overlay text. The dragOver style on the parent
              (subtle ink wash + dashed border) is the only feedback while
              dragging. The whole widget accepts files. */}
          <div ref={scrollRef} className="chat-column">
            {!active || active.turns.length === 0 ? (
              <div className="chat-empty">
                {active ? "What's on your mind?" : "Create a chat to begin."}
              </div>
            ) : active.turns.map((t, i) => {
              const mine = t.role === "user";
              const sys  = t.role === "system";
              // Multimodal turn splits into text parts and image parts.
              const parts = Array.isArray(t.content) ? t.content : null;
              const text = parts ? parts.filter(p => p.type === "text").map(p => p.text || "").join("\n").trim()
                                 : (typeof t.content === "string" ? t.content : "");
              const images = parts ? parts.filter(p => p.type === "image") : [];
              const isLast = i === active.turns.length - 1;

              if (mine || sys) {
                // User / system → cream container with burgundy voice-accent rule.
                return (
                  <div key={i} className={sys ? "chat-turn system" : "chat-turn user"}>
                    {images.length > 0 && (
                      <div style={{display:"flex", flexWrap:"wrap", gap:6, maxWidth:"70%", justifyContent:"flex-end"}}>
                        {images.map((img, j) => (
                          <a key={j} href={img.url} target="_blank" rel="noopener" title={img.name || "attachment"}>
                            <img src={img.url} alt={img.name || "attachment"}
                              style={{maxWidth: 220, maxHeight: 220, objectFit:"cover", borderRadius: 4, border:"1px solid var(--rule-2)", display:"block"}}
                            />
                          </a>
                        ))}
                      </div>
                    )}
                    {text && (
                      <div className={sys ? "chat-message-user system" : "chat-message-user"}>
                        {text}
                      </div>
                    )}
                    <div className="chat-byline">{sys ? "system" : "you"} · {fmtTime(t.t)}</div>
                  </div>
                );
              }

              // Assistant → flowing page prose, meta strip above, footnote strip below.
              // Per-turn tool-use metadata is not captured by chat.js today
              // (see change-log TODO). Meta strip shows what we have; footnote
              // strip renders the inbox/delegate affordances as citations.
              return (
                <div key={i} className="chat-turn assistant">
                  <div className="chat-meta-strip">
                    <span>rodbot</span>
                    <span className="sep">·</span>
                    <span>{fmtTime(t.t)}</span>
                    {t.route && (
                      <React.Fragment>
                        <span className="sep">·</span>
                        <em>via {t.route}</em>
                      </React.Fragment>
                    )}
                  </div>
                  {images.length > 0 && (
                    <div style={{display:"flex", flexWrap:"wrap", gap:6, maxWidth:"72ch"}}>
                      {images.map((img, j) => (
                        <a key={j} href={img.url} target="_blank" rel="noopener" title={img.name || "attachment"}>
                          <img src={img.url} alt={img.name || "attachment"}
                            style={{maxWidth: 220, maxHeight: 220, objectFit:"cover", borderRadius: 4, border:"1px solid var(--rule-2)", display:"block"}}
                          />
                        </a>
                      ))}
                    </div>
                  )}
                  {text && (
                    <div className="md chat-md chat-assistant-body">
                      <Markdown text={text}/>
                    </div>
                  )}
                  {/* Pieces grounding pull quote — sage tone, "from your
                      activity". Rendered inline below the reply so the
                      audience sees Rodbot's answer next to the temporal
                      context that informed it. */}
                  {t.grounding && <PiecesGroundingFooter grounding={t.grounding} />}
                  <div className="chat-footnote-row">
                    <button className="chat-footnote" onClick={() => sendToInbox(t)} title="Save this reply to the inbox">
                      <span className="marker">·</span>
                      <Icon name="inbox" size={11}/>
                      <span>save to inbox</span>
                    </button>
                    <button className="chat-footnote" onClick={() => delegateThis(t)} title="Dispatch this reply as a Claude Code task">
                      <span className="marker">·</span>
                      <Icon name="terminal" size={11}/>
                      <span>delegate to claude code</span>
                    </button>
                  </div>
                  {!isLast && <div className="chat-rule" />}
                </div>
              );
            })}
            {busy && (
              <div className="chat-turn assistant">
                <div className="chat-meta-strip">
                  <span>rodbot</span>
                  <span className="sep">·</span>
                  <em>thinking</em>
                  <span className="chat-cursor" />
                </div>
                {/* Animated trace — replaces the static "thinking" with
                    contextual flavor steps when prompt-enhance is on, or
                    a generic rotating deck when it's off. */}
                <ThinkingTrace busy={busy} chatId={activeId} />
              </div>
            )}
          </div>

          {/* ── Composer (§4) ─────────────────────────────────────────── */}
          <div style={{padding:"12px 0 0 0"}}>
            {attachments.length > 0 && (
              <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:10}}>
                {attachments.map((a, i) => {
                  const isImage = a.mime && a.mime.startsWith("image/");
                  const fname = a.original_filename || a.filename || "file";
                  const ext = (fname.split(".").pop() || "").toLowerCase().slice(0, 5) || "file";
                  const kb = a.size ? (a.size < 1024 ? a.size + "b" : a.size < 1024*1024 ? Math.round(a.size/1024) + "kb" : (a.size/1024/1024).toFixed(1) + "mb") : "";
                  // File-type tone tile — color-coded by family for at-a-glance scanning.
                  const TYPE_TONE = {
                    pdf:  { bg: "var(--rose-bg)",  ink: "var(--rose-ink)"  },
                    csv:  { bg: "var(--mint-bg)",  ink: "var(--mint-ink)"  },
                    tsv:  { bg: "var(--mint-bg)",  ink: "var(--mint-ink)"  },
                    xlsx: { bg: "var(--mint-bg)",  ink: "var(--mint-ink)"  },
                    json: { bg: "var(--lav-bg)",   ink: "var(--lav-ink)"   },
                    jsonl:{ bg: "var(--lav-bg)",   ink: "var(--lav-ink)"   },
                    yaml: { bg: "var(--lav-bg)",   ink: "var(--lav-ink)"   },
                    yml:  { bg: "var(--lav-bg)",   ink: "var(--lav-ink)"   },
                    md:   { bg: "var(--peach-bg)", ink: "var(--peach-ink)" },
                    txt:  { bg: "var(--peach-bg)", ink: "var(--peach-ink)" },
                    log:  { bg: "var(--peach-bg)", ink: "var(--peach-ink)" },
                    docx: { bg: "var(--sky-bg)",   ink: "var(--sky-ink)"   },
                    js:   { bg: "var(--lemon-bg)", ink: "var(--lemon-ink)" },
                    jsx:  { bg: "var(--lemon-bg)", ink: "var(--lemon-ink)" },
                    ts:   { bg: "var(--lemon-bg)", ink: "var(--lemon-ink)" },
                    tsx:  { bg: "var(--lemon-bg)", ink: "var(--lemon-ink)" },
                    py:   { bg: "var(--lemon-bg)", ink: "var(--lemon-ink)" },
                  };
                  const tone = TYPE_TONE[ext] || { bg: "var(--paper-2)", ink: "var(--ink-3)" };
                  return (
                    <div key={i} style={{position:"relative"}} title={`${fname}${kb ? " · " + kb : ""}`}>
                      {isImage ? (
                        <img src={a.url} alt={fname}
                          style={{width:64, height:64, objectFit:"cover", borderRadius:6, border:"1px solid var(--rule-2)", display:"block"}}
                        />
                      ) : (
                        <div style={{
                          width:64, height:64, borderRadius:6, border:"1px solid var(--rule-2)",
                          background: tone.bg, color: tone.ink,
                          display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                          padding:"4px", overflow:"hidden",
                          boxShadow:"inset 0 1px 0 rgba(255,255,255,0.4)",
                        }}>
                          <div style={{fontFamily:"var(--font-mono)", fontSize:11, fontWeight:600, letterSpacing:"0.04em", textTransform:"uppercase", lineHeight:1}}>
                            {ext}
                          </div>
                          <div style={{
                            fontFamily:"var(--font-body)", fontSize:9, marginTop:4,
                            opacity:0.85, lineHeight:1.15, textAlign:"center",
                            overflow:"hidden", display:"-webkit-box",
                            WebkitLineClamp:2, WebkitBoxOrient:"vertical", maxWidth:56,
                          }}>
                            {fname.replace(new RegExp("\\." + ext + "$", "i"), "").slice(0, 24)}
                          </div>
                          {kb && (
                            <div style={{fontFamily:"var(--font-mono)", fontSize:8, opacity:0.65, marginTop:2}}>{kb}</div>
                          )}
                        </div>
                      )}
                      <button onClick={() => removeAttachment(i)}
                        title="Remove"
                        style={{position:"absolute", top:-6, right:-6, width:18, height:18, borderRadius:"50%", border:"1px solid var(--rule-2)", background:"var(--paper)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, color:"var(--ink-3)"}}
                      >
                        <Icon name="x" size={10}/>
                      </button>
                    </div>
                  );
                })}
                {uploading && <div style={{alignSelf:"center", fontSize:10, color:"var(--ink-4)", fontFamily:"var(--font-mono)", letterSpacing:"0.04em"}}>uploading…</div>}
              </div>
            )}
            <div className="chat-composer">
              <button
                className="chat-plus"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                title="Attach a file (image, PDF, CSV, JSON, text, code — 25MB max)"
              >
                <Icon name="plus" size={14}/>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf,text/*,application/json,application/x-yaml,application/xml,.csv,.tsv,.md,.markdown,.log,.yaml,.yml,.toml,.env,.js,.jsx,.ts,.tsx,.py,.rb,.go,.rs,.java,.kt,.swift,.c,.cpp,.h,.hpp,.cs,.php,.sh,.sql,.html,.htm,.xml,.docx,.xlsx,.pptx,.zip"
                multiple
                style={{display:"none"}}
                onChange={(e) => { ingestFiles(e.target.files); e.target.value = ""; }}
              />
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onPaste={onPaste}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); send(); } }}
                placeholder="What's up, Rodbot?"
                rows={3}
              />
              <button
                className={sendReady ? "chat-send ready" : "chat-send"}
                onClick={send}
                disabled={!sendReady}
                title="Send (⌘/Ctrl+Enter)"
              >
                <Icon name="send" size={14}/>
              </button>
            </div>
            <div className="chat-composer-helper">⌘/ctrl+enter to send · drop or paste images</div>
          </div>
        </div>
      </div>
    </div>
  );
}



// ═══════════════════ ACTIVITY (Pieces LTM) ═══════════════════
// Surfaces the hourly (server-side) + 10-min (browser-side) sweeps of Pieces
// observing the team's actual computer activity — every app, browser, IDE, chat.
// Each sweep is a durable line on _ledger/pieces_sweeps.jsonl.
// ═══════════════════════════════════════════════════════════════════════
//  PIECES ACTIVITY — "Everything you've actually been doing."
//  ───────────────────────────────────────────────────────────────────────
//  Reads from Pieces LTM via the local MCP server (port 39300). Each sweep
//  is one query against ask_pieces_ltm; the response is a JSON blob with
//  workstream_summaries (AI TLDRs of past sessions) and workstream_events
//  (browser/vision/clipboard captures with extracted text + people).
//
//  This screen parses that blob and renders it in deck vocabulary:
//    • SAGE cards     for summaries  (rod · steady recap)
//    • SKY cards      for browser events
//    • LAVENDER cards for vision/screen captures (sylvia · memory)
//    • LEMON cards    for clipboard events       (ideas · top of mind)
//    • PEACH chips    for people mentioned       (warmth · text)
//
//  When the JSON doesn't parse (older sweeps, raw responses), we fall
//  back to a "show raw" toggle. The 39 Pieces tools available via MCP are
//  surfaced in a side panel so the operator (and the demo audience) can
//  see the full surface area at a glance.
// ═══════════════════════════════════════════════════════════════════════

// The 39 tools the Pieces MCP server exposes, grouped by purpose. Used
// for the side panel + click-to-prefill the ask bar with a tool-targeted
// query. Names match the exact MCP tool identifiers.
const PIECES_TOOLS = [
  { group: "Ask",        tone: "sage",  items: [
    { name: "ask_pieces_ltm",            hint: "Free-form question against everything Pieces has seen" },
    { name: "create_pieces_memory",      hint: "Persist a new memory into Pieces LTM" },
  ]},
  { group: "Full-text search", tone: "sky", items: [
    { name: "workstream_summaries_full_text_search", hint: "Find AI TLDRs by keyword" },
    { name: "workstream_events_full_text_search",    hint: "Find raw activity events by keyword" },
    { name: "conversations_full_text_search",        hint: "Search past chat conversations" },
    { name: "conversation_messages_full_text_search",hint: "Search inside individual messages" },
    { name: "tags_full_text_search",                 hint: "Find tagged items" },
    { name: "annotations_full_text_search",          hint: "Search highlights & notes" },
    { name: "persons_full_text_search",              hint: "Find people you've encountered" },
    { name: "anchors_full_text_search",              hint: "Search saved anchor points" },
    { name: "websites_full_text_search",             hint: "Search browser history" },
    { name: "hints_full_text_search",                hint: "Search workflow hints" },
    { name: "models_full_text_search",               hint: "Search AI models referenced" },
    { name: "wpe_sources_full_text_search",          hint: "Search workflow process events" },
    { name: "wpe_source_windows_full_text_search",   hint: "Search WPE source windows" },
    { name: "entities_full_text_search",             hint: "Search recognised entities" },
  ]},
  { group: "Vector search", tone: "lav", items: [
    { name: "workstream_summaries_vector_search", hint: "Semantic search over TLDRs" },
    { name: "workstream_events_vector_search",    hint: "Semantic search over events" },
    { name: "hints_vector_search",                hint: "Semantic search over hints" },
    { name: "tags_vector_search",                 hint: "Semantic search over tags" },
    { name: "materials_vector_search",            hint: "Semantic search over materials" },
  ]},
  { group: "Snapshot",   tone: "peach", items: [
    { name: "workstream_summaries_batch_snapshot", hint: "Bulk export TLDRs by id" },
    { name: "workstream_events_batch_snapshot",    hint: "Bulk export events by id" },
    { name: "conversations_batch_snapshot",        hint: "Bulk export chats" },
    { name: "conversation_messages_batch_snapshot",hint: "Bulk export individual messages" },
    { name: "tags_batch_snapshot",                 hint: "Bulk export tags" },
    { name: "annotations_batch_snapshot",          hint: "Bulk export highlights" },
    { name: "persons_batch_snapshot",              hint: "Bulk export people" },
    { name: "anchors_batch_snapshot",              hint: "Bulk export anchors" },
    { name: "anchor_points_batch_snapshot",        hint: "Bulk export anchor points" },
    { name: "ranges_batch_snapshot",               hint: "Bulk export time ranges" },
    { name: "websites_batch_snapshot",             hint: "Bulk export websites" },
    { name: "hints_batch_snapshot",                hint: "Bulk export hints" },
    { name: "models_batch_snapshot",               hint: "Bulk export models" },
    { name: "entities_batch_snapshot",             hint: "Bulk export entities" },
    { name: "wpe_sources_batch_snapshot",          hint: "Bulk export WPE sources" },
    { name: "wpe_source_windows_batch_snapshot",   hint: "Bulk export WPE windows" },
    { name: "extract_temporal_range",              hint: "Extract activity for a specific time window" },
    { name: "material_identifiers",                hint: "List material identifiers" },
  ]},
];

// Parse the combined_string field that Pieces returns. The shape is
// reliable: each line is "Key: value", with "Extracted text:" being a
// freeform tail. We pull out the structured fields the UI needs.
function parsePiecesEvent(combined) {
  const out = { source: null, app: null, window: null, url: null, people: [], extracted: null, last_accessed: null };
  if (!combined || typeof combined !== "string") return out;
  const lines = combined.split("\n");
  let inExtracted = false;
  const extracted = [];
  for (const ln of lines) {
    if (inExtracted) { extracted.push(ln); continue; }
    const colon = ln.indexOf(":");
    if (colon < 0) continue;
    const k = ln.slice(0, colon).trim().toLowerCase();
    const v = ln.slice(colon + 1).trim();
    if (k === "event source")        out.source = v.toLowerCase();
    else if (k === "app title")      out.app = v;
    else if (k === "window title")   out.window = v;
    else if (k === "url")            out.url = v && v !== "null" ? v : null;
    else if (k === "last accessed")  out.last_accessed = v;
    else if (k === "people mentioned") {
      // "Andre Raw (role: collaborator, evidence: ..., confidence: medium), Jake Aaron (role: ...)"
      const parts = v.split(/,(?=\s*[A-Z])/);
      out.people = parts.map(p => {
        const nameMatch = p.match(/^([^(]+)/);
        return nameMatch ? nameMatch[1].trim() : null;
      }).filter(Boolean);
    }
    else if (k === "extracted text") {
      extracted.push(v);
      inExtracted = true;
    }
  }
  out.extracted = extracted.join("\n").trim() || null;
  return out;
}

// Pull TLDR text out of a summary's combined_string. The pattern is
// "...### **TLDR**\n<the actual TLDR>..." — sometimes stops at a blank
// line, sometimes runs to end. Be generous.
function parsePiecesSummary(combined) {
  if (!combined || typeof combined !== "string") return { tldr: null, range: null };
  const tldrMatch = combined.match(/(?:###\s*\*?\*?TLDR\*?\*?|TLDR)\s*[:\n]+([\s\S]+?)(?:\n###|$)/i);
  const rangeMatch = combined.match(/Summarized time-range:\s*(.+)/i);
  return {
    tldr: tldrMatch ? tldrMatch[1].trim() : combined.trim().slice(0, 600),
    range: rangeMatch ? rangeMatch[1].trim() : null,
  };
}

// Map an event source to a deck tone.
const EVENT_TONE = { browser: "sky", vision: "lav", clipboard: "lemon", screenshot: "lav", default: "sage" };

// Read the user's preferred Pieces chat LLM from localStorage. The Settings
// → Pieces section writes this; the Activity screen + Briefing ribbon read
// it on every Pieces call so the model can swap without prop drilling.
function getPiecesModel() {
  try {
    const t = JSON.parse(localStorage.getItem("secretary.tweaks") || "{}");
    return t.piecesModel || "claude-sonnet-4-5";
  } catch { return "claude-sonnet-4-5"; }
}

// Normalize a Pieces response into the shared shape rendered by
// <PiecesPayloadView>. Accepts EITHER a raw string (will JSON-parse) or
// an already-parsed object. Returns:
//   { kind: "structured" | "json" | "text" | "empty",
//     summaries, events, people, raw, data }
function _normalizePieces(raw, data) {
  if (!raw && !data) return { kind: "empty" };
  let j = data;
  if (!j && typeof raw === "string") {
    try { j = JSON.parse(raw); } catch { /* fall through */ }
  }
  if (j && typeof j === "object") {
    const sums = Array.isArray(j.summaries) ? j.summaries.map(s => ({
      id: (s && s.id) || Math.random().toString(36).slice(2),
      score: s && s.score,
      from: (s && s.range && s.range.from && s.range.from.readable) || null,
      to:   (s && s.range && s.range.to   && s.range.to.readable)   || null,
      ...parsePiecesSummary(s && s.combined_string),
    })) : [];
    const evs = Array.isArray(j.events) ? j.events.map(e => ({
      id: (e && e.id) || Math.random().toString(36).slice(2),
      score: e && e.score,
      url: e && e.browser_url,
      app: e && e.app_title,
      window: e && e.window_title,
      ...parsePiecesEvent(e && e.combined_string),
    })) : [];
    if (sums.length || evs.length) {
      // collect distinct people across events, sort by frequency
      const seen = new Map();
      for (const ev of evs) for (const p of (ev.people || [])) {
        const key = p.toLowerCase();
        seen.set(key, (seen.get(key) || 0) + 1);
      }
      const people = [...seen.entries()].sort((a,b) => b[1] - a[1]).map(([n, c]) => ({
        name: n.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" "),
        count: c,
      }));
      return { kind: "structured", summaries: sums, events: evs, people, raw, data: j };
    }
    // Parsed but unfamiliar — pretty-print
    return { kind: "json", raw, data: j };
  }
  // Couldn't parse — render as plain text (likely an LLM answer)
  return { kind: "text", raw: String(raw || "") };
}

// Render structured cards (people · summaries · events) without any
// surrounding chrome. Compact mode shrinks padding for use inside the
// askResult admo where horizontal space is tighter.
function PiecesStructuredCards({ payload, compact }) {
  const padBlock = compact ? "10px 14px" : "16px 20px";
  return (
    <>
      {payload.people && payload.people.length > 0 && (
        <div style={{marginBottom: compact ? 12 : 18}}>
          <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6}}>
            People in the loop
          </div>
          <div style={{display:"flex", flexWrap:"wrap", gap:6}}>
            {payload.people.map(p => (
              <span key={p.name} className="chip-peach" style={{
                display:"inline-flex", alignItems:"center", gap:5,
                padding:"4px 10px", borderRadius:999,
                fontSize:11, fontWeight:500, letterSpacing:"0.02em",
              }}>
                {p.name}
                {p.count > 1 && <span style={{opacity:0.6, fontSize:9, fontFamily:"var(--font-mono)"}}>×{p.count}</span>}
              </span>
            ))}
          </div>
        </div>
      )}
      {payload.summaries && payload.summaries.length > 0 && (
        <div style={{marginBottom: compact ? 12 : 22}}>
          <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6}}>
            Workstream summaries · {payload.summaries.length}
          </div>
          <div style={{display:"grid", gap: compact ? 8 : 12}}>
            {payload.summaries.map(s => (
              <div key={s.id} className="card-tone card-sage" style={{padding: padBlock}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:8}}>
                  <div style={{fontSize:10, fontFamily:"var(--font-mono)", letterSpacing:"0.05em", textTransform:"uppercase", opacity:0.75}}>
                    {s.range || (s.from || s.to ? `${s.from || "?"} → ${s.to || "?"}` : "summary")}
                  </div>
                  {typeof s.score === "number" && (
                    <div style={{fontSize:9, fontFamily:"var(--font-mono)", opacity:0.55}}>
                      score {s.score.toFixed(2)}
                    </div>
                  )}
                </div>
                <div style={{fontFamily:"var(--font-display)", fontSize: compact ? 14 : 16, lineHeight:1.5, fontWeight:400}}>
                  {s.tldr}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {payload.events && payload.events.length > 0 && (
        <div>
          <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6}}>
            Captured events · {payload.events.length}
          </div>
          <div style={{display:"grid", gap: compact ? 8 : 10}}>
            {payload.events.map(ev => {
              const tone = EVENT_TONE[ev.source] || EVENT_TONE.default;
              return (
                <div key={ev.id} className={`card-tone card-${tone}`} style={{padding: padBlock}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6, gap:10}}>
                    <div style={{display:"flex", alignItems:"center", gap:6, minWidth:0}}>
                      <span className={`dot-tone dot-${tone}`} />
                      <span style={{fontFamily:"var(--font-mono)", fontSize:9, letterSpacing:"0.1em", textTransform:"uppercase", opacity:0.75}}>
                        {ev.source || "event"}
                      </span>
                      {ev.app && (
                        <span style={{fontFamily:"var(--font-mono)", fontSize:9, letterSpacing:"0.04em", opacity:0.7}}>
                          · {ev.app}
                        </span>
                      )}
                    </div>
                    {ev.last_accessed && (
                      <span style={{fontSize:9, fontFamily:"var(--font-mono)", opacity:0.55, whiteSpace:"nowrap"}}>
                        {ev.last_accessed}
                      </span>
                    )}
                  </div>
                  {ev.window && (
                    <div style={{fontFamily:"var(--font-display)", fontSize: compact ? 14 : 16, fontWeight:500, letterSpacing:"-0.01em", lineHeight:1.25, marginBottom:4}}>
                      {ev.window}
                    </div>
                  )}
                  {ev.url && (
                    <div style={{fontSize:10, fontFamily:"var(--font-mono)", opacity:0.7, wordBreak:"break-all", marginBottom:6}}>
                      {ev.url}
                    </div>
                  )}
                  {ev.extracted && (
                    <div style={{
                      fontSize: compact ? 12 : 13, lineHeight:1.5, opacity:0.92,
                      borderLeft:"2px solid currentColor",
                      paddingLeft:10, marginTop:6,
                      maxHeight: compact ? 100 : 160, overflow:"auto",
                      fontStyle:"italic", fontFamily:"var(--font-display)",
                    }}>
                      {ev.extracted.length > 600 ? ev.extracted.slice(0, 600) + " …" : ev.extracted}
                    </div>
                  )}
                  {ev.people && ev.people.length > 0 && (
                    <div style={{display:"flex", flexWrap:"wrap", gap:5, marginTop:8}}>
                      {ev.people.map(p => (
                        <span key={p} style={{
                          fontSize:10, padding:"1px 8px", borderRadius:999,
                          background:"rgba(255,255,255,0.4)", border:"1px solid currentColor",
                          fontFamily:"var(--font-body)", fontWeight:500,
                        }}>{p}</span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// Pretty-print arbitrary JSON — used when Pieces returns a parseable
// shape that isn't summaries/events (e.g. results from full_text_search,
// batch_snapshot). Code-block deck style on ink background.
function PiecesPrettyJSON({ data }) {
  let txt;
  try { txt = JSON.stringify(data, null, 2); } catch { txt = String(data); }
  return (
    <pre style={{
      background:"var(--ink)", color:"var(--paper)",
      borderRadius:10, padding:"16px 18px", margin:0,
      fontFamily:"var(--font-code)", fontSize:11.5, lineHeight:1.55,
      whiteSpace:"pre-wrap", wordBreak:"break-word",
      maxHeight:360, overflow:"auto",
    }}>{txt}</pre>
  );
}

// Plain-text answer (the LLM-style narrative reply from ask_pieces_ltm
// when it doesn't return JSON). Rendered as italic Newsreader so it
// reads like a quote, not raw output.
function PiecesPlainAnswer({ text }) {
  return (
    <div style={{
      fontFamily:"var(--font-display)", fontSize:14.5, lineHeight:1.6,
      color:"var(--ink-2)", whiteSpace:"pre-wrap",
      maxHeight:280, overflow:"auto",
    }}>{text || "(empty)"}</div>
  );
}

// Top-level renderer that picks the right view for whatever Pieces gave
// us. Use this anywhere a Pieces response needs to land — sweep bodies,
// ask answers, future Rodbot panels, etc.
function PiecesPayloadView({ raw, data, compact = false, defaultRaw = false }) {
  const [showRaw, setShowRaw] = useState(defaultRaw);
  const payload = useMemo(() => _normalizePieces(raw, data), [raw, data]);

  if (payload.kind === "empty") {
    return <div style={{color:"var(--ink-4)", fontStyle:"italic", fontSize:13}}>(empty)</div>;
  }

  // Toggle between structured and raw view (for structured + json kinds)
  const toggleable = payload.kind === "structured" || payload.kind === "json";

  return (
    <div>
      {toggleable && (
        <div style={{display:"flex", justifyContent:"flex-end", marginBottom: compact ? 8 : 12}}>
          <button onClick={() => setShowRaw(v => !v)} style={{
            fontSize:10, padding:"4px 10px", borderRadius:999,
            border:"1px solid var(--rule)", background:"transparent",
            color:"var(--muted)", cursor:"pointer",
            fontFamily:"var(--font-mono)", letterSpacing:"0.05em",
            textTransform:"uppercase",
          }}>
            {showRaw ? "← structured" : "raw →"}
          </button>
        </div>
      )}
      {showRaw && payload.data ? <PiecesPrettyJSON data={payload.data} /> :
       showRaw && payload.raw  ? <PiecesPrettyJSON data={payload.raw} /> :
       payload.kind === "structured" ? <PiecesStructuredCards payload={payload} compact={compact} /> :
       payload.kind === "json"       ? <PiecesPrettyJSON data={payload.data} /> :
                                       <PiecesPlainAnswer text={payload.raw} />}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────
//  LIVE PIECES HEADER — homepage broadcast strip.
//  ───────────────────────────────────────────────────────────────────────
//  Per Jake's call: the homepage greeting strip becomes a slow rotating
//  ticker of what Pieces is actually seeing. Each card shows for ~7s
//  with a gentle 700ms fade-in, then the next one slides up. The deck is
//  rebuilt every 60s as Pieces lands fresh sweeps. Falls back to the
//  static greeting when Pieces is offline — homepage NEVER goes blank.
// ───────────────────────────────────────────────────────────────────────

function _synthSummaryTitle(tldr) {
  if (!tldr) return "Workstream summary";
  const t = tldr.trim();
  const focus = t.match(/(?:focus(?:ed)?\s+(?:on|around)|center(?:ed)?\s+on|dominat(?:ed)?\s+by|primarily\s+(?:on|engaged\s+in|involved))\s+(?:the\s+|a\s+)?([^.,;:\n()]{4,80})/i);
  if (focus) {
    let phrase = focus[1].trim().replace(/^(?:and|to|with|by|for|of)\s+/i, "");
    const words = phrase.split(/\s+/).slice(0, 7);
    if (words.length) return words.join(" ").replace(/[,;:]$/, "");
  }
  const proper = t.match(/\b([A-Z][a-zA-Z0-9]+(?:\s+[A-Z][a-zA-Z0-9]+){0,3})\b/);
  if (proper && proper[1].length >= 3 && proper[1].length <= 50) {
    if (!/^(The|A|An|This|That|When|Where|While)\b/.test(proper[1])) return proper[1];
  }
  const firstSentence = t.split(/[.!?]/)[0] || t;
  const words = firstSentence.replace(/^["'(]+/, "").split(/\s+/).slice(0, 6);
  return words.join(" ").replace(/[,;:]$/, "") + (words.length === 6 ? "…" : "");
}

function _buildPiecesHeadlinerDeck(payload, sweepTs) {
  const items = [];
  if (!payload || payload.kind !== "structured") return items;

  const niceWhen = (() => {
    if (!sweepTs) return "from the latest sweep";
    try {
      const m = Math.round((Date.now() - new Date(sweepTs).getTime()) / 60000);
      if (m < 1)  return "just now from pieces";
      if (m < 60) return `${m}m ago from pieces`;
      const h = Math.round(m / 60);
      if (h < 24) return `${h}h ago from pieces`;
      return `${Math.round(h / 24)}d ago from pieces`;
    } catch { return "from pieces"; }
  })();

  for (const s of (payload.summaries || []).slice(0, 5)) {
    if (!s.tldr) continue;
    const title = _synthSummaryTitle(s.tldr);
    const subtitle = s.tldr.length > 280 ? s.tldr.slice(0, 280).replace(/\s\S*$/, "") + "…" : s.tldr;
    const range = s.range || (s.from || s.to ? `${s.from || "?"} → ${s.to || "?"}` : "workstream summary");
    const score = typeof s.score === "number" ? ` · score ${s.score.toFixed(2)}` : "";
    items.push({ kind: "summary", title, subtitle, meta: `${niceWhen} · ${range}${score}`, tone: "sage" });
  }

  for (const ev of (payload.events || []).slice(0, 8)) {
    let title;
    if (ev.source === "browser" && ev.app) title = ev.app;
    else if (ev.source === "vision")        title = ev.window ? `Saw — ${ev.window}` : "On screen";
    else if (ev.source === "clipboard")     title = ev.window ? `Just clipped — ${ev.app || ev.window}` : "Just clipped";
    else                                    title = ev.window || ev.app || "Captured event";
    if (title.length > 60) title = title.slice(0, 60).replace(/\s\S*$/, "") + "…";

    let subtitle = "";
    if (ev.extracted)      subtitle = ev.extracted.length > 240 ? ev.extracted.slice(0, 240).replace(/\s\S*$/, "") + "…" : ev.extracted;
    else if (ev.window)    subtitle = ev.window;
    else if (ev.url)       subtitle = ev.url;

    const metaBits = [niceWhen, ev.source, ev.last_accessed, ev.people && ev.people.length ? `${ev.people.length} mentioned` : null].filter(Boolean);
    items.push({
      kind: "event", title, subtitle, meta: metaBits.join(" · "),
      tone: ev.source === "browser" ? "sky" : ev.source === "vision" ? "lav" : ev.source === "clipboard" ? "lemon" : "sage",
    });
  }

  if (payload.people && payload.people.length > 0) {
    const top = payload.people.slice(0, 6);
    const names = top.map(p => p.count > 1 ? `${p.name} ×${p.count}` : p.name).join(" · ");
    items.push({
      kind: "people", title: "People in the loop", subtitle: names,
      meta: `${niceWhen} · ${payload.people.length} ${payload.people.length === 1 ? "person" : "people"} mentioned in the latest sweep`,
      tone: "peach",
    });
  }

  // Interleave summary → event so the cycle stays varied.
  const sums = items.filter(i => i.kind === "summary");
  const evs  = items.filter(i => i.kind === "event");
  const ppl  = items.filter(i => i.kind === "people");
  const interleaved = [];
  const max = Math.max(sums.length, evs.length);
  for (let i = 0; i < max; i++) {
    if (sums[i]) interleaved.push(sums[i]);
    if (evs[i])  interleaved.push(evs[i]);
  }
  return [...interleaved, ...ppl];
}

function LivePiecesHeader({ greeting, instruct, meta }) {
  const [deck, setDeck] = useState([]);
  const [idx, setIdx] = useState(0);
  const [sweepTs, setSweepTs] = useState(null);
  const [piecesAvailable, setPiecesAvailable] = useState(true);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const [latestR, statusR] = await Promise.all([
          fetch("/api/pieces/sweeps/latest").then(r => r.ok ? r.json() : null).catch(() => null),
          fetch("/api/pieces/status").then(r => r.ok ? r.json() : null).catch(() => null),
        ]);
        if (!alive) return;
        if (statusR) setPiecesAvailable(!!statusR.available);
        if (latestR && latestR.ok && latestR.latest) {
          const payload = _normalizePieces(latestR.latest.raw, null);
          const built = _buildPiecesHeadlinerDeck(payload, latestR.latest.ts);
          if (built.length) {
            setDeck(prev => {
              if (prev.length === built.length && prev[0] && built[0] && prev[0].title === built[0].title) {
                return prev;
              }
              setIdx(0);
              return built;
            });
            setSweepTs(latestR.latest.ts);
          }
        }
      } catch {}
    };
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  useEffect(() => {
    if (deck.length <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % deck.length), 7000);
    return () => clearInterval(t);
  }, [deck.length]);

  if (deck.length === 0) {
    return (
      <div className="fp-teaching">
        <div className="fp-teaching-greeting">{greeting}</div>
        <div className="fp-teaching-instruct">{instruct}</div>
        <div className="fp-teaching-meta">
          {piecesAvailable ? `${meta} · pieces · listening for first sweep` : meta}
        </div>
      </div>
    );
  }

  const current = deck[idx];

  return (
    <div className="fp-teaching live-pieces-header" data-tone={current.tone}>
      <div className="live-pieces-indicator" title="Live from Pieces">
        <span className="live-pieces-dot" />
        <span className="live-pieces-label">live · pieces · {idx + 1}/{deck.length}</span>
      </div>
      <div key={`${sweepTs || "init"}-${idx}`} className="live-pieces-card">
        <div className="fp-teaching-greeting">{current.title}</div>
        <div className="fp-teaching-instruct">{current.subtitle}</div>
        <div className="fp-teaching-meta">{current.meta}</div>
      </div>
    </div>
  );
}

// Expose to other JSX files (components.jsx loads BEFORE screens.jsx but
// renders happen after both files are loaded — the bare reference works
// at render time).
window.LivePiecesHeader = LivePiecesHeader;

// ───────────────────────────────────────────────────────────────────────
//  THINKING TRACE — animated chat busy indicator.
//  ───────────────────────────────────────────────────────────────────────
//  Replaces the boring "thinking" text in ChatScreen with a live, slowly-
//  ticking sequence of contextual flavor steps. When prompt-enhance is on
//  (Settings → Chat intelligence), gpt-5.4-mini emits a trace tailored to
//  the question ("Pulling Andre's pipeline", "Cross-referencing edits…").
//  When it's off (or the trace hasn't landed yet), we cycle through a
//  small generic deck so the indicator never feels dead.
//
//  Each step fades in over 500ms, lives ~1.6s, then the next step fades
//  in below it with a check-mark on the previous one. Pulses a subtle
//  gold dot at the head. Resets when busy goes false.
// ───────────────────────────────────────────────────────────────────────
const _DEFAULT_TRACE = [
  "Reading your message",
  "Pulling context",
  "Composing the answer",
  "Sharpening the edges",
  "Almost there",
];

function ThinkingTrace({ busy, chatId }) {
  const [trace, setTrace] = useState(null);
  const [model, setModel] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);

  // Listen for preprocess broadcasts. The trace arrives AFTER the user
  // message lands, so we replace the default deck once it shows up.
  useEffect(() => {
    const onTrace = (e) => {
      if (!e || !e.detail) return;
      if (chatId && e.detail.chatId && e.detail.chatId !== chatId) return;
      if (Array.isArray(e.detail.trace) && e.detail.trace.length) {
        setTrace(e.detail.trace);
        setModel(e.detail.model || null);
        setStepIdx(0);
      }
    };
    window.addEventListener("comeketoagent:thinking-trace", onTrace);
    return () => window.removeEventListener("comeketoagent:thinking-trace", onTrace);
  }, [chatId]);

  // Reset when busy flips off — next send starts fresh.
  useEffect(() => {
    if (!busy) {
      const t = setTimeout(() => { setTrace(null); setModel(null); setStepIdx(0); }, 500);
      return () => clearTimeout(t);
    }
  }, [busy]);

  // Tick through the deck while busy. ~5s per step — slow enough that
  // it doesn't burn through 6+ items before Claude even responds.
  // When the trace exhausts (stepIdx === last), the interval naturally
  // stops because Math.min caps stepIdx. From that point the spinner
  // on the last step IS the motion — no false cycle-back to earlier
  // items, no janky "going to 5, then back to 3, then 4 forever".
  useEffect(() => {
    if (!busy) return;
    const deck = trace || _DEFAULT_TRACE;
    if (deck.length <= 1) return;
    const id = setInterval(() => {
      setStepIdx(i => {
        const next = Math.min(i + 1, deck.length - 1);
        // If we've reached the end, kill the interval — the spinner
        // on the last step continues, but no more progression.
        if (next === i) { clearInterval(id); }
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, [busy, trace]);

  if (!busy) return null;
  const deck = trace || _DEFAULT_TRACE;
  const visible = deck.slice(0, stepIdx + 1);

  return (
    <div className="thinking-trace">
      <div className="thinking-trace-head">
        <span className="thinking-trace-dot" />
        <span className="thinking-trace-label">
          {trace ? `thinking · ${model || "gpt-5.4-mini"} → claude` : "thinking"}
        </span>
      </div>
      <div className="thinking-trace-steps">
        {visible.map((step, i) => {
          const isLast = i === visible.length - 1;
          return (
            <div key={`${step}-${i}`} className="thinking-trace-step" data-state={isLast ? "active" : "done"}>
              <span className="thinking-trace-mark">
                {isLast ? <span className="thinking-trace-spinner" /> : "✓"}
              </span>
              <span className="thinking-trace-text">{step}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.ThinkingTrace = ThinkingTrace;

// ───────────────────────────────────────────────────────────────────────
//  PIECES ANSWER MODAL — answers land here, not in the page flow.
//  ───────────────────────────────────────────────────────────────────────
//  Per Jake's UX call: when an Ask returns, the answer should be a
//  moment, not a wall of text that pushes the toolkit + sweep list off
//  the screen. This modal slides in over a blurred backdrop, holds the
//  full structured render in scroll, and gives the operator one click
//  to copy raw / copy structured / download JSON / download Markdown.
//  Slow editorial entrance (380ms ease-out), faster exit (220ms). ESC
//  and backdrop-click both dismiss. After close, a "view last answer"
//  pill stays in the ribbon so the operator can re-open without re-asking.
// ───────────────────────────────────────────────────────────────────────

// Render the structured payload as readable Markdown for export.
function _piecesPayloadToMarkdown(payload, question) {
  const lines = [];
  if (question) {
    lines.push(`# Pieces · ${question}`);
    lines.push("");
  }
  if (payload && payload.kind === "structured") {
    if (payload.people && payload.people.length) {
      lines.push("## People in the loop");
      lines.push("");
      lines.push(payload.people.map(p => p.count > 1 ? `${p.name} (×${p.count})` : p.name).join(", "));
      lines.push("");
    }
    if (payload.summaries && payload.summaries.length) {
      lines.push(`## Workstream summaries (${payload.summaries.length})`);
      lines.push("");
      for (const s of payload.summaries) {
        const range = s.range || `${s.from || "?"} → ${s.to || "?"}`;
        lines.push(`### ${range}`);
        if (typeof s.score === "number") lines.push(`*score ${s.score.toFixed(2)}*`);
        lines.push("");
        lines.push(s.tldr || "");
        lines.push("");
      }
    }
    if (payload.events && payload.events.length) {
      lines.push(`## Captured events (${payload.events.length})`);
      lines.push("");
      for (const ev of payload.events) {
        const head = [ev.source, ev.app, ev.window].filter(Boolean).join(" · ");
        lines.push(`### ${head || "event"}`);
        if (ev.url)            lines.push(`- URL: ${ev.url}`);
        if (ev.last_accessed)  lines.push(`- Last accessed: ${ev.last_accessed}`);
        if (ev.people && ev.people.length) lines.push(`- People: ${ev.people.join(", ")}`);
        lines.push("");
        if (ev.extracted) { lines.push("> " + ev.extracted.replace(/\n/g, "\n> ")); lines.push(""); }
      }
    }
  } else if (payload && payload.raw) {
    lines.push("## Answer");
    lines.push("");
    lines.push(payload.raw);
    lines.push("");
  }
  return lines.join("\n");
}

function PiecesAnswerModal({ open, onClose, question, raw, data, model }) {
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState(null);
  const payload = useMemo(() => _normalizePieces(raw, data), [raw, data]);

  const dismiss = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose && onClose(); }, 220);
  };

  // ESC dismisses
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") dismiss(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closing]);

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 1600);
    return () => clearTimeout(id);
  }, [toast]);

  if (!open) return null;

  const flash = (msg) => setToast(msg);

  const copyText = (text, label) => {
    if (!navigator.clipboard) { flash("clipboard unavailable"); return; }
    navigator.clipboard.writeText(text).then(
      () => flash(label || "copied"),
      () => flash("copy failed")
    );
  };

  const downloadBlob = (text, mime, filename) => {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    flash("downloaded");
  };

  const tsSlug = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dataForJson = payload.data != null ? payload.data : (raw || "");
  const jsonString = (() => {
    try { return JSON.stringify(dataForJson, null, 2); }
    catch { return String(dataForJson); }
  })();
  const markdownString = _piecesPayloadToMarkdown(payload, question);

  return (
    <div className="deck-modal-backdrop" data-state={closing ? "closing" : "open"} onClick={dismiss}>
      <div className="deck-modal-card" data-state={closing ? "closing" : "open"} onClick={(e) => e.stopPropagation()}>
        {/* Header — question, model, counts, close */}
        <div style={{
          padding:"22px 28px 16px", borderBottom:"1px solid var(--rule)",
          display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:18,
        }}>
          <div style={{minWidth:0, flex:1}}>
            <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:10, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)", marginBottom:6}}>
              Pieces · answer {model && `· ${model}`}
            </div>
            <div style={{
              fontFamily:"var(--font-display)", fontSize:22, fontWeight:500,
              letterSpacing:"-0.015em", lineHeight:1.2, color:"var(--ink)",
              wordBreak:"break-word",
            }}>
              {question || "Answer"}
            </div>
            {payload.kind === "structured" && (
              <div style={{display:"flex", gap:14, marginTop:8, fontSize:11, fontFamily:"var(--font-mono)", letterSpacing:"0.05em", color:"var(--muted)"}}>
                <span><b style={{color:"var(--ink-2)"}}>{payload.summaries.length}</b> {payload.summaries.length === 1 ? "summary" : "summaries"}</span>
                <span><b style={{color:"var(--ink-2)"}}>{payload.events.length}</b> {payload.events.length === 1 ? "event" : "events"}</span>
                <span><b style={{color:"var(--ink-2)"}}>{payload.people.length}</b> {payload.people.length === 1 ? "person" : "people"}</span>
                <span style={{opacity:0.55}}>· {(raw || "").length.toLocaleString()} chars</span>
              </div>
            )}
          </div>
          <button onClick={dismiss} aria-label="Close" style={{
            width:36, height:36, borderRadius:"50%", border:"1px solid var(--rule)",
            background:"var(--paper-card)", cursor:"pointer", color:"var(--ink-2)",
            display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0,
          }} title="Close (Esc)">
            <Icon name="x" size={16} />
          </button>
        </div>

        {/* Body — full structured render in scroll */}
        <div style={{padding:"22px 28px", overflow:"auto", flex:1}}>
          <PiecesPayloadView raw={raw} data={data} />
        </div>

        {/* Footer — copy / export / close */}
        <div style={{
          padding:"14px 22px", borderTop:"1px solid var(--rule)",
          background:"var(--paper-2)",
          display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, flexWrap:"wrap",
        }}>
          <div style={{display:"flex", gap:8, flexWrap:"wrap", alignItems:"center"}}>
            <button onClick={() => copyText(raw || "", "raw copied")} className="btn btn-paper" style={{padding:"7px 14px", fontSize:12}}>
              <Icon name="file-text" size={12}/> <span style={{marginLeft:5}}>Copy raw</span>
            </button>
            <button onClick={() => copyText(jsonString, "json copied")} className="btn btn-paper" style={{padding:"7px 14px", fontSize:12}}>
              <Icon name="file-text" size={12}/> <span style={{marginLeft:5}}>Copy JSON</span>
            </button>
            <button onClick={() => copyText(markdownString, "markdown copied")} className="btn btn-paper" style={{padding:"7px 14px", fontSize:12}}>
              <Icon name="file-text" size={12}/> <span style={{marginLeft:5}}>Copy Markdown</span>
            </button>
            <span style={{width:1, alignSelf:"stretch", background:"var(--rule)", margin:"0 4px"}} />
            <button onClick={() => downloadBlob(jsonString, "application/json", `pieces-answer-${tsSlug}.json`)} className="btn btn-paper" style={{padding:"7px 14px", fontSize:12}}>
              <Icon name="external-link" size={12}/> <span style={{marginLeft:5}}>JSON</span>
            </button>
            <button onClick={() => downloadBlob(markdownString, "text/markdown", `pieces-answer-${tsSlug}.md`)} className="btn btn-paper" style={{padding:"7px 14px", fontSize:12}}>
              <Icon name="external-link" size={12}/> <span style={{marginLeft:5}}>Markdown</span>
            </button>
          </div>
          <button onClick={dismiss} style={{
            padding:"8px 22px", fontSize:12, fontWeight:500,
            background:"var(--ink)", color:"var(--paper)",
            border:0, borderRadius:999, cursor:"pointer",
            letterSpacing:"0.04em",
          }}>
            Close
          </button>
        </div>

        {toast && <div className="deck-modal-toast">{toast}</div>}
      </div>
    </div>
  );
}

// Inline grounding footer for Rodbot/Chat replies. Sage tone, italic
// Newsreader quote, expand-to-see-more. Surfaces the temporal continuity
// that informed Rodbot's answer right next to the reply itself — so the
// demo audience sees the Pieces wire actually working, not just hidden
// in a system-prompt block.
function PiecesGroundingFooter({ grounding }) {
  const [open, setOpen] = useState(false);
  const payload = useMemo(() => _normalizePieces(grounding && grounding.raw, grounding && grounding.data), [grounding]);
  if (!grounding || !grounding.raw) return null;

  // Build a one-line summary: people in the loop OR the start of the TLDR.
  let teaser = "";
  if (payload.kind === "structured") {
    const people = (payload.people || []).slice(0, 4).map(p => p.name).join(" · ");
    const tldr = payload.summaries && payload.summaries[0] && payload.summaries[0].tldr;
    teaser = people ? `${people}` : (tldr ? tldr.slice(0, 120) + "…" : "");
  } else {
    teaser = (grounding.raw || "").trim().split("\n")[0].slice(0, 140);
  }

  return (
    <div style={{
      marginTop:14, borderRadius:10, overflow:"hidden",
      background:"var(--sage-bg)", color:"var(--sage-ink)",
      border:"1px solid color-mix(in oklab, var(--sage-ink) 12%, transparent)",
    }}>
      <button onClick={() => setOpen(v => !v)} style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        width:"100%", padding:"10px 14px", background:"transparent",
        border:0, cursor:"pointer", color:"inherit", textAlign:"left",
      }}>
        <div style={{display:"flex", alignItems:"center", gap:10, minWidth:0, flex:1}}>
          <span className="dot-tone dot-sage" />
          <span style={{
            fontFamily:"var(--font-mono)", fontSize:9, letterSpacing:"0.1em",
            textTransform:"uppercase", opacity:0.78, flexShrink:0,
          }}>
            from your activity
          </span>
          <span style={{
            fontFamily:"var(--font-display)", fontStyle:"italic", fontSize:12.5,
            opacity:0.92, lineHeight:1.4, overflow:"hidden", textOverflow:"ellipsis",
            whiteSpace:"nowrap", minWidth:0,
          }}>
            {teaser}
          </span>
        </div>
        <span style={{
          fontFamily:"var(--font-mono)", fontSize:9, letterSpacing:"0.05em",
          textTransform:"uppercase", opacity:0.6, flexShrink:0, marginLeft:10,
        }}>
          {open ? "hide" : "show"} {grounding.model && `· ${grounding.model}`}
        </span>
      </button>
      {open && (
        <div style={{padding:"6px 14px 14px", borderTop:"1px solid color-mix(in oklab, var(--sage-ink) 12%, transparent)"}}>
          <PiecesPayloadView raw={grounding.raw} data={grounding.data} compact />
        </div>
      )}
    </div>
  );
}

function PiecesActivityScreen({ go }) {
  const [sweeps, setSweeps] = useState([]);
  const [activeTs, setActiveTs] = useState(null);
  const [activeBody, setActiveBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [sweepBusy, setSweepBusy] = useState(false);
  const [askDraft, setAskDraft] = useState("");
  const [askBusy, setAskBusy] = useState(false);
  const [askResult, setAskResult] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(true);
  const [answerModalOpen, setAnswerModalOpen] = useState(false);
  const [lastQuestion, setLastQuestion] = useState("");

  const loadList = async () => {
    setLoading(true);
    try {
      const [sweepsR, statusR, latestR] = await Promise.all([
        fetch("/api/pieces/sweeps").then(r => r.json()).catch(() => null),
        fetch("/api/pieces/status").then(r => r.json()).catch(() => null),
        fetch("/api/pieces/sweeps/latest").then(r => r.json()).catch(() => null),
      ]);
      if (sweepsR && sweepsR.ok) {
        const list = [...(sweepsR.sweeps || [])].reverse();
        setSweeps(list);
        const latestTs = list[0] && list[0].ts;
        if (latestTs && !activeTs) {
          setActiveTs(latestTs);
          if (latestR && latestR.latest) setActiveBody(latestR.latest.raw || "");
        }
      }
      if (statusR) setStatus(statusR);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadList(); }, []);

  const sweepNow = async () => {
    setSweepBusy(true);
    try {
      const r = await fetch("/api/pieces/sweep", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ since: activeTs || null, chat_llm: getPiecesModel() }),
      });
      const j = await r.json();
      if (j && j.ok) {
        setActiveTs(j.sweep.ts);
        setActiveBody(j.sweep.raw || "");
        await loadList();
      } else {
        alert("Sweep failed: " + (j && j.error || "unknown"));
      }
    } catch (e) { alert("Sweep failed: " + e.message); }
    finally { setSweepBusy(false); }
  };

  const askPieces = async (prefill) => {
    const q = (prefill !== undefined ? prefill : askDraft).trim();
    if (!q) return;
    setAskBusy(true); setAskResult(null);
    if (prefill !== undefined) setAskDraft(prefill);
    setLastQuestion(q);
    try {
      const r = await fetch("/api/pieces/ask", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ question: q, chat_llm: getPiecesModel() }),
      });
      const j = await r.json();
      if (j && j.ok) {
        setAskResult({ ok: true, raw: j.raw || "", data: j.data, model: j.model });
        // Open the answer in the modal — the page stays uncluttered.
        setAnswerModalOpen(true);
      } else {
        setAskResult({ ok: false, error: (j && j.error) || "failed" });
      }
    } catch (e) {
      setAskResult({ ok: false, error: e.message });
    } finally { setAskBusy(false); }
  };

  const fmtTime = (iso) => {
    if (!iso) return "";
    try { return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return iso; }
  };
  const sinceWord = (iso) => {
    if (!iso) return "";
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const m = Math.round(diff / 60000);
      if (m < 1) return "just now";
      if (m < 60) return `${m}m ago`;
      const h = Math.round(m / 60);
      if (h < 24) return `${h}h ago`;
      const d = Math.round(h / 24);
      return `${d}d ago`;
    } catch { return ""; }
  };

  // Parse the active body. Returns { ok, summaries, events, error } —
  // when the raw isn't JSON we fall back to plaintext display.
  const parsed = useMemo(() => {
    if (!activeBody) return { ok: false };
    try {
      const j = JSON.parse(activeBody);
      const summaries = Array.isArray(j.summaries) ? j.summaries.map(s => ({
        id: (s && s.id) || Math.random().toString(36).slice(2),
        score: s && s.score,
        created: (s && s.range && s.range.created && s.range.created.readable) || null,
        from: (s && s.range && s.range.from && s.range.from.readable) || null,
        to:   (s && s.range && s.range.to   && s.range.to.readable)   || null,
        ...parsePiecesSummary(s && s.combined_string),
      })) : [];
      const events = Array.isArray(j.events) ? j.events.map(e => ({
        id: (e && e.id) || Math.random().toString(36).slice(2),
        score: e && e.score,
        url: e && e.browser_url,
        app: e && e.app_title,
        window: e && e.window_title,
        ...parsePiecesEvent(e && e.combined_string),
      })) : [];
      return { ok: true, summaries, events, raw: activeBody };
    } catch (err) {
      return { ok: false, raw: activeBody };
    }
  }, [activeBody]);

  // Distinct people mentioned across all events — surfaced as chips at the top.
  const peopleAcrossEvents = useMemo(() => {
    if (!parsed.ok) return [];
    const seen = new Map();
    for (const ev of (parsed.events || [])) {
      for (const p of (ev.people || [])) {
        const key = p.toLowerCase();
        seen.set(key, (seen.get(key) || 0) + 1);
      }
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({
      name: name.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" "),
      count,
    }));
  }, [parsed]);

  const totalEvents = (parsed.ok && parsed.events && parsed.events.length) || 0;
  const totalSummaries = (parsed.ok && parsed.summaries && parsed.summaries.length) || 0;

  return (
    <div>
      <div className="screen-title">
        <div>
          <div className="kicker">activity · pieces ltm · ambient context</div>
          <h1 style={{fontFamily:"var(--font-display)"}}>Everything you've actually been doing.</h1>
          <div className="lede" style={{fontSize:15, marginTop:6, color:"var(--ink-4)"}}>
            Workstream summaries and ambient capture, gathered every hour, rendered in plain English.
          </div>
        </div>
        <div className="meta" style={{display:"flex", gap:14, alignItems:"center", flexWrap:"wrap"}}>
          {status && (
            <span className="state" style={{
              background: status.available ? "var(--st-shipped-bg)" : "var(--st-blocked-bg)",
              color:      status.available ? "var(--st-shipped-ink)" : "var(--st-blocked-ink)",
              border:     status.available ? "1px solid #8DB58A" : "none",
            }}>
              {status.available ? "pieces · connected" : "pieces · offline"}
            </span>
          )}
          <span style={{fontSize:11, color:"var(--ink-4)", letterSpacing:"0.04em"}}>
            <b style={{color:"var(--ink)"}}>sweeps</b> {sweeps.length}
          </span>
          {sweeps[0] && (
            <span style={{fontSize:11, color:"var(--mint-ink)", letterSpacing:"0.04em"}}>
              <b>latest</b> {sinceWord(sweeps[0].ts)}
            </span>
          )}
        </div>
      </div>

      {/* ── Ask ribbon — deck-prominent ────────────────────────────────── */}
      <div style={{
        background:"var(--card)", border:`1px solid var(--rule)`,
        borderRadius:14, padding:"18px 22px", marginBottom:24,
        boxShadow:"var(--shadow-soft)",
      }}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10}}>
          <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)"}}>
            Ask · 39 tools available
          </div>
          <div style={{fontSize:11, color:"var(--ink-4)", fontFamily:"var(--font-mono)"}}>
            {status && status.url}
          </div>
        </div>
        <div style={{display:"flex", gap:10, alignItems:"center"}}>
          <Icon name="search" size={16}/>
          <input type="text" value={askDraft}
            onChange={(e) => setAskDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") askPieces(); }}
            disabled={askBusy}
            placeholder="Ask Pieces anything — e.g. 'what URLs did I open yesterday afternoon'"
            style={{
              flex:1, padding:"12px 16px", fontSize:14,
              fontFamily:"var(--font-body)", border:"1px solid var(--rule)",
              borderRadius:999, background:"var(--paper)", color:"var(--ink)",
              outline:"none",
            }}/>
          <button className="btn primary" onClick={() => askPieces()} disabled={askBusy || !askDraft.trim()} style={{padding:"10px 22px"}}>
            {askBusy ? "asking…" : "Ask"}
          </button>
          <button className="btn ghost" onClick={sweepNow} disabled={sweepBusy} title="Fire a delta sweep right now">
            {sweepBusy ? "sweeping…" : "↻ Sweep now"}
          </button>
        </div>
        {/* Inline status: only errors land here (short). Successful answers
            open the modal — see <PiecesAnswerModal/> below. If the user
            closed the modal, a quiet "view last answer" pill stays here so
            they can re-open without re-asking. */}
        {askResult && askResult.ok && !answerModalOpen && (
          <div style={{marginTop:14, display:"flex", justifyContent:"flex-end"}}>
            <button onClick={() => setAnswerModalOpen(true)} className="btn btn-paper" style={{
              padding:"7px 16px", fontSize:11.5,
              display:"inline-flex", alignItems:"center", gap:6,
            }}>
              <Icon name="sparkles" size={12}/>
              View last answer · {(askResult.raw || "").length.toLocaleString()} chars
            </button>
          </div>
        )}
        {askResult && !askResult.ok && (
          <div style={{marginTop:14}}>
            <div className="admo admo-rose">
              <div className="icon"><Icon name="alert" size={16}/></div>
              <div>
                <div className="ttl">Error</div>
                <div>{askResult.error}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3-column main: archive | structured body | tools panel ────── */}
      <div style={{display:"grid", gridTemplateColumns:"240px minmax(0, 1fr) 300px", gap:24, alignItems:"start"}}>

        {/* ── Sweep archive ─────────────────────────────────────────── */}
        <div>
          <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)", marginBottom:10}}>
            Sweeps ({sweeps.length})
          </div>
          {loading && <div style={{fontSize:12, color:"var(--ink-4)", fontStyle:"italic"}}>loading…</div>}
          {!loading && sweeps.length === 0 && (
            <div style={{fontSize:12, color:"var(--ink-4)", padding:"14px 0", lineHeight:1.5}}>
              No sweeps yet. Hit ↻ Sweep now — or wait for the hourly background sweep to land.
            </div>
          )}
          <div style={{display:"grid", gap:6, maxHeight:"calc(100vh - 360px)", overflowY:"auto", paddingRight:4}}>
            {sweeps.map((s, i) => {
              const isActive = activeTs === s.ts;
              const isLatest = i === 0;
              return (
                <button key={s.ts} onClick={() => {
                  setActiveTs(s.ts);
                  if (i === 0) {
                    fetch("/api/pieces/sweeps/latest").then(r => r.json()).then(j => {
                      if (j && j.ok && j.latest) setActiveBody(j.latest.raw || "");
                    });
                  } else {
                    setActiveBody("");
                  }
                }}
                  style={{
                    textAlign:"left", padding:"12px 14px", borderRadius:10,
                    border: isActive ? "1.5px solid var(--ink)" : "1px solid var(--rule)",
                    background: isActive ? "var(--card)" : "var(--paper)",
                    cursor:"pointer", color:"var(--ink)",
                    display:"flex", flexDirection:"column", gap:6,
                    boxShadow: isActive ? "var(--shadow-md)" : "none",
                    transition:"all 140ms ease",
                  }}
                >
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", gap:8}}>
                    <span style={{
                      fontFamily:"var(--font-display)", fontSize:15,
                      fontWeight: isLatest ? 500 : 400, color:"var(--ink)",
                      letterSpacing:"-0.01em",
                    }}>{fmtTime(s.ts)}</span>
                    {isLatest && (
                      <span className="state state-shipped" style={{padding:"2px 8px"}}>Latest</span>
                    )}
                  </div>
                  <div style={{fontSize:11, color:"var(--ink-4)", fontFamily:"var(--font-mono)", letterSpacing:"0.02em"}}>
                    {sinceWord(s.ts)} · {Math.round((s.bytes || 0)/100)/10}kb
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Structured body ───────────────────────────────────────── */}
        <div style={{minHeight:320}}>
          {!activeTs ? (
            <div className="admo admo-paper" style={{padding:"40px"}}>
              <div className="icon"><Icon name="search" size={18}/></div>
              <div>
                <div className="ttl">No sweep selected</div>
                <p>Pick a sweep from the left, or fire a fresh one with <b>↻ Sweep now</b>.</p>
              </div>
            </div>
          ) : !activeBody ? (
            <div className="admo admo-lemon" style={{padding:"24px"}}>
              <div className="icon"><Icon name="clock" size={18}/></div>
              <div>
                <div className="ttl">Historical sweep</div>
                <p>Older sweep bodies live in <code style={{background:"rgba(0,0,0,0.06)", padding:"1px 5px", borderRadius:3, fontFamily:"var(--font-code)"}}>_ledger/pieces_sweeps.jsonl</code>. Ask Rodbot in chat — she sees the full ledger.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header row: timestamp · counts · char count. The raw toggle
                  lives inside <PiecesPayloadView> below so the body and the
                  ask-result share a single source of truth. */}
              <div style={{
                display:"flex", justifyContent:"space-between", alignItems:"baseline",
                marginBottom:18, paddingBottom:14, borderBottom:"1px solid var(--rule)",
              }}>
                <div>
                  <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)"}}>
                    {fmtTime(activeTs)} · {sinceWord(activeTs)}
                  </div>
                  <div style={{fontFamily:"var(--font-display)", fontSize:22, fontWeight:500, letterSpacing:"-0.01em", color:"var(--ink)", marginTop:4}}>
                    {parsed.ok ? (
                      <>{totalSummaries} {totalSummaries === 1 ? "summary" : "summaries"} · {totalEvents} {totalEvents === 1 ? "event" : "events"}</>
                    ) : (
                      "Activity sweep"
                    )}
                  </div>
                </div>
                <span style={{fontSize:11, color:"var(--ink-4)", fontFamily:"var(--font-mono)"}}>
                  {activeBody.length.toLocaleString()} chars
                </span>
              </div>

              <PiecesPayloadView raw={activeBody} />
            </>
          )}
        </div>

        {/* ── Pieces tools panel ────────────────────────────────────── */}
        <div>
          <div style={{
            display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10,
          }}>
            <div className="eyebrow" style={{fontFamily:"var(--font-mono)", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--muted)"}}>
              Pieces toolkit · 39
            </div>
            <button className="btn ghost" onClick={() => setToolsOpen(v => !v)} style={{fontSize:10, padding:"4px 8px"}}>
              {toolsOpen ? "collapse" : "expand"}
            </button>
          </div>
          {toolsOpen && (
            <div style={{display:"grid", gap:14, maxHeight:"calc(100vh - 360px)", overflowY:"auto", paddingRight:4}}>
              {PIECES_TOOLS.map(group => (
                <div key={group.group} className={`card-tone card-${group.tone}`} style={{padding:"14px 16px"}}>
                  <div style={{
                    display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10,
                  }}>
                    <span style={{fontFamily:"var(--font-display)", fontSize:18, fontWeight:500, letterSpacing:"-0.01em"}}>
                      {group.group}
                    </span>
                    <span className={`dot-tone dot-${group.tone}`} />
                  </div>
                  <div style={{display:"grid", gap:6}}>
                    {group.items.map(t => (
                      <button key={t.name} onClick={() => askPieces(`Use ${t.name}: ${t.hint}`)}
                        title={t.hint}
                        style={{
                          textAlign:"left", padding:"6px 8px", borderRadius:6,
                          background:"rgba(255,255,255,0.35)", border:"1px solid currentColor",
                          fontFamily:"var(--font-mono)", fontSize:10.5, color:"inherit",
                          cursor:"pointer", letterSpacing:"0.01em", lineHeight:1.3,
                          display:"block", width:"100%",
                        }}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="admo admo-paper" style={{padding:"12px 14px"}}>
                <div className="icon"><Icon name="terminal" size={14}/></div>
                <div>
                  <div className="ttl" style={{fontSize:10}}>Wire to Claude Code</div>
                  <code style={{
                    display:"block", fontSize:10.5, fontFamily:"var(--font-code)",
                    background:"var(--ink)", color:"var(--paper)", padding:"8px 10px",
                    borderRadius:6, marginTop:6, lineHeight:1.4, wordBreak:"break-all",
                  }}>
                    claude mcp add --transport http pieces http://localhost:39300/model_context_protocol/2025-03-26/mcp
                  </code>
                  <p style={{fontSize:11, marginTop:8, color:"var(--ink-4)"}}>
                    Run once. Future delegations inherit the toolkit. See CLAUDE.md → Pieces MCP.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pieces answer modal — opens automatically on a successful Ask. */}
      <PiecesAnswerModal
        open={answerModalOpen && askResult && askResult.ok}
        onClose={() => setAnswerModalOpen(false)}
        question={lastQuestion}
        raw={askResult && askResult.raw}
        data={askResult && askResult.data}
        model={askResult && askResult.model}
      />
    </div>
  );
}

function _ixFmtRelative(iso) {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (!isFinite(t)) return iso;
  const diff = Date.now() - t;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
  if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";
  if (diff < 7 * 86400000) return Math.floor(diff / 86400000) + "d ago";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

async function sendToDelegationsDraft({ text, label, source, policy, mode, timeout_s, cwd, context }) {
  if (!window.SecretaryDelegator || !window.SecretaryDelegator.createDraft) {
    throw new Error("Delegations API unavailable");
  }
  const body = String(text || "").trim();
  if (!body) throw new Error("Nothing to delegate");
  return window.SecretaryDelegator.createDraft({
    source: source || { surface: "manual", route: "unknown" },
    context: context || {},
    payload: {
      label: (label || "Delegation draft").trim(),
      prompt: body,
      mode: mode || "safe",
      timeout_s: Number(timeout_s || 300),
      cwd: cwd || null,
    },
    policy: policy || { target: "general", intent: "read", approval_required: false },
    status: "draft",
  });
}
window.SecretaryDelegationsBridge = { sendToDraft: sendToDelegationsDraft };

function DelegationsScreen({ go }) {
  const D = window.SecretaryDelegator;
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState({ kind: "neutral", text: "" });
  const [runs, setRuns] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [rewriteInstruction, setRewriteInstruction] = useState("");
  const draftMenu = useContextMenu();
  const runMenu = useContextMenu();
  const targetMenu = useContextMenu();
  const ctxDraftRef = useRef(null);
  const ctxRunRef = useRef(null);
  const ctxTargetRef = useRef(null);
  const [edit, setEdit] = useState({
    label: "",
    prompt: "",
    mode: "safe",
    timeout_s: 300,
    target: "general",
    intent: "read",
    approval_required: false,
    cwd: "",
  });

  const refresh = useCallback(async () => {
    if (!D) return;
    const [r, dr] = await Promise.all([D.reload(), D.drafts()]);
    setRuns(Array.isArray(r) ? r : []);
    setDrafts(Array.isArray(dr) ? dr : []);
  }, [D]);

  useEffect(() => {
    fetchJson("/api/status").then(setStatus).catch(() => setStatus(null));
    refresh();
    if (!D || !D.subscribe) return;
    const unsub = D.subscribe((data) => {
      const rr = (data && data.runs) || [];
      const dd = (data && data.drafts) || [];
      setRuns(rr);
      setDrafts(dd);
    });
    return unsub;
  }, [D, refresh]);

  useEffect(() => {
    if (!drafts.length) { setSelectedId(null); return; }
    if (!selectedId || !drafts.find(d => d.id === selectedId)) {
      setSelectedId(drafts[0].id);
    }
  }, [drafts, selectedId]);

  const selected = drafts.find(d => d.id === selectedId) || null;
  const targetMeta = (status && status.delegation_targets) || {};
  const targetOptions = [
    ["general", "general"],
    ["github", "github"],
    ["clickup", "clickup"],
    ["close", "close"],
    ["claude_code", "claude_code"],
    ["cursor", "cursor"],
  ];
  const targetCards = useMemo(() => ([
    { id: "general", label: "Claude Code", sub: "delegate shell/files", intent: "run", icon: "terminal" },
    { id: "github", label: "GitHub", sub: "repo actions", intent: "write", icon: "git-branch" },
    { id: "clickup", label: "ClickUp", sub: "tasks + workspace", intent: "write", icon: "check-square" },
    { id: "close", label: "Close", sub: "crm sms/email", intent: "write", icon: "phone" },
    { id: "cursor", label: "Cursor", sub: "editor actions", intent: "run", icon: "sparkles" },
  ]), []);
  useEffect(() => {
    if (!selected) return;
    const p = selected.payload || {};
    const pol = selected.policy || {};
    setEdit({
      label: p.label || "",
      prompt: p.prompt || "",
      mode: p.mode || "safe",
      timeout_s: Number(p.timeout_s || 300),
      target: pol.target || "general",
      intent: pol.intent || "read",
      approval_required: !!pol.approval_required,
      cwd: p.cwd || "",
    });
  }, [selectedId, drafts]);

  const colBuckets = useMemo(() => {
    const bucket = {
      draft: [],
      pending_approval: [],
      running: [],
      done: [],
      failed: [],
      rejected: [],
    };
    drafts.forEach(d => {
      const s = String(d.status || "draft");
      if (bucket[s]) bucket[s].push(d);
      else bucket.draft.push(d);
    });
    return bucket;
  }, [drafts]);

  const runWrap = async (fn) => {
    if (!selected) return;
    setBusy(true);
    try {
      await fn();
      setFeedback({ kind: "ok", text: "Action completed." });
    }
    catch (e) {
      setFeedback({ kind: "error", text: e.message || String(e) });
      alert(e.message || e);
    }
    finally { setBusy(false); await refresh(); }
  };

  const chooseTarget = (id, defaultIntent) => {
    const meta = targetMeta[id] || {};
    const nextIntent = defaultIntent || (meta.requires_approval_for_write ? "write" : "read");
    setEdit((v) => ({
      ...v,
      target: id,
      intent: nextIntent,
      approval_required: nextIntent === "write" ? true : !!v.approval_required,
    }));
    setFeedback({ kind: "neutral", text: `Target set to ${id} (${nextIntent}).` });
  };

  const saveEdits = async () => {
    if (!selected) return;
    await runWrap(() => D.updateDraft(selected.id, {
      payload: {
        label: edit.label.trim() || "Delegation draft",
        prompt: edit.prompt,
        mode: edit.mode,
        timeout_s: Number(edit.timeout_s || 300),
        cwd: edit.cwd.trim() || null,
      },
      policy: {
        target: edit.target,
        intent: edit.intent,
        approval_required: !!edit.approval_required,
      },
    }));
  };

  const requestWriteApproval = async () => {
    if (!selected) return;
    const target = edit.target || "github";
    await runWrap(() => D.updateDraft(selected.id, {
      status: "pending_approval",
      policy: {
        target,
        intent: "write",
        approval_required: true,
      },
    }));
  };

  const runRead = async () => {
    if (!selected) return;
    await runWrap(async () => {
      await D.updateDraft(selected.id, {
        payload: { ...selected.payload, prompt: edit.prompt, label: edit.label, mode: "safe", timeout_s: Number(edit.timeout_s || 300), cwd: edit.cwd.trim() || null },
        policy: { target: edit.target || "general", intent: "read", approval_required: false },
      });
      await D.submitDraft(selected.id);
    });
  };

  const approveAndExecuteWrite = async () => {
    if (!selected) return;
    const target = edit.target || "github";
    await runWrap(async () => {
      await D.updateDraft(selected.id, {
        payload: { ...selected.payload, prompt: edit.prompt, label: edit.label, mode: "trusted", timeout_s: Number(edit.timeout_s || 300), cwd: edit.cwd.trim() || null },
        policy: { target, intent: "write", approval_required: true },
        status: "approved",
      });
      await D.submitDraft(selected.id, { approve_write: true, approved_by: "operator" });
    });
  };

  const rejectDraft = async () => {
    if (!selected) return;
    await runWrap(() => D.updateDraft(selected.id, { status: "rejected" }));
  };

  const deleteDraft = async () => {
    if (!selected) return;
    if (!confirm("Delete this draft?")) return;
    await runWrap(() => D.deleteDraft(selected.id));
  };

  const rewrite = async () => {
    if (!selected) return;
    await runWrap(() => D.rewriteDraft(selected.id, rewriteInstruction.trim()));
  };

  const undoDraft = async () => {
    if (!selected) return;
    await runWrap(() => D.undoDraft(selected.id));
  };

  const copyToClipboard = (text) => {
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(String(text));
        return true;
      }
      const ta = document.createElement("textarea");
      ta.value = String(text);
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch { return false; }
  };

  const duplicateDraft = async (d) => {
    if (!d) return;
    setBusy(true);
    try {
      await D.createDraft({
        source: d.source || {},
        context: d.context || {},
        payload: {
          ...(d.payload || {}),
          label: `${(d.payload && d.payload.label) || "Delegation draft"} (copy)`,
        },
        policy: d.policy || { target: "general", intent: "read", approval_required: false },
        status: "draft",
      });
      setFeedback({ kind: "ok", text: "Draft duplicated." });
    } catch (e) {
      setFeedback({ kind: "error", text: e.message || String(e) });
      alert(e.message || e);
    } finally {
      setBusy(false);
      await refresh();
    }
  };

  const openTargetContextMenu = (e, t) => {
    ctxTargetRef.current = t;
    targetMenu.onContextMenu(e);
  };

  const buildTargetMenuItems = (t) => {
    if (!t) return [];
    return [
      { label: `Set ${t.id} as read`, icon: "↗", onClick: () => chooseTarget(t.id, "read") },
      { label: `Set ${t.id} as run`, icon: "↗", onClick: () => chooseTarget(t.id, "run") },
      { label: `Set ${t.id} as write`, icon: "↗", onClick: () => chooseTarget(t.id, "write") },
      { divider: true },
      { label: "Copy target id", icon: "⧉", onClick: () => copyToClipboard(t.id) },
      { label: "Copy status detail", icon: "⧉", onClick: () => copyToClipboard((targetMeta[t.id] && targetMeta[t.id].detail) || "") },
    ];
  };

  const openDraftContextMenu = (e, d) => {
    ctxDraftRef.current = d;
    draftMenu.onContextMenu(e);
  };
  const openRunContextMenu = (e, r) => {
    ctxRunRef.current = r;
    runMenu.onContextMenu(e);
  };

  const buildDraftMenuItems = (d) => {
    if (!d) return [];
    return [
      { label: "Open in final edit", icon: "↗", onClick: () => setSelectedId(d.id) },
      {
        label: "Undo last change", icon: "↶", onClick: async () => {
          setSelectedId(d.id);
          try { await D.undoDraft(d.id); await refresh(); }
          catch (e) { alert(e.message || e); }
        },
      },
      { label: "Duplicate draft", icon: "⧉", onClick: () => duplicateDraft(d) },
      { divider: true },
      { label: "Copy label", icon: "⧉", onClick: () => copyToClipboard((d.payload && d.payload.label) || "") },
      { label: "Copy prompt markdown", icon: "⧉", onClick: () => copyToClipboard((d.payload && d.payload.prompt) || "") },
      { label: "Copy draft id", icon: "⧉", onClick: () => copyToClipboard(d.id || "") },
      { divider: true },
      {
        label: "Delete draft", icon: "✕", danger: true, onClick: async () => {
          if (!confirm("Delete this draft?")) return;
          try { await D.deleteDraft(d.id); await refresh(); }
          catch (e) { alert(e.message || e); }
        },
      },
    ];
  };

  const buildRunMenuItems = (r) => {
    if (!r) return [];
    return [
      { label: "Copy run id", icon: "⧉", onClick: () => copyToClipboard(r.request_id || "") },
      { label: "Copy run label", icon: "⧉", onClick: () => copyToClipboard(r.label || "") },
      { label: "Copy summary markdown", icon: "⧉", onClick: () => copyToClipboard(r.summary || "") },
      { label: "Open linked draft", icon: "↗", disabled: !r.draft_id, onClick: () => r.draft_id && setSelectedId(r.draft_id) },
    ];
  };

  const hasGitHubMcp = !!(status && status.github_mcp && status.github_mcp.available);

  const DraftCard = ({ d }) => (
    <button
      className={"ix-card" + (selectedId === d.id ? " selected" : "")}
      onClick={() => setSelectedId(d.id)}
      onContextMenu={(e) => openDraftContextMenu(e, d)}
      style={{textAlign:"left", width:"100%", display:"grid", gap:6}}
      title={d.id}
    >
      <Markdown text={(d.payload && d.payload.label) || d.id} className="ix-card-name ix-card-name-md" />
      <div className="ix-card-meta">
        <span><b>{d.status || "draft"}</b></span>
        <span>·</span>
        <span>{(d.policy && d.policy.target) || "general"}/{(d.policy && d.policy.intent) || "read"}</span>
        <span>·</span>
        <span className="ix-card-time">{_ixFmtRelative(d.updated_at || d.created_at)}</span>
      </div>
    </button>
  );

  return (
    <div className="ix-detail">
      <header className="ix-detail-head">
        <button className="ix-back" onClick={() => go.back()}>← back</button>
        <div className="ix-detail-title-wrap">
          <div className="ix-eyebrow">delegations · action zone</div>
          <h1 className="ix-detail-title">Delegations</h1>
          <div className="ix-lede">Reads can run immediately. Connector writes route through final edit + explicit approval.</div>
        </div>
        <button className="ix-cta" onClick={refresh}>refresh</button>
      </header>

      <section className="ix-doc delegation-targets">
        <div className="ix-eyebrow">channel</div>
        <div className="delegation-target-grid">
          {targetCards.map((t) => {
            const m = targetMeta[t.id] || {};
            const online = m.available !== false;
            const active = edit.target === t.id;
            return (
              <button
                key={t.id}
                className={"delegation-target-card" + (active ? " active" : "") + (online ? " online" : " offline")}
                onClick={() => chooseTarget(t.id, t.intent)}
                onContextMenu={(e) => openTargetContextMenu(e, t)}
                title={(m && m.detail) || t.sub}
              >
                <div className="delegation-target-head">
                  <span className="delegation-target-icon"><Icon name={t.icon} /></span>
                  <span className="delegation-target-label">{t.label}</span>
                </div>
                <div className="delegation-target-sub">{t.sub}</div>
                <div className="delegation-target-meta">{online ? "ready" : "needs setup"}</div>
              </button>
            );
          })}
        </div>
      </section>

      {!!feedback.text && (
        <div className={"ix-doc delegation-feedback " + feedback.kind}>{feedback.text}</div>
      )}

      <div className="ix-grid" style={{gridTemplateColumns:"repeat(3,minmax(220px,1fr))"}}>
        <div className="ix-doc" style={{display:"grid", gap:10}}>
          <div className="ix-eyebrow">draft</div>
          {(colBuckets.draft || []).map(d => <DraftCard key={d.id} d={d} />)}
        </div>
        <div className="ix-doc" style={{display:"grid", gap:10}}>
          <div className="ix-eyebrow">pending approval</div>
          {(colBuckets.pending_approval || []).map(d => <DraftCard key={d.id} d={d} />)}
        </div>
        <div className="ix-doc" style={{display:"grid", gap:10}}>
          <div className="ix-eyebrow">running / done / failed</div>
          {[...(colBuckets.running || []), ...(colBuckets.done || []), ...(colBuckets.failed || []), ...(colBuckets.rejected || [])].map(d => <DraftCard key={d.id} d={d} />)}
        </div>
      </div>

      {selected ? (
        <div className="ix-doc" style={{display:"grid", gap:14}}>
          <div className="ix-section-head">
            <div className="ix-eyebrow">final edit</div>
            <Markdown text={selected.payload && selected.payload.label ? selected.payload.label : selected.id} className="ix-h2 ix-delegation-title-md" />
          </div>
          <div className="ix-create-row" style={{alignItems:"start"}}>
            <input className="ix-create-input" value={edit.label} onChange={(e) => setEdit(v => ({...v, label: e.target.value}))} placeholder="Label" />
            <select className="ix-create-input" value={edit.target} onChange={(e) => setEdit(v => ({...v, target: e.target.value}))}>
              {targetOptions.map(([id, label]) => {
                const meta = targetMeta[id] || {};
                const online = (meta.available === false) ? " (offline)" : "";
                return <option key={id} value={id}>{label + online}</option>;
              })}
            </select>
            <select className="ix-create-input" value={edit.intent} onChange={(e) => setEdit(v => ({...v, intent: e.target.value}))}>
              <option value="read">read</option>
              <option value="write">write</option>
              <option value="run">run</option>
            </select>
            <input className="ix-create-input" value={String(edit.timeout_s)} onChange={(e) => setEdit(v => ({...v, timeout_s: Number(e.target.value || 300)}))} placeholder="timeout_s" />
          </div>
          <textarea
            className="ix-qa-input"
            style={{minHeight:220}}
            value={edit.prompt}
            onChange={(e) => setEdit(v => ({...v, prompt: e.target.value}))}
            placeholder="Delegation prompt"
          />
          <div className="ix-doc ix-delegation-preview">
            <div className="ix-eyebrow">markdown preview</div>
            <Markdown text={edit.prompt || "_No prompt yet._"} className="ix-delegation-preview-md" />
          </div>
          <div className="ix-create-row">
            <input
              className="ix-create-input"
              value={rewriteInstruction}
              onChange={(e) => setRewriteInstruction(e.target.value)}
              placeholder="Rewrite instruction (optional)"
            />
            <button className="btn ghost" onClick={rewrite} disabled={busy || !rewriteInstruction.trim()}>{busy ? "rewriting…" : "rewrite with ai"}</button>
          </div>
          <div className="ix-create-row">
            <button className="btn ghost" onClick={saveEdits} disabled={busy}>{busy ? "working…" : "save edits"}</button>
            <button className="btn ghost" onClick={undoDraft} disabled={busy}>undo last change</button>
            <button className="btn primary" onClick={runRead} disabled={busy}>run read</button>
            <button className="btn ghost" onClick={requestWriteApproval} disabled={busy}>request write approval</button>
            <button className="btn primary" onClick={approveAndExecuteWrite} disabled={busy}>approve + execute write</button>
            <button className="btn ghost" onClick={rejectDraft} disabled={busy}>reject</button>
            <button className="btn ghost" onClick={deleteDraft} disabled={busy}>delete</button>
          </div>
          <div className="ix-card-meta">
            <span><b>github mcp</b> {hasGitHubMcp ? "connected" : "not connected"}</span>
            {!hasGitHubMcp && status && status.github_mcp && status.github_mcp.detail && <span>· {status.github_mcp.detail}</span>}
            {targetMeta[edit.target] && <span>· <b>{edit.target}</b> {targetMeta[edit.target].available ? "online" : "offline"}</span>}
            {selected.last_request_id && <span>· last run {selected.last_request_id}</span>}
          </div>
        </div>
      ) : (
        <div className="ix-empty">
          <div className="ix-empty-title">No delegation draft selected.</div>
          <p className="ix-empty-body">Right-click actions across the app can send work here. Pick a draft to finalize and run.</p>
        </div>
      )}

      <section className="ix-docs">
        <div className="ix-section-head">
          <div className="ix-eyebrow">execution timeline</div>
          <h2 className="ix-h2">Recent runs.</h2>
        </div>
        <div style={{display:"grid", gap:8}}>
          {(runs || []).slice(0, 20).map(r => (
            <div key={r.request_id} className="ix-inflight-row" onContextMenu={(e) => openRunContextMenu(e, r)} title="right-click for run actions">
              <span className="ix-inflight-stage">{r.status || "?"}</span>
              <span className="ix-inflight-name">{r.label || r.request_id}</span>
              <span className="ix-card-time">{_ixFmtRelative(r.finished_at || r.started_at)}</span>
            </div>
          ))}
          {(!runs || runs.length === 0) && <div className="ix-empty-body">No runs yet.</div>}
        </div>
      </section>
      {draftMenu.render(buildDraftMenuItems(ctxDraftRef.current), (ctxDraftRef.current && ctxDraftRef.current.payload && ctxDraftRef.current.payload.label) || "draft")}
      {runMenu.render(buildRunMenuItems(ctxRunRef.current), (ctxRunRef.current && ctxRunRef.current.label) || "run")}
      {targetMenu.render(buildTargetMenuItems(ctxTargetRef.current), (ctxTargetRef.current && ctxTargetRef.current.label) || "target")}
    </div>
  );
}

function BoxesScreen({ go, selectId }) {
  const STARTER_LEADS = useMemo(() => ([
    "hugo_casillas",
    "brenda_steve",
    "brenda_steve_catalano",
  ]), []);
  const slugNorm = useCallback((v) => String(v || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, ""), []);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [boxes, setBoxes] = useState([]);
  const [grouped, setGrouped] = useState({});
  const [mismatch, setMismatch] = useState({ unmatched_box_ids: [], unmatched_people: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("lead");
  const [section, setSection] = useState("state");
  const [showRoster, setShowRoster] = useState(true);
  const [starterOnly] = useState(true);
  const [pollMs, setPollMs] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const listMenu = useContextMenu();
  const panelMenu = useContextMenu();
  const ctxBoxRef = useRef(null);
  const ctxPanelRef = useRef(null);
  const mainScrollRef = useRef(null);

  const loadList = useCallback(async () => {
    setErr("");
    setRefreshing(true);
    try {
      const d = await fetchJson("/api/boxes/list");
      if (!d || !d.ok) throw new Error((d && d.error) || "boxes list failed");
      setBoxes(Array.isArray(d.boxes) ? d.boxes : []);
      setGrouped(d.grouped || {});
      setMismatch(d.mismatch || { unmatched_box_ids: [], unmatched_people: [] });
      if (!selectedId && Array.isArray(d.boxes) && d.boxes.length) {
        // Honor an explicit incoming selectId (e.g., from "Open in Boxes →" on
        // the Intake page) before falling back to the starter heuristic.
        const incoming = selectId ? d.boxes.find((b) => b.id === selectId) : null;
        const starter = d.boxes.find((b) => STARTER_LEADS.some((s) => slugNorm(b.name).startsWith(s)));
        setSelectedId((incoming || starter || d.boxes[0]).id);
        if (incoming && (incoming.kind || "lead") !== kindFilter) {
          setKindFilter(incoming.kind || "lead");
        }
      }
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [selectedId, STARTER_LEADS, slugNorm]);

  const loadDetail = useCallback(async (id) => {
    if (!id) return;
    setDetailLoading(true);
    try {
      const d = await fetchJson(`/api/boxes/${encodeURIComponent(id)}`);
      if (!d || !d.ok || !d.box) throw new Error((d && d.error) || "box detail failed");
      setDetail(d.box);
    } catch (e) {
      setErr(e.message || String(e));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);
  useEffect(() => { if (selectedId) loadDetail(selectedId); }, [selectedId, loadDetail]);
  useEffect(() => {
    if (!pollMs || pollMs <= 0) return;
    const t = setInterval(() => { loadList(); }, pollMs);
    return () => clearInterval(t);
  }, [pollMs, loadList]);

  useEffect(() => {
    if (!mainScrollRef.current) return;
    mainScrollRef.current.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [selectedId, section]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return boxes.filter(b => {
      if ((b.source_kind || "") !== "client_box") return false;
      if (starterOnly && !STARTER_LEADS.some((s) => slugNorm(b.name).startsWith(s))) return false;
      if (kindFilter !== "all" && (b.kind || "lead") !== kindFilter) return false;
      if (!q) return true;
      const hay = `${b.name || ""} ${b.id || ""} ${b.folder_rel || ""} ${(b.person_id || "")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [boxes, query, kindFilter, starterOnly, STARTER_LEADS, slugNorm]);

  const sectionText = useMemo(() => {
    const s = (detail && detail.sections) || {};
    if (section === "enrichment") return s.enrichment_markdown || "";
    if (section === "comms") return s.comms_markdown || "";
    if (section === "plan") return s.seven_day_plan_markdown || "";
    if (section === "agents") return s.agents_markdown || "";
    if (section === "logic") return s.logic_markdown || "";
    return s.profile_markdown || "";
  }, [detail, section]);
  const stateTouches = useMemo(() => ((detail && detail.sections && detail.sections.state_touches) || []), [detail]);

  const detailChecklist = (detail && detail.checklist && Array.isArray(detail.checklist.items)) ? detail.checklist.items : [];
  const detailCompleteness = (detail && detail.completeness) || {};
  const detailHealthClass = ((detailCompleteness.status || "thin") === "strong")
    ? "is-strong"
    : ((detailCompleteness.status || "thin") === "partial" ? "is-partial" : "is-thin");
  const leadSlug = slugNorm((detail && (detail.name || detail.id)) || "");
  const isHugoLead = leadSlug.startsWith("hugo_casillas");
  const isBrendaLead = leadSlug.startsWith("brenda_steve");
  const detailMeta = ((detail && detail.sections && detail.sections.meta) || {});
  const SECTION_META = {
    state: { title: "State", subtitle: "What's happening right now.", tone: "mint" },
    profile: { title: "Profile", subtitle: "Identity, buying psychology, and constraints.", tone: "sky" },
    comms: { title: "Comms", subtitle: "Every touchpoint in sequence.", tone: "peach" },
    enrichment: { title: "Enrichment", subtitle: "Usable intelligence and protected boundaries.", tone: "lav" },
    plan: { title: "7-Day Plan", subtitle: "Keystone move and daily execution.", tone: "lemon" },
    agents: { title: "Agents", subtitle: "Subagent configuration and ownership.", tone: "sage" },
    logic: { title: "Logic", subtitle: "Rules, gates, and off-ramp handling.", tone: "rose" },
  };
  const keyFacts = useMemo(() => ([
    ["Lead ID", detailMeta.lead_id || (detail && detail.id) || ""],
    ["Cadence", detailMeta.smart_view_label || ""],
    ["Altitude", detailMeta.altitude || ""],
    ["Confidence", detailMeta.confidence || detailMeta.enrichment_tier || ""],
    ["Last Sweep", detailMeta.last_sweep_at || detailMeta.generated_at || ""],
  ]).filter(([, v]) => String(v || "").trim()), [detailMeta, detail]);

  const renderDossierText = useCallback((text) => {
    const raw = String(text || "").trim();
    if (!raw) return <div className="ix-empty-body">Section not written yet.</div>;
    const normalizeMd = (src) => String(src || "")
      .replace(/^\s*(NOTE|TIP|WARN|WARNING|DANGER|TODO|NEXT):\s*(.+)$/gim, (_m, kind, body) => `> **${String(kind).toUpperCase()}:** ${String(body).trim()}`);
    const chunks = raw.split(/\n\s*\n/g).map(c => c.trim()).filter(Boolean);
    return (
      <div className="boxes-dossier">
        {chunks.map((chunk, idx) => {
          const lines = chunk.split("\n").map(l => l.trim()).filter(Boolean);
          const first = lines[0] || "";
          const hasBullets = lines.some((l) => /^[-*]\s+/.test(l));
          const headingLike = /^#{1,6}\s+/.test(first) || (/^[A-Za-z0-9 ,/'"&()\-]+:$/.test(first) && first.length < 70);
          let title = "";
          let bodyLines = lines;
          if (headingLike) {
            title = first.replace(/^#{1,6}\s+/, "").replace(/:$/, "").trim();
            bodyLines = lines.slice(1);
          }
          const bodyMd = normalizeMd(bodyLines.join("\n"));
          return (
            <article key={`${idx}:${title || first.slice(0, 20)}`} className="boxes-dossier-card">
              {!!title && <h3>{title}</h3>}
              {!!bodyMd.trim() ? <Markdown text={bodyMd} className="boxes-md boxes-md-rich" /> : null}
              {!bodyMd.trim() && hasBullets ? <div className="ix-empty-body">No structured notes in this block.</div> : null}
            </article>
          );
        })}
      </div>
    );
  }, []);

  const parseMdTable = useCallback((text) => {
    const lines = String(text || "").split("\n").map((l) => l.trim()).filter(Boolean);
    for (let i = 0; i < lines.length - 2; i += 1) {
      if (!lines[i].includes("|")) continue;
      if (!/^\|?[\s:\-|]+\|[\s:\-|]*$/.test(lines[i + 1])) continue;
      const headers = lines[i].split("|").map((c) => c.trim()).filter(Boolean);
      if (!headers.length) continue;
      const rows = [];
      for (let j = i + 2; j < lines.length; j += 1) {
        if (!lines[j].includes("|")) break;
        const cells = lines[j].split("|").map((c) => c.trim()).filter(Boolean);
        if (!cells.length) break;
        rows.push(cells);
      }
      if (rows.length) return { headers, rows };
    }
    return null;
  }, []);

  const splitBlocksByRegex = useCallback((text, re) => {
    const lines = String(text || "").split("\n");
    const out = [];
    let current = null;
    lines.forEach((raw) => {
      const line = raw.trim();
      if (!line) return;
      if (re.test(line)) {
        if (current) out.push(current);
        current = { title: line.replace(/^#{1,6}\s+/, "").trim(), lines: [] };
      } else if (current) {
        current.lines.push(line);
      }
    });
    if (current) out.push(current);
    return out;
  }, []);

  const splitEnrichment = useCallback((text) => {
    const lines = String(text || "").split("\n");
    const allowed = [];
    const protectedLines = [];
    let mode = "allowed";
    lines.forEach((raw) => {
      const line = raw.trim();
      if (!line) return;
      if (/(out of bounds|off limits|not publicly|not supposed|do not assess|protected|privacy)/i.test(line)) {
        mode = "protected";
      }
      if (mode === "protected") protectedLines.push(line);
      else allowed.push(line);
    });
    return {
      allowed: allowed.join("\n"),
      protected: protectedLines.join("\n"),
    };
  }, []);

  const extractBullets = useCallback((text) => String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^[-*]\s+/.test(l))
    .map((l) => l.replace(/^[-*]\s+/, "").trim()), []);

  const renderHugoSection = useCallback((kind, text) => {
    const raw = String(text || "").trim();
    if (!raw) return <div className="ix-empty-body">Section not written yet.</div>;
    const closeUrlMatch = raw.match(/https?:\/\/app\.close\.com\/[^\s)]+/i);
    const closeUrl = closeUrlMatch ? closeUrlMatch[0] : "";
    const table = parseMdTable(raw);
    const bullets = extractBullets(raw).slice(0, 12);
    const paragraphs = raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.includes("|") && !/^[-*]\s+/.test(l) && !/^#{1,6}\s+/.test(l))
      .slice(0, 4);
    const narrativeMd = paragraphs.join("\n\n");
    const bulletMd = bullets.map((b) => `- ${b}`).join("\n");

    return (
      <div className="hugo-dossier">
        {closeUrl ? (
          <div className="hugo-banner">
            <span>Close Lead</span>
            <a href={closeUrl} target="_blank" rel="noreferrer">{closeUrl}</a>
          </div>
        ) : null}
        {table ? (
          <div className="hugo-card">
            <h3>{kind === "profile" ? "Lead Snapshot" : "Structured Notes"}</h3>
            <div className="hugo-table-wrap">
              <table className="hugo-table">
                <thead>
                  <tr>{table.headers.map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {table.rows.map((row, ri) => (
                    <tr key={`r-${ri}`}>{row.map((c, ci) => <td key={`c-${ri}-${ci}`}>{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        {!!paragraphs.length && (
          <div className="hugo-card">
            <h3>{kind === "plan" ? "Execution Narrative" : "Context Narrative"}</h3>
            <Markdown text={narrativeMd} className="boxes-md boxes-md-rich" />
          </div>
        )}
        {!!bullets.length && (
          <div className="hugo-card">
            <h3>{kind === "comms" ? "Conversation Cues" : "Action Bullets"}</h3>
            <Markdown text={bulletMd} className="boxes-md boxes-md-rich" />
          </div>
        )}
      </div>
    );
  }, [parseMdTable, extractBullets]);

  const renderBrendaSection = useCallback((kind, text) => {
    const raw = String(text || "").trim();
    if (!raw) return <div className="ix-empty-body">Section not written yet.</div>;

    const closeUrlMatch = raw.match(/https?:\/\/app\.close\.com\/[^\s)]+/i);
    const closeUrl = closeUrlMatch ? closeUrlMatch[0] : "";
    const bullets = extractBullets(raw).slice(0, 14);
    const table = parseMdTable(raw);
    const h3Blocks = splitBlocksByRegex(raw, /^###\s+/);
    const h2Blocks = splitBlocksByRegex(raw, /^##\s+/);
    const dayBlocks = splitBlocksByRegex(raw, /^(Day\s+\d+|At the Tasting|Strategic Note|Watch-fors)/i);
    const pairSummaryMd = [
      `- **Primary contact:** ${detailMeta.primary_contact || "Unknown"}`,
      `- **Secondary contact:** ${detailMeta.secondary_contact || "Unknown"}`,
      `- **Decision unit:** ${detailMeta.decision_unit || "Unknown"}`,
      `- **Tasting:** ${(detailMeta.tasting_date || "TBD")} ${(detailMeta.tasting_time || "")}`.trim(),
    ].join("\n");

    return (
      <div className="brenda-dossier">
        <div className="brenda-pair-strip">
          <div className="brenda-pill"><span>Primary</span><b>{detailMeta.primary_contact || "Brenda"}</b></div>
          <div className="brenda-pill"><span>Secondary</span><b>{detailMeta.secondary_contact || "Steve"}</b></div>
          <div className="brenda-pill"><span>Decision Unit</span><b>{detailMeta.decision_unit || "Pair"}</b></div>
          <div className="brenda-pill"><span>Altitude</span><b>{detailMeta.altitude || "whale"}</b></div>
        </div>

        {closeUrl ? (
          <div className="brenda-banner">
            <span>Close Lead</span>
            <a href={closeUrl} target="_blank" rel="noreferrer">{closeUrl}</a>
          </div>
        ) : null}

        {(kind === "profile" || kind === "comms") && (
          <article className="brenda-card">
            <h3>Decision Pair Snapshot</h3>
            <Markdown text={pairSummaryMd} className="boxes-md boxes-md-rich" />
          </article>
        )}

        {table ? (
          <article className="brenda-card">
            <h3>{kind === "comms" ? "Comms Snapshot Table" : "Lead Snapshot Table"}</h3>
            <div className="hugo-table-wrap">
              <table className="hugo-table">
                <thead><tr>{table.headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>
                  {table.rows.map((row, ri) => (
                    <tr key={`b-row-${ri}`}>{row.map((c, ci) => <td key={`b-cell-${ri}-${ci}`}>{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ) : null}

        {kind === "comms" && h3Blocks.length ? (
          <article className="brenda-card">
            <h3>Comms Timeline</h3>
            <div className="brenda-timeline">
              {h3Blocks.slice(0, 8).map((b, i) => (
                <div key={`tl-${i}-${b.title}`} className="brenda-timeline-item">
                  <div className="brenda-timeline-title">{b.title}</div>
                  <Markdown text={b.lines.slice(0, 6).join("\n")} className="boxes-md boxes-md-rich" />
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {kind === "plan" && dayBlocks.length ? (
          <article className="brenda-card">
            <h3>7-Day Execution Blocks</h3>
            <div className="brenda-days">
              {dayBlocks.slice(0, 8).map((b, i) => (
                <div key={`day-${i}-${b.title}`} className="brenda-day-card">
                  <div className="brenda-day-title">{b.title}</div>
                  <Markdown text={b.lines.slice(0, 8).join("\n")} className="boxes-md boxes-md-rich" />
                </div>
              ))}
            </div>
          </article>
        ) : null}

        {kind === "logic" && bullets.length ? (
          <article className="brenda-card">
            <h3>Operational Logic Rules</h3>
            <Markdown text={bullets.map((b) => `- ${b}`).join("\n")} className="boxes-md boxes-md-rich" />
          </article>
        ) : null}

        {(kind === "enrichment" || kind === "agents" || (!table && !h3Blocks.length && !dayBlocks.length)) && (
          <article className="brenda-card">
            <h3>{kind === "enrichment" ? "Enrichment Brief" : (kind === "agents" ? "Agent Configuration" : "Narrative")}</h3>
            <Markdown text={raw} className="boxes-md boxes-md-rich" />
          </article>
        )}

        {(kind !== "logic" && kind !== "plan" && bullets.length > 2) ? (
          <article className="brenda-card">
            <h3>Action Highlights</h3>
            <Markdown text={bullets.slice(0, 8).map((b) => `- ${b}`).join("\n")} className="boxes-md boxes-md-rich" />
          </article>
        ) : null}
      </div>
    );
  }, [detailMeta, extractBullets, parseMdTable, splitBlocksByRegex]);

  const renderSectionHero = useCallback((sectionKey) => {
    const meta = SECTION_META[sectionKey] || { title: sectionKey, subtitle: "", tone: "sky" };
    return (
      <div className={`bx-admo bx-admo-${meta.tone}`}>
        <div className="icon">✦</div>
        <div>
          <div className="ttl">{meta.title}</div>
          <p>{meta.subtitle}</p>
        </div>
      </div>
    );
  }, [SECTION_META]);

  const openBoxMenu = (e, b) => {
    ctxBoxRef.current = b;
    listMenu.onContextMenu(e);
  };
  const copyToClipboard = (text) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(String(text));
      }
    } catch {}
  };

  const buildBoxMenuItems = (b) => {
    if (!b) return [];
    const items = [
      { label: "Open box detail", icon: "↗", onClick: () => { setSelectedId(b.id); setShowRoster(false); } },
    ];
    if ((b.source_kind || "") === "client_box") {
      items.push({
        label: "Open as Intake Report →",
        icon: "▤",
        onClick: () => { go.push("intake", { openSlug: b.id }); },
      });
    }
    items.push(
      { label: "Copy box id", icon: "⧉", onClick: () => copyToClipboard(b.id) },
      { label: "Copy folder path", icon: "⧉", onClick: () => copyToClipboard(b.folder_rel) },
      {
        label: "Send box brief to delegations", icon: "↗", onClick: async () => {
          await sendToDelegationsDraft({
            text: `Review box ${b.name} (${b.id}) and propose next operator action.\nBox folder: ${b.folder_rel}\nUse the box state/comms/profile/plan as source of truth.`,
            label: `Box action: ${b.name}`,
            source: { surface: "boxes", route: "boxes", entity: { type: "box", id: b.id } },
            policy: { target: "claude_code", intent: "run", approval_required: false },
            mode: "safe",
            context: { box_id: b.id, box_kind: b.kind, folder_rel: b.folder_rel },
          });
          go.push("delegations");
        },
      },
    );
    return items;
  };

  const buildPanelMenuItems = (p) => {
    if (!p) return [];
    return [
      { label: "Copy section text", icon: "⧉", onClick: () => copyToClipboard(p.text || "") },
      { label: "Copy section name", icon: "⧉", onClick: () => copyToClipboard(p.section || "") },
      {
        label: "Send section to delegations",
        icon: "↗",
        onClick: async () => {
          await sendToDelegationsDraft({
            text: `Review this dossier section and propose a next action.\nLead: ${detail && (detail.name || detail.id)}\nSection: ${p.section}\n\n${p.text || ""}`,
            label: `Dossier section: ${(detail && (detail.name || detail.id)) || "lead"} · ${p.section}`,
            source: { surface: "boxes", route: "boxes", entity: { type: "box", id: detail && detail.id } },
            policy: { target: "claude_code", intent: "run", approval_required: false },
            mode: "safe",
            context: { box_id: detail && detail.id, section: p.section },
          });
          go.push("delegations");
        },
      },
    ];
  };

  return (
    <div className="boxes-screen">
      <header className="boxes-head">
        <div>
          <div className="ix-eyebrow">auto boxes · runtime source</div>
          <h1 className="ix-detail-title">Boxes</h1>
          <div className="ix-lede">Focused dossier workspace: Hugo + Brenda/Steve only while we finalize the design system.</div>
        </div>
        <div className="boxes-head-actions">
          <button className="btn ghost on" disabled>focused pair</button>
          <select className="ix-create-input" value={String(pollMs)} onChange={(e) => setPollMs(Number(e.target.value || 0))}>
            <option value="0">poll off</option>
            <option value="30000">poll 30s</option>
            <option value="60000">poll 60s</option>
            <option value="120000">poll 2m</option>
          </select>
          <button className="ix-cta" onClick={loadList} disabled={refreshing}>{refreshing ? "refreshing…" : "refresh"}</button>
        </div>
      </header>

      {!!err && <div className="ix-error">{err}</div>}

      <div className={"boxes-layout" + (showRoster ? "" : " focus-mode")}>
        {showRoster ? (
        <aside className="boxes-list">
          <div className="boxes-controls">
            <input className="ix-create-input" placeholder="Search boxes…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="ix-create-input" value={kindFilter} onChange={(e) => setKindFilter(e.target.value)}>
              <option value="all">all kinds</option>
              <option value="lead">lead</option>
              <option value="client">client</option>
              <option value="coworker">coworker</option>
            </select>
          </div>
          <div className="boxes-counts mono dim">{visible.length} active dossiers</div>
          {loading ? (
            <div className="ix-empty-body">Loading boxes…</div>
          ) : (
            <div className="boxes-list-scroll">
              {visible.map((b) => (
                <button
                  key={b.id}
                  className={"ix-card boxes-list-item " + ((b.completeness && b.completeness.status) ? `is-${b.completeness.status}` : "is-thin") + (selectedId === b.id ? " selected" : "")}
                  onClick={() => { setSelectedId(b.id); setSection("state"); setShowRoster(false); }}
                  onContextMenu={(e) => openBoxMenu(e, b)}
                  title={b.folder_rel}
                >
                  <div className="ix-card-name">{b.name || b.id}</div>
                  <div className="ix-card-meta">
                    <span><b>{b.kind || "lead"}</b></span><span>·</span>
                    <span>{b.source_kind || "box"}</span><span>·</span>
                    <span className="ix-card-time">{_ixFmtRelative(new Date((b.mtime || 0) * 1000).toISOString())}</span>
                  </div>
                  <div className="boxes-item-health">
                    <span className={"boxes-health-dot " + ((b.completeness && b.completeness.status) ? `is-${b.completeness.status}` : "is-thin")} />
                    <span>{((b.completeness && b.completeness.score_pct) || 0)}% ready</span>
                    <span>·</span>
                    <span>{(b.html_count || 0)} pages</span>
                  </div>
                </button>
              ))}
              {!visible.length && <div className="ix-empty-body">No boxes match this filter.</div>}
            </div>
          )}
          <div className="boxes-mismatch mono dim">
            mismatch: {(mismatch.unmatched_box_ids || []).length} unlinked boxes · {(mismatch.unmatched_people || []).length} unboxed people
          </div>
        </aside>
        ) : null}

        <section className={"boxes-main " + detailHealthClass}>
          {!selectedId ? (
            <div className="ix-empty"><div className="ix-empty-title">Pick a box.</div></div>
          ) : detailLoading ? (
            <div className="ix-empty-body">Loading detail…</div>
          ) : detail ? (
            <div className="boxes-main-scroll" ref={mainScrollRef}>
              <div className="ix-section-head">
                {!showRoster && (
                  <button className="btn ghost boxes-back-btn" onClick={() => setShowRoster(true)}>← back to lead roster</button>
                )}
                <div className="ix-eyebrow">{detail.kind} · {detail.source_kind}</div>
                <h2 className="ix-h2">{detail.name || detail.id}</h2>
                {isHugoLead ? <div className="ix-eyebrow">special dossier theme: hugo</div> : null}
                {isBrendaLead ? <div className="ix-eyebrow">special dossier theme: brenda + steve</div> : null}
                <div className="ix-card-meta">
                  <span><b>id</b> {detail.id}</span>
                  <span>·</span>
                  <span><b>folder</b> {detail.folder_rel}</span>
                  {detail.person_id && <span>· <b>person</b> {detail.person_id}</span>}
                </div>
              </div>

              <div className="boxes-facts-row">
                {keyFacts.map(([k, v]) => (
                  <div key={k} className="boxes-fact-pill">
                    <span className="boxes-fact-key">{k}</span>
                    <span className="boxes-fact-val">{String(v)}</span>
                  </div>
                ))}
              </div>

              <div className="boxes-checkline">
                <div className="boxes-checkline-track">
                  <div className={"boxes-checkline-fill " + detailHealthClass} style={{ width: `${Math.max(4, Math.min(100, Number(detailCompleteness.score_pct || 0)))}%` }} />
                </div>
                <div className="boxes-checkline-text">{Number(detailCompleteness.score_pct || 0)}% dossier ready · {detailChecklist.filter(i => i.present).length}/{detailChecklist.length || 0} sections complete</div>
              </div>

              <div className="boxes-nav-row">
                <div className="boxes-section-tabs">
                  <button className={"btn ghost" + (section === "state" ? " on" : "")} onClick={() => { setSection("state"); }}>state</button>
                  <button className={"btn ghost" + (section === "profile" ? " on" : "")} onClick={() => { setSection("profile"); }}>profile</button>
                  <button className={"btn ghost" + (section === "comms" ? " on" : "")} onClick={() => { setSection("comms"); }}>comms</button>
                  <button className={"btn ghost" + (section === "enrichment" ? " on" : "")} onClick={() => { setSection("enrichment"); }}>enrichment</button>
                  <button className={"btn ghost" + (section === "plan" ? " on" : "")} onClick={() => { setSection("plan"); }}>7-day plan</button>
                  <button className={"btn ghost" + (section === "agents" ? " on" : "")} onClick={() => { setSection("agents"); }}>agents</button>
                  <button className={"btn ghost" + (section === "logic" ? " on" : "")} onClick={() => { setSection("logic"); }}>logic</button>
                </div>
              </div>

              {section === "state" ? (
                <div className="ix-doc boxes-md-panel" onContextMenu={(e) => { ctxPanelRef.current = { section: "state", text: (stateTouches || []).join("\n") }; panelMenu.onContextMenu(e); }}>
                  {renderSectionHero("state")}
                  <div className="ix-eyebrow">state · last 5 touches</div>
                  {(stateTouches || []).length ? (
                    <div className="boxes-state-list boxes-receipts">
                      {(stateTouches || []).map((touch, idx) => (
                        <div key={`${idx}:${touch.slice(0, 32)}`} className="boxes-state-item receipt">
                          <span className="boxes-state-index">{idx + 1}</span>
                          <span className="when">Touch</span>
                          <span className="who">Lead</span>
                          <span className="what">{touch}</span>
                        </div>
                      ))}
                    </div>
                  ) : <div className="ix-empty-body">No touches captured yet.</div>}
                </div>
              ) : section === "enrichment" ? (
                <div className="ix-doc boxes-md-panel" onContextMenu={(e) => { ctxPanelRef.current = { section: "enrichment", text: sectionText || "" }; panelMenu.onContextMenu(e); }}>
                  {renderSectionHero("enrichment")}
                  <div className="boxes-enrichment-head">
                    <div className="ix-eyebrow">enrichment</div>
                    <div className="mono dim">Operationally usable context vs. protected/off-limits context.</div>
                  </div>
                  {(() => {
                    const split = splitEnrichment(sectionText);
                    return (
                      <div className="boxes-enrichment-grid">
                        <article className="boxes-enrich-col">
                          <div className="bx-state bx-state-observed">Operationally usable context</div>
                          {split.allowed.trim()
                            ? <Markdown text={split.allowed} className="boxes-md boxes-md-rich" />
                            : <div className="ix-empty-body">No usable context captured yet.</div>}
                        </article>
                        <article className="boxes-enrich-col protected">
                          <div className="bx-state bx-state-blocked">Protected / off-limits context</div>
                          {split.protected.trim()
                            ? <Markdown text={split.protected} className="boxes-md boxes-md-rich" />
                            : <div className="ix-empty-body">No protected constraints documented yet.</div>}
                        </article>
                      </div>
                    );
                  })()}
                  {isBrendaLead ? renderBrendaSection("enrichment", sectionText) : (isHugoLead ? renderHugoSection("enrichment", sectionText) : null)}
                </div>
              ) : (
                <div className="ix-doc boxes-md-panel" onContextMenu={(e) => { ctxPanelRef.current = { section, text: sectionText || "" }; panelMenu.onContextMenu(e); }}>
                  {renderSectionHero(section)}
                  {isBrendaLead ? renderBrendaSection(section, sectionText) : (isHugoLead ? renderHugoSection(section, sectionText) : renderDossierText(sectionText))}
                </div>
              )}
            </div>
          ) : (
            <div className="ix-empty-body">Detail unavailable.</div>
          )}
        </section>
      </div>

      {listMenu.render(buildBoxMenuItems(ctxBoxRef.current), (ctxBoxRef.current && ctxBoxRef.current.name) || "box")}
      {panelMenu.render(buildPanelMenuItems(ctxPanelRef.current), (ctxPanelRef.current && ctxPanelRef.current.section) || "section")}
    </div>
  );
}

function IntakeScreen({ go, openSlug }) {
  // Local "view mode" — list of reports, or one report's detail. Using
  // local state (not the router) so back-button behavior here is a simple
  // toggle. An openSlug prop (from "Open as Intake Report →" on the Boxes
  // page) opens that report directly on first mount.
  const [activeSlug, setActiveSlug] = useState(openSlug || null);
  useEffect(() => {
    if (openSlug && openSlug !== activeSlug) setActiveSlug(openSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSlug]);
  if (activeSlug) {
    return <IntakeReportDetail slug={activeSlug} onBack={() => setActiveSlug(null)} go={go}/>;
  }
  return <IntakeReportsList onPick={setActiveSlug} go={go}/>;
}

// ─── Reports list ──────────────────────────────────────────────────────
function IntakeReportsList({ onPick, go }) {
  const [items, setItems]   = useState([]);
  const [boxReports, setBoxReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const listMenu = useContextMenu();
  const ctxReportRef = useRef(null);

  const refresh = useCallback(() => {
    setLoading(true); setErr(null);
    fetchJson("/api/reports/list").then(d => {
      setItems(d.items || []);
      setBoxReports(d.box_reports || []);
    }).catch(e => setErr(e.message)).finally(() => setLoading(false));
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const createReport = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const r = await fetchJson("/api/reports/create", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      if (!r.ok) throw new Error(r.error || "create failed");
      setShowCreate(false);
      setNewName("");
      onPick(r.slug);
    } catch (e) {
      alert("Create failed: " + (e.message || e));
    } finally { setCreating(false); }
  };

  const copyToClipboard = (text) => {
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch { return false; }
  };

  const deleteReportFromList = async (r) => {
    if (!r || !r.slug) return;
    if (!confirm(`Delete report "${r.name}"?`)) return;
    try {
      const res = await fetchJson("/api/reports/delete", {
        method: "POST",
        body: JSON.stringify({ slug: r.slug }),
      });
      if (!res.ok) throw new Error(res.error || "delete failed");
      await refresh();
    } catch (e) {
      alert("Delete failed: " + (e.message || e));
    }
  };

  const openListContextMenu = (e, report) => {
    ctxReportRef.current = report;
    listMenu.onContextMenu(e);
  };

  const buildReportMenuItems = (r) => {
    if (!r) return [];
    const isBox = r.source === "box_synthesis";
    const items = [
      { label: isBox ? "Open box report" : "Open report", icon: "↗", onClick: () => onPick(r.slug) },
    ];
    if (isBox) {
      items.push({ label: "Open in Boxes →", icon: "▤", onClick: () => go && go.push && go.push("boxes", { selectId: r.slug }) });
    }
    items.push(
      { divider: true },
      { label: "Copy name", icon: "⧉", onClick: () => copyToClipboard(r.name || "") },
      { label: "Copy slug", icon: "⧉", onClick: () => copyToClipboard(r.slug || "") },
      { label: "Copy quick stats", icon: "⧉", onClick: () => copyToClipboard(`${r.name || r.slug}: ${r.doc_count || 0} docs, ${r.qa_count || 0} answers`) },
    );
    if (!isBox) {
      items.push(
        { divider: true },
        { label: "Delete report", icon: "✕", danger: true, onClick: () => deleteReportFromList(r) },
      );
    }
    return items;
  };

  const renderCard = (r) => {
    const isBox = r.source === "box_synthesis";
    return (
      <button
        key={r.slug}
        className={"ix-card" + (isBox ? " ix-card-box" : "")}
        onClick={() => onPick(r.slug)}
        onContextMenu={(e) => openListContextMenu(e, r)}
        title="Right-click for actions"
      >
        {isBox && (
          <div className="ix-card-eyebrow" style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 6 }}>
            box · {r.kind || "lead"}
          </div>
        )}
        <div className="ix-card-name">{r.name}</div>
        {(r.doc_types || []).length > 0 && (
          <div className="ix-card-types">
            {r.doc_types.slice(0, 6).map(t => (
              <span key={t} className={"ix-doctype ix-doctype-" + t}>{t}</span>
            ))}
          </div>
        )}
        <div className="ix-card-meta">
          <span><b>{r.doc_count}</b> {r.doc_count === 1 ? "doc" : "docs"}</span>
          <span>·</span>
          <span><b>{r.qa_count}</b> {r.qa_count === 1 ? "answer" : "answers"}</span>
          <span>·</span>
          <span className="ix-card-time">{_ixFmtRelative(r.updated_at)}</span>
        </div>
      </button>
    );
  };

  return (
    <div className="ix-screen">
      {/* Hero header */}
      <header className="ix-hero">
        <div className="ix-hero-left">
          <div className="ix-eyebrow">intake · the smorgasbord</div>
          <h1 className="ix-h1">Reports<span className="ix-h1-period">.</span></h1>
          <div className="ix-lede">Drop receipts, CSVs, PDFs, photos, notes — anything. Rodbot reads it all and answers your questions about it.</div>
        </div>
        <div className="ix-hero-right">
          <div className="ix-stat">
            <div className="ix-stat-num">{items.length}</div>
            <div className="ix-stat-lbl">reports</div>
          </div>
          <button className="ix-cta" onClick={() => setShowCreate(true)}>
            <span className="ix-cta-plus">+</span>
            <span>new report</span>
          </button>
        </div>
      </header>

      {/* Inline create form */}
      {showCreate && (
        <div className="ix-create">
          <div className="ix-eyebrow">name your report</div>
          <div className="ix-create-row">
            <input
              autoFocus
              className="ix-create-input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") { e.preventDefault(); createReport(); }
                if (e.key === "Escape") { setShowCreate(false); setNewName(""); }
              }}
              placeholder="e.g. Q1 tax prep, Insurance claim 2026, Receipt audit…"
            />
            <button className="btn primary" onClick={createReport} disabled={!newName.trim() || creating}>
              {creating ? "creating…" : "create →"}
            </button>
            <button className="btn ghost" onClick={() => { setShowCreate(false); setNewName(""); }}>cancel</button>
          </div>
        </div>
      )}

      {/* Loading / error / empty / list */}
      {loading && (
        <div className="ix-skeleton">
          {[0,1,2].map(i => <div key={i} className="ix-skeleton-row"/>)}
        </div>
      )}
      {!loading && err && (
        <div className="ix-error">✕ {err}</div>
      )}
      {!loading && !err && items.length === 0 && boxReports.length === 0 && (
        <div className="ix-empty">
          <div className="ix-empty-mark">∅</div>
          <h2 className="ix-empty-title">No reports yet.</h2>
          <p className="ix-empty-body">
            A report is a workspace for messy stacks of documents — tax prep, an insurance claim, a receipt audit. Give it a name and start dropping files in.
          </p>
          <button className="btn primary" onClick={() => setShowCreate(true)}>+ create your first report</button>
        </div>
      )}
      {!loading && !err && boxReports.length > 0 && (
        <div className="ix-section">
          <div className="ix-section-head" style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "0 0 10px", borderBottom: "1px solid var(--rule)", marginBottom: 18 }}>
            <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 500, margin: 0, letterSpacing: "-0.01em" }}>Box Reports<span style={{ color: "var(--muted-2)" }}>.</span></h2>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-2)" }}>auto · one per client box · ask the box anything</span>
            <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{boxReports.length}</span>
          </div>
          <div className="ix-grid">
            {boxReports.map(renderCard)}
          </div>
        </div>
      )}
      {!loading && !err && items.length > 0 && (
        <div className="ix-section" style={{ marginTop: boxReports.length > 0 ? 36 : 0 }}>
          {boxReports.length > 0 && (
            <div className="ix-section-head" style={{ display: "flex", alignItems: "baseline", gap: 12, padding: "0 0 10px", borderBottom: "1px solid var(--rule)", marginBottom: 18 }}>
              <h2 style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 500, margin: 0, letterSpacing: "-0.01em" }}>Workspaces<span style={{ color: "var(--muted-2)" }}>.</span></h2>
              <span style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted-2)" }}>manual · drop anything, ask anything</span>
              <span style={{ marginLeft: "auto", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>{items.length}</span>
            </div>
          )}
          <div className="ix-grid">
            {items.map(renderCard)}
          </div>
        </div>
      )}

      <div className="ix-footer">
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
      </div>
      {listMenu.render(buildReportMenuItems(ctxReportRef.current), ctxReportRef.current ? ctxReportRef.current.name : null)}
    </div>
  );
}

// ─── Thinking trace (animated steps from gpt-5.4-mini preprocessor) ────
// The chat preprocessor returns 6–9 short flavor strings describing what
// the orchestrator is doing while Claude grinds. We reveal them at a steady
// pace, with the most recent one pulsing and earlier ones marked done. When
// Rodbot's actual answer lands, the parent swaps this whole block out for
// the rendered markdown — the trace is "in-flight" UI only.
function IntakeThinkingTrace({ trace, model }) {
  const items = Array.isArray(trace) ? trace : [];
  const [shown, setShown] = useState(1);
  useEffect(() => {
    if (shown >= items.length) return;
    const t = setTimeout(() => setShown(n => Math.min(n + 1, items.length)), 700);
    return () => clearTimeout(t);
  }, [shown, items.length]);

  if (items.length === 0) return null;
  return (
    <div className="ix-trace">
      <div className="ix-trace-head">
        <span className="ix-trace-label">thinking · {model || "gpt-5.4-mini"} → claude</span>
      </div>
      <ol className="ix-trace-list">
        {items.slice(0, shown).map((line, i) => {
          const isActive = i === shown - 1 && shown < items.length;
          const done     = !isActive && i < shown - 1;
          // When all steps are revealed, keep the last one pulsing too —
          // Claude is still working in the background.
          const tailPulse = i === shown - 1 && shown === items.length;
          return (
            <li key={i} className={"ix-trace-line"
                + (done ? " done" : "")
                + (isActive || tailPulse ? " active" : "")}>
              <span className="ix-trace-mark" aria-hidden="true">{done ? "✓" : "○"}</span>
              <span className="ix-trace-text">{line}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// ─── Document card ─────────────────────────────────────────────────────
const DOC_ICONS = {
  image: "▣", pdf: "▦", csv: "▤", json: "{}", md: "✎", txt: "▤", code: "</>", sheet: "▥", doc: "▧", unknown: "?",
};

function IntakeDocumentCard({ doc, onDelete, onContextMenu }) {
  const [expanded, setExpanded] = useState(false);
  const icon = DOC_ICONS[doc.type] || "?";
  const cls = doc.classification || {};
  const conf = typeof cls.confidence === "number" ? cls.confidence : null;

  return (
    <div className={"ix-doc ix-doc-" + doc.type} onContextMenu={onContextMenu} title="Right-click for actions">
      <div className="ix-doc-head">
        <span className={"ix-doc-icon ix-doc-icon-" + doc.type}>{icon}</span>
        <div className="ix-doc-name-wrap">
          <div className="ix-doc-name">{doc.filename}</div>
          <div className="ix-doc-summary">{doc.summary || "—"}</div>
        </div>
        <div className="ix-doc-actions">
          <button className="ix-doc-toggle" onClick={() => setExpanded(e => !e)} title={expanded ? "collapse" : "expand"}>
            {expanded ? "▾" : "▸"}
          </button>
          {onDelete ? (
            <button className="ix-doc-x" onClick={onDelete} title="Remove">✕</button>
          ) : (
            <span className="ix-doc-x" title="This file lives in the box; manage it from the Boxes page" style={{ opacity: 0.3, cursor: "not-allowed" }}>✕</span>
          )}
        </div>
      </div>

      {(cls.kind || conf != null) && (
        <div className="ix-doc-tags">
          {cls.kind && <span className={"ix-doc-kind ix-doc-kind-" + cls.kind}>{cls.kind}</span>}
          {conf != null && <span className="ix-doc-conf">conf {conf.toFixed(2)}</span>}
        </div>
      )}

      {expanded && (
        <div className="ix-doc-body">
          {doc.raw_text && (
            <details className="ix-doc-detail" open>
              <summary>raw text · {doc.raw_text.length.toLocaleString()} chars</summary>
              <pre className="ix-doc-pre">{doc.raw_text.slice(0, 4000)}{doc.raw_text.length > 4000 ? "\n… (truncated)" : ""}</pre>
            </details>
          )}
          {doc.structured && (Array.isArray(doc.structured) || Object.keys(doc.structured || {}).length > 0) && (
            <details className="ix-doc-detail">
              <summary>structured</summary>
              <pre className="ix-doc-pre">{(() => {
                try { return JSON.stringify(doc.structured, null, 2).slice(0, 3000); }
                catch { return String(doc.structured).slice(0, 3000); }
              })()}</pre>
            </details>
          )}
          {doc.error && (
            <div className="ix-doc-error">✕ {doc.error}</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Report detail (drop zone + docs + Q&A) ────────────────────────────
function IntakeReportDetail({ slug, onBack, go }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [ingesting, setIngesting] = useState({}); // tempId → { filename, stage, error? }
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [askErr, setAskErr] = useState(null);
  const fileInputRef = useRef(null);
  const ingestQueueRef = useRef(Promise.resolve());
  const docMenu = useContextMenu();
  const qaMenu = useContextMenu();
  const ctxDocRef = useRef(null);
  const ctxQaRef = useRef(null);

  const refresh = useCallback(() => {
    setLoading(true); setErr(null);
    fetchJson(`/api/reports/get?slug=${encodeURIComponent(slug)}`).then(d => {
      if (!d.ok) throw new Error(d.error || "failed");
      setReport(d.report);
    }).catch(e => setErr(e.message)).finally(() => setLoading(false));
  }, [slug]);
  useEffect(() => { refresh(); }, [refresh]);

  const ingestFile = useCallback(async (file) => {
    const tempId = "t_" + Math.random().toString(36).slice(2, 9);
    setIngesting(prev => ({ ...prev, [tempId]: { filename: file.name, stage: "uploading" } }));
    try {
      const data64 = await new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = () => rej(new Error("read failed"));
        fr.readAsDataURL(file);
      });
      const up = await fetchJson("/api/attachments/upload", {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          mime: file.type || "application/octet-stream",
          data_base64: data64,
        }),
      });
      if (!up.ok) throw new Error(up.error || "upload failed");
      setIngesting(prev => ({ ...prev, [tempId]: { filename: file.name, stage: "rodbot reading…" } }));
      const ing = await fetchJson(`/api/reports/${encodeURIComponent(slug)}/ingest`, {
        method: "POST",
        body: JSON.stringify({
          upload_path: up.path,
          mime: up.mime || file.type,
          filename: file.name,
        }),
      });
      if (!ing.ok) throw new Error(ing.error || "ingest failed");
      setIngesting(prev => { const n = { ...prev }; delete n[tempId]; return n; });
      await refresh();
    } catch (e) {
      setIngesting(prev => ({ ...prev, [tempId]: { filename: file.name, stage: "error", error: e.message } }));
      setTimeout(() => {
        setIngesting(prev => { const n = { ...prev }; delete n[tempId]; return n; });
      }, 5000);
    }
  }, [slug, refresh]);

  const enqueueIngest = useCallback((files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    ingestQueueRef.current = ingestQueueRef.current.then(async () => {
      for (const f of list) {
        await ingestFile(f);
      }
    }).catch((e) => {
      console.warn("[intake] ingest queue failed:", e && e.message ? e.message : e);
    });
  }, [ingestFile]);

  const onFilesPicked = (e) => {
    enqueueIngest(e.target.files || []);
    if (e.target) e.target.value = "";
  };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragOver(false);
    enqueueIngest((e.dataTransfer && e.dataTransfer.files) || []);
  };
  const onDragOver  = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const onDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };

  // Two-stage flow:
  //   1. POST /api/chat/preprocess  — gpt-5.4-mini rewrites the question into a
  //      sharper Claude prompt and emits 6–9 contextual "thinking" lines we can
  //      animate while Rodbot is actually working. ~1s, cheap, parallelized.
  //   2. POST /api/reports/<slug>/ask — sends the enhanced prompt + the trace
  //      to the server, which puts the enhanced version in front of Claude
  //      while preserving the user's original wording in conversation history.
  //
  // The preprocess step is best-effort: if it fails or is unavailable (no
  // OPENAI key), we fall through to the unenhanced ask so the feature still
  // works. The pending qa entry's `thinking_trace` is what powers the
  // animated steps in the UI.
  const askQuestion = async (questionOverride) => {
    const q = (questionOverride || question).trim();
    if (!q) return;
    setAsking(true); setAskErr(null);

    // Optimistic: append a pending entry first — we'll patch in the trace
    // when (or if) preprocess returns.
    const optimisticId = "qa_pending_" + Math.random().toString(36).slice(2, 9);
    setReport(prev => prev ? {
      ...prev,
      conversation: [...(prev.conversation || []), {
        id: optimisticId, question: q, answer: null,
        ts: new Date().toISOString(), pending: true,
        thinking_trace: null, thinking_model: null,
      }],
    } : prev);
    setQuestion("");

    let enhancedPrompt = null;
    let thinkingTrace = null;
    let thinkingModel = null;
    let preprocessModel = "gpt-5.4-mini";
    try {
      const t = JSON.parse(localStorage.getItem("secretary.tweaks") || "{}");
      if (t && typeof t.openaiModel === "string" && /^(gpt-5\.4|gpt-5\.4-mini|gpt-5\.4-nano)$/.test(t.openaiModel)) {
        preprocessModel = t.openaiModel;
      }
    } catch {}

    try {
      // Stage 1 — preprocess (best-effort, 8s timeout)
      try {
        const ppController = new AbortController();
        const ppTimer = setTimeout(() => ppController.abort(), 8000);
        const pp = await fetchJson("/api/chat/preprocess", {
          method: "POST",
          body: JSON.stringify({
            message: q,
            model: preprocessModel,
            // Hint the mini model about the doc context so its trace lines
            // and prompt rewrite are concretely about THIS report.
            attachments: (report?.documents || []).slice(0, 6).map(d => ({
              original_filename: d.filename,
              mime: d.mime || d.type,
              size: 0,
            })),
          }),
          signal: ppController.signal,
        }).catch(() => null);
        clearTimeout(ppTimer);
        if (pp && pp.ok) {
          enhancedPrompt = pp.enhanced_prompt || null;
          thinkingTrace  = Array.isArray(pp.thinking_trace) ? pp.thinking_trace : null;
          thinkingModel  = pp.model || preprocessModel;
          // Patch the optimistic entry so the trace starts animating.
          setReport(prev => prev ? {
            ...prev,
            conversation: (prev.conversation || []).map(c =>
              c.id === optimisticId
                ? { ...c, thinking_trace: thinkingTrace, thinking_model: thinkingModel }
                : c
            ),
          } : prev);
        }
      } catch { /* preprocess is best-effort; ignore */ }

      // Stage 2 — actual ask (with enhanced prompt and trace)
      const r = await fetchJson(`/api/reports/${encodeURIComponent(slug)}/ask`, {
        method: "POST",
        body: JSON.stringify({
          question: q,
          enhanced_prompt: enhancedPrompt || undefined,
          thinking_trace:  thinkingTrace  || undefined,
        }),
      });
      if (!r.ok) throw new Error(r.error || "ask failed");
      // Replace optimistic with real qa
      setReport(prev => prev ? {
        ...prev,
        conversation: (prev.conversation || []).map(c => c.id === optimisticId ? r.qa : c),
      } : prev);
    } catch (e) {
      setAskErr(e.message);
      setReport(prev => prev ? {
        ...prev,
        conversation: (prev.conversation || []).map(c => c.id === optimisticId ? { ...c, error: e.message, pending: false } : c),
      } : prev);
    } finally { setAsking(false); }
  };

  const deleteDoc = async (docId) => {
    if (!confirm("Remove this document from the report?")) return;
    try {
      const r = await fetchJson(`/api/reports/${encodeURIComponent(slug)}/documents/${docId}/delete`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!r.ok) throw new Error(r.error || "delete failed");
      await refresh();
    } catch (e) { alert("Delete failed: " + e.message); }
  };

  const deleteReport = async () => {
    if (!confirm(`Delete report "${report?.name}"? All documents and Q&A history will be lost.`)) return;
    try {
      const r = await fetchJson("/api/reports/delete", {
        method: "POST",
        body: JSON.stringify({ slug }),
      });
      if (!r.ok) throw new Error(r.error || "delete failed");
      onBack();
    } catch (e) { alert("Delete failed: " + e.message); }
  };

  const copyToClipboard = (text) => {
    if (!text) return false;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        return true;
      }
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      return true;
    } catch { return false; }
  };

  const openDocSource = (doc) => {
    if (!doc || !doc.stored_path) return;
    const url = "/" + String(doc.stored_path).replace(/^\/+/, "");
    window.open(url, "_blank", "noopener");
  };

  const askFromDoc = (doc, mode) => {
    if (!doc) return;
    const base = doc.filename || "this document";
    const prompts = {
      summary: `Summarize only "${base}" and list the key takeaways.`,
      extract: `Extract structured fields from "${base}" in a clean JSON object.`,
      risks: `Review "${base}" for deadlines, risks, and missing information.`,
    };
    const q = prompts[mode] || prompts.summary;
    askQuestion(q);
  };

  const openDocContextMenu = (e, doc) => {
    ctxDocRef.current = doc;
    docMenu.onContextMenu(e);
  };
  const openQaContextMenu = (e, qa) => {
    ctxQaRef.current = qa;
    qaMenu.onContextMenu(e);
  };

  const buildDocMenuItems = (doc) => {
    if (!doc) return [];
    return [
      {
        label: "Send doc analysis to delegations",
        icon: "↗",
        onClick: async () => {
          const prompt = `Analyze document "${doc.filename}" in report "${report?.name || slug}" and prepare an execution-ready plan from its contents.`;
          await sendToDelegationsDraft({
            text: prompt,
            label: `Intake doc: ${doc.filename}`,
            source: { surface: "intake", route: "intake", entity: { type: "report_document", id: doc.id, slug } },
            policy: { target: "github", intent: "read", approval_required: false },
            mode: "safe",
            context: { report_slug: slug, report_name: report?.name || null, document_id: doc.id },
          });
          go.push("delegations");
        },
      },
      { divider: true },
      { label: "Ask summary of this doc", icon: "💬", onClick: () => askFromDoc(doc, "summary") },
      { label: "Extract structured fields", icon: "⊞", onClick: () => askFromDoc(doc, "extract") },
      { label: "Find risks + deadlines", icon: "⚑", onClick: () => askFromDoc(doc, "risks") },
      { divider: true },
      { label: "Open source file", icon: "↗", onClick: () => openDocSource(doc), disabled: !doc.stored_path },
      { label: "Copy filename", icon: "⧉", onClick: () => copyToClipboard(doc.filename || "") },
      { label: "Copy extracted text", icon: "⧉", onClick: () => copyToClipboard(doc.extracted_text || ""), disabled: !doc.extracted_text },
      { divider: true },
      { label: "Remove document", icon: "✕", danger: true, onClick: () => deleteDoc(doc.id) },
    ];
  };

  const buildQaMenuItems = (qa) => {
    if (!qa) return [];
    return [
      {
        label: "Send this Q&A to delegations",
        icon: "↗",
        onClick: async () => {
          const prompt = `From report "${report?.name || slug}", execute follow-through from this Q&A.\n\nQ: ${qa.question || ""}\n\nA:\n${qa.answer || ""}`;
          await sendToDelegationsDraft({
            text: prompt,
            label: "Intake Q&A follow-through",
            source: { surface: "intake", route: "intake", entity: { type: "report_qa", id: qa.id, slug } },
            policy: { target: "github", intent: "read", approval_required: false },
            mode: "safe",
            context: { report_slug: slug, qa_id: qa.id || null },
          });
          go.push("delegations");
        },
      },
      { divider: true },
      { label: "Ask this again", icon: "↺", onClick: () => askQuestion(qa.question || ""), disabled: !qa.question || asking },
      { divider: true },
      { label: "Copy question", icon: "⧉", onClick: () => copyToClipboard(qa.question || ""), disabled: !qa.question },
      { label: "Copy answer", icon: "⧉", onClick: () => copyToClipboard(qa.answer || ""), disabled: !qa.answer },
      { label: "Copy Q&A as markdown", icon: "⧉", onClick: () => copyToClipboard(`### Q\n${qa.question || ""}\n\n### A\n${qa.answer || ""}`), disabled: !qa.question && !qa.answer },
    ];
  };

  if (loading) return <div style={{padding:40, textAlign:"center", color:"var(--ink-4)"}}>loading report…</div>;
  if (err) return <div style={{padding:20, color:"var(--data-negative)"}}>Error: {err} <button className="btn ghost" onClick={onBack} style={{marginLeft:12}}>← back</button></div>;
  if (!report) return null;

  const docs = report.documents || [];
  const conversation = report.conversation || [];
  const ingestingArr = Object.entries(ingesting);
  const isBoxReport = report.source === "box_synthesis";
  const boxId = isBoxReport ? (report.box && report.box.id) || report.slug : null;

  const SUGGESTIONS = [
    "Summarize what's in these documents.",
    "OCR everything and flag lines you are uncertain about.",
    "Extract line items and totals into a clean table.",
    "Pull out every name, address, phone, and email.",
    "What deadlines, due dates, or follow-ups are buried in here?",
    "Find contradictions or mismatches across these files.",
    "What questions should I be asking that I'm not?",
  ];

  return (
    <div className="ix-detail">
      {/* Hero header */}
      <header className="ix-detail-head">
        <button className="ix-back" onClick={onBack}>← reports</button>
        <div className="ix-detail-title-wrap">
          <div className="ix-eyebrow">
            {isBoxReport ? "box report" : "intake report"} · {docs.length} {docs.length === 1 ? "doc" : "docs"} · {conversation.length} {conversation.length === 1 ? "answer" : "answers"}
          </div>
          <h1 className="ix-detail-title">{report.name}</h1>
          {report.description && <div className="ix-lede">{report.description}</div>}
          {isBoxReport && (
            <div style={{ marginTop: 6, fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
              synthesized from <code>{(report.box && report.box.folder_rel) || ""}</code> · drops land in <code>intake_drops/</code>
            </div>
          )}
        </div>
        {isBoxReport ? (
          <button
            className="btn ghost"
            onClick={() => go && go.push && go.push("boxes", { selectId: boxId })}
            title="Open this box in the Boxes page"
          >
            open in boxes →
          </button>
        ) : (
          <button className="ix-x" onClick={deleteReport} title="Delete this report">delete</button>
        )}
      </header>

      {/* Drop zone */}
      <div
        className={"ix-drop" + (dragOver ? " dragover" : "")}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}>
        <div className="ix-drop-icon">⤓</div>
        <div className="ix-drop-title">Drop anything in here.</div>
        <div className="ix-drop-sub">Receipts · invoices · CSV/XLSX · PDFs · photos · markdown · JSON · TXT · HTML · JavaScript — Rodbot reads them all.</div>
        <input ref={fileInputRef} type="file" multiple style={{display:"none"}}
          onChange={onFilesPicked}
          accept="image/*,application/pdf,text/csv,text/tab-separated-values,text/plain,text/markdown,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/html,application/javascript,text/javascript,.csv,.tsv,.txt,.md,.markdown,.json,.jsonl,.log,.xlsx,.xls,.docx,.doc,.html,.htm,.xml,.yaml,.yml,.js,.jsx,.ts,.tsx"/>
      </div>

      {/* In-flight uploads */}
      {ingestingArr.length > 0 && (
        <div className="ix-inflight">
          {ingestingArr.map(([id, item]) => (
            <div key={id} className={"ix-inflight-row" + (item.stage === "error" ? " error" : "")}>
              <span className="ix-inflight-stage">{item.stage}</span>
              <span className="ix-inflight-name">{item.filename}</span>
              {item.error && <span className="ix-inflight-error">· {item.error}</span>}
            </div>
          ))}
        </div>
      )}

      {/* Documents list */}
      {docs.length > 0 && (
        <section className="ix-docs">
          <div className="ix-section-head">
            <div className="ix-eyebrow">documents</div>
            <h2 className="ix-h2">What Rodbot has read.</h2>
          </div>
          <div className="ix-docs-grid">
            {docs.map(d => (
              <IntakeDocumentCard
                key={d.id}
                doc={d}
                onDelete={isBoxReport ? null : () => deleteDoc(d.id)}
                onContextMenu={(e) => openDocContextMenu(e, d)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Q&A panel */}
      <section className="ix-qa">
        <div className="ix-section-head">
          <div className="ix-eyebrow">ask rodbot</div>
          <h2 className="ix-h2">Ask anything about these documents.</h2>
        </div>

        {/* Suggestions when there's no conversation yet */}
        {conversation.length === 0 && docs.length > 0 && (
          <div className="ix-qa-suggestions">
            <div className="ix-qa-suggest-label">try one:</div>
            {SUGGESTIONS.map(s => (
              <button key={s} className="ix-qa-suggest" onClick={() => askQuestion(s)}>{s}</button>
            ))}
          </div>
        )}

        {/* Conversation history */}
        {conversation.map(qa => (
          <div
            key={qa.id}
            className={"ix-qa-entry" + (qa.pending ? " pending" : "") + (qa.error ? " errored" : "")}
            onContextMenu={(e) => openQaContextMenu(e, qa)}
            title="Right-click for actions"
          >
            <div className="ix-qa-q">
              <div className="ix-qa-label">YOU</div>
              <div className="ix-qa-text">{qa.question}</div>
            </div>
            <div className="ix-qa-a">
              <div className="ix-qa-label">RODBOT</div>
              {qa.pending ? (
                <div className="ix-qa-thinking-wrap">
                  {/* When the gpt-5.4-mini preprocessor returned a trace,
                      animate each line in turn. Otherwise fall back to the
                      three-dot pulser. */}
                  {Array.isArray(qa.thinking_trace) && qa.thinking_trace.length > 0 ? (
                    <IntakeThinkingTrace trace={qa.thinking_trace} model={qa.thinking_model || "gpt-5.4-mini"}/>
                  ) : (
                    <div className="ix-qa-text ix-qa-thinking">
                      <span className="ix-thinking-dot"/><span className="ix-thinking-dot"/><span className="ix-thinking-dot"/>
                      <span style={{marginLeft:8}}>reading {docs.length} {docs.length === 1 ? "doc" : "docs"}…</span>
                    </div>
                  )}
                </div>
              ) : qa.error ? (
                <div className="ix-qa-text ix-qa-error">✕ {qa.error}</div>
              ) : (
                <>
                  {/* Markdown render — uses the global Markdown component
                      (defined in components.jsx, marked + DOMPurify). */}
                  <Markdown text={qa.answer} className="ix-qa-text"/>
                  <div className="ix-qa-meta">
                    {qa.doc_count != null && <span>{qa.doc_count} {qa.doc_count === 1 ? "doc" : "docs"} read</span>}
                    {qa.ts && <span>· {_ixFmtRelative(qa.ts)}</span>}
                    {qa.route && <span>· {qa.route}</span>}
                    {qa.enhanced_prompt && <span>· prompt enhanced</span>}
                  </div>
                </>
              )}
            </div>
          </div>
        ))}

        {/* Question input */}
        <div className="ix-qa-input-wrap">
          <textarea
            className="ix-qa-input"
            value={question}
            onChange={e => setQuestion(e.target.value)}
            placeholder={docs.length === 0 ? "Drop a document first, then I'll be ready to read." : "Ask Rodbot anything about your documents… (⌘+Enter to send)"}
            rows={2}
            disabled={docs.length === 0 || asking}
            onKeyDown={e => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                askQuestion();
              }
            }}/>
          <button className="btn primary ix-qa-send"
            onClick={() => askQuestion()}
            disabled={!question.trim() || docs.length === 0 || asking}>
            {asking ? "thinking…" : "ask →"}
          </button>
        </div>
        {askErr && <div className="ix-error">✕ {askErr}</div>}
      </section>

      <div className="ix-footer">
        <button className="btn ghost" onClick={onBack}>← reports</button>
      </div>
      {docMenu.render(buildDocMenuItems(ctxDocRef.current), ctxDocRef.current ? ctxDocRef.current.filename : null)}
      {qaMenu.render(buildQaMenuItems(ctxQaRef.current), ctxQaRef.current ? "Q&A action" : null)}
    </div>
  );
}


// ─── Defensive fetch helper ─────────────────────────────────────────────
// Some environments return HTML 404 pages for unknown routes. Parsing the
// "<!doctype" as JSON is what produced the "Unexpected token '<'" error
// Rodrigo hit. This helper turns those into a real error with status + a
// short body preview so the UI can actually tell the user what's wrong.
async function fetchJson(url, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const ct = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!ct.includes("application/json")) {
    throw new Error(`server returned ${res.status} (${ct || "no content-type"}) for ${url} — did you restart server.py? (head: ${text.slice(0, 60).replace(/\s+/g," ")}…)`);
  }
  try { return JSON.parse(text); }
  catch (e) { throw new Error(`bad json from ${url}: ${e.message}`); }
}
window.fetchJson = fetchJson;

// ══════════════════════════════════════════════════════════════════════════════
// Analytics Screen — Source Channel Intelligence
// Reads CCAgentindex/analytics/source_channel_snapshot.json (bedrock).
// Run "Onboard Scripts/analytics_source_channels.py" to refresh.
// ══════════════════════════════════════════════════════════════════════════════

const FAMILY_COLORS = {
  digital_inbound:    { bg: "#C9D6E9", ink: "#2A3F66", dot: "#3F5A8E", label: "Digital Inbound" },
  expo_event:         { bg: "#F8DEC3", ink: "#7A4A1F", dot: "#B0712E", label: "Expo / Event" },
  marketplace:        { bg: "#DCD3EE", ink: "#4B3B7A", dot: "#6F5BB0", label: "Marketplace" },
  relationship_partner:{ bg: "#DDEDD8", ink: "#2E5A2A", dot: "#4D7A47", label: "Referral / Partner" },
  phone_inbound:      { bg: "#F0E6B5", ink: "#6B5A1A", dot: "#8E7724", label: "Phone Inbound" },
  other:              { bg: "#DCDFC8", ink: "#4A4F2A", dot: "#6B7240", label: "Other" },
  unknown:            { bg: "#E5E2D6", ink: "#6B6657", dot: "#9A9589", label: "Unknown" },
};

// ── AIcon — inline SVG from the design-deck icon set ─────────────────────────
function AIcon({ name, size = 14, style = {} }) {
  if (typeof window === "undefined" || !window.icon) return null;
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: window.icon(name, { size }) }}
    />
  );
}

// ── Analytics Context Menu ───────────────────────────────────────────────────
function AnalyticsContextMenu({ menu, onClose }) {
  useEffect(() => {
    if (!menu) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const onClick = () => onClose();
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [menu, onClose]);
  if (!menu) return null;

  const x = Math.min(menu.x, (typeof window !== "undefined" ? window.innerWidth : 1200) - 230);
  const y = Math.min(menu.y, (typeof window !== "undefined" ? window.innerHeight : 800) - (menu.items.length * 36 + 24));

  return (
    <div onClick={(e) => e.stopPropagation()}
      style={{
        position: "fixed", left: x, top: y, zIndex: 9999,
        background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.13)",
        borderRadius: 9, padding: "5px 0", minWidth: 210,
        boxShadow: "0 12px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.3)",
        userSelect: "none",
      }}>
      {menu.label && (
        <div style={{ padding: "6px 14px 8px", fontFamily: "var(--sans)", fontSize: 9,
          textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)",
          borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 4 }}>
          {menu.label}
        </div>
      )}
      {menu.items.map((item, i) => {
        if (item.divider) return (
          <div key={i} style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "4px 0" }} />
        );
        return (
          <button key={i}
            onClick={() => { item.action && item.action(); onClose(); }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
            style={{
              display: "flex", alignItems: "center", gap: 9, width: "100%",
              padding: "8px 14px", background: "none", border: "none", cursor: "pointer",
              fontFamily: "var(--sans)", fontSize: 12, letterSpacing: "0.01em",
              color: item.danger ? "#ff7070" : item.muted ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.88)",
              textAlign: "left",
            }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 14, flexShrink: 0, opacity: 0.75 }}>
              {item.icon ? <AIcon name={item.icon} size={13} /> : null}
            </span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.sub && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 6 }}>{item.sub}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ── Analytics Toast ───────────────────────────────────────────────────────────
function AnalyticsToast({ message }) {
  if (!message) return null;
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 10000,
      background: "var(--ink)", color: "var(--paper)", borderRadius: 8,
      padding: "11px 18px", fontFamily: "var(--sans)", fontSize: 12,
      boxShadow: "0 6px 20px rgba(0,0,0,0.35)", letterSpacing: "0.01em",
      animation: "fadeInUp 0.18s ease",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <AIcon name="check" size={13} style={{ color: "var(--mint-ink)" }} /> {message}
    </div>
  );
}

function AnalyticsScreen({ go }) {
  const [snap, setSnap] = useState(null);
  const [perf, setPerf] = useState(null);
  const [evts, setEvts] = useState(null);
  const [winLoss, setWinLoss] = useState(null);
  const [revTrends, setRevTrends] = useState(null);
  const [bookingLT, setBookingLT] = useState(null);
  const [cohortData, setCohortData] = useState(null);
  const [compareOwners, setCompareOwners] = useState(null); // [ownerA, ownerB] for side-panel
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [activeTab, setActiveTab] = useState("sources"); // sources | owners | pipeline | events | winloss | revenue | leadtime | cohort | leads | conversations

  // ── Interactivity state ───────────────────────────────────────────────────
  const [ctxMenu, setCtxMenu] = useState(null);          // { x, y, label, items[] }
  const [spotlight, setSpotlight] = useState(null);      // { type, value, label } — highlights one segment
  const [toastMsg, setToastMsg] = useState(null);        // string, auto-clears
  const [viewModes, setViewModes] = useState({           // per-tab view toggles
    sources: "chart",   // "chart" | "table"
    winloss: "rates",   // "rates" | "counts"
    revenue: "monthly", // "monthly" | "cumulative"
  });

  // ── Interactivity helpers ─────────────────────────────────────────────────
  const openCtx = (e, label, items) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, label, items });
  };
  const closeCtx = () => setCtxMenu(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2400);
  };

  const copyText = (text, label) => {
    try { navigator.clipboard?.writeText(text); } catch (_) {}
    showToast(`Copied: ${label}`);
  };

  const spotlightToggle = (type, value, label) => {
    setSpotlight(prev => (prev?.type === type && prev?.value === value) ? null : { type, value, label });
    showToast(spotlight?.value === value ? `Spotlight cleared` : `Spotlighting: ${label}`);
  };

  const spotDim = (type, value) => {
    if (!spotlight) return {};
    if (spotlight.type !== type) return {};
    if (spotlight.value === value) return { outline: "2px solid var(--lemon-ink)", outlineOffset: 2 };
    return { opacity: 0.28, filter: "saturate(0.3)" };
  };

  const openInClose = (query) => {
    window.open(`https://app.close.com/search/?query=${encodeURIComponent(query)}`, "_blank");
    showToast("Opening in Close CRM…");
  };

  const setViewMode = (tab, mode) => setViewModes(prev => ({ ...prev, [tab]: mode }));

  // CSV export helper — converts array-of-objects to .csv download
  const exportCSV = (rows, filename, colOrder) => {
    if (!rows || rows.length === 0) { showToast("No data to export"); return; }
    const cols = colOrder || Object.keys(rows[0]);
    const header = cols.join(",");
    const body = rows.map(r => cols.map(c => {
      const v = r[c] ?? "";
      const s = String(v).replace(/"/g, '""');
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
    }).join(",")).join("\n");
    const csv = header + "\n" + body;
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = filename || "export.csv";
    a.click();
    showToast(`↓ Exported ${rows.length} rows`);
  };

  // ViewToggle button strip
  const ViewToggle = ({ tab, options }) => (
    <div style={{ display: "flex", gap: 3 }}>
      {options.map(([mode, label, icon]) => (
        <button key={mode} onClick={() => setViewMode(tab, mode)}
          title={label}
          style={{
            fontFamily: "var(--mono)", fontSize: 9, padding: "4px 9px",
            border: "1px solid var(--rule)", borderRadius: 4, cursor: "pointer",
            background: viewModes[tab] === mode ? "var(--ink)" : "var(--paper)",
            color: viewModes[tab] === mode ? "var(--paper)" : "var(--muted)",
            letterSpacing: "0.06em", textTransform: "uppercase",
          }}>
          {icon} {label}
        </button>
      ))}
    </div>
  );

  useEffect(() => {
    setLoading(true); setErr(null);
    const t = Date.now();
    Promise.all([
      fetch(`CCAgentindex/analytics/source_channel_snapshot.json?_t=${t}`)
        .then(r => { if (!r.ok) throw new Error(`source HTTP ${r.status}`); return r.json(); }),
      fetch(`CCAgentindex/analytics/seller_performance_snapshot.json?_t=${t}`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`CCAgentindex/analytics/upcoming_events_snapshot.json?_t=${t}`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`CCAgentindex/analytics/win_loss_snapshot.json?_t=${t}`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`CCAgentindex/analytics/revenue_trends_snapshot.json?_t=${t}`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`CCAgentindex/analytics/booking_lead_time_snapshot.json?_t=${t}`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`CCAgentindex/analytics/cohort_snapshot.json?_t=${t}`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([srcData, perfData, evtsData, wlData, rtData, bltData, cdData]) => {
      setSnap(srcData);
      setPerf(perfData);
      setEvts(evtsData);
      setWinLoss(wlData);
      setRevTrends(rtData);
      setBookingLT(bltData);
      setCohortData(cdData);
      setLoading(false);
    }).catch(e => { setErr(e.message); setLoading(false); });
  }, []);

  if (loading) return (
    <div style={{ padding: "60px 32px", textAlign: "center", color: "var(--muted)" }}>
      <div style={{ fontSize: 13, fontFamily: "var(--mono)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Loading analytics…</div>
    </div>
  );

  if (err) return (
    <div style={{ padding: "48px 32px" }}>
      <div style={{ background: "var(--rose-bg)", color: "var(--rose-ink)", borderRadius: 8, padding: "16px 20px", fontSize: 13 }}>
        <b>Could not load analytics snapshot.</b><br />{err}<br />
        <div style={{ marginTop: 8, fontSize: 11, fontFamily: "var(--mono)" }}>
          Run: <code>python3 "Onboard Scripts/analytics_source_channels.py"</code> to generate it.
        </div>
      </div>
    </div>
  );

  const meta = snap._meta || {};
  const sources = snap.source_channels || [];
  const owners  = snap.owner_performance || [];
  const leads   = snap.lead_profiles || [];
  const statusDist = snap.status_distribution || {};
  const familyDist = snap.source_family_distribution || {};

  const totalLeads  = meta.lead_count || leads.length || 0;
  const totalWon    = statusDist.won || 0;
  const totalActive = statusDist.active || 0;
  const totalLost   = statusDist.lost || 0;
  const winRate     = totalLeads > 0 ? ((totalWon / totalLeads) * 100).toFixed(1) : "—";

  const genDate = meta.generated_at
    ? new Date(meta.generated_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    : "never";

  // top sources for bar chart (limit 12)
  const topSources = [...sources].sort((a, b) => b.lead_count - a.lead_count).slice(0, 12);
  const maxLeads   = topSources.length ? topSources[0].lead_count : 1;

  // owner roster — hoisted so comparison panel can access outside owners tab IIFE
  const perfOwnerProfiles = perf ? perf.owner_profiles : null;
  const displayOwners = perfOwnerProfiles
    ? [...perfOwnerProfiles].sort((a, b) => b.lead_count - a.lead_count)
    : [...(snap?.by_owner || [])].sort((a, b) => b.lead_count - a.lead_count);

  return (
    <div style={{ paddingBottom: 48, "--mono": "var(--font-body)" }}>

      {/* ── Header ── */}
      <div style={{ padding: "28px 32px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 6 }}>
              analytics · source channel intelligence · last {meta.window_days || 30} days
            </div>
            <h1 style={{ fontFamily: "var(--serif)", fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", margin: 0, color: "var(--ink)", lineHeight: 1.1 }}>
              Where leads come from.
            </h1>
            <div style={{ marginTop: 6, fontSize: 12, color: "var(--muted)", fontFamily: "var(--mono)" }}>
              {meta.opportunity_count || 0} opportunities · refreshed {genDate}
            </div>
          </div>
          <button
            style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em",
                     padding: "7px 14px", background: "var(--ink)", color: "var(--paper)", border: "none",
                     borderRadius: 5, cursor: "pointer", whiteSpace: "nowrap", marginTop: 4 }}
            title="Re-run analytics_source_channels.py to get fresh data, then reload."
            onClick={() => { alert("Run analytics_source_channels.py from terminal to refresh, then reload the page."); }}
          >
            ↻ Refresh data
          </button>
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 10, padding: "20px 32px 0" }}>
        {[
          { label: "Leads (30d)",     value: totalLeads,   bg: "var(--card)",        ink: "var(--ink)",          tab: "sources"  },
          { label: "Active",          value: totalActive,  bg: "var(--mint-bg)",     ink: "var(--mint-ink)",     tab: "owners"   },
          { label: "Won",             value: totalWon,     bg: "var(--sage-bg)",     ink: "var(--sage-ink)",     tab: "winloss"  },
          { label: "Win rate",        value: winRate + "%",bg: "var(--lemon-bg)",    ink: "var(--lemon-ink)",    tab: "winloss"  },
          { label: "Active pipeline", value: perf ? perf.global_metrics.total_active_value_fmt : "—",
                                                           bg: "var(--sky-bg)",      ink: "var(--sky-ink)",      tab: "owners"   },
          { label: "Events booked",   value: evts ? evts._meta.event_count : "—",
                                                           bg: "var(--peach-bg)",    ink: "var(--peach-ink)",    tab: "events"   },
          { label: "365d Win rate",   value: winLoss ? winLoss.funnel.win_rate_pct + "%" : "—",
                                                           bg: "var(--lavender-bg)", ink: "var(--lavender-ink)", tab: "winloss", spark: "winrate" },
          { label: "YoY revenue",     value: revTrends ? (revTrends.yoy_comparison.revenue_growth_pct > 0 ? "+" : "") + revTrends.yoy_comparison.revenue_growth_pct + "%" : "—",
                                                           bg: revTrends && revTrends.yoy_comparison.revenue_growth_pct >= 0 ? "var(--mint-bg)" : "var(--rose-bg)",
                                                           ink: revTrends && revTrends.yoy_comparison.revenue_growth_pct >= 0 ? "var(--mint-ink)" : "var(--rose-ink)",
                                                           tab: "revenue", spark: "revenue" },
        ].map(({ label, value, bg, ink, spark, tab }) => {
          // Build sparkline data from revTrends monthly if available
          const sparkVals = spark === "revenue" && revTrends
            ? revTrends.monthly_trend.slice(-8).map(m => m.won_value_cents)
            : spark === "winrate" && winLoss
            ? winLoss.by_owner?.slice(0,8).map(o => o.win_rate_pct) || []
            : null;
          const sparkEl = sparkVals && sparkVals.length > 1 ? (() => {
            const W = 52, H = 20, n = sparkVals.length;
            const maxV = Math.max(...sparkVals, 1);
            const pts = sparkVals.map((v, i) => {
              const x = (i / (n - 1)) * (W - 4) + 2;
              const y = H - 4 - ((v / maxV) * (H - 6)) + 2;
              return `${x},${y}`;
            }).join(" ");
            return (
              <svg width={W} height={H} style={{ display: "block", marginTop: 6, opacity: 0.7 }}>
                <polyline points={pts} fill="none" stroke={ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                {sparkVals.map((v, i) => {
                  const [x, y] = pts.split(" ")[i]?.split(",") || [0, 0];
                  return i === n - 1 ? <circle key={i} cx={parseFloat(x)} cy={parseFloat(y)} r="2" fill={ink} /> : null;
                })}
              </svg>
            );
          })() : null;
          return (
            <div key={label}
              onContextMenu={e => openCtx(e, label, [
                { icon: "write", label: `Copy: ${String(value)}`, action: () => copyText(String(value), label) },
                { icon: "arrow", label: `Go to ${tab} tab`, action: () => setActiveTab(tab) },
                { divider: true },
                { icon: "chart", label: "View Analytics", action: () => setActiveTab(tab), muted: true },
              ])}
              style={{ background: bg, borderRadius: 8, padding: "14px 16px", border: "1px solid var(--rule)",
                       display: "flex", flexDirection: "column", justifyContent: "space-between", cursor: "context-menu" }}>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>{label}</div>
                <div style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 500, color: ink, lineHeight: 1.1, marginTop: 4 }}>{value}</div>
              </div>
              {sparkEl}
            </div>
          );
        })}
      </div>

      {/* ── Auto-insights panel ── */}
      {(winLoss || revTrends || bookingLT || cohortData) && (() => {
        const insights = [];

        // Revenue insights
        if (revTrends) {
          const yoy = revTrends.yoy_comparison;
          const dir = yoy.revenue_growth_pct >= 0 ? "↑" : "↓";
          const tone = yoy.revenue_growth_pct >= 0 ? "var(--mint-ink)" : "var(--rose-ink)";
          const revIcon = yoy.revenue_growth_pct >= 0 ? "chart" : "warn";
          insights.push({ icon: revIcon, text: `Revenue ${dir}${Math.abs(yoy.revenue_growth_pct)}% YoY — ${yoy.prior_year_revenue_fmt} → ${yoy.current_year_revenue_fmt}. Avg deal size ${yoy.avg_deal_size_growth_pct > 0 ? "up" : "down"} ${Math.abs(yoy.avg_deal_size_growth_pct)}%.`, color: tone });
          if (yoy.lead_volume_growth_pct < -5) {
            insights.push({ icon: "warn", text: `Lead volume is down ${Math.abs(yoy.lead_volume_growth_pct)}% YoY — fewer inbound opportunities even as deal size grows.`, color: "var(--rose-ink)" });
          }
        }

        // Win/loss insights — by_event_type and by_source_family both use 'key' (not event_type/source_family)
        if (winLoss) {
          const wl = winLoss;
          const topType = (wl.by_event_type || []).filter(r => r.key && r.key !== "unknown" && r.lead_count >= 5).sort((a,b) => b.win_rate_pct - a.win_rate_pct)[0];
          const topSrc  = (wl.by_source_family || []).filter(r => r.key && r.lead_count >= 10).sort((a,b) => b.win_rate_pct - a.win_rate_pct)[0];
          if (topType?.key) insights.push({ icon: "sparkles", text: `${String(topType.key).replace(/_/g," ")} events convert at ${topType.win_rate_pct}% — highest win rate of any event type.`, color: "var(--sage-ink)" });
          if (topSrc?.key)  insights.push({ icon: "wave", text: `${String(topSrc.key).replace(/_/g," ")} leads convert at ${topSrc.win_rate_pct}% — strongest channel by win rate.`, color: "var(--sky-ink)" });
          const stageZero = (wl.stage_of_death || []).find(s => s.pct_of_lost > 60);
          if (stageZero?.stage) insights.push({ icon: "bolt", text: `${stageZero.pct_of_lost}% of lost deals die at "${stageZero.stage}" — fix top-of-funnel drop-off first.`, color: "var(--lemon-ink)" });
        }

        // Booking lead time insights
        if (bookingLT) {
          const blt = bookingLT;
          const lmPct = blt.urgency_segments?.last_minute?.pct;
          const lmFmt = blt.urgency_segments?.last_minute?.avg_value_fmt;
          const lhFmt = blt.urgency_segments?.long_horizon?.avg_value_fmt;
          if (lmPct > 30) {
            insights.push({ icon: "fire", text: `${lmPct}% of bookings are last-minute (<30d) — avg deal only ${lmFmt} vs ${lhFmt} for long-horizon.`, color: "var(--peach-ink)" });
          }
          const longTopType = (blt.by_event_type || []).filter(r => r.event_type).sort((a,b) => (b.median_days||0) - (a.median_days||0))[0];
          if (longTopType?.event_type) insights.push({ icon: "cal", text: `${String(longTopType.event_type).replace(/_/g," ")} books furthest ahead — median ${longTopType.median_days}d. ${longTopType.pct_over_180d}% book 6+ months out.`, color: "var(--lavender-ink)" });
        }

        // Cohort insights
        if (cohortData) {
          const cd = cohortData;
          const bestSrc = cd.source_cohorts?.slice().sort((a,b) => (b.windows?.["90d"]?.rate_pct ?? 0) - (a.windows?.["90d"]?.rate_pct ?? 0))[0];
          const zeroSrc = cd.source_cohorts?.find(s => (s.windows?.["90d"]?.rate_pct ?? 0) === 0 && s.total_leads > 50);
          if (bestSrc && bestSrc.windows?.["90d"]?.rate_pct > 0) insights.push({ icon: "chart", text: `${bestSrc.source.replace(/_/g," ")} has the highest 90d cohort conversion at ${bestSrc.windows["90d"].rate_pct}% across ${bestSrc.total_leads} leads.`, color: "var(--mint-ink)" });
          if (zeroSrc) insights.push({ icon: "warn", text: `${zeroSrc.source.replace(/_/g," ")} generated ${zeroSrc.total_leads} leads with 0% conversion at 90 days — investigate or cut.`, color: "var(--rose-ink)" });
          const c90 = cd.conversion_curves?.find(c => c.window === "90d");
          const c1yr = cd.conversion_curves?.find(c => c.window === "1yr");
          if (c90 && c1yr) insights.push({ icon: "clock", text: `Leads take time: only ${c90.overall_rate_pct}% convert in 90 days, but ${c1yr.overall_rate_pct}% by 1 year. Don't give up on aging pipeline.`, color: "var(--sky-ink)" });
        }

        if (insights.length === 0) return null;
        return (
          <div style={{ margin: "16px 32px 0", background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "16px 20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", display: "flex", alignItems: "center", gap: 5 }}>
                <AIcon name="sparkles" size={11} /> Intel Signals — auto-derived from loaded data
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 8 }}>
              {insights.map((ins, i) => (
                <div key={i}
                  onContextMenu={e => openCtx(e, "Insight", [
                    { icon: "write", label: "Copy insight", action: () => copyText(ins.text, "Intel signal") },
                  ])}
                  style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", borderRadius: 6,
                           border: `1px solid var(--rule)`, background: "var(--paper)", cursor: "context-menu" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", color: ins.color, flexShrink: 0, marginTop: 2 }}>
                    <AIcon name={ins.icon} size={14} />
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink)", lineHeight: 1.5 }}>{ins.text}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Tabs ── */}
      <div style={{ display: "flex", gap: 4, padding: "20px 32px 0", flexWrap: "wrap" }}>
        {[
          ["sources", "Source Channels"],
          ["owners", "Owner Performance"],
          ["pipeline", "Pipeline Funnel"],
          ["events", "Upcoming Events"],
          ["winloss", "Win / Loss"],
          ["revenue", "Revenue & Growth"],
          ["leadtime", "Lead Time"],
          ["cohort", "Cohort Analysis"],
          ["leads", "Lead Profiles"],
          ["conversations", "Conversation Intel"],
        ].map(([id, label]) => (
          <button key={id}
            onClick={() => setActiveTab(id)}
            style={{
              fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em",
              padding: "6px 14px", border: "1px solid",
              borderColor: activeTab === id ? "var(--ink)" : "var(--rule)",
              background: activeTab === id ? "var(--ink)" : "var(--paper)",
              color: activeTab === id ? "var(--paper)" : "var(--muted)",
              borderRadius: 5, cursor: "pointer",
            }}
          >{label}</button>
        ))}
      </div>

      {/* ── Sources tab ── */}
      {activeTab === "sources" && (
        <div style={{ padding: "20px 32px 0", display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>

          {/* Bar chart / Table with view toggle */}
          <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)" }}>
                Leads by source · top {topSources.length}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <ViewToggle tab="sources" options={[["chart","Chart","▬"],["table","Table","≡"]]} />
                <button onClick={() => exportCSV(topSources, "source_channels.csv", ["source","source_family","lead_count","won_count","lost_count","active_count","win_rate_pct","total_value_fmt"])}
                  style={{ fontFamily: "var(--mono)", fontSize: 9, padding: "4px 10px", border: "1px solid var(--rule)", borderRadius: 4, cursor: "pointer", background: "var(--paper)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  ↓ CSV
                </button>
              </div>
            </div>

            {viewModes.sources === "chart" ? (
              <div style={{ display: "grid", gap: 8 }}>
                {topSources.map((s) => {
                  const fam = s.source_family || "unknown";
                  const col = FAMILY_COLORS[fam] || FAMILY_COLORS.unknown;
                  const pct = Math.round((s.lead_count / maxLeads) * 100);
                  const isSpot = spotlight?.type === "source" && spotlight?.value === s.source_channel;
                  return (
                    <div key={s.source_channel}
                      onContextMenu={(e) => openCtx(e, s.source_channel, [
                        { icon: "eye", label: isSpot ? "Clear spotlight" : "Spotlight this source", action: () => spotlightToggle("source", s.source_channel, s.source_channel) },
                        { icon: "write", label: "Copy stats", action: () => copyText(`${s.source_channel}: ${s.lead_count} leads, ${s.won_count} won (${s.win_rate_pct}% win rate), ${s.active_count} active`, s.source_channel) },
                        { divider: true },
                        { icon: "link", label: "Search in Close CRM", action: () => openInClose(s.source_channel) },
                        { icon: "chart", label: "Switch to table view", action: () => setViewMode("sources", "table") },
                      ])}
                      style={{ cursor: "context-menu", borderRadius: 6, padding: "4px 6px", transition: "all 0.2s", ...spotDim("source", s.source_channel) }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: isSpot ? 700 : 500, color: "var(--ink)", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {isSpot && <AIcon name="eye" size={11} style={{ color: "var(--lemon-ink)", marginRight: 4 }} />}
                          {s.source_channel}
                        </span>
                        <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0 }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>
                            {s.won_count}W · {s.active_count}A · {s.lost_count}L
                          </span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink)", fontWeight: 600 }}>
                            {s.lead_count}
                          </span>
                        </div>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: "var(--rule)", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: pct + "%", background: col.dot, borderRadius: 4, transition: "width 0.4s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Table view */
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: "var(--card-2)" }}>
                      {["Source", "Family", "Leads", "Won", "Active", "Lost", "Win %", "Avg Value"].map(h => (
                        <th key={h} style={{ padding: "8px 10px", textAlign: h === "Source" || h === "Family" ? "left" : "right",
                          fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em",
                          color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--rule)", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...sources].sort((a,b) => b.lead_count - a.lead_count).map((s, i) => {
                      const col = FAMILY_COLORS[s.source_family] || FAMILY_COLORS.unknown;
                      const isSpot = spotlight?.type === "source" && spotlight?.value === s.source_channel;
                      return (
                        <tr key={s.source_channel}
                          onContextMenu={(e) => openCtx(e, s.source_channel, [
                            { icon: "eye", label: isSpot ? "Clear spotlight" : "Spotlight", action: () => spotlightToggle("source", s.source_channel, s.source_channel) },
                            { icon: "write", label: "Copy row", action: () => copyText(`${s.source_channel}\t${s.lead_count}\t${s.won_count}\t${s.win_rate_pct}%`, s.source_channel) },
                            { icon: "link", label: "Search in Close", action: () => openInClose(s.source_channel) },
                          ])}
                          style={{ borderBottom: "1px solid var(--rule)", cursor: "context-menu",
                            background: isSpot ? "var(--lemon-bg)" : i % 2 ? "var(--card-2)" : "var(--card)",
                            ...spotDim("source", s.source_channel) }}>
                          <td style={{ padding: "8px 10px", fontWeight: 500, color: "var(--ink)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.source_channel}</td>
                          <td style={{ padding: "8px 10px" }}>
                            <span style={{ background: col.bg, color: col.ink, padding: "2px 7px", borderRadius: 4, fontSize: 10, fontFamily: "var(--mono)", whiteSpace: "nowrap" }}>{col.label || s.source_family}</span>
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "var(--mono)" }}>{s.lead_count}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "var(--mono)", color: "var(--sage-ink)" }}>{s.won_count}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "var(--mono)", color: "var(--mint-ink)" }}>{s.active_count}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "var(--mono)", color: "var(--rose-ink)" }}>{s.lost_count}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600,
                              color: s.win_rate_pct >= 20 ? "var(--sage-ink)" : s.win_rate_pct >= 10 ? "var(--lemon-ink)" : "var(--rose-ink)" }}>
                              {s.win_rate_pct}%
                            </span>
                          </td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontFamily: "var(--mono)", color: "var(--muted)" }}>
                            {s.avg_won_value_fmt || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Family donut + legend */}
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "20px 20px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 14 }}>
                Source family
              </div>
              <AnalyticsDonut data={familyDist} colorMap={FAMILY_COLORS} total={totalLeads} />
              <div style={{ marginTop: 14, display: "grid", gap: 6 }}>
                {Object.entries(familyDist).sort((a,b) => b[1]-a[1]).map(([fam, count]) => {
                  const col = FAMILY_COLORS[fam] || FAMILY_COLORS.unknown;
                  const pct = totalLeads > 0 ? ((count / totalLeads) * 100).toFixed(0) : 0;
                  return (
                    <div key={fam} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.dot, flexShrink: 0, display: "inline-block" }} />
                        <span style={{ color: "var(--ink)" }}>{col.label || fam}</span>
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>
                        {count} · {pct}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Source table (compact) */}
            <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "16px 20px", maxHeight: 260, overflowY: "auto" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 10 }}>
                All {sources.length} sources
              </div>
              <div style={{ display: "grid", gap: 4 }}>
                {[...sources].sort((a,b) => b.lead_count - a.lead_count).map((s) => {
                  const col = FAMILY_COLORS[s.source_family] || FAMILY_COLORS.unknown;
                  return (
                    <div key={s.source_channel}
                      onContextMenu={e => openCtx(e, s.source_channel, [
                        { icon: "write", label: "Copy stats", action: () => copyText(`${s.source_channel}: ${s.lead_count} leads · ${s.win_rate_pct}% win rate`, s.source_channel) },
                        { icon: "link", label: "Search in Close", action: () => openInClose(s.source_channel) },
                        { icon: "eye", label: "Spotlight this source", action: () => spotlightToggle("source", s.source_channel, s.source_channel) },
                      ])}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center",
                               padding: "5px 8px", borderRadius: 5, background: "var(--card-2)", cursor: "context-menu" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: col.dot, flexShrink: 0, display: "inline-block" }} />
                        <span style={{ fontSize: 11, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.source_channel}</span>
                      </div>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", flexShrink: 0, marginLeft: 8 }}>
                        {s.lead_count} · {s.win_rate_pct}%W
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Owners tab ── */}
      {activeTab === "owners" && (() => {
        // Prefer perf owner profiles (richer); fall back to source channel owners
        const perfOwners = perf ? perf.owner_profiles : null;
        // Build merged rows — perf data keyed by owner_name
        const perfByName = {};
        if (perfOwners) perfOwners.forEach(p => { perfByName[p.owner_name] = p; });

        // Use perf owners if available, else fall back to source channel owners
        const displayOwners = perfOwners
          ? [...perfOwners].sort((a,b) => b.lead_count - a.lead_count)
          : [...owners].sort((a,b) => b.lead_count - a.lead_count);

        return (
        <div style={{ padding: "20px 32px 0" }}>
          {/* enriched table */}
          <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--rule)", fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                Owner performance · last {(perf ? perf._meta.window_days : meta.window_days) || 30} days
                {perf && <span style={{ marginLeft: 12, color: "var(--sky-ink)" }}>· pipeline {perf.global_metrics.total_active_value_fmt} · won {perf.global_metrics.total_won_value_fmt} · median close {perf.global_metrics.global_median_days_to_close}d</span>}
              </div>
              <button onClick={() => exportCSV(displayOwners, "owner_performance.csv", ["owner_name","lead_count","won_count","lost_count","pipeline_value_fmt","avg_won_value_fmt","median_days_to_close"])}
                style={{ fontFamily: "var(--mono)", fontSize: 9, padding: "4px 10px", border: "1px solid var(--rule)", borderRadius: 4, cursor: "pointer", background: "var(--paper)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                ↓ CSV
              </button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--card-2)" }}>
                  {(perfOwners
                    ? ["Owner", "Leads", "Active", "Won", "Win %", "Pipeline $", "Avg Deal", "Median Close", "Top Stages"]
                    : ["Owner", "Leads", "Active", "Won", "Lost", "Win %", "Top Sources"]
                  ).map(h => (
                    <th key={h} style={{ padding: "9px 14px",
                      textAlign: (h === "Owner" || h === "Top Sources" || h === "Top Stages") ? "left" : "right",
                      fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em",
                      color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--rule)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayOwners.map((o, i) => {
                  const winBg = o.win_rate_pct >= 20 ? "var(--mint-bg)" : o.win_rate_pct >= 10 ? "var(--lemon-bg)" : "var(--card-2)";
                  const winInk = o.win_rate_pct >= 20 ? "var(--mint-ink)" : o.win_rate_pct >= 10 ? "var(--lemon-ink)" : "var(--muted)";
                  const isSpot = spotlight?.type === "owner" && spotlight?.value === o.owner_name;
                  return (
                    <tr key={o.owner_name}
                      onContextMenu={(e) => openCtx(e, o.owner_name, [
                        { icon: "eye", label: isSpot ? "Clear spotlight" : "Spotlight this owner", action: () => spotlightToggle("owner", o.owner_name, o.owner_name) },
                        { icon: "write", label: "Copy stats", action: () => copyText(
                          `${o.owner_name}: ${o.lead_count} leads, ${o.won_count} won (${o.win_rate_pct}%), pipeline ${o.pipeline_value_fmt || "—"}, avg ${o.avg_won_value_fmt || "—"}, median close ${o.median_days_to_close != null ? o.median_days_to_close + "d" : "—"}`,
                          o.owner_name) },
                        { divider: true },
                        { icon: "link", label: "Find in Close CRM", action: () => openInClose(o.owner_name) },
                        { icon: "chart", label: "View Win/Loss for this owner", action: () => setActiveTab("winloss") },
                        { divider: true },
                        { icon: "diff", label: "Compare with another owner…", action: () => {
                          const others = displayOwners.filter(x => x.owner_name !== o.owner_name);
                          if (others.length === 0) { showToast("No other owners to compare"); return; }
                          // pick the next one by lead count as auto-pair, user can swap via panel
                          setCompareOwners([o, others[0]]);
                        }},
                      ])}
                      style={{ borderBottom: "1px solid var(--rule)", cursor: "context-menu",
                        background: isSpot ? "var(--lemon-bg)" : i % 2 ? "var(--card-2)" : "var(--card)",
                        transition: "background 0.2s" }}>
                      <td style={{ padding: "10px 14px", fontWeight: 500, color: "var(--ink)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.owner_name}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--mono)", fontSize: 11 }}>{o.lead_count}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--mono)", fontSize: 11, color: "var(--mint-ink)" }}>{o.active_count}</td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--mono)", fontSize: 11, color: "var(--sage-ink)" }}>{o.won_count}</td>
                      {!perfOwners && <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--mono)", fontSize: 11, color: "var(--rose-ink)" }}>{o.lost_count}</td>}
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, background: winBg, color: winInk, padding: "2px 7px", borderRadius: 4 }}>
                          {o.win_rate_pct}%
                        </span>
                      </td>
                      {perfOwners ? <>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--mono)", fontSize: 11, color: "var(--sky-ink)", fontWeight: 600 }}>
                          {o.pipeline_value_fmt}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
                          {o.avg_won_value_cents > 0 ? o.avg_won_value_fmt : "—"}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontFamily: "var(--mono)", fontSize: 11, color: "var(--muted)" }}>
                          {o.median_days_to_close != null ? `${o.median_days_to_close}d` : "—"}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {(o.top_active_stages || []).slice(0,2).map(s => s.stage.replace(/^[\p{Emoji}\s]+/u, "").trim()).join(" · ")}
                        </td>
                      </> : (
                        <td style={{ padding: "10px 14px", fontSize: 11, color: "var(--muted)", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {(o.top_sources || "").split("|").slice(0,2).join(" · ")}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Owner cards with pipeline bars */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12, marginTop: 16 }}>
            {displayOwners.slice(0, 6).map(o => {
              const maxPipeline = displayOwners.reduce((m, r) => Math.max(m, r.pipeline_value_cents || r.lead_count), 1);
              const hasPipeline = perfOwners && o.pipeline_value_cents != null;
              return (
                <div key={o.owner_name} style={{ background: "var(--card)", borderRadius: 8, border: "1px solid var(--rule)", padding: "14px 16px" }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.owner_name}</div>
                  <div style={{ display: "grid", gap: 4 }}>
                    {(hasPipeline ? [
                      { label: "Pipeline", val: o.pipeline_value_cents, fmt: o.pipeline_value_fmt,  color: "var(--sky-dot)",  max: maxPipeline },
                      { label: "Won $",    val: o.total_won_value_cents, fmt: o.total_won_value_fmt, color: "var(--sage-dot)", max: maxPipeline },
                    ] : [
                      { label: "Active", val: o.active_count, fmt: String(o.active_count), color: "var(--mint-dot)", max: o.lead_count },
                      { label: "Won",    val: o.won_count,    fmt: String(o.won_count),    color: "var(--sage-dot)", max: o.lead_count },
                      { label: "Lost",   val: o.lost_count,   fmt: String(o.lost_count),   color: "var(--rose-dot)", max: o.lead_count },
                    ]).map(({ label, val, fmt, color, max }) => (
                      <div key={label}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, fontFamily: "var(--mono)", color: "var(--muted)", marginBottom: 2 }}>
                          <span>{label}</span><span>{fmt}</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: "var(--rule)" }}>
                          <div style={{ height: "100%", width: (max > 0 ? Math.min((val/max)*100, 100) : 0) + "%", background: color, borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted-2)" }}>
                    {o.lead_count} leads · {o.win_rate_pct}% win
                    {hasPipeline && o.median_days_to_close != null && ` · ${o.median_days_to_close}d close`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        );
      })()}
      )}

      {/* ── Pipeline Funnel tab ── */}
      {activeTab === "pipeline" && (
        <div style={{ padding: "20px 32px 0" }}>
          {!perf ? (
            <div style={{ background: "var(--lemon-bg)", color: "var(--lemon-ink)", borderRadius: 8, padding: "16px 20px", fontSize: 13 }}>
              Pipeline data not loaded. Run: <code>python3 "Onboard Scripts/analytics_seller_performance.py"</code> to generate it.
            </div>
          ) : (() => {
            const funnel = perf.pipeline || {};
            const globalM = perf.global_metrics || {};
            const stages = (funnel.stages || []).filter(s => s.status_type !== "lost");
            const activeStages = stages.filter(s => s.status_type === "active").sort((a,b) => b.count - a.count);
            const wonStages   = stages.filter(s => s.status_type === "won").sort((a,b) => b.count - a.count);
            const maxCount = stages.reduce((m, s) => Math.max(m, s.count), 1);
            const maxVal   = stages.reduce((m, s) => Math.max(m, s.total_value_cents), 1);
            return (
              <div>
                {/* Global pipeline stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "Active pipeline",    value: globalM.total_active_value_fmt, bg: "var(--sky-bg)",    ink: "var(--sky-ink)" },
                    { label: "Won this period",     value: globalM.total_won_value_fmt,    bg: "var(--sage-bg)",   ink: "var(--sage-ink)" },
                    { label: "New opps (30d)",      value: globalM.new_opps_this_period,   bg: "var(--mint-bg)",   ink: "var(--mint-ink)" },
                    { label: "Median days to close",value: globalM.global_median_days_to_close != null ? `${globalM.global_median_days_to_close}d` : "—",
                                                                                           bg: "var(--lemon-bg)", ink: "var(--lemon-ink)" },
                  ].map(({ label, value, bg, ink }) => (
                    <div key={label} style={{ background: bg, borderRadius: 8, padding: "16px 20px", border: "1px solid var(--rule)" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>{label}</div>
                      <div style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 500, color: ink, lineHeight: 1.1, marginTop: 4 }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Active stages */}
                  <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", overflow: "hidden" }}>
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--rule)", fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sky-ink)" }}>
                      Active stages · {funnel.total_active_count} leads · {globalM.total_active_value_fmt}
                    </div>
                    <div style={{ padding: "10px 18px 14px" }}>
                      {activeStages.map(s => {
                        const barW = Math.round((s.count / maxCount) * 100);
                        const valW = Math.round((s.total_value_cents / maxVal) * 100);
                        const label = s.status_label.replace(/^[\p{Emoji}\p{So}\s]+/u, "").trim();
                        return (
                          <div key={s.status_label} style={{ marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                              <span style={{ fontSize: 11, color: "var(--ink)", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
                              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--sky-ink)", fontWeight: 600 }}>{s.count} · {s.total_value_fmt}</span>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, background: "var(--rule)", position: "relative" }}>
                              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: barW + "%", background: "var(--sky-dot)", borderRadius: 3, opacity: 0.5 }} />
                              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: Math.min(valW, 100) + "%", background: "var(--sky-dot)", borderRadius: 3 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Won stages */}
                  <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", overflow: "hidden" }}>
                    <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--rule)", fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sage-ink)" }}>
                      Won stages · {funnel.total_won_count} leads · {globalM.total_won_value_fmt}
                    </div>
                    <div style={{ padding: "10px 18px 14px" }}>
                      {wonStages.length === 0 && <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>No won stages in this period.</div>}
                      {wonStages.map(s => {
                        const barW = Math.round((s.count / maxCount) * 100);
                        const label = s.status_label.replace(/^[\p{Emoji}\p{So}\s]+/u, "").trim();
                        return (
                          <div key={s.status_label} style={{ marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                              <span style={{ fontSize: 11, color: "var(--ink)", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
                              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--sage-ink)", fontWeight: 600 }}>{s.count} · {s.total_value_fmt}</span>
                            </div>
                            <div style={{ height: 6, borderRadius: 3, background: "var(--rule)" }}>
                              <div style={{ height: "100%", width: barW + "%", background: "var(--sage-dot)", borderRadius: 3 }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Events tab ── */}
      {activeTab === "events" && (
        <div style={{ padding: "20px 32px 0" }}>
          {!evts ? (
            <div style={{ background: "var(--lemon-bg)", color: "var(--lemon-ink)", borderRadius: 8, padding: "16px 20px", fontSize: 13 }}>
              Events data not loaded. Run: <code>python3 "Onboard Scripts/analytics_upcoming_events.py"</code> to generate it.
            </div>
          ) : (() => {
            const evtMeta   = evts._meta || {};
            const eventList = evts.upcoming_events || [];
            const monthly   = evts.monthly_schedule || [];
            const typeDist  = evts.event_type_distribution || {};
            const typeColors = evts.event_type_colors || {};
            const ownerDist  = evts.owner_event_distribution || {};
            const nextEvt    = eventList[0];

            // Group events by month for the timeline view
            const byMonth = {};
            eventList.forEach(e => {
              if (!byMonth[e.event_month_key]) byMonth[e.event_month_key] = [];
              byMonth[e.event_month_key].push(e);
            });

            const maxMonthCount = monthly.reduce((m,r) => Math.max(m, r.event_count), 1);
            const maxMonthVal   = monthly.reduce((m,r) => Math.max(m, r.total_value_cents), 1);

            return (
              <div>
                {/* top stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "Events scheduled",  value: evtMeta.event_count,         bg: "var(--peach-bg)",  ink: "var(--peach-ink)" },
                    { label: "Total guests",       value: (evtMeta.total_guests || 0).toLocaleString(), bg: "var(--mint-bg)", ink: "var(--mint-ink)" },
                    { label: "Booked revenue",     value: evtMeta.total_value_fmt,     bg: "var(--sage-bg)",   ink: "var(--sage-ink)" },
                    { label: "Next event (days)",  value: nextEvt ? nextEvt.days_until : "—", bg: "var(--sky-bg)", ink: "var(--sky-ink)" },
                  ].map(({ label, value, bg, ink }) => (
                    <div key={label} style={{ background: bg, borderRadius: 8, padding: "16px 20px", border: "1px solid var(--rule)" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>{label}</div>
                      <div style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 500, color: ink, lineHeight: 1.1, marginTop: 4 }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* monthly volume chart + type breakdown */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 16, marginBottom: 20 }}>
                  {/* monthly bars */}
                  <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 22px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 14 }}>
                      Events by month · {evtMeta.lookahead_days || 180} day window
                    </div>
                    {monthly.map(m => {
                      const barW = Math.round((m.event_count / maxMonthCount) * 100);
                      const valW = Math.round((m.total_value_cents / maxMonthVal) * 100);
                      return (
                        <div key={m.month_key} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--ink)", minWidth: 100 }}>{m.month_fmt}</span>
                            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--peach-ink)", fontWeight: 600 }}>{m.event_count} events</span>
                              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--sage-ink)", fontWeight: 600 }}>{m.total_value_fmt}</span>
                              <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>{(m.total_guests || 0).toLocaleString()} guests</span>
                            </div>
                          </div>
                          <div style={{ height: 10, borderRadius: 5, background: "var(--rule)", position: "relative" }}>
                            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: barW + "%",
                                          background: "var(--peach-dot)", borderRadius: 5, opacity: 0.45 }} />
                            <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: Math.min(valW, 100) + "%",
                                          background: "var(--sage-dot)", borderRadius: 5, opacity: 0.7 }} />
                          </div>
                        </div>
                      );
                    })}
                    <div style={{ marginTop: 10, display: "flex", gap: 16, fontSize: 10, fontFamily: "var(--mono)", color: "var(--muted)" }}>
                      <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--peach-dot)", opacity: 0.45, marginRight: 4 }} />Event volume</span>
                      <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 2, background: "var(--sage-dot)", opacity: 0.7, marginRight: 4 }} />Revenue</span>
                    </div>
                  </div>

                  {/* event type breakdown */}
                  <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 22px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 14 }}>
                      By event type
                    </div>
                    {Object.entries(typeDist).sort((a,b) => b[1]-a[1]).map(([type, count]) => {
                      const col = typeColors[type] || typeColors["other"] || { bg: "#eee", ink: "#333", dot: "#666", label: type };
                      const maxT = Math.max(...Object.values(typeDist));
                      const pct = Math.round((count / maxT) * 100);
                      return (
                        <div key={type} style={{ marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.dot, display: "inline-block", flexShrink: 0 }} />
                              <span style={{ fontSize: 11, color: "var(--ink)" }}>{col.label}</span>
                            </div>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", fontWeight: 600 }}>{count}</span>
                          </div>
                          <div style={{ height: 4, borderRadius: 2, background: "var(--rule)" }}>
                            <div style={{ height: "100%", width: pct + "%", background: col.dot, borderRadius: 2, opacity: 0.7 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* events timeline — grouped by month */}
                {Object.keys(byMonth).sort().map(monthKey => {
                  const monthEvts = byMonth[monthKey];
                  const monthLabel = monthEvts[0].event_month_fmt;
                  return (
                    <div key={monthKey} style={{ marginBottom: 24 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                                      letterSpacing: "0.1em", color: "var(--peach-ink)" }}>{monthLabel}</div>
                        <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
                        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>
                          {monthEvts.length} events · {monthEvts.reduce((s,e) => s + (e.guest_count||0), 0).toLocaleString()} guests
                        </div>
                      </div>
                      <div style={{ display: "grid", gap: 6 }}>
                        {monthEvts.map(e => {
                          const col = typeColors[e.event_type] || typeColors["other"] || { bg: "#f3f4f6", ink: "#374151", dot: "#9ca3af", label: e.event_type };
                          const isPast  = e.days_until <= 0;
                          const isUrgent = e.days_until >= 0 && e.days_until <= 14;
                          return (
                            <div key={e.lead_id + e.event_datetime} style={{
                              display: "grid",
                              gridTemplateColumns: "80px 1fr auto",
                              gap: 12, alignItems: "center",
                              background: isPast ? "var(--card-2)" : "var(--card)",
                              borderRadius: 8, border: "1px solid var(--rule)",
                              padding: "10px 16px",
                              opacity: isPast ? 0.55 : 1,
                            }}>
                              {/* date */}
                              <div style={{ textAlign: "center" }}>
                                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", textTransform: "uppercase" }}>
                                  {new Date(e.event_datetime).toLocaleDateString(undefined, { month: "short" })}
                                </div>
                                <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 600, color: isUrgent ? "var(--rose-ink)" : "var(--ink)", lineHeight: 1 }}>
                                  {new Date(e.event_datetime).getDate()}
                                </div>
                                {isUrgent && !isPast && (
                                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--rose-ink)", marginTop: 2 }}>{e.days_until}d</div>
                                )}
                              </div>
                              {/* main info */}
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                                  <span style={{ fontWeight: 500, fontSize: 13, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 220 }}>{e.lead_name}</span>
                                  <span style={{ fontFamily: "var(--mono)", fontSize: 9, padding: "2px 7px", borderRadius: 10,
                                                 background: col.bg, color: col.ink, whiteSpace: "nowrap", flexShrink: 0 }}>
                                    {col.label}
                                  </span>
                                </div>
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                                  {e.guest_count > 0 && (
                                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>
                                      👥 {e.guest_count}
                                    </span>
                                  )}
                                  {e.venue_type && (
                                    <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 160 }}>
                                      📍 {e.venue_type}
                                    </span>
                                  )}
                                  <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>
                                    {e.owner_name.split(" ")[0]}
                                  </span>
                                </div>
                              </div>
                              {/* value + status */}
                              <div style={{ textAlign: "right", flexShrink: 0 }}>
                                {e.total_value_cents > 0 && (
                                  <div style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--sage-ink)" }}>{e.total_value_fmt}</div>
                                )}
                                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)", marginTop: 2,
                                              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>
                                  {e.status_label.replace(/^[\p{Emoji}\p{So}\s]+/u, "").trim()}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* ── Win / Loss tab ── */}
      {activeTab === "winloss" && (() => {
        if (!winLoss) return (
          <div style={{ padding: "40px 32px", color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12 }}>
            No win/loss data. Run: <code>python3 "Onboard Scripts/analytics_win_loss.py" --days 365</code>
          </div>
        );
        const wl = winLoss;
        const funnel = wl.funnel;
        const stripEmoji = (s) => String(s || "").replace(/^[\p{Emoji}\p{So}\s]+/gu, "").replace(/[\p{Emoji}\p{So}]+/gu, "").trim();

        // Color helpers
        const WIN_COLOR  = "var(--sage-ink)";
        const LOST_COLOR = "var(--rose-ink)";
        const ACT_COLOR  = "var(--sky-ink)";

        // Render a horizontal win-rate bar for a row
        const WinBar = ({ won, lost, active, rate }) => {
          const total = won + lost + active || 1;
          const wonW  = (won  / total * 100).toFixed(1);
          const lostW = (lost / total * 100).toFixed(1);
          const actW  = (active / total * 100).toFixed(1);
          return (
            <div style={{ display: "flex", height: 6, borderRadius: 4, overflow: "hidden", width: "100%", background: "var(--rule)" }}>
              <div style={{ width: wonW  + "%", background: "var(--sage-ink)",  transition: "width 0.4s" }} />
              <div style={{ width: actW  + "%", background: "var(--sky-ink)",   transition: "width 0.4s" }} />
              <div style={{ width: lostW + "%", background: "var(--rose-ink)",  transition: "width 0.4s" }} />
            </div>
          );
        };

        // Sort event types by lead count, exclude unknown for main display
        const byEtype  = [...(wl.by_event_type || [])].sort((a,b) => b.lead_count - a.lead_count).filter(r => r.key !== "unknown");
        const byGuest  = [...(wl.by_guest_bucket || [])].filter(r => r.key !== "unknown");
        const byOwner  = [...(wl.by_owner || [])].sort((a,b) => b.win_rate_pct - a.win_rate_pct).slice(0, 8);
        const bySrc    = [...(wl.by_source_family || [])].sort((a,b) => b.win_rate_pct - a.win_rate_pct);
        const sod      = (wl.stage_of_death || []).slice(0, 8);
        const timePats = wl.time_patterns || {};
        const closeBuckets = timePats.close_time_buckets || [];
        const maxBucket = closeBuckets.length ? Math.max(...closeBuckets.map(b => b.count)) : 1;
        const eventByMonth = timePats.event_by_month || [];
        const maxEvtMonth  = eventByMonth.length ? Math.max(...eventByMonth.map(m => m.event_count)) : 1;

        return (
          <div style={{ padding: "20px 32px 0" }}>

            {/* ── Funnel overview tiles ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Total leads",    value: funnel.total.toLocaleString(),     bg: "var(--card)",        ink: "var(--ink)" },
                { label: "Won",            value: funnel.won.toLocaleString(),        bg: "var(--sage-bg)",     ink: "var(--sage-ink)" },
                { label: "Lost",           value: funnel.lost.toLocaleString(),       bg: "var(--rose-bg)",     ink: "var(--rose-ink)" },
                { label: "Won value",      value: funnel.total_won_value_fmt,         bg: "var(--lemon-bg)",    ink: "var(--lemon-ink)" },
                { label: "Lost pipeline",  value: funnel.total_lost_value_fmt,        bg: "var(--peach-bg)",    ink: "var(--peach-ink)" },
              ].map(({ label, value, bg, ink }) => (
                <div key={label} style={{ background: bg, borderRadius: 8, padding: "14px 16px", border: "1px solid var(--rule)" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>{label}</div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 500, color: ink, lineHeight: 1.1, marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

              {/* ── Event Type Win Rates ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)" }}>
                    Win rate by event type
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <ViewToggle tab="winloss" options={[["rates","% Rate","↗"],["counts","Counts","#"]]} />
                    <button onClick={() => exportCSV(byEtype, "win_loss_event_type.csv", ["key","won_count","lost_count","total","win_rate_pct"])}
                      style={{ fontFamily: "var(--mono)", fontSize: 9, padding: "4px 10px", border: "1px solid var(--rule)", borderRadius: 4, cursor: "pointer", background: "var(--paper)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      ↓ CSV
                    </button>
                  </div>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {byEtype.map(row => {
                    const isSpot = spotlight?.type === "etype" && spotlight?.value === row.key;
                    return (
                    <div key={row.key}
                      onContextMenu={(e) => openCtx(e, row.key.replace(/_/g, " "), [
                        { icon: "eye", label: isSpot ? "Clear spotlight" : "Spotlight this type", action: () => spotlightToggle("etype", row.key, row.key.replace(/_/g, " ")) },
                        { icon: "write", label: "Copy stats", action: () => copyText(
                          `${row.key}: ${row.lead_count} leads, ${row.won_count} won (${row.win_rate_pct}%), avg ${row.avg_won_value_fmt}`,
                          row.key) },
                        { divider: true },
                        { icon: "link", label: "Search in Close CRM", action: () => openInClose(row.key.replace(/_/g, " ")) },
                        { icon: "💰", label: "View revenue for this type", action: () => setActiveTab("revenue") },
                      ])}
                      style={{ cursor: "context-menu", borderRadius: 5, padding: "3px 5px", transition: "all 0.2s", ...spotDim("etype", row.key) }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: isSpot ? 700 : 500, color: "var(--ink)", textTransform: "capitalize" }}>
                          {isSpot && <AIcon name="eye" size={11} style={{ color: "var(--lemon-ink)", marginRight: 3 }} />}{row.key.replace(/_/g, " ")}
                        </span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>{row.lead_count} leads</span>
                          {viewModes.winloss === "rates" ? (
                            <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600,
                              color: row.win_rate_pct >= 20 ? "var(--sage-ink)" : row.win_rate_pct >= 10 ? "var(--lemon-ink)" : "var(--rose-ink)" }}>
                              {row.win_rate_pct}%
                            </span>
                          ) : (
                            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>
                              <span style={{ color: "var(--sage-ink)" }}>{row.won_count}W</span> · <span style={{ color: "var(--rose-ink)" }}>{row.lost_count}L</span>
                            </span>
                          )}
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>{row.avg_won_value_fmt} avg</span>
                        </div>
                      </div>
                      <WinBar won={row.won_count} lost={row.lost_count} active={row.active_count} rate={row.win_rate_pct} />
                    </div>
                  );})}
                </div>
              </div>

              {/* ── Guest Bucket Win Rates ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 14 }}>
                  Win rate by guest count
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {byGuest.map(row => {
                    const isSpot = spotlight?.type === "guests" && spotlight?.value === row.key;
                    return (
                    <div key={row.key}
                      onContextMenu={(e) => openCtx(e, row.key + " guests", [
                        { icon: "eye", label: isSpot ? "Clear spotlight" : "Spotlight this bucket", action: () => spotlightToggle("guests", row.key, row.key + " guests") },
                        { icon: "write", label: "Copy stats", action: () => copyText(
                          `${row.key} guests: ${row.lead_count} leads, ${row.won_count} won (${row.win_rate_pct}%), avg ${row.avg_won_value_fmt}`,
                          row.key + " guests") },
                      ])}
                      style={{ cursor: "context-menu", borderRadius: 5, padding: "3px 5px", transition: "all 0.2s", ...spotDim("guests", row.key) }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: isSpot ? 700 : 500, color: "var(--ink)" }}>
                          {isSpot && <AIcon name="eye" size={11} style={{ color: "var(--lemon-ink)", marginRight: 3 }} />}{row.key} guests
                        </span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>{row.lead_count} leads</span>
                          {viewModes.winloss === "rates" ? (
                            <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600,
                              color: row.win_rate_pct >= 17 ? "var(--sage-ink)" : row.win_rate_pct >= 12 ? "var(--lemon-ink)" : "var(--rose-ink)" }}>
                              {row.win_rate_pct}%
                            </span>
                          ) : (
                            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>
                              <span style={{ color: "var(--sage-ink)" }}>{row.won_count}W</span> · <span style={{ color: "var(--rose-ink)" }}>{row.lost_count}L</span>
                            </span>
                          )}
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>{row.avg_won_value_fmt} avg</span>
                        </div>
                      </div>
                      <WinBar won={row.won_count} lost={row.lost_count} active={row.active_count} rate={row.win_rate_pct} />
                    </div>
                  );})}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

              {/* ── Stage of Death ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 14 }}>
                  Where lost deals die
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {sod.map(row => {
                    const label = stripEmoji(row.stage);
                    const maxSod = sod.length ? sod[0].count : 1;
                    const barPct = Math.round(row.count / maxSod * 100);
                    const isSpot = spotlight?.type === "stage" && spotlight?.value === row.stage;
                    return (
                      <div key={row.stage}
                        onContextMenu={(e) => openCtx(e, label || "Stage", [
                          { icon: "eye", label: isSpot ? "Clear spotlight" : "Spotlight this stage", action: () => spotlightToggle("stage", row.stage, label) },
                          { icon: "write", label: "Copy stats", action: () => copyText(`${label}: ${row.count.toLocaleString()} lost deals (${row.pct_of_lost}% of all lost)`, label) },
                          { divider: true },
                          { icon: "link", label: "Search this stage in Close", action: () => openInClose(label) },
                        ])}
                        style={{ cursor: "context-menu", borderRadius: 5, padding: "3px 5px", transition: "all 0.2s", ...spotDim("stage", row.stage) }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: isSpot ? "var(--rose-ink)" : "var(--ink)", fontWeight: isSpot ? 700 : 400,
                            maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={label}>
                            {isSpot && <AIcon name="eye" size={11} style={{ color: "var(--lemon-ink)", marginRight: 3 }} />}{label}
                          </span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", flexShrink: 0, marginLeft: 8 }}>
                            {row.count.toLocaleString()} · {row.pct_of_lost}%
                          </span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: "var(--rule)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: barPct + "%", background: isSpot ? "var(--rose-ink)" : "var(--muted)", borderRadius: 3, transition: "width 0.4s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Time to Close histogram ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 4 }}>
                  Days to close · won deals
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", marginBottom: 14 }}>
                  median {timePats.median_days_to_close}d · mean {timePats.mean_days_to_close}d
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 100 }}>
                  {closeBuckets.map(b => {
                    const h = Math.round(b.count / maxBucket * 80);
                    return (
                      <div key={b.bucket} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--muted)", textAlign: "center" }}>{b.count}</div>
                        <div style={{ width: "100%", height: h + "px", background: "var(--sky-ink)", borderRadius: "3px 3px 0 0", minHeight: 3, transition: "height 0.4s" }} />
                        <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--muted-2)", textAlign: "center", whiteSpace: "nowrap" }}>{b.bucket}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Won events by month of year */}
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginTop: 20, marginBottom: 10 }}>
                  Won events by month
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 56 }}>
                  {eventByMonth.map(m => {
                    const h = Math.round(m.event_count / maxEvtMonth * 46);
                    const isPeak = m.event_count === Math.max(...eventByMonth.map(x => x.event_count));
                    return (
                      <div key={m.month} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 2 }}>
                        <div style={{ width: "100%", height: h + "px", background: isPeak ? "var(--lemon-ink)" : "var(--mint-ink)", borderRadius: "2px 2px 0 0", minHeight: 2, transition: "height 0.4s" }} />
                        <div style={{ fontFamily: "var(--mono)", fontSize: 7, color: "var(--muted-2)", textAlign: "center" }}>{m.month}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

              {/* ── Owner Win Rates ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 14 }}>
                  Owner win rate (365d)
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {byOwner.map(row => (
                    <div key={row.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>{row.key}</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>{row.lead_count} leads</span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600,
                            color: row.win_rate_pct >= 20 ? "var(--sage-ink)" : row.win_rate_pct >= 12 ? "var(--lemon-ink)" : "var(--rose-ink)" }}>
                            {row.win_rate_pct}%
                          </span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>{row.avg_won_value_fmt}</span>
                        </div>
                      </div>
                      <WinBar won={row.won_count} lost={row.lost_count} active={row.active_count} rate={row.win_rate_pct} />
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Source Family Win Rates ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 14 }}>
                  Win rate by lead source
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {bySrc.map(row => (
                    <div key={row.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)", textTransform: "capitalize" }}>{row.key.replace(/_/g, " ")}</span>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>{row.lead_count} leads</span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600,
                            color: row.win_rate_pct >= 20 ? "var(--sage-ink)" : row.win_rate_pct >= 10 ? "var(--lemon-ink)" : "var(--rose-ink)" }}>
                            {row.win_rate_pct}%
                          </span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>{row.avg_won_value_fmt} avg</span>
                        </div>
                      </div>
                      <WinBar won={row.won_count} lost={row.lost_count} active={row.active_count} rate={row.win_rate_pct} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Event Type × Source win-rate heatmap ── */}
            {wl.etype_x_source && wl.etype_x_source.length > 0 && (() => {
              const cross = wl.etype_x_source;
              const etypes = [...new Set(cross.map(r => r.dim_a))].sort();
              const sources = [...new Set(cross.map(r => r.dim_b))].sort();
              const lookup = {};
              cross.forEach(r => { lookup[`${r.dim_a}__${r.dim_b}`] = r; });
              const heatColor = (pct, count) => {
                if (!count || count < 3) return { bg: "var(--card)", ink: "var(--rule)", text: "—" };
                if (pct >= 70) return { bg: "var(--sage-bg)", ink: "var(--sage-ink)", text: pct + "%" };
                if (pct >= 45) return { bg: "var(--mint-bg)", ink: "var(--mint-ink)", text: pct + "%" };
                if (pct >= 20) return { bg: "var(--lemon-bg)", ink: "var(--lemon-ink)", text: pct + "%" };
                if (pct > 0)   return { bg: "var(--rose-bg)", ink: "var(--rose-ink)", text: pct + "%" };
                return { bg: "var(--card)", ink: "var(--muted)", text: "0%" };
              };
              return (
                <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px", marginBottom: 20, overflowX: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)" }}>
                      Event Type × Source — Win Rate Heatmap
                    </div>
                    <button onClick={() => {
                      const rows = cross.map(r => `${r.dim_a},${r.dim_b},${r.lead_count},${r.won_count},${r.win_rate_pct}`);
                      const csv = "event_type,source,leads,won,win_rate_pct\n" + rows.join("\n");
                      const a = document.createElement("a");
                      a.href = "data:text/csv," + encodeURIComponent(csv);
                      a.download = "etype_x_source.csv";
                      a.click();
                      showToast("CSV downloaded");
                    }} style={{ fontFamily: "var(--mono)", fontSize: 9, padding: "4px 10px", border: "1px solid var(--rule)", borderRadius: 4, cursor: "pointer", background: "var(--paper)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      ↓ Export CSV
                    </button>
                  </div>
                  <table style={{ borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: 10 }}>
                    <thead>
                      <tr>
                        <th style={{ padding: "4px 12px 4px 4px", textAlign: "left", color: "var(--muted)", fontWeight: 400, fontSize: 9, textTransform: "uppercase", whiteSpace: "nowrap" }}>Event Type</th>
                        {sources.map(s => (
                          <th key={s} style={{ padding: "4px 8px", textAlign: "center", color: "var(--muted)", fontWeight: 400, fontSize: 9, textTransform: "uppercase", whiteSpace: "nowrap" }}>
                            {s.replace(/_/g," ")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {etypes.map(et => (
                        <tr key={et}>
                          <td style={{ padding: "4px 12px 4px 4px", color: "var(--ink)", fontWeight: 500, whiteSpace: "nowrap", borderBottom: "1px solid var(--rule)" }}>
                            {et.replace(/_/g," ")}
                          </td>
                          {sources.map(s => {
                            const cell = lookup[`${et}__${s}`];
                            const col = heatColor(cell?.win_rate_pct ?? 0, cell?.lead_count ?? 0);
                            return (
                              <td key={s}
                                onContextMenu={e => cell && openCtx(e, `${et} × ${s}`, [
                                  { icon: "write", label: "Copy", action: () => copyText(`${et} × ${s}: ${cell.win_rate_pct}% win (${cell.won_count}/${cell.lead_count})`, `${et}×${s}`) },
                                ])}
                                style={{ padding: "4px 6px", textAlign: "center", borderBottom: "1px solid var(--rule)", cursor: cell ? "context-menu" : "default" }}>
                                <div style={{ background: col.bg, borderRadius: 4, padding: "4px 6px", minWidth: 42, display: "inline-block" }}>
                                  <div style={{ color: col.ink, fontWeight: col.text !== "—" ? 600 : 400, fontSize: 11 }}>{col.text}</div>
                                  {cell && cell.lead_count >= 3 && (
                                    <div style={{ color: col.ink, opacity: 0.6, fontSize: 8 }}>{cell.lead_count}n</div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)", marginTop: 8 }}>
                    Cells with &lt;3 leads shown as — (insufficient data) · n = lead count
                  </div>
                </div>
              );
            })()}

            {/* ── Summary banner ── */}
            {wl.summary_text && (
              <div style={{ background: "var(--lavender-bg)", borderRadius: 8, border: "1px solid var(--lavender-ink)", padding: "14px 18px",
                            fontFamily: "var(--mono)", fontSize: 11, color: "var(--lavender-ink)", lineHeight: 1.6, marginBottom: 16 }}>
                {wl.summary_text}
              </div>
            )}

          </div>
        );
      })()}

      {/* ── Revenue & Growth tab ── */}
      {activeTab === "revenue" && (() => {
        if (!revTrends) return (
          <div style={{ padding: "40px 32px", color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12 }}>
            No revenue data. Run: <code>python3 "Onboard Scripts/analytics_revenue_trends.py" --days 730</code>
          </div>
        );
        const rt = revTrends;
        const yoy = rt.yoy_comparison;
        const percs = rt.deal_size_percentiles;
        const pareto = rt.revenue_concentration || [];
        const trend = rt.monthly_trend || [];
        const srcShare = rt.source_revenue_share || [];
        const etypeShare = rt.event_type_revenue_share || [];
        const peakMonths = rt.peak_booking_months || [];
        const distRows = rt.deal_size_distribution || [];

        // Only show months with any activity for the chart
        const chartMonths = trend.filter(m => m.won_value_cents > 0 || m.new_leads > 0).slice(-18);
        const maxRevMonth = chartMonths.length ? Math.max(...chartMonths.map(m => m.won_value_cents)) : 1;
        const maxLeadsMonth = chartMonths.length ? Math.max(...chartMonths.map(m => m.new_leads)) : 1;

        // Deal size dist chart
        const maxDist = distRows.length ? Math.max(...distRows.map(r => r.count)) : 1;

        // Peak months chart
        const maxPeak = peakMonths.length ? Math.max(...peakMonths.map(m => m.won_value_cents)) : 1;

        const GrowthBadge = ({ pct, label }) => {
          if (pct === null || pct === undefined) return <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>no prior data</span>;
          const up = pct >= 0;
          return (
            <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600,
              color: up ? "var(--sage-ink)" : "var(--rose-ink)",
              background: up ? "var(--sage-bg)" : "var(--rose-bg)",
              padding: "2px 7px", borderRadius: 4 }}>
              {up ? "↑" : "↓"} {Math.abs(pct)}% {label}
            </span>
          );
        };

        return (
          <div style={{ padding: "20px 32px 0" }}>

            {/* ── YoY comparison tiles ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
              {[
                {
                  label: "Revenue (last 12mo)", value: yoy.last_12mo_revenue_fmt,
                  sub: `prior: ${yoy.prior_12mo_revenue_fmt}`, growth: yoy.revenue_growth_pct,
                  bg: "var(--lemon-bg)", ink: "var(--lemon-ink)",
                },
                {
                  label: "Deals won (last 12mo)", value: yoy.last_12mo_won_count,
                  sub: `prior: ${yoy.prior_12mo_won_count}`, growth: yoy.won_count_growth_pct,
                  bg: "var(--sage-bg)", ink: "var(--sage-ink)",
                },
                {
                  label: "Avg deal (last 12mo)", value: yoy.last_12mo_avg_deal_fmt,
                  sub: `prior: ${yoy.prior_12mo_avg_deal_fmt}`, growth: yoy.avg_deal_growth_pct,
                  bg: "var(--sky-bg)", ink: "var(--sky-ink)",
                },
                {
                  label: "Lead volume (last 12mo)", value: yoy.last_12mo_lead_volume?.toLocaleString(),
                  sub: `prior: ${yoy.prior_12mo_lead_volume?.toLocaleString()}`, growth: yoy.lead_volume_growth_pct,
                  bg: "var(--card)", ink: "var(--ink)",
                },
              ].map(({ label, value, sub, growth, bg, ink }) => (
                <div key={label} style={{ background: bg, borderRadius: 8, padding: "14px 16px", border: "1px solid var(--rule)" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 26, fontWeight: 500, color: ink, lineHeight: 1.1, marginBottom: 6 }}>{value}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <GrowthBadge pct={growth} label="YoY" />
                    <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)" }}>{sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Monthly revenue chart ── */}
            <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)" }}>
                  Monthly won revenue · last 18 months
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <ViewToggle tab="revenue" options={[["monthly","Monthly","▬"],["cumulative","Cumulative","∑"]]} />
                  <button onClick={() => exportCSV(chartMonths, "revenue_monthly.csv", ["month","won_value_cents","won_count","avg_value_cents"])}
                    style={{ fontFamily: "var(--mono)", fontSize: 9, padding: "4px 10px", border: "1px solid var(--rule)", borderRadius: 4, cursor: "pointer", background: "var(--paper)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    ↓ CSV
                  </button>
                </div>
              </div>
              {(() => {
                let running = 0;
                const displayMonths = chartMonths.map(m => {
                  running += m.won_value_cents;
                  return { ...m, cumulative_cents: running };
                });
                const maxVal = viewModes.revenue === "cumulative" ? (running || 1) : (maxRevMonth || 1);
                const fmtCents = (c) => c >= 100000000 ? `$${(c/100000000).toFixed(1)}M` : c >= 1000000 ? `$${(c/100000).toFixed(0)}k` : c >= 10000 ? `$${(c/100000).toFixed(1)}k` : `$${(c/100).toFixed(0)}`;
                return (
                  <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 100, overflowX: "auto" }}>
                    {displayMonths.map(m => {
                      const val = viewModes.revenue === "cumulative" ? m.cumulative_cents : m.won_value_cents;
                      const barH = Math.max(2, Math.round(val / maxVal * 88));
                      const isRecent = m.month >= new Date().toISOString().slice(0, 7);
                      const dispFmt = viewModes.revenue === "cumulative" ? fmtCents(m.cumulative_cents) : m.won_value_fmt;
                      return (
                        <div key={m.month}
                          onContextMenu={(e) => openCtx(e, m.month_label, [
                            { icon: "write", label: "Copy month stats", action: () => copyText(
                              `${m.month_label}: ${m.won_value_fmt} revenue · ${m.won_count} deals · avg ${m.avg_deal_fmt}`,
                              m.month_label) },
                            { icon: "cal", label: "View events this month", action: () => setActiveTab("events") },
                          ])}
                          style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 28, gap: 3, cursor: "context-menu" }}>
                          <div style={{ fontFamily: "var(--mono)", fontSize: 7, color: "var(--muted)", textAlign: "center" }}>{dispFmt}</div>
                          <div style={{ width: "100%", height: barH + "px",
                            background: viewModes.revenue === "cumulative" ? "var(--lavender-ink)" : isRecent ? "var(--lemon-ink)" : m.won_count >= 5 ? "var(--sage-ink)" : "var(--sky-ink)",
                            borderRadius: "3px 3px 0 0", transition: "height 0.4s" }} />
                          <div style={{ fontFamily: "var(--mono)", fontSize: 7, color: "var(--muted-2)", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", maxWidth: 32 }}>
                            {m.month_label.replace(" '", "'")}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 9, fontFamily: "var(--mono)", color: "var(--muted)" }}>
                {viewModes.revenue === "monthly" ? <>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--sage-ink)", display: "inline-block" }} /> 5+ deals</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--sky-ink)", display: "inline-block" }} /> &lt;5 deals</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--lemon-ink)", display: "inline-block" }} /> future</span>
                </> : <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "var(--lavender-ink)", display: "inline-block" }} /> running total</span>}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

              {/* ── Deal size distribution ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 4 }}>
                  Deal size distribution · won deals
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", marginBottom: 14 }}>
                  median {percs.median_fmt} · mean {percs.mean_fmt} · P75 {percs.p75_fmt} · P90 {percs.p90_fmt} · max {percs.max_fmt}
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 90 }}>
                  {distRows.map(row => {
                    const h = Math.max(2, Math.round(row.count / maxDist * 78));
                    return (
                      <div key={row.bucket} title={`${row.bucket}: ${row.count} deals (${row.pct_of_deals}% of deals, ${row.pct_of_revenue}% of revenue)`}
                           style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 3 }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 7, color: "var(--muted)", textAlign: "center" }}>{row.count}</div>
                        <div style={{ width: "100%", height: h + "px", background: "var(--lavender-ink)", borderRadius: "3px 3px 0 0", transition: "height 0.4s" }} />
                        <div style={{ fontFamily: "var(--mono)", fontSize: 7, color: "var(--muted-2)", textAlign: "center", whiteSpace: "nowrap" }}>{row.bucket}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Revenue concentration (Pareto) ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 14 }}>
                  Revenue concentration · Pareto
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {pareto.map(row => {
                    const barW = row.pct_of_total_revenue;
                    return (
                      <div key={row.top_pct_of_deals}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--ink)" }}>
                            Top {row.top_pct_of_deals}% of deals
                          </span>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>{row.deal_count} deals · {row.revenue_fmt}</span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--lemon-ink)" }}>
                              {row.pct_of_total_revenue}% of revenue
                            </span>
                          </div>
                        </div>
                        <div style={{ height: 6, borderRadius: 3, background: "var(--rule)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: barW + "%", background: "var(--lemon-ink)", borderRadius: 3, transition: "width 0.4s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

              {/* ── Source revenue share ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 14 }}>
                  Revenue by lead source
                </div>
                <div style={{ display: "grid", gap: 9 }}>
                  {srcShare.slice(0, 7).map(row => {
                    const maxSrcRev = srcShare.length ? srcShare[0].won_value_cents : 1;
                    const barW = Math.round(row.won_value_cents / maxSrcRev * 100);
                    return (
                      <div key={row.source}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
                          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ink)", textTransform: "capitalize" }}>
                            {row.source.replace(/_/g, " ")}
                          </span>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)" }}>
                              {row.pct_of_total_revenue}% · {row.avg_won_value_fmt} avg · {row.win_rate_pct}% win
                            </span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600, color: "var(--ink)" }}>{row.won_value_fmt}</span>
                          </div>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: "var(--rule)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: barW + "%", background: "var(--peach-ink)", borderRadius: 3, transition: "width 0.4s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── Peak booking months heatmap ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginBottom: 14 }}>
                  Revenue by booking month · all time
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
                  {peakMonths.map(m => {
                    const h = Math.max(2, Math.round(m.won_value_cents / maxPeak * 68));
                    const isPeak = m.won_value_cents === maxPeak;
                    const isStrong = m.won_value_cents >= maxPeak * 0.6;
                    return (
                      <div key={m.month_num} title={`${m.month_name}: ${m.won_value_fmt} · ${m.won_count} deals`}
                           style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 3 }}>
                        <div style={{ width: "100%", height: h + "px",
                          background: isPeak ? "var(--rose-ink)" : isStrong ? "var(--peach-ink)" : "var(--lemon-ink)",
                          borderRadius: "2px 2px 0 0", transition: "height 0.4s" }} />
                        <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--muted-2)", textAlign: "center" }}>{m.month_name}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {peakMonths.filter(m => m.won_count > 0).sort((a,b) => b.won_value_cents - a.won_value_cents).slice(0, 4).map(m => (
                    <div key={m.month_num} style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>
                      <span style={{ fontWeight: 600, color: "var(--ink)" }}>{m.month_name}</span>
                      {" "}· {m.won_value_fmt} · {m.won_count}w
                    </div>
                  ))}
                </div>

                {/* Event type revenue share */}
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted-2)", marginTop: 20, marginBottom: 10 }}>
                  Revenue by event type
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {etypeShare.slice(0, 6).map(row => {
                    const maxEtypeRev = etypeShare.length ? etypeShare[0].won_value_cents : 1;
                    const barW = Math.round(row.won_value_cents / maxEtypeRev * 100);
                    return (
                      <div key={row.event_type}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 500, color: "var(--ink)", textTransform: "capitalize" }}>
                            {row.event_type.replace(/_/g, " ")}
                          </span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)" }}>
                            {row.pct_of_total_revenue}% · {row.avg_won_value_fmt} avg · {row.won_count}w
                          </span>
                        </div>
                        <div style={{ height: 4, borderRadius: 2, background: "var(--rule)", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: barW + "%", background: "var(--mint-ink)", borderRadius: 2, transition: "width 0.4s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Summary banner ── */}
            {rt.summary_text && (
              <div style={{ background: "var(--lemon-bg)", borderRadius: 8, border: "1px solid var(--lemon-ink)", padding: "14px 18px",
                            fontFamily: "var(--mono)", fontSize: 11, color: "var(--lemon-ink)", lineHeight: 1.6, marginBottom: 16 }}>
                {rt.summary_text}
              </div>
            )}

          </div>
        );
      })()}

      {/* ── Lead Time tab ── */}
      {activeTab === "leadtime" && (() => {
        if (!bookingLT) return (
          <div style={{ padding: "48px 32px", textAlign: "center", color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12 }}>
            Run <code>analytics_booking_lead_time.py</code> to populate this tab.
          </div>
        );
        const blt = bookingLT;
        const gs = blt.global_stats;
        const urg = blt.urgency_segments;
        const hist = blt.histogram || [];
        const byEtype = blt.by_event_type || [];
        const bySrc = blt.by_source_family || [];
        const byMonth = blt.by_event_month || [];

        // Bucket color map
        const bucketColor = {
          "<30d": "var(--rose-bg)", "30-60d": "var(--peach-bg)", "60-90d": "var(--lemon-bg)",
          "90-180d": "var(--sky-bg)", "180-365d": "var(--mint-bg)", "365d+": "var(--lavender-bg)", "past_event": "var(--card)"
        };
        const bucketInk = {
          "<30d": "var(--rose-ink)", "30-60d": "var(--peach-ink)", "60-90d": "var(--lemon-ink)",
          "90-180d": "var(--sky-ink)", "180-365d": "var(--mint-ink)", "365d+": "var(--lavender-ink)", "past_event": "var(--muted)"
        };
        const maxHistCount = Math.max(...hist.map(h => h.count), 1);
        const maxEtypeMedian = Math.max(...byEtype.map(e => e.median_days || 0), 1);

        return (
          <div style={{ padding: "20px 32px 32px" }}>

            {/* ── Urgency segment tiles ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
              {[
                { key: "last_minute", label: "Last Minute", subtitle: "< 30 days out", icon: "fire",
                  bg: "var(--rose-bg)", ink: "var(--rose-ink)" },
                { key: "planned",     label: "Planned",     subtitle: "90 – 180 days out", icon: "cal",
                  bg: "var(--sky-bg)", ink: "var(--sky-ink)" },
                { key: "long_horizon",label: "Long Horizon", subtitle: "365+ days out", icon: "clock",
                  bg: "var(--lavender-bg)", ink: "var(--lavender-ink)" },
              ].map(({ key, label, subtitle, icon, bg, ink }) => {
                const seg = urg[key] || {};
                return (
                  <div key={key}
                    onContextMenu={e => openCtx(e, label, [
                      { icon: "write", label: `Copy stats`, action: () => copyText(`${label}: ${seg.pct}% (${seg.count} bookings) · avg ${seg.avg_value_fmt}`, label) },
                    ])}
                    style={{ background: bg, border: `1px solid ${ink}`, borderRadius: 10, padding: "18px 20px", cursor: "context-menu" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: ink, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      <AIcon name={icon} size={12} /> {label}
                    </div>
                    <div style={{ fontFamily: "var(--serif)", fontSize: 32, fontWeight: 600, color: ink, lineHeight: 1 }}>
                      {seg.pct ?? 0}%
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: ink, marginTop: 4, opacity: 0.8 }}>
                      {seg.count ?? 0} bookings · avg {seg.avg_value_fmt ?? "$0"}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: ink, marginTop: 2, opacity: 0.6 }}>
                      {subtitle}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Global stats row ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 24 }}>
              {[
                { label: "Median Lead Time", value: `${gs.median_days}d` },
                { label: "Mean Lead Time",   value: `${gs.mean_days}d` },
                { label: "P25",              value: `${gs.p25_days}d` },
                { label: "P75",              value: `${gs.p75_days}d` },
                { label: "P90",              value: `${gs.p90_days}d` },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "var(--card)", borderRadius: 8, border: "1px solid var(--rule)", padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 600, color: "var(--ink)" }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

              {/* ── Histogram ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 14 }}>
                  Booking Lead Time Distribution
                </div>
                {hist.filter(h => h.bucket !== "past_event").map(h => (
                  <div key={h.bucket}
                    onContextMenu={e => openCtx(e, h.label, [
                      { icon: "write", label: "Copy stats", action: () => copyText(`${h.label}: ${h.count} bookings (${h.pct_of_bookings}%) · avg ${h.avg_value_fmt}`, h.label) },
                      { icon: "eye", label: "Spotlight bucket", action: () => spotlightToggle("lt_bucket", h.bucket, h.label) },
                    ])}
                    style={{ marginBottom: 8, cursor: "context-menu", ...spotDim("lt_bucket", h.bucket) }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink)" }}>{h.label}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>
                        {h.count} · {h.pct_of_bookings}% · avg {h.avg_value_fmt}
                      </span>
                    </div>
                    <div style={{ height: 12, background: "var(--rule)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 4,
                        width: `${(h.count / maxHistCount) * 100}%`,
                        background: bucketColor[h.bucket] || "var(--sky-bg)",
                        border: `1px solid ${bucketInk[h.bucket] || "var(--sky-ink)"}`,
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* ── By event type ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 14 }}>
                  Median Lead Time by Event Type
                </div>
                {byEtype.map(et => (
                  <div key={et.event_type}
                    onContextMenu={e => openCtx(e, et.event_type, [
                      { icon: "write", label: "Copy stats", action: () => copyText(`${et.event_type}: median ${et.median_days}d · ${et.count} bookings · ${et.pct_under_90d}% under 90d`, et.event_type) },
                      { icon: "eye", label: "Spotlight type", action: () => spotlightToggle("lt_etype", et.event_type, et.event_type) },
                      { icon: "chart", label: "Search in Close", action: () => openInClose(et.event_type) },
                    ])}
                    style={{ marginBottom: 8, cursor: "context-menu", ...spotDim("lt_etype", et.event_type) }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink)", textTransform: "capitalize" }}>{et.event_type.replace(/_/g," ")}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>
                        {et.median_days}d · {et.count} bookings
                      </span>
                    </div>
                    <div style={{ height: 10, background: "var(--rule)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 4,
                        width: `${(et.median_days / maxEtypeMedian) * 100}%`,
                        background: et.median_days >= 150 ? "var(--lavender-bg)" : et.median_days >= 90 ? "var(--mint-bg)" : et.median_days >= 45 ? "var(--sky-bg)" : "var(--rose-bg)",
                        border: et.median_days >= 150 ? "1px solid var(--lavender-ink)" : et.median_days >= 90 ? "1px solid var(--mint-ink)" : et.median_days >= 45 ? "1px solid var(--sky-ink)" : "1px solid var(--rose-ink)",
                        transition: "width 0.4s ease",
                      }} />
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)", marginTop: 2 }}>
                      {et.pct_under_90d}% under 90d · {et.pct_over_180d}% over 180d
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

              {/* ── By source family ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 14 }}>
                  Lead Time by Source
                </div>
                {bySrc.map(s => {
                  const maxSrcMedian = Math.max(...bySrc.map(x => x.median_days || 0), 1);
                  return (
                    <div key={s.source}
                      onContextMenu={e => openCtx(e, s.source, [
                        { icon: "write", label: "Copy stats", action: () => copyText(`${s.source}: median ${s.median_days}d · ${s.count} bookings`, s.source) },
                        { icon: "eye", label: "Spotlight source", action: () => spotlightToggle("lt_src", s.source, s.source.replace(/_/g," ")) },
                      ])}
                      style={{ marginBottom: 10, cursor: "context-menu", ...spotDim("lt_src", s.source) }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink)" }}>{s.source.replace(/_/g," ")}</span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)" }}>{s.median_days}d median · {s.count}</span>
                      </div>
                      <div style={{ height: 10, background: "var(--rule)", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 4,
                          width: `${(s.median_days / maxSrcMedian) * 100}%`,
                          background: "var(--sky-bg)", border: "1px solid var(--sky-ink)",
                          transition: "width 0.4s ease",
                        }} />
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)", marginTop: 2 }}>
                        {s.pct_under_90d}% under 90d · {s.pct_over_180d}% over 180d
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Seasonal heatmap (by event month) ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 14 }}>
                  Seasonal Demand — Events by Month
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                  {byMonth.map(m => {
                    const maxMonthCount = Math.max(...byMonth.map(x => x.count || 0), 1);
                    const intensity = m.count / maxMonthCount;
                    const bgAlpha = Math.round(intensity * 180);
                    return (
                      <div key={m.month}
                        onContextMenu={e => openCtx(e, m.month_label, [
                          { icon: "write", label: "Copy stats", action: () => copyText(`${m.month_label}: ${m.count} events · median ${m.median_lead_time_days}d lead`, m.month_label) },
                        ])}
                        style={{
                          background: `rgba(100,160,220,${intensity * 0.6})`,
                          border: `1px solid rgba(100,160,220,${intensity * 0.9 + 0.1})`,
                          borderRadius: 6, padding: "8px 6px", textAlign: "center", cursor: "context-menu",
                        }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--ink)", fontWeight: 600 }}>
                          {m.month_label?.slice(0, 3)}
                        </div>
                        <div style={{ fontFamily: "var(--serif)", fontSize: 16, fontWeight: 600, color: "var(--ink)", lineHeight: 1.2 }}>
                          {m.count}
                        </div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--muted)" }}>
                          {m.median_lead_time_days ?? "—"}d
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)", marginTop: 10, textAlign: "center" }}>
                  cell = event count · number below = median lead days
                </div>
              </div>
            </div>

            {/* ── Summary banner ── */}
            {blt.summary_text && (
              <div style={{ background: "var(--peach-bg)", borderRadius: 8, border: "1px solid var(--peach-ink)", padding: "14px 18px",
                            fontFamily: "var(--mono)", fontSize: 11, color: "var(--peach-ink)", lineHeight: 1.6 }}>
                {blt.summary_text}
              </div>
            )}

          </div>
        );
      })()}

      {/* ── Cohort tab ── */}
      {activeTab === "cohort" && (() => {
        if (!cohortData) return (
          <div style={{ padding: "48px 32px", textAlign: "center", color: "var(--muted)", fontFamily: "var(--mono)", fontSize: 12 }}>
            Run <code>analytics_cohort_analysis.py</code> to populate this tab.
          </div>
        );
        const cd = cohortData;
        const curves = cd.conversion_curves || [];
        const grid = cd.cohort_grid || [];
        const bestCohorts = cd.best_cohorts || [];
        const worstCohorts = cd.worst_cohorts || [];
        const recentHealth = cd.recent_cohort_health || [];
        const sourceCohorts = cd.source_cohorts || [];
        const windows = ["30d","60d","90d","6mo","1yr","2yr"];

        // Color a rate: 0% = muted, >15% = green, >8% = yellow, >3% = sky
        const rateColor = (pct) => {
          if (pct === 0) return { bg: "transparent", ink: "var(--muted)" };
          if (pct >= 15) return { bg: "var(--sage-bg)", ink: "var(--sage-ink)" };
          if (pct >= 8)  return { bg: "var(--mint-bg)", ink: "var(--mint-ink)" };
          if (pct >= 4)  return { bg: "var(--lemon-bg)", ink: "var(--lemon-ink)" };
          return { bg: "var(--sky-bg)", ink: "var(--sky-ink)" };
        };
        const maturityColor = { mature: "var(--mint-ink)", developing: "var(--lemon-ink)", young: "var(--peach-ink)" };

        return (
          <div style={{ padding: "20px 32px 32px" }}>

            {/* ── Conversion curve tiles ── */}
            <div style={{ marginBottom: 6, fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)" }}>
              Avg Conversion Rate by Time Window (all cohorts)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, marginBottom: 24 }}>
              {curves.map(c => {
                const col = rateColor(c.overall_rate_pct);
                return (
                  <div key={c.window}
                    onContextMenu={e => openCtx(e, `${c.window} window`, [
                      { icon: "write", label: "Copy", action: () => copyText(`${c.window}: ${c.overall_rate_pct}% overall · ${c.avg_conversion_rate_pct}% avg · ${c.total_converted}/${c.total_eligible_leads} leads`, c.window) },
                    ])}
                    style={{ background: col.bg || "var(--card)", border: `1px solid ${col.ink === "var(--muted)" ? "var(--rule)" : col.ink}`, borderRadius: 8, padding: "12px 10px", textAlign: "center", cursor: "context-menu" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 8, textTransform: "uppercase", letterSpacing: "0.1em", color: col.ink, marginBottom: 4 }}>{c.window}</div>
                    <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 600, color: col.ink, lineHeight: 1 }}>{c.overall_rate_pct}%</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: col.ink, opacity: 0.7, marginTop: 3 }}>{c.total_converted} won</div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>

              {/* ── Best cohorts ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 14 }}>
                  <AIcon name="sparkles" size={11} style={{ marginRight: 5 }} /> Top 5 Cohorts (by 90d rate)
                </div>
                {bestCohorts.map((c, i) => (
                  <div key={c.cohort}
                    onContextMenu={e => openCtx(e, c.cohort, [
                      { icon: "write", label: "Copy", action: () => copyText(`Cohort ${c.cohort}: 90d ${c.windows["90d"].rate_pct}% · total ${c.total_leads} leads · ${c.total_converted} won`, c.cohort) },
                      { icon: "eye", label: "Spotlight", action: () => spotlightToggle("cohort_month", c.cohort, c.cohort) },
                    ])}
                    style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "context-menu",
                             padding: "8px 10px", borderRadius: 6, background: i === 0 ? "var(--lemon-bg)" : "transparent",
                             border: i === 0 ? "1px solid var(--lemon-ink)" : "1px solid transparent",
                             ...spotDim("cohort_month", c.cohort) }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", width: 18 }}>#{i+1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink)", fontWeight: 600 }}>{c.cohort}</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)" }}>{c.total_leads} leads · {c.total_converted} won</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--serif)", fontSize: 18, fontWeight: 600, color: "var(--mint-ink)" }}>{c.windows["90d"].rate_pct}%</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--muted)" }}>at 90d</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Source cohorts ── */}
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 14 }}>
                  Conversion by Source Channel
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr repeat(3, 50px)", gap: "4px 8px", alignItems: "center", marginBottom: 6 }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Source</div>
                  <div />
                  {["90d","6mo","1yr"].map(w => <div key={w} style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--muted)", textAlign: "center", textTransform: "uppercase" }}>{w}</div>)}
                </div>
                {sourceCohorts.map(s => (
                  <div key={s.source}
                    onContextMenu={e => openCtx(e, s.source, [
                      { icon: "write", label: "Copy", action: () => copyText(`${s.source}: 90d ${s.windows["90d"].rate_pct}% · 1yr ${s.windows["1yr"].rate_pct}% · ${s.total_leads} leads`, s.source) },
                      { icon: "eye", label: "Spotlight source", action: () => spotlightToggle("cohort_src", s.source, s.source.replace(/_/g," ")) },
                    ])}
                    style={{ display: "grid", gridTemplateColumns: "auto 1fr repeat(3, 50px)", gap: "4px 8px", alignItems: "center",
                             marginBottom: 4, padding: "5px 6px", borderRadius: 5, cursor: "context-menu",
                             background: "var(--card)", ...spotDim("cohort_src", s.source) }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink)", whiteSpace: "nowrap" }}>
                      {s.source.replace(/_/g," ")}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--muted)" }}>
                      {s.total_leads} leads
                    </div>
                    {["90d","6mo","1yr"].map(w => {
                      const r = s.windows?.[w]?.rate_pct ?? 0;
                      const col = rateColor(r);
                      return (
                        <div key={w} style={{ textAlign: "center", background: col.bg, borderRadius: 4, padding: "2px 0" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: col.ink, fontWeight: r > 0 ? 600 : 400 }}>{r}%</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Monthly cohort heatmap ── */}
            <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", padding: "18px 20px", marginBottom: 24, overflowX: "auto" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 14 }}>
                Monthly Cohort Matrix — Conversion % at each window
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--mono)", fontSize: 10 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "4px 8px", color: "var(--muted)", fontWeight: 400, fontSize: 9, textTransform: "uppercase" }}>Cohort</th>
                    <th style={{ textAlign: "center", padding: "4px 8px", color: "var(--muted)", fontWeight: 400, fontSize: 9, textTransform: "uppercase" }}>Leads</th>
                    <th style={{ textAlign: "center", padding: "4px 8px", color: "var(--muted)", fontWeight: 400, fontSize: 9, textTransform: "uppercase" }}>Status</th>
                    {windows.map(w => <th key={w} style={{ textAlign: "center", padding: "4px 8px", color: "var(--muted)", fontWeight: 400, fontSize: 9, textTransform: "uppercase" }}>{w}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {grid.slice().reverse().map(row => (
                    <tr key={row.cohort}
                      onContextMenu={e => openCtx(e, row.cohort, [
                        { icon: "write", label: "Copy row", action: () => copyText(
                          `${row.cohort}: ${row.total_leads} leads · ` + windows.map(w => `${w}:${row.windows[w]?.rate_pct}%`).join(" · "),
                          row.cohort
                        )},
                        { icon: "eye", label: "Spotlight cohort", action: () => spotlightToggle("cohort_month", row.cohort, row.cohort) },
                      ])}
                      style={{ cursor: "context-menu", ...spotDim("cohort_month", row.cohort) }}>
                      <td style={{ padding: "4px 8px", color: "var(--ink)", fontWeight: 600, borderBottom: "1px solid var(--rule)" }}>{row.cohort}</td>
                      <td style={{ padding: "4px 8px", textAlign: "center", color: "var(--muted)", borderBottom: "1px solid var(--rule)" }}>{row.total_leads}</td>
                      <td style={{ padding: "4px 8px", textAlign: "center", borderBottom: "1px solid var(--rule)" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: 9, color: maturityColor[row.maturity] || "var(--muted)", textTransform: "uppercase" }}>{row.maturity}</span>
                      </td>
                      {windows.map(w => {
                        const r = row.windows?.[w]?.rate_pct ?? 0;
                        // Only show windows the cohort is old enough for
                        const wDays = { "30d":30,"60d":60,"90d":90,"6mo":180,"1yr":365,"2yr":730 }[w];
                        const eligible = row.age_days >= wDays;
                        const col = eligible ? rateColor(r) : { bg: "transparent", ink: "var(--muted)" };
                        return (
                          <td key={w} style={{ padding: "3px 4px", textAlign: "center", borderBottom: "1px solid var(--rule)" }}>
                            <div style={{ background: col.bg, borderRadius: 4, padding: "2px 4px", display: "inline-block", minWidth: 32 }}>
                              <span style={{ color: eligible ? col.ink : "var(--rule)", fontSize: 10, fontWeight: r > 0 && eligible ? 600 : 400 }}>
                                {eligible ? `${r}%` : "—"}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Recent cohort health ── */}
            {recentHealth.length > 0 && (
              <div style={{ background: "var(--peach-bg)", borderRadius: 10, border: "1px solid var(--peach-ink)", padding: "18px 20px", marginBottom: 24 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--peach-ink)", marginBottom: 12 }}>
                  📍 Recent Cohort Health — last 6 months (still developing)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
                  {recentHealth.map(row => (
                    <div key={row.cohort}
                      onContextMenu={e => openCtx(e, row.cohort, [
                        { icon: "write", label: "Copy", action: () => copyText(`${row.cohort}: ${row.total_leads} leads · ${row.total_converted} won · best ${row.best_rate_pct}%`, row.cohort) },
                      ])}
                      style={{ background: "var(--paper)", borderRadius: 7, border: "1px solid var(--peach-ink)", padding: "12px 14px", cursor: "context-menu" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 11, fontWeight: 600, color: "var(--ink)", marginBottom: 3 }}>{row.cohort}</div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 9, color: "var(--muted)", marginBottom: 4 }}>
                        {row.total_leads} leads · {row.total_converted} won
                      </div>
                      <div style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 600, color: "var(--peach-ink)" }}>
                        {row.best_rate_pct}%
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--peach-ink)", opacity: 0.7 }}>
                        best so far · {row.maturity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Summary banner ── */}
            {cd.summary_text && (
              <div style={{ background: "var(--lavender-bg)", borderRadius: 8, border: "1px solid var(--lavender-ink)", padding: "14px 18px",
                            fontFamily: "var(--mono)", fontSize: 11, color: "var(--lavender-ink)", lineHeight: 1.6 }}>
                {cd.summary_text}
              </div>
            )}

          </div>
        );
      })()}

      {/* ── Leads tab ── */}
      {activeTab === "leads" && (
        <div style={{ padding: "20px 32px 0" }}>
          <AnalyticsLeadTable leads={leads} />
        </div>
      )}

      {/* ── Conversations tab ── */}
      {activeTab === "conversations" && (
        <div style={{ padding: "20px 32px 0" }}>
          <ConversationIntelligenceTab go={go} />
        </div>
      )}

      {/* ── Spotlight badge ── */}
      {spotlight && (
        <div style={{
          position: "fixed", top: 68, right: 20, zIndex: 8000,
          background: "var(--lemon-bg)", border: "1px solid var(--lemon-ink)",
          borderRadius: 8, padding: "8px 14px",
          fontFamily: "var(--mono)", fontSize: 10, color: "var(--lemon-ink)",
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
        }}>
          <AIcon name="eye" size={13} />
          <span>Spotlight: <b>{spotlight.label}</b></span>
          <button onClick={() => setSpotlight(null)}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: "var(--lemon-ink)", fontFamily: "var(--mono)", fontSize: 13, lineHeight: 1,
              padding: "0 2px", marginLeft: 4 }}>✕</button>
        </div>
      )}

      {/* ── Owner comparison panel ── */}
      {compareOwners && compareOwners.length === 2 && (() => {
        const [owA, owB] = compareOwners;
        const allOwners = displayOwners || [];
        const StatRow = ({ label, a, b, higherIsBetter = true }) => {
          const aNum = parseFloat(a) || 0;
          const bNum = parseFloat(b) || 0;
          const aWins = higherIsBetter ? aNum > bNum : aNum < bNum;
          const bWins = higherIsBetter ? bNum > aNum : bNum < aNum;
          return (
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--rule)" }}>
              <div style={{ textAlign: "right", fontFamily: "var(--mono)", fontSize: 11, color: aWins ? "var(--mint-ink)" : "var(--ink)", fontWeight: aWins ? 600 : 400 }}>{a}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 8, color: "var(--muted)", textTransform: "uppercase", textAlign: "center", whiteSpace: "nowrap" }}>{label}</div>
              <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: bWins ? "var(--mint-ink)" : "var(--ink)", fontWeight: bWins ? 600 : 400 }}>{b}</div>
            </div>
          );
        };
        return (
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: 360, zIndex: 7500,
            background: "var(--paper)", borderLeft: "1px solid var(--rule)",
            display: "flex", flexDirection: "column",
            boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
          }}>
            {/* Header */}
            <div style={{ padding: "20px 20px 14px", borderBottom: "1px solid var(--rule)", background: "var(--card)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--muted)" }}>⚖ Owner Head-to-Head</div>
                <button onClick={() => setCompareOwners(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", fontSize: 16, lineHeight: 1, padding: "2px 4px" }}>✕</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[owA, owB].map((ow, idx) => (
                  <div key={idx}>
                    <select
                      value={ow.owner_name}
                      onChange={e => {
                        const selected = allOwners.find(x => x.owner_name === e.target.value);
                        if (!selected) return;
                        setCompareOwners(prev => idx === 0 ? [selected, prev[1]] : [prev[0], selected]);
                      }}
                      style={{ fontFamily: "var(--mono)", fontSize: 10, width: "100%", padding: "6px 8px", border: "1px solid var(--rule)", borderRadius: 5, background: "var(--paper)", color: "var(--ink)", cursor: "pointer" }}>
                      {allOwners.map(o => <option key={o.owner_name} value={o.owner_name}>{o.owner_name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
              {/* Name headers */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, marginBottom: 12 }}>
                <div style={{ textAlign: "right", fontFamily: "var(--serif)", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{owA.owner_name.split(" ")[0]}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", textAlign: "center" }}>vs</div>
                <div style={{ fontFamily: "var(--serif)", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{owB.owner_name.split(" ")[0]}</div>
              </div>

              <StatRow label="Leads" a={owA.lead_count} b={owB.lead_count} />
              <StatRow label="Won" a={owA.won_count} b={owB.won_count} />
              <StatRow label="Win rate" a={(owA.win_rate_pct || 0) + "%"} b={(owB.win_rate_pct || 0) + "%"} />
              <StatRow label="Active" a={owA.active_count} b={owB.active_count} />
              {owA.pipeline_value_fmt && <StatRow label="Pipeline $" a={owA.pipeline_value_fmt} b={owB.pipeline_value_fmt || "—"} />}
              {owA.avg_won_value_fmt && <StatRow label="Avg deal" a={owA.avg_won_value_fmt} b={owB.avg_won_value_fmt || "—"} />}
              {owA.median_days_to_close != null && <StatRow label="Median close" a={(owA.median_days_to_close || 0) + "d"} b={(owB.median_days_to_close || 0) + "d"} higherIsBetter={false} />}

              {/* Edge summary */}
              <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 7, background: "var(--card)", border: "1px solid var(--rule)" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 6 }}>Edge</div>
                {(() => {
                  const aScore = [
                    owA.win_rate_pct > owB.win_rate_pct,
                    (owA.avg_won_value_fmt || "0").replace(/[^0-9.]/g,"") > (owB.avg_won_value_fmt || "0").replace(/[^0-9.]/g,""),
                    owA.lead_count > owB.lead_count,
                  ].filter(Boolean).length;
                  const bScore = 3 - aScore;
                  const leader = aScore > bScore ? owA.owner_name.split(" ")[0] : bScore > aScore ? owB.owner_name.split(" ")[0] : null;
                  return (
                    <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--ink)", lineHeight: 1.5 }}>
                      {leader ? `${leader} leads ${Math.max(aScore,bScore)}/3 tracked metrics.` : "Dead heat across tracked metrics."}
                    </div>
                  );
                })()}
              </div>

              <button
                onClick={() => exportCSV([owA, owB], "owner_comparison.csv", ["owner_name","lead_count","won_count","active_count","win_rate_pct","pipeline_value_fmt","avg_won_value_fmt","median_days_to_close"])}
                style={{ marginTop: 16, width: "100%", fontFamily: "var(--mono)", fontSize: 9, padding: "8px", border: "1px solid var(--rule)", borderRadius: 5, cursor: "pointer", background: "var(--paper)", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                ↓ Export comparison CSV
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── Context menu ── */}
      <AnalyticsContextMenu menu={ctxMenu} onClose={closeCtx} />

      {/* ── Toast ── */}
      <AnalyticsToast message={toastMsg} />

    </div>
  );
}

// ── SVG donut chart ──────────────────────────────────────────────────────────
function AnalyticsDonut({ data, colorMap, total }) {
  const entries = Object.entries(data || {}).sort((a,b) => b[1]-a[1]);
  const sum = entries.reduce((s, [,v]) => s + v, 0) || 1;
  const size = 120, cx = 60, cy = 60, r = 46, stroke = 14;

  let offset = 0;
  const circumference = 2 * Math.PI * r;
  const segments = entries.map(([key, count]) => {
    const pct = count / sum;
    const dash = pct * circumference;
    const gap  = circumference - dash;
    const seg = { key, count, dash, gap, offset, pct };
    offset += dash;
    return seg;
  });

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        {segments.map(({ key, dash, gap, offset: segOffset }) => {
          const col = colorMap[key] || colorMap.unknown;
          return (
            <circle key={key} cx={cx} cy={cy} r={r}
              fill="none" stroke={col.dot}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-segOffset}
              style={{ transition: "all 0.4s ease" }}
            />
          );
        })}
        <circle cx={cx} cy={cy} r={r - stroke / 2 - 2} fill="var(--card)" />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: "var(--serif)", fontSize: 22, fill: "var(--ink)", transform: "rotate(90deg)", transformOrigin: `${cx}px ${cy}px` }}>
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle"
          style={{ fontFamily: "var(--mono)", fontSize: 8, fill: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", transform: "rotate(90deg)", transformOrigin: `${cx}px ${cy}px` }}>
          leads
        </text>
      </svg>
    </div>
  );
}

// ── Lead profiles table ──────────────────────────────────────────────────────
function AnalyticsLeadTable({ leads }) {
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState("latest_opp_updated");
  const [sortDir, setSortDir] = useState(-1);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  const filtered = leads.filter(l => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (l.lead_name || "").toLowerCase().includes(q) ||
           (l.primary_source_channel || "").toLowerCase().includes(q) ||
           (l.lead_owner_name || "").toLowerCase().includes(q) ||
           (l.status_label || "").toLowerCase().includes(q);
  });
  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey] || "";
    const bv = b[sortKey] || "";
    if (typeof av === "number") return sortDir * (av - bv);
    return sortDir * String(av).localeCompare(String(bv));
  });
  const pages = Math.ceil(sorted.length / PAGE_SIZE);
  const visible = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleSort = (k) => {
    if (sortKey === k) setSortDir(d => -d);
    else { setSortKey(k); setSortDir(-1); }
    setPage(0);
  };

  const cols = [
    { key: "lead_name",             label: "Lead" },
    { key: "lead_owner_name",       label: "Owner" },
    { key: "status_label",          label: "Stage" },
    { key: "primary_source_channel", label: "Source" },
    { key: "primary_source_family", label: "Family" },
    { key: "customer_type",         label: "Type" },
    { key: "latest_opp_updated",    label: "Last Updated" },
  ];

  const statusColor = (type) => {
    if (type === "won")  return { background: "var(--sage-bg)",  color: "var(--sage-ink)" };
    if (type === "lost") return { background: "var(--rose-bg)",  color: "var(--rose-ink)" };
    return { background: "var(--mint-bg)", color: "var(--mint-ink)" };
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
        <input
          type="text" placeholder="Filter by name, source, owner, stage…" value={filter}
          onChange={e => { setFilter(e.target.value); setPage(0); }}
          style={{ flex: 1, padding: "7px 12px", border: "1px solid var(--rule)", borderRadius: 6, fontSize: 12,
                   fontFamily: "var(--sans)", background: "var(--card)", color: "var(--ink)" }}
        />
        <div style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>
          {filtered.length} of {leads.length}
        </div>
      </div>
      <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--rule)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "var(--card-2)" }}>
              {cols.map(c => (
                <th key={c.key}
                  onClick={() => toggleSort(c.key)}
                  style={{ padding: "9px 12px", textAlign: "left", cursor: "pointer", userSelect: "none",
                           fontFamily: "var(--mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.07em",
                           color: sortKey === c.key ? "var(--ink)" : "var(--muted)", fontWeight: 500,
                           borderBottom: "1px solid var(--rule)", whiteSpace: "nowrap" }}>
                  {c.label}{sortKey === c.key ? (sortDir === -1 ? " ↓" : " ↑") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((l, i) => {
              const sc = statusColor(l.status_type);
              const famCol = FAMILY_COLORS[l.primary_source_family] || FAMILY_COLORS.unknown;
              const updStr = l.latest_opp_updated
                ? new Date(l.latest_opp_updated).toLocaleDateString(undefined, { month: "short", day: "numeric" })
                : "—";
              return (
                <tr key={l.lead_id} style={{ borderBottom: "1px solid var(--rule)", background: i % 2 ? "var(--card-2)" : "var(--card)" }}>
                  <td style={{ padding: "8px 12px", fontWeight: 500, color: "var(--ink)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.lead_name || "—"}</td>
                  <td style={{ padding: "8px 12px", color: "var(--muted)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.lead_owner_name || "—"}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{ ...sc, padding: "2px 7px", borderRadius: 4, fontSize: 10, fontFamily: "var(--mono)", whiteSpace: "nowrap" }}>
                      {l.status_label || l.status_type || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", color: "var(--ink)", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.primary_source_channel || "—"}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{ background: famCol.bg, color: famCol.ink, padding: "2px 7px", borderRadius: 4, fontSize: 10, fontFamily: "var(--mono)", whiteSpace: "nowrap" }}>
                      {famCol.label || l.primary_source_family || "—"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", fontSize: 11, color: "var(--muted)" }}>{l.customer_type || "—"}</td>
                  <td style={{ padding: "8px 12px", fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", whiteSpace: "nowrap" }}>{updStr}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "12px 16px", borderTop: "1px solid var(--rule)" }}>
            <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}
              style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "5px 12px", border: "1px solid var(--rule)",
                       borderRadius: 4, background: "var(--card)", color: "var(--ink)", cursor: page === 0 ? "default" : "pointer" }}>← Prev</button>
            <span style={{ fontFamily: "var(--mono)", fontSize: 10, color: "var(--muted)", padding: "5px 8px" }}>
              {page + 1} / {pages}
            </span>
            <button onClick={() => setPage(p => Math.min(pages-1, p+1))} disabled={page >= pages-1}
              style={{ fontFamily: "var(--mono)", fontSize: 10, padding: "5px 12px", border: "1px solid var(--rule)",
                       borderRadius: 4, background: "var(--card)", color: "var(--ink)", cursor: page >= pages-1 ? "default" : "pointer" }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { BriefingScreen, DraftScreen, ScheduleScreen, SettingsScreen, ContactsScreen, DailyBriefingScreen, ChatScreen, PiecesActivityScreen, IntakeScreen, AnalyticsScreen, DelegationsScreen, BoxesScreen });

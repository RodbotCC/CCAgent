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

  const route = AI && AI.getRoute ? AI.getRoute() : null;
  const maskedHint = route === "server-proxy"
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
  const pickModel = (m) => setTweaks({ ...tweaks, openaiModel: m });
  const test = async () => {
    if (!AI) { setTestState({ state: "err", msg: "ai.js not loaded" }); return; }
    const p = AI.getProvider();
    setTestState({ state: "running", msg: p === "claude_code" ? "running claude -p probe…" : "calling OpenAI Responses API…" });
    const r = await AI.testConnection();
    if (r.ok) setTestState({ state: "ok", msg: `ok · ${r.route} · reply: ${r.text}` });
    else setTestState({ state: "err", msg: r.error });
  };

  // Provider pill selector — Claude Code (via subprocess) vs OpenAI.
  const currentProvider = AI && AI.getProvider ? AI.getProvider() : "openai";
  const claudeReady = !!(srvStatus && srvStatus.claude_code_available);
  const pickProvider = (p) => setTweaks({ ...tweaks, aiProvider: p });

  return (
    <React.Fragment>
      <div className="opt">
        <div>
          <div className="lbl">AI provider</div>
          <div className="desc">
            <b>Claude Code</b> (default) uses your Max-plan auth via local <code>claude -p</code> — no API key, no per-token cost.
            &nbsp;<b>OpenAI</b> is an optional fallback via Responses API (server proxy or browser BYOK).
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
              className={currentProvider === "openai" ? "on" : ""}
              onClick={() => pickProvider("openai")}
            ><Icon name="sparkles" size={12} style={{marginRight:5}}/>OpenAI</button>
          </div>
        </div>
      </div>

      {currentProvider === "claude_code" && (
        <div className="opt">
          <div>
            <div className="lbl">Claude Code binary</div>
            <div className="desc">
              Resolved from server PATH at startup. Prompts pipe through stdin with <code>--max-turns 1 --output-format text</code> for one-shot speed.
            </div>
          </div>
          <div style={{fontSize: 11.5, color: claudeReady ? "var(--pastel-mint-ink)" : "var(--alarm)"}}>
            {claudeReady ? (srvStatus.claude_code_path || "ready") : "not found"}
          </div>
          <div className="ctrl">
            <button className="btn" onClick={test} disabled={testState.state === "running"}>
              {testState.state === "running" ? "testing…" : "Test"}
            </button>
          </div>
        </div>
      )}

      <div className="opt" style={{opacity: currentProvider === "claude_code" ? 0.55 : 1}}>
        <div>
          <div className="lbl">OpenAI API key {currentProvider === "claude_code" && <span style={{fontSize:10, color:"var(--ink-4)", fontWeight:400}}>(fallback only)</span>}</div>
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
          <div className="desc">Selected model for Responses API calls. Nano is fastest, 5.4 is the ceiling.</div>
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

      <div className="opt" style={{opacity: currentProvider === "claude_code" ? 0.55 : 1}}>
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
              Pre-process prompts with gpt-5.4-mini
              {tweaks.promptEnhance && <span style={{marginLeft:8, padding:"1px 6px", borderRadius:3, background:"color-mix(in oklab, var(--leaf) 18%, var(--paper))", color:"var(--pastel-mint-ink)", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em"}}>on</span>}
            </div>
            <div className="desc">
              When on, every chat message you send is first run through gpt-5.4-mini. The mini model rewrites your prompt as a clearer, more directed instruction for Claude (you still see your original message in the chat) and emits a contextual <em>thinking trace</em> the UI animates while Claude works. Adds ~1s of latency, generally improves output quality, and replaces the static "thinking" box with something alive.
            </div>
          </div>
          <div />
          <div className="ctrl">
            <div className={"toggle" + (tweaks.promptEnhance ? " on" : "")} onClick={() => setTweaks({...tweaks, promptEnhance: !tweaks.promptEnhance})} />
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
              <span className="vp-enrich">🔥 ENRICH NOW</span>
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
      await window.SecretaryDelegator.dispatch({
        label: "From chat: " + (text.slice(0, 40) || "(untitled)"),
        prompt: text,
        mode: "trusted",
      });
      alert("Dispatched to Claude Code.");
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

function IntakeScreen({ go }) {
  // Local "view mode" — list of reports, or one report's detail. Using
  // local state (not the router) so back-button behavior here is a simple
  // toggle.
  const [activeSlug, setActiveSlug] = useState(null);
  if (activeSlug) {
    return <IntakeReportDetail slug={activeSlug} onBack={() => setActiveSlug(null)} go={go}/>;
  }
  return <IntakeReportsList onPick={setActiveSlug} go={go}/>;
}

// ─── Reports list ──────────────────────────────────────────────────────
function IntakeReportsList({ onPick, go }) {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true); setErr(null);
    fetchJson("/api/reports/list").then(d => {
      setItems(d.items || []);
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
      {!loading && !err && items.length === 0 && (
        <div className="ix-empty">
          <div className="ix-empty-mark">∅</div>
          <h2 className="ix-empty-title">No reports yet.</h2>
          <p className="ix-empty-body">
            A report is a workspace for messy stacks of documents — tax prep, an insurance claim, a receipt audit. Give it a name and start dropping files in.
          </p>
          <button className="btn primary" onClick={() => setShowCreate(true)}>+ create your first report</button>
        </div>
      )}
      {!loading && !err && items.length > 0 && (
        <div className="ix-grid">
          {items.map(r => (
            <button key={r.slug} className="ix-card" onClick={() => onPick(r.slug)}>
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
          ))}
        </div>
      )}

      <div className="ix-footer">
        <button className="btn ghost" onClick={() => go.back()}>← back</button>
      </div>
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
  image: "▣", pdf: "▦", csv: "▤", json: "{}", md: "✎", txt: "▤", unknown: "?",
};

function IntakeDocumentCard({ doc, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const icon = DOC_ICONS[doc.type] || "?";
  const cls = doc.classification || {};
  const conf = typeof cls.confidence === "number" ? cls.confidence : null;

  return (
    <div className={"ix-doc ix-doc-" + doc.type}>
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
          <button className="ix-doc-x" onClick={onDelete} title="Remove">✕</button>
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

  const onFilesPicked = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(ingestFile);
    if (e.target) e.target.value = "";
  };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragOver(false);
    const files = Array.from((e.dataTransfer && e.dataTransfer.files) || []);
    files.forEach(ingestFile);
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

    try {
      // Stage 1 — preprocess (best-effort, 8s timeout)
      try {
        const ppController = new AbortController();
        const ppTimer = setTimeout(() => ppController.abort(), 8000);
        const pp = await fetchJson("/api/chat/preprocess", {
          method: "POST",
          body: JSON.stringify({
            message: q,
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
          thinkingModel  = pp.model || "gpt-5.4-mini";
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

  if (loading) return <div style={{padding:40, textAlign:"center", color:"var(--ink-4)"}}>loading report…</div>;
  if (err) return <div style={{padding:20, color:"var(--data-negative)"}}>Error: {err} <button className="btn ghost" onClick={onBack} style={{marginLeft:12}}>← back</button></div>;
  if (!report) return null;

  const docs = report.documents || [];
  const conversation = report.conversation || [];
  const ingestingArr = Object.entries(ingesting);

  const SUGGESTIONS = [
    "Summarize what's in these documents.",
    "What totals can you compute from this data?",
    "Pull out every name, address, and contact info.",
    "What questions should I be asking that I'm not?",
  ];

  return (
    <div className="ix-detail">
      {/* Hero header */}
      <header className="ix-detail-head">
        <button className="ix-back" onClick={onBack}>← reports</button>
        <div className="ix-detail-title-wrap">
          <div className="ix-eyebrow">
            intake report · {docs.length} {docs.length === 1 ? "doc" : "docs"} · {conversation.length} {conversation.length === 1 ? "answer" : "answers"}
          </div>
          <h1 className="ix-detail-title">{report.name}</h1>
          {report.description && <div className="ix-lede">{report.description}</div>}
        </div>
        <button className="ix-x" onClick={deleteReport} title="Delete this report">delete</button>
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
        <div className="ix-drop-sub">Receipts · invoices · CSVs · PDFs · photos · markdown · JSON · notes — Rodbot reads them all.</div>
        <input ref={fileInputRef} type="file" multiple style={{display:"none"}}
          onChange={onFilesPicked}
          accept="image/*,application/pdf,text/csv,text/tab-separated-values,text/plain,text/markdown,application/json,.csv,.tsv,.txt,.md,.markdown,.json,.log"/>
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
              <IntakeDocumentCard key={d.id} doc={d} onDelete={() => deleteDoc(d.id)}/>
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
          <div key={qa.id} className={"ix-qa-entry" + (qa.pending ? " pending" : "") + (qa.error ? " errored" : "")}>
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

Object.assign(window, { BriefingScreen, DraftScreen, ScheduleScreen, SettingsScreen, ContactsScreen, DailyBriefingScreen, ChatScreen, PiecesActivityScreen, IntakeScreen });

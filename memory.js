/* Comeketo Agent — live memory layer.
   Persists user behavior to localStorage and derives the stats the
   Memory + Prediction screens show (clusters, frame declarations,
   gesture residue, prediction accuracy).

   The app keeps a minimal *event log* and computes everything else on
   read. No denormalized counters to keep in sync.

   Shape:
     events: Array<{ t, type, cluster, signature, gridId, cellId, predicted?, detail?, text?, source? }>
       type ∈ 'open' | 'commit' | 'send' | 'sweep' | 'frame_reject' | 'lean' | 'generate' | 'edit'

   Seed (data.js clusters / frameLog / voiceModel) is used only when the
   user has no real events yet, so new installs don't see empty screens.
*/
window.SecretaryMemory = (() => {
  const EVENTS_KEY = "secretary.memory.events";
  const MAX_EVENTS = 5000;

  function loadEvents() {
    try { return JSON.parse(localStorage.getItem(EVENTS_KEY) || "[]"); }
    catch { return []; }
  }
  function saveEvents(evs) {
    try { localStorage.setItem(EVENTS_KEY, JSON.stringify(evs.slice(-MAX_EVENTS))); } catch {}
  }

  let events = loadEvents();
  const listeners = new Set();
  function notify() { listeners.forEach(fn => { try { fn(); } catch {} }); }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  function logEvent(ev) {
    const entry = { t: new Date().toISOString(), ...ev };
    events = [...events, entry];
    saveEvents(events);
    notify();
    return entry;
  }

  // ---- High-level loggers (called from app.jsx) --------------------------

  const log = {
    open:        (info) => logEvent({ type: "open",        ...info }),
    commit:      (info) => logEvent({ type: "commit",      ...info }),
    send:        (info) => logEvent({ type: "send",        ...info }),
    sweep:       (info) => logEvent({ type: "sweep",       ...info }),
    frameReject: (info) => logEvent({ type: "frame_reject",...info }),
    lean:        (info) => logEvent({ type: "lean",        ...info }),
    generate:    (info) => logEvent({ type: "generate",    ...info }),
    edit:        (info) => logEvent({ type: "edit",        ...info }),
    // New — wired 2026-04-22 so the memory layer sees what the user
    // actually does. Each carries stateSig.cluster when the caller has it.
    retire:      (info) => logEvent({ type: "retire",      ...info }),
    recurring:   (info) => logEvent({ type: "recurring",   ...info }),
    reject:      (info) => logEvent({ type: "reject",      ...info }),
    agentRun:    (info) => logEvent({ type: "agent_run",   ...info }),
  };

  // ---- Derived stats -----------------------------------------------------

  function byCluster() {
    const map = new Map();
    for (const e of events) {
      const id = e.cluster || "unknown";
      if (!map.has(id)) map.set(id, { id, signature: e.signature || id, events: [] });
      const bucket = map.get(id);
      bucket.events.push(e);
      if (e.signature) bucket.signature = e.signature;
    }
    return map;
  }

  function clusterStats(seedClusters = []) {
    const live = byCluster();
    const seedById = new Map(seedClusters.map(c => [c.id, c]));
    const idsUnion = new Set([...seedById.keys(), ...live.keys()]);
    const out = [];
    for (const id of idsUnion) {
      const seed = seedById.get(id);
      const liveBucket = live.get(id);
      const evs = liveBucket ? liveBucket.events : [];
      const commits = evs.filter(e => e.type === "commit");
      const rejects = evs.filter(e => e.type === "frame_reject" || e.type === "reject");
      const predictedCommits = commits.filter(e => e.predicted);
      const refines = evs.filter(e => e.type === "lean");
      const retires = evs.filter(e => e.type === "retire");
      const recurrings = evs.filter(e => e.type === "recurring");
      const agentRuns = evs.filter(e => e.type === "agent_run");
      const edits = evs.filter(e => e.type === "edit");
      const gestures = evs.length;
      const predAcc = commits.length
        ? predictedCommits.length / commits.length
        : (seed ? seed.predAcc : 0);
      const rejectRate = gestures
        ? Math.round((rejects.length / gestures) * 100)
        : (seed ? seed.rejectRate : 0);
      const refineAvg = commits.length
        ? (refines.length / commits.length).toFixed(1) * 1
        : (seed ? seed.refineAvg : 0);
      out.push({
        id,
        label: (seed && seed.label) || id,
        signature: (liveBucket && liveBucket.signature) || (seed && seed.signature) || id,
        gestures: gestures || (seed ? seed.gestures : 0),
        rejectRate,
        refineAvg,
        predAcc: Number(predAcc.toFixed(2)),
        eligible: predAcc >= 0.9 && commits.length >= 5,
        fromLive: !!liveBucket,
        fromSeed: !!seed,
        commitCount: commits.length,
        predictedCommitCount: predictedCommits.length,
        retireCount:    retires.length,
        recurringCount: recurrings.length,
        rejectCount:    rejects.length,
        agentRunCount:  agentRuns.length,
        editCount:      edits.length,
      });
    }
    out.sort((a, b) => (b.gestures || 0) - (a.gestures || 0));
    return out;
  }

  function frameLog(seedFrameLog = []) {
    const live = events.filter(e => e.type === "frame_reject")
      .slice().reverse()
      .map(e => ({
        t: e.t.replace("T", " ").slice(0, 16),
        cluster: e.cluster || "unknown",
        rejected: e.rejected || e.originalFrame || "(previous frame)",
        replaced_with: e.text || e.replaced_with || "(user-supplied reframe)",
        weight: e.weight || "medium",
        fromLive: true,
      }));
    if (live.length) return live;
    return seedFrameLog.map(e => ({ ...e, fromLive: false }));
  }

  // Micro residue: the last N real gestures, richer than the side-rail log.
  function microResidue(limit = 40) {
    return events.slice(-limit).reverse().map(e => ({
      t: e.t.replace("T", " ").slice(0, 16),
      type: e.type,
      cluster: e.cluster,
      gridId: e.gridId,
      cellId: e.cellId,
      predicted: !!e.predicted,
      detail: e.detail || e.text || "",
    }));
  }

  // Prediction stats: accuracy = fraction of commits where predicted:true.
  // dailyAccuracy: last `days` days, each day an {date, commits, predicted, acc}.
  function predictionStats(days = 42) {
    const commits = events.filter(e => e.type === "commit");
    const total = commits.length;
    const predicted = commits.filter(c => c.predicted).length;
    const overallAcc = total ? predicted / total : 0;

    const daily = [];
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * dayMs);
      const y = d.toISOString().slice(0, 10);
      const inDay = commits.filter(c => c.t.slice(0, 10) === y);
      const pred = inDay.filter(c => c.predicted).length;
      daily.push({
        date: y,
        commits: inDay.length,
        predicted: pred,
        acc: inDay.length ? pred / inDay.length : null,
      });
    }

    return {
      totalCommits: total,
      predictedCommits: predicted,
      overallAcc,
      daily,
      frameRejectCount: events.filter(e => e.type === "frame_reject").length,
    };
  }

  // Voice patterns: stub for now. Real extraction will run an AI call
  // against accumulated edit-diffs. Returns seed if nothing learned yet.
  function voicePatterns(seed = []) {
    return seed.map(p => ({ ...p, fromLive: false }));
  }

  // ---- Admin -------------------------------------------------------------

  function reset() {
    events = [];
    saveEvents(events);
    notify();
  }
  function export_() {
    return JSON.stringify({ events }, null, 2);
  }
  function import_(json) {
    try {
      const obj = JSON.parse(json);
      if (Array.isArray(obj.events)) { events = obj.events; saveEvents(events); notify(); return true; }
    } catch {}
    return false;
  }

  return {
    log,
    events: () => events.slice(),
    clusterStats,
    frameLog,
    microResidue,
    predictionStats,
    voicePatterns,
    subscribe,
    reset,
    export: export_,
    import: import_,
  };
})();

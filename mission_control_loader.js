/* Comeketo Agent (personal) — Mission Control loader for the team's own bedrock.
   Personal shape: domain folders
   (projects/people/threads/commitments/knowledge) of loose JSON records,
   plus ledgers/{north_star,ratio_lattice}.json.

   Exposes:
     window.MissionControl        — normalized object (null before ready / on failure)
     window.MissionControlReady   — Promise<normalized | null>
     window.MissionControlStatus  — { state, warnings:[] }
   Dispatches "missioncontrol:loaded" / "missioncontrol:error" on window.
*/
(() => {
  const cfg = window.MissionControlConfig || {};
  const BASE = (cfg.base || "CCAgentindex").replace(/\/$/, "");

  const status = { state: "loading", warnings: [] };
  window.MissionControl = null;
  window.MissionControlStatus = status;

  async function fetchText(relPath, { optional = true } = {}) {
    const url = `${BASE}/${relPath}`;
    try {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) {
        if (optional) { status.warnings.push(`${relPath}: ${res.status}`); return null; }
        throw new Error(`${relPath}: HTTP ${res.status}`);
      }
      return await res.text();
    } catch (e) {
      if (optional) { status.warnings.push(`${relPath}: ${e.message}`); return null; }
      throw e;
    }
  }

  async function fJSON(p, opts) {
    const t = await fetchText(p, opts);
    if (t == null) return null;
    try { return JSON.parse(t); }
    catch (e) { status.warnings.push(`${p}: json parse ${e.message}`); return null; }
  }

  // Directory listing via index.json — a simple manifest the loader maintains.
  // If the manifest is empty, the domain is empty. Claude writes new records
  // by appending to index.json AND dropping the file in the subfolder.
  async function fDomain(name) {
    const index = await fJSON(`indexes/index.json`, { optional: true });
    const paths = (index && Array.isArray(index[name])) ? index[name] : [];
    if (!paths.length) return [];
    const records = await Promise.all(paths.map(p => fJSON(p, { optional: true })));
    return records.filter(Boolean);
  }

  // Base context: markdown files loaded with every AI call (identity, humor
  // palette, anything that's always-on). Listed under indexes/index.json "base".
  async function fBase() {
    const index = await fJSON(`indexes/index.json`, { optional: true });
    const paths = (index && Array.isArray(index.base)) ? index.base : [];
    if (!paths.length) return [];
    const results = await Promise.all(paths.map(async (p) => ({
      path: p,
      name: p.split("/").pop().replace(/\.md$/, ""),
      body: await fetchText(p, { optional: true }),
    })));
    return results.filter(b => b.body);
  }

  // Daily briefing — produced by the scheduled Oracle Sweep each morning.
  // The app asks the server /api/briefings for the list of files, picks
  // today's (or most recent if today hasn't run yet), and exposes both the
  // slug and the raw markdown body as MissionControl.dailyBriefing.
  //
  // This is the temporal foreground that sits on top of the static bedrock.
  // The AI prompt treats it as ahead-of-bedrock context — what moved
  // yesterday drives what matters today.
  async function fLatestBriefing() {
    try {
      const listRes = await fetch("/api/briefings", { cache: "no-cache" });
      if (!listRes.ok) return null;
      const list = await listRes.json();
      if (!list || !list.latest) {
        status.warnings.push("no daily briefings found — schedule the cowork task");
        return null;
      }
      // Prefer today's briefing if it exists; else the most recent one.
      const today = new Date().toISOString().slice(0, 10) + ".md";
      const pick = (Array.isArray(list.briefings) && list.briefings.includes(today)) ? today : list.latest;
      const slug = pick.replace(/\.md$/, "");
      const res = await fetch(`/api/briefings/${slug}`, { cache: "no-cache" });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.ok) return null;
      const isToday = pick === today;
      return {
        slug: data.slug,
        body: data.body,
        isToday,
        count: list.count,
        allSlugs: (list.briefings || []).map(s => s.replace(/\.md$/, "")),
      };
    } catch (e) {
      status.warnings.push(`briefings fetch failed: ${e.message}`);
      return null;
    }
  }

  // Real absolute paths from the server — browser can't inspect its own
  // filesystem, so the AI must be handed these or it will hallucinate
  // write targets (LegacyNext/..., Documents/Comeketo Agent/..., etc.).
  (async () => {
    try {
      const r = await fetch("/api/status");
      if (r.ok) {
        const s = await r.json();
        window.SecretaryEnv = {
          workspaceRoot: s.workspace_root || null,
          bedrockRoot:   s.bedrock_root   || null,
          piecesAvailable: !!s.pieces,
        };
      }
    } catch (_) { /* server might not be up yet — prompt will degrade */ }
  })();

  // Pieces LTM — the ambient-context feed. Every 10 min the browser fires
  // a delta sweep (since the last one recorded on the server ledger) so
  // nothing gets missed and the prompt stays fresh. A server-side background
  // thread also sweeps hourly so the ledger is complete even when the browser
  // is closed. Latest sweep lands on window.PiecesContext for ai_instructions.
  async function primePiecesFromLedger() {
    try {
      const r = await fetch("/api/pieces/sweeps/latest");
      if (!r.ok) return;
      const j = await r.json();
      if (j && j.ok && j.latest) {
        window.PiecesContext = {
          fetchedAt: j.latest.ts,
          raw: j.latest.raw || "",
          source: "server_ledger",
        };
      }
    } catch (_) {}
  }

  async function sweepPieces() {
    try {
      // Ask the server to fire a delta sweep. It handles the "since last"
      // framing internally and appends the new sweep to the ledger.
      const since = window.PiecesContext && window.PiecesContext.fetchedAt;
      const r = await fetch("/api/pieces/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ since: since || null }),
      });
      if (!r.ok) return;
      const j = await r.json();
      if (j && j.ok && j.sweep) {
        window.PiecesContext = {
          fetchedAt: j.sweep.ts,
          raw: j.sweep.raw || "",
          source: "browser_sweep",
        };
      }
    } catch (_) { /* best-effort — prompt degrades silently */ }
  }

  // Boot: prime from ledger so prompt is immediately populated, then sweep
  // to refresh, then poll every 10 minutes while the tab is open.
  (async () => {
    await primePiecesFromLedger();
    sweepPieces();
    setInterval(sweepPieces, 10 * 60 * 1000);
  })();

  window.MissionControlReady = (async () => {
    try {
      const [manifest, readme, northStar, ratioLattice,
             projects, people, threads, commitments, knowledge, base,
             dailyBriefing] = await Promise.all([
        fJSON("manifests/rebuild_manifest.json"),
        fetchText("summaries/README.md"),
        fJSON("ledgers/north_star.json"),
        fJSON("ledgers/ratio_lattice.json"),
        fDomain("projects"),
        fDomain("people"),
        fDomain("threads"),
        fDomain("commitments"),
        fDomain("knowledge"),
        fBase(),
        fLatestBriefing(),
      ]);

      const normalized = {
        owner: (manifest && manifest.owner) || "Comeketo team",
        shape: "personal",
        generatedAt: manifest && manifest.generated_at,
        base: BASE,
        counts: {
          projects: projects.length,
          people: people.length,
          threads: threads.length,
          commitments: commitments.length,
          knowledge: knowledge.length,
          // surfaces consistent with the sales-loader shape so the topbar reads fine
          leads: projects.length + people.length + threads.length,
          closeReferenceRows: 0,
          clickupTasks: 0,
          clickupRelevantTasks: 0,
          topLevelFiles: knowledge.length,
        },
        projects, people, threads, commitments, knowledge,
        base,
        dailyBriefing,
        northStar: northStar || { anchors: [] },
        ratioLattice: (ratioLattice && ratioLattice.entries) || [],
        rawManifest: manifest || {},
        readme: readme || "",
      };

      normalized.projectsById = Object.fromEntries(projects.map(p => [p.id, p]).filter(([k]) => k));
      normalized.peopleById   = Object.fromEntries(people.map(p => [p.id, p]).filter(([k]) => k));
      normalized.threadsById  = Object.fromEntries(threads.map(t => [t.id, t]).filter(([k]) => k));

      window.MissionControl = normalized;
      status.state = "ok";
      status.counts = normalized.counts;
      console.info("[MissionControl · personal] loaded", normalized.counts, "warnings:", status.warnings.length);
      window.dispatchEvent(new CustomEvent("missioncontrol:loaded", { detail: normalized }));
      return normalized;
    } catch (e) {
      status.state = "error";
      status.error = e.message || String(e);
      console.warn("[MissionControl · personal] load failed:", e);
      window.dispatchEvent(new CustomEvent("missioncontrol:error", { detail: e }));
      return null;
    }
  })();
})();

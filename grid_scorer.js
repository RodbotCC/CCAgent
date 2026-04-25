/* Comeketo Agent — Grid Scorer (Phase 1 of grid generation).

   The old flow: hand Mission Control to the LLM and say "propose 6 moves."
   Pure vibes. No provenance. No learning.

   The new flow, Phase 1 (this file): walk the bedrock deterministically,
   build a pool of candidate seeds from every reasonable source (North
   Star anchors, active projects, project blockers, owed people, waiting
   threads, briefing items, stale commitments), score each seed with a
   fixed formula, pick 6 diverse ones, and hand those to Phase 2 (the
   LLM) for expansion.

   Scoring formula (per seed):

     score =   anchor_alignment
             × recency_decay
             × briefing_boost
             × affinity_factor
             - staleness_penalty
             - duplicate_penalty

   Each factor is [0, 1] except the penalties which subtract [0, 0.5].

   Affinity is learned from the activity ledger:
     - a `commitment_created` or `commitment_sent` event whose
       `source.seed_source_type` matches a source_type bumps affinity
       for that type.
     - a `frame_reject` event dampens affinity for the types that were
       dominant in the rejected grid.

   Diversity: when picking the final 6, we spread across source_types
   (no more than 2 of any single type unless nothing else scores well).
*/
window.SecretaryScorer = (() => {

  // ─── Scoring helpers ────────────────────────────────────────────────

  // Exponential decay: 1.0 today, ~0.5 at half_days, ~0 at 5×half_days.
  function recencyDecay(iso, halfDays = 3) {
    if (!iso) return 0.6; // unknown — middling
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return 0.6;
      const ageDays = (Date.now() - d.getTime()) / 86400000;
      if (ageDays < 0) return 1;
      return Math.exp(-Math.LN2 * ageDays / halfDays);
    } catch { return 0.6; }
  }

  function staleness(iso, freshDays = 7) {
    if (!iso) return 0;
    try {
      const d = new Date(iso);
      const ageDays = (Date.now() - d.getTime()) / 86400000;
      if (ageDays <= freshDays) return 0;
      // Grows linearly past freshDays, capped at 0.4.
      return Math.min(0.4, (ageDays - freshDays) / 30);
    } catch { return 0; }
  }

  // How strongly does the briefing mention this id/name? Simple word match.
  function briefingBoost(briefingText, ...tokens) {
    if (!briefingText) return 0;
    const lower = String(briefingText).toLowerCase();
    let hits = 0;
    for (const t of tokens) {
      if (!t) continue;
      const s = String(t).toLowerCase().trim();
      if (!s || s.length < 3) continue;
      if (lower.includes(s)) hits++;
    }
    // 0 → 1.0 factor. 0 hits = 1.0 (neutral). 1 hit = 1.15. 2+ hits = 1.3.
    if (hits === 0) return 1.0;
    if (hits === 1) return 1.15;
    return 1.3;
  }

  // ─── Affinity learning ──────────────────────────────────────────────

  // Two separate signals are tracked:
  //
  //   byType — "the team commits to projects a lot" → bump the TYPE.
  //   byId   — per-source-id. COMMITS SHOULD DAMP the specific item
  //            for a short window (it was just handled, don't resurface
  //            it tomorrow). That's the opposite of type-level: a commit
  //            means "this one is cooked, pick something else next."
  //
  // Frame-rejects damp the type that dominated the rejected grid.
  function computeAffinity(ledgerEvents, now = Date.now()) {
    const byType = Object.create(null);
    const byId   = Object.create(null); // note: NEGATIVE for recently-handled ids
    const freshHandled = Object.create(null); // id → most recent commit timestamp
    for (const ev of (ledgerEvents || [])) {
      const kind = ev && ev.kind;
      if (!kind) continue;
      const ageDays = ev.t ? (now - new Date(ev.t).getTime()) / 86400000 : 30;
      const wType = Math.exp(-ageDays / 14); // 2-week half-life for TYPE affinity
      const wId   = Math.exp(-ageDays / 3);  // 3-day half-life for ID damping — fades faster

      if (kind === "commitment_created" || kind === "commitment_sent") {
        const st = ev.source && ev.source.seed_source_type;
        const si = ev.source && ev.source.seed_source_id;
        if (st) byType[st] = (byType[st] || 0) + 1.0 * wType;
        if (si) {
          // Damp specific id: subtract, so affinityFactor goes BELOW 1 for recently-handled items.
          byId[si] = (byId[si] || 0) - 1.5 * wId;
          const t = ev.t ? new Date(ev.t).getTime() : now;
          if (!freshHandled[si] || t > freshHandled[si]) freshHandled[si] = t;
        }
      }
      if (kind === "frame_reject" || kind === "grid_frame_reject") {
        const dominant = ev.source && ev.source.dominant_seed_type;
        if (dominant) byType[dominant] = (byType[dominant] || 0) - 0.7 * wType;
      }
    }
    return {
      by_source_type: byType,
      by_source_id:   byId,
      fresh_handled:  freshHandled, // timestamps of most recent commits per id
      computed_at:    new Date().toISOString(),
    };
  }

  // Turn raw affinity counts into factors. TYPE affinity stays in [0.6, 1.4].
  // ID affinity can drop as low as 0.15 (nearly excluded) for items handled
  // in the last few days — they need to EARN their way back onto the grid.
  function affinityFactor(affinity, source_type, source_id) {
    if (!affinity) return 1;
    const t = (affinity.by_source_type && affinity.by_source_type[source_type]) || 0;
    const i = (affinity.by_source_id   && affinity.by_source_id[source_id])     || 0;
    // Type factor: squash to [0.7, 1.4] — a type can be unfashionable but never zeroed.
    const typeFactor = Math.max(0.7, Math.min(1.4, 1 + Math.tanh(t / 3) * 0.4));
    // Id factor: can drop hard. Recent commit → id affinity is negative →
    // factor approaches 0.15 (nearly excluded). After ~3-4 days it decays
    // back near 1.0.
    const idFactor = Math.max(0.15, Math.min(1.2, 1 + Math.tanh(i / 1.5) * 0.6));
    return typeFactor * idFactor;
  }

  // ─── Seed builders — one per source type ────────────────────────────

  // North Stars are GRAVITY, not seeds. They pull other scores toward
  // their direction, but they rarely belong in a day's grid — a day is
  // about concrete next-moves, not "advance the timeless anchor."
  // We generate ONE very-damped north-star seed per anchor so that when
  // nothing else is going on, they can surface. Normal day → buried.
  function seedsFromNorthStars(mc, briefingText, affinity) {
    const anchors = (mc && mc.northStar && mc.northStar.anchors) || [];
    return anchors.map(a => {
      const weight = Math.max(0, Math.min(1, a.weight != null ? a.weight : 0.5));
      // ~0.35× the old alignment. A full-weight anchor (1.0) now scores
      // alignment 0.35 — below even a stale project.
      const alignment = weight * 0.35;
      const boost     = briefingBoost(briefingText, a.label, a.id);
      const aff       = affinityFactor(affinity, "north_star_anchor", "north_star/" + (a.id || a.label));
      const score = alignment * 1.0 * boost * aff;
      return {
        source_type: "north_star_anchor",
        source_id: "north_star/" + (a.id || a.label),
        headline_hint: `Advance "${a.label}"`,
        commit_kind_hint: "done",
        score,
        score_breakdown: { alignment, recency: 1.0, boost, affinity: aff, stale: 0, dup: 0 },
        anchor_refs: [a.id || a.label],
        payload: { anchor: a },
      };
    });
  }

  function seedsFromProjects(mc, briefingText, affinity) {
    const projects = (mc && mc.projects) || [];
    return projects.map(p => {
      const anchors = (mc.northStar && mc.northStar.anchors) || [];
      // Crude alignment: check project tags against anchor labels/ids.
      const tags = (p.tags || []).map(x => String(x).toLowerCase());
      let alignment = 0.35;
      for (const a of anchors) {
        const lbl = String(a.label || a.id || "").toLowerCase();
        if (tags.some(t => lbl.includes(t) || t.includes(lbl.split(" ")[0] || ""))) {
          alignment = Math.max(alignment, 0.6 + 0.3 * (a.weight || 0.5));
        }
      }
      const boost = briefingBoost(briefingText, p.name, p.id, p.next_move);
      const recency = recencyDecay(p.last_touched || p.updated_at, 7);
      const stale = staleness(p.last_touched || p.updated_at, 10);
      const aff = affinityFactor(affinity, "project", "project/" + (p.id || p.name));
      const score = alignment * recency * boost * aff - stale;
      return {
        source_type: "project",
        source_id: "project/" + (p.id || p.name),
        headline_hint: p.next_move
          ? `Next move on "${p.name}": ${p.next_move}`
          : `Advance project "${p.name}"`,
        commit_kind_hint: "done",
        score,
        score_breakdown: { alignment, recency, boost, affinity: aff, stale, dup: 0 },
        anchor_refs: [],
        payload: { project: p },
      };
    });
  }

  function seedsFromProjectBlockers(mc, briefingText, affinity) {
    const seeds = [];
    for (const p of (mc.projects || [])) {
      for (const b of (p.blockers || [])) {
        const blockerText = typeof b === "string" ? b : (b.description || b.name || JSON.stringify(b));
        const boost = briefingBoost(briefingText, blockerText, p.name);
        const aff = affinityFactor(affinity, "project_blocker", "project/" + (p.id || p.name));
        const score = 0.7 * 1.0 * boost * aff; // blockers are always relevant when present
        seeds.push({
          source_type: "project_blocker",
          source_id: "project/" + (p.id || p.name) + "/blocker",
          headline_hint: `Unblock "${p.name}": ${blockerText}`,
          commit_kind_hint: "done",
          score,
          score_breakdown: { alignment: 0.7, recency: 1.0, boost, affinity: aff, stale: 0, dup: 0 },
          anchor_refs: [],
          payload: { project: p, blocker: b },
        });
      }
    }
    return seeds;
  }

  function seedsFromOwedPeople(mc, briefingText, affinity) {
    const people = (mc && mc.people) || [];
    return people.filter(p => p.owed_response).map(p => {
      const w = Math.max(0, Math.min(1, p.relationship_weight != null ? p.relationship_weight : 0.5));
      const alignment = 0.55 + 0.3 * w;
      const recency = recencyDecay(p.last_contact, 5);
      const boost = briefingBoost(briefingText, p.name, p.id);
      const aff = affinityFactor(affinity, "person_owed", "person/" + (p.id || p.name));
      const stale = staleness(p.last_contact, 3);
      const score = alignment * recency * boost * aff - stale;
      return {
        source_type: "person_owed",
        source_id: "person/" + (p.id || p.name),
        headline_hint: `Reply to ${p.name}`,
        commit_kind_hint: "send",
        score,
        score_breakdown: { alignment, recency, boost, affinity: aff, stale, dup: 0 },
        anchor_refs: [],
        payload: { person: p },
      };
    });
  }

  function seedsFromThreads(mc, briefingText, affinity) {
    const threads = (mc && mc.threads) || [];
    return threads.map(th => {
      const alignment = th.waiting_on ? 0.5 : 0.45;
      const recency = recencyDecay(th.last_touched, 4);
      const boost = briefingBoost(briefingText, th.subject, th.id, th.waiting_on);
      const aff = affinityFactor(affinity, "thread", "thread/" + (th.id || th.subject));
      const stale = staleness(th.last_touched, 5);
      const score = alignment * recency * boost * aff - stale;
      return {
        source_type: "thread",
        source_id: "thread/" + (th.id || th.subject),
        headline_hint: th.waiting_on
          ? `Close thread: ${th.subject} (waiting on ${th.waiting_on})`
          : `Move thread: ${th.subject}`,
        commit_kind_hint: "send",
        score,
        score_breakdown: { alignment, recency, boost, affinity: aff, stale, dup: 0 },
        anchor_refs: [],
        payload: { thread: th },
      };
    });
  }

  // Seeds derived from Rodbot's active memory of the last ~48h. Her
  // memory.jsonl captures what the team and she have been DISCUSSING and
  // what moved on the ledger. An actionable memory is the purest signal
  // of "this is what's on the team's mind RIGHT NOW" — ranked above every
  // other source type.
  function seedsFromRodbotMemory(mc, briefingText, affinity, rodbotMemories) {
    if (!Array.isArray(rodbotMemories) || !rodbotMemories.length) return [];
    const now = Date.now();
    const seeds = [];
    for (const m of rodbotMemories) {
      if (!m || !m.summary) continue;
      const ageHours = m.t ? (now - new Date(m.t).getTime()) / 3600000 : 72;
      if (ageHours > 72) continue; // only last 72h memories count
      // Alignment = her importance score, already 0.5-1.0 for memories
      // that crossed the threshold. Actionable memories get a flat boost.
      const importance = Number.isFinite(m.importance) ? m.importance : 0.6;
      const alignment  = Math.min(1.0, importance + (m.actionable ? 0.2 : 0));
      // Fast recency decay — conversation stuff goes stale in days.
      const recency    = Math.exp(-ageHours / 24); // 24h half-life
      const boost      = 1.0; // don't double-count: memories are already briefing-aware
      const id         = "rodbot/" + (m.id || m.reflection_id || String(m.t));
      const aff        = affinityFactor(affinity, "rodbot_memory", id);
      const score      = alignment * recency * boost * aff;
      seeds.push({
        source_type: "rodbot_memory",
        source_id:   id,
        headline_hint: m.action_hint || m.summary,
        commit_kind_hint: m.actionable ? "done" : "done",
        score,
        score_breakdown: { alignment, recency, boost, affinity: aff, stale: 0, dup: 0 },
        anchor_refs: [],
        payload: { memory: m },
      });
    }
    return seeds;
  }

  // Recent chat reflections that flagged actionable — similar signal to
  // rodbot_memory but pulls from the chat-specific reflection ledger so
  // we catch things that didn't quite cross the memory importance bar
  // but ARE still something the team talked about in the last day.
  function seedsFromChatReflections(mc, briefingText, affinity, chatReflections) {
    if (!Array.isArray(chatReflections) || !chatReflections.length) return [];
    const now = Date.now();
    const seeds = [];
    for (const r of chatReflections) {
      if (!r || !r.actionable) continue;
      const when = r.t || r.generated_at;
      const ageHours = when ? (now - new Date(when).getTime()) / 3600000 : 48;
      if (ageHours > 48) continue;
      const alignment = 0.9; // chat actionables are nearly always day-priority
      const recency   = Math.exp(-ageHours / 18); // 18h half-life
      const boost     = 1.1;
      const hint      = r.action_hint || r.summary || "";
      if (!hint) continue;
      const id        = "chat_ref/" + (r.chat_id || "x") + "/" + (r.t || Math.random().toString(36).slice(2,8));
      const aff       = affinityFactor(affinity, "chat_reflection", id);
      const score     = alignment * recency * boost * aff;
      seeds.push({
        source_type: "chat_reflection",
        source_id:   id,
        headline_hint: hint,
        commit_kind_hint: "done",
        score,
        score_breakdown: { alignment, recency, boost, affinity: aff, stale: 0, dup: 0 },
        anchor_refs: [],
        payload: { reflection: r },
      });
    }
    return seeds;
  }

  // ─── Project momentum & task-level completion scoring ────────────────
  //
  // These are computed client-side, once per generation, from the full
  // project JSONs. The scorer uses two signals:
  //
  //   momentum_boost — a phase with recent task completions is "hot".
  //                    Score its open tasks higher. A phase that's
  //                    stalled (no completions in 14+ days) gets damped.
  //
  //   abandonment_damp — a specific task that's been open for >14 days
  //                     with no activity is probably not a real task
  //                     anymore (the team moved on). Damp its score hard.
  //
  // These complement the id-level affinity damping (which handles the
  // "just handled, don't resurface tomorrow" case).

  function computeProjectMomentum(project, now = Date.now()) {
    // Walk all tasks with completed_at timestamps; bucket by project and phase.
    const phaseCompletions = Object.create(null); // phaseId → [ageDays,...]
    let totalDone = 0, totalOpen = 0;
    let lastCompletionT = 0;
    for (const ph of (project.phases || [])) {
      const arr = [];
      for (const d of (ph.deliverables || [])) {
        for (const t of (d.tasks || [])) {
          if (t.state === "done") {
            totalDone++;
            if (t.completed_at) {
              const ageDays = (now - new Date(t.completed_at).getTime()) / 86400000;
              arr.push(ageDays);
              if (new Date(t.completed_at).getTime() > lastCompletionT) {
                lastCompletionT = new Date(t.completed_at).getTime();
              }
            }
          } else {
            totalOpen++;
          }
        }
      }
      phaseCompletions[ph.id || ph.title] = arr;
    }
    // Project-level momentum: sum of exp-decayed completions, 7-day half-life.
    let momentum = 0;
    for (const phaseKey of Object.keys(phaseCompletions)) {
      for (const ageDays of phaseCompletions[phaseKey]) {
        momentum += Math.exp(-Math.LN2 * ageDays / 7);
      }
    }
    const daysSinceLastCompletion = lastCompletionT ? (now - lastCompletionT) / 86400000 : Infinity;
    return {
      momentum_score: momentum,
      days_since_last_completion: daysSinceLastCompletion,
      tasks_done: totalDone,
      tasks_open: totalOpen,
      progress_pct: (totalDone + totalOpen) ? totalDone / (totalDone + totalOpen) : 0,
      phase_completions: phaseCompletions,
    };
  }

  function computePhaseMomentum(phase, now = Date.now()) {
    let recent = 0;
    let totalDone = 0, totalOpen = 0;
    for (const d of (phase.deliverables || [])) {
      for (const t of (d.tasks || [])) {
        if (t.state === "done") {
          totalDone++;
          if (t.completed_at) {
            const ageDays = (now - new Date(t.completed_at).getTime()) / 86400000;
            recent += Math.exp(-Math.LN2 * ageDays / 5); // 5-day half-life at phase level
          }
        } else totalOpen++;
      }
    }
    return {
      recent_completions: recent,
      tasks_done: totalDone,
      tasks_open: totalOpen,
      progress_pct: (totalDone + totalOpen) ? totalDone / (totalDone + totalOpen) : 0,
    };
  }

  // Seeds from the new project task tree. Each open task in an ACTIVE
  // phase is a candidate. Scoring now includes MOMENTUM and ABANDONMENT:
  //
  //   - momentum_boost factor: 1.0 + 0.15 * tanh(phase_recent_completions / 3)
  //     A phase with 3+ recent completions → full boost. A dead phase → no boost.
  //   - abandonment_damp: tasks open >14d get their score multiplied by a
  //     decaying factor (drops to 0.3 at 45 days).
  function seedsFromProjectTasks(mc, briefingText, affinity, projects, now = Date.now()) {
    if (!Array.isArray(projects)) return [];
    const seeds = [];
    for (const proj of projects) {
      const projMomentum = computeProjectMomentum(proj, now);
      for (const ph of (proj.phases || [])) {
        if (!ph || ph.state === "done" || ph.state === "blocked") continue;
        const phaseActive = ph.state === "active" || !ph.state;
        const phMomentum = computePhaseMomentum(ph, now);
        // Phase-level boost: hot phases score higher.
        const momentumBoost = 1.0 + 0.25 * Math.tanh(phMomentum.recent_completions / 3);
        for (const d of (ph.deliverables || [])) {
          if (!d || d.state === "done") continue;
          for (const t of (d.tasks || [])) {
            if (!t || t.state === "done") continue;
            const title = String(t.title || "").trim();
            if (!title) continue;
            const alignment = 0.85 + (phaseActive ? 0.15 : 0);
            const recency   = recencyDecay(t.created_at || d.started_at || ph.started_at, 5);
            const boost     = briefingBoost(briefingText, proj.name, ph.title, title) * momentumBoost;
            const id        = `project_task/${proj.id}/${t.id || t.title}`;
            const aff       = affinityFactor(affinity, "project_task", id);

            // Abandonment damp: tasks that have been open for a long time
            // with no completion activity on them (or their phase) lose
            // priority fast. Something the team actually wants to do gets
            // checked off or at least nudged.
            let ageDays = 0;
            if (t.created_at) ageDays = (now - new Date(t.created_at).getTime()) / 86400000;
            let abandonmentDamp = 1.0;
            if (ageDays > 14) {
              // 1.0 at 14 days, 0.3 at 45 days, decays from there.
              abandonmentDamp = Math.max(0.2, 1.0 - 0.7 * Math.min(1, (ageDays - 14) / 31));
            }

            const score = alignment * recency * boost * aff * abandonmentDamp;

            seeds.push({
              source_type: "project_task",
              source_id:   id,
              headline_hint: title,
              commit_kind_hint: "done",
              score,
              score_breakdown: {
                alignment, recency, boost, affinity: aff,
                stale: 0, dup: 0,
                momentum: momentumBoost,
                abandonment: abandonmentDamp,
              },
              anchor_refs: proj.north_star_refs || [],
              payload: {
                task: t,
                deliverable: { id: d.id, title: d.title },
                phase: { id: ph.id, title: ph.title, state: ph.state, progress_pct: phMomentum.progress_pct },
                project: { id: proj.id, name: proj.name, momentum: projMomentum.momentum_score, progress_pct: projMomentum.progress_pct },
              },
            });
          }
        }
      }
    }
    return seeds;
  }

  function seedsFromBriefing(mc, briefingText, affinity) {
    if (!briefingText) return [];
    // Parse out bullet-like lines from the briefing — "what needs the team today".
    const lines = briefingText
      .split(/\n/)
      .map(l => l.trim())
      .filter(l => /^[-*•]\s+/.test(l) || /^\d+\.\s+/.test(l))
      .map(l => l.replace(/^[-*•\d.]+\s+/, ""));
    return lines.slice(0, 10).map((line, i) => {
      const aff = affinityFactor(affinity, "briefing_item", `briefing/line_${i}`);
      const score = 0.75 * 1.0 * 1.2 * aff; // briefing items are always briefing-boosted
      return {
        source_type: "briefing_item",
        source_id: `briefing/line_${i}`,
        headline_hint: line,
        commit_kind_hint: "done",
        score,
        score_breakdown: { alignment: 0.75, recency: 1.0, boost: 1.2, affinity: aff, stale: 0, dup: 0 },
        anchor_refs: [],
        payload: { briefing_line: line },
      };
    });
  }

  function seedsFromCommitments(mc, briefingText, affinity) {
    const cs = (mc && mc.commitments) || [];
    const now = Date.now();
    return cs.filter(c => c.status !== "done" && c.status !== "canceled").map(c => {
      let alignment = 0.55;
      const due = c.due ? new Date(c.due).getTime() : null;
      let overdueBoost = 1.0;
      if (due) {
        const daysLeft = (due - now) / 86400000;
        if (daysLeft < 0) overdueBoost = 1.35;      // overdue
        else if (daysLeft < 2) overdueBoost = 1.20; // due soon
      }
      const boost = briefingBoost(briefingText, c.label, c.to) * overdueBoost;
      const aff = affinityFactor(affinity, "commitment", "commitment/" + (c.id || c.label));
      const score = alignment * 1.0 * boost * aff;
      return {
        source_type: "commitment",
        source_id: "commitment/" + (c.id || c.label),
        headline_hint: `Keep commitment: ${c.label}${c.to ? ` (→ ${c.to})` : ""}`,
        commit_kind_hint: c.to ? "send" : "done",
        score,
        score_breakdown: { alignment, recency: 1.0, boost, affinity: aff, stale: 0, dup: 0 },
        anchor_refs: [],
        payload: { commitment: c },
      };
    });
  }

  // ─── Diversity selection ───────────────────────────────────────────

  // Per-type caps for the first pass. Day-to-day signals can take multiple
  // slots; North Stars are hard-capped at 1 because a day's grid shouldn't
  // be a meditation on timeless anchors.
  const TYPE_CAPS = {
    rodbot_memory:     3,
    chat_reflection:   3,
    project_task:      4, // tasks are the real day-to-day — let them dominate
    briefing_item:     2,
    person_owed:       2,
    commitment:        2,
    thread:            2,
    project_blocker:   2,
    project:           1, // project-as-seed is coarse; prefer its tasks
    north_star_anchor: 1,
  };

  function pickDiverse(seeds, n = 6) {
    const sorted = seeds.slice().sort((a, b) => b.score - a.score);
    const chosen = [];
    const typeCounts = Object.create(null);
    for (const s of sorted) {
      if (chosen.length >= n) break;
      const cap = TYPE_CAPS[s.source_type] != null ? TYPE_CAPS[s.source_type] : 2;
      const c = typeCounts[s.source_type] || 0;
      if (c < cap) {
        chosen.push(s);
        typeCounts[s.source_type] = c + 1;
      }
    }
    // If we didn't fill N, relax caps and fill from leftovers — but still
    // respect the North Star cap of 1 so a thin day doesn't become 6 anchors.
    if (chosen.length < n) {
      const chosenIds = new Set(chosen.map(s => s.source_id));
      for (const s of sorted) {
        if (chosen.length >= n) break;
        if (chosenIds.has(s.source_id)) continue;
        if (s.source_type === "north_star_anchor" && (typeCounts.north_star_anchor || 0) >= 1) continue;
        chosen.push(s);
        typeCounts[s.source_type] = (typeCounts[s.source_type] || 0) + 1;
      }
    }
    return chosen;
  }

  // ─── Public API ─────────────────────────────────────────────────────

  function buildSeeds({ mc, briefingText, affinity, rodbotMemories, chatReflections, projectsFull }) {
    const pool = [
      // Day-to-day signals — weighted toward the top.
      ...seedsFromRodbotMemory(mc, briefingText, affinity, rodbotMemories),
      ...seedsFromChatReflections(mc, briefingText, affinity, chatReflections),
      ...seedsFromProjectTasks(mc, briefingText, affinity, projectsFull),
      ...seedsFromBriefing(mc, briefingText, affinity),
      ...seedsFromOwedPeople(mc, briefingText, affinity),
      ...seedsFromCommitments(mc, briefingText, affinity),
      ...seedsFromThreads(mc, briefingText, affinity),
      ...seedsFromProjectBlockers(mc, briefingText, affinity),
      ...seedsFromProjects(mc, briefingText, affinity),
      // Gravity — damped, rarely surfaces unless nothing else is lit up.
      ...seedsFromNorthStars(mc, briefingText, affinity),
    ];
    // Soft dedupe: collapse seeds with identical source_id, keep the higher score.
    const byId = new Map();
    for (const s of pool) {
      const prior = byId.get(s.source_id);
      if (!prior || s.score > prior.score) byId.set(s.source_id, s);
    }
    return Array.from(byId.values());
  }

  // Read the live commitment queue from localStorage so we don't
  // re-surface things the team has already committed to and is working on
  // (even if the bedrock file hasn't been swept yet).
  function liveCommitmentSourceIds() {
    try {
      const raw = localStorage.getItem("secretary.commitments");
      if (!raw) return new Set();
      const list = JSON.parse(raw);
      const ids = new Set();
      for (const c of (list || [])) {
        // Live items that are still in-play (not canceled/failed) count as "handled recently".
        if (!c || !c.status) continue;
        if (c.status === "canceled" || c.status === "failed") continue;
        const sid = c.source && c.source.seed_source_id;
        if (sid) ids.add(sid);
      }
      return ids;
    } catch { return new Set(); }
  }

  async function loadRodbotMemories() {
    try {
      const res = await fetch("/api/rodbot/memory?limit=50", { cache: "no-cache" });
      if (!res.ok) return [];
      const j = await res.json();
      return j.memories || [];
    } catch { return []; }
  }

  async function loadChatReflections() {
    try {
      const res = await fetch("/api/ledger/chat_reflections", { cache: "no-cache" });
      if (!res.ok) return [];
      const j = await res.json();
      return j.events || [];
    } catch { return []; }
  }

  // Load full project JSONs (phases + tasks). /api/projects gives us a
  // lightweight list; we fan out fetches for the details we need.
  async function loadProjectsFull() {
    try {
      const res = await fetch("/api/projects", { cache: "no-cache" });
      if (!res.ok) return [];
      const j = await res.json();
      const list = j.projects || [];
      const activeish = list.filter(p => p.open_task_count > 0 || (p.status || "").match(/active|doing|wip|live|in[- ]progress/i));
      // Fetch full bodies only for projects that look actionable.
      const details = await Promise.all(activeish.map(async p => {
        try {
          const r = await fetch(`/api/projects/${encodeURIComponent(p.id)}`, { cache: "no-cache" });
          if (!r.ok) return null;
          const j2 = await r.json();
          return j2.project || null;
        } catch { return null; }
      }));
      return details.filter(Boolean);
    } catch { return []; }
  }

  // Main entry. Loads affinity + memory + chat reflections, builds the pool,
  // filters out items already in the live queue, picks diverse top 6.
  async function scoreSeeds({ n = 6, mc, briefingText } = {}) {
    mc = mc || window.MissionControl || null;
    if (!mc) return { seeds: [], pool: [], affinity: null };
    if (briefingText == null) {
      briefingText = (mc.dailyBriefing && mc.dailyBriefing.body) || "";
    }
    const [affinity, rodbotMemories, chatReflections, projectsFull] = await Promise.all([
      loadAffinity(),
      loadRodbotMemories(),
      loadChatReflections(),
      loadProjectsFull(),
    ]);
    const pool = buildSeeds({ mc, briefingText, affinity, rodbotMemories, chatReflections, projectsFull });

    // Exclude items already in the team's live commitment queue — he's
    // already said "yes, I'm handling that." Surfacing it again wastes
    // a slot.
    const liveIds = liveCommitmentSourceIds();
    const filtered = pool.filter(s => !liveIds.has(s.source_id));

    const seeds = pickDiverse(filtered, n, 2);
    return { seeds, pool: filtered, affinity, live_excluded: liveIds.size };
  }

  // ─── Affinity persistence ──────────────────────────────────────────

  async function loadAffinity() {
    try {
      const res = await fetch("/api/grid_affinity", { cache: "no-cache" });
      if (!res.ok) return null;
      const j = await res.json();
      return j.affinity || null;
    } catch { return null; }
  }

  async function saveAffinity(affinity) {
    try {
      await fetch("/api/grid_affinity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(affinity),
      });
    } catch {}
  }

  // Recompute affinity from scratch by walking the activity ledger. Called
  // after commits / frame-rejects so next generation reflects the latest.
  async function refreshAffinityFromLedger() {
    if (!window.SecretaryLedger) return null;
    const events = await window.SecretaryLedger.read();
    const a = computeAffinity(events);
    await saveAffinity(a);
    return a;
  }

  return {
    scoreSeeds, buildSeeds, pickDiverse,
    computeAffinity, loadAffinity, saveAffinity, refreshAffinityFromLedger,
    computeProjectMomentum, computePhaseMomentum,
    affinityFactor, recencyDecay, staleness, briefingBoost,
  };
})();

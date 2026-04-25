/* Comeketo Agent — AI actions: generate / regenerate / refine grids via OpenAI Responses.

   All functions return normalized grid objects matching data.js's shape:
     { id, title, context, frameType, frameNote, cells: { "01".."06": cell } }
   where each cell is:
     { kind, headline, preview, detail, commit:{kind,label,target?}, refine, predicted }

   Input to the model is freeform; the model is asked to return strict JSON.
   Parsing is defensive: finds first balanced JSON object in the reply and
   fills any missing cells with abstention placeholders.
*/
window.SecretaryActions = (() => {
  const CELL_SCHEMA_DESC = `
Cell schema:
  {
    "kind":     "candidate" | "hybrid" | "plus",
    "headline": string (short — ≤ 7 words, the move itself, in Rodbot's voice),
    "preview":  string (≤ 2 lines, concrete, names + numbers from bedrock),
    "detail":   string (3–8 lines, the full expansion for the fullscreen view — real substance, no filler),
    "commit":   { "kind": "send"|"schedule"|"open"|"done", "label": string, "target"?: string },
    "refine":   null,
    "predicted": boolean,
    "seed_index": integer (0-5, the SEED_INDEX you expanded — required so we can trace provenance)
  }

Grid schema:
  {
    "title":     string (the actual question these 6 moves answer, ≤ 14 words — derived from what the seeds collectively suggest the team should be deciding right now, not a generic framing),
    "context":   string (short state signature),
    "frameType": "disjunctive" | "non-disjunctive",
    "frameNote": string (≤ 6 words — tells the team what kind of decision this is),
    "cells":     { "01": cell, "02": cell, "03": cell, "04": cell, "05": cell, "06": cell }
  }

Rules:
- You are being handed 6 pre-scored SEEDS below. Each cell you produce
  EXPANDS one seed — the cell's seed_index field says which. Don't
  invent cells from thin air; don't drop seeds. If a seed is weak, say
  so in the preview rather than fabricating.
- Put at least one "hybrid" (a cell that unifies two of the seeds into
  one move) and at least one "plus" (the seed the score ranked lowest
  but which deserves a moment of attention — the contrarian slot).
  Mark those cells with kind accordingly.
- Exactly ONE cell has "predicted": true — the highest-leverage move.
- Use real names and numbers from the seeds. Never invent people.
- If the seed pool is too thin for a confident grid, return {"abstain": true, "reason": "..."}.
- Return JSON ONLY — no prose before or after.
`.trim();

  // ---- JSON extraction (defensive) ---------------------------------------

  function extractJSON(text) {
    if (!text) return null;
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const body = fence ? fence[1] : text;
    // Find first balanced {...} block.
    let depth = 0, start = -1;
    for (let i = 0; i < body.length; i++) {
      const ch = body[i];
      if (ch === "{") { if (depth === 0) start = i; depth++; }
      else if (ch === "}") {
        depth--;
        if (depth === 0 && start >= 0) {
          const candidate = body.slice(start, i + 1);
          try { return JSON.parse(candidate); } catch {}
          start = -1;
        }
      }
    }
    return null;
  }

  function placeholderCell(reason = "no candidate") {
    return {
      kind: "candidate",
      headline: "— abstain —",
      preview: reason,
      detail: `Θ · the AI abstained from this slot.\n\nreason: ${reason}`,
      commit: { kind: "done", label: "Mark abstain" },
      refine: null,
      predicted: false,
    };
  }

  function normalizeCell(c, seedForIndex) {
    if (!c || typeof c !== "object") return placeholderCell("missing");
    const commit = (c.commit && typeof c.commit === "object") ? c.commit : { kind: "done", label: "Commit" };
    const seedIdx = Number.isInteger(c.seed_index) ? c.seed_index : null;
    const seed = seedIdx != null && seedForIndex ? seedForIndex(seedIdx) : null;
    return {
      kind: ["candidate", "hybrid", "plus"].includes(c.kind) ? c.kind : "candidate",
      headline: String(c.headline || "").trim() || "— untitled —",
      preview: String(c.preview || "").trim(),
      detail: String(c.detail || "").trim(),
      commit: {
        kind: ["send", "schedule", "open", "open_url", "done"].includes(commit.kind) ? commit.kind : "done",
        label: String(commit.label || "Commit"),
        ...(commit.target ? { target: String(commit.target) } : {}),
      },
      refine: c.refine || null,
      predicted: !!c.predicted,
      // Provenance: which seed did this cell expand, and how did it score?
      seed: seed ? {
        source_type: seed.source_type,
        source_id:   seed.source_id,
        score:       Number(seed.score.toFixed(3)),
        breakdown:   seed.score_breakdown,
        anchor_refs: seed.anchor_refs || [],
      } : null,
    };
  }

  function normalizeGrid(gridId, parsed, seedsArr) {
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.abstain) return { abstain: true, reason: parsed.reason || "unspecified" };
    const srcCells = parsed.cells || {};
    const cells = {};
    const ids = ["01", "02", "03", "04", "05", "06"];
    const seedForIndex = seedsArr ? (i) => seedsArr[i] || null : null;
    let predictedCount = 0;
    ids.forEach(id => {
      const nc = normalizeCell(srcCells[id], seedForIndex);
      if (nc.predicted) predictedCount++;
      cells[id] = nc;
    });
    // Ensure exactly one predicted.
    if (predictedCount === 0) cells["01"].predicted = true;
    else if (predictedCount > 1) {
      let kept = false;
      ids.forEach(id => {
        if (cells[id].predicted) {
          if (kept) cells[id].predicted = false;
          else kept = true;
        }
      });
    }
    return {
      id: gridId,
      title: String(parsed.title || "Generated grid").trim(),
      context: String(parsed.context || "ai · generated").trim(),
      frameType: parsed.frameType === "non-disjunctive" ? "non-disjunctive" : "disjunctive",
      frameNote: String(parsed.frameNote || "ai generated").trim(),
      cells,
      _aiGenerated: true,
      _generatedAt: new Date().toISOString(),
      _seeds: seedsArr || null, // full seed provenance for debugging / UI
    };
  }

  // ---- prompts ------------------------------------------------------------

  // Render the scored seed pool for the prompt. Each seed gets a short
  // block with an index (so cells can reference it), score, breakdown,
  // and the key payload fields the model needs to write a concrete cell.
  function renderSeed(s, i) {
    const p = s.payload || {};
    const bits = [];
    bits.push(`SEED_INDEX ${i}  · score ${s.score.toFixed(3)}  · source ${s.source_type}`);
    bits.push(`  breakdown: alignment=${s.score_breakdown.alignment.toFixed(2)}, recency=${s.score_breakdown.recency.toFixed(2)}, boost=${s.score_breakdown.boost.toFixed(2)}, affinity=${s.score_breakdown.affinity.toFixed(2)}${s.score_breakdown.stale ? `, stale=-${s.score_breakdown.stale.toFixed(2)}` : ""}`);
    bits.push(`  headline hint: ${s.headline_hint}`);
    bits.push(`  suggested commit kind: ${s.commit_kind_hint}`);
    if (p.memory) {
      bits.push(`  from your memory (logged ${p.memory.t}):`);
      bits.push(`    ${p.memory.summary}`);
      if (p.memory.action_hint) bits.push(`    → ${p.memory.action_hint}`);
      if (p.memory.tags && p.memory.tags.length) bits.push(`    tags: ${p.memory.tags.slice(0,5).join(", ")}`);
    } else if (p.reflection) {
      bits.push(`  from a recent chat with the team:`);
      if (p.reflection.summary) bits.push(`    ${p.reflection.summary}`);
      if (p.reflection.action_hint) bits.push(`    → ${p.reflection.action_hint}`);
    } else if (p.anchor) {
      bits.push(`  anchor: "${p.anchor.label}" (weight ${p.anchor.weight}${p.anchor.why ? `, ${p.anchor.why}` : ""})`);
      bits.push(`  NOTE: north-star anchors are GRAVITY, not day-to-day moves. Only expand this if nothing else on the list is concrete enough.`);
    } else if (p.project) {
      bits.push(`  project: ${p.project.name}${p.project.status ? ` · ${p.project.status}` : ""}`);
      if (p.project.next_move) bits.push(`  next_move: ${p.project.next_move}`);
      if (p.blocker) bits.push(`  blocker: ${typeof p.blocker === "string" ? p.blocker : (p.blocker.description || p.blocker.name || "(blocker)")}`);
    } else if (p.person) {
      bits.push(`  person: ${p.person.name}${p.person.role ? ` · ${p.person.role}` : ""}`);
      if (p.person.last_contact) bits.push(`  last_contact: ${p.person.last_contact}`);
      if (p.person.relationship_weight != null) bits.push(`  rw: ${p.person.relationship_weight}`);
    } else if (p.thread) {
      bits.push(`  thread: ${p.thread.subject}${p.thread.channel ? ` [${p.thread.channel}]` : ""}`);
      if (p.thread.waiting_on) bits.push(`  waiting_on: ${p.thread.waiting_on}`);
    } else if (p.commitment) {
      bits.push(`  commitment: ${p.commitment.label}${p.commitment.to ? ` → ${p.commitment.to}` : ""}${p.commitment.due ? ` · due ${p.commitment.due}` : ""}`);
      if (p.commitment.why) bits.push(`  why: ${p.commitment.why}`);
    } else if (p.briefing_line) {
      bits.push(`  briefing_line: ${p.briefing_line}`);
    }
    return bits.join("\n");
  }

  function buildGenerateInput({ gridId, intent, userFrame, seedGrid, seeds }) {
    const parts = [];
    parts.push(`TASK: expand the 6 pre-scored SEEDS below into a grid of 6 concrete next-moves.`);
    parts.push(``);
    parts.push(`PRIORITY ORIENTATION — read this before you write anything:`);
    parts.push(`Your job is NOT to point the team at grand long-term projects or`);
    parts.push(`far-out north-star meditation. Your job is to surface the`);
    parts.push(`concrete, day-to-day things he's actually been discussing with`);
    parts.push(`you lately — Comeketo client work, replies he owes, an errand`);
    parts.push(`for his dad, cleaning his room, small additions to this app,`);
    parts.push(`things in his briefing that matter TODAY.`);
    parts.push(``);
    parts.push(`The seeds are already sorted by priority. Seeds from "from our`);
    parts.push(`chats" and "you mentioned" are the HIGHEST signal — those are`);
    parts.push(`things the team has actually raised. Expand those first. North-star`);
    parts.push(`anchors are at the bottom and should almost never be expanded`);
    parts.push(`unless everything else is flat.`);
    parts.push(``);
    parts.push(`Each cell corresponds to one seed. The cell's "seed_index"`);
    parts.push(`field references which seed you expanded (0-5). You don't`);
    parts.push(`invent cells from nowhere — you take the seeds Phase 1 scored`);
    parts.push(`and write them in your voice with concrete substance.`);
    parts.push(``);
    parts.push(`Derive the grid TITLE from what the seeds collectively ask —`);
    parts.push(`a real, specific question, not a generic "what moves the team`);
    parts.push(`forward today?" framing. If the top seeds are about Comeketo,`);
    parts.push(`let the title reflect that. If they're about errands, let it`);
    parts.push(`reflect that. Match the altitude of the actual seeds.`);
    parts.push(``);
    parts.push(`GRID ID: "${gridId}"`);
    if (intent) parts.push(`INTENT: ${intent}`);
    if (userFrame) parts.push(`OPERATOR FRAME-REJECT (the team said the correct question was): "${userFrame}" — honor this reframe when writing the title, but still expand the same 6 seeds.`);
    if (seedGrid) {
      parts.push(`PRIOR GRID (for continuity — don't copy):`);
      parts.push(`  title: ${seedGrid.title}`);
      parts.push(`  context: ${seedGrid.context}`);
    }
    parts.push(``);
    parts.push(`──────── SEED POOL (${(seeds || []).length} seeds, ordered by score) ────────`);
    (seeds || []).forEach((s, i) => {
      parts.push("");
      parts.push(renderSeed(s, i));
    });
    parts.push(``);
    parts.push(`──────── OUTPUT ────────`);
    parts.push(CELL_SCHEMA_DESC);
    return parts.join("\n");
  }

  function buildRefineInput({ sourceCell, sourceGrid }) {
    return [
      `TASK: produce a refinement grid — 6 deeper variants of a single candidate.`,
      `SOURCE CELL (the option being expanded):`,
      `  headline: ${sourceCell.headline}`,
      `  preview:  ${sourceCell.preview}`,
      `  detail:   ${sourceCell.detail}`,
      `  commit:   ${sourceCell.commit && sourceCell.commit.kind}`,
      ``,
      `SOURCE GRID:`,
      `  title: ${sourceGrid.title}`,
      `  context: ${sourceGrid.context}`,
      ``,
      `Each of the 6 cells must be a distinct *variant* of the source move — different tone, length, sequencing, framing, or trade-off. One cell is the predicted best variant.`,
      ``,
      CELL_SCHEMA_DESC,
    ].join("\n");
  }

  // ---- public API ---------------------------------------------------------

  async function generateGrid({ gridId = "morning", intent, userFrame, seedGrid, ctx, model, signal }) {
    if (!window.SecretaryInstructions) throw new Error("SecretaryInstructions not loaded");

    // ─── Phase 1: deterministic seed selection ───────────────────────
    // Walk the bedrock, score every candidate, pick 6 diverse winners.
    // If the scorer isn't loaded (shouldn't happen but be defensive),
    // fall back to passing no seeds — the prompt will still make sense.
    let seeds = [];
    try {
      if (window.SecretaryScorer) {
        const r = await window.SecretaryScorer.scoreSeeds({ n: 6 });
        seeds = r.seeds || [];
      }
    } catch (e) {
      console.warn("[gen] seed scoring failed:", e && e.message);
    }

    // ─── Phase 2: Rodbot expands each seed into a real cell ──────────
    const input = buildGenerateInput({ gridId, intent, userFrame, seedGrid, seeds });
    // Intimate register — grid cells are Rodbot talking to the team.
    const mergedCtx = { register: "intimate", ...(ctx || {}) };
    const { text, raw } = await window.SecretaryInstructions.ask({
      input, ctx: mergedCtx, model, signal,
    });
    const parsed = extractJSON(text);
    const grid = normalizeGrid(gridId, parsed, seeds);
    if (!grid) {
      const err = new Error("AI returned unparseable JSON");
      err.rawText = text;
      err.rawResponse = raw;
      throw err;
    }
    return grid;
  }

  async function regenerateFromSweep({ grid, ctx, model, signal }) {
    return generateGrid({
      gridId: grid.id,
      intent: "Regenerate (sweep) — the operator tapped × to replace all 6 candidates with a fresh spread at the same frame. Keep the title/frame of the seed grid unless the data argues otherwise.",
      seedGrid: grid,
      ctx, model, signal,
    });
  }

  async function regenerateFromFrameReject({ grid, userText, ctx, model, signal }) {
    return generateGrid({
      gridId: grid.id,
      intent: "Frame-reject — the operator said the grid was asking the wrong question. Rewrite the grid title and regenerate all 6 cells around the reframed question.",
      userFrame: userText,
      seedGrid: grid,
      ctx, model, signal,
    });
  }

  async function refineCell({ cell, grid, ctx, model, signal }) {
    if (!window.SecretaryInstructions) throw new Error("SecretaryInstructions not loaded");
    const input = buildRefineInput({ sourceCell: cell, sourceGrid: grid });
    const newGridId = `${grid.id}__refine_${cell._id || cell.id || "cell"}_${Date.now().toString(36)}`;
    // Refined grids are also Rodbot talking to the team — intimate.
    const mergedCtx = { register: "intimate", ...(ctx || {}) };
    const { text, raw } = await window.SecretaryInstructions.ask({
      input, ctx: mergedCtx, model, signal,
    });
    const parsed = extractJSON(text);
    const result = normalizeGrid(newGridId, parsed);
    if (!result) {
      const err = new Error("AI returned unparseable JSON");
      err.rawText = text;
      err.rawResponse = raw;
      throw err;
    }
    return result;
  }

  // ---- Commitment drafting ------------------------------------------------

  const DRAFT_SCHEMA_DESC = `
Return JSON with this exact shape:
{
  "channel":   "sms" | "whatsapp" | "email" | "slack" | "calendar" | "note" | "open_url" | "internal" | "claude_code",
  "to":        string | null,        // recipient OR filesystem path — see channel semantics below
  "subject":   string | null,        // only for email / calendar / claude_code-as-task-label; null otherwise
  "body":      string,               // the ACTUAL OUTBOUND MESSAGE the team would send, or for claude_code the prompt to execute
  "why_channel": string,             // one short sentence — why this channel was chosen for this move
  "voice_check": string[]            // 2-4 items noting which voice-model patterns were respected
}

Rules:
- The "body" must be the real thing the team would actually send. Not a recipe. Not bullet points describing what the message should be. Not "Line 1: say X. Line 2: say Y." The actual prose, in his voice, ready to copy-paste or send.
- Length: match the team's voice model (client replies 3-6 lines, SMS even shorter, Slack shorter still).
- Respect the voice model rules you see in base context (sign-off "— J", no "just"/"sorry for the delay", em-dashes, concrete closing).
- Pick channel by what the team would actually use:
    urgent/short pings = sms or whatsapp,
    client work        = email,
    team internal      = slack,
    deep-work self     = internal note,
    LOCAL WORK (write a file, rebuild an index, run a sweep, generate a report) = claude_code — and in that case "to" is a filesystem path (either a cwd directory or a specific file to write), and "body" is the full prompt Claude Code should execute (not a message to a person). Prefer absolute paths starting "/Users/jakeaaron/". voice_check for claude_code can just note "task-as-prompt, not prose".
- If the cell's action is "open a doc" instead of sending to a person, channel:"open_url" with to=URL.
- If the target (who to send to) genuinely cannot be determined from Mission Control data, set "to": null and in voice_check note "no target in bedrock — ask the team".
- Do NOT invent phone numbers, emails, or file paths you haven't seen in the data. Leave "to": null instead.
- Return JSON ONLY. No prose before or after.
`.trim();

  function buildDraftInput({ cell, grid, ctx }) {
    return [
      `TASK: Write the ACTUAL outbound message for this committed action. Not a description of the message — the message itself, in the team's voice, ready to send.`,
      ``,
      `COMMITTED CELL:`,
      `  headline: ${cell.headline}`,
      `  preview:  ${cell.preview}`,
      `  detail:   ${cell.detail}`,
      `  commit:   kind=${cell.commit && cell.commit.kind} · label=${cell.commit && cell.commit.label} · target=${(cell.commit && cell.commit.target) || "(none specified)"}`,
      cell.predicted ? `  (this was the predicted best move)` : ``,
      ``,
      `SOURCE GRID:`,
      `  title: ${grid.title}`,
      `  context: ${grid.context}`,
      ``,
      `Use MISSION CONTROL data to pin down the recipient. Check people/, threads/, projects/ — don't invent contacts that aren't in the bedrock.`,
      ``,
      DRAFT_SCHEMA_DESC,
    ].filter(Boolean).join("\n");
  }

  function normalizeDraft(parsed) {
    if (!parsed || typeof parsed !== "object") return null;
    const allowedChannels = ["sms", "whatsapp", "email", "slack", "calendar", "note", "open_url", "internal", "claude_code"];
    return {
      channel: allowedChannels.includes(parsed.channel) ? parsed.channel : "internal",
      to: parsed.to || null,
      subject: parsed.subject || null,
      body: String(parsed.body || "").trim() || "(empty draft — AI returned no body)",
      why_channel: String(parsed.why_channel || "").trim(),
      voice_check: Array.isArray(parsed.voice_check) ? parsed.voice_check.slice(0, 6) : [],
      _draftedAt: new Date().toISOString(),
    };
  }

  async function draftCommitment({ cell, grid, ctx, model, signal }) {
    if (!window.SecretaryInstructions) throw new Error("SecretaryInstructions not loaded");
    const input = buildDraftInput({ cell, grid, ctx });
    // Commitment body is OUTBOUND — Rodbot is ghostwriting for the team.
    // Professional register: no jokes, no meta, honor target handling notes.
    // (If the AI picks an internal/note channel, professional discipline is
    // still harmless — the body will just be crisp personal prose.)
    const mergedCtx = { register: "professional", ...(ctx || {}) };
    const { text, raw } = await window.SecretaryInstructions.ask({
      input, ctx: mergedCtx, model, signal,
    });
    const parsed = extractJSON(text);
    const draft = normalizeDraft(parsed);
    if (!draft) {
      const err = new Error("AI returned unparseable draft JSON");
      err.rawText = text;
      err.rawResponse = raw;
      throw err;
    }
    return draft;
  }

  // ---- Project structure proposal ---------------------------------------
  // Rodbot reads a project and proposes: phases → deliverables → tasks.
  // Returns the structure ready to be written to the project JSON.

  const PROJECT_STRUCTURE_SCHEMA = `
Return JSON:
{
  "phases": [
    {
      "id":     "ph_<snake_case_slug>",
      "title":  "short phase name",
      "state":  "active" | "upcoming" | "blocked",
      "goal":   "one sentence — what this phase actually produces for the team",
      "deliverables": [
        {
          "id":    "d_<slug>",
          "title": "the concrete output",
          "state": "open",
          "tasks": [
            { "id": "t_<slug>", "title": "one-line verb-led task", "state": "open" }
          ]
        }
      ]
    }
  ]
}

Rules:
- 2-4 phases. First phase is "active", others "upcoming" unless a later one is genuinely blocked.
- 2-5 deliverables per phase — real concrete outputs, not abstract milestones.
- 2-6 tasks per deliverable — each task is a ≤1-day-sized verb-led action.
- IDs: short, snake_case, unique within this project. Prefix phase IDs with "ph_", deliverables with "d_", tasks with "t_".
- Match the project's altitude. If it's a day-job deliverable (e.g. Comeketo client work), phases are weekly/daily. If it's a big long-term build, phases span months.
- Tasks should be boring-specific, not inspirational. "Send Andre the intake template" beats "Align stakeholders."
- Return JSON ONLY.
`.trim();

  async function proposeProjectStructure({ project, ctx, model, signal }) {
    if (!window.SecretaryInstructions) throw new Error("SecretaryInstructions not loaded");
    const existingPhases = (project.phases && project.phases.length) ? project.phases : null;
    const input = [
      `TASK: Design a phase/deliverable/task tree for this project.`,
      ``,
      `PROJECT:`,
      `  id: ${project.id}`,
      `  name: ${project.name || project.id}`,
      project.status    ? `  status: ${project.status}`       : null,
      project.next_move ? `  next_move: ${project.next_move}` : null,
      project.live_band ? `  live_band: ${project.live_band}` : null,
      project.notes     ? `  notes: ${project.notes}`         : null,
      project.tags && project.tags.length ? `  tags: ${project.tags.join(", ")}` : null,
      project.blockers && project.blockers.length ? `  blockers: ${(project.blockers).map(b => typeof b === "string" ? b : (b.description || JSON.stringify(b))).join(" | ")}` : null,
      ``,
      existingPhases
        ? `The project ALREADY has phases. Don't overwrite — instead, extend or refine them. If they're fine as-is, return {"phases": <the existing structure>} unchanged.`
        : `The project has NO phases yet. Build the tree from scratch.`,
      ``,
      existingPhases ? `EXISTING PHASES:\n${JSON.stringify(existingPhases, null, 2)}\n` : "",
      PROJECT_STRUCTURE_SCHEMA,
    ].filter(Boolean).join("\n");

    // Intimate register — she's helping the team plan his own work.
    const mergedCtx = { register: "intimate", ...(ctx || {}) };
    const { text, raw } = await window.SecretaryInstructions.ask({
      input, ctx: mergedCtx, model, signal,
    });
    const parsed = extractJSON(text);
    if (!parsed || !Array.isArray(parsed.phases)) {
      const err = new Error("AI returned unparseable project structure");
      err.rawText = text;
      err.rawResponse = raw;
      throw err;
    }
    // Normalize shape — fill defaults.
    const phases = parsed.phases.map((ph, i) => ({
      id: String(ph.id || `ph_${i+1}`).slice(0, 60),
      title: String(ph.title || `Phase ${i+1}`).trim(),
      state: ["active","upcoming","blocked","done"].includes(ph.state) ? ph.state : (i === 0 ? "active" : "upcoming"),
      goal: String(ph.goal || "").trim(),
      started_at: i === 0 ? new Date().toISOString() : null,
      completed_at: null,
      deliverables: (Array.isArray(ph.deliverables) ? ph.deliverables : []).map((d, j) => ({
        id: String(d.id || `d_${i+1}_${j+1}`).slice(0, 60),
        title: String(d.title || `Deliverable ${j+1}`).trim(),
        state: d.state === "done" ? "done" : "open",
        tasks: (Array.isArray(d.tasks) ? d.tasks : []).map((t, k) => ({
          id: String(t.id || `t_${i+1}_${j+1}_${k+1}`).slice(0, 60),
          title: String(t.title || "").trim(),
          state: t.state === "done" ? "done" : "open",
          created_at: new Date().toISOString(),
          completed_at: null,
        })).filter(t => t.title),
      })).filter(d => d.title),
    })).filter(ph => ph.title);
    return { phases };
  }

  return {
    generateGrid, regenerateFromSweep, regenerateFromFrameReject, refineCell,
    draftCommitment, proposeProjectStructure,
    extractJSON, normalizeGrid, normalizeDraft,
  };
})();

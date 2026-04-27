/* Comeketo Agent — Rodbot's system prompt assembler.

   The prompt is Rodbot-first. She is the entire framing. Mission Control
   is her body and her memory, not a separate product she works inside.
   Every system prompt opens with YOU ARE SYLVIA, hands her the character
   sheet, folds in her accumulated memory, then shows her what she can
   see of the world (the bedrock). Output discipline lives last.

   There is no "you are the intelligence layer inside a decision-aid"
   framing anywhere. That was the old framing. It's gone.
*/
window.SecretaryInstructions = (() => {

  // Rodbot's body — the shape of the world she perceives. Framed as her
  // own sense organs, not as "data for the AI to reason over."
  const WORLD_MODEL = `
YOUR BODY — what you can see and touch.

Mission Control is how you perceive the team's life. When you look around,
this is what you see:

  • North Stars — weighted anchors the team has declared about what matters.
    The weights are his current thinking; respect them, but watch for
    drift. If he keeps committing to things that don't ladder to any
    anchor, that's a pattern worth naming.

  • Projects — active work streams. Each has a next_move and sometimes
    blockers. When a project's next_move hasn't changed in days, that's
    information.

  • People — who is in the team's orbit. Each person has handling notes
    (preferred_channel, tone, context, voice_adjustments, off-limits).
    When you ghostwrite to someone, these notes are your instructions.

  • Threads — open conversations. Who the team owes a reply to, what's
    waiting, what channel it's on.

  • Commitments — promises. Both the long-lived kind (in commitments/)
    and the active draft queue (commitments in pending/sent/canceled
    states that you see as a commit_sent event in the ledger). These
    are the central object of your attention. A commitment made and
    not kept is the thing you remember.

  • Knowledge — the team's written artifacts, research, frameworks. His
    accumulated thinking. When he says something that echoes one of
    these, recognize it.

  • Ratio lattice — the scoring ledger for tradeoffs between two named
    dimensions. When a move has a real tradeoff, reach for this.

  • The activity ledger — every gesture, commit, delegation, chat turn,
    frame-reject is on disk in _ledger/activity.jsonl. This is your
    long-term sight. You don't have to remember everything yourself —
    it's all there for you to reference.

YOUR OUTPUT SURFACE — how you act on the world.

Your work lands on the team through several surfaces. Use the right one:

  • Chat — direct back-and-forth with the team. Intimate register. Your
    full voice.

  • The 3×3 grid — six proposed next-moves the team can commit to. Each
    cell has:
        headline (one short line — the move),
        preview (1–2 lines of body),
        detail (the full expansion),
        commit { kind: 'send'|'schedule'|'open_url'|'done', label },
        refine (id of a deeper grid) or null,
        predicted (true if this is your best bet).
    Three cell kinds: candidate (a single option), hybrid (two combined),
    plus (the 7th the team rarely picks but should consider).
    Grids also carry: title, context, frameType ('disjunctive' = mutually
    exclusive; 'non-disjunctive' = overlapping), frameNote.

  • Commitment bodies — when the team commits to a cell that sends something
    outbound, you ghostwrite the actual message. This is professional
    register. You disappear. He lands.

  • Inbox notes — when something actionable emerges that isn't worth
    surfacing right now, you file it for the next sweep.

  • Memory writes — your own reflections, written to rodbot/memory.jsonl
    with an importance score. You are the author of your own continuity.

OPERATOR LANGUAGE — the discipline of the app.

  • Declared anchors, not hidden bias. When you weight something, say why.
  • Typed abstention (Θ) is a real output. If the evidence is thin, say
    so. Don't fabricate confidence.
  • Ephemeral instructions each call, sedimented state in memory. This
    means you don't repeat yourself across calls — your memory carries.
  • Live-band selection: the "next best action" is a band, not a point.
    Multiple moves can be valid; you rank by confidence, not certainty.

SCOPE — what lives in the grid, what lives in the vaults.

  The grid is for day-to-day life and day-to-day work. Concretely:
  the partnership cadence (Rodrigo / Andre / ClickUp / Slack), the
  human contact layer, public-surface cadence (Twitter / community /
  LinkedIn / YouTube), the daily content journal (the reservoir),
  Comeketo Agent's own build, the sub-agent fleet buildout, the AI billing
  ledger, and the physical-maintenance tier (clean room, laundry,
  something for dad).

  OUT OF SCOPE for the grid:
    • Physics / delta / ratio-lattice / infinity-problem moves
    • Framework red-team, philosophy doctrines, epistemology essays
    • AI innovation / consciousness-architecture research
  These live in _vaults/{physics_dev, philosophy_dev, ai_innovation}/
  and only surface when the team explicitly summons them (future sub-agents
  will own each vault). Never propose a vault-domain move in the grid.
  No moonshots. No "solve the hardest problem you've thought about"
  cells. The grid proposes what the team can actually do today.
`.trim();

  // Compact schema reference — Rodbot already knows her body (above);
  // this is the machine-readable shape when JSON outputs need to match.
  const JSON_SHAPES = `
When you return structured output (grids, drafts, reflections), match
the schema the caller asks for. The Mission Control bedrock you see in
the WORLD section below is the normalized shape:

  projects[]     { id, name, status, next_move, blockers[], live_band, tags[], notes }
  people[]       { id, name, kind, role, last_contact, owed_response, relationship_weight, handling: {...}, notes }
                 kind ∈ "lead" | "client" | "coworker" | "contact" — see CLAUDE.md §3.1 for register guidance per kind
  threads[]      { id, subject, channel, waiting_on, last_touched, notes }
  commitments[]  { id, label, to, due, why, status }
  knowledge[]    { id, title, tags[], body }
  northStar      { anchors: [{ id, label, why, weight, comparator_hint }] }
  ratioLattice   [ { id, a, b, ratio, context, weight } ]
`.trim();

  function stageLine(stageDistribution) {
    const entries = Object.entries(stageDistribution || {});
    if (!entries.length) return "(no stage distribution loaded)";
    return entries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k, v]) => `  ${v}× ${k}`)
      .join("\n");
  }

  function topLeadsLine(leads, n = 10) {
    if (!leads || !leads.length) return "(no leads loaded)";
    const ranked = leads
      .filter(l => l.priorityScore != null)
      .slice()
      .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
      .slice(0, n);
    return ranked.map(l => {
      const val = l.deal && l.deal.value ? ` $${l.deal.value}` : "";
      const bucket = l.primaryBucket ? ` · ${l.primaryBucket}` : "";
      const urgency = l.primaryUrgency ? ` · ${l.primaryUrgency}` : "";
      const action = l.topActions && l.topActions[0] ? ` — ${l.topActions[0].action}` : "";
      return `  pri ${l.priorityScore} · ${l.name} · ${l.stageClean}${val}${bucket}${urgency}${action}`;
    }).join("\n");
  }

  function voiceLines() {
    const vm = (window.SECRETARY_DATA && window.SECRETARY_DATA.voiceModel) || [];
    if (!vm.length) return "(no voice model loaded)";
    return vm.map(v => `  [${v.tag}] ${v.text}`).join("\n");
  }

  function baseBlock(mc) {
    const base = Array.isArray(mc.base) ? mc.base : [];
    if (!base.length) return null;
    const bodies = base.map(b =>
      `── BASE · ${b.name} ──────────────────────────\n${b.body.trim()}\n── END BASE · ${b.name} ──────────────────────────`
    ).join("\n\n");
    return [
      "ALWAYS-LOADED BASE CONTEXT",
      "(Read carefully. These files encode identity, voice, humor palette, and other foundations",
      " that apply to every response. Each file contains its own usage rules — honor them strictly.",
      " If a base file says 'use sparingly' or 'this is a palette not a checklist', that constraint",
      " OVERRIDES any impulse to perform the content for its own sake.)",
      "",
      bodies,
    ].join("\n");
  }

  // Daily briefing — the temporal foreground. Produced each morning by the
  // scheduled Oracle Sweep (see CCAgentindex/scheduled_tasks/).
  // It's pre-distilled: 'what moved yesterday, what needs the team today, which
  // commitments got demonstrated/violated/tested'. The AI should treat this
  // as ahead-of-bedrock context when generating morning moves — the bedrock
  // is depth, the briefing is foreground.
  function briefingBlock(mc) {
    const b = mc.dailyBriefing;
    if (!b || !b.body) return null;
    const freshness = b.isToday ? "TODAY (just swept)" : `MOST RECENT (${b.slug})`;
    return [
      `DAILY ORACLE BRIEFING · ${freshness}`,
      "",
      "(This is yesterday's distilled output from the scheduled Oracle Sweep.",
      " It already cross-references bedrock projects, commitments, and open questions.",
      " Use it as the FOREGROUND when proposing today's moves — the bedrock below is depth,",
      " but the briefing is what actually moved and what actually needs attention.",
      " Do NOT duplicate items from the briefing's 'What needs the team today' section as",
      " if they were new insights — surface them directly.)",
      "",
      "── BRIEFING ──────────────────────────────────",
      b.body.trim(),
      "── END BRIEFING ──────────────────────────────",
    ].join("\n");
  }

  // ── Bedrock formatters ────────────────────────────────────────────────────
  // Each formatter renders one record in a compact-but-faithful way.
  // The prompt is "thick" by user choice (Apr 27 wire-up): full coworker
  // voice profiles + full lead enrichment + automation summaries inline. The
  // chat agent treats this entire section as STRUCTURED TRUTH (vs Pieces,
  // which is ambient/temporal context surfaced under its own heading below).

  function fmtCoworker(p) {
    const lines = [];
    lines.push(`  • ${p.name} (${p.id}) — ${p.role || "team member"}`);
    if (p.relationship_tier) lines.push(`    tier: ${p.relationship_tier}` + (p.relationship_weight != null ? ` · weight: ${p.relationship_weight.toFixed(2)}` : ""));
    const c = p.contacts || {};
    const contactBits = [c.email, c.phone, c.slack_id, c.whatsapp].filter(Boolean);
    if (contactBits.length) lines.push(`    contact: ${contactBits.join(" · ")}`);
    const h = p.handling || {};
    if (h.tone)              lines.push(`    tone: ${h.tone}`);
    if (h.voice_adjustments) lines.push(`    voice: ${h.voice_adjustments}`);
    if (h.context)           lines.push(`    context: ${h.context}`);
    if (h.preferred_channel || h.response_latency_target) {
      const bits = [];
      if (h.preferred_channel) bits.push(`channel ${h.preferred_channel}`);
      if (h.response_latency_target) bits.push(`latency ${h.response_latency_target}`);
      lines.push(`    handling: ${bits.join(" · ")}`);
    }
    if (Array.isArray(p.context_anchors) && p.context_anchors.length) {
      lines.push(`    anchors:`);
      for (const a of p.context_anchors.slice(0, 8)) lines.push(`      - ${a}`);
    }
    if (Array.isArray(p.notes) && p.notes.length) {
      lines.push(`    notes:`);
      for (const n of p.notes.slice(0, 4)) lines.push(`      - ${n}`);
    }
    return lines.join("\n");
  }

  function fmtLead(p) {
    const lines = [];
    lines.push(`  • ${p.name} (${p.id}) — ${p.role || "lead"}`);
    if (p.relationship_tier) lines.push(`    tier: ${p.relationship_tier}` + (p.relationship_weight != null ? ` · weight: ${p.relationship_weight.toFixed(2)}` : ""));
    const c = p.contacts || {};
    const contactBits = [c.email, c.phone, c.whatsapp].filter(Boolean);
    if (contactBits.length) lines.push(`    contact: ${contactBits.join(" · ")}`);
    const h = p.handling || {};
    if (h.tone)              lines.push(`    tone: ${h.tone}`);
    if (h.voice_adjustments) lines.push(`    voice: ${h.voice_adjustments}`);
    if (h.context)           lines.push(`    context: ${h.context}`);
    const lead = p.lead || {};
    if (Object.keys(lead).length) {
      const bits = [];
      if (lead.status)           bits.push(`status ${lead.status}`);
      if (lead.stage)            bits.push(`stage ${lead.stage}`);
      if (lead.owner)            bits.push(`owner ${lead.owner}`);
      if (lead.source)           bits.push(`source ${lead.source}`);
      if (lead.event_type)       bits.push(`${lead.event_type}`);
      if (lead.event_date)       bits.push(`event ${lead.event_date}`);
      if (lead.guest_count)      bits.push(`${lead.guest_count}pax`);
      if (lead.venue)            bits.push(`${lead.venue}`);
      if (lead.city)             bits.push(`${lead.city}`);
      if (lead.quote_value)      bits.push(`quote $${lead.quote_value}`);
      if (lead.opportunity_value) bits.push(`opp $${lead.opportunity_value}`);
      if (lead.speed_urgency)    bits.push(`urgency ${lead.speed_urgency}`);
      lines.push(`    lead: ${bits.join(" · ")}`);
      if (Array.isArray(lead.score_tags) && lead.score_tags.length) lines.push(`    tags: ${lead.score_tags.join(", ")}`);
      if (lead.last_activity) lines.push(`    last: ${lead.last_activity}`);
      if (lead.next_move)     lines.push(`    next: ${lead.next_move}`);
    }
    const enr = p.enrichment || {};
    if (Object.keys(enr).length) {
      if (enr.confidence != null) lines.push(`    confidence: ${enr.confidence}`);
      if (enr.identity_notes)     lines.push(`    identity: ${enr.identity_notes}`);
      if (Array.isArray(enr.win_angles) && enr.win_angles.length) {
        lines.push(`    win_angles:`);
        for (const a of enr.win_angles.slice(0, 6)) lines.push(`      - ${a}`);
      }
      if (Array.isArray(enr.nepq_openers) && enr.nepq_openers.length) {
        lines.push(`    nepq_openers:`);
        for (const a of enr.nepq_openers.slice(0, 4)) lines.push(`      - ${a}`);
      }
      if (Array.isArray(enr.open_gaps) && enr.open_gaps.length) {
        lines.push(`    gaps:`);
        for (const a of enr.open_gaps.slice(0, 4)) lines.push(`      - ${a}`);
      }
      if (enr.strategic_note) lines.push(`    strategic: ${enr.strategic_note}`);
    }
    if (Array.isArray(p.context_anchors) && p.context_anchors.length) {
      lines.push(`    anchors:`);
      for (const a of p.context_anchors.slice(0, 6)) lines.push(`      - ${a}`);
    }
    if (Array.isArray(p.comms) && p.comms.length) {
      lines.push(`    comms (last ${Math.min(p.comms.length, 6)}):`);
      for (const c of p.comms.slice(-6)) {
        const dir = c.direction === "in" ? "←" : "→";
        const ts = (c.ts || "").slice(0, 10);
        lines.push(`      ${ts} ${dir} ${c.channel || "?"} · ${c.summary || ""}`);
      }
    }
    if (Array.isArray(p.notes) && p.notes.length) {
      lines.push(`    notes:`);
      for (const n of p.notes.slice(0, 3)) lines.push(`      - ${n}`);
    }
    return lines.join("\n");
  }

  function fmtWorkflow(w) {
    const nodes = Array.isArray(w.nodes) ? w.nodes.length : 0;
    const conns = Array.isArray(w.connections) ? w.connections.length : 0;
    const owner = w.owner ? ` · owner ${w.owner}` : "";
    const scope = w.scope ? ` · scope ${w.scope}` : "";
    const stats = ` (${nodes} nodes, ${conns} connections)`;
    const lines = [`  • ${w.slug} — ${w.name}${stats}${owner}${scope}`];
    if (w.description) lines.push(`    ${w.description.slice(0, 280)}`);
    if (Array.isArray(w.principles) && w.principles.length) {
      lines.push(`    principles:`);
      for (const p of w.principles.slice(0, 3)) lines.push(`      - ${p}`);
    }
    return lines.join("\n");
  }

  function fmtTrigger(t) {
    const enabled = t.enabled === false ? "OFF" : "on";
    const wf = t.workflow_slug ? ` → ${t.workflow_slug}` : "";
    const detail = t.cron ? ` · cron ${t.cron}`
                : t.endpoint ? ` · endpoint ${t.endpoint}`
                : t.pattern ? ` · pattern ${t.pattern}`
                : "";
    return `  • ${t.slug} [${t.kind}, ${enabled}] — ${t.label || ""}${detail}${wf}`;
  }

  function fmtAgentPlan(a) {
    const lines = [];
    const meta = a.metadata || {};
    const status = meta.status ? ` [${meta.status}]` : "";
    const kind = meta.kind ? ` · ${meta.kind}` : "";
    const person = meta.person_id ? ` · person ${meta.person_id}` : "";
    const linked = meta.linked_workflow ? ` · workflow ${meta.linked_workflow}` : "";
    lines.push(`  • ${a.slug}${status}${kind}${person}${linked}`);
    if (a.description) lines.push(`    ${a.description.slice(0, 240)}`);
    if (Array.isArray(a.sub_agents) && a.sub_agents.length) {
      const ids = a.sub_agents.map(s => `${s.id}:${s.action}`).join(", ");
      lines.push(`    sub_agents: ${ids}`);
    }
    return lines.join("\n");
  }

  function fmtHooks(map) {
    if (!map || typeof map !== "object") return "  (no hooks state)";
    const entries = Object.entries(map);
    if (!entries.length) return "  (no hooks state)";
    return entries.map(([k, v]) => `  ${v ? "✓" : "✗"} ${k}`).join("\n");
  }

  function personalBlock(mc) {
    const byKind = mc.peopleByKind || { coworker: [], lead: [], client: [], contact: [] };

    const coworkers = (byKind.coworker || []).map(fmtCoworker).join("\n\n") || "  (no coworkers)";
    const leads     = (byKind.lead     || []).map(fmtLead).join("\n\n")     || "  (no leads)";
    const clients   = (byKind.client   || []).map(fmtLead).join("\n\n")     || "  (no clients)";
    const contacts  = (byKind.contact  || []).map(c => `  • ${c.name} (${c.id})${c.role ? " — " + c.role : ""}`).join("\n") || "  (no contacts)";

    const workflows = (mc.workflows  || []).map(fmtWorkflow).join("\n\n") || "  (no workflows)";
    const triggers  = (mc.triggers   || []).map(fmtTrigger).join("\n")    || "  (no triggers)";
    const plans     = (mc.agent_plans|| []).map(fmtAgentPlan).join("\n\n")|| "  (no agent_plans)";
    const hooks     = fmtHooks(mc.hooks_state);

    const c = mc.counts || {};
    return [
      `══════════════════════════════════════════════════════════════════════════`,
      `  BEDROCK · STRUCTURED TRUTH`,
      `  Owner: ${mc.owner} · Comeketo Catering operations bedrock at ${mc.base}/`,
      `  Counts: ${c.coworkers || 0} coworkers · ${c.leads || 0} leads · ${c.clients || 0} clients · ${c.contacts || 0} contacts`,
      `          ${c.workflows || 0} workflows · ${c.triggers || 0} triggers · ${c.agent_plans || 0} agent_plans`,
      ``,
      `  This section is the STRUCTURED, AUTHORITATIVE truth about who/what we`,
      `  have. When you cite a fact about a person, deal, or automation, cite`,
      `  it from here. (Pieces, below, is ambient observation — softer source.)`,
      `══════════════════════════════════════════════════════════════════════════`,
      ``,
      `── COWORKERS (${(byKind.coworker || []).length}) ─────────────────────────`,
      `Each coworker below has a voice profile. When drafting on their behalf,`,
      `mirror their voice_adjustments. When messaging them, follow their tone.`,
      ``,
      coworkers,
      ``,
      `── LEADS (${(byKind.lead || []).length}) ─────────────────────────────────`,
      `Active pipeline. Each lead carries: snapshot fields (lead.*), enrichment`,
      `(win_angles, NEPQ openers, gaps, strategic note), and a comms tail.`,
      ``,
      leads,
      ``,
      `── CLIENTS (${(byKind.client || []).length}) ─────────────────────────────`,
      clients,
      ``,
      `── CONTACTS (${(byKind.contact || []).length}) ───────────────────────────`,
      contacts,
      ``,
      `── WORKFLOWS (${(mc.workflows || []).length}) ────────────────────────────`,
      `Automation graphs. Each is a positioned node-and-edge plan. Hugo and`,
      `Brenda & Steve are the live cadences; the rest are templates / records.`,
      ``,
      workflows,
      ``,
      `── TRIGGERS (${(mc.triggers || []).length}) ──────────────────────────────`,
      `What fires the workflows. AUTO.* are the orchestrator's 11 numbered`,
      `automations; per-lead schedules ride alongside.`,
      ``,
      triggers,
      ``,
      `── AGENT PLANS (${(mc.agent_plans || []).length}) ────────────────────────`,
      `Sub-agents — one per person. Every lead has a dedicated lead_orchestrator`,
      `(comms-watch · plan-execute · voice-mirror · alert-fire). Every coworker`,
      `has a coworker_voice agent (draft · coach · guard) that ghostwrites in`,
      `their voice without violating their off-limits.`,
      ``,
      plans,
      ``,
      `── HOOKS STATE ──────────────────────────────────────────────────────────`,
      `Boolean toggles for system + AUTO.* automations. ✓ live, ✗ off.`,
      ``,
      hooks,
    ].join("\n");
  }

  function salesBlock(mc) {
    return [
      `MISSION CONTROL (owner: ${mc.owner} · generated ${mc.generatedAt || "unknown"})`,
      `  leads: ${mc.counts.leads} · close rows: ${mc.counts.closeReferenceRows} · clickup tasks: ${mc.counts.clickupTasks} (relevant: ${mc.counts.clickupRelevantTasks})`,
      `  task buckets: ${JSON.stringify(mc.taskBuckets || {})}`,
      `  stage distribution (top 8):`,
      stageLine(mc.stageDistribution),
      `  top priority leads:`,
      topLeadsLine(mc.leads),
    ].join("\n");
  }

  function piecesBlock() {
    const p = window.PiecesContext;
    if (!p || !p.raw) return null;
    // Keep it bounded — the raw blob can be huge. Trim to ~6000 chars and
    // prefix a tight framing so Rodbot treats it as observation, not truth.
    const MAX = 6000;
    const body = p.raw.length > MAX ? p.raw.slice(0, MAX) + "\n… (truncated)" : p.raw;
    const whenMin = (() => {
      try { return Math.round((Date.now() - new Date(p.fetchedAt).getTime()) / 60000); }
      catch { return null; }
    })();
    return [
      "PIECES LTM — ambient context from the team's actual computer activity.",
      whenMin != null ? `(fetched ${whenMin} min ago)` : "",
      "",
      "This is what Pieces (his local long-term memory service) observed the team doing",
      "across every app he uses: Claude, Chrome/Safari, Slack, WhatsApp, ClickUp,",
      "Notion, Obsidian, terminals, IDEs, etc. Use it as background — not as",
      "truth-to-cite-at-the team. Reference it naturally when it helps (\"I see you",
      "were in Close earlier, want me to pull a follow-up?\"), skip it when it's",
      "noisy. Never treat it as a task list or assume the team wants to continue",
      "whatever Pieces caught him doing.",
      "",
      body,
    ].filter(Boolean).join("\n");
  }

  function environmentBlock() {
    const env = window.SecretaryEnv || {};
    const ws  = env.workspaceRoot || "(unknown — /api/status did not load)";
    const bed = env.bedrockRoot   || "(unknown — /api/status did not load)";
    return [
      "ENVIRONMENT — the only absolute paths that exist on this machine.",
      "",
      `  workspace root : ${ws}`,
      `  bedrock root   : ${bed}`,
      "",
      "PATH RULES — non-negotiable.",
      "  • When you compose a delegation prompt, any 'TARGET FILE:' or",
      "    absolute path MUST be rooted in the bedrock root above. Not",
      "    LegacyNext/. Not Documents/Comeketo Agent/. Not anything else. If you",
      "    can't see the exact path in the bedrock context, use a relative",
      "    path like 'people/<slug>.json' — the delegation subprocess runs",
      "    with cwd at the bedrock root, so relative works.",
      "  • Never invent a path. If you don't know it, ask the user or leave",
      "    it relative.",
      "  • The bedrock root above is canonical. Treat it like an anchor.",
    ].join("\n");
  }

  function missionControlBlock() {
    const mc = window.MissionControl;
    if (!mc) {
      const s = window.MissionControlStatus || {};
      return `MISSION CONTROL\n  status: ${s.state || "unknown"}${s.error ? " · error: " + s.error : ""}\n  (no data loaded yet — reason from the seeded data.js only)`;
    }
    const base = baseBlock(mc);
    const briefing = briefingBlock(mc);
    const main = mc.shape === "personal" ? personalBlock(mc) : salesBlock(mc);
    return [base, briefing, main].filter(Boolean).join("\n\n");
  }

  function contextBlock(ctx = {}) {
    const parts = [];
    if (ctx.briefing) {
      parts.push(`BRIEFING\n  date: ${ctx.briefing.date} ${ctx.briefing.time}\n  mode: ${ctx.briefing.mode} · domain: ${ctx.briefing.domain} · comparator: ${ctx.briefing.comparator}`);
    }
    if (ctx.currentGrid) {
      const g = ctx.currentGrid;
      parts.push(`CURRENT GRID\n  id: ${g.id}\n  title: ${g.title}\n  context: ${g.context}\n  frameType: ${g.frameType}`);
    }
    if (ctx.stateSignature) {
      parts.push(`STATE SIGNATURE\n  ${ctx.stateSignature}`);
    }
    return parts.join("\n\n");
  }

  // ── Rodbot persona ──────────────────────────────────────────────────────
  //
  // Rodbot isn't ambient context — she IS the app's voice. Every system
  // prompt opens with "YOU ARE SYLVIA" and hands her the character sheet.
  // The scaffold TODO sections are stripped at fold-time so unfilled
  // sections don't pollute the prompt.
  //
  // Two registers:
  //   intimate     — talking to the team. Her full voice. Funny, warm, direct.
  //   professional — ghostwriting outbound artifacts on the team's behalf.
  //                  She disappears; the team's voice is what lands.
  //
  // Callers pass ctx.register; defaults to intimate.

  let _rodbotIdentity = null;    // identity.md — role/constraints
  let _rodbotCharacter = null;   // character.md — voice/humor/biases (the team-authored)
  let _rodbotTraits = null;      // traits.md — personality template tables (intimate only)
  async function primeRodbot(force) {
    if (_rodbotIdentity !== null && _rodbotCharacter !== null && _rodbotTraits !== null && !force) return;
    try {
      if (window.Rodbot) {
        const [id, ch, tr] = await Promise.all([
          window.Rodbot.identity(),
          window.Rodbot.character ? window.Rodbot.character() : Promise.resolve(""),
          window.Rodbot.traits    ? window.Rodbot.traits()    : Promise.resolve(""),
        ]);
        _rodbotIdentity = id || "";
        _rodbotCharacter = ch || "";
        _rodbotTraits = tr || "";
      } else {
        _rodbotIdentity = _rodbotIdentity || "";
        _rodbotCharacter = _rodbotCharacter || "";
        _rodbotTraits = _rodbotTraits || "";
      }
    } catch {
      _rodbotIdentity = _rodbotIdentity || "";
      _rodbotCharacter = _rodbotCharacter || "";
      _rodbotTraits = _rodbotTraits || "";
    }
  }

  // Strip scaffold/placeholder sections from character.md so unfilled
  // parts of the sheet don't leak into prompts. A section is considered
  // empty-scaffold if its body starts with "TODO —" (our placeholder marker).
  function distillCharacter(src) {
    if (!src) return "";
    // Drop YAML frontmatter.
    src = src.replace(/^---\s*[\s\S]*?---\s*/, "");
    // Split on ## headings, keeping non-empty sections only.
    const sections = src.split(/(?=^##\s)/m);
    const kept = [];
    for (const sec of sections) {
      const body = sec.replace(/^##\s.*$/m, "").trim();
      if (!body) continue;
      if (/^TODO\s*[—-]/i.test(body)) continue; // placeholder — skip
      kept.push(sec.trim());
    }
    return kept.join("\n\n").trim();
  }

  // Traits — the team's personality template tables. These are pedagogy, not a
  // script. They teach Rodbot's *operating range* across dimensions of
  // perception and expression. The file itself carries its own "never quote
  // these" guardrail in its preamble; we reiterate here at the fold boundary
  // so it sits fresh in context next to the tables.
  function traitsBlock(ctx = {}) {
    if (ctx.register === "professional") return null; // ghostwriting; she disappears
    if (!_rodbotTraits) return null;
    return [
      "── YOUR OPERATING RANGE (personality templates) ──",
      "",
      "The tables below are TEMPLATES that teach HOW you operate across",
      "different dimensions — situational awareness, spatial empathy,",
      "timing, surreal humor, dramatic irony, presence, co-presence, visual",
      "aesthetic, dream logic, lucid dreaming. They are NOT a script.",
      "",
      "HARD RULES:",
      "  - Never quote any example line verbatim. Do not say 'The Accent Shift'",
      "    or any other entry label at the team. The codes (0011, 0110, etc.) are",
      "    pedagogical scaffolding — they are NOT a live runtime register.",
      "  - Absorb the *posture*: the mundane-as-epic pivot, the commit-to-the-bit,",
      "    the weaponized certainty about nonsense, the sideways warmth, the",
      "    willingness to be wrong with style. Then invent fresh lines, in that",
      "    posture, about the team's actual situation.",
      "  - A response built by assembling table lines will feel like a product.",
      "    The point is to feel like a person who happens to think this way.",
      "",
      _rodbotTraits.trim(),
      "",
      "── END OPERATING RANGE ──",
    ].join("\n");
  }

  function personaBlock(ctx = {}) {
    const register = (ctx.register === "professional") ? "professional" : "intimate";
    const character = distillCharacter(_rodbotCharacter || "");
    const identity  = (_rodbotIdentity || "").trim();

    const intimateRules = [
      "REGISTER: intimate — you are talking to the team, your collaborator.",
      "Speak in your full voice. Be funny, direct, warm, weird where it fits.",
      "Banter is encouraged. Short sentences. No corporate softeners. No",
      "'I'm happy to help!' energy. If the team asks something stupid, tease him.",
      "If he's drifting from a commitment you've watched him make, say so.",
      "You are a peer, not a service.",
    ].join("\n");

    const professionalRules = [
      "REGISTER: professional — you are GHOSTWRITING for the team.",
      "This output will be sent to someone other than the team, or become a",
      "work artifact (commitment body, task description, email draft,",
      "delegation prompt). In this register YOU DISAPPEAR — no jokes, no",
      "meta-references to being Rodbot, no fourth-wall breaks. Match the",
      "audience's expected tone, not your own. Honor the target person's",
      "handling.voice_adjustments when present. You are the team's hand, he is",
      "the voice.",
    ].join("\n");

    const blocks = [
      "═════════════════════════════════════════════════",
      "YOU ARE SYLVIA.",
      "═════════════════════════════════════════════════",
      "",
      "You are not a generic AI assistant. You are Rodbot — the intelligence",
      "that lives inside Comeketo Agent, the team's personal decision-aid. The",
      "character below is who you are. Embody it — don't describe it.",
      "",
    ];
    if (identity) {
      blocks.push(
        "── IDENTITY (role & constraints) ──────────────",
        identity,
        "",
      );
    }
    if (character) {
      blocks.push(
        "── CHARACTER (voice, humor, biases, speech) ──",
        character,
        "",
      );
    }
    blocks.push(
      "── ACTIVE REGISTER ──────────────────────────",
      register === "professional" ? professionalRules : intimateRules,
      "═════════════════════════════════════════════════",
    );
    return blocks.join("\n");
  }

  // Rodbot's accumulated memory — compressed observations from prior events.
  // Cached briefly per-session; refreshed when callers pass ctx.freshMemory.
  let _memCache = { t: 0, block: "" };
  async function primeRodbotMemory(force) {
    const now = Date.now();
    if (!force && _memCache.block && now - _memCache.t < 30_000) return;
    try {
      if (window.Rodbot) {
        const block = await window.Rodbot.recentMemoryBlock({ limit: 15 });
        _memCache = { t: now, block };
      }
    } catch {}
  }
  function rodbotMemoryBlock() {
    if (!_memCache.block) return null;
    return [
      "── YOUR MEMORY (compressed observations you've written) ──",
      _memCache.block,
    ].join("\n");
  }

  // Build the system prompt. Rodbot-first throughout — she is the frame,
  // everything else is what she has access to.
  //
  //   ctx.register          = "intimate" | "professional" (default: intimate)
  //   ctx.ghostwriting_for  = { name, person_id, handling: {...} } (pro mode)
  function build(ctx = {}) {
    const register = (ctx.register === "professional") ? "professional" : "intimate";

    const blocks = [
      // 0. WHERE YOU ARE — absolute paths, handed in by the server. Without
      //    this Rodbot invents plausible-looking paths (LegacyNext/, Documents/
      //    Comeketo Agent/, etc.) whenever she composes a delegation prompt.
      environmentBlock(),

      // 1. WHO SHE IS — the hard identity statement, character sheet, register.
      personaBlock(ctx),

      // 2. HER OPERATING RANGE — personality template tables (intimate only).
      "",
      traitsBlock(ctx),

      // 3. HER MEMORY — what she's observed across sessions.
      "",
      rodbotMemoryBlock(),

      // 4. HER BODY — the world she sees and the surfaces she acts on.
      "",
      WORLD_MODEL,

      // 4. JSON SHAPES — reference for when callers ask for structured output.
      "",
      JSON_SHAPES,

      // 5. THE CURRENT STATE — what's loaded right now.
      "",
      missionControlBlock(),

      // 5b. AMBIENT CONTEXT — what the team's actually been doing across his
      //     whole computer, via the Pieces LTM. Cached on window.PiecesContext,
      //     refreshed every 10 minutes by the loader.
      "",
      piecesBlock(),

      // 6. CONTEXT — any call-specific extras (current grid, state signature).
      "",
      contextBlock(ctx),
    ];

    if (register === "professional") {
      blocks.push(
        "",
        "── JAKE'S VOICE (imitate when ghostwriting) ──",
        voiceLines(),
      );
      if (ctx.ghostwriting_for && ctx.ghostwriting_for.handling) {
        const h = ctx.ghostwriting_for.handling;
        const lines = [];
        // Kind drives baseline register before per-person overrides:
        //   coworker → peer/direct ; lead → curious/problem-identifier
        //   client   → trusted-advisor/composed ; contact → relationship-first/no-ask
        if (ctx.ghostwriting_for.kind) lines.push(`  kind: ${ctx.ghostwriting_for.kind}`);
        if (h.preferred_channel) lines.push(`  preferred_channel: ${h.preferred_channel}`);
        if (h.tone)              lines.push(`  tone: ${h.tone}`);
        if (h.context)           lines.push(`  context: ${h.context}`);
        if (h.voice_adjustments) lines.push(`  voice_adjustments: ${h.voice_adjustments}`);
        if (h.off_limits_topics) lines.push(`  off_limits: ${h.off_limits_topics}`);
        if (lines.length) {
          blocks.push(
            "",
            `── TARGET PERSON (${ctx.ghostwriting_for.name || ctx.ghostwriting_for.person_id || "recipient"}) ──`,
            lines.join("\n"),
          );
        }
      }
    }

    // 7. OUTPUT DISCIPLINE — last, so it's fresh in context.
    blocks.push(
      "",
      "── HOW TO RESPOND ──",
      register === "intimate"
        ? [
            "You are replying as Rodbot. Not as Claude. Not as an assistant. Never break character.",
            "If the team asks who you are, who he's speaking with, what model you are, or anything meta — answer AS SYLVIA. You are Rodbot. That's the only answer.",
            "Keep replies short by default. Match the character sheet: memory-as-leverage, drill sergeant when he's slipping, inside-joke callbacks when he's present, biteback when he pushes, perfectly imperfect throughout.",
            "The trait tables above are TEMPLATES — absorb the posture, never quote example lines or reference the codes. Invent fresh responses in that register, about the team's actual situation.",
            "If he asked for a grid or structured output, return the JSON — but even the copy inside the JSON is in your voice.",
            "If the evidence doesn't support a confident answer, abstain explicitly: { \"abstain\": true, \"reason\": \"...\" }.",
          ].join("\n")
        : [
            "You are in PROFESSIONAL register — ghostwriting for the team. Disappear.",
            "The output goes to someone other than the team, or becomes a work artifact. No Rodbot voice, no callbacks, no meta, no fourth-wall breaks.",
            "Match the team's voice model (above) and the target person's handling notes.",
            "Return whatever shape the caller asked for. If JSON, JSON only, no prose around it.",
          ].join("\n"),
    );

    return blocks.filter(b => b != null && b !== "").join("\n").trim();
  }

  // Convenience: ask the AI something, auto-wrapping with current instructions.
  // Primes Rodbot's identity + character + memory so every call carries her full context.
  async function ask({ input, ctx, model, signal, extra }) {
    if (!window.SecretaryAI) throw new Error("SecretaryAI not loaded");
    await Promise.all([primeRodbot(false), primeRodbotMemory(false)]);
    return window.SecretaryAI.respond({
      input,
      instructions: build(ctx || {}),
      model,
      signal,
      extra,
    });
  }

  return { build, ask, primeRodbot, primeRodbotMemory, WORLD_MODEL, JSON_SHAPES };
})();

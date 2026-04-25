/* Comeketo Agent · the team (personal) — seed data.
   Near-empty by design. The morning grid shows a single empty-state cell
   that prompts you to press "Generate from Mission Control" in the action bar
   — every real grid comes from the AI reading CCAgentindex/.
   Voice model + clusters are the only real seeds; they describe the team,
   not a demo.
*/
window.SECRETARY_DATA = (() => {

  const briefing = {
    date: new Date().toDateString(),
    time: new Date().toTimeString().slice(0, 5),
    mode: "proposals",
    domain: "personal",
    comparator: "north_star_weighted",
  };

  // The only pre-populated grid. One cell — a big call-to-action that
  // opens a clean "please generate" state. Every other grid shape is
  // produced by the AI on demand.
  const grids = {
    "morning": {
      id: "morning",
      title: "Good morning, the team.",
      context: "press Generate from Mission Control above — or sweep × on the grid",
      frameType: "disjunctive",
      frameNote: "empty · awaiting generation",
      cells: {
        "01": {
          kind: "candidate",
          headline: "Generate today's moves",
          preview: "Reads projects · people · threads · commitments · ledgers.",
          detail: "Click 'Generate from Mission Control' in the action bar above. The AI reads your bedrock and proposes six candidate first-moves, weighted against your declared North Stars.\n\nIf no anchors are declared yet, the proposals are unweighted — so worth declaring at least one anchor in ledgers/north_star.json before you care about the ordering.",
          commit: { kind: "done", label: "Understood — I'll hit Generate" },
          refine: null,
          predicted: true,
        },
      },
    },
  };

  // No seed clusters. Memory screen derives every cluster from real events
  // in SecretaryMemory — commits, retires, recurring marks, rejects, edits,
  // agent runs, sends. Empty state shows "no clusters yet — use the app and
  // they'll populate" rather than three fake cards locked at 0%.
  const clusters = [];

  const frameLog = [];

  // the team's voice model — these describe the actual writing style the AI
  // should match when drafting commitments. Not demo data.
  const voiceModel = [
    { tag: "sign-off",    text: "Uses '— J'. Never 'Best,' or 'Thanks!'",               weight: 0.97 },
    { tag: "openings",    text: "Skips 'I hope this finds you well' entirely",          weight: 0.94 },
    { tag: "punctuation", text: "Em-dashes over semicolons; rare Oxford commas",        weight: 0.89 },
    { tag: "hedges",      text: "Avoids 'just', 'sorry for the delay', 'quick question'",weight: 0.92 },
    { tag: "candor",      text: "Owns a delay once in the opener; never again",         weight: 0.83 },
    { tag: "close",       text: "Closes with a concrete next step, not a question",     weight: 0.88 },
    { tag: "length",      text: "Replies: 3–6 lines, rarely more",                      weight: 0.85 },
  ];

  return { briefing, grids, clusters, frameLog, voiceModel };
})();

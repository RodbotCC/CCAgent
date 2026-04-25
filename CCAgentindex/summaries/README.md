# the team Mission Control — Personal Bedrock

- owner: `Comeketo team`
- shape: `personal`
- purpose: local bedrock for the team's own work/life, mirroring the Andre sales bedrock but scoped to personal decision-making

## Domains

- **projects/** — active initiatives (one file per project). Status, next move, blockers, live band.
- **people/** — who's in the team's orbit. Last contact, owed-response, relationship weight, notes.
- **threads/** — active conversations waiting on something (email/Slack/text, owed or waiting).
- **commitments/** — durable promises made (to others or self). Not the commit queue — these are the *long-lived* commitments the day's work should honor.
- **knowledge/** — reference material. Research notes, bookmarks, principles worth preserving.

## Ledgers

- **ledgers/north_star.json** — the team's declared anchor set. The "what should advance today" comparator.
- **ledgers/ratio_lattice.json** — the ratio-lattice entries for scoring candidate moves. Scoring logic is still evolving; the ledger holds the raw ratios.

## Contract

The loader normalizes these into `window.MissionControl` with:

```
{
  owner: "Comeketo team",
  shape: "personal",
  generatedAt: ISO8601,
  counts: { projects, people, threads, commitments, knowledge },
  projects: [...],
  people: [...],
  threads: [...],
  commitments: [...],
  knowledge: [...],
  northStar: {...},
  ratioLattice: [...]
}
```

## How to feed it

the team tells Claude things. Claude writes `.json` files into the right subfolder. Schema enforced by the loader; anything that doesn't parse warns but loads.

## Bedrock vs sediment

- **bedrock** = what's in these folders right now
- **sediment** = whatever happens during the day that hasn't been folded back in

Daily/weekly rebuild: Claude reads the gesture residue + commitments, proposes updates, the team approves, files get rewritten. Same discipline as the Andre bedrock — lineage-preserving.

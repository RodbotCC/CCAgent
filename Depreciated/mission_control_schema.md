# Mission Control — schema contract

The app reads a normalized `window.MissionControl` object at runtime, built by `mission_control_loader.js` from the bedrock index folder. Drop a fresh index folder in, reload, the UI picks up the new state — no code changes.

## Expected folder layout

```
andre_mission_control_index/
├── catalogs/
│   ├── clickup_bucketed_task_catalog.csv
│   ├── clickup_relevant_task_catalog.csv
│   ├── clickup_run_catalog.csv
│   ├── clickup_task_catalog.csv
│   ├── close_table_catalog.csv
│   ├── top_level_file_catalog.csv
│   └── webapp_artifact_catalog.csv
├── indexes/
│   ├── andre_lead_cards.jsonl
│   ├── andre_lead_summary.csv
│   ├── andre_lead_universe.json
│   ├── andre_reference_index.jsonl    (skipped — too large to ship to browser)
│   └── andre_stage_summary.json
├── manifests/
│   ├── rebuild_manifest.json
│   ├── slack_coverage.json
│   └── source_status.json
└── summaries/
    └── README.md
```

## Loader contract

- Path to the folder lives in `window.MissionControlConfig.base` (default: `andre_mission_control_index`).
- `window.MissionControlReady` is a Promise that resolves to the normalized object (or `null` on failure).
- `window.MissionControl` is the resolved object once loading completes; `null` before that or on failure.
- Load failures log to console and the app falls back to whatever `data.js` provides.

## Normalized shape

```ts
MissionControl = {
  owner: string                          // "Andre Raw"
  generatedAt: string                    // ISO8601 from rebuild_manifest
  counts: {
    leads: number                        // andre_lead_count
    leadCards: number                    // andre_lead_card_count
    closeReferenceRows: number
    clickupTasks: number
    clickupRelevantTasks: number
    topLevelFiles: number
  }
  stageDistribution: { [stageLabel]: number }   // from andre_stage_summary.dominant_stage_counts
  taskBuckets: { today, within_48h, within_3_7d, watch_list }  // from andre_stage_summary.task_bucket_counts
  clickupBuckets: { [bucketName]: number }      // derived by grouping bucketed task catalog
  sources: Array<{ system, status, notes: string[] }>
  slack: { status, rawPresent, liveConnectorPulled, notes: string[], evidence: [] }
  rawManifest: object                    // rebuild_manifest.json untouched

  leads: Array<LeadCard>
  leadSummary: Array<LeadSummaryRow>     // lighter per-lead row from summary CSV
  universe: object                       // andre_lead_universe.json untouched

  clickupTasks: Array<ClickupTask>       // relevant + bucketed, merged by task_id
  clickupRuns: Array<ClickupRun>
  closeTables: Array<CloseTable>
  topLevelFiles: Array<TopLevelFile>
  webappArtifacts: Array<WebappArtifact>

  readme: string                         // summaries/README.md raw text
}

LeadCard = {
  name, normalizedName, id,              // id = first of lead_ids
  leadIds: string[]
  closeRows: number
  closeSourceFiles: number
  topCloseTables: Array<{ sourceFile, count }>
  stageLabel: string                     // dominant_stage_label (emoji stripped variant also provided)
  stageClean: string                     // "Booked for Tasting"
  topStageLabels: Array<{ stageLabel, count }>
  latestEventUtc: string | null
  priorityScore: number | null
  webappTaskCount, webappOpenLoopCount, webappBottleneckCount
  urgencyMix: { urgent?, high?, medium?, low? }
  bucketMix: { today?, within_48h?, within_3_7d?, watch_list? }
  primaryBucket: string | null           // bucket with highest count, else null
  primaryUrgency: "urgent"|"high"|"medium"|"low"|null
  topActions: Array<{ bucket, action, urgency, value }>
  deal: { name, value, stage, event, guests, venue, confidence, priority, risk: string[] } | null
  needsAttention: boolean
}

ClickupTask = {
  id, name, list, bucket, status,
  assignees: number, comments: number,
  relevance: string, tier: string,
  matchedTokens: string[], highSignalTokens: string[],
  path: string
}

LeadSummaryRow = { name, leadIdCount, closeRows, stageLabel, latestEventUtc, priorityScore,
                   webappTaskCount, webappOpenLoopCount, webappBottleneckCount,
                   pipelineStage, pipelineValue, pipelinePriority, needsAttention }

ClickupRun = { runId, space, tasks, comments, score }
CloseTable  = { path, rowCount, andreMatched, ... }
TopLevelFile = { path, className, ... }
WebappArtifact = { path, keys: string[] }
```

## Stage label cleanup

Raw stage labels include leading emoji and status chars (e.g. `🔥 03. Booked for Tasting`). The loader preserves `stageLabel` verbatim and adds `stageClean` stripped of emoji/symbol prefix.

## Extension: other owners

Drop a different index folder in (e.g. `somebody_mission_control_index/`) and set `window.MissionControlConfig = { base: "somebody_mission_control_index" }` before `mission_control_loader.js` loads. Everything else is schema-identical.

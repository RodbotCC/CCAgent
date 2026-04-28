---
name: stage-3b-deep-dive
description: Stage 3b (deep enrichment) of the Comeketo Client Intelligence Agent. Run a multi-engine sweep — Sonar (Perplexity), Grok, web_search — across every public surface for the lead and partner: LinkedIn, X/Twitter, Facebook, Instagram, TikTok, YouTube, Threads, public Reddit, podcast appearances, press, public writing, BBB, professional licensing boards, public business filings, public reviews. Capture text, images, and audio/video samples to the lead's assets/ folder. Only run on leads tier-classified high in Stage 3a, or whenever Andre flags. Use when a lead has been pre-enriched and warrants the full intelligence-operation depth.
---

# Stage 3b — Deep Dive

The most expensive stage in the pipeline. Only run on leads classified
`high` in Stage 3a. The output is the artifact-rich profile the rep walks
into a tasting having actually read.

## Inputs

- `clients/<lead_id>/01_comms.md`
- `clients/<lead_id>/02_people_search.md` (the search-key inventory)
- `clients/<lead_id>/00_meta.json` with `enrichment_tier == "high"`

## Engine cascade

1. **Sonar (Perplexity)** — primary cited synthesis. Query shape:
   "Tell me everything publicly known about <name>, who works at <employer>
   and lives in <city>. Include LinkedIn, professional history, public
   media. Return sources." Save raw JSON to
   `03_deep_dive_raw/sonar_raw.json`.
2. **Grok** — personality + recency + X coverage. Query shape:
   "What does <name> post about publicly on X / Twitter? What are they
   currently engaging with? Who do they publicly engage with?" Save raw to
   `03_deep_dive_raw/grok_raw.json`.
3. **Browser agent (Cowork)** — given the URLs surfaced by Sonar/Grok,
   load each profile/page/article. Capture screenshots, profile photos,
   public posts. Download podcast audio when public. Save artifacts to
   `clients/<lead_id>/assets/`.
4. **Cross-check pass** — local synthesis. Compare Sonar's claims against
   Grok's against what the browser actually saw. Disagreements flagged.

## Sweep checklist (per person — partner gets the same pass)

- LinkedIn — title, employer, tenure, role history, education, follower
  count, recent posts (last 90 days), endorsements, notable connections.
- Twitter / X — bio, follower count, post frequency, recent topics, who
  they retweet/engage publicly.
- Facebook (public-only) — profile photo, cover, public posts, public
  page memberships.
- Instagram (public-only) — aesthetic, post frequency, public bio.
- TikTok — content themes if any.
- YouTube — owned channels + appearances (interviews, podcasts).
- Threads — same as Twitter.
- Public Reddit — only if username is publicly tied to them.
- Podcast appearances — audio links + transcripts when public.
- Press / news — articles, interviews, attributed quotes.
- Public writing — Substack, Medium, blogs, op-eds.
- Speaking — conferences, panels.
- Company website — bio page, About, exec team.
- BBB — accreditation, complaint history.
- Professional licensing — NPI, bar admission, real estate license,
  franchise registrations.
- Public business filings — corporate registrations, real estate.
- Public reviews of their business — Yelp, Google, industry-specific.

## Visual / audio capture (the underrated layer)

- Public profile photos → `assets/photos/profile_<source>.jpg`
- Public photos with family / venue / property → `assets/photos/*.jpg`
- Voice samples (podcast clip, YouTube clip) → `assets/audio/*.mp3`,
  with timestamp range pointing to the most relevant 30–60 seconds.

## Output

`clients/<lead_id>/03_deep_dive.md` — synthesized human-readable deep dive
with sections (verbatim shape):

```
# Deep Dive — <Name>

## Identity (verified)
## Public footprint summary
## Career timeline
## Public voice
## Network
## Visible interests / preoccupations
## Family / personal context (publicly volunteered only)
## Public business / property
## Visual identity
## Voice / video samples
## What this means for the conversation
## Confidence notes
## Sources
```

## Privacy line (enforced)

In bounds: LinkedIn public, Twitter public, public podcasts, BBB,
licensing, news, public Instagram, public Facebook, business filings.
Out of bounds: private databases requiring deception, paid breach data,
private profiles, inferences about protected attributes the person has
not publicly volunteered.

# source_index.md — Hugo Casillas

Complete source trail for every fact, quote, screenshot, and inference
in this lead's intelligence package. Required by CIA §05.27 / §16.15.

If a claim isn't in this index, it doesn't go in the profile.

## Schema

| col | meaning |
|---|---|
| id | `S###` stable reference for inline citations |
| stage | which CIA stage it was captured in (§03 comms, §04 people-search, §05 deep-dive) |
| source_type | close \| linkedin \| zoominfo \| public-web \| inference \| internal-note |
| url_or_path | URL or workspace path |
| accessed | ISO date the source was read |
| confidence | ✅ verified \| 🟡 inferred \| ❓ unknown \| 🚫 out-of-bounds |
| supports | what claim(s) this source backs |

## Sources

| id | stage | source_type | url_or_path | accessed | confidence | supports |
|---|---|---|---|---|---|---|
| S001 | §03 | close | https://app.close.com/lead/lead_g4AZCOW7Kpc3tithNBrr9aXPbDHsZ72KJUR55Qjzd6f/ | 2026-04-25 | ✅ | All comms history, contact info, opp value, status, smart-view membership |
| S002 | §03 | internal-note | ./01_comms.md | 2026-04-25 | ✅ | Full transcribed comms timeline (April 16–24, 2026) |
| S003 | §04 | inference | ./02_people_search.md | 2026-04-25 | 🟡 | (832) area code → Houston transplant; Hispanic surname → Mexican-American heritage |
| S004 | §05 | linkedin | linkedin.com/in/hugocasillas (handle to verify) | 2026-04-25 | 🟡 | ZoomInfo Mid-Market AE, promoted Jan 2026 from SDR; Texas A&M; Waltham MA; 2,260 followers / 500+ connections |
| S005 | §05 | public-web | zoominfo.com (employer page) | 2026-04-25 | ✅ | Employer is publicly traded B2B data platform, Waltham HQ |
| S006 | §05 | internal-note | ./03_deep_dive.md | 2026-04-25 | 🟡 | Deep-dive narrative & strategic reframe |
| S007 | §05 | inference | ZoomInfo Mid-Market AE comp benchmarks (industry-typical) | 2026-04-25 | 🟡 | $100–200K+ base + variable income tier |
| S008 | §03 | close | Close call note 2026-04-17 (30 min discovery) | 2026-04-25 | ✅ | Fiancée vegetarian; some guests vegetarian; couple gluten-free; 110 confirmed of 125 invited; venue Highland Orchard; Sunday-tasting decline |
| S009 | §05 | public-web | highlandorchardweddings.com (or equivalent venue site) — TO VERIFY | 2026-04-25 | ❓ | Highland Orchard, Sturbridge MA — orchard wedding venue, recommended caterer list referenced Comeketo |
| S010 | §05 | internal-note | ./HugoDeep.txt + ./Hugo Casillas_enrichment.md | 2026-04-25 | 🟡 | Source of the LinkedIn-derived employment timeline used in §05 |

## Open verification gaps (sources that need a real URL before this index is spec-compliant)

- ❓ **S004**: LinkedIn URL not captured — actual handle/URL must be pasted in. Currently the deep-dive treats LinkedIn as fact with no link back.
- ❓ **S009**: Highland Orchard venue site / recommended-caterer list — need a URL confirming the referral pathway.
- ❓ **Fiancée identity**: no source. She is invisible to public search and to comms so far. Treat as unknown until Hugo names her.
- ❓ **Facebook / Instagram / TikTok / YouTube / podcast / press / BBB / licensing / business-filings / reviews**: deep-dive did not perform platform-specific sweeps. Each remains "none-found, not searched" rather than "none-found, searched and confirmed absent."

## Citation rule

Inline citations in `02_people_search.md`, `03_deep_dive.md`, `04_profile.md`
should reference these IDs as `[S004]` etc. Missing inline cites = audit
debt; the next pass should retrofit them.

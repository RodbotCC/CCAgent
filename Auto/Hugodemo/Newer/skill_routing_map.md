# skill_routing_map.md — Skill Routing Map

CIA §09E.05. The dispatcher: given a profile + plan-day, which skill
composes the move?

| profile | plan-day shape | route → Tier 1 |
|---|---|---|
| whale-professional-buyer | discovery follow-up | `compose-post-call-followup` |
| whale-professional-buyer | educate-on-comparison | `compose-recovery-message` |
| whale-professional-buyer | quote-expiry extend | `compose-quote-cover-email` |
| whale-professional-buyer | hostile / hard-no | `pause-cadence` |
| any | first contact | `compose-nepq-followup` |
| any | tasting invite | `compose-tasting-invite` |
| any | post-tasting | `compose-tasting-confirmation` |
| any | re-engagement after silence | `compose-recovery-message` |

The dispatcher is `route-by-profile-type` (Tier 4). Profile + plan-day
are inputs; Tier 1 skill name is the output.

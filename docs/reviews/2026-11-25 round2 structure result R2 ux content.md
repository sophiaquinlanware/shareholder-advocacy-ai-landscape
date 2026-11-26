REVIEWER: UX / content SCORE: 80 VERDICT: PASS

TOP FAILURES
1. **Build: the phone Company lookup is still the R1 problem, half fixed.** The proposal history table cuts the Status column to "Vote" and pushes Support off screen (phone-light/company.png, y≈1000–2000). Frontier-lab ties rows are about 220px tall and mostly empty (y≈5900–6900). The page is 8,229px tall. The Feed footnotes did work: Feed is now 6,475px on desktop (was 8,206) and 9,539px on phone (was 10,712).
2. **Build: Co-filer network labels still can't be read at default.** Company labels overlap each other ("Samsung/Amazon", "SpaceX…Technologies C.", "SK hynix/Salesforce"). Band labels are covered by nodes ("Advocacy nonp", "Public …n", "Other investo"); see desktop-light/network.png. Cause: graph.js:368 always labels every company and lab, whatever `labelMin` says (the top-12 default at graph.js:508 only applies to filers). Clamping and the empty-column fix did work: "ASML Hold" and "TSM" are no longer clipped.
3. **Build: one heading still doesn't match its tab.** The "Policy and causality" tab opens a page headed "Causality" (causality.js:157). Its own fallback says "Policy and causality" (causality.js:152). All other headings now match their tabs (app.js:101/178/299/482/517/552, graph.js:240, pathways.js:61).

TOP IMPROVEMENTS
1. **Fund votes:** at 1440 the table clips the Vanguard column (desktop-light/votes.png, right edge). With the scroll hint gone, nothing tells you more columns exist. Add a visible edge fade, or pin the Proposal column.
2. **Fund votes key:** it is still 7 bullets, and most are full sentences (votes.js:101-108). Each could be a label plus a fragment ("Not checked: no readable filing for that meeting").
3. **Phone tables:** on phone, drop or stack the low-value columns (Filed by, Tie) so Status and Support stay visible.

OUT-OF-FIELD NOTES
- The header still says "7 companies", while the network shows about 30 companies (desktop-light/network.png).
- Upcoming now shows the same precision throughout ("median 21.17% · high 36.19%"), so that R1 note is resolved.
- The comments at the top of causality.js:1 and pathways.js:1 still use the old names. Nobody sees them.

CONTENT RULES: PASS
- Fund votes intro is one computed line with no hard-coded dates (votes.js:99). The N-PX definition and the scroll instruction are gone.
- Upcoming's intro no longer defines a column (app.js:102).
- People is one line (app.js:518).
- Small leftovers, not blocking:
  - Proposals defines "Support = for ÷ (for + against)" (app.js:300).
  - Company lookup's intro lists what the page holds (app.js:179).
  - The Fund votes key reads as definitions. The brief keeps it on purpose; see improvement 2.

Design vs build: the R1 design gaps (Fund votes left out of the wording rules, the repeated notes) are fixed in the design. What remains is build work.

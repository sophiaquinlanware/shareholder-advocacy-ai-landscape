REVIEWER: Visual design SCORE: 74 VERDICT: REVISE

TOP FAILURES
1. **The co-filer network layout breaks at its own frame. The build didn't follow the design.** In desktop-light/network.png, nodes and labels run off the right edge ("ASML Hold", "SpaceX (", "TSM", "Micros") and off the bottom. Filer labels overprint each other: "Sisters of Charity of Leavenworth", "Zevin Asset Management" and "SHARE" sit in one unreadable stack around x 420–600, y 620–720. The People column is empty by default, because people start hidden, yet it still takes its 0.06 slot (graph.js:110), so about 15% of the width is dead. On phone (phone-light/network.png) the headers collide as "COMPANIESFRONTIER LA" and nodes are cut off at both edges. graph.js:359-362 places nodes with forces but never keeps them inside the box; I found no clamp. DESIGN.md asks for type bands, but the screenshot shows no band labels or separators.
2. **The causality chart's axis and space are wrong, from both the build and the design.** In desktop-light/causality.png the month labels read "ec, Feb, Aug, Nov, Feb…" with no year. causality.js:78 adds the year only on January, and the 56px skip at :76 drops every January. "The public" lane is empty yet takes about 120px. About 70% of events crowd into the right 15% of the width, while 2023–24 is mostly empty. Nothing in the design says how to scale time for data this skewed.
3. **Support notes are long and repeat, so they swamp the tables. The design doesn't cover this.** desktop-light/feed.png is 8206px tall, and company.png has 20 GOOGL rows that each carry the same 7-line note "Not stated in the 8-K. Counts are votes cast under dual-class…". The Support column is narrow (td.num at styles.css:58), so rows grow 5–7× taller than their content. On the dot plot, most marks are hollow, so the solid-mark key entries barely appear and the hollow circle also reads as "data centre".

TOP IMPROVEMENTS
1. Keep network nodes inside the box (clamp in tick, or zoom-to-fit after the layout settles), skip the slot for any hidden column, label the filer bands, and use label collision or the 12-filer limit the plan asked for (DEFAULTS labelMin 0, graph.js:103).
2. Causality: show the year on the first label after each year change, collapse empty lanes, and use a piecewise or compressed time scale.
3. Show a repeated support note once per company (a footnote marker plus one key line), and widen the Support column.

What passes: the tokens are clean (no hex values in the JS apart from a #888 fallback), there is one blue scale, pills separate status by shape, the scorecard fits at 1440 with the panel below, and the dot plot follows the spec (0–60% y axis, 50% line labelled, a shape for each topic).

OUT-OF-FIELD NOTES
- The header says "7 companies" while DESIGN/Rev 3 describes a 60-company universe; check the data branch merge (Data).
- On desktop the pathways graph uses about 70% of the width, and filer names are cut ("Mercy Investment Serv…") (UX).
- The tests/screenshots set still holds the removed tabs: why, water and weigh-in (QA).

CONTENT RULES: PASS. The topic legend is built from the data, with no phantom topic. Colours are tokens only: DESIGN.md `--n-*` and `--blue-*` match styles.css:18-20 and :160-165. Every visual has a text table on the same tab.

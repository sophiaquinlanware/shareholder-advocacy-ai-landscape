REVIEWER: Visual design SCORE: 78 VERDICT: REVISE

TOP FAILURES
1. **Network labels still print over each other; the build didn't follow the design.** Clamping now works: in desktop-light/network.png every node sits inside the frame. Hidden columns give up their space and the band labels show. But in the centre cluster, at x 510–870 and y 690–800, the labels "SpaceX (Space Exploration Technologies C…", "Samsung Electronics", "Amazon", "Microsoft AI", "SoftBank Group" and "Broadcom" overprint each other and can't be read. The 12-filer limit (graph.js:508) caps filer labels only. Companies and labs are always labelled (graph.js:368), and nothing handles label collisions. Filer nodes also cover their own band labels ("Public …on", "Advocacy nonp", "Faith-based inv"). The clamp leaves a row of about 12 grey nodes pressed against the bottom edge (y≈1028). On phone (phone-light/network.png) the right half is a solid block of overlapping labels from y 1020 to 1210.
2. **The causality axis has a bug, and the current season is off screen; the build didn't follow the design.** The first month label is the floor of t0. That date falls before t0, so `Math.pow(negative, 1.8)` returns NaN (causality.js:49, :73) and the label renders at x=0, clipped to "2022" (desktop-light/causality.png, top-left of the chart). The chart width is `max(clientWidth, events×34)`, which is 2176px (causality.js:39). At 1440 the view therefore ends at "Se[p 2025]", so 2026, the season the site is about, needs a horizontal scroll. The lane labels sit at x=10 inside the scrolling SVG (:70), so they scroll away with it. The comment at :46 says "square-root", but the code uses an exponent of 1.8.
3. **The lanes waste space; the design is wrong.** In the default view each 120px lane holds one row of dots (desktop-light/causality.png). "The public" lane looks empty within the visible width, and the chart uses about 600px of height for 64 events.

TOP IMPROVEMENTS
1. Label only nodes that are selected, hovered, or among the top N by degree, companies included. Alternatively, run a simple label-collision pass, and keep band labels in a gutter that nodes can't enter.
2. Causality: build the month range from `d3.timeMonth.ceil(t0)`, fit the chart to the container width (or open the scroll at the right end), move the lane labels into a fixed HTML column, and reduce laneH to about 60px.
3. Fixed and confirmed, so keep them: support footnotes listed once per table (company.png shows "1." once under the table, with the Support column readable); `--head-bg`, `--bg` and `--surface` all #ffffff (styles.css:6-12), with no off-white; th has a `--control-edge` bottom border (:99); the reason box has no fill (:93); the tab row wraps (:47).

OUT-OF-FIELD NOTES
- The header still says "7 companies" (Data).
- The phone causality page is 16,379px tall and the desktop page 8,771px, because the events table rows run 4–6 lines each (UX).
- Stale why, water and weigh-in screenshots are still in tests/screenshots (QA).

CONTENT RULES: PASS. Colours come from tokens only; no off-white or rgba values are in styles.css. Everything is blue apart from the owner-approved network colours. Every visual has a text table on the same tab.

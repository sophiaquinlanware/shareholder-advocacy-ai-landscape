REVIEWER: Performance / SEO SCORE: 74 VERDICT: REVISE

The planned changes themselves should cost very little performance. The score is 74 because the plan will not get Lighthouse to the 80 bar, and its page-weight claim has not been measured.

TOP FAILURES
1. **The design leaves performance where it is.** Layout shift of 0.49 is the main reason for 76 phone / 60 desktop (docs/STATE.md:23-24, :37). The plan treats it as an existing failure that "is reported, not counted against this round" (plan, Checks). So when this round ships, performance is still below 80 on both profiles. That scope is reasonable for a colour-and-type round, but nothing in the plan gets closer to the bar.
2. **The font swap can add new layout shift, and nothing in the plan prevents it.** Fonts load with `display=swap` (index.html:10). The planned heading fallback is "Inter, system-ui" (plan, Type table). Inter is itself a web font, so a heading may draw in system-ui first, then Inter, then Inter Tight, changing width at each step. The h1 is large (`clamp(30px,5vw,46px)`, styles.css:42) and sits at the top of the page, so it is likely the element Lighthouse times as the main paint. There is no matched fallback metric (`size-adjust`) and no preload. The extra shift this causes is unverified until it is measured.
3. **"Page weight stays about the same" is an estimate.** The plan calls it "still two families" (plan, Type). Source Serif 4 is requested as 2 weights plus the optical-size axis; Inter Tight would be 3 weights. No byte counts were taken for either. The claim is marked unverified, and the build has no check of font bytes.

TOP IMPROVEMENTS
1. Record the font CSS and woff2 bytes before and after, and Lighthouse CLS and LCP for the default tab, in the result review. Say for each whether it was measured or estimated.
2. Add a fallback `@font-face` for system-ui with `size-adjust` and ascent/descent overrides matched to Inter Tight. Then a heading's size barely changes when the web font arrives. Also consider preloading the latin Inter Tight file.
3. The switch from `line` to `path` arcs (graph.js:220-222, tick at :247) should not change Lighthouse. Network is a hidden tab (index.html:44) and the default tab is Why now (index.html:25), so the arcs are never drawn during the measured load. Rebuilding one string per link per tick costs little while the simulation runs, and it stops when the simulation cools. Keep it, but build each `d` string with plain template code rather than a d3 helper.

OUT-OF-FIELD NOTES
- A 300 weight for a 30px h1 on phones may read thin; that is for the Visual design reviewer.
- The `type="button"` fix (index.html:25-35) closes STATE.md queue item 5; it has no effect on performance.
- graph.json is 306 KB, the largest data file. Splitting or trimming it is round 2 work, but it matters for page weight.

CONTENT RULES: PASS. The title and meta description (index.html:6-7) and all wording and data are unchanged.

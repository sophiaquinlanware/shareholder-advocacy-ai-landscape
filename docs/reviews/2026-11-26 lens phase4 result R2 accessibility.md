REVIEWER: Accessibility SCORE: 88 VERDICT: PASS

All three round 1 failures are fixed at 8b85826. I read graph.js, lenses.js, app.js, styles.css, DESIGN.md and tests/lens4.spec.js from that commit; I didn't run the site or the tests.

- **Play button:** it is a plain button that renames itself between Play and Pause, with no `aria-pressed` (graph.js:338; stopPlay and wireScrubber). The test checks that the attribute is absent.
- **Scrubber in List view:** `#net-scrub` now sits above `.net-body`, outside the hidden `.net-graph-wrap`. The List count line states the cap: "Proposals and events up to {Y} only (year slider above)" (graph.js:1194). The ask recurrence line adds "(up to Y, as the year slider shows)" (lenses.js askActions), so the panel text matches the graph.
- **Ask panel order:** for asks, the eyebrow, `<h3>` and ring mark come first, then the facts, then the "This ask" `<h4>` (graph.js:587).
- **Cap clearing:** clearing the selection is announced in the live line: "The selected node is after that year, so the panel was cleared." (graph.js:1330).
- **Clamping:** `upto=` is clamped to the data's years (graph.js:1429).
- **Contrast** (my measurements on #1e1e1e): `--gn-ask` 11.18:1, now stated correctly in the plan. `--g-ring` 10.0:1 and `--g-risk` 9.89:1 are unchanged.
- **Lab pathways on white:** labels are `--ink`, column headers `--ink-soft` (7.46:1), node fills 3:1 or more.
- **Proposals chart:** all marks are now filled; the lightest, `--tp-gov` #4f8fcf, is about 3.5:1 on white. The topic still shows by shape as well as shade.

TOP FAILURES (none blocking)
1. **DESIGN.md is out of date for the scrubber.** DESIGN.md:131 still says it "sits under the graph" and uses `aria-pressed`. Both are now wrong, so the design doc no longer matches the build (AGENTS rule 10).
2. **Play can move keyboard focus.** graph.js:1327 redraws the panel (`showPanel`) on every scrub step, including each Play tick every 1.5 s. If a keyboard or screen-reader user has tabbed into the panel (a source link, say) while Play runs, that element is replaced and focus drops to the page (2.4.3). Play runs only about 4.5 s today, so the risk is small.

TOP IMPROVEMENTS
1. Skip the redraw when the panel's content hasn't changed. Otherwise, put focus back on the same control after the redraw.
2. Non-ask panels still put the actions `<h4>` before the node's `<h3>` (graph.js:587). This predates Phase 4; queue it rather than fix it here.
3. Add tests for three things:
   - in this lens, ask nodes come first in keyboard order;
   - the `#net-kb` announcement includes the coverage mark;
   - the List count line shows the cap text when `upto` is set.

OUT-OF-FIELD NOTES
- Ask labels are now always shown (graph.js, `d.kind === "ask"`), outside the no-overlap priority list. Check label collisions in the visual review.
- The Proposals chart key no longer has a "basis note" mark. The count of figures with a basis note is now given in text, which is fine, but data accuracy should confirm the count.
- DESIGN.md's Proposals row was updated; the row for the scrubber was not (see failure 1).

CONTENT RULES: PASS.
- The coverage marks keep "this site's reading, not yet confirmed by a person".
- An ask with no entries still reads "not yet assessed", never "no rule".
- The averages are labelled as computed by this site.
- Rule 9 (WCAG 2.1 AA) passes on the evidence reviewed. Failure 2 is an edge case, not a blocker.

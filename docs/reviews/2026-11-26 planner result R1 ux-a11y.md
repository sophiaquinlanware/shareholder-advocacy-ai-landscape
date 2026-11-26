REVIEWER: UX / content and accessibility SCORE: 62 VERDICT: REVISE

Scope: planner.js, `git diff main -- index.html app.js styles.css`, tests/planner.spec.js, screenshots tests/screenshots/{desktop,phone}-light/planner-full.png plus the grid opened at 1440 and 390 px (Playwright, 2026-11-26). The design is sound: the right parts are there, and most lines carry a source. The build has gaps in labelling, the grid and keyboard use.

TOP FAILURES
1. Unreviewed, unsourced vote signal (content rule). planner.js:135 shows "Its funds voted FOR this ask" with url `null`, so there is no link, although each fund_votes.json summary row has `sources`. Only 39 of 414 rows are `reviewed: true`, and the planner never reads that field, so auto-detected N-PX matches are shown as fact. Holdings say "on its latest 13F" (line 136) with no quarter. NBIM's edge comes from NBIM's own H1 2026 file, not a 13F, and holdings.json notes that no 13F was collected for 2026Q3.
2. Keyboard and screen reader. (a) `#pl-out` has `aria-live="polite"` (line 313) and is re-rendered whole, so every change reads out the entire plan. (b) "Add to shortlist" redraws everything and drops focus to `<body>` (measured). (c) The grid adds 348 tab stops (29 × 12 buttons). (d) The button's text changes and `aria-pressed` toggles at once, and 20 identical "Add to shortlist" buttons have no organization in the name. (e) The empty grid cells' only boundary is `--line` #e0e0e0 on white, about 1.3:1, which fails WCAG 1.4.11. (f) The chosen cell has no `aria-current`, and the corner `<th>` is empty.
3. The grid is unusable and the phone layout breaks. Rotated, unwrapped ask labels make the header about 600 px tall. Inside the `70vh` box, the desktop view shows one company row (Adobe); at 390 px no cell shows at all and the labels are clipped. The four-column collaborator table squeezes "Why it shows up" to one word per line on a phone, and the page is 9,556 px tall.

TOP IMPROVEMENTS
1. Explain the ranking. The weights (3 filed, 2 backed, 2 at this company, 2 or 1 votes, 2 holds, +1 shared coalition) and the 20-row cap are hidden. State them, or sort by the number of signal kinds and show the kinds as columns. Separate lead filer from co-filer.
2. Order for brainstorming: controls, then the grid (open), then the record, ideas, collaborators, policy and timing. Today the ideas and the grid sit below a 20-row table.
3. Use data the site already has: a "Your organization" panel (its funds' votes on this ask, its holdings, its filings), the scorecard gap against Parnassus's published recommendations, lab ties (value_chain_ties.json), and the resubmission thresholds for votes at this company.

OUT-OF-FIELD NOTES
- styles.css: `color-mix(... white)` and `var(--surface, #fff)` fallbacks bypass the tokens (rule 1).
- The "$2150M" format has no thousands separator.
- The `<h3>` inside `<summary>` is flattened by some screen readers.

CONTENT RULES: FAIL. Never-claim 4: the N-PX vote signal has no source and is not marked "auto-detected, not yet reviewed" (planner.js:135). Never-claim 9: "never filed", "this would be a first" and "never at {company}" (lines 88, 194, 196, 219) lack "in this dataset". The intro's "each potential partner" (line 306) and the heading "Who might work with you" imply a match the data can't show.

REVIEWER: Visual design SCORE: 72 VERDICT: REVISE

TOP FAILURES
1. **The dot plot uses colour for two things that clash (design is wrong).** The plan (line 38) colours dots by topic and colours the never-voted strip by status. The topic colours come from the pathway tie tokens (app.js:154-159). Governance uses `--t-equity` #1e6e5a, which is the same teal-green as `--open` (styles.css:146 vs :12). Social uses `--t-chips` orange, close to the `--narrow` amber. A green dot will read as "open" and an orange one as "narrowing". This breaks DESIGN.md's rule that one green means one thing. No topic palette is named in DESIGN.md's palette list, and Task 11 doesn't add one. Separately, the legend is built from `Object.keys(TOPIC_VAR)` (app.js:183), so it shows "AI safety & alignment", which no proposal has. The data has 3 topics (data/proposals.json). This is a current build bug that the plan should fix.
2. **The dot plot spec is missing what decides whether it reads.** I measured: 6 of the 59 voted proposals have no `meeting_date`, so on a date axis they disappear, which contradicts "keeps every proposal visible". Meetings cluster on a few dates (7 in 2026-06, 6 each in 2025-05 and 2025-06, 20 GOOGL items across a few AGMs), so dots will sit on top of each other with no jitter or beeswarm specified. Support runs 0–53.6% and only one proposal passes 50%. The plan doesn't fix the y domain. Nothing describes the chart at 390px.
3. **The scorecard layout bug is real, but the fix has no measurement.** Screenshot desktop-light/parnassus.png shows the matrix clipped at the right ("TRANSPARENCY AND ACCOUNTABILITY" and the last column are cut off), with the evidence panel taking about 20% of the width. Moving the panel below is the right fix. The check "all 17 columns visible at 1440" has no stated column width, and there's no phone rule for the 17 rotated headers. This is a build issue the plan addresses but doesn't measure.

TOP IMPROVEMENTS
1. Give topics their own palette in styles.css (3 hues kept apart from `--open`, `--narrow` and `--closed`) and record it in DESIGN.md. Show status in the strip with the existing pill shape and text, not colour.
2. Specify a beeswarm or jitter within each meeting date. Plot undated proposals at their year, with a hollow marker. Fix the y axis to 0–60% with the 50% line labelled. Set a phone fallback: the table first, the chart scrolling inside `.table-wrap`.
3. The plan moves every inline `style=` to classes (Task 10). It should also say which existing spacing values those classes use, since DESIGN.md has no spacing scale and lists 12 ad hoc values.

OUT-OF-FIELD NOTES
- The pathways tie table (74 rows) and the causality table (64 rows) under their graphs make long pages. Consider collapsing them by default (UX).
- Node size in the network has no size legend specified (Accessibility/UX).
- The Parnassus engagement outcomes timeline on the scorecard tab isn't mentioned in the 9-tab plan (UX).

CONTENT RULES: FAIL. The current Proposals legend lists a topic with no data (app.js:183, app.js:155). The plan's tables and dot plot otherwise follow the tokens-only and data-driven rules.

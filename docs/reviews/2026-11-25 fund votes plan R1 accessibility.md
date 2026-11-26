REVIEWER: Accessibility SCORE: 74 VERDICT: REVISE

Nothing is built yet: `votes.js` and `data/fund_votes.json` do not exist. So I judged the design (the plan plus the existing patterns it says to reuse), not a build. All three failures below are gaps in the design that the build would copy from existing code.

TOP FAILURES
1. **Design is wrong (left unspecified): no table header semantics.** The plan (task 2, item 2) never mentions a caption, `scope` or row headers. Every existing table it copies has none either: `app.js:178` and `app.js:239` use plain `<th>` with no `scope` and no `<caption>`, and `graph.js:264` is the same. In a 14-column grid, each cell link reads only "For" or "Against". It meets WCAG 2.4.4 (link purpose) only if the cell is tied to both the proposal (a row `<th scope="row">`) and the fund family (`<th scope="col">`).
2. **Design is wrong: the scrolling box cannot be reached by keyboard and has no name.** `.table-wrap` (`styles.css:84`) is `overflow-x:auto` with no `tabindex="0"`, `role="region"` or `aria-label`, and there is no `:focus-visible` rule anywhere in `styles.css`. Safari keyboard users cannot scroll to the right-hand fund columns. There is also no sticky first column, so at 390 px the proposal name scrolls out of view while you read the votes. The no-sideways-scroll test (`tests/site.spec.js:33-43`) only measures the page width, so it will pass anyway.
3. **Design is wrong: a blank cell means "no vote found", but it is silent.** An empty `<td>` is announced as "blank" or skipped entirely. A screen reader user cannot tell "did not vote" apart from "data missing". The meaning lives only in the intro copy.

TOP IMPROVEMENTS
1. Add `<caption>` (it can be visually hidden), `<th scope="col">` for each fund family and `<th scope="row">` for the proposal title. Give each vote link an `aria-label` such as "Vanguard, [proposal]: Against, N-PX filing".
2. Wrap the table as `<div class="table-wrap" role="region" aria-label="Fund votes table" tabindex="0">`, make the first column `position:sticky; left:0`, and add a `:focus-visible` outline token.
3. Show a visible "No vote" (or "–" with visually hidden text) instead of a blank. Give the three filters visible `<label>`s, or at least use `aria-label` plus an "All …" first option, as `app.js:174-175` does. The plan does not say whether the fund family filter is a select or chips.

Verified as passing:
- The `.pill.pending` text has enough contrast: #4d5552 on #eceae4 is 6.38:1 in light, and #a9b1ad on #262b29 is 6.56:1 in dark. Both clear AA's 4.5:1.
- Meaning does not rely on colour: every vote is a neutral text label.
- The pill background against the card is only 1.2:1 (light) and 1.13:1 (dark). That is acceptable because the text carries the meaning.

OUT-OF-FIELD NOTES
- "Split" also needs a count (e.g. "Split, 3 of 5 funds for") so it does not read as a judgement. That is a UX call.
- A grid of 9 families × ~39 rows will be long on phones. Consider letting people filter to a single family by default.
- The plan's "11+1 tabs" check should also include a keyboard tab-through test.

CONTENT RULES: PASS. The plan keeps neutral labels (Never claim 1) and the independence statement (Never claim 3). There is no rendered copy to check yet.

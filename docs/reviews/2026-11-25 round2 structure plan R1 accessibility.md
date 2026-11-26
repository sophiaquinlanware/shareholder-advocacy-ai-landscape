REVIEWER: Accessibility SCORE: 72 VERDICT: REVISE

Evidence comes from reading the code and running WCAG contrast calculations on the token values (Python). I did not run a screen reader or load the page in a browser.

TOP FAILURES
1. **The design is wrong: the plan gives no keyboard or screen-reader spec for the new parts.** It names the dot plot, the sortable headers and the `<details>` cards, but it never says how they work for keyboard and screen-reader users. It says nothing about `aria-sort`, a `<button>` inside each `<th>`, the dot plot's text name, or announcing the updated count line. Today's build shows what happens without a spec:
   - Clickable chart marks have no `tabindex` or key handler (app.js:212-214, pathways.js:122, causality.js:94).
   - Causality can only be explored by clicking.
   - `grep aria-live` finds nothing in any JS file, so the side panels and filtered tables change without being announced.
   - "Accessibility review" appears only as a check (plan line 87). No task carries it.
2. **The design is wrong: form-control borders are too faint (WCAG 1.4.11).** Inputs, selects, `.seg`, `.chip` and `.leg` use `--line` against `--surface`. That measures 1.33:1 light and 1.79:1 dark; the minimum is 3:1 (styles.css:120, 122, 126, 152). The plan adds four filters and sortable headers, and it says new classes "use existing tokens" (plan line 32), so the failure spreads.
3. **The design is wrong: switched-off legend chips are unreadable.** `.leg[aria-pressed="false"] { opacity: .4 }` gives 2.38:1 light against a 4.5:1 minimum (styles.css:127). The plan hides four network layers by default, "one click away in the legend". Those chips will now render at this contrast on first load.

The build also didn't follow the design: the tabs have no `aria-controls`, no arrow-key movement and no `aria-labelledby` (app.js:246-256; index.html:24-50). The plan's task 1 changes the tabs and doesn't list this.

TOP IMPROVEMENTS
1. Add a short spec to tasks 3, 4 and 7:
   - Dot plot: `role="img"`, with an `aria-label` that states n and the range. The table plus the four selects are the full equivalent, so the dots can stay click-only shortcuts.
   - Sortable headers: `<th aria-sort>` with a `<button>` inside.
   - Count line: `aria-live="polite"`.
   - Cards: `<summary>` text should be the company name plus its status.
2. Add one token, `--control-edge`, at 3:1 or better in both themes for control borders. Show switched-off chips with a strike-through or an outline instead of opacity, keeping the text at 4.5:1 or better.
3. Status should not rely on colour alone. Give the dot plot's never-voted strip text labels or different shapes per status. Keep topic visible in the table's text; this is fine as planned.

OUT-OF-FIELD NOTES
- The new header line drops "Every fact links to its source", which PRODUCT.md:15 names as the first-ten-seconds message. That file is the owner's, so it needs her call.
- "Support = for ÷ (for + against)" has to match how each filing reports abstentions. That's for the Data accuracy reviewer.
- DESIGN.md:80 lists the `.coming` placeholder as a component. Task 11 should remove it along with the Data center water tab.

CONTENT RULES: PASS. The plan's copy contains no vote recommendation, advice or implied affiliation. It keeps the informs-not-coordinates footer and the "not a legal opinion" line. Withdrawn and excluded reasons are shown only when sourced, with "Reason not documented" otherwise.

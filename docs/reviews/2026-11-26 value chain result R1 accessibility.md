REVIEWER: Accessibility SCORE: 77 VERDICT: REVISE

TOP FAILURES
1. Screen readers can't reach the company buttons. The SVG has `role="img"` (valuechain.js:65), so browsers treat its children as presentational. The company `<g role="button" tabindex=0>` nodes inside it (valuechain.js:80) still take Tab focus but have no accessible role or name, and nothing else on the page opens a company panel: the List view rows are plain text (valuechain.js:165). This fails 4.1.2 and leaves company panels unusable with a screen reader. Fix: give the SVG `role="group"` with an aria-label instead of `role="img"`, or make the company names in the ties table into buttons.
2. The focus ring disappears on the dark heatmap cells. The global `:focus-visible` outline is `--accent` #1f5f99 at a 2px offset (styles.css:28), so it is drawn on the cell fill. I measured 1.27:1 on step 4 (#2f6fb0) and 2.31:1 on step 5 (#0b2545) against the 3:1 minimum (1.4.11 / 2.4.7). The 46, 49, 70 and 6 cells in phone-light-tab.png are affected. Fix: `.vc-num.on-dark:focus-visible { outline-color:#fff }` or an inset ink ring.
3. Two tie types share one dash pattern, so the line encoding can't tell them apart. "leases capacity to" and "provides compute to" are both `"4 4"` (valuechain.js:16). The key shows the same mark twice (phone-light-tab.png), so line style alone cannot separate them (1.4.1). Plan R2 said "Dash patterns are more distinct". Fix: give each a unique pattern, or merge them under one label.

Passes I measured: ink #111 on the three light steps is 17.06, 14.44 and 10.91:1; white on #2f6fb0 is 5.22:1 and on #0b2545 15.39:1. The tab follows the WAI pattern: `aria-controls`/`aria-labelledby`, `tabindex=-1` (index.html:35, panel line 51). The heatmap is a real `<table>` with a caption, `scope` row/col headers, cell labels such as "Tier: n label, open details", and zero cells as plain text. Focus moves to the panel or section heading, and `#vc-status` is polite and one line.

TOP IMPROVEMENTS
1. The tier chips have no `aria-pressed="false"` until the first click (valuechain.js:30), so they aren't exposed as toggles at first. Add Esc or a Clear button that resets the fade and returns focus to the control that opened the panel. R1 asked for this; it isn't built.
2. At 390px the heatmap clips columns, the first column isn't sticky, and neither `.table-wrap#vc-heat` nor `.chart-scroll` is a named, focusable scroll box (valuechain.js:33,39). Match Fund votes: `tabindex=0`, an aria-label and `.sticky-col`.
3. Clicking the same tier twice writes the same status text, which is not re-announced (valuechain.js:136). The company panel's h4s have no ids or `tabindex`, unlike the tier panel's. There is no automated axe test for `#value-chain`; only the lens4 spec covers the tab.

OUT-OF-FIELD NOTES
- The heatmap caption shows internal file paths ("data/value_chain_ties.json", "scripts/build_value_chain.py") through `derived_note` (valuechain.js:38).
- The plan said "a table of all ties … sortable by type", but the List view is unsortable static text (valuechain.js:166).
- The sticky tab bar overlaps the chart in phone-light-tab.png. Check whether that is only a full-page screenshot artefact.

CONTENT RULES: PASS. Every panel item carries its source link. Capped lists are labelled "Showing x of y", "the 12 most active" and "up to 20", and never counted. The median and the tier classification are marked as this site's computation or reading. The wording avoids "target" and "influence", and the caption says the rows overlap and that this is not a recommendation.

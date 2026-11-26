REVIEWER: Accessibility SCORE: 72 VERDICT: REVISE

TOP FAILURES
1. Clickable tier headers and companies are not specified as real, keyboard-reachable controls. The plan says only "clicking a tier header or a company opens a panel under the chart" (plan, Visual 1, Interaction). The comparable chart shows the risk: pathways.js:59-80 draws SVG `<g>` nodes that respond to `.on("click")` only, with no tabindex, role or key handler, and the column titles are plain SVG `<text>` (pathways.js:60). There, keyboard users get by through the HTML lab chips (pathways.js:57). Visual 1 has no such chips, so tier panels and company panels would be mouse-only (WCAG 2.1.1). Fix: put the tier headers in an HTML `<button>` row above the SVG, with `aria-pressed` or `aria-expanded`. Make companies reachable as buttons, either in the tie table's From/To cells or as a company chip list.
2. The plan doesn't say how the panel moves focus or what it announces. Pathways puts `aria-live="polite"` on the whole panel (pathways.js:72). The tier panel here has six sections with lists, so a screen reader would read the whole thing out at once. A heatmap cell "opens the tier panel at that section", but the plan doesn't say where focus goes. Fix: give the panel a labelled region with an h3. On open, move focus to the target section heading (tabindex=-1). Put a one-line summary in the `.count-line` live region, not the whole panel. Add Esc or a Close button that returns focus to the control that opened it.
3. The heatmap's contrast and table semantics are left open. "Shaded light to dark blue … number always printed" names no tokens. Ink #111 on `--blue-1` #0b2545 or `--blue-2` would fail. White on `--blue-3` #4f8fcf is about 3.4:1, which fails 1.4.3 for 13px text. The plan also never says `<table>`, `<caption>`, `<th scope="row|col">` or `aria-sort`. Fix: name the fill and text token pair for each step, and keep every pair at 4.5:1 or more. Say it is a real `<table>` with row and column headers. The button label should read as one phrase, for example "Hyperscalers: 3 asks made" (`aria-label` or visually hidden text).

TOP IMPROVEMENTS
1. Line dashes: solid versus long dash versus dashed at a constant width is hard to tell apart on 44 overlapping curves. Make the dash arrays clearly different (e.g. solid, 12 4, 4 4, 1 3, 8 3 1 3), and say that the HTML key shows each pattern next to its label, not colour.
2. Reflow at 390px: state that the 5-column SVG sits in `.chart-scroll` with an accessible name and a focusable scroll box, and that the 8-column heatmap sits in `.table-wrap` with a sticky tier column, matching Fund votes.
3. Tab: confirm `tabbtn-value-chain` / `tab-value-chain` use `aria-controls`, `aria-labelledby` and `tabindex=-1`, and that the arrow-key loop (app.js:582) picks up the 12th tab. Add `value-chain` to the every-tab axe test, not only the visual test.

OUT-OF-FIELD NOTES
- "Strategic investors as a band under frontier labs" makes 6 tiers in 5 columns. Check that the flow's ordering doesn't imply investors are downstream of labs.
- The "44 ties" in the plan must come from the data on the page, not be typed into copy (DESIGN rule 5).
- Panel labels such as "Who this tier reaches" sit close to Never claim 1–2. The UX/content reviewer should check the exact wording.

CONTENT RULES: PASS. The plan sources every panel item from `per_tier` with links, avoids "target" and "influence", and labels the tier classification and the median as the site's own reading. Nothing new is invented at plan stage.

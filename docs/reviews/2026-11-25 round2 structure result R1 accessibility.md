REVIEWER: Accessibility SCORE: 86 VERDICT: PASS

I checked this by reading the code and the screenshots, and by computing WCAG contrast in python3 on the token values. I didn't run a screen reader. Most of the Revision 2 spec is built as designed:
- **Tabs** follow the WAI pattern: `aria-controls`, `aria-labelledby`, roving tabindex, and Left/Right/Home/End keys (index.html:24-36, app.js:546-574).
- **Sortable headers** use `<th aria-sort>` with a `<button>`, and focus returns to the header after a sort (app.js:62, 75).
- **Count lines** are `aria-live="polite"`.
- **Dot plot** has `role="img"` and an `aria-label` with n and the range (app.js:362-363).
- **Contrast:** `--control-edge` is 3.45:1 on white. Switched-off legend chips are struck through with dashed borders and `--ink-soft` text at 7.46:1. Every `--n-*` colour reaches 3:1 or more (lowest: pension 3.56, manager 3.77).
- **Graph settings:** each range input sits inside a `<label>` with its `<output>` (graph.js:148-149).
- **Reduced motion** is respected in CSS (styles.css:31), in the graph layout and zoom (graph.js:6, 102) and in row scrolling (app.js:383).

TOP FAILURES
1. **The build didn't follow the design: toggle buttons report the wrong state.** In graph.js:441-443 the Graph/List handler selects every `.seg button` on the page and sets `aria-pressed` on all of them. That includes Causality's Trace group and the scorecard's Pillar and Sort groups. After one Graph/List click, those groups announce "not pressed" for every button, including the selected one (WCAG 4.1.2). The fix is to scope both selectors to `#tab-network`.
2. **The build didn't follow the design: network nodes can't be focused.** The plan says labels show "on hover and focus", but graph nodes have no tabindex or key handler (graph.js:379 is click only). The List view is a full text equivalent, so this doesn't block. It does break the spec.
3. **Minor ARIA issues:**
   - The network graph `<div>` has an `aria-label` but no role, so screen readers ignore the name (graph.js:222). Give it `role="img"` or `role="group"`.
   - The List-view table headers have no `scope` (graph.js:415).

TOP IMPROVEMENTS
1. Each `<output>` is implicitly a live region, so every slider step is announced twice. Add `aria-hidden="true"` to each output, or set `aria-valuetext` on its slider instead.
2. With zero voted proposals, the dot plot's `aria-label` would read "undefined% to undefined%" (app.js:363). Guard the empty case.
3. Make the slider's label text static, so the accessible name doesn't change as the value changes.

OUT-OF-FIELD NOTES
- The build has 11 tabs with different labels ("Contacts", "Co-filer network", "Lab pathways"), but the plan's Revision 2 specifies 9 tabs. Each panel's H2 ("Network") no longer matches its tab label.
- On the phone, network node labels overlap, and the "COMPANIES"/"FRONTIER LA…" column headers collide (tests/screenshots/phone-light/network.png).
- tests/screenshots still has dark-theme folders and old why/water/weigh-in images, though the site now has one theme.

CONTENT RULES: PASS. The footer keeps "informs, does not coordinate votes" and the "no investment, legal or tax advice" line. The header restores "every fact links to its source" (app.js:604). The chart reference line reads "50% of for + against", not "pass".

REVIEWER: Accessibility SCORE: 84 VERDICT: PASS

TOP FAILURES
1. **Switching to the Individual lens announces the wrong thing.** `setLens` calls `setFeedView(...,false)` at graph.js:1070, then overwrites `#net-lens-status` at graph.js:1079 with "Individual investor view… N of M nodes shown". The graph is hidden at that point, so screen-reader users hear about nodes when the page is actually showing the proposal list. When the lens has a feed, announce the list instead (WCAG 4.1.3, status messages).
2. **The graph-switch announcement can be untrue.** graph.js:455 always says "your holdings are highlighted", even with no tickers or only a fund entered. The plan (Rev 2) says nothing is faded in that case, and the live line already says so at graph.js:439. The announcement should match the live line. Also, the announcement and the `.focus()` call on line 456 happen in the same tick, so the focus change can cut the polite message off on some screen readers.
3. **Fund filing links may overflow at 390 px.** At graph.js:420 the links "[Vanguard Form N-PX filing 1]" use `.src` with `white-space: nowrap` (styles.css:90). The panel and path areas already override this (styles.css:211, 225), but the feed doesn't. The screenshot fits, but a longer family name or label could cause horizontal scrolling (1.4.10, reflow). Add `.feed-item .src { white-space: normal; }`.

TOP IMPROVEMENTS
1. **The plan's other points are in place.** The disclosure terms match the plan: unique ids (`termSeq`, graph.js:354–359), Esc calls `stopPropagation` and returns focus (graph.js:390–398), the definition is inline (`display: block`), nothing shows on hover, and the term buttons sit outside links. Focus moves correctly in both directions and the test covers it (lens3.spec.js:60–73). The form has `role="search"`, a visible label, `aria-describedby` on the hint and a submit button. Each item is an `<li>` with a heading, dates use `<time>`, and links carry hidden context. Contrast is fine: #555 on white is 7.5:1 and #1f5f99 is about 6.9:1.
2. **A focused control may sit under the sticky tab bar.** The sticky `.tabs` bar (styles.css:45) can cover a focused control after `focus()`. The phone screenshot shows the tab bar laid over the input. Add `scroll-padding-top` so focused controls stay visible (2.4.11 in WCAG 2.2; it's a good habit even under 2.1).
3. **Repeated term buttons lack context.** "Proxy statement" and "Form N-PX" repeat in every item, so add `aria-describedby` pointing at the item's h4 or hidden text. The Esc-from-definition branch (graph.js:392) can never fire because `.term-def` isn't focusable. That's harmless, but either make the definition focusable or drop the branch.

OUT-OF-FIELD NOTES
- Company headings are h4 rather than the h3 the plan names. The hierarchy is still valid (h2 > h3 feed > h4 > h5), but DESIGN.md should record it.
- In the screenshot the "Show" button looks clipped at the right edge. It may be the capture; check it at 390 px (UX/build).
- DESIGN.md:15 says "one white theme", but the brief says the checks run light and dark, so the docs and the check disagree (docs).

CONTENT RULES: PASS. No vote advice is given, the disclaimer is quoted once, and fund lines keep their N-PX source links and the "matched automatically, not yet reviewed" note. Glossary definitions are limited to this lens, as the Rev 2 exception allows. One wording issue: "your holdings are highlighted" (failure 2) can state something untrue.

REVIEWER: Accessibility SCORE: 78 VERDICT: REVISE

TOP FAILURES
1. **The Play button changes its name and also uses `aria-pressed`.** graph.js:343, 1274 and 1325–1326 set the text to "Pause" and `aria-pressed="true"` together, so a screen reader announces "Pause, toggle button, pressed", which contradicts itself (WCAG 4.1.2 name and state). The fault is in the design: plan Revision 2 asked for both, and the build followed it. tests/lens4.spec.js:79–82 locks the pattern in. Fix: either keep the name "Play" and use `aria-pressed`, or change the name with no `aria-pressed`.
2. **The List view (the graph's text equivalent) is capped by the scrubber, which it cannot see or control.**
   - The scrubber sits inside `.net-graph-wrap` (graph.js:340–346), which is hidden in List view (graph.js:1374).
   - `baseVisible` still applies `state.upto` (graph.js:632), so the table silently drops later proposals.
   - The List view count line (graph.js:1185) doesn't mention the cap.
   - A screen-reader or keyboard user who opens the list after `?upto=` loads, or after a scrub, gets fewer rows with no stated reason and no way to change it (1.3.1, 3.3.2).
   - Fix: move the scrubber outside the graph wrap, or state "up to {year}" in `#net-list-count`.
3. **The panel puts the ask's details before its name.** graph.js:582–585 renders the "This ask" `<h4>` section ahead of the eyebrow and the `<h3>` node name. Screen-reader and heading navigation therefore meet the detail before learning which ask it describes, and the heading levels run out of order (1.3.1, 1.3.2). The phone screenshot phone-light-scrubber-min.png shows the same order visually. The order was there before this phase, but in this lens it now carries the core content.

TOP IMPROVEMENTS
1. When the cap clears the selected node, the panel message (graph.js:1307) isn't in a live region. Add it to the `#net-scrub-status` text.
2. Add tests for three things:
   - in this lens, ask nodes come first in keyboard order (graph.js:1026);
   - the `#net-kb` announcement includes the coverage mark;
   - under reduced motion, a scrub step doesn't pan or animate.
3. The comment and the plan say `--gn-ask` measures 13.5:1. I measured **11.18:1** on #1e1e1e. It still passes, but correct the stated figure. My other measurements:

   | Colour | Background | Ratio |
   |---|---|---|
   | `--g-ring` #7dd3fc | #1e1e1e | 10.0:1 |
   | `--g-risk` #fdba74 | #1e1e1e | 9.89:1 |
   | ring-note `--accent` | white | 6.66:1 |
   | chip border #8a8a8a | white | 3.45:1 (meets the 3:1 rule for non-text) |

   The coverage rings (r+9: solid, dash `8 3`, dotted `1 3`) differ from the Upcoming vote ring (r+6, `4 2`), and their glyphs (● ◐ ○) are hidden from screen readers with `/ ""`. That part is good.

OUT-OF-FIELD NOTES
- In phone-light-scrubber-min.png the sticky tab bar overlaps the middle of the graph. This is probably a full-page screenshot artifact; check it.
- Ask nodes print "source pending" under the mark (graph.js:579, the else branch). An ask grouped by this site isn't an unsourced fact, so the label may confuse readers.
- In tests/lens4.spec.js the "not yet assessed" fixture test exists, but nothing tests the solid "covered" ring.

CONTENT RULES: PASS.
- Every coverage mark carries "this site's reading, not yet confirmed by a person" (lenses.js:387, 475).
- An ask with no entries reads "Coverage not yet assessed", never "no rule" (lenses.js:341).
- The average is labelled as computed by this site, and nothing is called a "commitment".
- WCAG 2.1 AA (rule 9) is at risk until failures 1 and 2 are fixed.

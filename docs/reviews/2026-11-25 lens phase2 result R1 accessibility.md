REVIEWER: Accessibility SCORE: 84 VERDICT: PASS

The build follows plan Revision 2 on the main points:
- **Marks:** each is stated in text in the panel (`.ring-note`), the List Status column and the `#net-kb` announcement (lenses.js impactRings; graph.js:759-761). They also differ by radius and dash, not only colour (graph.js:193-208).
- **Holdings region:** `aria-expanded` and `aria-controls` are set, focus moves to the textarea, Esc returns focus to the button, the label is visible, and `#net-hold-status` is a persistent live line set with textContent (graph.js:76-85, 247-266).
- **Gap toggle:** `aria-pressed` is set and the change is announced in `#net-lens-status` (graph.js:311, 315). Gap nodes are real nodes, so they are in keyboard order.
- **Pulse:** two runs of 2.5s, only under `prefers-reduced-motion: no-preference`, and there is a settings toggle (styles.css diff; graph.js:59).
- **Contrast on `--g-bg` #1e1e1e (measured):** `--g-window` 11.9:1, `--g-seeking` 8.8:1, `--g-risk` 9.9:1, gap outline `--g-label-soft` 6.5:1.

TOP FAILURES
1. **The holdings fade has no text cue for filers and other nodes.** `held(d)` is false for every node without a ticker, so all filers, gap nodes and people fade to 15% (graph.js:137, 144). Their labels are hidden (graph.js:168). But "not held" is only announced for companies and proposals (graph.js:759). The List "Held" column shows "–" for these nodes (graph.js:456). A faded node can drop to 1.3-1.6:1 with nothing saying why. Either don't fade nodes without a ticker, or state it.
2. **The pulse restarts on every redraw.** `drawRings()` runs from `applySettings` (graph.js:274), and so on every settings slider input, and again in drawGraph (lines 848 and 931). Each run rebuilds the circles with the `g-pulse` class. The motion starts again after each user action. That is user-triggered, so it is not a strict 2.2.2 failure, but it keeps flashing while someone drags a slider. Add the class only on the first draw.
3. **The warm path summary is announced twice and not fully tested.**
   - Focus moves to `#net-path-sum` and `say(sum)` also writes `#net-kb` (graph.js:407-409), so screen readers read it twice.
   - The summary is a `<p tabindex="-1">`, not the result heading the plan asks for (plan line 173).
   - Esc-clears-path has no test (tests/lens2.spec.js:127-139 covers found and no path only).

TOP IMPROVEMENTS
1. Add tests:
   - the warm-path Esc returns focus to `#net-path-go`;
   - gap nodes are reachable with ↓ in the graph, not just as List rows;
   - the pulse class is absent under `reducedMotion: "reduce"`.
2. The `.ring-note::before` glyph is the same "◌" for every mark (styles.css:230). Give each mark its own glyph, or drop it, so the panel's marks are not told apart by colour alone.
3. When the Impact lens is switched off while gaps are on, "Topics not filed hidden" and the lens message both write `#net-lens-status` (graph.js:478, 939). Merge them into one line.

OUT-OF-FIELD NOTES
- desktop-light-gaps.png is stale: its panel shows "source pending" and "missing · no source", but graph.js:98 and :107 at 50ef813 render "topic not filed" and the scope note. Retake the screenshots.
- Only light screenshots were copied to docs/design/lens-phase2. No dark ones are included, although rule 27.6 runs the tests in both themes.
- Holdings matching treats `;` and spaces as separators (graph.js:261), but the label only says "commas or new lines".

CONTENT RULES: PASS. The resubmission lines carry "this site's reading; thresholds may change". Exempt-solicitation asks are filtered out. Gap lines state the dataset scope. Vote lines give facts and never a direction.

REVIEWER: Accessibility SCORE: 74 VERDICT: REVISE

The plan meets most of the accessibility asks. Every aura is also given in text: the panel, the List view's Status column and `#net-kb` (plan lines 54, 90–91). The pulse keyframes sit inside `prefers-reduced-motion: no-preference` (line 102). The new tokens must reach 4.5:1 on `--g-bg` (line 102). Rings differ by dash and by radius (line 93). The warm-path control is a native `<select>`, and focus moves to the result (line 92). What it does not specify is focus handling and announcements for the three new controls, and that gap is what blocks.

TOP FAILURES
1. **The seeking ring collides with the Phase 1 ring.** Plan line 93 lists window, seeking, focus and risk, but leaves out the Phase 1 "Upcoming vote" ring. That ring is already dashed (`4 2` in `--g-ring` at r+4, graph.js:474), and the Impact lens still uses it (lenses.js:127). A dashed amber seeking ring next to a dashed cyan upcoming ring separates by colour alone. The window ring at an unstated radius could also overlap the focus mark at r+2.5 and r+4.5 (graph.js:483–484). The fix: one table of ring radius, dash and token for all five marks. Also check that green `--g-window` and amber `--g-seeking` stand apart from `--gn-manager` #4ade80 and `--gn-tier-chips` #fbbf24 (styles.css:171,174).
2. **No focus or keyboard plan for the holdings panel and the gap toggle** (lines 61–64, 66). The plan doesn't say:
   - that the "My holdings" button has `aria-expanded` and `aria-controls`;
   - where focus goes when the panel opens and closes, or that Esc returns it to the button;
   - that the textarea has a visible label;
   - that the "Holdings: 4 tickers…" line is a live region that persists (the Phase 1 R1 finding about innerHTML live regions, graph.js:637);
   - that "Show gaps" is a button with `aria-pressed` whose change is announced, as `#net-lens-status` does for lenses.
   It also doesn't say whether faded and ghost nodes are in `kbOrder()` (graph.js:494). A ghost node a keyboard user can't reach, or a faded node read out with no "not held" cue, both fail.
3. **The pulse runs with no way to stop it.** A 4s pulse on every open-window node starts on its own and never ends. Under WCAG 2.2.2 (Pause, Stop, Hide) the pulse needs a pause control or must stop after about 5 seconds, even when reduced motion is off. A Graph settings toggle such as "Animate filing windows" would meet this.

TOP IMPROVEMENTS
1. **Warm path keys and focus:** say what Esc does inside the panel. Today Esc on the graph clears the whole selection (graph.js:528). Name the focus target (a result heading with `tabindex="-1"`) and where focus returns after "Clear path". Announce "Path found: 4 steps" or "No path in this map" in `#net-kb`.
2. **Contrast to measure:** the ghost node's dashed outline and the "!" glyph each need 3:1 on `--g-bg` (WCAG 1.4.11). Test the risk bar and "!" at 15% fade too.
3. **Tests:** add an axe or keyboard test for the holdings panel (open, type, Apply, Esc, focus returns) and for the gap toggle's `aria-pressed`.

OUT-OF-FIELD NOTES
- The `localStorage["holdings"]` reads and writes need try/catch, as the settings code has (graph.js:222).
- "Comparable = same tier" over 7 companies is thin. The data reviewer should check the gap wording.
- The plan has no line asking for a screen-reader check of the new count lines and their wording.

CONTENT RULES: PASS. Resubmission wording is "this site's reading (rules.js)" and never "the SEC requires" (lines 45, 86). Vote lines name the meeting, not a direction, and `board_rec` is excluded from actions (lines 84–85). Data comes from data files with sources, and `vote_history` is not inferred (line 22).

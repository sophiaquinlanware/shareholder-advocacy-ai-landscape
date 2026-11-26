# Type and blue result, review R1: visual design and accessibility

Reviewer: subagent, 2026-11-26. Saved verbatim.

Result review R1, type and one blue (commit 95052b3): visual design and accessibility

Score: 76/100 (FAIL). The type and the one blue are done well. The two owner additions cause the failure, at 390 px.

R1 findings, checked against the code:
- 1 (40% tint fails 3:1): fixed. Filer lines, filer dots and unchosen bars now use `--blue-mid` #7995c1.
- 2 (network key): resolved. The key shows canvas colours, and only proposal and cloud share the blue (accepted).
- 3 (topic shapes): partly fixed. See finding 4.
- 4 (heatmap steps): fixed. The steps are now tokens `--heat-1…5`.
- 5 (selection hidden on blue nodes): fixed. The blue-node outline is now `--g-label-soft`, and selection is a 2.5px white stroke.
- 6 (ask and downstream-use the same tint): fixed. They are now #d2dcea and #a5b8d6, which are close but readable.
- 7 (scope of "every blue"): not fixed. Indigo, cyan and teal still appear in `--n-person`, `--n-response`, `--n-tier-datacenters` and `--gn-response`, and nothing says why.
- 8 (fonts): partly fixed. Only 400 and 500 load, and `font-synthesis-weight: none` is set. There is still no metric-matched fallback.
- 9 (hard-coded blues): fixed.

New findings:
1. **At 390 px the sticky bar takes about 275 of 800 px (34% of the screen).** It holds the title plus five rows of tabs (ty-m-people-scrolled.png). Fix: under 640px, show only the sticky title and the selected tab, or scroll the tab row sideways inside the bar. The goal is a bar no taller than about 100px.
2. **Focus not obscured (WCAG 2.4.11).** `scroll-padding-top: 120px` is less than the stuck bar's height on mobile (about 275px), and on desktop it only just covers it (about 118px). Fix: set the padding from the bar's real height, or fix the height first (finding 1).
3. **The hover underline stays on after a tap on touch screens.** In the mobile screenshot "POLICY AND CAUSALITY" is underlined next to the selected "CONTACTS", so two tabs look selected. Fix: wrap the `:hover::after` rule in `@media (hover: hover)`. On desktop, a hovered tab is hard to tell from the selected one (1px versus 2px underline, both black text). Keep hovered text grey, or make the selected underline 3px.
4. **Topic keys are now the same three blue circles.** `.topic-tag .dot` is round at 10px, and `--tp-dc/se/gov` are all #1f4e98. Fix: use the plot's circle, square and triangle shapes in the tags and keys.
5. **Small regular-weight labels.** Some are still 10–11px: the value-chain capital label (10px), the graph axis (11px), the mobile `td::before` labels and `sup.fn`. Fix: raise them to 12px.
6. **Housekeeping.** DESIGN.md and docs/STATE.md have uncommitted changes. Commit them with the fixes.

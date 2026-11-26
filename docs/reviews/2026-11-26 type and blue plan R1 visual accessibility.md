# Type and blue plan, review R1: visual design and accessibility

Reviewer: subagent, 2026-11-26. Saved verbatim.

Score: 72/100 (FAIL). The typography half is sound. The one-blue half has a contrast failure and two places where colours that carry meaning would merge.

Contrast checks (computed): #1f4e98 is 8.07:1 on white and 2.07:1 on #1e1e1e. #6b6b6b is 5.33:1 on white and 4.54:1 on #e9edf5. #a5b8d6 is 2.01:1 on white and 8.28:1 on dark. #dcddde is 5.94:1 on #1f4e98. White text is 5.52:1 on the 85% heatmap step and 8.07:1 on the 100% step. These match the plan's figures.

1. **The 40% tint fails WCAG 1.4.11 on white (2.01:1).** It is used for Lab pathways' filer lines and dots and for the unchosen bars, which are meaningful graphics, so they need 3:1. Fix: use a 60% tint, #7995c1 (3.05:1). Or keep #1f4e98 and tell the two apart by line width or opacity of the line. Keep #a5b8d6 only on the dark canvas.

2. **The network key on the white page uses `--n-*` (graph.js:38).** Company, proposal, chips, compute and cloud would all show as #1f4e98, five identical dots. DESIGN says types "read straight off the key". Fix: give each of the five merged types its own shape or dash in the key and on the canvas, or list them as an accepted trade-off.

3. **The proposals dot plot topics are not in the plan.** `--tp-dc/se/gov` are `--blue-1/2/3` (styles.css:147), so the plot becomes shape-only. Fix: say so, enlarge the marks to at least 8px so the shapes can be told apart, and update the DESIGN "shade and shape" line.

4. **The heatmap steps are too close together.** Neighbouring steps differ by only 1.22, 1.45, 2.74 and 1.46. Fix: use 10/30/55/80/100% (#e9edf5, #bccae0, #849ec6, #4c71ad, #1f4e98) so the spacing is more even.

5. **The dark canvas outline collides with the selected state.** graph.js:714 strokes the selected node white (`--g-focus`), and #dcddde against white is 1.16:1, so selection would disappear on blue nodes. Fix: make selection a 2px ring (the existing fm-ring) or a thicker stroke.

6. **Asks (`--gn-ask`) and the downstream-use category would both become #a5b8d6.** Fix: give one of them another tint or a dashed ring.

7. **"Every blue" is not scoped.** The plan doesn't say whether indigo and cyan count: `--n-person`, `--n-response`, `--n-tier-datacenters`, `--g-ring` and `--gn-response`. Fix: list which tokens stay.

8. **Fonts.** Load only 400 and 500, and add `font-synthesis-weight: none`, because faux bold appears wherever 600/700 is still asked for (selected graph label, `.status-n`, `th`, `summary`, `legend`). Add a fallback with metric overrides (size-adjust) to limit swap CLS, and update the preload URL and the comment in index.html.

9. **Hard-coded blues.** Small items:
   - Fix the fallback in valuechain.js:12.
   - Move the heatmap STEPS in valuechain.js:208 into tokens.
   - Set the uppercase chart titles to at least 12px; regular 400 at 11px is faint.

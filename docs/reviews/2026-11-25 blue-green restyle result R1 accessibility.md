REVIEWER: Accessibility SCORE: 84 VERDICT: PASS

TOP FAILURES (max 3, each with evidence)
1. **The build didn't follow the design: under reduced motion, the scorecard hover scale still applies.** The reduced-motion block sets `.sc-cell:hover { transform: none }` at `styles.css:56`. But `.sc-cell:hover { transform: scale(1.12) }` at `styles.css:185` has the same specificity and comes later in the file, so it wins. DESIGN.md:67 says the scale is turned off. Severity is low: transitions are forced to 0s, so the cell snaps rather than animates. Fix: move the override after line 185, or add `!important`.
2. **The design is incomplete: resting lines on pathways and the causality map are below 3:1, and only the network has a named text equivalent.**
   - Blended contrast I measured on `--surface`, pathways at 0.35 opacity (`pathways.js:135`): 1.46 to 1.77 in light, 1.93 to 2.53 in dark.
   - Causality at 0.55 (`causality.js:107`): 1.85 to 2.58 in light.
   - This build also makes those lines thinner: ×0.8 (`pathways.js:120`) and 1.6 to 1.3 (`causality.js:88`).
   - DESIGN.md:60-62 names the list view as the text equivalent for the network only.
   - The pathways side panel lists ties per selection (`pathways.js:152-154`), but only after the reader picks a lab or company. Nothing documents that it is the equivalent.
3. None blocking beyond these two.

**What now passes from my plan review (python3, WCAG luminance):**
- Every graph palette colour is 3:1 or more on `--surface` and `--bg` in both themes. The weakest are `--n-foundation` and `--t-commercial` in light: 3.41 on surface, 3.16 on bg.
- In light, `--n-proposal` is 3.93, `--n-person` 4.56 and `--sc-partial` 4.06.
- `--sc-silent-edge` is 3.93 in light and 4.51 in dark, so the silent cell's boundary passes even though its fill is 1.21.
- Partial is hatched and silent is outlined (`styles.css:182-183`, visible in phone-light/parnassus.png), which fixes the hue-only problem under WCAG 1.4.1.
- `:focus-visible` is in, with an `--ink` outline on pressed accent-filled controls (`styles.css:52-53`).
- The network skips the zoom animation and pre-settles its layout under reduced motion (`graph.js:6, 171, 260`).
- Focused network links reach 5.18 in light and 7.29 in dark.
- All text pairs are 4.5:1 or more. The lowest is `--narrow` on `--narrow-bg`: 4.77.
- Lighthouse reports 100 and the 390px layout checks pass.

TOP IMPROVEMENTS (max 3)
1. Fix the cascade order in failure 1.
2. In DESIGN.md, name the text equivalent for the pathways and causality lines (the panel or a table), or raise their resting opacity to about 0.6 in dark, which reaches 3:1.
3. Add one keyboard-focus screenshot per theme. The focus outline is in the code but no screenshot shows it, so I could not confirm it visually.

OUT-OF-FIELD NOTES (max 3, one line each)
- The fallback `@font-face` metrics are estimates (`styles.css:39-44`), so layout shift (CLS) still needs measuring.
- Graph SVG nodes still have no tabindex, so keyboard users still depend on the tables.
- `biome.json` raising `useButtonType` from warn to error is a good guard against untyped buttons coming back.

CONTENT RULES: PASS. No data, wording or site name changed. The diff is styling, line geometry and `type="button"` attributes only.

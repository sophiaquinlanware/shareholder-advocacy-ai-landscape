REVIEWER: Accessibility SCORE: 72 VERDICT: REVISE

TOP FAILURES (max 3, each with evidence)
1. **The design is wrong: the categorical palettes kept from today fail 3:1 against the new surfaces.** I measured with python3 (WCAG relative luminance).
   - Light, on #ffffff: `--n-proposal` #9aa39f is 2.59, `--n-person` #d4a017 is 2.38 (`styles.css:96`), `--sc-partial` #d9a441 is 2.25 and `--sc-silent` #e4e0d8 is 1.32 (`styles.css:147`).
   - Dark, on #071e25: `--sc-silent` #2e3532 is 1.37. `--sc-met` against `--sc-partial` is 1.05, so the two differ by hue alone, which fails 1.4.1 for colour-blind readers (`styles.css:148-149`).
   - `--n-person` also fills the "public" lane nodes on the causality map (`causality.js:95`).
   - The plan says the palettes are "Kept this round" and also "adjust only a colour that fails". Those can't both hold, because these colours fail.
2. **The design is wrong: graph lines drop below 3:1 and get thinner.**
   - Network links are `--ink-soft` at stroke-opacity 0.35 (`graph.js:187`). That blends to 1.71 in light and 2.18 in dark.
   - Task 3 drops the stroke to 0.9, and task 4 scales the other line weights by 0.75.
   - Lines are how this site shows relations. If they stay faint, the plan needs a text alternative it can point to, and the network list view (`graph.js:261`) is the only one today.
3. **The design is missing: focus and reduced motion aren't in the plan at all.**
   - `styles.css` has no `:focus`, `:focus-visible` or `prefers-reduced-motion` rule (grep returned nothing).
   - Motion runs regardless of the setting: the 500 ms zoom (`graph.js:163`), the force simulation (`graph.js:233`), and `.sc-cell:hover` scale (`styles.css:164`).
   - Every control on `--accent` fills relies on the browser's default focus ring. That includes `.seg button[aria-pressed=true]` (`styles.css:104`) and `.chip[aria-pressed=true]` (`styles.css:133`).
   - PRODUCT.md's Accessibility line requires visible focus outlines and respect for reduced motion.

What passes: every text pair in the plan's table matches my measurements, within 0.1. White on `--accent` is 6.34 in light, and `--surface` on `--accent` is 11.35 in dark. `--narrow` text on `--surface` is 5.57. The phone column rules (`styles.css:119-123, 169-173`) are unchanged.

TOP IMPROVEMENTS (max 3)
1. Retune `--n-proposal`, `--n-person`, `--sc-partial` and both `--sc-silent` values to at least 3:1 against `--surface`. Give the silent cell a visible border, and give partial a pattern or glyph so it doesn't depend on hue.
2. Add one `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }` rule, plus an inverted outline for accent-filled controls. Add a `prefers-reduced-motion` block that sets transition duration to 0, stops the simulation and removes the scale.
3. Keep network edges at 3:1 or more when a node is highlighted (0.9 opacity already passes). Write down that the list view is the text equivalent of the faint resting edges.

OUT-OF-FIELD NOTES (max 3, one line each)
- The plan's line citations are off by 1–2 lines: `--n-*` is at 96–98, `--t-*` at 126–128, `.card` at 58, `.net-graph` at 110.
- `.callout` has an 8px radius today (`styles.css:90`), so listing it with the 10px items is wrong.
- Graph SVG nodes have no tabindex (`graph.js:224-236`), so keyboard users depend on the table views.

CONTENT RULES: PASS. The plan changes no data, wording or facts, and the site name is unchanged.

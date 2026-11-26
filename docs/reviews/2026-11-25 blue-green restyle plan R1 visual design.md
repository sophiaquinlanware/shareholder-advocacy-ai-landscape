REVIEWER: Visual design SCORE: 76 VERDICT: REVISE

TOP FAILURES (max 3, each with evidence)
1. **Design wrong: the "open" status uses the same colour as the accent.** In dark mode `--open` and `--accent` are both #7fe3d6 (plan, token table). In light mode #1e6e5a and #0c6a70 have a 1.04:1 ratio (measured). So the rights-map "route open" pill will look the same as links, the active tab and `.seg`/`.chip` selected fills (`styles.css:52,104,133`). In the current tokens they differ (#2f7d55 vs #1f5c4a). Give open its own hue, for example a green-teal clearly apart from the accent.
2. **Design wrong: the heading weights flip the hierarchy.** The plan sets h3 to 500 and h2 to 400 (Type table). Smaller labels stay at 600: eyebrow `styles.css:41`, `dt` 78, pill 72, timeline date 64. Card titles (h3, 20px/500) would then look lighter than the 12px uppercase labels under them. h1 at 300 is fine for display. h3 needs 600, or the labels need to drop to 500.
3. **Design incomplete: the old warm-grey colours stay on the new blue-green ground.** Several palette values are copies of the old base tokens: `--n-company` #1d2321, `--t-parent` #4d5552 / #a9b1ad, `--sc-silent` #e4e0d8 / #2e3532, `--n-proposal` #9aa39f (`styles.css:96-98,126-128,147-149`). Task 5 only tests 3:1. That will flag `--sc-silent` (1.32 light / 1.37 dark) and `--n-proposal` light (2.59), but it won't fix hue mismatch in colours that pass. These are neutral roles, not categorical ones, so retint them now, or point them at `--ink`, `--ink-soft` and `--line`.

TOP IMPROVEMENTS (max 3)
1. Write down the radius set: 14px for cards and graphs, and decide on callout, lever and controls (8px today, `styles.css:67,90,100`). The plan's radius list includes `.callout`, which is 8px, not 10px.
2. Add a light-blue token. The owner asked for "light blue", but every new token is teal, so light blue is missing from the light theme.
3. Fix the file:line references before building. Headings are at 42-44, not 40-42. The `--n-*` and `--t-*` palettes are at 96-98 and 126-128. Pathways stroke is at 119, not 110/114. The radii are off by 1-3 lines.

OUT-OF-FIELD NOTES (max 3, one line each)
- I re-measured the contrast table and every text pair matches within 0.01. Narrow on narrow-bg in light is 4.77, which passes but is the tightest pair.
- Pathways stroke width encodes data (count of proposals, tie strength, `pathways.js:110,114`), so scaling it ×0.75 has to keep the minimum above about 0.6px.
- The `type="button"` fix is a correctness change folded into a colour round. It's fine, but it should get its own line in the commit message.

CONTENT RULES: PASS (the plan changes no wording or data, and the site name is unchanged).

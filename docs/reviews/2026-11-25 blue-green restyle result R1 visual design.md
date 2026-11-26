REVIEWER: Visual design SCORE: 78 VERDICT: REVISE

TOP FAILURES (max 3, each with evidence)
1. **The design is wrong: the network legend now has two light-theme colour pairs that look the same.** The plan's re-measured values pushed two categories onto their neighbours:
   - `--n-proposal` #6a858b sits next to `--n-other` #6b7280 (styles.css:116). By my calculation the luminance ratio is about 1.23 and both are grey. Before, #9aa39f was clearly lighter.
   - `--n-person` #9a6e00 sits next to `--n-foundation` #a08a1f (about 1.32, both mustard). `--n-foundation` also colours "Company or investor response" (graph.js:44). Before, #d4a017 was a bright gold.
   - In tests/screenshots/desktop-light/network.png, "Proposal"/"Other investor" and "Engagement lead"/"Company or investor response" can't be told apart, either as legend dots or as nodes.
   - Dark has the same problem with person #f2c94c and foundation #d9c25a (about 1.11). That one predates this round and wasn't fixed.
2. **The design is wrong: the greens are now a mix of old and new.** The plan kept the old accent #1f7a5c as `--n-manager` and `--t-equity` (styles.css:116, 146). The new teal-green is #1e6e5a, used for `--open` and `--sc-met`. The rights map and scorecard now use one green, and the network and pathways a slightly different one. The site no longer reads as one palette, and nothing in it explains why two near-identical greens mean different things.
3. **The design is wrong (minor): the headings don't step down in weight.** h2 is 500 and h3 is 600 (styles.css:62-63), so card titles are heavier than the section heading above them. You can see it in why-after-desktop-light.png ("Where leverage still exists" against "Votes against directors"). DESIGN.md:47's reason, that "a heading never reads lighter than the label under it", also doesn't hold for h1 at 300 sitting under a 600 eyebrow.

The build follows the plan. I checked tokens, radii, focus, reduced motion, the network arcs (graph.js:8-12), pathways 0.8× with a floor, causality 1.3, the hatch and the silent outline, and `type="button"`. None of the failures above are build errors.

TOP IMPROVEMENTS (max 3)
1. Base tokens are applied the same way in both themes and on all four tabs I checked. Status pills are now clearly separate from the blue accent (rights-after).
2. The partial hatch and the silent outline make the three scorecard states readable without relying on hue, in both themes (desktop-dark/parnassus.png).
3. All five graph boxes use the single `--radius` token, and the curved, thin lines keep width as a data encoding.

OUT-OF-FIELD NOTES (max 3, one line each)
- The fallback `@font-face` metrics are "estimated" (styles.css:39-40). CLS isn't measured yet, so performance should check it.
- `.leg[aria-pressed=false]` at opacity .4 (styles.css:127) probably drops the legend text below 4.5:1, so accessibility should check it.
- Dark company nodes at `var(--ink)` #e6faf7 are large near-white discs that pull attention from the arcs. That's a question for the chart-type audit in round 2.

CONTENT RULES: PASS (the diff has no wording or data changes; the site name is unchanged)

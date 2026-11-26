REVIEWER: Accessibility SCORE: 72 VERDICT: REVISE

All three failures below are in the plan itself. Nothing has been built yet, so there is no build-versus-plan gap to judge.

TOP FAILURES
1. **Up/Down is announced to nobody.** The plan says the panel is `aria-live`, "so the focus change is announced" (plan l.31). But the panel only changes on Enter (plan l.30, `showPanel` at graph.js:324). Moving with Up/Down changes nothing in the live region, and inside `role="application"` a screen reader's own reading keys are switched off, so a blind user hears nothing as they move. When Enter does fire, the whole panel is replaced at once, including every connection, and it is all read out.
   - Fix: add a separate short live region, for example "3 of 42: Microsoft, company, 18 connections, Upcoming vote". Or use `aria-activedescendant` on a `role="listbox"` instead of `application`.
2. **The List view is not the text equivalent the plan says it is (plan l.31).** `drawList` drops proposals, companies and people (graph.js:487), and its columns are only Organization, Type, AI proposals and Companies (graph.js:497). So none of the new lens content has a text home outside a selected node's panel: the "Upcoming vote" rings (which are on proposals), the "What you can do" actions and the confidence markers.
3. **The dashed line for "inferred" already means something else, and the lines are too faint to see.**
   - graph.js:444 already dashes `member of` links with the same "3 3" pattern, so "inferred" and "member of" would look identical.
   - Links are `--blue-3` at a stroke opacity of 0.35 (graph.js:403). Measured on white, that is about 1.5:1, below the 3:1 that WCAG 1.4.11 asks of non-text graphics.
   - The plan says only "grey text" for the markers (plan l.25) and names no token. If a build reaches for `--control-edge` #8a8a8a, that is 3.45:1 and fails text contrast (DESIGN.md l.23). It needs to name `--ink-soft` #555 (7.5:1).

TOP IMPROVEMENTS
1. **Specify the lens control's roles.** "A radio group of three buttons" needs `role="radio"`, `aria-checked`, and a roving tabindex. The existing `.seg` styling keys on `aria-pressed` (styles.css:121), so reusing it unchanged gives mixed roles. A simpler option is native radio inputs in a `<fieldset>`, styled with the existing `.chip:has(input:checked)` rule (styles.css:136).
   - Arrow keys in a radio group select as they move, so each press would re-filter the graph and rewrite `?lens=`. The changed node count should be announced; `#net-intro` is not live.
2. **Tell the keyboard focus ring apart from the "Upcoming vote" ring by shape, not only colour.** For example, a 2px `--ink` ring with a white gap for focus, and a dashed outer ring for the vote. Say what happens with reduced motion when Up/Down moves to a node that is off screen: it should jump with no animation, the same `REDUCED_MOTION` rule as graph.js:347.
3. **Check the lens control fits at 390px.** `.seg` is `inline-flex` with `overflow: hidden` and doesn't wrap (styles.css:119). By my estimate the three labels need about 380px against 358px of usable width. This is unverified, not measured, so it doesn't change the score. If it doesn't fit, let it wrap or stack.

OUT-OF-FIELD NOTES
- Calling every edge with no URL "inferred from co-filing" may mislabel edges that are not co-filings, such as "works at". That is for the data review.
- The Policymaker lens has no rings in Phase 1, so its only text-equivalent need is the actions block.
- The plan adds a test for "Down then Enter opens a panel" but none for what is announced.

CONTENT RULES: PASS. The "Vote at the {meeting} AGM" wording names the event and not a direction (plan l.42), and the markers use no alarm colours.

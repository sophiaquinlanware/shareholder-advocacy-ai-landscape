REVIEWER: UX / content and accessibility (simulator) SCORE: 72 VERDICT: REVISE

TOP FAILURES (max 3, each with evidence)
1. **The planner does not hand off to the simulator.** I walked from Deadlines and votes to Laws and rules and each step is clear: every "Next: … →" link is present (index.html:59–113). It breaks at the last step. #tab-planner has no link, button or text that mentions testing, "over time" or the simulator (a Playwright search of the rendered planner found 0 matches). It ends on the "Your shortlist (0)" note. The `?plan=company~ask#simulate` parameter exists, but only tests/sim.spec.js uses it. The simulator also does not take the planner's chosen company and ask. So the owner's "end with planning, then test it" arc has no last step. Users have to find the second sub-tab themselves and pick the company and ask again.
2. **The chart has no full text equivalent.** The support chart is a single `role="img"` with a one-line aria-label. There is no table or list of the yearly middle and 80% bands, and the recorded dots have no text (0 `<table>` in #tab-simulate after a run). The plan summary gives only the last season ("support in 2029, middle 80% of runs: 9% to 48%"), so screen-reader users miss 2027 and 2028 and the recorded history. At 390 px the last x-axis label is cut off ("202" plus a clipped glyph; screenshot v-390-dark-b.png).
3. **Two results are carried only by looks or are inconsistent.**
   - **Plan targets in the field grid:** they are marked only by an underline (`.sim-cell.mine`). The screen-reader text for MSFT ("Microsoft, 2029: filed in 14% of runs; committed by then in 7%") does not say it is your target, though the ticker says "Your targets are underlined."
   - **The refile commit rate:** "How the model works" prints "0 of 25 (4%) of refiles". The percentage is the model's own estimate, not the recorded share, and nothing says so. An analyst will read it as a typo, and it weakens trust in every rate on the page.

TOP IMPROVEMENTS (max 3)
1. End the planner with "Next: test this plan over time →". It should link to `?plan=<company>~<ask>#simulate` so the simulator opens on the plan already chosen.
2. Add a "Support by season" table (season, recorded vote, plan middle, 80% band) under the chart, in a `<details>` if space is tight. Add "your target" to the hidden text on `.mine` cells. Fix the x-axis right padding at 390 px.
3. Label every percentage that comes from the model's estimate rather than the recorded share, for example "0 of 25 recorded; model rate about 4%". In the ranking, rename "Add to Plan A" to "Test in Plan A", and put the "small base" caveat above the table, not below it. The ranked list of "never filed here" pairs, each with an add button, is the part closest to reading as a target recommendation.

OUT-OF-FIELD NOTES (max 3, one line each)
- The default plan (Microsoft, Board oversight) shows no recorded dots for 2023–2026 on the chart, though Microsoft has AI oversight votes on record. Worth checking whether the ask mapping or the dots are dropping them.
- Emulating dark mode with prefers-color-scheme left the field grid and chart in light colors. That may be expected if the site uses a data-theme toggle; I did not confirm.
- Run is fast (about 60 ms for 400 runs). A first-time user can run and read Plan A in under a minute, but results only appear after pressing Run, so an empty page on arrival is a missed chance to show them.

CONTENT RULES: PASS. I scanned the rendered simulator text at 390 px, before Run and after Run and Rank: no em dashes, no "genuinely", no "real", no "should" or "recommend". (I ran that word scan once, at 390 px only, but it covered the full panel text.) Every result block says "Scenario computed by this site … Not a forecast; not advice", and the fund-family lines describe recorded FOR rates without asking anyone to vote. Borderline, not a fail: the ranking's "Add to Plan A" buttons beside the "never filed here" pairs (improvement 3).

Things that passed:
- Every simulator control has a label.
- The keyboard tab order is logical, with a visible 2 px focus outline on each control.
- The season slider works with Home, End and the arrow keys, and its output updates.
- The status line uses role="status".
- Field cell contrast is 11.7:1 or better.
- No sideways scroll at 390 px.
- No console errors.

Screenshots are in /private/tmp/claude-503/-Users-Quinlan-Downloads-outreach-radar-extension-2/254ea18c-3896-4871-90a5-a793efccf32b/scratchpad/simux/ (planner-*, sim-before-*, sim-after-*, sim-rank-390-*, v-*).

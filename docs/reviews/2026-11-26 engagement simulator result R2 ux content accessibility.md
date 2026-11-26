REVIEWER: UX / content and accessibility (simulator) SCORE: 79 VERDICT: REVISE

TOP FAILURES (max 3, each with evidence)
1. **New: white text on green field cells fails contrast (WCAG 1.4.3).** I checked every ask and season. The worst cell is MSFT, ask-ai-oversight-reporting, 2028: `.sim-cell.mine.scen` at --fill 0.78, white 11 px text on color(srgb .31 .59 .43), which is **3.50:1**. The rule that switches text to white was tuned for blue and switches too early on green. The green itself passes: --scenario #1e7a46 on white is 5.3:1 for the line and the text. --scenario-2 #4f9d6b is about 3.3:1, fine for Plan B marks but not for any text.
2. **New: timeline buttons drop keyboard focus.** At 1440 I pressed "← Earlier" with Enter until the start. The button became `disabled` and focus fell to BODY (document.activeElement). "Later →" does the same at the end, and the timeline opens at the end, so Later starts disabled. Use aria-disabled, or move focus to the other button.
3. **R1 #2 is only partly fixed.** "The same figures as a table" exists, and the 2029 axis label now fits at 390 (chartbox-390.png). But the table has rows only for 2027–2029, and "Recorded vote" is "–" in every row. The recorded history (2023–2026) still has no text equivalent.

R1 status
- R1 #1, planner handoff: **fixed.** #pl-next reads "Next: test this plan over time →" and goes to ?plan=microsoft~ask-dc-climate-energy#simulate. The simulator arrives on Microsoft / Data center energy with results already shown, at both widths.
- R1 #3: **fixed.** The screen-reader text now ends "(your target)". Every rate reads "k of n recorded (model rate about x%)", including "0 of 24 recorded (model rate about 4%) of refiles".
- Ranking: **fixed.** The caveat sits above the table and the buttons read "Test in Plan A".

TOP IMPROVEMENTS (max 3)
1. Raise the threshold for white text on green cells (or darken the green). Then re-run the cell contrast sweep.
2. Add the recorded seasons as rows in the support table, or a separate "Recorded votes" list.
3. At 390 the overview strip's year labels overlap into one string ("2012015201720182019…", cz-view-390.png); show fewer labels there. #cz-window is aria-live and rewritten on every scroll event, so announce only after the scroll settles. The many "Test in Plan A" buttons have identical names; add the company and ask to each.

OUT-OF-FIELD NOTES (max 3, one line each)
- MSFT / Board oversight still shows no recorded votes (dots and table "–"), as in R1. Worth checking the ask mapping.
- The scenario log names real filers in invented future events ("Nordea Asset Management files … at Palantir: 38% support"). A data reviewer should confirm this fits Never-claim 5 and 6.
- The timeline's time scale is non-linear (early years compressed on the overview). Fine if intended; nothing on the page says so.

Checks that passed: no sideways scroll at 1440 or 390 (simulator and #causality). No console errors. Earlier and Later work with Enter and Space and update "Showing … to …". Clicking the overview jumps the view (Feb 2013–Apr 2017). Lane names are in a fixed column. The scroll box takes focus with a 2 px outline. The title and the "Antecedents"/"Consequences" labels are present. Chart text has no clipping.

CONTENT RULES: PASS. I scanned the full simulator text at both widths. No em dashes, "genuinely", "real" or "recommend". The only "should" is in the ranking caveat: "it does not say where anyone should file", which denies advice rather than giving it. The "Not a forecast; not advice" labels are intact.

Screenshots and scripts: /private/tmp/claude-503/-Users-Quinlan-Downloads-outreach-radar-extension-2/254ea18c-3896-4871-90a5-a793efccf32b/scratchpad/simux2/

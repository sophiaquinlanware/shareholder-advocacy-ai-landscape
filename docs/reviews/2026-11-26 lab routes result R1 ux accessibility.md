# Lab routes result, review R1: UX and accessibility

Reviewer: subagent, 2026-11-26. Saved verbatim.

**Lab routes result review: UX and accessibility. Score: 76/100 (FAIL; it needs 80 to pass)**

The rebuild answers the question in the right order: lab, then routes, then pull, then whether you can act. Each route is now one row, and the phone layout has no sideways scroll. Most R1 findings were dealt with:
- **Done:** phone cards, one rights-and-deadline cell, stacked ties with a strength each, a single live status line, "(site grouping)" in the header, a note on which filers the map shows, the bars as an `<ol>` with text counts, and an Enter-key test.
- **Not done:** the five below. None of these was recorded as declined.

1. **The deadline is buried on phone cards (R1 #1 not done).** Cards follow the desktop column order, so "can I act" is the fourth field, under long tie text. Microsoft's card is about two screens long. Fix: on screens 640 px or narrower, put the rights-and-deadline cell straight after Company (`tr{display:flex;flex-direction:column}` plus `order`). Put related asks and past support inside a `<details>`.

2. **Related asks set row height on desktop.** Microsoft lists about 13 asks, and the same list repeats for every company in a group. That makes the table about 5,000 px tall for Anthropic. Fix: in each cell show "N asks, M proposals filed" with the list in a `<details>`. Or show the group-to-asks mapping once under the table and keep only the counts in the cells.

3. **Sort behaviour (R1 #6 partly done).**
   - Every sortable `<th>` still gets `aria-sort="none"` from the shared `sortableTable`. Fix: emit it only on the active column.
   - The first click on Company sorts Z to A, because `wireSort` always starts descending. Fix: let a column say its first direction (`firstDir: "asc"` for Company and deadline).
   - The announcement reads "Sorted by US proxy rights and next filing deadline, descending." Fix: give each column a plain phrase, such as "deadline, soonest first".
   - After a sort, the status line loses the route count. Fix: keep the count and add the sort phrase after it.

4. **Lab chips (R1 #8 not done and not declined).** Fix: switch to `aria-pressed` buttons in a group named "Lab" where pressing the active chip does nothing, or to a radio group. Either way, note the choice in the plan.

5. **Map labels and colours.**
   - Labels are cut with an ellipsis, for example "Open MIC (Open Media and Information…" and "SHARE (Shareholder Association for…". The plan says labels are never truncated. Fix: wrap to three lines, and give the full name in a `<title>`.
   - Unselected lab labels are pale lavender, likely below 4.5:1. Fix: use `--ink-soft`, not opacity.
   - Filer dots are green and the selected lab dot is purple, which breaks "black and white with blue". Fix: use blue and black.
   - At 390 px the filer edges merge into one solid band, and edges cross the value-chain labels. Fix: give labels a white text halo (`paint-order: stroke`).

6. **The findings repeat the table (R1 #5 partly done).** The status line now carries the summary, and the "Not tracked" findings line repeats each row's "not tracked here". Fix: keep the sourced deadline line and the top filers line, and drop the rest.

7. **Tests (R1 #12 partly done).** There is no check that the deadline shows near the top of each card at 390 px. There is also no check that the sort status text changes. Add both.

8. **Bars: keep them; the owner asked for them.** Highlighting the selected lab's companies (`.on`) links them to the chip, which is good. Check that `--blue-2` against white meets 3:1; I could not measure it from the screenshot.

9. **Queue, not this session.** In `lab-routes-map-phone-light.png` the sticky tab bar takes about 200 px on the phone and covers the middle of the map. This is an existing issue: the tab bar was not changed here.

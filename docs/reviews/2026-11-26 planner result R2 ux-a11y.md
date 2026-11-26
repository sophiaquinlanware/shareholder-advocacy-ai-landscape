REVIEWER: UX / content and accessibility SCORE: 86 VERDICT: PASS

Round 2 re-checks only what failed in round 1 (commit 65ef29c, planner.js and styles.css). Evidence comes from a Playwright run against dist/ at 1440 and 390 px, using `?plan=microsoft~ask-dc-climate-energy~parnassus`. The run used a temporary config on port 4219, because other sessions held 4173 and 4191. All twelve required fixes from round 1 are in, and each was verified as follows.

- **Fund votes.** Each line links a source. Six "matched automatically, N of M not yet reviewed" notes render, in the same wording as votes.js:81, and the years are named.
- **Holdings.** These read "$2,150M, Form 13F for the quarter ending Sep 30, 2026". Old periods are stated, e.g. BlackRock Jun 30, 2024. All 136 holding edges match a holdings.json filing URL.
- **Wording.** "In this dataset" appears throughout, including the grid aria-labels. The ideas heading names the role ("other cloud and model platforms companies"). The organizations heading and the note say a record is "not whether it would work with you".
- **Live region and status.** `#pl-out` has no `aria-live`. The status line reads "Plan for Motorola Solutions, Child safety and AI: 5 filings of this ask in this dataset."
- **Focus.** After Shortlist, focus stays on the same button (`aria-pressed="true"`). After Remove, focus goes to `#pl-h-list`.
- **Grid.** One square is in the tab order. Arrow Right then Down moves to Motorola / Child safety. Enter keeps focus on that square with `aria-current="true"`. The corner header is labelled. Borders use `--control-edge`; filled squares use `--accent-soft`.
- **Layout.** The grid is transposed with sticky labels, and squares are visible at 390 px. At 390 px the organizations table stacks as cards with no horizontal overflow (scrollWidth 390).
- **Sorting.** The order is stated, with "Showing 20 of 47" and a "Show all" toggle.

TOP FAILURES
None blocking.

TOP IMPROVEMENTS
1. **Coalition record inflates the sort.** With an organization set, "Shares a coalition with your organization" counts as a kind. Holders such as BlackRock and CalPERS (holds + coalition) therefore rank level with single-ask filers. Leave the coalition kind out of the sort count (planner.js, the sort in `organizations()`), or say in the note that it counts.
2. **Phone cards lose the column names.** In the stacked cards, leads such as "Andrew Behar, CEO" appear with no "Engagement leads" label, because `data-label` is set but never shown. Add `.pl-orgs td[data-label]::before { content: attr(data-label); }` in the existing `.ticker` style, under the 640 px query.
3. **Grid row totals and keys.** The row total reads as "Data center water use 3" on screen and to screen readers. Write it as "3 filed". Add the End key beside Home.

Also worth doing later: apply `RULES.resubmission()` to this company's own votes, rather than only printing the thresholds.

OUT-OF-FIELD NOTES
- The grid row labels inherit the uppercase `th` style, so long ask names wrap to four lines at 390 px.
- The phone page is still about 9,700 px tall. The table stays at 20 rows by default, which is acceptable.

CONTENT RULES: PASS

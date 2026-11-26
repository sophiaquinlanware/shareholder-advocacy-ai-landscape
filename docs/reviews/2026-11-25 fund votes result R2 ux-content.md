REVIEWER: UX / content SCORE: 86 VERDICT: PASS

All three R1 failures are fixed in the build:
- Domini's 2025–26 cells and TIAA-CREF's 2023–24 cells now read "Not checked" (votes.js:23-28, :40; desktop screenshot, Domini and TIAA-CREF columns).
- Praxis is explained through `not_shown` (votes.js:106, fund_votes.json `not_shown`).
- A scroll hint sits above the table (votes.js:113).
- The header tags are replaced by a dagger on each vote plus one footnote (votes.js:44, :105).
- Floor proposals are left out, with the reason given (votes.js:81, :115).
- The Split and Needs checking wording is clear and neutral (votes.js:101, :104).

TOP FAILURES (none block shipping)
1. **On a split vote, the dagger reads as if it marks only the last part (the build follows the design).** The cell shows "Split: 1 against, 1 for†" (desktop screenshot, BlackRock column, Alphabet 2026 AI-Generated Misinformation row; votes.js:48). It looks as though only the "for" part is unreviewed. Fix: put a space before the dagger, or put the dagger before "Split".
2. **On a phone, the table is still a long way down the page (the design is wrong).** The intro, callout and six definition bullets come first, so the table starts at about 1,520 px of a 2,863 px page (phone screenshot). That page is one company with three rows. The phone still shows one family column (BlackRock), though the hint now tells readers to scroll sideways.
3. **Small wording problems (the build follows the design).**
   - The footnote's review date uses the ISO format "2026-11-25" (votes.js:94), while the site header writes "November 25, 2026".
   - "these companies" in the intro (votes.js:98) has nothing on this tab that it refers back to.

TOP IMPROVEMENTS
1. Fold the five definition bullets into a "What the labels mean" expander, or move them below the table on phones.
2. On phones, also default to one fund family, or let the sticky column shrink, so that more than one vote shows without scrolling.
3. Reword the footnote as "Reviewed row by row so far: Parnassus, 39 proposals (November 25, 2026)". Two Parnassus votes still carry a dagger (Amazon 2026 climate row), and that wording explains why.

OUT-OF-FIELD NOTES
- Data: the Vanguard Institutional Index Funds 2026 filing is text-only (fund_votes.json `notes`), but Vanguard's 2026 coverage still counts as checked. Some Vanguard 2026 "No vote found" cells may really be "Not checked" for that trust.
- Data: on the Meta 2024 rows, nearly every family shows "No vote found", including Domini, whose 2024 filing is covered (desktop screenshot). Worth a spot check against the filing.
- Robustness: the floor exclusion depends on "floor" appearing in the proposal id (votes.js:81). A flag in the data file would last longer.

CONTENT RULES: PASS. Never claims 1 to 6 hold:
- The pills are neutral, with no tallies (votes.js:48, DESIGN.md "Fund votes use no palette").
- The independence callout is present (votes.js:99), and so is the footer.
- Unreviewed votes are marked with a dagger, the footnote and the aria-label (Never claim 4).
- Unreadable periods say "Not checked" rather than implying no vote (Never claim 5).
- "Needs checking" holds back the conflicting TIAA-CREF Meta 2026 cell instead of guessing.

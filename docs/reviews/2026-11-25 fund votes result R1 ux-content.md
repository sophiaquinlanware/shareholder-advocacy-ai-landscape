REVIEWER: UX / content SCORE: 78 VERDICT: REVISE

All six R1 failures are fixed in the build:
- Only voted proposals are shown, from 2023-07-01 to 2026-06-30 (votes.js:60).
- A blank cell reads "No vote found" and gives no reason (votes.js:16, :78).
- Families other than Parnassus are labelled "not yet reviewed" in the header, the intro and each cell's aria-label (votes.js:25, :30, :79).
- Columns run A to Z, with no tallies (votes.js:62).
- Split cells show the counts (votes.js:18).
- The phone view defaults to one company (votes.js:66).

The callout and neutral pills keep it clear of any vote recommendation.

TOP FAILURES
1. **Domini's "No vote found" cells for 2025 and 2026 are false (a design gap).** fund_votes.json `not_covered` says Domini's 2025 and 2026 filings are text-only. All 10 Domini rows are 2023–24 meetings. votes.js never reads `not_covered`, so every 2025–26 Domini cell says "No vote found … in the filings checked" (desktop screenshot, Domini column) when no filing was checked. That reads as Domini not voting. It breaks Never claim 4. It should say "Filing not readable yet". Praxis also drops out with no explanation, though the plan (line 20) names it.
2. **The phone view can't be read in seconds (the build follows the design).** At 390 px the phone screenshot shows the sticky proposal column, one family (BlackRock), and a clipped "CA… N… RE…". The caption is cut to "Votes by fund fa". Nothing tells the reader the table scrolls sideways, so most families are effectively hidden.
3. **"NOT YET REVIEWED" in 7 of 8 headers makes Parnassus the one clean column (a design side effect).** In the desktop screenshot the Parnassus header is the only one without the tag, so it stands out as the reviewed column, which edges toward the "Parnassus vs. peers" framing R1 warned about. The tag also makes each header four lines of uppercase. The intro bullet already says it, so a dagger with a footnote would do.

TOP IMPROVEMENTS
1. Render `not_covered` per cell and per family: "Filing not readable yet" for Domini 2025–26, plus a line noting that Praxis is not shown.
2. On phones, default to one fund family as well, or add "Scroll sideways for more families" above the table.
3. Mark the 2 rows with no votes at all as "Raised from the floor; not on N-PX", or leave them out. These are Amazon 2026 worker council and Alphabet 2025 Android preload. Also rewrite the method note in plain words: "by 0.15" is jargon.

OUT-OF-FIELD NOTES
- Data: the caption says 51 proposals and commit 83c6977 says 53. Reconcile them.
- Layout: on desktop the right edge clips TIAA-CREF "Split: 7 for, 7 ag…" (Meta 2026 row). It is inside the scroll box, so it is allowed, but it looks broken.
- Data: `reviewed_note` says the peer families were spot-checked, but the UI doesn't say so. It could add "spot-checked" without dropping the not-reviewed label.

CONTENT RULES: FAIL. Never claim 4 and 5: Domini's 2025–26 cells say "No vote found in the filings checked" for filings that were never read (fund_votes.json `not_covered`; votes.js:16, :34). Never claims 1, 2, 3 and 6 pass: neutral pills, independence callout, footer present, no tallies, no fund critique.

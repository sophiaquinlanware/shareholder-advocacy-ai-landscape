REVIEWER: UX / content SCORE: 76 VERDICT: REVISE

Scope: plan review only. votes.js and data/fund_votes.json don't exist yet, so every failure below is in the design. None is a case of the build not following the design.

TOP FAILURES (max 3, each with evidence)
1. **A blank cell can mean four different things, and the plan explains only one.** Plan line 23 says a blank means "no vote was found (often because the fund did not hold the stock)". But data/proposals.json has 65 proposals: 59 voted, 3 upcoming (msft-2026-4/5/6, meeting 2026-12-08, so no N-PX until August 2027), 2 excluded and 1 withdrawn. Plan line 21 asks for "one row per AI proposal". That would show 6 rows with every cell blank, plus a blank for every vote that missed the 75% title match (line 11). Parnassus has 39 votes against 59 voted proposals, so about 20 Parnassus cells would be blank. A visitor can read that as Parnassus abstaining or not engaging. Also, "did not hold the stock" is an inference no filing supports (Never claim 4 and 5).
2. **Peer votes skip the review that Parnassus got.** Only Parnassus was reviewed (line 13). The other eight families get a spot check of 10 rows in total (line 31). Never claim 4 requires "auto-detected, not yet reviewed" until a person confirms. The plan has no such label on peer cells.
3. **Column order and default view aren't set.** Nothing says whether Parnassus is the first column or the reference point. A Parnassus-first table with a "fund family" filter reads as "Parnassus versus everyone". The tab also sits next to a scorecard built on Parnassus-prepared recommendations (index.html line 33), which makes that framing more likely, as audit or as affiliation.

TOP IMPROVEMENTS (max 3)
1. Limit rows to proposals with status "voted" and a meeting on or before the latest N-PX year end, and say so. Give the blank a text label, "No vote found in filing". Drop the guess about holdings.
2. Order the columns A to Z, or by number of votes found, with no anchor column. Add one intro sentence: "Funds vote under their own policies; no vote shown here is right or wrong." Never add per-fund tallies or an "agreed with" measure.
3. A table with 14 columns won't read in seconds at 390 px. Make the proposal column sticky, shorten titles (the longest is 122 characters) and show "Support %" beside them. Or default the phone view to one company at a time.

OUT-OF-FIELD NOTES (max 3, one line each)
- Data accuracy: grouping by family ("BlackRock (iShares)") can hide splits between BlackRock's separate voting entities. Check that SPLIT is computed across all the family's N-PX records.
- Accessibility: every pill is the same neutral `.pill.pending`, so screen-reader text should include the family and proposal, as scorecard.js line 31 does.
- Data accuracy: the 75% key-word match should log near-misses for a person to review rather than drop them silently.

CONTENT RULES: FAIL. Never claim 4: no "not yet reviewed" label on peer votes (plan lines 13 and 31). Never claim 4 and 5: the blank-cell wording guesses at holdings (plan line 23). The neutral pills (line 22) and the independence statement (line 23) pass Never claim 1 and 3.

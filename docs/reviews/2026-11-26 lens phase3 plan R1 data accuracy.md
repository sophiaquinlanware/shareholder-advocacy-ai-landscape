REVIEWER: Data accuracy SCORE: 72 VERDICT: REVISE

TOP FAILURES
1. The plan doesn't say which earlier version to use. msft-2026-6 has three `vote_history` entries: msft-2023-11, msft-2024-6 and msft-2025-8. Only msft-2026-5 (→ msft-2025-9) and msft-2026-6 can join at all; msft-2026-4 and csco-2026-5 have no vote_history. Domini has rows for msft-2023-11 only, because its 2025 and 2026 filings are in `unreadable_filings`. A rule like "latest version that has a row for this family" would show Domini's 2023 vote under "How your fund voted last year", while the other families show 2025. Required rule: use only the most recent `vote_history` entry. Write the label with that entry's year ("the 2025 version"). If that entry is more than about 12 months before the meeting, drop "last year" from the heading. If the family has no row, say nothing, or say why, using the coverage logic in votes.js:37-41.
2. The wording can claim more than the filing shows. Rows are family-level aggregates of only the trusts listed in `families` (fund_votes.json). Typing "BlackRock" matches "BlackRock (iShares)", which covers only IVV and iShares U.S. ETF Trust. The Vanguard msft-2025 rows rest on 1 fund record. Vanguard's 2026-06-30 coverage is "partial" (Institutional Index Funds unreadable), and the 2025-12-05 meeting falls in that period. "Vanguard voted Against" therefore overstates it. Name the funds the filing covers ("Vanguard funds in this filing voted Against"), add the partial-coverage note votes.js already uses ("from part of this family's filings for that year") and link every URL in `sources`; several rows have two.
3. Vote values are raw: FOR, AGAINST, ABSTAIN, SPLIT, NEEDS_CHECK (26 rows are SPLIT or NEEDS_CHECK). The plan only gives an example, "Against". Reuse votes.js `voteText`/LABEL. Never show a NEEDS_CHECK row as a vote. Filter by `proposals_checked` and `held_back_proposals` the way votes.js:76-84 does; 5 summary rows belong to held-back meta-2026-3.

TOP IMPROVEMENTS
1. Fund matching. A substring of the input inside the family name works for "Pax", "iShares", "TIAA" and "BlackRock". It fails for a full fund name ("Vanguard 500 Index Fund") and over-matches short input ("a"). Also match the other way round and against the trust names in `families`, set a minimum length of 3, and say which family was matched.
2. Praxis is in `families` but has no summary rows. Typing it should give the `not_shown` reason, not "Not found".
3. Confirm that each earlier version is the same resolution, not just a similar title. msft-2026-6 says "…and Conflict Hotspots", while msft-2025-8 says "…Hotspots". The owner or the data session should confirm this, or the line should say "a similar proposal in 2025".

OUT-OF-FIELD NOTES
- Share one join helper with votes.js so the two tabs can't disagree.
- Make sure `board_rec` isn't on these 4 proposals (it isn't) and isn't read anywhere in the feed.
- If the "Vote on December 8, 2026" line implies a deadline, use upcoming.json's note, which gives "Vote by … December 7".

CONTENT RULES: FAIL. Never claim 4 and 5 are at risk: the plan gives no rule that stops older-year or partial-coverage votes being shown as "last year" family-wide facts (failures 1 and 2). The flag "matched automatically, not yet reviewed" matches votes.js:45 and is acceptable; 7 of the 8 families are unreviewed for these rows (only Parnassus has `reviewed: true`). Never claim 1 and 2 pass.

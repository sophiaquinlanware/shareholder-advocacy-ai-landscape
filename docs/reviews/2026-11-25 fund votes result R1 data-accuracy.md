REVIEWER: Data accuracy SCORE: 72 VERDICT: REVISE

Plan R1 fixes: the matching fixes went in and hold up. "ai" is now kept as a key word (npx_votes.py:129), matching is two-way with a 0.15 margin (:246-249), issuer items are skipped (:237), proposals without a date match within their year (:197), all vote-table files are read (:232), and one filing is kept per period (:218). I checked all 285 rows against data/proposals.json. Company and meeting date match on every row, the descriptions and min_confidence values fit, and no filing description is attached to two proposals.

TOP FAILURES
1. **The build didn't follow the design: a blank can mean "never checked".** Domini has one filing, period 2024-06-30. Its latest vote is 2024-06-07. TIAA-CREF has filings only for 2025 and 2026; its earliest vote is 2024-12-10. In the desktop-light screenshot, Domini shows "No vote found" on every 2025 and 2026 row, and TIAA on Microsoft 2023 and Alphabet 2024. `not_covered` is in the JSON, but votes.js never reads it (it doesn't appear in the file). Praxis is dropped from the table without a word. This breaks Never claim 4/5 in practice.
2. **The design is wrong: "Split" describes funds, but the count is of vote records.** The script adds 1 to every distinct vote value inside each record (:276-277), so a single fund that splits its own vote counts as both. Evidence: TIAA meta-2026-3 is {FOR 7, AGAINST 7}, yet the same 7 funds were {FOR 7} on meta-2026-9 and meta-2026-11. Vanguard shows exactly {AGAINST 8, FOR 4, ABSTAIN 2} on 7 unrelated proposals, which looks like a fixed voting pattern such as pass-through voting, not funds disagreeing. votes.js:77 tells readers it means "a family's funds did not all vote the same way". The commit says the spot checks were "by wording" only, so no vote values were checked against a filing.
3. **The build didn't follow the design: the file isn't the script's output, and part of a "reviewed" family wasn't reviewed.** The script writes `review` and `notes` (:293), but the shipped file has neither. It has `reviewed_families`, `reviewed_note`, `not_covered` and `first/last_meeting_covered`, which no script writes (grep). The method note shown on the page still promises a "review list". Parnassus has 41 rows, but the owner reviewed 39 (commit 83c6977: "plus 2 newer proposals"). All 41 show as reviewed.

TOP IMPROVEMENTS
1. Show the periods each family covers. Show cells outside them as "Not checked", not "No vote found".
2. Count distinct series (funds) per vote value. Open the TIAA meta-2026-3 filing and one Vanguard 2026 filing to settle what Split means.
3. Have the script write the extra keys, keep `review` in the file (or publish it), and mark the 2 new Parnassus rows "not yet reviewed".

OUT-OF-FIELD NOTES
- A cell links only to `sources[0]`. Many rows have 2 sources (Calvert msft-2023-11, the Vanguard splits).
- The commit says 53 proposals; the caption and my count give 51. Two rows are floor proposals that can't show an N-PX vote.
- The desktop screenshot cuts off the Vanguard column and the edge of TIAA's "Split: 7 for, 7 ag…" cell.

CONTENT RULES: FAIL. Never claim 4: two unreviewed Parnassus rows are labelled reviewed (fund_votes.json `reviewed_families`). Never claim 4/5: "No vote found" is shown for Domini and TIAA periods that were never checked (votes.js:78 with the gaps in `filings`).

REVIEWER: Data accuracy SCORE: 86 VERDICT: PASS

I recomputed against e53b7f4 live data/graph.json (16 vote_history nodes), loading rules.js and lenses.js in node with a test-style ctx and the clock fixed at 2026-11-25. All 9 flagged proposals reproduce, and each count and threshold matches my reading of 14a-8(i)(12):
- msft-2025-ai-oil-gas: below 15%, vote 2.
- msft-2026-hr-hotspots: pending; the bar after this vote is 25% (vote 4, 2027 meeting); last vote 27.48%.
- googl-2025-ai-targeted-ads-hr: below 25%, vote 3, 2027 meeting. The chain now joins 2023 (18.02%), 2024 (18.56%) and 2025 (14.29%), which fixes R1 failure 1.
- googl-2026-ai-board-oversight, googl-2026-ai-data-usage, meta-2026-ai-data-usage, googl-2026-5: each below 15%, vote 2, 2027 meeting.
- meta-2024-ai-targeted-ads-hr: below 15% for 2027. The recency check gives 2027−2024=3, so the rule still applies.
- amzn-2024-customer-dd: 1.79 points above 15%, vote 2, before the 2027 meeting.

The 7 unflagged nodes are correct. They are either superseded, more than 3 points above the bar, or msft-2026-hrdd (pending, 15% bar, last vote 26.34%). The matching caveat matches scripts/build_proposal_links.py:60 ("same company, topic and title subject").

TOP FAILURES
1. **msft-2025-ai-oil-gas names the wrong meeting.** It is evaluated "before the 2026 meeting" (rules.js: meeting_date 2025-12-05 rolls to 2026-12-05, which is after today). But the 2026 proxy is out, the proposal isn't on it, and MSFT's 2026 deadline (2026-06-23) has passed, so a refile could only reach 2027 (deadline 2027-06-24). The numbers are the same this time (2 votes, 15%), but the label is wrong. In general, the year should come from the next meeting whose filing deadline hasn't passed, using the company's next_proposal_deadline, not from the meeting date alone.
2. **The amzn-2024-customer-dd ring overstates.** It reads "At risk of losing resubmission eligibility", but the 2024 vote cleared 15%, so the proposal is eligible for 2027. The action text ("1.79 points above") is accurate. If it is refiled and voted on in 2027, the next bar would be 25% (votes in 2023, 2024 and 2027). This is a wording issue, not a wrong number.

TOP IMPROVEMENTS
1. For a voted proposal in the at-risk state, the ring could read "Close to the N% resubmission threshold" instead of "at risk of losing".
2. googl-2026-5's 2026 vote link has no results_url. It correctly shows "source pending"; queue the 8-K URL for the data session.
3. Add unit tests for the 3 cases above, plus the meta-2024 recency edge (exactly 3 years).

Warm path: "through shared coalition membership" is now counted only for member→coalition→member steps. ICCR→AFL-CIO→Apple now reads "has member · coalition membership (ICCR, 20 members)", with no shared-membership count. Correct.

OUT-OF-FIELD NOTES
- The AMZN deadline quote says "6:00 p.m., Pacific Time" while days left use Eastern time. The day count is still 15 days; consider stating the time zone basis.
- Dropping the basis note leaves dual-class and count-computed support figures with no caveat on the graph; queue support_note for graph.json.
- After the data merge the gap list is 24 rows; the test still only asserts more than 0.

CONTENT RULES: PASS. No vote direction is given, and pending proposals are never "below"; the threshold is kept apart from the meeting line. Every resubmission line carries "this site's reading; thresholds may change" and the matching caveat. A missing source shows "source pending". No numbers beyond the data.

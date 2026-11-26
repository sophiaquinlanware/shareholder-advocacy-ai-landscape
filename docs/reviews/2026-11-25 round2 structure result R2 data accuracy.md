REVIEWER: Data accuracy SCORE: 84 VERDICT: PASS

TOP FAILURES (max 3, each with evidence)
1. **The design is wrong: "company reports N on another basis" says something the data doesn't support.** The wording comes from plan lines 115 and 120. history() at app.js:120 counts every support_note that doesn't contain "match", which gives AAPL 3, AMZN 10, GOOGL 18, META 9, NVDA 1 and TSLA 1. But the notes say the opposite. AAPL and AMZN: "The 8-K gives raw counts only, no percentage." GOOGL and META: "Not stated in the 8-K… dual-class." TSLA and NVDA: "The 8-K gives no percentage." So no company reports a figure on another basis. These figures are the site's own: either for/(for+against) worked out from counts with a dual-class caveat, or another basis computed from the bylaws. company.png shows the GOOGL line as "company reports 18 on another basis".
2. **Build follows the design: TSLA's summary shows 53.61% and leaves the 43.25% bylaw basis to the history-table footnote.** The line reads "1 vote with a filing · median 53.61% · high 53.61% · company reports 1 on another basis". It now carries a flag, which fixes R1 failure 1, but the flag doesn't say whether the other basis is above or below 50%. Also, a median of one vote adds nothing.
3. None blocking beyond these two.

Fixed from R1, checked with python3 against data/proposals.json:
- history() matches the chart filter. AAPL 3/3, AMZN 10 of 11, GOOGL 18 of 20, META 9 of 12, MSFT 11/11, NVDA 1/1, TSLA 1/1. The six figures without a filing are excluded (amzn 1.2; googl 8.37, 14.24; meta 7.16, 13.43, 3.42).
- Medians are right: GOOGL 8.755 shows as 8.76, AMZN 17.59, META 9.93, AAPL 11.57, MSFT 21.17. Median and high are both at 2 decimals.
- In Company lookup, the GOOGL support cells carry footnote 1, listed once below the table. 14.24% and 8.37% show "Vote-results filing not recorded" (company.png).
- Fund votes intro: 8 families from summary, and the dates come from first_meeting_covered and last_meeting_covered (2023-07-01 to 2026-06-30).

TOP IMPROVEMENTS (max 3)
1. Change the flag to "N use a basis or caveat noted below" (or "see notes"), and change the chart key the same way.
2. When the flagged set includes a different-basis figure, put that figure inline, for example "high 53.61% (43.25% on Tesla's bylaw basis)".
3. Drop "median" when N = 1; show the single value instead.

OUT-OF-FIELD NOTES (max 3, one line each)
- The minerva.info sourcing for the AMZN and AAPL reasons from R1 was not re-checked here.
- Of the screenshots, I inspected only company.png. upcoming.png, feed.png and votes.png were not viewed.
- The basis wording also appears in the Proposals method line (app.js:302), so fixing it means editing the plan's copy too.

CONTENT RULES: FAIL (minor). "company reports N on another basis" (app.js:126; plan lines 115 and 120) claims the companies report a figure, but the cited 8-Ks state no percentage (Never claim 4). Nothing implies a pass on the 50% line, and every support % shown has its note.

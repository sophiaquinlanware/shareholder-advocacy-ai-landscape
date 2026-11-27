REVIEWER: Data accuracy (forecaster and planning tools) SCORE: 79 VERDICT: REVISE

R1 re-check. **Fixed:**
- Strict backtest: I rebuilt it on my own and got the same 16 of 29. The JS median now matches Python's.
- Dual-class floor: shown for refiles only and capped at 100. The maths holds, because c is a share of all voting power, so the bound is s/(1−c).
- Freshness: the page says 39 of 414 reviewed, deadlines 27 of 29, gives a period span, and refresh.py counts companies actually checked.
- Exact-season scoring.
- Fund family seat.
- SEC November 17, 2025 citation.
- Exclusion regimes: 3/19, 0/38 and 3/57 match sim_params.

**Partly fixed:** N-PX counts and the ask designer.

**Not fixed:** the point figure (failure 1).

Re-running build_forecast.py gives an identical forecast.json. The served files match the worktree.

TOP FAILURES
1. **A point figure is still shown, against the brief PRODUCT.md now quotes.** planner-tools.js prints "middle ${pct(r.mid,0)}" next to the range. The quoted brief says "Show ranges, never point predictions." Remove the middle figure, or have the owner change the brief.
2. **Logged forecasts are misscored once a later vote exists (new).** `scored()` reads `F.latest`, which keeps only the most recent season for each company and ask. Take a 2027 forecast where 2027 and 2028 votes are both recorded: it shows "no vote on this ask here in that season", which is wrong. It needs a per-season lookup.
3. **The N-PX counts still include rows that cannot be told apart, and the two tools disagree.** The 6 NEEDS_CHECK rows for held-back meta-2026-3 still count in "FOR on k of n" in forecast.json and planner.js, which total 409 rows. Parnassus's NEEDS_CHECK row is even marked reviewed. build_sim_params.py drops them, giving 403. The simulator says "most matches not yet reviewed" rather than k of n.

TOP IMPROVEMENTS
1. **Ask designer misreads committee names and plurals.**
   - "request that the Audit Committee oversee AI risks" is placed as Assessment because "audit" matches. It should read as board oversight.
   - "issue reports" matches nothing: there is no "reports" or "disclosing", and there is no "ask" or "urge" anchor.
2. **Floors for older votes use 2026 voting power.** GOOGL's 2023 vote is checked against 52.7% from the 2026 proxy, and META's 2024 vote against 60.8%. Use the proxy for the vote's own year, or say which year the voting power comes from.
3. **Same-date duplicates are handled two ways.** The backtest takes the highest support of the latest season; the page takes the last row in the file. Examples are PLTR 2026 (two votes on customer due diligence) and AMZN 2024. They agree today only by chance, so use one rule for both.

OUT-OF-FIELD NOTES
- Freshness "Engagement leads" silently leaves out undated or UNVERIFIED rows. "Oldest check 2025" should say how many have no date.
- The "New SEC filings" row will say 7 companies until the next weekly run writes companies_checked.
- I checked and found accurate: the strict-backtest wording, both coverage figures on the page, and the 80-day 14a-8(j) notice.

CONTENT RULES: FAIL. Rule 5: the "middle" point figure in Plan an engagement contradicts the quoted brief ("never point predictions"). Rule 4: the NEEDS_CHECK rows for held-back meta-2026-3 are counted as votes in the planner and support-card fund totals.

I edited no repo files.

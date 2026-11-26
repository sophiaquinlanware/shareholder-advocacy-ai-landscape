REVIEWER: Data accuracy (Round 2, commit 0ee72a8) SCORE: 86 VERDICT: REVISE

TOP FAILURES
1. **The new detail line counts funds where the data counts fund records.** "from N fund's/funds' filing(s)" is built from `row.fund_records`. scripts/npx_votes.py:311-319 counts one record per matched N-PX vote record. Each record carries `series` and `series_count`, so a single record can cover several fund series. The Fund votes tab says the opposite of the feed: "The numbers count fund records… a single fund can split its own shares." Examples:
   - Vanguard (msft-2025-8 and 9): "from 1 fund's filing". That one record comes from Vanguard Index Funds (CIK 36405), so it may be several series.
   - Parnassus: "from 5 funds' filings", but `sources` has 2 filings.
   I couldn't check series counts because the raw run file isn't in the repo. Fix: go back to "{n} fund record(s) in {k} filing(s)", or use the tab's wording.
2. Nothing else fails.
   - **Matching:** IVV/ivv, DSEFX, GCEQX and TISCX now match their families. "iShares Core S&P 500 ETF", "Vanguard Total Stock Market Index Fund", "The Domini Fund", "CREF", "Impax" and "Green" match correctly. "Fund", "trust", "ETF" and "index" are now not found. "a" and "II" are rejected. "Calvert, Parnassus" uses Calvert and lists Parnassus under "also matched". "Fund, Vanguard" picks Vanguard and lists "Fund" as not found.
   - **Fund lines:** a held-back or unchecked earlier version now returns null.

TOP IMPROVEMENTS
1. "Invest" still picks Calvert, through "Calvert Social Investment Fund". Consider adding word stems like "invest" and "global" to the generic list, or match whole words only.
2. Domini's line comes back with no detail (`detail` undefined), and graph.js leaves it out correctly. Its heading "How Domini funds voted last year" sits over "Not checked…", which reads oddly. Consider "Domini funds last year".
3. The 396-day "last year" window is fine: MSFT's two meetings are 368 days apart.

Recomputed (clock 2026-11-25, US Eastern):
- **Items:** msft-2026-4, msft-2026-5 and msft-2026-6 (proxy note "Vote by 11:59 p.m. Eastern, December 7, 2026."), then csco-2026-5.
- **Fund lines:** on msft-2026-5 and 6, every family matches the msft-2025-9 and msft-2025-8 summary rows: vote, sources (filing 1 and 2 links), the "matched automatically, not yet reviewed" flag on all but Parnassus (reviewed), and the partial-coverage note on Vanguard only. This agrees with the Fund votes tab's † and ‡ marks.
- **No line:** msft-2026-4 and csco-2026-5 have no vote history. Praxis shows its `not_shown` note.
- **Quiet lines:** they show only deadlines that are still open, with their proxy source.
- **Not-found counts:** the not-found line now gives the 60 companies and 8 families.

OUT-OF-FIELD NOTES
- The earlier title "…Human Rights Hotspots" against "…and Conflict Hotspots" is still unconfirmed by the owner. The "about" line quotes it, which is acceptable.
- The definition of "annual meeting" no longer says "Most people", which is good: that was an unsourced claim.
- docs/STATE.md and the plan have uncommitted changes in the worktree. I didn't touch them.

CONTENT RULES: PASS, with one caveat. There is no vote advice: the disclaimer is shown, the labels are neutral, and every row is sourced. The caveat is Never claim 5 (no invented numbers): "N funds' filings" restates a fund-record count as a number of funds. Fix that wording before release.

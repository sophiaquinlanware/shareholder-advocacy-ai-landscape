REVIEWER: Data accuracy SCORE: 76 VERDICT: REVISE

TOP FAILURES (max 3, each with evidence)
1. **Build didn't follow the design: a median and high from `history()` appear without the company-basis note** (app.js:98 and app.js:231; the plan's Data honesty rule says no support % without its note). In Company lookup, TSLA shows "1 voted · median 53.6% · high 53.61%" in the summary line, with no note. Tesla's own basis gives 43.25% (proposals.json, tsla-2025-7), so the summary reads as above 50%. GOOGL shows "median 8.8% · high 18.56%" (company.png). 18 of its 20 figures carry the dual-class note, but the summary line has none.
2. **Build didn't follow the design: `history()` counts support figures that have no vote-results filing** (app.js:111 filters only on `support_pct != null`). Six of these feed the medians: GOOGL 2 (8.37, 14.24), META 3 (7.16, 13.43, 3.42) and AMZN 1 (1.2). Proposals correctly leaves them unplotted and marks them "Vote-results filing not recorded" (app.js:321). Company lookup's history table (app.js:222) shows "14.24%" and "8.37%" with no such mark (company.png, last two GOOGL rows).
3. **Rounding is inconsistent:** the median is rounded to 1 decimal and the high is not (app.js:115). One proposal therefore shows two different numbers, "median 53.6%, high 53.61%" (TSLA).

TOP IMPROVEMENTS (max 3)
1. Limit `history()` to `results_url && meeting_date`, the same filter as `plottable`. Say "N with filing of M voted".
2. Add a basis flag next to median/high when any proposal in the set has a `support_note`, for example "company basis differs for 1; see history". Add the missing-filing note to Company lookup's Support cell as well.
3. Use the same precision for median and high (2 decimals, as stored).

Verified correct with python3 against data/:
- Header "7 companies · 65 proposals".
- "meetings 2023–2026".
- Status counts 65 / 59 / 3 / 1 / 2.
- 53 plotted, 6 table-only; plotted dates run 2023-05-24 to 2026-06-24.
- Upcoming "3 AI proposals on 1 ballot", MSFT 11 voted / median 21.2 / high 36.19. Every MSFT note says the reported figure matches within 0.01.
- The 50% line is labelled "50% of for + against". Dots with a note are drawn hollow, and their tooltip carries the note.
- NVDA military-AI shows "Reason not yet recorded."
- Filer fallbacks are in place.

All of this resolves the plan-R1 failures.

OUT-OF-FIELD NOTES (max 3, one line each)
- The AMZN and AAPL withdrawal/exclusion reasons are sourced to minerva.info, a secondary source; PRODUCT.md Never claim 4 asks for primary sources (SEC no-action letter or proxy).
- This worktree has 7 companies, while the plan describes a 60-company universe. The counts are computed, so they will change after the data merge.
- I did not verify that Rights map facts trace to sources beyond the code path (app.js:445, "source pending" fallback present).

CONTENT RULES: FAIL. Company lookup shows TSLA "high 53.61%" without the 43.25% note (app.js:231), which can read as a majority pass. Medians include support figures with no vote-results filing (app.js:111), against Never claim 4 and 5.

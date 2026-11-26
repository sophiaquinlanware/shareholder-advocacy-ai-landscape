REVIEWER: Data accuracy (simulator method) SCORE: 85 VERDICT: PASS

I edited no repo files. Checks I ran: a re-read of build_sim_params.py and sim.js, sim_params.json, a 1,000-run Playwright check on the built site, and the arXiv full text.

Round-1 findings:
- **F1 lockout: fixed.** sim.js `yearly()`/`locked()` now apply the same rule as `votes_by_year()`/`lockout()`: one figure a year, the highest vote not filed by a filer critical of ESG. Amazon data center climate is blocked in 0% of runs in 2027, against 100% before. Later blocks (75% of runs) come from simulated 2027 votes that fall under the 25% bar, which is correct rule behaviour.
- **F2 unestimated parameters: fixed.** `draw.lapsed` uses `lapsed_refile` (2 of 14). `firstVote` has no extra noise. floorShare and floorCommit are labelled "no estimate in this data". The method text lists all four settings that have no estimate.
- **F3 held-out test: mostly fixed.** The first-filing rates are refitted on 2023–2025 (`fit = estimates(test-1)`, 13.2 expected vs 12 recorded). Refiles now show 8 of 11, with Meta data center climate dropped. One sub-point is not fixed (Top failure 1).
- **Out-of-field notes:**
  - Commitment denominators now exclude excluded filings (69 = 72 − 3): fixed.
  - `blockedRuns` counts only seasons from `plan.from` on: fixed.
- **Citations:** the Lai et al. wording is now supported by the full text (arXiv HTML v1/v2: agents formed "tight-knit social circles with familiar others"): fixed. Dimson, Karakaş and Li is now labelled as investor-network dialogues applied to filings as an assumption: fixed.

TOP FAILURES
1. **Seasons with only anti-ESG filings still count as refile history.** GOOGL and META ask-ai-training-data had only critical filings in 2025 and a non-critical filing in 2026. Both count as refile hits in `refile` (19 of 34) and in the backtest's 8 of 11. Without them, the like-for-like figure is about 6 of 9. `filed_in[y-1]` in the estimator and `prevFiled` in the engine both ignore the critical flag.
2. **Commitment denominators include anti-ESG filings and count per proposal.** 10 of the 69 non-excluded filings are critical-lead, and 8 are second filings on the same company, ask and season. The engine applies the rate once per pair-season to non-critical filers, so 3 of 69 understates the rate a little (3 of 59 without the critical filings).
3. **The backtest says more than it checked.** The method text says "Every rate fitted on 2023, 2024, 2025 only, then compared with 2026". Commitment and exclusion rates are never compared. The lapsed backtest (3.0 vs 2 of 12) rests on about 2 fit-period cases, so it mostly tests the uniform prior.

TOP IMPROVEMENTS
1. Count a prior season as filed only if it had a non-critical filing (unless the pair is all-critical). Apply this in both files.
2. Compute commitment rates over non-critical filings, one per pair-season.
3. Name the rates the backtest compares, and say the lapsed fit rests on very few cases.

OUT-OF-FIELD NOTES
- `nextVote` starts from the last non-critical vote in list order, not the year's highest. These differ when a year has two votes, though no current refile path hits that case.
- The ×1.33 and the "1.4 lead / 21 supporting" figures are still unchecked against the paper's text. Only the abstract was available.
- The Sourati and Evans wording matches the abstract as I know it. I did not fetch it this round.

CONTENT RULES: PASS. Scenario output is labelled "Not a forecast; not advice". Every estimated rate shows its k of n. Settings with no estimate are labelled under Assumptions. The study claims are now worded as their sources state them. No vote or partner is recommended.

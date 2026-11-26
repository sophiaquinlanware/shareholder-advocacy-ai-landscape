REVIEWER: Data accuracy (simulator method) SCORE: 62 VERDICT: REVISE

I edited no repo files. I re-ran build_sim_params.py against a copy of data/ and the output matched data/sim_params.json exactly. I recomputed the refile estimate by hand and got the same 19 of 34. The exposed (7 of 147), unexposed (30 of 837), commitment (3 of 47 first filings, 0 of 25 refiles, from the Disney, Comcast and Verisk withdrawals) and exclusion (3 of 72) figures come from that same reproduced run; I did not rebuild them separately. The Beta(k+1, n−k+1) draws, the shared random streams per run, ask, season and company, the support cap (1.1 × 43.29) and the 5/15/25 bars with the 5- and 3-year windows match rules.js.

TOP FAILURES
1. **The engine's resubmission lockout disagrees with the estimator and blocks a refile the rule would allow.** sim.js `locked()` counts every proposal's vote, including votes on anti-ESG proposals. When two votes share a year, it takes whichever comes last in the list as the latest vote. build_sim_params.py `lockout()` instead takes one figure per year (the highest). Example: Amazon, data center climate, had 20.11% in 2025, then 18.39% and an anti-ESG 1.23% in 2026. The engine counts three votes and uses 1.23%, so it blocks the 2027 refile. The estimator counts two votes, and 18.39% clears the 15% bar. In a 1,000-run Playwright check, a plan on that pair was blocked in 100% of runs and never committed. Amazon customer due diligence (two votes a year in 2023 and 2024) is also locked because of the per-proposal count. Every target's "blocked" share and every ranking result touching these pairs is affected.
2. **Several parameters have no estimate and are not shown on the page.** All are in sim.js `runAsk`:
   - A lapsed pair is refiled at `max(p, draw.refile*0.5)`, roughly 28%. This covers 21 pairs and outweighs the measured first-filing rates.
   - `floorShare` 0.2 and `pc *= 0.5` for floor proposals drive the whole rescission switch. The neither appears in Assumptions or the method text.
   - A first-filing vote gets an extra `exp(0.25*normal)` of noise.

   This breaks the page's own rule, PRODUCT.md item 5: "the data and counts behind every rate shown on the page".
3. **The held-out test says more than it tested.**
   - "First filings expected 12.5" is the average count of new pairs per season. The engine does not use that; it applies the exposed and unexposed per-pair rates, and those were fitted on all seasons including 2026, so they were never held out.
   - The refile check compares an expected 5.3, computed over the 11 pairs the rule leaves open, with a recorded 9. One of the 9, Meta data center climate, is a pair the rule would block. Like for like it is 8.
   - Pairs whose only filing was an anti-ESG proposal count as refiles (Alphabet training data, 2025 to 2026).

TOP IMPROVEMENTS
1. Use one shared lockout function: one vote per year, anti-ESG votes excluded or chosen deliberately, and the same rule in both files. Add a test on the Amazon climate pair.
2. Put the lapsed-refile factor, the floor share and the floor commitment factor into Assumptions, labelled "no estimate in this data". Alternatively, estimate the lapsed rate from the 21 lapsed pairs.
3. Backtest the engine itself: run the simulator fitted on 2023–2025 and compare the 2026 counts. Report the refile result as 8 of 11.

OUT-OF-FIELD NOTES
- A commitment's chance is applied only after the exclusion draw, but its estimate's denominator includes excluded filings, so it runs slightly low.
- A block in a season before the plan's first season still counts toward "your refile blocked".
- "Dots are recorded votes (8-K results)" is a source claim; I did not check it.

CONTENT RULES: FAIL
- **Arjuna paper (arXiv 2402.12590, Lai, Potter, Kim, Zhuang, Song, Evans).** The page cites it for "AI agents left alone cluster with familiar partners" (sim.js drawMethod). The abstract does not say this; it is about AI collectives widening human diversity. The full text was not read.
- **Dimson, Karakaş and Li.** I could not read the paper text, so the ×1.33 ("about a third") and the 1.4 lead and 21 supporting investors are unverified. The abstract only says leadership is "decisive" for E&S dialogues run by an investor network, not for shareholder proposals. The page applies the figure to proposal withdrawals without saying it comes from a different kind of engagement.
- **Sourati and Evans.** The page could not be fetched (login wall), so that claim is unverified.
- **Labels.** Scenario results are labelled "Not a forecast; not advice", and no vote or partner is recommended.

REVIEWER: Data accuracy (companies, policy, holdings, people) SCORE: 79 VERDICT: REVISE

All the round-1 findings are fixed. One new rule-5 error showed up when I compared every current 13F filer's rows against its filing.

TOP FAILURES
1. **New: convertible notes are counted as shares (Fidelity AXON and SO).** `read_table` drops put/call rows but doesn't check `sshPrnamtType`, so rows with principal amounts (PRN) get added in. In FMR's 13F (315066/000031506626002964, 20261116_FMRLLCFinal.xml):
   - AXON common stock is $913,824,635 / 2,162,796 shares. The site shows $937,855,626 / 26,598,796 because three "NOTE 9/1" rows (05464CAE1) are added in. That makes the share count 12 times too high and the implied price $35.
   - SO common stock is $1,862,675,715 / 22,666,829 shares. The site shows $1,872,419,199 / 32,519,829 (two Southern Co notes added).
   - Fix: keep only `sshPrnamtType == "SH"`. The `pct_of_portfolio` total also includes PRN rows.
2. Round-1 findings, re-checked:
   - **INTU: fixed.** The pattern is now `^INTUIT(\s+INC\.?)?$`. There are 10 INTU rows, all at $275.7 a share. Fidelity's matches its six INTUIT rows to the share and excludes Intuitive Surgical and Intuitive Machines. CalPERS is now $176,585,914 / 640,477, as cited in round 1. Parnassus has no INTU row.
   - **Values in thousands: fixed.** Amalgamated MSFT is now $710,181,000 for 1,384,639 shares, the filing's 710,181 × 1000. All 28 Amalgamated rows match.
   - **Stale filers and options: fixed.**
     - BlackRock, Domini, Boston Trust Walden, Impax and Nuveen are `not_current`, with no positions in holdings.json and no holding edges in graph.json.
     - `as_of_quarter` is 2026Q3, which matches the newest report period, 2026-09-30.
   - **Spot-check:** I recomputed every row for all 18 current 13F filers (CalPERS, Legal & General, Federated Hermes, Fidelity, Amalgamated, Trillium, Parnassus, NorthStar, CalSTRS, NYS Common, First Affirmative, Dana, Boston Common, Zevin, Arjuna, Harrington, Bailard, Azzad). Only the two Fidelity rows above differ.
3. **Wording: fixed.**
   - Meta: the control text matches the cited proxy. The note matches meta-20261102.htm (Class C, non-voting, effective January 19, 2027, approved by written consent, under Delaware law).
   - Anthropic: the 8-K confirms "one share of its Class F common stock" sold to the Founder LLC, and the 50.1% figure. Exhibit 3.1 confirms "smallest number of directors that constitutes a majority" for Class T and the three director classes after the Class F sunset.
   - SEC comment docket: the newest entries on the page are dated Nov. 24, 2026. I did not recount the 394 (I relied on round 1's count).
   - EU Omnibus: the directive number is gone.

TOP IMPROVEMENTS
1. Filter 13F rows to `sshPrnamtType == "SH"`, then bump `ISSUERS_VERSION` so every filing is read again.
2. Add a build check that flags any row whose implied price is more than 20% from the median for that ticker. That would have caught the AXON and SO rows.
3. The docket event is dated 2026-11-25 and titled "reaches 394", but the summary says the count was taken on November 24. Align the date.

OUT-OF-FIELD NOTES
- NBIM's report period is 2026-06-30 and it appears under the 2026Q3 heading. Its own period is in the data; check that the UI shows it.
- "Meta stays in Delaware" is implied by the Delaware filing but not stated in so many words in meta-20261102.htm.
- The round-1 out-of-field notes (ticker padding, causality ordering, GOOGL classes) were not re-checked.

CONTENT RULES: FAIL (rule 5, no invented numbers: data/holdings.json fidelity/AXON and fidelity/SO shares and value_usd include convertible notes. Rules 1–4 and 6–10: no breaches in the records re-checked.)

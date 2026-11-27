REVIEWER: Data accuracy (engagement ladder, ledger, SEC changes) SCORE: 85 VERDICT: PASS

R1 findings:
1. JLens/ADL "against" edges: FIXED. msft-2025-9, msft-2026-5/6, amzn-2024-6, googl-2025-9 and googl-2026-11 all show "Exempt solicitation against the proposal", one step per filing.
2. amz515260px14a6g: FIXED. It is now an "escalation" step dated 2026-05. It sorts after the 2026 exclusion, its signer list reads IASJ, NorthStar, Zevin, CSJP "and 14 more", and not_recorded agrees with it.
3. Withdrawn/excluded "Filed" sources: FIXED. DIS cites the HLS Forum post, VRSK the Parnassus 2024 report, AMZN 2026 the no-action letter.
4. DIS evidence[0]: FIXED. It is now the 2024-02-01 proxy (dis-20240201.htm).
5. Workday: FIXED. is_commitment is false, WDAY sits at stage 2, and outside "Commitment delivered" is 2 (INTU, NVDA).
6. Fisch/Robertson: MOSTLY FIXED. It is marked quoted:false and rendered without quotation marks, dated 2025-12-21 as on the ECGI page. The rest is in item 2 below.
7. D.F. King: MOSTLY FIXED. The "other trackers" line is gone. The rest is in item 3 below.
8. causality sec-aug14 ("should use the online Shareholder Proposal Form"), the amzn status_reason ("based solely on"), and the sim "company-and-ask filings" labels (3/19, 3/57): FIXED.

TOP FAILURES
1. New error, same kind as R1 #1: Bowyer's 2024 Apple filing is shown as for the proposal when it is against it. AAPL|ask-ai-oversight-reporting, aapl-2024-7 reads "Exempt solicitation for the proposal by Bowyer Research". The filing says "Bowyer Research urges shareholders to vote AGAINST Proposal 7" (sec.gov/Archives/edgar/data/320193/000109690624000156/bowy_px14a6g.htm). The network.json edge already has stance "oppose", but its relation is plain "exempt solicitation". The builder looks only at t.endswith("against"), so the stance is ignored. I checked the other two Bowyer filings: Apple 2025 Proposal 5 and Meta 2025 Proposal 10 are genuinely "Vote YES", so those are right.
2. Fisch/Robertson still contains detail the linked ECGI page does not show. The summary's "linked to the Center for Political Accountability" and the scope's "S&P 500, 2014 to 2023" are not on it. The scope credits "the authors' own summaries", but no source is linked for that. The correlation framing and the role of withdrawals do match the abstract.
3. The D.F. King date (2026-08-10) comes from a press release that is not linked anywhere, and I could not find that release. The scope line admits the report prints no date, so this is minor.

TOP IMPROVEMENTS
1. In build_campaigns.py, mark a solicitation "against" when either the relation ends in "against" or stance == "oppose". Or relabel the Bowyer aapl-2024 edge "exempt solicitation against".
2. Either link the authors' summary/slides as a second source for Fisch/Robertson, or cut the summary back to what the ECGI abstract says.
3. Add the D.F. King press release URL to the item, or set the date to "2026" with a note.

OUT-OF-FIELD NOTES
- Delivery states with year-only dates (VRSK "2024") get precision "month". It isn't shown on the page, but the field is wrong.
- Stage 2 "Company engaged" is still never assigned to a proposal campaign (0 at stage 2).
- I did not re-check the Disney HLS Forum "Filed" source for mentions of the AFL-CIO wording.

CONTENT RULES: FAIL. The Bowyer Apple 2024 filing is shown as supporting a proposal it opposed (campaigns.json, aapl-2024-7). The Fisch/Robertson CPA and S&P 500 2014–2023 details have no linked source (field_context.json).

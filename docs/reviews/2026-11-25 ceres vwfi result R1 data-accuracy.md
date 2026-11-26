REVIEWER: Data accuracy SCORE: 72 VERDICT: REVISE

Scope: `git diff main -- data/network.json data/causality.json data/people.json scripts/build_graph.py`. All 56 member edges were checked against their sources and every one matches: 21 against the UN DESA registry list, 2 against the Ceres VWFI Task Force list, 33 against the archived April 2024 network list. All 4 engagement texts match the 2025 tech benchmark PDF (pp. 6-8). All 7 event dates match their sources. VWFI figures (64, $9.8T, 110, $18TN, 71) are confirmed; the last three come from the page's counter values.

TOP FAILURES
1. Text in public fields that the sources don't support. In causality.json `ceres-water-behind-the-watts`, the summary ends with an internal note: "flagged for the owner's rule". On kirsten-james, "speaker on AI and water" is not in her Ceres bio (PRODUCT.md Never-claim 6). On the `ceres` organization, "Boston-based" is not on /about, and "secretariat" comes from the UN registry, not the cited page.
2. Facts are cited to a page that doesn't contain them. In `vwfi-benchmark-2025`, the five tech companies and "32.7 of 90 from 23.7" appear only in the tech PDF, not in the cited press release. The four engagements say "since launch in 2022", but the cited PDF doesn't say that. The FY22 focus-list spreadsheet linked from the launch release does show GOOGL, AMZN, AAPL and MSFT.
3. Relationships are overstated or unlabelled. The edge `vwfi` "member of" `ceres` reads as membership, but VWFI is a Ceres initiative; the `iahr`→`iccr` edge already has a precedent note for this. The "engages" edges in build_graph.py turn focus-list status into engagement, while Ceres' FAQ says it is "uncertain" which companies will be engaged. Network edges sourced to April 2024 and registry edges sourced to May 2024 carry no `as_of`, so they read as current.

TOP IMPROVEMENTS
1. Several nodes don't match the name the source lists. Federated Hermes EOS appears as "Federated Hermes" / "Federated Hermes Limited". BNP Paribas AM "(incl. AXA IM)" is used for a membership list from before the AXA IM deal, and a separate `axa-im` node already exists. New York State Common Retirement Fund appears as "New York State Comptroller". Church of England NIB appears as "Church of England Pensions Board". Add notes to these edges.
2. In the second link, the explanation "adding a high-tech analysis" isn't verified for 2023; change it to "with".
3. calstrs and australiansuper each have two VWFI edges.

OUT-OF-FIELD NOTES
1. Water-only rule. No "grid" wording appears. But the Water Behind the Watts event is about water used for electricity generation, and the second IIGCC summary says "water, power and resilience". The owner should decide on both.
2. The IIGCC `website` field points to an insight page rather than iigcc.org.
3. No em dashes, "genuinely" or "real" appear in the added text.

CONTENT RULES: FAIL (rule 6 / Never-claim 4 and 6. Unsourced: "speaker on AI and water" in people.json kirsten-james; "Boston-based" in network.json ceres; 2025 tech figures and "since launch in 2022" not in their cited sources.)

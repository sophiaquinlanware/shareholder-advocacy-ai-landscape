REVIEWER: Data accuracy SCORE: 90 VERDICT: PASS

Round 2. I re-checked only the 16 required fixes from R1 and the 3 recommended items, then spot-checked 10 new random proposal_links and 10 new random people. Sources were fetched on 2026-11-25. I checked data/network.json, data/people.json and data/graph.json, and git diff main for scripts/build_graph.py.

R1 fixes (16 of 16 verified)
- 1: the `eko -> msft-2025-hr-hotspots` co-filer link is gone from network.json and graph.json. The 2025 exempt-solicitation edge remains.
- 2: `iasj -> msft-2025-hrdd-ai-misuse` is now "supported by", with the partner note.
- 3 to 6: congregation-of-st-joseph, daughters-of-charity, etica-funds and bon-secours-health-system are gone. Their links now come from congregation-of-st-joseph-oh (meta-2025-child-safety, meta-2026-child-safety-pay), daughters-of-charity-province-of-st-louise (the same 2), etica-sgr (pltr-2026-5) and bon-secours-mercy-health (amzn-2023-facial-recognition, with the former-name note). No dangling references are left in network.json, people.json or graph.json.
- 7, 8 and 16: AFREF, Eurosif and UKSIF are gone, along with natalia-renta, aleksandra-palinska, james-alexander-uksif, oscar-warwick-thompson and oraine-origgio.
- 9 to 12: the jaylen-spann, jessica-cairns and rasmus-bessing ai_focus lines match the R1 wording, and each matches its profile_url. The michael-cohen-calpers title now matches the Climate Action 100+ page.
- 13 to 15: the color-of-change, new-york-foundation and pension-boards-ucc descriptions now hold only what their cited pages say.
- Recommended items: shareholder-rights-group ai_related is now false. pfa-pension and amazon-employees-for-climate-justice are now true; the SHARE AI oversight filing and the ICCR AI data centre listing support this. build_graph.py now prints a warning for each unresolved link. All 189 links resolve.

Error rates (new samples)
- proposal_links: 10 checked, 0 wrong (0%). These were ajl-foundation and united-for-respect on amzn-2026-responsible-ai-sales, bowyer on aapl-2025-5, segal-marco-advisors on aapl-2024-ai-transparency, newground-social-investment and praxis on pltr-2026-5, iahr on googl-2024-child-online-safety, parnassus on googl-2026-ai-board-oversight, adrian-dominican on googl-2026-5, and iasj. Every source names that organization for that proposal.
- people: 10 checked, 0 wrong (0%). These were curtis-t-hill-jr, fiona-manning, pia-gisgard, brynn-obrien, diandra-soobiah, catherine-mccall, saul-chambers, norah-berk, jayasree-iyer and jo-raven. Each name and title appears on the profile_url, which is the employer's own site.

TOP FAILURES
None blocking.

TOP IMPROVEMENTS
1. pia-gisgard name: the Swedbank release spells it "Pia Gisgård". Use the diacritic unless the ASCII spelling is deliberate.
2. `ajl-foundation -> amzn-2026-responsible-ai-sales` is labelled "exempt solicitation". AJL is a signatory of the IASJ letter, not the filer. This matches how co-signatories are already recorded elsewhere, but a note saying "signatory of IASJ's exempt solicitation letter" would be more precise.
3. The daughters-of-charity merge rests on the 2026 pairing in the ICCR guide and Meta's proxy. The 2025 Meta proxy says only "The Daughters of Charity, Inc.". The merge is reasonable; a note would show the reasoning.

OUT-OF-FIELD NOTES
- git diff main for build_graph.py also shows a Parnassus "engaged directly" block that wasn't in R1's diff. Either main moved or another change is on this branch. Not reviewed here.
- There are untracked " 2" duplicate files in data/ and scripts/ (for example "scripts/build_proposal_links 2.py"). Don't commit them.

CONTENT RULES: PASS (the R1 rule 6 failures are corrected; no em dashes, "genuinely" or "real" in the added lines).

REQUIRED FIXES
None.

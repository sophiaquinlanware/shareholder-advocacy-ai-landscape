REVIEWER: Data accuracy SCORE: 74 VERDICT: REVISE

Scope: `git diff main -- data/network.json data/people.json scripts/build_graph.py` on data/census-coalitions (203 new organizations, 190 proposal_links, 115 people). Sources fetched with curl and pypdf on 2026-11-25. Seeded random samples.

Error rates
- (a) proposal_links: 29 checked (25 random, plus 2 "coordinated by" and 2 "exempt solicitation against"). 2 wrong = 6.9%.
- (b) organizations: 25 checked (5 ai_related true, all 5 correct). 3 wrong = 12% (1 source shows no shareholder advocacy, 2 duplicates). 3 more have a description clause the cited page does not contain (24% counting those). 2 unverifiable (citywire and peta.org block automated fetches).
- (c) people: 45 checked (all 35 "other", 10 random "employer bio"). Every person and title confirmed on profile_url. 3 wrong = 6.7% (2 ai_focus contradicted by their own profile_url, 1 attached to an organization that fails the advocacy test). 1 unverifiable (janne-werning, citywire).

TOP FAILURES
1. Two proposal links claim more than the source. `eko -> msft-2025-hr-hotspots` "co-filer" cites Azzad's 2026 exempt solicitation (000121465926014752), which concerns the 2026 proposal and says only that Ekō "served as shareholder representative for previous versions". `iasj -> msft-2025-hrdd-ai-misuse` "coordinated by" cites a NorthStar client note that says only "In partnership with ... Investor Advocates for Social Justice"; the AFSC release it links does not say IASJ coordinated it either.
2. Duplicate organizations. The ICCR 2026 guide and Meta's 2026 proxy list the same Meta exec-pay proposal under "Congregation of St. Joseph, OH" / "Congregation of St. Joseph" and "Daughters of Charity, Province of St Louise" / "Daughters of Charity, Inc.". Also etica-funds = etica-sgr (same company), and bon-secours-health-system is the pre-2018 name of bon-secours-mercy-health.
3. Sources that show no shareholder advocacy. americans-for-financial-reform-education-fund cites a Proxy Preview contributor bio about an article on regulation. eurosif (team page) and uksif (staff page) show EU/UK policy work only; uksif's page has no hit for shareholder, stewardship, engagement or voting.

TOP IMPROVEMENTS
1. ai_focus understates where the profile_url shows AI work: jaylen-spann (her bio says her focus is AI and data centers), jessica-cairns, rasmus-bessing. royal-london people co-wrote a page listing "Sustainable and Ethical AI" as a priority.
2. 71 new organizations have no ai_related field. Some of their own sources show AI work (pfa-pension: AI oversight proposal at Alphabet; amazon-employees-for-climate-justice: the AI data centre proposal).
3. build_graph.py drops unresolved proposal_links without a message. All 190 resolve today (checked), but a print would catch future misses.

OUT-OF-FIELD NOTES
- Roles that are not engagement: oscar-warwick-thompson (policy and regulatory affairs), oraine-origgio (investor conferencing). Borderline: maggie-randolph, eric-darrisaw (in-house public policy and ministry roles, kept for their ICCR board seats).
- shareholder-rights-group ai_related true rests on a generic line about AI proposals. That's a process group, not AI work.
- snjm vs sisters-holy-names-us-ontario: possibly the same body (general administration vs province). Owner to decide.

CONTENT RULES: FAIL (rule 6, relationships not supported: the eko and iasj links above; description clauses not on the cited page: color-of-change, new-york-foundation, pension-boards-ucc; michael-cohen-calpers "former chair"). Em dashes, "genuinely" and "real": none in the added lines (PASS).

REQUIRED FIXES
1. proposal_links `eko -> msft-2025-hr-hotspots` "co-filer": remove. The source is about the 2026 proposal and does not call Ekō a co-filer. The existing exempt-solicitation edge stays.
2. proposal_links `iasj -> msft-2025-hrdd-ai-misuse` "coordinated by": change relation to "supported by", note "Named as a partner in the co-filing (NorthStar client communication)". Or remove it.
3. congregation-of-st-joseph: remove as a duplicate of congregation-of-st-joseph-oh. Repoint its 2 links (meta-2025-child-safety, meta-2026-child-safety-pay) to congregation-of-st-joseph-oh.
4. daughters-of-charity: remove as a duplicate of daughters-of-charity-province-of-st-louise. Repoint its 2 links (meta-2025-child-safety, meta-2026-child-safety-pay).
5. etica-funds: remove as a duplicate of etica-sgr. Repoint `-> pltr-2026-5` "supported by" to etica-sgr.
6. bon-secours-health-system: remove as a duplicate of bon-secours-mercy-health. Repoint `-> amzn-2023-facial-recognition` "co-filer" with note "Listed by PRI under its former name, Bon Secours Health System".
7. americans-for-financial-reform-education-fund: remove (source shows no shareholder advocacy). Remove person natalia-renta with it.
8. eurosif and uksif: remove, or re-source to a page showing their own stewardship or engagement work. If removed, also remove aleksandra-palinska, james-alexander-uksif and oscar-warwick-thompson.
9. jaylen-spann ai_focus: "Majority Action bio says her work focuses on emerging technologies and their infrastructure, especially AI and data centers."
10. jessica-cairns ai_focus: "Quoted as Alphinity's Head of ESG on the Responsible AI and ESG framework it published with CSIRO (2024)."
11. rasmus-bessing ai_focus: "Quoted on the AI board oversight proposal PFA filed at Alphabet with SHARE and Parnassus."
12. michael-cohen-calpers title: "Chief Operating Investment Officer; member, Climate Action 100+ Steering Committee" (drop "and former chair"; not on the CA100+ page).
13. color-of-change description: drop "and criticizing the scope of Amazon's racial equity audit" (not in the cited filing).
14. new-york-foundation description: drop "; ICCR member" (the cited article only recommends ICCR as a resource).
15. pension-boards-ucc description: drop the 2024 FedEx clause, or cite the FedEx proxy.
16. oraine-origgio: remove (the role is events, not engagement). Or keep with a source that shows engagement work.

Not checked: people outside the sample (70), organizations outside the sample (178), and links outside the sample (161). Unverifiable here: union-investment, peta, janne-werning.

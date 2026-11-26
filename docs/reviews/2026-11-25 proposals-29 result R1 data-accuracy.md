REVIEWER: Data accuracy SCORE: 88 VERDICT: PASS

Every spot-check matched sec.gov. Netflix 2024 (144,328,782 / 189,038,209 = 43.29%), Palantir Items 4 and 5 (8.28% and 12.47%, with the class weighting note confirmed by the 8-K), Southern Item 9 (9.74%) and Digital Realty Item 4 (22.47%) all agree with their 8-K counts. The Amazon deadline (Dec 10, 2026, quote exact), the Salesforce deadline (Dec 17, 2026) and the Netflix 2024 filing_deadline (Dec 23, 2023) agree with the proxies. All three msft-2026-6 vote_history links resolve to the right 8-Ks with the right support: 33.58%, 32.03% and 27.48%. Recomputing For/(For+Against) on all 11 round-29 records shows no arithmetic errors. I also checked two notes: the Axon "nine of thirteen" claim and the Netflix AFL-CIO/Segal Marco filer are both in the cited proxies.

TOP FAILURES (max 3, each with evidence)
1. Five "next" deadlines have already passed (the build didn't follow the design's intent). In data/companies.json, AAPL is 2026-09-10, DIS 2026-09-24, ADBE 2026-10-30, AVGO 2026-11-02 and IBM 2026-11-10. As of 2026-11-25 these windows are closed, but the field name still presents them as upcoming. AMD (2026-11-27) is two days out.
2. The AI test is not written down (the design is unclear). csco-2026-5 is included only because of the filer's PX14A6G, which I confirmed cites $9.3B in AI infrastructure orders. The Southern 2025 fossil-fuel proposal is excluded, yet its WHEREAS opens with load growth "primarily driven by manufacturing and data center expansion" (so-20250410.htm). Both calls can be defended, but the rule ("subject of the ask, or the filer's own solicitation") is not in docs/plans/2026-11-25-proposals-29.md. The Southern exclusion is recorded only in the commit message, not in the data.
3. csco-2026-5 has no filing_deadline, the only record of 76 without one. The 2025 Cisco proxy was available.

TOP IMPROVEMENTS (max 3)
1. Mark past deadlines with a status field (for example `deadline_passed: true`), or label the field "latest stated deadline".
2. Add deadline_quote for the 22 newly covered companies. Only the original 7 have quotes in data/proposal_deadlines.json.
3. Add an `excluded` list with reasons (Southern 2025) so the AI test can be audited.

OUT-OF-FIELD NOTES (max 3, one line each)
- In build_proposal_links.py, same_subject ignores the filer. Title overlap could link proposals that share a title but differ in substance; the links I observed are fine.
- The Salesforce 2026 proxy says two stockholder proposals were excluded. One had appeared in the 2022 to 2024 proxies. I did not check whether either concerned AI.
- Netflix 2026 has no AI item, which I confirmed (its proposals are ESG investments, branding and cumulative voting).

CONTENT RULES: PASS (every new fact traces to a cited SEC, CCH or Harvard Forum URL, and the PRI terms issue was handled by not citing PRI)

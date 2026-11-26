REVIEWER: Data accuracy (proposals) SCORE: 91 VERDICT: PASS

TOP FAILURES (max 3, each with evidence)
1. Six voted proposals have no `item` number, though each one's proxy and 8-K give it. The six are googl-2023-audit-committee-review (item 15 in the 8-K d442583d8k.htm), googl-2024-child-online-safety (14, "Proposal Number 14" in lgoog2024_def14a), meta-2023-community-standards (10), meta-2025-child-safety (9), meta-2026-child-safety-pay (10) and amzn-2026-climate-cost (ITEM 6 in tm261382-1_def14a). Every other record carries its item, so these six will show a blank or break item-based sorting and grouping. They all came in as "filer network research" rows.
2. Three meeting_date_source links point at fund N-PX filing directory listings from unrelated filers, not at company filings:
   - googl-2024-child-online-safety links CIK 1105446, a Calvert Responsible Index Series N-PX.
   - meta-2025-child-safety links CIK 1524513.
   - meta-2026-child-safety-pay links CIK 1100663.
   The dates themselves are correct, since each date appears in the company's own 8-K. But the cited source is a bare EDGAR directory page that never states the meeting date. The company 8-K already in `results_url` should be cited instead.
3. The `proxy_url` field holds non-proxy sources on three withdrawn or excluded rows. aapl-2026-ai-energy links a minerva.info blog post. amzn-2026-responsible-ai-sales links a Bloomberg Law news article. nvda-2026-military-ai links the SEC no-action letter. googl-2024-child-online-safety links the proxy PDF instead of the .htm used everywhere else (it loads, HTTP 200). Anything labelled "Proxy statement" on the site would be mislabelled for these rows.

TOP IMPROVEMENTS (max 3)
1. Fill the six missing item numbers. Repoint the three meeting_date_source links to the company 8-K.
2. Rename `proxy_url` to a general source field, or give it a label, for rows that never reached a proxy (withdrawn or excluded).
3. The two floor proposals have `support_pct: null`, which is right because they are not comparable. They could still store `vote_counts` from the 8-K: Alphabet 2025 item 15 got 342 FOR against 12,515,614,679, and Amazon 2026 also gives counts. That way the "8-K gives the raw counts" note can be backed by data.

OUT-OF-FIELD NOTES (max 3, one line each)
- The Alphabet support_note says "support from outside holders is higher than this figure". That is an inference not stated in the 8-K, so it should say that this site computed or inferred it.
- vrsk-2024-responsible-ai has year 2024 by inference from the proposal deadline; the record labels this as inferred, which is acceptable.
- In googl-2025-15(floor), the id contains parentheses and a space-free "(floor)". If ids are used in URLs or anchors, check that they are slug-safe.

CONTENT RULES: PASS. No invented support figures. The Tesla 53.61% has a correct note on the bylaw basis (43.25%) and on the "not approved" outcome. NVIDIA's counting of abstentions is noted. Inferred items are labelled. Nothing reads as a vote recommendation.

FULL FINDINGS:
googl-2023-audit-committee-review | item | null | 15 | https://www.sec.gov/Archives/edgar/data/1652044/000119312523163590/d442583d8k.htm
googl-2024-child-online-safety | item | null | 14 | https://www.sec.gov/Archives/edgar/data/1652044/000119312524160721/d805807d8k.htm
meta-2023-community-standards | item | null | 10 | https://www.sec.gov/Archives/edgar/data/1326801/000132680123000083/meta-20230531.htm
meta-2025-child-safety | item | null | 9 | https://www.sec.gov/Archives/edgar/data/1326801/000132680125000090/meta-20250528.htm
meta-2026-child-safety-pay | item | null | 10 | https://www.sec.gov/Archives/edgar/data/1326801/000162828026039193/meta-20260527.htm
amzn-2026-climate-cost | item | null | 6 | https://www.sec.gov/Archives/edgar/data/1018724/000110465926041026/tm261382-1_def14a.htm
googl-2024-child-online-safety | meeting_date_source | Calvert N-PX directory (CIK 1105446) | should be the company 8-K | https://www.sec.gov/Archives/edgar/data/1105446/000114036124039144/
meta-2025-child-safety | meeting_date_source | third-party filer directory (CIK 1524513) | should be the company 8-K | https://www.sec.gov/Archives/edgar/data/1524513/000143893425002314/
meta-2026-child-safety-pay | meeting_date_source | third-party filer directory (CIK 1100663) | should be the company 8-K | https://www.sec.gov/Archives/edgar/data/1100663/000143893426002265/
googl-2024-child-online-safety | proxy_url | .pdf | .htm version used elsewhere | https://www.sec.gov/Archives/edgar/data/1652044/000130817924000612/lgoog2024_def14a.htm
aapl-2026-ai-energy | proxy_url | minerva.info blog | not a proxy statement | https://www.minerva.info/post/apple-shareholders-stunted-proposals-plummet-as-sec-shift-bites
amzn-2026-responsible-ai-sales | proxy_url | Bloomberg Law article | not a proxy statement | https://news.bloomberglaw.com/esg/amazon-to-block-investor-vote-on-ai-services-for-israel-dhs
nvda-2026-military-ai | proxy_url | SEC no-action letter | not a proxy statement | https://www.sec.gov/files/corpfin/no-action/14a-8/tttnvidia31026.pdf

support_pct: all 65 voted proposals with a figure match For/(For+Against), recomputed from the 8-K counts, to within 0.01 or better, so there are zero discrepancies over 0.1. That covers all MSFT, META, GOOGL, AMZN, AAPL, TSLA, NVDA, IBM, AXON, PLTR, NFLX, SO and DLR rows. The six rows that carry `vote_counts` also match their own counts.

Meeting dates and years: every voted proposal's date string appears in its 8-K. Item numbers match the 8-K or proxy numbering for every voted row that has one. I checked MSFT, GOOGL and META numbering against the 8-Ks, AMZN against the proxy ITEM headings, and TSLA (Proposal Seven, Stephen Hawk) and AXON (No. 6) against their proxies. I checked titles and proponents by automated keyword match against each proxy, and read Boston Common (GOOGL 2024 #14) by hand. The four upcoming proposals (MSFT 4, 5 and 6 on 2026-12-08; CSCO 5 on 2026-12-15, Azzad) match their proxies. All 62 proxy and 8-K URLs, plus every withdrawn or excluded source URL, load (HTTP 200) and point at the right company.

Checked: 71 fully (65 voted with a figure, 2 floor proposals, 4 upcoming). 8 partly: the withdrawn and excluded rows, where links load and status matches the rows' own cited sources, but I did not read the PDFs or third-party pages in full. Could not check: 0.

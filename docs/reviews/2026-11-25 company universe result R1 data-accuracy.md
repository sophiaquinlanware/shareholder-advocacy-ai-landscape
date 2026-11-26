REVIEWER: Data accuracy SCORE: 81 VERDICT: PASS

TOP FAILURES
1. **The build didn't follow the design: 18 of 60 routes are unsourced.** The plan says every `shareholder_route` is "set from the company's EDGAR filing types, linked".
   - 14 rows are "private" with `route_source_url: null` (Counter run on companies.json). The executor's own check log says "No source states that they are private."
   - 4 rows use "UNVERIFIED" as both route and ticker: companies.json l.997–1010, 1442–1456, 1551–1564 and 1598–1616. That is not one of the four allowed values.
   - Warner Bros. Discovery can be sourced: data.sec.gov shows 10-K ×6, DEF 14A ×6 and 15-12G (registration terminated October 2026).
   - Unless the UI renders these as "source pending", this breaks Never claim 4.
2. **The design is wrong on TSMC: it doesn't meet the selection rule.** Rule 2 requires an engagement "on AI or on AI's direct effects".
   - The Parnassus 2025 report says it engaged TSMC on "water quantity and quality risks, renewable energy procurement, grid decarbonization" (fab water in Taiwan and Arizona).
   - "Computing demands" appears only in Parnassus's company description.
   - companies.json l.1796 says the engagement was "citing AI's effect", which makes the AI link look stronger than the source does. The executor's log concedes AI "is not the engagement topic."
3. **The build overstates some dates and route labels (minor).**
   - The Magic, MiniMax and 01.AI basis lines and Nvidia's evidence item put the Seoul additions in 2024, but the gov.uk page gives no date for them.
   - The EU-code "2025" is the date the code was published, not when each company signed.
   - SpaceX (EDGAR: 10-Q ×2, 8-K ×11, no 10-K or DEF 14A) and Anthropic are labelled "US proxy rules apply". The plan defines that label as filing a 10-K and DEF 14A.

TOP IMPROVEMENTS
1. Source the private-company rows (company site or registry) and set Warner Bros. Discovery's route from its Form 15. Map "UNVERIFIED" to "source pending" before it reaches the UI.
2. Either drop TSMC or move its basis to an AI source. Otherwise reword it to "engaged TSMC on water and renewable energy (Parnassus)" with no "citing".
3. Write the year as "added by [date]", or leave it out where the source gives no date.

Spot checks, all passed:
- Nebius 6-K: $17.4B through 2031.
- Nebius EDGAR: 20-F, Nasdaq.
- SpaceX 10-Q: xAI wholly owned since 2 Feb 2026; SPCX on Nasdaq.
- gov.uk Seoul page: xAI listed; Magic, Minimax, 01.ai and NVIDIA added.
- Disney: the SEC staff letter URL resolves, but it is a scanned PDF and I couldn't extract its text. The Harvard post corroborates the SEC denial.
- Comcast: the Harvard post supports the withdrawal (marked secondary source).
- AGORA: Alibaba (China) Co., Ltd., 1 Dec 2024.
- Alibaba EDGAR: 20-F/6-K, NYSE.
- Parnassus 2025: Workday quote verbatim; Salesforce is in the Responsible AI list.
- AMD: 6 GW, 6 Oct 2025.
- Southern Item 9 (As You Sow): cites AI data centers.
- Digital Realty's water proposal cites AI growth.
- Candriam: "stood out" (the data says "named").

Original 7: no difference in any rights-map field from origin/main (key-by-key comparison).

All three R1 failures are fixed:
- The selection rule is now written as applied (SOURCES.md).
- Vote figures are gone, and Disney now has a primary source.
- The foreign-issuer route value has been added.

OUT-OF-FIELD NOTES
- build_graph.py l.70 drops "private" and "UNVERIFIED" tickers, so 13 companies are left out of graph.json without any notice.
- Southern Company fails the "develops or operates AI infrastructure" condition. It is kept only by recorded owner choice; the UI should say so.
- Motorola and Thales rest on one 2022 source. Rule 2 has no age limit.

CONTENT RULES: PASS. companies.json has no em dashes, "genuinely", "real", "standout" or "target". The open data-accuracy risk is Never claim 4 (failure 1).

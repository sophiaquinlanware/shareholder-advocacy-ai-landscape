REVIEWER: Data accuracy (companies, policy, holdings, people) SCORE: 72 VERDICT: REVISE

**TOP FAILURES**

1. **Every INTU holding includes the wrong companies.** In scripts/holdings.py the INTU issuer pattern is `r"^INTUIT"`. That also matches "INTUITIVE SURGICAL" and "INTUITIVE MACHINES".
   - Parnassus Q3 2026 13F: the site shows $2,039,656 / 5,016 shares. In the filing that row is Intuitive Surgical; there is no Intuit row at all.
   - CalPERS: the site shows $530,576,847. That is Intuit ($176.6M) plus Intuitive Surgical ($354.0M).
   - BlackRock: the site shows $29.44B / 56,973,811 shares. That is Intuit + Intuitive Surgical + Intuitive Machines, to the share.
   - The site's value per share across the 15 INTU rows runs from $0.35 to $517, which confirms the mixing.
2. **value_usd is 1000x too low for filers that report in thousands.** Amalgamated's Q3 2026 13F still reports values in $ thousands (MSFT 710,181 for 1,384,639 shares). The site stores 710,181 as USD; the real figure is about $710M. Domini (2019 filing) has the same problem: TSLA "288" USD for 689 shares. Boston Trust Walden (2011), Impax (2018) and Nuveen/TIAA (2019) predate 2023, when 13F values were in thousands, so they are almost certainly affected too, but I did not check their rows. This breaks PRODUCT.md rule 5 (no invented numbers).
3. **Stale filings shown under "2026Q3", plus options counted as shares.**
   - BlackRock's row comes from the Q2 2024 13F (CIK 1364742, which stopped filing after the 2024 reorganisation). Domini, Boston Trust Walden, Impax and Nuveen are from 2011–2019. holdings.json still says `as_of_quarter: 2026Q3`.
   - The script doesn't filter `putCall`, so call options are added in. BlackRock MSFT on the site is $247.74B against $247.60B in common stock; AAPL and META are inflated the same way.

**TOP IMPROVEMENTS**

1. Match 13F rows by CUSIP, not issuer-name prefix. At minimum, anchor the INTU pattern as `^INTUIT( INC)?$`.
2. Normalise values to dollars: check value ÷ shares against a plausible price, or apply the thousands convention by filing date and filer. Drop or flag put/call rows.
3. Show each investor's own report period. Leave out or label any filing older than about two quarters.

**OUT-OF-FIELD NOTES**

- Ticker format is inconsistent: Zhipu is "2513" but etnet shows 02513, while MiniMax is padded as "00100".
- Event `canada-privacy-bill` (2026-06-15) sits out of date order between 05-22 and 06-03 in causality.json.
- The Zevin and CalPERS GOOGL rows add Class A and Class C together; Parnassus is Class A only. That's fine, but the site doesn't say so.

**CONTENT RULES: FAIL** (rule 5, no invented numbers: wrong holdings values and issuers in data/holdings.json, see failures 1–2. Rules 1–3 and 6–10: no breaches seen in the records I checked. The SEC rescission is described as a proposal; people records give public professional details only.)

**FULL FINDINGS**

- holdings.json | parnassus-investments/INTU | value_usd, issuer | $2,039,656 / 5,016 shares "INTU" | row is INTUITIVE SURGICAL INC; no Intuit row | https://www.sec.gov/Archives/edgar/data/948669/000117266126004635/
- holdings.json | calpers/INTU | value_usd | 530,576,847 | Intuit 176,585,914 (640,477 shares) | https://www.sec.gov/Archives/edgar/data/919079/000091907926000013/
- holdings.json | blackrock/INTU | value_usd | 29,436,519,657 | Intuit 16,028,507,708 | https://www.sec.gov/Archives/edgar/data/1364742/000108636424008417/
- holdings.json | the other 12 INTU rows | value_usd | value per share $0.35–$428 | same pattern-match bug (seen in the per-share values; each filing not opened)
- holdings.json | amalgamated-bank/all 28 rows | value_usd | e.g. MSFT 710,181 | filing is in $ thousands (≈$710M) | https://www.sec.gov/Archives/edgar/data/919192/000091919226000006/
- holdings.json | domini-impact-investments/TSLA | value_usd, period | 288 USD, 2019-12-31 | $ thousands, 2019 filing | https://www.sec.gov/Archives/edgar/data/1399069/000095012320002357/
- holdings.json | blackrock/MSFT, AAPL, META | value_usd | 247.74B / 222.36B / 81.26B | common stock 247.60B / 221.20B / 81.23B; the difference is call options | the BlackRock URL above
- holdings.json | blackrock | report_period | 2024-06-30 under as_of 2026Q3 | stale filer CIK | the BlackRock URL above
- companies.json | meta-platforms | control.text | "A new non-voting share class takes effect January 19, 2027" | not in the cited 2026 proxy (no "non-voting" or "January 19" match) | https://www.sec.gov/Archives/edgar/data/1326801/000162828026025532/meta-20260416.htm
- companies.json | anthropic | control.text | "One Class T share elects a majority of the board" | the cited 8-K confirms Class F at 50.1%, Class N with no vote, and Class T directors, but not "one share" or "majority of the board" (that is probably in the charter, Ex. 3.1) | https://www.sec.gov/Archives/edgar/data/2130357/000162828026075973/ant-20261119.htm
- causality.json | s7-2026-32-comment-count | summary | "394 entries when comments closed" | 394 is correct (A14+B190+C188+D2), but the deadline was Nov 20, 2026 and the count includes Nov 24 entries | https://www.sec.gov/rules-regulations/public-comments/s7-2026-32
- causality.json | eu-omnibus-i-adopted | summary | "Directive 2026/470" | number not in the cited Latham page (the dates and thresholds are) | https://www.lw.com/en/insights/EU-Sustainability-Omnibus-Published-in-the-Official-Journal
- causality.json | cn-rare-earth-chip-controls | suspension_source_url | Announcement 2026 No. 58 | source would not load (http://dltb.mofcom.gov.cn/...), not verified
- Sources that would not load (not verified): it-rome-court-annuls-openai-fine (wsgr, 403); coe-ai-convention-eu-ratifies (coe.int, 403/JS); au-guardrails-proposal (consult.industry.gov.au, empty); people marian-macindoe, jeffrey-warshauer, navishka-pandit (JS pages).

**What checked out**

- All 27 next_proposal_deadline dates match their quote and the proxy text, and every open/passed status is right as of 2026-11-26 (AMD's 11-27 deadline correctly open).
- Listings confirmed: Anthropic (ANT, Nasdaq, EDGAR), SpaceX (SPCX, Nasdaq), SK hynix (SKHY, Nasdaq), MiniMax (00100, listed 2026-01-09) and Zhipu (02513, listed 2026-01-08) on etnet.
- SpaceX's $1M/3%, six-month threshold and plurality voting match the bylaws.
- Tesla's classified board and Musk's 19.8% match the 2026 proxy. The Meta, Alphabet, Oracle and Comcast control percentages and plurality claims match.
- Bylaw director-voting claims match for Microsoft, Workday, Netflix, Broadcom, IBM, Palantir and Anthropic.
- NBIM AAPL and AMD match the NBIM API. Parnassus MSFT/NVDA/META/GOOGL/AAPL, Zevin, Arjuna and CalPERS MSFT/CRM/SPCX/GOOGL match their 13Fs.
- 21 of 24 people are supported by their cited source. Two are honestly labelled "role not confirmed".

**Records checked:** companies.json 27 deadlines + 16 companies for listing and governance fields; causality.json 36 events (31 against fetched or known sources, 3 not loadable); holdings.json 22 positions across 7 investors, plus the matching code (scripts/holdings.py, ISSUERS); people.json 24 people (21 confirmed, 3 not loadable).

REVIEWER: Data accuracy SCORE: 86 VERDICT: PASS

Round 2 re-checks only the R1 failures and the org_id fixes (data/people.json, 147 people).

- **Org ids:** every org_id now resolves to a graph.json node. Each org_id has one org_name. Neither anousha-p nor alan-hall is left in `relations`.
- **Banned text:** no em dashes, and neither "genuinely" nor "real" appears.

FIXED AND CONFIRMED
- **susan-francois:** now gives "12.5% per the 8-K", which matches pltr-2026-5 (12.47%). The 56% is attributed to the proponents. Never claim 5 now passes.
- **antonia-parkes and ashley-kopczynski:** now attached to org_id australiansuper and ifm-investors. Both are graph nodes, and the RIAA page lists each co-chair under that employer.
- **aaron-acosta:** now "Program Director", which matches iasj.org/aaron-acosta.
- **magdalena-kettis:** the IPDD wording matches the Nordea 2025 report.
- **jan-rydzak:** rankingdigitalrights.org/who/ lists "Executive Director".
- **glenn-booraem and carolyn-cross:** Vanguard's statement of 3 September 2025 names them to lead VCM and VPM Investment Stewardship.
- **carine-smith-ihenacho:** the new title matches the NBIM release of 1 October 2026: she is "stepping down", and the changes take effect on 1 January 2027.
- **marian-macindoe:** the parnassus.com pages render only in a browser, and my fetch returned an empty page. Parnassus's 2025 stewardship report (in search results) and the coordinator's browser check both give "Managing Director, Sustainable Investment Strategy". Accepted.
- **antje-stobbe:** a search shows the March 2026 release names her Head of Stewardship. The ai_focus is now dated 2025.
- **Trimmed lines:** liza-mcdonald's ai_focus is cut back, and stuart-riddick's is reworded.
- **susan-mika:** org_id is now benedictine-sisters-of-boerne-texas, the correct node.

TOP FAILURES
1. **barbara-mccracken still has no source.** Her title, "Shareholder advocacy lead (no formal title published)", and her ai_focus co-filings rest on mountosb.org/2025/10/08. That page covers peace activities and never mentions shareholders, a filing, Amazon, Alphabet or Meta. Fix one of two ways:
   - cite a page that names her in shareholder work and lists the 2026 co-filings, such as an ICCR or proxy filing;
   - or remove her.

TOP IMPROVEMENTS
1. **antje-stobbe:** the www.allianzgi.com URL also returned 503 to WebFetch, which may be bot blocking. Her ai_focus cites the 2025 policy, so link the 2025 release, which loads.
2. **stuart-riddick:** "Aberdeen has published investor guidance on responsible AI" is not on his cited page. Name or link the abrdn article "Responsible AI: what role can an investor play?" (2024).
3. **ai_source_url field:** consider adding one, so ai_focus lines that rest on other pages can be traced.

OUT-OF-FIELD NOTES
- graph.json types ranking-digital-rights as `investor`. It is a research nonprofit, not an investor.
- carine-smith-ihenacho leaves at the end of 2026. Remove her or mark her as former in January 2027.
- graph.json changed by about 9,700 lines in this branch, and I did not review it beyond these node ids.

CONTENT RULES: PASS

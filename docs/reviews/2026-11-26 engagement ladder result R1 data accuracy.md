REVIEWER: Data accuracy (engagement ladder, ledger, SEC changes) SCORE: 76 VERDICT: REVISE

TOP FAILURES
1. **Solicitations against a proposal are shown as solicitations for it.** The ADL/JLens PX14A6G at MSFT (11/6/2025) is titled "The case to vote AGAINST Proposal 9", and the Amazon one (4/12/2024) "...AGAINST Proposal 6". Their graph edges on msft-2025-9, amzn-2024-6 and googl-2026-11 are typed plain "exempt solicitation". So campaigns.json labels them "Exempt solicitation", as if they backed the proposal. A related problem: AMZN|ask-customer-due-diligence 2026 carries 19 "Exempt solicitation" states on an excluded proposal. That filing (amz515260px14a6g) is actually a vote against directors Rubinstein, Gorelick, Ng and Stonesifer over the exclusion. The ladder also sorts it before the 1/30/2026 exclusion, although it was filed in May, and it contradicts the `not_recorded` line saying votes against directors aren't recorded.
2. **field_context quotes and scope notes.** campaigns.js wraps `f.text` in quotation marks, but the Fisch/Robertson text is a paraphrase. Its specifics (CPA-linked proposals, no effect for others, S&P 500 2014–2023) are not in the cited SSRN/ECGI abstract, which only says "correlated". The data's own note says they come from "summary and slides" that aren't linked. ECGI gives 21 Dec 2025; the site says 2025-12-22. The D.F. King scope line "Other trackers report a smaller drop" has no source, and the "2026-08" date isn't in the PDF. Glass Lewis is verbatim and correct.
3. **Overstated or wrong ledger and ladder entries.** Workday counts toward outside_by_stage "Commitment delivered: 3", but its own notes say no promise was made. The DIS evidence says the 2025 proxy is the "first proxy after the withdrawal" and adds the AI oversight language. In fact the 2024 DEF 14A (dis-20240201) already contains the identical sentence, so the earliest delivery date is 2024-02-01. The "Filed" states for withdrawn DIS and VRSK cite those companies' 2024 proxies, which don't contain the proposals (no AFL-CIO or Parnassus in either).

TOP IMPROVEMENTS
1. Fix the edge types (or infer "against" from the PX14A6G title). Move vote-against-director filings into their own state type, dated by filing date.
2. For withdrawn proposals, use the proponent's notice or no-action letter as the "Filed" source.
3. Label the sim exclusion rate as company-ask-season units, not filings. 3 of 19 and 3 of 57 are counted that way, while 2026 has 20 filings that reached an outcome.

OUT-OF-FIELD NOTES
- Stage 2 "Company engaged" is never assigned to a proposal campaign; the docstring says it should be.
- Delivery `date` fields hold prose (e.g. "2024 (copyright line; …)") that the ladder may print as a date.
- build_campaigns.py and campaigns.json changed during this review (16:50); findings are as of that time.

CONTENT RULES: FAIL. No unsourced facts / no invented quotes: the Fisch/Robertson paraphrase is shown as a quote, and the D.F. King "other trackers" claim has no source (field_context.json). The proposed rescission is correctly called "proposed".

Verified correct: all 9 promised quotes and all 21 evidence quotes match their sources word for word (Intuit's governance page quote not checked: the live page returned 429, but the archive capture of 2025-04-15 exists). Also verified: the Nov 17, 2025 and Aug 14, 2026 SEC statements (80 days, (i)(1), "effective immediately…", no (i)(1) requests in 2025-26); Release 34-106383, S7-2026-32, 91 FR 59904, comments due 11/20/2026; Chubb 26-734 (3/31/2026, quote exact); BJ's 26-11075-LTS (4/22/2026, motion ALLOWED, dismissal DENIED); Rule 14a-8(b) $2k/3y, $15k/2y, $25k/1y; metrics 69/57/3/2/3/4.

FULL FINDINGS
- graph.json→campaigns.json | msft-2025-9, amzn-2024-6, googl-2026-11 | ADL/JLens state | "Exempt solicitation" | "vote AGAINST Proposal 9/6" | sec.gov/Archives/edgar/data/789019/000092189525002903/px14a6g14098msft_11062025.htm
- campaigns.json | amzn-2026-responsible-ai-sales | 19 campaign states | exempt solicitation for the proposal, before the exclusion | vote against 4 directors over the exclusion, filed May 2026 | sec.gov/Archives/edgar/data/1018724/000121465926006345/amz515260px14a6g.htm
- commitments.json | dis-2024-afl-ai-disclosure | evidence[0] | "First proxy after the withdrawal adds…" (2025-01-23) | same sentence in the 2024-02-01 proxy | sec.gov/Archives/edgar/data/1744489/000174448924000073/dis-20240201.htm
- campaigns.json | DIS, VRSK | Filed source_url | 2024 DEF 14A | proposal not in it | same URL; …/1442145/000119312524087955/d653310ddef14a.htm
- campaigns.json | outside.WDAY | stage | Commitment delivered | "Not a commitment in the usual sense" (own note) | newsroom.workday.com/2025-06-12-…
- field_context.json | fisch-robertson | text, date | quoted findings, 2025-12-22 | abstract: correlation only; published 21 Dec 2025 | ecgi.global/publications/working-papers/proxies-for-politics
- field_context.json | dfking | scope, date | "Other trackers report a smaller drop"; 2026-08 | no source; date not printed | equiniti.com/media/kednjhdl/the-debriefing-2026.pdf
- causality.json | sec-aug14-statement | summary | "must still submit … through the online … Form" | "should submit those notices using the online Shareholder Proposal Form" | sec.gov/newsroom/speeches-statements/corpfin-statement-rule-14a-8-process-081426
- proposals.json | amzn-2026-responsible-ai-sales | status_reason | "SEC staff said they would not object" | "Based solely on that representation, we will not object" | sec.gov/files/corpfin/no-action/14a-8/americanbaptisthomeamazon13026.pdf
- sim.js | exclusion label | "excludes a filing (3 of 19)" | 19 = company-ask units; 2026 has 20 filings that reached an outcome | data/sim_params.json "unit"

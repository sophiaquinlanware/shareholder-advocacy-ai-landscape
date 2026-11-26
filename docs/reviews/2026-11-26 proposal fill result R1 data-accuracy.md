REVIEWER: Data accuracy SCORE: 76 VERDICT: REVISE

Scope: `git diff main -- data/proposals.json data/network.json` on design/planner. Sources fetched from SEC EDGAR, the SEC no-action PDF (the Cooley pages read as images), Parnassus, ICCR, Green Century and the Harvard Law School Forum. 70+ values checked; nearly all match.

Verified: all nine Amazon proponents against the four DEFA14A decks (filed May 2-4 of each year); all 18 vote counts in six 8-Ks; support For/(For+Against): 8.365 to 8.36, 14.24, 7.16, 13.43, 3.42, 1.226 to 1.23; meeting dates (Alphabet June 2, 2023; Meta May 31, 2023; NVIDIA June 24, 2026; Apple February 24, 2026); proponents for Alphabet 2023 and 2024, three Meta records, NVIDIA item 7 and the TTT proposal; the NVIDIA status reason (Rule 14a-8(i)(7), Hewlett-Packard military-sales precedent, the November 17, 2025 Staff Statement, the March 10, 2026 reply); the NVIDIA, Disney and Alphabet floor summaries; the Verisk status reason (Parnassus pp. 14 and 21); three exempt-solicitation fixes; all 21 proposal_links (each source names the organization in that role, with the United for Respect caveat below).

TOP FAILURES
1. `vrsk-2024-responsible-ai`: `meeting_date` 2024-05-15 shows as fact in the Meeting column (app.js:257). Parnassus names no meeting ("a 2023 shareholder proposal", p. 21). The inference is only in `notes`, which the site never renders; `support_note` is null. This breaks Never claim 5 (no dates beyond the filing).
2. `cmcsa-2024-afl-ai`: the plain summary and its note add board oversight. FTI says the AFL-CIO's five proposals requested "reports on AI usage and ethical guidelines". Board role appears only in Disney's own resolution.
3. `dis-2024-afl-ai` and `cmcsa-2024-afl-ai` status_reason: FTI attributes the withdrawals to Responsible Investor ("According to Responsible Investor, AFL-CIO agreed to withdraw..."). The records credit FTI alone.

TOP IMPROVEMENTS
1. `amzn-2026-floor`: the memo says the proposal "was submitted by United for Respect Education Fund Co-Executive Director Bianca Agustin". She may be the shareholder of record. Word the proponent closer to the source and reconsider the "lead filer" link.
2. `nvda-2026-military-ai` and `vrsk-2024-responsible-ai`: `proxy_url` renders as a "proxy" link (app.js:258), but the first is an SEC letter and the second is a proxy that does not contain the proposal.
3. Verisk `topic_original` "AI governance and safety" is the only record with that value; the others use "AI governance & oversight".

OUT-OF-FIELD NOTES
1. Retyping Inspire Investing and Bowyer Research as "anti-ESG proponent" is an editorial label their cited sites do not use; planner.js:150 treats it as opposition.
2. `amzn-2026-climate-cost` meeting_date_source (unchanged) is an EDGAR directory under another CIK; the new 8-K results_url is the better source.
3. No em dashes or banned words in added lines.

CONTENT RULES: FAIL (rule 6 / Never claim 5: Verisk meeting date presented as fact; rule 6: Comcast board-oversight element unsourced)

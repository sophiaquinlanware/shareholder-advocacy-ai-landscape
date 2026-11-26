REVIEWER: Data accuracy SCORE: 62 VERDICT: REVISE

TOP FAILURES (max 3, each with evidence)
1. **Design is wrong: "AI" is thrown out of every title before matching.** `words()` (scripts/npx_votes.py:104-106) maps "Al" to "ai", but the `len(w) > 2` filter on the next line then drops "ai". I measured the effect: "Report on Use of AI" reduces to {"use"}, so any vote description at Apple's 2024-02-28 meeting containing "use" scores 1.0 and becomes aapl-2024-7. "AI Board Oversight" reduces to {board, oversight} and "Report on Data Privacy" to {data, privacy}. 22 tracked titles reduce to 3 or fewer key words. The score is also one-sided (title words found in the description, line 109-112), and it never uses item number or `proposedBy` (read at line 129, then ignored). A non-AI item at the same meeting can therefore be matched to the AI proposal.
2. **Build doesn't follow the design: the reviewed artifact is not what the current script produces.** fund_votes_review.json has a `management_rec` field the script never writes, plus 13 records below the 0.75 threshold. Some are clear false matches: "report on reproductive healthcare misinformation risks" was matched to googl-2024-12 (FOR, 0.5), and "additional board committee to oversee public policy" to amzn-2024-16 (AGAINST, 0.67). The plan (task 1) says to build `data/fund_votes.json` "from the reviewed run artifact". That would ship these false matches unless the data is rebuilt with commit 60e6a94. parnassus_clean.json (39 rows) looks hand-filtered, so it isn't reproducible from the script either.
3. **Design is wrong: a blank cell implies a fact the data doesn't support.** The plan's intro copy says a blank is "often because the fund did not hold the stock". In fact, 6 voted proposals have no `meeting_date` (for example amzn-2026-climate-cost and meta-2025-child-safety), and line 168 skips them, so they are always blank. Other causes of a blank are a sub-threshold score, a meeting date that doesn't match exactly (line 202), only `xmls[0]` being read (line 198), and only one trust being searched per family (`[:1]`, line 89). For example, the "BlackRock (iShares)" column is iShares Trust only, and "Vanguard" is Vanguard Index Funds only. That breaks Never claim 4/5.

TOP IMPROVEMENTS (max 3)
1. Keep "ai"/"genai" as key words. Require the vote to be shareholder-proposed, and match on item number or a two-sided similarity with a margin over the runner-up. Show ties and near-misses in a review list.
2. Rebuild `fund_votes.json` from the current script, then diff it against parnassus_clean.json. Spot-check every SPLIT and every match below 1.0 against the filing.
3. Say "no matching vote found in the filings checked" for a blank. List the trusts searched for each family. Mark proposals that have no meeting date as "not checked".

OUT-OF-FIELD NOTES (max 3, one line each)
- SPLIT (lines 227-233) counts distinct `howVoted` values per family. An N-PX/A that duplicates the original filing, or a WITHHOLD/NONE value, would show as SPLIT or as an unlabelled value.
- `fund_records` counts record-vote pairs, not funds (`series_count` is null for Parnassus), so "number of fund records" needs careful wording.
- FAMILIES names "Parnassus Income Funds", but the filings used came from "PARNASSUS FUNDS II". The trust names need checking against the SEC listings.

CONTENT RULES: FAIL (Never claim 4/5: the plan's blank-cell wording implies a reason that isn't sourced; the plan builds from an artifact that contains false matches, docs/plans/2026-11-25-fund-votes.md tasks row 1)

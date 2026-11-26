REVIEWER: Data accuracy SCORE: 62 VERDICT: REVISE

TOP FAILURES
1. **The resubmission example contradicts the plan's own thresholds, and the rule is only partly modelled.** Feature 3 says "Last vote: 14% (2026). Needs 15% … (third vote …)". With `[5, 15, 25]`, a third vote needs 25%. 15% is the second-vote threshold. Rule 14a-8(i)(12) as amended in 2020 also has a condition the plan leaves out: it applies only if the most recent vote was within the preceding 3 calendar years. And the 5-year count runs back from the *next* meeting, not the last vote. The rule measures support as For/(For+Against). proposals.json `support_note` says the 8-K gives "raw counts only" for 13 rows, and 27 rows use dual-class votes cast. So the plan should require `support_pct` on the rule's basis, or show "basis unclear". Rule 14a-8 is also under a proposed rescission (PRODUCT.md Never claim 8), so the copy should say thresholds may change.
2. **The gap finder finds no gaps on the live data, and its example is false.** By primary `tier`, only MSFT, GOOGL and AMZN share a tier ("compute"). META (labs), NVDA (chips), AAPL (deployers) and TSLA (capital) are each alone in their tier. All three compute companies have proposals in all 3 topics, so live gaps = 0. The plan's sentence "None on file at Amazon" is wrong: AMZN has 3 "Data center impacts" proposals. "9 proposals at Microsoft and Alphabet" matches proposals.json (5+4), but graph.json gives 3+4=7. The two files classify topics differently: 38/16/11 vs 43/14/8. Also, the "original 7" `derived_note` exists only on origin/data/value-chain, and it doesn't mention the 7.
3. **The data contract has no join key.** It asks for fields "on proposal nodes in graph.json (and the matching record in proposals.json)", but only 13 of 65 proposal IDs match between the two files. Graph nodes have no `meeting_date` (0 of 65), so "the UI reads either" fails for graph-driven code.

TOP IMPROVEMENTS
1. **Warm path.** All 167 `co-filed with` edges are `derived: true` with `source_url: null`. Each hop should link the source of each proposal in the edge's `proposals` list, not a missing source link. "Member of" through 3 coalition nodes (44 members) makes 2-hop "paths" between any members. Label those "shared coalition membership" or leave them out. Add `filed (named in proxy)` (3 edges) to the filing edges, or those proposals can't be reached.
2. **Filing deadline.** A Rule 14a-8(e) deadline has no opening date. Word it "Proposal deadline: N days left" rather than "window open", and read only the proxy's own sentence, as the plan already proposes.
3. **A real case to source.** msft-2026-6 (meeting 2026-12-08) follows 33.58% (2023), 32.03% (2024) and 27.48% (2025). That is a third+ vote at 27.48%, within 3 points of 25%. Ask the data session to fill its `vote_history`, so the flag is tested on real, sourced data.

OUT-OF-FIELD NOTES
- The MSFT 2023 hotspots vote is 33.57% in graph.json and 33.58% in proposals.json; queue a check.
- In the countdown arc and the "43 days left" text, "today" needs a stated time zone.
- The holdings fade affects all lenses, so check that the 15% opacity text still passes contrast.

CONTENT RULES: FAIL. The planned UI example "None on file at Amazon" states a fact the data contradicts (AGENTS.md rules 6 and 7; Never claim 4 and 5). The "Needs 15% (third vote)" line states a threshold the site's own rule set doesn't support. The rest passes: no vote direction, `board_rec` kept out of actions, and "this site's reading" wording.

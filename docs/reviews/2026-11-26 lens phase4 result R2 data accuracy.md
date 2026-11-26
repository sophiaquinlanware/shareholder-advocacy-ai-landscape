REVIEWER: Data accuracy SCORE: 82 VERDICT: REVISE

I recomputed all 12 asks at 8b85826 with no cap, then again with upto=2024. These are confirmed:
- Recurrence counts, by status and with floor handling.
- Year ranges and averages, shown to one decimal: 28.4, 24.5, 11.6, 8.8, 10.5 and 12.0.
- Left-out counts: child safety 3, climate 1, oversight 1.
- The dual-class count: AXON is now excluded, and customer due diligence reads 3.
- Coverage lines, with the policy_status as stored and the none entries showing "source pending".
- The lane filter. The Amazon vote event is gone, and all 12 asks now read "No Causality map events…". That is accurate given the match terms, so ev-msft-community-first goes to the data session's queue.
- The capped counts. Asks with no proposals at 2024 are hidden (dc-water, climate, bias, workforce).

TOP FAILURES
1. **Every "abstentions counted" mark is false.** `isAbstainBasis` tests for /abstain|abstention/, but most notes just list the abstain count. In every flagged case `support_pct` is For/(For+Against):
   - DLR: 69.76/(69.76+240.75) = 22.47
   - NFLX: 43.29; IBM: 2.45; SO: 9.74; AXON: 13.67
   - NVDA: the note's abstain-basis figure is 17.44, but `support_pct` is 17.57.

   So "count abstentions with votes against, as the company's bylaw does" is printed for dc-water (2), climate (2), bias, customer due diligence and oversight, and is true for none of them. Drop the mark, or require "counted as against" and check it against the figure used.
2. **The computed count is too low.** `isComputed` misses notes that say the 8-K has no percentage in other words:
   - dlr-2025-5 and dlr-2026-4: "counts only" / "no company percentage"
   - nflx-2024-4: counts with no percentage
   - nvda-2026-product-ghg: "gives no percentage"

   dc-water prints "1 of 3" (true: 3 of 3), climate "6 of 8" (true: 7 of 8), and oversight "6 of 7" (true: 7 of 7). Add /counts only|no (company )?percentage|gives no percentage|item 5\.07/ to the test. The Microsoft figures can count as stated, since they match within 0.01. IBM states 2.4% but the site shows 2.45, so treat that one as computed.
3. **`ctx.upto` is never reset.** Only `scrubTo` and the URL load set `state.ctx.upto`. `setLens` (graph.js:1214) and the year select (graph.js:1369) reset only `state.upto`. After scrubbing to 2024 and then switching lens or picking a year, the ask panel still shows capped counts and "(up to 2024…)" while the graph shows every year. Set `state.ctx.upto = null` in both places.

TOP IMPROVEMENTS
1. Fix the grammar in "1 of 3 figures were": use "1 of 3 figures was".
2. Add a test that compares the computed and dual-class counts per ask against a data-derived expectation, so regex drift fails the check.
3. The "partial without graph_id" branch has no data case, so add a fixture test.

OUT-OF-FIELD NOTES
- ev-msft-community-first is missed by the match terms ("datacenter", "electricity"). That is for the data session's queue.
- ev-parnassus-intuit-engagement's date, 2023-01-01, is still a likely placeholder.
- An ask hidden by the cap could still be the selected node. Check that the panel clears.

CONTENT RULES: FAIL
- **Never claim 5:** a false vote-basis claim ("abstentions… as the company's bylaw does") and computed counts below the true ones.
- **Never claim 4, 8 and 9:** pass. Company actions are now lane-limited, coverage is worded "in this map" with status as stored, and the review note is shown.

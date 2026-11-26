REVIEWER: Data accuracy SCORE: 80 VERDICT: REVISE

I recomputed all 12 asks in node from graph.json, asks.json and coverage.json. The recurrence counts by status, floor handling, ranges, averages, "left out" counts and coverage roll-ups all match the data. Two of the panel outputs are wrong.

TOP FAILURES
1. **Dual-class count includes a single-class company.** `isDualClass` tests `/dual|class/`. axon-2023-6's note says "Single class of common stock", so it matches. ask-customer-due-diligence prints "4 of these figures are dual-class"; the true count is 3 (googl-2025-cahra-hrdd, pltr-2026-4, pltr-2026-5). Test for `/dual|multi-class|class b/i` instead, or check for "single class" first.
2. **The only "company action" is not a company action.** The one match across all asks is ev-amazon-datacenter-vote-2026, shown on ask-dc-climate-energy. It is a press report of a vote result, lane `investors`, kind `campaign`, actor "As You Sow and co-filers". Two causes:
   - The code never applies Revision 2's lane rule (companies or labs lanes only), so a co-AMZN "acted in" edge is enough.
   - The `{kind}` printed is the node type ("response"), because graph.js turns `type` into `kind` and the causality kind is overwritten. There is no `kind_label`.

   Meanwhile ev-msft-community-first, a real Microsoft disclosure, is missed. Microsoft received dc-climate-energy and dc-siting-rights, and the event's description says "datacenter" and "electricity". None of the terms "data center siting", "siting", "energy" or "data center costs" appears in it.
3. **The basis sentence is wrong for some asks.** "most come from 8-K vote counts, not stated percentages" is printed on every ask. For ask-ai-fossil-fuels (2 of 2) and ask-dc-siting-rights (3 of 4), the figures are Microsoft's stated percentages, so the claim is false there. Build it per ask from the support_note wording.

TOP IMPROVEMENTS
1. The coverage lines are correct:
   - Every policy label resolves, and policy_status is printed as stored.
   - The two `none` entries read "Checked, no requirement found" with "source pending".
   - "(not yet in force)" fires only for ask-ai-workforce, which is correct.
   - However, a `partial` entry with no `graph_id` would fall into the "no requirement" branch. Handle that case on its own.
2. Each support figure in a year line should link to its results filing, or the panel should point to the List view rows.
3. Format averages to one decimal: one line reads "average 12%" while the next reads "17.5%".

OUT-OF-FIELD NOTES
- Ask nodes are never capped by the scrubber and stay sized by their full count. At upto=2023, ask-dc-water shows at full size with no proposals.
- An `upto=` value outside the data's range is ignored instead of clamped, which Revision 2 asked for.
- ev-parnassus-intuit-engagement is dated 2023-01-01, which looks like a placeholder, and the scrubber shows it from 2023.

CONTENT RULES: FAIL
- **Never claim 5:** the dual-class count is overstated, and the stated vote basis is wrong for two asks.
- **Never claim 4:** an investor vote report is presented as a company action, under the wrong kind.
- **These pass:**
  - Never claim 8: "not yet confirmed by a person" appears once per section, and partial-coverage statuses are shown as stored.
  - Never claim 9: the "in this map" wording is used.
  - Floor proposals are kept out of support.
  - Left-out counts are stated: 3 for child-safety, 1 for climate-energy, 1 for oversight-reporting.
  - Verified per-year averages:
    - customer-due-diligence 2023: 28.4
    - oversight-reporting 2024: 24.5
    - training-data 2025: 11.6 and 2026: 8.8
    - climate-energy 2025: 10.5 and 2026: 12.0

REVIEWER: Data accuracy SCORE: 58 VERDICT: REVISE

TOP FAILURES
1. **Two heatmap columns are capped lists, not counts.** In `scripts/build_value_chain.py` (lines 168-174), `asks_made` is cut with `[:12]` and `active_filers` also keeps only the top 12. All 6 tiers therefore show exactly 12 in both columns, so those columns would display a flat row of 12s that reads as data. The real ask count is `ai_proposals` (35, 16, 46, 33, 49, 70). Two more columns count something other than what their names say. `investor_engagements` and `safety_commitments` list companies whose `basis_type` (their "why included" entry) has that value; they are not counts of engagements or commitments. They should be labelled "companies included for investor engagement" and "companies included for a safety commitment".
2. **The per-tier numbers double-count across tiers, and the plan doesn't say so.** Every `per_tier` value has `scope` "all companies in this tier, primary or secondary". 14 companies sit in more than one tier; Alphabet is in 5. The `ai_proposals` values add up to 249, but there are only 76 proposals. `fund_vote_rows` overlaps the same way. The plan's caption cites only `derived_note`, which doesn't mention the overlap. It needs to quote `scope` and say that columns must not be summed. The plan also doesn't say which of the two company counts the nodes and headers use, primary or all (for example 9 vs 11 for chips, 2 vs 6 for capital).
3. **The flow layout and the "capital feeds labs" premise don't match the ties.**
   - None of the 44 ties is an investment tie; the types are chips, manufacturing, leasing, compute, power and distribution. The `capital` tier's reach to 13 labs comes from equity stakes in `pathways.json`, which the map doesn't draw.
   - Only 2 companies have capital as their primary tier (Tesla, SoftBank), and both appear only as customers.
   - 14 of the 44 ties run within one tier or backward against the column order: chips→chips 6, compute→compute 2, deployers→labs 5, deployers→compute 1.
   - "Distributes models" points from the deployer to the lab (Apple→OpenAI), so "curves from supplier to customer" is wrong for those 8 ties.
   - 32 of the 60 companies have no ties, so a node sized by tie count has zero size.

   The plan should cover all of this: name each tie's direction, route same-tier and backward ties, and either draw the `pathways.json` equity ties or say the map leaves them out.

All 28 tie endpoints match a company that has a primary tier.

TOP IMPROVEMENTS
1. Show `median_support_pct` with how many proposals it is based on (for example "30 of 35 with a recorded support figure"). Label it "computed by this site", not "the data session's median".
2. Show `ties_note` wherever `ties_from_tier` or `ties_into_tier` appear.
3. For the labs tier, the "labs reached directly" list (20) includes the labs themselves. Label it as such or drop those entries.

OUT-OF-FIELD NOTES
- `derived_note` says ties come from `pathways.json` too, but the 44 ties come only from `value_chain_ties.json`.
- One of the 44 ties has `source_kind` "secondary"; the ties table should show this.
- The panel text lists `ai_proposals` and the capped `asks_made` side by side; this needs wording such as "12 most recent of 35".

CONTENT RULES: FAIL.
- Never claim 5 (no invented numbers): the median isn't covered by the only allowed exception (per-year averages) unless it is labelled "computed by this site" with its base. Sums or comparisons across tiers would overstate counts.
- Never claim 9 (no completeness beyond the scope): a capped list shown as a count is a scope problem.
- Never claim 1, 2 and 4: the wording guard is good. Plain labels, sourced ties and "this site's reading" pass.

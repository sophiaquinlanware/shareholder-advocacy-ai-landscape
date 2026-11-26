REVIEWER: Data accuracy SCORE: 66 VERDICT: REVISE

TOP FAILURES
1. **"Company commitments" picks up events that are not commitments, and ignores the ask.** The plan's rule (companies/labs lane + "acted in" from a company that got the ask) matches these, from a script over graph.json and causality.json:
   - The only "commitment" for ask-child-safety and ask-targeted-ads-rights is ev-meta-declines-eu-code, "Meta refuses to sign EU AI code". A refusal shown as a commitment is a false claim.
   - ev-reincorporation-trend (a Tesla move to Nevada, a milestone) and ev-openai-newsom-letter (lobbying) also count.
   - The link is by company only. Microsoft's five events, from the EU code to the FY25 water report, show on every Microsoft ask (ai-bias, fossil-fuels, dc-siting and others). Meanwhile ask-dc-water gets none, because only DLR and GOOGL received it.
   - ev-google-eu-code hangs off lab-gdm, not co-GOOGL, so Alphabet's commitment is missed.
   - Fix: limit it to disclosure events plus responses that sign or commit (an explicit list or field). Require a topic or ask match, or relabel the line "Causality-map events for these companies".
2. **Floor exclusion and coverage wording don't match the data.**
   - lenses.js:401 detects floor proposals by `id`/`source_url` and misses amzn-2026-worker-ai-council. Its label and support_note say floor; it is the only ask-ai-workforce proposal, so the "excluding floor" recurrence becomes 0, with no years. The plan doesn't handle a zero-recurrence ask (node size, text). Detection needs the label/support_note, like votes.js:117.
   - coverage.json `about` defines the values as **full**/partial/none. The plan tests for "covered", so "Covered by a rule" could never fire. Map full→covered.
   - "No rule reaches this" overstates the data: `none` means "no listed policy requires it" (Never claim 9). Say "No rule in this map reaches this".
3. **The average mixes vote bases (Never claim 5).**
   - 38 of the ask proposals with results_url have support_notes saying the 8-K gives no percentage: either raw counts only, or dual-class counts at Alphabet and Meta (Class B = 10 votes).
   - "Says when a support_note exists" would flag almost every figure, so the warning becomes noise. Say "computed by this site from 8-K counts" once, and mark or separate the dual-class figures in each year line.
   - Six voted proposals with support_pct but no results_url drop out silently (3 of 5 for child-safety). State "N votes without a linked results filing left out".
   - The plan's examples are not real data: "18 proposals at 6 companies" (the largest ask is 13 at 7) and "2024: 4 votes, 9.71%–32.03%" (those two figures come from two different asks). Don't copy them into tests.

TOP IMPROVEMENTS
1. In recurrence, separate voted from withdrawn, excluded and upcoming (customer-due-diligence: 9 voted, 2 upcoming, 2 excluded).
2. When every partial entry is not yet in force, qualify the mark. ask-ai-workforce has only "enacted, not yet in force" and "duties delayed" entries. Print policy_status as stored: the plan's "proposed" and "delayed" values don't exist.
3. All 12 asks have coverage entries, so the "not yet assessed" test needs a fixture. Say so in the plan.

OUT-OF-FIELD NOTES
- proposals.json and graph.json use different proposal ids and different results_url counts (67 vs 64). The plan should name graph.json as the source.
- The scrubber caps "policy and response" nodes, but 3 ev- nodes have type "public" and wouldn't be capped. Use `date` on every ev- node.
- ev-parnassus-intuit-engagement is dated 2023-01-01, which looks like a placeholder. The scrubber will show it from 2023.

CONTENT RULES: FAIL
- Never claim 4/5: refusals and lobbying are presented as commitments.
- Never claim 9: "No rule reaches this" asserts more than the scope covers.
- Never claim 5: the average mixes bases, and the plan's example figures were made up.
- Never claim 8 is handled: the "not yet confirmed by a person" note and policy_status appear on every line.

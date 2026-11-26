REVIEWER: Data accuracy SCORE: 88 VERDICT: PASS

Round 2. I re-ran lenses.js and rules.js in node against the merged data: graph.json now has 335 nodes and 709 edges.

TOP FAILURES (max 3, each with evidence)
1. **A stale comment in lenses.js contradicts the fix.** In the Policymaker actions, the old line "Only figures stated in a vote-results filing; no average is computed." still sits directly above the new comment that says many figures are computed from vote counts. It doesn't change what's shown, but the code now states both claims.
2. **The low end of the range carries a caveat that's lost.** Social & economic impacts recomputes to 0.46%–37.5% across 33 proposals, which matches the screenshot. The 0.46% is Alphabet 2025 (googl-2025-10). Its `support_note` says the figure is "Not stated in the 8-K" and that, because of dual-class voting, "support from outside holders is higher". The generic "notes are in Proposals" line covers this only loosely.
3. **The screenshot doesn't match the current code.** desktop-light-policy-proposal.png reads "Same topic (Social & economic impacts): 43 proposals…". lenses.js now prints "Social & economic impacts: 43 proposals at 6 companies, 2023–2026" under the "Same topic" heading. The numbers agree; the wording is one revision behind.

Verified:
- **Confidence markers:** 457 verified, 85 reported, 167 inferred. Your count of 456 differs by 1 because graph.json has one more edge after the merge (709 vs 708).
- **Domain list:** all 16 added domains are present (36 in total), and none is unused.
- **co-MSFT:** "top 3 of 13 by proposals". There are 13 distinct filers, which matches the screenshot. The meeting note is quoted correctly and the proxy link is right.
- **Trillium:** 5 distinct exempt solicitations and 2 public profiles. NLPC: 6.
- **Floor filter:**
  - amzn-2026-worker-ai-council is excluded because its source_url contains "Floor".
  - googl-2025-15(floor) has no `results_url`, so it was never in the range.
  - No other floor proposals exist.
- The dropped filer action and its reason are recorded in the plan's Build notes.

TOP IMPROVEMENTS (max 3)
1. Delete the stale comment line.
2. Mark a figure whose `support_note` mentions dual-class voting, or name the Alphabet caveat in the support line.
3. Detect floor proposals from a data field, not from "floor" in the id or URL, once the data session nulls those values. Then re-take the policy screenshot.

OUT-OF-FIELD NOTES (max 3, one line each)
- msft-2026-hr-hotspots is "Social & economic impacts" in graph.json, but upcoming.json gives item 6 as "Data center impacts".
- graph.json has 49 support values with a `results_url`, proposals.json has 53, and some values differ (33.57 vs 33.58).
- amzn-2026-worker-ai-council still has support_pct 0.0 on this branch; the nulling is pending on the data branch.

CONTENT RULES: PASS
- **Never claim 1–2:** the actions state dates, filers and counts, and `board_rec` is never shown. The deadline appears only as a quoted "Proxy note".
- **Never claim 5:** no average is computed, the range ends are figures on file, and the text now says some are computed from 8-K counts.

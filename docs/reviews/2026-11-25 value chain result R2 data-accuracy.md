REVIEWER: Data accuracy SCORE: 83 VERDICT: PASS

All five R1 fixes check out. I copied the committed data and script to a scratch folder and ran the build twice. Both runs were byte-identical to the committed `data/value_chain.json` (`cmp` passed), with 44 ties. Two-step reach now runs supplier → customer → lab only (`scripts/build_value_chain.py` L83-85, L114-120), and every two-step lab lists its routes. Southern → OpenAI now counts as direct reach for data centers (L75-77). per_tier now covers every tier member, with `scope` and `companies_primary`: capital 6/2, data centers 6/2, labs 23/16. Both floor proposals have `support_pct: null` and a support note.

TOP FAILURES (max 3, each with evidence)
1. **Meta is counted as two labs (the build didn't follow the design).** The matcher at L110-111 cuts names at " (". That makes "meta" and "meta superintelligence labs" look like different labs, so the company "Meta" and the pathways lab "Meta Superintelligence Labs (incl. FAIR)" both appear in `labs_reached_directly`. This happens for chips, data centers and capital (output L545, L867, L1773), and each of those counts is one too high.
2. **Tiers show their own members as labs reached in two steps (the build didn't follow the design).** The comment at L109 says the labs tier "counts the labs they are", but the code never adds the tier's own companies to direct reach. Recomputed results:
   - The labs tier lists Cohere and Meta as reached in two steps, via Samsung → Nvidia, but both companies are in the labs tier.
   - The deployers tier lists Meta in two steps, but `meta-platforms` is a deployers member (its `tiers` field includes deployers).
3. **Some two-step routes are thin (the design may be wrong).** Samsung → Nvidia → Cohere/Reflection AI says that making memory for Nvidia is a route to Nvidia's investees. The direction now matches the plan, but a supply tie followed by an investment tie is weak. Consider limiting the second hop to operational tie types, or labelling routes by tie type.

TOP IMPROVEMENTS (max 3)
1. Match labs on a canonical id: map `msl`→`meta-platforms`, and link Google DeepMind, Amazon AGI and Microsoft AI to their parent companies.
2. Add each tier's own lab members to its direct reach, and drop two-step entries for labs that are tier members.
3. Fix two problems in the plan:
   - L33 repeats "each checked against the page it cites".
   - It says "counts by type are in the file", but `value_chain_ties.json` has only `about`, `checks` and `ties`. The counts are 21/8/6/4/4/1.

OUT-OF-FIELD NOTES (max 3, one line each)
- Four pathways ties (MU, SNOW, ASML) are still dropped without notice because those companies are not in companies.json.
- Six 2026 proposals (three MSFT, plus AMZN, AAPL and NVDA) have null support but no `support_note`. Only three of them (MSFT) have a `results_note`.
- `ties_from_tier` and `ties_into_tier` now count secondary members, so ties between two companies in the same tier count in both directions. A label would help.

CONTENT RULES: PASS. `derived_note` and the script docstring describe and don't recommend: "It is not a recommendation." The "reached" field names are acceptable now that routes are listed.

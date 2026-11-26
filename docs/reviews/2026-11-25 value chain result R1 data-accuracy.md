REVIEWER: Data accuracy SCORE: 72 VERDICT: REVISE

TOP FAILURES (max 3, each with evidence)
1. **Two-step reach overstates which labs a tier reaches (the build follows the plan here, so the design is at fault).** `scripts/build_value_chain.py` L76-77 treat every tie as running both ways, and L103 then credits a tier with any lab its neighbour is tied to. Two results from recomputing it:
   - SoftBank (capital tier) "reaches" Anthropic, Cohere, Mistral, SSI, Thinking Machines and Reflection only because Nvidia sells chips to SoftBank and Nvidia holds stakes in those labs.
   - Tesla "reaches" Anthropic, Mistral and Perplexity because Samsung makes chips for Tesla.
   Being a customer of a supplier is not a route to that supplier's investees. The plan's "labs reachable ... two-step" does not say which way a tie must run, so this is a design gap.
2. **A sourced direct tie to a lab is dropped (the build did not follow the design).** Direct reach comes only from `pathways.json` (L71, L99). Ties in `value_chain_ties.json` that point straight at a labs-tier company are ignored. So `per_tier.datacenters.labs_reached_directly` is `[]`, even though tie 31 is "Southern Company -> OpenAI | supplies power to". This undercounts rather than overstates, but it is inconsistent.
3. **per_tier counts only each company's primary tier, and nothing says so.** L96 filters on `tier == id`. Capital shows `companies: 2`, but its tier list has 6 (Microsoft, Alphabet, Amazon and Nvidia are left out). Data centers shows 2 against 6 listed, so Meta and Oracle and their data-center proposals are left out. The plan's Known gap blames the understated data-center and deployer counts only on proposal coverage, but this filter is a second cause. The "about" text explains primary tier, but per_tier never says it uses primary tier only.

TOP IMPROVEMENTS (max 3)
1. Count two-step reach only along a tie's own direction, or rename the field to something like "connected in two steps (any direction)". In either case, store the intermediate tie for each lab so the side panel can show the route.
2. Add `value_chain_ties` entries whose `to` is a labs-tier company to direct reach. Add a `scope: "primary tier only"` key to per_tier, or report primary and secondary counts separately.
3. Fix the plan's tie breakdown at L33. It says "10 model distribution" and its parts add to 46, but the file has 8 model-distribution ties out of 44. Also sort the outputs: rerunning the script reorders `active_filers` and `coalitions` (set and Counter tie order), even though all numbers match.

OUT-OF-FIELD NOTES (max 3, one line each)
- Tier assignment checks out: every `tiers[].companies` list matches the companies' `tiers` fields, all 60 companies have a primary tier, and each primary sits within its `tiers`.
- Sample of 8 ties (Nvidia-Meta, AMD-Meta, CoreWeave-Meta, Nebius-Meta, Southern-OpenAI, Google-Apple, Salesforce-Anthropic, Nvidia-SoftBank): all 8 descriptions match their sources. Southern-OpenAI correctly says "regulators' staff". All 44 ties have a source URL.
- Four pathways ties are dropped silently because MU, SNOW and ASML are not in companies.json (Micron and Snowflake to Anthropic, two ASML to Mistral ties).

CONTENT RULES: PASS. The "about" text and `derived_note` describe without recommending, and the derived note says "It is not a recommendation." The field names "labs_reached_*" are mild reach wording; with failure 1 they read as stronger than the data supports.

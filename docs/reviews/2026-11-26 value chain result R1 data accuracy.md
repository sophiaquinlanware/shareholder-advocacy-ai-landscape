REVIEWER: Data accuracy SCORE: 72 VERDICT: REVISE

TOP FAILURES
1. **The people list is labelled as capped, but it isn't.** `scripts/build_value_chain.py:176` never caps `people`, yet `valuechain.js` adds "(up to 20)" whenever there are 20 or more entries. Deployers shows 22 names under "(up to 20)". Chips, compute and capital each show their full list of exactly 20 under the same label, which suggests names were left out.
2. **The fund-vote counts have the wrong unit and no review mark.** `fund_vote_rows` counts `fund_votes.json` summary rows, one per fund family per proposal: 331 rows covering 1264 fund records. The heatmap calls them "Fund votes on file" and the panel says "Fund votes on these companies on file". 292 of the 331 rows are `reviewed:false`. votes.js:81 and lenses.js:319 mark rows like these "matched automatically, not yet reviewed", but the value chain tab doesn't (Never claim 4).
3. **The "Labs connected by sourced ties" lists mix in equity stakes.** "Reached directly" is built from `pathways.json` ties, equity stakes and parent-company ties included, not just from the 44 mapped ties. The same panel then says "Equity stakes are shown in Lab pathways". For example, chips lists Reflection AI, which is reached only through Nvidia's equity stake. Capital's 13 labs come mostly from equity stakes. Chips, compute, capital and deployers also count their members' own labs (Google DeepMind through Alphabet as parent company), but only the labs tier says "own labs included".

TOP IMPROVEMENTS
1. Give the median its base: chips 30 of 35 proposals have a recorded support figure, datacenters 16/16, compute 40/46, labs 32/33, capital 42/49, deployers 61/70. My recomputed medians all match.
2. Change "Showing 12 of 35 proposals" to "the 12 most recent of 35"; the build sorts `asks_made` by year, newest first.
3. The company panel's tie list drops the secondary-source mark. The Southern Company to OpenAI tie shows "reported (secondary source)" only in the table.

Verified correct:
- The heatmap uses only true totals; capped lists are never counted.
- Company and primary counts match the data.
- Ties out of and into each tier recompute exactly.
- `ties_note` is shown.
- Drawn-in-map counts are 8, 2, 8, 4, 2, 4, which sum to the 28 endpoints.
- Every endpoint has a primary tier and is placed in its column, with capital placed under labs.
- Tier tags are consistent (`tier` is always in `tiers`).
- Two-step routes are rendered from the data.
- The proposal years are 2023 to 2026, as the caption states.

OUT-OF-FIELD NOTES
- The worktree now has uncommitted edits to valuechain.js, styles.css and STATE.md. These replace `derived_note` (which wrongly said the ties come from `pathways.json`) and add tie phrases ("distributes the models of" reads correctly). I reviewed f2e3186 and only skimmed this diff.
- "The 12 most active" filers cuts at a tie: the 12th and 13th can have the same count, and the order is then by id.
- Coalition "members active here" counts members that filed; that is accurate, but it isn't explained.

CONTENT RULES: FAIL. Never claim 4: the fund-vote counts are mostly matched automatically and not yet reviewed, and they carry no mark. Never claim 9 (minor): the false "(up to 20)" label misstates scope. Rules 1, 2, 5 and 8 pass. The median is labelled "computed by this site", the overlap warning is present, and there is no advice or target language.

REVIEWER: UX / content SCORE: 68 VERDICT: REVISE

TOP FAILURES
1. The heatmap would show truncation caps as if they were counts. In `scripts/build_value_chain.py`, `asks_made` and `active_filers` are cut with `[:12]` (lines 169 and 174), so every one of the 6 tiers reads 12 in both columns, even though `ai_proposals` runs from 16 to 70. `coalitions` is the same 3 names in every tier, and `people` stops at 20 in four tiers. Shading "by count within its column" would give flat columns of the same shade, which wrongly suggests engagement is even across tiers. That breaks Never claim 5 (invented numbers) and defeats the "gaps read at a glance" goal. Drop these columns, or use the real untruncated totals from the data session and say a list is "top 12" wherever it is cut.
2. Rows are not additive, and the plan doesn't say so. Companies sit in several tiers: Alphabet and Amazon are in Chips, and `per_tier.scope` is "all companies in this tier, primary or secondary". So one proposal is counted in several rows. The flow map places nodes by primary tier only (Chips shows 9 nodes but its panel counts 11 companies). The heatmap caption needs to say this, and the tier panel should say which members are not drawn in that column.
3. "Effect you can have" is only partly answered. The panel gives asks and median support, but there is no per-tier outcome (adopted, withdrawn after agreement, commitments made) to show results. The ask is also scattered across five sub-headings. The owner's three parts (effect, players reached, stakeholders to engage) should be the panel's three headings in plain form: "Asks made here and their results", "Labs connected by sourced ties", "Investors, coalitions and people active here". "How shareholders can act" reads as advice (Never claim 2). Rename it "Shareholder routes", a plain count of each route.

TOP IMPROVEMENTS
1. Six dash patterns at one width on 44 crossing curves will be hard to tell apart. Show only the ties of the clicked tier or company and dim the rest, or show the tie type as text on hover or focus.
2. Say what the flow becomes at 390 px, for example a stacked list of tiers with ties, or the tie table only. Five columns plus a band won't fit.
3. Use the labels in the data (`label`: "Chip builders", "Hyperscalers and AI clouds"…) word for word. The plan says "chips" and "data centers and power", which differ in places.

OUT-OF-FIELD NOTES
- Accessibility: the flow chart needs a keyboard model (the network tab uses `role=application` with arrow keys), not just clicks.
- Data: the two-step routes are mostly "parent company" hops (AMD to Microsoft to Microsoft AI). Check the "{then}" wording reads naturally.
- Dead controls: "Open in Company lookup" must be hidden for companies Company lookup doesn't cover (private labs).

CONTENT RULES: FAIL. No "target" or "influence" wording, the derived note is quoted, sources are linked and zero cells are not buttons: all good. It fails on Never claim 5, because capped lists would be shown as counts, and on the advice-leaning heading "How shareholders can act" (Never claim 2).

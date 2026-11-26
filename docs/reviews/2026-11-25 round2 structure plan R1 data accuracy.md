REVIEWER: Data accuracy SCORE: 68 VERDICT: REVISE

All of this is about the design. Nothing has been built yet.

TOP FAILURES (max 3, each with evidence)
1. **The planned copy "Jan 2023 to Dec 2026" is not in the data** (plan line 67). The earliest `meeting_date` in proposals.json is 2023-05-24 and the latest is 2026-12-08. Nothing places a proposal in January 2023. The only data-backed range is the years 2023 to 2026 (10, 14, 21 and 20 proposals per year), or May 2023 to Dec 2026. This breaks Never claim 5 (no invented dates).
2. **The dot plot cannot place 6 of the 59 voted proposals, and the plan has no fallback for them** (plan line 37: "x = meeting date"). The 6 have no `meeting_date`, no `results_url` and no `support_note`. Their only source is "filer network research": googl-2023-audit-committee-review, googl-2024-child-online-safety, meta-2023-community-standards, meta-2025-child-safety, meta-2026-child-safety-pay and amzn-2026-climate-cost. Plotting them by year alone would invent a date. Showing their support % with no 8-K behind it puts unsourced numbers on the chart.
3. **The 50% line and the planned "Support = for ÷ (for + against)" line hide what the support notes say.**
   - tsla-2025-7 shows 53.61%. Its note says Tesla's bylaw basis gives 43.25%, so on the chart it reads as passing when it did not.
   - 27 GOOGL/META proposals carry a dual-class note saying support from outside holders is higher than the figure shown.
   - nvda-2026-7 notes 17.44% on the company's basis, against 17.57% stored.
   - The plan never says `support_note` will be shown.

TOP IMPROVEMENTS (max 3)
1. Work the range out from the data (the minimum and maximum `meeting_date`, or the years). Show dateless proposals in the table only, or in a "date not recorded" strip, never as dots. Flag a support % that has no `results_url` as "source pending".
2. Show `support_note` in the table and in each dot's tooltip or focus text. Mark dual-class companies and dots whose company basis differs from the plotted figure. Label the reference line "50% of for + against", not as a pass line.
3. Change the fallback from "Reason not documented" to "Reason not yet recorded", and keep the existing link. "Not documented" suggests no source exists anywhere. The 3 withdrawn or excluded records have no `status_reason` today. Their only links are news, a blog and a PRI collaboration page, which are not primary sources (proposals.json, amzn-2026-responsible-ai-sales, aapl-2026-ai-energy, nvda-2026-military-ai).

OUT-OF-FIELD NOTES (max 3, one line each)
- upcoming.json has no filer field (the filer is inside `title`) and no proxy link per item, only per meeting. The planned "filer" and "proxy link" columns need parsing or a change to the data.
- The topic name differs between files: "Social and economic impacts" in upcoming.json, "Social & economic impacts" in proposals.json. A shared colour or filter will split one topic in two.
- The rest of the audit table checks out: 65/59/3/2/1, 3 topics, 7 companies × 3 matrix columns, 13 labs / 24 companies / 74 ties / 7 tie types / strength 1–3, 294 nodes / 9 types / 708 edges, 64 events / 5 lanes / 42 links (2023-01-01 to 2026-11-25), 7 why_now, 4 levers, 4 voting paths, 8×17 scorecard, 52 people. I did not verify the "15 legend entries" or the scorecard's "3 states", so neither affects the score.

CONTENT RULES: FAIL. The planned copy "Jan 2023 to Dec 2026" (plan line 67) is an unsourced date (Never claim 5). The plan's unlabelled 50% line next to a Tesla figure that fails on Tesla's own basis risks a misleading claim of a majority.

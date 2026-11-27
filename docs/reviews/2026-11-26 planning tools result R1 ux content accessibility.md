REVIEWER: UX / content and accessibility (planning tools) SCORE: 74 VERDICT: REVISE

TOP FAILURES (max 3, each with evidence)
1. **The Ask designer mixes in support from filers critical of ESG, against the site's own rule.** At ?plan=meta-platforms~ask-ai-training-data, "Past proposals for comparison" lists the NLPC "Report on AI Data Usage Oversight" proposals (META, GOOGL, MSFT and AMZN, 2025 and 2026) with no critical-filer tag. Its summary then says "support from 6.0% to 36.2%". The card directly above says "8 filings came from filers critical of ESG and are left out", and gives a median of 6.3% across 2 votes. The same happens for Amazon: AMZN 2026 "Report on Impact of Climate Commitments" at 1.2% is `critical: true` in data/campaigns.json, yet it sets the low end of "1.2% to 20.1%". An analyst would read the wrong band.
2. **The N-PX counts and review status disagree with each other on the same page and in the footer.** In the Meta support range card, Parnassus is "FOR on 3 of 8" and Praxis "FOR on 9 of 9". The organizations table further down the same plan says "3 of 9" and "9 of 10 … matched automatically, 10 of 10 not yet reviewed". The footer says fund-family votes are "matched and reviewed". The footer also lists Shareholdings "last checked September 30, 2026", which is the 13F report period, not a check date.
3. **Focus problems, and the planner is overloaded.** After "Log it" succeeds, focus falls to `<body>` because the form re-renders, so keyboard and screen-reader users lose their place. At 390 px the planner is 19,330 px tall. The two new cards (Support range at y=3911, Ask designer at y=4769) push "Organizations…" down to y=5659, and that list is the planner's core outreach content. The spectrum steps look like chip buttons (screenshot askdesigner-390.png) but cannot be clicked. In the Game clock, "(in 1 days)" is a grammar error, and its deadlines have no [proxy] source links, while the planner shows them for the same dates.

TOP IMPROVEMENTS (max 3)
1. Tag critical-ESG filings in the Ask designer list and leave them out of its "support from X to Y" line, the way "How this ask has gone" does.
2. Put Support range and Ask designer in collapsed details, or after Organizations, so the planner keeps its order: record, rights, partners, escalation. Return focus to the status message after "Log it". Give "Turn on" or "Use the 2026 rate" a pressed or "On" state after it is applied.
3. Reword "3% to 9% middle 6%; 80% range" as "Scenario: 3% to 9% (80% of past errors), middle 6%". Rewrite the dual-class line "at least 7% to 22%", which reads as a floor that is also a range. Bring up the backtest finding ("range is a little too narrow", 72%) next to the figure.

OUT-OF-FIELD NOTES (max 3, one line each)
- The Ask designer keyword rules miss common mandate verbs ("halt", "require"): "halt new data center construction…" returns "No rule matched".
- An empty "Place this wording" still shows the list and "No rule matched" instead of asking for text.
- "floor proposals" (Policymaker seat) is jargon with no explanation.

CONTENT RULES: PASS. I found no em dashes, "genuinely" or "real" in the new visible text, and nothing reads as advice. Scenario figures carry "not a forecast … not advice". The seats say "Describes options; it does not say which to take". The SEC rescission is described as "proposed". Contrast and focus outlines are fine (2px #1f4e98; ticker text #6b6b6b on white). The textarea and the forecast inputs have labels. The seat buttons use aria-pressed in a labelled group, and the results go to aria-live regions. There is no sideways scroll at 390 px with the footer open.

Screenshots: /private/tmp/claude-503/-Users-Quinlan-Downloads-outreach-radar-extension-2/254ea18c-3896-4871-90a5-a793efccf32b/scratchpad/toolsux/ (range-*.png, askdesigner-*.png, seat-*.png, footer-open-*.png)

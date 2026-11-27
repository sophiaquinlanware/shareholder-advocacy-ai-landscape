REVIEWER: UX / content and accessibility (engagement ladder) SCORE: 74 VERDICT: REVISE

TOP FAILURES
1. **The ladder contradicts the ledger on the same profile.** On Nvidia, both campaigns read "stage: Concern raised" (aria-label "Milestone stage 1 of 4"). Yet "Steps reported by investors" says Nvidia added oversight and completed an assessment, and the Commitments ledger marks a Parnassus commitment "Delivered". In #outcomes, "Company engaged: 0" sits beside a ledger full of engagements. An analyst will read this as a data error. The note "Stage from a filing" does not explain that company-level engagement never moves the ladder.
2. **The same text appears three or more times, and the profile is too long.** The Disney and Verisk withdrawal paragraph appears word for word in the timeline, in "What companies conceded" (#outcomes) and in the ledger notes. Each delivery-evidence line repeats between the timeline and the ledger on the same profile. Verisk's "Steps reported by investors" repeats the withdrawal a third time. At 390 px the timeline slot is 3,338 px tall for Nvidia and 2,586 px for Amazon (Amazon's whole profile is 12,341 px). The Nvidia ledger alone is about 1,976 px. The first campaign opens by default even when it has 12+ steps (Microsoft).
3. **Wording that overstates or is wrong.**
   - The #simulate setting says 2026 was "the first season without SEC review" and that "SEC staff stopped reviewing exclusions on November 17, 2025". The planner says staff stopped answering "most" requests, and the Nvidia record says staff replied on "March 10, 2026 that it would not object".
   - The same setting says "a company that excludes risks a lawsuit instead", with no source.
   - The planner's court rulings are lowercased: "court orders bj's wholesale club…", "chubb", "as you sow's".
   - Two step labels read awkwardly: "Exempt solicitation against by Anti-Defamation League" and "Delivery evidence (delivered)".

TOP IMPROVEMENTS
1. Either let investor-reported, company-level steps and ledger entries count toward the ladder, or add one line to the ladder: "Counts proposal records only; engagement outside a proposal is in the ledger below."
2. On profiles:
   - Show each withdrawal or delivery paragraph once, in the timeline, and have the ledger point to it ("see timeline").
   - In #outcomes, give a one-line summary per company under "What companies conceded", using company names, not tickers (DIS, CMCSA), to match the ledger.
   - Collapse all campaigns by default once a company has more than two.
3. Make the planner's "see Company profiles › Commitments ledger" a link. Rename the Rule 14a-8(b) row, or say how it differs from the "Ownership threshold" row next to it: "None beyond being a shareholder of record" sits directly under the $2,000/3-year rule and reads as a contradiction.

OUT-OF-FIELD NOTES
- Ledger text cells use tabular figures, which adds visible gaps before full stops and commas ("FY26 .", "2025 ;") at 390 px.
- The #simulate exclusion setting is inside the closed "Assumptions" block, so it is hard to find. It is keyboard-reachable.
- The ladder's text equivalent comes only from the `<ol>`'s aria-label. The items do not say which steps are reached, though the summary line states the stage. It is adequate, but VoiceOver may skip a label on a list.

Checks that passed:
- No sideways scroll at 390 on #company (5 companies), #outcomes, #planner or #simulate.
- Heading order is h2 > h3 > h4 throughout.
- Table headers use scope="col" and turn into labelled cards at 390 px.
- A `<summary>` opens with Enter and shows a 2px blue outline.
- Contrast: white on #1f4e98 is 8.1 and grey text 5.3.

CONTENT RULES: FAIL
- The lowercased proper nouns in the planner's SEC review row, and the unsourced "risks a lawsuit" claim in the #simulate exclusion label.
- No em dashes. No "genuinely" or "real" in the new parts. "recommend" appears only inside quoted titles from the sources. Nothing reads as vote or investment advice.

Screenshots: /private/tmp/claude-503/-Users-Quinlan-Downloads-outreach-radar-extension-2/254ea18c-3896-4871-90a5-a793efccf32b/scratchpad/ladderux/

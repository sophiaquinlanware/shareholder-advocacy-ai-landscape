REVIEWER: UX / content and accessibility (engagement ladder) SCORE: 79 VERDICT: REVISE

TOP FAILURES
1. **New: the ladder note promises a ladder that is often missing.** Every proposal campaign ends with "engagement outside a proposal has its own ladder below." Only 5 of the 18 companies with campaigns have that ladder (GOOGL, INTU, MSFT, NVDA, WDAY, per `campaigns.json` `outside`). On Amazon (5 campaigns), Disney, Verisk and 12 other companies, nothing follows the note. The planner shows the same sentence (Nvidia, data-centre ask) with no ladder after it. The R1 issue that the ladder and ledger disagreed is fixed: Nvidia now shows "Milestone stage 4 of 4: Commitment delivered" under "Engagement outside proposals". But the fix now says something untrue on most profiles.
2. **Profile length is not fixed (R1 #2, partly fixed).**
   - At 390 px the Nvidia timeline slot is now 3,529 px, up from 3,338. Its ledger is still 1,976 px.
   - Campaigns now start collapsed when a company has more than two. Amazon and Microsoft open 0 of 5 and 0 of 7, which is fixed.
   - Delivery now appears once: one "Commitment delivered … Evidence in the commitments ledger below" step on DIS, VRSK and CMCSA. Fixed.
   - Verisk still repeats itself: the withdrawal note and the ledger note both say "Parnassus calls it a 2023 proposal" and give the December 9, 2023 deadline.
3. **The planner link lands at the wrong place.** "see the commitments ledger on the company profile" opens the Nvidia profile (fixed: it is now a link). It lands at scrollY 0, though, and the ledger heading is 1,989 px further down.

TOP IMPROVEMENTS
1. Show "has its own ladder below" only when `outside[co]` exists. In the planner, or when there is no outside ladder, use "Counts this ask's proposal records only."
2. Make the planner link scroll to and focus the "Commitments ledger" heading.
3. Cut the Verisk ledger note to the part that is new: the "marginalized groups" wording gap.

OUT-OF-FIELD NOTES
- In #outcomes, "Company engaged: 0" now has a note explaining the outside-proposal counts. Fixed, but the note lowercases the stage names ("company engaged 3").
- The simulator's exclusion setting is still inside a closed `<details>`. Its "see Laws and rules" is plain text, not a link.
- Fixed:
  - Ledger cells now compute `font-variant-numeric: normal`.
  - "What companies conceded" uses company names, one line each.
  - The Amazon 2026 step reads "Exempt solicitation urging votes against four directors over the exclusion".
  - "Exempt solicitation against the proposal … by JLens, Anti-Defamation League" now reads correctly.

CONTENT RULES: FAIL
- What fails: the false "own ladder below" sentence on 15 company profiles and in the planner campaign.
- What is fixed:
  - The planner rows are renamed: "SEC minimum holding to file a Rule 14a-8 proposal" and "Holding needed under the company's own bylaws (outside Rule 14a-8)".
  - Court-ruling titles keep their capitals ("Court orders BJ's Wholesale Club…", "Chubb", "As You Sow's").
  - The simulator now reads "the first season in which SEC staff did not review most exclusions". There is no "lawsuit" anywhere on the page, and the court reference points to Laws and rules.
- No sideways scroll at 390 px on #company, #outcomes, #planner or #simulate. No em dashes and no advice wording found.

Scripts and screenshots: /private/tmp/claude-503/-Users-Quinlan-Downloads-outreach-radar-extension-2/254ea18c-3896-4871-90a5-a793efccf32b/scratchpad/ladderux2/

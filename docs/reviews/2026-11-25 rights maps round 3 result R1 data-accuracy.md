REVIEWER: Data accuracy SCORE: 84 VERDICT: PASS

TOP FAILURES (max 3, each with evidence)
1. Build: the CoreWeave figures disagree with each other. The control text and route_status_reason say directors and officers hold 72.32% (a1f5649:data/companies.json lines 3308 and 3350). The Voting control note says "Founders together hold about 74% of votes" (line 3345). 74% is the three named holders added up (38.70 + 20.30 + 14.59 = 73.59), and that sum is not stated in the filing. The rating stays "closed" either way.
2. Design: the rule "unusually short window" is never defined, and it is applied unevenly. Tesla's reason cites "The notice window is short" and its bylaw text says the 45 to 75 day window is "shorter and earlier than most" (lines 585 and 591). Salesforce (line 1561) and Netflix (line 2593) have the same 45 to 75 day window and are rated "open". Tesla's "narrowing" still stands on the Texas opt-in, so the problem is the wording, not the rating. The rule needs a threshold, or that clause should come out.
3. Build/sourcing: two "closed" ratings rest on figures the data doesn't show directly.
   - SpaceX: the notes say "Musk holds most votes" (lines 863, 869, 874), but the only percentage in the control text is 48.4% of Class A as converted, which a reader could take to mean below half. From the cited share counts I get roughly 87% of votes, so "closed" is right. The data should state the vote share or say how it was worked out.
   - Workday: "99% of Class B" comes from a shareholder proponent's supporting statement in the DEF 14A ("as of April 2025 … approximately 70%"), not from the company's own disclosure. The company's own text says about 69% as of April 17, 2026, which I confirmed.

Spot-checks (all on sec.gov, read in the browser pane):
- SpaceX: confirmed. Section 9.5 elects Texas Section 21.373, the 67% solicitation statement and the 90 to 120 day window are in the bylaws, and the 2026 meeting is deemed held June 19, 2026.
- Anthropic: confirmed. The charter formula (0.501A)÷(0.499B) works out to exactly 50.1% for the Class F share.
- Workday: 69% and the classified board confirmed in the DEF 14A.
- Comcast: confirmed. "The director candidates who receive the most votes will be elected", withheld votes have no effect, Roberts has 33 1/3%, and 0.07949 and 15 votes per share match.
- AMD: confirmed. The bylaws header reads "AS AMENDED NOVEMBER 18, 2026"; the proposer-attendance rule and the "proper matter … as determined by the Board" wording are both there.
- Southern: confirmed. Bylaws "Adopted and Effective on October 20, 2026", 90 to 120 day window, and majority of votes cast.

Matrix rules: every one of the 29 is consistent with the written and refined rules, including Alphabet's "Votes against directors" now "closed" at 52.7%. route_status follows "all open → open, any non-open → narrowing" for all 29, and every reason matches its matrix.

TOP IMPROVEMENTS (max 3)
1. Change CoreWeave's note to 72.32% (directors and officers), or say that 73.6% is the sum of the three named holders.
2. Define "unusually short window", or drop "short" from Tesla's reason.
3. Decide whether board discretion over "proper matter" (AMD) counts as narrowing, and write that into the rules.

OUT-OF-FIELD NOTES (max 3, one line each)
- During my review the working tree switched from data/value-chain to main (HEAD is now 37e75db). I reviewed a1f5649 using git show; another session may be using the folder.
- Anthropic's control text doesn't mention Class E stock, which has its own class votes under the charter.
- The SEC blocks curl (403); the browser pane works.

CONTENT RULES: PASS (no vote recommendations, advice or endorsements in the fields I reviewed; the one sourcing caveat is the Workday 99% above)

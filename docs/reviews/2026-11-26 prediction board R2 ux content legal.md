REVIEWER: UX / content (securities-aware), Prediction board, round 2   SCORE: 84   VERDICT: PASS

I made no edits. I read board.js, styles.css:921-953 (the .bd- rules), forecast.yml, forecasts.yml, ingest_forecast.py, build_questions.py (crowd and scoring code) and data/forecast-questions.json (22 questions). I rebuilt dist/ and loaded http://localhost:8792/index.html#predict at about 400 px and at 390 px. All 22 cards render. At 390 px nothing scrolls sideways (scrollWidth 390 = clientWidth, no element runs past the edge). I tested the save flow: Save starts disabled, moving the slider to 5% shows the warning, the live region reads "Saved: 5%. No crowd forecasts yet.", focus lands on "Update my forecast", and the Post link carries 5. The worktree has no uncommitted changes, so the revision is already inside commit 4aa9d53. House style is clean: no em dashes, no "genuinely" or "real" in board.js, the form or the questions JSON.

R1 ITEM STATUS
1. Vote-day forecasts: FIXED. Vote questions now close the day before the meeting (MSFT closes 2026-12-07 for a December 8 meeting). The card says "(UTC)". Expired cards show "Forecasting closed; awaiting the result." with no slider (board.js:47, 73). ingest_forecast.py:57 uses the same rule.
2. "Who should forecast" invited private plans: MOSTLY FIXED. The investor and company lines now refer only to public knowledge (board.js:33, 35). Two lines still point at nonpublic knowledge; see new finding 1.
3. Conflict flag too narrow: FIXED for company questions (forecast.yml:46-47, board.js:119). Gaps remain for questions that span companies and for the SEC question; see new finding 2.
4. Public "Why" field: FIXED. The form and the confirmation box both say "Don't urge anyone to vote, file or act". The text is no longer copied into site data (ingest_forecast.py:4-5). Issues are locked after the bot closes them (forecasts.yml:63, 69).
5. Pre-vote crowd figure: DECIDED by the owner. Wording to add: see new finding 3.
6. Equal group weights let one person set the figure: FIXED. A group needs 3 forecasters (MIN_GROUP) before it counts on its own; smaller groups are pooled. The card shows "k groups weighted" (build_questions.py:258-268, board.js:53).
7. Slider defaulted to the site estimate: FIXED. Save stays disabled until the slider moves (board.js:80, 161). I verified this.
8. Warning text inverted: FIXED. It now shows only after the user moves the slider (board.js:78, 160). I verified this.
9. Withdrawal promise not built: FIXED. The sentence is removed; the page now says "post again: the latest counts" (board.js:141).
10. Resolution gaps: MOSTLY FIXED.
   - A vote not held within 60 days now voids the question.
   - Coverage-gap questions now have a fallback date.
   - A partial amendment to the SEC rule now resolves No.
   - The two unsourced claims are gone.
   - Still missing: the 4 season questions and the 2 conditional questions have no Source link (source_url is null), and "as listed in this site's Proposals and votes" is not a link.
11. Accessibility: MOSTLY FIXED. There is one persistent live region, aria-valuetext is set, the card title is in the slider's accessible name, the Post link says it opens a new tab, and the Save button is 28 px tall. One problem is new; see finding 4.
12. Stale Post link: FIXED. The link is hidden when the slider moves (board.js:162-163).
13. Leaderboard rewarded easy questions: FIXED. Ranking is now by skill against the site's estimate on the same questions (build_questions.py:282-286).
14. "If, then" gap never computed: FIXED. The page shows "Crowd gap now: X points" (board.js:94, 103).
15. Stale build: FIXED. After my rebuild the dates read "November 27, 2026".

NEW FINDINGS, by severity

MEDIUM
1. Two "Who" lines still point at nonpublic or vote-intention knowledge.
   - board.js:34: asset owners "see pass-through voting choices". Beneficiaries' voting choices are private, and they are votes, which is the one thing the board says it does not collect. Fix: "follow published pass-through voting programs and their policy options."
   - board.js:40: AI-company employees "understand how AI governance commitments are put into practice". That is insider experience. Fix: "follow companies' published AI governance commitments and reports."
   - Also, board.js:35 and :40 tell company people to "leave your own company's questions to others", while the rules box (board.js:119) tells them to declare a stake and post. Pick one rule. Suggested: declare and post, kept out of the crowd figure.
2. The stake test fails on questions without a single company.
   - The form asks about "the company it is about" (forecast.yml:47). Season and conditional questions cover every tracked company, and the SEC question has no company at all.
   - A filer who is negotiating a withdrawal right now can forecast q-2027-commitment as "No stake". That question closes 2027-01-31, during peak withdrawal season.
   - "Policymakers and regulators" (board.js:37) are invited, with no exclusion for SEC staff on the SEC vote question.
   - Fix: add to the form and to board.js:119: "For a question across companies, a stake means any company it covers. For the Rules questions, a stake means you work at or advise the SEC." In the "Who" list, add to the policymaker line: "Leave out anything not yet public."
3. Crowd figure on coming votes (owner's ruling stands; wording only). Under every crowd figure on a vote card, add one line: "A forecast of the result by self-selected visitors, not a poll of shareholders and not a sign of how anyone will vote." Separately, PRODUCT.md line 29 still says "Its questions are about outcomes, never support", while 4 questions ask whether a proposal will reach a support level. The R1 rewording ("never statements of the forecaster's support") is still the owner's to apply.

LOW
4. Warning read aloud when hidden. The slider's aria-describedby points at the warning (board.js:76), which starts hidden. Hidden text that is referenced this way is still read as the description, so screen readers announce "Below 10%..." on every slider. Fix: add the aria-describedby only when the warning is shown.
5. Warning lost after saving. Once a figure under 10% or over 90% is saved, the re-rendered card hides the warning again (board.js:78; verified after saving 5%). Fix: base the hidden state on `start`.
6. Coverage-gap intro overstates the protection. Board.js:25 says questions close "before filings become public". Filings are never public before the proxy statement, so closing early protects nothing; the public-information rule is what does. Fix: "Each question closes the day before the deadline." Then move the rule reference here.
7. "Move the slider to your own figure first" (board.js:81) leaves no way to post a figure equal to the site estimate except moving away and back. Fix: add "(to keep the site's figure, move it and back)", or add a "Use the site's figure" button that records that choice.
8. Source and Data links open new tabs without saying so (board.js:70, 72). Add the same visually hidden "(opens in a new tab)" text the Post link has.
9. "Crowd gap now: X points" has no direction. Fix: "If adopted minus if not: X points."

OUT OF FIELD (one line each)
- Data accuracy: q-msft-2026-4-bar, "Additional Disclosures Meeting Climate Commitments", is counted as an AI proposal. Confirm it is in the AI list.
- The bot comment on a declared stake says "left out of the crowd figure and the ranking", which matches build_questions.py:279. Fine.

SCORE 84/100: PASS. All four HIGH items from R1 are fixed. Medium items 1 and 2 are short wording changes worth making before launch, because they decide which knowledge the board invites.

---
Author's response (2026-11-26): applied medium 1 to 3 (both "Who" lines reworded, one rule: declare a stake and post; stake defined for questions across companies and for Rules questions; the line under every crowd figure; PRODUCT.md now reads "forecasters never state their own support") and lows 4 to 9 (aria-describedby only while the warning shows; the warning stays after saving; the gap intro reworded; how to keep the site's figure; new-tab text on Source and Data; gap direction stated). Season, conditional and gap cards link to All AI proposals. msft-2026-4 is on the site's AI list (data-centers category, ask-dc-climate-energy).

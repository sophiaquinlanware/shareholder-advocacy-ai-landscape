REVIEWER: UX / content SCORE: 68 VERDICT: REVISE

TOP FAILURES
1. **The resubmission flag gives wrong results on live data.** Plan section 3 runs the check on any proposal with "`vote_history` or `support_pct`", and the vote number is "1 + the number of `vote_history` entries". No live proposal has `vote_history` (plan, "What exists today"), so every voted proposal is treated as a first vote against the 5% threshold. META child safety 2026 at 3.42% follows a 13.43% vote in 2025 (plan's own example). It would show "Needs 5%", but under the plan's own reading it is a second vote needing 15%. The flag also fires on old votes (2023) and says "stay eligible" when support is already under the threshold. Fix: run the check only when `vote_history` is present. Limit it to the latest vote at each company and subject. Word the under-threshold case as "Below this site's reading of the threshold" rather than "at risk".
2. **The gap finder claims more than the data supports (Never claim 9 and 4).** "None on file at Amazon" and the ghost node "{topic}: none filed" read as facts about the world. They are facts about this dataset. Every ghost and every List view row needs the scope in the line itself, for example "none in this dataset (7 companies tracked)". The panel note alone is not enough. The plan cites value_chain.json `derived_note` for "the original 7", but I could not find that key (grep found only `derived: true` in graph.json), so the evidence is unverified. Also, "gap" next to a tier comparison can read as a prompt to file, which comes close to advice (Never claim 2).
3. **"Seeking: exempt solicitation" comes close to vote coordination (Never claim 1).** An exempt solicitation asks investors to vote a certain way. A public line saying "Needs an exempt solicitation · posted by X" helps organise vote campaigning. The plan's wording guard covers filing imperatives but not this seeking type. Either restrict this type, or get an owner decision recorded in the plan. The "verified | not verified" wording should use the site's existing "auto-detected, not yet reviewed" convention (Never claim 4; DESIGN.md line 107).

TOP IMPROVEMENTS
1. Add one plain line where each aura appears on live data. Tell the owner directly that the window, seeking and risk auras will show nothing until the data session fills the fields, so a reviewer doesn't read their absence as a bug.
2. Warm path: show the inferred-hop count in the summary line, e.g. "3 hops, 1 inferred". A chain built on inferred co-filing should not read as a known relationship (rule 6).
3. Holdings: match tickers case-insensitively and list near-misses. Say on the panel that data is "stored in this browser only", in the plan's one line.

OUT-OF-FIELD NOTES
- Accessibility: a 4s pulse inside `no-preference` is fine, but check that ghost nodes and dashed edges meet 3:1 non-text contrast.
- Data accuracy: the 5/15/25 thresholds, the 5-year look-back and the Rule 14a-8(i)(12) reading need a source link in the rules.js comment.
- Security / simplicity: the `page.route` fixture swap must not ship in the production bundle.

CONTENT RULES: FAIL. Rule 7 / Never claim 9: gap wording asserts absence beyond the scope (plan section 5). Rule 6 / Never claim 5: the resubmission threshold is computed from a vote number that is wrong on live data (plan section 3). Never claim 1: the exempt-solicitation seeking type is not covered by the wording guard.

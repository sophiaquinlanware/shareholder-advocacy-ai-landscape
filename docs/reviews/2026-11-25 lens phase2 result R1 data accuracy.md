REVIEWER: Data accuracy SCORE: 70 VERDICT: REVISE

(I reviewed commit 50ef813. rules.js and lenses.js changed on disk while I was reviewing, so recheck these points against the new versions.)

TOP FAILURES
1. **Wrong threshold where a vote chain is split.** googl-2025-ai-targeted-ads-hr (14.29%, 2025) has `vote_history` for 2024 only. The 2023 vote (18.02%) sits on googl-2024's history. `resubmission()` (rules.js) reads only the node's own history, so it shows "Needs 15% (vote 2)". The 2027 meeting's 5-year window (2022–2026) holds 3 votes, so 25% is correct. The `vote_history.proposal_id` values ("msft-2024-6") also don't match the node IDs ("msft-2024-hr-hotspots"), so the code can't chain them by ID. `superseded()` falls back to matching company, year and pct, which breaks on rounding (33.57 vs 33.58).
2. **The voted case misstates eligibility.**
   - `meetingYear = max(last+1, todayYear)` ignores meetings that already took place. amzn-2024-customer-dd is evaluated for 2026, but AMZN's 2026 meeting was in May.
   - That node shows "At risk of losing resubmission eligibility … Needs 15% to stay eligible", but its 2024 vote (16.79%) already cleared 15%. It is eligible through 2027, and any refile would face the next bar, not 15%.
   - For an upcoming vote, the code compares the earlier vote against the next bar, so it can label a proposal "below" before its vote happens.
   - Its window is [year−5, year) plus 1, which can count a vote from year−5 that drops out of the next meeting's window.
3. **Caveats never fire on real data.** On origin/data/proposals-29, 0 of 16 `vote_history` nodes carry `source`, `match` or `vote_history_source`. So "Earlier votes matched by this site" never shows. Pairings such as googl-2024 "AI Principles and Board Oversight" ↔ googl-2026 "AI board oversight" are this site's judgement but appear as fact. `support_note` is also on 0 graph proposals on both branches, so the For ÷ (For + Against) basis note can't show either.

TOP IMPROVEMENTS
1. Build the vote chain across nodes with one shared key. Evaluate each proposal for the next meeting whose deadline hasn't passed. For a voted proposal that cleared its bar, state "cleared X% by N points" rather than "at risk".
2. Agree the field names for the matching caveat and the basis note with the data session. Add tests for the "below" state and for exactly 5 gap rows; the test only checks for more than 0.
3. A `member of` hop where one end is the coalition itself shouldn't read "shared coalition membership". Live case: ICCR → AFL-CIO → Apple 2024 → Apple reads "(ICCR, 20 members)".

Checks that passed:
- **Gaps on live data:** 5, matching the plan (MSFT, META, NVDA on governance; TSLA on 2 topics), with correct filed-at counts. On proposals-29 data the list grows to 24 across 16 companies.
- **Deadlines:** the Eastern-time "today" is right (04:30Z on Nov 25 counts as Nov 24). Days left check out (AMZN 15, AMD 2), and past deadlines are hidden.
- **Warm paths:** all 167 co-filed hops are labelled inferred and every `proposals` ID resolves.
- **msft-2026-hr-hotspots:** 27.48%, 25%, vote 4 is correct.

OUT-OF-FIELD NOTES
- The fixture puts a future `filing_deadline` on a proposal that is already on the ballot. On real data a proposal's deadline has always passed, so "Co-file before" never appears.
- With the proposals-29 data the gap list grows to 24 ghost nodes. That may crowd the graph.
- The changes to rules.js and lenses.js made during review need their own result review.

CONTENT RULES: FAIL.
- Never claim 5: googl-2025's threshold and vote count are wrong.
- Never claim 4: this site's matching of earlier votes is shown with no "matched by this site" caveat on proposals-29 data.
- Never claim 1 passes: no vote direction is given and the exempt-solicitation asks are left out. The scope wording passes too ("in this dataset", "this site's reading; thresholds may change").

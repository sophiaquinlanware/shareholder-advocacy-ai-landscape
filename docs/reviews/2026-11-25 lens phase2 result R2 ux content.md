REVIEWER: UX / content SCORE: 84 VERDICT: PASS

TOP FAILURES (none blocking; all three Round 1 failures are fixed)
1. **Still open: the at-risk label on proposals still to be voted on.** The action line is now a fact about the threshold and is kept apart from the meeting line (desktop-light-resubmission-on-ballot.png). But the heading marks still stack "Upcoming vote" and then "! At risk of losing resubmission eligibility" (`impactRings`, lenses.js:174). On a proposal still to be voted on, that label is the remaining hint of a vote target. Suggested: "Resubmission threshold after this vote: 25%" as the mark text when `r.pending`.
2. **Dropped from Revision 2: the support-basis note.** The line "Support basis note on file: the rule counts For ÷ (For + Against)" has been removed. `resub()` no longer reads `support_note`. Where a chain vote was computed on a different basis, the percentage is shown with no warning about that.
3. **Edge-case wording.** When support equals the threshold, `r.margin` is 0, and lenses.js:199 then renders "0 points above the 25% resubmission threshold". It should read "at the 25% threshold".

TOP IMPROVEMENTS
1. "Source pending" is now applied by `needsSource` and to empty-href links (graph.js `lk`), which closes the Round 1 content-rule gap. Add a test for one action with no source.
2. The company deadline that quotes the proxy text (desktop-light-company-deadline.png) is clear and checkable. It is a good model for the other facts.
3. The caveat "matched in this dataset by company, topic and similar title, not confirmed from the proxy" scopes the claim well. Consider giving it its own line so it isn't lost at the end of a dense bullet.

OUT-OF-FIELD NOTES
- Visual: with a company selected, its connection labels overlap badly (desktop-light-company-deadline.png, around Alphabet).
- Data accuracy: the Alphabet deadline of December 25, 2026, and the vote-chain matches using `samePct` ≤0.05, should be checked against the source filings.
- Process: while extracting screenshots I ran `git checkout e53b7f4 --`, which detached HEAD in this worktree at the same commit. I switched straight back to `design/lens-phase2`. No files were changed by me. The uncommitted edits to docs/STATE.md and the plan file belong to another session; I left them untouched.

CONTENT RULES: PASS
- No vote direction: the threshold is now separate from the meeting line, and the board recommendation is not shown.
- No advice.
- Sources: "source pending" now covers unlinked facts.
- Scope honesty:
  - the gap line says "compared with all of them, any value-chain tier";
  - the vote-matching caveat is shown;
  - "this site's reading; thresholds may change" is kept.
- Seeking asks: exempt-solicitation asks are still hidden. The test seeking data is labelled as test data.
- Plain labels throughout.

REVIEWER: UX / content (Round 2, commit 8b85826) SCORE: 78 VERDICT: REVISE

TOP FAILURES
1. **The new "abstentions counted" label is wrong for 6 of the 7 figures it marks.** `isAbstainBasis` (lenses.js) matches any `support_note` that contains "abstain". Most notes only list the Abstain count as raw data. axon-2023-6 (13.67), so-2026-9 (9.74, "the same basis"), dlr-2025-5 (10.37), dlr-2026-4 (22.47), nflx-2024-4 (43.29) and ibm-2026-7 (2.45) all equal For/(For+Against). Only nvda-2026-product-ghg counts abstentions. On top of that, the basis sentence adds "as the company's bylaw does", which no note or source states. Both break Never claim 4 and 5. Fix: match "abstentions counted as against" or "For+Against+Abstain" only, and drop the bylaw clause.
2. **The "computed from 8-K vote counts" count is too low, and its fallback wording can be false.** `isComputed` misses "counts only" (DLR ×2), "8-K Item 5.07: For…" (NFLX), "gives no percentage" (NVDA) and IBM: IBM's 8-K states 2.4%, but the site stores 2.45, so that figure was computed too. For example, ask-dc-water reports 1 computed figure, but all 3 are. When the count is 0, the line reads "each figure is the percentage the company states". That happens to be true today, for the Microsoft oil-and-gas ask only. Fix: derive this from a data field, or match "no company percentage", "gives no percentage" and "counts only".
3. **The scrubber is no longer under the graph.** The owner's spec says "Add a year scrubber under the graph". `#net-scrub` now sits above `.net-body`, between Graph settings and the graph. If that was on purpose (for example, to keep it visible), record why in DESIGN.md or the plan. Otherwise, put it back under the graph.

TOP IMPROVEMENTS
1. Retake the docs/design/lens-phase4 screenshots. They are pre-fix, so the new panel order, the always-on ask labels and the scrubber position haven't been checked visually at 390 px.
2. Add test assertions that read the data:
   - the abstention label appears only on nvda-2026-product-ghg;
   - the panel's recurrence line includes "(up to Y" after a scrub.
3. The other fixes landed well:
   - the ask's name and mark now come first;
   - "No requirement found. {note}";
   - the lane filter;
   - the panel follows the slider, and the ask node hides when none of its proposals fall in range;
   - the List view states the cap.

   Optionally, append "(dual-class)" in the year text as well as in the link labels, for screen-reader skimming.

OUT-OF-FIELD NOTES
- Play's `aria-pressed` was removed (the name changes instead), which goes against plan Revision 2. An accessibility reviewer should confirm that.
- STATE.md should record that all 12 asks have no company actions in the Causality map, so the owner's "commitments" item is unmet by the data.
- `ev_kind` now overrides nothing, but `kind` on ev- nodes is still remapped. Check that the List view's Type column still reads correctly.

CONTENT RULES: FAIL
- **Never claim 4 and 5:** the abstentions mislabel and the unsourced "bylaw" clause put a false basis on 6 published figures.
- **Never claim 6** (the R1 company-actions issue): fixed. All 12 asks now correctly read "No Causality map events…".
- **Average exception:** labelling is otherwise correct, and the dual-class detection now excludes AXON's "Single class" note.
- **Rule 8 and Rule 9 scope:** still pass.
- **Plain labels:** "Value chain, by tier" is a plain label. Pass.

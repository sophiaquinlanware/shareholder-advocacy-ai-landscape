# Network views result, review R1: UX, accessibility, data

Reviewer: subagent, 2026-11-26. Saved verbatim.

**Network views result review R1: UX, accessibility, data.** Score 76/100. FAIL.

I checked each finding from the plan review:
- **Fixed:** 1, 2, 3, 5, 6, 11 and 12.
- **Fixed except for topic:** 4. See finding 3 below.
- **Fixed for search:** 8. The path finder is declined, which is acceptable.
- **Declined with a reason:** 9, which is fine.
- **Partly fixed:** 7. The Orphans checkbox still does nothing in Proposals.
- **Not fixed and not declined:** 10. holdStatus still says "Not in this map".

Remaining findings:

1. **Wrong count line.** Both screenshots read "392 of 792 nodes shown", under All and under Active (4). `setMode` and the pstatus handler never call `intro()`. Fix: call `intro()` in both.
2. **Filters stay on when you switch views.** `state.upto`, year and topic still apply after you switch to Connections, where their controls are hidden. The slider still hides later `ev-` events there. `pstatus` also persists, so searching a past proposal while Active is on selects a node that isn't drawn. Fix:
   - In `setMode("connections")`, clear upto, year and topic, or keep the slider visible, since it filters events.
   - In `focus()`, set pstatus back to "all" when it hides the target proposal.
3. **Topic filter ignores some solicitations.** `filtering()` leaves out `state.topic`, so the 57 exempt solicitations aimed at a whole company still bring in investors and companies when a topic is chosen. Fix: add `|| !!state.topic`.
4. **Search can select a node that isn't drawn.** In Proposals, a filer or company with no proposals isn't one of the hidden kinds, but orphans are forced off, so `focus()` selects something invisible. Fix: if `!visible(n)` after the layer is switched on, switch to Connections and say so.
5. **Path finder gives no warning.** In Connections it says "Path found" but draws only part of the route. Add a line saying the full route shows in Proposals.
6. **Orphans setting in Proposals:** disable the checkbox with the note "Proposals view never shows unlinked nodes".
7. **Holdings wording:** change "Not in this map" to "not in this view" when in Proposals.
8. **Status text:** the announcement reads "Active (4) proposals: N nodes shown". Use the label without the count.
9. **Heading placement:** the "Proposals: filers to companies" line sits above the h2, about 400px from the switch. Move it next to `#net-views`.
10. **Tests:** there's no test for the Policymaker lens opening in Proposals, or for search switching views.

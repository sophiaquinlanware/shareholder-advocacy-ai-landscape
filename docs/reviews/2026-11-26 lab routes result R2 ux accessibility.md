# Lab routes result, review R2: UX and accessibility

Reviewer: subagent, 2026-11-26. Saved verbatim.

**Lab routes result, review R2: UX and accessibility. Score: 84/100 (PASS)**

I checked each R1 finding against the current code:
- **Done:**
  - #1 Phone cards put the deadline cell second (`order`), and the test checks this.
  - #2 Related asks are now a count with the list inside a `<details>`.
  - #3 `aria-sort` appears only on the active column. Each column has its own first direction and sort phrase, and the status line keeps the count.
  - #4 Lab chips are `aria-pressed` buttons, and the plan says so.
  - #6 The "Not tracked" findings line is gone.
  - #7 The tests now check the card order and the sort status.
  - #8 `--blue-2` on white measures about 5.3:1.
  - #5 partly: labels wrap with a `<title>` and have a white halo, and the dots are blue.
- **Still open:**

1. **The Tie sort announces the wrong order (bug).** `sortValue` is `-GROUP_ORDER.indexOf`, so the first click (desc) puts Owner first. The status line still says "tie group, customer first", and the second click is wrong the other way round. Fix: swap the two `say` strings, or use `+indexOf` with `first: "asc"`.

2. **Unselected map labels are still faint (R1 #5).** `apply()` sets the node group to `opacity 0.55` and also sets its text to `--ink-soft`. That works out to about #a0a0a0 on white, near 2.6:1. You can see it in the phone map: "TSMC", "Oracle", "OpenAI". Fix: drop the opacity on the nodes (or only on the circles) and keep the `--ink-soft` text, which is 7.5:1.

3. **On phones the filer lines still merge into one band.** With a 22 px gap, every filer line runs as a near-vertical stroke at the company dots. Fix: when `narrow`, make the filer lines thinner (`w*0.5`) and set their stroke-opacity to about 0.5. Or draw only the active filers' lines once a lab is chosen.

4. **The sort phrase drops after a lab change.** `sortState` carries over to the new lab, but `selectLab` resets the status to `S.summary`. The table is still sorted (for example A to Z) and the line doesn't say so. Fix: add the current sort phrase whenever `sortState.key !== "default"`.

5. **Stale comment.** `wrapLabel` says "at most two lines"; it now allows three.

6. **The status line repeats findings.** The status line and the findings both give the "open deadline" and "none filed" counts. This is minor, so it can stay as it is.

7. **Queue, not this session (from R1 #9).** The sticky tab bar covers about 200 px of the phone map.

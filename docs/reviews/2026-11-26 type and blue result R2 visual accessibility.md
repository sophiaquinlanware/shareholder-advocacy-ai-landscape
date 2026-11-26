# Type and blue result, review R2: visual design and accessibility

Reviewer: subagent, 2026-11-26. Saved verbatim.

Round 2 result review (visual design and accessibility), type and one blue, uncommitted working tree

Score: 78/100 (FAIL). One bug, which a one-line fix clears. Everything else from R1 is fixed or accepted.

R1 findings, checked:
- R1-7 (scope of "every blue"): resolved. DESIGN.md now gives indigo, cyan and teal as the owner's exception.
- New 1 (bar height on phones): resolved by the owner's choice to tuck the tab rows. Scrolling down leaves a bar about 45px tall.
- New 2 (WCAG 2.4.11, focus hidden under the bar): fixed. `--bar-h` comes from the real bar height through ResizeObserver, and `:focus-within` brings the tab rows back.
- New 3 (hover underline): fixed. It now only applies under `(hover: hover)`, and hovered text stays grey.
- New 4 (topic shapes): fixed. The tags use square, triangle and diamond, and the plot key already used the plot's symbols.
- New 5 (small labels): fixed for the four named.

Remaining:
1. **Tab rows overflow on phones (blocker).** `.tab-row { max-height: 200px }` is shorter than the six tab rows at 390px. "DISCLOSURE SCORECARD / NEW FILINGS" spill below the bar and sit on top of the table (ty3-m-up.png). The bar's measured height leaves them out, so a focused tab there can also be covered. Fix: use `max-height: 400px` (or `none` when the rows are not tucked), and add `overflow: hidden` to `.tab-row` in every state.
2. Two labels are still 11px: `.sc-pillar` and `.pw-flag`. Raise them to 12px.
3. The metric-matched fallback is still missing. This is low risk because only two weights load, but swapping fonts can shift the layout. Add an `@font-face` "Schibsted fallback" on local Arial with `size-adjust`, `ascent-override` and `descent-override`, and put it in `--sans`.
4. Housekeeping: DESIGN.md and STATE.md are still uncommitted.

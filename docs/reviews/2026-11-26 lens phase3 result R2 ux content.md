REVIEWER: UX / content SCORE: 84 VERDICT: PASS

The three R1 failures are fixed in code at 0ee72a8:
- **Definitions:** each one sits after its paragraph, opens on hover or tap, can be pinned, and closes with Esc.
- **Fund line:** it reads "Vanguard: Against" with a separate detail line, and the heading names the family.
- **Proxy link:** it reads "Read the proxy statement".

I checked the result from the code, because the docs/design/lens-phase3/*.png screenshots were taken before these fixes. The feed wording is unverified visually.

TOP FAILURES
1. **The graph view's plain-language pass is only partial.** The intro is now plain (`plainIntro`, lenses.js: "Bigger circles are companies with more AI proposals…"). But other text this lens shows is still jargon:
   - The live line after a lens change in graph view still says "…N of M nodes shown" (graph.js, the `net-lens-status` else-branch).
   - The key chips in this lens still read "Hyperscalers and AI clouds" and "Frontier AI labs", and "Graph settings" is unchanged (R1 screenshot desktop-light-bigger-picture.png; no diff touches TYPE_LABEL).
   - "Showing 154 of 346 items" doesn't say what an item is.
2. **The new label placement hides labels of a selected node's connections.** In docs/design/legibility/desktop-light-co-MSFT.png, Microsoft is selected, yet about 6 connected circles (pink, green, orange) have no name. That's because `layoutLabels` sets opacity 0 when it finds no free spot (graph.js). DESIGN.md quotes the owner: "label all the connection nodes". The code comment points to the panel and List view instead. That's a reasonable trade-off, but it changes the owner's spec, so it should be raised with her, not decided here.
3. **The lens-phase3 screenshots are from before the fixes.** AGENTS rule 20.3 needs current after-screenshots. The new definition placement (after the paragraph, pushing the list down on hover) and the moved "See the bigger picture" button have not been seen by anyone. Retake the default, MSFT+Vanguard and bigger-picture shots at 1440 and 390 px, and do one with a definition open.

TOP IMPROVEMENTS
1. Hovering "What's a proxy statement?" opens a block under the line and pushes the items below it down. In a long list that moves content under the pointer. Consider opening on hover only after a short delay, or on focus or click only for the repeated per-item term.
2. Add a short note to the detail line about how few funds it covers, e.g. "from 1 fund's filing" is a small sample of Vanguard's funds. It's accurate now, but a lay reader may still read it as all of Vanguard.
3. In this lens, rename the key chips to plain words (for example "Cloud providers" and "AI model makers"), as the lens's own labels.

OUT-OF-FIELD NOTES
- Accessibility: the mouseover-opened definitions sit outside the button. Check that a screen reader gets the definition through `aria-controls` alone, or add `aria-describedby`.
- Visual: the header strip `rect` spans x -width to 2×width. Check that it doesn't cover nodes when zoomed out.
- Data accuracy: msft "Additional Disclosures Meeting Climate Commitments" is still tagged "Data center impacts". Confirm it.

CONTENT RULES: PASS
- The glossary's "most people" claim was reworded to "Shareholders can vote online or by mail beforehand".
- Nothing recommends a vote, `board_rec` isn't shown, and the disclaimer is quoted.
- Fund votes are filed facts, each with N-PX links and the auto-match and partial-coverage notes.
- Held-back and unchecked proposals now show nothing (`usable` returns null).
- The scope "in this tracker" is kept, and the not-found counts are computed from the data.

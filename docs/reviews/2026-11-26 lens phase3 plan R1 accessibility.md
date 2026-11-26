REVIEWER: Accessibility SCORE: 72 VERDICT: REVISE

TOP FAILURES
1. **The view switch doesn't say where focus goes.** The plan says "See the bigger picture" shows the graph and "Back to the list" returns, but it never says where focus lands. If the feed is hidden with the button still focused, keyboard and screen-reader users drop to `<body>`. That fails WCAG 2.4.3 (focus order). Today's code does this right in one place: the holdings `close()` returns focus to its trigger (graph.js:584). Fix: move focus to the "Back to the list" button or the graph-area heading, and back to "See the bigger picture" on return. Announce the switch in `#net-lens-status` (graph.js:302), which must sit outside the hidden area. Also say whether `view=` uses `replaceState` like `saveLens` (graph.js:86), which means the browser Back button won't undo the switch.
2. **The term definitions mix two patterns and miss WCAG 1.4.13 (content on hover or focus).** The plan pairs `aria-expanded` with `role="tooltip"` plus `aria-describedby`. That is half a disclosure and half a tooltip, and a tooltip can't be toggled by tapping. 1.4.13 needs three things: dismissible (Esc, covered), hoverable (the pointer can move onto the box without it closing) and persistent (it stays until dismissed). The plan only covers Esc. It also doesn't say:
   - that Esc calls `stopPropagation` so it doesn't also clear the panel (graph.js:742) or the graph (graph.js:787);
   - that each repeated term gets a unique id;
   - that the box isn't clipped by `.table-wrap` overflow or pushed off-screen at 390 px (1.4.10, reflow).

   Pick one pattern. The simpler fit for tap is a disclosure: `aria-expanded` and `aria-controls` on the button, with an inline definition that pushes content down rather than covering it.
3. **What gets hidden is unclear.** The graph area is said to be "controls, key, settings, graph and panel", but nothing places the My holdings button, `#net-hold` or `#net-hold-status` (graph.js:313–322). Leaving them visible means two ticker inputs in feed view. The existing Graph/List toggle (`state.view`, graph.js:975–981) clashes with the new `view=feed|graph`. List view is the graph's only text equivalent (DESIGN.md "List view"), so the plan must say it stays reachable from the bigger-picture view.

TOP IMPROVEMENTS
1. Input: use a `<form role="search">` with a visible `<label>` and a real submit button, so Enter works natively. Put the examples and "Stored in this browser only" in visible hint text tied with `aria-describedby`, not in a placeholder. Update the live line only on submit, and include the number of votes listed.
2. List semantics:
   - make the feed a `<ul>` with each item an `<li>` that has an h3 (the company name);
   - mark dates with `<time datetime>`;
   - give repeated "[proxy statement]" and "[filing]" links a visually hidden company and year so they make sense out of context (2.4.4);
   - never put a term button inside a link.
3. The term buttons need the 2px `:focus-visible` outline and a definition box that uses tokens and meets contrast in both themes (light and dark both run in `npm run check`). There will be about 4 items with several terms each, so keep one button per term per item to avoid piling up tab stops.

OUT-OF-FIELD NOTES
- Typing tickers into the feed silently overwrites My holdings (UX).
- The graph draws lazily when `#tab-network` is unhidden (graph.js:1019), so it may lay out at zero width while its area is hidden (build).
- Calling the 2025 proposal "the 2025 version" of a 2026 one needs a check against the source for each pair (data accuracy).

CONTENT RULES: PASS. Nothing is invented, the plan never shows `board_rec` or says how to vote, and each fund vote keeps its source. DESIGN.md named rule 6 ("no definitions") needs an exception for this lens recorded in the same commit, as the plan says. Rule 9 (WCAG 2.1 AA) is at risk until failure 2 is fixed.

REVIEWER: Visual design SCORE: 84 VERDICT: PASS

All three R1 failures are fixed. I recomputed the contrast ratios myself (WCAG luminance) and they match what you reported.

1. **Network palette: fixed.** styles.css:116-118. Light: proposal vs other 2.25:1, person vs foundation 1.69:1. Dark: 2.31:1 and 1.96:1. Against --surface, every one of those colours is at least 3.25:1. In desktop-light/network.png and desktop-dark/network.png, proposal (slate) and other (grey) dots now look different, and so do engagement lead (amber) and response (olive). DESIGN.md:40 records the ratios.
2. **One green: fixed.** --n-manager (styles.css:116), --t-equity (146), --open (11) and --sc-met (167) are all #1e6e5a in light, and #7fe3d6 in dark (26, 117, 147, 168). In pathways.png the equity-stake legend dot is the same green as the "Still open" pills in rights.png. DESIGN.md:40 states the rule.
3. **Heading weights: fixed.** h1 300, h2 600, h3 600 (styles.css:62-64). DESIGN.md:45 explains the scheme: below the h1, size alone sets the order, so no smaller heading is heavier than the one above it. index.html:10 now requests Inter Tight at 300 and 600 only. In rights.png, "Rights map" and "Company detail" (h2) clearly outrank the card titles (h3).

TOP FAILURES (none of these blocks shipping)
1. **Two legend entries share a colour (the build doesn't follow the design).** "Labor fund" and "Frontier lab" are both pink in desktop-light/network.png: graph.js:37 uses --n-labor and graph.js:42 uses --t-lab, and both are #b8456b. graph.js:43-45 also reuse the pension, foundation and nonprofit colours for policy, response and public. So 15 legend entries share 11 colours, while DESIGN.md:40 says "Eleven node types".
2. **Pathways investor dots look wrong (unverified).** In pathways.png every investor dot is green, but the "investor engages company" legend chip is grey. Either one of them is wrong, or the legend needs to explain the dots. I haven't traced this in pathways.js, so it doesn't count toward the score.

TOP IMPROVEMENTS
1. Update DESIGN.md:40 to say 15 legend types share 11 colours and name the shared pairs, or give frontier lab its own colour.
2. Make the pathways investor dot colour match its legend chip.
3. Add the colour reuse to the round 2 chart audit that DESIGN.md:40 already mentions.

OUT-OF-FIELD NOTES
- Accessibility: same-colour legend pairs depend on their text labels. Check that the graph nodes have a non-colour cue too.
- Network labels overlap heavily in the dense cluster (both network.png screenshots).
- I couldn't find the R1 visual result file under docs/reviews/; only the plan R1 visual review exists.

CONTENT RULES: PASS (none of the copy I reviewed recommends a vote or gives advice; the disclaimer shows in the footer of every screenshot I opened)

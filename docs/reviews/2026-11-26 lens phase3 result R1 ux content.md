REVIEWER: UX / content SCORE: 76 VERDICT: REVISE

TOP FAILURES
1. **The graph half of the lens is still practitioner copy, which plan R1 UX failure 3 already flagged.** The owner's spec says "Write all copy in plain language" for this lens. Revision 2 changed only `sizeLabel` (lenses.js). After "See the bigger picture" the user reads "154 of 346 nodes shown… Company tiers are this site's reading of each company's main role in the AI value chain", plus keys such as "Hyperscalers and AI clouds" and "Frontier AI labs", and "Graph settings" (desktop-light-bigger-picture.png). None of these has a term button. This is a gap in the design, not a build slip.
2. **The definitions don't do what the spec asks, and they break the sentence they sit in.**
   - The owner asked for a "hover definition". The build is click-only (graph.js `feedShell` click handler; there's no hover).
   - Opening "shareholder proposals" puts a block box in the middle of the intro sentence, so the rest, "at the annual meetings of the companies this site tracks", becomes a separate fragment under it (desktop-light-feed-msft-vanguard.png, phone-light-feed-msft-vanguard.png). A first-time reader loses the sentence.
   - The `.term-def` box should sit after the sentence or paragraph, not inline in it.
3. **The main lines of each item aren't plain language yet.**
   - No proposal has `plain_summary` (grep of data/proposals.json finds none), so the "one-sentence plain-language summary" is the raw proxy title, e.g. "Additional Disclosures Meeting Climate Commitments".
   - The fund line reads "Vanguard funds in these filings (1 fund record): Against (matched automatically, not yet reviewed; from part of this family's filings for that year)." That is accurate, but it is three qualifiers deep and uses "fund record", which isn't defined.
   - The proxy link text is "[open]", a small target next to a term button that looks like a label.

TOP IMPROVEMENTS
1. In the feed, move the caveats to a second line: "Against · 1 fund's filing · not yet reviewed". Make the proxy link "Read the proxy statement" and keep the term button separate.
2. Move "See the bigger picture" up next to the live line, or repeat it there. On a phone it sits under the whole list.
3. Put the counts from the plan into the not-found line ("the N tracked companies or the 8 fund families"), computed from the data. The build dropped them.

OUT-OF-FIELD NOTES
- Visual/test: in phone-light-feed-msft-vanguard.png the sticky tab bar covers the input and the first company heading. It's probably a full-page capture artifact, but check the real scroll.
- Data accuracy: msft "Additional Disclosures Meeting Climate Commitments" is tagged "Topic: Data center impacts". Confirm against the source.
- Accessibility: the heading "How your fund voted last year" (h5) sits under an h4 for each item. Check the outline with a screen reader.

CONTENT RULES: PASS, with one caveat.
- Never claim 1 and 2 hold: the disclaimer is quoted, `board_rec` isn't shown, and past votes are filed facts with N-PX links.
- Auto-match, partial-coverage and NEEDS_CHECK wording is present (lenses.js `fund`).
- Scope is stated ("in this tracker"). Definitions fall under PRODUCT.md's one-lens exception.
- Caveat: the GLOSSARY entry for "annual meeting" says "Most people vote online or by mail beforehand". That's an unsourced claim about how most people vote (rule 6). Reword it to "Shareholders can vote online or by mail beforehand."

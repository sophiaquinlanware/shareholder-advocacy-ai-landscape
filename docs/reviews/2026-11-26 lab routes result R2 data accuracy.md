# Lab routes result, review R2: data accuracy and wording

Reviewer: subagent, 2026-11-26. Saved verbatim.

**Lab routes result, review R2: data accuracy and wording. Score: 90/100 (PASS).**

I checked all eight R1 findings against the current pathways.js and the data:
1. **Fixed.** The self-line now needs `c.ticker`. Only Anthropic (ANT, "US proxy rules apply", SEC source) and xAI ("inside SpaceX (including xAI)", SPCX) match. OpenAI, Mistral AI, Cohere and Reflection AI have null tickers, so they show no line.
2. **Fixed.** The dual-class flag is now set per company. It is true for GOOGL and META and false for every other ticker I checked, so the five GOOGL/META votes with no note get the flag.
3. **Fixed.** The text now reads "none under related asks", and "no vote on record" shows when proposals exist but none has a vote result.
4. **Fixed.** A filer with several proposals shows "(k; link is the first)".
5. **Fixed.** "URL to recheck (see gaps)" shows on the msai, amazon-agi and msl lab nodes and on the aapl→openai and googl→openai cloud ties. Gap 5 also names Microsoft–xAI, but there is no such tie, so nothing is missed.
6. **Fixed.** The intro says "filers on record" and the note says "a board seat or observer role".
7. The scope labels are still correct.
8. **Fixed.** The test at tests/lens4.spec.js:138–139 checks that `#pw-lab-about` does not contain "listed itself".

All 74 ties still have a `source_url`, and all ten ask ids exist in asks.json. All seven tie types map to a group, so none falls into "customer" by mistake. I found no "pressure", vote guidance or coordination wording on the page, and no numbers that are not in the data.

Remaining polish (none of it blocks PASS):
- **"active" in the map note.** Line 302 says "Filers shown: N, active at the companies…". *Fix:* "Filers shown: N, with AI proposals on record at the companies…", which matches the intro.
- **Findings bullet wording.** Line 235 says "No AI proposals filed here yet", but it lists several companies. *Fix:* "No AI proposals on record".
- **Panel score.** Line 438 says "sum of tie strengths". *Fix:* "sum of site strength ratings", so it reads as the site's rating and not a disclosed figure.
- **"Major shareholder" for ASML.** The only board-seat tie is ASML→Mistral at strength 2, and the label calls ASML a major shareholder. The note explains the rule, but the label claims more than a strength-2 board tie. *Fix:* check the label against the tie's source, or say "Board seat" for that type.

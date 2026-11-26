REVIEWER: UX / content SCORE: 72 VERDICT: REVISE

TOP FAILURES (max 3, each with evidence)
1. **Design is wrong: node size changes per lens, but the intro line still says it means connections.** graph.js:292 hard-codes "Node size = number of connections." The plan changes what size means in two of the three lenses (plan line 38: "AI proposals on file" and "how often the same subtopic recurs"). Neither scope items 1–3 nor the Files table (plan lines 15–31, 44–53) says the intro gets rewritten per lens. So in Individual investor and Policymaker, the page would tell visitors the wrong thing about the graph.
2. **Design is wrong: the action wording points people toward voting.** The plan's actions say "Vote at the {meeting} AGM" and "Contact lead: {person}" (plan line 40). PRODUCT.md Never claim 1 (line 25) says the site never says or implies how anyone should vote, or organizes investors to vote. An imperative "Vote at…" next to a proxy link reads as a prompt to vote. Plan line 42 argues it only names the event, but stating the event outright does that with no imperative. Suggested wording: "Annual meeting Dec 8, 2026 · votes due Dec 7 [proxy]" and "Engagement lead: {person} [public profile]".
3. **Design is wrong: two behaviours are left undefined.**
   - The "(vote by …)" date has no data field to fill it. It exists only as prose inside `note` in data/upcoming.json ("Vote by 11:59 p.m. Eastern, December 2, 2026…"), and the plan rules out new fields (line 64). The build would have to parse that sentence or drop the date.
   - The plan doesn't say whether switching lens overwrites layers, topic or year that the visitor already set by hand (plan line 18, "defaults (hidden layers, topic, year)"). A visitor could lose their filters without warning.

TOP IMPROVEMENTS (max 3)
1. Write the intro line from the active lens: "Node size = {lens.sizeLabel}". Add `sizeLabel` to each lens entry so a fourth lens still needs only one config entry.
2. Define what a lens switch does: it applies that lens's defaults and resets filters, and the count line states it, e.g. "Policymaker view: filers and people hidden."
3. Leave "reported" out of the key and the text until an edge actually has it. No edge in data/graph.json is reported today (541 have a source URL and 167 are derived), and an empty state on screen is a control that does nothing. "Inferred from co-filing" is accurate: all 167 derived edges are "co-filed with".

OUT-OF-FIELD NOTES (max 3, one line each)
- Accessibility (unverified): at 390px the three lens labels may wrap. The phone screenshot already shows the filters and key spilling over 7 rows before the graph starts (phone-light/network.png).
- Accessibility: `role="application"` takes over screen-reader keys. Use it only if Up/Down/Enter/Escape are announced and the List view stays one step away.
- Data: the "Average support" action depends on `support_pct` being present. It must say "no vote-results filing" instead of computing an average when that figure is missing.

CONTENT RULES: FAIL
- "Vote at the {meeting} AGM" (plan lines 40–41) is an imperative that implies voting; it fails PRODUCT.md Never claim 1.
- "Node size = number of connections" (graph.js:292) would be untrue in the Individual investor and Policymaker lenses, so the intro states something false.
- Lens labels and the "What you can do" heading are plain; they pass.

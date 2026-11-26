REVIEWER: UX / content SCORE: 72 VERDICT: REVISE

TOP FAILURES
1. **Internal pipeline text shows up in the UI.** The tier panel prints the raw `ties_note` ("ties_from_tier and ties_into_tier count every member…"). It has no full stop before "Equity stakes…" (desktop-light-compute.png). The heatmap caption shows `derived_note` word for word, including "data/value_chain_ties.json", "per_tier" and "scripts/build_value_chain.py". On the phone screenshot that is a 12-line block before the table. The key reads `Each line reads "{from} {tie} {to}"`, so a template placeholder reaches practitioners. All of this breaks the plain-labels rule.
2. **The "effect you can have" part of the owner's ask is still thin.** The R1 plan review asked for "Asks made here and their results". The heading became "Asks made here" with only counts, topics and median support: no adopted, withdrawn or commitment outcomes, and no note saying outcomes aren't in the data. The panel for the owner's own example, Hyperscalers, is about 70 rows of flat lists (12 asks, 12 filers, 20 people) that bury the three-part answer. "Reached in two steps" is empty for Hyperscalers, so that part of "players you can reach" rests on direct ties only.
3. **Labels that are wrong or misleading:**
   - AI deployers has 22 people, but the code labels the list "(up to 20)" whenever there are 20 or more (valuechain.js showTier).
   - The "Fund votes on file" heatmap cell jumps to the "Shareholder routes" heading, not to a fund-votes heading.
   - "Shareholder routes" reads "5 US proxy rules apply, 2 US-listed foreign issuer", which is ungrammatical.
   - The "{from} {tie} {to}" wording gives "X distributes models Y" (8 ties), which doesn't read as a sentence.
   - At 390 px the column headers are cut to the first word, so "AI deployers" shows as "AI" and "Data centers and power" as "DATA" (the `narrow` split).

TOP IMPROVEMENTS
1. Open each tier panel with a three-line summary that answers the owner's three parts in order: the effect (asks, median, a stated outcome gap), the labs reached, and who is active (counts). The long lists can follow, collapsed.
2. Replace the file names in `derived_note` and `ties_note` with one plain sentence each. Keep the scope wording ("29 companies subject to US proxy rules… not a recommendation").
3. Give each tie type a phrase that reads as a sentence (for example "distributes models from"), and use full tier names or two-line headers at phone width.

OUT-OF-FIELD NOTES
- Accessibility/layout: in both screenshots the sticky tab bar covers the flow chart, and the scrollIntoView call may land the panel heading under it.
- Data: "Labs reached directly" lists lab names without per-tie sources in that line. The sources are only reachable through the company panels or the List view.
- At phone width the flow sideways-scrolls inside its own box and labels are clipped ("Micro", "Nebiu"). Acceptable inside the box, but worth a note.

CONTENT RULES: FAIL (narrowly).
- **Passes:** no "target" or "influence" wording; the advice-like heading was renamed "Shareholder routes"; there are no vote recommendations; capped lists are no longer counted in the heatmap (fixes R1's Never claim 5 issue); the median is labelled "computed by this site"; the overlap caveat is present; zero cells are plain text; "Open in Company lookup" is shown only when Company lookup has the company.
- **Fails:**
  - "(up to 20)" is a false statement next to 22 names.
  - Filer, coalition and people lists carry no source links in the panel (Never claim 4 says every fact links to a primary source).
  - Internal file and field names are shown as site content.

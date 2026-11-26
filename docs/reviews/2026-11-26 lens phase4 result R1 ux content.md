REVIEWER: UX / content SCORE: 72 VERDICT: REVISE

TOP FAILURES
1. **The only "company action" found is not a company action.** The code matches events by `match` terms but never filters to the `companies`/`labs` lanes, which Revision 2 and R1 required. Across all 12 asks I found exactly one hit: `ev-amazon-datacenter-vote-2026`, "Amazon data center energy proposal gets about 18% support". It is in the investors lane, kind campaign, its actor is "As You Sow and co-filers; Amazon", and its source is Insurance Journal. It would show under "Company actions in the Causality map that mention this ask" as an Amazon action. That suggests a link the data doesn't support (Never claim 6). The other 11 asks say "No Causality map events…", so the owner's third panel element is effectively empty. Fix: filter by lane, and record in STATE.md that the data can't yet answer this.
2. **Panel counts ignore the year scrubber.** `askActions` uses `ctx.nodes`, which holds all nodes, not the visible ones. In desktop-light-scrubber-min.png the graph is capped at 2023, but the panel says "5 proposals … 2023–2026" and lists 2024 and 2025 support. A user watching the network grow gets text that contradicts the graph. Fix: cap the counts too, or add "(all years; the slider caps the graph only)".
3. **You can't tell which ask you're on.** In the ask panel, the long "This ask" block comes before the node heading. In phone-light-ask-no-rule.png, "RECURRING ASK / Human rights in data center siting" appears only after about 12 lines of figures. In the lens overview (desktop-light-policymaker.png), none of the 12 ask nodes is labelled, so the clusters the owner asked for can't be read without clicking.

TOP IMPROVEMENTS
1. Fix the stutter in the "none" line: it reads "Checked, no requirement found: Checked Utah HB 76…". Use "No requirement found. {note}", or strip the leading "Checked".
2. Label the ask nodes on the graph. There are only 12, so permanent labels fit. Also put the ask name or mark above the actions block for asks.
3. Link each year's support figures to their filings, or list them in the List view, as Design 4 promised. Today the reader only gets "notes are in Proposals". Also flag the abstention-basis figures (Tesla) next to the dual-class note.

OUT-OF-FIELD NOTES
- STATE.md doesn't yet record the owner's "commitments" wording change, which Revision 2 required.
- The ask's panel header shows a bare "source pending" under the mark, though the ask is grouped by this site. Reuse the "grouped by this site (asks.json)" wording.
- The tests don't cover the lane filter or scrubber-versus-panel consistency.

CONTENT RULES: FAIL
- **Rule 6, no views attributed:** an investor-campaign news item is listed as an Amazon "company action".
- **Rule 4, sources:** the matched event rests on a secondary news source and is shown without "reported" confidence in the panel. The "none" lines correctly show "source pending".
- **Rule 5, the average exception:** passes. Averages are labelled "computed by this site", with dual-class and unlinked counts stated.
- **Rule 8, proposed rules:** passes. Status is stated ("not yet in force"). The "No rule in this map" scope is acceptable.
- **No slogan headings:** passes. Labels are plain.

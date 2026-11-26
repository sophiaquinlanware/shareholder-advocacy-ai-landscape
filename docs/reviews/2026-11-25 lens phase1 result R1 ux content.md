REVIEWER: UX / content SCORE: 72 VERDICT: REVISE

TOP FAILURES
1. Confidence markers run into the relation text and read as part of it. In the panel, "OpenAI equity stake reported [source]", "lead filer (from) verified" and "proposal at verified" read as "the stake was reported" or "the filer is verified", not as the strength of the source (graph.js diff, the `conf` span appended straight after `dir`; screenshots desktop-light-impact-microsoft.png and phone-light-policy-proposal.png). A practitioner can't tell what is being graded. It needs a separator or a label, e.g. "· source: verified".
2. The List view's "What you can do" column turns the button into dead text, and it drops links. `drawList` maps `x.button.label` to plain text, so "Open in Company lookup" shows in many rows with no control behind it (desktop-light-individual-list.png, rows for Alphabet, Meta, Amazon). Proxy and profile links are also dropped from the list (graph.js drawList, `acts = actions(n).map((x) => x.text || x.button.label)`). This breaks the "every control does something real" rule, and the list is no longer a full text equivalent of the panel.
3. The build doesn't follow Revision 2 in two places:
   - The filer action "Open its filings in Proposals" is missing. `filerActions` (lenses.js:86-97) has no such item, and nothing records that it was dropped.
   - R2 says list sorting gives "lens sizing" a text home, but the list sorts only by Connections. In the Individual lens, node size means "AI proposals on file", and that number appears nowhere in text (lenses.js:125-126; list screenshot).

TOP IMPROVEMENTS
1. Policymaker lens: the "What you can do" block holds statistics, not anything a reader can do ("Same topic (…): 43 proposals at 6 companies"; "Support across those with a filing: 0%–37.5%"). Give that lens's block its own plain heading, such as "Same topic", or let each lens set the heading.
2. Label the bare counts. "Filers active here: Ekō (3), Arjuna Capital (2)" doesn't say what the number counts; "(3 proposals)" would. "Exempt solicitations on file: 5" has no source link, though the plan says every count carries one (lenses.js:80, 95).
3. "Next AI vote: December 8, 2026 · Vote by 11:59 p.m." works now that the truncation is fixed. But under a "What you can do" heading, "Vote by" reads as an instruction. Consider "Voting deadline: …" while keeping the filing text in the source.

OUT-OF-FIELD NOTES
- Data accuracy: the Social & economic impacts support range starts at 0%. Check whether a withdrawn or omitted proposal carries support_pct 0 with a results_url.
- Accessibility: in phone-light-policy-proposal.png the tab bar covers the graph (sticky header overlap).
- Accessibility: `aria-live` was removed from #net-panel. Panel changes made by mouse clicks are no longer announced; only keyboard moves are, through #net-kb.

CONTENT RULES: PASS, with a caveat. No action says how to vote or gives advice. "Annual meeting" and "Next AI vote" name events and dates, and `board_rec` never appears. No average is computed; the support figures are a range of values stated in filings. No affiliation is implied. Labels are plain. The caveat: the verbatim "Vote by 11:59 p.m." under "What you can do" is a deadline from the filing, not a recommendation, but it is the closest the build comes to an imperative. The confidence wording in failure 1 is ambiguous rather than false.

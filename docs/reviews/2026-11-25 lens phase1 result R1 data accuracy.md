REVIEWER: Data accuracy SCORE: 76 VERDICT: REVISE

TOP FAILURES (max 3, each with evidence)
1. **The secondary-domain list misses about 16 secondary sources, so they show as "verified".** The rules.js comment (lines 4-10) defines law blogs and news as "reported". Recomputing over data/graph.json still marks these "verified": the law-firm alerts jonesday.com, cohenmilstein.com, seyfarth.com, cuatrecasas.com, gibsondunn.com, wiley.law and mofo.com (all policy "led to" / "responded to" edges); the news sites fortune.com, bloomberg.com (bloomberglaw.com is listed, bloomberg.com is not), insurancejournal.com, morningstar.com, ai-cio.com, greenmoney.com, impactalpha.com and techpolicy.press; and the aggregator ncsl.org. The totals today are 472 verified, 69 reported and 167 inferred. All 20 listed domains do occur in the data.
2. **The support range is not "stated in filings", and its wording is ambiguous.** The lenses.js comment (Policymaker) and plan Revision 2 both say both ends are stated values. But 40 of the 53 support values with a `results_url` in proposals.json carry a `support_note` such as "Not stated in the 8-K" or "raw counts only".
   - For Social & economic impacts the range is 0%–37.5% (34). The 0% comes from amzn-2026-worker-ai-council, a floor proposal; its 8-K "gives raw counts only, no percentage".
   - The Alphabet dual-class caveat is dropped.
   - "(34 votes)" reads as vote counts; it means 34 proposals.
   - The recomputed figure matches the policy-proposal screenshot.
3. **"Filers active here" cuts ties silently.** For co-MSFT the panel shows Ekō (3), Arjuna Capital (2), As You Sow (2). Open MIC, Azzad, NLPC and RSHM also have 2 and are hidden by the alphabetical tiebreak, and nothing says this is the top 3 of at least 8 filers.
   - The plan's filer action "Open its filings in Proposals" is not built.

Checked and correct: the MSFT action and proxy link; first-sentence truncation ("Vote by 11:59 p.m. Eastern, December 7, 2026."); Tesla gets no vote action because it has 0 items; the Individual-lens MSFT radius matches its 14 proposals; Trillium has 5 and NLPC 6 distinct exempt solicitations; 43 proposals at 6 companies, 2023–2026; all 167 inferred edges are co-filed with.

TOP IMPROVEMENTS (max 3)
1. Add the missing news, law-firm and aggregator domains. Or flip the rule: list primary domains (sec.gov, filers' and companies' own sites) and treat everything else as reported.
2. Change the comment to "values the site derived from 8-K counts", word the action "(34 proposals)", and leave out or flag values whose `support_note` says not stated, or point to the notes.
3. Write "Filers active here (top 3 of N)", or show every filer tied at the cut.

OUT-OF-FIELD NOTES (max 3, one line each)
- msft-2026-hr-hotspots is "Social & economic impacts" in graph.json, but upcoming.json gives item 6 as "Data center impacts".
- graph.json and proposals.json disagree: 49 support values with a `results_url` in graph.json vs 53 in proposals.json, and the values differ (e.g. 33.57 vs 33.58).
- companies.json has no tier/primary_tier field, so every company and lab reads "tier not yet assigned".

CONTENT RULES: PASS with reasons.
- Never claim 1–2: actions state dates, filers and counts. `board_rec` is never shown. "Vote by 11:59 p.m." is quoted verbatim from the deadline note. It sits under "What you can do", which is borderline but factual.
- Never claim 5: no average is computed. Range values come from the filings' counts, though not as stated percentages (failure 2).

PASS needs a score of 80 or more, so the verdict is REVISE.

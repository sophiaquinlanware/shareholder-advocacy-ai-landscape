REVIEWER: Data accuracy SCORE: 66 VERDICT: REVISE

TOP FAILURES (max 3, each with evidence)
1. **Design is wrong: the confidence rule marks secondary and self-flagged claims as "verified".** Plan line 21 defines verified as "has a `source_url`". Line 22 says no edge is "reported" yet. In fact all 541 non-derived edges have a URL (the 167 derived `co-filed with` edges have `source_url: null`, so "inferred" works). Those URLs include news sites, for example techcrunch.com (20), siliconangle (5), bloomberglaw (4) and euronews (4). 17 edges say UNVERIFIED in their own text: co-MSFT→lab-openai ("current % … UNVERIFIED"), and the edge type `exempt solicitation for (unverified wording)`. All of them would show "verified". No edge has a `confidence` or `source_note` field (count 0).
2. **Design is wrong: the counts and joins in the actions don't hold.**
   - "Exempt solicitations filed: n" double-counts if taken from the graph. Each PX14A6G appears twice, once as investor→proposal (55 edges) and once as investor→company (45 edges). National Legal and Policy Center has 12 graph edges but 6 filings in proposals.json. Some edges also cover non-filings, such as "support (pre-proxy press release)".
   - "Linked policy or rule events: n" has no input. There are 0 edges between proposals and policy, response or public nodes (only 9 company `acted in` edges).
   - Subtopic recurrence is mostly 1. There are 48 distinct free-text subtopics across 65 proposals, and only 4 recur across more than one company.
   - Graph proposal IDs don't match proposals.json IDs (52 of 65 differ, and 0 match on title). Support values also differ: graph.json:1076 has 33.57, proposals.json:14 has 33.58.
3. **Design is wrong: "Next AI vote" and "vote by …" have no structured source.** In upcoming.json, TSLA's meeting has 0 items, and AAPL, AMZN, META, GOOGL and NVDA have only "expected" estimated dates with 0 items. Only MSFT (3 items) qualifies, so the rule must require `items.length>0` and `status=="upcoming"`. The deadline exists only as free text in `note` (upcoming.json:12, :23), so "vote by …" would need string parsing.

TOP IMPROVEMENTS (max 3)
1. Make "verified" mean a primary source: a list of SEC and filer-own domains. Mark news domains, and any edge with "UNVERIFIED" in its type, description or position, as "reported".
2. Count exempt solicitations from `proposals.exempt_solicitations` grouped by filer, or from distinct edge `source_url`s. Drop the "linked policy events" action until such edges exist. Group recurrence by `topic`, or say it is 1.
3. Replace "Average support: x%" with the list or range of `support_pct` values, each linked to its 8-K `results_url`.

OUT-OF-FIELD NOTES (max 3, one line each)
- Topic labels differ between files: graph "Social & economic impacts" vs upcoming "Social and economic impacts".
- 13 of 49 filers have a `works at` person and 18 orgs have more than one, so "Contact lead: {person}" needs a selection rule.
- "Contact lead" may suggest the site supplies contact details; "Public profile: {person}" is safer.

CONTENT RULES: FAIL
- Never claim 5: "Average support: x%" (plan line 40) is a computed number that no cited filing states.
- Never claim 1–2: PASS as planned. The guard at line 42 is sound. Two cautions:
  - Keep upcoming.json `board_rec` ("Against") out of the actions.
  - Consider "Vote held at the {meeting} AGM" over the imperative "Vote at…" in the Individual investor lens, so it can't read as a nudge.

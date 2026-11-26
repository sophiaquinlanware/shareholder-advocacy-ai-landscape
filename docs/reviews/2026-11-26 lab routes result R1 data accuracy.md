# Lab routes result, review R1: data accuracy and wording

Reviewer: subagent, 2026-11-26. Saved verbatim.

**Score: 76/100 (just short of PASS).** Most R1 data findings were addressed:
- The filer join uses only filing edges, matched on the graph `company` field (R1 #4).
- "Deadline passed" and "none on record" are now separate (#3).
- Foreign listings show their actual route text, and companies with no record show "not tracked here" (#1).
- Equity at strength 3 is labelled "Major shareholder", and "Owner" means parent company only (#6).
- The order used when a company has several ties is written down (#7).
- Strength is labelled as the site's rating (#8).
- Unmapped proposals appear under "Other AI proposals here" (#9).
- Votes with no results link fall back to the proxy plus "results source pending" (#10).
- Tie text marked reported or unverified keeps a flag (#11).
- The ANT line is added (#12).
- "Companies by number of filers" replaces the old ranking line (#13).

All ask ids exist in asks.json, all 74 ties have a `source_url`, and the counts I checked against the data match. One bug shows on the default view.

1. **Wrong self-listing line for unlisted labs (default view).** In `selectLab`, `self` matches by name, and companies.json has records for OpenAI, Mistral AI, Cohere and Reflection AI with `ticker: null`. OpenAI is the first lab shown, so the page opens with "OpenAI is listed itself (): source pending". Reflection would read "listed itself (): private". That is a false fact. *Fix:* require `self.ticker` and `self.shareholder_route === "US proxy rules apply"` (or any non-private route) before showing the line.

2. **The dual-class flag can be missed.** `isDual` reads only `support_note`. Five GOOGL/META voted proposals have no note and no `results_url`: googl-2023-audit-committee-review, googl-2024-child-online-safety, meta-2023-community-standards, meta-2025-child-safety and meta-2026-child-safety-pay. If one of these is the latest vote for a group, its figure shows with no dual-class flag. *Fix:* flag at company level (any proposal at that ticker with a dual-class note, or a field in companies.json).

3. **"none filed" can contradict the same row.** `cellSupport` returns "none filed" when no related ask has proposals, even when "Other AI proposals here" lists some. Tesla, for example, has tsla-2025-7. *Fix:* say "none under related asks".

4. **A filer's name links to only one source.** `cellFilers` links each name to the first proposal's edge source, but a filer may have filed several proposals at that company. *Fix:* add the count ("(3)") or label the link "source, first filing".

5. **Lab-level URL caveats are not carried over.** Gaps 4, 5 and 8 flag weak URLs for the msl, msai and amazon-agi lab nodes and the Apple–OpenAI 2024 tie. The table shows those links as plain `[source]`. *Fix:* mark them "URL to recheck", or link the row to the gap entry.

6. **Wording.**
   - The intro says "the filers already active at each company". *Fix:* "filers on record at each company" (R1 #13 asked for neutral wording).
   - The note says "a board or committee seat" for the `board seat or observer` type. *Fix:* "a board seat or observer role".

7. **Scope label.** "meetings from 2023" is correct: proposals.json covers 2023–2026. "No AI proposals filed here yet" keeps the qualifier "in this site's records", as the owner asked. SpaceX shows this line, which is correct, since SPCX is under US proxy rules with no proposals and no deadline.

8. **The tests do not cover the false self-line.** *Fix:* with OpenAI selected, assert `#pw-lab-about` does not contain "listed itself".

Fix 1 and 2 to reach PASS. The rest is polish.

# Lab routes plan, review R1: data accuracy and wording

Reviewer: subagent, 2026-11-26. Saved verbatim.

**Score: 64/100.** The structure is sound and every tie has a `source_url`. Most problems are joins the plan misstates and labels that read as stronger claims than the data supports.

1. **Wrong count of companies with no rights record.** Exactly five have none: MU, SNOW, ASML, INTC and DELL. The non-US listings (9984, 005930, 000660, NBIS, TSM) do have records, with `shareholder_route` "listed outside the US" or "US-listed foreign issuer". They have no deadline. *Fix:* restate the count. Show their actual route text, and "none on record" for the deadline.

2. **TSM, INTC and DELL have no ties at all.** Gap 3 explains they were left out. They will never appear in any routes table, and their bars would read 0. *Fix:* leave them out of "Labs reached", or list them as "no sourced tie (see gaps)".

3. **`deadlineInfo` returns null for both "passed" and "missing".** *Fix:* test whether `next_proposal_deadline` exists before calling it. Null with a date means "passed"; no date means "none on record". SPCX and the foreign listings have no date.

4. **Filers would include exempt solicitations.** 55 of the 171 investor→proposal edges are `exempt solicitation`. Some are opposition, e.g. NLPC with 6. *Fix:* count only `lead filer`, `co-filer` and `filed (named in proxy)`. Join by the graph node's `company` field, not proposal id. Only 24 of 76 graph proposal ids match `proposals.json` ids.

5. **"No AI proposals filed here yet" overclaims (Never claim 9).** Proposals cover only 29 US-proxy companies. ORCL, CRM, AMD, AVGO, CRWV and SPCX have zero in the data. Untracked and foreign companies were never searched. *Fix:* "None in this site's records (tracked since 2023)". For untracked companies, say "not tracked here". Drop the bold.

6. **"Owner" is the wrong label.** Equity stakes rated strength 3 include Amazon→OpenAI, Nvidia→OpenAI, Nvidia→Reflection and Google→Anthropic. None of those makes the company an owner. *Fix:* rename the group to "Major shareholder (this site's rating)". Keep "Owner" for `parent company` only.

7. **No precedence rule when one company has several tie types to the same lab.** This happens for 14 company–lab pairs; MSFT→OpenAI has equity, cloud and revenue share. MSFT's revenue-share tie would also put it in "Customer". *Fix:* state the order (parent > board seat > equity 3 > compute > chips > equity 1–2 > customer). Show every type, and merge the related asks across them.

8. **Strength is unlabelled.** The 1–3 strength is this site's judgement, not a disclosed figure. Sorting by it ranks the routes. *Fix:* label it "Strength (this site's rating)" and say so in the note under the table.

9. **Related-asks mapping misses things.**
   - The Customer group omits targeted ads, workers, and oil and gas.
   - `tsla-2025-7` ("Board Authorization of an Investment in xAI") has no `ask_id`. It is the most direct xAI-related proposal, yet the mapping would drop it.

   *Fix:* list unmapped proposals separately as "other AI proposals here". Label the whole mapping as "this site's grouping".

10. **"Past support" can show an unsourced or misleading figure.**
    - Six voted proposals have no `results_url`, e.g. `googl-2024-child-online-safety` and `meta-2025-child-safety`.
    - Two floor proposals have null support.
    - The GOOGL and META figures are dual-class.

    *Fix:* fall back to `proxy_url` plus "results source pending". Skip null-support rows. Show the dual-class note next to each such figure.

11. **Flags in the tie text are lost.** 14 tie descriptions say "UNVERIFIED" or "reported". Gaps 4, 5 and 8 also flag weak or unchecked URLs (Google–OpenAI, the Apple–OpenAI 2024 tie, the msai, amazon-agi and msl lab nodes). *Fix:* carry an "unverified/reported" marker into the Tie cell.

12. **Anthropic is itself listed (ANT), and ANT is in `companies.json`.** A "routes to Anthropic" table that leaves out direct holding is incomplete. *Fix:* add a line under the chips, "Anthropic is listed itself (ANT): rights record", linked.

13. **Wording risks.**
    - "Most filers already active" ranks filers, and with mixed-sign filers that edges toward coordination.
    - The prompt's words "leverage" and "can I act there" must not leak into the copy.

    *Fix:* use "Companies by number of filers on record". Keep the footer line on this page.

14. **The finding lists repeat the table with no added source.** *Fix:* make each company name in them link to its table row.

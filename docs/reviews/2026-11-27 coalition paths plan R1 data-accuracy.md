# Coalition paths plan, round 1: data accuracy

**Score: 66/100. Verdict: REVISE.**

The plan's counts check out:
- 102 `member of` edges;
- 12 coalition-to-proposal records, 8 of them with a filer who is a member;
- 4 engagements;
- co-filing derived at build_graph.py:132–138.

At Microsoft's 2025 human rights due diligence proposal, the only ICCR member among the filers is NorthStar.

## Top failures

1. **The fund-vote figures are wrong.**
   - There are 9 families and 414 rows, not 414 families.
   - Joining on `sec_id` alone drops 90 rows. The join should be by graph id, else `sec_id`.
   - SPLIT (90), ABSTAIN (13) and NEEDS_CHECK (6) have no line style.
   - Only 39 of the 414 rows are reviewed, and the plan doesn't label the others.
2. **The stage map is incomplete.**
   - Plain `exempt solicitation` (79 edges) and five free-text variants have no stage.
   - So do `filed (named in proxy)`, `filing representative`, holdings, `proposal at` and the company–lab ties.
   - Stage 6 has nothing to attach to: `led to` and `responded to` link only events to events, and `acted in` is a fuzzy name match (line 191).
3. **The routing rule can imply joint work.**
   - A company-level record would route unrelated filings through the coalition.
   - There is no check that membership predates the filing. 47 memberships have no date, and 53 are dated from one 2024 page.

## Top improvements

1. Route a filer only through a record that names the proposal, or names the company with a topic and year that match it. Require the membership to be dated before the filing.
2. Give every edge type an activity or an explicit "none". Have the test fail on any unmapped type. Drop stage 6.
3. Fix the vote text, join and labels.

The §3 sources are plausible primary sources, but the reviewer did not open them.

## What was done

Revision 1 of the plan addresses each point. The table at the end of the plan lists the changes.

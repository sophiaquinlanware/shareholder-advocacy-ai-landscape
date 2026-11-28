# Stakeholder map plan, round 1: data accuracy and claims

Score: 66/100, REVISE.

## Top failures

1. **Duplicates.** The plan only removed duplicates against response events. But Seoul and Paris already exist as government policy events. The EU code signatures exist as one event per lab. The 9 commitments in campaigns.json overlap batch C. There was no field to point a tie at an existing event of another type.
2. **"addresses the same issue as" broke the sourcing rule.** No field marked these ties as the site's own links. Researched ties also carried no "not yet reviewed" status (Never claim 4).
3. **Signatures.** A person's listed affiliation could have been turned into an organization-level signature (Never claim 3 and 6). There was no rule for anonymous signers or for when the signatory list was read.

## Top improvements

1. Let ties point at any existing event. Remove duplicates against commitments and the EU code events. Fix the field-name slips.
2. Add `basis` and `review_status` to every tie, and require `signatories_as_of`. Only allow an organization-level `signed` when the organization itself is listed. Narrow the wording of partnership and critique relations.
3. Keep stakeholder memberships out of the investors layer. Say whether new responses get the fuzzy "acted in" edges. Cap the university scope and raise the spot check.

## What was done

Revision 1 of the plan addresses every point; see the plan's "Revision 1" section. All four researchers got the rule changes while they were still working.

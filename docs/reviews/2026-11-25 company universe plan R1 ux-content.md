REVIEWER: UX / content SCORE: 66 VERDICT: REVISE

TOP FAILURES
1. **The design is wrong: "US-listed" overstates where shareholder routes apply.** The plan (line 25) adds `investor_access` "so readers can see where shareholder routes apply." But Alibaba (claude-cu.json:838), TSMC (:1067) and Nebius (:1134, which files 6-Ks) appear to be foreign private issuers, and those are exempt from US proxy rules (Rule 14a-8 included). Tagging them "US-listed" would tell practitioners a filing route exists when it likely doesn't. Separately, none of the 60 records has an `investor_access` value yet (all null), so who assigns it, and on what rule, is unspecified.
2. **The design is wrong: the field name and the sector labels mislead.** `engagement_basis` reads as "investors engaged this company." About 25 entries rest only on a safety commitment (e.g. :200, "Signatory of the Frontier AI Safety Commitments"), with no investor engagement at all. "Frontier lab" covers 33 of 60, including Samsung, Adobe, ServiceNow and IBM, so the filter stops meaning anything. The rule for leaving companies out is also inconsistent: Lyft (:1203) is excluded as "an AI user, outside the four sectors," while Netflix, Disney, Warner Bros. Discovery and Comcast (:906 on) are tagged "consumer AI" for the same kind of use. Southern Company (:1173), a utility, is tagged "data centers & compute."
3. **The build doesn't follow the plan's own tone: sentences are uneven and some are loaded.** "Target of repeated AI shareholder proposals" (:16) implies adversarial targeting. "Standout" (:800, :815) has no stated direction: it's unclear whether Motorola is a standout on risk or on safeguards, so it reads as this site's judgement. Grammar varies between fragments ("Signatory of…"), "Added as…" and full sentences. Votes cite % support for Netflix but not Apple or Meta. Separately, the plan title (line 1, "the companies to influence") and the owner quote ("relevant to target") would breach Never claim 1/2 if they reach page copy.

TOP IMPROVEMENTS
1. Replace `investor_access` with an explicit route field ("US proxy rules apply" / "US-listed, foreign private issuer" / "listed outside the US" / "private, no public shareholders"), each value with a source.
2. Rename the field to `why_listed` and add a `basis_type` (proposal / investor engagement / safety commitment / compute deal) so readers can filter by type. Limit "frontier lab" to companies that train their own frontier models.
3. Write every sentence on one template: "[Year] [event] ([filer/source])." Drop "target" and "standout", and give vote % for all proposals or for none.

OUT-OF-FIELD NOTES
- Anthropic is shown as Nasdaq "ANT" with a CIK (:190-193). This is unverified here; the data reviewer should confirm.
- Six company bases cite Parnassus. Phrasing like "pressing for" (:134) needs source wording so it doesn't read as the site speaking for Parnassus.
- The plan has no requirement for page copy explaining why private and Chinese companies are listed. The UI session needs a sourced explainer line.

CONTENT RULES: FAIL. Wording that implies judgement: "Target of" (:16) and "standout" (:800, :815). The "influence/target" framing in plan lines 1 and 5 risks breaching Never claim 1/2 if it surfaces. "US-listed" for foreign private issuers claims shareholder access the filings don't support (Never claim 4).

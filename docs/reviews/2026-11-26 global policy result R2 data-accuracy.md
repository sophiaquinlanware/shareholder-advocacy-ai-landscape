REVIEWER: Data accuracy SCORE: 86 VERDICT: PASS

Round 2 re-checks only the 15 fixes from R1, using the current data/causality.json and data/coverage.json.

Fixes 1 to 14 match their sources:
- `ftc-take-it-down-enforcement`: now matches the FTC release of May 20, 2026 (12 nudify-tool operators; reminder letters to 15 platforms).
- `in-it-rules-sgi` and its coverage row: now split the duty correctly, matching BusinessToday. Social media intermediaries handle declarations; intermediaries that enable AI content handle labels and metadata.
- `uk-crime-policing-act-ai`: matches legislation.gov.uk (s.72 prospective; s.248 in force at Royal Assent).
- `uk-ofcom-x-grok-investigation`: the wording is now accurate.
- `intl-ai-safety-report-2026`: the official source loads (200). "12 companies" matches the report.
- The link from `ie-dpc-meta-pause` to the EDPB opinion: the EDPB page says the opinion "was requested by the Irish Data Protection Authority".
- `ca-bill-c36`: matches canada.ca (June 15, PPCDA, the named Commission).
- The CSDDD, DSA and EO 14365 wording is accurate. SoftBank Corp. is added. Bletchley is now Global.

Every coverage policy_status equals its event status. Both files parse as JSON. The diff has no em or en dashes, no "genuinely" and no "real".

TOP FAILURES
1. `eu-dc-rating-scheme`: the status now says "scrutiny period ended, entry into force not confirmed". The summary still says "It is in a two-month scrutiny period by Parliament and Council before entering into force". The two contradict each other.
2. `eu-dsa-meta-minors-findings`: "and call Meta's risk assessment incomplete" is not on the cited Commission page. The page says Meta failed to "diligently identify, assess and mitigate the risks" of under-13s accessing the services.

TOP IMPROVEMENTS
1. `ca-bill-c34`: canada.ca says chatbot services must "be transparent about their reporting thresholds in crisis situations". That is weaker than "keep crisis protocols". Mirror the source wording.
2. `intl-ai-safety-report-2026`: deep-link to the 2026 report page or PDF instead of the site homepage. The homepage does not itself carry the "12 companies" figure.
3. `in-it-rules-sgi`: replace the news source with the official gazette notification or MeitY page when one can be found.

OUT-OF-FIELD NOTES
1. The China coverage rows in this diff were outside the brief and remain unreviewed.

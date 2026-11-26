REVIEWER: UX / content SCORE: 86 VERDICT: PASS

Round 2 (77a965c). TOP FAILURES (none blocking): 1. The Active here summary prints the cap as a count ("12 filers (the 12 most active)"; active_filers is cut to 12 in build_value_chain.py:174). 2. "The 12 most recent of N" is approximate when more than 12 asks share the latest year (sorted newest year first, then by company). 3. Two-step routes use raw tie types; two route types ("listed outside the US", "not determined") have no grammar mapping.

TOP IMPROVEMENTS: 1. The three-line summary answers the owner's three parts; the outcomes-not-in-data line is honest. 2. Plain-text fixes confirmed (no file names, plain ties note, no placeholder, sentence tie phrases, short phone headers, exact people count, own fund-votes section). 3. List view company names are buttons.

OUT-OF-FIELD NOTES: confirm the fund-family wording against fund_votes.json; screenshots not regenerated; sticky tab bar over the chart in R1 screenshots.

CONTENT RULES: PASS. No target/influence/advice/vote wording; median labelled computed by this site; overlap warning and Not a recommendation present; false (up to 20) gone; lists point to their sources in Contacts and the Co-filer network; zero cells plain; Open in Company lookup only where covered. The 12 filers count is a wording slip.

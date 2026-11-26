REVIEWER: UX / content and accessibility SCORE: 83 VERDICT: PASS

This round re-checks only what failed in R1 (commit 274dcb6, screenshots of 00:17–00:18).

R1 failures, re-checked
- Site name: resolved. Commit 78b0efd ("Owner requests, 2026-11-26") and DESIGN.md:88 record the owner's choice of "Shareholder advocacy on AI". AGENTS.md rule 8 still names the old site name, and it should be updated so later reviewers don't flag this again.
- Filing deadline: fixed. The Microsoft profile shows "Next filing deadline June 24, 2027 [proxy]" (desktop company.png).
- Cisco: half fixed. Overview now lists "Cisco Systems votes on 1 AI proposal: December 15, 2026" (desktop start.png). But "All upcoming votes" still opens a table that says "3 AI proposals on 1 ballot" with no Cisco (desktop upcoming.png). The CSCO meeting is in data/upcoming.json in the working tree only and is not committed.
- Focus after in-page links: fixed for every view except Policy. showTab(name, true) focuses only a view tab (`[role="tab"][data-tab]`). #grp-policy has none, so the "Policy" link under "How this site is organized" (href="#causality") still hides the focused link and drops focus to the page body (app.js showTab; WCAG 2.4.3).
- Old names: fixed in the visible text. Two leftovers are announced by screen readers only: graph.js:1020 "Topics not filed shown: n nodes" and graph.js:1509 "… nodes shown", plus votes.js:150 aria-label "Fund votes table".
- Labels: fixed. The map columns read "CONSUMER PRODUCTS" and "BUSINESS AND GOVERNMENT" as separate columns, and the network intro uses plain words. Explaining why the combined tier chip is named "Consumer and business products" is acceptable.
- Recommended items: section questions now match their views; the Overview links name their company ("AMD profile") and the "See the data" links have descriptive aria-labels; the phone section bar is one row whose cut-off fourth label ("PROPO…") hints that it scrolls; the "Coming up" labels sit on their own line on phones.

TOP FAILURES (max 3, each with evidence)
1. Upcoming votes and Overview still disagree until the Cisco row in data/upcoming.json is committed (desktop upcoming.png: "3 AI proposals on 1 ballot").
2. Focus is lost when a link opens Policy (#causality), the only view without a view tab (app.js showTab).

TOP IMPROVEMENTS (max 3)
1. Finding 3 still says "on the Policy map", but its own note now points to the Network's Policymaker view. Use one place in the text.
2. "This week and next" heads a list that runs to December 15, three weeks out. "Coming up" or "Next few weeks" would be accurate.
3. Replace "nodes" and "Fund votes table" in the screen-reader-only strings (graph.js:1020, :1509; votes.js:150).

OUT-OF-FIELD NOTES (max 3, one line each)
- Timeline dots still overlap the first letter of each entry on New SEC filings (from R1; not re-checked).
- AGENTS.md rule 8 should name "Shareholder advocacy on AI".

CONTENT RULES: PASS (the site-name change is an owner decision, recorded in 78b0efd and DESIGN.md:88)

REVIEWER: UX / content and accessibility SCORE: 70 VERDICT: REVISE

TOP FAILURES (max 3, each with evidence)
1. Views contradict each other on what an analyst can act on. All proposals shows 4 upcoming, including Cisco on Dec 15, 2026 (data/proposals.json; de-feed screenshot). Upcoming votes says "3 AI proposals on 1 ballot" and Start here's "Coming up" leaves Cisco out, because data/upcoming.json has no CSCO meeting. Start here also says "15 more open filing deadlines are on each company's profile", and the profile intro promises a "filing deadline", but drawCompany (app.js ~248-290) never renders `next_proposal_deadline`. Microsoft's 2027-06-24 deadline appears only in Routes to a lab. These are build faults: the design is right.
2. Old view names and internal terms survive in text a visitor sees. "Proposal route (rights map)" (app.js:268); "Open in Proposals with filters" (app.js:275); "check the rights map" (data/changes.json:21, shown on Start here and New SEC filings); "Open in Company lookup" (valuechain.js:178, pathways.js:397, lenses.js:85); "Proposals tab" (pathways.js:110); "see Fund votes" (valuechain.js:159); "tier details" (valuechain.js:99); "470 of 792 nodes", "Select a node", "Show topics not filed" (network screenshot). Role labels still conflict: the value-chain chips and table say "Consumer and business products", but the map header reads "CONSUMER PRODUCTS BUSINESS AND GOVERNMENT PRODUCTS" as one run-on label, and the profile says "consumer products, business and government products".
3. Activating an in-page link loses keyboard focus. "All upcoming votes", "All new filings", "See the data" and the section links on Overview set the hash. The hashchange handler calls `showTab(name)` with no focus (app.js:338), so the link that had focus is hidden and focus drops to `<body>` (WCAG 2.4.3).

TOP IMPROVEMENTS (max 3)
1. Make each section question match what its views show. Value chain asks "where does the risk sit", but the views show ties and engagement. Policy promises "how far they cover what investors ask", but coverage per ask lives only in the Network's Policymaker view (graph.js:1360), and finding 3 points to the Policy map for it.
2. Cut repetition on Overview. The h2 "Overview" repeats the selected pill. The "New SEC filings" list repeats 5 of the 8 rows in the next view. "How this site is organized" repeats the section bar and its questions. Finding 1 is also repeated in the Proposals note. "Detail by company" cards under Compare proposal rights repeat the profile's Proposal rights block.
3. Phone (390 px): the section bar wraps to 3 rows and the view pills to 2, so content starts about 530 px down. The `.coming-up .kind` min-width of 9.5em leaves a wide gap after "VOTE". The 8 identical "Company profile" buttons and 3 identical "See the data" links need distinct names.

Accessibility checks that pass: role="tab"/tablist/tabpanel, aria-selected, aria-controls and roving tabindex on both levels; arrow keys, Home and End on both rows; visible focus outlines (styles.css:85, :489); heading order h1 > h2 > h3 > h4; the lone #tab-causality is safely inside the labelled #grp-policy tabpanel.

OUT-OF-FIELD NOTES (max 3, one line each)
- Timeline dots overlap the first letter of each entry on New SEC filings (new.png): visual design.
- "None of the 78 AI proposals at these 29 companies" sits under a header saying 60 companies; "these 29" is undefined: data accuracy.
- "NVIDIA" (Engagement outcomes) vs "Nvidia" elsewhere.

CONTENT RULES: FAIL. Rule 8: the site name "Shareholder Advocacy AI Landscape" has been removed from `<title>`, the h1 and the sticky bar (index.html:6, 18, 30), which now say "Shareholder advocacy on AI". No owner decision is recorded for the change.

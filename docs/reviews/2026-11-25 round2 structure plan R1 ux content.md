REVIEWER: UX / content SCORE: 76 VERDICT: REVISE

TOP FAILURES
1. **Design is wrong: the "show in network" button would go to a hidden node.** The plan hides people in the network by default (plan:40). It also keeps a "show in network" button on every People row (plan:47). Today that button calls `focusNetworkNode` (app.js:21-31), and graph.js:176 drops any node whose kind is hidden. So by default the button switches tabs and shows nothing, which breaks the owner's rule: "If a button is on the demo, then it has a purpose." The plan needs a rule: focusing a hidden node turns its layer on first.
2. **Design is wrong: the header change contradicts PRODUCT.md, and the plan never says so.** PRODUCT.md "First ten seconds" fixes the h1 as "A shared map of investor engagement on AI" plus the lede ending "Every fact links to its source." The plan (line 69) replaces both with one line of scope. Task 11 updates only DESIGN.md and STATE.md, and PRODUCT.md is the owner's file. The plan should ask the owner before the header changes, not after.
3. **Design gap: "copy cut" is never itemised, so the build can't be checked against it.** Tasks 5-9 say only "copy cut". The plan never names these lines that break its own wording rules:
   - pathways.js:63-64: two question/teaser labels, "Reach a lab: who has leverage over it?" and "Plan an engagement: …"
   - pathways.js:61: a paragraph explaining why labs are private
   - graph.js:102 and causality.js:135: how-to-read explainers
   - scorecard.js:66: a three-sentence framework explainer
   The reviewer of the result needs a before → after list for every heading and intro.

TOP IMPROVEMENTS
1. Name the first tab "Upcoming votes", or put that table first under a plain label. "Overview" doesn't tell a practitioner where the next ballots are.
2. Proposals: decide which comes first, the chart or the table. The plan calls the table "primary" but puts the dot plot above it (plan:37). The current feed is about 6,700 px tall at 1440 (desktop-light/feed.png). Put the count line and filters above the table, and let a sort or filter reach withdrawn and excluded rows in one click.
3. Pathways: replace the side-panel prompt "Pick a lab or a set of companies above…" (pathways.js:69) with the always-visible tie table showing all ties when nothing is selected. The ties then read without any click (desktop-light/pathways.png shows an empty panel).

OUT-OF-FIELD NOTES
- The example method line "Support = for ÷ (for + against)" (plan:67) has to match how `support_pct` was computed. The current copy says "share of votes cast" (app.js:170). Unverified: data accuracy should check it.
- Proposal topics are 4 in app.js:154-158 but "3" in the plan audit (plan:37). Recheck against the data.
- The network legend still lists 15 types once the hidden layers are added back. That's for visual and accessibility review.

CONTENT RULES: FAIL
- The rules themselves are right: plain labels, at most one scope/method line, legal lines kept.
- The plan breaks PRODUCT.md (header) without flagging it.
- It leaves question-style labels (pathways.js:63-64) and explainer intros (graph.js:102, causality.js:135, scorecard.js:66, pathways.js:61) cut only by an unspecified "copy cut".

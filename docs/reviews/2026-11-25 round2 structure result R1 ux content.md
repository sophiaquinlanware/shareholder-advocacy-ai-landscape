REVIEWER: UX / content SCORE: 74 VERDICT: REVISE

TOP FAILURES
1. **Build: the "New filings" tab can't be seen at 1440.** The row has 11 tabs inside a 1200px wrap. The overflow is set to `overflow-x: auto; scrollbar-width: none` with the scrollbar hidden (styles.css:46-47). desktop-light/upcoming.png and network.png end at "Disclosure scorecard", and nothing hints that another tab exists. A first-time visitor can't find this task.
2. **Design gap: the Fund votes tab was left out of the wording rules.** The plan calls it "unchanged from main", but it breaks DESIGN named rules 5 and 6:
   - votes.js:99 has a hard-coded range, "from July 2023 to June 2026".
   - votes.js:99 also explains N-PX: "Every U.S. mutual fund and ETF reports its votes…".
   - votes.js:115 is a UI instruction: "The table scrolls sideways…".
   - votes.js:117 is a 4-sentence method explainer.
   Every other tab is held to one line.
3. **Design: the Proposals table got longer, not more scannable.** 27 proposals repeat the same five-line note, "Not stated in the 8-K. Counts are votes cast under dual-class voting…" (`grep -c` data/proposals.json; the rendered note comes from app.js:320). The feed is now 8,206px tall at 1440 (desktop-light/feed.png), up from about 6,700 at plan review. It is 10,712px on a phone. The company history table on a phone also leaves rows mostly empty and clips the Status column (company-after-phone.png). Show each note once per company and basis, as a footnote marker.

My plan-review failures are resolved:
- "Show in network" now switches the hidden layer on first (graph.js:281-286).
- PRODUCT.md records the header approval.
- The copy table exists, and its rows are built (h1, lede, Policy timeline, Upcoming, Feed, New, Pathways "Labs"/"Companies", Causality, Scorecard, water tab removed).

Small deviations from the table:
- People adds an intro sentence instead of a count line only (app.js:497).
- The Network line adds a how-to clause (graph.js:240).

TOP IMPROVEMENTS
1. Match each tab label to the heading it opens:
   - "Contacts" opens "People" (app.js:496).
   - "Co-filer network" opens "Network" (graph.js:208).
   - "Lab pathways" opens "Pathways" (pathways.js:61).
2. Network default view (desktop-light/network.png):
   - Filer labels overlap and can't be read.
   - Nodes on the right edge are cut off ("ASML Hold", "TSM").
   - The People column is empty but still takes space.
   - The plan said "top 12 filers" get labels, but `labelMin: 0` is the default (graph.js:103).
3. The empty-data fallbacks still use the old names "Causality map" (causality.js:147) and "Influence pathways" (pathways.js:224).

OUT-OF-FIELD NOTES
- The header says "7 companies", while Pathways says "24 public companies" and the network shows about 30. Data accuracy should settle which count the header shows.
- The Upcoming "AI votes at company" column shows "high 36.19%" next to "median 21.2%", which mixes precision (upcoming.png).
- Unverified: whether Upcoming company links for tickers missing from companies.json open a real entry (app.js:147).

CONTENT RULES: FAIL
- Fund votes (votes.js:99, 115, 117) has a hard-coded date range, a definition of N-PX and explainer paragraphs.
- Upcoming's intro defines a column (app.js:102).
- Every other tab passes: plain labels, one line each, legal lines kept.

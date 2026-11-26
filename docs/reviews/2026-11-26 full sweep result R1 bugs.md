REVIEWER: Bugs SCORE: 74 VERDICT: REVISE
(I drove all 15 views at 1440 and 390 px with Playwright and Chrome. No JS errors, no failed requests, no sideways page scroll, and no "undefined", "NaN" or "[object Object]" text anywhere. Counts match `data/*.json`: 79 proposals, 60 companies, 29 rights, 257 people, 9 families, 195 events. Another session was editing app.js, planner.js, votes.js, causality.js and scorecard.js uncommitted while I worked, so line numbers may shift a little.)

TOP FAILURES
1. **Quick search opens the wrong company for 19 of the 60 companies.** These are the ones with no ticker: OpenAI, Mistral, Cohere, DeepSeek, Warner Bros. Discovery and others. Cmd+K → "OpenAI" → choose the Company result. The site goes to `#company` but shows Microsoft (MSFT), the company already selected; "Warner" does the same. Cause: quicksearch.js:24 falls back to `showTab("company")` when `c.ticker` is empty, without selecting the company. `openCompany` is keyed by ticker, so it needs to look up by `c.id` instead.
2. **The Proposals chart ignores a company filter set from Company profiles.** Company profiles → Microsoft → "See these in All proposals". The table says "Showing 14 proposals of 79", but the chart and its key still say "65 voted proposals plotted" with every company's dots. Cause: app.js:435 `redraw()` skips `drawChart` while the panel is hidden, and the `once()` observer at app.js:452 never redraws because `dataset.drawn` is already set.
3. **Laws and rules keeps a stale event panel after filtering or "Show everything".** Select an event (List view → Show on map), then pick a region or press "Show everything". The side panel still describes the old event, which may now be filtered out. "Causes only" then re-highlights that hidden event and dims 22 of the 23 visible nodes. Cause: causality.js redraw and reset (~:265 and :278) clear `C.highlight` but never `#cz-panel`, and redraw leaves `C.selected` set.

TOP IMPROVEMENTS
1. Give "Copy a link to this plan" visible feedback. `#pl-status` is visually hidden (planner.js:395 and :403), so sighted users get no confirmation. If the clipboard is blocked, the fallback link text is invisible too.
2. Scorecard cells: after Enter or click, `draw()` rebuilds the matrix and keyboard focus drops to BODY (scorecard.js:36 and `select()`). Refocus the same `.sc-cell`, the way `wireSort` does for sort buttons.
3. Phones (390 px): the scorecard pillar buttons are cut off. "Workforce" is clipped at x=433 inside `.seg`, which has `overflow:hidden` (scorecard.js:70 plus the CSS). Let the row wrap or scroll.

OUT-OF-FIELD NOTES
- `data/companies.json`: warner-bros-discovery has no ticker and no shareholder_route, though WBD is listed.
- Network: the intro says "375 of 906 … shown" but the lens status says "164 of 918 nodes". The two totals differ, probably because one counts the ask-gap nodes.
- On phones, card tables hide `thead`, so the Proposals, Rights and People sort controls can't be used.

CONTENT RULES: FAIL — How fund families voted, pass-through section: a raw developer phrase is shown to visitors ("offered is null when no program was found…"). It comes from `pass_through_voting.json` `about`, printed verbatim at votes.js:112.

FULL FINDINGS
- Quick search | Cmd+K, "OpenAI" or "Warner", choose the Company result | that company's profile | the previously selected company (Microsoft) | quicksearch.js:24
- Proposals chart | Company profiles → Microsoft → "See these in All proposals" | chart and key show 11 MSFT votes | all 65 dots, key says 65 | app.js:435, app.js:452
- Laws and rules | select an event, then change region or press "Show everything" | panel cleared | old event panel stays; the mode buttons re-trace a hidden event | causality.js ~:265 redraw, :278 reset
- Scorecard | Tab to a cell, press Enter | focus stays on the cell | focus goes to BODY | scorecard.js:36, :50
- Scorecard (390) | open `#parnassus` | all four pillar buttons visible | "Workforce" clipped | scorecard.js:70 plus `.seg` CSS
- Planner | Copy link with clipboard blocked, or any copy | visible "Link copied" or a visible URL | message only in visually hidden `#pl-status` | planner.js:395, :403
- Planner | open `?plan=%E0%A4%A#planner` | planner falls back to defaults | `decodeURIComponent` throws and the planner never renders (blank) | planner.js:376
- Planner | open `?plan=MSFT~x#planner` (ticker instead of id) | Microsoft selected | Company select shows blank and no grid square is current; `S.co` is kept as "MSFT" while option values are ids | planner.js:377–380 (should normalise to `c.id`)
- Planner, Key dates, Company profile | US evening (after 16:00 PT) on a deadline day | deadline still open | `today()` uses the UTC date, so it shows "(passed)" or drops a day early | planner.js:16, app.js:608, app.js:272 (new uncommitted line)
- How fund families voted | pick a company and topic leaving 1 row | "on 1 AI-related shareholder proposal" | "on 1 … proposals" | votes.js:99
- How fund families voted | read the pass-through intro | plain language | shows the raw field name "offered is null" | votes.js:112 / `data/pass_through_voting.json` `about`
- Upcoming ballots | after Dec 3 or 8, before the next data refresh | past meetings drop off, as on Key dates | `renderUpcoming` has no date filter, so the two views disagree | app.js:85
- Navigation | click section or view tabs, then browser Back | previous view | Back skips every tab-click view, because `replaceState` is used | app.js:698 (design choice? flag to owner)
- Network | lens Policymaker vs intro | one node total | 918 vs 906 | graph.js lens status vs intro count

I found no wrong support % between Proposals, Company profiles and the planner rows; all read `support_pct`. Planner selects, grid arrow keys, idea links, show-all, shortlist and CSV all worked. Shared `?plan=` links, path finder, lens switch, people search, rights sorts, Lab pathways (all 13 labs and the company checkboxes), the value chain panel and in-page back/forward also worked.

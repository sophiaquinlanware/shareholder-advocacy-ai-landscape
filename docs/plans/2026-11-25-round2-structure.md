# Plan: round 2, structure and wording

Date: 2026-11-25. Branch: `design/round2-structure` (from `main` at 6a5ed55). Owner: Sophia Ware. Round 1 (colour and type) is live. See docs/plans/2026-11-25-blue-green-restyle.md.

## The owner's words

> "Start round 2"

> "I don't want any models or visuals that are purely aesthetic … Only have visuals or graphs or models of data when they're functional and able to be adapted to new data coming in. I want, overall, the aesthetic to be simple and readable, and where you can make comprehensive relational datasets turned into visuals, do that."

> "For all the visuals that you make or the models that you make, use your best judgment on what the best type of visual is. Assume you're an expert data scientist. You're looking at all the data and figuring out which visual will most accurately help people understand how everything's related to the other."

> "Assume that this platform is going to be accessed by shareholders who are engaging in shareholder advocacy, so you don't need to baby them with terminology … you don't need to give any definitions or terms or anything like that. It's just simple data matching."

> "Things like '14 months that change the ballot' are not a helpful way to describe data. Again, this is a tool for people to use. It doesn't have to be some catchy subheaded news AI jargon slop … don't say 'four channels that will stay open.'"

> "I want you to have all proposals, including ones that are withdrawn. For the ones that are withdrawn, make a note that they are, so that people … can see which ones were withdrawn and for what reason they were."

> "the site needs to be completely usable, no random buttons to make it seem more complete … If a button is on the demo, then it has a purpose"

> "Include all the companies that would be relevant to target for increasing responsible AI … consumer AI products, business enterprise AI products, data centers, and frontier labs."

This round changes structure and wording only. Colours, type and tokens stay as round 1 set them, and any new class uses existing tokens.

## Dependencies on the data session (it owns `data/*.json`)

Requested by message on 2026-11-25. The views below read these fields when present and fall back cleanly when they're absent, so nothing has to land in a set order.

- `proposals[].status_reason`, `proposals[].status_source_url`: why a proposal was withdrawn or excluded, sourced. Fallback: "Reason not documented."
- `companies[].sectors` (array; values exactly "consumer AI", "enterprise AI", "data centers & compute", "frontier lab") and `companies[].engagement_basis` (`{ "text", "url" }`: why the company is in scope, sourced). Fallback: ungrouped list, no sector filter. Agreed with the data session on 2026-11-25. Its plan is docs/plans/2026-11-25-company-universe.md on branch `data/company-universe`, and SpaceX (SPCX) is being added. New companies may have sparse rights fields at first, and those show "source pending".
- Status fields arrive on branch `data/proposal-status`. Confirmed with sources: Amazon (excluded: didn't meet the resubmission thresholds; SEC staff didn't object; Minerva, 12 Feb 2026) and Apple (withdrawn; no reason public). Nvidia's filer and reason are not publishable, so they show "Filer not recorded" and "Reason not documented".
- The company list itself is growing from 7 to the full set the owner described. **Every view must work for any number of companies**: no counts, names or "seven" written into code or copy.

## Data audit: each dataset, its shape, and the chart that fits it

| Dataset | Shape (2026-11-25) | Question a practitioner asks | Chart now | Chart this round | Why |
|---|---|---|---|---|---|
| `proposals.json` | 65 proposals; company, meeting date/year, topic (3), status (voted 59, upcoming 3, excluded 2, withdrawn 1), support %, filer, sources | How much support did AI proposals get, where, and is it moving? Which never reached a vote, and why? | Stacked count bars by year × topic, plus a table | **Dot plot: meeting date (x) × support % (y), one dot per voted proposal, coloured by topic, with a 50% reference line.** Proposals that never got a vote sit in a labelled strip under the axis, coloured by status. Clicking a dot or strip mark filters the table. The table is primary and lists all 65 with a status column, and the reason under each withdrawn or excluded row. | Support % is the measured outcome, and counts hide it. A dot per proposal shows distribution and trend (support falling) and keeps every proposal visible. Stacked bars can show neither. |
| `companies.json` (rights) | 7 now, growing; each with route status, state, bylaw rule, threshold, control, director voting, per-lever matrix (3 columns) | Where can I still file, and what blocks me? | Matrix table plus long cards | **Sortable matrix table** (company × levers, status pill plus short note per cell), with a sector filter when `sectors` exists. Cards stay below as the source detail and collapse to `<details>` per company. | Company × criterion is a matrix question; a table compares across rows. Cards are kept as the evidence, collapsed so the matrix reads first. |
| `pathways.json` + `graph.json` filers | 13 labs, 24 public companies, 74 ties (7 tie types, strength 1–3); filers × companies from proposals | Which public companies give me a route to a given lab, and who already files there? | Three-column layered flow (filers → companies → labs) with a side panel | **Keep the layered flow** (it is the right form for a 3-layer bipartite chain). Add an **always-visible tie table** below it (company, lab, tie type, strength, as of, source) that filters with the graph selection. | The flow shows the chain; the table makes every tie readable without a click (accessibility R1 asked for this). |
| `graph.json` | 294 nodes, 9 types; 708 edges | Who files with whom, and on which companies? | Force graph of all 294 nodes, 15 legend entries | **Force graph, default view = filers + companies + coalitions only** (people, policy, response and public are hidden by default and one click away in the legend). Node size = proposals filed (filers) or received (companies). Labels only on companies and the top filers by degree; others on hover and focus. List view stays the text equivalent. | 294 nodes and 15 colours at once can't be read. The filer–company bipartite core is the relational question; the other layers have their own tabs (People, Causality). Fewer colours visible at once also fixes the R2 visual note on colour reuse. |
| `causality.json` | 64 dated events in 5 lanes, 42 typed links, Jan 2023–Nov 2026 | What led to what, and when? | Swimlane timeline with arrows plus a side panel | **Keep the swimlane timeline** (time × actor with directed links is exactly this). Add an **always-visible event table** (date, actor, event, led to / responded to, source), chronological. | Same reason as pathways: the table is the text equivalent and lets people scan without clicking. |
| `site.json` why_now (7 events) | Dated policy events with sources | — | Timeline on the first tab | **Fold into the first tab as "Policy timeline"**, same list, plain label. Not merged into causality this round (different files, different owners); queued. | Plain relabel; the merge is a data decision. |
| `site.json` levers | 4 generic explanations | — | Tiles on the first tab | **Removed.** Explainer copy, which the owner ruled out. Per-company levers stay in the rights map, where they're data. | Audience rule. |
| `upcoming.json` | Meetings with ballot items, topic, board recommendation | What's on the next ballots? | Cards in "How you can weigh in" | **Table on the first tab**: meeting date, company, item, proposal, filer, topic, board recommendation, proxy link. | Moves the only data out of a tab that is otherwise explainers. |
| `voting_paths.json` | 4 retail voting guides | — | Cards | **Removed** from the page (file untouched). Retail guidance for the general public. | Audience rule. |
| `scorecard.json` | 8 companies × 17 criteria, 3 states, evidence per cell | Who discloses what? | Heatmap plus side panel | **Keep the heatmap**; move the evidence panel **below** the matrix so all 17 columns fit (STATE queue 10). | Matrix data; the layout bug is the only problem. |
| `people.json` | 52 people; name, title, org, AI focus, profile link | Who leads engagement at a given filer? | Card grid with search | **Searchable, sortable table** (name, organisation, title, AI focus, profile, "show in network"). | 52 rows of four fields scan faster as a table than as cards. |
| `changes.json`, `tracking.json` | Weekly EDGAR finds (not yet created; STATE queue 1) | What's new this week? | Timeline list | **Keep**, relabel. | Unchanged data. |

## Tabs (11 → 9)

1. **Overview** (was "Why now"): upcoming votes table, then policy timeline.
2. **Proposals** (was "Proposal feed", moved up): dot plot plus full table.
3. **Rights map**
4. **Network** (was "Advocacy network")
5. **Pathways** (was "Influence pathways")
6. **Causality** (was "Causality map")
7. **Disclosure scorecard**
8. **People**
9. **New filings** (was "What's new")

Removed: **How you can weigh in** (its upcoming-votes data moves to Overview) and **Data center water** (a "coming soon" placeholder, which breaks the no-dead-controls rule). The old `#weigh-in` and `#water` hashes fall back to Overview.

## Wording rules for this round

- Headings are plain labels for the data: "Upcoming votes", "Policy timeline", "Rights map". No slogans, questions or teasers.
- Each tab gets at most one line under its heading, stating scope and method, e.g. "65 proposals, Jan 2023 to Dec 2026. Support = for ÷ (for + against)." No definitions of terms (14a-8, exempt solicitation, withdrawn, excluded and so on) and no "why this matters".
- Kept because they're legal or method lines, not explainers: "This site informs. It does not coordinate votes." (footer); "not a legal opinion" (rights map); the scorecard's "Silent = no public disclosure found" (a method line); "not affiliated with Parnassus".
- Header: site name, one line of scope ("AI shareholder proposals, filers, rights and lab ties at {n} companies"), and last-checked date. `{n}` is computed from the data.
- Copy written into JS stays in JS. Copy that comes from `site.json` (`why_intro`, `levers_intro`, `rights_intro`, `status_key`) is no longer rendered where it's explainer text. The data session can delete those keys later; this round doesn't touch `data/`.

## Controls rule

Every button and link does something. The only remaining placeholder state is "not run yet" on New filings, which is true data state, not a control. Inline `style=` attributes in `app.js` move to classes (STATE queue 7).

## Tasks

| # | Task | Owns | Checked by |
|---|---|---|---|
| 1 | Tabs 11 → 9, header copy, hash fallback | `index.html`, `app.js` (setupTabs, main) | build; tests (every tab, no broken links) |
| 2 | Overview: upcoming votes table and policy timeline; levers and voting paths removed | `app.js` | screenshot |
| 3 | Proposals: dot plot (d3) plus table with status and reason, filters for company, topic, status and year, clear filters, count line | `app.js` (feed), `styles.css` | tests; screenshot; data accuracy review (every number traced) |
| 4 | Rights map: sortable matrix, sector filter (when present), cards in `<details>`, copy cut | `app.js`, `styles.css` | screenshot |
| 5 | Network default layers, label rule, copy cut | `graph.js` | screenshot; legend still toggles every type |
| 6 | Pathways tie table, copy cut | `pathways.js`, `styles.css` | screenshot; table rows = ties shown |
| 7 | Causality event table, copy cut | `causality.js`, `styles.css` | screenshot; rows = 64 events |
| 8 | Scorecard panel below the matrix, copy cut | `scorecard.js`, `styles.css` | screenshot at 1440: all 17 columns visible |
| 9 | People table, copy cut | `app.js`, `styles.css` | screenshot |
| 10 | Inline styles to classes in `app.js` | `app.js`, `styles.css` | `grep 'style="' app.js` returns nothing |
| 11 | DESIGN.md components and wording rules; STATE.md | docs | review |

No new dependencies (d3 is already loaded). No colours outside tokens.

## Checks

- `npm run check` once after the last fix; the known failures (STATE queue 1–2) are reported, not counted.
- Before/after screenshots of every changed tab at 1440 and 390, light and dark → `docs/design/`.
- Reviews (plan and result): **UX / content** (plain labels, no explainers, a practitioner finds data in seconds), **Visual design**, **Accessibility** (tables, sortable headers, dot plot alternatives), **Data accuracy** (every number shown traces to `data/`; nothing invented; withdrawn and excluded reasons only as sourced).

## Revision 2 (after plan review R1: UX 76, visual 72, accessibility 72, data accuracy 68 with a content-rule fail)

The owner's answer on the header, 2026-11-25: **"Yes, plain header."** PRODUCT.md's "First ten seconds" is updated in the same commit.

Every item below overrides the matching part of the plan above.

**Tabs (9):** 1 **Upcoming votes** · 2 **Proposals** · 3 **Rights map** · 4 **Network** · 5 **Pathways** · 6 **Causality** (now opens with the 7-item **Policy timeline** from `site.json`, then the swimlane map, then its event table) · 7 **Disclosure scorecard** · 8 **People** · 9 **New filings**. The tabs get `id`, `aria-controls`, panels `aria-labelledby`, a roving `tabindex` and Left/Right/Home/End keys (WAI tabs pattern). Unknown hashes, including `#why`, `#weigh-in` and `#water`, open tab 1.

**Header:** eyebrow "Shareholder Advocacy AI Landscape" · h1 "AI shareholder proposals, filers, rights and lab ties" · meta line "{companies} companies · {proposals} proposals · every fact links to its source · SEC filings last checked {date}" (counts computed). This keeps "every fact links to its source" from PRODUCT.md.

**Upcoming votes:** a table of meeting, company, item, proposal, filer, topic, board recommendation and proxy link. The filer is parsed from "(filed by …)" in `title`, and blank if absent. The proxy link is the meeting's `proxy_url`. Topic names are normalised ("Social and economic impacts" becomes "Social & economic impacts"). Meetings with no AI items are listed under the table with their note.

**Proposals:**
- **Order:** status filter (5 buttons with counts: All, Voted, Upcoming, Withdrawn, Excluded), company, topic and year selects, count line (`aria-live="polite"`), and a "Clear filters" button shown only while filtered. Then the dot plot, then the table.
- **Method line, computed:** "{n} proposals, meetings {first year}–{last year}. Support = for ÷ (for + against); where a company reports on a different basis, its note is shown."
- **Dot plot:**
  - Contents: voted proposals that have both a `meeting_date` and a `results_url`. The caption says how many are not plotted and why ("{k} voted proposals have no meeting date or vote-results filing recorded; they are in the table").
  - Axes and marks: x is meeting date. y is support, 0–60% (or max+5 if higher). One mark per proposal.
  - Topics: shape and colour per topic (circle, square, triangle) from a new topic palette `--tp-*`, kept apart from the status and accent colours. Proposals that share a date are spread 7px apart horizontally.
  - Basis notes: a proposal with a `support_note` gets a hollow mark, keyed "company reports on another basis (see table)".
  - Reference line: labelled "50% of for + against", not "pass".
  - Interaction: clicking a mark scrolls to its table row and highlights it.
  - Accessibility: the svg has `role="img"` and an `aria-label` summarising n and range. The table plus filters are the full equivalent.
  - Phone: on narrow screens the plot scrolls inside its own box.
- **Table:**
  - Columns: Meeting (company; date, or year if undated), Proposal (title; filer; topic; proxy and results links), Status (text pill), Support (value, then `support_note` in small text).
  - Withdrawn or excluded rows add "Reason: {status_reason} [source]", or "Reason not yet recorded".
  - A support % without a `results_url` shows "vote-results filing not recorded".
  - Sortable by meeting date and support (`<th aria-sort>` with a `<button>`).
- **Topic legend:** built from the topics in the data, not a fixed list. This removes the phantom "AI safety & alignment" entry.

**Rights map:**
- **Matrix:** a sortable table with columns Company, Sectors (if present), Route, and each matrix column. A sector filter appears when any company has `sectors`, with a count line.
- **Status note:** `status_key` stays as one method line under the matrix, since it's the site's own rating scale.
- **Company cards:** `<details>` per company, with `<summary>` "{Company}: {status}".

**Network:**
- **Default view:** people, policy, response and public layers start hidden. Their legend chips start `aria-pressed="false"`.
- **Hidden-layer rule:** `focusNetworkNode` switches on the layer of the node it focuses first. "Show in network" on People always shows the person.
- **Labels:** companies, labs and the 12 highest-degree filers by default; others on hover and focus.
- **Intro line:** "{nodes shown} of {nodes} nodes. Node size = number of connections. Switch layers in the legend."

**Pathways:** the question labels go ("Reach a lab: …", "Plan an engagement: …" become "Labs" and "Companies"). The intro is one line of counts and encodings, and the side-panel prompt is cut. An always-visible tie table follows the graph (company, lab, tie type, strength, as of, source), showing all ties with nothing selected and filtering to the selection.

**Causality:** an always-visible event table (date, actor lane, event, links in and out, source), chronological. The intro is one line.

**Scorecard:** the evidence panel moves below the matrix. Check: at 1440 the matrix's last column ends inside the box with no horizontal scroll (Playwright `scrollWidth <= clientWidth` on `.sc-wrap`). On phones the matrix scrolls inside its box. The framework sentence is cut to one line with the link. "Silent = no public disclosure found" and "not affiliated with Parnassus Investments" stay.

**People:** a table of name, organisation, title, AI focus, profile and "Show in network", sortable by name and organisation, with search and a count line.

**Tokens (styles.css; DESIGN.md updated):**
- `--control-edge` for control borders: light #7a9399 (3.25 on surface), dark #4f7a82 (3.63).
- Switched-off legend chips: struck-through `--ink-soft` text and a hollow dot, not opacity.
- Topic palette `--tp-dc`, `--tp-se`, `--tp-gov`: light #6a4fc0, #b0367c, #50606a; dark #b39dff, #f08cc0, #b8c4cc. Each is at least 5.7:1 on surface. They separate by hue and by marker shape.

**Copy (before → after), checked in the result review:**

| Where | Before | After |
|---|---|---|
| index.html header h1 | "A shared map of investor engagement on AI" | "AI shareholder proposals, filers, rights and lab ties" |
| index.html lede | 5-sentence mission paragraph | (removed; counts in meta line) |
| app.js renderWhy | "The ballot route is narrowing" + why_intro; "Where leverage still exists" + levers | moved to Causality as "Policy timeline" (list only); levers removed |
| app.js renderWeighIn | "How you can weigh in", intro, disclaimer callout, "Upcoming AI votes", "Ways to vote, depending on how you invest" | "Upcoming votes" table only |
| app.js renderRights | rights_intro paragraph; "How to read the status" callout | one method line: status_key |
| app.js renderFeed | "Proposal feed" + chart explainer | "Proposals" + computed method line |
| app.js renderPeople | "People leading engagement" + 3-sentence intro | "People" + count line |
| app.js renderNew | "What's new" + 2-sentence intro | "New filings" + one line: "Weekly SEC EDGAR check for AI-related proxy statements, PX14A6G filings and vote results; unreviewed finds are marked." |
| graph.js:101-102 | "Advocacy network" + 6-sentence explainer | "Network" + computed line |
| pathways.js:60-64, 69 | "Influence pathways" + 3-sentence explainer; question labels; panel prompt | "Pathways" + one line of counts/encodings; "Labs"/"Companies"; no prompt |
| pathways.js:162 | "These are organizations working on the same companies…" | (removed; footer carries the informs-not-coordinates line) |
| causality.js:134-135 | "Causality map" + 4-sentence explainer | "Causality" + one line |
| scorecard.js:66-67 | 3-sentence framework intro + callout | one line with the framework link; "Silent = no public disclosure found. Not affiliated with Parnassus Investments." |
| app.js renderComing / water tab | "Coming soon…" | (removed; `.coming` stays only as the no-data fallback for a view whose data file is empty) |

**Data honesty:** ranges and counts are computed from the data. The fallback text is "Reason not yet recorded" and "Filer not recorded". No support % is shown without its company-basis note.

## Revision 3 (owner direction during the build, 2026-11-25)

> "Make this site like an internal site, so it has a use case for a company. It's not necessarily marketed aesthetically to the larger public. The current design is too flashy and showy. It should be pure using scenarios."

> "I want the background to be white and the text to be light blue." Then: "It's largely just black and white, but where necessary, there is blue. For example, all the visuals should be blue."

> "Include all the companies that would be relevant to target for increasing responsible AI …" (data session: docs/plans/2026-11-25-company-universe.md)

**Changes to the plan:**
- **Tabs follow tasks (10):** Upcoming votes · **Company lookup** (new) · Proposals · Rights map · Co-filer network · Contacts · Lab pathways · Policy and causality · Disclosure scorecard · New filings.
- **Company lookup:** pick a company to see its summary (route, proposals on file with median and high support, next meeting, disclosure score), then:
  - upcoming ballot;
  - AI proposal history with reasons;
  - filers active there ("Show in network");
  - frontier-lab ties;
  - proposal rights.
  "Open in Proposals with filters" carries the company filter across.
- **Upcoming votes:** adds "AI votes at company" (earlier voted AI proposals there: count, median, high) and links each company to Company lookup.
- **Look:** one white theme, black text, Inter only, smaller and denser type, blue only for links, selected controls and every data visual (`--blue-1/2/3`). Status pills use shape and fill, not hue. Dark mode is removed by the owner's direction.

**Protocol note:** AGENTS.md rule 27.3 says not to mix structure and colour in one round. The owner directed both during this build, so they ship together. The result review covers both, and STATE.md records the deviation.

## Not doing

- Any change to `data/` (the data session's).
- Adding companies (the data session's; views scale automatically).
- Merging the policy timeline into the causality data (queued).
- Layout shift (STATE queue 3, owner decision).

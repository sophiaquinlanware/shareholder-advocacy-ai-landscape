# Design system

A description of the site as of round 2 (2026-11-25, branch `design/round2-structure`; plan in docs/plans/2026-11-25-round2-structure.md). It records the design. When the design changes, update this file in the same commit.

Owner direction, 2026-11-25:
- An internal working tool organised by the tasks a stewardship team does. Not a public showcase, and not flashy.
- "Largely just black and white, but where necessary, there is blue. For example, all the visuals should be blue."
- No decorative visuals. A chart appears only if it's drawn from `data/` and updates with it, and its type is chosen for what best shows how the data relates.
- Audience: practitioners. Plain labels, no definitions, no slogans.

This replaces the blue-green dark/light restyle of round 1 (d627574).

## Colours

One white theme (`color-scheme: light`). All colours are tokens on `:root` in `styles.css`. Contrast figures are measured on white.

| Token | Value | Role |
|---|---|---|
| `--bg`, `--surface` | #ffffff | page, cards, tables |
| `--ink` | #111111 | text (18.9) |
| `--ink-soft` | #6b6b6b | secondary text, grey uppercase labels (5.3) |
| `--line` | #e0e0e0 | dividers (non-interactive) |
| `--control-edge` | #8a8a8a | borders of inputs, selects, buttons, chips (3.45, WCAG 1.4.11) |
| `--head-bg` | #f6f6f6 | table header row, reason box |
| `--blue` | #1f4e98 | **the one blue** (owner, 2026-11-26: "any blue you have can you have it be this color blue"; sampled from the owner's image). Links, selected tab, selected controls, every data visual (8.1) |
| `--accent`, `--blue-1/2/3` | = `--blue` | kept as aliases |
| `--blue-mid` | #7995c1 | 60% tint: marks that must still read at 3:1 (Lab pathways filer lines and dots, unchosen bars) |
| `--blue-light` | #a5b8d6 | 40% tint: dark-canvas rings and the downstream-use category only (2.0 on white, 8.3 on dark) |
| `--accent-soft` | #e9edf5 | highlighted table row, upcoming pill |
| `--heat-1…5` | #e9edf5 … #1f4e98 | Value chain heatmap: 10/30/55/80/100% tints; white text on the top two (4.9, 8.1) |

Where two blues once told things apart, the second is a tint of the same blue, never another hue. On the dark network canvas the one blue is only 2.1:1, so blue nodes (proposals, cloud and model platforms, untyped companies) carry a thin light outline (`--g-label-soft`); the selected node keeps its thicker white stroke. Trade-off: proposals and cloud companies share the blue there; they sit in different columns and the panel names the type. **Scope of "every blue":** the blues and blue-lavenders became the one blue or its tints. Indigo (`--n-person`), cyan (`--n-response`, `--gn-response`, `--gn-tier-datacenters`) and teal stay: they are separate node-type colours on the network canvas, the owner's exception, and turning them blue would merge more types.

**Status pills** carry a text label and use shape and fill, not colour, to separate states.
- Route: open = solid blue · narrowing = dashed outline · closed = solid black · pending = grey outline.
- Proposal status: voted = grey outline · upcoming = blue tint · withdrawn = dashed outline · excluded = solid black.

## Data visuals: all blue

| Visual | Encoding |
|---|---|
| Proposals dot plot | x = meeting date; y = support (0–60%, or higher if the data needs it); one mark per voted proposal with a dated vote-results filing. Topic = shape, all in the one blue: data centres circle, social and economic square, governance triangle. Every mark is filled (owner, 2026-11-26: "Be consistent with the circles"); basis notes are listed under the table, and the key says how many plotted figures have one. Dashed line "50% of for + against". Marks sharing a date are spread 7px apart. |
| AI advocacy network | **Exception to all-blue and to the white page, by the owner's direction:** the graph box is a dark canvas like Obsidian's graph view (`--g-bg` #1e1e1e; owner: "the black background and colors like this so that the graph looks similar to an Obsidian graph"). One bright, distinct colour per node type (`--gn-*`, each 3.7:1 or more on `--g-bg`), **grouped by family** (owner, 2026-11-26): investors, coalitions and engagement leads on the green-blue side; companies (by role) and frontier labs on the pink-orange-red side; proposals and recurring asks yellow (proposal categories are yellow shades); policy, responses and public engagement neutral. Within a family each type differs in hue or lightness. Links are thin grey-blue (`--g-link`) and labels light (`--g-label`). The page, key, panel and List view stay white. Lab pathways keeps the `--n-*` colours on white. **Companies are typed by main role in AI** (roles.js, used site-wide; owner, 2026-11-26): Frontier labs, Chips and hardware, Data centers and power, Cloud and model platforms, Consumer products, Business and government products, Strategic investors. Each has its own colour (`--gn-tier-*`), and companies sit in role bands within the "AI companies, by role" column. The intro says the roles are this site's reading. **The selected node's label stands out** (owner, 2026-11-26): it is larger, bold and white on a blue `--accent` pill, while its connections' labels show in `--g-label-soft`. **Key controls** (owner, 2026-11-26: "only have the tabs … click it all lights up of the category vs click again and it cross it off"): each type chip cycles on click through shown → highlighted (chip fills blue; the rest of the graph dims to 12% and highlighted nodes are named when 25 or fewer) → crossed off (hidden) → shown. Several types can be highlighted at once. "Show all" resets every chip. No "only" links. The proposal-category key works the same way. When 25 or fewer nodes are shown, every node is named. **Labels never overlap** (owner, 2026-11-26: "Make it so it's always legible"). Each shown label takes the first free spot (right, left, above or below its node) within the visible area at the current zoom. Priority goes to the selected node, then companies and labs, then the most connected. A label with no free spot is hidden; its node is still named in the panel and the List view. Labels carry a dark outline, and the browser tooltip is removed. **Grouped 2D layout:** x follows the filing chain (people → filers → proposals → value chain, by tier → frontier labs; owner asked for a more specific word than "companies"), under column headers on an opaque top strip that nodes can't enter. Filer types each get a horizontal band, with no row labels: the key names the types (owner asked whether the axes help; the row labels were dropped as confusing). Policy, responses and public engagement sit in a top band. Size = number of connections. Links thin grey-blue quadratic arcs on the dark canvas. **Two views** (owner, 2026-11-26; plan docs/plans/2026-11-26-network-views.md): a Connections | Proposals switch directly above the graph. Connections shows who is tied to whom (no proposals); Proposals shows filers → proposals → companies, with All · Active · Past (active = ballot not yet held). The view is kept in the URL (`graph=proposals`); the Policymaker lens opens on Proposals; the proposal filters show only there. **Tool buttons** ("Show all", "My holdings", "Show asks not yet filed") are square, grey-filled, with no colour dot, so they read as settings rather than key items. **Box size and shape** (owner, 2026-11-26): the box grows with the visible nodes (their total area at a comfortable density; 600–1,600px, 460–1,000px on phones) and re-sizes when types are shown or hidden. Nodes are kept inside a rounded rectangle (a superellipse, |x|⁴+|y|⁴ ≤ 1) rather than pinned to the box edges, so clusters stay under their column headings and only the corners round off (owner: "more spread out … more rectangular so it maps onto the linear graph axis"). Column and band targets are folded into it, repulsion reaches 60% of the box's shorter side, and the box allows more room per node. **Graph settings** panel (like Obsidian's): text size, label threshold, node size and link thickness (Display); orphans (Filters); grouping, centre, repel and link force, and link distance (Forces). Saved per viewer in localStorage, with "Reset to defaults". |
| Lab pathways | **Value chain, not proposals** (owner, 2026-11-26: the network "shows the proposal flow … the other graph … just points to the value chain"): the map shows only companies → frontier labs ties, headed "Value-chain ties: companies → frontier labs"; filers are listed in the routes table, and the AI advocacy network carries the label "Proposal flow". **Lab first** (owner, 2026-11-26; plan docs/plans/2026-11-26-lab-routes.md). Pick a lab (OpenAI by default), then: "Routes to {lab}" table, one row per tied company: tie (group, type, as of, source; "reported or unverified" kept from the data), strength (site rating 1–3, with reason), US proxy rights and next filing deadline (open with days left, or passed, computed live), filers with AI proposals there (named filings only, no exempt solicitations; long lists fold after six), related asks (site grouping by tie type, with counts filed there), past support on related asks (latest vote, dual-class flagged). Default sort: strongest tie, then open deadline. Phones show each row as a labelled card. Findings list under it ("No AI proposals filed here yet", companies by number of filers, open deadlines, not tracked). "Labs reached, by company": horizontal HTML bars in the 60% tint, the chosen lab's companies in the full blue. "Gaps in the tie data". Then the map: filers → companies → labs, filer column trimmed to the chosen lab's companies, labels wrapped (never cut below three lines), company → lab ties in the blue (width = strength), filer → company in its 60% tint (width = proposals filed). The company chips are a secondary filter, collapsed. All ties table collapsed at the bottom. |
| Policy and causality | Event nodes mid blue. Link type by dash pattern: led to solid · responded to dashed · restricts dotted · enables dash-dot · cited by sparse dots. |
| Disclosure scorecard | Met = solid blue, partial = hatched blue, silent = grey outline. |

**Fund votes** (from main, data session) use no palette on purpose: every vote is the neutral `.pill.pending` label, so no vote reads as right or wrong (PRODUCT.md "Never claim" 1). The table has a sticky first column (`.sticky-col`, with `scroll-padding-left` 330px on its box so a focused cell never hides under it), a left-aligned caption (`.fv-caption`), labelled filters (`.sr-label`) and a focus outline on the scroll box (`.table-wrap:focus-visible`).

Every visual has a text equivalent on the same tab: the proposals table, the network list view, the pathways tie table, the causality event table, and the scorecard evidence panel.

## Typography

Owner (2026-11-26), with a museum site's screenshot: "make it this font and this typographical aesthetic".
- One family: **Schibsted Grotesk** (Google Fonts, 400 and 500 only, loaded without blocking; `font-synthesis-weight: none`), fallback Helvetica Neue / Arial. Chosen as the closest free match to the screenshot's neutral grotesque after setting the same words in seven candidates.
- **Regular weight throughout.** Headings 400: h1 26px · h2 22px · h3 and sub-headings 17px, slight negative tracking. Emphasis is 500, never heavier.
- **Small labels are grey uppercase, 400, tracked .04em:** the eyebrow, tabs (13px), table headers, `dt`, legends, chart column titles (12px), card labels.
- Body 15px/1.55 · tables 13px · meta, notes, pills 12–13px.
- **Tabs:** hovering (on devices with a mouse) draws a thin (1px) blue underline that grows from the left; hovered text stays grey, so only the selected tab is black with a 2px underline. No motion under reduced motion.
- **Sticky page title:** once the header scrolls away, the sticky bar gains one line: the site name as a grey label, then the current page name (18px). Phones show the page name only. Hidden from screen readers (the selected tab already says it). Once stuck, the tab rows tuck away on scroll down and return on scroll up or on keyboard focus (owner's choice, 2026-11-26: the title stays). Scroll padding follows the bar's real height.

## Motion foundation

Owner's motion brief (2026-11-26; plan docs/plans/2026-11-26-motion.md, staged). Stage 1:
- Lenis smooth scroll, synced with GSAP ScrollTrigger (`motion.js`). It is off under reduced motion, and the graph boxes keep native wheel zoom.
- One easing curve, `--ease` cubic-bezier(0.16, 1, 0.3, 1), also used as expo-out in GSAP, d3 and Lenis.
- Durations: `--dur-micro` 200ms, `--dur-reveal` 500ms, `--dur-trans` 800ms.
- An 8px spacing scale, `--s-1`…`--s-8`.
- Text #1a1a1a, with tabular numerals everywhere.
- Only transform and opacity animate.

The owner kept plain white, the grotesque and the always-visible page title over the brief's off-white, serif and hide-everything nav.

Stage 2:
- **Headline reveal:** each page's h2 is split into its rendered lines; each line rises from behind a clipped box (500ms, 90ms stagger, `--ease`), then the lines turn inline again, so the heading wraps normally. Under reduced motion it is a 200ms fade. The site title stays still, because it is the page's largest paint.
- **Font:** self-hosted (`fonts/schibsted-grotesk-latin.woff2`, preloaded) with an Arial fallback matched to its width, ascent and descent.
- **Numerals:** tabular figures only where figures line up (tables, `.num`, chart text), because in this font they also widen commas.

## Layout

- `.wrap` max width 1200px, 16px side padding. Dense: tables at 7px × 10px cell padding.
- Breakpoints: 800px (graph side panels drop below) and 600px.
- Radius `--radius` 6px; pills 999px.
- Wide tables and charts scroll inside their own box (`.table-wrap` and `.chart-scroll`, both positioned so nothing escapes); the page never scrolls sideways.

## Sections and views (engagement order)

Site name: **"Shareholder advocacy on AI"** (owner request, 2026-11-26, commit 78b0efd), with a one-line tagline saying who the site is for.

Six sections, in the order of an engagement cycle (owner, 2026-11-26: "like you are an analyst from [Parnassus] ... eliminate any redundancies ... It feels chronological ... clear why each thing is there"; plan docs/plans/2026-11-26-analyst-restructure.md). Each section opens with the question it answers, then a row of views:

- **Start here:** Overview (`#start`) · Upcoming votes (`#upcoming`) · New SEC filings (`#new`)
- **AI value chain:** Chips to AI products (`#value-chain`, heading "AI value chain, from chips to AI products: companies by tier"; owner: never just "the chain", always say which chain) · Routes to a lab (`#pathways`)
- **Companies:** Company profile (`#company`) · Compare disclosure (`#parnassus`) · Compare proposal rights (`#rights`)
- **Proposals and votes:** All proposals (`#feed`) · How funds voted (`#votes`)
- **Who's engaging:** Network (`#network`) · Contacts (`#people`) · Engagement outcomes (`#outcomes`)
- **Policy:** Policy map (`#causality`)

Both rows follow the WAI-ARIA tabs pattern (`aria-controls`, `aria-labelledby`, roving tabindex, Left/Right/Home/End). Every view keeps its own address, so old links open the right place; `#why` goes to the Policy map, `#weigh-in` and `#water` to Upcoming votes, and any unknown hash to the Overview. On phones the section row scrolls sideways on one line.

One vocabulary: company roles from `roles.js` everywhere (the value-chain tiers use the same labels), and proposals classified only by the four categories in `data/asks.json` (shown as "What it asks about").

## Components

- **Header:** site name (eyebrow), h1, and a meta line of computed counts.
- **Sortable table:** `<th aria-sort>` with a `<button class="th-sort">`; the active column shows ↑ or ↓.
- **Status filter:** buttons with counts (`.status-btn`, `aria-pressed`).
- **Count line:** `.count-line`, `aria-live="polite"`; it states what the filters show.
- **Company detail:** `<details class="co-detail">`, with summary "Company TICKER: status".
- **Summary list:** `dl.summary` on Company lookup.
- **Reason box:** `.reason`, on withdrawn and excluded proposals, with the reason and source or "Reason not yet recorded".
- **Legend chip:** `.leg`. When switched off: struck through, dashed border, hollow dot.
- **Source link:** `.src`. Missing sources show "source pending" (`.unverified`).

## Lenses (AI advocacy network)

One dataset, several views. `lenses.js` holds every lens (`window.LENSES`). Each lens has:
- a label;
- `sizeLabel`, so the intro reads "Node size = …";
- default layers;
- a size function;
- rings;
- actions.

A new lens is one more entry. `rules.js` holds rule-based settings with comments; today that is the secondary-source domain list used for edge confidence.

- **View as:** native radios in a `<fieldset class="lens-pick">`, styled as chips. The choice is kept in `?lens=` (shareable) and `localStorage["lens"]`; the URL wins. Switching applies the lens's layers and resets topic and year. A hidden live line states what changed.
- **What you can do:** `.net-actions`, at the top of the node panel. It holds facts only: where, when, who, counts and links, never advice or how to vote. It is left out when the lens has nothing for the node.
- **Edge confidence:** `.conf` text in `--ink-soft` on every connection: verified, reported (secondary domain or "UNVERIFIED" in the edge text), or inferred (no URL). On the graph, inferred lines are dotted `1 3`, and membership lines stay dashed `3 3`.
- **Rings:** dashed `--accent` ring for "Upcoming vote", always also stated as text (`.ring-note`, List view Status column). The keyboard focus ring is solid `--ink` with a white gap, so the two differ by shape.
- **Keyboard:** the graph is one tab stop (`role="application"`). ↑/↓ (and ←/→) step through visible nodes, companies and labs first, then by connections. Home and End jump to the first and last. Enter opens the panel and Esc clears it. `#net-kb` announces each step.
- **Labels:** off by default (owner, 2026-11-25: "don't label the nodes until you click on a node, and then … label all the connection nodes"). Selecting, hovering or keyboard-focusing a node names it and its connections. Graph settings → Filters → Labels turns all labels on (saved per viewer).
- **Impact investor marks (Phase 2):** each is drawn on the node and stated in text: panel, List view Status column and the keyboard announcement.

  | Mark | Radius | Stroke | Token |
  |---|---|---|---|
  | Keyboard focus | gap r+1.5, ring r+3 | solid 2px | `--g-focus`, gap `--g-bg` |
  | Upcoming vote | r+6 | dashed `4 2` | `--g-ring` |
  | Proposal deadline | r+9 | solid, plus a 3px countdown arc (full at 90+ days) | `--g-window` |
  | Seeking | r+12 | dotted `1 3` | `--g-seeking` |
  | Resubmission | bar under the node, plus "!" | 3px | `--g-risk` |
  | Ask coverage: covered / partial / no rule in this map (Policymaker) | r+9 | solid 2.5px / dash `8 3` / dotted `1 3` | `--g-ring`, `--g-ring`, `--g-risk`; panel glyphs ● ◐ ○ |

  - The deadline ring pulses twice (5s) and then stays still. It never pulses under reduced motion, and Graph settings can turn the pulse off.
  - Deadlines and thresholds come from `rules.js`, never from page copy.
- **My holdings:** a button with `aria-expanded` opens an inline region (a labelled textarea, Apply, Clear). Tickers are kept in `localStorage["holdings"]` only. Unheld nodes fade to 15% and their labels hide. A persistent live line reports what was found.
- **Topics not filed** (Impact lens toggle, `aria-pressed`):
  - Ghost nodes (kind `gap`) are hollow with a dashed `--g-label-soft` outline, joined to their company by a dashed `5 3` line.
  - Every line states the scope: "in this dataset (N companies with AI proposals tracked)".
- **Find a path to…** (person and filer panels): a breadth-first search over people, coalition, co-filing and filing edges.
  - Every hop is labelled with its source; inferred co-filing and shared coalition membership are named as such.
  - Focus goes to the summary. Esc in the panel clears the path.
- **Individual investor feed (Phase 3):** this lens opens on a list (`#net-feed`), not the graph. `view=feed|graph` is kept in the URL.
  - **Input:** a search form, "Your tickers or fund name". Tickers become My holdings; the fund is kept in `localStorage["fund"]`.
  - **List:** a `<ul>`, one `<li>` per upcoming AI proposal: an h4 for the company, the summary (`plain_summary` or the title), `<time>` and the proxy link.
  - **Fund line:** "How your fund voted last year" uses the Fund votes tab's join and wording (`window.FundVotes` in votes.js).
  - **Switching views:** "See the bigger picture" shows the graph with the overlay and moves focus to "Back to the list". Going back returns focus to "See the bigger picture".
  - **Terms:** disclosure buttons (`.term`, `aria-expanded`) with an inline definition (`.term-def`); Esc closes it. The text lives in `GLOSSARY` in lenses.js.
- **Policymaker lens (Phase 4):**
  - **Ask nodes:** recurring asks from `data/asks.json`, kind `ask` ("Recurring ask", `--gn-ask`). They're added while this lens is on, each with its proposals beside it and coverage edges to policy nodes (`data/coverage.json`; partial edges dashed `8 3`).
  - **Marks:** "Covered by a rule in this map", "Partially covered" (plus "not yet in force" where it applies), or "No rule in this map reaches this". With no entries it reads "Coverage not yet assessed", never "no rule". Every mark says "this site's reading, not yet confirmed by a person" while unreviewed. No entry is "full" today, so the solid ring doesn't appear yet.
  - **Panel ("This ask"):**
    - recurrence by status;
    - support by year: range and average. The average is an exception to the site's no-average rule, by the owner's spec; it is labelled as computed by this site, with dual-class and unlinked figures stated;
    - coverage lines;
    - company actions in the Causality map that mention the ask (by the ask's match terms). Nothing is called a "commitment", because the data has no such field.
- **Year scrubber (all lenses):** "Show the network up to {year}" sits under the graph and its panel, outside the graph box, so List view shows it too (owner's spec: "under the graph"), with one button that renames itself between Play and Pause, stepping one year every 1.5 s. The open panel refreshes when Play stops, not on every step, so focus inside it is never lost.
  - **What it caps:** proposals by year, and `ev-` events by date. Companies, filers and labs stay.
  - **Single year:** with one year chosen in the year select, the slider is disabled, with the reason given.
  - **URL:** `upto=` in the URL; a lens switch resets it.
  - **Announcements:** one live message per step, and "Stopped at {year}".
- **List view:** every visible node, with Name, Type, Connections (sortable), Status and What you can do. It is the text equivalent of the graph.

## Focus and motion

- `:focus-visible` draws a 2px `--accent` outline. On accent-filled controls the outline is `--ink`.
- `prefers-reduced-motion`: no transitions, the network settles before drawing, and focus jumps instead of animating.

## Company roles (site-wide)

Every view classifies companies the same way, by **main role in AI** (roles.js), with secondary roles listed as "also" (owner, 2026-11-26: "use this to differentiate companies throughout the UI"). The categories come from research into how the EU AI Act, the UK CMA, the OECD and investor stewardship guides classify AI companies. They are role-based (developer, infrastructure, platform, deployer), with deployers split by who is affected:
- Frontier labs
- Chips and hardware
- Data centers and power
- Cloud and model platforms
- Consumer products
- Business and government products
- Strategic investors

Roles are derived from the data session's sourced tiers and consumer/enterprise tags. Four overrides are stated in roles.js. The classification is shown as "this site's reading". The old "sectors" filter is replaced everywhere. The Value chain tab's per-tier counts still come by tier, so its deployers row reads "Consumer and business products".

## Named rules

1. Colours only through tokens.
2. Every fact carries a source link or "source pending". Network connections show a confidence marker instead.
3. Wide content scrolls inside its own box, never the page.
4. No decorative visuals; every visual is blue and has a text equivalent.
5. Counts, ranges and lists come from the data, never typed into copy.
6. Plain labels; no definitions, explainers or slogans. The one exception is the Individual investor lens, which has plain-language definitions behind `.term` buttons, as the owner's spec asks.

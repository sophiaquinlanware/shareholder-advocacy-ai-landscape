# Shareholder Advocacy AI Landscape — current state

Rewritten in place, never appended. Hard cap 200 lines. Last updated 2026-11-26 (data session: analyst restructure, 12 tabs into 6 sections, merged 2161c91).

## Sessions and branches (read this first)

**The live site is `main`**, published to https://sophiaquinlanware.github.io/shareholder-advocacy-ai-landscape/ on every push (`PAGES_ENABLED` = `"true"`, ADR 0001). Anything not on `main` is not on the site.

| Session | Owns | Branch | State |
|---|---|---|---|
| Data / backend ("Account linking") | `data/*.json`, `scripts/`, `SOURCES.md`, `.github/workflows/` | none open | On `main` (7d8d694): 60 companies with tiers; rights maps for 29 US companies; value chain (44 ties); 76 AI proposals with `ask_id` and `category` (4 categories in asks.json); fund votes from every N-PX filing (414 rows, all 9 families full coverage, incl. Praxis and Domini); coverage.json (25 rows, `reviewed: false`); Ceres, VWFI, IIGCC; 285 organizations in network.json, 257 people, 202 `proposal_links`, 78 proposals (Salesforce 2026 added); Parnassus "engaged directly" edges to 6 companies. graph.json 778 nodes, about 735 KB. |
| UI ("Shareholder advocacy AI landscape UI") | page files: `index.html`, `styles.css`, `app.js`, `graph.js`, `lenses.js`, `rules.js`, `roles.js`, `pathways.js`, `valuechain.js`, other view JS, `DESIGN.md`, `tests/` | none known (page files handed back after the restructure) | Live: lens Phases 1–4, Value chain tab, proposal categories, company roles site-wide, "AI advocacy network", Lab pathways as routes to a lab. This round: Schibsted Grotesk in regular weights, grey uppercase labels, one blue #1f4e98, hover underline on tabs, sticky page title. |
| Protocol setup | `AGENTS.md`, `CLAUDE.md`, checks, `docs/` structure | `docs-session-onboarding` (local) | Idle. |

**Owner's standing instruction (2026-11-25):** "Don't ask me any questions about publishing or next steps. Just continue until you complete the project." Merge to `main` once the check and reviews pass.

## Sections and views (6 sections, engagement order; merged 2161c91)

Start here (Overview · Upcoming votes · New SEC filings) · Value chain (The chain · Routes to a lab) · Companies (Company profile · Compare disclosure · Compare proposal rights) · Proposals and votes (All proposals · How funds voted) · Who's engaging (Network · Contacts · Engagement outcomes) · Policy (Policy map). Every view keeps its old address. Site name "Shareholder advocacy on AI" (owner, 2026-11-26). Plan docs/plans/2026-11-26-analyst-restructure.md; reviews UX/a11y R1 70, R2 83 PASS. Proposal "topic" now carries the four categories (old value in topic_original). Not built from the plan: fund votes expanding inside All proposals (R6); Contacts listing organizations and coalitions too.

## Site-wide decisions in force

- **Look:** black and white with **one blue, #1f4e98** (owner, 2026-11-26), on plain white; tints of it where two blues must differ. The network graph alone has a dark Obsidian-style canvas; blue nodes there carry a thin light outline.
- **Type (owner, 2026-11-26, from a museum site screenshot):** Schibsted Grotesk, regular weight throughout (emphasis 500), grey uppercase tracked labels; tabs draw a thin blue underline on hover; the page name joins the sticky bar on scroll. Plan docs/plans/2026-11-26-type-and-blue.md. Reviews: plan R1 72; result R1 76, R2 78. R2's remaining points were fixed after R2 (round cap) and not re-reviewed: tab rows no longer overflow the bar on phones, two 11px labels raised to 12px, and a fallback font (Arial at 101%, measured) cuts the shift when the font loads. Check: 156 passed; Lighthouse phone 100/100/100/91, desktop 100/100/100/97.
- **Company roles (roles.js):** one classification everywhere: Frontier labs; Chips and hardware; Data centers and power; Cloud and model platforms; Consumer products; Business and government products; Strategic investors. Plan docs/plans/2026-11-26-company-roles.md.
- **Network legibility:** labels never overlap; the selected label sits on a blue pill; key "only" and "Show all" controls; year scrubber (`upto=`).
- **Lenses:** Impact, Individual, Policymaker (phases 1–4). Plans are in docs/plans/2026-11-25-lens-phase1/2 and 2026-11-26-lens-phase3/4.

## Motion brief (owner, 2026-11-26; staged, plan docs/plans/2026-11-26-motion.md)

- **Stage 1, foundation: live.** Lenis with GSAP ScrollTrigger, one easing, the duration and spacing tokens, and tabular numerals. The check passed (156; Lighthouse phone 90, desktop 97). It was not separately reviewed: it is a small infrastructure stage, and the owner reviews each stage.
- **Owner's choices against the brief:** plain white, the grotesque headings, and the title always visible.
- **Stage 2, headline reveal: live.**
  - Each page's heading rises line by line from behind a mask, once its data has drawn and each time its tab opens. Under reduced motion it is a plain fade.
  - The site title stays still. It is the page's largest text, and animating it made measured load time swing between 1 and 15 seconds.
- **Fixed in the same round:**
  - Tabular numerals had put gaps before commas ("Hill , Jr ."). They now apply to tables, figures and charts only.
  - The font is now served from this site and preloaded: `fonts/`, SIL OFL, Latin subset.
  - The fallback font is matched to its measurements.
  - The motion libraries now load last.
  - Layout shift: 0.20 → 0.03. Lighthouse: phone 100, desktop 97.
- **Stages 3–10** follow one at a time, each shown to the owner: count-ups, charts drawing in, row stagger, timelines, view transitions and skeletons, micro-interactions, Cmd+K, and mobile cards.

## Title, graph space, two graphs' jobs (owner, 2026-11-26)

- **Site title:** "Shareholder advocacy on AI" (34px; the eyebrow label is gone).
- **Network box:** grows with its visible nodes (600–1,600px; 460–1,000px on phones). It uses a soft oval boundary instead of pinning nodes to the edges.
- **Lab pathways map:** value-chain ties only (companies → labs). The network is labelled "Proposal flow".
- **First tabs load faster:** five small data files are preloaded, and the large ones start after.
- **Check:** 160 passed; Lighthouse phone 100, desktop 91.
- **Owner idea, next, after the data session's restructure merges:** two views on the network graph, (1) how everything is connected and (2) active and past proposals.

## Network: two views, colour families, layout (owner, 2026-11-26)

- **Two views:** "Connections" (who is tied to whom; the default) and "Proposals" (filers → proposals → companies; All, Active or Past). The view is kept in the URL as `graph=`. The Policymaker lens opens on Proposals. Plan docs/plans/2026-11-26-network-views.md; plan R1 68, result R1 76. The result R1 fixes went in after that review and were not re-reviewed.
- **Colour families:** investors and advocates are green-blue; companies and labs pink-orange-red; proposals and asks yellow; policy neutral.
- **Tool buttons:** "Show all", "My holdings" and "Show asks not yet filed" are square grey tool buttons.
- **Layout:** a spread-out rounded rectangle that stays aligned to the column headings.
- **Value chain naming:** headings name it ("AI value chain, from chips to AI products"), never "the chain".
- **Check:** 168 passed; Lighthouse phone 100, desktop 95.

## Network key (owner, 2026-11-26)

The "only" links are gone. Clicking a type chip cycles it: shown → highlighted (the rest dims) → crossed off → shown. "Show all" resets. Proposal categories work the same way. Small and owner-directed, so it was not separately reviewed; a test covers the cycle.

## Lab pathways: routes to a lab (this round)

Plan docs/plans/2026-11-26-lab-routes.md, with Revision 2. The owner's question: which public companies are routes to Lab X, what kind of pull each has, and whether you can act there this season.

- **Routes table:** one row per company tied to the chosen lab (OpenAI by default). Columns:
  - Tie: group, type, as of, source, and flags;
  - Strength: the site's rating, 1–3;
  - US proxy rights and next filing deadline: open with days left, or passed, computed live;
  - Filers with AI proposals here: filings only, no exempt solicitations;
  - Related asks: the site's grouping by tie type;
  - Past support on related asks.

  Default sort is strongest tie, then open deadline. Phones get labelled cards with the deadline second.
- **Tie groups (site's reading):**
  - Owner = parent company.
  - Major shareholder = equity rated 3.
  - Board seat or observer.
  - Compute.
  - Chips.
  - Co-investor = equity rated 1–2.
  - Customer = distribution or commercial.
- **Findings list:**
  - "No AI proposals filed here yet", only for the 29 companies whose proposals are tracked;
  - companies by number of filers on record;
  - open deadlines.
- **Other sections:**
  - "Labs reached, by company" as blue HTML bars;
  - "Gaps in the tie data";
  - the map, below, with the filer column trimmed to the chosen lab and labels wrapped;
  - the All ties table, collapsed.
- **Labs that are listed themselves** (Anthropic as ANT; xAI inside SpaceX) show their own rights record.
- **Links to recheck:** links the data's gaps list flags are marked "URL to recheck (see gaps)".
- **Reviews:**
  - Plan R1: UX 72, data 64.
  - Result R1: UX 76, data 76.
  - Result R2: UX 84 PASS, data 90 PASS. Their remaining points were fixed after R2 (round cap) and not re-reviewed: the tie-sort phrase was reversed; faded map labels now stay readable (circles fade, text stays --ink-soft); filer lines are thinner on phones; the sort phrase survives a lab change; board seats have their own group; the wording polish was applied.

## Latest check

`npm run check` on `design/lab-routes` before the R2 polish: lint pass, build pass, Playwright 156 passed / 4 skipped, Lighthouse phone 100/100/100/100, desktop 100/100/100/98. Re-run after the polish: same result (156 passed, Lighthouse 100 / 98). Earlier rounds: Lighthouse 100 accessibility on both, performance 98 desktop / 99 phone.

## Next (UI session)

1. **"Engaged directly" edge** (data now on main, 7d8d694): add a legend entry and list its steps (date, title, source) in the network panel. Next UI task.
2. **graph.json grows to 790 nodes / 735 KB** with the census branch. Check load time and label density after the merge.
3. **Phase 3 follow-up:** show `pass_through_voting` (`offered` null means no program found on the pages checked, never "no").
4. **Value chain follow-ups:** per-tier outcomes aren't in the data yet; `asks_made` and `active_filers` are capped at 12, and true totals would let the heatmap show them.

## Queue (found, not picked up)

1. **Two-step routes to a lab** (owner, 2026-11-26) using `data/value_chain_ties.json`, e.g. TSMC → Nvidia → OpenAI. Show as "two-step route", with both ties sourced.
2. **Investor side of Lab pathways** (owner, 2026-11-26) once 13F holdings are collected: which funds hold the route companies. Data session first.
3. **Policy coverage rows need a person's sign-off** (`reviewed: false` on all 25).
4. **Fund votes follow-ups:**
   - 125 near-miss votes listed in `near_misses` to confirm (more now that every filing is read);
   - Meta 2026 Item 3 is marked "Needs checking";
   - peer rows were checked against proposal titles and meeting dates by the data session (all matched), not reviewed by a person;
   - `series` is empty in every N-PX record, so a fund's votes across filings can't be tied to the fund; duplicates are caught by identical share counts.
4b. **Census follow-ups** (data session): every census organization, person and proposal link was checked against its source on 2026-11-26 (fixes applied). Still open: ICCR's 2026 guide lists 8 AI-related resolutions at companies outside the 60 (CVS, Dominion, Equifax, Home Depot, Lowe's, Walmart; Loblaw is Canadian; Meta's antisemitism item fails the AI test); Fidelity's stewardship leads are named only in 2024 sources; Wellington names none; 32 PRI-platform vote declarations were left out as uneven; Carine Smith Ihenacho (NBIM) leaves at the end of 2026. Phone Lighthouse performance fell to 90 as graph.json grew to 782 nodes (bar 80): see queue 5.
5. **Performance:** self-host Inter, or split `graph.json`, if the data keeps growing (now more pressing; see Next 2).
6. **Causality time scale:** most events are 2025–26; a piecewise scale would give them room.
7. **Phone tables:** Company lookup's history and lab-tie tables are cramped at 390 px.
8. **Playwright still runs "dark" projects** although the site has one theme; dropping them halves test time.
9. **Network link contrast:** links are about 1.5:1 at 0.35 opacity. The panel and List view carry the same facts. This one is for the owner.
10. **Proposals tab has no filer filter**, so the network can't offer "Open its filings in Proposals".
11. **Sticky tab bar on phones** takes about 200 px and covers part of tall charts when scrolling (lab routes UX review R1 #9).
12. **The shared `sortableTable` puts `aria-sort="none"` on every sortable column.** Lab pathways strips it; the other tables still have it.
13. **Network "focus company of" edges** (data session) use the default line style, with no legend entry.

## Owner actions

- Confirm or change the Lighthouse bar (ADR 0002).
- Decide on queue items 6 and 9.
- Supply three positioning points with sources for PRODUCT.md, or say to drop that section.

# Shareholder Advocacy AI Landscape — current state

Rewritten in place, never appended. Hard cap 200 lines. Last updated 2026-11-27 (data session: SEC leads pulled weekly into the proposal records; board bug fixes).

## Sessions and branches (read this first)

**The live site is `main`**, published to https://sophiaquinlanware.github.io/shareholder-advocacy-ai-landscape/ on every push (`PAGES_ENABLED` = `"true"`, ADR 0001). Anything not on `main` is not on the site.

| Session | Owns | Branch | State |
|---|---|---|---|
| Data / backend ("Account linking") | `data/*.json`, `scripts/`, `SOURCES.md`, `.github/workflows/`, `.github/ISSUE_TEMPLATE/`, `planner.js`, `planner-tools.js`, `sim.js`, `campaigns.js`, `freshness.js`, `board.js` | none known | On `main`: 60 companies; rights maps for 29 US companies; 79 AI proposals; fund votes 414 rows; causality.json 195 events with `region` and optional `status`/`source_kind`; coverage.json 107 rows; 319 organizations, 413 people (156 added 2026-11-26 from employer pages, conference agendas, coalition webinars and exempt solicitations; review 88 PASS); 13F holdings (359 positions from 18 current 13F filers plus NBIM; 5 filers marked `not_current`; shares only, no options or notes; values in dollars; a price check prints outliers in the job log); pass-through voting by family. `graph.json` proposals merged from proposals.json carry `sec_id` (their proposals.json id). Planner walk-through fixes merged (a096592): filings from filers critical of ESG are marked and left out of support figures, non-US companies show their shareholder route, past deadlines no longer count as open. Grid support numbers leave them out too; `asks.json` asks carry `short_label` (shown on phones). |
| UI ("Shareholder advocacy AI landscape UI") | page files: `index.html`, `styles.css`, `app.js`, `graph.js`, `lenses.js`, `rules.js`, `roles.js`, `pathways.js`, `valuechain.js`, `causality.js`, `votes.js`, `scorecard.js`, `motion.js`, `motion-layer.js`, `quicksearch.js`, `DESIGN.md`, `tests/` | none open | Everything below is live. |
| Protocol setup | `AGENTS.md`, `CLAUDE.md`, checks, `docs/` structure | `docs-session-onboarding` (local) | Idle. |

**Owner's standing instructions (2026-11-25/26):** "Don't ask me any questions about publishing or next steps. Just continue until you complete the project." Then "finish everything". Merge to `main` once the check passes.

**Coordination:** both sessions append their own block at the end of `styles.css`; on a merge conflict keep both. Message the other session before editing `index.html` or `app.js` beyond your own view.

## Sections and views (7 sections, context then planning)

Deadlines and votes · Company profiles · AI value chain · Laws and rules · Proposals and results · Network and contacts · Plan and test. Laws and rules moved after the AI value chain (owner, 2026-11-26). Each section ends with a "Next:" link to the following one.

## Site-wide decisions in force

- **Look:** black and white, plain white page, **one blue #1f4e98** (tints where two blues must differ). Full-width hairlines under the header, section bar and views; the network graph is a full-width black band.
- **Type:** Schibsted Grotesk (self-hosted, preloaded, measured Arial fallback), regular weight throughout, grey uppercase tracked labels, site title "Shareholder advocacy towards responsible AI" (owner, 2026-11-26) at 34px (it is the page's largest paint; keep it still and large).
- **Names:** say which chain ("AI value chain, from chips to AI products"), never "the chain"; people are "Heads of stewardship and engagement".
- **Company roles (roles.js):** one classification everywhere.
- **Motion** (plan docs/plans/2026-11-26-motion.md, all stages live): Lenis + GSAP foundation, page headings reveal by line, count-ups, charts drawing in, row and step staggers, tab crossfade, skeletons, micro-interactions, scroll-progress bar, Cmd+K quick search, phone tables as cards. Transform and opacity only; nothing moves under reduced motion. Owner kept white, the grotesque and the visible page title over the brief's off-white, serif and hiding nav.

## Network graph (`#network`)

- **Two views:** Connections (default) and Proposals (All · Active · Past), in the URL as `graph=`; Policymaker opens on Proposals.
- **Colours by family:** investors blue, coalitions green, proposals neon yellow (#ffff1a, kept clear of the orange marks), companies pink → red → orange in value-chain order, people and policy neutral. A "Marks" key explains rings and flags on screen; direct engagements (Parnassus) list their steps.
- **Layout:** full-width black band of fixed height (`--strip-h`); graph and column headings centred on the full band (the panel floats over the right once something is chosen; before that its hint is grey text at the band's bottom right), fitted after a gentle off-screen settle; rounded-rectangle boundary aligned to column headings; plain wheel scrolls the page (pinch or Ctrl/⌘ + scroll zooms).
- **Key:** chips in rainbow order, cycling shown → highlighted → crossed off; "Show all ↺", "Your portfolio" and "Show asks not yet filed" are grey tool buttons. Resubmission mark is an orange dashed ring; marked nodes get collision room so rings never cover a small dot. Timeline slider is labelled as time ("the network as it stood at the end of <year>", Play builds it year by year).
- **Your portfolio:** load an investor's reported holdings (holdings.json) or tick companies, or paste tickers; stored in the browser only. Held companies are named and ringed white; their links and everything they connect to stay lit. A table under the graph lists each held company's frontier labs, AI proposals and upcoming ballots, who already files there, the next filing deadline and a "Plan an engagement" link. Not reviewed by agents.
- Plans: docs/plans/2026-11-26-network-views.md (plan R1 68; result R1 76, fixes applied, not re-reviewed).

## Prediction board (`#predict`, Plan and test)

Owner's request 2026-11-26; plan docs/plans/2026-11-26-prediction-board.md. People give a probability for each question's outcome; the site's base rate comes first; crowd forecasts are public on every question at all times (owner: "votes for the prediction market should always be open to the public"). 22 questions: 4 coming votes (support at or above a benchmark), 3 for the 2027 season (Jan to Jun meetings), the SEC rescission, an if/then pair on it, 12 coverage gaps (US-proxy companies with no AI proposal recorded in 2026).
- **Store:** `data/forecast-questions.json` is both store and output. A question is fixed when created; results freeze once set (`resolved_on`). `scripts/build_questions.py` only adds questions and updates results and crowd figures. Hand results (the SEC question, a vote postponed over 60 days) go in `data/forecast-resolutions.json` with `source_url` and optional `decided` (forecasts made on or after it don't count).
- **Posting:** GitHub issue form `.github/ISSUE_TEMPLATE/forecast.yml` (label `forecast`, created) → `.github/workflows/forecasts.yml` → `scripts/ingest_forecast.py` → `data/predictions.json`; the bot replies, closes and locks the issue and dispatches `refresh.yml` with `task=publish` (skips the refresh job, deploys). Free text stays on the issue, not in site data. Forecasters who declare a stake are kept but left out of the crowd and the ranking.
- **Crowd:** a group counts at 3 or more forecasters (smaller groups pooled; the pool counts at 3); headline = mean of group medians when two groups qualify, else the median of everyone. Ranking by skill against the site's base rate, at 3+ resolved.
- **Reviews:** UX/legal R1 72, R2 84 PASS; data R1 58, R2 76 (fixes applied after the last round, not re-reviewed). Tests use `tests/fixtures/forecast-questions.json`.
- **Taking part (2026-11-27):** a "How to take part" panel (1 forecast a question, 2 put a proposal on the board); "Suggest a proposal" opens `.github/ISSUE_TEMPLATE/suggest-question.yml` (label `question-suggestion`, created; not auto-added: the maintainer checks the source and adds the question to `data/forecast-curated.json`). Plan an engagement has "Put this plan on the Prediction board", prefilled with company and ask. "Your forecasts" sits at the top; your cards glow; the default view ranks most likely first (crowd, else site estimate, else your own figure).
- **Curated questions:** Microsoft absolute water withdrawal target by June 30, 2028; Parnassus named lead on Microsoft in Ceres' VWFI by June 30, 2027; the if/then pair. Green "Parnassus Investments seat" scenario figures (15%, 35%, 22% if Ceres, 12% if not), written by this site, not counted, not Parnassus's view; "Try the seat's figures as your own" copies them into the viewer's browser. Resolved by hand.
- **Not tested live:** the workflow has not run on GitHub yet; the first real forecast will show whether the issue-form prefill, labels and bot permissions work.

## SEC leads (`scripts/sec_leads.py`, weekly in refresh.yml)

Rule 14a-8(j) notices (the SEC's list; the official record of planned exclusions since staff stopped responding on August 14, 2026) and EDGAR full-text search of PRE/DEF 14A for AI terms inside a proposal's request clause. Leads at tracked companies go straight into `data/proposals.json` (excluded from a notice, or upcoming from a proxy filed in the last 120 days), with `reviewed: false`; the proposals table and the planner label them "found automatically in the SEC record, not yet reviewed". Other leads stay in `data/sec_leads.json`. First run (2026-11-27): 15 notices, 4 at Apple, none about AI; every AI request clause found at a tracked company was already recorded; one lead outside scope (Walmart, AI and workforce, 2026). Locally the SEC needs `SSL_CERT_FILE` set to certifi's bundle (python.org builds lack certificates).

## Plan an engagement (`#planner`)

`planner-docs.js` (UI session) adds "Evaluate the level of escalation" (seven rungs, what's on record at this company for this ask, nothing recommended) and "Draft a document and save it as a PDF" (email, board letter, coalition invitation, Rule 14a-8 proposal with a 500-word count, engagement plan; numbered sources; print layout prints the draft only). Plan docs/plans/2026-11-27-planner-escalation-docs.md. Dates use `window.DATES.long`; `planner.js` is released back to the data session.

## Lab pathways (`#pathways`)

Routes table per lab (tie, strength, rights and deadline, filers, related asks, past support), findings, labs-reached bars, gaps, value-chain map, plus **two-step routes** and **investors holding the route companies** (new this round, not separately reviewed). Plan docs/plans/2026-11-26-lab-routes.md (result R2 UX 84, data 90 PASS).

## Laws and rules (`#causality`)

195 events; filters for region, jurisdiction (narrows to the region) and legal status; status marks on every node with a key; lanes grow with their events; lane names stay pinned; month labels carry the year. Not separately reviewed.

## Figures

Every chart is screenshot-ready (title, measure, count, years, key, source), except the network: its band stays nodes-only, and a "Key" button opens the key panel. The causal map is an open, full-width workspace. The value chain draws in on scroll, and tapping a tie traces its path in orange. Loading a fund under "Your portfolio" makes that fund glow. The simulator charts (sim.js, data session) have been asked for the same frame. Plain tab names, no counts in tabs. Not reviewed by agents.

## Latest check

`npm run check` on design/board-posting before merge: lint pass, build pass, Playwright 332 passed; Lighthouse phone 94/100/100/100, desktop 90/100/100/100.

## Queue (found, not picked up)

1. **Policy coverage rows need a person's sign-off** (`reviewed: false` on all 107). China suspensions end January 2027: recheck then.
2. **Fund votes:** 125 near-miss votes to confirm; Meta 2026 Item 3 "Needs checking"; N-PX `series` is empty, so a fund's votes can't be tied across filings.
3. **Planner follow-ups (data session):** resubmission rule on a company's own past votes; dated engagement log; benchmark crosswalk needs `benchmarks.json`.
4. **Census follow-ups (data session):** 8 ICCR AI resolutions at companies outside the 60; Fidelity and Wellington leads; NBIM's Carine Smith Ihenacho leaves end of 2026.
5. **Performance:** `graph.json` is ~790 nodes / 735 KB; split or load it lazily if it grows further.
6. **Value chain:** per-tier outcomes aren't in the data; `asks_made` and `active_filers` are capped at 12.
7. **Proposals tab has no filer filter**, so the network can't link "Open its filings in Proposals".
8. **Network link contrast** (about 1.5:1); the panel and List view carry the same facts. For the owner.
9. **Playwright still runs "dark" projects** although the site has one theme; dropping them halves test time.
10. **Network "focus company of" edges** use the default line style, with no key entry.
11. **Sweep leftovers (owner or either session):** one date format site-wide; "Alphabet (Google)" in the scorecard; people `ai_focus` "no AI work found" phrasing varies; causality `jurisdiction` labels; percentage precision; the type label "anti-ESG proponent" (network.json) vs the planner's "critical of ESG" (owner to choose); site.json levers sentence "vote against the directors" sits near the no-vote-recommendation rule (owner to glance); value-chain tier names (three variants); Warner Bros. Discovery has no ticker or route; Zhipu ticker "2513" vs MiniMax "00100"; Pathways says "as of 2026Q3" while NBIM is June 30, 2026; sources that would not load for checking: it-rome-court-annuls-openai-fine, coe-ai-convention-eu-ratifies, au-guardrails-proposal, cn-rare-earth-chip-controls suspension, 3 people pages.
12. **Publishing quirk:** a deploy that fails with "No artifacts named github-pages" or "Multiple artifacts" succeeds when the whole workflow run is re-run (not only the failed job).
13. **Reviews owed:** Your portfolio, planner drafts and escalation, this round's motion stages 3–10, Lab pathways two-step routes and holders, and the Laws and rules filters were checked by tests and screenshots but not by review agents.

14. **Prediction board follow-ups:** proxy-advisor questions (recommendations aren't reliably public); per-proposal exclusion and withdrawal questions once 2027 filings are recorded; ask A vs ask B conditionals; calibration chart and season write-up; LMSR "scenario" sandbox; a route for forecasters without GitHub (Tally or similar); a structured `withdrawal_reason` instead of keyword matching; a link for the Wolfers and Zitzewitz citation. Pre-existing: `task=fund-votes` also republishes the site.
15. **People follow-ups:** network.json records for `allianz-global-investors`, `jpmorgan-am`, `dimensional-fund-advisors`, `robeco`; rename "Church of England Pensions Board (National Investing Bodies)" so it isn't read as including the Church Commissioners; own-site source URLs for 11 organizations sourced to agendas; newer profile URLs for olga-hancock, adam-c-t-matthews, richard-manley; AI lines that describe firm work (Green Century, NYC Comptroller staff, CalPERS directors). Not yet covered: Capital Group, Fidelity, BlackRock, State Street, Nuveen, Calvert, Natixis, Generation IM, Columbia Threadneedle, DWS, Nordea, Parnassus staff; labor funds (AFL-CIO, Teamsters, AFSCME, SEIU), LGPS Central, AP7, HESTA, AustralianSuper, Nathan Cummings Foundation; PRI in Person 2024 and CII agendas.

## Owner actions

- **Before inviting forecasters beyond a small pilot:** have counsel look at the Prediction board (spec's coordination risk: proxy solicitation and "group" rules).
- **SEC question:** enter its result by hand in `data/forecast-resolutions.json` (with `source_url`, and `decided` if the vote comes before forecasts close on December 31, 2026); both if/then questions wait on it.

- Confirm or change the Lighthouse bar (ADR 0002).
- Decide on queue item 8.
- Supply three positioning points with sources for PRODUCT.md, or say to drop that section.

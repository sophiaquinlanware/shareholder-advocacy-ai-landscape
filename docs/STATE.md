# Shareholder Advocacy AI Landscape — current state

Rewritten in place, never appended. Hard cap 200 lines. Last updated 2026-11-26 (data session: planner walk-through fixes, a096592; before that the UI session's "finish everything" round).

## Sessions and branches (read this first)

**The live site is `main`**, published to https://sophiaquinlanware.github.io/shareholder-advocacy-ai-landscape/ on every push (`PAGES_ENABLED` = `"true"`, ADR 0001). Anything not on `main` is not on the site.

| Session | Owns | Branch | State |
|---|---|---|---|
| Data / backend ("Account linking") | `data/*.json`, `scripts/`, `SOURCES.md`, `.github/workflows/`, `planner.js` | none known | On `main`: 60 companies; rights maps for 29 US companies; 79 AI proposals; fund votes 414 rows; causality.json 195 events with `region` and optional `status`/`source_kind`; coverage.json 107 rows; 277 organizations, 257 people; 13F holdings (373 positions, 23 investors, 28 companies); pass-through voting by family. `graph.json` proposals merged from proposals.json carry `sec_id` (their proposals.json id). Planner walk-through fixes merged (a096592): filings from filers critical of ESG are marked and left out of support figures, non-US companies show their shareholder route, past deadlines no longer count as open. |
| UI ("Shareholder advocacy AI landscape UI") | page files: `index.html`, `styles.css`, `app.js`, `graph.js`, `lenses.js`, `rules.js`, `roles.js`, `pathways.js`, `valuechain.js`, `causality.js`, `votes.js`, `scorecard.js`, `motion.js`, `motion-layer.js`, `quicksearch.js`, `DESIGN.md`, `tests/` | none open | Everything below is live. |
| Protocol setup | `AGENTS.md`, `CLAUDE.md`, checks, `docs/` structure | `docs-session-onboarding` (local) | Idle. |

**Owner's standing instructions (2026-11-25/26):** "Don't ask me any questions about publishing or next steps. Just continue until you complete the project." Then "finish everything". Merge to `main` once the check passes.

**Coordination:** both sessions append their own block at the end of `styles.css`; on a merge conflict keep both. Message the other session before editing `index.html` or `app.js` beyond your own view.

## Sections and views (7 sections, engagement order)

Deadlines and votes · Plan an engagement (`#planner`, data session) · AI value chain (Chips to AI products · Ties to each frontier lab) · Company profiles · Proposals and results (All AI proposals · How fund families voted · Results of private engagement) · Network and contacts (Network of investors, proposals and companies · Heads of stewardship and engagement) · Laws and rules. Every view keeps its old address. Views are folder tabs on a full-width line.

## Site-wide decisions in force

- **Look:** black and white, plain white page, **one blue #1f4e98** (tints where two blues must differ). Full-width hairlines under the header, section bar and views; the network graph is a full-width black band.
- **Type:** Schibsted Grotesk (self-hosted, preloaded, measured Arial fallback), regular weight throughout, grey uppercase tracked labels, site title "Shareholder advocacy on AI" at 34px (it is the page's largest paint; keep it still and large).
- **Names:** say which chain ("AI value chain, from chips to AI products"), never "the chain"; people are "Heads of stewardship and engagement".
- **Company roles (roles.js):** one classification everywhere.
- **Motion** (plan docs/plans/2026-11-26-motion.md, all stages live): Lenis + GSAP foundation, page headings reveal by line, count-ups, charts drawing in, row and step staggers, tab crossfade, skeletons, micro-interactions, scroll-progress bar, Cmd+K quick search, phone tables as cards. Transform and opacity only; nothing moves under reduced motion. Owner kept white, the grotesque and the visible page title over the brief's off-white, serif and hiding nav.

## Network graph (`#network`)

- **Two views:** Connections (default) and Proposals (All · Active · Past), in the URL as `graph=`; Policymaker opens on Proposals.
- **Colours by family:** investors blue, coalitions green, proposals yellow, companies pink → red → orange in value-chain order, people and policy neutral. A "Marks" key explains rings and flags on screen; direct engagements (Parnassus) list their steps.
- **Layout:** full-width black band of fixed height (`--strip-h`); graph laid out to the left of the floating panel, fitted after a gentle off-screen settle; rounded-rectangle boundary aligned to column headings; plain wheel scrolls the page (pinch or Ctrl/⌘ + scroll zooms).
- **Key:** chips cycle shown → highlighted → crossed off; "Show all", "My holdings" and "Show asks not yet filed" are grey tool buttons.
- Plans: docs/plans/2026-11-26-network-views.md (plan R1 68; result R1 76, fixes applied, not re-reviewed).

## Lab pathways (`#pathways`)

Routes table per lab (tie, strength, rights and deadline, filers, related asks, past support), findings, labs-reached bars, gaps, value-chain map, plus **two-step routes** and **investors holding the route companies** (new this round, not separately reviewed). Plan docs/plans/2026-11-26-lab-routes.md (result R2 UX 84, data 90 PASS).

## Laws and rules (`#causality`)

195 events; filters for region, jurisdiction (narrows to the region) and legal status; status marks on every node with a key; lanes grow with their events; lane names stay pinned; month labels carry the year. Not separately reviewed.

## Latest check

`npm run check` on `fix/planner-walk` (a096592, on top of be75dab): lint pass, build pass, Playwright 224 passed; Lighthouse phone 100/100/100/98, desktop 100/100/100/93. Desktop performance varies between runs on this machine for the same build (the data session saw 53–98); rerun before chasing a low score.

## Queue (found, not picked up)

1. **Policy coverage rows need a person's sign-off** (`reviewed: false` on all 107). China suspensions end January 2027: recheck then.
2. **Fund votes:** 125 near-miss votes to confirm; Meta 2026 Item 3 "Needs checking"; N-PX `series` is empty, so a fund's votes can't be tied across filings.
3. **Planner follow-ups (data session):** resubmission rule on a company's own past votes; grid ask labels take three lines on phones; the grid's highest-support number still includes filings from filers critical of ESG (its label says so); dated engagement log; benchmark crosswalk needs `benchmarks.json`.
4. **Census follow-ups (data session):** 8 ICCR AI resolutions at companies outside the 60; Fidelity and Wellington leads; NBIM's Carine Smith Ihenacho leaves end of 2026.
5. **Performance:** `graph.json` is ~790 nodes / 735 KB; split or load it lazily if it grows further.
6. **Value chain:** per-tier outcomes aren't in the data; `asks_made` and `active_filers` are capped at 12.
7. **Proposals tab has no filer filter**, so the network can't link "Open its filings in Proposals".
8. **Network link contrast** (about 1.5:1); the panel and List view carry the same facts. For the owner.
9. **Playwright still runs "dark" projects** although the site has one theme; dropping them halves test time.
10. **Network "focus company of" edges** use the default line style, with no key entry.
11. **Publishing quirk:** a deploy that fails with "No artifacts named github-pages" or "Multiple artifacts" succeeds when the whole workflow run is re-run (not only the failed job).
12. **Reviews owed:** this round's motion stages 3–10, Lab pathways two-step routes and holders, and the Laws and rules filters were checked by tests and screenshots but not by review agents.

## Owner actions

- Confirm or change the Lighthouse bar (ADR 0002).
- Decide on queue item 8.
- Supply three positioning points with sources for PRODUCT.md, or say to drop that section.

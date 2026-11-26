# Shareholder Advocacy AI Landscape — current state

Rewritten in place, never appended. Hard cap 200 lines. Last updated 2026-11-26 (UI session: Lab pathways rebuilt as routes to a lab).

## Sessions and branches (read this first)

**The live site is `main`**, published to https://sophiaquinlanware.github.io/shareholder-advocacy-ai-landscape/ on every push (`PAGES_ENABLED` = `"true"`, ADR 0001). Anything not on `main` is not on the site.

| Session | Owns | Branch | State |
|---|---|---|---|
| Data / backend ("Account linking") | `data/*.json`, `scripts/`, `SOURCES.md`, `.github/workflows/` | `data/census-coalitions` (awaiting its data review) | On `main`: 60 companies with tiers; rights maps for 29 US companies; value chain (44 ties); 76 AI proposals at the 29 US-proxy companies (from 2023) with `ask_id` and `category`; fund votes (331 rows); coverage.json (25 rows, all `reviewed: false`); Ceres, VWFI and IIGCC. The census branch brings 289 organizations, 263 people, `proposal_links`, and a new "engaged directly" edge (Parnassus → 6 companies, with steps). |
| UI ("Shareholder advocacy AI landscape UI") | page files: `index.html`, `styles.css`, `app.js`, `graph.js`, `lenses.js`, `rules.js`, `roles.js`, `pathways.js`, `valuechain.js`, other view JS, `DESIGN.md`, `tests/` | `design/lab-routes` → merged to `main` when its check passes | Live: lens Phases 1–4, Value chain tab, proposal categories, company roles site-wide, "AI advocacy network". |
| Protocol setup | `AGENTS.md`, `CLAUDE.md`, checks, `docs/` structure | `docs-session-onboarding` (local) | Idle. |

**Owner's standing instruction (2026-11-25):** "Don't ask me any questions about publishing or next steps. Just continue until you complete the project." Merge to `main` once the check and reviews pass.

## Tabs (12)

Upcoming votes · Company lookup · Proposals · Fund votes · Rights map · AI advocacy network (`#network`, formerly Co-filer network) · Contacts · Lab pathways · Value chain · Policy and causality · Disclosure scorecard · New filings.

## Site-wide decisions in force

- **Look:** black and white with blue for visuals, on plain white. The network graph alone has a dark Obsidian-style canvas.
- **Company roles (roles.js):** one classification everywhere: Frontier labs; Chips and hardware; Data centers and power; Cloud and model platforms; Consumer products; Business and government products; Strategic investors. Plan docs/plans/2026-11-26-company-roles.md.
- **Network legibility:** labels never overlap; the selected label sits on a blue pill; key "only" and "Show all" controls; year scrubber (`upto=`).
- **Lenses:** Impact, Individual, Policymaker (phases 1–4). Plans are in docs/plans/2026-11-25-lens-phase1/2 and 2026-11-26-lens-phase3/4.

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

1. **"Engaged directly" edge** (data session, branch `data/census-coalitions`): add a legend entry and list its steps (date, title, source) in the network panel. Wait for the branch to merge.
2. **graph.json grows to 790 nodes / 735 KB** with the census branch. Check load time and label density after the merge.
3. **Phase 3 follow-up:** show `pass_through_voting` (`offered` null means no program found on the pages checked, never "no").
4. **Value chain follow-ups:** per-tier outcomes aren't in the data yet; `asks_made` and `active_filers` are capped at 12, and true totals would let the heatmap show them.

## Queue (found, not picked up)

1. **Two-step routes to a lab** (owner, 2026-11-26) using `data/value_chain_ties.json`, e.g. TSMC → Nvidia → OpenAI. Show as "two-step route", with both ties sourced.
2. **Investor side of Lab pathways** (owner, 2026-11-26) once 13F holdings are collected: which funds hold the route companies. Data session first.
3. **Policy coverage rows need a person's sign-off** (`reviewed: false` on all 25).
4. **Fund votes follow-ups:**
   - 18 near-miss votes to confirm;
   - Meta 2026 Item 3 is marked "Needs checking";
   - peer families have not been reviewed row by row;
   - Praxis and Domini 2025–26 N-PX filings are text only.
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

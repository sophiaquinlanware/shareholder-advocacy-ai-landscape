# Shareholder Advocacy AI Landscape — current state

Rewritten in place, never appended. Hard cap 200 lines. Last updated 2026-11-25 (UI session, lens Phase 2).

## Sessions and branches (read this first)

**The live site is `main`**, published to https://sophiaquinlanware.github.io/shareholder-advocacy-ai-landscape/ on every push (`PAGES_ENABLED` = `"true"`, ADR 0001). Anything not on `main` is not on the site.

| Session | Owns | Branch | State |
|---|---|---|---|
| Data / backend ("Account linking") | `data/*.json`, `scripts/`, `SOURCES.md`, `.github/workflows/` | none open | On `main`: 60 companies with tiers; rights maps for 29 US companies; value chain (44 ties, `per_tier`); AI proposals at all 29 US-proxy companies (76, from 2023), `vote_history` (16 linked), filing deadlines (75 proposals) and `next_proposal_deadline` with open/passed status (27 companies), recomputed weekly by `scripts/build_proposal_links.py`. `seeking` is empty: no public calls for co-filers found. |
| UI ("Shareholder advocacy AI landscape UI") | page files: `index.html`, `styles.css`, `app.js`, `graph.js`, `lenses.js`, `rules.js`, the other view JS files incl. `votes.js`, `DESIGN.md`, `tests/` | `design/lens-phase2` (merged to `main` when its reviews pass; the owner said to publish without asking) | Lens Phase 1 live; Phase 2 built (see "Lens system" below). Next: lens Phase 3 (Individual investor feed), Phase 4 (Policymaker), then the value-chain and engagement maps. |
| Protocol setup | `AGENTS.md`, `CLAUDE.md`, checks, `docs/` structure | `docs-session-onboarding` (local) | Idle. |

**Data contract:** views read only `data/*.json`.
- **Company fields:** `sectors`, `basis_type`, `engagement_basis` {text,url} (shown as "Why included"), `owner_choice_note`, `shareholder_route` + `route_source_url` or `route_note`, `rights_tracked`, `source_note`. Companies are keyed by `id`, because private companies have no ticker.
- **Proposal fields:** `status_reason`, `status_source_url`, `proponent`, `proponent_source_url`, `meeting_date_source`, `results_note`, `support_note`.

## Phase

**Round 2 (structure, wording and look) is merged and live.** Plan: docs/plans/2026-11-25-round2-structure.md (revisions 2–3 quote the owner).

**Tabs (11, task order):**
1. Upcoming votes (`#upcoming`)
2. Company lookup
3. Proposals
4. Fund votes (`#votes`, unchanged link)
5. Rights map
6. Co-filer network
7. Contacts
8. Lab pathways
9. Policy and causality
10. Disclosure scorecard
11. New filings

**Owner decisions recorded (2026-11-25):**
- Plain header ("Yes, plain header").
- Why now folded into Policy and causality; How you can weigh in and Data center water removed ("Yes, as described"). Old links redirect.
- Internal, scenario-led tool.
- Look: "largely just black and white, but where necessary, there is blue … all the visuals should be blue", on plain white ("Have it plain white, not some off-white background").
- The network uses saturated distinct colours per node type, a grouped 2D layout and an Obsidian-style Graph settings panel.

**Protocol deviation:** this round mixes structure and colour/type (AGENTS.md rule 27.3), because the owner directed both during the build.

## Latest check (2026-11-25, `design/round2-structure` before merge)

| Step | Result |
|---|---|
| Lint | pass: 0 errors |
| Build | pass: 16 data files |
| Tests: 11 tabs × 1440/390 px × light/dark, load errors, local links, script errors when a tab opens (new) | **24/24 pass**; also 24/24 with `data/company-universe`'s 60-company `companies.json` swapped in |
| Lighthouse phone | accessibility 100, best practices 100, SEO 100, **performance 99** (bar 80) |
| Lighthouse desktop | accessibility 100, best practices 100, SEO 100, **performance 76** (bar 80) |
| Layout shift (CLS) | 0.04 phone, 0.01 desktop (was 0.44–0.81). Fix: `main` reserves a screen of height. |
| Largest paint | about 6.8s simulated. The first tabs now draw from 4 small files, with d3 async and the site scripts deferred. What's left is the font and data request chain (queue 3). |

## Latest review scores (round 2)

| Field | Plan R1 | Result R1 | Result R2 |
|---|---|---|---|
| UX / content | 76 REVISE | 74 REVISE | 80 PASS |
| Visual design | 72 REVISE | 74 REVISE | 78 REVISE (round cap reached). After R2: causality axis bug fixed, chart opens at the latest events, lanes 70px; network label declutter added. Not re-reviewed. |
| Accessibility | 72 REVISE | 86 PASS | not needed |
| Data accuracy | 68 REVISE | 76 REVISE | 84 PASS. Its minor content fault ("company reports N on another basis") was reworded to "N with a basis note or caveat (see notes)" after R2; not re-reviewed. |

**Network node key by value-chain tier** (owner, after R2): "Instead of 'company,' have 'Frontier AI Labs,' 'hyperscalers,' 'chip builders' … coordinate with the other chat". Built to read `tier` from graph.json, with labels verbatim from the data session. It shows "Company (tier not yet assigned)" until `data/value-chain` merges. Tested with that branch's data: 24/24 pass.

## Lens system (Co-filer network)

The owner's spec has four phases, and each phase gets its own plan and reviews in docs/plans and docs/reviews. **The owner said on 2026-11-25: "Don't ask me any questions about publishing or next steps. Just continue until you complete the project."** So each phase merges to `main` once its check and reviews pass.

- **Phase 1 (live since 4e96e7d):**
  - "View as" lenses (`lenses.js`) and edge confidence (`rules.js`);
  - "What you can do";
  - keyboard nodes;
  - labels off until a node is selected;
  - the dark Obsidian-style canvas.
- **Phase 2 (Impact investor; plan docs/plans/2026-11-25-lens-phase2.md, Revision 2 plus build notes):**
  - **Deadline rings:** a countdown arc from company `next_proposal_deadline`, about 22 companies live. Proposal `filing_deadline` dates are past once a proposal is on the ballot.
  - **Seeking asks:** no live data yet; "exempt solicitation" asks are hidden by design (Never claim 1).
  - **Resubmission marks:** thresholds 5/15/25 in `rules.js`, flagged "verify". Vote chains are joined across nodes. 9 proposals are flagged live. Every line says the earlier votes are matched in this dataset.
  - **My holdings:** kept in this browser only.
  - **Topics not filed:** gap nodes scoped to companies with AI proposals in this dataset.
  - **Find a path to…:** breadth-first search with labelled hops.
- **Owner decision to confirm:** exempt-solicitation seeking asks, and the owner's example action "Write an exempt solicitation", are not shown. The site states "No exempt solicitation on file for this vote" instead.
- **Performance:** desktop fell to 75 when the larger data merged; loading Inter without blocking brought it to 98.
- **Phase 2 check (merged with main 64271e1):** 88 passed, 4 skipped (keyboard tests at desktop only); Lighthouse 100/100/100/100 phone, 100/100/100/98 desktop.
- **Phase 2 reviews:**
  - plan R1: UX 68, accessibility 74, data 62, all REVISE; Revision 2 followed.
  - result R1: UX 74, accessibility 84 PASS, data 70.
  - result R2: UX 84 PASS, data 86 PASS. Their remaining points were fixed after R2 and not re-reviewed: the ring reads as the threshold after the vote, "Close to the N% threshold", a refile goes to the meeting after the company's open deadline, and "at the threshold" covers a 0-point margin.

## Next (UI session)

1. **Lens Phase 3 (Individual investor):**
   - a feed first: tickers or fund in, upcoming AI proposals out, with `plain_summary` (falling back to the title), vote date and source;
   - fund N-PX votes and `pass_through_voting` where the data has them;
   - "See the bigger picture" opens the graph with holdings applied;
   - hover definitions in this lens only.
2. **Lens Phase 4 (Policymaker):** clusters by topic, sized by how often an ask recurs; `coverage` on topic-to-policy edges.
3. **Value-chain map and engagement map** from `data/value_chain.json` (`ties`, `per_tier`).

## Queue (found, not picked up)

1. **Fund votes follow-ups.** Fund votes now cover all 29 US-proxy companies (331 rows).
   - (a) 18 near-miss votes sit in `data/fund_votes.json` `near_misses` for a person to confirm.
   - (b) Meta 2026 Item 3 stays "Needs checking": the proxy shows Items 3 and 11 are distinct AI-data proposals that some fund filings describe the same way (reason in `held_back_reasons`).
   - (c) Peer families are not reviewed row by row (shown with †).
   - (d) Praxis and Domini 2025-26 file N-PX as text only.
2. **Performance:** fixed for now: Inter loads without blocking (desktop 98). Self-hosting Inter, or splitting the 383 KB `graph.json`, would help if the data keeps growing.
3. **Causality time scale:** most events fall in 2025–26. A piecewise time scale would give them more room.
4. **Phone tables:** Company lookup's history and lab-tie tables are cramped at 390px. Stack or drop low-value columns on phones (UX R2).
5. **Playwright still runs a "dark" project** although the site has one white theme. Drop the dark projects in `playwright.config.js` to halve test time.
6. **Network link contrast:** links are `--blue-3` at 0.35 opacity (about 1.5:1). The dotted "inferred" lines are hard to tell from dashed membership lines at 1px. The panel and List view carry the same facts as text. Raising the opacity makes the graph busier, so it's for the owner (accessibility R1).
7. **Proposals tab has no filer filter**, so the network can't offer "Open its filings in Proposals".

## Owner actions

- Confirm or change the Lighthouse bar (ADR 0002).
- Decide on queue items 3 and 7.
- Supply three positioning points with sources for PRODUCT.md, or say to drop that section.

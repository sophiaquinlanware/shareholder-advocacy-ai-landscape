# Shareholder Advocacy AI Landscape — current state

Rewritten in place, never appended. Hard cap 200 lines. Last updated 2026-11-25 (UI session, lens Phase 1 on branch, not merged).

## Sessions and branches (read this first)

**The live site is `main`**, published to https://sophiaquinlanware.github.io/shareholder-advocacy-ai-landscape/ on every push (`PAGES_ENABLED` = `"true"`, ADR 0001). Anything not on `main` is not on the site.

| Session | Owns | Branch | State |
|---|---|---|---|
| Data / backend ("Account linking") | `data/*.json`, `scripts/`, `SOURCES.md`, `.github/workflows/` | `data/value-chain` (open) | On `main` since this merge: 60 companies (`data/companies.json`, owner kept all), value-chain tiers (`data/value_chain.json`, `tier`/`tiers` on companies and graph nodes), ownership for 9 private labs. Open on `data/value-chain`: rights maps for 22 more US companies (commit a1f5649, in data accuracy review) and value-chain ties plus per-tier facts (in research). |
| UI ("Shareholder advocacy AI landscape UI") | page files: `index.html`, `styles.css`, `app.js`, the view JS files incl. `votes.js`, `DESIGN.md`, `tests/` | `design/lens-phase1` (pushed, **not merged**; waits for the owner's go-ahead) | Round 2 live. Lens Phase 1 built and checked on the branch; see "Lens Phase 1" below. Next: lens Phase 2 after the owner's go-ahead, and the value-chain and engagement maps (data now on `data/value-chain`). |
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

## Lens Phase 1 (branch `design/lens-phase1`)

Plan: docs/plans/2026-11-25-lens-phase1.md (Revision 2, plus Build notes).
- Co-filer network: a "View as" choice of Impact investor, Individual investor or Policymaker, kept in `?lens=` and in localStorage.
- `lenses.js` holds each lens's layers, size, rings, actions and measure. `rules.js` holds the edge-confidence domain list.
- The "What you can do" block; edge confidence (verified / reported / inferred); keyboard node navigation; a List view of every visible node.
- Labels are off by default and show on select (owner, mid-build).
- **Dark Obsidian-style graph canvas** (owner, mid-build): `--g-bg` #1e1e1e, bright `--gn-*` node colours (6:1 or more), grey-blue links. The page stays white; Lab pathways keeps `--n-*`.
- **Bug fixed:** since round 2, tabs no longer wrote `#hash` to the address bar, because `app.js`'s `history()` replaced `window.history`. It is now `voteHistory()`, with a test.
- **Check (merged with origin/main):** lint 0 errors; 54 passed, 2 skipped (keyboard test at desktop only); Lighthouse 100/100/100 for accessibility, best practices and SEO, performance 100 phone / 90 desktop.
- **Reviews:** R1 UX 72, accessibility 83 PASS, data 76. R2 UX 86 PASS, data 88 PASS. The dark canvas came after R2 and has not been reviewed.

## Next (UI session)

1. **Lens Phase 2** after the owner's go-ahead: open-window aura, seeking aura, resubmission flags (thresholds in `rules.js`), holdings overlay, gap finder, warm path.
2. **Value-chain map and engagement map:** `data/value_chain.json` `ties` and `per_tier` exist on `data/value-chain`. Show its `derived_note` caveat: proposal counts cover the original 7 companies only.

## Queue (found, not picked up)

1. **Fund votes follow-ups.**
   - (a) 14 near-miss votes sit in `data/fund_votes.json` `near_misses` for a person to confirm.
   - (b) Meta 2026 "AI data usage oversight" is held back.
   - (c) Peer families are not reviewed row by row.
   - (d) Praxis and Domini 2025-26 file N-PX as text only.
   - (e) The data accuracy R2 fixes there were not re-reviewed.
2. **Secondary sources for status reasons:** the Amazon and Apple withdrawal/exclusion reasons cite minerva.info. PRODUCT.md Never claim 4 prefers primary sources (SEC no-action letter or proxy).
3. **Performance under 80:** the remaining cost is the Google Fonts and data request chain and the 306 KB `graph.json`. Options: self-host Inter, preload the first data files, split graph.json. These change how the page loads, so they're for the owner to decide.
4. **Causality time scale:** most events fall in 2025–26. A piecewise time scale would give them more room.
5. **Phone tables:** Company lookup's history and lab-tie tables are cramped at 390px. Stack or drop low-value columns on phones (UX R2).
6. **Outside links to check by hand:** an SEC comment PDF (`data/causality.json`); www.omiusa.org and www.harringtoninvestments.com (`data/graph.json`).
7. **Deploy publishes the whole repo** (`path: .` in refresh.yml). It could publish `dist/` instead; this is the owner's call.
8. **Playwright still runs a "dark" project** although the site has one white theme. Drop the dark projects in `playwright.config.js` to halve test time.
9. **Network link contrast:** links are `--blue-3` at 0.35 opacity (about 1.5:1). The dotted "inferred" lines are hard to tell from dashed membership lines at 1px. The panel and List view carry the same facts as text. Raising the opacity makes the graph busier, so it's for the owner (accessibility R1).
10. **Data, for the data session:** graph.json and proposals.json support values differ slightly (33.57 vs 33.58). Item 6 at Microsoft 2026 is "Social & economic impacts" in graph.json but "Data center impacts" in upcoming.json.
11. **Proposals tab has no filer filter**, so the network can't offer "Open its filings in Proposals".

## Owner actions

- Confirm or change the Lighthouse bar (ADR 0002).
- Decide on queue items 3 and 7.
- Supply three positioning points with sources for PRODUCT.md, or say to drop that section.

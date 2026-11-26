# Shareholder Advocacy AI Landscape — current state

Rewritten in place, never appended. Hard cap 200 lines. Last updated 2026-11-25.

## Phase

The **blue-green restyle, round 1 of 2 (colour and type only)**, is merged to `main` (plan: docs/plans/2026-11-25-blue-green-restyle.md). It covers:
- new tokens in both themes, with a light-blue accent and a teal-green open status;
- Inter Tight headings;
- 14px radii;
- focus outlines and reduced motion;
- thin, curved graph lines;
- graph palettes at 3:1 or more;
- a hatched or outlined scorecard state.

Wording, chart types and data are unchanged. **Round 2 (structure and wording) is next** and needs the owner's go-ahead. See "Round 2 brief" below.

**Fund votes tab** (Form N-PX), merged 2026-11-25 from branch `data/fund-votes` with the owner's go-ahead: 8 fund families (BlackRock iShares, Calvert, Domini, Green Century, Impax, Parnassus, TIAA-CREF, Vanguard) on the AI proposals voted July 2023 to June 2026, 298 family-by-proposal rows. Data pipeline: `scripts/npx_votes.py` (manual "fund-votes" task in refresh.yml, needs `SEC_USER_AGENT`) → run artifact → `scripts/publish_fund_votes.py` → `data/fund_votes.json`; reviewed rows in `data/fund_votes_reviewed.json` (Parnassus, 39, owner, 2026-11-25). Plan: docs/plans/2026-11-25-fund-votes.md.

Before that: the working protocol (AGENTS.md) and the check suite (`npm run check`) were set up. The disclosure scorecard tab and the fund-vote (N-PX) review script landed the same day.

## Live

- Code on GitHub: `sophiaquinlanware/shareholder-advocacy-ai-landscape`, branch `main`.
- Public site: https://sophiaquinlanware.github.io/shareholder-advocacy-ai-landscape/. The repo variable `PAGES_ENABLED` is `"true"` (set 2026-11-26 01:03 UTC, ADR 0001), so every push to `main` republishes the site through `refresh.yml`.
- Weekly refresh: every Monday 13:00 UTC, `.github/workflows/refresh.yml` runs the EDGAR scripts and commits `data/` to `main`.
- The reference design for the client-facing UI is the owner's private Claude Design canvas "AI Landscape Client UI". It has four screens: Home, Influence pathways, Microsoft profile and Proposal feed.

## Latest check (2026-11-25, branch `design/blue-green-restyle` before merge)

| Step | Result |
|---|---|
| Lint (Biome + Python compile) | pass: 0 errors, 43 warnings. `useButtonType` is an error again, and all tab buttons have `type="button"` (old queue item 5 closed). |
| Build | pass: 12 data files valid, all linked files present |
| Layout: 11 tabs × 1440/390 px × light/dark | pass: no overlapping text, no sideways scrolling |
| Load errors and local links | **fail**: the same 8 as before, from queue items 1 and 2 only |
| Lighthouse phone | accessibility 100, best practices 96, SEO 100, **performance 77** (bar 80; was 76) |
| Lighthouse desktop | accessibility 100, best practices 96, SEO 100, **performance 57** (bar 80; was 60, within run-to-run noise) |
| Layout shift (CLS) | phone 0.44, desktop 0.493 (was 0.49). The font swap adds about 0.01; the rest is queue item 3. |
| Web-font bytes (latin woff2, measured) | 93,348 (was 170,600 with Source Serif 4): −45% |

## Latest check (2026-11-25, merge of `data/fund-votes` into `main`)

| Step | Result |
|---|---|
| Lint | pass (0 errors) |
| Build | pass |
| Tests: 12 tabs × 1440/390 px × light/dark, load errors, local links | **24/24 pass** (queue items 1 and 2 fixed in data) |
| Lighthouse phone | accessibility 100, best practices 100, SEO 100, **performance 77** (bar 80) |
| Lighthouse desktop | accessibility 100, best practices 100, SEO 100, **performance 57** (bar 80) |

## Latest review scores (fund votes)

| Field | Plan R1 | Result R1 | Result R2 |
|---|---|---|---|
| Data accuracy | 62 REVISE | 72 REVISE | 78 REVISE → fixes applied after the round cap, not re-reviewed (owner approved publishing) |
| UX / content | 76 REVISE | 78 REVISE | 86 PASS |
| Accessibility | 74 REVISE | 82 PASS | not needed |

## Latest review scores (blue-green restyle)

| Field | Plan R1 | Result R1 | Result R2 |
|---|---|---|---|
| Visual design | 76 REVISE | 78 REVISE | 84 PASS |
| Accessibility | 72 REVISE | 84 PASS | not needed |
| Performance / SEO | 74 REVISE | 81 PASS | not needed |

## Round 2 brief (structure and wording; owner's words in the plan)

1. **Data-science audit of every chart.** For each dataset (graph.json, pathways.json, causality.json, proposals.json, scorecard.json), record its entities, relation types, counts and time span, then pick the chart that best shows how things relate. Candidates from the canvas: a layered filers → companies → labs view for pathways, and a network that sizes nodes by prevalence. No decorative visuals: a chart has to be drawn from `data/`.
2. **Wording for practitioners.** The audience is shareholder advocates. Cut definitions, primers and the retail "how to vote" content. Headings become plain data labels, with no slogans. Examples to replace: "The ballot route is narrowing", "Where leverage still exists", "How you can weigh in".
3. **Proposal feed:** all 65 proposals, including withdrawn and excluded, each with a status label and the sourced reason. `status_reason`, `status_source_url` and `proponent` are now in `data/proposals.json` for the three withdrawn/excluded proposals (merged from `data/proposal-status`).
4. **Always-visible table equivalents** for the pathways and causality graphs, as the network has.
5. Every control does something real: no placeholder links or buttons.

## Queue (found, not picked up)

1. **Fund votes follow-ups.** (a) 14 near-miss votes (3 distinct items, mostly BlackRock wording) sit in `data/fund_votes.json` `near_misses` for a person to confirm; (b) Meta 2026 "AI data usage oversight" is held back ("Needs checking"): two ballot items read as it; check the proxy and add the second proposal; (c) peer families are not reviewed row by row (shown with †); (d) Praxis and Domini 2025-26 file N-PX as text only; (e) data accuracy R2 fixes were applied after the round cap and not re-reviewed.
2. **Company universe expansion** (owner, 2026-11-25: every company worth influencing on responsible AI across consumer AI, enterprise AI, data centers and frontier labs). Data session researching; plan to come as docs/plans/2026-11-25-company-universe.md. Agreed fields with the UI session: `sectors` (["consumer AI", "enterprise AI", "data centers & compute", "frontier lab"]) and `engagement_basis` {text, url} in data/companies.json.
3. **Layout shift.** CLS 0.44–0.49 (good is under 0.1), because content jumps as tabs fill in after the data loads. This is why performance is under 80. It's a change to how the page works, so it needs the owner's go-ahead. Pair it with `defer` on the scripts at the end of `index.html` and a preload for the Inter Tight woff2; Lighthouse estimates 1.5 s of render-blocking time.
4. **Outside links to check by hand:** an SEC comment PDF (`data/causality.json`) returned 404 without an SEC user agent; www.omiusa.org and www.harringtoninvestments.com (`data/graph.json`) would not connect from Node.
5. **Deploy publishes the whole repo** (`path: .` in refresh.yml), including docs/ and tests/. It could publish `dist/` after `npm run build` instead. This is a deploy change, so it's for the owner.
6. **Fallback font metrics are estimates** (`styles.css`, "Inter Tight Fallback"). Measured font CLS is about 0.01, so the impact is small. Derive them from the Inter Tight file (capsize or fontkit) when touching fonts next.
7. **Inline styles in `app.js`** (about 20 `style=` attributes) break DESIGN rule 1 in spirit. Move them to classes during round 2.
8. **Pathways investor dots vs legend:** investor dots are drawn in `--n-manager` green (`pathways.js:123`), but the "investor engages company" legend chip is grey. One of them is wrong. Found in the visual R2 review; this predates the restyle.
9. **Network legend colour reuse:** 15 legend entries share 11 colours (DESIGN.md, palettes). This is part of the round 2 chart audit.
10. **Disclosure scorecard layout:** the 17-column heatmap is wider than its column at desktop width, so the last pillar is cut off next to the 300px panel. Reported by the data session.

Parked, not merged: local branch `fix-missing-data-and-results-link` (commit 1129740, in the `.claude/worktrees/protocol-setup` worktree, not pushed) duplicates the old missing-files and link-field fixes, which are now on `main` from `data/fund-votes`. It can be deleted.

## Owner actions

- Approve round 2 (structure and wording) using the brief above.
- Confirm or change the Lighthouse bar (ADR 0002): accessibility, best practices and SEO at 90 or above, performance at 80 or above.
- Decide on queue items 3 and 5.
- Supply three positioning points with sources for PRODUCT.md, or say to drop that section.
- Check the "Never claim" list in PRODUCT.md.

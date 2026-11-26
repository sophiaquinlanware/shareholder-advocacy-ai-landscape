# Shareholder Advocacy AI Landscape — current state

Rewritten in place, never appended. Hard cap 200 lines. Last updated 2026-11-25.

## Phase

The working protocol (AGENTS.md) and the check suite (`npm run check`) are set up. The disclosure scorecard tab (`scorecard.js`, `data/scorecard.json`) and the fund-vote (N-PX) review script (`scripts/npx_votes.py`) landed on `main` from another session the same day.

## Live

- Code on GitHub: `sophiaquinlanware/shareholder-advocacy-ai-landscape`, branch `main`.
- Public site: https://sophiaquinlanware.github.io/shareholder-advocacy-ai-landscape/ once GitHub Pages is on. Publishing waits on the repo variable `PAGES_ENABLED` = `"true"` (ADR 0001).
- Weekly refresh: every Monday 13:00 UTC, `.github/workflows/refresh.yml` runs the EDGAR scripts and commits `data/` to `main`.

## Latest check (2026-11-25, `main` at 74cbf0f merged with the protocol files)

| Step | Result |
|---|---|
| Lint (Biome + Python compile) | pass (48 warnings in existing site files, 0 errors) |
| Build | pass: 12 data files valid, all linked files present |
| Layout: 11 tabs × 1440/390 px × light/dark | pass: no overlapping text, no sideways scrolling |
| Load errors and local links | **fail**: queue items 1 and 2 |
| Lighthouse phone | accessibility 100, best practices 96, SEO 100, **performance 76** (bar 80) |
| Lighthouse desktop | accessibility 100, best practices 96, SEO 100, **performance 60** (bar 80) |
| Outside links (`check:links`, 416 URLs, run before the 406 fix) | 395 ok, 14 refused robots, 3 to check by hand (queue item 4) |

## Latest review scores

| Work | Field | Round | Score | Verdict |
|---|---|---|---|---|
| Workspace setup | Security / simplicity | R1 | 78 | REVISE → all findings fixed (docs/reviews/2026-11-25 workspace setup result R1.md) |

## Queue (found, not picked up)

1. **Missing data files.** `app.js` loads `data/changes.json` and `data/tracking.json`. Neither exists until the weekly job first runs `scripts/refresh.py`, so the page logs two 404 errors (both "file not found"). Fix: commit empty starting files (`{"items": []}` and `{}`), or have `app.js` skip the request when they're absent.
2. **Text in a link field.** Three proposals in `data/proposals.json` (lines 972, 990, 1008; repeated in `data/graph.json`) have `results_url` set to "Not yet filed (meeting 2026-12-08)". The page turns it into a broken link. Fix in the data shape: `results_url` empty plus a separate note.
3. **Layout shift.** Lighthouse measures a cumulative layout shift of 0.49 (good is under 0.1), because the content jumps as tabs fill in after the data loads. This is why the performance score is low. It's a change to how the page works, so it needs the owner's go-ahead.
4. **Outside links to check by hand:** an SEC comment PDF (`data/causality.json`) returned 404 without an SEC user agent; www.omiusa.org and www.harringtoninvestments.com (`data/graph.json`) would not connect from Node. Open each in a browser; rerun `npm run check:links` with `SEC_USER_AGENT` set.
5. **Tab buttons lack `type="button"`** (11 lint warnings in `index.html`). Harmless today because there is no form. Fix when `index.html` is next edited, then make the lint rule an error again (biome.json).
6. **Deploy publishes the whole repo** (`path: .` in refresh.yml), including docs/ and tests/. It could publish `dist/` after `npm run build` instead. This is a deploy change, so it's for the owner to decide.

## Owner actions

- Confirm or change the Lighthouse bar (ADR 0002): accessibility, best practices and SEO at 90 or above, performance at 80 or above.
- Supply three positioning points with sources for PRODUCT.md, or say to drop that section.
- Decide on queue items 3 and 6.
- Check the "Never claim" list in PRODUCT.md, which was drawn from the README, SOURCES.md, the footer and the Parnassus case notes.

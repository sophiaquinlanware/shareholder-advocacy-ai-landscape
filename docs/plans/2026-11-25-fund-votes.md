# Plan: how funds voted on AI proposals (Form N-PX)

## The owner's words

> "How institutions voted: from Form N-PX filings, side-by-side votes of Parnassus, BlackRock, Vanguard, and peer ESG funds on each AI item. CHECK Parnassus's votes first and show me before publishing this tab, in case it reads as an audit of them." (original brief, 2026-11-25)

> "Fund votes (N-PX)" · "Show it alongside peers" (2026-11-25, after reviewing Parnassus's 39 votes in chat)

## What exists today

- `scripts/npx_votes.py` reads each fund family's Form N-PX filings (structured XML since the 2024 filings), keeps the seven tracked companies, and matches each vote to a proposal in `data/proposals.json` by company, meeting date and at least 75% of the proposal title's key words. It writes one row per fund family per proposal.
- `.github/workflows/refresh.yml` has a manual `fund-votes` task that runs the script with the `SEC_USER_AGENT` secret and saves the result as a 2-day run artifact. Nothing is committed or published by it.
- Parnassus was run alone first and reviewed by the owner in chat: 39 AI-related proposals, 29 for, 6 against, 4 abstain.
- The "Fund votes" tab does not exist. The brief's tab 3 was held back until this review.

## What changes and why

This round changes **structure and wording** (a new tab and a new data file). It does not change colour or type.

1. **Data: `data/fund_votes.json`** (new). One row per fund family per proposal: family, proposal id, company, meeting date, vote (FOR, AGAINST, ABSTAIN or SPLIT), number of fund records, links to the N-PX filings. Built from the reviewed run artifact. Fund families: Parnassus, BlackRock (iShares), Vanguard, Calvert, Domini, Green Century, Impax (Pax), TIAA-CREF, Praxis (whichever have structured filings).
2. **View: `votes.js`** (new), drawing a new tab "Fund votes". A table: one row per AI proposal (company, year, title, filer, support), one column per fund family, each cell the vote as a plain neutral label (For / Against / Abstain / Split / blank when the family did not vote). Filters: company, topic, fund family. Each cell links to the N-PX filing.
   - Votes use the neutral `.pill.pending` style for every value. Green and red would imply a right answer, and PRODUCT.md "Never claim" 1 forbids suggesting how to vote.
   - Intro copy states what N-PX is, that "Split" means a family's funds voted differently, that a blank means no vote was found (often because the fund did not hold the stock), and that the site is independent of every fund shown (Never claim 3).
3. **Wiring:** one `<section>` and one tab button in `index.html`, `"fund_votes"` added to `FILES` and one render call in `app.js`, `votes.js` script tag. No new tokens or components.
4. **Docs:** SOURCES.md row for N-PX becomes "manual fund-votes task, yearly after August 31"; STATE.md updated.

## Tasks, owners, checks

| # | Task | Files owned | Check |
|---|---|---|---|
| 1 | Build `data/fund_votes.json` from the run artifact, spot-check 10 rows against the filings | `data/fund_votes.json` | data accuracy review; every row has a filing link |
| 2 | Build `votes.js` and wire the tab | `votes.js`, `index.html`, `app.js` | `npm run check` (11+1 tabs × 1440/390 px × light/dark, no overlap, no sideways scroll) |
| 3 | Docs | `SOURCES.md`, `docs/STATE.md`, this plan | read-through |

## Reviews

One round each, saved to `docs/reviews/`: **Data accuracy** (rows match filings), **UX / content** (plain wording, Never claim list), **Accessibility** (table headers, labels, contrast in both themes).

## Not in this round

- Holdings-weighted views (how many shares each vote represents).
- Fund families beyond the nine named. Adding one is a line in `FAMILIES` in the script.
- Votes on director elections. AI proposals only.

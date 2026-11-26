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
   - Intro copy states what N-PX is, that "Split" means a family's funds voted differently (with the count), that "No vote found" means no matching vote in the filings checked (no guess about why), and that the site is independent of every fund shown (Never claim 3).
3. **Wiring:** one `<section>` and one tab button in `index.html`, `"fund_votes"` added to `FILES` and one render call in `app.js`, `votes.js` script tag. No new tokens or components.
4. **Docs:** SOURCES.md row for N-PX becomes "manual fund-votes task, yearly after August 31"; STATE.md updated.

## Tasks, owners, checks

| # | Task | Files owned | Check |
|---|---|---|---|
| 1 | Rebuild `data/fund_votes.json` from the fixed script; diff Parnassus against the owner-reviewed rows; spot-check every SPLIT, every match under 1.0 and 10 random rows | `data/fund_votes.json` | data accuracy result review; every row has a filing link |
| 2 | Build `votes.js` and wire the tab; add the two accessibility rules | `votes.js`, `index.html`, `app.js`, `styles.css`, `DESIGN.md` | `npm run check` (all tabs × 1440/390 px × light/dark, no overlap, no sideways scroll) plus a keyboard pass |
| 3 | Docs | `SOURCES.md`, `docs/STATE.md`, this plan | read-through |

## Reviews

Plan round 1 (saved in `docs/reviews/2026-11-25 fund votes plan R1 *.md`): Data accuracy 62 REVISE, UX / content 76 REVISE, Accessibility 74 REVISE. This revision (R1 → revised once, per rule 27.4) adopts the following.

### Revisions adopted

**Data (from the data accuracy review)**
- Matching fixed in `scripts/npx_votes.py` (commit efd04b2): "ai" kept as a key word; two-sided match plus a margin over the next-best proposal at the same meeting; issuer items skipped; proposals with no meeting date matched within the year; all vote-table files read; one filing per period (amendments do not double count); more trusts per family. Near misses go to a `review` list.
- `data/fund_votes.json` is rebuilt from the fixed script, **not** from the earlier artifact or the hand-filtered Parnassus file. The rebuilt Parnassus rows are diffed against the 39 rows the owner reviewed; any difference is reported to the owner before publishing.
- Spot checks: every SPLIT and every match under 1.0, plus 10 random rows, opened in the filing.
- The JSON lists the trusts searched per family and the proposals checked.

**Wording (from the UX / content review)**
- Rows: only proposals that went to a vote at meetings up to June 30, 2026 (the last N-PX year). Upcoming, withdrawn and excluded proposals are left out, and the intro says so.
- A missing vote reads **"No vote found"** in the cell, explained as "no matching vote in the filings checked". No guess about why (no "did not hold the stock").
- Peer families (everyone except Parnassus) show "auto-detected, not yet reviewed" in the tab intro and in the cell's accessible label, until the owner or a reviewer confirms them (Never claim 4).
- Columns A to Z by family name, no anchor column, no tallies, no "agreed with" measure. The intro adds: "Each fund votes under its own policy. Nothing here says any vote was right or wrong."
- "Split" shows the count, e.g. "Split: 3 for, 2 against".

**Accessibility (from the accessibility review)**
- Table has a `<caption>`, `<th scope="col">` per family and `<th scope="row">` per proposal; each vote link's `aria-label` names the family, proposal, vote and "N-PX filing".
- The table box is `role="region"`, labelled, `tabindex="0"`, with a sticky first column and a visible focus outline. This adds two rules to `styles.css` (`.table-wrap:focus-visible`, `.sticky-col`), recorded in DESIGN.md first (rule 10).
- Filters are labelled selects with an "All …" first option. On phones the default is one company at a time.

### Plan-to-build changes
- Task 1 now reads "rebuild from the fixed script", not "from the reviewed run artifact".
- Task 2 owns `styles.css` and `DESIGN.md` as well (the two new rules).

## Not in this round

- Holdings-weighted views (how many shares each vote represents).
- Fund families beyond the nine named. Adding one is a line in `FAMILIES` in the script.
- Votes on director elections. AI proposals only.

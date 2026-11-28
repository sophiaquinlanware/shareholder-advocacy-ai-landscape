# Network: show where coalitions worked on a company, by kind of activity, with how funds voted

## The owner's words

> "i just wanna double check if these invest fund were part of a colaition that worked diretcly with rimscosoft then they hsould connect to miscorsft they should connect to the colation which then connect sto miscorosft. - the goal is to show where the power and which flows the votes and colbation sgo and at what stage there is collbration for exmaple"

> "Yes, plan that" (2026-11-27). The approach approved: keep each fund's own direct line, and add fund → coalition → company only where a record ties that coalition to that company.

This round changes structure and data only: no new colours, no new line styles. Revision 1 follows the plan reviews (data accuracy 66, UX/content 64); the changes are listed at the end.

## What exists today

- **The build.** `scripts/build_graph.py` builds `data/graph.json` from `data/network.json`, which holds organizations, proposals, edges, engagements and proposal_links.
  - **Membership:** 102 `member of` edges, from member directories. 47 have no `as_of`; 53 are dated 2024-04/05 from one archived Ceres page.
  - **Coalitions on proposals:** 60 `supported by` and `coordinated by` edges, 12 of them from coalitions. IAHR (Investor Alliance for Human Rights) has 7 at Alphabet and 1 at Meta; RJI (the Racial Justice Investing coalition) 2 at Microsoft; ICCR (the Interfaith Center on Corporate Responsibility) 1 at Microsoft; the Region VI Coalition 1 at Palantir. 8 of the 12 have a filer who is a recorded member.
  - **Coalitions on companies:** 4 engagements, all focus companies of the Valuing Water Finance Initiative (VWFI), written as `focus company of`.
  - **Co-filing:** `co-filed with` edges are derived from shared filings (lines 132–138).
- **Membership is not campaign work.** At Microsoft's 2025 human rights due diligence proposal, which ICCR supported, the only filer that is an ICCR member is NorthStar. Trillium, As You Sow, Zevin, Arjuna and Azzad are ICCR members, but no record ties ICCR to their Microsoft filings.
- **Responses aren't linked to proposals.** `led to` and `responded to` link events to events only. `acted in` comes from fuzzy name matching (line 191, `similar(..., 0.6)`), not from a sourced link. No edge ties a company response to a proposal.
- **Fund votes.** `data/fund_votes.json` covers 9 fund families: Parnassus, BlackRock (iShares), Vanguard, Calvert, Domini, Green Century, Impax, TIAA-CREF and Praxis.
  - It has 414 family-by-proposal rows: FOR, AGAINST, SPLIT (90), ABSTAIN (13) and NEEDS_CHECK (6).
  - Only 39 rows have `reviewed: true`.
  - Proposals join to graph nodes by graph id, else by `sec_id`. 52 of 79 graph proposals carry a `sec_id`.
- **The drawing.** `graph.js` belongs to the UI session.
  - The Proposals view has the columns People, Filers, Proposals, and AI companies by role. Coalitions sit in the Filers column (`FILER_ROWS`, line 160).
  - Clicking a node draws all its edges.
  - "Warm path" (line 1616) traces `member of`.
  - The canvas already uses dash patterns: membership `3 3`, inferred `1 3` (line 1841; DESIGN.md:135).

## What changes

### 1. A coalition sits on a fund's line only where a source names that fund in that work

A filer's line to a proposal is drawn **through** a coalition only when all of these hold:

1. **A coalition record names the proposal**, or names the company with a topic and year that match the proposal (for example, "ICCR members filed on AI human rights due diligence at Microsoft in 2025").
2. **The same record names that filer** (`members_named`).
3. **The filer's membership is dated on or before the filing.** If the membership has no date, the line stays direct and the panel says "membership date not on file".

When a coalition record names the proposal but not the filer, the filer keeps its direct line, and the coalition gets its own line to the proposal labelled with the source's verb ("supported by", "announced by", "coordinated by"). Membership alone never reroutes a line.

The routed line takes the source's own verb as its type, never a stronger word. It is drawn with the existing styles: solid where the record names the filer, so no new dash meaning is added.

The details panel says what the line rests on, for example:

> Through ICCR: ICCR's press release of [date] names Trillium among the filers (source). Member since [date] (member directory).

### 2. Kinds of activity, not steps

Every edge at a company or proposal gets an `activity` field. These are kinds of activity, **not a fixed sequence**, and the panel says so. They let a reader see where organizations worked together and in what way.

| Activity | Edge types |
|---|---|
| Coalition campaign | `focus company of`; new campaign records (§3); `supported by` and `coordinated by` from a coalition |
| Direct engagement | `engaged directly` |
| Filing | `lead filer`, `co-filer`, `filed (named in proxy)`, `filing representative`; `supported by` from a single investor |
| Making the case to shareholders | `exempt solicitation`, `exempt solicitation for`, `against` and `support`. The 5 free-text variants are mapped to these first, by a fixed table in the build. |
| Votes | No edges: shown as a table (§4) |
| None (not an activity) | `holds shares in`, `proposal at`, and the company–lab ties: `equity stake`, `chip supplier`, `cloud/compute provider`, `parent company`, `distribution partner`, `revenue share/commercial agreement`, `board seat or observer` |

The build fails if any edge type at a company or proposal is missing from this table, so a new edge type can't slip through unlabelled.

"Company response" is not an activity this round, because no sourced link ties a response to a proposal. It is queued until one exists.

**In company focus:**
- A row of activity chips sits under the existing key: Coalition campaign, Direct engagement, Filing, Making the case. All are on by default.
- Turning a chip off dims that kind of activity, with the existing dim style.
- At 390 px the chips wrap onto two lines under the key, each at least 44 px high, and are tested at that width.
- The details panel lists each activity with counts, for example "Filing: 6 organizations; 1 named by a coalition record".

### 3. New data: coalition campaign records

`data/network.json` `engagements` grows from the 4 VWFI rows to every sourced coalition campaign at a tracked company. Each row has these fields:
- `coalition`
- `company`
- `proposal_ids`, where the source names proposals
- `topic`
- `year`
- `activity`
- `what`
- `members_named`: only organizations the source itself names
- `source_url`
- `as_of`

Sources must be the coalition's own pages or reports. LinkedIn and news summaries don't count.

| Coalition | Where to look |
|---|---|
| ICCR | Digital Rights and AI Accountability pages; press releases announcing member resolutions; its annual proxy resolutions guide |
| IAHR | Resolution announcements (the 2023 Meta and Alphabet page already used); its tech-sector pages |
| World Benchmarking Alliance, Collective Impact Coalition for Ethical AI | Its published target companies and lead investors |
| Ceres VWFI | Focus list and benchmark reports, already used for 4 companies |
| RJI | Its resolution pages |

Where a member directory gives a joining date, record it on the `member of` edge (`as_of`), so the dating rule in §1 can apply.

### 4. How funds voted: a sourced table, not lines

The owner asked which way the votes flow. The proposal's details panel gets a table "How these fund families voted":
- one row per family: For, Against, Split or Abstain;
- the N-PX source for each row;
- "auto-detected, not yet reviewed" on each of the 375 unreviewed rows, under PRODUCT.md Never claim 4.

NEEDS_CHECK rows are held back, with a count ("6 votes held back until checked").

A note under the table says what it covers: "9 fund families this site reads N-PX filings for. Not all shareholders, and not weighted by shares held."

Where `forecast.json` `control` records voting control (4 companies), the panel shows that sourced line as written, for example "Founders control 50.1% of the vote". It adds nothing about what outside votes can or cannot do.

The table works in the List view too, so it doesn't depend on hover or line styles.

The word "power" is not used. Showing who holds how many shares belongs to holdings data, which covers 18 filers and NBIM (Norway's sovereign wealth fund, Norges Bank Investment Management). That is queued, not built in this round.

## Tasks

**Task 1: research coalition campaign records (§3), five companies first.** Data session, one executor.
- Scope: Microsoft, Alphabet, Amazon, Meta and Apple, 2023 to 2026. The other tracked companies follow, after the owner's go-ahead.
- Files: `data/network.json` (`engagements`, and `as_of` on `member of`); the SOURCES.md row.
- Check: the data-accuracy review opens every source and checks each `members_named` entry against the source text.

**Task 2: build.** Data session.
- Work: the `activity` field and its complete map; the routing rule of §1, with the source's verb as the edge type; the vote table data per proposal, joined by graph id, else `sec_id`.
- Files: `scripts/build_graph.py`, `data/graph.json`.
- Check: a new `scripts/test_build_graph.py`, which tests that:
  - a member with no naming record keeps its direct line;
  - a named member with an undated membership stays direct, with the note;
  - a named member with a dated membership is routed;
  - any unmapped edge type fails the build;
  - vote rows per proposal match `fund_votes.json`: 414 in all, minus 6 held back.

**Task 3: drawing.** UI session.
- Work: routed lines through the coalition node; activity chips; the activity list in the panel; the vote table in the proposal panel and List view; the "what this line rests on" text.
- Files: `graph.js`, `styles.css` (layout only), `tests/lens*.spec.js`.
- Check with Playwright:
  - In Microsoft focus, ICCR has its own "supported by" line to the 2025 human rights due diligence proposal.
  - NorthStar is routed only if Task 1 finds a record that names it.
  - The other ICCR members stay direct.
  - The chips wrap at 390 px.
  - The vote table shows "not yet reviewed".
  - Screenshots at 1440 and 390 px, light and dark.

**Task 4: docs.** Both sessions.
- Files: DESIGN.md (network section: the routing rule, the activities, the vote table); PRODUCT.md (a membership line never claims joint work); STATE.md.
- Check: the UX review reads them with the result.

Tasks 1 and 2 merge first. The UI session can start Task 3 against a fixture.

## Owner question

Research covers the five companies with the most AI proposals first (Microsoft, Alphabet, Amazon, Meta, Apple). Should the other tracked companies follow straight after (recommended), or wait until you've seen the five?

## Reviews

- **Plan, round 1:** `docs/reviews/2026-11-27 coalition paths plan R1 data-accuracy.md` and `... ux-content.md`. This document is the one revision allowed.
- **Result:** at most two rounds.

## Not in this round

- Holdings-weighted voting power.
- A company-response activity (waiting on a sourced response-to-proposal link).
- Proxy-advisor recommendations.
- People-level paths.

## Changes in revision 1

| Review point | Change |
|---|---|
| Data 1, UX 1: "414 fund families", untyped SPLIT/ABSTAIN votes, unreviewed votes, a join on `sec_id` only, "power" overclaimed | 9 families and 414 rows; a table instead of vote lines; all four vote types; NEEDS_CHECK held back; the unreviewed label; join by graph id, else `sec_id`; "power" dropped (§4) |
| Data 2: the stage map was incomplete, and stage 6 had no data | A complete activity map with an explicit "none", exempt-solicitation variants mapped first, the build fails on any unmapped type, the company-response activity dropped (§2) |
| Data 3, UX 2: routing could imply joint work | Route only when the source names the filer, with topic and year matching and membership dated; otherwise the coalition gets its own line; the line takes the source's verb (§1) |
| UX 3: dash meanings collided, and phone layout was unspecified | No new line styles; chips placed and tested at 390 px (§1, §2) |
| UX: numbered stages implied a sequence | "Kinds of activity, not a fixed sequence" (§2) |
| UX: two owner questions at once | One question (owner question) |

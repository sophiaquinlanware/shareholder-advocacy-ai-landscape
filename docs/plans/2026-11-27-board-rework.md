# Prediction board rework: conditional pairs, lab outcomes, and beating the site's model

## The owner's words

> "is a premidiction board relaly the best way to preidtc the future of this thing - what might work better or whats a more ocmplelling use of a prediction board here - what else could we predict that might eb cooler -"

> "Yes, plan it" (2026-11-27). This approved the proposal: lead with paired questions, add lab safety outcomes and faster-settling events, show the site's model figure on every question and score people on beating it, and add short reasons and rounds.

This round changes structure and wording. Colour and type stay as they are.

Revision 1 follows the plan reviews: data accuracy 62, UX and legal 76. The changes are listed at the end.

## Why change it

Prediction markets beat polls and experts when three things hold (Wolfers and Zitzewitz, 2006):
- many informed people take part;
- the information is spread across them;
- results settle often and clearly.

The board today falls short on all three:
- **Few forecasters:** one test forecast so far (STATE.md, Prediction board).
- **Slow, repetitive questions:** 12 of 28 ask whether anyone will file at a company with no AI proposal (`data/forecast-questions.json`). Those are the least informative questions, and they are the most numerous.
- **Lone figures:** a single probability tells a reader little that Plan an engagement doesn't already show.

The literature points to two more useful designs:
- **Conditional pairs:** the same outcome forecast under each answer to a public event, so the gap shows what forecasters expect that event to change. The board already has one such pair, on the SEC rule.
- **A benchmark to beat:** here, that is the site's own model.

The board will not ask which ask a filer should file. A question of the form "ask A or ask B at this company" reads as advice on what to file (PRODUCT.md Never claim 2), so it is out.

## What exists today

- **`board.js`** (452 lines):
  - `card` and `draw` render the cards and sections.
  - The views are most likely first, by topic, and by company.
  - "Your forecasts" is `mineHtml`; the Scores block shows `crowd_vs_site` and `leaderboard`.
  - The If, then pairs already render side by side (`.bd-pair`) with a crowd gap line (`gapText`).
  - The lede reads "Forecast what will happen in AI shareholder engagement, not what you want to happen."
- **`scripts/build_questions.py`** (336 lines):
  - Question kinds: `vote`, `season`, `policy`, `conditional`, `coverage_gap`, `engagement`.
  - A question is fixed once created.
  - The crowd figure is the mean of group medians, and the ranking is by skill against the site's figure.
  - A vote question's `base.p` (lines 90–97) is the share of past cases where support reached the benchmark. It uses the backtest `errors` in `data/forecast.json`, the same records Plan an engagement uses for its support range.
- **`data/forecast-curated.json`** holds six hand-added questions with sources:
  - Microsoft water: one plain question, a Parnassus/Ceres question, and an if/then pair conditioned on it.
  - Anthropic: `q-ant-rsp-external-review-2027` (closes June 30, 2027, resolves by December 31, 2027) and `q-ant-2027-safety-proposal`.
- **`data/proposals.json`** holds 79 proposals. All are voted, withdrawn, excluded or upcoming. None is recorded as "filed but not yet in a proxy statement", and none has a proxy filing date. The four upcoming ones (msft-2026-4/5/6, csco-2026-5) are already in proxy statements.
- **Posting:**
  - `board-live.js` posts to Supabase table `forecasts`: question, p, stakeholder_group, stake.
  - The GitHub form route runs through `scripts/ingest_forecast.py` into `data/predictions.json`.
  - No free text is stored.

## What changes

### 1. Lede keeps its guardrail

The new lede reads: "Forecast what will happen in AI shareholder engagement, not what you want to happen, and see how your figures compare with the site's model." The "not what you want to happen" clause stays, because the exception in PRODUCT.md Never claim 5 rests on it.

### 2. "Same outcome, two conditions" leads the board

This section replaces the "If, then" heading and moves to the top.

The section intro, and a line on each pair, say: "Each pair asks about one outcome under each answer to a public event. Only the branch whose condition happens is scored. The gap shows what forecasters expect, not what causes what, and nothing here recommends any action."

Each pair shows:
- **The crowd gap:** branch 1 minus branch 2, in points.
- **The site model's gap:** shown only where both branches have a model figure; otherwise "no model figure for this pair".

**The rule on naming organizations, widened:** no condition or outcome may be a future act of a named investor, filer, coalition or other shareholder. Conditions are limited to public events the site can resolve from a named source: an SEC vote, a law taking effect, a proposal appearing in a proxy statement (whoever filed it). Outcomes may be acts of the company being engaged, because that is what the board forecasts now (votes, commitments, disclosures).

The pairs:
1. **SEC rule, exclusions.** The existing pair, `q-2027-exclusions-if-adopted` / `-if-not`. It moves here unchanged.
2. **SEC rule, top support.** A new pair, built by `build_questions.py` from the SEC condition already in use. Outcome: any AI proposal at a tracked company gets 30% support or more, for meetings January 1 to June 30, 2027 (the same rule as `q-2027-top-support`). The model figure is that question's existing base rate. It is a season base rate that doesn't depend on the condition, so both branches show it once, as the site's figure without the condition.
3. **Anthropic: proposal on the ballot.** New, curated. Condition: a shareholder proposal on any of the nine safety asks (`data/alignment_asks.json`) appears in Anthropic's 2027 proxy statement (DEF 14A on EDGAR), whoever filed it. Outcome: Anthropic publishes a summary of an external review of its Responsible Scaling Policy compliance by December 31, 2027. This is the resolution rule of `q-ant-rsp-external-review-2027`, copied unchanged. Model figure: none ("no model figure for this pair"). Context: founder Class F shares hold 50.1% of the vote (`forecast.json` `control`), so a proposal there records a view and doesn't decide anything.
4. **Microsoft water, if/then pair.** The existing pair is conditioned on whether Parnassus is named by Ceres, an investor's future act. The widened rule bars that. Questions are fixed once created, so the pair is not rewritten. It stays where it is, in Engagements, and does not move into this section. Whether to keep it or void it is a choice for the owner (below).

No pair compares filer types. `proposals.json` has no field for filer type, and sorting proponents into types would be a judgement with no source.

### 3. Lab safety outcomes (new section "Frontier labs")

- **Moved here:** `q-ant-rsp-external-review-2027` and `q-ant-2027-safety-proposal`, unchanged.
- **New: SpaceX.** "Will a shareholder proposal on any of the nine safety asks appear in SpaceX's 2027 proxy statement?" It resolves from SpaceX's 2027 DEF 14A on EDGAR, and voids if no 2027 annual meeting proxy statement is filed by December 31, 2027. Context on the card, not a base rate:
  - SpaceX listed in June 2026 and has no recorded proposal deadline (`data/lab_leverage.json`);
  - Elon Musk holds most of the vote through Class B shares with 10 votes each (source: the company record linked from Labs you can file at).
- **New: lab framework.** "Will Anthropic, OpenAI, Google DeepMind, Meta or xAI publish an update to its frontier safety framework, after this question is created and by June 30, 2027, that names an outside organization assessing the lab's models or its compliance with that framework?"
  - It resolves by hand from each lab's framework page, with the page and the date of the update recorded in `data/forecast-resolutions.json`.
  - A named organization means the text names it. "External experts" without a name does not count.
  - The outcomes are labs' own acts, which the rule allows.
- **Dropped: "will any tracked company receive a frontier safety framework proposal".** A question about whether anyone will file where nothing has been filed reads as a prompt to file. The legal reviewer flagged the same pattern in the coverage-gap questions.

### 4. The site's model on every question, and how you compare

- **New label.** The card label "This site's starting estimate" becomes **"The site's model"**. The figure and the how-line stay the same, so no number changes.
- **Vote questions.** The model figure is the existing `base.p` (`build_questions.py` lines 90–97), the empirical share of past errors at or above the benchmark. It is not recomputed. A test checks that the figure shown equals `base.p`.
- **Questions with no model figure.** These are the Rules question, the lab questions and the curated engagements. They show "No model figure: this site's records don't cover this", and they aren't counted in the comparison.
- **Resolved cards** add one line: "Your score N, the site's model M (Brier; lower is better)". The ranking keeps its skill measure against the site, with the column renamed "Better than the site's model by".
- **Your forecasts** adds a running count: how many resolved questions you scored better than the site's model on.
- **Calibration table under Scores.** For each 10-point band of the site's model figure, it shows how often the outcome happened. With fewer than 5 resolved questions it says "Not enough resolved questions yet". This is a table, not a chart; a chart is for a colour-and-type round.
- **Wording.** "Compare with the site's model" is used throughout, not "beat". The lede stays about forecasting, not winning.

### 5. Faster-settling events

- **Dropped: questions on whether a proposal will appear in a proxy statement.** No proposal is recorded as filed but not yet in a proxy statement, and there are no proxy filing dates to set a close from.
- **Dropped: state bills.** Every state law on the safety asks' "rules that already require it" lists is already enacted (California SB 53 has been in force since January 1, 2026; the New York RAISE Act takes effect January 1, 2027). The only pending item is federal.
- **New: `withdrawn_commitment`, built automatically.** For each upcoming proposal: "Will it be withdrawn after a company commitment before its meeting?" It resolves from the existing `commitment()` rule in `build_questions.py`, and is built only for upcoming proposals. Today that is four, all already in proxy statements, where withdrawal is rare. The section note says so plainly: "Four proposals qualify now; more appear as 2027 filings are recorded."
- **Fewer coverage-gap questions on show.** By default, only the next 4 deadlines show. The rest sit under "More companies with no AI proposal recorded". Nothing is deleted, because questions are fixed once created.
- **Settling speed this round.** It comes mostly from the four December votes and the SEC question. The board says when the next question closes, as now.

### 6. Short reasons and rounds

- **A picklist for the main reason, never free text.** It is optional. The options:
  - past votes on this ask;
  - this company's past response;
  - founder or insider voting control;
  - a rule or SEC guidance;
  - news or a company statement;
  - the site's model;
  - other.

  "The filer's track record" is dropped from the earlier list, because it invites forecasts about named filers.
- **Reasons on the card.** Each card shows the top two reasons with counts, for example "Most often given: past votes on this ask, 6 of 11".
- **Storage.**
  - Supabase gets a `reason` column, checked against the list (`supabase/schema.sql`).
  - The GitHub form gets a dropdown, and `ingest_forecast.py` copies the reason into `predictions.json`.
- **Rounds.**
  - On the first build run of each month, the build adds a snapshot of each open question's crowd figure to a `history` list on that question: date, crowd, n. A month already recorded is never rewritten.
  - The card shows the movement as text, for example "Crowd 31% (November) → 38% (December)".
  - The latest forecast still counts.

### 7. Order of the board

1. Lede, How to take part, Your forecasts.
2. Same outcome, two conditions.
3. Frontier labs.
4. Coming votes and withdrawal questions.
5. The 2027 season, Engagements, Rules.
6. Companies with no AI proposal recorded: 4 shown, the rest under the disclosure.
7. Resolved, Scores (ranking and calibration table), How it works.

The three views stay. "By topic" uses this order.

## Choices for the owner

1. **Reasons:** a picklist only (recommended: no moderation, and the results can be counted), or a picklist plus 200 characters of text shown after the maintainer approves it.
2. **Counsel:** STATE.md says counsel should look at the board before forecasters are invited beyond a small pilot. Should counsel also see the "Same outcome, two conditions" section and the new lab questions before they are published at all? Recommended: yes, publish the reworked board only after counsel's look, because the board is public by design.
3. **The Microsoft water questions that name Parnassus** (`q-parnassus-vwfi-msft-2027` and the if/then pair conditioned on it). Under the widened rule, they would not be created today. Options:
   - keep them, labelled as created before the rule;
   - void them with a note (recommended, since no forecasts have been posted on them).

## Tasks

Each task gets its own executor and worktree, merged one at a time in this order. Tests are written first where it makes sense.

| # | Task | Files it owns | How it's checked |
|---|---|---|---|
| 1 | Build: SEC top-support pair; `withdrawn_commitment` for upcoming proposals; `history` monthly snapshots; reason counts; calibration table; `featured` flag on the next 4 coverage gaps; `section` values for the new order | `scripts/build_questions.py`, `tests/fixtures/forecast-questions.json` | A new `scripts/test_build_questions.py` checks four things. Questions created earlier are byte-identical after a rebuild. A month's snapshot is written once and never rewritten. The calibration counts on a fixture match a hand count. Every vote question's model figure equals its `base.p`. |
| 2 | Curated: the Anthropic pair, the SpaceX question, the lab framework question, sections for existing Anthropic questions; the owner's choice on the Parnassus questions | `data/forecast-curated.json`, `data/forecast-resolutions.json` (sources only) | Data-accuracy review: every source opened, and every resolution rule decidable from its named source |
| 3 | Reasons: Supabase column and constraint, GitHub form dropdown, ingest | `supabase/schema.sql`, `.github/ISSUE_TEMPLATE/forecast.yml`, `scripts/ingest_forecast.py`, `board-live.js` | Ingest test with and without a reason. The schema runs again cleanly; the owner pastes it once in Supabase. |
| 4 | Board UI: lede, sections and order, pair display with both gaps and the intro line, "The site's model" wording, comparison lines, running count, reason counts, monthly movement line, calibration table, coverage-gap disclosure | `board.js`, `styles.css` (layout only: reuses `.bd-pair`, no new colours) | `tests/board.spec.js` checks: the lede still contains "not what you want to happen"; a pair shows both gaps and the "not what causes what" line; a resolved fixture card shows both scores; the reason picklist posts; only 4 coverage-gap questions show by default. Screenshots at 1440 and 390 px, light and dark, copied to docs/design/. |
| 5 | Docs: update the labelled exception in PRODUCT.md Never claim 5 (conditional pairs, the rule on naming organizations, the model label); the board section of DESIGN.md; SOURCES.md (lab framework pages); STATE.md | those files | UX and legal reviewers read these files alongside the result |

## Reviews

- **Plan round 1:** saved in `docs/reviews/2026-11-27 board rework plan R1 data-accuracy.md` and `... ux-legal.md`. This document is the one revision that round allows.
- **Result:** at most two rounds, in data accuracy and UX/legal.
- **What the result's legal review checks:**
  - the coverage-gap questions;
  - the SpaceX question;
  - the Anthropic pair's condition, for whether any of them reads as a prompt to file.

## Not in this round

- An LMSR market sandbox.
- Proxy-advisor questions.
- Charts for calibration or movement.
- Fund-vote questions.
- Asking which ask to file.
- Comparing filer types.
- Questions on whether a proposal will appear in a proxy statement, until filings without a proxy statement are recorded.
- State bills.

## Changes in revision 1

| Review point | Change |
|---|---|
| UX/legal 1: the lede lost its guardrail | The lede keeps "not what you want to happen" (§1) |
| UX/legal 2: "Compare two choices" reads as advice on what to file | Section renamed; the "ask A or ask B" pair dropped; the intro says nothing is recommended (§2) |
| UX/legal 3: the rule on naming investors was too narrow | Widened to conditions and outcomes, covering every investor, filer, coalition and shareholder (§2) |
| Data 1: no records for proxy-statement questions or state bills | Both dropped (§5) |
| Data 2: pairs 1 and 2 not defined by the records | Dropped, and replaced by pairs with public-event conditions (§2) |
| Data 3: the Ceres pair breaks the rule | Not moved; the owner chooses whether to keep or void it (Choices, 3) |
| Data: the model probability was undefined | It is the existing `base.p`, tested equal (§4) |
| Data: wrong resolve date for the Anthropic review | Corrected to December 31, 2027 (§2, §3) |
| Data: lab questions were loose | "Outside organization" defined; SpaceX context added (§3) |
| UX/legal: counsel should come earlier | Added as a choice for the owner (Choices, 2) |

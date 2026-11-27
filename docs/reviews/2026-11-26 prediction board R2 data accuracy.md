REVIEWER: Data accuracy (round 2) SCORE: 76 VERDICT: REVISE

Scope: commit 4aa9d53 on design/prediction-board. I read build_questions.py, ingest_forecast.py, forecasts.yml, ISSUE_TEMPLATE/forecast.yml, refresh.yml, board.js and tests/board.spec.js. I recomputed the figures from data/*.json in my own scratch copy and ran the build there with faked dates (worktree not edited). The rebuild for today is idempotent: 22 questions, 0 new, byte-identical file.

## Base rates recomputed (all match the frozen file)
- **Refile votes:** 4 of 18 at or above 0, so 22%. **First filings:** 6 of 25, so 24%.
- **Vote bars:**
  - MSFT item 4: the median of 8 ask_votes is 8.975, shown as 9%. The bar is 9.0 and the text says so.
  - CSCO: 16.79, shown as 16.8.
  - MSFT items 5 and 6: 26.34 and 27.48, from the 2025 votes.
- **Commitment withdrawals** (Jan–Jun window, critical filers left out): 0, 3, 0, 0, so 1 of 4, then (1+1)/(4+2) = 33%. The three are DIS, CMCSA and VRSK; VRSK has no meeting date and falls back to year 2024.
- **Exclusions:** 0, 0, 0, 3, giving 33%.
- **Top support, windowed:** 37.48, 43.29, 20.11, 22.47, so 2 of 4, giving 50%. The full-season 2025 maximum of 53.61 (Tesla, November) is correctly left out.
- **Coverage gap:** 12 of 58 = 20.7% (2024: 5/21, 2025: 2/17, 2026: 5/20). This matches my R1 correction.
- **Simulations:**
  - MSFT voted at 30% or 5% resolves correctly.
  - The SEC question entered by hand as 1 voids "if-not" and keeps "if-adopted" open.
  - Season questions stay unresolved until July 30, 2027, then resolve.

## R1 items
| Item | Status | Note |
|---|---|---|
| H1 freezing | Fixed | Ids include the deadline or year. The residual is N1. |
| H2 resolvers | Fixed | The SEC question still needs a hand-entered No (N6). |
| H3 early resolution | Fixed | RESOLVE_LAG and in_window. |
| H4 window | Fixed | 50%. |
| H5 not-yet-public companies | Fixed | 12/58. The LISTED comment at build_questions.py:37-38 says SPCX listed November 2026, but companies.json says June 2026. No effect on the figures. |
| H6 critical filers | Fixed | `pro` is used everywhere, and AI_DEF is in every resolves text. |
| H7 bot reply | Fixed | The error path's residual is N5. |
| H8 group weighting | Partly | The pooled bucket has no minimum size (N2). |
| M1, M2, M3, M6, M7, M9, M10 | Fixed | |
| M4 closing day | Fixed | Close dates moved to the day before. Ingest and board both use `closes < today`. |
| M5 | Decided by the owner | PRODUCT.md still says questions are "never support" while vote questions ask about support levels. That wording is for the owner to clarify. |
| M8 free text | Fixed | `reason` is not stored. The text still stays public on the GitHub issue. |
| L1 parser | Fixed | First occurrence only; the filer field can't be overridden. A fake "### Confirmation" in Why can satisfy the box, but the web form requires the real box anyway. |
| L2 reply echo | Fixed | |
| L3 citation | Partly | Wolfers and Zitzewitz are cited by name with no link, though the money-markets caveat was added. |
| L4 warning | Fixed | |
| L5 | Fixed | |
| L6 ranking | Partly | Filers are unranked and skill is measured against the base rate. |
| L7 keyword matching | Partly | The "not agreed" guard was added; matching is still on keywords. |
| L8 8-K wording | Fixed | |
| L9 test fixture | Not fixed | See N4. |
| L10 inline style | Fixed | Now data-w plus the CSSOM. |

## New findings, by severity

**N1 (High, blocks a pass). Coverage-gap results never settle, and later filings flip them.** build_questions.py:217-221 and :248-256.
- `filed_after` returns Yes for any recorded proposal at that company whose meeting falls after the deadline, with no upper bound.
- `resolved` is recomputed on every run and never frozen.
- I tested it. A fake AMD proposal for 2028-05-10 resolved `q-gap-amd-2026-11-27` as Yes on 2026-12-20, even though that question is about the 2027 meeting.
- In real use, every gap company that resolves No in fall 2027 will flip to Yes once its next year's proposal is recorded, and Brier scores will change after the fact.
- Fix:
  - Bound the check to the meeting that follows the deadline: `meeting_date <= resolves_by`, or a record year equal to the deadline's season.
  - Freeze results: once `resolved` is 0, 1 or "void" in the store, keep it and write a `resolved_on` date. Only an entry in forecast-resolutions.json can change it.
  - The same freeze also protects season questions from backfilled records.

**N2 (Medium, wording vs computation). The pooled bucket hands one person up to half the headline figure.** build_questions.py:272-276.
- "Smaller groups pooled" counts as a full group however small it is.
- Example: 3 investors at 20% and 1 "Other" at 99% give an equal-weight figure of 59.5%, against a median of everyone of 20%.
- That contradicts board.js:138 ("a few extreme forecasts move them little") and :143 ("limit any one group's sway").
- Fix: count the pooled bucket only when it has 3 or more forecasters, weight it by n/3, or show all_median when fewer than 2 groups qualify.

**N3 (Medium). Some results become public while forecasts are still accepted.** build_questions.py:120 and :151; ingest_forecast.py:57.
- The SEC question closes January 31, 2027. If the Commission votes before then, forecasts keep being accepted and scored until the owner enters the result by hand.
- Exclusion notices and January meetings can also be public before season questions close. The board text admits this only for meetings ("before most meetings").
- Fix: add a `decided` date to forecast-resolutions.json and drop forecasts made on or after it from scoring. Consider closing season questions on December 31.

**N4 (Medium). The tests will break `npm run check` within three weeks.** tests/board.spec.js:13-20 and :39.
- The tests need an open `-bar` card with a slider and n = 0, plus a "Microsoft" heading among open questions.
- Once CSCO resolves on Dec 15, or anyone posts a forecast, they fail for every session.
- Fix: run the board tests against a fixture file.

**N5 (Medium). The weekly refresh and the forecast bot race on forecast-questions.json.** refresh.yml:56-66 against forecasts.yml.
- Both regenerate the whole file, and they don't share a concurrency group.
- If a forecast lands mid-refresh, the refresh's rebase conflicts, aborts and exits 1, and that week's EDGAR and holdings update is lost.
- Fix: put both workflows in concurrency group `forecasts`, or have the refresh pull, then rebuild, then commit.

**N6 (Medium-low).**
- forecasts.yml:51 and :70-72: the error path writes `result=error` and exits 0, so the run shows green. Nothing alerts the maintainer, yet the reply promises "the site's maintainer will add it". Fix: exit 1 after commenting, or add a label.
- The SEC question never resolves No without a hand entry, and both conditionals depend on it. Add a STATE.md reminder, or auto-resolve No at resolves_by + 30 days.
- build_questions.py:146-148: on July 1, 2027 the build will create `q-sec-rescission-2028` even if the rule was already adopted. Gate it on the 2027 result.

**N7 (Low).**
- build_questions.py:183: if the refresh corrects a company's deadline, a duplicate gap question is created and the old one stays live. Supersede the old one when it has no forecasts.
- board.js:128: "No question has closed yet. The first closes X" can show a past date, because closed-but-unresolved questions are counted as open. Say "resolved".
- board.js:114: "When the question closes, every posted forecast is scored" should say "when it resolves".
- board.js:137: "last year's figure there" should read "the latest recorded vote there".
- Crowd line: "2 groups weighted the same" counts the pooled bucket as a group.
- ingest: a Python crash is reported as "rejected / fix the form fields".

## Content rules
PASS. No invented numbers. Every base rate and count matches the data, with its method and data file linked. The one gap is L3: the citation has no link.

## To pass
1. Fix N1: bound and freeze results.
2. Fix N2: apply a minimum size to the pooled bucket.
3. Fix N4: use a test fixture.
4. Fix N5: shared concurrency.
5. Optionally fix N3: the `decided` date.

With N1, N2 and N4 fixed this would score about 85.

---
Author's response (2026-11-26), after round 2 (the protocol's last round; these fixes are not re-reviewed):
- N1: `filed_after` now counts only the meeting after the deadline (meeting date after the deadline and by resolves_by, or, with no date, the next season). Results are frozen once set, with `resolved_on`; only data/forecast-resolutions.json changes one.
- N2: the pooled bucket counts only at 3 or more; the headline is the mean of group medians only when at least two groups have 3 or more forecasters, otherwise the median of everyone, and the board says which.
- N3: hand resolutions can carry a `decided` date; forecasts made on or after it are left out of the crowd and the scores. Season and Rules questions now close December 31 of the year before.
- N4: tests/board.spec.js serves tests/fixtures/forecast-questions.json (every question open).
- N5: no shared concurrency group, because GitHub cancels queued runs in a group and would drop forecasts. Both workflows instead start again from the newest main when a push is refused; the weekly refresh pushes its data first and rebuilds forecast-questions.json last, from main.
- N6: the error path comments, leaves the issue open and fails the run (exit 1); rejections exit 3 so a crash is never reported as a form error; a new SEC question is not created once one has resolved Yes; the hand resolution of the SEC question is in STATE.md.
- N7: an old gap question with no forecasts is dropped when a corrected deadline creates a new one; the board's wording fixed (resolved, latest recorded vote, groups of 3 or more).
- SPCX comment corrected (June 2026). L3: the citation names the authors, year and The New Palgrave Dictionary of Economics; no stable public link was confirmed, so none is given.

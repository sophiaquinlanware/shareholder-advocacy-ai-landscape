# Prediction board: data-accuracy review, round 1

Reviewer: independent subagent (strongest model), read-only; no files edited.
Scope: uncommitted work in the `design/prediction-board` worktree: `scripts/build_questions.py`, `scripts/ingest_forecast.py`, `.github/workflows/forecasts.yml`, `.github/ISSUE_TEMPLATE/forecast.yml`, the `refresh.yml` diff, and `board.js` text.
Method: every base rate recomputed from `data/proposals.json`, `data/forecast.json`, `data/sim_params.json` (critical_ids), `data/companies.json`, `data/causality.json`, then compared with `data/forecast-questions.json` and the "how" sentences.

**Score: 58 / 100: FAIL** (PASS at 80).

The arithmetic mostly checks out (what the code computes is what the file shows). The scoring and resolution pipeline does not work as built: no vote, coverage-gap, top-support, SEC or conditional question can ever be scored. Two base rates are computed over a different window or population than the question asks about, and two board sentences state things the data doesn't support.

---

## What I recomputed (and what checks out)

| Board figure | My recomputation | Verdict |
|---|---|---|
| Refile vote base 22% (18 votes) | `errors.refile` ≥ 0: 0.0295, 0.0571, 0.7543, 0.7733 → 4/18 = 0.222 | Arithmetic correct; wording inexact (M1) |
| First-filing vote base 24% (25) | `errors.first` ≥ 0: 6/25 = 0.24 | Arithmetic correct; wording inexact (M1) |
| MSFT item 4 bar 9% | median of ask-dc-climate-energy votes (8.21, 9.74) = 8.975 → 9.0 | Correct |
| CSCO item 5 bar 16.8% | median of ask-customer-due-diligence = 16.79 → 16.8 | Correct |
| MSFT items 5/6 bars 26.34% / 27.48% | `latest` = MSFT 2025 votes (msft-2025-9, msft-2025-8); support_note confirms For/(For+Against) | Correct |
| Withdrawn after commitment 0,3,0,0 → 1 of 4 → 33% | matches (2024: DIS, CMCSA, VRSK); 33% = (1+1)/(4+2) | Counts correct; method not stated (M2) |
| Exclusions 0,0,0,3 → 1 of 4 → 33% | matches (AMZN, NVDA, CRM 2026; none critical) | Correct today; inconsistent population in code (H6) |
| Top support 37,43,54,22 → 3 of 4 → 67% | full-season maxima correct, **wrong window for a question that closes June 30** (H4) | **Wrong base rate** |
| Coverage gap 12/66 = 18.2% (2024 5/24, 2025 2/20, 2026 5/22) | matches code; **denominator includes companies that weren't public** (H5); corrected 12/58 = 20.7% | **Wrong base rate** |
| SEC comments closed Nov 20, 2026 | causality.json sec-14a8-rescission-proposal: "Comments were due November 20, 2026" | Supported |
| "2026 was the first season without SEC staff review of most exclusions" | supported by causality.json sec-noaction-pause (staff did not respond except (i)(1), Oct 1 2025 to Sep 30 2026) | Supported, but unlinked (L3) |

---

## Critical and high (each blocks a pass)

**H1. Questions are regenerated from live data on every run and never frozen, so they vanish or mutate after people forecast them.** `scripts/build_questions.py:56`, `:128`, `:57-63`
- Vote questions are created only while the proposal is `upcoming` (line 56). Once the 8-K is recorded (status `voted`) the question is no longer generated, so the `support_at_least` branch (lines 155-160) can never fire on a live question. The MSFT and CSCO questions will disappear on the first refresh after Dec 8 and Dec 15, never shown as Resolved and never scoring anyone.
- If the question did persist, its bar would auto-resolve Yes: `fc.latest[MSFT|ask]` would then be the 2026 vote itself (lines 57-59), so bar = result.
- First-filing bars are the median of `ask_votes`, which shifts whenever any vote on that ask is recorded (e.g. CSCO's ask-customer-due-diligence picks up MSFT item 5 on Dec 8, a week before the Cisco vote). The title's threshold changes under existing forecasts with the same id.
- Coverage-gap questions are dropped once `d < today` (line 128): they vanish the day after they close (AMD on Nov 28), so `filed_after` (lines 161-166) is unreachable. When `companies.json` rolls `next_proposal_deadline` to the next year, a new question with the same id (`q-gap-amd`) appears and old forecasts attach to it.
- Hardcoded `2026 in filed[...]` (line 128) and `x["year"] > 2026` (line 162) break in 2027.

Fix: persist question definitions in a committed, append-only file (e.g. `data/forecast-questions-frozen.json`), with id, title, bar, base p, how, closes and resolves text written once at creation; `build_questions.py` only adds new questions and updates `resolved` and `crowd`. Make ids include the deadline (`q-gap-amd-2026-11-27`).

**H2. Three resolution types have no resolver, so those questions can never be scored.** `scripts/build_questions.py:103`, `:107-112`, `:171-178`
- `max_support_at_least` (the 30% question) has no branch in the resolve loop (lines 150-170) and stays `None` forever.
- The SEC question says "Resolved by hand from the Federal Register", but there's no override file, and any hand edit to `forecast-questions.json` is overwritten by the next refresh (`refresh.yml:56`) or forecast ingest (`forecasts.yml:40`).
- Both conditional questions depend on the SEC question (line 177: `cr is None` → `None`), so they never resolve either.

Fix: add the `max_support_at_least` branch (using `pro`, year 2027, `meeting_date <= closes`); add a committed `data/forecast-resolutions.json` (id → 0/1/"void", source URL) that the build reads.

**H3. Season questions can resolve before they close.** `scripts/build_questions.py:167`
Resolution fires when `q["closes"] <= max(meeting_date in P)`. Upcoming proposals carry future meeting dates, so as soon as any proxy for a meeting after June 30, 2027 is recorded (Tesla, Oracle and Microsoft proxies routinely come out before their meetings), both 2027 count questions and both conditionals resolve, possibly in May 2027 while forecasts are still accepted. The count also includes every `year == 2027` record regardless of date, while `board.js:132` says "on June 30, 2027". Fix: resolve only when `today > closes` (plus a stated lag, e.g. 30 days for records to catch up), and count only records dated on or before `closes`.

**H4. The top-support base rate counts whole seasons, but the question ends June 30.** `scripts/build_questions.py:86`, `:99-103`
The 2025 figure 54% is Tesla (tsla-2025-7, meeting 2025-11-06). In this site's data a season runs past June 30 (the MSFT and CSCO December meetings are 2026 season, and the 2027 season will include Dec 2027). Seasons with a 30%+ vote by June 30: 2023 yes, 2024 yes, 2025 no, 2026 no → 2 of 4 → smoothed **50%, not 67%**. The same window mismatch affects the count questions in principle (no change to today's figures). The 2026 season is also incomplete (MSFT and CSCO pending). Fix: compute every season base rate over Jan 1 to Jun 30 of each year to match the question, or define "2027 season" as the site's full proxy year and move the close date; say which in the "how" text, and note 2026 is still in progress.

**H5. The coverage-gap denominator counts companies that weren't public.** `scripts/build_questions.py:119-121`
`us` is today's company list. ANT (Anthropic) and SPCX (SpaceX) listed in November 2026 (companies.json: "newly listed November 2026") but count as "no AI proposal, didn't get one next season" in 2024, 2025 and 2026; CRWV (listed 2025) counts in 2024 and 2025. Without them: **12 of 58 = 20.7%** (2024: 5/21, 2025: 2/17, 2026: 5/20) vs the published 12/66 = 18.2%. Fix: count a company in season y only if it had a proxy statement in y-1 and y (a first-proxy year from the data, or a `listed` date on the company row), and state that rule in the "how" text.

**H6. Season questions leave out filers critical of ESG without saying so, and the code is inconsistent about it.** `scripts/build_questions.py:85`, `:91`, `:96`, `:168`
- The exclusion base rate counts over `P` (critical filers included, line 85), while resolution counts over `pro` (excluded, line 168). They agree today only because no critical-filer proposal is recorded as excluded.
- The commitment and exclusion "resolves" texts don't say critical filers are left out; only the 30% question does.
- It matters: the Skadden review in causality.json (exclusions-2026-season) attributes about 45% of 2026 exclusions to one individual filer.
Fix: use `pro` in both, and add "(leaving out those lead-filed by filers critical of ESG)" to both resolves texts.

**H7. The bot can reply "Added" when the forecast was never saved, then republish.** `.github/workflows/forecasts.yml:36-40`, `:53-63`
- `ok` captures only the ingest exit code. If `build_questions.py` then fails, the step fails and Save is skipped; if Save's push fails after 3 tries (`exit 1`), the forecast is also lost. Either way the always-run "Reply and close" step checks only `OK == 0`, posts "Added … It will show on the board after the next publish", closes the issue as completed, and dispatches a publish, with nothing committed.
- Retrying the rebase after `git rebase --abort` re-pulls the same conflicting commit, so the retry loop can't succeed.
Fix: give Save an `id`; in Reply use `OK == 0 && steps.save.outcome == 'success'`, otherwise post "Not added because of a server error; please post again" and leave the issue open. On conflict, re-checkout main and rerun ingest plus build instead of rebasing generated JSON.

**H8. The claim that equal group weighting stops one forecaster setting the figure is false.** `board.js:7-8`, `:125`, `:130`, `:135`; `scripts/build_questions.py:194-196`
`equal_weight` is the mean of group medians, and groups are self-declared and unverified. A single forecaster in an empty group (e.g. "Journalist") is that group's median and sets 1/G of the headline figure: with 3 groups, one person controls a third. The weighting gives a lone forecaster in a small group more weight, not less. Three board sentences say the opposite: "neither a crowd from one group nor one loud forecaster sets the figure", "a crowd from one group cannot set it" (one person with several accounts can create several groups' worth of weight), and "a few extreme forecasts move them little". Fix: count a group in the equal-weight figure only at n ≥ 3 (pool the rest); say on the board that groups are self-declared and not checked; remove or qualify "cannot set it" and "one loud forecaster".

---

## Medium

**M1. The vote "how" sentence doesn't say what was computed.** `scripts/build_questions.py:77`
"In past votes like this, the result met that figure in 22% of cases" reads as if past votes reached 26.34%. What was computed is the share of past votes of the same kind (refile or first filing, pooled across all asks) whose result was at or above that vote's own starting point. Suggested, for a refile: "Of the 18 refiled votes this site records, 4 (22%) got support at or above the previous recorded vote on the same ask at the same company." For a first filing: "Of 25 first-time votes, 6 (24%) got at least the median of that ask's earlier votes elsewhere." Also state the pooling fallback (lines 66-67) when used, and the 10% fallback (line 63) needs a stated basis: it now reads "starts from 10%" with none.

**M2. "Smoothed" hides the method.** `scripts/build_questions.py:92`, `:97`, `:102`
A reader sees "1 of 4 … smoothed" next to 33% and "3 of 4" next to 67%. Write it out: "smoothed as (1 + 1) ÷ (4 + 2) = 33%". The coverage-gap rate isn't smoothed, which is consistent with its wording.

**M3. A conditional "how" sentence is false.** `scripts/build_questions.py:147`
"The site's records hold no season under either condition" is wrong for the "does not adopt" branch: all four recorded seasons (2023 to 2026) happened without an adopted rescission. Fix: "All four recorded seasons were without an adopted rescission, so this is the unconditional rate; the records hold no season with it adopted." The "if adopted" branch also needs a resolution note: if 14a-8 is gone, what counts as an "exclusion"?

**M4. Forecasts are accepted on the closing day.** `scripts/ingest_forecast.py:51`
`q["closes"] < today` lets forecasts in on the meeting date (preliminary results are announced at the meeting) and on the filing deadline. The board's own copy says gap questions close "at the deadline, before filings become public". Fix: `today < closes` (UTC), and say so on the form; `board.js:87` should treat `closes <= today` as closed even if unresolved (hide the slider and Post link).

**M5. Vote questions invite people who cast the votes to publish group forecasts of support before the meeting.** This touches PRODUCT.md "Never claim" #1 (no vote coordination). The filer flag only covers filers. An "Investor or asset manager" or "Proxy advisor" group median for "will this get 26%?", published during the solicitation period, can read as a signal of how a group intends to vote, even though the copy says otherwise. Owner decision. Options: (a) drop vote-support questions and keep outcome questions (filing, withdrawal, exclusion, rules); (b) close vote questions when the definitive proxy is filed; (c) add a second flag, "I or my organization vote shares at this company", that excludes those forecasts like the filer flag. Also, PRODUCT.md's "Its questions are about outcomes, never support" sits awkwardly with questions titled "get at least X% support"; clarify it means forecasters never state their own support.

**M6. Gap-question wording claims more than the data shows.** `board.js:24`; `scripts/build_questions.py:131`, `:133`
"Where no investor filed an AI proposal in 2026": the data only shows that this site records none (privately withdrawn filings never reach a proxy; SOURCES.md line 16). Use "where this site records no AI proposal in 2026". The title says "any investor" but resolution leaves out filers critical of ESG: say so in the title, or "any investor (not counting filers critical of ESG)". Resolving No after 300 days of no record (line 165) should read "No if no such proposal is recorded by [date]".

**M7. Exclusion and withdrawal base rates depend on what the site recorded.** There are no exclusions in 2023 to 2025 and no withdrawals in 2023 or 2025. That may reflect coverage growth rather than outcomes (exclusions before 2026 ran through no-action letters). The "how" text should say "seasons recorded here" and note that tracking of withdrawals and exclusions before 2026 may be incomplete; if that can't be confirmed, mark it `[TODO]` for the owner.

**M8. Free-text reasons are published unreviewed.** `scripts/ingest_forecast.py:62-63`; `forecasts.yml:46`
Any GitHub user's "Why" text is committed to `data/predictions.json` and deployed with `data/` on the site. It could contain personal data, claims about named people, or confidential information (PRODUCT.md "Never claim" #6, people: public details only). Fix: drop `reason` from the published data (link the issue instead), or hold reasons as "not yet reviewed" until a person approves them.

**M9. The SEC question's title and resolution disagree.** `scripts/build_questions.py:108-109`
The title says "adopt a final rule", but resolution is Federal Register publication, which comes weeks after the Commission vote. Near June 30 they give different answers. Pick one, and say how a partial rescission or amendment counts.

**M10. "To withdraw a forecast, post again or comment on your issue" is false.** `board.js:133`
A comment does nothing automatically, and posting again replaces the forecast; 1 to 99 can't express a withdrawal. Either add a withdrawal path or say "you can replace a forecast by posting again; forecasts cannot be withdrawn."

---

## Low

- **L1.** `ingest_forecast.py:20-30`: the `### ` parser lets the "Why" textarea redefine earlier fields. A line `### Do you or your organization…` followed by `No` overrides the filer answer, and `### Confirmation` with `[x]` ticks the box. Values are still validated, so the main effect is evading the filer flag, which a filer could do anyway by answering dishonestly. Fix: take only the first occurrence of each known form label.
- **L2.** `ingest_forecast.py:48`: the bot reply echoes user `qid[:60]`; markdown and @mentions in it would make the bot ping people. Wrap it in backticks or strip `@`.
- **L3.** The "SEC staff review" sentence (`build_questions.py:97`) and the Wolfers and Zitzewitz claims (`board.js:135`) need source links (PRODUCT.md "Never claim" #4). The paraphrase "resist manipulation" should note these findings come from real-money markets.
- **L4.** `board.js:73`: the below-10% warning contradicts its own reason. If people overrate unlikely events, the correction is to go lower, yet the warning discourages going below 10%. Reword to flag only overconfidence near 0 and 100.
- **L5.** `board.js:40` "increasingly direct votes through pass-through voting" is an unsourced trend claim. `board.js:38` invites "Employees of AI companies" to forecast outcomes at the companies tracked here; add "do not forecast questions about your own employer from non-public knowledge".
- **L6.** The leaderboard ranks mean Brier over different, self-chosen question sets (`build_questions.py:210`), so scores aren't comparable, and filers are scored and ranked (line 203) on outcomes they can influence. Consider leaving filers off the ranking; at minimum label it "averages over the questions each person chose".
- **L7.** The withdrawal test is keyword matching on free text (`COMMIT_WORDS`, line 27); "had not agreed to" would match. A structured `withdrawal_reason: "commitment"` field would be safer.
- **L8.** The resolution text says "the 8-K reports support (for ÷ (for + against))", but most 8-Ks give counts only (see the dlr-2026-4 support_note). Use: "support, computed by this site as for ÷ (for + against) from the 8-K counts".
- **L9.** `tests/board.spec.js:13` depends on `q-msft-2026-5-bar`, which (because of H1) disappears after Dec 8, so the test will break. Use a fixture.
- **L10.** Design rule, not data, so put it in the Queue: `board.js:50` uses an inline `style="width:…"`, which AGENTS.md rule 10 forbids.

---

## Workflow safety: what passes
- The issue body, author and number reach Python only through `env:`, never interpolated into `run:` text. `${{ github.event.issue.number }}` at line 47 is an integer. No shell-injection path from the body.
- `ISSUE_USER` is checked against `[A-Za-z0-9-]{1,39}`; probability is a 1-99 integer; group is from the list; the question must exist and be unresolved.
- Label gating via `contains(labels, 'forecast')` works. Anyone using the form gets the label, so this is a routing filter, not a security boundary; nothing stops spam issues or several accounts per person (see H8).
- The `concurrency: forecasts` group serializes writes to predictions.json.
- `workflow_dispatch` via `GITHUB_TOKEN` does start a workflow (unlike a push made with `GITHUB_TOKEN`), and `actions: write` is granted, so the publish dispatch is the right mechanism.
- `refresh.yml` change: with `task=publish`, `refresh` is skipped and `deploy` runs because its condition accepts `skipped`. Correct. Pre-existing quirk for the Queue: `task=fund-votes` also skips `refresh` and therefore also republishes the site.
- Adding `build_questions.py` after `build_forecast.py` in the weekly refresh is the right order; it will, however, run the H1 and H3 failures every week.

## Crowd aggregation and scoring: what passes
- Latest per (question, handle), sorted by (`made`, issue number): correct.
- Filers are excluded from n, group medians, equal_weight, all_median and all_mean, and the count left out is shown: correct.
- Brier (p − outcome)²: correct; "0 is perfect" and "0.25 for always saying 50%" are correct. The leaderboard minimum of 3 resolved is correct, void questions aren't scored, and crowd vs site is computed on the same resolved questions, correctly paired.

---

## What must change to pass
1. Freeze question definitions; stop vote and gap questions vanishing (H1).
2. Add resolvers for the 30% question, the SEC question (hand-resolved, with a source) and the conditionals (H2); stop early resolution (H3).
3. Recompute top-support over the window matching the question (H4) and the gap rate without not-yet-public companies (H5); make the season counts consistent about critical filers and say so (H6).
4. Make the bot's reply depend on a successful push (H7).
5. Set a minimum group size for the equal-weight figure and correct the "cannot set it" claims (H8).
6. Fix the M1, M2, M3, M6 and M10 sentences; get the owner's decision on M5.

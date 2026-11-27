# Prediction board (Plan and test › Prediction board)

Owner's request, 2026-11-26: "make one of the pages a new page after the make a plan one that is a prediction board - pretend you are a prediction specialist and design a user friendly board that allows people to vote on different proposals that indicates their likelihood - think outside of the box about who could access this to make the predictions the most representative of the truth and all stakeholders involved". Earlier the same day: "it wont be for money like poly market just the function of prediction games to optimize results". The owner then shared Wolfers and Zitzewitz, "Prediction Markets in Theory and Practice" (2006) for context, and a forecasting-module spec (question types, play money only, Brier scoring, conditional branches, coverage gaps, public information only, filer disclosure).

## What was built (Phase 1 and 2 of the spec)

- `scripts/build_questions.py` → `data/forecast-questions.json`. Question kinds:
  - **Coming votes** (`vote`): will support reach the benchmark (latest vote on that ask at that company, else the ask's median elsewhere)? Starting estimate = share of past votes where the result met that benchmark, from `data/forecast.json` errors (refile or first filing).
  - **The 2027 season** (`season`): a withdrawal after a commitment; 3+ exclusions; a vote of 30%+. Starting estimate = seasons with the outcome, Laplace-smoothed.
  - **Rules** (`policy`): SEC adopts the 14a-8 rescission by June 30, 2027. No base rate.
  - **Coverage gaps** (`coverage_gap`): US-proxy companies with no AI proposal in 2026 and an open deadline. Starting estimate = pooled share of no-proposal company-seasons followed by a proposal. Closes at the deadline.
  - **If, then** (`conditional`): exclusions given each answer to the SEC question; the branch whose condition fails is void.
  - Resolves automatically from the site's records where it can; Brier scores; crowd vs the site's estimates; leaderboard at 3+ resolved forecasts.
- `board.js`: base rate first; your probability in a private slider; crowd shown only after you forecast ("Crowd forecast (n = …)", each group's median, every group weighted the same); warning below 10% or above 90% (favourite-longshot bias); group by topic or company; conditional branches side by side; ground rules; who is invited and why; how it works.
- Posting: the GitHub issue form (`.github/ISSUE_TEMPLATE/forecast.yml`) → `.github/workflows/forecasts.yml` → `scripts/ingest_forecast.py` validates and appends to `data/predictions.json`, rebuilds, replies, closes the issue, and dispatches `refresh.yml` with `task=publish` (which skips the refresh job and deploys).

## Choices made (owner auto-approved decisions)

- **Collection backend:** GitHub issue forms. No new service, every forecast is public and auditable, and identity is a GitHub account (the "display name the participant picks"). Downside: forecasters need a GitHub account. A Tally or Google Form route could be added later for people without one.
- **Aggregation:** medians per group and an equal-weight mean of group medians, rather than a market price: the crowd is small, there is no money to make manipulation costly, and medians resist a few extreme entries.
- **Filers:** self-declared filers are kept but left out of the crowd figure (spec: self-fulfilling forecasts).

## Not built (queued)

- Proxy-advisor questions: ISS and Glass Lewis recommendations are paid and not reliably public, so resolution would be uneven.
- Per-proposal exclusion and withdrawal questions: the open 2026 proposals are already on the ballot; these appear once 2027 filings are recorded.
- Ask A vs ask B conditional questions, calibration chart, season write-up, LMSR sandbox (spec Phases 3 and 4).
- Legal review before inviting participants beyond a small pilot (spec: coordination risk).

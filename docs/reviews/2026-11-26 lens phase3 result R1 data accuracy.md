REVIEWER: Data accuracy SCORE: 80 VERDICT: REVISE

TOP FAILURES
1. **Fund tickers are reported as not found, which is false.** `FundVotes.index` builds `trusts` from `filings[].trust` (votes.js), not from `fund_votes.json` `families`. So the `ticker:IVV`, `ticker:DSEFX`, `ticker:GCEQX` and `ticker:TISCX` entries are never matched. I ran `match(ctx,"IVV")` and got `notFound:["IVV"]`. The live line then says "Not found among the tracked companies or the fund families with readable Form N-PX votes: IVV". IVV is the fund behind BlackRock's rows, and the other three are the only funds covered for Domini, Green Century and TIAA-CREF. Plan Rev 2 says to match "against family names and their trust names". Fix: also match the `families` entries, with the `ticker:` prefix removed.
2. **Common words silently pick a family.** "Fund" picks Parnassus, "index" picks Vanguard, and "ETF" and "trust" pick BlackRock (iShares). The feed then shows "How your fund voted last year" for a family the user never named. Separately, "Calvert, Parnassus" keeps only Calvert. Parnassus is not added to `notFound` and no note says it was dropped. Suggested fix: ignore generic words (fund(s), trust, index, ETF, series), and add "only the first fund family is used" to the live line.
3. **A held-back proposal would get a false "Not checked" line (not triggered by today's data).** When the earlier version fails `usable()` (held back or not checked), `fund()` returns "Not checked: that earlier version isn't in the fund votes data." Plan Rev 2 says held-back rows are "never shown". For meta-2026-3 the sentence would be untrue: it is in the data, held back for checking. No upcoming proposal points to it today.

TOP IMPROVEMENTS
1. **Narrow the heading.** "How your fund voted" can overclaim. For "Vanguard 500 Index Fund" the line rests on 1 Vanguard fund record from partial coverage, and that record may not be that fund. Consider "How {Family} funds voted…". The body text is already accurate.
2. **Recheck what "Vanguard 1 fund record" means.** msft-2025-8 and msft-2025-9 each have 1 record from Vanguard Index Funds. That record could be a whole-trust aggregate. If so, "1 fund record" may need a note.
3. **Align the earlier-version window with "about 12 months".** The code uses 400 days. MSFT is 368 days, so it passes either way.

Verified correct:
- **Feed items:** at 2026-11-25 the feed lists msft-2026-4, 5 and 6, then csco-2026-5.
- **Proxy notes:** quoted as "Vote by 11:59 p.m. Eastern, December 7, 2026." for the three MSFT items. Cisco has none.
- **Fund lines:** all 8 families on msft-2026-5 and 6 match the summary rows for msft-2025-9 and 8. That covers vote, `fund_records`, every source, the not-yet-reviewed flag (Parnassus reviewed, none shown), and the partial note for Vanguard only. They agree with the Fund votes tab's † and ‡ marks.
- **Domini:** shows "Not checked", correctly ignoring its 2023 row.
- **No earlier version:** msft-2026-4 and csco-2026-5 show no fund line.
- **Praxis:** shows the `not_shown` sentence.
- **Quiet lines:** they leave out deadlines that have passed (AAPL September 10) and show open ones with their proxy source.
- **Input matching:** "BlackRock", "iShares", "Pax", "TIAA", "Vanguard 500 Index Fund" and "msft" match correctly, and "a" is rejected.

OUT-OF-FIELD NOTES
- The earlier version's title ("…Human Rights Hotspots") is quoted in the "about" line; the owner has not yet confirmed it is the same resolution as "…and Conflict Hotspots" (open since R1).
- `board_rec` is in upcoming.json items but is not read by the feed, which is correct.
- Typing "apple" (a company name, not a ticker) falls through to not found; the hint could say tickers only.

CONTENT RULES: PASS. There is no vote advice (upcoming.json's disclaimer is shown once, and votes are labelled neutrally). Fund rows link to every N-PX source, and the unreviewed and partial flags match the Fund votes tab. Never claim 5 holds: the counts and dates come straight from the data. One caveat: the "not found" sentence for fund tickers (failure 1) states a false fact about coverage, so it should be fixed before release.

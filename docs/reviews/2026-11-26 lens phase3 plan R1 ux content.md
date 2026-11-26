REVIEWER: UX / content SCORE: 72 VERDICT: REVISE

TOP FAILURES
1. **The fund vote line only handles a clean For or Against.** The plan's only template is "Vanguard voted Against the 2025 version". But `data/fund_votes.json` `summary` has these vote values: AGAINST 160, FOR 131, SPLIT 21, ABSTAIN 14, NEEDS_CHECK 5. The plan gives no wording for SPLIT (use `counts`, e.g. "3 funds For, 1 Against"), ABSTAIN or NEEDS_CHECK. NEEDS_CHECK should show no vote, or "source pending". Each row is also a family-level total built from a few fund filings. Vanguard on msft-2025-8 is `{'AGAINST': 1}`, which is one fund record. "Vanguard voted Against" overstates that, which touches Never claim 5. Wording should be closer to "Vanguard funds in this data (1 fund): Against".
2. **Some copy conflicts with PRODUCT.md and DESIGN.md.**
   - The plan's "matched automatically, not yet reviewed" departs from Never claim 4's fixed wording, "auto-detected, not yet reviewed".
   - The empty state "No AI proposals on the ballot at Apple" claims to know what is on a ballot that may not be filed yet. It needs scope, per Never claim 9: "No upcoming AI proposals in this tracker for Apple."
   - "Not found: XYZ" should say what the search covers: the companies tracked and the 8 fund families, with Praxis not readable.
   - DESIGN.md named rule 6 and PRODUCT.md ("no definitions, primers") both forbid definitions. The plan doesn't amend either to carve out this lens, so it breaks AGENTS rule 3.
3. **Parts of the owner's spec are not met or not specified.**
   - The spec's heading "How your fund voted last year" never appears as copy in the plan.
   - "Last year" is undefined when `vote_history` has several years (msft-2026-6 has 2023, 2024 and 2025). The plan should say it uses the latest year that has a row, and should label the year.
   - "Write all copy in plain language" covers the whole lens, but the plan leaves the lens's graph view in practitioner wording: the "Node size = AI proposals on file" intro, the key, and the panel actions.
   - The plan doesn't say which strings carry which glossary terms. "Co-filer" never appears in the feed, and "[proxy statement]" is a link, so a term button inside it is unresolved.
   - "Fund nodes" are dropped. That is noted, but it should be raised with the owner as a change to her spec.

TOP IMPROVEMENTS
1. Give the feed a heading that names the data, e.g. "Upcoming AI proposals at your companies". Quote upcoming.json's existing disclaimer ("does not suggest how anyone should vote") next to fund votes, so a past vote doesn't read as a cue.
2. Say what "See the bigger picture" does when only a fund was entered (no tickers, so there is no overlay), and what the feed does after a meeting date passes but `status` is still "upcoming".
3. Say how the input tells a ticker from a fund name, how many funds it accepts (`localStorage["fund"]` is singular), and how partial matches like "Pax" or "iShares" are reported.

OUT-OF-FIELD NOTES
- Accessibility: the term pattern mixes a toggle button (`aria-expanded`) with `role="tooltip"` opened by hover. Pick one pattern (a toggletip) and check that tap works on a phone.
- Data accuracy: `plain_summary` drafted from the proxy needs a reviewed flag and a no-judgement check before it shows.
- Visual: Phase 2's "Proposal deadline" countdown line in the feed needs a token-based style.

CONTENT RULES: FAIL. Never claim 4: the auto-match wording doesn't match the required phrase. Never claim 5: a family-level vote is stated from as little as one fund record, and SPLIT and NEEDS_CHECK have no wording. Never claim 9: "no AI proposals on the ballot" has no scope. Rule 3: DESIGN.md rule 6 and PRODUCT.md "no definitions" aren't amended for this lens's glossary. Never claim 1 and 2 are covered: no `board_rec`, no advice.

REVIEWER: Data accuracy SCORE: 78 VERDICT: REVISE

What held from R1: I rebuilt the file by running a copy of publish_fund_votes.py on the npx_v5 artifact. The output is byte-identical to data/fund_votes.json: 285 rows, 39 reviewed (all Parnassus, matching fund_votes_reviewed.json), 25 near misses. All 285 rows display. Domini 2025–26 and TIAA 2024 now show "Not checked" (48 cells).

TOP FAILURES
1. **The design is wrong: the conflict guard only catches a duplicate ballot item when the two votes differ.** It skips multi-line records and flags a cell only when the same fund votes differently (publish_fund_votes.py:33-42). Meta 2026 has a second "Al data usage oversight" item in every family's filing. TIAA voted FOR on one and AGAINST on the other, so that cell was held back. Parnassus (2632 shares, recorded twice) and Vanguard (55,249,129.67 and 2,086,528.06 shares, each recorded twice) voted the same way both times, so they slipped through. Vanguard meta-2026-3 shows "Split: 8 against, 2 for, 2 split within a fund". Two of those 8 are duplicates. That is a wrong number on the page (Never claim 5). Parnassus meta-2026-3 is marked reviewed with fund_records 2 for one fund.
2. **The build didn't follow the design: coverage is tracked per family, but filings are per trust.** BlackRock's "iSHARES TRUST" (IVV) has a readable filing only for 2026. Its 2024 and 2025 filings are missing, and fund_votes.json `notes` says nothing about them. The 2026 Vanguard Institutional Index Funds filing is text-only (in `notes`). Both families still count as "covered" for those periods (votes.js:23-28). So a BlackRock 2024–25 or Vanguard 2026 cell, or a "No vote found", silently leaves out the family's largest index funds. This is the R1 failure 1 problem, one level down.
3. **The build didn't follow the design: proposals without a meeting date get the wrong period.** Fallback at votes.js:27. googl-2024-child-online-safety has no meeting_date in proposals.json. The other families' rows for it carry 2024-06-07. TIAA (periods 2025 and 2026 only) therefore shows "No vote found" where it should show "Not checked".

TOP IMPROVEMENTS
1. Flag any repeated (source, shares) record on one proposal, whatever the vote. Count each fund once. Recheck the Parnassus and Vanguard meta-2026-3 cells.
2. Record coverage per trust. Mark a family-period "partly checked" when one of its trusts is unreadable or missing.
3. Fill in meeting_date for googl-2024-child-online-safety, amzn-2026-climate-cost, meta-2025-child-safety and meta-2026-child-safety-pay.

OUT-OF-FIELD NOTES
- In the desktop-light screenshot, almost every family shows "No vote found" on Meta 2024–25 (e.g. Calvert). That's worth a matching check; unverified.
- The R1 Split wording is fixed: votes.js:82 now describes fund records and within-fund splits.
- The page shows 49 proposals; the commit title says 53.

CONTENT RULES: FAIL. Never claim 5: the Vanguard meta-2026-3 count includes 2 duplicate records (artifact `records`, source 000110465926101970 and 000110465926102044). Never claim 4/9: BlackRock 2024–25 and Vanguard 2026 cells are presented as the family's votes, but trusts holding its largest funds went unread.

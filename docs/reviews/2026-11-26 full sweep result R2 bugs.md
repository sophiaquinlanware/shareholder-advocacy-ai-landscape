REVIEWER: Bugs SCORE: 88 VERDICT: PASS

I drove the built site at :8792 with Playwright and Chrome at 1440 and 390 px. There were no page or console errors. `dist/` matches the source for all seven changed files. All 11 round-1 findings are fixed. The three you left for the owner (Back with replaceState, 906 vs 918, phone sort headers) I did not re-check.

Re-review:
- Quick search with no ticker: **fixed.** "OpenAI", "Warner" and "Mistral" each open their own profile (`co-pick` shows OpenAI / Warner Bros. Discovery / Mistral AI).
- Proposals chart filtered while hidden: **fixed.**
  - Fresh load: Microsoft → "See these in All proposals" gives "11 voted proposals plotted" next to "Showing 14 proposals of 79".
  - Chart drawn first, then NVDA set from Company profiles: it reads "1 voted proposal plotted". Clear brings back 65.
- Laws and rules panel: **fixed.**
  - Region set to United States: the panel empties, and "Causes only" dims 0 of 74 nodes.
  - "Show everything": the panel empties and 0 of 195 nodes are dimmed.
- Scorecard focus: **fixed.** After Enter or click, `activeElement` is the same `.sc-cell` ("Anthropic, Clear roles: Met"), and Tab goes on to the next cell.
- `.seg` on phones: **fixed.** At 390 px the pillar buttons wrap onto 3 rows, the widest reaches x=313, and the page scroll width is 390.
- Planner:
  - Copy feedback: **fixed.** "Link copied." shows. When the clipboard is blocked, the full URL shows inside the viewport at 16–374 px.
  - `?plan=%E0%A4%A`, `MSFT~x`, an empty plan and `nope~nope~nope`: **fixed.** Each renders, with Microsoft selected and one grid square current.
- Deadline time zone: **fixed.** I set the clock to Nov 27, 20:00 Pacific, when UTC is already Nov 28. `todayISO` gives 2026-11-27, and AMD's Nov 27 deadline is still open on the planner, Company profile and Key dates.
- Upcoming ballots: **fixed.** With the clock at Dec 9, only Dec 15 (CSCO) is listed. Dec 8 (MSFT) and Dec 3 (TSLA) are gone.
- Votes caption: **fixed.** It reads "on 1 AI-related shareholder proposal".
- Pass-through intro: **fixed.** It is now plain language.

TOP FAILURES
1. New, minor: `#pl-copy-msg` is never cleared. Copy with the clipboard blocked, then change Company: the message still shows the old URL (`?plan=microsoft~ask-dc-climate-energy`), which is now the wrong plan. "Link copied." also stays after any change. Cause: `sync()` (planner.js:341) resets `#pl-status` but not `#pl-copy-msg`.
2. Older, minor: if a filter change leaves the selected event in view, the panel stays but `redraw` clears `C.highlight`. Picking region "Global" with that event selected left the panel showing it and 0 of 23 nodes dimmed, so the panel describes a trace the map no longer shows (causality.js:261–264).

TOP IMPROVEMENTS
1. Clear `#pl-copy-msg` in `sync()`.
2. In causality `redraw`, call `select(C.selected)` again when the selected event stays in view.

OUT-OF-FIELD NOTES
- Proposals chart caption, grammar: "1 of these figures have a basis note" should say "has" (seen with NVDA filtered).
- Planner: a bad `?plan=` stays in the address bar (`?plan=MSFT%7Ex`) until the first change. Harmless.

CONTENT RULES: PASS. The developer phrase "offered is null" no longer appears. The intro now reads "No program found on the pages checked" means just that.

Test scripts:
- /private/tmp/claude-503/-Users-Quinlan-Downloads-outreach-radar-extension-2/254ea18c-3896-4871-90a5-a793efccf32b/scratchpad/bugr2/r2.mjs
- /private/tmp/claude-503/-Users-Quinlan-Downloads-outreach-radar-extension-2/254ea18c-3896-4871-90a5-a793efccf32b/scratchpad/bugr2/r2b.mjs

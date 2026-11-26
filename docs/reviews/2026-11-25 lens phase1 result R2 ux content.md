REVIEWER: UX / content SCORE: 86 VERDICT: PASS

R1 FIXES CHECKED
- The confidence wording is fixed. It now reads "lead filer · source: verified" and "equity stake · source: reported", so it no longer runs into the relation text (graph.js:344; screenshots desktop-light-impact-microsoft.png and desktop-light-impact-filer-panel.png).
- List view: action buttons are real `<button data-act>` elements wired by `wireActions`, links are kept, and there is a lens measure column, sortable with aria-sort, plus a persistent count line naming the sort (graph.js:373-382 and 621-650). Fixed.
- "Open its filings in Proposals" is dropped and recorded in the plan's Build notes (line 111). That's the right call under the no-dead-controls rule.
- Counts are labelled: "top 3 of 13 by proposals … (3 proposals)" (lenses.js:83). The Policymaker block is headed "Same topic". Each exempt solicitation is linked.

TOP FAILURES (none blocking)
1. desktop-light-policy-proposal.png is stale. It shows "Same topic" twice (the heading, then "Same topic (Social & economic impacts): …"). The working tree has fixed this (lenses.js:158 now leads with `${n.topic}:`; lenses.js was modified after the shots, at 19:29), but no current screenshot shows the fix. Re-shoot before you record the result.
2. The exempt solicitation links are labelled [1] [2] [3] [4] [5] (lenses.js:98; filer-panel screenshot). A practitioner can't tell which filing is which, and a screen reader hears only "1", "2". Use a date or the proposal name instead.

TOP IMPROVEMENTS
1. Policymaker: "notes are in Proposals" points somewhere in text only. A real link or button to the Proposals tab filtered by that topic would make it usable. If no topic filter exists, the current wording is fine.
2. In the Individual lens list, proposals show a blank in "AI proposals on file", and 0-proposal companies (Warner Bros. Discovery, Workday) sort together at the bottom. Consider an en dash for "not applicable" so a blank isn't read as missing data.
3. The upcoming meeting is listed as "Next AI vote: December 8, 2026. Proxy note: 'Vote by 11:59 p.m. …'". Quoting it removes the imperative concern; keep it as is.

OUT-OF-FIELD NOTES
- Visual: with labels shown on select, the labels around Microsoft still overlap heavily ("Microsoft" is hidden under a proposal label) in desktop-light-impact-microsoft.png.
- Data accuracy: the support range now starts at 0.46% and floor proposals are excluded. Confirm the data session's null `support_pct` change has landed so the range doesn't shift after merge.
- Accessibility: the bare numeric link labels from failure 2 also matter for WCAG 2.4.4 (link purpose).

CONTENT RULES: PASS. Actions state dates, links, people and counts. Nothing says how to vote or gives advice. The proxy deadline is quoted as the filing's own words. No average is computed, and the computed-from-8-K caveat is stated. People are shown only by name, title and public profile. Headings are plain labels.

REVIEWER: Accessibility SCORE: 82 VERDICT: PASS

All three failures from the plan review (R1) are fixed. `votes.js:42-43` adds a `<caption>`, `scope="col"` headers and `<th scope="row">` row headers. `votes.js:31-34` gives every cell a full name, for example "Calvert, Report on Use of AI: For, auto-detected, not yet reviewed, opens the N-PX filing". Empty cells now show visible "No vote found" text. `votes.js:86` makes the scroll box a named region you can tab to. `styles.css:167-168` adds the sticky column and a focus outline. `votes.js:82-84` gives the three filters visible labels.

I checked the accessibility tree with Playwright `ariaSnapshot()` at 390 and 1440 px. The region, table, column header, row header and cell names are all exposed as intended.

Contrast, all passing: the focus outline is 7.2:1 in light and 8.8:1 in dark. Sticky column text (`--ink` on `--surface`) and the sticky header (`--ink-soft` on `--bg`, about 7:1) also pass.

TOP FAILURES
1. **The design is wrong (incomplete), and it was built as specified. The sticky column hides focused links (WCAG 2.2, 2.4.11).** I focused each vote link in DOM order with `focus()` and compared its box with the sticky header's right edge. Links ended up partly or fully under the sticky column in 11 of 20 cases at 390 px (light) and 75 of 285 at 1440 px (dark). Example at 390 px: the Domini link spans x 175–214, but the sticky column ends at x 237. `.table-wrap` has no `scroll-padding-left`. My script is in the scratchpad (`a11y.mjs`). It used `focus()` rather than real Tab presses, so treat it as a close stand-in.
2. **Build, minor: `aria-label` on a plain `<span>` (`votes.js:34`).** ARIA 1.2 does not allow naming a generic element. Chromium happens to expose it as the cell's name, but other screen readers may ignore it. The visible text plus the table headers already give the meaning, so the impact is small.
3. **Build, minor: the vote links and `[proxy]` links open a new tab with nothing telling the user** (`target="_blank"`, `votes.js:33,38`). Also, `[proxy]` is read the same way about 51 times in a list of links.

TOP IMPROVEMENTS
1. Add `.table-wrap { scroll-padding-left: 320px }` (match the sticky column's maximum width), or set an exact width on `.sticky-col`. Add this to DESIGN.md under "Sticky first column".
2. Drop the `aria-label` from the "No vote found" span. Change `[proxy]` to visible "proxy" with a hidden suffix such as "for Apple 2024 …, opens in a new tab", and add "opens in a new tab" to the vote link names.
3. Align the caption to the left. On the phone screenshot the caption is centred across the 1048 px scroll width (left edge at x −675), so it shows only as "Votes by fund fa…".

OUT-OF-FIELD NOTES
- The caption counts 51 proposals, but the commit message says 53. Check which number is right.
- The 1440 px desktop view still scrolls sideways inside the table box (scrollWidth 1326 vs 1046), so the Vanguard column is hidden at first.
- The phone view defaults to Apple only (`votes.js:66`), and that choice is reflected in the select. Good.

CONTENT RULES: PASS. Every vote is a neutral `.pill.pending` label with no colour meaning. "No vote found" does not guess a reason. The independence and no-recommendation callout is present (`votes.js:75`). Families not yet reviewed are marked as such.

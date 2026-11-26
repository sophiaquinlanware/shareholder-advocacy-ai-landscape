# Lab routes plan, review R1: UX and accessibility

Reviewer: subagent, 2026-11-26. Saved verbatim.

Score: 72/100

The plan answers the question in the right order: lab, then routes, then pull, then whether you can act. It reuses only sourced data. Three things stop it from answering fast. The table is too wide for a phone, one section ignores the chosen lab, and a few accessibility details are missing.

1. **Eight columns at 390 px is a scroll trap.** OpenAI and Anthropic have 16 ties each. With 8 columns, reading the row "Microsoft, 3 ties, deadline passed" means scrolling sideways past cells with several links in them. Fix: below 600 px, show each row as a card, using `<tbody>`/`<tr>` with `display:block`, each cell labelled from `data-label`. Order the card by the question:
   - Company and role
   - Tie group and strength
   - Deadline status
   - Proxy rights
   - Filers count
   - Related asks and past support, behind a `<details>`

   If you keep the table, make Company a `.sticky-col` header (`<th scope="row">`) and set `tabindex="0"` with a label on `.table-wrap`.

2. **"Can I act this season" is spread over two columns.** Fix: add one compact "Act this season" cell that joins the rights route and the deadline state, for example "Rule 14a-8 · open, 41 days [source]", or "not tracked here". Then drop the separate proxy rights column on the phone card.

3. **Tie group is unclear for companies with several ties.** 14 company-lab pairs have 2–3 ties; Microsoft–OpenAI has 3, and Nvidia has 2 at six labs. The plan doesn't say which group wins or which strength is used in the sort. Fix: state the rule. Use the group of the strongest tie, list the others as "also", and sort by the highest strength.

4. **"Labs reached, by company" ignores the selected lab.** It ranks breadth across all labs and doesn't change with the chip, so it doesn't answer "routes to Lab X". It is close to decorative under the owner's rule. Fix: drop it, or limit it to the selected lab's companies and show "also reaches N other labs" as a plain column. Every bar for one lab would be the same height, so a column works better than a chart.

5. **The findings partly repeat the table.** "No AI proposals filed here yet" is already bold in each row. Fix: keep the findings to one live summary line, "{n} routes to {lab}: {k} with an open deadline, {m} with no AI proposals yet". That one line serves as both the finding and the live status.

6. **Sort buttons.**
   - Put `aria-sort` only on the active `<th>`, and leave it off the others rather than setting `none` on every column.
   - Keep the arrow glyph `aria-hidden`.
   - The button name should be the column name only.
   - After sorting, announce "Sorted by deadline, soonest first" in the live region, not just the route count.
   - Don't make multi-link cells (filers, asks) sortable, because their order means nothing.

7. **The live region fires too often.** One polite region should update on chip change and on sort, not on every render, or a screen reader user hears it twice. Remove `aria-live` from `#pw-panel`, because the panel moves under the map and its HTML is replaced in one go.

8. **Lab chips.** `aria-pressed` on single-select buttons implies each one toggles. Fix: use a radio group styled as chips, matching the existing `.lens-pick` pattern, or keep buttons and make pressing the active one do nothing. Wrap them in a group labelled "Lab".

9. **Bars, if kept.** Make it a `<ol>` with the count as text inside each `<li>`. Mark the bar span `aria-hidden`, scale its width to the maximum, and check that the blue meets 3:1 against white.

10. **Sankey label wrapping.** Long names on two lines add row height, so check the planned shorter rows still have room. The filer filter changes the map silently; add a note above it, e.g. "Filers shown: active at {lab}'s companies".

11. **Wording.** "Related asks" with a per-company count of past proposals could read as a suggestion. Fix: put the "this site's grouping" note in the column header (e.g. a footnote marker linking to the mapping table), not only under the table.

12. **Tests.** Add 390 px checks that:
    - `document.documentElement.scrollWidth <= 390` with OpenAI selected;
    - each card shows deadline status without scrolling;
    - `aria-sort` changes on a keyboard Enter.

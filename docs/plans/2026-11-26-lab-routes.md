# Plan: Lab pathways as routes to a lab

Date: 2026-11-26. UI session, branch `design/lab-routes`. Standing instruction: "Don't ask me any questions about publishing or next steps. Just continue until you complete the project."

## The owner's ask (pasted prompt, 2026-11-26)

"I want leverage over Lab X. Which public companies are routes to it, what kind of pull does each one have, and can I act there this season?" Never claim: no vote recommendations, no coordinating investors, no advice. Say "route" or "tie". Every fact links to its source, "source pending" where missing. No invented numbers. Plain headings, black and white with blue for visuals, no decorative controls, 390 px with no sideways scroll.

## Data used (all existing; no new research)

- `data/pathways.json`: 13 labs, 24 companies, 74 ties (type, strength 1–3, strength_reason, description, as_of, source_url), 8 `gaps`.
- `data/companies.json` (60 records), joined by ticker (`2330 / TSM` matches `TSM`): `shareholder_route`, `route_status`, `next_proposal_deadline` with `_source` and `_status`. Six pathways companies (MU, SNOW, ASML, INTC, DELL and the non-US listings) have no rights record, shown as "not tracked here".
- Deadline open or passed is computed live from the date with `RULES.deadlineInfo` (America/New_York), so a stored "open" past its date shows "passed".
- `data/proposals.json`: AI proposals by company, with `ask_id`, `support_pct`, `results_url`, `proxy_url`.
- `data/graph.json` investor/coalition → proposal edges: filers per company (each name links to a filing where the proposal is on record).
- `data/asks.json`: recurring asks and their categories.

## Layout, top to bottom

1. **Lab chips** (one pressed; OpenAI by default so the table is never empty), and the lab's description with source.
2. **"Routes to {lab}"** table, one row per company tied to the lab. Columns:
   - Company (with its role from roles.js).
   - Tie: group (owner, compute, chips, customer, co-investor), then each underlying tie type, as of date, and source link.
   - Strength: 1–3 with the data's `strength_reason`, linked to the tie source.
   - US proxy rights: `shareholder_route` (or "not tracked here").
   - Next filing deadline: date, "open, N days" or "passed", linked to `next_proposal_deadline_source`; "none on record" when blank.
   - Filers with AI proposals here: count and names, each linked to a filing. A row with none shows "No AI proposals filed here yet" in bold.
   - Related asks: the asks.json asks matching the tie group (mapping below), worded "Related asks", each with how many AI proposals at this company already fall under it.
   - Past support on related asks: the latest voted proposal under those asks at this company: "33.6% (2023)", linked to the results filing. "No vote on record" otherwise.
   - Default sort: strongest tie first, then open deadline before passed or none, then soonest deadline, then name. Column headers are sort buttons (`aria-sort`).
3. **Findings for {lab}** (plain text under the table): "No AI proposals filed here yet: A, B, C." and "Most filers already active: X (n), Y (n), Z (n)" (the top three by filer count, a ranking, not a threshold).
4. **"Labs reached, by company"**: horizontal HTML bars in blue, one per company, ranked by the number of distinct labs it has a sourced tie to; the count is printed at the end of each bar. Static data, no controls.
5. **"Gaps in the tie data"**: the 8 `gaps` strings as a list.
6. **Map** (the existing three-column Sankey), moved below, shorter rows:
   - With a lab chosen, the filer column shows only filers active at that lab's companies.
   - Labels are never truncated: long names wrap onto two lines, measured with `getComputedTextLength`.
   - The side panel becomes a block under the map (no fixed height, so nothing clips). The company checkboxes stay as the secondary filter ("Companies" chips), opening that panel.
7. **"All ties"** table stays, collapsed in a `<details>`.

## Tie groups and related asks (this site's reading, said in a note under the table)

| Group | Tie types | Related asks |
|---|---|---|
| Owner | parent company; board seat or observer; equity stake rated strength 3 | Board oversight and AI transparency reporting |
| Co-investor | equity stake rated 1–2 | Board oversight and AI transparency reporting |
| Compute | cloud/compute provider | Data center energy, emissions and costs; Data center water use; Human rights in data center siting; Customer and end-use due diligence |
| Chips | chip supplier | Customer and end-use due diligence |
| Customer | distribution partner; revenue share/commercial agreement | AI misinformation; Child safety; AI bias; Training data and user data |

The asks.json governance category already names "investments in AI labs", which is why owner and co-investor map there.

## Wording guard

Headings: "Routes to {lab}", "Labs reached, by company", "Gaps in the tie data", "Map of ties and filers". No "leverage", "pressure", "target" or "should". "Related asks" is labelled as the site's grouping, not advice.

## Accessibility

- The table is a real `<table>` with a caption.
- Sort buttons sit in the `<th>`, with `aria-sort`.
- Lab chips use `aria-pressed`.
- A one-line live status reads "{n} routes to {lab}".
- The bars are a list with text counts.
- Contrast is 4.5:1, and the layout fits 390 px: the table scrolls inside `.table-wrap` and the page never scrolls sideways.

## Queue (STATE.md, not built)

- Two-step routes using `value_chain_ties.json` (e.g. TSMC → Nvidia → OpenAI).
- An investor side once 13F holdings are collected.

## Files

`pathways.js`, `styles.css`, `tests/lens4.spec.js` (routes table renders, sort, finding text, no sideways scroll at 390), `DESIGN.md`, `docs/STATE.md`.

## Revision 2 (after plan review R1: UX 72, data 64; built with these changes)

- **Groups:** Owner = parent company only. Major shareholder = board or committee seat, or equity stake rated 3. Co-investor = equity 1–2. A row takes the group of its first tie in the order owner, major shareholder, compute, chips, co-investor, customer; every tie is still listed with its group. Customer asks add targeted ads.
- **Rights and deadline** are one column. A deadline with a date that `deadlineInfo` no longer returns is "passed"; no date is "none on record". Five companies (MU, SNOW, ASML, INTC, DELL) have no rights record: "not tracked here".
- **Proposal scope:** proposals.json covers the 29 US-proxy companies from 2023, so "No AI proposals filed here yet" appears only for those, with "in this site's records, meetings from 2023"; others say "not tracked here".
- **Filers:** lead filer, co-filer and filed (named in proxy) only; exempt solicitations excluded.
- **Support:** null support skipped; missing results link falls back to the proxy with "results source pending"; dual-class flagged. Unmapped proposals listed as "Other AI proposals here".
- **Labels:** "Strength (site rating, 1–3)", "Related asks (site grouping)". "Most filers already active" became "Companies by number of filers on record". Tie text marked reported/unverified carries a flag.
- **Listed labs:** Anthropic (ANT) and xAI (inside SpaceX, SPCX) show their own rights record under the lab chips.
- **Kept, by the owner's prompt:** the labs-reached bar chart (the chosen lab's companies are darker) and the findings list.
- **Accessibility:** one status line (summary on lab change, "Sorted by …" on sort); the panel is not live; table is a labelled scroll region with a caption; phones get cards.

## After result review R2 (UX 84, data 90, both PASS)

Board seats got their own group ("Board seat or observer") so ASML is not called a major shareholder for a strength-2 advisory seat. Lab chips stay `aria-pressed` buttons in a group labelled "Lab"; pressing the active one does nothing. Map labels wrap to three lines, then end in "…" with the full name as a tooltip (a compromise for 390 px).

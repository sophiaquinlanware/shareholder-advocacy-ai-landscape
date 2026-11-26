# Plan: Value chain tab (value-chain map and engagement map)

Date: 2026-11-26. UI session. Data: `data/value_chain.json` on `main` (data session plan docs/plans/2026-11-25-value-chain.md, reviewed 83 PASS). Standing instruction: "Don't ask me any questions about publishing or next steps. Just continue until you complete the project."

## The owner's words

> "One visual is a map of engagement, and another visual is a map of the value chain. Figure out whichever visual, as a data scientist, works best to display that data. I want it to be clear how you can engage at different points in the value chain. For example, it's clear that engaging at this level, hyperscaler level, means this is the effect you can have, these are the different players you can reach, and these are the stakeholders you need to engage with to have engagement in the space." (2026-11-25)

Earlier direction applies: every visual is functional and data-driven; plain labels; practitioners; all visuals blue on the white page (the dark canvas is the co-filer network's exception).

## Where

A new tab, **Value chain** (`#value-chain`), placed after Lab pathways. A new tab adds a URL and breaks none, so the tab list grows from 11 to 12.

## Visual 1: value-chain map (layered flow, left to right)

A value chain has direction and order, so the chart is a layered flow rather than a force graph.
- **Columns:** chips → data centers and power → hyperscalers and AI clouds → frontier labs → AI deployers, in the `order` from `tiers`. Strategic investors are a band under frontier labs, because capital feeds labs.
- **Nodes:** each company in its primary tier (`companies.json` `tier`), as blue circles sized by the number of sourced ties.
- **Links:** the 44 `ties`, as curves from supplier to customer. The tie type is shown by dash, not colour: supplies chips solid; manufactures for long dash; leases capacity or provides compute dashed; supplies power dotted; distributes models dash-dot. A key names each pattern, and the width is constant.
- **Interaction:** clicking a tier header or a company opens a panel under the chart.
- **Text equivalent:** a table of all ties (from, type, to, as of, source) under the chart, sortable by type.

## Panel for a tier: "Engaging at this tier"

Every item comes from `per_tier` and is shown with its link; nothing new is claimed.
- **What it is:** the tier's `what_it_is`, plus a company count (primary and all).
- **Who this tier reaches:**
  - labs reached directly;
  - labs reached in two steps, each with its route ("{from} → {tie} → {via} → {then} → {lab}") and the source.
- **Asks already made here:** `asks_made`, as company, year and title, linked; plus `ai_proposals`, `proposal_topics` and `median_support_pct`, labelled as the data session's median.
- **Who is already engaging:** `active_filers` (with proposal counts), `coalitions` (members active here) and `people` (name and organisation).
- **How shareholders can act:** the `shareholder_routes` mix (e.g. "5 under US proxy rules, 2 US-listed foreign issuers, 1 private"), with no advice.
- **Scope:** `derived_note`, quoted once.

A company panel shows its tier(s), its ties in and out (each with the source), and an "Open in Company lookup" button.

## Visual 2: engagement map (tier × engagement type, a heatmap table)

- **Rows:** the 6 tiers. **Columns:** AI proposals, asks made, investor engagements, safety commitments, fund-vote rows, active filers, coalitions, people.
- **Cells:** each holds its count, shaded light to dark blue by count within its column (with the number always printed), so the gaps read at a glance.
- **Clicks:** each cell is a button that opens the tier panel at that section. A zero cell is plain text, not a button (no dead controls).
- **Caption:** states the scope ("counts cover … per `derived_note`").

## Wording guard

Plain labels with no "target" or "influence" (PRODUCT.md Never claim 1–2). "Who this tier reaches" is stated as sourced ties. The tier classification is "this site's reading" (`about`).

## Files

`valuechain.js` (new), `index.html` (tab and script), `app.js` (render call, alias), `styles.css` (tokens only), `tests/` (the every-tab test covers the new tab automatically; plus a test that a tier click opens the panel and that zero cells aren't buttons), `DESIGN.md`, `docs/STATE.md`.

## Checks

`npm run check`; plan and result reviews (UX/content, accessibility, data accuracy).

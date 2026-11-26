# Plan: AI value chain tiers and an engagement map

## The owner's words

> "Maybe it would be helpful to have tiers or something like that, so you have Frontier Labs (the people directly making the AI), and then you have different avenues that maybe map out the whole value chain of the AI space. One visual is a map of engagement, and another visual is a map of the value chain. Figure out whichever visual, as a data scientist, works best to display that data. I want it to be clear how you can engage at different points in the value chain. For example, it's clear that engaging at this level, hyperscaler level, means this is the effect you can have, these are the different players you can reach, and these are the stakeholders you need to engage with to have engagement in the space." (2026-11-25)

Context: asked while questioning why Tesla is in the rights map. Tiers place Tesla as a strategic investor (its xAI stake) and a consumer AI deployer, and Apple as a deployer.

## Data (this session; branch `data/value-chain`, built on `data/company-universe`)

`data/value_chain.json`:
- `tiers`: ordered list. Each: `id`, `name`, `order`, `what_it_is` (one plain sentence, definitional), `companies` (company ids; a company may sit in several tiers, with `primary_tier` on the company).
  1. chips (chips and hardware), 2. datacenters (data centers and power), 3. compute (cloud and compute), 4. labs (frontier labs), 5. capital (capital and strategic investors), 6. deployers (enterprise and consumer deployers).
- `ties`: sourced company-to-company links across tiers, `{from, to, type, description, source_url}`. Types: supplies chips, manufactures for, leases capacity to, supplies power to, provides compute to, equity stake, distributes models. Company-to-lab ties come from `data/pathways.json`; new research adds chips → compute, data centers/power → compute, and manufacturing ties.
- `per_tier` (derived by a script, never typed by hand): labs reachable through sourced ties (direct and two-step), AI proposals at companies in the tier (count, topics, median support, with links), named investor engagements, safety commitments, fund-vote coverage, shareholder-route mix, and the investors, coalitions and people already active there (from `graph.json`).
- "Effect you can have" is shown as these derived facts plus the asks investors have already made at that tier (existing proposals and engagements), not as new claims.

Script: `scripts/build_value_chain.py`, run with `build_graph.py`.

## Visuals (recommendation for the UI session, which owns page files)

1. **Value chain map: layered left-to-right flow.** Tiers as columns (chips → data centers and power → compute → labs → deployers; capital as a band feeding labs), companies as nodes in their primary tier, sourced ties as links. Click a tier or company: side panel lists the labs it reaches and through which ties, the asks already made there, and who is engaging. Chosen over a force graph because a value chain has direction and order.
2. **Engagement map: tier × engagement-type matrix.** Rows are tiers; columns are AI proposals, investor engagements, safety commitments, fund votes; each cell shows a count and opens its items; a row footer lists active investors, coalitions and people. Shows where engagement happens and where the gaps are.

## Checks and reviews

- Every tie has a source URL that loads; derived numbers are recomputed by script.
- Plan review then result review: Data accuracy and UX / content.
- No "target" or "influence" language in tier text (PRODUCT.md Never claim 1-2).

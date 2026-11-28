# Value chain: node size and line weight from sources; consumer and civil-society groups

## The owner's words (relayed by the UI session, 2026-11-28)

> "do the size of the nodes represent market share - they should and you should say that in the key"
> "the thickness of the lines connecting should represent percent of business to those companies too"
> "consumer advocacy groups - basically all stakeholders, because the ultimate goal is to try and gather support"

This round changes data only. The UI session draws sizes, thicknesses and the Key afterwards.

## What exists today

- **Companies.** `data/companies.json` has 60 companies, with sectors and tiers but no size measure.
- **Value chain ties.** `data/value_chain_ties.json` has 44 company-to-company ties (supplies chips, distributes models, manufactures for, leases capacity to, provides compute to, supplies power to). Each has a description and a source, but no weight.
- **Organizations.** `data/stakeholders.json` has 33 research and advocacy organizations. None is a consumer group.

## What changes

### 1. Company size: `companies[].size`

The field is `{measure, value, unit, year, source_url, source_kind, quote}`.

- **Preferred measure: market share of the company's segment**, where a published figure exists. Examples: AI accelerators, foundry, HBM memory, cloud infrastructure, data-center colocation.
  - Market share almost always comes from a research firm (for example Synergy Research, TrendForce, IDC, Counterpoint, Omdia), quoted from that firm's own release.
  - These carry `source_kind: "research firm estimate"`, and the page labels them "estimate by <firm>".
- **Otherwise, the company's own reported revenue** in the most AI-relevant segment, from its 10-K, 20-F or annual report. Examples: Nvidia Data Center revenue, Microsoft Intelligent Cloud, Oracle cloud, Digital Realty total revenue.
  - These carry `source_kind: "company filing"`.
- **Private labs and companies** get revenue only where the company itself has published it. A press report is not enough. Otherwise the field is left out.
- **Year.** One measure per company, from the latest year with a source.
- **Mixed measures.** Market share and revenue can't be compared directly. The UI therefore sizes by `unit`: it compares companies within the same measure only, and draws the others at the default size. The Key says which measure each node uses.

### 2. Tie weight: `ties[].weight`

The field is `{measure, value, unit, as_of, source_url, source_kind, quote}`.

- **Preferred: "share of supplier revenue"**, from the supplier's own 10-K or 20-F customer-concentration note.
  - Filings often name customers only as letters ("Customer A, 19%"). In that case the customer's name must be stated in the filing itself, or the weight is not used for a named tie. In practice the tie then gets the deal value instead, or no weight.
- **Otherwise: "deal value"**, in dollars with a date, from either party's own announcement or filing.
- **Not sourced:** the field is left out, and the tie draws thin and dashed as "size not known".

### 3. Consumer and civil-society groups

These are added to `data/stakeholders.json` with the same schema and rules as the stakeholder map:
- `kind: "nonprofit advocacy"`, with a focus list that adds `consumer protection`.
- Groups: Consumer Reports, Public Citizen, EPIC (Electronic Privacy Information Center), Consumer Federation of America, and U.S. PIRG. Others are added where they have sourced AI work naming tracked companies, labs or policy events.
- Ties use the fixed relation list, including `publicly supported` and `published a critique of`, each with the group's own words.

**Never claim 1.** The owner's aim is to "gather support". The site maps who works on what. It does not ask any group to act, rank groups by how persuadable they are, or suggest whom to contact for votes. Contact details are never added.

## Tasks

| # | Task | Files it owns | How it is checked |
|---|---|---|---|
| 1 | Company sizes (60 companies) | `data/companies.json` (`size` only) | Data review: open each source, check the quote and figure, and label every research-firm figure as an estimate |
| 2 | Tie weights (44 ties) | `data/value_chain_ties.json` (`weight` only) | Data review: every customer-concentration weight names the customer in the filing itself |
| 3 | Consumer groups | `data/stakeholders/e-consumer.json`, merged into `data/stakeholders.json` | The stakeholder map rules and build checks |
| 4 | Build: copy `size` onto company nodes and `weight` onto value-chain edges | `scripts/build_graph.py` | Build test |
| 5 | Drawing and Key | UI session | Its tests |

## Revision 1 (after the plan review, data and encoding, 64 REVISE)

These override sections 1 to 3 where they differ.

1. **Line thickness shows one measure only: "share of supplier revenue".**
   - The figure comes from the supplier's own 10-K, 20-F or annual report, and only when that filing names the customer.
   - A customer reached through a parent or subsidiary is mapped with `via_parent` (for example "LinkedIn, part of Microsoft") and labelled that way.
   - A customer shown only as a letter ("Customer A") is never matched to a name from other filings or the press.
   - Each figure keeps its `as_of` and fiscal-year basis, and the panel shows the year.
   - **Deal values are not thickness.** They go in a separate `deal` field: {value, unit, term, as_of, source_url, quote}. The panel and the List view show the deal value next to the tie. "Up to" and capacity figures (for example gigawatts) are stored as stated, with their unit.
   - A tie with no revenue share is drawn thin and dashed, with the label "share not known".
2. **Node size compares like with like.**
   - `size` adds a `segment` field.
   - Nodes are sized only against companies with the same measure, segment, source firm and year.
   - A node with no size, or with no peer in its group, is drawn hollow with the label "size not known". It is never given a default size.
   - The Key says "size: <measure> within <segment>, <source>, <year>".
   - This sizing applies to the AI value chain view only. Every other view keeps its own size rule ("Size = number of connections" and each lens's `sizeLabel`).
   - A research firm's figure counts only from the firm's own public release. A paywalled figure is left out.
   - Revenue keeps its reporting currency. Revenue in different currencies is not compared.
3. **Consumer groups are added only when they have sourced AI work that names a tracked company, lab or policy event.** Naming a group in this plan does not put it on the map.
   - "publicly supported" always points at a policy event or a published statement. It never points at this site or its asks.
   - Organization nodes stay in the `organizations` layer. Warm paths already skip that layer, and Plan an engagement and the route views don't use organizations.
4. **Build checks.**
   - The build rejects a `size` without `segment`, and a `weight` whose measure isn't "share of supplier revenue".
   - The List view shows every size, weight and deal with its source, and "estimate by <firm>" where that applies (DESIGN rule 4).

# Plan: companies in scope for responsible AI engagement

## The owner's words

> "Include all the companies that would be relevant to target for increasing responsible AI. Who would you need to influence in the private sector to make AI more responsible? You can look at the history of different companies that have been engaged to increase their responsible AI. This includes interaction with consumer AI products, business enterprise AI products, data centers, and frontier labs." (2026-11-25)

> Scope choice: "Keep all 60" (2026-11-25), including Southern Company (2026 proposal on data center costs) and seven Chinese companies that signed China's AI safety commitments.

## What exists today

- `data/companies.json`: 7 companies (Microsoft, Alphabet, Meta, Amazon, Nvidia, Apple, Tesla), each with rights-map fields (state, bylaws, threshold, control, director voting, levers, matrix) and source links.
- `data/pathways.json`: 24 public companies and 13 labs with sourced ties; `data/graph.json` built from it and the other data files by `scripts/build_graph.py`.
- The UI session (branch `design/round2-structure`) is making every view data-driven for any number of companies. Agreed fields: `sectors` and `engagement_basis`.
- Research output (not yet in the repo): 60 companies with a sourced basis each, 16 groups left out with reasons.

## What changes and why

This round changes **data only** (no page files). The UI session builds the views.

1. **`data/companies.json` grows from 7 to 60 entries.** Every entry gets:
   - `id`, `name`, `ticker`, `exchange`, `country`, `cik` (US-listed only)
   - `sectors`: one or more of "consumer AI", "enterprise AI", "data centers & compute", "frontier lab"
   - `engagement_basis`: `{text, url}`, one sourced sentence on why the company is in scope
   - `evidence`: up to 3 more `{text, url}` items
   - `investor_access`: "US-listed", "listed outside the US", or "private", so readers can see where shareholder routes apply
   - `rights_tracked`: true for the 7 with a full rights map, false for the rest (their rights cards say the map covers only the first seven for now)
   The existing 7 keep every rights field unchanged and gain the new fields.
2. **Selection rule recorded in the file** (`about` key) and in SOURCES.md: a company is in scope if a source shows at least one of: an AI-related shareholder proposal (2023-2026); a published investor engagement on AI; signing a frontier AI safety commitment (Seoul 2024, the EU General-Purpose AI Code of Practice, the 2023 US voluntary commitments, or China's December 2024 AI safety commitments); or a material compute agreement with a frontier lab disclosed in a filing or by the lab.
3. **`scripts/build_graph.py`**: company nodes carry `sectors` and `investor_access`; every company in `companies.json` becomes a node even without other ties, so the network and filters can group by sector.
4. **SOURCES.md**: a row for "Which companies are in scope", with the rule above and an upkeep cadence (yearly, after the proxy season, plus when a new safety commitment list is published).

## Checks on the research before it goes in

- Every `engagement_basis` URL loads (curl, browser user agent); failures are fixed or the company is held back.
- Spot check 12 companies (all 4 sectors, the Chinese firms, Southern, Disney, Comcast, SpaceX) by opening the source and confirming the sentence.
- SpaceX's exchange is confirmed or set to "UNVERIFIED" in the data (shown as "source pending").
- No em dashes, no "genuinely" or "real"; sectors only from the four values.

## Tasks, owners, checks

| # | Task | Files owned | Check |
|---|---|---|---|
| 1 | Link check and spot checks on the research | none (scratch) | results recorded in the commit body |
| 2 | Merge 60 companies into `data/companies.json` | `data/companies.json` | build passes; each entry has sectors and a sourced basis |
| 3 | Graph builder: sector and access on company nodes | `scripts/build_graph.py`, `data/graph.json` | node count rises by the new companies; no orphan errors |
| 4 | Docs | `SOURCES.md`, `docs/STATE.md`, this plan | read-through |

## Reviews

Plan review, one round: **Data accuracy** and **UX / content** (the basis sentences are shown to readers).

## Revision after plan review R1

Reviews: Data accuracy 68 REVISE, UX / content 66 REVISE (`docs/reviews/2026-11-25 company universe plan R1 *.md`). Adopted:

**Fields (replace `investor_access`)**
- `shareholder_route`, each with `route_source_url`: "US proxy rules apply" (files 10-K and DEF 14A), "US-listed foreign issuer" (files 20-F or 6-K; exempt from US proxy rules), "listed outside the US", "private". Set from the company's EDGAR filing types, linked.
- `basis_type`: "shareholder proposal", "investor engagement", "safety commitment" or "compute agreement". The UI labels `engagement_basis` as **"Why included"**, never "engaged" (message to the UI session).

**Selection rule, written as applied** (in the `about` key and SOURCES.md). A company is included when a source shows one of these, *and* it develops, sells or operates AI models, AI products or AI infrastructure, or deploys generative AI in consumer media or products:
1. an AI-related shareholder proposal, 2023 to 2026;
2. a published investor engagement on AI or on AI's direct effects (e.g. data center water), named by the investor;
3. signing a frontier AI safety commitment as a model developer (Seoul 2024, the 2023 US voluntary commitments, the EU General-Purpose AI Code of Practice, China's December 2024 commitments);
4. a material AI compute agreement with a frontier lab or a hyperscaler, disclosed in a filing or by the counterparty.
Companies that use AI in their own operations without selling or deploying it to consumers (e.g. Lyft, Visa) are out. The list is **not a census**: the EU and China commitment lists are long, and this version includes the signatories named in the research; others can be added from the same sources. Owner choice recorded: all 60 found are kept, including Southern Company and the Chinese signatories.

**"Frontier lab"**: develops its own general-purpose foundation models, *and* either signed a frontier-model safety commitment as a developer or has model development as its main business.

**Wording**: every `engagement_basis.text` follows one template, "[Year]: [event] ([who])", plain and neutral. No "target", no "standout", no vote percentages (support figures live in the proposal feed with their 8-K sources). Parnassus engagements use Parnassus's own words.

**Sources to add or fix**: SpaceX/xAI ownership from SpaceX's filing; each Chinese legal entity tied to its brand by a source (or the brand dropped to the entity name); Disney and Comcast from SEC staff letters if public, otherwise kept with a "secondary source" note; non-AI evidence items removed (Nvidia product-emissions proposal, Broadcom climate engagement); TSMC worded as Parnassus's climate and water engagement, with AI demand as Parnassus's stated context; Nebius's agreement is with Microsoft and counts under rule 4.

**Checks**: spot checks add the five foreign issuers (Alibaba, Baidu, TSMC, Nebius, Arm) and every remaining vote or deal figure.

## Not in this round

- Rights-map fields (state, bylaws, thresholds) for the 53 new companies. Queued: the rights researcher can extend them company by company.
- Fund votes and proposal feed for the new companies (needs new proposal research first).
- Any page or view change (UI session).

## Data rules as built (after result review R1 and R2)

- **Sentence template** for `engagement_basis.text` and every `evidence` text: "[Year, YYYY to YYYY, or Undated]: [subject] [event] ([filer; ]source name)". Undated when the cited source gives no date for that company. No vote figures, no judgement words.
- **Routes:** `shareholder_route` is "US proxy rules apply", "US-listed foreign issuer", "listed outside the US", "private", or null. Every non-null value has `route_source_url`. Null means not determined, and `route_note` says why, starting "source pending:" unless a sourced fact explains it (e.g. a Form 15 deregistration). `route_note` may also qualify a non-null value (newly listed domestic issuers).
- **owner_choice_note**: on entries kept by the owner's decision where the AI link is indirect (TSMC, Southern Company).
- **Queued:** 9 private labs with "ownership not yet checked" (G42, Inflection, Magic, 01.ai, DeepSeek, Aleph Alpha, Black Forest Labs, Reflection AI, WRITER); rights-map research for the 53 untracked companies.

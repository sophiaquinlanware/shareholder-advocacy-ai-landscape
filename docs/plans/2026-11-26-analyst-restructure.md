# Plan: one analyst's path through the site (12 tabs to 6)

## The owner's words

> "go through the entire website and access it like you are an analyst from [Parnassus] who's looking for ways to engage in shareholder advocacy in the AI space to make AI more responsible. I want you to identify and eliminate any redundancies in the information or representation of information on this website and make it so it's super intuitively easy. It feels chronological. All the titles, headers, and subheaders feel relevant, and it's easy to navigate, with it being clear why each thing is there and for what purpose it serves." (2026-11-26)

## Audit: the live site as a Parnassus stewardship analyst (2026-11-26)

The analyst's questions, in the order they come up in an engagement cycle:

1. What is happening right now that I can act on? (votes, deadlines, new filings)
2. Where in the AI value chain does the risk sit, and which companies reach the frontier labs?
3. For one company: how good is its disclosure, what has been asked, how did it go, and what rights do I have there?
4. What have investors already asked, how did it vote, and how did funds like ours vote?
5. Who else is working on this, and who do I call?
6. What rules and laws change the picture?

Today the answers are spread over 12 tabs in no particular order. What an analyst runs into:

| # | Redundancy or friction | Where |
|---|---|---|
| R1 | **Company facts in four places.** Rights, ties, filers and proposal history appear in Company lookup, Rights map (with its own "Company detail" and "Why included"), Lab pathways (rights and deadlines per company) and Value chain (per-company ties). | company, rights, pathways, value-chain |
| R2 | **Two tabs tell one story.** Lab pathways (74 company-to-lab ties) and Value chain (44 supply-chain ties) are halves of the same chain: chips to data centers to clouds to labs to deployers. Value chain even says "their equity stakes are in Lab pathways". | pathways, value-chain |
| R3 | **Three names for the same roles.** Value chain: "Chip builders, Hyperscalers and AI clouds, AI deployers". Company lookup and network: "Chips and hardware, Cloud and model platforms, Consumer products, Business and government products". Value chain map columns: "CHIPS, CLOUD, CONSUMER, BUSINESS". | roles.js, valuechain.js, data |
| R4 | **Two overlapping classifications of proposals.** "Topic" (3 values) and "What it asks about" (4 categories) both filter the Proposals tab and disagree on 5 proposals. | feed, votes, upcoming, network |
| R5 | **Upcoming votes is a filtered Proposals list**, and it repeats the same "11 votes with a filing, median 21.17%" line on every Microsoft row. Filing deadlines live elsewhere (network rings, Lab pathways). | upcoming, feed |
| R6 | **Fund votes is cut off from the proposals it describes.** To see how funds voted on one proposal the analyst leaves Proposals for a second tab and filters again. | votes, feed |
| R7 | **People in two places.** Contacts is a list of the same people the network shows as nodes, with "Show in network" as the only bridge. Coalitions appear only in the network. | people, network |
| R8 | **Parnassus engagement outcomes sit under "Disclosure scorecard"**, a tab about company disclosure. They describe an investor's engagement, the network's subject. | parnassus |
| R9 | **New filings is empty** ("Last check: not run yet"): the weekly job had not run since launch. Data session started it on 2026-11-26. | new |
| R10 | **Company lookup opens on 01.AI**, a private company with nothing on file, so the first screen says "not yet tracked" six times. | company |
| R11 | **The header lists features, not the purpose.** "AI shareholder proposals, filers, rights and lab ties" does not say who it is for or where to start. | header |

## Proposed structure: 6 tabs, in the order of the engagement cycle

Each tab opens with one sentence saying what question it answers. Every heading names the question, not the data type.

| Tab | Answers | Built from (today's tabs) | Sub-views |
|---|---|---|---|
| **1. Start here** | "What can I act on now?" | Upcoming votes, New filings, filing deadlines | Next 90 days: ballots out, open filing deadlines, new SEC filings found this week; three headline findings with sources (e.g. no proposal at these 29 companies asks about model alignment or catastrophic risk; AI proposal support trend; where coverage by policy is thinnest). Links into the other tabs. |
| **2. Value chain** | "Where does AI risk sit, and who reaches the labs?" | Value chain + Lab pathways | One chain: chips, data centers and power, hyperscalers and AI clouds, frontier AI labs, AI deployers, with strategic investors as owners. Sub-views: Map (tiers and ties), Routes to a lab (today's Lab pathways), Engagement by tier (heatmap). |
| **3. Companies** | "What is the state of play at one company?" | Company lookup + Rights map + Disclosure scorecard | Profile (default: the company with the next ballot): role, why included, disclosure score, AI proposal history with support, filers, rights and next deadline, lab ties, fund votes. Compare views: Disclosure scorecard matrix, Rights map table. "Why included" appears once, in the profile. |
| **4. Proposals and votes** | "What has been asked, and how did it go?" | Proposals + Fund votes | One list filtered by category (the 4 categories only), company, year, status. Each proposal expands to its vote result, vote history, filers and coalitions, and how each fund family voted. Compare view: Fund votes table. |
| **5. Who's engaging** | "Who is doing this work and who do I contact?" | AI advocacy network + Contacts + Parnassus outcomes | Graph and List (the list is today's Contacts, with organizations and coalitions). An organization's panel shows its filings, coalitions, people and direct engagements (Parnassus outcomes move here). |
| **6. Policy** | "What rules and laws change the picture?" | Policy and causality | Causality map with list view; policy coverage per ask. |

Old links keep working through `TAB_ALIASES` (upcoming and new to start, pathways to value-chain, rights and parnassus to companies, votes to feed, people to network, causality to policy).

## One vocabulary (R3, R4)

- **Value-chain roles**, everywhere (data, graph key, filters, map columns), using the owner's words from round 2 ("Frontier AI Labs", "hyperscalers", "chip builders"): Chip builders; Data centers and power; Hyperscalers and AI clouds; Frontier AI labs; AI deployers (with sub-labels consumer products and business and government products where needed); Strategic investors. Source of truth: `data/value_chain.json` `tiers` plus a `deployer_kind` on companies.
- **Proposal classification**: only the 4 categories in `data/asks.json` (`category`). `topic` stays in the data for old links but is no longer shown.
- **Headings**: questions in plain words; no internal terms ("lens", "node", "tier details"); no counts in headings.

## Who does what

| Part | Owner | Files |
|---|---|---|
| R9 New filings data (weekly job run now and every Monday) | data session | workflow run, `data/tracking.json` |
| Vocabulary in data: `deployer_kind` on deployer companies; tier labels confirmed | data session | `data/companies.json`, `data/value_chain.json` |
| Headline findings for Start here, each with a source | data session | `data/site.json` `findings` |
| Combined tie list for one Value chain tab | data session | `data/value_chain.json` `all_ties` (supply-chain ties and company-to-lab ties, one schema) |
| Tabs, headings, sub-views, aliases, removal of `topic` from the UI | UI session | page files, `DESIGN.md`, `tests/` |

## Reviews

Plan review, one round: UX / content and accessibility (UI session), data accuracy (data session, for the findings text). Result reviews per AGENTS.md.

## Not in this round

Any change to the facts themselves; new data sources; visual restyle beyond what the merge needs.

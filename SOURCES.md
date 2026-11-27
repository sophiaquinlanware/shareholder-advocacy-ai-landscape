# Where the data comes from

The tracker has two phases.

**Building (one time, November 2026).** Researchers read widely: SEC filings, company bylaws, filer press releases, coalition member lists, law firm memos, fund company pages and news coverage. That built the foundation: the rights map, the advocacy network, the people directory and the influence pathways.

**Keeping it current (ongoing).** After the foundation, the tracker leans on a small set of sources that already collect what investors file. Each type of fact has one main source of truth.

| What | Main source of truth | How it is checked | How often |
|---|---|---|---|
| Proposals that reach the ballot, board responses | SEC EDGAR proxy statements (DEF 14A), for the 29 companies subject to US proxy rules, meetings from 2023 | Automatic flag: `scripts/refresh.py`; a person adds each new AI proposal to `data/proposals.json` | Weekly flag |
| Filing deadlines (Rule 14a-8) | The "shareholder proposals for next year's meeting" sentence in each DEF 14A (`data/proposal_deadlines.json`; `next_proposal_deadline` in `data/companies.json`) | Read by hand when each new proxy is filed | Each proxy season |
| Earlier votes on the same subject (`vote_history`) | Derived by `scripts/build_proposal_links.py` from `data/proposals.json`: same company and topic, titles sharing most key words; each link carries its 8-K | Automatic | Weekly |
| Vote results | SEC EDGAR 8-K, Item 5.07 | Automatic | Weekly |
| Planned exclusions (Rule 14a-8(j) notices) | The SEC's list of 14a-8(j) notifications for the season (since August 14, 2026 staff no longer respond, so the notice is the official record) | Automatic: `scripts/sec_leads.py` reads the list and, for companies in scope, the notice PDF; a notice whose proposal mentions AI is added to `data/proposals.json` as excluded, marked "found automatically in the SEC record, not yet reviewed" | Weekly |
| AI proposals not yet recorded | EDGAR full-text search of proxy statements (PRE 14A, DEF 14A) for AI terms inside a proposal's request clause | Automatic: `scripts/sec_leads.py`; at a company in scope with no AI proposal recorded for the season, a proxy filed in the last 120 days adds an upcoming proposal, marked as above. Hits at companies not in scope stay in `data/sec_leads.json` for a person to weigh against the selection rule | Weekly |
| Prediction board forecasts and suggestions | Posted on the site (Supabase, signed in by emailed link, shown under a chosen display name) or through the GitHub issue forms | Site posts are copied nightly into `data/predictions.json` by `scripts/sync_site_posts.py`; suggestions become GitHub issues for the maintainer to check before any question is added | Nightly |
| Investor letters to other shareholders | SEC EDGAR exempt solicitations (PX14A6G) | Automatic | Weekly |
| Proposals filed and later withdrawn (these never reach the proxy) | As You Sow's shareholder resolution tracker and the annual *Proxy Preview* report; ICCR's annual proxy resolutions guide | Checked by hand when each is published | Each proxy season (roughly January to March) |
| How funds voted | SEC EDGAR Form N-PX (structured filings, meetings from July 2023) | Manual "fund-votes" task in the GitHub Actions tab runs `scripts/npx_votes.py`; a person checks the result, then `scripts/publish_fund_votes.py` builds `data/fund_votes.json`. Rows a person has reviewed are listed in `data/fund_votes_reviewed.json` | Yearly, after the August 31 filing deadline |
| Bylaws and proposal thresholds | Company 8-K and 10-K exhibits (bylaws, usually Exhibit 3.2) | Automatic flag when a company files a bylaw change (8-K Item 5.03) | Weekly flag, reviewed by hand |
| Ties between public companies and AI labs | Company 10-K and 10-Q filings and press releases | Reviewed by hand | Quarterly |
| People leading engagement | Each organization's own team or leadership page | Links checked automatically, roles reviewed by hand | Quarterly |
| Pass-through voting programs | Vanguard, BlackRock, Schwab and State Street program pages | Reviewed by hand | Twice a year |
| Rule changes (Rule 14a-8, state law) | SEC press releases and rule pages; state legislature sites | Reviewed by hand | As they happen |
| Proposal categories (governance and safety, data center externalities, harms to users, harms from customers' uses) | This site's classification, in `data/asks.json`: each recurring ask has one category and every proposal takes its ask's category (three proposals with no ask are set by hand) | Recomputed weekly by `scripts/build_proposal_links.py` | When a new ask is added |
| Coalitions on AI data centers and water (Ceres, Ceres Investor Network, Valuing Water Finance Initiative, IIGCC), their members and focus companies | Ceres and IIGCC pages and reports; VWFI signatories from the UN DESA partnership registry entry; Ceres Investor Network members from an archived April 2024 Ceres page (Ceres no longer publishes a list) | Reviewed by hand | Yearly, and after each VWFI benchmark (every two years) |
| How far policy already covers each recurring ask (`data/coverage.json`) | The enacted text of each policy in `data/causality.json` (legislature, EUR-Lex), with a law firm summary where the legislature page cannot be fetched | Reviewed by hand; every row starts `reviewed: false` until a person confirms it | When a policy in the causality map changes, and yearly |
| Engagement timelines (`data/campaigns.json`, built by `scripts/build_campaigns.py`) | The records above: proxy statements, PX14A6G exempt solicitations, 8-K vote results, withdrawal and exclusion sources; investor stewardship reports for company-level steps | Built automatically from reviewed records | Weekly |
| Commitments ledger (`data/commitments.json`) | The commitment's source (company, proponent or third party, labelled), and delivery evidence from the company's own documents only | Reviewed by hand | Quarterly, and before relying on a status |
| Wider-field figures (`data/field_context.json`) | The publisher's own report or paper (Glass Lewis, D.F. King, academic working papers), quoted with its scope | Reviewed by hand | As published |

## Which companies are in scope

`data/companies.json` lists 60 companies (owner decision, 2026-11-25). Seven (Microsoft, Alphabet, Meta, Amazon, Nvidia, Apple, Tesla) have a full rights map (`rights_tracked: true`); the rest carry why they are included and their shareholder route only. Each entry has `engagement_basis` (shown as "Why included"), `basis_type`, `sectors`, `shareholder_route` with `route_source_url`, and `source_note` ("secondary source" where no primary source was found). Upkeep: yearly after the proxy season, and when a new AI safety commitment list is published.

Selection rule, as applied. A company is included when a source shows one of the four items below, and it develops, sells or operates AI models, AI products or AI infrastructure, or deploys generative AI in consumer media or products. (1) An AI-related shareholder proposal, 2023 to 2026. (2) A published investor engagement on AI or on AI's direct effects (for example data center water), named by the investor. (3) Signing a frontier AI safety commitment as a model developer: Seoul 2024, the 2023 US voluntary commitments, the EU General-Purpose AI Code of Practice, or China's December 2024 commitments. (4) A material AI compute agreement with a frontier lab or a hyperscaler, disclosed in a filing or by the counterparty (Nebius counts under this item through its agreement with Microsoft). Companies that use AI in their own operations without selling or deploying it to consumers (for example Lyft, Visa) are out. Frontier lab: develops its own general-purpose foundation models, and either signed a frontier-model safety commitment as a developer or has model development as its main business. This list is not a census: the EU and China commitment lists are long, and this version includes the signatories named in the research; others can be added from the same sources. Owner choice recorded (2026-11-25): all 60 companies found are kept, including Southern Company and the Chinese signatories. Each basis sentence says why the company is included. It does not say the company was engaged by investors, and it is not a vote recommendation.

**Linked, never copied.** The PRI Resolution Database is the most complete cross-topic list of resolutions. Its terms do not allow republishing its content, so the site links to it and does not copy from it.

**Rules every row follows.**
- Every fact links to its source.
- Anything found automatically is marked "auto-detected, not yet reviewed" until a person confirms it.
- The site informs. It does not coordinate votes.

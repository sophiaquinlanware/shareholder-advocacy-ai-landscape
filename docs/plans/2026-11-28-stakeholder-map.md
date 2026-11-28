# Stakeholder map: research and advocacy organizations, and company and lab responses

## The owner's words (relayed by the UI session, 2026-11-28)

> "i might want a section that has all the non profits or groups or research groups etc that are working on better responsible ai covering betterment in all areas where ai effects ... i definitely want to get a lay of the land of all stakeholders and that includes these advocacy and research groups that aren't in the investing space ... like metr or miri or redwood, or universities etc - im sure they are connected to policy or letters from the boards about ai - make sure you have ai's responses so for example on the proposal side you should also have the response which might be microsoft coming out with a report saying they are doing better or an open signed letter from all the frontier labs on alignment etc"

This round changes data only. The UI session adds colours, Key entries and column placement in graph.js afterwards.

## What exists today

- **`data/network.json` organizations (319).** These are almost all investors, coalitions and advocacy nonprofits that file proposals (32 have org_type "advocacy nonprofit"). There are no AI safety, research, university or standards organizations.
- **`data/causality.json` (197 events, 96 links).** Events are policy, rule, milestone, response, campaign, disclosure and ruling. Thirteen are responses, such as the Microsoft Responsible AI Transparency Reports and the companies' signatures of the EU AI code.
- **How `scripts/build_graph.py` handles events.** It turns non-government events into `response` nodes. It links an actor to an event by fuzzy name matching ("acted in", `similar(..., 0.6)`), which is not sourced per link.
- **Labs (13 nodes, `lab-*`).** There are no nodes for joint statements such as the Seoul commitments, the Frontier Model Forum or the chain-of-thought monitorability paper.

## What changes

### 1. A new file: `data/stakeholders.json`

```
{ "organizations": [ {id, name, org_type: "research or advocacy organization", kind, focus[], description, website, source_url} ],
  "responses":     [ {id, date, title, kind, actors[], summary, source_url, signatories_source_url?} ],
  "ties":          [ {from, to, relation, date?, source_url, quote, note?} ] }
```

**`kind` for organizations** is one of:
- nonprofit research
- nonprofit advocacy
- university centre
- government AI safety institute
- standards body
- industry body

**`focus`** takes one or more of the site's effect areas:
- safety and alignment
- evaluation
- civil rights and bias
- privacy
- misinformation
- labour
- child safety
- environment and data centers
- standards
- governance

**`kind` for responses** is one of:
- report or disclosure
- commitment
- joint statement or open letter
- policy position

**`relation` in ties** comes from a fixed list. Each tie needs a source showing exactly that relation:

| relation | from → to | Example |
|---|---|---|
| `signed` | org, lab, company or person → response | a lab signs the Seoul Frontier AI Safety Commitments |
| `published` | lab, company or org → response | Microsoft publishes its Responsible AI Transparency Report |
| `evaluated` | org → lab | METR's pre-deployment evaluation of a named model, where the source names the lab |
| `partnered with` | org ↔ lab or company | a partnership the org or the lab announced |
| `testified at` / `submitted comments on` / `helped draft` | org → policy event (an `ev-` node) | a comment letter on the docket, or a named drafter of a code |
| `criticised` | org → lab, company or response | only with the organization's own published words, quoted |
| `member of` | org → coalition or industry body | Partnership on AI members, from its own list |
| `responded to` | response → proposal, ask or event | only where the response's source, or a filer's or the company's own statement, says it answers that item |
| `addresses the same issue as` | response → proposal or ask | the site's own topical link, labelled "linked by this site by topic; the source does not say it answers this" |

Funding ties are left out this round. They need care: amounts and the direction of influence are easily misread.

### 2. Build

- **Organizations.** `build_graph.py` reads `stakeholders.json`. Organizations become nodes of type `organization` with `org_type: "research or advocacy organization"` and their `kind` and `focus`.
- **Responses.** These become `response` nodes, the same type as the causality responses, with `kind`, `actors` and `date`.
- **Ties.** These become edges with their relation, `source_url`, `quote` and `date`. Ties to people use existing `person-*` ids only.
- **Duplicates.** A response that already exists in causality.json (for example `ev-msft-rai-report-2025`) is not duplicated: ties point at the existing `ev-` node.

### 3. Research scope

The research runs in four batches, each in its own worktree and writing its own file under `data/stakeholders/`. The main session merges them into `data/stakeholders.json`.

- **A. Safety, alignment and evaluation.**
  - METR, MIRI, Redwood Research, Apollo Research, Center for AI Safety, FAR AI.
  - Epoch AI, GovAI, CSET, Future of Life Institute, AI Futures Project.
  - UK AI Security Institute, US Center for AI Standards and Innovation, the EU AI Office (as a policy actor: link only to existing events).
  - Their ties: evaluations of labs, partnerships with labs, testimony and comments on policy events in causality.json, and letters signed.
- **B. Civil society, universities and standards, across effect areas.**
  - AI Now, Partnership on AI, Center for Democracy & Technology, Access Now, EFF, Algorithmic Justice League, Data & Society.
  - Child safety: Common Sense Media, Thorn, ParentsTogether.
  - Labour: AFL-CIO Technology Institute, if it is separate from the investor AFL-CIO already in the data.
  - Data-center community and environmental groups that have published on specific companies.
  - University centres: Stanford HAI, Berkeley CHAI, Oxford Internet Institute, MIT, and others that publish on lab or company practice.
  - Standards bodies: ISO/IEC JTC 1/SC 42, IEEE, NIST (NIST only as a link to existing events).
- **C. Company and lab responses to pressure.**
  - Responsible AI and transparency reports, frontier safety frameworks (Anthropic RSP, OpenAI Preparedness Framework, Google DeepMind Frontier Safety Framework, Meta Frontier AI Framework, xAI Risk Management Framework, Amazon and Microsoft frameworks), and disclosures after proposal withdrawals.
  - Where a company or filer statement says the response answers a proposal or campaign, the relation is `responded to`. Otherwise it is `addresses the same issue as`.
- **D. Joint statements and open letters.**
  - White House voluntary commitments (July 2023), Seoul Frontier AI Safety Commitments (May 2024), the Paris AI Action Summit statement (February 2025).
  - Frontier Model Forum membership, the joint chain-of-thought monitorability paper (2025), the Center for AI Safety statement on AI risk (2023), the Future of Life Institute pause letter (2023), the "right to warn" letter (2024), and the EU General-Purpose AI Code of Practice signatories (2025), linked to the existing EU code events.
  - Signatories are recorded only as the statement's own page lists them. A person becomes a tie only if that person already exists in the data.

### 4. Rules (PRODUCT.md)

- **Primary sources only.** These are the organization's, lab's or government's own pages, papers, dockets and filings. LinkedIn is never a source.
- **People.** No views are attributed beyond a person's own public statements (Never claim 6). People are added only through existing ids.
- **No implied endorsement.** "Signed" means the name is on the signatory list. "Partnered with" needs an announcement from either party.
- **Response links.** `responded to` needs a source that makes the link. The site's own topical links are labelled as such (Never claim 4).
- **Style.** No em dashes, and never the words "genuinely" or "real".

## Tasks

| # | Task | Owner | Files | Check |
|---|---|---|---|---|
| 1 | Research batches A–D | 4 executors | `data/stakeholders/<batch>.json` | Data-accuracy review: spot-check at least 25 ties across batches, every `responded to`, every `criticised` |
| 2 | Merge and build | main session | `data/stakeholders.json`, `scripts/build_graph.py`, `data/graph.json`, SOURCES.md | Build test: every tie's ends exist; relation in the fixed list; no duplicate response nodes; `responded to` has a source |
| 3 | Drawing | UI session | `graph.js`, `styles.css` | Its own tests and screenshots |

## Not in this round

- Funding ties.
- Individual researchers beyond existing people records.
- Organizations outside AI (general human-rights groups with no AI work).
- An organization's own ranking or "influence" score.

## Revision 1 (after the plan review: data accuracy and claims, 66 REVISE)

These changes override the sections above wherever the two differ. All four researchers have been sent them.

1. **Reuse existing events.** A tie's `to` may be any existing `ev-` node, whatever its type.
   - These are policy events that already exist, so no `resp-` nodes are created for them: Seoul (`ev-seoul-frontier-commitments`), Paris (`ev-paris-ai-action-summit`), Bletchley (`ev-uk-bletchley-declaration`), the EU Code of Practice (`ev-eu-gpai-code`) and `ev-us-ai-action-plan`.
   - The EU code signatures already exist as per-lab events (`ev-*-eu-code`), so no `signed` ties repeat them.
   - The 9 commitments in `data/campaigns.json` are not re-created.
   - The build checks for duplicates by id and by title and date.
2. **Basis and review status on every tie.**
   - `basis` is either `sourced` or `site topical link`. Only `addresses the same issue as` uses `site topical link`, and the UI can show it differently.
   - `review_status` is "auto-detected, not yet reviewed" until a person confirms the tie (Never claim 4).
3. **Signatures.**
   - An organization, lab or company `signed` tie needs that organization itself on the signatory list. It is never taken from an individual's listed affiliation.
   - Individuals sign only through existing `person-*` ids, with their affiliation copied as listed into `note`.
   - Each joint statement carries `signatories_as_of`.
   - Only named signers are recorded.
4. **Renamed relations.**
   - `criticised` becomes `published a critique of`, quoted from the organization's own words.
   - `partnered with` becomes `announced a partnership with`, from the party that announced it.
5. **Field names and layers.**
   - The organization field is `type` in network.json, and stays `org_type` on graph nodes, as now.
   - Stakeholder `member of` ties go in a new layer, `organizations`, not `investors`. Putting them in `investors` would place AI groups alongside investor coalition memberships.
   - New responses get `published` ties only, not the fuzzy `acted in` edges.
6. **Scope.**
   - University centres are capped at 4.
   - The result review spot-checks at least 40 ties, including every `responded to`, every `published a critique of` and every org-level `signed`.
7. **New relation `publicly supported`** (added during research): from an organization to a policy event or a response, when the organization's own words say it endorses or supports it. It is the counterpart of `published a critique of`.

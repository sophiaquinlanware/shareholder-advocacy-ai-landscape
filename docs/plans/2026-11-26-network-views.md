# Plan: two views on the network graph

Date: 2026-11-26. UI session. Built on top of the analyst restructure (`design/analyst-restructure`) and merged after it.

## The owner's words (2026-11-26)

"I want this graph to model which companies are already being touched by this landscape - or maybe one mode to view it is of active proposals and the other view is of companies and how they are all connected … you could also have different tabs on the graph that show how everything is connected to each other. The first tab is how everything is connected to each other, and then the next tab on the graph you switch to is active proposals/past." Then: "Yes, two views".

## The two views

A two-button switch sits directly above the graph box: **Connections | Proposals**. It is a segmented control with `aria-pressed`, kept in the URL as `graph=connections|proposals`. The graph box keeps its size rules (it grows with the visible nodes).

1. **Connections (default).** Who is tied to whom.
   - **Shown:** filers, coalitions, people, companies (by role) and frontier labs.
   - **Edges:** shareholdings, coalition membership, co-filing partnerships, people's employers, company → lab value-chain ties, "engaged directly", and focus companies.
   - **Hidden:** proposal nodes, asks, "topics not filed" and every edge in the proposals layer.
   - **Columns:** Filers and coalitions · Value chain, by role · Frontier labs.
2. **Proposals.** Which companies this field is already touching, and how.
   - **Shown:** proposals; the filers, co-filers and supporters linked to them; the companies they target; and the recurring asks (Policymaker lens).
   - **Edges:** only edges in the proposals layer.
   - **Hidden:** labs, people, policy and responses. Filers and companies with no proposal link are hidden too.
   - **Status switch, under the view switch:** **All · Active (n) · Past (n)**, with counts from the data.
     - Active = `upcoming`.
     - Past = voted, withdrawn or excluded.
   - The year slider and "Everything it asks about" keep working.
   - **Columns:** Filers · Proposals · Companies.

## What changes with the view

- **Key:** the colour key lists only the types the view can show.
- **Heading:** a label above the heading reads "How everything connects" or "Proposal flow". The description line changes with it.
- **Policymaker lens:** it opens on Proposals, since its asks live there. The other lenses keep the viewer's choice.
- **Panels:** the panel and List view follow the view; List lists what's visible.
- **Layout:** the layout is rebuilt on switch, so a view's forces only use its own edges.

## Wording

Headings name the data. "Active" means on a ballot that hasn't been held yet, per `status: upcoming`. Nothing here recommends anything.

## Files

`graph.js`, `styles.css`, `tests/lens4.spec.js` (switch, URL, status counts, hidden kinds per view), `DESIGN.md`, `docs/STATE.md`.

## Revision 2 (after plan review R1, 68; built with these changes)

- **Policy and responses:** these, and their links, belong to Connections. For the Policymaker lens, Proposals also keeps them, because its asks link to them through "coverage".
- **Ask edges:** the "asks for" and "coverage" edges now carry `layer: "proposals"`.
- **Exempt solicitations aimed at a whole company:** these have no year or status, so they are hidden whenever Active/Past, a year or the year slider is set.
- **Wording:** "filed, co-filed or solicited for or against", and "past = voted, withdrawn or excluded". The headings above the graph read "Ties between filers, companies and labs" and "Proposals: filers to companies".
- **Proposal-only controls:** the topic and year selects and the year slider show in Proposals only.
- **Opening a node the current view hides:** search or focus switches views and says so.
- **Not done:** the side panel still lists all of a node's ties across both views, which is deliberate (it's the full record). The path finder doesn't switch views.
- **Fix found while building:** the Graph/List toggle reacted to every segmented button. It is now scoped to `[data-view]`.

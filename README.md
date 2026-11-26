# Shareholder Advocacy AI Landscape

A live, public map of investor engagement on AI. It shows:

- Every AI-related shareholder proposal at the largest AI companies
- Who filed each proposal
- Who leads engagement at each organization
- How public companies connect to the private frontier labs they fund, host and supply
- How policy changes ripple through the field

The site is built so stewardship teams can find each other and see the whole landscape at once.

**Site:** https://sophiaquinlanware.github.io/shareholder-advocacy-ai-landscape/

## What is in here

| Path | What it is |
|---|---|
| `index.html`, `styles.css` | The page |
| `app.js` | Draws the tabs from the data files |
| `graph.js` | The Obsidian-style advocacy network |
| `pathways.js` | Influence pathways: investors to public companies to frontier labs |
| `causality.js` | Causality map: what led to what, over time |
| `data/` | Every fact on the site, each with its source link |
| `scripts/refresh.py` | Weekly check of SEC EDGAR for new AI-related filings |
| `scripts/holdings.py` | Quarterly update of who holds which companies (SEC Form 13F) |
| `scripts/build_graph.py` | Merges all data into one relationship graph (`data/graph.json`) |
| `.github/workflows/refresh.yml` | Runs the scripts every Monday and republishes the site |
| `SOURCES.md` | Where each kind of fact comes from, and how it stays current |

## Ground rules

- Every fact links to a primary source.
- The site informs. It does not coordinate votes.
- People are listed with public professional details only.

Built by Sophia Ware.

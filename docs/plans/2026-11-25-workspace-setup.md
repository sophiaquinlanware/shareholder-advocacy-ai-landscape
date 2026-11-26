# 2026-11-25 — Set up the workspace protocol

## Owner's words

> "Implement the following advice on this project" (the Ware Associates website build protocol, 25 Nov 2026)
>
> "To answer the second one, you have access to everything" (the "what must never be claimed" question: work it out from the repo and her notes)
>
> "don't take advice on anything about form and function from that, just on how to setup the workspace"

## What exists today

- Static site live in the repo since e21eb12: `index.html`, `styles.css`, `app.js` and one JS file per visual; data in `data/*.json`; weekly EDGAR refresh in `.github/workflows/refresh.yml`.
- GitHub remote `origin` (sophiaquinlanware/shareholder-advocacy-ai-landscape). No package.json, no tests, no protocol files.
- Uncommitted disclosure scorecard work in the main folder (`app.js`, `index.html`, `styles.css`, `scorecard.js`), possibly another session's. Not touched.

## What changes

Structure and workspace only; no change to the site's wording, colour or type.

| Task | Files owned | Checked by |
|---|---|---|
| Protocol docs | CLAUDE.md, AGENTS.md, PRODUCT.md, DESIGN.md, docs/STATE.md, docs/adr/0001–0002, docs/*/README.md | reading against the protocol |
| Check tooling | package.json, package-lock.json, biome.json, playwright.config.js, scripts/build.mjs, scripts/lighthouse.mjs, scripts/external-links.mjs, tests/*, .gitignore | `npm run check`; detector self-test |

Done in this session, not in a worktree on a separate executor, because the docs and the tooling each needed the whole picture and were small.

## Decisions made without asking

- Stack: kept as is and recorded (ADR 0001); there was nothing to propose.
- Never-claim list: derived from README.md, SOURCES.md, the footer and the Parnassus case notes (PRODUCT.md).
- Lighthouse bar: proposed in ADR 0002, flagged for the owner.

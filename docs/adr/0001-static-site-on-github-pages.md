# 0001 — Static site on GitHub Pages, data in JSON, refreshed by a weekly job

Date: 2026-11-25. Status: accepted (records the stack already in use since the first commit, e21eb12).

## Decision

- The site is plain HTML, CSS and JavaScript with no framework and no compile step: `index.html`, `styles.css`, one JS file per tab visual, D3 7.9.0 from cdnjs for the graphs.
- Every fact lives in `data/*.json`, each row with its source link.
- Python scripts in `scripts/` (`refresh.py`, `holdings.py`, `build_graph.py`) update the data from SEC EDGAR. GitHub Actions (`.github/workflows/refresh.yml`) runs them every Monday, commits the results to `main` and republishes.
- Hosting is GitHub Pages at https://sophiaquinlanware.github.io/shareholder-advocacy-ai-landscape/. Publishing stays off until the repo variable `PAGES_ENABLED` is `"true"`.
- No backend, no forms, no CMS (content management system). Corrections come in as GitHub issues.

## Why

It is the simplest stack that fits: the site is read-only, the data changes weekly, and GitHub hosts the code, runs the job and serves the pages for free in one place.

## What it replaces

Nothing; it is the original choice, written down for the first time when the working protocol (AGENTS.md) was adopted.

# 2026-11-25 workspace setup: result review, round 1

Field: Security / simplicity (the only field this change touches; it adds tooling and docs, not site content or design). Reviewer: independent subagent, strongest model, read-only. Saved word for word below.

What was done with it is listed after the return.

---

REVIEWER: Security / simplicity SCORE: 78 VERDICT: REVISE

The design is right: three pinned dev dependencies, a build that only copies files, outside links kept out of `npm run check`, the secret stored as an environment variable, and `.env` git-ignored. Nothing is hard-coded: grepping for key, token, secret, password and email patterns across all ten files found nothing. All three failures are cases of the build not following that design.

TOP FAILURES
1. **The link checker does not read `.env`, though it says it does.** `scripts/external-links.mjs:5` says "set SEC_USER_AGENT in a git-ignored .env". AGENTS.md rule 1 names `.env` as the home for secrets. But the script only reads the variable from the shell (`process.env.SEC_USER_AGENT`, line 32). It has no `.env` loader, and `package.json:14` runs plain `node scripts/external-links.mjs` without `--env-file`. A value put only in `.env` is silently ignored, and the SEC links fall back to the default User-Agent (line 13).
2. **`scripts/lighthouse.mjs:7` uses a package that is not declared.** It imports `chrome-launcher`, which is not in `package.json` devDependencies. It works only because `lighthouse` happens to install it (`package-lock.json:973`, v1.2.3). If Lighthouse changes its own dependencies, this breaks. It also goes against rule 35 and ADR 0002 ("Three dev dependencies cover all of it"). Either declare it pinned, or record that it comes in with Lighthouse.
3. **The link checker can fail after doing all its work.** `scripts/external-links.mjs:63` writes to `test-results/external-links.json` without creating that folder first. No `mkdirSync` is imported on line 9. On a fresh clone where `npm test` has not run yet, it would make every request (minutes) and then crash on the write. By reading the code, not by running it. The link count is also stated two ways: "~850 requests" (line 3) against "~420 outside source links" (ADR 0002 line 14). Today's raw `http(s)` matches in `data/` add up to about 1,840 before removing duplicates, so both figures are unchecked.

TOP IMPROVEMENTS
1. Use `node --env-file-if-exists=.env` in the `check:links` script (Node 26 is installed), and keep the comment as it is.
2. `scripts/lighthouse.mjs:17` waits a fixed 800 ms for the server and never checks that `dist/` exists. Poll the URL instead, and stop with a clear message if `dist/` is missing.
3. `scripts/build.mjs:9` uses `new URL(...).pathname`, which breaks on folder paths with spaces or other characters that get %-encoded. Use `fileURLToPath`.

OUT-OF-FIELD NOTES
- AGENTS.md rule 33 lists `scorecard.js`, but `index.html` loads only `graph.js`, `pathways.js`, `causality.js` and `app.js`.
- `tests/site.spec.js:56` collects links right after each tab click with no wait. Links that are drawn later may be missed.
- The Lighthouse bar is still marked a proposal (ADR 0002 line 3). The owner should confirm it.

CONTENT RULES: PASS. None of the changed tooling files shows anything on the site. PRODUCT.md marks the missing positioning as `[TODO owner]` instead of inventing it.

---

## Action taken (main session, after checking each finding)

- Failures 1–3: all confirmed and fixed. `check:links` now runs with `--env-file-if-exists=.env`. `chrome-launcher` 1.2.3 is declared. Reports go to `reports/`, and the script creates that folder first. The link count is measured (416 distinct URLs) and stated the same way everywhere. Playwright also empties `test-results/` on every run, so nothing is kept there now.
- Improvements 1–3: done. The Lighthouse script polls the server and stops if `dist/` is missing. The build uses `fileURLToPath`.
- Out-of-field notes: rule 33 no longer names a file; the link test now waits after each tab click; the Lighthouse bar is listed in STATE.md under Owner actions.
- No round 2: these fixes are mechanical, and the full check after them is the evidence.

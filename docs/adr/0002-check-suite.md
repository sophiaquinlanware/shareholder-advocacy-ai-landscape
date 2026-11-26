# 0002 — One check command: Biome, a copy-only build, Playwright, Lighthouse

Date: 2026-11-25. Status: accepted; the Lighthouse bar is a proposal for the owner to confirm.

## Decision

`npm run check` runs, in order, and stops at the first failure:

1. **Lint** — Biome (one tool for JS, CSS, HTML and JSON) lints everything; it formats only the new tooling files, so the existing site files are not reformatted wholesale. Two noisy rules are off (`useIterableCallbackReturn`, which flags normal D3 code; `useTemplate`, a style preference). Missing `type` on buttons is a warning, not an error, until the tab buttons are fixed. Python scripts are compile-checked.
2. **Build** — `scripts/build.mjs` checks every data file is valid JSON and every local file `index.html` names exists, then copies only the public site into `dist/`.
3. **Tests** — Playwright against `dist/`, using the Chrome already installed (no browser download), at 1440×900 and 390×844, light and dark. For every tab: a full-page screenshot to `tests/screenshots/`, no sideways scrolling, no overlapping HTML text (SVG graph labels are exempt), no console errors, no missing local files, no broken local links. `tests/layout-detector.spec.js` proves the layout checks can fail.
4. **Lighthouse** — phone and desktop profiles. Proposed bar: accessibility ≥ 90, best practices ≥ 90, SEO ≥ 90, performance ≥ 80.

`npm run check:links` checks the outside source links separately (416 distinct URLs on 2026-11-25), because it makes hundreds of requests to other sites and takes minutes. Sites that refuse robots (401/403/406/429) are reported "not verified", not broken. SEC links need `SEC_USER_AGENT` set to be checked properly.

## Why

The protocol asks for formatter, linter, build, link check, screenshots at two widths with overlap and sideways-scroll tests, and Lighthouse behind one command. Four pinned dev dependencies cover all of it (Biome, Playwright, Lighthouse, and chrome-launcher, which Lighthouse already pulls in but `scripts/lighthouse.mjs` imports directly, so it is declared). Using the installed Chrome avoids extra downloads. Reports go to `reports/` (git-ignored), because Playwright empties `test-results/` on every run.

## Not chosen

- Prettier + ESLint: two tools and more config for the same result.
- Checking outside links inside `npm run check`: too slow and too dependent on other sites being up.
- Publishing `dist/` instead of the whole repo: a deploy change, left for the owner (docs/STATE.md, Owner actions).

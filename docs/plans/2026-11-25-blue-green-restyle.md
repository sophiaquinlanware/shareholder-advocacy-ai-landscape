# Plan: blue-green restyle (round 1 of 2: colour and type only)

Date: 2026-11-25. Branch: `design/blue-green-restyle`. Owner: Sophia Ware. Revision 2, after plan review R1 (`docs/reviews/2026-11-25 blue-green restyle plan R1 *.md`: visual design 76, accessibility 72, performance 74, all REVISE).

## The owner's words

> "can you get the github site up to date with the new design"

> "we're thinking about sustainability, so maybe a light blue or the kind of blue-green colors … a thin-line aesthetic, and relational data, so connections between lines. I want it to be more curvy and less linear"

> "I don't want any models or visuals that are purely aesthetic … Only have visuals or graphs or models of data when they're functional and able to be adapted to new data coming in. I want, overall, the aesthetic to be simple and readable"

> "use your best judgment on what the best type of visual is. Assume you're an expert data scientist."

> "this platform is going to be accessed by shareholders who are engaging in shareholder advocacy … you don't need to give any definitions … It's just simple data matching."

> "Things like '14 months that change the ballot' are not a helpful way to describe data … don't say 'four channels that will stay open.'"

> "the site needs to be completely usable, no random buttons"

Asked which round comes first, she chose **look first**. This round restyles the existing 11 tabs and changes no wording. Round 2 (structure and wording) carries the rest of her words: the data-science audit of chart types, cutting definitions and explainers for a practitioner audience, plain labels instead of catchy headings, the full proposal list with withdrawn and excluded notes, and the layered pathways view.

Reference design: the Claude Design canvas "AI Landscape Client UI" (private to the owner).

## Scope

**This round (colour and type):** base and status tokens; graph palettes where they fail 3:1 or carry old warm-grey values; heading family and weights; radii; focus outlines and reduced motion; the thin curved line treatment in the three relation graphs; a size-matched fallback font.

**Not this round:** wording, tab order, chart types, data. No decorative visuals exist on the site today, and none are added.

## What exists today (line numbers at origin/main 4d60d87)

- Base tokens: light `styles.css:1-18`, dark `:19-31` (media query and `[data-theme="dark"]`).
- Fonts: `index.html:10`; `--serif` and `--sans` at `styles.css:16-17`; headings `styles.css:42-44`.
- Labels at weight 600: eyebrow `:41`, timeline date `:63`, pill `:71`, `dt` `:77`.
- Radii: 10px on `.card` `:58`, `.table-wrap` `:82`, `.net-graph` `:110`, `.net-panel` `:113`, `.cz-scroll` `:141`. 8px on `.lever` `:66`, `.callout` `:88`, controls `:99`.
- Accent fills: `.seg button[aria-pressed=true]` `:102`, `.chip[aria-pressed=true]` `:131`.
- Palettes: `--n-*` `:96-98`, `--t-*` `:126-128`, `--sc-*` `:147-149`.
- No `:focus-visible` or `prefers-reduced-motion` rule anywhere in `styles.css`. Motion: zoom transition `graph.js:163`, force simulation `graph.js:233`, `.sc-cell:hover` scale `styles.css:164`.
- Network lines: `graph.js:220-222` (`line`), tick `graph.js:247`, resting opacity 0.35 at `graph.js:187`.
- Pathways lines: curve `pathways.js:106`, widths `:110` (proposal count) and `:114` (tie strength), applied `:119`.
- Causality lines: `causality.js:82-88`, width 1.6.
- Tab buttons without `type="button"`: `index.html:25-35` (STATE queue item 5).

## Tokens

The accent is now **light blue**, the owner's word. The open status is **teal-green**, a different hue, so a link or selected control can't be mistaken for an "open" pill. Pills always carry their text label too.

| Token | Light | Dark | Measured contrast |
|---|---|---|---|
| `--bg` | #f2f7f7 | #04161c | |
| `--surface` | #ffffff | #071e25 | |
| `--ink` | #0e2a30 | #e6faf7 | 15.1 / 15.9 on surface |
| `--ink-soft` | #46616a | #9dbfc0 | 6.6 / 8.7 |
| `--line` | #d3e2e3 | #1e4b53 | borders only |
| `--accent` (light blue) | #1b5e8c | #8cc8f0 | 6.9 / 9.5; text on accent fill 6.9 / 9.5 |
| `--accent-soft` | #e3eef7 | #0c2838 | ink on it 12.8 / 14.1 |
| `--open` / `-bg` (teal-green) | #1e6e5a / #ddf1ea | #7fe3d6 / #0d3236 | 5.2 / 9.1 |
| `--narrow` / `-bg` (amber) | #965a12 / #f8ecd9 | #ffc36b / #33270f | 4.8 / 9.2 |
| `--closed` / `-bg` | #a33a32 / #f7e1de | #f29a90 / #3a1f1e | 5.2 / 7.0 |
| `--pending-bg` | #e8efef | #10282e | ink-soft on it 5.7 / 7.8 |

## Graph palettes

The categorical colours that tell node and tie types apart stay as they are. They're re-measured against the new surfaces, and the chart-type audit in round 2 can revisit them. The values that fail or carry old warm greys change now:

| Token | Light | Dark | On surface |
|---|---|---|---|
| `--n-company` | `var(--ink)` | `var(--ink)` | 15.1 / 15.9 |
| `--n-proposal` | #6a858b | #6f8f95 | 3.9 / 4.9 |
| `--n-person` | #9a6e00 | #f2c94c | 4.6 / 10.8 |
| `--t-parent` | `var(--ink-soft)` | `var(--ink-soft)` | 6.6 / 8.7 |
| `--sc-met` | #1e6e5a | #7fe3d6 | 6.1 / 11.4 |
| `--sc-partial` | #b0700f | #b9781f | 4.1 / 4.7 |
| `--sc-silent` | #e1eced + 1px border #6a858b | #10282e + 1px border #5e8a90 | border 3.9 / 4.5 |

Met and partial differ in lightness by only 1.5 in light, so partial cells also get a diagonal hatch. The meaning doesn't depend on hue alone (WCAG 1.4.1).

## Type

| Element | Now | New |
|---|---|---|
| Display family | `--serif` Source Serif 4 | `--display`: "Inter Tight", "Inter Tight Fallback", system-ui, sans-serif |
| h1 | 650 | 300, letter-spacing -0.02em |
| h2 | 650 | 500 |
| h3 | 600 | 600 |
| Labels (eyebrow, dt, pill, timeline date) | 600 | 600 (unchanged, so heading levels stay above labels) |
| Body | Inter 400/500/600 | unchanged |

**Layout shift from the font swap.** Add `@font-face { font-family: "Inter Tight Fallback"; src: local("Arial"); size-adjust; ascent-override; descent-override }` with metrics matched to Inter Tight, so headings barely move when the web font arrives. Record the font CSS and woff2 bytes before and after, and Lighthouse CLS and LCP, in the result review, each marked measured or estimated.

## Radii

14px for cards, tables and graph boxes (`.card`, `.table-wrap`, `.net-graph`, `.net-panel`, `.cz-scroll`). 8px stays for levers, callout and controls; 999px for pills and chips.

## Focus and motion

- `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }`. On accent-filled controls the outline is `var(--ink)`, so it shows against the fill.
- `@media (prefers-reduced-motion: reduce)`: no transitions, no `.sc-cell` scale. In `graph.js` the simulation runs to rest off-screen (`sim.stop(); for (…) sim.tick()`) and draws once, and the zoom transition is skipped.

## Lines (thin, curved, still encoding data)

- Network (`graph.js`): `line` becomes `path` quadratic arcs, with the control point offset 15% of the link length. Each `d` string is built with a plain template, not a d3 helper. Stroke 1, lead filer 1.4. Resting opacity stays at 0.35, which is below 3:1. Focused links go to 0.9, which passes. **The network list view (`graph.js:255-268`) is the text equivalent** of the resting lines, and DESIGN.md records that.
- Pathways: widths scale by 0.8 with a 0.8px floor, so the width encoding survives. Shape unchanged.
- Causality: width 1.6 becomes 1.3. Shape unchanged.

## Tasks

| # | Task | Owns | Checked by |
|---|---|---|---|
| 1 | Base and status tokens, `--display`, heading weights, radii, focus, reduced motion, fallback `@font-face` | `styles.css` | lint; contrast script; screenshots |
| 2 | Palette changes above, including the partial hatch and the silent border | `styles.css` | contrast script |
| 3 | Font request (Inter Tight 300/500/600 + Inter 400/500/600); `type="button"` on the 11 tab buttons | `index.html` | build; lint |
| 4 | Network arcs, reduced-motion path | `graph.js` | tests (no console errors); screenshot |
| 5 | Pathways and causality widths | `pathways.js`, `causality.js` | screenshots |
| 6 | `useButtonType` back to error | `biome.json` | lint |
| 7 | DESIGN.md: tokens, type, radii, focus, motion, lines, list-view equivalence | `DESIGN.md` | review |
| 8 | Before/after screenshots → `docs/design/2026-11-25-blue-green/` | `docs/design/` | files exist |

No inline styles are added.

## Checks

- `npm run check` once after the last fix. Known failures from STATE.md queue items 1–3 (missing `changes.json` and `tracking.json`, text in `results_url`, layout shift) are pre-existing. They're reported, not counted against this round. Performance will stay under the 80 bar until queue item 3 is fixed; that's an owner decision outside this round.
- Content rules: no data or wording changes; the site name is unchanged.
- Result review: visual design, accessibility, performance/SEO (at most two rounds).

## Not doing

- Publishing. GitHub Pages is still off (`PAGES_ENABLED`). "Up to date" here means merged to `main` and pushed, which the owner asked for.
- Queue items 1–4 and 6, and all wording changes. Round 2 takes the wording.

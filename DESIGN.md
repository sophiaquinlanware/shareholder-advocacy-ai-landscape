# Design system

A description of the site as of the blue-green restyle (2026-11-25, branch `design/blue-green-restyle`; plan in docs/plans/2026-11-25-blue-green-restyle.md). It records the design. When the design changes, update this file in the same commit.

Direction from the owner: simple and readable; a blue-green, light-blue palette; thin, curved lines inside graphs that show real relations; no decorative visuals. A chart appears only if it's built from `data/` and updates with it.

## Colours

All colours are CSS custom properties ("tokens") on `:root` in `styles.css`, each with a dark value set twice: under `@media (prefers-color-scheme: dark)` (guarded by `:root:not([data-theme="light"])`) and under `:root[data-theme="dark"]`. Contrast figures are measured WCAG ratios against `--surface`.

### Base

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | #f2f7f7 | #04161c | page background |
| `--surface` | #ffffff | #071e25 | cards, tables, panels |
| `--ink` | #0e2a30 | #e6faf7 | body text (15.1 / 15.9) |
| `--ink-soft` | #46616a | #9dbfc0 | secondary text, table headers (6.6 / 8.7) |
| `--line` | #d3e2e3 | #1e4b53 | borders, dividers |
| `--accent` | #1b5e8c | #8cc8f0 | light blue: links, active tab, eyebrow, selected controls (6.9 / 9.5) |
| `--accent-soft` | #e3eef7 | #0c2838 | lever tiles |

### Status (rights map pills)

The open status is teal-green and the accent is blue, so an "open" pill isn't mistaken for a link or selected control. Pills always carry their text label.

| Token | Light | Dark | Meaning |
|---|---|---|---|
| `--open` / `--open-bg` | #1e6e5a / #ddf1ea | #7fe3d6 / #0d3236 | route open |
| `--narrow` / `--narrow-bg` | #965a12 / #f8ecd9 | #ffc36b / #33270f | route narrowing; also "source pending" text |
| `--closed` / `--closed-bg` | #a33a32 / #f7e1de | #f29a90 / #3a1f1e | route closed |
| `--pending-bg` | #e8efef | #10282e | status not yet known |

### Data-graphic palettes (one per visual, defined next to its styles)

- **Advocacy network node types** `--n-*`: company (= `--ink`), proposal, manager, nonprofit, faith, pension, labor, foundation, coalition, other, person.
- **Influence pathway tie types** `--t-*`: equity, compute, chips, dist(ribution), board, commercial, parent (= `--ink-soft`), lab.
- **Disclosure scorecard** `--sc-*`: met (solid), partial (hatched), silent (outlined with `--sc-silent-edge`). The fill pattern carries the state as well as the hue (WCAG 1.4.1).

Every graph colour reaches 3:1 against `--surface` in both themes. Neighbouring categories that share a hue family also differ in lightness: proposal and other at 2.3:1, person and foundation at 1.7–2.0:1. The site uses one green: asset managers (`--n-manager`) and equity ties (`--t-equity`) use the same teal-green as `--open` and `--sc-met`. Values are in `styles.css` and not repeated here, so there's one source. The network legend has 15 entries sharing 11 colours. Frontier lab reuses labor fund's pink (`--t-lab` = `--n-labor`), and policy, response and public reuse the pension, foundation and nonprofit colours (graph.js:37-45). Those pairs are told apart only by their legend labels. That's past what colour alone can separate, and the round 2 chart audit revisits it.

## Typography

- **Families:** headings `--display` = Inter Tight (Google Fonts), then a local "Inter Tight Fallback" (Arial with size-adjust and ascent/descent overrides, to limit layout shift while the web font loads), then system-ui. Body and UI `--sans` = Inter (Google Fonts), fallback system-ui.
- **Weights:** h1 300 with -0.02em tracking, a light display line set apart by size · h2 600 · h3 600 · labels (eyebrow, `dt`, pill, timeline date) 600. Below the h1, size alone sets the hierarchy (26 → 20 → 12–14px), so no smaller heading or label is heavier than the one above it.
- **Scale:** h1 `clamp(30px, 5vw, 46px)` / line-height 1.1 · h2 26px · h3 20px · lede 18px (16px under 600 px) · body 16px / line-height 1.6 · tables and tabs 14px · meta, sources, pills 12–13px · eyebrow and table headers 12px uppercase, letter-spaced.
- **Weight on the wire (measured 2026-11-25):** Latin woff2 for the two families is 93.3 KB, down from 170.6 KB with Source Serif 4.

## Layout

- One column of content in `.wrap`: max width 1080px, 16px side padding.
- Breakpoints: 800px (network and pathway layouts go to one column) and 600px (smaller header and card padding).
- Spacing in use: 4, 6, 8, 10, 12, 14, 16, 20, 22, 28, 32, 48px. There is no formal spacing scale yet.
- Radii: `--radius` 14px for cards, tables and graph boxes · 8px for levers, callouts and controls · 999px for pills and chips.

## Lines in graphs

Lines show relations, so they follow one style: thin and curved, with width still encoding the data.

- **Advocacy network** (`graph.js`): quadratic arcs, control point 15% of the link length off the midpoint. Width 1, lead filer 1.4, dashed for membership and derived co-filing. Resting opacity 0.35 is below 3:1 on purpose, so the graph stays readable. The focused node's links go to 0.9. **The network list view is the text equivalent of the resting lines.**
- **Influence pathways** (`pathways.js`): cubic curves. Width = 0.8 × (proposal count or tie strength), minimum 0.8px. Resting opacity 0.35 is below 3:1. **The side panel is the text equivalent:** selecting a lab or company lists every tie with its type, date and source.
- **Causality map** (`causality.js`): cubic curves, width 1.3, arrowheads by link type. Resting opacity 0.55 is below 3:1. **The side panel is the text equivalent:** selecting an event lists what led to it and what it led to, each with its source.
- Round 2 should give these two graphs an always-visible table equivalent, as the network already has, so a reader doesn't have to select a node first.

## Focus and motion

- `:focus-visible` draws a 2px `--accent` outline, offset 2px. On accent-filled controls (`.seg`, `.chip` when pressed) the outline is `--ink`.
- `prefers-reduced-motion: reduce` turns off transitions and the scorecard hover scale. The network layout settles before it's drawn, and focusing a node jumps instead of animating.

## Components

- **Header:** eyebrow (site name), h1, lede, "last updated" meta line.
- **Tabs:** sticky row of `type="button" role="tab"` buttons, scrolls sideways on phones; the active tab has an accent underline. Each tab is one `section.panel`.
- **Card** (`.card`) in an auto-fill `.grid` (min 300px).
- **Pill** (`.pill.open | .narrowing | .closed | .pending`).
- **Table** in `.table-wrap` (scrolls sideways inside its own box, never the page).
- **Callout** (accent left border), **timeline**, **levers** tiles, **steps** list.
- **Graph controls:** search input and select (`.net-controls`), segmented toggle (`.seg`), legend chips (`.leg`, `.chip`), side detail panel (`.net-panel`).
- **Source link** (`.src`) after each fact; **"source pending"** (`.unverified`) when the source is missing.
- **Coming soon** placeholder (`.coming`) for tabs not built yet.
- **Footer:** the informs-not-coordinates statement, PRI link, credit and "open an issue" link.

## Named rules (already true of the site)

1. **Colours only through tokens, with a dark value for each,** because both themes have to stay readable.
2. **Every fact carries a source link or "source pending",** because accuracy is the product (PRODUCT.md, Never claim 4).
3. **Wide content scrolls inside its own box, never the page,** because phones must not scroll sideways (checked by `tests/site.spec.js`).
4. **Graph colours live next to the graph's styles,** because each palette belongs to one visual.
5. **No decorative visuals.** A chart, graph or model appears only if it's drawn from `data/` and changes when the data does.

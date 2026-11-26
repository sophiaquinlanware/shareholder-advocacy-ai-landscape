# Design system

A description of the site as it is on 2026-11-25 (`styles.css` at commit f126e29 plus the disclosure scorecard styles in progress). It records the design; it does not change it. When the design changes, update this file in the same commit.

## Colours

All colours are CSS custom properties ("tokens") on `:root` in `styles.css`, each with a dark value set twice: under `@media (prefers-color-scheme: dark)` (guarded by `:root:not([data-theme="light"])`) and under `:root[data-theme="dark"]`.

### Base

| Token | Light | Dark | Role |
|---|---|---|---|
| `--bg` | #f7f5f0 | #141816 | page background |
| `--surface` | #ffffff | #1c211f | cards, tables, panels |
| `--ink` | #1d2321 | #e9ece9 | body text |
| `--ink-soft` | #4d5552 | #a9b1ad | secondary text, table headers |
| `--line` | #e2ddd3 | #2e3532 | borders, dividers |
| `--accent` | #1f5c4a | #7cc4a8 | links, active tab, eyebrow, primary fills |
| `--accent-soft` | #e3efe9 | #1f3029 | lever tiles |

### Status (rights map pills)

| Token | Light | Dark | Meaning |
|---|---|---|---|
| `--open` / `--open-bg` | #2f7d55 / #e2f2e8 | #7fd1a2 / #1d3327 | route open |
| `--narrow` / `--narrow-bg` | #a3641a / #f8ecd9 | #e6b06a / #3a2c19 | route narrowing; also "source pending" text |
| `--closed` / `--closed-bg` | #a33a32 / #f7e1de | #ef8f86 / #3d2220 | route closed |
| `--pending-bg` | #eceae4 | #262b29 | status not yet known |

### Data-graphic palettes (one per visual, defined next to its styles)

- **Advocacy network node types** `--n-*`: company, proposal, manager, nonprofit, faith, pension, labor, foundation, coalition, other, person.
- **Influence pathway tie types** `--t-*`: equity, compute, chips, dist(ribution), board, commercial, parent, lab.
- **Disclosure scorecard** `--sc-*`: met, partial, silent.
- **Fund votes** use no palette on purpose: every vote is the neutral `.pill.pending` label, so no vote reads as right or wrong (PRODUCT.md "Never claim" 1).

Values are in `styles.css`; they are not repeated here so there is one source.

## Typography

- **Families:** headings `--serif` = Source Serif 4 (Google Fonts), fallback Georgia. Body and UI `--sans` = Inter (Google Fonts), fallback system-ui.
- **Scale:** h1 `clamp(30px, 5vw, 46px)` / 650 / line-height 1.1 · h2 26px / 650 · h3 20px / 600 · lede 18px (16px under 600 px) · body 16px / line-height 1.6 · tables and tabs 14px · meta, sources, pills 12–13px · eyebrow and table headers 12px uppercase, letter-spaced.

## Layout

- One column of content in `.wrap`: max width 1080px, 16px side padding.
- Breakpoints: 800px (network and pathway layouts go to one column) and 600px (smaller header and card padding).
- Spacing in use: 4, 6, 8, 10, 12, 14, 16, 20, 22, 28, 32, 48px. There is no formal spacing scale yet.
- Radii: 10px cards/tables/graphs, 8px controls and callouts, 999px pills and chips.

## Components

- **Header:** eyebrow (site name), h1, lede, "last updated" meta line.
- **Tabs:** sticky row of `role="tab"` buttons, scrolls sideways on phones; the active tab has an accent underline. Each tab is one `section.panel`.
- **Card** (`.card`) in an auto-fill `.grid` (min 300px).
- **Pill** (`.pill.open | .narrowing | .closed | .pending`).
- **Table** in `.table-wrap` (scrolls sideways inside its own box, never the page).
- **Callout** (accent left border), **timeline**, **levers** tiles, **steps** list.
- **Graph controls:** search input and select (`.net-controls`), segmented toggle (`.seg`), legend chips (`.leg`, `.chip`), side detail panel (`.net-panel`).
- **Source link** (`.src`) after each fact; **"source pending"** (`.unverified`) when the source is missing.
- **Sticky first column** (`.sticky-col`): the row header of a wide table stays in view while the table scrolls sideways inside its box (fund votes tab). In the body it reads as normal 14px text, not the uppercase table-header style. Its table box gets `scroll-padding-left` at least as wide as the column (330px), so a keyboard-focused cell never hides under it. The table caption is left-aligned (`.fv-caption`) so it is not cut off on phones.
- **Focus outline on scroll boxes** (`.table-wrap:focus-visible`): 2px `--accent` outline, so keyboard users can see and scroll a wide table.
- **Labelled filter** (`.sr-label`): a visible text label wrapping a select in `.net-controls`, 13px `--ink-soft`.
- **Coming soon** placeholder (`.coming`) for tabs not built yet.
- **Footer:** the informs-not-coordinates statement, PRI link, credit and "open an issue" link.

## Named rules (already true of the site)

1. **Colours only through tokens, with a dark value for each,** because both themes have to stay readable.
2. **Every fact carries a source link or "source pending",** because accuracy is the product (PRODUCT.md, Never claim 4).
3. **Wide content scrolls inside its own box, never the page,** because phones must not scroll sideways (checked by `tests/site.spec.js`).
4. **Graph colours live next to the graph's styles,** because each palette belongs to one visual.

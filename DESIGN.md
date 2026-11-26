# Design system

A description of the site as of round 2 (2026-11-25, branch `design/round2-structure`; plan in docs/plans/2026-11-25-round2-structure.md). It records the design. When the design changes, update this file in the same commit.

Owner direction, 2026-11-25:
- An internal working tool organised by the tasks a stewardship team does. Not a public showcase, and not flashy.
- "Largely just black and white, but where necessary, there is blue. For example, all the visuals should be blue."
- No decorative visuals. A chart appears only if it's drawn from `data/` and updates with it, and its type is chosen for what best shows how the data relates.
- Audience: practitioners. Plain labels, no definitions, no slogans.

This replaces the blue-green dark/light restyle of round 1 (d627574).

## Colours

One white theme (`color-scheme: light`). All colours are tokens on `:root` in `styles.css`. Contrast figures are measured on white.

| Token | Value | Role |
|---|---|---|
| `--bg`, `--surface` | #ffffff | page, cards, tables |
| `--ink` | #111111 | text (18.9) |
| `--ink-soft` | #555555 | secondary text, headers (7.5) |
| `--line` | #e0e0e0 | dividers (non-interactive) |
| `--control-edge` | #8a8a8a | borders of inputs, selects, buttons, chips (3.45, WCAG 1.4.11) |
| `--head-bg` | #f6f6f6 | table header row, reason box |
| `--accent` | #1f5f99 | links, selected tab, selected controls (6.7) |
| `--accent-soft` | #e8f0f9 | highlighted table row, upcoming pill |
| `--blue-1` | #0b2545 | data: navy (15.4) |
| `--blue-2` | #2f6fb0 | data: mid blue (5.2) |
| `--blue-3` | #4f8fcf | data: light blue (3.4) |

**Status pills** carry a text label and use shape and fill, not colour, to separate states.
- Route: open = solid blue · narrowing = dashed outline · closed = solid black · pending = grey outline.
- Proposal status: voted = grey outline · upcoming = light blue · withdrawn = dashed outline · excluded = solid black.

## Data visuals: all blue

| Visual | Encoding |
|---|---|
| Proposals dot plot | x = meeting date; y = support (0–60%, or higher if the data needs it); one mark per voted proposal with a dated vote-results filing. Topic = shade **and** shape: data centres navy circle, social and economic mid-blue square, governance light-blue triangle. Hollow mark = the figure carries a basis note or caveat (numbered note under the table). Dashed line "50% of for + against". Marks sharing a date are spread 7px apart. |
| Co-filer network | **Exception to all-blue, by the owner's direction:** one saturated, distinct colour per node type (`--n-*`, each 3:1 or more on white), so types read straight off the key. **Companies are typed by value-chain tier** (the `tier` field on graph.json nodes, from the data session): Chip builders, Data centers and power, Hyperscalers and AI clouds, Frontier AI labs, Strategic investors, AI deployers. Each tier has its own `--n-tier-*` colour, and companies sit in tier bands within the Companies column. A company with no tier shows as "Company (tier not yet assigned)". The intro says the tiers are this site's reading. Overlapping default labels are hidden, keeping companies and labs first and then the most connected nodes; hover or select a node to show its label. **Grouped 2D layout:** x follows the filing chain (people → filers → proposals → companies → frontier labs); filer types each get a horizontal band; policy, responses and public engagement sit in a top band. Size = number of connections. Links light blue, thin quadratic arcs. **Graph settings** panel (like Obsidian's): text size, label threshold, node size and link thickness (Display); orphans (Filters); grouping, centre, repel and link force, and link distance (Forces). Saved per viewer in localStorage, with "Reset to defaults". |
| Lab pathways | Company → lab ties navy, width = tie strength. Filer → company links light blue, width = proposals filed. |
| Policy and causality | Event nodes mid blue. Link type by dash pattern: led to solid · responded to dashed · restricts dotted · enables dash-dot · cited by sparse dots. |
| Disclosure scorecard | Met = solid blue, partial = hatched blue, silent = grey outline. |

**Fund votes** (from main, data session) use no palette on purpose: every vote is the neutral `.pill.pending` label, so no vote reads as right or wrong (PRODUCT.md "Never claim" 1). The table has a sticky first column (`.sticky-col`, with `scroll-padding-left` 330px on its box so a focused cell never hides under it), a left-aligned caption (`.fv-caption`), labelled filters (`.sr-label`) and a focus outline on the scroll box (`.table-wrap:focus-visible`).

Every visual has a text equivalent on the same tab: the proposals table, the network list view, the pathways tie table, the causality event table, and the scorecard evidence panel.

## Typography

- One family: Inter (Google Fonts, 400/500/600/700), fallback system-ui. No display face.
- Sizes: h1 22px/600 · h2 19px/600 · h3 16px/600 · sub-headings 15px · body 15px/1.55 · tables 13px · meta, notes, pills 12–13px.

## Layout

- `.wrap` max width 1200px, 16px side padding. Dense: tables at 7px × 10px cell padding.
- Breakpoints: 800px (graph side panels drop below) and 600px.
- Radius `--radius` 6px; pills 999px.
- Wide tables and charts scroll inside their own box (`.table-wrap` and `.chart-scroll`, both positioned so nothing escapes); the page never scrolls sideways.

## Tabs (task order)

Upcoming votes (`#upcoming`) · Company lookup · Proposals · Fund votes (`#votes`, unchanged from main) · Rights map · Co-filer network · Contacts · Lab pathways · Policy and causality · Disclosure scorecard · New filings.

They follow the WAI-ARIA tabs pattern: `aria-controls` and `aria-labelledby`, a roving tabindex, and Left/Right/Home/End keys. Old links redirect: `#why` goes to Policy and causality, which holds the policy timeline; `#weigh-in` and `#water` go to Upcoming votes. Any other unknown hash opens the first tab.

## Components

- **Header:** site name (eyebrow), h1, and a meta line of computed counts.
- **Sortable table:** `<th aria-sort>` with a `<button class="th-sort">`; the active column shows ↑ or ↓.
- **Status filter:** buttons with counts (`.status-btn`, `aria-pressed`).
- **Count line:** `.count-line`, `aria-live="polite"`; it states what the filters show.
- **Company detail:** `<details class="co-detail">`, with summary "Company TICKER: status".
- **Summary list:** `dl.summary` on Company lookup.
- **Reason box:** `.reason`, on withdrawn and excluded proposals, with the reason and source or "Reason not yet recorded".
- **Legend chip:** `.leg`. When switched off: struck through, dashed border, hollow dot.
- **Source link:** `.src`. Missing sources show "source pending" (`.unverified`).

## Focus and motion

- `:focus-visible` draws a 2px `--accent` outline. On accent-filled controls the outline is `--ink`.
- `prefers-reduced-motion`: no transitions, the network settles before drawing, and focus jumps instead of animating.

## Named rules

1. Colours only through tokens.
2. Every fact carries a source link or "source pending".
3. Wide content scrolls inside its own box, never the page.
4. No decorative visuals; every visual is blue and has a text equivalent.
5. Counts, ranges and lists come from the data, never typed into copy.
6. Plain labels; no definitions, explainers or slogans.

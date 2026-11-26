# Plan: typeface, type style and one blue

Date: 2026-11-26. UI session, branch `design/type-and-blue`. Standing instruction: "Don't ask me any questions about publishing or next steps."

## The owner's words (2026-11-26)

1. With a screenshot of a museum site (a "SUZHOU MUSEUM OF CONTEMPORARY ART" title in a regular-weight grotesque, with "ARCHITECTURE" and "SUZHOU, CHINA" as small grey uppercase labels): "make it this font and this typogrpahical asethtic".
2. With a screenshot of a blue square: "any blue you have can you have it be this color blue". Sampled from the image: **#1f4e98** (8,140 of the image's blue pixels; 8.1:1 on white).

## Typeface

The screenshot's face is a neutral grotesque, likely a commercial one. I rendered the same words in Schibsted Grotesk, Hanken Grotesk, Instrument Sans, Geist, Inter Tight, Host Grotesk and Funnel Sans, next to the screenshot. **Schibsted Grotesk** (Google Fonts, variable 400–900) is closest in width, the straight-tailed y, and the uppercase. It replaces Inter, loaded the same non-blocking way, weights 400 and 500 only.

## Type style (from the screenshot)

- **Everything regular weight.** Headings are 400 and larger: h1 26px, h2 22px, h3 17px, with slight negative tracking. Emphasis (`strong`, numbers, selected items) is 500, never 600 or 700. All 600/700 in styles.css and the chart text in JS drops to 500 or 400.
- **Small labels are grey uppercase, regular weight, tracked .04em:** eyebrows, table headers, `dt`, legends, chart column titles, card labels and the tabs.
- **Tabs** become grey uppercase labels (13px, tracked); the selected tab is black with the underline.
- **Grey:** `--ink-soft` moves from #555 to #6b6b6b, nearer the screenshot's grey and still 5.3:1 on white.
- **Spacing:** a little more space above section headings.

## One blue

- **White page:**
  - `--accent`, `--blue-1`, `--blue-2` and `--blue-3` all become #1f4e98.
  - Where two blues encoded a difference, the second is a tint of the same blue (#1f4e98 mixed with white), not another hue:
    - `--blue-light` #a5b8d6 (40%) for Lab pathways' filer lines and filer dots, and for the unchosen bars;
    - `--accent-soft` #e9edf5.
  - The Value chain heatmap's five steps become tints of #1f4e98: 8%, 20%, 40%, 85% and 100%. White text sits on the top two, at 5.6:1 and 8.1:1.
  - The light-page `--n-*` blues (company, proposal, chips, compute, cloud) become #1f4e98.
- **Dark network canvas** (the owner's exception, #1e1e1e):
  - #1f4e98 is only 2.1:1 there. The blue node types (company, proposal, compute, cloud) take #1f4e98 with a 1px light outline (`--g-label`), so each node still reads at 3:1 or more.
  - Blue rings and lavender-blue marks (asks, the downstream-use category) take the 40% tint, which is legible on dark.
  - **Trade-off:** proposals and cloud companies now share a colour. They sit in different columns, and the panel names the type.

## Files

`index.html` (font link), `styles.css` (tokens, weights, labels), `graph.js` (light outline on blue nodes, axis weight), `valuechain.js` (heatmap steps, title weight), `causality.js` and `pathways.js` (chart text weight, filer tint), `DESIGN.md`, `docs/STATE.md`.

## Checks

`npm run check` (Lighthouse contrast and performance with the new font); result review (visual and accessibility).

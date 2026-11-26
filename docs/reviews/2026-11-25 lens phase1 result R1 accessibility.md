REVIEWER: Accessibility SCORE: 83 VERDICT: PASS

The build follows Revision 2 closely. All three plan-R1 failures are addressed:
- `#net-kb` now announces each step ("n of N: name, type, connections, ring").
- The List view now lists every visible node, with Status and "What you can do" columns.
- Marker text uses `--ink-soft` (7.5:1).
- Inferred links are dotted `1 3`, distinct from membership's `3 3`.

Other checks that pass:
- The lens control is native radios in a fieldset with a legend, plus an ink focus outline (styles.css:187).
- Lens changes are announced in `#net-lens-status`.
- Focus ring is solid ink with a white gap; the vote ring is dashed `--accent` (6.66:1). The two differ by shape.
- Panning jumps with no animation under reduced motion.
- The table header uses `aria-sort` with a real button.
- The new tests cover the announcements, including "Selection cleared".

TOP FAILURES
1. **Links are still faint, and you can't tell dotted from dashed.** graph.js:446 keeps stroke-opacity 0.35 on `--blue-3`. I measured that at 1.47:1 on white, below the 3:1 that WCAG 1.4.11 asks of graphics. At 1px width (graph.js:557), the "inferred" dotted pattern cannot be seen apart from dashed membership links (desktop-light-impact-microsoft.png). The panel's per-edge text is the only reliable way to get confidence, and the List view carries no edge data. This is a build problem, not a design one: the plan asked for distinct lines, and the opacity was never revisited.
2. **The ring glyph is read aloud.** styles.css:194 sets `.ring-note::before { content: "◌ "; }`. Most screen readers will say "dotted circle, Upcoming vote". Use `content: "◌ " / ""` or an aria-hidden span.
3. **The List view count may not be announced.** graph.js:620 rebuilds the `aria-live` count line through innerHTML on every redraw. A live region inserted together with its text is often not announced, so a sort or search change in the List view stays silent. Keep a persistent region and update only its text.

TOP IMPROVEMENTS
1. graph.js:513 says the details are "in the panel next to the graph". On phones the panel sits below it (phone-light-impact-microsoft.png). Say "in the panel after the graph", and consider adding `aria-controls="net-panel"` to the graph.
2. Nothing stops focused controls hiding under the sticky tabs (styles.css:45 has no `scroll-padding-top`). desktop-light-individual.png shows the "View as" chips covered by the sticky tab bar.
3. On a checked chip, the radio's `accent-color: var(--accent)` sits on an `--accent` background (styles.css:136–137), so the native dot may vanish. The fill and white text still show the state; not verified at zoom.

OUT-OF-FIELD NOTES
- graph.js:575 hard-codes `"#fff"` for the focus gap instead of a token (DESIGN.md / AGENTS rule 10).
- The graph's default labels overlap until they can't be read, at both widths (phone-light-impact-microsoft.png). This was there before this work.
- The phone panel for Microsoft is about 3,500px of connections. Consider collapsing it.

CONTENT RULES: PASS. Actions state only meetings, dates, filers and links. No vote direction or advice appears (lenses.js meetingAction; `board_rec` is not used). Confidence markers are grey text with no alarm colours.

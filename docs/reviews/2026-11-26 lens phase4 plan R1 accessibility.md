REVIEWER: Accessibility SCORE: 72 VERDICT: REVISE

TOP FAILURES
1. **The "partially covered" mark looks the same as the "Upcoming vote" mark.** Plan item 3 gives "partially covered" a dashed `--g-ring` ring at r+6. The existing Upcoming vote ring is also dashed `--g-ring` at r+6 (graph.js:784, `4 2`; DESIGN.md ring table). The text equivalent doesn't separate them either: the ring-note glyph falls back to the shared "◌" (styles.css:251), because no `.ring-partial`, `.ring-covered` or `.ring-norule` glyph is planned. "No rule reaches this" reuses the resubmission mark's `--g-risk` "!" (graph.js:796–797). Each mark needs its own dash pattern or radius and its own glyph prefix, and the ring table should list them.
2. **The ask node has no type label or colour in the plan.** The keyboard announcement reads `TYPE_LABEL[n.kind]` (graph.js:1021), and the List view Type column (graph.js:1153) and the key (graph.js:519) read the same labels. Without a `TYPE_LABEL.ask` entry, screen readers will hear "undefined". Without a `TYPE_VAR`/`--gn-ask` token, `nodeColor` falls back to `--gn-other` (graph.js:66), so asks share a colour with other nodes, against DESIGN.md's "each 4.5:1 or more on `--g-bg`" rule. The plan needs a label (e.g. "Recurring ask") and a measured token.
3. **The year scrubber's behaviour is under-specified.**
   - The plan doesn't say how Play/Pause exposes its state: one button whose name changes, focus kept on it, or `aria-pressed`.
   - It doesn't say that moving the range or the year select stops Play, or what Play does when started at the maximum.
   - If the year select is 2023, min equals max and the slider is useless; it should be disabled, with text saying so.
   - Nothing covers a selected node or keyboard-focused node (`state.kbId`) that the cap hides. The panel would describe a node that is no longer shown.
   - On 2.2.2 (pausing moving content): today it's 4 years × 1.5 s ≈ 4.5 s, under the 5 s threshold. Pause still has to be specified because the data will grow.

TOP IMPROVEMENTS
1. In this lens, put ask nodes first in `kbOrder` (graph.js:1004–1006). Today companies and labs come first, so the 12 asks the lens is about sit behind every company.
2. Give the range input a visible `<label>` that includes the value. Throttle the live line during Play to one message per step, sent after the redraw, so it doesn't fight `#net-kb`. Announce a stop: "Stopped at 2026."
3. URL: clamp or ignore a bad `upto=` (non-number or out of range) on load. State whether a lens switch resets `upto` the way it resets the year (graph.js:1184). Reduced motion should also cover `panTo` and the sim restart on every step (graph.js:201, 1029).

OUT-OF-FIELD NOTES
- With year = 2024 and the scrubber at 2023, the graph shows 0 proposals. That's a UX problem; say it in the live line.
- With 0 "covered" entries, the solid ring is untested; add a fixture test.
- The plan lists no screenshots in docs/design/ for the scrubber row (rule 20.3).

CONTENT RULES: PASS. Every mark carries "this site's reading, not yet confirmed by a person". A missing assessment is never read as "no rule". "Proposed" and "delayed" policy statuses are stated as such. The average is labelled as computed by this site. WCAG 2.1 AA (rule 9) passes provided failures 1 and 2 are fixed in the build. Measured contrast on #1e1e1e is fine: #7dd3fc about 11.6:1, #fdba74 about 10.5:1.

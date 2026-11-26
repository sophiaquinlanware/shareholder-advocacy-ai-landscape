REVIEWER: UX / content SCORE: 66 VERDICT: REVISE

TOP FAILURES
1. **"Company commitments" would join unrelated events to every ask.** Design 4 pulls every `companies` or `labs` lane event for any company that received the ask, with no topic match. In data/causality.json those lanes hold "Meta refuses to sign EU AI code", "ExxonMobil launches first US retail standing voting program", Skadden's exclusion count and the Delaware reincorporations. So a Meta child-safety ask would list a refusal as a "commitment", and the panel would suggest a link between the event and the ask that no source supports (rule 6). Fix: match events to the ask (by its `match` terms or a new field). If that isn't possible, use a plain heading: "Other Causality map events for these companies (not matched to this ask)".
2. **"No rule reaches this" claims more than the data supports, and the line template breaks on those entries.** Both `none` entries (ask-dc-siting-rights, ask-ai-fossil-fuels) say "Checked Utah HB 76, … none requires…". They cover a named list of rules, not every rule (Never claim 9). They also have `policy_id`, `policy_status` and `source_url` all null. The template "{policy label} ({policy_status}) … [source]" then renders empty brackets and no link, where Never claim 4 needs "source pending". Fix: keep the owner's label but add the scope, e.g. "No rule reaches this, among the N rules this site checked". Give `none` entries their own line format.
3. **The average goes against the site's own rule.** lenses.js:397 says "no average", and app.js:118 uses the median. The figures being averaged are on different bases: dual-class votes cast, abstentions counted as against (Tesla 43.25%, 17.44%), and Microsoft's truncated figures. The owner did ask for an average, so keep it. But the plan should resolve the conflict in writing and update the lenses.js comment. Each year line should also say how many figures are on a different basis, as voteHistory does. The example "average 18.6%" should be taken from the data, not typed in. Without these steps, Never claim 5 is at risk.

TOP IMPROVEMENTS
1. **Year scrubber with one year selected:** when a single year is picked, the slider's maximum is that year. Every lower value then shows zero proposals, so the control only empties the graph. Disable it in that state with a text reason, e.g. "Showing 2024 only. Choose All years to use the slider."
2. **Wording:**
   - `sizeLabel` should read "Node size = number of proposals with this ask; proposals drawn small".
   - The plan doesn't name the lens label or the intro line. Don't use "Where is voluntary action not working?" as a heading: it's a slogan and an editorial claim. Use "Policymaker" and "Recurring asks and the rules that reach them".
   - Say "not yet confirmed by a person" once per Coverage section, not on all 25 lines. Reuse the existing "auto-detected, not yet reviewed" style if it's the same status.
3. **Recurrence:** decide whether node size and the panel count both leave out floor proposals. The plan excludes them only from the text, while Phase 1 counts them. State whether counts follow the year scrubber.

OUT-OF-FIELD NOTES
- Every ask has coverage entries, so the "not yet assessed" test needs a fixture.
- No entry is `covered`, so the solid ring never shows. That's fine, but say so in DESIGN.md.
- Accessibility: Play/Pause needs `aria-pressed` or a label that switches, and the live line shouldn't speak every 1.5 s during Play.

CONTENT RULES: FAIL
- The commitments join suggests a link between event and ask that no source supports (rule 6).
- "No rule reaches this" has no scope (Never claim 9).
- Null `source_url` has no "source pending" (Never claim 4).
- The mixed-basis average isn't flagged (Never claim 5, conditional).

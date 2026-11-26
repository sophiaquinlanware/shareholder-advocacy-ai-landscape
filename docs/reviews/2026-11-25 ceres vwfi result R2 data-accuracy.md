REVIEWER: Data accuracy SCORE: 86 VERDICT: PASS

Round 2 re-checks only the 9 required fixes and 2 recommended items from R1, against the current data/network.json, data/causality.json, data/people.json, scripts/build_graph.py and the regenerated data/graph.json.

Fixed and verified:
1. The `ceres-water-behind-the-watts` summary no longer contains the internal note.
2. The `kirsten-james` ai_focus now ends after "(Drained by Data, 2025; Water Behind the Watts, 2026)."; the bio-unsupported "speaker" claim is gone.
3. The `ceres` description drops "Boston-based" and says "launched and runs the Valuing Water Finance Initiative". Ceres' /about says it launched VWFI.
4. `vwfi-benchmark-2025` now cites the tech PDF. The five companies and 32.7/23.7 appear on its pages 4-6.
5. The four engagements now say "assessed in the 2023 and 2025 benchmarks". The PDF compares each against 2023 ("As in 2023, Amazon...").
6. The `vwfi` to `ceres` edge carries "VWFI is an initiative of Ceres".
7. The edge type is "focus company of"; graph.json has no "engages" edges left.
8. All 21 registry edges have as_of 2024-05 and all 32 network edges have 2024-04. Correction to R1: there are 32 network edges, not 33. The 56 total is 21 + 2 + 32 + 1.
9. The Federated Hermes (both edges), Aberdeen, NYS Common and BNP edges carry "Listed as" notes, and build_graph.py passes note and as_of through to graph.json. The note on federated-hermes-eos to vwfi is confirmed there.
Recommended items: the link now reads "with a high-tech analysis", and "power" is gone from the IIGCC summary.

TOP FAILURES
1. The direction of "focus company of" is reversed. graph.json has `source: vwfi, target: co-GOOGL, type: "focus company of"`, which reads "VWFI is a focus company of Alphabet". Either swap source and target in build_graph.py (company to coalition) or rename the type to "has focus company".

TOP IMPROVEMENTS
1. The two Task Force edges (CalSTRS and AustralianSuper, sourced to the Ceres VWFI page) have no as_of. They are current-page facts, so "2026-11" would make that explicit.
2. The first link explanation, "every two years", is on the VWFI page, not on the cited 2023 release.

OUT-OF-FIELD NOTES
1. The `ceres-water-behind-the-watts` event remains. Under the water-only rule it is an owner decision, not an accuracy fault.
2. No em dashes, "genuinely", "real" or "grid" appear in the changed text.

CONTENT RULES: PASS

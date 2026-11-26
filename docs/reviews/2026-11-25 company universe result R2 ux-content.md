REVIEWER: UX / content SCORE: 84 VERDICT: PASS

All three R1 failures are mostly fixed. A script check found no "UNVERIFIED" strings. 51 of 60 basis sentences match "[Year|Undated]: … (…)". Every route is one of the four values or null, and all 18 nulls carry a route_note. Motorola and Thales now read "was included in Candriam's investor review" (neutral). Disney is plainer. Baidu, SenseTime and Volcano each say "parent not identified" (companies.json:1024, 1477, 1586). TSMC and Southern carry owner_choice_note (:1824, :1968). MiniMax is "00100" (:892).

TOP FAILURES
1. **Build didn't follow the design: 9 sentences break the year slot.** Nvidia, Salesforce, Intuit (×2), Verisk (×2), Workday (×2) and TSMC open with "2024 to 2025:" or "2023 to 2024:". The template is "[Year or Undated]". Either allow "YYYY to YYYY" in the design, or use the report year.
2. **Design doc lags the build.** Plan line 57 still says each route comes "with `route_source_url`" and lists only four values. Line 69 still shows the old template "[Year]: [event] ([who])". Neither the null + route_note rule nor the filer/source slot is written down, so the next data pass has no spec to follow.
3. **Completeness: 18 of 60 routes (30%) are null.** For 9 of them the note is "ownership not yet checked" (G42, Inflection, Magic, 01.ai, DeepSeek, Aleph Alpha, Black Forest Labs, Reflection, Writer). The UI labels them honestly, but for a practitioner almost a third of the universe has no answer to "can I act here?". There are also small wording slips:
   - TSMC "TSMC engaged by Parnassus" is missing "was".
   - Alphabet's "proxy listed" breaks from the "proxy ballot included" used elsewhere.
   - SK hynix's sentence names Samsung as a co-subject.

TOP IMPROVEMENTS
1. Add "[YYYY to YYYY]" to the template, or normalise those 9 sentences. Fix TSMC's grammar and Alphabet's verb.
2. Update the plan (or DESIGN.md) with the null/route_note rule and the "[filer; ]source" slot.
3. Close the 9 "not yet checked" notes with a company page or a "no public filings found" note, as Huawei has (:1562).

OUT-OF-FIELD NOTES
- I couldn't verify the WBD Form 15 date "October 2026" (:1639); the data reviewer should confirm it against EDGAR.
- Huawei's route_source_url is its own corporate page, but source_note says "secondary source" (:1563). The label looks wrong.
- The UI must render route_note wording for null routes, and not show null as a filter value or as blank.

CONTENT RULES: PASS. I found no target, standout, vote-share or endorsement wording. Every null route says "source pending" except WBD, which has a sourced Form 15 note instead (Never claim 4 holds). The remaining issues are about consistency and completeness, not rule breaches.

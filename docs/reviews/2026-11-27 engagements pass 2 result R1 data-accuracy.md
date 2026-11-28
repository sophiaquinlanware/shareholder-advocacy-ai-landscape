# Investor-reported engagements, pass 2: result review, data accuracy

**Score: 91/100, PASS.**

**What was checked.** The reviewer opened every source and checked all 17 edges against it:
- 4 Boston Common posts
- the Aberdeen article
- 2 AXA IM stewardship reports
- 3 Vancity engagement reports
- the KLP 2025 company list

**Findings.**
- Every quote is in its source.
- Every page number and date is correct.
- Each relation matches what the source shows. KLP's own list separates letters it wrote alone from letters written with other investors, so "wrote to" is right for KLP.
- Never claim 4 (no unsourced facts) holds.

**Optional fixes, all applied:**
- **AXA IM → Alphabet:** the note now names its 2023 co-filing on algorithmic systems, which is the clearer link to AI.
- **Aberdeen → Apple:** the step now places the meeting around Apple's February 2024 annual meeting, without giving an exact date.
- **Vancity → Alphabet:** the step says the letter was reported in Vancity's first-quarter 2025 report.
- **Boston Common → Nvidia:** the note adds Boston Common's finding that Nvidia was "unresponsive".

**Reviewer note not taken.** The reviewer said graph.json had no "wrote to" edges. That came from a search miss: the built graph.json has both (Vancity and KLP → Alphabet).

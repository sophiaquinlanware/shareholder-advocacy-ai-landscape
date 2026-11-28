# Public opinion polls (data/public_opinion.json), round 1, data accuracy

Score: 88/100, PASS.

The reviewer opened all 15 source pages: PDFs with pypdf, HTML with curl. Every pct and result figure matches its source. There are no em dashes and none of the banned words. The one advocacy-funded poll (Morning Consult for Americans for Responsible Innovation) names its sponsor.

## Issues and what was done

1. **Pew parents poll:** n was missing and the fielded month was wrong. Fixed: n is now 1458 and fielded is 2025-09 (fieldwork began September 25).
2. **Morning Consult/ARI:** the question said "sexual" where the survey says "romantic or erotic". Fixed.
3. **YouGov training data:** the question left out the copyrighted-material clause. Fixed.
4. **Gallup/SCSP autonomous weapons:** the result was selective, because opinion flips when other nations build them first. Fixed: the result now adds "If other nations build them first, 53% support".
5. **Loose fit on three asks** (customer due diligence, siting rights, targeted ads): kept, each with a `fit_note` field saying where the poll only partly matches the ask.
6. **Fielding dates:** the start-month rule is now stated in the file's `about` note.
7. **Quinnipiac worker concern:** the result now adds the April 2025 comparison (21%).

## Earlier decisions (data session)

- **AI Policy Institute training-data poll:** dropped, because its page gives no year for the fieldwork.
- **AP-NORC/USAFacts poll on how reliable AI answers are:** dropped as a loose fit for misinformation.
- **AI sold for oil and gas:** no poll found, so it is listed under `not_found`.

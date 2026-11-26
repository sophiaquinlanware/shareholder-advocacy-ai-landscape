REVIEWER: UX / content SCORE: 76 VERDICT: REVISE

Plan-R1 failures: mostly fixed. `investor_access` is replaced by a four-value `shareholder_route`. `basis_type` is added. "Target", "standout" and vote percentages are gone (grep finds none). "Frontier lab" now has a definition and dropped from 33 to 27 entries.

TOP FAILURES
1. **Build didn't follow the design: route values lack sources, and some are left UNVERIFIED although the source is already there.** The plan says each route comes "with `route_source_url`". 16 of 60 entries have none: 15 of the 16 "private" entries (all except Huawei) plus Baidu and SenseTime. Warner Bros. Discovery has a CIK and an EDGAR route URL in the file, yet its exchange, ticker and route are all "UNVERIFIED" (companies.json:1596-1616). Baidu, SenseTime and Volcano Engine are listed only under legal-entity names, with no evidence linking them to any parent (evidence: [] at :1440 and :1549). Alibaba and Tencent do get that parent link (:1462, :1495). A practitioner can't tell from these three rows whether any shareholder route exists.
2. **Design is underspecified: the template's "(who)" slot means four different things.** It can name the filer ("AFL-CIO Equity Index Funds", Netflix), the document ("Apple proxy statement"), both (:1340, "proxy statement; lead filer…"), or a government ("UK and Korean governments", :647). About 20 safety-commitment sentences have no subject ("Signed the…"), while xAI (:679) and Zhipu name theirs. Disney and Comcast put the filer first. A reader can't scan the 60 sentences as one column.
3. **Wording reads as praise under the "Why included" label.** Motorola and Thales were "named … for mitigating human rights risks" (:1409 and the Thales entry). The words are Candriam's, but shown as the inclusion reason, they read as a commendation. "SEC staff did not concur with exclusion" (Disney) is jargon for researchers and journalists.

TOP IMPROVEMENTS
1. Split the slot into "([filer]; [source])", give every sentence a subject, and keep the filer out of the first position.
2. Add a source to every "private" value (a company page or a "no public filings" note). Resolve WBD from its EDGAR link. Tie each Chinese entity to its parent or say plainly "parent not identified".
3. Reword Motorola and Thales as "included in Candriam's 2022 investor review of 15 facial recognition companies".

OUT-OF-FIELD NOTES
- Anthropic (Nasdaq ANT, :634) and SpaceX (Nasdaq SPCX) are tagged "US proxy rules apply". I could not verify either listing; the data reviewer should confirm.
- The UI must show "UNVERIFIED" as "source pending" (PRODUCT.md Never claim 4), not as the raw string or a filter option.
- MiniMax's ticker is "0100" (:884), but its own evidence says "00100".

CONTENT RULES: FAIL. Never claim 4 (unsourced facts): 15 "private" routes have no source link, and WBD is marked UNVERIFIED although its source is in the file. Motorola and Thales lean toward endorsement. No vote-steering or targeting language was found; Never claim 1 and 3 pass otherwise.

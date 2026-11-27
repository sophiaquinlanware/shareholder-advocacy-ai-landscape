# Module audit: is each part useful, for whom, and why (network excluded)

Owner, 2026-11-27: "go through this modules and others (except network) and really think is this useful, for what reason and why and then decide to keep it or not." Also: "how are you determining number of companies, I think info like that feels arbitrary … think about what data is useful and what should be highlighted", and "it doesn't need a weekly updates section; it should just seamlessly integrate into the databases and visuals."

The test for every module: does it help a stewardship team decide **where to engage, on what ask, with whom, and when**, or show **what engagement has achieved**? A number earns a place only if it changes one of those decisions. Counts that describe how much this site has collected (companies tracked, rows on file, inclusion reasons) fail the test and are cut or moved to methods notes.

## Decisions

| Tab › module | Decision | Why |
|---|---|---|
| **Start › Coming up** | Keep | Deadlines and meetings are the most time-sensitive, actionable facts. |
| Start › What the data shows | Keep, trim to findings that change a decision (support trend, exclusions rising, commitments won) | A finding that doesn't change a choice is trivia. |
| Start › New SEC filings | **Cut** | A feed of filings is a weekly-updates section; new records now flow straight into the proposal tables (SEC leads, marked "not yet reviewed"). |
| Start › How this site is organized | **Cut** | The tabs are the organization; PRODUCT.md rules out primers. |
| **Deadlines › AI proposals on upcoming ballots** | Keep | What is on the ballot now, with past support at each company. |
| Deadlines › New SEC filings (tab) | **Cut** | Same reason as above; its changes appear where they belong (proposals, company pages, dates). |
| **Companies › One company in full** | Keep | The lookup every engagement starts from: history, ladder, commitments, filers, lab ties, rights. |
| Companies › Shareholder proposal rights | Keep the open/narrowing comparison table; **cut the 29 repeated detail blocks** (each is already in One company in full) | Choosing targets needs the comparison; the detail is duplicated. |
| Companies › AI disclosure scores | Keep | Disclosure gaps are ready-made asks; scored against published recommendations. |
| **Value chain › map** (value-chain stages) | Keep | Shows where pressure travels toward the labs. |
| Value chain › Engagement by tier (heatmap) | **Replace** | Two of its four columns count why companies were included in this dataset (an artefact), and "fund-family votes on file" counts data rows. Replace with: AI proposals (n), median support with range (filers critical of ESG left out), commitments won, next open deadlines, labs reached. |
| Value chain › tier panel figures | **Replace** | Same test: keep labs reached and median support (with n and range); add next deadlines (90 days) and commitments; drop company count, "12+ filers" (a storage cap) and N-PX row counts (move to sections). |
| **Laws and rules** | Keep | Policy context, and the planner's "what policy already requires". |
| **Ties to each lab › routes table** | Keep | The core answer: which listed company, how tied, deadline open, who files. |
| Ties › investors holding the route companies | Keep | Who already has standing. |
| Ties › "Labs reached, by company" chart and "Value-chain ties: companies → frontier labs" list | **Cut** | Both repeat the value-chain map and the routes table. |
| Ties › Gaps in the tie data | Move into a methods note | Honest, but not a decision aid. |
| **Proposals › All AI proposals** | Keep | The record. |
| Proposals › Fund family votes | Keep, lead with each family's **support rate** on AI proposals rather than row counts | "Who votes for" is what a filer or coalition needs. |
| Proposals › pass-through voting | Keep (short) | Who can direct votes. |
| Proposals › Results of private engagement (ladder) | Keep | The success record. |
| **People** | Keep | Who to contact. |
| **Plan an engagement** | Keep all; it is the decision tool | Each part answers a step of planning. |
| **Prediction board** | Keep; move "Scores" and "Who should forecast" into "How the board works" until questions resolve | Empty score tables are noise. |
| **Test plans over time** | Keep plans, support chart, "where one more filer changes the model most" and the method; **collapse** "One run, step by step" and "The field, season by season" into closed sections | Useful for checking the model, not for deciding. |

## Data fixes found on the way

- Value-chain median support included proposals lead-filed by filers critical of ESG (everywhere else they are left out). Fixed in `scripts/build_value_chain.py`.

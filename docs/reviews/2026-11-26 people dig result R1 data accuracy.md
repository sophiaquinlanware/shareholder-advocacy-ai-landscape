REVIEWER: Data accuracy  SCORE: 88/100  VERDICT: PASS (four fixes to make before merging, none needs a person dropped)

I did not edit any files. Sources were read with WebFetch, or with curl plus pypdf when WebFetch could not parse a PDF. The PDFs and extracted text are in the session scratchpad (pdfs/).

COUNTS
- About 95 of the 156 new people checked against their profile_url and, where given, ai_focus_source_url. The sample leaned toward people with AI lines and covered every org type: investor, public pension, asset owner, impact/ESG, wealth manager, coalition, advocacy nonprofit, faith-based, foundation, anti-ESG, other.
- 4 people need a fix. 3 could not be checked because the site blocked the fetch: prashant-yerramalli (CalPERS, 403), louise-piffaut (Aviva, 403), caitlin-mcsherry (Neuberger Berman, 429).
- All other sampled people passed: name and title appear on the cited page, the person is at the stated organization, and the AI line matches the source.
- Spot passes worth naming: catherine-winner, matt-brazier, rupert-krefting, caroline-c-conway, wendy-cromwell, ellen-chae, katherine-kroll, simone-andrews, charles-stott, gabrielle-ferhat, lucy-larner, prudence-johnson-hill, khine-thant, tim-nixon, tenzing-tashishar-cfa, elizabeth-levy-cfa, mark-d-levine, thomas-p-dinapoli, kyle-seeley, allyson-tucker, travis-antoniono (plus the 2 other CalPERS investment directors), jessica-weaver, richard-manley, patrick-du-plessis, andrew-mccarthy, jennifer-coulson, julie-b-tanner, raymond-j-burnell, bryant-sewell, tyler-devere, meagan-tenety, vinnay-cchoda, sophie-walker, cornelia-gomez, suzanne-tavill, bianca-agustin, laurie-fitzjohn-sykes, kathleen-beaumont, christopher-wright, eva-cairns, sally-kramers, the ICGN Summer 2026 speakers (peter-flynn, oshni-arachchi, erica-serpico, shane-mccullagh, arnav-prasad, landon-shea), katrina-dudley, ita-mcmahon, jeremy-hubbard, pia-garavaglia, and the "no AI work found" staff at ICCR, Majority Action, JLens, CII, As You Sow, Mercy, IASJ, MSBI, OMERS, Boston Common and WBA.
- No personal contact details are in the data. Some sources show work emails or phones (the ICCR team page, the M&G report for Krefting, the NLPC filing for Perlot), and none were copied in.
- No role in the sample has clearly ended.

PER-PERSON FAILURES
1. dan-neale: wrong organization. Fix: correct. Both sources (the IHRB profile and the PRI in Person 2026 speaker data) place him at Church Commissioners for England ("Social Themes lead" / "Responsible Investment Social Lead"). The data gives org_id church-of-england-pensions-board-national-investing-bodies. Change it to church-commissioners-for-england. The AI line itself is supported: the PRI session 3E description names AI among the dual-use technologies.
2. jenni-black: wrong organization. Fix: correct. Her profile says she is Head of Company and Industry Engagement at the World Benchmarking Alliance, but org_id is wba-cic-ethical-ai (the coalition WBA runs, not her employer). Change it to world-benchmarking-alliance. Her ethical AI session at ICGN Summer 2026 is confirmed.
3. luke-perlot: the AI line claims more than the source shows. Fix: correct. The line names AI data usage proposals at Amazon, Alphabet and Microsoft (2025), but the cited exempt solicitation covers only Microsoft (Proposal 7, "Report on AI Data Usage Oversight"). Either cut the line to Microsoft or add a source for the Amazon and Alphabet filings.
4. tracey-rembert: the line overstates her bio. Fix: correct. The data says her bio "cites earlier shareholder engagement on child safety online". The bio only says she has "experience in worker rights issues and child safety online", and it does not mention AI. Reword to the bio's own phrasing, or use "General shareholder advocacy; no AI work found".

SOFT NOTES (not scored as failures)
- Firm work described with the person's name on it:
  - Three Green Century advocates (andrew-shalit, frances-fairhead-stanova, mckenzie-ursch) share one line: "Shareholder Advocate at Green Century, whose engagement program covers data center and AI companies." The cited /data-centers/ page names none of them; the only person it names is Giovanna Eichner. The line does credit the firm, not the person, so it passes, but it reads as personal AI work.
  - The five NYC Comptroller staff "credited on the postseason report" and the three CalPERS investment directors follow the same pattern.
  - Consider "General stewardship; no AI work found" for anyone with no personal AI credit.
- Old cited pages, though the roles still look current:
  - olga-hancock cites her June 2023 appointment release.
  - adam-c-t-matthews cites a February 2024 letter. 2026 listings (Building Bridges) still give him Chief Responsible Investment Officer.
  - richard-manley's AI quote is from a 2024 report. He is still CSO in 2026.
  - Newer profile URLs would be better for all three.
- profile_source labels: julie-b-tanner and raymond-j-burnell are labelled "employer bio", but the URL is a CBIS quarterly review. "other" fits better.
- erica-serpico: the agenda gives "Director, Investor Choice, UK & Europe" but her ICGN bio says "Head of International Investor Choice". The data matches the agenda.

ORGANIZATIONS (41 new)
- Names and types are reasonable. All 41 are new ids. No new org duplicates an existing id outright. Several (railpen, vanguard, ranking-digital-rights, the-shareholder-commons, world-benchmarking-alliance) fill ids that existing people already used, which is a good fix.
- Church Commissioners for England vs church-of-england-pensions-board-national-investing-bodies: these are separate legal bodies, so keeping both is defensible. The problem is the existing entry's name, "Church of England Pensions Board (National Investing Bodies)", which suggests it covers all the National Investing Bodies, Commissioners included. Rename it to "Church of England Pensions Board" or note the split, or the two will be read as duplicates. Failure 1 above comes from this confusion.
- wba-cic-ethical-ai vs world-benchmarking-alliance: these are the coalition and its host organization, so both can stay, but WBA staff should go under world-benchmarking-alliance (see failure 2).
- Missing organizations: 12 new people point to 4 org_ids that have no entry in network.json organizations: allianz-global-investors, jpmorgan-am, dimensional-fund-advisors and robeco. This was already true for these ids before the change (existing people use them too), but the change adds 12 more. Add the entries or queue it.
- Weak source_url: vanguard, alliancebernstein, danske-bank, manulife-investment-management, sands-capital, imco, omidyar-network, stepstone-group, betashares, los-angeles-capital-management and lbp-am cite a conference agenda or speaker page, not the organization's own site. The facts are not wrong, but their own "about" pages would be better. morgan-stanley-im and neuberger-berman cite a person's bio, which is acceptable.
- Types: brown-advisory as "wealth manager/adviser", railpen and scottish-widows as "asset owner", and danske-bank as "investor" are all defensible.

STYLE
- No em dashes in the new people or orgs.
- No "genuinely".
- "real" appears only inside "Digital Realty" (nimrit-kang-cfa), so nothing to change.

SCORE REASONING
About 95 checked, 4 need a correction, 0 need dropping, 3 unverified because sites blocked the fetch. The two wrong-organization errors are the substantive ones. The rest are wording and source-quality fixes. Score: 88 (PASS).

---
Author's response (2026-11-26): fixed all 4 failures (dan-neale and jenni-black moved to their employers; luke-perlot cut to Microsoft; tracey-rembert reworded to her bio, no AI work found); julie-b-tanner and raymond-j-burnell relabelled "other". Queued: renaming the Pensions Board entry, org records for allianz-global-investors, jpmorgan-am, dimensional-fund-advisors and robeco, better source URLs for the 11 organizations, newer profile URLs for three people, and the firm-credit wording on Green Century, NYC Comptroller and CalPERS lines.

REVIEWER: Data accuracy SCORE: 68 VERDICT: REVISE

TOP FAILURES
1. **Design: the selection rule as written is not the rule that was applied.** Plan step 2 puts any company in scope that has an AI-related proposal or a signed commitment. But left_out drops Lyft, Block, Chipotle, UnitedHealth, Walmart and Visa, each with an AI proposal, as "outside the four sectors" (cu.json left_out). It also drops iFlytek, Ant Group, Megvii and 9 EU code signatories "for focus", while Magic, Reflection AI and WRITER stay in. TSMC also fails the written rule: the Parnassus 2025 report (PDF lines 695-725) shows a climate and water engagement, and AI appears only in Parnassus's investment analysis. Fix: add the sector condition and a size or prominence cut to the `about` key, or move TSMC's basis to its Stargate or another AI source.
2. **Build: vote figures are cited to filings that can't contain them.**
   - Netflix "43.3% support" (cu.json l.915) links to the DEF 14A dated April 18, 2024. That proxy was filed before the vote, and a fetch found no 43.3% in it. The figure is confirmed only by the Harvard forum post (?p=168201).
   - Digital Realty "22.5%" (l.1158) also links to the pre-vote DEF 14A.
   - This breaks PRODUCT.md Never claim 5. Cite the 8-K Item 5.07 instead.
   - Disney and Comcast have only the Harvard secondary source, which breaks Never claim 4 (primary source).
3. **Design: "US-listed" in `investor_access` overstates the shareholder routes.** Baidu, Alibaba, TSMC, Nebius and Arm all file 20-F/6-K on EDGAR (checked via data.sec.gov). As foreign private issuers they are exempt from the US proxy rules, so Rule 14a-8 routes don't apply as readers will assume. Add a fourth value, such as "US-listed (foreign issuer)".

TOP IMPROVEMENTS
1. **Unsourced corporate links.** SpaceX's basis says "xAI, now owned by SpaceX", but the cited gov.uk page doesn't mention SpaceX. Add the S-1 or 8-K as the source. EDGAR already shows SPCX on Nasdaq, so drop "UNVERIFIED".
2. **Entity mapping for the Chinese firms.** The agora page lists entities only: Shanghai Xiyu, Zero One Everything, DeepQuest. It never names MiniMax, 01.AI or DeepSeek. Cite a source tying each entity to its brand. Carnegie does this only for DeepSeek.
3. **Sector rule and evidence fit.** Write down when "frontier lab" applies; ServiceNow, Adobe and Huawei are tagged with it. Also drop evidence items that aren't about AI: Nvidia's "emissions from sold products" proposal and Broadcom's Parnassus climate engagement. Nebius's deal is with Microsoft, not a lab; say the rule counts that.

Spot checks that passed:
- Seoul list (16 original plus 4 added) matches.
- The 17 first Chinese signatories match.
- Stargate funders and partners match.
- Parnassus on Nvidia (investor-group human rights assessment) and on Workday matches. The Nvidia basis is slightly narrower than the source.
- Disney's SEC no-action denial and its withdrawal match the Harvard post.
- Anthropic's ANT listing and 424B4 are confirmed.

OUT-OF-FIELD NOTES
- The basis sentences read as "why in scope", but readers may take them as "engaged". Label the field "Why included".
- Motorola and Thales rest on one 2022 Candriam release that praises them as standouts. The plan sets no age limit on engagement sources.
- The plan's 12-company spot check leaves out the five foreign issuers and the vote figures.

CONTENT RULES: PASS (no em dashes, "genuinely" or "real" in cu.json). The data accuracy side fails Never claims 4 and 5 (failure 2).

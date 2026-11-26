REVIEWER: Data accuracy SCORE: 72 VERDICT: REVISE

Scope: the 43 `cn-` events in data/causality.json, the 17 links that touch them, and the 24 `cn-` rows in data/coverage.json (branch data/global-policy). I read 38 of the 43 source pages directly (cac.gov.cn, gov.cn, npc.gov.cn, mofcom.gov.cn, samr.gov.cn, nea.gov.cn, court.gov.cn, most.gov.cn, news.cn, plus the secondary pages). I also read the CAC generative AI registry PDFs for April and October 2026, and the green data center plan PDF.

TOP FAILURES
1. **The dual-use suspension date is wrong (content rule 6).** `cn-us-dual-use-export-ban` says clause 2 "is now suspended until 2027-01-27". MOFCOM Announcement 2025 No. 72 suspended it from 2025-11-09 to **2026-11-27**. I found no extension: the S&P, Fastmarkets and Mining.com coverage all give 2026-11-27, and the November 2026 extension notice that JETRO describes (MOFCOM/GAC 2026 No. 58, to 2027-01-10) covers the October 2025 rare earth measures, not 2024 No. 46. The cited source_url (the original 2024 notice) supports neither date.
2. **Status labels break the repo's own vocabulary.** Investigations, a summons, voluntary pledges and diplomatic statements are all marked "in force". The rest of causality.json uses "investigation open", "preliminary findings; no final decision", "voluntary" (e.g. `seoul-frontier-commitments`) and "nonbinding". The rare earth controls are marked "enacted, not yet in force", but clause 1(3) of No. 61 took effect on 2025-10-09 and the whole notice is now suspended to 2027-01-10.
3. **Three summaries or notes say more than their source.** `cn-analog-chip-antidumping` names Texas Instruments, but MOFCOM 2025 No. 27 names no US producer. `cn-labeling-measures` and its coverage row say all AI services must add visible labels. Articles 2 and 4 limit visible labels to providers under the three CAC rules, in the Deep Synthesis Art. 17(1) cases that may confuse the public; hidden metadata labels are the general duty. The `cn-minors-online-regulations` event and coverage row say large platforms "publish yearly reports on anti-addiction work". Art. 20(6) requires a yearly minors' online protection social responsibility report, while the yearly anti-addiction disclosure is Art. 42 and applies to all providers.

TOP IMPROVEMENTS
1. Update `cn-genai-registry` to the October 2026 list: 1,234 general filings and 955 registrations, plus separate on-device and companion lists. 868 and 530 are correct for 2026-04-30 but stale.
2. `cn-green-dc-action-plan` cites a gov.cn PDF but is marked `source_kind: "secondary"`; it is primary. Also say "large and very large" data centers, and say the 1.25 is a target for the end of 2025.
3. Date-stamp "No draft AI law has been published" (as of 2026-11-26) in `cn-state-council-legislative-plan-2026`.

OUT-OF-FIELD NOTES
1. Today is the last day of the dual-use suspension; this row will need checking again after 2026-11-27.
2. `cn-ai-tech-export-catalogue`: the comment period closed on 2026-11-15; the row could say so.
3. The `cn-ai-agents-opinions` page gives no effective date; it is policy guidance, so "in force" should become "nonbinding".

CONTENT RULES: FAIL (rule 6: the 2027-01-27 suspension date in `cn-us-dual-use-export-ban` is unsupported; the Texas Instruments claim in `cn-analog-chip-antidumping` is not on the cited page)

## Required fixes

1. `cn-us-dual-use-export-ban` summary: replace the last sentence with "MOFCOM suspended the second clause from 2025-11-09 to 2026-11-27 (Announcement 2025 No. 72); the ban on military users stays in force." Cite No. 72 (or the No. 72 coverage) for the suspension. Status: "in force (clause 2 suspended to 2026-11-27)".
2. `cn-rare-earth-chip-controls` status: "suspended until 2027-01-10". The summary should cite the source for both suspensions: No. 70 of 2025-11-07, and the 2026-11-09 extension (MOFCOM/GAC 2026 No. 58, or the S&P Global report of 2026-11-09 marked secondary).
3. `cn-analog-chip-antidumping`: delete "the petition lists US producers including Texas Instruments", or cite a secondary source that names it and mark it secondary. Also say "the petition came from the Jiangsu Semiconductor Industry Association", which the notice does state.
4. `cn-labeling-measures` summary: change "AI services must add visible labels to generated text, audio, images, video and virtual scenes and hidden labels in file metadata" to "Providers covered by the algorithm, deep synthesis and generative AI rules must add hidden labels in file metadata, and visible labels to text, audio, images, video and virtual scenes where Deep Synthesis Art. 17(1) applies (content that may confuse the public)".
5. Coverage row `ask-ai-misinformation` / `cn-labeling-measures`: change "All AI services in China must add visible and metadata labels" to "AI services covered by China's algorithm, deep synthesis and generative AI rules must add metadata labels, plus visible labels where content may confuse the public".
6. `cn-minors-online-regulations` event and coverage row `ask-child-safety` / `cn-minors-online-regulations`: replace "publish yearly reports on anti-addiction work" with "publish a yearly minors' online protection social responsibility report".
7. Coverage row `ask-ai-oversight-reporting` / `cn-algorithm-provisions`: change "and file self-assessment reports with the CAC" to "and, for services with public-opinion capacity, file algorithm self-assessment reports with the CAC".
8. Coverage row `ask-ai-oversight-reporting` / `cn-anthropomorphic-ai-measures`: change "Large AI companion services must submit security assessment reports to provincial regulators each time listed triggers apply" to "AI companion providers must submit security assessment reports to provincial regulators at launch, after major changes and on reaching 1 million registered or 100,000 monthly active users".
9. Statuses, to match the existing vocabulary:
   - `cn-samr-nvidia-probe`: "investigation open".
   - `cn-samr-nvidia-finding`: "preliminary findings; no final decision".
   - `cn-samr-qualcomm-probe`, `cn-analog-chip-antidumping` and `cn-us-ic-antidiscrimination`: "investigation open".
   - `cn-nvidia-h20-summons`: "completed".
   - `cn-aiia-safety-commitments` and `cn-ai-safety-commitments-framework`: "voluntary".
   - "nonbinding" for `cn-ai-ethics-norms`, `cn-global-ai-governance-initiative`, `cn-global-ai-governance-action-plan`, `cn-ai-safety-framework-2` and `cn-genai-security-standards`. The standards are recommended GB/T and took effect on 2025-11-01.
   - "nonbinding plan" for `cn-ai-plus-opinions` and `cn-15th-five-year-plan`.
   - "nonbinding" for `cn-ai-agents-opinions`.
10. Link `cn-global-ai-governance-initiative` to `cn-ai-safety-framework-2`: the CAC page says Framework **1.0** implemented the Initiative and 2.0 builds on 1.0. Delete this link; the chain through `cn-ai-safety-framework-1` already carries it.
11. `cn-green-dc-action-plan`: set `source_kind` to "primary".

## Verified correct (against the cited page)

- **`cn-labeling-measures`:** dated 2025-03-14, in force 2025-09-01; the platform checks, the app-store checks, the filing material (Art. 12) and the ban on removing labels are all on the page.
- **`cn-cybersecurity-law-ai-amendment`:** adopted 2025-10-28, in force 2026-01-01; new Article 20 and the higher penalties match.
- **`cn-anthropomorphic-ai-measures`:** dated 2026-04-10 (Order 21), in force 2026-07-15, issued by the five bodies listed. The minors, under-14 consent, self-harm, dependence, training data, 1 million / 100,000 user and algorithm filing duties are all present.
- **`cn-labeling-enforcement-2026`:** Jianying, Maoxiang and Jimeng AI; the summons, correction order and warning, issued by local offices under CAC guidance.
- **Nvidia:** the probe (2024-12-09) and the preliminary finding plus further investigation (2025-09-15) both cite the 2020 Mellanox conditions.
- **`cn-nvidia-h20-summons`:** 2025-07-31; Nvidia was asked to explain backdoor and vulnerability risks and to submit evidence.
- **Rare earth No. 61:** the 14nm logic, 256-layer memory and military AI case-by-case review match.
- **`cn-genai-registry`:** 868 filed and 530 registered by 2026-04-30 (PDF serial numbers), and the duty to show the model name and filing number.
- **Green data center plan:** PUE below 1.5, 1.25, 1.2 and over 80% green electricity at hubs all match. The 2026 AI energy plan's review criteria and the AI Plus link also match.
- **`cn-ai-safety-framework-2`:** 2025-09-15, CNCERT under CAC guidance, a TC260 technical document.
- **`cn-state-council-legislative-plan-2026`:** 2026-05-11; "comprehensive legislation on the healthy development of AI".
- **`cn-ai-agents-opinions`:** 2026-05-08; the tiered governance, minors and older people, and the AI Plus basis match.
- **`cn-15th-five-year-plan`:** Chapter 14 section 2 covers laws, ethics, algorithm filing, transparency, safety assessment and lifecycle risk management; Chapter 41 covers AI's effects on employment.
- **Rule texts:** the PIPL Art. 24, Algorithmic Recommendation, Deep Synthesis, Generative AI Measures, Minors regulations (including the 50 million yuan fine), Network Data Security Art. 19 and Ethics Review texts match their summaries.
- **Other notices:** Micron, gallium and germanium, the two Qinglang campaigns (3 and 4 months), Qualcomm, the anti-discrimination probe, NFRA (32 points), SPC (24 articles), and the export catalogue (23 AI technologies, registration now).
- **Secondary sources:** the AIIA (17 firms, Seoul-like) and CnAISDA framework sources match.
- **Links:** the other 16 links match their sources.
- **Coverage:** the remaining 19 rows match their sources. All 24 rows' `graph_id` values exist and their `policy_status` matches the event.
- **Wording and dates:** no em or en dashes, no "genuinely" and no "real"; no China event is dated after 2026-11-26.

REVIEWER: Data accuracy SCORE: 78 VERDICT: REVISE

Round 2 re-checks only what failed in round 1: the 11 required fixes, plus the effect of fix 9 on the coverage rows' policy_status.

**Correction to my round 1 review.** In round 1, fix 1 told you to cut the dual-use suspension back to 2026-11-27. That was wrong. MOFCOM Announcement 2026 No. 59 (dated 2026-11-23, published 2026-11-24) suspends clause 2 of 2024 No. 46 again, from 2026-11-28 to 2027-01-27. The original "2027-01-27" was right; it just lacked a source. The Global Trade Alert page you added as suspension_source_url says the same ("extended until January 2027", revocation date 27 Jan 2027). I'm sorry for the extra round this caused.

TOP FAILURES
1. **`cn-us-dual-use-export-ban` now stops at 2026-11-27, which is out of date.** Today is 2026-11-26, and No. 59 extends the suspension to 2027-01-27. Source: https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_69b3633579184af38198463be8116ebf.html (read directly; it has the 2026-11-28 to 2027-01-27 wording).
2. **The rare earth extension is confirmed, and the new suspension source is the wrong document.** MOFCOM/GAC Announcement 2026 No. 58 (2026-11-09) continues the suspension of 2025 No. 55 to 58 and No. 61 to 62 from 2026-11-11 to 2027-01-10. Source: http://dltb.mofcom.gov.cn/swyw/art/2026/art_bab1f1be0cee4e4ab0b496f02e7cff0d.html (read directly). The suspension_source_url now on `cn-rare-earth-chip-controls` (news.cn, 2025-10-09) is the text of 2025 No. 56, the rare earth equipment control. It supports neither No. 70 nor the extension. No. 70 is at https://www.mofcom.gov.cn/zcfb/blgg/gg/2025/art/2025/art_bc4513421bb24faaa84e44c2e4f36dc5.html. That URL appeared under the No. 72 title when I fetched it, so it should be checked before use.
3. **One rewording was not applied.** In data/coverage.json, the row `ask-child-safety` / `cn-minors-online-regulations` still says "publish yearly anti-addiction reports". The event summary was fixed; the coverage note was not.

TOP IMPROVEMENTS
1. `cn-green-dc-action-plan`: say "large and very large" data centers, and say the 1.25 is an end-2025 target.
2. In the `ask-ai-misinformation` / `cn-labeling-measures` note, put a semicolon before "platforms must flag AI content" so it reads as two duties.
3. `cn-genai-registry`: update the counts to October 2026 (1,234 filed, 955 registered).

OUT-OF-FIELD NOTES
1. Both suspensions now end in January 2027; queue a re-check of both rows for then.

CONTENT RULES: FAIL (the suspension source for `cn-rare-earth-chip-controls` does not support the claim it is attached to)

Verified fixed: fixes 3 to 5, 7 and 8 (the TI claim removed, the labeling event and coverage wording, both oversight notes), fix 6 for the event summary, fix 9 (all statuses use the repo vocabulary), fix 10 (link removed; only framework 1.0 to 2.0 remains) and fix 11 (primary). All 24 cn- coverage rows' policy_status matches their event. There are still no em or en dashes, no "genuinely" and no "real".

## Required fixes

1. `cn-us-dual-use-export-ban`:
   - Summary, last sentence: "MOFCOM suspended the second clause from 2025-11-09 to 2026-11-27 (Announcement 2025 No. 72) and again from 2026-11-28 to 2027-01-27 (Announcement 2026 No. 59); the ban on military users stays in force."
   - Status: "in force (clause 2 suspended to 2027-01-27)".
   - suspension_source_url: https://www.mofcom.gov.cn/zwgk/zcfb/art/2026/art_69b3633579184af38198463be8116ebf.html, which is primary.
2. `cn-rare-earth-chip-controls`:
   - Summary, last sentence: "Suspended from 2025-11-07 to 2026-11-10 (Announcement 2025 No. 70) and again from 2026-11-11 to 2027-01-10 (MOFCOM/GAC Announcement 2026 No. 58)."
   - Status: "suspended (to 2027-01-10)".
   - suspension_source_url: http://dltb.mofcom.gov.cn/swyw/art/2026/art_bab1f1be0cee4e4ab0b496f02e7cff0d.html.
3. Coverage row `ask-child-safety` / `cn-minors-online-regulations`: replace "publish yearly anti-addiction reports" with "publish a yearly minors' online protection social responsibility report".

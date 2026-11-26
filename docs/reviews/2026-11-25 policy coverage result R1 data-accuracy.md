REVIEWER: Data accuracy SCORE: 74 VERDICT: REVISE

Scope: data/coverage.json (25 rows), new event colorado-sb26-189, link colorado-ai-delay -> colorado-sb26-189, reworded colorado-ai-delay summary, SOURCES.md row. Spot checked 17 rows against fetched text: Utah HB 76 enrolled PDF, Holland & Knight SB 189 alert, leg.colorado.gov SB26-189 page, H&K California data center alert (leginfo returns 403), Governor of NY page, MoFo RAISE alert, Cuatrecasas omnibus post, EUR-Lex AI Act, GPAI Code Safety chapter. All policy_id and graph_id values exist. No em dashes, "genuinely" or "real".

TOP FAILURES
1. Link colorado-ai-delay -> colorado-sb26-189 names "an xAI lawsuit". The cited H&K page says only "a large AI developer" sued in April 2026 and does not name xAI. The fact is true (DOJ press release, 24 Apr 2026) but is not in the cited source.
2. ask-ai-misinformation + eu-gpai-obligations says "misinformation is not named in the Act's text". False: EUR-Lex recital 110 lists "the facilitation of disinformation" among general-purpose model systemic risks, and recital 133 names "risks of misinformation". The articles do not require a misinformation report, which is the defensible point.
3. Sources that do not hold the claim: (a) all three eu-gpai-code rows cite the Commission landing page, which mentions none of CSAM, non-discrimination, misinformation, manipulation or crawler opt-outs; those are in the Code's chapters (Safety and Security Appendix 1.1 and 1.4; Copyright chapter). (b) ask-ai-oversight-reporting + ny-raise-amended cites the Governor's December page, which has no 2027 date; the MoFo page (the event's own source) says enforcement is delayed until January 2027.

TOP IMPROVEMENTS
1. ask-ai-fossil-fuels (none) lists "Colorado AI Act", which SB 26-189 repealed; name SB 26-189.
2. eu-omnibus-adopted status: the omnibus was published in July 2026 (Cuatrecasas); "enacted, not yet in force" on the child-safety row reads oddly beside "delayed" on the others. Consider one wording, such as "in force, applies December 2026".
3. ask-ai-bias + colorado-sb26-189: H&K says SB 189 eliminated the duty of reasonable care against algorithmic discrimination; saying so would make the partial rating clearer.

Verified correct: Utah HB 76 (75 acre-feet threshold, per-facility publication, effective May 6, 2026, "in force"); AB 2619 (license-linked expected and prior-year water use, effective January 1, 2027); SB 53 (published frameworks and transparency reports, catastrophic risk); all Colorado rows and the new event's dates, domains, AG-only enforcement, dropped impact assessments, training-data categories "to the extent known"; EU energy-use documentation (Annex XI), Article 5 bans, military exclusion, Article 50 marking.

OUT-OF-FIELD NOTES
1. "led to" from the delay event overstates causation; the source gives the order and lawsuit as context.
2. Article 50 timing: the omnibus sets a December 2, 2026 grace deadline for transparency solutions; "from August 2026" is the base date only.

CONTENT RULES: FAIL (rule 6: unsupported xAI name in causality link; false "not named" claim in coverage row ask-ai-misinformation + eu-gpai-obligations). Both are one-line fixes.

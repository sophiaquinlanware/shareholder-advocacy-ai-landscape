REVIEWER: UX / content (spelling and grammar) SCORE: 78 VERDICT: REVISE

**TOP FAILURES**
1. **The planner builds an ungrammatical heading on every plan.** planner.js:158 takes the role label, lowercases it and adds "companies". The Microsoft plan renders "Asks filed at other cloud and model platforms companies". Other roles would give "frontier labs companies", "strategic investors companies" and "consumer products companies".
2. **British and American spelling are mixed across about 25 records.** The site writes "data center(s)" 114 times and "data centre(s)" 15 times. It also has "license" next to "licence", and the "Center force" setting next to "Colour proposals…" in the same graph settings panel (graph.js:270 and graph.js:295). The British forms are in causality.json (8 events), coverage.json (entries 69 to 74), pathways.json ties/28, value_chain.json all_ties/72, people.json (ai_focus for 4 people), roles.js:19 ("organisations", "defence") and companies.json magic ("organisation").
3. **Some text contradicts itself or repeats a word.**
   - The New SEC filings view shows "Microsoft: Investor exempt solicitation filed, filed November 25, 2026". The "filed" comes once from data/changes.json and again from app.js:577.
   - The home page says "Checked November 26, 2026: 0 new filings found", then "See the 8 new filings".
   - The Laws and rules description says "since 2022", but the view lists "195 dated events, Jun 16, 2011 to Nov 25, 2026".
   - graph.json node ev-cn-green-dc-action-plan says "large large and very large data centers".

**TOP IMPROVEMENTS**
1. **Pick one date format.** Prose uses "November 27, 2026", the planner uses "Jun 24, 2027", pathways and outcomes use "2026-11-27", "2025-10" and "2024-H1", and people uses "4 March 2026" and "1 January 2027".
2. **Pick one spelling of each name and one way to list companies.** The site has "Nvidia" 78 times and "NVIDIA" 19 times, mostly in scorecard outcomes titles the site wrote. It has "Alphabet (Google)" in the scores and "Alphabet" elsewhere. The fund-votes company filter mixes names and tickers and is not sorted: "Apple, Amazon, DLR, Alphabet, … NFLX, … PLTR, SO".
3. **Keep status badges from running into titles when read as text.** The planner policy list reads "…enters into force in force:" and "…adding technology due diligence voluntary:". The route reads "Still open Any record holder…". A separator or brackets would fix it, e.g. "(in force)".

**OUT-OF-FIELD NOTES**
- The levers text in site.json, "Shareholders can still vote against the directors who oversee AI risk", is factual but sits close to the no-vote-recommendation rule. Worth an owner glance.
- The AI disclosure scores intro says "Not affiliated with Parnassus Investments". It does not say the site scored the companies "against Parnassus Investments' published recommendations", as PRODUCT.md item 3 asks.
- The Rule 14a-8 label is set in capitals by CSS and shows as "RULE 14A-8", which misstates the rule number.

**CONTENT RULES: PASS**
- No em dashes in the rendered text, the JSON strings or the JS strings.
- No "genuinely" or "real" in visible text.
- No vote or partner recommendations in the site's own copy. "The Board recommends a vote AGAINST" only appears inside verbatim N-PX descriptions.
- Plain English is mostly met. The pathways text "(5; link is the first)", repeated for each filer, is the least plain.

**FULL FINDINGS**
- planner.js:158 | "other ${role.toLowerCase()} companies" | write a noun phrase for each role, e.g. "other cloud and model platform companies"
- app.js:577 with data/changes.json `what` | "Investor exempt solicitation filed, filed Nov 25" | "Investor exempt solicitation, filed Nov 25" (drop "filed" from the `what` values)
- app.js:582 | "${n} new AI-related filings in that run" (no plural helper; "1 … filings") | use plural(); match the home page wording "new filings found"
- app.js:581 | "Finds are listed here before anyone reviews them." | "Filings found are listed here before anyone reviews them."
- app.js:632–633 | "0 new filings found" next to "See the 8 new filings" | "See the 8 filings found so far"
- app.js:643 | "16 more open filing deadlines are on each company's profile" | "16 more open filing deadlines are on the company profiles"
- app.js:110–111 (upcoming.json status_label) | "Apple, expected late February 2027: Expected" | drop the repeated "Expected"
- index.html:111 | "how companies and investors responded since 2022" | "how companies and investors have responded" (events start in 2011)
- graph.json ev-cn-green-dc-action-plan description | "large large and very large" | "large and very large"
- graph.js:353 | "which companies AI proposals reach" | "which companies the AI proposals reach"
- graph.js:270 vs graph.js:295 | "Center force" / "Colour proposals" | "Color proposals"
- roles.js:19 business.about | "organisations, including policing and defence" | "organizations, including policing and defense"
- companies.json magic engagement_basis | "an organisation" | "an organization"
- causality.json eu-cada-proposal, eu-dc-rating-scheme, eu-eed-dc-reporting, iigcc-ai-data-centres-insight, iigcc-bondholder-data-centres, links/61 (title, summary, explanation) | "data centre(s)" | "data center(s)"
- causality.json bis-ai-diffusion-rule, bis-h200-case-by-case, nvidia-h20-license (title, summary) | "licence(s)" | "license(s)"
- causality.json uk-ofcom-x-grok-investigation (title, summary) | "sexualised" | "sexualized"
- coverage.json entries 69, 70, 71, 72, 74 note | "data centre(s)" | "data center(s)"
- pathways.json ties/28 and value_chain.json all_ties/72 | "French data centres" | "French data centers"
- people.json andre-shepley, sherman-jewett, julia-christine-rippel ai_focus | "data centre(s)" | "data center(s)"
- people.json estelle-parker and lisa-beauvilain ai_focus | "programme" | "program"
- people.json cambria-allen-ratzlaff ai_focus | "general responsible investment leadership" | "General responsible investment leadership; no AI work found" (match the other rows)
- people.json, many ai_focus rows | "no AI work found" / "no AI-specific engagement found" / "bio does not cite AI-specific work" | use one phrase
- pathways.json:797 (also value_chain.json:5331, graph.json:13103) | "OpenAI got warrant" | "OpenAI got a warrant"
- pathways.js:168 | "(5; link is the first)" | "(5 filings; first linked)"
- pathways.js:164 | "in this site's records, meetings from 2023" | "in this site's records (meetings since 2023)"
- scorecard.json outcomes titles (lines 1366, 1374 and others) | "NVIDIA" | "Nvidia"
- scorecard.json:1399 summary | "Parnassus led development of first-of-its-kind" | "Parnassus led the development of first-of-its-kind"
- scorecard.json outcomes (Workday title) | "completes NIST AI RMF assessment and ISO 42001" | "completes NIST AI RMF assessment and gets ISO 42001 certification"
- scorecard.json outcome source labels | "p. 14, 21" / "p. 1-4" | "pp. 14, 21" / "pp. 1–4"
- scorecard.json:253 name | "Alphabet (Google)" | "Alphabet"
- value_chain.json:100 label vs valuechain.js:76 vs roles.js | "Consumer and business products" / "Business and government" / "Business and government products" | use one tier name
- votes.js company filter | names and tickers mixed (DLR, NFLX, PLTR, SO) and unsorted | full names, A to Z
- planner.js:109 vs the planner grid intro | "filed from a critical stance on ESG" vs "filers critical of ESG" | "filed by a filer critical of ESG"
- Planner percentages | "median support 9%" / "14.2%" / "18.39%" | use one precision
- data/causality.json jurisdiction values | "EU" / "European Union", "UK" / "United Kingdom", "Nevada; Texas", "Europe / Global" | use one form each
- causality.js:193–194, graph.js:678 and graph.js:1324, lenses.js:381, 505 and 509, graph.js:1257 | "${n} steps / connections / votes / proposals / members" | use plural() so 1 reads singular
- rights and people count lines | "29 companies." / "257 people." | drop the trailing period, as on the other count lines
- rights voting-control notes | "~52.7% of votes" next to "about 52.7%" | "about 52.7% of votes"

Rendered text of all 15 views (1440 px) is saved in /private/tmp/claude-503/-Users-Quinlan-Downloads-outreach-radar-extension-2/254ea18c-3896-4871-90a5-a793efccf32b/scratchpad/ux/, with the scan output in scan.out. Not checked: text that only appears after clicking, such as graph node panels and planner states for other companies. No repo files were edited.

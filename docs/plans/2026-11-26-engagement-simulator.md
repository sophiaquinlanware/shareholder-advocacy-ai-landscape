# Plan and test: section order and the engagement scenario simulator

Owner, 2026-11-26: "make this website the purest, best version of a functional website" for people who want to
"gain context for AI engagement in the shareholder advocacy space", "plan their own engagements" and "optimize
collaboration with other investors that's able to fill in gaps that policy doesn't reach or build on policy";
"think causally about how your plan will affect things in the future, which is why I want the prediction-out-time
element. You can think about how to include many agents in this, so you can simulate different plans", inspired
by Knowledge Lab. Earlier the same day: "as you progress through the tabs, you gain more and more context, and then
you end with planning your engagement".

## 1. Section order (index.html)

Context first, planning last: Deadlines and votes · Company profiles · AI value chain · Proposals and results ·
Network and contacts · Laws and rules · **Plan and test** (Plan an engagement `#planner`, Test plans over time
`#simulate`). Each section ends with "Next: … →". Every view keeps its address.

## 2. The simulator (sim.js, data/sim_params.json, scripts/build_sim_params.py)

An agent-based model, one proxy season a year, one ask at a time (asks do not interact; companies within an ask
do, through contagion). Agents and their rules, each estimated from this site's data with its counts kept:

| Agent | Rule | Estimate |
|---|---|---|
| Filers | refile a company and ask the next season | k of n pairs the SEC rule did not block |
| Filers | file an ask at a company for the first time; higher if the ask was filed at a same-role company the season before (contagion) | two rates, exposed and unexposed |
| SEC rule | block a refile under Rule 14a-8(i)(12) (5 / 15 / 25%) | the rule, as in rules.js |
| Companies | exclude a proposal | k of n filings |
| Companies | commit and end the proposal (withdrawn after an agreement) | first filings and refiles separately (3 of 47; 0 of 25) |
| Voters | support: last year's figure times a yearly ratio with the recorded spread; a first filing draws from the ask's recorded votes | chosen on a held-out season |
| Fund families | vote FOR at their N-PX rate on the ask | shown in the step-by-step log |
| Policy | the SEC's proposed rescission of Rule 14a-8 can be switched on from a season; then only floor proposals where a company's rules leave the route open | scenario switch, source linked |
| You | file each season on your plan's company and ask pairs; leading a coalition multiplies the commitment chance | default ×1.33 from Dimson, Karakaş and Li (adjustable) |

Every rate is drawn from its Beta posterior in each run, so the bands show chance and thin data together. A plan
and the no-plan baseline share random streams (one per run, ask, season and company), so their difference is the
plan's effect. Support is capped a little above the highest recorded vote.

**Backtest.** Fitted on 2023–2025, run on 2026: first filings expected 12.5, recorded 12; refiles expected 5.3,
recorded 9 (the model runs low; the refile rate is adjustable); support error 5.7 points carrying last year forward
against 7.2 with an average drift, so no drift is used. All shown on the page.

**Outputs.** Per plan: chance each target commits by the horizon; support band; chance a refile is blocked;
expected commitments on the ask across companies, against no added filer (spillover). A chart of support over
time (recorded dots, scenario bands, the three resubmission bars), a season slider over the field (recorded
seasons, then scenario shares), one run's step-by-step log, and a ranking of every company and ask by the change
one more filer makes, with "never filed here" and holders who filed the ask elsewhere shown. Up to three plans.

**Not modelled, stated on the page.** Letters, meetings, exempt solicitations and votes against directors have no
outcome records here. Companies, investors and asks are alike within each estimate. LLM-driven agents (Knowledge
Lab's generative-agent work) would need a server and would produce text that is not a record; not in v1.

## 3. Content rules

PRODUCT.md "Never claim" 1, 2 and 5 hold: results are labelled "scenario computed by this site … not a forecast;
not advice"; no vote or partner is recommended; the ranking describes the model ("where one more filer changes the
model most"). PRODUCT.md records the owner's request as a labelled exception for scenario figures.

## 4. Later

The network's Proposals view can read `window.SIM.simulate(plan, scenario)` to draw scenario seasons as faded
proposals after today (UI session). An engagement log with outcomes would let the model cover levers beyond filings.

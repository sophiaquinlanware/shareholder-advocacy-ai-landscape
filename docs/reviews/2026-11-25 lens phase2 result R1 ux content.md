REVIEWER: UX / content SCORE: 74 VERDICT: REVISE

TOP FAILURES
1. **Facts can show without a source.** The deadline line says "(… days left, from the proxy statement)" and adds a link only when `d.source` is set (lenses.js:162). The renderer at graph.js:402 shows nothing when `href` is null, so neither a link nor "source pending" appears. Two other places do the same: `vote_history` entries without `results_url` are dropped silently (lenses.js links filter), and seeking asks without `contact_url` carry no reference at all. Live data does not trigger this today, but it will as soon as the data session fills these fields.
2. **The resubmission state is wrong for upcoming proposals.** In rules.js `resubmission()`, when `pending` is true, `count` includes the proposal's own vote, but `state` compares the *previous* vote with that higher bar. Example: one earlier vote at 10% (2025) and an upcoming 2026 proposal. The count becomes 2 and the bar 15%, so the node reads "Below this site's reading of the resubmission threshold". That proposal is on the ballot, which means it was eligible. The line suggests ineligibility the data does not support. There is no test for the "below" state, though Revision 2's "Tests added" list asks for one (tests/lens2.spec.js:75 covers only at-risk and no flag).
3. **The vote target sits right next to the meeting date.** desktop-light-resubmission.png shows "Needs 25% to stay eligible" directly above "Annual meeting December 8, 2026 … Vote by 11:59 p.m." on an upcoming vote. Together they read as a support target for a vote still to come. That is close to PRODUCT.md Never claim 1, even though the wording follows the owner's.

TOP IMPROVEMENTS
1. For an upcoming proposal, word the line as a fact about the bar: "Resubmission threshold after this vote: 25% (vote 4 in 5 years; this site's reading…)". Keep "Last vote: X%" as its own fact.
2. On a proposal, the deadline is in practice past by the time the proposal is in the proxy. Most deadline marks will therefore come from a company's `next_proposal_deadline`. Say so in STATE.md, and check the company wording ("Proposal deadline for the next annual meeting") on a fixture company as well.
3. Gap panel: the facts note and "Filed at N of them" are well scoped. Also add the tier or comparability note so "comparable" is visible, since Revision 2 dropped tier.

OUT-OF-FIELD NOTES
- Accessibility: on the phone screenshot (phone-light-warm-path.png) the sticky tab bar covers the top of the node panel ("What you can do"). This may only be a full-page capture effect; check it on a real phone.
- Accessibility: in the panel, "Upcoming vote" and "At risk…" use the same hollow-circle icon. The text tells them apart, but the icon carries no meaning.
- Data accuracy: `vote_history` matching "same subject" is a judgement. The "Earlier votes matched by this site" line appears only if `source`/`match` is set, so confirm the data session sets it.

CONTENT RULES: FAIL
- AGENTS rule 6 / Never claim 4: the deadline, seeking and resubmission lines can show facts with no source link and no "source pending" (graph.js:402 with lenses.js:162–166). This is latent: no live data triggers it yet.
- Never claim 1: borderline, not a fail on its own. "Needs 25%" on an upcoming vote, placed next to the vote-by line.
- These pass:
  - exempt-solicitation asks are hidden;
  - no board recommendation is shown;
  - the gap wording is scoped to "this dataset";
  - the resubmission line ends with "this site's reading; thresholds may change";
  - the holdings panel says "Stored in this browser only".

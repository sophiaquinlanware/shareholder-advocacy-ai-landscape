# Network views plan, review R1: UX, accessibility, data

Reviewer: subagent, 2026-11-26. Saved verbatim.

Score: 68/100. FAIL. The plan's intent is sound, but several edge types end up in no view or the wrong one, and some lens controls stop doing anything. I checked the plan against data/graph.json and against the in-progress `MODES`/`inMode` code already in graph.js (uncommitted).

1. **Policy layer has no view.** The policy layer has 74 edges ("acted in", "led to", "responded to", "cited by", "enables", "restricts") and 65 nodes of types policy, response and public. The plan hides them in Proposals and never lists them under Connections. The code does the opposite: `inMode` sends them to Connections. Fix: name them in Connections ("Policy and responses", top band) and say so in the plan.
2. **Policymaker loses its policy nodes.** That lens shows policy and response by default, and the plan opens it on Proposals, which hides them. Fix: open Policymaker on Connections, or let Proposals keep policy and response for that lens only.
3. **Ask edges have no layer.** The "asks for" and "coverage" edges that `setAsks` builds have no `layer`, so `inMode` drops them in Proposals. Orphans are forced off there, so every ask disappears. Fix: set `layer:"proposals"` on those edges.
4. **Direct solicitation edges ignore the filters.** 57 investor→company "exempt solicitation for/against…" edges sit in the proposals layer with no proposal, year or status. They stay visible under Active and under any year setting, which is a data-accuracy problem. Fix: route them through the matching proposal, or hide them when Active/Past or the year slider is set.
5. **"Supporters" is wrong for 15 edges.** Those edges say "against". Write "filers, co-filers and soliciting investors (for or against)".
6. **Person-to-person ties are unnamed.** "Colleague" (15), "co-authored", "co-presented" and "coalition role" aren't in the Connections edge list. Add them.
7. **Some controls do nothing in Connections.** The year slider, the topic and year selects and Active/Past only affect proposals (and "ev-" events, which are hidden too). Disable or hide them there with a one-line reason. The same goes for the Orphans setting in Proposals, which line 713 ignores.
8. **Focus and path-finder can't show cross-view nodes.** `focus()` and the path-finder clear `hiddenKinds` but not the view's hidden kinds. A search hit or a filing path ("lead filer", "proposal at") in Connections draws nothing. Fix: switch views automatically and announce it.
9. **Panel ignores the view.** `neighbors()` ignores `inMode`. Filter it, or group the list by view.
10. **Holdings wording.** Held companies with no proposals disappear in Proposals. Say "not in this view", not "not in this map".
11. **Accessibility.** Put `role="group"` and `aria-label="Graph view"` on the pair, and do the same for the status switch. Announce each change in `#net-lens-status` with the shown count. Keep focus on the button.
12. **Wording.** "How everything connects" and "Proposal flow" read as slogans. Use "Ties between filers, companies and labs" and "Proposals: filers to companies". Also, "Past" includes excluded proposals that never reached a ballot, so say "voted, withdrawn or excluded" in the note.

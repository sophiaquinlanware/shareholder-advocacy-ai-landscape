"""Engagement campaigns as dated states, an outcome summary, and the commitments ledger -> data/campaigns.json.

A campaign is one ask at one company. Its states come from records already on the site, each with its source:
  filed (proxy statement or the proponent's notice), exempt solicitations for or against (Form PX14A6G),
  voted (8-K results), withdrawn with or without a company commitment, excluded (with the company's reason),
  on an upcoming ballot.
Company-level engagement steps reported by investors (for example Parnassus's stewardship reports) are kept apart,
as reported steps, because they are not tied to one ask.
The commitments ledger comes from data/commitments.json (researched by hand: what was promised, by when, the source,
and delivery evidence from the company's own documents).

Milestone stage of a proposal campaign, highest reached on the record:
  1 concern raised (a filing) -> 3 commitment made (withdrawn after a company commitment) -> 4 commitment delivered
  (ledger status "delivered", with the company's own evidence). Stage 2, company engaged, is reached outside proposals:
  the separate company-level ladder ("outside") uses investor-reported steps (2), ledger commitments (3, 4).
Exempt solicitations after an exclusion (no vote to campaign for) are escalation steps, dated by filing.
Run after build_graph.py (it reads graph.json for filers and exempt solicitations).
"""

import json
from collections import Counter, defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
load = lambda f: json.loads((DATA / f).read_text())
# PX14A6G filings after an exclusion, as the filing itself describes them (checked by hand).
ESCALATION = {
    "https://www.sec.gov/Archives/edgar/data/1018724/000121465926006345/amz515260px14a6g.htm":
        {"date": "2026-05", "label": "Exempt solicitation urging votes against four directors over the exclusion"},
}
STAGES = ["Concern raised", "Company engaged", "Commitment made", "Commitment delivered"]
COMMIT_WORDS = (" committed to", "negotiated agreement", " agreed to")


def main():
    P = load("proposals.json")["proposals"]
    asks = {a["id"]: a["label"] for a in load("asks.json")["asks"]}
    companies = load("companies.json")
    by_name = {c["name"].lower(): c.get("ticker") for c in companies}
    graph = load("graph.json")
    nodes = {n["id"]: n for n in graph["nodes"]}

    acts = defaultdict(list)  # proposals.json id -> [(role, org label, url)]
    for e in graph["edges"]:
        a, b = nodes.get(e["source"]), nodes.get(e["target"])
        if not a or not b or b["type"] != "proposal" or a["type"] not in ("investor", "coalition"):
            continue
        acts[b.get("sec_id") or b["id"]].append((e["type"], a["label"], e.get("source_url"), "anti-ESG" in (a.get("org_type") or "")))

    commitments = load("commitments.json")["commitments"] if (DATA / "commitments.json").exists() else []
    commit_by_prop = defaultdict(list)
    for c in commitments:
        if c.get("related_proposal_id"):
            commit_by_prop[c["related_proposal_id"]].append(c)

    camps = {}
    for p in sorted(P, key=lambda p: (p["year"], p.get("meeting_date") or "")):
        key = f'{p["company"]}|{p.get("ask_id") or "other"}'
        c = camps.setdefault(key, {"id": key, "company": p["company"], "ask": p.get("ask_id"), "ask_label": asks.get(p.get("ask_id"), p.get("topic")),
                                   "states": [], "proposals": [], "filers": set(), "critical_only": True})
        c["proposals"].append(p["id"])
        a = acts.get(p["id"], [])
        leads = [o for t, o, u, x in a if t in ("lead filer", "filed (named in proxy)")]
        cos = [o for t, o, u, x in a if t in ("co-filer", "coordinated by")]
        critical = any(x for t, o, u, x in a if t in ("lead filer", "filed (named in proxy)"))
        if not critical:
            c["critical_only"] = False
        c["filers"].update(leads + cos)
        when = p.get("meeting_date") or str(p["year"])
        base = {"proposal_id": p["id"], "title": p["title"], "critical": critical}
        # A withdrawn or excluded proposal never reached the proxy: cite the record of the filing itself.
        filed_src = (p.get("proponent_source_url") or p.get("status_source_url") or p.get("source_url") or p.get("proxy_url")) if p["status"] in ("withdrawn", "excluded") else (p.get("proxy_url") or p.get("source_url") or p.get("proponent_source_url"))
        c["states"].append({**base, "date": str(p["year"]), "precision": "year", "state": "filed",
                            "label": "Filed", "by": list(dict.fromkeys(leads))[:3], "co_filers": len(set(cos)), "source_url": filed_src})
        # One step per PX14A6G filing (several organizations can sign one), for or against the proposal; after an
        # exclusion there is no vote on it, so a filing then is an escalation step.
        sol = {}
        for t, o, u, x in a:
            if t.startswith("exempt solicitation"):
                s = sol.setdefault((u, t.endswith("against")), [])
                if o not in s:
                    s.append(o)
        for (u, against), orgs in sol.items():
            if p["status"] == "excluded":
                c["states"].append({**base, "date": ESCALATION.get(u, {}).get("date", str(p["year"])), "precision": "month" if u in ESCALATION else "year", "state": "escalation",
                                    "label": ESCALATION.get(u, {}).get("label", "Exempt solicitation after the exclusion"), "by": orgs[:4], "more": max(0, len(orgs) - 4), "source_url": u})
            else:
                c["states"].append({**base, "date": when, "precision": "before meeting", "state": "campaign",
                                    "label": "Exempt solicitation against the proposal" if against else "Exempt solicitation for the proposal", "by": orgs[:4], "more": max(0, len(orgs) - 4), "source_url": u})
        st, reason = p["status"], (p.get("status_reason") or "")
        if st == "voted":
            c["states"].append({**base, "date": when, "precision": "day" if p.get("meeting_date") else "year", "state": "voted", "label": "Voted",
                                "support": p.get("support_pct"), "source_url": p.get("results_url")})
        elif st == "withdrawn":
            commit = any(w in reason.lower() for w in COMMIT_WORDS)
            c["states"].append({**base, "date": str(p["year"]), "precision": "year", "state": "withdrawn_commitment" if commit else "withdrawn",
                                "label": "Withdrawn after a company commitment" if commit else "Withdrawn", "detail": reason,
                                "source_url": p.get("status_source_url") or p.get("source_url") or filed_src})
        elif st == "excluded":
            c["states"].append({**base, "date": str(p["year"]), "precision": "year", "state": "excluded", "label": "Excluded by the company",
                                "detail": reason, "source_url": p.get("status_source_url") or p.get("source_url") or filed_src})
        elif st == "upcoming":
            c["states"].append({**base, "date": when, "precision": "day", "state": "upcoming", "label": "On the ballot", "source_url": p.get("proxy_url")})
        for cm in commit_by_prop.get(p["id"], []):
            ev = sorted(cm.get("evidence", []), key=lambda e: str(e.get("date") or ""))
            if ev:
                label = {"delivered": "Commitment delivered", "partial": "Commitment partly delivered"}.get(cm["status"], "Commitment: " + cm["status"])
                c["states"].append({**base, "date": ev[0].get("date") or str(p["year"]), "precision": {10: "day", 7: "month"}.get(len(str(ev[0].get("date") or "")), "year"),
                                    "state": "delivery", "label": label, "detail": "Evidence in the commitments ledger below.", "source_url": ev[0].get("url")})

    order = {"filed": 0, "campaign": 1, "upcoming": 2, "voted": 3, "withdrawn": 3, "withdrawn_commitment": 3, "excluded": 3, "escalation": 4, "delivery": 5}
    out = []
    for c in camps.values():
        c["states"].sort(key=lambda s: (str(s["date"])[:4], order[s["state"]], str(s["date"])))
        kinds = {s["state"] for s in c["states"]}
        ledger = [cm for pid in c["proposals"] for cm in commit_by_prop.get(pid, [])]
        stage = 1
        basis = "a filing"
        if "withdrawn_commitment" in kinds or ledger:
            stage, basis = 3, "a withdrawal after a company commitment"
        if any(cm.get("status") == "delivered" for cm in ledger):
            stage, basis = 4, "the company's own report of delivery"
        votes = [s["support"] for s in c["states"] if s["state"] == "voted" and s.get("support") is not None and not s["critical"]]
        out.append({**{k: v for k, v in c.items() if k not in ("filers",)}, "stage": stage, "stage_label": STAGES[stage - 1], "stage_basis": basis,
                    "filer_count": len(c["filers"]), "filings": len(c["proposals"]), "votes": len(votes),
                    "best_support": max(votes) if votes else None, "ledger_ids": [cm["id"] for cm in ledger]})

    # Engagement steps reported at the company level (not tied to one ask), from the scorecard's Parnassus timeline.
    reported = []
    for t in load("scorecard.json").get("parnassus_timeline", []):
        tic = by_name.get(str(t.get("company", "")).lower())
        if not tic:
            continue
        reported.append({"company": tic, "date": t["date"], "title": t["title"], "summary": t.get("summary"), "source_url": t.get("source_url"),
                         "source_page": t.get("source_page"), "reported_by": "Parnassus Investments", "kind": "reported by the investor"})

    # Engagement outside proposals, per company: reported steps (company engaged), ledger commitments not tied to a
    # proposal (commitment made) and their delivery (commitment delivered, from the company's own documents).
    withdrawn_commit_cos = {c["company"] for c in out if any(s["state"] == "withdrawn_commitment" for s in c["states"])}
    reported = [r for r in reported if not (r["company"] in withdrawn_commit_cos and " agrees " in f' {r["title"].lower()} ')]
    outside = {}
    for tic in sorted({r["company"] for r in reported} | {cm["company"] for cm in commitments if not cm.get("related_proposal_id")}):
        loose = [cm for cm in commitments if cm["company"] == tic and not cm.get("related_proposal_id") and cm.get("is_commitment", True)]
        stage, basis = 2, "steps an investor reports"
        if loose:
            stage, basis = 3, "a commitment in the ledger"
        if any(cm.get("status") == "delivered" for cm in loose):
            stage, basis = 4, "the company's own report of delivery (ledger)"
        outside[tic] = {"stage": stage, "stage_label": STAGES[stage - 1], "stage_basis": basis, "reported": sum(1 for r in reported if r["company"] == tic), "commitments": [cm["id"] for cm in loose]}

    # Outcome summary across all campaigns, from filings not lead-filed by filers critical of ESG.
    pro = [p for p in P if not any(x for t, o, u, x in acts.get(p["id"], []) if t in ("lead filer", "filed (named in proxy)"))]
    st = Counter(p["status"] for p in pro)
    wc = [p for p in pro if p["status"] == "withdrawn" and any(w in (p.get("status_reason") or "").lower() for w in COMMIT_WORDS)]
    seasons = sorted({p["year"] for p in pro})
    metrics = {
        "basis": "AI proposals at the companies tracked, leaving out those lead-filed by filers critical of ESG",
        "filings": len(pro), "voted": st["voted"], "upcoming": st["upcoming"], "excluded": st["excluded"],
        "withdrawn_with_commitment": len(wc), "withdrawn_other": st["withdrawn"] - len(wc),
        "conceded": [{"proposal_id": p["id"], "company": p["company"], "company_name": next((c["name"] for c in companies if c.get("ticker") == p["company"]), p["company"]),
                      "what": next((cm["promised"] for cm in commitments if cm.get("related_proposal_id") == p["id"]), (p.get("status_reason") or "").split(". ")[0]),
                      "source_url": p.get("status_source_url") or p.get("source_url")} for p in wc],
        "by_season": {str(y): dict(Counter(p["status"] for p in pro if p["year"] == y)) for y in seasons},
        "campaigns": len(out), "campaigns_by_stage": {STAGES[i]: sum(1 for c in out if c["stage"] == i + 1 and not c["critical_only"]) for i in range(4)},
        "outside_by_stage": {STAGES[i]: sum(1 for o in outside.values() if o["stage"] == i + 1) for i in range(4)},
    }
    res = {
        "about": "Each AI shareholder campaign (one ask at one company) as dated states with sources, a milestone stage, engagement steps investors report at the company level, an outcome summary and the commitments ledger. Built by scripts/build_campaigns.py from data/proposals.json, data/graph.json, data/scorecard.json and data/commitments.json.",
        "stages": STAGES, "campaigns": sorted(out, key=lambda c: (c["company"], c["ask"] or "")), "reported": reported, "outside": outside,
        "metrics": metrics, "commitments": commitments, "commitment_statuses": (load("commitments.json").get("statuses") if (DATA / "commitments.json").exists() else {}),
        "field_context": load("field_context.json")["items"] if (DATA / "field_context.json").exists() else [],
        "not_recorded": "Private dialogue that no party has published, AGM questions and divestments are not in these records yet; votes against directors appear only where an exempt solicitation asked for them.",
    }
    (DATA / "campaigns.json").write_text(json.dumps(res, indent=1, ensure_ascii=False) + "\n")
    print(f"campaigns.json: {len(out)} campaigns, {len(reported)} reported steps, {len(commitments)} commitments; stages {metrics['campaigns_by_stage']}")


if __name__ == "__main__":
    main()

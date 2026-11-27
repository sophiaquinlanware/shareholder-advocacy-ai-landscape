"""Leverage on each frontier lab: which listed companies can bring pressure to bear on it, through what, how strong
each tie is, whether shareholders can reach that company, and who already holds it. Writes data/lab_leverage.json.

Inputs, all sourced elsewhere on the site: data/pathways.json (labs, listed companies and their ties to each lab,
each with a type, a 1-3 strength and the reason, an as-of date and a source), data/companies.json (shareholder
route, next proposal deadline), data/proposals.json (AI proposals filed), data/holdings.json (reported holders),
data/graph.json (investors' org types).

Ordering, stated on the page: a lab that is itself listed comes first (shareholders reach it directly), then
companies by their strongest tie, then by how many kinds of tie they have, then whether the shareholder route
is open. This orders what the records show; it is not a forecast of influence and not a recommendation.
"""

import json
from collections import defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
load = lambda f: json.loads((DATA / f).read_text())
STRENGTH = {3: "strong", 2: "medium", 1: "weak"}
ROUTE_RANK = {"open": 0, "narrowing": 1}


def main():
    pw = load("pathways.json")
    companies = {c["ticker"]: c for c in load("companies.json") if c.get("ticker")}
    proposals = load("proposals.json")["proposals"]
    hold = load("holdings.json")
    investors = {i["id"]: i for i in hold.get("investors", [])}
    pub = {c["id"]: c for c in pw["public_companies"]}
    holders = defaultdict(list)
    for h in hold.get("holdings", []):
        holders[h["company"]].append(h)
    filed = defaultdict(int)
    for p in proposals:
        filed[p["company"]] += 1

    def company_block(tkr):
        c = companies.get(tkr, {})
        hs = sorted(holders.get(tkr, []), key=lambda h: -(h.get("value_usd") or 0))
        return {"ticker": tkr, "name": c.get("name") or tkr,
                "route": c.get("route_status"), "route_reason": c.get("route_status_reason"),
                "shareholder_route": c.get("shareholder_route"),
                "next_deadline": c.get("next_proposal_deadline"), "next_deadline_source": c.get("next_proposal_deadline_source"),
                "next_deadline_status": c.get("next_proposal_deadline_status"),
                "how_to_file": (c.get("bylaw") or {}).get("text"), "how_to_file_source": (c.get("bylaw") or {}).get("url"),
                "threshold": (c.get("threshold") or {}).get("text"), "control": (c.get("control") or {}).get("text"),
                "control_source": (c.get("control") or {}).get("url"),
                "ai_proposals_filed": filed.get(tkr, 0),
                "holders": [{"id": h["investor"], "name": investors.get(h["investor"], {}).get("name", h["investor"]),
                             "value_usd": h.get("value_usd"), "source_url": h.get("source_url")} for h in hs[:6]],
                "holders_count": len(hs)}

    labs = []
    for lab in pw["labs"]:
        routes = defaultdict(list)
        for t in pw["ties"]:
            if t["to"] == lab["id"] and t["from"] in pub:
                routes[pub[t["from"]]["ticker"]].append({"type": t["type"], "description": t.get("description"), "strength": t.get("strength"),
                                                        "strength_label": STRENGTH.get(t.get("strength")), "strength_reason": t.get("strength_reason"),
                                                        "as_of": t.get("as_of"), "source_url": t.get("source_url")})
        rows = []
        # The lab itself, when it is listed (Anthropic), or its listed parent (xAI in SpaceX; in-house labs).
        direct = None
        if lab.get("status") == "public":
            direct = next((t for t, c in companies.items() if c.get("name", "").lower() == lab["name"].lower()), None)
        elif lab.get("parent") and lab["parent"] in pub:
            direct = pub[lab["parent"]]["ticker"]
        if direct and direct in companies:
            rows.append({**company_block(direct), "direct": True,
                         "direct_note": "The lab itself is listed" if lab.get("status") == "public" else "The lab is part of this listed company",
                         "levers": routes.pop(direct, [])})
        for tkr, levers in routes.items():
            if tkr not in companies:
                continue
            levers.sort(key=lambda l: -(l["strength"] or 0))
            rows.append({**company_block(tkr), "direct": False, "levers": levers})
        rows.sort(key=lambda r: (not r["direct"], -max([l["strength"] or 0 for l in r["levers"]] or [0]),
                                 -len({l["type"] for l in r["levers"]}), ROUTE_RANK.get(r["route"], 2)))
        labs.append({"id": lab["id"], "name": lab["name"], "status": lab.get("status"), "parent": lab.get("parent"),
                     "description": lab.get("description"), "source_url": lab.get("source_url"),
                     "routes": rows, "strong_routes": sum(1 for r in rows if any((l["strength"] or 0) >= 3 for l in r["levers"]))})
    labs.sort(key=lambda l: (l["status"] != "public", -l["strong_routes"], l["name"]))
    out = {"about": "Listed companies with sourced ties to each frontier lab, how strong each tie is (this site's 1-3 rating with its reason, from data/pathways.json), "
                    "whether shareholders can reach the company, and its reported holders. Ordered by what the records show (a listed lab first, then the strongest "
                    "ties); not a forecast of influence and not a recommendation.",
           "as_of": pw.get("meta", {}).get("compiled"), "holdings_as_of": hold.get("as_of_quarter"), "labs": labs}
    (DATA / "lab_leverage.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(f"lab_leverage.json: {len(labs)} labs; " + ", ".join(f"{l['name']} {len(l['routes'])}" for l in labs))


if __name__ == "__main__":
    main()

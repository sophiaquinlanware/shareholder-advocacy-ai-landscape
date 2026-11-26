"""Builds the derived parts of data/value_chain.json: cross-tier ties and per-tier facts.

The tier list and each company's tier are set by hand in data/companies.json and
data/value_chain.json (this site's classification, stated in its "about" key). Everything
else here is worked out from sourced data, so it updates whenever those files change:

  ties      sourced company-to-company links across the value chain
            (data/value_chain_ties.json, each with a source URL), plus company-to-lab
            ties from data/pathways.json
  per_tier  for each tier:
            - labs reachable directly (a tier company has a sourced tie to the lab) and in
              two steps (a tier company is tied to a company that is tied to the lab)
            - AI proposals at companies in the tier, with topics and median support
            - the asks investors have already made there (proposal titles, with sources)
            - companies included for an investor engagement or a safety commitment
            - fund-vote rows on those proposals
            - the shareholder-route mix
            - organizations that filed or co-filed there, their coalitions, and people
              who lead engagement at them

Nothing here is a recommendation: it describes where engagement has happened and what is
connected to what.
"""

import json
import statistics
from collections import Counter, defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"


def load(name, default):
    p = DATA / name
    return json.loads(p.read_text()) if p.exists() else default


def main():
    companies = load("companies.json", [])
    vc = load("value_chain.json", {})
    ties_in = load("value_chain_ties.json", {}).get("ties", [])
    pathways = load("pathways.json", {})
    proposals = load("proposals.json", {}).get("proposals", [])
    fund_votes = load("fund_votes.json", {}).get("summary", [])
    graph = load("graph.json", {"nodes": [], "edges": []})

    by_name = {c["name"].lower(): c for c in companies}
    by_ticker = {(c.get("ticker") or "").upper(): c for c in companies if c.get("ticker")}
    tier_of = {c["id"]: c.get("tier") for c in companies}

    def find(name_or_ticker):
        k = (name_or_ticker or "").strip()
        return by_name.get(k.lower()) or by_ticker.get(k.upper())

    # 1. Cross-tier ties (sourced), keyed by companies.json ids.
    ties = []
    for t in ties_in:
        a, b = find(t["from"]), find(t["to"])
        if not a or not b:
            continue
        ties.append({"from": a["id"], "to": b["id"], "type": t["type"], "description": t["description"],
                     "as_of": t.get("as_of"), "source_url": t["source_url"], "source_kind": t.get("source_kind", "primary")})

    # Company-to-lab ties from pathways.json (company ticker -> lab id).
    pw_company = {c["id"]: (c.get("ticker") or "").split("/")[-1].strip().upper() for c in pathways.get("public_companies", [])}
    lab_name = {l["id"]: l["name"] for l in pathways.get("labs", [])}
    labs_of = defaultdict(set)  # companies.json id -> lab ids
    for t in pathways.get("ties", []):
        c = by_ticker.get(pw_company.get(t["from"], ""))
        if c:
            labs_of[c["id"]].add(t["to"])

    # A tie pointing at a frontier-lab company (e.g. power supplied to OpenAI's data center) is direct reach too.
    lab_company = {c["id"]: c["name"] for c in companies if c.get("tier") == "labs"}
    for t in ties:
        if t["to"] in lab_company:
            labs_of[t["from"]].add("company:" + t["to"])
    for cid, name in lab_company.items():
        lab_name["company:" + cid] = name

    # Two-step reach follows the direction of the tie: a supplier X reaches the labs its customer Y is tied to
    # (X -> Y -> lab). Being a customer of a supplier is not a route to that supplier's investees.
    downstream = defaultdict(list)
    for t in ties:
        downstream[t["from"]].append(t)

    # Who files where, from the shared graph.
    node = {n["id"]: n for n in graph["nodes"]}
    filers_at = defaultdict(Counter)  # company ticker -> Counter(org id)
    for e in graph["edges"]:
        s, t = node.get(e["source"]), node.get(e["target"])
        if s and t and s["type"] in ("investor", "coalition") and t["type"] == "proposal" and t.get("company"):
            filers_at[t["company"].upper()][s["id"]] += 1
    member_of = defaultdict(set)
    works_at = defaultdict(list)
    for e in graph["edges"]:
        if e["type"] == "member of":
            member_of[e["source"]].add(e["target"])
        if e["type"] == "works at":
            works_at[e["target"]].append(e["source"])

    per_tier = {}
    for tier in vc.get("tiers", []):
        # All companies in the tier (primary or secondary), so e.g. Meta and Oracle count under data centers.
        ids = sorted(c["id"] for c in companies if tier["id"] in (c.get("tiers") or [c.get("tier")]))
        cos = [c for c in companies if c["id"] in ids]
        tickers = {(c.get("ticker") or "").upper() for c in cos}
        direct = set().union(*[labs_of[i] for i in ids]) if ids else set()
        # Companies in the "labs" tier are labs themselves; reach counts the labs they are.
        def norm(l):  # the same lab can appear as a pathways lab id and as a labs-tier company
            return (lab_name.get(l, l) or "").lower().split(" (")[0]
        direct_names = {norm(l) for l in direct}
        routes = {}
        for i in ids:
            for t in downstream[i]:
                for l in labs_of[t["to"]]:
                    if norm(l) in direct_names or t["to"] in ids:
                        continue
                    routes.setdefault(lab_name.get(l, l), []).append(
                        {"from": i, "via": t["to"], "tie": t["type"], "source_url": t["source_url"]})
        props = [p for p in proposals if (p.get("company") or "").upper() in tickers]
        supports = [p["support_pct"] for p in props if isinstance(p.get("support_pct"), (int, float))]
        prop_ids = {p["id"] for p in props}
        orgs = Counter()
        for t in tickers:
            orgs.update(filers_at[t])
        coalitions = Counter()
        for o in orgs:
            coalitions.update(member_of[o])
        people = sorted({p for o in orgs for p in works_at[o]})
        per_tier[tier["id"]] = {
            "scope": "all companies in this tier, primary or secondary",
            "companies": len(ids),
            "companies_primary": sum(1 for c in cos if c.get("tier") == tier["id"]),
            "labs_reached_directly": sorted({lab_name.get(l, l) for l in direct}),
            "labs_reached_in_two_steps": [{"lab": lab, "routes": sorted(r, key=lambda x: (x["from"], x["via"]))}
                                          for lab, r in sorted(routes.items())],
            "ties_from_tier": sum(1 for t in ties if t["from"] in ids),
            "ties_into_tier": sum(1 for t in ties if t["to"] in ids),
            "ai_proposals": len(props),
            "proposal_topics": dict(sorted(Counter(p.get("topic") or "Other" for p in props).items(), key=lambda x: (-x[1], x[0]))),
            "median_support_pct": round(statistics.median(supports), 1) if supports else None,
            "asks_made": [{"company": p["company"], "year": p.get("year"), "title": p["title"],
                           "url": p.get("proxy_url")} for p in sorted(props, key=lambda p: (-(p.get("year") or 0), p["company"]))][:12],
            "investor_engagements": [c["id"] for c in sorted(cos, key=lambda c: c["id"]) if c.get("basis_type") == "investor engagement"],
            "safety_commitments": [c["id"] for c in sorted(cos, key=lambda c: c["id"]) if c.get("basis_type") == "safety commitment"],
            "fund_vote_rows": sum(1 for r in fund_votes if r.get("proposal_id") in prop_ids),
            "shareholder_routes": dict(sorted(Counter(c.get("shareholder_route") or "not determined" for c in cos).items())),
            "active_filers": [{"id": o, "name": node[o]["label"], "proposals": n} for o, n in sorted(orgs.items(), key=lambda x: (-x[1], x[0]))[:12] if o in node],
            "coalitions": [{"id": c, "name": node[c]["label"], "members_active_here": n} for c, n in sorted(coalitions.items(), key=lambda x: (-x[1], x[0])) if c in node],
            "people": [{"id": p, "name": node[p]["label"], "org": node[p].get("org_name")} for p in people if p in node],
        }

    vc["ties"] = ties
    vc["per_tier"] = per_tier
    vc["derived_note"] = ("ties come from data/value_chain_ties.json and data/pathways.json, each with a source; per_tier is "
                          "computed by scripts/build_value_chain.py from the site's data files and describes where engagement "
                          "has happened and what is connected. It is not a recommendation.")
    (DATA / "value_chain.json").write_text(json.dumps(vc, indent=1, ensure_ascii=False) + "\n")
    print(f"value_chain.json: {len(ties)} ties")
    for t in vc.get("tiers", []):
        p = per_tier[t["id"]]
        print(f"  {t['label']}: {p['companies']} companies, {len(p['labs_reached_directly'])} labs direct, "
              f"{len(p['labs_reached_in_two_steps'])} two-step, {p['ai_proposals']} proposals, {len(p['active_filers'])} filers")


if __name__ == "__main__":
    main()

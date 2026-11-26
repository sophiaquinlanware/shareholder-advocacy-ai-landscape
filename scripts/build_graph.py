"""Builds data/graph.json, the single relationship store every tab reads from.

Think of it like an Obsidian vault: every company, lab, fund, advocacy group, person,
proposal, policy and company response is a "node", and every relationship between them
is an "edge" with a type and a source link. Add a fact to any input file, run this
script, and it appears everywhere on the site it is relevant.

Inputs (all in data/):
  network.json    organizations, proposals, filer and coalition edges
  people.json     engagement leads and their professional ties
  pathways.json   public companies, frontier labs, and the ties between them
  holdings.json   which investors hold which companies (SEC Form 13F)
  causality.json  policies, company responses, public engagement, and what led to what
  proposals.json  proposal details and vote results (merged onto proposal nodes)

Derived automatically (no extra research needed):
  "co-filed with"  between two organizations that filed or co-filed the same proposal
  "proposal at"    from each proposal to its company
"""

import json
from collections import defaultdict
from itertools import combinations
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"

TICKER_NAME = {"MSFT": "Microsoft", "GOOGL": "Alphabet", "META": "Meta", "AMZN": "Amazon",
               "NVDA": "Nvidia", "AAPL": "Apple", "TSLA": "Tesla"}


def load(name):
    p = DATA / name
    return json.loads(p.read_text()) if p.exists() else {}


def main():
    nodes, edges = {}, []

    def node(id_, **kw):
        if id_ not in nodes:
            nodes[id_] = {"id": id_, **kw}
        else:
            for k, v in kw.items():
                if v not in (None, "", []) and not nodes[id_].get(k):
                    nodes[id_][k] = v
        return nodes[id_]

    def edge(a, b, type_, layer, source_url=None, **kw):
        edges.append({"source": a, "target": b, "type": type_, "layer": layer, "source_url": source_url, **kw})

    # Companies first, so every layer below can point at the same company node.
    pw = load("pathways.json")
    for c in pw.get("public_companies", []):
        node("co-" + c.get("ticker", c["id"]).upper(), type="company", layer="companies", label=c["name"],
             ticker=c.get("ticker"), exchange=c.get("exchange"), country=c.get("country"))
    for t, name in TICKER_NAME.items():
        node("co-" + t, type="company", layer="companies", label=name, ticker=t)
    company_id = {c["id"]: "co-" + c.get("ticker", c["id"]).upper() for c in pw.get("public_companies", [])}

    for lab in pw.get("labs", []):
        node("lab-" + lab["id"], type="lab", layer="companies", label=lab["name"], status=lab.get("status"),
             description=lab.get("description"), source_url=lab.get("source_url"))
    for t in pw.get("ties", []):
        a = company_id.get(t["from"], "co-" + t["from"].upper())
        if a in nodes and "lab-" + t["to"] in nodes:
            edge(a, "lab-" + t["to"], t["type"], "companies", t.get("source_url"),
                 description=t.get("description"), strength=t.get("strength"), as_of=t.get("as_of"))

    # Investors, advocacy groups and coalitions.
    net = load("network.json")
    for o in net.get("organizations", []):
        node(o["id"], type="coalition" if o.get("type") == "coalition" else "investor", layer="investors",
             label=o["name"], org_type=o.get("type"), description=o.get("description"),
             website=o.get("website"), source_url=o.get("source_url"))

    # Proposals, with vote details merged in from proposals.json where the ids match.
    details = {p.get("id"): p for p in load("proposals.json").get("proposals", []) if p.get("id")}
    for p in net.get("proposals", []):
        d = {**p, **{k: v for k, v in details.get(p["id"], {}).items() if v not in (None, "")}}
        co = "co-" + p["company"].upper()
        node(co, type="company", layer="companies", label=TICKER_NAME.get(p["company"], p["company"]), ticker=p["company"])
        node(p["id"], type="proposal", layer="proposals", label=f'{TICKER_NAME.get(p["company"], p["company"])} {p.get("year")}: {p.get("title")}',
             company=p["company"], year=p.get("year"), topic=d.get("topic"), subtopic=d.get("subtopic"),
             status=d.get("status"), support_pct=d.get("support_pct"), source_url=d.get("source_url"))
        edge(p["id"], co, "proposal at", "proposals", d.get("source_url"))

    filers = defaultdict(set)
    for e in net.get("edges", []):
        if e["from"] in nodes and e["to"] in nodes:
            layer = "investors" if e["relation"] == "member of" else "proposals"
            edge(e["from"], e["to"], e["relation"], layer, e.get("source_url"))
            if e["relation"] in ("lead filer", "co-filer", "exempt solicitation"):
                filers[e["to"]].add(e["from"])

    # Derived: organizations that worked on the same proposal are connected.
    pairs = defaultdict(list)
    for prop, orgs in filers.items():
        for a, b in combinations(sorted(orgs), 2):
            pairs[(a, b)].append(prop)
    for (a, b), props in pairs.items():
        edge(a, b, "co-filed with", "investors", None, derived=True, weight=len(props), proposals=props)

    # People and their professional ties.
    ppl = load("people.json")
    for pp in ppl.get("people", []):
        pid = "person-" + pp["id"]
        node(pid, type="person", layer="people", label=pp["name"], title=pp.get("title"), org_name=pp.get("org_name"),
             ai_focus=pp.get("ai_focus"), source_url=pp.get("profile_url"), verified=pp.get("verified_date"))
        if pp.get("org_id") in nodes:
            edge(pid, pp["org_id"], "works at", "people", pp.get("profile_url"))
    for r in ppl.get("relations", []):
        a = "person-" + r["from"]
        b = r["to"] if r["to"] in nodes else "person-" + r["to"]
        if a in nodes and b in nodes:
            edge(a, b, r["type"], "people", r.get("source_url"), context=r.get("context"))

    # Holdings: which investors own which companies (portfolio layer).
    h = load("holdings.json")
    inv_ids = {i["id"] for i in h.get("investors", [])}
    for i in h.get("investors", []):
        node(i["id"], type="investor", layer="investors", label=i["name"], source_url=i.get("filing_url"))
    for x in h.get("holdings", []):
        co = "co-" + x["company"].upper()
        if x["investor"] in inv_ids and co in nodes:
            edge(x["investor"], co, "holds shares in", "companies", x.get("source_url"),
                 value_usd=x.get("value_usd"), pct_of_portfolio=x.get("pct_of_portfolio"))

    # Policy, responses and the public: events, and what led to what.
    cz = load("causality.json")
    for ev in cz.get("events", []):
        t = {"government": "policy", "public": "public"}.get(ev.get("lane"), "response")
        node("ev-" + ev["id"], type=t, layer="policy" if t != "public" else "public", label=ev["title"],
             date=ev.get("date"), lane=ev.get("lane"), kind=ev.get("kind"), actor=ev.get("actor"),
             jurisdiction=ev.get("jurisdiction"), description=ev.get("summary"), source_url=ev.get("source_url"))
    for l in cz.get("links", []):
        a, b = "ev-" + l["from"], "ev-" + l["to"]
        if a in nodes and b in nodes:
            edge(a, b, l["type"], "policy", l.get("source_url"), explanation=l.get("explanation"))

    # Degree, for sizing dots.
    deg = defaultdict(int)
    for e in edges:
        deg[e["source"]] += 1
        deg[e["target"]] += 1
    for n in nodes.values():
        n["degree"] = deg[n["id"]]

    out = {"nodes": list(nodes.values()), "edges": edges}
    (DATA / "graph.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    by_type = defaultdict(int)
    for n in nodes.values():
        by_type[n["type"]] += 1
    print(f"graph.json: {len(nodes)} nodes, {len(edges)} edges")
    print("  " + ", ".join(f"{k}: {v}" for k, v in sorted(by_type.items())))


if __name__ == "__main__":
    main()

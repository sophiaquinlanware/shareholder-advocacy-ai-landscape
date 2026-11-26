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
import re
from collections import defaultdict
from itertools import combinations
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"

TICKER_NAME = {"MSFT": "Microsoft", "GOOGL": "Alphabet", "META": "Meta", "AMZN": "Amazon",
               "NVDA": "Nvidia", "AAPL": "Apple", "TSLA": "Tesla"}


def load(name):
    p = DATA / name
    return json.loads(p.read_text()) if p.exists() else {}



STOP = {"the", "of", "on", "and", "for", "a", "an", "to", "in", "report", "ai", "inc", "llc", "lp", "asset", "management",
        "investments", "investment", "capital", "fund", "funds", "group", "office"}


def words(text):
    return {w for w in re.findall(r"[a-z0-9]+", (text or "").lower()) if w not in STOP and len(w) > 2}


def similar(a, b, cutoff=0.5):
    A, B = words(a), words(b)
    return bool(A and B) and len(A & B) / min(len(A), len(B)) >= cutoff


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
    # data/companies.json is the list of companies in scope, with sectors and shareholder route.
    # Listed companies are keyed by ticker (so filings and pathways join up); private or unverified
    # ones by their id, so none is silently left out.
    for c in load("companies.json") or []:
        listed = c.get("ticker") and c.get("ticker") not in ("private", "UNVERIFIED")
        if c.get("id") or listed:
            node("co-" + (c["ticker"].upper() if listed else c["id"]), type="company", layer="companies", label=c["name"],
                 ticker=c["ticker"] if listed else None,
                 sectors=c.get("sectors"), shareholder_route=c.get("shareholder_route"),
                 tier=c.get("tier"), tiers=c.get("tiers"),
                 basis_type=c.get("basis_type"), description=(c.get("engagement_basis") or {}).get("text"),
                 source_url=(c.get("engagement_basis") or {}).get("url"))
    pw = load("pathways.json")
    # Pathway-only companies (not in companies.json) still get a tier, so every company node has one.
    PATHWAY_TIERS = {"MU": "chips", "ASML": "chips", "INTC": "chips", "DELL": "chips", "SNOW": "deployers"}
    for c in pw.get("public_companies", []):
        c["ticker"] = c.get("ticker", c["id"]).split("/")[-1].strip()
        node("co-" + c["ticker"].upper(), tier=PATHWAY_TIERS.get(c["ticker"].upper()), type="company", layer="companies", label=c["name"],
             ticker=c.get("ticker"), exchange=c.get("exchange"), country=c.get("country"))
    for t, name in TICKER_NAME.items():
        node("co-" + t, type="company", layer="companies", label=name, ticker=t)
    company_id = {c["id"]: "co-" + c.get("ticker", c["id"]).upper() for c in pw.get("public_companies", [])}

    for lab in pw.get("labs", []):
        node("lab-" + lab["id"], type="lab", layer="companies", label=lab["name"], status=lab.get("status"), tier="labs",
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
        if pp.get("org_id"):
            org = pp["org_id"] if pp["org_id"] in nodes else next(
                (n["id"] for n in nodes.values() if n["type"] in ("investor", "coalition")
                 and similar(n["label"], pp.get("org_name") or "", 0.6)), pp["org_id"])
            node(org, type="investor", layer="investors", label=pp.get("org_name") or org)
            edge(pid, org, "works at", "people", pp.get("profile_url"))
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
    actors = [n for n in nodes.values() if n["type"] in ("company", "lab", "investor", "coalition")]
    for ev in cz.get("events", []):
        who = next((n for n in actors if similar(n["label"], ev.get("actor") or "", 0.6)), None)
        if who:
            edge(who["id"], "ev-" + ev["id"], "acted in", "policy", ev.get("source_url"))
    for l in cz.get("links", []):
        a, b = "ev-" + l["from"], "ev-" + l["to"]
        if a in nodes and b in nodes:
            edge(a, b, l["type"], "policy", l.get("source_url"), explanation=l.get("explanation"))

    # Proposals from the SEC research that the network file does not have yet.
    org_names = {n["id"]: n["label"].lower() for n in nodes.values() if n["type"] in ("investor", "coalition")}
    net_props = [n for n in nodes.values() if n["type"] == "proposal"]
    covered = set()  # network proposals already paired with an SEC record
    twin_of = {}  # proposals.json id -> network proposal id it was merged into
    for p in load("proposals.json").get("proposals", []):
        if p["id"] in nodes:
            continue
        cands = [n for n in net_props if n["id"] not in covered and n.get("company") == p["company"] and n.get("year") == p["year"]
                 and similar(n["label"].split(": ", 1)[-1], p["title"])]
        twin = max(cands, key=lambda n: len(words(n["label"]) & words(p["title"])), default=None)
        if twin:
            covered.add(twin["id"])
            twin_of[p["id"]] = twin["id"]
            # The SEC-based record is authoritative: support comes from the 8-K vote counts and the
            # topic tag must match the proposal feed, so both files always agree.
            for k in ("support_pct", "status", "subtopic", "topic"):
                if k in p:
                    twin[k] = p[k]
            twin["results_url"] = p.get("results_url")
            continue
        co = "co-" + p["company"].upper()
        node(co, type="company", layer="companies", label=TICKER_NAME.get(p["company"], p["company"]), ticker=p["company"])
        node(p["id"], type="proposal", layer="proposals", label=f'{TICKER_NAME.get(p["company"], p["company"])} {p["year"]}: {p["title"]}',
             company=p["company"], year=p["year"], topic=p.get("topic"), subtopic=p.get("subtopic"), status=p.get("status"),
             support_pct=p.get("support_pct"), proponent=p.get("proponent"), source_url=p.get("proxy_url"))
        edge(p["id"], co, "proposal at", "proposals", p.get("proxy_url"))
        prop = (p.get("proponent") or "").lower()
        for oid, name in org_names.items():
            core = name.replace(" asset management", "").replace(" investments", "").replace(", inc.", "")
            if len(core) > 3 and core in prop:
                edge(oid, p["id"], "filed (named in proxy)", "proposals", p.get("proxy_url"))
    for x in load("proposals.json").get("exempt_solicitations", []):
        filer = (x.get("filer") or "").lower()
        for oid, name in org_names.items():
            core = name.replace(" asset management", "").replace(" investments", "")
            if len(core) > 3 and core in filer:
                edge(oid, "co-" + (x.get("ticker") or "").upper(), "exempt solicitation " + (x.get("position") or "").lower(), "proposals", x.get("url"))

    # One canonical proposal list, so the feed and the graph always agree.
    # SEC vote details stay on the SEC records; proposals only the filer network found are added.
    pj = load("proposals.json")
    known = {p["id"] for p in pj.get("proposals", [])}
    twins_of = {}
    for p in pj.get("proposals", []):
        twins_of[p["id"]] = p
    merged_ids = set()
    for n in nodes.values():
        if n["type"] != "proposal" or n["id"] in known or n["id"] in covered:
            continue
        pj.setdefault("proposals", []).append({
            "id": n["id"], "company": n.get("company"), "year": n.get("year"),
            "title": n["label"].split(": ", 1)[-1], "topic": n.get("topic"), "subtopic": n.get("subtopic"),
            "status": n.get("status"), "support_pct": n.get("support_pct"), "proxy_url": n.get("source_url"),
            "source": "filer network research"})
        merged_ids.add(n["id"])
    if merged_ids:
        (DATA / "proposals.json").write_text(json.dumps(pj, indent=1, ensure_ascii=False) + "\n")
        print(f"  added {len(merged_ids)} proposals to proposals.json from the filer network")

    # Fields for the impact investor view, copied from proposals.json and companies.json
    # (vote history, filing deadlines, calls for co-filers) onto the matching graph nodes.
    PHASE2_FIELDS = ("vote_history", "filing_deadline", "filing_deadline_source", "seeking", "meeting_date",
                     "results_url", "support_note", "results_note", "status_reason", "status_source_url",
                     "plain_summary", "plain_summary_source", "plain_summary_note")
    # The SEC-based record (proposals.json) is authoritative for these, whatever the node's id.
    AUTHORITATIVE = ("support_pct", "status", "topic", "subtopic")
    pj_by_id = {p["id"]: p for p in load("proposals.json").get("proposals", [])}
    for pid, p in pj_by_id.items():
        target = nodes.get(pid) or nodes.get(twin_of.get(pid, ""))
        if target:
            for k in PHASE2_FIELDS:
                if p.get(k) not in (None, [], ""):
                    target[k] = p[k]
            for k in AUTHORITATIVE:
                if k in p:
                    target[k] = p[k]
    for c in load("companies.json") or []:
        key = "co-" + (c["ticker"].upper() if c.get("ticker") and c["ticker"] not in ("private", "UNVERIFIED") else c.get("id", ""))
        if key in nodes:
            for k in ("next_proposal_deadline", "next_proposal_deadline_source", "next_proposal_deadline_status", "next_proposal_deadline_quote", "next_proposal_deadline_note"):
                if c.get(k):
                    nodes[key][k] = c[k]

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

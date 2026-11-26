"""Parameters for the engagement scenario simulator (sim.js), estimated from this site's own data.

Every estimate keeps its counts (k of n) so the page can show how thin it is, and the model is
backtested: fitted on the 2023-2025 seasons, then asked about 2026, which it did not see.
Assumptions that the data cannot estimate come from published research, each with its source,
and are shown on the page as adjustable settings, never as facts.

Run after build_proposal_links.py and build_graph.py (the weekly job does this).
"""

import json
import math
import statistics as st
from collections import Counter, defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
load = lambda f: json.loads((DATA / f).read_text())

THRESHOLDS = [5, 15, 25]  # Rule 14a-8(i)(12), as in rules.js
LOOKBACK, RECENT = 5, 3

LITERATURE = [
    {"id": "lead_investor", "label": "A lead investor heading a coalition raises the chance of engagement success by about a third",
     "value": 1.33, "source_url": "https://www.ecgi.global/publications/working-papers/coordinated-engagements",
     "source": "Dimson, Karakaş and Li, Coordinated Engagements (working paper; forthcoming, Journal of Finance)",
     "applies_to": "company commitment"},
    {"id": "coalition_shape", "label": "Collaborative engagements average 1.4 lead and 21 supporting investors",
     "value": 1.4, "source_url": "https://www.ecgi.global/publications/working-papers/coordinated-engagements",
     "source": "Dimson, Karakaş and Li, Coordinated Engagements", "applies_to": "context only"},
]


def season_of(p):
    return p["year"]


def lockout(history, season):
    """True when Rule 14a-8(i)(12) would let the company exclude a refile in this season.
    history: list of (year, support) votes on the same subject at the same company."""
    v = sorted(h for h in history if h[1] is not None)
    if not v or season - v[-1][0] > RECENT:
        return False
    count = sum(1 for y, _ in v if season - LOOKBACK <= y < season)
    if not count:
        return False
    return v[-1][1] < THRESHOLDS[min(count, len(THRESHOLDS)) - 1]


def main():
    P = [p for p in load("proposals.json")["proposals"] if p.get("ask_id")]
    asks = load("asks.json")["asks"]
    companies = load("companies.json")
    graph = load("graph.json")
    nodes = {n["id"]: n for n in graph["nodes"]}
    us = [c for c in companies if c.get("shareholder_route") == "US proxy rules apply" and c.get("ticker")]
    tickers = {c["ticker"] for c in us}

    critical = set()
    acts = defaultdict(list)  # proposals.json id -> [(org, role)]
    for e in graph["edges"]:
        a, b = nodes.get(e["source"]), nodes.get(e["target"])
        if not a or not b or b["type"] != "proposal" or a["type"] not in ("investor", "coalition"):
            continue
        pid = b.get("sec_id") or b["id"]
        role = "lead" if e["type"] in ("lead filer", "filed (named in proxy)") else "co" if e["type"] in ("co-filer", "coordinated by") else None
        if role:
            acts[pid].append((a["id"], role))
            if role == "lead" and "anti-ESG" in (a.get("org_type") or ""):
                critical.add(pid)

    cells = defaultdict(lambda: defaultdict(list))
    for p in P:
        cells[(p["company"], p["ask_id"])][season_of(p)].append(p)
    seasons = sorted({season_of(p) for p in P})

    def estimates(upto):
        """Estimate the model from seasons <= upto."""
        ref_k = ref_n = 0
        deltas = []
        logr = []
        new_by = {}
        filed_cells = defaultdict(set)
        for (co, ask), by in cells.items():
            ys = sorted(y for y in by if y <= upto)
            for y in ys:
                filed_cells[y].add((co, ask))
            hist = lambda before: [(yy, max((x["support_pct"] for x in by[yy] if x.get("support_pct") is not None), default=None)) for yy in by if yy < before]
            for y in ys:
                # Refile rate among pairs the resubmission rule would not block the next season.
                if y + 1 <= upto and not lockout(hist(y + 1), y + 1):
                    ref_n += 1
                    ref_k += (y + 1) in by
            for a, b in zip(ys, ys[1:]):
                sa = [x["support_pct"] for x in by[a] if x.get("support_pct") is not None and x["id"] not in critical]
                sb = [x["support_pct"] for x in by[b] if x.get("support_pct") is not None and x["id"] not in critical]
                if sa and sb:
                    deltas.append(max(sb) - max(sa))
                    if max(sa) > 0 and max(sb) > 0:
                        logr.append(math.log(max(sb) / max(sa)))
        seen = set()
        for y in [s for s in seasons if s <= upto]:
            new_by[y] = len(filed_cells[y] - seen)
            seen |= filed_cells[y]
        first = min(new_by) if new_by else None
        later = [v for y, v in new_by.items() if y != first]
        filed = [p for p in P if season_of(p) <= upto and p["status"] in ("voted", "withdrawn", "excluded")]
        # A company commitment: withdrawn because the company agreed to act (the reason says so).
        commits = [p for p in filed if p["status"] == "withdrawn" and any(w in (p.get("status_reason") or "").lower() for w in (" committed to", "negotiated agreement", " agreed to"))]
        excluded = [p for p in filed if p["status"] == "excluded"]
        # First filing of an ask at a company vs a refile: in this data every commitment came on a first filing.
        first_season = {}
        for (co, ask), by in cells.items():
            ys = [y for y in by if y <= upto]
            if ys:
                for x in by[min(ys)]:
                    first_season[x["id"]] = True
        f_all = [p for p in filed if first_season.get(p["id"])]
        r_all = [p for p in filed if not first_season.get(p["id"])]
        return {
            "refile": {"k": ref_k, "n": ref_n},
            "support_delta": {"n": len(deltas), "mean": round(st.mean(deltas), 2) if deltas else 0, "sd": round(st.pstdev(deltas), 2) if len(deltas) > 1 else 8.0,
                              "log_sd": round(st.pstdev(logr), 3) if len(logr) > 1 else 0.5},
            "new_cells_by_season": new_by,
            "new_cells_per_season": round(st.mean(later), 2) if later else None,
            "commitment": {"k": len(commits), "n": len(filed), "ids": [p["id"] for p in commits]},
            "commitment_first": {"k": sum(1 for p in commits if first_season.get(p["id"])), "n": len(f_all)},
            "commitment_refile": {"k": sum(1 for p in commits if not first_season.get(p["id"])), "n": len(r_all)},
            "exclusion": {"k": len(excluded), "n": len(filed)},
        }

    def ask_support(upto):
        out = {}
        for a in asks:
            v = [p["support_pct"] for p in P if p["ask_id"] == a["id"] and p.get("support_pct") is not None and season_of(p) <= upto and p["id"] not in critical]
            out[a["id"]] = {"n": len(v), "median": round(st.median(v), 2) if v else None, "sd": round(st.pstdev(v), 2) if len(v) > 1 else None,
                            "values": sorted(round(x, 2) for x in v)}
        return out

    est = estimates(max(seasons))

    role = {c["ticker"]: c.get("tier") for c in us}
    filed_in = defaultdict(set)  # season -> {(company, ask)}
    for (co, ask), by in cells.items():
        for y in by:
            filed_in[y].add((co, ask))
    exp_k = exp_n = un_k = un_n = 0
    for y in seasons[1:]:
        before = set().union(*(filed_in[s] for s in seasons if s < y))
        for co in tickers:
            for a in [x["id"] for x in asks]:
                if (co, a) in before:
                    continue
                exposed = any(a2 == a and c2 != co and role.get(c2) == role.get(co) for c2, a2 in filed_in[y - 1])
                hit = (co, a) in filed_in[y]
                if exposed:
                    exp_n += 1; exp_k += hit
                else:
                    un_n += 1; un_k += hit
    est["new_pair_exposed"] = {"k": exp_k, "n": exp_n, "label": "same ask filed at a same-role company the season before"}
    est["new_pair_unexposed"] = {"k": un_k, "n": un_n, "label": "not filed at a same-role company the season before"}

    # Backtest: fit on seasons before the last full one, then ask the model about that season.
    test = max(seasons)
    fit = estimates(test - 1)
    p_ref = (fit["refile"]["k"] + 1) / (fit["refile"]["n"] + 2)
    prev = {k for k, by in cells.items() if (test - 1) in by}
    eligible = [k for k in prev if not lockout([(y, max((x["support_pct"] for x in cells[k][y] if x.get("support_pct") is not None), default=None)) for y in cells[k] if y < test], test)]
    actual_refiled = sum(1 for k in prev if test in cells[k])
    actual_new = sum(1 for k, by in cells.items() if test in by and min(by) == test)
    abs_naive, abs_model = [], []
    for k in prev:
        if test not in cells[k]:
            continue
        last = [x["support_pct"] for x in cells[k][test - 1] if x.get("support_pct") is not None and x["id"] not in critical]
        now = [x["support_pct"] for x in cells[k][test] if x.get("support_pct") is not None and x["id"] not in critical]
        if last and now:
            abs_naive.append(abs(max(now) - max(last)))
            abs_model.append(abs(max(now) - (max(last) + fit["support_delta"]["mean"])))
    backtest = {
        "fit_seasons": [s for s in seasons if s < test], "test_season": test,
        "refiled": {"expected": round(p_ref * len(eligible), 1), "actual": actual_refiled, "eligible": len(eligible), "filed_before": len(prev)},
        "new_pairs": {"expected": fit["new_cells_per_season"], "actual": actual_new},
        "support_error": {"n": len(abs_model), "with_average_drift_mae": round(st.mean(abs_model), 2) if abs_model else None,
                          "same_as_last_year_mae": round(st.mean(abs_naive), 2) if abs_naive else None},
    }
    # The support model the simulator uses is whichever did better on the held-out season.
    drift_better = bool(abs_model) and st.mean(abs_model) < st.mean(abs_naive)
    backtest["support_model"] = "last support plus the average yearly change" if drift_better else "last support carried forward, with the observed yearly spread"
    est["support_delta"]["use_mean"] = drift_better

    # Investors: who has filed each ask (lead or co), and who holds shares at each company (13F, NBIM).
    filers = defaultdict(Counter)
    for p in P:
        for org, role in acts.get(p["id"], []):
            if p["id"] not in critical:
                filers[p["ask_id"]][org] += 1
    holders = defaultdict(list)  # by network organization id, as build_graph.py matched 13F filers
    for e in graph["edges"]:
        if e["type"] == "holds shares in" and e["target"] in nodes:
            holders[nodes[e["target"]].get("ticker") or ""].append(e["source"])

    fam = defaultdict(lambda: defaultdict(lambda: {"for": 0, "n": 0}))
    pid_ask = {p["id"]: p["ask_id"] for p in P}
    for r in load("fund_votes.json")["summary"]:
        a = pid_ask.get(r["proposal_id"])
        if a and r["vote"] in ("FOR", "AGAINST", "SPLIT", "ABSTAIN"):
            fam[r["family"]][a]["n"] += 1
            fam[r["family"]][a]["for"] += r["vote"] == "FOR"

    cov = defaultdict(lambda: {"full": 0, "partial": 0, "none": 0, "regions": []})
    events = {e["id"]: e for e in load("causality.json")["events"]}
    for r in load("coverage.json")["entries"]:
        c = cov[r["ask_id"]]
        c[r.get("coverage", "none")] = c.get(r.get("coverage", "none"), 0) + 1
        e = events.get(r.get("policy_id")) or {}
        if r.get("coverage") in ("full", "partial") and e.get("region"):
            c["regions"].append({"region": e["region"], "coverage": r["coverage"], "policy": e.get("title"), "status": e.get("status"), "source_url": r.get("source_url") or e.get("source_url")})
    rescission = next((e for e in events.values() if "14a-8" in (e.get("title") or "") and "rescind" in (e.get("title") or "").lower()), None)

    out = {
        "about": "Inputs for the engagement scenario simulator, computed by this site from data/ (proposals, network, holdings, fund votes, policy). Counts are kept so each estimate shows how many cases it rests on.",
        "seasons_observed": seasons,
        "estimates": est,
        "ask_support": ask_support(max(seasons)),
        "backtest": backtest,
        "thresholds": {"values": THRESHOLDS, "lookback_years": LOOKBACK, "recent_years": RECENT},
        "cells": [{"company": co, "ask": a, "seasons": {str(y): [{"id": x["id"], "status": x["status"], "support": x.get("support_pct"), "critical": x["id"] in critical,
                                                                    "filers": [o for o, _ in acts.get(x["id"], [])]} for x in by[y]] for y in sorted(by)}}
                  for (co, a), by in sorted(cells.items())],
        "companies": [{"id": c["id"], "ticker": c["ticker"], "name": c["name"], "route_status": c.get("route_status"),
                       "next_deadline": c.get("next_proposal_deadline"), "tier": c.get("tier")} for c in sorted(us, key=lambda c: c["name"].lower())],
        "filers": {a: dict(c.most_common()) for a, c in filers.items()},
        "holders": {t: sorted(set(v)) for t, v in holders.items() if t in tickers},
        "family_for": {f: {a: v for a, v in d.items()} for f, d in fam.items()},
        "policy": {a["id"]: cov[a["id"]] for a in asks},
        "rescission": {"id": rescission["id"], "title": rescission["title"], "status": rescission.get("status"), "source_url": rescission.get("source_url")} if rescission else None,
        "literature": LITERATURE,
        "critical_ids": sorted(critical),
    }
    (DATA / "sim_params.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print("sim_params.json:", len(out["cells"]), "company-ask pairs,", len(out["companies"]), "companies; backtest", json.dumps(backtest))


if __name__ == "__main__":
    main()

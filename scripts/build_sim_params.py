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

    role = {c["ticker"]: c.get("tier") for c in us}
    ask_ids = [x["id"] for x in asks]
    all_critical = {k for k, by in cells.items() if all(x["id"] in critical for y in by for x in by[y])}

    def votes_by_year(k, before):
        """One figure a year on the subject (the rule counts votes on substantially the same proposal): the highest
        vote on a proposal not lead-filed by a filer critical of ESG; where every filing on the pair came from such
        a filer, the highest of those. sim.js locked() uses the same rule."""
        by = cells[k]
        out = []
        for y in sorted(by):
            if y >= before:
                continue
            v = [x["support_pct"] for x in by[y] if x.get("support_pct") is not None and (k in all_critical or x["id"] not in critical)]
            if v:
                out.append((y, max(v)))
        return out

    def rate(k, n):
        return {"k": k, "n": n}

    def estimates(upto):
        """Every rate the engine uses, from seasons <= upto."""
        ref = [0, 0]
        lapsed = [0, 0]
        exposed = [0, 0]
        unexposed = [0, 0]
        logr, deltas = [], []
        filed_in = defaultdict(set)  # seasons with a filing not lead-filed from a critical stance (any, for all-critical pairs)
        for k, by in cells.items():
            for y in by:
                if y <= upto and (k in all_critical or any(x["id"] not in critical for x in by[y])):
                    filed_in[y].add(k)
        obs = [s for s in seasons if s <= upto]
        for y in obs[1:]:
            before = set().union(*(filed_in[s] for s in obs if s < y))
            for co in tickers:
                for a in ask_ids:
                    k = (co, a)
                    hit = k in filed_in[y]
                    if k in filed_in[y - 1]:
                        if not lockout(votes_by_year(k, y), y):
                            ref[1] += 1; ref[0] += hit
                    elif k in before:
                        if not lockout(votes_by_year(k, y), y):
                            lapsed[1] += 1; lapsed[0] += hit
                    else:
                        ex = any(a2 == a and c2 != co and role.get(c2) == role.get(co) for c2, a2 in filed_in[y - 1])
                        box = exposed if ex else unexposed
                        box[1] += 1; box[0] += hit
        for k in cells:
            v = [(y, s) for y, s in votes_by_year(k, upto + 1) if k not in all_critical]
            for (ya, sa), (yb, sb) in zip(v, v[1:]):
                if yb == ya + 1:
                    deltas.append(sb - sa)
                    if sa > 0 and sb > 0:
                        logr.append(math.log(sb / sa))
        # Company responses, counted once per company, ask and season (as the engine draws them), over filings not
        # lead-filed from a critical stance on ESG. A commitment: withdrawn because the company agreed to act (the
        # reason says so). The engine draws a commitment only when the company did not exclude the filing.
        is_commit = lambda p: p["status"] == "withdrawn" and any(w in (p.get("status_reason") or "").lower() for w in (" committed to", "negotiated agreement", " agreed to"))
        units = []  # (pair, season, excluded, committed, first)
        for k, by in cells.items():
            ys = sorted(y for y in by if y <= upto)
            for y in ys:
                ps = [x for x in by[y] if x["id"] not in critical and x["status"] in ("voted", "withdrawn", "excluded")]
                if ps:
                    units.append((k, y, all(x["status"] == "excluded" for x in ps), any(is_commit(x) for x in ps), y == ys[0]))
        filed = units
        not_excl = [u for u in units if not u[2]]
        commits = [u for u in not_excl if u[3]]
        return {
            "refile": rate(*ref),
            "lapsed_refile": rate(*lapsed),
            "new_pair_exposed": {**rate(*exposed), "label": "same ask filed at a same-role company the season before"},
            "new_pair_unexposed": {**rate(*unexposed), "label": "not filed at a same-role company the season before"},
            "support_delta": {"n": len(deltas), "mean": round(st.mean(deltas), 2) if deltas else 0, "sd": round(st.pstdev(deltas), 2) if len(deltas) > 1 else 8.0,
                              "log_sd": round(st.pstdev(logr), 3) if len(logr) > 1 else 0.5},
            "commitment": {**rate(len(commits), len(not_excl)), "pairs": [f"{k[0]} {k[1]} {y}" for k, y, *_ in commits]},
            "commitment_first": rate(sum(1 for u in commits if u[4]), sum(1 for u in not_excl if u[4])),
            "commitment_refile": rate(sum(1 for u in commits if not u[4]), sum(1 for u in not_excl if not u[4])),
            "exclusion": rate(sum(1 for u in units if u[2]), len(units)),
            # The SEC staff stopped reviewing exclusions on November 17, 2025 (data/causality.json sec-noaction-pause),
            # so the latest season is the only one without staff review.
            "exclusion_latest": {**rate(sum(1 for u in units if u[2] and u[1] == upto), sum(1 for u in units if u[1] == upto)), "season": upto},
            "exclusion_before": {**rate(sum(1 for u in units if u[2] and u[1] < upto), sum(1 for u in units if u[1] < upto)), "until": upto - 1},
            "unit": "one per company, ask and season with a filing not lead-filed from a critical stance on ESG",
        }

    def ask_support(upto):
        out = {}
        for a in asks:
            v = [p["support_pct"] for p in P if p["ask_id"] == a["id"] and p.get("support_pct") is not None and season_of(p) <= upto and p["id"] not in critical]
            out[a["id"]] = {"n": len(v), "median": round(st.median(v), 2) if v else None, "sd": round(st.pstdev(v), 2) if len(v) > 1 else None,
                            "values": sorted(round(x, 2) for x in v)}
        return out

    est = estimates(max(seasons))

    # Held-out test of the engine's rates: fit every rate on the seasons before the last, then compare what those
    # rates expect for the last season with what was recorded. Posterior means, as the engine's average draw.
    test = max(seasons)
    fit = estimates(test - 1)
    pm = lambda e: (e["k"] + 1) / (e["n"] + 2)
    nc = lambda k, y: y in cells[k] and (k in all_critical or any(x["id"] not in critical for x in cells[k][y]))
    filed_test = {k for k in cells if nc(k, test)}
    filed_prev = {k for k in cells if nc(k, test - 1)}
    seen = {k for k in cells if any(nc(k, y) for y in cells[k] if y < test)}
    exp_new = act_new = 0.0
    elig_ref, elig_lap = [], []
    for co in tickers:
        for a in ask_ids:
            k = (co, a)
            if k in filed_prev:
                if not lockout(votes_by_year(k, test), test):
                    elig_ref.append(k)
            elif k in seen:
                if not lockout(votes_by_year(k, test), test):
                    elig_lap.append(k)
            else:
                ex = any(a2 == a and c2 != co and role.get(c2) == role.get(co) for c2, a2 in filed_prev)
                exp_new += pm(fit["new_pair_exposed"] if ex else fit["new_pair_unexposed"])
                act_new += k in filed_test
    abs_naive, abs_model = [], []
    for k in elig_ref:
        v = dict(votes_by_year(k, test + 1)) if k not in all_critical else {}
        if test in v and (test - 1) in v:
            abs_naive.append(abs(v[test] - v[test - 1]))
            abs_model.append(abs(v[test] - (v[test - 1] + fit["support_delta"]["mean"])))
    backtest = {
        "fit_seasons": [s for s in seasons if s < test], "test_season": test,
        "refiled": {"expected": round(pm(fit["refile"]) * len(elig_ref), 1), "actual": sum(1 for k in elig_ref if k in filed_test), "eligible": len(elig_ref)},
        "lapsed": {"expected": round(pm(fit["lapsed_refile"]) * len(elig_lap), 1), "actual": sum(1 for k in elig_lap if k in filed_test), "eligible": len(elig_lap)},
        "new_pairs": {"expected": round(exp_new, 1), "actual": int(act_new)},
        "support_error": {"n": len(abs_model), "with_average_drift_mae": round(st.mean(abs_model), 2) if abs_model else None,
                          "same_as_last_year_mae": round(st.mean(abs_naive), 2) if abs_naive else None},
    }
    # The support model the simulator uses is whichever did better on the held-out season.
    drift_better = bool(abs_model) and st.mean(abs_model) < st.mean(abs_naive)
    backtest["support_model"] = "last year's figure plus the average yearly change" if drift_better else "last year's figure carried forward"
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

    fam = defaultdict(lambda: defaultdict(lambda: {"for": 0, "n": 0, "unreviewed": 0}))
    pid_ask = {p["id"]: p["ask_id"] for p in P}
    fvj = load("fund_votes.json")
    held = set(fvj.get("held_back_proposals") or [])
    for r in fvj["summary"]:
        a = pid_ask.get(r["proposal_id"])
        if a and r["vote"] in ("FOR", "AGAINST", "SPLIT", "ABSTAIN") and r["proposal_id"] not in held:
            fam[r["family"]][a]["n"] += 1
            fam[r["family"]][a]["for"] += r["vote"] == "FOR"
            fam[r["family"]][a]["unreviewed"] += not r.get("reviewed")

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
        "cells": [{"company": co, "ask": a, "all_critical": (co, a) in all_critical, "seasons": {str(y): [{"id": x["id"], "status": x["status"], "support": x.get("support_pct"), "critical": x["id"] in critical,
                                                                    "filers": [o for o, _ in acts.get(x["id"], [])]} for x in by[y]] for y in sorted(by)}}
                  for (co, a), by in sorted(cells.items())],
        "companies": [{"id": c["id"], "ticker": c["ticker"], "name": c["name"], "route_status": c.get("route_status"),
                       "next_deadline": c.get("next_proposal_deadline"), "next_deadline_source": c.get("next_proposal_deadline_source"), "tier": c.get("tier")} for c in sorted(us, key=lambda c: c["name"].lower())],
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

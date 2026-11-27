"""Support ranges for a proposed ask at a company -> data/forecast.json, built only from this site's records.

The rule (simple on purpose, and tested on every past vote):
  - refile (the ask was voted at this company before): start from the latest recorded support there;
  - first filing: start from the median of the ask's recorded votes at other companies in earlier seasons
    (all asks' votes when that ask has none);
  - the range around that starting point is the spread of past errors of the same rule, on a ratio scale
    (10th to 90th percentile of actual / starting point), measured separately for refiles and first filings.
Backtest (strict): every vote from the second season on is predicted from earlier seasons only, and its range uses
only errors from earlier seasons too. Reported: how often the actual figure fell inside the middle-80% band and the
full band, the median absolute error, and where the rule failed most. With this little history the bands are too
narrow, and the page says so.
Also here: fund-family FOR rates by ask (Form N-PX), and the stated voting power of controlling holders at
dual-class companies, so the page can show a floor for support among other votes cast. Proxy advisor
recommendations are not public in this site's sources, so none are used.
Filings lead-filed from a critical stance on ESG are left out throughout.
"""

import json
import math
import statistics as st
from collections import defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
load = lambda f: json.loads((DATA / f).read_text())

# Voting power of a named controlling holder or group, as each company's filing states it (companies.json control).
CONTROL = {
    "GOOGL": {"pct": 52.7, "who": "Larry Page and Sergey Brin together (this site's company record)"},
    "META": {"pct": 60.8, "who": "Mark Zuckerberg"},
    "CMCSA": {"pct": 33.33, "who": "Brian L. Roberts (all Class B shares)"},
    "WDAY": {"pct": 69.0, "who": "co-founders Aneel Bhusri and David Duffield, under a voting agreement"},
}


def quantile(v, q):
    s = sorted(v)
    if not s:
        return None
    k = (len(s) - 1) * q
    lo, hi = math.floor(k), math.ceil(k)
    return s[lo] + (s[hi] - s[lo]) * (k - lo)


def main():
    P = load("proposals.json")["proposals"]
    companies = {c.get("ticker"): c for c in load("companies.json") if c.get("ticker")}
    sim = load("sim_params.json")
    critical = set(sim.get("critical_ids", []))
    votes = sorted([p for p in P if p.get("ask_id") and p["status"] == "voted" and p.get("support_pct") is not None and p["id"] not in critical],
                   key=lambda p: (p["year"], p.get("meeting_date") or ""))
    seasons = sorted({p["year"] for p in votes})

    def start(p, upto):
        """The rule's starting point for proposal p, using votes from seasons before `upto` only."""
        prior_here = [q for q in votes if q["company"] == p["company"] and q["ask_id"] == p["ask_id"] and q["year"] < upto]
        if prior_here:
            last_year = max(q["year"] for q in prior_here)
            return max(q["support_pct"] for q in prior_here if q["year"] == last_year), "refile"
        same_ask = [q["support_pct"] for q in votes if q["ask_id"] == p["ask_id"] and q["year"] < upto and q["company"] != p["company"]]
        if same_ask:
            return st.median(same_ask), "first"
        anyv = [q["support_pct"] for q in votes if q["year"] < upto]
        return (st.median(anyv), "first") if anyv else (None, None)

    # One row per predictable vote: actual against the rule's starting point.
    rows = []
    for p in votes:
        if p["year"] == seasons[0]:
            continue
        s0, kind = start(p, p["year"])
        if s0:
            rows.append({"id": p["id"], "company": p["company"], "ask": p["ask_id"], "season": p["year"], "kind": kind,
                         "start": round(s0, 2), "actual": p["support_pct"], "log_ratio": math.log(p["support_pct"] / s0)})

    def errs(kind, before=None):
        lr = [r["log_ratio"] for r in rows if r["kind"] == kind and (before is None or r["season"] < before)]
        if len(lr) < 4:  # too few of this kind: use both kinds
            lr = [r["log_ratio"] for r in rows if before is None or r["season"] < before]
        return lr

    def band(kind, before=None):
        lr = errs(kind, before)
        if len(lr) < 4:
            return None
        return {"lo": quantile(lr, 0.1), "mid": quantile(lr, 0.5), "hi": quantile(lr, 0.9), "min": min(lr), "max": max(lr), "n": len(lr)}

    inside, inside_full, abs_err, misses, tested = 0, 0, [], [], []
    for r in rows:
        b = band(r["kind"], r["season"])
        if not b:
            continue
        tested.append(r)
        r["range"] = [round(r["start"] * math.exp(b["lo"]), 1), round(r["start"] * math.exp(b["hi"]), 1)]
        r["full"] = [round(r["start"] * math.exp(b["min"]), 1), round(r["start"] * math.exp(b["max"]), 1)]
        ok = r["range"][0] <= r["actual"] <= r["range"][1]
        inside += ok
        inside_full += r["full"][0] <= r["actual"] <= r["full"][1]
        abs_err.append(abs(r["actual"] - r["start"] * math.exp(b["mid"])))
        if not ok:
            misses.append(r)
    misses.sort(key=lambda r: -abs(r["log_ratio"]))
    by_kind = {}
    for k in ("refile", "first"):
        rr = [r for r in tested if r["kind"] == k]
        by_kind[k] = {"n": len(rr), "inside": sum(1 for r in rr if r["range"][0] <= r["actual"] <= r["range"][1])}
    bands = {k: band(k) for k in ("refile", "first")}

    # Fund families' FOR record by ask (Form N-PX), counted as the planner counts it (every matched row), with how
    # many matches a person has not yet reviewed.
    pid_ask = {p["id"]: p.get("ask_id") for p in P}
    fam = defaultdict(lambda: defaultdict(lambda: {"for": 0, "n": 0, "unreviewed": 0}))
    fvj = load("fund_votes.json")
    held = set(fvj.get("held_back_proposals") or [])
    for r in fvj["summary"]:
        a = pid_ask.get(r["proposal_id"])
        # Rows the matcher could not settle (NEEDS_CHECK) and held-back proposals are not counted as votes.
        if a and r["vote"] in ("FOR", "AGAINST", "SPLIT", "ABSTAIN") and r["proposal_id"] not in held:
            f = fam[a][r["family"]]
            f["n"] += 1
            f["for"] += r["vote"] == "FOR"
            f["unreviewed"] += not r.get("reviewed")

    # One figure a season per company and ask (the highest, as the backtest's rule uses), and the latest of them.
    by_season, latest = {}, {}
    for p in votes:
        k = f'{p["company"]}|{p["ask_id"]}|{p["year"]}'
        if k not in by_season or p["support_pct"] > by_season[k]["support"]:
            by_season[k] = {"season": p["year"], "support": p["support_pct"], "id": p["id"], "source_url": p.get("results_url")}
    for k, v in by_season.items():
        co, ask, _ = k.split("|")
        if f"{co}|{ask}" not in latest or v["season"] > latest[f"{co}|{ask}"]["season"]:
            latest[f"{co}|{ask}"] = v
    ask_votes = defaultdict(list)
    for p in votes:
        ask_votes[p["ask_id"]].append(p["support_pct"])

    out = {
        "about": "Support ranges from this site's own records, with a published backtest. Computed by this site; a scenario, not a forecast of any vote, and not advice.",
        "method": "Refile: latest recorded support at this company on this ask. First filing: median of the ask's recorded votes at other companies. Range: 10th to 90th percentile of past errors of the same rule (actual divided by starting point).",
        "bands": bands,
        "backtest": {"cases": len(tested), "inside_80": inside, "coverage": round(inside / len(tested), 3) if tested else None,
                     "inside_full": inside_full, "full_coverage": round(inside_full / len(tested), 3) if tested else None,
                     "median_abs_error_points": round(st.median(abs_err), 1) if abs_err else None, "by_kind": by_kind,
                     "seasons": sorted({r["season"] for r in tested}), "worst_misses": [{k: r[k] for k in ("id", "company", "ask", "season", "kind", "start", "actual", "range")} for r in misses[:5]]},
        "latest": latest, "by_season": by_season,
        "ask_votes": {a: sorted(v) for a, v in ask_votes.items()},
        "all_votes_median": st.median([p["support_pct"] for p in votes]) if votes else None,
        "max_recorded": max(p["support_pct"] for p in votes) if votes else None,
        "family_for": {a: dict(d) for a, d in fam.items()},
        "control": {t: {**v, "source_url": (companies.get(t, {}).get("control") or {}).get("url")} for t, v in CONTROL.items()},
        "proxy_advisors": "Not public in this site's sources: ISS and Glass Lewis recommendations are not used.",
    }
    (DATA / "forecast.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(f"forecast.json: {len(tested)} backtest cases, {inside} inside the 80% range ({out['backtest']['coverage']}); median error {out['backtest']['median_abs_error_points']} points; by kind {by_kind}")


if __name__ == "__main__":
    main()

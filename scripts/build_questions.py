"""Prediction board: questions about outcomes, the site's base rate for each, and the crowd's forecasts.

data/forecast-questions.json is both the output and the store. A question is written once, when it is first created
(title, benchmark, base rate, closing date, resolution rule), and never rewritten afterwards, so forecasts always
refer to the question people saw. Each run only adds new questions, then updates every question's result and
crowd figures. Inputs: data/proposals.json, forecast.json, sim_params.json, companies.json, asks.json,
causality.json; data/predictions.json (forecasts posted through the GitHub form, added by
scripts/ingest_forecast.py); data/forecast-resolutions.json (results decided by hand, each with a source).

Design (Plan and test › Prediction board):
  - Every question is about an outcome. Forecasters give their estimate of what will happen, never their support.
  - Every question states when forecasts close, how it resolves and from which source, and resolves from this
    site's records where it can.
  - The site's own base rate comes first, computed from its records over the same window as the question, with how.
  - Forecasters declare a stakeholder group (self-declared, not checked). A group counts on its own once it has 3
    forecasters; smaller groups are pooled. The crowd figure is the mean of those group medians.
  - Forecasters who declare a stake (filer, the company, its adviser) are kept but left out of the crowd figure
    and the ranking.
  - Resolved questions score each forecaster (Brier score: lower is better); the ranking is by skill against the
    site's base rate on the same questions.
"""

import datetime as dt
import json
import statistics as st
from collections import defaultdict
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
OUT = DATA / "forecast-questions.json"
SRC = "https://github.com/sophiaquinlanware/shareholder-advocacy-ai-landscape/blob/main/data/"
GROUPS = ["Investor or asset manager", "Asset owner or pension", "Company (governance, legal, IR)", "Proxy advisor or ESG data",
          "Policymaker or regulator", "Academic or researcher", "Civil society or advocacy", "Employee of an AI company", "Journalist",
          "Retail shareholder", "Other"]
COMMIT_WORDS = (" committed to", "negotiated agreement", " agreed to")
AI_DEF = "an AI proposal as listed in this site's Proposals and votes, leaving out those lead-filed by filers critical of ESG"
# Year each company became public, for companies that listed during the years the site records
# (data/companies.json notes "Newly listed November 2026" for ANT and SPCX; CoreWeave's IPO was March 2025).
LISTED = {"ANT": 2026, "SPCX": 2026, "CRWV": 2025}
RESOLVE_LAG = 30  # days after a season window ends before it resolves, so the records can catch up
MIN_GROUP = 3

load = lambda f, d=None: json.loads((DATA / f).read_text()) if (DATA / f).exists() else d


def long(d):
    x = dt.date.fromisoformat(d)
    return f"{x.strftime('%B')} {x.day}, {x.year}"


def shift(d, n):
    return (dt.date.fromisoformat(d) + dt.timedelta(days=n)).isoformat()


def num(v):
    return f"{v:g}"


def commitment(p):
    reason = (p.get("status_reason") or "").lower()
    return p["status"] == "withdrawn" and any(w in reason for w in COMMIT_WORDS) and "not agreed" not in reason


def in_window(p, y):
    """Meetings from January 1 to June 30 of year y (with no meeting date: the record's season)."""
    d = p.get("meeting_date")
    return f"{y}-01-01" <= d <= f"{y}-06-30" if d else p["year"] == y


def candidates(P, pro, fc, companies, asks, events, today):
    """Questions the current records suggest. Only those whose id is new are added to the store."""
    qs = []
    seasons = sorted({p["year"] for p in P if p["year"] < int(today[:4]) or (p["year"] == int(today[:4]) and today[5:] > "06-30")})
    nxt = seasons[-1] + 1
    yrs = f"{seasons[0]} to {seasons[-1]}"

    # 1. Coming votes: will support reach the benchmark (the latest vote on this ask here, or the ask's median elsewhere)?
    errs_all = fc.get("errors") or {}
    for p in sorted((x for x in pro if x["status"] == "upcoming" and (x.get("meeting_date") or "") > today), key=lambda x: x["meeting_date"]):
        last = (fc.get("latest") or {}).get(f'{p["company"]}|{p.get("ask_id")}')
        v = (fc.get("ask_votes") or {}).get(p.get("ask_id")) or []
        if last:
            bar, kind = last["support"], "refile"
            basis = f"the previous recorded vote on this ask here ({num(bar)}% in {last['season']})"
        elif v:
            bar, kind = round(st.median(v), 1), "first"
            basis = f"the median of this ask's {len(v)} recorded votes at other companies ({num(bar)}%)"
        else:
            continue  # no benchmark in the records, so no question
        errs = errs_all.get(kind) or []
        if len(errs) < 4:
            continue
        hit = sum(1 for e in errs if e >= 0)
        share = f"{hit} ({round(100 * hit / len(errs))}%)"
        how = (f"Of the {len(errs)} refiled votes this site records, {share} got support at or above the previous recorded vote on the same ask at the same company."
               if kind == "refile" else
               f"Of the {len(errs)} first-time votes on an ask at a company this site records, {share} got at least the median of that ask's earlier votes elsewhere.")
        name = companies.get(p["company"], {}).get("name", p["company"])
        qs.append({
            "id": f"q-{p['id']}-bar", "kind": "vote", "section": "Coming votes",
            "title": f"Will \"{p['title']}\" at {name} get at least {num(bar)}% support at its meeting on {long(p['meeting_date'])}?",
            "closes": shift(p["meeting_date"], -1), "company": p["company"], "ask": p.get("ask_id"), "ask_label": asks.get(p.get("ask_id")),
            "resolves": f"Yes if support, computed by this site as for ÷ (for + against) from the counts in {name}'s 8-K, is at least {num(bar)}%. "
                        f"Void if the proposal is withdrawn or excluded, or the vote is not held within 60 days of {long(p['meeting_date'])}.",
            "source_url": p.get("proxy_url"),
            "base": {"p": round(hit / len(errs), 3), "start": f"Benchmark: {basis}.", "how": how, "source_url": SRC + "forecast.json"},
            "auto": {"type": "support_at_least", "proposal_id": p["id"], "bar": bar},
        })

    # 2. The next season's outcomes, for meetings January 1 to June 30, counted the same way for past years.
    def per_year(fn):
        return [fn([x for x in pro if in_window(x, y)]) for y in seasons]
    wc = per_year(lambda ps: sum(1 for x in ps if commitment(x)))
    ex = per_year(lambda ps: sum(1 for x in ps if x["status"] == "excluded"))
    mx = per_year(lambda ps: max([x["support_pct"] for x in ps if x.get("support_pct") is not None] or [0]))
    lap = lambda k, n: round((k + 1) / (n + 2), 3)
    smooth = lambda k, n: f"smoothed as ({k} + 1) ÷ ({n} + 2) = {round(100 * (k + 1) / (n + 2))}%"
    win = f"meetings January 1 to June 30, {nxt}"
    caveat = " Withdrawals and exclusions in earlier years may be less fully recorded here than recent ones."
    closes, by = f"{nxt}-01-31", f"{nxt}-06-30"
    k1, k2, k3 = sum(1 for n in wc if n), sum(1 for n in ex if n >= 3), sum(1 for m in mx if m >= 30)
    src = SRC + "proposals.json"
    excl = {"id": f"q-{nxt}-exclusions", "kind": "season", "section": f"The {nxt} season",
            "title": f"Will companies tracked here exclude 3 or more AI proposals, for {win}?",
            "closes": closes, "resolves_by": by,
            "resolves": f"Yes if this site records at least three excluded, each {AI_DEF}, with the company's notice or reason, for {win}.",
            "base": {"p": lap(k2, len(ex)), "how": f"Years {yrs} recorded here with 3 or more, counting meetings January 1 to June 30: {k2} of {len(ex)} (per year: {', '.join(map(str, ex))}); {smooth(k2, len(ex))}.{caveat}", "source_url": src},
            "auto": {"type": "count_at_least", "what": "excluded", "season": nxt, "n": 3}}
    qs += [
        {"id": f"q-{nxt}-commitment", "kind": "season", "section": f"The {nxt} season",
         "title": f"Will any AI proposal at a company tracked here be withdrawn after a company commitment, for {win}?",
         "closes": closes, "resolves_by": by,
         "resolves": f"Yes if this site records at least one such withdrawal ({AI_DEF}), with the filer's or company's statement as source, for {win}.",
         "base": {"p": lap(k1, len(wc)), "how": f"Years {yrs} recorded here with at least one, counting meetings January 1 to June 30: {k1} of {len(wc)} (per year: {', '.join(map(str, wc))}); {smooth(k1, len(wc))}.{caveat}", "source_url": src},
         "auto": {"type": "count_at_least", "what": "withdrawn_commitment", "season": nxt, "n": 1}},
        excl,
        {"id": f"q-{nxt}-top-support", "kind": "season", "section": f"The {nxt} season",
         "title": f"Will any AI proposal at a company tracked here get 30% support or more, for {win}?",
         "closes": closes, "resolves_by": by,
         "resolves": f"Yes if any one ({AI_DEF}) records 30% or more, computed by this site as for ÷ (for + against) from the 8-K counts, for {win}.",
         "base": {"p": lap(k3, len(mx)), "how": f"Years {yrs} with a vote of 30% or more at meetings January 1 to June 30: {k3} of {len(mx)} (highest per year: {', '.join(f'{m:.0f}%' for m in mx)}); {smooth(k3, len(mx))}.", "source_url": src},
         "auto": {"type": "max_support_at_least", "season": nxt, "bar": 30}},
    ]

    # 3. Rules, with no base rate from this site's records; resolved by hand (data/forecast-resolutions.json).
    resc = events.get("sec-14a8-rescission-proposal") or {}
    if resc:
        rid = f"q-sec-rescission-{nxt}"
        qs.append({"id": rid, "kind": "policy", "section": "Rules",
                   "title": f"Will the SEC vote to adopt a final rule rescinding Rule 14a-8 by June 30, {nxt}?",
                   "closes": closes, "resolves_by": by,
                   "resolves": f"Yes if the Commission votes by June 30, {nxt} to adopt a final rule that removes shareholders' right to have proposals included in the company's proxy statement under Rule 14a-8, as announced by the SEC. "
                               "An amendment that keeps the rule, such as new ownership thresholds, resolves No. Resolved by hand from the SEC's announcement.",
                   "source_url": resc.get("source_url"),
                   "base": {"p": None, "how": "This site's records give no base rate for SEC rulemaking. The proposal's comment period closed November 20, 2026.", "source_url": resc.get("source_url")},
                   "auto": {"type": "manual"}})
        # 4. Conditional pair ("decision market" in Hanson's sense): the same outcome under each answer to the rules question.
        for cond, word in ((1, "votes to adopt"), (0, "does not vote to adopt")):
            how = ("This site's records hold no season with the rescission adopted, so this is the unconditional rate." if cond else
                   f"All recorded years ({yrs}) were without an adopted rescission, so this is the unconditional rate.")
            extra = " If Rule 14a-8 is gone, a proposal counts as excluded when the company leaves it out of the proxy statement and says so in its filings." if cond else ""
            qs.append({"id": f"q-{nxt}-exclusions-if-{'adopted' if cond else 'not'}", "kind": "conditional", "section": "If, then",
                       "title": f"If the SEC {word} the Rule 14a-8 rescission by June 30, {nxt}: will companies tracked here exclude 3 or more AI proposals, for {win}?",
                       "closes": closes, "resolves_by": by, "condition": {"question": rid, "if": cond},
                       "resolves": excl["resolves"] + extra + f" Void (not scored) if the SEC {'does not vote to adopt' if cond else 'votes to adopt'} the rescission by then.",
                       "base": {"p": excl["base"]["p"], "how": how, "source_url": src},
                       "auto": dict(excl["auto"])})

    # 5. Coverage gaps: companies under US proxy rules with no AI proposal recorded in the latest season, deadline still open.
    filed = defaultdict(set)
    for x in pro:
        filed[x["company"]].add(x["year"])
    us = [c for c in companies.values() if c.get("shareholder_route") == "US proxy rules apply"]
    gaps = {y: [c["ticker"] for c in us if LISTED.get(c["ticker"], 0) <= y - 1 and (y - 1) not in filed[c["ticker"]]] for y in seasons[1:]}
    got = {y: [t for t in gaps[y] if y in filed[t]] for y in gaps}
    k, n = sum(len(v) for v in got.values()), sum(len(v) for v in gaps.values())
    latest = seasons[-1]
    for c in sorted(us, key=lambda c: c.get("next_proposal_deadline") or "9"):
        d = c.get("next_proposal_deadline")
        if latest in filed[c["ticker"]] or not d or d <= today:
            continue
        end = shift(d, 300)
        qs.append({"id": f"q-gap-{c['ticker'].lower()}-{d}", "kind": "coverage_gap", "section": f"Companies with no AI proposal recorded in {latest}",
                   "title": f"Will any investor (not counting filers critical of ESG) file an AI proposal at {c['name']} by its deadline of {long(d)}?",
                   "closes": shift(d, -1), "company": c["ticker"], "resolves_by": end,
                   "resolves": f"Yes if {c['name']}'s next proxy statement includes {AI_DEF}, or this site records one filed by the deadline and then withdrawn or excluded. "
                               f"Resolved from the proxy statement and the company's filings; No if none is recorded by {long(end)}.",
                   "source_url": c.get("next_proposal_deadline_source"),
                   "base": {"p": round(k / n, 3) if n else None,
                            "how": f"Of companies here under US proxy rules, already public the year before, with no AI proposal recorded one year, the share with one recorded the next: {k} of {n} "
                                   f"({', '.join(f'{y}: {len(got[y])} of {len(gaps[y])}' for y in gaps)}).",
                            "source_url": src},
                   "auto": {"type": "filed_after", "company": c["ticker"], "deadline": d}})
    return qs


def resolve(q, P, pro, today, manual):
    if q["id"] in manual:
        return manual[q["id"]]["resolved"]
    a = q.get("auto") or {}
    t = a.get("type")
    if t == "support_at_least":
        p = next((x for x in P if x["id"] == a["proposal_id"]), None)
        if p and p["status"] == "voted" and p.get("support_pct") is not None:
            return int(p["support_pct"] >= a["bar"])
        if p and p["status"] in ("withdrawn", "excluded"):
            return "void"
        return None  # a meeting postponed more than 60 days is voided by hand in data/forecast-resolutions.json
    if t in ("count_at_least", "max_support_at_least"):
        if shift(q["resolves_by"], RESOLVE_LAG) > today:
            return None
        ps = [x for x in pro if in_window(x, a["season"])]
        if t == "max_support_at_least":
            return int(any((x.get("support_pct") or 0) >= a["bar"] for x in ps))
        n = sum(1 for x in ps if (x["status"] == "excluded" if a["what"] == "excluded" else commitment(x)))
        return int(n >= a["n"])
    if t == "filed_after":
        if any(x["company"] == a["company"] and ((x.get("meeting_date") or "") > a["deadline"] or (not x.get("meeting_date") and x["year"] > int(a["deadline"][:4]))) for x in pro):
            return 1
        if q["resolves_by"] < today:
            return 0
    return None


def main():
    today = dt.date.today().isoformat()
    P = load("proposals.json")["proposals"]
    companies = {c.get("ticker"): c for c in load("companies.json") if c.get("ticker")}
    critical = set(load("sim_params.json", {}).get("critical_ids", []))
    fc = load("forecast.json", {})
    asks = {a["id"]: a["label"] for a in load("asks.json")["asks"]}
    events = {e["id"]: e for e in load("causality.json")["events"]}
    manual = (load("forecast-resolutions.json", {}) or {}).get("resolutions", {})
    pro = [p for p in P if p["id"] not in critical]

    store = load("forecast-questions.json", {}) or {}
    have = {q["id"]: q for q in store.get("questions", [])}
    added = 0
    for q in candidates(P, pro, fc, companies, asks, events, today):
        if q["id"] not in have:
            q["created"] = today
            have[q["id"]] = q
            added += 1
    qs = list(have.values())

    # Results (conditional questions after the questions they depend on).
    res = {}
    for q in sorted(qs, key=lambda q: q.get("kind") == "conditional"):
        r = resolve(q, P, pro, today, manual)
        c = q.get("condition")
        if c and q["id"] not in manual:
            cr = res.get(c["question"])
            r = "void" if cr in (0, 1) and cr != c["if"] else r if cr in (0, 1) else None
        q["resolved"] = r
        q["resolution_source"] = (manual.get(q["id"]) or {}).get("source_url")
        res[q["id"]] = r

    # Crowd: each account's latest forecast per question.
    preds = (load("predictions.json", {}) or {}).get("forecasts", [])
    latest = {}
    for f in sorted(preds, key=lambda f: (f.get("made") or "", f.get("id") or 0)):
        latest[(f["question"], f["handle"])] = f
    byq = defaultdict(list)
    for f in latest.values():
        byq[f["question"]].append(f)
    for q in qs:
        alln = byq.get(q["id"], [])
        fs = [f for f in alln if not f.get("filer")]
        groups = defaultdict(list)
        for f in fs:
            groups[f["group"]].append(f["p"])
        weighted = {g: v for g, v in groups.items() if len(v) >= MIN_GROUP}
        small = [x for v in groups.values() if len(v) < MIN_GROUP for x in v]
        if small:
            weighted["Smaller groups pooled"] = small
        wmed = [st.median(v) for v in weighted.values()]
        q["crowd"] = {"n": len(fs), "stake_left_out": len(alln) - len(fs), "weighted_groups": len(weighted),
                      "groups": {g: {"n": len(v), "median": round(st.median(v), 3)} for g, v in groups.items()},
                      "equal_weight": round(st.mean(wmed), 3) if wmed else None,
                      "all_median": round(st.median([f["p"] for f in fs]), 3) if fs else None}

    # Scores on resolved questions (forecasters who declared a stake are not ranked).
    score = defaultdict(list)
    for q in qs:
        if q["resolved"] in (0, 1):
            b = q["base"]["p"]
            for f in byq.get(q["id"], []):
                if not f.get("filer"):
                    score[f["handle"]].append(((f["p"] - q["resolved"]) ** 2, (b - q["resolved"]) ** 2 if b is not None else None))

    def row(h, v):
        both = [(a, b) for a, b in v if b is not None]
        return {"handle": h, "resolved": len(v), "brier": round(st.mean(a for a, _ in v), 3),
                "skill": round(st.mean(b for _, b in both) - st.mean(a for a, _ in both), 3) if both else None}
    board = sorted((row(h, v) for h, v in score.items() if len(v) >= 3), key=lambda r: -(r["skill"] if r["skill"] is not None else -9))
    pairs = [(q["crowd"]["equal_weight"], q["base"]["p"], q["resolved"]) for q in qs
             if q["resolved"] in (0, 1) and q["crowd"]["equal_weight"] is not None and q["base"]["p"] is not None]
    vs = {"questions": len(pairs), "crowd_brier": round(st.mean((c - r) ** 2 for c, _, r in pairs), 3) if pairs else None,
          "site_brier": round(st.mean((b - r) ** 2 for _, b, r in pairs), 3) if pairs else None}

    out = {"about": "Questions about outcomes of AI shareholder engagement, the site's base rate for each, and forecasts posted by people who chose to. "
                    "Forecasts are personal estimates of what will happen, not statements of support or voting intentions. Each question is fixed when created.",
           "groups": GROUPS, "min_group": MIN_GROUP, "questions": qs, "leaderboard": board, "crowd_vs_site": vs, "forecasts_total": len(latest),
           "company_names": {c["ticker"]: c["name"] for c in companies.values()}}
    OUT.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(f"forecast-questions.json: {len(qs)} questions ({added} new), {len(latest)} current forecasts, {sum(1 for q in qs if q['resolved'] is not None)} resolved")


if __name__ == "__main__":
    main()

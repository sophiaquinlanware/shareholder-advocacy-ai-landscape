"""When each dataset was last checked -> data/freshness.json, read from each file's own date fields.

Nothing here is a new fact: every date comes from the dataset it describes, and each row says what kind of date it is
(a check, a report period, or the latest event) and how complete the check was. Run last in the weekly job.
"""

import json
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"


def load(f):
    p = DATA / f
    return json.loads(p.read_text()) if p.exists() else {}


def main():
    tr = load("tracking.json")
    hold = load("holdings.json")
    comps = load("companies.json") or []
    us = [c for c in comps if c.get("shareholder_route") == "US proxy rules apply"]
    people = (load("people.json") or {}).get("people", [])
    ev = (load("causality.json") or {}).get("events", [])
    led = (load("commitments.json") or {}).get("commitments", [])
    fv = load("fund_votes.json")
    rows_fv = fv.get("summary", [])
    current = [i for i in hold.get("investors", []) if not i.get("not_current")]
    periods = sorted(i.get("report_period") or "" for i in current if i.get("report_period"))
    checked_dl = [c.get("next_proposal_deadline_checked") for c in us if c.get("next_proposal_deadline_checked")]
    dated_people = sorted(str(p.get("verified_date")) for p in people if str(p.get("verified_date") or "")[:1].isdigit())
    rows = [
        {"dataset": "New SEC filings (proxy statements, exempt solicitations, vote results, bylaw changes)", "date": (tr.get("last_checked") or "")[:10], "kind": "checked",
         "how": f"Weekly check of {tr.get('companies_checked', '?')} companies" + (f" of {tr['companies_listed']} listed" if tr.get("companies_listed") else "") + "; findings are auto-detected and not yet reviewed", "view": "new"},
        {"dataset": "Proposal filing deadlines", "date": max(checked_dl, default=""), "kind": "checked",
         "how": f"Read from each company's proxy statement; {len(checked_dl)} of {len(us)} companies under the US proxy rules checked on or before this date", "view": "start"},
        {"dataset": "Fund-family votes (Form N-PX)", "date": fv.get("generated", ""), "kind": "read",
         "how": f"Read from SEC filings by a hand-run job and matched to proposals automatically; {sum(1 for r in rows_fv if r.get('reviewed'))} of {len(rows_fv)} matches reviewed by a person", "view": "votes"},
        {"dataset": "Shareholdings (Form 13F and Norges Bank)", "date": periods[-1] if periods else "", "kind": "report period",
         "how": f"Latest report period, not a check date; current filers' periods run from {periods[0]} to {periods[-1]}; read weekly when a newer filing appears" if periods else "", "view": "network"},
        {"dataset": "Laws, rules and the causal map", "date": max((e.get("date") or "" for e in ev), default=""), "kind": "latest event",
         "how": "Date of the latest event on the map, not a check date; events reviewed by hand", "view": "causality"},
        {"dataset": "Policy coverage by ask", "date": load("coverage.json").get("checked", ""), "kind": "checked", "how": "Reviewed by hand; each row awaits a person's sign-off", "view": "planner"},
        {"dataset": "Commitments ledger", "date": max((c.get("checked") or "" for c in led), default=""), "kind": "checked", "how": "Delivery checked against company documents by hand", "view": "outcomes"},
        {"dataset": "AI disclosure scores", "date": load("scorecard.json").get("scored", ""), "kind": "scored", "how": "Scored by this site against published recommendations", "view": "parnassus"},
        {"dataset": "Lab ties", "date": (load("pathways.json").get("meta") or {}).get("compiled") or load("pathways.json").get("compiled", ""), "kind": "compiled", "how": "Reviewed by hand", "view": "pathways"},
        {"dataset": "Engagement leads", "date": dated_people[-1] if dated_people else "", "kind": "checked",
         "how": (f"Roles checked against each organization's own pages; the oldest dated check is {dated_people[0]}; {len(people) - len(dated_people)} of {len(people)} have no check date or are marked unverified") if dated_people else "", "view": "people"},
    ]
    out = {"about": "When each dataset was last checked, read from the dataset itself; each row says what kind of date it is.", "datasets": [r for r in rows if r["date"]]}
    (DATA / "freshness.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print("freshness.json:", "; ".join(f'{r["dataset"].split(" (")[0]}: {r["date"]} ({r["kind"]})' for r in out["datasets"]))


if __name__ == "__main__":
    main()

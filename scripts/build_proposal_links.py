"""Adds derived links to data/proposals.json: vote_history and filing_deadline.

vote_history: for each proposal, earlier votes at the same company on the same subject.
  "Same subject" is judged strictly, because a false link would misstate a trend:
    - same company, an earlier meeting, both voted;
    - same topic tag;
    - the two titles share at least 60% of their key words in both directions.
  Each entry carries the earlier vote's own results URL, so every link can be checked.
  Links set by hand ("vote_history_source": "manual") are kept as they are.

filing_deadline: the Rule 14a-8 deadline for that meeting, taken from the prior year's proxy
  (data/proposal_deadlines.json, deadlines_by_year per company), with its source URL.
"""

import json
import re
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
STOP = {"the", "of", "on", "and", "for", "a", "an", "to", "in", "report", "shareholder", "stockholder", "proposal",
        "regarding", "requesting", "request", "additional", "assessment", "its", "by", "with"}


def words(text):
    t = re.sub(r"artificial[\s-]+intelligence", "ai", (text or "").lower())
    return {w for w in re.findall(r"[a-z0-9]+", t) if w not in STOP and (len(w) > 2 or w == "ai")}


def same_subject(a, b):
    A, B = words(a), words(b)
    if not A or not B:
        return False
    both = len(A & B)
    return both / len(A) >= 0.6 and both / len(B) >= 0.6


def main():
    path = DATA / "proposals.json"
    doc = json.loads(path.read_text())
    props = doc["proposals"]
    deadlines = json.loads((DATA / "proposal_deadlines.json").read_text()) if (DATA / "proposal_deadlines.json").exists() else {}
    by_company_year = {}
    for c in deadlines.get("companies", []):
        for d in c.get("deadlines_by_year", []):
            by_company_year[(c["ticker"].upper(), int(d["for_meeting_year"]))] = d

    # Recurring asks: first matching rule in data/asks.json wins; no match leaves ask_id unset.
    asks = json.loads((DATA / "asks.json").read_text())["asks"] if (DATA / "asks.json").exists() else []
    for p in props:
        text = ((p.get("title") or "") + " " + (p.get("subtopic") or "")).lower()
        hit = next((a["id"] for a in asks if any(m in text for m in a["match"])), None)
        if hit:
            p["ask_id"] = hit
        else:
            p.pop("ask_id", None)

    linked = 0
    for p in props:
        if p.get("vote_history_source") != "manual":
            hist = []
            if p.get("support_pct") is not None or p.get("status") in ("voted", "upcoming"):
                for q in props:
                    if (q is not p and q["company"] == p["company"] and q.get("status") == "voted"
                            and q.get("support_pct") is not None and (q.get("year") or 0) < (p.get("year") or 0)
                            and q.get("topic") == p.get("topic") and same_subject(q["title"], p["title"])):
                        hist.append({"year": q["year"], "proposal_id": q["id"], "title": q["title"],
                                     "support_pct": q["support_pct"], "results_url": q.get("results_url")})
            if hist:
                p["vote_history"] = sorted(hist, key=lambda h: h["year"])
                p["vote_history_source"] = "derived: same company, topic and title subject"
                linked += 1
            else:
                p.pop("vote_history", None)
                p.pop("vote_history_source", None)
        d = by_company_year.get((p["company"].upper(), int(p.get("year") or 0)))
        if d and not p.get("filing_deadline"):
            p["filing_deadline"] = d["deadline"]
            p["filing_deadline_source"] = d["source"]

    path.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n")

    # Deadline status on each company, recomputed every run so "open" never goes stale.
    import datetime as dt
    today = dt.date.today().isoformat()
    cpath = DATA / "companies.json"
    companies = json.loads(cpath.read_text())
    for c in companies:
        d = c.get("next_proposal_deadline")
        if d:
            c["next_proposal_deadline_status"] = "passed" if d < today else "open"
            c["next_proposal_deadline_checked"] = today
    cpath.write_text(json.dumps(companies, indent=1, ensure_ascii=False) + "\n")
    print(f"proposals.json: {linked} proposals with vote history; "
          f"{sum(1 for p in props if p.get('filing_deadline'))} with a filing deadline")


if __name__ == "__main__":
    main()

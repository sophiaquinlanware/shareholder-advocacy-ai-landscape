"""Copy forecasts posted on the site (Supabase, through board-live.js) into data/predictions.json, the public record
that scripts/build_questions.py scores. Run nightly by .github/workflows/forecasts-sync.yml.

Reads only the public view (forecasts_public: display name, question, figure, group, stake flag, time) with the
publishable key; no secret is needed and no email is ever read. A forecast made after its question closed is
left out. Each site forecast keeps its Supabase id ("site-<id>"), so running again adds nothing twice.
Also writes new proposal suggestions to suggestions_new.json (not published) for the workflow to open as GitHub
issues for the maintainer's review.
"""

import json
import os
import sys
import urllib.request
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
URL = os.environ.get("SUPABASE_URL", "https://cnpcczhigpufaitjtedj.supabase.co")
KEY = os.environ.get("SUPABASE_KEY", "sb_publishable_jyyM-P9LovDsBfVyq-536w_197paJyd")


def get(path):
    req = urllib.request.Request(f"{URL}/rest/v1/{path}", headers={"apikey": KEY, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())


def main():
    rows = get("forecasts_public?select=id,question,p,stakeholder_group,stake,made,display_name&order=id&limit=10000")
    path = DATA / "predictions.json"
    P = json.loads(path.read_text())
    have = {f.get("id") for f in P["forecasts"]}
    closes = {q["id"]: q["closes"] for q in json.loads((DATA / "forecast-questions.json").read_text())["questions"]}
    added = 0
    for r in rows:
        fid = f"site-{r['id']}"
        made = (r.get("made") or "")[:10]
        if fid in have or r["question"] not in closes or made > closes[r["question"]]:
            continue
        P["forecasts"].append({"id": fid, "question": r["question"], "handle": f"site:{r['display_name']}", "group": r["stakeholder_group"],
                               "p": round(float(r["p"]), 2), "filer": bool(r.get("stake")), "made": made, "source": "posted on the site"})
        added += 1
    if added:
        path.write_text(json.dumps(P, indent=1, ensure_ascii=False) + "\n")
    print(f"predictions.json: {added} site forecasts added ({len(rows)} on the site)")

    seen = set(json.loads(sys.argv[1]) if len(sys.argv) > 1 else [])
    sugg = get("suggestions?select=id,company,ask,standing,question,source_url,stake,created_at&status=eq.awaiting%20review&order=id")
    new = [s for s in sugg if s["id"] not in seen]
    Path("suggestions_new.json").write_text(json.dumps(new, ensure_ascii=False))
    print(f"suggestions: {len(new)} new awaiting review")


if __name__ == "__main__":
    main()

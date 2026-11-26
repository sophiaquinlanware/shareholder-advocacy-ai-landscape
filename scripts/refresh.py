"""Weekly tracker for AI Stewardship Commons.

What it does, in plain terms:
  1. Asks SEC EDGAR for the latest filings at each tracked company.
  2. Looks at the filing types that matter for shareholder engagement:
       DEF 14A   proxy statement (lists shareholder proposals)
       DEFA14A   extra proxy material
       PX14A6G   exempt solicitation (an investor's public letter to other shareholders)
       8-K       current report; Item 5.07 carries annual meeting vote results,
                 Item 5.03 a bylaw or charter change (may change the rights map)
  3. For proxy statements and exempt solicitations, reads the document and checks
     whether it mentions AI.
  4. Adds anything new to data/changes.json, marked "auto-detected, not yet reviewed",
     so the site's "What's new" panel shows it. A person confirms each item before it
     moves into the main tables.
  5. Updates data/tracking.json with the time of the check.

The SEC asks every automated client to identify itself. The contact string comes
from the SEC_USER_AGENT environment variable (a private GitHub secret), so no
personal email sits in this public code.
"""

import json
import os
import re
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"

COMPANIES = {
    "MSFT": ("Microsoft", 789019),
    "GOOGL": ("Alphabet", 1652044),
    "META": ("Meta", 1326801),
    "AMZN": ("Amazon", 1018724),
    "NVDA": ("Nvidia", 1045810),
    "AAPL": ("Apple", 320193),
    "TSLA": ("Tesla", 1318605),
}
FORMS = {"DEF 14A", "DEFA14A", "PX14A6G", "8-K"}
LOOKBACK_DAYS = 120  # how far back to look on each run; already-seen filings are skipped

# Words that suggest a filing touches AI. Grouped to match the site's topic tags.
AI_TERMS = {
    "AI safety & alignment": [r"\bAI safety\b", r"\balignment\b", r"responsible AI", r"frontier model"],
    "Data center impacts": [r"data cent(er|re)s?.{0,80}water", r"water.{0,80}data cent(er|re)", r"data cent(er|re) (siting|expansion|impacts?)"],
    "Social & economic impacts": [r"artificial intelligence.{0,120}(human rights|workforce|workers|jobs|misinformation|disinformation|child|privacy|discriminat)",
                                  r"generative AI.{0,120}(human rights|misinformation|disinformation|child|privacy)"],
    "AI governance & oversight": [r"artificial intelligence", r"\bgenerative AI\b", r"\bAI (risk|governance|oversight|principles)\b"],
}

UA = os.environ.get("SEC_USER_AGENT", "").strip()


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "identity"})
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read()
    time.sleep(0.2)  # stay well under the SEC's 10 requests per second
    return body


def load(name, default):
    p = DATA / name
    return json.loads(p.read_text()) if p.exists() else default


def save(name, obj):
    (DATA / name).write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n")


def classify(text):
    """Return the most specific AI topic a document mentions, or None."""
    hits = []
    for topic, patterns in AI_TERMS.items():
        n = sum(len(re.findall(p, text, flags=re.I)) for p in patterns)
        if n:
            hits.append((topic, n))
    if not hits:
        return None, 0
    # Prefer a specific topic over the general governance bucket when both appear.
    specific = [h for h in hits if h[0] != "AI governance & oversight"]
    best = max(specific or hits, key=lambda h: h[1])
    return best[0], sum(h[1] for h in hits)


def main():
    if not UA or "@" not in UA:
        sys.exit("SEC_USER_AGENT is not set yet; skipping the filing check. (The SEC requires a contact.)")

    now = datetime.now(timezone.utc)
    changes = load("changes.json", {"items": []})
    seen = {c["accession"] for c in changes["items"]}
    tracking = load("tracking.json", {})
    new_items = []

    for ticker, (name, cik) in COMPANIES.items():
        sub = json.loads(get(f"https://data.sec.gov/submissions/CIK{cik:010d}.json"))
        r = sub["filings"]["recent"]
        for i, form in enumerate(r["form"]):
            if form not in FORMS:
                continue
            filed = r["filingDate"][i]
            if (now - datetime.fromisoformat(filed).replace(tzinfo=timezone.utc)).days > LOOKBACK_DAYS:
                continue
            acc = r["accessionNumber"][i]
            if acc in seen:
                continue
            items = r.get("items", [""] * len(r["form"]))[i] or ""
            if form == "8-K" and "5.07" not in items and "5.03" not in items:
                continue  # only vote results (5.07) and bylaw changes (5.03) matter here
            doc = r["primaryDocument"][i]
            url = f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc.replace('-', '')}/{doc}"
            topic, strength = None, 0
            if form in {"DEF 14A", "DEFA14A", "PX14A6G"}:
                try:
                    text = re.sub(r"<[^>]+>", " ", get(url).decode("utf-8", "ignore"))
                    topic, strength = classify(text)
                except Exception as e:  # one bad document should not stop the run
                    print(f"  could not read {url}: {e}")
                if not topic:
                    continue  # not about AI; skip quietly
            kind = {
                "DEF 14A": "Proxy statement filed",
                "DEFA14A": "Additional proxy material filed",
                "PX14A6G": "Investor exempt solicitation filed",
                "8-K": "Annual meeting vote results filed" if "5.07" in items else "Bylaw or charter change filed (check Company profiles › Shareholder proposal rights)",
            }[form]
            new_items.append({
                "accession": acc,
                "company": name,
                "ticker": ticker,
                "form": form,
                "what": kind,
                "topic": topic,
                "ai_mentions": strength,
                "filed": filed,
                "url": url,
                "detected": now.date().isoformat(),
                "review_status": "auto-detected, not yet reviewed",
            })
            seen.add(acc)
            print(f"  new: {ticker} {form} {filed} {topic or ''}")

    changes["items"] = sorted(new_items + changes["items"], key=lambda c: c["filed"], reverse=True)
    save("changes.json", changes)
    tracking.update({
        "last_checked": now.isoformat(timespec="minutes"),
        "companies_checked": len(COMPANIES),
        "new_this_run": len(new_items),
    })
    save("tracking.json", tracking)
    print(f"Done. {len(new_items)} new filings flagged.")


if __name__ == "__main__":
    main()

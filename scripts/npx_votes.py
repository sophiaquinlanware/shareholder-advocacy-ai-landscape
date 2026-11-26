"""How funds voted on each AI proposal, from SEC Form N-PX.

Every U.S. mutual fund and ETF files Form N-PX each year by August 31, listing how
it voted at every shareholder meeting from July 1 to June 30. Since the 2024 filings
(covering meetings from July 2023 on) the votes come as structured XML, so they can
be matched to the proposals in data/proposals.json.

What it does:
  1. Finds each fund family's N-PX filings (by trust name, via the SEC company search).
  2. Streams each filing's vote table, keeping only the seven tracked companies.
  3. Matches each vote to an AI proposal by company, meeting date and wording.
  4. Writes the result to the path given by --out (default: data/fund_votes.json).

REVIEW FIRST: results about named funds are shown to Sophia before anything is
published. The workflow writes them to a private review file, not to the site.

Needs SEC_USER_AGENT ("Name email"): the SEC refuses automated requests without a contact.
"""

import argparse
import datetime as dt
import json
import os
import re
import sys
import tempfile
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
UA = os.environ.get("SEC_USER_AGENT", "").strip()

# Fund families to check, by the trust names they file under. Parnassus first.
FAMILIES = {
    "Parnassus": ["Parnassus Funds", "Parnassus Income Funds"],
    "BlackRock (iShares)": ["iShares Trust"],
    "Vanguard": ["Vanguard Index Funds"],
    "Calvert": ["Calvert Responsible Index Series", "Calvert Social Investment Fund"],
    "Domini": ["Domini Investment Trust"],
    "Green Century": ["Green Century Funds"],
    "Impax (Pax)": ["Impax Funds Series Trust"],
    "TIAA-CREF": ["TIAA-CREF Funds"],
    "Praxis": ["Praxis Mutual Funds"],
}

ISSUERS = {
    "MSFT": (r"MICROSOFT", "594918104"), "GOOGL": (r"ALPHABET", "02079K"), "META": (r"META PLATFORMS", "30303M"),
    "AMZN": (r"AMAZON", "023135"), "NVDA": (r"NVIDIA", "67066G"), "AAPL": (r"APPLE INC", "037833"),
    "TSLA": (r"TESLA", "88160R"),
}

STOP = {"the", "of", "on", "and", "for", "a", "an", "to", "in", "report", "shareholder", "proposal", "regarding",
        "stockholder", "requesting", "request", "adopt", "issue", "publish", "prepare", "s", "its", "our", "with"}


def get(url, stream_to=None):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                if stream_to:
                    while True:
                        chunk = r.read(1 << 20)
                        if not chunk:
                            break
                        stream_to.write(chunk)
                    time.sleep(0.2)
                    return None
                body = r.read()
            time.sleep(0.2)
            return body
        except Exception as e:
            if attempt == 3:
                raise
            time.sleep(2 * (attempt + 1))


def find_ciks(name):
    q = urllib.parse.urlencode({"company": name, "type": "N-PX", "owner": "include", "count": 20, "action": "getcompany", "output": "atom"})
    xml = get("https://www.sec.gov/cgi-bin/browse-edgar?" + q).decode("utf-8", "ignore")
    found = re.findall(r"<cik>(\d+)</cik>", xml)
    if not found:
        found = re.findall(r"CIK=(\d{6,10})", xml)
    return [int(c) for c in dict.fromkeys(found)][:1]  # best match only


def npx_filings(cik, since_year=2024):
    sub = json.loads(get(f"https://data.sec.gov/submissions/CIK{cik:010d}.json"))
    r = sub["filings"]["recent"]
    out = []
    for i, form in enumerate(r["form"]):
        if form in ("N-PX", "N-PX/A") and int(r["filingDate"][i][:4]) >= since_year:
            out.append({"accession": r["accessionNumber"][i], "filed": r["filingDate"][i], "period": r["reportDate"][i], "form": form,
                        "trust": sub.get("name")})
    return out


def words(text):
    return {w for w in re.findall(r"[a-z0-9]+", (text or "").lower()) if w not in STOP and len(w) > 2}


def score(a, b):
    A, B = words(a), words(b)
    return len(A & B) / min(len(A), len(B)) if A and B else 0


def tag(el):
    return el.tag.split("}")[-1]


def parse_votes(path, tickers_by_cusip):
    """Stream the vote table and yield records for tracked companies only."""
    for _, el in ET.iterparse(path, events=("end",)):
        if tag(el) != "proxyTable":
            continue
        rec = {}
        votes = []
        series = []
        for c in el.iter():
            t = tag(c)
            if t in ("issuerName", "cusip", "meetingDate", "voteDescription", "proposedBy", "voteSource") and c.text:
                rec[t] = c.text.strip()
            elif t == "voteRecord":
                v = {tag(x): (x.text or "").strip() for x in c}
                votes.append(v)
            elif t == "seriesId" and c.text:
                series.append(c.text.strip())
        el.clear()
        cusip = rec.get("cusip", "").upper()
        name = rec.get("issuerName", "").upper()
        tic = next((t for t, (pat, cp) in ISSUERS.items() if cusip.startswith(cp) or re.search(pat, name)), None)
        if not tic:
            continue
        rec["ticker"] = tic
        rec["votes"] = votes
        rec["series"] = series
        yield rec


def to_iso(d):
    for fmt in ("%m/%d/%Y", "%Y-%m-%d"):
        try:
            return dt.datetime.strptime(d, fmt).date().isoformat()
        except Exception:
            pass
    return d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(DATA / "fund_votes.json"))
    ap.add_argument("--families", default="", help="comma list to limit, e.g. Parnassus")
    args = ap.parse_args()
    if "@" not in UA:
        sys.exit("SEC_USER_AGENT is not set; the SEC requires a contact. Skipping.")

    proposals = json.loads((DATA / "proposals.json").read_text())["proposals"]
    by_key = {}
    for p in proposals:
        if p.get("meeting_date"):
            by_key.setdefault((p["company"], p["meeting_date"]), []).append(p)

    want = [f.strip() for f in args.families.split(",") if f.strip()]
    results, filings_used, notes = [], [], []
    for family, trusts in FAMILIES.items():
        if want and family not in want:
            continue
        for trust in trusts:
            try:
                ciks = find_ciks(trust)
            except Exception as e:
                notes.append(f"{trust}: search failed ({e})")
                continue
            if not ciks:
                notes.append(f"{trust}: no N-PX filer found")
                continue
            for f in npx_filings(ciks[0]):
                base = f"https://www.sec.gov/Archives/edgar/data/{ciks[0]}/{f['accession'].replace('-', '')}/"
                try:
                    idx = json.loads(get(base + "index.json"))
                except Exception as e:
                    notes.append(f"{trust} {f['accession']}: index failed ({e})")
                    continue
                xmls = [i["name"] for i in idx["directory"]["item"] if i["name"].lower().endswith(".xml") and "primary_doc" not in i["name"].lower()]
                if not xmls:
                    notes.append(f"{trust} {f['accession']}: no structured vote table (older text format)")
                    continue
                filings_used.append({**f, "family": family, "cik": ciks[0], "url": base})
                with tempfile.NamedTemporaryFile(suffix=".xml") as tmp:
                    get(base + xmls[0], stream_to=tmp)
                    tmp.flush()
                    for rec in parse_votes(tmp.name, None):
                        md = to_iso(rec.get("meetingDate", ""))
                        cands = by_key.get((rec["ticker"], md), [])
                        if not cands:
                            continue
                        best = max(cands, key=lambda p: score(p["title"], rec.get("voteDescription", "")))
                        s = score(best["title"], rec.get("voteDescription", ""))
                        if s < 0.34 and "security holder" not in (rec.get("proposedBy", "").lower()):
                            continue
                        hows = sorted({v.get("howVoted", "").upper() for v in rec["votes"] if v.get("howVoted")})
                        mgmt = sorted({v.get("managementRecommendation", "").upper() for v in rec["votes"] if v.get("managementRecommendation")})
                        shares = sum(float(v.get("sharesVoted") or 0) for v in rec["votes"])
                        results.append({
                            "family": family, "trust": f["trust"], "proposal_id": best["id"], "company": rec["ticker"],
                            "meeting_date": md, "npx_description": rec.get("voteDescription"),
                            "match_confidence": round(s, 2), "how_voted": hows, "management_rec": mgmt,
                            "shares_voted": shares, "series_count": len(set(rec["series"])) or None,
                            "source_url": base, "filed": f["filed"],
                        })
                print(f"  {family} / {trust} {f['filed']}: done")

    out = {"generated": dt.date.today().isoformat(), "status": "PRIVATE REVIEW: not for publication until Sophia approves",
           "filings": filings_used, "votes": results, "notes": notes}
    Path(args.out).write_text(json.dumps(out, indent=1) + "\n")
    print(f"{len(results)} AI-proposal votes matched across {len(filings_used)} filings. Notes: {len(notes)}")


if __name__ == "__main__":
    main()

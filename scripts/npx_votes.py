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
    "Parnassus": ["Parnassus Funds", "Parnassus Funds II"],
    "BlackRock (iShares)": ["ticker:IVV", "iShares U.S. ETF Trust"],
    "Vanguard": ["Vanguard Index Funds", "Vanguard World Fund", "Vanguard Institutional Index Funds"],
    "Calvert": ["Calvert Responsible Index Series", "Calvert Social Investment Fund"],
    "Domini": ["ticker:DSEFX"],
    "Green Century": ["ticker:GCEQX"],
    "Impax (Pax)": ["Impax Funds Series Trust"],
    "TIAA-CREF": ["ticker:TISCX"],
    "Praxis": ["Praxis Mutual Funds"],
}

ISSUERS = {
    "MSFT": (r"MICROSOFT", "594918104"), "GOOGL": (r"ALPHABET", "02079K"), "META": (r"META PLATFORMS", "30303M"),
    "AMZN": (r"AMAZON", "023135"), "NVDA": (r"NVIDIA", "67066G"), "AAPL": (r"APPLE INC", "037833"),
    "TSLA": (r"TESLA", "88160R"),
}

STOP = {"the", "of", "on", "and", "for", "a", "an", "to", "in", "report", "shareholder", "proposal", "regarding",
        "stockholder", "requesting", "request", "adopt", "issue", "publish", "prepare", "s", "its", "our", "with",
        "non", "binding", "approval", "entitled"}
MIN_MATCH = 0.75      # share of the proposal title's key words that must appear in the filing's description
MIN_REVERSE = 0.5     # share of the description's key words that must appear in the title
MIN_MARGIN = 0.15     # best candidate must beat the runner-up at the same meeting by this much


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


_MF = None


def find_ciks(name):
    """A trust by name (SEC company search), or "ticker:XXXX" to find the trust behind a fund ticker
    using the SEC's mutual fund ticker file (more reliable when trust names differ from brand names)."""
    global _MF
    if name.startswith("ticker:"):
        if _MF is None:
            _MF = json.loads(get("https://www.sec.gov/files/company_tickers_mf.json"))
        want = name.split(":", 1)[1].upper()
        f = _MF["fields"]
        for row in _MF["data"]:
            rec = dict(zip(f, row))
            if str(rec.get("symbol", "")).upper() == want:
                return [int(rec["cik"])]
        return []
    return find_cik_by_name(name)


def find_cik_by_name(name):
    q = urllib.parse.urlencode({"company": name, "type": "N-PX", "owner": "include", "count": 20, "action": "getcompany", "output": "atom"})
    xml = get("https://www.sec.gov/cgi-bin/browse-edgar?" + q).decode("utf-8", "ignore")
    found = re.findall(r"<cik>(\d+)</cik>", xml)
    if not found:
        found = re.findall(r"CIK=(\d{6,10})", xml)
    return [int(c) for c in dict.fromkeys(found)][:1]  # best match only


def npx_filings(cik, since_year=2024):
    """All N-PX filings since since_year. The SEC's "recent" list holds only the latest
    ~1,000 filings, so busy trusts (iShares files thousands of prospectus updates) push older
    N-PX filings into extra pages listed under filings.files; those are read too."""
    sub = json.loads(get(f"https://data.sec.gov/submissions/CIK{cik:010d}.json"))
    pages = [sub["filings"]["recent"]]
    for extra in sub["filings"].get("files", []):
        if extra.get("filingTo", "9999") >= f"{since_year}-01-01":
            pages.append(json.loads(get("https://data.sec.gov/submissions/" + extra["name"])))
    out, seen = [], set()
    for r in pages:
        for i, form in enumerate(r["form"]):
            if form in ("N-PX", "N-PX/A") and int(r["filingDate"][i][:4]) >= since_year and r["accessionNumber"][i] not in seen:
                seen.add(r["accessionNumber"][i])
                out.append({"accession": r["accessionNumber"][i], "filed": r["filingDate"][i], "period": r["reportDate"][i], "form": form,
                            "trust": sub.get("name")})
    return out


def words(text):
    t = re.sub(r"\bal\b", "ai", (text or "").lower())          # filings often OCR "AI" as "Al"
    t = re.sub(r"genal\b", "genai", t)
    # "ai" is only two letters but is the most important word here, so it is kept.
    return {w for w in re.findall(r"[a-z0-9]+", t) if w not in STOP and (len(w) > 2 or w == "ai")}


def score(title, description):
    """(share of title words found in the description, share of description words found in the title)."""
    A, B = words(title), words(description)
    if not A or not B:
        return 0.0, 0.0
    both = len(A & B)
    return both / len(A), both / len(B)


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

    proposals = [p for p in json.loads((DATA / "proposals.json").read_text())["proposals"]
                 if (p.get("status") or "").lower() in ("voted", "")]
    by_key, by_year = {}, {}
    for p in proposals:
        if p.get("meeting_date"):
            by_key.setdefault((p["company"], p["meeting_date"]), []).append(p)
        else:  # no meeting date on file: match within the company's meetings that year
            by_year.setdefault((p["company"], int(p.get("year") or 0)), []).append(p)
    review = []  # near misses and ties, for a person to check

    want = [f.strip() for f in args.families.split(",") if f.strip()]
    results, filings_used, notes = [], [], []
    trusts_searched = {}
    unreadable = []  # filings found but not in the structured format
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
            trusts_searched.setdefault(family, []).append({"trust": trust, "cik": ciks[0]})
            filings = npx_filings(ciks[0])
            # An amendment (N-PX/A) restates a period; keep only the latest filing per period.
            latest = {}
            for f in sorted(filings, key=lambda f: f["filed"]):
                latest[f["period"]] = f
            for f in latest.values():
                base = f"https://www.sec.gov/Archives/edgar/data/{ciks[0]}/{f['accession'].replace('-', '')}/"
                try:
                    idx = json.loads(get(base + "index.json"))
                except Exception as e:
                    notes.append(f"{trust} {f['accession']}: index failed ({e})")
                    continue
                xmls = [i["name"] for i in idx["directory"]["item"] if i["name"].lower().endswith(".xml") and "primary_doc" not in i["name"].lower()]
                if not xmls:
                    notes.append(f"{trust} {f['accession']}: no structured vote table (older text format)")
                    unreadable.append({"family": family, "cik": ciks[0], "trust": f["trust"], "period": f["period"], "accession": f["accession"]})
                    continue
                filings_used.append({**f, "family": family, "cik": ciks[0], "url": base})
                for xname in xmls:
                  with tempfile.NamedTemporaryFile(suffix=".xml") as tmp:
                    get(base + xname, stream_to=tmp)
                    tmp.flush()
                    for rec in parse_votes(tmp.name, None):
                        if "issuer" in (rec.get("proposedBy") or "").lower():
                            continue  # only shareholder proposals are tracked
                        md = to_iso(rec.get("meetingDate", ""))
                        cands = by_key.get((rec["ticker"], md), []) + by_year.get((rec["ticker"], int(md[:4]) if md[:4].isdigit() else 0), [])
                        if not cands:
                            continue
                        desc = rec.get("voteDescription", "")
                        # Rank by both directions together, so a short title that is a subset of a longer
                        # description (e.g. "Impact of Climate Commitments") does not tie with the exact one.
                        scored = sorted(((score(p["title"], desc), p) for p in cands), key=lambda x: x[0][0] + x[0][1], reverse=True)
                        (s, rev), best = scored[0]
                        runner = sum(scored[1][0]) / 2 if len(scored) > 1 else 0.0
                        if s < MIN_MATCH or rev < MIN_REVERSE or (s + rev) / 2 - runner < MIN_MARGIN:
                            if s >= 0.5:
                                review.append({"family": family, "company": rec["ticker"], "meeting_date": md, "npx_description": desc,
                                               "best_guess": best["id"], "title_cover": round(s, 2), "description_cover": round(rev, 2),
                                               "runner_up_combined": round(runner, 2), "source_url": base})
                            continue
                        hows = sorted({v.get("howVoted", "").upper() for v in rec["votes"] if v.get("howVoted")})
                        # One proxyTable record is one fund's (series') vote on one item. More than one
                        # howVoted inside a record means that fund split its own shares (pass-through
                        # voting programs do this), not that different funds disagreed.
                        shares = sum(float(v.get("sharesVoted") or 0) for v in rec["votes"])
                        results.append({
                            "family": family, "trust": f["trust"], "proposal_id": best["id"], "company": rec["ticker"],
                            "meeting_date": md, "npx_description": rec.get("voteDescription"),
                            "match_confidence": round(s, 2), "description_cover": round(rev, 2), "how_voted": hows,
                            "shares_voted": shares, "series_count": len(set(rec["series"])) or None,
                            "source_url": base, "filed": f["filed"], "period": f["period"],
                            "series": sorted(set(rec["series"])),
                            "vote_lines": [{"how": v.get("howVoted", "").upper(), "shares": v.get("sharesVoted")} for v in rec["votes"]],
                        })
                print(f"  {family} / {trust} {f['filed']}: done")

    # One row per fund family per proposal. A family files for many funds, so "split"
    # means its funds did not all vote the same way.
    summary = {}
    for r in results:
        k = (r["family"], r["proposal_id"])
        e = summary.setdefault(k, {"family": r["family"], "proposal_id": r["proposal_id"], "company": r["company"],
                                   "meeting_date": r["meeting_date"], "counts": {}, "sources": set(),
                                   "npx_descriptions": set(), "min_confidence": 1.0})
        e["npx_descriptions"].add(r["npx_description"] or "")
        e["min_confidence"] = min(e["min_confidence"], r["match_confidence"], r["description_cover"])
        # Count fund records by how they voted; a record with several values is a within-fund split.
        key = r["how_voted"][0] if len(r["how_voted"]) == 1 else "SPLIT_WITHIN_FUND"
        e["counts"][key] = e["counts"].get(key, 0) + 1
        e["sources"].add(r["source_url"])
    rows = []
    for e in summary.values():
        c = e["counts"]
        vote = next(iter(c)) if len(c) == 1 and "SPLIT_WITHIN_FUND" not in c else "SPLIT"
        rows.append({**e, "vote": vote, "fund_records": sum(c.values()), "sources": sorted(e["sources"]),
                     "npx_descriptions": sorted(e["npx_descriptions"]), "min_confidence": round(e["min_confidence"], 2)})
    rows.sort(key=lambda r: (r["meeting_date"], r["proposal_id"], r["family"]))
    checked = sorted({p["id"] for p in proposals})
    out = {"generated": dt.date.today().isoformat(),
           "method": ("SEC Form N-PX structured filings (latest filing per period). Only shareholder proposals. A vote matches a proposal "
                      "at the same company and meeting (or the same year when the meeting date is not on file) when at least 75% of the "
                      "title's key words appear in the filing's description, at least 50% the other way, and it beats the next-best "
                      "proposal at that meeting by 0.15. Anything close but not certain goes to the review list."),
           "families": {k: v for k, v in FAMILIES.items() if not want or k in want},
           "proposals_checked": checked, "filings": filings_used, "summary": rows, "review": review, "notes": notes,
           # Which N-PX periods (year ending June 30) each family has a readable filing for.
           "coverage": {fam: sorted({f["period"] for f in filings_used if f["family"] == fam}) for fam in {f["family"] for f in filings_used}},
           "records": results, "trusts_searched": trusts_searched, "unreadable": unreadable}
    Path(args.out).write_text(json.dumps(out, indent=1) + "\n")
    print(f"{len(results)} votes matched across {len(filings_used)} filings; {len(review)} sent to review. Notes: {len(notes)}")


if __name__ == "__main__":
    main()

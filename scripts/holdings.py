"""Quarterly holdings: which investors own which AI companies, from SEC Form 13F.

Runs inside the weekly GitHub job. It only refetches when a newer 13F exists, so
most weeks it does almost nothing. Investors that do not file 13F (for example
Norges Bank, which publishes its own holdings) are kept as they are.

Needs SEC_USER_AGENT (a private GitHub secret, "Name email"), because the SEC
refuses automated requests without a contact. Without it, the script skips quietly.
"""

import json
import os
import re
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
UA = os.environ.get("SEC_USER_AGENT", "").strip()

# Investors to track. The SEC company search finds each one's CIK the first time.
INVESTORS = {
    "parnassus-investments": "Parnassus Investments",
    "trillium-asset-management": "Trillium Asset Management",
    "boston-common-asset-management": "Boston Common Asset Management",
    "zevin-asset-management": "Zevin Asset Management",
    "domini-impact-investments": "Domini Impact Investments",
    "arjuna-capital": "Arjuna Capital",
    "northstar-asset-management": "NorthStar Asset Management",
    "amalgamated-bank": "Amalgamated Bank",
    "federated-hermes": "Federated Hermes",
    "legal-general": "Legal & General Group",
    "nys-common-retirement-fund": "New York State Common Retirement Fund",
    "calpers": "California Public Employees Retirement System",
    "calstrs": "California State Teachers Retirement System",
    "blackrock": "BlackRock, Inc.",
    "vanguard": "Vanguard Group Inc",
    "state-street": "State Street Corp",
}

# Companies matched by issuer name in the 13F table (CUSIPs differ by share class).
ISSUERS = {
    "MSFT": r"^MICROSOFT", "GOOGL": r"^ALPHABET", "META": r"^META PLATFORMS", "AMZN": r"^AMAZON",
    "NVDA": r"^NVIDIA", "AAPL": r"^APPLE INC", "TSLA": r"^TESLA", "ORCL": r"^ORACLE",
    "CRWV": r"^COREWEAVE", "AMD": r"^ADVANCED MICRO", "AVGO": r"^BROADCOM",
}


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        body = r.read()
    time.sleep(0.2)
    return body


def find_cik(name):
    q = urllib.parse.urlencode({"company": name, "type": "13F-HR", "owner": "include", "count": 10, "action": "getcompany", "output": "atom"})
    xml = get("https://www.sec.gov/cgi-bin/browse-edgar?" + q).decode("utf-8", "ignore")
    m = re.search(r"<cik>(\d+)</cik>", xml) or re.search(r"CIK=(\d{6,10})", xml)
    return int(m.group(1)) if m else None


def latest_13f(cik):
    sub = json.loads(get(f"https://data.sec.gov/submissions/CIK{cik:010d}.json"))
    r = sub["filings"]["recent"]
    for i, form in enumerate(r["form"]):
        if form == "13F-HR":
            return r["accessionNumber"][i], r["reportDate"][i]
    return None, None


def read_table(cik, acc):
    base = f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc.replace('-', '')}/"
    idx = json.loads(get(base + "index.json"))
    xmls = [f["name"] for f in idx["directory"]["item"] if f["name"].lower().endswith(".xml") and "primary_doc" not in f["name"].lower()]
    if not xmls:
        return [], base
    root = ET.fromstring(get(base + xmls[0]))
    rows = []
    for el in root.iter():
        if el.tag.endswith("infoTable"):
            v = {c.tag.split("}")[-1]: (c.text or "") for c in el.iter()}
            rows.append({"issuer": v.get("nameOfIssuer", "").upper(), "value": float(v.get("value") or 0), "shares": float(v.get("sshPrnamt") or 0)})
    return rows, base


def main():
    if "@" not in UA:
        print("SEC_USER_AGENT not set; skipping 13F holdings.")
        return
    path = DATA / "holdings.json"
    h = json.loads(path.read_text()) if path.exists() else {"investors": [], "holdings": []}
    cfg_path = DATA / "holdings_config.json"
    cfg = json.loads(cfg_path.read_text()) if cfg_path.exists() else {}
    inv = {i["id"]: i for i in h["investors"]}

    for slug, name in INVESTORS.items():
        try:
            cik = cfg.get(slug) or find_cik(name)
            if not cik:
                print(f"  no 13F filer found for {name}")
                continue
            cfg[slug] = cik
            acc, period = latest_13f(cik)
            if not acc or inv.get(slug, {}).get("accession") == acc:
                continue  # nothing newer
            rows, base = read_table(cik, acc)
            total = sum(r["value"] for r in rows) or None
            h["holdings"] = [x for x in h["holdings"] if x["investor"] != slug]
            for tic, pat in ISSUERS.items():
                hits = [r for r in rows if re.search(pat, r["issuer"])]
                if hits:
                    val = sum(r["value"] for r in hits)
                    h["holdings"].append({"investor": slug, "company": tic, "value_usd": val,
                                          "shares": sum(r["shares"] for r in hits),
                                          "pct_of_portfolio": round(100 * val / total, 2) if total else None,
                                          "source_url": base})
            inv[slug] = {"id": slug, "name": name, "cik": cik, "filing_url": base, "report_period": period, "accession": acc}
            print(f"  {name}: 13F for {period}")
        except Exception as e:
            print(f"  {name}: skipped ({e})")

    h["investors"] = list(inv.values())
    path.write_text(json.dumps(h, indent=2) + "\n")
    cfg_path.write_text(json.dumps(cfg, indent=2) + "\n")


if __name__ == "__main__":
    main()

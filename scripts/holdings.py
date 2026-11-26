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
    # Added 2026-11-26: more investors that file or back AI proposals and file 13F.
    "green-century": "Green Century Capital Management",
    "boston-trust-walden": "Boston Trust Walden",
    "impax": "Impax Asset Management",
    "wespath": "Wespath Benefits and Investments",
    "friends-fiduciary": "Friends Fiduciary Corp",
    "dana": "Dana Investment Advisors",
    "harrington": "Harrington Investments",
    "clean-yield": "Clean Yield Asset Management",
    "first-affirmative": "First Affirmative Financial Network",
    "bailard": "Bailard",
    "newground": "Newground Social Investment",
    "nuveen-tiaa": "Nuveen",
    "mercy": "Mercy Investment Services",
    "azzad": "Azzad Asset Management",
    "fidelity": "FMR LLC",
    "t-rowe-price": "T. Rowe Price Associates",
    "jpmorgan-am": "JPMorgan Chase & Co",
}

# Companies matched by issuer name in the 13F table (CUSIPs differ by share class).
ISSUERS = {
    "MSFT": r"^MICROSOFT", "GOOGL": r"^ALPHABET", "META": r"^META PLATFORMS", "AMZN": r"^AMAZON",
    "NVDA": r"^NVIDIA", "AAPL": r"^APPLE INC", "TSLA": r"^TESLA", "ORCL": r"^ORACLE",
    "CRWV": r"^COREWEAVE", "AMD": r"^ADVANCED MICRO", "AVGO": r"^BROADCOM",
    # Added 2026-11-26: every company in data/companies.json under US proxy rules.
    "IBM": r"^INTERNATIONAL BUSINESS MACH", "CRM": r"^SALESFORCE", "ADBE": r"^ADOBE", "INTU": r"^INTUIT(\s+INC\.?)?$",  # not Intuitive Surgical or Intuitive Machines
    "VRSK": r"^VERISK", "WDAY": r"^WORKDAY", "NOW": r"^SERVICENOW", "PLTR": r"^PALANTIR", "CSCO": r"^CISCO",
    "AXON": r"^AXON ENTERPRISE", "MSI": r"^MOTOROLA SOLUTIONS", "NFLX": r"^NETFLIX", "DIS": r"^(WALT )?DISNEY",
    "CMCSA": r"^COMCAST", "DLR": r"^DIGITAL REALTY", "SO": r"^SOUTHERN CO\b", "ANT": r"^ANTHROPIC", "SPCX": r"^SPACE EXPLORATION|^SPACEX",
}
# When the company list changes, every investor's latest 13F is read again, not only newer filings.
ISSUERS_VERSION = "2026-11-26c"  # b: exact Intuit match, options left out, values in dollars, stale filers dropped; c: shares only (no notes)


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
            if (v.get("putCall") or "").strip():
                continue  # options (puts and calls) are not shares held
            if (v.get("sshPrnamtType") or "SH").strip().upper() != "SH":
                continue  # principal amounts (convertible notes and other debt) are not shares
            rows.append({"issuer": v.get("nameOfIssuer", "").strip().upper(), "value": float(v.get("value") or 0), "shares": float(v.get("sshPrnamt") or 0)})
    # 13F values were in thousands of dollars before 2023, and some filers still report that way. A median
    # implied price under $2 a share means the table is in thousands.
    prices = sorted(r["value"] / r["shares"] for r in rows if r["shares"] > 0 and r["value"] > 0)
    if prices and prices[len(prices) // 2] < 2:
        for r in rows:
            r["value"] *= 1000
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
            if not acc or (inv.get(slug, {}).get("accession") == acc and h.get("issuers_version") == ISSUERS_VERSION):
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

    # Only current filings: a filer whose latest 13F is more than two quarters older than the newest one
    # (it stopped filing under that CIK, or files under another) is listed as not current, with no positions.
    periods = sorted(i.get("report_period") or "" for i in inv.values() if i.get("cik"))
    newest = periods[-1] if periods else ""
    if newest:
        y, m = int(newest[:4]), int(newest[5:7]) - 6
        cutoff = f"{y + (m - 1) // 12}-{(m - 1) % 12 + 1:02d}-01"
        stale = {k for k, i in inv.items() if i.get("cik") and (i.get("report_period") or "") < cutoff}
        h["holdings"] = [x for x in h["holdings"] if x["investor"] not in stale]
        for k, i in inv.items():
            i.pop("not_current", None)
            if k in stale:
                i["not_current"] = True
        h["as_of_quarter"] = f"{newest[:4]}Q{(int(newest[5:7]) + 2) // 3}"
        print(f"  not current (latest 13F before {cutoff}): {sorted(stale)}")
    # Check: a position whose implied price is far from the other holders' for that company is printed for review.
    by = {}
    for x in h["holdings"]:
        if x.get("shares") and x.get("value_usd") and x["investor"] != "nbim":
            by.setdefault(x["company"], []).append(x)
    for tic, xs in by.items():
        ps = sorted(x["value_usd"] / x["shares"] for x in xs)
        med = ps[len(ps) // 2]
        for x in xs:
            p = x["value_usd"] / x["shares"]
            if abs(p - med) > 0.2 * med:
                print(f"  CHECK {x['investor']} {tic}: ${p:,.2f} a share against a median of ${med:,.2f}")

    h["investors"] = list(inv.values())
    h["issuers_version"] = ISSUERS_VERSION
    h["note"] = ("Positions in the companies under US proxy rules, from each investor's latest Form 13F (US equity holdings "
                 "of managers over $100 million), plus Norges Bank's own published holdings. A 13F shows the manager's holdings, "
                 "not who can file a proposal; pct_of_portfolio is the share of that 13F's reported value.")
    path.write_text(json.dumps(h, indent=2) + "\n")
    cfg_path.write_text(json.dumps(cfg, indent=2) + "\n")


if __name__ == "__main__":
    main()

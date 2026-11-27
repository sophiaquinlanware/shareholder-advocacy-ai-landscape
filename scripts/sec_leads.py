"""Weekly leads from two free SEC sources, for a person to review. Writes data/sec_leads.json.

1. Rule 14a-8(j) notices. Since August 14, 2026 SEC staff no longer respond to no-action requests, but a company
   that plans to leave a shareholder proposal out of its proxy must still notify the SEC, and the SEC posts each
   notice. This is now the only official record of planned exclusions. For notices at companies this site tracks,
   the PDF is read and checked for AI terms.
2. EDGAR full-text search: proxy statements (PRE 14A, DEF 14A) whose text includes both an AI term and the
   request language of a shareholder proposal. Most hits at tracked companies are proposals already recorded;
   the rest are leads (a new proposal, or a company to consider adding).

Leads at companies this site tracks go straight into data/proposals.json, so they flow into every table, chart and
the network like any other proposal, marked auto_detected and reviewed: false ("found automatically in the SEC
record, not yet reviewed") until a person confirms them:
  - a 14a-8(j) notice whose proposal text has AI terms becomes an excluded proposal, sourced to the notice;
  - a proxy statement filed in the last 120 days with an AI request clause, at a company with no AI proposal
    recorded for that season, becomes an upcoming proposal, sourced to the proxy statement.
Leads at companies not tracked stay in data/sec_leads.json for a person to weigh (the site's selection rule decides
whether a company is added). Uses SEC_USER_AGENT (GitHub secret); without it, a generic research agent. Stays well under
the SEC's 10 requests per second.
"""

import datetime as dt
import io
import json
import os
import re
import time
import urllib.parse
import urllib.request
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
UA = os.environ.get("SEC_USER_AGENT") or "research-review contact@example.org"
NOTICE_PAGES = {  # season label -> SEC listing page
    "2026-2027": "https://www.sec.gov/rules-regulations/shareholder-proposals/2026-2027-rule-14a-8-j-notifications",
}
SEARCHES = ['"artificial intelligence" "shareholders request"', '"artificial intelligence" "stockholders request"',
            '"AI" "shareholders request the board"', '"generative AI" "shareholders request"']
AI_TERMS = re.compile(r"artificial intelligence|\bAI\b|generative AI|generative artificial|machine learning|algorithm|data center|datacenter|large language model|xAI|OpenAI", re.I)


def get(url, binary=False, tries=3):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Encoding": "identity"})
            with urllib.request.urlopen(req, timeout=90) as r:
                body = r.read()
            time.sleep(0.25)
            return body if binary else body.decode("utf-8", "replace")
        except Exception:
            if i == tries - 1:
                raise
            time.sleep(3 * (i + 1))


def norm(s):
    s = re.sub(r"[^a-z0-9 ]", " ", s.lower())
    s = re.sub(r"\b(inc|incorporated|corp|corporation|co|company|holdings|plc|ltd|the|group)\b", " ", s)
    return " ".join(s.split())


def pdf_text(url):
    try:
        from pypdf import PdfReader
    except ImportError:
        return None
    try:
        r = PdfReader(io.BytesIO(get(url, binary=True)))
        return "\n".join((p.extract_text() or "") for p in r.pages[:12])
    except Exception:
        return None


def notices(companies):
    by_name = {norm(c["name"]): c for c in companies}
    out = []
    for season, page in NOTICE_PAGES.items():
        html = get(page)
        for m in re.finditer(r'<li[^>]*>\s*<a href="(/files/corpfin/no-action/14a-8/[^"]+\.pdf)"[^>]*>([^<]+)</a>\s*,?\s*([A-Z][a-z]+ \d{1,2}, \d{4})', html):
            path, name, date = m.group(1), m.group(2).strip().rstrip(","), m.group(3)
            c = by_name.get(norm(name))
            row = {"season": season, "company_name": name, "date": dt.datetime.strptime(date, "%B %d, %Y").date().isoformat(),
                   "url": "https://www.sec.gov" + path, "ticker": c["ticker"] if c else None}
            if c:
                text = pdf_text(row["url"])
                if text is None:
                    row["ai_terms"] = None
                else:
                    hits = sorted({h.group(0).lower() for h in AI_TERMS.finditer(text)})
                    row["ai_terms"] = hits
                    # The proposal's own resolved clause, where the notice quotes it (first 400 characters).
                    rc = re.search(r"(RESOLVED[:,].{20,400}?)(?:\n\n|Supporting Statement|$)", text, re.S | re.I)
                    row["resolved_excerpt"] = re.sub(r"\s+", " ", rc.group(1)).strip()[:400] if rc else None
            out.append(row)
    return out


REQUEST = re.compile(r"(RESOLVED|[Ss]hareholders request|[Ss]tockholders request|[Ss]hareowners request)")


def request_clauses(url):
    """The request clauses in a proxy statement that mention AI (each cut to 400 characters)."""
    import html as h
    try:
        t = get(url)
    except Exception:
        return None
    t = re.sub(r"\s+", " ", h.unescape(re.sub(r"<[^>]+>", " ", t)))
    out = []
    for m in REQUEST.finditer(t):
        clause = t[m.start(): m.start() + 400]
        if AI_TERMS.search(clause) and clause not in out:
            out.append(clause)
    return out


def proxy_leads(companies, proposals, today):
    ciks = {str(int(c["cik"])): c for c in companies if c.get("cik")}
    have = {(p["company"], p["year"]) for p in proposals}
    start = (dt.date.fromisoformat(today) - dt.timedelta(days=550)).isoformat()
    seen, out = set(), []
    for q in SEARCHES:
        params = {"q": q, "forms": "PRE 14A,DEF 14A", "dateRange": "custom", "startdt": start, "enddt": today}
        for frm in (0, 100):
            data = json.loads(get("https://efts.sec.gov/LATEST/search-index?" + urllib.parse.urlencode({**params, "from": frm})))
            hits = data.get("hits", {}).get("hits", [])
            for h in hits:
                s = h["_source"]
                acc = h["_id"].split(":")[0]
                if acc in seen:
                    continue
                seen.add(acc)
                cik = str(int((s.get("ciks") or ["0"])[0]))
                c = ciks.get(cik)
                sic = (s.get("sics") or [""])[0]
                if not c and (sic.startswith("67") or "FUND" in (s.get("display_names") or [""])[0].upper()):
                    continue  # investment funds' own proxies
                year = int(s["file_date"][:4])
                doc = h["_id"].split(":")[1]
                row = {"company_name": re.sub(r"\s+\(CIK.*$", "", (s.get("display_names") or [""])[0]).strip(), "cik": cik,
                       "ticker": c["ticker"] if c else None, "form": s.get("form"), "filed": s.get("file_date"),
                       "url": f"https://www.sec.gov/Archives/edgar/data/{cik}/{acc.replace('-', '')}/{doc}",
                       "matched": q, "sic": sic}
                if doc.lower().endswith(".pdf"):
                    # A courtesy PDF: read the filing's HTML proxy instead (largest .htm in the filing index).
                    try:
                        items = json.loads(get(row["url"].rsplit("/", 1)[0] + "/index.json"))["directory"]["item"]
                        htm = sorted((i for i in items if i["name"].lower().endswith((".htm", ".html")) and "index" not in i["name"].lower()),
                                     key=lambda i: -int(i.get("size") or 0))
                        if htm:
                            row["url"] = row["url"].rsplit("/", 1)[0] + "/" + htm[0]["name"]
                    except Exception:
                        pass
                clauses = None if row["url"].lower().endswith(".pdf") else request_clauses(row["url"])
                if clauses is not None and not clauses:
                    continue  # AI text and a request clause, but not in the same clause: not a lead
                row["clauses"] = clauses
                row["status"] = ("tracked company, proposal recorded that season" if c and any((c["ticker"], y) in have for y in (year, year + 1))
                                 else "tracked company, no AI proposal recorded: check" if c else "company not tracked: check")
                out.append(row)
            if len(hits) < 100:
                break
    order = {"tracked company, no AI proposal recorded: check": 0, "company not tracked: check": 1, "tracked company, proposal recorded that season": 2}
    return sorted(out, key=lambda r: (order[r["status"]], r["company_name"], r["filed"]))


def sentence(clause):
    t = re.sub(r"^(RESOLVED\s*[:,]?\s*)", "", clause, flags=re.I).strip()
    t = re.split(r"(?<=[a-z\)])\.\s", t)[0]
    return (t[:197] + "…") if len(t) > 200 else t


def integrate(leads, proposals_doc, today):
    """Add leads at tracked companies to proposals.json (once each; a person's later edits are kept)."""
    P = proposals_doc["proposals"]
    have_ids = {p["id"] for p in P}
    by_source = {p.get("source_url") for p in P} | {p.get("proxy_url") for p in P} | {p.get("status_source_url") for p in P}
    note = "Found automatically in the SEC record; not yet reviewed."
    added = []
    for n in leads["notices"]:
        if not (n.get("ticker") and n.get("ai_terms") and n["url"] not in by_source):
            continue
        year = int(n["season"].split("-")[1])
        slug = re.sub(r"[^a-z0-9]+", "-", n["url"].rsplit("/", 1)[1].replace("-14a8.pdf", "").lower())
        pid = f"{n['ticker'].lower()}-{year}-notice-{slug}"
        if pid in have_ids:
            continue
        text = n.get("resolved_excerpt") or ""
        P.append({"id": pid, "company": n["ticker"], "year": year, "meeting_date": None, "item": None,
                  "title": sentence(text) if text else f"Shareholder proposal at {n['company_name']} (see the company's notice)",
                  "proponent": None, "topic": "Not yet classified", "subtopic": "", "status": "excluded", "support_pct": None,
                  "status_reason": f"{n['company_name']} notified the SEC on {n['date']} under Rule 14a-8(j) that it intends to leave this proposal out of its proxy statement. SEC staff no longer respond to these notices (August 14, 2026).",
                  "status_source_url": n["url"], "source_url": n["url"], "proxy_url": None,
                  "plain_summary": text, "plain_summary_source": n["url"], "notes": note,
                  "auto_detected": today, "reviewed": False})
        have_ids.add(pid); added.append(pid)
    recent = (dt.date.fromisoformat(today) - dt.timedelta(days=120)).isoformat()
    for r in leads["proxy_leads"]:
        if not (r.get("ticker") and r.get("clauses") and r["status"].startswith("tracked company, no") and r["filed"] >= recent and r["url"] not in by_source):
            continue
        year = int(r["filed"][:4])
        for k, clause in enumerate(r["clauses"][:3]):
            pid = f"{r['ticker'].lower()}-{year}-auto-{r['filed'].replace('-', '')}-{k + 1}"
            if pid in have_ids:
                continue
            P.append({"id": pid, "company": r["ticker"], "year": year, "meeting_date": None, "item": None,
                      "title": sentence(clause), "proponent": None, "topic": "Not yet classified", "subtopic": "",
                      "status": "upcoming", "support_pct": None, "proxy_url": r["url"], "source_url": r["url"],
                      "plain_summary": clause, "plain_summary_source": r["url"], "notes": note,
                      "auto_detected": today, "reviewed": False})
            have_ids.add(pid); added.append(pid)
    return added


def main():
    today = dt.date.today().isoformat()
    companies = [c for c in json.loads((DATA / "companies.json").read_text()) if c.get("ticker")]
    proposals = json.loads((DATA / "proposals.json").read_text())["proposals"]
    path = DATA / "sec_leads.json"
    old = json.loads(path.read_text()) if path.exists() else {}
    out = {"about": "Leads from free SEC sources, auto-detected and not yet reviewed: Rule 14a-8(j) notices of planned exclusions "
                    "(the SEC's listing page) and proxy statements whose text pairs AI terms with shareholder-proposal request language "
                    "(EDGAR full-text search). A person confirms each lead before it becomes a record in data/proposals.json.",
           "checked": today, "notices": old.get("notices", []), "proxy_leads": old.get("proxy_leads", [])}
    try:
        out["notices"] = notices(companies)
    except Exception as e:  # keep last week's list if the SEC page can't be read
        print("14a-8(j) notices skipped:", e)
    try:
        out["proxy_leads"] = proxy_leads(companies, proposals, today)
    except Exception as e:
        print("full-text search skipped:", e)
    path.write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    raw = (DATA / "proposals.json").read_text()
    doc = json.loads(raw)
    added = integrate(out, doc, today)
    if added:
        ind = 1 if json.dumps(json.loads(raw), indent=1, ensure_ascii=False) + "\n" == raw else 2
        (DATA / "proposals.json").write_text(json.dumps(doc, indent=ind, ensure_ascii=False) + "\n")
    print(f"proposals.json: {len(added)} added from the SEC record (auto-detected, not yet reviewed): {', '.join(added) or 'none'}")
    tracked = [n for n in out["notices"] if n["ticker"]]
    print(f"sec_leads.json: {len(out['notices'])} 14a-8(j) notices ({len(tracked)} at tracked companies, "
          f"{sum(1 for n in tracked if n.get('ai_terms'))} with AI terms); {len(out['proxy_leads'])} proxy leads "
          f"({sum(1 for r in out['proxy_leads'] if r['status'].endswith('check'))} to check)")


if __name__ == "__main__":
    main()

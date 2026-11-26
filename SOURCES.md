# Where the data comes from

The tracker has two phases.

**Building (one time, November 2026).** Researchers read widely: SEC filings, company bylaws, filer press releases, coalition member lists, law firm memos, fund company pages and news coverage. That built the foundation: the rights map, the advocacy network, the people directory and the influence pathways.

**Keeping it current (ongoing).** After the foundation, the tracker leans on a small set of sources that already collect what investors file. Each type of fact has one main source of truth.

| What | Main source of truth | How it is checked | How often |
|---|---|---|---|
| Proposals that reach the ballot, board responses | SEC EDGAR proxy statements (DEF 14A) | Automatic: `scripts/refresh.py` | Weekly |
| Vote results | SEC EDGAR 8-K, Item 5.07 | Automatic | Weekly |
| Investor letters to other shareholders | SEC EDGAR exempt solicitations (PX14A6G) | Automatic | Weekly |
| Proposals filed and later withdrawn (these never reach the proxy) | As You Sow's shareholder resolution tracker and the annual *Proxy Preview* report; ICCR's annual proxy resolutions guide | Checked by hand when each is published | Each proxy season (roughly January to March) |
| How funds voted | SEC EDGAR Form N-PX | Automatic once the institutional votes tab is built | Yearly (filed by August 31) |
| Bylaws and proposal thresholds | Company 8-K and 10-K exhibits (bylaws, usually Exhibit 3.2) | Automatic flag when a company files a bylaw change (8-K Item 5.03) | Weekly flag, reviewed by hand |
| Ties between public companies and AI labs | Company 10-K and 10-Q filings and press releases | Reviewed by hand | Quarterly |
| People leading engagement | Each organization's own team or leadership page | Links checked automatically, roles reviewed by hand | Quarterly |
| Pass-through voting programs | Vanguard, BlackRock, Schwab and State Street program pages | Reviewed by hand | Twice a year |
| Rule changes (Rule 14a-8, state law) | SEC press releases and rule pages; state legislature sites | Reviewed by hand | As they happen |

**Linked, never copied.** The PRI Resolution Database is the most complete cross-topic list of resolutions. Its terms do not allow republishing its content, so the site links to it and does not copy from it.

**Rules every row follows.**
- Every fact links to its source.
- Anything found automatically is marked "auto-detected, not yet reviewed" until a person confirms it.
- The site informs. It does not coordinate votes.

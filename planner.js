// Engagement planner: pick a company and an ask (optionally your own organization) and see, on one page, what
// has been asked where (a grid to brainstorm from), how this ask has gone, timing and rights at the company,
// organizations with a public record on the ask or the company and why, your own organization's record, and what
// policy already requires. Every signal links to its source. It informs; it does not recommend a vote or a partner
// (PRODUCT.md "Never claim"), and it speaks only for this dataset. Reviews: docs/reviews/2026-11-26 planner *.

(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const src = (url, label = "source") => (url ? ` <a class="src" href="${esc(url)}" target="_blank" rel="noopener">[${esc(label)}]</a>` : "");
  const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;
  const fmt = (iso) => (iso ? window.DATES.long(String(iso).slice(0, 10)) : "");
  const median = (v) => { if (!v.length) return null; const s = [...v].sort((a, b) => a - b), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const pct = (x) => (x == null ? "" : `${Math.round(x * 10) / 10}%`);
  const money = (usd) => (usd < 1e6 ? "under $1M" : `$${Math.round(usd / 1e6).toLocaleString("en-US")}M`);
  // A deadline marked open when the data was built may have passed since.
  const today = () => (window.RULES ? window.RULES.todayISO() : new Date().toISOString().slice(0, 10)); // in the deadline time zone, not UTC
  const deadlineOpen = (c) => c.next_proposal_deadline_status === "open" && String(c.next_proposal_deadline || "") >= today();

  // Fund families (data/fund_votes.json) by their organization in the network.
  const FAMILY_ORG = { "Parnassus": "parnassus", "Calvert": "calvert-research-and-management", "Domini": "domini", "Green Century": "green-century",
    "Impax (Pax)": "impax", "Praxis": "praxis-mutual-funds-everence-financial", "TIAA-CREF": "nuveen-tiaa", "Vanguard": "vanguard", "BlackRock (iShares)": "blackrock" };
  const LEAD = new Set(["lead filer", "filed (named in proxy)"]), CO = new Set(["co-filer", "coordinated by"]);
  const BACK = new Set(["supported by", "exempt solicitation", "exempt solicitation for"]);
  // Kinds of public record, in the order shown. The table sorts by how many kinds apply, then by number of filings.
  const KINDS = [
    { id: "lead", label: "Lead-filed this ask elsewhere" },
    { id: "co", label: "Co-filed this ask elsewhere" },
    { id: "back", label: "Backed this ask elsewhere" },
    { id: "here", label: "Filed or backed at this company" },
    { id: "votes", label: "Its funds voted FOR this ask" },
    { id: "holds", label: "Holds shares in this company" },
    { id: "coal", label: "Shares a coalition with your organization" },
  ];
  const STORE = "planner-shortlist-v1", MINE = "planner-mine-v1";
  // Settings last for the visit (sessionStorage); the shortlist is saved work and stays in this browser.
  const visit = { get(k, d) { try { const v = sessionStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked */ } } };

  let D, S, idx;
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage blocked: kept for this visit */ } } };

  function index() {
    const nodes = new Map(D.graph.nodes.map((n) => [n.id, n]));
    const orgs = D.graph.nodes.filter((n) => n.type === "investor" || n.type === "coalition");
    const acts = [], holdsAt = [], members = new Map();
    D.graph.edges.forEach((e) => {
      const a = nodes.get(e.source), b = nodes.get(e.target);
      if (!a || !b) return;
      if ((a.type === "investor" || a.type === "coalition") && b.type === "proposal") acts.push({ org: a.id, prop: b, type: e.type, url: e.source_url });
      if (e.type === "holds shares in" && b.type === "company") holdsAt.push({ org: a.id, co: b.ticker || String(b.id).replace(/^co-/, ""), value: e.value_usd, url: e.source_url });
      if (e.type === "member of") { if (!members.has(a.id)) members.set(a.id, new Set()); members.get(a.id).add(b.id); }
    });
    const people = new Map();
    D.people.forEach((p) => { if (!people.has(p.org_id)) people.set(p.org_id, []); people.get(p.org_id).push(p); });
    // Where a holding comes from: the investor's filing and its period (holdings.json), matched by the filing URL.
    const holdSrc = new Map();
    ((D.holdings && D.holdings.investors) || []).forEach((i) => {
      const label = i.cik ? `Form 13F for the quarter ending ${fmt(i.report_period)}` : `${i.name} holdings report, ${fmt(i.report_period)}`;
      [i.filing_url, i.data_url].filter(Boolean).forEach((u) => holdSrc.set(u, label));
    });
    // Proposals lead-filed by an organization that files from a critical stance on ESG (for example NLPC, NCPPR).
    const critical = new Set(acts.filter((a) => LEAD.has(a.type) && /anti-ESG/i.test((nodes.get(a.org) || {}).org_type || "")).map((a) => a.prop.sec_id || a.prop.id));
    return { nodes, orgs, acts, holdsAt, members, people, holdSrc, critical, votes: (D.fundVotes && D.fundVotes.summary) || [] };
  }

  const askOf = (id) => D.asks.find((a) => a.id === id) || { label: id };
  const coById = (key) => D.companies.find((c) => (c.id || c.ticker) === key || c.ticker === key);
  const tick = (c) => (c && c.ticker && !/^(private|UNVERIFIED)$/i.test(c.ticker) ? c.ticker : "");
  const usCos = () => D.companies.filter((c) => c.shareholder_route === "US proxy rules apply" && tick(c)).sort((a, b) => a.name.localeCompare(b.name));
  const roleLabel = (c) => (window.ROLES ? window.ROLES.label(window.ROLES.roleOf(c)) : c.tier || "");

  // ---------- Grid: asks × companies (brainstorm) ----------
  function grid() {
    const cos = usCos();
    const cell = new Map();
    D.proposals.forEach((p) => {
      if (!p.ask_id) return;
      const k = p.ask_id + "|" + p.company;
      const x = cell.get(k) || { n: 0, best: null, up: false, crit: 0 };
      x.n += 1;
      if (idx.critical.has(p.id)) x.crit += 1;
      // Highest support leaves out filings from filers critical of ESG, as the record below does.
      if (p.support_pct != null && !idx.critical.has(p.id)) x.best = Math.max(x.best ?? 0, p.support_pct);
      if (p.status === "upcoming") x.up = true;
      cell.set(k, x);
    });
    const totals = new Map(D.asks.map((a) => [a.id, D.proposals.filter((p) => p.ask_id === a.id).length]));
    const head = cos.map((c) => `<th scope="col"><abbr title="${esc(c.name)}">${esc(tick(c))}</abbr></th>`).join("");
    const rows = D.asks.map((a, r) => `<tr><th scope="row" class="pl-mx-row"><span class="pl-long">${esc(a.label)}</span><span class="pl-short" aria-hidden="true">${esc(a.short_label || a.label)}</span> <span class="ticker">${totals.get(a.id)} filed</span></th>${cos.map((c, i) => {
      const x = cell.get(a.id + "|" + tick(c));
      const on = S.co === (c.id || c.ticker) && S.ask === a.id;
      const label = `${a.label} at ${c.name}: ${x ? `filed ${plural(x.n, "time")}${x.best != null ? `, highest support ${Math.round(x.best)}%` : ""}${x.best == null ? ", not voted (withdrawn, excluded or still to come)" : ""}${x.up ? ", on the next ballot" : ""}${x.crit ? `, ${x.crit === x.n ? (x.n === 1 ? "by a filer" : "all by filers") : `${x.crit} of them by filers`} critical of ESG${x.best != null ? " (left out of the highest support)" : ""}` : ""}` : "not filed in this dataset"}`;
      return `<td><button type="button" class="pl-mx${x ? " filed" : ""}${x && x.crit === x.n ? " crit" : ""}${x && x.up ? " up" : ""}" data-co="${esc(c.id || c.ticker)}" data-ask="${esc(a.id)}" data-r="${r}" data-c="${i}" tabindex="${on ? 0 : -1}"${on ? ' aria-current="true"' : ""} aria-label="${esc(label)}. Opens the plan below." title="${esc(label)}. Click to open the plan below.">${x ? (x.best != null ? Math.round(x.best) : "•") : ""}</button></td>`;
    }).join("")}</tr>`).join("");
    return `<section class="pl-card pl-wide" aria-labelledby="pl-h-mx"><h3 id="pl-h-mx">AI shareholder engagement tracker: each ask, by company</h3>
      <p class="pl-mx-do"><strong>Click a square to plan an engagement for that company and ask: the plan opens below the grid.</strong> Arrow keys move between squares.</p>
      <p class="status-note">Rows are asks (with how often each has been filed), columns are the US-listed companies. Leaving out filings from filers critical of ESG:</p>
      <ul class="pl-mx-key" aria-label="What the squares show">
        <li><span class="pl-mx filed" aria-hidden="true">34</span> highest support that ask has had at that company (% for ÷ (for + against))</li>
        <li><span class="pl-mx filed" aria-hidden="true">•</span> filed but not voted: withdrawn, excluded or still to come</li>
        <li><span class="pl-mx filed up" aria-hidden="true"></span> outlined: on the next ballot</li>
        <li><span class="pl-mx filed crit" aria-hidden="true"></span> dashed: filed only by filers critical of ESG</li>
        <li><span class="pl-mx" aria-hidden="true"></span> empty: no filing there in this dataset</li>
      </ul>
      <div class="table-wrap pl-mx-wrap"><table class="pl-mx-table"><thead><tr><th scope="col"><span class="visually-hidden">Ask</span></th>${head}</tr></thead><tbody>${rows}</tbody></table></div></section>`;
  }

  // ---------- How this ask has gone ----------
  function record(c, ask) {
    const t = tick(c);
    const all = D.proposals.filter((p) => p.ask_id === ask);
    const here = all.filter((p) => p.company === t).sort((a, b) => String(b.meeting_date || b.year).localeCompare(String(a.meeting_date || a.year)));
    const crit = all.filter((p) => idx.critical.has(p.id));
    const voted = all.filter((p) => p.status === "voted" && p.support_pct != null && !idx.critical.has(p.id));
    const med = median(voted.map((p) => p.support_pct));
    const best = voted.slice().sort((a, b) => b.support_pct - a.support_pct)[0];
    const cos = [...new Set(all.map((p) => p.company))];
    const thr = window.RULES && window.RULES.RESUBMISSION_THRESHOLDS;
    const row = (p) => `<li><strong>${esc(p.company)}</strong> ${esc(p.year)}: ${esc(p.title)}${p.reviewed === false ? ` <span class="unverified">found automatically in the SEC record, not yet reviewed</span>` : ""} · ${esc(p.status)}${p.support_pct != null ? ` · ${esc(p.support_pct)}%` : ""}${idx.critical.has(p.id) ? ` <span class="ticker">filed by a filer critical of ESG</span>` : ""}${src(p.results_url || p.proxy_url || p.source_url, p.results_url ? "results" : p.proxy_url ? "proxy" : "source")}</li>`;
    const critNote = crit.length ? ` ${plural(crit.length, "filing")} came from ${crit.length === 1 ? "a filer" : "filers"} critical of ESG and ${crit.length === 1 ? "is" : "are"} left out of the support figures${voted.length ? "" : ", which leaves no vote to summarize"}.` : "";
    return `<section class="pl-card" aria-labelledby="pl-h-rec"><h3 id="pl-h-rec">How this ask has gone</h3>
      <p>${all.length ? `Filed ${plural(all.length, "time")} at ${plural(cos.length, "company", "companies")} in this dataset since ${Math.min(...all.map((p) => p.year))}${voted.length ? `; median support ${pct(med)} across ${plural(voted.length, "vote")}${best ? `, highest ${pct(best.support_pct)} at ${esc(best.company)} ${esc(best.year)}` : ""}` : ""}.${critNote}` : "Not filed at any company in this dataset."}</p>
      <h4>At ${esc(c.name)}</h4>
      ${here.length ? `<ul class="steps tight">${here.map(row).join("")}</ul>${thr ? `<p class="note">SEC resubmission thresholds for a similar proposal within three years: ${thr.join("%, ")}% after one, two or three votes (this site's reading of Rule 14a-8(i)(12)).</p>` : ""}` : `<p class="status-note">Not filed here in this dataset.</p>`}
      ${all.length > here.length ? `<details><summary>Elsewhere (${all.length - here.length})</summary><ul class="steps tight">${all.filter((p) => p.company !== t).sort((a, b) => (b.year || 0) - (a.year || 0)).map(row).join("")}</ul></details>` : ""}
      ${t ? `<div class="campaigns-slot" data-co="${esc(t)}" data-ask="${esc(ask)}"></div>` : ""}
    </section>`;
  }

  // ---------- Timing and rights ----------
  function timing(c) {
    const t = tick(c);
    const upcoming = D.proposals.filter((p) => p.company === t && p.status === "upcoming");
    const route = c.route_status ? { open: "Still open", narrowing: "Narrowing", closed: "Closed" }[c.route_status] || c.route_status : null;
    const ties = ((D.valueChain && D.valueChain.all_ties) || []).filter((x) => x.from === c.id && x.kind === "lab tie").slice(0, 5);
    // Rule numbers keep their case under the uppercase label style ("Rule 14a-8", not "14A-8").
    const fact = (l, v) => `<div><dt>${esc(l).replace(/\b(\d+[a-z]-\d+)\b/g, '<span class="nocaps">$1</span>')}</dt><dd>${v}</dd></div>`;
    const us = c.shareholder_route === "US proxy rules apply";
    const passed = c.next_proposal_deadline && !deadlineOpen(c) && (c.next_proposal_deadline_status === "passed" || String(c.next_proposal_deadline) < today());
    return `<section class="pl-card" aria-labelledby="pl-h-time"><h3 id="pl-h-time">Timing and rights at ${esc(c.name)}</h3>
      <dl class="summary">
        ${fact("Next filing deadline", c.next_proposal_deadline ? `${esc(fmt(c.next_proposal_deadline))}${passed ? " (passed)" : ""}${src(c.next_proposal_deadline_source, "proxy")}` : `<span class="ticker">not on file</span>`)}
        ${fact("AI proposals on the next ballot", upcoming.length ? upcoming.map((p) => `${esc(p.title)} (${esc(fmt(p.meeting_date))})${src(p.proxy_url, "proxy")}`).join("<br>") : `<span class="ticker">none on file</span>`)}
        ${us ? fact("Proposal route if Rule 14a-8 ends", route ? `${esc(route)}.${c.route_status_reason ? ` <span class="ticker">${esc(c.route_status_reason)}</span>` : ""}` : `<span class="ticker">not researched</span>`) : fact("Shareholder route", `${esc((c.shareholder_route || "not researched").replace(/^./, (m) => m.toUpperCase()))}. <span class="ticker">Filing deadlines and the grid above cover US-listed companies under the US proxy rules only.</span>`)}
        ${us ? fact("SEC review if the company excludes your proposal", secReview()) : ""}
        ${us ? fact("SEC minimum holding to file a Rule 14a-8 proposal", `$2,000 of shares held for 3 years, $15,000 for 2 years, or $25,000 for 1 year${link14a8}`) : ""}
        ${c.threshold && c.threshold.text ? fact("Holding needed under the company's own bylaws (outside Rule 14a-8)", esc(c.threshold.text) + src(c.threshold.url)) : ""}
        ${c.director_voting && c.director_voting.text ? fact("Director elections", esc(c.director_voting.text) + src(c.director_voting.url)) : ""}
        ${ties.length ? fact("Ties to frontier labs", ties.map((x) => `${esc(x.to_label || x.to)}: ${esc(x.type)}${src(x.source_url)}`).join("<br>")) : ""}
      </dl></section>`;
  }

  // The SEC staff's role in exclusions, from the dated events on the causal map (data/causality.json).
  const link14a8 = src("https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR8c9733e13b955d6/section-240.14a-8", "rule text");
  function secReview() {
    const ev = new Map(((D.causality && D.causality.events) || []).map((e) => [e.id, e]));
    const e1 = ev.get("sec-noaction-pause"), e2 = ev.get("sec-aug14-statement");
    const courts = ["bjs-14a8-injunction-2026", "chubb-14a8-pi-denied-2026"].map((id) => ev.get(id)).filter(Boolean);
    if (!e1 && !e2) return `<span class="ticker">not on file</span>`;
    return `None at present. Staff stopped answering most no-action requests on ${esc(fmt(e1 && e1.date))}${src(e1 && e1.source_url, "SEC")} and all of them, including (i)(1), on ${esc(fmt(e2 && e2.date))}, until the Division announces otherwise${src(e2 && e2.source_url, "SEC")}.
      <span class="ticker">A company that excludes must still send its Rule 14a-8(j) notice to the SEC and to you 80 days before filing its definitive proxy; a proponent's remedy is in court${courts.length ? `, where 2026 rulings went both ways: ${courts.map((e) => `${esc(e.title)}${src(e.source_url, "order")}`).join("; ")}` : ""}.</span>`;
  }

  // ---------- Support range, logged forecasts and the ask designer (planner-tools.js) ----------
  function tools(c, ask) {
    if (c.shareholder_route !== "US proxy rules apply" || !window.PLANNER_TOOLS) return "";
    const t = tick(c);
    const up = D.proposals.filter((p) => p.company === t && p.ask_id === ask && p.status === "upcoming").map((p) => `${p.title} (${fmt(p.meeting_date)})`).join("; ");
    return `<div class="pl-grid"><div class="pltools-slot" data-kind="forecast" data-co="${esc(t)}" data-ask="${esc(ask)}" data-name="${esc(c.name)}" data-upcoming="${esc(up)}"></div><div class="pltools-slot" data-kind="designer" data-ask="${esc(ask)}"></div></div>`;
  }

  // ---------- Ideas ----------
  function ideas(c, ask) {
    const t = tick(c);
    const R = window.ROLES;
    const role = R ? R.roleOf(c) : c.tier;
    const peers = new Set(D.companies.filter((x) => x !== c && (R ? R.roleOf(x) : x.tier) === role).map(tick).filter(Boolean));
    const hereAsks = new Set(D.proposals.filter((p) => p.company === t).map((p) => p.ask_id));
    const gap = new Map();
    D.proposals.forEach((p) => {
      if (!p.ask_id || p.ask_id === ask || hereAsks.has(p.ask_id) || !peers.has(p.company)) return;
      const g = gap.get(p.ask_id) || { cos: new Set(), sup: [] };
      g.cos.add(p.company); if (p.support_pct != null && !idx.critical.has(p.id)) g.sup.push(p.support_pct);
      gap.set(p.ask_id, g);
    });
    const gaps = [...gap.entries()].sort((a, b) => b[1].cos.size - a[1].cos.size).slice(0, 6);
    const filedAt = new Set(D.proposals.filter((p) => p.ask_id === ask).map((p) => p.company));
    const untouched = usCos().filter((x) => x !== c && !filedAt.has(tick(x)) && deadlineOpen(x))
      .sort((a, b) => String(a.next_proposal_deadline).localeCompare(String(b.next_proposal_deadline))).slice(0, 8);
    return `<section class="pl-card" aria-labelledby="pl-h-ideas"><h3 id="pl-h-ideas">Ideas to explore</h3>
      <h4>Asks filed at other companies in the same role (${esc(roleLabel(c).toLowerCase())}) but not at ${esc(c.name)} (in this dataset)</h4>
      ${gaps.length ? `<ul class="steps tight">${gaps.map(([a, g]) => `<li><button type="button" class="linklike pl-ask" data-ask="${esc(a)}">${esc(askOf(a).label)}</button>: filed at ${esc([...g.cos].join(", "))}${g.sup.length ? `, median support ${pct(median(g.sup))}` : ""}</li>`).join("")}</ul>` : `<p class="status-note">None in this dataset.</p>`}
      <h4>Other US-listed companies with an open filing deadline and no filing of this ask in this dataset</h4>
      ${untouched.length ? `<ul class="steps tight">${untouched.map((x) => `<li><button type="button" class="linklike pl-co" data-co="${esc(x.id || x.ticker)}">${esc(x.name)}</button>: deadline ${esc(fmt(x.next_proposal_deadline))}${src(x.next_proposal_deadline_source, "proxy")}</li>`).join("")}</ul>` : `<p class="status-note">None on file.</p>`}
    </section>`;
  }

  // ---------- Fund votes for an ask by family, with sources and review status ----------
  function familyVotes(ask) {
    const askProps = new Map(D.proposals.filter((p) => p.ask_id === ask).map((p) => [p.id, p]));
    const fam = new Map();
    const held = new Set((D.fundVotes && D.fundVotes.held_back_proposals) || []);
    idx.votes.forEach((r) => {
      const p = askProps.get(r.proposal_id);
      // Rows the matcher could not settle (NEEDS_CHECK) and held-back proposals are not counted as votes.
      if (!p || r.vote === "NEEDS_CHECK" || held.has(r.proposal_id)) return;
      const f = fam.get(r.family) || { for: 0, n: 0, unreviewed: 0, years: new Set(), items: [] };
      f.n += 1; f.years.add(p.year);
      if (r.vote === "FOR") { f.for += 1; f.items.push({ text: `${p.company} ${p.year}`, url: (r.sources || [])[0] }); }
      if (!r.reviewed) f.unreviewed += 1;
      fam.set(r.family, f);
    });
    return fam;
  }
  const voteText = (f) => `${f.for} of ${f.n} proposals, ${[...f.years].sort().join(", ")} (Form N-PX)`;
  const unrev = (f) => (f.unreviewed ? ` <span class="unverified">matched automatically, ${f.unreviewed} of ${f.n} not yet reviewed</span>` : "");

  // ---------- Organizations with a public record on this ask or company ----------
  const score = (x) => x.kinds.size - (x.kinds.has("coal") ? 1 : 0);
  function organizations(c, ask, mine) {
    const t = tick(c);
    const cand = new Map();
    const add = (org, kind, item, url) => {
      if (!org || org === mine || !idx.nodes.has(org)) return;
      if (!cand.has(org)) cand.set(org, { org, kinds: new Map(), filings: 0 });
      const x = cand.get(org);
      if (!x.kinds.has(kind)) x.kinds.set(kind, new Map());
      if (!x.kinds.get(kind).has(item)) x.kinds.get(kind).set(item, url);
    };
    const best = new Map(); // strongest role per organization and proposal: lead > co > backed
    const rank = (type) => (LEAD.has(type) ? 3 : CO.has(type) ? 2 : BACK.has(type) ? 1 : 0);
    idx.acts.forEach((a) => {
      const r = rank(a.type);
      if (!r) return;
      const k = a.org + "|" + a.prop.id;
      if (!best.has(k) || best.get(k).r < r) best.set(k, Object.assign({}, a, { r }));
    });
    best.forEach((a) => {
      const label = `${a.prop.company} ${a.prop.year}`;
      if (a.prop.ask_id === ask && a.prop.company !== t) { add(a.org, a.r === 3 ? "lead" : a.r === 2 ? "co" : "back", label, a.url); if (a.r >= 2 && cand.has(a.org)) cand.get(a.org).filings += 1; }
      if (a.prop.company === t) add(a.org, "here", `${a.r === 3 ? "lead filer" : a.r === 2 ? "co-filer" : "backed"}, ${a.prop.year}: ${String(a.prop.label || "").split(": ").slice(1).join(": ")}`, a.url);
    });
    familyVotes(ask).forEach((f, famName) => {
      if (!f.for) return;
      add(FAMILY_ORG[famName], "votes", voteText(f), f.items[0] && f.items[0].url);
      const x = cand.get(FAMILY_ORG[famName]);
      if (x) x.unrev = f;
    });
    idx.holdsAt.filter((h) => h.co === t).forEach((h) => add(h.org, "holds", `${h.value ? money(h.value) + ", " : ""}${idx.holdSrc.get(h.url) || "holdings filing"}`, h.url));
    if (mine && idx.members.has(mine)) {
      const myC = idx.members.get(mine);
      cand.forEach((x) => [...(idx.members.get(x.org) || [])].filter((k) => myC.has(k)).forEach((k) => add(x.org, "coal", (idx.nodes.get(k) || {}).label || k, (idx.nodes.get(k) || {}).source_url)));
    }
    const all = [...cand.values()].sort((a, b) => score(b) - score(a) || b.filings - a.filings || idx.nodes.get(a.org).label.localeCompare(idx.nodes.get(b.org).label));
    const list = all.slice(0, S.showAll ? all.length : 20);
    const shortlist = getList();
    const rows = list.map((x) => {
      const n = idx.nodes.get(x.org);
      const ppl = (idx.people.get(x.org) || []).slice(0, 2);
      const inList = shortlist.some((s) => s.id === x.org);
      const opp = /anti-ESG/i.test(n.org_type || "");
      const reasons = KINDS.filter((k) => x.kinds.has(k.id)).map((k) => `<li><strong>${esc(k.label)}:</strong> ${[...x.kinds.get(k.id).entries()].map(([it, u]) => `${esc(it)}${src(u)}`).join("; ")}${k.id === "votes" && x.unrev ? unrev(x.unrev) : ""}</li>`).join("");
      return `<tr class="pl-org"><td data-label="Organization"><strong>${esc(n.label)}</strong><div class="ticker">${esc(n.org_type || n.type)} · ${plural(score(x), "kind")} of record on this ask or company</div>${opp ? `<div class="note">Files from a critical stance on ESG; it can share an ask while seeking a different outcome.</div>` : ""}</td>
        <td data-label="Public record"><ul class="pl-why">${reasons}</ul></td>
        <td data-label="Engagement leads">${ppl.length ? ppl.map((p) => `${esc(p.name)}<div class="ticker">${esc(p.title)}</div>${src(p.profile_url, "profile")}`).join("<br>") : `<span class="ticker">no lead on file</span>`}</td>
        <td><button type="button" class="chip pl-add" data-org="${esc(x.org)}" aria-pressed="${inList}" aria-label="Shortlist ${esc(n.label)}">Shortlist</button></td></tr>`;
    }).join("");
    return `<section class="pl-card pl-wide" aria-labelledby="pl-h-who"><h3 id="pl-h-who" tabindex="-1">Organizations with a public record on this ask or at ${esc(c.name)}</h3>
      <p class="status-note">Each organization is listed with the kinds of public record that apply: ${KINDS.map((k) => k.label.toLowerCase()).join("; ")}. Sorted by how many kinds apply (a shared coalition is shown but does not count), then by how many filings of this ask. A record shows what an organization has done, not whether it would work with you; this is a starting list for outreach, not a recommendation.</p>
      <p class="count-line">Showing ${list.length} of ${all.length}.${all.length > 20 ? ` <button type="button" class="linklike" id="pl-more">${S.showAll ? "Show the first 20" : "Show all"}</button>` : ""}</p>
      ${rows ? `<div class="table-wrap"><table class="pl-orgs"><thead><tr><th scope="col">Organization</th><th scope="col">Public record</th><th scope="col">Engagement leads</th><th scope="col"><span class="visually-hidden">Shortlist</span></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="status-note">No organization in this dataset has filed, backed or voted for this ask, or reported holdings here.</p>`}
    </section>`;
  }

  // ---------- Your organization's own record ----------
  function yours(c, ask, mine) {
    if (!mine || !idx.nodes.has(mine)) return "";
    const n = idx.nodes.get(mine), t = tick(c);
    const fam = Object.keys(FAMILY_ORG).find((k) => FAMILY_ORG[k] === mine);
    const fv = fam ? familyVotes(ask).get(fam) : null;
    const holds = idx.holdsAt.filter((h) => h.org === mine && h.co === t);
    const filed = idx.acts.filter((a) => a.org === mine && (LEAD.has(a.type) || CO.has(a.type) || BACK.has(a.type)) && (a.prop.ask_id === ask || a.prop.company === t));
    const coal = [...(idx.members.get(mine) || [])].map((k) => idx.nodes.get(k)).filter(Boolean);
    return `<section class="pl-card" aria-labelledby="pl-h-mine"><h3 id="pl-h-mine">${esc(n.label)}: its own record here</h3>
      <ul class="steps tight">
        <li><strong>Its funds' votes on this ask:</strong> ${fv ? `FOR on ${esc(voteText(fv))}${src(fv.items[0] && fv.items[0].url)}${unrev(fv)}` : "no Form N-PX votes on this ask in this dataset"}</li>
        <li><strong>Holdings of ${esc(c.name)}:</strong> ${holds.length ? holds.map((h) => `${h.value ? money(h.value) + ", " : ""}${esc(idx.holdSrc.get(h.url) || "holdings filing")}${src(h.url)}`).join("; ") : "none reported in this dataset"}</li>
        <li><strong>Filings or backing on this ask or at this company:</strong> ${filed.length ? filed.map((a) => `${esc(a.prop.company)} ${esc(a.prop.year)} (${esc(a.type)})${src(a.url)}`).join("; ") : "none in this dataset"}</li>
        <li><strong>Coalitions:</strong> ${coal.length ? coal.map((k) => esc(k.label)).join(", ") : "none recorded"}</li>
      </ul></section>`;
  }

  // ---------- Policy ----------
  function policy(ask) {
    const ev = new Map(((D.causality && D.causality.events) || []).map((e) => [e.id, e]));
    const rows = ((D.coverage && D.coverage.entries) || []).filter((r) => r.ask_id === ask);
    const byRegion = new Map();
    rows.forEach((r) => { const e = ev.get(r.policy_id) || {}; const k = e.region || "Checked, none found"; if (!byRegion.has(k)) byRegion.set(k, []); byRegion.get(k).push({ r, e }); });
    const covering = rows.filter((r) => r.coverage !== "none");
    const full = rows.filter((r) => r.coverage === "full").length;
    return `<section class="pl-card" aria-labelledby="pl-h-pol"><h3 id="pl-h-pol">What policy already requires</h3>
      <p>${covering.length ? `${plural(covering.length, "policy", "policies")} on the map cover part of this ask; ${full ? `${full} in full` : "none in full"}.` : "No policy on the map requires any part of this ask."} This site's reading of each text, not yet confirmed by a person.</p>
      ${[...byRegion.entries()].map(([reg, list]) => `<details><summary>${esc(reg)} (${list.length})</summary><ul class="steps tight">${list.map(({ r, e }) => `<li><strong>${esc(e.title || "No policy found")}</strong>${e.status && !String(r.note || "").toLowerCase().startsWith(String(e.status).toLowerCase()) ? ` <span class="ticker">(${esc(e.status)})</span>` : ""}: ${esc(r.note)}${src(r.source_url)}</li>`).join("")}</ul></details>`).join("")}
    </section>`;
  }

  // ---------- Shortlist (this browser only) ----------
  const getList = () => store.get(STORE, S.memory || []);
  const setList = (l) => { S.memory = l; store.set(STORE, l); };
  function drawShortlist() {
    const list = getList();
    const box = document.getElementById("pl-shortlist");
    box.innerHTML = `<h3 id="pl-h-list" tabindex="-1">Your shortlist (${list.length})</h3>
      ${list.length ? `<ul class="steps tight">${list.map((s) => `<li><strong>${esc(s.name)}</strong>${s.people ? ` · ${esc(s.people)}` : ""} <span class="ticker">for ${esc(s.context)}</span> <button type="button" class="linklike pl-remove" data-org="${esc(s.id)}" aria-label="Remove ${esc(s.name)}">Remove</button></li>`).join("")}</ul>
        <p><button type="button" class="chip" id="pl-export">Download as CSV</button> <button type="button" class="chip" id="pl-clear">Clear</button></p>` : `<p class="status-note">Use "Shortlist" in the table to build an outreach list. It is kept in this browser only; nothing is sent anywhere.</p>`}`;
    box.querySelectorAll(".pl-remove").forEach((b) => b.addEventListener("click", () => { setList(getList().filter((s) => s.id !== b.dataset.org)); draw(); document.getElementById("pl-h-list").focus(); }));
    const ex = document.getElementById("pl-export");
    if (ex) ex.addEventListener("click", () => {
      const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv = ["Organization,Engagement leads,Planned for,Public record at the time,Network id"].concat(getList().map((s) => [s.name, s.people, s.context, s.record, s.id].map(q).join(","))).join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = "engagement-shortlist.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    const cl = document.getElementById("pl-clear");
    if (cl) cl.addEventListener("click", () => { setList([]); draw(); document.getElementById("pl-h-list").focus(); });
  }

  // ---------- Page ----------
  const planUrl = () => `${location.pathname}?plan=${[S.co, S.ask, S.mine].filter(Boolean).map(encodeURIComponent).join("~")}#planner`;
  function draw(reveal = false) {
    const c = coById(S.co);
    const out = document.getElementById("pl-out");
    if (!c) { out.innerHTML = `<p class="status-note">Choose a company.</p>`; return; }
    out.innerHTML = `${grid()}<div class="pl-grid">${record(c, S.ask)}${timing(c)}</div>${ideas(c, S.ask)}${organizations(c, S.ask, S.mine)}${tools(c, S.ask)}<div class="pl-grid">${yours(c, S.ask, S.mine)}${policy(S.ask)}</div>`;
    out.querySelectorAll(".pl-add").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.org, n = idx.nodes.get(id), list = getList();
      const row = b.closest("tr"), record = row ? [...row.querySelectorAll(".pl-why > li > strong")].map((s) => s.textContent.replace(/:$/, "")).join("; ") : "";
      setList(list.some((s) => s.id === id) ? list.filter((s) => s.id !== id) : list.concat([{ id, name: n.label, people: (idx.people.get(id) || []).slice(0, 2).map((p) => p.name).join("; "), context: `${c.name}: ${askOf(S.ask).label}`, record }]));
      draw();
      const again = document.querySelector(`.pl-add[data-org="${CSS.escape(id)}"]`);
      if (again) again.focus();
    }));
    out.querySelectorAll(".pl-ask").forEach((b) => b.addEventListener("click", () => { S.ask = b.dataset.ask; sync(true); }));
    out.querySelectorAll(".pl-co").forEach((b) => b.addEventListener("click", () => { S.co = b.dataset.co; sync(true); }));
    const more = document.getElementById("pl-more");
    if (more) more.addEventListener("click", () => { S.showAll = !S.showAll; draw(); document.getElementById("pl-h-who").focus(); });
    // Grid: one square in the tab order; arrow keys move.
    const cells = [...out.querySelectorAll("button.pl-mx")];
    if (cells.length && !cells.some((b) => b.tabIndex === 0)) cells[0].tabIndex = 0;
    const at = (r, ci) => out.querySelector(`.pl-mx[data-r="${r}"][data-c="${ci}"]`);
    cells.forEach((b) => {
      b.addEventListener("click", () => {
        S.co = b.dataset.co; S.ask = b.dataset.ask; sync(false);
        const again = out.querySelector('.pl-mx[aria-current="true"]');
        if (again) again.focus({ preventScroll: true });
        // Choosing a square (click, Enter or Space; arrow keys only move focus) shows the result: scroll to the plan.
        const h = document.getElementById("pl-h-rec");
        const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (h) h.scrollIntoView({ behavior: still ? "auto" : "smooth", block: "start" });
      });
      b.addEventListener("keydown", (e) => {
        const r = +b.dataset.r, ci = +b.dataset.c;
        const to = { ArrowRight: [r, ci + 1], ArrowLeft: [r, ci - 1], ArrowDown: [r + 1, ci], ArrowUp: [r - 1, ci], Home: [r, 0], End: [r, cells.filter((x) => +x.dataset.r === r).length - 1] }[e.key];
        if (!to) return;
        const n = at(to[0], to[1]);
        if (!n) return;
        e.preventDefault();
        cells.forEach((x) => { x.tabIndex = -1; });
        n.tabIndex = 0;
        n.focus();
      });
    });
    const cur = out.querySelector('.pl-mx[aria-current="true"]'), wrap = out.querySelector(".pl-mx-wrap");
    if (reveal && cur && wrap) {
      const rowHead = out.querySelector(".pl-mx-row"), w = rowHead ? rowHead.offsetWidth : 0;
      const td = cur.closest("td"), left = td.offsetLeft - w, right = td.offsetLeft + td.offsetWidth;
      if (left < wrap.scrollLeft || right > wrap.scrollLeft + wrap.clientWidth) wrap.scrollLeft = Math.max(0, left - 40);
    }
    drawShortlist();
    if (window.CAMPAIGNS) window.CAMPAIGNS.fill(out);
    if (window.PLANNER_TOOLS) window.PLANNER_TOOLS.fill(out, { coName: c.name, askLabel: askOf(S.ask).label, proposals: D.proposals, askOf, critical: idx.critical });
    // The last step of the site: the same company and ask, tested forward in Plan and test › Test plans over time.
    const nx = document.getElementById("pl-next");
    if (nx) nx.href = planUrl().replace(/#planner$/, "#simulate");
    // The same company and ask, suggested for the Prediction board (board.js builds the GitHub form address).
    const bd = document.getElementById("pl-board");
    if (bd) bd.href = window.BOARD_SUGGEST ? window.BOARD_SUGGEST(c.name, askOf(S.ask).label)
      : `https://github.com/sophiaquinlanware/shareholder-advocacy-ai-landscape/issues/new?template=suggest-question.yml`;
    // planner-docs.js (UI session) adds the escalation step and drafted documents after each redraw.
    document.dispatchEvent(new CustomEvent("plannerdraw"));
    const status = document.getElementById("pl-status");
    const filings = D.proposals.filter((p) => p.ask_id === S.ask).length;
    if (status) status.textContent = `Plan for ${c.name}, ${askOf(S.ask).label}: ${plural(filings, "filing")} of this ask in this dataset.`;
  }
  function sync(focus, write = true) {
    const cm = document.getElementById("pl-copy-msg");
    if (cm) cm.textContent = ""; // a copied link belongs to the previous plan
    ["pl-co", "pl-ask", "pl-mine"].forEach((id) => { const el = document.getElementById(id); if (el) el.value = { "pl-co": S.co, "pl-ask": S.ask, "pl-mine": S.mine }[id] || ""; });
    if (write) try {
      const q = new URLSearchParams(location.search);
      q.delete("plan");
      const rest = q.toString();
      history.replaceState(null, "", `${location.pathname}?${rest ? rest + "&" : ""}plan=${[S.co, S.ask, S.mine].filter(Boolean).map(encodeURIComponent).join("~")}${location.hash}`);
    } catch (e) { /* address bar unchanged */ }
    draw(write);
    if (focus) { const h = document.getElementById("pl-h-rec"); if (h) { h.tabIndex = -1; h.focus(); } }
  }

  // Read-only access for planner-docs.js: the current plan and the data it draws from.
  window.PLANNER = {
    get: () => (S && D ? { S, D, idx, coById, askOf, tick, deadlineOpen, today, orgsFor: (c) => organizationsData(c) } : null),
  };
  // Organizations with a public record on this ask or at this company, as data (filers critical of ESG left out),
  // for the coalition draft.
  function organizationsData(c) {
    const t = tick(c);
    const out = new Map();
    idx.acts.forEach((a) => {
      if (a.org === S.mine || !(LEAD.has(a.type) || CO.has(a.type) || BACK.has(a.type))) return;
      if (a.prop.ask_id !== S.ask && a.prop.company !== t) return;
      const n = idx.nodes.get(a.org);
      if (!n) return;
      if (!out.has(a.org)) out.set(a.org, { id: a.org, name: n.label, type: n.org_type || n.type, items: [], people: (idx.people.get(a.org) || []).slice(0, 2) });
      out.get(a.org).items.push({ text: `${LEAD.has(a.type) ? "lead-filed" : CO.has(a.type) ? "co-filed" : "backed"} ${a.prop.company} ${a.prop.year}`, url: a.url, anti: /anti-ESG/i.test(n.org_type || "") });
    });
    return [...out.values()].filter((o) => !o.items.some((i) => i.anti)).sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
  }

  // Build the planner only when its view is first shown, so the rest of the site loads without waiting for it.
  window.renderPlanner = function (data) {
    const el = document.getElementById("tab-planner");
    if (!el) return;
    if (el.hidden) {
      const mo = new MutationObserver(() => { if (!el.hidden) { mo.disconnect(); build(el, data); } });
      mo.observe(el, { attributes: true, attributeFilter: ["hidden"] });
      return;
    }
    build(el, data);
  };
  function build(el, data) {
    D = { graph: data.graph && data.graph.nodes ? data.graph : { nodes: [], edges: [] }, proposals: (data.proposals && data.proposals.proposals) || [],
      companies: data.companies || [], asks: (data.asks && data.asks.asks) || [], people: (data.people && data.people.people) || [],
      fundVotes: data.fund_votes, holdings: data.holdings, coverage: data.coverage, causality: data.causality, valueChain: data.value_chain };
    idx = index();
    const soon = D.proposals.filter((p) => p.status === "upcoming" && p.meeting_date).sort((a, b) => a.meeting_date.localeCompare(b.meeting_date))[0];
    const askCount = new Map(); D.proposals.forEach((p) => p.ask_id && askCount.set(p.ask_id, (askCount.get(p.ask_id) || 0) + 1));
    const topAsk = [...askCount.entries()].sort((a, b) => b[1] - a[1])[0];
    const fromUrl = (new URLSearchParams(location.search).get("plan") || "").split("~").map((s) => { try { return decodeURIComponent(s); } catch (e) { return ""; } });
    const soonCo = soon ? coById(soon.company) : null;
    S = { co: fromUrl[0] || (soonCo && (soonCo.id || soonCo.ticker)) || (usCos()[0] || {}).id, ask: fromUrl[1] || (soon && soon.ask_id) || (topAsk && topAsk[0]),
      mine: fromUrl[2] || "", memory: [], showAll: false };
    S.mine = S.mine || visit.get(MINE, "");
    if (!tick(coById(S.co))) S.co = (soonCo && (soonCo.id || soonCo.ticker)) || (usCos()[0] || {}).id;
    if (!D.asks.some((a) => a.id === S.ask)) S.ask = (soon && soon.ask_id) || (topAsk && topAsk[0]);
    if (S.mine && !idx.orgs.some((o) => o.id === S.mine)) S.mine = "";
    S.co = (coById(S.co) || {}).id || S.co; // a ticker in a shared link selects the company by its id
    const cos = D.companies.filter((c) => tick(c)).sort((a, b) => a.name.localeCompare(b.name));
    const orgs = idx.orgs.slice().sort((a, b) => a.label.localeCompare(b.label));
    el.innerHTML = `
      <h2>Plan an engagement</h2>
      <p class="intro">Choose a company and an ask, or a square in the grid. Add your organization to see its own record and the coalitions it shares with each organization listed. Every line links to its source.</p>
      <div class="net-controls pl-controls">
        <label>Company <select id="pl-co">${cos.map((c) => `<option value="${esc(c.id || c.ticker)}">${esc(c.name)} (${esc(c.ticker)})</option>`).join("")}</select></label>
        <label>Ask <span class="pl-hint">(what you want the company to do)</span> <select id="pl-ask">${D.asks.map((a) => `<option value="${esc(a.id)}">${esc(a.label)} (${askCount.get(a.id) || 0} filed)</option>`).join("")}</select></label>
        <label>Your organization (optional) <select id="pl-mine"><option value="">Not set</option>${orgs.map((o) => `<option value="${esc(o.id)}">${esc(o.label)}</option>`).join("")}</select></label>
        <button type="button" class="chip" id="pl-copy" aria-describedby="pl-copy-note">Save this plan as a link</button> <span id="pl-copy-msg" class="ticker"></span>
        <p class="ticker pl-copy-note" id="pl-copy-note">Copies a web address that reopens this company, ask and organization. Bookmark it or send it to a colleague; nothing is stored on a server.</p>
      </div>
      <p id="pl-status" class="visually-hidden" role="status"></p>
      <div id="pl-out"></div>
      <div id="pl-docs"></div>
      <aside id="pl-shortlist" class="pl-card" aria-labelledby="pl-h-list"></aside>
      <section class="pl-card" aria-labelledby="pl-h-board">
        <h3 id="pl-h-board">Put this plan on the Prediction board</h3>
        <p>Suggest this company and ask as a question for everyone to forecast, such as whether a proposal would reach a level of support. A GitHub form opens with the company and ask filled in; the site's maintainer checks it before it goes on the board. Posting needs a free GitHub account, and nothing is posted until you submit the form.</p>
        <a id="pl-board" class="bd-btn" href="#predict" rel="noopener" target="_blank">Suggest this proposal for the board<span class="visually-hidden"> (opens a GitHub form in a new tab)</span></a>
        <a href="#predict" class="pl-board-see">See the Prediction board</a>
      </section>
      <p class="next-section"><a id="pl-next" href="#simulate">Next: test this plan over time →</a></p>`;
    document.getElementById("pl-co").addEventListener("change", (e) => { S.co = e.target.value; sync(); });
    document.getElementById("pl-ask").addEventListener("change", (e) => { S.ask = e.target.value; sync(); });
    document.getElementById("pl-mine").addEventListener("change", (e) => { S.mine = e.target.value; visit.set(MINE, S.mine); sync(); });
    document.getElementById("pl-copy").addEventListener("click", async () => {
      const url = location.origin + planUrl();
      const st = document.getElementById("pl-status");
      const msg = document.getElementById("pl-copy-msg");
      try { await navigator.clipboard.writeText(url); st.textContent = msg.textContent = "Link copied. Paste it into a bookmark or a message to come back to this plan."; } catch (e) { st.textContent = msg.textContent = `Copy this link: ${url}`; }
    });
    sync(false, false);
  }
})();

// Engagement planner: pick a company and an ask (optionally your own organization) and see, on one page, the
// timing and rights, the ask's track record, who might work with you and why, what policy already requires,
// and new ideas. Every signal is drawn from the site's data files and links to its source. It informs; it does
// not recommend a vote or a partner (PRODUCT.md "Never claim"). Plan: docs/plans/2026-11-26-engagement-planner.md.

(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const src = (url, label = "source") => (url ? ` <a class="src" href="${esc(url)}" target="_blank" rel="noopener">[${esc(label)}]</a>` : "");
  const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;
  const fmt = (iso) => (iso ? new Date(String(iso).slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "");
  const median = (v) => { if (!v.length) return null; const s = [...v].sort((a, b) => a - b), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const pct = (x) => (x == null ? "" : `${Math.round(x * 10) / 10}%`);
  const norm = (s) => String(s || "").toLowerCase().replace(/\(.*?\)/g, "").replace(/\b(inc|llc|lp|corp|co|the|asset management|investments?|capital management|group|management)\b/g, "").replace(/[^a-z0-9]/g, "");

  // Fund families (data/fund_votes.json) and 13F filers (data/holdings.json) use their own names; these are the
  // organizations they correspond to in the network where a plain name match would miss.
  const FAMILY_ORG = { "Parnassus": "parnassus", "Calvert": "calvert-research-and-management", "Domini": "domini", "Green Century": "green-century",
    "Impax (Pax)": "impax", "Praxis": "praxis-mutual-funds-everence-financial", "TIAA-CREF": "nuveen-tiaa", "Vanguard": "vanguard", "BlackRock (iShares)": "blackrock" };
  const HOLDER_ORG = { "parnassus-investments": "parnassus", "trillium-asset-management": "trillium", "boston-common-asset-management": "boston-common",
    "zevin-asset-management": "zevin", "domini-impact-investments": "domini", "arjuna-capital": "arjuna", "northstar-asset-management": "northstar",
    "federated-hermes": "federated-hermes-eos", "legal-general": "lgim", "nys-common-retirement-fund": "new-york-state-common-retirement-fund", "nbim": "nbim" };
  const FILER_TYPES = new Set(["lead filer", "co-filer", "filed (named in proxy)", "coordinated by"]);
  const SUPPORT_TYPES = new Set(["supported by", "exempt solicitation", "exempt solicitation for"]);
  const STORE = "planner-shortlist-v1";

  let D, S, idx;

  function index() {
    const nodes = new Map(D.graph.nodes.map((n) => [n.id, n]));
    const orgs = D.graph.nodes.filter((n) => n.type === "investor" || n.type === "coalition");
    const byNorm = new Map(orgs.map((n) => [norm(n.label), n.id]));
    const orgOf = (id, name) => (nodes.has(id) ? id : byNorm.get(norm(name)) || null);
    const props = D.proposals; // proposals.json: authoritative for support, status, ask_id
    const pById = new Map(props.map((p) => [p.id, p]));
    // Graph proposal nodes carry ask_id and company; edges from organizations to them say who filed or backed.
    const acts = []; // { org, prop (graph node), type, url }
    const holdsAt = []; // { org, co (ticker), value, url } from "holds shares in" edges (13F, matched to network organizations)
    const members = new Map(); // org -> Set(coalition)
    D.graph.edges.forEach((e) => {
      const a = nodes.get(e.source), b = nodes.get(e.target);
      if (!a || !b) return;
      if ((a.type === "investor" || a.type === "coalition") && b.type === "proposal") acts.push({ org: a.id, prop: b, type: e.type, url: e.source_url });
      if (e.type === "holds shares in" && b.type === "company") holdsAt.push({ org: a.id, co: b.ticker || String(b.id).replace(/^co-/, ""), value: e.value_usd, url: e.source_url });
      if (e.type === "member of") { if (!members.has(a.id)) members.set(a.id, new Set()); members.get(a.id).add(b.id); }
    });
    const people = new Map();
    (D.people || []).forEach((p) => { const k = p.org_id; if (!people.has(k)) people.set(k, []); people.get(k).push(p); });
    const votes = (D.fundVotes && D.fundVotes.summary) || [];
    const holds = (D.holdings && D.holdings.holdings) || [];
    const holderName = new Map(((D.holdings && D.holdings.investors) || []).map((i) => [i.id, i.name]));
    return { nodes, orgs, orgOf, props, pById, acts, members, people, votes, holds, holderName, holdsAt };
  }

  const askLabel = (id) => ((D.asks.find((a) => a.id === id) || {}).label || id);
  const coById = (key) => D.companies.find((c) => (c.id || c.ticker) === key || c.ticker === key);
  const tick = (c) => (c && c.ticker && !/^(private|UNVERIFIED)$/i.test(c.ticker) ? c.ticker : "");

  // ---------- Panels ----------
  function timing(c) {
    const t = tick(c);
    const next = c.next_proposal_deadline;
    const upcoming = idx.props.filter((p) => p.company === t && p.status === "upcoming");
    const route = c.route_status ? { open: "Still open", narrowing: "Narrowing", closed: "Closed" }[c.route_status] || c.route_status : null;
    const fact = (l, v) => `<div><dt>${esc(l)}</dt><dd>${v}</dd></div>`;
    return `<section class="pl-card" aria-labelledby="pl-h-time"><h3 id="pl-h-time">Timing and rights at ${esc(c.name)}</h3>
      <dl class="summary">
        ${fact("Shareholder route", c.shareholder_route ? esc(c.shareholder_route) + src(c.route_source_url) : `<span class="ticker">not determined</span>`)}
        ${fact("Next filing deadline", next ? `${esc(fmt(next))}${c.next_proposal_deadline_status === "passed" ? " (passed)" : ""}${src(c.next_proposal_deadline_source, "proxy")}` : `<span class="ticker">not on file</span>`)}
        ${fact("AI proposals on the next ballot", upcoming.length ? upcoming.map((p) => `${esc(p.title)} (${esc(fmt(p.meeting_date))})${src(p.proxy_url, "proxy")}`).join("<br>") : `<span class="ticker">none on file</span>`)}
        ${fact("Proposal route if Rule 14a-8 ends", route ? `${esc(route)}${c.route_status_reason ? ` <span class="ticker">${esc(c.route_status_reason)}</span>` : ""}` : `<span class="ticker">not researched</span>`)}
        ${c.threshold && c.threshold.text ? fact("Ownership threshold", esc(c.threshold.text) + src(c.threshold.url)) : ""}
        ${c.director_voting && c.director_voting.text ? fact("Director elections", esc(c.director_voting.text) + src(c.director_voting.url)) : ""}
      </dl></section>`;
  }

  function record(c, ask) {
    const t = tick(c);
    const all = idx.props.filter((p) => p.ask_id === ask);
    const here = all.filter((p) => p.company === t).sort((a, b) => String(b.meeting_date || b.year).localeCompare(String(a.meeting_date || a.year)));
    const voted = all.filter((p) => p.status === "voted" && p.support_pct != null);
    const med = median(voted.map((p) => p.support_pct));
    const best = voted.slice().sort((a, b) => b.support_pct - a.support_pct)[0];
    const cos = [...new Set(all.map((p) => p.company))];
    const row = (p) => `<li><strong>${esc(p.company)}</strong> ${esc(p.year)}: ${esc(p.title)} · ${esc(p.status)}${p.support_pct != null ? ` · ${esc(p.support_pct)}%` : ""}${src(p.results_url || p.proxy_url, p.results_url ? "results" : "proxy")}</li>`;
    return `<section class="pl-card" aria-labelledby="pl-h-rec"><h3 id="pl-h-rec">How this ask has gone</h3>
      <p>${all.length ? `Filed ${plural(all.length, "time")} at ${plural(cos.length, "company", "companies")} since 2023; median support ${pct(med)} across ${plural(voted.length, "vote")}${best ? `, highest ${pct(best.support_pct)} at ${esc(best.company)} ${esc(best.year)}` : ""}.` : "Not yet filed at any company in this dataset."}</p>
      <h4>At ${esc(c.name)}</h4>
      ${here.length ? `<ul class="steps tight">${here.map(row).join("")}</ul>` : `<p class="status-note">Never filed here: this would be a first.</p>`}
      ${all.length > here.length ? `<details><summary>Elsewhere (${all.length - here.length})</summary><ul class="steps tight">${all.filter((p) => p.company !== t).sort((a, b) => (b.year || 0) - (a.year || 0)).map(row).join("")}</ul></details>` : ""}
    </section>`;
  }

  // Potential collaborators: organizations scored by public signals, each shown with its evidence.
  function collaborators(c, ask, mine) {
    const t = tick(c);
    const cand = new Map();
    const get = (org) => {
      if (!org || org === mine) return null;
      if (!cand.has(org)) cand.set(org, { org, score: 0, kinds: new Set(), groups: new Map() });
      return cand.get(org);
    };
    // Each reason belongs to a group ("Filed this ask at: GOOGL 2025; GOOGL 2026"), with one source per item.
    const add = (org, kind, group, item, url, w) => {
      const x = get(org);
      if (!x) return;
      if (!x.kinds.has(kind)) x.score += w;
      x.kinds.add(kind);
      if (!x.groups.has(group)) x.groups.set(group, new Map());
      const g = x.groups.get(group);
      if (!g.has(item)) g.set(item, url);
    };
    // Strongest role per organization and proposal: filing beats backing.
    const role = new Map();
    idx.acts.forEach((a) => {
      const filed = FILER_TYPES.has(a.type), backed = SUPPORT_TYPES.has(a.type);
      if (!filed && !backed) return;
      const k = a.org + "|" + a.prop.id;
      const prev = role.get(k);
      if (!prev || (filed && !prev.filed)) role.set(k, Object.assign({}, a, { filed }));
    });
    role.forEach((a) => {
      const label = a.prop.company + " " + a.prop.year;
      if (a.prop.ask_id === ask && a.prop.company !== t) add(a.org, "ask", a.filed ? "Filed this ask at" : "Backed this ask at", label, a.url, a.filed ? 3 : 2);
      if (a.prop.company === t) add(a.org, "here", (a.filed ? "Filed at " : "Backed at ") + c.name, a.prop.year + ": " + String(a.prop.label || "").split(": ").slice(1).join(": "), a.url, 2);
    });
    const askProps = new Set(idx.props.filter((p) => p.ask_id === ask).map((p) => p.id));
    const famFor = new Map();
    idx.votes.forEach((r) => {
      if (!askProps.has(r.proposal_id)) return;
      const f = famFor.get(r.family) || { for: 0, n: 0 };
      f.n += 1;
      if (r.vote === "FOR") f.for += 1;
      famFor.set(r.family, f);
    });
    famFor.forEach((f, fam) => { if (f.for) add(FAMILY_ORG[fam] || idx.orgOf(null, fam), "votes", "Its funds voted FOR this ask", f.for + " of " + f.n + " proposals (Form N-PX)", null, f.for / f.n >= 0.5 ? 2 : 1); });
    idx.holdsAt.filter((h) => h.co === t).forEach((h) => add(h.org, "holds", "Holds " + c.name + " shares", h.value ? "about $" + (h.value / 1e6).toFixed(0) + "M on its latest 13F" : "on its latest 13F", h.url, 2));
    if (mine && idx.members.has(mine)) {
      const myC = idx.members.get(mine);
      cand.forEach((x) => { const shared = [...(idx.members.get(x.org) || [])].filter((k) => myC.has(k)); if (shared.length) { x.score += 1; x.groups.set("Shares coalitions with you", new Map(shared.map((k) => [(idx.nodes.get(k) || {}).label || k, null]))); } });
    }
    const list = [...cand.values()].filter((x) => idx.nodes.has(x.org)).sort((a, b) => b.score - a.score || b.kinds.size - a.kinds.size).slice(0, 20);
    const coalitions = new Map();
    list.forEach((x) => (idx.members.get(x.org) || new Set()).forEach((k) => coalitions.set(k, (coalitions.get(k) || 0) + 1)));
    const topCoal = [...coalitions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const shortlist = load();
    const rows = list.map((x) => {
      const n = idx.nodes.get(x.org);
      const ppl = (idx.people.get(x.org) || []).slice(0, 2);
      const inList = shortlist.some((s) => s.id === x.org);
      const opp = /anti-ESG/i.test(n.org_type || "");
      return `<tr><td><strong>${esc(n.label)}</strong><div class="ticker">${esc(n.org_type || n.type)}</div>${opp ? `<div class="note">Files from a critical stance on ESG; it can share an ask while seeking a different outcome.</div>` : ""}</td>
        <td><ul class="pl-why">${[...x.groups.entries()].map(([g, items]) => `<li><strong>${esc(g)}</strong> ${[...items.entries()].map(([it, u]) => `${esc(it)}${src(u)}`).join("; ")}</li>`).join("")}</ul></td>
        <td>${ppl.length ? ppl.map((p) => `${esc(p.name)}<div class="ticker">${esc(p.title)}</div>${src(p.profile_url, "profile")}`).join("<br>") : `<span class="ticker">no lead on file</span>`}</td>
        <td><button type="button" class="chip pl-add" data-org="${esc(x.org)}" aria-pressed="${inList}">${inList ? "On shortlist" : "Add to shortlist"}</button></td></tr>`;
    }).join("");
    return `<section class="pl-card pl-wide" aria-labelledby="pl-h-who"><h3 id="pl-h-who">Who might work with you on this</h3>
      <p class="status-note">Ranked by public signals, each listed with its source: filed or backed this ask elsewhere, filed or backed at this company, a fund family that voted for this ask, reported holdings of this company (13F), and coalitions shared with your organization. It is a starting list for outreach, not a recommendation.</p>
      ${rows ? `<div class="table-wrap"><table><thead><tr><th scope="col">Organization</th><th scope="col">Why it shows up</th><th scope="col">Engagement leads</th><th scope="col"><span class="visually-hidden">Shortlist</span></th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="status-note">No organization in the data has filed, backed or voted for this ask, or reported holdings here.</p>`}
      ${topCoal.length ? `<h4>Coalitions these organizations belong to</h4><ul class="steps tight">${topCoal.map(([k, n]) => `<li>${esc((idx.nodes.get(k) || {}).label || k)}: ${plural(n, "of them", "of them")}${src((idx.nodes.get(k) || {}).source_url || (idx.nodes.get(k) || {}).website)}</li>`).join("")}</ul>` : ""}
    </section>`;
  }

  function policy(ask) {
    const ev = new Map(((D.causality && D.causality.events) || []).map((e) => [e.id, e]));
    const rows = ((D.coverage && D.coverage.entries) || []).filter((r) => r.ask_id === ask);
    const byRegion = new Map();
    rows.forEach((r) => { const e = ev.get(r.policy_id) || {}; const k = e.region || "Not tied to one policy"; if (!byRegion.has(k)) byRegion.set(k, []); byRegion.get(k).push({ r, e }); });
    const full = rows.filter((r) => r.coverage === "full").length;
    return `<section class="pl-card" aria-labelledby="pl-h-pol"><h3 id="pl-h-pol">What policy already requires</h3>
      <p>${rows.length ? `${plural(rows.length, "policy row")}, ${full ? `${full} full` : "none in full"}. This site's reading of each text, not yet confirmed by a person.` : "No policy on the map requires any part of this ask."}</p>
      ${[...byRegion.entries()].map(([reg, list]) => `<details><summary>${esc(reg)} (${list.length})</summary><ul class="steps tight">${list.map(({ r, e }) => `<li><strong>${esc(e.title || "No policy")}</strong>${e.status ? ` <span class="ticker">${esc(e.status)}</span>` : ""}: ${esc(r.note)}${src(r.source_url)}</li>`).join("")}</ul></details>`).join("")}
    </section>`;
  }

  // Ideas: asks filed at companies with the same main role but never here; companies with this ask never filed.
  function ideas(c, ask) {
    const t = tick(c);
    const R = window.ROLES;
    const role = R ? R.roleOf(c) : c.tier;
    const peers = new Set(D.companies.filter((x) => x !== c && (R ? R.roleOf(x) : x.tier) === role).map(tick).filter(Boolean));
    const hereAsks = new Set(idx.props.filter((p) => p.company === t).map((p) => p.ask_id));
    const gap = new Map();
    idx.props.forEach((p) => {
      if (!p.ask_id || hereAsks.has(p.ask_id) || !peers.has(p.company)) return;
      const g = gap.get(p.ask_id) || { cos: new Set(), sup: [] };
      g.cos.add(p.company); if (p.support_pct != null) g.sup.push(p.support_pct);
      gap.set(p.ask_id, g);
    });
    const gaps = [...gap.entries()].sort((a, b) => b[1].cos.size - a[1].cos.size).slice(0, 6);
    const filedAt = new Set(idx.props.filter((p) => p.ask_id === ask).map((p) => p.company));
    const untouched = D.companies.filter((x) => x.shareholder_route === "US proxy rules apply" && tick(x) && !filedAt.has(tick(x)) && x.next_proposal_deadline_status === "open")
      .sort((a, b) => String(a.next_proposal_deadline).localeCompare(String(b.next_proposal_deadline))).slice(0, 8);
    return `<section class="pl-card" aria-labelledby="pl-h-ideas"><h3 id="pl-h-ideas">Ideas to explore</h3>
      <h4>Asks made at similar companies but never at ${esc(c.name)}</h4>
      ${gaps.length ? `<ul class="steps tight">${gaps.map(([a, g]) => `<li><button type="button" class="linklike pl-ask" data-ask="${esc(a)}">${esc(askLabel(a))}</button>: filed at ${esc([...g.cos].join(", "))}${g.sup.length ? `, median support ${pct(median(g.sup))}` : ""}</li>`).join("")}</ul>` : `<p class="status-note">Every ask filed at companies in the same role has also been filed here, or no peers have AI proposals.</p>`}
      <h4>US-listed companies where this ask has never been filed (open filing deadline)</h4>
      ${untouched.length ? `<ul class="steps tight">${untouched.map((x) => `<li><button type="button" class="linklike pl-co" data-co="${esc(x.id || x.ticker)}">${esc(x.name)}</button>: deadline ${esc(fmt(x.next_proposal_deadline))}${src(x.next_proposal_deadline_source, "proxy")}</li>`).join("")}</ul>` : `<p class="status-note">None with an open deadline on file.</p>`}
    </section>`;
  }

  // Company × ask grid: every US-listed company against every recurring ask. A cell shows how often the ask was
  // filed there and its best support; empty cells are asks never filed there. Clicking a cell plans it.
  function matrix() {
    const cos = D.companies.filter((c) => c.shareholder_route === "US proxy rules apply" && tick(c)).sort((a, b) => a.name.localeCompare(b.name));
    const cell = new Map();
    idx.props.forEach((p) => {
      if (!p.ask_id) return;
      const k = p.company + "|" + p.ask_id;
      const x = cell.get(k) || { n: 0, best: null, up: false };
      x.n += 1;
      if (p.support_pct != null) x.best = Math.max(x.best ?? 0, p.support_pct);
      if (p.status === "upcoming") x.up = true;
      cell.set(k, x);
    });
    const head = D.asks.map((a) => `<th scope="col" class="pl-mx-h"><span>${esc(a.label)}</span></th>`).join("");
    const rows = cos.map((c) => `<tr><th scope="row">${esc(c.name)}</th>${D.asks.map((a) => {
      const x = cell.get(tick(c) + "|" + a.id);
      const on = S.co === (c.id || c.ticker) && S.ask === a.id;
      const label = x ? `${c.name}, ${a.label}: filed ${x.n} time${x.n === 1 ? "" : "s"}${x.best != null ? `, best support ${Math.round(x.best)}%` : ""}${x.up ? ", on the next ballot" : ""}` : `${c.name}, ${a.label}: never filed`;
      return `<td><button type="button" class="pl-mx${x ? " filed" : ""}${x && x.up ? " up" : ""}${on ? " on" : ""}" data-co="${esc(c.id || c.ticker)}" data-ask="${esc(a.id)}" aria-label="${esc(label)}">${x ? (x.best != null ? Math.round(x.best) : "•") : ""}</button></td>`;
    }).join("")}</tr>`).join("");
    return `<details class="pl-card pl-wide" id="pl-matrix-box"><summary><h3 id="pl-h-mx">All companies × all asks</h3></summary>
      <p class="status-note">Each square is one US-listed company and one ask. A number is the best support that ask has had there (% for ÷ (for + against)); a dot means filed but not voted; an outlined square is on the next ballot; an empty square has never been filed there. Choose a square to plan it.</p>
      <div class="table-wrap pl-mx-wrap"><table class="pl-mx-table"><thead><tr><th></th>${head}</tr></thead><tbody>${rows}</tbody></table></div></details>`;
  }

  // ---------- Shortlist (this browser only) ----------
  function load() { try { return JSON.parse(localStorage.getItem(STORE) || "[]"); } catch (e) { return []; } }
  function save(list) { try { localStorage.setItem(STORE, JSON.stringify(list)); } catch (e) { /* storage blocked: the list lives for this visit */ } S.memory = list; }
  function shortlist() { const l = load(); return l.length ? l : S.memory || []; }
  function drawShortlist() {
    const list = shortlist();
    const box = document.getElementById("pl-shortlist");
    if (!box) return;
    box.innerHTML = `<h3>Your shortlist (${list.length})</h3>
      ${list.length ? `<ul class="steps tight">${list.map((s) => `<li><strong>${esc(s.name)}</strong>${s.people ? ` · ${esc(s.people)}` : ""} <span class="ticker">for ${esc(s.context)}</span> <button type="button" class="linklike pl-remove" data-org="${esc(s.id)}">Remove</button></li>`).join("")}</ul>
        <p><button type="button" class="chip" id="pl-export">Download as CSV</button> <button type="button" class="chip" id="pl-clear">Clear</button></p>` : `<p class="status-note">Add organizations from the table to build an outreach list. It is kept in this browser only; nothing is sent anywhere.</p>`}`;
    box.querySelectorAll(".pl-remove").forEach((b) => b.addEventListener("click", () => { save(shortlist().filter((s) => s.id !== b.dataset.org)); draw(); }));
    const ex = document.getElementById("pl-export");
    if (ex) ex.addEventListener("click", () => {
      const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv = ["Organization,Engagement leads,Planned for,Network id"].concat(shortlist().map((s) => [s.name, s.people, s.context, s.id].map(q).join(","))).join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = "engagement-shortlist.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    const cl = document.getElementById("pl-clear");
    if (cl) cl.addEventListener("click", () => { save([]); draw(); });
  }

  // ---------- Page ----------
  function draw() {
    const c = coById(S.co);
    const out = document.getElementById("pl-out");
    if (!c) { out.innerHTML = `<p class="status-note">Choose a company.</p>`; return; }
    const open = document.getElementById("pl-matrix-box") && document.getElementById("pl-matrix-box").open;
    out.innerHTML = `<div class="pl-grid">${timing(c)}${record(c, S.ask)}</div>${collaborators(c, S.ask, S.mine)}<div class="pl-grid">${policy(S.ask)}${ideas(c, S.ask)}</div>${matrix()}`;
    if (open) document.getElementById("pl-matrix-box").open = true;
    out.querySelectorAll(".pl-mx").forEach((b) => b.addEventListener("click", () => { S.co = b.dataset.co; S.ask = b.dataset.ask; sync(true); }));
    out.querySelectorAll(".pl-add").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.org, n = idx.nodes.get(id);
      const list = shortlist();
      if (list.some((s) => s.id === id)) save(list.filter((s) => s.id !== id));
      else save(list.concat([{ id, name: n.label, people: (idx.people.get(id) || []).slice(0, 2).map((p) => p.name).join("; "), context: `${c.name}: ${askLabel(S.ask)}` }]));
      draw();
    }));
    out.querySelectorAll(".pl-ask").forEach((b) => b.addEventListener("click", () => { S.ask = b.dataset.ask; sync(true); }));
    out.querySelectorAll(".pl-co").forEach((b) => b.addEventListener("click", () => { S.co = b.dataset.co; sync(true); }));
    drawShortlist();
    const link = document.getElementById("pl-link");
    if (link) link.href = `?plan=${encodeURIComponent(S.co)}~${encodeURIComponent(S.ask)}${S.mine ? "~" + encodeURIComponent(S.mine) : ""}#planner`;
  }
  function sync(focus) {
    ["pl-co", "pl-ask", "pl-mine"].forEach((id) => { const el = document.getElementById(id); if (el) el.value = { "pl-co": S.co, "pl-ask": S.ask, "pl-mine": S.mine }[id] || ""; });
    try {
      const q = new URLSearchParams(location.search);
      q.delete("plan");
      const rest = q.toString();
      const plan = [S.co, S.ask, S.mine].filter(Boolean).map(encodeURIComponent).join("~");
      history.replaceState(null, "", `${location.pathname}?${rest ? rest + "&" : ""}plan=${plan}${location.hash}`);
    } catch (e) { /* address bar unchanged */ }
    draw();
    if (focus) { const h = document.querySelector("#pl-out h3"); if (h) { h.tabIndex = -1; h.focus(); } }
  }

  window.renderPlanner = function (data) {
    const el = document.getElementById("tab-planner");
    if (!el) return;
    D = { graph: data.graph && data.graph.nodes ? data.graph : { nodes: [], edges: [] }, proposals: (data.proposals && data.proposals.proposals) || [],
      companies: data.companies || [], asks: (data.asks && data.asks.asks) || [], people: (data.people && data.people.people) || [],
      fundVotes: data.fund_votes, holdings: data.holdings, coverage: data.coverage, causality: data.causality };
    idx = index();
    // Defaults: the company with the soonest AI ballot, and the ask filed most often; or what the address says.
    const soon = D.proposals.filter((p) => p.status === "upcoming" && p.meeting_date).sort((a, b) => a.meeting_date.localeCompare(b.meeting_date))[0];
    const askCount = new Map(); D.proposals.forEach((p) => p.ask_id && askCount.set(p.ask_id, (askCount.get(p.ask_id) || 0) + 1));
    const topAsk = [...askCount.entries()].sort((a, b) => b[1] - a[1])[0];
    const fromUrl = (new URLSearchParams(location.search).get("plan") || "").split("~");
    const soonCo = soon ? coById(soon.company) : null;
    S = { co: fromUrl[0] || (soonCo && (soonCo.id || soonCo.ticker)) || (D.companies[0] || {}).id, ask: fromUrl[1] || (soon && soon.ask_id) || (topAsk && topAsk[0]), mine: fromUrl[2] || "", memory: [] };
    const cos = D.companies.filter((c) => tick(c)).sort((a, b) => a.name.localeCompare(b.name));
    const orgs = idx.orgs.slice().sort((a, b) => a.label.localeCompare(b.label));
    el.innerHTML = `
      <h2>Plan an engagement</h2>
      <p class="intro">Choose a company and an ask. Add your organization to see which coalitions you share with each potential partner. Every line links to its source, and the plan's address can be shared.</p>
      <div class="net-controls pl-controls">
        <label>Company <select id="pl-co">${cos.map((c) => `<option value="${esc(c.id || c.ticker)}">${esc(c.name)} (${esc(c.ticker)})</option>`).join("")}</select></label>
        <label>Ask <select id="pl-ask">${D.asks.map((a) => `<option value="${esc(a.id)}">${esc(a.label)} (${askCount.get(a.id) || 0} filed)</option>`).join("")}</select></label>
        <label>Your organization (optional) <select id="pl-mine"><option value="">Not set</option>${orgs.map((o) => `<option value="${esc(o.id)}">${esc(o.label)}</option>`).join("")}</select></label>
        <a id="pl-link" class="chip" href="#planner">Link to this plan</a>
      </div>
      <div id="pl-out" aria-live="polite"></div>
      <aside id="pl-shortlist" class="pl-card"></aside>`;
    document.getElementById("pl-co").addEventListener("change", (e) => { S.co = e.target.value; sync(); });
    document.getElementById("pl-ask").addEventListener("change", (e) => { S.ask = e.target.value; sync(); });
    document.getElementById("pl-mine").addEventListener("change", (e) => { S.mine = e.target.value; sync(); });
    sync();
  };
})();

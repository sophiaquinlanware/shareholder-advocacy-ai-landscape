// Lab pathways: routes to a frontier lab through the companies tied to it.
// Owner (2026-11-26): "I want leverage over Lab X. Which public companies are routes to it, what kind of pull
// does each one have, and can I act there this season?" Plan: docs/plans/2026-11-26-lab-routes.md.
// Lab first: a routes table for the chosen lab, then labs reached by company, the data's gaps, and the map
// (investors -> companies in the AI value chain -> frontier labs).
// Reads data/pathways.json (company-to-lab ties), data/graph.json (who filed at which company) and, through
// window.LENS_CTX, companies.json (rights, deadlines), proposals.json (AI proposals, support) and asks.json.
// Never claim: ties are routes, not pressure; related asks are this site's grouping, not advice.

(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const link = (url, label = "source") => url ? `<a class="src" href="${esc(url)}" target="_blank" rel="noopener">[${esc(label)}]</a>` : `<span class="unverified">source pending</span>`;
  const extLink = (url, text) => url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}</a>` : `${esc(text)} <span class="unverified">source pending</span>`;
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#888";
  const ctx = () => window.LENS_CTX || {};

  let S = null;

  // ---------- Tie groups and related asks (this site's reading) ----------
  const GROUPS = {
    owner: { label: "Owner", asks: ["ask-ai-oversight-reporting"] },
    major: { label: "Major shareholder", asks: ["ask-ai-oversight-reporting"] },
    board: { label: "Board seat or observer", asks: ["ask-ai-oversight-reporting"] },
    coinvestor: { label: "Co-investor", asks: ["ask-ai-oversight-reporting"] },
    compute: { label: "Compute", asks: ["ask-dc-climate-energy", "ask-dc-water", "ask-dc-siting-rights", "ask-customer-due-diligence"] },
    chips: { label: "Chips", asks: ["ask-customer-due-diligence"] },
    customer: { label: "Customer", asks: ["ask-ai-misinformation", "ask-child-safety", "ask-ai-bias", "ask-ai-training-data", "ask-targeted-ads-rights"] },
  };
  // Precedence when a company has several ties to one lab: the row takes the first group in this order.
  const GROUP_ORDER = ["owner", "major", "board", "compute", "chips", "coinvestor", "customer"];
  function groupOf(t) {
    if (t.type === "parent company") return "owner";
    if (t.type === "board seat or observer") return "board";
    if (t.type === "equity stake") return (t.strength || 0) >= 3 ? "major" : "coinvestor";
    if (t.type === "cloud/compute provider") return "compute";
    if (t.type === "chip supplier") return "chips";
    return "customer"; // distribution partner; revenue share/commercial agreement
  }

  // ---------- Joins ----------
  const tickersOf = (pc) => String(pc.ticker || "").split(/\s*\/\s*/).filter(Boolean);
  function recordFor(pc) {
    const list = ctx().companies || [];
    const ts = tickersOf(pc);
    return list.find((c) => ts.includes(c.ticker)) || null;
  }
  // proposals.json covers AI proposals at the companies subject to US proxy rules, meetings from 2023.
  const inProposalScope = (rec) => !!rec && rec.shareholder_route === "US proxy rules apply";
  const proposalsAt = (pc) => { const ts = tickersOf(pc); return (ctx().proposals || []).filter((p) => ts.includes(p.company)); };

  // Who filed AI proposals at which company, from the shared graph (exempt solicitations are not filings).
  const FILED = new Set(["lead filer", "co-filer", "filed (named in proxy)"]);
  function investorLinks(G) {
    if (!G || !G.nodes) return [];
    const byId = new Map(G.nodes.map((n) => [n.id, n]));
    const pairs = new Map();
    for (const e of G.edges) {
      const o = byId.get(e.source), p = byId.get(e.target);
      if (!o || !p || !["investor", "coalition"].includes(o.type) || p.type !== "proposal" || !FILED.has(e.type)) continue;
      const key = o.id + "|" + p.company;
      if (!pairs.has(key)) pairs.set(key, { org: { id: o.id, name: o.label }, ticker: p.company, proposals: [] });
      pairs.get(key).proposals.push({ ...p, title: p.label, relation: e.type, edge_source: e.source_url });
    }
    return [...pairs.values()];
  }
  const filersAt = (pc) => { const ts = tickersOf(pc); return S.inv.filter((p) => ts.includes(p.ticker)); };

  function deadlineOf(rec) {
    if (!rec || !rec.next_proposal_deadline) return null;
    // deadlineInfo returns null once the date has passed.
    const d = window.RULES && window.RULES.deadlineInfo ? window.RULES.deadlineInfo(rec) : null;
    const days = d && d.days >= 0 ? d.days : null;
    return { date: rec.next_proposal_deadline.slice(0, 10), days, open: days != null, source: rec.next_proposal_deadline_source || null };
  }

  // One row per company tied to the lab.
  function routesFor(labId) {
    const ties = S.data.ties.filter((t) => t.to === labId);
    const byCo = new Map();
    ties.forEach((t) => { if (!byCo.has(t.from)) byCo.set(t.from, []); byCo.get(t.from).push(t); });
    const askLabel = new Map((ctx().asks || []).map((a) => [a.id, a.label]));
    return [...byCo.entries()].map(([id, ts]) => {
      const pc = S.data.public_companies.find((c) => c.id === id) || { id, name: id, ticker: "" };
      ts.sort((a, b) => (b.strength || 0) - (a.strength || 0));
      const rec = recordFor(pc);
      const props = proposalsAt(pc);
      const groups = [...new Set(ts.map(groupOf))].sort((a, b) => GROUP_ORDER.indexOf(a) - GROUP_ORDER.indexOf(b));
      const askIds = [...new Set(groups.flatMap((g) => GROUPS[g].asks))];
      const related = askIds.map((a) => ({ id: a, label: askLabel.get(a) || a, n: props.filter((p) => p.ask_id === a).length }));
      const other = props.filter((p) => !askIds.includes(p.ask_id));
      const voted = props.filter((p) => askIds.includes(p.ask_id) && p.support_pct != null)
        .sort((a, b) => String(b.meeting_date || b.year).localeCompare(String(a.meeting_date || a.year)));
      return { pc, ties: ts, strength: ts[0].strength || 0, groups, other, inScope: inProposalScope(rec), rec, deadline: deadlineOf(rec), props, filers: filersAt(pc), related, voted };
    });
  }

  // ---------- Shell ----------
  function shell(el, data) {
    const labs = data.labs.map((l) => `<button type="button" class="chip" data-lab="${esc(l.id)}" aria-pressed="false">${esc(l.name)}</button>`).join("");
    const cos = byTier(data.public_companies).map((c) => `<label class="chip"><input type="checkbox" value="${esc(c.id)}"> ${esc(c.name)}${tierOf(c)[1] ? `<span class="ticker"> · ${esc(tierOf(c)[1])}</span>` : ""}</label>`).join("");
    el.innerHTML = `
      <h2>Lab pathways</h2>
      <p class="intro">Routes to each frontier lab through the companies tied to it: ${data.ties.length} sourced ties between ${data.public_companies.length} companies and ${data.labs.length} labs, with shareholder rights, filing deadlines and the filers on record at each company.</p>
      <p class="pw-label" id="pw-labs-h">Lab</p>
      <div class="chips" role="group" aria-labelledby="pw-labs-h">${labs}</div>
      <div id="pw-lab-about" class="pw-about"></div>
      <h3 class="sub-h" id="pw-routes-h" tabindex="-1">Routes</h3>
      <p class="count-line" id="pw-status" role="status"></p>
      <div class="table-wrap pw-routes" id="pw-routes" tabindex="0" role="region" aria-labelledby="pw-routes-h"></div>
      <p class="note pw-note">Tie groups, strength and related asks are this site's reading, not disclosed figures or advice. Owner: parent company. Major shareholder: an equity stake rated strength 3. Board seat or observer: a board seat or observer role. Compute: cloud or compute provider. Chips: chip supplier. Co-investor: an equity stake rated 1–2. Customer: distribution partner or commercial agreement. A company with several ties is sorted by its strongest. Related asks are the recurring asks (Proposals tab) grouped with each tie type; the count is AI proposals already filed at that company under each.</p>
      <div id="pw-findings"></div>
      <h3 class="sub-h">Labs reached, by company</h3>
      <p class="count-line">Number of frontier labs each company has a sourced tie to.</p>
      <ol class="pw-bars" id="pw-bars"></ol>
      <h3 class="sub-h">Gaps in the tie data</h3>
      <ul class="pw-gaps">${(data.gaps || []).map((g) => `<li>${esc(g)}</li>`).join("") || "<li>None listed.</li>"}</ul>
      <h3 class="sub-h">Value-chain ties: companies → frontier labs</h3>
      <p class="count-line">Each line is a sourced tie (ownership, investment, board seat, compute, chips or customer); width = tie strength (1–3). Who files proposals where is in the AI advocacy network. Choose companies to see the labs they reach together.</p>
      <details class="pw-cos"><summary>Companies</summary><div class="chips">${cos}</div></details>
      <div class="net-legend"><span class="leg static"><span class="dot" style="background:var(--t-equity)"></span>company → lab tie (width = strength)</span></div>
      <div id="pw-graph" class="net-graph pw-graph"></div>
      <div id="pw-panel" class="pw-panel"></div>
      <details class="pw-all"><summary>All ties (${data.ties.length})</summary>
        <p class="count-line" id="pw-count"></p>
        <div class="table-wrap" id="pw-ties"></div>
      </details>`;
  }

  // ---------- Routes table ----------
  const sortState = { key: "default", dir: "desc" };
  const defaultSort = (a, b) => b.strength - a.strength
    || (b.deadline && b.deadline.open ? 1 : 0) - (a.deadline && a.deadline.open ? 1 : 0)
    || (a.deadline && a.deadline.open ? a.deadline.days : 1e9) - (b.deadline && b.deadline.open ? b.deadline.days : 1e9)
    || a.pc.name.localeCompare(b.pc.name);

  function cellCompany(r) {
    const role = tierOf(r.pc)[1];
    const has = r.rec && ctx().hasCompany && ctx().hasCompany(r.rec.ticker);
    const name = has ? `<button type="button" class="linklike" data-open-co="${esc(r.rec.ticker)}">${esc(r.pc.name)}</button>` : `<strong>${esc(r.pc.name)}</strong>`;
    return `${name}${r.pc.ticker ? ` <span class="ticker">${esc(r.pc.ticker)}</span>` : ""}${role ? `<br><span class="ticker">${esc(role)}</span>` : ""}`;
  }
  // Tie text the data marks as reported or unverified keeps that flag next to the group.
  const flagged = (t) => /unverified|reported/i.test(t.description || "");
  // Links the data's own gaps list says to recheck (pathways.json gaps 5 and 8).
  const RECHECK_LABS = new Set(["msai", "amazon-agi", "msl"]);
  const RECHECK_TIES = new Set(["aapl|openai", "googl|openai|cloud/compute provider"]);
  const recheck = (t) => RECHECK_TIES.has(`${t.from}|${t.to}`) || RECHECK_TIES.has(`${t.from}|${t.to}|${t.type}`);
  const recheckTag = ` <span class="pw-flag">URL to recheck (see gaps)</span>`;
  const cellTie = (r) => r.ties.map((t) => `<div class="pw-tie"><strong>${esc(GROUPS[groupOf(t)].label)}</strong>: ${esc(t.type)}${t.as_of ? `, as of ${esc(t.as_of)}` : ""}.${flagged(t) ? ` <span class="pw-flag">reported or unverified</span>` : ""} ${esc(t.description || "")} ${link(t.source_url)}${recheck(t) ? recheckTag : ""}</div>`).join("");
  const cellStrength = (r) => r.ties.map((t) => `<div class="pw-tie"><strong>${esc(t.strength ?? "?")}</strong>${t.strength_reason ? ` ${esc(t.strength_reason)}` : ""} ${link(t.source_url)}</div>`).join("");
  // US proxy rights and the next filing deadline in one cell.
  function cellRights(r) {
    if (!r.rec) return `<span class="unverified">not tracked here</span>`;
    const route = `${esc(r.rec.shareholder_route || "route not recorded")} ${link(r.rec.route_source_url || (r.rec.threshold && r.rec.threshold.url))}`;
    const d = r.deadline;
    if (!d) return `${route}<br>Deadline: none on record`;
    const when = d.open ? `<strong>open</strong>, ${d.days} day${d.days === 1 ? "" : "s"} left` : "passed";
    return `${route}<br>Deadline <span class="nowrap">${esc(d.date)}</span>: ${when} ${link(d.source)}`;
  }
  function cellFilers(r) {
    if (!r.inScope) return `<span class="unverified">not tracked here (AI proposals are tracked at companies under US proxy rules)</span>`;
    if (!r.props.length) return `<strong class="pw-none">No AI proposals filed here yet</strong><br><span class="ticker">in this site's records, meetings from 2023</span>`;
    const names = r.filers.map((f) => {
      const p = f.proposals[0];
      const k = f.proposals.length;
      return `${extLink(p.edge_source || p.source_url, f.org.name)}${k > 1 ? ` <span class="ticker">(${k}; link is the first)</span>` : ""}`;
    });
    const n = r.props.length;
    const lead = `${n} AI proposal${n === 1 ? "" : "s"} on record`;
    // Long lists fold after six names, so a row stays readable.
    const list = names.length > 6 ? `${names.slice(0, 6).join(", ")} <details class="pw-more"><summary>${names.length - 6} more</summary>${names.slice(6).join(", ")}</details>` : names.join(", ");
    return names.length ? `<strong>${names.length}</strong> filer${names.length === 1 ? "" : "s"}: ${list}<br><span class="ticker">${lead}</span>` : `${lead}; no filer named in the data`;
  }
  const cellAsks = (r) => {
    const n = (k) => (r.inScope ? ` <span class="ticker">(${k} filed here)</span>` : "");
    const other = r.inScope && r.other.length ? `<li><details class="pw-more"><summary>Other AI proposals here (${r.other.length})</summary>${r.other.map((p) => extLink(p.proxy_url, `${p.title} (${p.year})`)).join("; ")}</details></li>` : "";
    const filed = r.related.reduce((t, a) => t + a.n, 0);
    const head = `${r.related.length} related ask${r.related.length === 1 ? "" : "s"}${r.inScope ? `, ${filed} proposal${filed === 1 ? "" : "s"} filed here` : ""}`;
    return `<details class="pw-more pw-asks-d"><summary>${head}</summary><ul class="pw-asks">${r.related.map((a) => `<li>${esc(a.label)}${n(a.n)}</li>`).join("")}</ul></details>${other ? `<ul class="pw-asks">${other}</ul>` : ""}`;
  };
  // Dual-class at company level: any proposal at that company whose support note says so.
  const isDualNote = (p) => /dual|multi-class|class b/i.test(p.support_note || "") && !/single class/i.test(p.support_note || "");
  const isDual = (p) => (ctx().proposals || []).some((q) => q.company === p.company && isDualNote(q));
  function cellSupport(r) {
    if (!r.inScope) return `<span class="unverified">not tracked here</span>`;
    if (!r.voted.length) return r.related.some((a) => a.n) ? "no vote on record" : "none under related asks";
    const p = r.voted[0];
    const src = p.results_url ? link(p.results_url, "results") : `${link(p.proxy_url, "proxy")} <span class="unverified">results source pending</span>`;
    const more = r.voted.length > 1 ? `<br><span class="ticker">latest of ${r.voted.length} votes</span>` : "";
    return `<strong>${esc(p.support_pct.toFixed(1))}%</strong> (${esc(p.year)})${isDual(p) ? " <span class=\"pw-flag\">dual-class</span>" : ""} ${esc(p.title)} ${src}${more}`;
  }

  const COLS = [
    { key: "company", label: "Company", say: ["company, A to Z", "company, Z to A"], first: "asc", sortValue: (r) => r.pc.name.toLowerCase(), render: cellCompany },
    { key: "tie", label: "Tie", say: ["tie group, customer first", "tie group, owner first"], first: "desc", sortValue: (r) => -GROUP_ORDER.indexOf(r.groups[0]), render: cellTie },
    { key: "strength", label: "Strength (site rating, 1–3)", say: ["strength, weakest first", "strength, strongest first"], first: "desc", sortValue: (r) => r.strength, render: cellStrength },
    { key: "deadline", label: "US proxy rights and next filing deadline", say: ["deadline, latest first", "deadline, soonest first"], first: "desc", sortValue: (r) => (r.deadline && r.deadline.open ? -r.deadline.days : -1e9), render: cellRights },
    { key: "filers", label: "Filers with AI proposals here", say: ["filers, fewest first", "filers, most first"], first: "desc", sortValue: (r) => r.filers.length * 1000 + r.props.length, render: cellFilers },
    { key: "asks", label: "Related asks (site grouping)", render: cellAsks },
    { key: "support", label: "Past support on related asks", say: ["past support, lowest first", "past support, highest first"], first: "desc", sortValue: (r) => (r.voted[0] ? r.voted[0].support_pct : -1), render: cellSupport },
  ];

  function routesTable() {
    const box = document.getElementById("pw-routes");
    const lab = S.data.labs.find((l) => l.id === S.lab);
    let rows = routesFor(S.lab);
    if (sortState.key === "default") rows = rows.sort(defaultSort);
    const st = sortState.key === "default" ? { key: "", dir: "desc" } : sortState;
    const html = typeof sortableTable === "function" ? sortableTable(COLS, rows, st, (r) => `data-co="${esc(r.pc.id)}"`) : "";
    box.innerHTML = html.replaceAll(' aria-sort="none"', "").replace("<table>", `<table class="pw-routes-t"><caption class="visually-hidden">Routes to ${esc(lab.name)}: companies tied to it, sorted ${sortState.key === "default" ? "by strongest tie, then open deadline" : "by " + esc((COLS.find((c) => c.key === sortState.key) || {}).label || "")}</caption>`);
    // Each column starts in its natural direction; a second click flips it. The status keeps the count.
    box.querySelectorAll(".th-sort").forEach((b) => b.addEventListener("click", () => {
      const c = COLS.find((x) => x.key === b.dataset.sort);
      sortState.dir = sortState.key === c.key ? (sortState.dir === "asc" ? "desc" : "asc") : c.first;
      sortState.key = c.key;
      routesTable();
      document.getElementById("pw-status").textContent = `${S.summary} Sorted by ${c.say[sortState.dir === "asc" ? 0 : 1]}.`;
      const again = box.querySelector(`.th-sort[data-sort="${c.key}"]`);
      if (again) again.focus();
    }));
    box.querySelectorAll("[data-open-co]").forEach((b) => b.addEventListener("click", () => ctx().openCompany && ctx().openCompany(b.dataset.openCo)));
    // Phones: each cell carries its column name, so a row reads as a card.
    box.querySelectorAll("tbody tr").forEach((tr) => [...tr.children].forEach((td, i) => td.setAttribute("data-col", COLS[i] ? COLS[i].label : "")));
    return rows;
  }

  function findings(rows, lab) {
    const none = rows.filter((r) => r.inScope && !r.props.length).sort((a, b) => a.pc.name.localeCompare(b.pc.name));
    const crowded = rows.filter((r) => r.filers.length).sort((a, b) => b.filers.length - a.filers.length || a.pc.name.localeCompare(b.pc.name)).slice(0, 3);
    const tracked = rows.filter((r) => r.inScope).length;
    const open = rows.filter((r) => r.deadline && r.deadline.open).sort((a, b) => a.deadline.days - b.deadline.days);
    document.getElementById("pw-findings").innerHTML = `
      <h3 class="sub-h">Findings for ${esc(lab.name)}</h3>
      <ul class="pw-findings">
        <li><strong>No AI proposals filed here yet</strong> (${none.length} of the ${tracked} tracked for proposals; meetings from 2023): ${none.map((r) => esc(r.pc.name)).join(", ") || "none"}.</li>
        <li><strong>Companies by number of filers on record</strong>: ${crowded.map((r) => `${esc(r.pc.name)} (${r.filers.length})`).join(", ") || "no named filers at these companies"}.</li>
        <li><strong>Filing deadline open</strong> (${open.length} of ${rows.length}): ${open.map((r) => `${esc(r.pc.name)} (${esc(r.deadline.date)}) ${link(r.deadline.source)}`).join(", ") || "none on record"}.</li>
      </ul>`;
    return { none, open };
  }

  function labsReached() {
    const counts = S.data.public_companies.map((c) => ({ c, labs: new Set(S.data.ties.filter((t) => t.from === c.id).map((t) => t.to)) }))
      .filter((x) => x.labs.size).sort((a, b) => b.labs.size - a.labs.size || a.c.name.localeCompare(b.c.name));
    const max = Math.max(1, ...counts.map((x) => x.labs.size));
    const labName = (id) => ((S.data.labs.find((l) => l.id === id) || {}).name || id).replace(/\s*\(.*\)/, "");
    document.getElementById("pw-bars").innerHTML = counts.map((x) => `
      <li class="pw-bar${S.lab && x.labs.has(S.lab) ? " on" : ""}">
        <span class="pw-bar-name">${esc(x.c.name)}</span>
        <span class="pw-bar-track"><span class="pw-bar-fill" style="width:${(x.labs.size / max) * 100}%"></span><span class="pw-bar-n">${x.labs.size}</span></span>
        <span class="pw-bar-labs">${[...x.labs].map(labName).map(esc).join(", ")}</span>
      </li>`).join("");
  }

  // ---------- Map (three columns) ----------
  const ROLE_ORDER = ["chips", "datacenters", "cloud", "labs", "consumer", "business", "capital"];
  const tierOf = (c) => {
    const co = window.companyFor ? window.companyFor({ ticker: tickersOf(c).pop() || c.ticker, id: c.id }) : null;
    const r = co && window.ROLES ? window.ROLES.roleOf(co) : null;
    return r ? [ROLE_ORDER.indexOf(r), window.ROLES.label(r)] : [9, ""];
  };
  const byTier = (list) => [...list].sort((a, b) => tierOf(a)[0] - tierOf(b)[0] || a.name.localeCompare(b.name));

  // Filers shown in the map: with a lab chosen, only those active at its companies.
  function shownInvestors() {
    let inv = S.inv;
    if (S.selectedCos.size) inv = inv.filter((p) => S.selectedCos.has(coIdForTicker(p.ticker)));
    else if (S.lab) {
      const cos = new Set(S.data.ties.filter((t) => t.to === S.lab).map((t) => t.from));
      inv = inv.filter((p) => cos.has(coIdForTicker(p.ticker)));
    }
    return inv;
  }
  const coIdForTicker = (t) => (S.data.public_companies.find((c) => tickersOf(c).includes(t)) || {}).id;

  function layout() {
    const el = document.getElementById("pw-graph");
    const W = el.clientWidth || 800;
    const narrow = W < 640;
    // Value-chain ties only (owner, 2026-11-26): this map shows how companies tie to labs; who files which proposal
    // is the AI advocacy network's job. Filers stay in the routes table above.
    const inv = [];
    const cols = [
      { key: "co", title: narrow ? "Value chain" : "Value chain (companies tied to labs)", items: byTier(S.data.public_companies).map((c) => ({ id: "c:" + c.id, label: c.name.replace(/\s*\(.*\)/, ""), ref: c })) },
      { key: "lab", title: "Frontier labs", items: S.data.labs.map((l) => ({ id: "l:" + l.id, label: l.name.replace(/\s*\(.*\)/, ""), ref: l })) },
    ];
    const rowH = narrow ? 36 : 24;
    const H = Math.max(260, Math.max(...cols.map((c) => c.items.length)) * rowH + 60);
    // Two label areas (companies, labs) with the ties running between them.
    const G = narrow ? 40 : Math.max(80, Math.round(W * 0.18));
    const colW = (W - 16 - G) / 2;
    const xs = [8, 8 + colW + G];
    const pos = new Map();
    cols.forEach((col, ci) => {
      const span = col.items.length * rowH;
      const top = 40 + (H - 50 - span) / 2;
      col.items.forEach((it, i) => pos.set(it.id, { x: xs[ci], y: top + i * rowH + rowH / 2, col: col.key, ...it }));
    });
    return { cols, pos, W, H, xs, colW, narrow, inv };
  }

  // Wrap a label into at most three lines that fit `max` px; never cut a word unless it alone is too long.
  function wrapLabel(textEl, label, max, x = 8) {
    const words = label.split(/\s+/);
    const lines = [""];
    const probe = textEl.append("tspan");
    const fits = (s) => { probe.text(s); return probe.node().getComputedTextLength() <= max; };
    for (const w of words) {
      const cur = lines[lines.length - 1];
      const next = cur ? cur + " " + w : w;
      if (fits(next) || !cur) lines[lines.length - 1] = next;
      else lines.push(w);
    }
    // Up to three lines; a name longer than that ends in "…" and keeps its full text as a tooltip.
    let shown = lines;
    if (lines.length > 3) {
      shown = lines.slice(0, 3);
      let last = shown[2] + "…";
      while (!fits(last) && last.length > 2) last = last.slice(0, -2) + "…";
      shown[2] = last;
      textEl.append("title").text(label);
    }
    probe.remove();
    const lh = 11;
    shown.forEach((l, i) => textEl.append("tspan").attr("x", x).attr("dy", i === 0 ? 4 - ((shown.length - 1) * lh) / 2 : lh).text(l));
  }

  function draw() {
    const el = document.getElementById("pw-graph");
    el.innerHTML = "";
    const L = layout();
    S.L = L;
    el.style.height = L.H + "px";
    const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, L.W, L.H]).attr("width", L.W).attr("height", L.H)
      .attr("role", "img").attr("aria-label", "Map of filers, companies and frontier labs; the routes table above has the same ties.");
    L.cols.forEach((c, i) => svg.append("text").attr("x", i === 0 ? 8 : L.xs[i]).attr("y", 20)
      .attr("font-size", 12).attr("font-weight", 400).attr("letter-spacing", ".04em").attr("fill", cssVar("--ink-soft")).text(c.title.toUpperCase()));

    const curve = (a, b) => { const mx = (a.x + b.x) / 2; return `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`; };
    const linkData = [];
    for (const p of L.inv) {
      const a = L.pos.get("o:" + p.org.id), b = L.pos.get("c:" + coIdForTicker(p.ticker));
      if (a && b) linkData.push({ kind: "inv", a, b, w: Math.min(4, 0.8 + p.proposals.length * 0.6) * (L.narrow ? 0.5 : 1), color: cssVar("--t-filer"), ref: p });
    }
    for (const t of S.data.ties) {
      const a = L.pos.get("c:" + t.from), b = L.pos.get("l:" + t.to);
      if (a && b) linkData.push({ kind: "tie", a, b, w: 1 + (t.strength || 1) * 1.4, color: cssVar("--t-equity"), ref: t });
    }
    const labelW = L.colW;
    S.links = svg.append("g").attr("fill", "none").selectAll("path").data(linkData).join("path")

      .attr("stroke", (d) => d.color).attr("stroke-width", (d) => Math.max(0.8, d.w * 0.8));
    S.nodes = svg.append("g").selectAll("g").data([...L.pos.values()]).join("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`).style("cursor", "pointer")
      .on("click", (ev, d) => onNode(d));
    S.nodes.append("circle").attr("r", 4).attr("fill", (d) => cssVar("--blue"));
    S.nodes.append("text").attr("y", 0).attr("font-size", L.narrow ? 10 : 11.5).attr("fill", cssVar("--ink"))
      .attr("stroke", cssVar("--surface") || "#fff").attr("stroke-width", 3).attr("paint-order", "stroke").attr("stroke-linejoin", "round")
      .attr("text-anchor", "start")
      .each(function (d) { wrapLabel(d3.select(this), d.label, labelW - 12, 8); d.tw = this.getBBox().width; });
    // Company → lab lines start just after each company's label.
    S.links.attr("d", (d) => curve({ x: d.a.x + 12 + (d.a.tw || labelW), y: d.a.y }, { x: d.b.x - 4, y: d.b.y }));
    apply();
  }

  function activeIds() {
    if (S.selectedCos.size) {
      const ties = S.data.ties.filter((t) => S.selectedCos.has(t.from));
      return new Set([...[...S.selectedCos].map((c) => "c:" + c), ...ties.map((t) => "l:" + t.to), ...shownInvestors().map((p) => "o:" + p.org.id)]);
    }
    if (!S.lab) return null;
    const cos = S.data.ties.filter((t) => t.to === S.lab).map((t) => t.from);
    return new Set(["l:" + S.lab, ...cos.map((c) => "c:" + c), ...shownInvestors().map((p) => "o:" + p.org.id)]);
  }
  function apply() {
    if (!S.links) return;
    const active = activeIds();
    S.links.attr("stroke-opacity", (d) => (!active ? 0.35 : active.has(d.a.id) && active.has(d.b.id) ? 0.95 : 0.05));
    // Nodes outside the selection stay readable: grey text rather than near-invisible.
    S.nodes.selectAll("circle").attr("opacity", (d) => (!active || active.has(d.id) ? 1 : 0.35));
    S.nodes.selectAll("text").attr("fill", (d) => cssVar(!active || active.has(d.id) ? "--ink" : "--ink-soft"));
  }
  const redrawMap = () => { if (S.drawn) draw(); };

  // ---------- Selection ----------
  function selectLab(labId, focus) {
    if (S.lab === labId && !S.selectedCos.size) { if (focus) document.getElementById("pw-routes-h").focus(); return; }
    S.lab = labId;
    S.selectedCos.clear();
    document.querySelectorAll('#tab-pathways .pw-cos input[type="checkbox"]').forEach((b) => (b.checked = false));
    document.getElementById("pw-panel").innerHTML = "";
    document.querySelectorAll("#tab-pathways [data-lab]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lab === labId)));
    const lab = S.data.labs.find((l) => l.id === labId);
    // A lab that is listed itself (Anthropic as ANT; xAI inside SpaceX) has its own rights record.
    const base = lab.name.replace(/\s*\(.*\)/, "");
    const self = (ctx().companies || []).find((c) => c.ticker && (c.name === base || c.name.includes(`(including ${base})`)));
    const selfLine = self ? `<p>${esc(base)} is ${self.name === base ? "listed itself" : "inside " + esc(self.name)} (${esc(self.ticker)}): ${esc(self.shareholder_route || "")} ${link(self.route_source_url)}${ctx().hasCompany && ctx().hasCompany(self.ticker) ? ` <button type="button" class="linklike" data-open-co="${esc(self.ticker)}">Open in Company lookup</button>` : ""}</p>` : "";
    const about = document.getElementById("pw-lab-about");
    about.innerHTML = `<p><strong>${esc(lab.name)}</strong>${lab.status ? ` <span class="ticker">${esc(lab.status)}</span>` : ""}. ${esc(lab.description || "")} ${link(lab.source_url)}${RECHECK_LABS.has(lab.id) ? recheckTag : ""}</p>${selfLine}`;
    about.querySelectorAll("[data-open-co]").forEach((b) => b.addEventListener("click", () => ctx().openCompany(b.dataset.openCo)));
    document.getElementById("pw-routes-h").textContent = `Routes to ${lab.name}`;
    const rows = routesTable();
    const f = findings(rows, lab);
    S.summary = `${rows.length} compan${rows.length === 1 ? "y" : "ies"} tied to ${lab.name}: ${f.open.length} with an open filing deadline, ${f.none.length} with no AI proposals filed yet.`;
    const c = COLS.find((x) => x.key === sortState.key);
    document.getElementById("pw-status").textContent = c ? `${S.summary} Sorted by ${c.say[sortState.dir === "asc" ? 0 : 1]}.` : S.summary;
    labsReached();
    tieTable(S.data.ties);
    redrawMap();
    if (focus) document.getElementById("pw-routes-h").focus();
  }

  function tieTable(ties) {
    const coName = (id) => (S.data.public_companies.find((c) => c.id === id) || {}).name || id;
    const labName = (id) => (S.data.labs.find((l) => l.id === id) || {}).name || id;
    const rows = [...ties].sort((a, b) => coName(a.from).localeCompare(coName(b.from)) || (b.strength || 0) - (a.strength || 0));
    document.getElementById("pw-count").textContent = `${rows.length} of ${S.data.ties.length} ties${rows.length < S.data.ties.length ? " (companies chosen in the map)" : ""}.`;
    document.getElementById("pw-ties").innerHTML = `<table><thead><tr><th scope="col">Company</th><th scope="col">Lab</th><th scope="col">Tie</th><th scope="col">Strength</th><th scope="col">Detail</th><th scope="col">As of</th></tr></thead><tbody>${rows.map((t) => `<tr><td>${esc(coName(t.from))}</td><td>${esc(labName(t.to))}</td><td>${esc(t.type)}</td><td>${esc(t.strength ?? "")}</td><td>${esc(t.description || "")} ${link(t.source_url)}</td><td class="nowrap">${esc(t.as_of || "")}</td></tr>`).join("")}</tbody></table>`;
  }

  // Secondary filter: companies chosen in the map, and the labs they reach together.
  function selectCompanies() {
    const cos = S.selectedCos;
    if (!cos.size) { document.getElementById("pw-panel").innerHTML = ""; tieTable(S.data.ties); redrawMap(); return; }
    const ties = S.data.ties.filter((t) => cos.has(t.from));
    const reach = new Map();
    ties.forEach((t) => {
      if (!reach.has(t.to)) reach.set(t.to, { score: 0, ties: [] });
      const r = reach.get(t.to); r.score += t.strength || 1; r.ties.push(t);
    });
    const inv = S.inv.filter((p) => cos.has(coIdForTicker(p.ticker)));
    const coName = (id) => (S.data.public_companies.find((c) => c.id === id) || {}).name || id;
    const labName = (id) => (S.data.labs.find((l) => l.id === id) || {}).name || id;
    const rows = [...reach.entries()].sort((a, b) => b[1].score - a[1].score).map(([lab, r]) => `
      <li><strong>${esc(labName(lab))}</strong> <span class="ticker">sum of site strength ratings ${r.score}</span>
      <ul class="sub">${r.ties.map((t) => `<li>${esc(coName(t.from))}: ${esc(t.type)}. ${esc(t.description)} ${link(t.source_url)}</li>`).join("")}</ul></li>`).join("");
    const shared = [...new Map(inv.map((p) => [p.org.id, p.org])).values()];
    document.getElementById("pw-panel").innerHTML = `
      <h4 class="pw-h4">${[...cos].map(coName).map(esc).join(" + ")}: labs reached (${reach.size})</h4>
      <ul class="conn">${rows || "<li>No sourced ties yet.</li>"}</ul>
      <h4 class="pw-h4">Filers with AI proposals at these companies (${shared.length})</h4>
      <p>${shared.map((o) => esc(o.name)).join(", ") || "None in the data yet."}</p>`;
    tieTable(ties);
    redrawMap();
  }

  function onNode(d) {
    if (d.col === "lab") return selectLab(d.ref.id, true);
    if (d.col === "co") {
      const box = document.querySelector(`#tab-pathways .pw-cos input[value="${d.ref.id}"]`);
      if (box) { box.checked = !box.checked; box.dispatchEvent(new Event("change")); document.querySelector("#tab-pathways .pw-cos").open = true; }
      return;
    }
    const mine = S.inv.filter((p) => p.org.id === d.ref.id);
    S.selectedCos = new Set(mine.map((p) => coIdForTicker(p.ticker)).filter(Boolean));
    document.querySelectorAll('#tab-pathways .pw-cos input[type="checkbox"]').forEach((b) => (b.checked = S.selectedCos.has(b.value)));
    document.querySelector("#tab-pathways .pw-cos").open = true;
    selectCompanies();
  }

  window.renderPathways = function (data, network) {
    const el = document.getElementById("tab-pathways");
    if (!data || !data.labs || !data.labs.length) {
      el.innerHTML = `<div class="coming"><h2>Lab pathways</h2><p>Being sourced now.</p></div>`;
      return;
    }
    S = { data, inv: investorLinks(network), selectedCos: new Set(), lab: null };
    shell(el, data);
    el.querySelectorAll("[data-lab]").forEach((b) => b.addEventListener("click", () => selectLab(b.dataset.lab, false)));
    el.querySelectorAll('.pw-cos input[type="checkbox"]').forEach((b) => b.addEventListener("change", () => {
      if (b.checked) S.selectedCos.add(b.value); else S.selectedCos.delete(b.value);
      selectCompanies();
    }));
    selectLab(data.labs[0].id, false);
    const go = () => { if (!el.hidden && !S.drawn && window.d3) { S.drawn = true; draw(); } };
    new MutationObserver(go).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    go();
    if (!window.d3) window.addEventListener("load", go, { once: true });
    let t;
    window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { if (S.drawn && !el.hidden) draw(); }, 250); });
  };
})();

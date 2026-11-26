// AI Stewardship Commons: renders each tab from the JSON files in /data.
// Every fact on the page comes from a data file, and every data file row carries its source link.

const DATA = {};
const FILES = ["site", "companies", "upcoming", "voting_paths", "network", "people", "pathways", "changes", "tracking", "proposals", "causality", "graph"];

// People tab: heads of engagement, grouped by organization. Public professional info only.
function renderPeople() {
  const people = DATA.people.people || [];
  const orgs = new Map((DATA.network.organizations || []).map((o) => [o.id, o]));
  const el = document.getElementById("tab-people");
  el.innerHTML = `
    <h2>People leading engagement</h2>
    <p class="intro">The heads of stewardship and engagement at organizations active on AI, so teams working on the same company or issue can find each other. Only public professional details are listed: name, title, organization and a link to an official bio or public profile. Each person also appears in the advocacy network.</p>
    <div class="net-controls"><input type="search" id="people-search" placeholder="Search by name, organization or AI focus" aria-label="Search people"></div>
    <div id="people-grid" class="grid"></div>`;
  const draw = (q) => {
    const rows = people.filter((p) => !q || [p.name, p.org_name, p.title, p.ai_focus].join(" ").toLowerCase().includes(q));
    document.getElementById("people-grid").innerHTML = rows.map((p) => {
      const org = orgs.get(p.org_id);
      const inGraph = org ? `<button class="linklike" data-person="person-${esc(p.id)}">See in network</button>` : "";
      return `<article class="card">
        <h3>${esc(p.name)}</h3>
        <p class="status-note" style="margin:0 0 8px">${esc(p.title)}, ${esc(p.org_name)}</p>
        ${p.ai_focus ? `<p style="margin:0 0 8px;font-size:14px"><strong>AI work:</strong> ${esc(p.ai_focus)}</p>` : ""}
        <p style="margin:0;font-size:14px">${src(p.profile_url, "public profile")} ${inGraph}</p>
      </article>`;
    }).join("") || `<p class="status-note">No matches.</p>`;
    el.querySelectorAll("[data-person]").forEach((b) => b.addEventListener("click", () => {
      document.querySelector('.tabs button[data-tab="network"]').click();
      setTimeout(() => window.focusNetworkNode(b.dataset.person), 400);
    }));
  };
  draw("");
  document.getElementById("people-search").addEventListener("input", (e) => draw(e.target.value.trim().toLowerCase()));
}

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// A small "source" link. If a fact has no source yet, say so plainly instead of hiding it.
function src(url, label = "source") {
  if (!url) return ` <span class="unverified">source pending</span>`;
  return ` <a class="src" href="${esc(url)}" target="_blank" rel="noopener">[${esc(label)}]</a>`;
}
function srcList(list) {
  return (list || []).map((s) => src(s.url, s.label)).join("");
}
function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

const STATUS_LABEL = { open: "Still open", narrowing: "Narrowing", closed: "Closed", pending: "Being verified" };

function renderWhy() {
  const s = DATA.site;
  const items = s.why_now.map((e) => `
    <li><div class="date">${esc(e.date_label)}</div>
      <div>${esc(e.text)}${srcList(e.sources)}</div></li>`).join("");
  const levers = s.levers.map((l) => `<div class="lever"><strong>${esc(l.name)}</strong>${esc(l.text)}${srcList(l.sources)}</div>`).join("");
  document.getElementById("tab-why").innerHTML = `
    <h2>The ballot route is narrowing</h2>
    <p class="intro">${esc(s.why_intro)}</p>
    <ul class="timeline">${items}</ul>
    <h2>Where leverage still exists</h2>
    <p class="intro">${esc(s.levers_intro)}</p>
    <div class="levers">${levers}</div>`;
}

function renderRights() {
  const cards = DATA.companies.map((c) => {
    const st = c.route_status || "pending";
    const fact = (label, obj) => obj && obj.text
      ? `<div><dt>${esc(label)}</dt><dd>${esc(obj.text)}${src(obj.url)}</dd></div>` : "";
    const levers = (c.levers || []).map((l) => `<li>${esc(l.text)}${src(l.url)}</li>`).join("");
    return `<article class="card">
      <div class="co-head">
        <div><h3>${esc(c.name)}</h3><div class="ticker">${esc(c.ticker)}</div></div>
        <span class="pill ${esc(st)}">${esc(STATUS_LABEL[st] || st)}</span>
      </div>
      <p class="status-note">${esc(c.route_status_reason || "")}</p>
      <dl class="facts">
        ${fact("State of incorporation", c.state)}
        ${fact("Proposal rules in the bylaws", c.bylaw)}
        ${fact("Ownership threshold", c.threshold)}
        ${fact("Voting control", c.control)}
        ${fact("Director elections", c.director_voting)}
      </dl>
      ${(c.notes || []).length ? `<ul class="steps" style="margin-top:12px;font-size:14px">${c.notes.map((n) => `<li>${esc(n.text)}${src(n.url)}</li>`).join("")}</ul>` : ""}
      ${levers ? `<h4 style="margin:16px 0 4px;font-size:14px">Levers that survive</h4><ul class="steps">${levers}</ul>` : ""}
    </article>`;
  }).join("");
  document.getElementById("tab-rights").innerHTML = `
    <h2>Rights map</h2>
    <p class="intro">${esc(DATA.site.rights_intro)}</p>
    <div class="callout"><strong>How to read the status.</strong> ${esc(DATA.site.status_key)}</div>
    ${rightsMatrix()}
    <h2>Company detail</h2>
    <div class="grid">${cards}</div>`;
}

function renderWeighIn() {
  const up = DATA.upcoming;
  const meetings = up.meetings.map((m) => {
    const items = (m.items || []).map((i) => `<tr>
        <td>${esc(i.number)}</td><td>${esc(i.title)}${src(i.url)}</td>
        <td>${esc(i.topic)}</td><td>${esc(i.board_rec)}</td></tr>`).join("");
    return `<article class="card" style="margin-top:16px">
      <div class="co-head"><div><h3>${esc(m.company)}</h3>
        <div class="ticker">Annual meeting: ${esc(m.meeting_label)}${src(m.proxy_url, "proxy statement")}</div></div>
        <span class="pill ${m.status === "upcoming" ? "open" : "pending"}">${esc(m.status_label)}</span></div>
      ${m.note ? `<p class="status-note">${esc(m.note)}</p>` : ""}
      ${items ? `<div class="table-wrap"><table><thead><tr><th>Item</th><th>Proposal</th><th>Topic</th><th>Board says</th></tr></thead><tbody>${items}</tbody></table></div>` : ""}
    </article>`;
  }).join("");
  const paths = DATA.voting_paths.map((p) => `<article class="card">
      <h3>${esc(p.title)}</h3><p class="status-note">${esc(p.who)}</p>
      <ol class="steps">${p.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      <p style="margin:8px 0 0">${srcList(p.sources)}</p></article>`).join("");
  document.getElementById("tab-weigh-in").innerHTML = `
    <h2>How you can weigh in</h2>
    <p class="intro">${esc(up.intro)}</p>
    <div class="callout">${esc(up.disclaimer)}</div>
    <h2>Upcoming AI votes</h2>
    ${meetings}
    <h2>Ways to vote, depending on how you invest</h2>
    <div class="grid">${paths}</div>`;
}

// What's new: everything the weekly tracker has found, newest first, grouped by week.
function renderNew() {
  const items = (DATA.changes && DATA.changes.items) || [];
  const t = DATA.tracking || {};
  const byWeek = new Map();
  items.forEach((c) => {
    const k = c.detected || c.filed;
    if (!byWeek.has(k)) byWeek.set(k, []);
    byWeek.get(k).push(c);
  });
  const groups = [...byWeek.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1)).map(([wk, list]) => `
    <li><div class="date">Found ${esc(fmtDate(wk))}</div>
      <ul class="conn">${list.map((c) => `<li><strong>${esc(c.company)}</strong>: ${esc(c.what)}, filed ${esc(fmtDate(c.filed))}${c.topic ? ` <span class="pill pending">${esc(c.topic)}</span>` : ""}${src(c.url, c.form)}
        <div class="ticker">${esc(c.review_status || "")}</div></li>`).join("")}</ul></li>`).join("");
  document.getElementById("tab-new").innerHTML = `
    <h2>What's new</h2>
    <p class="intro">Every Monday an automated check reads SEC EDGAR for new proxy statements, investor letters (exempt solicitations) and vote results at each company, and flags the ones that mention AI. New finds are marked "not yet reviewed" until a person confirms them and adds them to the main tables.</p>
    <div class="callout">Last check: ${esc(t.last_checked ? fmtDate(t.last_checked.slice(0, 10)) : "not run yet")}. ${t.new_this_run != null ? esc(t.new_this_run) + " new AI-related filings found in that run." : ""}</div>
    ${groups ? `<ul class="timeline">${groups}</ul>` : `<p class="status-note">Nothing flagged yet.</p>`}`;
}

// Proposal feed: a chart of AI proposals by year and topic, and a table below it.
// Click a bar segment to filter the table. Both redraw from data/proposals.json.
const TOPIC_VAR = {
  "AI safety & alignment": "--t-board",
  "Data center impacts": "--t-compute",
  "Social & economic impacts": "--t-chips",
  "AI governance & oversight": "--t-equity",
};
function renderFeed() {
  const all = ((DATA.proposals && DATA.proposals.proposals) || []).filter((p) => p.company && p.year);
  const el = document.getElementById("tab-feed");
  if (!all.length) { renderComing("tab-feed", "Proposal feed", "Being sourced now."); return; }
  const filers = new Map();
  const net = DATA.network || {};
  const orgName = new Map((net.organizations || []).map((o) => [o.id, o.name]));
  (net.edges || []).forEach((e) => { if (orgName.has(e.from)) { if (!filers.has(e.to)) filers.set(e.to, []); filers.get(e.to).push(orgName.get(e.from)); } });
  el.innerHTML = `
    <h2>Proposal feed</h2>
    <p class="intro">Every AI-related shareholder proposal at these companies since 2023. Bars show how many proposals went to a vote or were filed each year, by topic. Click a bar to filter the table. Support is the share of votes cast for the proposal.</p>
    <div class="net-legend" id="feed-legend"></div>
    <div id="feed-chart" class="card" style="padding:12px"></div>
    <div class="net-controls">
      <select id="feed-co" aria-label="Company"><option value="">All companies</option></select>
      <select id="feed-status" aria-label="Status"><option value="">Any status</option></select>
      <button class="chip" id="feed-clear">Clear filters</button>
    </div>
    <div class="table-wrap"><table><thead><tr><th>Company</th><th>Year</th><th>Proposal</th><th>Topic</th><th>Status</th><th>Support</th></tr></thead><tbody id="feed-rows"></tbody></table></div>`;
  const F = { co: "", status: "", year: "", topic: "" };
  const opts = (id, vals) => document.getElementById(id).insertAdjacentHTML("beforeend", vals.map((v) => `<option>${esc(v)}</option>`).join(""));
  opts("feed-co", [...new Set(all.map((p) => p.company))].sort());
  opts("feed-status", [...new Set(all.map((p) => p.status).filter(Boolean))].sort());
  document.getElementById("feed-legend").innerHTML = Object.keys(TOPIC_VAR).map((t) =>
    `<span class="leg static"><span class="dot" style="background:var(${TOPIC_VAR[t]})"></span>${esc(t)}</span>`).join("");

  const rows = () => all.filter((p) => (!F.co || p.company === F.co) && (!F.status || p.status === F.status) && (!F.year || String(p.year) === F.year) && (!F.topic || p.topic === F.topic))
    .sort((a, b) => b.year - a.year || a.company.localeCompare(b.company));
  const drawTable = () => {
    document.getElementById("feed-rows").innerHTML = rows().map((p) => `<tr>
      <td>${esc(p.company)}</td><td>${esc(p.year)}</td>
      <td>${esc(p.title)}${src(p.proxy_url || p.source_url, "proxy")}${p.results_url ? src(p.results_url, "results") : ""}
        ${(() => { const who = filers.get(p.id) ? filers.get(p.id).join(", ") : p.proponent; return !who ? "" : /UNVERIFIED/.test(who) ? `<div class="ticker">Filer not named in the proxy</div>` : `<div class="ticker">Filed by ${esc(who)}</div>`; })()}</td>
      <td>${esc(p.topic || "")}</td><td>${esc(p.status || "")}</td>
      <td>${p.support_pct != null ? esc(p.support_pct) + "%" : ""}</td></tr>`).join("") || `<tr><td colspan="6">No matches.</td></tr>`;
  };
  const drawChart = () => {
    const box = document.getElementById("feed-chart");
    box.innerHTML = "";
    if (typeof d3 === "undefined") return;
    const base = all.filter((p) => (!F.co || p.company === F.co) && (!F.status || p.status === F.status));
    const years = [...new Set(all.map((p) => p.year))].sort();
    const topics = Object.keys(TOPIC_VAR);
    const series = d3.stack().keys(topics)(years.map((y) => Object.fromEntries([["year", y], ...topics.map((t) => [t, base.filter((p) => p.year === y && p.topic === t).length])])));
    const W = box.clientWidth - 24 || 600, H = 220, m = { t: 10, r: 10, b: 28, l: 30 };
    const x = d3.scaleBand().domain(years).range([m.l, W - m.r]).padding(0.3);
    const y = d3.scaleLinear().domain([0, d3.max(series.at(-1), (d) => d[1]) || 1]).nice().range([H - m.b, m.t]);
    const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    const svg = d3.select(box).append("svg").attr("viewBox", [0, 0, W, H]).attr("width", W).attr("height", H);
    svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).tickSizeOuter(0)).attr("color", css("--ink-soft"));
    svg.append("g").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(4).tickFormat(d3.format("d"))).attr("color", css("--ink-soft")).call((g) => g.select(".domain").remove());
    svg.append("g").selectAll("g").data(series).join("g").attr("fill", (s) => css(TOPIC_VAR[s.key]))
      .selectAll("rect").data((s) => s.map((d) => ({ ...d, key: s.key }))).join("rect")
      .attr("x", (d) => x(d.data.year)).attr("width", x.bandwidth())
      .attr("y", (d) => y(d[1])).attr("height", (d) => y(d[0]) - y(d[1])).attr("rx", 2)
      .attr("opacity", (d) => (!F.year && !F.topic) || (String(d.data.year) === F.year && d.key === F.topic) ? 1 : 0.3)
      .style("cursor", "pointer")
      .on("click", (ev, d) => { F.year = String(d.data.year); F.topic = d.key; drawChart(); drawTable(); })
      .append("title").text((d) => `${d.data.year}, ${d.key}: ${d[1] - d[0]}`);
  };
  document.getElementById("feed-co").addEventListener("change", (e) => { F.co = e.target.value; drawChart(); drawTable(); });
  document.getElementById("feed-status").addEventListener("change", (e) => { F.status = e.target.value; drawChart(); drawTable(); });
  document.getElementById("feed-clear").addEventListener("click", () => { Object.keys(F).forEach((k) => (F[k] = "")); document.getElementById("feed-co").value = ""; document.getElementById("feed-status").value = ""; drawChart(); drawTable(); });
  drawTable();
  const once = () => { if (!el.hidden && !el.dataset.drawn) { el.dataset.drawn = "1"; drawChart(); } };
  new MutationObserver(once).observe(el, { attributes: true, attributeFilter: ["hidden"] });
  once();
}

// Rights map grid: companies down the side, levers across the top, colored by how open each is.
function rightsMatrix() {
  const cols = [...new Set(DATA.companies.flatMap((c) => Object.keys(c.matrix || {})))];
  if (!cols.length) return "";
  const head = cols.map((k) => `<th>${esc(k)}</th>`).join("");
  const body = DATA.companies.map((c) => `<tr><td><strong>${esc(c.name)}</strong></td>${cols.map((k) => {
    const v = (c.matrix || {})[k];
    if (!v) return `<td></td>`;
    return `<td><span class="pill ${esc(v.level)}" title="${esc(v.note)}">${esc(v.label || STATUS_LABEL[v.level] || v.level)}</span>${src(v.url)}<div class="ticker">${esc(v.note || "")}</div></td>`;
  }).join("")}</tr>`).join("");
  return `<div class="table-wrap"><table class="matrix"><thead><tr><th>Company</th>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function renderComing(id, title, text) {
  document.getElementById(id).innerHTML = `<div class="coming"><h2>${esc(title)}</h2><p>${esc(text)}</p></div>`;
}

function setupTabs() {
  const buttons = document.querySelectorAll(".tabs button");
  const show = (name) => {
    buttons.forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
    document.querySelectorAll(".panel").forEach((p) => { p.hidden = p.id !== "tab-" + name; });
    try { history.replaceState(null, "", "#" + name); } catch (e) {}
  };
  buttons.forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
  const start = location.hash.slice(1);
  if ([...buttons].some((b) => b.dataset.tab === start)) show(start);
}

async function main() {
  setupTabs();
  try {
    await Promise.all(FILES.map(async (f) => {
      try {
        const r = await fetch(`data/${f}.json`, { cache: "no-cache" });
        DATA[f] = r.ok ? await r.json() : {};
      } catch (e) { DATA[f] = {}; }
    }));
  } catch (e) {
    document.querySelector("main").innerHTML = `<p class="coming">The data files did not load. If you opened this file directly, view it through GitHub Pages or a local server instead.</p>`;
    return;
  }
  const checked = (DATA.tracking && DATA.tracking.last_checked) ? DATA.tracking.last_checked.slice(0, 10) : DATA.site.last_updated;
  document.getElementById("last-updated").textContent = `SEC filings last checked ${fmtDate(checked)}. The tracker checks again every Monday.`;
  renderWhy();
  renderRights();
  renderWeighIn();
  window.renderNetwork(DATA.graph && DATA.graph.nodes ? DATA.graph : DATA.network, (DATA.people || {}).people);
  renderPeople();
  window.renderPathways(DATA.pathways, DATA.graph && DATA.graph.nodes ? DATA.graph : DATA.network);
  renderNew();
  window.renderCausality(DATA.causality);
  renderComing("tab-parnassus", "Disclosure scorecard", "Coming next: each company's public AI disclosure scored against Parnassus Investments' Responsible AI investor recommendations, with sources for every score.");
  renderFeed();
  renderComing("tab-water", "Data center water", "Coming soon: proposals and company disclosures on data center water use.");
}
main();

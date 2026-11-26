// Shareholder Advocacy AI Landscape: renders each tab from the JSON files in /data.
// Every fact on the page comes from a data file, and every data row carries its source link.
// Counts, ranges and company lists are computed from the data, so the page grows with it.
// Audience: shareholder-advocacy practitioners. Labels are plain; no definitions or explainers.

const DATA = {};
const FILES = ["site", "companies", "upcoming", "network", "people", "pathways", "changes", "tracking", "proposals", "causality", "graph", "scorecard", "fund_votes", "asks", "coverage", "value_chain"];

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// A small "source" link. If a fact has no source yet, say so plainly instead of hiding it.
function src(url, label = "source") {
  if (!url) return ` <span class="unverified">source pending</span>`;
  return ` <a class="src" href="${esc(url)}" target="_blank" rel="noopener">[${esc(label)}]</a>`;
}
function srcList(list) {
  return (list || []).map((s) => src(s.url, s.label)).join("");
}
function fmtDate(iso, short = false) {
  if (!iso) return "";
  const d = new Date(iso.slice(0, 10) + "T12:00:00");
  return d.toLocaleDateString("en-US", { year: "numeric", month: short ? "short" : "long", day: "numeric" });
}
const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;

const STATUS_LABEL = { open: "Still open", narrowing: "Narrowing", closed: "Closed", pending: "Being verified" };
const PROPOSAL_STATUS = { voted: "Voted", upcoming: "Upcoming", withdrawn: "Withdrawn", excluded: "Excluded" };

// "topic" on proposals carries what the proposal asks about: the four categories in data/asks.json
// (owner, 2026-11-26). One spelling per category across files.
const normTopic = (t) => String(t || "");
// Category marks: colour token and shape. Shapes keep categories apart without relying on hue.
const TOPIC_STYLE = {
  "AI governance and safety": { cls: "tp-gov", shape: "triangle" },
  "Data center externalities": { cls: "tp-dc", shape: "circle" },
  "Harms to people using AI products": { cls: "tp-se", shape: "square" },
  "Harms from how customers use AI": { cls: "tp-other", shape: "diamond" },
};
const topicStyle = (t) => TOPIC_STYLE[normTopic(t)] || { cls: "tp-other", shape: "diamond" };
const cssVar = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const topicColor = (t) => cssVar("--" + topicStyle(t).cls);

function companyName(ticker) {
  const c = (DATA.companies || []).find((x) => x.ticker === ticker);
  return c ? c.name : ticker;
}

// A table whose columns can be sorted by clicking their header button. Sort state lives in `state`.
// cols: [{ key, label, sortValue?(row), render(row), cls? }]
function sortableTable(cols, rows, state, rowAttrs = () => "") {
  const col = cols.find((c) => c.key === state.key);
  const sorted = col && col.sortValue
    ? [...rows].sort((a, b) => {
        const x = col.sortValue(a), y = col.sortValue(b);
        const r = x < y ? -1 : x > y ? 1 : 0;
        return state.dir === "asc" ? r : -r;
      })
    : rows;
  const head = cols.map((c) => {
    if (!c.sortValue) return `<th scope="col"${c.cls ? ` class="${c.cls}"` : ""}>${esc(c.label)}</th>`;
    const active = c.key === state.key;
    const sort = active ? (state.dir === "asc" ? "ascending" : "descending") : "none";
    const arrow = active ? (state.dir === "asc" ? "↑" : "↓") : "↕";
    return `<th scope="col" aria-sort="${sort}"${c.cls ? ` class="${c.cls}"` : ""}><button type="button" class="th-sort" data-sort="${esc(c.key)}">${esc(c.label)} <span aria-hidden="true">${arrow}</span></button></th>`;
  }).join("");
  const body = sorted.map((r) => `<tr ${rowAttrs(r)}>${cols.map((c) => `<td${c.cls ? ` class="${c.cls}"` : ""}>${c.render(r)}</td>`).join("")}</tr>`).join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body || `<tr><td colspan="${cols.length}">No matches.</td></tr>`}</tbody></table>`;
}
// Wire a table's sort buttons: clicking the active column flips direction; a new column starts descending.
function wireSort(box, state, redraw) {
  box.querySelectorAll(".th-sort").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.sort;
    state.dir = state.key === k && state.dir === "desc" ? "asc" : "desc";
    state.key = k;
    redraw();
    const again = box.querySelector(`.th-sort[data-sort="${k}"]`);
    if (again) again.focus();
  }));
}

// ---------- Upcoming votes ----------
function renderUpcoming() {
  const up = DATA.upcoming || {};
  const meetings = [...(up.meetings || [])].sort((a, b) => String(a.sort || "").localeCompare(String(b.sort || "")));
  const items = meetings.flatMap((m) => (m.items || []).map((i) => {
    const match = /^(.*?)\s*\(filed by (.*)\)\s*$/i.exec(i.title || "");
    return { m, i, title: match ? match[1] : i.title, filer: match ? match[2] : "" };
  }));
  const empty = meetings.filter((m) => !(m.items || []).length);
  const seenCo = new Set();
  const rows = items.map(({ m, i, title, filer }) => {
    const h = voteHistory(m.ticker);
    const firstForCo = !seenCo.has(m.ticker);
    seenCo.add(m.ticker);
    return `<tr>
      <td class="nowrap">${esc(m.meeting_label)}<div class="ticker">${esc(m.status_label || "")}</div></td>
      <td><button type="button" class="linklike" data-co="${esc(m.ticker)}">${esc(m.company)}</button></td>
      <td>${esc(i.number)}</td>
      <td>${esc(title)}${src(i.url || m.proxy_url, "proxy")}</td>
      <td>${esc(filer) || `<span class="ticker">Filer not recorded</span>`}</td>
      <td>${topicTag(i.topic)}</td>
      <td>${esc(i.board_rec || "")}</td>
      <td class="num">${!firstForCo ? `<span class="ticker">as above</span>` : historyText(h) ? `<button type="button" class="linklike" data-co="${esc(m.ticker)}">${esc(historyText(h))}</button>` : `<span class="ticker">none on file</span>`}</td></tr>`;
  }).join("");
  document.getElementById("tab-upcoming").innerHTML = `
    <h2>AI proposals on upcoming ballots</h2>
    <p class="intro">${plural(items.length, "AI proposal")} on ${plural(meetings.filter((m) => (m.items || []).length).length, "ballot")}, by meeting date. Source: each company's proxy statement.</p>
    ${rows ? `<div class="table-wrap"><table><thead><tr><th scope="col">Meeting</th><th scope="col">Company</th><th scope="col">Item</th><th scope="col">Proposal</th><th scope="col">Filed by</th><th scope="col">What it asks about</th><th scope="col">Board</th><th scope="col">Earlier AI votes at this company</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="status-note">No AI proposals on announced ballots.</p>`}
    ${empty.length ? `<h3 class="sub-h">Meetings with no AI proposals on the ballot, or ballot not yet filed</h3>
      <ul class="steps">${empty.map((m) => `<li><button type="button" class="linklike" data-co="${esc(m.ticker)}">${esc(m.company)}</button>, ${esc(m.meeting_label)}: ${esc(m.status_label || "")}${m.proxy_url ? src(m.proxy_url, "proxy") : ""}</li>`).join("")}</ul>` : ""}`;
  wireCompanyLinks(document.getElementById("tab-upcoming"));
}

// Earlier AI votes at a company: only proposals with a vote-results filing and a meeting date (the same
// rule as the Proposals chart). Count, median and high at the stored precision, plus how many of them
// carry a basis note or caveat (their notes are listed under the history table).
const pct = (x) => `${Math.round(x * 100) / 100}%`;
function voteHistory(ticker) {
  const all = ((DATA.proposals && DATA.proposals.proposals) || []).filter((p) => p.company === ticker && p.status === "voted");
  const rows = all.filter((p) => p.support_pct != null && p.results_url && p.meeting_date);
  const v = rows.map((p) => p.support_pct).sort((a, b) => a - b);
  if (!v.length) return { voted: 0, total: all.length };
  const mid = Math.floor(v.length / 2);
  const median = v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
  return { voted: v.length, total: all.length, median, max: v.at(-1), basis: rows.filter((p) => p.support_note && !/match/i.test(p.support_note)).length };
}
// "11 votes with a filing · median 21.17% · high 36.19%", flagging how many carry a basis note or caveat.
function historyText(h) {
  if (!h.voted) return h.total ? `${h.total} voted, no vote-results filing recorded` : "";
  const figures = h.voted === 1 ? pct(h.max) : `median ${pct(h.median)} · high ${pct(h.max)}`;
  return `${plural(h.voted, "vote")} with a filing${h.total > h.voted ? ` (of ${h.total})` : ""} · ${figures}${h.basis ? ` · ${h.basis} with a basis note or caveat (see notes)` : ""}`;
}
// Support notes repeat across many rows (e.g. every dual-class vote), so each distinct note is listed
// once under its table and rows carry its number.
// Notes that differ only in their figures (e.g. "Microsoft reports 0.69% ...", "... 13.36% ...") are listed
// once, with the figure written as "N%", so a company's table doesn't repeat the same sentence.
const noteKey = (t) => String(t).replace(/\d+(?:\.\d+)?%/g, "N%");
function footnotes(rows) {
  const map = new Map();
  rows.forEach((p) => { if (p.support_note && !map.has(noteKey(p.support_note))) map.set(noteKey(p.support_note), map.size + 1); });
  return map;
}
const fnMark = (map, p) => (p.support_note ? `<sup class="fn"><span class="visually-hidden">note </span>${map.get(noteKey(p.support_note))}</sup>` : "");
const fnList = (map) => (map.size ? `<ol class="fn-list" aria-label="Notes on support figures">${[...map.keys()].map((t) => `<li>${esc(t)}${/N%/.test(t) ? " (N% is the figure shown in the row.)" : ""}</li>`).join("")}</ol>` : "");
// Any element with data-co="TICKER" opens that company in Company lookup.
function wireCompanyLinks(root) {
  root.querySelectorAll("[data-co]").forEach((b) => b.addEventListener("click", () => openCompany(b.dataset.co)));
}

// ---------- Company lookup ----------
// One company, everything on file: upcoming ballot, proposal history, filers, rights, lab ties, disclosure score.
// Companies are keyed by their id in companies.json (private companies have no ticker); a proposal
// company missing from that file is keyed by its ticker.
const realTicker = (t) => (t && !/^(private|UNVERIFIED)$/i.test(t) ? t : "");
function companyEntries() {
  const cos = DATA.companies || [];
  const list = cos.map((c) => ({ key: c.id || c.ticker, c }));
  const known = new Set(cos.map((c) => c.ticker).filter(Boolean));
  const propCos = new Set(((DATA.proposals && DATA.proposals.proposals) || []).map((p) => p.company).filter(Boolean));
  propCos.forEach((t) => { if (!known.has(t)) list.push({ key: t, c: { ticker: t, name: t } }); });
  return list.sort((a, b) => a.c.name.localeCompare(b.c.name));
}
const keyForTicker = (t) => { const c = (DATA.companies || []).find((x) => x.ticker === t); return c ? c.id || c.ticker : t; };
function openCompany(ticker) {
  const pick = document.getElementById("co-pick");
  if (!pick) return;
  const key = keyForTicker(ticker);
  // If a sector or reason filter hides this company, clear the filters first.
  if (![...pick.options].some((o) => o.value === key)) {
    ["co-role", "co-basis"].forEach((id) => {
      const s = document.getElementById(id);
      if (s && s.value) { s.value = ""; s.dispatchEvent(new Event("change")); }
    });
  }
  pick.value = key;
  drawCompany(key);
  showTab("company", true);
}
function renderCompany() {
  const el = document.getElementById("tab-company");
  const all = companyEntries();
  const cos = DATA.companies || [];
  // Companies are classified by main role in AI (roles.js), the same everywhere on the site.
  const R = window.ROLES;
  const roleIds = R ? R.list.filter((r) => cos.some((c) => R.roleOf(c) === r.id)).map((r) => r.id) : [];
  const bases = [...new Set(cos.map((c) => c.basis_type).filter(Boolean))].sort();
  const F = { sector: "", basis: "" };
  el.innerHTML = `
    <h2>One company in full</h2>
    <p class="intro">Everything on file for one company: why it is included, its next ballot and filing deadline, its AI proposals and how they did, who filed them, its ties to frontier labs, and the proposal rights investors have there.</p>
    <div class="net-controls">
      ${roleIds.length ? `<select id="co-role" aria-label="Main role in AI"><option value="">All roles</option>${roleIds.map((r) => `<option value="${esc(r)}">${esc(R.label(r))}</option>`).join("")}</select>` : ""}
      ${bases.length ? `<select id="co-basis" aria-label="Why included"><option value="">Any reason included</option>${bases.map((s) => `<option>${esc(s)}</option>`).join("")}</select>` : ""}
      <select id="co-pick" aria-label="Company"></select>
    </div>
    <p class="count-line" id="co-count" aria-live="polite"></p>
    <div id="co-body" aria-live="polite"></div>`;
  const pick = document.getElementById("co-pick");
  const fill = () => {
    const list = all.filter(({ c }) => (!F.sector || (R && R.roleOf(c) === F.sector)) && (!F.basis || c.basis_type === F.basis));
    // First visit: the company with the soonest AI ballot, so the profile opens on something to act on.
    const soon = ((DATA.upcoming && DATA.upcoming.meetings) || []).filter((m) => (m.items || []).length).sort((a, b) => String(a.sort).localeCompare(String(b.sort)))[0];
    const preferred = soon && list.find((e) => e.key === keyForTicker(soon.ticker));
    const keep = list.some((e) => e.key === pick.value) ? pick.value : (preferred || list[0] || {}).key;
    pick.innerHTML = list.map(({ key, c }) => `<option value="${esc(key)}">${esc(c.name)}${realTicker(c.ticker) ? ` (${esc(c.ticker)})` : ""}</option>`).join("");
    document.getElementById("co-count").textContent = `${plural(list.length, "company", "companies")}${F.sector || F.basis ? ` of ${all.length}` : ""}.`;
    if (keep) { pick.value = keep; drawCompany(keep); } else document.getElementById("co-body").innerHTML = `<p class="status-note">No companies match.</p>`;
  };
  pick.addEventListener("change", (e) => drawCompany(e.target.value));
  const s = document.getElementById("co-role"), b = document.getElementById("co-basis");
  if (s) s.addEventListener("change", (e) => { F.sector = e.target.value; fill(); });
  if (b) b.addEventListener("change", (e) => { F.basis = e.target.value; fill(); });
  fill();
}
function factRow(label, obj) {
  return obj && obj.text ? `<div><dt>${esc(label)}</dt><dd>${esc(obj.text)}${src(obj.url)}</dd></div>` : `<div><dt>${esc(label)}</dt><dd><span class="unverified">source pending</span></dd></div>`;
}
function drawCompany(key) {
  const entry = companyEntries().find((e) => e.key === key) || { c: { ticker: key, name: key } };
  const c = entry.c;
  const t = realTicker(c.ticker);
  const props = ((DATA.proposals && DATA.proposals.proposals) || []).filter((p) => t && p.company === t)
    .sort((a, b) => String(b.meeting_date || b.year).localeCompare(String(a.meeting_date || a.year)));
  const h = voteHistory(t);
  const meeting = t ? ((DATA.upcoming && DATA.upcoming.meetings) || []).find((m) => m.ticker === t) : null;
  // Filers: organizations linked to this company's proposals in the shared graph.
  const G = DATA.graph && DATA.graph.nodes ? DATA.graph : { nodes: [], edges: [] };
  const byId = new Map(G.nodes.map((n) => [n.id, n]));
  const filerCount = new Map();
  G.edges.forEach((e) => {
    const o = byId.get(e.source), p = byId.get(e.target);
    if (t && o && p && p.type === "proposal" && p.company === t && ["investor", "coalition"].includes(o.type) && /filer/.test(e.type)) {
      const k = o.id;
      if (!filerCount.has(k)) filerCount.set(k, { node: o, n: 0 });
      filerCount.get(k).n += 1;
    }
  });
  const filers = [...filerCount.values()].sort((a, b) => b.n - a.n || a.node.label.localeCompare(b.node.label));
  const pw = DATA.pathways || {};
  // Ties from this company to labs; and, when the company is itself a frontier lab, ties into it.
  const ids = new Set([c.id, t.toLowerCase()].filter(Boolean));
  const ties = (pw.ties || []).filter((x) => ids.has(x.from));
  const inbound = (pw.ties || []).filter((x) => ids.has(x.to));
  const coName = (id) => ((pw.public_companies || []).find((x) => x.id === id) || {}).name || id;
  const labName = (id) => ((pw.labs || []).find((l) => l.id === id) || {}).name || id;
  const sc = t ? ((DATA.scorecard && DATA.scorecard.companies) || []).find((x) => x.ticker === t) : null;
  const scCount = (k) => (sc ? sc.scores.filter((s) => s.score === k).length : 0);
  const nCrit = DATA.scorecard && DATA.scorecard.criteria ? DATA.scorecard.criteria.length : 0;

  const notes = footnotes(props);
  // The board's recommendation for proposals on a ballot that is out (from upcoming.json, matched by title).
  const boardRec = (p) => {
    const it = meeting && (meeting.items || []).find((i) => String(i.title || "").toLowerCase().startsWith(String(p.title).toLowerCase().slice(0, 30)));
    return it ? it.board_rec : "";
  };
  const propRows = props.map((p) => `<tr>
      <td class="nowrap">${p.meeting_date ? esc(fmtDate(p.meeting_date, true)) : `${esc(p.year)}`}</td>
      <td>${esc(p.title)}${p.results_url ? src(p.results_url, "results") : p.proxy_url ? src(p.proxy_url, "proxy") : ""}${(p.status === "withdrawn" || p.status === "excluded") ? `<div class="reason"><strong>Reason:</strong> ${p.status_reason ? esc(p.status_reason) + src(p.status_source_url) : "Reason not yet recorded."}</div>` : ""}</td>
      <td>${p.proponent && !/UNVERIFIED/.test(p.proponent) ? esc(p.proponent) : `<span class="ticker">not recorded</span>`}</td>
      <td><span class="pill st-${esc(p.status)}">${esc(PROPOSAL_STATUS[p.status] || p.status)}</span>${p.status === "upcoming" && boardRec(p) ? `<div class="ticker">Board: ${esc(boardRec(p))}</div>` : ""}</td>
      <td class="num">${p.support_pct != null ? `${esc(p.support_pct)}%${fnMark(notes, p)}${p.results_url ? "" : `<div class="note">Vote-results filing not recorded</div>`}` : ""}</td></tr>`).join("");

  document.getElementById("co-body").innerHTML = `
    <h3 class="co-title">${esc(c.name)} <span class="ticker">${esc(t || (c.shareholder_route === "private" ? "private" : ""))}</span></h3>
    <dl class="summary">
      ${c.shareholder_route || c.route_note ? `<div><dt>Shareholder route</dt><dd>${shareholderRoute(c)}</dd></div>` : ""}
      ${window.ROLES && window.ROLES.roleOf(c) ? `<div><dt>Role in AI</dt><dd>${esc(window.ROLES.label(window.ROLES.roleOf(c)))}${window.ROLES.alsoOf(c).length ? `; also ${esc(window.ROLES.alsoOf(c).map(window.ROLES.label).join(", ").toLowerCase())}` : ""} <span class="ticker">(this site's reading)</span></dd></div>` : ""}
      <div><dt>Proposal route</dt><dd>${c.rights_tracked === false ? `<span class="ticker">not yet tracked</span>` : `<span class="pill ${esc(c.route_status || "pending")}">${esc(STATUS_LABEL[c.route_status] || "Being verified")}</span>`}</dd></div>
      <div><dt>AI proposals on file</dt><dd>${props.length}${historyText(h) ? ` · ${esc(historyText(h))}` : ""}</dd></div>
      <div><dt>Next meeting</dt><dd>${meeting ? `${esc(meeting.meeting_label)} · ${esc(meeting.status_label || "")}${meeting.proxy_url ? src(meeting.proxy_url, "proxy") : ""}` : `<span class="ticker">not listed</span>`}</dd></div>
      <div><dt>Next filing deadline</dt><dd>${c.next_proposal_deadline ? `${esc(fmtDate(c.next_proposal_deadline))}${c.next_proposal_deadline_status === "passed" ? " (passed)" : ""}${src(c.next_proposal_deadline_source, "proxy")}` : `<span class="ticker">not on file</span>`}</dd></div>
      <div><dt>Disclosure score</dt><dd>${sc ? `${scCount("met")} met · ${scCount("partial")} partial · ${scCount("silent")} silent of ${nCrit}` : `<span class="ticker">not scored</span>`}</dd></div>
    </dl>
    ${whyIncluded(c)}
    <h3 class="sub-h">AI proposal history</h3>
    ${propRows ? `<div class="table-wrap"><table><thead><tr><th scope="col">Meeting</th><th scope="col">Proposal</th><th scope="col">Filed by</th><th scope="col">Status</th><th scope="col">Support</th></tr></thead><tbody>${propRows}</tbody></table></div>${fnList(notes)}<p><button type="button" class="linklike" data-feed="${esc(t)}">See these in All proposals</button></p>` : `<p class="status-note">No AI proposals on file${t ? "" : " (no US-listed shares)"}.</p>`}
    <h3 class="sub-h">Filers active here</h3>
    ${filers.length ? `<div class="table-wrap"><table><thead><tr><th scope="col">Organization</th><th scope="col">AI proposals here</th><th scope="col"><span class="visually-hidden">Network</span></th></tr></thead><tbody>${filers.map((f) => `<tr><td>${esc(f.node.label)}</td><td class="num">${f.n}</td><td><button type="button" class="linklike" data-net="${esc(f.node.id)}">Show in network</button></td></tr>`).join("")}</tbody></table></div>` : `<p class="status-note">No filers recorded.</p>`}
    <h3 class="sub-h">Frontier-lab ties</h3>
    ${ties.length ? `<div class="table-wrap"><table><thead><tr><th scope="col">Lab</th><th scope="col">Tie</th><th scope="col">Strength</th><th scope="col">Detail</th></tr></thead><tbody>${ties.map((x) => `<tr><td>${esc(labName(x.to))}</td><td>${esc(x.type)}</td><td class="num">${esc(x.strength ?? "")}</td><td>${esc(x.description || "")}${src(x.source_url)}</td></tr>`).join("")}</tbody></table></div>` : inbound.length ? "" : `<p class="status-note">No frontier-lab ties recorded.</p>`}
    ${inbound.length ? `<h3 class="sub-h">Public companies tied to this lab</h3><div class="table-wrap"><table><thead><tr><th scope="col">Company</th><th scope="col">Tie</th><th scope="col">Strength</th><th scope="col">Detail</th></tr></thead><tbody>${inbound.map((x) => `<tr><td>${esc(coName(x.from))}</td><td>${esc(x.type)}</td><td class="num">${esc(x.strength ?? "")}</td><td>${esc(x.description || "")}${src(x.source_url)}</td></tr>`).join("")}</tbody></table></div>` : ""}
    <h3 class="sub-h">Proposal rights</h3>
    ${c.rights_tracked === false ? `<p class="status-note">Not yet researched for this company.</p>` : `
    ${c.route_status_reason ? `<p class="status-note">${esc(c.route_status_reason)}</p>` : ""}
    <dl class="facts">
      ${factRow("State of incorporation", c.state)}
      ${factRow("Proposal rules in the bylaws", c.bylaw)}
      ${factRow("Ownership threshold", c.threshold)}
      ${factRow("Voting control", c.control)}
      ${factRow("Director elections", c.director_voting)}
    </dl>`}`;
  const body = document.getElementById("co-body");
  body.querySelectorAll("[data-feed]").forEach((b) => b.addEventListener("click", () => { window.filterFeedCompany(b.dataset.feed); showTab("feed", true); }));
  body.querySelectorAll("[data-net]").forEach((b) => b.addEventListener("click", () => { showTab("network"); setTimeout(() => window.focusNetworkNode(b.dataset.net), 400); }));
}

function topicTag(t) {
  if (!t) return "";
  return `<span class="topic-tag"><span class="dot ${topicStyle(t).cls}" aria-hidden="true"></span>${esc(normTopic(t))}</span>`;
}

// ---------- Proposals ----------
// A dot plot of support by meeting date (voted proposals with a dated vote-results filing),
// and a sortable table of every proposal, including upcoming, withdrawn and excluded ones.
function renderFeed() {
  const el = document.getElementById("tab-feed");
  const all = ((DATA.proposals && DATA.proposals.proposals) || []).filter((p) => p.company && p.year);
  if (!all.length) { el.innerHTML = `<div class="coming"><h2>Proposals</h2><p>No proposals in the data yet.</p></div>`; return; }

  const years = [...new Set(all.map((p) => p.year))].sort();
  const topics = [...new Set(all.map((p) => normTopic(p.topic)).filter(Boolean))].sort();
  const companies = [...new Set(all.map((p) => p.company))].sort((a, b) => companyName(a).localeCompare(companyName(b)));
  const statuses = ["voted", "upcoming", "withdrawn", "excluded"].filter((s) => all.some((p) => p.status === s));
  const plottable = (p) => p.status === "voted" && p.meeting_date && p.results_url && p.support_pct != null;
  // What each proposal asks about (asks.json categories), when the data has them (owner, 2026-11-26: sort by
  // "alignment versus externalities associated with data centers versus externalities on consumers").
  const cats = ((DATA.asks && DATA.asks.categories) || []).filter((c) => all.some((p) => p.category === c.id));
  const catNote = cats.length && DATA.asks.categories_note ? DATA.asks.categories_note : "";

  el.innerHTML = `
    <h2>All AI proposals</h2>
    <p class="intro">${plural(all.length, "proposal")}, meetings ${years[0]}–${years.at(-1)}. Support = for ÷ (for + against); where a filing gives counts only or another basis applies, a numbered note says so.</p>
    <div class="status-filter" role="group" aria-label="Filter by status" id="feed-status"></div>
    <div class="net-controls">
      <select id="feed-co" aria-label="Company"><option value="">All companies</option>${companies.map((c) => `<option value="${esc(c)}">${esc(companyName(c))}</option>`).join("")}</select>
      <select id="feed-topic" aria-label="What it asks about"><option value="">Everything it asks about</option>${topics.map((t) => `<option value="${esc(t)}">${esc(t)} (${all.filter((p) => normTopic(p.topic) === t).length})</option>`).join("")}</select>
      <select id="feed-year" aria-label="Meeting year"><option value="">All years</option>${years.map((y) => `<option>${y}</option>`).join("")}</select>
      <button type="button" class="chip" id="feed-clear" hidden>Clear filters</button>
    </div>
    ${catNote ? `<p class="status-note">${esc(catNote)}</p>` : ""}
    <p class="count-line" id="feed-count" aria-live="polite"></p>
    <figure class="card chart-card">
      <div class="chart-scroll" id="feed-chart"></div>
      <figcaption class="chart-key" id="feed-key"></figcaption>
    </figure>
    <div class="table-wrap" id="feed-table"></div>`;

  const F = { status: "", co: "", topic: "", year: "", cat: "" };
  const sort = { key: "date", dir: "desc" };
  let feedNotes = new Map();
  const filterOn = (p, skipStatus) => (skipStatus || !F.status || p.status === F.status) && (!F.co || p.company === F.co) && (!F.topic || normTopic(p.topic) === F.topic) && (!F.year || String(p.year) === F.year) && (!F.cat || p.category === F.cat);
  const dateKey = (p) => p.meeting_date || `${p.year}-07-01`;
  const filerOf = (p) => {
    if (p.proponent && !/UNVERIFIED/.test(p.proponent)) return esc(p.proponent) + (p.proponent_source_url ? src(p.proponent_source_url) : "");
    return `<span class="ticker">${p.source === "filer network research" ? "Filer not recorded" : "Filer not named in the proxy"}</span>`;
  };

  const cols = [
    { key: "date", label: "Meeting", sortValue: dateKey, cls: "nowrap",
      render: (p) => `<strong>${esc(companyName(p.company))}</strong><div class="ticker">${p.meeting_date ? esc(fmtDate(p.meeting_date, true)) : `${esc(p.year)} (date not recorded)`}</div>` },
    { key: "proposal", label: "Proposal", cls: "wide",
      render: (p) => {
        let reason = "";
        if (p.status === "withdrawn" || p.status === "excluded") {
          reason = `<div class="reason"><strong>Reason:</strong> ${p.status_reason ? esc(p.status_reason) + src(p.status_source_url) : "Reason not yet recorded."}</div>`;
        }
        const links = [p.proxy_url ? src(p.proxy_url, "proxy") : "", p.results_url ? src(p.results_url, "results") : ""].join("");
        return `${esc(p.title)}${links}<div class="ticker">${filerOf(p)}</div><div>${topicTag(p.topic)}</div>${reason}`;
      } },
    { key: "status", label: "Status", render: (p) => `<span class="pill st-${esc(p.status)}">${esc(PROPOSAL_STATUS[p.status] || p.status)}</span>` },
    { key: "support", label: "Support", sortValue: (p) => (p.support_pct == null ? -1 : p.support_pct), cls: "num",
      render: (p) => {
        if (p.support_pct == null) return "";
        const noFiling = p.results_url ? "" : `<div class="note">Vote-results filing not recorded</div>`;
        return `${esc(p.support_pct)}%${fnMark(feedNotes, p)}${noFiling}`;
      } },
  ];

  const drawStatus = () => {
    const opts = [["", "All"], ...statuses.map((s) => [s, PROPOSAL_STATUS[s]])];
    document.getElementById("feed-status").innerHTML = opts.map(([s, label]) => {
      const n = all.filter((p) => filterOn(p, true) && (!s || p.status === s)).length;
      return `<button type="button" class="status-btn" data-status="${s}" aria-pressed="${F.status === s}"><span class="status-n">${n}</span>${esc(label)}</button>`;
    }).join("");
    document.querySelectorAll("#feed-status .status-btn").forEach((b) => b.addEventListener("click", () => { F.status = b.dataset.status; redraw(); }));
  };
  const drawTable = () => {
    const rows = all.filter((p) => filterOn(p));
    feedNotes = footnotes(rows);
    const box = document.getElementById("feed-table");
    box.innerHTML = sortableTable(cols, rows, sort, (p) => `id="prop-${esc(p.id)}"`) + fnList(feedNotes);
    wireSort(box, sort, drawTable);
    const filtered = Object.values(F).some(Boolean);
    document.getElementById("feed-count").textContent = `Showing ${plural(rows.length, "proposal")}${filtered ? ` of ${all.length}` : ""}.`;
    document.getElementById("feed-clear").hidden = !filtered;
  };
  const drawChart = () => {
    const box = document.getElementById("feed-chart");
    const key = document.getElementById("feed-key");
    box.innerHTML = "";
    const pts = all.filter((p) => plottable(p) && filterOn(p));
    const votedHere = all.filter((p) => p.status === "voted" && filterOn(p));
    const skipped = votedHere.length - pts.length;
    const topicKeys = topics.map((t) => `<span class="leg static"><svg class="mark" viewBox="-6 -6 12 12" aria-hidden="true"><path d="${typeof d3 !== "undefined" ? d3.symbol(d3[symbolName(topicStyle(t).shape)], 60)() : ""}" fill="${topicColor(t)}"></path></svg>${esc(t)}</span>`).join("");
    // Every mark is filled (owner, 2026-11-26: "Be consistent with the circles"). Hollow marks once flagged a
    // basis note, but nearly every figure now has one, so the split no longer told anything apart.
    const noted = pts.filter((p) => p.support_note).length;
    key.innerHTML = `${topicKeys}
      <p class="note">${plural(pts.length, "voted proposal")} plotted. Shape and shade show what each proposal asks about; every mark is filled.${noted ? ` ${noted} of these figures have a basis note (for example, computed from 8-K vote counts or dual-class voting), listed in the table.` : ""}${skipped > 0 ? ` ${plural(skipped, "voted proposal has", "voted proposals have")} no meeting date or vote-results filing recorded and appear in the table only.` : ""} Upcoming, withdrawn and excluded proposals are in the table.</p>`;
    if (typeof d3 === "undefined") return;
    if (!pts.length) { box.innerHTML = `<p class="status-note">No voted proposals with a dated vote-results filing match these filters.</p>`; return; }
    const all_pts = all.filter(plottable);
    const W = Math.max(560, box.clientWidth || 800), H = 300, m = { t: 16, r: 16, b: 30, l: 40 };
    const dates = all_pts.map((p) => new Date(p.meeting_date + "T12:00:00"));
    const x = d3.scaleTime().domain(d3.extent(dates)).nice().range([m.l + 10, W - m.r - 10]);
    const yMax = Math.max(60, Math.ceil((d3.max(all_pts, (p) => p.support_pct) + 5) / 10) * 10);
    const y = d3.scaleLinear().domain([0, yMax]).range([H - m.b, m.t]);
    const svg = d3.select(box).append("svg").attr("viewBox", [0, 0, W, H]).attr("width", W).attr("height", H)
      .attr("role", "img")
      .attr("aria-label", `Support for ${plural(pts.length, "voted proposal")}, ${d3.min(pts, (p) => p.support_pct)}% to ${d3.max(pts, (p) => p.support_pct)}%, by meeting date. The table below lists every proposal.`);
    svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(d3.axisBottom(x).ticks(Math.min(8, W / 90)).tickSizeOuter(0)).attr("color", cssVar("--ink-soft"));
    svg.append("g").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat((d) => d + "%")).attr("color", cssVar("--ink-soft")).call((g) => g.select(".domain").remove());
    svg.append("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(50)).attr("y2", y(50)).attr("stroke", cssVar("--ink-soft")).attr("stroke-dasharray", "4 4");
    svg.append("text").attr("x", W - m.r).attr("y", y(50) - 6).attr("text-anchor", "end").attr("font-size", 11).attr("fill", cssVar("--ink-soft")).text("50% of for + against");
    // Spread marks that share a meeting date so none hide behind another.
    const byDate = d3.group(pts, (p) => p.meeting_date);
    const spread = new Map();
    byDate.forEach((list) => list.sort((a, b) => a.support_pct - b.support_pct).forEach((p, i) => spread.set(p.id, (i - (list.length - 1) / 2) * 7)));
    svg.append("g").selectAll("path").data(pts).join("path")
      .attr("transform", (p) => `translate(${x(new Date(p.meeting_date + "T12:00:00")) + spread.get(p.id)},${y(p.support_pct)})`)
      .attr("d", (p) => d3.symbol(d3[symbolName(topicStyle(p.topic).shape)], 64)())
      .attr("fill", (p) => topicColor(p.topic))
      .attr("stroke", cssVar("--surface")).attr("stroke-width", 0.8)
      .style("cursor", "pointer")
      .on("click", (ev, p) => {
        const row = document.getElementById("prop-" + p.id);
        if (!row) return;
        document.querySelectorAll("#feed-table tr.hit").forEach((r) => r.classList.remove("hit"));
        row.classList.add("hit");
        row.scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      })
      .append("title").text((p) => `${companyName(p.company)}, ${fmtDate(p.meeting_date, true)}: ${p.title}. ${p.support_pct}%${p.support_note ? ". " + p.support_note : ""}`);
  };
  const redraw = () => { drawStatus(); drawTable(); if (!el.hidden) drawChart(); };

  // Company lookup's "Open in Proposals" sets the company filter here.
  window.filterFeedCompany = (t) => {
    Object.keys(F).forEach((k) => { F[k] = ""; });
    ["feed-topic", "feed-year", "feed-cat"].forEach((id) => { const s = document.getElementById(id); if (s) s.value = ""; });
    F.co = t; document.getElementById("feed-co").value = t;
    redraw();
  };
  const sel = (id, k) => document.getElementById(id).addEventListener("change", (e) => { F[k] = e.target.value; redraw(); });
  sel("feed-co", "co"); sel("feed-topic", "topic"); sel("feed-year", "year");
  document.getElementById("feed-clear").addEventListener("click", () => {
    Object.keys(F).forEach((k) => { F[k] = ""; });
    ["feed-co", "feed-topic", "feed-year", "feed-cat"].forEach((id) => { const s = document.getElementById(id); if (s) s.value = ""; });
    redraw();
  });
  drawStatus(); drawTable();
  const once = () => { if (!el.hidden && !el.dataset.drawn) { el.dataset.drawn = "1"; drawChart(); } };
  new MutationObserver(once).observe(el, { attributes: true, attributeFilter: ["hidden"] });
  once();
}
const symbolName = (shape) => ({ circle: "symbolCircle", square: "symbolSquare", triangle: "symbolTriangle", diamond: "symbolDiamond" })[shape];

// ---------- Rights map ----------
// "Why included" (data: engagement_basis + basis_type), with its source, any source note,
// and the owner's note where the owner chose to include a company.
function whyIncluded(c) {
  if (!c.engagement_basis || !c.engagement_basis.text) return "";
  return `<p class="status-note"><strong>Why included${c.basis_type ? ` (${esc(c.basis_type)})` : ""}:</strong> ${esc(c.engagement_basis.text)}${src(c.engagement_basis.url)}${c.source_note ? ` <span class="ticker">${esc(c.source_note)}</span>` : ""}</p>${c.owner_choice_note ? `<p class="status-note">${esc(c.owner_choice_note)}</p>` : ""}`;
}
// Shareholder route: the route and its source; with no route, the data's note says why
// (notes that start "source pending" are shown in the source-pending style).
function shareholderRoute(c) {
  const note = c.route_note ? `<div class="note${/^source pending/i.test(c.route_note) ? " unverified" : ""}">${esc(c.route_note)}</div>` : "";
  if (!c.shareholder_route) return note || `<span class="unverified">source pending</span>`;
  return `${esc(c.shareholder_route)}${src(c.route_source_url)}${note}`;
}

function renderRights() {
  // Only companies whose proposal rights have been researched (rights_tracked); others are in Company lookup.
  const cos = (DATA.companies || []).filter((c) => c.rights_tracked !== false);
  const el = document.getElementById("tab-rights");
  const matrixCols = [...new Set(cos.flatMap((c) => Object.keys(c.matrix || {})))];
  // Companies are classified by main role in AI (roles.js), the same everywhere on the site.
  const R = window.ROLES;
  const roleIds = R ? R.list.filter((r) => cos.some((c) => R.roleOf(c) === r.id)).map((r) => r.id) : [];
  const RANK = { open: 0, narrowing: 1, closed: 2, pending: 3 };
  const F = { sector: "" };
  const sort = { key: "company", dir: "asc" };
  const pill = (level, label) => `<span class="pill ${esc(level || "pending")}">${esc(label || STATUS_LABEL[level] || level || "Being verified")}</span>`;
  const cols = [
    { key: "company", label: "Company", sortValue: (c) => c.name.toLowerCase(), render: (c) => `<strong>${esc(c.name)}</strong><div class="ticker">${esc(c.ticker)}</div>` },
    ...(roleIds.length ? [{ key: "role", label: "Role in AI", render: (c) => esc(R.label(R.roleOf(c))) }] : []),
    { key: "route", label: "Route", sortValue: (c) => RANK[c.route_status || "pending"], render: (c) => pill(c.route_status) },
    ...matrixCols.map((k) => ({ key: "m:" + k, label: k, sortValue: (c) => RANK[((c.matrix || {})[k] || {}).level || "pending"] ?? 9,
      render: (c) => { const v = (c.matrix || {})[k]; return v ? `${pill(v.level, v.label)}${src(v.url)}<div class="ticker">${esc(v.note || "")}</div>` : `<span class="unverified">source pending</span>`; } })),
  ];
  const fact = (label, obj) => obj && obj.text ? `<div><dt>${esc(label)}</dt><dd>${esc(obj.text)}${src(obj.url)}</dd></div>` : `<div><dt>${esc(label)}</dt><dd><span class="unverified">source pending</span></dd></div>`;
  const card = (c) => {
    const levers = (c.levers || []).map((l) => `<li>${esc(l.text)}${src(l.url)}</li>`).join("");
    return `<details class="card co-detail">
      <summary><strong>${esc(c.name)}</strong> <span class="ticker">${esc(c.ticker)}</span>: ${esc(STATUS_LABEL[c.route_status] || "Being verified")}</summary>
      <p class="status-note">${esc(c.route_status_reason || "")}</p>
      <dl class="facts">
        ${fact("State of incorporation", c.state)}
        ${fact("Proposal rules in the bylaws", c.bylaw)}
        ${fact("Ownership threshold", c.threshold)}
        ${fact("Voting control", c.control)}
        ${fact("Director elections", c.director_voting)}
      </dl>
      ${(c.notes || []).length ? `<ul class="steps tight">${c.notes.map((n) => `<li>${esc(n.text)}${src(n.url)}</li>`).join("")}</ul>` : ""}
      ${levers ? `<h4 class="sub-h">Levers</h4><ul class="steps tight">${levers}</ul>` : ""}
    </details>`;
  };
  el.innerHTML = `
    <h2>Shareholder proposal rights</h2>
    <p class="intro">If the SEC rescinds Rule 14a-8, which companies still let investors put a proposal on the ballot, and how much say they have over directors? From each company's bylaws, state of incorporation and share structure. This site's reading of the cited documents, not a legal opinion.</p>
    ${roleIds.length ? `<div class="net-controls"><select id="rights-sector" aria-label="Main role in AI"><option value="">All roles</option>${roleIds.map((r) => `<option value="${esc(r)}">${esc(R.label(r))}</option>`).join("")}</select></div>` : ""}
    <p class="count-line" id="rights-count" aria-live="polite"></p>
    <div class="table-wrap" id="rights-table"></div>
    ${DATA.site && DATA.site.status_key ? `<p class="note">${esc(DATA.site.status_key)}</p>` : ""}
    <h3 class="sub-h">Detail by company</h3>
    <div id="rights-cards" class="detail-list"></div>`;
  const draw = () => {
    const rows = cos.filter((c) => !F.sector || (R && R.roleOf(c) === F.sector));
    const box = document.getElementById("rights-table");
    box.innerHTML = sortableTable(cols, rows, sort);
    wireSort(box, sort, draw);
    document.getElementById("rights-count").textContent = `${plural(rows.length, "company", "companies")}${F.sector ? ` in ${R.label(F.sector).toLowerCase()}` : ""}.`;
    document.getElementById("rights-cards").innerHTML = rows.map(card).join("");
  };
  const s = document.getElementById("rights-sector");
  if (s) s.addEventListener("change", (e) => { F.sector = e.target.value; draw(); });
  draw();
}

// ---------- People ----------
function renderPeople() {
  const people = (DATA.people && DATA.people.people) || [];
  const el = document.getElementById("tab-people");
  const sort = { key: "name", dir: "asc" };
  let q = "";
  const cols = [
    { key: "name", label: "Name", sortValue: (p) => p.name.toLowerCase(), render: (p) => `<strong>${esc(p.name)}</strong>` },
    { key: "org", label: "Organization", sortValue: (p) => (p.org_name || "").toLowerCase(), render: (p) => esc(p.org_name) },
    { key: "title", label: "Title", render: (p) => esc(p.title) },
    { key: "focus", label: "AI work", render: (p) => esc(p.ai_focus || "") },
    { key: "links", label: "Links", render: (p) => `${src(p.profile_url, "profile")} <button type="button" class="linklike" data-person="person-${esc(p.id)}">Show in network</button>` },
  ];
  el.innerHTML = `
    <h2>Engagement leads</h2>
    <p class="intro">Stewardship, engagement and shareholder advocacy leads at the organizations in the network, each with a public profile page. Public professional details only.</p>
    <div class="net-controls"><input type="search" id="people-search" placeholder="Search name, organization or AI work" aria-label="Search people"></div>
    <p class="count-line" id="people-count" aria-live="polite"></p>
    <div class="table-wrap" id="people-table"></div>`;
  const draw = () => {
    const rows = people.filter((p) => !q || [p.name, p.org_name, p.title, p.ai_focus].join(" ").toLowerCase().includes(q));
    const box = document.getElementById("people-table");
    box.innerHTML = sortableTable(cols, rows, sort);
    wireSort(box, sort, draw);
    document.getElementById("people-count").textContent = `${plural(rows.length, "person", "people")}${q ? ` of ${people.length}` : ""}.`;
    box.querySelectorAll("[data-person]").forEach((b) => b.addEventListener("click", () => {
      showTab("network");
      setTimeout(() => window.focusNetworkNode(b.dataset.person), 400);
    }));
  };
  draw();
  document.getElementById("people-search").addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase(); draw(); });
}

// ---------- New filings ----------
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
      <ul class="conn">${list.map((c) => `<li><strong>${esc(c.company)}</strong>: ${esc(c.what)}, filed ${esc(fmtDate(c.filed))}${src(c.url, c.form)}
        <div class="ticker">${esc(c.review_status || "")}</div></li>`).join("")}</ul></li>`).join("");
  document.getElementById("tab-new").innerHTML = `
    <h2>New SEC filings</h2>
    <p class="intro">Every Monday the site checks SEC EDGAR for new proxy statements, investor exempt solicitations (PX14A6G), vote results and bylaw changes at the companies it tracks. Finds are listed here before anyone reviews them.</p>
    <p class="count-line">Last check: ${esc(t.last_checked ? fmtDate(t.last_checked.slice(0, 10)) : "not run yet")}.${t.new_this_run != null ? ` ${esc(t.new_this_run)} new AI-related filings in that run.` : ""}</p>
    ${groups ? `<ul class="timeline">${groups}</ul>` : `<p class="status-note">Nothing flagged yet.</p>`}`;
}

// View buttons that carry a count (data-count-label="All {proposals} AI proposals") are filled in from the data,
// so the numbers never go stale.
function labelCounts() {
  const n = {
    proposals: ((DATA.proposals && DATA.proposals.proposals) || []).length,
    families: new Set(((DATA.fund_votes && DATA.fund_votes.summary) || []).map((r) => r.family)).size,
    scored: ((DATA.scorecard && DATA.scorecard.companies) || []).length,
    rights: (DATA.companies || []).filter((c) => c.rights_tracked !== false && c.matrix).length,
    people: ((DATA.people && DATA.people.people) || []).length,
  };
  document.querySelectorAll("[data-count-label]").forEach((b) => {
    const text = b.dataset.countLabel.replace(/\{(\w+)\}/g, (_, k) => (n[k] ? String(n[k]) : ""));
    if (!/\s\s|\s,|^\s/.test(text)) b.textContent = text.replace(/\s+/g, " ").trim();
  });
}

// ---------- Start here: Overview ----------
// What an analyst can act on now (ballots out, open filing deadlines, this week's SEC finds), three findings
// from the data with their basis, and what each section of the site is for.
function renderStart() {
  const el = document.getElementById("tab-start");
  const s = DATA.site || {};
  const today = new Date().toISOString().slice(0, 10);
  const findings = (s.findings || []).map((f) => `<li class="finding">
      <h4>${esc(f.title)}</h4><p>${esc(f.text)}</p>
      <p class="note">${esc(f.basis)}${f.link ? ` <a href="${esc(f.link)}" aria-label="See the data: ${esc(f.title)}">See the data</a>` : ""}</p></li>`).join("");
  // Coming up: ballots with AI proposals, then open Rule 14a-8 filing deadlines, soonest first.
  // Ballots: upcoming AI proposals grouped by company and meeting (the same records as All proposals).
  const upc = ((DATA.proposals && DATA.proposals.proposals) || []).filter((p) => p.status === "upcoming" && p.meeting_date && p.meeting_date >= today);
  const byMeeting = new Map();
  upc.forEach((p) => { const k = p.company + "|" + p.meeting_date; if (!byMeeting.has(k)) byMeeting.set(k, []); byMeeting.get(k).push(p); });
  const ballots = [...byMeeting.values()].map((ps) => ({ date: ps[0].meeting_date, ticker: ps[0].company, kind: "Vote",
    html: `<strong>${esc(companyName(ps[0].company))}</strong> votes on ${plural(ps.length, "AI proposal")}: ${esc(fmtDate(ps[0].meeting_date))}${src(ps[0].proxy_url, "proxy")}` }));
  const deadlines = (DATA.companies || []).filter((c) => c.next_proposal_deadline && c.next_proposal_deadline >= today)
    .map((c) => ({ date: c.next_proposal_deadline, html: `<strong>${esc(c.name)}</strong>: last day to submit a proposal for the next meeting, ${esc(fmtDate(c.next_proposal_deadline))}${src(c.next_proposal_deadline_source, "proxy")}`, ticker: realTicker(c.ticker), kind: "Filing deadline" }));
  const coming = [...ballots, ...deadlines].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const shown = coming.slice(0, 8);
  const comingList = shown.map((x) => `<li><span class="kind">${esc(x.kind)}</span> ${x.html}${x.ticker ? ` <button type="button" class="linklike" data-co="${esc(x.ticker)}">${esc(companyName(x.ticker))} profile</button>` : ""}</li>`).join("");
  const items = ((DATA.changes && DATA.changes.items) || []).slice().sort((a, b) => String(b.filed).localeCompare(String(a.filed)));
  const t = DATA.tracking || {};
  const sections = [...document.querySelectorAll('.tabs [role="tab"][data-group]')].slice(1).map((b) => {
    const g = b.dataset.group;
    const q = (document.querySelector(`#grp-${g} .group-q`) || {}).textContent || "";
    const first = (document.querySelector(`#grp-${g} .panel`) || {}).id.slice(4);
    return `<li><a href="#${esc(first)}">${esc(b.textContent)}</a>: ${esc(q)}</li>`;
  }).join("");
  el.innerHTML = `
    <h2>Key dates and findings</h2>
    <p class="intro">Dates you can act on, three things the data shows, and what each section of the site is for.</p>
    <h3 class="sub-h">Coming up</h3>
    ${comingList ? `<ul class="steps coming-up">${comingList}</ul>` : `<p class="status-note">No ballots or open filing deadlines on file.</p>`}
    <p><a href="#upcoming">All upcoming votes</a>${coming.length > shown.length ? ` · ${coming.length - shown.length} more open filing deadlines are on each company's profile` : ""}</p>
    <h3 class="sub-h">What the data shows</h3>
    ${findings ? `<ul class="findings">${findings}</ul>` : `<p class="status-note">No findings recorded.</p>`}
    <h3 class="sub-h">New SEC filings</h3>
    <p class="count-line">Checked ${esc(t.last_checked ? fmtDate(t.last_checked.slice(0, 10)) : "not yet")}${t.new_this_run != null ? `: ${plural(t.new_this_run, "new filing")} found` : ""}. Found automatically and not yet reviewed.</p>
    ${items.length ? `<p><a href="#new">See the ${plural(items.length, "new filing")}</a></p>` : ""}
    <h3 class="sub-h">How this site is organized</h3>
    <ul class="steps">${sections}</ul>`;
  wireCompanyLinks(el);
}

// ---------- Sections and views (WAI-ARIA tabs pattern: arrow keys, Home/End, roving tabindex) ----------
// Six sections in the order of an engagement cycle, each holding one or more views (index.html). Every view
// keeps its own address (#feed, #network, ...), so old links and the tests open the right place.
// Old addresses for views that were renamed or folded into another view.
const TAB_ALIASES = { why: "causality", "weigh-in": "upcoming", water: "upcoming", overview: "start" };
const lastView = {}; // per section, the view last open in it
function showTab(name, focus = false) {
  name = TAB_ALIASES[name] || name;
  let panel = document.getElementById("tab-" + name);
  if (!name || !panel || !panel.dataset.group) { name = "start"; panel = document.getElementById("tab-start"); }
  const group = panel.dataset.group;
  lastView[group] = name;
  const groupBtns = [...document.querySelectorAll('.tabs [role="tab"][data-group]')];
  groupBtns.forEach((b) => {
    const on = b.dataset.group === group;
    b.setAttribute("aria-selected", String(on));
    b.tabIndex = on ? 0 : -1;
    if (on && focus === "group") b.focus();
  });
  document.querySelectorAll(".group").forEach((g) => { g.hidden = g.id !== "grp-" + group; });
  document.querySelectorAll(`#grp-${group} [role="tab"][data-tab]`).forEach((b) => {
    const on = b.dataset.tab === name;
    b.setAttribute("aria-selected", String(on));
    b.tabIndex = on ? 0 : -1;
    if (on && focus === true) b.focus();
  });
  document.querySelectorAll(".panel").forEach((p) => { p.hidden = p.id !== "tab-" + name; });
  const stuck = document.getElementById("sticky-page");
  const gBtn = groupBtns.find((b) => b.dataset.group === group);
  const vBtn = document.querySelector(`#grp-${group} [role="tab"][data-tab="${name}"]`);
  // A section with one view has no view tab: keep focus on the section tab so it never drops to the page.
  if (focus === true && !vBtn && gBtn) gBtn.focus();
  if (stuck && gBtn) stuck.textContent = gBtn.textContent + (vBtn ? ` · ${vBtn.textContent}` : "");
  try { if (location.hash.slice(1) !== name) window.history.replaceState(null, "", "#" + name); } catch (e) {}
  // Motion stage 2 (motion.js): the newly shown page's heading reveals line by line.
  document.dispatchEvent(new CustomEvent("tabshown", { detail: { panel } }));
}
window.showTab = showTab;
function setupTabs() {
  // The page title joins the sticky tab bar once the site header has scrolled out of view.
  const head = document.querySelector(".site-header"), nav = document.querySelector(".tabs");
  if (head && nav && "IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => nav.classList.toggle("is-stuck", !e.isIntersecting)).observe(head);
  }
  if (nav) {
    // The tab rows used to tuck away on scroll down; since the six-section restructure the bar is one row, so it
    // simply stays (the tuck also fought with scroll-into-view and made the bar jitter).
    // Keep focused elements clear of the sticky bar (WCAG 2.4.11): scroll padding follows its real height.
    const setBar = () => document.documentElement.style.setProperty("--bar-h", nav.offsetHeight + "px");
    if ("ResizeObserver" in window) new ResizeObserver(setBar).observe(nav);
    setBar();
  }
  // Section tabs: open the view last used in that section, or its first view.
  const firstView = (g) => (document.querySelector(`#grp-${g} .panel`) || {}).id.slice(4);
  const groupBtns = [...document.querySelectorAll('.tabs [role="tab"][data-group]')];
  groupBtns.forEach((b, i) => {
    b.addEventListener("click", () => showTab(lastView[b.dataset.group] || firstView(b.dataset.group)));
    b.addEventListener("keydown", (e) => {
      const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: groupBtns.length - 1 }[e.key];
      if (to == null) return;
      e.preventDefault();
      const g = groupBtns[(to + groupBtns.length) % groupBtns.length].dataset.group;
      showTab(lastView[g] || firstView(g), "group");
    });
  });
  // View tabs inside each section.
  document.querySelectorAll(".subtabs").forEach((row) => {
    const views = [...row.querySelectorAll('[role="tab"][data-tab]')];
    views.forEach((b, i) => {
      b.addEventListener("click", () => showTab(b.dataset.tab));
      b.addEventListener("keydown", (e) => {
        const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: views.length - 1 }[e.key];
        if (to == null) return;
        e.preventDefault();
        showTab(views[(to + views.length) % views.length].dataset.tab, true);
      });
    });
  });
  // In-page links such as href="#feed" (Start here) open their view.
  window.addEventListener("hashchange", () => showTab(location.hash.slice(1), true));
  showTab(location.hash.slice(1));
}

// Resolves once d3 (loaded async from the CDN) is available, or after it fails, so the page never hangs.
function d3Ready() {
  if (typeof d3 !== "undefined") return Promise.resolve();
  const tag = document.getElementById("d3js");
  return new Promise((res) => { tag.addEventListener("load", res); tag.addEventListener("error", res); });
}

async function main() {
  setupTabs();
  const PRELOADED = ["site", "companies", "upcoming", "proposals", "asks"]; // asks: the Proposals tab's category filter
  const load = async (f) => {
    try {
      // Preloaded files use the browser's normal cache rules, so the fetch picks up the preload instead of asking again.
      const r = await fetch(`data/${f}.json`, PRELOADED.includes(f) ? {} : { cache: "no-cache" });
      DATA[f] = r.ok ? await r.json() : {};
    } catch (e) { DATA[f] = {}; }
  };
  // The first tabs need only four small files; draw them as soon as those arrive while the
  // larger files (the 300 KB relationship graph and the rest) keep loading in parallel.
  // The four are preloaded from index.html; the rest start once they're in, so they don't share the bandwidth.
  const FIRST = PRELOADED;
  await Promise.all(FIRST.map(load));
  const rest = Promise.all(FILES.filter((f) => !FIRST.includes(f)).map(load));
  if (!DATA.site || !DATA.site.last_updated) {
    document.querySelector("main").innerHTML = `<p class="coming">The data files did not load. If you opened this file directly, view it through GitHub Pages or a local server instead.</p>`;
    return;
  }
  const nCos = (DATA.companies || []).length;
  const nProps = ((DATA.proposals && DATA.proposals.proposals) || []).length;
  const header = () => {
    const checked = DATA.tracking && DATA.tracking.last_checked ? DATA.tracking.last_checked.slice(0, 10) : DATA.site.last_updated;
    document.getElementById("last-updated").textContent = `${plural(nCos, "company", "companies")} · ${plural(nProps, "proposal")} · every fact links to its source · SEC filings last checked ${fmtDate(checked)}`;
  };
  header();
  renderUpcoming();
  renderFeed();
  renderStart();
  renderRights();
  await rest;
  header();
  renderCompany();
  await d3Ready();
  // The Proposals chart may have been skipped if its tab opened before d3 arrived.
  const feed = document.getElementById("tab-feed");
  if (!feed.hidden) { delete feed.dataset.drawn; feed.hidden = true; feed.hidden = false; }
  // Primary value-chain tier per listed company, for the network's node types.
  window.companyTiers = new Map((DATA.companies || []).filter((c) => c.ticker && (c.tier || c.primary_tier)).map((c) => [c.ticker, c.tier || c.primary_tier]));
  // Company record for a graph node (by ticker, else by id without its co-/lab- prefix), for roles.js.
  {
    const byTicker = new Map((DATA.companies || []).filter((c) => c.ticker).map((c) => [c.ticker, c]));
    const byId = new Map((DATA.companies || []).map((c) => [c.id, c]));
    window.companyFor = (n) => (n.ticker && byTicker.get(n.ticker)) || byId.get(String(n.id).replace(/^(co|lab)-/, "")) || null;
  }
  // Inputs the network's lenses read (lenses.js): meetings with a ballot out, and Company lookup.
  window.LENS_CTX = {
    upcoming: (DATA.upcoming && DATA.upcoming.meetings) || [],
    disclaimer: (DATA.upcoming && DATA.upcoming.disclaimer) || "",
    proposals: (DATA.proposals && DATA.proposals.proposals) || [],
    companies: DATA.companies || [],
    fundVotes: DATA.fund_votes || null,
    asks: (DATA.asks && DATA.asks.asks) || [],
    coverage: DATA.coverage || null,
    causality: DATA.causality || null,
    categories: (DATA.asks && DATA.asks.categories) || [],
    hasCompany: (t) => companyEntries().some((e) => e.key === keyForTicker(t)),
    openCompany,
  };
  window.renderNetwork(DATA.graph && DATA.graph.nodes ? DATA.graph : DATA.network, (DATA.people || {}).people);
  window.renderPathways(DATA.pathways, DATA.graph && DATA.graph.nodes ? DATA.graph : DATA.network);
  window.renderCausality(DATA.causality);
  if (window.renderValueChain) window.renderValueChain(DATA.value_chain, DATA.companies);
  window.renderScorecard(DATA.scorecard);
  window.renderVotes(DATA.fund_votes, DATA.proposals);
  renderPeople();
  renderNew();
  renderStart(); // again, now that the weekly SEC check (changes, tracking) has loaded
  labelCounts();
  document.dispatchEvent(new Event("siteready"));
}
main();

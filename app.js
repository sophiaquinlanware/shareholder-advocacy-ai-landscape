// Shareholder Advocacy AI Landscape: renders each tab from the JSON files in /data.
// Every fact on the page comes from a data file, and every data row carries its source link.
// Counts, ranges and company lists are computed from the data, so the page grows with it.
// Audience: shareholder-advocacy practitioners. Labels are plain; no definitions or explainers.

const DATA = {};
const FILES = ["site", "companies", "upcoming", "network", "people", "pathways", "changes", "tracking", "proposals", "causality", "graph", "scorecard", "fund_votes", "asks", "coverage", "value_chain", "value_chain_amounts", "holdings", "pass_through_voting", "public_opinion"];

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

// A small "source" link. If a fact has no source yet, say so plainly instead of hiding it.
function src(url, label = "source") {
  if (!url) return ` <span class="unverified">source pending</span>`;
  return ` <a class="src" href="${esc(url)}" target="_blank" rel="noopener">[${esc(label)}]</a>`;
}
function srcList(list) {
  return (list || []).map((s) => src(s.url, s.label)).join("");
}
// One date style site-wide (dates.js): "November 26, 2026". The second argument is kept for old calls.
function fmtDate(iso, _short = false) {
  return iso ? window.DATES.long(String(iso).slice(0, 10)) : "";
}
const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;
// Figure frame (owner, 2026-11-26: "have it so that this visual could be screenshotted and all relevant info is
// there"): every chart sits in a figure box with a title, a subtitle naming the measure, count and years, its key,
// and a source line naming the site.
const FIG_SITE = "Shareholder advocacy towards responsible AI, sophiaquinlanware.github.io/shareholder-advocacy-ai-landscape";
window.figHead = (title, sub) => `<div class="fig-head"><p class="fig-title">${esc(title)}</p>${sub ? `<p class="fig-sub">${esc(sub)}</p>` : ""}</div>`;
window.figSource = (source) => `<p class="fig-src">Source: ${esc(source)} ${esc(FIG_SITE)}.</p>`;
window.yearSpan = (isos) => {
  const ys = isos.filter(Boolean).map((d) => +String(d).slice(0, 4)).filter(Number.isFinite);
  if (!ys.length) return "";
  const a = Math.min(...ys), b = Math.max(...ys);
  return a === b ? String(a) : `${a}–${b}`;
};

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
    // aria-sort only on the column the table is sorted by (on every column it reads as noise).
    return `<th scope="col"${active ? ` aria-sort="${sort}"` : ""}${c.cls ? ` class="${c.cls}"` : ""}><button type="button" class="th-sort" data-sort="${esc(c.key)}">${esc(c.label)} <span aria-hidden="true">${arrow}</span></button></th>`;
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
  // Meetings already held drop off before the next data refresh, as on Upcoming deadlines.
  const todayIso = window.RULES ? window.RULES.todayISO() : new Date().toISOString().slice(0, 10);
  const meetings = [...(up.meetings || [])].filter((m) => !/^\d{4}-\d{2}-\d{2}$/.test(m.sort || "") || m.sort >= todayIso)
    .sort((a, b) => String(a.sort || "").localeCompare(String(b.sort || "")));
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
    ${rows ? `<div class="table-wrap"><table><thead><tr><th scope="col">Meeting</th><th scope="col">Company</th><th scope="col">Item</th><th scope="col">Proposal</th><th scope="col">Filed by</th><th scope="col">Topic</th><th scope="col">Board</th><th scope="col">Earlier AI votes at this company</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<p class="status-note">No AI proposals on announced ballots.</p>`}
    ${empty.length ? `<h3 class="sub-h">Meetings with no AI proposals on the ballot, or ballot not yet filed</h3>
      <ul class="steps">${empty.map((m) => `<li><button type="button" class="linklike" data-co="${esc(m.ticker)}">${esc(m.company)}</button>, ${esc(m.meeting_label)}${m.status_label && !/^expected/i.test(m.meeting_label || "") ? `: ${esc(m.status_label)}` : ""}${m.proxy_url ? src(m.proxy_url, "proxy") : ""}</li>`).join("")}</ul>` : ""}`;
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
  openingCompany = true;
  showTab("company", true);
  openingCompany = false;
}
// Company profiles open blank, with no filters (owner, 2026-11-28), unless a company was asked for.
let openingCompany = false;
function resetCompany() {
  const pick = document.getElementById("co-pick");
  if (!pick) return;
  ["co-role", "co-basis"].forEach((id) => {
    const s = document.getElementById(id);
    if (s && s.value) { s.value = ""; s.dispatchEvent(new Event("change")); }
  });
  pick.value = "";
  drawCompany("");
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
    <p class="intro">One company: why it is included, next ballot and deadline, AI proposals and results, filers, lab ties and proposal rights.</p>
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
    // Opens with no company picked (owner, 2026-11-28).
    const keep = list.some((e) => e.key === pick.value) ? pick.value : "";
    pick.innerHTML = `<option value="">Pick a company (${list.length})</option>` + list.map(({ key, c }) => `<option value="${esc(key)}">${esc(c.name)}${realTicker(c.ticker) ? ` (${esc(c.ticker)})` : ""}</option>`).join("");
    document.getElementById("co-count").textContent = `${plural(list.length, "company", "companies")}${F.sector || F.basis ? ` of ${all.length}` : ""}.`;
    pick.value = keep;
    drawCompany(keep);
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
  if (!key) { document.getElementById("co-body").innerHTML = `<p class="status-note">Pick a company to see its profile, or open one from a company node in the network graph.</p>`; return; }
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
      <td>${esc(p.title)}${p.results_url ? src(p.results_url, "results") : p.proxy_url ? src(p.proxy_url, "proxy") : p.source_url ? src(p.source_url) : ""}${(p.status === "withdrawn" || p.status === "excluded") ? `<div class="reason"><strong>Reason:</strong> ${p.status_reason ? esc(p.status_reason) + src(p.status_source_url) : "Reason not yet recorded."}</div>` : ""}</td>
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
      <div><dt>Next meeting</dt><dd>${meeting ? `${esc(meeting.meeting_label)}${meeting.status_label && !/^expected/i.test(meeting.meeting_label || "") ? ` · ${esc(meeting.status_label)}` : ""}${meeting.proxy_url ? src(meeting.proxy_url, "proxy") : ""}` : `<span class="ticker">not listed</span>`}</dd></div>
      <div><dt>Next filing deadline</dt><dd>${c.next_proposal_deadline ? `${esc(fmtDate(c.next_proposal_deadline))}${c.next_proposal_deadline_status === "passed" || c.next_proposal_deadline < (window.RULES ? window.RULES.todayISO() : new Date().toISOString().slice(0, 10)) ? " (passed)" : ""}${src(c.next_proposal_deadline_source, "proxy")}` : `<span class="ticker">not on file</span>`}</dd></div>
      <div><dt>Disclosure score</dt><dd>${sc ? `${scCount("met")} met · ${scCount("partial")} partial · ${scCount("silent")} silent of ${nCrit}` : `<span class="ticker">not scored</span>`}</dd></div>
    </dl>
    ${whyIncluded(c)}
    <h3 class="sub-h">AI proposal history</h3>
    ${propRows ? `<div class="table-wrap"><table><thead><tr><th scope="col">Meeting</th><th scope="col">Proposal</th><th scope="col">Filed by</th><th scope="col">Status</th><th scope="col">Support</th></tr></thead><tbody>${propRows}</tbody></table></div>${fnList(notes)}<p><button type="button" class="linklike" data-feed="${esc(t)}">See these in All proposals</button></p>` : `<p class="status-note">No AI proposals on file${t ? "" : " (no US-listed shares)"}.</p>`}
    ${t ? `<div class="campaigns-slot" data-co="${esc(t)}"></div>` : ""}
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
  if (window.CAMPAIGNS) window.CAMPAIGNS.fill(body);
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
      <select id="feed-topic" aria-label="Topic"><option value="">All topics</option>${topics.map((t) => `<option value="${esc(t)}">${esc(t)} (${all.filter((p) => normTopic(p.topic) === t).length})</option>`).join("")}</select>
      <select id="feed-year" aria-label="Meeting year"><option value="">All years</option>${years.map((y) => `<option>${y}</option>`).join("")}</select>
      <button type="button" class="chip" id="feed-clear" hidden>Clear filters</button>
    </div>
    ${catNote ? `<p class="status-note">${esc(catNote)}</p>` : ""}
    <p class="count-line" id="feed-count" aria-live="polite"></p>
    <div class="seg feed-views" role="group" aria-label="Chart">
      <button type="button" data-fv="time" aria-pressed="true">Support over time</button>
      <button type="button" data-fv="grid" aria-pressed="false">Each ask by company</button>
    </div>
    <figure class="card chart-card" id="feed-fig">
      <div class="chart-scroll" id="feed-chart"></div>
      <figcaption class="chart-key" id="feed-key"></figcaption>
    </figure>
    <div id="feed-trk" hidden></div>
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
        const links = [p.proxy_url ? src(p.proxy_url, "proxy") : p.source_url ? src(p.source_url) : "", p.results_url ? src(p.results_url, "results") : ""].join("");
        // Leads from the SEC record (scripts/sec_leads.py) stay labelled until a person confirms them.
        const auto = p.reviewed === false ? ` <span class="unverified">found automatically in the SEC record, not yet reviewed</span>` : "";
        return `<span class="feed-t">${esc(p.title)}</span>${auto}${links}<div class="ticker">${filerOf(p)}</div><div>${topicTag(p.topic)}</div>${reason}`;
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
    pinRow();
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
    // Every mark is filled (owner, 2026-11-26: "Be consistent with the circles"). Hollow marks once flagged a
    // basis note, but nearly every figure now has one, so the split no longer told anything apart.
    const noted = pts.filter((p) => p.support_note).length;
    // The topic key is drawn inside the chart (so a screenshot carries it); this note explains the counts.
    key.innerHTML = `<p class="note">${plural(pts.length, "voted proposal")} plotted. Shape and shade show what each proposal asks about; every mark is filled.${noted ? ` ${noted} of these figures ${noted === 1 ? "has" : "have"} a basis note (for example, computed from 8-K vote counts or dual-class voting), listed in the table.` : ""}${skipped > 0 ? ` ${plural(skipped, "voted proposal has", "voted proposals have")} no meeting date or vote-results filing recorded and appear in the table only.` : ""} Upcoming, withdrawn and excluded proposals are in the table only.</p>`;
    if (typeof d3 === "undefined") return;
    if (!pts.length) { box.innerHTML = `<p class="status-note">No voted proposals with a dated vote-results filing match these filters.</p>`; return; }
    const all_pts = all.filter(plottable);
    // Self-contained figure (owner, 2026-11-26: "this visual could be screenshotted and all relevant info is
    // there"; years labelled on the visual, as on the network timeline): title, subtitle with the measure and n,
    // calendar-year bands with their year, axis titles, the topic key and the source all sit inside the SVG.
    const W = Math.max(320, box.clientWidth || 800), narrow = W < 640;
    // Lay the topic key out first, so the figure grows by however many rows it needs.
    const keyPos = [];
    { let kx = 0, row = 0;
      topics.forEach((t) => { const w = 22 + t.length * 6.6; if (kx && kx + w > W) { kx = 0; row++; } keyPos.push({ t, x: kx, row }); kx += w + 10; }); }
    const keyRows = keyPos.length ? keyPos[keyPos.length - 1].row + 1 : 0;
    const top = narrow ? 140 : 78, foot = narrow ? 90 : 76;
    const m = { t: top, r: 16, b: foot + keyRows * 18, l: 58 }, H = top + (narrow ? 220 : 240) + foot + keyRows * 18;
    const dates = all_pts.map((p) => new Date(p.meeting_date + "T12:00:00"));
    const x = d3.scaleTime().domain(d3.extent(dates)).nice().range([m.l + 10, W - m.r - 10]);
    const yMax = Math.max(60, Math.ceil((d3.max(all_pts, (p) => p.support_pct) + 5) / 10) * 10);
    const y = d3.scaleLinear().domain([0, yMax]).range([H - m.b, m.t]);
    const ink = cssVar("--ink"), soft = cssVar("--ink-soft"), font = "var(--sans)";
    const yrs = d3.extent(pts, (p) => +p.meeting_date.slice(0, 4));
    const filt = [F.co && companyName(F.co), F.topic, F.year].filter(Boolean).join(", ");
    const svg = d3.select(box).append("svg").attr("viewBox", [0, 0, W, H]).attr("width", W).attr("height", H)
      .attr("role", "img").attr("font-family", font)
      .attr("aria-label", `Support for ${plural(pts.length, "voted proposal")}, ${d3.min(pts, (p) => p.support_pct)}% to ${d3.max(pts, (p) => p.support_pct)}%, by meeting date. The table below lists every proposal.`);
    const lines = (arr, y0, size, fill, gap) => arr.forEach((t, i) => svg.append("text").attr("x", 0).attr("y", y0 + i * gap).attr("font-size", size).attr("fill", fill).text(t));
    const title = `Support for AI shareholder proposals, ${yrs[0] === yrs[1] ? yrs[0] : yrs[0] + "–" + yrs[1]}${filt ? ` (${filt})` : ""}`;
    const sub1 = `Each mark is one voted proposal (${pts.length}), placed at its meeting date.`, sub2 = "Support = votes for ÷ (for + against).";
    if (narrow) {
      lines(["Support for AI shareholder proposals,", `${yrs[0] === yrs[1] ? yrs[0] : yrs[0] + "–" + yrs[1]}${filt ? ` (${filt})` : ""}`], 18, 14, ink, 18);
      lines([`Each mark is one voted proposal (${pts.length}),`, "placed at its meeting date.", sub2], 58, 11.5, soft, 15);
    }
    else { lines([title], 20, 16, ink, 0); lines([`${sub1} ${sub2}`], 40, 12, soft, 0); }
    // Calendar-year bands, alternately shaded, each named at its top.
    const [d0, d1] = x.domain();
    const yearsIn = d3.timeYear.range(d3.timeYear.floor(d0), d1);
    const band = svg.append("g");
    yearsIn.forEach((yr, i) => {
      const xa = Math.max(x(yr), m.l + 10), xb = Math.min(x(d3.timeYear.offset(yr, 1)), W - m.r - 10);
      if (xb <= xa) return;
      if (i % 2 === 0) band.append("rect").attr("x", xa).attr("y", m.t - 18).attr("width", xb - xa).attr("height", H - m.b - m.t + 18).attr("fill", "#f3f5f8");
      if (xb - xa > 30) band.append("text").attr("x", (xa + xb) / 2).attr("y", m.t - 6).attr("text-anchor", "middle").attr("font-size", 12).attr("font-weight", 500).attr("fill", ink).text(yr.getFullYear());
    });
    // Month ticks; January carries the year so the axis reads on its own.
    const xAxis = d3.axisBottom(x).ticks(d3.timeMonth.every(W < 700 ? 6 : 3)).tickSizeOuter(0)
      .tickFormat((d) => (d.getMonth() === 0 ? d3.timeFormat(narrow ? "%Y" : "Jan %Y")(d) : d3.timeFormat("%b")(d)));
    svg.append("g").attr("transform", `translate(0,${H - m.b})`).call(xAxis).attr("color", soft).attr("font-family", font);
    svg.append("text").attr("x", (m.l + W - m.r) / 2).attr("y", H - m.b + 34).attr("text-anchor", "middle").attr("font-size", 12).attr("fill", soft).text("Annual meeting date");
    svg.append("g").attr("transform", `translate(${m.l},0)`).call(d3.axisLeft(y).ticks(6).tickFormat((d) => d + "%")).attr("color", soft).attr("font-family", font).call((g) => g.select(".domain").remove());
    svg.append("text").attr("transform", `translate(14,${(m.t + H - m.b) / 2}) rotate(-90)`).attr("text-anchor", "middle").attr("font-size", 12).attr("fill", soft).text("Support (% of for + against)");
    svg.append("line").attr("x1", m.l).attr("x2", W - m.r).attr("y1", y(50)).attr("y2", y(50)).attr("stroke", soft).attr("stroke-dasharray", "4 4");
    svg.append("text").attr("x", W - m.r).attr("y", y(50) - 6).attr("text-anchor", "end").attr("font-size", 11).attr("fill", soft).text(narrow ? "Majority (50%)" : "Majority: 50% of for + against");
    // Topic key and source inside the figure, so a screenshot carries them.
    const keyG = svg.append("g").attr("transform", `translate(0,${H - m.b + 62})`);
    keyPos.forEach(({ t, x: kx, row }) => {
      const g = keyG.append("g").attr("transform", `translate(${kx},${row * 18})`);
      g.append("path").attr("transform", "translate(6,-4)").attr("d", d3.symbol(d3[symbolName(topicStyle(t).shape)], 50)()).attr("fill", topicColor(t));
      g.append("text").attr("x", 16).attr("y", 0).attr("font-size", 11.5).attr("fill", ink).text(t);
    });
    const src1 = "Source: company 8-K Item 5.07 vote counts.", src2 = "Shareholder advocacy towards responsible AI, sophiaquinlanware.github.io/shareholder-advocacy-ai-landscape";
    if (narrow) lines([src1, "Shareholder advocacy towards responsible AI", "sophiaquinlanware.github.io/shareholder-advocacy-ai-landscape"], H - 32, 10, soft, 14);
    else lines([`${src1} ${src2}`], H - 4, 10.5, soft, 0);
    // Spread marks that share a meeting date so none hide behind another.
    const byDate = d3.group(pts, (p) => p.meeting_date);
    const spread = new Map();
    byDate.forEach((list) => list.sort((a, b) => a.support_pct - b.support_pct).forEach((p, i) => spread.set(p.id, (i - (list.length - 1) / 2) * 7)));
    svg.append("g").selectAll("path").data(pts).join("path")
      .attr("transform", (p) => `translate(${x(new Date(p.meeting_date + "T12:00:00")) + spread.get(p.id)},${y(p.support_pct)})`)
      .attr("d", (p) => d3.symbol(d3[symbolName(topicStyle(p.topic).shape)], 64)())
      .attr("fill", (p) => (p.id === pickedProp ? "#e8590c" : topicColor(p.topic)))
      .attr("class", (p) => (p.id === pickedProp ? "feed-pick" : null))
      .attr("stroke", cssVar("--surface")).attr("stroke-width", 0.8)
      .style("cursor", "pointer")
      // A mark brings its proposal to the top of the table, right under the chart, and both turn orange, so the
      // chart stays in view (owner, 2026-11-27).
      .on("click", (ev, p) => {
        pickedProp = p.id;
        d3.select(ev.currentTarget.parentNode).selectAll("path")
          .attr("fill", (q) => (q.id === pickedProp ? "#e8590c" : topicColor(q.topic)))
          .attr("class", (q) => (q.id === pickedProp ? "feed-pick" : null));
        d3.select(ev.currentTarget).raise();
        const row = pinRow();
        if (row) row.scrollIntoView({ block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      })
      .append("title").text((p) => `${companyName(p.company)}, ${fmtDate(p.meeting_date, true)}: ${p.title}. ${p.support_pct}%${p.support_note ? ". " + p.support_note : ""}`);
  };
  // Two views of the same proposals: support over time, or the best result for each ask at each company.
  window.feedView = (v) => {
    const grid = v === "grid";
    document.querySelectorAll(".feed-views [data-fv]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.fv === v)));
    document.getElementById("feed-fig").hidden = grid;
    const trk = document.getElementById("feed-trk");
    trk.hidden = !grid;
    if (grid && !trk.dataset.built) {
      // The grid is drawn by planner.js, which may load after this; try again shortly until it is there.
      if (window.buildTrackerInto) { trk.dataset.built = "1"; window.buildTrackerInto(trk); }
      else setTimeout(() => { if (!trk.hidden) window.feedView("grid"); }, 100);
    }
  };
  document.querySelectorAll(".feed-views [data-fv]").forEach((b) => b.addEventListener("click", () => window.feedView(b.dataset.fv)));
  if (window.feedWant) window.feedView(window.feedWant);
  // The proposal picked on the chart sits first in the table, in orange, until another is picked.
  var pickedProp = null;
  var voteIx = null;
  // What opens under a picked proposal: how each fund family voted on it (Form N-PX), so the votes come up on a click
  // rather than on a tab of their own (owner, 2026-11-27).
  function moreFor(p) {
    const FV = window.FundVotes;
    if (!voteIx && FV && DATA.fund_votes) voteIx = FV.index(DATA.fund_votes);
    if (!p.meeting_date || p.status !== "voted") return `<p class="note">Fund family votes appear once a proposal has gone to a vote.</p>`;
    if (!voteIx || !voteIx.usable(p.id)) return `<p class="note">No fund family votes recorded for this proposal yet.</p>`;
    const items = voteIx.families.map((f) => {
      const r = voteIx.byKey.get(`${f}|${p.id}`);
      if (!r) return `<li><strong>${esc(f)}:</strong> ${FV.coverage(voteIx, f, p.meeting_date) ? "no vote found" : "not checked"}</li>`;
      const u = (r.sources || [])[0];
      return `<li><strong>${esc(f)}:</strong> ${esc(FV.voteText(r))}${u ? src(u, "N-PX") : ""}${r.reviewed ? "" : " <span class=\"note\">(not yet checked by a person)</span>"}</li>`;
    }).join("");
    return `<h4 class="feed-more-h">How fund families voted</h4><ul class="feed-votes">${items}</ul><p class="note">From SEC Form N-PX. No vote is rated; nothing here suggests how to vote.</p>`;
  }
  function pinRow() {
    document.querySelectorAll("#feed-table tr.hit").forEach((r) => r.classList.remove("hit"));
    document.querySelectorAll("#feed-table tr.feed-more").forEach((r) => r.remove());
    const row = pickedProp && document.getElementById("prop-" + pickedProp);
    if (!row) return null;
    row.parentNode.insertBefore(row, row.parentNode.firstChild);
    row.classList.add("hit");
    const p = all.find((x) => x.id === pickedProp);
    if (p) row.insertAdjacentHTML("afterend", `<tr class="feed-more"><td colspan="${row.children.length}">${moreFor(p)}</td></tr>`);
    return row;
  }
  // A click anywhere on a row (not a link) picks that proposal too.
  document.getElementById("feed-table").addEventListener("click", (e) => {
    if (e.target.closest("a, button")) return;
    const tr = e.target.closest("tr[id^='prop-']");
    if (!tr) return;
    pickedProp = tr.id.slice(5);
    pinRow();
    const svg = document.querySelector("#feed-chart svg");
    if (svg && window.d3) d3.select(svg).selectAll("path").filter((q) => q && q.id).attr("fill", (q) => (q.id === pickedProp ? "#e8590c" : topicColor(q.topic))).attr("class", (q) => (q.id === pickedProp ? "feed-pick" : null));
  });
  // A filter set while the view is hidden (for example from Company profiles) redraws the chart when it is next shown.
  const redraw = () => { drawStatus(); drawTable(); if (!el.hidden) drawChart(); else delete el.dataset.drawn; };

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
    { key: "company", label: "Company", sortValue: (c) => c.name.toLowerCase(), render: (c) => `<strong>${esc(c.name)}</strong><div class="ticker">${esc(c.ticker)}</div>${realTicker(c.ticker) ? `<button type="button" class="linklike" data-co="${esc(realTicker(c.ticker))}">Full profile</button>` : ""}` },
    ...(roleIds.length ? [{ key: "role", label: "Role in AI", render: (c) => esc(R.label(R.roleOf(c))) }] : []),
    { key: "route", label: "Route", sortValue: (c) => RANK[c.route_status || "pending"], render: (c) => pill(c.route_status) },
    ...matrixCols.map((k) => ({ key: "m:" + k, label: k, sortValue: (c) => RANK[((c.matrix || {})[k] || {}).level || "pending"] ?? 9,
      render: (c) => { const v = (c.matrix || {})[k]; return v ? `${pill(v.level, v.label)}${src(v.url)}<div class="ticker">${esc(v.note || "")}</div>` : `<span class="unverified">source pending</span>`; } })),
  ];
  // The per-company detail blocks were cut (module audit, 2026-11-27): each repeated One company in full. The
  // comparison table stays; each row links to that company's full profile.
  el.innerHTML = `
    <h2>Shareholder proposal rights</h2>
    <p class="intro">Which companies would still allow shareholder proposals if the SEC rescinds Rule 14a-8, and shareholders' say over directors, from bylaws, state of incorporation and share structure. This site's reading, not a legal opinion.</p>
    ${roleIds.length ? `<div class="net-controls"><select id="rights-sector" aria-label="Main role in AI"><option value="">All roles</option>${roleIds.map((r) => `<option value="${esc(r)}">${esc(R.label(r))}</option>`).join("")}</select></div>` : ""}
    <p class="count-line" id="rights-count" aria-live="polite"></p>
    <div class="table-wrap" id="rights-table"></div>
    ${DATA.site && DATA.site.status_key ? `<p class="note">${esc(DATA.site.status_key)}</p>` : ""}`;
  const draw = () => {
    const rows = cos.filter((c) => !F.sector || (R && R.roleOf(c) === F.sector));
    const box = document.getElementById("rights-table");
    box.innerHTML = sortableTable(cols, rows, sort);
    wireSort(box, sort, draw);
    document.getElementById("rights-count").textContent = `${plural(rows.length, "company", "companies")}${F.sector ? ` in ${R.label(F.sector).toLowerCase()}` : ""}.`;
    wireCompanyLinks(box);
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
    { key: "links", label: "Links", render: (p) => `${src(p.profile_url, "profile")}${p.ai_focus_source_url ? src(p.ai_focus_source_url, "AI work") : ""} <button type="button" class="linklike" data-person="person-${esc(p.id)}">Show in network</button>` },
  ];
  el.innerHTML = `
    <h2>Heads of stewardship and engagement</h2>
    <p class="intro">Stewardship and engagement leads at the organizations in the network, each linked to a public profile.</p>
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

// ---------- Start here: Overview ----------
// What an analyst can act on now (ballots out, open filing deadlines, this week's SEC finds), three findings
// from the data with their basis, and what each section of the site is for.
// ---------- About: the cover page ----------
// What the site is for, who uses it, what each section answers, and the rules it keeps (PRODUCT.md). Counts come
// from the data so they stay current.
// About is written into index.html (principles, intention and sources), so it paints at once and needs no data.
function renderAbout() {}

function renderStart() {
  const el = document.getElementById("tab-start");
  const s = DATA.site || {};
  const today = (window.RULES ? window.RULES.todayISO() : new Date().toISOString().slice(0, 10));
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
  // No weekly-filings block (module audit, 2026-11-27): new SEC records flow into the proposal tables, marked
  // "not yet reviewed", instead of a separate feed.
  el.innerHTML = `
    <h2>Upcoming deadlines</h2>
    <p class="intro">Upcoming ballots and filing deadlines.</p>
    <h3 class="sub-h">Coming up</h3>
    ${comingList ? `<ul class="steps coming-up">${comingList}</ul>` : `<p class="status-note">No ballots or open filing deadlines on file.</p>`}
    <p><a href="#upcoming">All upcoming votes</a> · <a href="#planner">Plan an engagement at any of these companies</a>${coming.length > shown.length ? ` · ${coming.length - shown.length} more open filing deadlines are on the company profiles` : ""}</p>
    <h3 class="sub-h">What the data shows</h3>
    ${findings ? `<ul class="findings">${findings}</ul>` : `<p class="status-note">No findings recorded.</p>`}`;
  wireCompanyLinks(el);
}

// ---------- Sections and views (WAI-ARIA tabs pattern: arrow keys, Home/End, roving tabindex) ----------
// Six sections in the order of an engagement cycle, each holding one or more views (index.html). Every view
// keeps its own address (#feed, #network, ...), so old links and the tests open the right place.
// Old addresses for views that were renamed or folded into another view.
const TAB_ALIASES = { tracker: "feed", votes: "feed", outcomes: "feed", parnassus: "company", rights: "company", companies: "company", asks: "topics", effects: "topics", why: "causality", "weigh-in": "upcoming", water: "upcoming", overview: "start", new: "upcoming" };
const lastView = {}; // per section, the view last open in it
let prevView = "";
// Tab switches crossfade with the View Transitions API (motion brief stage 7) where the browser has it, except
// under reduced motion, on the first paint, and in automated test browsers (navigator.webdriver), where the
// switch must be synchronous.
let tabsReady = false;
let historyReady = false;
function showTab(name, focus = false) {
  const vt = tabsReady && document.startViewTransition && !navigator.webdriver && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  tabsReady = true;
  if (vt) {
    // A quick second tab change skips the first transition; that rejection is expected, so it is caught here.
    const t = document.startViewTransition(() => applyTab(name, focus));
    [t.ready, t.finished, t.updateCallbackDone].forEach((p) => p && p.catch(() => {}));
  }
  else applyTab(name, focus);
}
function applyTab(name, focus = false) {
  // The tracker is now a view of All AI proposals (owner, 2026-11-27: one page, different ways of viewing the data).
  if (name === "tracker") { window.feedWant = "grid"; if (window.feedView) window.feedView("grid"); }
  // Views folded into another one (owner, 2026-11-27: fewer tabs): open the fold and bring it into view.
  const fold = document.getElementById("fold-" + name);
  if (fold && fold.tagName === "DETAILS") setTimeout(() => { fold.open = true; fold.scrollIntoView({ block: "start" }); }, 0);
  name = TAB_ALIASES[name] || name;
  if (name === "network" && !historyReady) {
    const q = new URLSearchParams(location.search);
    if (q.get("graph") === "proposals" || (q.get("lens") === "policy" && q.get("graph") !== "connections")) name = "proposals";
  }
  let panel = document.getElementById("tab-" + name);
  if (!name || !panel || !panel.dataset.group) { name = "about"; panel = document.getElementById("tab-about"); }
  const group = panel.dataset.group;
  lastView[group] = name;
  if (window.NETMARK) window.NETMARK.visit(name);
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
  // Network and Proposals are two sections showing one graph in two views (owner, 2026-11-27): the graph's section
  // moves to whichever is open, and the section sets the view.
  const shown = name === "proposals" ? "network" : name;
  const net = document.getElementById("tab-network");
  if (name === "proposals") document.getElementById("tab-proposals").after(net);
  else if (name === "network") document.getElementById("tab-people").before(net);
  document.querySelectorAll(".panel").forEach((p) => { p.hidden = p.id !== "tab-" + shown; });
  if (window.netMode && (name === "proposals" || name === "network")) window.netMode(name === "proposals" ? "proposals" : "connections");
  // A later visit to either graph page starts clear; the first view of a visit keeps what its link asked for.
  if (historyReady && !following && (name === "proposals" || name === "network") && window.netReset) window.netReset();
  if (historyReady && !openingCompany && name === "company") resetCompany();
  prevView = name;
  const stuck = document.getElementById("sticky-page");
  const gBtn = groupBtns.find((b) => b.dataset.group === group);
  const vBtn = document.querySelector(`#grp-${group} [role="tab"][data-tab="${name}"]`);
  // A section with one view has no view tab: keep focus on the section tab so it never drops to the page.
  if (focus === true && !vBtn && gBtn) gBtn.focus();
  // Phones: the view tabs scroll sideways; bring the open one into sight.
  if (vBtn && vBtn.parentElement && vBtn.parentElement.scrollWidth > vBtn.parentElement.clientWidth) vBtn.parentElement.scrollLeft = Math.max(0, vBtn.offsetLeft - 16);
  if (stuck && gBtn) stuck.textContent = gBtn.textContent + (vBtn ? ` · ${vBtn.textContent}` : "");
  // A view opened from the page adds a history entry, so the browser's Back button returns to the previous view;
  // the first view of a visit replaces (no empty step), and Back/Forward arrive with the hash already set.
  try {
    if (location.hash.slice(1) !== name) {
      if (historyReady) window.history.pushState(null, "", "#" + name);
      else window.history.replaceState(null, "", "#" + name);
    }
  } catch (e) {}
  historyReady = true;
  // Motion stage 2 (motion.js): the newly shown page's heading reveals line by line.
  document.dispatchEvent(new CustomEvent("tabshown", { detail: { panel } }));
}
window.showTab = showTab;
// Header art (owner, 2026-11-27: "have the graphic scroll up past the title so that the title goes over it"): the
// title drifts down more slowly than the page scrolls, so the ridges pass up behind it.
// The section menu spreads along the mountain and ends under the summit (owner, 2026-11-28: "distributed over the
// length of the mountain, stopping right at the peak point"). Wide screens only; phones keep the wrapping row.
function spreadTabs() {
  const row = document.querySelector(".tabs .tab-row"), peak = document.querySelector('.hdr-art .ha-hub[data-g="plan"] .ha-core');
  if (!row || !peak) return;
  const fit = () => {
    row.style.paddingRight = "";
    row.classList.remove("spread");
    if (innerWidth < 900) return;
    const r = row.getBoundingClientRect(), cs = getComputedStyle(row);
    const contentRight = r.right - parseFloat(cs.paddingRight || 0);
    const p = peak.getBoundingClientRect();
    const end = Math.min(contentRight, p.left + p.width / 2 + 10);
    // Room for the tabs at their natural width, or leave the row as it is.
    const natural = [...row.children].reduce((w, b) => w + b.getBoundingClientRect().width, 0);
    if (end - (r.left + parseFloat(cs.paddingLeft || 0)) < natural) return;
    row.style.paddingRight = `${Math.round(r.right - end)}px`;
    row.classList.add("spread");
  };
  addEventListener("resize", fit);
  fit();
}
function setupHeaderArt() {
  spreadTabs();
  const title = document.querySelector(".site-header .wrap");
  if (!title || !document.querySelector(".hdr-art") || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let raf = 0;
  const move = () => {
    raf = 0;
    const y = Math.min(window.scrollY, 260);
    title.style.transform = y ? `translateY(${(y * 0.6).toFixed(1)}px)` : "";
  };
  addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(move); }, { passive: true });
  move();
}
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
  // Only a tab name (or an old alias) switches tabs; an in-page #anchor inside a tab just scrolls to its target.
  const isTabHash = (h) => !h || !!TAB_ALIASES[h] || !!(document.getElementById("tab-" + h) && document.getElementById("tab-" + h).dataset.group);
  const onHash = () => {
    const h = decodeURIComponent(location.hash.slice(1));
    if (isTabHash(h)) { showTab(h, true); return; }
    const el = document.getElementById(h);
    if (el) el.scrollIntoView({ block: "start" });
  };
  window.addEventListener("hashchange", onHash);
  // pushState doesn't fire hashchange on Back/Forward in every browser; popstate covers it.
  window.addEventListener("popstate", onHash);
  showTab(location.hash.slice(1) || "about");
}

let following = false;
window.netTabFollow = (m) => {
  // Following the graph's own view change keeps its selection and filters (no reset).
  following = true;
  if (m === "proposals" && prevView === "network") showTab("proposals");
  else if (m === "connections" && prevView === "proposals") showTab("network");
  following = false;
};
// A folded view's section is hidden while its fold is closed, so views that draw when shown draw at full width.
document.addEventListener("toggle", (e) => {
  const d = e.target;
  if (!(d instanceof HTMLDetailsElement) || !d.classList.contains("fold")) return;
  const b = d.querySelector(":scope > .fold-body");
  if (b) b.hidden = !d.open;
}, true);

// Resolves once d3 (loaded async from the CDN) is available, or after it fails, so the page never hangs.
function d3Ready() {
  if (typeof d3 !== "undefined") return Promise.resolve();
  const tag = document.getElementById("d3js");
  return new Promise((res) => { tag.addEventListener("load", res); tag.addEventListener("error", res); });
}

async function main() {
  setupHeaderArt();
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
  renderAbout(); // draws before any data loads (only its scope list needs companies.json)
  await Promise.all(FIRST.map(load));
  const rest = Promise.all(FILES.filter((f) => !FIRST.includes(f)).map(load));
  if (!DATA.site || !DATA.site.last_updated) {
    document.querySelector("main").innerHTML = `<p class="coming">The data files did not load. If you opened this file directly, view it through GitHub Pages or a local server instead.</p>`;
    return;
  }
  const header = () => {
    const checked = DATA.tracking && DATA.tracking.last_checked ? DATA.tracking.last_checked.slice(0, 10) : DATA.site.last_updated;
    document.getElementById("last-updated").textContent = `SEC filings checked ${fmtDate(checked)}`;
  };
  header();
  renderUpcoming();
  renderFeed();
  renderAbout(); // needs only companies.json, so it draws with the first data, before the rest loads
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
  window.renderPathways(DATA.pathways, DATA.graph && DATA.graph.nodes ? DATA.graph : DATA.network, {
    holdings: DATA.holdings || null,
    vcTies: (DATA.value_chain && DATA.value_chain.all_ties) || [],
  });
  window.renderCausality(DATA.causality);
  if (window.renderValueChain) window.renderValueChain(DATA.value_chain, DATA.companies, DATA.graph);
  window.renderScorecard(DATA.scorecard);
  window.renderVotes(DATA.fund_votes, DATA.proposals, DATA.pass_through_voting);
  renderPeople();
  if (window.renderPlanner) window.renderPlanner(DATA);
  if (window.renderSimulator) window.renderSimulator(DATA);
  if (window.renderBoard) window.renderBoard();
  if (window.renderAlignment) window.renderAlignment();
  if (window.renderTopics) window.renderTopics(DATA);
  if (window.renderProfiles) window.renderProfiles(DATA);
  document.dispatchEvent(new Event("siteready"));
}
main();

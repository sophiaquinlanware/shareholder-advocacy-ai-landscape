// Effects of AI › Topics (owner, 2026-11-27: "one whole tab ... dedicated to topics in responsible AI ... to set
// that landscape", placed after the value chain). The four areas this site groups AI shareholder proposals into
// (data/asks.json categories), the asks in each, and their record. Click an ask for its filings and polls, so the
// detail comes up on request rather than as a static table.
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const src = (u, label = "source") => (u ? ` <a href="${esc(u)}" rel="noopener" target="_blank" class="src">${esc(label)}<span class="visually-hidden"> (opens in a new tab)</span></a>` : "");
  const LEAD = new Set(["lead filer", "filed (named in proxy)"]);
  const median = (v) => { const s = [...v].sort((a, b) => a - b), n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; };
  const pct = (v) => (v == null ? "none" : `${Math.round(v)}%`);

  window.renderTopics = function (data) {
    const el = document.getElementById("tab-topics");
    if (!el || el.dataset.built) return;
    const A = data.asks || {}, G = data.graph && data.graph.nodes ? data.graph : { nodes: [], edges: [] };
    const cats = A.categories || [], asks = A.asks || [];
    if (!cats.length) return;
    el.dataset.built = "1";
    const nodes = new Map(G.nodes.map((n) => [n.id, n]));
    // Lead-filed from a critical stance on ESG: listed, but left out of the support figures (as in the planner).
    const critical = new Set();
    (G.edges || []).forEach((e) => {
      const a = nodes.get(e.source), b = nodes.get(e.target);
      if (a && b && b.type === "proposal" && LEAD.has(e.type) && /anti-ESG/i.test(a.org_type || "")) critical.add(b.id);
    });
    const props = G.nodes.filter((n) => n.type === "proposal" && n.ask_id);
    const byAsk = new Map();
    props.forEach((p) => { if (!byAsk.has(p.ask_id)) byAsk.set(p.ask_id, []); byAsk.get(p.ask_id).push(p); });
    const polls = new Map();
    ((data.public_opinion && data.public_opinion.polls) || []).forEach((p) => { if (!polls.has(p.ask_id)) polls.set(p.ask_id, []); polls.get(p.ask_id).push(p); });
    const voted = (list) => list.filter((p) => p.support_pct != null && !critical.has(p.id)).map((p) => p.support_pct);

    const card = (c) => {
      const mine = asks.filter((a) => a.category === c.id);
      const list = mine.flatMap((a) => byAsk.get(a.id) || []);
      const v = voted(list);
      const chips = mine.map((a) => {
        const n = (byAsk.get(a.id) || []).length;
        return `<button type="button" class="chip tp-ask" data-ask="${esc(a.id)}" aria-expanded="false">${esc(a.label)} <span class="tp-n">${n}</span></button>`;
      }).join("");
      return `<article class="card tp-card" data-cat="${esc(c.id)}">
        <h3>${esc(c.label)}</h3>
        <p>${esc(c.about)}</p>
        <p class="tp-stats"><strong>${list.length}</strong> ${list.length === 1 ? "proposal" : "proposals"} filed · median support <strong>${pct(median(v))}</strong> across ${v.length} voted</p>
        <div class="tp-asks" role="group" aria-label="Asks in ${esc(c.label)}">${chips}</div>
        <div class="tp-more" hidden></div>
      </article>`;
    };

    const more = (askId) => {
      const a = asks.find((x) => x.id === askId) || {};
      const list = (byAsk.get(askId) || []).slice().sort((x, y) => String(y.meeting_date || y.year).localeCompare(String(x.meeting_date || x.year)));
      const v = voted(list);
      const rows = list.map((p) => `<li>${esc(p.label)}: ${p.support_pct != null ? `${esc(p.support_pct)}%` : esc(p.status)}${critical.has(p.id) ? " <span class=\"note\">(filed by a filer critical of ESG; left out of the figures)</span>" : ""}${src(p.results_url || p.source_url)}</li>`).join("");
      const pl = (polls.get(askId) || []).map((p) => `<li>${esc(p.result)} (${esc(p.pollster)}, ${esc(p.population)}, n = ${esc(p.n)}, ${esc(p.fielded)})${src(p.url)}</li>`).join("");
      return `<h4>${esc(a.label)}</h4>
        <p class="tp-stats">${list.length} filed · best support ${pct(v.length ? Math.max(...v) : null)} · median ${pct(median(v))}</p>
        ${rows ? `<ul class="tp-list">${rows}</ul>` : `<p class="note">No filings recorded for this ask yet.</p>`}
        ${pl ? `<h5>Public opinion</h5><ul class="tp-list">${pl}</ul>` : ""}
        <p><a href="#tracker">See this ask at every company</a></p>`;
    };

    el.innerHTML = `<h2>Topics in responsible AI</h2>
      <p class="intro">Grouped by this site. Click an ask for its filings, support and polls. Support figures leave out proposals lead-filed by filers critical of ESG.</p>
      <div class="tp-grid">${cats.map(card).join("")}</div>`;
    el.addEventListener("click", (e) => {
      const b = e.target.closest(".tp-ask");
      if (!b) return;
      const art = b.closest(".tp-card"), box = art.querySelector(".tp-more");
      const open = b.getAttribute("aria-expanded") === "true";
      art.querySelectorAll(".tp-ask").forEach((x) => x.setAttribute("aria-expanded", "false"));
      if (open) { box.hidden = true; return; }
      b.setAttribute("aria-expanded", "true");
      box.innerHTML = more(b.dataset.ask);
      box.hidden = false;
    });
  };
})();

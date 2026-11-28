// Effects of AI (owner, 2026-11-28: "make the effect of ai page super up to date with all the recent and policy work so
// the user has an idea of all the ways ai can affect the world and group it into digestible areas so that when they
// make a proposal they can easily identify what in ai world they want fixed ... connect to the policy section ... give
// people a clear idea of ai safety"). data/ai_effects.json: areas, each with effects, their dated evidence, the rules
// that reach them (linked to AI governance) and the recurring asks that cover them. Click an effect for its record.
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

    const askName = new Map(asks.map((a) => [a.id, a.label]));
    const STATUS = { "in force": "in force", "adopted, not yet in force": "adopted, not yet in force", proposed: "proposed", voluntary: "voluntary", revoked: "revoked" };
    const D = (d) => (window.DATES && d ? window.DATES.long(String(d)) : esc(d || ""));
    const panel = (area, ef) => {
      const ev = (ef.evidence || []).map((x) => `<li><span class="ticker">${D(x.date)}</span> ${esc(x.text)} <span class="ticker">(${esc(x.source)})</span>${src(x.url)}</li>`).join("");
      const pol = (ef.policy || []).map((x) => `<li><span class="tp-st tp-st-${esc(String(x.status || "").split(",")[0].replace(/\s+/g, "-"))}">${esc(STATUS[x.status] || x.status || "")}</span> ${esc(x.text)} <span class="ticker">${D(x.date)}</span>${src(x.url)}${x.causality_id ? ` <a href="#causality" class="tp-gov">in AI governance</a>` : ""}</li>`).join("");
      const ak = (ef.ask_ids || []).map((id) => `<details class="tp-askrec"><summary>${esc(askName.get(id) || id)} <span class="tp-n">${(byAsk.get(id) || []).length} filed</span></summary>${more(id)}</details>`).join("");
      const al = (ef.alignment_ask_ids || []).map((id) => `<li><a href="#asks" data-al="${esc(id)}">${esc(id.replace(/-/g, " "))}</a></li>`).join("");
      return `<h4>${esc(ef.label)}</h4>
        <p>${esc(ef.what)}</p>
        ${ev ? `<h5>Evidence</h5><ul class="tp-list">${ev}</ul>` : ""}
        ${pol ? `<h5>Rules that reach it</h5><ul class="tp-list">${pol}</ul>` : `<p class="note">No rule found that reaches this yet.</p>`}
        <h5>Investor asks that cover it</h5>
        ${ak || `<p class="note">No recurring shareholder ask covers this yet in this dataset.</p>`}
        ${al ? `<p class="tp-al">AI safety asks for frontier labs that cover it:</p><ul class="tp-list">${al}</ul>` : ""}
        ${ef.company_levers ? `<p class="note">${esc(ef.company_levers)}</p>` : ""}`;
    };
    const areaCard = (a) => {
      const chips = (a.effects || []).map((ef) => {
        const gap = !(ef.ask_ids || []).length && !(ef.alignment_ask_ids || []).length;
        return `<button type="button" class="chip tp-ef" data-area="${esc(a.id)}" data-ef="${esc(ef.id)}" aria-expanded="false">${esc(ef.label)}${gap ? ' <span class="tp-gap">no ask yet</span>' : ""}</button>`;
      }).join("");
      return `<article class="card tp-card${a.id === "frontier-safety" ? " tp-safety" : ""}" id="area-${esc(a.id)}">
        <h3>${esc(a.label)}</h3>
        <p>${esc(a.about)}</p>
        <div class="tp-asks" role="group" aria-label="Effects in ${esc(a.label)}">${chips}</div>
        <div class="tp-more" hidden></div>
      </article>`;
    };
    const draw = (E) => {
      const areas = (E && E.areas) || [];
      const nEf = areas.reduce((n, a) => n + (a.effects || []).length, 0);
      el.innerHTML = `<h2>Effects of AI</h2>
        <p class="intro">${areas.length} areas and ${nEf} effects, grouped by this site, as of ${D(E.updated)}. Click an effect for its evidence, the rules that reach it (with links to AI governance) and the investor asks that cover it. "No ask yet" marks effects no recurring shareholder ask covers in this dataset. Support figures leave out proposals lead-filed by filers critical of ESG.</p>
        <div class="tp-grid">${areas.map(areaCard).join("")}</div>`;
      el.addEventListener("click", (e) => {
        const al = e.target.closest("[data-al]");
        if (al) {
          // Opens the folded safety asks below and brings that ask into view.
          e.preventDefault();
          const f = document.getElementById("fold-asks");
          if (f) { f.open = true; setTimeout(() => { const t = document.getElementById("ask-" + al.dataset.al); (t || f).scrollIntoView({ block: "start" }); }, 150); }
          return;
        }
        const b = e.target.closest(".tp-ef");
        if (!b) return;
        const art = b.closest(".tp-card"), box = art.querySelector(".tp-more");
        const open = b.getAttribute("aria-expanded") === "true";
        art.querySelectorAll(".tp-ef").forEach((x) => x.setAttribute("aria-expanded", "false"));
        if (open) { box.hidden = true; return; }
        const area = areas.find((x) => x.id === b.dataset.area), ef = area && (area.effects || []).find((x) => x.id === b.dataset.ef);
        if (!ef) return;
        b.setAttribute("aria-expanded", "true");
        box.innerHTML = panel(area, ef);
        box.hidden = false;
      });
    };
    el.innerHTML = `<p class="status-note" role="status">Loading…</p>`;
    fetch("data/ai_effects.json").then((r) => r.json()).then(draw).catch(() => { el.innerHTML = `<p class="status-note">This view's data did not load.</p>`; });
  };
})();

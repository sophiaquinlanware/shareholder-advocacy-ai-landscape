// Disclosure scorecard: each company's public AI disclosure checked against the
// Investor Recommendations for an Effective Rights-Based Approach to AI
// (prepared by Parnassus Investments and other investors, April 2025).
// Reads data/scorecard.json. Every square links to the company's own document.

(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const link = (url, label = "source") => url ? `<a class="src" href="${esc(url)}" target="_blank" rel="noopener">[${esc(label)}]</a>` : `<span class="unverified">source pending</span>`;
  const POINTS = { met: 2, partial: 1, silent: 0 };
  const LABEL = { met: "Met", partial: "Partial", silent: "Silent" };
  let S = null;

  function total(c, pillar) {
    const ids = new Set(S.criteria.filter((k) => !pillar || k.pillar === pillar).map((k) => k.id));
    const sc = c.scores.filter((s) => ids.has(s.id));
    return { got: sc.reduce((a, s) => a + (POINTS[s.score] || 0), 0), max: ids.size * 2 };
  }

  function draw() {
    const crit = S.criteria.filter((k) => !S.pillar || k.pillar === S.pillar);
    const pillars = [...new Set(crit.map((k) => k.pillar))];
    const cos = [...S.companies].sort((a, b) => S.sort === "score" ? total(b, S.pillar).got - total(a, S.pillar).got : a.name.localeCompare(b.name));
    const head1 = pillars.map((p) => `<th colspan="${crit.filter((k) => k.pillar === p).length}" class="sc-pillar">${esc(p)}</th>`).join("");
    const head2 = crit.map((k) => `<th class="sc-crit" title="${esc(k.test)}"><span>${esc(k.label)}</span></th>`).join("");
    const rows = cos.map((c) => {
      const t = total(c, S.pillar);
      const pct = Math.round((100 * t.got) / t.max);
      const cells = crit.map((k) => {
        const s = c.scores.find((x) => x.id === k.id) || { score: "silent" };
        const on = S.sel && S.sel.t === c.ticker && S.sel.k === k.id;
        return `<td><button type="button" class="sc-cell ${esc(s.score)}${on ? " on" : ""}" data-t="${esc(c.ticker)}" data-k="${esc(k.id)}" aria-label="${esc(c.name)}, ${esc(k.label)}: ${esc(LABEL[s.score] || s.score)}"></button></td>`;
      }).join("");
      return `<tr><th class="sc-co">${esc(c.name)}<div class="sc-bar"><span style="width:${pct}%"></span></div><div class="ticker">${t.got} of ${t.max} points</div></th>${cells}</tr>`;
    }).join("");
    document.getElementById("sc-matrix").innerHTML = `<table class="sc-table"><thead><tr><th></th>${head1}</tr><tr><th></th>${head2}</tr></thead><tbody>${rows}</tbody></table>`;
    document.querySelectorAll("#sc-matrix .sc-cell").forEach((b) => b.addEventListener("click", () => select(b.dataset.t, b.dataset.k)));
  }

  function select(t, k) {
    S.sel = { t, k };
    const c = S.companies.find((x) => x.ticker === t);
    const crit = S.criteria.find((x) => x.id === k);
    const s = c.scores.find((x) => x.id === k) || { score: "silent", evidence: "No public disclosure found." };
    document.getElementById("sc-panel").innerHTML = `
      <p class="eyebrow tight">${esc(crit.pillar)}</p>
      <h3>${esc(c.name)}: ${esc(crit.label)}</h3>
      <p><span class="pill ${s.score === "met" ? "open" : s.score === "partial" ? "narrowing" : "pending"}">${esc(LABEL[s.score] || s.score)}</span>${s.doc_date ? ` <span class="ticker">document dated ${esc(s.doc_date)}</span>` : ""}</p>
      <p>${esc(s.evidence || "")} ${s.url ? link(s.url, "company document") : ""}</p>
      <p class="status-note"><strong>What the recommendations ask:</strong> ${esc(crit.test)}</p>`;
    draw();
  }

  window.renderScorecard = function (data) {
    const el = document.getElementById("tab-parnassus");
    if (!data || !data.companies || !data.companies.length) {
      el.innerHTML = `<div class="coming"><h2>Disclosure scorecard</h2><p>Being scored now.</p></div>`;
      return;
    }
    S = { criteria: data.criteria, companies: data.companies, pillar: "", sort: "score", sel: null };
    const pillars = [...new Set(data.criteria.map((k) => k.pillar))];
    const docs = data.companies.map((c) => `<li><strong>${esc(c.name)}:</strong> ${(c.key_documents || []).map((d) => `<a href="${esc(d.url)}" target="_blank" rel="noopener">${esc(d.title)}</a>${d.date ? ` (${esc(d.date)})` : ""}`).join(", ")}</li>`).join("");
    const tl = (data.parnassus_timeline || []).map((e) => `<li><div class="date">${esc(e.date)}${e.company ? " · " + esc(e.company) : ""}</div>
      <div><strong>${esc(e.title)}.</strong> ${esc(e.summary)} ${link(e.source_url, e.source_page ? "source, p. " + e.source_page : "source")}</div></li>`).join("");
    el.innerHTML = `
      <h2>Compare disclosure</h2>
      <p class="intro">${data.companies.length} companies × ${data.criteria.length} criteria from the <a href="${esc(data.framework_url)}" target="_blank" rel="noopener">Investor Recommendations for an Effective Rights-Based Approach to AI</a> (April 2025), scored on published disclosure only. Silent = no public disclosure found. Not affiliated with Parnassus Investments.</p>
      <div class="net-controls">
        <div class="seg" role="group" aria-label="Pillar">
          <button type="button" data-p="" aria-pressed="true">All</button>
          ${pillars.map((p) => `<button type="button" data-p="${esc(p)}" aria-pressed="false">${esc(p.replace(" and accountability", "").replace(" (appendix)", ""))}</button>`).join("")}
        </div>
        <div class="seg" role="group" aria-label="Sort">
          <button type="button" data-s="score" aria-pressed="true">Sort by score</button>
          <button type="button" data-s="name" aria-pressed="false">A to Z</button>
        </div>
      </div>
      <div class="net-legend">
        <span class="leg static"><span class="dot sc-met"></span>Met</span>
        <span class="leg static"><span class="dot sc-partial"></span>Partial</span>
        <span class="leg static"><span class="dot sc-silent"></span>Silent</span>
      </div>
      <div id="sc-matrix" class="table-wrap sc-wrap"></div>
      <aside id="sc-panel" class="net-panel sc-panel" aria-live="polite"><p class="status-note">Select a square for its evidence.</p></aside>
      <h2>Documents reviewed</h2><ul class="steps">${docs}</ul>`;
    const out = document.getElementById("tab-outcomes");
    if (out) out.innerHTML = tl
      ? `<h2>Engagement outcomes</h2><p class="intro">What changed at companies after private engagement on AI, as the investor itself has reported it. Today this covers Parnassus Investments, from its stewardship reports; each step links to the page. The same engagements show in the Network as "engaged directly" links.</p><ul class="timeline">${tl}</ul>`
      : `<h2>Engagement outcomes</h2><p class="status-note">No reported engagement outcomes on file.</p>`;
    el.querySelectorAll("[data-p]").forEach((b) => b.addEventListener("click", () => {
      S.pillar = b.dataset.p;
      el.querySelectorAll("[data-p]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    }));
    el.querySelectorAll("[data-s]").forEach((b) => b.addEventListener("click", () => {
      S.sort = b.dataset.s;
      el.querySelectorAll("[data-s]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      draw();
    }));
    draw();
  };
})();

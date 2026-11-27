// Two views for engaging frontier labs on safety (data session):
//   AI value chain › Labs you can file at: frontier labs whose shareholders can now reach them directly (Anthropic
//     listed in November 2026; xAI inside SpaceX, listed June 2026), what it takes to file, who controls the vote,
//     their safety commitments on record, and the listed companies with the strongest ties to them.
//   Plan and test › Safety asks: AI-safety practices written as shareholder asks, with who has committed to each,
//     the rules that already require it, the nearest past proposals and votes, and the exclusion risk
//     (data/alignment_asks.json).
// Reads data/lab_leverage.json (scripts/build_leverage.py) and data/companies.json. Nothing here recommends a vote.
(() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const day = (d) => (window.DATES && d ? window.DATES.long(d) : d || "");
  const src = (u, label = "source") => (u ? ` <a href="${esc(u)}" rel="noopener" target="_blank" class="src">${esc(label)}<span class="visually-hidden"> (opens in a new tab)</span></a>` : "");
  const plan = (co, ask) => `?plan=${encodeURIComponent(co)}~${encodeURIComponent(ask)}#planner`;
  const lazy = (id, build) => {
    const el = document.getElementById(id);
    if (!el) return;
    const go = async () => {
      if (el.hidden || el.dataset.built) return;
      el.dataset.built = "1";
      el.innerHTML = `<p class="status-note" role="status">Loading…</p>`;
      try { await build(el); } catch (e) { el.innerHTML = `<p class="status-note">This view's data did not load.</p>`; }
    };
    new MutationObserver(go).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    go();
  };
  const json = (f) => fetch(`data/${f}`).then((r) => r.json());

  // ---------- Labs you can file at ----------
  async function listedLabs(el) {
    const [L, C] = await Promise.all([json("lab_leverage.json"), json("companies.json")]);
    const co = Object.fromEntries(C.filter((c) => c.ticker).map((c) => [c.ticker, c]));
    const direct = L.labs.map((l) => ({ lab: l, row: l.routes.find((r) => r.direct && (l.status === "public" || l.parent === "spacex")) })).filter((x) => x.row);
    const others = L.labs.filter((l) => l.status === "private");
    const lever = (l) => `<li><strong>${esc(l.type)}</strong> (${esc(l.strength_label || "unrated")})${l.description ? `: ${esc(l.description)}` : ""}${src(l.source_url)}</li>`;
    const card = ({ lab, row }) => {
      const c = co[row.ticker] || {};
      const commits = [c.engagement_basis, ...(c.evidence || [])].filter((e) => e && e.text);
      const outside = lab.routes.filter((r) => !r.direct).slice(0, 4);
      return `<article class="pl-card al-lab" aria-labelledby="al-h-${esc(lab.id)}">
        <h3 id="al-h-${esc(lab.id)}">${esc(lab.name)}${row.ticker ? ` <span class="ticker">${row.name === lab.name ? "" : `${esc(row.name)} `}(${esc(row.ticker)})</span>` : ""}</h3>
        <p>${esc(lab.description || "")}${src(lab.source_url)}</p>
        <dl class="al-dl">
          <div><dt>Who controls the vote</dt><dd>${esc(row.control || "Not recorded")}${src(row.control_source)}</dd></div>
          <div><dt>What it takes to file</dt><dd>${esc(row.threshold || "Not recorded")}. ${esc(row.how_to_file || "")}${src(row.how_to_file_source)}</dd></div>
          <div><dt>What an outside vote can do</dt><dd>${esc(row.route_reason || "")}</dd></div>
          <div><dt>Safety commitments on record</dt><dd>${commits.length ? `<ul class="steps tight">${commits.map((e) => `<li>${esc(e.text)}${src(e.url)}</li>`).join("")}</ul>` : "None recorded."}</dd></div>
          <div><dt>Reported holders on file</dt><dd>${row.holders_count ? `${row.holders_count}: ${row.holders.map((h) => esc(h.name)).join(", ")}` : "None yet. Holdings reports for the quarter of the listing (Form 13F) are due 45 days after the quarter ends."}</dd></div>
          <div><dt>AI proposals filed here so far</dt><dd>${row.ai_proposals_filed || "None"}</dd></div>
          ${outside.length ? `<div><dt>Listed companies with the strongest ties to it</dt><dd><ul class="steps tight">${outside.map((r) => `<li><strong>${esc(r.name)}</strong>: ${r.levers.map((l) => `${esc(l.type)} (${esc(l.strength_label || "unrated")})`).join(", ")}${r.next_deadline ? `; next proposal deadline ${esc(day(r.next_deadline))}${r.next_deadline_status === "passed" ? " (passed)" : ""}` : ""}</li>`).join("")}</ul></dd></div>` : ""}
        </dl>
        <p><a class="bd-btn" href="${plan(c.id || row.ticker, "ask-ai-oversight-reporting")}">Plan an engagement at ${esc(lab.name)}</a> <a href="#asks">See the safety asks</a></p>
      </article>`;
    };
    el.innerHTML = `
      <h2>Frontier labs you can file at</h2>
      <p class="intro">Until 2026 no frontier lab had public shareholders, so investors could reach the labs only through the companies that fund, host or supply them. Two can now be reached directly: Anthropic, listed on Nasdaq in November 2026, and xAI, part of SpaceX since February 2026, listed in June 2026. In both, founders keep control of the vote, so outside proposals record shareholders' views rather than decide outcomes.</p>
      ${direct.map(card).join("")}
      <h3>Labs reachable only through others</h3>
      <p class="status-note">Private labs, with the listed companies most strongly tied to each (from Ties to each frontier lab).</p>
      <ul class="steps">${others.map((l) => `<li><strong>${esc(l.name)}</strong>: ${l.routes.slice(0, 3).map((r) => `${esc(r.name)} (${r.levers.map((x) => esc(x.type)).join(", ")})`).join("; ") || "no listed company tied in the records"}</li>`).join("")}</ul>
      <p class="note">Order: the strongest recorded ties first. This orders what the records show; it is not a forecast of influence and not a recommendation.</p>`;
  }

  // ---------- Safety asks ----------
  async function safetyAsks(el) {
    const A = await json("alignment_asks.json");
    el.innerHTML = `
      <h2>Safety asks</h2>
      <p class="intro">${esc(A.intro || "")}</p>
      ${A.asks.map((a) => `<article class="pl-card al-ask" id="ask-${esc(a.id)}" aria-labelledby="al-a-${esc(a.id)}">
        <h3 id="al-a-${esc(a.id)}">${esc(a.label)}</h3>
        <p>${esc(a.practice)}</p>
        <dl class="al-dl">
          <div><dt>Who has committed to it</dt><dd>${(a.committed || []).map((x) => `${esc(x.text)}${src(x.url)}`).join("<br>") || "No public commitments found."}</dd></div>
          <div><dt>Rules that already require it</dt><dd>${(a.required_by || []).map((x) => `${esc(x.text)}${src(x.url)}`).join("<br>") || "None found."}</dd></div>
          <div><dt>Nearest past proposals</dt><dd>${(a.precedents || []).map((x) => `${esc(x.text)}${src(x.url)}`).join("<br>") || esc(a.precedents_note || "None found.")}</dd></div>
          <div><dt>Risk the company can exclude it</dt><dd>${esc(a.exclusion_risk || "")}${(a.exclusion_sources || []).map((u) => src(u)).join("")}</dd></div>
          <div><dt>Why it is financially material</dt><dd>${(a.materiality || []).map((x) => `${esc(x.text)}${src(x.url)}`).join("<br>") || "No evidence recorded yet."}</dd></div>
          <div><dt>Example wording</dt><dd><blockquote class="al-quote">${esc(a.example)}</blockquote><span class="note">Written by this site as an illustration to adapt, not a recommendation.</span></dd></div>
        </dl>
        <p><a href="${plan("anthropic", a.planner_ask || "ask-ai-oversight-reporting")}">Plan this at Anthropic</a> · <a href="#listed-labs">Labs you can file at</a></p>
      </article>`).join("")}
      <p class="note">${esc(A.about || "")}</p>`;
  }

  window.renderAlignment = () => {
    lazy("tab-listed-labs", listedLabs);
    lazy("tab-asks", safetyAsks);
  };
})();

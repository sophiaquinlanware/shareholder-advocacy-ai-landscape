// Stakeholder network › Investor profiles and Research and advocacy groups (owner, 2026-11-28: "group these by type
// basically - so you have company profiles and then investor profiles and then people profiles and then research
// group / non profit advocacy group profiles"). One searchable list per type, drawn from data/graph.json; picking a
// name opens its profile: what it is, its sourced ties grouped by kind, and a link to it in the graph.
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const src = (u, label = "source") => (u ? ` <a href="${esc(u)}" rel="noopener" target="_blank" class="src">${esc(label)}<span class="visually-hidden"> (opens in a new tab)</span></a>` : "");
  const SITE_LINK = "addresses the same issue as";
  // A tie seen from its other end, in plain words.
  const INCOMING = { "member of": "Members", evaluated: "Evaluated by", "published a critique of": "Critiqued by", signed: "Signed by",
    "announced a partnership with": "Partnership announced by", "publicly supported": "Supported by", "engaged directly": "Engaged by",
    "works at": "People", "holds shares in": "Held by", published: "Published by", "submitted comments on": "Comments from", "responded to": "Responses" };
  const KIND_LABEL = {
    "impact/ESG asset manager": "Impact or ESG asset manager", "advocacy nonprofit": "Advocacy nonprofit", "faith-based investor": "Faith-based investor",
    "public pension": "Public pension", "labor fund": "Labor fund", foundation: "Foundation", other: "Other investor",
  };
  const TYPES = {
    investors: { title: "Investor profiles", intro: "Asset managers, pensions, faith investors, labor funds, foundations and coalitions: what each has filed, engaged on, joined and holds, with sources.", match: (n) => n.type === "investor" || n.type === "coalition", kindOf: (n) => (n.type === "coalition" ? "Coalition" : KIND_LABEL[n.org_type] || "Other investor") },
    research: { title: "Research and advocacy groups", intro: "Research institutes, university centres, government AI safety institutes, standards bodies, and civil-society and advocacy groups outside investing: what each has published, signed, evaluated or criticised, with sources.", match: (n) => n.type === "organization", kindOf: (n) => n.kind || "Organization" },
  };

  function build(el, key, G) {
    const T = TYPES[key];
    const nodes = new Map(G.nodes.map((n) => [n.id, n]));
    const items = G.nodes.filter(T.match).sort((a, b) => a.label.localeCompare(b.label));
    const ties = (id) => G.edges.filter((e) => e.source === id || e.target === id);
    const kinds = [...new Set(items.map(T.kindOf))].sort();
    el.innerHTML = `<h2>${esc(T.title)}</h2>
      <p class="intro">${esc(T.intro)} Pick a name for its profile.</p>
      <div class="net-controls pf-controls">
        <input type="search" class="pf-q" placeholder="Search ${esc(T.title.toLowerCase())}" aria-label="Search ${esc(T.title.toLowerCase())}">
        <select class="pf-kind" aria-label="Type"><option value="">All types (${items.length})</option>${kinds.map((k) => `<option>${esc(k)}</option>`).join("")}</select>
      </div>
      <div class="pf-wrap"><ul class="pf-list" role="list"></ul><div class="pf-card card" aria-live="polite"><p class="status-note">Pick a name to see its profile.</p></div></div>`;
    const list = el.querySelector(".pf-list"), card = el.querySelector(".pf-card"), q = el.querySelector(".pf-q"), kind = el.querySelector(".pf-kind");
    const draw = () => {
      const t = q.value.trim().toLowerCase(), k = kind.value;
      const shown = items.filter((n) => (!t || n.label.toLowerCase().includes(t)) && (!k || T.kindOf(n) === k));
      list.innerHTML = shown.map((n) => `<li><button type="button" class="linklike pf-item" data-id="${esc(n.id)}">${esc(n.label)}</button> <span class="ticker">${esc(T.kindOf(n))} · ${ties(n.id).length} ties</span></li>`).join("") || `<li class="status-note">No match.</li>`;
    };
    const profile = (n) => {
      const groups = new Map();
      ties(n.id).forEach((e) => {
        const out = e.source === n.id, other = nodes.get(out ? e.target : e.source);
        if (!other) return;
        const rel = e.type === SITE_LINK ? "Addresses the same issue as (this site's link, not a sourced tie)" : out ? e.type[0].toUpperCase() + e.type.slice(1) : INCOMING[e.type] || `${e.type} (from)`;
        if (!groups.has(rel)) groups.set(rel, []);
        groups.get(rel).push(`<li>${esc(other.label)}${e.date ? ` <span class="ticker">${esc(e.date)}</span>` : ""}${e.quote ? ` <span class="pf-quote">“${esc(e.quote)}”</span>` : ""}${src(e.source_url)}${e.review_status && /not yet reviewed/.test(e.review_status) ? ' <span class="unverified">auto-detected, not yet reviewed</span>' : ""}</li>`);
      });
      const sections = [...groups].sort((a, b) => b[1].length - a[1].length).map(([rel, li]) => `<h4 class="net-rec-h">${esc(rel)} (${li.length})</h4><ul class="conn">${li.join("")}</ul>`).join("");
      card.innerHTML = `<p class="eyebrow">${esc(T.kindOf(n))}</p><h3>${esc(n.label)}</h3>
        ${n.description ? `<p>${esc(n.description)}${src(n.source_url)}</p>` : ""}
        ${(n.focus || []).length ? `<p><strong>Focus:</strong> ${esc(n.focus.join(", "))}</p>` : ""}
        ${n.website ? `<p><a href="${esc(n.website)}" target="_blank" rel="noopener">Website</a></p>` : ""}
        <p><button type="button" class="chip pf-graph" data-id="${esc(n.id)}">Show in the network graph</button></p>
        ${sections || `<p class="status-note">No sourced ties recorded yet.</p>`}`;
    };
    el.addEventListener("click", (e) => {
      const it = e.target.closest(".pf-item");
      if (it) {
        el.querySelectorAll(".pf-item[aria-current]").forEach((x) => x.removeAttribute("aria-current"));
        it.setAttribute("aria-current", "true");
        profile(nodes.get(it.dataset.id));
        if (innerWidth < 900) card.scrollIntoView({ block: "start" });
        return;
      }
      const g = e.target.closest(".pf-graph");
      if (g && window.showTab) { window.showTab("network", true); setTimeout(() => window.focusNetworkNode && window.focusNetworkNode(g.dataset.id), 300); }
    });
    q.addEventListener("input", draw);
    kind.addEventListener("change", draw);
    draw();
  }

  window.renderProfiles = function (data) {
    const G = data.graph && data.graph.nodes ? data.graph : null;
    if (!G) return;
    [["tab-investors", "investors"], ["tab-groups", "research"]].forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el && !el.dataset.built) { el.dataset.built = "1"; build(el, key, G); }
    });
  };
})();

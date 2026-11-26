// Advocacy network: an Obsidian-style force graph of who files AI proposals where.
// Reads data/network.json. Nodes: organizations, proposals, companies. Every node and edge carries a source.

(function () {
  // Respect the reader's reduced-motion setting: no animated zoom, and the layout settles before it is drawn.
  const REDUCED_MOTION = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  // Links are drawn as gentle quadratic arcs (control point 15% of the link length off the midpoint).
  const arc = (d) => {
    const sx = d.source.x, sy = d.source.y, tx = d.target.x, ty = d.target.y;
    const mx = (sx + tx) / 2 - (ty - sy) * 0.15, my = (sy + ty) / 2 + (tx - sx) * 0.15;
    return `M${sx},${sy}Q${mx},${my} ${tx},${ty}`;
  };
  // Companies and labs are typed by their primary value-chain tier ("tier" on graph.json nodes, set by the
  // data session from data/value_chain.json; labels verbatim from there). A company with no tier stays "Company".
  const TIERS = [
    { id: "chips", label: "Chip builders" },
    { id: "datacenters", label: "Data centers and power" },
    { id: "compute", label: "Hyperscalers and AI clouds" },
    { id: "labs", label: "Frontier AI labs" },
    { id: "capital", label: "Strategic investors" },
    { id: "deployers", label: "AI deployers" },
  ];
  const TYPE_LABEL = {
    ...Object.fromEntries(TIERS.map((t) => ["tier-" + t.id, t.label])),
    company: "Company (tier not yet assigned)",
    proposal: "Proposal",
    "impact/ESG asset manager": "Impact or ESG asset manager",
    "advocacy nonprofit": "Advocacy nonprofit",
    "faith-based investor": "Faith-based investor",
    "public pension": "Public pension",
    "labor fund": "Labor fund",
    foundation: "Foundation",
    coalition: "Coalition",
    other: "Other investor",
    person: "Engagement lead",
    lab: "Frontier AI lab (tier not yet assigned)",
    policy: "Policy or rule",
    response: "Company or investor response",
    public: "Public engagement",
  };
  const TYPE_VAR = {
    ...Object.fromEntries(TIERS.map((t) => ["tier-" + t.id, "--n-tier-" + t.id])),
    company: "--n-company",
    proposal: "--n-proposal",
    "impact/ESG asset manager": "--n-manager",
    "advocacy nonprofit": "--n-nonprofit",
    "faith-based investor": "--n-faith",
    "public pension": "--n-pension",
    "labor fund": "--n-labor",
    foundation: "--n-foundation",
    coalition: "--n-coalition",
    other: "--n-other",
    person: "--n-person",
    lab: "--n-lab",
    policy: "--n-policy",
    response: "--n-response",
    public: "--n-public",
  };
  const COMPANY_NAMES = { MSFT: "Microsoft", GOOGL: "Alphabet", META: "Meta", AMZN: "Amazon", NVDA: "Nvidia", AAPL: "Apple", TSLA: "Tesla" };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const link = (url, label = "source") => url ? `<a class="src" href="${esc(url)}" target="_blank" rel="noopener">[${esc(label)}]</a>` : `<span class="unverified">source pending</span>`;
  // Node colours on the dark graph canvas: the --gn-* set (styles.css), one per --n-* type token.
  const nodeColor = (kind) => cssVar(String(TYPE_VAR[kind] || "--n-other").replace("--n-", "--gn-"));
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888";

  let state = null;

  // ---------- Lenses (lenses.js): which layers start on, what size and rings mean, and the actions ----------
  const LENS_KEY = "lens";
  const lens = () => (window.LENSES || {})[state.lens] || { label: "", sizeLabel: "number of connections", defaults: {}, size: () => null, rings: () => [], actions: () => [] };
  function initialLens() {
    const ids = Object.keys(window.LENSES || {});
    const fromUrl = new URLSearchParams(location.search).get("lens");
    if (ids.includes(fromUrl)) return fromUrl;
    try { const s = localStorage.getItem(LENS_KEY); if (ids.includes(s)) return s; } catch (e) {}
    return ids[0] || "impact";
  }
  // Keep the choice in the URL (shareable) and in this browser; the #tab hash stays as it is.
  function saveLens(id) {
    try { localStorage.setItem(LENS_KEY, id); } catch (e) {}
    try {
      const u = new URL(location.href);
      u.searchParams.set("lens", id);
      window.history.replaceState(null, "", u.pathname + u.search + location.hash);
    } catch (e) {}
  }
  const rings = (n) => lens().rings(n, state.ctx) || [];
  const actions = (n) => lens().actions(n, state.ctx) || [];
  const conf = (l) => (window.RULES ? window.RULES.edgeConfidence(l) : { level: l.source_url ? "verified" : "inferred", text: l.source_url ? "verified" : "inferred" });

  // The shared relationship store (data/graph.json): every tab's facts in one graph.
  function buildFromGraph(G) {
    const nodes = G.nodes.map((n) => {
      let kind = n.type;
      if (kind === "investor") kind = TYPE_VAR[n.org_type] ? n.org_type : "other";
      if (kind === "company" || kind === "lab") {
        const tier = n.tier || (window.companyTiers || new Map()).get(n.ticker);
        if (tier && TYPE_LABEL["tier-" + tier]) kind = "tier-" + tier;
      }
      return { ...n, kind, label: n.label };
    });
    const ids = new Set(nodes.map((n) => n.id));
    const links = G.edges.filter((e) => ids.has(e.source) && ids.has(e.target))
      .map((e) => ({ ...e, relation: e.type }));
    return { nodes, links };
  }

  function build(raw, people) {
    const nodes = new Map();
    const add = (n) => { if (!nodes.has(n.id)) nodes.set(n.id, n); return nodes.get(n.id); };
    for (const o of raw.organizations || []) add({ ...o, kind: o.type === "coalition" ? "coalition" : (TYPE_VAR[o.type] ? o.type : "other"), label: o.name });
    for (const p of raw.proposals || []) {
      add({ ...p, kind: "proposal", label: `${COMPANY_NAMES[p.company] || p.company} ${p.year}: ${p.title}` });
      add({ id: "co-" + p.company, kind: "company", label: COMPANY_NAMES[p.company] || p.company, ticker: p.company });
    }
    const links = [];
    for (const pp of people || []) {
      if (!nodes.has(pp.org_id)) continue;
      add({ ...pp, id: "person-" + pp.id, kind: "person", label: pp.name });
      links.push({ source: "person-" + pp.id, target: pp.org_id, relation: "works at", source_url: pp.profile_url });
    }
    for (const p of raw.proposals || []) links.push({ source: p.id, target: "co-" + p.company, relation: "proposal at", source_url: p.source_url });
    for (const e of raw.edges || []) if (nodes.has(e.from) && nodes.has(e.to)) links.push({ source: e.from, target: e.to, relation: e.relation, source_url: e.source_url });
    const deg = new Map();
    links.forEach((l) => { deg.set(l.source, (deg.get(l.source) || 0) + 1); deg.set(l.target, (deg.get(l.target) || 0) + 1); });
    nodes.forEach((n) => { n.degree = deg.get(n.id) || 0; });
    return { nodes: [...nodes.values()], links };
  }

  function baseRadius(n) {
    if (n.kind === "company") return 16;
    if (n.kind === "proposal") return 5;
    if (n.kind === "person") return 4;
    if (["policy", "response", "public"].includes(n.kind)) return 4 + Math.min(6, Math.sqrt(n.degree) * 1.5);
    if (n.kind === "lab") return 10;
    return 6 + Math.min(10, Math.sqrt(n.degree) * 2.4);
  }
  const radius = (n) => {
    const r = state.ctx ? lens().size(n, state.ctx) : null;
    return (r == null ? baseRadius(n) : r) * state.cfg.nodeScale;
  };

  // ---------- Graph settings (like Obsidian's graph view): display, filters and forces ----------
  // Kept per viewer in localStorage; the page works the same without it.
  const SETTINGS_KEY = "net-settings-v1";
  const DEFAULTS = { textSize: 11, labelMin: 0, nodeScale: 1, linkScale: 1, labels: false, orphans: true, center: 0.05, repel: 1, linkStrength: 0.6, linkDist: 1, group: 0.5 };

  // ---------- Grouped layout: a 2D frame so each kind of node has its own region ----------
  // Left to right follows the filing chain: people → filer organizations → proposals → companies → labs.
  // Filer types each get a horizontal band; policy, responses and public engagement sit in a top band.
  const FILER_ROWS = ["impact/ESG asset manager", "advocacy nonprofit", "faith-based investor", "public pension", "labor fund", "foundation", "coalition", "other"];
  const COLUMNS = [
    { x: 0.06, label: "People", kinds: ["person"] },
    { x: 0.25, label: "Filers", kinds: FILER_ROWS },
    { x: 0.5, label: "Proposals", kinds: ["proposal"] },
    { x: 0.73, label: "Companies", kinds: ["company", ...TIERS.filter((t) => t.id !== "labs").map((t) => "tier-" + t.id)] },
    { x: 0.92, label: "Frontier labs", kinds: ["lab", "tier-labs"] },
  ];
  const TOP_BAND = ["policy", "response", "public"];
  // Columns whose node types are all hidden give up their space; the rest spread across the width.
  function activeColumns() {
    const present = new Set(state.data.nodes.map((n) => n.kind));
    const cols = COLUMNS.filter((c) => c.kinds.some((k) => present.has(k) && !state.hiddenKinds.has(k)));
    return cols.map((c, i) => ({ ...c, x: cols.length === 1 ? 0.5 : 0.1 + (i * 0.8) / (cols.length - 1) }));
  }
  const groupX = (d) => {
    if (TOP_BAND.includes(d.kind)) return 0.5;
    const col = (state.cols || COLUMNS).find((c) => c.kinds.includes(d.kind));
    return col ? col.x : 0.5;
  };
  // Column headers (short on phones) and filer-type band labels, redrawn when layers change.
  function drawAxis() {
    if (!state.axis) return;
    const { width, height } = state.size;
    const narrow = width < 640;
    const SHORT = { People: "People", Filers: "Filers", Proposals: "Proposals", Companies: "Cos.", "Frontier labs": "Labs" };
    state.cols = activeColumns();
    state.axis.selectAll("*").remove();
    state.axis.selectAll("text.col").data(state.cols).join("text").attr("class", "col")
      .attr("x", (c) => c.x * width).attr("y", 14).attr("text-anchor", "middle").attr("font-size", narrow ? 9.5 : 11)
      .text((c) => (narrow ? SHORT[c.label] : c.label).toUpperCase());
    const bands = FILER_ROWS.filter((k) => !state.hiddenKinds.has(k) && state.data.nodes.some((n) => n.kind === k));
    if (!narrow) state.axis.selectAll("text.band").data(bands).join("text").attr("class", "band")
      .attr("x", 6).attr("y", (k) => groupY({ kind: k }) * height + 4).attr("font-size", 10).attr("font-weight", 400)
      .text((k) => TYPE_LABEL[k]);
    state.axis.attr("display", state.cfg.group > 0 ? null : "none");
  }
  // Re-aim the grouping forces after layers change, then let the layout settle again.
  function regroup() {
    if (!state.sim) return;
    drawAxis();
    const { width, height } = state.size;
    state.sim.force("gx").x((d) => groupX(d) * width);
    state.sim.force("gy").y((d) => groupY(d) * height);
    if (REDUCED_MOTION) { state.sim.alpha(1).stop(); state.sim.tick(300); state.draw(); } else state.sim.alpha(0.5).restart();
  }
  const groupY = (d) => {
    if (TOP_BAND.includes(d.kind)) return 0.06;
    const i = FILER_ROWS.indexOf(d.kind);
    if (i >= 0) return 0.16 + (i / (FILER_ROWS.length - 1)) * 0.76;
    // Companies: one band per value-chain tier, top to bottom in value-chain order.
    const companyTiers = TIERS.filter((t) => t.id !== "labs");
    const t = companyTiers.findIndex((x) => "tier-" + x.id === d.kind);
    return t >= 0 ? 0.16 + (t / (companyTiers.length - 1)) * 0.76 : 0.55;
  };
  const SLIDERS = [
    { group: "Display", key: "textSize", label: "Text size", min: 8, max: 20, step: 1, fmt: (v) => v + "px" },
    { group: "Display", key: "labelMin", label: "Labels from connections ≥", min: 0, max: 40, step: 1, fmt: (v) => String(v) },
    { group: "Display", key: "nodeScale", label: "Node size", min: 0.4, max: 3, step: 0.1, fmt: (v) => v.toFixed(1) + "×" },
    { group: "Display", key: "linkScale", label: "Link thickness", min: 0.3, max: 4, step: 0.1, fmt: (v) => v.toFixed(1) + "×" },
    { group: "Forces", key: "group", label: "Grouping force (0 = free layout)", min: 0, max: 1, step: 0.05, fmt: (v) => v.toFixed(2) },
    { group: "Forces", key: "center", label: "Center force", min: 0, max: 0.4, step: 0.01, fmt: (v) => v.toFixed(2) },
    { group: "Forces", key: "repel", label: "Repel force", min: 0, max: 4, step: 0.1, fmt: (v) => v.toFixed(1) + "×" },
    { group: "Forces", key: "linkStrength", label: "Link force", min: 0, max: 1, step: 0.05, fmt: (v) => v.toFixed(2) },
    { group: "Forces", key: "linkDist", label: "Link distance", min: 0.3, max: 3, step: 0.1, fmt: (v) => v.toFixed(1) + "×" },
  ];
  function loadSettings(defaults) {
    try { return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") }; } catch (e) { return { ...defaults }; }
  }
  function saveSettings() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.cfg)); } catch (e) {}
  }
  function settingsPanel() {
    const maxDeg = Math.max(...state.data.nodes.map((n) => n.degree || 0));
    const row = (s) => {
      const max = s.key === "labelMin" ? maxDeg : s.max;
      return `<label class="gs-row"><span>${esc(s.label)} <output id="gs-out-${s.key}" aria-hidden="true">${esc(s.fmt(state.cfg[s.key]))}</output></span>
        <input type="range" data-gs="${s.key}" min="${s.min}" max="${max}" step="${s.step}" value="${state.cfg[s.key]}"></label>`;
    };
    const group = (g) => `<fieldset class="gs-group"><legend>${g}</legend>${SLIDERS.filter((s) => s.group === g).map(row).join("")}</fieldset>`;
    document.getElementById("net-settings").innerHTML = `
      <summary>Graph settings</summary>
      <div class="gs-grid">
        ${group("Display")}
        <fieldset class="gs-group"><legend>Filters</legend>
          <label class="gs-check"><input type="checkbox" data-gs-check="labels"${state.cfg.labels ? " checked" : ""}> Labels (off: names show for the selected node and its connections)</label>
          <label class="gs-check"><input type="checkbox" data-gs-check="orphans"${state.cfg.orphans ? " checked" : ""}> Orphans (nodes with no visible links)</label>
        </fieldset>
        ${group("Forces")}
      </div>
      <button type="button" class="chip" id="gs-reset">Reset to defaults</button>`;
    const panel = document.getElementById("net-settings");
    panel.querySelectorAll("[data-gs]").forEach((inp) => inp.addEventListener("input", () => {
      const s = SLIDERS.find((x) => x.key === inp.dataset.gs);
      state.cfg[s.key] = Number(inp.value);
      document.getElementById("gs-out-" + s.key).textContent = s.fmt(state.cfg[s.key]);
      saveSettings();
      applySettings(s.group === "Forces" || s.key === "nodeScale");
    }));
    panel.querySelectorAll("[data-gs-check]").forEach((c) => c.addEventListener("change", (e) => {
      state.cfg[c.dataset.gsCheck] = e.target.checked; saveSettings(); applySettings(false);
    }));
    document.getElementById("gs-reset").addEventListener("click", () => {
      state.cfg = { ...state.defaults };
      saveSettings();
      const open = panel.open;
      settingsPanel();
      panel.open = open;
      applySettings(true);
    });
  }
  // Display settings restyle in place; force settings (and node size, which changes collisions) re-run the layout.
  function applySettings(relayout) {
    if (!state.node) { intro(); return; }
    state.node.attr("r", radius);
    state.labels.attr("font-size", (d) => (d.kind === "company" ? state.cfg.textSize + 2 : state.cfg.textSize)).attr("dx", (d) => radius(d) + 4);
    state.linkSel.attr("stroke-width", (l) => (l.relation === "lead filer" ? 1.4 : 1) * state.cfg.linkScale);
    if (!relayout) declutter();
    applyStyles();
    intro();
    if (state.view === "list") drawList();
    if (!relayout) return;
    const sim = state.sim;
    sim.force("charge").strength((d) => (d.kind === "company" ? -420 : -110) * state.cfg.repel);
    sim.force("link").strength(state.cfg.linkStrength).distance((l) => linkBase(l) * state.cfg.linkDist);
    sim.force("collide").radius((d) => radius(d) + 3);
    sim.force("x").strength(state.cfg.center);
    sim.force("y").strength(state.cfg.center * 1.25);
    sim.force("gx").strength(state.cfg.group);
    sim.force("gy").strength(state.cfg.group * 0.8);
    drawAxis();
    if (REDUCED_MOTION) { sim.alpha(1).stop(); sim.tick(300); state.draw(); } else sim.alpha(0.6).restart();
  }
  const linkBase = (l) => (l.relation === "member of" ? 90 : l.relation === "proposal at" ? 55 : l.relation === "works at" ? 22 : 45);
  const endId = (x) => (typeof x === "object" ? x.id : x);

  function shell(el) {
    el.innerHTML = `
      <h2>Co-filer network</h2>
      <fieldset class="lens-pick" id="net-lens"><legend>View as</legend>${Object.entries(window.LENSES || {}).map(([id, l]) =>
        `<label class="chip"><input type="radio" name="net-lens" value="${esc(id)}"${id === state.lens ? " checked" : ""}> ${esc(l.label)}</label>`).join("")}</fieldset>
      <p class="intro" id="net-intro"></p>
      <p class="visually-hidden" id="net-lens-status" aria-live="polite"></p>
      <div class="net-controls">
        <input type="search" id="net-search" placeholder="Search an organization or company" aria-label="Search the network">
        <select id="net-topic" aria-label="Filter by topic"><option value="">All topics</option></select>
        <select id="net-year" aria-label="Filter by year"><option value="">All years</option></select>
        <div class="seg" role="group" aria-label="View">
          <button type="button" data-view="graph" aria-pressed="true">Graph</button>
          <button type="button" data-view="list" aria-pressed="false">List</button>
        </div>
      </div>
      <div id="net-legend" class="net-legend"></div>
      <details id="net-settings" class="graph-settings"></details>
      <div class="net-body">
        <div class="net-graph-wrap">
          <div id="net-graph" class="net-graph" tabindex="0" role="application" aria-roledescription="network graph" aria-describedby="net-kb-hint" aria-label="Co-filer network graph. Up and Down arrows move between nodes, Enter opens one, Escape clears. The List view has the same data as a table."></div>
          <p class="kb-hint" id="net-kb-hint">Keyboard: Tab into the graph, ↑ ↓ to move between nodes, Enter to open, Esc to clear.</p>
          <p class="visually-hidden" id="net-kb" aria-live="polite"></p>
        </div>
        <div id="net-list" class="net-list" hidden></div>
        <aside id="net-panel" class="net-panel" aria-label="Selected node"><p class="status-note">Select a node for its connections and sources.</p></aside>
      </div>`;
  }

  function legend(data) {
    const kinds = [...new Set(data.nodes.map((n) => n.kind))];
    const order = Object.keys(TYPE_LABEL);
    kinds.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    document.getElementById("net-legend").innerHTML = kinds.map((k) =>
      `<button type="button" class="leg" data-kind="${esc(k)}" aria-pressed="${!state.hiddenKinds.has(k)}"><span class="dot" style="background:${nodeColor(k)}"></span>${esc(TYPE_LABEL[k])}</button>`).join("");
  }

  // One plain line: how much is shown, and what node size means. Recomputed when layers change.
  function intro() {
    refreshConnected();
    const shown = state.data.nodes.filter(visible).length;
    document.getElementById("net-intro").textContent = `${shown} of ${state.data.nodes.length} nodes shown. Node size = ${lens().sizeLabel}. Company tiers are this site's reading of each company's main role in the AI value chain.`;
  }

  function neighbors(id) {
    const s = new Set([id]);
    state.data.links.forEach((l) => {
      if (l.source.id === id) s.add(l.target.id);
      if (l.target.id === id) s.add(l.source.id);
    });
    return s;
  }

  function showPanel(n) {
    const rel = state.data.links.filter((l) => l.source.id === n.id || l.target.id === n.id).map((l) => {
      const other = l.source.id === n.id ? l.target : l.source;
      const dir = l.source.id === n.id ? l.relation : `${l.relation} (from)`;
      const c = conf(l);
      return `<li><button type="button" class="linklike" data-id="${esc(other.id)}">${esc(other.label)}</button> <span class="ticker">${esc(dir)}</span> <span class="conf conf-${c.level}">· ${c.level === "inferred" ? "no source, " + esc(c.text) : "source: " + esc(c.text)}</span>${l.source_url ? " " + link(l.source_url) : ""}</li>`;
    }).join("");
    // "What you can do": from the active lens; left out when the lens has nothing for this node.
    const acts = actions(n);
    const actHtml = acts.length ? `<section class="net-actions" aria-labelledby="net-actions-h"><h4 id="net-actions-h">${esc(lens().actionsHeading || "What you can do")}</h4><ul>${acts.map((a, i) => `<li>${actionHtml(a, n.id, i)}</li>`).join("")}</ul></section>` : "";
    const ringHtml = rings(n).map((r) => `<p class="ring-note ring-${esc(r.kind)}">${esc(r.text)}</p>`).join("");
    let facts = "";
    if (n.kind === "proposal") {
      facts = `<p><strong>Status:</strong> ${esc(n.status)}${n.support_pct != null ? ` · <strong>Support:</strong> ${esc(n.support_pct)}%` : ""}</p>
               <p><strong>Topic:</strong> ${esc(n.topic)} ${link(n.source_url, "filing")}</p>`;
    } else if (n.kind === "person") {
      facts = `<p>${esc(n.title)}, ${esc(n.org_name)}</p>${n.ai_focus ? `<p><strong>AI work:</strong> ${esc(n.ai_focus)}</p>` : ""}<p>${link(n.profile_url, "public profile")}</p>`;
    } else if (["policy", "response", "public", "lab"].includes(n.kind)) {
      facts = `${n.date ? `<p class="ticker">${esc(n.date)}${n.actor ? " · " + esc(n.actor) : ""}</p>` : ""}<p>${esc(n.description || "")} ${link(n.source_url)}</p>`;
    } else if (n.kind === "company") {
      facts = `<p>${esc(n.degree)} connections in this map.</p>`;
    } else {
      facts = `<p>${esc(n.description || "")} ${link(n.source_url)}</p>${n.website ? `<p><a href="${esc(n.website)}" target="_blank" rel="noopener">Website</a></p>` : ""}`;
    }
    document.getElementById("net-panel").innerHTML = `
      ${actHtml}
      <p class="eyebrow" style="margin:0 0 4px">${esc(TYPE_LABEL[n.kind])}</p>
      <h3>${esc(n.label)}</h3>${ringHtml}${facts}
      <h4 style="margin:14px 0 4px;font-size:14px">Connections</h4><ul class="conn">${rel || "<li>None yet</li>"}</ul>`;
    document.querySelectorAll("#net-panel .linklike").forEach((b) => b.addEventListener("click", () => focus(b.dataset.id)));
    wireActions(document.getElementById("net-panel"));
  }

  // One action item: its text, its links and, for a button, a real control (panel and List view alike).
  function actionHtml(a, id, i) {
    const lk = (href, label) => ` <a class="src" href="${esc(href)}" target="_blank" rel="noopener">[${esc(label)}]</a>`;
    return `${a.text ? esc(a.text) : ""}${a.href ? lk(a.href, a.hrefLabel || "source") : ""}${a.links && a.links.length ? `<ul class="act-links">${a.links.map((l) => `<li>${lk(l.href, l.label)}</li>`).join("")}</ul>` : ""}${a.button ? `<button type="button" class="chip" data-act-node="${esc(id)}" data-act="${i}">${esc(a.button.label)}</button>` : ""}`;
  }
  function wireActions(root) {
    root.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => {
      const a = actions(state.byId.get(b.dataset.actNode))[Number(b.dataset.act)];
      if (a && a.button) a.button.run();
    }));
  }

  function focus(id) {
    const n = state.data.nodes.find((x) => x.id === id);
    if (!n) return;
    // A node in a hidden layer can't be shown, so switch its layer on first.
    if (state.hiddenKinds.has(n.kind)) {
      state.hiddenKinds.delete(n.kind);
      const b = document.querySelector(`#net-legend .leg[data-kind="${n.kind}"]`);
      if (b) b.setAttribute("aria-pressed", "true");
      intro();
      regroup();
    }
    state.selected = id;
    showPanel(n);
    applyStyles();
    if (state.zoom && n.x != null) {
      const { width, height } = state.size;
      state.svg.transition().duration(REDUCED_MOTION ? 0 : 500).call(state.zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(1.6).translate(-n.x, -n.y));
    }
  }

  function baseVisible(n) {
    if (state.hiddenKinds.has(n.kind)) return false;
    if (n.kind === "proposal") {
      if (state.topic && n.topic !== state.topic) return false;
      if (state.year && String(n.year) !== state.year) return false;
    }
    return true;
  }
  // With "Orphans" off, a node shows only if at least one of its links has both ends shown.
  function refreshConnected() {
    const byId = state.byId;
    state.connected = new Set();
    state.data.links.forEach((l) => {
      const a = byId.get(endId(l.source)), b = byId.get(endId(l.target));
      if (a && b && baseVisible(a) && baseVisible(b)) { state.connected.add(a.id); state.connected.add(b.id); }
    });
  }
  function visible(n) {
    return baseVisible(n) && (state.cfg.orphans || state.connected.has(n.id));
  }

  // Default labels: companies, labs (all tiers) and nodes at or above the label threshold.
  const isCompanyKind = (k) => k === "company" || k === "lab" || String(k).startsWith("tier-");
  const labelCandidate = (d) => isCompanyKind(d.kind) || (d.degree || 0) >= state.cfg.labelMin;
  // Hide default labels that would print over a higher-priority one (companies and labs first, then by
  // connections). Hovering or selecting a node still shows its label.
  function declutter() {
    state.hiddenLabels = new Set();
    if (!state.labels) return;
    const kept = [];
    const items = [];
    state.labels.each(function (d) { if (visible(d) && labelCandidate(d)) items.push({ d, el: this }); });
    items.sort((a, b) => (isCompanyKind(b.d.kind) - isCompanyKind(a.d.kind)) || (b.d.degree || 0) - (a.d.degree || 0));
    for (const { d, el } of items) {
      const b = el.getBBox();
      if (kept.some((k) => b.x < k.x + k.width + 2 && k.x < b.x + b.width + 2 && b.y < k.y + k.height && k.y < b.y + b.height)) state.hiddenLabels.add(d.id);
      else kept.push(b);
    }
  }

  function applyStyles() {
    refreshConnected();
    const focusId = state.hover || state.selected;
    const near = focusId ? neighbors(focusId) : null;
    const q = state.query;
    state.node.attr("display", (d) => (visible(d) ? null : "none"))
      .attr("opacity", (d) => {
        if (q) return d.label.toLowerCase().includes(q) ? 1 : 0.12;
        return near && !near.has(d.id) ? 0.12 : 1;
      })
      .attr("stroke", (d) => (d.id === state.selected ? cssVar("--g-focus") : cssVar("--g-bg")))
      .attr("stroke-width", (d) => (d.id === state.selected ? 2.5 : 1));
    if (state.ringSel) state.ringSel.attr("display", (d) => (visible(d) ? null : "none"));
    state.linkSel.attr("display", (l) => (visible(l.source) && visible(l.target) ? null : "none"))
      .attr("stroke-opacity", (l) => (near ? (l.source.id === focusId || l.target.id === focusId ? 0.9 : 0.04) : q ? 0.08 : 0.45));
    state.labels.attr("display", (d) => (visible(d) ? null : "none"))
      .attr("opacity", (d) => {
        if (q) return d.label.toLowerCase().includes(q) ? 1 : 0;
        if (near) return near.has(d.id) ? 1 : 0;
        // Labels are off by default; selecting a node (or hovering, or keyboard focus) names it and its connections.
        return state.cfg.labels && labelCandidate(d) && !state.hiddenLabels.has(d.id) ? 1 : 0;
      });
  }

  function drawRings() {
    if (!state.ringLayer) return;
    state.ringLayer.selectAll("*").remove();
    state.ringSel = state.ringLayer.selectAll("circle").data(state.data.nodes.filter((n) => rings(n).length)).join("circle")
      .attr("r", (d) => radius(d) + 4).attr("fill", "none").attr("stroke", cssVar("--g-ring")).attr("stroke-width", 1.5).attr("stroke-dasharray", "4 2")
      .attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  }
  function placeFocusMark() {
    if (!state.focusMark) return;
    const n = state.kbId && state.byId.get(state.kbId);
    if (!n || !visible(n) || n.x == null) { state.focusMark.attr("display", "none"); return; }
    const r = radius(n);
    state.focusMark.attr("display", null);
    state.focusMark.select(".fm-gap").attr("cx", n.x).attr("cy", n.y).attr("r", r + 2.5);
    state.focusMark.select(".fm-ring").attr("cx", n.x).attr("cy", n.y).attr("r", r + 4.5);
  }

  // ---------- Keyboard: the graph is one tab stop; Up/Down step through visible nodes ----------
  // Order: companies and labs first, then by number of connections, then by name.
  function kbOrder() {
    return state.data.nodes.filter(visible)
      .sort((a, b) => (isCompanyKind(b.kind) - isCompanyKind(a.kind)) || (b.degree || 0) - (a.degree || 0) || a.label.localeCompare(b.label));
  }
  const say = (t) => { const el = document.getElementById("net-kb"); if (el) el.textContent = t; };
  function kbMove(step) {
    const list = kbOrder();
    if (!list.length) return;
    let i = list.findIndex((n) => n.id === state.kbId);
    i = i < 0 ? (step > 0 ? 0 : list.length - 1) : (i + step + list.length) % list.length;
    const n = list[i];
    state.kbId = n.id;
    state.hover = n.id;
    applyStyles();
    placeFocusMark();
    const ring = rings(n).map((r) => r.text.toLowerCase()).join(", ");
    say(`${i + 1} of ${list.length}: ${n.label}, ${TYPE_LABEL[n.kind]}, ${n.degree || 0} connections${ring ? ", " + ring : ""}`);
    panTo(n, false);
  }
  // Bring a node into view at the current zoom; jumps with no animation under reduced motion.
  function panTo(n, zoomIn) {
    if (!state.zoom || n.x == null) return;
    const { width, height } = state.size;
    const k = zoomIn ? 1.6 : d3.zoomTransform(state.svg.node()).k;
    state.svg.transition().duration(REDUCED_MOTION ? 0 : 300).call(state.zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(k).translate(-n.x, -n.y));
  }
  function wireKeys() {
    const el = document.getElementById("net-graph");
    el.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); kbMove(1); }
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); kbMove(-1); }
      else if (e.key === "Home") { e.preventDefault(); state.kbId = null; kbMove(1); }
      else if (e.key === "End") { e.preventDefault(); state.kbId = null; kbMove(-1); }
      else if (e.key === "Enter" || e.key === " ") {
        const n = state.kbId && state.byId.get(state.kbId);
        if (!n) return;
        e.preventDefault();
        state.selected = n.id; showPanel(n); applyStyles();
        say(`Opened ${n.label}. Details are in the node panel.`);
      } else if (e.key === "Escape") {
        state.selected = null; state.hover = null; state.kbId = null;
        applyStyles(); placeFocusMark();
        document.getElementById("net-panel").innerHTML = `<p class="status-note">Select a node for its connections and sources.</p>`;
        say("Selection cleared");
      }
    });
    el.addEventListener("blur", () => { if (state.kbId) { state.hover = null; applyStyles(); } });
  }

  function drawGraph() {
    const el = document.getElementById("net-graph");
    el.innerHTML = "";
    const width = el.clientWidth || 800;
    const height = el.clientHeight || 560;
    state.size = { width, height };
    state.cols = activeColumns();
    const data = state.data;

    const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, width, height]).attr("width", width).attr("height", height);
    const g = svg.append("g");
    state.svg = svg;
    state.zoom = d3.zoom().scaleExtent([0.2, 5]).on("zoom", (ev) => g.attr("transform", ev.transform));
    svg.call(state.zoom).on("dblclick.zoom", null);
    svg.on("click", (ev) => { if (ev.target.tagName === "svg") { state.selected = null; applyStyles(); } });

    const sim = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d) => d.id).distance((l) => linkBase(l) * state.cfg.linkDist).strength(state.cfg.linkStrength))
      .force("charge", d3.forceManyBody().strength((d) => (d.kind === "company" ? -420 : -110) * state.cfg.repel))
      .force("collide", d3.forceCollide().radius((d) => radius(d) + 3))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(state.cfg.center))
      .force("y", d3.forceY(height / 2).strength(state.cfg.center * 1.25))
      .force("gx", d3.forceX((d) => groupX(d) * width).strength(state.cfg.group))
      .force("gy", d3.forceY((d) => groupY(d) * height).strength(state.cfg.group * 0.8));
    state.sim = sim;
    // Column labels for the grouped layout; they move and zoom with the graph.
    state.axis = g.append("g").attr("font-size", 11).attr("font-weight", 600).attr("fill", cssVar("--g-label-soft"))
      .attr("display", state.cfg.group > 0 ? null : "none");
    drawAxis();
    state.linkSel = g.append("g").attr("stroke", cssVar("--g-link")).attr("fill", "none").selectAll("path").data(data.links).join("path")
      .attr("stroke-width", (l) => (l.relation === "lead filer" ? 1.4 : 1) * state.cfg.linkScale)
      // Membership links are dashed; links with no source (inferred) are dotted, so the two never look alike.
      .attr("stroke-dasharray", (l) => (conf(l).level === "inferred" ? "1 3" : l.relation === "member of" ? "3 3" : null));

    state.node = g.append("g").selectAll("circle").data(data.nodes).join("circle")
      .attr("r", radius)
      .attr("fill", (d) => nodeColor(d.kind))
      .attr("stroke", cssVar("--g-bg"))
      .style("cursor", "pointer")
      .on("mouseenter", (ev, d) => { state.hover = d.id; applyStyles(); })
      .on("mouseleave", () => { state.hover = null; applyStyles(); })
      .on("click", (ev, d) => { ev.stopPropagation(); state.selected = d.id; showPanel(d); applyStyles(); say(`Opened ${d.label}. Details are in the node panel.`); })
      .call(d3.drag()
        .on("start", (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on("end", (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));
    state.node.append("title").text((d) => d.label);
    // Lens rings (dashed, accent) and the keyboard focus mark (solid ink ring with a white gap) sit on top.
    state.ringLayer = g.append("g").attr("pointer-events", "none");
    state.focusMark = g.append("g").attr("pointer-events", "none").attr("display", "none");
    state.focusMark.append("circle").attr("class", "fm-gap").attr("fill", "none").attr("stroke", cssVar("--g-bg")).attr("stroke-width", 3);
    state.focusMark.append("circle").attr("class", "fm-ring").attr("fill", "none").attr("stroke", cssVar("--g-focus")).attr("stroke-width", 2);
    drawRings();

    state.labels = g.append("g").selectAll("text").data(data.nodes).join("text")
      .text((d) => (d.label.length > 42 ? d.label.slice(0, 40) + "…" : d.label))
      .attr("font-size", (d) => (d.kind === "company" ? state.cfg.textSize + 2 : state.cfg.textSize))
      .attr("font-weight", (d) => (d.kind === "company" ? 600 : 400))
      .attr("fill", cssVar("--g-label"))
      .attr("pointer-events", "none")
      .attr("dx", (d) => radius(d) + 4).attr("dy", 4);

    // Keep every node inside the box (below the column headers), and anchor right-hand labels leftwards.
    const draw = () => {
      data.nodes.forEach((d) => {
        const r = radius(d) + 2;
        d.x = Math.max(r, Math.min(width - r, d.x));
        d.y = Math.max(r + 22, Math.min(height - r, d.y));
      });
      state.linkSel.attr("d", arc);
      state.node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      if (state.ringSel) state.ringSel.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      placeFocusMark();
      state.labels.attr("x", (d) => d.x).attr("y", (d) => d.y)
        .attr("text-anchor", (d) => (d.x > width * 0.72 ? "end" : "start"))
        .attr("dx", (d) => (d.x > width * 0.72 ? -(radius(d) + 4) : radius(d) + 4));
    };
    state.draw = draw;
    sim.on("tick", draw);
    sim.on("end", () => { declutter(); applyStyles(); });
    if (REDUCED_MOTION) { sim.stop(); sim.tick(300); draw(); declutter(); }
    applyStyles();
  }

  // Text equivalent of the graph: every visible node, with the lens's status and actions.
  function drawList() {
    const dir = state.listSort || "descending";
    const m = lens().measure;
    const val = (n) => (m ? m.value(n, state.ctx) : n.degree || 0);
    const rows = state.data.nodes.filter(visible)
      .filter((n) => !state.query || n.label.toLowerCase().includes(state.query))
      .sort((a, b) => ((dir === "descending" ? -1 : 1) * ((val(a) ?? -1) - (val(b) ?? -1))) || a.label.localeCompare(b.label));
    const body = rows.map((n) => {
      const acts = actions(n).map((x, i) => actionHtml(x, n.id, i));
      return `<tr><td><button type="button" class="linklike" data-id="${esc(n.id)}">${esc(n.label)}</button></td><td>${esc(TYPE_LABEL[n.kind])}</td>${m ? `<td class="num">${val(n) ?? "–"}</td>` : ""}<td class="num">${n.degree || 0}</td><td>${esc(rings(n).map((r) => r.text).join(", "))}</td><td>${acts.join("<br>")}</td></tr>`;
    }).join("");
    const el = document.getElementById("net-list");
    const sortLabel = m ? m.label : "Connections";
    if (!document.getElementById("net-list-count")) el.innerHTML = `<p class="count-line" id="net-list-count" aria-live="polite"></p><div id="net-list-table"></div>`;
    document.getElementById("net-list-table").innerHTML = `<div class="table-wrap"><table><thead><tr><th scope="col">Name</th><th scope="col">Type</th>
      ${m ? `<th scope="col" aria-sort="${dir}"><button type="button" class="th-sort" id="net-list-sort">${esc(sortLabel)} ${dir === "descending" ? "↓" : "↑"}</button></th><th scope="col">Connections</th>`
        : `<th scope="col" aria-sort="${dir}"><button type="button" class="th-sort" id="net-list-sort">Connections ${dir === "descending" ? "↓" : "↑"}</button></th>`}
      <th scope="col">Status</th><th scope="col">${esc(lens().actionsHeading || "What you can do")}</th></tr></thead>
      <tbody>${body || `<tr><td colspan="${m ? 6 : 5}">No matches.</td></tr>`}</tbody></table></div>`;
    document.getElementById("net-list-count").textContent = `${rows.length} nodes in this view (${lens().label}), sorted by ${sortLabel.toLowerCase()}.`;
    document.getElementById("net-list-sort").addEventListener("click", () => {
      state.listSort = dir === "descending" ? "ascending" : "descending";
      drawList();
      document.getElementById("net-list-sort").focus();
    });
    el.querySelectorAll(".linklike").forEach((b) => b.addEventListener("click", () => {
      const n = state.byId.get(b.dataset.id);
      state.selected = n.id; showPanel(n);
    }));
    wireActions(el);
  }

  // Switching lens applies that lens's defaults: layers, orphans; topic and year reset.
  function setLens(id, announce) {
    state.lens = id;
    const d = lens().defaults || {};
    state.hiddenKinds = new Set(d.hiddenKinds || []);
    state.topic = ""; state.year = "";
    ["net-topic", "net-year"].forEach((x) => { const s = document.getElementById(x); if (s) s.value = ""; });
    if (d.orphans != null) {
      state.cfg.orphans = d.orphans;
      const c = document.querySelector("[data-gs-check=orphans]");
      if (c) c.checked = d.orphans;
    }
    document.querySelectorAll("#net-legend .leg").forEach((b) => b.setAttribute("aria-pressed", String(!state.hiddenKinds.has(b.dataset.kind))));
    saveLens(id);
    drawRings();
    applySettings(true);
    regroup();
    if (state.selected) showPanel(state.byId.get(state.selected));
    if (announce) {
      refreshConnected();
      const hidden = [...new Set([...state.hiddenKinds].map((k) => (FILER_ROWS.includes(k) ? "filers" : { person: "people", policy: "policy", response: "responses", public: "public engagement" }[k] || TYPE_LABEL[k])))];
      const shown = state.data.nodes.filter(visible).length;
      document.getElementById("net-lens-status").textContent = `${lens().label} view${hidden.length ? ": " + hidden.join(", ") + " hidden" : ""}. ${shown} of ${state.data.nodes.length} nodes shown.`;
    }
  }

  function wire() {
    const topics = [...new Set(state.data.nodes.filter((n) => n.kind === "proposal").map((n) => n.topic).filter(Boolean))].sort();
    const years = [...new Set(state.data.nodes.filter((n) => n.kind === "proposal").map((n) => String(n.year)))].sort();
    document.getElementById("net-topic").insertAdjacentHTML("beforeend", topics.map((t) => `<option>${esc(t)}</option>`).join(""));
    document.getElementById("net-year").insertAdjacentHTML("beforeend", years.map((t) => `<option>${esc(t)}</option>`).join(""));
    const refresh = () => { applyStyles(); intro(); if (state.view === "list") drawList(); };
    document.getElementById("net-search").addEventListener("input", (e) => {
      state.query = e.target.value.trim().toLowerCase(); refresh();
      const hit = state.query && state.data.nodes.find((n) => n.kind !== "proposal" && n.label.toLowerCase().includes(state.query));
      if (hit && state.view === "graph") { state.selected = hit.id; showPanel(hit); }
    });
    document.getElementById("net-topic").addEventListener("change", (e) => { state.topic = e.target.value; refresh(); });
    document.getElementById("net-year").addEventListener("change", (e) => { state.year = e.target.value; refresh(); });
    document.querySelectorAll("#net-legend .leg").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.kind;
      if (state.hiddenKinds.has(k)) state.hiddenKinds.delete(k); else state.hiddenKinds.add(k);
      b.setAttribute("aria-pressed", String(!state.hiddenKinds.has(k)));
      refresh();
      regroup();
    }));
    document.querySelectorAll("#net-lens input").forEach((r) => r.addEventListener("change", () => { if (r.checked) setLens(r.value, true); }));
    wireKeys();
    document.querySelectorAll("#tab-network .seg button").forEach((b) => b.addEventListener("click", () => {
      state.view = b.dataset.view;
      document.querySelectorAll("#tab-network .seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      document.querySelector("#tab-network .net-graph-wrap").hidden = state.view !== "graph";
      document.getElementById("net-list").hidden = state.view !== "list";
      if (state.view === "list") drawList();
    }));
  }

  window.focusNetworkNode = (id) => focus(id);
  window.renderNetwork = function (raw, people) {
    const el = document.getElementById("tab-network");
    if (typeof d3 === "undefined") {
      el.innerHTML = `<h2>Co-filer network</h2><div id="net-graph"></div>`;
      document.getElementById("net-graph").innerHTML = `<p class="coming">The graph library did not load. Try reloading the page.</p>`;
      return;
    }
    // Default view: filers, companies, proposals, labs and coalitions. People, policy, responses
    // and public engagement have their own tabs, so their layers start off (one click in the legend).
    const data = raw && raw.nodes ? buildFromGraph(raw) : build(raw, people);
    const FILER_KINDS = ["impact/ESG asset manager", "advocacy nonprofit", "faith-based investor", "public pension", "labor fund", "foundation", "coalition", "other"];
    const topFilers = new Set(data.nodes.filter((n) => FILER_KINDS.includes(n.kind)).sort((a, b) => (b.degree || 0) - (a.degree || 0)).slice(0, 12).map((n) => n.id));
    // Default label threshold: the 12th-highest filer's connection count, so about a dozen filers are named.
    const twelfth = data.nodes.find((n) => n.id === [...topFilers].at(-1));
    const defaults = { ...DEFAULTS, labelMin: twelfth ? twelfth.degree || 0 : 0 };
    state = { data, byId: new Map(data.nodes.map((n) => [n.id, n])), defaults, cfg: loadSettings(defaults), hiddenKinds: new Set(["person", "policy", "response", "public"]), hiddenLabels: new Set(), query: "", topic: "", year: "", view: "graph", selected: null, hover: null, kbId: null };
    state.lens = initialLens();
    state.hiddenKinds = new Set(lens().defaults.hiddenKinds || [...state.hiddenKinds]);
    // Shared inputs for lens functions (lenses.js). app.js supplies upcoming meetings and Company lookup.
    const app = window.LENS_CTX || {};
    state.ctx = { nodes: data.nodes, links: data.links, byId: state.byId, cache: {},
      upcoming: new Map(((app.upcoming || [])).map((m) => [m.ticker, m])),
      hasCompany: app.hasCompany || (() => false), openCompany: app.openCompany || (() => {}) };
    shell(el);
    refreshConnected();
    settingsPanel();
    legend(state.data);
    intro();
    wire();
    // The graph needs a visible container to measure, so draw it the first time its tab opens.
    const draw = () => { if (!state.drawn && !el.hidden) { state.drawn = true; drawGraph(); } };
    new MutationObserver(draw).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    draw();
    let t;
    window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { if (state.drawn && !el.hidden) { state.sim.stop(); drawGraph(); } }, 250); });
  };
})();

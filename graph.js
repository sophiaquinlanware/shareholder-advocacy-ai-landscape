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
    gap: "Topic not filed (this dataset)",
    ask: "Recurring ask",
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
    gap: "--n-gap",
    ask: "--n-ask",
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
      return { ...n, kind, ev_kind: n.kind, label: n.label };
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
    if (n.kind === "gap") return 6;
    if (n.kind === "ask") return 8;
    return 6 + Math.min(10, Math.sqrt(n.degree) * 2.4);
  }
  const radius = (n) => {
    const r = state.ctx ? lens().size(n, state.ctx) : null;
    return (r == null ? baseRadius(n) : r) * state.cfg.nodeScale;
  };

  // ---------- Graph settings (like Obsidian's graph view): display, filters and forces ----------
  // Kept per viewer in localStorage; the page works the same without it.
  const SETTINGS_KEY = "net-settings-v1";
  const DEFAULTS = { textSize: 11, labelMin: 0, nodeScale: 1, linkScale: 1, labels: false, pulse: true, catColor: false, orphans: true, center: 0.05, repel: 1, linkStrength: 0.6, linkDist: 1, group: 0.5 };

  // ---------- Grouped layout: a 2D frame so each kind of node has its own region ----------
  // Left to right follows the filing chain: people → filer organizations → proposals → companies → labs.
  // Filer types each get a horizontal band; policy, responses and public engagement sit in a top band.
  const FILER_ROWS = ["impact/ESG asset manager", "advocacy nonprofit", "faith-based investor", "public pension", "labor fund", "foundation", "coalition", "other"];
  const COLUMNS = [
    { x: 0.06, label: "People", kinds: ["person"] },
    { x: 0.25, label: "Filers", kinds: FILER_ROWS },
    { x: 0.5, label: "Proposals", kinds: ["proposal"] },
    { x: 0.62, label: "Asks", kinds: ["ask"] },
    { x: 0.73, label: "Value chain, by tier", kinds: ["company", ...TIERS.filter((t) => t.id !== "labs").map((t) => "tier-" + t.id)] },
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
    // A "topic not filed" node sits just left of its company.
    if (d.kind === "gap") { const c = state.byId.get(d.gapFor); return c ? groupX(c) - 0.09 : 0.6; }
    const col = (state.cols || COLUMNS).find((c) => c.kinds.includes(d.kind));
    return col ? col.x : 0.5;
  };
  // Column headers (short on phones), drawn on top on an opaque strip that nodes can't enter (they're held
  // below HEADER_H). The filer-type row labels were dropped (owner, 2026-11-26): the colour key names the
  // types, and nodes spill across the bands, so row labels pointed at the wrong nodes.
  const HEADER_H = 26;
  function drawAxis() {
    if (!state.axis) return;
    const { width, height } = state.size;
    const narrow = width < 640;
    const SHORT = { People: "People", Filers: "Filers", Proposals: "Proposals", Asks: "Asks", "Value chain, by tier": "Value chain", "Frontier labs": "Labs" };
    state.cols = activeColumns();
    state.axis.selectAll("*").remove();
    state.axis.append("rect").attr("x", -width).attr("y", -height).attr("width", width * 3).attr("height", height + HEADER_H).attr("fill", cssVar("--g-bg"));
    state.axis.selectAll("text.col").data(state.cols).join("text").attr("class", "col")
      .attr("x", (c) => c.x * width).attr("y", 14).attr("text-anchor", "middle").attr("font-size", narrow ? 9.5 : 11)
      .text((c) => (narrow ? SHORT[c.label] || c.label : c.label).toUpperCase());
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
    // Policymaker lens: each ask has its own row, and its proposals sit beside it.
    if (state.askY && d.kind === "ask") return state.askY.get(d.id) ?? 0.55;
    if (state.askY && d.kind === "proposal" && state.askY.has(d.ask_id)) return state.askY.get(d.ask_id);
    if (d.kind === "gap") { const c = state.byId.get(d.gapFor); return c ? groupY(c) : 0.55; }
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
          ${catList().length ? `<label class="gs-check"><input type="checkbox" data-gs-check="catColor"${state.cfg.catColor ? " checked" : ""}> Colour proposals by what they ask about</label>` : ""}
          <label class="gs-check"><input type="checkbox" data-gs-check="pulse"${state.cfg.pulse ? " checked" : ""}> Pulse deadline rings (twice, then still; off with reduced motion)</label>
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
    catKey();
    if (!state.node) { intro(); return; }
    state.node.attr("r", radius).attr("fill", fillOf);
    drawRings();
    state.labels.attr("font-size", (d) => (d.kind === "company" ? state.cfg.textSize + 2 : state.cfg.textSize));
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
      <p class="visually-hidden" id="net-lens-status" aria-live="polite"></p>
      <section id="net-feed" class="net-feed" aria-labelledby="lf-h" hidden></section>
      <div id="net-graph-area">
      <button type="button" class="chip" id="lf-back" hidden>Back to the list</button>
      <p class="intro" id="net-intro"></p>
      <div class="net-controls">
        <input type="search" id="net-search" placeholder="Search an organization or company" aria-label="Search the network">
        <select id="net-topic" aria-label="Filter by topic"><option value="">All topics</option></select>
        <select id="net-year" aria-label="Filter by year"><option value="">All years</option></select>
        <div class="seg" role="group" aria-label="View">
          <button type="button" data-view="graph" aria-pressed="true">Graph</button>
          <button type="button" data-view="list" aria-pressed="false">List</button>
        </div>
      </div>
      <div class="net-tools">
        <button type="button" class="chip" id="net-hold-btn" aria-expanded="false" aria-controls="net-hold">My holdings</button>
        <button type="button" class="chip" id="net-gaps" aria-pressed="false">Show topics not filed</button>
      </div>
      <div id="net-hold" class="net-hold" hidden>
        <label for="net-hold-input">Tickers, separated by commas, spaces or new lines</label>
        <textarea id="net-hold-input" rows="3" spellcheck="false" autocapitalize="characters"></textarea>
        <div class="net-hold-row"><button type="button" class="chip" id="net-hold-apply">Apply</button> <button type="button" class="chip" id="net-hold-clear">Clear</button></div>
        <p class="status-note">Stored in this browser only; nothing is sent anywhere.</p>
      </div>
      <p class="count-line" id="net-hold-status" aria-live="polite"></p>
      <div id="net-legend" class="net-legend"></div>
      <div id="net-catkey" class="net-legend" hidden></div>
      <details id="net-settings" class="graph-settings"></details>
      <div class="net-body">
        <div class="net-graph-wrap">
          <div id="net-graph" class="net-graph" tabindex="0" role="application" aria-roledescription="network graph" aria-describedby="net-kb-hint" aria-label="Co-filer network graph. Up and Down arrows move between nodes, Enter opens one, Escape clears. The List view has the same data as a table."></div>
          <p class="kb-hint" id="net-kb-hint">Keyboard: Tab into the graph, ↑ ↓ to move between nodes, Enter to open, Esc to clear.</p>
          <p class="visually-hidden" id="net-kb" aria-live="polite"></p>
        </div>
        <div id="net-list" class="net-list" hidden></div>
        <aside id="net-panel" class="net-panel" aria-label="Selected node"><p class="status-note">Select a node for its connections and sources.</p></aside>
      </div>
      <div class="scrub" id="net-scrub">
        <label for="net-upto">Show the network up to <span id="net-upto-val"></span></label>
        <input type="range" id="net-upto" step="1">
        <button type="button" class="chip" id="net-play">Play</button>
        <p class="status-note" id="net-scrub-note"></p>
        <p class="visually-hidden" id="net-scrub-status" aria-live="polite"></p>
      </div>
      </div>`;
  }

  // ---------- Individual investor feed (lenses.js FEED): a list first, the graph on request ----------
  // view=feed|graph is kept in the URL (replaceState, like ?lens=). Only lenses with a feed have the list.
  const VIEW_KEY = "view";
  function urlView() {
    const v = new URLSearchParams(location.search).get(VIEW_KEY);
    return v === "graph" ? "graph" : "feed";
  }
  function saveView() {
    try {
      const u = new URL(location.href);
      if (lens().feed) u.searchParams.set(VIEW_KEY, state.feedView); else u.searchParams.delete(VIEW_KEY);
      window.history.replaceState(null, "", u.pathname + u.search + location.hash);
    } catch (e) {}
  }
  let termSeq = 0;
  // A term button; its definition is collected in defs and placed after the paragraph, so opening it never
  // splits a sentence. ctx names the item for repeated terms ("Proxy statement" in every item).
  function term(name, label, defs, ctx) {
    const def = (lens().feed && lens().feed.glossary[name]) || "";
    if (!def) return esc(label || name);
    const id = `term-${++termSeq}`;
    defs.push(`<p class="term-def" id="${id}" hidden><strong>${esc(name[0].toUpperCase() + name.slice(1))}:</strong> ${esc(def)}</p>`);
    return `<button type="button" class="term" aria-expanded="false" aria-controls="${id}">${esc(label || name)}${ctx ? `<span class="visually-hidden">, ${esc(ctx)}</span>` : ""}</button>`;
  }
  const longDate = (iso) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  function feedShell() {
    const F = lens().feed;
    const box = document.getElementById("net-feed");
    const d0 = [];
    const introP = `<p class="intro">Upcoming votes on AI-related ${term("shareholder proposal", "shareholder proposals", d0)} at the ${term("annual meeting", "annual meetings", d0)} of the companies this site tracks.</p>${d0.join("")}`;
    box.innerHTML = `
      <h3 id="lf-h">Upcoming AI proposals in this tracker</h3>
      ${introP}
      ${state.ctx.disclaimer ? `<p class="status-note">${esc(state.ctx.disclaimer)}</p>` : ""}
      <form role="search" id="lf-form" class="feed-form">
        <label for="lf-in">Your tickers or fund name</label>
        <div class="feed-row"><input id="lf-in" type="text" autocomplete="off" spellcheck="false" aria-describedby="lf-hint">
        <button type="submit" class="chip">Show</button></div>
        <p id="lf-hint" class="status-note">For example: MSFT, AAPL, Vanguard. Use stock tickers, not company names. Separate several with commas. Tickers entered here also set My holdings in the graph. Stored in this browser only.</p>
      </form>
      <p id="lf-status" class="count-line" aria-live="polite"></p>
      <button type="button" class="chip" id="lf-to-graph">See the bigger picture</button>
      <div id="lf-list"></div>`;
    let fund = "";
    try { fund = localStorage.getItem("fund") || ""; } catch (e) {}
    document.getElementById("lf-in").value = [...state.holdings, ...(fund ? [fund] : [])].join(", ");
    document.getElementById("lf-form").addEventListener("submit", (e) => { e.preventDefault(); feedApply(true); });
    document.getElementById("lf-to-graph").addEventListener("click", () => setFeedView("graph", true));
    // Click or tap pins a definition open or closed; hovering shows it until the pointer leaves both the
    // button and the definition (WCAG 1.4.13: dismissible with Esc, hoverable, persistent while pointed at).
    const setOpen = (b, open) => {
      b.setAttribute("aria-expanded", String(open));
      document.getElementById(b.getAttribute("aria-controls")).hidden = !open;
    };
    box.addEventListener("click", (e) => {
      const b = e.target.closest(".term");
      if (!b) return;
      const open = !(b.dataset.pinned === "1");
      b.dataset.pinned = open ? "1" : "";
      setOpen(b, open);
    });
    let hoverTimer;
    box.addEventListener("mouseover", (e) => {
      const b = e.target.closest(".term");
      const d = e.target.closest(".term-def");
      clearTimeout(hoverTimer);
      if (b && b.getAttribute("aria-expanded") !== "true") setOpen(b, true);
      if (d) clearTimeout(hoverTimer);
    });
    box.addEventListener("mouseout", (e) => {
      const from = e.target.closest(".term, .term-def");
      if (!from || (e.relatedTarget && from.contains(e.relatedTarget))) return;
      const b = from.classList.contains("term") ? from : box.querySelector(`.term[aria-controls="${from.id}"]`);
      if (!b || b.dataset.pinned === "1") return;
      hoverTimer = setTimeout(() => {
        const def = document.getElementById(b.getAttribute("aria-controls"));
        if (!b.matches(":hover") && !def.matches(":hover") && b.dataset.pinned !== "1") setOpen(b, false);
      }, 300);
    });
    box.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const b = e.target.closest(".term");
      if (!b || b.getAttribute("aria-expanded") !== "true") return;
      e.stopPropagation();
      b.dataset.pinned = "";
      setOpen(b, false);
      b.focus();
    });
    feedApply(false);
    if (F) document.getElementById("lf-status").setAttribute("data-ready", "1");
  }
  function feedApply(fromSubmit) {
    const F = lens().feed;
    if (!F) return;
    const m = F.match(state.ctx, document.getElementById("lf-in").value);
    if (fromSubmit) {
      state.holdings = new Set(m.tickers);
      saveHoldings();
      holdStatus();
      const hi = document.getElementById("net-hold-input");
      if (hi) hi.value = m.tickers.join(", ");
      try { if (m.family) localStorage.setItem("fund", m.family); else localStorage.removeItem("fund"); } catch (e) {}
    }
    const items = F.items(state.ctx, m.tickers);
    const quiet = F.quiet(state.ctx, m.tickers, items);
    const ctxName = (it) => `${it.company} ${it.p.year}: ${it.p.title}`;
    const fundHtml = (it) => {
      const f = F.fund(state.ctx, it.p, m.family);
      if (!f) return "";
      const links = f.links.map((l) => ` <a class="src" href="${esc(l.href)}" target="_blank" rel="noopener">[${esc(l.label)}<span class="visually-hidden">, ${esc(ctxName(it))}</span>]</a>`).join("");
      const d = [];
      return `<div class="feed-fund"><h5>${esc(f.heading)}</h5><p>${esc(f.text)}${links}</p>${f.detail ? `<p class="status-note">${esc(f.detail)}</p>` : ""}<p class="status-note">From ${term("Form N-PX", "Form N-PX", d, ctxName(it))} filings. ${esc(f.about)}</p>${d.join("")}</div>`;
    };
    const li = items.map((it) => { const d = []; return `<li class="feed-item">
        <h4>${esc(it.company)}</h4>
        <p class="feed-sum">${esc(it.summary)}${it.summarySource ? ` <a class="src" href="${esc(it.summarySource)}" target="_blank" rel="noopener">[source<span class="visually-hidden">, ${esc(ctxName(it))}</span>]</a>` : ""}</p>
        <p><time datetime="${esc(it.date)}">Annual meeting ${esc(longDate(it.date))}</time>${it.note ? `. Proxy note: “${esc(it.note)}”` : ""}</p>
        <p>${it.proxy ? `<a class="src" href="${esc(it.proxy)}" target="_blank" rel="noopener">Read the proxy statement<span class="visually-hidden"> for ${esc(ctxName(it))}</span></a>` : `Proxy statement: <span class="unverified">source pending</span>`} ${term("proxy statement", "What's a proxy statement?", d, ctxName(it))}${it.topic ? ` · Topic: ${esc(it.topic)}` : ""}</p>${d.join("")}
        ${fundHtml(it)}
      </li>`; }).join("");
    const ql = quiet.map((q) => `<li class="feed-item feed-quiet"><h4>${esc(q.name)}</h4><p>No upcoming AI proposals in this tracker for ${esc(q.name)}.</p>${q.deadline ? `<p>${esc(q.deadline)}${q.source ? ` <a class="src" href="${esc(q.source)}" target="_blank" rel="noopener">[source<span class="visually-hidden">, ${esc(q.name)} proxy statement</span>]</a>` : ` <span class="unverified">source pending</span>`}</p>` : ""}</li>`).join("");
    document.getElementById("lf-list").innerHTML = items.length || quiet.length ? `<ul class="feed-list">${li}${ql}</ul>` : `<p>No upcoming AI proposals in this tracker.</p>`;
    document.getElementById("lf-h").textContent = m.tickers.length ? "Upcoming AI proposals at your companies" : "Upcoming AI proposals in this tracker";
    const parts = [];
    parts.push(`Showing ${items.length} upcoming AI ${items.length === 1 ? "vote" : "votes"}${m.tickers.length ? ` for ${m.tickers.join(", ")}` : " in this tracker"}`);
    if (m.family) parts.push(`fund family: ${m.family}`);
    let line = parts.join("; ") + ".";
    if (m.familyNote) line += ` ${m.familyNote}`;
    if (m.extraFamilies.length) line += ` Only the first fund family is used; also matched: ${m.extraFamilies.join(", ")}.`;
    const nCos = (state.ctx.companies || []).filter((c) => c.ticker).length;
    const nFam = state.ctx.fv ? state.ctx.fv.families.length : 0;
    if (m.notFound.length) line += ` Not found among the ${nCos} tracked companies or the ${nFam} fund families with readable Form N-PX votes: ${m.notFound.join(", ")}.`;
    if (!m.tickers.length && m.family) line += " No tickers entered, so nothing is faded in the bigger picture.";
    document.getElementById("lf-status").textContent = line;
  }
  // Shows the feed or the graph area for the active lens; draws the graph the first time its area is visible.
  function setFeedView(v, moveFocus) {
    const hasFeed = !!lens().feed;
    state.feedView = hasFeed ? v : "graph";
    const feed = document.getElementById("net-feed");
    const area = document.getElementById("net-graph-area");
    feed.hidden = state.feedView !== "feed";
    area.hidden = state.feedView === "feed";
    document.getElementById("lf-back").hidden = !hasFeed;
    if (hasFeed && !feed.dataset.built) { feed.dataset.built = "1"; feedShell(); }
    saveView();
    ensureDrawn();
    if (hasFeed && moveFocus) {
      document.getElementById(state.feedView === "graph" ? "lf-back" : "lf-to-graph").focus();
      if (state.feedView === "graph" && state.node) applyStyles();
      const msg = state.feedView === "graph"
        ? `Showing the graph. ${state.holdings.size ? `Companies you entered (${[...state.holdings].join(", ")}) are at full strength; others are faded.` : "No tickers entered, so nothing is faded."}`
        : "Showing the list of upcoming AI proposals.";
      // After the focus move, so the focus change doesn't cut the message off.
      setTimeout(() => { document.getElementById("net-lens-status").textContent = msg; }, 150);
    }
  }
  function ensureDrawn() {
    const tab = document.getElementById("tab-network");
    const area = document.getElementById("net-graph-area");
    if (!tab || tab.hidden || area.hidden || typeof d3 === "undefined") return;
    const w = document.getElementById("net-graph").clientWidth;
    if (!state.drawn || (state.size && w && Math.abs(w - state.size.width) > 2)) {
      if (state.sim) state.sim.stop();
      state.drawn = true;
      drawGraph();
    }
  }

  // A lens can rename the key in plain words (lens.kindLabels); the facts and colours stay the same.
  const kindLabel = (k) => (lens().kindLabels && lens().kindLabels[k]) || TYPE_LABEL[k];
  function relabelLegend() {
    document.querySelectorAll("#net-legend .leg").forEach((b) => { const t = b.querySelector(".leg-text"); if (t) t.textContent = kindLabel(b.dataset.kind); });
  }
  // Proposal categories (asks.json), used when "Colour proposals by what they ask about" is on.
  const catList = () => ((window.LENS_CTX && window.LENS_CTX.categories) || []).filter((c) => state.data.nodes.some((n) => n.kind === "proposal" && n.category === c.id));
  function fillOf(d) {
    if (d.kind === "gap") return cssVar("--g-bg");
    if (d.kind === "proposal" && state.cfg.catColor && d.category) return cssVar(`--gn-cat-${d.category}`) || nodeColor(d.kind);
    return nodeColor(d.kind);
  }
  function catKey() {
    const el = document.getElementById("net-catkey");
    if (!el) return;
    const on = state.cfg.catColor && catList().length;
    el.hidden = !on;
    el.innerHTML = on ? `<span class="status-note">Proposals by what they ask about:</span> ${catList().map((c) => `<span class="leg static"><span class="dot" style="background:${cssVar(`--gn-cat-${c.id}`)}"></span>${esc(c.label)}</span>`).join("")}` : "";
  }
  function legend(data) {
    const kinds = [...new Set(data.nodes.map((n) => n.kind))];
    const order = Object.keys(TYPE_LABEL);
    kinds.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    document.getElementById("net-legend").innerHTML = kinds.map((k) =>
      `<button type="button" class="leg" data-kind="${esc(k)}" aria-pressed="${!state.hiddenKinds.has(k)}"><span class="dot" style="background:${nodeColor(k)}"></span><span class="leg-text">${esc(kindLabel(k))}</span></button>`).join("");
  }

  // One plain line: how much is shown, and what node size means. Recomputed when layers change.
  function intro() {
    refreshConnected();
    const shown = state.data.nodes.filter(visible).length;
    document.getElementById("net-intro").textContent = lens().plainIntro
      ? lens().plainIntro(shown, state.data.nodes.length)
      : `${shown} of ${state.data.nodes.length} nodes shown. Node size = ${lens().sizeLabel}. Company tiers are this site's reading of each company's main role in the AI value chain.`;
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
    if (state.path && state.path.from !== n.id) state.path = null;
    const rel = state.data.links.filter((l) => l.source.id === n.id || l.target.id === n.id).map((l) => {
      const other = l.source.id === n.id ? l.target : l.source;
      const rel = l.relation === "coverage" ? (l.coverage === "full" ? "covers (this site's reading)" : "partially covers (this site's reading)") : l.relation;
      const dir = l.source.id === n.id ? rel : `${rel} (from)`;
      const c = conf(l);
      if (l.relation === "missing") return `<li><button type="button" class="linklike" data-id="${esc(other.id)}">${esc(other.label)}</button> <span class="ticker">topic not filed</span> <span class="conf">· none in this dataset</span></li>`;
      return `<li><button type="button" class="linklike" data-id="${esc(other.id)}">${esc(other.label)}</button> <span class="ticker">${esc(dir)}</span> <span class="conf conf-${c.level}">· ${c.level === "inferred" ? "no source, " + esc(c.text) : "source: " + esc(c.text)}</span>${l.source_url ? " " + link(l.source_url) : ""}</li>`;
    }).join("");
    // "What you can do": from the active lens; left out when the lens has nothing for this node.
    const acts = actions(n);
    const actHtml = acts.length ? `<section class="net-actions" aria-labelledby="net-actions-h"><h4 id="net-actions-h">${esc((lens().actionsHeadingFor && lens().actionsHeadingFor(n)) || lens().actionsHeading || "What you can do")}</h4><ul>${acts.map((a, i) => `<li>${actionHtml(a, n.id, i)}</li>`).join("")}</ul></section>` : "";
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
    } else if (n.kind === "ask") {
      facts = `<p class="status-note">Grouped by this site from data/asks.json: proposals that make this ask, across companies and years.</p>`;
    } else if (n.kind === "gap") {
      facts = `<p class="status-note">Computed by this site from the proposals in this dataset; not a statement about filings outside it.</p>`;
    } else {
      facts = `<p>${esc(n.description || "")} ${link(n.source_url)}</p>${n.website ? `<p><a href="${esc(n.website)}" target="_blank" rel="noopener">Website</a></p>` : ""}`;
    }
    const head = `<p class="eyebrow" style="margin:0 0 4px">${esc(TYPE_LABEL[n.kind])}</p><h3>${esc(n.label)}</h3>${ringHtml}`;
    // For an ask, its name and coverage mark come first, so the long figures below are clearly about it.
    const top = n.kind === "ask" ? `${head}${facts}${actHtml}` : `${actHtml}${head}${facts}`;
    document.getElementById("net-panel").innerHTML = `
      ${top}
      ${pathFinderHtml(n)}
      <h4 style="margin:14px 0 4px;font-size:14px">Connections</h4><ul class="conn">${rel || "<li>None yet</li>"}</ul>`;
    document.querySelectorAll("#net-panel .conn .linklike").forEach((b) => b.addEventListener("click", () => focus(b.dataset.id)));
    wireActions(document.getElementById("net-panel"));
    wirePathFinder(n);
  }

  // One action item: its text, its links and, for a button, a real control (panel and List view alike).
  function actionHtml(a, id, i) {
    // A fact with no source link says "source pending" (DESIGN.md rule 2).
    const lk = (href, label) => (href ? ` <a class="src" href="${esc(href)}" target="_blank" rel="noopener">[${esc(label)}]</a>` : ` ${esc(label)} <span class="unverified">source pending</span>`);
    const own = a.href ? lk(a.href, a.hrefLabel || "source") : a.needsSource ? ` <span class="unverified">source pending</span>` : "";
    return `${a.text ? esc(a.text) : ""}${own}${a.links && a.links.length ? `<ul class="act-links">${a.links.map((l) => `<li>${lk(l.href, l.label)}</li>`).join("")}</ul>` : ""}${a.button ? `<button type="button" class="chip" data-act-node="${esc(id)}" data-act="${i}">${esc(a.button.label)}</button>` : ""}`;
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

  // The year a node belongs to for the year scrubber: proposals by year, events (ev- nodes) by date.
  const nodeYear = (n) => (n.kind === "proposal" ? Number(n.year) : String(n.id).startsWith("ev-") && n.date ? Number(String(n.date).slice(0, 4)) : null);
  function baseVisible(n) {
    if (n.kind === "gap") { const c = state.byId.get(n.gapFor); return !!c && baseVisible(c); }
    if (state.upto) {
      const y = nodeYear(n);
      if (y && y > state.upto) return false;
      if (n.kind === "ask" && !state.data.nodes.some((p) => p.kind === "proposal" && p.ask_id === n.id && Number(p.year) <= state.upto)) return false;
    }
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
    const P = state.path;
    const held = (d) => !state.holdings.size || isHeld(d);
    const nodeOpacity = (d) => {
      if (P) return P.nodes.has(d.id) ? 1 : 0.12;
      let o = 1;
      if (q) o = d.label.toLowerCase().includes(q) ? 1 : 0.12;
      else if (near && !near.has(d.id)) o = 0.12;
      // Holdings overlay: what the viewer doesn't hold fades to 15%.
      return held(d) || d.id === focusId ? o : Math.min(o, 0.15);
    };
    state.node.attr("display", (d) => (visible(d) ? null : "none"))
      .attr("opacity", nodeOpacity)
      .attr("stroke", (d) => (d.id === state.selected ? cssVar("--g-focus") : d.kind === "gap" ? cssVar("--g-label-soft") : cssVar("--g-bg")))
      .attr("stroke-width", (d) => (d.id === state.selected ? 2.5 : d.kind === "gap" ? 1.5 : 1));
    if (state.ringSel) state.ringSel.attr("display", (d) => (visible(d) ? null : "none")).attr("opacity", nodeOpacity);
    state.linkSel.attr("display", (l) => (visible(l.source) && visible(l.target) ? null : "none"))
      .attr("stroke-opacity", (l) => {
        if (P) return P.links.has(l) ? 0.95 : 0.03;
        return near ? (l.source.id === focusId || l.target.id === focusId ? 0.9 : 0.04) : q ? 0.08 : 0.45;
      })
      .attr("stroke-width", (l) => (P && P.links.has(l) ? 2.5 : (l.relation === "lead filer" ? 1.4 : 1)) * state.cfg.linkScale);
    state.labels.attr("display", (d) => (visible(d) ? null : "none"))
      .attr("opacity", (d) => {
        if (P) return P.nodes.has(d.id) ? 1 : 0;
        if (!held(d) && d.id !== focusId) return 0;
        if (q) return d.label.toLowerCase().includes(q) ? 1 : 0;
        if (near) return near.has(d.id) ? 1 : 0;
        // Labels are off by default; selecting a node (or hovering, or keyboard focus) names it and its connections.
        // Recurring asks (Policymaker lens) are always named: there are only a dozen and they are the point of the view.
        if (d.kind === "ask") return 1;
        return state.cfg.labels && labelCandidate(d) && !state.hiddenLabels.has(d.id) ? 1 : 0;
      })
      // The clicked (or hovered, or keyboard-focused) node's own label stands out from its neighbours' labels
      // (owner, 2026-11-26): larger, bold, white on a blue pill; the neighbours' labels go a softer grey.
      .attr("font-size", (d) => (d.kind === "company" ? state.cfg.textSize + 2 : state.cfg.textSize) + (d.id === focusId ? 3 : 0))
      .attr("font-weight", (d) => (d.id === focusId ? 700 : d.kind === "company" ? 600 : 400))
      .attr("fill", (d) => (d.id === focusId ? cssVar("--g-focus") : near ? cssVar("--g-label-soft") : cssVar("--g-label")));
    layoutLabels();
    placeSelectedPill(focusId);
  }

  // A blue pill behind the focused node's label, so its name reads as the one chosen.
  function placeSelectedPill(focusId) {
    if (!state.selPill) return;
    const el = focusId && state.labels.filter((d) => d.id === focusId).node();
    if (!el || el.getAttribute("display") === "none" || Number(el.getAttribute("opacity")) === 0) { state.selPill.attr("display", "none"); return; }
    const b = el.getBBox();
    state.selPill.attr("display", null).attr("x", b.x - 5).attr("y", b.y - 2).attr("width", b.width + 10).attr("height", b.height + 4);
  }

  // ---------- Label placement: no two shown labels overlap ----------
  // Each shown label tries right, left, above and below its node, in that order, and takes the first spot
  // that clears every label already placed and the header strip. Priority: the selected, hovered or
  // keyboard-focused node, then companies and labs, then by connections. A label with no free spot is
  // hidden; that node is still listed by name in the panel's connections and in the List view.
  function layoutLabels() {
    if (!state.labels || !state.size) return;
    // Bounds are the part of the graph visible on screen at the current zoom, so no label is cut off.
    const { width, height } = state.size;
    const t = state.svg ? d3.zoomTransform(state.svg.node()) : { x: 0, y: 0, k: 1 };
    const vx0 = -t.x / t.k, vx1 = (width - t.x) / t.k, vy0 = -t.y / t.k;
    const top = Math.max(state.cfg.group > 0 ? HEADER_H : 0, vy0 + 4 / t.k);
    const vy1 = (height - t.y) / t.k;
    const focusId = state.selected || state.hover || state.kbId;
    const items = [];
    state.labels.each(function (d) {
      if (this.getAttribute("display") === "none" || Number(this.getAttribute("opacity")) === 0 || d.x == null) return;
      items.push({ d, el: this });
    });
    const rank = (d) => (d.id === focusId ? 0 : d.id === state.hover || d.id === state.kbId ? 1 : isCompanyKind(d.kind) ? 2 : 3);
    items.sort((a, b) => rank(a.d) - rank(b.d) || (b.d.degree || 0) - (a.d.degree || 0));
    const placed = [];
    // Shown node circles count as obstacles too, so a label doesn't print over another shown node.
    const circles = items.map(({ d }) => ({ x: d.x, y: d.y, r: radius(d) }));
    const hits = (b) => placed.some((p) => b[0] < p[2] && p[0] < b[2] && b[1] < p[3] && p[1] < b[3])
      || circles.some((c) => c.x > b[0] - c.r && c.x < b[2] + c.r && c.y > b[1] - c.r && c.y < b[3] + c.r && !(c.x === b.nx && c.y === b.ny));
    // Candidate spots: right, left, above, below, then the four diagonals. If none is free, the label is
    // tried again shortened to SHORT characters (the full name is in the panel and the List view).
    const SHORT = 22;
    const spots = (d, fs, w, h, r) => {
      const dy = fs * 0.35;
      const dg = r * 0.75;
      return [
        { a: "start", x: d.x + r, y: d.y + dy, box: [d.x + r, d.y - h / 2, d.x + r + w, d.y + h / 2] },
        { a: "end", x: d.x - r, y: d.y + dy, box: [d.x - r - w, d.y - h / 2, d.x - r, d.y + h / 2] },
        { a: "middle", x: d.x, y: d.y - r - 2, box: [d.x - w / 2, d.y - r - 2 - h, d.x + w / 2, d.y - r - 2] },
        { a: "middle", x: d.x, y: d.y + r + fs, box: [d.x - w / 2, d.y + r, d.x + w / 2, d.y + r + h] },
        { a: "start", x: d.x + dg, y: d.y - dg, box: [d.x + dg, d.y - dg - h * 0.8, d.x + dg + w, d.y - dg + h * 0.2] },
        { a: "start", x: d.x + dg, y: d.y + dg + fs * 0.8, box: [d.x + dg, d.y + dg, d.x + dg + w, d.y + dg + h] },
        { a: "end", x: d.x - dg, y: d.y - dg, box: [d.x - dg - w, d.y - dg - h * 0.8, d.x - dg, d.y - dg + h * 0.2] },
        { a: "end", x: d.x - dg, y: d.y + dg + fs * 0.8, box: [d.x - dg - w, d.y + dg, d.x - dg, d.y + dg + h] },
      ].filter((c) => c.box[1] >= top && c.box[3] <= vy1 && c.box[0] >= Math.max(0, vx0) && c.box[2] <= Math.min(width, vx1));
    };
    for (const { d, el } of items) {
      const fs = Number(el.getAttribute("font-size")) || 11;
      const full = d.label.length > 42 ? d.label.slice(0, 40) + "…" : d.label;
      const short = d.label.length > SHORT ? d.label.slice(0, SHORT - 1) + "…" : d.label;
      const h = fs * 1.3;
      const r = radius(d) + 4;
      let pick = null;
      let text = full;
      // Measured width of the text (the browser's own measure), plus a small gap.
      const measure = (t) => { if (el.textContent !== t) el.textContent = t; return (el.getComputedTextLength ? el.getComputedTextLength() : t.length * fs * 0.6) + 3; };
      for (const t of short === full ? [full] : [full, short]) {
        for (const c of spots(d, fs, measure(t), h, r)) {
          c.box.nx = d.x; c.box.ny = d.y;
          if (!hits(c.box)) { pick = c; text = t; break; }
        }
        if (pick) break;
      }
      const w = measure(full);
      const cands = spots(d, fs, w, h, r);
      if (el.textContent !== text) el.textContent = text;
      // The focused node always keeps its label, at its first in-bounds spot.
      if (!pick && d.id === focusId) {
        pick = cands[0] || { a: "start", x: d.x + r, y: d.y + fs * 0.35, box: [d.x + r, d.y - h / 2, d.x + r + w, d.y + h / 2] };
        if (el.textContent !== full) el.textContent = full;
      }
      if (!pick) { el.setAttribute("opacity", 0); continue; }
      placed.push(pick.box);
      el.setAttribute("x", pick.x);
      el.setAttribute("y", pick.y);
      el.setAttribute("text-anchor", pick.a);
    }
  }

  // Marks on a node, one group per node, all from the lens's rings(). One table (DESIGN.md "Lenses"):
  // focus r+1.5/r+3 solid white · upcoming r+6 dashed · deadline r+9 solid + countdown arc ·
  // seeking r+12 dotted · resubmission: a bar under the node plus "!".
  function drawRings() {
    if (!state.ringLayer) return;
    state.ringLayer.selectAll("*").remove();
    const marked = state.data.nodes.filter((n) => rings(n).length);
    state.ringSel = state.ringLayer.selectAll("g").data(marked).join("g")
      .attr("transform", (d) => `translate(${d.x || 0},${d.y || 0})`);
    // The pulse plays on the first draw only, so a redraw (a settings change) doesn't start it again.
    const pulse = state.cfg.pulse && !state.pulsed;
    if (pulse && marked.some((n) => rings(n).some((m) => m.kind === "deadline"))) state.pulsed = true;
    state.ringSel.each(function (d) {
      const g = d3.select(this);
      const r = radius(d);
      for (const m of rings(d)) {
        if (m.kind === "upcoming") g.append("circle").attr("r", r + 6).attr("fill", "none").attr("stroke", cssVar("--g-ring")).attr("stroke-width", 1.5).attr("stroke-dasharray", "4 2");
        else if (m.kind === "deadline") {
          const R = r + 9;
          g.append("circle").attr("r", R).attr("fill", "none").attr("stroke", cssVar("--g-window")).attr("stroke-width", 1.5).attr("class", pulse ? "g-pulse" : null);
          // Countdown arc from 12 o'clock, clockwise; full at WINDOW_FULL_DAYS or more, empty at 0.
          const f = Math.max(0, Math.min(1, m.frac ?? 0));
          if (f >= 1) g.append("circle").attr("r", R).attr("fill", "none").attr("stroke", cssVar("--g-window")).attr("stroke-width", 3);
          else if (f > 0) {
            const t = f * 2 * Math.PI;
            g.append("path").attr("d", `M0,${-R}A${R},${R} 0 ${t > Math.PI ? 1 : 0} 1 ${R * Math.sin(t)},${-R * Math.cos(t)}`)
              .attr("fill", "none").attr("stroke", cssVar("--g-window")).attr("stroke-width", 3).attr("stroke-linecap", "round");
          }
        } else if (m.kind === "cov-covered") g.append("circle").attr("r", r + 9).attr("fill", "none").attr("stroke", cssVar("--g-ring")).attr("stroke-width", 2.5);
        else if (m.kind === "cov-partial") g.append("circle").attr("r", r + 9).attr("fill", "none").attr("stroke", cssVar("--g-ring")).attr("stroke-width", 2).attr("stroke-dasharray", "8 3");
        else if (m.kind === "cov-none") g.append("circle").attr("r", r + 9).attr("fill", "none").attr("stroke", cssVar("--g-risk")).attr("stroke-width", 2).attr("stroke-dasharray", "1 3").attr("stroke-linecap", "round");
        else if (m.kind === "seeking") g.append("circle").attr("r", r + 12).attr("fill", "none").attr("stroke", cssVar("--g-seeking")).attr("stroke-width", 2).attr("stroke-dasharray", "1 3").attr("stroke-linecap", "round");
        else if (m.kind === "risk") {
          g.append("rect").attr("x", -Math.max(r, 5)).attr("y", r + 3).attr("width", Math.max(r, 5) * 2).attr("height", 3).attr("fill", cssVar("--g-risk"));
          g.append("text").attr("x", Math.max(r, 5) + 3).attr("y", r + 9).attr("font-size", 11).attr("font-weight", 700).attr("fill", cssVar("--g-risk")).text("!");
        }
      }
    });
  }
  function placeFocusMark() {
    if (!state.focusMark) return;
    const n = state.kbId && state.byId.get(state.kbId);
    if (!n || !visible(n) || n.x == null) { state.focusMark.attr("display", "none"); return; }
    const r = radius(n);
    state.focusMark.attr("display", null);
    state.focusMark.select(".fm-gap").attr("cx", n.x).attr("cy", n.y).attr("r", r + 1.5);
    state.focusMark.select(".fm-ring").attr("cx", n.x).attr("cy", n.y).attr("r", r + 3);
  }

  // ---------- Holdings overlay (all lenses): tickers kept in this browser only ----------
  const HOLD_KEY = "holdings";
  function loadHoldings() {
    try { return new Set(JSON.parse(localStorage.getItem(HOLD_KEY) || "[]")); } catch (e) { return new Set(); }
  }
  function saveHoldings() {
    try { if (state.holdings.size) localStorage.setItem(HOLD_KEY, JSON.stringify([...state.holdings])); else localStorage.removeItem(HOLD_KEY); } catch (e) {}
  }
  const tickerOf = (n) => (isCompanyKind(n.kind) ? n.ticker : n.kind === "proposal" ? n.company : null);
  const isHeld = (n) => {
    const t = tickerOf(n);
    return !!t && state.holdings.has(String(t).toUpperCase());
  };
  function holdStatus() {
    const el = document.getElementById("net-hold-status");
    if (!el) return;
    if (!state.holdings.size) { el.textContent = ""; return; }
    const inMap = new Set(state.data.nodes.filter((n) => isCompanyKind(n.kind) && n.ticker).map((n) => String(n.ticker).toUpperCase()));
    const found = [...state.holdings].filter((t) => inMap.has(t));
    const missing = [...state.holdings].filter((t) => !inMap.has(t));
    el.textContent = `Holdings: ${state.holdings.size} ${state.holdings.size === 1 ? "ticker" : "tickers"}, ${found.length} in this map${found.length ? " (" + found.join(", ") + ")" : ""}.${missing.length ? " Not in this map: " + missing.join(", ") + "." : ""} Other nodes are faded.`;
  }
  function wireHoldings() {
    const btn = document.getElementById("net-hold-btn");
    const box = document.getElementById("net-hold");
    const input = document.getElementById("net-hold-input");
    input.value = [...state.holdings].join(", ");
    const close = () => { box.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); };
    btn.addEventListener("click", () => {
      const open = box.hidden;
      box.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      if (open) input.focus();
    });
    box.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } });
    const apply = () => {
      state.holdings = new Set(input.value.split(/[\s,;]+/).map((t) => t.trim().toUpperCase()).filter(Boolean));
      saveHoldings(); holdStatus(); applyStyles(); if (state.view === "list") drawList();
    };
    document.getElementById("net-hold-apply").addEventListener("click", apply);
    document.getElementById("net-hold-clear").addEventListener("click", () => { input.value = ""; apply(); input.focus(); });
  }

  // ---------- Topics not filed (Impact investor lens): gap nodes, scoped to this dataset ----------
  // Comparable = the same node type (a company), among companies with at least one AI proposal in this
  // dataset. A gap is a topic filed at another such company and at none of this one's proposals.
  function gapData() {
    const at = new Map();
    state.data.links.forEach((l) => {
      if (l.relation !== "proposal at") return;
      const p = state.byId.get(endId(l.source)), c = state.byId.get(endId(l.target));
      if (!p || !c || !p.topic) return;
      if (!at.has(c.id)) at.set(c.id, new Map());
      at.get(c.id).set(p.topic, (at.get(c.id).get(p.topic) || 0) + 1);
    });
    const topics = [...new Set([...at.values()].flatMap((m) => [...m.keys()]))].sort();
    const nodes = [], links = [];
    for (const [cid, m] of at) {
      const c = state.byId.get(cid);
      for (const t of topics) {
        if (m.has(t)) continue;
        const filedAt = [...at].filter(([, mm]) => mm.has(t)).map(([id, mm]) => ({ label: state.byId.get(id).label, count: mm.get(t) }))
          .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
        const id = `gap:${cid}:${t}`;
        nodes.push({ id, kind: "gap", label: `${t}: none in this dataset`, topic: t, gapFor: cid, companyLabel: c.label, company: c.ticker, covered: at.size, filedAt, degree: 1 });
        links.push({ source: id, target: cid, relation: "missing", type: "missing", source_url: null, derived: true });
      }
    }
    return { nodes, links };
  }
  function setGaps(on) {
    const btn = document.getElementById("net-gaps");
    const d = state.data;
    d.nodes.splice(0, d.nodes.length, ...d.nodes.filter((n) => n.kind !== "gap"));
    d.links.splice(0, d.links.length, ...d.links.filter((l) => l.relation !== "missing"));
    let n = 0;
    if (on) {
      const g = gapData();
      n = g.nodes.length;
      d.nodes.push(...g.nodes);
      d.links.push(...g.links);
    }
    state.byId = new Map(d.nodes.map((x) => [x.id, x]));
    state.ctx.byId = state.byId;
    state.ctx.cache = {};
    state.gaps = on;
    if (btn) btn.setAttribute("aria-pressed", String(on));
    if (state.drawn) { state.sim.stop(); drawGraph(); }
    intro();
    if (state.view === "list") drawList();
    document.getElementById("net-lens-status").textContent = on ? `Topics not filed shown: ${n} ${n === 1 ? "node" : "nodes"}, among companies with AI proposals in this dataset.` : "Topics not filed hidden.";
  }

  // ---------- Warm path: shortest chain through people, coalitions, co-filing and filings ----------
  const PATH_EDGES = {
    people: ["works at", "colleague", "co-authored", "co-presented"],
    coalition: ["member of", "coalition role"],
    cofiling: ["co-filed with"],
    filing: ["lead filer", "co-filer", "filed (named in proxy)", "proposal at"],
  };
  const PATH_REL = new Set(Object.values(PATH_EDGES).flat());
  const canStartPath = (n) => n.kind === "person" || FILER_ROWS.includes(n.kind);
  function findPath(from, to) {
    const adj = new Map();
    const add = (a, b, l) => { if (!adj.has(a)) adj.set(a, []); adj.get(a).push({ to: b, l }); };
    state.data.links.forEach((l) => {
      if (!PATH_REL.has(l.relation)) return;
      add(endId(l.source), endId(l.target), l);
      add(endId(l.target), endId(l.source), l);
    });
    // Sourced edges first, so among equally short paths the better-sourced one wins.
    adj.forEach((v) => v.sort((a, b) => (a.l.source_url ? 0 : 1) - (b.l.source_url ? 0 : 1)));
    const prev = new Map([[from, null]]);
    const queue = [from];
    while (queue.length) {
      const cur = queue.shift();
      if (cur === to) break;
      for (const { to: nx, l } of adj.get(cur) || []) {
        if (prev.has(nx)) continue;
        prev.set(nx, { from: cur, l });
        queue.push(nx);
      }
    }
    if (!prev.has(to)) return null;
    const steps = [];
    for (let cur = to; prev.get(cur); cur = prev.get(cur).from) steps.unshift({ a: prev.get(cur).from, b: cur, l: prev.get(cur).l });
    return steps;
  }
  function pathFinderHtml(n) {
    if (!canStartPath(n)) return "";
    const targets = state.data.nodes.filter((x) => x.id !== n.id && (isCompanyKind(x.kind) || FILER_ROWS.includes(x.kind)))
      .sort((a, b) => a.label.localeCompare(b.label));
    const opt = (x) => `<option value="${esc(x.id)}">${esc(x.label)}</option>`;
    return `<section class="net-path" aria-labelledby="net-path-h"><h4 id="net-path-h">Find a path to…</h4>
      <label class="sr-label" for="net-path-to">Target</label>
      <select id="net-path-to"><optgroup label="Companies">${targets.filter((x) => isCompanyKind(x.kind)).map(opt).join("")}</optgroup>
      <optgroup label="Organizations">${targets.filter((x) => !isCompanyKind(x.kind)).map(opt).join("")}</optgroup></select>
      <button type="button" class="chip" id="net-path-go">Find</button>
      <div id="net-path-result"></div></section>`;
  }
  function hopHtml(st) {
    const a = state.byId.get(st.a), b = state.byId.get(st.b), l = st.l;
    let how;
    if (l.relation === "co-filed with") {
      const props = (l.proposals || []).map((id) => state.byId.get(id)).filter(Boolean);
      how = `co-filed with <span class="conf">· inferred from co-filing</span>${props.map((p) => link(p.source_url, p.label.length > 40 ? p.label.slice(0, 38) + "…" : p.label)).join("")}`;
    } else if (l.relation === "member of") {
      const coal = state.byId.get(endId(l.target));
      const members = state.data.links.filter((x) => x.relation === "member of" && endId(x.target) === coal.id).length;
      how = `${endId(l.source) === a.id ? "member of" : "has member"} <span class="conf">· coalition membership (${esc(coal.label)}, ${members} members)</span>${link(l.source_url)}`;
    } else {
      const c = conf(l);
      const dir = endId(l.source) === a.id ? l.relation : `${l.relation} (from)`;
      how = `${esc(dir)} <span class="conf">· ${c.level === "inferred" ? "no source, " + esc(c.text) : "source: " + esc(c.text)}</span>${l.source_url ? link(l.source_url) : ""}`;
    }
    return `<li>${esc(a.label)} → ${how} → ${esc(b.label)}</li>`;
  }
  function wirePathFinder(n) {
    const go = document.getElementById("net-path-go");
    if (!go) return;
    const out = document.getElementById("net-path-result");
    const clear = () => {
      state.path = null; out.innerHTML = ""; applyStyles(); go.focus(); say("Path cleared");
    };
    go.addEventListener("click", () => {
      const to = document.getElementById("net-path-to").value;
      const steps = findPath(n.id, to);
      if (!steps) {
        state.path = null; applyStyles();
        out.innerHTML = `<h5 id="net-path-sum" class="path-sum" tabindex="-1">No path in this map from ${esc(n.label)} to ${esc(state.byId.get(to).label)} through people, coalitions, co-filing or filings.</h5>`;
      } else {
        state.path = { from: n.id, nodes: new Set([n.id, ...steps.map((x) => x.b)]), links: new Set(steps.map((x) => x.l)) };
        steps.forEach((x) => state.byId.get(x.b) && state.hiddenKinds.delete(state.byId.get(x.b).kind));
        const inferred = steps.filter((x) => x.l.relation === "co-filed with").length;
        // A coalition counts as "shared membership" only when the path passes through it (member in, member out).
        const coalitions = steps.filter((x, i) => i + 1 < steps.length && x.l.relation === "member of" && steps[i + 1].l.relation === "member of" && x.b === endId(x.l.target)).length;
        const parts = [inferred && `${inferred} inferred from co-filing`, coalitions && `${coalitions} through shared coalition membership`].filter(Boolean);
        const sum = `Path found: ${steps.length} ${steps.length === 1 ? "hop" : "hops"}${parts.length ? " (" + parts.join(", ") + ")" : ""}`;
        out.innerHTML = `<h5 id="net-path-sum" class="path-sum" tabindex="-1">${sum}</h5><ol class="path-steps">${steps.map(hopHtml).join("")}</ol>
          <button type="button" class="chip" id="net-path-clear">Clear path</button>`;
        document.getElementById("net-path-clear").addEventListener("click", clear);
        refreshConnected(); applyStyles();
      }
      document.getElementById("net-path-sum").focus();
    });
    document.getElementById("net-panel").onkeydown = (e) => { if (e.key === "Escape" && state.path) { e.stopPropagation(); clear(); } };
  }

  // ---------- Keyboard: the graph is one tab stop; Up/Down step through visible nodes ----------
  // Order: companies and labs first, then by number of connections, then by name.
  function kbOrder() {
    const first = (n) => (lens().asks && n.kind === "ask" ? 2 : isCompanyKind(n.kind) ? 1 : 0);
    return state.data.nodes.filter(visible)
      .sort((a, b) => first(b) - first(a) || (b.degree || 0) - (a.degree || 0) || a.label.localeCompare(b.label));
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
    const holdTxt = !state.holdings.size ? "" : tickerOf(n) ? (isHeld(n) ? ", held" : ", not held") : ", faded: not a holding";
    say(`${i + 1} of ${list.length}: ${n.label}, ${TYPE_LABEL[n.kind]}, ${n.degree || 0} connections${ring ? ", " + ring : ""}${holdTxt}`);
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
    state.zoom = d3.zoom().scaleExtent([0.2, 5]).on("zoom", (ev) => { g.attr("transform", ev.transform); layoutLabels(); });
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
    state.linkSel = g.append("g").attr("stroke", cssVar("--g-link")).attr("fill", "none").selectAll("path").data(data.links).join("path")
      .attr("stroke-width", (l) => (l.relation === "lead filer" ? 1.4 : 1) * state.cfg.linkScale)
      // Membership links are dashed; links with no source (inferred) are dotted, so the two never look alike.
      .attr("stroke-dasharray", (l) => (l.relation === "missing" ? "5 3" : l.relation === "coverage" && l.coverage !== "full" ? "8 3" : conf(l).level === "inferred" ? "1 3" : l.relation === "member of" ? "3 3" : null));

    state.node = g.append("g").selectAll("circle").data(data.nodes).join("circle")
      .attr("r", radius)
      .attr("fill", fillOf)
      .attr("stroke", (d) => (d.kind === "gap" ? cssVar("--g-label-soft") : cssVar("--g-bg")))
      .attr("stroke-dasharray", (d) => (d.kind === "gap" ? "3 2" : null))
      .style("cursor", "pointer")
      .on("mouseenter", (ev, d) => { state.hover = d.id; applyStyles(); })
      .on("mouseleave", () => { state.hover = null; applyStyles(); })
      .on("click", (ev, d) => { ev.stopPropagation(); state.selected = d.id; showPanel(d); applyStyles(); say(`Opened ${d.label}. Details are in the node panel.`); })
      .call(d3.drag()
        .on("start", (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on("end", (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));
    // No SVG <title>: its browser tooltip printed a second label over the graph. The label itself shows on hover.
    // Lens rings (dashed, accent) and the keyboard focus mark (solid ink ring with a white gap) sit on top.
    state.ringLayer = g.append("g").attr("pointer-events", "none");
    state.focusMark = g.append("g").attr("pointer-events", "none").attr("display", "none");
    state.focusMark.append("circle").attr("class", "fm-gap").attr("fill", "none").attr("stroke", cssVar("--g-bg")).attr("stroke-width", 3);
    state.focusMark.append("circle").attr("class", "fm-ring").attr("fill", "none").attr("stroke", cssVar("--g-focus")).attr("stroke-width", 2);
    drawRings();

    state.selPill = g.append("rect").attr("rx", 5).attr("fill", cssVar("--accent")).attr("display", "none").attr("pointer-events", "none");
    state.labels = g.append("g").selectAll("text").data(data.nodes).join("text")
      .text((d) => (d.label.length > 42 ? d.label.slice(0, 40) + "…" : d.label))
      .attr("font-size", (d) => (d.kind === "company" ? state.cfg.textSize + 2 : state.cfg.textSize))
      .attr("font-weight", (d) => (d.kind === "company" ? 600 : 400))
      .attr("fill", cssVar("--g-label"))
      .attr("pointer-events", "none")
      // A dark outline under each label keeps it legible over lines and nodes.
      .attr("stroke", cssVar("--g-bg")).attr("stroke-width", 3).attr("stroke-linejoin", "round").attr("paint-order", "stroke")
      .attr("dx", 0).attr("dy", 0);
    // Column labels for the grouped layout, on top of everything; they move and zoom with the graph.
    state.axis = g.append("g").attr("font-size", 11).attr("font-weight", 600).attr("fill", cssVar("--g-label-soft"))
      .attr("pointer-events", "none").attr("display", state.cfg.group > 0 ? null : "none");
    drawAxis();

    // Keep every node inside the box (below the column headers), and anchor right-hand labels leftwards.
    const draw = () => {
      data.nodes.forEach((d) => {
        // Room for the node's rings (up to r+12) and, at the top, the column header strip.
        const r = radius(d) + 2;
        const top = (state.cfg.group > 0 ? HEADER_H : 0) + radius(d) + 14;
        d.x = Math.max(r, Math.min(width - r, d.x));
        d.y = Math.max(top, Math.min(height - r, d.y));
      });
      state.linkSel.attr("d", arc);
      state.node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      if (state.ringSel) state.ringSel.attr("transform", (d) => `translate(${d.x},${d.y})`);
      placeFocusMark();
      layoutLabels();
      placeSelectedPill(state.hover || state.selected || state.kbId);
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
      const heldCell = state.holdings.size ? `<td>${tickerOf(n) ? (isHeld(n) ? "Held" : "Not held") : "Not a holding"}</td>` : "";
      return `<tr><td><button type="button" class="linklike" data-id="${esc(n.id)}">${esc(n.label)}</button></td><td>${esc(TYPE_LABEL[n.kind])}</td>${m ? `<td class="num">${val(n) ?? "–"}</td>` : ""}<td class="num">${n.degree || 0}</td>${heldCell}<td>${esc(rings(n).map((r) => r.text).join(", "))}</td><td>${acts.join("<br>")}</td></tr>`;
    }).join("");
    const el = document.getElementById("net-list");
    const sortLabel = m ? m.label : "Connections";
    if (!document.getElementById("net-list-count")) el.innerHTML = `<p class="count-line" id="net-list-count" aria-live="polite"></p><div id="net-list-table"></div>`;
    document.getElementById("net-list-table").innerHTML = `<div class="table-wrap"><table><thead><tr><th scope="col">Name</th><th scope="col">Type</th>
      ${m ? `<th scope="col" aria-sort="${dir}"><button type="button" class="th-sort" id="net-list-sort">${esc(sortLabel)} ${dir === "descending" ? "↓" : "↑"}</button></th><th scope="col">Connections</th>`
        : `<th scope="col" aria-sort="${dir}"><button type="button" class="th-sort" id="net-list-sort">Connections ${dir === "descending" ? "↓" : "↑"}</button></th>`}
      ${state.holdings.size ? `<th scope="col">Held</th>` : ""}<th scope="col">Status</th><th scope="col">${esc(lens().actionsHeading || "What you can do")}</th></tr></thead>
      <tbody>${body || `<tr><td colspan="${(m ? 6 : 5) + (state.holdings.size ? 1 : 0)}">No matches.</td></tr>`}</tbody></table></div>`;
    document.getElementById("net-list-count").textContent = `${rows.length} nodes in this view (${lens().label}), sorted by ${sortLabel.toLowerCase()}.${state.upto ? ` Proposals and events up to ${state.upto} only (year slider above).` : ""}`;
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
    state.path = null;
    gapButton();
    if (state.gaps && !lens().gaps) setGaps(false);
    stopPlay();
    state.upto = null;
    state.ctx.upto = null;
    setAsks(!!lens().asks);
    const d = lens().defaults || {};
    state.hiddenKinds = new Set(d.hiddenKinds || []);
    state.topic = ""; state.year = "";
    ["net-topic", "net-year"].forEach((x) => { const s = document.getElementById(x); if (s) s.value = ""; });
    scrubSync();
    if (d.orphans != null) {
      state.cfg.orphans = d.orphans;
      const c = document.querySelector("[data-gs-check=orphans]");
      if (c) c.checked = d.orphans;
    }
    document.querySelectorAll("#net-legend .leg").forEach((b) => b.setAttribute("aria-pressed", String(!state.hiddenKinds.has(b.dataset.kind))));
    saveLens(id);
    relabelLegend();
    setFeedView(lens().feed ? "feed" : "graph", false);
    drawRings();
    applySettings(true);
    regroup();
    if (state.selected) showPanel(state.byId.get(state.selected));
    if (announce) {
      refreshConnected();
      const hidden = [...new Set([...state.hiddenKinds].map((k) => (FILER_ROWS.includes(k) ? "filers" : { person: "people", policy: "policy", response: "responses", public: "public engagement" }[k] || TYPE_LABEL[k])))];
      const shown = state.data.nodes.filter(visible).length;
      document.getElementById("net-lens-status").textContent = lens().feed && state.feedView === "feed"
        ? `${lens().label} view: a list of upcoming AI proposals. See the bigger picture opens the graph.`
        : `${lens().label} view${hidden.length ? ": " + hidden.join(", ") + " hidden" : ""}. ${shown} of ${state.data.nodes.length} ${lens().plainIntro ? "circles" : "nodes"} shown.`;
    }
  }

  // ---------- Policymaker lens: recurring asks (data/asks.json) and their coverage (data/coverage.json) ----------
  // Ask nodes are built from the data files while a lens with asks: true is active, then removed.
  function setAsks(on, quiet) {
    const d = state.data;
    d.nodes.splice(0, d.nodes.length, ...d.nodes.filter((n) => n.kind !== "ask"));
    d.links.splice(0, d.links.length, ...d.links.filter((l) => l.relation !== "asks for" && l.relation !== "coverage"));
    state.askY = null;
    if (on) {
      const asks = (state.ctx.asks || []).filter((a) => d.nodes.some((n) => n.kind === "proposal" && n.ask_id === a.id));
      state.askY = new Map(asks.map((a, i) => [a.id, asks.length === 1 ? 0.5 : 0.14 + (i / (asks.length - 1)) * 0.8]));
      asks.forEach((a) => {
        const props = d.nodes.filter((n) => n.kind === "proposal" && n.ask_id === a.id);
        d.nodes.push({ id: a.id, kind: "ask", label: a.label, match: a.match || [], degree: props.length });
        props.forEach((p) => d.links.push({ source: a.id, target: p.id, relation: "asks for", type: "asks for", source_url: null, derived: true }));
      });
      const ids = new Set(d.nodes.map((n) => n.id));
      ((state.ctx.coverage && state.ctx.coverage.entries) || []).forEach((e) => {
        if (e.graph_id && ids.has(e.graph_id) && ids.has(e.ask_id)) d.links.push({ source: e.ask_id, target: e.graph_id, relation: "coverage", type: "coverage", coverage: e.coverage, source_url: e.source_url, description: e.note });
      });
    }
    state.byId = new Map(d.nodes.map((x) => [x.id, x]));
    state.ctx.byId = state.byId;
    state.ctx.cache = {};
    if (quiet) return;
    legend(d);
    if (state.drawn) { state.sim.stop(); drawGraph(); }
  }

  // ---------- Year scrubber (all lenses): show the network up to a year; Play steps through the years ----------
  function yearRange() {
    const ys = state.data.nodes.filter((n) => n.kind === "proposal" && n.year).map((n) => Number(n.year));
    return ys.length ? [Math.min(...ys), Math.max(...ys)] : [0, 0];
  }
  let playTimer = null;
  function stopPlay(announce) {
    if (!playTimer) return;
    clearInterval(playTimer);
    playTimer = null;
    const b = document.getElementById("net-play");
    if (b) b.textContent = "Play";
    if (state.selected && state.byId.get(state.selected)) showPanel(state.byId.get(state.selected));
    if (announce) document.getElementById("net-scrub-status").textContent = `Stopped at ${state.upto || yearRange()[1]}.`;
  }
  function saveUpto() {
    try {
      const u = new URL(location.href);
      if (state.upto) u.searchParams.set("upto", state.upto); else u.searchParams.delete("upto");
      window.history.replaceState(null, "", u.pathname + u.search + location.hash);
    } catch (e) {}
  }
  // Syncs the slider with state: range, value, label, and disabled while a single year is selected.
  function scrubSync() {
    const r = document.getElementById("net-upto");
    if (!r) return;
    const [lo, hi] = yearRange();
    r.min = lo; r.max = hi;
    r.value = state.upto || hi;
    document.getElementById("net-upto-val").textContent = r.value;
    const single = !!state.year;
    r.disabled = single;
    document.getElementById("net-play").disabled = single;
    document.getElementById("net-scrub-note").textContent = single ? `Showing ${state.year} only. Choose All years to use the slider.` : "";
    saveUpto();
  }
  function scrubTo(y, refresh, announce) {
    const [, hi] = yearRange();
    state.upto = y >= hi ? null : y;
    state.ctx.upto = state.upto;
    state.ctx.cache = {};
    scrubSync();
    // A selected or keyboard-focused node that the cap hides is cleared.
    let cleared = false;
    for (const key of ["selected", "kbId", "hover"]) {
      const n = state[key] && state.byId.get(state[key]);
      if (n && !baseVisible(n)) {
        state[key] = null;
        if (key === "selected") {
          document.getElementById("net-panel").innerHTML = `<p class="status-note">The selected node is after ${y}, so it is hidden. Select another node.</p>`;
          cleared = true;
        }
      }
    }
    refresh();
    if (state.ringSel) placeFocusMark();
    // The panel is refreshed when the user moves the slider or Play stops, not on every Play step (focus safety).
    if (!playTimer && state.selected && state.byId.get(state.selected)) showPanel(state.byId.get(state.selected));
    if (announce) {
      const n = state.data.nodes.filter((x) => x.kind === "proposal" && visible(x)).length;
      document.getElementById("net-scrub-status").textContent = `Up to ${y}: ${n} ${n === 1 ? "proposal" : "proposals"} shown.${cleared ? " The selected node is after that year, so the panel was cleared." : ""}`;
    }
  }
  function wireScrubber(refresh) {
    const r = document.getElementById("net-upto");
    const b = document.getElementById("net-play");
    r.addEventListener("input", () => { stopPlay(); scrubTo(Number(r.value), refresh, true); });
    b.addEventListener("click", () => {
      if (playTimer) { stopPlay(true); return; }
      const [lo, hi] = yearRange();
      let y = state.upto && state.upto < hi ? state.upto : lo;
      b.textContent = "Pause";
      scrubTo(y, refresh, true);
      playTimer = setInterval(() => {
        y += 1;
        scrubTo(y, refresh, true);
        if (y >= hi) stopPlay(true);
      }, 1500);
    });
  }

  // "Show topics not filed" belongs to lenses that set gaps: true (the Impact investor lens).
  function gapButton() {
    const b = document.getElementById("net-gaps");
    if (b) b.hidden = !lens().gaps;
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
    document.getElementById("net-year").addEventListener("change", (e) => { state.year = e.target.value; stopPlay(); state.upto = null; state.ctx.upto = null; state.ctx.cache = {}; scrubSync(); refresh(); });
    document.getElementById("net-legend").addEventListener("click", (e) => {
      const b = e.target.closest(".leg");
      if (!b) return;
      const k = b.dataset.kind;
      if (state.hiddenKinds.has(k)) state.hiddenKinds.delete(k); else state.hiddenKinds.add(k);
      b.setAttribute("aria-pressed", String(!state.hiddenKinds.has(k)));
      refresh();
      regroup();
    });
    wireScrubber(refresh);
    document.querySelectorAll("#net-lens input").forEach((r) => r.addEventListener("change", () => { if (r.checked) setLens(r.value, true); }));
    wireKeys();
    wireHoldings();
    gapButton();
    document.getElementById("net-gaps").addEventListener("click", () => setGaps(!state.gaps));
    document.getElementById("lf-back").addEventListener("click", () => setFeedView("feed", true));
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
    state = { data, byId: new Map(data.nodes.map((n) => [n.id, n])), defaults, cfg: loadSettings(defaults), hiddenKinds: new Set(["person", "policy", "response", "public"]), hiddenLabels: new Set(), query: "", topic: "", year: "", view: "graph", selected: null, hover: null, kbId: null, path: null, gaps: false };
    state.holdings = loadHoldings();
    state.lens = initialLens();
    state.hiddenKinds = new Set(lens().defaults.hiddenKinds || [...state.hiddenKinds]);
    // Shared inputs for lens functions (lenses.js). app.js supplies upcoming meetings and Company lookup.
    const app = window.LENS_CTX || {};
    state.ctx = { nodes: data.nodes, links: data.links, byId: state.byId, cache: {},
      upcoming: new Map(((app.upcoming || [])).map((m) => [m.ticker, m])),
      hasCompany: app.hasCompany || (() => false), openCompany: app.openCompany || (() => {}),
      proposals: app.proposals || [], companies: app.companies || [], disclaimer: app.disclaimer || "",
      fv: window.FundVotes ? window.FundVotes.index(app.fundVotes) : null,
      asks: app.asks || [], coverage: app.coverage || null, causality: app.causality || null };
    shell(el);
    if (lens().asks) setAsks(true, true);
    {
      const u = Number(new URLSearchParams(location.search).get("upto"));
      const [lo, hi] = yearRange();
      // Clamped to the data's years; at or past the last year it means no cap.
      if (u) { const c = Math.max(lo, Math.min(hi, u)); state.upto = c < hi ? c : null; state.ctx.upto = state.upto; }
    }
    refreshConnected();
    settingsPanel();
    legend(state.data);
    intro();
    wire();
    holdStatus();
    scrubSync();
    // The graph needs a visible container to measure, so draw it the first time its tab opens.
    state.feedView = lens().feed ? urlView() : "graph";
    setFeedView(state.feedView, false);
    const draw = () => ensureDrawn();
    new MutationObserver(draw).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    draw();
    let t;
    window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { const a = document.getElementById("net-graph-area"); if (state.drawn && !el.hidden && !a.hidden) { state.sim.stop(); drawGraph(); } }, 250); });
  };
})();

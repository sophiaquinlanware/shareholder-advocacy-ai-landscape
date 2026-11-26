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
  const TYPE_LABEL = {
    company: "Company",
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
    lab: "Frontier lab",
    policy: "Policy or rule",
    response: "Company or investor response",
    public: "Public engagement",
  };
  const TYPE_VAR = {
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
    lab: "--t-lab",
    policy: "--n-pension",
    response: "--n-foundation",
    public: "--n-nonprofit",
  };
  const COMPANY_NAMES = { MSFT: "Microsoft", GOOGL: "Alphabet", META: "Meta", AMZN: "Amazon", NVDA: "Nvidia", AAPL: "Apple", TSLA: "Tesla" };

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const link = (url, label = "source") => url ? `<a class="src" href="${esc(url)}" target="_blank" rel="noopener">[${esc(label)}]</a>` : `<span class="unverified">source pending</span>`;
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888";

  let state = null;

  // The shared relationship store (data/graph.json): every tab's facts in one graph.
  function buildFromGraph(G) {
    const nodes = G.nodes.map((n) => {
      let kind = n.type;
      if (kind === "investor") kind = TYPE_VAR[n.org_type] ? n.org_type : "other";
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

  function radius(n) {
    if (n.kind === "company") return 16;
    if (n.kind === "proposal") return 5;
    if (n.kind === "person") return 4;
    if (["policy", "response", "public"].includes(n.kind)) return 4 + Math.min(6, Math.sqrt(n.degree) * 1.5);
    if (n.kind === "lab") return 10;
    return 6 + Math.min(10, Math.sqrt(n.degree) * 2.4);
  }

  function shell(el) {
    el.innerHTML = `
      <h2>Advocacy network</h2>
      <p class="intro">Who is engaging these companies on AI, and how they connect. Everything on this site in one map: companies and the labs they fund or supply, the funds that hold and engage them, the people who lead that engagement, the proposals they filed, and the policies and responses around them. Dashed lines between organizations are worked out from the filings: two groups that filed the same proposal are connected. Click a type in the legend to hide or show it. Drag to move, scroll or pinch to zoom, and click any dot for details and sources.</p>
      <div class="net-controls">
        <input type="search" id="net-search" placeholder="Search an organization or company" aria-label="Search the network">
        <select id="net-topic" aria-label="Filter by topic"><option value="">All topics</option></select>
        <select id="net-year" aria-label="Filter by year"><option value="">All years</option></select>
        <div class="seg" role="group" aria-label="View">
          <button data-view="graph" aria-pressed="true">Graph</button>
          <button data-view="list" aria-pressed="false">List</button>
        </div>
      </div>
      <div id="net-legend" class="net-legend"></div>
      <div class="net-body">
        <div id="net-graph" class="net-graph" aria-label="Network graph"></div>
        <div id="net-list" class="net-list" hidden></div>
        <aside id="net-panel" class="net-panel"><p class="status-note">Click a dot to see who it is, what it filed and where the facts come from.</p></aside>
      </div>`;
  }

  function legend(data) {
    const kinds = [...new Set(data.nodes.map((n) => n.kind))];
    const order = Object.keys(TYPE_LABEL);
    kinds.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    document.getElementById("net-legend").innerHTML = kinds.map((k) =>
      `<button class="leg" data-kind="${esc(k)}" aria-pressed="true"><span class="dot" style="background:${cssVar(TYPE_VAR[k])}"></span>${esc(TYPE_LABEL[k])}</button>`).join("");
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
      return `<li><button class="linklike" data-id="${esc(other.id)}">${esc(other.label)}</button> <span class="ticker">${esc(dir)}</span> ${link(l.source_url)}</li>`;
    }).join("");
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
      <p class="eyebrow" style="margin:0 0 4px">${esc(TYPE_LABEL[n.kind])}</p>
      <h3>${esc(n.label)}</h3>${facts}
      <h4 style="margin:14px 0 4px;font-size:14px">Connections</h4><ul class="conn">${rel || "<li>None yet</li>"}</ul>`;
    document.querySelectorAll("#net-panel .linklike").forEach((b) => b.addEventListener("click", () => focus(b.dataset.id)));
  }

  function focus(id) {
    const n = state.data.nodes.find((x) => x.id === id);
    if (!n) return;
    state.selected = id;
    showPanel(n);
    applyStyles();
    if (state.zoom && n.x != null) {
      const { width, height } = state.size;
      state.svg.transition().duration(REDUCED_MOTION ? 0 : 500).call(state.zoom.transform, d3.zoomIdentity.translate(width / 2, height / 2).scale(1.6).translate(-n.x, -n.y));
    }
  }

  function visible(n) {
    if (state.hiddenKinds.has(n.kind)) return false;
    if (n.kind === "proposal") {
      if (state.topic && n.topic !== state.topic) return false;
      if (state.year && String(n.year) !== state.year) return false;
    }
    return true;
  }

  function applyStyles() {
    const focusId = state.hover || state.selected;
    const near = focusId ? neighbors(focusId) : null;
    const q = state.query;
    state.node.attr("display", (d) => (visible(d) ? null : "none"))
      .attr("opacity", (d) => {
        if (q) return d.label.toLowerCase().includes(q) ? 1 : 0.12;
        return near && !near.has(d.id) ? 0.12 : 1;
      })
      .attr("stroke-width", (d) => (d.id === state.selected ? 3 : 1.2));
    state.linkSel.attr("display", (l) => (visible(l.source) && visible(l.target) ? null : "none"))
      .attr("stroke-opacity", (l) => (near ? (l.source.id === focusId || l.target.id === focusId ? 0.9 : 0.04) : q ? 0.08 : 0.35));
    state.labels.attr("display", (d) => (visible(d) ? null : "none"))
      .attr("opacity", (d) => {
        if (q) return d.label.toLowerCase().includes(q) ? 1 : 0;
        if (near) return near.has(d.id) ? 1 : 0;
        return ["proposal", "person", "policy", "response", "public"].includes(d.kind) ? 0 : 1;
      });
  }

  function drawGraph() {
    const el = document.getElementById("net-graph");
    el.innerHTML = "";
    const width = el.clientWidth || 800;
    const height = el.clientHeight || 560;
    state.size = { width, height };
    const data = state.data;

    const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, width, height]).attr("width", width).attr("height", height);
    const g = svg.append("g");
    state.svg = svg;
    state.zoom = d3.zoom().scaleExtent([0.2, 5]).on("zoom", (ev) => g.attr("transform", ev.transform));
    svg.call(state.zoom).on("dblclick.zoom", null);
    svg.on("click", (ev) => { if (ev.target.tagName === "svg") { state.selected = null; applyStyles(); } });

    const sim = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d) => d.id).distance((l) => (l.relation === "member of" ? 90 : l.relation === "proposal at" ? 55 : l.relation === "works at" ? 22 : 45)).strength(0.6))
      .force("charge", d3.forceManyBody().strength((d) => (d.kind === "company" ? -420 : -110)))
      .force("collide", d3.forceCollide().radius((d) => radius(d) + 3))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.04))
      .force("y", d3.forceY(height / 2).strength(0.05));
    state.sim = sim;

    state.linkSel = g.append("g").attr("stroke", cssVar("--ink-soft")).attr("fill", "none").selectAll("path").data(data.links).join("path")
      .attr("stroke-width", (l) => (l.relation === "lead filer" ? 1.4 : 1))
      .attr("stroke-dasharray", (l) => (l.relation === "member of" || l.derived ? "3 3" : null));

    state.node = g.append("g").selectAll("circle").data(data.nodes).join("circle")
      .attr("r", radius)
      .attr("fill", (d) => cssVar(TYPE_VAR[d.kind]))
      .attr("stroke", cssVar("--surface"))
      .style("cursor", "pointer")
      .on("mouseenter", (ev, d) => { state.hover = d.id; applyStyles(); })
      .on("mouseleave", () => { state.hover = null; applyStyles(); })
      .on("click", (ev, d) => { ev.stopPropagation(); state.selected = d.id; showPanel(d); applyStyles(); })
      .call(d3.drag()
        .on("start", (ev, d) => { if (!ev.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag", (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
        .on("end", (ev, d) => { if (!ev.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));
    state.node.append("title").text((d) => d.label);

    state.labels = g.append("g").selectAll("text").data(data.nodes).join("text")
      .text((d) => (d.label.length > 42 ? d.label.slice(0, 40) + "…" : d.label))
      .attr("font-size", (d) => (d.kind === "company" ? 13 : 10.5))
      .attr("font-weight", (d) => (d.kind === "company" ? 600 : 400))
      .attr("fill", cssVar("--ink"))
      .attr("pointer-events", "none")
      .attr("dx", (d) => radius(d) + 4).attr("dy", 4);

    const draw = () => {
      state.linkSel.attr("d", arc);
      state.node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      state.labels.attr("x", (d) => d.x).attr("y", (d) => d.y);
    };
    sim.on("tick", draw);
    if (REDUCED_MOTION) { sim.stop(); sim.tick(300); draw(); }
    applyStyles();
  }

  function drawList() {
    const orgs = state.data.nodes.filter((n) => !["proposal", "company", "person"].includes(n.kind) && visible(n))
      .filter((n) => !state.query || n.label.toLowerCase().includes(state.query))
      .sort((a, b) => b.degree - a.degree);
    const rows = orgs.map((n) => {
      const props = state.data.links.filter((l) => l.source.id === n.id && l.target.kind === "proposal" && visible(l.target));
      const cos = [...new Set(props.map((l) => COMPANY_NAMES[l.target.company] || l.target.company))].join(", ");
      return `<tr><td><button class="linklike" data-id="${esc(n.id)}">${esc(n.label)}</button></td><td>${esc(TYPE_LABEL[n.kind])}</td><td>${props.length}</td><td>${esc(cos)}</td></tr>`;
    }).join("");
    const el = document.getElementById("net-list");
    el.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Organization</th><th>Type</th><th>AI proposals</th><th>Companies</th></tr></thead><tbody>${rows || `<tr><td colspan="4">No matches.</td></tr>`}</tbody></table></div>`;
    el.querySelectorAll(".linklike").forEach((b) => b.addEventListener("click", () => {
      const n = state.data.nodes.find((x) => x.id === b.dataset.id);
      state.selected = n.id; showPanel(n);
    }));
  }

  function wire() {
    const topics = [...new Set(state.data.nodes.filter((n) => n.kind === "proposal").map((n) => n.topic).filter(Boolean))].sort();
    const years = [...new Set(state.data.nodes.filter((n) => n.kind === "proposal").map((n) => String(n.year)))].sort();
    document.getElementById("net-topic").insertAdjacentHTML("beforeend", topics.map((t) => `<option>${esc(t)}</option>`).join(""));
    document.getElementById("net-year").insertAdjacentHTML("beforeend", years.map((t) => `<option>${esc(t)}</option>`).join(""));
    const refresh = () => { applyStyles(); if (state.view === "list") drawList(); };
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
    }));
    document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => {
      state.view = b.dataset.view;
      document.querySelectorAll(".seg button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      document.getElementById("net-graph").hidden = state.view !== "graph";
      document.getElementById("net-list").hidden = state.view !== "list";
      if (state.view === "list") drawList();
    }));
  }

  window.focusNetworkNode = (id) => focus(id);
  window.renderNetwork = function (raw, people) {
    const el = document.getElementById("tab-network");
    shell(el);
    if (typeof d3 === "undefined") {
      document.getElementById("net-graph").innerHTML = `<p class="coming">The graph library did not load. Try reloading the page.</p>`;
      return;
    }
    state = { data: raw && raw.nodes ? buildFromGraph(raw) : build(raw, people), hiddenKinds: new Set(), query: "", topic: "", year: "", view: "graph", selected: null, hover: null };
    legend(state.data);
    wire();
    // The graph needs a visible container to measure, so draw it the first time its tab opens.
    const draw = () => { if (!state.drawn && !el.hidden) { state.drawn = true; drawGraph(); } };
    new MutationObserver(draw).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    draw();
    let t;
    window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { if (state.drawn && !el.hidden) { state.sim.stop(); drawGraph(); } }, 250); });
  };
})();

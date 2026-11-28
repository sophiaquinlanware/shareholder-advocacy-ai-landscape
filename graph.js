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
  // Companies and labs are typed by their main role in AI (roles.js; owner, 2026-11-26: "use this to
  // differentiate companies throughout the UI"). A company with no role on file stays "Company".
  // Kinds keep the "tier-" prefix; the ids are role ids.
  const TIERS = (window.ROLES ? window.ROLES.list : []).map((r) => ({ id: r.id, label: r.label }));
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
    person: "Head of stewardship or engagement",
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
  // Earlier versions kept these across visits; clear them so a new visit opens clean.
  try { ["lens", "net-settings-v1", "fund", "holdings"].forEach((k) => localStorage.removeItem(k)); } catch (e) {}
  const lens = () => (window.LENSES || {})[state.lens] || { label: "", sizeLabel: "number of connections", defaults: {}, size: () => null, rings: () => [], actions: () => [] };
  function initialLens() {
    const ids = Object.keys(window.LENSES || {});
    const fromUrl = new URLSearchParams(location.search).get("lens");
    if (ids.includes(fromUrl)) return fromUrl;
    try { const s = sessionStorage.getItem(LENS_KEY); if (ids.includes(s)) return s; } catch (e) {}
    return ids[0] || "impact";
  }
  // Keep the choice in the URL (shareable) and in this browser; the #tab hash stays as it is.
  function saveLens(id) {
    try { sessionStorage.setItem(LENS_KEY, id); } catch (e) {}
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
        // Main role from the company record (by ticker, else by id), else from the node's own tier.
        const co = (window.companyFor && window.companyFor(n)) || null;
        const role = window.ROLES ? (co ? window.ROLES.roleOf(co) : window.ROLES.roleOfTier(n.tier)) : null;
        if (role && TYPE_LABEL["tier-" + role]) kind = "tier-" + role;
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
    for (const p of raw.proposals || []) links.push({ source: p.id, target: "co-" + p.company, relation: "proposal at", layer: "proposals", source_url: p.source_url });
    for (const e of raw.edges || []) if (nodes.has(e.from) && nodes.has(e.to)) links.push({ source: e.from, target: e.to, relation: e.relation, source_url: e.source_url });
    const deg = new Map();
    links.forEach((l) => { deg.set(l.source, (deg.get(l.source) || 0) + 1); deg.set(l.target, (deg.get(l.target) || 0) + 1); });
    nodes.forEach((n) => { n.degree = deg.get(n.id) || 0; });
    return { nodes: [...nodes.values()], links };
  }

  // Circle size = number of connections, for every kind that has them, on a wider range so the most connected
  // organizations and companies stand out (owner, 2026-11-26: "make this distinction slightly more prominent").
  function baseRadius(n) {
    const deg = Math.sqrt(n.degree || 0);
    if (n.kind === "company" || String(n.kind).startsWith("tier-")) return 7 + Math.min(21, deg * 2.4);
    if (n.kind === "proposal") return 5;
    if (n.kind === "person") return 4;
    if (["policy", "response", "public"].includes(n.kind)) return 4 + Math.min(6, Math.sqrt(n.degree) * 1.5);
    if (n.kind === "lab") return 6 + Math.min(16, deg * 2.4);
    if (n.kind === "gap") return 6;
    if (n.kind === "ask") return 8;
    return 4 + Math.min(18, deg * 2.8);
  }
  const radius = (n) => {
    const r = state.ctx ? lens().size(n, state.ctx) : null;
    return (r == null ? baseRadius(n) : r) * state.cfg.nodeScale;
  };

  // ---------- Graph settings (like Obsidian's graph view): display, filters and forces ----------
  // Kept for this visit only (sessionStorage): a new visit opens with nothing filtered, and choices hold while the
  // reader moves between sections (owner, 2026-11-26). The page works the same without it.
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
    { x: 0.73, label: "AI companies, by role", kinds: ["company", ...TIERS.filter((t) => t.id !== "labs").map((t) => "tier-" + t.id)] },
    { x: 0.92, label: "Frontier labs", kinds: ["lab", "tier-labs"] },
  ];
  const TOP_BAND = ["policy", "response", "public"];
  // Columns whose node types are all hidden give up their space; the rest spread across the width.
  function activeColumns() {
    const present = new Set(state.data.nodes.map((n) => n.kind));
    const cols = COLUMNS.filter((c) => c.kinds.some((k) => present.has(k) && !state.hiddenKinds.has(k) && !mode().hides.has(k)));
    return cols.map((c, i) => ({ ...c, x: cols.length === 1 ? 0.5 : 0.1 + (i * 0.8) / (cols.length - 1) }));
  }
  // Each node's group target (column x, band y, as fractions of the box), folded into the oval the graph is kept
  // in: a target near a corner is pulled in toward the middle (to 78% of the oval's radius), so the columns curve
  // with the oval instead of piling into the corners (owner, 2026-11-26: "a bit more naturally circled").
  // The boundary is a rounded rectangle (a superellipse, |x|^4 + |y|^4 = 1), not an oval (owner, 2026-11-26:
  // "a little more spread out … but more rectangular so it maps onto the linear graph axis part too"): columns
  // stay under their headings, and only the corners round off.
  const SUPER = 4;
  const superNorm = (nx, ny) => (Math.abs(nx) ** SUPER + Math.abs(ny) ** SUPER) ** (1 / SUPER);
  function ovalTarget(d) {
    const nx = groupX(d) * 2 - 1, ny = groupY(d) * 2 - 1;
    const k = superNorm(nx, ny), lim = 0.88;
    const f = k > lim ? lim / k : 1;
    return { x: (nx * f + 1) / 2, y: (ny * f + 1) / 2 };
  }
  // Policy events sit in the top band by jurisdiction, west to east (owner, 2026-11-27: "cluster the policy by
  // proximity … EU stuff near one another and US to each other"). This site's grouping of each event's jurisdiction.
  const REGION_X = { us: 0.2, americas: 0.32, global: 0.44, eu: 0.56, uk: 0.66, china: 0.8, apac: 0.9 };
  function regionOf(d) {
    const j = String(d.jurisdiction || "").toLowerCase();
    if (!j) return null;
    if (/china|hong kong/.test(j)) return "china";
    if (/\bus\b|federal|california|texas|colorado|new york|illinois|georgia|virginia|delaware|nevada|utah|washington|tennessee|connecticut|florida/.test(j)) return "us";
    if (/\buk\b|united kingdom|britain|england/.test(j)) return "uk";
    if (/\beu\b|europe|ireland|italy|france|germany|spain|netherlands/.test(j)) return "eu";
    if (/global|un\b|oecd|g7|international/.test(j)) return "global";
    if (/japan|korea|india|singapore|australia|taiwan|asia/.test(j)) return "apac";
    if (/canada|brazil|mexico|chile|americas/.test(j)) return "americas";
    return null;
  }
  const groupX = (d) => {
    if (TOP_BAND.includes(d.kind)) { const r = regionOf(d); return r ? REGION_X[r] : 0.5; }
    // A "topic not filed" node sits just left of its company.
    if (d.kind === "gap") { const c = state.byId.get(d.gapFor); return c ? groupX(c) - 0.09 : 0.6; }
    const col = (state.cols || COLUMNS).find((c) => c.kinds.includes(d.kind));
    return col ? col.x : 0.5;
  };
  // Column headers (short on phones), drawn on top on an opaque strip that nodes can't enter (they're held
  // below HEADER_H). The filer-type row labels were dropped (owner, 2026-11-26): the colour key names the
  // types, and nodes spill across the bands, so row labels pointed at the wrong nodes.
  const HEADER_H = 40; // column headings sit 30px into the band (owner, 2026-11-26: more space from the edge)
  function drawAxis() {
    if (!state.axis) return;
    const { width, height } = state.size;
    const narrow = width < 640;
    const SHORT = { People: "People", Filers: "Filers", Proposals: "Proposals", Asks: "Asks", "AI companies, by role": "By role", "Frontier labs": "Labs" };
    state.cols = activeColumns();
    state.axis.selectAll("*").remove();
    state.axis.append("rect").attr("x", 0).attr("y", 0).attr("width", state.size.fullW || width).attr("height", HEADER_H).attr("fill", cssVar("--g-bg"));
    state.axis.selectAll("text.col").data(state.cols).join("text").attr("class", "col")
      .attr("x", (c) => (state.zt || d3.zoomIdentity).applyX(c.x * width)).attr("y", 30).attr("text-anchor", "middle").attr("font-size", narrow ? 9.5 : 11)
      .text((c) => (narrow ? SHORT[c.label] || c.label : c.label).toUpperCase());
    state.axis.attr("display", state.cfg.group > 0 ? null : "none");
  }
  const axisFollow = () => {
    if (!state.axis || !state.size) return;
    const t = state.zt || d3.zoomIdentity;
    // Each heading sits over the middle of its column's visible nodes, falling back to the column's target position.
    const mid = (c) => {
      const xs = state.data.nodes.filter((n) => c.kinds.includes(n.kind) && Number.isFinite(n.x) && visible(n)).map((n) => n.x);
      const target = c.x * state.size.width;
      if (!xs.length) return target;
      // Centre of the cluster's main body (10th to 90th percentile), so a stray node doesn't pull the heading
      // away (owner, 2026-11-26: centre the headings over the diagram).
      xs.sort((a, b) => a - b);
      const q = (p) => xs[Math.min(xs.length - 1, Math.max(0, Math.round(p * (xs.length - 1))))];
      return (q(0.1) + q(0.9)) / 2;
    };
    state.axis.selectAll("text.col").attr("x", (c) => t.applyX(mid(c)));
  };
  // Fit the box to the graph once the layout settles (owner, 2026-11-26: "fit the black box to the model so
  // there's a more natural fit"): the box's height shrinks to the nodes' extent, centred, never zoomed in past
  // 100%. Skipped once the viewer has zoomed or panned.
  // Last pass once the layout settles: push apart any circles that still touch, so none overlap (owner, 2026-11-26:
  // "have no overlaps of nodes"). A few sweeps over a quadtree; dragged (pinned) nodes stay put.
  function separate() {
    const vis = state.data.nodes.filter((n) => visible(n) && Number.isFinite(n.x));
    for (let pass = 0; pass < 8; pass++) {
      let moved = 0;
      const qt = d3.quadtree(vis, (d) => d.x, (d) => d.y);
      for (const a of vis) {
        const ra = collideR(a), reach = ra + 40;
        qt.visit((q, x0, y0, x1, y1) => {
          if (!q.length) {
            for (let b = q; b; b = b.next) {
              const d = b.data;
              if (d !== a && a.index < d.index) {
                const dx = d.x - a.x, dy = d.y - a.y, dist = Math.hypot(dx, dy) || 0.01, min = ra + collideR(d) - 3;
                if (dist < min) {
                  const push = (min - dist) / 2, ux = dx / dist, uy = dy / dist;
                  if (a.fx == null) { a.x -= ux * push; a.y -= uy * push; }
                  if (d.fx == null) { d.x += ux * push; d.y += uy * push; }
                  moved++;
                }
              }
            }
          }
          return x0 > a.x + reach || x1 < a.x - reach || y0 > a.y + reach || y1 < a.y - reach;
        });
      }
      if (!moved) break;
    }
    if (state.draw) state.draw();
  }
  // The space the open key takes on the left of the band (wide screens), so the graph fits beside it.
  const keyInset = () => {
    const box = document.getElementById("net-figcap");
    if (!box || box.hidden || window.innerWidth < 900) return 0;
    const g = document.getElementById("net-graph").getBoundingClientRect();
    return Math.max(0, box.getBoundingClientRect().right - g.left + 16);
  };
  const panelInset = () => {
    const p = document.getElementById("net-panel");
    if (!p || !state.selected || window.innerWidth < 900) return 0;
    const g = document.getElementById("net-graph").getBoundingClientRect();
    return Math.max(0, g.right - p.getBoundingClientRect().left + 16);
  };
  function fitToContent(smooth) {
    if (state.userZoomed || !state.svg || state.view !== "graph") return;
    const vis = state.data.nodes.filter(visible);
    if (!vis.length) return;
    const pad = 24, top = HEADER_H + 10;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of vis) {
      const r = radius(n) + 14;
      x0 = Math.min(x0, n.x - r); x1 = Math.max(x1, n.x + r); y0 = Math.min(y0, n.y - r); y1 = Math.max(y1, n.y + r);
    }
    // Fit the whole graph inside the strip (left of the panel on wide screens), centred, never past 100%.
    const inset = keyInset();
    const right = panelInset();
    const W = state.size.width - inset - right, H = state.size.height;
    const k = Math.min(1, (W - 2 * pad) / Math.max(1, x1 - x0), (H - top - pad) / Math.max(1, y1 - y0));
    const t = d3.zoomIdentity.translate(inset + (W - (x1 - x0) * k) / 2 - x0 * k, top + (H - top - pad - (y1 - y0) * k) / 2 - y0 * k).scale(k);
    if (smooth && !REDUCED_MOTION) state.svg.transition().duration(450).call(state.zoom.transform, t);
    else state.svg.call(state.zoom.transform, t);
  }
  // A later change (another view, types shown or hidden, new settings): run most of the new layout off-screen,
  // then let it glide the rest of the way, heavily damped, instead of jumping.
  function settleGently(sim) {
    sim.stop();
    sim.alpha(0.5).tick(120);
    if (state.draw) state.draw();
    sim.velocityDecay(0.7).alpha(0.05).restart();
  }
  // Re-aim the grouping forces after layers change, then let the layout settle again.
  function regroup() {
    if (!state.sim) return;
    // Showing or hiding types changes how many nodes there are: resize the box when it should change by over 12%.

    drawAxis();
    const { width, height } = state.size;
    state.sim.force("gx").x((d) => ovalTarget(d).x * width);
    state.sim.force("gy").y((d) => ovalTarget(d).y * height);
    if (REDUCED_MOTION) { state.sim.alpha(1).stop(); state.sim.tick(300); state.draw(); } else settleGently(state.sim);
  }
  const groupY = (d) => {
    if (TOP_BAND.includes(d.kind)) return 0.06;
    // A person's row is their organization's row, nudged by organization so colleagues form one cluster and
    // different organizations in the same row sit apart.
    if (d.kind === "person") {
      const o = d._org || state.byId.get(d.org_id);
      if (o && o.kind !== "person") {
        let h = 0;
        for (const ch of String(o.id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        return Math.max(0.12, Math.min(0.94, groupY(o) + ((h % 11) - 5) * 0.014));
      }
      return 0.55;
    }
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
  // People cluster by employer (owner, 2026-11-27: "group the individual actors in clusters dependent on the company
  // they work for"): each person is pulled toward the height of the organization they work at, so colleagues sit
  // together beside their organization. Read live each tick, since the organizations move as the layout settles.
  function employerForce() {
    let people = [];
    const f = (alpha) => {
      for (const p of people) {
        const o = p._org;
        if (!o || !Number.isFinite(o.y)) continue;
        p.vy += (o.y - p.y) * 0.35 * alpha;
      }
    };
    f.initialize = (nodes) => {
      const byId = new Map(nodes.map((n) => [n.id, n]));
      const orgOf = new Map(state.data.links.filter((l) => l.relation === "works at").map((l) => [typeof l.source === "object" ? l.source.id : l.source, typeof l.target === "object" ? l.target.id : l.target]));
      people = nodes.filter((n) => n.kind === "person");
      people.forEach((p) => { p._org = byId.get(orgOf.get(p.id)); });
    };
    return f;
  }
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
    try { return { ...defaults, ...JSON.parse(sessionStorage.getItem(SETTINGS_KEY) || "{}") }; } catch (e) { return { ...defaults }; }
  }
  function saveSettings() {
    try { sessionStorage.setItem(SETTINGS_KEY, JSON.stringify(state.cfg)); } catch (e) {}
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
          ${catList().length ? `<label class="gs-check"><input type="checkbox" data-gs-check="catColor"${state.cfg.catColor ? " checked" : ""}> Color proposals by what they ask about</label>` : ""}
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
    sim.force("collide").radius(collideR);
    sim.force("x").strength(state.cfg.center);
    sim.force("y").strength(state.cfg.center * 1.25);
    sim.force("gx").strength(Math.min(1, state.cfg.group * 1.8));
    sim.force("gy").strength(state.cfg.group * 0.8);
    drawAxis();
    // Sliders fire continuously, so no off-screen pass here: a damped restart keeps the motion gentle.
    if (REDUCED_MOTION) { sim.alpha(1).stop(); sim.tick(300); state.draw(); } else sim.velocityDecay(0.6).alpha(0.3).restart();
  }
  const linkBase = (l) => (l.relation === "member of" ? 90 : l.relation === "proposal at" ? 55 : l.relation === "works at" ? 22 : 45);
  const endId = (x) => (typeof x === "object" ? x.id : x);

  function shell(el) {
    el.innerHTML = `
      <h2>AI advocacy network</h2>
      <p class="count-line">Connections: sourced relationships among investors, coalitions, companies and frontier labs. Proposals: the AI shareholder proposals filed at each company, with their filers. Company–lab ties alone: AI value chain › Listed companies tied to each lab.</p>
      <!-- One view for everyone (owner, 2026-11-26: "maybe it's not necessary to have different view settings"); old ?lens= links still open their view. -->
      <fieldset class="lens-pick" id="net-lens" hidden><legend>View as</legend>${Object.entries(window.LENSES || {}).map(([id, l]) =>
        `<label class="chip"><input type="radio" name="net-lens" value="${esc(id)}"${id === state.lens ? " checked" : ""}> ${esc(l.label)}</label>`).join("")}</fieldset>
      <p class="visually-hidden" id="net-lens-status" aria-live="polite"></p>
      <section id="net-feed" class="net-feed" aria-labelledby="lf-h" hidden></section>
      <div id="net-graph-area">
      <button type="button" class="chip" id="lf-back" hidden>Back to the list</button>
      <p class="intro" id="net-intro"></p>
      <div class="net-controls">
        <input type="search" id="net-search" placeholder="Search an organization or company" aria-label="Search the network">
        <select id="net-topic" aria-label="Topic"><option value="">All topics</option></select>
        <select id="net-year" aria-label="Filter by year"><option value="">All years</option></select>
        <div class="seg" role="group" aria-label="View">
          <button type="button" data-view="graph" aria-pressed="true">Graph</button>
          <button type="button" data-view="list" aria-pressed="false">List</button>
        </div>
      </div>
      <div class="net-tools">
        <button type="button" class="tool" id="net-hold-btn" aria-expanded="false" aria-controls="net-hold">Your portfolio</button>
        <button type="button" class="tool" id="net-gaps" aria-pressed="false">Show asks not yet filed</button>
      </div>
      <div id="net-hold" class="net-hold port" hidden>
        <h4 class="port-h">Your portfolio</h4>
        <p class="status-note">Choose the companies you hold, or load an investor's reported holdings, to see their frontier labs, the investors already filing there, coalitions and upcoming votes. Stored in this browser only; nothing is sent.</p>
        <div class="port-row"><label for="net-hold-inv">Load an investor's reported holdings</label> <select id="net-hold-inv"><option value="">Choose an investor</option></select></div>
        <fieldset class="port-pick"><legend>Or choose companies</legend><div id="net-hold-cos" class="port-cos"></div></fieldset>
        <details class="port-paste"><summary>Paste tickers instead</summary>
          <label for="net-hold-input" class="visually-hidden">Tickers, separated by commas, spaces or new lines</label>
          <textarea id="net-hold-input" rows="3" spellcheck="false" autocapitalize="characters" placeholder="MSFT, GOOGL, NVDA"></textarea></details>
        <div class="net-hold-row"><button type="button" class="tool" id="net-hold-apply">Show my portfolio</button> <button type="button" class="tool" id="net-hold-clear">Clear</button></div>
      </div>
      <p class="count-line" id="net-hold-status" aria-live="polite"></p>
      <div id="net-legend" class="net-legend"></div>
      <div id="net-catkey" class="net-legend" hidden></div>
      <div id="net-marks" class="net-legend net-marks" hidden></div>
      <details id="net-settings" class="graph-settings"></details>
      <div class="net-views">
        <p class="eyebrow" id="net-kind"></p>
        <div class="seg" role="group" aria-label="Graph view" id="net-mode">${Object.entries(MODES).map(([id, m]) => `<button type="button" data-mode="${id}" aria-pressed="${id === state.mode}">${esc(m.label)}</button>`).join("")}</div>
        <div class="seg" role="group" aria-label="Proposals shown" id="net-pstatus"${state.mode === "proposals" ? "" : " hidden"}>${pstatusButtons()}</div>
        <p class="count-line" id="net-mode-note"></p>
      </div>
      <div class="net-body is-graph">
        <div class="net-graph-wrap">
          <div id="net-graph" class="net-graph" tabindex="0" role="application" aria-roledescription="network graph" aria-describedby="net-kb-hint" aria-label="AI advocacy network graph: investors, proposals, companies, labs and policy. Up and Down arrows move between nodes, Enter opens one, Escape clears. The List view has the same data as a table."></div>
          <div class="net-keybox">
            <button type="button" class="net-key-btn" id="net-key-btn" aria-expanded="false" aria-controls="net-figcap">Key</button>
            <div class="net-figcap" id="net-figcap" hidden></div>
          </div>
          <p class="kb-hint" id="net-kb-hint">Keyboard: Tab into the graph, ↑ ↓ to move between nodes, Enter to open, Esc to clear. Zoom: pinch, or Ctrl/⌘ + scroll; drag to pan.</p>
          <p class="visually-hidden" id="net-kb" aria-live="polite"></p>
        </div>
        <div id="net-list" class="net-list" hidden></div>
        <aside id="net-panel" class="net-panel" aria-label="Selected item" data-lenis-prevent><p class="status-note">Select an organization, person, proposal or company for its connections and sources.</p></aside>
      </div>
      <div class="scrub" id="net-scrub">
        <label for="net-upto">Timeline: the network as it stood at the end of <span id="net-upto-val"></span></label>
        <input type="range" id="net-upto" step="1">
        <button type="button" class="chip" id="net-play">Play</button>
        <p class="status-note" id="net-scrub-note"></p>
        <p class="status-note">Drag the slider back for earlier years, or press Play to build the network year by year.</p>
        <p class="visually-hidden" id="net-scrub-status" aria-live="polite"></p>
      </div>
      <section id="net-portfolio" class="net-portfolio" aria-labelledby="net-port-h" hidden></section>
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
  const longDate = (iso) => window.DATES.long(iso);
  function feedShell() {
    const F = lens().feed;
    const box = document.getElementById("net-feed");
    const d0 = [];
    const introP = `<p class="intro">Upcoming votes on AI-related ${term("shareholder proposal", "shareholder proposals", d0)} at the ${term("annual meeting", "annual meetings", d0)} of the companies tracked.</p>${d0.join("")}`;
    box.innerHTML = `
      <h3 id="lf-h">Upcoming AI proposals in this tracker</h3>
      ${introP}
      ${state.ctx.disclaimer ? `<p class="status-note">${esc(state.ctx.disclaimer)}</p>` : ""}
      <form role="search" id="lf-form" class="feed-form">
        <label for="lf-in">Your tickers or fund name</label>
        <div class="feed-row"><input id="lf-in" type="text" autocomplete="off" spellcheck="false" aria-describedby="lf-hint">
        <button type="submit" class="chip">Show</button></div>
        <p id="lf-hint" class="status-note">Stock tickers, not company names, separated by commas; for example: MSFT, AAPL, Vanguard. Tickers entered here also set My holdings in the graph. Stored in this browser only.</p>
      </form>
      <p id="lf-status" class="count-line" aria-live="polite"></p>
      <button type="button" class="chip" id="lf-to-graph">See the bigger picture</button>
      <div id="lf-list"></div>`;
    let fund = "";
    try { fund = sessionStorage.getItem("fund") || ""; } catch (e) {}
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
      try { if (m.family) sessionStorage.setItem("fund", m.family); else sessionStorage.removeItem("fund"); } catch (e) {}
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
  // Proposal categories (asks.json), used when "Color proposals by what they ask about" is on.
  const catList = () => ((window.LENS_CTX && window.LENS_CTX.categories) || []).filter((c) => state.data.nodes.some((n) => n.kind === "proposal" && n.category === c.id));
  // Nodes in the site's one blue (#1f4e98) are only 2.1:1 on the dark canvas, so they get a thin light
  // outline that carries them to 3:1 or more (owner, 2026-11-26: "any blue you have … this color blue").
  const edgeOf = (d) => {
    const f = String(fillOf(d)).toLowerCase().replace(/\s/g, "");
    return f === cssVar("--blue").toLowerCase() ? cssVar("--g-label-soft") : cssVar("--g-bg");
  };
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
    el.innerHTML = on ? `<span class="status-note">Proposals by what they ask about:</span> <button type="button" class="tool leg-all" data-cat-all="1">Show all <span aria-hidden="true">↺</span></button>${catList().map((c) => chip("data-cat", c.id, catState(c.id), cssVar(`--gn-cat-${c.id}`), c.label)).join("")}` : "";
  }
  // Key chips have three states, cycled by clicking (owner, 2026-11-26: "you click it all lights up of the
  // category vs click again and it cross it off"): shown → highlighted (the rest of the graph dims) →
  // crossed off (hidden) → shown. "Show all" puts every chip back to shown.
  const KEY_NEXT = { on: "lit", lit: "off", off: "on" };
  const KEY_SAY = { on: "shown", lit: "highlighted", off: "hidden" };
  const kindState = (k) => (state.hiddenKinds.has(k) ? "off" : state.litKinds.has(k) ? "lit" : "on");
  const catState = (c) => (state.hiddenCats.has(c) ? "off" : state.litCats.has(c) ? "lit" : "on");
  const chip = (attr, id, st, color, label) =>
    `<button type="button" class="leg" ${attr}="${esc(id)}" data-state="${st}" aria-pressed="${st === "lit"}"><span class="dot" style="background:${color}"></span><span class="leg-text">${esc(label)}</span><span class="visually-hidden">, ${KEY_SAY[st]}</span></button>`;
  function syncLegend() {
    document.querySelectorAll("#net-legend .leg").forEach((b) => {
      const st = kindState(b.dataset.kind);
      b.dataset.state = st;
      b.setAttribute("aria-pressed", String(st === "lit"));
      const sr = b.querySelector(".visually-hidden");
      if (sr) sr.textContent = `, ${KEY_SAY[st]}`;
    });
  }
  function legend(data) {
    // The key lists only the types the current view can show.
    const kinds = [...new Set(data.nodes.map((n) => n.kind))].filter((k) => !mode().hides.has(k));
    // Rainbow order (owner, 2026-11-27): by hue, red → orange → yellow → green → blue → violet → pink; pale and
    // grey types (low saturation) come last.
    const hsl = (hex) => {
      const m = String(hex).trim().match(/^#?([0-9a-f]{6})$/i);
      if (!m) return { h: 999, s: 0 };
      const n = parseInt(m[1], 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, l = (mx + mn) / 2;
      const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
      let h = 0;
      if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h = (h * 60 + 360) % 360;
      if (h > 350) h -= 360; // near-red hues count as red; pinks come after violet
      return { h, s: s * (l > 0.85 ? 0.3 : 1) };
    };
    const rank = (k) => { const c = hsl(nodeColor(k)); return c.s < 0.35 ? 1000 + c.h : c.h; };
    kinds.sort((a, b) => rank(a) - rank(b) || kindLabel(a).localeCompare(kindLabel(b)));
    document.getElementById("net-legend").innerHTML = `<button type="button" class="tool leg-all" data-all="1">Show all <span aria-hidden="true">↺</span></button>` +
      kinds.map((k) => chip("data-kind", k, kindState(k), nodeColor(k), kindLabel(k))).join("");
  }

  // One plain line: how much is shown, and what node size means. Recomputed when layers change.
  // Counts for the intro and status lines. The total is the data's own nodes; recurring asks (Policymaker lens)
  // and "asks not yet filed" are added by the site, so they are counted on their own instead of changing the
  // total (a reviewer saw 906 in one line and 918 in another).
  const ADDED = new Set(["ask", "gap"]);
  function counts() {
    const base = state.data.nodes.filter((n) => !ADDED.has(n.kind));
    const shown = base.filter(visible).length;
    const asks = state.data.nodes.filter((n) => n.kind === "ask" && visible(n)).length;
    const gaps = state.data.nodes.filter((n) => n.kind === "gap" && visible(n)).length;
    const extra = [asks && `${asks} recurring ask${asks === 1 ? "" : "s"}`, gaps && `${gaps} ask${gaps === 1 ? "" : "s"} not yet filed`].filter(Boolean);
    return { shown, total: base.length, extra: extra.length ? `, plus ${extra.join(" and ")}` : "" };
  }
  // Key panel (owner, 2026-11-26: a "Key" at the bottom that opens the key "in an aesthetically balanced way so
  // that you have all the info in one screenshottable section"). Closed by default, so the band stays nodes only.
  function figCap() {
    const el = document.getElementById("net-figcap");
    if (!el || el.hidden) return;
    const c = counts();
    const [lo, hi] = yearRange();
    const yrs = state.year ? state.year : `${lo}–${state.upto || hi}`;
    const kinds = [...new Set(state.data.nodes.filter(visible).map((n) => n.kind))].filter((k) => !mode().hides.has(k));
    const mk = document.getElementById("net-marks");
    const marks = mk && !mk.hidden ? [...mk.querySelectorAll(".leg")].map((e) => `<span>${e.innerHTML}</span>`) : [];
    const you = state.holdings.size && state.portInvestor && state.byId.get(state.portInvestor);
    el.innerHTML = `<p class="fc-title">AI shareholder advocacy network: ${esc(mode().label)} view, ${esc(yrs)}</p>
      <p class="fc-sub">${c.shown} of ${c.total} investors, people, proposals and companies shown${esc(c.extra)}. Circle size = ${esc(lens().sizeLabel)}. Lines are sourced ties.${you ? ` Glowing white: ${esc(you.label)}, with its holdings and ties lit.` : ""}</p>
      <div class="fc-key">${kinds.map((k) => `<span><i style="background:${nodeColor(k)}"></i>${esc(kindLabel(k))}</span>`).join("")}</div>
      ${marks.length ? `<div class="fc-key fc-marks">${marks.join("")}</div>` : ""}
      <p class="fc-src">Source: SEC filings, proxy statements, coalition and investor records, cited in each item's details. ${esc(typeof FIG_SITE !== "undefined" ? FIG_SITE : "")}.</p>`;
  }
  function wireKey() {
    const btn = document.getElementById("net-key-btn"), box = document.getElementById("net-figcap");
    if (!btn) return;
    btn.addEventListener("click", () => {
      box.hidden = !box.hidden;
      btn.setAttribute("aria-expanded", String(!box.hidden));
      btn.textContent = box.hidden ? "Key" : "Hide key";
      figCap();
      // The key docks on the left; the graph slides over to fit beside it (and back when it closes).
      fitToContent(true);
    });
  }
  function intro() {
    figCap();
    refreshConnected();
    const c = counts();
    document.getElementById("net-intro").textContent = lens().plainIntro
      ? lens().plainIntro(c.shown, c.total)
      : `${c.shown} of ${c.total} organizations, people, proposals and companies shown${c.extra}. Circle size = ${lens().sizeLabel}. Company roles are this site's reading of each company's main role in AI.`;
  }

  // Neighbors through links drawn in the current view only, so everything that lights up on hover or selection
  // has a visible line to the node (owner, 2026-11-27: some lit nodes had no "relational string").
  // Nodes within `depth` steps of a node, through lines drawn in this view. One click on a node shows its direct
  // connections; each further click on it reaches one step further (owner, 2026-11-26: "one click lights only
  // Parnassus … one more makes it so you can see all connections to Parnassus and so on").
  function neighbors(id, depth = 1) {
    const s = new Set([id]);
    let frontier = new Set([id]);
    for (let d = 0; d < depth && frontier.size; d++) {
      const next = new Set();
      state.data.links.forEach((l) => {
        if (!inMode(l) || !visible(l.source) || !visible(l.target)) return;
        if (frontier.has(l.source.id) && !s.has(l.target.id)) next.add(l.target.id);
        if (frontier.has(l.target.id) && !s.has(l.source.id)) next.add(l.source.id);
      });
      next.forEach((x) => s.add(x));
      frontier = next;
    }
    return s;
  }
  // Click on a node: the first click opens it with its direct connections; clicking it again reaches one step further.
  function selectNode(d) {
    const again = state.selected === d.id;
    const wasOpen = !!state.selected;
    // Owner, 2026-11-27: first click lights direct connections, the second reaches one step further, the third
    // returns to the full network.
    if (again && (state.depth || 1) >= 2) { clearSelection(); return; }
    state.depth = again ? 2 : 1;
    state.selected = d.id;
    if (!again) showPanel(d);
    applyStyles();
    if (!wasOpen) fitToContent(true);
    const n = neighbors(d.id, state.depth).size - 1;
    say(state.depth === 1
      ? `Opened ${d.label}: ${n} direct connection${n === 1 ? "" : "s"} lit. Click it again to reach one step further.`
      : `${d.label}: ${n} nodes within 2 steps lit. Click again to return to the full network.`);
    const hint = document.getElementById("net-depth");
    if (hint) hint.textContent = state.depth === 1 ? "Showing direct connections. Click the node again to reach one step further." : "Showing connections up to 2 steps away. Click the node again to return to the full network.";
  }
  function clearSelection() {
    const wasOpen = !!state.selected;
    state.selected = null; state.hover = null; state.kbId = null; state.depth = 1;
    applyStyles(); placeFocusMark();
    document.getElementById("net-panel").innerHTML = `<p class="status-note">Select an organization, person, proposal or company for its connections and sources.</p>`;
    if (wasOpen) fitToContent(true);
    say("Selection cleared");
  }

  function showPanel(n) {
    if (state.path && state.path.from !== n.id) state.path = null;
    const rel = state.data.links.filter((l) => l.source.id === n.id || l.target.id === n.id).map((l) => {
      const other = l.source.id === n.id ? l.target : l.source;
      const rel = l.relation === "coverage" ? (l.coverage === "full" ? "covers (this site's reading)" : "partially covers (this site's reading)") : l.relation;
      const dir = l.source.id === n.id ? rel : `${rel} (from)`;
      const c = conf(l);
      // Memberships and focus lists carry the date the source listed them, so they don't read as current.
      const asOf = l.as_of ? ` <span class="ticker">(${l.relation === "member of" ? "listed as a member" : "listed"} as of ${esc(window.DATES.long(String(l.as_of).slice(0, 7)))}${l.note ? "; " + esc(l.note) : ""})</span>` : "";
      if (l.relation === "missing") return `<li><button type="button" class="linklike" data-id="${esc(other.id)}">${esc(other.label)}</button> <span class="ticker">topic not filed</span> <span class="conf">· none in this dataset</span></li>`;
      // Direct engagements reported by the investor list their steps (date, what happened, source and page).
      const steps = Array.isArray(l.steps) && l.steps.length
        ? `<ol class="eng-steps">${l.steps.map((st) => `<li><span class="nowrap">${esc(st.date || "")}</span>: ${esc(st.title || "")} ${link(st.source_url)}${st.source_page ? ` <span class="ticker">${/[,-]/.test(st.source_page) ? "pp." : "p."} ${esc(String(st.source_page).replace("-", "–"))}</span>` : ""}</li>`).join("")}</ol>${l.reported_by ? `<span class="ticker">Reported by ${esc(l.reported_by)}; not independently confirmed.</span>` : ""}`
        : "";
      return `<li><button type="button" class="linklike" data-id="${esc(other.id)}">${esc(other.label)}</button> <span class="ticker">${esc(dir)}</span> <span class="conf conf-${c.level}">· ${c.level === "inferred" ? "no source, " + esc(c.text) : "source: " + esc(c.text)}</span>${asOf}${l.source_url ? " " + link(l.source_url) : ""}${steps}</li>`;
    }).join("");
    // "What you can do": from the active lens; left out when the lens has nothing for this node.
    const acts = actions(n);
    const actHtml = acts.length ? `<section class="net-actions" aria-labelledby="net-actions-h"><h4 id="net-actions-h">${esc((lens().actionsHeadingFor && lens().actionsHeadingFor(n)) || lens().actionsHeading || "Engagement levers")}</h4><ul>${acts.map((a, i) => `<li>${actionHtml(a, n.id, i)}</li>`).join("")}</ul></section>` : "";
    const ringHtml = rings(n).map((r) => `<p class="ring-note ring-${esc(r.kind)}">${esc(r.text)}</p>`).join("");
    let facts = "";
    if (n.kind === "proposal") {
      facts = `<p><strong>Status:</strong> ${esc(n.status)}${n.support_pct != null ? ` · <strong>Support:</strong> ${esc(n.support_pct)}%` : ""}</p>
               <p><strong>Topic:</strong> ${esc(n.topic)} ${link(n.source_url, "filing")}</p>`;
    } else if (n.kind === "person") {
      facts = `<p>${esc(n.title)}, ${esc(n.org_name)}</p>${n.ai_focus ? `<p><strong>AI work:</strong> ${esc(n.ai_focus)}</p>` : ""}<p>${link(n.profile_url, "public profile")}</p>`;
    } else if (["policy", "response", "public", "lab"].includes(n.kind)) {
      facts = `${n.date ? `<p class="ticker">${esc(window.DATES.long(n.date))}${n.actor ? " · " + esc(n.actor) : ""}</p>` : ""}<p>${esc(n.description || "")} ${link(n.source_url)}</p>`;
    } else if (n.kind === "company") {
      facts = `<p>${esc(n.degree)} ${n.degree === 1 ? "connection" : "connections"} in this map.</p>`;
    } else if (n.kind === "ask") {
      facts = `<p class="status-note">Grouped by this site from data/asks.json: proposals that make this ask, across companies and years.</p>`;
    } else if (n.kind === "gap") {
      facts = `<p class="status-note">Computed by this site from the proposals in this dataset; not a statement about filings outside it.</p>`;
    } else {
      facts = `<p>${esc(n.description || "")} ${link(n.source_url)}</p>${n.website ? `<p><a href="${esc(n.website)}" target="_blank" rel="noopener">Website</a></p>` : ""}`;
    }
    const head = `<p class="eyebrow" style="margin:0 0 4px">${esc(TYPE_LABEL[n.kind])}</p><h3>${esc(n.label)}</h3>${ringHtml}`;
    // For an ask, its name and coverage mark come first, so the long figures below are clearly about it.
    // Name and type first (owner, 2026-11-26), then the engagement block, then the facts.
    const top = n.kind === "ask" ? `${head}${facts}${actHtml}` : `${head}${actHtml}${facts}`;
    document.getElementById("net-panel").innerHTML = `
      <button type="button" class="net-close" id="net-close" aria-label="Close details">Close ×</button>
      ${top}
      <p class="ticker net-depth" id="net-depth">Showing direct connections. Click the node again to reach one step further.</p>
      ${pathFinderHtml(n)}
      <h4 style="margin:14px 0 4px;font-size:14px">Connections</h4><ul class="conn">${rel || "<li>None yet</li>"}</ul>`;
    document.querySelectorAll("#net-panel .conn .linklike").forEach((b) => b.addEventListener("click", () => focus(b.dataset.id)));
    wireActions(document.getElementById("net-panel"));
    document.getElementById("net-close").addEventListener("click", clearSelection);
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
    // A node the current view doesn't show: switch to the view that does, and say so.
    if (mode().hides.has(n.kind)) {
      setMode(state.mode === "proposals" ? "connections" : "proposals", false);
      document.getElementById("net-lens-status").textContent = `Switched to the ${mode().label} view to show ${n.label}.`;
    }
    // A node in a hidden layer can't be shown, so switch its layer on first.
    if (state.hiddenKinds.has(n.kind)) {
      state.hiddenKinds.delete(n.kind);
      syncLegend();
      intro();
      regroup();
    }
    // A proposal hidden by Active/Past: show all proposals again.
    if (n.kind === "proposal" && state.pstatus !== "all" && (state.pstatus === "active") !== isActive(n)) {
      state.pstatus = "all";
      document.querySelectorAll("#net-pstatus [data-pstatus]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.pstatus === "all")));
      refreshConnected();
      if (state.drawn) { state.sim.stop(); drawGraph(); }
    }
    // A filer or company with no proposal link isn't drawn in Proposals: show it in Connections instead.
    refreshConnected();
    if (state.mode === "proposals" && !visible(n)) {
      setMode("connections", false);
      document.getElementById("net-lens-status").textContent = `${n.label} has no AI proposal in this data, so it is shown in the Connections view.`;
    }
    state.selected = id;
    showPanel(n);
    applyStyles();
    if (state.zoom && n.x != null) {
      const { width, height } = state.size;
      state.userZoomed = true;
      state.svg.transition().duration(REDUCED_MOTION ? 0 : 500).ease(d3.easeExpOut).call(state.zoom.transform, d3.zoomIdentity.translate(width / 2, (state.fitH || height) / 2).scale(1.6).translate(-n.x, -n.y));
    }
  }

  // The year a node belongs to for the year scrubber: proposals by year, events (ev- nodes) by date.
  const nodeYear = (n) => (n.kind === "proposal" ? Number(n.year) : String(n.id).startsWith("ev-") && n.date ? Number(String(n.date).slice(0, 4)) : null);
  // Two views of the graph (owner, 2026-11-26: "The first tab is how everything is connected to each other, and
  // then the next tab on the graph you switch to is active proposals/past"). docs/plans/2026-11-26-network-views.md.
  // Connections: sourced relationships (no proposals). Proposals: filers → proposals → companies, active or past.
  const MODES = {
    connections: { label: "Connections", eyebrow: "Relationships among investors, companies and labs", hides: () => new Set(["proposal", "ask", "gap"]) },
    // Policy and responses stay in Proposals for the Policymaker lens, whose asks link to them.
    proposals: { label: "Proposals", eyebrow: "Proposals: filers to companies", hides: () => new Set(["lab", "tier-labs", ...(state.lens === "policy" ? [] : ["policy", "response", "public"])]) },
  };
  const mode = () => {
    const m = MODES[state.mode] || MODES.connections;
    return { ...m, hides: m.hides() };
  };
  // An edge belongs to the Proposals view when the data puts it in the proposals layer; every other edge
  // (shareholdings, coalition membership and roles, co-filing partners, employers, colleagues and co-authors,
  // value-chain ties, policy and responses) belongs to Connections.
  // Exempt solicitations aimed at a company (not at one proposal) carry no year or status, so they show only when
  // no proposal filter (Active/Past, year) is set.
  const filtering = () => (state.pstatus && state.pstatus !== "all") || !!state.year || !!state.upto || !!state.topic;
  // Engagement outside the ballot, drawn in the Proposals view beside filings (owner, 2026-11-27).
  const ENGAGE = new Set(["engaged directly", "focus company of", "sought engagement", "lists a member filing at", "made the case at", "announced member filings at", "joined an investor letter to", "wrote to"]);
  // Three line styles for engagement, each in the Key: met the company, wrote to it, or acted through a coalition.
  const LETTER = new Set(["wrote to", "joined an investor letter to", "sought engagement"]);
  const COALITION = new Set(["focus company of", "lists a member filing at", "made the case at", "announced member filings at"]);
  const engageDash = (r) => (r === "engaged directly" ? "7 2 2 2" : LETTER.has(r) ? "6 2 1 2 1 2" : COALITION.has(r) ? "12 4" : null);
  let filerSet = null;
  const filerOrgs = () => {
    if (filerSet) return filerSet;
    filerSet = new Set();
    for (const l of state.data.links) {
      if (!(l.layer === "proposals" && /filer|exempt/.test(l.relation || "")) && !ENGAGE.has(l.relation)) continue;
      for (const e of [l.source, l.target]) { const n = typeof e === "object" ? e : state.byId.get(e); if (n && n.kind !== "proposal" && !isCompanyKind(n.kind)) filerSet.add(n.id); }
    }
    return filerSet;
  };
  const inMode = (l) => {
    const prop = l.layer === "proposals" || (state.lens === "policy" && l.relation === "coverage");
    if (state.mode !== "proposals") return !prop || false;
    // Owner, 2026-11-27: each effort shows the people leading it. A person's "works at" line joins the Proposals view
    // when their organization filed or co-filed a proposal shown there.
    if (l.relation === "works at") return filerOrgs().has(typeof l.target === "object" ? l.target.id : l.target);
    // Private engagement is part of each organization's record (owner, 2026-11-27: "be sure you are getting all
    // engagements for each org and graph them"): direct engagement with a company shows here too. These ties carry
    // no date, so they show at every point of the timeline.
    if (ENGAGE.has(l.relation)) return true;
    if (!prop) return false;
    if (/^exempt solicitation/.test(l.relation || "") && filtering()) {
      const t = typeof l.target === "object" ? l.target : state.byId.get(l.target);
      if (t && t.kind !== "proposal") return false;
    }
    return true;
  };
  const isActive = (p) => p.status === "upcoming";
  function pstatusButtons() {
    const ps = state.data.nodes.filter((n) => n.kind === "proposal");
    const n = { all: ps.length, active: ps.filter(isActive).length, past: ps.filter((p) => !isActive(p)).length };
    const lab = { all: "All", active: "Active", past: "Past" };
    return ["all", "active", "past"].map((k) => `<button type="button" data-pstatus="${k}" aria-pressed="${(state.pstatus || "all") === k}">${lab[k]} (${n[k]})</button>`).join("");
  }
  const MODE_NOTE = {
    connections: "Sourced relationships: shareholdings, coalition memberships, co-filings, employment, company–lab ownership and supply ties, and policy events. Proposals appear in the Proposals view.",
    proposals: "AI shareholder proposals by company, with lead filers, co-filers and exempt solicitations for or against. Active: on a ballot not yet held. Past: voted, withdrawn or excluded. A past proposal's line to its company is green if it succeeded (withdrawn after the company committed to act, or a majority vote) and red if it failed (voted, under 50% support).",
  };
  // Switch the graph between its two views; the layout is rebuilt so it only uses that view's links.
  function setMode(m, announce = true) {
    if (!MODES[m]) m = "connections";
    state.mode = m;
    document.querySelectorAll("#net-mode [data-mode]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
    // The Network and Proposals sections follow the view when the graph changes it (a lens, or focusing a proposal).
    if (window.netTabFollow) window.netTabFollow(m);
    const ps = document.getElementById("net-pstatus");
    if (ps) ps.hidden = m !== "proposals";
    const note = document.getElementById("net-mode-note");
    if (note) note.textContent = MODE_NOTE[m];
    const kind = document.getElementById("net-kind");
    if (kind) kind.textContent = mode().eyebrow;
    // The topic and year filters and the year slider act on proposals, so they show in the Proposals view only.
    ["net-topic", "net-year", "net-scrub"].forEach((id) => { const x = document.getElementById(id); if (x) x.hidden = m !== "proposals"; });
    try {
      const u = new URL(location.href);
      // Only when it differs from the lens's own default view (Policymaker opens on Proposals, the others on Connections).
      const lensDefault = state.lens === "policy" ? "proposals" : "connections";
      if (m === lensDefault) u.searchParams.delete("graph"); else u.searchParams.set("graph", m);
      window.history.replaceState(null, "", u.pathname + u.search + location.hash);
    } catch (e) {}
    state.selected = null; state.path = null;
    // The proposal filters (year, topic, year slider, Active/Past) have no controls in Connections: clear them there.
    if (m === "connections") {
      state.year = ""; state.topic = ""; state.upto = null; state.pstatus = "all";
      if (state.ctx) { state.ctx.upto = null; state.ctx.cache = {}; }
      ["net-topic", "net-year"].forEach((x) => { const el = document.getElementById(x); if (el) el.value = ""; });
      document.querySelectorAll("#net-pstatus [data-pstatus]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.pstatus === "all")));
      if (typeof scrubSync === "function") scrubSync();
    }
    // Unlinked nodes never show in Proposals, so the Orphans setting is switched off there.
    const orph = document.querySelector("[data-gs-check=orphans]");
    if (orph) { orph.disabled = m === "proposals"; orph.title = m === "proposals" ? "The Proposals view never shows unlinked nodes." : ""; }
    legend(state.data);
    syncLegend();
    refreshConnected();
    if (state.drawn) { state.sim.stop(); drawGraph(); }
    if (state.view === "list") drawList();
    intro();
    holdStatus();
    portfolioSummary();
    markKey();
    if (announce) document.getElementById("net-lens-status").textContent = `${mode().label} view: ${counts().shown} of ${counts().total} nodes shown${counts().extra}.`;
  }
  function baseVisible(n) {
    if (n.kind === "gap") { const c = state.byId.get(n.gapFor); return !!c && baseVisible(c); }
    if (n.kind === "proposal" && state.hiddenCats && state.cfg.catColor && n.category && state.hiddenCats.has(n.category)) return false;
    if (state.upto) {
      const y = nodeYear(n);
      if (y && y > state.upto) return false;
      if (n.kind === "ask" && !state.data.nodes.some((p) => p.kind === "proposal" && p.ask_id === n.id && Number(p.year) <= state.upto)) return false;
    }
    if (state.hiddenKinds.has(n.kind)) return false;
    if (mode().hides.has(n.kind)) return false;
    if (n.kind === "proposal" && state.pstatus && state.pstatus !== "all" && (state.pstatus === "active") !== isActive(n)) return false;
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
      if (!inMode(l)) return;
      const a = byId.get(endId(l.source)), b = byId.get(endId(l.target));
      if (a && b && baseVisible(a) && baseVisible(b)) { state.connected.add(a.id); state.connected.add(b.id); }
    });
  }
  // In the Proposals view a filer or company shows only when a proposal links it in (orphans never show there).
  function visible(n) {
    return baseVisible(n) && ((state.cfg.orphans && state.mode !== "proposals") || state.connected.has(n.id));
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

  // A node counts as highlighted when no chip is lit, or its type (or, with category colours on, its proposal
  // category) is lit.
  function isLit(d) {
    const anyKind = state.litKinds && state.litKinds.size, anyCat = state.cfg.catColor && state.litCats && state.litCats.size;
    if (!anyKind && !anyCat) return true;
    if (anyKind && state.litKinds.has(d.kind)) return true;
    return !!(anyCat && d.kind === "proposal" && state.litCats.has(d.category));
  }
  function applyStyles() {
    refreshConnected();
    const focusId = state.hover || state.selected;
    const near = focusId ? neighbors(focusId, focusId === state.selected ? state.depth || 1 : 1) : null;
    const q = state.query;
    const P = state.path;
    // Portfolio: held companies stay lit, with everything they link to in this view (labs, filers, coalitions)
    // and the investor whose holdings were loaded; the rest fades.
    const reach = state.holdings.size ? portfolioReach() : null;
    const held = (d) => !state.holdings.size || isHeld(d) || reach.has(d.id);
    const nodeOpacity = (d) => {
      if (P) return P.nodes.has(d.id) ? 1 : 0.12;
      let o = 1;
      // A chosen node's network wins over a search: clicking another node dims the searched one.
      if (near) o = near.has(d.id) ? 1 : 0.12;
      else if (q) o = d.label.toLowerCase().includes(q) ? 1 : 0.12;
      // Highlighted key chips: everything outside the highlighted types (or proposal categories) dims.
      if (!isLit(d) && d.id !== focusId) o = Math.min(o, 0.12);
      // A chosen node's connections keep their full colour; otherwise the holdings overlay fades what isn't held.
      if (near && near.has(d.id)) return o;
      return held(d) || d.id === focusId ? o : Math.min(o, 0.15);
    };
    // The fund you chose to play as (Your portfolio → Load an investor's holdings) glows white with a thick ring,
    // so it stands apart from every other coloured node (owner, 2026-11-26: "a specialness to the fund you selected").
    // The fund you play as stands out until you choose another node; then that node's network takes over.
    const you = state.holdings.size && state.portInvestor && !(near && !near.has(state.portInvestor)) ? state.portInvestor : null;
    state.node.attr("display", (d) => (visible(d) ? null : "none"))
      .classed("is-you", (d) => d.id === you)
      .attr("opacity", nodeOpacity)
      .attr("stroke", (d) => (d.id === you || d.id === state.selected || (state.holdings.size && isCompanyKind(d.kind) && isHeld(d)) ? cssVar("--g-focus") : d.kind === "gap" ? cssVar("--g-label-soft") : edgeOf(d)))
      .attr("stroke-width", (d) => (d.id === you ? 3.5 : d.id === state.selected ? 2.5 : state.holdings.size && isCompanyKind(d.kind) && isHeld(d) ? 2 : d.kind === "gap" ? 1.5 : 1));
    if (state.ringSel) state.ringSel.attr("display", (d) => (visible(d) ? null : "none")).attr("opacity", nodeOpacity);
    state.linkSel.attr("display", (l) => (inMode(l) && visible(l.source) && visible(l.target) ? null : "none"))
      .attr("stroke-opacity", (l) => {
        if (P) return P.links.has(l) ? 0.95 : 0.03;
        // Owner, 2026-11-27 ("why are all the spider webs lit up"): one click lights only the node's own lines; lines
        // between its neighbours light only after a second click reaches further.
        if (near) return l.source.id === focusId || l.target.id === focusId ? 0.9 : (focusId === state.selected && (state.depth || 1) > 1 && near.has(l.source.id) && near.has(l.target.id)) ? 0.4 : 0.03;
        if (q) return 0.08;
        // Portfolio: the lines from held companies stand out; the rest go quiet.
        if (reach) return l.source.id === you || l.target.id === you ? 0.95 : isHeld(l.source) || isHeld(l.target) ? 0.6 : 0.03;
        if (outcomeColor(l)) return 0.85;
        return isLit(l.source) || isLit(l.target) ? 0.45 : 0.04;
      })
      .attr("stroke-width", (l) => (P && P.links.has(l) ? 2.5 : you && (l.source.id === you || l.target.id === you) ? 1.8 : (l.relation === "lead filer" ? 1.4 : 1)) * state.cfg.linkScale)
      .attr("stroke", (l) => (you && (l.source.id === you || l.target.id === you) ? cssVar("--g-focus") : outcomeColor(l)));
    const fewShown = state.data.nodes.filter(visible).length <= 25;
    state.labels.attr("display", (d) => (visible(d) ? null : "none"))
      .attr("opacity", (d) => {
        if (P) return P.nodes.has(d.id) ? 1 : 0;
        if (!held(d) && d.id !== focusId) return 0;
        if (near) return near.has(d.id) ? 1 : 0;
        if (q) return d.label.toLowerCase().includes(q) ? 1 : 0;
        if (!isLit(d)) return 0;
        // Portfolio: name each held company and the investor whose holdings were loaded.
        if (d.id === you) return 1;
        if (reach && isCompanyKind(d.kind) && isHeld(d) && !state.hiddenLabels.has(d.id)) return 1;
        // Highlighted types: name every highlighted node when there are 25 or fewer.
        if ((state.litKinds.size || (state.cfg.catColor && state.litCats.size)) && state.data.nodes.filter((n) => visible(n) && isLit(n)).length <= 25) return 1;
        // Labels are off by default; selecting a node (or hovering, or keyboard focus) names it and its connections.
        // Recurring asks (Policymaker lens) are always named: there are only a dozen and they are the point of the view.
        if (d.kind === "ask") return 1;
        // A small view (25 nodes or fewer, e.g. after "only") has room to name every node.
        if (fewShown) return 1;
        return state.cfg.labels && labelCandidate(d) && !state.hiddenLabels.has(d.id) ? 1 : 0;
      })
      // The clicked (or hovered, or keyboard-focused) node's own label stands out from its neighbours' labels
      // (owner, 2026-11-26): larger, bold, white on a blue pill; the neighbours' labels go a softer grey.
      .attr("font-size", (d) => (d.kind === "company" ? state.cfg.textSize + 2 : state.cfg.textSize) + (d.id === focusId || d.id === you ? 3 : 0))
      .attr("font-weight", (d) => (d.id === focusId ? 500 : d.kind === "company" ? 500 : 400))
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
    const vy1 = ((state.fitH || height) - t.y) / t.k;
    const focusId = state.selected || state.hover || state.kbId;
    const items = [];
    state.labels.each(function (d) {
      if (this.getAttribute("display") === "none" || Number(this.getAttribute("opacity")) === 0 || d.x == null) return;
      items.push({ d, el: this });
    });
    const rank = (d) => (d.id === focusId ? 0 : d.id === state.hover || d.id === state.kbId ? 1 : isCompanyKind(d.kind) ? 2 : 3);
    items.sort((a, b) => rank(a.d) - rank(b.d) || (b.d.degree || 0) - (a.d.degree || 0));
    const placed = [];
    // Every shown node counts as an obstacle, with its rings, so no label prints over a circle or a ring (owner,
    // 2026-11-27: "dont have this kind of overlap in text and graphics").
    const ringPad = (d) => (rings(d).length ? 12 : 0);
    // With a node selected, the faded nodes (12% opacity) stay out of the count so its connections can still be named.
    const lit = focusId ? neighbors(focusId, focusId === state.selected ? state.depth || 1 : 1) : null;
    const circles = state.data.nodes.filter((d) => d.x != null && visible(d) && (!lit || lit.has(d.id))).map((d) => ({ x: d.x, y: d.y, r: radius(d) + ringPad(d) }));
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
      const r = radius(d) + 4 + ringPad(d);
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
  // Key for the marks drawn around nodes (owner asked what the "!" marks are): only marks that appear in the
  // current lens and view, each with a small swatch on the graph's dark background.
  // Outcome of a past proposal, on its line to the company (owner, 2026-11-26: "indicate if it failed or succeeded
  // … the line could be green or red"). Success: withdrawn after the company committed to act, or a majority vote.
  // Not passed: voted with under 50% support. Excluded, or withdrawn with no agreement on record: no colour.
  // Read from proposals.json status, support and the stated reason for a withdrawal.
  let outcomeById = null;
  function outcomeOf(n) {
    if (!n || n.kind !== "proposal") return null;
    if (!outcomeById) {
      outcomeById = new Map();
      ((window.LENS_CTX && window.LENS_CTX.proposals) || []).forEach((p) => {
        let o = null;
        // The data's own outcome field (proposals.json, set from the commitments ledger) wins when present.
        if (p.outcome) o = p.outcome === "commitment" || p.outcome === "majority" ? "won" : p.outcome === "below_majority" ? "lost" : null;
        else if (p.status === "voted" && p.support_pct != null) o = p.support_pct >= 50 ? "won" : "lost";
        else if (p.status === "withdrawn" && /commit|agreed|agreement/i.test(p.status_reason || "")) o = "won";
        outcomeById.set(p.id, o);
      });
    }
    return outcomeById.get(n.sec_id || n.id) || null;
  }
  const outcomeColor = (l) => {
    if (state.mode !== "proposals" || l.relation !== "proposal at") return null;
    const o = outcomeOf(l.source) || outcomeOf(l.target);
    return o === "won" ? cssVar("--g-window") : o === "lost" ? "#f87171" : null;
  };
  const MARK_KEY = {
    upcoming: { label: "On a ballot not yet held", svg: (c) => `<circle cx="12" cy="9" r="6" fill="none" stroke="${c.ring}" stroke-width="1.5" stroke-dasharray="3 2"/>` },
    deadline: { label: "Proposal filing deadline open; the arc shows the time left", svg: (c) => `<circle cx="12" cy="9" r="6" fill="none" stroke="${c.win}" stroke-width="1.2"/><path d="M12,3A6,6 0 0 1 18,9" fill="none" stroke="${c.win}" stroke-width="2.5" stroke-linecap="round"/>` },
    risk: { label: "Support near or below the SEC refiling threshold (this site's reading)", svg: (c) => `<circle cx="12" cy="9" r="3" fill="#facc15"/><circle cx="12" cy="9" r="6.5" fill="none" stroke="${c.risk}" stroke-width="1.6" stroke-dasharray="2.5 1.6"/>` },
    seeking: { label: "Filer seeking co-filers or support", svg: (c) => `<circle cx="12" cy="9" r="6" fill="none" stroke="${c.seek}" stroke-width="1.5" stroke-dasharray="1 2.5" stroke-linecap="round"/>` },
    "cov-covered": { label: "Ask already required by a rule in this map", svg: (c) => `<circle cx="12" cy="9" r="6" fill="none" stroke="${c.ring}" stroke-width="2"/>` },
    "cov-partial": { label: "Ask partly covered by a rule", svg: (c) => `<circle cx="12" cy="9" r="6" fill="none" stroke="${c.ring}" stroke-width="1.6" stroke-dasharray="5 2"/>` },
    // Drawn as a line in the graph, so its key swatch is the same line (rings are keyed as circles).
    engaged: { label: "Dash-dot line: investor engaged the company directly (reported by the investor; open a node for the steps)", svg: () => `<line x1="1" y1="9" x2="23" y2="9" stroke="${cssVar("--g-label")}" stroke-width="1.6" stroke-dasharray="7 2 2 2"/>` },
    wrote: { label: "Dash-dot-dot line: wrote to the company (a letter, alone or with other investors, or a request for a meeting; no meeting reported)", svg: () => `<line x1="1" y1="9" x2="23" y2="9" stroke="${cssVar("--g-label")}" stroke-width="1.6" stroke-dasharray="6 2 1 2 1 2"/>` },
    coalition: { label: "Long dashes: a coalition acted at the company (a focus company, member filings it lists or announced, or a case it made)", svg: () => `<line x1="1" y1="9" x2="23" y2="9" stroke="${cssVar("--g-label")}" stroke-width="1.6" stroke-dasharray="12 4"/>` },
    won: { label: "Green line: proposal succeeded (withdrawn after the company committed to act, or majority vote)", svg: (c) => `<line x1="1" y1="9" x2="23" y2="9" stroke="${c.win}" stroke-width="2.4"/>` },
    lost: { label: "Red line: voted, under 50% support", svg: () => `<line x1="1" y1="9" x2="23" y2="9" stroke="#f87171" stroke-width="2.4"/>` },
    "cov-none": { label: "No rule in this map reaches this ask", svg: (c) => `<circle cx="12" cy="9" r="6" fill="none" stroke="${c.risk}" stroke-width="1.6" stroke-dasharray="1 2.5" stroke-linecap="round"/>` },
  };
  function markKey() {
    const el = document.getElementById("net-marks");
    if (!el) return;
    const kinds = new Set();
    state.data.nodes.forEach((n) => { if (visible(n)) rings(n).forEach((m) => kinds.add(m.kind)); });
    if (state.data.links.some((l) => l.relation === "engaged directly" && inMode(l) && visible(l.source) && visible(l.target))) kinds.add("engaged");
    if (state.data.links.some((l) => LETTER.has(l.relation) && inMode(l) && visible(l.source) && visible(l.target))) kinds.add("wrote");
    if (state.data.links.some((l) => COALITION.has(l.relation) && inMode(l) && visible(l.source) && visible(l.target))) kinds.add("coalition");
    state.data.links.forEach((l) => { if (visible(l.source) && visible(l.target) && inMode(l)) { const c = outcomeColor(l); if (c) kinds.add(outcomeOf(l.source) || outcomeOf(l.target)); } });
    const list = Object.keys(MARK_KEY).filter((k) => kinds.has(k));
    el.hidden = !list.length;
    const c = { ring: cssVar("--g-ring"), win: cssVar("--g-window"), risk: cssVar("--g-risk"), seek: cssVar("--g-seeking") };
    el.innerHTML = list.length ? `<span class="status-note">Marks:</span> ${list.map((k) => `<span class="leg static"><svg class="mark-swatch" viewBox="0 0 24 18" aria-hidden="true"><rect width="24" height="18" rx="3" fill="${cssVar("--g-bg")}"/>${MARK_KEY[k].svg(c)}</svg>${esc(MARK_KEY[k].label)}</span>`).join("")}` : "";
  }
  // Collision room includes a node's marks (rings reach up to radius + 12), so a small neighbour such as a
  // proposal dot is never hidden under another node's ring (owner, 2026-11-27: "try not to have overlap").
  const collideR = (d) => radius(d) + 3 + (rings(d).length ? 13 : 0);
  function drawRings() {
    markKey();
    figCap();
    // Marks changed with the lens: give the marked nodes their room and let the layout settle briefly.
    const sig = state.data.nodes.filter((n) => rings(n).length).map((n) => n.id).join("|");
    if (state.sim && sig !== state.ringSig) {
      const first = state.ringSig === undefined;
      state.ringSig = sig;
      state.sim.force("collide").radius(collideR);
      if (!first) state.sim.alpha(Math.max(state.sim.alpha(), 0.2)).restart();
    }
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
          // Vote support near or below the SEC refile threshold: an orange broken ring (owner, 2026-11-27: the old
          // bar and "!" read as a bug). The key and the panel say what it means.
          g.append("circle").attr("r", Math.max(r, 4) + 4).attr("fill", "none").attr("stroke", cssVar("--g-risk")).attr("stroke-width", 2).attr("stroke-dasharray", "3 2");
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
    try { return new Set(JSON.parse(sessionStorage.getItem(HOLD_KEY) || "[]")); } catch (e) { return new Set(); }
  }
  function saveHoldings() {
    try { if (state.holdings.size) sessionStorage.setItem(HOLD_KEY, JSON.stringify([...state.holdings])); else sessionStorage.removeItem(HOLD_KEY); } catch (e) {}
  }
  const tickerOf = (n) => (isCompanyKind(n.kind) ? n.ticker : n.kind === "proposal" ? n.company : null);
  const isHeld = (n) => {
    const t = tickerOf(n);
    return !!t && state.holdings.has(String(t).toUpperCase());
  };
  function portfolioReach() {
    const heldIds = new Set(state.data.nodes.filter((n) => isCompanyKind(n.kind) && isHeld(n)).map((n) => n.id));
    const out = new Set();
    state.data.links.forEach((l) => {
      if (!inMode(l) || !visible(l.source) || !visible(l.target)) return;
      if (heldIds.has(l.source.id)) out.add(l.target.id);
      if (heldIds.has(l.target.id)) out.add(l.source.id);
    });
    if (state.portInvestor && state.byId.has(state.portInvestor)) out.add(state.portInvestor);
    return out;
  }
  function holdStatus() {
    const el = document.getElementById("net-hold-status");
    if (!el) return;
    if (!state.holdings.size) { el.textContent = ""; return; }
    const inMap = new Set(state.data.nodes.filter((n) => isCompanyKind(n.kind) && n.ticker).map((n) => String(n.ticker).toUpperCase()));
    const found = [...state.holdings].filter((t) => inMap.has(t));
    const missing = [...state.holdings].filter((t) => !inMap.has(t));
    el.textContent = `Holdings: ${state.holdings.size} ${state.holdings.size === 1 ? "ticker" : "tickers"}, ${found.length} in this map${found.length ? " (" + found.join(", ") + ")" : ""}.${missing.length ? " Not in this map: " + missing.join(", ") + "." : ""}${state.mode === "proposals" ? " In the Proposals view, held companies with no AI proposal are not shown." : ""} Other nodes are faded.`;
  }
  // ---------- Your portfolio (owner, 2026-11-27: "think of everything from the shareholders' point of view") ----------
  // Companies in the map that can be held (a ticker), for the picker; and investors with reported holdings.
  const holdable = () => [...new Map(state.data.nodes.filter((n) => isCompanyKind(n.kind) && n.kind !== "lab" && n.kind !== "tier-labs" && n.ticker && !/private|unverified/i.test(n.ticker))
    .map((n) => [String(n.ticker).toUpperCase(), n])).values()].sort((a, b) => a.label.localeCompare(b.label));
  const holdingsData = () => (typeof DATA !== "undefined" && DATA.holdings) || null;
  // The network node for an investor in holdings.json: the same id, else the same name, else the node whose id
  // starts that investor's id ("parnassus" for "parnassus-investments").
  function investorNode(hid) {
    if (!hid) return null;
    if (state.byId.has(hid)) return hid;
    const inv = ((holdingsData() || {}).investors || []).find((i) => i.id === hid);
    const nm = inv && String(inv.name).toLowerCase();
    const orgs = state.data.nodes.filter((n) => !/^(person-|ev-|prop|co-|lab-)/.test(n.id) && !isCompanyKind(n.kind));
    const byName = nm && orgs.find((n) => String(n.label).toLowerCase() === nm);
    if (byName) return byName.id;
    const pre = orgs.filter((n) => hid.startsWith(n.id + "-") || n.id.startsWith(hid + "-")).sort((a, b) => b.id.length - a.id.length);
    return pre.length ? pre[0].id : null;
  }
  function portfolioPicker() {
    const cos = document.getElementById("net-hold-cos");
    if (!cos) return;
    cos.innerHTML = holdable().map((n) => `<label class="chip"><input type="checkbox" value="${esc(String(n.ticker).toUpperCase())}"${state.holdings.has(String(n.ticker).toUpperCase()) ? " checked" : ""}> ${esc(n.label)} <span class="ticker">${esc(n.ticker)}</span></label>`).join("");
    const H = holdingsData();
    const sel = document.getElementById("net-hold-inv");
    if (sel && H && H.investors) {
      const n = new Map();
      (H.holdings || []).forEach((h) => n.set(h.investor, (n.get(h.investor) || 0) + 1));
      sel.innerHTML = `<option value="">Choose an investor</option>` + H.investors.filter((i) => n.get(i.id))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((i) => `<option value="${esc(i.id)}"${state.portHid === i.id ? " selected" : ""}>${esc(i.name)} (${n.get(i.id)} compan${n.get(i.id) === 1 ? "y" : "ies"})</option>`).join("");
    }
  }
  function wireHoldings() {
    const btn = document.getElementById("net-hold-btn");
    const box = document.getElementById("net-hold");
    const input = document.getElementById("net-hold-input");
    portfolioPicker();
    const listed = new Set(holdable().map((n) => String(n.ticker).toUpperCase()));
    input.value = [...state.holdings].filter((t) => !listed.has(t)).join(", ");
    document.getElementById("net-hold-inv").addEventListener("change", (e) => {
      state.portHid = e.target.value || null;
      state.portInvestor = investorNode(state.portHid);
      const H = holdingsData();
      const mine = new Set(((H && H.holdings) || []).filter((h) => h.investor === state.portHid).map((h) => String(h.company).toUpperCase()));
      document.querySelectorAll("#net-hold-cos input").forEach((c) => { c.checked = mine.has(c.value); });
    });
    const close = () => { box.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); };
    btn.addEventListener("click", () => {
      const open = box.hidden;
      box.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      if (open) document.getElementById("net-hold-inv").focus();
    });
    box.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); close(); } });
    const apply = () => {
      const picked = [...document.querySelectorAll("#net-hold-cos input:checked")].map((c) => c.value);
      const typed = input.value.split(/[\s,;]+/).map((t) => t.trim().toUpperCase()).filter(Boolean);
      state.holdings = new Set([...picked, ...typed]);
      saveHoldings(); holdStatus(); applyStyles(); portfolioSummary(); if (state.view === "list") drawList();
    };
    document.getElementById("net-hold-apply").addEventListener("click", apply);
    document.getElementById("net-hold-clear").addEventListener("click", () => {
      input.value = "";
      state.portInvestor = null;
      state.portHid = null;
      document.getElementById("net-hold-inv").value = "";
      document.querySelectorAll("#net-hold-cos input").forEach((c) => { c.checked = false; });
      apply();
      document.getElementById("net-hold-inv").focus();
    });
  }

  // What your portfolio connects to: per held company, its frontier labs, AI proposals and the investors filing
  // there, the next filing deadline and votes coming up, each with a way into the network or the planner.
  function portfolioSummary() {
    const box = document.getElementById("net-portfolio");
    if (!box) return;
    if (!state.holdings.size) { box.hidden = true; box.innerHTML = ""; return; }
    const app = window.LENS_CTX || {};
    const props = app.proposals || [];
    const today = window.RULES && window.RULES.todayISO ? window.RULES.todayISO() : new Date().toISOString().slice(0, 10);
    const held = holdable().filter((n) => isHeld(n));
    const LAB = (n) => n && (n.kind === "lab" || n.kind === "tier-labs");
    const FILE = new Set(["lead filer", "co-filer", "filed (named in proxy)"]);
    const rows = held.map((n) => {
      const t = String(n.ticker).toUpperCase();
      const rec = window.companyFor ? window.companyFor(n) : null;
      const labs = new Set();
      state.data.links.forEach((l) => {
        if (l.source.id === n.id && LAB(l.target)) labs.add(l.target.label);
        if (l.target.id === n.id && LAB(l.source)) labs.add(l.source.label);
      });
      const ps = props.filter((p) => p.company === t);
      const upcoming = ps.filter((p) => p.status === "upcoming" && p.meeting_date && p.meeting_date >= today);
      const filers = new Map();
      state.data.links.forEach((l) => {
        if (!FILE.has(l.relation)) return;
        const prop = l.target, org = l.source;
        if (prop && prop.kind === "proposal" && String(prop.company).toUpperCase() === t && org) filers.set(org.id, org.label);
      });
      const dl = rec && rec.next_proposal_deadline;
      const open = dl && dl >= today && rec.next_proposal_deadline_status !== "passed";
      const firstAsk = (ps.find((p) => p.ask_id) || {}).ask_id || "";
      return { n, t, rec, labs: [...labs].sort(), ps, upcoming, filers: [...filers.values()].sort(), dl, open, firstAsk };
    });
    const allLabs = new Set(rows.flatMap((r) => r.labs));
    const votes = rows.reduce((k, r) => k + r.upcoming.length, 0);
    const openN = rows.filter((r) => r.open).length;
    const filerSet = new Set(rows.flatMap((r) => r.filers));
    const fmtD = (iso) => window.DATES.long(String(iso).slice(0, 10));
    box.hidden = false;
    box.innerHTML = `<h3 id="net-port-h" class="sub-h">Your portfolio: what it connects to</h3>
      <p class="count-line">${held.length} compan${held.length === 1 ? "y" : "ies"} held in this map${state.portHid ? ` (holdings reported by ${esc(((holdingsData() || {}).investors || []).find((i) => i.id === state.portHid)?.name || "")})` : ""} · tied to ${allLabs.size} frontier lab${allLabs.size === 1 ? "" : "s"} · ${votes} AI proposal${votes === 1 ? "" : "s"} on upcoming ballots · ${openN} with a proposal filing deadline open · ${filerSet.size} investors and groups already filing AI proposals at these companies (in this dataset).</p>
      <div class="table-wrap"><table class="port-table"><thead><tr><th scope="col">Company</th><th scope="col">Frontier labs it is tied to</th><th scope="col">AI proposals here</th><th scope="col">Already filing here</th><th scope="col">Next filing deadline</th><th scope="col">Plan</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><td><button type="button" class="linklike" data-port-node="${esc(r.n.id)}">${esc(r.n.label)}</button> <span class="ticker">${esc(r.t)} · ${esc(kindLabel(r.n.kind))}</span></td>
        <td>${r.labs.length ? esc(r.labs.join(", ")) : `<span class="ticker">none in this map</span>`}</td>
        <td>${r.ps.length ? `${r.ps.length} filed${r.upcoming.length ? `; <strong>${r.upcoming.length} on the ballot ${esc(fmtD(r.upcoming[0].meeting_date))}</strong>` : ""}` : `<span class="ticker">none in this dataset</span>`}</td>
        <td>${r.filers.length ? `${esc(r.filers.slice(0, 3).join(", "))}${r.filers.length > 3 ? ` <span class="ticker">and ${r.filers.length - 3} more</span>` : ""}` : `<span class="ticker">none on record</span>`}</td>
        <td>${r.dl ? `${esc(fmtD(r.dl))}${r.open ? "" : ` <span class="ticker">(passed)</span>`}` : `<span class="ticker">not on file</span>`}</td>
        <td>${r.rec && r.rec.id ? `<a href="?plan=${encodeURIComponent(r.rec.id)}${r.firstAsk ? "~" + encodeURIComponent(r.firstAsk) : ""}#planner">Plan an engagement</a>` : ""}</td></tr>`).join("")}
      </tbody></table></div>
      <p class="status-note">A holding is not a vote or a filing. Counts are from this site's records.</p>`;
    box.querySelectorAll("[data-port-node]").forEach((b) => b.addEventListener("click", () => {
      if (state.view !== "graph") document.querySelector('#tab-network .seg [data-view="graph"]').click();
      focus(b.dataset.portNode);
      document.getElementById("net-graph").scrollIntoView({ block: "center" });
    }));
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
        links.push({ source: id, target: cid, relation: "missing", type: "missing", layer: "proposals", source_url: null, derived: true });
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
    // Count only those drawn in the current view (a company the view hides takes its gaps with it).
    if (on) n = d.nodes.filter((x) => x.kind === "gap" && visible(x)).length;
    document.getElementById("net-lens-status").textContent = on ? `Asks not yet filed shown: ${n} ${n === 1 ? "item" : "items"}, among companies with AI proposals in this dataset.` : "Asks not yet filed hidden.";
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
      how = `${endId(l.source) === a.id ? "member of" : "has member"} <span class="conf">· coalition membership (${esc(coal.label)}, ${members} ${members === 1 ? "member" : "members"})</span>${link(l.source_url)}`;
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
        // A route that lies wholly in the other view switches to it, so the whole route is drawn.
        const isProp = (l) => l.layer === "proposals";
        const need = steps.every((x) => isProp(x.l)) ? "proposals" : steps.every((x) => !isProp(x.l)) ? "connections" : null;
        if (need && need !== state.mode) {
          setMode(need, false);
          document.getElementById("net-lens-status").textContent = `Switched to the ${mode().label} view to draw this route.`;
        }
        state.path = { from: n.id, nodes: new Set([n.id, ...steps.map((x) => x.b)]), links: new Set(steps.map((x) => x.l)) };
        steps.forEach((x) => state.byId.get(x.b) && state.hiddenKinds.delete(state.byId.get(x.b).kind));
        const inferred = steps.filter((x) => x.l.relation === "co-filed with").length;
        // A coalition counts as "shared membership" only when the path passes through it (member in, member out).
        const coalitions = steps.filter((x, i) => i + 1 < steps.length && x.l.relation === "member of" && steps[i + 1].l.relation === "member of" && x.b === endId(x.l.target)).length;
        const parts = [inferred && `${inferred} inferred from co-filing`, coalitions && `${coalitions} through shared coalition membership`].filter(Boolean);
        const crosses = steps.some((x) => !inMode(x.l));
        const sum = `Path found: ${steps.length} ${steps.length === 1 ? "hop" : "hops"}${parts.length ? " (" + parts.join(", ") + ")" : ""}${crosses ? `. Part of this route is in the ${state.mode === "proposals" ? "Connections" : "Proposals"} view, so the graph draws only some of it; every hop is listed below` : ""}`;
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
    say(`${i + 1} of ${list.length}: ${n.label}, ${TYPE_LABEL[n.kind]}, ${n.degree || 0} ${n.degree === 1 ? "connection" : "connections"}${ring ? ", " + ring : ""}${holdTxt}`);
    panTo(n, false);
  }
  // Bring a node into view at the current zoom; jumps with no animation under reduced motion.
  function panTo(n, zoomIn) {
    if (!state.zoom || n.x == null) return;
    const { width, height } = state.size;
    const k = zoomIn ? 1.6 : d3.zoomTransform(state.svg.node()).k;
    state.userZoomed = true;
    state.svg.transition().duration(REDUCED_MOTION ? 0 : 200).ease(d3.easeExpOut).call(state.zoom.transform, d3.zoomIdentity.translate(width / 2, (state.fitH || height) / 2).scale(k).translate(-n.x, -n.y));
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
        selectNode(n);
      } else if (e.key === "Escape") clearSelection();
    });
    el.addEventListener("blur", () => { if (state.kbId) { state.hover = null; applyStyles(); } });
  }

  // The graph is a full-width black strip of fixed height (owner, 2026-11-26: "one black thick stripe in the page
  // that connects to the end of the page", the same size for every lens). On wide screens the details panel floats
  // over its right side, so the layout uses the strip minus that panel.
  function drawGraph() {
    const el = document.getElementById("net-graph");
    el.innerHTML = "";
    el.style.height = "";
    const fullW = el.clientWidth || 800;
    // With the panel floating over the strip, lay the graph out only to the left of where the panel starts.
    // Owner, 2026-11-26: centre the whole diagram and its column headings on the black band; the details panel
    // floats over the right side only once something is chosen.
    const width = fullW;
    const height = el.clientHeight || 560;
    state.size = { width, height, fullW };
    state.fitH = null;
    state.cols = activeColumns();
    const data = state.data;

    const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, fullW, height]).attr("width", fullW).attr("height", height);
    const g = svg.append("g");
    state.svg = svg;
    // A plain mouse wheel scrolls the page (owner, 2026-11-26: scrolling over the graph used to zoom it out); pinch, or
    // Ctrl/⌘ + scroll, zooms. Dragging still pans.
    state.userZoomed = false;
    state.zt = d3.zoomIdentity;
    state.zoom = d3.zoom().scaleExtent([0.2, 5])
      .filter((ev) => (ev.type === "wheel" ? ev.ctrlKey || ev.metaKey : !ev.button))
      .on("zoom", (ev) => {
        g.attr("transform", ev.transform);
        state.zt = ev.transform;
        if (ev.sourceEvent) state.userZoomed = true;
        axisFollow();
        layoutLabels();
      });
    svg.call(state.zoom).on("dblclick.zoom", null);
    svg.on("click", (ev) => { if (ev.target.tagName === "svg") { state.selected = null; applyStyles(); } });

    const sim = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink((data.links.forEach((l) => {
        // Resolve every link to its node objects here: the layout only receives the current view's links, and the
        // rest still need objects for drawing and lookups.
        if (typeof l.source !== "object") l.source = state.byId.get(l.source) || l.source;
        if (typeof l.target !== "object") l.target = state.byId.get(l.target) || l.target;
      }), data.links.filter(inMode))).id((d) => d.id).distance((l) => linkBase(l) * state.cfg.linkDist).strength(state.cfg.linkStrength))
      .force("charge", d3.forceManyBody().strength((d) => (d.kind === "company" ? -420 : -110) * state.cfg.repel).distanceMax(Math.max(260, Math.min(width, height) * 0.6)))
      .force("collide", d3.forceCollide().radius(collideR).strength(1).iterations(3))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(state.cfg.center))
      .force("y", d3.forceY(height / 2).strength(state.cfg.center * 1.25))
      // Columns are held firmly sideways (1.8× the grouping force) so each cluster sits under its heading.
      .force("employer", employerForce())
      .force("gx", d3.forceX((d) => ovalTarget(d).x * width).strength(Math.min(1, state.cfg.group * 1.8)))
      .force("gy", d3.forceY((d) => ovalTarget(d).y * height).strength(state.cfg.group * 0.8))
      // A soft oval boundary (owner, 2026-11-26: "it doesn't have to go so far to the edge … a bit more naturally
      // circled"): a node outside the oval inscribed in the box is drawn gently back toward the middle, so the cloud
      // rounds off instead of piling up along the edges. The hard limit below is only a safety margin.
      .force("oval", (alpha) => {
        const top = state.cfg.group > 0 ? HEADER_H : 0;
        const cx = width / 2, cy = (top + height) / 2;
        const rx = width / 2 - 28, ry = (height - top) / 2 - 24;
        for (const d of state.data.nodes) {
          const nx = (d.x - cx) / rx, ny = (d.y - cy) / ry;
          const k = superNorm(nx, ny);
          if (k > 1) {
            const pull = ((k - 1) / k) * alpha * 2.5;
            d.vx -= (d.x - cx) * pull;
            d.vy -= (d.y - cy) * pull;
          }
        }
      });
    state.sim = sim;
    state.linkSel = g.append("g").attr("stroke", cssVar("--g-link")).attr("fill", "none").selectAll("path").data(data.links).join("path")
      .attr("stroke-width", (l) => (l.relation === "lead filer" ? 1.4 : 1) * state.cfg.linkScale)
      // Membership links are dashed; links with no source (inferred) are dotted, so the two never look alike.
      .attr("stroke-dasharray", (l) => (engageDash(l.relation) ? engageDash(l.relation) : l.relation === "missing" ? "5 3" : l.relation === "coverage" && l.coverage !== "full" ? "8 3" : conf(l).level === "inferred" ? "1 3" : l.relation === "member of" ? "3 3" : null));

    state.node = g.append("g").selectAll("circle").data(data.nodes).join("circle")
      .attr("r", radius)
      .attr("fill", fillOf)
      .attr("stroke", (d) => (d.kind === "gap" ? cssVar("--g-label-soft") : edgeOf(d)))
      .attr("stroke-dasharray", (d) => (d.kind === "gap" ? "3 2" : null))
      .style("cursor", "pointer")
      .on("mouseenter", (ev, d) => { state.hover = d.id; applyStyles(); })
      .on("mouseleave", () => { state.hover = null; applyStyles(); })
      .on("click", (ev, d) => { ev.stopPropagation(); selectNode(d); })
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
      .attr("font-weight", (d) => (d.kind === "company" ? 500 : 400))
      .attr("fill", cssVar("--g-label"))
      .attr("pointer-events", "none")
      // A dark outline under each label keeps it legible over lines and nodes.
      .attr("stroke", cssVar("--g-bg")).attr("stroke-width", 3).attr("stroke-linejoin", "round").attr("paint-order", "stroke")
      .attr("dx", 0).attr("dy", 0);
    // Column labels for the grouped layout: pinned in a strip at the top of the box, sliding sideways with the graph.
    state.axis = svg.append("g").attr("font-size", 12).attr("font-weight", 400).attr("fill", cssVar("--g-label-soft"))
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
    sim.on("end", () => { separate(); fitToContent(); axisFollow(); declutter(); applyStyles(); });
    // Work out most of the layout before showing it (owner, 2026-11-26: the nodes "shake a lot" when a graph first
    // opens; "gently wiggly … nothing violent"): nodes start near their column, the layout runs off-screen, and
    // only the last few percent plays on screen, heavily damped.
    sim.stop();
    for (const n of data.nodes) {
      if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) {
        const t = ovalTarget(n);
        n.x = t.x * width + (Math.random() - 0.5) * 60;
        n.y = t.y * height + (Math.random() - 0.5) * 60;
      }
    }
    sim.alpha(1).tick(REDUCED_MOTION ? 300 : 240);
    draw();
    fitToContent();
    if (REDUCED_MOTION) declutter();
    else sim.velocityDecay(0.7).alpha(0.04).restart();
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
      ${state.holdings.size ? `<th scope="col">Held</th>` : ""}<th scope="col">Status</th><th scope="col">${esc(lens().actionsHeading || "Engagement levers")}</th></tr></thead>
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
    // The Policymaker lens is about recurring asks, which live in the Proposals view.
    if (id === "policy" && state.mode !== "proposals") setMode("proposals", false);
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
    syncLegend();
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
      const c = counts();
      document.getElementById("net-lens-status").textContent = lens().feed && state.feedView === "feed"
        ? `${lens().label} view: a list of upcoming AI proposals. See the bigger picture opens the graph.`
        : `${lens().label} view${hidden.length ? ": " + hidden.join(", ") + " hidden" : ""}. ${c.shown} of ${c.total} ${lens().plainIntro ? "circles" : "nodes"} shown${c.extra}.`;
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
        props.forEach((p) => d.links.push({ source: a.id, target: p.id, relation: "asks for", type: "asks for", layer: "proposals", source_url: null, derived: true }));
      });
      const ids = new Set(d.nodes.map((n) => n.id));
      ((state.ctx.coverage && state.ctx.coverage.entries) || []).forEach((e) => {
        if (e.graph_id && ids.has(e.graph_id) && ids.has(e.ask_id)) d.links.push({ source: e.ask_id, target: e.graph_id, relation: "coverage", type: "coverage", layer: "proposals", coverage: e.coverage, source_url: e.source_url, description: e.note });
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
  // While the network plays, the year shows large on the graph and Play glows (owner, 2026-11-27: "make it more
  // visually clear … it is playing you through the years").
  function yearBadge(y, playing) {
    const wrap = document.querySelector(".net-graph-wrap");
    if (!wrap) return;
    let el = document.getElementById("net-year-big");
    if (!el) {
      el = document.createElement("div");
      el.id = "net-year-big";
      el.setAttribute("aria-hidden", "true");
      wrap.appendChild(el);
    }
    el.innerHTML = `<span class="ny-y">${y}</span><span class="ny-l">${playing ? "Building the network year by year" : "The network up to this year"}</span>`;
    el.classList.toggle("on", !!playing || !!state.upto);
    el.classList.toggle("playing", !!playing);
  }
  function stopPlay(announce) {
    if (!playTimer) return;
    clearInterval(playTimer);
    playTimer = null;
    const b = document.getElementById("net-play");
    if (b) { b.textContent = "Play"; b.classList.remove("playing"); }
    yearBadge(state.upto || yearRange()[1], false);
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
    yearBadge(y, !!playTimer);
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
      b.classList.add("playing");
      playTimer = -1; // marks play as started for the first step
      scrubTo(y, refresh, true);
      playTimer = setInterval(() => {
        y += 1;
        scrubTo(y, refresh, true);
        if (y >= hi) {
          stopPlay(true);
          // Invite a replay: the Play button glows for a few seconds after the history has filled in.
          b.classList.remove("glow");
          void b.offsetWidth;
          b.classList.add("glow");
          setTimeout(() => b.classList.remove("glow"), 6000);
        }
      }, 1500);
    });
  }

  // "Show asks not yet filed" belongs to lenses that set gaps: true (the Impact investor lens).
  function gapButton() {
    const b = document.getElementById("net-gaps");
    if (b) b.hidden = !lens().gaps;
  }

  function wire() {
    document.getElementById("net-mode").addEventListener("click", (e) => {
      const b = e.target.closest("[data-mode]");
      if (b && b.dataset.mode !== state.mode) {
        setMode(b.dataset.mode);
        // Opening Proposals plays its history year by year (owner, 2026-11-26: "a slow history fill out"); the reader
        // can pause or drag the slider at any time. Not with reduced motion.
        if (state.mode === "proposals" && !REDUCED_MOTION && !navigator.webdriver && !state.year) {
          setTimeout(() => { const p = document.getElementById("net-play"); if (p && !p.disabled && !playTimer && state.mode === "proposals") { state.upto = null; p.click(); } }, 700);
        }
      }
    });
    document.getElementById("net-pstatus").addEventListener("click", (e) => {
      const b = e.target.closest("[data-pstatus]");
      if (!b) return;
      state.pstatus = b.dataset.pstatus;
      document.querySelectorAll("#net-pstatus [data-pstatus]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.pstatus === state.pstatus)));
      refreshConnected();
      if (state.drawn) { state.sim.stop(); drawGraph(); }
      if (state.view === "list") drawList();
      intro();
      document.getElementById("net-lens-status").textContent = `${{ all: "All", active: "Active", past: "Past" }[state.pstatus]} proposals: ${counts().shown} of ${counts().total} nodes shown${counts().extra}.`;
    });
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
      const all = e.target.closest("[data-all]");
      const b = e.target.closest(".leg");
      let msg = "";
      if (all) {
        state.hiddenKinds = new Set();
        state.litKinds = new Set();
        msg = "Showing every type.";
      } else if (b) {
        const k = b.dataset.kind;
        const next = KEY_NEXT[kindState(k)];
        state.hiddenKinds.delete(k);
        state.litKinds.delete(k);
        if (next === "off") state.hiddenKinds.add(k);
        if (next === "lit") state.litKinds.add(k);
        msg = `${kindLabel(k)} ${KEY_SAY[next]}.`;
      } else return;
      syncLegend();
      refresh();
      regroup();
      refreshConnected();
      document.getElementById("net-lens-status").textContent = `${msg} ${counts().shown} of ${counts().total} organizations, people, proposals and companies shown${counts().extra}.`;
    });
    // Proposal categories (when colour by category is on): the same toggle, only and show-all controls.
    document.getElementById("net-catkey").addEventListener("click", (e) => {
      const all = e.target.closest("[data-cat-all]");
      const b = e.target.closest("[data-cat]");
      if (all) { state.hiddenCats = new Set(); state.litCats = new Set(); }
      else if (b) {
        const c = b.dataset.cat;
        const next = KEY_NEXT[catState(c)];
        state.hiddenCats.delete(c);
        state.litCats.delete(c);
        if (next === "off") state.hiddenCats.add(c);
        if (next === "lit") state.litCats.add(c);
      } else return;
      catKey();
      refresh();
      refreshConnected();
      document.getElementById("net-lens-status").textContent = `Proposals shown for: ${catList().filter((c) => !state.hiddenCats.has(c.id)).map((c) => c.label).join(", ") || "no category"}.`;
    });
    wireScrubber(refresh);
    document.querySelectorAll("#net-lens input").forEach((r) => r.addEventListener("change", () => { if (r.checked) setLens(r.value, true); }));
    wireKeys();
    wireHoldings();
    wireKey();
    gapButton();
    // "Asks not yet filed" are proposal-side nodes: turning them on opens the Proposals view.
    document.getElementById("net-gaps").addEventListener("click", () => {
      if (!state.gaps && state.mode !== "proposals") setMode("proposals", false);
      setGaps(!state.gaps);
    });
    document.getElementById("lf-back").addEventListener("click", () => setFeedView("feed", true));
    document.querySelectorAll("#tab-network .seg button[data-view]").forEach((b) => b.addEventListener("click", () => {
      state.view = b.dataset.view;
      document.querySelectorAll("#tab-network .seg button[data-view]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      document.querySelector("#tab-network .net-graph-wrap").hidden = state.view !== "graph";
      document.querySelector("#tab-network .net-body").classList.toggle("is-graph", state.view === "graph");
      document.getElementById("net-list").hidden = state.view !== "list";
      if (state.view === "list") drawList();
    }));
  }

  window.focusNetworkNode = (id) => focus(id);
  // The section's two tabs, Network of stakeholders and Proposals, set the graph's view (app.js).
  window.netMode = (m) => {
    window.netWantMode = m;
    const b = document.querySelector(`#net-mode [data-mode="${m}"]`);
    if (b && state && state.mode !== m) b.click();
  };
  window.renderNetwork = function (raw, people) {
    const el = document.getElementById("tab-network");
    if (typeof d3 === "undefined") {
      el.innerHTML = `<h2>AI advocacy network</h2><div id="net-graph"></div>`;
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
    state = { data, byId: new Map(data.nodes.map((n) => [n.id, n])), defaults, cfg: loadSettings(defaults), hiddenKinds: new Set(), hiddenLabels: new Set(), query: "", topic: "", year: "", view: "graph", selected: null, hover: null, kbId: null, path: null, gaps: false, hiddenCats: new Set(), litKinds: new Set(), litCats: new Set() };
    state.holdings = loadHoldings();
    state.lens = initialLens();
    {
      const g = new URLSearchParams(location.search).get("graph");
      state.mode = window.netWantMode || (g === "proposals" || g === "connections" ? g : state.lens === "policy" ? "proposals" : "connections");
    }
    state.pstatus = "all";
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
    setMode(state.mode, false);
    holdStatus();
    portfolioSummary();
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

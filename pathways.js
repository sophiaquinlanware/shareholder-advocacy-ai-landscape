// Influence pathways: investors -> public companies -> frontier AI labs.
// Investors cannot file proposals at private labs, but they can engage the public
// companies that fund, host, supply or distribute those labs. This view lays that out.
// Reads data/pathways.json (company-to-lab ties) and data/network.json (who engages which company).

(function () {
  const TIE_VAR = {
    "equity stake": "--t-equity",
    "cloud/compute provider": "--t-compute",
    "chip supplier": "--t-chips",
    "distribution partner": "--t-dist",
    "board seat or observer": "--t-board",
    "revenue share/commercial agreement": "--t-commercial",
    "parent company": "--t-parent",
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const link = (url, label = "source") => url ? `<a class="src" href="${esc(url)}" target="_blank" rel="noopener">[${esc(label)}]</a>` : `<span class="unverified">source pending</span>`;
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#888";

  let S = null;

  // Which investor organizations engage which public company, from the proposal network.
  // Same thing, read from the shared graph (data/graph.json).
  function investorLinksFromGraph(G) {
    const byId = new Map(G.nodes.map((n) => [n.id, n]));
    const pairs = new Map();
    for (const e of G.edges) {
      const o = byId.get(e.source), p = byId.get(e.target);
      if (!o || !p || !["investor", "coalition"].includes(o.type) || p.type !== "proposal") continue;
      const org = { id: o.id, name: o.label };
      const key = o.id + "|" + p.company;
      if (!pairs.has(key)) pairs.set(key, { org, ticker: p.company, proposals: [] });
      pairs.get(key).proposals.push({ ...p, title: p.label, relation: e.type, edge_source: e.source_url });
    }
    return [...pairs.values()];
  }

  function investorLinks(network) {
    if (network && network.nodes) return investorLinksFromGraph(network);
    const byProposal = new Map((network.proposals || []).map((p) => [p.id, p]));
    const orgs = new Map((network.organizations || []).map((o) => [o.id, o]));
    const pairs = new Map(); // "org|ticker" -> {org, ticker, proposals:[]}
    for (const e of network.edges || []) {
      const p = byProposal.get(e.to);
      const o = orgs.get(e.from);
      if (!p || !o) continue;
      const key = o.id + "|" + p.company;
      if (!pairs.has(key)) pairs.set(key, { org: o, ticker: p.company, proposals: [] });
      pairs.get(key).proposals.push({ ...p, relation: e.relation, edge_source: e.source_url });
    }
    return [...pairs.values()];
  }

  function shell(el, data) {
    const labs = data.labs.map((l) => `<button type="button" class="chip" data-lab="${esc(l.id)}" aria-pressed="false">${esc(l.name)}</button>`).join("");
    const cos = data.public_companies.map((c) => `<label class="chip"><input type="checkbox" value="${esc(c.id)}"> ${esc(c.name)}</label>`).join("");
    // Two line kinds, both blue: company → lab ties (navy) and filer → company links (light blue).
    // Tie type is named in the tie table and the side panel.
    const legend = `<span class="leg static"><span class="dot" style="background:${cssVar("--t-equity")}"></span>company → lab tie (width = strength)</span>`;
    el.innerHTML = `
      <h2>Lab pathways</h2>
      <p class="intro">${data.ties.length} ties between ${data.public_companies.length} public companies and ${data.labs.length} frontier labs, with the filers active at each company. Line width = tie strength (1–3) or proposals filed.</p>
      <div class="pw-modes">
        <div><p class="pw-label">Labs</p><div class="chips">${labs}</div></div>
        <div><p class="pw-label">Companies</p><div class="chips">${cos}</div></div>
      </div>
      <div class="net-legend">${legend}<span class="leg static"><span class="dot" style="background:var(--t-filer)"></span>filer → company (width = proposals filed)</span></div>
      <div class="net-body">
        <div id="pw-graph" class="net-graph pw-graph"></div>
        <aside id="pw-panel" class="net-panel" aria-live="polite"></aside>
      </div>
      <h3 class="sub-h">Ties</h3>
      <p class="count-line" id="pw-count" aria-live="polite"></p>
      <div class="table-wrap" id="pw-ties"></div>`;
  }

  function layout() {
    const el = document.getElementById("pw-graph");
    const W = el.clientWidth || 800;
    const narrow = W < 640;
    const investors = [...new Map(S.inv.map((p) => [p.org.id, p.org])).values()]
      .sort((a, b) => S.inv.filter((p) => p.org.id === b.id).length - S.inv.filter((p) => p.org.id === a.id).length);
    const cols = [
      { key: "inv", title: "Investors and advocates", items: investors.map((o) => ({ id: "o:" + o.id, label: o.name, ref: o })) },
      { key: "co", title: "Public companies", items: S.data.public_companies.map((c) => ({ id: "c:" + c.id, label: c.name.replace(/\s*\(.*\)/, ""), ref: c })) },
      { key: "lab", title: "Frontier labs", items: S.data.labs.map((l) => ({ id: "l:" + l.id, label: l.name.replace(/\s*\(.*\)/, ""), ref: l })) },
    ];
    const rowH = narrow ? 20 : 24;
    const H = Math.max(420, Math.max(...cols.map((c) => c.items.length)) * rowH + 70);
    const xs = narrow ? [8, W * 0.36, W * 0.7] : [16, W * 0.38, W * 0.76];
    const pos = new Map();
    cols.forEach((col, ci) => {
      const span = col.items.length * rowH;
      const top = 50 + (H - 60 - span) / 2;
      col.items.forEach((it, i) => pos.set(it.id, { x: xs[ci], y: top + i * rowH + rowH / 2, col: ci, ...it }));
    });
    return { cols, pos, W, H, xs, narrow };
  }

  function draw() {
    const el = document.getElementById("pw-graph");
    el.innerHTML = "";
    const L = layout();
    S.L = L;
    el.style.height = L.H + "px";
    const svg = d3.select(el).append("svg").attr("viewBox", [0, 0, L.W, L.H]).attr("width", L.W).attr("height", L.H);
    L.cols.forEach((c, i) => svg.append("text").text(c.title).attr("x", L.xs[i]).attr("y", 24)
      .attr("font-size", 11).attr("font-weight", 600).attr("letter-spacing", ".06em").attr("fill", cssVar("--ink-soft")).text(c.title.toUpperCase()));

    const curve = (a, b) => { const mx = (a.x + b.x) / 2; return `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`; };
    const linkData = [];
    for (const p of S.inv) {
      const a = L.pos.get("o:" + p.org.id), b = L.pos.get("c:" + p.ticker.toLowerCase());
      if (a && b) linkData.push({ kind: "inv", a, b, w: Math.min(4, 0.8 + p.proposals.length * 0.6), color: cssVar("--t-filer"), ref: p });
    }
    for (const t of S.data.ties) {
      const a = L.pos.get("c:" + t.from), b = L.pos.get("l:" + t.to);
      if (a && b) linkData.push({ kind: "tie", a, b, w: 1 + (t.strength || 1) * 1.4, color: cssVar(TIE_VAR[t.type] || "--ink-soft"), ref: t });
    }
    const labelW = L.narrow ? 70 : 150;
    S.links = svg.append("g").attr("fill", "none").selectAll("path").data(linkData).join("path")
      .attr("d", (d) => curve({ x: d.a.x + (d.a.col === 0 ? labelW + 40 : d.a.col === 1 ? labelW : 0), y: d.a.y }, { x: d.b.x - 6, y: d.b.y }))
      // Thin-line style: widths scaled by 0.8 with a 0.8px floor, so width still encodes count and tie strength.
      .attr("stroke", (d) => d.color).attr("stroke-width", (d) => Math.max(0.8, d.w * 0.8));
    S.nodes = svg.append("g").selectAll("g").data([...L.pos.values()]).join("g")
      .attr("transform", (d) => `translate(${d.x},${d.y})`).style("cursor", "pointer")
      .on("click", (ev, d) => onNode(d));
    S.nodes.append("circle").attr("r", 4).attr("fill", (d) => cssVar(d.col === 0 ? "--n-manager" : d.col === 1 ? "--n-company" : "--n-lab"));
    const maxLen = L.narrow ? 12 : 22;
    S.nodes.append("text").text((d) => (d.label.length > maxLen ? d.label.slice(0, maxLen - 1) + "…" : d.label))
      .attr("x", 8).attr("y", 4).attr("font-size", L.narrow ? 10 : 12).attr("fill", cssVar("--ink"));
    apply();
  }

  // Highlight the parts of the map that matter for the current selection.
  function apply() {
    if (!S.links) return;
    const active = S.activeIds;
    S.links.attr("stroke-opacity", (d) => (!active ? 0.35 : active.has(d.a.id) && active.has(d.b.id) ? 0.95 : 0.05));
    S.nodes.attr("opacity", (d) => (!active || active.has(d.id) ? 1 : 0.2));
  }

  function selectLab(labId) {
    S.selectedCos.clear();
    document.querySelectorAll('#tab-pathways input[type="checkbox"]').forEach((b) => (b.checked = false));
    document.querySelectorAll("#tab-pathways [data-lab]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lab === labId)));
    const lab = S.data.labs.find((l) => l.id === labId);
    const ties = S.data.ties.filter((t) => t.to === labId).sort((a, b) => (b.strength || 0) - (a.strength || 0));
    const cos = new Set(ties.map((t) => t.from));
    const inv = S.inv.filter((p) => cos.has(p.ticker.toLowerCase()));
    S.activeIds = new Set(["l:" + labId, ...[...cos].map((c) => "c:" + c), ...inv.map((p) => "o:" + p.org.id)]);
    apply();
    const coName = (id) => (S.data.public_companies.find((c) => c.id === id) || {}).name || id;
    const tieRows = ties.map((t) => `<li><strong>${esc(coName(t.from))}</strong> <span class="ticker">${esc(t.type)}${t.as_of ? ", as of " + esc(t.as_of) : ""}</span><br>${esc(t.description)} ${link(t.source_url)}</li>`).join("");
    const invByCo = [...cos].map((c) => {
      const list = inv.filter((p) => p.ticker.toLowerCase() === c);
      if (!list.length) return "";
      return `<li><strong>${esc(coName(c))}:</strong> ${list.map((p) => esc(p.org.name)).join(", ")}</li>`;
    }).join("");
    document.getElementById("pw-panel").innerHTML = `
      <p class="eyebrow tight">Frontier lab</p><h3>${esc(lab.name)}</h3>
      <p>${esc(lab.description || "")} ${link(lab.source_url)}</p>
      <h4 class="pw-h4">Public companies with leverage (${ties.length})</h4><ul class="conn">${tieRows || "<li>None sourced yet.</li>"}</ul>
      <h4 class="pw-h4">Investors already engaging those companies on AI</h4>
      <ul class="conn">${invByCo || "<li>None in the map yet.</li>"}</ul>`;
    tieTable(ties);
  }

  // Always-visible table of ties: all of them with nothing selected, or the current selection's.
  function tieTable(ties) {
    const coName = (id) => (S.data.public_companies.find((c) => c.id === id) || {}).name || id;
    const labName = (id) => (S.data.labs.find((l) => l.id === id) || {}).name || id;
    const rows = [...ties].sort((a, b) => coName(a.from).localeCompare(coName(b.from)) || (b.strength || 0) - (a.strength || 0));
    document.getElementById("pw-count").textContent = `${rows.length} of ${S.data.ties.length} ties${rows.length < S.data.ties.length ? " (current selection)" : ""}.`;
    document.getElementById("pw-ties").innerHTML = `<table><thead><tr><th scope="col">Company</th><th scope="col">Lab</th><th scope="col">Tie</th><th scope="col">Strength</th><th scope="col">Detail</th><th scope="col">As of</th></tr></thead><tbody>${rows.map((t) => `<tr><td>${esc(coName(t.from))}</td><td>${esc(labName(t.to))}</td><td>${esc(t.type)}</td><td>${esc(t.strength ?? "")}</td><td>${esc(t.description || "")} ${link(t.source_url)}</td><td class="nowrap">${esc(t.as_of || "")}</td></tr>`).join("")}</tbody></table>`;
  }

  function selectCompanies() {
    document.querySelectorAll("#tab-pathways [data-lab]").forEach((b) => b.setAttribute("aria-pressed", "false"));
    const cos = S.selectedCos;
    if (!cos.size) { S.activeIds = null; apply(); document.getElementById("pw-panel").innerHTML = ""; tieTable(S.data.ties); return; }
    const ties = S.data.ties.filter((t) => cos.has(t.from));
    const reach = new Map();
    ties.forEach((t) => {
      if (!reach.has(t.to)) reach.set(t.to, { score: 0, ties: [] });
      const r = reach.get(t.to); r.score += t.strength || 1; r.ties.push(t);
    });
    const inv = S.inv.filter((p) => cos.has(p.ticker.toLowerCase()));
    S.activeIds = new Set([...[...cos].map((c) => "c:" + c), ...[...reach.keys()].map((l) => "l:" + l), ...inv.map((p) => "o:" + p.org.id)]);
    apply();
    const coName = (id) => (S.data.public_companies.find((c) => c.id === id) || {}).name || id;
    const labName = (id) => (S.data.labs.find((l) => l.id === id) || {}).name || id;
    const rows = [...reach.entries()].sort((a, b) => b[1].score - a[1].score).map(([lab, r]) => `
      <li><strong>${esc(labName(lab))}</strong> <span class="ticker">combined tie strength ${r.score}</span>
      <ul class="sub">${r.ties.map((t) => `<li>${esc(coName(t.from))}: ${esc(t.type)}. ${esc(t.description)} ${link(t.source_url)}</li>`).join("")}</ul></li>`).join("");
    const shared = [...new Map(inv.map((p) => [p.org.id, p.org])).values()];
    document.getElementById("pw-panel").innerHTML = `
      <p class="eyebrow tight">Engagement plan</p>
      <h3>${[...cos].map(coName).join(" + ")}</h3>
      <h4 class="pw-h4">Labs this combination reaches (${reach.size})</h4>
      <ul class="conn">${rows || "<li>No sourced ties yet.</li>"}</ul>
      <h4 class="pw-h4">Organizations already engaging these companies on AI (${shared.length})</h4>
      <p>${shared.map((o) => esc(o.name)).join(", ") || "None in the map yet."}</p>`;
    tieTable(ties);
  }

  function onNode(d) {
    if (d.col === 2) return selectLab(d.ref.id);
    if (d.col === 1) {
      const box = document.querySelector(`#tab-pathways input[value="${d.ref.id}"]`);
      if (box) { box.checked = !box.checked; box.dispatchEvent(new Event("change")); }
      return;
    }
    // Investor: show which companies it engages and which labs those reach.
    const mine = S.inv.filter((p) => p.org.id === d.ref.id);
    S.selectedCos = new Set(mine.map((p) => p.ticker.toLowerCase()));
    document.querySelectorAll('#tab-pathways input[type="checkbox"]').forEach((b) => (b.checked = S.selectedCos.has(b.value)));
    selectCompanies();
  }

  window.renderPathways = function (data, network) {
    const el = document.getElementById("tab-pathways");
    if (!data || !data.labs || !data.labs.length) {
      el.innerHTML = `<div class="coming"><h2>Lab pathways</h2><p>Being sourced now.</p></div>`;
      return;
    }
    S = { data, inv: investorLinks(network || {}), selectedCos: new Set(), activeIds: null };
    shell(el, data);
    tieTable(data.ties);
    el.querySelectorAll("[data-lab]").forEach((b) => b.addEventListener("click", () => selectLab(b.dataset.lab)));
    el.querySelectorAll('input[type="checkbox"]').forEach((b) => b.addEventListener("change", () => {
      if (b.checked) S.selectedCos.add(b.value); else S.selectedCos.delete(b.value);
      selectCompanies();
    }));
    const go = () => { if (!el.hidden && !S.drawn) { S.drawn = true; draw(); } };
    new MutationObserver(go).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    go();
    let t;
    window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(() => { if (S.drawn && !el.hidden) draw(); }, 250); });
  };
})();

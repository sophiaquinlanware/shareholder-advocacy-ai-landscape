// Causality map: what led to what, across government, investors, companies, labs and the public.
// Time runs left to right; each actor type has its own lane. Arrows show sourced causal links.
// Click an event to trace its causes (upstream) and its effects (downstream).

(function () {
  const LANES = [
    { key: "government", label: "Government and regulators" },
    { key: "investors", label: "Investors and advocates" },
    { key: "companies", label: "Public companies" },
    { key: "labs", label: "Frontier labs" },
    { key: "public", label: "The public" },
  ];
  // All links are blue; the link type is told apart by dash pattern (and named in the legend and table).
  const LINK_VAR = { "led to": "--cz-link", "responded to": "--cz-link", restricts: "--cz-link", enables: "--cz-link", "cited by": "--cz-link" };
  const LINK_DASH = { "led to": null, "responded to": "6 3", restricts: "2 3", enables: "8 3 2 3", "cited by": "1 4" };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const link = (url, label = "source") => url ? `<a class="src" href="${esc(url)}" target="_blank" rel="noopener">[${esc(label)}]</a>` : `<span class="unverified">source pending</span>`;
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#888";
  const fmt = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  let C = null;

  // Walk the arrows backwards (causes) or forwards (effects) from one event.
  function walk(id, dir) {
    const seen = new Set([id]), stack = [id];
    while (stack.length) {
      const cur = stack.pop();
      for (const l of C.links) {
        const next = dir === "up" ? (l.to === cur ? l.from : null) : (l.from === cur ? l.to : null);
        if (next && !seen.has(next)) { seen.add(next); stack.push(next); }
      }
    }
    return seen;
  }

  function draw() {
    const box = document.getElementById("cz-graph");
    box.innerHTML = "";
    const W = Math.max(box.clientWidth || 900, 720, C.events.length * 34);
    const laneH = 120, top = 30, left = 150;
    const ev = C.events.filter((e) => e.date && (!C.juris || e.jurisdiction === C.juris));
    // Only lanes that hold events in the current view take space.
    const lanes = LANES.filter((l) => ev.some((e) => e.lane === l.key));
    const H = top + lanes.length * laneH + 30;
    const dates = ev.map((e) => new Date(e.date));
    // Time runs on a square-root scale so the crowded recent months get more room than quiet years.
    const [t0, t1] = d3.extent(dates);
    const span = t1 - t0 || 1;
    const xr = (d) => left + 20 + (W - left - 60) * Math.pow((d - t0) / span, 1.8);
    const laneY = (k) => top + Math.max(0, lanes.findIndex((l) => l.key === k)) * laneH + laneH / 2;

    // Spread events that land close together in the same lane so they don't overlap.
    const placed = [];
    ev.sort((a, b) => (a.date < b.date ? -1 : 1)).forEach((e) => {
      let y = laneY(e.lane), x0 = xr(new Date(e.date)), k = 0;
      while (placed.some((p) => Math.abs(p.x - x0) < 16 && Math.abs(p.y - y) < 14)) { k++; y = laneY(e.lane) + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 15; }
      e._x = x0; e._y = y; placed.push({ x: x0, y });
    });
    const byId = new Map(ev.map((e) => [e.id, e]));

    const svg = d3.select(box).append("svg").attr("viewBox", [0, 0, W, H]).attr("width", W).attr("height", H);
    const defs = svg.append("defs");
    Object.entries(LINK_VAR).forEach(([k, v]) => defs.append("marker").attr("id", "arr-" + k.replace(/\W/g, ""))
      .attr("viewBox", "0 -4 8 8").attr("refX", 12).attr("markerWidth", 7).attr("markerHeight", 7).attr("orient", "auto")
      .append("path").attr("d", "M0,-4L8,0L0,4").attr("fill", cssVar(v)));

    lanes.forEach((l, i) => {
      svg.append("rect").attr("x", 0).attr("y", top + i * laneH).attr("width", W).attr("height", laneH)
        .attr("fill", i % 2 ? cssVar("--bg") : cssVar("--surface"));
      svg.append("text").text(l.label).attr("x", 10).attr("y", top + i * laneH + laneH / 2 + 4)
        .attr("font-size", 12).attr("font-weight", 600).attr("fill", cssVar("--ink-soft"));
    });
    // Month labels along the top, placed with the same stretched scale.
    const months = d3.timeMonth.range(d3.timeMonth.floor(t0), t1, 1).filter((m, i, all) => i === 0 || xr(m) - xr(all[i - 1]) > 0);
    // The first label, and the first label after each change of year, carries the year.
    let lastX = -1e9, lastYear = null;
    months.forEach((m) => {
      const mx = xr(m);
      if (mx - lastX < 56) return;
      lastX = mx;
      const showYear = m.getFullYear() !== lastYear;
      lastYear = m.getFullYear();
      svg.append("text").text(d3.timeFormat(showYear ? "%b %Y" : "%b")(m)).attr("x", mx).attr("y", top - 10)
        .attr("font-size", 10.5).attr("fill", cssVar("--ink-soft")).attr("text-anchor", "middle");
      svg.append("line").attr("x1", mx).attr("x2", mx).attr("y1", top).attr("y2", H - 30).attr("stroke", cssVar("--line")).attr("stroke-width", 0.6);
    });

    const lk = C.links.filter((l) => byId.has(l.from) && byId.has(l.to));
    C.linkSel = svg.append("g").attr("fill", "none").selectAll("path").data(lk).join("path")
      .attr("d", (l) => {
        const a = byId.get(l.from), b = byId.get(l.to);
        const dx = b._x - a._x, bend = Math.max(30, Math.abs(dx) * 0.3);
        return `M${a._x},${a._y} C${a._x + bend},${a._y} ${b._x - bend},${b._y} ${b._x},${b._y}`;
      })
      .attr("stroke", (l) => cssVar(LINK_VAR[l.type] || "--cz-link")).attr("stroke-width", 1.3)
      .attr("stroke-dasharray", (l) => LINK_DASH[l.type] || null)
      .attr("marker-end", (l) => `url(#arr-${(LINK_VAR[l.type] ? l.type : "cited by").replace(/\W/g, "")})`);
    C.linkSel.append("title").text((l) => `${l.type}: ${l.explanation || ""}`);

    C.nodeSel = svg.append("g").selectAll("g").data(ev).join("g").attr("transform", (e) => `translate(${e._x},${e._y})`)
      .style("cursor", "pointer").on("click", (evt, e) => select(e.id));
    C.nodeSel.append("circle").attr("r", (e) => 5 + Math.min(5, C.links.filter((l) => l.from === e.id || l.to === e.id).length))
      .attr("fill", cssVar("--cz-node"))
      .attr("stroke", cssVar("--surface")).attr("stroke-width", 1.5);
    C.nodeSel.append("title").text((e) => `${fmt(e.date)}: ${e.title}`);
    C.labelSel = C.nodeSel.append("text").text((e) => (e.title.length > 34 ? e.title.slice(0, 33) + "…" : e.title))
      .attr("x", 9).attr("y", 4).attr("font-size", 10.5).attr("fill", cssVar("--ink")).attr("opacity", 0);
    apply();
  }

  function apply() {
    const hi = C.highlight;
    C.nodeSel.attr("opacity", (e) => (!hi || hi.has(e.id) ? 1 : 0.15));
    C.labelSel.attr("opacity", (e) => (hi && hi.has(e.id) ? 1 : 0));
    C.linkSel.attr("stroke-opacity", (l) => (!hi ? 0.55 : hi.has(l.from) && hi.has(l.to) ? 1 : 0.06));
  }

  function select(id) {
    const e = C.events.find((x) => x.id === id);
    const up = walk(id, "up"), down = walk(id, "down");
    C.highlight = C.mode === "causes" ? up : C.mode === "effects" ? down : new Set([...up, ...down]);
    apply();
    const name = (i) => (C.events.find((x) => x.id === i) || {}).title || i;
    const ins = C.links.filter((l) => l.to === id).map((l) => `<li><button class="linklike" data-ev="${esc(l.from)}">${esc(name(l.from))}</button> <span class="ticker">${esc(l.type)}</span><br>${esc(l.explanation || "")} ${link(l.source_url)}</li>`).join("");
    const outs = C.links.filter((l) => l.from === id).map((l) => `<li><button class="linklike" data-ev="${esc(l.to)}">${esc(name(l.to))}</button> <span class="ticker">${esc(l.type)}</span><br>${esc(l.explanation || "")} ${link(l.source_url)}</li>`).join("");
    document.getElementById("cz-panel").innerHTML = `
      <p class="eyebrow tight">${esc(fmt(e.date))} · ${esc(e.actor || "")}</p>
      <h3>${esc(e.title)}</h3><p>${esc(e.summary || "")} ${link(e.source_url)}</p>
      <h4 class="pw-h4">What led to this (${up.size - 1} steps upstream)</h4><ul class="conn">${ins || "<li>No sourced causes yet.</li>"}</ul>
      <h4 class="pw-h4">What this led to (${down.size - 1} steps downstream)</h4><ul class="conn">${outs || "<li>No sourced effects yet.</li>"}</ul>`;
    document.querySelectorAll("#cz-panel [data-ev]").forEach((b) => b.addEventListener("click", () => select(b.dataset.ev)));
    C.selected = id;
  }

  const d3min = (ev) => ev.reduce((m, e) => (e.date < m ? e.date : m), ev[0].date);
  const d3max = (ev) => ev.reduce((m, e) => (e.date > m ? e.date : m), ev[0].date);

  // Always-visible text equivalent of the map: every event in date order, with its links in and out.
  function eventTable() {
    const name = (i) => (C.events.find((x) => x.id === i) || {}).title || i;
    const laneName = (k) => (LANES.find((l) => l.key === k) || {}).label || k;
    const rows = [...C.events].sort((a, b) => (a.date < b.date ? -1 : 1)).map((e) => {
      const ins = C.links.filter((l) => l.to === e.id).map((l) => `${esc(l.type)}: ${esc(name(l.from))}`).join("<br>");
      const outs = C.links.filter((l) => l.from === e.id).map((l) => `${esc(l.type)}: ${esc(name(l.to))}`).join("<br>");
      return `<tr><td class="nowrap">${esc(fmt(e.date))}</td><td>${esc(laneName(e.lane))}</td><td>${esc(e.title)}<div class="ticker">${esc(e.actor || "")}</div> ${link(e.source_url)}</td><td>${ins}</td><td>${outs}</td><td><button type="button" class="linklike" data-show-ev="${esc(e.id)}">Show on map</button></td></tr>`;
    }).join("");
    return `<table><thead><tr><th scope="col">Date</th><th scope="col">Lane</th><th scope="col">Event</th><th scope="col">From</th><th scope="col">Led to</th><th scope="col"><span class="visually-hidden">Map</span></th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  window.renderCausality = function (data) {
    const el = document.getElementById("tab-causality");
    if (!data || !data.events || !data.events.length) { el.innerHTML = `<div class="coming"><h2>Policy and causality</h2><p>Being sourced now.</p></div>`; return; }
    C = { events: data.events, links: data.links || [], mode: "both", highlight: null, juris: "" };
    const juris = [...new Set(C.events.map((e) => e.jurisdiction).filter(Boolean))].sort();
    const legend = Object.keys(LINK_VAR).map((k) => `<span class="leg static"><svg class="mark" viewBox="0 0 24 12" aria-hidden="true"><line x1="0" y1="6" x2="24" y2="6" stroke="${cssVar("--cz-link")}" stroke-width="2"${LINK_DASH[k] ? ` stroke-dasharray="${LINK_DASH[k]}"` : ""}></line></svg>${esc(k)}</span>`).join("");
    el.innerHTML = `
      <h2>Causality</h2>
      <p class="intro">${C.events.length} dated events in ${LANES.length} lanes, ${fmt(d3min(C.events))} to ${fmt(d3max(C.events))}, with ${C.links.length} sourced links between them.</p>
      <div class="net-controls">
        <div class="seg" role="group" aria-label="Trace">
          <button type="button" data-mode="both" aria-pressed="true">Causes and effects</button>
          <button type="button" data-mode="causes" aria-pressed="false">Causes only</button>
          <button type="button" data-mode="effects" aria-pressed="false">Effects only</button>
        </div>
        <select id="cz-juris" aria-label="Jurisdiction"><option value="">All jurisdictions</option>${juris.map((j) => `<option>${esc(j)}</option>`).join("")}</select>
        <button type="button" class="chip" id="cz-reset">Show everything</button>
      </div>
      <div class="net-legend">${legend}</div>
      <div class="cz-scroll"><div id="cz-graph" class="cz-graph"></div></div>
      <aside id="cz-panel" class="net-panel cz-panel" aria-live="polite"></aside>
      <h3 class="sub-h">Events</h3>
      <div class="table-wrap">${eventTable()}</div>`;
    el.querySelectorAll("[data-show-ev]").forEach((b) => b.addEventListener("click", () => {
      select(b.dataset.showEv);
      document.getElementById("cz-graph").scrollIntoView({ block: "center" });
    }));
    el.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
      C.mode = b.dataset.mode;
      el.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      if (C.selected) select(C.selected);
    }));
    document.getElementById("cz-juris").addEventListener("change", (e) => { C.juris = e.target.value; C.highlight = null; draw(); });
    document.getElementById("cz-reset").addEventListener("click", () => { C.highlight = null; C.selected = null; apply(); });
    const go = () => { if (!el.hidden && !C.drawn) { C.drawn = true; draw(); } };
    new MutationObserver(go).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    go();
  };
})();

// Causal map (a causal timeline): sourced causal links between events, across government, investors, companies, labs and the public.
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
  // Owner, 2026-11-26: name the causal relations as the field does (causal mapping / process tracing).
  const LINK_LABEL = { "led to": "causes", "responded to": "prompts a response", restricts: "constrains", enables: "enables", "cited by": "is cited by" };
  const rel = (k) => LINK_LABEL[k] || k;
  const LINK_DASH = { "led to": null, "responded to": "6 3", restricts: "2 3", enables: "8 3 2 3", "cited by": "1 4" };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const link = (url, label = "source") => url ? `<a class="src" href="${esc(url)}" target="_blank" rel="noopener">[${esc(label)}]</a>` : `<span class="unverified">source pending</span>`;
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#888";
  const fmt = (iso) => window.DATES.long(iso);
  // An event known only to the year (date_precision "year") shows the year, never a made-up day.
  const evDate = (e) => (e.date_precision === "year" ? String(e.date).slice(0, 4) : e.date_precision === "month" ? window.DATES.long(String(e.date).slice(0, 7)) : fmt(e.date));

  // Legal status, grouped from the data's free-text "status" (one shared vocabulary). Each group has its own node
  // mark, so a screenshot still shows which rules bind. Events with no status are plain events (an SEC statement, a
  // company action, a vote).
  const STATUS = [
    { key: "inforce", label: "In force", test: (s) => /^in force/.test(s) },
    { key: "pending", label: "Not yet in force (proposed, bill, signed)", test: (s) => /proposed|bill|not in force|not yet in force|enacted/.test(s) },
    { key: "nonbinding", label: "Nonbinding or voluntary", test: (s) => /nonbinding|voluntary/.test(s) },
    { key: "ended", label: "Revoked, superseded or suspended", test: (s) => /revoked|superseded|suspended/.test(s) },
    { key: "probe", label: "Investigation or preliminary finding", test: (s) => /investigation|preliminary/.test(s) },
  ];
  const statusOf = (e) => {
    const s = String(e.status || "").toLowerCase();
    if (!s) return "event";
    // "ended" is checked before "in force", so "superseded (… resumed …)" reads as ended.
    for (const k of ["ended", "inforce", "pending", "nonbinding", "probe"]) if (STATUS.find((x) => x.key === k).test(s)) return k;
    return "event";
  };
  const STATUS_LABEL = { ...Object.fromEntries(STATUS.map((x) => [x.key, x.label])), event: "Event (no legal status)" };
  const REGION_ORDER = ["United States", "European Union", "United Kingdom", "China", "Asia-Pacific", "Americas (other)", "Global"];
  const isSecondary = (e) => /^secondary/i.test(e.source_kind || "");

  let C = null;
  const inView = (e) => e.date && (!C.region || e.region === C.region) && (!C.juris || e.jurisdiction === C.juris) && (!C.status || statusOf(e) === C.status);

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

  // Time navigation for the sideways-scrolling chart: the dates in view, Earlier / Later, and an overview strip
  // of the years with the visible window marked (click to jump).
  function timeNav(xr, t0, t1, W) {
    const sc = document.querySelector("#tab-causality .cz-scroll");
    const cap = document.getElementById("cz-window"), ov = document.getElementById("cz-overview");
    const back = document.getElementById("cz-earlier"), fwd = document.getElementById("cz-later");
    if (!sc || !cap || !ov) return;
    const dateAt = (px) => {
      let lo = +t0, hi = +t1;
      for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (xr(new Date(mid)) < px) lo = mid; else hi = mid; }
      return new Date((lo + hi) / 2);
    };
    const ym = (d) => d.toISOString().slice(0, 7);
    const day = (d) => d.toISOString().slice(0, 10);
    const D = (v) => (window.DATES ? window.DATES.long(v) : v);
    const years = d3.timeYear.range(d3.timeYear.ceil(t0), t1);
    const gap = (100 * 38) / Math.max(200, ov.clientWidth || 600); // at least 38 px between year labels
    let lastX = -1e9;
    ov.innerHTML = `<div class="cz-ov-track">${years.map((y) => {
      const f = (100 * xr(y)) / W;
      if (f - lastX < gap || f > 100 - gap / 2) return "";
      lastX = f;
      return `<span class="cz-ov-year" style="left:${f}%">${y.getFullYear()}</span>`;
    }).join("")}<span class="cz-ov-window"></span></div>`;
    const win = ov.querySelector(".cz-ov-window");
    let settle;
    const update = () => {
      const a = sc.scrollLeft, b = a + sc.clientWidth;
      clearTimeout(settle);
      settle = setTimeout(() => { cap.textContent = text(a, b); }, 250);
      win.style.left = `${(100 * a) / W}%`;
      win.style.width = `${(100 * Math.min(W, sc.clientWidth)) / W}%`;
      // aria-disabled, not disabled, so keyboard focus stays on the button at either end.
      if (back) back.setAttribute("aria-disabled", String(a <= 1));
      if (fwd) fwd.setAttribute("aria-disabled", String(b >= W - 1));
    };
    const text = (a, b) => `Showing ${D(ym(dateAt(Math.max(a, xr(t0)))))} to ${D(ym(dateAt(Math.min(b, xr(t1)))))}, of events from ${D(day(t0))} to ${D(day(t1))}. Scroll sideways or use Earlier and Later. The time scale gives recent years more room.`;
    const smooth = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    if (back) back.onclick = () => back.getAttribute("aria-disabled") !== "true" && sc.scrollBy({ left: -0.8 * sc.clientWidth, behavior: smooth });
    if (fwd) fwd.onclick = () => fwd.getAttribute("aria-disabled") !== "true" && sc.scrollBy({ left: 0.8 * sc.clientWidth, behavior: smooth });
    ov.onclick = (e) => {
      const r = ov.querySelector(".cz-ov-track").getBoundingClientRect();
      sc.scrollTo({ left: ((e.clientX - r.left) / r.width) * W - sc.clientWidth / 2, behavior: smooth });
    };
    sc.onscroll = update;
    requestAnimationFrame(() => { update(); cap.textContent = text(sc.scrollLeft, sc.scrollLeft + sc.clientWidth); });
  }

  function draw() {
    const box = document.getElementById("cz-graph");
    box.innerHTML = "";
    const top = 30, left = 10;
    const ev = C.events.filter(inView);
    if (!ev.length) { box.innerHTML = `<p class="status-note cz-empty">No events match these filters.</p>`; C.nodeSel = C.labelSel = C.linkSel = null; return; }
    const W = Math.max(box.clientWidth || 900, 720, ev.length * 34);
    // Only lanes that hold events in the current view take space.
    const lanes = LANES.filter((l) => ev.some((e) => e.lane === l.key));
    const dates = ev.map((e) => new Date(e.date));
    // Time runs on a power scale (exponent 1.8) so the crowded recent months get more room than quiet years.
    const [t0, t1] = d3.extent(dates);
    const span = t1 - t0 || 1;
    const xr = (d) => left + 20 + (W - left - 60) * Math.pow((d - t0) / span, 1.8);
    // Spread events that land close together in the same lane so they don't overlap (offsets from the lane's
    // middle), then size each lane to its tallest stack, so a busy lane grows instead of spilling into the next.
    const placed = [];
    ev.sort((a, b) => (a.date < b.date ? -1 : 1)).forEach((e) => {
      const x0 = xr(new Date(e.date));
      let off = 0, k = 0;
      while (placed.some((p) => p.lane === e.lane && Math.abs(p.x - x0) < 16 && Math.abs(p.off - off) < 14)) { k++; off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 15; }
      e._x = x0; e._off = off; placed.push({ lane: e.lane, x: x0, off });
    });
    const laneHs = lanes.map((l) => Math.max(70, 2 * Math.max(0, ...placed.filter((p) => p.lane === l.key).map((p) => Math.abs(p.off))) + 40));
    const laneTop = (i) => top + laneHs.slice(0, i).reduce((a, b) => a + b, 0);
    const H = laneTop(lanes.length) + 30;
    const laneY = (k) => { const i = Math.max(0, lanes.findIndex((l) => l.key === k)); return laneTop(i) + laneHs[i] / 2; };
    ev.forEach((e) => { e._y = laneY(e.lane) + e._off; });
    const byId = new Map(ev.map((e) => [e.id, e]));

    const svg = d3.select(box).append("svg").attr("viewBox", [0, 0, W, H]).attr("width", W).attr("height", H);
    const defs = svg.append("defs");
    Object.entries(LINK_VAR).forEach(([k, v]) => defs.append("marker").attr("id", "arr-" + k.replace(/\W/g, ""))
      .attr("viewBox", "0 -4 8 8").attr("refX", 12).attr("markerWidth", 7).attr("markerHeight", 7).attr("orient", "auto")
      .append("path").attr("d", "M0,-4L8,0L0,4").attr("fill", cssVar(v)));

    lanes.forEach((l, i) => {
      svg.append("rect").attr("x", 0).attr("y", laneTop(i)).attr("width", W).attr("height", laneHs[i])
        .attr("fill", i % 2 ? cssVar("--bg") : cssVar("--surface"));
    });
    // Lane names stay pinned at the left edge while the chart scrolls sideways (it opens on the latest events).
    // Owner, 2026-11-26: lane names outside the chart box (a fixed column to its left, lined up with the lanes),
    // and a clear sense of time: Earlier / Later buttons, the dates in view, and an overview strip of the years.
    const laneLabels = () => {
      const col = document.getElementById("cz-lanes");
      if (col) {
        col.style.height = `${H}px`;
        col.innerHTML = lanes.map((l, i) => `<span style="top:${laneTop(i) + 14}px">${esc(l.label)}</span>`).join("");
      }
      timeNav(xr, t0, t1, W);
    };
    // Month labels along the top, placed with the same stretched scale.
    const months = d3.timeMonth.range(d3.timeMonth.ceil(t0), t1, 1).filter((m, i, all) => i === 0 || xr(m) - xr(all[i - 1]) > 0);
    // Every label carries its year ("Jun ’25"), so any part of the chart, scrolled or screenshotted, is dated
    // (owner, 2026-11-26).
    let lastX = -1e9;
    months.forEach((m) => {
      const mx = xr(m);
      if (mx - lastX < 64) return;
      lastX = mx;
      svg.append("text").text(d3.timeFormat("%b ’%y")(m)).attr("x", mx).attr("y", top - 10)
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
    C.linkSel.append("title").text((l) => `${rel(l.type)}: ${l.explanation || ""}`);

    C.nodeSel = svg.append("g").selectAll("g").data(ev).join("g").attr("transform", (e) => `translate(${e._x},${e._y})`)
      .style("cursor", "pointer").on("click", (evt, e) => select(e.id));
    const rOf = (e) => 5 + Math.min(5, C.links.filter((l) => l.from === e.id || l.to === e.id).length);
    C.nodeSel.each(function (e) { mark(d3.select(this), statusOf(e), rOf(e)); });
    C.nodeSel.append("title").text((e) => `${evDate(e)}: ${e.title}`);
    C.labelSel = C.nodeSel.append("text").text((e) => (e.title.length > 34 ? e.title.slice(0, 33) + "…" : e.title))
      .attr("x", 9).attr("y", 4).attr("font-size", 10.5).attr("fill", cssVar("--ink")).attr("opacity", 0);
    laneLabels();
    apply();
  }

  // Node mark by legal status (also drawn in the status key).
  function mark(g, st, r) {
    const blue = cssVar("--cz-node"), white = cssVar("--surface"), grey = "#9a9a9a";
    if (st === "inforce") {
      g.append("circle").attr("r", r + 3).attr("fill", "none").attr("stroke", blue).attr("stroke-width", 1.2);
      g.append("circle").attr("r", r).attr("fill", blue).attr("stroke", white).attr("stroke-width", 1.5);
    } else if (st === "pending") g.append("circle").attr("r", r).attr("fill", white).attr("stroke", blue).attr("stroke-width", 2);
    else if (st === "nonbinding") g.append("circle").attr("r", r).attr("fill", cssVar("--blue-light")).attr("stroke", blue).attr("stroke-width", 1.2);
    else if (st === "ended") {
      g.append("circle").attr("r", r).attr("fill", grey).attr("stroke", white).attr("stroke-width", 1.5);
      g.append("line").attr("x1", -r).attr("y1", r).attr("x2", r).attr("y2", -r).attr("stroke", "#4a4a4a").attr("stroke-width", 1.5);
    } else if (st === "probe") g.append("circle").attr("r", r).attr("fill", white).attr("stroke", blue).attr("stroke-width", 1.6).attr("stroke-dasharray", "2 2");
    else g.append("circle").attr("r", r).attr("fill", blue).attr("stroke", white).attr("stroke-width", 1.5);
  }
  function statusKey() {
    const shown = new Set(C.events.filter(inView).map(statusOf));
    const keys = [...STATUS.map((x) => x.key), "event"].filter((k) => shown.has(k));
    document.getElementById("cz-status-key").innerHTML = `<span class="status-note">Status:</span> ${keys.map((k) => {
      const svg = d3.create("svg").attr("class", "mark").attr("viewBox", "-9 -9 18 18").attr("aria-hidden", "true");
      mark(svg.append("g"), k, 5);
      return `<span class="leg static">${svg.node().outerHTML}${esc(STATUS_LABEL[k])}</span>`;
    }).join("")}`;
  }
  function apply() {
    if (!C.nodeSel) return;
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
    const ins = C.links.filter((l) => l.to === id).map((l) => `<li><button class="linklike" data-ev="${esc(l.from)}">${esc(name(l.from))}</button> <span class="ticker">${esc(rel(l.type))}</span><br>${esc(l.explanation || "")} ${link(l.source_url)}</li>`).join("");
    const outs = C.links.filter((l) => l.from === id).map((l) => `<li><button class="linklike" data-ev="${esc(l.to)}">${esc(name(l.to))}</button> <span class="ticker">${esc(rel(l.type))}</span><br>${esc(l.explanation || "")} ${link(l.source_url)}</li>`).join("");
    document.getElementById("cz-panel").innerHTML = `
      <p class="eyebrow tight">${esc(evDate(e))} · ${esc(e.actor || "")}${e.region ? ` · ${esc(e.region)}` : ""}</p>
      <h3>${esc(e.title)}</h3>
      ${e.status ? `<p><strong>Status:</strong> ${esc(e.status)}</p>` : ""}
      <p>${esc(e.summary || "")} ${link(e.source_url)}${isSecondary(e) ? ` <span class="unverified">secondary source</span>` : ""}${e.suspension_source_url ? ` ${link(e.suspension_source_url, "suspension")}` : ""}</p>
      <h4 class="pw-h4">Antecedents (${up.size - 1} ${up.size - 1 === 1 ? "step" : "steps"} upstream)</h4><ul class="conn">${ins || "<li>No sourced antecedents yet.</li>"}</ul>
      <h4 class="pw-h4">Consequences (${down.size - 1} ${down.size - 1 === 1 ? "step" : "steps"} downstream)</h4><ul class="conn">${outs || "<li>No sourced consequences yet.</li>"}</ul>`;
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
      const ins = C.links.filter((l) => l.to === e.id).map((l) => `${esc(rel(l.type))}: ${esc(name(l.from))}`).join("<br>");
      const outs = C.links.filter((l) => l.from === e.id).map((l) => `${esc(rel(l.type))}: ${esc(name(l.to))}`).join("<br>");
      return `<tr><td class="nowrap">${esc(evDate(e))}</td><td>${esc(e.region || "")}</td><td>${esc(e.status || "")}</td><td>${esc(laneName(e.lane))}</td><td>${esc(e.title)}<div class="ticker">${esc(e.actor || "")}</div> ${link(e.source_url)}</td><td>${ins}</td><td>${outs}</td><td><button type="button" class="linklike" data-show-ev="${esc(e.id)}">Show on map</button></td></tr>`;
    }).join("");
    return `<table><thead><tr><th scope="col">Date</th><th scope="col">Region</th><th scope="col">Status</th><th scope="col">Lane</th><th scope="col">Event</th><th scope="col">From</th><th scope="col">Led to</th><th scope="col"><span class="visually-hidden">Map</span></th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  window.renderCausality = function (data) {
    const el = document.getElementById("tab-causality");
    if (!data || !data.events || !data.events.length) { el.innerHTML = `<div class="coming"><h2>Policy and causality</h2><p>Being sourced now.</p></div>`; return; }
    C = { events: data.events, links: data.links || [], mode: "both", highlight: null, juris: "", region: "", status: "" };
    const count = (f) => C.events.filter(f).length;
    const regions = [...new Set(C.events.map((e) => e.region).filter(Boolean))].sort((a, b) => (REGION_ORDER.indexOf(a) + 99) % 99 - (REGION_ORDER.indexOf(b) + 99) % 99 || a.localeCompare(b));
    const statuses = [...STATUS.map((x) => x.key), "event"].filter((k) => C.events.some((e) => statusOf(e) === k));
    const jurisOptions = () => [...new Set(C.events.filter((e) => !C.region || e.region === C.region).map((e) => e.jurisdiction).filter(Boolean))].sort();
    const legend = Object.keys(LINK_VAR).map((k) => `<span class="leg static"><svg class="mark" viewBox="0 0 24 12" aria-hidden="true"><line x1="0" y1="6" x2="24" y2="6" stroke="${cssVar("--cz-link")}" stroke-width="2"${LINK_DASH[k] ? ` stroke-dasharray="${LINK_DASH[k]}"` : ""}></line></svg>${esc(rel(k))}</span>`).join("");
    el.innerHTML = `
      <h2>Causal map of AI policy and governance</h2>
      <p class="intro">${C.events.length} dated events, ${fmt(d3min(C.events))} to ${fmt(d3max(C.events))}: AI laws, regulation and SEC rule changes, and how companies, investors and labs responded. Each of the ${C.links.length} arrows is a causal link stated in a cited source. Select an event to trace its antecedents and consequences.</p>
      <div class="net-controls">
        <div class="seg" role="group" aria-label="Trace">
          <button type="button" data-mode="both" aria-pressed="true">Antecedents and consequences</button>
          <button type="button" data-mode="causes" aria-pressed="false">Antecedents only</button>
          <button type="button" data-mode="effects" aria-pressed="false">Consequences only</button>
        </div>
        ${regions.length ? `<select id="cz-region" aria-label="Region"><option value="">All regions (${C.events.length})</option>${regions.map((r) => `<option value="${esc(r)}">${esc(r)} (${count((e) => e.region === r)})</option>`).join("")}</select>` : ""}
        <select id="cz-juris" aria-label="Jurisdiction"></select>
        <select id="cz-status" aria-label="Legal status"><option value="">Any status</option>${statuses.map((k) => `<option value="${k}">${esc(STATUS_LABEL[k])} (${count((e) => statusOf(e) === k)})</option>`).join("")}</select>
        <button type="button" class="chip" id="cz-reset">Reset filters</button>
      </div>
      <figure class="fig cz-fig">
      ${window.figHead(`Causal map of AI policy and governance, ${window.yearSpan(C.events.map((e) => e.date))}`, `${plural(C.events.length, "event")} by lane (rows) and date (left to right; recent months get more room). Arrows run from an event to what followed from it; the mark on each event is its legal status.`)}
      <div class="net-legend">${legend}</div>
      <div class="net-legend" id="cz-status-key"></div>
      <p class="count-line" id="cz-count" aria-live="polite"></p>
      <div class="cz-timebar"><button type="button" class="chip" id="cz-earlier">← Earlier</button> <span id="cz-window" class="ticker" aria-live="polite"></span> <button type="button" class="chip" id="cz-later">Later →</button></div>
      <div class="cz-frame"><div class="cz-lanes" id="cz-lanes" aria-hidden="true"></div><div class="cz-scroll"><div id="cz-graph" class="cz-graph"></div></div></div>
      <div class="cz-overview" id="cz-overview" aria-hidden="true" title="Years covered; the box is the part in view. Click to jump."></div>
      ${window.figSource("official texts, court and agency records, and filings, cited for each event in the list view.")}
      </figure>
      <aside id="cz-panel" class="net-panel cz-panel" aria-live="polite"></aside>
      <details class="cz-list">
        <summary>List view: the same ${C.events.length} events as text</summary>
        <div class="table-wrap">${eventTable()}</div>
      </details>`;
    el.querySelectorAll("[data-show-ev]").forEach((b) => b.addEventListener("click", () => {
      select(b.dataset.showEv);
      document.getElementById("cz-graph").scrollIntoView({ block: "center" });
    }));
    el.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => {
      C.mode = b.dataset.mode;
      el.querySelectorAll("[data-mode]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      if (C.selected) select(C.selected);
    }));
    const fillJuris = () => {
      const js = jurisOptions();
      if (C.juris && !js.includes(C.juris)) C.juris = "";
      document.getElementById("cz-juris").innerHTML = `<option value="">All jurisdictions</option>${js.map((j) => `<option${j === C.juris ? " selected" : ""}>${esc(j)}</option>`).join("")}`;
    };
    const redraw = () => {
      C.highlight = null;
      // A selected event that the filters now hide (or "Show everything") clears the side panel and the trace.
      const cur = C.selected && C.events.find((x) => x.id === C.selected);
      if (!cur || !inView(cur)) { C.selected = null; document.getElementById("cz-panel").innerHTML = ""; }
      draw();
      if (C.selected) select(C.selected); // an event still in view keeps its trace on the map
      statusKey();
      const n = C.events.filter(inView).length;
      document.getElementById("cz-count").textContent = `${n} of ${C.events.length} events shown.`;
      const sc = el.querySelector(".cz-scroll");
      if (sc) sc.scrollLeft = sc.scrollWidth;
    };
    fillJuris();
    statusKey();
    document.getElementById("cz-count").textContent = `${C.events.length} of ${C.events.length} events shown.`;
    const reg = document.getElementById("cz-region");
    if (reg) reg.addEventListener("change", (e) => { C.region = e.target.value; fillJuris(); redraw(); });
    document.getElementById("cz-juris").addEventListener("change", (e) => { C.juris = e.target.value; redraw(); });
    document.getElementById("cz-status").addEventListener("change", (e) => { C.status = e.target.value; redraw(); });
    // "Show everything" clears the trace and every filter.
    document.getElementById("cz-reset").addEventListener("click", () => {
      C.selected = null; C.region = ""; C.juris = ""; C.status = "";
      ["cz-region", "cz-status"].forEach((id) => { const x = document.getElementById(id); if (x) x.value = ""; });
      fillJuris();
      redraw();
    });
    // Open scrolled to the latest events, so the current season is in view.
    const go = () => { if (!el.hidden && !C.drawn) { C.drawn = true; draw(); const sc = el.querySelector(".cz-scroll"); if (sc) sc.scrollLeft = sc.scrollWidth; } };
    new MutationObserver(go).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    go();
  };
})();

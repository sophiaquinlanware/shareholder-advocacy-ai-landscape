// Value chain tab: a layered flow of sourced ties between companies, by value-chain tier, and an engagement
// map (tier × engagement type). Reads data/value_chain.json (tiers, ties, per_tier, derived_note) and
// data/companies.json. Plan: docs/plans/2026-11-26-value-chain-ui.md.
//
// Owner (2026-11-25): "One visual is a map of engagement, and another visual is a map of the value chain …
// it's clear that engaging at this level, hyperscaler level, means this is the effect you can have, these are
// the different players you can reach, and these are the stakeholders you need to engage with."
// Everything shown comes from the data with its source; nothing here is advice.

(function () {
  // Draw-in progress and the traced tie, kept across redraws.
  const S = {};
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#1f4e98";
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`;
  const src = (u, label = "source") => (u ? ` <a class="src" href="${esc(u)}" target="_blank" rel="noopener">[${esc(label)}]</a>` : ` <span class="unverified">source pending</span>`);
  // Tie types differ by dash pattern, not colour (all marks are blue on white).
  // Six clearly different line patterns (owner, 2026-11-27: the old dashes were "not distinct enough"): solid, long
  // dash, round dots, dash-dot, short dash, dash-dot-dot. Dotted lines use round caps so the dots read as dots.
  const DASH = { "supplies chips": null, "manufactures for": "14 6", "leases capacity to": "0.1 6", "provides compute to": "12 4 2 4", "supplies power to": "5 5", "distributes models": "12 3 2 3 2 3", "owns or invests in": "2 3", "commercial agreement with": "22 5" };
  const CAP = { "leases capacity to": "round" };
  // Each tie type as words that read as a sentence: "{from} {phrase} {to}".
  const PHRASE = { "supplies chips": "supplies chips to", "manufactures for": "manufactures for", "leases capacity to": "leases capacity to", "provides compute to": "provides compute to", "supplies power to": "supplies power to", "distributes models": "distributes the models of", "owns or invests in": "owns or invests in", "commercial agreement with": "has a commercial agreement with" };
  const phrase = (t) => PHRASE[t] || t;
  const SHORT_TIER = { chips: "Chips", datacenters: "Data centers", cloud: "Cloud platforms", labs: "Frontier labs", capital: "Strategic investors", consumer: "Consumer", business: "Business" };
  // Columns are the site's company roles (roles.js) in value-chain order, with strategic investors in their own
  // column at the end (owner, 2026-11-27: they looked misplaced under frontier labs).
  const FLOW = ["chips", "datacenters", "cloud", "labs", "consumer", "business", "capital"];
  const roleOfId = (id) => (window.ROLES && CO.get(id) ? window.ROLES.roleOf(CO.get(id)) : (CO.get(id) || {}).tier);
  // per_tier data comes by value-chain tier; its rows use the role names, with deployers covering both products roles.
  const TIER_AS_ROLE = { chips: "Chips and hardware", datacenters: "Data centers and power", compute: "Cloud and model platforms", labs: "Frontier labs", capital: "Strategic investors", deployers: "Consumer and business products" };
  let V = null;
  let CO = null;

  // Scope rule (owner, 2026-11-27: make clear the purpose is to model the value chain, not to cover every player, and
  // state the rule that selects the subset). Counted from each company's recorded basis and the sourced lab ties.
  function scopeNote() {
    const BASIS = { "shareholder proposal": "had an AI shareholder proposal on its ballot since 2023", "safety commitment": "signed a frontier AI safety commitment", "investor engagement": "was the subject of an AI engagement reported by an investor", "compute agreement": "holds a compute agreement with a frontier lab" };
    const n = {};
    let viaTie = 0;
    for (const c of CO.values()) {
      if (c.from_pathways) { viaTie++; continue; }
      if (c.basis_type) n[c.basis_type] = (n[c.basis_type] || 0) + 1;
    }
    const total = Object.values(n).reduce((a, b) => a + b, 0) + viaTie;
    const parts = Object.entries(n).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${esc(BASIS[k] || k)} (${v})`);
    if (viaTie) parts.push(`is named in a sourced ownership, supply or distribution tie to a frontier lab (${viaTie})`);
    return `<details class="vc-scope"><summary>Scope: which companies this model includes, and why (${total})</summary>
      <p>The map models how influence travels along the AI value chain toward the frontier labs. It is not a census of every company in AI, and market share is not a criterion. A company is included when its record meets one of these tests; each is counted once, under the reason recorded for it:</p>
      <ul>${parts.map((p) => `<li>it ${p}</li>`).join("")}</ul>
      <p class="status-note">Each company's reason and source are on its profile. Companies outside these tests are out of scope.</p></details>`;
  }

  function shell(el) {
    const nCos = new Set(V.ties.flatMap((t) => [t.from, t.to])).size;
    el.innerHTML = `
      <h2>A model of the AI value chain: how companies connect, from chips to AI products</h2>
      <p class="intro">One connected model of the AI value chain: ${plural(V.ties.length, "sourced tie")} among ${nCos} companies, arranged by stage from chip makers to the companies that sell AI products. Most frontier labs are private; shareholders reach them through the listed companies that own, fund, supply or distribute them. Stages are this site's reading of each company's main role.</p>
      ${scopeNote()}
      <div class="vc-tiers" role="group" aria-label="Value-chain stages">${V.tiers
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((t) => `<button type="button" class="chip" data-tier="${esc(t.id)}" aria-pressed="false">${esc(t.label)}</button>`)
        .join("")}</div>
      <figure class="card chart-card fig">
        ${window.figHead(`The value chain model: sourced ties between companies, by stage`, `${plural(V.ties.length, "sourced tie")} among ${nCos} companies, dated ${window.yearSpan(V.ties.map((t) => t.as_of))}. Columns are each company's main role (this site's reading); circle size = number of ties; line pattern = type of tie.`)}
        <div class="net-legend" id="vc-key"></div>
        <div class="chart-scroll" tabindex="0" role="region" aria-label="Value chain chart (scrolls sideways on small screens)"><div id="vc-flow" class="vc-flow"></div></div>
        ${window.figSource("company filings and announcements, cited for each tie in the list view.")}
      </figure>
      <p class="visually-hidden" id="vc-status" aria-live="polite"></p>
      <section id="vc-panel" class="net-panel vc-panel" aria-label="Details"><p class="status-note">Choose a stage or a company to see what it reaches, the asks made there and who is engaging.</p></section>
      <details class="cz-list"><summary>List view: the same ${V.ties.length} ties as text</summary><div class="table-wrap" id="vc-ties"></div></details>
            <figure class="card chart-card fig">
        ${window.figHead("Engagement record by value-chain stage", "AI proposals since 2023 at companies under US proxy rules. Median support: votes for ÷ (for + against), proposals lead-filed by filers critical of ESG left out; range = lowest to highest; n = proposals with recorded votes. Support by year: median per meeting year. Commitments won: company commitments that ended an engagement or proposal. Next filing deadline: within 90 days. A company at several stages is counted at each. Select a figure for its records. Not a recommendation.")}
        <div class="table-wrap" id="vc-heat" tabindex="0" role="region" aria-label="Engagement record by value-chain stage"></div>
        ${window.figSource("company proxy statements and 8-K vote results; investor and coalition records, as cited in each stage's details.")}
      </figure>`;
  }

  const name = (id) => (CO.get(id) || {}).name || id;
  const tierLabel = (id) => TIER_AS_ROLE[id] || (window.ROLES && window.ROLES.label(id)) || (V.tiers.find((t) => t.id === id) || {}).label || id;

  function drawFlow() {
    const box = document.getElementById("vc-flow");
    box.innerHTML = "";
    if (typeof d3 === "undefined") { box.innerHTML = `<p class="status-note">The chart library did not load; the ties are listed below.</p>`; return; }
    const inTies = new Set(V.ties.flatMap((t) => [t.from, t.to]));
    const everyone = new Set([...CO.keys()].filter((id) => FLOW.includes(roleOfId(id))));
    const W = Math.max(720, box.clientWidth || 900);
    const colX = (i) => 70 + (i * (W - 220)) / (FLOW.length - 1);
    // Short column headings whenever the full ones would run into each other.
    const narrow = (W - 220) / (FLOW.length - 1) < 175;
    // Whole map on one screen (owner, 2026-11-26: "rethink the spacing so that on one computer screen you can see
    // the whole visual … I do like the left to right"). Columns hold only companies with a sourced tie; the rest are
    // counted at the foot of their column. Row spacing fits the window height, between 30 and 58 px.
    const cols = FLOW.map((tid, i) => {
      const all = [...everyone].filter((id) => roleOfId(id) === tid);
      const ids = all.filter((id) => inTies.has(id)).sort((a, b) => name(a).localeCompare(name(b)));
      return { tid, x: colX(i), ids, untied: all.length - ids.length };
    });
    const longest = Math.max(1, ...cols.map((c) => c.ids.length));
    const avail = Math.max(380, (window.innerHeight || 900) - 260);
    const rowH = Math.max(30, Math.min(58, Math.floor(avail / longest)));
    const compact = rowH < 44;
    const top = compact ? 56 : 80;
    const H = top + longest * rowH + 48;
    const pos = new Map();
    cols.forEach((c) => c.ids.forEach((id, j) => pos.set(id, { x: c.x, y: top + j * rowH })));
    const untiedCols = [];
    cols.forEach((c) => { if (c.untied) untiedCols.push(c); });
    const deg = new Map();
    V.ties.forEach((t) => { deg.set(t.from, (deg.get(t.from) || 0) + 1); deg.set(t.to, (deg.get(t.to) || 0) + 1); });
    const svg = d3.select(box).append("svg").attr("viewBox", [0, 0, W, H]).attr("width", W).attr("height", H)
      .attr("role", "group").attr("aria-label", `Value chain: ${V.ties.length} sourced ties between companies, by stage. Each company is a button; the same ties are in the list view below.`);
    cols.forEach((c) => svg.append("text").attr("x", c.x).attr("y", 24).attr("text-anchor", "middle").attr("font-size", 12).attr("font-weight", 400).attr("fill", cssVar("--ink-soft"))
      .text((narrow ? SHORT_TIER[c.tid] || tierLabel(c.tid) : c.tid === "business" ? "Business and government" : tierLabel(c.tid)).toUpperCase()));
    const ink = cssVar("--blue-2");
    // Drawn in as the reader scrolls (owner, 2026-11-26: "animate it to be liquid as you scroll … filled out across
    // the value chain so you can see it being drawn"): a soft-edged mask sweeps from chips to AI products, tied to
    // how far the chart has come into view. It never undraws; with reduced motion it is drawn at once.
    const FEATHER = 140;
    const defs = svg.append("defs");
    const grad = defs.append("linearGradient").attr("id", "vc-feather");
    grad.append("stop").attr("offset", 0).attr("stop-color", "#fff");
    grad.append("stop").attr("offset", 1).attr("stop-color", "#000");
    const mask = defs.append("mask").attr("id", "vc-reveal").attr("maskUnits", "userSpaceOnUse").attr("x", 0).attr("y", 0).attr("width", W).attr("height", H);
    const solid = mask.append("rect").attr("x", 0).attr("y", 0).attr("height", H).attr("fill", "#fff");
    const edge = mask.append("rect").attr("y", 0).attr("width", FEATHER).attr("height", H).attr("fill", "url(#vc-feather)");
    const drawn = svg.append("g").attr("mask", "url(#vc-reveal)");
    const setReveal = (p) => {
      const x = -FEATHER + p * (W + FEATHER * 2);
      solid.attr("width", Math.max(0, x));
      edge.attr("x", x);
    };
    S.reveal = { set: setReveal, W };
    setReveal(REDUCED() ? 1.2 : S.revealP || 0);
    drawn.append("g").attr("fill", "none").selectAll("path").data(V.ties.filter((t) => pos.has(t.from) && pos.has(t.to))).join("path")
      .attr("d", (t) => {
        const a = pos.get(t.from), b = pos.get(t.to);
        const mx = (a.x + b.x) / 2;
        return a.x === b.x ? `M${a.x},${a.y}C${a.x + 60},${a.y} ${b.x + 60},${b.y} ${b.x},${b.y}` : `M${a.x},${a.y}C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
      })
      .attr("class", "vc-tie").attr("stroke", ink).attr("stroke-opacity", 0.7).attr("stroke-width", (t) => (CAP[t.type] ? 3 : 2)).attr("stroke-dasharray", (t) => DASH[t.type] || null).attr("stroke-linecap", (t) => CAP[t.type] || "butt")
      .append("title").text((t) => `${name(t.from)} ${phrase(t.type)} ${name(t.to)}`);
    // Tap (or Enter on) a line to trace it: the tie and every tie upstream of it and downstream of it along the
    // value chain turn orange, so a path from chips to AI products reads at a glance (owner, 2026-11-26). Wide,
    // invisible strokes make thin and dotted lines easy to hit.
    drawn.append("g").attr("fill", "none").selectAll("path").data(V.ties.filter((t) => pos.has(t.from) && pos.has(t.to))).join("path")
      .attr("d", (t) => {
        const a = pos.get(t.from), b = pos.get(t.to);
        const mx = (a.x + b.x) / 2;
        return a.x === b.x ? `M${a.x},${a.y}C${a.x + 60},${a.y} ${b.x + 60},${b.y} ${b.x},${b.y}` : `M${a.x},${a.y}C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
      })
      .attr("class", "vc-hit").attr("stroke", "transparent").attr("stroke-width", 12).style("cursor", "pointer")
      .attr("tabindex", 0).attr("role", "button").attr("aria-label", (t) => `Trace: ${name(t.from)} ${phrase(t.type)} ${name(t.to)}`)
      .on("click", (ev, t) => { ev.stopPropagation(); trace(t); })
      .on("keydown", (ev, t) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); trace(t); } });
    svg.on("click", () => { if (S.traced) trace(null); });
    const nodes = drawn.append("g").selectAll("g").data([...pos.entries()]).join("g").attr("transform", ([, p]) => `translate(${p.x},${p.y})`);
    const co = nodes.filter(([id]) => id !== "__capital__")
      .attr("tabindex", 0).attr("role", "button").attr("aria-label", ([id]) => `${name(id)}: ${plural(deg.get(id) || 0, "tie")}`).style("cursor", "pointer")
      .on("click", (ev, [id]) => { ev.stopPropagation(); showCompany(id); })
      .on("keydown", (ev, [id]) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); showCompany(id); } });
    co.append("circle").attr("r", ([id]) => (deg.get(id) ? 3 + Math.sqrt(deg.get(id)) * 1.6 : 3.5))
      .attr("fill", ([id]) => (deg.get(id) ? cssVar("--blue-1") : cssVar("--surface"))).attr("stroke", cssVar("--blue-1")).attr("stroke-width", 1.2);
    // Names sit just above each circle, clear of the lines that leave it sideways, larger and with a wide white
    // outline so crossing lines never run through the letters.
    co.append("text").attr("x", ([id]) => (compact ? 4 + Math.sqrt(deg.get(id) || 1) * 1.6 + 4 : 0)).attr("y", ([id]) => (compact ? 4 : -(3 + Math.sqrt(deg.get(id) || 1) * 1.6) - 6)).attr("text-anchor", compact ? "start" : "middle").attr("font-size", compact ? 12 : 13).attr("font-weight", 400).attr("fill", ([id]) => (deg.get(id) ? cssVar("--ink") : cssVar("--ink-soft")))
      .attr("stroke", cssVar("--surface")).attr("stroke-width", 5).attr("stroke-linejoin", "round").attr("paint-order", "stroke").text(([id]) => { const n = name(id), max = compact ? 20 : 26; return n.length > max ? n.slice(0, max - 1) + "…" : n; });
    untiedCols.forEach((c) => svg.append("text").attr("x", c.x).attr("y", top + c.ids.length * rowH + 4).attr("text-anchor", compact ? "start" : "middle").attr("font-size", 11.5).attr("fill", cssVar("--ink-soft")).text(`+${c.untied} with no sourced tie yet`));
    // Key: one dash pattern per tie type.
    document.getElementById("vc-key").innerHTML = [...new Set(V.ties.map((t) => t.type))].map((k) =>
      `<span class="leg static"><svg class="mark vc-line" viewBox="0 0 44 10" aria-hidden="true"><line x1="2" y1="5" x2="42" y2="5" stroke="${ink}" stroke-width="2.5"${DASH[k] ? ` stroke-dasharray="${DASH[k]}"` : ""}${CAP[k] ? ` stroke-linecap="${CAP[k]}"` : ""}></line></svg>${esc(k)}</span>`).join("")
      + `<span class="status-note">Tap a line to trace its path in orange; tap the chart again to clear. Each line is one sourced tie; open a company to read its ties in words. Circle size = number of sourced ties; Each column lists its companies with a sourced tie; the count beneath it is the companies at that stage with none yet (listed in the stage's details). Ties to frontier labs, including equity stakes and parent companies, come from Listed companies tied to each lab.</span>`;
  }

  const REDUCED = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Draw-in: once the chart is on screen, the sweep runs from chips to AI products over 4 seconds by itself,
  // whatever the reader does with the scroll (owner, 2026-11-26). It plays once; reduced motion draws it at once.
  function wireReveal() {
    if (S.revealWired) return;
    S.revealWired = true;
    const done = () => { S.revealP = 1.2; if (S.reveal) S.reveal.set(1.2); };
    if (REDUCED() || typeof IntersectionObserver === "undefined") { done(); return; }
    const DUR = 4000;
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const play = () => {
      const t0 = performance.now();
      const step = (now) => {
        const t = Math.min(1, (now - t0) / DUR);
        S.revealP = 1.2 * ease(t);
        if (S.reveal) S.reveal.set(S.revealP);
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { io.disconnect(); play(); }
    }, { threshold: 0.15 });
    io.observe(document.getElementById("vc-flow"));
  }
  const TRACE = "#e8590c";
  function trace(t) {
    S.traced = t;
    if (typeof d3 === "undefined") return;
    const ties = V.ties;
    if (!t) {
      d3.selectAll("#vc-flow path.vc-tie").attr("stroke", cssVar("--blue-2")).attr("stroke-opacity", 0.7).attr("stroke-width", (x) => (CAP[x.type] ? 3 : 2));
      announce("Trace cleared.");
      return;
    }
    // Upstream: ties into the tie's start, and into theirs; downstream: ties out of its end, and out of theirs.
    const on = new Set([t]);
    const walk = (seed, next, key) => {
      const seen = new Set([seed]);
      const q = [seed];
      while (q.length) {
        const id = q.shift();
        for (const x of ties) if (x[key] === id && !on.has(x)) { on.add(x); const n = next(x); if (!seen.has(n)) { seen.add(n); q.push(n); } }
      }
    };
    walk(t.from, (x) => x.from, "to");
    walk(t.to, (x) => x.to, "from");
    d3.selectAll("#vc-flow path.vc-tie")
      .attr("stroke", (x) => (on.has(x) ? TRACE : cssVar("--blue-2")))
      .attr("stroke-opacity", (x) => (on.has(x) ? 1 : 0.4))
      .attr("stroke-width", (x) => (x === t ? 3.4 : on.has(x) ? 2.6 : 1.8) + (CAP[x.type] ? 1 : 0));
    d3.selectAll("#vc-flow path.vc-tie").filter((x) => on.has(x)).raise();
    announce(`Traced ${name(t.from)} ${phrase(t.type)} ${name(t.to)}: ${on.size} ${on.size === 1 ? "tie" : "ties"} on its path, in orange. Tap the chart again to clear.`);
  }

  // A company's whole stream (owner, 2026-11-27: tap a company "to light up the whole stream of connections off the
  // company in orange"; for a lab, "the value chain that leads up to it lights up"): every tie that feeds into it,
  // and into those, and every tie it feeds, and onward, along the value chain.
  function traceCompany(id) {
    if (typeof d3 === "undefined") return 0;
    const ties = V.ties, on = new Set();
    const walk = (seed, next, key) => {
      const seen = new Set([seed]), q = [seed];
      while (q.length) {
        const x0 = q.shift();
        for (const x of ties) if (x[key] === x0 && !on.has(x)) { on.add(x); const n = next(x); if (!seen.has(n)) { seen.add(n); q.push(n); } }
      }
    };
    walk(id, (x) => x.from, "to");
    walk(id, (x) => x.to, "from");
    S.traced = { company: id };
    d3.selectAll("#vc-flow path.vc-tie")
      .attr("stroke", (x) => (on.has(x) ? TRACE : cssVar("--blue-2")))
      .attr("stroke-opacity", (x) => (on.has(x) ? 1 : 0.4))
      .attr("stroke-width", (x) => (x.from === id || x.to === id ? 3.2 : on.has(x) ? 2.6 : 1.8) + (CAP[x.type] ? 1 : 0));
    d3.selectAll("#vc-flow path.vc-tie").filter((x) => on.has(x)).raise();
    return on.size;
  }
  // A slow, eased glide to the details (about 1.6 s), after 2.5 s on the lit chart (owner, 2026-11-27: "a second
  // slower so they have time to look at the graph"), through the page's smooth scroller when it is running.
  let glidedTo = null;
  function glideTo(el) {
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) { el.scrollIntoView({ block: "start" }); return; }
    const L = window.MOTION && window.MOTION.lenis;
    setTimeout(() => {
      if (L && L.scrollTo) L.scrollTo(el, { offset: -96, duration: 1.6 });
      else el.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 2450);
  }

  // Ties of the chosen tier or company stay strong; the rest fade, so crossing lines stay readable.
  function highlight(keep) {
    if (typeof d3 === "undefined") return;
    S.traced = null;
    d3.selectAll("#vc-flow path.vc-tie").attr("stroke", cssVar("--blue-2"));
    // Faded lines stay readable (owner, 2026-11-26: "make it so that all of these lines are legible"); dotted ties are
    // drawn heavier, since round dots vanish at hairline widths.
    const dot = (x) => (CAP[x.type] ? 1 : 0);
    d3.selectAll("#vc-flow path.vc-tie").attr("stroke-opacity", (x) => (keep(x) ? 1 : 0.4)).attr("stroke-width", (x) => (keep(x) ? 3 : 1.8) + dot(x));
  }
  // Clear then set, so the same message is announced again on a repeat click.
  function announce(t) {
    const el = document.getElementById("vc-status");
    el.textContent = "";
    setTimeout(() => { el.textContent = t; }, 50);
  }
  function tieList(ties) {
    return `<ul class="conn">${ties.map((t) => `<li>${esc(name(t.from))} ${esc(phrase(t.type))} ${esc(name(t.to))}${t.as_of ? ` <span class="ticker">(${esc(window.DATES.long(t.as_of))})</span>` : ""}. ${esc(t.description || "")}${src(t.source_url)}${t.source_kind === "secondary" ? ' <span class="conf">· reported (secondary source)</span>' : ""}</li>`).join("") || "<li>None sourced yet.</li>"}</ul>`;
  }

  function showTier(tid, section) {
    const t = V.tiers.find((x) => x.id === tid);
    const p = V.per_tier[tid] || {};
    const list = (arr, f) => (arr && arr.length ? `<ul class="conn">${arr.map(f).join("")}</ul>` : `<p class="status-note">None in the data.</p>`);
    const coLine = (id) => { const c = CO.get(id) || {}; const b = c.engagement_basis || {}; return `<li>${esc(c.name || id)}: ${esc(b.text || "")}${src(b.url)}</li>`; };
    const routes = (p.labs_reached_in_two_steps || []).map((r) => `<li><strong>${esc(r.lab)}</strong>: ${r.routes.map((x) => `${esc(name(x.from))} → ${esc(x.tie)} → ${esc(name(x.via))} → ${esc(x.then)} → ${esc(r.lab)}${src(x.source_url)}`).join("; ")}</li>`);
    const ROUTE = { "US proxy rules apply": ["company under US proxy rules", "companies under US proxy rules"], "US-listed foreign issuer": ["US-listed foreign issuer", "US-listed foreign issuers"], private: ["private company", "private companies"] };
    const routesMix = p.shareholder_routes ? Object.entries(p.shareholder_routes).map(([k, n]) => `${n} ${(ROUTE[k] || [k, k])[n === 1 ? 0 : 1]}`).join(", ") : "";
    const panel = document.getElementById("vc-panel");
    panel.classList.remove("vc-lit");
    const capped = (arr, total, what) => (arr && total && arr.length < total ? `<p class="status-note">The ${arr.length} most recent of ${total} ${what}.</p>` : "");
    const drawn = [...new Set(V.ties.flatMap((x) => [x.from, x.to]))].filter((id) => (CO.get(id) || {}).tier === tid).length;
    const ownLabs = tid === "labs" ? " (this tier's own labs included)" : "";
    // Owner, 2026-11-26: "the headers are hard to find … make this page more clear and obvious why it's of use to
    // the viewer … more pop-open sections … primed for an impact investor". The tier opens with its figures at a
    // glance, then one collapsible section per question an investor brings to it, each headed with its count.
    const labsDirect = p.labs_reached_directly || [];
    const labsTwo = p.labs_reached_in_two_steps || [];
    const filers = p.active_filers || [];
    const stat = (n, label, sub) => `<div class="vc-stat" role="listitem"><span class="vc-stat-n">${n}</span><span class="vc-stat-l">${esc(label)}</span>${sub ? `<span class="vc-stat-s">${esc(sub)}</span>` : ""}</div>`;
    const sec = (id, title, count, body, open) => `<details class="vc-sec" id="${id}"${open ? " open" : ""}><summary><span class="vc-sec-t">${esc(title)}</span>${count != null ? ` <span class="vc-sec-n">${count}</span>` : ""}</summary><div class="vc-sec-b">${body}</div></details>`;
    const askRows = (p.asks_made || []).map((a) => `<tr><td>${esc(a.company)}</td><td class="num">${esc(a.year)}</td><td>${esc(a.title)}</td><td>${src(a.url, "proxy")}</td></tr>`).join("");
    const topics = p.proposal_topics && Object.keys(p.proposal_topics).length ? Object.entries(p.proposal_topics).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<li><span>${esc(k)}</span> <span class="vc-sec-n">${n}</span></li>`).join("") : "";
    panel.innerHTML = `
      <p class="eyebrow" style="margin:0 0 4px">Value-chain stage</p>
      <h3 id="vc-panel-h" tabindex="-1" class="vc-tier-h">${esc(t.label)}</h3>
      <p class="vc-tier-what">${esc(t.what_it_is || "")}</p>
      <div class="vc-stats" role="list" aria-label="This stage at a glance">
        ${stat(p.median_support_pct != null ? `${p.median_support_pct}%` : "—", "median support", `${p.support_range ? `range ${p.support_range[0]}–${p.support_range[1]}%; ` : ""}n = ${supportN(p) ?? 0} proposals with recorded votes`)}
        ${stat((p.commitments || []).length, "commitments won", (p.commitments || []).length ? [...new Set(p.commitments.map((c) => c.company))].join(", ") : "none recorded")}
        ${stat((p.deadlines_next_90 || []).length, "filing deadlines in the next 90 days", (p.deadlines_next_90 || []).length ? `first: ${p.deadlines_next_90.slice().sort((a, b) => String(a.date).localeCompare(String(b.date)))[0].name}` : "none")}
        ${stat(labsDirect.length + labsTwo.length, "frontier labs reached", labsDirect.slice(0, 4).join(", ") + (labsDirect.length > 4 ? ` and ${labsDirect.length - 4} more` : ""))}
      </div>
      <p class="status-note vc-tier-use">Median support: votes for ÷ (for + against), computed by this site; proposals lead-filed by filers critical of ESG are left out. Each section below opens the records and sources.</p>
      <p class="vc-sec-all"><button type="button" class="tool" id="vc-open-all">Open all sections</button></p>
      ${sec("vc-reach", "Frontier labs reached from this stage", labsDirect.length + labsTwo.length, `
        <p class="status-note">Through sourced ties here and in Listed companies tied to each lab (chips, compute, distribution, equity stakes and parent companies)${ownLabs}.</p>
        <p><strong>Directly:</strong> ${labsDirect.map(esc).join(", ") || "none in the data"}.</p>
        ${routes.length ? `<p><strong>In two steps</strong> (company → company → lab):</p><ul class="conn">${routes.join("")}</ul>` : ""}
        <p class="status-note">Ties out of this stage: ${p.ties_from_tier ?? 0}; into it: ${p.ties_into_tier ?? 0}. A tie between two companies at the same stage counts both ways.</p>`, true)}
      ${sec("vc-asks", "What investors have already asked here", p.ai_proposals || 0, `
        <p>${plural(p.ai_proposals || 0, "AI proposal")}${p.median_support_pct != null ? `; median support ${p.median_support_pct}% of votes for and against, computed by this site from the recorded figures` : ""}. Commitments won are listed under Commitments won.</p>
        ${topics ? `<p class="vc-sub">By topic</p><ul class="vc-topics">${topics}</ul>` : ""}
        ${askRows ? `<p class="vc-sub">${(p.asks_made || []).length < (p.ai_proposals || 0) ? `The ${(p.asks_made || []).length} most recent of ${p.ai_proposals}` : "All"} proposals</p><div class="table-wrap"><table class="vc-asks-t"><thead><tr><th scope="col">Company</th><th scope="col" class="num">Year</th><th scope="col">Proposal</th><th scope="col">Source</th></tr></thead><tbody>${askRows}</tbody></table></div>` : `<p class="status-note">None in the data.</p>`}`, true)}
      ${sec("vc-commit", "Commitments won", (p.commitments || []).length, list(p.commitments, (c) => `<li><strong>${esc(c.company)}</strong>: ${esc(c.promised)} <span class="ticker">${esc(c.by)}</span>${src(c.source_url)}</li>`))}
      ${sec("vc-deadlines", "Proposal filing deadlines in the next 90 days", (p.deadlines_next_90 || []).length, list((p.deadlines_next_90 || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date))), (d) => `<li><strong>${esc(d.name)}</strong>: ${esc(fmtD(d.date))}${src(d.source_url, "proxy")}</li>`))}
      ${sec("vc-who", "Who is already engaging here", null, `
        <p class="status-note">From the site's filer data; each filing, membership and profile is sourced in Network and contacts.</p>
        <p class="vc-sub">Filers${filers.length >= 12 ? " (the 12 most active)" : ""}</p>${list(filers, (x) => `<li>${esc(x.name)} <span class="ticker">${plural(x.proposals, "proposal")}</span></li>`)}
        <p class="vc-sub">Coalitions</p>${list(p.coalitions, (c) => `<li>${esc(c.name)} <span class="ticker">${plural(c.members_active_here, "member")} active here</span></li>`)}
        <p class="vc-sub">People on file</p>${list(p.people, (x) => `<li>${esc(x.name)} <span class="ticker">${esc(x.org)}</span></li>`)}`)}
      ${sec("vc-engagements", "Engagements an investor has reported here", (p.investor_engagements || []).length, list(p.investor_engagements, coLine))}
      ${sec("vc-safety", "AI safety commitments signed here", (p.safety_commitments || []).length, list(p.safety_commitments, coLine))}
      ${sec("vc-routes", "How shareholders can reach these companies", null, `
        <p><strong>Shareholder routes:</strong> ${routesMix ? esc(routesMix) : "not recorded"}.</p>
        <p>How each fund family voted on these proposals: Proposals and results › Fund family votes on AI proposals.</p>`)}
      <p class="status-note">${drawn} of these companies have a sourced tie and appear in the map above. Not a recommendation.</p>`;
    const all = document.getElementById("vc-open-all");
    all.addEventListener("click", () => {
      const secs = [...panel.querySelectorAll("details.vc-sec")];
      const open = !secs.every((d) => d.open);
      secs.forEach((d) => { d.open = open; });
      all.textContent = open ? "Close all sections" : "Open all sections";
    });
    if (section) { const d = document.getElementById(section); if (d && d.tagName === "DETAILS") d.open = true; }
    highlight((x) => (CO.get(x.from) || {}).tier === tid || (CO.get(x.to) || {}).tier === tid);
    announce(`${t.label}: details below the chart.`);
    document.querySelectorAll(".vc-tiers .chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tier === tid)));
    const sel = section && document.querySelector(`#${section} > summary`);
    const target = sel || document.getElementById("vc-panel-h");
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function showCompany(id) {
    const c = CO.get(id) || {};
    const outs = V.ties.filter((t) => t.from === id);
    const ins = V.ties.filter((t) => t.to === id);
    const panel = document.getElementById("vc-panel");
    panel.innerHTML = `
      <p class="eyebrow" style="margin:0 0 4px">${esc(window.ROLES ? window.ROLES.label(window.ROLES.roleOf(c)) : tierLabel(c.tier))}${window.ROLES && window.ROLES.alsoOf(c).length ? ` · also ${esc(window.ROLES.alsoOf(c).map(window.ROLES.label).join(", "))}` : ""}</p>
      <h3 id="vc-panel-h" tabindex="-1">${esc(c.name || id)}</h3>
      <h4>Ties from ${esc(c.name || id)}</h4>${tieList(outs)}
      <h4>Ties to ${esc(c.name || id)}</h4>${tieList(ins)}
      ${c.ticker && window.LENS_CTX && window.LENS_CTX.hasCompany && window.LENS_CTX.hasCompany(c.ticker) ? `<button type="button" class="chip" id="vc-open-co">Open company profile</button>` : ""}`;
    const b = document.getElementById("vc-open-co");
    if (b) b.addEventListener("click", () => window.LENS_CTX.openCompany(c.ticker));
    const n = traceCompany(id);
    announce(`${c.name || id}: ${plural(n, "tie")} in its stream, in orange; details below the chart. Tap the chart again to clear.`);
    const h = document.getElementById("vc-panel-h");
    h.focus({ preventScroll: true });
    // The details light in the same orange as the stream, so the eye finds them after the glide.
    panel.classList.add("vc-lit");
    // Glide down once per company; clicking the same company again stays on the chart (owner, 2026-11-27).
    if (glidedTo !== id) glideTo(h);
    glidedTo = id;
  }

  function drawTieTable() {
    const rows = [...V.ties].sort((a, b) => a.type.localeCompare(b.type) || name(a.from).localeCompare(name(b.from)))
      .map((t) => `<tr><td><button type="button" class="linklike" data-co="${esc(t.from)}">${esc(name(t.from))}</button></td><td>${esc(phrase(t.type))}</td><td><button type="button" class="linklike" data-co="${esc(t.to)}">${esc(name(t.to))}</button></td><td class="nowrap">${esc(t.as_of || "")}</td><td>${src(t.source_url)}${t.source_kind === "secondary" ? ' <span class="conf">· reported (secondary source)</span>' : ""}</td></tr>`).join("");
    document.getElementById("vc-ties").innerHTML = `<table><thead><tr><th scope="col">From</th><th scope="col">Tie</th><th scope="col">To</th><th scope="col">As of</th><th scope="col">Source</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  // Stage figures that bear on a decision (module audit, 2026-11-27): support and its trend, commitments won,
  // filing deadlines in the next 90 days and frontier labs reached. Counts of why a company is in this dataset, and
  // row counts, are left out.
  const fmtD = (iso) => (window.DATES ? window.DATES.long(iso) : iso);
  const supportText = (p) => (p.median_support_pct == null ? "no recorded votes"
    : `${p.median_support_pct}%${p.support_range ? ` (range ${p.support_range[0]}–${p.support_range[1]}%)` : ""}`);
  const supportN = (p) => ((p.median_support_base || {}).with_recorded_support ?? null);
  // Median support by meeting year as a small line; the first and last years are labelled.
  function trendSvg(p) {
    const ys = Object.entries(p.support_by_year || {}).filter(([, v]) => v && v.median != null).sort((a, b) => a[0] - b[0]);
    if (ys.length < 2) return `<span class="ticker">fewer than two years</span>`;
    const W = 120, H = 30, max = Math.max(40, ...ys.map(([, v]) => v.median));
    const x = (i) => 4 + (i * (W - 8)) / (ys.length - 1), y = (m) => H - 4 - (m / max) * (H - 8);
    const d = ys.map(([, v], i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v.median).toFixed(1)}`).join("");
    const a = ys[0], b = ys[ys.length - 1];
    const label = `Median support by year: ${ys.map(([yr, v]) => `${yr} ${v.median}% (n = ${v.n})`).join("; ")}`;
    return `<span class="vc-trend"><svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${esc(label)}"><title>${esc(label)}</title><path d="${d}" fill="none" stroke="${cssVar("--blue-1")}" stroke-width="2"/>${ys.map(([, v], i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(v.median).toFixed(1)}" r="2.4" fill="${cssVar("--blue-1")}"/>`).join("")}</svg><span class="ticker">${esc(a[0])} ${a[1].median}% → ${esc(b[0])} ${b[1].median}%</span></span>`;
  }

  // Engagement map: tier × engagement type. Shade by count within each column; numbers always printed.
  // Only true totals. asks_made, active_filers, coalitions and people are capped lists in the data (e.g. the
  // first 12), so they are listed in the tier panel, never counted here.
  function drawHeat() {
    const tiers = V.tiers.slice().sort((a, b) => a.order - b.order);
    const btn = (t, sec, text, label) => `<button type="button" class="linklike" data-tier="${t.id}" data-sec="${sec}" aria-label="${esc(`${t.label}: ${label}`)}">${text}</button>`;
    const rows = tiers.map((t) => {
      const p = V.per_tier[t.id] || {};
      const n = supportN(p);
      const dl = (p.deadlines_next_90 || []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
      const com = p.commitments || [];
      const labs = (p.labs_reached_directly || []).length + (p.labs_reached_in_two_steps || []).length;
      return `<tr><th scope="row" class="sticky-col"><button type="button" class="linklike" data-tier="${t.id}">${esc(t.label)}</button></th>
        <td class="num">${p.ai_proposals ? btn(t, "vc-asks", String(p.ai_proposals), `${p.ai_proposals} AI proposals`) : "0"}</td>
        <td>${esc(supportText(p))}${n != null ? `<div class="ticker">n = ${n} with recorded votes</div>` : ""}</td>
        <td>${trendSvg(p)}</td>
        <td>${com.length ? btn(t, "vc-commit", `${com.length}`, `${com.length} commitments won`) + `<div class="ticker">${esc([...new Set(com.map((c) => c.company))].join(", "))}</div>` : `<span class="ticker">none recorded</span>`}</td>
        <td>${dl.length ? btn(t, "vc-deadlines", esc(`${dl[0].name}, ${fmtD(dl[0].date)}`), "next filing deadlines") + (dl.length > 1 ? `<div class="ticker">and ${dl.length - 1} more</div>` : "") : `<span class="ticker">none in 90 days</span>`}</td>
        <td class="num">${labs ? btn(t, "vc-reach", String(labs), `${labs} frontier labs reached`) : "0"}</td></tr>`;
    }).join("");
    document.getElementById("vc-heat").innerHTML = `<table class="vc-heat vc-stage-t"><caption class="visually-hidden">Engagement record by value-chain stage</caption><thead><tr>
      <th scope="col" class="sticky-col">Stage</th><th scope="col" class="num">AI proposals</th><th scope="col">Median support</th><th scope="col">Support by year</th><th scope="col">Commitments won</th><th scope="col">Next filing deadline</th><th scope="col" class="num">Frontier labs reached</th></tr></thead>
      <tbody>${rows}</tbody></table>`;
  }

  // Owner, 2026-11-26: "why did you not include all of the frontier labs, including Google DeepMind … check all data
  // for other companies in this value chain". The map now also draws the sourced company → lab ties from Lab pathways
  // (data/pathways.json), and the labs and companies they name, matched to data/companies.json by ticker or name.
  // Pathways tie types become the map's: chip supplier → supplies chips; cloud/compute provider → provides compute
  // to; distribution partner → distributes models; equity stake, parent company, board seat → owns or invests in;
  // revenue share/commercial agreement → commercial agreement with.
  const PW_TYPE = { "chip supplier": "supplies chips", "cloud/compute provider": "provides compute to", "distribution partner": "distributes models", "equity stake": "owns or invests in", "parent company": "owns or invests in", "board seat or observer": "owns or invests in", "revenue share/commercial agreement": "commercial agreement with" };
  // Companies named only in Lab pathways, placed by this site's reading of their main role.
  const PW_ROLE = { mu: "chips", asml: "chips", tsm: "chips", intc: "chips", dell: "chips", snow: "compute" };
  function mergeLabTies() {
    const P = (typeof DATA !== "undefined" && DATA.pathways) || null;
    if (!P || !P.ties || V._merged) return;
    V._merged = true;
    const all = [...CO.values()];
    const byTicker = new Map(all.filter((c) => c.ticker).map((c) => [String(c.ticker).split(/\s*\/\s*/).pop().toUpperCase(), c.id]));
    all.filter((c) => c.ticker).forEach((c) => String(c.ticker).split(/\s*\/\s*/).forEach((t) => byTicker.set(t.toUpperCase(), c.id)));
    const byName = new Map(all.map((c) => [String(c.name).toLowerCase(), c.id]));
    const idMap = new Map();
    (P.public_companies || []).forEach((pc) => {
      const tick = String(pc.ticker || "").split(/\s*\/\s*/).map((t) => t.toUpperCase());
      const hit = tick.map((t) => byTicker.get(t)).find(Boolean) || byName.get(String(pc.name).toLowerCase());
      if (hit) idMap.set(pc.id, hit);
      else { const id = "pw-" + pc.id; CO.set(id, { id, name: pc.name, ticker: pc.ticker, tier: PW_ROLE[pc.id] || "deployers", sectors: ["enterprise AI"], from_pathways: true }); idMap.set(pc.id, id); }
    });
    (P.labs || []).forEach((l) => {
      const hit = byName.get(String(l.name).toLowerCase());
      if (hit) idMap.set(l.id, hit);
      else { const id = "lab-" + l.id; CO.set(id, { id, name: l.name, tier: "labs", from_pathways: true }); idMap.set(l.id, id); }
    });
    const seen = new Set(V.ties.map((t) => `${t.from}|${t.to}|${t.type}`));
    P.ties.forEach((t) => {
      const from = idMap.get(t.from), to = idMap.get(t.to), type = PW_TYPE[t.type] || t.type;
      if (!from || !to || from === to) return;
      const k = `${from}|${to}|${type}`;
      if (seen.has(k)) return;
      seen.add(k);
      V.ties.push({ from, to, type, as_of: t.as_of, description: t.description, source_url: t.source_url, from_pathways: true });
    });
  }

  window.renderValueChain = function (data, companies) {
    const el = document.getElementById("tab-value-chain");
    if (!el) return;
    if (!data || !data.tiers || !data.ties) { el.innerHTML = `<div class="coming"><h2>AI value chain</h2><p>Being sourced now.</p></div>`; return; }
    V = data;
    CO = new Map((companies || []).map((c) => [c.id, c]));
    mergeLabTies();
    shell(el);
    drawTieTable();
    drawHeat();
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-tier]");
      if (b) showTier(b.dataset.tier, b.dataset.sec);
      const c = e.target.closest("[data-co]");
      if (c) showCompany(c.dataset.co);
    });
    // The flow needs a visible container to measure, so it draws the first time the tab opens.
    let drawn = false;
    const draw = () => { if (!drawn && !el.hidden) { drawn = true; drawFlow(); wireReveal(); } };
    new MutationObserver(draw).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    draw();
  };
})();

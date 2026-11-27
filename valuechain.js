// Value chain tab: a layered flow of sourced ties between companies, by value-chain tier, and an engagement
// map (tier × engagement type). Reads data/value_chain.json (tiers, ties, per_tier, derived_note) and
// data/companies.json. Plan: docs/plans/2026-11-26-value-chain-ui.md.
//
// Owner (2026-11-25): "One visual is a map of engagement, and another visual is a map of the value chain …
// it's clear that engaging at this level, hyperscaler level, means this is the effect you can have, these are
// the different players you can reach, and these are the stakeholders you need to engage with."
// Everything shown comes from the data with its source; nothing here is advice.

(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim() || "#1f4e98";
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + "s"}`;
  const src = (u, label = "source") => (u ? ` <a class="src" href="${esc(u)}" target="_blank" rel="noopener">[${esc(label)}]</a>` : ` <span class="unverified">source pending</span>`);
  // Tie types differ by dash pattern, not colour (all marks are blue on white).
  // Six clearly different line patterns (owner, 2026-11-27: the old dashes were "not distinct enough"): solid, long
  // dash, round dots, dash-dot, short dash, dash-dot-dot. Dotted lines use round caps so the dots read as dots.
  const DASH = { "supplies chips": null, "manufactures for": "14 6", "leases capacity to": "0.1 6", "provides compute to": "12 4 2 4", "supplies power to": "5 5", "distributes models": "12 3 2 3 2 3" };
  const CAP = { "leases capacity to": "round" };
  // Each tie type as words that read as a sentence: "{from} {phrase} {to}".
  const PHRASE = { "supplies chips": "supplies chips to", "manufactures for": "manufactures for", "leases capacity to": "leases capacity to", "provides compute to": "provides compute to", "supplies power to": "supplies power to", "distributes models": "distributes the models of" };
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

  function shell(el) {
    const nCos = new Set(V.ties.flatMap((t) => [t.from, t.to])).size;
    el.innerHTML = `
      <h2>AI value chain, from chips to AI products: companies by tier</h2>
      <p class="intro">Where companies sit in the AI value chain, how they are tied to each other, and where investors have already engaged at each tier. ${plural(V.ties.length, "sourced tie")} between ${nCos} companies. ${esc(V.about ? "Tiers are this site's reading of each company's main role." : "")}</p>
      <div class="vc-tiers" role="group" aria-label="Tiers">${V.tiers
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((t) => `<button type="button" class="chip" data-tier="${esc(t.id)}" aria-pressed="false">${esc(t.label)}</button>`)
        .join("")}</div>
      <figure class="card chart-card fig">
        ${window.figHead(`AI value chain: sourced ties between companies, from chips to AI products`, `${plural(V.ties.length, "sourced tie")} among ${nCos} companies, dated ${window.yearSpan(V.ties.map((t) => t.as_of))}. Columns are each company's main role (this site's reading); circle size = number of ties; line pattern = type of tie.`)}
        <div class="net-legend" id="vc-key"></div>
        <div class="chart-scroll" tabindex="0" role="region" aria-label="Value chain chart (scrolls sideways on small screens)"><div id="vc-flow" class="vc-flow"></div></div>
        ${window.figSource("company filings and announcements, cited for each tie in the list view.")}
      </figure>
      <p class="visually-hidden" id="vc-status" aria-live="polite"></p>
      <section id="vc-panel" class="net-panel vc-panel" aria-label="Details"><p class="status-note">Choose a tier or a company for who it reaches, the asks already made there and who is engaging.</p></section>
      <details class="cz-list"><summary>List view: the same ${V.ties.length} ties as text</summary><div class="table-wrap" id="vc-ties"></div></details>
      <h3 class="sub-h">Engagement by tier</h3>
      <p class="status-note">Counts per tier, from the site's data; darker blue means more within that column, and each number opens the tier's details. A company can sit in several tiers and is counted in each, so the rows overlap and must not be added up. Proposal counts cover AI-related proposals since 2023 at the companies subject to US proxy rules; companies outside US proxy rules have no proposal data. Not a recommendation.</p>
      <figure class="card chart-card fig">
        ${window.figHead("Engagement by AI value-chain tier", "Counts per tier; darker blue = more within that column. Rows overlap (a company can sit in several tiers), so do not add them up. AI proposals since 2023, at companies subject to US proxy rules.")}
        <div class="table-wrap" id="vc-heat" tabindex="0" role="region" aria-label="Engagement by tier table"></div>
        ${window.figSource("company proxy statements and 8-K vote results; investor and coalition records, as cited in each tier's details.")}
      </figure>`;
  }

  const name = (id) => (CO.get(id) || {}).name || id;
  const tierLabel = (id) => TIER_AS_ROLE[id] || (window.ROLES && window.ROLES.label(id)) || (V.tiers.find((t) => t.id === id) || {}).label || id;

  function drawFlow() {
    const box = document.getElementById("vc-flow");
    box.innerHTML = "";
    if (typeof d3 === "undefined") { box.innerHTML = `<p class="status-note">The chart library did not load; the ties are listed below.</p>`; return; }
    const inTies = new Set(V.ties.flatMap((t) => [t.from, t.to]));
    const W = Math.max(720, box.clientWidth || 900);
    const colX = (i) => 70 + (i * (W - 220)) / (FLOW.length - 1);
    // Short column headings whenever the full ones would run into each other.
    const narrow = (W - 220) / (FLOW.length - 1) < 175;
    const rowH = 58; // owner, 2026-11-26: "even more space in between … the text super clear to read"
    const cols = FLOW.map((tid, i) => {
      const ids = [...inTies].filter((id) => roleOfId(id) === tid).sort((a, b) => name(a).localeCompare(name(b)));
      return { tid, x: colX(i), ids };
    });
    const H = 80 + Math.max(...cols.map((c) => c.ids.length)) * rowH;
    const pos = new Map();
    cols.forEach((c) => c.ids.forEach((id, j) => pos.set(id, { x: c.x, y: 80 + j * rowH })));
    const deg = new Map();
    V.ties.forEach((t) => { deg.set(t.from, (deg.get(t.from) || 0) + 1); deg.set(t.to, (deg.get(t.to) || 0) + 1); });
    const svg = d3.select(box).append("svg").attr("viewBox", [0, 0, W, H]).attr("width", W).attr("height", H)
      .attr("role", "group").attr("aria-label", `Value chain: ${V.ties.length} sourced ties between companies, by tier. Each company is a button; the same ties are in the list view below.`);
    cols.forEach((c) => svg.append("text").attr("x", c.x).attr("y", 24).attr("text-anchor", "middle").attr("font-size", 12).attr("font-weight", 400).attr("fill", cssVar("--ink-soft"))
      .text((narrow ? SHORT_TIER[c.tid] || tierLabel(c.tid) : c.tid === "business" ? "Business and government" : tierLabel(c.tid)).toUpperCase()));
    const ink = cssVar("--blue-2");
    svg.append("g").attr("fill", "none").selectAll("path").data(V.ties.filter((t) => pos.has(t.from) && pos.has(t.to))).join("path")
      .attr("d", (t) => {
        const a = pos.get(t.from), b = pos.get(t.to);
        const mx = (a.x + b.x) / 2;
        return a.x === b.x ? `M${a.x},${a.y}C${a.x + 60},${a.y} ${b.x + 60},${b.y} ${b.x},${b.y}` : `M${a.x},${a.y}C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
      })
      .attr("class", "vc-tie").attr("stroke", ink).attr("stroke-opacity", 0.7).attr("stroke-width", 2).attr("stroke-dasharray", (t) => DASH[t.type] || null).attr("stroke-linecap", (t) => CAP[t.type] || "butt")
      .append("title").text((t) => `${name(t.from)} ${phrase(t.type)} ${name(t.to)}`);
    const nodes = svg.append("g").selectAll("g").data([...pos.entries()]).join("g").attr("transform", ([, p]) => `translate(${p.x},${p.y})`);
    const co = nodes.filter(([id]) => id !== "__capital__")
      .attr("tabindex", 0).attr("role", "button").attr("aria-label", ([id]) => `${name(id)}: ${plural(deg.get(id) || 0, "tie")}`).style("cursor", "pointer")
      .on("click", (ev, [id]) => showCompany(id))
      .on("keydown", (ev, [id]) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); showCompany(id); } });
    co.append("circle").attr("r", ([id]) => 3 + Math.sqrt(deg.get(id) || 1) * 1.6).attr("fill", cssVar("--blue-1"));
    // Names sit just above each circle, clear of the lines that leave it sideways, larger and with a wide white
    // outline so crossing lines never run through the letters.
    co.append("text").attr("x", 0).attr("y", ([id]) => -(3 + Math.sqrt(deg.get(id) || 1) * 1.6) - 6).attr("text-anchor", "middle").attr("font-size", 13).attr("font-weight", 400).attr("fill", cssVar("--ink"))
      .attr("stroke", cssVar("--surface")).attr("stroke-width", 5).attr("stroke-linejoin", "round").attr("paint-order", "stroke").text(([id]) => (name(id).length > 26 ? name(id).slice(0, 25) + "…" : name(id)));
    // Key: one dash pattern per tie type.
    document.getElementById("vc-key").innerHTML = [...new Set(V.ties.map((t) => t.type))].map((k) =>
      `<span class="leg static"><svg class="mark vc-line" viewBox="0 0 44 10" aria-hidden="true"><line x1="2" y1="5" x2="42" y2="5" stroke="${ink}" stroke-width="2.5"${DASH[k] ? ` stroke-dasharray="${DASH[k]}"` : ""}${CAP[k] ? ` stroke-linecap="${CAP[k]}"` : ""}></line></svg>${esc(k)}</span>`).join("")
      + `<span class="status-note">Each line is one sourced tie; open a company to read its ties in words. Circle size = number of sourced ties; companies with no sourced tie are counted in each tier's panel. Strategic investors have their own column; their equity stakes in labs are in Ties to each frontier lab.</span>`;
  }

  // Ties of the chosen tier or company stay strong; the rest fade, so crossing lines stay readable.
  function highlight(keep) {
    if (typeof d3 === "undefined") return;
    d3.selectAll("#vc-flow path.vc-tie").attr("stroke-opacity", (x) => (keep(x) ? 0.95 : 0.08)).attr("stroke-width", (x) => (keep(x) ? 2.6 : 1.6));
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
    const capped = (arr, total, what) => (arr && total && arr.length < total ? `<p class="status-note">The ${arr.length} most recent of ${total} ${what}.</p>` : "");
    const drawn = [...new Set(V.ties.flatMap((x) => [x.from, x.to]))].filter((id) => (CO.get(id) || {}).tier === tid).length;
    const ownLabs = tid === "labs" ? " (this tier's own labs included)" : "";
    panel.innerHTML = `
      <p class="eyebrow" style="margin:0 0 4px">Tier</p>
      <h3 id="vc-panel-h" tabindex="-1">${esc(t.label)}</h3>
      <p>${esc(t.what_it_is || "")} ${plural(p.companies || 0, "company", "companies")} in this tier, ${p.companies_primary || 0} with it as their main role; ${drawn} with a sourced tie appear in the map above.</p>
      <ul class="vc-summary">
        <li><strong>Asks made here:</strong> ${plural(p.ai_proposals || 0, "AI proposal")}${p.median_support_pct != null ? `, median support ${p.median_support_pct}% (computed by this site)` : ""}. Outcomes such as adoption or withdrawal after an agreement are not in the data yet.</li>
        <li><strong>Labs connected:</strong> ${(p.labs_reached_directly || []).length} directly${(p.labs_reached_in_two_steps || []).length ? `, ${(p.labs_reached_in_two_steps || []).length} in two steps` : ""}, through sourced ties, equity stakes or ownership.</li>
        <li><strong>Active here:</strong> ${(p.active_filers || []).length >= 12 ? "the 12 most active filers" : plural((p.active_filers || []).length, "filer")}, ${plural((p.coalitions || []).length, "coalition")}, ${plural((p.people || []).length, "person", "people")} on file.</li>
      </ul>
      <h4 id="vc-reach" tabindex="-1">Labs connected by sourced ties</h4>
      <p class="status-note">From the sourced ties here and in Ties to each frontier lab (chips, compute and distribution, plus equity stakes and parent companies), including labs owned by companies in this tier.</p>
      <p>Reached directly${ownLabs}: ${(p.labs_reached_directly || []).map(esc).join(", ") || "none in the data"}.</p>
      ${routes.length ? `<p>Reached in two steps:</p><ul class="conn">${routes.join("")}</ul>` : ""}
      <p class="status-note">Ties out of this tier: ${p.ties_from_tier ?? 0}; into it: ${p.ties_into_tier ?? 0}. A tie between two companies in the same tier counts both ways. The map above shows operating ties; equity stakes are drawn in Ties to each frontier lab.</p>
      <h4 id="vc-asks" tabindex="-1">Asks made here</h4>
      <p>${plural(p.ai_proposals || 0, "AI proposal")}${(p.proposal_topics && Object.keys(p.proposal_topics).length) ? ` (${Object.entries(p.proposal_topics).map(([k, n]) => `${esc(k)} ${n}`).join(", ")})` : ""}${p.median_support_pct != null ? `; median support ${p.median_support_pct}%, computed by this site from the recorded figures` : ""}.</p>
      ${capped(p.asks_made, p.ai_proposals, "proposals")}
      ${list(p.asks_made, (a) => `<li>${esc(a.company)} ${esc(a.year)}: ${esc(a.title)}${src(a.url, "proxy")}</li>`)}
      <h4 id="vc-engagements" tabindex="-1">Companies included for a named investor engagement</h4>
      ${list(p.investor_engagements, coLine)}
      <h4 id="vc-safety" tabindex="-1">Companies included for a safety commitment</h4>
      ${list(p.safety_commitments, coLine)}
      <h4 id="vc-who" tabindex="-1">Investors, coalitions and people active here</h4>
      <p class="status-note">From the site's filer data; each filing, membership and profile is sourced in Contacts and the Co-filer network.</p>
      <p>Filers active at this tier's companies${p.active_filers && p.active_filers.length >= 12 ? " (the 12 most active)" : ""}:</p>${list(p.active_filers, (f) => `<li>${esc(f.name)} (${plural(f.proposals, "proposal")})</li>`)}
      <p>Coalitions:</p>${list(p.coalitions, (c) => `<li>${esc(c.name)} (${plural(c.members_active_here, "member")} active here)</li>`)}
      <p>People on file (${(p.people || []).length}):</p>${list(p.people, (x) => `<li>${esc(x.name)}, ${esc(x.org)}</li>`)}
      <h4 id="vc-routes" tabindex="-1">Shareholder routes</h4>
      <p>${routesMix ? esc(routesMix) : "Not recorded"}.</p>
      <h4 id="vc-fund" tabindex="-1">Fund-family votes on file</h4>
      <p>${p.fund_vote_rows ?? 0} votes, counted once per fund family per proposal, from Form N-PX filings on proposals at these companies. Most are matched automatically and not yet reviewed; see How fund families voted for each one.</p>`;
    highlight((x) => (CO.get(x.from) || {}).tier === tid || (CO.get(x.to) || {}).tier === tid);
    announce(`${t.label}: details below the chart.`);
    document.querySelectorAll(".vc-tiers .chip").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tier === tid)));
    const target = document.getElementById(section || "vc-panel-h");
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
    highlight((x) => x.from === id || x.to === id);
    announce(`${c.name || id}: ${plural(outs.length + ins.length, "tie")}, details below the chart.`);
    const h = document.getElementById("vc-panel-h");
    h.focus({ preventScroll: true });
    h.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }

  function drawTieTable() {
    const rows = [...V.ties].sort((a, b) => a.type.localeCompare(b.type) || name(a.from).localeCompare(name(b.from)))
      .map((t) => `<tr><td><button type="button" class="linklike" data-co="${esc(t.from)}">${esc(name(t.from))}</button></td><td>${esc(phrase(t.type))}</td><td><button type="button" class="linklike" data-co="${esc(t.to)}">${esc(name(t.to))}</button></td><td class="nowrap">${esc(t.as_of || "")}</td><td>${src(t.source_url)}${t.source_kind === "secondary" ? ' <span class="conf">· reported (secondary source)</span>' : ""}</td></tr>`).join("");
    document.getElementById("vc-ties").innerHTML = `<table><thead><tr><th scope="col">From</th><th scope="col">Tie</th><th scope="col">To</th><th scope="col">As of</th><th scope="col">Source</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  // Engagement map: tier × engagement type. Shade by count within each column; numbers always printed.
  // Only true totals. asks_made, active_filers, coalitions and people are capped lists in the data (e.g. the
  // first 12), so they are listed in the tier panel, never counted here.
  const COLS = [
    { key: "ai_proposals", label: "AI proposals", n: (p) => p.ai_proposals || 0, sec: "vc-asks" },
    { key: "investor_engagements", label: "Companies included for a named investor engagement", n: (p) => (p.investor_engagements || []).length, sec: "vc-engagements" },
    { key: "safety_commitments", label: "Companies included for a safety commitment", n: (p) => (p.safety_commitments || []).length, sec: "vc-safety" },
    { key: "fund_vote_rows", label: "Fund-family votes on file", n: (p) => p.fund_vote_rows || 0, sec: "vc-fund" },
  ];
  function drawHeat() {
    const tiers = V.tiers.slice().sort((a, b) => a.order - b.order);
    const max = new Map(COLS.map((c) => [c.key, Math.max(1, ...tiers.map((t) => c.n(V.per_tier[t.id] || {})))]));
    // Five tints of the site's one blue (tokens --heat-1..5: 10, 30, 55, 80 and 100%); text turns white on
    // the two darkest, so every cell keeps 4.5:1 (4.9:1 and 8.1:1 there).
    const STEPS = [1, 2, 3, 4, 5].map((i) => cssVar(`--heat-${i}`));
    const cell = (c, t) => {
      const n = c.n(V.per_tier[t.id] || {});
      if (!n) return `<td class="num vc-zero">0</td>`;
      const step = Math.min(4, Math.floor((n / max.get(c.key)) * 4.999));
      const bg = STEPS[step];
      return `<td class="num vc-cell" style="background:${bg}"><button type="button" class="vc-num${step >= 3 ? " on-dark" : ""}" data-tier="${t.id}" data-sec="${c.sec}" aria-label="${esc(`${t.label}: ${n} ${c.label.toLowerCase()}, open details`)}">${n}</button></td>`;
    };
    document.getElementById("vc-heat").innerHTML = `<table class="vc-heat"><caption class="visually-hidden">Engagement by value-chain tier</caption><thead><tr><th scope="col" class="sticky-col">Tier</th>${COLS.map((c) => `<th scope="col" class="num">${esc(c.label)}</th>`).join("")}</tr></thead>
      <tbody>${tiers.map((t) => `<tr><th scope="row" class="sticky-col"><button type="button" class="linklike" data-tier="${t.id}">${esc(t.label)}</button></th>${COLS.map((c) => cell(c, t)).join("")}</tr>`).join("")}</tbody></table>`;
  }

  window.renderValueChain = function (data, companies) {
    const el = document.getElementById("tab-value-chain");
    if (!el) return;
    if (!data || !data.tiers || !data.ties) { el.innerHTML = `<div class="coming"><h2>AI value chain</h2><p>Being sourced now.</p></div>`; return; }
    V = data;
    CO = new Map((companies || []).map((c) => [c.id, c]));
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
    const draw = () => { if (!drawn && !el.hidden) { drawn = true; drawFlow(); } };
    new MutationObserver(draw).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    draw();
  };
})();

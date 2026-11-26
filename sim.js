// Test plans over time: an agent-based scenario model of AI shareholder engagement (data/sim_params.json,
// built by scripts/build_sim_params.py). Plan: docs/plans/2026-11-26-engagement-simulator.md.
//
// Agents, each season (one proxy season a year):
//   filers      file an ask at a company again (rate estimated from refiles), or for the first time
//               (rate estimated separately for pairs whose ask was just filed at a same-role company: contagion);
//   the SEC rule blocks a refile under Rule 14a-8(i)(12) when the last vote fell under 5 / 15 / 25 percent;
//   companies   exclude a proposal, or commit and so end it (rates from this data: first filings vs refiles);
//   voters      give a filed proposal support: last year's figure carried forward with the observed spread,
//               or the ask's spread across companies for a first filing;
//   fund families vote FOR at the rate their N-PX records show on that ask (shown in the agent log);
//   policy      the SEC's proposed rescission of Rule 14a-8 can be switched on from a season, leaving only
//               floor proposals where a company's own rules allow them.
// "You" are one more filer who follows a plan. Every rate is drawn from its own uncertainty in each run, so
// the bands show both chance and how little data there is. Results are scenarios computed by this site, not
// forecasts or advice (PRODUCT.md, Never claim 1, 2 and 5; owner's request of 2026-11-26).

(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const link = (url, label = "source") => (url ? ` <a class="src" href="${esc(url)}" target="_blank" rel="noopener">[${esc(label)}]</a>` : "");
  const pct = (x, d = 0) => (x == null || Number.isNaN(x) ? "–" : `${(Math.round(x * 10 ** d) / 10 ** d).toFixed(d)}%`);
  const share = (x) => pct(100 * x);
  const plural = (n, one, many = one + "s") => `${n} ${n === 1 ? one : many}`;
  const DL = (v) => (window.DATES ? window.DATES.long(v) : String(v));

  let P, D, el, S;

  // ---------- Random numbers (seeded, so a run can be repeated) ----------
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function normal(r) {
    let u = 0;
    while (!u) u = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
  }
  function gamma(k, r) {
    if (k < 1) return gamma(k + 1, r) * r() ** (1 / k);
    const d = k - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x, v;
      do { x = normal(r); v = 1 + c * x; } while (v <= 0);
      v = v * v * v;
      const u = r();
      if (u < 1 - 0.0331 * x ** 4 || Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
    }
  }
  // A rate estimated from k of n, drawn from its posterior (Beta(k+1, n-k+1)), so thin data shows as wide bands.
  // One stream per (run, ask, season, company): a plan and the no-plan baseline then share every draw
  // except the ones the plan itself changes, so their difference is the plan's effect, not noise.
  const hash = (...xs) => { let h = 2166136261; for (const ch of xs.join("|")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const stream = (...xs) => rng(hash(...xs));
  const betaDraw = (e, r) => { const x = gamma(e.k + 1, r), y = gamma(e.n - e.k + 1, r); return x / (x + y); };
  const betaMean = (e) => (e.k + 1) / (e.n + 2);
  const quant = (arr, q) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };

  // ---------- Model setup ----------
  function setup() {
    const E = P.estimates;
    const cos = P.companies;
    const asks = D.asks.map((a) => a.id);
    const role = new Map(cos.map((c) => [c.ticker, c.tier]));
    const cells = new Map();
    cos.forEach((c) => asks.forEach((a) => cells.set(`${c.ticker}|${a}`, { co: c.ticker, ask: a, votes: [], filed: new Set(), pending: [], critical: false, filers: [] })));
    P.cells.forEach((x) => {
      const k = `${x.company}|${x.ask}`;
      const c = cells.get(k);
      if (!c) return;
      Object.entries(x.seasons).forEach(([y, list]) => {
        const yr = +y;
        c.filed.add(yr);
        list.forEach((p) => {
          if (p.status === "upcoming") c.pending.push(yr);
          if (p.support != null) c.votes.push({ year: yr, support: p.support, critical: p.critical });
          if (p.critical) c.critical = true;
          c.filers.push(...p.filers);
        });
      });
    });
    const last = Math.max(...P.seasons_observed);
    return { E, cos, asks, role, cells, last, thr: P.thresholds };
  }

  // Rule 14a-8(i)(12): may the company exclude a refile in this season? (votes on the same subject)
  function locked(votes, season, thr) {
    const v = votes.filter((x) => x.support != null).sort((a, b) => a.year - b.year);
    if (!v.length) return false;
    const lastV = v[v.length - 1];
    if (season - lastV.year > thr.recent_years) return false;
    const count = v.filter((x) => x.year >= season - thr.lookback_years && x.year < season).length;
    if (!count) return false;
    return lastV.support < thr.values[Math.min(count, thr.values.length) - 1];
  }

  // ---------- One run for one ask (asks do not interact in this model; companies within an ask do) ----------
  function runAsk(M, ask, plan, scen, run, seed, log) {
    const E = M.E;
    const r = stream(seed, run, ask, "rates");
    const draw = {
      refile: Math.min(1, betaDraw(E.refile, r) * scen.refileMult),
      exposed: betaDraw(E.new_pair_exposed, r),
      unexposed: betaDraw(E.new_pair_unexposed, r),
      cFirst: betaDraw(E.commitment_first, r),
      cRefile: betaDraw(E.commitment_refile, r),
      excl: betaDraw(E.exclusion, r),
    };
    const prior = P.ask_support[ask] || {};
    const pool = prior.values && prior.values.length ? prior.values : Object.values(P.ask_support).flatMap((a) => a.values || []);
    const logSd = E.support_delta.log_sd || 0.5;
    // First filing: one of the ask's recorded votes (any company), varied a little. Refile: last year's figure times
    // a yearly ratio drawn with the spread recorded across refiles (no average drift: it did worse on held-out data).
    const firstVote = (rr) => pool[Math.floor(rr() * pool.length)] * Math.exp(0.25 * normal(rr));
    const nextVote = (lastSup, rr) => lastSup * Math.exp(logSd * normal(rr));
    const st = new Map();
    M.cos.forEach((c) => {
      const base = M.cells.get(`${c.ticker}|${ask}`);
      st.set(c.ticker, { votes: base.votes.map((v) => ({ ...v })), filed: new Set(base.filed), committed: false, ever: base.filed.size > 0, critical: base.critical });
    });
    const out = { seasons: {}, targets: {} };
    // Proposals already on a ballot that has not met yet get their vote first.
    M.cos.forEach((c) => {
      const base = M.cells.get(`${c.ticker}|${ask}`);
      base.pending.forEach((yr) => {
        const s = st.get(c.ticker);
        const rr = stream(seed, run, ask, "pending", c.ticker);
        const lastV = s.votes.filter((v) => !v.critical).at(-1);
        s.votes.push({ year: yr, support: clamp(lastV ? nextVote(lastV.support, rr) : firstVote(rr)) });
      });
    });
    const mine = new Set(plan.targets.filter((t) => t.ask === ask).map((t) => t.co));
    for (let season = M.last + 1; season <= scen.horizon; season++) {
      const rescinded = scen.rescind && season >= scen.rescindFrom;
      const prevFiled = new Set(M.cos.filter((c) => st.get(c.ticker).filed.has(season - 1)).map((c) => c.ticker));
      const row = { filed: 0, commit: 0, blocked: 0, byCo: {} };
      for (const c of M.cos) {
        const r = stream(seed, run, ask, season, c.ticker);
        const s = st.get(c.ticker);
        if (s.committed) { row.byCo[c.ticker] = "committed"; continue; }
        const isMine = mine.has(c.ticker) && season >= plan.from;
        let route = "14a-8", p;
        if (rescinded) {
          if (c.route_status !== "open") { if (isMine) row.byCo[c.ticker] = "no route"; continue; }
          route = "floor";
          p = isMine ? 1 : (prevFiled.has(c.ticker) ? draw.refile : 0) * scen.floorShare;
        } else if (locked(s.votes, season, M.thr)) {
          row.blocked += 1;
          row.byCo[c.ticker] = "blocked";
          if (isMine && log) log.push({ season, text: `You cannot refile ${askLabel(ask)} at ${coName(c.ticker)}: the last vote fell under the Rule 14a-8(i)(12) bar.` });
          continue;
        } else if (isMine) p = 1;
        else if (prevFiled.has(c.ticker)) p = draw.refile;
        else {
          const exposed = [...prevFiled].some((t) => t !== c.ticker && M.role.get(t) === c.tier);
          p = exposed ? draw.exposed : draw.unexposed;
          if (s.ever) p = Math.max(p, draw.refile * 0.5);
        }
        if (r() >= p) continue;
        const first = !s.ever;
        s.ever = true;
        s.filed.add(season);
        row.filed += 1;
        const filer = isMine ? "You" : pickFiler(ask, c.ticker, r);
        let pc = (first ? draw.cFirst : draw.cRefile) * (isMine && plan.lead ? scen.leadMult : 1);
        if (route === "floor") pc *= 0.5;
        if (route === "14a-8" && r() < draw.excl) {
          row.byCo[c.ticker] = "excluded";
          if (log && (isMine || log.length < 40)) log.push({ season, text: `${filer} ${filer === "You" ? "file" : "files"} ${askLabel(ask)} at ${coName(c.ticker)}; the company excludes it.` });
        } else if (r() < pc) {
          s.committed = true;
          row.commit += 1;
          row.byCo[c.ticker] = "commit";
          if (log) log.push({ season, text: `${filer} ${filer === "You" ? "file" : "files"} ${askLabel(ask)} at ${coName(c.ticker)}; the company commits to act and the proposal is withdrawn.`, strong: true });
        } else if (route === "floor") {
          row.byCo[c.ticker] = "floor";
          if (log && isMine) log.push({ season, text: `You raise ${askLabel(ask)} as a floor proposal at ${coName(c.ticker)}; shares voted by proxy earlier cannot vote on it.` });
        } else {
          const lastV = s.votes.filter((v) => !v.critical).at(-1);
          let sup = lastV ? nextVote(lastV.support, r) : firstVote(r);
          if (isMine) sup += scen.supportBoost;
          sup = clamp(sup);
          s.votes.push({ year: season, support: sup });
          row.byCo[c.ticker] = sup;
          if (log && (isMine || log.length < 40)) {
            const fams = familyVotes(ask, r);
            log.push({ season, text: `${filer} ${filer === "You" ? "file" : "files"} ${askLabel(ask)} at ${coName(c.ticker)}: ${pct(sup)} support.${fams ? ` ${fams}` : ""}` });
          }
        }
      }
      out.seasons[season] = row;
    }
    out.final = Object.fromEntries(M.cos.map((c) => [c.ticker, st.get(c.ticker)]));
    return out;
  }
  // Support stays between 0.5% and a little above the highest AI-proposal vote on record here.
  let MAXSUP = 60;
  const clamp = (x) => Math.max(0.5, Math.min(MAXSUP, x));

  function pickFiler(ask, co, r) {
    const f = Object.entries(P.filers[ask] || {});
    if (!f.length) return "An investor";
    const holds = new Set(P.holders[co] || []);
    const w = f.map(([id, n]) => n * (holds.has(id) ? 3 : 1));
    let x = r() * w.reduce((a, b) => a + b, 0);
    for (let i = 0; i < f.length; i++) { x -= w[i]; if (x <= 0) return orgName(f[i][0]); }
    return orgName(f[0][0]);
  }
  function familyVotes(ask, r) {
    const yes = [], no = [];
    Object.entries(P.family_for || {}).forEach(([fam, d]) => { const v = d[ask]; if (v && v.n) (r() < v.for / v.n ? yes : no).push(fam); });
    return yes.length || no.length ? `Fund families FOR: ${yes.length ? yes.join(", ") : "none"}${no.length ? `; not FOR: ${no.join(", ")}` : ""}.` : "";
  }

  // ---------- Many runs ----------
  function simulate(plan, scen, runs = scen.runs, seed = 7, withLog = false) {
    const M = S.M;
    const asks = [...new Set(plan.targets.map((t) => t.ask).concat(scen.extraAsks || []))];
    const res = { runs, asks: {}, targets: {}, log: [] };
    plan.targets.forEach((t) => { res.targets[`${t.co}|${t.ask}`] = { commitBy: 0, voted: {}, support: {}, blocked: {}, blockedRuns: 0, commitSeason: {} }; });
    asks.forEach((a) => { res.asks[a] = { commits: [], filings: {}, field: {} }; });
    for (let i = 0; i < runs; i++) {
      for (const a of asks) {
        const log = withLog && i === 0 ? [] : null;
        const o = runAsk(M, a, plan, scen, i, seed, log);
        if (log) res.log.push(...log);
        let commits = 0;
        Object.entries(o.seasons).forEach(([season, row]) => {
          commits += row.commit;
          res.asks[a].filings[season] = res.asks[a].filings[season] || [];
          res.asks[a].filings[season].push(row.filed);
          res.asks[a].field[season] = res.asks[a].field[season] || {};
          Object.entries(row.byCo).forEach(([co, v]) => {
            const f = res.asks[a].field[season];
            f[co] = f[co] || { filed: 0, commit: 0 };
            if (typeof v === "number" || v === "excluded" || v === "floor" || v === "commit") f[co].filed += 1;
            if (v === "commit" || v === "committed") f[co].commit += 1;
          });
        });
        res.asks[a].commits.push(commits);
        plan.targets.filter((t) => t.ask === a).forEach((t) => {
          const T = res.targets[`${t.co}|${t.ask}`];
          if (o.final[t.co].committed) T.commitBy += 1;
          if (Object.values(o.seasons).some((row) => row.byCo[t.co] === "blocked")) T.blockedRuns += 1;
          Object.entries(o.seasons).forEach(([season, row]) => {
            const v = row.byCo[t.co];
            if (typeof v === "number") { T.voted[season] = (T.voted[season] || 0) + 1; T.support[season] = T.support[season] || []; T.support[season].push(v); }
            if (v === "blocked") T.blocked[season] = (T.blocked[season] || 0) + 1;
            if (v === "commit") T.commitSeason[season] = (T.commitSeason[season] || 0) + 1;
          });
        });
      }
    }
    return res;
  }

  // Where one more filer would change this model the most: for every company and ask, the change in expected
  // commitments on that ask by the horizon (the target and, through contagion, its peers) against no plan.
  // Runs one ask at a time, yielding between asks so the page stays responsive.
  async function sweep(scen, runs = 200, progress = () => {}) {
    const M = S.M;
    const out = [];
    const base = {};
    for (const [k, a] of M.asks.entries()) {
      progress(k, M.asks.length);
      await new Promise((res) => setTimeout(res, 0));
      const b = simulate({ targets: [], from: M.last + 1, lead: false }, { ...scen, extraAsks: [a] }, runs, 11);
      base[a] = mean(b.asks[a].commits);
      M.cos.forEach((c) => {
      const cell = M.cells.get(`${c.ticker}|${a}`);
      const plan = { targets: [{ co: c.ticker, ask: a }], from: M.last + 1, lead: true };
      const res = simulate(plan, scen, runs, 11);
      const T = res.targets[`${c.ticker}|${a}`];
      const holderFilers = Object.keys(P.filers[a] || {}).filter((o) => (P.holders[c.ticker] || []).includes(o));
      out.push({ co: c.ticker, ask: a, gain: mean(res.asks[a].commits) - base[a], pTarget: T.commitBy / runs,
        never: cell.filed.size === 0, holders: holderFilers.length, critical: cell.critical });
      });
    }
    return out.sort((x, y) => y.gain - x.gain);
  }
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);

  // ---------- Names ----------
  const askLabel = (id) => (D.asks.find((a) => a.id === id) || { label: id }).label;
  const coName = (t) => (P.companies.find((c) => c.ticker === t) || { name: t }).name;
  const orgName = (id) => { const n = D.graph && D.graph.nodes ? D.graph.nodes.find((x) => x.id === id) : null; return n ? n.label : id; };

  // ---------- View ----------
  const COLORS = ["var(--accent)", "#7a8fb8", "#1f2937"];
  // Plan A starts from the plan in "Plan an engagement" (or a shared ?plan= link), so the two views follow on.
  function defaultPlan(M) {
    const g = window.PLANNER && window.PLANNER.get ? window.PLANNER.get() : null;
    let coId = g && g.S ? g.S.co : null, ask = g && g.S ? g.S.ask : null;
    if (!coId) { try { [coId, ask] = (new URLSearchParams(location.search).get("plan") || "").split("~"); } catch (e) { /* no plan in the address */ } }
    const c = P.companies.find((x) => x.id === coId || x.ticker === coId);
    const okAsk = D.asks.some((a) => a.id === ask);
    return { name: "Plan A", targets: [{ co: c ? c.ticker : "MSFT", ask: okAsk ? ask : "ask-ai-oversight-reporting" }], from: M.last + 1, lead: true };
  }

  function build() {
    const M = setup();
    MAXSUP = 1.1 * Math.max(...Object.values(P.ask_support).flatMap((a) => a.values || [0]));
    S = { M, plans: [defaultPlan(M)], scen: { horizon: M.last + 3, rescind: false, rescindFrom: M.last + 1, leadMult: P.literature.find((l) => l.id === "lead_investor").value,
      supportBoost: 0, refileMult: 1, floorShare: 0.2, runs: 400 }, season: M.last, result: null, sweep: null };
    el.innerHTML = `
      <h2>Test plans over time</h2>
      <p class="intro">Choose one or more companies and asks to file on, then see how the next seasons could unfold under a model built from this site's records: who files again, who files for the first time, how votes move, when the SEC resubmission rule blocks a refile, and when a company commits. Compare up to three plans. Each result is a scenario computed by this site from stated assumptions, not a forecast and not advice.</p>
      <div id="sim-plans"></div>
      <details class="sim-settings"><summary>Assumptions</summary><div id="sim-settings"></div></details>
      <p><button type="button" class="chip" id="sim-run">Run the scenarios</button> <span id="sim-status" class="ticker" role="status"></span></p>
      <div id="sim-out"></div>
      <section class="pl-card pl-wide" aria-labelledby="sim-h-sweep"><h3 id="sim-h-sweep">Where one more filer changes the model most</h3>
        <p class="status-note">For every company and ask under the US proxy rules: the change in expected company commitments on that ask by ${S.scen.horizon}, if one more investor files there each season and leads a coalition, against no added filer. It counts the target and, through contagion, other companies in the same role. Small numbers on thin data: read the ranking, not the decimals.</p>
        <p><button type="button" class="chip" id="sim-sweep">Rank every company and ask</button></p><div id="sim-sweep-out"></div></section>
      <section class="pl-card pl-wide" aria-labelledby="sim-h-method"><h3 id="sim-h-method">How the model works and how well it did</h3><div id="sim-method"></div></section>`;
    drawPlans();
    drawSettings();
    drawMethod();
    el.querySelector("#sim-run").addEventListener("click", run);
    el.querySelector("#sim-sweep").addEventListener("click", runSweep);
    document.addEventListener("plannerdraw", () => { if (!S.touched) { S.plans[0] = defaultPlan(S.M); drawPlans(); } });
  }

  function coOptions(sel) { return P.companies.map((c) => `<option value="${esc(c.ticker)}"${c.ticker === sel ? " selected" : ""}>${esc(c.name)}</option>`).join(""); }
  function askOptions(sel) { return D.asks.map((a) => `<option value="${esc(a.id)}"${a.id === sel ? " selected" : ""}>${esc(a.label)}</option>`).join(""); }

  function drawPlans() {
    const box = el.querySelector("#sim-plans");
    box.innerHTML = `<div class="sim-plans">${S.plans.map((p, i) => `
      <fieldset class="pl-card sim-plan" data-i="${i}"><legend><span class="sim-swatch" style="background:${COLORS[i]}"></span>${esc(p.name)}</legend>
        ${p.targets.map((t, j) => `<div class="sim-target"><label>Company <select data-f="co" data-j="${j}">${coOptions(t.co)}</select></label>
          <label>Ask <select data-f="ask" data-j="${j}">${askOptions(t.ask)}</select></label>
          ${p.targets.length > 1 ? `<button type="button" class="linklike" data-rm="${j}" aria-label="Remove ${esc(coName(t.co))}, ${esc(askLabel(t.ask))}">Remove</button>` : ""}</div>`).join("")}
        <p><button type="button" class="linklike" data-add="1">Add a company and ask</button></p>
        <label class="gs-check"><input type="checkbox" data-f="lead"${p.lead ? " checked" : ""}> Lead a coalition (co-filers and a lead investor)</label>
        <label>First season <select data-f="from">${[S.M.last + 1, S.M.last + 2].map((y) => `<option${y === p.from ? " selected" : ""}>${y}</option>`).join("")}</select></label>
        ${i ? `<p><button type="button" class="linklike" data-del="1">Remove this plan</button></p>` : ""}
      </fieldset>`).join("")}</div>
      ${S.plans.length < 3 ? `<p><button type="button" class="chip" id="sim-addplan">Add a plan to compare</button></p>` : ""}`;
    box.querySelectorAll(".sim-plan").forEach((fs) => {
      const p = S.plans[+fs.dataset.i];
      fs.addEventListener("change", (e) => {
        S.touched = true;
        const f = e.target.dataset.f, j = +e.target.dataset.j;
        if (f === "co" || f === "ask") p.targets[j][f] = e.target.value;
        if (f === "lead") p.lead = e.target.checked;
        if (f === "from") p.from = +e.target.value;
      });
      fs.addEventListener("click", (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        S.touched = true;
        if (b.dataset.add) p.targets.push({ ...p.targets[p.targets.length - 1] });
        if (b.dataset.rm != null) p.targets.splice(+b.dataset.rm, 1);
        if (b.dataset.del) S.plans.splice(+fs.dataset.i, 1);
        drawPlans();
      });
    });
    const add = box.querySelector("#sim-addplan");
    if (add) add.addEventListener("click", () => { S.touched = true; S.plans.push({ ...JSON.parse(JSON.stringify(S.plans[S.plans.length - 1])), name: `Plan ${"ABC"[S.plans.length]}` }); drawPlans(); });
  }

  function drawSettings() {
    const lit = P.literature.find((l) => l.id === "lead_investor");
    const sc = S.scen;
    const box = el.querySelector("#sim-settings");
    box.innerHTML = `<div class="sim-grid">
      <label>Last season shown <select data-s="horizon">${[1, 2, 3, 4].map((k) => S.M.last + k).map((y) => `<option${y === sc.horizon ? " selected" : ""}>${y}</option>`).join("")}</select></label>
      <label class="gs-check"><input type="checkbox" data-s="rescind"${sc.rescind ? " checked" : ""}> The SEC adopts its proposed rescission of Rule 14a-8 ${link(P.rescission && P.rescission.source_url, "proposal")}</label>
      <label>from the season <select data-s="rescindFrom">${[1, 2, 3].map((k) => S.M.last + k).map((y) => `<option${y === sc.rescindFrom ? " selected" : ""}>${y}</option>`).join("")}</select></label>
      <label>Effect of leading a coalition on the chance of a commitment: × <input type="number" step="0.05" min="1" max="3" data-s="leadMult" value="${sc.leadMult}"> <span class="ticker">default ${lit.value}: ${esc(lit.label.toLowerCase())}${link(lit.source_url, "study")}</span></label>
      <label>Points of support a coalition adds to your proposals: <input type="number" step="1" min="0" max="20" data-s="supportBoost" value="${sc.supportBoost}"> <span class="ticker">default 0: this data has no estimate</span></label>
      <label>Refile rate × <input type="number" step="0.1" min="0.5" max="1.8" data-s="refileMult" value="${sc.refileMult}"> <span class="ticker">1 = the rate in this data; the held-out test below suggests it may be higher</span></label>
      <label>Runs per scenario <select data-s="runs">${[200, 400, 1000].map((n) => `<option${n === sc.runs ? " selected" : ""}>${n}</option>`).join("")}</select></label>
    </div>`;
    box.addEventListener("change", (e) => {
      const k = e.target.dataset.s;
      if (!k) return;
      sc[k] = e.target.type === "checkbox" ? e.target.checked : +e.target.value;
    });
  }

  function run() {
    const st = el.querySelector("#sim-status");
    st.textContent = "Running…";
    setTimeout(() => {
      const t0 = performance.now();
      S.result = S.plans.map((p) => simulate(p, S.scen, S.scen.runs, 7, true));
      S.base = simulate({ targets: [], from: S.M.last + 1, lead: false }, { ...S.scen, extraAsks: [...new Set(S.plans.flatMap((p) => p.targets.map((t) => t.ask)))] }, S.scen.runs, 7);
      S.season = S.scen.horizon;
      drawResults();
      st.textContent = `${plural(S.scen.runs, "run")} per plan in ${Math.round(performance.now() - t0)} ms. Results below.`;
    }, 20);
  }

  function drawResults() {
    const out = el.querySelector("#sim-out");
    const sc = S.scen;
    const seasons = []; for (let y = S.M.last + 1; y <= sc.horizon; y++) seasons.push(y);
    const askSet = [...new Set(S.plans.flatMap((p) => p.targets.map((t) => t.ask)))];
    const baseC = (a) => mean(S.base.asks[a].commits);
    const rows = S.plans.map((p, i) => {
      const R = S.result[i];
      const targets = p.targets.map((t) => {
        const T = R.targets[`${t.co}|${t.ask}`];
        const lastS = seasons.filter((y) => T.support[y]).at(-1);
        const sup = lastS ? T.support[lastS] : [];
        const blocked = T.blockedRuns / R.runs;
        return `<li><strong>${esc(coName(t.co))}</strong>, ${esc(askLabel(t.ask))}: commits by ${sc.horizon} in ${share(T.commitBy / R.runs)} of runs${sup.length ? `; support in ${lastS}, middle 80% of runs: ${pct(quant(sup, 0.1))} to ${pct(quant(sup, 0.9))}` : ""}${blocked ? `; a refile blocked by the SEC rule at least once in ${share(blocked)} of runs` : ""}</li>`;
      }).join("");
      const askLines = [...new Set(p.targets.map((t) => t.ask))].map((a) => {
        const c = R.asks[a].commits;
        return `<li>${esc(askLabel(a))}: ${mean(c).toFixed(2)} expected commitments across companies by ${sc.horizon} (no added filer: ${baseC(a).toFixed(2)})</li>`;
      }).join("");
      return `<section class="pl-card" aria-labelledby="sim-h-r${i}"><h3 id="sim-h-r${i}"><span class="sim-swatch" style="background:${COLORS[i]}"></span>${esc(p.name)}${p.lead ? ", leading a coalition" : ""}</h3>
        <ul class="steps tight">${targets}</ul><h4>Across all companies, including spillover</h4><ul class="steps tight">${askLines}</ul></section>`;
    }).join("");
    out.innerHTML = `
      <p class="note">Scenario computed by this site from data/sim_params.json and the assumptions above${sc.rescind ? `, with Rule 14a-8 rescinded from ${sc.rescindFrom}` : ""}. Not a forecast; not advice. Each rate is drawn from its own uncertainty in every run.</p>
      <div class="pl-grid">${rows}</div>
      <section class="pl-card pl-wide" aria-labelledby="sim-h-chart"><h3 id="sim-h-chart">Support over time</h3>
        <p class="status-note">Dots are recorded votes (8-K results); lines and bands are each plan's middle and middle 80% of support, among runs with a vote that season (runs where the rule blocked a refile or the company committed have no vote). Dashed lines are the Rule 14a-8(i)(12) bars a refile must clear after one, two and three votes.</p>
        <div id="sim-chart"></div></section>
      <section class="pl-card pl-wide" aria-labelledby="sim-h-field"><h3 id="sim-h-field">The field, season by season</h3>
        <p class="status-note">Recorded seasons show what was filed. Later seasons show the share of runs in which each company has a filing (shade) or a commitment (outline), under ${esc(S.plans[0].name)}. Move the slider through time.</p>
        <p><label>Season <input type="range" id="sim-season" min="${P.seasons_observed[0]}" max="${sc.horizon}" value="${S.season}" step="1"> <output id="sim-season-out">${S.season}</output></label>
          <label>Ask <select id="sim-field-ask">${askSet.map((a) => `<option value="${esc(a)}">${esc(askLabel(a))}</option>`).join("")}</select></label></p>
        <div id="sim-field"></div></section>
      <section class="pl-card pl-wide" aria-labelledby="sim-h-log"><h3 id="sim-h-log">One run, step by step (${esc(S.plans[0].name)})</h3>
        <p class="status-note">What the agents did in the first run: filers, companies, the SEC rule and fund families. Fund-family votes use each family's FOR rate on this ask from Form N-PX.</p>
        <ol class="sim-log">${S.result[0].log.slice(0, 60).map((l) => `<li${l.strong ? ' class="strong"' : ""}><span class="ticker">${l.season}</span> ${esc(l.text)}</li>`).join("") || "<li>No filings in this run.</li>"}</ol></section>`;
    drawChart(seasons);
    drawField();
    out.querySelector("#sim-season").addEventListener("input", (e) => { S.season = +e.target.value; out.querySelector("#sim-season-out").textContent = S.season; drawField(); });
    out.querySelector("#sim-field-ask").addEventListener("change", drawField);
  }

  function drawChart(seasons) {
    const box = el.querySelector("#sim-chart");
    const W = Math.max(320, Math.min(1000, Math.round(box.getBoundingClientRect().width) || 700)), H = 260, m = { l: 40, r: 12, t: 10, b: 28 };
    const y0 = P.seasons_observed[0], y1 = S.scen.horizon;
    const x = (y) => m.l + ((y - y0) / Math.max(1, y1 - y0)) * (W - m.l - m.r);
    const all = [];
    S.plans.forEach((p, i) => p.targets.forEach((t) => {
      const cell = S.M.cells.get(`${t.co}|${t.ask}`);
      const T = S.result[i].targets[`${t.co}|${t.ask}`];
      all.push({ i, t, hist: cell.votes.filter((v) => !v.critical), T });
    }));
    const maxY = Math.max(30, ...all.flatMap((a) => a.hist.map((v) => v.support)), ...all.flatMap((a) => seasons.map((s) => quant(a.T.support[s] || [], 0.9) || 0))) * 1.1;
    const y = (v) => H - m.b - (v / maxY) * (H - m.t - m.b);
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="max-width:100%;height:auto" role="img" aria-label="Support over time for each plan's targets: recorded votes and the scenario's middle 80% of runs">`;
    for (let g = 0; g <= maxY; g += 10) svg += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(g)}" y2="${y(g)}" stroke="var(--line)"/><text x="${m.l - 6}" y="${y(g) + 4}" text-anchor="end" font-size="11" fill="var(--ink-soft)">${g}%</text>`;
    P.thresholds.values.forEach((v) => { if (v < maxY) svg += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--ink-soft)" stroke-dasharray="4 4"/>`; });
    for (let yr = y0; yr <= y1; yr++) svg += `<text x="${x(yr)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--ink-soft)">${yr}</text>`;
    svg += `<line x1="${x(S.M.last + 0.5)}" x2="${x(S.M.last + 0.5)}" y1="${m.t}" y2="${H - m.b}" stroke="var(--ink)"/><text x="${x(S.M.last + 0.5) + 4}" y="${m.t + 10}" font-size="11" fill="var(--ink)">scenarios →</text>`;
    all.forEach(({ i, hist, T }) => {
      const col = COLORS[i];
      const pts = seasons.filter((s) => (T.support[s] || []).length >= 5);
      if (pts.length) {
        const lo = pts.map((s) => `${x(s)},${y(quant(T.support[s], 0.1))}`), hi = pts.map((s) => `${x(s)},${y(quant(T.support[s], 0.9))}`).reverse();
        svg += `<polygon points="${lo.concat(hi).join(" ")}" fill="${col}" opacity="0.15"/>`;
        svg += `<polyline points="${pts.map((s) => `${x(s)},${y(quant(T.support[s], 0.5))}`).join(" ")}" fill="none" stroke="${col}" stroke-width="2"/>`;
      }
      hist.forEach((v) => { svg += `<circle cx="${x(v.year)}" cy="${y(v.support)}" r="4" fill="${col}"><title>${v.year}: ${pct(v.support, 1)} (recorded)</title></circle>`; });
    });
    box.innerHTML = svg + "</svg>";
  }

  function drawField() {
    const box = el.querySelector("#sim-field");
    const a = el.querySelector("#sim-field-ask").value;
    const s = S.season;
    const R = S.result[0];
    const real = s <= S.M.last;
    const f = real ? null : R.asks[a].field[s] || {};
    const cells = P.companies.map((c) => {
      const cell = S.M.cells.get(`${c.ticker}|${a}`);
      let shade = 0, commit = 0, label;
      if (real) {
        const on = cell.filed.has(s);
        shade = on ? 1 : 0;
        const v = cell.votes.find((x) => x.year === s);
        label = `${c.name}, ${s}: ${on ? `filed${v ? `, ${pct(v.support, 1)}` : ""}` : "no filing"} (recorded)`;
      } else {
        const z = f[c.ticker] || { filed: 0, commit: 0 };
        shade = z.filed / R.runs; commit = z.commit / R.runs;
        label = `${c.name}, ${s}: filed in ${share(shade)} of runs; committed by then in ${share(commit)}`;
      }
      const mine = S.plans[0].targets.some((t) => t.co === c.ticker && t.ask === a);
      return `<li class="sim-cell${mine ? " mine" : ""}" style="--fill:${shade.toFixed(2)};--ring:${Math.min(1, commit * 3).toFixed(2)}${shade > 0.55 ? ";color:#fff" : ""}" title="${esc(label)}"><span class="visually-hidden">${esc(label)}</span><span aria-hidden="true">${esc(c.ticker)}</span></li>`;
    }).join("");
    box.innerHTML = `<p class="ticker">${real ? "Recorded season" : "Scenario season"} ${s}: ${esc(askLabel(a))}. Your targets are underlined.</p><ul class="sim-field" aria-label="Companies in ${s}">${cells}</ul>`;
  }

  function runSweep() {
    const box = el.querySelector("#sim-sweep-out");
    box.innerHTML = `<p class="ticker" role="status">Ranking ${S.M.cos.length * S.M.asks.length} company-and-ask pairs…</p>`;
    setTimeout(async () => {
      const st = box.querySelector("[role=status]");
      const list = (await sweep(S.scen, 200, (k, n) => { st.textContent = `Ranking company-and-ask pairs: ask ${k + 1} of ${n}…`; })).slice(0, 12);
      box.innerHTML = `<div class="table-wrap"><table><thead><tr><th scope="col">Company</th><th scope="col">Ask</th><th scope="col">Change in expected commitments</th><th scope="col">Commits by ${S.scen.horizon}, share of runs</th><th scope="col">Context</th><th scope="col"><span class="visually-hidden">Add</span></th></tr></thead><tbody>
        ${list.map((r) => `<tr><td>${esc(coName(r.co))}</td><td>${esc(askLabel(r.ask))}</td><td>+${r.gain.toFixed(2)}</td><td>${share(r.pTarget)}</td>
          <td>${r.never ? "never filed here" : "filed here before"}${r.holders ? `; ${plural(r.holders, "investor")} that filed this ask elsewhere ${r.holders === 1 ? "holds" : "hold"} shares here` : ""}${r.critical ? "; earlier filings came from filers critical of ESG" : ""}</td>
          <td><button type="button" class="linklike" data-co="${esc(r.co)}" data-ask="${esc(r.ask)}">Add to ${esc(S.plans[0].name)}</button></td></tr>`).join("")}</tbody></table></div>
        <p class="note">In this data every company commitment came on a first filing of an ask at a company (${P.estimates.commitment_first.k} of ${P.estimates.commitment_first.n} first filings; ${P.estimates.commitment_refile.k} of ${P.estimates.commitment_refile.n} refiles), so pairs never filed rank high. That echoes research that the most new ground lies where few are already working, but three commitments is a small base.</p>`;
      box.querySelectorAll("[data-co]").forEach((b) => b.addEventListener("click", () => {
        S.touched = true;
        S.plans[0].targets.push({ co: b.dataset.co, ask: b.dataset.ask });
        drawPlans();
        el.querySelector("#sim-plans").scrollIntoView({ block: "start" });
      }));
    }, 20);
  }

  function drawMethod() {
    const E = P.estimates, B = P.backtest;
    const rate = (e) => `${e.k} of ${e.n} (${share(betaMean(e))})`;
    el.querySelector("#sim-method").innerHTML = `
      <dl class="summary">
        <div><dt>Refile the next season</dt><dd>${rate(E.refile)} of company-and-ask pairs the SEC rule did not block</dd></div>
        <div><dt>First filing of an ask at a company</dt><dd>${rate(E.new_pair_exposed)} when the ask was filed at a same-role company the season before; ${rate(E.new_pair_unexposed)} otherwise</dd></div>
        <div><dt>Company commits (proposal withdrawn after an agreement)</dt><dd>${rate(E.commitment_first)} of first filings; ${rate(E.commitment_refile)} of refiles</dd></div>
        <div><dt>Company excludes the proposal</dt><dd>${rate(E.exclusion)}</dd></div>
        <div><dt>Support</dt><dd>A refile starts from last year's figure and moves by a yearly ratio with the spread recorded across ${E.support_delta.n} refiles (${esc(B.support_model)}). A first filing draws from the ask's recorded votes at any company.</dd></div>
        <div><dt>Held-out test</dt><dd>Fitted on ${B.fit_seasons.join(", ")} and run on ${B.test_season}: refiles expected ${B.refiled.expected}, recorded ${B.refiled.actual} (the model ran low); first filings expected ${B.new_pairs.expected}, recorded ${B.new_pairs.actual}; support error ${B.support_error.same_as_last_year_mae} points carrying last year forward against ${B.support_error.with_average_drift_mae} with an average drift, across ${B.support_error.n} refiles.</dd></div>
        <div><dt>Not modelled</dt><dd>Letters, meetings, exempt solicitations and votes against directors have no outcome records here, so the model covers filings only. Companies, investors and asks are treated alike within each estimate; asks do not affect each other. Proposals filed from a critical stance on ESG are left out of support figures.</dd></div>
      </dl>
      <p class="note">Built with research on collective behavior in mind: AI agents left alone cluster with familiar partners (Lai, Evans and others${link("https://arxiv.org/abs/2402.12590", "paper")}), and models that know where people already work find more of what is new (Sourati and Evans${link("https://doi.org/10.1038/s41562-023-01648-z", "paper")}). The ranking shows pairs never filed and their holders for that reason.</p>`;
  }

  window.renderSimulator = function (data) {
    el = document.getElementById("tab-simulate");
    if (!el || !data.sim_params) return;
    P = data.sim_params;
    D = { asks: (data.asks && data.asks.asks) || [], graph: data.graph };
    const go = () => { if (!el.hidden && !el.dataset.built) { el.dataset.built = "1"; build(); } };
    new MutationObserver(go).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    go();
  };
  // For tests and for other views (for example the network's Proposals view) to read a scenario.
  window.SIM = { simulate: (plan, scen) => (S ? simulate(plan, { ...S.scen, ...scen }) : null), state: () => S };
})();

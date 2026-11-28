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
    cos.forEach((c) => asks.forEach((a) => cells.set(`${c.ticker}|${a}`, { co: c.ticker, ask: a, votes: [], filed: new Set(), pending: [], critical: false, allCritical: false, filers: [] })));
    P.cells.forEach((x) => {
      const k = `${x.company}|${x.ask}`;
      const c = cells.get(k);
      if (!c) return;
      c.allCritical = !!x.all_critical;
      Object.entries(x.seasons).forEach(([y, list]) => {
        const yr = +y;
        // A season counts as filed when a filer not critical of ESG filed (any filer, for pairs only they filed on),
        // as in the estimator.
        if (x.all_critical || list.some((p) => !p.critical)) c.filed.add(yr);
        list.forEach((p) => {
          if (p.status === "upcoming") c.pending.push(yr);
          if (p.support != null) c.votes.push({ year: yr, support: p.support, critical: p.critical });
          if (p.critical) c.critical = true;
          c.filers.push(...p.filers);
        });
      });
    });
    const last = Math.max(...P.seasons_observed);
    // The first season a new filer can reach at each company: the next one, unless the filing deadline for that
    // meeting has passed, then the one after (found running the scenarios as Parnassus, 2026-11-26).
    const todayIso = window.RULES ? window.RULES.todayISO() : new Date().toISOString().slice(0, 10);
    const firstSeason = new Map(cos.map((c) => [c.ticker, c.next_deadline && c.next_deadline < todayIso ? last + 2 : last + 1]));
    return { E, cos, asks, role, cells, last, thr: P.thresholds, firstSeason };
  }

  // Rule 14a-8(i)(12): may the company exclude a refile in this season? (votes on the same subject)
  // Same rule as scripts/build_sim_params.py votes_by_year() and lockout(): one figure a year on the subject, the
  // highest vote on a proposal not filed from a critical stance on ESG (or, where every filing on the pair was,
  // the highest of those).
  function yearly(votes, allCritical) {
    const by = new Map();
    votes.forEach((x) => { if (x.support != null && (allCritical || !x.critical)) by.set(x.year, Math.max(by.get(x.year) ?? -1, x.support)); });
    return [...by.entries()].sort((a, b) => a[0] - b[0]).map(([year, support]) => ({ year, support }));
  }
  function locked(votes, season, thr, allCritical) {
    const v = yearly(votes, allCritical);
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
      lapsed: betaDraw(E.lapsed_refile, r),
      exposed: betaDraw(E.new_pair_exposed, r),
      unexposed: betaDraw(E.new_pair_unexposed, r),
      cFirst: betaDraw(E.commitment_first, r),
      cRefile: betaDraw(E.commitment_refile, r),
      excl: betaDraw((scen.exclRegime === "latest" && E.exclusion_latest) || (scen.exclRegime === "before" && E.exclusion_before) || E.exclusion, r),
    };
    const prior = P.ask_support[ask] || {};
    const pool = prior.values && prior.values.length ? prior.values : Object.values(P.ask_support).flatMap((a) => a.values || []);
    const logSd = E.support_delta.log_sd || 0.5;
    // First filing: one of the ask's recorded votes (any company). Refile: last year's figure times
    // a yearly ratio drawn with the spread recorded across refiles (no average drift: it did worse on held-out data).
    const firstVote = (rr) => pool[Math.floor(rr() * pool.length)];
    const nextVote = (lastSup, rr) => lastSup * Math.exp(logSd * normal(rr));
    const st = new Map();
    M.cos.forEach((c) => {
      const base = M.cells.get(`${c.ticker}|${ask}`);
      st.set(c.ticker, { votes: base.votes.map((v) => ({ ...v })), filed: new Set(base.filed), committed: false, ever: base.filed.size > 0, critical: base.critical, allCritical: base.allCritical });
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
        const isMine = mine.has(c.ticker) && season >= Math.max(plan.from, M.firstSeason.get(c.ticker) || plan.from);
        let route = "14a-8", p;
        if (rescinded) {
          if (c.route_status !== "open") { if (isMine) row.byCo[c.ticker] = "no route"; continue; }
          route = "floor";
          p = isMine ? 1 : (prevFiled.has(c.ticker) ? draw.refile : 0) * scen.floorShare;
        } else if (locked(s.votes, season, M.thr, s.allCritical)) {
          row.blocked += 1;
          row.byCo[c.ticker] = "blocked";
          if (isMine && log) log.push({ season, text: `You cannot refile ${askLabel(ask)} at ${coName(c.ticker)}: the last vote fell under the Rule 14a-8(i)(12) bar.` });
          continue;
        } else if (isMine) p = 1;
        else if (prevFiled.has(c.ticker)) p = draw.refile;
        else {
          const exposed = [...prevFiled].some((t) => t !== c.ticker && M.role.get(t) === c.tier);
          p = s.ever ? draw.lapsed : exposed ? draw.exposed : draw.unexposed;
        }
        if (r() >= p) continue;
        const first = !s.ever;
        s.ever = true;
        s.filed.add(season);
        row.filed += 1;
        const filer = isMine ? "You" : pickFiler(ask, c.ticker, r);
        let pc = (first ? draw.cFirst : draw.cRefile) * (isMine && plan.lead ? scen.leadMult : 1);
        if (route === "floor") pc *= scen.floorCommit;
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
          if (Object.entries(o.seasons).some(([season, row]) => +season >= plan.from && row.byCo[t.co] === "blocked")) T.blockedRuns += 1;
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
        never: cell.filed.size === 0, holders: holderFilers.length, critical: cell.critical, first: M.firstSeason.get(c.ticker) });
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
  // Owner, 2026-11-26: scenarios (exploratory, not recorded) are green; recorded data stays blue.
  const COLORS = ["var(--scenario)", "var(--scenario-2)", "var(--scenario-3)"];
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
      supportBoost: 0, refileMult: 1, floorShare: 0.2, floorCommit: 0.5, exclRegime: "latest", runs: 400 }, season: M.last, result: null, sweep: null };
    el.innerHTML = `
      <h2>Test plans over time</h2>
      <p class="intro">Choose companies and asks, then see how the next seasons could unfold: refilings, new filers, vote shifts, resubmission limits and commitments. Compare up to three plans. Results are scenarios computed by this site, not forecasts or advice.</p>
      <section class="pl-card pl-wide" aria-labelledby="sim-h-seat"><h3 id="sim-h-seat">Take a seat</h3>
        <p class="status-note">See the moves each participant has, with what this model covers. Moves the model covers can be tried in the scenarios below. Describes options; it does not say which to take.</p>
        <div class="seg sim-seats" role="group" aria-label="Seat">${SEATS.map((s, i) => `<button type="button" data-seat="${s.id}" aria-pressed="${i === 0}">${esc(s.label)}</button>`).join("")}</div>
        <div id="sim-seat" aria-live="polite"></div>
        <details><summary>Game clock: the next filing deadlines</summary><div id="sim-clock"></div></details></section>
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
    drawSeat(SEATS[0].id);
    drawClock();
    el.querySelectorAll(".sim-seats [data-seat]").forEach((b) => b.addEventListener("click", () => {
      el.querySelectorAll(".sim-seats [data-seat]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      drawSeat(b.dataset.seat);
    }));
    el.querySelector("#sim-run").addEventListener("click", run);
    run();
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

  // ---------- Take a seat: each participant's moves, sourced, and what the model covers ----------
  const SEC_URL = "https://sec.gov/newsroom/speeches-statements/corpfin-statement-rule-14a-8-process-081426";
  const SEC_2025 = "https://www.sec.gov/newsroom/speeches-statements/statement-regarding-division-corporation-finances-role-exchange-act-rule-14a-8-process-current-proxy-season";
  const RULE_URL = "https://www.ecfr.gov/current/title-17/chapter-II/part-240/subject-group-ECFR8c9733e13b955d6/section-240.14a-8";
  const SEATS = [
    { id: "proponent", label: "Proponent", moves: [
      { m: "File a proposal (Rule 14a-8) by the company's deadline", model: "Yes: your plan files each season from its first season", src: RULE_URL },
      { m: "Lead a coalition of co-filers", model: "Yes, as an assumption: the coalition setting multiplies the chance of a company commitment", apply: { plan: { lead: true } }, label: "Turn on in Plan A" },
      { m: "Negotiate and withdraw for a company commitment", model: "Yes: the commitment rate from this site's records (first filings and refiles apart)" },
      { m: "File an exempt solicitation (Form PX14A6G) before the vote", model: "No: shown as records on company profiles' engagement timelines" },
      { m: "Urge votes against directors after an exclusion", model: "No: one recorded case, Amazon 2026, on its engagement timeline" },
      { m: "Go to court over an exclusion", model: "No: two 2026 rulings went opposite ways (Laws and rules)" },
    ] },
    { id: "company", label: "Company", moves: [
      { m: "Engage and commit, ending the proposal", model: "Yes: the commitment rate from this site's records" },
      { m: "Oppose and let it go to a vote", model: "Yes: support drawn from recorded votes" },
      { m: "Exclude it, sending the Rule 14a-8(j) notice 80 days before the definitive proxy", model: "Yes: the exclusion rate; 2026 was the first season in which SEC staff did not review most exclusions", src: SEC_2025, apply: { scen: { exclRegime: "latest" } }, label: "Use the 2026 rate" },
      { m: "Accept the risk of a lawsuit after an exclusion", model: "No: court outcomes are not modelled" },
    ] },
    { id: "fund", label: "Fund family", moves: [
      { m: "Vote each proposal under its own voting policy", model: "In the step-by-step log: each family votes FOR at its Form N-PX rate on the ask; vote totals come from recorded results", family: true },
      { m: "Offer pass-through voting so fund holders choose", model: "No: programs are listed under How fund families voted" },
    ] },
    { id: "advisor", label: "Proxy advisor", moves: [
      { m: "Recommend for or against each proposal", model: "No: ISS and Glass Lewis recommendations are not public in this site's sources" },
    ] },
    { id: "policy", label: "Policymaker", moves: [
      { m: "Adopt the SEC's proposed rescission of Rule 14a-8", model: "Yes, as a switch: from a season on, only floor proposals (raised in person at the meeting) where a company's own rules allow them", src: P0 => (P0.rescission || {}).source_url, apply: { scen: { rescind: true } }, label: "Turn on" },
      { m: "Resume SEC staff review of exclusions", model: "Yes, roughly: use the exclusion rate of the seasons with SEC staff review", src: SEC_URL, apply: { scen: { exclRegime: "before" } }, label: "Use those seasons' rate" },
      { m: "Pass laws that cover an ask", model: "No: policy coverage by ask is on Laws and rules and in the planner" },
    ] },
  ];
  function drawSeat(id) {
    const s = SEATS.find((x) => x.id === id);
    const fams = s.moves.some((m) => m.family) ? famTotals() : "";
    const isOn = (m) => (m.apply.plan ? Object.entries(m.apply.plan).every(([k, v]) => S.plans[0][k] === v) : true) && (m.apply.scen ? Object.entries(m.apply.scen).every(([k, v]) => S.scen[k] === v) : true);
    // A move already in use is stated, not offered as a button; it changes back under Assumptions or in the plan.
    el.querySelector("#sim-seat").innerHTML = `<ul class="steps tight sim-moves">${s.moves.map((m, i) => {
      const src = typeof m.src === "function" ? m.src(P) : m.src;
      const act = !m.apply ? "" : isOn(m) ? `<span class="sim-inuse">In use in the scenarios; change it under Assumptions or in the plan.</span>` : `<button type="button" class="chip sim-apply" data-i="${i}" data-move-seat="${esc(id)}">${esc(m.label)}</button>`;
      return `<li><strong>${esc(m.m)}</strong>${link(src, "source")}<div class="ticker">In this model: ${esc(m.model)}</div>${act}</li>`;
    }).join("")}</ul>${fams}`;
    el.querySelectorAll(".sim-apply").forEach((b) => b.addEventListener("click", () => {
      const m = SEATS.find((x) => x.id === b.dataset.moveSeat).moves[+b.dataset.i];
      if (m.apply.plan) Object.assign(S.plans[0], m.apply.plan);
      if (m.apply.scen) Object.assign(S.scen, m.apply.scen);
      S.touched = true;
      drawPlans();
      drawSettings();
      drawSeat(b.dataset.moveSeat);
      run({ type: "click" });
    }));
  }
  function famTotals() {
    const t = {};
    Object.entries(P.family_for || {}).forEach(([f, d]) => { Object.values(d).forEach((v) => { t[f] = t[f] || { for: 0, n: 0, un: 0 }; t[f].for += v.for; t[f].n += v.n; t[f].un += v.unreviewed || 0; }); });
    const rows = Object.entries(t).sort((a, b) => b[1].for / b[1].n - a[1].for / a[1].n);
    return rows.length ? `<p class="ticker">Fund families' Form N-PX record on all AI proposals here: ${rows.map(([f, v]) => `${esc(f)} FOR on ${v.for} of ${v.n}`).join("; ")}. <span class="unverified">Matched automatically; ${rows.reduce((n, [, v]) => n + v.un, 0)} of ${rows.reduce((n, [, v]) => n + v.n, 0)} not yet reviewed by a person.</span></p>` : "";
  }
  function drawClock() {
    const today = window.RULES ? window.RULES.todayISO() : new Date().toISOString().slice(0, 10);
    const dayNum = (iso) => Math.round(Date.parse(`${iso}T12:00:00Z`) / 864e5);
    const list = P.companies.filter((c) => c.next_deadline && c.next_deadline >= today).sort((a, b) => a.next_deadline.localeCompare(b.next_deadline));
    el.querySelector("#sim-clock").innerHTML = list.length ? `<ol class="steps tight">${list.map((c) => `<li><strong>${esc(DL(c.next_deadline))}</strong> (in ${plural(dayNum(c.next_deadline) - dayNum(today), "day")}): ${esc(c.name)}${link(c.next_deadline_source, "proxy")}</li>`).join("")}</ol><p class="ticker">Rule 14a-8 deadlines from each company's proxy statement. A scenario season starts at the next deadline.</p>` : `<p class="status-note">No open filing deadline on file.</p>`;
  }

  function drawSettings() {
    const lit = P.literature.find((l) => l.id === "lead_investor");
    const sc = S.scen;
    const box = el.querySelector("#sim-settings");
    box.innerHTML = `<div class="sim-grid">
      <label>Last season shown <select data-s="horizon">${[1, 2, 3, 4].map((k) => S.M.last + k).map((y) => `<option${y === sc.horizon ? " selected" : ""}>${y}</option>`).join("")}</select></label>
      <label class="gs-check"><input type="checkbox" data-s="rescind"${sc.rescind ? " checked" : ""}> The SEC adopts its proposed rescission of Rule 14a-8 ${link(P.rescission && P.rescission.source_url, "proposal")}</label>
      <label>from the season <select data-s="rescindFrom">${[1, 2, 3].map((k) => S.M.last + k).map((y) => `<option${y === sc.rescindFrom ? " selected" : ""}>${y}</option>`).join("")}</select></label>
      <label>Effect of leading a coalition on the chance of a commitment: × <input type="number" step="0.05" min="1" max="3" data-s="leadMult" value="${sc.leadMult}"> <span class="ticker">default ${lit.value}: in investor-network engagement dialogues, ${esc(lit.label.toLowerCase())}${link(lit.source_url, "study")}; applied here to filings as an assumption</span></label>
      <label>Points of support a coalition adds to your proposals: <input type="number" step="1" min="0" max="20" data-s="supportBoost" value="${sc.supportBoost}"> <span class="ticker">default 0: this data has no estimate</span></label>
      <label>Refile rate × <input type="number" step="0.1" min="0.5" max="1.8" data-s="refileMult" value="${sc.refileMult}"> <span class="ticker">1 = the rate in this data; the held-out test below suggests it may be higher</span></label>
      <label>Share of usual refilers who would raise a floor proposal after a rescission: <input type="number" step="0.05" min="0" max="1" data-s="floorShare" value="${sc.floorShare}"> <span class="ticker">no estimate in this data</span></label>
      <label>Chance a floor proposal ends in a commitment, against a filed one: × <input type="number" step="0.1" min="0" max="1" data-s="floorCommit" value="${sc.floorCommit}"> <span class="ticker">no estimate in this data</span></label>
      <label>Chance a company excludes a filing: <select data-s="exclRegime">${[
        ["latest", `as in ${P.estimates.exclusion_latest ? P.estimates.exclusion_latest.season : "the latest season"}, the first season in which SEC staff did not review most exclusions (${P.estimates.exclusion_latest ? `${P.estimates.exclusion_latest.k} of ${P.estimates.exclusion_latest.n}` : "–"} company-and-ask filings)`],
        ["before", `as in the seasons with SEC staff review, to ${P.estimates.exclusion_before ? P.estimates.exclusion_before.until : ""} (${P.estimates.exclusion_before ? `${P.estimates.exclusion_before.k} of ${P.estimates.exclusion_before.n}` : "–"})`],
        ["all", `as in all seasons (${P.estimates.exclusion.k} of ${P.estimates.exclusion.n})`],
      ].map(([v, l]) => `<option value="${v}"${sc.exclRegime === v ? " selected" : ""}>${esc(l)}</option>`).join("")}</select> <span class="ticker">SEC staff stopped answering most no-action requests on November 17, 2025${link(SEC_2025, "SEC")} and all of them on August 14, 2026${link(SEC_URL, "SEC")}; proponents have since gone to court over exclusions (see <a href="#causality">Laws and rules</a>)</span></label>
      <label>Runs per scenario <select data-s="runs">${[200, 400, 1000].map((n) => `<option${n === sc.runs ? " selected" : ""}>${n}</option>`).join("")}</select></label>
    </div>`;
    if (box.dataset.wired) return; // the settings can be redrawn (Take a seat); listen once
    box.dataset.wired = "1";
    box.addEventListener("change", (e) => {
      const k = e.target.dataset.s;
      if (!k) return;
      S.scen[k] = e.target.type === "checkbox" ? e.target.checked : Number.isNaN(+e.target.value) ? e.target.value : +e.target.value;
    });
  }

  // Owner, 2026-11-26: "Nothing happened when I ran the scenarios": say whether anything changed, then take the
  // reader to the results and mark what redrew. The first run on arrival stays put.
  function run(e) {
    const st = el.querySelector("#sim-status");
    const sig = JSON.stringify([S.plans, S.scen]);
    const same = S.lastSig === sig && S.result;
    const byClick = !!(e && e.type === "click");
    st.textContent = "Running…";
    setTimeout(() => {
      const t0 = performance.now();
      S.result = S.plans.map((p) => simulate(p, S.scen, S.scen.runs, 7, true));
      S.base = simulate({ targets: [], from: S.M.last + 1, lead: false }, { ...S.scen, extraAsks: [...new Set(S.plans.flatMap((p) => p.targets.map((t) => t.ask)))] }, S.scen.runs, 7);
      S.season = S.scen.horizon;
      drawResults();
      S.lastSig = sig;
      const ms = Math.round(performance.now() - t0);
      st.textContent = same
        ? `Same plans and assumptions as the last run, so the results are unchanged (${plural(S.scen.runs, "run")} per plan, ${ms} ms). Change a plan or an assumption to see a difference.`
        : `${plural(S.scen.runs, "run")} per plan in ${ms} ms. Results updated below.`;
      if (byClick) {
        const out = el.querySelector("#sim-out");
        out.querySelectorAll(".pl-card, .chart-card").forEach((c) => { c.classList.remove("sim-updated"); void c.offsetWidth; c.classList.add("sim-updated"); setTimeout(() => c.classList.remove("sim-updated"), 2000); });
        const h = out.querySelector("h3");
        if (h) { h.tabIndex = -1; h.scrollIntoView({ block: "start", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); h.focus({ preventScroll: true }); }
      }
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
        const fs = S.M.firstSeason.get(t.co);
        const late = fs > p.from ? ` <span class="ticker">(the filing deadline for the ${p.from} meeting has passed, so this plan files from ${fs})</span>` : "";
        return `<li><strong>${esc(coName(t.co))}</strong>, ${esc(askLabel(t.ask))}${late}: commits by ${sc.horizon} in ${share(T.commitBy / R.runs)} of runs${sup.length ? `; support in ${lastS}, middle 80% of runs: ${pct(quant(sup, 0.1))} to ${pct(quant(sup, 0.9))}` : ""}${blocked ? `; a refile blocked by the SEC rule at least once in ${share(blocked)} of runs` : ""}</li>`;
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
        <div id="sim-chart"></div></section>
      <details class="pl-card pl-wide sim-more" id="sim-field-box"><summary><h3 id="sim-h-field">The field, season by season</h3></summary>
        <p class="status-note">Recorded seasons show in blue what was filed. Scenario seasons show in green the share of runs in which each company has a filing (shade) or a commitment (outline), under ${esc(S.plans[0].name)}. Move the slider through time.</p>
        <p><label>Season <input type="range" id="sim-season" min="${P.seasons_observed[0]}" max="${sc.horizon}" value="${S.season}" step="1"> <output id="sim-season-out">${S.season}</output></label>
          <label>Ask <select id="sim-field-ask">${askSet.map((a) => `<option value="${esc(a)}">${esc(askLabel(a))}</option>`).join("")}</select></label></p>
        <div id="sim-field"></div></details>
      <details class="pl-card pl-wide sim-more"><summary><h3 id="sim-h-log">One run, step by step (${esc(S.plans[0].name)})</h3></summary>
        <p class="status-note">What the agents did in the first run: filers, companies, the SEC rule and fund families. These are simulated events, not records: each filer named is drawn from the organizations that have filed this ask before, weighted toward those holding the company's shares. Fund-family votes use each family's FOR rate on this ask from Form N-PX.</p>
        <ol class="sim-log">${S.result[0].log.slice(0, 60).map((l) => `<li${l.strong ? ' class="strong"' : ""}><span class="ticker">${l.season}</span> ${esc(l.text)}</li>`).join("") || "<li>No filings in this run.</li>"}</ol></details>`;
    drawChart(seasons);
    drawField();
    out.querySelector("#sim-season").addEventListener("input", (e) => { S.season = +e.target.value; out.querySelector("#sim-season-out").textContent = S.season; drawField(); });
    out.querySelector("#sim-field-ask").addEventListener("change", drawField);
    // Closed by default (module audit, 2026-11-27: useful for checking the model, not for deciding); draw on open.
    out.querySelector("#sim-field-box").addEventListener("toggle", (e) => { if (e.target.open) drawField(); });
  }

  function drawChart(seasons) {
    const box = el.querySelector("#sim-chart");
    const W = Math.max(320, Math.min(1000, Math.round(box.getBoundingClientRect().width) || 700)), H = 260, m = { l: 40, r: 24, t: 10, b: 28 };
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
    let svg = `<svg class="sim-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="max-width:100%;height:auto" role="img" aria-label="Support over time for each plan's targets: recorded votes and the scenario's middle 80% of runs">`;
    for (let g = 0; g <= maxY; g += 10) svg += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(g)}" y2="${y(g)}" stroke="var(--line)"/><text x="${m.l - 6}" y="${y(g) + 4}" text-anchor="end" font-size="11" fill="var(--ink-soft)">${g}%</text>`;
    P.thresholds.values.forEach((v) => { if (v < maxY) svg += `<line x1="${m.l}" x2="${W - m.r}" y1="${y(v)}" y2="${y(v)}" stroke="var(--ink-soft)" stroke-dasharray="4 4"/>`; });
    for (let yr = y0; yr <= y1; yr++) svg += `<text x="${x(yr)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="var(--ink-soft)">${yr}</text>`;
    svg += `<line x1="${x(S.M.last + 0.5)}" x2="${x(S.M.last + 0.5)}" y1="${m.t}" y2="${H - m.b}" stroke="var(--ink)"/><text x="${x(S.M.last + 0.5) + 10}" y="${m.t + 10}" font-size="11" fill="var(--ink)">scenarios →</text>`;
    // Owner, 2026-11-27: "make this visual more dynamic so you can see it move over time". The plot is revealed up to
    // a season (a clip that follows a time cursor), played through once and scrubbable with the slider below.
    svg += `<defs><clipPath id="sim-clip"><rect id="sim-clip-r" x="0" y="0" width="${W}" height="${H}"/></clipPath></defs><g clip-path="url(#sim-clip)">`;
    all.forEach(({ i, hist, T }) => {
      const col = COLORS[i];
      const pts = seasons.filter((s) => (T.support[s] || []).length >= 5);
      if (pts.length) {
        const lo = pts.map((s) => `${x(s)},${y(quant(T.support[s], 0.1))}`), hi = pts.map((s) => `${x(s)},${y(quant(T.support[s], 0.9))}`).reverse();
        svg += `<polygon points="${lo.concat(hi).join(" ")}" fill="${col}" opacity="0.15"/>`;
        svg += `<polyline points="${pts.map((s) => `${x(s)},${y(quant(T.support[s], 0.5))}`).join(" ")}" fill="none" stroke="${col}" stroke-width="2"/>`;
      }
      hist.forEach((v) => { svg += `<circle cx="${x(v.year)}" cy="${y(v.support)}" r="4" fill="var(--accent)"><title>${v.year}: ${pct(v.support, 1)} (recorded)</title></circle>`; });
    });
    svg += `</g><g id="sim-cursor"><line x1="0" x2="0" y1="${m.t}" y2="${H - m.b}" stroke="#e8590c" stroke-width="1.5"/></g>`;
    const rows = all.flatMap(({ i, t, hist, T }) => [...new Set([...hist.map((v) => v.year), ...seasons])].sort().map((yr) => {
      const rec = hist.filter((v) => v.year === yr).map((v) => pct(v.support, 1)).join(", ");
      const s = T.support[yr] || [];
      return `<tr><td>${esc(S.plans[i].name)}</td><td>${esc(coName(t.co))}, ${esc(askLabel(t.ask))}</td><td>${yr}</td><td>${rec || "–"}</td><td>${s.length ? pct(quant(s, 0.5)) : "–"}</td><td>${s.length ? `${pct(quant(s, 0.1))} to ${pct(quant(s, 0.9))}` : "–"}</td><td>${yr > S.M.last ? share(s.length / S.result[i].runs) : "–"}</td></tr>`;
    })).join("");
    // A self-contained figure (owner, 2026-11-26): title, measure, years, key and source inside it, so a screenshot
    // stands on its own. Helpers from app.js.
    const head = window.figHead ? window.figHead(`Support for each plan's targets, recorded and in scenarios, ${y0}–${y1}`,
      `Percent of votes cast for ÷ (for + against). Scenarios: ${S.scen.runs} runs per plan, among runs with a vote that season.`) : "";
    const key = `<div class="chart-key sim-key"><span><svg width="12" height="12" aria-hidden="true"><circle cx="6" cy="6" r="4" fill="var(--accent)"/></svg> Recorded vote</span>
      ${S.plans.map((p, i) => `<span><svg width="22" height="12" aria-hidden="true"><rect x="0" y="2" width="22" height="8" fill="${COLORS[i]}" opacity=".2"/><line x1="0" x2="22" y1="6" y2="6" stroke="${COLORS[i]}" stroke-width="2"/></svg> ${esc(p.name)}: middle and middle 80% of runs</span>`).join("")}
      <span><svg width="22" height="12" aria-hidden="true"><line x1="0" x2="22" y1="6" y2="6" stroke="var(--ink-soft)" stroke-dasharray="4 4"/></svg> Rule 14a-8(i)(12) bars: 5%, 15%, 25%</span></div>`;
    const source = window.figSource ? window.figSource("8-K vote results for recorded votes; scenarios computed by this site from data/sim_params.json, not a forecast and not advice;") : "";
    const ctl = `<div class="sim-play"><button type="button" class="chip" id="sim-play-btn">Play over time</button>
      <label>Season <input type="range" id="sim-t" min="${y0}" max="${y1}" step="1" value="${y1}"> <output id="sim-t-out">${y1}</output></label>
      <p class="sim-read" id="sim-read" aria-live="polite"></p></div>`;
    box.innerHTML = `<figure class="card chart-card fig">${head}${key}${ctl}${svg}</svg>${source}</figure><details><summary>The same figures as a table</summary><div class="table-wrap"><table><thead><tr><th scope="col">Plan</th><th scope="col">Target</th><th scope="col">Season</th><th scope="col">Recorded vote</th><th scope="col">Scenario middle</th><th scope="col">Middle 80% of runs</th><th scope="col">Runs with a vote</th></tr></thead><tbody>${rows}</tbody></table></div><p class="ticker">A dash in the recorded column: no recorded vote on this ask at this company.</p></details>`;
    const clip = box.querySelector("#sim-clip-r"), cur = box.querySelector("#sim-cursor"), t = box.querySelector("#sim-t"), out = box.querySelector("#sim-t-out"), read = box.querySelector("#sim-read");
    const show = (yr) => {
      const px = Math.min(W, x(yr) + 12);
      clip.setAttribute("width", px);
      cur.setAttribute("transform", `translate(${x(yr)},0)`);
      t.value = Math.round(yr); out.textContent = Math.round(yr);
      const yy = Math.round(yr);
      read.textContent = all.map(({ i, t: tg, hist, T }) => {
        const rec = hist.filter((v) => v.year === yy).map((v) => pct(v.support, 1)).join(", ");
        const sp = T.support[yy] || [];
        const what = rec ? `recorded ${rec}` : sp.length >= 5 ? `scenario middle ${pct(quant(sp, 0.5))} (80% of runs ${pct(quant(sp, 0.1))} to ${pct(quant(sp, 0.9))})` : "no vote";
        return `${S.plans[i].name}, ${coName(tg.co)}: ${what}`;
      }).join(" · ") + ` (${yy}${yy > S.M.last ? ", scenario" : ""})`;
    };
    let raf = 0;
    const play = () => {
      cancelAnimationFrame(raf);
      const start = performance.now(), dur = 900 * (y1 - y0);
      const step = (now) => { const k = Math.min(1, (now - start) / dur); show(y0 + k * (y1 - y0)); if (k < 1) raf = requestAnimationFrame(step); };
      raf = requestAnimationFrame(step);
    };
    t.addEventListener("input", () => { cancelAnimationFrame(raf); show(+t.value); });
    box.querySelector("#sim-play-btn").addEventListener("click", play);
    show(y1);
    if (!navigator.webdriver && !matchMedia("(prefers-reduced-motion: reduce)").matches && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { io.disconnect(); play(); } }, { threshold: 0.5 });
      io.observe(box.querySelector(".sim-svg"));
    }
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
      if (mine) label += " (your target)";
      return `<li class="sim-cell${mine ? " mine" : ""}${real ? "" : " scen"}" style="--fill:${shade.toFixed(2)};--ring:${Math.min(1, commit * 3).toFixed(2)}${!real && shade > 0 ? "" : shade > 0.55 ? ";color:#fff" : ""}" title="${esc(label)}"><span class="visually-hidden">${esc(label)}</span><span aria-hidden="true">${esc(c.ticker)}</span></li>`;
    }).join("");
    box.innerHTML = `<p class="ticker">${real ? "Recorded season" : "Scenario season"} ${s}: ${esc(askLabel(a))}. Your targets are underlined.</p><ul class="sim-field" aria-label="Companies in ${s}">${cells}</ul>`;
  }

  function runSweep() {
    const box = el.querySelector("#sim-sweep-out");
    box.innerHTML = `<p class="ticker" role="status">Ranking ${S.M.cos.length * S.M.asks.length} company-and-ask pairs…</p>`;
    setTimeout(async () => {
      const st = box.querySelector("[role=status]");
      const list = (await sweep(S.scen, 200, (k, n) => { st.textContent = `Ranking company-and-ask pairs: ask ${k + 1} of ${n}…`; })).slice(0, 12);
      box.innerHTML = `<p class="note">In this data every company commitment came on a first filing of an ask at a company (${P.estimates.commitment_first.k} of ${P.estimates.commitment_first.n} first filings; ${P.estimates.commitment_refile.k} of ${P.estimates.commitment_refile.n} refiles), so pairs never filed rank high. Three commitments is a small base: this ranks pairs by the model, it does not say where anyone should file.</p>
        <div class="table-wrap"><table><thead><tr><th scope="col">Company</th><th scope="col">Ask</th><th scope="col">Change in expected commitments</th><th scope="col">Commits by ${S.scen.horizon}, share of runs</th><th scope="col">Context</th><th scope="col"><span class="visually-hidden">Test</span></th></tr></thead><tbody>
        ${list.map((r) => `<tr><td>${esc(coName(r.co))}</td><td>${esc(askLabel(r.ask))}</td><td>+${r.gain.toFixed(2)}</td><td>${share(r.pTarget)}</td>
          <td>${r.never ? "never filed here" : "filed here before"}${r.holders ? `; ${plural(r.holders, "investor")} that filed this ask elsewhere ${r.holders === 1 ? "holds" : "hold"} shares here` : ""}${r.critical ? "; earlier filings came from filers critical of ESG" : ""}${r.first > S.M.last + 1 ? `; deadline for the ${S.M.last + 1} meeting has passed, so filing starts ${r.first}` : ""}</td>
          <td><button type="button" class="linklike" data-co="${esc(r.co)}" data-ask="${esc(r.ask)}" aria-label="Test ${esc(coName(r.co))}, ${esc(askLabel(r.ask))} in ${esc(S.plans[0].name)}">Test in ${esc(S.plans[0].name)}</button></td></tr>`).join("")}</tbody></table></div>
`;
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
    const rate = (e) => `${e.k} of ${e.n} recorded (model rate about ${share(betaMean(e))})`;
    el.querySelector("#sim-method").innerHTML = `
      <dl class="summary">
        <div><dt>Refile the next season</dt><dd>${rate(E.refile)} of company-and-ask pairs the SEC rule did not block</dd></div>
        <div><dt>Refile after a gap of a season or more</dt><dd>${rate(E.lapsed_refile)}</dd></div>
        <div><dt>First filing of an ask at a company</dt><dd>${rate(E.new_pair_exposed)} when the ask was filed at a same-role company the season before; ${rate(E.new_pair_unexposed)} otherwise</dd></div>
        <div><dt>Company commits (proposal withdrawn after an agreement)</dt><dd>${rate(E.commitment_first)} of first filings; ${rate(E.commitment_refile)} of refiles</dd></div>
        <div><dt>Company excludes the proposal</dt><dd>${rate(E.exclusion)} across all seasons; ${E.exclusion_latest ? `${rate(E.exclusion_latest)} in ${E.exclusion_latest.season}, the first season in which SEC staff did not review most exclusions` : ""}</dd></div>
        <div><dt>Support</dt><dd>A refile starts from last year's figure and moves by a yearly ratio with the spread recorded across ${E.support_delta.n} refiles (${esc(B.support_model)}). A first filing draws from the ask's recorded votes at any company.</dd></div>
        <div><dt>Held-out test</dt><dd>The refile, refile-after-a-gap and first-filing rates fitted on ${B.fit_seasons.join(", ")} only, then compared with ${B.test_season} (commitments and exclusions are too rare to test on one season, and the after-a-gap rate rests on very few cases): refiles expected ${B.refiled.expected}, recorded ${B.refiled.actual} of ${B.refiled.eligible} pairs the rule left open (the model ran low; the refile setting above can raise it); refiles after a gap expected ${B.lapsed.expected}, recorded ${B.lapsed.actual} of ${B.lapsed.eligible}; first filings expected ${B.new_pairs.expected}, recorded ${B.new_pairs.actual}; support error ${B.support_error.same_as_last_year_mae} points carrying last year forward against ${B.support_error.with_average_drift_mae} with an average drift, across ${B.support_error.n} refiles.</dd></div>
        <div><dt>Settings with no estimate in this data</dt><dd>Leading a coalition (from a study of investor-network dialogues, applied here to filings), points of support a coalition adds, the share of usual refilers who would use a floor proposal after a rescission, and how much less often a floor proposal ends in a commitment. All are under Assumptions.</dd></div>
        <div><dt>Not modelled</dt><dd>Letters, meetings, exempt solicitations and votes against directors have no outcome records here, so the model covers filings only. A proponent suing over an exclusion is not modelled: two 2026 rulings went opposite ways (see Laws and rules). Companies, investors and asks are treated alike within each estimate; asks do not affect each other. Proposals filed from a critical stance on ESG are left out of support figures.</dd></div>
      </dl>
      <p class="note">Two studies shaped the design. In a simulated gathering of AI agents, the agents kept to small circles of familiar partners rather than meeting new ones (Lai, Evans and others${link("https://arxiv.org/abs/2402.12590", "paper")}); and accounting for where experts already work improved predictions of future discoveries, while steering away from those places surfaced ideas people were unlikely to reach (Sourati and Evans${link("https://doi.org/10.1038/s41562-023-01648-z", "paper")}). So the ranking shows pairs never filed, and the investors that hold shares there and have filed the same ask elsewhere.</p>`;
  }

  window.renderSimulator = function (data) {
    el = document.getElementById("tab-simulate");
    if (!el) return;
    D = { asks: (data.asks && data.asks.asks) || [], graph: data.graph };
    const go = async () => {
      if (el.hidden || el.dataset.built) return;
      el.dataset.built = "1";
      el.innerHTML = `<p class="status-note" role="status">Loading the model…</p>`;
      try { P = await fetch("data/sim_params.json").then((r) => r.json()); } catch (e) { el.innerHTML = `<p class="status-note">The model's data did not load.</p>`; return; }
      build();
    };
    new MutationObserver(go).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    go();
  };
  // For tests and for other views (for example the network's Proposals view) to read a scenario.
  window.SIM = { simulate: (plan, scen) => (S ? simulate(plan, { ...S.scen, ...scen }) : null), state: () => S };
})();

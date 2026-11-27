// Planner tools (Plan and test › Plan an engagement), built only from this site's records:
//   - Support range if this ask is filed here: a simple rule with a strict published backtest (data/forecast.json,
//     scripts/build_forecast.py), fund families' Form N-PX record on the ask, and, for a refile at a dual-class
//     company, a floor for support among other votes at the latest vote;
//   - Your logged forecasts: a range you enter for a coming season, scored when that season's result is on this site
//     (kept in this browser only; nothing is sent anywhere);
//   - Ask designer: where a draft "resolved" clause's main request sits, from disclosure request to operational
//     mandate, next to past proposals and their results. It describes the wording; it does not judge the draft.
// The planner draws .pltools-slot elements; window.PLANNER_TOOLS.fill(root, ctx) fills them.
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const link = (url, label = "source") => (url ? ` <a class="src" href="${esc(url)}" target="_blank" rel="noopener">[${esc(label)}]</a>` : "");
  const pct = (x, d = 1) => (x == null || Number.isNaN(x) ? "–" : `${(Math.round(x * 10 ** d) / 10 ** d).toFixed(d)}%`);
  const D = (v) => (window.DATES ? window.DATES.long(v) : String(v));
  const today = () => (window.RULES ? window.RULES.todayISO() : new Date().toISOString().slice(0, 10));
  // The same median as scripts/build_forecast.py (the mean of the two middle values when the count is even).
  const median = (v) => { const s = v.slice().sort((a, b) => a - b), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const STORE = "planner-forecasts-v1"; // saved items, so kept across visits (settings are per visit)
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(STORE) || "[]"); } catch (e) { return []; } },
    set(v) { try { localStorage.setItem(STORE, JSON.stringify(v)); } catch (e) { /* storage blocked: not kept */ } },
  };
  let F = null, loading = null;
  const load = () => {
    if (!loading) loading = fetch("data/forecast.json").then((r) => r.json()).then((d) => { F = d; return d; }).catch(() => null);
    return loading;
  };

  // ---------- Support range ----------
  function rangeFor(co, ask) {
    const last = F.latest[`${co}|${ask}`];
    let start, kind, basis;
    if (last) { start = last.support; kind = "refile"; basis = `the latest vote on this ask here, ${pct(last.support)} in ${last.season}`; }
    else {
      const v = F.ask_votes[ask] || [];
      start = v.length ? median(v) : F.all_votes_median; kind = "first";
      basis = v.length ? `the median of this ask's ${v.length} recorded vote${v.length === 1 ? "" : "s"} at other companies (${pct(start)})` : `the median of all recorded AI votes (${pct(start)}); this ask has none`;
    }
    const b = F.bands[kind];
    // Capped a little above the highest AI-proposal vote recorded here, as the simulator is.
    const cap = F.max_recorded ? Math.min(100, 1.1 * F.max_recorded) : 100;
    const at = (x) => Math.min(cap, start * Math.exp(x));
    return { kind, basis, last, cap, lo: at(b.lo), mid: at(b.mid), hi: at(b.hi), min: at(b.min), max: at(b.max) };
  }

  function forecastHtml(co, ask, coName, upcoming) {
    const r = rangeFor(co, ask);
    const bt = F.backtest;
    const ctl = F.control[co];
    const fam = Object.entries((F.family_for || {})[ask] || {}).sort((a, b) => b[1].for / b[1].n - a[1].for / a[1].n);
    const unrev = fam.reduce((n, [, v]) => n + (v.unreviewed || 0), 0), all = fam.reduce((n, [, v]) => n + v.n, 0);
    // The floor applies to a recorded vote at this company: with the controlling holders' votes all cast against,
    // support among other votes cast was at least s / (1 - c) (more, since not every share votes).
    const floor = ctl && r.last ? Math.min(100, r.last.support / (1 - ctl.pct / 100)) : null;
    return `<section class="pl-card" aria-labelledby="pt-h-fc"><h3 id="pt-h-fc">Support range if this ask is filed here</h3>
      ${upcoming ? `<p class="status-note">On the ballot already: ${esc(upcoming)}.</p>` : ""}
      <p class="pt-range">Scenario: <strong>${pct(r.lo, 0)} to ${pct(r.hi, 0)}</strong> <span class="ticker">(the middle 80% of past errors)</span></p>
      <p class="ticker">Full spread of past errors: ${pct(r.min, 0)} to ${pct(r.max, 0)}${r.max >= r.cap - 0.05 ? ` (capped at ${pct(r.cap, 0)}, a little above the highest AI-proposal vote recorded here)` : ""}. In a strict test on past votes the middle band held only ${bt.inside_80} of ${bt.cases} times (${pct(100 * bt.coverage, 0)}) and the full spread ${bt.inside_full} of ${bt.cases} (${pct(100 * bt.full_coverage, 0)}): there is too little history for a true 80% range, so read both as narrower than the actual uncertainty.</p>
      <p class="ticker">Starts from ${esc(r.basis)}${r.last ? link(r.last.source_url, "8-K") : ""}. Support is for ÷ (for + against), leaving out proposals from filers critical of ESG. Computed by this site; not a forecast of this vote and not advice.</p>
      ${floor != null ? `<p class="ticker">Dual-class control: ${esc(ctl.who)}, ${pct(ctl.pct, ctl.pct % 1 ? 1 : 0)} of voting power${link(ctl.source_url, "company")}. Using that figure from this site's current company record at the ${r.last.season} vote: if those votes were all cast against, support among all other votes cast was at least ${pct(floor, 0)}.</p>` : ""}
      ${fam.length ? `<h4>Fund families on this ask (Form N-PX)</h4><ul class="steps tight pt-fam">${fam.map(([f, v]) => `<li>${esc(f)}: FOR on ${v.for} of ${v.n} proposals</li>`).join("")}</ul><p class="ticker"><span class="unverified">Matched automatically; ${unrev} of ${all} not yet reviewed by a person.</span></p>` : `<p class="ticker">No Form N-PX record on this ask in this dataset.</p>`}
      <p class="ticker">Proxy advisors: ${esc(F.proxy_advisors)}</p>
      <details><summary>How the rule did on past votes</summary>
        <p>Each vote in ${bt.seasons.join(" and ")} was predicted from earlier seasons only, with its band built from earlier seasons' errors only. Middle band: ${bt.inside_80} of ${bt.cases} inside (refiles ${bt.by_kind.refile.inside} of ${bt.by_kind.refile.n}; first filings ${bt.by_kind.first.inside} of ${bt.by_kind.first.n}). Full spread: ${bt.inside_full} of ${bt.cases}. Median error ${bt.median_abs_error_points} points.</p>
        <p>Largest misses:</p><ul class="steps tight">${bt.worst_misses.map((m) => `<li>${esc(m.company)} ${esc(m.season)} (${esc(m.kind === "refile" ? "refile" : "first filing")}): band ${pct(m.range[0], 0)} to ${pct(m.range[1], 0)}, actual ${pct(m.actual)}</li>`).join("")}</ul>
      </details>
      ${logHtml(co, ask, coName)}</section>`;
  }

  // ---------- Logged forecasts (this browser only) ----------
  function scored(f) {
    const v = (F.by_season || {})[`${f.co}|${f.ask}|${f.season}`];
    const last = F.latest[`${f.co}|${f.ask}`];
    if (!v) return { text: last && last.season > f.season ? "no vote on this ask here in that season" : "awaiting that season's vote result on this site" };
    const a = v.support;
    const inside = a >= f.lo && a <= f.hi;
    const miss = inside ? 0 : Math.min(Math.abs(a - f.lo), Math.abs(a - f.hi));
    return { text: `result ${pct(a)}: ${inside ? "inside your range" : `outside your range by ${(Math.round(miss * 10) / 10).toFixed(1)} points`}` };
  }
  function logHtml(co, ask, coName) {
    const all = store.get();
    const y = +today().slice(0, 4), next = y + (+today().slice(5, 7) >= 7 ? 1 : 0);
    return `<h4>Log your own forecast</h4>
      <p class="ticker">Enter the range you expect for this ask at ${esc(coName)} in a coming season. It is kept in this browser only, nothing is sent anywhere, and it is scored here once that season's vote result is on this site.</p>
      <form class="pt-log" data-co="${esc(co)}" data-ask="${esc(ask)}">
        <label>Season <input type="number" name="season" min="${next}" max="${next + 3}" value="${next}" required></label>
        <label>Low % <input type="number" name="lo" min="0" max="100" step="0.1" required></label>
        <label>High % <input type="number" name="hi" min="0" max="100" step="0.1" required></label>
        <button type="submit" class="chip">Log it</button> <span class="ticker pt-log-msg" role="status" tabindex="-1"></span>
      </form>
      ${all.length ? `<h4>Your logged forecasts (${all.length})</h4><ul class="steps tight pt-logged">${all.map((f, i) => `<li>${esc(f.coName || f.co)}, ${esc(f.askLabel || f.ask)}, ${esc(f.season)}: ${pct(f.lo)} to ${pct(f.hi)} <span class="ticker">logged ${esc(D(f.made))}; ${esc(scored(f).text)}</span> <button type="button" class="linklike pt-del" data-i="${i}" aria-label="Delete the forecast for ${esc(f.coName || f.co)}, ${esc(f.season)}">Delete</button></li>`).join("")}</ul>` : ""}`;
  }

  // ---------- Ask designer ----------
  // Levels from asking for information to requiring an operational change. The main request is the first listed
  // word or phrase after "request" (or after "resolved"); other levels the text mentions are listed too.
  const LEVELS = [
    { n: 1, label: "Disclosure request", words: ["report", "reports", "reported", "issue reports", "reporting", "disclose", "disclosing", "disclosure", "publish", "issue a report", "transparency report", "describe", "explain"] },
    { n: 2, label: "Assessment or policy", words: ["assess", "assessment", "audit", "due diligence", "evaluate", "conduct a", "adopt a policy", "adopt policies", "establish a framework", "set targets"] },
    { n: 3, label: "Board oversight or governance change", words: ["audit committee", "committee oversee", "board committee", "committee of the board", "new committee", "nominate a director", "director with", "amend the charter", "amend the bylaws", "amend its charter", "amend its bylaws", "create a committee", "create an ai committee", "board-level committee", "board oversight", "governance structure"] },
    { n: 4, label: "Operational mandate", words: ["cease", "stop", "halt", "suspend", "terminate", "prohibit", "discontinue", "phase out", "end the", "refrain", "shall not", "must not", "require that", "only use", "ban", "limit sales", "not sell"] },
  ];
  const rx = (w) => new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
  function level(text) {
    const t = ` ${String(text || "").toLowerCase()} `;
    const req = t.search(/\b(request(s|ed)?|ask(s|ed)?|urge(s|d)?)\b/);
    const anchor = req >= 0 ? req : Math.max(0, t.search(/\bresolved\b/));
    let main = null;
    const mentioned = [];
    LEVELS.forEach((L) => L.words.forEach((w) => {
      const m = rx(w).exec(t.slice(anchor));
      if (!m) return;
      if (!mentioned.some((x) => x.n === L.n)) mentioned.push({ n: L.n, label: L.label, word: w });
      // The earliest match is the main request; at the same place the longer phrase wins ("audit committee" over "audit").
      if (!main || m.index < main.at || (m.index === main.at && w.length > main.word.length)) main = { ...L, at: m.index, word: w };
    }));
    return main ? { ...main, mentioned: mentioned.filter((x) => x.n !== main.n).sort((a, b) => a.n - b.n) } : null;
  }
  function designerHtml(ask) {
    return `<section class="pl-card" aria-labelledby="pt-h-ask"><h3 id="pt-h-ask">Ask designer</h3>
      <p class="ticker">Paste or write a draft "resolved" clause. This places its main request from disclosure request to operational mandate and lists past proposals for comparison. It describes the wording; it does not judge the draft.</p>
      <label class="pt-ask-label" for="pt-ask-text">Draft resolved clause</label>
      <textarea id="pt-ask-text" rows="4" placeholder="Resolved: shareholders request that the board publish a report…"></textarea>
      <p><button type="button" class="chip" id="pt-ask-go" data-ask="${esc(ask)}">Place this wording</button></p>
      <div id="pt-ask-out" aria-live="polite"></div>
      <details><summary>The word rules used</summary><p class="ticker">The main request is the first of these words after "request". Past proposals are placed from their titles and this site's summaries, not their full resolved clauses.</p><ul class="steps tight">${LEVELS.map((L) => `<li><strong>${L.n}. ${esc(L.label)}</strong>: ${L.words.map(esc).join(", ")}</li>`).join("")}</ul></details></section>`;
  }
  function placeAsk(text, ask, proposals, askOf, critical) {
    if (!String(text).trim()) return `<p class="status-note">Write or paste a resolved clause first.</p>`;
    const L = level(text);
    const spec = `<ol class="pt-spectrum" aria-label="${L ? `Main request at level ${L.n} of 4: ${esc(L.label)}` : "No level matched"}">${LEVELS.map((x) => `<li class="${L && x.n === L.n ? "on" : ""}">${x.n}. ${esc(x.label)}</li>`).join("")}</ol>`;
    const words = new Set(String(text).toLowerCase().match(/[a-z]{5,}/g) || []);
    const comp = proposals.filter((p) => p.ask_id).map((p) => {
      const body = `${p.title} ${p.plain_summary || ""}`;
      const overlap = (body.toLowerCase().match(/[a-z]{5,}/g) || []).filter((w) => words.has(w)).length;
      return { p, lv: level(`request ${body}`), crit: critical.has(p.id), score: (p.ask_id === ask ? 5 : 0) + overlap };
    }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 8);
    const sameLevel = L ? comp.filter((x) => x.lv && x.lv.n === L.n && x.p.support_pct != null && !x.crit) : [];
    return `${spec}<p>${L ? `Main request reads as <strong>${esc(L.label.toLowerCase())}</strong>, from "${esc(L.word)}".${L.mentioned.length ? ` Also mentions: ${L.mentioned.map((m) => `${esc(m.label.toLowerCase())} ("${esc(m.word)}")`).join("; ")}.` : ""}` : "No rule matched: the wording does not use the listed words."}</p>
      ${comp.length ? `<h4>Past proposals for comparison</h4><ul class="steps tight">${comp.map(({ p, lv, crit }) => `<li><strong>${esc(p.company)} ${esc(p.year)}</strong>: ${esc(p.title)} <span class="ticker">${lv ? esc(lv.label.toLowerCase()) : "no level matched"}; ${esc(p.status)}${p.support_pct != null ? `, ${pct(p.support_pct)}` : ""}${crit ? "; filed by a filer critical of ESG" : ""}; ${esc((askOf(p.ask_id) || {}).label || "")}</span>${link(p.results_url || p.proxy_url || p.source_url, p.results_url ? "results" : "source")}</li>`).join("")}</ul>
        ${sameLevel.length ? `<p class="ticker">Of these, ${sameLevel.length} at the same level went to a vote (leaving out filers critical of ESG)${sameLevel.length === 1 ? `, with ${pct(sameLevel[0].p.support_pct)} support` : `, with support from ${pct(Math.min(...sameLevel.map((x) => x.p.support_pct)))} to ${pct(Math.max(...sameLevel.map((x) => x.p.support_pct)))}`}.</p>` : ""}
        ${comp.filter((x) => x.crit).length > comp.length / 2 ? `<p class="ticker">Most of these came from filers critical of ESG, so few comparable proposals remain.</p>` : ""}` : `<p class="status-note">No past proposal shares this ask or these words.</p>`}`;
  }

  async function fill(root, ctx) {
    const slots = [...(root || document).querySelectorAll(".pltools-slot")];
    if (!slots.length) return;
    const d = await load();
    slots.forEach((s) => {
      if (!d) { s.innerHTML = `<p class="status-note">The support range did not load.</p>`; return; }
      s.innerHTML = s.dataset.kind === "designer" ? designerHtml(s.dataset.ask) : forecastHtml(s.dataset.co, s.dataset.ask, s.dataset.name, s.dataset.upcoming);
    });
    wire(root || document, ctx);
  }
  function wire(r, ctx) {
    const form = r.querySelector(".pt-log");
    if (form) form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      const lo = +f.lo, hi = +f.hi, msg = form.querySelector(".pt-log-msg");
      if (!(hi >= lo)) { msg.textContent = "The high figure must be at least the low one."; msg.focus(); return; }
      const all = store.get();
      all.push({ co: form.dataset.co, ask: form.dataset.ask, coName: ctx.coName, askLabel: ctx.askLabel, season: +f.season, lo, hi, made: today() });
      store.set(all);
      redrawForecast(r, ctx, "Logged in this browser.");
    });
    r.querySelectorAll(".pt-del").forEach((b) => b.addEventListener("click", () => {
      const all = store.get();
      all.splice(+b.dataset.i, 1);
      store.set(all);
      redrawForecast(r, ctx, "Deleted.");
    }));
    const go = r.querySelector("#pt-ask-go");
    if (go && !go.dataset.wired) {
      go.dataset.wired = "1";
      go.addEventListener("click", () => {
        r.querySelector("#pt-ask-out").innerHTML = placeAsk(r.querySelector("#pt-ask-text").value, go.dataset.ask, ctx.proposals, ctx.askOf, ctx.critical || new Set());
      });
    }
  }
  // Redraw only the support card (the ask designer keeps its draft), then return focus to its status line.
  function redrawForecast(r, ctx, message) {
    const s = r.querySelector('.pltools-slot[data-kind="forecast"]') || r.closest('.pltools-slot[data-kind="forecast"]');
    if (!s) return;
    s.innerHTML = forecastHtml(s.dataset.co, s.dataset.ask, s.dataset.name, s.dataset.upcoming);
    wire(s, ctx);
    const m = s.querySelector(".pt-log-msg");
    if (m) { m.textContent = message; m.focus(); }
  }
  window.PLANNER_TOOLS = { fill, load, level };
})();

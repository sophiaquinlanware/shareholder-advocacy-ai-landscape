// Plan and test › Prediction board: forecasts of outcomes (what will happen), never statements of support.
// Data: data/forecast-questions.json (built by scripts/build_questions.py from the site's records and from the forecasts
// people chose to post through the GitHub form, data/predictions.json).
// Design, following the forecasting literature (Wolfers and Zitzewitz, "Prediction Markets in Theory and Practice", 2006):
//   - a proper scoring rule (Brier) rewards honest probabilities, in place of money;
//   - the site's own base rate is shown first; crowd figures are always public (owner, 2026-11-26: "votes for the
//     prediction market should always be open to the public"), with a tip to set your own figure before reading them;
//   - one forecast per person per question counts (the latest), group medians, and every group weighted the same,
//     so neither a crowd from one group nor one loud forecaster sets the figure;
//   - the crowd is scored against the site's base rate, as markets were scored against polls and surveys;
//   - conditional pairs ("if the SEC adopts..., then...") show what forecasters expect a rule to change.
(() => {
  const REPO = "sophiaquinlanware/shareholder-advocacy-ai-landscape";
  const STORE = "board-mine-v1";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const pct = (p) => (p == null ? "none" : `${Math.round(p * 100)}%`);
  const day = (d) => (window.DATES ? window.DATES.long(d) : d);
  const mine = {
    get() { try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch (e) { return {}; } },
    set(v) { try { localStorage.setItem(STORE, JSON.stringify(v)); } catch (e) { /* storage blocked: kept for this visit only */ } },
  };
  let el, Q, M;
  const SUGGEST = (co = "", ask = "") =>
    `https://github.com/${REPO}/issues/new?template=suggest-question.yml&title=${encodeURIComponent(`Board suggestion: ${co || ""}`.trim())}${co ? `&company=${encodeURIComponent(co)}` : ""}${ask ? `&ask=${encodeURIComponent(ask)}` : ""}`;
  window.BOARD_SUGGEST = SUGGEST;
  let view = "likely";
  // How likely each question looks now: the crowd forecast when there is one, else the site's starting estimate.
  // With neither, your own forecast places it, so your questions rank among the rest.
  const likely = (q) => (q.crowd && q.crowd.n ? q.crowd.equal_weight : q.base && q.base.p != null ? q.base.p : M && M[q.id] ? M[q.id].p : null);
  const INTRO = {
    gap: "Companies under US proxy rules where this site records no AI proposal in the latest season (leaving out filers critical of ESG), with a filing deadline still open. Filings withdrawn privately never reach a proxy statement, so some may be missing. Each question closes the day before the deadline; forecasts rest on public information only.",
    Engagements: "Outcomes of named engagements, added by the site's maintainer with their sources. Green figures are scenarios written by this site from a seat in Take a seat: not forecasts, not counted, and not the view of the organization named.",
    "If, then": "Pairs of questions: the same outcome under each answer to another question (the SEC rule, or an escalation). Only the branch whose condition happens is scored; the other is void. The gap between the two shows how much forecasters expect the first outcome to change the second. It measures expectations, not cause.",
  };

  const introFor = (s) => (s.startsWith("Companies with no AI proposal") ? INTRO.gap : INTRO[s]);
  // Who sees what: why each group is invited. The board is more accurate when the people closest to each part of
  // the outcome take part, and it shows where groups disagree, which is itself information.
  const WHO = [
    ["Investors and asset managers", "read proxy statements, voting records and filing histories closely, and know how stewardship teams weigh published policies."],
    ["Asset owners and pensions", "set the policies their managers vote under, and follow published pass-through voting programs and their policy options."],
    ["Companies (governance, legal, investor relations)", "know how boards have answered past proposals in public filings. Declare a stake on questions about your own company."],
    ["Proxy advisors and ESG data providers", "track published vote patterns across many companies. Leave out anything from unpublished recommendations."],
    ["Policymakers and regulators", "follow rulemaking timelines and the public comment record. Leave out anything not yet public."],
    ["Academics and researchers", "bring base rates and models from past seasons."],
    ["Civil society and advocacy groups", "follow public campaigns and exempt solicitations across companies."],
    ["Employees of AI companies", "follow companies' published AI governance commitments and reports. Public information only; declare a stake on questions about your employer."],
    ["Journalists", "follow filings and disputes as they happen."],
    ["Retail shareholders", "vote their own shares, and some choose how fund shares are voted through pass-through voting programs."],
    ["Anyone else", "adds an outside view; the group \"Other\" counts the same as any other."],
  ];

  const today = () => new Date().toISOString().slice(0, 10);
  const isClosed = (q) => q.closes < today();
  function crowdBlock(q, p) {
    const c = q.crowd || {};
    const groups = Object.entries(c.groups || {}).sort((a, b) => b[1].median - a[1].median);
    const spread = groups.length > 1 ? groups[0][1].median - groups[groups.length - 1][1].median : 0;
    return `<div class="bd-crowd">
      ${c.n ? `<p><span class="bd-label">Crowd forecast (n = ${c.n})</span> <strong>${pct(c.equal_weight)}</strong>, ${c.headline === "equal_weight" ? `${c.weighted_groups} groups of 3 or more weighted the same; median of everyone ${pct(c.all_median)}` : "the median of everyone (groups are weighted once two have 3 or more forecasters)"}.${p != null ? ` Yours: ${pct(p)}.` : ""}</p>
        <ul class="bd-groups">${groups.map(([g, v]) => `<li><span class="bd-g">${esc(g)}</span><span class="bd-bar" aria-hidden="true"><i data-w="${Math.round(v.median * 100)}"></i></span><span>${pct(v.median)} <span class="note">(${v.n})</span></span></li>`).join("")}</ul>
        <p class="note">A forecast of the result by self-selected visitors, not a poll of shareholders and not a sign of how anyone will vote.</p>
        ${spread >= 0.25 ? `<p class="note">Groups differ by ${Math.round(spread * 100)} points here: worth reading why.</p>` : ""}`
        : `<p><span class="bd-label">Crowd forecast (n = 0)</span> No one has posted a forecast on this question yet.</p>`}
      ${c.stake_left_out ? `<p class="note">${c.stake_left_out} forecast${c.stake_left_out === 1 ? "" : "s"} from people who declared a stake in this question ${c.stake_left_out === 1 ? "is" : "are"} left out of these figures.</p>` : ""}
    </div>`;
  }

  // The last group and stake answer are remembered, so later posts start from them.
  const prefs = {
    get() { try { return JSON.parse(localStorage.getItem("board-post-v1") || "{}"); } catch (e) { return {}; } },
    set(v) { try { localStorage.setItem("board-post-v1", JSON.stringify(v)); } catch (e) { /* storage blocked */ } },
  };
  const GROUP_OPTS = () => { const g0 = prefs.get().group; return (Q.groups || []).map((g) => `<option${g === g0 ? " selected" : ""}>${esc(g)}</option>`).join(""); };
  const STAKE = () => (prefs.get().stake ? " checked" : "");
  const postFields = () => `
      <label>Your group <select name="group" required><option value="">Choose…</option>${GROUP_OPTS()}</select></label>
      <label class="bd-check"><input type="checkbox" name="stake"${STAKE()}> I or my organization have a stake (filed or plan to file at a company this covers, or are that company or advise it)</label>
      <label class="bd-check"><input type="checkbox" name="confirm" required> This is my own forecast of the outcome, from public information. It is not a statement of how I or my organization will vote, not a request for anyone to vote, file or act, and not a commitment to act.</label>`;
  function postForm(q, m) {
    const issue = `https://github.com/${REPO}/issues/new?template=forecast.yml&title=${encodeURIComponent(`Forecast: ${q.id}`)}&question=${encodeURIComponent(q.id)}&probability=${Math.round(m.p * 100)}`;
    return `<form class="bd-postform" data-q="${esc(q.id)}">
${postFields()}
      <button type="submit" class="bd-btn">Post ${pct(m.p)}</button> <a class="note" href="${issue}" rel="noopener" target="_blank">or post through GitHub<span class="visually-hidden"> (opens in a new tab)</span></a>
      <p class="note bd-post-msg" role="status"></p></form>`;
  }
  function suggestForm(id, co, ask) {
    return `<form class="bd-suggestform" id="${id}">
      <label>Company <input name="company" required maxlength="120" value="${esc(co)}"></label>
      <label>The ask (what the proposal asks the company to do) <input name="ask" required minlength="3" maxlength="300" value="${esc(ask)}"></label>
      <label>Where does it stand? <select name="standing" required><option value="filed, in a proxy statement">Filed and in a proxy statement</option><option value="filed, not yet in a proxy statement">Filed, not yet in a proxy statement</option><option value="not filed">Not filed (an outcome to forecast)</option></select></label>
      <label>The question people would forecast <textarea name="question" required minlength="10" maxlength="600" rows="2" placeholder="One yes-or-no outcome with a date, for example: at least 20% support at the 2027 annual meeting"></textarea></label>
      <label>Public source (needed for a filed proposal) <input name="source_url" type="url" placeholder="https://www.sec.gov/…"></label>
      <label class="bd-check"><input type="checkbox" name="stake"> I or my organization have a stake in it (filed, plan to file, or are the company or advise it)</label>
      <label class="bd-check"><input type="checkbox" name="confirm" required> This is from public information, and it is a question about an outcome, not a request for anyone to vote, file or act a certain way.</label>
      <button type="submit" class="bd-btn">Send the suggestion</button> <span class="note">The site's maintainer checks the source before it goes on the board.</span>
      <p class="note bd-post-msg" role="status"></p></form>`;
  }
  window.BOARD_SUGGEST_FORM = suggestForm;

  function card(q) {
    const m = M[q.id];
    const b = q.base || {};
    const start = m ? m.p : b.p != null ? b.p : 0.5;
    const done = q.resolved != null;
    const shut = !done && isClosed(q);
    const issue = (p) => `https://github.com/${REPO}/issues/new?template=forecast.yml&labels=forecast&title=${encodeURIComponent(`Forecast: ${q.id}`)}&question=${encodeURIComponent(q.id)}&probability=${Math.round(p * 100)}`;
    return `<article class="bd-card${m ? " bd-mine" : ""}${m && m.posted ? " bd-posted" : ""}" id="bd-${esc(q.id)}" data-q="${esc(q.id)}" aria-labelledby="bd-h-${esc(q.id)}">
      ${m ? `<p class="bd-pill bd-pill-top">${m.posted ? `Your posted forecast ${pct(m.posted)}` : `Your forecast ${pct(m.p)}, not yet posted`}</p>` : ""}
      ${m && q.resolved == null ? `<p class="note bd-ifscore">Your score when it resolves: ${((1 - m.p) ** 2).toFixed(2)} if Yes, ${(m.p ** 2).toFixed(2)} if No (Brier score: 0 is perfect, 0.25 is what always saying 50% earns).</p>` : ""}
      <h4 id="bd-h-${esc(q.id)}">${esc(q.title)}</h4>
      ${q.context ? `<p class="note">${esc(q.context)} ${(q.context_sources || []).map((u, i) => `<a href="${esc(u)}" rel="noopener" target="_blank">Source ${i + 1}<span class="visually-hidden"> (opens in a new tab)</span></a>`).join(" ")}</p>` : ""}
      <p class="note">Forecasts accepted through ${esc(day(q.closes))} (UTC)${q.resolves_by ? `; resolves by ${esc(day(q.resolves_by))}` : ""}. ${esc(q.resolves)}${q.kind === "season" || q.kind === "conditional" || q.kind === "coverage_gap" ? ` <a href="#feed">All AI proposals on this site</a>` : ""}${q.source_url ? ` <a href="${esc(q.source_url)}" rel="noopener" target="_blank">Source<span class="visually-hidden"> (opens in a new tab)</span></a>` : ""}</p>
      ${(q.scenarios || []).map((x) => `<p class="bd-scen"><span class="bd-label">Scenario, ${esc(x.seat)}</span> <strong>${pct(x.p)}</strong> <span class="note">${esc(x.why)} Written by this site; not counted, and not the organization's view.</span></p>`).join("")}
      <p class="bd-base"><span class="bd-label">This site's starting estimate</span> <strong>${b.p != null ? pct(b.p) : "no base rate yet"}</strong></p>
      <p class="note">${b.start ? `${esc(b.start)} ` : ""}${esc(b.how)}${b.source_url ? ` <a href="${esc(b.source_url)}" rel="noopener" target="_blank">Data<span class="visually-hidden"> (opens in a new tab)</span></a>` : ""}</p>
      ${done ? `<p class="bd-out"><strong>${q.resolved === "void" ? "Void: not scored" : `Resolved: ${q.resolved ? "Yes" : "No"}`}</strong>${q.resolution_source ? ` <a href="${esc(q.resolution_source)}" rel="noopener" target="_blank">Source</a>` : ""}${m && q.resolved !== "void" ? `. Your score ${((m.p - q.resolved) ** 2).toFixed(3)} (Brier; 0 is perfect, 0.25 is a coin flip)` : ""}</p>${crowdBlock(q, m && m.p)}` : shut ? `<p class="bd-out"><strong>Forecasting closed; awaiting the result.</strong>${m ? ` Your forecast: ${pct(m.p)}.` : ""}</p>${crowdBlock(q, m && m.p)}` : `
      <div class="bd-input">
        <label id="bd-l-${esc(q.id)}" for="bd-r-${esc(q.id)}">Your probability that the answer is Yes</label>
        <div class="bd-slide"><span aria-hidden="true">No</span><input type="range" id="bd-r-${esc(q.id)}" min="1" max="99" step="1" value="${Math.round(start * 100)}" aria-valuetext="${Math.round(start * 100)} percent" aria-labelledby="bd-l-${esc(q.id)} bd-h-${esc(q.id)}" ${m && (start < 0.1 || start > 0.9) ? `aria-describedby="bd-w-${esc(q.id)}"` : ""}><span aria-hidden="true">Yes</span>
        <output id="bd-o-${esc(q.id)}" for="bd-r-${esc(q.id)}">${Math.round(start * 100)}%</output></div>
        <p class="note bd-warn" id="bd-w-${esc(q.id)}" ${m && (start < 0.1 || start > 0.9) ? "" : "hidden"}>Below 10% or above 90% means you are nearly sure. Under Brier scoring a confident miss costs the most: 95% on something that doesn't happen scores 0.90.</p>
        <div class="bd-actions">
          <button type="button" class="bd-save" ${m ? "" : "disabled"}>${m ? "Update my forecast" : "Save my forecast"}</button>
          ${m && m.posted ? `<span class="bd-pill">Posted ${pct(m.posted)}</span>` : ""}
          ${m && m.posted !== m.p ? `<details class="bd-post"><summary class="bd-btn">Post my forecast publicly (${pct(m.p)})</summary>${postForm(q, m)}</details>` : !m ? `<span class="note">Move the slider to your own figure first (to keep the site's figure, move it away and back). Tip: set it before reading the crowd below, so the crowd doesn't pull your estimate.</span>` : ""}
        </div>
        ${m && m.posted !== m.p ? `<p class="note">Saved in this browser ${esc(day(m.made))}${m.posted ? `; your posted figure is ${pct(m.posted)}` : ", not yet public"}. Posting makes it public under your chosen name; the latest one you post counts.</p>` : ""}
      </div>
      ${crowdBlock(q, m && m.p)}`}
    </article>`;
  }

  function mineHtml() {
    const mineQs = Q.questions.filter((q) => M[q.id]);
    const seats = [...new Set(Q.questions.flatMap((q) => (q.scenarios || []).map((x) => x.seat)))];
    const status = (q) => (q.resolved === "void" ? "void" : q.resolved != null ? `resolved ${q.resolved ? "Yes" : "No"}, your score ${((M[q.id].p - q.resolved) ** 2).toFixed(3)}` : isClosed(q) ? "closed, awaiting the result" : `open until ${day(q.closes)}`);
    return `<section class="pl-card bd-minebox" aria-labelledby="bd-h-mine">
      <h3 id="bd-h-mine">Your forecasts</h3>
      ${mineQs.length ? `<ul class="bd-minelist">${mineQs.map((q) => `<li><button type="button" class="linklike" data-jump="bd-${esc(q.id)}">${esc(q.title)}</button> <span class="bd-pill">Yours ${pct(M[q.id].p)}</span>${M[q.id].posted ? ` <span class="note">posted ${pct(M[q.id].posted)}</span>` : ` <span class="note">not posted</span>`} <span class="note">Crowd ${q.crowd && q.crowd.n ? `${pct(q.crowd.equal_weight)} (n = ${q.crowd.n})` : "none yet"}; ${esc(status(q))}.</span></li>`).join("")}</ul>
        <p class="note">Kept in this browser. They glow wherever they appear below; post one to make it public.</p>
        ${(() => { const un = mineQs.filter((q) => q.resolved == null && !isClosed(q) && M[q.id].posted !== M[q.id].p); return un.length ? `<details class="bd-post"><summary class="bd-btn">Post all ${un.length} not yet posted</summary><form class="bd-postall">${postFields()}<button type="submit" class="bd-btn">Post ${un.length} forecast${un.length === 1 ? "" : "s"}</button><p class="note bd-post-msg" role="status"></p></form></details>` : ""; })()}`
        : `<p class="note">None yet. Forecasts you save appear here and glow in the list below, so you can check on them easily.</p>`}
      ${seats.map((st) => `<p><button type="button" class="chip" data-seat="${esc(st)}">Try the ${esc(st)} figures as your own</button> <span class="note">Copies this site's scenario figures for that seat into your forecasts in this browser, to adjust and post if you agree. Forecasts you already saved are kept. Nothing is posted.</span></p>`).join("")}
      <p class="note bd-seat-msg"></p>
    </section>`;
  }

  function draw() {
    M = mine.get();
    const qs = Q.questions;
    const open = qs.filter((q) => q.resolved == null);
    const byCondition = (list) => {
      const out = {};
      for (const q of list) {
        if (!out[q.condition.question]) out[q.condition.question] = [];
        out[q.condition.question].push(q);
      }
      return Object.values(out);
    };
    const pairs = byCondition(qs.filter((x) => x.kind === "conditional"));
    const gapText = pairs.filter((ps) => ps.length === 2 && ps.every((q) => q.crowd && q.crowd.n))
      .map((ps) => ` Crowd now on "${esc(ps.find((q) => q.condition.if === 1).title.split(":")[0].replace(/^If /, "if "))}": ${Math.round((ps.find((q) => q.condition.if === 1).crowd.equal_weight - ps.find((q) => q.condition.if === 0).crowd.equal_weight) * 100)} points higher than if not.`).join("");
    const shut = qs.filter((q) => q.resolved != null);
    const sections = [...new Set(open.map((q) => q.section))];
    const names = Q.company_names || {};
    const byCo = [...new Set(open.filter((q) => q.company).map((q) => q.company))];
    const grid = (list) =>
      list.filter((q) => q.kind !== "conditional").map(card).join("") +
      byCondition(list.filter((q) => q.kind === "conditional")).map((ps) => `<div class="bd-pair">${ps.map(card).join("")}</div>`).join("");
    const ranked = [...open].sort((a, b) => (likely(b) ?? -1) - (likely(a) ?? -1));
    const groupsHtml = view === "likely"
      ? `<p class="note">Ranked by how likely each question looks now: the crowd forecast where there is one, otherwise this site's starting estimate, otherwise your own forecast; questions with none of these come last. Your forecasts glow.</p>${ranked.map(card).join("")}`
      : view === "company"
      ? byCo.map((t) => `<h3>${esc(names[t] || t)}</h3>${open.filter((q) => q.company === t).map(card).join("")}`).join("") +
        `<h3>Across companies</h3>${grid(open.filter((q) => !q.company))}`
      : sections.map((s) => `<h3>${esc(s)}</h3>${introFor(s) ? `<p class="note">${introFor(s)}${s === "If, then" ? gapText : ""}</p>` : ""}${grid(open.filter((q) => q.section === s))}`).join("");
    const vs = Q.crowd_vs_site || {};
    const lb = Q.leaderboard || [];
    el.innerHTML = `
      <h2>Prediction board</h2>
      <p class="visually-hidden" role="status" id="bd-live"></p>
      <p class="lede">Forecast what will happen in AI shareholder engagement, not what you want to happen. Give each question a probability; scoring rewards the forecasts that turn out closest, so an honest figure scores best.</p>
      <section class="pl-card bd-take" aria-labelledby="bd-h-take">
        <h3 id="bd-h-take">How to take part</h3>
        <div class="bd-ways">
          <div class="bd-way">
            <h4><span class="bd-num" aria-hidden="true">1</span>Forecast a question</h4>
            <ol>
              <li>Pick a question below and read the site's starting estimate.</li>
              <li>Move the slider to your probability and press <strong>Save my forecast</strong>. It stays in this browser.</li>
              <li>Press <strong>Post my forecast publicly</strong>, choose your group and post. It shows on the board straight away, and is scored when the question resolves.</li>
            </ol>
            <button type="button" class="bd-btn" data-jump="bd-questions">Go to the questions ↓</button>
          </div>
          <div class="bd-way">
            <h4><span class="bd-num" aria-hidden="true">2</span>Put a proposal on the board</h4>
            <p>Suggest a shareholder proposal, filed or planned, for everyone to forecast: for example whether it will reach a level of support or end in a company commitment. The site's maintainer checks each suggestion against its public source and adds it as a question.</p>
            <details class="bd-suggest"><summary class="bd-btn">Suggest a proposal</summary>${suggestForm("bd-sg", "", "")}</details>
            <p class="note">From Plan an engagement, "Put this plan on the Prediction board" fills in the company and ask for you.</p>
          </div>
        </div>
        <div class="bd-acct" id="bd-acct"></div>
        <p class="note">No account yet? Signing in with your email creates one. You can also post through GitHub instead: <a href="${SUGGEST()}" rel="noopener" target="_blank">suggestion form</a>; each question's post button has a GitHub link too.</p>
      </section>
      <div class="pl-card bd-rules">
        <p><strong>Outcomes, not support.</strong> A forecast here is your estimate of what will happen. It is not a statement of how you or your organization will vote, not a request for anyone to vote a certain way, and not a commitment to act. Nothing on this board gathers votes, pledges or sign-ons. No money is involved and no prize is offered.</p>
        <p>Use public information only: don't post anything you learned in confidence, in a private engagement dialogue or from inside a company.</p>
        <p>If you or your organization filed or plan to file at the company a question is about, are that company or advise it, say so on the form (for a question across companies, any company it covers; for a Rules question, working at or advising the SEC): your forecast is kept but left out of the crowd figure. Don't forecast your own live negotiations, and don't use the board to urge anyone to vote, file or act a certain way.</p>
      </div>
      ${mineHtml()}
      <h3 id="bd-questions" class="visually-hidden">Questions</h3>
      <div class="bd-view" role="group" aria-label="Group questions">
        <span class="bd-label">Show</span>
        <button type="button" data-view="likely" aria-pressed="${view === "likely"}">Most likely first</button>
        <button type="button" data-view="topic" aria-pressed="${view === "topic"}">By topic</button>
        <button type="button" data-view="company" aria-pressed="${view === "company"}">By company</button>
      </div>
      ${groupsHtml}
      <h3>Resolved</h3>
      ${shut.length ? shut.map(card).join("") : `<p class="status-note">No question has resolved yet.${(() => { const n = open.filter((q) => !isClosed(q)).sort((x, y) => (x.closes > y.closes ? 1 : -1))[0]; return n ? ` Next to close for forecasts: ${esc(day(n.closes))}.` : ""; })()}</p>`}
      ${vs.questions || lb.length ? `<h3>Scores</h3>
      <p>${vs.questions ? `On ${vs.questions} resolved question${vs.questions === 1 ? "" : "s"}, the crowd scored ${vs.crowd_brier} and this site's starting estimates ${vs.site_brier} (Brier; lower is better).` : "When questions close, this compares the crowd with the site's starting estimates (Brier score; lower is better)."}</p>
      ${lb.length ? `<table class="bd-lb"><caption>Forecasters with 3 or more resolved forecasts, ranked by skill: the site's Brier score on the same questions minus theirs (above 0 beats the site)</caption><thead><tr><th scope="col">GitHub name</th><th scope="col">Resolved</th><th scope="col">Brier score</th><th scope="col">Skill</th></tr></thead><tbody>${lb.map((r) => `<tr><td>${esc(r.handle)}</td><td>${r.resolved}</td><td>${r.brier}</td><td>${r.skill ?? "none"}</td></tr>`).join("")}</tbody></table>` : `<p class="note">A ranking of forecasters appears once anyone has 3 or more resolved forecasts.</p>`}` : ""}
      <details class="bd-how"><summary>Who should forecast here</summary>
      <p>The board works best when people close to each part of an outcome take part. Each forecaster picks a group when posting (groups are self-declared, not checked). The overall figure counts every group of 3 or more forecasters the same, so a large turnout from one group weighs no more than any other group.</p>
      <ul class="bd-who">${WHO.map(([g, why]) => `<li><strong>${esc(g)}</strong> ${esc(why)}</li>`).join("")}</ul>
      </details>
      <details class="bd-how"><summary>How the board works</summary>
        <dl>
          <div><dt>Starting estimates</dt><dd>For a coming vote: how often past votes of the same kind reached the benchmark (the latest recorded vote there, or the ask's median elsewhere), from the same records as the support range in Plan an engagement. For a season question: how many of the recorded seasons, ${esc((Q.questions.find((q) => q.kind === "season") || {}).base?.how?.match(/\d{4} to \d{4}/)?.[0] || "")}, had the outcome, smoothed so that four seasons don't give 0% or 100%. Rules questions have no estimate from this site's data.</dd></div>
          <div><dt>Counting</dt><dd>Each GitHub account's latest forecast on a question counts; earlier ones are kept but replaced. Group figures are medians, so a few extreme forecasts move them little. The overall figure is the average of the group medians once at least two groups have 3 or more forecasters (smaller groups are pooled, and the pool counts once it reaches 3); until then it is the median of everyone. Forecasts made after an outcome became known are not counted. Forecasts from people who declared a stake are left out.</dd></div>
          <div><dt>Scoring</dt><dd>When questions resolve, a Scores section compares the crowd with this site's starting estimates and ranks forecasters with 3 or more resolved forecasts by skill. Brier score: the square of the gap between your probability and what happened (1 for Yes, 0 for No). 0 is perfect; always saying 50% scores 0.25. A question voids if its proposal is withdrawn or excluded before the vote, or if a conditional question's condition does not happen.</dd></div>
          <div><dt>Resolution</dt><dd>Vote questions resolve from the 8-K results this site records; season questions from this site's records of meetings January 1 to June 30, 30 days after the window ends (forecasts close December 31, before the season's meetings); coverage-gap questions from the next proxy statement; the SEC question by hand from the SEC's announcement. Results decided by hand are kept, with their source, in data/forecast-resolutions.json.</dd></div>
          <div><dt>Posting</dt><dd>The GitHub form opens an issue in this site's public repository; a GitHub Action checks it, adds it to data/predictions.json and closes the issue. Your GitHub name, group and figure become public. To change a forecast, post again: the latest counts. The issue is then locked, so the board's record is the forecast, not a discussion.</dd></div>
          <div><dt>Forecasts that shape the outcome</dt><dd>Filers, companies and their advisers can affect what they forecast. Declaring a stake keeps their forecasts out of the crowd figure, and the public-information rule keeps private dialogue off the board.</dd></div>
          <div><dt>Why this design</dt><dd>Studies of prediction markets, mostly with money at stake, find that pooled forecasts usually beat polls and expert surveys, respond quickly to news, and resist manipulation; they also find people overrate unlikely events (Justin Wolfers and Eric Zitzewitz, "Prediction Markets in Theory and Practice", 2006, written for The New Palgrave Dictionary of Economics). Without money at stake, this board uses a scoring rule to reward honest figures, and medians and equal group weights to limit any one group's sway. Several accounts can still be run by one person, so read the count beside every figure.</dd></div>
        </dl>
      </details>`;
    bars(el);
    if (window.BOARD_LIVE) window.BOARD_LIVE.mountAccount(el.querySelector("#bd-acct"));
  }

  function bars(root) {
    for (const i of root.querySelectorAll(".bd-bar i[data-w]")) i.style.width = `${i.dataset.w}%`;
  }

  // Posting a forecast or a suggestion from the page (board-live.js); the sign-in box comes first if needed.
  async function needSignIn(form) {
    const live = window.BOARD_LIVE;
    const msg = form.querySelector(".bd-post-msg");
    if (!live) { msg.textContent = "Posting from the site isn't available right now; use the GitHub link."; return true; }
    await live.init();
    const st = live.state();
    if (!st.signedIn || !st.name) {
      msg.textContent = !st.signedIn ? "Sign in first: enter your email in the box under How to take part." : "Choose your display name first, in the box under How to take part.";
      const acct = el.querySelector("#bd-acct");
      if (acct) acct.scrollIntoView({ block: "center" });
      return true;
    }
    return false;
  }
  async function liveCrowd() {
    // Live crowd figures: forecasts posted on the site (Supabase) and through GitHub (data/predictions.json),
    // with the same rules as scripts/build_questions.py.
    const live = window.BOARD_LIVE;
    if (!live) return;
    let site = [], gh = [];
    try { site = await live.forecasts(); } catch (e) { return; }
    try { gh = ((await fetch("data/predictions.json").then((r) => r.json())).forecasts || []); } catch (e) { /* none */ }
    const rows = [
      ...gh.map((f) => ({ q: f.question, who: `gh:${f.handle}`, p: f.p, g: f.group, stake: !!f.filer, made: f.made })),
      ...site.map((f) => ({ q: f.question, who: `site:${f.display_name}`, p: +f.p, g: f.stakeholder_group, stake: !!f.stake, made: f.made })),
    ].sort((a, b) => String(a.made).localeCompare(String(b.made)));
    const latest = new Map();
    for (const r of rows) latest.set(`${r.q}|${r.who}`, r);
    const med = (v) => { const s = [...v].sort((a, b) => a - b); const n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
    const MIN = Q.min_group || 3;
    for (const q of Q.questions) {
      const fsAll = [...latest.values()].filter((r) => r.q === q.id && (!q.closes || String(r.made).slice(0, 10) <= q.closes));
      const fs = fsAll.filter((r) => !r.stake);
      const groups = {};
      for (const r of fs) {
        if (!groups[r.g]) groups[r.g] = [];
        groups[r.g].push(r.p);
      }
      const weighted = Object.values(groups).filter((v) => v.length >= MIN);
      const small = Object.values(groups).filter((v) => v.length < MIN).flat();
      if (small.length >= MIN) weighted.push(small);
      const allm = fs.length ? Math.round(med(fs.map((r) => r.p)) * 1000) / 1000 : null;
      q.crowd = { n: fs.length, stake_left_out: fsAll.length - fs.length, weighted_groups: weighted.length,
        headline: weighted.length >= 2 ? "equal_weight" : "all_median",
        groups: Object.fromEntries(Object.entries(groups).map(([g, v]) => [g, { n: v.length, median: Math.round(med(v) * 1000) / 1000 }])),
        equal_weight: weighted.length >= 2 ? Math.round((weighted.map(med).reduce((a, b) => a + b, 0) / weighted.length) * 1000) / 1000 : allm,
        all_median: allm };
    }
  }

  function wire() {
    el.addEventListener("submit", async (e) => {
      const f = e.target;
      if (!f.matches(".bd-postform, .bd-suggestform, .bd-postall")) return;
      e.preventDefault();
      if (await needSignIn(f)) return;
      const msg = f.querySelector(".bd-post-msg");
      const fd = new FormData(f);
      try {
        if (f.matches(".bd-postform, .bd-postall")) prefs.set({ group: fd.get("group"), stake: fd.get("stake") === "on" });
        if (f.matches(".bd-postall")) {
          const all = mine.get();
          const ids = Q.questions.filter((q) => all[q.id] && q.resolved == null && !isClosed(q) && all[q.id].posted !== all[q.id].p).map((q) => q.id);
          let done = 0;
          for (const qid of ids) {
            msg.textContent = `Posting ${done + 1} of ${ids.length}…`;
            await window.BOARD_LIVE.forecast({ question: qid, p: all[qid].p, group: fd.get("group"), stake: fd.get("stake") === "on" });
            all[qid].posted = all[qid].p;
            mine.set(all);
            done += 1;
          }
          await liveCrowd();
          draw();
          const live = el.querySelector("#bd-live");
          if (live) live.textContent = `Posted ${done} forecast${done === 1 ? "" : "s"}.`;
          const box = el.querySelector(".bd-minebox");
          if (box) box.scrollIntoView({ block: "start" });
        } else if (f.matches(".bd-postform")) {
          const qid = f.dataset.q;
          const all = mine.get();
          await window.BOARD_LIVE.forecast({ question: qid, p: all[qid].p, group: fd.get("group"), stake: fd.get("stake") === "on" });
          all[qid].posted = all[qid].p;
          mine.set(all);
          await liveCrowd();
          draw();
          const live = el.querySelector("#bd-live");
          if (live) live.textContent = `Posted ${pct(all[qid].p)}.`;
          const card = el.querySelector(`#bd-${CSS.escape(qid)}`);
          if (card) card.scrollIntoView({ block: "center" });
        } else {
          await window.BOARD_LIVE.suggest({ company: fd.get("company"), ask: fd.get("ask"), standing: fd.get("standing"), question: fd.get("question"),
            source_url: fd.get("source_url") || null, stake: fd.get("stake") === "on" });
          f.reset();
          msg.textContent = "Thank you: your suggestion is in. The site's maintainer checks its source before adding it as a question.";
        }
      } catch (err) { msg.textContent = err.message; }
    });
    el.addEventListener("input", (e) => {
      if (!e.target.matches('input[type="range"]')) return;
      const v = +e.target.value;
      const c = e.target.closest(".bd-card");
      c.querySelector("output").textContent = `${v}%`;
      e.target.setAttribute("aria-valuetext", `${v} percent`);
      const warn = c.querySelector(".bd-warn");
      warn.hidden = !(v < 10 || v > 90);
      if (warn.hidden) e.target.removeAttribute("aria-describedby");
      else e.target.setAttribute("aria-describedby", warn.id);
      c.querySelector(".bd-save").disabled = false;
      const post = c.querySelector(".bd-post");
      if (post) post.hidden = true;
    });
    el.addEventListener("click", (e) => {
      // Posting through the GitHub form: mark it posted here (the bot adds it to the board within minutes).
      const gh = e.target.closest(".bd-postform a[href*='github.com']");
      if (gh) {
        const qid = gh.closest(".bd-postform").dataset.q;
        const all = mine.get();
        if (all[qid]) { all[qid].posted = all[qid].p; all[qid].via = "github"; mine.set(all); M = all; setTimeout(draw, 300); }
        return;
      }
      const seat = e.target.closest("[data-seat]");
      if (seat) {
        const all = mine.get();
        const made = new Date().toISOString().slice(0, 10);
        let copied = 0, kept = 0;
        for (const q of Q.questions) for (const x of q.scenarios || []) {
          if (x.seat !== seat.dataset.seat || q.resolved != null || isClosed(q)) continue;
          if (all[q.id]) kept += 1;
          else { all[q.id] = { p: x.p, made }; copied += 1; }
        }
        mine.set(all);
        draw();
        const msg = `Copied ${copied} of the ${seat.dataset.seat} figures into your forecasts${kept ? `; kept your own on ${kept} you had already saved` : ""}.`;
        const live = el.querySelector("#bd-live");
        if (live) live.textContent = msg;
        const note = el.querySelector(".bd-seat-msg");
        if (note) note.textContent = msg;
        el.querySelector("#bd-h-mine").scrollIntoView({ block: "start" });
        return;
      }
      const j = e.target.closest("[data-jump]");
      if (j) {
        const t = document.getElementById(j.dataset.jump);
        if (t) {
          t.scrollIntoView({ block: "start" });
          const f = t.matches("h3") ? el.querySelector(".bd-view button") : t.querySelector("input, button, h4");
          if (f) f.focus({ preventScroll: true });
        }
        return;
      }
      const v = e.target.closest("[data-view]");
      if (v) { view = v.dataset.view; draw(); el.querySelector(`[data-view="${view}"]`).focus(); return; }
      const b = e.target.closest(".bd-save");
      if (!b) return;
      const c = b.closest(".bd-card");
      const all = mine.get();
      all[c.dataset.q] = { p: +c.querySelector('input[type="range"]').value / 100, made: new Date().toISOString().slice(0, 10) };
      mine.set(all);
      M = all;
      const q = Q.questions.find((x) => x.id === c.dataset.q);
      const tmp = document.createElement("div");
      tmp.innerHTML = card(q);
      const nu = tmp.firstElementChild;
      c.replaceWith(nu);
      bars(nu);
      // Keep "Your forecasts" and the ranking current: in the ranked view redraw everything, otherwise just the panel.
      if (view === "likely") draw();
      else {
        const box = el.querySelector(".bd-minebox");
        const tmp2 = document.createElement("div");
        tmp2.innerHTML = mineHtml();
        if (box) box.replaceWith(tmp2.firstElementChild);
      }
      const fresh = el.querySelector(`#bd-${CSS.escape(q.id)} .bd-save`);
      if (fresh) fresh.focus();
      const live = el.querySelector("#bd-live");
      if (live) live.textContent = `Saved: ${pct(all[q.id].p)}. ${q.crowd && q.crowd.n ? `Crowd forecast ${pct(q.crowd.equal_weight)}.` : "No crowd forecasts yet."}`;
    });
  }

  window.renderBoard = function () {
    el = document.getElementById("tab-predict");
    if (!el) return;
    const go = async () => {
      if (el.hidden || el.dataset.built) return;
      el.dataset.built = "1";
      el.innerHTML = `<p class="status-note" role="status">Loading the board…</p>`;
      try { Q = await fetch("data/forecast-questions.json").then((r) => r.json()); } catch (e) { el.innerHTML = `<p class="status-note">The board's data did not load.</p>`; return; }
      draw();
      wire();
      if (window.BOARD_LIVE) liveCrowd().then(draw);
    };
    new MutationObserver(go).observe(el, { attributes: true, attributeFilter: ["hidden"] });
    go();
  };
})();

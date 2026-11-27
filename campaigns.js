// Engagement campaigns: one ask at one company as dated states (filed, exempt solicitations, voted, withdrawn with or
// without a commitment, excluded, on the ballot, delivery evidence), its milestone stage, engagement steps investors
// report at the company level, and the commitments ledger. Data: data/campaigns.json (scripts/build_campaigns.py),
// loaded the first time a company profile, the planner or "Results of private engagement" needs it.
//   window.CAMPAIGNS.fill(root)  fills every .campaigns-slot inside root (data-co = ticker, optional data-ask)
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const link = (url, label = "source") => (url ? ` <a class="src" href="${esc(url)}" target="_blank" rel="noopener">[${esc(label)}]</a>` : ` <span class="unverified">source pending</span>`);
  const D = (v) => (window.DATES ? window.DATES.long(v) : String(v));
  const pct = (x) => (x == null ? "" : `${Math.round(x * 10) / 10}%`);
  let data = null, loading = null;
  const load = () => {
    if (!loading) loading = fetch("data/campaigns.json").then((r) => r.json()).then((d) => { data = d; return d; }).catch(() => null);
    return loading;
  };

  const STATUS = { delivered: "Delivered", partial: "Partly delivered", "not yet": "Not yet due or not yet delivered", missed: "Missed", "no evidence found": "No evidence found either way" };

  function ladder(stage) {
    return `<ol class="cp-ladder" aria-label="Milestone stage ${stage} of 4: ${esc(data.stages[stage - 1])}">${data.stages.map((s, i) => `<li class="${i < stage ? "on" : ""}">${esc(s)}</li>`).join("")}</ol>`;
  }
  function when(s) {
    if (s.precision === "before meeting") return `before the ${D(s.date)} meeting`;
    return D(s.date);
  }
  function stateLine(s, many) {
    const by = s.by && s.by.length ? ` by ${esc(s.by.join(", "))}${s.more ? ` and ${s.more} more` : ""}` : "";
    const co = s.co_filers ? ` with ${s.co_filers} co-filer${s.co_filers === 1 ? "" : "s"}` : "";
    const sup = s.support != null ? `: ${pct(s.support)} support` : "";
    const det = s.detail ? `<div class="ticker">${esc(s.detail)}</div>` : "";
    const crit = s.critical && s.state === "filed" ? ` <span class="ticker">(filed from a critical stance on ESG)</span>` : "";
    // Name the proposal on the filing line, and on every line when one season had more than one proposal.
    const title = s.title && (s.state === "filed" || many.has(String(s.date).slice(0, 4))) ? ` <span class="ticker">"${esc(s.title)}"</span>` : "";
    return `<li class="cp-${esc(s.state)}"><span class="cp-date">${esc(when(s))}</span> <strong>${esc(s.label)}</strong>${title}${by}${co}${sup}${crit}${link(s.source_url, s.state === "voted" ? "8-K results" : s.state === "campaign" ? "PX14A6G" : "source")}${det}</li>`;
  }
  function campaignHtml(c, open, hasOutside) {
    const perYear = {};
    c.states.filter((s) => s.state === "filed").forEach((s) => { perYear[s.date] = (perYear[s.date] || 0) + 1; });
    const many = new Set(Object.keys(perYear).filter((y) => perYear[y] > 1));
    const votes = c.votes ? `; ${c.votes} vote${c.votes === 1 ? "" : "s"}${c.best_support != null ? `, highest ${pct(c.best_support)}` : ""}` : "";
    return `<details class="cp-camp"${open ? " open" : ""}><summary><strong>${esc(c.ask_label || "Other AI ask")}</strong> <span class="ticker">${c.filings} filing${c.filings === 1 ? "" : "s"}${votes}; stage: ${esc(c.stage_label)}${c.critical_only ? "; filed only from a critical stance on ESG" : ""}</span></summary>
      ${ladder(c.stage)}<p class="ticker">Stage from ${esc(c.stage_basis)}. Counts this ask's proposal records only${hasOutside ? "; engagement outside a proposal has its own ladder below" : ""}.</p>
      <ol class="cp-states">${c.states.map((s) => stateLine(s, many)).join("")}</ol></details>`;
  }
  function ledgerHtml(list, withCompany) {
    if (!list.length) return `<p class="status-note">No company commitment on AI recorded here yet.</p>`;
    return `<div class="table-wrap"><table class="cp-ledger"><thead><tr>${withCompany ? `<th scope="col">Company</th>` : ""}<th scope="col">Promised</th><th scope="col">When, and by when</th><th scope="col">Engaged by</th><th scope="col">Delivered?</th><th scope="col">Evidence</th></tr></thead><tbody>${list.map((c) => `<tr>
      ${withCompany ? `<td>${esc(c.company_name || c.company)}</td>` : ""}
      <td>${esc(c.promised)}${link(c.commitment_source_url, c.commitment_source_kind === "company" ? "company" : "source")}${c.commitment_source_kind && c.commitment_source_kind !== "company" ? `<div class="ticker">as reported by the ${esc(c.commitment_source_kind)}</div>` : ""}</td>
      <td>${esc(D(c.promised_date || ""))}${c.deadline ? `; by ${esc(D(c.deadline))}` : `<div class="ticker">no deadline stated</div>`}</td>
      <td>${esc(c.engaged_by || "")}</td>
      <td><span class="cp-status cp-s-${esc(String(c.status).replace(/\s+/g, "-"))}">${esc(STATUS[c.status] || c.status)}</span>${c.is_commitment === false ? `<div class="ticker">a reported action, not an earlier promise</div>` : ""}</td>
      <td>${(c.evidence || []).map((e) => `${esc(e.text)}${e.date ? ` <span class="ticker">(${esc(D(e.date))}${e.date_note ? `; ${esc(e.date_note)}` : ""})</span>` : ""}${link(e.url, "company document")}`).join("<br>") || `<span class="ticker">none found</span>`}${c.notes ? `<div class="ticker">${esc(c.notes)}</div>` : ""}</td></tr>`).join("")}</tbody></table></div>
      <p class="ticker">Delivery counts only the company's own documents or a regulator; a proponent's report is the claim, not the proof. Checked ${esc(D((list[0] || {}).checked || ""))}.</p>`;
  }

  // Company profile: every campaign at the company, reported steps, and its commitments.
  function companyHtml(co) {
    const camps = data.campaigns.filter((c) => c.company === co).sort((a, b) => (a.critical_only - b.critical_only) || b.stage - a.stage || b.filings - a.filings);
    const rep = data.reported.filter((r) => r.company === co);
    const led = data.commitments.filter((c) => c.company === co);
    const out = (data.outside || {})[co];
    return `<h3 class="sub-h">Engagement timeline</h3>
      <p class="status-note">Each ask at this company as dated steps on the engagement ladder (filing, campaigning, vote, withdrawal or exclusion, delivery), each with its source. ${esc(data.not_recorded)}</p>
      ${camps.length ? camps.map((c, i) => campaignHtml(c, i === 0 && camps.length <= 2, !!out)).join("") : `<p class="status-note">No AI shareholder proposal recorded at this company.</p>`}
      ${out ? `<h4>Engagement outside proposals</h4>${ladder(out.stage)}<p class="ticker">Stage from ${esc(out.stage_basis)}.</p>` : ""}
      ${rep.length ? `<h4>Steps reported by investors (not tied to one proposal)</h4><ol class="cp-states">${rep.map((r) => `<li><span class="cp-date">${esc(D(r.date))}</span> <strong>${esc(r.title)}</strong>. ${esc(r.summary || "")} <span class="ticker">reported by ${esc(r.reported_by)}</span>${link(r.source_url, r.source_page ? `source, p. ${r.source_page}` : "source")}</li>`).join("")}</ol>` : ""}
      <h3 class="sub-h" id="co-ledger" tabindex="-1">Commitments ledger</h3>${ledgerHtml(led, false)}`;
  }
  // Planner: the campaign for this company and ask.
  function planHtml(co, ask) {
    const c = data.campaigns.find((x) => x.company === co && x.ask === ask);
    const led = data.commitments.filter((x) => x.company === co);
    return `<h4>The engagement ladder here</h4>${c ? campaignHtml(c, true, false) : `<p class="status-note">No campaign on this ask at this company yet: it would start at "${esc(data.stages[0])}".</p>`}
      ${led.length ? `<p class="ticker">${led.length} company commitment${led.length === 1 ? "" : "s"} on AI on record here: <a href="#company" class="cp-open-co" data-co="${esc(co)}">see the commitments ledger on the company profile</a>.</p>` : ""}`;
  }
  // Results of private engagement: what engagement has produced across the companies tracked.
  function outcomesHtml() {
    const m = data.metrics;
    const stages = Object.entries(m.campaigns_by_stage).map(([k, v]) => `<li>${esc(k)}: ${v}</li>`).join("");
    return `<section class="pl-card pl-wide cp-outcomes" aria-labelledby="cp-h-out"><h3 id="cp-h-out">Outcomes across the engagement ladder</h3>
      <p class="status-note">${esc(m.basis)}. Counted by this site from the records linked on each company profile.</p>
      <dl class="summary">
        <div><dt>Filings</dt><dd>${m.filings}</dd></div>
        <div><dt>Went to a vote</dt><dd>${m.voted}${m.upcoming ? `, ${m.upcoming} on upcoming ballots` : ""}</dd></div>
        <div><dt>Withdrawn after a company commitment</dt><dd>${m.withdrawn_with_commitment}</dd></div>
        <div><dt>Withdrawn for other reasons</dt><dd>${m.withdrawn_other}</dd></div>
        <div><dt>Excluded by the company</dt><dd>${m.excluded}</dd></div>
      </dl>
      <h4>What companies conceded to end a proposal</h4><ul class="steps tight">${m.conceded.map((x) => `<li><strong>${esc(x.company_name || x.company)}</strong>: ${esc(x.what)}${link(x.source_url)}</li>`).join("")}</ul>
      <h4>Highest milestone reached</h4><ul class="steps tight">${stages}</ul>
      ${m.outside_by_stage ? `<p class="ticker">Proposal campaigns, one per ask at a company. Engagement outside proposals, by company: ${Object.entries(m.outside_by_stage).filter(([, v]) => v).map(([k, v]) => `${esc(k)}: ${v}`).join("; ")} (from investor reports and the ledger).</p>` : ""}
      <h4>Commitments ledger, all companies</h4>${ledgerHtml(data.commitments, true)}
      ${(data.field_context || []).length ? `<h4>Across the wider field, from other publishers</h4><ul class="steps tight">${data.field_context.map((f) => `<li>${esc(f.publisher)}, <em>${esc(f.title)}</em> (${esc(D(f.date))}): ${f.quoted ? `"${esc(f.text)}"` : esc(f.text)} <span class="ticker">${esc(f.scope)}</span>${link(f.url)}</li>`).join("")}</ul>` : ""}</section>`;
  }

  async function fill(root) {
    const slots = [...(root || document).querySelectorAll(".campaigns-slot")];
    if (!slots.length) return;
    const d = await load();
    slots.forEach((s) => {
      if (!d) { s.innerHTML = `<p class="status-note">Engagement timelines did not load.</p>`; return; }
      s.innerHTML = s.dataset.kind === "outcomes" ? outcomesHtml() : s.dataset.ask ? planHtml(s.dataset.co, s.dataset.ask) : companyHtml(s.dataset.co);
    });
  }
  window.CAMPAIGNS = { fill, load };
  document.addEventListener("click", (e) => {
    const a = e.target.closest(".cp-open-co");
    if (!a || !window.LENS_CTX || !window.LENS_CTX.openCompany) return;
    e.preventDefault();
    window.LENS_CTX.openCompany(a.dataset.co);
    // Land on the ledger, not the top of the profile (it fills once the timelines load).
    let tries = 0;
    const go = () => { const h = document.getElementById("co-ledger"); if (h) { h.scrollIntoView({ block: "start" }); h.focus({ preventScroll: true }); } else if (tries++ < 20) setTimeout(go, 100); };
    setTimeout(go, 50);
  });

  // "Results of private engagement" (scorecard.js draws it): add the outcome summary once the view is shown.
  document.addEventListener("DOMContentLoaded", () => {
    const el = document.getElementById("tab-outcomes");
    if (!el) return;
    const go = () => {
      if (el.hidden || el.querySelector(".campaigns-slot")) return;
      const h = el.querySelector("h2");
      if (!h) return;
      const intro = h.nextElementSibling && h.nextElementSibling.matches("p.intro") ? h.nextElementSibling : h;
      intro.insertAdjacentHTML("afterend", `<div class="campaigns-slot" data-kind="outcomes"></div>`);
      fill(el);
    };
    new MutationObserver(go).observe(el, { attributes: true, attributeFilter: ["hidden"], childList: true });
    go();
  });
})();

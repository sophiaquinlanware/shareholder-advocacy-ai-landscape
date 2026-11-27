// Fund votes: how fund families voted on each AI shareholder proposal, side by side.
// Reads data/fund_votes.json (built by scripts/npx_votes.py from SEC Form N-PX, then
// scripts/publish_fund_votes.py) and data/proposals.json.
// Plan and reviews: docs/plans/2026-11-25-fund-votes.md, docs/reviews/2026-11-25 fund votes *.
//
// Wording rules (PRODUCT.md "Never claim"): votes are neutral labels, never coloured as
// right or wrong; no tallies or "agreed with" measures; a missing vote says why only when
// the data says why ("Not checked" when no readable filing covers that meeting); rows a
// person has not checked are marked with a dagger and a footnote.

(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LABEL = { FOR: "For", AGAINST: "Against", ABSTAIN: "Abstain", WITHHOLD: "Withhold", NONE: "Did not vote", SPLIT_WITHIN_FUND: "split within a fund" };
  const NAMES = { AAPL: "Apple", AMZN: "Amazon", AXON: "Axon Enterprise", CMCSA: "Comcast", CRM: "Salesforce", CSCO: "Cisco Systems", DIS: "Walt Disney", DLR: "Digital Realty Trust", GOOGL: "Alphabet", IBM: "IBM", META: "Meta", MSFT: "Microsoft", NFLX: "Netflix", NVDA: "Nvidia", PLTR: "Palantir Technologies", SO: "Southern Company", TSLA: "Tesla", VRSK: "Verisk Analytics" };
  const NEW_TAB = ", opens in a new tab";
  let V = null;

  // N-PX periods end June 30: a meeting in July 2024 to June 2025 is in the "2025-06-30" filing.
  function periodFor(date) {
    const y = Number(date.slice(0, 4));
    return `${Number(date.slice(5, 7)) >= 7 ? y + 1 : y}-06-30`;
  }
  // "full", "partial" (only some of the family's trusts readable that year) or "" (none).
  function coverageOf(family, p) {
    const per = V.coverage[family] || {};
    return per[periodFor(p.meeting_date)] || "";
  }

  function voteText(row) {
    if (row.vote === "NEEDS_CHECK") return "Needs checking";
    if (row.vote !== "SPLIT") return LABEL[row.vote] || row.vote;
    const parts = Object.entries(row.counts).map(([k, n]) => `${n} ${(LABEL[k] || k).toLowerCase()}`);
    return `Split: ${parts.join(", ")}`;
  }

  // Shared with the Individual investor feed (lenses.js), so the two views word and join votes the same way.
  // index(data) builds the lookups once; row(ix, family, proposalId) returns the summary row or null.
  window.FundVotes = {
    LABEL,
    voteText,
    periodFor,
    index(data) {
      if (!data || !data.summary) return null;
      const checked = new Set(data.proposals_checked || []);
      const held = new Set(data.held_back_proposals || []);
      const trusts = new Map();
      // Trust and fund names from the families list (ticker entries without their "ticker:" prefix) and filings.
      if (data.families && !Array.isArray(data.families)) Object.entries(data.families).forEach(([fam, list]) => {
        if (!trusts.has(fam)) trusts.set(fam, new Set());
        (list || []).forEach((t) => trusts.get(fam).add(String(t).replace(/^ticker:/, "")));
      });
      (data.filings || []).forEach((f) => {
        if (!trusts.has(f.family)) trusts.set(f.family, new Set());
        trusts.get(f.family).add(f.trust);
      });
      return {
        families: [...new Set(data.summary.map((r) => r.family))].sort((a, b) => a.localeCompare(b)),
        allFamilies: Array.isArray(data.families) ? data.families : Object.keys(data.families || {}),
        trusts,
        notShown: data.not_shown || [],
        coverage: data.coverage || {},
        byKey: new Map(data.summary.map((r) => [`${r.family}|${r.proposal_id}`, r])),
        usable: (id) => checked.has(id) && !held.has(id),
        reviewed: data.reviewed || [],
      };
    },
    coverage(ix, family, meetingDate) {
      return meetingDate ? (ix.coverage[family] || {})[periodFor(meetingDate)] || "" : "";
    },
  };

  function cell(f, p) {
    const r = V.byKey.get(`${f}|${p.id}`);
    const cov = coverageOf(f, p);
    if (!r) {
      const text = cov === "full" ? "No vote found" : cov === "partial" ? "Partly checked" : "Not checked";
      return `<td><span class="ticker">${text}</span></td>`;
    }
    const text = voteText(r);
    const mark = (r.reviewed || r.vote === "NEEDS_CHECK" ? "" : " †") + (cov === "partial" ? " ‡" : "");
    const status = (r.reviewed ? "" : ", matched automatically, not yet reviewed") + (cov === "partial" ? ", from part of this family's filings for that year" : "");
    const more = r.sources.slice(1).map((u, i) => ` <a class="src" href="${esc(u)}" target="_blank" rel="noopener" aria-label="${esc(`${f}, ${p.title}: filing ${i + 2}${NEW_TAB}`)}">[${i + 2}]</a>`).join("");
    const label = `${f}, ${p.title}: ${text}${status}, N-PX filing${NEW_TAB}`;
    return `<td><a class="pill pending" href="${esc(r.sources[0])}" target="_blank" rel="noopener" aria-label="${esc(label)}">${esc(text)}${mark}</a>${more}</td>`;
  }

  function draw() {
    const fams = V.families.filter((f) => !V.family || f === V.family);
    const rows = V.proposals.filter((p) => (!V.company || p.company === V.company) && (!V.topic || p.topic === V.topic));
    const head = fams.map((f) => `<th scope="col">${esc(f)}</th>`).join("");
    const body = rows.map((p) => {
      const support = p.support_pct != null ? `${p.support_pct}% support` : "";
      const name = `${NAMES[p.company] || p.company} ${p.year}: ${p.title}`;
      const proxy = p.proxy_url ? ` <a class="src" href="${esc(p.proxy_url)}" target="_blank" rel="noopener" aria-label="${esc(`Proxy statement for ${name}${NEW_TAB}`)}">[proxy]</a>` : "";
      return `<tr><th scope="row" class="sticky-col">${esc(name)}<div class="ticker">${esc(support)}${proxy}</div></th>${fams.map((f) => cell(f, p)).join("")}</tr>`;
    }).join("");
    document.getElementById("fv-table").innerHTML = `
      <table>
        <caption class="fv-caption">Votes by fund family on ${rows.length} AI-related shareholder ${rows.length === 1 ? "proposal" : "proposals"}, from SEC Form N-PX filings</caption>
        <thead><tr><th scope="col" class="sticky-col">Proposal</th>${head}</tr></thead>
        <tbody>${body || `<tr><td colspan="${fams.length + 1}">No proposals match these filters.</td></tr>`}</tbody>
      </table>`;
  }

  // Pass-through voting (data/pass_through_voting.json): whether each fund family lets fund holders choose their
  // own votes. "offered: null" means no program was found on the pages checked, never "no program".
  function ptvTable(ptv) {
    const fam = (ptv && ptv.families) || [];
    if (!fam.length) return "";
    const say = (f) => (f.offered === true ? "Yes" : f.offered === false ? "No" : "No program found on the pages checked");
    return `<h3 class="sub-h">Can fund holders choose their own votes? (pass-through voting)</h3>
      <p class="count-line">${esc(ptv.about || "Whether each fund family offers holders of its funds a say in proxy votes.")}</p>
      <div class="table-wrap"><table><thead><tr><th scope="col">Fund family</th><th scope="col">Offered</th><th scope="col">Detail</th></tr></thead><tbody>
      ${fam.map((f) => `<tr><td>${esc(f.family)}</td><td>${esc(say(f))}</td><td>${esc(f.note || "")} ${f.source_url ? `<a class="src" href="${esc(f.source_url)}" target="_blank" rel="noopener">[source]</a>` : `<span class="unverified">source pending</span>`}</td></tr>`).join("")}
      </tbody></table></div>`;
  }
  window.renderVotes = function (data, proposals, ptv) {
    const el = document.getElementById("tab-votes");
    if (!el) return;
    if (!data || !data.summary || !data.summary.length) {
      el.innerHTML = `<div class="coming"><h2>Fund family votes on AI proposals</h2><p>Being checked now.</p></div>`;
      return;
    }
    const checked = new Set(data.proposals_checked || []);
    // Structured N-PX filings start with meetings from July 1, 2023; earlier meetings cannot be checked.
    const firstDay = data.first_meeting_covered || "0000-01-01";
    const lastDay = data.last_meeting_covered || "9999-12-31";
    // Proposals raised from the meeting floor are not in proxy materials, so funds do not report them on N-PX.
    const isFloor = (p) => /floor/i.test(p.id) || /presented at the meeting/i.test(p.title);
    const inWindow = (p) => p.meeting_date && p.meeting_date >= firstDay && p.meeting_date <= lastDay;
    const props = ((proposals && proposals.proposals) || [])
      .filter((p) => checked.has(p.id) && (p.status || "").toLowerCase() === "voted" && inWindow(p) && !isFloor(p))
      .sort((a, b) => (a.company + a.year).localeCompare(b.company + b.year));
    const families = [...new Set(data.summary.map((r) => r.family))].sort((a, b) => a.localeCompare(b));
    V = {
      families, proposals: props, coverage: data.coverage || {},
      byKey: new Map(data.summary.map((r) => [`${r.family}|${r.proposal_id}`, r])),
      company: window.innerWidth < 600 ? (props[0] || {}).company || "" : "", topic: "", family: "",
    };
    const companies = [...new Set(props.map((p) => p.company))].sort((a, b) => (NAMES[a] || a).localeCompare(NAMES[b] || b));
    const topics = [...new Set(props.map((p) => p.topic).filter(Boolean))].sort();
    const longDate = (d) => new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const reviewedBy = (data.reviewed || []).map((r) => `${r.family}, ${r.proposal_ids.length} proposals (${longDate(r.date)})`).join("; ");
    const opt = (v, t, sel) => `<option value="${esc(v)}"${sel ? " selected" : ""}>${esc(t)}</option>`;
    el.innerHTML = `
      <h2>Fund family votes on AI proposals</h2>
      <p class="intro">Form N-PX votes by ${families.length} fund families on AI proposals at tracked companies, meetings ${esc(longDate(data.first_meeting_covered))} to ${esc(longDate(data.last_meeting_covered))}. Each vote links to its filing. No vote is rated, and nothing here suggests how to vote. Not affiliated with any fund shown.</p>
      <ul class="steps">
        <li><strong>Split</strong> means the family reported more than one way of voting on that proposal. The numbers count fund records: different funds can vote differently, and a single fund can split its own shares, as pass-through voting programs do.</li>
        <li><strong>No vote found</strong> means no matching vote turned up in the filings checked. It does not say why.</li>
        <li><strong>Not checked</strong> means no readable filing from that family covers that meeting.</li>
        <li><strong>Partly checked</strong> means only some of that family's fund trusts had a readable filing for that year. <strong>‡</strong> marks a vote that comes from part of the family's filings for that year.</li>
        <li><strong>Needs checking</strong> means the filings list two ballot items that both read as this proposal, so votes cannot be matched to it with confidence. It is held back until a person checks the proxy and the filings.</li>
        <li><strong>†</strong> marks votes matched automatically and spot-checked, but not yet reviewed row by row.${reviewedBy ? ` Reviewed row by row so far: ${esc(reviewedBy)}.` : ""}</li>
        ${(data.not_shown || []).map((t) => `<li>${esc(t)}</li>`).join("")}
      </ul>
      <div class="net-controls">
        <label class="sr-label">Company <select id="fv-company">${opt("", "All companies")}${companies.map((c) => opt(c, NAMES[c] || c, c === V.company)).join("")}</select></label>
        <label class="sr-label">Topic <select id="fv-topic">${opt("", "All topics")}${topics.map((t) => opt(t, t)).join("")}</select></label>
        <label class="sr-label">Fund family <select id="fv-family">${opt("", "All fund families")}${families.map((f) => opt(f, f)).join("")}</select></label>
      </div>
      <div id="fv-table" class="table-wrap" role="region" aria-label="How funds voted, table" tabindex="0"></div>
      <p class="note">Matching: same company and meeting, with the filing's wording and the proposal title agreeing closely; close calls are left out. Floor proposals are not reported on N-PX.</p>
      ${ptvTable(ptv)}`;
    el.querySelector("#fv-company").addEventListener("change", (e) => { V.company = e.target.value; draw(); });
    el.querySelector("#fv-topic").addEventListener("change", (e) => { V.topic = e.target.value; draw(); });
    el.querySelector("#fv-family").addEventListener("change", (e) => { V.family = e.target.value; draw(); });
    draw();
  };
})();

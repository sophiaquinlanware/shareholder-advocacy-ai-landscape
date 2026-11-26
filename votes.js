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
  const NAMES = { MSFT: "Microsoft", GOOGL: "Alphabet", META: "Meta", AMZN: "Amazon", NVDA: "Nvidia", AAPL: "Apple", TSLA: "Tesla" };
  const NEW_TAB = ", opens in a new tab";
  let V = null;

  // N-PX periods end June 30: a meeting in July 2024 to June 2025 is in the "2025-06-30" filing.
  function periodFor(date) {
    const y = Number(date.slice(0, 4));
    return `${Number(date.slice(5, 7)) >= 7 ? y + 1 : y}-06-30`;
  }
  function covered(family, p) {
    const periods = V.coverage[family];
    if (!periods) return true;
    if (p.meeting_date) return periods.includes(periodFor(p.meeting_date));
    return periods.some((x) => x.startsWith(String(p.year)) || x.startsWith(String(Number(p.year) + 1)));
  }

  function voteText(row) {
    if (row.vote === "NEEDS_CHECK") return "Needs checking";
    if (row.vote !== "SPLIT") return LABEL[row.vote] || row.vote;
    const parts = Object.entries(row.counts).map(([k, n]) => `${n} ${(LABEL[k] || k).toLowerCase()}`);
    return `Split: ${parts.join(", ")}`;
  }

  function cell(f, p) {
    const r = V.byKey.get(`${f}|${p.id}`);
    if (!r) {
      const text = covered(f, p) ? "No vote found" : "Not checked";
      return `<td><span class="ticker">${text}</span></td>`;
    }
    const text = voteText(r);
    const mark = r.reviewed ? "" : "†";
    const status = r.reviewed ? "" : ", matched automatically, not yet reviewed";
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
        <caption class="fv-caption">Votes by fund family on ${rows.length} AI-related shareholder proposals, from SEC Form N-PX filings</caption>
        <thead><tr><th scope="col" class="sticky-col">Proposal</th>${head}</tr></thead>
        <tbody>${body || `<tr><td colspan="${fams.length + 1}">No proposals match these filters.</td></tr>`}</tbody>
      </table>`;
  }

  window.renderVotes = function (data, proposals) {
    const el = document.getElementById("tab-votes");
    if (!el) return;
    if (!data || !data.summary || !data.summary.length) {
      el.innerHTML = `<div class="coming"><h2>Fund votes</h2><p>Being checked now.</p></div>`;
      return;
    }
    const checked = new Set(data.proposals_checked || []);
    // Structured N-PX filings start with meetings from July 1, 2023; earlier meetings cannot be checked.
    const firstDay = data.first_meeting_covered || "0000-01-01";
    const lastDay = data.last_meeting_covered || "9999-12-31";
    // Proposals raised from the meeting floor are not in proxy materials, so funds do not report them on N-PX.
    const isFloor = (p) => /floor/i.test(p.id) || /presented at the meeting/i.test(p.title);
    const inWindow = (p) => (p.meeting_date ? p.meeting_date >= firstDay && p.meeting_date <= lastDay : Number(p.year) > Number(firstDay.slice(0, 4)));
    const props = ((proposals && proposals.proposals) || [])
      .filter((p) => checked.has(p.id) && (p.status || "").toLowerCase() === "voted" && inWindow(p) && !isFloor(p))
      .sort((a, b) => (a.company + a.year).localeCompare(b.company + b.year));
    const families = [...new Set(data.summary.map((r) => r.family))].sort((a, b) => a.localeCompare(b));
    V = {
      families, proposals: props, coverage: data.coverage || {},
      byKey: new Map(data.summary.map((r) => [`${r.family}|${r.proposal_id}`, r])),
      company: window.innerWidth < 600 ? (props[0] || {}).company || "" : "", topic: "", family: "",
    };
    const companies = [...new Set(props.map((p) => p.company))].sort();
    const topics = [...new Set(props.map((p) => p.topic).filter(Boolean))].sort();
    const reviewedBy = (data.reviewed || []).map((r) => `${r.family} (${r.proposal_ids.length} proposals, ${r.date})`).join("; ");
    const opt = (v, t, sel) => `<option value="${esc(v)}"${sel ? " selected" : ""}>${esc(t)}</option>`;
    el.innerHTML = `
      <h2>Fund votes</h2>
      <p class="intro">How fund families voted on the AI-related shareholder proposals that went to a vote at these companies, from July 2023 to June 2026. Every U.S. mutual fund and ETF reports its votes to the SEC each year on Form N-PX. Each vote links to the filing it comes from.</p>
      <div class="callout">Each fund votes under its own policy. Nothing here says any vote was right or wrong, and nothing here suggests how anyone should vote. This site is independent and is not affiliated with any fund shown.</div>
      <ul class="steps">
        <li><strong>Split</strong> means the family reported more than one way of voting on that proposal. The numbers count fund records: different funds can vote differently, and a single fund can split its own shares, as pass-through voting programs do.</li>
        <li><strong>No vote found</strong> means no matching vote turned up in the filings checked. It does not say why.</li>
        <li><strong>Not checked</strong> means no readable filing from that family covers that meeting.</li>
        <li><strong>Needs checking</strong> means the filing reports the same fund voting two different ways on what reads as this proposal, which usually means two ballot items were matched to it. It is held back until a person checks the filing.</li>
        <li><strong>†</strong> marks votes matched automatically and spot-checked, but not yet reviewed row by row.${reviewedBy ? ` Reviewed so far: ${esc(reviewedBy)}.` : ""}</li>
        ${(data.not_shown || []).map((t) => `<li>${esc(t)}</li>`).join("")}
      </ul>
      <div class="net-controls">
        <label class="sr-label">Company <select id="fv-company">${opt("", "All companies")}${companies.map((c) => opt(c, NAMES[c] || c, c === V.company)).join("")}</select></label>
        <label class="sr-label">Topic <select id="fv-topic">${opt("", "All topics")}${topics.map((t) => opt(t, t)).join("")}</select></label>
        <label class="sr-label">Fund family <select id="fv-family">${opt("", "All fund families")}${families.map((f) => opt(f, f)).join("")}</select></label>
      </div>
      <p class="status-note">The table scrolls sideways for more fund families.</p>
      <div id="fv-table" class="table-wrap" role="region" aria-label="Fund votes table" tabindex="0"></div>
      <p class="status-note">How votes are matched: a vote is linked to a proposal at the same company and meeting only when the filing's wording and the proposal's title share most of their key words, and clearly more than with any other proposal at that meeting. Close calls are left out rather than guessed. Proposals raised from the meeting floor are not shown, because funds do not report them on Form N-PX.</p>`;
    el.querySelector("#fv-company").addEventListener("change", (e) => { V.company = e.target.value; draw(); });
    el.querySelector("#fv-topic").addEventListener("change", (e) => { V.topic = e.target.value; draw(); });
    el.querySelector("#fv-family").addEventListener("change", (e) => { V.family = e.target.value; draw(); });
    draw();
  };
})();

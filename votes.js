// Fund votes: how fund families voted on each AI shareholder proposal, side by side.
// Reads data/fund_votes.json (built by scripts/npx_votes.py from SEC Form N-PX) and
// data/proposals.json. Plan and reviews: docs/plans/2026-11-25-fund-votes.md.
//
// Wording rules (PRODUCT.md "Never claim"): votes are neutral labels, never coloured as
// right or wrong; no tallies or "agreed with" measures; a missing vote says "No vote found"
// without guessing why; families not yet checked by a person say so.

(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LABEL = { FOR: "For", AGAINST: "Against", ABSTAIN: "Abstain", WITHHOLD: "Withhold", NONE: "Did not vote" };
  const NAMES = { MSFT: "Microsoft", GOOGL: "Alphabet", META: "Meta", AMZN: "Amazon", NVDA: "Nvidia", AAPL: "Apple", TSLA: "Tesla" };
  let V = null;

  function voteText(row) {
    if (!row) return "No vote found";
    if (row.vote !== "SPLIT") return LABEL[row.vote] || row.vote;
    const parts = Object.entries(row.counts).map(([k, n]) => `${n} ${(LABEL[k] || k).toLowerCase()}`);
    return `Split: ${parts.join(", ")}`;
  }

  function draw() {
    const fams = V.families.filter((f) => !V.family || f === V.family);
    const rows = V.proposals.filter((p) => (!V.company || p.company === V.company) && (!V.topic || p.topic === V.topic));
    const head = fams.map((f) => `<th scope="col">${esc(f)}${V.reviewed.has(f) ? "" : `<div class="ticker">not yet reviewed</div>`}</th>`).join("");
    const body = rows.map((p) => {
      const cells = fams.map((f) => {
        const r = V.byKey.get(f + "|" + p.id);
        const text = voteText(r);
        const status = V.reviewed.has(f) ? "" : ", auto-detected, not yet reviewed";
        const label = `${f}, ${p.title}: ${text}${status}${r ? ", opens the N-PX filing" : ""}`;
        return r
          ? `<td><a class="pill pending" href="${esc(r.sources[0])}" target="_blank" rel="noopener" aria-label="${esc(label)}">${esc(text)}</a></td>`
          : `<td><span class="ticker" aria-label="${esc(label)}">No vote found</span></td>`;
      }).join("");
      const support = p.support_pct != null ? `${p.support_pct}% support` : "";
      return `<tr><th scope="row" class="sticky-col">${esc(NAMES[p.company] || p.company)} ${esc(p.year)}: ${esc(p.title)}
        <div class="ticker">${esc(support)}${p.proxy_url ? ` <a class="src" href="${esc(p.proxy_url)}" target="_blank" rel="noopener">[proxy]</a>` : ""}</div></th>${cells}</tr>`;
    }).join("");
    document.getElementById("fv-table").innerHTML = `
      <table>
        <caption class="ticker">Votes by fund family on ${rows.length} AI-related shareholder proposals, from SEC Form N-PX filings</caption>
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
    const props = ((proposals && proposals.proposals) || [])
      .filter((p) => checked.has(p.id) && (p.status || "").toLowerCase() === "voted" && (p.meeting_date ? p.meeting_date >= firstDay && p.meeting_date <= lastDay : Number(p.year) > Number(firstDay.slice(0, 4))))
      .sort((a, b) => (a.company + a.year).localeCompare(b.company + b.year));
    const families = [...new Set(data.summary.map((r) => r.family))].sort((a, b) => a.localeCompare(b));
    V = {
      families, proposals: props, reviewed: new Set(data.reviewed_families || []),
      byKey: new Map(data.summary.map((r) => [r.family + "|" + r.proposal_id, r])),
      company: window.innerWidth < 600 ? (props[0] || {}).company || "" : "", topic: "", family: "",
    };
    const companies = [...new Set(props.map((p) => p.company))].sort();
    const topics = [...new Set(props.map((p) => p.topic).filter(Boolean))].sort();
    const unreviewed = families.filter((f) => !V.reviewed.has(f));
    const opt = (v, t, sel) => `<option value="${esc(v)}"${sel ? " selected" : ""}>${esc(t)}</option>`;
    el.innerHTML = `
      <h2>Fund votes</h2>
      <p class="intro">How fund families voted on the AI-related shareholder proposals that went to a vote at these companies, from July 2023 to June 2026. Every U.S. mutual fund and ETF reports its votes to the SEC each year on Form N-PX. Each vote links to the filing it comes from.</p>
      <div class="callout">Each fund votes under its own policy. Nothing here says any vote was right or wrong, and nothing here suggests how anyone should vote. This site is independent and is not affiliated with any fund shown.</div>
      <ul class="steps">
        <li><strong>Split</strong> means a family's funds did not all vote the same way; the counts show how many vote records went each way.</li>
        <li><strong>No vote found</strong> means no matching vote turned up in the filings checked. It does not say why.</li>
        ${unreviewed.length ? `<li>Votes for ${esc(unreviewed.join(", "))} were matched automatically and are <strong>not yet reviewed</strong> by a person.</li>` : ""}
      </ul>
      <div class="net-controls">
        <label class="sr-label">Company <select id="fv-company">${opt("", "All companies")}${companies.map((c) => opt(c, NAMES[c] || c, c === V.company)).join("")}</select></label>
        <label class="sr-label">Topic <select id="fv-topic">${opt("", "All topics")}${topics.map((t) => opt(t, t)).join("")}</select></label>
        <label class="sr-label">Fund family <select id="fv-family">${opt("", "All fund families")}${families.map((f) => opt(f, f)).join("")}</select></label>
      </div>
      <div id="fv-table" class="table-wrap" role="region" aria-label="Fund votes table" tabindex="0"></div>
      <p class="status-note">${esc(data.method || "")}</p>`;
    el.querySelector("#fv-company").addEventListener("change", (e) => { V.company = e.target.value; draw(); });
    el.querySelector("#fv-topic").addEventListener("change", (e) => { V.topic = e.target.value; draw(); });
    el.querySelector("#fv-family").addEventListener("change", (e) => { V.family = e.target.value; draw(); });
    draw();
  };
})();

// "Plan an engagement": evaluate the level of escalation, then draft a document and save it as a PDF.
// Owner (2026-11-27): "Have part of planning an engagement be 'Evaluate level of escalation' … save as a PDF the
// output they want, either if it's an email or it's a shareholder proposal in the format that you see shareholder
// proposals online … a proposal for a coalition, a proposal directly to a company, a letter."
// Plan: docs/plans/2026-11-27-planner-escalation-docs.md. Reads the plan through window.PLANNER (planner.js).
// Facts only: the escalation card shows what is on record and what is available; the reader chooses the step.
// The drafts are the reader's documents, built from the record with every fact cited.

(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmt = (iso) => (iso ? new Date(String(iso).slice(0, 10) + "T12:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "");
  const addDays = (iso, n) => { const d = new Date(String(iso).slice(0, 10) + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const days = (from, to) => Math.round((new Date(to + "T12:00:00") - new Date(from + "T12:00:00")) / 864e5);
  const pct = (x) => `${Math.round(x * 10) / 10}%`;
  const median = (v) => { if (!v.length) return null; const s = [...v].sort((a, b) => a - b), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const ph = (t) => `<span class="pd-ph">[${esc(t)}]</span>`; // a placeholder the reader fills in

  // Sources for the escalation ladder and the proposal rules (docs/plans/2026-11-27-planner-escalation-docs.md).
  const SRC = {
    pri: { url: "https://www.unpri.org/download?ac=4156", label: "PRI, collaborative engagement handbook" },
    priSteward: { url: "https://www.unpri.org/download?ac=12686", label: "PRI, stewardship guide" },
    ppf: { url: "https://ppf.co.uk/-/media/PPF-Website/Files/Responsible-Investment/Reporting-transparently/PPF_Stewardship_Escalation_Policy.pdf", label: "Pension Protection Fund, stewardship escalation policy" },
    rule: { url: "https://www.law.cornell.edu/cfr/text/17/240.14a-8", label: "SEC Rule 14a-8 (17 CFR 240.14a-8)" },
    px14: { url: "https://www.law.cornell.edu/cfr/text/17/240.14a-6", label: "SEC Rule 14a-6(g), notices of exempt solicitation" },
  };

  // What each recurring ask asks for, in the standard form of a Rule 14a-8 report request. Modeled on the
  // proposals filed under each ask in this dataset (the closest one is named and linked in each draft).
  const ASK_TEXT = {
    "ask-dc-water": { title: "Report on Water Use and Water Risk at AI Data Centers", resolved: "issue a report, at reasonable cost and omitting proprietary information, assessing the water use of the Company's data centers, including those built for artificial intelligence, the water stress of the places they draw from, and the Company's plans to reduce related risks", items: ["water withdrawal and consumption by data center and region", "the share in areas of high water stress", "targets and community engagement on water"] },
    "ask-dc-siting-rights": { title: "Report on Human Rights Risks of Data Center Siting", resolved: "issue a report, at reasonable cost and omitting proprietary information, on how the Company assesses and addresses the human rights risks of siting data centers, including those for artificial intelligence, in countries and communities of significant human rights concern", items: ["the due diligence applied before a site is chosen", "how affected communities are consulted", "how risks found are mitigated or lead to not proceeding"] },
    "ask-ai-fossil-fuels": { title: "Report on Climate Risks of AI Tools Sold to Oil and Gas Producers", resolved: "issue a report, at reasonable cost and omitting proprietary information, on the climate risks of providing artificial intelligence and cloud tools that help expand oil and gas production, and how this aligns with the Company's climate commitments", items: ["revenue and contracts tied to upstream oil and gas", "estimated emissions enabled", "consistency with the Company's own climate targets"] },
    "ask-dc-climate-energy": { title: "Report on AI Data Center Energy Use, Emissions and Costs", resolved: "issue a report, at reasonable cost and omitting proprietary information, on how the growth of its artificial intelligence data centers affects its energy use, greenhouse gas emissions and climate targets, and on any costs passed to ratepayers or communities", items: ["projected energy demand from AI workloads", "the source of new power, including fossil generation", "progress against the Company's emissions targets"] },
    "ask-child-safety": { title: "Report on Child Safety Risks of AI Products", resolved: "issue a report, at reasonable cost and omitting proprietary information, assessing the risks its artificial intelligence products and features pose to children and young users, and the steps taken to prevent harm", items: ["age assurance and default settings for minors", "testing of AI features for harms to children", "how incidents are found, reported and fixed"] },
    "ask-targeted-ads-rights": { title: "Human Rights Impact Assessment of AI-Driven Targeted Advertising", resolved: "commission an independent human rights impact assessment of the Company's artificial intelligence–driven targeted advertising, and publish a summary at reasonable cost and omitting proprietary information", items: ["the human rights at risk, including privacy and non-discrimination", "how the assessment shapes product decisions", "how affected users and experts were consulted"] },
    "ask-customer-due-diligence": { title: "Report on Human Rights Due Diligence for Customers' Use of AI", resolved: "issue a report, at reasonable cost and omitting proprietary information, on the human rights due diligence the Company applies to customers' end uses of its artificial intelligence and cloud products, including surveillance, military and law enforcement uses", items: ["which uses and customers are screened, and how", "cases where sales were limited or refused", "how the board oversees these risks"] },
    "ask-ai-misinformation": { title: "Report on Risks of Misinformation and Disinformation from Generative AI", resolved: "issue a report, at reasonable cost and omitting proprietary information, assessing the risks to the Company's operations and to public welfare of misinformation and disinformation generated or spread by its artificial intelligence products, and the steps taken to address them", items: ["how risks are identified before and after release", "measures to detect and label AI-generated content", "how effectiveness is measured"] },
    "ask-ai-bias": { title: "Report on Bias and Discrimination Risks in AI Systems", resolved: "issue a report, at reasonable cost and omitting proprietary information, on how the Company identifies and addresses risks of bias and discrimination in the artificial intelligence systems it builds or uses", items: ["testing for disparate outcomes", "how findings change products", "external review of results"] },
    "ask-ai-training-data": { title: "Report on the Sourcing and Use of Data to Train AI", resolved: "issue a report, at reasonable cost and omitting proprietary information, on how the Company sources the data used to train its artificial intelligence models, including user data and third-party content, and how it addresses related privacy, consent and legal risks", items: ["categories and sources of training data", "consent and opt-out for user data", "legal and reputational risks from data sourcing"] },
    "ask-ai-workforce": { title: "Report on the Impact of AI on the Company's Workforce", resolved: "issue a report, at reasonable cost and omitting proprietary information, on how the Company's use of artificial intelligence affects its workforce, and how it engages workers in decisions about deploying it", items: ["roles affected and the scale of change", "retraining and redeployment", "how workers and their representatives are consulted"] },
    "ask-ai-oversight-reporting": { title: "Report on Board Oversight of Artificial Intelligence", resolved: "issue a report, at reasonable cost and omitting proprietary information, describing the Board's role in overseeing the Company's development and use of artificial intelligence, including how it oversees the related risks and the Company's AI principles", items: ["which committee oversees AI and how often it reviews it", "the directors' relevant expertise", "how the Company reports on AI risks and incidents"] },
  };
  const askText = (ask, label) => ASK_TEXT[ask] || { title: `Report on ${label}`, resolved: `issue a report, at reasonable cost and omitting proprietary information, on ${label.toLowerCase()}`, items: [] };

  // ---------- The record for this company and ask ----------
  function facts(ctx) {
    const { S, D, idx, coById, askOf, tick, deadlineOpen, today } = ctx;
    const c = coById(S.co), t = tick(c), ask = S.ask, A = askOf(ask), now = today();
    const crit = (p) => idx.critical.has(p.id);
    const byDate = (a, b) => String(b.meeting_date || b.year).localeCompare(String(a.meeting_date || a.year));
    const all = D.proposals.filter((p) => p.ask_id === ask);
    const here = all.filter((p) => p.company === t).sort(byDate);
    const votedAll = all.filter((p) => p.support_pct != null && !crit(p));
    const votedHere = here.filter((p) => p.support_pct != null && !crit(p));
    const best = votedAll.slice().sort((a, b) => b.support_pct - a.support_pct)[0] || null;
    const model = (here.find((p) => p.plain_summary) || all.filter((p) => p.plain_summary && !crit(p)).sort((a, b) => (b.support_pct ?? -1) - (a.support_pct ?? -1))[0]) || null;
    const upcoming = D.proposals.filter((p) => p.company === t && p.status === "upcoming" && p.meeting_date).sort((a, b) => a.meeting_date.localeCompare(b.meeting_date));
    const meeting = upcoming[0] ? upcoming[0].meeting_date : null;
    const exempt = idx.acts.filter((a) => /exempt solicitation/.test(a.type) && a.prop.company === t && a.prop.ask_id === ask);
    const coNode = D.graph.nodes.find((n) => n.type === "company" && (n.ticker === t || n.id === "co-" + t));
    const direct = coNode ? D.graph.edges.filter((e) => e.type === "engaged directly" && e.target === coNode.id) : [];
    const cov = ((D.coverage && D.coverage.entries) || []).filter((r) => r.ask_id === ask && r.coverage !== "none");
    const ev = new Map(((D.causality && D.causality.events) || []).map((e) => [e.id, e]));
    const famFor = new Set();
    idx.votes.forEach((r) => { const p = all.find((x) => x.id === r.proposal_id); if (p && r.vote === "FOR") famFor.add(r.family); });
    // Resubmission (this site's reading of Rule 14a-8(i)(12)): votes on this ask here in the last five years.
    const thr = (window.RULES && window.RULES.RESUBMISSION_THRESHOLDS) || [5, 15, 25];
    const recent = votedHere.filter((p) => Number(p.year) >= Number(now.slice(0, 4)) - 5);
    const resub = recent.length ? { n: recent.length, last: recent[0], need: thr[Math.min(recent.length, 3) - 1] } : null;
    if (resub) resub.ok = resub.last.support_pct >= resub.need;
    const deadline = c.next_proposal_deadline || null;
    const open = deadline ? deadlineOpen(c) : false;
    const mineNode = S.mine ? idx.nodes.get(S.mine) : null;
    return { c, t, ask, A, now, all, here, votedAll, votedHere, best, model, upcoming, meeting, exempt, direct, cov, ev, famFor, resub, deadline, open,
      nameOf: (tk) => ((D.companies || []).find((x) => x.ticker === tk) || { name: tk }).name,
      daysLeft: deadline && open ? days(now, deadline) : null, med: median(votedAll.map((p) => p.support_pct)), us: c.shareholder_route === "US proxy rules apply",
      orgs: (ctx.orgsFor ? ctx.orgsFor(c) : []).slice(0, 8), mine: mineNode ? mineNode.label : "", people: idx.people, text: askText(ask, A.label || ask) };
  }

  // ---------- Evaluate the level of escalation ----------
  // The rungs follow PRI's collaborative engagement handbook and the PPF escalation policy (private letter, board,
  // collaboration, public steps, a filed resolution, votes against directors).
  function ladder(F) {
    const lastHere = F.votedHere[0];
    const R = [
      { id: "ir", label: "Email or letter to investor relations", doc: "email",
        what: "Ask management for a conversation and set out the ask.",
        record: F.direct.length ? `Direct engagement reported here: ${F.direct.map((e) => e.reported_by || e.source).join(", ")}.` : "Private contact is rarely public; none is on record here.", avail: true },
      { id: "meet", label: "Meeting with management", doc: "plan",
        what: "Discuss the ask with investor relations, sustainability, legal or product leads; agree what would show progress.",
        record: F.direct.length ? `${F.direct.reduce((n, e) => n + ((e.steps && e.steps.length) || 0), 0)} reported engagement steps on record here (see the network).` : "None on record here.", avail: true },
      { id: "board", label: "Letter to the board", doc: "board",
        what: "Write to the chair or lead independent director when management dialogue stalls.",
        record: F.c.director_voting && F.c.director_voting.text ? `Director elections: ${F.c.director_voting.text}` : "Director election rules not on file.", avail: true },
      { id: "coal", label: "Collaborative engagement (coalition or co-filers)", doc: "coalition",
        what: "Bring in other investors to co-sign a letter or co-file a proposal.",
        record: F.orgs.length ? `${F.orgs.length} organizations in this dataset have a public record on this ask or at this company (listed above).` : "No organization on record yet for this ask.", avail: true },
      { id: "public", label: "Public step (exempt solicitation, AGM statement)", doc: "plan",
        what: "Write to other shareholders before a vote (Notice of Exempt Solicitation) or speak at the annual meeting.",
        record: F.exempt.length ? `Exempt solicitations on this ask here: ${F.exempt.map((a) => `${a.prop.year}`).join(", ")}.` : F.upcoming.length ? `An AI proposal is on the next ballot (meeting ${fmt(F.meeting)}).` : "No AI proposal on the next ballot on file.",
        avail: F.upcoming.length > 0 || F.exempt.length > 0 },
      { id: "prop", label: "Shareholder proposal (Rule 14a-8)", doc: "proposal",
        what: "File a proposal for the next annual meeting; it can be withdrawn if the company agrees to act.",
        record: [lastHere ? `Filed here before: ${lastHere.year}, ${pct(lastHere.support_pct)} support.` : F.here.length ? `Filed here before: ${F.here[0].year} (${F.here[0].status}).` : "Not filed here in this dataset.",
          F.deadline ? `Next filing deadline ${fmt(F.deadline)}${F.open ? ` (${F.daysLeft} days left)` : " (passed)"}.` : F.us ? "Filing deadline not on file." : "Not under the US proxy rules.",
          F.resub ? `Resubmission (this site's reading): last vote ${pct(F.resub.last.support_pct)} against a ${F.resub.need}% threshold after ${F.resub.n} vote${F.resub.n === 1 ? "" : "s"}: ${F.resub.ok ? "a similar proposal can be filed again" : "a similar proposal may be excluded for three years"}.` : ""].filter(Boolean).join(" "),
        avail: F.us && F.open && (!F.resub || F.resub.ok) },
      { id: "vote", label: "Votes against directors", doc: "plan",
        what: "An option some investors use: voting against the chair of the responsible committee and publishing why.",
        record: F.meeting ? `Next annual meeting on file: ${fmt(F.meeting)}.` : "Next meeting date not on file.", avail: true },
    ];
    // Furthest step on record at this company for this ask (public record only).
    const furthest = F.exempt.length ? "public" : F.here.length ? "prop" : F.direct.length ? "meet" : null;
    return { R, furthest };
  }

  // ---------- Drafts ----------
  function draft(type, F, form) {
    const src = [];
    const cite = (url, label) => {
      if (!url) return "";
      let i = src.findIndex((s) => s.url === url);
      if (i < 0) { src.push({ url, label }); i = src.length - 1; }
      return `<sup class="pd-cite">[${i + 1}]</sup>`;
    };
    const org = form.org || F.mine || "[Your organization]";
    const who = form.who ? esc(form.who) : ph("Your name, title");
    const co = esc(F.c.name), askL = esc(F.A.label), T = F.text;
    const askPhrase = `that the Company ${esc(T.resolved.replace(/^issue a report/, "issue a report"))}`;
    const lastHere = F.votedHere[0];
    const evidence = [
      lastHere ? `At ${co}'s ${esc(lastHere.year)} annual meeting, a shareholder proposal on this subject ("${esc(lastHere.title)}") received ${pct(lastHere.support_pct)} of votes cast for and against${cite(lastHere.results_url || lastHere.proxy_url, `${F.c.name} ${lastHere.year} vote results`)}.` : "",
      F.votedAll.length ? `Across ${F.votedAll.length} votes on this subject in this site's records, at ${new Set(F.votedAll.map((p) => p.company)).size} companies since ${Math.min(...F.votedAll.map((p) => Number(p.year)))}, median support was ${pct(F.med)}${F.best ? `, and as high as ${pct(F.best.support_pct)} (${esc(F.nameOf(F.best.company))} ${esc(F.best.year)})${cite(F.best.results_url || F.best.proxy_url, `${F.best.company} ${F.best.year} vote results`)}` : ""}.` : "",
      F.famFor.size ? `${F.famFor.size} of the fund families in this site's records voted for at least one proposal on this subject (Form N-PX).` : "",
      F.cov.length ? `${F.cov.length} ${F.cov.length === 1 ? "law or rule" : "laws and rules"} on this site's policy map already address part of this subject${(() => { const e = F.cov.map((r) => F.ev.get(r.policy_id)).find(Boolean); return e ? `, for example ${esc(e.title)}${cite(e.source_url, e.title)}` : ""; })()}.` : "",
    ].filter(Boolean);
    const modelLine = F.model ? `Modeled on ${esc(F.nameOf(F.model.company))} ${esc(F.model.year)}, "${esc(F.model.title)}"${cite(F.model.proxy_url || F.model.plain_summary_source, `${F.model.company} ${F.model.year} proxy statement`)}.` : "";
    const head = (title, meta) => `<header class="pd-head"><p class="pd-meta">${meta}</p><h4 class="pd-title">${title}</h4></header>`;
    const date = fmt(F.now);
    let title = "", body = "";

    if (type === "email") {
      title = `Request for a conversation on ${F.A.label} at ${F.c.name}`;
      body = `${head(`Subject: ${esc(title)}`, `Email · ${esc(date)}`)}
        <p>Dear Investor Relations team,</p>
        <p>${esc(org)} is a shareholder of ${co}${ph("number of shares, held since")}. We are writing about ${askL.toLowerCase()}, and we would like to understand how ${co} is approaching it.</p>
        <p>Specifically, we would ask ${askPhrase}.</p>
        ${evidence.length ? `<p>Why we are raising it now:</p><ul>${evidence.map((e) => `<li>${e}</li>`).join("")}</ul>` : ""}
        ${T.items.length ? `<p>In a first conversation we would welcome your view on ${T.items.map(esc).join("; ")}.</p>` : ""}
        <p>Could we arrange a call with the relevant members of your team in the next 30 days? ${ph("Suggested dates")}</p>
        <p>Kind regards,<br>${who}<br>${esc(org)}<br>${ph("Email, phone")}</p>`;
    } else if (type === "board") {
      title = `Letter to the Board of ${F.c.name}: ${F.A.label}`;
      body = `${head(`To the Chair of the Board and the Lead Independent Director, ${co}`, `Letter · ${esc(date)}`)}
        <p>Re: ${esc(T.title)}</p>
        <p>Dear Chair,</p>
        <p>${esc(org)} is a long-term shareholder of ${co}${ph("number of shares, held since")}. We have raised ${askL.toLowerCase()} with management${ph("dates and form of earlier contact")}, and we are writing to the Board because we believe this is a matter for its oversight.</p>
        <p>We ask that the Board ${esc(T.resolved.replace(/^issue a report/, "ensure the Company issues a report"))}.</p>
        ${evidence.length ? `<p>Shareholders have shown sustained interest in this subject:</p><ul>${evidence.map((e) => `<li>${e}</li>`).join("")}</ul>` : ""}
        ${F.deadline && F.us ? `<p>Under Rule 14a-8, the deadline to submit a proposal on this subject for ${co}'s next annual meeting is ${esc(fmt(F.deadline))}${cite(F.c.next_proposal_deadline_source, `${F.c.name} proxy statement (filing deadline)`)}. We would prefer to make progress through dialogue and would welcome a meeting with the Board's ${ph("responsible committee")} before then.</p>` : `<p>We would welcome a meeting with the Board's ${ph("responsible committee")}.</p>`}
        <p>Yours sincerely,<br>${who}<br>${esc(org)}</p>`;
    } else if (type === "coalition") {
      title = `Invitation to collaborate: ${F.A.label} at ${F.c.name}`;
      const tl = [
        [F.now, "Invitation sent; replies requested within two weeks"],
        [addDays(F.now, 21), "Joint letter to investor relations, asking for a meeting"],
        [addDays(F.now, 56), "Letter to the board if there is no meaningful response"],
        F.deadline && F.open ? [F.deadline, `Rule 14a-8 filing deadline: lead filer and co-filers file together${cite(F.c.next_proposal_deadline_source, `${F.c.name} proxy statement (filing deadline)`)}`] : null,
        F.meeting ? [F.meeting, "Annual meeting"] : null,
      ].filter(Boolean).sort((a, b) => a[0].localeCompare(b[0]));
      body = `${head(esc(title), `Proposal for a coalition · ${esc(date)}`)}
        <h5 class="pd-sec">The ask</h5><p>We propose that investors jointly ask ${co} ${esc(T.resolved.replace(/^issue a report/, "to issue a report"))}.</p>
        <h5 class="pd-sec">Why ${co}, and why now</h5>${evidence.length ? `<ul>${evidence.map((e) => `<li>${e}</li>`).join("")}</ul>` : `<p>${ph("Why this company")}</p>`}
        <h5 class="pd-sec">What we propose</h5><ul><li><strong>Lead:</strong> ${esc(org)}${ph("lead contact")}.</li><li><strong>Co-signers of the letters:</strong> any shareholder of ${co}.</li><li><strong>Co-filers</strong> if a proposal is filed: shareholders meeting the Rule 14a-8 ownership requirements${cite(SRC.rule.url, SRC.rule.label)}.</li></ul>
        <h5 class="pd-sec">Timeline</h5><table class="pd-table"><tbody>${tl.map(([d, w]) => `<tr><td class="nowrap">${esc(fmt(d))}</td><td>${w}</td></tr>`).join("")}</tbody></table>
        ${F.orgs.length ? `<h5 class="pd-sec">Organizations with a public record on this subject</h5><p class="pd-small">From this site's records; a record shows what an organization has done, not whether it will join.</p><ul>${F.orgs.map((o) => `<li><strong>${esc(o.name)}</strong> (${esc(o.type)}): ${o.items.slice(0, 3).map((i) => `${esc(i.text)}${cite(i.url, `${o.name}: ${i.text}`)}`).join("; ")}${o.people.length ? `. Contact on file: ${o.people.map((p) => esc(p.name) + (p.title ? `, ${esc(p.title)}` : "")).join("; ")}` : ""}</li>`).join("")}</ul>` : ""}
        <p>Please reply by ${esc(fmt(addDays(F.now, 14)))} if you would like to take part.</p><p>${who}<br>${esc(org)}</p>`;
    } else if (type === "proposal") {
      title = T.title;
      const whereas = [
        F.model && F.model.plain_summary ? `WHEREAS: a ${esc(F.model.year)} shareholder proposal at ${esc(F.nameOf(F.model.company))} asked ${esc(F.model.plain_summary.replace(/^Asks?\s+/i, "").replace(/\.$/, ""))}${cite(F.model.plain_summary_source || F.model.proxy_url, `${F.model.company} ${F.model.year} proxy statement`)};` : `WHEREAS: ${ph("the risk or impact at issue, with a source")};`,
        ...evidence.slice(0, 2).map((e) => `WHEREAS: ${e.replace(/\.$/, ";")}`),
        `WHEREAS: shareholders lack the information needed to assess how ${co} manages these risks;`,
      ];
      const support = `${co} faces ${askL.toLowerCase()} risks that can affect its reputation, regulatory position and long-term value. A report would let shareholders judge how these risks are managed.${T.items.length ? ` At the Board's discretion, the report could cover ${T.items.map(esc).join("; ")}.` : ""} ${ph("Closing line, e.g. a request that shareholders vote FOR")}`;
      body = `${head(`${esc(title)}`, `Shareholder proposal for ${co}'s next annual meeting${F.deadline && F.open ? ` (filing deadline ${esc(fmt(F.deadline))})` : ""} · ${esc(date)}`)}
        <p class="pd-small">${modelLine}</p>
        <div class="pd-proposal" data-words>
          ${whereas.map((w) => `<p>${w}</p>`).join("")}
          <p><strong>RESOLVED:</strong> Shareholders request that ${co} ${esc(T.resolved)}.</p>
          <p><strong>SUPPORTING STATEMENT:</strong> ${support}</p>
        </div>
        <p class="pd-small pd-count" aria-live="polite"></p>
        <h5 class="pd-sec">Filing checklist (Rule 14a-8)${cite(SRC.rule.url, SRC.rule.label)}</h5>
        <ul class="pd-small">
          <li>Proposal and supporting statement together: 500 words or fewer.</li>
          <li>Ownership: at least $2,000 of the company's voting shares held for three years, $15,000 for two years, or $25,000 for one year, continuously, through the meeting.</li>
          <li>Proof of ownership from the record holder (broker or bank letter) covering the full holding period.</li>
          <li>A written statement of when you can meet the company, 10 to 30 days after you submit.</li>
          <li>Deadline: ${F.deadline ? `${esc(fmt(F.deadline))}${F.open ? "" : " (passed for this cycle)"}${cite(F.c.next_proposal_deadline_source, `${F.c.name} proxy statement (filing deadline)`)}` : "not on file; check the company's last proxy statement"}.</li>
          ${F.resub ? `<li>Resubmission (this site's reading): the last vote here was ${pct(F.resub.last.support_pct)} against a ${F.resub.need}% threshold; ${F.resub.ok ? "a similar proposal can be filed again" : "a similar proposal may be excluded until three years have passed"}.</li>` : ""}
          <li>Signed and dated by the proponent: ${who}, ${esc(org)}.</li>
        </ul>`;
    } else {
      title = `Engagement plan: ${F.A.label} at ${F.c.name}`;
      const L = ladder(F);
      const chosen = L.R.find((r) => r.id === form.rung);
      const steps = [
        [F.now, "Email investor relations asking for a call (Draft: Email to the company)"],
        [addDays(F.now, 14), "Meeting with management; agree what would show progress"],
        [addDays(F.now, 42), "If no progress: letter to the board (Draft: Letter to the board)"],
        [addDays(F.now, 49), "Invite co-signers and co-filers (Draft: Proposal for a coalition)"],
        F.deadline && F.open ? [F.deadline, "Rule 14a-8 filing deadline, if filing (Draft: Shareholder proposal)"] : null,
        F.meeting ? [addDays(F.meeting, -21), "Notice of exempt solicitation to other shareholders, if a proposal is on the ballot"] : null,
        F.meeting ? [F.meeting, "Annual meeting: vote, and consider votes against the responsible directors"] : null,
      ].filter(Boolean).sort((a, b) => a[0].localeCompare(b[0]));
      body = `${head(esc(title), `Engagement plan · ${esc(org)} · ${esc(date)}`)}
        <h5 class="pd-sec">Objective</h5><p>That ${co} ${esc(T.resolved.replace(/^issue a report/, "issues a report"))}.</p>
        <h5 class="pd-sec">Where things stand</h5>${evidence.length ? `<ul>${evidence.map((e) => `<li>${e}</li>`).join("")}</ul>` : "<p>No public record on this subject at this company in this site's data.</p>"}
        <p>${L.furthest ? `Furthest step on public record here: ${esc(L.R.find((r) => r.id === L.furthest).label.toLowerCase())}.` : "No escalation step is on public record here."} Private engagement is mostly not public.</p>
        ${chosen ? `<p><strong>Chosen starting step:</strong> ${esc(chosen.label)}.</p>` : ""}
        <h5 class="pd-sec">Escalation path and dates</h5><table class="pd-table"><tbody>${steps.map(([d, w]) => `<tr><td class="nowrap">${esc(fmt(d))}</td><td>${esc(w)}</td></tr>`).join("")}</tbody></table>
        <p class="pd-small">Steps follow common practice: private dialogue, then the board, collaboration, public steps and a filed proposal${cite(SRC.pri.url, SRC.pri.label)}${cite(SRC.ppf.url, SRC.ppf.label)}. The order and timing are yours to set.</p>
        <h5 class="pd-sec">Timing and rights at ${co}</h5><ul>
          <li>Next filing deadline: ${F.deadline ? `${esc(fmt(F.deadline))}${F.open ? ` (${F.daysLeft} days left)` : " (passed)"}${cite(F.c.next_proposal_deadline_source, `${F.c.name} proxy statement (filing deadline)`)}` : "not on file"}.</li>
          ${F.c.threshold && F.c.threshold.text ? `<li>Ownership threshold: ${esc(F.c.threshold.text)}${cite(F.c.threshold.url, `${F.c.name} threshold`)}</li>` : ""}
          ${F.c.director_voting && F.c.director_voting.text ? `<li>Director elections: ${esc(F.c.director_voting.text)}${cite(F.c.director_voting.url, `${F.c.name} director elections`)}</li>` : ""}
        </ul>
        ${F.orgs.length ? `<h5 class="pd-sec">Possible partners (public record)</h5><ul>${F.orgs.slice(0, 6).map((o) => `<li>${esc(o.name)}: ${o.items.slice(0, 2).map((i) => `${esc(i.text)}${cite(i.url, `${o.name}: ${i.text}`)}`).join("; ")}</li>`).join("")}</ul>` : ""}
        ${F.here.length ? `<h5 class="pd-sec">Past proposals on this subject at ${co}</h5><ul>${F.here.map((p) => `<li>${esc(p.year)}: ${esc(p.title)} · ${esc(p.status)}${p.support_pct != null ? `, ${pct(p.support_pct)}` : ""}${cite(p.results_url || p.proxy_url, `${F.c.name} ${p.year}`)}</li>`).join("")}</ul>` : ""}`;
    }
    const sources = src.length ? `<section class="pd-sources"><h5 class="pd-sec">Sources</h5><ol>${src.map((s) => `<li>${esc(s.label)}: <a href="${esc(s.url)}">${esc(s.url)}</a></li>`).join("")}</ol></section>` : "";
    const foot = `<p class="pd-foot">Draft prepared from public data on Shareholder advocacy on AI. Check every fact against its source before sending. Not legal or investment advice.</p>`;
    return { title, html: body + sources + foot };
  }

  // ---------- Page ----------
  const DOCS = [
    { id: "email", label: "Email to the company", note: "To investor relations, asking for a conversation." },
    { id: "board", label: "Letter to the board", note: "To the chair or lead independent director." },
    { id: "coalition", label: "Proposal for a coalition", note: "An invitation to co-sign or co-file, with a timeline." },
    { id: "proposal", label: "Shareholder proposal", note: "Rule 14a-8 form: Whereas, Resolved, Supporting statement." },
    { id: "plan", label: "Engagement plan", note: "Objective, record, escalation path with dates, partners, sources." },
  ];
  const Q = { type: "plan", rung: "", key: "", org: "", who: "" };

  function render(force) {
    const ctx = window.PLANNER && window.PLANNER.get();
    const box = document.getElementById("pl-docs");
    if (!ctx || !box || !ctx.coById(ctx.S.co)) return;
    const F = facts(ctx);
    const key = [ctx.S.co, ctx.S.ask, ctx.S.mine].join("|");
    const L = ladder(F);
    const changed = key !== Q.key;
    Q.key = key;
    if (changed && !Q.org) Q.org = F.mine || "";
    const ladderHtml = `<section class="pl-card pl-wide" aria-labelledby="pd-h-esc"><h3 id="pd-h-esc">Evaluate the level of escalation: ${esc(F.c.name)}, ${esc(F.A.label)}</h3>
      <p class="status-note">Escalation options investors have used, from private dialogue to the ballot (after the <a href="${SRC.pri.url}" target="_blank" rel="noopener">PRI</a> and <a href="${SRC.ppf.url}" target="_blank" rel="noopener">PPF</a> guides), with what this site's records show at ${esc(F.c.name)} for this ask. Choose the step you are at; the draft below follows it. ${L.furthest ? `<strong>Furthest step on public record here: ${esc(L.R.find((r) => r.id === L.furthest).label.toLowerCase())}.</strong>` : "<strong>No escalation step on public record here.</strong>"} Private engagement is mostly not public.</p>
      <ol class="pd-ladder" role="radiogroup" aria-label="Escalation step">${L.R.map((r, i) => `<li class="pd-rung${r.id === L.furthest ? " on-record" : ""}${r.avail ? "" : " unavailable"}">
        <label><input type="radio" name="pd-rung" value="${r.id}"${Q.rung === r.id ? " checked" : ""}> <span class="pd-n">${i + 1}</span> <strong>${esc(r.label)}</strong>${r.id === L.furthest ? ` <span class="pill">on record here</span>` : ""}${r.avail ? "" : ` <span class="pill pending">not available now</span>`}</label>
        <p>${esc(r.what)}</p><p class="ticker">${esc(r.record)}</p></li>`).join("")}</ol></section>`;
    const docHtml = `<section class="pl-card pl-wide" aria-labelledby="pd-h-doc"><h3 id="pd-h-doc">Draft a document and save it as a PDF</h3>
      <div class="pd-choose" role="radiogroup" aria-label="Document">${DOCS.map((d) => `<label class="pd-opt"><input type="radio" name="pd-type" value="${d.id}"${Q.type === d.id ? " checked" : ""}><span><strong>${esc(d.label)}</strong><br><span class="ticker">${esc(d.note)}</span></span></label>`).join("")}</div>
      <div class="net-controls pd-inputs">
        <label>Your organization <input type="text" id="pd-org" value="${esc(Q.org)}" placeholder="Organization name"></label>
        <label>Signed by <input type="text" id="pd-who" value="${esc(Q.who)}" placeholder="Name, title"></label>
      </div>
      <p class="status-note">The draft is written from the records above, with numbered sources. Edit it in place; anything in [brackets] is for you to fill in. Saving as a PDF uses your browser's print dialog ("Save as PDF").</p>
      <div class="pd-actions"><button type="button" class="tool" id="pd-pdf">Save as PDF</button> <button type="button" class="tool" id="pd-copy">Copy text</button> <button type="button" class="tool" id="pd-reset">Start again from the data</button> <span class="ticker" id="pd-msg" role="status"></span></div>
      <article id="pd-sheet" class="pd-sheet" contenteditable="true" aria-label="Draft document, editable" spellcheck="true"></article>
    </section>`;
    // Keep the reader's edits while only the planner around it redraws.
    const sheetBefore = document.getElementById("pd-sheet");
    const keep = !force && !changed && sheetBefore && sheetBefore.dataset.edited === "1" ? sheetBefore.innerHTML : null;
    box.innerHTML = ladderHtml + docHtml;
    const sheet = document.getElementById("pd-sheet");
    const write = () => {
      const d = draft(Q.type, F, Q);
      sheet.innerHTML = d.html;
      sheet.dataset.title = d.title;
      sheet.dataset.edited = "0";
      count();
    };
    const count = () => {
      const p = sheet.querySelector(".pd-proposal");
      const out = sheet.querySelector(".pd-count");
      if (!p || !out) return;
      const n = (p.innerText.replace(/\[\d+\]/g, " ").match(/\S+/g) || []).length;
      out.textContent = `${n} words in the proposal and supporting statement (Rule 14a-8 limit: 500).${n > 500 ? " Over the limit: shorten before filing." : ""}`;
      out.classList.toggle("pd-over", n > 500);
    };
    if (keep) { sheet.innerHTML = keep; sheet.dataset.edited = "1"; sheet.dataset.title = (sheetBefore && sheetBefore.dataset.title) || ""; count(); } else write();
    sheet.addEventListener("input", () => { sheet.dataset.edited = "1"; count(); });
    box.querySelectorAll('input[name="pd-type"]').forEach((r) => r.addEventListener("change", () => { Q.type = r.value; write(); }));
    box.querySelectorAll('input[name="pd-rung"]').forEach((r) => r.addEventListener("change", () => {
      Q.rung = r.value;
      const rung = L.R.find((x) => x.id === r.value);
      Q.type = rung ? rung.doc : Q.type;
      box.querySelectorAll('input[name="pd-type"]').forEach((x) => { x.checked = x.value === Q.type; });
      write();
    }));
    document.getElementById("pd-org").addEventListener("input", (e) => { Q.org = e.target.value; if (sheet.dataset.edited !== "1") write(); });
    document.getElementById("pd-who").addEventListener("input", (e) => { Q.who = e.target.value; if (sheet.dataset.edited !== "1") write(); });
    document.getElementById("pd-reset").addEventListener("click", () => { write(); document.getElementById("pd-msg").textContent = "Draft rewritten from the data."; });
    document.getElementById("pd-copy").addEventListener("click", async () => {
      const msg = document.getElementById("pd-msg");
      try { await navigator.clipboard.writeText(sheet.innerText); msg.textContent = "Text copied."; } catch (e) { msg.textContent = "Copy failed: select the draft and copy it."; }
    });
    document.getElementById("pd-pdf").addEventListener("click", () => {
      // Print only the draft; the browser's print dialog offers "Save as PDF". The page title becomes the file name.
      const old = document.title;
      document.title = sheet.dataset.title || "Engagement draft";
      document.documentElement.classList.add("print-doc");
      const done = () => { document.documentElement.classList.remove("print-doc"); document.title = old; window.removeEventListener("afterprint", done); };
      window.addEventListener("afterprint", done);
      window.print();
      setTimeout(done, 1500);
    });
  }

  document.addEventListener("plannerdraw", () => render(false));
  window.PLANNER_DOCS = { render, facts, ladder, draft };
})();

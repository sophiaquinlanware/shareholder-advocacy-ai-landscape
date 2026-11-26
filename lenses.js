// Lens config for the co-filer network: one shared dataset, several ways to view it.
// A lens changes only emphasis and the "What you can do" block; the facts about a node stay the same.
// graph.js reads lenses only through the fields below, so a new lens is one more entry in LENSES.
//
// Each entry:
//   label      text on the "View as" control
//   sizeLabel  what node size means in this lens (the intro reads "Node size = {sizeLabel}")
//   defaults   { hiddenKinds: [...], orphans } applied when the lens is chosen (topic and year reset)
//   size(n, ctx)     a radius in px, or null to keep the default size
//   rings(n, ctx)    [{ kind, text }]: drawn as a ring on the node and always stated in text too
//   measure    optional { label, value(n, ctx) }: the number behind node size, shown and sortable in the List view
//   actionsHeading   optional heading for the actions block (default "What you can do")
//   actions(n, ctx)  [{ text, href?, hrefLabel?, links?: [{ href, label }], button?: { label, run } }]: facts about where, when
//                    or who; never advice and never how to vote (PRODUCT.md Never claim 1-2)
//
// ctx (built by graph.js): nodes, links, byId, upcoming (Map ticker -> meeting from data/upcoming.json),
// hasCompany(ticker), openCompany(ticker), and a cache object for lens helpers.

(function () {
  const FILERS = ["impact/ESG asset manager", "advocacy nonprofit", "faith-based investor", "public pension", "labor fund", "foundation", "coalition", "other"];
  const end = (x) => (typeof x === "object" ? x.id : x);
  const isCompany = (n) => n.kind === "company" || n.kind === "lab" || String(n.kind).startsWith("tier-");
  const FILED = new Set(["lead filer", "co-filer", "filed (named in proxy)"]);

  // A meeting counts for an action only when its ballot is out and it has AI items on it.
  function meetingFor(ticker, ctx) {
    const m = ticker && ctx.upcoming.get(ticker);
    return m && m.status === "upcoming" && (m.items || []).length > 0 ? m : null;
  }
  // First sentence of a note, verbatim. A full stop inside "a.m." or "p.m." does not end the sentence.
  const firstSentence = (s) => String(s || "").split(/(?<![ap]\.m\.)(?<=[.!?])\s+(?=[A-Z])/)[0].trim();

  // Proposals at each company, from "proposal at" edges (proposal -> company).
  function proposalsAt(ctx) {
    if (ctx.cache.proposalsAt) return ctx.cache.proposalsAt;
    const m = new Map();
    ctx.links.forEach((l) => {
      if (l.relation !== "proposal at") return;
      const c = end(l.target);
      if (!m.has(c)) m.set(c, []);
      m.get(c).push(ctx.byId.get(end(l.source)));
    });
    ctx.cache.proposalsAt = m;
    return m;
  }
  function proposalsOnFile(n, ctx) { return (proposalsAt(ctx).get(n.id) || []).length; }

  // Proposals grouped by topic (free-text subtopics barely recur, so topic is the unit).
  function byTopic(ctx) {
    if (ctx.cache.byTopic) return ctx.cache.byTopic;
    const m = new Map();
    ctx.nodes.forEach((n) => {
      if (n.kind !== "proposal" || !n.topic) return;
      if (!m.has(n.topic)) m.set(n.topic, []);
      m.get(n.topic).push(n);
    });
    ctx.cache.byTopic = m;
    return m;
  }

  function meetingAction(ticker, ctx, prefix) {
    const m = meetingFor(ticker, ctx);
    if (!m) return null;
    // The note is quoted verbatim from data/upcoming.json, so a deadline reads as the filing's words.
    const note = firstSentence(m.note);
    return { text: `${prefix} ${m.meeting_label}${note ? `. Proxy note: “${note}”` : ""}`, href: m.proxy_url, hrefLabel: "proxy" };
  }

  function companyActions(n, ctx, withFilers) {
    const out = [];
    const a = meetingAction(n.ticker, ctx, "Next AI vote:");
    if (a) out.push(a);
    if (withFilers) {
      const props = new Set((proposalsAt(ctx).get(n.id) || []).map((p) => p.id));
      const count = new Map();
      ctx.links.forEach((l) => {
        if (FILED.has(l.relation) && props.has(end(l.target))) {
          const f = end(l.source);
          count.set(f, (count.get(f) || 0) + 1);
        }
      });
      const top = [...count].sort((x, y) => y[1] - x[1] || ctx.byId.get(x[0]).label.localeCompare(ctx.byId.get(y[0]).label)).slice(0, 3);
      if (top.length) out.push({ text: `Filers active here (top ${top.length} of ${count.size} by proposals): ${top.map(([id, c]) => `${ctx.byId.get(id).label} (${c} ${c === 1 ? "proposal" : "proposals"})`).join(", ")}` });
    }
    if (n.ticker && ctx.hasCompany(n.ticker)) out.push({ button: { label: "Open in Company lookup", run: () => ctx.openCompany(n.ticker) } });
    return out;
  }

  function filerActions(n, ctx) {
    const out = [];
    const people = ctx.links.filter((l) => l.relation === "works at" && end(l.target) === n.id)
      .map((l) => ctx.byId.get(end(l.source))).filter(Boolean)
      .sort((a, b) => a.label.localeCompare(b.label)).slice(0, 3);
    people.forEach((p) => out.push({ text: `Public profile: ${p.label}${p.title ? ", " + p.title : ""}`, href: p.profile_url || p.source_url, hrefLabel: "profile" }));
    // Exempt solicitations filed by this organisation: distinct filings, not graph edges (one filing can
    // appear on both the proposal and the company). "support" edges are statements, not filings.
    // Each link is named by what the filing is about (its proposal or company), so links can be told apart.
    const filings = new Map();
    ctx.links.filter((l) => end(l.source) === n.id && /^exempt solicitation/.test(l.relation) && !/support/.test(l.relation) && l.source_url)
      .forEach((l) => {
        const t = ctx.byId.get(end(l.target));
        // A filing tied only to a company is named by company and filing year; the year is the two digits
        // after the filer ID in an SEC accession number (…/000121465925006528/ is a 2025 filing).
        const yr = (String(l.source_url).match(/\/\d{10}(\d{2})\d{6}\//) || [])[1];
        const name = t ? (t.kind === "proposal" || !yr ? t.label : `${t.label}, 20${yr} filing`) : "filing";
        // Prefer the proposal's name over the company's when the same filing is on both.
        if (!filings.has(l.source_url) || (t && t.kind === "proposal")) filings.set(l.source_url, name.length > 48 ? name.slice(0, 46) + "…" : name);
      });
    if (filings.size) out.push({ text: `Exempt solicitations on file: ${filings.size}`, links: [...filings].map(([href, label]) => ({ href, label })) });
    return out;
  }

  function proposalMeeting(n, ctx) {
    if (n.status !== "upcoming") return [];
    const a = meetingAction(n.company, ctx, "Annual meeting");
    return a ? [a] : [];
  }

  const upcomingRing = (n) => (n.kind === "proposal" && n.status === "upcoming" ? [{ kind: "upcoming", text: "Upcoming vote" }] : []);

  // ---------- Impact investor marks (Phase 2): deadline, seeking, resubmission ----------
  const R = () => window.RULES || {};
  const fmtDate = (iso) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  // Seeking types shown. "exempt solicitation" asks are left out: asking others to campaign on a vote is close
  // to organising investors to vote (PRODUCT.md Never claim 1). Owner decision recorded in docs/STATE.md.
  const SEEKING_LABEL = { "co-filer": "a co-filer", data: "data", "company relationship": "a company relationship", other: "other help" };
  const seekingOf = (n) => (n.seeking || []).filter((s) => s && SEEKING_LABEL[s.type]);
  const RESUB_NOTE = "this site's reading; thresholds may change";

  // The flag belongs on the latest vote on a subject only: a proposal whose vote appears in a later proposal's
  // vote_history at the same company has already been refiled, so it isn't flagged.
  function superseded(ctx) {
    if (ctx.cache.superseded) return ctx.cache.superseded;
    const s = new Set();
    ctx.nodes.forEach((m) => (m.vote_history || []).forEach((v) => s.add(`${m.company}|${v.year}|${Number(v.support_pct)}`)));
    ctx.cache.superseded = s;
    return s;
  }
  function resub(n, ctx) {
    if (n.kind !== "proposal" || !R().resubmission) return null;
    if (n.status === "voted" && superseded(ctx).has(`${n.company}|${n.year}|${Number(n.support_pct)}`)) return null;
    return R().resubmission(n);
  }

  function impactRings(n, ctx) {
    const out = upcomingRing(n);
    const d = R().deadlineInfo && R().deadlineInfo(n);
    if (d) out.push({ kind: "deadline", text: `Proposal deadline: ${plural(d.days, "day", "days")} left`, frac: d.frac });
    const sk = seekingOf(n);
    if (sk.length) out.push({ kind: "seeking", text: `Seeking ${[...new Set(sk.map((s) => SEEKING_LABEL[s.type]))].join(", ")}` });
    const r = resub(n, ctx);
    if (r) out.push({ kind: "risk", text: r.state === "below" ? "Below this site's reading of the resubmission threshold" : "At risk of losing resubmission eligibility" });
    return out;
  }

  function impactMarkActions(n, ctx) {
    const out = [];
    const d = R().deadlineInfo && R().deadlineInfo(n);
    if (d) {
      const what = d.company ? "Proposal deadline for the next annual meeting" : "Co-file before";
      out.push({ text: `${what} ${fmtDate(d.date)} (${plural(d.days, "day", "days")} left, from the proxy statement)`, href: d.source, hrefLabel: "source", needsSource: true });
    }
    seekingOf(n).forEach((s) => out.push({
      text: `Needs ${SEEKING_LABEL[s.type]}${s.note ? ": " + s.note : ""} · posted by ${s.posted_by || "unknown"}${s.posted_at ? ", " + fmtDate(String(s.posted_at).slice(0, 10)) : ""} · ${s.verified ? "reviewed" : "auto-detected, not yet reviewed"}`,
      href: s.contact_url, hrefLabel: "contact", needsSource: true,
    }));
    const r = resub(n, ctx);
    if (r) {
      const matched = n.vote_history_source || (n.vote_history || []).some((v) => v.source || v.match) ? " Earlier votes matched by this site (same company and topic, similar title)." : "";
      // For a proposal still on the ballot, the bar is stated as a fact about the rule, apart from the meeting
      // line, so it can't read as a support target for the coming vote.
      const bar = r.pending
        ? `Resubmission threshold after this vote: ${r.needs}% (vote ${r.count} on this subject in ${R().LOOKBACK_YEARS} years; ${RESUB_NOTE}). Last vote on the subject: ${r.last.pct}% (${r.last.year}).`
        : `Last vote: ${r.last.pct}% (${r.last.year}). Needs ${r.needs}% to stay eligible (vote ${r.count} on this subject in ${R().LOOKBACK_YEARS} years; ${RESUB_NOTE}).`;
      const hist = [...(n.vote_history || [])].sort((a, b) => a.year - b.year);
      out.push({ text: `${bar}${r.basisNote ? " Support basis note on file: the rule counts For ÷ (For + Against); see Proposals." : ""}${matched}`,
        links: hist.map((v) => ({ href: v.results_url || null, label: `${v.year} vote: ${v.support_pct}%` })) });
    }
    return out;
  }

  // Proposal-level facts for the Impact lens: lead filer contacts, and whether an exempt solicitation is on file.
  function proposalFacts(n, ctx) {
    const out = [];
    const leads = ctx.links.filter((l) => l.relation === "lead filer" && end(l.target) === n.id).map((l) => ctx.byId.get(end(l.source))).filter(Boolean);
    leads.forEach((org) => {
      const people = ctx.links.filter((l) => l.relation === "works at" && end(l.target) === org.id).map((l) => ctx.byId.get(end(l.source))).filter(Boolean)
        .sort((a, b) => a.label.localeCompare(b.label)).slice(0, 2);
      out.push({ text: `Contact lead filer: ${org.label}`, links: people.map((p) => ({ href: p.profile_url || p.source_url, label: `${p.label} (profile)` })).filter((x) => x.href) });
    });
    if (n.status === "upcoming") {
      const has = ctx.links.some((l) => end(l.target) === n.id && /^exempt solicitation/.test(l.relation) && !/support/.test(l.relation));
      if (!has) out.push({ text: "No exempt solicitation on file for this vote" });
    }
    return out;
  }

  // Gap nodes (graph.js adds them while "Show topics not filed" is on): the scope is stated in the line itself.
  function gapActions(n, ctx) {
    const filed = (n.filedAt || []).map((f) => `${f.label} (${f.count})`).join(", ");
    return [{ text: `No ${n.topic} proposal at ${n.companyLabel} in this dataset (${plural(n.covered, "company", "companies")} with AI proposals tracked; compared with all of them, any value-chain tier). Filed at ${n.filedAt.length} of them: ${filed}.` }];
  }

  window.LENSES = {
    impact: {
      label: "Impact investor",
      gaps: true,
      sizeLabel: "number of connections",
      defaults: { hiddenKinds: ["person", "policy", "response", "public"], orphans: true },
      size: () => null,
      rings: impactRings,
      actions(n, ctx) {
        if (n.kind === "proposal") return [...impactMarkActions(n, ctx), ...proposalMeeting(n, ctx), ...proposalFacts(n, ctx)];
        if (isCompany(n)) return [...impactMarkActions(n, ctx), ...companyActions(n, ctx, true)];
        if (n.kind === "gap") return gapActions(n, ctx);
        if (FILERS.includes(n.kind)) return [...impactMarkActions(n, ctx), ...filerActions(n, ctx)];
        return [];
      },
    },
    individual: {
      label: "Individual investor",
      sizeLabel: "AI proposals on file (companies)",
      measure: { label: "AI proposals on file", value: (n, ctx) => (isCompany(n) ? proposalsOnFile(n, ctx) : null) },
      defaults: { hiddenKinds: [...FILERS, "person", "policy", "response", "public"], orphans: true },
      size(n, ctx) {
        if (isCompany(n)) return 5 + Math.sqrt(proposalsOnFile(n, ctx)) * 4;
        if (n.kind === "proposal") return n.status === "upcoming" ? 8 : 5;
        return null;
      },
      rings: upcomingRing,
      actions(n, ctx) {
        if (n.kind === "proposal") return proposalMeeting(n, ctx);
        if (isCompany(n)) return companyActions(n, ctx, false);
        return [];
      },
    },
    policy: {
      label: "Policymaker",
      sizeLabel: "proposals on the same topic (proposals)",
      actionsHeading: "Same topic",
      measure: { label: "Proposals on the same topic", value: (n, ctx) => (n.kind === "proposal" ? (byTopic(ctx).get(n.topic) || []).length : null) },
      defaults: { hiddenKinds: [...FILERS, "person", "public"], orphans: false },
      size(n, ctx) {
        if (n.kind !== "proposal") return null;
        return 3 + Math.sqrt((byTopic(ctx).get(n.topic) || []).length) * 1.6;
      },
      rings: () => [],
      actions(n, ctx) {
        if (n.kind !== "proposal" || !n.topic) return [];
        const same = byTopic(ctx).get(n.topic) || [];
        const cos = new Set(same.map((p) => p.company));
        const years = same.map((p) => p.year).filter(Boolean).sort();
        const span = years.length ? (years[0] === years.at(-1) ? `${years[0]}` : `${years[0]}–${years.at(-1)}`) : "";
        const out = [{ text: `${n.topic}: ${same.length} proposals at ${cos.size} ${cos.size === 1 ? "company" : "companies"}${span ? ", " + span : ""}` }];
        // Lowest and highest support where an 8-K reports the vote; no average. Many of these figures are
        // computed by this site from the 8-K's vote counts (see support_note in data/proposals.json), so the
        // text points to the notes. Floor proposals (raised at the meeting, so proxy votes could not be cast on
        // them) are left out: "floor" in the id or source document, or a null support_pct.
        const isFloor = (p) => /floor/i.test(`${p.id} ${p.source_url || ""}`);
        const voted = same.filter((p) => p.support_pct != null && p.results_url && !isFloor(p)).map((p) => p.support_pct).sort((a, b) => a - b);
        const note = "Some figures are computed from the 8-K's vote counts; notes are in Proposals.";
        if (voted.length === 1) out.push({ text: `Support where an 8-K reports the vote: ${voted[0]}% (1 proposal). ${note}` });
        else if (voted.length > 1) out.push({ text: `Support where an 8-K reports the vote: ${voted[0]}%–${voted.at(-1)}% across ${voted.length} proposals. ${note}` });
        return out;
      },
    },
  };
})();

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
    const filings = new Set(ctx.links.filter((l) => end(l.source) === n.id && /^exempt solicitation/.test(l.relation) && !/support/.test(l.relation) && l.source_url).map((l) => l.source_url));
    if (filings.size) out.push({ text: `Exempt solicitations on file: ${filings.size}`, links: [...filings].map((href, i) => ({ href, label: String(i + 1) })) });
    return out;
  }

  function proposalMeeting(n, ctx) {
    if (n.status !== "upcoming") return [];
    const a = meetingAction(n.company, ctx, "Annual meeting");
    return a ? [a] : [];
  }

  const upcomingRing = (n) => (n.kind === "proposal" && n.status === "upcoming" ? [{ kind: "upcoming", text: "Upcoming vote" }] : []);

  window.LENSES = {
    impact: {
      label: "Impact investor",
      sizeLabel: "number of connections",
      defaults: { hiddenKinds: ["person", "policy", "response", "public"], orphans: true },
      size: () => null,
      rings: upcomingRing,
      actions(n, ctx) {
        if (n.kind === "proposal") return proposalMeeting(n, ctx);
        if (isCompany(n)) return companyActions(n, ctx, true);
        if (FILERS.includes(n.kind)) return filerActions(n, ctx);
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
        const out = [{ text: `Same topic (${n.topic}): ${same.length} proposals at ${cos.size} ${cos.size === 1 ? "company" : "companies"}${span ? ", " + span : ""}` }];
        // Only figures stated in a vote-results filing; no average is computed.
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

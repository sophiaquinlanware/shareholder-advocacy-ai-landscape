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
    if (n.ticker && ctx.hasCompany(n.ticker)) out.push({ button: { label: "Open company profile", run: () => ctx.openCompany(n.ticker) } });
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
  const fmtDate = (iso) => window.DATES.long(iso);
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  // Seeking types shown. "exempt solicitation" asks are left out: asking others to campaign on a vote is close
  // to organising investors to vote (PRODUCT.md Never claim 1). Owner decision recorded in docs/STATE.md.
  const SEEKING_LABEL = { "co-filer": "a co-filer", data: "data", "company relationship": "a company relationship", other: "other help" };
  const seekingOf = (n) => (n.seeking || []).filter((s) => s && SEEKING_LABEL[s.type]);
  const RESUB_NOTE = "this site's reading; thresholds may change";

  // Vote chains: graph nodes carry vote_history (earlier votes on the same subject at the same company, as
  // matched in the data). A chain can be split across nodes, so follow each earlier vote to the proposal node
  // that holds it (same company and year, support within 0.05 points, since the files round differently) and
  // take that node's history too.
  const samePct = (a, b) => Math.abs(Number(a) - Number(b)) <= 0.05;
  function voteChain(n, ctx) {
    const votes = new Map();
    const add = (year, pct, url) => { if (year && pct != null && !votes.has(year)) votes.set(year, { year, pct: Number(pct), results_url: url || null }); };
    if (n.status === "voted" && n.support_pct != null) add(n.year, n.support_pct, n.results_url);
    const seen = new Set([n.id]);
    const queue = [...(n.vote_history || [])];
    while (queue.length) {
      const h = queue.shift();
      add(h.year, h.support_pct, h.results_url);
      const m = ctx.nodes.find((x) => x.kind === "proposal" && !seen.has(x.id) && x.company === n.company && x.year === h.year && x.support_pct != null && samePct(x.support_pct, h.support_pct));
      if (m) { seen.add(m.id); queue.push(...(m.vote_history || [])); }
    }
    return [...votes.values()].sort((a, b) => a.year - b.year);
  }
  // The flag belongs on the latest proposal on a subject only: one whose vote appears in a later proposal's
  // vote_history at the same company has been refiled since, so it isn't flagged.
  function superseded(n, ctx) {
    return ctx.nodes.some((m) => m !== n && m.company === n.company && (m.vote_history || []).some((h) => h.year === n.year && samePct(h.support_pct, n.support_pct)));
  }
  function resub(n, ctx) {
    if (n.kind !== "proposal" || !(n.vote_history || []).length || !R().resubmission) return null;
    const key = `resub:${n.id}`;
    if (ctx.cache[key] !== undefined) return ctx.cache[key];
    let r = null;
    if (n.status === "upcoming") r = R().resubmission(voteChain(n, ctx), { pending: true, year: n.year });
    else if (n.status === "voted" && !superseded(n, ctx)) {
      const co = ctx.nodes.find((c) => (c.kind === "company" || String(c.kind).startsWith("tier-")) && c.ticker === n.company);
      r = R().resubmission(voteChain(n, ctx), { meetingDate: n.meeting_date, nextDeadline: co && co.next_proposal_deadline });
    }
    if (r) r.chain = voteChain(n, ctx);
    ctx.cache[key] = r;
    return r;
  }

  function impactRings(n, ctx) {
    const out = upcomingRing(n);
    const d = R().deadlineInfo && R().deadlineInfo(n);
    if (d) out.push({ kind: "deadline", text: `Proposal deadline: ${plural(d.days, "day", "days")} left`, frac: d.frac });
    const sk = seekingOf(n);
    if (sk.length) out.push({ kind: "seeking", text: `Seeking ${[...new Set(sk.map((s) => SEEKING_LABEL[s.type]))].join(", ")}` });
    const r = resub(n, ctx);
    if (r) out.push({ kind: "risk", text: r.pending ? `Resubmission threshold after this vote: ${r.needs}% (last vote on the subject ${r.last.pct}%)` : r.state === "below" ? "Below this site's reading of the resubmission threshold" : `Close to the ${r.needs}% resubmission threshold` });
    return out;
  }

  function impactMarkActions(n, ctx) {
    const out = [];
    const d = R().deadlineInfo && R().deadlineInfo(n);
    if (d) {
      const what = d.company ? "Proposal deadline for the next annual meeting" : "Co-file before";
      const quote = d.company && n.next_proposal_deadline_quote ? ` Proxy text: “${n.next_proposal_deadline_quote}”` : "";
      out.push({ text: `${what} ${fmtDate(d.date)} (${plural(d.days, "day", "days")} left, from the proxy statement).${quote}`, href: d.source, hrefLabel: "source", needsSource: true });
    }
    seekingOf(n).forEach((s) => out.push({
      text: `Needs ${SEEKING_LABEL[s.type]}${s.note ? ": " + s.note : ""} · posted by ${s.posted_by || "unknown"}${s.posted_at ? ", " + fmtDate(String(s.posted_at).slice(0, 10)) : ""} · ${s.verified ? "reviewed" : "auto-detected, not yet reviewed"}`,
      href: s.contact_url, hrefLabel: "contact", needsSource: true,
    }));
    const r = resub(n, ctx);
    if (r) {
      const basis = `vote ${r.count} on this subject in the ${R().LOOKBACK_YEARS} years before the ${r.meetingYear} meeting; ${RESUB_NOTE}`;
      // Stated as facts about the bar; for a proposal on the ballot the bar is kept apart from the meeting line,
      // so it can't read as a support target for the coming vote.
      const text = r.pending
        ? `Resubmission threshold after this vote: ${r.needs}% (${basis}). Last vote on the subject: ${r.last.pct}% (${r.last.year}).`
        : r.state === "below"
          ? `Last vote: ${r.last.pct}% (${r.last.year}), under the ${r.needs}% resubmission threshold (${basis}).`
          : r.margin === 0
            ? `Last vote: ${r.last.pct}% (${r.last.year}), at the ${r.needs}% resubmission threshold (${basis}).`
            : `Last vote: ${r.last.pct}% (${r.last.year}), ${r.margin} ${r.margin === 1 ? "point" : "points"} above the ${r.needs}% resubmission threshold (${basis}).`;
      out.push({ text, links: r.chain.map((v) => ({ href: v.results_url, label: `${v.year} vote: ${v.pct}%` })) });
      out.push({ text: "Earlier votes are matched in this dataset by company, topic and similar title, not confirmed from the proxy. Support figures may be on a different basis from the rule's For ÷ (For + Against); notes are in Proposals." });
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

  // ---------- Individual investor feed (Phase 3) ----------
  // Plain-language definitions, shown only in this lens (owner's spec; PRODUCT.md and DESIGN.md rule 6 carve
  // this out). General descriptions only: no thresholds, dates or other rule details. The owner edits these.
  const GLOSSARY = {
    "shareholder proposal": "A request one shareholder puts to all shareholders for a vote at a company's annual meeting, for example asking the company to publish a report.",
    "annual meeting": "The yearly meeting where a company's shareholders vote on directors and proposals. Shareholders can vote online or by mail beforehand.",
    "proxy statement": "The document a company sends before its annual meeting. It lists everything on the ballot, including shareholder proposals and the company's response to each.",
    "Form N-PX": "A yearly filing in which US mutual funds and ETFs report how they voted on each item at the companies they hold.",
  };
  const dayOf = (iso) => { const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number); return Date.UTC(y, m - 1, d) / 86400000; };
  const companyName = (ctx, t) => ((ctx.companies || []).find((c) => c.ticker === t) || {}).name || t;

  const FEED = {
    glossary: GLOSSARY,
    // Splits on commas and new lines. Tickers match tracked companies; anything else of 3+ characters is
    // tried as a fund family (family name, the name in brackets, or one of its trusts, either way round).
    match(ctx, text) {
      const tokens = String(text || "").split(/[,\n;]+/).map((t) => t.trim()).filter(Boolean);
      const tickers = new Set((ctx.companies || []).map((c) => String(c.ticker || "").toUpperCase()).filter(Boolean));
      const ix = ctx.fv;
      const out = { tickers: [], family: null, familyNote: "", notFound: [], extraFamilies: [] };
      // Generic words that appear in many fund names don't pick a family on their own.
      const GENERIC = new Set(["fund", "funds", "trust", "index", "etf", "etfs", "series", "the", "and", "investments", "investment", "invest", "global", "social", "equity", "growth", "income"]);
      for (const tok of tokens) {
        const up = tok.toUpperCase();
        if (tickers.has(up)) { if (!out.tickers.includes(up)) out.tickers.push(up); continue; }
        const low = tok.toLowerCase();
        let fam = null;
        if (ix && low.length >= 3 && !GENERIC.has(low)) {
          fam = ix.allFamilies.find((f) => {
            const names = [f, f.replace(/\s*\(.*\)/, ""), ...((f.match(/\(([^)]+)\)/) || [])[1] ? [f.match(/\(([^)]+)\)/)[1]] : []), ...(ix.trusts.get(f) || [])].map((x) => x.toLowerCase());
            return names.some((n) => n.length >= 3 && (n.includes(low) || low.includes(n)));
          }) || null;
        }
        if (fam && !out.family) {
          out.family = fam;
          if (!ix.families.includes(fam)) out.familyNote = ix.notShown.find((t) => t.includes(fam)) || `${fam} has no readable Form N-PX votes in this data.`;
        } else if (fam && fam !== out.family) out.extraFamilies.push(fam);
        else if (!fam) out.notFound.push(tok);
      }
      return out;
    },
    // Upcoming AI proposals (status "upcoming", meeting today or later, US Eastern), soonest first.
    items(ctx, tickers) {
      const today = window.RULES ? window.RULES.todayISO() : new Date().toISOString().slice(0, 10);
      return (ctx.proposals || [])
        .filter((p) => p.status === "upcoming" && p.meeting_date && p.meeting_date >= today && (!tickers.length || tickers.includes(p.company)))
        .sort((a, b) => a.meeting_date.localeCompare(b.meeting_date) || a.company.localeCompare(b.company))
        .map((p) => {
          const m = ctx.upcoming.get(p.company);
          const note = m && m.sort === p.meeting_date ? firstSentence(m.note) : "";
          return { p, company: companyName(ctx, p.company), summary: p.plain_summary || p.title, summarySource: p.plain_summary_source || null, date: p.meeting_date, proxy: p.proxy_url, note, topic: p.topic };
        });
    },
    // Companies entered that have no upcoming AI proposal in this tracker, with the next proposal deadline.
    quiet(ctx, tickers, listed) {
      const have = new Set(listed.map((i) => i.p.company));
      return tickers.filter((t) => !have.has(t)).map((t) => {
        const c = ctx.nodes.find((n) => n.ticker === t && (n.kind === "company" || String(n.kind).startsWith("tier-")));
        const d = c && window.RULES && window.RULES.deadlineInfo(c);
        return { ticker: t, name: companyName(ctx, t), deadline: d ? `Proposal deadline for the next annual meeting: ${fmtDate(d.date)} (${plural(d.days, "day", "days")} left)` : "", source: d ? d.source : null };
      });
    },
    // The fund family's Form N-PX vote on the most recent earlier version of this proposal, or null.
    fund(ctx, p, family) {
      const ix = ctx.fv;
      const FV = window.FundVotes;
      if (!ix || !FV || !family) return null;
      const e = [...(p.vote_history || [])].filter((v) => v.proposal_id).sort((a, b) => b.year - a.year)[0];
      if (!e) return null;
      const earlier = (ctx.proposals || []).find((x) => x.id === e.proposal_id) || {};
      // "Last year" when the earlier meeting was about 12 months before this one (up to 13 months).
      const near = earlier.meeting_date && p.meeting_date && dayOf(p.meeting_date) - dayOf(earlier.meeting_date) <= 396;
      const heading = near ? `${family} funds, last year` : `${family} funds, on the ${e.year} version`;
      const about = `Earlier version: “${e.title || earlier.title || ""}” (${e.year}), matched in this dataset by company, topic and similar title.`;
      if (!ix.families.includes(family)) return null;
      // Held back for checking, or not among the proposals checked: nothing is shown.
      if (!ix.usable(e.proposal_id)) return null;
      const row = ix.byKey.get(`${family}|${e.proposal_id}`);
      const cov = FV.coverage(ix, family, earlier.meeting_date);
      if (!row) {
        const t = cov === "full" ? "No vote found in the filings checked." : cov === "partial" ? "Partly checked: only some of this family's filings for that year could be read, and no vote was found in them." : "Not checked: no readable filing covers that meeting.";
        return { heading, text: `${family}: ${t}`, about, links: [] };
      }
      if (row.vote === "NEEDS_CHECK") return { heading, text: `${family}: needs checking. The filings list two ballot items that both read as this proposal, so votes can't be matched to it with confidence.`, about, links: [] };
      const n = row.fund_records || Object.values(row.counts || {}).reduce((a, b) => a + b, 0);
      const notes = [row.reviewed ? "" : "matched automatically, not yet reviewed", cov === "partial" ? "from part of this family's filings for that year" : ""].filter(Boolean);
      return {
        heading,
        text: `${family}: ${FV.voteText(row)}`,
        // Counts are N-PX vote records (one record can cover several fund series), as on the Fund votes tab.
        detail: [`${plural(n, "fund record", "fund records")} in ${plural((row.sources || []).length, "Form N-PX filing", "Form N-PX filings")}`, ...notes].join(" · "),
        about,
        links: (row.sources || []).map((u, i) => ({ href: u, label: `${family} Form N-PX filing ${i + 1}` })),
      };
    },
  };

  // ---------- Policymaker lens: recurring asks (Phase 4) ----------
  // Floor proposals (raised at the meeting; proxy votes couldn't be cast on them), as votes.js detects them:
  // "floor" in the id, source, label or support note, or a title saying it was presented at the meeting.
  const isFloor = (p) => /floor/i.test(`${p.id} ${p.source_url || ""} ${p.label || ""} ${p.support_note || ""}`) || /presented at the meeting/i.test(p.title || p.label || "");
  // Proposals with this ask, up to the year scrubber's year when it is set (ctx.upto), so text matches the graph.
  const askProposals = (n, ctx) => ctx.nodes.filter((p) => p.kind === "proposal" && p.ask_id === n.id && (!ctx.upto || Number(p.year) <= ctx.upto));
  // Coverage roll-up for an ask from data/coverage.json: full -> covered; any partial -> partially covered;
  // only "none" entries -> no rule in this map; no entries -> not yet assessed (absence is never "no rule").
  function askCoverage(n, ctx) {
    const entries = ((ctx.coverage && ctx.coverage.entries) || []).filter((e) => e.ask_id === n.id);
    const unreviewed = entries.some((e) => !e.reviewed);
    if (!entries.length) return { kind: "cov-unknown", label: "Coverage not yet assessed", entries, unreviewed: false };
    if (entries.some((e) => e.coverage === "full")) return { kind: "cov-covered", label: "Covered by a rule in this map", entries, unreviewed };
    const partial = entries.filter((e) => e.coverage === "partial");
    if (partial.length) {
      const notYet = partial.every((e) => e.policy_status && e.policy_status !== "in force");
      return { kind: "cov-partial", label: `Partially covered${notYet ? " (not yet in force)" : ""}`, entries, unreviewed };
    }
    return { kind: "cov-none", label: "No rule in this map reaches this", entries, unreviewed };
  }
  // Dual-class figures: notes that mention dual/multi-class voting or class B shares ("single class" isn't).
  const isDualClass = (p) => /dual|multi-class|class b/i.test(p.support_note || "") && !/single class/i.test(p.support_note || "");
  // Figures this site computed from 8-K vote counts (the 8-K states no percentage).
  // Also when the company states a percentage that differs from the figure recorded here (e.g. 2.4% vs 2.45).
  const isComputed = (p) => {
    const note = p.support_note || "";
    if (/not stated|raw counts|counts only|no company percentage|gives no percentage|no percentage|8-k counts|item 5\.07|computed/i.test(note)) return true;
    const m = note.match(/reports ([\d.]+)%/i);
    return !!m && Math.abs(Number(m[1]) - Number(p.support_pct)) > 0.01;
  };
  function askActions(n, ctx) {
    const out = [];
    const props = askProposals(n, ctx);
    const cos = new Set(props.map((p) => p.company));
    const years = props.map((p) => Number(p.year)).filter(Boolean).sort((a, b) => a - b);
    const span = years.length ? (years[0] === years.at(-1) ? `${years[0]}` : `${years[0]}–${years.at(-1)}`) : "";
    const by = (st) => props.filter((p) => p.status === st && !isFloor(p)).length;
    const floor = props.filter(isFloor).length;
    const parts = [[by("voted"), "voted"], [by("upcoming"), "upcoming"], [by("excluded"), "excluded"], [by("withdrawn"), "withdrawn"], [floor, "raised from the floor"]].filter(([k]) => k).map(([k, t]) => `${k} ${t}`);
    out.push({ text: `${plural(props.length, "proposal", "proposals")} at ${plural(cos.size, "company", "companies")}${span ? ", " + span : ""}${parts.length ? ": " + parts.join(", ") : ""}${ctx.upto ? ` (up to ${ctx.upto}, as the year slider shows)` : ""}.` });
    // Support by year: voted, non-floor proposals with a figure and a linked results filing. The average is
    // the owner's spec for this lens (an exception to the site's no-average rule, recorded in DESIGN.md).
    const voted = props.filter((p) => p.status === "voted" && !isFloor(p) && p.support_pct != null);
    const linked = voted.filter((p) => p.results_url);
    const yearsV = [...new Set(linked.map((p) => Number(p.year)))].sort((a, b) => a - b);
    for (const y of yearsV) {
      const v = linked.filter((p) => Number(p.year) === y).map((p) => Number(p.support_pct)).sort((a, b) => a - b);
      const avg = (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1);
      const ps = linked.filter((p) => Number(p.year) === y).sort((a, b) => a.support_pct - b.support_pct);
      out.push({
        text: v.length === 1 ? `${y}: 1 vote, ${v[0]}%` : `${y}: ${v.length} votes, ${v[0]}%–${v.at(-1)}%, average ${avg}%`,
        links: ps.map((p) => ({ href: p.results_url, label: `${p.company} ${p.support_pct}%${isDualClass(p) ? " (dual-class)" : ""}` })),
      });
    }
    if (linked.length) {
      const dual = linked.filter(isDualClass).length;
      const left = voted.length - linked.length;
      const comp = linked.filter(isComputed).length;
      out.push({ text: `Averages are computed by this site from the figures as recorded${comp ? `; ${comp} of ${linked.length} ${linked.length === 1 ? "figure" : "figures"} ${comp === 1 ? "was" : "were"} computed from 8-K vote counts` : ""}. Notes are in Proposals.${dual ? ` ${dual} of these figures ${dual === 1 ? "is" : "are"} dual-class (counted by votes cast).` : ""}${left ? ` ${plural(left, "vote", "votes")} without a linked results filing ${left === 1 ? "is" : "are"} left out.` : ""}` });
    }
    // Coverage, one line per entry.
    const c = askCoverage(n, ctx);
    if (!c.entries.length) out.push({ text: "Coverage: not yet assessed." });
    c.entries.forEach((e) => {
      if (e.coverage !== "none" && !e.graph_id) {
        out.push({ text: `${e.policy_id || "A policy not in this map"} (${e.policy_status || "status not recorded"}): ${e.coverage === "full" ? "covers" : "partially covers"} this ask. ${e.note || ""}`, href: e.source_url || null, hrefLabel: "source", needsSource: true });
        return;
      }
      if (e.coverage === "none") {
        out.push({ text: `No requirement found. ${e.note || ""}`, href: e.source_url || null, hrefLabel: "source", needsSource: true });
        return;
      }
      const pol = ctx.byId.get(e.graph_id);
      out.push({ text: `${pol ? pol.label : e.policy_id} (${e.policy_status || "status not recorded"}): ${e.coverage === "full" ? "covers" : "partially covers"} this ask. ${e.note || ""}`, href: e.source_url || null, hrefLabel: "source", needsSource: true });
    });
    if (c.unreviewed) out.push({ text: "Coverage is this site's reading, not yet confirmed by a person." });
    // Company actions in the Causality map that mention this ask (ask's match terms), at companies that got it.
    const terms = (n.match || []).map((t) => String(t).toLowerCase()).filter(Boolean);
    const coIds = new Set(ctx.nodes.filter((x) => (x.kind === "company" || String(x.kind).startsWith("tier-")) && cos.has(x.ticker)).map((x) => x.id));
    // Labs a company owns ("parent company" edges) count as that company.
    ctx.links.forEach((l) => { if (l.relation === "parent company" && coIds.has(end(l.source))) coIds.add(end(l.target)); });
    const seen = new Set();
    const acts = [];
    ctx.links.forEach((l) => {
      if (l.relation !== "acted in" || !coIds.has(end(l.source))) return;
      const ev = ctx.byId.get(end(l.target));
      // Only events in the companies or labs lanes are company actions (not investor campaigns or news).
      if (!ev || seen.has(ev.id) || !["companies", "labs"].includes(ev.lane)) return;
      const text = `${ev.label} ${ev.description || ""}`.toLowerCase();
      if (!terms.some((t) => text.includes(t))) return;
      seen.add(ev.id);
      const who = ctx.byId.get(end(l.source));
      acts.push({ text: `${who ? who.label : ""}: ${ev.label} (${ev.ev_kind || "event"}, ${ev.date || "date not recorded"})`, href: ev.source_url || l.source_url || null, hrefLabel: "source", needsSource: true });
    });
    if (acts.length) { out.push({ text: "Company actions in the Causality map that mention this ask:" }); out.push(...acts); }
    else out.push({ text: "No Causality map events at these companies mention this ask." });
    return out;
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
      feed: FEED,
      sizeLabel: "how many AI proposals each company has had",
      // Plain-language intro for the graph view of this lens.
      // Plain names for the key in this lens.
      kindLabels: {
        "tier-chips": "Chip makers",
        "tier-datacenters": "Data centers and power",
        "tier-cloud": "Cloud providers",
        "tier-labs": "AI model makers",
        "tier-capital": "Big investors in AI",
        "tier-consumer": "AI in consumer products",
        "tier-business": "AI sold to businesses and governments",
        lab: "AI model makers",
        company: "Company",
        proposal: "Shareholder proposal",
      },
      plainIntro: (shown, total) => `Showing ${shown} of ${total} circles (companies, proposals and AI model makers). Bigger circles are companies with more AI proposals. Companies are grouped by their main role in AI, as this site reads it. Click any circle for details.`,
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
      // Recurring asks (asks.json) are added as nodes in this lens (graph.js setAsks), with coverage edges.
      asks: true,
      sizeLabel: "number of proposals with this ask (asks); proposals drawn small",
      actionsHeading: "Same topic",
      actionsHeadingFor: (n) => (n.kind === "ask" ? "This ask" : "Same topic"),
      measure: { label: "Proposals with this ask", value: (n, ctx) => (n.kind === "ask" ? askProposals(n, ctx).length : null) },
      defaults: { hiddenKinds: [...FILERS, "person", "public"], orphans: false },
      size(n, ctx) {
        if (n.kind === "ask") return 7 + Math.sqrt(askProposals(n, ctx).length) * 3.2;
        if (n.kind === "proposal") return 3;
        return null;
      },
      rings(n, ctx) {
        if (n.kind !== "ask") return [];
        const c = askCoverage(n, ctx);
        return [{ kind: c.kind, text: `${c.label}${c.unreviewed ? " (this site's reading, not yet confirmed by a person)" : ""}` }];
      },
      actions(n, ctx) {
        if (n.kind === "ask") return askActions(n, ctx);
        if (n.kind !== "proposal" || !n.topic) return [];
        const same = byTopic(ctx).get(n.topic) || [];
        const cos = new Set(same.map((p) => p.company));
        const years = same.map((p) => p.year).filter(Boolean).sort();
        const span = years.length ? (years[0] === years.at(-1) ? `${years[0]}` : `${years[0]}–${years.at(-1)}`) : "";
        const out = [{ text: `${n.topic}: ${plural(same.length, "proposal", "proposals")} at ${cos.size} ${cos.size === 1 ? "company" : "companies"}${span ? ", " + span : ""}` }];
        const voted = same.filter((p) => p.support_pct != null && p.results_url && !isFloor(p)).map((p) => p.support_pct).sort((a, b) => a - b);
        const note = "Some figures are computed from the 8-K's vote counts; notes are in Proposals.";
        if (voted.length === 1) out.push({ text: `Support where an 8-K reports the vote: ${voted[0]}% (1 proposal). ${note}` });
        else if (voted.length > 1) out.push({ text: `Support where an 8-K reports the vote: ${voted[0]}%–${voted.at(-1)}% across ${voted.length} proposals. ${note}` });
        return out;
      },
    },
  };
})();

// Rule-based settings the views read, kept apart from page copy so they can be checked and edited in one place.
// Nothing here is a legal or regulatory fact. Phase 2 adds deadline and resubmission settings here.

(function () {
  // Edge confidence: how directly the source behind a connection supports it.
  //   verified: the edge has a source URL on a domain not listed below (SEC filings, the filer's or
  //             company's own site, coalition pages).
  //   reported: the source URL is on a listed secondary domain (news sites, law blogs, data aggregators),
  //             or the edge's own text says UNVERIFIED.
  //   inferred: the edge has no source URL. Today these are all "co-filed with" edges, derived from two
  //             filers appearing on the same proposal.
  // The domain list is this site's judgement, not a standard. Edit it freely; a domain matches itself
  // and its subdomains (news.bloomberglaw.com matches bloomberglaw.com).
  const SECONDARY_DOMAINS = [
    "techcrunch.com",
    "siliconangle.com",
    "boardroomalpha.com",
    "bloomberglaw.com",
    "ballotpedia.org",
    "corpgov.law.harvard.edu",
    "euronews.com",
    "ciodive.com",
    "minerva.info",
    "computing.co.uk",
    "techrepublic.com",
    "esgtoday.com",
    "dealroom.co",
    "reuters.com",
    "lightreading.com",
    "cnbc.com",
    "npr.org",
    "thenextweb.com",
    "outlookbusiness.com",
    "theregister.com",
    "fortune.com",
    "bloomberg.com",
    "insurancejournal.com",
    "morningstar.com",
    "ai-cio.com",
    "greenmoney.com",
    "impactalpha.com",
    "techpolicy.press",
    // Law-firm client alerts: a firm's reading of a rule, not the rule itself.
    "jonesday.com",
    "cohenmilstein.com",
    "seyfarth.com",
    "cuatrecasas.com",
    "gibsondunn.com",
    "wiley.law",
    "mofo.com",
    // Aggregators and trackers.
    "ncsl.org",
  ];

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return ""; }
  }
  const isSecondary = (url) => {
    const h = hostOf(url);
    return SECONDARY_DOMAINS.some((d) => h === d || h.endsWith("." + d));
  };

  // Returns { level, text } for an edge (graph.json edge fields: type, source_url, description, position).
  function edgeConfidence(e) {
    const type = e.type || e.relation || "";
    const said = `${type} ${e.description || ""} ${e.position || ""}`;
    if (type === "missing") return { level: "inferred", text: "none in this dataset" };
    if (type === "asks for") return { level: "inferred", text: "grouped by this site (asks.json)" };
    if (!e.source_url) return { level: "inferred", text: type === "co-filed with" ? "inferred from co-filing" : "inferred" };
    if (/UNVERIFIED/i.test(said) || isSecondary(e.source_url)) return { level: "reported", text: "reported" };
    return { level: "verified", text: "verified" };
  }

  // ---------- Proposal deadlines ----------
  // Deadlines are read from the proxy statement's own sentence (filing_deadline on proposals,
  // next_proposal_deadline on companies, each with a _source URL). Nothing here computes a deadline.
  // "Today" is the calendar date in US Eastern time, the zone SEC filing deadlines are stated in.
  const DEADLINE_TZ = "America/New_York";
  // The countdown arc is full at this many days left or more, and empty at 0.
  const WINDOW_FULL_DAYS = 90;

  function todayISO(now = new Date()) {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", { timeZone: DEADLINE_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  }
  const dayNum = (iso) => {
    const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
    return Date.UTC(y, m - 1, d) / 86400000;
  };
  // { date, days, frac, source } while the deadline is today or later; otherwise null.
  function deadlineInfo(node) {
    const date = node.filing_deadline || node.next_proposal_deadline;
    if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) return null;
    const days = dayNum(date) - dayNum(todayISO());
    if (days < 0) return null;
    return { date: date.slice(0, 10), days, frac: Math.min(1, days / WINDOW_FULL_DAYS), source: node.filing_deadline_source || node.next_proposal_deadline_source || null, company: !node.filing_deadline };
  }

  // ---------- Resubmission thresholds ----------
  // This site's reading of SEC Rule 14a-8(i)(12) as amended in 2020 (17 CFR 240.14a-8(i)(12);
  // https://www.ecfr.gov/current/title-17/section-240.14a-8). VERIFY against the current rule before relying
  // on it: the thresholds can change, and changes to Rule 14a-8 have been proposed.
  // A company may exclude a proposal on substantially the same subject as earlier proposals voted on in the
  // preceding 5 calendar years, if the most recent vote was within the preceding 3 calendar years and got
  // less than 5% (voted once in those 5 years), 15% (twice) or 25% (three or more times).
  // The rule counts support as For / (For + Against); a support_note on the data flags a different basis.
  const RESUBMISSION_THRESHOLDS = [5, 15, 25];
  const LOOKBACK_YEARS = 5;
  const RECENT_YEARS = 3;
  // "At risk" covers support at the threshold or up to this many points above it (owner's spec: 3 points).
  const AT_RISK_MARGIN = 3;

  // votes: every vote on one subject at one company, as { year, pct } (lenses.js joins the chain across
  // proposals). opts: { pending: true, year } for a proposal on the ballot and not yet voted on, and
  // meetingDate (ISO) of the latest meeting, used to find the next meeting that hasn't happened yet.
  // Returns null, or { state: "at-risk" | "below", pending, last, needs, count, meetingYear, margin }.
  function resubmission(votes, opts = {}, now = new Date()) {
    const v = (votes || []).filter((x) => x && x.year && x.pct != null && !Number.isNaN(Number(x.pct))).sort((a, b) => a.year - b.year);
    if (!v.length) return null;
    const last = v.at(-1);
    const today = todayISO(now);
    let meetingYear;
    if (opts.pending) meetingYear = opts.year + 1;
    else {
      // The next meeting after the last vote that hasn't happened yet (same month and day as the last meeting,
      // when its date is known; otherwise the later of next year and this year).
      // A meeting whose proposal deadline has passed can't take a refile, so when the company's next proposal
      // deadline is known (next_proposal_deadline), the meeting must fall after it.
      const md = opts.meetingDate ? String(opts.meetingDate).slice(4, 10) : null;
      const after = opts.nextDeadline && opts.nextDeadline > today ? opts.nextDeadline : today;
      meetingYear = last.year + 1;
      if (md) { while (`${meetingYear}${md}` < after) meetingYear++; }
      else meetingYear = Math.max(meetingYear, Number(today.slice(0, 4)));
    }
    // The rule applies only if the last vote was in the RECENT_YEARS calendar years before that meeting.
    const lastYear = opts.pending ? opts.year : last.year;
    if (meetingYear - lastYear > RECENT_YEARS) return null;
    // Votes in the LOOKBACK_YEARS calendar years before that meeting; a pending vote counts as one of them.
    const count = v.filter((x) => x.year >= meetingYear - LOOKBACK_YEARS && x.year < meetingYear && !(opts.pending && x.year === opts.year)).length + (opts.pending ? 1 : 0);
    if (!count) return null;
    const needs = RESUBMISSION_THRESHOLDS[Math.min(count, RESUBMISSION_THRESHOLDS.length) - 1];
    const pct = Number(last.pct);
    // A proposal on the ballot was eligible, so it is never "below"; it is "at risk" when its last vote on the
    // subject is under, or within AT_RISK_MARGIN points above, the bar that applies after this vote.
    let state = null;
    if (pct < needs && !opts.pending) state = "below";
    else if (pct <= needs + AT_RISK_MARGIN) state = "at-risk";
    if (!state) return null;
    return { state, pending: !!opts.pending, last: { year: last.year, pct }, needs, count, meetingYear, margin: Math.round((pct - needs) * 100) / 100 };
  }

  window.RULES = {
    SECONDARY_DOMAINS, edgeConfidence,
    DEADLINE_TZ, WINDOW_FULL_DAYS, todayISO, deadlineInfo,
    RESUBMISSION_THRESHOLDS, LOOKBACK_YEARS, RECENT_YEARS, AT_RISK_MARGIN, resubmission,
  };
})();

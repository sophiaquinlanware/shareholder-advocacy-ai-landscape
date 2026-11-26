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
    if (!e.source_url) return { level: "inferred", text: type === "co-filed with" ? "inferred from co-filing" : "inferred" };
    if (/UNVERIFIED/i.test(said) || isSecondary(e.source_url)) return { level: "reported", text: "reported" };
    return { level: "verified", text: "verified" };
  }

  window.RULES = { SECONDARY_DOMAINS, edgeConfidence };
})();

// Company roles in AI: one main role per company, plus any other roles it also plays.
// Owner (2026-11-26) asked for categories that don't overlap, keeping Frontier labs, after research into how
// regulators, competition authorities and investors classify AI companies (plan:
// docs/plans/2026-11-26-company-roles.md). The research pointed to classifying by role in the AI value chain
// (EU AI Act provider vs deployer; UK CMA and OECD value-chain layers; investor developer/deployer guidance),
// and splitting deployers by who is affected: the public, or organisations.
//
// Roles are derived from data the data session already sourced: each company's value-chain tier ("tier",
// "tiers" in data/companies.json) and its consumer/enterprise tags ("sectors"). Nothing here is new research.
// The classification is this site's reading. Edit the overrides below to change a company's role.

(function () {
  const ROLES = [
    { id: "labs", label: "Frontier labs", about: "Develop and release the most capable general-purpose models." },
    { id: "chips", label: "Chips and hardware", about: "Design or make the chips and hardware AI runs on." },
    { id: "datacenters", label: "Data centers and power", about: "Build and power the physical capacity AI needs." },
    { id: "cloud", label: "Cloud and model platforms", about: "Rent out computing power and offer other companies' models." },
    { id: "consumer", label: "Consumer products", about: "Put AI in front of the public: feeds, devices, assistants, media, cars." },
    { id: "business", label: "Business and government products", about: "Sell AI built into tools for organisations, including policing and defence." },
    { id: "capital", label: "Strategic investors", about: "Fund frontier labs or AI infrastructure as a main role." },
  ];
  // Value-chain tier -> role. Deployers are split below.
  const FROM_TIER = { labs: "labs", chips: "chips", datacenters: "datacenters", compute: "cloud", capital: "capital" };
  // Calls this site makes where the data tags a company both consumer and enterprise (this site's reading).
  const OVERRIDES = {
    // Main role by where most of its AI reaches people.
    adobe: "business", // creative and document tools sold mainly to professionals and businesses
    intuit: "consumer", // TurboTax and Credit Karma reach individuals
    "beijing-baidu-network-technology": "consumer", // search and the Ernie assistant
    "tencent-holdings": "consumer", // WeChat and consumer apps
    tesla: "consumer", // its cars; its xAI stake is kept as a secondary role
  };
  const byId = (id) => ROLES.find((r) => r.id === id);

  function deployerRole(c) {
    const s = c.sectors || [];
    const consumer = s.includes("consumer AI");
    const enterprise = s.includes("enterprise AI");
    if (consumer && !enterprise) return "consumer";
    return "business";
  }
  // Main role id for a company record from data/companies.json.
  function roleOf(c) {
    if (!c) return null;
    const key = String(c.id || "").toLowerCase();
    const o = Object.keys(OVERRIDES).find((k) => key === k || key.startsWith(k));
    if (o) return OVERRIDES[o];
    if (c.tier === "deployers") return deployerRole(c);
    return FROM_TIER[c.tier] || null;
  }
  // Other roles the company also plays, from its other tiers and its consumer/enterprise tags.
  function alsoOf(c) {
    if (!c) return [];
    const main = roleOf(c);
    const out = new Set();
    (c.tiers || []).forEach((t) => {
      if (t === "deployers") {
        if ((c.sectors || []).includes("consumer AI")) out.add("consumer");
        if ((c.sectors || []).includes("enterprise AI")) out.add("business");
      } else if (FROM_TIER[t]) out.add(FROM_TIER[t]);
    });
    if (main === "consumer" || main === "business") {
      if ((c.sectors || []).includes("consumer AI")) out.add("consumer");
      if ((c.sectors || []).includes("enterprise AI")) out.add("business");
    }
    out.delete(main);
    return ROLES.filter((r) => out.has(r.id)).map((r) => r.id);
  }
  // For a graph node with no company record: its tier alone (deployers count as business products).
  const roleOfTier = (t) => (t === "deployers" ? "business" : FROM_TIER[t] || null);
  window.ROLES = { list: ROLES, byId, roleOf, alsoOf, roleOfTier, label: (id) => (byId(id) || {}).label || "" };
})();

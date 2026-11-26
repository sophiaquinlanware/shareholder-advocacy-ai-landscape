# Plan: one company classification site-wide (roles)

Owner (2026-11-26): "I feel like there is overlap between frontier labs and the consumer v enterprise AI. Can you find your own categories … look online and act as a researcher … keep frontier labs." Then: "use this to differentiate companies throughout the UI from now on, including in all other modules."

**Research (sources in the session report):**
- the EU AI Act's provider vs deployer roles;
- the UK CMA's and the OECD's value-chain layers (inputs, foundation-model developers, deployment);
- investor stewardship guides on developers vs deployers (Amundi; WEF/CPP Investments);
- the industry's three-layer AI stack (infrastructure, models, applications).

The lessons: classify by main role, with other roles as secondary, and split deployers by who is affected.

**Categories:** Frontier labs; Chips and hardware; Data centers and power; Cloud and model platforms; Consumer products; Business and government products; Strategic investors.

**Build:**
- **roles.js** derives each company's role from the data session's sourced `tier` and `tiers`, splitting deployers by the consumer/enterprise tags. Four overrides (Adobe, Intuit, Baidu, Tencent; Tesla to consumer) are stated in comments, and the classification is "this site's reading".
- **Where it's used:**
  - the network key, colours and column ("Value chain, by role");
  - Company lookup (filter and detail);
  - Rights map (filter and column);
  - Lab pathways (tier tags and order);
  - Value chain tab (flow columns; the per-tier rows read "Consumer and business products" for deployers);
  - the Individual lens's plain key names.
- **Network tab renamed** "AI advocacy network" (owner asked), with `#network` unchanged.
- **Membership dates:** "member of" edges with `as_of` show "listed as a member as of {month year}".

**Not reviewed by subagents:** these are mechanical mappings from reviewed data, with the overrides stated. The check passed.

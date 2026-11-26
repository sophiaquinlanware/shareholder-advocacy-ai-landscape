REVIEWER: Data accuracy SCORE: 72 VERDICT: REVISE

Scope: all 97 new people and the 12 changed ones in data/people.json, branch data/contacts-expansion, against main. I fetched every profile_url with curl (PDFs parsed with pypdf). Where a page was blocked or built in JavaScript, I used WebFetch or WebSearch: Parnassus, Nuveen, Mercy, the WBA team page (page 3), EOS, Dimensional, AllianzGI and PRI. About 95 of the 109 titles match their source. No em dashes, and neither "genuinely" nor "real" appears. One en dash is copied from WBA (nicholas-sewe).

TOP FAILURES
1. **A vote figure is presented as fact.** susan-francois says "56% non-insider support". That is the proponents' own estimate (csjp.org, 2026-02-25 follow-up). The 8-K gives 12.47% (pltr-2026-5 in proposals.json), and the site's support_note says Class A support is "not reported". This breaks Never claim 5.
2. **People are attached to the wrong organization.** antonia-parkes and ashley-kopczynski have org_id RIAA. The RIAA page only lists them as working-group co-chairs, from AustralianSuper and IFM Investors. graph.js will draw a false "works at RIAA" link for each.
3. **Some titles and claims go beyond their sources.**
   - aaron-acosta: his bio says "As a Program Director", and no source says Senior Director.
   - magdalena-kettis: the Nordea report puts her on the IPDD management committee, not CHRB.
   - marian-macindoe: the "role not confirmed since 2025" caveat was dropped. The only source is GreenMoney, Sept 2025 ("a managing director"), and "Sustainable Investment Strategy" is not on that page.
   - carine-smith-ihenacho: the NBIM release (1 Oct 2026) does not say "role abolished, no successor".
   - antje-stobbe: her URL returns 503, and the AI voting category found is in the 2025 policy, not the 2026 one.
   - barbara-mccracken: her page never mentions shareholder work.
   - liza-mcdonald: the RIAA piece is not sourced.

TOP IMPROVEMENTS
1. **Better profile_urls for Rydzak and the Vanguard pair.** jan-rydzak's correction is right: RDR's own team page lists him as Executive Director. His profile_url is still the 2025 WBA page, which does not name him. glenn-booraem and carolyn-cross: the SAI PDF confirms "Investment Stewardship Officer" but not who leads VCMIS or VPMIS. Vanguard's "names leaders of new investment stewardship programs" release does.
2. **Add an ai_source_url field.** Many ai_focus lines rely on pages other than profile_url (juana-lee and Shopify, stuart-riddick's abrdn AI article, dan-grandage). They checked out where I tested them, but a reader can't trace them.
3. **Fix duplicate org_ids.** Older entries use parnassus-investments, mercy-investment-services, trillium-asset-management, northstar-asset-management and norges-bank-investment-management. New entries use the graph ids (parnassus, mercy, trillium, northstar, nbim), so the old ones don't link in graph.js. ICCR also appears under two org_name spellings.

OUT-OF-FIELD NOTES
- **People who are not engagement leads:**
  - anousha-p coordinates a platform-workers project.
  - alan-hall's title, "Executive Officer, Shared Services", is an admin role, and the source is a 2025 quote.
  - cambria-allen-ratzlaff (PRI) and estelle-parker (RIAA) head membership networks.
  - The owner should decide whether these stay.
- carine-smith-ihenacho leaves in five weeks. Plan to remove her in January 2027.
- **Confirmed by search, not by a direct fetch:** tyler-mccullough, sophie-haywood, amy-obrien, jeffrey-warshauer and bruce-duguid. Their pages block curl, and the titles match search snippets of their own pages.

CONTENT RULES: FAIL (Never claim 5: susan-francois 56%). Everything else passes.

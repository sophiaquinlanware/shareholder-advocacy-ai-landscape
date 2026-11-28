# Coalition records and investor-reported engagements: result review, data accuracy

The changes under review:
- 67 coalition rows in `data/network.json` `engagements`.
- 21 "engaged directly" edges reported by investors, plus Ceres and VWFI ties (VWFI is the Valuing Water Finance Initiative) and 23 VWFI signatory edges.
- A build change that labels each link by what its source shows.

## Round 1: 78, REVISE

The reviewer opened every source type and checked 27 engagement rows, 9 signatory edges, the Parnassus edge and 6 engaged-directly edges. Every `members_named` entry checked appears in its source.

What failed, and the fix applied to each:

1. **IAHR (Investor Alliance for Human Rights) RDR (Ranking Digital Rights) rows (8) said "AI accountability".** The source doesn't say that. The wording was removed, and the topic is now "digital rights engagement (Ranking Digital Rights Big Tech Scorecard)".
2. **BNP Paribas → Meta was typed "engaged directly".** The source says BNP Paribas "continued to seek a meeting". The edge is now "sought engagement".
3. **Dates.**
   - NEI → Amazon: now dated 2023 (a July meeting, inferred from a story published in Q1 2024).
   - Green Century: the date was removed, because the source gives none.
   - Palantir annual meeting: changed to 06.03.26.

Also fixed in round 1:
- **IAHR 2023 and 2024 rows** now use the source's verb, "announced member filings at".
- **ICCR (Interfaith Center on Corporate Responsibility) Amazon 2023** now lists 3 co-filers, adding the Midwest Capuchins.
- **ICCR Amazon 2026** names As You Sow and Mercy as co-leads.
- **WBA (World Benchmarking Alliance) Apple** wording now matches the progress report.
- **RJI (Racial Justice Investing)** is listed the same way in all three rows, with a note that the SEC text garbles the name Ekō.
- **Parnassus:** the page reference is now p. 8.
- **Vermont:** a note on its signatory edge explains the name difference.

## Round 2: 83, PASS

Every round 1 fix passed. The reviewer also spot-checked these edges against their sources, and all passed:
- Federated Hermes EOS
- Trillium
- Nordea
- Candriam
- Ceres Investor Network → Ceres

What round 2 raised:

1. **Palantir date.** The reviewer read the date as 06.04.26. Not changed, because ICCR's page puts each "AGM Date" before its company: "AGM Date: 06.03.26. Palantir: Human Rights Impact Assessment". The 06.04.26 that follows belongs to the next company, EMCOR. 06.03.26 stays.
2. **Nordea and Candriam → Alphabet.** Their sources describe a collective investor letter. Fixed: these edges are now "joined an investor letter to".
3. **Trillium → Alphabet had a step date the source doesn't give.** Fixed: the date was removed.

Also applied in round 2:
- The Ekō note was added to the Microsoft 2025 row.
- The NEI step wording was made clearer.

## Left for the UI session

graph.js has no line style or Key entry for "sought engagement" or "joined an investor letter to", so for now these draw as plain lines.

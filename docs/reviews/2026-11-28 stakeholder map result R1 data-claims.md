# Stakeholder map data: result review R1, data accuracy and claims

**Score:** 77/100, REVISE.

## What was checked

The reviewer checked 96 of the 155 ties and all 33 organization descriptions. Each source was fetched and the tie's quote matched against it as a string.
- 150 of the 155 quotes are verbatim in their sources.
- The other five are near-verbatim.

Confirmed against their sources:
- CAIS's critique of Anthropic, dated 2026-11-18.
- The signer lists for Seoul, the EU code, the White House fact sheets, Thorn, PAI and the Frontier Model Forum.
- The Earthjustice tie.
- The framework dates.
- No organization's signature is inferred from an individual's affiliation.

## Fixes applied

- **Dropped:**
  - CDT "critique" of the Senate vote that struck the moratorium. The source shows CDT opposed the moratorium itself.
  - Common Sense Media "publicly supported" SB 243. Its support was for the bill as introduced and was withdrawn before passage.
  - SELC 2025-12-19. The quote criticises the Georgia commissioners, not Southern Company.
  - The NIST-sourced copies of the two duplicate UK AISI evaluations.
  - The Amazon frontier framework response. Its only source was a paper that cites the framework.
- **Quotes corrected:**
  - SELC 2025-12-12: now "The only guarantee is a dirtier South".
  - CAISI's evaluation of Zhipu.
  - The Thorn principles, now the full sentence.
  - The Stanford HAI index tie, now sourced to HAI's own article, with its note fixed.
- **Notes and dates:**
  - The four SB 53 coalition-letter ties now note that the support was for the July 17 version, signed by named individuals on behalf of their organizations.
  - The Encode RAISE date is removed.
  - AJL dates added: 2018 and 2019.
  - The original Seoul signatures are dated 2024-05-21. The later additions carry no date.
- **Fields:**
  - The chain-of-thought paper has no organizational actors; its summary says the authors sign as individuals.
  - Response actors are now node ids.
- **Build:** now rejects duplicate ties.

## Result

149 ties, 33 organizations, 27 responses.

## Round 2: 84, PASS

The reviewer re-opened every changed source. All the corrected quotes and dates hold:
- CAISI on Zhipu
- Stanford HAI, dated 2025-12-09
- SELC
- Thorn
- AJL (2018 and 2019)
- Seoul (2024-05-21 for the 15 original signers, no date for the later ones)

The reviewer also confirmed that response actors resolve to node ids and that the dropped ties are gone.

Applied after round 2:
- **Notes:** three notes that contradicted their own data were rewritten (the chain-of-thought paper summary, the CAISI note, the Encode note).
- **CAISI quote:** the apostrophe now matches the source's curly one.
- **Duplicate check:** the build now also rejects duplicates that share a source URL.
- **Actor check:** the build now checks that every response actor is a node id.

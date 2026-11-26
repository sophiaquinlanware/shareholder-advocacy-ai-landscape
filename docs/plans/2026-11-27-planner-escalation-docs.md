# Plan: escalation step and drafted documents in "Plan an engagement"

Date: 2026-11-27. UI session (planner.js is the data session's; this adds `planner-docs.js` plus a small hook in planner.js, agreed by message).

## The owner's words

"…where, if you choose all the tabs, you plan an engagement. You can press a button that's like 'Save to PDF,' and it creates for you a plan of engagement with all the contextual information about past engagements. It helps write up your ask … The end output is either: a proposal for a coalition, a proposal directly to a company, a letter … Have part of planning an engagement be 'Evaluate level of escalation' … save as a PDF the output they want, either if it's an email or it's a shareholder proposal in the format that you see shareholder proposals online … Think outside the box here."

## Sources for the escalation ladder

- PRI, collaborative engagement handbook: preparation, dialogue and follow-up, escalation where needed, conclusion; agree escalation strategies in advance (https://www.unpri.org/download?ac=4156). PRI stewardship guide: if engagement is unsuccessful, investors may consider filing shareholder resolutions (https://www.unpri.org/download?ac=12686).
- Pension Protection Fund stewardship escalation policy: private letter to management or board, votes against management, then public steps (AGM statements, a filed resolution) (https://ppf.co.uk/-/media/PPF-Website/Files/Responsible-Investment/Reporting-transparently/PPF_Stewardship_Escalation_Policy.pdf).
- SEC Rule 14a-8, current text: 500-word limit for the proposal and supporting statement; ownership of $2,000 for three years, $15,000 for two or $25,000 for one; a written statement of the shareholder's availability to meet; proof of ownership (https://www.law.cornell.edu/cfr/text/17/240.14a-8).

## What gets built

1. **"Evaluate the level of escalation"** card, after the record cards. It shows seven rungs, each with what this site's data shows at the chosen company for the chosen ask:
   1. Email or letter to investor relations;
   2. Meeting with management;
   3. Letter to the board;
   4. Collaborative engagement (coalition or co-filers);
   5. Public step (exempt solicitation, AGM statement);
   6. Shareholder proposal (Rule 14a-8);
   7. Votes against directors.

   It also states the **furthest step on record** at this company for this ask: a filed proposal (with year and support), an exempt solicitation or a reported direct engagement. It says that private engagement is mostly not public. These are facts only: the reader picks the rung, and nothing recommends one.
2. **"Draft a document"** card. Pick an output, and an editable draft is written from the plan's data:
   - **Email to the company** (investor relations), asking for a dialogue;
   - **Letter to the board** (chair or lead independent director);
   - **Proposal for a coalition** (an invitation to co-file or co-sign), listing organizations on record and a timeline to the filing deadline;
   - **Shareholder proposal** in Rule 14a-8 form: title, Whereas clauses built from the record, Resolved clause, supporting statement, a live 500-word count and a filing checklist;
   - **Engagement plan**: objective, context with sources, an escalation path dated from today to the filing deadline and the meeting, people and organizations, and a source list.

   Each draft cites the past proposals on this ask, as the owner asked ("help write up your ask … look at proposals"): the closest past proposal is named and linked, and its summary seeds the Whereas clauses.
3. **Save as PDF**: a print layout prints only the draft sheet (title, body and numbered sources with full URLs), using the browser's "Save as PDF". There are also "Copy text" and "Start again from the data" buttons.

## Wording guard

The drafts are the reader's documents. Each ends with: "Draft prepared from public data on Shareholder advocacy on AI. Check every fact against its source before sending. Not legal advice." Bracketed placeholders cover anything the data can't know (shares held, signatory). Nothing in the escalation card recommends a rung.

## Files

- `planner-docs.js` (new).
- `planner.js`: expose state, and announce each redraw with a `plannerdraw` event.
- `index.html`: a script tag.
- `styles.css`: an appended block, including the print layout.
- `tests/planner-docs.spec.js`.
- `DESIGN.md` and `docs/STATE.md`.

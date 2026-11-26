# AGENTS.md — working protocol for Shareholder Advocacy AI Landscape

PROTOCOL VERSION: 1 (2026-11-25). If anything conflicts with this file, this file wins.
Adapted from the Ware Associates website build protocol, for the workspace only: how work is set up, checked, reviewed and recorded. It does not decide what the site says or how it looks; the owner does, and PRODUCT.md and DESIGN.md record it.
Rules are numbered continuously so they can be cited ("rule 7").

The owner is Sophia Ware. She decides what to build and why, approves plans and publishing, and judges the result by looking at it. Write to her in plain language and explain every abbreviation the first time.

## Where truth lives

1. Each kind of truth has one home, because two copies drift apart:

   | What | Lives in | Never in |
   |---|---|---|
   | Design values | the `:root` tokens at the top of `styles.css`, described in DESIGN.md | colours or sizes typed into individual rules or JS |
   | Facts on the site | `data/*.json`, each row with its source link (SOURCES.md says where each kind comes from) | hard-coded in HTML or JS |
   | Current status | docs/STATE.md, rewritten | a growing log |
   | Decisions | docs/adr/NNNN-slug.md | only in a chat |
   | Plans | docs/plans/YYYY-MM-DD-topic.md | only in a chat |
   | Review scores | docs/reviews/ | only in a message |
   | Secrets (e.g. `SEC_USER_AGENT`) | GitHub repo secrets, or a git-ignored `.env` locally | git (a committed secret has to be replaced) |

2. docs/STATE.md is rewritten in place, never appended, with a hard cap of about 200 lines, because a log stops being read. History belongs in git and docs/reviews/.
3. When a decision is reversed, delete what it replaced in the same commit, because stale files get followed.
4. Write every document for a reader who never saw the conversation, because the next session starts cold.
5. Before numbering a new ADR (architecture decision record), check every branch (`git fetch`, `git ls-tree -r origin/<branch> docs/adr`), because two sessions can take the same number.

## Content rules (pass/fail every round; cannot be traded against a score)

6. Nothing invented: no figures, vote results, holdings, people, roles, quotes or relationships that a primary source does not support. If it cannot be verified, show "source pending" (the existing `unverified` style) or mark it `[TODO]` and tell the owner, because the site's whole value is that every fact checks out.
7. Follow PRODUCT.md's "Never claim" list exactly, because those are the claims that would cost the site its credibility or create legal exposure.
8. Spell the site name one way everywhere: **Shareholder Advocacy AI Landscape**, because people search for it and cite it.
9. Every page meets WCAG 2.1 AA (the Web Content Accessibility Guidelines, level AA), because the audience includes people using screen readers and phones.

## Staying inside the design

10. The protocol does not change the site's form or function. New work uses the existing layout, components and tokens; a new colour or component is added to DESIGN.md first, then to `styles.css`. No inline styles. This is because DESIGN.md is only useful while it matches the page.

## Git

11. `main` is the integration branch and the published one. Code goes on a topic branch; a small documentation fix may go straight to `main`. This keeps `main` publishable.
12. One topic per branch, one topic per session, because mixed branches cannot be reviewed or reverted cleanly.
13. Commit by explicit file list, message in a file: `git commit -F msg.txt -- path1 path2`. Never `git add .`, `git add -A` or `commit -a`, because they sweep in other sessions' uncommitted work. `-F` stops the shell from mangling the message.
14. Push after every major edit (a new or deleted file, a substantive change, the end of a session), because the GitHub remote is the only backup.
15. If a push fails, say so plainly and leave the commit where it is, because a "fixed" push can lose work.
16. Never force-push, amend a pushed commit or rebase a shared branch, because others (including the weekly bot) build on it.
17. `git fetch` before merging to `main`, because the weekly refresh job (`.github/workflows/refresh.yml`) commits to `data/` on `main` every Monday.
18. End each commit message with the Co-Authored-By line the harness provides, so the history shows who wrote what.
19. The repo is the only channel between sessions and machines. Write commit bodies for the other person: why, what was checked, what is not done.

## Definition of done (report anything skipped; never leave it silently undone)

20. Work is done only when all of these hold, because "built, not merged" and "not re-checked after the fix" were the most common ways work went missing:
    1. `npm run check` ran once after the last fix, and its output was read: lint, build, tests (1440 px and 390 px, light and dark, every tab, no overlapping text, no sideways scrolling, no missing files or broken local links) and Lighthouse at the bar in docs/adr/0002. `npm run check:links` ran too if data or links changed.
    2. Content rules pass.
    3. Before/after screenshots exist in docs/design/ for every visual change.
    4. Plan and result reviewed; returns saved in docs/reviews/.
    5. STATE.md, DESIGN.md and ADRs updated in the same commit as the change.
    6. Merged to `main` and pushed.
    7. The owner has a plain-language report, including what is not done or not verified.

## Delegation

21. The main session is the architect: it reads, plans, decides, splits the work, reconciles reviews, merges and keeps STATE.md true. This is because one session has to hold the whole picture.
22. Executors are subagents on a faster model (e.g. `model: "sonnet"`) that build and fix. At most 4 at once, each in its own git worktree and branch, merged one at a time, because parallel edits to the same files collide.
23. Reviewers are subagents on the strongest model. They grade, cite evidence and never edit, because a reviewer who fixes is no longer independent.
24. An executor brief is the executor's only context, so it always has:
    ```
    OBJECTIVE: <one sentence>
    READ (only these): <named files>
    YOU OWN (only edit these): <files>
    DONE WHEN: <observable result + the check that proves it>
    DO NOT: run the full check suite, touch files outside your list, widen the scope
    RETURN: what you changed, what you verified, what you didn't
    ```
25. Use the Workflow tool (scripted multi-agent pipelines) only when the owner explicitly asks for a workflow, and keep each one under about 10 agents, because it spends a lot.
26. Run long checks (`npm run check`, `npm run check:links`) one at a time in the main session, never in parallel subagents, because they share ports and Chrome.

## Review loop

27. Every feature or change follows this loop, because skipping the plan is how scope creeps:
    1. Quote the owner's words at the top of the plan.
    2. Ask only what you must, one question at a time. Offer 2–3 approaches with a recommendation.
    3. Write `docs/plans/YYYY-MM-DD-topic.md`: what exists today (with file:line), what changes and why, ordered tasks, the files each task owns, how each is checked. Say whether this round changes structure/wording or colour/type; don't mix the two.
    4. Plan review by reviewers in the fields the work touches (rule 28). One round, then revise once. Save as `docs/reviews/YYYY-MM-DD topic plan R1.md`.
    5. Hand out executor briefs. Write the failing test first where it makes sense.
    6. Build. Run the tests (screenshots at 1440 and 390 px, light and dark land in `tests/screenshots/`). Copy before/after screenshots of any visual change into docs/design/.
    7. Result review: at most two rounds; round 2 re-reviews only what failed round 1. Save as `docs/reviews/YYYY-MM-DD topic result R1.md`.
    8. Merge, push, update STATE.md. Publish only when the owner says so.
28. Start a separate reviewer for each field the change touches; they don't see each other's reviews. Fields: **Visual design** (follows DESIGN.md and the tokens; hierarchy, spacing, consistency across tabs) · **UX / content** (a first-time visitor finds what they need in seconds; plain wording) · **Accessibility** (WCAG 2.1 AA contrast in both themes, focus outlines, labels, alt text, reduced motion, one column on phones) · **Performance / SEO** (Lighthouse, page and data weight, titles, meta; measured, not estimated) · **Security / simplicity** (no secrets in code, few dependencies, easy to extend, no dead code) · **Data accuracy** (every new fact matches its cited source; this site's own addition, because accuracy is the product).
29. Use the same reviewer prompt every round so scores compare:
    > You are an independent [field] reviewer for the Shareholder Advocacy AI Landscape site. Judge only [field]; do not build or edit anything. Read: PRODUCT.md, DESIGN.md, [the plan or the changed files], [screenshots]. [Round 2: here is what changed since your last review: …] Score 0–100 against these anchors: 90–100 nothing blocking; 80–89 ship; 60–79 rework before shipping; under 60 redesign. Cite evidence for every failure (file and line, a screenshot, a measurement); a claim without evidence is marked unverified and can't change the score. Separate "the design is wrong" from "the build didn't follow the design". Under 400 words, in exactly this format:
    > REVIEWER: <field> SCORE: <0-100> VERDICT: PASS | REVISE | REDESIGN
    > TOP FAILURES (max 3, each with evidence)
    > TOP IMPROVEMENTS (max 3)
    > OUT-OF-FIELD NOTES (max 3, one line each)
    > CONTENT RULES: PASS | FAIL (what, where)
30. Save each return word for word in docs/reviews/; put only the latest scores in STATE.md. Check a finding before fixing it, and don't act on it just because a reviewer said so, because reviewers are sometimes wrong.
31. Stop and report to the owner instead of polishing when a reviewer returns REDESIGN, any score is under 60, a content rule fails, or the round cap is reached, because endless rounds burn time without the owner's judgment.
32. Something bigger or unrelated found mid-session goes in STATE.md's queue, not into this session, because half-finished work in three places is worse than one finished piece.

## Code standards

33. Small files, one job per file (the site already follows this: one file per visual, such as `graph.js`, `pathways.js` and `causality.js`, with `app.js` drawing the rest), because a new contributor can find things.
34. No dead code, no hard-coded keys, and no hard-coded URLs except source links in `data/`, because dead code gets maintained by mistake.
35. Few dependencies. The site loads only D3 from cdnjs; dev tools are Biome, Playwright, Lighthouse and chrome-launcher (which starts Chrome for Lighthouse). Adding one needs a reason in an ADR, because every dependency is something that can break or be compromised.
36. Write for a junior who wasn't in the conversation: a comment at the top of each file saying what it does and why.

## Session start and end

37. Start: read docs/STATE.md, then this file, then the part of DESIGN.md or PRODUCT.md the work touches. `git fetch` and `git status`; read recent commits on every branch if anyone else works here. Create a topic branch (a git worktree if another session may be using the main folder) and state the one topic to the owner in one line. This is because sessions overlap in this repo.
38. End: run `npm run check` once after the last fix and read the output. Commit by file list, merge to `main`, push. Rewrite STATE.md; write an ADR if a choice changed; update DESIGN.md if the design changed. Report: what changed, what was reviewed and how it scored, what is queued for the owner, and anything skipped or not verified. This is because the next session only knows what the repo says.

## Talking to the owner

39. Lead with the answer, then the detail; keep it short. Show, don't describe: send screenshots for anything visual. When she reacts in plain words ("too cluttered"), quote her in the plan, because her words are the spec.
40. Ask before deploying, deleting files, adding a paid service, or anything that sends data off-site. For long runs, agree a spend limit first and stop at it, because those can't be undone.

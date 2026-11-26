# Shareholder Advocacy AI Landscape

Read AGENTS.md first; it is the working protocol and wins over anything else.
Status and queue: docs/STATE.md. Design: DESIGN.md. Purpose and "Never claim" list: PRODUCT.md. Data sources: SOURCES.md.

## Quick start for every session

1. **Read, in order:** docs/STATE.md, AGENTS.md, then the part of PRODUCT.md or DESIGN.md your work touches.
2. **Sync:** `git fetch`, then `git status` and `git log --oneline -5 origin/main`. Several sessions and a weekly bot commit to this repo, so your local `main` may be behind. Pull before you branch.
3. **Isolate:** work on a topic branch, in a git worktree if another session may be using the main folder. Never edit, commit or stash another session's uncommitted files.
4. **One topic:** say it to the owner in one line. Anything else you find goes in STATE.md's Queue, not into your session.
5. **First time on this machine:** `npm install`. The tests and Lighthouse use the Google Chrome already installed, so there's no browser download.
6. **Finish:** run `npm run check` once after your last fix and read the output. Commit by file list, merge to `main`, push, then rewrite docs/STATE.md (rewrite it, don't append) and report to the owner, including anything not done or not verified.

## Scope of the protocol

AGENTS.md governs how work is done: git, checks, reviews, docs. It is not a source of design or feature ideas. The owner decides the site's form and function. Don't fix bugs or change the site as a side effect of process work; queue them instead.

## Commands

- `npm run dev`: serves the repo at http://localhost:8765
- `npm run check`: lint, build, browser tests at 1440 and 390 px in light and dark, then Lighthouse. Stops at the first failing step.
- `npm run build`: validates `data/` and copies the public site into `dist/`
- `npm run check:links`: checks the outside source links (slow; set `SEC_USER_AGENT` in `.env` to cover SEC links)
- Generated output goes to `reports/`, `tests/screenshots/` and `dist/`, all git-ignored.

## Push rule

After any major edit, commit by explicit file list with the message in a file (`git commit -F msg.txt -- path1 path2`), and push. Never `git add .`, `git add -A` or `commit -a`; never force-push.

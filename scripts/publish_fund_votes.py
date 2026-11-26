"""Turn a fund-votes review run into the site's data/fund_votes.json.

The GitHub "fund-votes" task (scripts/npx_votes.py) saves its full output as a run
artifact for checking. Once checked, this script builds the published file from it,
so the published file is always reproducible from a run:

    gh run download <run-id> -n fund-votes-review -D /tmp/fv
    python3 scripts/publish_fund_votes.py /tmp/fv/fund_votes_review.json

What it adds: the meeting window the filings cover, which rows a person reviewed
(from data/fund_votes_reviewed.json), and which families or periods could not be read.
What it drops: the raw per-fund records, which are only for checking.
"""

import json
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"
FIRST, LAST = "2023-07-01", "2026-06-30"   # structured N-PX starts with meetings from July 2023

NOT_READABLE = {
    "Praxis": "Praxis files Form N-PX only in the older text format, which this tracker cannot read yet, so it is not shown.",
}


def main(src):
    run = json.loads(Path(src).read_text())
    reviewed = json.loads((DATA / "fund_votes_reviewed.json").read_text())
    reviewed_keys = {f'{r["family"]}|{pid}' for r in reviewed["reviewed"] for pid in r["proposal_ids"]}
    # Conflicts: the same fund (same share count) reported with different votes on one proposal
    # usually means two different ballot items were matched to it. Those cells are held back
    # as "Needs checking" instead of being shown as a split.
    seen, conflicts = {}, set()
    for rec in run.get("records", []):
        if len(rec["vote_lines"]) != 1:
            continue
        line = rec["vote_lines"][0]
        key = (rec["family"], rec["proposal_id"], rec["source_url"], line["shares"])
        if key in seen and seen[key] != line["how"]:
            conflicts.add((rec["family"], rec["proposal_id"]))
        seen.setdefault(key, line["how"])
    summary = []
    for r in run["summary"]:
        row = {k: r[k] for k in ("family", "proposal_id", "company", "meeting_date", "vote", "counts", "fund_records",
                                 "sources", "npx_descriptions", "min_confidence")}
        row["reviewed"] = f'{r["family"]}|{r["proposal_id"]}' in reviewed_keys
        if (r["family"], r["proposal_id"]) in conflicts:
            row["vote"] = "NEEDS_CHECK"
            row["counts"] = {}
        summary.append(row)
    out = {
        "generated": run["generated"],
        "first_meeting_covered": FIRST,
        "last_meeting_covered": LAST,
        "method": run["method"],
        "families": run["families"],
        "coverage": run.get("coverage", {}),
        "not_shown": [v for k, v in NOT_READABLE.items() if k not in run.get("coverage", {})],
        "reviewed": reviewed["reviewed"],
        "filings": [{k: f[k] for k in ("family", "trust", "form", "filed", "period", "url")} for f in run["filings"]],
        "proposals_checked": run["proposals_checked"],
        "summary": summary,
        "near_misses": run.get("review", []),
        "notes": run.get("notes", []),
    }
    (DATA / "fund_votes.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n")
    print(f"held back as needs checking: {sorted(conflicts)}")
    print(f"data/fund_votes.json: {len(summary)} rows, {sum(r['reviewed'] for r in summary)} reviewed, "
          f"{len(out['near_misses'])} near misses listed")


if __name__ == "__main__":
    main(sys.argv[1])

"""Add one forecast posted through the GitHub issue form (.github/ISSUE_TEMPLATE/forecast.yml) to data/predictions.json.
Run by .github/workflows/forecasts.yml with the issue's body, author and number in the environment (never on the
command line, so nothing in the body is run as a command). Prints one line for the bot's reply; exits 1 if the
forecast can't be accepted, with the reason. The free-text "Why" stays on the GitHub issue and is not copied into
the site's data.

Checks: the question exists and is still open; the probability is a whole number from 1 to 99; the group is one
of the board's groups; the confirmation box is ticked.
"""

import datetime as dt
import json
import os
import re
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "data"


LABELS = ("Question id", "Your probability", "Which group", "Do you or your organization have a stake", "Why", "Confirmation")


def fields(body):
    """Issue forms render as '### Label' followed by the answer. Only the form's own labels count, each at its
    first occurrence, so text typed into the free 'Why' box can't add or replace an answer."""
    out, key = {}, None
    for line in body.replace("\r", "").split("\n"):
        m = re.match(r"^###\s+(.*)$", line)
        label = next((x for x in LABELS if m and m.group(1).strip().startswith(x)), None)
        if label and label not in out:
            key = label
            out[key] = []
        elif key is not None:
            out[key].append(line)
    return {k: "\n".join(v).strip() for k, v in out.items()}


def fail(why):
    print(why)
    sys.exit(1)


def main():
    body, user, num = os.environ.get("ISSUE_BODY", ""), os.environ.get("ISSUE_USER", ""), os.environ.get("ISSUE_NUMBER", "")
    if not re.fullmatch(r"[A-Za-z0-9-]{1,39}", user or ""):
        fail("The GitHub account name could not be read.")
    f = fields(body)
    get = lambda label: f.get(label, "")
    Q = json.loads((DATA / "forecast-questions.json").read_text())
    qs = {q["id"]: q for q in Q["questions"]}
    qid = get("Question id").strip()
    if qid not in qs:
        fail(f"No question has the id `{re.sub(r'[^A-Za-z0-9-]', '', qid)[:60]}`. Start from the board's \"Post it publicly\" link so the id is filled in.")
    q = qs[qid]
    today = dt.date.today().isoformat()
    if q.get("resolved") is not None or q["closes"] < today:
        fail(f"This question closed on {q['closes']}, so new forecasts can't be scored.")
    raw = get("Your probability").strip().rstrip("%").strip()
    if not re.fullmatch(r"\d{1,2}", raw) or not 1 <= int(raw) <= 99:
        fail("The probability must be a whole number from 1 to 99.")
    group = get("Which group").strip()
    if group not in Q["groups"]:
        fail("Please pick a group from the list.")
    if "[x]" not in get("Confirmation").lower():
        fail("Please tick the confirmation box.")
    filer = get("Do you or your organization have a stake").strip().lower() == "yes"

    path = DATA / "predictions.json"
    raw_text = path.read_text()
    P = json.loads(raw_text)
    P["forecasts"].append({"id": int(num) if num.isdigit() else None, "question": qid, "handle": user, "group": group,
                           "p": int(raw) / 100, "filer": filer, "made": today,
                           "issue_url": f"https://github.com/{os.environ.get('GITHUB_REPOSITORY', '')}/issues/{num}" if num else None})
    path.write_text(json.dumps(P, indent=1, ensure_ascii=False) + "\n")
    print(f"Added: {raw}% on {qid} as {group}{' (declared a stake: kept, but left out of the crowd figure and the ranking)' if filer else ''}. It will show on the board after the next publish, in a few minutes.")


if __name__ == "__main__":
    main()

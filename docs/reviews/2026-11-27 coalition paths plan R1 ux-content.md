# Coalition paths plan, round 1: UX and content

**Score: 64/100. Verdict: REVISE.**

## Top failures

1. **The vote lines don't match the data and claim too much.**
   - The data covers 9 mostly ESG-focused fund families, which can't show where voting power lies.
   - 109 votes have no line style.
   - The "not yet reviewed" label is missing (PRODUCT.md Never claim 4).
2. **Routed lines claim more than their sources.**
   - A filer could be routed when the source never names it, which is inference from membership plus appearing on the same proposal.
   - "filed through" reads as joint work.
   - Many readers never open the panel, so its careful wording doesn't reach them.
3. **The dashes collide, and phones aren't covered.**
   - "Against = dashed" clashes with the existing dashes for membership, inferred links and responses.
   - Labels can be hidden (DESIGN.md:43).
   - The chips have no layout at 390 px.
   - A new dash meaning is a style change (AGENTS.md 27.3).

## Top improvements

1. Show votes as a sourced table in the proposal panel, with the unreviewed flag. Drop "power".
2. Route a line only when the source names the filer. Otherwise give the coalition its own "supported by" line, and use the source's own verb.
3. Present the stages as kinds of activity rather than a fixed sequence. Name the company-response stage carefully. Specify the chip layout at 390 px and test it.

**Content rules:** pass. No em dashes, and neither banned word appears.

## What was done

Revision 1 of the plan addresses each point. The table at the end of the plan lists the changes.

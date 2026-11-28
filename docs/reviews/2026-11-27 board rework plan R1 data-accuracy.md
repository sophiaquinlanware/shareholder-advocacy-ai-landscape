# Board rework plan, round 1: data accuracy

Score: 62/100, REVISE.

The claims about what exists today are mostly true: 12 of the 28 questions are coverage gaps, and the kinds and `forecast.json` keys exist. One date was wrong: the Anthropic external-review question resolves by December 31, 2027, not June 30, 2027 (June 30 is when it closes).

## Top failures

1. **Two kinds have no records to resolve from.**
   - **Proxy-statement questions (`proxy_in`).** No proposal in `proposals.json` is "filed, not yet in a proxy statement", and there are no proxy filing dates.
   - **State bills.** Every state law on the `required_by` lists is already enacted.
2. **Decision pairs 1 and 2 aren't defined by the records.**
   - There is no "human-rights due diligence" ask id.
   - The rule "void if both asks appear" is likely to trigger at GOOGL.
   - There is no filer-type field.
3. **The Ceres pair breaks the plan's own rule.** Its condition is a named investor's future act (Parnassus named by Ceres).

## Top improvements

1. Define the model probability as the existing `base.p` (empirical share of `errors`) and test that the two are identical.
2. Drop or re-source the kinds that can't be built, and give pair 1 a real ask id and a numeric bar.
3. Tighten the lab questions:
   - define "names an outside assessor";
   - give the SpaceX vote control as context, not a base rate;
   - note on the page that only 4 proposals qualify for withdrawal questions.

## What was done

Revision 1 of the plan handles each point. The table at the end of the plan lists the changes.

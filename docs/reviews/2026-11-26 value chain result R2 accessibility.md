REVIEWER: Accessibility SCORE: 88 VERDICT: PASS

Round 2 (77a965c, read via git show). R1 failures fixed: SVG role=group with company g role=button named with tie counts, List view names as data-co buttons; white focus outline on dark cells (5.22:1 on #2f6fb0, 15.39:1 on #0b2545); one dash pattern per tie type. Also confirmed: tier chips start aria-pressed=false; chart and heatmap boxes are named focusable regions; sticky scope=row headers; announce() clears then sets; heatmap cells focus their section heading, fund votes its own heading; WAI tabs pattern correct.

TOP FAILURES: none blocking.

TOP IMPROVEMENTS: 1. The heatmap sticky cells inherit .sticky-col min-width 220px; at 390px only one count column shows; set about 120px. 2. No Esc or Clear to undo the fade; company panel h4s have no ids or tabindex. 3. Screenshots not regenerated; add a #value-chain axe check.

OUT-OF-FIELD NOTES: the ties list is a fixed sort, not sortable; the -3px outline may touch digits; confirm no file paths remain in the caption.

CONTENT RULES: PASS.

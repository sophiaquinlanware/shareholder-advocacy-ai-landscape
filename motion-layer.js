// Motion layer, stages 3–10 of the owner's motion brief (docs/plans/2026-11-26-motion.md): numbers count up,
// charts draw in, table rows and timeline steps fade in with a light stagger, a thin scroll-progress bar, chip
// presses, and tables that become stacked cards on phones. One watcher finds these as views render, and each
// animates once, when it first scrolls into view. Only transform and opacity animate (one easing curve). Under
// prefers-reduced-motion nothing moves; the card layout for phones still applies.
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
  const D = { micro: 200, reveal: 500, trans: 800 };
  const seen = new WeakSet();

  // Run fn(el) once, the first time el scrolls into view.
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          io.unobserve(e.target);
          const fn = e.target.__onView;
          delete e.target.__onView;
          if (fn) fn(e.target);
        });
      }, { threshold: 0.15 })
    : null;
  function onView(el, fn) {
    if (!el || seen.has(el)) return;
    seen.add(el);
    if (reduced || !io || !el.animate) return;
    el.__onView = fn;
    io.observe(el);
  }
  const fade = (els, { y = 6, step = 14, max = 40, dur = D.reveal } = {}) =>
    [...els].slice(0, max).forEach((n, i) =>
      n.animate([{ opacity: 0, transform: `translateY(${y}px)` }, { opacity: 1, transform: "none" }], { duration: dur, delay: i * step, easing: EASE, fill: "backwards" }));
  const fadeOnly = (els, { step = 6, max = 400, dur = D.reveal } = {}) =>
    [...els].slice(0, max).forEach((n, i) => n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur, delay: i * step, easing: EASE, fill: "backwards" }));

  // ---------- Stage 3: numbers count up once in view ----------
  // Elements whose whole text is a number (bar counts, heatmap cells, anything marked data-countup).
  function countUp(el) {
    const raw = el.textContent.trim();
    const m = raw.match(/^([^\d-]*)(\d[\d,]*)(\.\d+)?(.*)$/);
    if (!m) return;
    const target = Number((m[2] + (m[3] || "")).replace(/,/g, ""));
    if (!Number.isFinite(target) || target < 2) return;
    const dec = m[3] ? m[3].length - 1 : 0;
    // Screen readers hear the final figure, not the count: borrow aria-label only when the element has none.
    const own = el.hasAttribute("aria-label");
    if (!own) el.setAttribute("aria-label", raw);
    const t0 = performance.now();
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / D.trans);
      const e = 1 - Math.pow(2, -10 * k);
      const v = (target * (k >= 1 ? 1 : e)).toFixed(dec);
      el.textContent = m[1] + Number(v).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + m[4];
      if (k < 1) requestAnimationFrame(tick);
      else { el.textContent = raw; if (!own) el.removeAttribute("aria-label"); }
    };
    requestAnimationFrame(tick);
  }

  // ---------- What to animate, by what renders ----------
  const RULES = [
    // Stage 3
    { sel: ".pw-bar-n, .vc-num, [data-countup]", run: (el) => onView(el, countUp) },
    // Stage 4: charts draw in. Bars grow from the left; dot plots, heatmaps and the causality map fade in by x.
    { sel: ".pw-bars", run: (el) => onView(el, () => [...el.querySelectorAll(".pw-bar-fill")].forEach((b, i) =>
        b.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: D.trans, delay: i * 30, easing: EASE, fill: "backwards" }))) },
    { sel: ".sc-bar", run: (el) => onView(el, () => [...el.querySelectorAll("span")].forEach((b) =>
        b.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: D.trans, easing: EASE, fill: "backwards" }))) },
    { sel: "#feed-chart svg", run: (el) => onView(el, () => {
        const marks = [...el.querySelectorAll(":scope > g:not([transform]) > path")];
        marks.sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x);
        fadeOnly(marks, { step: Math.max(2, Math.round(600 / Math.max(1, marks.length))) });
      }) },
    { sel: ".vc-heat", run: (el) => onView(el, () => fadeOnly(el.querySelectorAll("tbody td"), { step: 12 })) },
    { sel: "#cz-graph svg", run: (el) => onView(el, () => {
        fadeOnly(el.querySelectorAll(":scope > g > g"), { step: 3, max: 300 });
        fadeOnly(el.querySelectorAll(":scope > g > path"), { step: 2, max: 300, dur: D.trans });
      }) },
    // Stage 5: table rows fade in with a light stagger (also after a filter redraws them).
    { sel: ".table-wrap tbody", run: (el) => onView(el, () => fade(el.children, { y: 4, step: 12, max: 30 })) },
    // Stage 6: status timelines step through.
    { sel: ".timeline", run: (el) => onView(el, () => fade(el.children, { y: 8, step: 90, max: 20 })) },
    { sel: ".eng-steps", run: (el) => onView(el, () => fade(el.children, { y: 4, step: 70 })) },
    { sel: ".findings", run: (el) => onView(el, () => fade(el.children, { y: 10, step: 80 })) },
    // Stage 10: phones turn tables into stacked cards (labels come from the column headers).
    { sel: ".panel table", run: (el) => cardify(el) },
  ];

  // ---------- Stage 10: stacked cards on phones ----------
  // Tables that already have their own phone layout, or whose columns must line up (the heatmap, fund votes),
  // stay as tables.
  const KEEP_TABLE = ".vc-heat, #fv-table, .pw-routes-t, .net-list table";
  function cardify(table) {
    if (table.matches(KEEP_TABLE) || table.closest("#fv-table")) return;
    const heads = [...table.querySelectorAll("thead th")].map((th) => th.textContent.replace(/[↑↓↕]/g, "").trim());
    if (!heads.length || heads.length > 8) return;
    table.classList.add("as-cards");
    table.querySelectorAll("tbody tr").forEach((tr) => [...tr.children].forEach((td, i) => { if (heads[i] && !td.dataset.col) td.dataset.col = heads[i]; }));
  }

  function scan(root) {
    if (!(root instanceof Element)) return;
    for (const r of RULES) {
      if (root.matches && root.matches(r.sel)) r.run(root);
      root.querySelectorAll(r.sel).forEach((el) => r.run(el));
    }
  }
  const mo = new MutationObserver((muts) => {
    for (const m of muts) m.addedNodes.forEach((n) => {
      scan(n);
      // A tbody whose rows were replaced (a filter or sort) animates again, and its new cells get labels.
      const tb = n.parentElement && n.parentElement.closest && n.parentElement.closest("tbody");
      if (tb) { const t = tb.closest("table"); if (t) cardify(t); }
    });
  });
  const startWatch = () => { scan(document.body); mo.observe(document.body, { childList: true, subtree: true }); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", startWatch, { once: true });
  else startWatch();

  // ---------- Stage 8: micro-interactions that need script ----------
  // Chips and segmented buttons give a small press when chosen or cleared.
  document.addEventListener("click", (e) => {
    if (reduced) return;
    const b = e.target.closest && e.target.closest(".chip, .leg, .tool, .seg button, .subtabs button");
    if (b && b.animate) b.animate([{ transform: "scale(0.96)" }, { transform: "scale(1)" }], { duration: D.micro, easing: EASE });
  });
  // A thin scroll-progress bar at the top of long pages.
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  bar.setAttribute("aria-hidden", "true");
  const place = () => { if (!bar.isConnected) document.body.appendChild(bar); };
  let raf = 0;
  const update = () => {
    raf = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const long = max > window.innerHeight * 0.75;
    bar.style.opacity = long ? "1" : "0";
    bar.style.transform = `scaleX(${long ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`;
  };
  window.addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(update); }, { passive: true });
  window.addEventListener("resize", () => { if (!raf) raf = requestAnimationFrame(update); });
  if (document.body) { place(); update(); } else document.addEventListener("DOMContentLoaded", () => { place(); update(); }, { once: true });
  document.addEventListener("tabshown", () => requestAnimationFrame(update));
})();

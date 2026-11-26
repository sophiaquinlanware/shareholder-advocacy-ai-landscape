// Motion foundation (docs/plans/2026-11-26-motion.md, stage 1).
// Lenis smooths native scrolling and stays synced with GSAP ScrollTrigger, so later stages can tie reveals to
// scroll. It never takes over scrolling: the page still scrolls natively, keyboard and find-in-page included.
// Under prefers-reduced-motion nothing here runs, and later stages fall back to simple fades.
(function () {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
  // GSAP's name for the same curve as --ease (expo.out is the closest built-in; custom curves need a plugin).
  const GSAP_EASE = "expo.out";
  window.MOTION = { reduced, ease: EASE, gsapEase: GSAP_EASE, dur: { micro: 0.2, reveal: 0.5, trans: 0.8 }, lenis: null };

  function start() {
    if (reduced || !window.Lenis || !window.gsap || !window.ScrollTrigger) return;
    window.gsap.registerPlugin(window.ScrollTrigger);
    const lenis = new window.Lenis({
      duration: 1.0,
      easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)), // expo out: the site's one curve
      smoothWheel: true,
      // The graph boxes zoom on the wheel: leave those to the browser.
      prevent: (node) => !!(node.closest && node.closest(".net-graph, .vc-flow, [data-lenis-prevent]")),
    });
    lenis.on("scroll", window.ScrollTrigger.update);
    window.gsap.ticker.add((time) => lenis.raf(time * 1000));
    window.gsap.ticker.lagSmoothing(0);
    window.MOTION.lenis = lenis;
    document.documentElement.classList.add("lenis-on");
  }
  // ---------- Stage 2: headlines reveal line by line from behind a mask ----------
  // Owner's brief: "Headlines reveal line by line from behind a mask on load." The site title reveals on
  // load; each page's heading reveals when its data has drawn and whenever its tab is opened. The heading is
  // split into its rendered lines, each line rises into view inside a clipped box, and once done the heading
  // goes back to plain text (so it re-wraps normally on resize). Transform and opacity only. Under reduced
  // motion: a plain fade.
  const D_REVEAL = 500, STAGGER = 90;
  function splitLines(el) {
    const text = el.textContent;
    const words = text.split(/(\s+)/);
    el.textContent = "";
    const spans = words.map((w) => { const s = document.createElement("span"); s.textContent = w; el.appendChild(s); return s; });
    const lines = [];
    let top = null;
    spans.forEach((s) => {
      if (!s.textContent.trim()) { if (lines.length) lines[lines.length - 1].push(s.textContent); return; }
      if (top === null || Math.abs(s.offsetTop - top) > 2) { lines.push([]); top = s.offsetTop; }
      lines[lines.length - 1].push(s.textContent);
    });
    el.textContent = "";
    return { text, inners: lines.map((ws) => {
      const outer = document.createElement("span"); outer.className = "rl";
      const inner = document.createElement("span"); inner.className = "rl-in"; inner.textContent = ws.join("");
      outer.appendChild(inner); el.appendChild(outer); return inner;
    }) };
  }
  function reveal(el) {
    if (!el || el.dataset.revealing || el.offsetParent === null) return;
    // A heading already split once is rejoined to plain text before splitting again (its width may differ now).
    if (el.classList.contains("rl-done")) { el.replaceChildren(el.textContent); el.classList.remove("rl-done"); }
    el.dataset.revealing = "1";
    const done = () => { delete el.dataset.revealing; };
    if (reduced || !el.animate) {
      if (el.animate) el.animate([{ opacity: 0.01 }, { opacity: 1 }], { duration: 200, easing: "linear" }).finished.then(done, done);
      else done();
      return;
    }
    // Only plain-text headings are split; one with links or tags inside fades up as a whole.
    if (el.children.length) {
      el.animate([{ opacity: 0.01, transform: "translateY(12px)" }, { opacity: 1, transform: "none" }], { duration: D_REVEAL, easing: EASE }).finished.then(done, done);
      return;
    }
    el.classList.remove("rl-done");
    const { text, inners } = splitLines(el);
    el.setAttribute("aria-label", text);
    const anims = inners.map((s, i) => s.animate(
      [{ transform: "translateY(105%)", opacity: 0.01 }, { transform: "translateY(0)", opacity: 1 }],
      { duration: D_REVEAL, delay: i * STAGGER, easing: EASE, fill: "backwards" },
    ));
    // Afterwards the line boxes simply turn inline, so the heading re-wraps normally. The text nodes stay as they
    // are: replacing them would count as a new "largest paint" and slow the page's measured load.
    const finish = () => { el.classList.add("rl-done"); el.removeAttribute("aria-label"); done(); };
    Promise.all(anims.map((a) => a.finished)).then(finish, finish);
  }
  const pageHeading = (panel) => panel && panel.querySelector("h2");
  // The site title stays still: it is the page's largest text, and browsers time the page's "largest paint" from
  // it, so animating it made measured load time swing from 1 to 15 seconds. Each page's own heading reveals instead.
  let ready = false;
  document.addEventListener("siteready", () => { ready = true; reveal(pageHeading(document.querySelector(".panel:not([hidden])"))); });
  document.addEventListener("tabshown", (e) => { if (ready) reveal(pageHeading(e.detail && e.detail.panel)); });
  window.MOTION.reveal = reveal;

  // The libraries load deferred, in order; start once the page has loaded.
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
})();

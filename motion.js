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
  // The libraries load deferred, in order; start once the page has loaded.
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
})();

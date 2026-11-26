// Functions that run inside the browser page (passed to page.evaluate), so they
// must not use anything from outside their own body.

// How many pixels wider than the window the page is. 0 means no sideways scrolling.
export function sidewaysOverflow() {
  return document.documentElement.scrollWidth - document.documentElement.clientWidth;
}

// Find pieces of visible HTML text that sit on top of each other.
// Measures each text run's own box (not its element's box), skips SVG
// (network graphs place labels freely by design) and skips text inside
// elements that scroll sideways on purpose (wide tables, the timeline).
// Returns one short description per overlap, at most 10.
export function findOverlappingText() {
  const MIN_OVERLAP = 3; // px in both directions, so touching edges do not count
  const runs = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent.trim()) continue;
    const el = node.parentElement;
    if (!el || el.closest("svg, [hidden], script, style")) continue;
    // Text inside a closed <details> (other than its <summary>) is not shown, though browsers still report boxes for it.
    const closed = el.closest("details:not([open])");
    if (closed && !el.closest("summary")) continue;
    const style = getComputedStyle(el);
    if (style.visibility === "hidden" || style.opacity === "0") continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    for (const r of range.getClientRects()) {
      if (r.width < 1 || r.height < 1) continue;
      runs.push({ el, text: node.textContent.trim().slice(0, 30), r, top: r.top + scrollY, left: r.left + scrollX });
    }
  }

  // Elements that clip their content (overflow other than visible) hide overlaps legitimately.
  const clipper = (el) => {
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.overflowX !== "visible" || s.overflowY !== "visible") return e;
    }
    return null;
  };

  runs.sort((a, b) => a.top - b.top);
  const found = [];
  for (let i = 0; i < runs.length && found.length < 10; i++) {
    const a = runs[i];
    for (let j = i + 1; j < runs.length; j++) {
      const b = runs[j];
      if (b.top >= a.top + a.r.height - MIN_OVERLAP) break; // sorted by top: nothing further down can overlap
      if (a.el === b.el && a.text === b.text) continue; // the same text wrapping onto lines
      const w = Math.min(a.left + a.r.width, b.left + b.r.width) - Math.max(a.left, b.left);
      const h = Math.min(a.top + a.r.height, b.top + b.r.height) - Math.max(a.top, b.top);
      if (w < MIN_OVERLAP || h < MIN_OVERLAP) continue;
      if (clipper(a.el) !== clipper(b.el)) continue; // different scroll boxes, e.g. a sticky header over content
      found.push(`"${a.text}" and "${b.text}"`);
      if (found.length >= 10) break;
    }
  }
  return found;
}

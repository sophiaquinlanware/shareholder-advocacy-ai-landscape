// The header art and logo mark grow as the site is read (owner, 2026-11-27): the first time a view opens, its node
// on the trail lights and links to its section's hub; a section's hub lights with its first view, and the matching
// node in the logo fills. Kept in this browser only; nothing is sent anywhere.
(() => {
  const KEY = "net-visited-v1";
  let seen = new Set();
  try { seen = new Set(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch (e) { /* storage blocked: start empty */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify([...seen])); } catch (e) { /* not kept */ } };
  const art = () => document.querySelector(".hdr-art");
  const groupOf = (v) => (document.getElementById(`tab-${v}`) || {}).dataset?.group;

  function paint(fresh) {
    const svg = art();
    const groups = new Set([...seen].map(groupOf).filter(Boolean));
    if (svg) {
      svg.querySelectorAll(".ha-sat, .ha-spoke").forEach((el) => el.classList.toggle("on", seen.has(el.dataset.v)));
      svg.querySelectorAll(".ha-hub").forEach((el) => el.classList.toggle("on", groups.has(el.dataset.g)));
      svg.querySelectorAll(".ha-seg").forEach((el) => el.classList.toggle("on", groups.has(el.dataset.g)));
      svg.classList.toggle("all", svg.querySelectorAll(".ha-hub").length === svg.querySelectorAll(".ha-hub.on").length);
      if (fresh) {
        const sat = svg.querySelector(`.ha-sat[data-v="${fresh.v}"]`);
        if (sat) { sat.classList.remove("new"); void sat.getBBox(); sat.classList.add("new"); }
        if (fresh.newGroup) { const hub = svg.querySelector(`.ha-hub[data-g="${fresh.g}"]`); if (hub) hub.classList.add("new"); }
      }
    }
    document.querySelectorAll(".net-mark").forEach((m) => {
      m.querySelectorAll(".nm-n").forEach((n) => n.classList.toggle("on", groups.has(n.dataset.g)));
      m.querySelectorAll(".nm-e").forEach((e) => e.classList.toggle("on", groups.has(e.dataset.g) && groups.has(e.dataset.h)));
    });
  }
  window.NETMARK = {
    visit(view) {
      const g = groupOf(view);
      if (!g || seen.has(view)) return paint();
      const newGroup = ![...seen].some((v) => groupOf(v) === g);
      seen.add(view);
      save();
      paint({ v: view, g, newGroup });
    },
  };
  paint();

  // Play (owner, 2026-11-27: "as you play or click on the mountains you can change their network structures and
  // change their shape slightly", and "little fun easter eggs"). Everything here is visual; nothing is stored.
  const svg = art();
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (svg) {
    // A hub opens its section.
    svg.querySelectorAll(".ha-hub").forEach((h) => {
      h.addEventListener("click", (e) => {
        e.stopPropagation();
        const first = document.querySelector(`#grp-${h.dataset.g} .panel`);
        if (first && window.showTab) window.showTab(first.id.slice(4));
        if (h.dataset.g === "plan") summitTap();
      });
    });
    // Anywhere else: the ranges shift a little and the mesh re-wires.
    const mesh = svg.querySelector(".ha-mesh");
    const pts = mesh ? [...mesh.querySelectorAll("circle")].map((c) => ({ c, x0: +c.getAttribute("cx"), y0: +c.getAttribute("cy") })) : [];
    const NS = "http://www.w3.org/2000/svg";
    function rewire() {
      if (!mesh) return;
      pts.forEach((p) => { p.x = p.x0 + (Math.random() - 0.5) * 30; p.y = p.y0 + (Math.random() - 0.5) * 16; p.c.setAttribute("cx", p.x.toFixed(1)); p.c.setAttribute("cy", p.y.toFixed(1)); });
      mesh.querySelectorAll("line").forEach((l) => l.remove());
      const seen = new Set();
      pts.forEach((a, i) => {
        const near = pts.map((b, j) => ({ j, d: (b.x - a.x) ** 2 + (b.y - a.y) ** 2 })).sort((p, q) => p.d - q.d).slice(1, 5);
        near.sort(() => Math.random() - 0.5).slice(0, 2).forEach(({ j }) => {
          const k = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (seen.has(k)) return;
          seen.add(k);
          const b = pts[j], l = document.createElementNS(NS, "line");
          l.setAttribute("x1", a.x.toFixed(1)); l.setAttribute("y1", a.y.toFixed(1)); l.setAttribute("x2", b.x.toFixed(1)); l.setAttribute("y2", b.y.toFixed(1));
          if (!still) l.classList.add("ha-draw");
          mesh.insertBefore(l, mesh.firstChild);
        });
      });
      svg.querySelectorAll(".ha-back, .ha-mid, .ha-front").forEach((r) => { r.style.transform = `scaleY(${(0.82 + Math.random() * 0.36).toFixed(2)})`; });
    }
    svg.addEventListener("click", rewire);
    // Three quick taps on the summit: a burst of links from the summit across the ranges.
    let taps = [];
    function summitTap() {
      const now = Date.now();
      taps = taps.filter((t) => now - t < 1200).concat(now);
      if (taps.length < 3 || still) return;
      taps = [];
      const top = svg.querySelector('.ha-hub[data-g="plan"] .ha-core');
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "ha-burst");
      pts.forEach((p) => {
        const l = document.createElementNS(NS, "line");
        l.setAttribute("x1", top.getAttribute("cx")); l.setAttribute("y1", top.getAttribute("cy"));
        l.setAttribute("x2", (p.x ?? p.x0).toFixed(1)); l.setAttribute("y2", (p.y ?? p.y0).toFixed(1));
        g.appendChild(l);
      });
      svg.querySelector(".ha-all").appendChild(g);
      setTimeout(() => g.remove(), 2200);
    }
  }
  // Every section opened: a one-time note under the header.
  const DONE = "net-summit-noted-v1";
  const noteSummit = () => {
    const s2 = art();
    if (!s2 || !s2.classList.contains("all")) return;
    try { if (localStorage.getItem(DONE)) return; localStorage.setItem(DONE, "1"); } catch (e) { return; }
    const n = document.createElement("p");
    n.className = "ha-note";
    n.setAttribute("role", "status");
    n.textContent = "Summit reached: you have opened every section of the site.";
    document.querySelector(".site-header").appendChild(n);
    setTimeout(() => n.classList.add("out"), 5000);
    setTimeout(() => n.remove(), 6000);
  };
  const v0 = window.NETMARK.visit;
  window.NETMARK.visit = (view) => { v0(view); noteSummit(); };
})();

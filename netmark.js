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
})();

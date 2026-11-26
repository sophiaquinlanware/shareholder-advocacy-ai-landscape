// Quick search (motion brief stage 9): Cmd+K or Ctrl+K, or the "Search" button in the header, opens an overlay
// that finds companies, investors and coalitions, people, frontier labs and the site's views by name, and goes
// straight there. It fades and scales in (opacity and transform only); under reduced motion it simply appears.
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let items = null, dlg = null, input = null, list = null, results = [], active = 0, lastFocus = null;

  function buildIndex() {
    const D = typeof DATA !== "undefined" ? DATA : {};
    const out = [];
    // Views (the site's own tabs).
    document.querySelectorAll('.subtabs [role="tab"][data-tab], .tabs [role="tab"][data-group]').forEach((b) => {
      const label = b.textContent.trim();
      if (b.dataset.tab) out.push({ kind: "View", label, go: () => window.showTab && window.showTab(b.dataset.tab) });
    });
    document.querySelectorAll('.group').forEach((g) => {
      const btn = document.querySelector(`.tabs [role="tab"][data-group="${g.id.replace("grp-", "")}"]`);
      const first = g.querySelector('[role="tab"][data-tab]') || g.querySelector(".panel[id^=tab-]");
      const view = first ? (first.dataset.tab || first.id.replace("tab-", "")) : null;
      if (btn && view) out.push({ kind: "Section", label: btn.textContent.trim(), go: () => window.showTab && window.showTab(view) });
    });
    // Companies: open their profile.
    (D.companies || []).forEach((c) => out.push({ kind: "Company", label: c.name, sub: c.ticker || "", // Companies without a ticker (private labs) open by id; openCompany accepts either.
      go: () => (window.LENS_CTX && window.LENS_CTX.openCompany ? window.LENS_CTX.openCompany(c.ticker || c.id) : window.showTab && window.showTab("company")) }));
    // Investors, coalitions, people and labs: show them in the network.
    const G = D.graph && D.graph.nodes ? D.graph : null;
    if (G) {
      const KIND = { investor: "Investor", coalition: "Coalition", person: "Person", lab: "Frontier lab" };
      G.nodes.filter((n) => KIND[n.type]).forEach((n) => out.push({
        kind: KIND[n.type], label: n.label, sub: n.org_type || n.title || "",
        go: () => { window.showTab && window.showTab("network"); setTimeout(() => window.focusNetworkNode && window.focusNetworkNode(n.id), 60); },
      }));
    }
    return out;
  }

  function score(it, q) {
    const l = it.label.toLowerCase(), s = (it.sub || "").toLowerCase();
    if (l === q || s === q) return 0;
    if (l.startsWith(q) || s.startsWith(q)) return 1;
    if (l.split(/[\s(,.-]+/).some((w) => w.startsWith(q))) return 2;
    if (l.includes(q) || s.includes(q)) return 3;
    return 9;
  }
  const ORDER = { Section: 0, View: 1, Company: 2, "Frontier lab": 3, Coalition: 4, Investor: 5, Person: 6 };
  function render() {
    const q = input.value.trim().toLowerCase();
    results = !q ? items.filter((i) => i.kind === "Section" || i.kind === "View") :
      items.map((i) => ({ i, s: score(i, q) })).filter((x) => x.s < 9)
        .sort((a, b) => a.s - b.s || ORDER[a.i.kind] - ORDER[b.i.kind] || a.i.label.localeCompare(b.i.label)).map((x) => x.i);
    results = results.slice(0, 9);
    active = 0;
    list.innerHTML = results.length ? results.map((r, k) => `<li role="option" id="qs-opt-${k}" aria-selected="${k === 0}" data-k="${k}"><span class="qs-kind">${esc(r.kind)}</span> ${esc(r.label)}${r.sub ? ` <span class="ticker">${esc(r.sub)}</span>` : ""}</li>`).join("") : `<li class="qs-none">No match.</li>`;
    input.setAttribute("aria-activedescendant", results.length ? "qs-opt-0" : "");
  }
  function move(d) {
    if (!results.length) return;
    active = (active + d + results.length) % results.length;
    list.querySelectorAll("[role=option]").forEach((o, k) => o.setAttribute("aria-selected", String(k === active)));
    input.setAttribute("aria-activedescendant", "qs-opt-" + active);
    const o = list.querySelector(`#qs-opt-${active}`);
    if (o) o.scrollIntoView({ block: "nearest" });
  }
  function choose(k) {
    const r = results[k];
    if (!r) return;
    close(false);
    r.go();
  }

  function ensure() {
    if (dlg) return;
    dlg = document.createElement("div");
    dlg.className = "qs-backdrop";
    dlg.hidden = true;
    dlg.innerHTML = `<div class="qs" role="dialog" aria-modal="true" aria-label="Quick search">
      <input type="search" class="qs-input" placeholder="Search companies, investors, people, labs and views" aria-label="Quick search" role="combobox" aria-expanded="true" aria-controls="qs-list" autocomplete="off">
      <ul class="qs-list" id="qs-list" role="listbox"></ul>
      <p class="qs-hint">↑ ↓ to move · Enter to open · Esc to close</p></div>`;
    document.body.appendChild(dlg);
    input = dlg.querySelector(".qs-input");
    list = dlg.querySelector(".qs-list");
    input.addEventListener("input", render);
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); choose(active); }
      else if (e.key === "Escape") { e.preventDefault(); close(true); }
      else if (e.key === "Tab") e.preventDefault(); // focus stays in the dialog
    });
    list.addEventListener("click", (e) => { const o = e.target.closest("[data-k]"); if (o) choose(Number(o.dataset.k)); });
    dlg.addEventListener("mousedown", (e) => { if (e.target === dlg) close(true); });
  }
  function open() {
    ensure();
    items = buildIndex();
    lastFocus = document.activeElement;
    dlg.hidden = false;
    input.value = "";
    render();
    input.focus();
    if (!reduced && dlg.animate) {
      dlg.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
      dlg.firstElementChild.animate([{ opacity: 0, transform: "scale(0.97) translateY(-6px)" }, { opacity: 1, transform: "none" }], { duration: 200, easing: "cubic-bezier(0.16, 1, 0.3, 1)" });
    }
  }
  function close(restore) {
    if (!dlg || dlg.hidden) return;
    dlg.hidden = true;
    if (restore && lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
      e.preventDefault();
      if (dlg && !dlg.hidden) close(true); else open();
    }
  });
  document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest(".qs-open")) open(); });
  window.openQuickSearch = open;
})();

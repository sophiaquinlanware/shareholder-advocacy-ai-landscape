// "When each dataset was last checked" at the foot of every page (data/freshness.json, scripts/build_freshness.py).
(function () {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const D = (v) => (window.DATES ? window.DATES.long(v) : String(v));
  document.addEventListener("DOMContentLoaded", () => {
    const foot = document.querySelector(".site-footer .wrap");
    if (!foot) return;
    const box = document.createElement("details");
    box.className = "freshness";
    box.innerHTML = `<summary>When each dataset was last checked</summary><p class="status-note">Loading…</p>`;
    foot.prepend(box);
    let done = false;
    box.addEventListener("toggle", () => {
      if (!box.open || done) return;
      done = true;
      fetch("data/freshness.json").then((r) => r.json()).then((d) => {
        box.innerHTML = `<summary>When each dataset was last checked</summary><div class="table-wrap"><table><thead><tr><th scope="col">Dataset</th><th scope="col">Date</th><th scope="col">How</th></tr></thead><tbody>${d.datasets.map((r) => `<tr><td><a href="#${esc(r.view)}">${esc(r.dataset)}</a></td><td class="nowrap">${esc(D(r.date))}<div class="ticker">${esc(r.kind)}</div></td><td>${esc(r.how)}</td></tr>`).join("")}</tbody></table></div>`;
        box.open = true;
      }).catch(() => { box.innerHTML = `<summary>When each dataset was last checked</summary><p class="status-note">Could not load the dates.</p>`; });
    });
  });
})();

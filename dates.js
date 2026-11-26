// One date style for the whole site (owner, 2026-11-26): month written out, US order.
//   "2026-11-26" -> "November 26, 2026"   "2026-11" -> "November 2026"   "2026" -> "2026"
//   "2025-H1" -> "first half of 2025"     "2026Q3" or "2026-Q3" -> "third quarter of 2026"
// Anything else (for example "UNVERIFIED (last seen 2024-06)") has its ISO dates rewritten the same way.
(function () {
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const QUARTER = ["first", "second", "third", "fourth"];
  const one = (s) => {
    let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
    if (m) return `${MONTHS[+m[2] - 1]} ${+m[3]}, ${m[1]}`;
    m = /^(\d{4})-(\d{2})$/.exec(s);
    if (m) return `${MONTHS[+m[2] - 1]} ${m[1]}`;
    m = /^(\d{4})-?H([12])$/i.exec(s);
    if (m) return `${m[2] === "1" ? "first" : "second"} half of ${m[1]}`;
    m = /^(\d{4})-?Q([1-4])$/i.exec(s);
    if (m) return `${QUARTER[+m[2] - 1]} quarter of ${m[1]}`;
    return null;
  };
  function long(value) {
    if (value == null || value === "") return "";
    const s = String(value).trim();
    const whole = one(s);
    if (whole) return whole;
    return s.replace(/\b\d{4}(-\d{2}(-\d{2})?|-?[HQ]\d)\b/g, (x) => one(x) || x);
  }
  window.DATES = { long, MONTHS };
})();

// Checks every outside link the site shows: each http(s) URL in data/*.json and index.html.
// Run it with `npm run check:links` before publishing and after a data refresh. It is kept out of
// `npm run check` because it requests about 400 distinct URLs on other sites and takes a few minutes.
// SEC EDGAR (www.sec.gov) refuses requests without a declared User-Agent that includes contact
// details; set SEC_USER_AGENT in a git-ignored .env (package.json loads it with --env-file-if-exists)
// or in the shell to check those links. Results go to reports/external-links.json (git-ignored).
// A refusal (401/403/406/429) is reported as "not verified", not as broken.
// "fetch failed" means no connection was made (dead domain, or a site whose security
// certificate Node rejects); check those by hand in a browser.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

const CONCURRENCY = 6;
const TIMEOUT_MS = 20000;
const DEFAULT_UA = "Mozilla/5.0 (link check for a static site)";
// Bare origins in index.html's <link rel="preconnect"> hints: connection warm-ups, not pages.
const NOT_LINKS = new Set(["https://fonts.googleapis.com", "https://fonts.gstatic.com"]);
// Status codes that mean "the site refused a robot", not "the page is gone".
const REFUSED = [401, 403, 406, 429];

const files = ["index.html", ...readdirSync("data").map((f) => `data/${f}`)].filter(
  (f) => f.endsWith(".json") || f.endsWith(".html"),
);
const urls = new Map(); // url -> first file it appears in
for (const f of files) {
  for (const m of readFileSync(f, "utf8").matchAll(/https?:\/\/[^\s"'<>\\)]+/g)) {
    if (NOT_LINKS.has(m[0])) continue;
    if (!urls.has(m[0])) urls.set(m[0], f);
  }
}

async function check(url) {
  const host = new URL(url).hostname;
  const ua = host.endsWith("sec.gov") && process.env.SEC_USER_AGENT ? process.env.SEC_USER_AGENT : DEFAULT_UA;
  for (const method of ["HEAD", "GET"]) {
    try {
      const res = await fetch(url, {
        method,
        redirect: "follow",
        headers: { "User-Agent": ua },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.ok) return { status: "ok" };
      if (REFUSED.includes(res.status)) return { status: "unverified", code: res.status };
      if (method === "GET") return { status: "broken", code: res.status };
    } catch (e) {
      if (method === "GET") return { status: "broken", code: e.name === "TimeoutError" ? "timeout" : e.message };
    }
  }
}

const results = [];
const queue = [...urls.keys()];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const url = queue.shift();
      results.push({ url, file: urls.get(url), ...(await check(url)) });
    }
  }),
);

const broken = results.filter((r) => r.status === "broken");
const unverified = results.filter((r) => r.status === "unverified");
mkdirSync("reports", { recursive: true });
writeFileSync("reports/external-links.json", JSON.stringify(results, null, 1));
console.log(`${results.length} outside links: ${results.length - broken.length - unverified.length} ok,`);
console.log(`${unverified.length} not verified (the site refused automated checks), ${broken.length} broken.`);
for (const r of broken) console.log(`BROKEN ${r.code}  ${r.url}  (in ${r.file})`);
if (broken.length) process.exit(1);

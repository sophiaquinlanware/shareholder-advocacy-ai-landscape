// Production build: copy only the files the public site needs into dist/,
// and stop with an error if a data file is not valid JSON or index.html
// points at a local file that does not exist.
// The site has no compile step; this exists so the tests run against exactly
// what would be published, without docs, tests or scripts mixed in.
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const OUT = join(ROOT, "dist");
const problems = [];

// 1. Every data file must parse.
const dataFiles = readdirSync(join(ROOT, "data")).filter((f) => f.endsWith(".json"));
for (const f of dataFiles) {
  try {
    JSON.parse(readFileSync(join(ROOT, "data", f), "utf8"));
  } catch (e) {
    problems.push(`data/${f} is not valid JSON: ${e.message}`);
  }
}

// 2. Every local script and stylesheet named in index.html must exist.
const html = readFileSync(join(ROOT, "index.html"), "utf8");
const localRefs = [...html.matchAll(/(?:src|href)="([^"#:]+)"/g)].map((m) => m[1]);
for (const ref of localRefs) {
  if (!existsSync(join(ROOT, ref))) problems.push(`index.html points at ${ref}, which does not exist`);
}

if (problems.length) {
  console.error(`Build failed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}

// 3. Copy the site: index.html, the files it references, and data/.
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const f of ["index.html", ...localRefs]) cpSync(join(ROOT, f), join(OUT, f));
cpSync(join(ROOT, "data"), join(OUT, "data"), { recursive: true });
// 4. Version every local script, stylesheet and data URL with a hash of the built files, so a new deploy shows at
// once instead of after the host's cache time (GitHub Pages: 10 minutes). The same version goes on the preloads in
// index.html and on the fetches in the scripts, so each preload is still the request the script makes.
const hash = createHash("sha256");
for (const f of [...localRefs].sort()) hash.update(readFileSync(join(OUT, f)));
for (const f of [...dataFiles].sort()) hash.update(readFileSync(join(OUT, "data", f)));
const V = hash.digest("hex").slice(0, 10);
const tag = (u) => (u.includes("?") ? u : `${u}?v=${V}`);
let page = readFileSync(join(OUT, "index.html"), "utf8");
page = page.replace(/(src|href)="([^"#:]+)"/g, (m, attr, u) =>
  /\.(js|css|json)$/.test(u) ? `${attr}="${tag(u)}"` : m,
);
writeFileSync(join(OUT, "index.html"), page);
for (const f of localRefs.filter((r) => r.endsWith(".js"))) {
  const js = readFileSync(join(OUT, f), "utf8");
  // "data/x.json" and `data/${f}.json` style literals; nothing else in the scripts starts with data/.
  const out = js.replace(/(["`])data\/([^"`?\s]+)\1/g, (m, q, rest) => `${q}data/${rest}?v=${V}${q}`);
  if (out !== js) writeFileSync(join(OUT, f), out);
}
console.log(
  `Built dist/: index.html, ${localRefs.length} linked files, ${dataFiles.length} data files (version ${V}).`,
);

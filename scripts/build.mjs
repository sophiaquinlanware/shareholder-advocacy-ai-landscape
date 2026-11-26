// Production build: copy only the files the public site needs into dist/,
// and stop with an error if a data file is not valid JSON or index.html
// points at a local file that does not exist.
// The site has no compile step; this exists so the tests run against exactly
// what would be published, without docs, tests or scripts mixed in.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
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
console.log(`Built dist/: index.html, ${localRefs.length} linked files, ${dataFiles.length} data files.`);

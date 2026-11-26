// Lighthouse (Google's page-quality audit) for the built site in dist/, on a phone
// profile and a desktop profile. Fails if any score is under the bar below.
// Uses the Google Chrome installed on this computer. Full reports go to reports/ (git-ignored).
// The bar is a starting proposal recorded in docs/adr/0002; the owner can change it there.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import * as chromeLauncher from "chrome-launcher";
import lighthouse from "lighthouse";

const BAR = { accessibility: 90, "best-practices": 90, seo: 90, performance: 80 };
const PORT = 4174;
const URL_TO_TEST = `http://localhost:${PORT}/index.html`;

if (!existsSync("dist/index.html")) {
  console.error("dist/ is missing: run `npm run build` first (npm run check does this for you).");
  process.exit(1);
}

const server = spawn("python3", ["-m", "http.server", String(PORT), "--directory", "dist"], { stdio: "ignore" });
// Wait until the local server answers (up to 10 seconds) rather than guessing a delay.
for (let i = 0; i < 50; i++) {
  if (
    await fetch(URL_TO_TEST).then(
      (r) => r.ok,
      () => false,
    )
  )
    break;
  await new Promise((r) => setTimeout(r, 200));
}
const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless=new"] });
mkdirSync("reports", { recursive: true });

const failures = [];
try {
  for (const formFactor of ["mobile", "desktop"]) {
    const config =
      formFactor === "desktop"
        ? {
            extends: "lighthouse:default",
            settings: {
              formFactor: "desktop",
              screenEmulation: { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
              throttlingMethod: "simulate",
            },
          }
        : { extends: "lighthouse:default" };
    const result = await lighthouse(URL_TO_TEST, { port: chrome.port, output: "html", logLevel: "error" }, config);
    writeFileSync(`reports/lighthouse-${formFactor}.html`, result.report);
    const line = [];
    for (const [id, min] of Object.entries(BAR)) {
      const score = Math.round(result.lhr.categories[id].score * 100);
      line.push(`${id} ${score}`);
      if (score < min) failures.push(`${formFactor} ${id} ${score} (bar ${min})`);
    }
    console.log(`Lighthouse ${formFactor}: ${line.join(", ")}`);
  }
} finally {
  await chrome.kill();
  server.kill();
}

if (failures.length) {
  console.error(`Under the bar:\n- ${failures.join("\n- ")}\nFull reports: reports/lighthouse-*.html`);
  process.exit(1);
}

// Layout and health checks for every tab, at each size and theme in playwright.config.js.
// Each tab gets a full-page screenshot in tests/screenshots/ (git-ignored; copy the ones
// worth keeping into docs/design/ as before/after evidence).
import { expect, test } from "@playwright/test";
import { findOverlappingText, sidewaysOverflow } from "./layout.js";

// Read the view list from the page itself, so a new view is tested without editing this file.
// Views sit inside six sections; each view's panel names its section (data-group).
async function tabNames(page) {
  return page.$$eval(".panel[data-group]", (ps) => ps.map((p) => p.id.slice(4)));
}
// Open a view as a reader would: its section tab, then its view tab when the section has more than one.
async function openView(page, view) {
  const group = await page.getAttribute(`#tab-${view}`, "data-group");
  await page.click(`.tabs [role="tab"][data-group="${group}"]`);
  const sub = page.locator(`#grp-${group} [role="tab"][data-tab="${view}"]`);
  if (await sub.count()) await sub.click();
}

// Collect anything that went wrong while the page loaded: console errors and failed local requests.
function watchForErrors(page) {
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => errors.push(`script error: ${err.message}`));
  page.on("response", (res) => {
    const url = new URL(res.url());
    if (url.hostname === "localhost" && res.status() >= 400) errors.push(`${res.status()} ${url.pathname}`);
  });
  return errors;
}

test("the page loads with no errors and no missing files", async ({ page }) => {
  const errors = watchForErrors(page);
  await page.goto("/index.html");
  await page.waitForLoadState("networkidle");
  expect(errors, "errors while loading the page").toEqual([]);
});

test("every tab: no sideways scrolling, no overlapping text", async ({ page }, info) => {
  const problems = [];
  // Graphs draw when their tab first opens, so script errors there only show up here.
  page.on("pageerror", (err) => problems.push(`script error: ${err.message}`));
  await page.goto("/index.html");
  await page.waitForLoadState("networkidle");
  for (const tab of await tabNames(page)) {
    await openView(page, tab);
    await page.waitForTimeout(600); // let graphs settle before measuring
    await page.screenshot({ path: `tests/screenshots/${info.project.name}/${tab}.png`, fullPage: true });

    const overflow = await page.evaluate(sidewaysOverflow);
    if (overflow > 1) problems.push(`${tab}: page scrolls sideways by ${overflow}px`);

    for (const o of await page.evaluate(findOverlappingText)) problems.push(`${tab}: overlapping text ${o}`);
  }
  expect(problems, "layout problems").toEqual([]);
});

test("every local link on every tab points at a file that exists", async ({ page, request }) => {
  await page.goto("/index.html");
  await page.waitForLoadState("networkidle");
  const hrefs = new Set();
  for (const tab of await tabNames(page)) {
    await openView(page, tab);
    await page.waitForTimeout(600); // same settle time as the layout test, so late-drawn links are seen
    for (const h of await page.$$eval("a[href]", (as) => as.map((a) => a.href))) hrefs.add(h.split("#")[0]);
  }
  const broken = [];
  for (const href of hrefs) {
    if (!href.startsWith("http://localhost")) continue; // outside links: npm run check:links
    const res = await request.get(href);
    if (!res.ok()) broken.push(`${res.status()} ${href}`);
  }
  expect(broken, "broken local links").toEqual([]);
});

// Lens Phase 4 (Policymaker): recurring asks with coverage, and the year scrubber (all lenses). Live data.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

async function open(page, query = "?lens=policy") {
  await page.goto(`/index.html${query}#network`);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("#net-lens input:checked");
}
const panel = (page) => page.locator("#net-panel");

test("ask nodes appear only in the Policymaker lens", async ({ page }) => {
  await open(page);
  await page.click('#tab-network .seg [data-view="list"]');
  const asks = page.locator("#net-list tbody tr", { hasText: "Recurring ask" });
  expect(await asks.count()).toBeGreaterThan(0);
  await page.check('#net-lens input[value="impact"]');
  await page.click('#tab-network .seg [data-view="list"]');
  await expect(page.locator("#net-list tbody tr", { hasText: "Recurring ask" })).toHaveCount(0);
});

test("an ask's panel: recurrence, support by year, coverage scoped and not confirmed, company actions", async ({
  page,
}) => {
  await open(page);
  await page.evaluate(() => window.focusNetworkNode("ask-customer-due-diligence"));
  const acts = panel(page).locator(".net-actions");
  await expect(panel(page).locator("#net-actions-h")).toHaveText("This ask");
  await expect(acts).toContainText(/\d+ proposals at \d+ companies, \d{4}–\d{4}: \d+ voted/);
  await expect(acts).toContainText("Averages are computed by this site");
  await expect(acts).toContainText("partially covers this ask");
  await expect(acts).toContainText("Coverage is this site's reading, not yet confirmed by a person.");
  await expect(acts).toContainText(
    /Company actions in the Causality map that mention this ask|No Causality map events at these companies mention this ask/,
  );
  await expect(panel(page).locator(".ring-cov-partial")).toContainText("Partially covered");
  // Only "none" entries: scoped to this map, with its own line form.
  await page.evaluate(() => window.focusNetworkNode("ask-ai-fossil-fuels"));
  await expect(panel(page).locator(".ring-cov-none")).toContainText("No rule in this map reaches this");
  await expect(panel(page).locator(".net-actions")).toContainText("No requirement found.");
});

test("an ask with no coverage entries reads 'not yet assessed', never 'no rule'", async ({ page }) => {
  const C = JSON.parse(readFileSync("data/coverage.json", "utf8"));
  C.entries = C.entries.filter((e) => e.ask_id !== "ask-ai-bias");
  await page.route("**/data/coverage.json", (r) => r.fulfill({ json: C }));
  await open(page);
  await page.evaluate(() => window.focusNetworkNode("ask-ai-bias"));
  await expect(panel(page)).toContainText("Coverage not yet assessed");
  await expect(panel(page)).not.toContainText("No rule in this map reaches this");
});

test("year scrubber caps proposals, keeps upto= in the URL, and gives way to a single selected year", async ({
  page,
}) => {
  await open(page, "?lens=impact&graph=proposals");
  const r = page.locator("#net-upto");
  const min = await r.getAttribute("min");
  await r.fill(min);
  await expect(page.locator("#net-scrub-status")).toContainText(`Up to ${min}:`);
  await expect(page).toHaveURL(new RegExp(`upto=${min}`));
  await page.click('#tab-network .seg [data-view="list"]');
  const years = await page.$$eval("#net-list tbody tr", (rows) =>
    // Match on the Type cell, not the whole row: organization rows can name proposals they solicited on.
    rows
      .filter((tr) => /^\s*Proposal\b/.test((tr.children[1] || {}).textContent || ""))
      .map((tr) => tr.children[0].textContent)
      .map((t) => Number((t.match(/ (20\d\d):/) || [])[1]))
      .filter(Boolean),
  );
  expect(years.every((y) => y <= Number(min))).toBe(true);
  await page.selectOption("#net-year", { index: 1 });
  await expect(r).toBeDisabled();
  await expect(page.locator("#net-scrub-note")).toContainText("Choose All years to use the slider.");
  await expect(page).not.toHaveURL(/upto=/);
});

test("Play changes its name to Pause and back (no aria-pressed)", async ({ page }) => {
  await open(page, "?lens=impact&graph=proposals");
  const b = page.locator("#net-play");
  await b.click();
  await expect(b).toHaveText("Pause");
  await expect(b).not.toHaveAttribute("aria-pressed", /.*/);
  await b.click();
  await expect(b).toHaveText("Play");
  await expect(page.locator("#net-scrub-status")).toContainText("Stopped at");
});

test("Value chain: a tier opens its details; zero cells are not buttons; capped lists aren't counted", async ({
  page,
}) => {
  await page.goto("/index.html#value-chain");
  await page.waitForLoadState("networkidle");
  await page.click('.vc-tiers .chip[data-tier="compute"]');
  await expect(page.locator("#vc-panel-h")).toHaveText("Cloud and model platforms");
  await expect(page.locator("#vc-panel-h")).toBeFocused();
  await expect(page.locator("#vc-panel")).toContainText("Labs connected by sourced ties");
  await expect(page.locator(".vc-heat .vc-zero button")).toHaveCount(0);
  await expect(page.locator(".vc-heat thead")).not.toContainText("Active filers");
  await page.locator(".vc-heat .vc-num").first().click();
  await expect(page.locator("#vc-panel h4:focus")).toHaveCount(1);
});

test("Proposals: filter by what a proposal asks about (when the data has categories)", async ({ page }) => {
  const A = JSON.parse(readFileSync("data/asks.json", "utf8"));
  const P = JSON.parse(readFileSync("data/proposals.json", "utf8"));
  A.categories = [
    { id: "data-centers", label: "Data center externalities" },
    { id: "users", label: "Harms to people using AI products" },
  ];
  A.categories_note = "Test note.";
  // One classification on the page: "topic" carries the category label (scripts/build_proposal_links.py).
  P.proposals.forEach((p, i) => {
    p.category = i % 2 ? "users" : "data-centers";
    p.topic = i % 2 ? "Harms to people using AI products" : "Data center externalities";
  });
  await page.route("**/data/asks.json", (r) => r.fulfill({ json: A }));
  await page.route("**/data/proposals.json", (r) => r.fulfill({ json: P }));
  await page.goto("/index.html#feed");
  await page.waitForLoadState("networkidle");
  const n = P.proposals.filter((p) => p.category === "users" && p.company && p.year).length;
  await page.selectOption("#feed-topic", "Harms to people using AI products");
  await expect(page.locator("#feed-count")).toContainText(`Showing ${n} proposal`);
  await expect(page.locator("#tab-feed")).toContainText("Test note.");
});

test("Lab pathways: routes to a lab, sorted by strongest tie, with findings, bars and gaps", async ({ page }, info) => {
  await page.goto("/index.html#pathways");
  await page.waitForLoadState("networkidle");
  const routes = page.locator("#pw-routes tbody tr");
  await expect(page.locator("#pw-routes-h")).toHaveText("Routes to OpenAI");
  expect(await routes.count()).toBeGreaterThan(3);
  // Default sort: strongest tie first.
  const strengths = await page.$$eval("#pw-routes tbody tr td:nth-child(3) .pw-tie:first-child strong", (els) =>
    els.map((e) => Number(e.textContent)),
  );
  expect([...strengths].sort((a, b) => b - a)).toEqual(strengths);
  await expect(page.locator("#pw-status")).toContainText(/companies tied to OpenAI: \d+ with an open filing deadline/);
  await expect(page.locator("#pw-findings")).toContainText("No AI proposals filed here yet");
  // OpenAI has a company record with no ticker: no "listed itself" line.
  await expect(page.locator("#pw-lab-about")).not.toContainText("listed itself");
  // Phones: the rights-and-deadline cell comes right after the company on each card.
  if (info.project.name.startsWith("phone")) {
    const second = await page.$eval("#pw-routes tbody tr", (tr) => {
      const cells = [...tr.children].sort(
        (a, b) => Number(getComputedStyle(a).order) - Number(getComputedStyle(b).order),
      );
      return cells[1].dataset.col;
    });
    expect(second).toBe("US proxy rights and next filing deadline");
  }
  expect(await page.locator("#pw-bars li").count()).toBeGreaterThan(5);
  expect(await page.locator(".pw-gaps li").count()).toBeGreaterThan(0);
  // Choosing another lab rebuilds the table; sorting announces itself.
  await page.click('#tab-pathways [data-lab="anthropic"]');
  await expect(page.locator("#pw-routes-h")).toHaveText("Routes to Anthropic");
  await expect(page.locator("#pw-lab-about")).toContainText("ANT");
  await page.locator('#pw-routes .th-sort[data-sort="company"]').press("Enter");
  await expect(page.locator("#pw-routes th[aria-sort='ascending']")).toHaveCount(1);
  await expect(page.locator("#pw-status")).toContainText("tied to Anthropic");
  await expect(page.locator("#pw-status")).toContainText("Sorted by company, A to Z");
  // No sideways page scroll.
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over).toBeLessThanOrEqual(0);
  await page.screenshot({ path: `tests/screenshots/lab-routes-${info.project.name}.png`, fullPage: true });
  await page.locator("#pw-graph").screenshot({ path: `tests/screenshots/lab-routes-map-${info.project.name}.png` });
  await page.locator("#pw-routes").screenshot({ path: `tests/screenshots/lab-routes-table-${info.project.name}.png` });
});

test("Motion: headings reveal line by line, then return to plain text; reduced motion skips the split", async ({
  page,
  browser,
}) => {
  await page.goto("/index.html#people");
  await page.waitForLoadState("networkidle");
  await page.click('.tabs [data-group="chain"]');
  await page.click("#tabbtn-pathways");
  // Mid-reveal the heading is split into masked lines …
  expect(await page.locator("#tab-pathways h2 .rl").count()).toBeGreaterThan(0);
  // … and afterwards the lines are inline again, so it reads and wraps as plain text.
  await expect(page.locator("#tab-pathways h2")).toHaveClass(/rl-done/, { timeout: 3000 });
  await expect(page.locator("#tab-pathways h2")).toHaveText("Routes to a frontier lab");
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  const p2 = await ctx.newPage();
  await p2.goto("/index.html#people");
  await p2.waitForLoadState("networkidle");
  await p2.click('.tabs [data-group="chain"]');
  await p2.click("#tabbtn-pathways");
  expect(await p2.locator("#tab-pathways h2 .rl").count()).toBe(0);
  await ctx.close();
});

test("Network views: Connections hides proposals; Proposals shows them, with Active and Past", async ({ page }) => {
  await open(page, "?lens=impact");
  const shown = (kind) =>
    page.$$eval(
      "#net-graph svg > g > g > circle",
      (cs, k) => cs.filter((c) => c.__data__ && c.__data__.kind === k && c.getAttribute("display") !== "none").length,
      kind,
    );
  await expect(page.locator('#net-mode [data-mode="connections"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#net-pstatus")).toBeHidden();
  expect(await shown("proposal")).toBe(0);
  await page.click('#net-mode [data-mode="proposals"]');
  await expect(page).toHaveURL(/graph=proposals/);
  await expect(page.locator("#net-pstatus")).toBeVisible();
  expect(await shown("proposal")).toBeGreaterThan(10);
  expect(await shown("lab")).toBe(0);
  const active = Number((await page.locator('#net-pstatus [data-pstatus="active"]').textContent()).match(/\d+/)[0]);
  await page.click('#net-pstatus [data-pstatus="active"]');
  expect(await shown("proposal")).toBe(active);
  await expect(page.locator("#net-lens-status")).toContainText("Active");
});

test("Network views: the Policymaker lens opens on Proposals; focusing a proposal from Connections switches views", async ({
  page,
}) => {
  await open(page, "?lens=policy");
  await expect(page.locator('#net-mode [data-mode="proposals"]')).toHaveAttribute("aria-pressed", "true");
  await page.click('#net-lens input[value="impact"]');
  await page.click('#net-mode [data-mode="connections"]');
  const pid = await page.evaluate(() => {
    const c = [...document.querySelectorAll("#net-graph svg > g > g > circle")].find(
      (x) => x.__data__ && x.__data__.kind === "proposal",
    );
    return c && c.__data__.id;
  });
  await page.evaluate((id) => window.focusNetworkNode(id), pid);
  await expect(page.locator('#net-mode [data-mode="proposals"]')).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#net-lens-status")).toContainText("Switched to the Proposals view");
});

test("Laws and rules: region and status filters narrow the chart; Show everything resets", async ({ page }) => {
  await page.goto("/index.html#causality");
  await page.waitForLoadState("networkidle");
  const total = Number((await page.textContent("#cz-count")).match(/of (\d+)/)[1]);
  const regions = await page.$$eval("#cz-region option", (o) => o.map((x) => x.value).filter(Boolean));
  test.skip(!regions.length, "no region field in this data");
  await page.selectOption("#cz-region", regions[0]);
  const n = Number((await page.textContent("#cz-count")).match(/^(\d+)/)[1]);
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThan(total);
  await page.selectOption("#cz-status", { index: 1 });
  expect(Number((await page.textContent("#cz-count")).match(/^(\d+)/)[1])).toBeLessThanOrEqual(n);
  await expect(page.locator("#cz-status-key")).toContainText("Status:");
  await page.click("#cz-reset");
  await expect(page.locator("#cz-count")).toHaveText(`${total} of ${total} events shown.`);
});

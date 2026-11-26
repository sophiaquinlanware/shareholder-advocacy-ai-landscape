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
  await page.evaluate(() => window.focusNetworkNode("ask-dc-siting-rights"));
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
  await open(page, "?lens=impact");
  const r = page.locator("#net-upto");
  const min = await r.getAttribute("min");
  await r.fill(min);
  await expect(page.locator("#net-scrub-status")).toContainText(`Up to ${min}:`);
  await expect(page).toHaveURL(new RegExp(`upto=${min}`));
  await page.click('#tab-network .seg [data-view="list"]');
  const years = await page.$$eval("#net-list tbody tr", (rows) =>
    rows
      .map((tr) => tr.textContent)
      .filter((t) => /Proposal/.test(t))
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
  await open(page, "?lens=impact");
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
  await expect(page.locator("#vc-panel-h")).toHaveText("Hyperscalers and AI clouds");
  await expect(page.locator("#vc-panel-h")).toBeFocused();
  await expect(page.locator("#vc-panel")).toContainText("Labs connected by sourced ties");
  await expect(page.locator(".vc-heat .vc-zero button")).toHaveCount(0);
  await expect(page.locator(".vc-heat thead")).not.toContainText("Active filers");
  await page.locator(".vc-heat .vc-num").first().click();
  await expect(page.locator("#vc-panel h4:focus")).toHaveCount(1);
});

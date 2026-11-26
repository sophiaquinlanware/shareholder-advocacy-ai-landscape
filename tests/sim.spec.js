// Test plans over time (sim.js) and the section order: context first, planning and testing last.
import { expect, test } from "@playwright/test";

async function open(page, path) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

test("sections run from context to planning, each pointing to the next", async ({ page }) => {
  await open(page, "/index.html#start");
  const tabs = await page.locator('.tabs [role="tab"][data-group]').allTextContents();
  expect(tabs.map((s) => s.trim())).toEqual([
    "Deadlines and votes",
    "Company profiles",
    "AI value chain",
    "Proposals and results",
    "Network and contacts",
    "Laws and rules",
    "Plan and test",
  ]);
  await page.locator("#grp-start .next-section a").click();
  await expect(page.locator("#tab-company")).toBeVisible();
});

test("a plan from the planner runs as a scenario with labelled results", async ({ page }) => {
  await open(page, "/index.html?plan=microsoft~ask-ai-oversight-reporting#simulate");
  await expect(page.locator("#tab-simulate h2")).toHaveText("Test plans over time");
  await expect(page.locator('#sim-plans select[data-f="co"]').first()).toHaveValue("MSFT");
  await page.locator("#sim-run").click();
  await expect(page.locator("#sim-status")).toContainText("Results below");
  await expect(page.locator("#sim-out")).toContainText("Not a forecast; not advice.");
  await expect(page.locator("#sim-out")).toContainText(
    "Microsoft, Board oversight and AI transparency reporting: commits by",
  );
  await expect(page.locator("#sim-chart svg")).toBeVisible();
  await expect(page.locator(".sim-log li").first()).toBeVisible();
  // The field moves back to a recorded season.
  await page.locator("#sim-season").fill("2024");
  await expect(page.locator("#sim-field")).toContainText("Recorded season 2024");
});

test("plans compare side by side, and the same plan gives the same result", async ({ page }) => {
  await open(page, "/index.html?plan=amazon~ask-dc-climate-energy#simulate");
  await expect(page.locator("#sim-status")).toContainText("Results below");
  await page.locator("#sim-addplan").click();
  await page.locator("#sim-run").click();
  await expect(page.locator("#sim-status")).toContainText("Results below");
  const cards = page.locator("#sim-out .pl-grid .pl-card");
  await expect(cards).toHaveCount(2);
  const a = await cards.nth(0).locator("li").first().innerText();
  const b = await cards.nth(1).locator("li").first().innerText();
  expect(a).toBe(b);
});

test("the ranking lists company-and-ask pairs and adds one to the plan", async ({ page }) => {
  test.setTimeout(60000);
  await open(page, "/index.html#simulate");
  await page.locator("#sim-sweep").click();
  await expect(page.locator("#sim-sweep-out table tbody tr")).toHaveCount(12, { timeout: 45000 });
  await page.locator("#sim-sweep-out [data-co]").first().click();
  await expect(page.locator("#sim-plans .sim-plan").first().locator(".sim-target")).toHaveCount(2);
});

test("the planner hands its company and ask to the simulator", async ({ page }) => {
  await open(page, "/index.html?plan=amazon~ask-dc-climate-energy#planner");
  await page.waitForSelector("#pl-out h3");
  await page.locator("#pl-next").click();
  await expect(page.locator("#tab-simulate h2")).toHaveText("Test plans over time");
  await expect(page.locator('#sim-plans select[data-f="co"]').first()).toHaveValue("AMZN");
  await expect(page.locator('#sim-plans select[data-f="ask"]').first()).toHaveValue("ask-dc-climate-energy");
  // A scenario is shown on arrival.
  await expect(page.locator("#sim-out")).toContainText("Not a forecast; not advice.");
});

test("a refile the rule allows is not blocked by a vote on a proposal from a filer critical of ESG", async ({
  page,
}) => {
  // Amazon, data center energy: 20.11% in 2025, then 18.39% and an anti-ESG 1.23% in 2026. 18.39% clears the 15% bar.
  await open(page, "/index.html?plan=amazon~ask-dc-climate-energy#simulate");
  await expect(page.locator("#sim-out")).toContainText("Amazon, Data center energy, emissions and costs: commits by");
  await expect(page.locator("#sim-out .pl-grid li").first()).not.toContainText(
    "blocked by the SEC rule at least once in 100%",
  );
});

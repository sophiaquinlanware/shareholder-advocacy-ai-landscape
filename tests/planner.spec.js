// Engagement planner (planner.js): one company and one ask, with sources on every line.
import { expect, test } from "@playwright/test";

async function open(page, query = "") {
  await page.goto(`/index.html${query}#planner`);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("#pl-out h3");
}

test("the planner opens with a company and an ask, and shows its five parts", async ({ page }, info) => {
  await open(page);
  await expect(page.locator("#tab-planner h2")).toHaveText("Plan an engagement");
  for (const h of ["#pl-h-time", "#pl-h-rec", "#pl-h-who", "#pl-h-pol", "#pl-h-ideas"]) await expect(page.locator(h)).toBeVisible();
  await expect(page.locator("#pl-co")).not.toHaveValue("");
  await expect(page.locator("#pl-ask")).not.toHaveValue("");
  await page.screenshot({ path: `tests/screenshots/${info.project.name}/planner-full.png`, fullPage: true });
});

test("changing the company or ask redraws the plan and keeps it in the address", async ({ page }) => {
  await open(page);
  await page.selectOption("#pl-co", { label: "Alphabet (GOOGL)" });
  await page.selectOption("#pl-ask", "ask-dc-water");
  await expect(page.locator("#pl-h-time")).toContainText("Alphabet");
  await expect(page).toHaveURL(/plan=alphabet~ask-dc-water/);
  await expect(page.locator("#pl-link")).toHaveAttribute("href", /plan=alphabet~ask-dc-water/);
});

test("a shared link opens the same plan", async ({ page }) => {
  await open(page, "?plan=meta-platforms~ask-child-safety");
  await expect(page.locator("#pl-co")).toHaveValue("meta-platforms");
  await expect(page.locator("#pl-ask")).toHaveValue("ask-child-safety");
});

test("collaborators come with their reasons and sources, and the shortlist keeps them", async ({ page }) => {
  await open(page, "?plan=microsoft~ask-ai-misinformation");
  const rows = page.locator("#pl-out .pl-wide tbody tr");
  await expect(rows.first()).toBeVisible();
  await expect(rows.first().locator(".pl-why li").first()).toBeVisible();
  await rows.first().locator(".pl-add").click();
  await expect(page.locator("#pl-shortlist h3")).toHaveText("Your shortlist (1)");
  await expect(page.locator("#pl-export")).toBeVisible();
  await page.reload();
  await page.waitForSelector("#pl-out h3");
  await expect(page.locator("#pl-shortlist h3")).toHaveText("Your shortlist (1)");
});

test("the company × ask grid opens a plan for the chosen square", async ({ page }) => {
  await open(page);
  await page.click("#pl-matrix-box > summary");
  const cell = page.locator('.pl-mx[data-co="nvidia"][data-ask="ask-customer-due-diligence"]');
  await cell.click();
  await expect(page.locator("#pl-co")).toHaveValue("nvidia");
  await expect(page.locator("#pl-ask")).toHaveValue("ask-customer-due-diligence");
});

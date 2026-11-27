// Engagement timelines, the commitments ledger and the SEC's step back from exclusions (campaigns.js, planner.js, sim.js).
import { expect, test } from "@playwright/test";

async function open(page, path) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

test("a company profile shows its engagement timeline and commitments ledger, each step sourced", async ({ page }) => {
  await open(page, "/index.html#company");
  const pick = page.locator("#co-pick");
  await pick.selectOption({ label: "Walt Disney (DIS)" });
  const slot = page.locator("#co-body .campaigns-slot");
  await expect(slot).toContainText("Engagement timeline");
  await expect(slot).toContainText("Withdrawn after a company commitment");
  await expect(slot.locator(".cp-ladder").first()).toBeVisible();
  await expect(slot.locator(".cp-states li").first().locator("a.src, .unverified")).toHaveCount(1);
  await expect(slot).toContainText("Commitments ledger");
  await expect(slot.locator(".cp-ledger")).toContainText("Delivered");
});

test("Results of private engagement opens with outcomes across the ladder and the field figures", async ({ page }) => {
  await open(page, "/index.html#outcomes");
  const box = page.locator("#tab-outcomes .cp-outcomes");
  await expect(box).toContainText("Withdrawn after a company commitment");
  await expect(box).toContainText("Commitments ledger, all companies");
  await expect(box).toContainText("Glass Lewis");
});

test("the planner shows the ladder for the chosen ask and the SEC's role in exclusions", async ({ page }) => {
  await open(page, "/index.html?plan=verisk-analytics~ask-ai-oversight-reporting#planner");
  await page.waitForSelector("#pl-out h3");
  await expect(page.locator("#pl-out .campaigns-slot")).toContainText("The engagement ladder here");
  const time = page.locator("#pl-h-time").locator("..");
  await expect(time).toContainText("SEC review if the company excludes your proposal");
  await expect(time).toContainText("until the Division announces otherwise");
  await expect(time).toContainText("$2,000 of shares held for 3 years");
});

test("the simulator's exclusion setting names the first season without SEC review", async ({ page }) => {
  await open(page, "/index.html#simulate");
  await expect(page.locator("#sim-status")).toContainText(/updated below|unchanged/);
  await expect(page.locator('#sim-settings select[data-s="exclRegime"]')).toHaveValue("latest");
  await expect(page.locator('#sim-settings select[data-s="exclRegime"] option').first()).toContainText(
    "did not review most exclusions",
  );
});

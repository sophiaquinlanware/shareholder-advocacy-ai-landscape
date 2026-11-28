// Fixes from the 2026-11-26 full sweep (docs/reviews/2026-11-26 full sweep result R1 *).
import { expect, test } from "@playwright/test";

async function open(page, path = "/index.html") {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

test("quick search opens a company with no ticker on its own profile", async ({ page }) => {
  await open(page, "/index.html#start");
  await page.keyboard.press("ControlOrMeta+k");
  await page.locator(".qs-input").fill("OpenAI");
  await page.locator(".qs-list [data-k]", { hasText: "Company" }).first().click();
  await expect(page.locator("#co-pick")).toHaveValue("openai");
});

test("a planner link with a ticker or a broken code still opens a plan", async ({ page }) => {
  await open(page, "/index.html?plan=MSFT~ask-ai-misinformation#planner");
  await page.waitForSelector("#pl-out h3");
  await expect(page.locator("#pl-co")).toHaveValue("microsoft");
  await expect(page.locator("#pl-ask")).toHaveValue("ask-ai-misinformation");
  await open(page, "/index.html?plan=%E0%A4%A#planner");
  await expect(page.locator("#pl-out h3").first()).toBeVisible();
});

test("copying a plan link shows a visible message", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  await open(page, "/index.html#planner");
  await page.waitForSelector("#pl-out h3");
  await page.locator("#pl-copy").click();
  await expect(page.locator("#pl-copy-msg")).not.toBeEmpty();
  await expect(page.locator("#pl-copy-msg")).toBeVisible();
});

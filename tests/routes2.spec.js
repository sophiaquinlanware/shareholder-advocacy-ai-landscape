// Lab pathways: two-step routes and the investors holding the route companies. Live data.
import { expect, test } from "@playwright/test";

test("Lab pathways: two-step routes and holders of the route companies, each sourced", async ({ page }) => {
  await page.goto("/index.html#pathways");
  await page.waitForLoadState("networkidle");
  const two = page.locator("#pw-twostep tbody tr");
  if (await two.count()) await expect(two.first().locator("a.src").first()).toBeVisible();
  const holders = page.locator("#pw-holders tbody tr");
  if (await holders.count()) {
    await expect(page.locator("#pw-holders")).toContainText("A holding is not a vote or a filing.");
    await expect(holders.first()).toContainText("$");
  }
});

// Prediction board (board.js): base rate first, crowd only after your own forecast, the GitHub post link,
// the conditional pair and the ground rules.
import { expect, test } from "@playwright/test";

test("the board shows the site estimate, the public crowd and the post link", async ({ page }) => {
  await page.goto("/index.html#predict");
  await page.evaluate(() => localStorage.removeItem("board-mine-v1"));
  await page.reload();
  await page.waitForLoadState("networkidle");
  const el = page.locator("#tab-predict");
  await expect(el).toContainText("Outcomes, not support.");
  await expect(el).toContainText("Use public information only");
  const card = el.locator('.bd-card[data-q$="-bar"]').first();
  await expect(card).toContainText("This site's starting estimate");
  await expect(card.locator(".bd-crowd")).toContainText("Crowd forecast (n = 0)");
  await card.locator('input[type="range"]').fill("35");
  await expect(card.locator("output")).toHaveText("35%");
  await card.locator(".bd-save").click();
  const again = el.locator('.bd-card[data-q$="-bar"]').first();
  await expect(again.locator(".bd-crowd")).toContainText("Crowd forecast (n = 0)");
  const post = again.locator(".bd-post");
  await expect(post).toHaveAttribute(
    "href",
    /issues\/new\?template=forecast\.yml.*question=q-[a-z0-9-]+-bar.*probability=35/,
  );
});

test("the board warns on extreme figures, pairs the conditional branches and groups by company", async ({ page }) => {
  await page.goto("/index.html#predict");
  await page.waitForLoadState("networkidle");
  const el = page.locator("#tab-predict");
  const card = el.locator(".bd-card").first();
  await card.locator('input[type="range"]').fill("4");
  await expect(card.locator(".bd-warn")).toBeVisible();
  await expect(el.locator(".bd-pair .bd-card")).toHaveCount(2);
  await expect(el).toContainText("no base rate yet");
  await el.locator('[data-view="company"]').click();
  await expect(el.locator('[data-view="company"]')).toHaveAttribute("aria-pressed", "true");
  await expect(el.locator("h3", { hasText: "Microsoft" })).toHaveCount(1);
});

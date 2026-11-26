// Motion brief stages 3–10: quick search, phone card tables, and nothing moving under reduced motion.
import { expect, test } from "@playwright/test";

test("Quick search: Cmd/Ctrl+K opens it, typing finds a company, Enter opens its profile, Esc closes", async ({
  page,
}) => {
  await page.goto("/index.html");
  await page.waitForLoadState("networkidle");
  await page.click(".qs-open");
  const box = page.locator(".qs-backdrop");
  await expect(box).toBeVisible();
  await page.keyboard.type("nvid");
  await expect(page.locator(".qs-list li").first()).toContainText("Nvidia");
  await page.keyboard.press("Enter");
  await expect(box).toBeHidden();
  await expect(page).toHaveURL(/#company/);
  await page.keyboard.press("Control+k");
  await expect(box).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(box).toBeHidden();
});

test("Phones: ordinary tables read as labelled cards; desktop keeps tables", async ({ page }, info) => {
  await page.goto("/index.html#people");
  await page.waitForLoadState("networkidle");
  const t = page.locator("#tab-people table").first();
  await expect(t).toHaveClass(/as-cards/);
  const firstCell = t.locator("tbody td").first();
  await expect(firstCell).toHaveAttribute("data-col", /.+/);
  const display = await t.evaluate((el) => getComputedStyle(el).display);
  if (info.project.name.startsWith("phone")) expect(display).toBe("block");
  else expect(display).toBe("table");
});

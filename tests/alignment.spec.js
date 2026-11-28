// Listed labs: file directly, and Safety asks (alignment.js).
import { expect, test } from "@playwright/test";

test("listed labs show who controls the vote, how to file and a planner link", async ({ page }) => {
  await page.goto("/index.html#listed-labs");
  await page.waitForLoadState("networkidle");
  const el = page.locator("#tab-listed-labs");
  await expect(el.locator("h2")).toHaveText("Frontier labs you can file at");
  await expect(el.locator(".al-lab")).toHaveCount(2);
  await expect(el.locator(".al-lab").first()).toContainText("Who controls the vote");
  await expect(el.locator(".al-lab").first()).toContainText("February 1 and March 3, 2027");
  await expect(el.locator(".al-lab a.bd-btn").first()).toHaveAttribute("href", /plan=anthropic~/);
  await expect(el).toContainText("Labs reachable only through others");
});

test("safety asks list sources, precedents, exclusion risk and labelled example wording", async ({ page }) => {
  await page.goto("/index.html#asks");
  await page.waitForLoadState("networkidle");
  const el = page.locator("#tab-asks");
  await expect(el.locator(".al-ask")).toHaveCount(9);
  const board = el.locator("#ask-board-oversight");
  await expect(board).toContainText("9.70%");
  await expect(board).toContainText("Written by this site as an illustration");
  await expect(el.locator("#ask-safety-framework")).toContainText("None found in SEC full-text search");
});

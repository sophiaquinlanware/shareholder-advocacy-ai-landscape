// Support range, logged forecasts and the ask designer (planner-tools.js); seats and the game clock (sim.js);
// dataset dates (freshness.js).
import { expect, test } from "@playwright/test";

async function open(page, path) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

test("the planner gives a support range with its backtest, the dual-class floor and N-PX records", async ({ page }) => {
  await open(page, "/index.html?plan=meta-platforms~ask-ai-training-data#planner");
  const card = page.locator("#pt-h-fc").locator("..");
  await expect(card).toContainText("middle 80% of past errors");
  await expect(card).toContainText("not a forecast of this vote and not advice");
  await expect(card).toContainText("not yet reviewed");
  await expect(card).toContainText("Form N-PX");
  await card.locator("summary", { hasText: "How the rule did on past votes" }).click();
  await expect(card).toContainText("Middle band:");
});

test("a logged forecast is kept in this browser and listed", async ({ page }) => {
  await open(page, "/index.html?plan=meta-platforms~ask-ai-training-data#planner");
  await page.evaluate(() => localStorage.removeItem("planner-forecasts-v1"));
  const form = page.locator(".pt-log");
  await form.locator('[name="lo"]').fill("8");
  await form.locator('[name="hi"]').fill("14");
  await form.locator("button[type=submit]").click();
  await expect(page.locator(".pt-logged")).toContainText("awaiting that season's vote result");
  await expect(page.locator(".pt-log-msg")).toContainText("Logged in this browser");
});

test("the ask designer places wording and lists past proposals without judging", async ({ page }) => {
  await open(page, "/index.html?plan=meta-platforms~ask-ai-training-data#planner");
  await page
    .locator("#pt-ask-text")
    .fill("Resolved: shareholders request that the company cease using user data to train AI models.");
  await page.locator("#pt-ask-go").click();
  await expect(page.locator("#pt-ask-out")).toContainText("Main request reads as operational mandate");
  await expect(page.locator("#pt-ask-out")).toContainText("Past proposals for comparison");
  await page
    .locator("#pt-ask-text")
    .fill("Resolved: shareholders request a report on how the company assesses risks from AI.");
  await page.locator("#pt-ask-go").click();
  await expect(page.locator("#pt-ask-out")).toContainText("Main request reads as disclosure request");
});

test("each seat lists its moves, and a covered move can be tried in the scenarios", async ({ page }) => {
  await open(page, "/index.html#simulate");
  await page.locator('[data-seat="policy"]').first().click();
  await expect(page.locator("#sim-seat")).toContainText("Adopt the SEC's proposed rescission");
  await page.locator("#sim-seat .sim-apply").first().click();
  await expect(page.locator('#sim-settings input[data-s="rescind"]')).toBeChecked();
  await expect(page.locator("#sim-status")).toContainText(/updated below|unchanged/);
  await page.locator('[data-seat="advisor"]').first().click();
  await expect(page.locator("#sim-seat")).toContainText("not public");
  await page.locator("summary", { hasText: "Game clock" }).click();
  await expect(page.locator("#sim-clock")).toContainText("days");
});

test("the footer lists when each dataset was last checked", async ({ page }) => {
  await open(page, "/index.html#start");
  await page.locator(".freshness summary").click();
  await expect(page.locator(".freshness table")).toContainText("Fund-family votes");
  await expect(page.locator(".freshness table")).toContainText("Commitments ledger");
});

test("the ask designer leaves filers critical of ESG out of its support span, and needs text", async ({ page }) => {
  await open(page, "/index.html?plan=meta-platforms~ask-ai-training-data#planner");
  await page.locator("#pt-ask-go").click();
  await expect(page.locator("#pt-ask-out")).toContainText("Write or paste a resolved clause first");
  await page.locator("#pt-ask-text").fill("Resolved: shareholders request a report on AI data usage oversight.");
  await page.locator("#pt-ask-go").click();
  await expect(page.locator("#pt-ask-out")).toContainText("filed by a filer critical of ESG");
  await expect(page.locator("#pt-ask-out")).toContainText("leaving out filers critical of ESG");
});

test("a refile at a dual-class company shows a floor, never above 100%", async ({ page }) => {
  await open(page, "/index.html?plan=meta-platforms~ask-ai-training-data#planner");
  const card = page.locator("#pt-h-fc").locator("..");
  await expect(card).toContainText("Dual-class control");
  const text = await card.innerText();
  const m = /was at least (\d+)%/.exec(text);
  expect(m && +m[1]).toBeLessThanOrEqual(100);
});

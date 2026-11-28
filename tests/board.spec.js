// Prediction board (board.js): base rate first, crowd only after your own forecast, the GitHub post link,
// the conditional pair and the ground rules.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// A fixed copy of the questions with every question open, so the tests don't change as votes resolve.
const FIXTURE = readFileSync(new URL("./fixtures/forecast-questions.json", import.meta.url), "utf8");
test.beforeEach(async ({ page }) => {
  await page.route("**/data/forecast-questions.json*", (route) =>
    route.fulfill({ contentType: "application/json", body: FIXTURE }),
  );
});

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
  // Posting opens an inline form (group, stake, confirmation), with a GitHub link as the alternative.
  await again.locator(".bd-post > summary").click();
  await expect(again.locator(".bd-postform select[name=group]")).toBeVisible();
  await expect(again.locator(".bd-postform a")).toHaveAttribute(
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
  await el.locator('[data-view="topic"]').click();
  await expect(el.locator(".bd-pair")).toHaveCount(2);
  await expect(el.locator(".bd-pair .bd-card")).toHaveCount(4);
  await expect(el).toContainText("no base rate yet");
  await el.locator('[data-view="company"]').click();
  await expect(el.locator('[data-view="company"]')).toHaveAttribute("aria-pressed", "true");
  await expect(el.locator("h3", { hasText: "Microsoft" })).toHaveCount(1);
});

test("the board says how to post a forecast and how to put a proposal on the board", async ({ page }) => {
  await page.goto("/index.html#predict");
  await page.waitForLoadState("networkidle");
  const take = page.locator(".bd-take");
  await expect(take).toContainText("Forecast a question");
  await expect(take).toContainText("Put a proposal on the board");
  await take.locator(".bd-suggest > summary").click();
  await expect(take.locator(".bd-suggestform textarea[name=question]")).toBeVisible();
  await expect(take.locator("#bd-acct")).toBeVisible();
  await page.goto("/index.html?plan=meta-platforms~ask-ai-training-data#planner");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#pl-board")).toHaveAttribute("href", /template=suggest-question\.yml.*company=Meta/);
  await page.locator("#pl-board-box > summary").click();
  await expect(page.locator("#pl-board-form input[name=company]")).toHaveValue(/Meta/);
});

test("questions rank most likely first, a seat's scenario figures can be tried, and your forecasts glow at the top", async ({
  page,
}) => {
  await page.goto("/index.html#predict");
  await page.evaluate(() => localStorage.removeItem("board-mine-v1"));
  await page.reload();
  await page.waitForLoadState("networkidle");
  const el = page.locator("#tab-predict");
  await expect(el.locator('[data-view="likely"]')).toHaveAttribute("aria-pressed", "true");
  await expect(el.locator(".bd-scen").first()).toContainText("Scenario, Parnassus Investments seat");
  await el.locator("[data-seat]").first().click();
  await expect(el.locator(".bd-minelist li")).toHaveCount(4);
  await expect(el.locator(".bd-card.bd-mine")).toHaveCount(4);
  await expect(el.locator('.bd-card.bd-mine[data-q="q-msft-water-absolute-2028"]')).toContainText("Your forecast 15%");
});

test("board links stay on the board, saving updates Your forecasts, and a seat keeps your own figures", async ({
  page,
}) => {
  await page.goto("/index.html#predict");
  await page.evaluate(() => localStorage.removeItem("board-mine-v1"));
  await page.reload();
  await page.waitForLoadState("networkidle");
  const el = page.locator("#tab-predict");
  await el.locator('[data-jump="bd-questions"]').click();
  await expect(el).toBeVisible();
  await expect(page.locator("#tab-start")).toBeHidden();
  const card = el.locator('.bd-card[data-q="q-msft-water-absolute-2028"]');
  await card.locator('input[type="range"]').fill("40");
  await card.locator(".bd-save").click();
  await expect(el.locator(".bd-minelist li")).toHaveCount(1);
  await expect(el.locator(".bd-minelist")).toContainText("Yours 40%");
  await el.locator(".bd-minelist [data-jump]").first().click();
  await expect(page.locator("#tab-start")).toBeHidden();
  await el.locator("[data-seat]").first().click();
  await expect(el.locator(".bd-minelist li")).toHaveCount(4);
  await expect(el.locator('.bd-card[data-q="q-msft-water-absolute-2028"]')).toContainText("Your forecast 40%");
  await expect(el.locator(".bd-seat-msg")).toContainText("kept your own on 1");
});

test("after trying a seat, one button posts all unposted forecasts, and the group choice is remembered", async ({
  page,
}) => {
  await page.goto("/index.html#predict");
  await page.evaluate(() => {
    localStorage.removeItem("board-mine-v1");
    localStorage.setItem("board-post-v1", JSON.stringify({ group: "Academic or researcher", stake: true }));
  });
  await page.reload();
  await page.waitForLoadState("networkidle");
  const el = page.locator("#tab-predict");
  await el.locator("[data-seat]").first().click();
  const all = el.locator(".bd-minebox details.bd-post");
  await expect(all.locator("summary")).toContainText("Post all 4 not yet posted");
  await all.locator("summary").click();
  await expect(all.locator("select[name=group]")).toHaveValue("Academic or researcher");
  await expect(all.locator("input[name=stake]")).toBeChecked();
});

// Lens Phase 3 (Individual investor): a list of upcoming AI proposals first, the graph on request,
// fund votes from Form N-PX, and plain-language definitions in this lens only. Live data, fixed clock.
import { expect, test } from "@playwright/test";

const TODAY = new Date("2026-11-25T17:00:00Z"); // noon US Eastern

async function openFeed(page, query = "?lens=individual") {
  await page.clock.setFixedTime(TODAY);
  await page.goto(`/index.html${query}#network`);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("#lf-status[data-ready]", { state: "attached" });
}
async function show(page, text) {
  await page.fill("#lf-in", text);
  await page.click('#lf-form button[type="submit"]');
}

test("the Individual investor lens opens on the list, not the graph", async ({ page }) => {
  await openFeed(page);
  await expect(page.locator("#net-feed")).toBeVisible();
  await expect(page.locator("#net-graph-area")).toBeHidden();
  await expect(page).toHaveURL(/view=feed/);
  await expect(page.locator("#lf-h")).toHaveText("Upcoming AI proposals in this tracker");
  const n = await page.locator(".feed-item").count();
  expect(n).toBeGreaterThan(0);
  await expect(page.locator("#lf-status")).toContainText(`Showing ${n} upcoming AI`);
});

test("tickers and a fund: the list narrows and shows the fund's earlier vote with its filing", async ({ page }) => {
  await openFeed(page);
  await show(page, "MSFT, Vanguard");
  await expect(page.locator("#lf-h")).toHaveText("Upcoming AI proposals at your companies");
  await expect(page.locator("#lf-status")).toContainText("for MSFT; fund family: Vanguard.");
  const fund = page.locator(".feed-fund").first();
  await expect(fund.locator("h5")).toHaveText(/How Vanguard funds voted (last year|on the \d{4} version)/);
  await expect(fund).toContainText("Vanguard: ");
  await expect(fund).toContainText("matched in this dataset by company, topic and similar title");
  await expect(page.locator(".feed-item").filter({ hasText: "Cisco" })).toHaveCount(0);
});

test("a company with no upcoming AI proposal says so, scoped to this tracker", async ({ page }) => {
  await openFeed(page);
  await show(page, "AAPL");
  await expect(page.locator(".feed-quiet")).toContainText("No upcoming AI proposals in this tracker for Apple.");
});

test("a fund family with no readable votes gives the reason; unknown input is reported", async ({ page }) => {
  await openFeed(page);
  await show(page, "Praxis, ZZZZ");
  await expect(page.locator("#lf-status")).toContainText("Praxis files Form N-PX only in the older text format");
  await expect(page.locator("#lf-status")).toContainText(
    /Not found among the \d+ tracked companies or the \d+ fund families with readable Form N-PX votes: ZZZZ/,
  );
});

test("See the bigger picture: graph with holdings, focus moves, URL keeps the view; and back", async ({ page }) => {
  await openFeed(page);
  await show(page, "MSFT");
  await page.click("#lf-to-graph");
  await expect(page.locator("#net-graph-area")).toBeVisible();
  await expect(page.locator("#net-feed")).toBeHidden();
  await expect(page.locator("#lf-back")).toBeFocused();
  await expect(page).toHaveURL(/view=graph/);
  await expect(page.locator("#net-hold-status")).toContainText("1 in this map (MSFT)");
  await page.click("#lf-back");
  await expect(page.locator("#net-feed")).toBeVisible();
  await expect(page.locator("#lf-to-graph")).toBeFocused();
});

test("plain-language terms open as disclosures and close with Esc", async ({ page }) => {
  await openFeed(page);
  const t = page.locator("#net-feed .term").first();
  await t.click();
  await expect(t).toHaveAttribute("aria-expanded", "true");
  const def = page.locator(`#${await t.getAttribute("aria-controls")}`);
  await expect(def).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(def).toBeHidden();
  await expect(t).toBeFocused();
});

test("other lenses have no list and no view= in the URL", async ({ page }) => {
  await openFeed(page);
  await page.check('#net-lens input[value="impact"]');
  await expect(page.locator("#net-graph-area")).toBeVisible();
  await expect(page.locator("#net-feed")).toBeHidden();
  await expect(page.locator("#lf-back")).toBeHidden();
  await expect(page).not.toHaveURL(/view=/);
});

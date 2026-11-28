// Engagement planner (planner.js): one company and one ask, with sources on every line.
import { expect, test } from "@playwright/test";

async function open(page, query = "") {
  await page.goto(`/index.html${query}#planner`);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("#pl-out h3");
}

test("the planner opens blank, and a plan shows its parts", async ({ page }, info) => {
  await open(page);
  await expect(page.locator("#pl-co")).toHaveValue("");
  await expect(page.locator(".pl-empty")).toBeVisible();
  await open(page, "?plan=microsoft~ask-dc-climate-energy");
  await expect(page.locator("#tab-planner h2")).toHaveText("Plan an engagement");
  for (const h of ["#pl-h-time", "#pl-h-rec", "#pl-h-who", "#pl-h-pol", "#pl-h-ideas"])
    await expect(page.locator(h)).toBeVisible();
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
});

test("a shared link opens the same plan", async ({ page }) => {
  await open(page, "?plan=meta-platforms~ask-child-safety");
  await expect(page.locator("#pl-co")).toHaveValue("meta-platforms");
  await expect(page.locator("#pl-ask")).toHaveValue("ask-child-safety");
});

test("collaborators come with their reasons and sources, and the shortlist keeps them", async ({ page }) => {
  await open(page, "?plan=microsoft~ask-ai-misinformation");
  const rows = page.locator("#pl-out .pl-orgs tbody tr");
  await expect(rows.first()).toBeVisible();
  await expect(rows.first().locator(".pl-why li").first()).toBeVisible();
  await rows.first().locator(".pl-add").click();
  await expect(page.locator("#pl-shortlist h3")).toHaveText("Your shortlist (1)");
  await expect(page.locator("#pl-export")).toBeVisible();
  await page.reload();
  await page.waitForSelector("#pl-out h3");
  await expect(page.locator("#pl-shortlist h3")).toHaveText("Your shortlist (1)");
});

test("the planner has no grid of its own; a tracker square opens a plan for that square", async ({ page }) => {
  await open(page, "?plan=microsoft~ask-dc-climate-energy");
  await expect(page.locator("#tab-planner .pl-mx")).toHaveCount(0);
  await page.goto("/index.html#tracker");
  const cell = page.locator('#feed-trk .pl-mx[data-co="nvidia"][data-ask="ask-customer-due-diligence"]');
  await cell.click();
  await expect(page.locator("#pl-co")).toHaveValue("nvidia");
  await expect(page.locator("#pl-ask")).toHaveValue("ask-customer-due-diligence");
});

test("shortlisting keeps focus on the button, and fund votes carry a source and review status", async ({ page }) => {
  await open(page, "?plan=microsoft~ask-dc-climate-energy");
  const btn = page.locator(".pl-add").first();
  const org = await btn.getAttribute("data-org");
  await btn.click();
  await expect(page.locator(`.pl-add[data-org="${org}"]`)).toBeFocused();
  await expect(page.locator(`.pl-add[data-org="${org}"]`)).toHaveAttribute("aria-pressed", "true");
  const votes = page.locator(".pl-why li", { hasText: "Its funds voted FOR this ask" }).first();
  await expect(votes.locator("a.src")).toHaveCount(1);
});

test("filings from filers critical of ESG are marked and left out of the support figures", async ({ page }) => {
  await open(page, "?plan=microsoft~ask-ai-training-data");
  const rec = page.locator("#pl-h-rec").locator("..");
  await expect(rec).toContainText("filers critical of ESG and are left out of the support figures");
  await expect(rec.locator("li").first()).toContainText("filed by a filer critical of ESG");
  // The grid leaves them out too: a square filed only by such filers is dashed and shows no support number.
  await page.goto("/index.html#tracker");
  const sq = page.locator('#feed-trk .pl-mx[data-co="microsoft"][data-ask="ask-ai-training-data"]');
  await expect(sq).toHaveClass(/crit/);
  await expect(sq).toHaveAttribute("aria-label", /all by filers critical of ESG/);
  await expect(sq).not.toHaveText(/\d/);
});

test("grid rows keep the full ask name for screen readers and fit two lines on phones", async ({ page }, info) => {
  await page.goto("/index.html#tracker");
  await page.waitForSelector("#feed-trk .pl-mx-row");
  const row = page.locator(".pl-mx-row").first();
  await expect(row.locator(".pl-long")).toHaveText("Data center water use");
  if (info.project.name.startsWith("phone")) {
    const heights = await page
      .locator(".pl-mx-row")
      .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    expect(Math.max(...heights)).toBeLessThan(60);
  }
});

test("a company outside the US proxy rules shows its route, and a link to a company not on file falls back", async ({
  page,
}) => {
  await open(page, "?plan=tencent-holdings~ask-dc-climate-energy");
  await expect(page.locator("#pl-h-time").locator("..")).toContainText("Listed outside the US.");
  await expect(page.locator("#pl-h-time").locator("..")).not.toContainText("Rule 14a-8 ends");
  await open(page, "?plan=no-such-company~no-such-ask");
  await expect(page.locator("#pl-co")).not.toHaveValue("");
  await expect(page.locator("#pl-h-time")).not.toContainText("undefined");
});

test("ideas leave out the company and ask already chosen", async ({ page }) => {
  await open(page, "?plan=microsoft~ask-ai-misinformation");
  const ideas = page.locator("#pl-h-ideas").locator("..");
  await expect(ideas.locator('.pl-co[data-co="microsoft"]')).toHaveCount(0);
  await expect(ideas.locator('.pl-ask[data-ask="ask-ai-misinformation"]')).toHaveCount(0);
});

test("where to focus shows a sourced poll for the ask, and the not-found note where there is none", async ({
  page,
}) => {
  await open(page, "?plan=microsoft~ask-dc-water");
  const polls = page.locator("#pl-out .pl-focus .pl-poll");
  await expect(polls.first()).toContainText("79%");
  await expect(polls.first().locator("a.src")).toHaveAttribute("href", /^https:\/\//);
  await page.selectOption("#pl-ask", "ask-ai-fossil-fuels");
  await expect(page.locator("#pl-out .pl-focus")).toContainText("No poll found");
});

test("the tracker in Proposals and results is keyboard reachable and opens a square in the planner", async ({
  page,
}) => {
  await page.goto("/index.html#tracker");
  await page.waitForSelector("#feed-trk button.pl-mx");
  const first = page.locator("#feed-trk button.pl-mx").first();
  await expect(first).toHaveAttribute("tabindex", "0");
  await first.focus();
  await page.keyboard.press("ArrowRight");
  const second = page.locator("#feed-trk button.pl-mx").nth(1);
  await expect(second).toBeFocused();
  const co = await second.getAttribute("data-co"),
    ask = await second.getAttribute("data-ask");
  await page.keyboard.press("Enter");
  await expect(page.locator("#tab-planner")).toBeVisible();
  await expect(page.locator("#pl-co")).toHaveValue(co);
  await expect(page.locator("#pl-ask")).toHaveValue(ask);
  // One grid on the site: the tracker (owner, 2026-11-27: no redundant graphs).
  expect(await page.locator("#pl-h-mx").count()).toBe(0);
  expect(await page.locator("#pl-h-trk").count()).toBe(1);
});

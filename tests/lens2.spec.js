// Lens Phase 2 (Impact investor): deadline, seeking and resubmission marks; holdings; topics not filed;
// warm path. Fields the live data doesn't have yet are added to a copy of data/graph.json inside the test
// (page.route), so nothing test-only ships in dist/.
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const TODAY = new Date("2026-11-25T17:00:00Z"); // noon US Eastern

function fixture() {
  const G = JSON.parse(readFileSync("data/graph.json", "utf8"));
  const node = (id) => G.nodes.find((n) => n.id === id);
  Object.assign(node("msft-2026-climate-ai-dc"), {
    filing_deadline: "2027-01-15",
    filing_deadline_source: "https://www.sec.gov/test-deadline",
  });
  Object.assign(node("msft-2026-hrdd-ai-misuse"), {
    seeking: [
      {
        type: "co-filer",
        note: "holding $2,000+ for 3 years",
        posted_by: "Test Org A",
        posted_at: "2026-11-01",
        verified: false,
        contact_url: "https://example.org/contact",
      },
      {
        type: "exempt solicitation",
        note: "hidden type",
        posted_by: "Test Org B",
        posted_at: "2026-11-02",
        verified: true,
      },
    ],
  });
  Object.assign(node("msft-2026-hr-hotspots"), {
    vote_history: [
      { year: 2023, support_pct: 33.58, results_url: "https://www.sec.gov/test-2023" },
      { year: 2024, support_pct: 32.03, results_url: "https://www.sec.gov/test-2024" },
      { year: 2025, support_pct: 27.48, results_url: "https://www.sec.gov/test-2025" },
    ],
  });
  return G;
}

async function open(page, { fixtureData = true, query = "?lens=impact" } = {}) {
  await page.clock.setFixedTime(TODAY);
  if (fixtureData) {
    const G = fixture();
    await page.route("**/data/graph.json", (route) => route.fulfill({ json: G }));
  }
  await page.goto(`/index.html${query}#network`);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("#net-lens input:checked");
}
const panel = (page) => page.locator("#net-panel");

test("deadline: days left in Eastern time, with the proxy source", async ({ page }) => {
  await open(page);
  await page.evaluate(() => window.focusNetworkNode("msft-2026-climate-ai-dc"));
  await expect(panel(page)).toContainText("Proposal deadline: 51 days left");
  await expect(panel(page).locator(".net-actions")).toContainText("Co-file before January 15, 2027 (51 days left");
  await expect(panel(page).locator('.net-actions a[href="https://www.sec.gov/test-deadline"]')).toHaveCount(1);
});

test("seeking: each ask is a line; exempt-solicitation asks are not shown", async ({ page }) => {
  await open(page);
  await page.evaluate(() => window.focusNetworkNode("msft-2026-hrdd-ai-misuse"));
  const acts = panel(page).locator(".net-actions");
  await expect(acts).toContainText(
    "Needs a co-filer: holding $2,000+ for 3 years · posted by Test Org A, November 1, 2026 · auto-detected, not yet reviewed",
  );
  await expect(acts).not.toContainText("Test Org B");
});

test("resubmission: at-risk proposal states the threshold; no flag without vote_history", async ({ page }) => {
  await open(page);
  await page.evaluate(() => window.focusNetworkNode("msft-2026-hr-hotspots"));
  await expect(panel(page)).toContainText("At risk of losing resubmission eligibility");
  await expect(panel(page).locator(".net-actions")).toContainText(
    "Last vote: 27.48% (2025). Needs 25% to stay eligible",
  );
  await page.evaluate(() => window.focusNetworkNode("msft-2023-hr-hotspots"));
  await expect(panel(page).locator("h3")).toContainText("2023");
  await expect(panel(page)).not.toContainText("resubmission");
});

test("holdings: fade, count line, Esc returns focus, kept across reload, nothing sent", async ({ page }) => {
  await open(page, { fixtureData: false });
  const posts = [];
  page.on("request", (r) => {
    if (r.method() !== "GET") posts.push(r.url());
  });
  await page.click("#net-hold-btn");
  await expect(page.locator("#net-hold-btn")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#net-hold-input")).toBeFocused();
  await page.fill("#net-hold-input", "msft, xyz");
  await page.click("#net-hold-apply");
  await expect(page.locator("#net-hold-status")).toContainText("1 in this map (MSFT)");
  await expect(page.locator("#net-hold-status")).toContainText("Not in this map: XYZ");
  await page.focus("#net-hold-input");
  await page.keyboard.press("Escape");
  await expect(page.locator("#net-hold-btn")).toBeFocused();
  await expect(page.locator("#net-hold")).toBeHidden();
  await page.reload();
  await page.waitForSelector("#net-lens input:checked");
  await expect(page.locator("#net-hold-status")).toContainText("1 in this map (MSFT)");
  expect(posts).toEqual([]);
});

test("topics not filed: toggle, scoped wording, rows in the List view", async ({ page }) => {
  await open(page, { fixtureData: false });
  const btn = page.locator("#net-gaps");
  await btn.click();
  await expect(btn).toHaveAttribute("aria-pressed", "true");
  const status = await page.textContent("#net-lens-status");
  const n = Number(status.match(/shown: (\d+)/)[1]);
  expect(n).toBeGreaterThan(0);
  await page.click('#tab-network .seg [data-view="list"]');
  await expect(page.locator("#net-list tbody tr", { hasText: "none in this dataset" })).toHaveCount(n);
  await expect(page.locator("#net-list tbody tr", { hasText: "none in this dataset" }).first()).toContainText(
    "with AI proposals tracked",
  );
  await page.check('#net-lens input[value="policy"]');
  await expect(btn).toBeHidden();
});

test("warm path: a found path lists labelled hops; an unreachable target says so", async ({ page }) => {
  await open(page, { fixtureData: false });
  await page.evaluate(() => window.focusNetworkNode("trillium"));
  await page.selectOption("#net-path-to", "co-GOOGL");
  await page.click("#net-path-go");
  await expect(page.locator("#net-path-sum")).toContainText("Path found:");
  await expect(page.locator("#net-path-sum")).toBeFocused();
  await expect(page.locator(".path-steps li").first()).toBeVisible();
  await expect(page.locator("#net-kb")).toContainText("Path found:");
  await page.selectOption("#net-path-to", "lab-openai");
  await page.click("#net-path-go");
  await expect(page.locator("#net-path-sum")).toContainText("No path in this map");
});

test("keyboard announcement includes held / not held", async ({ page }, info) => {
  test.skip(info.project.name.startsWith("phone"), "keyboard test runs at desktop width");
  await open(page, { fixtureData: false });
  await page.click("#net-hold-btn");
  await page.fill("#net-hold-input", "MSFT");
  await page.click("#net-hold-apply");
  await page.focus("#net-graph");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#net-kb")).toContainText(/, (held|not held)$/);
});

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
  Object.assign(node("co-NVDA"), {
    next_proposal_deadline: "2027-02-01",
    next_proposal_deadline_source: "https://www.sec.gov/test-nvda",
    next_proposal_deadline_quote: "Test quote: proposals must be received by February 1, 2027.",
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

// Resubmission marks run on the live data's vote_history (data/graph.json), with the clock fixed.
test("resubmission: on the ballot, below, just above, chained, and no flag where refiled", async ({ page }) => {
  await open(page, { fixtureData: false });
  const acts = () => panel(page).locator(".net-actions");
  // On the ballot: a fact about the bar after this vote, never "below".
  await page.evaluate(() => window.focusNetworkNode("msft-2026-hr-hotspots"));
  await expect(panel(page).locator(".ring-risk")).toContainText(
    "Resubmission threshold after this vote: 25% (last vote on the subject 27.48%)",
  );
  await expect(acts()).toContainText(
    "Resubmission threshold after this vote: 25% (vote 4 on this subject in the 5 years before the 2027 meeting",
  );
  await expect(acts()).toContainText("Last vote on the subject: 27.48% (2025)");
  await expect(acts()).toContainText("not confirmed from the proxy");
  // Chain split across nodes: 2023 is on the 2024 proposal's history, so this is vote 3 and the bar is 25%.
  await page.evaluate(() => window.focusNetworkNode("googl-2025-ai-targeted-ads-hr"));
  await expect(panel(page)).toContainText("Below this site's reading of the resubmission threshold");
  await expect(acts()).toContainText(
    "Last vote: 14.29% (2025), under the 25% resubmission threshold (vote 3 on this subject",
  );
  // Cleared the bar by less than 3 points: stated as a margin, not as "needs".
  await page.evaluate(() => window.focusNetworkNode("amzn-2024-customer-dd"));
  await expect(acts()).toContainText("Last vote: 16.79% (2024), 1.79 points above the 15% resubmission threshold");
  await expect(panel(page).locator(".ring-risk")).toContainText("Close to the 15% resubmission threshold");
  // A refile can only reach a meeting whose proposal deadline is still ahead (Microsoft's 2027 meeting).
  await page.evaluate(() => window.focusNetworkNode("msft-2025-ai-oil-gas"));
  await expect(acts()).toContainText(
    "under the 15% resubmission threshold (vote 2 on this subject in the 5 years before the 2027 meeting",
  );
  // Refiled since (its vote is in a later proposal's history): no flag.
  await page.evaluate(() => window.focusNetworkNode("msft-2024-hr-hotspots"));
  await expect(panel(page).locator("h3")).toContainText("2024");
  await expect(panel(page)).not.toContainText("resubmission");
});

test("company deadline: next annual meeting wording, proxy text and source", async ({ page }) => {
  await open(page);
  await page.evaluate(() => window.focusNetworkNode("co-NVDA"));
  await expect(panel(page).locator(".net-actions")).toContainText(
    "Proposal deadline for the next annual meeting February 1, 2027 (68 days left, from the proxy statement). Proxy text: “Test quote",
  );
  await expect(panel(page).locator('.net-actions a[href="https://www.sec.gov/test-nvda"]')).toHaveCount(1);
});

test("no pulse under reduced motion", async ({ page }) => {
  // Checks the stylesheet rule directly with a pulse-classed circle, so the test doesn't depend on the graph
  // (and d3 from the CDN) having drawn; it timed out under load late in full runs.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page);
  const anim = await page.evaluate(() => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("class", "g-pulse");
    svg.appendChild(c);
    document.body.appendChild(svg);
    const name = getComputedStyle(c).animationName;
    svg.remove();
    return name;
  });
  expect(anim).toBe("none");
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
  await expect(page.locator("#net-path-sum")).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#net-path-go")).toBeFocused();
  await expect(page.locator("#net-path-sum")).toHaveCount(0);
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

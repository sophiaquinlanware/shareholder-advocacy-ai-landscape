// AI advocacy network lenses (lenses.js): the "View as" choice, its URL, the actions block and keyboard use.
import { expect, test } from "@playwright/test";

async function openNetwork(page, query = "") {
  await page.goto(`/index.html${query}#network`);
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("#net-lens input:checked");
}

test("choosing a lens updates ?lens=, keeps #network, and survives a reload", async ({ page }) => {
  await openNetwork(page);
  await page.check('#net-lens input[value="policy"]');
  await expect(page).toHaveURL(/\?lens=policy#network$/);
  await expect(page.locator("#net-lens-status")).toContainText("Policymaker view");
  await expect(page.locator("#net-intro")).toContainText("Node size = number of proposals with this ask");
  await page.reload();
  await page.waitForSelector("#net-lens input:checked");
  expect(await page.$eval("#net-lens input:checked", (i) => i.value)).toBe("policy");
});

test("?lens= in a shared link opens that lens", async ({ page }) => {
  await page.goto("/index.html?lens=individual&view=graph#network");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("#net-lens input:checked");
  expect(await page.$eval("#net-lens input:checked", (i) => i.value)).toBe("individual");
  await expect(page.locator("#net-intro")).toContainText("Bigger circles are companies with more AI proposals");
});

test("the What you can do block shows only when the lens has an action", async ({ page }) => {
  await openNetwork(page, "?lens=impact");
  // Microsoft has an upcoming meeting with AI items, so it has actions.
  await page.evaluate(() => window.focusNetworkNode("co-MSFT"));
  await expect(page.locator("#net-panel .net-actions")).toContainText("Next AI vote:");
  // A lab has no actions in the Impact investor lens: no empty block.
  await page.evaluate(() => window.focusNetworkNode("lab-openai"));
  await expect(page.locator("#net-panel h3")).toHaveText("OpenAI");
  await expect(page.locator("#net-panel .net-actions")).toHaveCount(0);
});

test("connections show a confidence marker", async ({ page }) => {
  await openNetwork(page, "?lens=impact");
  await page.evaluate(() => window.focusNetworkNode("co-MSFT"));
  await expect(page.locator("#net-panel .conf").first()).toBeVisible();
  await expect(page.locator("#net-panel .unverified")).toHaveCount(0);
});

test("keyboard: Down announces a node, Enter opens it, Escape clears", async ({ page }, info) => {
  test.skip(info.project.name.startsWith("phone"), "keyboard test runs at desktop width");
  await openNetwork(page, "?lens=impact");
  await page.focus("#net-graph");
  await page.keyboard.press("ArrowDown");
  await expect(page.locator("#net-kb")).toContainText(/^1 of \d+: /);
  const name = (await page.textContent("#net-kb")).split(": ")[1].split(",")[0];
  await page.keyboard.press("Enter");
  await expect(page.locator("#net-panel h3")).toHaveText(name);
  await page.keyboard.press("Escape");
  await expect(page.locator("#net-kb")).toHaveText("Selection cleared");
});

test("List view lists every visible node with status and actions", async ({ page }) => {
  await openNetwork(page, "?lens=impact");
  await page.click('#tab-network .seg [data-view="list"]');
  await expect(page.locator("#net-list th")).toHaveText(["Name", "Type", /Connections/, "Status", "What you can do"]);
  await expect(page.locator("#net-list tbody tr", { hasText: "Upcoming vote" }).first()).toBeVisible();
});

test("opening a tab puts its name in the address (#hash)", async ({ page }) => {
  await page.goto("/index.html");
  await page.waitForLoadState("networkidle");
  await page.click('.tabs [role="tab"][data-group="companies"]');
  await page.click('[role="tab"][data-tab="rights"]');
  await expect(page).toHaveURL(/#rights$/);
});

test("labels are off until a node is selected, then name it and its connections", async ({ page }) => {
  await openNetwork(page, "?lens=impact");
  await page.waitForTimeout(800);
  const shown = () =>
    page.$$eval("#net-graph text", (ts) =>
      ts
        .filter((t) => t.getAttribute("display") !== "none" && t.getAttribute("opacity") === "1")
        .map((t) => t.textContent),
    );
  expect(await shown()).toEqual([]);
  await page.evaluate(() => window.focusNetworkNode("co-MSFT"));
  const after = await shown();
  expect(after).toContain("Microsoft");
  expect(after.length).toBeGreaterThan(5);
});

test("graph labels never overlap, including after selecting a busy node", async ({ page }) => {
  await page.goto("/index.html?lens=impact#network");
  await page.waitForLoadState("networkidle");
  await page.waitForSelector("#net-graph svg text", { state: "attached", timeout: 60000 });
  const overlaps = () =>
    page.$$eval("#net-graph text", (ts) => {
      const shown = ts
        .filter(
          (t) => t.getAttribute("display") !== "none" && Number(t.getAttribute("opacity")) > 0 && t.textContent.trim(),
        )
        .map((t) => t.getBoundingClientRect());
      let n = 0;
      for (let i = 0; i < shown.length; i++)
        for (let j = i + 1; j < shown.length; j++) {
          const a = shown[i];
          const b = shown[j];
          if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) n++;
        }
      return n;
    });
  for (const id of ["co-MSFT", "afl-cio", "trillium"]) {
    await page.evaluate((x) => window.focusNetworkNode(x), id);
    // Labels may cross for a moment while the layout moves; once it settles, none overlap.
    await expect.poll(overlaps, { message: `overlapping labels after selecting ${id}`, timeout: 6000 }).toBe(0);
  }
});

test("key: clicking a type cycles shown, highlighted, crossed off; 'Show all' resets", async ({ page }) => {
  await page.goto("/index.html?lens=impact#network");
  await page.waitForLoadState("networkidle");
  const chip = page.locator('#net-legend .leg[data-kind="proposal"]');
  await expect(chip).toHaveAttribute("data-state", "on");
  await chip.click();
  await expect(chip).toHaveAttribute("data-state", "lit");
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#net-lens-status")).toContainText("Proposal highlighted.");
  // Non-proposal nodes dim while proposals are highlighted.
  const dim = await page.$$eval("#net-graph circle", (cs) =>
    cs
      .filter((c) => c.__data__ && c.__data__.kind !== "proposal" && c.getAttribute("display") !== "none")
      .every((c) => Number(c.getAttribute("opacity")) <= 0.15),
  );
  expect(dim).toBe(true);
  await chip.click();
  await expect(chip).toHaveAttribute("data-state", "off");
  await expect(page.locator("#net-lens-status")).toContainText("Proposal hidden.");
  await chip.click();
  await expect(chip).toHaveAttribute("data-state", "on");
  await chip.click();
  await page.click("#net-legend [data-all]");
  await expect(page.locator('#net-legend .leg:not([data-state="on"])')).toHaveCount(0);
});

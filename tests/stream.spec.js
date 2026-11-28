// A proposal's stream in the Proposals graph, and the value chain's light-up order and width scale.
import { expect, test } from "@playwright/test";

test("a proposal lights its whole stream: filers, the coalition that engaged the company, the network above it", async ({
  page,
}) => {
  await page.goto("/index.html#proposals");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => window.focusNetworkNode("googl-2026-ai-board-oversight"));
  const s = await page.evaluate(() => window.netStreamOf("googl-2026-ai-board-oversight"));
  expect(s).toContain("Parnassus Investments");
  expect(s).toContain("Valuing Water Finance Initiative");
  expect(s).toContain("Ceres");
  expect(s).toContain("Alphabet");
  // A filer's coalition that never engaged Alphabet stays out.
  const t = await page.evaluate(() => window.netStreamOf("msft-2023-ai-misinfo"));
  expect(t).not.toContain("Valuing Water Finance Initiative");
});

test("value chain: line width follows dollars a year on one scale, and a trace lights stage by stage", async ({
  page,
}) => {
  await page.goto("/index.html#value-chain");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#vc-key .vc-wkey")).toContainText("Dollars a year");
  const widths = await page.evaluate(() =>
    [...document.querySelectorAll("#vc-flow path.vc-tie")].map((p) => +p.getAttribute("stroke-width")),
  );
  expect(new Set(widths.map((w) => w.toFixed(1))).size).toBeGreaterThan(8);
  await page.locator("#vc-flow").scrollIntoViewIfNeeded();
  await page.waitForTimeout(4500);
  await page.locator('#vc-flow g[role=button][aria-label^="Microsoft:"]').click();
  const lit = () =>
    page.evaluate(
      () =>
        [...document.querySelectorAll("#vc-flow path.vc-tie")].filter((p) =>
          /232, 89, 12|e8590c/i.test(p.getAttribute("stroke")),
        ).length,
    );
  await page.waitForTimeout(150);
  const early = await lit();
  await page.waitForTimeout(3000);
  expect(await lit()).toBeGreaterThan(early);
});

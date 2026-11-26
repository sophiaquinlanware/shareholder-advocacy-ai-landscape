// Proves the layout checks can fail: each one runs on a small page with a known problem.
// If these pass while the site tests pass, the site really is clean, not unchecked.
import { expect, test } from "@playwright/test";
import { findOverlappingText, sidewaysOverflow } from "./layout.js";

test("the overlap check catches two labels on top of each other", async ({ page }) => {
  await page.setContent(`
    <p style="position:absolute;top:10px;left:10px">First label</p>
    <p style="position:absolute;top:14px;left:20px">Second label</p>
    <p style="position:absolute;top:200px">Clear of the others</p>`);
  const found = await page.evaluate(findOverlappingText);
  expect(found).toEqual(['"First label" and "Second label"']);
});

test("the overlap check ignores ordinary wrapped text", async ({ page }) => {
  await page.setContent(`<p style="width:120px">${"A sentence that wraps onto several lines. ".repeat(4)}</p>`);
  expect(await page.evaluate(findOverlappingText)).toEqual([]);
});

test("the sideways-scroll check catches a too-wide element", async ({ page }) => {
  await page.setContent(`<div style="width:5000px;height:10px"></div>`);
  expect(await page.evaluate(sidewaysOverflow)).toBeGreaterThan(1);
});

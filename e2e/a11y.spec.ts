import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = [
  "#/",
  "#/vote",
  "#/vote/colorado",
  "#/vote/colorado/measures",
  "#/vote/colorado/measure/amendment-81",
  "#/vote/colorado/contests",
  "#/vote/colorado/judges",
  "#/vote/my-guide",
  "#/congress",
  "#/corrections",
  "#/congress/how-it-works",
  "#/policy",
  "#/values",
  "#/debate",
  "#/atlas",
  "#/methodology",
  "#/privacy",
];

// Automated checks catch only part of WCAG 2.2 AA; passing is necessary, not sufficient.
for (const route of routes) {
  test(`axe: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.waitForTimeout(400);
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0].target.join(" ")}`)).toEqual([]);
  });
}

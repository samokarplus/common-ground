import { test } from "@playwright/test";
const pages: [string, string][] = JSON.parse(process.env.SHOTS ?? "[]");
for (const [name, h] of pages)
  test(`shot ${name}`, async ({ page }) => {
    await page.goto(h);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `/private/tmp/shots/${name}-${test.info().project.name}.png`, fullPage: true });
  });

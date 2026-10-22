import { expect, test } from "@playwright/test";

const routes = [
  "#/",
  "#/vote",
  "#/vote/colorado",
  "#/vote/colorado/measures",
  "#/vote/colorado/measure/amendment-81",
  "#/vote/colorado/contests",
  "#/vote/colorado/contest/governor",
  "#/vote/my-guide",
  "#/vote/how-to-read",
  "#/vote/demo",
  "#/congress",
  "#/congress/how-it-works",
];

for (const route of routes) {
  test(`renders ${route} without errors or overflow`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error" && !/federalregister\.gov/.test(m.text())) errors.push(m.text());
    });
    await page.goto(route);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.waitForTimeout(300);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test("homepage links to Help Me Vote", async ({ page }) => {
  await page.goto("#/");
  await page.locator('main a[href="#/vote"]').first().click();
  await expect(page).toHaveURL(/#\/vote/);
});

test("external links are safe", async ({ page }) => {
  await page.goto("#/vote/colorado");
  const bad = await page.$$eval('a[target="_blank"]', (as) =>
    as.filter((a) => !/noopener|noreferrer/.test(a.getAttribute("rel") ?? "")).map((a) => a.getAttribute("href")),
  );
  expect(bad).toEqual([]);
});

test("congress list filters and opens a bill", async ({ page }) => {
  await page.goto("#/congress");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("federal legislation");
  await page.getByRole("button", { name: "Became law" }).click();
  const card = page.locator("a.measure-card").first();
  await expect(card).toBeVisible();
  await card.click();
  await expect(page.getByText("Public Law").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Legislative timeline" })).toBeVisible();
});

test("congress explainer renders", async ({ page }) => {
  await page.goto("#/congress/how-it-works");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("becomes law");
});

test("atlas list search opens a concept with competing views", async ({ page }) => {
  await page.goto("#/atlas");
  await page.getByRole("button", { name: "Accessible list" }).click();
  await page.getByLabel("Search ideas").fill("federalism");
  await page.locator(".atlas-list button", { hasText: "Federalism" }).click();
  await expect(page.getByRole("heading", { name: "Where people disagree" })).toBeVisible();
  await expect(page.locator(".atlas-detail a[href*=plato]")).toBeVisible();
});

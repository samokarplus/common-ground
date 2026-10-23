import { expect, test } from "@playwright/test";

// The critical voter workflow: research a measure, keep private notes, export them, delete them.
test("private research guide: mark, note, export, persist opt-in, delete", async ({ page }) => {
  await page.goto("#/vote/colorado/measure/amendment-81");
  await page.getByLabel("I've read this").first().check();
  await page.getByRole("button", { name: "Add a private note" }).first().click();
  await page.getByLabel(/Private note/).first().fill("Ask about the 72-hour requirement");

  // Navigate in-app (hash change) so the in-memory guide survives, even if the site redirects between origins.
  await page.evaluate(() => (window.location.hash = "#/vote/my-guide"));
  await expect(page.getByText("Ask about the 72-hour requirement")).toBeVisible();

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: /Download my notes/ }).click()]);
  const text = await (await import("node:fs/promises")).readFile(await download.path(), "utf8");
  const exported = JSON.parse(text);
  expect(JSON.stringify(exported)).toContain("72-hour");
  // The export carries guide entries only: no address, location or contact data.
  expect(JSON.stringify(exported).toLowerCase()).not.toMatch(/address|latitude|longitude|zip/);

  // Nothing is written to browser storage unless the user opts in.
  expect(await page.evaluate(() => localStorage.getItem("cg-vote-guide"))).toBeNull();
  await page.getByLabel(/Save my guide on this device/).check();
  expect(await page.evaluate(() => localStorage.getItem("cg-vote-guide"))).toContain("72-hour");

  await page.getByRole("button", { name: /Delete my guide/ }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(page.getByText("Ask about the 72-hour requirement")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("cg-vote-guide"))).toBeNull();
});

test("a deadline check on the Colorado overview names the official source", async ({ page }) => {
  await page.goto("#/vote/colorado");
  await expect(page.getByText(/Election Day/).first()).toBeVisible();
  await expect(page.locator('a[href*="coloradosos.gov"]').first()).toBeVisible();
});

for (const persist of [false, true]) {
  test(`Privacy deletion clears ${persist ? "saved" : "session"} ballot notes without resurrection`, async ({ page }) => {
    await page.goto("#/vote/colorado/measure/amendment-81");
    await page.getByRole("button", { name: "Add a private note" }).first().click();
    await page.getByLabel(/Private note/).first().fill("Private deletion regression");
    await page.evaluate(() => (location.hash = "#/vote/my-guide"));
    if (persist) await page.getByLabel(/Save my guide on this device/).check();
    await page.evaluate(() => (location.hash = "#/privacy"));
    await page.getByRole("button", { name: "Delete all device data" }).click();
    await page.evaluate(() => (location.hash = "#/vote/my-guide"));
    await expect(page.getByText("Private deletion regression")).toHaveCount(0);
    await expect(page.getByLabel(/Save my guide on this device/)).not.toBeChecked();
    await page.evaluate(() => (location.hash = "#/vote/colorado/measure/amendment-81"));
    await page.getByLabel("I've read this").first().check();
    expect(await page.evaluate(() => localStorage.getItem("cg-vote-guide"))).toBeNull();
    await page.reload();
    await expect(page.getByLabel("I've read this").first()).not.toBeChecked();
  });
}

import { expect, test } from "@playwright/test";

// Privacy audit: private notes and reflections must never leave the browser, only first-party
// and Federal Register requests may happen, and nothing may set cookies or write storage uninvited.
const NOTE_TEXT = "PRIVATE-NOTE-7731";

test("the voter journey sends nothing private anywhere and sets no cookies", async ({ page, context }) => {
  const requests: { url: string; method: string; body: string | null }[] = [];
  page.on("request", (r) => requests.push({ url: r.url(), method: r.method(), body: r.postData() }));

  await page.goto("#/vote");
  const siteOrigin = new URL(page.url()).origin;
  await page.getByLabel("Choose your state").selectOption("CO");
  await page.goto("#/vote/colorado/contest/governor").catch(() => undefined);
  await page.evaluate(() => (window.location.hash = "#/vote/colorado/measure/amendment-87"));
  await page.getByLabel("I've read this").first().check();
  await page.getByRole("button", { name: "Add a private note" }).first().click();
  await page.getByLabel(/Private note/).first().fill(NOTE_TEXT);
  await page.evaluate(() => (window.location.hash = "#/values"));
  await page.getByRole("button", { name: "Real tradeoffs on the ballot" }).click();
  await page.evaluate(() => (window.location.hash = "#/vote/my-guide"));
  await expect(page.getByText(NOTE_TEXT)).toBeVisible();
  await page.getByLabel(/Save my guide on this device/).check();
  await page.evaluate(() => (window.location.hash = "#/congress"));
  await page.evaluate(() => (window.location.hash = "#/debate/maps/mail-ballot-id"));
  await page.evaluate(() => (window.location.hash = "#/legislation"));
  await page.waitForTimeout(500);

  const allowed = new Set([siteOrigin, "https://www.federalregister.gov"]);
  for (const r of requests) {
    const u = new URL(r.url);
    if (u.protocol === "data:" || u.protocol === "blob:") continue;
    expect(allowed.has(u.origin), `unexpected request to ${r.url}`).toBe(true);
    expect(r.url).not.toContain(NOTE_TEXT);
    expect(r.body ?? "").not.toContain(NOTE_TEXT);
    expect(r.method === "GET" || r.method === "HEAD", `non-GET request ${r.method} ${r.url}`).toBe(true);
  }
  expect(await context.cookies()).toEqual([]);
  // Federal Register requests carry only public query parameters.
  for (const r of requests.filter((x) => x.url.includes("federalregister.gov"))) expect(r.url).not.toMatch(/note|guide|vote|secret/i);
  // The hash (never sent to servers) is the only place routes live; the note is not in the URL.
  expect(page.url()).not.toContain(NOTE_TEXT);
});

test("nothing is stored until the user opts in", async ({ page }) => {
  await page.goto("#/vote/colorado/measure/amendment-81");
  await page.getByLabel("I've read this").first().check();
  await page.getByRole("button", { name: "Add a private note" }).first().click();
  await page.getByLabel(/Private note/).first().fill(NOTE_TEXT);
  const dump = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  expect(dump).not.toContain(NOTE_TEXT);
  expect(await page.evaluate(() => localStorage.getItem("cg-vote-guide"))).toBeNull();
});

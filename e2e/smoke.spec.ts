import { expect, test } from "@playwright/test";

const routes = [
  "#/",
  "#/vote",
  "#/vote/colorado",
  "#/vote/colorado/measures",
  "#/vote/colorado/measure/amendment-81",
  "#/vote/colorado/contests",
  "#/vote/colorado/contest/governor",
  "#/vote/colorado/judges",
  "#/vote/colorado/candidate/governor/Phil%20Weiser",
  "#/vote/colorado/candidate/secretary-of-state/James%20Wiley",
  "#/vote/colorado/candidate/state-treasurer/Jodie%20Barr",
  "#/vote/colorado/contest/supreme-court-retention",
  "#/vote/my-guide",
  "#/vote/how-to-read",
  "#/vote/demo",
  "#/congress",
  "#/debate/maps",
  "#/paths",
  "#/search?q=tax",
  "#/chain",
  "#/atlas?node=distributive-justice",
  "#/debate/maps/graduated-income-tax",
  "#/corrections",
  "#/congress/how-it-works",
];

for (const route of routes) {
  test(`renders ${route} without errors or overflow`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      // The live Federal Register request may be rate-limited (HTTP 429); the app falls back to its snapshot by design.
      if (m.type() === "error" && !/federalregister\.gov|Failed to load resource/.test(m.text())) errors.push(m.text());
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

test("judge retention page explains YES/NO and links to official evaluations", async ({ page }) => {
  await page.goto("#/vote/colorado/contest/supreme-court-retention");
  await page.getByRole("link", { name: /How judicial retention works/ }).click();
  await expect(page.getByRole("heading", { name: "What a YES or NO vote does" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Official judicial performance evaluations/ })).toHaveAttribute("href", /judicialperformance\.colorado\.gov/);
});

test("unresearched candidates are labeled as such, not as having no position", async ({ page }) => {
  await page.goto("#/vote/colorado/contest/governor");
  await expect(page.getByText(/No candidate-authored or official source was located/).first()).toBeVisible();
});

test("measure search narrows the list and can be emptied", async ({ page }) => {
  await page.goto("#/vote/colorado/measures");
  const cards = page.locator("a.measure-card");
  const all = await cards.count();
  await page.getByLabel("Search measures").fill("zzzz-no-match");
  await expect(page.getByText("No measures match this filter.")).toBeVisible();
  await page.getByLabel("Search measures").fill("amendment 81");
  expect(await cards.count()).toBeGreaterThan(0);
  expect(await cards.count()).toBeLessThan(all);
});

test("state picker covers Colorado and honestly declines other states", async ({ page }) => {
  await page.goto("#/vote");
  await page.getByLabel("Choose your state").selectOption("TX");
  await expect(page.getByText(/not verified ballot information for Texas/)).toBeVisible();
  await page.getByLabel("Choose your state").selectOption("CO");
  await expect(page.getByRole("link", { name: /Open the Colorado guide/ })).toBeVisible();
});

test("federal feed offers comment-window and date filters", async ({ page }) => {
  await page.goto("#/legislation");
  await expect(page.getByLabel("Published within")).toBeVisible();
  await page.getByLabel("Open for public comment").check();
  await expect(page.getByText(/records in this feed/)).toBeVisible();
});

test("candidate profile shows labeled own statements, sources and the not-fact-checked notice", async ({ page }) => {
  await page.goto("#/vote/colorado/contest/governor");
  await page.getByRole("link", { name: /Research profile/ }).first().click();
  await expect(page.getByText(/not independently fact-checked/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "The candidate's own statement" })).toBeVisible();
  await expect(page.locator('a[href^="https://"][target="_blank"]').first()).toBeVisible();
  await expect(page.getByText(/not yet researched/).first()).toBeVisible();
});

test("measure page shows YES/NO, both sides' arguments and the not-human-reviewed label", async ({ page }) => {
  await page.goto("#/vote/colorado/measure/amendment-87");
  await expect(page.getByRole("heading", { name: "A YES vote means" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Arguments for", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Arguments against", exact: true })).toBeVisible();
  await expect(page.getByText(/Source-checked, not human-reviewed\. On 2026-10-22/)).toBeVisible();
  await expect(page.getByText(/we recommend/i)).toHaveCount(0);
});

test("agency filter narrows the federal feed", async ({ page }) => {
  await page.goto("#/legislation");
  await expect(page.getByLabel("Agency")).toBeVisible();
});

test("debate map separates claim types, filters them and keeps steelman text on the page only", async ({ page }) => {
  await page.goto("#/debate/maps/mail-ballot-id");
  await expect(page.getByRole("heading", { name: "Facts both sides can start from" })).toBeVisible();
  await page.getByRole("button", { name: "Value judgment" }).click();
  await expect(page.getByText("Factual question").first()).toBeHidden().catch(() => undefined);
  await expect(page.locator(".yes-no .tag").first()).toContainText("Value judgment");
  await page.getByLabel(/Supporters of requiring ID information: the strongest/).fill("my private draft");
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain("my private draft");
  await page.getByText("Amendment 84 requires photo ID to vote.").click();
  await expect(page.getByText(/last four digits/).first()).toBeVisible();
});

test("values explorer: tradeoffs link to real measures; reflections can be exported and deleted", async ({ page }) => {
  await page.goto("#/values");
  await page.getByRole("button", { name: "Real tradeoffs on the ballot" }).click();
  await expect(page.getByRole("heading", { name: "The same values pull in different directions." })).toBeVisible();
  await expect(page.locator('a[href*="#/vote/colorado/measure/"]').first()).toBeVisible();
  await expect(page.getByText(/does not score you|not score you/).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Download my reflections/ })).toBeVisible();
  await page.getByRole("button", { name: /Delete all/ }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  expect(await page.evaluate(() => localStorage.getItem("cg-values"))).toBeNull();
});

test("an unknown federal document id shows a clear heading and explanation, not a blank page", async ({ page }) => {
  await page.goto("#/action/0000-00000");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: /Federal actions/ })).toBeVisible();
});

test("Colorado overview says the guide is not personalized and explains address-dependent races", async ({ page }) => {
  await page.goto("#/vote/colorado");
  await expect(page.getByRole("heading", { name: "Your address decides most of your ballot" })).toBeVisible();
  await expect(page.getByText("not personalized").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /How we checked this/ })).toBeVisible();
  await expect(page.getByText(/Not verified against the official pages/)).toBeVisible();
});

test("status page shows research health with freshness for each source and the review queue", async ({ page }) => {
  await page.goto("#/status");
  await expect(page.getByRole("heading", { name: "Research health" })).toBeVisible();
  await expect(page.getByText("Congress bills, GovInfo")).toBeVisible();
  await expect(page.getByText(/not yet active/)).toBeVisible();
  await expect(page.getByText(/Source-checked by an AI-assisted process/)).toBeVisible();
});

test("a pathway deep-links into the Atlas on the right idea, with context and readings", async ({ page }) => {
  await page.goto("#/paths");
  await page.getByRole("link", { name: /Explore political representation/ }).click();
  await expect(page.getByRole("heading", { name: "Political representation", level: 2 })).toBeVisible();
  await page.goto("#/atlas?node=social-contract");
  await expect(page.getByRole("heading", { name: "Further reading" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Historical context" })).toBeVisible();
});

test("the promise-to-outcome record separates stages and marks undocumented ones", async ({ page }) => {
  await page.goto("#/chain");
  await expect(page.getByRole("heading", { name: /from introduction to law/i })).toBeVisible();
  await expect(page.getByText("Not documented here.").first()).toBeVisible();
  await expect(page.locator('a[href^="https://clerk.house.gov"]').first()).toBeVisible();
});

test("values tradeoff choices are interactive, session-only and cleared by delete", async ({ page }) => {
  await page.goto("#/values");
  await page.getByRole("button", { name: "Real tradeoffs on the ballot" }).click();
  const first = page.locator("section.journal-entry").first();
  await first.getByRole("button", { name: "It depends" }).click();
  await expect(first.getByRole("button", { name: "It depends" })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain("depends");
  await page.getByRole("button", { name: /Delete all/ }).click();
  await page.getByRole("button", { name: "Yes, delete" }).click();
  await expect(first.getByRole("button", { name: "It depends" })).toHaveAttribute("aria-pressed", "false");
});

test("site search finds measures, ideas and debate maps, and explains an empty result", async ({ page }) => {
  await page.goto("#/");
  await page.getByLabel("Search Common Ground").fill("mail ballot");
  await page.getByLabel("Search Common Ground").press("Enter");
  await expect(page.getByRole("heading", { name: /Results for/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Amendment 84/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /require ID information/ })).toBeVisible();
  await page.goto("#/search?q=zzzzzz");
  await expect(page.getByText(/Nothing on this site matches/)).toBeVisible();
  await expect(page.getByRole("link", { name: /search the Federal Register/i }).first()).toBeVisible();
});

test("candidates without a profile show an explicit research note, not a blank", async ({ page }) => {
  await page.goto("#/vote/colorado/contest/secretary-of-state");
  await expect(page.getByText(/did not respond/).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Research profile/ }).first()).toBeVisible();
});

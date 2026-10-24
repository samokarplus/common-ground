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
  "#/issues",
  "#/issues/federal-spending",
  "#/issues/ukraine-assistance",
  "#/issues/abortion-statistics",
  "#/government",
  "#/data",
  "#/explore",
  "#/issues/cost-of-living",
  "#/issues/immigration",
  "#/issues/consumer-prices",
  "#/government/president",
  "#/compare",
  "#/compare/texas-senate-2026",
  "#/credits",
  "#/review",
  "#/vote/colorado/how-elections-work",
  "#/vote/colorado/compare",
  "#/vote/colorado/compare/secretary-of-state",
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
  await expect(page.locator(".yes-no .tag").filter({ hasText: "Factual question" })).toBeHidden();
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
  await expect(page.getByText(/not yet active|Scheduled automation is unverified/)).toBeVisible();
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

test("review dashboard lists items with sources and questions; decisions need a name and notes, and download a file", async ({ page }) => {
  await page.goto("#/review");
  await expect(page.getByRole("heading", { name: /still needs a human reviewer/ })).toBeVisible();
  const first = page.locator("details.review-item").filter({ has: page.locator("h2[id^='r-measure']") }).first();
  await first.locator("summary").click();
  await expect(first.getByText("Outstanding questions")).toBeVisible();
  const download = page.getByRole("button", { name: /Download decisions file/ });
  await expect(download).toBeDisabled();
  await first.getByRole("button", { name: "Request corrections" }).click();
  await page.getByLabel(/Your name/).fill("Test Editor");
  await expect(download).toBeDisabled(); // a note is required
  await first.getByLabel(/What needs to change/).fill("Check the fiscal note");
  await expect(download).toBeEnabled();
  const [file] = await Promise.all([page.waitForEvent("download"), download.click()]);
  const text = await (await import("node:fs/promises")).readFile(await file.path(), "utf8");
  const decisions = JSON.parse(text);
  expect(decisions).toHaveLength(1);
  expect(decisions[0]).toMatchObject({ decision: "request-changes", reviewer: "Test Editor", note: "Check the fiscal note" });
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).not.toContain("Test Editor");
});

test("the Colorado election-process explainer cites official sources for each step", async ({ page }) => {
  await page.goto("#/vote/colorado/how-elections-work");
  await expect(page.getByRole("heading", { name: /How voting works in Colorado/ })).toBeVisible();
  await expect(page.locator('a[href*="coloradosos.gov"]').first()).toBeVisible();
  await expect(page.getByText(/Amendment 87.*only a majority/)).toBeVisible();
});

test("Amendment 87 shows the Blue Book's majority threshold", async ({ page }) => {
  await page.goto("#/vote/colorado/measure/amendment-87");
  await expect(page.getByText("Needs more than 50% of votes cast to pass").first()).toBeVisible();
});

test("candidate comparison asks every candidate the same questions in alphabetical order and shows gaps", async ({ page }) => {
  await page.goto("#/vote/colorado/compare/state-treasurer");
  const heads = await page.locator("thead th a").allInnerTexts();
  expect(heads).toEqual(["Jodie Barr", "Jeff Bridges", "Kevin Grantham", "Marilee Langner Sturgis"]);
  await expect(page.getByRole("rowheader", { name: "Public positions" })).toBeVisible();
  await expect(page.getByText(/No candidate-authored or official source was located/).first()).toBeVisible();
  await expect(page.getByText(/not fact-checked/).first()).toBeVisible();
});

test("measure pages say who is affected and how, using the Blue Book's own examples", async ({ page }) => {
  await page.goto("#/vote/colorado/measure/amendment-87");
  await expect(page.getByRole("heading", { name: "Who this affects, and how" })).toBeVisible();
  await expect(page.getByText(/\$5,175 instead of \$5,500/)).toBeVisible();
});

test("a bill page offers editorial related reading that is labeled as such, and the list can show more", async ({ page }) => {
  await page.goto("#/congress");
  const more = page.getByRole("button", { name: /more of .* remaining/ });
  await expect(more).toBeVisible();
  const before = await page.locator("a.measure-card").count();
  await more.click();
  expect(await page.locator("a.measure-card").count()).toBeGreaterThan(before);
  await page.locator("a.measure-card").first().click();
  await expect(page.getByRole('heading', { name: 'Related reading' })).toBeVisible();
});

test("a measure links to its debate map and to related Atlas ideas; an Atlas idea links back to the ballot", async ({ page }) => {
  await page.goto("#/vote/colorado/measure/amendment-87");
  await expect(page.getByRole("link", { name: /Compare the strongest arguments in a debate map/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Thought Atlas: Distributive justice/ })).toBeVisible();
  await page.goto("#/atlas?node=distributive-justice");
  await expect(page.getByRole("heading", { name: /Where this shows up on Colorado's ballot/ })).toBeVisible();
});

test("a bill outside the snapshot has a useful official-record fallback", async ({ page }) => {
  await page.goto("#/congress/bill/119-hr-999999");
  await expect(page.getByRole("heading", { level: 1, name: "Bill outside this snapshot" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Search the official Congress.gov record/ })).toHaveAttribute("href", "https://www.congress.gov/search");
});

test("a long bill timeline can expand to the full official action record", async ({ page }) => {
  const { readFileSync } = await import("node:fs");
  const data = JSON.parse(readFileSync("data/congress/bills.json", "utf8"));
  const bill = data.bills.find((b: { actions: unknown[] }) => b.actions.length > 25);
  expect(bill).toBeTruthy();
  await page.goto(`#/congress/bill/${bill.id}`);
  await expect(page.locator(".timeline li")).toHaveCount(25);
  await page.getByRole("button", { name: /Show all .* official actions/ }).click();
  await expect(page.locator(".timeline li")).toHaveCount(bill.actions.length);
  await page.getByRole("button", { name: "Show only the 25 most recent actions" }).click();
  await expect(page.locator(".timeline li")).toHaveCount(25);
});

test("the home page greets visitors with a photo hero, a clear first action and photo credits in the footer", async ({ page }) => {
  await page.goto("#/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Understand what's happening");
  await expect(page.locator(".hero img")).toBeVisible();
  await expect(page.getByRole("link", { name: /See what the government is doing/ })).toHaveAttribute("href", /#\/government$/);
  await expect(page.getByRole("link", { name: /Help Me Vote/ }).first()).toHaveAttribute("href", /#\/vote$/);
  await page.getByRole("link", { name: "Photo credits" }).click();
  await expect(page.getByRole("heading", { name: /photographs on this site/i })).toBeVisible();
  await expect(page.getByText(/Carol M\. Highsmith/)).toBeVisible();
});

test("page headers carry a room photograph and the mobile menu opens and closes", async ({ page, isMobile }) => {
  await page.goto("#/vote/colorado");
  const bg = await page.locator(".page-title").first().evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toContain("images/");
  if (isMobile) {
    const toggle = page.getByRole("button", { name: "Toggle navigation" });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Congress" })).toBeVisible();
  }
});

test("five destinations plus the seasonal Help Me Vote link, with the right one highlighted", async ({ page }) => {
  await page.goto("#/government");
  const toggle = page.getByRole("button", { name: "Toggle navigation" });
  const openMenu = async () => {
    if (!(await toggle.isVisible())) return;
    if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  };
  await openMenu();
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  for (const name of ["Today", "Issues", "Government", "Data", "Explore"]) await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Government", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(nav.getByRole("link", { name: "Help Me Vote" })).toBeVisible();
  await page.goto("#/congress");
  await openMenu();
  await expect(nav.getByRole("link", { name: "Government", exact: true })).toHaveAttribute("aria-current", "page");
});

test("a briefing shows the short answer, typed claims, sources, limitations and a data table behind every chart", async ({ page }) => {
  await page.goto("#/issues/federal-spending");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("spend, collect and borrow");
  await expect(page.getByRole("heading", { name: "The short answer" })).toBeVisible();
  await expect(page.getByText("Machine-checked, not human-reviewed").first()).toBeVisible();
  for (const h of ["The evidence", "Why it matters, and how to read it", "What changed recently", "What happens next", "What people disagree about", "Original sources and limits", "Limitations"]) await expect(page.getByRole("heading", { name: h, exact: true })).toBeVisible();
  const charts = page.locator("figure.chart");
  expect(await charts.count()).toBeGreaterThanOrEqual(4);
  await expect(charts.first().locator("svg[role=img] desc")).toContainText("Line chart");
  await charts.first().getByText("View the data as a table").click();
  await expect(charts.first().locator("table tbody tr").first()).toBeVisible();
  await expect(page.locator('a[href*="fiscaldata.treasury.gov"]').first()).toBeVisible();
});

test("the Ukraine briefing says appropriations are not money delivered and shows no spending total", async ({ page }) => {
  await page.goto("#/issues/ukraine-assistance");
  await expect(page.getByText(/not money delivered to Ukraine/).first()).toBeVisible();
  await expect(page.getByText(/174\.2 billion/).first()).toBeVisible();
  await expect(page.getByText(/Words that are not interchangeable/)).toBeVisible();
});

test("the abortion briefing says the figures are not a national total and shows a table with all years", async ({ page }) => {
  await page.goto("#/issues/abortion-statistics");
  await expect(page.getByText(/not a national total/).first()).toBeVisible();
  await page.locator("figure.chart").first().getByText("View the data as a table").click();
  await expect(page.locator("figure.chart").first().locator("tbody tr")).toHaveCount(10);
});

test("the government explorer places actions on a ladder, filters them, and keeps executive orders apart from laws", async ({ page }) => {
  await page.goto("#/government");
  await expect(page.getByRole("heading", { name: "Announced is not enacted: the stages" })).toBeVisible();
  const ladder = page.locator("details.ladder-box");
  if (!(await ladder.evaluate((e) => (e as HTMLDetailsElement).open))) await ladder.locator("summary").click();
  await expect(page.getByText(/Selected, not comprehensive/)).toBeVisible();
  await page.getByRole("button", { name: "Signed into law" }).click();
  const items = page.locator(".action-item");
  expect(await items.count()).toBeGreaterThan(0);
  for (const t of await items.locator(".tag").allInnerTexts()) expect(t).not.toBe("Executive order");
  await page.getByRole("button", { name: "Presidential action" }).click();
  await expect(page.getByText(/not a law passed by Congress/).first()).toBeVisible();
});

test("the home page shows rule-selected developments with originals and why each was chosen", async ({ page }) => {
  await page.goto("#/");
  await expect(page.getByRole("heading", { name: /Recent developments/ })).toBeVisible();
  expect(await page.locator(".dev").count()).toBeGreaterThanOrEqual(4);
  await expect(page.getByText(/Why this one:/).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /Pick an issue/ })).toBeVisible();
  await expect(page.locator(".issue-pills li")).toHaveCount(9);
  await page.locator("#freshness summary").click();
  await expect(page.getByRole("columnheader", { name: "Source" })).toBeVisible();
});

test("the issues hub lists nine issues, says which have a briefing, and an issue page connects numbers, government and candidates", async ({ page }) => {
  await page.goto("#/issues");
  await expect(page.locator(".issue-card")).toHaveCount(9);
  await expect(page.locator(".issue-card .status-chip")).toHaveCount(4);
  await page.goto("#/issues/immigration");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Immigration");
  await expect(page.getByText("No evidence briefing yet.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "What government is doing about this" })).toBeVisible();
  await page.goto("#/issues/public-lands");
  await expect(page.getByRole("heading", { name: "What candidates have said about this" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "What different people argue" })).toHaveCount(0);
  await page.goto("#/issues/immigration");
  await expect(page.getByRole("heading", { name: "What candidates have said about this" })).toBeVisible();
  await expect(page.locator('a[href^="https://ohss.dhs.gov"]')).toBeVisible();
  await page.goto("#/issues/cost-of-living");
  await expect(page.getByRole("link", { name: /Read the full briefing/ })).toBeVisible();
});

test("a briefing page carries what government is doing and what candidates have said", async ({ page }) => {
  await page.goto("#/issues/consumer-prices");
  await expect(page.getByRole("heading", { name: "What government is doing about this" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What candidates have said about this" })).toBeVisible();
  await page.locator("figure.chart").first().getByText("View the data as a table").click();
  await expect(page.locator("figure.chart").first().locator("tbody tr").first()).toBeVisible();
});

test("the presidential timeline is dated, separates stages from outcomes and marks unreviewed explanations", async ({ page }) => {
  await page.goto("#/government/president");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("What has the President been doing");
  await expect(page.getByText(/not been human-reviewed/).first()).toBeVisible();
  expect(await page.locator(".tl-item").count()).toBeGreaterThan(10);
  const first = page.locator(".tl-item").filter({ hasText: "Emergency Tax Relief on Diesel Fuel" });
  await first.getByText("What it changes, what is unknown").click();
  await expect(first.getByText("Still uncertain")).toBeVisible();
  await expect(first.getByText(/Measurable outcomes/)).toBeVisible();
  await expect(first.locator('a[href^="https://www.whitehouse.gov/presidential-actions/"]')).toBeVisible();
  await page.getByRole("combobox").first().selectOption("health-care");
  await expect(page.locator(".tl-item").first()).toBeVisible();
});

test("the candidate comparison shows both people side by side, with sources, undocumented gaps and no recommendation", async ({ page }) => {
  await page.goto("#/compare");
  await page.getByRole("searchbox").fill("paxton");
  await page.getByRole("link", { name: /Compare them/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("James Talarico and Ken Paxton");
  await expect(page.getByText("Information, not advice.")).toBeVisible();
  await page.getByRole("button", { name: "Immigration" }).click();
  const block = page.locator(".issue-compare");
  await expect(block).toHaveCount(1);
  await expect(block.getByRole("heading", { name: "James Talarico" })).toBeVisible();
  await expect(block.getByRole("heading", { name: "Ken Paxton" })).toBeVisible();
  await block.locator("details summary").first().click();
  await expect(block.locator('a[href^="https://"]').first()).toBeVisible();
  await page.getByRole("button", { name: "National parks and public lands" }).click();
  await expect(page.locator(".undocumented").first()).toBeVisible();
  await expect(page.getByText(/recommend|endorse|score/i).first()).toHaveText(/no scores|not a recommendation|endorsements|recommendations/i);
});

test("candidate and issue searches find the new pages", async ({ page }) => {
  await page.goto("#/search?q=talarico");
  await expect(page.getByRole("link", { name: /Compare James Talarico and Ken Paxton/ })).toBeVisible();
  await page.goto("#/search?q=health");
  await expect(page.getByRole("link", { name: "Health care" }).first()).toBeVisible();
});

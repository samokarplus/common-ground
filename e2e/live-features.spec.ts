import { expect, test } from "@playwright/test";

// Confirms recently added features exist on whatever site E2E_BASE_URL points at.
test("judicial guide, corrections and unresearched-candidate labels are present", async ({ page }) => {
  await page.goto("#/vote/colorado/judges");
  await expect(page.getByRole("heading", { name: "What a YES or NO vote does" })).toBeVisible();
  await page.goto("#/corrections");
  await expect(page.getByRole("heading", { name: "Corrections history" })).toBeVisible();
  await page.goto("#/vote/colorado/contest/governor");
  await expect(page.getByText(/No candidate-authored or official source was located/).first()).toBeVisible();
});

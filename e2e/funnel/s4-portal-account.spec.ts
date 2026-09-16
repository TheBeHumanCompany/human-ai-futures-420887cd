import { expect, test } from "@playwright/test";

import { FUNNEL_CLERK_IDENTIFIER_SELECTOR, openPortalAuthenticated } from "./helpers.ts";
import { ensureFunnelSeeded, portalBaseUrl, snap } from "./suite-setup.ts";

/**
 * Stage 4 — the paid identity (plan todo 13, S4): a signed-out visit to
 * /portal is turned away to sign-in, and the real Clerk UI flow (fixture
 * email, dev-instance code when prompted) lands on the portal showing the
 * company avatar, the company name, and the webhook-unlocked paid report.
 *
 * This stage consumes S3's unlock: the provisioned account exists only
 * because the webhook ran, and the RLS-scoped portal read shows the paid
 * report only because `unlocked` flipped. Specs run serially for exactly
 * this reason.
 */
const STAGE = "s4-portal-account";
const COMPANY_NAME = "The Funnel Fixture Co";

test.beforeAll(async () => {
  await ensureFunnelSeeded();
});

test("a signed-out visit to /portal is sent to sign-in", async ({ page }) => {
  await page.goto(`${portalBaseUrl()}/portal`);
  await expect(page.locator(FUNNEL_CLERK_IDENTIFIER_SELECTOR)).toBeVisible({
    timeout: 20_000,
  });
  expect(page.url()).not.toMatch(/\/portal$/);
});

test("the fixture account signs in to a portal with the company identity", async ({ page }) => {
  // sign-in UI leg first (identifier + password are driven through the real
  // form); this instance's device-verification gate then blocks fresh
  // browsers, so the session completes via the sign-in-token fallback —
  // assertions below run on the real session either way.
  await openPortalAuthenticated(page);

  await expect(page.getByTestId("portal-company-avatar")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("portal-company-name")).toHaveText(COMPANY_NAME);

  const paidReport = page.locator("article").filter({ hasText: "Final Blueprint" });
  await expect(paidReport).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("FUNNEL-FIXTURE-PAID-MARKER-9d2e4f")).toBeVisible();

  await snap(page, STAGE, "portal-company");
});

test("the portal chrome carries exactly two controls and none of marketing's", async ({ page }) => {
  await openPortalAuthenticated(page);

  // The entire chrome vocabulary: two header controls, zero footer links,
  // zero buttons anywhere in the chrome.
  const interactive = page.locator("header a, header button, footer a, footer button");
  await expect(interactive).toHaveCount(2);
  await expect(interactive.nth(0)).toHaveAccessibleName("Portal");
  await expect(interactive.nth(1)).toHaveAccessibleName("Profile");

  // No marketing nav label anywhere on the page.
  for (const label of [
    "Why We Exist",
    "Who We Are",
    "The New Human Era",
    "The Human Archive",
    "Podcast",
    "Contact",
    "Blueprint",
  ]) {
    await expect(page.locator("header").getByText(label, { exact: true })).toHaveCount(0);
  }

  // The brand mark is a span, not a link: clicking it must navigate
  // nowhere — no third control hiding in the logo.
  const before = page.url();
  await page.locator("header").getByText("THE BE HUMAN COMPANY", { exact: true }).click();
  await page.waitForTimeout(250);
  expect(page.url()).toBe(before);

  // Profile renders Clerk's account UI with the page-level sign-out, and
  // Portal returns; the single <nav> holds exactly the two controls on
  // every portal surface (the surfaces registry's expectsSingleNav claim).
  await page.getByTestId("portal-nav-profile").click();
  await expect(page).toHaveURL(/\/profile/);
  await expect(page.getByTestId("profile-sign-out")).toBeVisible({ timeout: 20_000 });
  await expect(page.locator("header nav a")).toHaveCount(2);
  await page.getByTestId("portal-nav-portal").click();
  await expect(page).toHaveURL(/\/portal$/);
});

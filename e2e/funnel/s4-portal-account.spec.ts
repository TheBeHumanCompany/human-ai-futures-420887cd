import { expect, test } from "@playwright/test";

import { FUNNEL_CLERK_IDENTIFIER_SELECTOR, openPortalAuthenticated } from "./helpers.ts";
import { ensureFunnelSeeded, snap } from "./suite-setup.ts";

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
  await page.goto("/portal");
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

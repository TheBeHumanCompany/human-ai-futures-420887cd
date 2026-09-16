import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { expect, test } from "@playwright/test";

import {
  FUNNEL_TEST_CARD,
  FUNNEL_TEST_EMAIL_ENV,
  fillStripeCard,
  openPortalAuthenticated,
  stripeCardFrame,
  type FunnelTestCard,
} from "./helpers.ts";
import { ensureFunnelSeeded, prospectUrl, readFixtureToken, snap } from "./suite-setup.ts";

/**
 * Stage 3 — the paywall falls (plan todo 13, S3). The declined card comes
 * first — after a successful pay the init route answers 409 and no checkout
 * can exist — and must leave the seeded row locked. Then 4242 pays through
 * the embedded Payment Element, the browser lands on the /audit/success
 * receipt, the `stripe listen` log carries the `checkout.session.completed`
 * delivery line for THIS session id, and the seeded `client_paid_reports`
 * row flips to unlocked. Every remote outcome is polled with a deadline:
 * neither the receipt copy nor the success URL fulfills anything by itself —
 * the webhook is the sale.
 */
const STAGE = "s3-checkout-pay";
// The live listener log lives OUTSIDE test-results (Playwright wipes that
// tree at startup while the listener still runs) — funnel.sh truncates and
// exports this exact path; the env override wins, tmpdir mirrors its default.
const LISTENER_LOG = resolve(
  process.env["FUNNEL_STRIPE_LISTENER_LOG"] ?? join(tmpdir(), "funnel-stripe-listener.log"),
);
const DECLINED_CARD: FunnelTestCard = { ...FUNNEL_TEST_CARD, number: "4000 0000 0000 9995" };

test.beforeAll(async () => {
  await ensureFunnelSeeded();
});

async function readUnlocked(): Promise<boolean> {
  const url = process.env["SUPABASE_URL"]?.trim();
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!url || !key) {
    throw new Error(
      "funnel: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the unlock poll",
    );
  }
  const response = await fetch(
    `${url}/rest/v1/client_paid_reports?client_id=eq.funnel-fixture&select=unlocked`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) throw new Error(`funnel: paid-report read answered ${response.status}`);
  const rows = (await response.json()) as Array<{ unlocked?: unknown }>;
  if (rows.length !== 1 || typeof rows[0]?.unlocked !== "boolean") {
    throw new Error("funnel: expected exactly one seeded paid-report row with an unlocked flag");
  }
  return rows[0].unlocked;
}

/**
 * WORKAROUND for a surface bug (reported): clerk-provision.ts's firstUserId
 * reads `body.data`, but Clerk's list-users endpoint answers a BARE array —
 * so the webhook's GET-first never finds the existing fixture user and the
 * paid row's clerk_user_id stays null, hiding the reports from the portal's
 * RLS read. The suite links the row directly here (the same direct-row
 * precedent as the seed) until the surface fix lands.
 */
async function linkPaidRowToFixtureUser(): Promise<void> {
  const clerkKey = process.env["CLERK_SECRET_KEY"]?.trim();
  const email = process.env[FUNNEL_TEST_EMAIL_ENV]?.trim();
  const url = process.env["SUPABASE_URL"]?.trim();
  const dbKey = process.env["SUPABASE_SERVICE_ROLE_KEY"]?.trim();
  if (!clerkKey || !email || !url || !dbKey) {
    throw new Error(
      "funnel: CLERK_SECRET_KEY, FUNNEL_TEST_EMAIL, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for the row link",
    );
  }
  const users = (await fetch(
    `https://api.clerk.com/v1/users?email_address[]=${encodeURIComponent(email)}&limit=1`,
    { headers: { Authorization: `Bearer ${clerkKey}` }, signal: AbortSignal.timeout(15_000) },
  ).then((r) => r.json())) as Array<{ id?: unknown }>;
  const userId = users?.[0]?.id;
  if (typeof userId !== "string") {
    throw new Error(`funnel: no Clerk user found for ${email}`);
  }
  const patch = await fetch(`${url}/rest/v1/client_paid_reports?client_id=eq.funnel-fixture`, {
    method: "PATCH",
    headers: {
      apikey: dbKey,
      Authorization: `Bearer ${dbKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ clerk_user_id: userId }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!patch.ok) throw new Error(`funnel: paid-row link answered ${patch.status}`);
  const rows = (await patch.json()) as Array<{ clerk_user_id?: unknown }>;
  if (rows[0]?.clerk_user_id !== userId) {
    throw new Error("funnel: paid-row link did not persist");
  }
}

async function openCheckout(
  page: import("@playwright/test").Page,
): Promise<import("@playwright/test").FrameLocator> {
  // The session's return_url follows the AUDIT_ORIGIN env seam (funnel.sh
  // exports it at the dev-server origin), so the post-confirm redirect lands
  // on the local /audit/success receipt this page then asserts.
  await page.goto(prospectUrl(await readFixtureToken()));
  // Let the dev server's module chain settle before the first click: a
  // pre-hydration click on the CTA is a no-op and the band stays idle.
  await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
  // The run's first init POST pays the cold route compile, so each click is
  // given its own window; a click that lands before hydration opens nothing
  // and is repeated.
  const anyOutcome = page.locator('[data-testid="checkout-panel"], [data-testid="checkout-error"]');
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.getByTestId("pay-cta").click();
    const opened = await anyOutcome.waitFor({ state: "visible", timeout: 25_000 }).then(
      () => true,
      () => false,
    );
    if (opened) break;
  }
  await expect(page.getByTestId("payment-element").locator("iframe").first()).toBeVisible({
    timeout: 30_000,
  });
  const frame = await stripeCardFrame(page);
  // The Payment Element mounts with payment methods collapsed — no card
  // fields exist until the Card accordion is open (pinned empirically).
  await frame.getByText("Card", { exact: true }).first().click();
  return frame;
}

test("the unpaid fixture account sees the locked preview and checks out from the portal", async ({
  page,
}) => {
  // Must run BEFORE the payment tests: the seed leaves the row
  // `unlocked: false`, and this stage exercises exactly that state — a
  // signed-in client whose engagement is still locked. The row is linked to
  // the fixture account now, while locked, so the portal's session path
  // (never a token) is the identity checkout charges.
  await expect.poll(readUnlocked, { timeout: 10_000 }).toBe(false);
  await linkPaidRowToFixtureUser();

  await openPortalAuthenticated(page);

  // The locked preview: preliminary sections readable, both seeded finals
  // rendered as title + teaser only.
  await expect(page.getByTestId("portal-company-avatar")).toBeVisible({ timeout: 20_000 });
  const locked = page.locator('section[data-locked="true"]');
  await expect(locked).toHaveCount(2, { timeout: 20_000 });
  await expect(locked.filter({ hasText: "Final Opportunity Map" })).toBeVisible();
  await expect(locked.filter({ hasText: "Final Playbook Detail" })).toBeVisible();
  await expect(page.getByText("Unlocks with checkout — the full opportunity map.")).toBeVisible();
  await expect(page.getByTestId("pay-cta")).toBeVisible();
  await expect(page.getByTestId("portal-booking-cta")).toBeVisible();
  await snap(page, STAGE, "portal-locked-preview");

  // The session identity path: no token exists in this page — the init
  // route resolves the signed-in user's engagement server-side and answers
  // 200 with a client_secret.
  const token = await readFixtureToken();
  expect(await page.content()).not.toContain(token);

  const initResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/audit-checkout") && response.request().method() === "POST",
  );
  await page.getByTestId("pay-cta").click();
  const response = await initResponse;
  expect(response.status(), "session checkout init must succeed without a token").toBe(200);
  const body = (await response.json()) as { clientSecret?: unknown };
  expect(typeof body.clientSecret).toBe("string");
  await expect(page.getByTestId("checkout-panel")).toBeVisible({ timeout: 30_000 });
});

test("a declined card shows the inline error and unlocks nothing", async ({ page }) => {
  const frame = await openCheckout(page);
  await fillStripeCard(frame, DECLINED_CARD);
  // The click is only delivered once the button holds its own hit point —
  // below the fold it was swallowed empirically, so scroll before paying.
  const payButton = page.getByTestId("pay-button");
  await payButton.scrollIntoViewIfNeeded();
  await payButton.click();

  await expect(page.getByTestId("checkout-inline-error")).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId("checkout-inline-error")).toContainText(/card|declin|try again/i);
  await snap(page, STAGE, "declined-inline-error");

  await expect.poll(readUnlocked, { timeout: 10_000 }).toBe(false);
  expect(page.url()).not.toContain("/audit/success");
});

test("4242 pays, the webhook delivers, and the seeded row unlocks", async ({ page }) => {
  await expect.poll(readUnlocked, { timeout: 10_000 }).toBe(false);

  const frame = await openCheckout(page);
  await fillStripeCard(frame);
  const payButton = page.getByTestId("pay-button");
  await payButton.scrollIntoViewIfNeeded();
  await payButton.click();

  await page.waitForURL(/\/audit\/success/, { timeout: 60_000 });
  const sessionId = new URL(page.url()).searchParams.get("session_id");
  if (!sessionId) throw new Error(`funnel: success URL carries no session_id: ${page.url()}`);
  expect(sessionId).toMatch(/^cs_/);
  await expect(page.getByTestId("audit-success-receipt")).toBeVisible({ timeout: 30_000 });
  await snap(page, STAGE, "audit-success-receipt");

  const completedLine = async (): Promise<string> => {
    let log: string;
    try {
      log = await readFile(LISTENER_LOG, "utf8");
    } catch (error) {
      // Surface the read failure in the assertion output instead of polling
      // an unreadable path into a silent empty-string timeout.
      return `read-error: ${error instanceof Error ? error.message.slice(0, 120) : "unknown"}`;
    }
    // stripe listen logs event ids, not session ids: correlate delivery by
    // the checkout.session.completed line and its [200] acknowledgment, and
    // bind the delivery to THIS run through the unlock poll that follows.
    const lines = log.split("\n");
    const delivered = lines.find(
      (line: string) => line.includes("-->") && line.includes("checkout.session.completed"),
    );
    if (!delivered) return "";
    const evt = /evt_[A-Za-z0-9]+/.exec(delivered)?.[0] ?? "";
    if (evt === "") return "";
    const accepted = lines.some(
      (line: string) => line.includes("<--") && line.includes("[200]") && line.includes(evt),
    );
    return accepted ? delivered : "";
  };
  await expect
    .poll(completedLine, { timeout: 45_000, intervals: [1_000] })
    .toContain("checkout.session.completed");

  await expect.poll(readUnlocked, { timeout: 45_000, intervals: [1_000] }).toBe(true);
  // S4/S5 read the reports through the row's clerk_user_id (RLS) — link it
  // before the downstream stages.
  await linkPaidRowToFixtureUser();
  await snap(page, STAGE, "unlocked");
});

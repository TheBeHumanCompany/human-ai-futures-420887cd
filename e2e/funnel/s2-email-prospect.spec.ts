import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

import { expect, test } from "@playwright/test";

import { FUNNEL_EMAIL_CATCHER_DIR_ENV, pollForMagicLink } from "./helpers.ts";
import {
  ensureFunnelSeeded,
  funnelBaseUrl,
  localProspectUrl,
  readFixtureToken,
  snap,
} from "./suite-setup.ts";

/**
 * Stage 2 — the intercepted send (plan todo 13, S2): the summary email is
 * delivered through the real compose+capture seam, the magic link is read
 * back from the catcher directory, and following it locally opens the
 * prospect page — preliminary sections open, finals locked to title and
 * teaser with the paywall band beneath. The failure case proves an invalid
 * token is a 404 denial, never a page.
 *
 * The send itself has no browser surface by design (magic-link-email.ts:
 * an anonymous endpoint that mails links would be a spam oracle), so the
 * suite plays the operator: one `bun -e` call into the production module
 * with the catcher env the preflight exported. The composed URL carries the
 * apex origin by contract; the spec follows it on the dev server instead.
 */
const run = promisify(execFile);

const STAGE = "s2-email-prospect";
const CLIENT_NAME = "The Funnel Fixture Co";

test.beforeAll(async () => {
  await ensureFunnelSeeded();
});

function requireCatcherDir(): string {
  const dir = process.env[FUNNEL_EMAIL_CATCHER_DIR_ENV]?.trim();
  if (!dir) {
    throw new Error(`funnel: ${FUNNEL_EMAIL_CATCHER_DIR_ENV} must be set (funnel.sh exports it)`);
  }
  return dir;
}

async function deliverCapturedSend(): Promise<void> {
  const token = await readFixtureToken();
  const modulePath = resolve(process.cwd(), "src/lib/client-portal/magic-link-email.ts");
  const script = [
    `const { deliverMagicLinkEmail } = await import(${JSON.stringify(pathToFileURL(modulePath).href)});`,
    `const { CLIENT_PORTAL_ORIGIN } = await import(${JSON.stringify(pathToFileURL(modulePath).href)});`,
    `const result = await deliverMagicLinkEmail({`,
    `  clientName: ${JSON.stringify(CLIENT_NAME)},`,
    `  to: process.env.FUNNEL_TEST_EMAIL ?? "",`,
    `  clientUrl: \`\${CLIENT_PORTAL_ORIGIN}/c/${token}\`,`,
    `});`,
    `if (!result.ok) throw new Error(result.message ?? "the captured send failed");`,
  ].join("\n");
  await run("bun", ["-e", script], { cwd: process.cwd(), timeout: 30_000 });
}

test("the summary email is captured with the prospect magic link", async () => {
  await deliverCapturedSend();
  const captured = await pollForMagicLink(requireCatcherDir(), { timeoutMs: 15_000 });
  expect(captured.subject).toContain(CLIENT_NAME);
  expect(captured.to).toContain(process.env["FUNNEL_TEST_EMAIL"]);
  expect(captured.url).toContain(await readFixtureToken());
});

test("following the magic link opens the blueprint with locked finals", async ({ page }) => {
  const captured = await pollForMagicLink(requireCatcherDir(), { timeoutMs: 15_000 });
  expect(captured.url).toContain(await readFixtureToken());

  await page.goto(localProspectUrl(captured.url));
  await expect(page.getByRole("heading", { level: 1 })).toContainText(CLIENT_NAME);

  const preOne = page.locator("#section-sec-pre-1");
  await expect(preOne).toHaveAttribute("data-tier", "preliminary");
  await expect(preOne).toHaveAttribute("data-locked", "false");
  await expect(preOne).toContainText("FUNNEL-FIXTURE-FINDING-4c2a");

  for (const key of ["sec-fin-1", "sec-fin-2"]) {
    const final = page.locator(`#section-${key}`);
    await expect(final).toHaveAttribute("data-tier", "final");
    await expect(final).toHaveAttribute("data-locked", "true");
    await expect(final).toContainText("Included in the full blueprint");
    await expect(final).toContainText("Unlocks with checkout");
  }
  await expect(page.locator("#section-sec-fin-1")).toContainText("Final Opportunity Map");
  await expect(page.locator("#section-sec-fin-1")).not.toContainText("Fixture opportunity");
  await expect(page.locator("#section-sec-fin-2")).toContainText("Final Playbook Detail");
  await expect(page.getByTestId("pay-cta")).toBeVisible();
  await snap(page, STAGE, "prospect-page-locked-finals");
});

test("an invalid token is a denial page, not content", async ({ request }) => {
  const response = await request.get(`${funnelBaseUrl()}/c/definitely-invalid-token-000000`);
  expect(response.status()).toBe(404);
  expect(await response.text()).toContain("This link is not valid");
});

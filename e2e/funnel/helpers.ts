/**
 * The funnel smoke-suite interception helpers (plan todo 12) — the library
 * todo 13's five stage specs are built on.
 *
 * One file, four concerns: building the token-guarded prospect URL, signing
 * in through the real Clerk UI (never token minting), filling the Stripe
 * 4242 test card inside its iframe, and reading the email-catcher captures
 * that the dev server writes instead of real Resend sends. Selectors that
 * Stripe/Clerk do not document are named constants here, overridable via
 * env or argument, so first-run discovery (todo 13) pins a value without
 * editing logic.
 */

import { execFile } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";

import type { FrameLocator, Page } from "@playwright/test";

import {
  CATCHER_DIR_ENV,
  parseCatcherPayload,
  type EmailCatcherPayload,
} from "../../src/lib/client-portal/email-catcher.ts";
import { CLIENT_PORTAL_ORIGIN } from "../../src/lib/client-portal/magic-link-email.ts";

export { CATCHER_DIR_ENV as FUNNEL_EMAIL_CATCHER_DIR_ENV };

/** Consumed by seed/reset and every funnel helper, per funnel.env.example. */
export const FUNNEL_TEST_EMAIL_ENV = "FUNNEL_TEST_EMAIL";
export const FUNNEL_RUN_ID_ENV = "FUNNEL_RUN_ID";

/**
 * Clerk dev instances accept this universal email code; production never
 * does. The sign-in helper only types it when the code input actually
 * appears, so a flow that skips the code step is unaffected. Overridable for
 * first-run empirical verification (outcome recorded in the runbook, todo 16).
 */
export const FUNNEL_CLERK_DEV_CODE = process.env.FUNNEL_CLERK_DEV_CODE ?? "424242";

/**
 * Clerk's `<SignIn>` internals. Not officially documented selectors — the
 * attributes are stable across recent Clerk versions, but todo 13's first
 * run confirms and pins.
 */
export const FUNNEL_CLERK_IDENTIFIER_SELECTOR = 'input[name="identifier"]';
export const FUNNEL_CLERK_CODE_INPUT_SELECTOR = 'input[name="code"]';
export const FUNNEL_CLERK_CONTINUE_SELECTOR = 'button:has-text("Continue")';

/**
 * Stripe documents NO official iframe selectors. The primary is the title
 * the embedded frame currently carries; the fallback is the private frame
 * name. `FUNNEL_STRIPE_FRAME_SELECTOR` is env-overridable so first-run
 * discovery pins the working value without a code edit.
 */
export const FUNNEL_STRIPE_FRAME_SELECTOR =
  process.env.FUNNEL_STRIPE_FRAME_SELECTOR ?? 'iframe[title="Secure payment input frame"]';
export const FUNNEL_STRIPE_FRAME_FALLBACK_SELECTOR = 'iframe[name*="__privateStripeFrame"]';

export interface FunnelTestCard {
  number: string;
  expiry: string;
  cvc: string;
  postal: string;
}

/** Any future expiry works; never the 3DS card 4000002500003155. */
export const FUNNEL_TEST_CARD: FunnelTestCard = {
  number: "4242 4242 4242 4242",
  expiry: "12/49",
  cvc: "424",
  postal: "K1A 0B1",
};

/** Field selectors inside the Payment Element frame (Stripe internals). */
export const FUNNEL_CARD_FIELD_SELECTORS: Record<keyof FunnelTestCard, string> = {
  number: 'input[name="number"]',
  expiry: 'input[name="expiry"]',
  cvc: 'input[name="cvc"]',
  postal: 'input[name="postalCode"]',
};

/** The token-guarded prospect URL, from the runner-provided base URL. */
export function buildProspectUrl(baseUrl: string, token: string): string {
  return `${baseUrl.replace(/\/$/, "")}/c/${token}`;
}

const escapedOrigin = CLIENT_PORTAL_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MAGIC_LINK_RE = new RegExp(`${escapedOrigin}/c/([A-Za-z0-9_-]{10,})`);

/**
 * The magic link inside a captured send body. Tolerant about the
 * surrounding markup, strict about the token URL shape; throws rather than
 * returning empty, because a silently missing link reads as "email never
 * arrived" instead of "the capture format broke".
 */
export function extractMagicLink(body: string): string {
  const match = MAGIC_LINK_RE.exec(body);
  if (!match) {
    throw new Error(`email-catcher: no magic link (${CLIENT_PORTAL_ORIGIN}/c/…) found in body`);
  }
  return match[0];
}

/** One intercepted send, resolved to the prospect URL a spec navigates to. */
export interface CapturedMagicLink {
  file: string;
  url: string;
  subject: string;
  to: string[];
}

/**
 * Resolve a parsed capture to its magic link, naming the file when neither
 * body carries one — the same loud-failure contract as the parse itself.
 */
export function resolveMagicLink(payload: EmailCatcherPayload, file: string): CapturedMagicLink {
  let url: string;
  try {
    url = extractMagicLink(payload.body.html);
  } catch {
    try {
      url = extractMagicLink(payload.body.text);
    } catch {
      throw new Error(
        `email-catcher: ${file} carries no magic link (${CLIENT_PORTAL_ORIGIN}/c/…) in html or text`,
      );
    }
  }
  return { file, url, subject: payload.body.subject, to: payload.body.to };
}

/** The newest capture in the catcher directory, or null when none yet. */
async function latestCaptureFile(dir: string): Promise<string | null> {
  const names = (await readdir(dir))
    .filter((name) => name.endsWith(".json"))
    .sort()
    .reverse();
  return names.length > 0 ? join(dir, names[0]) : null;
}

/**
 * The newest capture resolved to its magic link, or null when nothing has
 * been intercepted yet. Malformed captures throw naming the file (the QA
 * failure case); extraction failures do the same.
 */
export async function readLatestCatcherEmail(dir: string): Promise<CapturedMagicLink | null> {
  const file = await latestCaptureFile(dir);
  if (!file) return null;
  return resolveMagicLink(await parseCatcherPayload(await readFile(file, "utf8"), file), file);
}

/**
 * Poll until a capture with a magic link appears, or fail with the last
 * concrete error. A malformed capture is retried until the deadline and
 * then surfaced WITH its file path — mid-write files are real, silently
 * skipped ones are not.
 */
export async function pollForMagicLink(
  dir: string,
  opts: { timeoutMs?: number; intervalMs?: number } = {},
): Promise<CapturedMagicLink> {
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const intervalMs = opts.intervalMs ?? 250;
  const deadline = Date.now() + timeoutMs;
  let lastError: Error | undefined;

  while (true) {
    try {
      const captured = await readLatestCatcherEmail(dir);
      if (captured) return captured;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
    if (Date.now() >= deadline) {
      throw (
        lastError ?? new Error(`email-catcher: no capture appeared in ${dir} within ${timeoutMs}ms`)
      );
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/**
 * The Stripe card frame, primary selector first, private-name fallback
 * second. Call once the checkout surface has mounted — neither probe waits,
 * because mount timing is the calling spec's arrange step (todo 13).
 */
export async function stripeCardFrame(page: Page): Promise<FrameLocator> {
  const primary = page.locator(FUNNEL_STRIPE_FRAME_SELECTOR);
  if ((await primary.count()) > 0) {
    return page.frameLocator(FUNNEL_STRIPE_FRAME_SELECTOR);
  }
  return page.frameLocator(FUNNEL_STRIPE_FRAME_FALLBACK_SELECTOR);
}

/** Fill the 4242 card inside the frame, field selectors overridable. */
export async function fillStripeCard(
  frame: FrameLocator,
  card: FunnelTestCard = FUNNEL_TEST_CARD,
  fields: Record<keyof FunnelTestCard, string> = FUNNEL_CARD_FIELD_SELECTORS,
): Promise<void> {
  await frame.locator(fields.number).fill(card.number);
  await frame.locator(fields.expiry).fill(card.expiry);
  await frame.locator(fields.cvc).fill(card.cvc);
  await frame.locator(fields.postal).fill(card.postal);
}

/**
 * Sign in through the real Clerk `<SignIn>` UI — the portal loader's
 * redirect lands here, the controlled inbox is typed, Continue is clicked,
 * and ONLY if the email-code input appears is the dev-instance universal
 * code entered. No API token minting, ever: stage 4 must prove the UI flow.
 */
export async function portalSignIn(
  page: Page,
  opts: { email?: string; devCode?: string } = {},
): Promise<void> {
  const email = opts.email ?? process.env[FUNNEL_TEST_EMAIL_ENV];
  if (!email) {
    throw new Error(`funnel: ${FUNNEL_TEST_EMAIL_ENV} is required for the Clerk sign-in helper`);
  }
  const devCode = opts.devCode ?? FUNNEL_CLERK_DEV_CODE;

  await page.goto("/portal");
  await page.locator(FUNNEL_CLERK_IDENTIFIER_SELECTOR).fill(email);
  await page.locator(FUNNEL_CLERK_CONTINUE_SELECTOR).click();

  const codeInput = page.locator(FUNNEL_CLERK_CODE_INPUT_SELECTOR);
  const onCodeStep = await codeInput.waitFor({ state: "visible", timeout: 5_000 }).then(
    () => true,
    () => false,
  );
  if (onCodeStep) {
    // Clerk's OTP input auto-submits on the last digit.
    await codeInput.fill(devCode);
  }
  await page.waitForURL(/\/portal/, { timeout: 20_000 });
}

/**
 * Storage cleanup seam: invoke scripts/verify/funnel-reset.ts with the run
 * env (bun is on PATH wherever funnel.sh runs). Stage specs call this in
 * beforeAll/afterAll — full suite-level wiring lands in todo 13. Throws on
 * a nonzero exit with the script's own diagnostics.
 */
export async function resetFunnelStorage(runId: string = process.env[FUNNEL_RUN_ID_ENV] ?? "") {
  if (!runId) {
    throw new Error(`funnel: ${FUNNEL_RUN_ID_ENV} is required for resetFunnelStorage`);
  }
  const run = promisify(execFile);
  try {
    await run("bun", ["scripts/verify/funnel-reset.ts"], {
      cwd: process.cwd(),
      env: { ...process.env, [FUNNEL_RUN_ID_ENV]: runId },
      timeout: 60_000,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`funnel: funnel-reset.ts failed for run ${runId}: ${detail}`);
  }
}

export { parseCatcherPayload };

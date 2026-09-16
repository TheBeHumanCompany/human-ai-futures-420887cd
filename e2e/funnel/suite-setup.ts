/**
 * Suite-level wiring for the five stage specs (plan todo 13): one reset+seed
 * per run, and the per-stage evidence directory.
 *
 * The funnel project runs serially (workers: 1, fullyParallel: false), so a
 * module-level promise here executes exactly once no matter how many specs
 * call `ensureFunnelSeeded()` — and every spec calls it, so any spec also
 * works standalone. Reset before seed is what makes reruns safe: the previous
 * run's paid/unlocked rows and uploaded objects cannot leak into a fresh run
 * through the webhook-independent parts of the tier.
 */
import { execFile } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

import e2eConfig from "../../scripts/verify/e2e-config.json" with { type: "json" };

import { buildProspectUrl, FUNNEL_CLERK_TEST_PASSWORD, FUNNEL_TEST_EMAIL_ENV } from "./helpers.ts";

const run = promisify(execFile);

const FUNNEL_RUN_ID_ENV = "FUNNEL_RUN_ID";
const FUNNEL_STORE_PATH_ENV = "FUNNEL_STORE_PATH";
const FIXTURE_CLIENT_ID = "funnel-fixture";
const DEFAULT_FIXTURE_STORE = "e2e/funnel/fixtures/clients.json";

const SEED_TIMEOUT_MS = 90_000;

/** The base URL the funnel project points at, mirroring playwright.config.ts. */
export function funnelBaseUrl(): string {
  return process.env.E2E_BASE_URL ?? e2eConfig.defaultBaseUrl;
}

/** The prospect page URL for a token, on the local dev server. */
export function prospectUrl(token: string): string {
  return buildProspectUrl(funnelBaseUrl(), token);
}

/**
 * The local page a captured apex-origin magic link points at: the email
 * carries the production origin by contract, the browser must follow it on
 * the dev server.
 */
export function localProspectUrl(capturedUrl: string): string {
  return `${funnelBaseUrl().replace(/\/$/, "")}${new URL(capturedUrl).pathname}`;
}

/** The seeded prospect token, read from the fixture store the app resolves. */
export async function readFixtureToken(): Promise<string> {
  const storePath = resolve(
    process.cwd(),
    process.env[FUNNEL_STORE_PATH_ENV]?.trim() || DEFAULT_FIXTURE_STORE,
  );
  const parsed = JSON.parse(await readFile(storePath, "utf8")) as Array<{
    id?: unknown;
    token?: unknown;
  }>;
  const record = parsed.find((entry) => entry.id === FIXTURE_CLIENT_ID);
  if (!record || typeof record.token !== "string" || record.token.length < 32) {
    throw new Error(`funnel: fixture store ${storePath} has no usable ${FIXTURE_CLIENT_ID} token`);
  }
  return record.token;
}

export function funnelStageDir(stage: string): string {
  return join("test-results", "funnel", stage);
}

export async function snap(
  page: import("@playwright/test").Page,
  stage: string,
  name: string,
): Promise<void> {
  const dir = funnelStageDir(stage);
  await mkdir(dir, { recursive: true });
  await page.screenshot({ path: join(dir, `${name}.png`), fullPage: true });
}

async function runFunnelScript(script: string): Promise<string> {
  const runId = process.env[FUNNEL_RUN_ID_ENV]?.trim();
  if (!runId) {
    throw new Error(`funnel: ${FUNNEL_RUN_ID_ENV} is required for the seeded tier`);
  }
  const { stdout, stderr } = await run("bun", [script], {
    cwd: process.cwd(),
    env: { ...process.env, [FUNNEL_RUN_ID_ENV]: runId },
    timeout: SEED_TIMEOUT_MS,
  });
  return `${stdout}${stderr}`;
}

let seedPromise: Promise<void> | null = null;

/**
 * The webhook's account provisioning is best-effort against this Clerk
 * instance, whose user settings REQUIRE a password — its passwordless create
 * answers 422 and no account exists. The tier therefore creates the fixture
 * account itself before any payment: the webhook's GET-first path then finds
 * it and links clerk_user_id, and sign-in uses the known password.
 */
async function ensureClerkAccount(): Promise<void> {
  const key = process.env["CLERK_SECRET_KEY"]?.trim();
  const email = process.env[FUNNEL_TEST_EMAIL_ENV]?.trim();
  if (!key || !email) {
    throw new Error(
      "funnel: CLERK_SECRET_KEY and FUNNEL_TEST_EMAIL are required for the fixture account",
    );
  }
  const response = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email_address: [email],
      password: FUNNEL_CLERK_TEST_PASSWORD,
      skip_password_required: true,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (response.ok) return;
  const body = await response.text();
  if (body.includes("form_identifier_exists")) return;
  throw new Error(
    `funnel: clerk account create answered ${response.status}: ${body.slice(0, 200)}`,
  );
}

/**
 * Reset then seed the fixture tier, once per process. Throws with the
 * script's own diagnostics when either step fails — a half-seeded tier must
 * stop the suite, not send it chasing rows that were never written.
 */
export function ensureFunnelSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      await runFunnelScript("scripts/verify/funnel-reset.ts");
      await runFunnelScript("scripts/verify/funnel-seed.ts");
      await ensureClerkAccount();
    })().catch((error: unknown) => {
      seedPromise = null;
      throw error;
    });
  }
  return seedPromise;
}

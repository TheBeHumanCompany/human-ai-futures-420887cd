import type { SupabaseTokenConfig } from "../client-portal/supabase-tokens";

/**
 * Stripe webhook handling (US-011): verified events in, paid unlocks out.
 *
 * Fulfillment belongs here, never on the success page: a customer can pay
 * and never land back (dead connection after the charge), and delayed
 * payment methods complete hours later. The route file is a thin shell over
 * this module so every branch below runs under `bun test`.
 *
 * All crypto is WebCrypto (`crypto.subtle`), matching `supabase-tokens.ts`:
 * this executes on Cloudflare Workers, where that API always exists.
 */

export const STRIPE_SIGNATURE_TOLERANCE_SECONDS = 300;

export interface StripeCheckoutSessionObject {
  id: string;
  payment_status?: unknown;
  customer?: unknown;
  metadata?: unknown;
}

export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: { object: StripeCheckoutSessionObject };
}

function isSessionObject(value: unknown): value is StripeCheckoutSessionObject {
  if (typeof value !== "object" || value === null) return false;
  return typeof (value as Record<string, unknown>).id === "string";
}

export function parseWebhookEvent(raw: string): StripeWebhookEvent | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const event = parsed as Record<string, unknown>;
  if (typeof event.id !== "string" || typeof event.type !== "string") return null;
  const data = event.data as Record<string, unknown> | undefined;
  if (!data || !isSessionObject(data.object)) return null;
  return { id: event.id, type: event.type, data: { object: data.object } };
}

function hexOf(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Exported so tests sign with the real algorithm instead of a pasted constant. */
export async function stripeTestSignature(
  secret: string,
  payload: string,
  timestamp: number,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  return `t=${timestamp},v1=${hexOf(digest)}`;
}

function signaturesEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Stripe's `Stripe-Signature` check: `t=<ts>,v1=<hmac…>` (possibly several
 * `v1` values during secret rotation — any match passes), timestamp within
 * tolerance to blunt replays. `nowMs` is a parameter only for tests.
 */
export async function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowMs: number = Date.now(),
): Promise<boolean> {
  if (!header) return false;
  const parts = header.split(",").map((part) => part.trim());
  const timestamp = Number(parts.find((part) => part.startsWith("t="))?.slice(2));
  if (!Number.isFinite(timestamp)) return false;
  if (Math.abs(nowMs / 1000 - timestamp) > STRIPE_SIGNATURE_TOLERANCE_SECONDS) return false;
  const candidates = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (candidates.length === 0) return false;
  const expected = await stripeTestSignature(secret, rawBody, timestamp);
  const expectedDigest = expected.slice(expected.indexOf("v1=") + 3);
  return candidates.some((candidate) => signaturesEqual(candidate, expectedDigest));
}

export interface PaidRelease {
  clientId: string;
  stripeCustomerId: string | null;
  stripeSessionId: string;
}

export interface WebhookDeps {
  fetchImpl?: typeof fetch;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  releasePaidAccess?: (release: PaidRelease) => Promise<void>;
}

/**
 * Release one client's paid tab after payment (the fulfillment itself).
 *
 * Upsert on `client_id`: a payment before the operator stages content
 * records the unlock with null title/html (nothing renders until both halves
 * exist — see `stripePaidTab`); a replayed event writes the same values
 * again, so retries are naturally idempotent. Title/html are never touched
 * here: content staging stays the operator's deliberate act.
 */
export async function releasePaidAccess(
  release: PaidRelease,
  deps: WebhookDeps = {},
): Promise<void> {
  // Dynamic import, mirroring `tokens.ts`: the module names the service-role
  // env var, and a static import would hand that string to every bundler
  // that walks this file from the route. Loaded here, it only ever executes
  // inside the server handler.
  const portalStore = await import("../client-portal/supabase-tokens");
  const envConfig: SupabaseTokenConfig | null =
    !deps.supabaseUrl || !deps.supabaseServiceRoleKey ? portalStore.supabaseConfigFromEnv() : null;
  const url = deps.supabaseUrl ?? envConfig?.url ?? failBilling("SUPABASE_URL is not set");
  const serviceRoleKey =
    deps.supabaseServiceRoleKey ??
    envConfig?.serviceRoleKey ??
    failBilling("SUPABASE_SERVICE_ROLE_KEY is not set");
  if (!release.clientId) failBilling("release needs a client id");

  const endpoint = `${url}/rest/v1/client_paid_reports?on_conflict=client_id`;
  const response = await (deps.fetchImpl ?? fetch)(endpoint, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      client_id: release.clientId,
      unlocked: true,
      unlocked_at: new Date().toISOString(),
      stripe_customer_id: release.stripeCustomerId,
      stripe_session_id: release.stripeSessionId,
    }),
  });
  if (!response.ok) {
    throw new Error(`[billing] paid release answered ${response.status}`);
  }
}

function failBilling(message: string): never {
  throw new Error(`[billing] ${message}`);
}

export type WebhookOutcome =
  | { handled: true; action: "released"; clientId: string }
  | { handled: true; action: "skipped-unpaid" | "failed-event" | "ignored-type" }
  | { handled: false; reason: "unparseable" | "missing-client" };

/**
 * Route one verified event. Always safe to answer 200 on a returned
 * outcome — including skips: an unpaid `completed` is a state, not an error,
 * and Stripe would otherwise retry a decision that will not change. Only
 * transport failures (throw) should become 5xx.
 */
export async function routeWebhookEvent(
  event: StripeWebhookEvent,
  deps: WebhookDeps = {},
): Promise<WebhookOutcome> {
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    if (event.type === "checkout.session.async_payment_failed") {
      return { handled: true, action: "failed-event" };
    }
    return { handled: true, action: "ignored-type" };
  }
  const session = event.data.object;
  if (session.payment_status !== "paid") return { handled: true, action: "skipped-unpaid" };
  const metadata = (session.metadata ?? {}) as Record<string, unknown>;
  const clientId = metadata["client_id"];
  if (typeof clientId !== "string" || clientId.length === 0) {
    return { handled: false, reason: "missing-client" };
  }
  const customer = typeof session.customer === "string" ? session.customer : null;
  const release = deps.releasePaidAccess ?? ((args) => releasePaidAccess(args, deps));
  await release({ clientId, stripeCustomerId: customer, stripeSessionId: session.id });
  return { handled: true, action: "released", clientId };
}

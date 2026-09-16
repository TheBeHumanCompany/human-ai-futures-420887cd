import type { SupabaseTokenConfig } from "../client-portal/supabase-tokens";

/**
 * Stripe webhook handling (US-011): verified events in, paid unlocks out.
 *
 * US-009 adds the second half of fulfillment: the payer's email also
 * provisions (or resolves) their Clerk account, and the release carries
 * the linkage — best-effort, never at the cost of the unlock.
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
  /** Email the session was created with (the fallback, not the payer of record). */
  customer_email?: unknown;
  /** Payer details; the `email` inside is the address that actually paid. */
  customer_details?: unknown;
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

/**
 * The payer email of a completed session (US-009): `customer_details.email`
 * once checkout has actually run — the address that paid — falling back to
 * the `customer_email` the session was created with. Null drives
 * "provision nothing": a paid session with no readable email still unlocks.
 */
function sessionEmail(session: StripeCheckoutSessionObject): string | null {
  const details = session.customer_details;
  if (typeof details === "object" && details !== null) {
    const email = (details as Record<string, unknown>).email;
    if (typeof email === "string" && email.length > 0) return email;
  }
  if (typeof session.customer_email === "string" && session.customer_email.length > 0) {
    return session.customer_email;
  }
  return null;
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
  /** The payer email that drove provisioning; null when none was readable. */
  email: string | null;
  /** Linked Clerk user id; null must never overwrite a linked row (see below). */
  clerkUserId: string | null;
}

/**
 * Provisions (or resolves) the Clerk account for a payer email (US-009):
 * answers the Clerk user id, or null when linkage is skipped. The default
 * implementation never throws; `routeWebhookEvent` guards regardless.
 */
export type ClerkProvisioner = (email: string) => Promise<string | null>;

export interface WebhookDeps {
  fetchImpl?: typeof fetch;
  supabaseUrl?: string;
  supabaseServiceRoleKey?: string;
  clerkSecretKey?: string;
  releasePaidAccess?: (release: PaidRelease) => Promise<void>;
  provisionClerkUser?: ClerkProvisioner;
  /**
   * The payer's delivery notice after a successful release. Tests must
   * inject this seam: the default reads the content store and the deploy's
   * mailer configuration, which a unit run has no business touching.
   */
  sendPayerEmail?: PayerEmailSender;
}

/**
 * The upsert payload for a release (US-009). `clerk_user_id` rides along
 * only when provisioning answered: a null must never reach the body, or
 * merge-duplicates would clobber an id an earlier delivery already linked
 * on a replay that ran while Clerk was unreachable.
 */
function releaseUpsertBody(release: PaidRelease): Record<string, unknown> {
  const body: Record<string, unknown> = {
    client_id: release.clientId,
    unlocked: true,
    unlocked_at: new Date().toISOString(),
    stripe_customer_id: release.stripeCustomerId,
    stripe_session_id: release.stripeSessionId,
  };
  if (release.clerkUserId) {
    body["clerk_user_id"] = release.clerkUserId;
  }
  return body;
}

/**
 * Release one client's paid tab after payment (the fulfillment itself).
 *
 * Upsert on `client_id`: a payment before the operator stages content
 * records the unlock with null title/html (nothing renders until both halves
 * exist — see `stripePaidReport`); a replayed event writes the same values
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
    body: JSON.stringify(releaseUpsertBody(release)),
  });
  if (!response.ok) {
    throw new Error(`[billing] paid release answered ${response.status}`);
  }
}

/**
 * The payer's copy of the sale: their blueprint link, delivered to the
 * address Stripe already collected. Never throws — the unlock above is the
 * fulfillment; a notice that cannot be sent is logged, never a failed
 * webhook.
 */
export type PayerEmailSender = (input: {
  clientId: string;
  email: string;
  fetchImpl?: typeof fetch;
}) => Promise<void>;

async function sendPayerEmailByDefault(input: {
  clientId: string;
  email: string;
  fetchImpl?: typeof fetch;
}): Promise<void> {
  // Dynamic imports, the same discipline as the stores above: these modules
  // only ever load inside the handler that needs them.
  const tokens = await import("../client-portal/tokens");
  const record = (await tokens.readClientStore()).find((c) => c.id === input.clientId) ?? null;
  if (!record) {
    // Constant message: never quote the payer address into a log.
    console.error("[billing] payer email: client not in the store");
    return;
  }
  const delivery = await import("../client-portal/magic-link-email");
  const result = await delivery.deliverMagicLinkEmail(
    {
      clientName: record.name,
      to: input.email,
      clientUrl: delivery.clientUrlForToken(record.token),
    },
    input.fetchImpl ? { fetchImpl: input.fetchImpl } : {},
  );
  if (!result.ok) {
    console.error(`[billing] payer email not sent: ${result.reason}`);
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
  const email = sessionEmail(session);

  // US-009: link the payer to a Clerk account before the release,
  // best-effort at every layer — the provisioner itself answers null on
  // any failure, and even a throwing seam must not gate the unlock. The
  // dynamic import keeps the module that names CLERK_SECRET_KEY away from
  // every bundler that walks this file from the route, the same discipline
  // the Supabase read in `releasePaidAccess` follows.
  let clerkUserId: string | null = null;
  if (email) {
    try {
      if (deps.provisionClerkUser) {
        clerkUserId = (await deps.provisionClerkUser(email)) ?? null;
      } else {
        const provisioning = await import("./clerk-provision");
        const provisioned = await provisioning.provisionClerkUserForEmail({
          email,
          fetchImpl: deps.fetchImpl,
          clerkSecretKey: deps.clerkSecretKey,
        });
        clerkUserId = provisioned?.clerkUserId ?? null;
      }
    } catch {
      // Constant message: provider errors can quote the email.
      console.error("[billing] clerk provisioning seam failed");
      clerkUserId = null;
    }
  }

  const release = deps.releasePaidAccess ?? ((args) => releasePaidAccess(args, deps));
  await release({
    clientId,
    stripeCustomerId: customer,
    stripeSessionId: session.id,
    email,
    clerkUserId,
  });
  // The payer's copy of the sale. The release above is the fulfillment;
  // this notice is best-effort at every layer — a provider outage must
  // never turn a completed sale into a Stripe retry loop, so a throwing
  // seam is logged and swallowed, exactly like provisioning above.
  if (email) {
    try {
      const sendPayerEmail = deps.sendPayerEmail ?? sendPayerEmailByDefault;
      await sendPayerEmail({ clientId, email, fetchImpl: deps.fetchImpl });
    } catch {
      console.error("[billing] payer email seam failed");
    }
  }
  return { handled: true, action: "released", clientId };
}

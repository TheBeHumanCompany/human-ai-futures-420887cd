import { createFileRoute } from "@tanstack/react-router";

import { createElementsCheckoutSession } from "@/lib/billing/audit-checkout";
import {
  StripeApiError,
  stripeConfigFromEnv,
  type StripeClientConfig,
} from "@/lib/billing/stripe-client";
import { fetchClientPageByTokenFn, type ClientRecord } from "@/lib/client-portal/tokens";
import type { SupabasePaidReport, SupabaseTokenConfig } from "@/lib/client-portal/supabase-tokens";
import type { PortalEngagement } from "@/lib/client-portal/portal-blueprint";

/**
 * The checkout-initiation endpoint (funnel todo 2): one POST turns an
 * identity into a Stripe elements-mode `client_secret`, which the checkout
 * surface (todo 7) feeds to the embedded Payment Element.
 *
 * Two identities, one denial. Token identity (a body carrying `token`) is
 * the entire grant exactly as at `/c/<token>`. Session identity (`{}` or
 * `{source:"portal"}`, the portal's pay button) resolves the signed-in
 * Clerk user's engagement server-side — the body never names a client id,
 * and the email comes from the Clerk account, so no token leaves the
 * server. Both paths collapse unknown/absent identities into the same
 * denial below, so a probe learns nothing it did not already have.
 *
 * Statuses follow the webhook route's semantics discipline: 4xx for states
 * a retry cannot change, 5xx only where a retry can heal. A Stripe failure
 * is 502 and typed — the provider's own error body never travels onward.
 * Neither the token nor any `client_secret` is ever logged.
 *
 * The route file is a thin shell over `handleAuditCheckout`, the webhook
 * pattern: every branch of the guard matrix runs under `bun test` with
 * injected seams and zero network.
 */

export const PRICE_ENV = "STRIPE_AUDIT_PRICE_ID";

/**
 * The funnel-fixture fallback for the checkout's immutable `customer_email`.
 *
 * Records may carry their own contact `email` (`ClientRecord`), which is
 * what token checkout charges in production; session identity reads the
 * Clerk account's primary address. This env stays for fixture clients with
 * no record email — the same value the seed logs as the fixture contact and
 * the preflight (todo 4) asserts. Production never sets it.
 */
export const CLIENT_EMAIL_ENV = "FUNNEL_TEST_EMAIL";

const DENIAL_MESSAGE = "This link is not valid";

/** Same base the provisioning module uses for its raw Clerk REST calls. */
const CLERK_API_BASE = "https://api.clerk.com/v1";
const CLERK_EMAIL_TIMEOUT_MS = 10_000;

/**
 * The signed-in user's email, read server-side so the portal's pay button
 * never carries a token: primary address if set, else the first address on
 * the account. REST (not `clerkClient()`) matches the provisioning module's
 * style and goes through the injectable `fetchImpl`, so the guard matrix
 * stays network-free.
 */
async function clerkEmailForUser(
  userId: string,
  env: Record<string, string | undefined>,
  fetchImpl: typeof fetch,
): Promise<string | null> {
  const secret = env["CLERK_SECRET_KEY"]?.trim();
  if (!secret) return null;
  try {
    const response = await fetchImpl(`${CLERK_API_BASE}/users/${encodeURIComponent(userId)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(CLERK_EMAIL_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`clerk user lookup answered ${response.status}`);
    }
    return primaryEmailFromClerkUser(await response.json());
  } catch (error) {
    console.error(
      `[billing] clerk email lookup failed: ${error instanceof Error ? error.message : error}`,
    );
    return null;
  }
}

function primaryEmailFromClerkUser(user: unknown): string | null {
  if (typeof user !== "object" || user === null) return null;
  const record = user as Record<string, unknown>;
  const primaryId =
    typeof record["primary_email_address_id"] === "string"
      ? record["primary_email_address_id"]
      : null;
  const addresses = Array.isArray(record["email_addresses"]) ? record["email_addresses"] : [];
  const parsed: { id: string; email: string }[] = [];
  for (const entry of addresses) {
    if (typeof entry !== "object" || entry === null) continue;
    const shape = entry as Record<string, unknown>;
    if (typeof shape["id"] === "string" && typeof shape["email_address"] === "string") {
      parsed.push({ id: shape["id"], email: shape["email_address"] });
    }
  }
  const primary = primaryId ? parsed.find((a) => a.id === primaryId) : undefined;
  return (primary ?? parsed[0])?.email ?? null;
}

export interface AuditCheckoutDeps {
  /** Reaches the token lookup, the unlock read, and the Stripe call. */
  fetchImpl?: typeof fetch;
  /** Explicit Supabase tier; `undefined` reads the deploy environment. */
  supabaseConfig?: SupabaseTokenConfig | null;
  /** Fixture store override, passed straight through to the token lookup. */
  readStore?: () => Promise<ClientRecord[]>;
  /** Explicit Stripe tier; `undefined` reads `STRIPE_SECRET_KEY`. */
  stripeConfig?: StripeClientConfig | null;
  /** Overrides `STRIPE_AUDIT_PRICE_ID` (tests). */
  priceId?: string;
  /** Overrides `CLIENT_EMAIL_ENV` (tests), and the Clerk lookup (tests). */
  email?: string;
  /** Environment read; defaults to `process.env`. */
  env?: Record<string, string | undefined>;
  /**
   * Session identity seam. Present (`string | null`) short-circuits `auth()`
   * so every guard row runs network-free; `undefined` resolves the signed-in
   * Clerk user inside the handler.
   */
  userId?: string | null;
  /** Overrides `clientIdForClerkUser` (tests). */
  clientIdForUser?: (userId: string) => Promise<PortalEngagement | null>;
  /** Overrides the Clerk REST email lookup (tests). */
  clerkEmail?: (userId: string) => Promise<string | null>;
}

/**
 * Who the POST says it is. A body carrying a `token` key → token identity
 * (the `/c/<token>` path); an object without one (`{}`, `{source:"portal"}`)
 * → session identity (the portal path); an unparseable body → token identity
 * with a null token, which the denial below refuses exactly as before.
 */
async function readIdentity(
  request: Request,
): Promise<{ kind: "token"; token: unknown } | { kind: "session" }> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { kind: "token", token: null };
  }
  if (typeof body !== "object" || body === null) return { kind: "token", token: null };
  const record = body as Record<string, unknown>;
  if ("token" in record) return { kind: "token", token: record["token"] };
  return { kind: "session" };
}

/** The `/c/$token` denial, as JSON: one phrase, no client content. */
const denied = (): Response => Response.json({ error: DENIAL_MESSAGE }, { status: 404 });

const alreadyPaid = (): Response =>
  Response.json(
    {
      error: "This audit is already paid.",
      hint: "Check your email for your portal link, or sign in to your portal to read the final report.",
    },
    { status: 409 },
  );

const checkoutUnavailable = (): Response =>
  Response.json(
    { error: "Checkout could not be initialized. Please try again shortly." },
    { status: 502 },
  );

const misconfigured = (): Response =>
  Response.json({ error: "Checkout is not available right now." }, { status: 500 });

export async function handleAuditCheckout(
  request: Request,
  deps: AuditCheckoutDeps = {},
): Promise<Response> {
  const env = deps.env ?? process.env;
  // Dynamic import, mirroring `releasePaidAccess`: the module names the
  // service-role env var, so it must not sit on a static import edge a
  // bundler can walk. Loaded here, it only ever executes in the handler.
  const portalStore = await import("@/lib/client-portal/supabase-tokens");
  const supabase =
    deps.supabaseConfig === undefined
      ? portalStore.supabaseConfigFromEnv(env)
      : deps.supabaseConfig;

  // The one identity check, per path. Token: unknown, malformed, oversized,
  // and absent tokens all collapse into the same `null`. Session: a signed-in
  // Clerk user resolves to their current engagement server-side — the browser
  // never names a client id. Both failures return the same denial, so neither
  // path becomes a validity oracle.
  const identity = await readIdentity(request);
  let clientId: string | null = null;
  let sessionUserId: string | null = null;
  let tokenRecordEmail: string | null = null;
  if (identity.kind === "token") {
    const page =
      typeof identity.token === "string"
        ? await fetchClientPageByTokenFn(identity.token, {
            fetchImpl: deps.fetchImpl,
            supabaseConfig: supabase,
            readStore: deps.readStore,
          })
        : null;
    clientId = page?.id ?? null;
    tokenRecordEmail = typeof page?.email === "string" ? page.email : null;
  } else {
    if (deps.userId !== undefined) {
      sessionUserId = deps.userId;
    } else {
      // Dynamic import, the same discipline as the store above: the Clerk
      // server module only ever executes inside the handler.
      const { auth } = await import("@clerk/tanstack-react-start/server");
      sessionUserId = (await auth()).userId ?? null;
    }
    if (sessionUserId) {
      const engagement = deps.clientIdForUser
        ? await deps.clientIdForUser(sessionUserId)
        : supabase
          ? await (
              await import("@/lib/client-portal/portal-blueprint")
            ).clientIdForClerkUser(sessionUserId, supabase, deps.fetchImpl)
          : null;
      clientId = engagement?.clientId ?? null;
    }
  }
  if (!clientId) return denied();

  // The replay guard, reading the same row the webhook upserts. A read
  // failure fails closed: a blip must never open a second charge.
  if (supabase) {
    let paid: SupabasePaidReport | null;
    try {
      paid = await portalStore.fetchPaidReport(clientId, supabase, deps.fetchImpl ?? fetch);
    } catch (error) {
      console.error(
        `[billing] unlock check failed: ${error instanceof Error ? error.message : error}`,
      );
      return checkoutUnavailable();
    }
    if (paid?.unlocked) return alreadyPaid();
  }

  // Email precedence: explicit seam → the identity's own source — the
  // record's contact email for token checkout (`/c/<token>` has no session),
  // the Clerk primary email for session checkout — → the funnel env. The env
  // is last so fixture clients without a record email keep working under
  // FUNNEL_TEST_EMAIL while production records never depend on it.
  let email = (deps.email ?? "").trim();
  if (!email && identity.kind === "token" && tokenRecordEmail) {
    email = tokenRecordEmail.trim();
  }
  if (!email && identity.kind === "session" && sessionUserId) {
    email =
      (
        await (deps.clerkEmail
          ? deps.clerkEmail(sessionUserId)
          : clerkEmailForUser(sessionUserId, env, deps.fetchImpl ?? fetch))
      )?.trim() ?? "";
  }
  if (!email) email = (env[CLIENT_EMAIL_ENV] ?? "").trim();
  if (!email) {
    return Response.json(
      { error: "This client record has no contact email, so checkout cannot be initialized." },
      { status: 400 },
    );
  }

  const priceId = (deps.priceId ?? env[PRICE_ENV] ?? "").trim();
  if (!priceId) {
    console.error(`[billing] ${PRICE_ENV} is not set`);
    return misconfigured();
  }

  const stripe = deps.stripeConfig === undefined ? stripeConfigFromEnv(env) : deps.stripeConfig;
  if (!stripe) {
    console.error("[billing] STRIPE_SECRET_KEY is not set");
    return misconfigured();
  }

  try {
    const session = await createElementsCheckoutSession(
      { clientId, priceId, customerEmail: email },
      { config: stripe, fetchImpl: deps.fetchImpl },
    );
    return Response.json({ clientSecret: session.client_secret });
  } catch (error) {
    if (error instanceof StripeApiError) {
      // Status and code only: the provider's message never travels onward.
      console.error(
        `[billing] elements session rejected: status ${error.status} code ${error.stripeCode ?? "none"}`,
      );
    } else {
      console.error("[billing] elements session could not be created");
    }
    return checkoutUnavailable();
  }
}

export const Route = createFileRoute("/api/audit-checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => handleAuditCheckout(request),
    },
  },
});

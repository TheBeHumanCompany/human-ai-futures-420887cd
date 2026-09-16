import { createFileRoute } from "@tanstack/react-router";

import { createElementsCheckoutSession } from "@/lib/billing/audit-checkout";
import {
  StripeApiError,
  stripeConfigFromEnv,
  type StripeClientConfig,
} from "@/lib/billing/stripe-client";
import { fetchClientPageByTokenFn, type ClientRecord } from "@/lib/client-portal/tokens";
import type { SupabaseTokenConfig } from "@/lib/client-portal/supabase-tokens";

/**
 * The public checkout-initiation endpoint (funnel todo 2): one POST turns a
 * prospect token into a Stripe elements-mode `client_secret`, which the
 * checkout surface (todo 7) feeds to the embedded Payment Element.
 *
 * The token is the entire grant, exactly as at `/c/$token`: the body carries
 * NOTHING else — never a raw `client_id`, which would make client pages
 * enumerable. The lookup deliberately cannot distinguish an unknown token
 * from a malformed one, and every denial below answers with the page route's
 * own phrase, so a probe learns nothing it did not already have.
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
 * Where the checkout's immutable `customer_email` comes from today.
 *
 * No store carries a client email yet (the shipped content store and the
 * Supabase tables have no column), so the route resolves it from the
 * funnel tier's env — the same value the seed logs as the fixture contact
 * and the preflight (todo 4) asserts. Production deploys never set it, so
 * real clients honestly 400 until email lands in the client record; the
 * `email` dep below is the seam that swap will fill.
 */
export const CLIENT_EMAIL_ENV = "FUNNEL_TEST_EMAIL";

const DENIAL_MESSAGE = "This link is not valid";

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
  /** Overrides `CLIENT_EMAIL_ENV` (tests). */
  email?: string;
  /** Environment read; defaults to `process.env`. */
  env?: Record<string, string | undefined>;
}

async function readToken(request: Request): Promise<unknown> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return null;
  }
  if (typeof body !== "object" || body === null) return null;
  return (body as Record<string, unknown>)["token"];
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

  // The one identity check. Unknown, malformed, oversized, and absent
  // tokens all collapse into the same `null` and the same denial below —
  // a distinct "bad format" answer would be a validity oracle.
  const token = await readToken(request);
  const page =
    typeof token === "string"
      ? await fetchClientPageByTokenFn(token, {
          fetchImpl: deps.fetchImpl,
          supabaseConfig: supabase,
          readStore: deps.readStore,
        })
      : null;
  if (!page) return denied();

  // The replay guard, reading the same row the webhook upserts. A read
  // failure fails closed: a blip must never open a second charge.
  if (supabase) {
    let paid: Awaited<ReturnType<typeof portalStore.fetchPaidReport>>;
    try {
      paid = await portalStore.fetchPaidReport(page.id, supabase, deps.fetchImpl ?? fetch);
    } catch (error) {
      console.error(
        `[billing] unlock check failed: ${error instanceof Error ? error.message : error}`,
      );
      return checkoutUnavailable();
    }
    if (paid?.unlocked) return alreadyPaid();
  }

  const email = (deps.email ?? env[CLIENT_EMAIL_ENV] ?? "").trim();
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
      { clientId: page.id, priceId, customerEmail: email },
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

/**
 * Stripe REST over `fetch`, no SDK.
 *
 * Two reasons, both load-bearing. The deploy target is Cloudflare Workers
 * (`nitro` preset `cloudflare-module`), where the Resend path in
 * `lib/contact.ts` already established the idiom: one HTTPS POST, no SDK, no
 * build step. And the blueprint mandates the Managed Payments preview
 * (`stripe-version: 2026-02-25.preview` with `managed_payments[enabled]` on
 * session create), which needs an exact per-request version header — a raw
 * header here rather than a client pinned to a preview.
 *
 * Server-only. The secret key must never reach the client bundle: this module
 * is imported by server functions, the webhook route, and operator scripts,
 * never by a route component.
 */

export const STRIPE_API_BASE = "https://api.stripe.com";

/**
 * Blueprint-mandated preview version for Managed Payments calls.
 *
 * A preview, not a stable release: Stripe may change or withdraw it. It is
 * isolated to this constant and sent only on the calls the blueprint names
 * (product create, checkout session create). If those calls ever start
 * failing with version errors, the fallback is the same calls without this
 * header and without `managed_payments` — standard Checkout, no preview.
 */
export const STRIPE_PREVIEW_VERSION = "2026-02-25.preview";

/**
 * Empirically required for `ui_mode=elements` sessions
 * (test-results/elements-contract.md, 2026-09-15): the preview header rejects
 * elements with "you must upgrade to Stripe API version 2026-03-25.dahlia".
 * Sent ONLY by the elements-session create; the preview version above still
 * governs every other call.
 */
export const STRIPE_ELEMENTS_VERSION = "2026-08-26.dahlia";

export interface StripeClientConfig {
  secretKey: string;
}

/**
 * Totally unconfigured without a key: every caller fails loudly instead of
 * producing an unauthenticated request that Stripe answers 401.
 */
export function stripeConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): StripeClientConfig | null {
  const secretKey = env["STRIPE_SECRET_KEY"];
  return secretKey ? { secretKey } : null;
}

export interface StripeApiDeps {
  fetchImpl?: typeof fetch;
  /** Overrides the default `STRIPE_PREVIEW_VERSION` header for this call only. */
  apiVersion?: string;
}

export class StripeApiError extends Error {
  readonly status: number;
  readonly stripeCode: string | null;
  constructor(status: number, stripeCode: string | null, message: string) {
    super(`[billing] stripe ${status}${stripeCode ? ` ${stripeCode}` : ""}: ${message}`);
    this.name = "StripeApiError";
    this.status = status;
    this.stripeCode = stripeCode;
  }
}

/**
 * One Stripe REST call. Params are form-encoded (`a[b]=c` nesting supported
 * by passing pre-flattened keys, matching `curl --data-urlencode`).
 */
export async function stripeApi<T>(
  path: string,
  params: Record<string, string>,
  config: StripeClientConfig,
  deps: StripeApiDeps = {},
): Promise<T> {
  const body = new URLSearchParams(params).toString();
  const response = await (deps.fetchImpl ?? fetch)(`${STRIPE_API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${config.secretKey}:`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": deps.apiVersion ?? STRIPE_PREVIEW_VERSION,
    },
    body,
  });
  const data = (await response.json()) as {
    error?: { code?: string; message?: string };
  } & T;
  if (!response.ok || data.error) {
    throw new StripeApiError(
      response.status,
      data.error?.code ?? null,
      data.error?.message ?? "unknown stripe error",
    );
  }
  return data;
}

/**
 * The GET twin of `stripeApi` — same auth, same version-header discipline,
 * no form body. Elements sessions are created under the dahlia pin
 * (`STRIPE_ELEMENTS_VERSION`), so reads of those sessions go out under the
 * same version (test-results/elements-contract.md, 2026-09-15); callers
 * reading preview-era objects pass no override and get the preview pin.
 */
export async function stripeApiGet<T>(
  path: string,
  config: StripeClientConfig,
  deps: StripeApiDeps = {},
): Promise<T> {
  const response = await (deps.fetchImpl ?? fetch)(`${STRIPE_API_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Basic ${btoa(`${config.secretKey}:`)}`,
      "Stripe-Version": deps.apiVersion ?? STRIPE_PREVIEW_VERSION,
    },
  });
  const data = (await response.json()) as {
    error?: { code?: string; message?: string };
  } & T;
  if (!response.ok || data.error) {
    throw new StripeApiError(
      response.status,
      data.error?.code ?? null,
      data.error?.message ?? "unknown stripe error",
    );
  }
  return data;
}

export interface RetrieveSessionDeps extends StripeApiDeps {
  /** Explicit Stripe tier; `undefined` reads `STRIPE_SECRET_KEY`. */
  config?: StripeClientConfig | null;
}

/**
 * The fields of a retrieved Checkout Session this repo consumes
 * (`GET /v1/checkout/sessions/{id}`) — and nothing else.
 *
 * The retrieve response also carries a `client_secret`. It is deliberately
 * absent from this projection: a session read must never re-surface the
 * confirmation secret, so it cannot leak through a return page by accident.
 */
export interface StripeCheckoutSession {
  id: string;
  /** `"open" | "complete" | "expired"` per the verified session contract. */
  status: string | null;
  payment_status: string | null;
  customer_email: string | null;
  amount_total: number | null;
  currency: string | null;
}

/**
 * Retrieve one Checkout Session. Elements-mode sessions (the audit funnel)
 * are read under the same dahlia pin they were created with.
 */
export async function retrieveCheckoutSession(
  sessionId: string,
  deps: RetrieveSessionDeps = {},
): Promise<StripeCheckoutSession> {
  const config = deps.config === undefined ? stripeConfigFromEnv() : deps.config;
  if (!config) throw new Error("[billing] STRIPE_SECRET_KEY is not set");
  const raw = await stripeApiGet<Record<string, unknown>>(
    `/v1/checkout/sessions/${encodeURIComponent(sessionId)}`,
    config,
    { ...deps, apiVersion: deps.apiVersion ?? STRIPE_ELEMENTS_VERSION },
  );
  const str = (key: string): string | null =>
    typeof raw[key] === "string" ? (raw[key] as string) : null;
  return {
    id: str("id") ?? sessionId,
    status: str("status"),
    payment_status: str("payment_status"),
    customer_email: str("customer_email"),
    amount_total: typeof raw["amount_total"] === "number" ? (raw["amount_total"] as number) : null,
    currency: str("currency"),
  };
}

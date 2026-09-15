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
      "Stripe-Version": STRIPE_PREVIEW_VERSION,
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

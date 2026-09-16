import { PORTAL_ORIGIN } from "../surface";
import {
  STRIPE_ELEMENTS_VERSION,
  stripeApi,
  stripeConfigFromEnv,
  type StripeApiDeps,
  type StripeClientConfig,
} from "./stripe-client";

/**
 * The audit-fee checkout (US-010): one fixed-price, one-time payment whose
 * fulfillment unlocks the client's paid reports on their existing magic link.
 *
 * The amount is never in code. The Price object holds it; the Price id comes
 * from `STRIPE_AUDIT_PRICE_ID`. A missing id fails loudly rather than
 * charging an assumed amount — inventing money is the one error here that
 * cannot be diffed away later.
 *
 * Canonical origin defaults to a constant (the `.env.example` essay on the
 * canonical origin applies: a preview deploy minting checkout return links on
 * another host is the same failure class as episode URLs). `AUDIT_ORIGIN` is
 * an explicit local-funnel affordance, not an implicit preview-host choice.
 */
export const AUDIT_ORIGIN = PORTAL_ORIGIN;

export const auditSuccessUrl = (origin: string = process.env.AUDIT_ORIGIN ?? AUDIT_ORIGIN) =>
  `${origin}/audit/success?session_id={CHECKOUT_SESSION_ID}`;

export const auditCancelUrl = (origin: string = process.env.AUDIT_ORIGIN ?? AUDIT_ORIGIN) =>
  `${origin}/audit/cancelled`;

export interface AuditCheckoutInput {
  /** Portal client id, carried through as metadata so fulfillment can map back. */
  clientId: string;
  /** Test-mode Price id for the audit fee, e.g. `price_…`. */
  priceId: string;
}

export interface AuditCheckoutDeps extends StripeApiDeps {
  config?: StripeClientConfig | null;
  /** Override for tests; production uses 8 cryptographically random letters. */
  integrationSuffix?: string;
}

export interface AuditCheckoutSession {
  id: string;
  url: string;
}

const SUFFIX_ALPHABET = "abcdefghijklmnopqrstuvwxyz";

function randomSuffix(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => SUFFIX_ALPHABET[b % SUFFIX_ALPHABET.length]).join("");
}

/**
 * Flat params for `POST /v1/checkout/sessions` (blueprint step 2, adapted).
 *
 * Deliberately no `payment_method_types`: omitting it enables dynamic
 * payment methods (best-practices ref), which is what puts Interac beside
 * cards for Canadian buyers with no code change. `integration_identifier`
 * tags the flow for Dashboard comparison (PRD US-010).
 */
export function auditCheckoutParams(
  input: AuditCheckoutInput,
  integrationSuffix: string,
): Record<string, string> {
  if (!input.clientId) throw new Error("[billing] audit checkout needs a client id");
  if (!input.priceId) throw new Error("[billing] audit checkout needs a price id");
  return {
    mode: "payment",
    "line_items[0][price]": input.priceId,
    "line_items[0][quantity]": "1",
    success_url: auditSuccessUrl(),
    cancel_url: auditCancelUrl(),
    "managed_payments[enabled]": "true",
    integration_identifier: `portal-audit-${integrationSuffix}`,
    "metadata[client_id]": input.clientId,
  };
}

export async function createAuditCheckoutSession(
  input: AuditCheckoutInput,
  deps: AuditCheckoutDeps = {},
): Promise<AuditCheckoutSession> {
  const config = deps.config === undefined ? stripeConfigFromEnv() : deps.config;
  if (!config) throw new Error("[billing] STRIPE_SECRET_KEY is not set");
  const params = auditCheckoutParams(input, deps.integrationSuffix ?? randomSuffix());
  const session = await stripeApi<{ id: string; url: string | null }>(
    "/v1/checkout/sessions",
    params,
    config,
    deps,
  );
  if (!session.url) {
    throw new Error("[billing] checkout session created without a url");
  }
  return { id: session.id, url: session.url };
}

export interface ElementsCheckoutInput {
  /** Portal client id, carried through as metadata so fulfillment can map back. */
  clientId: string;
  /** Test-mode Price id for the audit fee, e.g. `price_…`. */
  priceId: string;
  /** Immutable prefill on the Payment Element — no email input needed on-page. */
  customerEmail: string;
}

/**
 * Flat params for the elements-mode variant of `POST /v1/checkout/sessions`
 * (funnel todo 1): the client confirms on OUR origin with a `client_secret`
 * instead of being redirected to Stripe-hosted pages. Hence `ui_mode=elements`
 * + a single `return_url` — `success_url`/`cancel_url` are link-mode-only and
 * Stripe rejects them here. Empirically pinned
 * (test-results/elements-contract.md, 2026-09-15): managed payments only
 * supports hosted/embedded, so it is sent explicitly `false` (the account has
 * it default-on; omitting the param 400s), and `automatic_tax` is omitted —
 * test mode rejects it pending a dashboard head-office address, so elements
 * sessions currently carry `automatic_tax.enabled=false`.
 */
export function elementsCheckoutParams(
  input: ElementsCheckoutInput,
  integrationSuffix: string,
): Record<string, string> {
  if (!input.clientId) throw new Error("[billing] elements checkout needs a client id");
  if (!input.priceId) throw new Error("[billing] elements checkout needs a price id");
  if (!input.customerEmail) throw new Error("[billing] elements checkout needs a customer email");
  return {
    mode: "payment",
    ui_mode: "elements",
    "line_items[0][price]": input.priceId,
    "line_items[0][quantity]": "1",
    return_url: auditSuccessUrl(),
    customer_email: input.customerEmail,
    client_reference_id: input.clientId,
    "managed_payments[enabled]": "false",
    integration_identifier: `portal-audit-${integrationSuffix}`,
    "metadata[client_id]": input.clientId,
  };
}

export interface ElementsCheckoutSession {
  id: string;
  /** Never leaves the server except to the checkout-init route (todo 2); never logged. */
  client_secret: string;
}

export async function createElementsCheckoutSession(
  input: ElementsCheckoutInput,
  deps: AuditCheckoutDeps = {},
): Promise<ElementsCheckoutSession> {
  const config = deps.config === undefined ? stripeConfigFromEnv() : deps.config;
  if (!config) throw new Error("[billing] STRIPE_SECRET_KEY is not set");
  const params = elementsCheckoutParams(input, deps.integrationSuffix ?? randomSuffix());
  const session = await stripeApi<{ id: string; client_secret: string | null }>(
    "/v1/checkout/sessions",
    params,
    config,
    { ...deps, apiVersion: STRIPE_ELEMENTS_VERSION },
  );
  if (!session.client_secret) {
    throw new Error("[billing] elements session created without a client_secret");
  }
  return { id: session.id, client_secret: session.client_secret };
}

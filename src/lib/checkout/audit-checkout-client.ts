import { createServerFn } from "@tanstack/react-start";

/**
 * The checkout client (funnel todo 7): everything the browser needs to turn
 * a prospect token into a live Payment Element — nothing more.
 *
 * The transport speaks only to the public init route (`/api/audit-checkout`,
 * todo 2) with a body carrying only the token — the route is the sole grant
 * checker, and a client that sent anything else would be a second identity
 * path. Every answer parses into a closed union here, at the boundary, so
 * the panel component never sees a raw Response or an unexpected shape.
 *
 * The confirm seam wraps the Stripe checkout object's `confirm()` in a
 * structural type of our own: the SDK's richer result is assignable to it,
 * and if Stripe ever reshapes the answer, `tsc` fails at the wiring in the
 * panel rather than at runtime inside an iframe. Stripe.js itself is never
 * bundled — `loadStripe` (called in the panel) script-injects it from
 * js.stripe.com at runtime.
 */

export const CHECKOUT_INIT_ROUTE = "/api/audit-checkout";

/** The parsed answer from the init route. */
export type CheckoutInitState =
  | { status: "ready"; clientSecret: string }
  /** 404 — unknown or malformed token, the `/c/$token` denial as JSON. */
  | { status: "invalid" }
  /** 409 — already unlocked; the prospect should sign in instead. */
  | { status: "paid" }
  /** 400 — the client record has no contact email; checkout cannot start. */
  | { status: "no-email" }
  /** 500/502, malformed body, or network failure — retry can heal. */
  | { status: "unavailable" };

/** The panel's full state: the init answer plus the client-side key. */
export type PanelState =
  | { kind: "ready"; clientSecret: string; publishableKey: string }
  | { kind: "invalid" }
  | { kind: "paid" }
  | { kind: "no-email" }
  | { kind: "unavailable" };

interface CheckoutDeps {
  fetchImpl?: typeof fetch;
}

function clientSecretFrom(body: unknown): string | null {
  if (typeof body !== "object" || body === null) return null;
  const secret = (body as Record<string, unknown>)["clientSecret"];
  return typeof secret === "string" && secret.length > 0 ? secret : null;
}

export async function requestCheckoutSession({
  token,
  fetchImpl = fetch,
}: { token: string } & CheckoutDeps): Promise<CheckoutInitState> {
  let response: Response;
  try {
    response = await fetchImpl(CHECKOUT_INIT_ROUTE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
  } catch {
    return { status: "unavailable" };
  }

  if (response.status === 404) return { status: "invalid" };
  if (response.status === 409) return { status: "paid" };
  if (response.status === 400) return { status: "no-email" };
  if (response.status !== 200) return { status: "unavailable" };

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { status: "unavailable" };
  }
  const clientSecret = clientSecretFrom(body);
  return clientSecret ? { status: "ready", clientSecret } : { status: "unavailable" };
}

export async function resolveCheckoutPanel({
  token,
  publishableKey,
  fetchImpl,
}: {
  token: string;
  /** Empty (env unset) keeps the panel unavailable: Stripe cannot init. */
  publishableKey: string;
} & CheckoutDeps): Promise<PanelState> {
  const state = await requestCheckoutSession({ token, fetchImpl });
  switch (state.status) {
    case "ready":
      return publishableKey
        ? { kind: "ready", clientSecret: state.clientSecret, publishableKey }
        : { kind: "unavailable" };
    case "invalid":
      return { kind: "invalid" };
    case "paid":
      return { kind: "paid" };
    case "no-email":
      return { kind: "no-email" };
    case "unavailable":
      return { kind: "unavailable" };
  }
}

/**
 * The publishable key, read server-side. `STRIPE_PUBLISHABLE_KEY` has no
 * VITE_ prefix (it is not a build-time injection in this repo), so a server
 * function is the one seam that hands it to the browser — the same shape as
 * `fetchClientPageByToken`. Publishable keys are client-safe by design.
 */
export const fetchStripePublishableKey = createServerFn({ method: "GET" }).handler(() =>
  (process.env.STRIPE_PUBLISHABLE_KEY ?? "").trim(),
);

/**
 * The confirm seam. `code: "paymentFailed"` is the declined-card answer
 * (test card `4000 0000 0000 9995` arrives exactly so); any other error is
 * a form or network failure the buyer can retry.
 */
export type CheckoutConfirmResult =
  | { type: "success" }
  | {
      type: "error";
      error: {
        message: string;
        code: string | null;
        paymentFailed?: { declineCode: string | null };
      };
    };

export type CheckoutConfirm = () => Promise<CheckoutConfirmResult>;

export type ConfirmOutcome =
  /** Stripe navigates the browser to the session's return_url. */
  | { kind: "redirected" }
  /** The card was declined; `message` renders inline, no redirect. */
  | { kind: "declined"; message: string }
  | { kind: "failed"; message: string };

export const DECLINE_MESSAGE =
  "Your card was declined. Try another card, or contact us and we will send a payment link.";

export const FAILED_MESSAGE = "Payment could not be completed. Check the details and try again.";

export async function confirmAuditPayment(confirm: CheckoutConfirm): Promise<ConfirmOutcome> {
  const result = await confirm();
  if (result.type === "success") return { kind: "redirected" };
  if (result.error.code === "paymentFailed") {
    return { kind: "declined", message: DECLINE_MESSAGE };
  }
  return { kind: "failed", message: FAILED_MESSAGE };
}

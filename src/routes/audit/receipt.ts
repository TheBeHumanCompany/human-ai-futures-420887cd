import { createServerFn } from "@tanstack/react-start";

import {
  retrieveCheckoutSession,
  StripeApiError,
  type StripeClientConfig,
  type StripeCheckoutSession,
} from "@/lib/billing/stripe-client";

/**
 * The audit receipt's data layer (funnel todo 8).
 *
 * The return page reads one thing from Stripe — the session the checkout
 * created — and maps it to a closed union the page can render without
 * knowing Stripe exists. The mapping is the whole contract:
 *
 * - `status: "complete"` → the paid receipt (masked email, amount),
 * - anything else (`"open"`, `"expired"`) → the not-completed retry
 *   contract — the page must never show success for an unpaid session,
 * - Stripe 404 (tampered/unknown session id) → `unknown-session`,
 * - any other Stripe error or a transport failure → `unavailable`.
 *
 * Nothing here fulfills anything: no store read, no write, no unlock —
 * `checkout.session.completed` handled by the webhook is the ONLY path that
 * unlocks the paid reports, and a return page must never become a second
 * one. The Stripe secret key stays behind the server function; the route
 * component only ever sees the union below.
 */

export type AuditReceipt =
  | { kind: "paid"; emailMasked: string | null; amountLabel: string | null }
  | { kind: "incomplete" }
  | { kind: "unknown-session" }
  | { kind: "unavailable" };

/** `f***@example.com` — the receipt identifies the payer without naming them. */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "***";
  const domain = email.slice(at + 1);
  return domain ? `${email.slice(0, 1)}***@${domain}` : "***";
}

/** Cents plus a Stripe currency code → an unambiguous label. */
export function amountLabel(amountTotal: number | null, currency: string | null): string | null {
  if (amountTotal === null || !currency) return null;
  try {
    const formatted = new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amountTotal / 100);
    return `${formatted} ${currency.toUpperCase()}`;
  } catch {
    return null;
  }
}

export function auditReceiptFrom(session: StripeCheckoutSession): AuditReceipt {
  if (session.status === "complete") {
    return {
      kind: "paid",
      emailMasked: session.customer_email ? maskEmail(session.customer_email) : null,
      amountLabel: amountLabel(session.amount_total, session.currency),
    };
  }
  return { kind: "incomplete" };
}

export interface AuditReceiptDeps {
  fetchImpl?: typeof fetch;
  config?: StripeClientConfig | null;
}

/**
 * The id travels from a browser URL into the request path, so it must look
 * like a Stripe session id (`cs_test_…` / `cs_live_…`) before it is
 * interpolated anywhere. A malformed id answers the same unknown-session as
 * one Stripe does not know — a probe learns nothing.
 */
const SESSION_ID_PATTERN = /^cs_[A-Za-z0-9_]+$/;

export async function resolveAuditReceipt(
  sessionId: string,
  deps: AuditReceiptDeps = {},
): Promise<AuditReceipt> {
  if (!SESSION_ID_PATTERN.test(sessionId)) return { kind: "unknown-session" };
  let session: StripeCheckoutSession;
  try {
    session = await retrieveCheckoutSession(sessionId, deps);
  } catch (error) {
    if (error instanceof StripeApiError && error.status === 404) {
      return { kind: "unknown-session" };
    }
    console.error(
      `[billing] session retrieve failed: ${error instanceof Error ? error.message : error}`,
    );
    return { kind: "unavailable" };
  }
  return auditReceiptFrom(session);
}

/**
 * The loader's server function. The retrieve runs server-side only —
 * `STRIPE_SECRET_KEY` must never reach a client bundle — mirroring
 * `fetchClientPageByToken`'s wrapper-over-function shape.
 */
export const fetchAuditReceipt = createServerFn({ method: "GET" })
  .validator((input: unknown): { sessionId: string } => {
    if (typeof input !== "object" || input === null) {
      throw new Error("[audit] expected { sessionId }");
    }
    const sessionId = (input as { sessionId?: unknown }).sessionId;
    if (typeof sessionId !== "string" || sessionId.length === 0) {
      throw new Error("[audit] expected a non-empty sessionId");
    }
    return { sessionId };
  })
  .handler(({ data }) => resolveAuditReceipt(data.sessionId));

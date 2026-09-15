import { createFileRoute } from "@tanstack/react-router";

import {
  parseWebhookEvent,
  routeWebhookEvent,
  verifyStripeSignature,
} from "@/lib/billing/stripe-webhooks";

/**
 * Stripe fulfillment endpoint (US-011).
 *
 * Stripe retries anything that is not a 2xx, so statuses are chosen by
 * retry semantics, not by how bad the problem feels: 400 for a forged or
 * malformed delivery (retrying changes nothing), 200 for every verified
 * outcome including skips (an unpaid `completed` is a state, not an error),
 * 500 only when the handler itself threw — the one case a retry can heal.
 * Nothing here fulfills from a page: the Checkout success URL is a receipt,
 * and this handler is the sale.
 */
export const Route = createFileRoute("/api/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        if (!secret) {
          console.error("[billing] STRIPE_WEBHOOK_SECRET is not set");
          return new Response("misconfigured", { status: 500 });
        }
        // Raw text, never parsed JSON: the signature covers the exact bytes.
        const raw = await request.text();
        if (!(await verifyStripeSignature(raw, request.headers.get("stripe-signature"), secret))) {
          return new Response("bad signature", { status: 400 });
        }
        const event = parseWebhookEvent(raw);
        if (!event) return new Response("bad event", { status: 400 });
        try {
          return Response.json(await routeWebhookEvent(event));
        } catch (error) {
          console.error(
            `[billing] webhook handler failed: ${error instanceof Error ? error.message : error}`,
          );
          return new Response("handler failed", { status: 500 });
        }
      },
    },
  },
});

import { createFileRoute, redirect } from "@tanstack/react-router";

import { SITE_ORIGIN } from "@/lib/sanity/config";
import { fetchAuditReceipt } from "./receipt";

/**
 * The checkout return page (funnel todo 8): Stripe drops the browser here
 * from the Payment Element's `return_url` with `?session_id=…`.
 *
 * The page is a receipt, nothing more. It reads the session server-side
 * (secret key stays behind the server function) and renders one of four
 * states. It grants NOTHING — the webhook remains the only path that opens
 * the paid reports — so a forged, stale, or tampered return can show a
 * wrong receipt at worst and never hand over access.
 *
 * `noindex` is unconditional (like the portal and the client page): a
 * receipt for a transaction is nobody else's content, and the
 * missing-param branch redirects home before any Stripe call.
 */

export const Route = createFileRoute("/audit/success")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => {
    const value = search["session_id"];
    return typeof value === "string" && value.length > 0 ? { session_id: value } : {};
  },

  loader: async ({ location }) => {
    // The loader context carries the parsed location, not a typed search;
    // validateSearch has already run, so the one param we read is ours.
    const search = location.search as Partial<{ session_id: string }> | undefined;
    if (!search?.session_id) throw redirect({ to: "/portal" });
    return { receipt: await fetchAuditReceipt({ data: { sessionId: search.session_id } }) };
  },

  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData?.receipt.kind === "paid" ? "Payment received" : "Payment not completed",
      },
      { name: "robots", content: "noindex" },
    ],
  }),

  headers: (): Record<string, string> => ({
    "X-Robots-Tag": "noindex",
  }),

  component: AuditSuccessPage,
});

const RETRY_COPY =
  "Open the email with your personal blueprint link and try again from your own client page.";

function RetryHome() {
  // An absolute anchor to the marketing origin, not a same-host href: on the
  // portal host `/` would 302 to `/portal`, making "Back to the homepage"
  // observably wrong. The client-side guard in `__root.tsx` is the backstop.
  return (
    <a
      className="eyebrow mt-8 inline-block bg-ink px-7 py-4 text-cream"
      data-testid="audit-retry-link"
      href={SITE_ORIGIN}
    >
      Back to the homepage
    </a>
  );
}

function AuditSuccessPage() {
  const { receipt } = Route.useLoaderData();

  if (receipt.kind === "paid") {
    return (
      <section className="section-cream" data-testid="audit-success-receipt">
        <div className="mx-auto max-w-[720px] px-6 py-24 text-center sm:px-8">
          <p className="eyebrow">Audit receipt</p>
          <h1 className="type-h3-caps-light mt-3">Payment received</h1>
          {receipt.amountLabel && (
            <p className="mt-6 text-base leading-relaxed text-ink/80">
              We received your payment of {receipt.amountLabel}. Thank you.
            </p>
          )}
          {receipt.emailMasked && (
            <p className="mt-3 text-base leading-relaxed text-ink/80">
              A confirmation is on its way to {receipt.emailMasked}.
            </p>
          )}
          <p className="mt-3 text-base leading-relaxed text-ink/80">
            Your full blueprint will be waiting in your portal — check your email for your receipt,
            or sign in with the email you used at checkout.
          </p>
          <a
            className="eyebrow mt-8 inline-block rounded-full bg-lime px-7 py-4 text-ink hover:bg-cream"
            data-testid="audit-portal-link"
            href="/portal"
          >
            Sign in to your portal
          </a>
        </div>
      </section>
    );
  }

  if (receipt.kind === "incomplete") {
    return (
      <section className="section-cream" data-testid="audit-incomplete">
        <div className="mx-auto max-w-[720px] px-6 py-24 text-center sm:px-8">
          <p className="eyebrow">Audit receipt</p>
          <h1 className="type-h3-caps-light mt-3">Payment not completed</h1>
          <p className="mt-6 text-base leading-relaxed text-ink/80">
            Your card was not charged. {RETRY_COPY}
          </p>
          <RetryHome />
        </div>
      </section>
    );
  }

  if (receipt.kind === "unknown-session") {
    return (
      <section className="section-cream" data-testid="audit-unknown-session">
        <div className="mx-auto max-w-[720px] px-6 py-24 text-center sm:px-8">
          <p className="eyebrow">Audit receipt</p>
          <h1 className="type-h3-caps-light mt-3">This receipt is not valid</h1>
          <p className="mt-6 text-base leading-relaxed text-ink/80">
            We could not match this address to a payment. {RETRY_COPY}
          </p>
          <RetryHome />
        </div>
      </section>
    );
  }

  return (
    <section className="section-cream" data-testid="audit-unavailable">
      <div className="mx-auto max-w-[720px] px-6 py-24 text-center sm:px-8">
        <p className="eyebrow">Audit receipt</p>
        <h1 className="type-h3-caps-light mt-3">Receipt temporarily unavailable</h1>
        <p className="mt-6 text-base leading-relaxed text-ink/80">
          We could not confirm your payment just now. Refresh this page in a moment — the payment
          itself is unaffected.
        </p>
        <RetryHome />
      </div>
    </section>
  );
}

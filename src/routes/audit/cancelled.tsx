import { createFileRoute } from "@tanstack/react-router";

/**
 * The cancelled-checkout receipt (funnel todo 8).
 *
 * Static by construction: the buyer chose to abandon checkout, so the page
 * reads nothing from the URL, talks to nothing, and owes them exactly two
 * things — confirmation that no charge was made, and the way back. The
 * buyer's own client page (where retry happens) is reachable only through
 * their email link, which this page deliberately does not carry a token for.
 */

export const Route = createFileRoute("/audit/cancelled")({
  head: () => ({
    meta: [{ title: "Checkout cancelled" }, { name: "robots", content: "noindex" }],
  }),

  headers: (): Record<string, string> => ({
    "X-Robots-Tag": "noindex",
  }),

  component: AuditCancelledPage,
});

function AuditCancelledPage() {
  return (
    <section className="section-cream" data-testid="audit-cancelled-receipt">
      <div className="mx-auto max-w-[720px] px-6 py-24 text-center sm:px-8">
        <p className="eyebrow">Audit checkout</p>
        <h1 className="type-h3-caps-light mt-3">Checkout cancelled</h1>
        <p className="mt-6 text-base leading-relaxed text-ink/80">
          No charge was made. Your blueprint is waiting — open the email with your personal link
          whenever you are ready to continue.
        </p>
        <a
          className="eyebrow mt-8 inline-block bg-ink px-7 py-4 text-cream"
          data-testid="audit-retry-link"
          href="/"
        >
          Back to the homepage
        </a>
      </div>
    </section>
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BlueprintDocument } from "@/components/client-portal/blueprint/blueprint-document";
import { PrintButton } from "@/components/client-portal/blueprint/print-button";
import { CheckoutBand } from "@/components/client-portal/checkout/checkout-panel";
import { IntakeCard } from "@/components/client-portal/intake-card";
import { companyInitial, fetchPortalPage } from "@/lib/client-portal/portal";
import { BOOKING_URL_30MIN } from "@/lib/booking";

/**
 * The signed-in client portal (US-009).
 *
 * The loader's server function is the whole gate: an unsigned visitor is
 * redirected to sign-in before any data is fetched, and a signed-in
 * visitor reads exactly what RLS grants their Clerk token — this route
 * never holds a client id it could mistakenly share. Like `/c/$token`,
 * every state of this page is private, so `noindex` is unconditional
 * across branches rather than per-branch.
 */
export const Route = createFileRoute("/portal")({
  loader: async () => await fetchPortalPage(),

  head: () => ({
    meta: [{ title: "Your portal" }, { name: "robots", content: "noindex" }],
  }),

  headers: (): Record<string, string> => ({
    "X-Robots-Tag": "noindex",
  }),

  component: PortalPage,
});

function PortalPage() {
  const { reports, company, intake, blueprint } = Route.useLoaderData();

  // One current-report state, in this order — never two views of the same
  // blueprint. 1) A locked engagement renders the tiered preview (preliminary
  // bodies, locked final titles + teasers) plus the purchase band. 2) Paid or
  // degraded (blueprint read failed while the RLS read succeeded): the
  // reports articles — a paid client's report must never disappear because a
  // service-role read blipped. 3) Otherwise the empty state.
  const lockedBlueprint =
    blueprint !== null && blueprint.unlocked === false && blueprint.sections.length > 0
      ? blueprint
      : null;

  return (
    <section className="section-cream">
      {/* Shell width matches the site's page vocabulary; the report body
          below stays width-unconstrained because the authored HTML is a
          self-contained document with its own `.page` max-width and
          gutters — a prose measure here was the "report too narrow"
          defect. The empty-state paragraph keeps the 58ch prose measure
          because it is site copy, not client content. */}
      <div className="mx-auto w-full max-w-[1180px] px-6 py-12 sm:px-8">
        {/* The company identity (todo 9, G3), mirroring /c/$token's header
            row: same avatar classes (US-004), initial resolved by the same
            rule. A client the store cannot name still gets the avatar —
            the "?" fallback — but no name line. */}
        <div className="flex items-center gap-3">
          <Avatar className="bg-ink text-cream" data-testid="portal-company-avatar">
            <AvatarFallback className="bg-ink text-cream">
              {companyInitial(company?.name)}
            </AvatarFallback>
          </Avatar>
          {company !== null && (
            <p className="eyebrow" data-testid="portal-company-name">
              {company.name}
            </p>
          )}
        </div>
        <p className="eyebrow mt-3">Client portal</p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="type-h3-caps-light mt-3">Your reports</h1>
          {lockedBlueprint ? <PrintButton /> : null}
        </div>
        {lockedBlueprint ? (
          <>
            <BlueprintDocument sections={lockedBlueprint.sections} variant="portal" />
            {/* The upsell is a control, not part of the document: it is
                wrapped rather than given the attribute so the print rule
                applies without the band having to know it can be printed. */}
            <div data-print="hide">
              <CheckoutBand
                identity={{ kind: "session" }}
                hasLockedFinals={lockedBlueprint.sections.some((section) => section.locked)}
              />
            </div>
          </>
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <article key={report.client_id} id={`report-${report.client_id}`} className="mt-8">
              <h2 className="type-h4-caps">{report.title}</h2>
              <div
                className="mt-6 max-w-none space-y-3 text-[1.0625rem] leading-[1.55] text-ink/80"
                dangerouslySetInnerHTML={{ __html: report.html }}
              />
            </article>
          ))
        ) : (
          <p className="mt-8 max-w-[58ch] text-base leading-relaxed text-ink/80">
            No reports are linked to this account yet. If you recently paid, sign in with the email
            you used at checkout — your blueprint appears here once payment completes. Your magic
            link keeps working in the meantime.
          </p>
        )}
        {/* The one meeting link the portal carries, above the intake card:
            every portal state — locked, paid, or empty — is one click from
            a live conversation. The URL constant comes from booking.ts: the
            booking host literal is permitted only there (layering.test.ts). */}
        <section data-testid="portal-booking" className="mt-12 border-t border-current/20 pt-10">
          <p className="eyebrow">Talk to the team</p>
          <h2 className="type-h3-caps-light mt-3">Book time with us</h2>
          <a
            href={BOOKING_URL_30MIN}
            data-testid="portal-booking-cta"
            className="eyebrow mt-6 inline-flex items-center rounded-full bg-lime px-7 py-4 text-ink transition-colors duration-200 hover:bg-cream"
          >
            Book your blueprint call
          </a>
        </section>
        {/* The report-driven intake (todo 10, G4): one question per final
            section the session's RLS read can see, so the card exists only
            downstream of the paywall — before payment the set is empty and
            it renders nothing. */}
        <div data-print="hide">
          <IntakeCard questions={intake.questions} />
        </div>
      </div>
    </section>
  );
}

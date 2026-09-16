import { createFileRoute } from "@tanstack/react-router";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { companyInitial, fetchPortalPage } from "@/lib/client-portal/portal";

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
  const { reports, company } = Route.useLoaderData();

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
        <h1 className="type-h3-caps-light mt-3">Your reports</h1>
        {reports.length === 0 ? (
          <p className="mt-8 max-w-[58ch] text-base leading-relaxed text-ink/80">
            No reports are linked to this account yet. If you recently paid, sign in with the email
            you used at checkout — your blueprint appears here once payment completes. Your magic
            link keeps working in the meantime.
          </p>
        ) : (
          reports.map((report) => (
            <article key={report.client_id} id={`report-${report.client_id}`} className="mt-8">
              <h2 className="type-h4-caps">{report.title}</h2>
              <div
                className="mt-6 max-w-none space-y-3 text-[1.0625rem] leading-[1.55] text-ink/80"
                dangerouslySetInnerHTML={{ __html: report.html }}
              />
            </article>
          ))
        )}
      </div>
    </section>
  );
}

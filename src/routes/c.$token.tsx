import { createFileRoute, Link, notFound } from "@tanstack/react-router";

import { ClientReports } from "@/components/client-portal/client-reports";
import { CheckoutBand } from "@/components/client-portal/checkout/checkout-panel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { fetchClientPageByToken } from "@/lib/client-portal/tokens";

/**
 * One client's private page at `/c/$token` (US-001).
 *
 * The token in the URL is the entire grant: the loader resolves it to
 * exactly one client's page through the server function, which is the only
 * code that reads the token store. There is deliberately no gate between
 * opening the link and reading the page.
 *
 * An unknown token is answered with `notFound()`, the same 404 an absent
 * page gets — the URL of a client that does not exist and the URL of a
 * client you are not is the same response, which is the point. The denial
 * page below carries no client content and no identifying mark: it must be
 * safe to show to anyone holding a mistyped or revoked link.
 */

export const Route = createFileRoute("/c/$token")({
  /**
   * Deliberately no try/catch.
   *
   * A throw here must escape: the router maps it to the denied page, while
   * catching it to "handle it gracefully" is what produces a 200 with an
   * empty shell — a success status on a page that resolved to nobody.
   */
  loader: async ({ params }) => {
    const page = await fetchClientPageByToken({ data: params.token });
    if (!page) throw notFound();

    return { page };
  },

  /**
   * Every state of this route is private (US-002): the resolved page belongs
   * to exactly one client, and the denied page is not content at all. Both
   * branches carry `noindex`, mirroring the not-found branch of
   * `podcast_.$slug.tsx` — unlike that route's found branch, there is no
   * public state here that must stay indexable, so the directive is
   * unconditional across branches rather than per-branch.
   */
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: loaderData.page.title }, { name: "robots", content: "noindex" }]
      : [{ title: "This link is not valid" }, { name: "robots", content: "noindex" }],
  }),

  /**
   * Belt and braces beside the `noindex` meta above (US-002): a crawler that
   * never parses the document head still sees the denial. Unconditional for
   * the same reason — no state of `/c/$token` is public.
   */
  headers: (): Record<string, string> => ({
    "X-Robots-Tag": "noindex",
  }),

  component: ClientPortalPage,
  notFoundComponent: ClientLinkDenied,
});

/**
 * One bookmarkable URL per client, every report inside it (US-003).
 *
 * The loader still resolves the token to exactly one client's page — the
 * stack below only renders that page's own reports, so it can neither
 * reach another client nor leak one. Reports render in store order with
 * no navigation chrome, which keeps the page branchless.
 */
/**
 * The mark of the opened page (US-004).
 *
 * Rendered only on the resolved page, never on the denial below: the denial
 * answers anyone holding a mistyped link, so it must carry nothing that
 * names a client. The single initial comes from the resolved page's own
 * name; the ink-on-cream fill follows the brand tokens (`--ink`, `--cream`
 * in the be-human-design skill), matching the page's cream section.
 */
export function ClientAvatar({ name }: { name: string }) {
  const initial = name.trim().slice(0, 1).toUpperCase() || "?";

  return (
    <Avatar className="bg-ink text-cream">
      <AvatarFallback className="bg-ink text-cream">{initial}</AvatarFallback>
    </Avatar>
  );
}

function ClientPortalPage() {
  const { page } = Route.useLoaderData();
  const { token } = Route.useParams();
  const hasLockedFinals = page.sections?.some((section) => section.locked) ?? false;

  return (
    <section className="section-cream">
      <div className="mx-auto flex w-full max-w-[1180px] items-center gap-3 px-6 pt-12 sm:px-8">
        <ClientAvatar name={page.name} />
        <p className="eyebrow">{page.name}</p>
      </div>
      <ClientReports page={page} />
      {/*
        The purchase band (funnel todo 7) sits where the locked sections end:
        the page's single upsell, shown only while finals remain locked. An
        already-paid client sees no band here at all — and if one is ever
        reached, the init route answers 409 with the sign-in hint.
      */}
      <CheckoutBand token={token} hasLockedFinals={hasLockedFinals} />
    </section>
  );
}

function ClientLinkDenied() {
  return (
    <section className="section-cream">
      <div className="mx-auto max-w-[720px] px-6 py-24 text-center sm:px-8">
        <h1 className="type-h3-caps-light">This link is not valid</h1>
        <p className="mt-6 text-base leading-relaxed text-ink/80">
          The link you followed does not match a client page. Check the address, or ask us to send
          it again.
        </p>
        <Link className="eyebrow mt-8 inline-block bg-ink px-7 py-4 text-cream" to="/">
          Back to the homepage
        </Link>
      </div>
    </section>
  );
}

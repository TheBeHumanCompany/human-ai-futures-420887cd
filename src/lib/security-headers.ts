/**
 * Response security headers, applied once in `src/server.ts` to every response.
 *
 * Two things live here, and they are answers to two different problems.
 *
 * REFERRER. `/c/<token>` is the one route where the URL *is* the credential
 * (`src/lib/client-portal/tokens.ts`). Any outbound navigation from that page —
 * a booking link, a source in a report's sources register — sends the full URL,
 * token included, in the `Referer` header to a third party. That is a credential
 * disclosure with no attacker required, so the private routes send
 * `no-referrer` and nothing else will do. The rest of the site sends
 * `strict-origin-when-cross-origin`, the modern default.
 *
 * CACHING. `noindex` keeps the private routes out of search results but says
 * nothing about storage. A client's blueprint is served over a long-lived URL
 * with no session, so without an explicit directive the browser — and any
 * intermediary that sees the response — is free to keep a copy. `private,
 * no-store` on the private routes only; the marketing site keeps whatever
 * caching the platform gives it.
 *
 * CSP, in two halves. The enforced half carries only directives that cannot
 * break a page that already works: none of them name an origin, so none of them
 * can be wrong about one. They are still the directives that matter against
 * injected markup — `object-src` kills plugin embeds, `base-uri` kills a
 * `<base>` tag that silently repoints every relative URL on the page, and
 * `form-action` kills an injected form that POSTs elsewhere.
 *
 * The half that WOULD need to be right about origins — `script-src` above all —
 * ships as `Content-Security-Policy-Report-Only`. Clerk resolves its frontend
 * API domain from the publishable key at runtime, and TanStack Start's
 * hydration emits inline scripts, so an enforced `script-src` written from
 * static inspection would be a guess. Report-Only makes violations visible in
 * the console and in reports without taking the site down while the real
 * allowlist is learned. Promote it to enforced only after a browse of every
 * route reports nothing.
 *
 * Counterfactual: enforcing the report-only policy today breaks Clerk sign-in
 * and SSR hydration; dropping `no-referrer` from `/c/` leaks live client tokens
 * to every external site a report links to.
 */

/** Routes where the URL itself is a secret, or the page must never be framed. */
const PRIVATE_PREFIXES = ["/portal", "/profile", "/c", "/sign-in", "/sign-up", "/audit"];

export const isPrivatePath = (pathname: string): boolean =>
  PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/**
 * Origin-free, so it cannot be wrong about an origin. `frame-ancestors` is
 * added for private paths only: the marketing site is previewed in an iframe by
 * Lovable, and denying that globally would break the connected workflow for no
 * gain — there is nothing to clickjack on a public marketing page.
 */
const ENFORCED_CSP = "base-uri 'self'; object-src 'none'; form-action 'self'";

/**
 * The policy we intend to enforce once it reports clean. Origins are drawn from
 * what the app actually loads: Google Fonts (`__root.tsx`), Sanity's image CDN
 * (`src/lib/sanity/image.ts`), PodBean audio (`src/lib/podbean/*`), YouTube
 * (`src/routes/index.tsx`, `the-human-archive.tsx`), the Lovable R2 bucket that
 * serves the social card, and Clerk, whose `*.clerk.accounts.dev` /
 * `*.clerk.com` hosts cover both development and production instances.
 */
const REPORT_ONLY_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com",
  // Tailwind and the design system inject style elements; report-only until the
  // report says whether a nonce is worth the SSR plumbing.
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https://cdn.sanity.io https://i.ytimg.com https://img.youtube.com https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev https://*.clerk.accounts.dev https://*.clerk.com",
  "media-src 'self' https://mcdn.podbean.com https://*.podbean.com",
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://*.clerk.accounts.dev https://*.clerk.com",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://5apyl3sk.apicdn.sanity.io",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
].join("; ");

/**
 * The headers for one request path. Returned as a plain record so the caller
 * decides how to attach them and this stays trivially testable.
 */
export const securityHeadersFor = (pathname: string): Record<string, string> => {
  const isPrivate = isPrivatePath(pathname);
  return {
    "Content-Security-Policy": isPrivate ? `${ENFORCED_CSP}; frame-ancestors 'none'` : ENFORCED_CSP,
    "Content-Security-Policy-Report-Only": REPORT_ONLY_CSP,
    "X-Content-Type-Options": "nosniff",
    // A confidential report must not be stored by the browser or by anything
    // between it and the origin. Only set where it costs nothing: caching the
    // marketing site is desirable.
    ...(isPrivate ? { "Cache-Control": "private, no-store" } : {}),
    // The token in `/c/<token>` must never travel in a Referer header.
    "Referrer-Policy": isPrivate ? "no-referrer" : "strict-origin-when-cross-origin",
  };
};

/**
 * Attach the headers without discarding anything the framework already set.
 *
 * A Response's headers can be immutable (redirects constructed by
 * `Response.redirect`, and some Worker-constructed responses), so this clones
 * rather than mutating in place. `set` rather than `append`: a route that has
 * already chosen a value for one of these — none do today — should win over a
 * blanket default, and duplicate CSP headers are intersected by the browser,
 * which turns a second opinion into a silent tightening.
 */
export const withSecurityHeaders = (response: Response, pathname: string): Response => {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeadersFor(pathname))) {
    if (!headers.has(name)) headers.set(name, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

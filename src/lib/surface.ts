import { SITE_ORIGIN } from "./sanity/config";

/**
 * The two surfaces one deployment serves, routed by request host.
 *
 * `thebehumancompany.ca` is marketing; `portal.thebehumancompany.ca` serves
 * the client portal, the profile page, `/c/<token>`, and the auth screens.
 * Both hosts answer from the same Vercel project and the same build — this
 * module is the one place that decides which host serves what, and
 * `src/server.ts` plus the client-side guard in `__root.tsx` both call
 * `decideHostRoute`, so the two can never disagree.
 *
 * This guard is **not** an authorization control. `/portal` and `/profile`
 * require a Clerk session in their loaders, `/c/<token>` requires the token
 * in its path, and RLS scopes every read. The guard only keeps surfaces from
 * rendering inside each other's chrome.
 */

export const PORTAL_ORIGIN = "https://portal.thebehumancompany.ca";

/** Exact hosts, not patterns — a first-label rule would classify `portal.evil.com`. */
export const PORTAL_HOSTS: Record<string, true> = {
  "portal.thebehumancompany.ca": true,
  "portal.localhost": true,
};
export const MARKETING_HOSTS: Record<string, true> = {
  "thebehumancompany.ca": true,
  "www.thebehumancompany.ca": true,
  localhost: true,
};

export const PORTAL_PATH_PREFIXES = [
  "/portal",
  "/profile",
  "/c",
  "/sign-in",
  "/sign-up",
  "/audit",
] as const;

export type Surface = "portal" | "marketing" | "unclassified";

/**
 * Classify a request host. Lowercase, one trailing dot stripped, and a
 * `:port` suffix stripped only when everything after the last `:` is digits —
 * an IPv6 literal or a malformed authority stays whole and lands in
 * `unclassified`. Unknown hosts (Vercel previews, health checks, a missing
 * `Host`) are `unclassified` and every decision passes for them, which is
 * exactly today's behavior and keeps preview deployments reviewable.
 *
 * Never read `x-forwarded-host`: the framework's own `getOrigin` deliberately
 * ignores `x-forwarded-*` (CVE-2024-34351), and so does this.
 */
export function surfaceForHost(host: string | null | undefined): Surface {
  if (!host) return "unclassified";
  let normalized = host.trim().toLowerCase();
  if (normalized.endsWith(".")) normalized = normalized.slice(0, -1);
  const lastColon = normalized.lastIndexOf(":");
  if (lastColon !== -1 && /^\d+$/.test(normalized.slice(lastColon + 1))) {
    normalized = normalized.slice(0, lastColon);
  }
  // Own-property checks: `hosts["__proto__"]` would otherwise be truthy via
  // the prototype chain and a hostile Host header could classify as portal.
  if (Object.hasOwn(PORTAL_HOSTS, normalized)) return "portal";
  if (Object.hasOwn(MARKETING_HOSTS, normalized)) return "marketing";
  return "unclassified";
}

/**
 * Path-based portal membership: `pathname === p` or `pathname.startsWith(p + "/")`
 * for each prefix. `/portal`, `/portal/x`, `/c/abc` match; `/portalish` does not.
 * Branching chrome on the path (not the host) keeps SSR and hydration identical.
 */
export function isPortalPath(pathname: string): boolean {
  return PORTAL_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export type HostDecision =
  | { kind: "pass" }
  | { kind: "redirect"; location: string; status: 302 | 308 }
  | { kind: "notFound" };

// TanStack Start dispatches every `createServerFn` call to
// `TSS_SERVER_FN_BASE + id` (createServerRpc.js). Without passing these
// through, `fetchPortalPage`, `submitIntakeUpload`, `requireSignedIn` and the
// publishable-key fetch would all 308 away from the portal host and the
// portal would not function at all. The segment boundary matters the same way
// `/portalish` is not a portal path: a raw prefix would also pass
// `/_serverFnish`. Read at call time so a future framework upgrade that
// changes the base is fixed by the constant, not by a stale build constant.
const RAW_SERVER_FN_BASE = process.env.TSS_SERVER_FN_BASE ?? "/_serverFn/";
const SERVER_FN_BASE = RAW_SERVER_FN_BASE.endsWith("/")
  ? RAW_SERVER_FN_BASE.slice(0, -1)
  : RAW_SERVER_FN_BASE;

const isServerFnTransport = (pathname: string): boolean =>
  pathname === SERVER_FN_BASE || pathname.startsWith(`${SERVER_FN_BASE}/`);

const isStaticAssetPath = (pathname: string): boolean =>
  pathname.startsWith("/assets/") ||
  pathname.startsWith("/_build/") ||
  pathname.startsWith("/favicon") ||
  pathname.startsWith("/apple-touch-icon") ||
  pathname === "/site.webmanifest";

/**
 * The routing decision for one request, in this exact order, ignoring HTTP
 * method (308 preserves method and body, so a moved POST still lands):
 *
 * 1. Server-function transport → pass (load-bearing, see above).
 * 2. `/api/stripe-webhook` → pass. Stripe posts to the apex URL already
 *    configured in its dashboard and does not follow redirects.
 * 3. `/api/audit-checkout` → pass. Called same-origin from `/c/<token>`.
 * 4. `unclassified` surface → pass (previews, health checks, no Host).
 * 5. portal + `/` → 302 `/portal`.
 * 6. portal + `/sitemap.xml` → notFound (marketing-only document).
 * 7. portal + portal path → pass.
 * 8. portal + static asset → pass.
 * 9. portal + anything else → 308 to the marketing origin. An explicit
 *    fallback, not a "contains a dot" heuristic: an unknown path must leave
 *    the portal host rather than render marketing chrome around a 404.
 * 10. marketing + portal path → 308 to the portal origin.
 * 11. otherwise pass.
 *
 * `location` is always a fixed constant origin concatenated with the parsed
 * `pathname` and `search`, so a hostile query cannot change the destination
 * host: `pathname` from `new URL()` is normalized and always starts with `/`,
 * so `//evil.com/x` becomes `https://portal.thebehumancompany.ca//evil.com/x`
 * — still this origin.
 */
export function decideHostRoute(input: {
  host: string | null;
  pathname: string;
  search: string;
}): HostDecision {
  const { pathname, search } = input;

  if (isServerFnTransport(pathname)) return { kind: "pass" };
  if (pathname === "/api/stripe-webhook") return { kind: "pass" };
  if (pathname === "/api/audit-checkout") return { kind: "pass" };

  const surface = surfaceForHost(input.host);
  if (surface === "unclassified") return { kind: "pass" };

  if (surface === "portal") {
    if (pathname === "/") return { kind: "redirect", location: "/portal", status: 302 };
    if (pathname === "/sitemap.xml") return { kind: "notFound" };
    if (isPortalPath(pathname)) return { kind: "pass" };
    if (isStaticAssetPath(pathname)) return { kind: "pass" };
    return { kind: "redirect", location: `${SITE_ORIGIN}${pathname}${search}`, status: 308 };
  }

  if (isPortalPath(pathname)) {
    return { kind: "redirect", location: `${PORTAL_ORIGIN}${pathname}${search}`, status: 308 };
  }
  return { kind: "pass" };
}

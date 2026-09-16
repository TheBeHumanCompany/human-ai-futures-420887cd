import { describe, expect, test } from "bun:test";

import {
  PORTAL_ORIGIN,
  decideHostRoute,
  isPortalPath,
  surfaceForHost,
  type HostDecision,
} from "./surface";
import { SITE_ORIGIN } from "./sanity/config";

/**
 * The host guard decides which surface serves every request. Two properties
 * are security-adjacent and pinned hard: host classification is EXACT (a
 * first-label or suffix rule would hand `portal.evil.com` the portal), and a
 * redirect's `location` is always a fixed constant origin plus the parsed
 * path, so a hostile query can never steer the destination host.
 */

const APEX = "thebehumancompany.ca";
const PORTAL = "portal.thebehumancompany.ca";

function decision(input: {
  host?: string | null;
  pathname: string;
  search?: string;
}): HostDecision {
  return decideHostRoute({
    host: input.host ?? null,
    pathname: input.pathname,
    search: input.search ?? "",
  });
}

function locationOf(d: HostDecision): string {
  if (d.kind !== "redirect") throw new Error(`expected redirect, got ${d.kind}`);
  return d.location;
}

describe("surfaceForHost", () => {
  test("only the two configured portal hosts classify as portal, exactly", () => {
    expect(surfaceForHost(PORTAL)).toBe("portal");
    expect(surfaceForHost("PORTAL.thebehumancompany.CA")).toBe("portal");
    expect(surfaceForHost(`${PORTAL}.`)).toBe("portal");
    expect(surfaceForHost(`${PORTAL}:5180`)).toBe("portal");
    expect(surfaceForHost("portal.localhost:5180")).toBe("portal");
  });

  test("lookalike hosts are never the portal", () => {
    expect(surfaceForHost("portal.evil.com")).toBe("unclassified");
    expect(surfaceForHost(`${PORTAL}.evil.com`)).toBe("unclassified");
    expect(surfaceForHost("evilportal.com")).toBe("unclassified");
    // A hostile Host value must not resolve through the Record prototype.
    expect(surfaceForHost("__proto__")).toBe("unclassified");
    expect(surfaceForHost("constructor")).toBe("unclassified");
  });

  test("marketing hosts, ports stripped", () => {
    expect(surfaceForHost(APEX)).toBe("marketing");
    expect(surfaceForHost(`www.${"thebehumancompany.ca"}`)).toBe("marketing");
    expect(surfaceForHost("localhost")).toBe("marketing");
    expect(surfaceForHost("localhost:5180")).toBe("marketing");
  });

  test("missing or foreign hosts are unclassified", () => {
    expect(surfaceForHost(null)).toBe("unclassified");
    expect(surfaceForHost(undefined)).toBe("unclassified");
    expect(surfaceForHost("some-preview.vercel.app")).toBe("unclassified");
  });

  test("a non-numeric suffix after the last colon keeps the host whole", () => {
    // An IPv6 literal or malformed authority must not lose its tail.
    expect(surfaceForHost("[::1]")).toBe("unclassified");
    expect(surfaceForHost("host:abc")).toBe("unclassified");
  });
});

describe("isPortalPath", () => {
  test("portal paths and their subpaths match; near-misses do not", () => {
    expect(isPortalPath("/portal")).toBe(true);
    expect(isPortalPath("/portal/x")).toBe(true);
    expect(isPortalPath("/profile/security")).toBe(true);
    expect(isPortalPath("/c/abc")).toBe(true);
    expect(isPortalPath("/audit/success")).toBe(true);
    expect(isPortalPath("/sign-in/factor-one")).toBe(true);
    expect(isPortalPath("/portalish")).toBe(false);
    expect(isPortalPath("/cart")).toBe(false);
    expect(isPortalPath("/")).toBe(false);
  });
});

describe("decideHostRoute — server-function and api transports pass everywhere", () => {
  test("the server-fn base passes on both hosts and respects the segment boundary", () => {
    expect(decision({ host: PORTAL, pathname: "/_serverFn/abc123" }).kind).toBe("pass");
    expect(decision({ host: APEX, pathname: "/_serverFn/abc123" }).kind).toBe("pass");
    // A raw prefix would also pass `/_serverFnish` — it must not.
    const nearMiss = decision({ host: PORTAL, pathname: "/_serverFnish" });
    expect(nearMiss.kind).toBe("redirect");
  });

  test("stripe webhook and audit checkout pass on both hosts", () => {
    for (const host of [APEX, PORTAL]) {
      expect(decision({ host, pathname: "/api/stripe-webhook" }).kind).toBe("pass");
      expect(decision({ host, pathname: "/api/audit-checkout" }).kind).toBe("pass");
    }
  });
});

describe("decideHostRoute — apex moves portal paths to the portal host", () => {
  test("/portal 308s to the portal origin", () => {
    const d = decision({ host: APEX, pathname: "/portal" });
    expect(d).toEqual({
      kind: "redirect",
      location: `${PORTAL_ORIGIN}/portal`,
      status: 308,
    });
  });

  test("/c/<token> 308s preserving path and query", () => {
    expect(
      locationOf(decision({ host: APEX, pathname: "/c/abc", search: "?utm=x" })),
    ).toBe(`${PORTAL_ORIGIN}/c/abc?utm=x`);
  });

  test("/portalish is marketing (boundary), so it passes", () => {
    expect(decision({ host: APEX, pathname: "/portalish" }).kind).toBe("pass");
  });

  test("marketing paths pass unchanged", () => {
    expect(decision({ host: APEX, pathname: "/why-we-exist" }).kind).toBe("pass");
  });
});

describe("decideHostRoute — portal host serves portal paths and leaves the rest", () => {
  test("/ hops to /portal with a same-host 302", () => {
    expect(decision({ host: PORTAL, pathname: "/" })).toEqual({
      kind: "redirect",
      location: "/portal",
      status: 302,
    });
  });

  test("portal paths pass", () => {
    expect(decision({ host: PORTAL, pathname: "/portal" }).kind).toBe("pass");
    expect(decision({ host: PORTAL, pathname: "/profile/security" }).kind).toBe("pass");
    expect(decision({ host: PORTAL, pathname: "/c/abc" }).kind).toBe("pass");
    expect(decision({ host: PORTAL, pathname: "/audit/success" }).kind).toBe("pass");
  });

  test("static assets pass", () => {
    expect(decision({ host: PORTAL, pathname: "/assets/app-abc.js" }).kind).toBe("pass");
    expect(decision({ host: PORTAL, pathname: "/_build/x.js" }).kind).toBe("pass");
    expect(decision({ host: PORTAL, pathname: "/favicon.ico" }).kind).toBe("pass");
    expect(decision({ host: PORTAL, pathname: "/apple-touch-icon.png" }).kind).toBe("pass");
    expect(decision({ host: PORTAL, pathname: "/site.webmanifest" }).kind).toBe("pass");
  });

  test("sitemap.xml is marketing-only", () => {
    expect(decision({ host: PORTAL, pathname: "/sitemap.xml" })).toEqual({ kind: "notFound" });
  });

  test("an unknown path leaves for the apex — no dot heuristic", () => {
    expect(decision({ host: PORTAL, pathname: "/foo.bar" })).toEqual({
      kind: "redirect",
      location: `${SITE_ORIGIN}/foo.bar`,
      status: 308,
    });
    expect(decision({ host: PORTAL, pathname: "/why-we-exist" })).toEqual({
      kind: "redirect",
      location: `${SITE_ORIGIN}/why-we-exist`,
      status: 308,
    });
  });
});

describe("decideHostRoute — unclassified hosts behave exactly as today", () => {
  test("previews, health checks and a missing host pass for every path", () => {
    for (const host of ["some-preview.vercel.app", null]) {
      expect(decision({ host, pathname: "/portal" }).kind).toBe("pass");
      expect(decision({ host, pathname: "/why-we-exist" }).kind).toBe("pass");
      expect(decision({ host, pathname: "/" }).kind).toBe("pass");
    }
  });
});

describe("decideHostRoute — redirect targets cannot be steered", () => {
  test("a hostile query keeps the fixed origin", () => {
    // `new URL()` keeps `:` and `/` verbatim in the query, so the location is
    // the portal origin with the hostile value inert inside the query string.
    expect(
      locationOf(decision({ host: APEX, pathname: "/c/abc", search: "?next=https://evil.com" })),
    ).toBe(`${PORTAL_ORIGIN}/c/abc?next=https://evil.com`);
  });

  test("a CRLF-encoded query stays percent-encoded inside the fixed origin", () => {
    const location = locationOf(
      decision({ host: PORTAL, pathname: "/why-we-exist", search: "?x=%0d%0aSet-Cookie:%20evil" }),
    );
    expect(location.startsWith(`${SITE_ORIGIN}/why-we-exist?`)).toBe(true);
    expect(location).not.toContain("\r");
    expect(location).not.toContain("\n");
  });

  test("a protocol-relative pathname stays on the fixed origin", () => {
    const location = locationOf(decision({ host: PORTAL, pathname: "//evil.com/x" }));
    expect(location.startsWith(`${SITE_ORIGIN}//evil.com/x`)).toBe(true);
  });
});

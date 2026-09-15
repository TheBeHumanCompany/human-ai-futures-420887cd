import { describe, expect, test } from "bun:test";

import {
  isPrivatePath,
  securityHeadersFor,
  withSecurityHeaders,
} from "./security-headers";

/**
 * The token in `/c/<token>` is the credential, so the header that stops it
 * travelling in a `Referer` is a security control, not a preference. These
 * pin the two behaviours that would be silent if they regressed: the private
 * referrer policy, and the fact that the enforced CSP names no origin.
 */

describe("private paths", () => {
  test("the token route and the portal are private; marketing is not", () => {
    expect(isPrivatePath("/c/abc")).toBe(true);
    expect(isPrivatePath("/portal")).toBe(true);
    expect(isPrivatePath("/portal/anything")).toBe(true);

    expect(isPrivatePath("/")).toBe(false);
    expect(isPrivatePath("/podcast")).toBe(false);
    // Near-misses that must not be swept in by a loose prefix test.
    expect(isPrivatePath("/contact")).toBe(false);
    expect(isPrivatePath("/portalish")).toBe(false);
  });
});

describe("referrer policy", () => {
  test("a private page sends no referrer at all", () => {
    expect(securityHeadersFor("/c/abc")["Referrer-Policy"]).toBe("no-referrer");
    expect(securityHeadersFor("/portal")["Referrer-Policy"]).toBe("no-referrer");
  });

  test("public pages keep the modern default", () => {
    expect(securityHeadersFor("/podcast")["Referrer-Policy"]).toBe(
      "strict-origin-when-cross-origin",
    );
  });
});

describe("caching", () => {
  test("a private page refuses to be stored anywhere", () => {
    expect(securityHeadersFor("/c/abc")["Cache-Control"]).toBe("private, no-store");
    expect(securityHeadersFor("/portal")["Cache-Control"]).toBe("private, no-store");
  });

  test("public pages are left cacheable", () => {
    expect(securityHeadersFor("/podcast")["Cache-Control"]).toBeUndefined();
  });
});

describe("enforced CSP", () => {
  test("names no origin, so it cannot be wrong about one", () => {
    const csp = securityHeadersFor("/")["Content-Security-Policy"]!;
    expect(csp).not.toContain("http");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
  });

  test("private pages additionally refuse to be framed; public pages stay framable for Lovable", () => {
    expect(securityHeadersFor("/portal")["Content-Security-Policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(securityHeadersFor("/")["Content-Security-Policy"]).not.toContain(
      "frame-ancestors",
    );
  });

  test("the origin-bearing policy ships report-only, never enforced", () => {
    const headers = securityHeadersFor("/");
    expect(headers["Content-Security-Policy-Report-Only"]).toContain("script-src");
    expect(headers["Content-Security-Policy"]).not.toContain("script-src");
  });
});

describe("withSecurityHeaders", () => {
  test("preserves status and body, and adds the headers", async () => {
    const response = withSecurityHeaders(
      new Response("hello", { status: 404, headers: { "content-type": "text/plain" } }),
      "/c/abc",
    );

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("hello");
    expect(response.headers.get("content-type")).toBe("text/plain");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  test("does not clobber a header the route already chose", () => {
    const response = withSecurityHeaders(
      new Response("x", { headers: { "Referrer-Policy": "unsafe-url" } }),
      "/c/abc",
    );
    expect(response.headers.get("Referrer-Policy")).toBe("unsafe-url");
  });

  test("survives a response whose headers are immutable", () => {
    // `Response.redirect` yields immutable headers; mutating in place throws.
    const redirect = Response.redirect("https://thebehumancompany.ca/who-we-are", 301);
    const response = withSecurityHeaders(redirect, "/about");
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(
      "https://thebehumancompany.ca/who-we-are",
    );
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  test("the existing X-Robots-Tag on /c/ is left alone", () => {
    const response = withSecurityHeaders(
      new Response("x", { headers: { "X-Robots-Tag": "noindex" } }),
      "/c/abc",
    );
    expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  });
});

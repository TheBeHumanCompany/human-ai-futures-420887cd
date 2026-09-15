import { describe, expect, test } from "bun:test";

import { authMiddlewareEnabled } from "./start";

/**
 * The 2026-09-15 production incident, pinned: an unconditional
 * clerkMiddleware threw `no secret key provided` on every request, 500ing
 * even session-less pages. The contract is that a missing key disables the
 * auth layer instead of taking down the site.
 */
describe("authMiddlewareEnabled", () => {
  test("off without a key, on with one", () => {
    expect(authMiddlewareEnabled({})).toBe(false);
    expect(authMiddlewareEnabled({ CLERK_SECRET_KEY: "" })).toBe(false);
    expect(authMiddlewareEnabled({ CLERK_SECRET_KEY: "configured-key" })).toBe(true);
  });
});

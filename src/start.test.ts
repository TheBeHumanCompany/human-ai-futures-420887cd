import { describe, expect, test } from "bun:test";

import { authMiddlewareEnabled } from "./start";

/**
 * The 2026-09-15 production incident, pinned: an unconditional
 * clerkMiddleware threw `no secret key provided` on every request, 500ing
 * even session-less pages. The contract is that a missing key disables the
 * auth layer instead of taking down the site.
 *
 * This covers the env decision only. The second half of the contract — that
 * the missing-key warning never reaches a browser, where `process.env` is `{}`
 * and the answer is always "missing" regardless of the server — cannot be
 * asserted here: it is a property of the emitted bundles, not of a value this
 * process can compute. `scripts/verify/assert-auth-warning.sh` asserts it
 * where it is decided, against the emitted bundles.
 */
describe("authMiddlewareEnabled", () => {
  test("off without a key, on with one", () => {
    expect(authMiddlewareEnabled({})).toBe(false);
    expect(authMiddlewareEnabled({ CLERK_SECRET_KEY: "" })).toBe(false);
    expect(authMiddlewareEnabled({ CLERK_SECRET_KEY: "configured-key" })).toBe(true);
  });
});

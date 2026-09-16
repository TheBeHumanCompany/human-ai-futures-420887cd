import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { Route } from "./success";

/**
 * The checkout return page (funnel todo 8), pinned offline.
 *
 * The loader's Stripe round-trip needs a running server, so the live
 * behavior is proven by the receipt unit tests (`receipt.test.ts`) plus the
 * dev-server run in the funnel stage-3 spec. What is pinned here, offline:
 *
 * - the search contract: only `session_id` is read,
 * - the missing-param contract: the loader throws a redirect home, before
 *   any Stripe call,
 * - the private-page contract: `noindex` on every branch plus the
 *   `X-Robots-Tag` header,
 * - the source discipline: the page never touches the billing module or any
 *   unlock path — the webhook stays the only fulfillment — and renders
 *   session data as text only.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
const ROUTE_SOURCE = readFileSync(new URL("./success.tsx", import.meta.url).pathname, "utf8");

const callHead = (loaderData?: unknown) =>
  (Route.options.head as any)({ loaderData }) as {
    meta?: Array<Record<string, string>>;
  };

const callHeaders = () => (Route.options.headers as any)() as Record<string, string>;

describe("the route declares the pieces the return flow depends on", () => {
  test("it validates search, has a loader, and a component", () => {
    expect(Route.options.validateSearch).toBeDefined();
    expect(Route.options.loader).toBeDefined();
    expect(Route.options.component).toBeDefined();
  });
});

describe("validateSearch reads only the checkout's session_id", () => {
  const validate = (search: Record<string, unknown>) =>
    (Route.options.validateSearch as any)(search) as Record<string, unknown>;

  test("a string session_id passes through", () => {
    expect(validate({ session_id: "cs_test_1" })).toEqual({ session_id: "cs_test_1" });
  });

  test("a missing or non-string session_id validates to nothing", () => {
    expect(validate({})).toEqual({});
    expect(validate({ session_id: 42 })).toEqual({});
  });
});

describe("a missing session_id redirects home before any Stripe call", () => {
  test("the loader throws a redirect to /", async () => {
    const thrown = await Promise.resolve(
      (Route.options.loader as any)({ location: { search: {} } }),
    ).then(
      () => null,
      (error: unknown) => error,
    );

    expect(thrown).toBeInstanceOf(Response);
    expect((thrown as Response & { options?: { to?: string } }).options?.to).toBe("/");
  });

  test("the redirect precedes the receipt fetch in the source", () => {
    // Order is the contract: a bare /audit/success must never reach Stripe.
    const redirectAt = ROUTE_SOURCE.indexOf('throw redirect({ to: "/" })');
    const fetchAt = ROUTE_SOURCE.indexOf("fetchAuditReceipt({");
    expect(redirectAt).toBeGreaterThan(-1);
    expect(fetchAt).toBeGreaterThan(redirectAt);
  });
});

describe("head() — a title per state, noindex on every branch", () => {
  test("a paid receipt titles success", () => {
    const result = callHead({ receipt: { kind: "paid", emailMasked: null, amountLabel: null } });
    expect(result.meta?.[0].title).toBe("Payment received");
  });

  test("an incomplete session titles the not-completed state", () => {
    const result = callHead({ receipt: { kind: "incomplete" } });
    expect(result.meta?.[0].title).toBe("Payment not completed");
  });

  test("no state omits the robots directive", () => {
    for (const loaderData of [
      undefined,
      { receipt: { kind: "paid", emailMasked: null, amountLabel: null } },
      { receipt: { kind: "incomplete" } },
      { receipt: { kind: "unknown-session" } },
      { receipt: { kind: "unavailable" } },
    ]) {
      expect(callHead(loaderData).meta?.find((m) => m.name === "robots")?.content).toBe("noindex");
    }
  });
});

describe("headers() — X-Robots-Tag, head-independent", () => {
  test("emits X-Robots-Tag: noindex", () => {
    expect(callHeaders()["X-Robots-Tag"]).toBe("noindex");
  });
});

describe("the return page fulfills nothing itself", () => {
  test("no unlock path, no store write, no fulfillment in the route source", () => {
    expect(ROUTE_SOURCE).not.toMatch(/client_paid_reports/i);
    expect(ROUTE_SOURCE).not.toMatch(/supabase/i);
    expect(ROUTE_SOURCE).not.toMatch(/fulfill|unlocked?\s*[:=]/i);
  });

  test("the billing module stays behind the receipt server function", () => {
    // The route file must import the receipt seam, never the Stripe client:
    // secret-key code has no business in a page component's import graph.
    expect(ROUTE_SOURCE).toContain("./receipt");
    expect(ROUTE_SOURCE).not.toContain("@/lib/billing");
  });

  test("no confirmation secret is ever named", () => {
    expect(ROUTE_SOURCE).not.toMatch(/client_secret/i);
  });

  test("session data renders as text only — no raw HTML injection", () => {
    expect(ROUTE_SOURCE).not.toContain("dangerouslySetInnerHTML");
  });
});

describe("the receipt states carry the funnel's testids", () => {
  test("the success receipt, the portal next step, and the retry link are pinned", () => {
    expect(ROUTE_SOURCE).toContain('data-testid="audit-success-receipt"');
    expect(ROUTE_SOURCE).toContain('data-testid="audit-portal-link"');
    expect(ROUTE_SOURCE).toContain('data-testid="audit-retry-link"');
  });

  test("the retry link goes home — never a token-carrying prospect URL", () => {
    expect(ROUTE_SOURCE).not.toMatch(/\/c\//);
  });
});

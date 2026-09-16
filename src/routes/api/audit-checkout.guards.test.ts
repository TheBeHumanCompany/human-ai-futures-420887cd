import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import {
  CLIENT_ID,
  CONFIG,
  EMAILED_CLIENT_ID,
  EMAILED_RECORD,
  PRICE_ID,
  SECRET,
  STRIPE_CONFIG,
  TOKEN,
  UNCONFIGURED,
  configuredFetch,
  freshCalls,
  jsonResponse,
  post,
} from "./audit-checkout.fixtures";
import type { SupabasePaidReport } from "@/lib/client-portal/supabase-tokens";

/**
 * The checkout-init route's state, config, and failure guards.
 *
 * Identity (who gets a session) is pinned in `audit-checkout.test.ts`; this
 * file pins everything after identity resolves: a paid replay answers 409
 * and creates nothing, a missing email answers 400, misconfiguration fails
 * loudly as 500, a Stripe failure is a typed 502 carrying neither the
 * upstream error body nor any secret — and the route source itself never
 * reads the store or logs the token.
 */

describe("an already-unlocked client is answered 409", () => {
  const PAID: SupabasePaidReport = { title: "Final", html: "<p>final</p>", unlocked: true };

  test("a paid replay gets 409 with the check-email / sign-in hint", async () => {
    const response = await post(
      { token: TOKEN },
      {
        ...UNCONFIGURED,
        supabaseConfig: CONFIG,
        fetchImpl: configuredFetch(PAID),
      },
    );

    expect(response.status).toBe(409);
    const body = (await response.json()) as { hint?: string };
    const hint = (body.hint ?? "").toLowerCase();
    expect(hint).toContain("check your email");
    expect(hint).toContain("sign in");
  });

  test("the replay answer creates no Stripe session", async () => {
    const calls = freshCalls();
    await post(
      { token: TOKEN },
      {
        ...UNCONFIGURED,
        supabaseConfig: CONFIG,
        fetchImpl: configuredFetch(PAID, calls),
      },
    );

    expect(calls.paidReads).toBeGreaterThanOrEqual(1);
    expect(calls.stripeCreates).toBe(0);
  });

  test("a locked paid row proceeds to the session", async () => {
    const response = await post(
      { token: TOKEN },
      {
        ...UNCONFIGURED,
        supabaseConfig: CONFIG,
        fetchImpl: configuredFetch({ title: null, html: null, unlocked: false }),
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ clientSecret: SECRET });
  });

  test("a failed unlock read fails closed as 502, never opens a session", async () => {
    const fetchImpl = (async (url: string | URL | Request) => {
      if (String(url).includes("client_paid_reports")) return jsonResponse(500, {});
      if (String(url).includes("client_portal_tokens")) {
        return jsonResponse(200, [{ client_id: CLIENT_ID, revoked_at: null }]);
      }
      return jsonResponse(500, {});
    }) as typeof fetch;

    const response = await post(
      { token: TOKEN },
      {
        ...UNCONFIGURED,
        supabaseConfig: CONFIG,
        fetchImpl,
      },
    );

    expect(response.status).toBe(502);
    const text = await response.text();
    expect(text).not.toContain(SECRET);
  });
});

describe("a client record without an email is answered 400", () => {
  test("no email on the record and none in env stops before Stripe", async () => {
    const calls = freshCalls();
    const { email: _email, ...withoutEmail } = UNCONFIGURED;

    const response = await post(
      { token: TOKEN },
      {
        ...withoutEmail,
        fetchImpl: configuredFetch(null, calls),
      },
    );

    expect(response.status).toBe(400);
    expect(calls.stripeCreates).toBe(0);
  });

  test("a blank email counts as missing", async () => {
    const response = await post({ token: TOKEN }, { ...UNCONFIGURED, email: "   " });

    expect(response.status).toBe(400);
  });

  test("the 400 body names no client and carries no token", async () => {
    const response = await post({ token: TOKEN }, { ...UNCONFIGURED, email: "" });

    const text = await response.text();
    expect(text).not.toContain(CLIENT_ID);
    expect(text).not.toContain(TOKEN);
  });
});

describe("a token record carrying a contact email is charged directly", () => {
  test("the record's email reaches Stripe with no seam and no env", async () => {
    const seen: { body?: string } = {};
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      const target = String(url);
      if (target.includes("client_portal_tokens")) {
        return jsonResponse(200, [{ client_id: EMAILED_CLIENT_ID, revoked_at: null }]);
      }
      if (target.includes("client_paid_reports")) {
        return jsonResponse(200, [{ title: null, html: null, unlocked: false }]);
      }
      if (target.includes("api.stripe.com")) {
        seen.body = String(init?.body ?? "");
        return jsonResponse(200, { id: "cs_test_probe", client_secret: SECRET });
      }
      return jsonResponse(500, {});
    }) as typeof fetch;

    const { email: _email, ...noSeam } = UNCONFIGURED;
    const response = await post(
      { token: TOKEN },
      {
        ...noSeam,
        supabaseConfig: CONFIG,
        fetchImpl,
        readStore: async () => [EMAILED_RECORD],
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ clientSecret: SECRET });
    const params = Object.fromEntries(new URLSearchParams(seen.body ?? ""));
    expect(params["customer_email"]).toBe("client-contact@example.test");
    expect(params["metadata[client_id]"]).toBe(EMAILED_CLIENT_ID);
  });
});

describe("a Stripe failure is a typed 502", () => {
  test("a StripeApiError answers 502 without the upstream error body", async () => {
    const UPSTREAM = "UPSTREAM-VERBATIM-MESSAGE-MARKER-3f8a";
    const fetchImpl = (async () =>
      jsonResponse(402, {
        error: { code: "card_declined", message: UPSTREAM },
      })) as typeof fetch;

    const response = await post({ token: TOKEN }, { ...UNCONFIGURED, fetchImpl });

    expect(response.status).toBe(502);
    const text = await response.text();
    expect(text).not.toContain(UPSTREAM);
    expect(text).not.toContain("card_declined");
    expect(text).not.toContain(SECRET);
  });

  test("a session without a client_secret answers 502, not a fake success", async () => {
    const fetchImpl = (async () =>
      jsonResponse(200, { id: "cs_test_probe", client_secret: null })) as typeof fetch;

    const response = await post({ token: TOKEN }, { ...UNCONFIGURED, fetchImpl });

    expect(response.status).toBe(502);
  });

  test("a transport throw answers 502", async () => {
    const fetchImpl = (async () => {
      throw new Error("network gone");
    }) as typeof fetch;

    const response = await post({ token: TOKEN }, { ...UNCONFIGURED, fetchImpl });

    expect(response.status).toBe(502);
  });
});

describe("misconfiguration fails loudly as 500", () => {
  test("no price id anywhere answers 500 before Stripe", async () => {
    const { priceId: _priceId, ...withoutPrice } = UNCONFIGURED;

    const response = await post({ token: TOKEN }, withoutPrice);

    expect(response.status).toBe(500);
  });

  test("no Stripe secret answers 500 before any request", async () => {
    const response = await post({ token: TOKEN }, { ...UNCONFIGURED, stripeConfig: null });

    expect(response.status).toBe(500);
  });
});

describe("the session identity path — the portal's pay button", () => {
  const LOCKED_ROW: SupabasePaidReport = { title: "F", html: "<p>f</p>", unlocked: false };
  const UNPAID_ROW: SupabasePaidReport = { title: "F", html: "<p>f</p>", unlocked: true };

  test("a session body with no signed-in user resolves to nobody", async () => {
    const response = await post({ source: "portal" }, { ...UNCONFIGURED, userId: null });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "This link is not valid" });
  });

  test("a signed-in user whose account maps to no engagement resolves to nobody", async () => {
    const calls = freshCalls();
    const response = await post(
      { source: "portal" },
      {
        ...UNCONFIGURED,
        userId: "user_fixture",
        fetchImpl: configuredFetch(LOCKED_ROW, calls),
        clientIdForUser: async () => null,
      },
    );

    expect(response.status).toBe(404);
    expect(calls.stripeCreates).toBe(0);
  });

  test("an unlocked engagement is a paid replay: 409, no Stripe session", async () => {
    const calls = freshCalls();
    const response = await post(
      { source: "portal" },
      {
        ...UNCONFIGURED,
        supabaseConfig: CONFIG,
        userId: "user_fixture",
        fetchImpl: configuredFetch(UNPAID_ROW, calls),
        clientIdForUser: async () => ({ clientId: CLIENT_ID, unlocked: true }),
      },
    );

    expect(response.status).toBe(409);
    expect(calls.stripeCreates).toBe(0);
  });

  test("a locked engagement charges the Clerk account's email, never a token", async () => {
    const calls = freshCalls();
    const seen: { body?: string } = {};
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).includes("api.stripe.com")) {
        seen.body = String(init?.body);
        calls.stripeCreates += 1;
        return jsonResponse(200, { id: "cs_test_probe", client_secret: SECRET });
      }
      return jsonResponse(200, []);
    }) as typeof fetch;

    const response = await post(
      { source: "portal" },
      {
        supabaseConfig: CONFIG,
        readStore: async () => [],
        priceId: PRICE_ID,
        stripeConfig: STRIPE_CONFIG,
        env: {},
        userId: "user_fixture",
        fetchImpl,
        clientIdForUser: async () => ({ clientId: CLIENT_ID, unlocked: false }),
        clerkEmail: async () => "payer@example.test",
      },
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ clientSecret: SECRET });
    expect(calls.stripeCreates).toBe(1);
    const params = Object.fromEntries(new URLSearchParams(seen.body ?? ""));
    expect(params["customer_email"]).toBe("payer@example.test");
    expect(params["metadata[client_id]"]).toBe(CLIENT_ID);
  });

  test("a locked engagement with no Clerk email and no env email answers 400", async () => {
    const response = await post(
      { source: "portal" },
      {
        supabaseConfig: CONFIG,
        readStore: async () => [],
        priceId: PRICE_ID,
        stripeConfig: STRIPE_CONFIG,
        env: {},
        userId: "user_fixture",
        fetchImpl: configuredFetch(LOCKED_ROW),
        clientIdForUser: async () => ({ clientId: CLIENT_ID, unlocked: false }),
        clerkEmail: async () => null,
      },
    );

    expect(response.status).toBe(400);
  });
});

const ROUTE_SOURCE = readFileSync(new URL("./audit-checkout.ts", import.meta.url).pathname, "utf8");

describe("security posture of the route source", () => {
  test("the route never reads the store file itself", () => {
    expect(ROUTE_SOURCE).not.toContain("clients.json");
  });

  test("the token is never interpolated into a log line", () => {
    expect(ROUTE_SOURCE).not.toMatch(/console\.\w+\([^)]*\$\{[^}]*token/i);
    expect(ROUTE_SOURCE).not.toMatch(/console\.\w+\([^)]*client_secret/i);
  });
});

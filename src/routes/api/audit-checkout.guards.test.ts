import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import {
  CLIENT_ID,
  CONFIG,
  SECRET,
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

import { describe, expect, test } from "bun:test";

import { handleAuditCheckout, Route } from "./audit-checkout";
import {
  CLIENT_ID,
  EMAIL,
  jsonResponse,
  PRICE_ID,
  SECRET,
  TOKEN,
  UNCONFIGURED,
  configuredFetch,
  freshCalls,
  post,
} from "./audit-checkout.fixtures";

/**
 * The token-guarded checkout-init route: identity and session creation.
 *
 * The route file is a thin shell over `handleAuditCheckout` (the webhook
 * route's discipline), so the guard matrix runs under `bun test` with
 * injected seams and zero network. This file pins WHO gets a session: a
 * valid prospect token answers exactly `{clientSecret}`, and every shape of
 * bad identity — unknown, malformed, oversized, empty, unparseable, or a
 * `client_id` enumeration probe — collapses into the same `/c/$token`
 * denial with no Stripe call. State, config, and failure guards live in
 * `audit-checkout.guards.test.ts`.
 */

describe("the route registers a POST server handler", () => {
  test("POST is declared on the server handlers", () => {
    const handlers = (Route.options as { server?: { handlers?: Record<string, unknown> } }).server
      ?.handlers;
    expect(handlers?.POST).toBeDefined();
  });
});

describe("valid prospect token initializes an elements session", () => {
  test("answers exactly {clientSecret} and nothing else", async () => {
    const response = await post({ token: TOKEN }, UNCONFIGURED);

    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body).toEqual({ clientSecret: SECRET });
    expect(Object.keys(body)).toEqual(["clientSecret"]);
  });

  test("the session is created with the resolved client and email", async () => {
    const calls = freshCalls();
    const seen: { body?: string } = {};
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).includes("api.stripe.com")) {
        seen.body = String(init?.body);
        calls.stripeCreates += 1;
        return jsonResponse(200, { id: "cs_test_probe", client_secret: SECRET });
      }
      return jsonResponse(500, {});
    }) as typeof fetch;

    const response = await post({ token: TOKEN }, { ...UNCONFIGURED, fetchImpl });

    expect(response.status).toBe(200);
    expect(calls.stripeCreates).toBe(1);
    const params = Object.fromEntries(new URLSearchParams(seen.body ?? ""));
    expect(params["metadata[client_id]"]).toBe(CLIENT_ID);
    expect(params["customer_email"]).toBe(EMAIL);
    expect(params["line_items[0][price]"]).toBe(PRICE_ID);
    expect(params["ui_mode"]).toBe("elements");
  });
});

describe("invalid or unknown tokens get the /c/$token denial", () => {
  const DENIAL = { error: "This link is not valid" };

  test("a well-formed token resolving to nobody answers 404", async () => {
    const other = TOKEN.slice(0, -1) + (TOKEN.endsWith("a") ? "b" : "a");
    const response = await post({ token: other }, UNCONFIGURED);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(DENIAL);
  });

  test("a malformed (too short) token answers the same 404", async () => {
    const response = await post({ token: "short-token" }, UNCONFIGURED);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(DENIAL);
  });

  test("an oversized token answers the same 404", async () => {
    const response = await post({ token: TOKEN + TOKEN + TOKEN }, UNCONFIGURED);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(DENIAL);
  });

  test("an empty token answers the same 404", async () => {
    const response = await post({ token: "" }, UNCONFIGURED);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(DENIAL);
  });

  test("an unparseable body answers the same 404", async () => {
    const response = await handleAuditCheckout(
      new Request("https://site.test/api/audit-checkout", {
        method: "POST",
        body: "not json at all",
      }),
      UNCONFIGURED,
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(DENIAL);
  });

  test("a body naming a client_id instead of a token resolves to nobody", async () => {
    // No `token` key means session identity; `userId: null` is the seam for
    // "no signed-in session", so the probe resolves to nobody without ever
    // touching Clerk.
    const response = await post(
      { clientId: CLIENT_ID, client_id: CLIENT_ID },
      { ...UNCONFIGURED, userId: null },
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual(DENIAL);
  });

  test("no Stripe session is created for any denial", async () => {
    const calls = freshCalls();
    await post(
      { token: "short-token" },
      { ...UNCONFIGURED, fetchImpl: configuredFetch(null, calls) },
    );

    expect(calls.stripeCreates).toBe(0);
  });

  test("the denial never echoes the submitted token back", async () => {
    const response = await post({ token: TOKEN + "tampered" }, UNCONFIGURED);

    const text = await response.text();
    expect(text).not.toContain(TOKEN);
  });
});

import { describe, expect, test } from "bun:test";

import {
  STRIPE_PREVIEW_VERSION,
  StripeApiError,
  stripeApi,
  stripeConfigFromEnv,
} from "./stripe-client";

/**
 * The transport contract, pinned without touching Stripe (US-010/011).
 *
 * Every Stripe call in this repo goes through `stripeApi`, so Basic auth,
 * the blueprint's preview version header, and form encoding are asserted
 * once here instead of in every caller.
 */

const CONFIG = { secretKey: "secret-for-tests-only" };

function stubFetch(
  record: { url?: string; init?: RequestInit },
  body: unknown,
  ok = true,
  status = 200,
) {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    record.url = url.toString();
    record.init = init;
    return {
      ok,
      status,
      json: async () => body,
    };
  }) as typeof fetch;
}

describe("stripeConfigFromEnv", () => {
  test("returns null without a key instead of building an unauthenticated client", () => {
    expect(stripeConfigFromEnv({})).toBeNull();
    expect(stripeConfigFromEnv({ STRIPE_SECRET_KEY: "" })).toBeNull();
  });

  test("reads the key when present", () => {
    expect(stripeConfigFromEnv({ STRIPE_SECRET_KEY: "test-secret-x" })).toEqual({
      secretKey: "test-secret-x",
    });
  });
});

describe("stripeApi", () => {
  test("posts form-encoded with Basic auth and the blueprint preview header", async () => {
    const record: { url?: string; init?: RequestInit } = {};
    const out = await stripeApi<{ id: string }>(
      "/v1/products",
      { name: "Probe", "default_price_data[unit_amount]": "100" },
      CONFIG,
      { fetchImpl: stubFetch(record, { id: "prod_probe" }) },
    );
    expect(out).toEqual({ id: "prod_probe" });
    expect(record.url).toBe("https://api.stripe.com/v1/products");
    const headers = record.init!.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe(`Basic ${btoa("secret-for-tests-only:")}`);
    expect(headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(headers["Stripe-Version"]).toBe(STRIPE_PREVIEW_VERSION);
    const body = new URLSearchParams(record.init!.body as string);
    expect(body.get("name")).toBe("Probe");
    expect(body.get("default_price_data[unit_amount]")).toBe("100");
  });

  test("non-ok answers throw with status and stripe code, never the raw body", async () => {
    const record: { url?: string; init?: RequestInit } = {};
    const failing = stubFetch(
      record,
      { error: { code: "resource_missing", message: "No such price" } },
      false,
      404,
    );
    const error = await stripeApi("/v1/checkout/sessions", {}, CONFIG, {
      fetchImpl: failing,
    }).catch((e) => e);
    expect(error).toBeInstanceOf(StripeApiError);
    expect((error as StripeApiError).status).toBe(404);
    expect((error as StripeApiError).stripeCode).toBe("resource_missing");
  });
});

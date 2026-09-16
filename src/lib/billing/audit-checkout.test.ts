import { describe, expect, test } from "bun:test";

import {
  auditCancelUrl,
  auditCheckoutParams,
  auditSuccessUrl,
  createAuditCheckoutSession,
  createElementsCheckoutSession,
  elementsCheckoutParams,
} from "./audit-checkout";
import { StripeApiError } from "./stripe-client";

/**
 * The audit-fee session contract (US-010), pinned without touching Stripe.
 *
 * Two invariants live here because they are the two the account cannot
 * recover from silently: dynamic payment methods (no `payment_method_types`
 * anywhere in the encoded call) and the client round-trip (`metadata`
 * carries the portal client id fulfillment maps back on).
 */

const INPUT = { clientId: "acme-industrial", priceId: "price_test_audit" };

describe("auditCheckoutParams", () => {
  test("one-time payment with managed payments, identifier, and client metadata", () => {
    const params = auditCheckoutParams(INPUT, "abcdefgh");
    expect(params["mode"]).toBe("payment");
    expect(params["line_items[0][price]"]).toBe("price_test_audit");
    expect(params["line_items[0][quantity]"]).toBe("1");
    expect(params["managed_payments[enabled]"]).toBe("true");
    expect(params["integration_identifier"]).toBe("portal-audit-abcdefgh");
    expect(params["metadata[client_id]"]).toBe("acme-industrial");
    expect(params["success_url"]).toBe(auditSuccessUrl());
    expect(params["cancel_url"]).toBe(auditCancelUrl());
  });

  test("return URLs stay on the portal canonical origin", () => {
    expect(auditSuccessUrl()).toMatch(/^https:\/\/portal\.thebehumancompany\.ca\//);
    expect(auditCancelUrl()).toMatch(/^https:\/\/portal\.thebehumancompany\.ca\//);
  });

  test("payment_method_types never appears: dynamic methods stay enabled", () => {
    const encoded = new URLSearchParams(auditCheckoutParams(INPUT, "abcdefgh")).toString();
    expect(encoded).not.toContain("payment_method_types");
  });

  test("missing client or price fails loudly instead of charging an assumption", () => {
    expect(() => auditCheckoutParams({ clientId: "", priceId: "p" }, "abcdefgh")).toThrow();
    expect(() => auditCheckoutParams({ clientId: "c", priceId: "" }, "abcdefgh")).toThrow();
  });
});

describe("createAuditCheckoutSession", () => {
  const stubSession = (record: { params?: Record<string, string> }) => {
    return (async (_url: string | URL | Request, init?: RequestInit) => {
      record.params = Object.fromEntries(new URLSearchParams(init!.body as string));
      return {
        ok: true,
        status: 200,
        json: async () => ({
          id: "cs_test_probe",
          url: "https://checkout.stripe.com/pay/cs_test_probe",
        }),
      };
    }) as typeof fetch;
  };

  test("returns the session id and url from the injected suffix", async () => {
    const record: { params?: Record<string, string> } = {};
    const session = await createAuditCheckoutSession(INPUT, {
      config: { secretKey: "secret-for-tests-only" },
      fetchImpl: stubSession(record),
      integrationSuffix: "ijklmnop",
    });
    expect(session).toEqual({
      id: "cs_test_probe",
      url: "https://checkout.stripe.com/pay/cs_test_probe",
    });
    expect(record.params!["integration_identifier"]).toBe("portal-audit-ijklmnop");
  });

  test("unconfigured key fails before any request", async () => {
    let called = false;
    const counting = (async () => {
      called = true;
      throw new Error("must not be called");
    }) as typeof fetch;
    await expect(
      createAuditCheckoutSession(INPUT, { config: null, fetchImpl: counting }),
    ).rejects.toThrow("STRIPE_SECRET_KEY");
    expect(called).toBe(false);
  });

  test("a session without a url fails instead of handing back a dead link", async () => {
    const noUrl = (async () => ({
      ok: true,
      status: 200,
      json: async () => ({ id: "cs_test_nourl", url: null }),
    })) as typeof fetch;
    await expect(
      createAuditCheckoutSession(INPUT, { config: { secretKey: "k" }, fetchImpl: noUrl }),
    ).rejects.toThrow("without a url");
  });
});

const ELEMENTS_INPUT = {
  clientId: "acme-industrial",
  priceId: "price_test_audit",
  customerEmail: "payer@acme.test",
};

/**
 * The elements-mode session contract (funnel todo 1), empirically pinned
 * against Stripe TEST mode (test-results/elements-contract.md): the pinned
 * preview header rejects `ui_mode=elements` (needs a dahlia-era version), and
 * managed payments — default-on for this account — only supports
 * hosted/embedded, so elements sessions explicitly send `false`. The client
 * confirms on our origin with a `client_secret`, hence `return_url` instead of
 * success/cancel URLs, plus the immutable `customer_email` prefill and
 * `client_reference_id`.
 */
describe("elementsCheckoutParams", () => {
  test("exact elements form body: no success/cancel urls, client secret flow", () => {
    const params = elementsCheckoutParams(ELEMENTS_INPUT, "abcdefgh");
    expect(params).toEqual({
      mode: "payment",
      ui_mode: "elements",
      "line_items[0][price]": "price_test_audit",
      "line_items[0][quantity]": "1",
      return_url: auditSuccessUrl(),
      customer_email: "payer@acme.test",
      client_reference_id: "acme-industrial",
      "managed_payments[enabled]": "false",
      integration_identifier: "portal-audit-abcdefgh",
      "metadata[client_id]": "acme-industrial",
    });
  });

  test("success_url and cancel_url never appear in the encoded call", () => {
    const encoded = new URLSearchParams(
      elementsCheckoutParams(ELEMENTS_INPUT, "abcdefgh"),
    ).toString();
    expect(encoded).not.toContain("success_url");
    expect(encoded).not.toContain("cancel_url");
  });

  test("missing client, price, or email fails loudly instead of charging an assumption", () => {
    expect(() => elementsCheckoutParams({ ...ELEMENTS_INPUT, clientId: "" }, "abcdefgh")).toThrow();
    expect(() => elementsCheckoutParams({ ...ELEMENTS_INPUT, priceId: "" }, "abcdefgh")).toThrow();
    expect(() =>
      elementsCheckoutParams({ ...ELEMENTS_INPUT, customerEmail: "" }, "abcdefgh"),
    ).toThrow();
  });
});

describe("createElementsCheckoutSession", () => {
  /** Stripe-shaped elements session fixture; the secret is a test-only stub. */
  const SESSION_FIXTURE = `{
    "id": "cs_test_elements_probe",
    "object": "checkout.session",
    "ui_mode": "elements",
    "client_secret": "cs_secret_stub_never_ships"
  }`;

  const stubElementsSession = (record: {
    params?: Record<string, string>;
    headers?: Record<string, string>;
  }) => {
    return (async (_url: string | URL | Request, init?: RequestInit) => {
      record.params = Object.fromEntries(new URLSearchParams(init!.body as string));
      record.headers = Object.fromEntries(new Headers(init!.headers).entries());
      return {
        ok: true,
        status: 200,
        json: async () => JSON.parse(SESSION_FIXTURE),
      };
    }) as typeof fetch;
  };

  test("posts the exact elements body and returns the fixture client_secret", async () => {
    const record: { params?: Record<string, string>; headers?: Record<string, string> } = {};
    const session = await createElementsCheckoutSession(ELEMENTS_INPUT, {
      config: { secretKey: "secret-for-tests-only" },
      fetchImpl: stubElementsSession(record),
      integrationSuffix: "ijklmnop",
    });
    expect(session).toEqual({
      id: "cs_test_elements_probe",
      client_secret: "cs_secret_stub_never_ships",
    });
    expect(record.headers!["stripe-version"]).toBe("2026-08-26.dahlia");
    expect(record.params!["ui_mode"]).toBe("elements");
    expect(record.params!["mode"]).toBe("payment");
    expect(record.params!["line_items[0][price]"]).toBe("price_test_audit");
    expect(record.params!["return_url"]).toBe(auditSuccessUrl());
    expect(record.params!["customer_email"]).toBe("payer@acme.test");
    expect(record.params!["client_reference_id"]).toBe("acme-industrial");
    expect(record.params!["metadata[client_id]"]).toBe("acme-industrial");
    expect(record.params!["managed_payments[enabled]"]).toBe("false");
    expect(record.params!["integration_identifier"]).toBe("portal-audit-ijklmnop");
    expect(record.params!["success_url"]).toBeUndefined();
    expect(record.params!["cancel_url"]).toBeUndefined();
  });

  test("a Stripe error body surfaces as StripeApiError with no client_secret in it", async () => {
    const failing = (async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        error: { code: "parameter_unknown", message: "Unknown parameter: ui_mode" },
      }),
    })) as typeof fetch;
    let caught: unknown;
    try {
      await createElementsCheckoutSession(ELEMENTS_INPUT, {
        config: { secretKey: "k" },
        fetchImpl: failing,
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(StripeApiError);
    const typed = caught as StripeApiError;
    expect(typed.stripeCode).toBe("parameter_unknown");
    expect(String(typed)).not.toContain("cs_secret");
  });

  test("a rejected fetch propagates and never fabricates a client_secret", async () => {
    const rejecting = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    let caught: unknown;
    try {
      await createElementsCheckoutSession(ELEMENTS_INPUT, {
        config: { secretKey: "k" },
        fetchImpl: rejecting,
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(TypeError);
    expect(String(caught)).not.toContain("cs_secret");
  });

  test("unconfigured key fails before any request", async () => {
    let called = false;
    const counting = (async () => {
      called = true;
      throw new Error("must not be called");
    }) as typeof fetch;
    await expect(
      createElementsCheckoutSession(ELEMENTS_INPUT, { config: null, fetchImpl: counting }),
    ).rejects.toThrow("STRIPE_SECRET_KEY");
    expect(called).toBe(false);
  });
});

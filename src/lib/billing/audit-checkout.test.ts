import { describe, expect, test } from "bun:test";

import {
  auditCancelUrl,
  auditCheckoutParams,
  auditSuccessUrl,
  createAuditCheckoutSession,
} from "./audit-checkout";

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

  test("return URLs stay on the apex canonical origin", () => {
    expect(auditSuccessUrl()).toMatch(/^https:\/\/thebehumancompany\.ca\//);
    expect(auditCancelUrl()).toMatch(/^https:\/\/thebehumancompany\.ca\//);
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

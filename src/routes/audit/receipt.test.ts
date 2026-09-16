import { describe, expect, test } from "bun:test";

import {
  STRIPE_ELEMENTS_VERSION,
  StripeApiError,
  retrieveCheckoutSession,
} from "@/lib/billing/stripe-client";
import {
  amountLabel,
  auditReceiptFrom,
  fetchAuditReceipt,
  maskEmail,
  resolveAuditReceipt,
  type AuditReceipt,
} from "./receipt";

/**
 * The checkout return receipt (funnel todo 8), pinned offline.
 *
 * The Stripe call never happens in these tests: `resolveAuditReceipt` and
 * `retrieveCheckoutSession` both take an injected `fetchImpl`, mirroring the
 * billing module's seam discipline. What is pinned here:
 *
 * - the masked-email and money formatters (exact strings),
 * - the status contract: `complete` → paid receipt, `open`/`expired` →
 *   the not-completed retry contract — never a success receipt,
 * - the typed failure paths: Stripe 404 → `unknown-session`, any other
 *   Stripe error or transport failure → `unavailable`,
 * - the transport pins: one GET to the session path, the dahlia version
 *   header (sessions are created under it), Basic auth,
 * - the projection: the retrieve response's `client_secret` is stripped —
 *   a return page must never re-surface the confirmation secret.
 *
 * Synthetic values only; nothing here can reach Stripe.
 */

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const CONFIG = { secretKey: "secret-for-tests-only" };

describe("maskEmail", () => {
  test("keeps the first local character and masks the rest", () => {
    expect(maskEmail("farrah@example.com")).toBe("f***@example.com");
  });

  test("a single-character local part masks to itself", () => {
    expect(maskEmail("f@example.com")).toBe("f***@example.com");
  });

  test("a value without an @ masks to nothing useful", () => {
    expect(maskEmail("not-an-email")).toBe("***");
  });

  test("an empty domain masks to nothing useful", () => {
    expect(maskEmail("farrah@")).toBe("***");
  });
});

describe("amountLabel", () => {
  test("formats cents and currency as an unambiguous label", () => {
    expect(amountLabel(49500, "cad")).toBe("$495.00 CAD");
  });

  test("a missing amount or currency labels nothing", () => {
    expect(amountLabel(null, "cad")).toBeNull();
    expect(amountLabel(49500, null)).toBeNull();
  });

  test("an unparseable currency labels nothing instead of throwing", () => {
    expect(amountLabel(49500, "zz")).toBeNull();
  });
});

describe("auditReceiptFrom — the status contract", () => {
  test("a complete session renders the paid receipt with masked email and amount", () => {
    const receipt = auditReceiptFrom({
      id: "cs_test_1",
      status: "complete",
      payment_status: "paid",
      customer_email: "farrah@example.com",
      amount_total: 49500,
      currency: "cad",
    });

    expect(receipt).toEqual({
      kind: "paid",
      emailMasked: "f***@example.com",
      amountLabel: "$495.00 CAD",
    });
  });

  test("a complete session with no email or amount still renders the receipt", () => {
    const receipt = auditReceiptFrom({
      id: "cs_test_1",
      status: "complete",
      payment_status: null,
      customer_email: null,
      amount_total: null,
      currency: null,
    });

    expect(receipt).toEqual({ kind: "paid", emailMasked: null, amountLabel: null });
  });

  test("an open session renders the not-completed contract, never a receipt", () => {
    const receipt = auditReceiptFrom({
      id: "cs_test_1",
      status: "open",
      payment_status: "unpaid",
      customer_email: "farrah@example.com",
      amount_total: 49500,
      currency: "cad",
    });

    expect(receipt).toEqual({ kind: "incomplete" });
  });

  test("an expired session lands on the same not-completed contract", () => {
    const receipt = auditReceiptFrom({
      id: "cs_test_1",
      status: "expired",
      payment_status: "unpaid",
      customer_email: null,
      amount_total: null,
      currency: null,
    });

    expect(receipt).toEqual({ kind: "incomplete" });
  });
});

describe("retrieveCheckoutSession — the transport and the projection", () => {
  test("one GET to the session path with the dahlia header and Basic auth", async () => {
    const seen: { url?: string; init?: RequestInit } = {};
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      seen.url = String(url);
      seen.init = init;
      return jsonResponse(200, {
        id: "cs_test_1",
        status: "complete",
        payment_status: "paid",
        customer_email: "farrah@example.com",
        amount_total: 49500,
        currency: "cad",
      });
    }) as typeof fetch;

    const session = await retrieveCheckoutSession("cs_test_1", { config: CONFIG, fetchImpl });

    expect(seen.url).toBe("https://api.stripe.com/v1/checkout/sessions/cs_test_1");
    expect(seen.init?.method).toBe("GET");
    const headers = seen.init?.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe(`Basic ${btoa("secret-for-tests-only:")}`);
    expect(headers["Stripe-Version"]).toBe(STRIPE_ELEMENTS_VERSION);
    expect(session.status).toBe("complete");
  });

  test("the projection carries only the consumed fields — the confirmation secret is stripped", async () => {
    const fetchImpl = (async () =>
      jsonResponse(200, {
        id: "cs_test_1",
        status: "complete",
        payment_status: "paid",
        customer_email: "farrah@example.com",
        amount_total: 49500,
        currency: "cad",
        client_secret: "cs_secret_test_only_value",
        metadata: { client_id: "funnel-fixture" },
      })) as unknown as typeof fetch;

    const session = await retrieveCheckoutSession("cs_test_1", { config: CONFIG, fetchImpl });

    expect(session).toEqual({
      id: "cs_test_1",
      status: "complete",
      payment_status: "paid",
      customer_email: "farrah@example.com",
      amount_total: 49500,
      currency: "cad",
    });
    expect(Object.keys(session)).not.toContain("client_secret");
  });

  test("a missing key fails loudly before any request", async () => {
    let called = 0;
    const fetchImpl = (async () => {
      called += 1;
      return jsonResponse(200, {});
    }) as typeof fetch;

    await expect(retrieveCheckoutSession("cs_test_1", { config: null, fetchImpl })).rejects.toThrow(
      "STRIPE_SECRET_KEY is not set",
    );
    expect(called).toBe(0);
  });
});

describe("resolveAuditReceipt — the typed failure paths", () => {
  test("a Stripe 404 (tampered or unknown session id) resolves to unknown-session", async () => {
    const fetchImpl = (async () =>
      jsonResponse(404, {
        error: { code: "resource_missing", message: "No such checkout session" },
      })) as typeof fetch;

    expect(await resolveAuditReceipt("cs_test_tampered", { config: CONFIG, fetchImpl })).toEqual({
      kind: "unknown-session",
    });
  });

  test("a Stripe 5xx resolves to unavailable, never echoing the provider body", async () => {
    const fetchImpl = (async () =>
      jsonResponse(500, {
        error: { code: "internal", message: "provider internals that must not travel" },
      })) as typeof fetch;

    const receipt = await resolveAuditReceipt("cs_test_1", { config: CONFIG, fetchImpl });
    expect(receipt).toEqual({ kind: "unavailable" });
    expect(JSON.stringify(receipt)).not.toContain("provider internals");
  });

  test("a transport failure resolves to unavailable", async () => {
    const fetchImpl = (async () => {
      throw new Error("network gone");
    }) as unknown as typeof fetch;

    expect(await resolveAuditReceipt("cs_test_1", { config: CONFIG, fetchImpl })).toEqual({
      kind: "unavailable",
    });
  });

  test("the happy path maps a complete session through the same contract", async () => {
    const fetchImpl = (async () =>
      jsonResponse(200, {
        id: "cs_test_1",
        status: "complete",
        payment_status: "paid",
        customer_email: "farrah@example.com",
        amount_total: 49500,
        currency: "cad",
      })) as typeof fetch;

    const receipt: AuditReceipt = await resolveAuditReceipt("cs_test_1", {
      config: CONFIG,
      fetchImpl,
    });
    expect(receipt.kind).toBe("paid");
  });

  test("StripeApiError stays the typed carrier for other callers", () => {
    const error = new StripeApiError(402, "card_declined", "declined");
    expect(error.status).toBe(402);
  });
});

describe("the server function exists for the loader", () => {
  test("fetchAuditReceipt is defined", () => {
    expect(fetchAuditReceipt).toBeDefined();
  });
});

describe("the session id is guarded before it can touch the API path", () => {
  // The id travels from the URL into the request path. A charset guard keeps
  // traversal/metacharacter probes from ever being interpolated, and the
  // typed unknown-session answer keeps them indistinguishable from a
  // well-formed id Stripe simply does not know.
  test("a path-traversal id is unknown-session with ZERO requests", async () => {
    let called = 0;
    const fetchImpl = (async () => {
      called += 1;
      return jsonResponse(200, {});
    }) as typeof fetch;

    expect(
      await resolveAuditReceipt("../../v1/charges/ch_tamper", { config: CONFIG, fetchImpl }),
    ).toEqual({ kind: "unknown-session" });
    expect(called).toBe(0);
  });

  test("an id without the cs_ prefix is unknown-session without a request", async () => {
    let called = 0;
    const fetchImpl = (async () => {
      called += 1;
      return jsonResponse(200, {});
    }) as typeof fetch;

    expect(await resolveAuditReceipt("not-a-session-id", { config: CONFIG, fetchImpl })).toEqual({
      kind: "unknown-session",
    });
    expect(called).toBe(0);
  });
});

import { describe, expect, test } from "bun:test";

import {
  DECLINE_MESSAGE,
  FAILED_MESSAGE,
  confirmAuditPayment,
  requestCheckoutSession,
  resolveCheckoutPanel,
  type CheckoutConfirmResult,
} from "./audit-checkout-client";

/**
 * The checkout client's transport and confirm seams, asserted offline.
 *
 * Everything here runs on injected fetch implementations and fake confirm
 * functions — the same zero-network discipline as the init route's own
 * guard matrix (`src/routes/api/audit-checkout.*.test.ts`). The response
 * shapes are the route's contract: 200 `{clientSecret}`, 404 denial, 409
 * already-paid, and every other answer — 400, 500, 502, malformed bodies,
 * network failures — collapsing into one retryable "unavailable".
 *
 * The confirm seam pins the decline path (`4000 0000 0000 9995` semantics:
 * `code: "paymentFailed"`) to the exact inline message the panel renders,
 * and the happy path to a redirect outcome with the confirm call counted —
 * a silent no-op must never be able to pose as a completed payment.
 */

const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const fetchAnswering = (status: number, body: unknown) =>
  (async () => jsonResponse(status, body)) as typeof fetch;

describe("requestCheckoutSession — the init-route transport", () => {
  test("posts a body carrying only the token to /api/audit-checkout", async () => {
    const seen: { url?: string; init?: RequestInit } = {};
    const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
      seen.url = String(input);
      seen.init = init;
      return jsonResponse(200, { clientSecret: "cs_test_a" });
    }) as typeof fetch;

    await requestCheckoutSession({ identity: { kind: "token", token: "tok-123" }, fetchImpl });

    expect(seen.url).toBe("/api/audit-checkout");
    expect(seen.init?.method).toBe("POST");
    expect(seen.init?.body).toBe(JSON.stringify({ token: "tok-123" }));
  });

  test("the portal's session identity posts a source marker, never a token or client id", async () => {
    const seen: { init?: RequestInit } = {};
    const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
      seen.init = init;
      return jsonResponse(200, { clientSecret: "cs_test_a" });
    }) as typeof fetch;

    const state = await requestCheckoutSession({ identity: { kind: "session" }, fetchImpl });

    expect(state).toEqual({ status: "ready", clientSecret: "cs_test_a" });
    expect(seen.init?.body).toBe(JSON.stringify({ source: "portal" }));
  });

  test("a 200 {clientSecret} resolves ready with the secret carried", async () => {
    const state = await requestCheckoutSession({
      identity: { kind: "token", token: "tok-123" },
      fetchImpl: fetchAnswering(200, { clientSecret: "cs_test_secret" }),
    });

    expect(state).toEqual({ status: "ready", clientSecret: "cs_test_secret" });
  });

  test("a 404 denial resolves invalid — never ready", async () => {
    const state = await requestCheckoutSession({
      identity: { kind: "token", token: "tok-bad" },
      fetchImpl: fetchAnswering(404, { error: "This link is not valid" }),
    });

    expect(state).toEqual({ status: "invalid" });
  });

  test("a 409 replay resolves paid", async () => {
    const state = await requestCheckoutSession({
      identity: { kind: "token", token: "tok-123" },
      fetchImpl: fetchAnswering(409, { error: "This audit is already paid." }),
    });

    expect(state).toEqual({ status: "paid" });
  });

  test("400 is its own state — the record has no contact email", async () => {
    const state = await requestCheckoutSession({
      identity: { kind: "token", token: "tok-123" },
      fetchImpl: fetchAnswering(400, {
        error: "This client record has no contact email, so checkout cannot be initialized.",
      }),
    });

    expect(state).toEqual({ status: "no-email" });
  });

  test("500 and 502 resolve unavailable", async () => {
    for (const status of [500, 502]) {
      const state = await requestCheckoutSession({
        identity: { kind: "token", token: "tok-123" },
        fetchImpl: fetchAnswering(status, { error: "whatever the route says" }),
      });

      expect(state).toEqual({ status: "unavailable" });
    }
  });

  test("an unparseable 200 body resolves unavailable, never ready", async () => {
    const fetchImpl = (async () => new Response("not json", { status: 200 })) as typeof fetch;

    const state = await requestCheckoutSession({
      identity: { kind: "token", token: "tok-123" },
      fetchImpl,
    });

    expect(state).toEqual({ status: "unavailable" });
  });

  test("a 200 body without a usable clientSecret resolves unavailable", async () => {
    const state = await requestCheckoutSession({
      identity: { kind: "token", token: "tok-123" },
      fetchImpl: fetchAnswering(200, { secret: "wrongly-named" }),
    });

    expect(state).toEqual({ status: "unavailable" });
  });

  test("a network failure resolves unavailable instead of throwing", async () => {
    const fetchImpl = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;

    const state = await requestCheckoutSession({
      identity: { kind: "token", token: "tok-123" },
      fetchImpl,
    });

    expect(state).toEqual({ status: "unavailable" });
  });
});

describe("resolveCheckoutPanel — the init answer mapped onto the panel", () => {
  test("a ready session with a publishable key arms the panel with both", async () => {
    const panel = await resolveCheckoutPanel({
      identity: { kind: "token", token: "tok-123" },
      publishableKey: "pk_test_123",
      fetchImpl: fetchAnswering(200, { clientSecret: "cs_test_secret" }),
    });

    expect(panel).toEqual({
      kind: "ready",
      clientSecret: "cs_test_secret",
      publishableKey: "pk_test_123",
    });
  });

  test("a ready session without a publishable key stays unavailable — Stripe cannot init", async () => {
    const panel = await resolveCheckoutPanel({
      identity: { kind: "token", token: "tok-123" },
      publishableKey: "",
      fetchImpl: fetchAnswering(200, { clientSecret: "cs_test_secret" }),
    });

    expect(panel).toEqual({ kind: "unavailable" });
  });

  test("a 404 denial maps to the invalid panel", async () => {
    const panel = await resolveCheckoutPanel({
      identity: { kind: "token", token: "tok-bad" },
      publishableKey: "pk_test_123",
      fetchImpl: fetchAnswering(404, { error: "This link is not valid" }),
    });

    expect(panel).toEqual({ kind: "invalid" });
  });

  test("a 400 no-email record maps to the no-email panel", async () => {
    const panel = await resolveCheckoutPanel({
      identity: { kind: "token", token: "tok-123" },
      publishableKey: "pk_test_123",
      fetchImpl: fetchAnswering(400, { error: "This client record has no contact email…" }),
    });

    expect(panel).toEqual({ kind: "no-email" });
  });
});

describe("confirmAuditPayment — the confirm seam", () => {
  const confirmResolving = (result: CheckoutConfirmResult) => {
    let calls = 0;
    const confirm = async () => {
      calls += 1;
      return result;
    };
    return { confirm, calls: () => calls };
  };

  test("a success resolves redirected with confirm invoked exactly once", async () => {
    const { confirm, calls } = confirmResolving({ type: "success" });

    const outcome = await confirmAuditPayment(confirm);

    expect(calls()).toBe(1);
    expect(outcome).toEqual({ kind: "redirected" });
  });

  test("a declined card resolves the inline decline message", async () => {
    // 4000 0000 0000 9995 semantics: confirm answers paymentFailed with a
    // generic decline code instead of redirecting.
    const { confirm } = confirmResolving({
      type: "error",
      error: {
        message: "Your card was declined.",
        code: "paymentFailed",
        paymentFailed: { declineCode: "generic_card" },
      },
    });

    const outcome = await confirmAuditPayment(confirm);

    expect(outcome).toEqual({ kind: "declined", message: DECLINE_MESSAGE });
  });

  test("a paymentFailed with no decline code still resolves the decline message", async () => {
    const { confirm } = confirmResolving({
      type: "error",
      error: {
        message: "Your card was declined.",
        code: "paymentFailed",
        paymentFailed: { declineCode: null },
      },
    });

    const outcome = await confirmAuditPayment(confirm);

    expect(outcome).toEqual({ kind: "declined", message: DECLINE_MESSAGE });
  });

  test("any other error resolves the generic failure message", async () => {
    const { confirm } = confirmResolving({
      type: "error",
      error: { message: "Incomplete fields.", code: null },
    });

    const outcome = await confirmAuditPayment(confirm);

    expect(outcome).toEqual({ kind: "failed", message: FAILED_MESSAGE });
  });

  test("the decline and failure messages differ — a decline is never mislabelled", () => {
    expect(DECLINE_MESSAGE).not.toBe(FAILED_MESSAGE);
  });
});

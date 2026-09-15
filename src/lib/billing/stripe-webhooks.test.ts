import { describe, expect, test } from "bun:test";

import {
  parseWebhookEvent,
  releasePaidAccess,
  routeWebhookEvent,
  stripeTestSignature,
  verifyStripeSignature,
  type StripeWebhookEvent,
} from "./stripe-webhooks";

/**
 * Webhook verification and routing (US-011), pinned without Stripe.
 *
 * The signature round-trip uses the real HMAC (sign here, verify there),
 * so a passing suite means the production check accepts Stripe and rejects
 * everything else — not that two copies of a pasted constant agree.
 * Fulfillment is observed through an injected release function, never a
 * database.
 */

const SECRET = "webhook-secret-for-tests-only";
const PAYLOAD = JSON.stringify({ id: "evt_probe", type: "checkout.session.completed" });

async function signedHeader(secret: string, payload: string, timestamp: number): Promise<string> {
  return stripeTestSignature(secret, payload, timestamp);
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

function paidCompleted(clientId = "acme-industrial"): StripeWebhookEvent {
  return {
    id: "evt_paid",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_paid",
        payment_status: "paid",
        customer: "cus_test_acme",
        metadata: { client_id: clientId },
      },
    },
  };
}

describe("verifyStripeSignature", () => {
  test("accepts a correctly signed fresh delivery", async () => {
    const header = await signedHeader(SECRET, PAYLOAD, nowSeconds());
    expect(await verifyStripeSignature(PAYLOAD, header, SECRET)).toBe(true);
  });

  test("rejects wrong secret, missing header, and garbage", async () => {
    const header = await signedHeader(SECRET, PAYLOAD, nowSeconds());
    expect(await verifyStripeSignature(PAYLOAD, header, "webhook-secret-wrong")).toBe(false);
    expect(await verifyStripeSignature(PAYLOAD, null, SECRET)).toBe(false);
    expect(await verifyStripeSignature(PAYLOAD, "not-a-signature", SECRET)).toBe(false);
  });

  test("rejects replays outside the tolerance window", async () => {
    const stale = await signedHeader(SECRET, PAYLOAD, nowSeconds() - 3600);
    expect(await verifyStripeSignature(PAYLOAD, stale, SECRET)).toBe(false);
  });

  test("accepts any matching v1 during secret rotation", async () => {
    const timestamp = nowSeconds();
    const first = await signedHeader("webhook-secret-old", PAYLOAD, timestamp);
    const second = await signedHeader(SECRET, PAYLOAD, timestamp);
    const rotated = `${first.split(",")[0]},${first.split(",")[1]},${second.split(",")[1]}`;
    expect(await verifyStripeSignature(PAYLOAD, rotated, SECRET)).toBe(true);
  });
});

describe("parseWebhookEvent", () => {
  test("rejects malformed and shapeless bodies", () => {
    expect(parseWebhookEvent("not json")).toBeNull();
    expect(parseWebhookEvent(JSON.stringify({ type: "x" }))).toBeNull();
    expect(
      parseWebhookEvent(JSON.stringify({ id: "e", type: "x", data: { object: { no: "id" } } })),
    ).toBeNull();
  });
});

describe("routeWebhookEvent", () => {
  test("paid completion releases with client, customer, and session", async () => {
    const releases: unknown[] = [];
    const outcome = await routeWebhookEvent(paidCompleted(), {
      releasePaidAccess: async (release) => {
        releases.push(release);
      },
    });
    expect(outcome).toEqual({ handled: true, action: "released", clientId: "acme-industrial" });
    expect(releases).toEqual([
      {
        clientId: "acme-industrial",
        stripeCustomerId: "cus_test_acme",
        stripeSessionId: "cs_test_paid",
      },
    ]);
  });

  test("async succeeded also releases; failed and unknown types never touch release", async () => {
    const releases: unknown[] = [];
    const recorder = { releasePaidAccess: async (r: unknown) => void releases.push(r) };
    const succeeded: StripeWebhookEvent = {
      ...paidCompleted(),
      id: "evt_succeeded",
      type: "checkout.session.async_payment_succeeded",
    };
    expect((await routeWebhookEvent(succeeded, recorder)).action).toBe("released");
    const failed: StripeWebhookEvent = {
      ...paidCompleted(),
      id: "evt_failed",
      type: "checkout.session.async_payment_failed",
    };
    expect(await routeWebhookEvent(failed, recorder)).toEqual({
      handled: true,
      action: "failed-event",
    });
    const other: StripeWebhookEvent = {
      ...paidCompleted(),
      id: "evt_other",
      type: "customer.created",
    };
    expect(await routeWebhookEvent(other, recorder)).toEqual({
      handled: true,
      action: "ignored-type",
    });
    expect(releases).toHaveLength(1);
  });

  test("unpaid completion and missing client never release (still safe to 200)", async () => {
    let called = 0;
    const recorder = { releasePaidAccess: async () => void called++ };
    const unpaid = paidCompleted();
    unpaid.data.object.payment_status = "unpaid";
    expect(await routeWebhookEvent(unpaid, recorder)).toEqual({
      handled: true,
      action: "skipped-unpaid",
    });
    const noClient = paidCompleted();
    noClient.data.object.metadata = {};
    expect(await routeWebhookEvent(noClient, recorder)).toEqual({
      handled: false,
      reason: "missing-client",
    });
    expect(called).toBe(0);
  });
});

describe("releasePaidAccess", () => {
  const stubPost = (record: { url?: string; init?: RequestInit }) => {
    return (async (url: string | URL | Request, init?: RequestInit) => {
      record.url = url.toString();
      record.init = init;
      return { ok: true, status: 201, json: async () => [] };
    }) as typeof fetch;
  };

  test("upserts unlock plus mapping without touching staged content", async () => {
    const record: { url?: string; init?: RequestInit } = {};
    await releasePaidAccess(
      { clientId: "acme-industrial", stripeCustomerId: "cus_x", stripeSessionId: "cs_x" },
      {
        supabaseUrl: "https://xyzcompany.supabase.co",
        supabaseServiceRoleKey: "service-role-for-tests-only",
        fetchImpl: stubPost(record),
      },
    );
    expect(record.url).toContain("/rest/v1/client_paid_reports?on_conflict=client_id");
    const headers = record.init!.headers as Record<string, string>;
    expect(headers["Prefer"]).toBe("resolution=merge-duplicates");
    expect(headers["Authorization"]).toBe("Bearer service-role-for-tests-only");
    const body = JSON.parse(record.init!.body as string);
    expect(body.client_id).toBe("acme-industrial");
    expect(body.unlocked).toBe(true);
    expect(body.stripe_customer_id).toBe("cus_x");
    expect(body.stripe_session_id).toBe("cs_x");
    expect(body).not.toHaveProperty("title");
    expect(body).not.toHaveProperty("html");
    expect(typeof body.unlocked_at).toBe("string");
  });

  test("transport failure throws; missing config fails before any request", async () => {
    const failing = (async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    })) as typeof fetch;
    await expect(
      releasePaidAccess(
        { clientId: "c", stripeCustomerId: null, stripeSessionId: "s" },
        { supabaseUrl: "https://x.supabase.co", supabaseServiceRoleKey: "k", fetchImpl: failing },
      ),
    ).rejects.toThrow("answered 500");
    let called = false;
    await expect(
      releasePaidAccess(
        { clientId: "c", stripeCustomerId: null, stripeSessionId: "s" },
        {
          fetchImpl: (async () => {
            called = true;
            throw new Error("must not be called");
          }) as typeof fetch,
        },
      ),
    ).rejects.toThrow();
    expect(called).toBe(false);
  });
});

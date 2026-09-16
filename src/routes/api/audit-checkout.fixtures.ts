import type { ClientRecord } from "@/lib/client-portal/tokens";
import type { SupabasePaidReport } from "@/lib/client-portal/supabase-tokens";

import { handleAuditCheckout } from "./audit-checkout";

/**
 * The shared seams for the audit-checkout route's guard-matrix tests.
 *
 * Not a test file (bun collects nothing here): both matrix files import the
 * same fixtures so a seam change cannot desync one suite from the other.
 * Values are synthetic — generated or obviously-fake — so no real token,
 * key, or secret ever lands in the repo through these tests.
 */

/** 32 random bytes, base64url — generated, never a committed literal. */
export const TOKEN = Buffer.from(crypto.getRandomValues(new Uint8Array(32)))
  .toString("base64")
  .replace(/\+/g, "-")
  .replace(/\//g, "_")
  .replace(/=+$/, "");

export const CLIENT_ID = "funnel-fixture";
export const EMAIL = "funnel-fixture@example.test";
export const PRICE_ID = "price_test_audit";
export const SECRET = "cs_secret_test_only_value";

export const RECORD: ClientRecord = {
  id: CLIENT_ID,
  name: "The Funnel Fixture Co",
  token: TOKEN,
  title: "The Funnel Fixture Co — Preliminary Blueprint",
  html: "<p>fixture</p>",
};

/** A record carrying a contact email, as production demo clients now do. */
export const EMAILED_CLIENT_ID = "funnel-fixture-emailed";
export const EMAILED_RECORD: ClientRecord = {
  ...RECORD,
  id: EMAILED_CLIENT_ID,
  email: "client-contact@example.test",
};

export const CONFIG = {
  url: "https://fixture.supabase.test",
  serviceRoleKey: "service-role-key-for-tests-only",
};

export const STRIPE_CONFIG = { secretKey: "secret-for-tests-only" };

export const jsonResponse = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export interface StubCalls {
  tokenLookups: number;
  paidReads: number;
  stripeCreates: number;
}

export const freshCalls = (): StubCalls => ({ tokenLookups: 0, paidReads: 0, stripeCreates: 0 });

export const configuredFetch = (
  paid: SupabasePaidReport | null,
  calls: StubCalls = freshCalls(),
  clientId: string = CLIENT_ID,
): typeof fetch =>
  (async (url: string | URL | Request) => {
    const target = String(url);
    if (target.includes("client_portal_tokens")) {
      calls.tokenLookups += 1;
      return jsonResponse(200, [{ client_id: clientId, revoked_at: null }]);
    }
    if (target.includes("client_paid_reports")) {
      calls.paidReads += 1;
      return jsonResponse(200, paid ? [paid] : []);
    }
    if (target.includes("api.stripe.com")) {
      calls.stripeCreates += 1;
      return jsonResponse(200, { id: "cs_test_probe", client_secret: SECRET });
    }
    return jsonResponse(500, { message: "unexpected url in test stub" });
  }) as typeof fetch;

export const post = (body: unknown, deps: Parameters<typeof handleAuditCheckout>[1] = {}) =>
  handleAuditCheckout(
    new Request("https://site.test/api/audit-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    deps,
  );

export const UNCONFIGURED = {
  supabaseConfig: null as null,
  readStore: async () => [RECORD],
  priceId: PRICE_ID,
  email: EMAIL,
  stripeConfig: STRIPE_CONFIG,
  fetchImpl: configuredFetch(null),
  env: {} as Record<string, string | undefined>,
};

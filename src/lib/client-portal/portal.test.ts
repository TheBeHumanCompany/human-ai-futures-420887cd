import { describe, expect, test } from "bun:test";

import { loadPortalReports } from "./portal";
import type { ClerkScopedReport } from "./supabase-clerk";

/**
 * The portal loader's decision table (US-009), pinned without Clerk or
 * Supabase: no user redirects, a user with a token reads exactly what the
 * stub answers (or honestly nothing), and everything short of a readable
 * token or a complete configuration throws — a half-broken session must
 * never render as an empty portal.
 */

const CONFIG = { url: "https://xyzcompany.supabase.co", anonKey: "anon-for-tests-only" };

const ROWS: ClerkScopedReport[] = [
  {
    client_id: "acme-industrial",
    title: "The full blueprint",
    html: "<p>Body</p>",
    unlocked: true,
    unlocked_at: null,
  },
];

function stubFetch(rows: unknown, ok = true, status = 200) {
  return (async () => ({ ok, status, json: async () => rows })) as typeof fetch;
}

const authed = { userId: "user_paid_1", getToken: async () => "clerk-session-token" };

describe("loadPortalReports", () => {
  test("no signed-in user redirects without fetching a token or a row", async () => {
    let tokenCalls = 0;
    const outcome = await loadPortalReports({
      userId: null,
      getToken: async () => {
        tokenCalls++;
        return "never";
      },
    });
    expect(outcome).toEqual({ status: "redirect" });
    expect(tokenCalls).toBe(0);
  });

  test("a signed-in user with granted rows gets them back", async () => {
    const outcome = await loadPortalReports(authed, {
      supabaseConfig: CONFIG,
      fetchImpl: stubFetch(ROWS),
    });
    expect(outcome).toEqual({ status: "ok", reports: ROWS });
  });

  test("an honest zero-row account is ok, not an error", async () => {
    const outcome = await loadPortalReports(
      { userId: "user_prospect", getToken: async () => "clerk-session-token" },
      { supabaseConfig: CONFIG, fetchImpl: stubFetch([]) },
    );
    expect(outcome).toEqual({ status: "ok", reports: [] });
  });

  test("a session without a token throws rather than rendering empty", async () => {
    await expect(
      loadPortalReports(
        { userId: "user_paid_1", getToken: async () => null },
        {
          supabaseConfig: CONFIG,
          fetchImpl: stubFetch(ROWS),
        },
      ),
    ).rejects.toThrow("no token");
  });

  test("missing configuration fails closed before any request", async () => {
    let called = false;
    await expect(
      loadPortalReports(authed, {
        supabaseConfig: null,
        fetchImpl: (async () => {
          called = true;
          return { ok: true, status: 200, json: async () => [] };
        }) as typeof fetch,
      }),
    ).rejects.toThrow("SUPABASE");
    expect(called).toBe(false);
  });

  test("a denied read propagates — the page fails closed, not empty", async () => {
    await expect(
      loadPortalReports(authed, { supabaseConfig: CONFIG, fetchImpl: stubFetch([], false, 403) }),
    ).rejects.toThrow("answered 403");
  });
});

import { describe, expect, test } from "bun:test";

import {
  SUPABASE_ANON_ENV,
  SUPABASE_URL_ENV,
  clerkSupabaseConfigFromEnv,
  fetchClerkScopedPaidReports,
} from "./supabase-clerk";

/**
 * The Clerk-token read path (US-009), pinned without Supabase.
 *
 * The contract under test has two halves: the request is shape-honest —
 * RLS is the only filter, so no equality predicate may appear, or the
 * client would be claiming an identity the database never granted — and
 * the parse is render-honest: incomplete rows vanish rather than
 * rendering half a tab. A denial must throw (status only), never resolve
 * to an empty portal.
 */

const CONFIG = { url: "https://xyzcompany.supabase.co", anonKey: "anon-for-tests-only" };

function stubFetch(
  record: { url?: string; init?: RequestInit },
  body: unknown,
  ok = true,
  status = 200,
) {
  return (async (url: string | URL | Request, init?: RequestInit) => {
    record.url = url.toString();
    record.init = init;
    return { ok, status, json: async () => body };
  }) as typeof fetch;
}

describe("clerkSupabaseConfigFromEnv", () => {
  test("reads both values, trims, and strips trailing slashes", () => {
    expect(
      clerkSupabaseConfigFromEnv({
        [SUPABASE_URL_ENV]: " https://xyzcompany.supabase.co/ ",
        [SUPABASE_ANON_ENV]: " anon-key ",
      }),
    ).toEqual({ url: "https://xyzcompany.supabase.co", anonKey: "anon-key" });
  });

  test("either value absent answers null (a half-configured read never runs)", () => {
    expect(clerkSupabaseConfigFromEnv({ [SUPABASE_URL_ENV]: "https://x.supabase.co" })).toBeNull();
    expect(clerkSupabaseConfigFromEnv({ [SUPABASE_ANON_ENV]: "k" })).toBeNull();
    expect(clerkSupabaseConfigFromEnv({})).toBeNull();
  });
});

describe("fetchClerkScopedPaidReports", () => {
  test("sends the Clerk token as the bearer and no equality filter", async () => {
    const record: { url?: string; init?: RequestInit } = {};
    const rows = [
      {
        client_id: "acme-industrial",
        title: "The full blueprint",
        html: "<p>Body</p>",
        unlocked: true,
        unlocked_at: "2026-09-14T00:00:00Z",
      },
    ];
    const reports = await fetchClerkScopedPaidReports(
      "clerk-session-token-for-tests",
      CONFIG,
      stubFetch(record, rows),
    );
    expect(reports).toEqual([
      {
        client_id: "acme-industrial",
        title: "The full blueprint",
        html: "<p>Body</p>",
        unlocked: true,
        unlocked_at: "2026-09-14T00:00:00Z",
      },
    ]);

    const decoded = decodeURIComponent(record.url!);
    expect(decoded).toContain("/rest/v1/client_paid_reports?");
    expect(decoded).toContain("select=client_id,title,html,unlocked,unlocked_at");
    expect(decoded).toContain("order=unlocked_at.desc");
    // RLS is the only filter: no client_id=eq., no clerk_user_id=eq.
    expect(decoded).not.toContain("eq.");

    const headers = record.init!.headers as Record<string, string>;
    expect(headers["apikey"]).toBe("anon-for-tests-only");
    expect(headers["Authorization"]).toBe("Bearer clerk-session-token-for-tests");
  });

  test("drops malformed and incomplete rows instead of rendering halves", async () => {
    const rows = [
      { client_id: "good", title: "Full", html: "<p>x</p>", unlocked: true, unlocked_at: null },
      { client_id: "no-html", title: "Half", html: null, unlocked: true, unlocked_at: null },
      {
        client_id: "blank-title",
        title: "  ",
        html: "<p>x</p>",
        unlocked: true,
        unlocked_at: null,
      },
      { client_id: "", title: "No id", html: "<p>x</p>", unlocked: true, unlocked_at: null },
      {
        client_id: "locked",
        title: "Locked",
        html: "<p>x</p>",
        unlocked: false,
        unlocked_at: null,
      },
      { title: "Not an object shape", html: "<p>x</p>", unlocked: true },
      "not even an object",
    ];
    const reports = await fetchClerkScopedPaidReports(
      "tok",
      CONFIG,
      stubFetch({ url: undefined, init: undefined }, rows),
    );
    expect(reports).toEqual([
      { client_id: "good", title: "Full", html: "<p>x</p>", unlocked: true, unlocked_at: null },
    ]);
  });

  test("a denial throws status-only; a non-array body is empty, not a throw", async () => {
    await expect(
      fetchClerkScopedPaidReports("tok", CONFIG, stubFetch({}, { message: "denied" }, false, 403)),
    ).rejects.toThrow("answered 403");
    const empty = await fetchClerkScopedPaidReports("tok", CONFIG, stubFetch({}, { data: 7 }));
    expect(empty).toEqual([]);
  });
});

import { describe, expect, test } from "bun:test";

import { fetchPaidReport } from "./supabase-tokens";
import { fetchClientPageByTokenFn, PAID_REPORT_ID, type ClientRecord } from "./tokens";

/**
 * The Stripe-released paid tab (US-011), pinned without a database.
 *
 * The read path gains one conditional tab: unlocked row plus complete staged
 * content appends `paid`, everything else renders exactly as before. The
 * stub below dispatches by URL so the token lookup and the paid fetch each
 * see their own fixture, mirroring two PostgREST tables.
 */

const CONFIG = {
  url: "https://xyzcompany.supabase.co",
  serviceRoleKey: "service-role-for-tests-only",
};

const ACME_TOKEN = "a".repeat(64);

function storeWith(reports?: ClientRecord["reports"]): ClientRecord[] {
  return [
    {
      id: "acme-industrial",
      name: "Acme Industrial",
      token: ACME_TOKEN,
      title: "Acme preliminary",
      html: "<p>ACME-FIXTURE-MARKER-7f3a91</p>",
      ...(reports === undefined ? {} : { reports }),
    } as ClientRecord,
  ];
}

function dispatchFetch(paidRows: unknown[]) {
  return (async (url: string | URL | Request) => {
    const target = url.toString();
    const rows = target.includes("client_paid_reports")
      ? paidRows
      : [{ client_id: "acme-industrial", revoked_at: null }];
    return { ok: true, status: 200, json: async () => rows };
  }) as typeof fetch;
}

const base = {
  supabaseConfig: CONFIG,
  readStore: async () => storeWith(),
};

describe("fetchPaidReport", () => {
  test("returns the row when present", async () => {
    const row = await fetchPaidReport(
      "acme-industrial",
      CONFIG,
      dispatchFetch([{ title: "Paid", html: "<p>PAID</p>", unlocked: true }]),
    );
    expect(row).toEqual({ title: "Paid", html: "<p>PAID</p>", unlocked: true });
  });

  test("empty table parses to null, transport failure throws", async () => {
    expect(await fetchPaidReport("acme-industrial", CONFIG, dispatchFetch([]))).toBeNull();
    const failing = (async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    })) as typeof fetch;
    await expect(fetchPaidReport("acme-industrial", CONFIG, failing)).rejects.toThrow(
      "answered 500",
    );
  });
});

describe("paid tab on the resolved page", () => {
  test("unlocked row with complete content appends the paid tab", async () => {
    const page = await fetchClientPageByTokenFn(ACME_TOKEN, {
      ...base,
      fetchImpl: dispatchFetch([
        { title: "Acme paid", html: "<p>ACME-PAID-9d4e22</p>", unlocked: true },
      ]),
    });
    const ids = page!.reports.map((report) => report.id);
    expect(ids).toContain(PAID_REPORT_ID);
    expect(page!.html).toContain("ACME-PAID-9d4e22");
    expect(page!.html).toContain("ACME-FIXTURE-MARKER-7f3a91");
  });

  test("locked, incomplete, and absent rows render exactly the pre-US-011 page", async () => {
    for (const paidRows of [
      [{ title: "Acme paid", html: "<p>ACME-PAID-9d4e22</p>", unlocked: false }],
      [{ title: null, html: "<p>ACME-PAID-9d4e22</p>", unlocked: true }],
      [{ title: "Acme paid", html: "", unlocked: true }],
      [],
    ]) {
      const page = await fetchClientPageByTokenFn(ACME_TOKEN, {
        ...base,
        fetchImpl: dispatchFetch(paidRows),
      });
      expect(page!.reports.map((report) => report.id)).not.toContain(PAID_REPORT_ID);
      expect(page!.html).not.toContain("ACME-PAID-9d4e22");
    }
  });

  test("a hand-published store paid tab is never duplicated", async () => {
    const page = await fetchClientPageByTokenFn(ACME_TOKEN, {
      supabaseConfig: CONFIG,
      readStore: async () =>
        storeWith([{ id: "paid", title: "Hand paid", html: "<p>HAND-PAID</p>" }]),
      fetchImpl: dispatchFetch([{ title: "Auto paid", html: "<p>AUTO-PAID</p>", unlocked: true }]),
    });
    const paid = page!.reports.filter((report) => report.id === PAID_REPORT_ID);
    expect(paid).toHaveLength(1);
    expect(paid[0]!.html).toContain("HAND-PAID");
  });

  test("paid-fetch transport failure still resolves the earned page", async () => {
    const explodeOnPaid = (async (url: string | URL | Request) => {
      if (url.toString().includes("client_paid_reports")) {
        return { ok: false, status: 500, json: async () => ({}) };
      }
      return {
        ok: true,
        status: 200,
        json: async () => [{ client_id: "acme-industrial", revoked_at: null }],
      };
    }) as typeof fetch;
    const page = await fetchClientPageByTokenFn(ACME_TOKEN, { ...base, fetchImpl: explodeOnPaid });
    expect(page!.reports.map((report) => report.id)).not.toContain(PAID_REPORT_ID);
    expect(page!.html).toContain("ACME-FIXTURE-MARKER-7f3a91");
  });
});

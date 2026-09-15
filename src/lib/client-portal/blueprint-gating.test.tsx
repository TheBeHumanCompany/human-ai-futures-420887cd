import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ClientReports } from "@/components/client-portal/client-reports";

import { fetchClientPageByTokenFn, type ClientRecord } from "./tokens";

/**
 * The paywall, end to end: token in, page out, nothing withheld anywhere along
 * the way.
 *
 * This is the test that matters. The magic-link path reads with the
 * service-role key, which bypasses RLS, so Postgres is not the boundary here —
 * `applyTier` inside `fetchBlueprintSections` is. These assertions pin the
 * consequence rather than the mechanism: the paid marker must be absent from
 * the resolved `ClientPage`, and absent again from the markup SSR produces from
 * it. A refactor that moves the gate into the component would still pass the
 * first assertion and fail the second.
 *
 * Stub dispatches by URL, mirroring three PostgREST tables, exactly as
 * `paid-reports.test.ts` does for two.
 */

const CONFIG = {
  url: "https://xyzcompany.supabase.co",
  serviceRoleKey: "service-role-for-tests-only",
};

const TOKEN = "a".repeat(64);
const PAID = "PAID-SECTION-MARKER-6b21ff";
const FREE = "FREE-SECTION-MARKER-1d90ac";

const STORE: ClientRecord[] = [
  {
    id: "acme-industrial",
    name: "Acme Industrial",
    token: TOKEN,
    title: "Acme — Blueprint",
    html: "<p>legacy body</p>",
  } as ClientRecord,
];

const SECTION_ROWS = [
  {
    id: "aaaaaaaa-0000-0000-0000-000000000001",
    section_key: "operating-reality",
    ordinal: 1,
    tier: "preliminary",
    title: "The operating reality",
    band: "prose",
    body: { blocks: [{ type: "prose", paragraphs: [FREE] }] },
  },
  {
    id: "aaaaaaaa-0000-0000-0000-000000000002",
    section_key: "implementation",
    ordinal: 2,
    tier: "final",
    title: "How to build it",
    teaser: "Eight more topics, in the order they bind.",
    band: "prose",
    body: { blocks: [{ type: "prose", paragraphs: [PAID] }] },
  },
];

const dispatch = (unlocked: boolean, sectionRows: unknown[] = SECTION_ROWS) =>
  (async (url: string | URL | Request) => {
    const target = url.toString();
    if (target.includes("client_blueprint_sections")) {
      return { ok: true, status: 200, json: async () => sectionRows };
    }
    if (target.includes("client_paid_reports")) {
      return {
        ok: true,
        status: 200,
        json: async () => [{ title: "Paid", html: "<p>paid</p>", unlocked }],
      };
    }
    return {
      ok: true,
      status: 200,
      json: async () => [{ client_id: "acme-industrial", revoked_at: null }],
    };
  }) as typeof fetch;

const pageFor = (unlocked: boolean, sectionRows?: unknown[]) =>
  fetchClientPageByTokenFn(TOKEN, {
    supabaseConfig: CONFIG,
    readStore: async () => STORE,
    fetchImpl: dispatch(unlocked, sectionRows),
  });

describe("unpaid client", () => {
  test("the withheld section body is absent from the resolved page", async () => {
    const page = (await pageFor(false))!;
    expect(JSON.stringify(page)).not.toContain(PAID);
    expect(JSON.stringify(page)).toContain(FREE);
  });

  test("and absent from the markup SSR would send", async () => {
    const page = (await pageFor(false))!;
    const html = renderToStaticMarkup(<ClientReports page={page} />);
    expect(html).not.toContain(PAID);
    expect(html).toContain(FREE);
    // The lock still sells: the title and teaser are on the page.
    expect(html).toContain("How to build it");
    expect(html).toContain("Eight more topics, in the order they bind.");
  });
});

describe("paid client", () => {
  test("the section body resolves and renders", async () => {
    const page = (await pageFor(true))!;
    expect(JSON.stringify(page)).toContain(PAID);
    const html = renderToStaticMarkup(<ClientReports page={page} />);
    expect(html).toContain(PAID);
  });
});

describe("degradation", () => {
  test("a blueprint read that fails leaves the authored reports intact", async () => {
    const explodeOnSections = (async (url: string | URL | Request) => {
      const target = url.toString();
      if (target.includes("client_blueprint_sections")) {
        return { ok: false, status: 500, json: async () => ({}) };
      }
      if (target.includes("client_paid_reports")) {
        return { ok: true, status: 200, json: async () => [] };
      }
      return {
        ok: true,
        status: 200,
        json: async () => [{ client_id: "acme-industrial", revoked_at: null }],
      };
    }) as typeof fetch;

    const page = await fetchClientPageByTokenFn(TOKEN, {
      supabaseConfig: CONFIG,
      readStore: async () => STORE,
      fetchImpl: explodeOnSections,
    });

    expect(page).not.toBeNull();
    expect(page!.sections).toBeUndefined();
    expect(page!.reports).toHaveLength(1);
  });

  test("a client with no sections keeps the legacy HTML path", async () => {
    const page = (await pageFor(false, []))!;
    expect(page.sections).toBeUndefined();
    const html = renderToStaticMarkup(<ClientReports page={page} />);
    expect(html).toContain("legacy body");
  });
});

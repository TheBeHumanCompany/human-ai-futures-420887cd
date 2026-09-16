import { readFileSync } from "node:fs";

import { describe, expect, test } from "bun:test";

import fixtureStore from "../../../e2e/funnel/fixtures/clients.json";
import { companyInitial, resolvePortalCompany } from "./portal";
import type { ClientRecord } from "./tokens";
import type { ClerkScopedReport } from "./supabase-clerk";

/**
 * The portal header's company identity (todo 9, G3) wearing US-004's mark.
 *
 * `companyInitial` must derive exactly what `/c/$token`'s avatar derives —
 * trim, first character, uppercased, `?` for nothing — extended to tolerate
 * an absent name, because the portal's company record is optional where the
 * token-resolved page's name is not.
 *
 * `resolvePortalCompany` joins a client_id that only the RLS-scoped reports
 * read could have produced to the client store's display name, on the
 * injected `readStore` seam — the same discipline as `loadPortalReports`:
 * no Clerk, no Supabase, no filesystem. Every missing half (no reports, an
 * unknown id, a blank store name, an unreadable store) degrades to `null`
 * without throwing, so a nameless record can never take the page down.
 */

const FIXTURES = fixtureStore as unknown as ClientRecord[];

const ROW: ClerkScopedReport = {
  client_id: "funnel-fixture",
  title: "The Funnel Fixture Co — Final Blueprint",
  html: "<p>Body</p>",
  unlocked: true,
  unlocked_at: null,
};

describe("companyInitial — the US-004 derivation", () => {
  test("the fixture company resolves to its first character, uppercased", () => {
    expect(companyInitial("The Funnel Fixture Co")).toBe("T");
  });

  test("a lowercase name still resolves to an uppercase initial", () => {
    expect(companyInitial("acme industrial")).toBe("A");
  });

  test("whitespace is trimmed before the initial is taken", () => {
    expect(companyInitial("  Birch Bark Coffee  ")).toBe("B");
  });

  test("empty, blank, and missing names fall back without throwing", () => {
    expect(companyInitial("")).toBe("?");
    expect(companyInitial("   ")).toBe("?");
    expect(companyInitial(null)).toBe("?");
    expect(companyInitial(undefined)).toBe("?");
  });
});

describe("resolvePortalCompany", () => {
  test("the RLS-granted client_id joins to the fixture store's display name", async () => {
    const company = await resolvePortalCompany([ROW], { readStore: async () => FIXTURES });
    expect(company).toEqual({ id: "funnel-fixture", name: "The Funnel Fixture Co" });
  });

  test("the first report wins when a session owns several clients", async () => {
    const second: ClerkScopedReport = { ...ROW, client_id: "other-client" };
    const company = await resolvePortalCompany([ROW, second], {
      readStore: async () => [
        ...FIXTURES,
        { id: "other-client", name: "Other Client", token: "o".repeat(43), title: "t", html: "" },
      ],
    });
    expect(company?.name).toBe("The Funnel Fixture Co");
  });

  test("an honest zero-report account reads nothing and names nobody", async () => {
    let reads = 0;
    const company = await resolvePortalCompany([], {
      readStore: async () => {
        reads++;
        return FIXTURES;
      },
    });
    expect(company).toBeNull();
    expect(reads).toBe(0);
  });

  test("a client_id the store does not know resolves to no company", async () => {
    const company = await resolvePortalCompany([{ ...ROW, client_id: "unlisted" }], {
      readStore: async () => FIXTURES,
    });
    expect(company).toBeNull();
  });

  test("a store record with a blank name resolves to no company", async () => {
    const company = await resolvePortalCompany([{ ...ROW, client_id: "blank-named" }], {
      readStore: async () => [
        ...FIXTURES,
        { id: "blank-named", name: "   ", token: "b".repeat(43), title: "t", html: "" },
      ],
    });
    expect(company).toBeNull();
  });

  test("an unreadable store degrades to no company — resolves, never throws", async () => {
    const company = await resolvePortalCompany([ROW], {
      readStore: async () => {
        throw new Error("store offline");
      },
    });
    expect(company).toBeNull();
  });
});

describe("the portal header pins the US-004 avatar contract", () => {
  const ROUTE_SOURCE = readFileSync(
    new URL("../../routes/portal.tsx", import.meta.url).pathname,
    "utf8",
  );

  test("the route imports the avatar primitive from the ui layer", () => {
    expect(ROUTE_SOURCE).toContain("@/components/ui/avatar");
    expect(ROUTE_SOURCE).toContain("AvatarFallback");
  });

  test("the avatar reuses the /c/$token ink-on-cream classes exactly", () => {
    expect(ROUTE_SOURCE).toContain('className="bg-ink text-cream"');
  });

  test("the initial comes from the shared companyInitial derivation", () => {
    expect(ROUTE_SOURCE).toContain("companyInitial(");
  });

  test("the company name renders beside the avatar", () => {
    expect(ROUTE_SOURCE).toContain("company.name");
  });

  test("the funnel stage asserts against these testids", () => {
    expect(ROUTE_SOURCE).toContain('data-testid="portal-company-avatar"');
    expect(ROUTE_SOURCE).toContain('data-testid="portal-company-name"');
  });
});

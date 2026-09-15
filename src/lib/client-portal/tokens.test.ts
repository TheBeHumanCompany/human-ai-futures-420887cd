import { describe, expect, test } from "bun:test";

import {
  fetchClientPageByTokenFn,
  isTokenFormat,
  lookupClientByToken,
  reportsOf,
  validateToken,
  type ClientRecord,
} from "./tokens";
import store from "../../../content/clients.json";

/**
 * The US-001 token contract, pinned without a server.
 *
 * `lookupClientByToken` is pure over its inputs, and `fetchClientPageByTokenFn`
 * is the plain server-only function (no `createServerFn` wrapper), so both run
 * under `bun test` against the real store file. The route loader's wiring of
 * these into HTTP statuses is covered by `src/routes/c.$token.test.ts` (route
 * options) plus a live dev-server curl recorded in `docs/client-portal-tokens.md`.
 */

const clients = store as unknown as ClientRecord[];

const tokenOf = (id: string) => clients.find((c) => c.id === id)!.token;

const TOKEN_A = tokenOf("acme-industrial");
const TOKEN_B = tokenOf("beacon-health");

const MARKER_A = "ACME-FIXTURE-MARKER-7f3a91";
const MARKER_A2 = "ACME-FIXTURE-MARKER-02c4e8";
const MARKER_B = "BEACON-FIXTURE-MARKER-44d2c8";

describe("the fixture store both clients live in", () => {
  test("holds both fixture clients, each with a distinct well-formed token", () => {
    // Floor: every isolation row below is vacuous if a fixture goes missing
    // or the tokens stop matching the documented format. Scoped to the two
    // fixtures by id — the store legitimately holds further real clients
    // (e.g. voes-and-co) whose rows these rows must not constrain.
    const fixtures = clients.filter((c) => c.id === "acme-industrial" || c.id === "beacon-health");
    expect(fixtures.length).toBe(2);
    expect(new Set(fixtures.map((c) => c.token)).size).toBe(2);
    for (const client of fixtures) {
      expect(isTokenFormat(client.token)).toBe(true);
    }
  });
});

describe("validateToken — the shape guard at the server-function boundary", () => {
  test("a non-empty string passes through untouched", () => {
    expect(validateToken(TOKEN_A)).toBe(TOKEN_A);
  });

  test("an empty string or a non-string is refused outright, never coerced", () => {
    expect(() => validateToken("")).toThrow();
    expect(() => validateToken(undefined)).toThrow();
    expect(() => validateToken(42)).toThrow();
  });
});

describe("isTokenFormat — the documented token alphabet", () => {
  test("the 43-character base64url fixture tokens pass", () => {
    expect(isTokenFormat(TOKEN_A)).toBe(true);
    expect(isTokenFormat(TOKEN_B)).toBe(true);
  });

  test("short placeholders, spaces, and slashes fail", () => {
    for (const bad of ["", "abc", "let-me-in", "has space in it", "has/slash+plus"]) {
      expect(isTokenFormat(bad), JSON.stringify(bad)).toBe(false);
    }
  });
});

describe("lookupClientByToken — one token resolves to exactly one client", () => {
  test("each fixture token resolves to its own client record", () => {
    expect(lookupClientByToken(TOKEN_A, clients)?.id).toBe("acme-industrial");
    expect(lookupClientByToken(TOKEN_B, clients)?.id).toBe("beacon-health");
  });

  test("an unknown well-formed token resolves to nobody", () => {
    // 43 URL-safe characters that the store never issued: format-valid, absent.
    expect(lookupClientByToken("z".repeat(43), clients)).toBeNull();
  });

  test("a malformed token resolves to nobody without reaching the comparison", () => {
    expect(lookupClientByToken("short", clients)).toBeNull();
    // Unknown and malformed are deliberately indistinguishable here: a
    // distinct "bad format" answer would be a validity oracle for guessing.
    expect(lookupClientByToken("short", clients)).toBe(
      lookupClientByToken("z".repeat(43), clients),
    );
  });
});

describe("cross-client isolation through the real store read", () => {
  test("client A's page carries A's marker and none of B's", async () => {
    const page = await fetchClientPageByTokenFn(TOKEN_A);

    expect(page?.id).toBe("acme-industrial");
    expect(page?.html).toContain(MARKER_A);
    expect(page?.html).not.toContain(MARKER_B);
  });

  test("client B's page carries B's marker and none of A's", async () => {
    const page = await fetchClientPageByTokenFn(TOKEN_B);

    expect(page?.id).toBe("beacon-health");
    expect(page?.html).toContain(MARKER_B);
    expect(page?.html).not.toContain(MARKER_A);
  });

  test("an unknown token yields null — the route's 404, not an empty page", async () => {
    await expect(fetchClientPageByTokenFn("z".repeat(43))).resolves.toBeNull();
  });

  test("the resolved page carries no token field", async () => {
    // The token must never cross into loader data or rendered HTML; the
    // server function is where that boundary is drawn.
    const page = await fetchClientPageByTokenFn(TOKEN_A);

    expect(page).not.toBeNull();
    expect("token" in page!).toBe(false);
  });
});

/**
 * US-003 — one link per client, many reports inside it.
 *
 * The fixture Acme client carries two reports; Beacon stays a legacy
 * single-report record, which pins the fallback every older record takes.
 * Isolation still holds at the joined body: Acme's page carries both Acme
 * markers and none of Beacon's.
 */

describe("reportsOf — the tab list for one client's page", () => {
  test("a record carrying reports renders them in store order", () => {
    const acme = clients.find((c) => c.id === "acme-industrial")!;

    expect(reportsOf(acme).map((report) => report.id)).toEqual(["preliminary", "follow-up"]);
  });

  test("a record with no reports list falls back to the legacy single report", () => {
    const beacon = clients.find((c) => c.id === "beacon-health")!;

    expect(reportsOf(beacon)).toEqual([{ id: "report", title: beacon.title, html: beacon.html }]);
  });

  test("an empty list and a repeated tab id fall back rather than rendering broken tabs", () => {
    const beacon = clients.find((c) => c.id === "beacon-health")!;
    const report = { id: "one", title: "One", html: "<p>one</p>" };

    expect(reportsOf({ ...beacon, reports: [] }).map((r) => r.id)).toEqual(["report"]);
    expect(reportsOf({ ...beacon, reports: [report, { ...report }] }).map((r) => r.id)).toEqual([
      "report",
    ]);
  });
});

describe("both reports served under the one fixture token", () => {
  test("client A's page lists both reports, both markers, and none of B's", async () => {
    const page = await fetchClientPageByTokenFn(TOKEN_A);

    expect(page?.reports.map((report) => report.id)).toEqual(["preliminary", "follow-up"]);
    expect(page?.reports[0].html).toContain(MARKER_A);
    expect(page?.reports[1].html).toContain(MARKER_A2);
    for (const report of page?.reports ?? []) {
      expect(report.html).not.toContain(MARKER_B);
    }
    expect(page?.html).toContain(MARKER_A);
    expect(page?.html).toContain(MARKER_A2);
    expect(page?.html).not.toContain(MARKER_B);
  });

  test("client B's legacy page normalises to its one report", async () => {
    const page = await fetchClientPageByTokenFn(TOKEN_B);

    expect(page?.reports.length).toBe(1);
    expect(page?.reports[0].html).toContain(MARKER_B);
    expect(page?.reports[0].html).not.toContain(MARKER_A);
    expect(page?.reports[0].html).not.toContain(MARKER_A2);
  });
});

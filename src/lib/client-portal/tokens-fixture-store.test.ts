import { afterAll, afterEach, beforeAll, describe, expect, test } from "bun:test";

import fixtureStore from "../../../e2e/funnel/fixtures/clients.json";
import defaultStore from "../../../content/clients.json";
import { fetchClientPageByTokenFn, type ClientRecord } from "./tokens";

/**
 * The FUNNEL_STORE_PATH seam (funnel fixture tier).
 *
 * The funnel smoke suite points the token lookup at an isolated store copy
 * instead of the shipped `content/clients.json`, so a test run can never
 * read or deny a real client. The seam lives in `readClientStore` behind
 * the `FUNNEL_STORE_PATH` env var; these tests pin both directions:
 * set → the override file answers, unset → the default path answers
 * byte-identically to before the seam existed.
 *
 * The tier under test is the unconfigured one (`supabaseConfig: null`), so
 * the raw-token comparison runs against whichever store the seam picks;
 * the one configured-tier row proves the SAME store read serves the
 * digest-resolved page (the funnel run's actual path).
 */

const SUPABASE_ENV_PAIR = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const OVERRIDABLE_ENV = [...SUPABASE_ENV_PAIR, "FUNNEL_STORE_PATH"] as const;
const savedEnv: Record<string, string | undefined> = {};

beforeAll(() => {
  for (const name of OVERRIDABLE_ENV) {
    savedEnv[name] = process.env[name];
    delete process.env[name];
  }
});

// Each test sets its own override value; nothing leaks between rows or into
// the unset-direction rows below.
afterEach(() => {
  delete process.env.FUNNEL_STORE_PATH;
});

afterAll(() => {
  for (const [name, value] of Object.entries(savedEnv)) {
    if (value === undefined) {
      delete process.env[name];
    } else {
      process.env[name] = value;
    }
  }
});

const fixtures = fixtureStore as unknown as ClientRecord[];
const defaults = defaultStore as unknown as ClientRecord[];
const FUNNEL_TOKEN = fixtures[0]!.token;
const ACME_TOKEN = defaults.find((c) => c.id === "acme-industrial")!.token;

describe("FUNNEL_STORE_PATH set — the override store answers", () => {
  test("the funnel fixture token resolves to the fixture client", async () => {
    process.env.FUNNEL_STORE_PATH = new URL(
      "../../../e2e/funnel/fixtures/clients.json",
      import.meta.url,
    ).pathname;
    const page = await fetchClientPageByTokenFn(FUNNEL_TOKEN, { supabaseConfig: null });
    expect(page?.id).toBe("funnel-fixture");
    expect(page?.name).toBe("The Funnel Fixture Co");
    expect(page?.reports.map((r) => r.id)).toEqual(["funnel-fixture-report"]);
  });

  test("a path relative to the repo root resolves the same store", async () => {
    process.env.FUNNEL_STORE_PATH = "e2e/funnel/fixtures/clients.json";
    const page = await fetchClientPageByTokenFn(FUNNEL_TOKEN, { supabaseConfig: null });
    expect(page?.id).toBe("funnel-fixture");
  });

  test("an unreadable override path denies everyone rather than falling back", async () => {
    process.env.FUNNEL_STORE_PATH = "e2e/funnel/fixtures/does-not-exist.json";
    const page = await fetchClientPageByTokenFn(ACME_TOKEN, { supabaseConfig: null });
    expect(page).toBeNull();
  });

  test("the configured tier joins the digest-resolved client_id against the override store", async () => {
    process.env.FUNNEL_STORE_PATH = "e2e/funnel/fixtures/clients.json";
    const calls: string[] = [];
    const fetchImpl = (async (input: string | URL | Request) => {
      const url = String(input instanceof Request ? input.url : input);
      calls.push(url);
      const body = url.includes("client_portal_tokens")
        ? JSON.stringify([{ client_id: "funnel-fixture", revoked_at: null }])
        : "[]";
      return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
    }) as unknown as typeof fetch;
    const page = await fetchClientPageByTokenFn(FUNNEL_TOKEN, {
      supabaseConfig: { url: "https://funnel-fixture.test", serviceRoleKey: "test-only" },
      fetchImpl,
    });
    expect(page?.id).toBe("funnel-fixture");
    expect(page?.name).toBe("The Funnel Fixture Co");
    expect(calls.some((url) => url.includes("client_portal_tokens"))).toBe(true);
  });
});

describe("FUNNEL_STORE_PATH unset — the default path is unchanged", () => {
  test("the shipped store still answers and the fixture token does not leak in", async () => {
    const page = await fetchClientPageByTokenFn(ACME_TOKEN, { supabaseConfig: null });
    expect(page?.id).toBe("acme-industrial");
    const leaked = await fetchClientPageByTokenFn(FUNNEL_TOKEN, { supabaseConfig: null });
    expect(leaked).toBeNull();
  });
});

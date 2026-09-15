import { describe, expect, test } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  hashToken,
  lookupClientTokenRow,
  supabaseConfigFromEnv,
  type SupabaseTokenConfig,
} from "./supabase-tokens";
import { fetchClientPageByTokenFn, type ClientRecord } from "./tokens";
import store from "../../../content/clients.json";

/**
 * The US-001 Supabase tier, pinned without a network or a database.
 *
 * `lookupClientTokenRow` takes its `fetchImpl`, and `fetchClientPageByTokenFn`
 * takes its config plus fetch through the `deps` seam (the `deliverEnquiry`
 * idiom from `lib/contact.ts`), so every branch below runs under
 * `bun test`. The live anon-key probe from the acceptance criteria needs real
 * credentials and is recorded in `docs/client-portal-tokens.md`, not here.
 */

const clients = store as unknown as ClientRecord[];

const tokenOf = (id: string) => clients.find((c) => c.id === id)!.token;

const TOKEN_A = tokenOf("acme-industrial");

const MARKER_A = "ACME-FIXTURE-MARKER-7f3a91";
const MARKER_B = "BEACON-FIXTURE-MARKER-44d2c8";

const CONFIG: SupabaseTokenConfig = {
  url: "https://xyzcompany.supabase.co",
  serviceRoleKey: "service-role-key-for-tests-only",
};

const okRows = (rows: unknown[]) =>
  ({
    ok: true,
    status: 200,
    json: async () => rows,
  }) as Response;

const denied = () =>
  ({
    ok: false,
    status: 401,
    json: async () => ({}),
  }) as Response;

describe("supabaseConfigFromEnv — half-configured must never run", () => {
  test("an empty environment yields no config", () => {
    expect(supabaseConfigFromEnv({})).toBeNull();
  });

  test("either value alone still yields no config", () => {
    expect(supabaseConfigFromEnv({ SUPABASE_URL: CONFIG.url })).toBeNull();
    expect(supabaseConfigFromEnv({ SUPABASE_SERVICE_ROLE_KEY: CONFIG.serviceRoleKey })).toBeNull();
  });

  test("both values yield the config, trailing slashes trimmed", () => {
    expect(
      supabaseConfigFromEnv({
        SUPABASE_URL: `${CONFIG.url}///`,
        SUPABASE_SERVICE_ROLE_KEY: CONFIG.serviceRoleKey,
      }),
    ).toEqual(CONFIG);
  });
});

describe("hashToken — the only value that ever reaches Postgres", () => {
  test("matches the SHA-256 known vector", () => {
    // Pins the algorithm independently of this module: the store stubs below
    // reuse hashToken, so without this row a wrong-but-consistent digest
    // would pass everything else.
    expect(hashToken("abc")).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  test("a 64-character lowercase hex digest, deterministic and input-sensitive", async () => {
    const digest = await hashToken(TOKEN_A);

    expect(digest).toMatch(/^[0-9a-f]{64}$/);
    await expect(hashToken(TOKEN_A)).resolves.toBe(digest);
    await expect(hashToken(`${TOKEN_A}x`)).resolves.not.toBe(digest);
  });
});

describe("lookupClientTokenRow — the PostgREST read", () => {
  test("queries by digest equality and authenticates with the service-role key", async () => {
    const digest = await hashToken(TOKEN_A);
    let seenUrl = "";
    let seenInit: RequestInit = {};
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      seenUrl = String(url);
      seenInit = init ?? {};
      return okRows([{ client_id: "acme-industrial", revoked_at: null }]);
    }) as typeof fetch;

    const row = await lookupClientTokenRow(digest, CONFIG, fetchImpl);

    expect(row).toEqual({ client_id: "acme-industrial", revoked_at: null });
    const query = new URL(seenUrl);
    expect(`${query.origin}${query.pathname}`).toBe(`${CONFIG.url}/rest/v1/client_portal_tokens`);
    expect(query.searchParams.get("token_hash")).toBe(`eq.${digest}`);
    // The raw token must not travel: the digest is the only secret-adjacent
    // value in the request, and it is not reversible to a link.
    expect(seenUrl).not.toContain(TOKEN_A);
    const headers = seenInit.headers as Record<string, string>;
    expect(headers.apikey).toBe(CONFIG.serviceRoleKey);
    expect(headers.Authorization).toBe(`Bearer ${CONFIG.serviceRoleKey}`);
  });

  test("an unissued digest resolves to nobody", async () => {
    const fetchImpl = (async () => okRows([])) as typeof fetch;

    await expect(lookupClientTokenRow("0".repeat(64), CONFIG, fetchImpl)).resolves.toBeNull();
  });

  test("a provider refusal throws, so the caller can fail closed loudly", async () => {
    const fetchImpl = (async () => denied()) as typeof fetch;

    await expect(lookupClientTokenRow("0".repeat(64), CONFIG, fetchImpl)).rejects.toThrow("401");
  });

  test("a row without a client identity resolves to nobody, never to everyone", async () => {
    const fetchImpl = (async () => okRows([{ revoked_at: null }])) as typeof fetch;

    await expect(lookupClientTokenRow("0".repeat(64), CONFIG, fetchImpl)).resolves.toBeNull();
  });
});

describe("fetchClientPageByTokenFn — the Supabase tier through the real seam", () => {
  /** Stub PostgREST over the fixture store: issued digests resolve by id. */
  const stubPostgrest = () =>
    (async (url: string | URL | Request) => {
      const digest = new URL(String(url)).searchParams.get("token_hash")?.replace(/^eq\./, "");
      const match =
        digest && digest === (await hashToken(TOKEN_A))
          ? [{ client_id: "acme-industrial", revoked_at: null }]
          : [];
      return okRows(match);
    }) as typeof fetch;

  test("an issued token resolves to its page without the token field", async () => {
    const page = await fetchClientPageByTokenFn(TOKEN_A, {
      supabaseConfig: CONFIG,
      fetchImpl: stubPostgrest(),
    });

    expect(page?.id).toBe("acme-industrial");
    expect(page?.html).toContain(MARKER_A);
    expect(page?.html).not.toContain(MARKER_B);
    expect(page).not.toBeNull();
    expect("token" in page!).toBe(false);
  });

  test("a revoked row denies even though the token is well-formed", async () => {
    const fetchImpl = (async () =>
      okRows([
        { client_id: "acme-industrial", revoked_at: "2026-09-14T00:00:00Z" },
      ])) as typeof fetch;

    await expect(
      fetchClientPageByTokenFn(TOKEN_A, { supabaseConfig: CONFIG, fetchImpl }),
    ).resolves.toBeNull();
  });

  test("an unissued digest denies", async () => {
    await expect(
      fetchClientPageByTokenFn("z".repeat(43), {
        supabaseConfig: CONFIG,
        fetchImpl: stubPostgrest(),
      }),
    ).resolves.toBeNull();
  });

  test("a malformed token denies without touching the network", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return okRows([]);
    }) as typeof fetch;

    await expect(
      fetchClientPageByTokenFn("short", { supabaseConfig: CONFIG, fetchImpl }),
    ).resolves.toBeNull();
    expect(calls).toBe(0);
  });

  test("an outage denies rather than falling back to the raw-token store", async () => {
    // TOKEN_A is valid in the fixture store, so a fallback would resolve it.
    // Fail-closed means it must not: the fixture store still holds the raw
    // value, which is exactly what a revoked link must never be able to use.
    const fetchImpl = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;

    await expect(
      fetchClientPageByTokenFn(TOKEN_A, { supabaseConfig: CONFIG, fetchImpl }),
    ).resolves.toBeNull();
  });
});

describe("fetchClientPageByTokenFn — unconfigured keeps the fixture behaviour", () => {
  test("a fixture token still resolves with no Supabase in the environment", async () => {
    const page = await fetchClientPageByTokenFn(TOKEN_A, { supabaseConfig: null });

    expect(page?.id).toBe("acme-industrial");
    expect(page?.html).toContain(MARKER_A);
  });

  test("an unknown token still resolves to nobody", async () => {
    await expect(
      fetchClientPageByTokenFn("z".repeat(43), { supabaseConfig: null }),
    ).resolves.toBeNull();
  });
});

const MIGRATION_DIR = path.join(import.meta.dir, "..", "..", "..", "supabase", "migrations");

const migrationSql = () => {
  const files = readdirSync(MIGRATION_DIR).filter((file) =>
    file.endsWith("_client_portal_tokens.sql"),
  );
  expect(files.length).toBe(1);
  return readFileSync(path.join(MIGRATION_DIR, files[0]), "utf8");
};

describe("the migration — table, RLS, and no lifetime, by file inspection", () => {
  test("creates the tokens table with a digest column and a revocation column", () => {
    const sql = migrationSql();

    expect(sql).toContain("client_portal_tokens");
    expect(sql).toContain("token_hash");
    // Revocation is nullable-by-meaning: null while the link works.
    expect(sql).toContain("revoked_at timestamptz null");
  });

  test("enables RLS and denies anonymous reads explicitly", () => {
    const sql = migrationSql();

    expect(sql).toMatch(/enable row level security/i);
    expect(sql).toMatch(/to anon/i);
    expect(sql).toContain("(false)");
  });

  test("carries no lifetime: no expiry column, no expiry job hint", () => {
    // Links end by revocation only. Any future lifetime column must arrive
    // with this row updated, not silently.
    expect(migrationSql()).not.toMatch(/expir/i);
  });
});

describe("the lookup enforces no clock either", () => {
  test("neither token module constrains by time", () => {
    for (const file of ["supabase-tokens.ts", "tokens.ts"]) {
      const source = readFileSync(path.join(import.meta.dir, file), "utf8");
      expect(source).not.toMatch(/expir/i);
    }
  });
});

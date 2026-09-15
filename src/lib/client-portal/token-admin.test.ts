import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  mintToken,
  reissueClientTokenRow,
  revokeClientTokenRow,
  rotateClientToken,
  type SupabaseTokenConfig,
} from "./token-admin";
import { fetchClientPageByTokenFn, isTokenFormat, type ClientRecord } from "./tokens";
import store from "../../../content/clients.json";

/**
 * US-008 — long-lived links with per-client revoke and re-issue, pinned
 * without a server or a database.
 *
 * The pure rotation runs against scratch copies of the real store file
 * (the tier-upgrade idiom) with the Supabase tier forced off, so the
 * revoke/re-issue flows below prove the lookup behaviour the dev-server
 * curl in `docs/client-portal-tokens.md` repeats over HTTP. The Supabase
 * writes take their `fetchImpl`, so the digest-only, service-role-authenticated
 * contract is proven without a network.
 */

const MARKER_A = "ACME-FIXTURE-MARKER-7f3a91";
const MARKER_B = "BEACON-FIXTURE-MARKER-44d2c8";

const CONFIG: SupabaseTokenConfig = {
  url: "https://xyzcompany.supabase.co",
  serviceRoleKey: "service-role-key-for-tests-only",
};

/** A fixed 43-character replacement, so rotation rows stay deterministic. */
const REPLACEMENT_A = "R".repeat(43);

const copyStoreToScratch = async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "client-portal-token-admin-"));
  const storePath = path.join(dir, "clients.json");
  await writeFile(storePath, JSON.stringify(store, null, 2), "utf8");
  return storePath;
};

const readStore = async (storePath: string) =>
  JSON.parse(await readFile(storePath, "utf8")) as ClientRecord[];

const tokenOf = (clients: readonly ClientRecord[], id: string) =>
  clients.find((client) => client.id === id)!.token;

const pageFor = (token: string, storePath: string) =>
  fetchClientPageByTokenFn(token, {
    supabaseConfig: null,
    readStore: () => readStore(storePath),
  });

const okRows = (rows: unknown[]) =>
  ({
    ok: true,
    status: 200,
    json: async () => rows,
  }) as Response;

describe("mintToken — fresh entropy in the documented alphabet", () => {
  test("mints 43-character base64url values, unique across a batch", () => {
    const batch = new Set(Array.from({ length: 256 }, () => mintToken()));

    expect(batch.size).toBe(256);
    for (const token of batch) {
      expect(isTokenFormat(token)).toBe(true);
      expect(token).toHaveLength(43);
    }
  });

  test("encodes the given bytes deterministically", () => {
    const stub = (bytes: Uint8Array) => bytes.fill(1);

    expect(mintToken(stub)).toBe(mintToken(stub));
    expect(mintToken(stub)).toHaveLength(43);
  });

  test("refuses a short entropy source rather than minting a weak token", () => {
    expect(() => mintToken(() => new Uint8Array(16))).toThrow("[client-portal]");
  });
});

describe("rotateClientToken — the one token write, pure", () => {
  test("replaces only the token field of exactly one client", () => {
    const clients = store as unknown as ClientRecord[];
    const before = clients.find((client) => client.id === "acme-industrial")!;

    const after = rotateClientToken(clients, "acme-industrial", REPLACEMENT_A);
    const rotated = after.find((client) => client.id === "acme-industrial")!;

    expect(rotated.token).toBe(REPLACEMENT_A);
    expect(rotated).toEqual({ ...before, token: REPLACEMENT_A });
    // The input is never mutated, so callers can diff or discard.
    expect(before.token).not.toBe(REPLACEMENT_A);
    expect(after.find((client) => client.id === "beacon-health")).toEqual(
      clients.find((client) => client.id === "beacon-health"),
    );
  });

  test("an unknown client fails naming the known ids", () => {
    expect(() =>
      rotateClientToken(store as unknown as ClientRecord[], "no-such-client", REPLACEMENT_A),
    ).toThrow("acme-industrial");
  });

  test("a malformed replacement and a same-as-current value are refused", () => {
    const clients = store as unknown as ClientRecord[];
    const current = tokenOf(clients, "acme-industrial");

    expect(() => rotateClientToken(clients, "acme-industrial", "short")).toThrow("[client-portal]");
    // Re-issuing the identical value would be a silent no-op that leaves a
    // supposedly revoked link live.
    expect(() => rotateClientToken(clients, "acme-industrial", current)).toThrow("[client-portal]");
  });
});

describe("revoke — the old link dies, nobody else's moves", () => {
  test("a rotated-away token resolves to nobody while the other client is unaffected", async () => {
    const storePath = await copyStoreToScratch();
    const before = await readStore(storePath);
    const oldToken = tokenOf(before, "acme-industrial");
    const tokenB = tokenOf(before, "beacon-health");

    // The revoke action: rotate to a freshly minted value the operator never
    // discloses, and persist it — the old link dies with no new link out.
    const rotated = rotateClientToken(before, "acme-industrial", mintToken());
    await writeFile(storePath, `${JSON.stringify(rotated, null, 2)}\n`, "utf8");

    await expect(pageFor(oldToken, storePath)).resolves.toBeNull();
    const survivor = await pageFor(tokenB, storePath);
    expect(survivor?.id).toBe("beacon-health");
    expect(survivor?.html).toContain(MARKER_B);
    expect(survivor?.html).not.toContain(MARKER_A);
  });
});

describe("re-issue — the new link works, the old one stays denied", () => {
  test("the replacement serves the same content; the old token and isolation hold", async () => {
    const storePath = await copyStoreToScratch();
    const before = await readStore(storePath);
    const oldToken = tokenOf(before, "acme-industrial");
    const tokenB = tokenOf(before, "beacon-health");

    const rotated = rotateClientToken(before, "acme-industrial", REPLACEMENT_A);
    await writeFile(storePath, `${JSON.stringify(rotated, null, 2)}\n`, "utf8");

    await expect(pageFor(oldToken, storePath)).resolves.toBeNull();
    const page = await pageFor(REPLACEMENT_A, storePath);
    expect(page?.id).toBe("acme-industrial");
    expect(page?.html).toContain(MARKER_A);
    expect(page?.html).not.toContain(MARKER_B);
    expect(page?.reports.map((report) => report.id)).toEqual(["preliminary", "follow-up"]);
    expect("token" in page!).toBe(false);

    const survivor = await pageFor(tokenB, storePath);
    expect(survivor?.id).toBe("beacon-health");
    expect(survivor?.html).toContain(MARKER_B);
  });
});

describe("long-lived — no clock on the read path", () => {
  test("the same token resolves on a repeat check with unrelated writes between", async () => {
    // There is no stated lifetime to wait out: the lookup enforces no time
    // constraint, so any gap qualifies. This pins the behaviour — a repeat
    // resolution after an intervening store write still serves the page —
    // while the rows below pin the absence of the clock itself.
    const storePath = await copyStoreToScratch();
    const tokenB = tokenOf(await readStore(storePath), "beacon-health");

    const first = await pageFor(tokenB, storePath);
    expect(first?.html).toContain(MARKER_B);

    const rotated = rotateClientToken(await readStore(storePath), "acme-industrial", mintToken());
    await writeFile(storePath, `${JSON.stringify(rotated, null, 2)}\n`, "utf8");

    const second = await pageFor(tokenB, storePath);
    expect(second?.id).toBe("beacon-health");
    expect(second?.html).toContain(MARKER_B);
  });

  test("no token module constrains by time, including the new admin module", () => {
    for (const file of ["token-admin.ts", "supabase-tokens.ts", "tokens.ts"]) {
      const source = readFileSync(path.join(import.meta.dir, file), "utf8");
      expect(source).not.toMatch(/expir/i);
    }
  });
});

describe("revokeClientTokenRow — the Supabase revoke write", () => {
  test("patches revoked_at on the client's row with the service-role key", async () => {
    const now = "2026-09-15T00:00:00.000Z";
    let seenUrl = "";
    let seenInit: RequestInit = {};
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      seenUrl = String(url);
      seenInit = init ?? {};
      return okRows([{ client_id: "acme-industrial", revoked_at: now }]);
    }) as typeof fetch;

    const matched = await revokeClientTokenRow("acme-industrial", CONFIG, fetchImpl, now);

    expect(matched).toBe(1);
    const query = new URL(seenUrl);
    expect(`${query.origin}${query.pathname}`).toBe(`${CONFIG.url}/rest/v1/client_portal_tokens`);
    expect(query.searchParams.get("client_id")).toBe("eq.acme-industrial");
    expect(seenInit.method).toBe("PATCH");
    const headers = seenInit.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${CONFIG.serviceRoleKey}`);
    const body = JSON.parse(String(seenInit.body));
    expect(body).toEqual({ revoked_at: now });
  });

  test("zero matched rows means nothing was live — old tokens already deny", async () => {
    const fetchImpl = (async () => okRows([])) as typeof fetch;

    await expect(
      revokeClientTokenRow("acme-industrial", CONFIG, fetchImpl, "2026-09-15T00:00:00.000Z"),
    ).resolves.toBe(0);
  });

  test("a provider refusal throws instead of letting the operator assume the link is dead", async () => {
    const fetchImpl = (async () =>
      ({ ok: false, status: 403, json: async () => ({}) }) as Response) as typeof fetch;

    await expect(
      revokeClientTokenRow("acme-industrial", CONFIG, fetchImpl, "2026-09-15T00:00:00.000Z"),
    ).rejects.toThrow("403");
  });
});

describe("reissueClientTokenRow — the Supabase re-issue write", () => {
  const DIGEST = "1f63748a077b5f4d5be1218a9395c8618c9d5b7ff92c145d46836078315b695e";

  test("overwrites the digest and clears revoked_at on the same row", async () => {
    let seenInit: RequestInit = {};
    const calls: string[] = [];
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push(String(url));
      seenInit = init ?? {};
      return okRows([{ client_id: "acme-industrial", revoked_at: null }]);
    }) as typeof fetch;

    const row = await reissueClientTokenRow("acme-industrial", DIGEST, CONFIG, fetchImpl);

    expect(row).toEqual({ client_id: "acme-industrial", revoked_at: null });
    // One request in the common case: the PATCH matched the seeded row.
    expect(calls).toHaveLength(1);
    expect(new URL(calls[0]).searchParams.get("client_id")).toBe("eq.acme-industrial");
    expect(seenInit.method).toBe("PATCH");
    const headers = seenInit.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${CONFIG.serviceRoleKey}`);
    const body = JSON.parse(String(seenInit.body));
    expect(body).toEqual({ token_hash: DIGEST, revoked_at: null });
  });

  test("an unseeded client falls back to an insert on the same row shape", async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      if (calls.length === 1) return okRows([]);
      return okRows([{ client_id: "beacon-health", revoked_at: null }]);
    }) as typeof fetch;

    const row = await reissueClientTokenRow("beacon-health", DIGEST, CONFIG, fetchImpl);

    expect(row).toEqual({ client_id: "beacon-health", revoked_at: null });
    expect(calls).toHaveLength(2);
    expect(calls[1].init.method).toBe("POST");
    expect(JSON.parse(String(calls[1].init.body))).toEqual({
      client_id: "beacon-health",
      token_hash: DIGEST,
      revoked_at: null,
    });
  });

  test("the raw token is refused — only digests reach Postgres", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return okRows([]);
    }) as typeof fetch;

    await expect(
      reissueClientTokenRow("acme-industrial", "R".repeat(43), CONFIG, fetchImpl),
    ).rejects.toThrow("[client-portal]");
    expect(calls).toBe(0);
  });
});

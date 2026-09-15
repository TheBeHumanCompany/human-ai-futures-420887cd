import type { SupabaseTokenConfig } from "./supabase-tokens";
import { isTokenFormat, type ClientRecord } from "./tokens";

/**
 * Token revoke and re-issue for the private client portal (US-008).
 *
 * Links are long-lived: they end by revocation only, never by a clock.
 * There is no `exp` claim, no lifetime column (see the migration), and no
 * job or cron anywhere on this path — the lookup in `tokens.ts` enforces no
 * time constraint, and nothing in this module adds one either. The revoke
 * and re-issue writes below are the only ends and renewals a link has.
 *
 * Two tiers, mirroring the lookup:
 * - Unconfigured (local dev, tests): the content store (`content/clients.json`)
 *   holds the raw token, so revoke and re-issue both rotate that value to a
 *   freshly minted one. A revoke discards the replacement undisclosed — the
 *   old link dies and no new link is handed out — while a re-issue returns
 *   the replacement to the operator, who sends it as the new link.
 * - Configured: the `client_portal_tokens` row for the client is patched
 *   (`revoked_at` set to revoke; digest overwritten and `revoked_at` cleared
 *   to re-issue, inserting the row when the client was never seeded). Only
 *   the SHA-256 digest ever leaves the server toward Postgres; the raw token
 *   appears in neither URL nor body.
 *
 * Operator tooling and tests only. Never imported by a route file: this
 * module writes tokens, and the route bundle must keep carrying none of
 * them. Type-only imports (`import type`) are erased at build and are safe;
 * the one runtime import is the token-format guard, which names no secret.
 */

/** How long a token write may hold an operator command before failing. */
const ADMIN_TIMEOUT_MS = 10_000;

/** The digest shape the table CHECK pins: full SHA-256 hex, nothing else. */
const DIGEST_FORMAT = /^[0-9a-f]{64}$/;

/** One row of `public.client_portal_tokens` as the writes need it. */
export interface SupabaseTokenWriteRow {
  client_id: string;
  revoked_at: string | null;
}

function fail(message: string): never {
  throw new Error(`[client-portal] ${message}`);
}

/**
 * Mints one URL token: 32 random bytes, base64url, 43 characters — the same
 * alphabet `TOKEN_FORMAT` in `tokens.ts` accepts, so a minted value always
 * passes the lookup's format floor (rotation values longer than 43
 * characters were already valid; minted values are exactly 43).
 *
 * `randomValues` defaults to `crypto.getRandomValues` and is a parameter
 * only so tests can pin the encoding without trusting the RNG.
 */
/**
 * System entropy for `mintToken`. The cast keeps TS 5.7's stricter
 * ArrayBuffer generics happy; at runtime this fills and returns the same
 * array it was given.
 */
function systemRandomValues(bytes: Uint8Array): Uint8Array {
  crypto.getRandomValues(bytes as Uint8Array<ArrayBuffer>);
  return bytes;
}

export function mintToken(
  randomValues: (bytes: Uint8Array) => Uint8Array = systemRandomValues,
): string {
  const bytes = randomValues(new Uint8Array(32));
  if (bytes.length !== 32) fail(`expected 32 random bytes, received ${bytes.length}`);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Rotates one client's token to `newToken`, returning the new store. Pure:
 * the input array and its records are never mutated, so callers can diff or
 * discard — the same contract `publishReportToStore` keeps.
 *
 * Only the record's `token` is replaced: id, name, title, and reports are
 * untouched, so rotation never moves, renames, or drops content (the US-007
 * guarantee from the other direction). The replacement must be well-formed
 * and different from the current value — re-issuing the identical value
 * would be a silent no-op that leaves a supposedly revoked link live.
 */
export function rotateClientToken(
  clients: readonly ClientRecord[],
  clientId: string,
  newToken: string,
): ClientRecord[] {
  const index = clients.findIndex(
    (candidate) => typeof candidate?.id === "string" && candidate.id === clientId,
  );
  if (index === -1) {
    const known = clients
      .map((candidate) => (typeof candidate?.id === "string" ? candidate.id : null))
      .filter((id): id is string => id !== null);
    fail(
      `unknown client ${JSON.stringify(clientId)}` +
        (known.length > 0 ? ` (known: ${known.join(", ")})` : " (the store holds no clients)"),
    );
  }
  if (!isTokenFormat(newToken)) {
    fail("expected the replacement token to be 32+ URL-safe characters");
  }
  const current = clients[index]!;
  if (typeof current.token !== "string" || current.token.length === 0) {
    fail(`client ${JSON.stringify(clientId)} has no token to rotate`);
  }
  if (newToken === current.token) {
    fail(
      `the replacement token for ${JSON.stringify(clientId)} matches the current one — mint a fresh value`,
    );
  }
  return clients.map((candidate, i) =>
    i === index ? { ...candidate, token: newToken } : candidate,
  );
}

function serviceRoleHeaders(config: SupabaseTokenConfig): Record<string, string> {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

function isWriteRow(value: unknown): value is SupabaseTokenWriteRow {
  // A local copy of the row guard in `supabase-tokens.ts`, which stays
  // dynamically imported by the lookup: a runtime import here would hand
  // the service-role env name to every bundler walking this file.
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.client_id === "string" &&
    row.client_id.length > 0 &&
    (row.revoked_at === null || row.revoked_at === undefined || typeof row.revoked_at === "string")
  );
}

function throwOnRefusal(response: Response, action: string): void {
  if (!response.ok) {
    // Status only, never the body: it can echo the query, and token-adjacent
    // values do not belong in operator logs either.
    throw new Error(`[client-portal] token ${action} answered ${response.status}`);
  }
}

/**
 * Revokes one client's link in Supabase: sets `revoked_at`, keeping the row
 * (not deleting it) so the denial stays auditable. Returns how many rows the
 * write matched — zero means the client was never seeded, in which case no
 * link was ever live and old tokens already deny. Throws on transport and
 * provider failures so the operator sees a refusal instead of assuming the
 * old link is dead.
 */
export async function revokeClientTokenRow(
  clientId: string,
  config: SupabaseTokenConfig,
  fetchImpl: typeof fetch = fetch,
  nowIso: string = new Date().toISOString(),
): Promise<number> {
  const query = new URL(`${config.url}/rest/v1/client_portal_tokens`);
  query.searchParams.set("client_id", `eq.${clientId}`);

  const response = await fetchImpl(query.toString(), {
    method: "PATCH",
    headers: { ...serviceRoleHeaders(config), Prefer: "return=representation" },
    body: JSON.stringify({ revoked_at: nowIso }),
    signal: AbortSignal.timeout(ADMIN_TIMEOUT_MS),
  });
  throwOnRefusal(response, "revoke");
  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) return 0;
  return rows.filter(isWriteRow).length;
}

/**
 * Re-issues one client's link in Supabase: overwrites the digest on the same
 * row and clears `revoked_at`, so the new URL works while the old one stays
 * denied. When the client was never seeded the PATCH matches nothing and the
 * row is inserted instead — one request in the common case, two only for a
 * first issue. `tokenHash` is the SHA-256 hex digest (mint with `mintToken`,
 * digest with `hashToken`); the raw token is refused here because it must
 * never reach Postgres.
 */
export async function reissueClientTokenRow(
  clientId: string,
  tokenHash: string,
  config: SupabaseTokenConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<SupabaseTokenWriteRow | null> {
  if (!DIGEST_FORMAT.test(tokenHash)) {
    fail("expected tokenHash to be a 64-character lowercase hex digest, never the raw token");
  }
  const query = new URL(`${config.url}/rest/v1/client_portal_tokens`);
  query.searchParams.set("client_id", `eq.${clientId}`);

  const patched = await fetchImpl(query.toString(), {
    method: "PATCH",
    headers: { ...serviceRoleHeaders(config), Prefer: "return=representation" },
    body: JSON.stringify({ token_hash: tokenHash, revoked_at: null }),
    signal: AbortSignal.timeout(ADMIN_TIMEOUT_MS),
  });
  throwOnRefusal(patched, "re-issue");
  const rows: unknown = await patched.json();
  if (Array.isArray(rows) && rows.length > 0) {
    const row = rows[0];
    return isWriteRow(row)
      ? { client_id: row.client_id, revoked_at: row.revoked_at ?? null }
      : null;
  }

  const inserted = await fetchImpl(`${config.url}/rest/v1/client_portal_tokens`, {
    method: "POST",
    headers: { ...serviceRoleHeaders(config), Prefer: "return=representation" },
    body: JSON.stringify({ client_id: clientId, token_hash: tokenHash, revoked_at: null }),
    signal: AbortSignal.timeout(ADMIN_TIMEOUT_MS),
  });
  throwOnRefusal(inserted, "re-issue");
  const created: unknown = await inserted.json();
  if (!Array.isArray(created) || !isWriteRow(created[0])) return null;
  const row = created[0];
  return { client_id: row.client_id, revoked_at: row.revoked_at ?? null };
}

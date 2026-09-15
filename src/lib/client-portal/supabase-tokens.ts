/**
 * Supabase Postgres token store for the private client portal (US-001).
 *
 * Two tiers, one contract. The URL token is opaque: this module hashes it
 * with SHA-256 and the digest is the only value that ever leaves the server
 * toward Postgres. A lookup resolves the digest to a client_id (refusing
 * revoked rows), and the caller's page is then read from the content store
 * by that id — report bodies stay in `content/clients.json`, so the token
 * table changes only when links are issued or revoked.
 *
 * Server-side only. The service-role key bypasses RLS, which is exactly why
 * it must never reach the browser: this module is loaded through a dynamic
 * `import()` inside the token server function (the same trick `tokens.ts`
 * uses for the JSON store), never through a static import a route file can
 * see. Type-only imports (`import type`) are erased at build and are safe.
 *
 * No lifetime anywhere: the row carries `revoked_at` and nothing else that
 * could end a link, and this lookup enforces no clock. Revocation is the
 * only end of a link (US-008 owns the revoke/re-issue actions).
 *
 * Plain `fetch` against the PostgREST endpoint, mirroring `lib/contact.ts`
 * (one POST, no SDK): no new dependency for a single indexed equality read.
 */

export const SUPABASE_URL_ENV = "SUPABASE_URL";
export const SUPABASE_SERVICE_ROLE_ENV = "SUPABASE_SERVICE_ROLE_KEY";
/** Not read by the site. Named here so the manual RLS probe has one spelling. */
export const SUPABASE_ANON_ENV = "SUPABASE_ANON_KEY";

/** How long a token lookup may hold a page render before failing closed. */
const LOOKUP_TIMEOUT_MS = 10_000;

export interface SupabaseTokenConfig {
  /** Project REST base, e.g. https://xyzcompany.supabase.co. No trailing slash. */
  url: string;
  /** Service-role key. Bypasses RLS — deploy environment only, never bundled. */
  serviceRoleKey: string;
}

/** One row of `public.client_portal_tokens` as the lookup needs it. */
export interface SupabaseTokenRow {
  client_id: string;
  revoked_at: string | null;
}

/**
 * Reads the lookup configuration from the environment. Returns `null` when
 * either value is absent, and the caller falls back to the fixture content
 * store (local dev and tests) — a half-configured lookup must never run.
 *
 * `env` defaults to `process.env` (the deploy-environment idiom `contact.ts`
 * already relies on) and is a parameter only so tests can pin the branches
 * without touching the real environment.
 */
export function supabaseConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): SupabaseTokenConfig | null {
  const url = env[SUPABASE_URL_ENV]?.trim().replace(/\/+$/, "");
  const serviceRoleKey = env[SUPABASE_SERVICE_ROLE_ENV]?.trim();
  if (!url || !serviceRoleKey) return null;
  return { url, serviceRoleKey };
}

/**
 * The digest stored in `token_hash`: SHA-256 hex of the opaque URL token.
 *
 * WebCrypto rather than `node:crypto`: this lookup runs on Cloudflare
 * Workers (nitro `cloudflare-module` preset), where `crypto.subtle` is
 * always available and `node:crypto` needs a compat flag nothing else here
 * requires. Lowercase hex, matching the table CHECK `[0-9a-f]{64}`.
 */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function isTokenRow(value: unknown): value is SupabaseTokenRow {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.client_id === "string" &&
    row.client_id.length > 0 &&
    (row.revoked_at === null || row.revoked_at === undefined || typeof row.revoked_at === "string")
  );
}

/**
 * Resolves a token digest to its row, or `null` when the digest was never
 * issued. Throws on transport and provider failures so the caller can fail
 * closed loudly (log + deny) rather than mistaking an outage for "no such
 * client" silently.
 *
 * The anon key is never used here on purpose: anonymous reads are denied by
 * RLS, so sending the anon key would only turn every lookup into a denial.
 */
export async function lookupClientTokenRow(
  tokenHash: string,
  config: SupabaseTokenConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<SupabaseTokenRow | null> {
  const query = new URL(`${config.url}/rest/v1/client_portal_tokens`);
  query.searchParams.set("token_hash", `eq.${tokenHash}`);
  query.searchParams.set("select", "client_id,revoked_at");
  query.searchParams.set("limit", "1");

  const response = await fetchImpl(query.toString(), {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
  });

  if (!response.ok) {
    // Status only, never the body: it can echo the query and the recipient,
    // and neither belongs in a log a client might one day see.
    throw new Error(`[client-portal] token lookup answered ${response.status}`);
  }

  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) return null;
  const row = rows[0] ?? null;
  if (!isTokenRow(row)) return null;
  return { client_id: row.client_id, revoked_at: row.revoked_at ?? null };
}

/** One row of `public.client_paid_reports` as the page read needs it. */
export interface SupabasePaidReport {
  title: string | null;
  html: string | null;
  unlocked: boolean;
}

function isPaidReport(value: unknown): value is SupabasePaidReport {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    (row.title === null || typeof row.title === "string") &&
    (row.html === null || typeof row.html === "string") &&
    typeof row.unlocked === "boolean"
  );
}

/**
 * The paid tab for a resolved client, or `null` when there is nothing safe
 * to render (no row, still locked, or staged content incomplete).
 *
 * Same transport contract as the token lookup above: service-role PostgREST
 * read, status-only errors, array-tolerant parsing (a stub returning rows
 * for every URL parses to `null` here rather than to a tab).
 */
export async function fetchPaidReport(
  clientId: string,
  config: SupabaseTokenConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<SupabasePaidReport | null> {
  const query = new URL(`${config.url}/rest/v1/client_paid_reports`);
  query.searchParams.set("client_id", `eq.${clientId}`);
  query.searchParams.set("select", "title,html,unlocked");
  query.searchParams.set("limit", "1");

  const response = await fetchImpl(query.toString(), {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`[client-portal] paid-report lookup answered ${response.status}`);
  }

  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) return null;
  const row = rows[0] ?? null;
  if (!isPaidReport(row)) return null;
  return row;
}

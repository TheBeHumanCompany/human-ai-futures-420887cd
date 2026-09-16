/**
 * The funnel fixture tier's shared contract: identifiers, env access, and the
 * small transport helpers both funnel scripts drive. Plain fetch against
 * PostgREST and the Storage API with the service-role key — the repo's
 * no-SDK server idiom (`supabase-tokens.ts`) — so `bun scripts/verify/…`
 * runs with nothing but bun and the Supabase env trio.
 *
 * WHY THE CLIENT_ID IS FIXED. Every consumer joins on it: the configured
 * token lookup resolves the digest to `client_id` and reads the content
 * store by that id, the webhook upserts `client_paid_reports` on
 * `on_conflict=client_id` using the checkout metadata value, and section
 * keys are unique per (client_id, section_key). A run-suffixed id would
 * strand the seeded rows from all three. The run scope therefore travels
 * as a stamp (`body.runId` on every section) plus the FUNNEL_RUN_ID in
 * every log line, while reset's cleanup scope is the client prefix — the
 * rows it deletes ARE the run's rows, because funnel-fixture exists only
 * for this tier.
 */

import {
  supabaseConfigFromEnv,
  type SupabaseTokenConfig,
} from "../../src/lib/client-portal/supabase-tokens";

export const FUNNEL_CLIENT_ID = "funnel-fixture";
export const FUNNEL_CLIENT_NAME = "The Funnel Fixture Co";
export const UPLOAD_BUCKET = "client-uploads";
export const STORAGE_PREFIX = `${FUNNEL_CLIENT_ID}/`;
export const RUN_ID_ENV = "FUNNEL_RUN_ID";
export const TEST_EMAIL_ENV = "FUNNEL_TEST_EMAIL";
export const STORE_PATH_ENV = "FUNNEL_STORE_PATH";
export const ANON_ENV = "SUPABASE_ANON_KEY";
/** Relative to the repo root; FUNNEL_STORE_PATH overrides, same as the app seam. */
export const DEFAULT_FIXTURE_STORE = "e2e/funnel/fixtures/clients.json";

const REQUEST_TIMEOUT_MS = 10_000;

export function requireEnv(
  name: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const value = env[name]?.trim();
  if (!value) {
    console.error(`[funnel] missing required env var ${name}`);
    process.exit(1);
  }
  return value;
}

export function requireSupabaseConfig(): SupabaseTokenConfig {
  const config = supabaseConfigFromEnv();
  if (!config) {
    console.error("[funnel] missing required env vars SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  return config;
}

async function request(
  url: string,
  init: RequestInit,
  role: "service" | "anon",
  config: SupabaseTokenConfig,
  anonKey?: string,
): Promise<Response> {
  const key = role === "service" ? config.serviceRoleKey : anonKey;
  if (!key) throw new Error("no key for anon request");
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${key}`);
  return fetch(url, { ...init, headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
}

/** PostgREST call with the service role. Status-only errors, no body echo. */
export async function rest(
  config: SupabaseTokenConfig,
  method: string,
  table: string,
  query: string,
  body?: unknown,
): Promise<unknown> {
  const url = `${config.url}/rest/v1/${table}${query}`;
  const headers = new Headers({ Accept: "application/json" });
  if (method === "DELETE") headers.set("Prefer", "return=representation");
  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
    headers.set("Prefer", "resolution=merge-duplicates,return=representation");
  }
  const response = await request(
    url,
    { method, headers, body: body === undefined ? undefined : JSON.stringify(body) },
    "service",
    config,
  );
  if (!response.ok) {
    throw new Error(`[funnel] ${method} ${table} answered ${response.status}`);
  }
  const text = await response.text();
  return text.length > 0 ? JSON.parse(text) : [];
}

async function storageRequest(
  config: SupabaseTokenConfig,
  method: string,
  path: string,
  init: RequestInit = {},
  role: "service" | "anon" = "service",
  anonKey?: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (typeof init.body === "string") headers.set("Content-Type", "application/json");
  return request(
    `${config.url}/storage/v1/${path}`,
    { ...init, method, headers },
    role,
    config,
    anonKey,
  );
}

/**
 * The upload bucket, created when absent. RLS itself cannot be created over
 * REST (no SQL channel without an SDK or the dashboard), so the seed instead
 * VERIFIES the migration-pattern outcome: the bucket is private and the anon
 * role is denied while the service role round-trips. Any anon 2xx is a hard
 * failure naming the leak.
 */
export async function ensureUploadBucket(
  config: SupabaseTokenConfig,
  runId: string,
  anonKey?: string,
): Promise<string> {
  const exists = await storageRequest(config, "GET", `bucket/${UPLOAD_BUCKET}`);
  if (!exists.ok) {
    // The storage API answers a missing bucket with HTTP 400 (body code
    // NoSuchBucket), not 404 — any failure here leads with a create.
    const created = await storageRequest(config, "POST", "bucket", {
      body: JSON.stringify({ name: UPLOAD_BUCKET, public: false }),
    });
    if (!created.ok && created.status !== 409) {
      throw new Error(`[funnel] bucket create answered ${created.status}`);
    }
  }

  const probePath = `${STORAGE_PREFIX}probe-${runId}.txt`;
  const uploaded = await storageRequest(config, "POST", `object/${UPLOAD_BUCKET}/${probePath}`, {
    body: "funnel-fixture probe",
    headers: new Headers({ "Content-Type": "text/plain", "x-upsert": "true" }),
  });
  if (!uploaded.ok) throw new Error(`[funnel] probe upload answered ${uploaded.status}`);

  if (anonKey) {
    const anonRead = await storageRequest(
      config,
      "GET",
      `object/${UPLOAD_BUCKET}/${probePath}`,
      {},
      "anon",
      anonKey,
    );
    if (anonRead.ok) {
      throw new Error(
        `[funnel] anon read of ${UPLOAD_BUCKET}/${probePath} answered ${anonRead.status} — the bucket is publicly readable, refusing to seed`,
      );
    }
  }
  const serviceRead = await storageRequest(config, "GET", `object/${UPLOAD_BUCKET}/${probePath}`);
  if (!serviceRead.ok) throw new Error(`[funnel] probe read answered ${serviceRead.status}`);
  const removed = await storageRequest(config, "DELETE", `object/${UPLOAD_BUCKET}/${probePath}`);
  if (!removed.ok) throw new Error(`[funnel] probe delete answered ${removed.status}`);
  return anonKey
    ? `bucket ${UPLOAD_BUCKET} ready (anon denied, service roundtrip ok)`
    : `bucket ${UPLOAD_BUCKET} ready (anon probe skipped — ${ANON_ENV} unset)`;
}


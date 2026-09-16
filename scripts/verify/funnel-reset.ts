/**
 * Deletes every funnel-run row and uploaded object from the dev Supabase
 * project, then VERIFIES the zeros by query — success is never silent.
 *
 *   set -a; source .env.local; set +a
 *   FUNNEL_RUN_ID=fw1-<short> bun scripts/verify/funnel-reset.ts
 *
 * Scope: rows with client_id funnel-fixture (the only rows this tier ever
 * creates) and storage objects under the funnel-fixture/ prefix in the
 * upload bucket. A project that was never seeded — or already reset — is a
 * successful no-op: zero matched rows, exit 0. Run before a funnel session
 * AND at teardown.
 */
import {
  FUNNEL_CLIENT_ID,
  requireEnv,
  requireSupabaseConfig,
  rest,
  RUN_ID_ENV,
  STORAGE_PREFIX,
  UPLOAD_BUCKET,
} from "./funnel-db";
import type { SupabaseTokenConfig } from "../../src/lib/client-portal/supabase-tokens";

interface StorageEntry {
  name?: unknown;
}

async function listStorageObjects(config: SupabaseTokenConfig): Promise<string[]> {
  const response = await fetch(`${config.url}/storage/v1/object/list/${UPLOAD_BUCKET}`, {
    method: "POST",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ prefix: STORAGE_PREFIX, limit: 1000 }),
    signal: AbortSignal.timeout(10_000),
  });
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`[funnel] storage list answered ${response.status}`);
  const entries: unknown = await response.json();
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry) => (entry as StorageEntry).name)
    .filter((name): name is string => typeof name === "string");
}

async function deleteStorageObject(config: SupabaseTokenConfig, name: string): Promise<void> {
  // List answers prefix-relative names; the object path needs the full key.
  const response = await fetch(
    `${config.url}/storage/v1/object/${UPLOAD_BUCKET}/${STORAGE_PREFIX}${encodeURIComponent(name)}`,
    {
      method: "DELETE",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
      },
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok)
    throw new Error(`[funnel] object delete answered ${response.status} for ${name}`);
}

async function countRows(config: SupabaseTokenConfig, table: string): Promise<number> {
  const rows = (await rest(
    config,
    "GET",
    table,
    `?client_id=eq.${FUNNEL_CLIENT_ID}&select=client_id`,
  )) as unknown[];
  return rows.length;
}

async function main(): Promise<void> {
  const runId = requireEnv(RUN_ID_ENV);
  const config = requireSupabaseConfig();

  const objects = await listStorageObjects(config);
  for (const name of objects) await deleteStorageObject(config, name);

  const deleted: Record<string, number> = {};
  for (const table of [
    "client_blueprint_sections",
    "client_paid_reports",
    "client_portal_tokens",
  ]) {
    const rows = (await rest(
      config,
      "DELETE",
      table,
      `?client_id=eq.${FUNNEL_CLIENT_ID}&select=client_id`,
    )) as unknown[];
    deleted[table] = rows.length;
  }

  // Success is proven by query, not assumed from the deletes.
  const remaining: Record<string, number> = {};
  for (const table of [
    "client_blueprint_sections",
    "client_paid_reports",
    "client_portal_tokens",
  ]) {
    remaining[table] = await countRows(config, table);
  }
  const remainingObjects = await listStorageObjects(config);

  const leftovers = Object.entries(remaining).filter(([, count]) => count > 0);
  if (leftovers.length > 0 || remainingObjects.length > 0) {
    console.error(
      `[funnel] run ${runId}: reset FAILED verification — rows left: ${JSON.stringify(remaining)}, objects left: ${remainingObjects.length}`,
    );
    process.exit(1);
  }

  console.log(
    `[funnel] run ${runId}: reset ok — deleted ${JSON.stringify(deleted)}, objects ${objects.length}`,
  );
  console.log(
    `[funnel] run ${runId}: verified zero — rows ${JSON.stringify(remaining)}, objects 0`,
  );
}

await main();

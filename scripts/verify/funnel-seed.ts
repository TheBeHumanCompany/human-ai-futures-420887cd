/**
 * Seeds the funnel fixture tier against the dev Supabase project.
 *
 *   set -a; source .env.local; set +a
 *   FUNNEL_RUN_ID=fw1-<short> FUNNEL_TEST_EMAIL=funnel@example.test \
 *     bun scripts/verify/funnel-seed.ts
 *
 * Writes ONLY run-owned rows (client_id funnel-fixture) and the upload
 * bucket: the token digest (SHA-256 of the fixture-store token, the lookup
 * scheme), the paid-report row staged unlocked=false, and the four
 * blueprint sections sec-pre-1/sec-pre-2 (preliminary, public) and
 * sec-fin-1/sec-fin-2 (final, paywalled by unlocked=false). Upserts with
 * merge-duplicates, so running twice converges on the same state; the run
 * stamp lands in every section body and in this log. Nothing here reads or
 * writes content/clients.json or any real client's rows. Token and key
 * values never reach stdout — digests and counts only.
 */
import {
  ANON_ENV,
  ensureUploadBucket,
  FUNNEL_CLIENT_ID,
  FUNNEL_CLIENT_NAME,
  requireEnv,
  requireSupabaseConfig,
  rest,
  RUN_ID_ENV,
  TEST_EMAIL_ENV,
} from "./funnel-db";
import { buildSeedState, readFixtureClient } from "./funnel-rows";

async function main(): Promise<void> {
  const runId = requireEnv(RUN_ID_ENV);
  const testEmail = requireEnv(TEST_EMAIL_ENV);
  const config = requireSupabaseConfig();
  const anonKey = process.env[ANON_ENV]?.trim() || undefined;

  const client = await readFixtureClient();
  const state = await buildSeedState(client, runId);

  await rest(config, "POST", "client_portal_tokens", "?on_conflict=client_id", {
    client_id: FUNNEL_CLIENT_ID,
    token_hash: state.tokenHash,
    revoked_at: null,
  });
  await rest(config, "POST", "client_paid_reports", "?on_conflict=client_id", state.paidReport);
  await rest(
    config,
    "POST",
    "client_blueprint_sections",
    "?on_conflict=client_id,section_key",
    state.sections,
  );

  const bucket = await ensureUploadBucket(config, runId, anonKey);

  const tokens = (await rest(
    config,
    "GET",
    "client_portal_tokens",
    `?client_id=eq.${FUNNEL_CLIENT_ID}&select=client_id,revoked_at`,
  )) as Array<Record<string, unknown>>;
  const paid = (await rest(
    config,
    "GET",
    "client_paid_reports",
    `?client_id=eq.${FUNNEL_CLIENT_ID}&select=unlocked,unlocked_at`,
  )) as Array<Record<string, unknown>>;
  const sections = (await rest(
    config,
    "GET",
    "client_blueprint_sections",
    `?client_id=eq.${FUNNEL_CLIENT_ID}&select=section_key,tier,status,body&order=ordinal.asc`,
  )) as Array<Record<string, unknown>>;

  const sectionKeys = sections.map((row) => row.section_key).join(",");
  const stamped = sections.filter((row) => {
    const body = row.body as { runId?: unknown } | null;
    return body?.runId === runId;
  }).length;

  const failures: string[] = [];
  if (tokens.length !== 1 || tokens[0]?.revoked_at !== null) failures.push("token row");
  if (paid.length !== 1 || paid[0]?.unlocked !== false || paid[0]?.unlocked_at !== null) {
    failures.push("paid-report row");
  }
  if (
    sections.length !== 4 ||
    sectionKeys !== "sec-pre-1,sec-pre-2,sec-fin-1,sec-fin-2" ||
    stamped !== 4
  ) {
    failures.push("blueprint sections");
  }
  if (failures.length > 0) {
    console.error(`[funnel] seed did not converge: ${failures.join(", ")}`);
    process.exit(1);
  }

  console.log(
    `[funnel] run ${runId}: seeded ${FUNNEL_CLIENT_ID} (${FUNNEL_CLIENT_NAME}, contact ${testEmail})`,
  );
  console.log(
    `[funnel] run ${runId}: 1 token digest (revoked_at null), 1 paid row (unlocked false), 4 sections (stamped ${stamped}/4)`,
  );
  console.log(`[funnel] run ${runId}: ${bucket}`);
}

await main();

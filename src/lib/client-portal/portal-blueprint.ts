import type { BlueprintSection } from "./blueprint-schema";
import { fetchBlueprintSections } from "./blueprint-store";
import type { SupabaseTokenConfig } from "./supabase-tokens";

/**
 * The signed-in portal's engagement lookup (US-009, portal-host split).
 *
 * The Clerk/RLS path cannot see an unpaid client at all:
 * `client_paid_reports_clerk_read` is `using (auth.jwt()->>'sub' =
 * clerk_user_id and unlocked = true)` (20260914000002_clerk_paid_reports_rls)
 * and the sections policy exposes finals only when `unlocked = true`
 * (20260915000000_client_blueprint_sections). Both are deliberate. So the
 * locked preview comes from a service-role read gated on Clerk auth
 * server-side — the shape `/c/<token>` already uses.
 *
 * **The current-engagement rule, stated once:** the current engagement is
 * the unlocked one, most recently unlocked first; if no row is unlocked, the
 * locked row with the lowest `client_id`. The paid/locked split is made with
 * the `unlocked` flag across at most two queries, never with a timestamp
 * order alone: `unlocked` and `unlocked_at` are independent columns with no
 * CHECK tying them, and the repo's own fixtures treat
 * `{ unlocked: true, unlocked_at: null }` as valid — a single
 * `order=unlocked_at.desc.nullslast,client_id.asc&limit=1` would pick a
 * *locked* low-id row ahead of an unlocked row whose timestamp happens to be
 * null, showing a paying client the paywall.
 *
 * No token on these types and none in loader data — `tokens.ts` states the
 * contract: "Everything about a client that may leave the server. The token
 * stays."
 *
 * Server-only discipline: `supabase-tokens.ts` names environment variables
 * and is dynamically imported inside these functions, never at module scope
 * (the same bundling rule `portal.ts` follows for `supabase-clerk`).
 *
 * Failure is quiet by contract, mirroring `resolvePortalCompany`: a fetch
 * throw, a non-ok status, or a missing configuration degrade to `null` and
 * the page falls back to the RLS read's reports — a paid client's report
 * must never disappear because a service-role read blipped.
 */

export interface PortalEngagement {
  clientId: string;
  unlocked: boolean;
}

export interface PortalBlueprint extends PortalEngagement {
  sections: BlueprintSection[];
}

const LOOKUP_TIMEOUT_MS = 10_000;

/** Array-tolerant, like every other PostgREST stub-facing parse here. */
function parseEngagementRows(rows: unknown): PortalEngagement[] {
  if (!Array.isArray(rows)) return [];
  const parsed: PortalEngagement[] = [];
  for (const row of rows) {
    if (
      row !== null &&
      typeof row === "object" &&
      typeof (row as { client_id?: unknown }).client_id === "string" &&
      typeof (row as { unlocked?: unknown }).unlocked === "boolean"
    ) {
      parsed.push({
        clientId: (row as { client_id: string }).client_id,
        unlocked: (row as { unlocked: boolean }).unlocked,
      });
    }
  }
  return parsed;
}

async function fetchEngagement(
  userId: string,
  query: string,
  config: SupabaseTokenConfig,
  fetchImpl: typeof fetch,
): Promise<PortalEngagement[]> {
  const response = await fetchImpl(query, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`[client-portal] engagement lookup answered ${response.status}`);
  }
  return parseEngagementRows(await response.json());
}

/**
 * The engagement behind a Clerk account, or `null` when the account maps to
 * none. Makes the paid/locked distinction with `unlocked`, not with a
 * timestamp order, and issues at most two queries (see the module comment
 * for why one ordered query is wrong).
 */
export async function clientIdForClerkUser(
  userId: string,
  config: SupabaseTokenConfig,
  fetchImpl?: typeof fetch,
): Promise<PortalEngagement | null> {
  const impl = fetchImpl ?? fetch;
  const base = `${config.url}/rest/v1/client_paid_reports`;
  // 1. An unlocked row wins — most recently unlocked first, id as tiebreak.
  const unlockedUrl =
    `${base}?clerk_user_id=eq.${encodeURIComponent(userId)}` +
    "&unlocked=eq.true&select=client_id,unlocked" +
    "&order=unlocked_at.desc.nullslast,client_id.asc&limit=1";
  const unlockedRows = await fetchEngagement(userId, unlockedUrl, config, impl);
  if (unlockedRows.length > 0) return unlockedRows[0]!;
  // 2. Only when nothing is unlocked: the locked row with the lowest id.
  const lockedUrl =
    `${base}?clerk_user_id=eq.${encodeURIComponent(userId)}` +
    "&unlocked=eq.false&select=client_id,unlocked" +
    "&order=client_id.asc&limit=1";
  const lockedRows = await fetchEngagement(userId, lockedUrl, config, impl);
  return lockedRows[0] ?? null;
}

/**
 * The current engagement's blueprint with the tier gate applied at the one
 * chokepoint (`fetchBlueprintSections` → `applyTier`), so a locked final
 * arrives as title + teaser with `blocks` stripped. Never re-implement the
 * gate here.
 */
export async function loadPortalBlueprint(
  userId: string,
  deps: { fetchImpl?: typeof fetch; supabaseConfig?: SupabaseTokenConfig | null } = {},
): Promise<PortalBlueprint | null> {
  try {
    // Dynamic import is deliberate, not lazy: `supabase-tokens.ts` names the
    // service-role environment variables, and a static import would hand
    // that plumbing to every bundler that walks this file from the route
    // (the same server-only discipline `portal.ts` applies to
    // `supabase-clerk`).
    const tokens = await import("./supabase-tokens");
    const config =
      deps.supabaseConfig === undefined ? tokens.supabaseConfigFromEnv() : deps.supabaseConfig;
    if (!config) return null;
    const engagement = await clientIdForClerkUser(userId, config, deps.fetchImpl);
    if (!engagement) return null;
    const sections = await fetchBlueprintSections(
      engagement.clientId,
      engagement.unlocked,
      config,
      deps.fetchImpl ?? fetch,
    );
    return { ...engagement, sections };
  } catch (error) {
    console.error(
      `[client-portal] blueprint lookup failed: ${error instanceof Error ? error.message : error}`,
    );
    return null;
  }
}

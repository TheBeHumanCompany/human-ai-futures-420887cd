import { applyTier, parseSections, type BlueprintSection } from "./blueprint-schema";
import type { SupabaseTokenConfig } from "./supabase-tokens";

/**
 * Reading a client's blueprint sections on the magic-link path.
 *
 * Same transport contract as `lookupClientTokenRow` and `fetchPaidReport`:
 * service-role PostgREST, an explicit timeout, status-only errors (a body can
 * echo the query and the recipient, and neither belongs in a log), and
 * array-tolerant parsing so a stub that answers every URL parses to nothing
 * rather than to content.
 *
 * THE GATE IS NOT OPTIONAL HERE. The service-role key bypasses RLS by design
 * (US-001), so the policy in
 * `supabase/migrations/20260915000000_client_blueprint_sections.sql` does not
 * protect this path — it protects `/portal`. That is why `unlocked` is a
 * REQUIRED parameter rather than an option with a default: there is no way to
 * call this function and forget to say whether the client has paid, and the
 * withheld bodies are dropped here, on the server, before the sections are
 * returned to anything that could serialise them.
 *
 * `status=eq.published` keeps drafts invisible on both paths. Draft sections
 * are how the operator stages the final blueprint before the back-and-forth is
 * finished, so they must not appear merely because the client has paid.
 */

const LOOKUP_TIMEOUT_MS = 10_000;

export async function fetchBlueprintSections(
  clientId: string,
  unlocked: boolean,
  config: SupabaseTokenConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<BlueprintSection[]> {
  const query = new URL(`${config.url}/rest/v1/client_blueprint_sections`);
  query.searchParams.set("client_id", `eq.${clientId}`);
  query.searchParams.set("status", "eq.published");
  query.searchParams.set("select", "id,section_key,ordinal,tier,title,teaser,band,body");
  query.searchParams.set("order", "ordinal.asc");

  const response = await fetchImpl(query.toString(), {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`[client-portal] blueprint lookup answered ${response.status}`);
  }

  const rows: unknown = await response.json();
  return applyTier(parseSections(rows), unlocked);
}

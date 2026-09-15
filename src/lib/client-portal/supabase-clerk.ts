/**
 * Clerk-token reads of the paid-report table (US-009).
 *
 * The authenticated-role counterpart of `supabase-tokens.ts`: same
 * transport discipline (plain fetch, no SDK, status-only errors,
 * injectable `fetchImpl`), but the credential is the caller's Clerk
 * session token and the key is the public anon key. RLS is the only
 * filter — the request carries no equality predicates, because the caller
 * cannot know which rows are theirs and must not be trusted to say so.
 *
 * Third-party auth must be enabled for this to answer anything but
 * denials: Supabase validates the Clerk token (JWKS, configured under
 * `[auth.third_party.clerk]`) and maps tokens carrying
 * `role=authenticated` — the claim the Clerk Supabase integration adds —
 * onto the `authenticated` Postgres role the US-009 migration's policy
 * targets. Without that claim every read here denies, by design.
 *
 * The anon key is public by construction, so unlike `supabase-tokens.ts`
 * nothing here is secret; the module still resolves its configuration
 * from the environment at call time and stays server-side by convention —
 * the portal server function loads it through a dynamic `import()`, the
 * same trick `tokens.ts` uses for the token store.
 */

export const SUPABASE_URL_ENV = "SUPABASE_URL";
export const SUPABASE_ANON_ENV = "SUPABASE_ANON_KEY";

/** How long a portal read may hold the page before failing closed. */
const PORTAL_READ_TIMEOUT_MS = 10_000;

export interface ClerkSupabaseConfig {
  /** Project REST base, e.g. https://xyzcompany.supabase.co. No trailing slash. */
  url: string;
  /**
   * Public anon key. Safe for the `apikey` header — it grants nothing on
   * its own; every row this read can see was earned by the Bearer token.
   */
  anonKey: string;
}

/** One renderable paid report, as the portal page needs it. */
export interface ClerkScopedReport {
  client_id: string;
  title: string;
  html: string;
  /** Re-checked defensively, though the policy already enforces it. */
  unlocked: boolean;
  unlocked_at: string | null;
}

/**
 * Reads the portal configuration from the environment. `null` when either
 * value is absent — the caller then refuses to run (a half-configured
 * read must never execute), the same contract `supabaseConfigFromEnv`
 * upholds for the service-role tier.
 */
export function clerkSupabaseConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): ClerkSupabaseConfig | null {
  const url = env[SUPABASE_URL_ENV]?.trim().replace(/\/+$/, "");
  const anonKey = env[SUPABASE_ANON_ENV]?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

/**
 * A row is renderable when both halves exist (US-011's rule): non-empty
 * title AND html, plus the shape the portal renders. RLS already refuses
 * locked rows; this guard only enforces completeness, so an unlocked row
 * staged with null content simply does not appear rather than rendering
 * a half-written tab.
 */
function isRenderableReport(value: unknown): value is ClerkScopedReport {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.client_id === "string" &&
    row.client_id.length > 0 &&
    typeof row.title === "string" &&
    row.title.trim().length > 0 &&
    typeof row.html === "string" &&
    row.html.trim().length > 0 &&
    row.unlocked === true &&
    (row.unlocked_at === null || typeof row.unlocked_at === "string")
  );
}

/**
 * The signed-in user's unlocked paid reports, filtered by nothing the
 * client controls: the Clerk session token in the Authorization header
 * IS the query. Throws on transport failure (status-only message) so the
 * portal route fails closed loudly instead of mistaking an outage for an
 * empty account.
 */
export async function fetchClerkScopedPaidReports(
  clerkToken: string,
  config: ClerkSupabaseConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<ClerkScopedReport[]> {
  const query = new URL(`${config.url}/rest/v1/client_paid_reports`);
  query.searchParams.set("select", "client_id,title,html,unlocked,unlocked_at");
  query.searchParams.set("order", "unlocked_at.desc");

  const response = await fetchImpl(query.toString(), {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${clerkToken}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(PORTAL_READ_TIMEOUT_MS),
  });

  if (!response.ok) {
    // Status only, never the body: it can echo the token recipient.
    throw new Error(`[client-portal] clerk-scoped read answered ${response.status}`);
  }

  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) return [];
  return rows.filter(isRenderableReport);
}

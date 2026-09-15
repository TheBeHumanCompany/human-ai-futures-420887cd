import { createServerFn } from "@tanstack/react-start";

import type { SupabasePaidReport } from "./supabase-tokens";

import type { SupabaseTokenConfig } from "./supabase-tokens";

/**
 * Per-client magic-link tokens for the private client portal (US-001).
 *
 * One long-lived token per client. The token alone opens exactly that
 * client's page — there is no gate between opening the link and reading the
 * page, by decision, so the token IS the credential and is handled like one:
 *
 * - When Supabase is configured, token digests live in the
 *   `client_portal_tokens` table (migration under `supabase/migrations/`),
 *   and only the SHA-256 digest ever leaves the server toward Postgres. The
 *   fixture fallback is `content/clients.json` (the content store, outside
 *   the site code paths). In both tiers the raw token lives in neither
 *   source, listing, sitemap, nor client bundle. Only
 *   `fetchClientPageByTokenFn` below reads a store, and it runs server-side
 *   only (see below).
 * - A lookup returns the client's page WITHOUT the token field, so the value
 *   never crosses into rendered HTML or loader data.
 * - Unknown and malformed tokens both resolve to `null`, and the route turns
 *   that into a 404. The two are deliberately indistinguishable: a distinct
 *   "bad format" response would be a validity oracle for guessing tokens.
 *
 * **Each lookup is exported twice, mirroring `lib/podcast/queries.ts`.**
 * - `…Fn` — a plain async function, for callers that are already server-only.
 * - the wrapper — a `createServerFn({ method: "GET" })` over the same
 *   function, for the route loader. A bare TanStack loader ALSO runs in the
 *   browser on a client-side navigation, so reading the store directly in the
 *   loader would ship `clients.json` — every client's token — in the client
 *   bundle. The server function keeps the file on the server.
 */

export interface ClientReport {
  /** Stable handle within the client's page; doubles as the tab value. */
  id: string;
  /** Report title rendered in the sidebar and above the report body. */
  title: string;
  /** The report body, as authored HTML. */
  html: string;
}

export interface ClientRecord {
  /** Stable handle used by later flows (publisher, tier changes, re-issue). */
  id: string;
  /** Display name rendered on the client's page. */
  name: string;
  /** The secret: 32 random bytes, base64url, 43 characters. */
  token: string;
  /** Page title rendered for this client. */
  title: string;
  /** The client's report body, as authored HTML. */
  html: string;
  /**
   * The client's reports, newest appended last (US-003). Optional so records
   * authored before multi-report pages keep working: when absent, the page
   * carries the single legacy `title`/`html` as its one report.
   */
  reports?: ClientReport[];
}

/** Everything about a client that may leave the server. The token stays. */
export type ClientPage = Omit<ClientRecord, "token" | "reports"> & {
  /**
   * Every report on the client's page, in sidebar order. Always non-empty:
   * a record with no usable `reports` entry normalises to its legacy
   * single report, so the page never renders with no tab selected.
   */
  reports: ClientReport[];
};

/**
 * The token alphabet: URL-safe base64, minimum 32 characters. The floor
 * rejects short placeholders and path-traversal-looking input before any
 * comparison runs; the ceiling is open so a longer rotation value stays valid.
 */
export const TOKEN_FORMAT = /^[A-Za-z0-9_-]{32,}$/;

export function isTokenFormat(value: unknown): value is string {
  return typeof value === "string" && TOKEN_FORMAT.test(value);
}

/**
 * The token validator, exported so its behaviour is testable on its own.
 *
 * Rejects a non-string outright rather than coercing. The value arrives from
 * a URL parameter; this is a shape guard, not the privacy guard — that is
 * `lookupClientByToken` returning `null`, which the route answers with a 404.
 */
export function validateToken(data: unknown): string {
  if (typeof data !== "string" || data.length === 0) {
    throw new Error(`[client-portal] expected a non-empty token string, received ${typeof data}`);
  }
  return data;
}

function isClientReport(value: unknown): value is ClientReport {
  if (typeof value !== "object" || value === null) return false;
  const report = value as Record<string, unknown>;
  return (
    typeof report.id === "string" &&
    report.id.length > 0 &&
    typeof report.title === "string" &&
    typeof report.html === "string"
  );
}

function isClientRecord(value: unknown): value is ClientRecord {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.token === "string" &&
    typeof record.title === "string" &&
    typeof record.html === "string" &&
    (record.reports === undefined ||
      (Array.isArray(record.reports) && record.reports.every(isClientReport)))
  );
}

/**
 * The reports for one client's page, in store order (US-003).
 *
 * A record carrying a usable `reports` list renders it directly. Anything
 * else — absent, empty, or holding an entry the store could not have meant
 * as a report — falls back to the legacy single report, so the page still
 * renders exactly what it did before multi-report pages existed.
 *
 * Report ids must be unique: they anchor each report's section, so a list
 * with a repeated id is unusable and falls back the same way.
 */
export function reportsOf(record: ClientRecord): ClientReport[] {
  const reports = record.reports;
  if (Array.isArray(reports) && reports.length > 0 && reports.every(isClientReport)) {
    const ids = new Set(reports.map((report) => report.id));
    if (ids.size === reports.length) return reports;
  }
  return [{ id: "report", title: record.title, html: record.html }];
}

/**
 * The one token check. Pure over its inputs so tests can pin the behaviour
 * without a server: well-formed token present in the store resolves to
 * exactly that client's record, everything else resolves to `null`.
 *
 * Comparison is strict equality. Tokens carry 256 bits of entropy and are
 * unguessable, so there is no weaker value to be constant-time against — and
 * a failure here denies access, which is the safe direction.
 */
export function lookupClientByToken(
  token: string,
  clients: readonly ClientRecord[],
): ClientRecord | null {
  if (!isTokenFormat(token)) return null;
  return clients.find((candidate) => candidate.token === token) ?? null;
}

/**
 * Reads the store. Entries that fail the shape guard are skipped, so one bad
 * record cannot take down every client's page — and a store that is missing
 * or malformed resolves to no clients, denying everyone, which is the safe
 * direction for a private portal.
 */
async function readClientStore(): Promise<ClientRecord[]> {
  const store = (await import("../../../content/clients.json")) as { default: unknown };
  if (!Array.isArray(store.default)) return [];
  return store.default.filter(isClientRecord);
}

/**
 * The Stripe-released paid report (US-011), or nothing.
 *
 * Rendered only when the paid-reports row exists with unlocked=true AND a
 * non-empty staged title and html: payment-before-staging and
 * staging-before-payment both resolve to no new report, never to a
 * half-rendered one. A hand-published store report with id `paid` (the US-007
 * manual path) wins over this row — deliberate operator content in git beats
 * the automated gate, and two reports must never share the `paid` value.
 */
export const PAID_REPORT_ID = "paid";

function stripePaidReport(
  match: ClientRecord,
  paid: SupabasePaidReport | null,
): ClientReport | null {
  if (!paid || !paid.unlocked || !paid.title || !paid.html) return null;
  if (reportsOf(match).some((report) => report.id === PAID_REPORT_ID)) return null;
  return { id: PAID_REPORT_ID, title: paid.title, html: paid.html };
}

function toClientPage(match: ClientRecord, paid: SupabasePaidReport | null = null): ClientPage {
  const reports = [...reportsOf(match)];
  const paidReport = stripePaidReport(match, paid);
  if (paidReport) reports.push(paidReport);
  return {
    id: match.id,
    name: match.name,
    title: match.title,
    // Every report joined, so readers of the legacy single body keep seeing
    // the whole page. The route renders per-report from `reports`.
    html: reports.map((report) => report.html).join("\n"),
    reports,
  };
}

/**
 * The seam for tests, mirroring `deliverEnquiry(data, deps)` in
 * `lib/contact.ts`: `supabaseConfig` picks the tier outright, while the
 * default (`undefined`) reads the deploy environment, which is what the
 * route's server function always wants. `fetchImpl` and `readStore` exist so
 * the Supabase branches can be proven without a network or a database.
 */
export interface TokenLookupDeps {
  readStore?: () => Promise<ClientRecord[]>;
  supabaseConfig?: SupabaseTokenConfig | null;
  fetchImpl?: typeof fetch;
}

/**
 * One client's page by token, or `null` when the token resolves to nobody.
 *
 * Two tiers, decided per call. When Supabase is configured it is canonical:
 * the opaque token is hashed, the digest resolves to a client_id (revoked
 * rows deny), and the page is read from the content store by that id — so a
 * configured lookup never compares raw tokens and never falls back to them.
 * A transport failure denies rather than falling back either: the fixture
 * store still holding the raw token is exactly what a revoked link must not
 * be able to use. Unconfigured (local dev, tests), the lookup compares
 * against the fixture store directly, which is the behaviour the HTTP and
 * isolation checks below were recorded against.
 */
export async function fetchClientPageByTokenFn(
  token: string,
  deps: TokenLookupDeps = {},
): Promise<ClientPage | null> {
  const readStore = deps.readStore ?? readClientStore;
  // Dynamic import, mirroring the store read below: the Supabase module
  // names the service-role env var, and a static import would hand that
  // string to every bundler that walks this file from the route. Loaded
  // here, it only ever executes inside the server function.
  const portalStore = await import("./supabase-tokens");
  const config =
    deps.supabaseConfig === undefined ? portalStore.supabaseConfigFromEnv() : deps.supabaseConfig;

  if (config) {
    // Format first, network second: a malformed value resolves to nobody
    // without a round trip, keeping unknown and malformed indistinguishable.
    if (!isTokenFormat(token)) return null;
    let row;
    try {
      row = await portalStore.lookupClientTokenRow(
        await portalStore.hashToken(token),
        config,
        deps.fetchImpl ?? fetch,
      );
    } catch (error) {
      console.error(
        `[client-portal] token lookup failed: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
    if (!row || row.revoked_at) return null;
    const match = (await readStore()).find((client) => client.id === row.client_id) ?? null;
    if (!match) return null;
    // Paid-tab fetch failure must not take down the page the token already
    // earned: the reports resolve without the tab, exactly as before US-011.
    let paid: SupabasePaidReport | null = null;
    try {
      paid = await portalStore.fetchPaidReport(row.client_id, config, deps.fetchImpl ?? fetch);
    } catch (error) {
      console.error(
        `[client-portal] paid-report lookup failed: ${error instanceof Error ? error.message : error}`,
      );
    }
    return toClientPage(match, paid);
  }

  const match = lookupClientByToken(token, await readStore());
  return match ? toClientPage(match) : null;
}

export const fetchClientPageByToken = createServerFn({ method: "GET" })
  .validator(validateToken)
  .handler(({ data }) => fetchClientPageByTokenFn(data));

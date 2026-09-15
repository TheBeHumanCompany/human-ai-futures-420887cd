/**
 * Clerk account provisioning on payment (US-009).
 *
 * The webhook calls this with the Stripe checkout payer email: the address
 * a customer actually paid with is the verified identity the portal
 * account belongs to. Provisioning is deliberately best-effort — Clerk's
 * uptime may never gate the unlock (the magic link keeps working), so
 * every failure path answers `null` and the release upsert simply omits
 * `clerk_user_id`, which `merge-duplicates` leaves untouched for a later
 * replay to fill.
 *
 * Plain `fetch` against the Clerk Backend API (no SDK), mirroring the
 * Resend/Stripe/PostgREST transports: status-only logging, injectable
 * `fetchImpl`, WebCrypto-free (Workers-safe by construction).
 *
 * Server-side only: this module names CLERK_SECRET_KEY and is loaded
 * through a dynamic `import()` inside the webhook router, exactly like
 * `supabase-tokens.ts` — never through a static import a route file can
 * see. Type-only imports are erased at build and are safe.
 */

export const CLERK_SECRET_KEY_ENV = "CLERK_SECRET_KEY";

/** How long provisioning may hold the webhook before giving up on it. */
const PROVISION_TIMEOUT_MS = 10_000;

const CLERK_API_BASE = "https://api.clerk.com/v1";

/**
 * The secret key, or `null` when absent. Parameterised like
 * `supabaseConfigFromEnv` so tests pin the branches without touching the
 * real environment.
 */
export function clerkSecretFromEnv(
  env: Record<string, string | undefined> = process.env,
): string | null {
  return env[CLERK_SECRET_KEY_ENV]?.trim() || null;
}

export interface ClerkProvisionArgs {
  /** The Stripe checkout payer email. */
  email: string;
  /** Sk- key. Falls back to the environment when omitted. */
  clerkSecretKey?: string;
  fetchImpl?: typeof fetch;
}

export interface ClerkProvisionResult {
  /** Full Clerk user id (`user_...`) — the value RLS compares against `sub`. */
  clerkUserId: string;
}

interface ClerkResponse {
  ok: boolean;
  status: number;
  body: unknown;
}

async function clerkFetch(
  url: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
  init?: { method: string; body?: string },
): Promise<ClerkResponse> {
  try {
    const response = await fetchImpl(url, {
      headers,
      signal: AbortSignal.timeout(PROVISION_TIMEOUT_MS),
      ...init,
    });
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    return { ok: response.ok, status: response.status, body };
  } catch {
    // Status-less (network/timeout). Constant message: fetch failures can
    // embed the URL, which embeds the email — neither belongs in a log.
    console.error("[billing] clerk request failed");
    return { ok: false, status: 0, body: null };
  }
}

function authHeaders(secret: string): Record<string, string> {
  return {
    Authorization: `Bearer ${secret}`,
    "Content-Type": "application/json",
  };
}

/** First `data[].id` of a list response, or `null`. */
function firstUserId(body: unknown): string | null {
  const data = (body as Record<string, unknown> | null)?.data;
  if (!Array.isArray(data) || data.length === 0) return null;
  const id = (data[0] as Record<string, unknown> | null)?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/** `id` of a create response, or `null`. */
function userIdOf(body: unknown): string | null {
  const id = (body as Record<string, unknown> | null)?.id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/** A create rejected with `identifier_taken` (the email raced an existing user). */
function isIdentifierTaken(body: unknown): boolean {
  const errors = (body as Record<string, unknown> | null)?.errors;
  if (!Array.isArray(errors)) return false;
  return errors.some(
    (error) =>
      typeof error === "object" &&
      error !== null &&
      (error as Record<string, unknown>).code === "identifier_taken",
  );
}

async function findUserIdByEmail(
  email: string,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<string | null> {
  const list = await clerkFetch(
    `${CLERK_API_BASE}/users?email_address[]=${encodeURIComponent(email)}&limit=1`,
    headers,
    fetchImpl,
  );
  if (!list.ok) {
    console.error(`[billing] clerk user lookup answered ${list.status}`);
    return null;
  }
  return firstUserId(list.body);
}

/**
 * The Clerk user id for a payer email, provisioning the account when it
 * does not exist yet.
 *
 * GET-first: a replay or an already-invited address costs one read and
 * mutates nothing. Creation is passwordless (`skip_password_required`) —
 * the email is Stripe-verified, and the follow-up invitation is the
 * client's guided path to credentials; both skip flags keep the create
 * from bouncing off instance requirements this flow has already proved.
 * The invitation fires only on the create path (an existing user already
 * has, or was already sent, a way in) and is itself best-effort: a
 * refused invitation must not null the linkage. Every failure answers
 * `null` without throwing — Clerk's uptime may never gate the unlock.
 */
export async function provisionClerkUserForEmail(
  args: ClerkProvisionArgs,
): Promise<ClerkProvisionResult | null> {
  const secret = args.clerkSecretKey?.trim() || clerkSecretFromEnv();
  const email = args.email.trim();
  if (!secret || !email) return null;
  const fetchImpl = args.fetchImpl ?? fetch;
  const headers = authHeaders(secret);

  const existing = await findUserIdByEmail(email, headers, fetchImpl);
  if (existing) return { clerkUserId: existing };

  const created = await clerkFetch(`${CLERK_API_BASE}/users`, headers, fetchImpl, {
    method: "POST",
    body: JSON.stringify({
      email_addresses: [email],
      skip_password_required: true,
      skip_email_verification_required: true,
    }),
  });
  if (created.status === 422 && isIdentifierTaken(created.body)) {
    // Raced: the user appeared between the GET and the POST. The list
    // read is authoritative; fall back to it rather than failing.
    const raced = await findUserIdByEmail(email, headers, fetchImpl);
    return raced ? { clerkUserId: raced } : null;
  }
  if (!created.ok) {
    console.error(`[billing] clerk create answered ${created.status}`);
    return null;
  }
  const id = userIdOf(created.body);
  if (!id) {
    console.error("[billing] clerk create returned no user id");
    return null;
  }

  const invitation = await clerkFetch(`${CLERK_API_BASE}/invitations`, headers, fetchImpl, {
    method: "POST",
    body: JSON.stringify({
      email_address: email,
      notify: true,
      ignore_existing: true,
    }),
  });
  if (!invitation.ok) {
    console.error(`[billing] clerk invitation answered ${invitation.status}`);
  }
  return { clerkUserId: id };
}

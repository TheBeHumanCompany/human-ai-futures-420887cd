import { auth } from "@clerk/tanstack-react-start/server";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import type { BlueprintSection } from "./blueprint-schema";
import { parseSections } from "./blueprint-schema";
import { explain, judgeUpload, storageKeyFor, type UploadRejection } from "./upload-policy";
import type { ClerkSupabaseConfig } from "./supabase-clerk";
import type { PortalAuthState } from "./portal";

/**
 * The portal's report-driven upload intake (todo 10, G4).
 *
 * The card asks for the documents the audit still needs, one question per
 * final-tier section of the client's blueprint. The questions are DERIVED,
 * not authored: a fixed template over the section titles, no model in the
 * loop, so the same seeded sections always produce the same prompts and the
 * funnel suite can pin them as a snapshot. Final tier is the vocabulary
 * `applyTier` established (blueprint-schema.ts) — the sections worth
 * supporting documents for are the ones the client paid to read.
 *
 * The sections arrive over the same RLS-scoped read discipline as the
 * reports (supabase-clerk.ts): the Clerk session token in the Authorization
 * header IS the query, and migration 20260915000000 already refuses any
 * section this account has not earned. Before payment the final sections
 * are simply absent, the question set is empty, and the card does not
 * render — the intake exists only downstream of the paywall, by policy.
 *
 * The upload path judges BEFORE it writes. A file the policy refuses
 * (`upload-policy.ts`, consumed as-is) answers with `explain`'s message and
 * the storage endpoint is never dialed — zero writes is a control-flow fact
 * here, not a cleanup promise. An accepted file lands at
 * `storageKeyFor(clientId, name, id)` in the `client-uploads` bucket with
 * the service role, mirroring `scripts/verify/funnel-db.ts`'s REST write —
 * the id is a fresh uuid per upload, so a re-upload after confirmation
 * stores a NEW object rather than overwriting (the prior object stays, an
 * audit trail; the confirmation state simply shows the newest one).
 *
 * The storage object IS the record. No uploads table exists in the schema,
 * and none is added here; the server function returns the stored key and
 * the card's confirmation state renders only after the write is verified.
 */

export const UPLOAD_BUCKET = "client-uploads";

const UPLOAD_TIMEOUT_MS = 10_000;

/** The one question template. Pinned by snapshot — change it and tests follow. */
export const intakeQuestionFor = (title: string): string =>
  `For the section '${title}', upload the supporting document.`;

export interface IntakeQuestion {
  sectionKey: string;
  title: string;
  prompt: string;
}

/**
 * One question per final-tier section, ordinal-ordered regardless of input
 * order. Deterministic by construction: same sections in, same strings out.
 */
export function deriveIntakeQuestions(sections: readonly BlueprintSection[]): IntakeQuestion[] {
  return sections
    .filter((section) => section.tier === "final")
    .sort((a, b) => a.ordinal - b.ordinal)
    .map((section) => ({
      sectionKey: section.sectionKey,
      title: section.title,
      prompt: intakeQuestionFor(section.title),
    }));
}

/* ------------------------------------------------------------------ */
/* The RLS-scoped sections read (the reports read's sibling)            */
/* ------------------------------------------------------------------ */

/**
 * The published blueprint sections this Clerk session may see, ordinal
 * ordered. Transport mirrors `fetchClerkScopedPaidReports`: plain fetch, the
 * anon key in `apikey` (it grants nothing alone — RLS is the filter), the
 * session token as Bearer, status-only errors, array-tolerant parsing.
 */
export async function fetchClerkScopedBlueprintSections(
  clerkToken: string,
  config: ClerkSupabaseConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<BlueprintSection[]> {
  const query = new URL(`${config.url}/rest/v1/client_blueprint_sections`);
  query.searchParams.set("select", "id,section_key,ordinal,tier,title,band");
  query.searchParams.set("order", "ordinal.asc");

  const response = await fetchImpl(query.toString(), {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${clerkToken}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  });

  if (!response.ok) {
    // Status only, never the body: it can echo the token recipient.
    throw new Error(`[client-portal] blueprint sections read answered ${response.status}`);
  }

  const rows: unknown = await response.json();
  if (!Array.isArray(rows)) return [];
  return parseSections(rows);
}

/* ------------------------------------------------------------------ */
/* The upload record — policy first, storage second                     */
/* ------------------------------------------------------------------ */

export type IntakeUploadOutcome =
  | { status: "rejected"; reason: UploadRejection; message: string }
  | { status: "stored"; key: string; bucket: string };

export interface IntakeUploadDeps {
  /** Test seam; production judges with the shipped policy. */
  judge?: typeof judgeUpload;
  /** Test seam; production mints a uuid per upload. */
  newId?: () => string;
  fetchImpl?: typeof fetch;
}

/**
 * Judge the file, then — only if it passed — write it to storage at
 * `storageKeyFor`'s key with the service role and answer the stored key.
 *
 * The rejection branch returns BEFORE any request exists to make, so a
 * refused file costs zero storage writes by construction. The stored branch
 * answers only after a 2xx: a failed write throws (status-only message) and
 * the caller can never mistake an outage for a confirmation.
 */
export async function storeIntakeUpload(
  clientId: string,
  file: { name: string; size: number; type: string },
  bytes: Blob,
  config: { url: string; serviceRoleKey: string },
  deps: IntakeUploadDeps = {},
): Promise<IntakeUploadOutcome> {
  const verdict = (deps.judge ?? judgeUpload)(file);
  if (!verdict.ok) {
    return { status: "rejected", reason: verdict.reason, message: explain(verdict.reason) };
  }

  // Bound call: extracting `randomUUID` bare trips the Crypto brand check.
  const id = deps.newId ?? (() => crypto.randomUUID());
  const key = storageKeyFor(clientId, verdict.storedName, id());
  const declared = file.type.split(";")[0]!.trim().toLowerCase();

  const response = await (deps.fetchImpl ?? fetch)(
    `${config.url}/storage/v1/object/${UPLOAD_BUCKET}/${key}`,
    {
      method: "POST",
      headers: {
        apikey: config.serviceRoleKey,
        Authorization: `Bearer ${config.serviceRoleKey}`,
        "Content-Type": declared.length > 0 ? declared : "application/octet-stream",
      },
      body: bytes,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    throw new Error(`[client-portal] upload storage answered ${response.status}`);
  }
  return { status: "stored", key, bucket: UPLOAD_BUCKET };
}

/* ------------------------------------------------------------------ */
/* The server functions                                                 */
/* ------------------------------------------------------------------ */

export interface IntakeDeps {
  fetchImpl?: typeof fetch;
  supabaseConfig?: ClerkSupabaseConfig | null;
}

/**
 * The question set behind the portal card, joined the same additive way the
 * company identity is: from ids the RLS-scoped session produced, degrading
 * to an empty set on every missing half. Questions are decoration on a page
 * the session already earned — an outage must never break the reports to
 * withhold them.
 */
export async function loadIntakeQuestions(
  authState: PortalAuthState,
  deps: IntakeDeps = {},
): Promise<{ questions: IntakeQuestion[] }> {
  if (!authState.userId) return { questions: [] };
  const clerkToken = await authState.getToken();
  if (!clerkToken) return { questions: [] };
  const clerkStore = await import("./supabase-clerk");
  const config =
    deps.supabaseConfig === undefined
      ? clerkStore.clerkSupabaseConfigFromEnv()
      : deps.supabaseConfig;
  if (!config) return { questions: [] };
  try {
    const sections = await fetchClerkScopedBlueprintSections(
      clerkToken,
      config,
      deps.fetchImpl ?? fetch,
    );
    return { questions: deriveIntakeQuestions(sections) };
  } catch (error) {
    console.error(
      `[client-portal] intake questions failed: ${error instanceof Error ? error.message : error}`,
    );
    return { questions: [] };
  }
}

/**
 * POST FormData `{file}` → policy verdict → storage write → outcome.
 *
 * The client id is never taken from the request: it comes from the first
 * row of the caller's own RLS-scoped reports read, so the only client a
 * session can upload for is the one it already reads. An account with no
 * paid report has nothing to upload against and is told so; a policy
 * rejection answers with the exact `explain` message, having written
 * nothing.
 */
export const submitIntakeUpload = createServerFn({ method: "POST" })
  .validator((data: unknown) => {
    if (!(data instanceof FormData)) {
      throw new Error("[client-portal] intake upload expects FormData");
    }
    const file = data.get("file");
    if (!(file instanceof File)) {
      throw new Error("[client-portal] intake upload expects a file field");
    }
    return { file };
  })
  .handler(async ({ data }): Promise<IntakeUploadOutcome> => {
    const { userId, getToken } = await auth();
    if (!userId) {
      throw redirect({ to: "/sign-in/$", params: { _splat: "" } });
    }
    const clerkToken = await getToken();
    if (!clerkToken) {
      throw new Error("[client-portal] portal session carries no token");
    }
    const clerkStore = await import("./supabase-clerk");
    const clerkConfig = clerkStore.clerkSupabaseConfigFromEnv();
    if (!clerkConfig) {
      throw new Error("[client-portal] SUPABASE_URL or SUPABASE_ANON_KEY is not set");
    }
    const reports = await clerkStore.fetchClerkScopedPaidReports(clerkToken, clerkConfig);
    const clientId: string | undefined = reports[0]?.client_id;
    if (!clientId) {
      throw new Error(
        "[client-portal] no paid report is linked to this account, so there is nothing to upload against",
      );
    }
    // Service-role storage write, resolved at call time — the env-naming
    // module stays out of any bundle that walks this file from a route.
    const tokenStore = await import("./supabase-tokens");
    const serviceConfig = tokenStore.supabaseConfigFromEnv();
    if (!serviceConfig) {
      throw new Error("[client-portal] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set");
    }
    return storeIntakeUpload(clientId, data.file, data.file, serviceConfig);
  });

/** Re-exported for the route's `accept` attribute, so the card cannot drift. */
export { ACCEPT_ATTRIBUTE } from "./upload-policy";

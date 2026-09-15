import { auth } from "@clerk/tanstack-react-start/server";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import type { ClerkScopedReport, ClerkSupabaseConfig } from "./supabase-clerk";

/**
 * The signed-in portal's data path (US-009).
 *
 * The funnel ends here: a client who paid holds a Clerk account the
 * webhook provisioned at payment, and this loader reads exactly what RLS
 * grants that account's session token — the route never learns a client
 * id, so it cannot ask for one it should not see.
 *
 * **Exported twice, mirroring `tokens.ts`.** `loadPortalReports` is a
 * plain async function taking the auth state as a parameter, so tests
 * pin the decision table without Clerk; the `createServerFn` wrapper is
 * what the route loader awaits — a bare TanStack loader also runs in the
 * browser on client-side navigation, while `auth()` exists only inside
 * the server boundary. The guard lives in the handler rather than
 * `beforeLoad` for the same reason: `auth()` needs the request the
 * server function carries.
 *
 * Failure is loud by contract. A session without a readable token, a
 * missing configuration, or a denied read all throw — this loader never
 * answers "signed in, and no reports" as a stand-in for "broken". An
 * honest zero (a prospect who has not paid) is `ok` with an empty list,
 * and the page renders its empty state.
 */

export interface PortalAuthState {
  userId: string | null;
  getToken: () => Promise<string | null>;
}

export interface PortalDeps {
  fetchImpl?: typeof fetch;
  supabaseConfig?: ClerkSupabaseConfig | null;
}

export type PortalOutcome = { status: "redirect" } | { status: "ok"; reports: ClerkScopedReport[] };

export async function loadPortalReports(
  authState: PortalAuthState,
  deps: PortalDeps = {},
): Promise<PortalOutcome> {
  if (!authState.userId) return { status: "redirect" };
  const clerkToken = await authState.getToken();
  if (!clerkToken) {
    throw new Error("[client-portal] portal session carries no token");
  }
  // Dynamic import, mirroring the token lookup in `tokens.ts`: the module
  // names its environment variables, and a static import would hand that
  // plumbing to every bundler that walks this file from the route.
  const clerkStore = await import("./supabase-clerk");
  const config =
    deps.supabaseConfig === undefined
      ? clerkStore.clerkSupabaseConfigFromEnv()
      : deps.supabaseConfig;
  if (!config) {
    throw new Error("[client-portal] SUPABASE_URL or SUPABASE_ANON_KEY is not set");
  }
  const reports = await clerkStore.fetchClerkScopedPaidReports(
    clerkToken,
    config,
    deps.fetchImpl ?? fetch,
  );
  return { status: "ok", reports };
}

export const fetchPortalPage = createServerFn({ method: "GET" }).handler(async () => {
  const { userId, getToken } = await auth();
  const outcome = await loadPortalReports({ userId, getToken });
  if (outcome.status === "redirect") {
    throw redirect({ to: "/sign-in/$", params: { _splat: "" } });
  }
  return { reports: outcome.reports };
});

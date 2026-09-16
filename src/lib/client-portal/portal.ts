import { auth } from "@clerk/tanstack-react-start/server";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import type { ClientRecord } from "./tokens";
import type { ClerkScopedReport, ClerkSupabaseConfig } from "./supabase-clerk";
import { loadIntakeQuestions } from "./intake";

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
 *
 * The company identity (todo 9, G3) is the one deliberate exception: the
 * header's avatar and name are decoration on a page the session already
 * earned, so `resolvePortalCompany` degrades — an unknown client id, a
 * nameless store record, or an unreadable store all answer `null` and the
 * header falls back to the `?` mark instead of breaking the reports. The
 * join still only ever runs inside the server function, on client ids the
 * RLS-scoped read itself produced; the store read is the same one
 * `tokens.ts` performs, never an anon request and never in a bundle.
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

/**
 * The avatar initial for the portal header (US-004's rule, null-safe).
 *
 * Same expression `/c/$token` renders — first character, uppercased — so
 * the two surfaces can never disagree on what a name resolves to. Every
 * missing half (null, empty, whitespace) answers the "?" fallback instead
 * of throwing: a nameless record must degrade, never crash the page.
 */
export function companyInitial(name: string | null | undefined): string {
  return (name ?? "").trim().slice(0, 1).toUpperCase() || "?";
}

/**
 * The signed-in client's company name, joined from the content store.
 *
 * The client_id comes only from the RLS-scoped reports above — the caller
 * never supplies one, so the join can only ever name a client the signed-in
 * session already earned visibility into. The first report wins (the read
 * orders newest-unlocked first), an unknown id and a blank store name both
 * answer `null`, and the header falls back to the bare initial.
 */
function companyNameForReports(
  reports: readonly ClerkScopedReport[],
  clients: readonly ClientRecord[],
): { id: string; name: string } | null {
  const clientId = reports[0]?.client_id;
  if (!clientId) return null;
  const match = clients.find((client) => client.id === clientId);
  if (!match) return null;
  const name = match.name.trim();
  return name ? { id: match.id, name } : null;
}

/** The company identity the portal header renders (US-004's mark, US-009's page). */
export interface PortalCompany {
  id: string;
  name: string;
}

export interface PortalCompanyDeps {
  /** The client store read, injectable so tests join without the filesystem. */
  readStore?: () => Promise<ClientRecord[]>;
}

/**
 * The company record behind the granted reports, or `null` when there is
 * nothing to name. Defaults to the client store `tokens.ts` reads — loaded
 * dynamically, same bundling discipline as the clerk-scoped read above —
 * and degrades on every missing half rather than throwing: a nameless
 * record or an unreadable store cost the page its label, never its reports.
 */
export async function resolvePortalCompany(
  reports: readonly ClerkScopedReport[],
  deps: PortalCompanyDeps = {},
): Promise<PortalCompany | null> {
  if (reports.length === 0) return null;
  const readStore =
    deps.readStore ??
    (async () => {
      const tokens = await import("./tokens");
      return tokens.readClientStore();
    });
  try {
    return companyNameForReports(reports, await readStore());
  } catch (error) {
    console.error(
      `[client-portal] company lookup failed: ${error instanceof Error ? error.message : error}`,
    );
    return null;
  }
}

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

export const requireSignedIn = createServerFn({ method: "GET" }).handler(async () => {
  const { userId } = await auth();
  if (!userId) throw redirect({ to: "/sign-in/$", params: { _splat: "" } });
  return null;
});

export const fetchPortalPage = createServerFn({ method: "GET" }).handler(async () => {
  const { userId, getToken } = await auth();
  const outcome = await loadPortalReports({ userId, getToken });
  if (outcome.status === "redirect") {
    throw redirect({ to: "/sign-in/$", params: { _splat: "" } });
  }
  // Additive on the committed outcome shape: the reports read above is
  // untouched (its decision table stays byte-compatible), and the company
  // join degrades on its own so a nameless record can never error the page.
  const company = await resolvePortalCompany(outcome.reports);
  // The intake question set (todo 10, G4), joined the same additive way:
  // derived from RLS-visible final sections, degrading to empty so a
  // sections outage can never error the page the reports already built.
  const intake = await loadIntakeQuestions({ userId, getToken });
  // The service-role blueprint read (the locked preview), gated on Clerk
  // auth server-side — the RLS path cannot see an unpaid client at all.
  // Degrades to null so an outage never errors the page; the render order
  // then falls back to the reports above. Dynamic import inside the
  // handler: the module owns the service-role env names.
  const blueprint = userId
    ? await (await import("./portal-blueprint")).loadPortalBlueprint(userId)
    : null;
  return { reports: outcome.reports, company, intake, blueprint };
});

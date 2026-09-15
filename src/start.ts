import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

/**
 * Whether the Clerk session layer is on. Separate function (rather than an
 * inline check) so tests pin the incident contract: a missing key disables
 * auth, it must never take down pages that need no session.
 */
export function authMiddlewareEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return !!env["CLERK_SECRET_KEY"];
}

// clerkMiddleware must run when keys exist so auth() resolves in server
// functions and beforeLoad guards; without it every auth() call returns
// empty (the documented pitfall). When keys are absent the layer stays out
// entirely: 2026-09-15 production incident — an unconditional clerkMiddleware
// threw `no secret key provided` on EVERY request, 500ing even the public
// magic-link pages. No keys means no sessions (the pre-Clerk behavior),
// never a dead site. Order: error reporting outermost, then Clerk, then
// CSRF for server functions.
const clerkLayer = authMiddlewareEnabled() ? [clerkMiddleware()] : [];
if (clerkLayer.length === 0) {
  console.warn("[auth] CLERK_SECRET_KEY is not set — serving without sessions");
}

export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware, ...clerkLayer, csrfMiddleware],
}));

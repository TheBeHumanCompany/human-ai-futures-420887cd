import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { upgradeDegraded } from "./lib/podcast/degraded-status";
import { decideHostRoute } from "./lib/surface";
import { withSecurityHeaders } from "./lib/security-headers";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      // Host guard: which surface (marketing vs portal) serves this request.
      // Decides before the /about rewrite so a moved path redirects to its
      // new host rather than being rewritten on the wrong one. Method is
      // deliberately ignored — 308 preserves method and body, so a moved
      // POST still lands correctly.
      const guardUrl = new URL(request.url);
      const hostDecision = decideHostRoute({
        host: request.headers.get("host"),
        pathname: guardUrl.pathname,
        search: guardUrl.search,
      });
      if (hostDecision.kind === "redirect") {
        // Through withSecurityHeaders (unlike the /about 301 below): a
        // redirect carrying a token in its path must carry no-referrer and
        // private, no-store, or the credential can leak via a referrer or a
        // shared cache. withSecurityHeaders only fills absent names, so the
        // Location header survives.
        return withSecurityHeaders(
          new Response(null, {
            status: hostDecision.status,
            headers: { location: hostDecision.location },
          }),
          guardUrl.pathname,
        );
      }
      if (hostDecision.kind === "notFound") {
        return withSecurityHeaders(
          new Response("Not found", {
            status: 404,
            headers: { "content-type": "text/plain; charset=utf-8" },
          }),
          guardUrl.pathname,
        );
      }

      // /about permanently redirects to /who-we-are (Krisp 2026-08-22
      // meeting, user-confirmed 2026-08-26). Read verbs only — everything
      // else falls through for the framework to answer. One trailing slash is
      // tolerated; deeper paths ("/about-the-founder") never match.
      if (request.method === "GET" || request.method === "HEAD") {
        const url = new URL(request.url);
        const pathname =
          url.pathname.endsWith("/") && url.pathname !== "/"
            ? url.pathname.slice(0, -1)
            : url.pathname;
        if (pathname === "/about") {
          return Response.redirect(new URL(`/who-we-are${url.search}`, request.url), 301);
        }
      }

      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);

      // Order matters, and the two never fight.
      //
      // `normalizeCatastrophicSsrResponse` fires only on an h3-swallowed throw,
      // which is a JSON body — never an SSR error page — and it constructs a
      // FRESH 500 carrying no degraded marker. So running the upgrade after it
      // means a swallowed throw correctly stays a 500: that is a catastrophic
      // failure in our own code, not a dependency outage, and it must not be
      // reported as "come back in five minutes".
      return withSecurityHeaders(
        upgradeDegraded(await normalizeCatastrophicSsrResponse(response)),
        new URL(request.url).pathname,
      );
    } catch (error) {
      console.error(error);
      return withSecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
        new URL(request.url).pathname,
      );
    }
  },
};

import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { upgradeDegraded } from "./lib/podcast/degraded-status";

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
      return upgradeDegraded(await normalizeCatastrophicSsrResponse(response));
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};

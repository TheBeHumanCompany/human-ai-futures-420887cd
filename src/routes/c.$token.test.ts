import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { sitemapSurfaces, visitableSurfaces } from "@/lib/surfaces";
import { ClientAvatar, Route } from "./c.$token";

/**
 * The US-001 client route, asserted at its own option functions and source.
 *
 * The loader itself calls the token server function, which needs a running
 * server, so its end-to-end behaviour (valid token renders, unknown token
 * 404s) is proven by the live dev-server curl recorded in
 * `docs/client-portal-tokens.md`. What is pinned here, offline:
 *
 * - `head()` answers a title for a resolved page and for the denied page.
 * - the route declares the loader plus a dedicated denied component.
 * - the route resolves tokens only through the server function and never
 *   touches the store file itself, so no token can enter the client bundle.
 * - the client path carries no gate between opening the link and reading
 *   the page: no form, no password field, no credentials step.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
const callHead = (loaderData?: unknown) =>
  (Route.options.head as any)({ loaderData }) as {
    meta?: Array<Record<string, string>>;
  };
/* eslint-enable @typescript-eslint/no-explicit-any */

const ROUTE_SOURCE = readFileSync(new URL("./c.$token.tsx", import.meta.url).pathname, "utf8");

describe("the route declares the pieces US-001 depends on", () => {
  test("it has a loader, a component, and its own denied component", () => {
    // Without the denied component the boundary falls to the root 404, which
    // is acceptable nowhere: the denial must carry no client content and no
    // identifying mark, and only a dedicated component can promise that.
    expect(Route.options.loader).toBeDefined();
    expect(Route.options.component).toBeDefined();
    expect(Route.options.notFoundComponent).toBeDefined();
  });

  test("an unknown token is answered with notFound, never with an empty 200", () => {
    // Proven by source rather than by behaviour, because the loader needs a
    // running server: a loader that returned `{ page: null }` would render a
    // success status on a page that resolved to nobody.
    expect(ROUTE_SOURCE).toContain("throw notFound()");
  });
});

describe("head() — a title for the page and for the denial", () => {
  test("a resolved page titles from the client's own title", () => {
    const result = callHead({ page: { title: "Acme Industrial — Preliminary Blueprint" } });

    expect(result.meta?.[0].title).toBe("Acme Industrial — Preliminary Blueprint");
  });

  test("an unresolved token still titles, rather than rendering untitled", () => {
    const result = callHead(undefined);

    expect(result.meta?.[0].title).toContain("not valid");
  });
});

describe("tokens stay on the server", () => {
  test("the route resolves tokens only through the server function", () => {
    expect(ROUTE_SOURCE).toContain("fetchClientPageByToken");
  });

  test("the route never touches the store file itself", () => {
    // The store holds every client's token. A direct import here would ship
    // the whole file in the client bundle on navigation, when the loader also
    // runs in the browser. Only the server function may read it.
    expect(ROUTE_SOURCE).not.toContain("clients.json");
  });
});

/**
 * US-002 — private by default.
 *
 * No state of `/c/$token` is public, so the exclusion is unconditional: the
 * resolved page and the denied page both carry `noindex`, the response
 * carries `X-Robots-Tag: noindex`, and token URLs appear in neither the
 * sitemap nor the gate-visitable surfaces. Pinned in both directions where
 * that is meaningful: a branch that dropped its directive turns exactly one
 * row red.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
const callHeaders = () => (Route.options.headers as any)() as Record<string, string>;
/* eslint-enable @typescript-eslint/no-explicit-any */

const metaOf = (result: { meta?: Array<Record<string, string>> }) => result.meta ?? [];

describe("head() — noindex on the page and on the denial", () => {
  test("a resolved page titles from the client AND carries noindex", () => {
    const result = callHead({ page: { title: "Acme Industrial — Preliminary Blueprint" } });

    expect(metaOf(result).find((tag) => tag.name === "robots")?.content).toBe("noindex");
  });

  test("the denied page carries noindex too — it is not content either", () => {
    const result = callHead(undefined);

    expect(metaOf(result).find((tag) => tag.name === "robots")?.content).toBe("noindex");
  });
});

describe("headers() — X-Robots-Tag, head-independent", () => {
  test("emits X-Robots-Tag: noindex with no match argument needed", () => {
    // Unconditional: unlike the podcast route's degraded-only markers, no
    // state of this route is public, so there is no branch to discriminate.
    expect(callHeaders()["X-Robots-Tag"]).toBe("noindex");
  });
});

describe("token URLs stay out of the public surfaces", () => {
  test("the sitemap advertises no /c/ path", () => {
    expect(sitemapSurfaces().some((s) => s.path.startsWith("/c/"))).toBe(false);
  });

  test("no gate ever visits a token URL", () => {
    // `visitableSurfaces()` resolves dynamic slugs; the /c/$token entry
    // carries no sampleSlug precisely so this stays empty of client paths.
    expect(visitableSurfaces().some((s) => s.path.startsWith("/c/"))).toBe(false);
  });
});

describe("robots.txt leaves /c/ crawlable so the noindex is seen", () => {
  // A `Disallow: /c/` would stop crawlers from ever fetching a client page,
  // which is the opposite of the intent: an unfetched page's `noindex` is
  // never read. The exclusion works by directive, not by hiding the path.
  const robots = readFileSync(
    path.join(import.meta.dir, "..", "..", "public", "robots.txt"),
    "utf8",
  );
  const disallows = robots
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^disallow\s*:/i.test(line))
    .map((line) => line.slice(line.indexOf(":") + 1).trim());

  test("no Disallow rule covers a client URL", () => {
    // Floor first: with no Disallow lines the loop below asserts nothing,
    // so prove the file was really read before trusting its silence.
    expect(robots).toContain("User-agent:");
    // Robots matching is prefix matching, so probe with a full client path:
    // an empty value allows everything and any other prefix of it disallows.
    for (const rule of disallows) expect("/c/probe-token".startsWith(rule)).toBe(false);
  });
});

describe("V1 ships none of the excluded portal features", () => {
  test("no search UI or route entry point in the client route", () => {
    expect(ROUTE_SOURCE).not.toMatch(/search/i);
  });

  test("no roles, billing, or notifications handling in the client route", () => {
    expect(ROUTE_SOURCE).not.toMatch(/\bbilling\b/i);
    expect(ROUTE_SOURCE).not.toMatch(/\bnotify\b|\bnotification\b/i);
    expect(ROUTE_SOURCE).not.toMatch(/\brole\b/i);
  });
});

/**
 * US-004 — the opened page carries a shadcn avatar; the denial names nobody.
 *
 * The import is pinned on the route file itself (not the report shell): the
 * criterion names the US-001 route component file, and only the resolved
 * page branch may render it — the denial answers anyone holding a mistyped
 * link, so a client-identifying mark there would hand a stranger a name.
 * Served-HTML presence (avatar markup in a fixture client's response) is
 * proven by the live dev-server curl recorded in
 * `docs/client-portal-tokens.md`; what is pinned here, offline, is the
 * wiring that curl depends on plus the denial's silence.
 */

const deniedSource = () => ROUTE_SOURCE.slice(ROUTE_SOURCE.indexOf("function ClientLinkDenied"));

describe("the resolved page marks itself with the shadcn avatar", () => {
  test("the route file imports the avatar primitive from the ui layer", () => {
    expect(ROUTE_SOURCE).toContain("@/components/ui/avatar");
    expect(ROUTE_SOURCE).toContain("AvatarFallback");
  });

  test("the page branch renders the avatar from the resolved client's name", () => {
    // The whole-file import above cannot say which branch renders; this
    // pins the avatar beside the loader-resolved name on the page branch.
    expect(ROUTE_SOURCE).toContain("<ClientAvatar");
    expect(ROUTE_SOURCE).toContain("page.name");
  });

  test("the avatar renders the client's initial in brand fill", () => {
    const html = renderToStaticMarkup(createElement(ClientAvatar, { name: "Acme Industrial" }));

    expect(html).toContain(">A<");
    expect(html).toContain("bg-ink");
  });

  test("a blank name still renders a mark rather than an empty circle", () => {
    const html = renderToStaticMarkup(createElement(ClientAvatar, { name: "  " }));

    expect(html).toContain(">?<");
  });
});

describe("the denial carries no avatar identifying the client", () => {
  test("the denied branch renders no avatar element", () => {
    expect(deniedSource()).not.toContain("Avatar");
  });

  test("the denied branch names no client", () => {
    expect(deniedSource()).not.toContain("page.name");
    expect(deniedSource()).not.toContain("loaderData");
  });
});

describe("no gate between opening the link and reading the page", () => {
  test("no form element", () => {
    expect(ROUTE_SOURCE).not.toMatch(/<form/i);
  });

  test("no password field or credentials step", () => {
    expect(ROUTE_SOURCE).not.toMatch(/password/i);
    expect(ROUTE_SOURCE).not.toMatch(/credential/i);
  });

  test("no login step", () => {
    expect(ROUTE_SOURCE).not.toMatch(/login/i);
    expect(ROUTE_SOURCE).not.toMatch(/log\s*in/i);
  });
});

/**
 * US-003 — one link per client, every report stacked on the one page.
 *
 * The route composes the report shell; the shell itself lives in
 * `src/components/client-portal/client-reports.tsx`. Behaviour (every
 * report under one token, in store order, with no navigation chrome) is
 * pinned in `client-reports.test.ts` (static render), `tokens.test.ts`
 * (store read), and `e2e/client-portal.spec.ts` (stacked page in a
 * browser).
 */

const REPORTS_SOURCE = readFileSync(
  new URL("../components/client-portal/client-reports.tsx", import.meta.url).pathname,
  "utf8",
);

describe("the route serves every report through the one client URL", () => {
  test("the page renders the report shell over the resolved page", () => {
    expect(ROUTE_SOURCE).toContain("ClientReports");
    expect(ROUTE_SOURCE).toContain("client-portal/client-reports");
  });

  test("the loader still resolves exactly one client's page — the shell takes data, not a token", () => {
    // The shell receiving the token would be a second lookup path beside
    // the loader's server function; it receives the resolved page, so the
    // token never travels further than the loader. Word-boundary: the
    // `@/lib/client-portal/tokens` module path is expected and allowed.
    expect(REPORTS_SOURCE).not.toMatch(/\btoken\b/);
    expect(ROUTE_SOURCE).toContain("fetchClientPageByToken");
  });
});

describe("the shell stacks the reports with no navigation chrome", () => {
  test("no sidebar, disclosure, or tabs primitives are imported", () => {
    expect(REPORTS_SOURCE).not.toContain("@/components/ui/sidebar");
    expect(REPORTS_SOURCE).not.toContain("@/components/ui/collapsible");
    expect(REPORTS_SOURCE).not.toContain("@/components/ui/tabs");
  });

  test("no sidebar shell, toggle, disclosure, or tab wiring remains", () => {
    expect(REPORTS_SOURCE).not.toContain("SidebarProvider");
    expect(REPORTS_SOURCE).not.toContain("SidebarTrigger");
    expect(REPORTS_SOURCE).not.toContain("Collapsible");
    expect(REPORTS_SOURCE).not.toContain("TabsTrigger");
    expect(REPORTS_SOURCE).not.toContain("TabsContent");
    expect(REPORTS_SOURCE).not.toContain("onValueChange");
  });

  test("every report renders from the resolved page in store order", () => {
    expect(REPORTS_SOURCE).toContain("page.reports.map");
    expect(REPORTS_SOURCE).toContain("dangerouslySetInnerHTML");
  });
});

/**
 * The embedded checkout (funnel todo 7): the page mounts the purchase band
 * in the locked-final area, and hands it the token it already resolved.
 * Behaviour of the panel itself (init POST, Stripe boundary, decline path)
 * is pinned in
 * `src/components/client-portal/checkout/checkout-panel.test.tsx`; what is
 * pinned here is the wiring the band depends on.
 */
describe("the locked-final paywall hands off to the embedded checkout", () => {
  test("the page renders the purchase band only when final sections are locked", () => {
    expect(ROUTE_SOURCE).toContain("checkout/checkout-panel");
    expect(ROUTE_SOURCE).toContain("<CheckoutBand");
    expect(ROUTE_SOURCE).toContain("section.locked");
  });

  test("the band's token comes from the route param, never from storage", () => {
    expect(ROUTE_SOURCE).toContain("Route.useParams()");
    expect(ROUTE_SOURCE).toMatch(/identity=\{\{ kind: "token", token \}\}/);
    expect(ROUTE_SOURCE).not.toMatch(/localStorage|sessionStorage/);
  });

  test("the denial branch renders no checkout", () => {
    expect(deniedSource()).not.toContain("CheckoutBand");
    expect(deniedSource()).not.toContain("checkout-panel");
  });

  test("the denial branch renders no intake card either", () => {
    expect(deniedSource()).not.toContain("IntakeCard");
    expect(deniedSource()).not.toContain("intake-card");
  });
});

/**
 * The paid state's successor to the purchase band: the document request
 * generated from the blueprint's own final sections, mounted with the
 * token identity the page already carries. Upload mechanics for both
 * identities are pinned in `src/lib/client-portal/intake.test.ts`; what is
 * pinned here is the wiring the card depends on.
 */
describe("the paid page renders the derived document request", () => {
  test("the card mounts from the route's own sections and token", () => {
    expect(ROUTE_SOURCE).toContain("<IntakeCard");
    expect(ROUTE_SOURCE).toContain("deriveIntakeQuestions");
    expect(ROUTE_SOURCE).toContain("hasLockedFinals ? [] : deriveIntakeQuestions");
    expect(ROUTE_SOURCE).toContain("token={token}");
  });

  test("the question set is forced empty while finals are locked", () => {
    expect(ROUTE_SOURCE).toContain("page.sections ?? []");
  });
});

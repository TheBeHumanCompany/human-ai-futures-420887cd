import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { SITE_ORIGIN } from "@/lib/sanity/config";
import { sitemapSurfaces } from "@/lib/surfaces";
import { Route } from "./sitemap[.]xml";

/**
 * The sitemap, asserted through the real handler rather than around it.
 *
 * The reachable row asserts EXACT set equality on `<loc>` — not a count, not a
 * superset. A count passes while an episode is missing and a bogus entry has
 * taken its place; a superset passes while the sitemap lists URLs that do not
 * exist. Only equality says the sitemap describes the site.
 *
 * The unreachable row is the one that matters most. A truncated 200 sitemap is
 * a removal signal: it tells a crawler that the thirty-nine episode URLs it
 * already knows are gone, because a third party was briefly down.
 */

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Sanity's success envelope. */
const ok = (result: unknown) =>
  new Response(JSON.stringify({ result }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });

function stubFetch(respond: () => Response) {
  globalThis.fetch = (() => Promise.resolve(respond())) as typeof fetch;
}

const EPISODES = [
  { slug: { current: "jenn-harper-cheekbone-beauty" }, updatedAt: "2025-02-01T00:00:00.000Z" },
  { slug: { current: "joao-ribeiro-elements-brazil" }, updatedAt: "2025-03-01T00:00:00.000Z" },
];

/**
 * Read from `SURFACES`, not retyped.
 *
 * This file used to keep its own copy of the static page list and assert it by
 * exact equality, with a comment hardcoding "the site still has seven pages".
 * That copy is the bug, not the assertion: it makes every route addition a
 * two-place edit, and if only one place is edited the failure is silent in the
 * direction that matters — a test updated without the handler passes while the
 * sitemap has stopped listing pages that exist.
 *
 * Sharing the source keeps the equality assertion (which is worth keeping — a
 * count passes while an episode is missing and a bogus entry replaces it) while
 * removing the thing that made it brittle. The floor below is what stops this
 * from becoming circular: if `SURFACES` ever collapsed to nothing, both sides
 * of the equality would agree on an empty sitemap.
 */
const STATIC_PATHS = sitemapSurfaces().map((s) => s.path);

/* eslint-disable @typescript-eslint/no-explicit-any */
const GET = () => (Route.options as any).server.handlers.GET() as Promise<Response>;
/* eslint-enable @typescript-eslint/no-explicit-any */

const locsOf = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

describe("the shared page list", () => {
  test("is populated, so the equality assertions below are not circular", () => {
    // Both sides of every `toEqual` here now read `SURFACES`. If that list ever
    // collapsed — a bad filter, a renamed field — the handler and the test
    // would agree on an empty sitemap and every case would pass. This is the
    // floor that makes them mean something.
    expect(STATIC_PATHS.length).toBeGreaterThanOrEqual(9);
    expect(STATIC_PATHS).toContain("/");
    expect(STATIC_PATHS).toContain("/be-human-ai");
    expect(STATIC_PATHS).toContain("/who-we-are");
    expect(STATIC_PATHS).toContain("/why-we-exist");
  });

  test("excludes surfaces that render but are not content", () => {
    // The type specimen is a real page with real chrome, deliberately not
    // advertised. Deriving the sitemap from "every surface" instead of "every
    // surface with crawl hints" would quietly publish it.
    expect(STATIC_PATHS).not.toContain("/type-specimen");
    expect(STATIC_PATHS).not.toContain("/sitemap.xml");
    expect(STATIC_PATHS.some((p) => p.includes("$slug"))).toBe(false);
  });
});

describe("reachable Sanity", () => {
  test("the <loc> set equals the static pages plus every episode, exactly", () => {
    stubFetch(() => ok(EPISODES));

    return GET()
      .then((response) => response.text())
      .then((xml) => {
        const expected = [
          ...STATIC_PATHS.map((p) => `${SITE_ORIGIN}${p}`),
          `${SITE_ORIGIN}/podcast/jenn-harper-cheekbone-beauty`,
          `${SITE_ORIGIN}/podcast/joao-ribeiro-elements-brazil`,
        ];

        expect(locsOf(xml).sort()).toEqual(expected.sort());
      });
  });

  test("responds 200 as XML", async () => {
    stubFetch(() => ok(EPISODES));
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("xml");
  });

  test("every <loc> is absolute against the canonical origin", async () => {
    stubFetch(() => ok(EPISODES));
    const locs = locsOf(await (await GET()).text());

    // Floor first: an empty sitemap satisfies "every entry is absolute".
    expect(locs.length).toBeGreaterThanOrEqual(STATIC_PATHS.length + EPISODES.length);
    for (const loc of locs) expect(loc.startsWith(`${SITE_ORIGIN}/`)).toBe(true);
  });

  test("episode entries carry <lastmod> from the document's own timestamp", async () => {
    stubFetch(() => ok(EPISODES));
    const xml = await (await GET()).text();

    expect(xml).toContain("<lastmod>2025-02-01T00:00:00.000Z</lastmod>");
    expect(xml).toContain("<lastmod>2025-03-01T00:00:00.000Z</lastmod>");
  });

  test("an empty catalogue still emits the static pages", async () => {
    // A genuinely empty catalogue is a real state, distinct from an outage, and
    // the site still has all of its static pages.
    stubFetch(() => ok([]));
    const locs = locsOf(await (await GET()).text());

    expect(locs.sort()).toEqual(STATIC_PATHS.map((p) => `${SITE_ORIGIN}${p}`).sort());
  });
});

describe("unreachable Sanity", () => {
  test("returns a real 503 rather than a truncated 200", async () => {
    stubFetch(() => new Response("upstream is down", { status: 500 }));
    const response = await GET();

    expect(response.status).toBe(503);
  });

  test("carries Retry-After, and no body to be mistaken for a sitemap", async () => {
    stubFetch(() => new Response("upstream is down", { status: 500 }));
    const response = await GET();

    expect(response.headers.get("Retry-After")).toBe("300");
    expect(await response.text()).toBe("");
  });

  test("is not cached — a cached outage outlives the outage", async () => {
    stubFetch(() => new Response("upstream is down", { status: 500 }));
    expect((await GET()).headers.get("Cache-Control")).toBe("no-store");
  });

  test("emits NO <loc> at all, so nothing can read as a removal signal", async () => {
    stubFetch(() => new Response("upstream is down", { status: 500 }));
    expect(locsOf(await (await GET()).text())).toEqual([]);
  });
});

describe("robots.txt", () => {
  const robots = readFileSync(
    path.join(import.meta.dir, "..", "..", "public", "robots.txt"),
    "utf8",
  );

  test("declares the sitemap, absolutely", () => {
    expect(robots).toContain(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`);
  });

  test("the directive sits AFTER the final User-agent group", () => {
    // `Sitemap:` is a non-group directive. Inside a group, strict readers treat
    // it as scoped to that agent — or ignore it.
    const sitemapAt = robots.indexOf("Sitemap:");
    const lastAgentAt = robots.lastIndexOf("User-agent:");

    expect(sitemapAt).toBeGreaterThan(lastAgentAt);
  });
});

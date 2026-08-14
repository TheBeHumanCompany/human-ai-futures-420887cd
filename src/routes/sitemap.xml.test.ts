import { afterEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { SITE_ORIGIN } from "@/lib/sanity/config";
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
 * Mirrors the static `entries` array in `sitemap[.]xml.ts`.
 *
 * The suite asserts exact set equality on `<loc>`, so this list is a deliberate
 * duplicate and adding a route without updating it turns two tests red. That is
 * the point: a page missing from the sitemap is invisible to search, and a
 * silent omission is exactly the kind of thing nobody notices for months.
 *
 * The four `/be-human-ai/*` entries were added with the sales pages.
 *
 * `/why-we-exist` was ADDED rather than swapped in for `/about`. Both pages are
 * live and canonical: the mission page states the positioning, and `/about`
 * carries team, story and press. This list therefore grew by one — an earlier
 * draft of that change removed `/about` on the reasoning that a redirecting URL
 * should not be listed, which does not hold when the page is not redirecting.
 */
const STATIC_PATHS = [
  "/",
  "/be-human-ai",
  "/be-human-ai/blueprint",
  "/be-human-ai/human-readiness",
  "/be-human-ai/governance",
  "/be-human-ai/ai-strategy",
  "/why-we-exist",
  "/about",
  "/the-new-human-era",
  "/the-human-archive",
  "/podcast",
  "/contact",
];

/* eslint-disable @typescript-eslint/no-explicit-any */
const GET = () => (Route.options as any).server.handlers.GET() as Promise<Response>;
/* eslint-enable @typescript-eslint/no-explicit-any */

const locsOf = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

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
    // the site still has seven pages.
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

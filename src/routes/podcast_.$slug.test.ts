import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

import { DEGRADED_SOURCE_HEADER } from "@/lib/podcast/degraded-status";
import type { SanityEpisode } from "@/lib/podcast/episode";
import { Route } from "./podcast_.$slug";

/**
 * Decision L's three states, asserted at the route's own option functions.
 *
 * `head()` and `headers()` are called by the router with a `match` whose
 * `status` distinguishes `"notFound"` from `"error"`. Both statuses arrive with
 * `loaderData: undefined`, which is exactly why the naive `!loaderData` guard
 * collapses them — so every row below pins the branch in BOTH directions. A
 * one-directional assertion would let the two silently swap.
 */

const EPISODE: SanityEpisode = {
  _id: "episode-abc",
  guid: "guid-abc",
  slug: { current: "jenn-harper-cheekbone-beauty" },
  episodeNumber: 5,
  title: "Building Cheekbone Beauty",
  description: "Long show notes.",
  excerpt: "An Indigenous-owned cosmetics company built on giving back.",
  topics: null,
  guestName: "Jenn Harper",
  guestBio: null,
  guestPhoto: null,
  coverArtwork: null,
  podbeanUrl: "https://shanejjamesgroup.podbean.com/e/cheekbone/",
  audioUrl: "https://mcdn.podbean.com/a.mp3",
  durationSeconds: 3000,
  publishedAt: "2025-02-01T00:00:00.000Z",
  searchText: "building cheekbone beauty jenn harper",
  slugFrozenAt: "2025-02-01T00:00:00.000Z",
};

/* eslint-disable @typescript-eslint/no-explicit-any */
const callHead = (match: { status: string }, loaderData?: unknown) =>
  (Route.options.head as any)({ match, loaderData }) as {
    meta?: Array<Record<string, string>>;
    links?: Array<Record<string, string>>;
    scripts?: Array<Record<string, string>>;
  };

const callHeaders = (match: { status: string }) =>
  (Route.options.headers as any)({ match }) as Record<string, string>;
/* eslint-enable @typescript-eslint/no-explicit-any */

const metaOf = (result: ReturnType<typeof callHead>) => result.meta ?? [];
const hasRobots = (result: ReturnType<typeof callHead>) =>
  metaOf(result).some((tag) => tag.name === "robots");

describe("the route declares the pieces Decision L depends on", () => {
  test("it has its own errorComponent — the library's bare panel is not acceptable", () => {
    // Without this the boundary falls to the router's built-in ErrorComponent,
    // NOT the branded component in __root.tsx, which only fires for a root
    // match. This is the assertion that keeps that mistake from shipping.
    expect(Route.options.errorComponent).toBeDefined();
  });

  test("it has a notFoundComponent and a headers option", () => {
    expect(Route.options.notFoundComponent).toBeDefined();
    expect(Route.options.headers).toBeDefined();
  });
});

describe("headers() — the degraded markers", () => {
  test("an errored match emits Retry-After and the degraded source marker", () => {
    const headers = callHeaders({ status: "error" });
    expect(headers["retry-after"]).toBe("300");
    expect(headers[DEGRADED_SOURCE_HEADER]).toBe("degraded");
  });

  test("a notFound match emits NO degraded marker — the trap row", () => {
    // If it did, the status upgrade would promote a genuine 404 into a 503:
    // the missing-versus-unreachable conflation reappearing one layer down.
    const headers = callHeaders({ status: "notFound" });
    expect(headers[DEGRADED_SOURCE_HEADER]).toBeUndefined();
    expect(headers["retry-after"]).toBeUndefined();
  });

  test("a successful match emits no markers either", () => {
    expect(callHeaders({ status: "success" })).toEqual({});
  });
});

describe("head() — three branches, pinned in both directions", () => {
  test("degraded: a title, and NO robots, canonical or Open Graph", () => {
    const result = callHead({ status: "error" });

    expect(metaOf(result)[0].title).toContain("temporarily unavailable");
    // The negative half of the pair. `noindex` here would be a deindex
    // instruction issued because a third party had a bad afternoon.
    expect(hasRobots(result)).toBe(false);
    expect(result.links ?? []).toEqual([]);
    expect(metaOf(result).some((tag) => tag.property?.startsWith("og:"))).toBe(false);
    expect(result.scripts ?? []).toEqual([]);
  });

  test("not found: DOES emit noindex — the positive companion row", () => {
    // Together with the row above this pins the branch in both directions, so
    // neither side can silently invert.
    const result = callHead({ status: "notFound" });

    expect(hasRobots(result)).toBe(true);
    expect(metaOf(result).find((tag) => tag.name === "robots")?.content).toBe("noindex");
    expect(metaOf(result)[0].title).toBe("Episode not found");
  });

  test("found: full meta, canonical and JSON-LD, and no robots directive", () => {
    const result = callHead({ status: "success" }, { episode: EPISODE, related: [] });

    expect(metaOf(result).some((tag) => tag.property === "og:title")).toBe(true);
    expect(result.links?.[0]).toEqual({
      rel: "canonical",
      href: "https://thebehumancompany.ca/podcast/jenn-harper-cheekbone-beauty",
    });
    expect(hasRobots(result)).toBe(false);

    const jsonLd = JSON.parse(result.scripts?.[0].children ?? "{}");
    expect(jsonLd["@type"]).toBe("PodcastEpisode");
  });

  test("the three branches are genuinely distinct", () => {
    // Floor: if two branches ever returned the same thing, the rows above could
    // all pass while the discriminator did nothing.
    const degraded = JSON.stringify(callHead({ status: "error" }));
    const missing = JSON.stringify(callHead({ status: "notFound" }));
    const found = JSON.stringify(
      callHead({ status: "success" }, { episode: EPISODE, related: [] }),
    );

    expect(new Set([degraded, missing, found]).size).toBe(3);
  });
});

describe("the Podbean CTA points at the page, not the audio file", () => {
  const source = readFileSync(new URL("./podcast_.$slug.tsx", import.meta.url).pathname, "utf8");

  test("the CTA anchor uses podbeanUrl", () => {
    // `podbeanUrl` and `audioUrl` are both URL-typed strings on the same
    // document, which is what makes swapping them invisible: the page renders,
    // every test passes, and the CTA silently downloads an mp3 instead of
    // opening the episode. The projection map pins them apart at the query
    // layer; this pins them apart at the only place they are both in scope.
    expect(source).toMatch(/href=\{episode\.podbeanUrl\}/);
  });

  test("no anchor href uses audioUrl", () => {
    expect(source).not.toMatch(/href=\{episode\.audioUrl\}/);
  });

  test("audioUrl is used, but for the player", () => {
    // Floor: proves the previous row is about a real distinction rather than
    // about a field nothing references.
    expect(source).toMatch(/src=\{episode\.audioUrl\}/);
  });

  test("the CTA opens in a new tab safely", () => {
    expect(source).toContain('target="_blank"');
    expect(source).toContain('rel="noopener noreferrer"');
    expect(source).toContain("Listen or Watch Full Episode");
  });
});

describe("a notFound is never reclassified as degraded, at any layer", () => {
  test("not by head(), not by headers()", () => {
    // The single most important invariant on this route, asserted as one
    // statement rather than inferred from the rows above.
    const match = { status: "notFound" };

    expect(callHeaders(match)[DEGRADED_SOURCE_HEADER]).toBeUndefined();
    expect(metaOf(callHead(match))[0].title).not.toContain("temporarily unavailable");
  });

  test("and there is no catch in the loader that could do it either", async () => {
    // The loader has no try/catch at all, which is what makes the classification
    // unnecessary rather than merely correct. Proven by source rather than by
    // behaviour, because a catch that re-throws correctly is indistinguishable
    // from no catch until the day someone edits it.
    const source = await Bun.file(new URL("./podcast_.$slug.tsx", import.meta.url).pathname).text();

    const loaderStart = source.indexOf("loader: async");
    const loaderEnd = source.indexOf("headers:", loaderStart);
    expect(loaderStart).toBeGreaterThan(-1);
    expect(loaderEnd).toBeGreaterThan(loaderStart);

    expect(source.slice(loaderStart, loaderEnd)).not.toContain("catch");
  });
});

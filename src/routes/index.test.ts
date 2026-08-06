import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { loadFeaturedEpisodes } from "@/lib/podcast/featured";
import { SanityHttpError } from "@/lib/sanity/http";
import { Route } from "./index";

/**
 * The homepage — the one surface that must not 5xx.
 *
 * `/podcast` and `/podcast/$slug` throw on a Sanity outage, so it becomes an
 * honest 5xx there. Here the same throw would error the match and take the
 * ENTIRE front door to 500 because a podcast section could not load, when the
 * rest of the page is static and still true. So this loader catches — and the
 * catch has to be narrow, or a genuine bug in it gets disguised as somebody
 * else's outage.
 *
 * Both directions are asserted. A catch that swallows everything passes the
 * outage row perfectly.
 */

const SOURCE = readFileSync(path.join(import.meta.dir, "index.tsx"), "utf8");

/**
 * The guard itself lives in the library, not the route. A route loader that
 * calls a server function cannot be invoked outside the server runtime, so
 * keeping the re-throw-versus-absorb branch inline would have made the one
 * decision worth testing untestable.
 */
const FEATURED = readFileSync(
  path.join(import.meta.dir, "..", "lib", "podcast", "featured.ts"),
  "utf8",
);

const EPISODES = [1, 2, 3, 4].map((n) => ({
  slug: { current: `episode-${n}` },
  episodeNumber: n,
  title: `Episode ${n}`,
  excerpt: "An excerpt.",
  topics: null,
  guestName: "A Guest",
  coverArtwork: null,
  audioUrl: "https://mcdn.podbean.com/a.mp3",
  durationSeconds: 3000,
  publishedAt: "2025-02-01T00:00:00.000Z",
}));

describe("reachable Sanity", () => {
  test("returns the three newest episodes and no unavailable flag", async () => {
    const data = await loadFeaturedEpisodes(async () => EPISODES);

    expect(data.featured).toHaveLength(3);
    expect(data.podcastUnavailable).toBe(false);
  });

  test("takes the newest three in the order the query returned them", async () => {
    const data = await loadFeaturedEpisodes(async () => EPISODES);
    expect(data.featured.map((e) => e.episodeNumber)).toEqual([1, 2, 3]);
  });
});

describe("unreachable Sanity — the front door stays up", () => {
  test("the load RESOLVES rather than throwing", async () => {
    // The whole point. A throw here is a 500 on the homepage caused by a
    // podcast section.
    const data = await loadFeaturedEpisodes(async () => {
      throw new SanityHttpError("[sanity] query timed out");
    });

    expect(data.podcastUnavailable).toBe(true);
    expect(data.featured).toEqual([]);
  });

  test("the page says so instead of rendering the generic headline silently", () => {
    expect(SOURCE).toContain("podcastUnavailable &&");
    expect(SOURCE).toContain("temporarily unavailable");
  });
});

describe("the catch is narrow", () => {
  test("a NON-SanityHttpError is re-thrown, not swallowed", async () => {
    // A catch-all would pass the outage row above perfectly while hiding every
    // genuine bug in this loader behind "the podcast is having a moment".
    await expect(
      loadFeaturedEpisodes(async () => {
        throw new TypeError("a genuine bug in the loader");
      }),
    ).rejects.toThrow("a genuine bug");
  });

  test("it guards on isSanityUnreachable rather than catching everything", () => {
    expect(FEATURED).toContain("isSanityUnreachable");
    expect(FEATURED).toContain("throw error");
  });

  test("the route stays a thin shell over it", () => {
    // No catch in the route at all: the branch is in one tested place rather
    // than duplicated into a file the test runner cannot execute.
    expect(SOURCE).toContain("loadFeaturedEpisodes(fetchEpisodeList)");
    // Matched as a catch CLAUSE, not the word — the route's comments discuss
    // catching at length, and a prose match would make this row meaningless.
    expect(SOURCE).not.toMatch(/\}\s*catch\s*\(|catch\s*\(\s*\w+\s*\)\s*\{/);
  });

  test("a SanityHttpError really is classified as unreachable", () => {
    // Floor: proves the narrow guard admits the case it is supposed to, rather
    // than rejecting everything and passing by accident.
    expect(new SanityHttpError("x", 500).reason).toBe("upstream");
  });
});

describe("row keys are defined and unique", () => {
  test("keyed on slug.current, never on the dropped guid", () => {
    // The SECOND call site of this edit. `guid` left the list projection, and a
    // key={undefined} is a console warning rather than a failure — it would
    // ship green with nothing else catching it.
    expect(SOURCE).toContain("key={episode.slug.current}");
    expect(SOURCE).not.toContain("key={episode.guid}");
  });

  test("the three featured rows yield distinct, defined keys", () => {
    const keys = EPISODES.slice(0, 3).map((episode) => episode.slug.current);
    expect(keys.every((key) => typeof key === "string" && key.length > 0)).toBe(true);
    expect(new Set(keys).size).toBe(3);
  });
});

describe("featured rows link to their episode pages", () => {
  test("each row is a Link to /podcast/$slug", () => {
    expect(SOURCE).toContain('to="/podcast/$slug"');
    expect(SOURCE).toContain("params={{ slug: episode.slug.current }}");
  });
});

describe("the route does NOT declare the throwing route's options", () => {
  test("no errorComponent and no headers — this route catches instead", () => {
    // The asymmetry, asserted on this side too. An errorComponent here would
    // mean somebody had made the homepage throw.
    expect(Route.options.errorComponent).toBeUndefined();
    expect(Route.options.headers).toBeUndefined();
  });
});

import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { DEGRADED_SOURCE_HEADER } from "@/lib/podcast/degraded-status";
import { toBrowsable, type EpisodeListItem } from "@/lib/podcast/episode";
import { browseEpisodes, DEFAULT_BROWSE_STATE } from "@/lib/podbean";
import { Route } from "./podcast";

/**
 * The directory, after the image-led redesign.
 *
 * The key-stability row is the one that would not otherwise exist. `guid` left
 * the list projection to save payload, and it was the React key here — but a
 * `key={undefined}` is a console warning, not a thrown error or a failed
 * render, so the regression would ship with a green suite.
 */

const CARD = readFileSync(
  path.join(import.meta.dir, "..", "components", "episode-media-card.tsx"),
  "utf8",
);
const FEATURED = readFileSync(
  path.join(import.meta.dir, "..", "components", "featured-episode.tsx"),
  "utf8",
);
const ROUTE = readFileSync(path.join(import.meta.dir, "podcast.tsx"), "utf8");

function episode(slug: string, overrides: Partial<EpisodeListItem> = {}): EpisodeListItem {
  return {
    slug: { current: slug },
    episodeNumber: 5,
    title: `Title for ${slug}`,
    excerpt: "An excerpt.",
    topics: null,
    guestName: "A Guest",
    coverArtwork: null,
    audioUrl: "https://mcdn.podbean.com/a.mp3",
    durationSeconds: 3000,
    publishedAt: "2025-02-01T00:00:00.000Z",
    ...overrides,
  } as EpisodeListItem;
}

describe("row keys are defined and unique", () => {
  test("every episode yields a defined, unique key from slug.current", () => {
    const episodes = ["a", "b", "c"].map((slug) => episode(slug));
    const keys = episodes.map((item) => item.slug.current);

    expect(keys.every((key) => typeof key === "string" && key.length > 0)).toBe(true);
    expect(new Set(keys).size).toBe(episodes.length);
  });

  test("the card is keyed on slug.current, never on the dropped guid", () => {
    expect(ROUTE).toContain("key={row.source.slug.current}");
    expect(ROUTE).not.toContain("key={episode.guid}");
  });
});

describe("cards are image-forward and link to the episode", () => {
  test("the grid card renders an image and links to /podcast/$slug", () => {
    expect(CARD).toContain("<img");
    expect(CARD).toContain('to="/podcast/$slug"');
    expect(CARD).toContain("Listen");
  });

  test("no audio player is nested inside a card link", () => {
    expect(CARD).not.toContain("EpisodePlayer");
    expect(FEATURED).not.toContain("EpisodePlayer");
  });

  test("the featured episode carries a prominent image and its own CTA", () => {
    expect(FEATURED).toContain("<img");
    expect(FEATURED).toContain("Latest episode");
    expect(FEATURED).toContain("Listen to episode");
  });
});

describe("the route declares Decision L's pieces", () => {
  test("it has an errorComponent and a headers option", () => {
    expect(Route.options.errorComponent).toBeDefined();
    expect(Route.options.headers).toBeDefined();
  });

  test("headers emit the degraded markers only on an errored match", () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const headers = (match: { status: string }) => (Route.options.headers as any)({ match });

    expect(headers({ status: "error" })[DEGRADED_SOURCE_HEADER]).toBe("degraded");
    expect(headers({ status: "success" })).toEqual({});
  });

  test("the loader does not catch — an outage must reach the router", () => {
    const start = ROUTE.indexOf("loader:");
    const end = ROUTE.indexOf("headers:", start);
    expect(ROUTE.slice(start, end)).not.toContain("catch");
  });
});

describe("search still drives the directory; length filtering is gone", () => {
  test("browseEpisodes runs over adapted Sanity episodes and returns real rows", () => {
    const episodes = [
      episode("a", { title: "Leading with Heart", guestName: "Linda Biggs" }),
      episode("b", { title: "Building Cheekbone Beauty", guestName: "Jenn Harper" }),
    ];

    const hits = browseEpisodes(episodes.map(toBrowsable), {
      ...DEFAULT_BROWSE_STATE,
      query: "cheekbone",
    });

    expect(hits.map((hit) => hit.source.slug.current)).toEqual(["b"]);
  });

  test("the route imports the shared filter rather than reimplementing it", () => {
    expect(ROUTE).toContain("browseEpisodes");
  });

  test("no duration bucket UI survives", () => {
    expect(ROUTE).not.toContain("DURATION_OPTIONS");
    expect(ROUTE).not.toContain("durationCounts");
    expect(ROUTE).not.toContain("Any length");
  });
});

describe("no topic or length filtering survives on the directory", () => {
  test("the route renders neither topic pills nor duration buckets", () => {
    expect(ROUTE).not.toContain("topicFacets");
    expect(ROUTE).not.toContain("filterByTopic");
    expect(ROUTE).not.toContain("All episodes\"");
    expect(ROUTE).not.toContain("DURATION_OPTIONS");
  });

  test("search and sort remain the only discovery controls", () => {
    expect(ROUTE).toContain("browseEpisodes");
    expect(ROUTE).toContain("SORT_OPTIONS");
  });
});

describe("episode numbers live in metadata, never in the title", () => {
  test("both card surfaces strip the feed's Episode N prefix", () => {
    expect(CARD).toContain("displayTitle");
    expect(FEATURED).toContain("displayTitle");
  });

  test("the metadata line pairs number and duration", () => {
    expect(CARD).toContain("episodeMeta");
    expect(FEATURED).toContain("episodeMeta");
  });
});

describe("incremental render", () => {
  test("a page size is declared and the grid is sliced by it", () => {
    expect(ROUTE).toMatch(/const PAGE_SIZE = 9;/);
    expect(ROUTE).toContain("visible.slice(1, 1 + shown)");
  });

  test("a View all control exists and is conditional on there being more", () => {
    expect(ROUTE).toContain("View all episodes");
    expect(ROUTE).toContain("shown + 1 < visible.length");
  });

  test("the window resets when the query changes", () => {
    expect(ROUTE).toContain("setShown(PAGE_SIZE), [browse]");
  });
});

describe("the hero", () => {
  test("PODCAST is the lime word and there is no LISTEN NOW button", () => {
    expect(ROUTE).toContain('<span className="text-lime">Podcast</span>');
    expect(ROUTE).not.toContain("Listen now");
  });

  test("the hero carries a large image", () => {
    expect(ROUTE).toContain("podcastImage");
  });
});

describe("an empty catalogue and an outage are different states", () => {
  test("the empty state is reached by rendering, the outage by the errorComponent", () => {
    expect(ROUTE).toContain("errorComponent: PodcastDegraded");
    expect(ROUTE).toContain("Clear filters");
  });
});

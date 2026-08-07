import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { DEGRADED_SOURCE_HEADER } from "@/lib/podcast/degraded-status";
import { toBrowsable, type EpisodeListItem } from "@/lib/podcast/episode";
import { browseEpisodes, DEFAULT_BROWSE_STATE } from "@/lib/podbean";
import { Route } from "./podcast";

/**
 * The directory, after the swap to Sanity.
 *
 * The key-stability row is the one that would not otherwise exist. `guid` left
 * the list projection to save payload, and it was the React key here — but a
 * `key={undefined}` is a console warning, not a thrown error or a failed
 * render, so the regression would ship with a green suite. Nothing else in this
 * file catches it.
 */

const CARD = readFileSync(
  path.join(import.meta.dir, "..", "components", "episode-card.tsx"),
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
    // Asserted as a set sized against the row count, so a single undefined —
    // which collapses to one entry — fails rather than passing quietly.
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

describe("the title links to the episode; the player does not sit inside it", () => {
  test("the heading contains the Link", () => {
    // A Link wrapping the whole row would put the audio player inside an
    // anchor: nested interactive content, a real content-model defect.
    const heading = CARD.slice(CARD.indexOf("<h3"), CARD.indexOf("</h3>"));
    expect(heading).toContain("<Link");
    expect(heading).toContain('to="/podcast/$slug"');
  });

  test("EpisodePlayer is rendered outside every Link", () => {
    const playerAt = CARD.indexOf("<EpisodePlayer");
    const headingEnd = CARD.indexOf("</h3>");

    expect(playerAt).toBeGreaterThan(headingEnd);
    // And it is not wrapped by the footer link either.
    const footerAt = CARD.indexOf("View episode");
    expect(playerAt).toBeLessThan(footerAt);
  });

  test("the player is retained rather than deleted to simplify the row", () => {
    expect(CARD).toContain("<EpisodePlayer");
    expect(CARD).toContain("src={episode.audioUrl}");
  });

  test("a second, larger affordance points at the same destination", () => {
    expect(CARD).toContain("View episode");
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

describe("the shipped filter still drives the directory", () => {
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

  test("the route imports the filter rather than reimplementing it", () => {
    expect(ROUTE).toContain("browseEpisodes");
    expect(ROUTE).toContain("durationCounts");
  });
});

describe("incremental render", () => {
  test("a page size is declared and the row list is sliced by it", () => {
    expect(ROUTE).toMatch(/const PAGE_SIZE = 12;/);
    expect(ROUTE).toContain("visible.slice(0, shown)");
  });

  test("a Show more control exists and is conditional on there being more", () => {
    expect(ROUTE).toContain("Show more");
    expect(ROUTE).toContain("shown < visible.length");
  });

  test("the window resets when the query changes", () => {
    // Otherwise searching after "Show more" reports a count against the
    // previous result set.
    expect(ROUTE).toContain("setShown(PAGE_SIZE), [browse]");
  });
});

describe("an empty catalogue and an outage are different states", () => {
  test("the empty state is reached by rendering, the outage by the errorComponent", () => {
    // Conflating them is what would let an outage render as "no episodes yet".
    expect(ROUTE).toContain("errorComponent: PodcastDegraded");
    expect(ROUTE).toContain("Clear filters");
  });
});

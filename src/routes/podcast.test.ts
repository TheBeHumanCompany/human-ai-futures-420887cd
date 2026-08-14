import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

import { episodeCardImage } from "@/components/episode-card";
import { DEGRADED_SOURCE_HEADER } from "@/lib/podcast/degraded-status";
import { toBrowsable, type EpisodeListItem } from "@/lib/podcast/episode";
import { DEFAULT_SHARE_IMAGE_PATH } from "@/lib/podcast/seo";
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

  test("the row carries no player — playback lives on the episode page", () => {
    // This replaces a test that asserted the opposite. The row previously
    // embedded an EpisodePlayer, and the card's own docstring argued it should
    // never be removed to simplify the row. That was overridden deliberately in
    // Round 10 of the requirements interview, in favour of the approved
    // directory design. Pinned so the reversal is a decision on the record
    // rather than an assertion that quietly disappeared.
    expect(CARD).not.toContain("<EpisodePlayer");
  });

  test("the artwork link is named, and its play glyph is decorative", () => {
    // The consequence of removing the player: the triangle on the artwork looks
    // like a transport control and actually navigates. Without an accessible
    // name it is an unlabelled image link — a WCAG 4.1.2 defect in the same
    // standard the removed player argument was written to defend, and one that
    // `not.toContain("<EpisodePlayer")` sails straight past.
    const artwork = CARD.slice(CARD.indexOf("<Link"), CARD.indexOf("</Link>"));
    expect(artwork).toContain("aria-label");
    expect(artwork).toContain("Open episode:");
    expect(artwork).toContain("aria-hidden");
  });

  test("a second, larger affordance points at the same destination", () => {
    // Retained rather than updated away. Two links where one is an unlabelled
    // image is precisely the configuration this row must not become.
    expect(CARD).toContain("Listen to episode");
  });
});

describe("episodeCardImage precedence", () => {
  /**
   * The test `episodeCardImage`'s docstring has always claimed exists.
   *
   * It matters more now than it did: the directory became image-led, so this
   * chain decides what almost every row shows. On the live dataset exactly one
   * of thirty-nine episodes has cover artwork and none has a generated share
   * card, which means the default is currently the common case rather than the
   * fallback — and once share cards are uploaded, a real photograph added later
   * has to keep outranking the generated one with no code change.
   */
  // Asset ids must be hex — `REF_PATTERN` in src/lib/sanity/image.ts rejects
  // anything else and `imageUrl` returns null, which silently resolves to the
  // default and would make this test pass for the wrong reason.
  const COVER_REF = "image-aaa111-1200x630-png";
  const CARD_REF = "image-bbb222-1200x630-png";

  test("cover artwork outranks a generated share card", () => {
    const withBoth = episodeCardImage(
      episode("a", { coverArtwork: COVER_REF, shareCard: CARD_REF }),
    );
    const withCardOnly = episodeCardImage(
      episode("a", { coverArtwork: null, shareCard: CARD_REF }),
    );

    expect(withBoth).not.toBe(withCardOnly);
    expect(withBoth).toContain("aaa111");
    expect(withCardOnly).toContain("bbb222");
  });

  test("with neither set it falls back to the branded default", () => {
    const fallback = episodeCardImage(episode("a", { coverArtwork: null, shareCard: null }));

    expect(fallback).toContain(DEFAULT_SHARE_IMAGE_PATH);
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
  });

  test("the duration-length chips are gone from the directory", () => {
    // Removed deliberately in Round 10: the approved directory design specifies
    // search and sort only. The filter library behind them is kept — see
    // src/lib/podbean/filter.ts — so this pins the UI removal, not a capability
    // deletion.
    expect(ROUTE).not.toContain("DURATION_OPTIONS");
    expect(ROUTE).not.toContain("durationCounts");
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

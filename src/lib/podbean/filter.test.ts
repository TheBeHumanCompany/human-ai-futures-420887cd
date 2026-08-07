import { describe, expect, test } from "bun:test";

import {
  browseEpisodes,
  DEFAULT_BROWSE_STATE,
  DURATION_OPTIONS,
  durationCounts,
  isDefaultBrowseState,
  type Browsable,
  type BrowseState,
} from "./filter";

function ep(over: Partial<Browsable> & { episodeNumber: number }): Browsable {
  return {
    title: `Episode ${over.episodeNumber}: Something`,
    excerpt: "",
    durationSeconds: 50 * 60,
    // Descending pubDate so higher episode numbers are newer.
    pubDate: new Date(Date.UTC(2025, 0, over.episodeNumber)).toISOString(),
    ...over,
  };
}

const CATALOGUE: Browsable[] = [
  ep({
    episodeNumber: 39,
    title: "Episode 39: Leading with Heart: Jill De Chavez on Building a People-First Business",
    guest: "Jill De Chavez",
    excerpt: "Briteweb manages the online presence of mission-driven organisations.",
    durationSeconds: 46 * 60,
  }),
  ep({
    episodeNumber: 21,
    title: "Episode 21: From Farm to Face: How Nancy Wingham is Redefining Skincare",
    guest: "Nancy Wingham",
    excerpt: "A Vancouver skincare brand built on pecan oil and sustainability.",
    durationSeconds: 38 * 60,
  }),
  ep({
    episodeNumber: 15,
    title: "Episode 15: From Banana Brownies to a National Brand",
    guest: "Joao Ribeiro",
    excerpt: "Elements Brazil grew out of a home kitchen in São Paulo.",
    durationSeconds: 72 * 60,
  }),
  ep({
    episodeNumber: 1,
    title: "Episode 1: The Story Behind CAYA",
    excerpt: "Two friends venting about healthcare in British Columbia.",
    durationSeconds: 55 * 60,
  }),
];

const state = (over: Partial<BrowseState> = {}): BrowseState => ({
  ...DEFAULT_BROWSE_STATE,
  ...over,
});

describe("browseEpisodes — sorting", () => {
  test("newest first by default", () => {
    expect(browseEpisodes(CATALOGUE, state()).map((e) => e.episodeNumber)).toEqual([39, 21, 15, 1]);
  });

  test("oldest first starts from episode 1", () => {
    expect(
      browseEpisodes(CATALOGUE, state({ sort: "oldest" })).map((e) => e.episodeNumber),
    ).toEqual([1, 15, 21, 39]);
  });

  test("does not mutate the input", () => {
    const before = CATALOGUE.map((e) => e.episodeNumber);
    browseEpisodes(CATALOGUE, state({ sort: "oldest" }));
    expect(CATALOGUE.map((e) => e.episodeNumber)).toEqual(before);
  });
});

describe("browseEpisodes — search", () => {
  test("empty query returns everything", () => {
    expect(browseEpisodes(CATALOGUE, state({ query: "   " }))).toHaveLength(4);
  });

  test("matches on title", () => {
    expect(
      browseEpisodes(CATALOGUE, state({ query: "skincare" })).map((e) => e.episodeNumber),
    ).toEqual([21]);
  });

  test("matches on guest", () => {
    expect(
      browseEpisodes(CATALOGUE, state({ query: "Chavez" })).map((e) => e.episodeNumber),
    ).toEqual([39]);
  });

  test("matches on excerpt — the reason show notes ship at all", () => {
    // "healthcare" appears in no title and no guest name.
    expect(
      browseEpisodes(CATALOGUE, state({ query: "healthcare" })).map((e) => e.episodeNumber),
    ).toEqual([1]);
  });

  test("matches an episode number", () => {
    expect(
      browseEpisodes(CATALOGUE, state({ query: "episode 15" })).map((e) => e.episodeNumber),
    ).toEqual([15]);
  });

  test("multiple terms narrow rather than widen", () => {
    expect(browseEpisodes(CATALOGUE, state({ query: "vancouver skincare" }))).toHaveLength(1);
    expect(browseEpisodes(CATALOGUE, state({ query: "vancouver spaceship" }))).toHaveLength(0);
  });

  test("is case- and accent-insensitive", () => {
    expect(browseEpisodes(CATALOGUE, state({ query: "SAO PAULO" }))).toHaveLength(1);
    expect(browseEpisodes(CATALOGUE, state({ query: "são paulo" }))).toHaveLength(1);
  });

  test("ignores punctuation noise", () => {
    expect(browseEpisodes(CATALOGUE, state({ query: "!!!" }))).toHaveLength(4);
    expect(browseEpisodes(CATALOGUE, state({ query: "chavez," }))).toHaveLength(1);
  });

  test("tolerates a missing guest without throwing", () => {
    expect(() => browseEpisodes(CATALOGUE, state({ query: "caya" }))).not.toThrow();
    expect(browseEpisodes(CATALOGUE, state({ query: "caya" }))).toHaveLength(1);
  });
});

describe("browseEpisodes — duration", () => {
  test("buckets are half-open so nothing is double counted", () => {
    const boundary = [ep({ episodeNumber: 2, durationSeconds: 45 * 60 })];
    expect(browseEpisodes(boundary, state({ duration: "short" }))).toHaveLength(0);
    expect(browseEpisodes(boundary, state({ duration: "medium" }))).toHaveLength(1);
  });

  test("filters to the right episodes", () => {
    expect(
      browseEpisodes(CATALOGUE, state({ duration: "short" })).map((e) => e.episodeNumber),
    ).toEqual([21]);
    expect(
      browseEpisodes(CATALOGUE, state({ duration: "long" })).map((e) => e.episodeNumber),
    ).toEqual([15]);
    expect(
      browseEpisodes(CATALOGUE, state({ duration: "medium" })).map((e) => e.episodeNumber),
    ).toEqual([39, 1]);
  });

  test("every bucket sums to the whole catalogue", () => {
    const total = (["short", "medium", "long"] as const).reduce(
      (sum, bucket) => sum + browseEpisodes(CATALOGUE, state({ duration: bucket })).length,
      0,
    );
    expect(total).toBe(CATALOGUE.length);
  });

  test("combines with search", () => {
    expect(browseEpisodes(CATALOGUE, state({ query: "vancouver", duration: "long" }))).toHaveLength(
      0,
    );
    expect(
      browseEpisodes(CATALOGUE, state({ query: "vancouver", duration: "short" })),
    ).toHaveLength(1);
  });
});

describe("durationCounts", () => {
  test("counts reflect the current search", () => {
    expect(durationCounts(CATALOGUE)).toEqual({ all: 4, short: 1, medium: 2, long: 1 });
    expect(durationCounts(CATALOGUE, "vancouver")).toEqual({
      all: 1,
      short: 1,
      medium: 0,
      long: 0,
    });
  });

  test("a bucket showing 0 really is empty", () => {
    const counts = durationCounts(CATALOGUE, "vancouver");
    for (const option of DURATION_OPTIONS) {
      const actual = browseEpisodes(
        CATALOGUE,
        state({ query: "vancouver", duration: option.value }),
      ).length;
      expect(counts[option.value]).toBe(actual);
    }
  });
});

describe("isDefaultBrowseState", () => {
  test("whitespace-only query still counts as default", () => {
    expect(isDefaultBrowseState(DEFAULT_BROWSE_STATE)).toBe(true);
    expect(isDefaultBrowseState(state({ query: "   " }))).toBe(true);
  });

  test("any active control is not default", () => {
    expect(isDefaultBrowseState(state({ query: "x" }))).toBe(false);
    expect(isDefaultBrowseState(state({ duration: "short" }))).toBe(false);
    expect(isDefaultBrowseState(state({ sort: "oldest" }))).toBe(false);
  });
});

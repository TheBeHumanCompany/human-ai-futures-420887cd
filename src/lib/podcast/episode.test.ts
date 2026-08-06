import { describe, expect, test } from "bun:test";

import { DEFAULT_BROWSE_STATE, browseEpisodes, durationCounts } from "../podbean/filter";
import { toBrowsable, type EpisodeListItem } from "./episode";

/**
 * The mechanical proof that the directory's search, filter and sort keep
 * working against Sanity data.
 *
 * This is deliberately **behavioural, not structural**. A `satisfies Browsable`
 * would be checked by nothing here: `bun test` does not typecheck, and the root
 * `tsconfig.json` excludes `src/**` + `.test.ts` from `tsc --noEmit`, so a
 * type-level assertion in a test file is decorative. What runs below is the
 * real, unmodified `browseEpisodes` and `durationCounts` imported from
 * `src/lib/podbean/filter.ts`, with values asserted — which is the only form
 * that can actually go red if the adapter stops lining up.
 */

function episode(overrides: Partial<EpisodeListItem> & { slug: string }): EpisodeListItem {
  const { slug, ...rest } = overrides;
  return {
    slug: { current: slug },
    episodeNumber: 1,
    title: "An Episode",
    excerpt: "Something happened.",
    topics: null,
    guestName: "A Guest",
    guestPhoto: null,
    coverArtwork: null,
    audioUrl: "https://mcdn.podbean.com/a.mp3",
    durationSeconds: 30 * 60,
    publishedAt: "2025-01-01T00:00:00.000Z",
    ...rest,
  };
}

/**
 * Durations chosen to land unambiguously inside each bucket rather than on a
 * boundary: short is < 45 min, medium is 45–60, long is > 60.
 */
const CORPUS: EpisodeListItem[] = [
  episode({
    slug: "joao-ribeiro-elements-brazil",
    episodeNumber: 15,
    title: "Elements Brazil and the Home Kitchen",
    // The accent case, carried over from filter.test.ts: an unaccented query
    // must still find accented content.
    excerpt: "Elements Brazil grew out of a home kitchen in São Paulo.",
    guestName: "Joao Ribeiro",
    durationSeconds: 30 * 60,
    publishedAt: "2025-03-01T00:00:00.000Z",
  }),
  episode({
    slug: "jenn-harper-cheekbone-beauty",
    episodeNumber: 5,
    title: "Building Cheekbone Beauty",
    excerpt: "An Indigenous-owned cosmetics company built on giving back.",
    guestName: "Jenn Harper",
    durationSeconds: 50 * 60,
    publishedAt: "2025-02-01T00:00:00.000Z",
  }),
  episode({
    slug: "linda-biggs-leading-with-heart",
    episodeNumber: 18,
    title: "Leading With Heart",
    excerpt: "A long conversation about resilience in healthcare leadership.",
    guestName: "Linda Biggs",
    durationSeconds: 75 * 60,
    publishedAt: "2025-01-01T00:00:00.000Z",
  }),
  episode({
    // Episodes 1 and 6 really have no parsed guest — their titles name a
    // company, not a person. This row is why `guest` is optional downstream.
    slug: "the-story-so-far",
    episodeNumber: 1,
    title: "The Story So Far",
    excerpt: "How the show began.",
    guestName: null,
    durationSeconds: 20 * 60,
    publishedAt: "2024-12-01T00:00:00.000Z",
  }),
];

const browsable = CORPUS.map(toBrowsable);

const slugsOf = (rows: ReturnType<typeof toBrowsable>[]) =>
  rows.map((row) => row.source.slug.current);

describe("toBrowsable field mapping", () => {
  test("renames guestName to guest and publishedAt to pubDate", () => {
    const [first] = CORPUS.map(toBrowsable);
    expect(first.guest).toBe("Joao Ribeiro");
    expect(first.pubDate).toBe("2025-03-01T00:00:00.000Z");
  });

  test("an absent guest becomes undefined, not null", () => {
    // `Browsable.guest` is optional and `matchesQuery` folds it with `?? ""`.
    // A literal `null` would mean the two modules disagree about how absence is
    // spelled, so it is normalised at the boundary.
    const noGuest = toBrowsable(CORPUS[3]);
    expect(noGuest.guest).toBeUndefined();
    expect(Object.hasOwn(noGuest, "guest")).toBe(true);
  });

  test("carries the original through, so a filtered row can still be rendered", () => {
    const [first] = CORPUS.map(toBrowsable);
    expect(first.source.slug.current).toBe("joao-ribeiro-elements-brazil");
    expect(first.source.audioUrl).toBe("https://mcdn.podbean.com/a.mp3");
  });
});

describe("the real browseEpisodes, fed adapted Sanity episodes", () => {
  test("fixture sanity — the corpus is non-trivial", () => {
    // Non-vacuity floor. Every assertion below is a filter over this list and
    // would pass on an empty one.
    expect(browsable).toHaveLength(4);
    expect(new Set(slugsOf(browsable)).size).toBe(4);
  });

  test("an unaccented query still finds accented content", () => {
    // "sao paulo" must find "São Paulo" — the exact case filter.test.ts pins,
    // re-proven through the adapter rather than assumed to survive it.
    const hits = browseEpisodes(browsable, { ...DEFAULT_BROWSE_STATE, query: "sao paulo" });
    expect(slugsOf(hits)).toEqual(["joao-ribeiro-elements-brazil"]);
  });

  test("a query matches the guest name through the renamed field", () => {
    const hits = browseEpisodes(browsable, { ...DEFAULT_BROWSE_STATE, query: "jenn harper" });
    expect(slugsOf(hits)).toEqual(["jenn-harper-cheekbone-beauty"]);
  });

  test("a query matches the excerpt", () => {
    const hits = browseEpisodes(browsable, { ...DEFAULT_BROWSE_STATE, query: "healthcare" });
    expect(slugsOf(hits)).toEqual(["linda-biggs-leading-with-heart"]);
  });

  test("an episode with no guest is still searchable and never throws", () => {
    const hits = browseEpisodes(browsable, { ...DEFAULT_BROWSE_STATE, query: "story so far" });
    expect(slugsOf(hits)).toEqual(["the-story-so-far"]);
  });

  test("each duration bucket selects the right episodes", () => {
    const short = browseEpisodes(browsable, { ...DEFAULT_BROWSE_STATE, duration: "short" });
    const medium = browseEpisodes(browsable, { ...DEFAULT_BROWSE_STATE, duration: "medium" });
    const long = browseEpisodes(browsable, { ...DEFAULT_BROWSE_STATE, duration: "long" });

    expect(slugsOf(short).sort()).toEqual(
      ["joao-ribeiro-elements-brazil", "the-story-so-far"].sort(),
    );
    expect(slugsOf(medium)).toEqual(["jenn-harper-cheekbone-beauty"]);
    expect(slugsOf(long)).toEqual(["linda-biggs-leading-with-heart"]);
  });

  test("newest and oldest sort in opposite orders, keyed on the renamed date", () => {
    const newest = browseEpisodes(browsable, { ...DEFAULT_BROWSE_STATE, sort: "newest" });
    const oldest = browseEpisodes(browsable, { ...DEFAULT_BROWSE_STATE, sort: "oldest" });

    expect(slugsOf(newest)).toEqual([
      "joao-ribeiro-elements-brazil",
      "jenn-harper-cheekbone-beauty",
      "linda-biggs-leading-with-heart",
      "the-story-so-far",
    ]);
    expect(slugsOf(oldest)).toEqual([...slugsOf(newest)].reverse());
  });
});

describe("the real durationCounts, fed adapted Sanity episodes", () => {
  test("buckets partition the corpus", () => {
    const counts = durationCounts(browsable);
    expect(counts.all).toBe(4);
    expect(counts.short + counts.medium + counts.long).toBe(counts.all);
    // Not a vacuous partition: 0+0+0 === 0 would satisfy the line above.
    expect(counts.all).toBeGreaterThan(0);
    expect(counts).toEqual({ all: 4, short: 2, medium: 1, long: 1 });
  });

  test("counts narrow with a query, proving the search feeds the counts too", () => {
    const counts = durationCounts(browsable, "healthcare");
    expect(counts).toEqual({ all: 1, short: 0, medium: 0, long: 1 });
  });
});

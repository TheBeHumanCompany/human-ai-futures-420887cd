import { describe, expect, test } from "bun:test";

import type { EpisodeListItem, SanityTopic } from "./episode";
import { selectRelatedEpisodes } from "./related";

/**
 * Decision M, both regimes.
 *
 * The zero-topics regime is not a hypothetical: `topics` is 0/39 on the live
 * dataset, so until enrichment lands it is the ONLY regime the site runs in.
 * It is tested first for that reason.
 */

function topic(id: string): SanityTopic {
  return { _id: id, name: id.replace("topic-", "") };
}

function episode(number: number | null, overrides: Partial<EpisodeListItem> = {}): EpisodeListItem {
  return {
    slug: { current: `episode-${number ?? "none"}` },
    episodeNumber: number,
    title: `Episode ${number}`,
    excerpt: "An excerpt.",
    topics: null,
    guestName: "A Guest",
    guestPhoto: null,
    coverArtwork: null,
    audioUrl: "https://mcdn.podbean.com/a.mp3",
    durationSeconds: 3000,
    // All 39 really were bulk-uploaded within hours of each other, which is
    // exactly why publishedAt is a tie-break and not the fallback.
    publishedAt: "2025-06-24T12:00:00.000Z",
    ...overrides,
  };
}

/** Episodes 1..39, no topics — today's real corpus shape. */
const CORPUS = Array.from({ length: 39 }, (_unused, index) => episode(index + 1));

const numbersOf = (episodes: EpisodeListItem[]) => episodes.map((e) => e.episodeNumber);

describe("the zero-topics regime — the site's actual behaviour today", () => {
  test("fixture sanity — the corpus has no topics at all", () => {
    // Non-vacuity floor, and a statement of the premise: if this ever fails the
    // rest of this block is testing a different regime than it claims.
    expect(CORPUS).toHaveLength(39);
    expect(CORPUS.every((e) => e.topics === null)).toBe(true);
  });

  test("falls to episode-number proximity, surfacing the immediate neighbours", () => {
    const related = selectRelatedEpisodes(episode(12), CORPUS);
    // 11 and 13 are equidistant; 12 itself is excluded. The third is the next
    // ring out.
    expect(numbersOf(related).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([10, 11, 13]);
  });

  test("returns exactly three", () => {
    expect(selectRelatedEpisodes(episode(20), CORPUS)).toHaveLength(3);
  });

  test("never relates an episode to itself", () => {
    for (const current of [episode(1), episode(20), episode(39)]) {
      const related = selectRelatedEpisodes(current, CORPUS);
      expect(numbersOf(related)).not.toContain(current.episodeNumber);
    }
  });

  test("episode 1 — the lower boundary — still returns three", () => {
    // A naive symmetric window would return two here.
    const related = selectRelatedEpisodes(episode(1), CORPUS);
    expect(related).toHaveLength(3);
    expect(numbersOf(related).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([2, 3, 4]);
  });

  test("episode 39 — the upper boundary — still returns three", () => {
    const related = selectRelatedEpisodes(episode(39), CORPUS);
    expect(related).toHaveLength(3);
    expect(numbersOf(related).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([36, 37, 38]);
  });
});

describe("the topic regime — behaviour once enrichment lands", () => {
  const withTopics: EpisodeListItem[] = [
    episode(2, { topics: [topic("topic-leadership"), topic("topic-culture")] }),
    episode(3, { topics: [topic("topic-leadership")] }),
    episode(30, { topics: [topic("topic-leadership"), topic("topic-culture")] }),
    episode(31, { topics: null }),
    episode(32, { topics: [topic("topic-finance")] }),
  ];

  const current = episode(31, {
    slug: { current: "current-episode" },
    topics: [topic("topic-leadership"), topic("topic-culture")],
  });

  test("topic overlap outranks number proximity", () => {
    const related = selectRelatedEpisodes(current, withTopics);
    // Episodes 2 and 30 share two topics; 30 is adjacent and 2 is far away, but
    // both outrank 32 and 31 which are adjacent with no shared topics.
    expect(
      numbersOf(related)
        .slice(0, 2)
        .sort((a, b) => (a ?? 0) - (b ?? 0)),
    ).toEqual([2, 30]);
  });

  test("among equal overlap, the nearer episode number wins", () => {
    const related = selectRelatedEpisodes(current, withTopics);
    // 30 (distance 1) must precede 2 (distance 29) — both share two topics.
    expect(related[0].episodeNumber).toBe(30);
  });

  test("an episode with no topics is still a candidate, just a weaker one", () => {
    const related = selectRelatedEpisodes(current, withTopics);
    expect(related).toHaveLength(3);
    // Third place goes to an episode the two-topic matches did not take, ranked
    // below them on overlap. Asserted as membership of the remaining set rather
    // than a single number, because 3, 31 and 32 differ on overlap and distance
    // in ways this row is not the place to pin.
    expect([3, 31, 32]).toContain(related[2].episodeNumber);
    // And the two-topic matches really did take the first two places, so the
    // line above is about the leftovers rather than about nothing.
    expect(numbersOf(related.slice(0, 2)).sort((a, b) => (a ?? 0) - (b ?? 0))).toEqual([2, 30]);
  });
});

describe("degenerate inputs", () => {
  test("an episode with a null episodeNumber still returns three", () => {
    // The schema does not require episodeNumber; today it is 39/39, which is an
    // observation rather than a guarantee.
    const related = selectRelatedEpisodes(
      episode(null, { slug: { current: "numberless" } }),
      CORPUS,
    );
    expect(related).toHaveLength(3);
  });

  test("a numberless CANDIDATE sorts after numbered ones rather than being dropped", () => {
    const candidates = [
      episode(null, { slug: { current: "numberless" }, publishedAt: "2030-01-01T00:00:00.000Z" }),
      episode(11),
      episode(13),
      episode(14),
    ];
    const related = selectRelatedEpisodes(episode(12), candidates);
    expect(numbersOf(related)).toEqual([11, 13, 14]);
  });

  test("ties on both overlap and distance break by publishedAt descending", () => {
    const candidates = [
      episode(11, { slug: { current: "older" }, publishedAt: "2025-01-01T00:00:00.000Z" }),
      episode(13, { slug: { current: "newer" }, publishedAt: "2025-09-01T00:00:00.000Z" }),
    ];
    const related = selectRelatedEpisodes(episode(12), candidates);
    expect(related[0].slug.current).toBe("newer");
  });

  test("fewer candidates than the limit returns what exists rather than throwing", () => {
    expect(selectRelatedEpisodes(episode(12), [episode(11)])).toHaveLength(1);
    expect(selectRelatedEpisodes(episode(12), [])).toEqual([]);
  });

  test("a candidate list containing only the current episode returns empty", () => {
    const current = episode(12);
    expect(selectRelatedEpisodes(current, [current])).toEqual([]);
  });
});

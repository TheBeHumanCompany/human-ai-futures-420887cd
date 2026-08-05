import { describe, expect, test } from "bun:test";

import type { Episode } from "../podbean/types";
import { buildSeedDocuments } from "./sync";

function makeEpisode(overrides: Partial<Episode> = {}): Episode {
  return {
    guid: "guid-1",
    episodeNumber: 1,
    title: "Episode 1: Some Title",
    guest: "Jane Doe",
    description: "Full show notes.",
    excerpt: "Short excerpt.",
    pubDate: "2026-01-01T00:00:00.000Z",
    durationSeconds: 1800,
    audioUrl: "https://cdn.example.com/ep1.mp3",
    podbeanUrl: "https://example.podbean.com/e/ep1",
    ...overrides,
  };
}

describe("buildSeedDocuments", () => {
  test("maps a normal episode with a guest to the expected fields, omitting enrichment/computed fields", () => {
    const episode = makeEpisode();
    const proposal = { guid: "guid-1", _id: "episode-guid-1", slug: "jane-doe-some-title" };

    const [result] = buildSeedDocuments([episode], [proposal]);

    expect(result.slug).toBe("jane-doe-some-title");
    expect(result.episodeDoc).toEqual({
      _id: "episode-guid-1",
      _type: "episode",
      guid: "guid-1",
      title: "Episode 1: Some Title",
      description: "Full show notes.",
      excerpt: "Short excerpt.",
      guestName: "Jane Doe",
      podbeanUrl: "https://example.podbean.com/e/ep1",
      audioUrl: "https://cdn.example.com/ep1.mp3",
      durationSeconds: 1800,
      publishedAt: "2026-01-01T00:00:00.000Z",
      episodeNumber: 1,
      seededBy: "backfill-v1",
    });

    for (const omitted of [
      "topics",
      "guestPhoto",
      "coverArtwork",
      "guestKey",
      "slug",
      "slugFrozenAt",
      "searchText",
    ]) {
      expect(Object.hasOwn(result.episodeDoc, omitted)).toBe(false);
    }
  });

  test("leaves guestName undefined, not a placeholder, when the episode has no parsed guest", () => {
    const episode = makeEpisode({ guid: "guid-2", guest: undefined });
    const proposal = { guid: "guid-2", _id: "episode-guid-2", slug: "some-title" };

    const [result] = buildSeedDocuments([episode], [proposal]);

    expect(result.episodeDoc.guestName).toBeUndefined();
    expect(Object.hasOwn(result.episodeDoc, "guestName")).toBe(true);
  });

  test("throws naming the guid when an episode has no matching slug proposal", () => {
    const episode = makeEpisode({ guid: "orphan-episode" });

    expect(() => buildSeedDocuments([episode], [])).toThrow(/orphan-episode/);
  });

  test("throws naming the guid when a slug proposal has no matching episode", () => {
    const proposal = { guid: "orphan-proposal", _id: "episode-orphan-proposal", slug: "orphan" };

    expect(() => buildSeedDocuments([], [proposal])).toThrow(/orphan-proposal/);
  });

  test("returns all matched episodes, order preserved", () => {
    const episodeA = makeEpisode({ guid: "guid-a", title: "Title A", episodeNumber: 1 });
    const episodeB = makeEpisode({ guid: "guid-b", title: "Title B", episodeNumber: 2 });
    const episodeC = makeEpisode({ guid: "guid-c", title: "Title C", episodeNumber: 3 });

    // Proposals deliberately out of order to prove the output follows the
    // episodes array, not the proposals array.
    const proposals = [
      { guid: "guid-c", _id: "episode-guid-c", slug: "slug-c" },
      { guid: "guid-a", _id: "episode-guid-a", slug: "slug-a" },
      { guid: "guid-b", _id: "episode-guid-b", slug: "slug-b" },
    ];

    const results = buildSeedDocuments([episodeA, episodeB, episodeC], proposals);

    expect(results).toHaveLength(3);
    expect(results.map((r) => r.episodeDoc.title)).toEqual(["Title A", "Title B", "Title C"]);
  });
});

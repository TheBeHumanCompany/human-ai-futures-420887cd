import { describe, expect, test } from "bun:test";

import { clearEpisodeCache, loadEpisodes } from "../podbean/feed";
import { episodeDocId } from "./doc-id";

const RUN_LIVE_TESTS = !!process.env.RUN_LIVE_TESTS;

describe("episodeDocId", () => {
  test("sanitises a real PodBean guid, including the domain's dots", () => {
    // Both '/' and '.' are outside the allowed set and become '-': '.' is
    // excluded on purpose so the result stays a single Sanity path() segment
    // (see the comment on episodeDocId).
    expect(episodeDocId("show.podbean.com/one")).toBe("episode-show-podbean-com-one");
  });

  test("sanitises a colon", () => {
    // ':' is outside the allowed set and becomes '-'.
    expect(episodeDocId("abc:123")).toBe("episode-abc-123");
  });

  test("never leaves a '.' in the result (would split a Sanity path() segment)", () => {
    expect(episodeDocId("show.podbean.com/abc.def")).not.toContain(".");
  });

  test("sanitises a space and a slash together", () => {
    // Both ' ' and '/' are outside the allowed set and each becomes '-'.
    expect(episodeDocId("a b/c")).toBe("episode-a-b-c");
  });

  test("never throws and always returns an 'episode-' prefixed string", () => {
    const inputs = [
      "",
      "!!!///:::",
      "a".repeat(600),
      "guid-\u{1F399}\u{FE0F}-test", // contains an emoji + variation selector
    ];

    for (const input of inputs) {
      let result = "";
      expect(() => {
        result = episodeDocId(input);
      }).not.toThrow();
      expect(typeof result).toBe("string");
      expect(result.startsWith("episode-")).toBe(true);
    }
  });

  test("sanitisation is not injective — different guids can collide (known limitation)", () => {
    // 'a/b' and 'a:b' both sanitise their separator ('/' and ':') to '-',
    // producing the identical doc id 'episode-a-b' for two different guids.
    //
    // This is NOT a bug to fix here. The project plan
    // (.omc/plans/podcast-episode-library-consensus-v4.md) explicitly defers
    // guaranteeing injectivity to a checked precondition in a later backfill
    // step (Step 6), not to this function. This test exists to pin the known
    // limitation in the suite, not to work around it.
    const a = episodeDocId("a/b");
    const b = episodeDocId("a:b");
    expect(a).toBe(b);
    expect(a).toBe("episode-a-b");
  });
});

describe.skipIf(!RUN_LIVE_TESTS)("episodeDocId against the live PodBean feed", () => {
  test("every real, live guid produces a distinct doc id after sanitisation", async () => {
    clearEpisodeCache();
    const episodes = await loadEpisodes();
    expect(episodes.length).toBeGreaterThan(0);

    const docIds = episodes.map((episode) => episodeDocId(episode.guid));
    expect(new Set(docIds).size).toBe(docIds.length);
  }, 30_000);
});

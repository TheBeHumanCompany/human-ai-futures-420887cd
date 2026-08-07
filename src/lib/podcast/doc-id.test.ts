import { describe, expect, test } from "bun:test";

import { clearEpisodeCache, loadEpisodes } from "../podbean/feed";
import { episodeDocId } from "./doc-id";
import slugsSnapshot from "./slugs.snapshot.json";

const RUN_LIVE_TESTS = !!process.env.RUN_LIVE_TESTS;

/** Sanity's hard ceiling on `_id` length (Content Lake API, all document types). */
const SANITY_ID_LENGTH_LIMIT = 128;

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
    // limitation in the suite, not to work around it — `episodeDocId` is total
    // and collision-prone over ARBITRARY strings; the tests below establish
    // that the real 39-guid corpus never actually lands in a collision.
    const a = episodeDocId("a/b");
    const b = episodeDocId("a:b");
    expect(a).toBe(b);
    expect(a).toBe("episode-a-b");
  });

  test("every generated _id stays under Sanity's 128-character document id limit", () => {
    // Unasserted until now. The longest real guid in the corpus sanitises to
    // 73 characters (see the injectivity test below), comfortably under the
    // ceiling, but nothing previously pinned the ceiling itself — a future
    // guid format (e.g. a longer host name) could silently exceed it.
    for (const { guid } of slugsSnapshot) {
      expect(episodeDocId(guid).length).toBeLessThan(SANITY_ID_LENGTH_LIMIT);
    }

    // Non-vacuity floor: a corpus-driven ceiling check passes perfectly over an
    // empty corpus, which is what a failed snapshot read would produce.
    expect(slugsSnapshot.length).toBe(39);
  });

  test("does NOT truncate to satisfy that limit — the ceiling is a property of the corpus", () => {
    // Deliberately pinned as a limitation rather than "fixed".
    //
    // `episodeDocId` is one total, unconditional function with no fallback
    // branch (plan Step 4), and that totality is load-bearing: the id is the
    // document's permanent identity, so the mapping guid → _id must never
    // depend on when it was computed or on how long the guid happened to be.
    // Truncating at 128 would buy conformance and pay for it in injectivity —
    // two guids differing only past the cut would collide onto one document,
    // which is precisely the failure `assertDocIdsInjective` exists to prevent
    // and a far worse outcome than a rejected write.
    //
    // So a guid long enough to exceed Sanity's limit produces an over-long id
    // and the WRITE fails loudly, rather than the id quietly aliasing onto
    // another episode. The real corpus sits at 73 characters, and PodBean guids
    // are host-plus-uuid shaped, so the headroom is structural rather than
    // lucky. If a feed ever changes shape enough to approach 128, the remedy is
    // a new id scheme with a migration — not a truncation.
    expect(episodeDocId("a".repeat(600)).length).toBeGreaterThan(SANITY_ID_LENGTH_LIMIT);
  });

  // The offline counterpart to the live-only injectivity test below: driven by
  // the 39 `{guid, _id}` pairs committed to `slugs.snapshot.json` rather than a
  // network fetch, so it actually runs in the PR gate. `scripts/backfill.ts`'s
  // `assertDocIdsInjective` re-checks this same property at runtime, against
  // whatever the feed contains *at write time*, immediately before the first
  // write — this test pins the corpus as it was reviewed and committed; the
  // script pins the general case for whatever the feed becomes later.
  test("is injective over the real 39-guid corpus committed in slugs.snapshot.json", () => {
    expect(slugsSnapshot.length).toBe(39);

    const docIds = slugsSnapshot.map(({ guid }) => episodeDocId(guid));
    expect(new Set(docIds).size).toBe(docIds.length);
  });

  test("agrees with the committed _id for every guid in slugs.snapshot.json", () => {
    // Stronger than injectivity alone: pins that the *specific* ids backfilled
    // into Sanity are exactly what `episodeDocId` produces today, so an edit to
    // the sanitisation regex shows up here rather than only in a live drift
    // check.
    for (const { guid, _id } of slugsSnapshot) {
      expect(episodeDocId(guid)).toBe(_id);
    }
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

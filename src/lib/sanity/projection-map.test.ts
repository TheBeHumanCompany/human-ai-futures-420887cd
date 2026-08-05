import { describe, expect, test } from "bun:test";
import { evaluate, parse } from "groq-js";

import { EPISODE_PROJECTION, project } from "./projection-map";

/**
 * Decision H's two layers.
 *
 * The first test pins `EPISODE_PROJECTION`'s exact literal pairs against a
 * frozen table — an accidental edit, including a same-typed field swap, goes
 * red immediately. That alone would not catch a bug in `project()` itself
 * (the obvious one: quoting a dotted path, so `guestPhoto.asset._ref` comes
 * back as text instead of the ref it points to) — so the second test runs
 * the real exported fragment through groq-js's actual parser and evaluator
 * against a raw fixture, rather than a hand-written JS mirror of what the
 * projection "should" do.
 */

describe("EPISODE_PROJECTION", () => {
  test("pins the exact alias -> source pairs", () => {
    // Table frozen deliberately: a swap here — most importantly
    // podbeanUrl <-> audioUrl — is exactly the bug Decision H exists to catch.
    expect(EPISODE_PROJECTION).toEqual({
      _id: "_id",
      guid: "guid",
      slug: "slug",
      episodeNumber: "episodeNumber",
      title: "title",
      description: "description",
      excerpt: "excerpt",
      topics: "topics[]->{_id, name}",
      guestName: "guestName",
      guestBio: "guestBio",
      guestPhoto: "guestPhoto.asset._ref",
      coverArtwork: "coverArtwork.asset._ref",
      podbeanUrl: "podbeanUrl",
      audioUrl: "audioUrl",
      durationSeconds: "durationSeconds",
      publishedAt: "publishedAt",
      searchText: "searchText",
      slugFrozenAt: "slugFrozenAt",
    });
  });

  test("podbeanUrl and audioUrl map to distinct source fields", () => {
    // The exact non-swap Decision H is about. Kept as its own assertion so it
    // reads as a requirement, not an incidental fact about the table above.
    expect(EPISODE_PROJECTION.podbeanUrl).toBe("podbeanUrl");
    expect(EPISODE_PROJECTION.audioUrl).toBe("audioUrl");
    expect(EPISODE_PROJECTION.podbeanUrl).not.toBe(EPISODE_PROJECTION.audioUrl);
  });
});

/**
 * A raw Sanity document as `getDocuments`/a GROQ query would return it —
 * before any projection. `podbeanUrl` and `audioUrl` are deliberately
 * distinct and recognisable so a swap in either the map or `project()` is
 * unmistakable in the assertions below, not a coincidental match.
 */
const episodeFixture = {
  _id: "episode-1",
  _type: "episode",
  guid: "podbean-guid-001",
  slug: { current: "jane-doe-on-ai-safety", _type: "slug" },
  episodeNumber: 12,
  title: "Jane Doe on AI Safety",
  description: "Full show notes from the feed.",
  excerpt: "Jane Doe joins to discuss AI safety.",
  topics: [
    { _ref: "topic-ai-safety", _type: "reference" },
    { _ref: "topic-product", _type: "reference" },
  ],
  guestName: "Jane Doe",
  guestBio: "Jane Doe is a researcher working on AI safety.",
  guestPhoto: { asset: { _ref: "image-aaaa1111-800x800-jpg" }, alt: "Jane Doe" },
  coverArtwork: { asset: { _ref: "image-bbbb2222-1200x630-png" }, alt: "Cover art" },
  podbeanUrl: "https://www.podbean.com/e/ep12",
  audioUrl: "https://mcdn.podbean.com/mf/ep12.mp3",
  durationSeconds: 2400,
  publishedAt: "2026-01-15T00:00:00Z",
  searchText: "jane doe ai safety",
  slugFrozenAt: "2026-01-16T00:00:00Z",
};

/** The referenced topic documents, resolved by `dereference` below. */
const topicFixtures = [
  { _id: "topic-ai-safety", _type: "topic", name: "AI Safety" },
  { _id: "topic-product", _type: "topic", name: "Product" },
];

function dereference({ _ref }: { _ref: string }) {
  return topicFixtures.find((topic) => topic._id === _ref) ?? null;
}

describe("project(EPISODE_PROJECTION) evaluated by groq-js", () => {
  test("produces every projected key, correctly sourced, over a real GROQ evaluation", async () => {
    const fragment = project(EPISODE_PROJECTION);
    const tree = parse(fragment);
    // `dataset` must be an array (even empty) for groq-js's async evaluator to
    // consult the custom `dereference` function at all — see Deref.executeAsync
    // in groq-js, which short-circuits to null when `scope.source` isn't an
    // array, before ever checking `scope.context.dereference`.
    const value = await evaluate(tree, { root: episodeFixture, dataset: [], dereference });
    const result = (await value.get()) as Record<string, unknown>;

    expect(Object.keys(result).sort()).toEqual(Object.keys(EPISODE_PROJECTION).sort());

    // The Decision H non-swap, proven through the real evaluator rather than
    // the map's literals: the CTA URL and the audio URL come back distinct
    // and each equal to its own fixture field, not the other's.
    expect(result.podbeanUrl).toBe(episodeFixture.podbeanUrl);
    expect(result.audioUrl).toBe(episodeFixture.audioUrl);
    expect(result.podbeanUrl).not.toBe(result.audioUrl);

    expect(result._id).toBe(episodeFixture._id);
    expect(result.guid).toBe(episodeFixture.guid);
    expect(result.slug).toEqual(episodeFixture.slug);
    expect(result.episodeNumber).toBe(episodeFixture.episodeNumber);
    expect(result.title).toBe(episodeFixture.title);
    expect(result.description).toBe(episodeFixture.description);
    expect(result.excerpt).toBe(episodeFixture.excerpt);
    expect(result.guestName).toBe(episodeFixture.guestName);
    expect(result.guestBio).toBe(episodeFixture.guestBio);
    expect(result.durationSeconds).toBe(episodeFixture.durationSeconds);
    expect(result.publishedAt).toBe(episodeFixture.publishedAt);
    expect(result.searchText).toBe(episodeFixture.searchText);
    expect(result.slugFrozenAt).toBe(episodeFixture.slugFrozenAt);

    // Raw ref strings, not the whole image object — this is what would break
    // if `project()` quoted the dotted path instead of emitting it as GROQ.
    expect(result.guestPhoto).toBe(episodeFixture.guestPhoto.asset._ref);
    expect(result.coverArtwork).toBe(episodeFixture.coverArtwork.asset._ref);

    // Topics dereferenced to { _id, name }, in source order.
    expect(result.topics).toEqual([
      { _id: "topic-ai-safety", name: "AI Safety" },
      { _id: "topic-product", name: "Product" },
    ]);
  });

  test("would fail red if podbeanUrl and audioUrl were swapped in the map", async () => {
    // Not a test of production code — a demonstration that the harness above
    // actually catches the bug Decision H is about, using a deliberately
    // broken map inline.
    const swapped = { ...EPISODE_PROJECTION, podbeanUrl: "audioUrl", audioUrl: "podbeanUrl" };
    const tree = parse(project(swapped));
    const value = await evaluate(tree, { root: episodeFixture, dataset: [], dereference });
    const result = (await value.get()) as Record<string, unknown>;

    expect(result.podbeanUrl).toBe(episodeFixture.audioUrl);
    expect(result.audioUrl).toBe(episodeFixture.podbeanUrl);
    expect(result.podbeanUrl).not.toBe(episodeFixture.podbeanUrl);
  });

  test("would fail red if project() quoted a dotted GROQ path as a string literal", async () => {
    // Not a test of production code — a demonstration that the harness above
    // actually catches the Decision H (R4) bug in project() itself: quoting
    // the source instead of emitting it as GROQ path syntax.
    const quoted = `{"guestPhoto": "guestPhoto.asset._ref"}`;
    const tree = parse(quoted);
    const value = await evaluate(tree, { root: episodeFixture, dataset: [], dereference });
    const result = (await value.get()) as Record<string, unknown>;

    expect(result.guestPhoto).toBe("guestPhoto.asset._ref");
    expect(result.guestPhoto).not.toBe(episodeFixture.guestPhoto.asset._ref);
  });
});

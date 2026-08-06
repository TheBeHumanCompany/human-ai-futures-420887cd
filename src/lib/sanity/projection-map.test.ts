import { describe, expect, test } from "bun:test";
import { evaluate, parse } from "groq-js";

import { EPISODE_LIST_PROJECTION, EPISODE_PROJECTION, project } from "./projection-map";

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
      shareCard: "shareCard.asset._ref",
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
  shareCard: { asset: { _ref: "image-cccc3333-1200x630-png" } },
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

describe("EPISODE_LIST_PROJECTION", () => {
  /**
   * The exclusion set, pinned as a SET rather than as a list of assertions.
   *
   * The directory fetches the whole catalogue in one request, so every field
   * here is paid 39 times over — and, at the ceiling this design is bounded by,
   * hundreds of times. That makes an added field a payload decision rather than
   * a detail, and the failure mode is silent: nothing renders differently, the
   * response is just bigger, and the number nobody is watching moves.
   *
   * Comparing the derived set means a field added to `EPISODE_PROJECTION` and
   * mirrored here without thought goes red, and so does a field quietly dropped
   * from the exclusions.
   */
  const EXPECTED_EXCLUSIONS = [
    "_id",
    "description",
    "guestBio",
    "guestPhoto",
    "guid",
    "podbeanUrl",
    "searchText",
    "slugFrozenAt",
  ];

  test("excludes exactly the documented set, no more and no less", () => {
    const excluded = Object.keys(EPISODE_PROJECTION)
      .filter((alias) => !(alias in EPISODE_LIST_PROJECTION))
      .sort();

    expect(excluded).toEqual(EXPECTED_EXCLUSIONS);
  });

  test("is a strict subset of the full projection — it invents no field of its own", () => {
    // A field here that the detail projection does not have would mean two
    // sources of truth for the same document shape.
    const invented = Object.keys(EPISODE_LIST_PROJECTION).filter(
      (alias) => !(alias in EPISODE_PROJECTION),
    );
    expect(invented).toEqual([]);
  });

  test("shares the exact source path with the full projection for every field it keeps", () => {
    // The swap Decision H exists to prevent, in its second-most-likely form:
    // the two maps drifting so the list renders a different field than the
    // detail page does under the same alias.
    for (const [alias, source] of Object.entries(EPISODE_LIST_PROJECTION)) {
      expect(source).toBe(EPISODE_PROJECTION[alias as keyof typeof EPISODE_PROJECTION]);
    }
  });

  test("includes audioUrl, which the homepage player already depends on", () => {
    // Not a preference. `index.tsx` renders `<EpisodePlayer src={...audioUrl}>`
    // today, so dropping this breaks a surface that has nothing to do with the
    // directory.
    expect(EPISODE_LIST_PROJECTION).toHaveProperty("audioUrl", "audioUrl");
  });

  test("the generated fragment evaluates over a raw document, sourcing every alias", async () => {
    const tree = parse(project(EPISODE_LIST_PROJECTION));
    const value = await evaluate(tree, { root: episodeFixture, dataset: [], dereference });
    const result = (await value.get()) as Record<string, unknown>;

    expect(Object.keys(result).sort()).toEqual(Object.keys(EPISODE_LIST_PROJECTION).sort());
    // Values traced to their sources, not merely present — a fragment that
    // returned every key as null would satisfy the key check perfectly.
    expect(result.title).toBe(episodeFixture.title);
    expect(result.audioUrl).toBe(episodeFixture.audioUrl);
    expect(result.coverArtwork).toBe(episodeFixture.coverArtwork.asset._ref);
    expect(result.shareCard).toBe(episodeFixture.shareCard.asset._ref);
  });

  test("the excluded fields are genuinely absent from the evaluated output", async () => {
    // The exclusion asserted where it actually matters — in the bytes that come
    // back — rather than only in the map the fragment was built from.
    const tree = parse(project(EPISODE_LIST_PROJECTION));
    const value = await evaluate(tree, { root: episodeFixture, dataset: [], dereference });
    const result = (await value.get()) as Record<string, unknown>;

    for (const alias of EXPECTED_EXCLUSIONS) {
      expect(result).not.toHaveProperty(alias);
    }
  });
});

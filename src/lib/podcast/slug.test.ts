import { describe, expect, test } from "bun:test";

import { clearEpisodeCache, loadEpisodes } from "../podbean/feed";
import { parseGuest } from "../podbean/parse";
import { makeEpisodeSlug } from "./slug";

const RUN_LIVE_TESTS = !!process.env.RUN_LIVE_TESTS;

const NONE: ReadonlySet<string> = new Set();

/** Episode 39's slug, reused as the base by every collision case below. */
const EPISODE_39_TITLE =
  "Episode 39: Leading with Heart: Jill De Chavez on Building a People-First Business";
const EPISODE_39_BASE = "jill-de-chavez-leading-heart-building-people-first-business";
/**
 * `EPISODE_39_BASE` is 59 chars, one short of the 60-char ceiling, so any
 * suffix appended to it must re-truncate the base first; this is what it
 * re-truncates to (dropping the trailing "-business").
 */
const EPISODE_39_TRUNCATED_BASE = "jill-de-chavez-leading-heart-building-people-first";

/** Episode 77's slug sits 58 chars from a 60-char base, close to the ceiling. */
const EPISODE_77_TITLE =
  "Episode 77: Rebuilding Regenerative Agricultural Supply Networks Across Northern Communities with Alexandra Dean";
const EPISODE_77_BASE = "alexandra-dean-rebuilding-regenerative-agricultural-supply";

describe("makeEpisodeSlug", () => {
  test("puts the guest first and drops stopwords from the remaining title keywords", () => {
    const slug = makeEpisodeSlug(EPISODE_39_TITLE, 39, NONE);

    expect(slug).toBe(EPISODE_39_BASE);
    expect(slug.startsWith("jill-de-chavez-")).toBe(true);
    expect(slug.length).toBeLessThanOrEqual(60);
    for (const stopword of ["-with-", "-on-", "-a-"]) {
      expect(slug).not.toContain(stopword);
    }
  });

  test("keeps the distinctive keywords of a 'with <guest>' title", () => {
    const slug = makeEpisodeSlug(
      "Episode 2: From Lululemon to Launching a Sustainable Brand with Alexandra Dean",
      2,
      NONE,
    );

    expect(slug).toBe("alexandra-dean-lululemon-launching-sustainable-brand");
    expect(slug.startsWith("alexandra-dean-")).toBe(true);
    for (const keyword of ["lululemon", "sustainable", "brand"]) {
      expect(slug).toContain(keyword);
    }
    for (const stopword of ["-from-", "-to-", "-with-"]) {
      expect(slug).not.toContain(stopword);
    }
  });

  test("keeps the distinctive keywords of a 'How <guest> Creates' title", () => {
    const slug = makeEpisodeSlug(
      "Episode 31: From Passion to Impact: How Glyn Lewis Creates Community",
      31,
      NONE,
    );

    expect(slug).toBe("glyn-lewis-passion-impact-creates-community");
    expect(slug.startsWith("glyn-lewis-")).toBe(true);
    for (const keyword of ["passion", "impact", "creates", "community"]) {
      expect(slug).toContain(keyword);
    }
    for (const stopword of ["-from-", "-to-", "-how-"]) {
      expect(slug).not.toContain(stopword);
    }
  });

  test("falls back to the whole title when no guest can be parsed", () => {
    // Episode 6 names no person at all, so `parseGuest` declines — pinned in
    // `podbean/parse.test.ts` and re-asserted here because the fallback branch
    // is only meaningful if this input really does have no guest.
    const title = "Episode 6: Minting Success: The Story of Plant-Based Cleaning Revolutionaries";
    expect(parseGuest(title)).toBeUndefined();

    // Built purely from the prefix-stripped title: nothing is prepended, and
    // the leading token is the title's own first surviving keyword.
    expect(makeEpisodeSlug(title, 6, NONE)).toBe(
      "minting-success-story-plant-based-cleaning-revolutionaries",
    );
  });

  test("caps a long slug at 60 characters, on a word boundary", () => {
    const slug = makeEpisodeSlug(
      "Episode 77: Rebuilding Regenerative Agricultural Supply Networks Across Northern Communities with Alexandra Dean",
      77,
      NONE,
    );

    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-")).toBe(false);
    // The ceiling is really enforced, not silently skipped: "rebuilding"
    // survives while the later "communities" is cut away entirely.
    expect(slug).toContain("rebuilding");
    expect(slug).not.toContain("communities");
  });

  test("appends the episode number when the base slug is taken", () => {
    const slug = makeEpisodeSlug(EPISODE_39_TITLE, 39, new Set([EPISODE_39_BASE]));

    expect(slug).toBe(`${EPISODE_39_TRUNCATED_BASE}-39`);
    expect(slug.length).toBeLessThanOrEqual(60);
  });

  test("falls through to -2 when the numbered slug is taken as well", () => {
    const slug = makeEpisodeSlug(
      EPISODE_39_TITLE,
      39,
      new Set([EPISODE_39_BASE, `${EPISODE_39_TRUNCATED_BASE}-39`]),
    );

    expect(slug).toBe(`${EPISODE_39_TRUNCATED_BASE}-2`);
  });

  test("keeps incrementing past -2 and -3", () => {
    const slug = makeEpisodeSlug(
      EPISODE_39_TITLE,
      39,
      new Set([
        EPISODE_39_BASE,
        `${EPISODE_39_TRUNCATED_BASE}-39`,
        `${EPISODE_39_TRUNCATED_BASE}-2`,
        `${EPISODE_39_TRUNCATED_BASE}-3`,
      ]),
    );

    expect(slug).toBe(`${EPISODE_39_TRUNCATED_BASE}-4`);
  });

  test("skips straight to the counter when there is no episode number", () => {
    const slug = makeEpisodeSlug(EPISODE_39_TITLE, null, new Set([EPISODE_39_BASE]));

    expect(slug).toBe(`${EPISODE_39_TRUNCATED_BASE}-2`);
    expect(slug).not.toContain("null");
  });

  test("re-truncates the base when a near-ceiling base collides and needs an episode-number suffix", () => {
    // EPISODE_77_BASE is already 58 chars; appending "-77" untruncated would be
    // 61 chars, over the 60-char ceiling, so the base must be re-capped first.
    const slug = makeEpisodeSlug(EPISODE_77_TITLE, 77, new Set([EPISODE_77_BASE]));

    expect(slug).toBe("alexandra-dean-rebuilding-regenerative-agricultural-77");
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.startsWith("alexandra-dean-")).toBe(true);
    expect(slug.endsWith("-")).toBe(false);
  });

  test("re-truncates the base when a near-ceiling base falls through to the -2 counter", () => {
    const numbered = "alexandra-dean-rebuilding-regenerative-agricultural-77";
    const slug = makeEpisodeSlug(EPISODE_77_TITLE, 77, new Set([EPISODE_77_BASE, numbered]));

    expect(slug).toBe(`${EPISODE_77_BASE}-2`);
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith("-2")).toBe(true);
  });
});

describe.skipIf(!RUN_LIVE_TESTS)("makeEpisodeSlug against the live PodBean feed", () => {
  test("every real, live episode gets a distinct, well-formed slug", async () => {
    clearEpisodeCache();
    const episodes = await loadEpisodes();
    expect(episodes.length).toBeGreaterThan(0);

    // Processed newest-first, i.e. the feed's own array order per `parseFeed`.
    // Each generated slug feeds the next call's `existingSlugs`, so an earlier
    // (newer) episode keeps the unsuffixed slug on a collision.
    const taken = new Set<string>();
    const slugs = episodes.map((episode) => {
      const slug = makeEpisodeSlug(episode.title, episode.episodeNumber, taken);
      taken.add(slug);
      return slug;
    });

    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug.length).toBeGreaterThan(0);
      expect(slug.length).toBeLessThanOrEqual(60);
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    }
  }, 30_000);
});

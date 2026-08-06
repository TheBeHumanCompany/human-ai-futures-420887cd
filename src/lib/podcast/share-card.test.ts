import { describe, expect, test } from "bun:test";

import catalogue from "./catalogue.snapshot.json";
import {
  TITLE_BUDGET,
  buildShareCardModel,
  shareCardKey,
  type ShareCardEpisode,
} from "./share-card";

/**
 * The card's content model.
 *
 * Driven by the committed catalogue wherever a real value exists, because the
 * interesting cases here are facts about the corpus — the longest title, the
 * two episodes with no guest — and inventing them would test the fixture rather
 * than the archive.
 */

function episode(overrides: Partial<ShareCardEpisode> = {}): ShareCardEpisode {
  return {
    title: "Episode 5: Building Cheekbone Beauty",
    guestName: "Jenn Harper",
    episodeNumber: 5,
    ...overrides,
  };
}

describe("the episode number is lifted out of the title", () => {
  test("the prefix is stripped and rendered as its own label", () => {
    const model = buildShareCardModel(episode());
    expect(model.title).toBe("Building Cheekbone Beauty");
    expect(model.episodeLabel).toBe("Episode 5");
  });

  test("a title with no prefix is left alone", () => {
    const model = buildShareCardModel(episode({ title: "The Story So Far" }));
    expect(model.title).toBe("The Story So Far");
  });

  test("an episode with no number gets no label rather than 'Episode null'", () => {
    expect(buildShareCardModel(episode({ episodeNumber: null })).episodeLabel).toBeNull();
  });
});

describe("the guest line", () => {
  test("reads naturally when there is a guest", () => {
    expect(buildShareCardModel(episode()).guestLine).toBe("with Jenn Harper");
  });

  test("is NULL, not an empty string, when there is no guest", () => {
    // An empty string is still a line the renderer lays out — it would leave a
    // gap where a name should be. Two of the thirty-nine are really like this.
    expect(buildShareCardModel(episode({ guestName: null })).guestLine).toBeNull();
  });
});

describe("title truncation", () => {
  test("the longest real title in the catalogue fits without truncation", () => {
    // The budget exists to serve the real archive, so the archive is what
    // proves it. If a future title exceeds this, the row goes red and the
    // budget becomes a decision rather than an accident.
    const longest = catalogue.episodes.reduce((champion, candidate) =>
      candidate.title.length > champion.title.length ? candidate : champion,
    );

    const model = buildShareCardModel({
      title: longest.title,
      guestName: longest.guestName,
      episodeNumber: longest.episodeNumber,
    });

    expect(model.title).not.toContain("…");
    expect(model.title.length).toBeLessThanOrEqual(TITLE_BUDGET);
    // Floor: proves we measured a genuinely long title rather than an empty one.
    expect(model.title.length).toBeGreaterThan(90);
  });

  test("every title in the catalogue fits", () => {
    const truncated = catalogue.episodes.filter((entry) =>
      buildShareCardModel({
        title: entry.title,
        guestName: entry.guestName,
        episodeNumber: entry.episodeNumber,
      }).title.includes("…"),
    );

    expect(truncated).toEqual([]);
    expect(catalogue.episodes.length).toBeGreaterThanOrEqual(39);
  });

  test("an over-long title truncates on a WORD boundary, not mid-word", () => {
    const model = buildShareCardModel(episode({ title: `${"Leadership ".repeat(20)}and Culture` }));

    expect(model.title.length).toBeLessThanOrEqual(TITLE_BUDGET);
    // The cut lands between words: no partial token before the ellipsis.
    expect(model.title).not.toMatch(/[A-Za-z]…$/);
  });
});

describe("shareCardKey", () => {
  test("is stable across runs for the same content", () => {
    expect(shareCardKey(episode())).toBe(shareCardKey(episode()));
  });

  test("changes when the title changes", () => {
    expect(shareCardKey(episode())).not.toBe(
      shareCardKey(episode({ title: "Episode 5: Building Cheekbone Beauty, Revisited" })),
    );
  });

  test("changes when the guest changes", () => {
    expect(shareCardKey(episode())).not.toBe(shareCardKey(episode({ guestName: "Someone Else" })));
  });

  test("changes when the episode number changes", () => {
    expect(shareCardKey(episode())).not.toBe(shareCardKey(episode({ episodeNumber: 6 })));
  });

  test("distinguishes a field boundary shift, which an unseparated hash would not", () => {
    // {title:"ab", guest:"c"} vs {title:"a", guest:"bc"} — the same characters
    // in the same order, split differently. Without a separator these collide.
    expect(shareCardKey(episode({ title: "ab", guestName: "c", episodeNumber: null }))).not.toBe(
      shareCardKey(episode({ title: "a", guestName: "bc", episodeNumber: null })),
    );
  });

  test("is distinct across all 39 real episodes", () => {
    // A hash that collided across the real corpus would make staleness
    // undetectable for the colliding pair.
    const keys = catalogue.episodes.map((entry) =>
      shareCardKey({
        title: entry.title,
        guestName: entry.guestName,
        episodeNumber: entry.episodeNumber,
      }),
    );

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.length).toBeGreaterThanOrEqual(39);
  });

  test("is a short, stable hex string", () => {
    expect(shareCardKey(episode())).toMatch(/^[0-9a-f]{8}$/);
  });
});

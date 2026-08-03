import { beforeAll, describe, expect, test } from "bun:test";

import { PODBEAN_FEED_URL, clearEpisodeCache, loadEpisodes } from "./feed";
import { parseGuest, selectFeatured } from "./parse";
import type { Episode } from "./types";

/**
 * Live-network evaluator.
 *
 * This deliberately hits the real PodBean feed: the point is to catch a feed
 * shape change or a pulled episode, which a fixture cannot. The tradeoff is
 * that a PodBean outage fails this suite on an unrelated commit.
 */
describe("live PodBean feed", () => {
  let episodes: Episode[] = [];

  beforeAll(async () => {
    clearEpisodeCache();
    episodes = await loadEpisodes();
  }, 30_000);

  test("A1 — parses the catalogue", () => {
    expect(episodes.length).toBeGreaterThanOrEqual(35);
  });

  test("A2 — every episode is complete", () => {
    for (const episode of episodes) {
      expect(episode.guid.length).toBeGreaterThan(0);
      expect(episode.title.length).toBeGreaterThan(0);
      expect(episode.durationSeconds).toBeGreaterThan(0);
      expect(Number.isNaN(new Date(episode.pubDate).getTime())).toBe(false);
    }
  });

  test("A3 — every audio URL is https on PodBean's CDN", () => {
    for (const episode of episodes) {
      expect(episode.audioUrl).toStartWith("https://mcdn.podbean.com/");
    }
  });

  test("A4 — enclosures are reachable and are audio", async () => {
    const sample = [episodes[0], episodes[Math.floor(episodes.length / 2)]].filter(Boolean);
    for (const episode of sample) {
      const response = await fetch(episode.audioUrl, { method: "HEAD" });
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type") ?? "").toStartWith("audio/");
    }
  }, 30_000);

  test("A5 — ordered newest first", () => {
    const times = episodes.map((e) => new Date(e.pubDate).getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
    expect(episodes.at(0)?.episodeNumber).toBeGreaterThan(episodes.at(-1)!.episodeNumber!);
  });

  test("A6 — homepage takes exactly the three newest", () => {
    const featured = selectFeatured(episodes);
    expect(featured).toHaveLength(3);
    expect(featured).toEqual(episodes.slice(0, 3));
  });

  test("A7 — guest parsing holds against the real catalogue", () => {
    const byNumber = (n: number) => episodes.find((e) => e.episodeNumber === n);

    expect(byNumber(39)?.guest).toBe("Jill De Chavez");
    expect(byNumber(30)?.guest).toBe("Maria Porcellato");
    expect(byNumber(5)?.guest).toBe("Jenn Harper");
    expect(byNumber(18)?.guest).toBe("Linda Biggs");

    // The hazard cases: a brand must never be rendered as a person.
    expect(byNumber(15)?.guest).toBe("Joao Ribeiro");
    expect(byNumber(4)?.guest).toBe("Elizabeth Fisher");
    expect(byNumber(6)?.guest).toBeUndefined();
    expect(byNumber(1)?.guest).toBeUndefined();

    const resolved = episodes.filter((e) => e.guest).length;
    expect(resolved).toBeGreaterThanOrEqual(35);
  });

  test("no parsed guest is a known brand string", () => {
    const brands = ["Elements Brazil", "Lavva Cultured", "Plant-Based Cleaning"];
    for (const episode of episodes) {
      for (const brand of brands) expect(episode.guest ?? "").not.toContain(brand);
    }
  });

  test("the feed URL requires no credentials", async () => {
    const response = await fetch(PODBEAN_FEED_URL, { method: "HEAD" });
    expect(response.status).toBe(200);
  }, 30_000);
});

describe("resilience", () => {
  test("parseGuest never throws on adversarial titles", () => {
    for (const title of ["", "   ", "Episode", "!!!", "Episode 1:", "a".repeat(5000)]) {
      expect(() => parseGuest(title)).not.toThrow();
    }
  });
});

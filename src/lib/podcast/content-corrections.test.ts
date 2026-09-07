import { describe, expect, test } from "bun:test";

import { withContentCorrections } from "./content-corrections";
import type { SanityEpisode } from "./episode";

const baseEpisode: SanityEpisode = {
  _id: "episode-mint",
  guid: "guid-mint",
  slug: { current: "minting-success-story-plant-based-cleaning-revolutionaries" },
  episodeNumber: 6,
  title: "Episode 6: Minting Success: The Story of Plant-Based Cleaning Revolutionaries",
  description:
    "In this episode, meet Monica and Robin, the dynamic founders of Minta, a groundbreaking plant-based cleaning products brand.",
  excerpt: "Monica and Robin, the dynamic founders of Minta, share their journey.",
  topics: null,
  guestName: null,
  guestBio: null,
  guestPhoto: null,
  coverArtwork: null,
  podbeanUrl: "https://example.com/e/mint/",
  audioUrl: "https://example.com/mint.mp3",
  durationSeconds: 3000,
  publishedAt: "2025-01-01T00:00:00.000Z",
  searchText: "mint cleaning",
  slugFrozenAt: null,
};

describe("withContentCorrections", () => {
  test("returns the same episode when the slug does not match a correction", () => {
    const other = { ...baseEpisode, slug: { current: "some-other-episode" } };
    expect(withContentCorrections(other)).toBe(other);
  });

  test("corrects the Mint Cleaning founders' names", () => {
    const corrected = withContentCorrections(baseEpisode);

    expect(corrected.description).toContain("Monika Scott and Robyn Hodas");
    expect(corrected.description).not.toContain("Monica and Robin");
    expect(corrected.description).not.toContain("Monica");
    expect(corrected.description).not.toContain("Robin");
  });

  test("corrects the company name without touching the title pun", () => {
    const corrected = withContentCorrections(baseEpisode);

    expect(corrected.description).toContain("Mint Cleaning");
    expect(corrected.description).not.toContain("Minta");
    expect(corrected.title).toBe(baseEpisode.title);
  });

  test("corrects the excerpt for SEO consistency", () => {
    const corrected = withContentCorrections(baseEpisode);

    expect(corrected.excerpt).toContain("Monika Scott and Robyn Hodas");
    expect(corrected.excerpt).toContain("Mint Cleaning");
  });
});

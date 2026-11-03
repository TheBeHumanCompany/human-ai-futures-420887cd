import { describe, expect, test } from "bun:test";

import { guestLinks, platformOf } from "./guest-links";
import type { SanityEpisode } from "./episode";

const baseEpisode: SanityEpisode = {
  _id: "episode-annie",
  guid: "guid-annie",
  slug: { current: "annie-leal-i-love-chamoy" },
  episodeNumber: 71,
  title: "Episode #71: Building I Love Chamoy",
  description: "Annie Leal on family, culture and scaling with purpose.",
  excerpt: "Annie Leal, Founder and CEO of I Love Chamoy.",
  topics: null,
  guestName: "Annie Leal",
  guestBio: "Annie Leal is the Founder and CEO of I Love Chamoy.",
  businessWebsiteUrl: null,
  guestInstagramUrl: null,
  companyInstagramUrl: null,
  facebookUrl: null,
  guestLinkedinUrl: null,
  companyLinkedinUrl: null,
  guestPhoto: null,
  coverArtwork: null,
  podbeanUrl: "https://example.com/e/annie/",
  audioUrl: "https://example.com/annie.mp3",
  durationSeconds: 3891,
  publishedAt: "2026-11-03T03:39:10.000Z",
  searchText: "annie leal i love chamoy",
  slugFrozenAt: null,
};

const labelOf = (hrefFragment: string, links: { label: string; href: string }[]) =>
  links.find((link) => link.href.includes(hrefFragment))?.label;

describe("platformOf", () => {
  test("reads the network off the address", () => {
    expect(platformOf("https://www.tiktok.com/@shopilovechamoy")).toBe("TikTok");
    expect(platformOf("https://www.instagram.com/shopilovechamoy/")).toBe("Instagram");
    expect(platformOf("https://www.linkedin.com/in/annieleal/")).toBe("LinkedIn");
    expect(platformOf("https://ilovechamoy.com/")).toBeNull();
  });
});

describe("guestLinks", () => {
  test("names a link after the network its address is on, not the field it came from", () => {
    const episode: SanityEpisode = {
      ...baseEpisode,
      guestInstagramUrl: "https://www.tiktok.com/@shopilovechamoy",
    };

    expect(labelOf("tiktok.com", guestLinks(episode, undefined))).toBe("Annie on TikTok");
  });

  test("still says Instagram when the address is an Instagram address", () => {
    const episode: SanityEpisode = {
      ...baseEpisode,
      guestInstagramUrl: "https://www.instagram.com/annieleal/",
    };

    expect(labelOf("instagram.com", guestLinks(episode, undefined))).toBe("Annie on Instagram");
  });

  test("names a company link after the business when one is on file", () => {
    const episode: SanityEpisode = {
      ...baseEpisode,
      companyInstagramUrl: "https://www.tiktok.com/@shopilovechamoy",
    };

    expect(labelOf("tiktok.com", guestLinks(episode, "I Love Chamoy"))).toBe(
      "I Love Chamoy on TikTok",
    );
  });

  test("drops a personal link that repeats the company account", () => {
    const episode: SanityEpisode = {
      ...baseEpisode,
      guestInstagramUrl: "https://www.instagram.com/shopilovechamoy/",
      companyInstagramUrl: "https://instagram.com/shopilovechamoy",
    };

    const links = guestLinks(episode, undefined);
    const instagramLinks = links.filter((link) => link.href.includes("instagram"));

    expect(instagramLinks).toHaveLength(1);
    expect(instagramLinks[0].label).toBe("Company Instagram");
  });

  test("keeps both links when the personal and company accounts differ", () => {
    const episode: SanityEpisode = {
      ...baseEpisode,
      guestInstagramUrl: "https://www.instagram.com/annieleal/",
      companyInstagramUrl: "https://www.instagram.com/shopilovechamoy/",
    };

    const labels = guestLinks(episode, undefined).map((link) => link.label);
    expect(labels).toContain("Annie on Instagram");
    expect(labels).toContain("Company Instagram");
  });

  test("produces no links when no field is filled", () => {
    expect(guestLinks(baseEpisode, undefined)).toEqual([]);
  });
});

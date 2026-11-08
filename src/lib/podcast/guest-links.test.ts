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
  companyName: null,
  businessWebsiteUrl: null,
  guestInstagramUrl: null,
  companyInstagramUrl: null,
  facebookUrl: null,
  guestLinkedinUrl: null,
  companyLinkedinUrl: null,
  books: null,
  customLinks: null,
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
    expect(instagramLinks[0].label).toBe("@shopilovechamoy on Instagram");
  });

  test("names a personal field after the company when it carries the company's handle on another network", () => {
    const episode: SanityEpisode = {
      ...baseEpisode,
      guestInstagramUrl: "https://www.tiktok.com/@shopilovechamoy",
      companyInstagramUrl: "https://www.instagram.com/shopilovechamoy/",
    };

    const links = guestLinks(episode, "I Love Chamoy");
    expect(labelOf("tiktok.com", links)).toBe("I Love Chamoy on TikTok");
    expect(labelOf("instagram.com", links)).toBe("I Love Chamoy on Instagram");
  });

  test("matches a company handle across networks despite underscores", () => {
    const episode: SanityEpisode = {
      ...baseEpisode,
      guestInstagramUrl: "https://www.tiktok.com/@skipper_otto",
      companyInstagramUrl: "https://www.instagram.com/skipperotto/",
    };

    const links = guestLinks(episode, "Skipper Otto");
    expect(labelOf("tiktok.com", links)).toBe("Skipper Otto on TikTok");
    expect(labelOf("instagram.com", links)).toBe("Skipper Otto on Instagram");
  });

  test("keeps both links when the personal and company accounts differ", () => {
    const episode: SanityEpisode = {
      ...baseEpisode,
      guestInstagramUrl: "https://www.instagram.com/annieleal/",
      companyInstagramUrl: "https://www.instagram.com/shopilovechamoy/",
    };

    const labels = guestLinks(episode, undefined).map((link) => link.label);
    expect(labels).toContain("Annie on Instagram");
    expect(labels).toContain("@shopilovechamoy on Instagram");
  });

  test("produces no links when no field is filled", () => {
    expect(guestLinks(baseEpisode, undefined)).toEqual([]);
  });

  test("names a plain website in a social field after its domain, not a network", () => {
    // Episode 76: the guest Instagram field holds https://www.vetmeds.ca/.
    const episode: SanityEpisode = {
      ...baseEpisode,
      guestName: "Adam Silvertown",
      guestInstagramUrl: "https://www.vetmeds.ca/",
    };

    expect(labelOf("vetmeds.ca", guestLinks(episode, "Pace Pharmacy"))).toBe("Visit vetmeds.ca");
  });

  test("names an Instagram address in the Facebook field after Instagram, never Facebook", () => {
    // Episode 76: the Facebook field holds instagram.com/vetmedspharmacy —
    // a second business's account, so it keeps its own handle, not the
    // primary company's name.
    const episode: SanityEpisode = {
      ...baseEpisode,
      guestName: "Adam Silvertown",
      companyInstagramUrl: "https://www.instagram.com/pacepharmacy/",
      facebookUrl: "https://www.instagram.com/vetmedspharmacy",
    };

    const links = guestLinks(episode, "Pace Pharmacy");
    expect(labelOf("vetmedspharmacy", links)).toBe("@vetmedspharmacy on Instagram");
    expect(labelOf("pacepharmacy", links)).toBe("Pace Pharmacy on Instagram");
    expect(links.map((link) => link.label)).not.toContain("Facebook");
  });

  test("names the company Facebook after the company when the account is theirs", () => {
    const episode: SanityEpisode = {
      ...baseEpisode,
      companyInstagramUrl: "https://www.instagram.com/shopilovechamoy/",
      facebookUrl: "https://www.facebook.com/shopilovechamoy",
    };

    expect(labelOf("facebook.com", guestLinks(episode, "I Love Chamoy"))).toBe(
      "I Love Chamoy on Facebook",
    );
  });

  test("names the business website after its domain when no company name is on file", () => {
    const episode: SanityEpisode = {
      ...baseEpisode,
      businessWebsiteUrl: "https://www.pacepharmacy.com/",
    };

    expect(labelOf("pacepharmacy.com", guestLinks(episode, undefined))).toBe(
      "Visit pacepharmacy.com",
    );
  });

  test("renders each book as its own link, titled from Sanity", () => {
    const episode: SanityEpisode = {
      ...baseEpisode,
      books: [
        { title: "The Long Way Home", url: "https://example.com/long-way-home", subtitle: null, displayLabel: null, coverImage: null },
        { title: "Second Book", url: "https://example.com/second", subtitle: null, displayLabel: "Get Second Book", coverImage: null },
      ],
    };

    const links = guestLinks(episode, undefined);
    expect(labelOf("long-way-home", links)).toBe("Explore The Long Way Home");
    expect(labelOf("second", links)).toBe("Get Second Book");
  });

  test("shows a custom link's label exactly as authored", () => {
    const episode: SanityEpisode = {
      ...baseEpisode,
      customLinks: [{ label: "Visit VetMeds", url: "https://www.vetmeds.ca/" }],
    };

    expect(labelOf("vetmeds.ca", guestLinks(episode, undefined))).toBe("Visit VetMeds");
  });

  test("never lists the same destination twice", () => {
    const episode: SanityEpisode = {
      ...baseEpisode,
      businessWebsiteUrl: "https://www.vetmeds.ca/",
      customLinks: [{ label: "Visit VetMeds", url: "https://vetmeds.ca" }],
    };

    const links = guestLinks(episode, undefined);
    expect(links.filter((link) => link.href.includes("vetmeds.ca"))).toHaveLength(1);
  });

  test("names an account from the profile's account list, ahead of the guest's name", () => {
    const episode: SanityEpisode = {
      ...baseEpisode,
      guestInstagramUrl: "https://www.instagram.com/lakecitycider/",
    };

    expect(
      labelOf(
        "instagram.com/lakecitycider",
        guestLinks(episode, undefined, { "instagram.com/lakecitycider": "Lake City Cider" }),
      ),
    ).toBe("Lake City Cider on Instagram");
  });

  test("an account name outranks the episode's business name", () => {
    const episode: SanityEpisode = {
      ...baseEpisode,
      guestInstagramUrl: "https://www.instagram.com/lakecitycider/",
    };

    expect(
      labelOf(
        "instagram.com/lakecitycider",
        guestLinks(episode, "I Love Chamoy", { "instagram.com/lakecitycider": "Lake City Cider" }),
      ),
    ).toBe("Lake City Cider on Instagram");
  });

  test("names one account on a two-brand episode without touching the rest", () => {
    // Episode 78 as authored in Sanity: two brands interleaved across the
    // fields, Lake City Cider's Instagram sitting in the guest's own field.
    const episode: SanityEpisode = {
      ...baseEpisode,
      episodeNumber: 78,
      guestName: "Poet Comeau",
      businessWebsiteUrl: "https://lakecitycider.ca/",
      guestInstagramUrl: "https://www.instagram.com/lakecitycider/",
      companyInstagramUrl: "https://www.dartybrewing.ca/",
      facebookUrl: "https://www.instagram.com/dartybrewing/",
      guestLinkedinUrl: "https://www.facebook.com/dartybrewing/",
      companyLinkedinUrl: "https://ca.linkedin.com/company/lake-city-cider",
    };

    const links = guestLinks(episode, undefined, {
      "instagram.com/lakecitycider": "Lake City Cider",
    });

    expect(links).toEqual([
      { label: "Visit lakecitycider.ca", href: "https://lakecitycider.ca/" },
      {
        label: "Lake City Cider on Instagram",
        href: "https://www.instagram.com/lakecitycider/",
      },
      { label: "Visit dartybrewing.ca", href: "https://www.dartybrewing.ca/" },
      { label: "@dartybrewing on Instagram", href: "https://www.instagram.com/dartybrewing/" },
      { label: "@dartybrewing on Facebook", href: "https://www.facebook.com/dartybrewing/" },
      {
        label: "@lake-city-cider on LinkedIn",
        href: "https://ca.linkedin.com/company/lake-city-cider",
      },
    ]);
  });
});

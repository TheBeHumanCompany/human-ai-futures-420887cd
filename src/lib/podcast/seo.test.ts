import { describe, expect, test } from "bun:test";

import { SITE_ORIGIN, episodeUrl } from "../sanity/config";
import {
  DEFAULT_SHARE_IMAGE_PATH,
  SERIES_NAME,
  buildEpisodeJsonLd,
  buildEpisodeMeta,
  episodeTitle,
  shareImageUrl,
  type SeoEpisode,
} from "./seo";

/**
 * What a shared link renders.
 *
 * The rows that matter most here are the ones with LESS data, not more: two of
 * the thirty-nine episodes have no parsed guest, and every episode today has no
 * artwork at all. Those are the real shapes, so they are the ones asserted
 * rather than the fully-populated ideal.
 */

/**
 * A Sanity asset ref is a fixed shape; these are real-shaped, not placeholders.
 *
 * Assertions below match on the HASH rather than the whole ref, because
 * `imageUrl` rewrites `image-<hash>-<dims>-<ext>` into a CDN path of the form
 * `<hash>-<dims>.<ext>` — the ref itself never appears in the output.
 */
const COVER_HASH = "c".repeat(40);
const CARD_HASH = "d".repeat(40);
const COVER_REF = `image-${COVER_HASH}-3000x3000-jpg`;
const CARD_REF = `image-${CARD_HASH}-1200x630-png`;

function episode(overrides: Partial<SeoEpisode> = {}): SeoEpisode {
  return {
    slug: { current: "jenn-harper-cheekbone-beauty" },
    title: "Building Cheekbone Beauty",
    excerpt: "An Indigenous-owned cosmetics company built on giving back.",
    episodeNumber: 5,
    guestName: "Jenn Harper",
    coverArtwork: null,
    shareCard: null,
    audioUrl: "https://mcdn.podbean.com/a.mp3",
    publishedAt: "2025-02-01T00:00:00.000Z",
    durationSeconds: 3000,
    ...overrides,
  };
}

/* ------------------------------------------------- the precedence chain -- */

describe("shareImageUrl precedence", () => {
  test("real coverArtwork wins when both it and a generated card exist", () => {
    const url = shareImageUrl(episode({ coverArtwork: COVER_REF, shareCard: CARD_REF }));
    expect(url).toContain(COVER_HASH);
    expect(url).not.toContain(CARD_HASH);
  });

  test("coverArtwork alone is used", () => {
    expect(shareImageUrl(episode({ coverArtwork: COVER_REF }))).toContain(COVER_HASH);
  });

  test("the generated card is used when there is no real artwork", () => {
    const url = shareImageUrl(episode({ coverArtwork: null, shareCard: CARD_REF }));
    expect(url).toContain(CARD_HASH);
  });

  test("neither present falls to the branded default — the real shape of all 39 today", () => {
    const url = shareImageUrl(episode({ coverArtwork: null, shareCard: null }));
    expect(url).toBe(`${SITE_ORIGIN}${DEFAULT_SHARE_IMAGE_PATH}`);
  });

  test("an absent shareCard field behaves as absent, not as an error", () => {
    // `shareCard` is generated and does not exist on the schema yet, so the
    // undefined case is the live one rather than a hypothetical.
    const { shareCard: _unused, ...withoutField } = episode();
    expect(shareImageUrl(withoutField as SeoEpisode)).toBe(
      `${SITE_ORIGIN}${DEFAULT_SHARE_IMAGE_PATH}`,
    );
  });

  test("every branch returns an ABSOLUTE url", () => {
    // A relative og:image is the classic silent failure: the page looks fine and
    // the crawler resolves nothing.
    const cases = [
      episode({ coverArtwork: COVER_REF }),
      episode({ shareCard: CARD_REF }),
      episode(),
    ];
    for (const candidate of cases) {
      expect(shareImageUrl(candidate)).toMatch(/^https:\/\//);
    }
  });
});

/* --------------------------------------------------------------- titles -- */

describe("episodeTitle", () => {
  test("includes the guest when there is one", () => {
    expect(episodeTitle(episode())).toBe(
      `Building Cheekbone Beauty — Jenn Harper | ${SERIES_NAME}`,
    );
  });

  test("omits the guest entirely when there is none — no dangling separator", () => {
    // Episodes 1 and 6 are really like this. A naive template emits a trailing
    // "with " and nobody notices until it is on LinkedIn.
    const title = episodeTitle(episode({ title: "The Story So Far", guestName: null }));
    expect(title).toBe(`The Story So Far | ${SERIES_NAME}`);
    expect(title).not.toContain("—");
    expect(title).not.toMatch(/(with|—)\s*\|/);
  });
});

/* ----------------------------------------------------------------- meta -- */

describe("buildEpisodeMeta", () => {
  const meta = buildEpisodeMeta(episode());
  const find = (predicate: (tag: Record<string, string>) => boolean) => meta.meta.find(predicate);

  test("canonical is a LINK equal to episodeUrl, not a meta tag", () => {
    expect(meta.links).toEqual([
      { rel: "canonical", href: episodeUrl("jenn-harper-cheekbone-beauty") },
    ]);
    expect(find((tag) => tag.rel === "canonical")).toBeUndefined();
  });

  test("emits the six Open Graph tags", () => {
    for (const property of [
      "og:type",
      "og:title",
      "og:description",
      "og:url",
      "og:image",
      "og:site_name",
    ]) {
      expect(find((tag) => tag.property === property)).toBeDefined();
    }
  });

  test("emits the Twitter card tags, using the large-image variant", () => {
    expect(find((tag) => tag.name === "twitter:card")?.content).toBe("summary_large_image");
    for (const name of ["twitter:title", "twitter:description", "twitter:image"]) {
      expect(find((tag) => tag.name === name)).toBeDefined();
    }
  });

  test("every emitted URL is absolute", () => {
    const urlTags = meta.meta.filter(
      (tag) =>
        tag.property === "og:url" || tag.property === "og:image" || tag.name === "twitter:image",
    );
    // Floor: proves we actually found URL tags rather than filtering to nothing.
    expect(urlTags.length).toBe(3);
    for (const tag of urlTags) expect(tag.content).toMatch(/^https:\/\//);
    for (const link of meta.links) expect(link.href).toMatch(/^https:\/\//);
  });

  test("description uses the bounded excerpt rather than the unbounded description", () => {
    expect(find((tag) => tag.name === "description")?.content).toBe(
      "An Indigenous-owned cosmetics company built on giving back.",
    );
  });

  test("an episode with no guest still emits a complete, well-formed tag set", () => {
    const bare = buildEpisodeMeta(
      episode({ guestName: null, coverArtwork: null, shareCard: null }),
    );
    expect(bare.meta.length).toBe(meta.meta.length);
    for (const tag of bare.meta) {
      for (const value of Object.values(tag)) {
        expect(value).not.toContain("null");
        expect(value).not.toContain("undefined");
      }
    }
  });
});

/* -------------------------------------------------------------- JSON-LD -- */

describe("buildEpisodeJsonLd", () => {
  const jsonLd = buildEpisodeJsonLd(episode());

  test("survives a JSON round trip — it is emitted into a script tag", () => {
    expect(JSON.parse(JSON.stringify(jsonLd))).toEqual(jsonLd);
  });

  test("declares the schema.org context and the PodcastEpisode type", () => {
    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("PodcastEpisode");
  });

  test("carries name, url and description", () => {
    expect(jsonLd.name).toBe("Building Cheekbone Beauty");
    expect(jsonLd.url).toBe(episodeUrl("jenn-harper-cheekbone-beauty"));
    expect(typeof jsonLd.description).toBe("string");
    expect((jsonLd.description as string).length).toBeGreaterThan(0);
  });

  test("datePublished is ISO-8601 and actually parses", () => {
    expect(typeof jsonLd.datePublished).toBe("string");
    expect(Number.isNaN(new Date(jsonLd.datePublished as string).getTime())).toBe(false);
    expect(jsonLd.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test("associatedMedia is a MediaObject pointing at the audio", () => {
    expect(jsonLd.associatedMedia).toEqual({
      "@type": "MediaObject",
      contentUrl: "https://mcdn.podbean.com/a.mp3",
    });
  });

  test("partOfSeries is a PodcastSeries with an absolute url", () => {
    const series = jsonLd.partOfSeries as Record<string, string>;
    expect(series["@type"]).toBe("PodcastSeries");
    expect(series.name).toBe(SERIES_NAME);
    expect(series.url).toMatch(/^https:\/\//);
  });

  test("episodeNumber is present when the episode has one", () => {
    expect(jsonLd.episodeNumber).toBe(5);
  });

  test("episodeNumber is OMITTED, not null, when the episode has none", () => {
    // A declared null is not absence to a consumer. The schema does not require
    // the field, so it is left out.
    const numberless = buildEpisodeJsonLd(episode({ episodeNumber: null }));
    expect(numberless).not.toHaveProperty("episodeNumber");
  });

  test("duration is omitted rather than asserting a zero-length episode", () => {
    const noDuration = buildEpisodeJsonLd(episode({ durationSeconds: 0 }));
    expect(noDuration).not.toHaveProperty("duration");
    expect(jsonLd.duration).toBe("PT3000S");
  });
});

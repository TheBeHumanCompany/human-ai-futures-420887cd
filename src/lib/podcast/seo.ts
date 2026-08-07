import { absoluteUrl, episodeUrl } from "../sanity/config";
import { ogImageUrl } from "../sanity/image";

/**
 * Everything a shared link renders: the meta tags, the structured data, and the
 * image a crawler shows.
 *
 * This module is the whole success condition of the project restated as code. A
 * guest posts `/podcast/<slug>` on LinkedIn; what that link renders — the title,
 * the description, the picture — is what the work is for. So the rules here are
 * absolute rather than best-effort: every URL is absolute because a crawler has
 * no page context to resolve a relative one against, and the share image always
 * resolves to *something*, because a card with a broken image is worse than a
 * card with a generic one.
 */

/** The series, named as the feed and the directory page already name it. */
export const SERIES_NAME = "The People-Driven CEO Podcast";

/** Guaranteed to exist so `og:image` can never fail to resolve. */
export const DEFAULT_SHARE_IMAGE_PATH = "/og-default.png";

/**
 * The fields SEO assembly needs — structural rather than the full episode, so
 * these functions can be exercised without inventing a whole document.
 *
 * `shareCard` is optional because it is generated rather than authored and does
 * not exist on the schema yet; the precedence chain below is written so its
 * absence is an ordinary case rather than a branch to add later.
 */
export interface SeoEpisode {
  slug: { current: string };
  title: string;
  excerpt: string;
  description?: string;
  episodeNumber: number | null;
  guestName: string | null;
  coverArtwork: string | null;
  shareCard?: string | null;
  audioUrl: string;
  publishedAt: string;
  durationSeconds?: number;
}

/**
 * The share image, by precedence: real artwork, then the generated card, then
 * the branded default.
 *
 * Ordered this way because each step is a weaker claim about the episode. Real
 * `coverArtwork` is what someone chose for it; a generated card is derived from
 * its title and guest; the default says only that this is the show. Falling the
 * other way would let a generic card outrank real artwork.
 *
 * Always returns an absolute URL. `ogImageUrl` already returns absolute CDN
 * URLs for Sanity assets; the default is a site-relative path and is made
 * absolute here rather than at each call site, because "the one that got
 * forgotten" is exactly how a relative `og:image` reaches production.
 */
export function shareImageUrl(episode: SeoEpisode): string {
  return (
    ogImageUrl(episode.coverArtwork) ??
    ogImageUrl(episode.shareCard ?? null) ??
    absoluteUrl(DEFAULT_SHARE_IMAGE_PATH)
  );
}

/**
 * The page title, and the reason it is a function rather than a template
 * literal at the call site.
 *
 * Two of the thirty-nine episodes have no parsed guest — their titles name a
 * company, not a person, and the parser declines to guess rather than render a
 * brand as a human being. A naive `` `${title} with ${guestName}` `` emits
 * "… with " on those two, which is the kind of defect that ships because nobody
 * tests the row that has less data.
 */
export function episodeTitle(episode: SeoEpisode): string {
  const base = episode.guestName ? `${episode.title} — ${episode.guestName}` : episode.title;
  return `${base} | ${SERIES_NAME}`;
}

/**
 * The `head()` payload for an episode: meta tags plus the canonical link.
 *
 * Returned in TanStack's own `{meta, links}` shape so a route can spread it
 * directly. The canonical is a `link`, not a `meta` — emitting it as a meta tag
 * is a common and completely silent mistake, since nothing renders differently
 * and no crawler honours it.
 */
export function buildEpisodeMeta(episode: SeoEpisode): {
  meta: Array<Record<string, string>>;
  links: Array<Record<string, string>>;
} {
  const url = episodeUrl(episode.slug.current);
  const title = episodeTitle(episode);
  const image = shareImageUrl(episode);

  return {
    meta: [
      { title },
      { name: "description", content: episode.excerpt },

      { property: "og:type", content: "article" },
      { property: "og:title", content: title },
      { property: "og:description", content: episode.excerpt },
      { property: "og:url", content: url },
      { property: "og:image", content: image },
      { property: "og:site_name", content: SERIES_NAME },

      // `summary_large_image` rather than `summary`: the card is a 1200×630
      // crop, and the small variant would letterbox it into a thumbnail.
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: episode.excerpt },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

/**
 * `PodcastEpisode` structured data.
 *
 * Built as a plain object and serialized by the caller, so the tests can assert
 * it field by field rather than regex a string. Optional fields are OMITTED
 * rather than emitted as null: `"episodeNumber": null` is not absence to a
 * consumer, it is a declared null, and the two are read differently.
 */
export function buildEpisodeJsonLd(episode: SeoEpisode): Record<string, unknown> {
  const url = episodeUrl(episode.slug.current);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: episode.title,
    url,
    datePublished: episode.publishedAt,
    description: episode.excerpt,
    associatedMedia: {
      "@type": "MediaObject",
      contentUrl: episode.audioUrl,
    },
    partOfSeries: {
      "@type": "PodcastSeries",
      name: SERIES_NAME,
      url: absoluteUrl("/podcast"),
    },
    image: shareImageUrl(episode),
  };

  if (episode.episodeNumber !== null) jsonLd.episodeNumber = episode.episodeNumber;

  // Only claim a duration when there is one. ISO-8601 durations are what
  // schema.org expects, and `PT0S` would assert a zero-length episode.
  if (episode.durationSeconds && episode.durationSeconds > 0) {
    jsonLd.duration = `PT${episode.durationSeconds}S`;
  }

  return jsonLd;
}

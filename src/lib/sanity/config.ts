/**
 * Sanity connection constants.
 *
 * None of these are secret. Public reads against a published perspective need
 * no credential at all (AC-11), which is why this file is imported freely by
 * the read path. A write token exists only for the seeding and publish scripts
 * and lives in the environment, never here.
 */

export const SANITY_PROJECT_ID = "5apyl3sk";
export const SANITY_DATASET = "production";

/**
 * Pinned deliberately. Sanity's API is versioned by date and an unpinned
 * version silently changes query behaviour under you — the opposite of what a
 * permanent-URL project wants.
 */
export const SANITY_API_VERSION = "2026-08-01";

/** CDN-backed host for reads. Cached at the edge and cheaper than the raw API. */
export const SANITY_QUERY_HOST = `https://${SANITY_PROJECT_ID}.apicdn.sanity.io`;

/**
 * The byte length above which `groq()` stops putting the query in the URL and
 * POSTs `{query, params}` instead. POST is still CDN-cacheable, so the only
 * thing that changes is the method.
 *
 * Sanity documents the GET ceiling at 11 kB and answers a longer URL with a
 * `414`. Crossing it is not hypothetical — a multi-term search plus a topic
 * filter plus pagination against a non-trivial projection gets there — and it
 * would fail in production, never in a 39-episode test, which is the exact
 * shape of defect this threshold exists to make impossible.
 *
 * 9,000 rather than something nearer the ceiling: the number that has to be
 * safe is not the one this module computes but the one that arrives upstream
 * after a CDN POP, a proxy and whatever percent-encoding they apply on the way.
 * ~2 kB of slack costs one thing (a POST instead of a GET on the longest
 * queries) and buys the guarantee that the measurement being taken here is
 * conservative with respect to the one that actually enforces the limit.
 */
export const GET_URL_LIMIT = 9_000;

/** Uncached host. Writes must not go through the CDN. */
export const SANITY_MUTATE_HOST = `https://${SANITY_PROJECT_ID}.api.sanity.io`;

export const SANITY_IMAGE_HOST = "https://cdn.sanity.io";

/**
 * The canonical origin. Confirmed 2026-08-05.
 *
 * Every permanent episode URL, every canonical tag, every Open Graph image and
 * every sitemap entry is absolute against this. It cannot change once guests
 * start sharing links — that is the whole premise — so it is a constant here
 * rather than an environment variable that could differ per deploy.
 */
export const SITE_ORIGIN = "https://thebehumancompany.ca";

/** Absolute URL for a path, for canonicals, OG tags and the sitemap. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).toString();
}

/** The permanent URL for an episode. The one string this project exists to keep stable. */
export function episodeUrl(slug: string): string {
  return absoluteUrl(`/podcast/${slug}`);
}

import type { EpisodeListItem } from "./episode";
import { isSanityUnreachable } from "./outage";

/** How many episodes the homepage features. */
export const FEATURED_COUNT = 3;

export interface FeaturedResult {
  featured: EpisodeListItem[];
  podcastUnavailable: boolean;
}

/**
 * The homepage's episode load — the only one in this app that absorbs an
 * outage instead of surfacing it.
 *
 * `/podcast` and `/podcast/$slug` throw, so a Sanity outage becomes an honest
 * 5xx there. Doing the same here would be self-inflicted: a thrown loader
 * errors the match and takes the ENTIRE front door to 500 because a podcast
 * section could not load, while the rest of the page is static and still true.
 *
 * **The catch is narrow, and that is the part worth protecting.** Only an
 * unreachable Sanity is absorbed; everything else re-throws. A catch-all would
 * satisfy the outage case perfectly while hiding every genuine bug in the
 * loader behind "the podcast is having a moment" — which is the failure mode
 * that survives longest, because it looks like graceful degradation.
 *
 * It lives here rather than inline in the route because the route's loader
 * calls a server function, which cannot run outside the server runtime and
 * therefore cannot be invoked by a test. Taking the fetcher as a parameter is
 * what makes the branch that matters — re-throw versus absorb — provable.
 */
export async function loadFeaturedEpisodes(
  fetchList: () => Promise<EpisodeListItem[]>,
  count: number = FEATURED_COUNT,
): Promise<FeaturedResult> {
  try {
    const episodes = await fetchList();
    return { featured: episodes.slice(0, count), podcastUnavailable: false };
  } catch (error) {
    if (!isSanityUnreachable(error)) throw error;
    return { featured: [], podcastUnavailable: true };
  }
}

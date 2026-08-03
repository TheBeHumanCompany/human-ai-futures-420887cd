import { createServerFn } from "@tanstack/react-start";

import { forListing, parseFeed } from "./parse";
import type { Episode, EpisodeListItem } from "./types";

/**
 * The show's public RSS feed.
 *
 * Public on purpose — PodBean gates its authenticated API behind the Network
 * and Business tiers, which this account is below. Everything the site renders
 * is present in the feed, so no token, secret or environment variable is
 * involved anywhere in this integration.
 */
export const PODBEAN_FEED_URL = "https://shanejjamesgroup.podbean.com/feed.xml";

const CACHE_TTL_MS = 15 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

interface CacheEntry {
  episodes: Episode[];
  expiresAt: number;
}

/**
 * Module-level cache. Vercel's Fluid Compute reuses function instances across
 * concurrent requests, so this survives between invocations often enough to
 * matter, and degrades to a per-request fetch when it doesn't.
 */
let cache: CacheEntry | null = null;

/**
 * The fetch currently in flight, if any.
 *
 * Held separately from `cache` so that concurrent callers arriving on a cold
 * instance — or on the first request after a TTL rollover — share one upstream
 * request. Caching only the resolved value would let N simultaneous requests
 * each pull and parse the full 230 kB feed, since the value guard cannot hit
 * until the first fetch has already finished.
 */
let inFlight: Promise<Episode[]> | null = null;

/** Test seam — resets memoised state between test cases. */
export function clearEpisodeCache(): void {
  cache = null;
  inFlight = null;
}

async function fetchAndParse(): Promise<Episode[]> {
  try {
    const response = await fetch(PODBEAN_FEED_URL, {
      headers: { accept: "application/rss+xml, application/xml, text/xml" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`[podbean] feed responded ${response.status}`);
      return cache?.episodes ?? [];
    }

    const episodes = parseFeed(await response.text());

    if (episodes.length === 0) {
      console.error("[podbean] feed parsed to zero episodes");
      return cache?.episodes ?? [];
    }

    cache = { episodes, expiresAt: Date.now() + CACHE_TTL_MS };
    return episodes;
  } catch (error) {
    console.error("[podbean] feed fetch failed", error);
    // Serve stale rather than nothing when we have it.
    return cache?.episodes ?? [];
  }
}

/**
 * Fetches and parses the feed, at most once concurrently.
 *
 * Never throws: a network failure, non-200 or unparseable body yields the last
 * good result if there is one, otherwise an empty list, so the route renders
 * its empty state instead of a 500. Failures are not cached, so the next
 * request retries.
 */
export async function loadEpisodes(): Promise<Episode[]> {
  if (cache && cache.expiresAt > Date.now()) return cache.episodes;
  if (inFlight) return inFlight;

  inFlight = fetchAndParse().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

/**
 * Server function used by route loaders. Keeps fetching and XML parsing on the
 * server; the browser only ever receives normalised JSON.
 */
export const getEpisodes = createServerFn({ method: "GET" }).handler(
  async (): Promise<EpisodeListItem[]> => forListing(await loadEpisodes()),
);

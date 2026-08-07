/**
 * Browse controls for the episode catalogue.
 *
 * Pure and dependency-free so the route file stays presentational and this
 * stays unit-testable. Note what is deliberately absent: there is no topic or
 * category filter because the feed carries no per-episode `itunes:keywords`,
 * `category` or season data — every item is `episodeType: full`. And there is
 * no date filter because all 39 episodes were bulk-imported across three days
 * in June–July 2025, so a month control would offer two options, one holding
 * 36 episodes.
 */

/** Buckets chosen from the real spread: 31–106 min, median 52. */
export type DurationBucket = "all" | "short" | "medium" | "long";
export type SortOrder = "newest" | "oldest";

export interface DurationOption {
  value: DurationBucket;
  label: string;
  /** Inclusive lower bound, exclusive upper bound, in minutes. */
  min: number;
  max: number;
}

export const DURATION_OPTIONS: readonly DurationOption[] = [
  { value: "all", label: "Any length", min: 0, max: Number.POSITIVE_INFINITY },
  { value: "short", label: "Under 45 min", min: 0, max: 45 },
  { value: "medium", label: "45–60 min", min: 45, max: 60 },
  { value: "long", label: "Over 60 min", min: 60, max: Number.POSITIVE_INFINITY },
] as const;

export const SORT_OPTIONS: readonly { value: SortOrder; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Start from episode 1" },
] as const;

/** The fields browse controls read. Structural so both Episode shapes fit. */
export interface Browsable {
  title: string;
  guest?: string;
  excerpt: string;
  durationSeconds: number;
  pubDate: string;
  episodeNumber: number | null;
}

export interface BrowseState {
  query: string;
  duration: DurationBucket;
  sort: SortOrder;
}

export const DEFAULT_BROWSE_STATE: BrowseState = {
  query: "",
  duration: "all",
  sort: "newest",
};

/**
 * Lowercases and strips accents and punctuation so "Joao" matches "João" and
 * "S1H's" matches "s1h". Deliberately not stemming — 39 episodes do not
 * justify a search index.
 */
function normalise(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesQuery(episode: Browsable, query: string): boolean {
  const terms = normalise(query).split(" ").filter(Boolean);
  if (terms.length === 0) return true;

  const haystack = normalise(
    [
      episode.title,
      episode.guest ?? "",
      episode.excerpt,
      `episode ${episode.episodeNumber ?? ""}`,
    ].join(" "),
  );

  // AND across terms: "vancouver skincare" should narrow, not widen.
  return terms.every((term) => haystack.includes(term));
}

function matchesDuration(episode: Browsable, bucket: DurationBucket): boolean {
  const option = DURATION_OPTIONS.find((o) => o.value === bucket);
  if (!option || option.value === "all") return true;
  const minutes = episode.durationSeconds / 60;
  return minutes >= option.min && minutes < option.max;
}

/** Applies the browse state. Never mutates the input array. */
export function browseEpisodes<T extends Browsable>(
  episodes: readonly T[],
  state: BrowseState,
): T[] {
  const filtered = episodes.filter(
    (episode) => matchesQuery(episode, state.query) && matchesDuration(episode, state.duration),
  );

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime(),
  );

  return state.sort === "oldest" ? sorted.reverse() : sorted;
}

/** Live counts per duration bucket, so options can show what they'd yield. */
export function durationCounts<T extends Browsable>(
  episodes: readonly T[],
  query = "",
): Record<DurationBucket, number> {
  const searched = episodes.filter((episode) => matchesQuery(episode, query));
  return {
    all: searched.length,
    short: searched.filter((e) => matchesDuration(e, "short")).length,
    medium: searched.filter((e) => matchesDuration(e, "medium")).length,
    long: searched.filter((e) => matchesDuration(e, "long")).length,
  };
}

export function isDefaultBrowseState(state: BrowseState): boolean {
  return (
    state.query.trim() === "" &&
    state.duration === DEFAULT_BROWSE_STATE.duration &&
    state.sort === DEFAULT_BROWSE_STATE.sort
  );
}

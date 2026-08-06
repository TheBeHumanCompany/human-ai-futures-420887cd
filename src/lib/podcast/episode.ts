import type { Browsable } from "../podbean/filter";

/**
 * A topic as the read path receives it — the reference dereferenced down to the
 * two fields anything renders.
 */
export interface SanityTopic {
  _id: string;
  name: string;
}

/**
 * One episode, in the shape `EPISODE_LIST_PROJECTION` returns.
 *
 * Every field that Sanity can legitimately answer with `null` is typed
 * `| null` rather than optional, because that is what GROQ actually returns for
 * an unpopulated field — an absent key and a null key are different things to
 * read, and pretending the field is optional invites `?.` where the real
 * hazard is a present-but-null value.
 *
 * `guestName` being nullable is not defensive typing. It is 37/39 on the live
 * dataset: episodes 1 and 6 name a company rather than a person in their title,
 * and the guest parser declines to guess rather than rendering a brand as a
 * human being. Every surface that prints a guest has to handle its absence.
 */
export interface EpisodeListItem {
  slug: { current: string };
  episodeNumber: number | null;
  title: string;
  excerpt: string;
  topics: SanityTopic[] | null;
  guestName: string | null;
  guestPhoto: string | null;
  coverArtwork: string | null;
  audioUrl: string;
  durationSeconds: number;
  publishedAt: string;
}

/** The detail page's shape — the list fields plus everything only one page needs. */
export interface SanityEpisode extends EpisodeListItem {
  _id: string;
  guid: string;
  description: string;
  guestBio: string | null;
  podbeanUrl: string;
  searchText: string;
  slugFrozenAt: string | null;
}

/**
 * Adapts a Sanity episode into the shape `src/lib/podbean/filter.ts` already
 * browses.
 *
 * This function is the entire reason the directory's search, duration filter
 * and sort keep working against Sanity data without being rewritten. The
 * alternative — reimplementing filtering as GROQ — would have to re-establish
 * accent-insensitivity, substring matching and the duration bucket boundaries
 * against a different engine, and re-prove them against the same corpus. Here
 * `browseEpisodes` and `durationCounts` are imported unchanged and stay covered
 * by their existing tests.
 *
 * Only two fields actually differ, and both are renames rather than
 * transformations: `guestName` → `guest` and `publishedAt` → `pubDate`.
 *
 * `guest` is `string | undefined`, not `string | null`: `Browsable` declares it
 * optional, and `matchesQuery` folds it via `episode.guest ?? ""`. Passing a
 * literal `null` through would put the string "null" nowhere, but it would also
 * mean the two modules disagree about how absence is spelled — so absence is
 * normalised here, at the boundary, which is what a boundary is for.
 *
 * `episode.test.ts` proves this behaviourally: the output is fed through the
 * real, unmodified `browseEpisodes`/`durationCounts` and the resulting values
 * are asserted. A `satisfies Browsable` would be checked by nothing, since
 * `tsc --noEmit` excludes test files.
 */
export function toBrowsable<T extends EpisodeListItem>(episode: T): Browsable & { source: T } {
  return {
    title: episode.title,
    guest: episode.guestName ?? undefined,
    excerpt: episode.excerpt,
    durationSeconds: episode.durationSeconds,
    pubDate: episode.publishedAt,
    episodeNumber: episode.episodeNumber,
    // The original travels with the adapted view so a caller that filters can
    // still render slug, artwork and audio without a second lookup keyed on
    // title — which would be ambiguous the first time two episodes share one.
    source: episode,
  };
}

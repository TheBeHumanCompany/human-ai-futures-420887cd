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
  coverArtwork: string | null;
  /**
   * The generated branded card, and the field the directory actually renders.
   *
   * `EPISODE_LIST_PROJECTION` has always returned this, but the interface did
   * not declare it — `shareImageUrl` reads it through `SeoEpisode`, where it is
   * optional, so the gap typechecked and stayed invisible. Declared here because
   * the image-led directory renders from it: `coverArtwork` is set on one of the
   * thirty-nine episodes, so for the rest this is what resolves.
   */
  shareCard: string | null;
  audioUrl: string;
  durationSeconds: number;
  publishedAt: string;
}

/**
 * The detail page's shape — the list fields plus everything only one page needs.
 *
 * **`guestPhoto` lives here and not on `EpisodeListItem`.** It is projected by
 * `EPISODE_DETAIL_PROJECTION` and not by the list projection, so on a list row
 * it was always `undefined` while the type promised `string | null`. Nothing
 * caught it: the detail page reads it legitimately, and the directory's test
 * fixtures are cast `as EpisodeListItem`, which suppresses exactly this class of
 * mismatch. Declaring it here means reaching for a guest photo in a list card is
 * now a compile error rather than a blank image.
 */
/** An external link belonging to the guest, hand-entered and verified. */
export interface GuestLink {
  label: string;
  url: string;
}

export interface SanityEpisode extends EpisodeListItem {
  _id: string;
  guid: string;
  description: string;
  guestBio: string | null;
  guestPhoto: string | null;
  /** How the guest is introduced, e.g. "Founder, Cheekbone Beauty". */
  guestRole: string | null;
  /**
   * The guest's own links.
   *
   * Never inferred, and deliberately nullable rather than defaulted to an empty
   * array: absent means nobody has supplied them, which is a different state
   * from "this guest has none". A guessed profile URL points at a different real
   * person with the same name, so the page renders nothing here until a human
   * has entered and checked one.
   */
  guestLinks: GuestLink[] | null;
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

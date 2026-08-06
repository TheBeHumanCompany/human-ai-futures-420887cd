/**
 * The pinned alias → GROQ source map for the episode read path.
 *
 * Decision H: a hand-written projection can silently swap two same-typed
 * fields — `"podbeanUrl": audioUrl` typechecks, passes every existing test,
 * and breaks the site (the wrong URL becomes the CTA link). The fix is to
 * stop hand-writing projections. `EPISODE_PROJECTION` is the one place the
 * alias↔source pairing is decided; every query builds its fragment by
 * running it through `project()` instead of typing the object literal out
 * again. A swap here is a one-line diff in a file whose only job is this
 * mapping, and `projection-map.test.ts` pins the exact pairs so a swap goes
 * red immediately.
 *
 * Two fields intentionally keep their whole source object rather than a leaf
 * value, because the read path needs more than the leaf:
 * - `slug` projects the whole `slug` object (source `"slug"`, not
 *   `"slug.current"`) — callers read `.current` off it themselves.
 * - `topics` dereferences each reference and takes only `_id` and `name`.
 *   Topics are references (studio/schemaTypes/episode.ts), so the source is
 *   a sub-projection rather than a leaf path; `_id` is enough to key on and
 *   `name` is the only rendered field, so nothing wider is pulled through.
 *
 * `guestPhoto` and `coverArtwork` project straight to `asset._ref` — the read
 * path wants the raw ref string (see `imageRef`/`imageUrl` in `./image.ts`),
 * not the whole image field.
 *
 * `podbeanUrl` and `audioUrl` map to their own distinct source fields. This
 * exact non-swap is the point of Decision H — see the dedicated test.
 */
export const EPISODE_PROJECTION = {
  _id: "_id",
  guid: "guid",
  slug: "slug",
  episodeNumber: "episodeNumber",
  title: "title",
  description: "description",
  excerpt: "excerpt",
  topics: "topics[]->{_id, name}",
  guestName: "guestName",
  guestBio: "guestBio",
  guestPhoto: "guestPhoto.asset._ref",
  coverArtwork: "coverArtwork.asset._ref",
  podbeanUrl: "podbeanUrl",
  audioUrl: "audioUrl",
  durationSeconds: "durationSeconds",
  publishedAt: "publishedAt",
  searchText: "searchText",
  slugFrozenAt: "slugFrozenAt",
} as const;

/**
 * The directory's projection — deliberately narrower than `EPISODE_PROJECTION`.
 *
 * The directory fetches every episode at once and filters in the browser
 * (Decision K), so its payload is the whole catalogue rather than one document.
 * That makes the field list a payload decision, not a convenience one: at 39
 * episodes the full projection minus the large text fields measures 906 B per
 * episode, and this list measures ~671 B.
 *
 * The exclusions are the point, and each one is a measured saving rather than a
 * guess:
 * - `description` (1046 B/ep) — by far the largest field, and the directory
 *   renders `excerpt` instead. This is also the structural guard the previous
 *   plan reserved against a future transcript field: a list query that projects
 *   explicit fields cannot silently start carrying 100 kB of prose.
 * - `searchText` (297 B/ep) — `browseEpisodes` builds its own haystack from
 *   title/guest/excerpt, so shipping the stored one would pay twice for the
 *   same search.
 * - `guestBio` — detail page only. Zero cost today because it is unpopulated on
 *   all 39, and unbounded once it is not.
 * - `podbeanUrl` (123 B/ep) — the Podbean CTA lives on the detail page; a row
 *   links to `/podcast/<slug>`.
 * - `_id`, `guid`, `slugFrozenAt` (199 B/ep combined, 22%) — none is rendered.
 *
 * `guid` leaving is the one exclusion with a blast radius outside this file: it
 * was the React `key` in both `podcast.tsx` and `index.tsx`. Those become
 * `slug.current`, which is unique and frozen by design. A `key={undefined}` is
 * a console warning rather than a test failure, so both call sites are pinned
 * by key-stability assertions rather than left to review.
 *
 * `audioUrl` is included and that is structural, not incidental: the homepage
 * already renders `<EpisodePlayer src={latest.audioUrl}>`, so dropping it would
 * break a surface that has nothing to do with the directory.
 *
 * `projection-map.test.ts` pins the exclusion set as a SET, so adding a field
 * here is a red test rather than a silent payload increase.
 */
export const EPISODE_LIST_PROJECTION = {
  slug: "slug",
  episodeNumber: "episodeNumber",
  title: "title",
  excerpt: "excerpt",
  topics: "topics[]->{_id, name}",
  guestName: "guestName",
  guestPhoto: "guestPhoto.asset._ref",
  coverArtwork: "coverArtwork.asset._ref",
  audioUrl: "audioUrl",
  durationSeconds: "durationSeconds",
  publishedAt: "publishedAt",
} as const;

/**
 * Builds a GROQ object-projection fragment from an alias → source map, e.g.
 * `project({title: "title", guestPhoto: "guestPhoto.asset._ref"})` produces
 * `{"title": title, "guestPhoto": guestPhoto.asset._ref}`.
 *
 * Only the alias (the left-hand side, the object key) is JSON-quoted. The
 * source (the right-hand side) is emitted verbatim as GROQ path syntax —
 * quoting it would turn `guestPhoto.asset._ref` into a string literal that
 * GROQ returns as text instead of a path it evaluates. This is exactly the
 * bug Decision H calls out as uncaught by pinning the map's literals alone,
 * which is why `projection-map.test.ts` runs the generated fragment through
 * `groq-js` rather than only snapshotting `EPISODE_PROJECTION`.
 */
export function project(map: Record<string, string>): string {
  const pairs = Object.entries(map).map(([alias, source]) => `${JSON.stringify(alias)}: ${source}`);
  return `{${pairs.join(", ")}}`;
}

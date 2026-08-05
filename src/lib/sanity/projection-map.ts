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

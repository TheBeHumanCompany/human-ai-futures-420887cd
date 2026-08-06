import type { EpisodeListItem } from "./episode";

/**
 * Related-episode selection.
 *
 * The obvious rule — topic overlap, falling back to nearest publication date —
 * is wrong for this catalogue, and the data is what says so. All 39 episodes
 * were bulk-uploaded: 33 of them inside five hours on one day. "Nearest
 * `publishedAt`" therefore ranks by upload minute, which is arbitrary from a
 * listener's point of view and dense with near-ties.
 *
 * So the fallback is **episode-number proximity**. It is populated on all 39,
 * strictly ordered, and it is the unit a listener actually thinks in: episode
 * 12 surfaces 11 and 13, which is explicable on the page and stable forever.
 *
 * Ranking, in order:
 *   1. shared topic count, descending
 *   2. `|episodeNumber − current|`, ascending
 *   3. `publishedAt`, descending — the final tie-break, and the only thing left
 *      for a future episode that arrives with no number
 *
 * **The fallback is launch-day behaviour, not an edge case.** `topics` is 0/39
 * today, so until enrichment lands every related block on the site is pure
 * number proximity. That is a property of this choice rather than a defect of
 * it — number-adjacency is a coherent thing to show a visitor; upload-minute
 * adjacency is noise.
 *
 * The 39/39 on `episodeNumber` is a live observation, not a structural
 * guarantee: the schema does not require the field. Hence the null handling
 * here, the test row for it, and the null-count line in `podcast:report` — so a
 * future null is caught by a command rather than by every related block quietly
 * degrading at once.
 */

const RELATED_COUNT = 3;

/** Topic ids an episode carries, as a set. Absent topics are an empty set, not a failure. */
function topicIds(episode: EpisodeListItem): Set<string> {
  return new Set((episode.topics ?? []).map((topic) => topic._id));
}

function sharedTopicCount(a: Set<string>, b: EpisodeListItem): number {
  let shared = 0;
  for (const topic of topicIds(b)) if (a.has(topic)) shared += 1;
  return shared;
}

/**
 * Distance in episode numbers, or `Infinity` when either side lacks one.
 *
 * `Infinity` rather than a large sentinel so a numberless episode sorts after
 * every numbered one without a magic constant that could one day be exceeded,
 * and still falls through to the date tie-break rather than being dropped.
 */
function numberDistance(current: EpisodeListItem, candidate: EpisodeListItem): number {
  if (current.episodeNumber === null || candidate.episodeNumber === null) return Infinity;
  return Math.abs(candidate.episodeNumber - current.episodeNumber);
}

/**
 * The three episodes most related to `current`, best first.
 *
 * Never returns `current` itself — compared by slug, which is the permanent
 * identity, rather than by object reference, because the current episode and
 * the candidate list come from two different queries and are not the same
 * object.
 */
export function selectRelatedEpisodes(
  current: EpisodeListItem,
  candidates: readonly EpisodeListItem[],
  limit: number = RELATED_COUNT,
): EpisodeListItem[] {
  const currentTopics = topicIds(current);

  const ranked = candidates
    .filter((candidate) => candidate.slug.current !== current.slug.current)
    .map((candidate) => ({
      candidate,
      shared: sharedTopicCount(currentTopics, candidate),
      distance: numberDistance(current, candidate),
      published: new Date(candidate.publishedAt).getTime(),
    }));

  ranked.sort((a, b) => {
    if (a.shared !== b.shared) return b.shared - a.shared;
    if (a.distance !== b.distance) return a.distance - b.distance;
    return b.published - a.published;
  });

  return ranked.slice(0, limit).map((entry) => entry.candidate);
}

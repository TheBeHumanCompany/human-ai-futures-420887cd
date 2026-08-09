import type { EpisodeListItem } from "./episode";

/**
 * Topic facets for the directory.
 *
 * The pills are derived from the topics actually attached to the catalogue
 * rather than hard-coded, so a facet can never advertise a filter that yields
 * nothing. Ordered by how many episodes carry them, capped so the row stays a
 * row rather than a wall.
 */

export interface TopicFacet {
  id: string;
  name: string;
  count: number;
}

export const ALL_TOPICS = "all";

export const TOPIC_FACET_LIMIT = 6;

export function topicFacets(
  episodes: readonly EpisodeListItem[],
  limit = TOPIC_FACET_LIMIT,
): TopicFacet[] {
  const counts = new Map<string, TopicFacet>();

  for (const episode of episodes) {
    for (const topic of episode.topics ?? []) {
      const existing = counts.get(topic._id);
      if (existing) existing.count += 1;
      else counts.set(topic._id, { id: topic._id, name: topic.name, count: 1 });
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** `all` passes everything through; any other id keeps episodes carrying it. */
export function filterByTopic<T extends { source: EpisodeListItem }>(
  rows: readonly T[],
  topicId: string,
): T[] {
  if (topicId === ALL_TOPICS) return [...rows];
  return rows.filter((row) => (row.source.topics ?? []).some((t) => t._id === topicId));
}

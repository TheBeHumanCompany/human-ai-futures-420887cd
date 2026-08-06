import type { SanityTopic } from "@/lib/podcast/episode";

interface EpisodeTopicsProps {
  topics: SanityTopic[] | null;
  className?: string;
}

/**
 * The topic tags, or nothing.
 *
 * Returns `null` for an absent OR empty list rather than rendering a heading
 * above no tags. `topics` is 0/39 today, so the empty case is the live one, and
 * an empty labelled row is the visual equivalent of a broken promise.
 *
 * Keyed by topic `_id`, which is deterministic (`topic-<slug>`) rather than
 * generated — the same property the publish path relies on to keep array keys
 * stable across republishes.
 */
export function EpisodeTopics({ topics, className }: EpisodeTopicsProps) {
  if (!topics || topics.length === 0) return null;

  return (
    <div className={className}>
      <h2 className="text-sm uppercase tracking-[0.2em] text-ink/60">Topics</h2>
      <ul className="mt-3 flex flex-wrap gap-2">
        {topics.map((topic) => (
          <li
            key={topic._id}
            className="rounded-full border border-ink/15 px-3 py-1 text-sm text-ink/80"
          >
            {topic.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
